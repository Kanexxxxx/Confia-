'use server';

/* =============================================================
   confiia.com.br — AÇÕES DE SEGUNDO FATOR

   Ligar o 2FA, digitar o código no login, gerar códigos de
   reserva e desligar.

   O CAMINHO DO LOGIN COM 2FA:

     senha certa  →  sessão pela metade (aguardando_2fa)
                     não dá acesso a nada, expira em 10 min
     código certo →  sessão de verdade

   POR QUE A SESSÃO PELA METADE EXISTE NO BANCO:
   Porque assim a tentativa fica registrada e é revogável. Se
   alguém acertar a sua senha e travar no código, isso aparece na
   sua lista de aparelhos — e é o aviso de que a sua senha vazou.

   CUIDADO AO MEXER:
     - Nunca devolva `totp_segredo` para o navegador depois de
       ativado. Ele só aparece uma vez, na tela de ligar.
   ============================================================= */

import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { contas } from '@/db/schema';
import {
  preparaSegredo, qrCodeDataUri, segredoLegivel, confereCodigo, RECADO_CODIGO,
  geraCodigosReserva, usaCodigoReserva, quantosReservaRestam,
  ligaDoisFatores, desligaDoisFatores,
} from '@/lib/dois-fatores';
import { sessaoAtual, sessaoPendente, completaSessao, tocaUltimoAcesso } from '@/lib/sessao';
import { conferaSenha } from '@/lib/senha';
import { confereLimite, zeraLimite, ipDeQuemChama } from '@/lib/limite';
import { registra } from '@/lib/auditoria';
import { exigeLogin } from '@/lib/guarda';
import { abreDoCofre } from '@/lib/cofre';

export type Estado2FA = { erro?: string; ok?: string } | null;

/* =============================================================
   1. PREPARAR — mostra o QR, ainda não liga nada
   ============================================================= */
export async function preparaDoisFatores() {
  const quem = await exigeLogin('/conta/seguranca');

  const segredo = preparaSegredo();
  const qr = await qrCodeDataUri(segredo, quem.email);

  /* O segredo volta para a tela porque é lá que a pessoa lê o QR.
     Ele ainda NÃO está gravado: só vira real quando ela acertar
     um código, provando que o aplicativo funciona. Assim ninguém
     se tranca para fora por ter fechado a página no meio. */
  return { segredo, legivel: segredoLegivel(segredo), qr };
}

/* =============================================================
   2. CONFIRMAR — a pessoa provou que o app funciona
   ============================================================= */
export async function confirmaDoisFatores(
  _anterior: Estado2FA,
  form: FormData,
): Promise<Estado2FA> {
  const quem = await exigeLogin('/conta/seguranca');

  const segredo = String(form.get('segredo') ?? '');
  const codigo = String(form.get('codigo') ?? '');
  if (!segredo) return { erro: 'A tela expirou. Comece de novo.' };

  const limite = await confereLimite('entrar', quem.id);
  if (!limite.pode) return { erro: limite.recado };

  const r = confereCodigo(segredo, quem.email, codigo, null);
  if (!r.ok) return { erro: RECADO_CODIGO[r.motivo] };

  await ligaDoisFatores(quem.id, segredo);
  await db
    .update(contas)
    .set({ totpUltimoContador: BigInt(r.contador) as unknown as number })
    .where(eq(contas.id, quem.id));

  await zeraLimite('entrar', quem.id);
  await registra({
    ator: quem.id, acao: 'conta.senha_trocada', alvoTipo: 'conta', alvoId: quem.id,
    depois: { doisFatores: 'ligado' }, ip: await ipDeQuemChama(),
  });

  redirect('/conta/seguranca?ligou=1');
}

/* =============================================================
   3. NO LOGIN — digitar o código
   ============================================================= */
export async function confirmaCodigoLogin(
  _anterior: Estado2FA,
  form: FormData,
): Promise<Estado2FA> {
  const pendente = await sessaoPendente();
  if (!pendente) redirect('/entrar');

  const digitado = String(form.get('codigo') ?? '').trim();
  const usarReserva = form.get('reserva') === '1';

  const limite = await confereLimite('entrar', pendente.contaId);
  if (!limite.pode) return { erro: limite.recado };

  const [conta] = await db
    .select({
      segredo: contas.totpSegredo,
      ultimo: contas.totpUltimoContador,
      email: contas.email,
    })
    .from(contas)
    .where(eq(contas.id, pendente.contaId))
    .limit(1);

  if (!conta?.segredo) redirect('/entrar');

  if (usarReserva) {
    const valeu = await usaCodigoReserva(pendente.contaId, digitado);
    if (!valeu) {
      await registra({
        acao: 'conta.entrar_negado', alvoTipo: 'conta', alvoId: pendente.contaId,
        depois: { motivo: 'codigo de reserva errado' }, ip: await ipDeQuemChama(),
      });
      return { erro: 'Código de reserva não confere, ou já foi usado.' };
    }
  } else {
    /* O segredo vem CIFRADO do banco. `abreDoCofre` também
       aceita o formato antigo, em texto puro, para as contas
       gravadas antes do cofre existir continuarem entrando
       enquanto a migração não rodou. Ver cofre.ts. */
    const r = confereCodigo(
      abreDoCofre(conta.segredo)!, conta.email, digitado,
      conta.ultimo === null ? null : Number(conta.ultimo),
    );
    if (!r.ok) {
      await registra({
        acao: 'conta.entrar_negado', alvoTipo: 'conta', alvoId: pendente.contaId,
        depois: { motivo: `2fa: ${r.motivo}` }, ip: await ipDeQuemChama(),
      });
      return { erro: RECADO_CODIGO[r.motivo] };
    }
    await db
      .update(contas)
      .set({ totpUltimoContador: BigInt(r.contador) as unknown as number })
      .where(eq(contas.id, pendente.contaId));
  }

  const virou = await completaSessao();
  if (!virou) redirect('/entrar');

  await zeraLimite('entrar', pendente.contaId);
  await tocaUltimoAcesso(pendente.contaId);
  await registra({
    ator: pendente.contaId, acao: 'conta.entrar', alvoTipo: 'conta',
    alvoId: pendente.contaId,
    depois: { via: usarReserva ? 'codigo de reserva' : '2fa' },
    ip: await ipDeQuemChama(),
  });

  redirect('/conta');
}

/* =============================================================
   4. CÓDIGOS DE RESERVA
   ============================================================= */
export async function novosCodigosReserva() {
  const quem = await exigeLogin('/conta/seguranca');
  const codigos = await geraCodigosReserva(quem.id);
  await registra({
    ator: quem.id, acao: 'conta.senha_trocada', alvoTipo: 'conta', alvoId: quem.id,
    depois: { codigosReserva: 'gerados' }, ip: await ipDeQuemChama(),
  });
  return codigos;
}

export async function contaCodigosReserva() {
  const quem = await sessaoAtual();
  if (!quem) return 0;
  return quantosReservaRestam(quem.id);
}

/* =============================================================
   5. DESLIGAR — exige a senha
   ============================================================= */
export async function desligaDoisFatoresAcao(
  _anterior: Estado2FA,
  form: FormData,
): Promise<Estado2FA> {
  const quem = await exigeLogin('/conta/seguranca');

  if (quem.ehAdmin) {
    return {
      erro:
        'Conta de administrador não pode desligar o segundo fator. ' +
        'Tire o acesso de admin primeiro.',
    };
  }

  /* Pede a senha de novo: desligar proteção é a hora em que mais
     importa saber que é a pessoa mesmo, e não alguém que sentou
     no computador aberto. */
  const senha = String(form.get('senha') ?? '');
  const [conta] = await db
    .select({ hash: contas.senhaHash })
    .from(contas)
    .where(eq(contas.id, quem.id))
    .limit(1);

  const { certa } = await conferaSenha(senha, conta?.hash ?? null);
  if (!certa) return { erro: 'Senha errada.' };

  await desligaDoisFatores(quem.id);
  await registra({
    ator: quem.id, acao: 'conta.senha_trocada', alvoTipo: 'conta', alvoId: quem.id,
    depois: { doisFatores: 'DESLIGADO' }, ip: await ipDeQuemChama(),
  });

  redirect('/conta/seguranca?desligou=1');
}
