/* =============================================================
   confiia.com.br — confere se o banco ainda está trancado

   Uso:  npm run confere-banco

   ─────────────────────────────────────────────────────────────
   POR QUE ESTE SCRIPT EXISTE

   As migrações 015 e 016 fizeram três coisas:

     · cortaram o alcance de `confia_app` de 52 objetos para 14
     · tiraram dela qualquer acesso à tabela `auditoria`
     · ligaram RLS em todas as tabelas

   Nada disso aparece na tela. Se um dia alguém rodar

       GRANT ALL ON ALL TABLES IN SCHEMA public TO confia_app;

   — que é o comando mais fácil de digitar do Postgres, e foi
   assim que a lista de 52 nasceu na primeira vez — o site
   continua funcionando exatamente igual, e a proteção some sem
   deixar rastro. Só um script olhando de propósito percebe.

   Este é o script. Ele não conserta nada; ele grita.

   ─────────────────────────────────────────────────────────────
   CUIDADO AO MEXER:
     - Se o site passar a usar uma tabela nova de verdade, some
       ela em PODE_ALCANCAR aqui E escreva o GRANT na migração que
       a criou. Mudar só aqui é desligar o alarme em vez de
       atender.
     - Ele conecta como `confia_app` de propósito: a pergunta é
       "o que a conta que atende a internet consegue fazer?", e
       essa pergunta só tem resposta honesta de dentro dela.
   ============================================================= */

import postgres from 'postgres';

/* O que a aplicação pode alcançar, e com qual direito.
   Espelha a migração 015 — os dois têm que concordar. */
const PODE_ALCANCAR = {
  contas:           'INSERT,SELECT,UPDATE',
  sessoes:          'INSERT,SELECT,UPDATE',
  tokens:           'INSERT,SELECT,UPDATE',
  emails:           'INSERT,SELECT,UPDATE',
  codigos_reserva:  'DELETE,INSERT,SELECT,UPDATE',
  denuncias:        'INSERT,SELECT',
  empresas:         'INSERT,SELECT',
  empresa_dominios: 'INSERT,SELECT',
  admins:           'SELECT',
  verificacoes:     'SELECT',
  monitoramentos:   'SELECT',
  api_chaves:       'SELECT',
  tickets:          'SELECT',
  assinaturas:      'SELECT',
};

/* Funções que precisam rodar com a autoridade do dono. Ver 016. */
const PRECISAM_SER_DEFINER = [
  'registra',
  'conta_golpe',
  'denuncia_derruba_alvo',
  'suspende_empresa_por_denuncia',
  'derruba_selo_sem_posse',
];

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('\n  Falta DATABASE_URL.\n');
  process.exit(1);
}

const sql = postgres(url, { onnotice: () => {} });
const problemas = [];

try {
  const quem = (await sql`SELECT current_user`)[0].current_user;
  console.log(`\n  Banco: ${new URL(url).pathname.slice(1)}   como: ${quem}\n`);

  /* ---------- 1. o alcance ---------- */
  const linhas = await sql`
    SELECT table_name, string_agg(DISTINCT privilege_type, ',' ORDER BY privilege_type) AS pode
      FROM information_schema.role_table_grants
     WHERE grantee = 'confia_app' AND table_schema = 'public'
     GROUP BY table_name`;

  const real = Object.fromEntries(linhas.map((l) => [l.table_name, l.pode]));

  for (const [tabela, esperado] of Object.entries(PODE_ALCANCAR)) {
    if (!real[tabela]) problemas.push(`${tabela}: a aplicação PERDEU o acesso (esperado ${esperado})`);
    else if (real[tabela] !== esperado) problemas.push(`${tabela}: tem ${real[tabela]}, deveria ter ${esperado}`);
  }
  for (const tabela of Object.keys(real)) {
    if (!(tabela in PODE_ALCANCAR)) problemas.push(`${tabela}: a aplicação alcança e NÃO deveria (${real[tabela]})`);
  }
  console.log(`  Alcance      ${Object.keys(real).length} objetos (deveriam ser ${Object.keys(PODE_ALCANCAR).length})`);

  /* ---------- 2. a auditoria ---------- */
  let auditoriaFechada = false;
  try { await sql`SELECT 1 FROM auditoria LIMIT 1`; }
  catch { auditoriaFechada = true; }
  if (!auditoriaFechada) problemas.push('auditoria: a aplicação CONSEGUE ler. Ela não deveria alcançar a tabela.');
  console.log(`  Auditoria    ${auditoriaFechada ? 'fechada para a aplicação' : 'ABERTA — errado'}`);

  /* Mas a porta de entrada tem que continuar aberta. */
  let registraFunciona = false;
  try { await sql.begin(async (tx) => {
    await tx`SELECT registra(NULL,'confere-banco','teste',NULL,NULL,NULL,NULL)`;
    registraFunciona = true;
    throw new Error('desfaz');            // não suja a auditoria de verdade
  }); } catch (e) { if (e.message !== 'desfaz') registraFunciona = false; }
  if (!registraFunciona) problemas.push('registra(): a aplicação NÃO consegue gravar auditoria. Nada fica registrado.');
  console.log(`  registra()   ${registraFunciona ? 'grava (única porta)' : 'QUEBRADA'}`);

  /* ---------- 3. RLS ---------- */
  const [{ sem }] = await sql`
    SELECT count(*)::int AS sem FROM pg_tables
     WHERE schemaname='public' AND NOT rowsecurity AND tablename <> 'migracoes'`;
  if (sem > 0) problemas.push(`RLS: ${sem} tabela(s) sem RLS ligada.`);
  const [{ com }] = await sql`
    SELECT count(*)::int AS com FROM pg_tables WHERE schemaname='public' AND rowsecurity`;
  console.log(`  RLS          ligada em ${com} tabelas${sem ? `, FALTAM ${sem}` : ''}`);

  /* ---------- 4. os gatilhos com autoridade ---------- */
  const fns = await sql`
    SELECT proname, prosecdef, proconfig FROM pg_proc
     WHERE proname = ANY(${PRECISAM_SER_DEFINER})`;
  for (const nome of PRECISAM_SER_DEFINER) {
    const f = fns.find((x) => x.proname === nome);
    if (!f) problemas.push(`${nome}(): sumiu do banco.`);
    else if (!f.prosecdef) problemas.push(`${nome}(): deixou de ser SECURITY DEFINER — o INSERT que a dispara vai falhar.`);
    else if (!(f.proconfig ?? []).some((c) => c.startsWith('search_path='))) {
      problemas.push(`${nome}(): SECURITY DEFINER SEM search_path fixo. Isso é uma porta aberta.`);
    }
  }
  console.log(`  Gatilhos     ${fns.filter((f) => f.prosecdef).length}/${PRECISAM_SER_DEFINER.length} com autoridade do dono`);

  /* ---------- veredito ---------- */
  if (problemas.length === 0) {
    console.log('\n  O banco está como as migrações 015 e 016 deixaram.\n');
  } else {
    console.log(`\n  ${problemas.length} problema(s):\n`);
    for (const p of problemas) console.log(`    · ${p}`);
    console.log('\n  Reaplique servidor/db/015_menos_poder.sql e 016_gatilhos_com_autoridade.sql\n');
    process.exitCode = 1;
  }
} catch (e) {
  console.error('\n  Falhou:', e.message, '\n');
  process.exitCode = 1;
} finally {
  await sql.end();
}
