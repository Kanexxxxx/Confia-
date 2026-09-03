/* =============================================================
   confiia.com.br — quem tem acesso ao painel de administração

   Uso:
     npm run admin                          → lista quem é admin
     npm run admin -- --conceder=a@b.c      → dá acesso
     npm run admin -- --remover=a@b.c       → tira acesso
     npm run admin -- --somente=a@b.c       → dá para essa e TIRA
                                              de todas as outras

   ─────────────────────────────────────────────────────────────
   POR QUE UM SCRIPT, E NÃO UMA TELA NO SITE

   Uma tela "promover a administrador" dentro do site é uma porta:
   basta uma sessão roubada de um admin para criar outro admin, e
   aí a invasão vira permanente.

   Fora do site, promover alguém exige acesso ao servidor — que é
   uma barreira de outra natureza. É a mesma razão pela qual o
   caminho do painel não fica no menu.
   ─────────────────────────────────────────────────────────────

   O BANCO EXIGE SEGUNDO FATOR. A trava está em
   `011_dois_fatores.sql` e este script não a contorna: se a conta
   não tiver 2FA, ele explica e para. Painel de administração
   protegido só por senha é uma chave única para a base inteira.

   CUIDADO AO MEXER:
     - `--somente` APAGA os outros admins. É o que ele promete
       fazer, mas confira a lista antes — rodar sem querer deixa
       você trancado do lado de fora.
     - Toda mudança vai para a auditoria. Se um dia aparecer um
       admin que ninguém reconhece, é lá que está a resposta.
   ============================================================= */

import postgres from 'postgres';

const args = process.argv.slice(2);
const pega = (nome) => {
  const a = args.find((x) => x.startsWith(`--${nome}=`));
  return a ? a.slice(nome.length + 3).trim().toLowerCase() : null;
};

const CONCEDER = pega('conceder');
const REMOVER = pega('remover');
const SOMENTE = pega('somente');

const url = process.env.DATABASE_URL_MIGRACAO || process.env.DATABASE_URL;
if (!url) {
  console.error('\n  Falta DATABASE_URL. Rode com: node --env-file=.env.local\n');
  process.exit(1);
}

const banco = new URL(url).pathname.replace(/^\//, '');
const sql = postgres(url);

async function lista() {
  const linhas = await sql`
    SELECT c.email, c.nome, a.nivel, a.criado_em,
           c.totp_ativado_em IS NOT NULL AS tem_2fa
      FROM admins a
      JOIN contas c ON c.id = a.conta_id
     WHERE c.excluida_em IS NULL
     ORDER BY a.criado_em
  `;
  console.log(`\n  Banco: ${banco}`);
  if (linhas.length === 0) {
    console.log('  Nenhum administrador.\n');
    return;
  }
  console.log(`  ${linhas.length} administrador(es):\n`);
  for (const l of linhas) {
    const papel = l.nivel === 1 ? 'dono' : 'operação';
    console.log(`    ${l.email}`);
    console.log(`      ${l.nome} · ${papel} · 2FA ${l.tem_2fa ? 'ligado' : 'DESLIGADO (!)'}`);
  }
  console.log('');
}

async function achaConta(email) {
  const [c] = await sql`
    SELECT id, email, nome, totp_ativado_em IS NOT NULL AS tem_2fa,
           email_verificado_em IS NOT NULL AS confirmado
      FROM contas
     WHERE lower(email) = ${email} AND excluida_em IS NULL
     LIMIT 1
  `;
  if (!c) {
    console.error(`\n  Não existe conta ativa com o e-mail ${email}.`);
    console.error('  A pessoa precisa criar a conta no site primeiro.\n');
    process.exit(1);
  }
  return c;
}

async function concede(email, apagarOsOutros) {
  const c = await achaConta(email);

  if (!c.tem_2fa) {
    console.error(`\n  RECUSADO: ${c.email} está sem segundo fator.`);
    console.error('\n  O banco não aceita admin sem 2FA, e essa trava está certa:');
    console.error('  painel de administração protegido só por senha é uma chave');
    console.error('  única para a base inteira.\n');
    console.error('  Peça para a pessoa ligar em /conta/seguranca e rode de novo.\n');
    process.exit(1);
  }

  if (apagarOsOutros) {
    const removidos = await sql`
      DELETE FROM admins WHERE conta_id <> ${c.id} RETURNING conta_id
    `;
    if (removidos.length) {
      await sql`
        INSERT INTO auditoria (ator_id, acao, alvo_tipo, depois)
        VALUES (NULL, 'admin.revogar', 'admins',
                ${sql.json({ quantos: removidos.length, motivo: 'somente' })})
      `;
      console.log(`\n  ${removidos.length} administrador(es) anterior(es) removido(s).`);
    }
  }

  await sql`
    INSERT INTO admins (conta_id, nivel) VALUES (${c.id}, 1)
    ON CONFLICT (conta_id) DO UPDATE SET nivel = 1
  `;
  await sql`
    INSERT INTO auditoria (ator_id, acao, alvo_tipo, alvo_id, depois)
    VALUES (NULL, 'admin.conceder', 'conta', ${c.id}, ${sql.json({ nivel: 1 })})
  `;

  console.log(`\n  ${c.email} agora é administrador (nível dono).`);
}

async function remove(email) {
  const c = await achaConta(email);
  const apagados = await sql`DELETE FROM admins WHERE conta_id = ${c.id} RETURNING conta_id`;
  if (apagados.length === 0) {
    console.log(`\n  ${c.email} já não era administrador.`);
    return;
  }
  await sql`
    INSERT INTO auditoria (ator_id, acao, alvo_tipo, alvo_id)
    VALUES (NULL, 'admin.revogar', 'conta', ${c.id})
  `;
  console.log(`\n  ${c.email} não é mais administrador.`);
}

try {
  if (SOMENTE) await concede(SOMENTE, true);
  else if (CONCEDER) await concede(CONCEDER, false);
  else if (REMOVER) await remove(REMOVER);

  await lista();
} catch (e) {
  console.error('\n  Falhou:', e.message, '\n');
  process.exitCode = 1;
} finally {
  await sql.end();
}
