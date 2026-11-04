/* Banco de desenvolvimento independente da VPS.
 * Os dados ficam fora do OneDrive e as senhas nunca vão para o terminal.
 * Não usa o serviço Postgres de outros projetos: inicia seu próprio cluster.
 * As migrações oficiais continuam mandando; cada arquivo roda em transação.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, unlinkSync, openSync, closeSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { parseEnv } from 'node:util';
import postgres from 'postgres';

const web = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pasta = join(process.env.LOCALAPPDATA || '', 'Confia', 'desenvolvimento');
const dados = join(pasta, 'postgres');
const config = join(pasta, 'config.json');
const envLocal = join(web, '.env.local');
const bin = process.env.CONFIA_PG_BIN || 'C:\\Program Files\\PostgreSQL\\18\\bin';
const porta = 55433;
const acao = process.argv[2] || 'preparar';
if (process.platform !== 'win32' || !process.env.LOCALAPPDATA) {
  throw new Error('Este preparador usa PostgreSQL instalado no Windows. Veja AMBIENTE.md.');
}
if (!['preparar', 'parar'].includes(acao)) throw new Error('Use preparar ou parar.');
if (!existsSync(join(bin, 'pg_ctl.exe'))) throw new Error('PostgreSQL não encontrado. Configure CONFIA_PG_BIN.');

function pg(comando, args, aceitarFalha = false) {
  // Arquivo em vez de pipe: no Windows o servidor filho pode herdar o
  // descritor do pg_ctl e manter o pipe aberto depois da partida terminar.
  const log = openSync(join(pasta, 'ferramentas.log'), 'a');
  let r;
  try {
    r = spawnSync(join(bin, `${comando}.exe`), args, {
      stdio: ['ignore', log, log], windowsHide: true, timeout: 60_000,
    });
  } finally { closeSync(log); }
  // A saída pode conter caminhos e detalhes internos. O log fica só na máquina.
  if (r.status !== 0 && !aceitarFalha) {
    writeFileSync(join(pasta, 'ultimo-erro.log'), `${r.stdout || ''}\n${r.stderr || ''}\n${r.error?.message || ''}`);
    throw new Error(`${comando} falhou. Consulte ferramentas.log e ultimo-erro.log na pasta local do banco.`);
  }
  return r.status === 0;
}

mkdirSync(pasta, { recursive: true });
if (acao === 'parar') {
  if (existsSync(join(dados, 'postmaster.pid'))) pg('pg_ctl', ['-D', dados, '-m', 'fast', '-w', 'stop']);
  console.log('Banco local parado. Os dados foram preservados.');
  process.exit(0);
}

// Nunca troca a configuração recuperada da VPS por cima: a pessoa preserva
// essa cópia antes. Isso também impede apontar scripts de teste para produção.
if (existsSync(envLocal) && parseEnv(readFileSync(envLocal, 'utf8')).CONFIA_BANCO_LOCAL !== '1') {
  throw new Error('O .env.local existente não é local. Preserve-o com outro nome antes de preparar.');
}
const nova = () => randomBytes(32).toString('hex');
if (!existsSync(config)) {
  if (existsSync(join(dados, 'PG_VERSION'))) throw new Error('Cluster existente sem credenciais: não será alterado.');
  writeFileSync(config, JSON.stringify({ admin: nova(), dono: nova(), app: nova(), cofre: nova(), painel: nova() }), { flag: 'wx', mode: 0o600 });
}
const segredo = JSON.parse(readFileSync(config, 'utf8'));
if (!existsSync(join(dados, 'PG_VERSION'))) {
  const senhaTemp = join(pasta, 'senha-initdb.tmp');
  try {
    writeFileSync(senhaTemp, segredo.admin, { mode: 0o600 });
    pg('initdb', ['-D', dados, '-U', 'confia_local_admin', '--pwfile', senhaTemp,
      '--auth=scram-sha-256', '--encoding=UTF8', '--locale=C']);
  } finally {
    if (existsSync(senhaTemp)) unlinkSync(senhaTemp);
  }
  // Só loopback. O cluster local não fica acessível pela rede doméstica.
  writeFileSync(join(dados, 'postgresql.auto.conf'), [
    "listen_addresses = '127.0.0.1'", `port = ${porta}`,
    "timezone = 'America/Sao_Paulo'", "log_statement = 'ddl'",
    'max_connections = 30', "shared_buffers = '64MB'", '',
  ].join('\n'));
}
if (!pg('pg_ctl', ['-D', dados, 'status'], true)) {
  pg('pg_ctl', ['-D', dados, '-l', join(pasta, 'postgres.log'), '-w', 'start']);
}

const conecta = (username, password, database) => postgres({
  host: '127.0.0.1', port: porta, username, password, database,
  max: 1, connect_timeout: 5, onnotice: () => {},
});
const admin = conecta('confia_local_admin', segredo.admin, 'postgres');
try {
  for (const [papel, senha] of [['confia_dono', segredo.dono], ['confia_app', segredo.app]]) {
    const [existe] = await admin`SELECT 1 FROM pg_roles WHERE rolname = ${papel}`;
    // Identificadores são fixos; senhas são hex geradas acima, nunca entrada de usuário.
    if (!existe) await admin.unsafe(`CREATE ROLE ${papel} LOGIN PASSWORD '${senha}'`);
  }
  const [existe] = await admin`SELECT 1 FROM pg_database WHERE datname = 'confia_dev'`;
  if (!existe) await admin.unsafe('CREATE DATABASE confia_dev OWNER confia_dono');
} finally { await admin.end(); }

const estrutura = conecta('confia_local_admin', segredo.admin, 'confia_dev');
try {
  await estrutura.unsafe(`REVOKE ALL ON DATABASE confia_dev FROM PUBLIC;
    GRANT CONNECT ON DATABASE confia_dev TO confia_app;
    ALTER SCHEMA public OWNER TO confia_dono;
    REVOKE ALL ON SCHEMA public FROM PUBLIC;
    GRANT USAGE ON SCHEMA public TO confia_app;`);
} finally { await estrutura.end(); }

const dono = conecta('confia_dono', segredo.dono, 'confia_dev');
try {
  await dono.unsafe(`CREATE TABLE IF NOT EXISTS migracoes (
    arquivo text PRIMARY KEY, sha256 text NOT NULL,
    rodada_em timestamptz NOT NULL DEFAULT now());`);
  const sqlDir = resolve(web, '../servidor/db');
  for (const arquivo of readdirSync(sqlDir).filter((f) => f.endsWith('.sql')).sort()) {
    const bytes = readFileSync(join(sqlDir, arquivo));
    // Normaliza CRLF: o checkout do Windows não deve alterar a identidade do SQL.
    const texto = bytes.toString('utf8').replace(/\r\n/g, '\n');
    const hash = createHash('sha256').update(texto).digest('hex');
    const [aplicada] = await dono`SELECT sha256 FROM migracoes WHERE arquivo = ${arquivo}`;
    if (aplicada) {
      if (aplicada.sha256 !== hash) throw new Error(`Migração já aplicada mudou: ${arquivo}`);
      continue;
    }
    await dono.begin(async (tx) => {
      await tx.unsafe(texto);
      await tx`INSERT INTO migracoes (arquivo, sha256) VALUES (${arquivo}, ${hash})`;
    });
    console.log(`Migração aplicada: ${arquivo}`);
  }
} finally { await dono.end(); }

// Sem chaves externas: testar cadastro não manda e-mail nem cria cobrança real.
// A chave de cifra local é própria; a chave recuperada da VPS permanece preservada.
writeFileSync(envLocal, [
  '# Gerado por npm run ambiente:preparar. Exclusivo desta máquina.',
  'CONFIA_BANCO_LOCAL=1',
  `DATABASE_URL=postgres://confia_app:${segredo.app}@127.0.0.1:${porta}/confia_dev`,
  `DATABASE_URL_MIGRACAO=postgres://confia_dono:${segredo.dono}@127.0.0.1:${porta}/confia_dev`,
  'APP_URL=http://localhost:3000', `COFRE_CHAVE=${segredo.cofre}`,
  `PAINEL_CAMINHO=${segredo.painel}`, 'NEXT_TELEMETRY_DISABLED=1', '',
].join('\n'), { mode: 0o600 });
console.log('Ambiente local preparado: confia_dev em 127.0.0.1:55433.');
console.log('Integrações externas desligadas. Próximo passo: npm run dev:local.');
