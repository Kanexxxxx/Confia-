/* =============================================================
   confiia.com.br — olhar o banco sem precisar de psql

   Uso:
     node scripts/olhar.mjs "SELECT * FROM contas LIMIT 5"
     node scripts/olhar.mjs contas          (atalho pronto)
     node scripts/olhar.mjs atalhos         (lista os atalhos)

   Precisa do túnel de pé: npm run tunel

   CUIDADO AO MEXER:
     - Conecta com o usuário DONO, que pode tudo. É ferramenta de
       desenvolvimento: nunca chame isto a partir da aplicação.
     - Aponta para confia_dev. Para olhar produção, entre na VPS:
       ssh confia-vps  →  sudo -u postgres psql confia
   ============================================================= */

import postgres from 'postgres';
import { loadEnvFile } from 'node:process';

try { loadEnvFile('.env.local'); } catch {
  console.error('\n  Rode de dentro da pasta web/.\n'); process.exit(1);
}

const url = process.env.DATABASE_URL_MIGRACAO;
if (!url) { console.error('\n  Falta DATABASE_URL_MIGRACAO no .env.local\n'); process.exit(1); }

const ATALHOS = {
  contas: `SELECT nome, email::text, status,
                  (email_verificado_em IS NOT NULL) AS confirmado,
                  criada_em::timestamp(0) AS criada
             FROM contas WHERE excluida_em IS NULL
            ORDER BY criada_em DESC LIMIT 10`,

  sessoes: `SELECT c.nome, s.navegador, s.ip::text,
                   s.criada_em::timestamp(0) AS entrou,
                   (s.revogada_em IS NULL AND s.expira_em > now()) AS ativa
              FROM sessoes s JOIN contas c ON c.id = s.conta_id
             ORDER BY s.criada_em DESC LIMIT 10`,

  tokens: `SELECT c.email::text, t.tipo::text,
                  t.expira_em::timestamp(0) AS vence,
                  (t.usado_em IS NULL) AS ainda_vale
             FROM tokens t JOIN contas c ON c.id = t.conta_id
            ORDER BY t.criado_em DESC LIMIT 10`,

  emails: `SELECT modelo, destino::text, status, COALESCE(erro,'-') AS erro,
                  enviado_em::timestamp(0) AS quando
             FROM emails ORDER BY enviado_em DESC LIMIT 10`,

  auditoria: `SELECT acao, alvo_tipo, COALESCE(ip::text,'-') AS ip,
                     criada_em::timestamp(0) AS quando
                FROM auditoria ORDER BY criada_em DESC LIMIT 15`,

  planos: `SELECT slug, nome, preco_mes_cent, limites->>'verificacoes_mes' AS por_mes
             FROM planos ORDER BY ordem`,
};

const arg = process.argv.slice(2).join(' ').trim();

if (!arg || arg === 'atalhos') {
  console.log('\n  Atalhos:', Object.keys(ATALHOS).join(', '));
  console.log('  Ou passe um SQL entre aspas.\n');
  process.exit(0);
}

const consulta = ATALHOS[arg] ?? arg;
const sql = postgres(url, { max: 1, onnotice: () => {} });

try {
  const linhas = await sql.unsafe(consulta);
  if (!linhas.length) console.log('\n  (nenhuma linha)\n');
  else { console.log(); console.table(linhas.map((l) => ({ ...l }))); console.log(); }
} catch (e) {
  console.error('\n  ✗', e.message, '\n');
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 3 });
}
