/* =============================================================
   confiia.com.br — GUARDA

   Quem pode ver o quê. Toda página e toda ação que mexe com dado
   de alguém passa por aqui.

   ─────────────────────────────────────────────────────────────
   O PROBLEMA QUE ISTO RESOLVE, COM NOME:  IDOR
   (Insecure Direct Object Reference — referência direta insegura)

   É a falha em que a pessoa troca um número no endereço e cai na
   conta de outra:

       confiia.com.br/cliente/01   →   a minha
       confiia.com.br/cliente/02   →   a sua

   Derruba site grande todo ano. E tem DUAS defesas, que só
   funcionam juntas:

   1. ID IMPOSSÍVEL DE ADIVINHAR.
      Aqui todo identificador é UUID: `a3f8b2c1-9d4e-…`. Não existe
      "o próximo". São 2^122 possibilidades — chutar não é viável.

   2. CONFERIR O DONO A CADA ACESSO.  ← é isto que este arquivo faz
      UUID sozinho é "segredo", não é "tranca". Se um UUID escapar
      num print, num log, no histórico de um computador
      compartilhado, ou num link que a pessoa mandou no WhatsApp,
      quem tiver o endereço entra — a menos que o servidor
      pergunte, toda vez: *este recurso é mesmo de quem está
      pedindo?*

   Quem confia só no ID difícil está fazendo segurança por
   obscuridade. Quem confere o dono está fazendo segurança.
   ─────────────────────────────────────────────────────────────

   CUIDADO AO MEXER:
     - Página nova que mostre dado de alguém COMEÇA chamando
       `exigeLogin()` ou `exigeDono()`. Não existe exceção.
     - Nunca receba o ID da conta pelo formulário ou pela URL para
       decidir o que mostrar. O dono sai da SESSÃO, sempre. Aceitar
       `?conta=` é reabrir a porta que este arquivo fecha.
   ============================================================= */

import 'server-only';
import { redirect } from 'next/navigation';
import { sessaoAtual, type Logado } from '@/lib/sessao';
import { registra } from '@/lib/auditoria';
import { ipDeQuemChama } from '@/lib/limite';
import { sql } from '@/db';
import { env } from '@/lib/env';

/* -------------------------------------------------------------
   1. PRECISA ESTAR LOGADO
   ------------------------------------------------------------- */
export async function exigeLogin(voltarPara?: string): Promise<Logado> {
  const quem = await sessaoAtual();
  if (!quem) {
    const destino = voltarPara ? `?destino=${encodeURIComponent(voltarPara)}` : '';
    redirect(`/entrar${destino}`);
  }
  if (quem.status === 'suspensa') redirect('/conta/suspensa');
  return quem;
}

/* -------------------------------------------------------------
   2. PRECISA ESTAR LOGADO E COM E-MAIL CONFIRMADO

   Para o que gasta dinheiro nosso (verificação com IA) ou o que
   fica público (denúncia). Sem isso, criar conta com e-mail falso
   e sair torrando a cota seria trivial.
   ------------------------------------------------------------- */
export async function exigeEmailConfirmado(voltarPara?: string): Promise<Logado> {
  const quem = await exigeLogin(voltarPara);
  if (!quem.emailVerificado) redirect('/confirmar?enviado=1');
  return quem;
}

/* -------------------------------------------------------------
   3. PRECISA SER O DONO DO RECURSO

   Esta é a tranca contra o IDOR. Note que ela NÃO recebe "quem
   está pedindo" como argumento: isso vem da sessão, e de mais
   lugar nenhum.
   ------------------------------------------------------------- */
type Tabela =
  | 'verificacoes' | 'denuncias' | 'empresas'
  | 'monitoramentos' | 'api_chaves' | 'tickets' | 'assinaturas';

/* Em que coluna cada tabela guarda o dono. */
const COLUNA_DONO: Record<Tabela, string> = {
  verificacoes:   'conta_id',
  denuncias:      'conta_id',
  empresas:       'conta_id',
  monitoramentos: 'conta_id',
  api_chaves:     'conta_id',
  tickets:        'conta_id',
  assinaturas:    'conta_id',
};

/* UUID de verdade tem forma fixa. Barrar o que não tem forma de
   UUID evita mandar lixo para o banco — e faz o erro aparecer
   aqui, e não numa mensagem do Postgres. */
const FORMA_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function exigeDono(
  tabela: Tabela,
  recursoId: string,
): Promise<Logado> {
  const quem = await exigeLogin();

  if (!FORMA_UUID.test(recursoId)) naoExiste();

  const coluna = COLUNA_DONO[tabela];
  const [linha] = await sql<{ dono: string | null }[]>`
    SELECT ${sql(coluna)} AS dono
      FROM ${sql(tabela)}
     WHERE id = ${recursoId}::uuid
     LIMIT 1
  `;

  /* Admin passa — mas fica registrado. Acesso de admin a dado de
     usuário é legítimo e precisa ser rastreável: é o que responde
     "quem olhou minha conta?" numa reclamação. */
  if (quem.ehAdmin && linha) {
    await registra({
      ator: quem.id, acao: 'dado.revelar', alvoTipo: tabela, alvoId: recursoId,
      depois: { via: 'admin', dono: linha.dono }, ip: await ipDeQuemChama(),
    });
    return quem;
  }

  if (!linha || linha.dono !== quem.id) {
    /* Tentativa de acessar coisa de outro. Registra ANTES de
       responder: um pico dessas linhas é sinal de alguém varrendo
       o sistema, e a gente precisa enxergar isso. */
    await registra({
      ator: quem.id, acao: 'conta.entrar_negado',
      alvoTipo: tabela, alvoId: recursoId,
      depois: { motivo: linha ? 'nao e o dono' : 'nao existe' },
      ip: await ipDeQuemChama(),
    });
    naoExiste();
  }

  return quem;
}

/* -------------------------------------------------------------
   4. "NÃO EXISTE" EM VEZ DE "NÃO PODE"

   Responder "sem permissão" contaria que o recurso existe. Assim
   quem estivesse varrendo saberia quais IDs são reais e poderia
   voltar depois com outra abordagem.

   Respondendo igual nos dois casos, a pessoa não aprende nada.
   ------------------------------------------------------------- */
function naoExiste(): never {
  /* 404, não 403. É de propósito. */
  const e = new Error('NEXT_NOT_FOUND');
  (e as Error & { digest?: string }).digest = 'NEXT_HTTP_ERROR_FALLBACK;404';
  throw e;
}

/* -------------------------------------------------------------
   5. PRECISA SER ADMIN

   Hoje confere a tabela `admins`. Na Etapa 5 passa a exigir
   também o segundo fator — e aí o painel deixa de ser tela e
   passa a ser tranca de verdade.
   ------------------------------------------------------------- */
export async function exigeAdmin(): Promise<Logado> {
  const quem = await sessaoAtual();

  /* Quem não é admin recebe 404, não "acesso negado".
     Assim descobrir se o painel existe fica impossível: a resposta
     é a mesma de qualquer endereço inventado. */
  if (!quem) naoExiste();

  if (!quem.ehAdmin) {
    await registra({
      ator: quem.id, acao: 'conta.entrar_negado', alvoTipo: 'painel',
      depois: { motivo: 'nao e admin' }, ip: await ipDeQuemChama(),
    });
    naoExiste();
  }

  if (!quem.emailVerificado) naoExiste();

  /* SEGUNDO FATOR OBRIGATÓRIO.
     A pergunta é feita ao BANCO, não à sessão: a função
     `admin_pode_entrar` (migração 011) confere de uma vez que a
     conta é admin, está ativa, com e-mail confirmado E com 2FA
     ligado. Assim a regra vale igual mesmo para código novo que
     esqueça de conferir alguma dessas coisas. */
  const [ok] = await sql<{ pode: boolean }[]>`
    SELECT admin_pode_entrar(${quem.id}::uuid) AS pode
  `;

  if (!ok?.pode) {
    await registra({
      ator: quem.id, acao: 'conta.entrar_negado', alvoTipo: 'painel',
      depois: { motivo: 'admin sem segundo fator' }, ip: await ipDeQuemChama(),
    });
    naoExiste();
  }

  return quem;
}

/** O painel mora num caminho que vem do ambiente, não do código.
 *  Devolve 404 para qualquer outro — inclusive para /admin e
 *  /painel, que é o que os robôs testam. */
export function caminhoDoPainelConfere(caminho: string): boolean {
  const esperado = env.PAINEL_CAMINHO;
  /* Sem configurar, o painel simplesmente não existe. Melhor não
     existir do que existir num endereço adivinhável. */
  if (!esperado) return false;
  return caminho === esperado;
}
