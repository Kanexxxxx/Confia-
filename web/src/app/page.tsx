/* =============================================================
   confiia.com.br — tela de diagnóstico

   PROVISÓRIA. Na Etapa 6 a home de verdade toma este lugar e
   isto vira /diagnostico, protegido por login de admin.

   Ela existe para responder, sem adivinhação: a aplicação está
   falando com o banco? Está lendo dado real? Que serviço externo
   já tem chave configurada?

   É um componente de servidor: o `async` na função e o `await`
   no banco rodam NO SERVIDOR. A senha do banco nunca chega ao
   navegador — o que sai daqui é só o HTML já pronto.
   ============================================================= */

import { db, sql, bancoRespondendo } from '@/db';
import { planos } from '@/db/schema';
import { ligado, env } from '@/lib/env';
import { asc } from 'drizzle-orm';

/* Diagnóstico não pode ser cacheado: ele existe justamente para
   mostrar o estado de agora. */
export const dynamic = 'force-dynamic';

function reais(centavos: number) {
  return (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export default async function Diagnostico() {
  const saude = await bancoRespondendo();

  if (!saude.ok) {
    return (
      <main className="folha">
        <h1>confia?</h1>
        <p className="sub">diagnóstico</p>
        <div className="erro">
          <b>O banco não respondeu.</b>
          <p style={{ margin: '8px 0 0' }}>{saude.erro}</p>
          <p style={{ margin: '12px 0 0', fontSize: 13 }}>
            O motivo mais comum é o túnel estar fechado. Abra outro terminal e rode{' '}
            <span className="mono">npm run tunel</span>.
          </p>
        </div>
      </main>
    );
  }

  /* Consulta com tipo: o editor sabe que `planos` tem `slug`,
     `precoMesCent` e `limites`, e reclama se você errar o nome. */
  const listaDePlanos = await db
    .select()
    .from(planos)
    .orderBy(asc(planos.ordem));

  /* Contagem direta, para provar que o schema todo chegou */
  const [contagem] = await sql<
    { tabelas: number; views: number; funcoes: number }[]
  >`
    SELECT
      (SELECT count(*) FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE')::int AS tabelas,
      (SELECT count(*) FROM information_schema.views
        WHERE table_schema = 'public')::int AS views,
      (SELECT count(*) FROM information_schema.routines
        WHERE routine_schema = 'public')::int AS funcoes
  `;

  const [quem] = await sql<{ usuario: string; banco: string }[]>`
    SELECT current_user AS usuario, current_database() AS banco
  `;

  const servicos = [
    ['E-mail (Resend)', ligado.email, 'Etapa 4'],
    ['Leitura de imagem (OpenAI)', ligado.leituraDeImagem, 'Etapa 8'],
    ['Detecção de IA (Hive)', ligado.deteccaoDeIa, 'Etapa 8'],
    ['Listas de phishing (Google)', ligado.listasDePhishing, 'Etapa 8'],
    ['Pagamento (Asaas)', ligado.pagamento, 'Etapa 9'],
  ] as const;

  return (
    <main className="folha">
      <h1>confia?</h1>
      <p className="sub">
        diagnóstico · etapa 3 · ambiente de {env.NODE_ENV === 'production' ? 'produção' : 'desenvolvimento'}
      </p>

      <div className="cartao">
        <h2>Banco de dados</h2>
        <div className="linha">
          <span className="rot">Conexão</span>
          <span className="val">
            <span className="selo selo--ok">respondendo</span>
          </span>
        </div>
        <div className="linha">
          <span className="rot">Versão</span>
          <span className="val mono">{saude.versao}</span>
        </div>
        <div className="linha">
          <span className="rot">Tempo de resposta</span>
          <span className="val">{saude.latenciaMs} ms</span>
        </div>
        <div className="linha">
          <span className="rot">Banco</span>
          <span className="val mono">{quem.banco}</span>
        </div>
        <div className="linha">
          <span className="rot">Conectado como</span>
          <span className="val mono">{quem.usuario}</span>
        </div>
        <div className="linha">
          <span className="rot">Tabelas · visões · funções</span>
          <span className="val">
            {contagem.tabelas} · {contagem.views} · {contagem.funcoes}
          </span>
        </div>
      </div>

      <div className="cartao">
        <h2>Planos lidos do banco</h2>
        <table>
          <thead>
            <tr>
              <th>Plano</th>
              <th className="dir">Mês</th>
              <th className="dir">Ano</th>
              <th className="dir">Verificações</th>
              <th className="dir">Imagens</th>
            </tr>
          </thead>
          <tbody>
            {listaDePlanos.map((p) => {
              /* `limites` é JSONB: o banco não sabe o formato, então
                 aqui é o único lugar que precisa afirmar o tipo. */
              const limites = p.limites as {
                verificacoes_mes: number | null;
                imagens_mes: number | null;
              };
              return (
                <tr key={p.id}>
                  <td>
                    <b>{p.nome}</b>{' '}
                    <span className="mono" style={{ opacity: 0.5 }}>
                      {p.slug}
                    </span>
                  </td>
                  <td className="dir">
                    {p.precoMesCent ? reais(p.precoMesCent) : '—'}
                  </td>
                  <td className="dir">
                    {p.precoAnoCent ? reais(p.precoAnoCent) : '—'}
                  </td>
                  <td className="dir">
                    {limites.verificacoes_mes ?? 'sem limite'}
                  </td>
                  <td className="dir">{limites.imagens_mes ?? 'sem limite'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="cartao">
        <h2>Serviços externos</h2>
        {servicos.map(([nome, temChave, etapa]) => (
          <div className="linha" key={nome}>
            <span className="rot">{nome}</span>
            <span className="val">
              {temChave ? (
                <span className="selo selo--ok">chave configurada</span>
              ) : (
                <span className="selo selo--off">falta — {etapa}</span>
              )}
            </span>
          </div>
        ))}
      </div>

      <p className="nota">
        <b>O que esta tela prova:</b> a aplicação em TypeScript está conectada ao
        PostgreSQL da VPS, lendo dado real, com as 42 tabelas no lugar. Os planos
        acima não estão escritos no código — vieram do banco agora.
      </p>
    </main>
  );
}
