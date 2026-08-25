/* =============================================================
   confiia.com.br — SESSÃO

   Quem está logado, e como a gente sabe disso.

   COMO FUNCIONA:
   Ao entrar, geramos um segredo aleatório de 32 bytes. Ele vai
   num cookie para o navegador da pessoa. No banco guardamos
   apenas o SHA-256 dele.

   POR QUE GUARDAR SÓ O HASH:
   Se o banco vazar, quem pegar não consegue se passar por
   ninguém — teria que reverter um SHA-256, o que não dá.
   É a mesma ideia da senha. Um vazamento vira um susto em vez
   de uma invasão de todas as contas ao mesmo tempo.

   POR QUE A SESSÃO FICA NO BANCO E NÃO NUM JWT:
   JWT não dá para cancelar antes de expirar. Aqui a pessoa pode
   derrubar a sessão de outro aparelho na hora, e nós podemos
   derrubar todas se ela trocar a senha. Custa uma consulta por
   requisição — barato perto de não conseguir expulsar ninguém.

   CUIDADO AO MEXER:
     - Cookie só pode ser GRAVADO dentro de Server Action ou Route
       Handler. Em Server Component dá para ler, não escrever.
     - Sessão de admin vence em 12h — quem faz isso é o gatilho
       `tg_sessao_admin` no banco (007_admin.sql), não este arquivo.
       Assim vale mesmo para código que esqueça de conferir.
   ============================================================= */

import 'server-only';
import { cookies, headers } from 'next/headers';
import { randomBytes, createHash } from 'node:crypto';
import { eq, and, isNull, gt, sql as raw } from 'drizzle-orm';
import { db, sql } from '@/db';
import { sessoes, contas } from '@/db/schema';
import { emProducao } from '@/lib/env';

/* O nome está documentado na página de cookies do site.
   Mudou aqui, mude lá — a pessoa tem direito de saber o que
   guardamos no navegador dela. */
export const NOME_COOKIE = 'confia_sessao';

const DIAS = 30;

function hashDo(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

/** Dados de quem está usando, para a pessoa reconhecer a sessão
 *  depois na lista de aparelhos conectados. */
async function deOndeVeio() {
  const h = await headers();
  const ip =
    h.get('x-forwarded-for')?.split(',')[0].trim() ||
    h.get('x-real-ip') ||
    null;
  const agente = h.get('user-agent') || '';

  /* Guardamos um resumo legível, não a string inteira: ela é longa,
     muda a cada atualização do navegador e serve para rastrear. */
  const navegador =
    /iPhone|iPad/i.test(agente) ? 'iPhone ou iPad'
    : /Android/i.test(agente) ? 'Android'
    : /Windows/i.test(agente) ? 'Windows'
    : /Macintosh/i.test(agente) ? 'Mac'
    : /Linux/i.test(agente) ? 'Linux'
    : 'Desconhecido';

  return { ip, navegador };
}

/** Cria a sessão e entrega o cookie. Chame só de Server Action.
 *
 *  @param aguardando2fa  true = a senha estava certa mas o código
 *  do celular ainda não veio. A sessão existe (para ficar
 *  registrada e revogável) mas NÃO dá acesso a nada — veja
 *  `sessaoAtual`, que a ignora. O banco a faz expirar em 10
 *  minutos (gatilho tg_sessao_admin, migração 011). */
export async function criaSessao(contaId: string, aguardando2fa = false): Promise<void> {
  const token = randomBytes(32).toString('base64url');
  const expira = new Date(Date.now() + DIAS * 86400_000);
  const { ip, navegador } = await deOndeVeio();

  await db.insert(sessoes).values({
    contaId,
    tokenHash: hashDo(token),
    ip,
    navegador,
    expiraEm: expira,
    aguardando2Fa: aguardando2fa,
  });

  const caixa = await cookies();
  caixa.set(NOME_COOKIE, token, {
    httpOnly: true,   // JavaScript da página não enxerga: barra roubo por XSS
    secure: emProducao, // só por HTTPS em produção
    sameSite: 'lax',  // não vai junto em requisição de outro site
    path: '/',
    expires: expira,
  });
}

export type Logado = {
  id: string;
  nome: string;
  email: string;
  status: 'ativa' | 'suspensa' | 'excluida';
  emailVerificado: boolean;
  ehAdmin: boolean;
};

/** Quem está logado agora, ou null. Pode ser chamada de qualquer
 *  lugar do servidor. Não escreve cookie.
 *
 *  ────────────────────────────────────────────────────────────
 *  SE O BANCO CAIR, ELA DEVOLVE `null` — NÃO DERRUBA A PÁGINA
 *
 *  O cabeçalho do site chama esta função em TODAS as páginas,
 *  inclusive nas públicas. Antes, uma falha de conexão com o
 *  banco subia como exceção e a home, os planos e os documentos
 *  legais respondiam 500 — páginas que nem precisam de conta.
 *
 *  Agora a falha vira `null`, que significa "ninguém logado". O
 *  site continua de pé mostrando "Entrar", e quem estava logado
 *  vê o cabeçalho de visitante até o banco voltar. Degradado,
 *  mas no ar.
 *
 *  ISTO NUNCA CONCEDE ACESSO. `null` é a resposta mais restritiva
 *  possível: `exigeLogin()` manda para a tela de entrar e
 *  `exigeAdmin()` devolve 404. Falhar para o lado seguro é o que
 *  torna esta escolha aceitável — se o erro pudesse virar "sim",
 *  não daria para fazer isso.
 *  ──────────────────────────────────────────────────────────── */
export async function sessaoAtual(): Promise<Logado | null> {
  try {
    return await leSessao();
  } catch (e) {
    /* Sem `console.error` a falha some e ninguém descobre por que
       o site "esqueceu" que a pessoa estava logada. */
    console.error('[sessao] banco indisponível ao ler a sessão:', e);
    return null;
  }
}

async function leSessao(): Promise<Logado | null> {
  const caixa = await cookies();
  const token = caixa.get(NOME_COOKIE)?.value;
  if (!token) return null;

  const [linha] = await db
    .select({
      id: contas.id,
      nome: contas.nome,
      email: contas.email,
      status: contas.status,
      verificadoEm: contas.emailVerificadoEm,
      excluidaEm: contas.excluidaEm,
    })
    .from(sessoes)
    .innerJoin(contas, eq(contas.id, sessoes.contaId))
    .where(
      and(
        eq(sessoes.tokenHash, hashDo(token)),
        isNull(sessoes.revogadaEm),
        gt(sessoes.expiraEm, new Date()),
        /* Sessão à espera do segundo fator NÃO é sessão. Esta
           linha é a tranca inteira do 2FA: sem ela, acertar só a
           senha já entraria. */
        eq(sessoes.aguardando2Fa, false),
      ),
    )
    .limit(1);

  if (!linha) return null;

  /* Conta suspensa ou excluída não navega, mesmo com cookie válido. */
  if (linha.excluidaEm || linha.status === 'excluida') return null;

  const [admin] = await sql<{ existe: number }[]>`
    SELECT 1 AS existe FROM admins WHERE conta_id = ${linha.id}
  `;

  return {
    id: linha.id,
    nome: linha.nome,
    email: linha.email,
    status: linha.status as Logado['status'],
    emailVerificado: linha.verificadoEm !== null,
    ehAdmin: Boolean(admin),
  };
}

/** A sessão que está esperando o código do celular.
 *  Só a tela de digitar o código usa isto. */
export async function sessaoPendente(): Promise<{ contaId: string; email: string; nome: string } | null> {
  const caixa = await cookies();
  const token = caixa.get(NOME_COOKIE)?.value;
  if (!token) return null;

  const [linha] = await db
    .select({ contaId: contas.id, email: contas.email, nome: contas.nome })
    .from(sessoes)
    .innerJoin(contas, eq(contas.id, sessoes.contaId))
    .where(
      and(
        eq(sessoes.tokenHash, hashDo(token)),
        isNull(sessoes.revogadaEm),
        gt(sessoes.expiraEm, new Date()),
        eq(sessoes.aguardando2Fa, true),
      ),
    )
    .limit(1);

  return linha ?? null;
}

/** Código aceito: a sessão pela metade vira sessão de verdade, e
 *  o prazo passa a ser o normal. */
export async function completaSessao(): Promise<boolean> {
  const caixa = await cookies();
  const token = caixa.get(NOME_COOKIE)?.value;
  if (!token) return false;

  const expira = new Date(Date.now() + DIAS * 86400_000);

  const feitos = await db
    .update(sessoes)
    .set({ aguardando2Fa: false, expiraEm: expira })
    .where(and(eq(sessoes.tokenHash, hashDo(token)), eq(sessoes.aguardando2Fa, true)))
    .returning({ id: sessoes.id });

  if (feitos.length !== 1) return false;

  /* O cookie também precisa durar mais: ele nasceu com 10 minutos. */
  caixa.set(NOME_COOKIE, token, {
    httpOnly: true, secure: emProducao, sameSite: 'lax', path: '/', expires: expira,
  });
  return true;
}

/** Marca o último acesso. Separado de `sessaoAtual` de propósito:
 *  gravar a cada requisição encheria o banco de escrita à toa. */
export async function tocaUltimoAcesso(contaId: string) {
  await db
    .update(contas)
    .set({ ultimoAcessoEm: new Date() })
    .where(
      and(
        eq(contas.id, contaId),
        /* só grava se passou de uma hora da última vez */
        raw`(ultimo_acesso_em IS NULL OR ultimo_acesso_em < now() - interval '1 hour')`,
      ),
    );
}

/** Sai desta sessão. */
export async function encerraSessao(): Promise<void> {
  const caixa = await cookies();
  const token = caixa.get(NOME_COOKIE)?.value;

  if (token) {
    await db
      .update(sessoes)
      .set({ revogadaEm: new Date() })
      .where(eq(sessoes.tokenHash, hashDo(token)));
  }
  caixa.delete(NOME_COOKIE);
}

/** Derruba TODAS as sessões da conta.
 *
 *  Chamada obrigatoriamente quando a senha muda: se alguém entrou
 *  na conta indevidamente, trocar a senha tem que expulsar essa
 *  pessoa. Senão a troca de senha não resolve nada — o invasor
 *  continua dentro com o cookie que já tinha. */
export async function encerraTodasSessoes(contaId: string, menosAAtual = false) {
  let tokenAtual: string | undefined;
  if (menosAAtual) {
    const caixa = await cookies();
    tokenAtual = caixa.get(NOME_COOKIE)?.value;
  }

  await db
    .update(sessoes)
    .set({ revogadaEm: new Date() })
    .where(
      and(
        eq(sessoes.contaId, contaId),
        isNull(sessoes.revogadaEm),
        tokenAtual ? raw`token_hash <> ${hashDo(tokenAtual)}` : undefined,
      ),
    );
}

/** Os aparelhos conectados, para a pessoa ver e derrubar. */
export async function aparelhosConectados(contaId: string) {
  return db
    .select({
      id: sessoes.id,
      navegador: sessoes.navegador,
      ip: sessoes.ip,
      criadaEm: sessoes.criadaEm,
      expiraEm: sessoes.expiraEm,
    })
    .from(sessoes)
    .where(
      and(
        eq(sessoes.contaId, contaId),
        isNull(sessoes.revogadaEm),
        gt(sessoes.expiraEm, new Date()),
      ),
    )
    .orderBy(raw`criada_em DESC`);
}
