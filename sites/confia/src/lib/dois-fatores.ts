/* =============================================================
   confiia.com.br — SEGUNDO FATOR (2FA)

   O código de 6 dígitos que muda a cada 30 segundos, gerado pelo
   Google Authenticator no celular da pessoa.

   COMO FUNCIONA, EM UMA FRASE:
   Nós e o celular guardamos o mesmo segredo. Os dois calculam o
   mesmo código a partir da hora atual. Ninguém precisa mandar
   nada pela internet — por isso não existe SIM swap contra TOTP.

   ─────────────────────────────────────────────────────────────
   DOIS CUIDADOS QUE QUASE TODO MUNDO ESQUECE

   1. CÓDIGO USADO NÃO PODE VALER DE NOVO.
      O código dura 30 segundos. Se alguém o interceptar (olhando
      por cima do ombro, num print, num teclado gravado), pode
      usá-lo dentro da mesma janela. Por isso guardamos o último
      contador aceito e recusamos qualquer código igual ou
      anterior. Sem isso, o 2FA vira teatro contra quem está
      olhando a sua tela.

   2. RELÓGIO ATRASADO É O MOTIVO DE 90% DAS RECLAMAÇÕES.
      Se o celular estiver com a hora errada, o código não bate.
      Aceitamos uma janela de ±1 passo (30s para cada lado) — o
      suficiente para o atraso normal, e pouco o bastante para não
      ampliar a brecha. Quando falha, a mensagem fala do relógio,
      porque é quase sempre isso.
   ─────────────────────────────────────────────────────────────

   CUIDADO AO MEXER:
     - `totp_segredo` vale tanto quanto a senha. Nunca em log,
       nunca em tela de admin, nunca em auditoria.
     - Não aumente a janela para "resolver" reclamação. Janela
       larga é brecha larga; a correção é o relógio do celular.
   ============================================================= */

import 'server-only';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '@/db';
import { contas, codigosReserva } from '@/db/schema';
import { guardaNoCofre } from '@/lib/cofre';

const EMISSOR = 'confia?';

/* ±1 passo de 30 segundos. Não aumente. */
const JANELA = 1;

function monta(segredo: string, email: string) {
  return new OTPAuth.TOTP({
    issuer: EMISSOR,
    label: email,
    algorithm: 'SHA1',   // o que o Google Authenticator entende
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(segredo),
  });
}

/* -------------------------------------------------------------
   LIGAR O 2FA
   ------------------------------------------------------------- */

/** Gera um segredo novo. Ainda NÃO liga nada: só depois de a
 *  pessoa acertar um código é que ativamos — assim ninguém se
 *  tranca para fora por ter fechado a tela no meio. */
export function preparaSegredo(): string {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

/** O QR que o Google Authenticator lê. Devolve um data: URI, para
 *  a imagem não precisar sair do servidor nem virar arquivo. */
export async function qrCodeDataUri(segredo: string, email: string): Promise<string> {
  const uri = monta(segredo, email).toString();
  return QRCode.toDataURL(uri, {
    margin: 1,
    width: 260,
    color: { dark: '#0b2443', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  });
}

/** O segredo em blocos de 4, para quem digita à mão quando a
 *  câmera não funciona. */
export function segredoLegivel(segredo: string): string {
  return segredo.replace(/(.{4})/g, '$1 ').trim();
}

/* -------------------------------------------------------------
   CONFERIR O CÓDIGO
   ------------------------------------------------------------- */
export type Conferido =
  | { ok: true; contador: number }
  | { ok: false; motivo: 'formato' | 'errado' | 'repetido' };

/**
 * @param ultimoContador  o último passo já aceito para esta conta.
 *                        Serve para recusar reuso do mesmo código.
 */
export function confereCodigo(
  segredo: string,
  email: string,
  digitado: string,
  ultimoContador: number | null,
): Conferido {
  const limpo = (digitado || '').replace(/\D/g, '');
  if (limpo.length !== 6) return { ok: false, motivo: 'formato' };

  const totp = monta(segredo, email);
  const delta = totp.validate({ token: limpo, window: JANELA });

  if (delta === null) return { ok: false, motivo: 'errado' };

  const contador = Math.floor(Date.now() / 30_000) + delta;

  /* Já usamos este código (ou um mais antigo). Recusa. */
  if (ultimoContador !== null && contador <= ultimoContador) {
    return { ok: false, motivo: 'repetido' };
  }

  return { ok: true, contador };
}

export const RECADO_CODIGO = {
  formato: 'O código tem 6 números. Confira no aplicativo.',
  errado:
    'Código não confere. O motivo mais comum é o relógio do celular estar atrasado — ' +
    'ligue a hora automática nos ajustes e tente de novo.',
  repetido: 'Este código já foi usado. Espere o aplicativo mostrar o próximo.',
} as const;

/* -------------------------------------------------------------
   CÓDIGOS DE RESERVA

   Dez códigos de uso único, para quando o celular sumir. São a
   alternativa ao e-mail — e mais forte que ele, porque não
   dependem de uma caixa de entrada que também pode ter sido
   invadida.
   ------------------------------------------------------------- */

/* Mesmo alfabeto sem 0 O 1 l I dos códigos de URL: estes vão ser
   copiados à mão, guardados numa gaveta, lidos ao telefone. */
const ALFABETO = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function umCodigo(): string {
  const b = randomBytes(10);
  let s = '';
  for (let i = 0; i < 10; i++) s += ALFABETO[b[i] % ALFABETO.length];
  return `${s.slice(0, 5)}-${s.slice(5)}`;  // ABCDE-FGHJK
}

function hashDo(c: string) {
  return createHash('sha256').update(c.toUpperCase().replace(/[^A-Z0-9]/g, '')).digest('hex');
}

/** Gera dez códigos novos e APAGA os anteriores.
 *  Devolve os códigos em claro — que só existem neste instante,
 *  para aparecer uma vez na tela. Depois disso nem nós temos. */
export async function geraCodigosReserva(contaId: string): Promise<string[]> {
  await db.delete(codigosReserva).where(eq(codigosReserva.contaId, contaId));

  const codigos = Array.from({ length: 10 }, umCodigo);
  await db.insert(codigosReserva).values(
    codigos.map((c) => ({ contaId, codigoHash: hashDo(c) })),
  );
  return codigos;
}

/** Confere e QUEIMA o código. Só vale uma vez. */
export async function usaCodigoReserva(
  contaId: string,
  digitado: string,
): Promise<boolean> {
  const alvo = hashDo(digitado);

  /* Queima na mesma consulta que lê: evita a corrida em que dois
     envios quase simultâneos passam os dois. */
  const queimados = await db
    .update(codigosReserva)
    .set({ usadoEm: new Date() })
    .where(
      and(
        eq(codigosReserva.contaId, contaId),
        eq(codigosReserva.codigoHash, alvo),
        isNull(codigosReserva.usadoEm),
      ),
    )
    .returning({ id: codigosReserva.id });

  return queimados.length === 1;
}

/** Quantos ainda restam, para avisar quando estiver acabando. */
export async function quantosReservaRestam(contaId: string): Promise<number> {
  const linhas = await db
    .select({ id: codigosReserva.id })
    .from(codigosReserva)
    .where(and(eq(codigosReserva.contaId, contaId), isNull(codigosReserva.usadoEm)));
  return linhas.length;
}

/* -------------------------------------------------------------
   LIGAR E DESLIGAR
   ------------------------------------------------------------- */

/** Ativa depois que a pessoa provou que o app funciona.
 *
 *  O SEGREDO VAI CIFRADO PARA O BANCO. Em texto puro, uma cópia
 *  do banco — backup exposto, injeção de SQL — permitiria gerar o
 *  código de 6 dígitos de qualquer conta, e o segundo fator
 *  deixaria de existir no exato momento em que mais importa.
 *
 *  A chave mora no ambiente, não no banco: ver `cofre.ts`. */
export async function ligaDoisFatores(contaId: string, segredo: string) {
  await db
    .update(contas)
    .set({ totpSegredo: guardaNoCofre(segredo), totpAtivadoEm: new Date() })
    .where(eq(contas.id, contaId));
}

/** Desliga. Admin não consegue — o gatilho `tg_admin_precisa_2fa`
 *  no banco recusa admin sem segundo fator. */
export async function desligaDoisFatores(contaId: string) {
  await db.delete(codigosReserva).where(eq(codigosReserva.contaId, contaId));
  await db
    .update(contas)
    .set({ totpSegredo: null, totpAtivadoEm: null })
    .where(eq(contas.id, contaId));
}

/** Comparação em tempo constante, para segredos fora do banco. */
export function iguaisEmTempoConstante(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  if (x.length !== y.length) return false;
  return timingSafeEqual(x, y);
}
