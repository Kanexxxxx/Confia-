/* =============================================================
   confiia.com.br — o cofre: cifra o que não pode vazar junto
   com o banco

   ─────────────────────────────────────────────────────────────
   O PROBLEMA QUE ISTO RESOLVE

   O segredo do segundo fator (TOTP) estava guardado em TEXTO
   PURO. Quem conseguisse uma cópia do banco — um backup
   esquecido, uma injeção de SQL, um disco descartado — poderia
   gerar o código de 6 dígitos de qualquer conta.

   Ou seja: o segundo fator existia, mas o vazamento do banco o
   anulava por completo. Senha com hash não ajuda em nada se o
   segundo fator cai junto.

   ─────────────────────────────────────────────────────────────
   POR QUE A CHAVE FICA FORA DO BANCO

   Chave guardada no mesmo lugar que o dado cifrado é o mesmo que
   deixar a chave debaixo do tapete. `COFRE_CHAVE` vem do
   ambiente: quem leva o banco não leva a chave.

   Isso desloca o problema em vez de eliminá-lo — quem invadir o
   SERVIDOR pega os dois. Mas os dois casos mais prováveis de
   vazamento de banco (backup exposto e SQL injection) passam a
   render nada, e essa é a diferença que importa.

   ─────────────────────────────────────────────────────────────
   POR QUE AES-256-GCM

   GCM é cifra AUTENTICADA: além de esconder, ela detecta
   adulteração. Sem isso, alguém com acesso de escrita ao banco
   poderia trocar bytes do segredo cifrado e a decifragem
   devolveria lixo silenciosamente — aqui ela FALHA, alto e claro.

   O `iv` (número usado uma vez) é sorteado por gravação e vai
   junto, em claro. Ele não é segredo; o que ele não pode é se
   repetir com a mesma chave, e 12 bytes aleatórios garantem isso
   na prática.

   ─────────────────────────────────────────────────────────────
   FORMATO — AUTODESCRITIVO, COMO O DA SENHA

       v1$<iv em base64>$<etiqueta em base64>$<cifrado em base64>

   O `v1` na frente permite trocar o algoritmo um dia sem quebrar
   o que já está gravado: o decifrador olha a versão e escolhe.

   ─────────────────────────────────────────────────────────────
   CUIDADO AO MEXER:
     - PERDER A CHAVE É PERDER O DADO. Não existe recuperação.
       Guarde `COFRE_CHAVE` junto com as outras credenciais do
       servidor, e num lugar a mais.
     - Trocar a chave exige decifrar tudo com a antiga e recifrar
       com a nova. Não é uma linha no .env.
     - NÃO use isto para senha. Senha não se decifra — se
       confere. Para senha, `senha.ts` com scrypt.
   ============================================================= */

import {
  createCipheriv, createDecipheriv, randomBytes, createHash,
} from 'node:crypto';

const VERSAO = 'v1';
const ALGORITMO = 'aes-256-gcm';
const TAMANHO_IV = 12;   // 96 bits, o recomendado para GCM

/* A chave chega como texto no ambiente e precisa virar 32 bytes.
   O sha256 faz isso de forma determinística, aceitando qualquer
   comprimento de entrada — inclusive uma frase. */
function chave(): Buffer {
  const bruta = process.env.COFRE_CHAVE;

  if (!bruta || bruta.length < 32) {
    /* Falhar aqui é melhor do que gravar em texto puro sem
       ninguém perceber. A mensagem diz o que fazer. */
    throw new Error(
      'COFRE_CHAVE ausente ou curta demais (mínimo 32 caracteres). ' +
      'Gere uma com: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"',
    );
  }
  return createHash('sha256').update(bruta).digest();
}

/** Cifra um texto. Devolve `v1$iv$etiqueta$cifrado`. */
export function guardaNoCofre(claro: string): string {
  const iv = randomBytes(TAMANHO_IV);
  const cifra = createCipheriv(ALGORITMO, chave(), iv);

  const cifrado = Buffer.concat([cifra.update(claro, 'utf8'), cifra.final()]);
  const etiqueta = cifra.getAuthTag();

  return [
    VERSAO,
    iv.toString('base64'),
    etiqueta.toString('base64'),
    cifrado.toString('base64'),
  ].join('$');
}

/**
 * Decifra o que `guardaNoCofre` gravou.
 *
 * TOLERA TEXTO ANTIGO NÃO CIFRADO de propósito: no banco existem
 * segredos gravados antes deste arquivo existir. Devolvê-los como
 * estão mantém essas contas funcionando enquanto a migração roda.
 *
 * Isso é uma ponte, não uma decisão permanente. Quando a migração
 * `scripts/cifra-segredos.mjs` tiver rodado em produção, esta
 * tolerância pode sair — e aí valor sem `v1$` vira erro.
 */
export function abreDoCofre(guardado: string | null): string | null {
  if (!guardado) return null;

  if (!guardado.startsWith(VERSAO + '$')) {
    return guardado;
  }

  const partes = guardado.split('$');
  if (partes.length !== 4) {
    throw new Error('Valor do cofre malformado.');
  }

  const [, iv, etiqueta, cifrado] = partes;
  const decifra = createDecipheriv(ALGORITMO, chave(), Buffer.from(iv, 'base64'));
  decifra.setAuthTag(Buffer.from(etiqueta, 'base64'));

  /* Se alguém adulterou os bytes, `final()` lança aqui. É o
     comportamento certo: melhor falhar do que devolver lixo. */
  return Buffer.concat([
    decifra.update(Buffer.from(cifrado, 'base64')),
    decifra.final(),
  ]).toString('utf8');
}

/** Já está cifrado? Usado pela migração para não cifrar duas vezes. */
export function estaNoCofre(valor: string | null): boolean {
  return Boolean(valor && valor.startsWith(VERSAO + '$'));
}
