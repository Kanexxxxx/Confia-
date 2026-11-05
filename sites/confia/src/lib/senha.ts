/* =============================================================
   confiia.com.br — SENHA
   Guardar senha é a coisa mais fácil de errar num sistema. Este
   arquivo existe para que exista UM jeito de fazer isso aqui.

   POR QUE scrypt E NÃO bcrypt/argon2:
   scrypt vem dentro do Node (`node:crypto`). Sem dependência,
   sem compilar biblioteca nativa, sem quebrar quando você
   desenvolve no Windows e publica no Linux. E é memory-hard:
   quebrar em placa de vídeo fica caro, que é o ponto.

   O FORMATO GUARDADO DIZ COMO FOI FEITO:
       scrypt$16384$8$1$<sal em base64>$<hash em base64>
   Isso permite aumentar o custo no futuro sem invalidar as
   senhas antigas: conferimos com os parâmetros que estão
   gravados na linha, e regravamos com os novos no próximo login.

   CUIDADO AO MEXER:
     - NUNCA compare hash com === . Use `timingSafeEqual`, que
       demora sempre o mesmo tanto. Comparação normal vaza a
       senha aos poucos pelo tempo de resposta.
     - Aumentar CUSTO_N sem rate limit no login vira porta de
       negação de serviço: cada tentativa come memória do servidor.
   ============================================================= */

import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb) as (
  senha: string | Buffer,
  sal: string | Buffer,
  tamanho: number,
  opcoes: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

/* Custo. Memória usada = 128 * N * r bytes.
   A OWASP recomenda N=65536 (64 MB). Aqui está 32768 (32 MB) por
   um motivo concreto: a VPS tem 1 vCPU. Com 64 MB cada conferência
   ocupa o único núcleo por tempo demais, e vinte tentativas de
   login ao mesmo tempo derrubam o site sozinhas — vira porta de
   negação de serviço em vez de proteção.
   32 MB continua muito acima de bcrypt custo 12, e a diferença é
   compensada pelo bloqueio por tentativas no login.
   Se um dia a VPS crescer para 2+ núcleos, suba para 65536: as
   senhas antigas continuam válidas, porque o custo fica gravado
   dentro do próprio hash e é regravado no login seguinte. */
const CUSTO_N = 32_768;
const CUSTO_R = 8;
const CUSTO_P = 1;
const TAMANHO_HASH = 64;
const TAMANHO_SAL = 16;

/* maxmem precisa ser MAIOR que 128*N*r, senão o Node recusa. */
function maxmem(N: number, r: number) {
  return 128 * N * r * 2;
}

/** Comprimento mínimo. Não exigimos símbolo nem número: senha
 *  longa vale mais que senha complicada, e regra chata faz a
 *  pessoa escolher "Senha@123" e anotar num papel. */
export const TAMANHO_MINIMO_SENHA = 10;

/** Senhas que não podem passar por mais longas que sejam.
 *  Lista curta de propósito — a defesa real é o tamanho mínimo
 *  mais o bloqueio por tentativas. */
const OBVIAS = new Set([
  'senha123456', '1234567890', 'confia12345', '12345678910',
  'qwertyuiop', 'senhasenha', 'abcd1234567',
]);

export type ProblemaSenha = 'curta' | 'obvia' | 'igual_ao_email';

/** Confere se a senha pode ser aceita. Devolve null quando está boa. */
export function criticaSenha(senha: string, email?: string): ProblemaSenha | null {
  if (senha.length < TAMANHO_MINIMO_SENHA) return 'curta';
  if (OBVIAS.has(senha.toLowerCase())) return 'obvia';
  if (email && senha.toLowerCase() === email.toLowerCase()) return 'igual_ao_email';
  return null;
}

export const RECADO_SENHA: Record<ProblemaSenha, string> = {
  curta: `Use pelo menos ${TAMANHO_MINIMO_SENHA} caracteres. Três palavras que só você junta funcionam melhor que símbolo no meio.`,
  obvia: 'Essa senha é das primeiras que qualquer robô tenta. Escolha outra.',
  igual_ao_email: 'A senha não pode ser o seu e-mail.',
};

/** Transforma a senha no que vai para o banco. */
export async function guardaSenha(senha: string): Promise<string> {
  const sal = randomBytes(TAMANHO_SAL);
  const hash = await scrypt(senha.normalize('NFKC'), sal, TAMANHO_HASH, {
    N: CUSTO_N, r: CUSTO_R, p: CUSTO_P, maxmem: maxmem(CUSTO_N, CUSTO_R),
  });
  return ['scrypt', CUSTO_N, CUSTO_R, CUSTO_P, sal.toString('base64'), hash.toString('base64')].join('$');
}

/** Confere a senha contra o que está guardado.
 *  `precisaRegravar` avisa que a linha foi feita com custo antigo:
 *  aproveite que você tem a senha em mãos e regrave com o custo novo. */
export async function conferaSenha(
  senha: string,
  guardado: string | null,
): Promise<{ certa: boolean; precisaRegravar: boolean }> {
  /* Conta sem senha (criada por login social ou ainda sem definir).
     Mesmo assim gastamos tempo, para não revelar pela demora que
     esta conta é diferente das outras. */
  if (!guardado) {
    await scrypt('descarte', randomBytes(TAMANHO_SAL), TAMANHO_HASH, {
      N: CUSTO_N, r: CUSTO_R, p: CUSTO_P, maxmem: maxmem(CUSTO_N, CUSTO_R),
    });
    return { certa: false, precisaRegravar: false };
  }

  const partes = guardado.split('$');
  if (partes.length !== 6 || partes[0] !== 'scrypt') {
    return { certa: false, precisaRegravar: false };
  }

  const N = Number(partes[1]);
  const r = Number(partes[2]);
  const p = Number(partes[3]);
  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) {
    return { certa: false, precisaRegravar: false };
  }

  const sal = Buffer.from(partes[4], 'base64');
  const esperado = Buffer.from(partes[5], 'base64');

  const obtido = await scrypt(senha.normalize('NFKC'), sal, esperado.length, {
    N, r, p, maxmem: maxmem(N, r),
  });

  /* Tempo constante. Comparar com === entregaria a senha byte a byte
     para quem medisse o tempo de resposta. */
  const certa = obtido.length === esperado.length && timingSafeEqual(obtido, esperado);

  return {
    certa,
    precisaRegravar: certa && (N !== CUSTO_N || r !== CUSTO_R || p !== CUSTO_P),
  };
}
