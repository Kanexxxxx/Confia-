/* =============================================================
   confiia.com.br — conexão com o banco

   Use sempre `db` daqui. Não abra conexão em outro lugar.

   POR QUE O `globalThis` ABAIXO:
   Em desenvolvimento o Next recarrega os módulos a cada arquivo
   salvo. Sem guardar a conexão num lugar que sobrevive ao
   recarregamento, cada `Ctrl+S` abriria um punhado de conexões
   novas e deixaria as antigas penduradas. Em poucos minutos o
   Postgres recusa tudo com "too many connections" — e você fica
   procurando o erro no código errado.
   Em produção o módulo carrega uma vez só e isso não acontece.

   CUIDADO AO MEXER:
     - `max: 10` conversa com `max_connections = 50` do Postgres
       (servidor/02-banco.sh). Subir aqui sem subir lá derruba o
       banco no primeiro pico.
     - A aplicação conecta como `confia_app`, que NÃO cria nem
       apaga tabela. Se algum código precisar disso, o problema
       é o código, não a permissão.
   ============================================================= */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env, emProducao } from '@/lib/env';
import * as schema from './schema';
import * as relations from './relations';

function abreConexao() {
  return postgres(env.DATABASE_URL, {
    /* Pool pequeno de propósito: a VPS tem 1 núcleo. Mais conexão
       não é mais velocidade, é mais briga pelo mesmo núcleo. */
    max: emProducao ? 10 : 4,

    /* Conexão parada é devolvida em 20s. */
    idle_timeout: 20,

    /* Conexão que não fecha nunca acaba acumulando estado
       estranho; reciclar de hora em hora é higiene barata. */
    max_lifetime: 60 * 60,

    /* Consulta que passa de 15s está travada, não lenta.
       Melhor devolver erro do que segurar o pedido para sempre. */
    connect_timeout: 10,

    /* Nunca logamos SQL com dado dentro — o mesmo motivo pelo
       qual o Postgres está com log_statement='ddl'. */
    onnotice: () => {},

    /* Fuso do Brasil em toda conexão, para o banco e a aplicação
       concordarem sobre que dia é hoje. */
    connection: { TimeZone: 'America/Sao_Paulo' },
  });
}

/* Guarda entre recarregamentos do modo de desenvolvimento */
const guardado = globalThis as unknown as {
  __confia_sql?: ReturnType<typeof abreConexao>;
};

export const sql = guardado.__confia_sql ?? abreConexao();
if (!emProducao) guardado.__confia_sql = sql;

export const db = drizzle(sql, { schema: { ...schema, ...relations } });

/** Todas as tabelas e visões, para importar de um lugar só:
 *  `import { tabelas } from '@/db'` */
export { schema as tabelas };

/** Confere se o banco responde. Usada na tela de diagnóstico e,
 *  mais para frente, no endereço de saúde que o monitoramento lê. */
export async function bancoRespondendo(): Promise<
  { ok: true; versao: string; latenciaMs: number } | { ok: false; erro: string }
> {
  const comeco = Date.now();
  try {
    const [linha] = await sql<{ versao: string }[]>`SELECT version() AS versao`;
    return {
      ok: true,
      versao: linha.versao.split(' ').slice(0, 2).join(' '),
      latenciaMs: Date.now() - comeco,
    };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : String(e) };
  }
}
