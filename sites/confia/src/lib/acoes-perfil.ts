'use server';

/* =============================================================
   confiia.com.br — AÇÕES DO PERFIL

   Trocar apelido, avatar e telefone. Roda no servidor: o
   navegador só manda o formulário.

   ─────────────────────────────────────────────────────────────
   A REGRA QUE VALE PARA TUDO AQUI: O DONO VEM DA SESSÃO

   O id da conta NUNCA vem do formulário. Vem de `sessaoAtual()`.

   Se viesse do formulário, qualquer pessoa poderia trocar o
   campo escondido no navegador e editar o perfil de outra —
   é o mesmo IDOR que a gente fechou nas URLs, só que por outra
   porta. Aqui a porta nem existe.
   ─────────────────────────────────────────────────────────────

   CUIDADO AO MEXER:
     - Avatar é conferido contra a lista de verdade. O banco tem
       um CHECK de formato, mas formato não é existência: 'batman'
       passaria no CHECK e mostraria um quadrado vazio.
     - Trocar telefone LIMPA a verificação dele. Um telefone novo
       nunca nasce verificado — senão trocar o número seria uma
       forma de herdar a confiança do antigo.
     - `revalidatePath` é o que faz o cabeçalho e a barra lateral
       mostrarem o apelido novo sem a pessoa recarregar a página.
   ============================================================= */

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { contas } from '@/db/schema';
import { sessaoAtual } from '@/lib/sessao';
import { registra } from '@/lib/auditoria';
import { AVATARES } from '@/components/avatar';
import type { Estado } from '@/lib/acoes-conta';

/* A lista de verdade: 'inicial' mais os bichos que existem. */
const AVATARES_VALIDOS = new Set<string>(['inicial', ...Object.keys(AVATARES)]);

function soNumeros(v: string) {
  return v.replace(/\D+/g, '');
}

export async function salvarPerfil(_anterior: Estado, form: FormData): Promise<Estado> {
  const quem = await sessaoAtual();
  if (!quem) return { erro: 'Sua sessão expirou. Entre de novo.', campo: 'geral' };

  const apelido = String(form.get('apelido') ?? '').trim();
  const avatar = String(form.get('avatar') ?? 'inicial').trim();
  const telefoneBruto = String(form.get('telefone') ?? '').trim();
  const telefone = soNumeros(telefoneBruto);

  /* ---------- apelido ---------- */
  if (apelido.length > 0 && apelido.length < 2) {
    return { erro: 'O apelido precisa ter pelo menos 2 letras.', campo: 'apelido' };
  }
  if (apelido.length > 24) {
    return { erro: 'O apelido pode ter no máximo 24 letras.', campo: 'apelido' };
  }

  /* ---------- avatar ---------- */
  if (!AVATARES_VALIDOS.has(avatar)) {
    /* Não é erro de digitação: quem chega aqui mexeu no formulário
       à mão. Mensagem curta, sem explicar o que passaria. */
    return { erro: 'Escolha uma das figuras da lista.', campo: 'geral' };
  }

  /* ---------- telefone ----------
     Celular brasileiro com DDD tem 11 dígitos; fixo tem 10. Vazio
     é permitido: telefone não é obrigatório. */
  if (telefone.length > 0 && (telefone.length < 10 || telefone.length > 11)) {
    return {
      erro: 'Telefone com DDD, 10 ou 11 números. Exemplo: (16) 99999-9999.',
      campo: 'telefone',
    };
  }

  /* Só limpa a verificação se o número REALMENTE mudou. Salvar o
     perfil sem tocar no telefone não pode derrubar uma verificação
     que já existia. */
  const [antes] = await db
    .select({ telefone: contas.telefone })
    .from(contas)
    .where(eq(contas.id, quem.id))
    .limit(1);

  const mudouTelefone = (antes?.telefone ?? '') !== telefone;

  await db
    .update(contas)
    .set({
      apelido: apelido || null,
      avatar,
      telefone: telefone || null,
      ...(mudouTelefone ? { telefoneVerificadoEm: null } : {}),
      atualizadaEm: new Date(),
    })
    .where(eq(contas.id, quem.id));

  await registra({
    ator: quem.id,
    acao: 'conta.perfil_atualizado',
    alvoTipo: 'conta',
    alvoId: quem.id,
    /* O VALOR novo não vai para a auditoria — só QUAIS campos
       mudaram. A auditoria serve para reconstruir o que aconteceu,
       não para virar uma segunda cópia dos dados pessoais da
       pessoa, guardada num lugar que ela nem sabe que existe. */
    depois: { campos: mudouTelefone ? ['apelido', 'avatar', 'telefone'] : ['apelido', 'avatar'] },
  });

  /* O cabeçalho e a barra lateral mostram apelido e avatar. Sem
     isto eles continuariam com o valor antigo até a próxima
     navegação completa. */
  revalidatePath('/conta', 'layout');
  revalidatePath('/', 'layout');

  return { ok: 'Perfil salvo.' };
}
