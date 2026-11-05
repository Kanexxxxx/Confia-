/* =============================================================
   confiia.com.br — TOKENS DE E-MAIL

   Os links de "confirme seu e-mail" e "criar nova senha".

   TRÊS CUIDADOS QUE FAZEM DIFERENÇA:

   1. No banco fica só o hash, igual à sessão. Se o banco vazar,
      ninguém consegue trocar a senha de ninguém com o que viu.

   2. O token vale UMA VEZ. Ao ser usado, marcamos `usado_em`.
      Link de trocar senha que funciona duas vezes é link que
      funciona de novo depois que a pessoa reencaminhou o e-mail
      sem querer.

   3. Ao pedir um novo, os anteriores do mesmo tipo são invalidados.
      Senão a pessoa pede três vezes, usa o primeiro e-mail e os
      outros dois continuam valendo por horas.

   CUIDADO AO MEXER:
     - Prazo curto é proteção, não chateação. E-mail fica na caixa
       de entrada para sempre; token não pode.
   ============================================================= */

import 'server-only';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { db } from '@/db';
import { tokens } from '@/db/schema';

export type TipoToken = 'verificar_email' | 'trocar_senha' | 'trocar_email';

/* Quanto tempo cada um vale.
   Trocar senha é o mais perigoso: prazo mais curto. */
const HORAS: Record<TipoToken, number> = {
  verificar_email: 48,
  trocar_senha: 1,
  trocar_email: 2,
};

function hashDo(t: string) {
  return createHash('sha256').update(t).digest('hex');
}

/** Cria o token e devolve o segredo em claro — que só existe neste
 *  instante, para ir dentro do e-mail. Depois disso, nem nós temos. */
export async function criaToken(
  contaId: string,
  tipo: TipoToken,
  destino?: string,
): Promise<{ token: string; expiraEm: Date }> {
  /* Invalida os anteriores do mesmo tipo */
  await db
    .update(tokens)
    .set({ usadoEm: new Date() })
    .where(
      and(eq(tokens.contaId, contaId), eq(tokens.tipo, tipo), isNull(tokens.usadoEm)),
    );

  const token = randomBytes(32).toString('base64url');
  const expiraEm = new Date(Date.now() + HORAS[tipo] * 3600_000);

  await db.insert(tokens).values({
    contaId,
    tipo,
    tokenHash: hashDo(token),
    destino: destino ?? null,
    expiraEm,
  });

  return { token, expiraEm };
}

export type Conferencia =
  | { ok: true; contaId: string; destino: string | null }
  | { ok: false; motivo: 'invalido' | 'expirado' | 'usado' };

/** Confere e QUEIMA o token. Só devolve ok uma vez.
 *
 *  A queima acontece na mesma consulta que a leitura (UPDATE ...
 *  RETURNING). Isso evita a corrida em que dois cliques quase
 *  simultâneos no mesmo link passam os dois. */
export async function usaToken(token: string, tipo: TipoToken): Promise<Conferencia> {
  if (!token || token.length < 20) return { ok: false, motivo: 'invalido' };

  const agora = new Date();
  const alvo = hashDo(token);

  const queimados = await db
    .update(tokens)
    .set({ usadoEm: agora })
    .where(
      and(
        eq(tokens.tokenHash, alvo),
        eq(tokens.tipo, tipo),
        isNull(tokens.usadoEm),
        gt(tokens.expiraEm, agora),
      ),
    )
    .returning({ contaId: tokens.contaId, destino: tokens.destino });

  if (queimados.length === 1) {
    return { ok: true, contaId: queimados[0].contaId, destino: queimados[0].destino };
  }

  /* Não passou. Vale distinguir "expirou" de "não existe" para dar
     uma mensagem útil — sem revelar nada a quem está tentando
     adivinhar, porque quem adivinha nunca acerta o hash. */
  const [existe] = await db
    .select({ usadoEm: tokens.usadoEm, expiraEm: tokens.expiraEm })
    .from(tokens)
    .where(and(eq(tokens.tokenHash, alvo), eq(tokens.tipo, tipo)))
    .limit(1);

  if (!existe) return { ok: false, motivo: 'invalido' };
  if (existe.usadoEm) return { ok: false, motivo: 'usado' };
  return { ok: false, motivo: 'expirado' };
}

/** Comparação em tempo constante, para quando for preciso comparar
 *  dois segredos fora do banco (código de reserva do 2FA, na Etapa 5). */
export function iguaisEmTempoConstante(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  if (x.length !== y.length) return false;
  return timingSafeEqual(x, y);
}
