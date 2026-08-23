/* =============================================================
   confiia.com.br — LIMITE DE TENTATIVAS

   Impede que alguém fique chutando senha, criando conta em massa
   ou pedindo mil e-mails de recuperação.

   POR QUE ISTO É OBRIGATÓRIO AQUI, E NÃO OPCIONAL:
   Nossa conferência de senha usa scrypt, que gasta 32 MB e um
   pedaço do único núcleo da VPS de propósito — é o que torna
   quebrar senha caro. Sem limite de tentativas, essa mesma
   proteção vira a arma: vinte tentativas ao mesmo tempo derrubam
   o site. A dupla scrypt + limite só funciona junta.

   COMO CONTA:
   Janela deslizante na memória do processo. Simples e suficiente
   para um servidor só, que é o caso hoje.

   QUANDO PRECISAR MUDAR:
   No dia em que rodar em mais de um servidor, isto precisa ir para
   o banco ou para um Redis — senão cada servidor conta a sua parte
   e o limite real vira o triplo. Está anotado no PLANO.md, Etapa 10.

   CUIDADO AO MEXER:
     - Contamos por IP E por alvo (o e-mail). Só por IP puniria a
       escola inteira atrás do mesmo endereço; só por e-mail
       deixaria um robô testar mil e-mails diferentes.
   ============================================================= */

import 'server-only';
import { headers } from 'next/headers';

type Regra = { tentativas: number; janelaSeg: number; bloqueioSeg: number };

/* Cada porta tem o seu limite. Mais apertado onde dói mais. */
export const REGRAS = {
  /* Chutar senha é o ataque mais comum. */
  entrar:        { tentativas: 5,  janelaSeg: 900,  bloqueioSeg: 900  },
  /* Criar conta em massa para gastar nossa cota de IA. */
  criar_conta:   { tentativas: 3,  janelaSeg: 3600, bloqueioSeg: 3600 },
  /* Pedir troca de senha manda e-mail: limite protege a caixa da
     pessoa de virar depósito de spam nosso. */
  esqueci_senha: { tentativas: 3,  janelaSeg: 3600, bloqueioSeg: 3600 },
  /* Reenviar confirmação. */
  reenviar:      { tentativas: 3,  janelaSeg: 1800, bloqueioSeg: 1800 },
} satisfies Record<string, Regra>;

export type Porta = keyof typeof REGRAS;

type Registro = { marcas: number[]; bloqueadoAte: number };

/* Vive no processo. Reinício zera — aceitável: quem estava sendo
   bloqueado também perdeu a conexão. */
const memoria = new Map<string, Registro>();

/* Faxina: sem isto o Map cresce para sempre e vira vazamento de
   memória num servidor que fica meses no ar. */
let ultimaFaxina = Date.now();
function faxina(agora: number) {
  if (agora - ultimaFaxina < 300_000) return;
  ultimaFaxina = agora;
  for (const [k, v] of memoria) {
    const velho = v.marcas.every((m) => agora - m > 3600_000);
    if (velho && v.bloqueadoAte < agora) memoria.delete(k);
  }
}

/** O IP de quem está chamando. Atrás do nginx vem no cabeçalho. */
export async function ipDeQuemChama(): Promise<string> {
  const h = await headers();
  return (
    h.get('x-forwarded-for')?.split(',')[0].trim() ||
    h.get('x-real-ip') ||
    'desconhecido'
  );
}

export type Resultado =
  | { pode: true; restam: number }
  | { pode: false; esperarSeg: number; recado: string };

/**
 * Confere e já registra a tentativa.
 *
 * @param porta  qual limite aplicar
 * @param alvo   e-mail, ou outro identificador de quem está sendo
 *               tentado. Junto com o IP forma a chave.
 */
export async function confereLimite(porta: Porta, alvo?: string): Promise<Resultado> {
  const regra = REGRAS[porta];
  const agora = Date.now();
  faxina(agora);

  const ip = await ipDeQuemChama();
  const chave = `${porta}:${ip}:${(alvo || '').toLowerCase()}`;

  const reg = memoria.get(chave) ?? { marcas: [], bloqueadoAte: 0 };

  if (reg.bloqueadoAte > agora) {
    const seg = Math.ceil((reg.bloqueadoAte - agora) / 1000);
    return { pode: false, esperarSeg: seg, recado: recadoDeEspera(seg) };
  }

  /* Descarta as tentativas fora da janela */
  reg.marcas = reg.marcas.filter((m) => agora - m < regra.janelaSeg * 1000);

  if (reg.marcas.length >= regra.tentativas) {
    reg.bloqueadoAte = agora + regra.bloqueioSeg * 1000;
    reg.marcas = [];
    memoria.set(chave, reg);
    const seg = regra.bloqueioSeg;
    return { pode: false, esperarSeg: seg, recado: recadoDeEspera(seg) };
  }

  reg.marcas.push(agora);
  memoria.set(chave, reg);
  return { pode: true, restam: regra.tentativas - reg.marcas.length };
}

/** Zera o contador. Chame quando a pessoa acertar: quem entrou não
 *  deve carregar o peso das tentativas erradas de antes. */
export async function zeraLimite(porta: Porta, alvo?: string) {
  const ip = await ipDeQuemChama();
  memoria.delete(`${porta}:${ip}:${(alvo || '').toLowerCase()}`);
}

function recadoDeEspera(seg: number): string {
  if (seg < 90) return `Muitas tentativas. Espere ${seg} segundos e tente de novo.`;
  const min = Math.ceil(seg / 60);
  if (min < 60) return `Muitas tentativas. Espere ${min} minutos e tente de novo.`;
  const h = Math.ceil(min / 60);
  return `Muitas tentativas. Espere ${h} hora${h > 1 ? 's' : ''} e tente de novo.`;
}
