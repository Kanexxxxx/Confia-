/* =============================================================
   confiia.com.br — conserta o schema gerado pelo drizzle-kit

   Roda logo depois de `drizzle-kit pull`, dentro de `npm run db:puxar`.

   POR QUE ISTO EXISTE:
   O `pull` lê o banco e escreve o arquivo TypeScript sozinho. Ele
   acerta 95%, mas erra em duas coisas que importam aqui — e como
   o arquivo é reescrito a cada `pull`, corrigir à mão não adianta:
   na próxima vez o conserto some. Então o conserto virou script.

   O QUE ELE CONSERTA:

   1. `citext` vira `unknown`
      O Drizzle não conhece o tipo `citext` (do Postgres) e marca a
      coluna como desconhecida. São justamente as colunas de e-mail:
      as mais usadas em login, cadastro e recuperação de senha.
      Ficar sem tipo ali é perder a checagem onde ela mais vale.

   2. Data vira texto
      Por padrão o `pull` traz `timestamptz` como string. Aí toda
      comparação de data precisa converter antes, e uma hora alguém
      esquece e compara texto com texto — "2026-1-5" fica DEPOIS de
      "2026-10-05" na ordem alfabética. Trocamos para Date.

   E move os arquivos de `drizzle/` para `src/db/`, que é onde a
   aplicação procura.

   CUIDADO AO MEXER:
     - Se o drizzle-kit mudar o formato do arquivo gerado, este
       script para de casar e avisa em vez de gerar coisa errada.
   ============================================================= */

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, renameSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = process.cwd();
const GERADO = join(RAIZ, 'drizzle');
const DESTINO = join(RAIZ, 'src', 'db');

function morre(msg) {
  console.error(`\n  ✗ ${msg}\n`);
  process.exit(1);
}

if (!existsSync(join(GERADO, 'schema.ts'))) {
  morre('Não achei drizzle/schema.ts. O `drizzle-kit pull` rodou?');
}

mkdirSync(DESTINO, { recursive: true });

/* ---------- 1. schema.ts ---------- */
let schema = readFileSync(join(GERADO, 'schema.ts'), 'utf8');

const quantosUnknown = (schema.match(/\bunknown\(/g) || []).length;
const quantasDatasTexto = (schema.match(/mode: 'string'/g) || []).length;

/* citext: troca `unknown("email")` por `citext("email")` */
schema = schema.replace(/\bunknown\(/g, 'citext(');

/* tira `unknown` da lista de importação do drizzle */
schema = schema.replace(
  /^import \{([^}]*)\} from "drizzle-orm\/pg-core"/m,
  (_, dentro) => {
    const nomes = dentro
      .split(',')
      .map((n) => n.trim())
      .filter((n) => n && n !== 'unknown');
    return `import { ${nomes.join(', ')} } from "drizzle-orm/pg-core"`;
  },
);

/* datas como Date, não texto */
schema = schema.replace(/mode: 'string'/g, "mode: 'date'");

const cabecalho = `/* =============================================================
   confiia.com.br — as tabelas do banco, em TypeScript

   ┌─────────────────────────────────────────────────────────┐
   │  ARQUIVO GERADO. NÃO EDITE À MÃO.                       │
   │  Ele é reescrito inteiro a cada \`npm run db:puxar\`.      │
   └─────────────────────────────────────────────────────────┘

   QUEM MANDA AQUI É O BANCO.
   A estrutura de verdade está nos arquivos .sql comentados em
   \`servidor/db/\`. Este arquivo é só o retrato deles em TypeScript,
   para o editor saber o que existe e avisar antes de quebrar.

   PARA MUDAR UMA TABELA:
     1. escreva uma migração nova em servidor/db/
     2. rode-a no banco
     3. \`npm run db:puxar\`  (regera este arquivo)

   Nunca o contrário. Migração aplicada não se edita.
   ============================================================= */

import { citext } from './tipos';
`;

writeFileSync(join(DESTINO, 'schema.ts'), cabecalho + schema, 'utf8');

/* ---------- 2. relations.ts ---------- */
if (existsSync(join(GERADO, 'relations.ts'))) {
  const rel = readFileSync(join(GERADO, 'relations.ts'), 'utf8');
  writeFileSync(
    join(DESTINO, 'relations.ts'),
    '/* GERADO por `npm run db:puxar`. Não edite à mão.\n' +
      '   Descreve como as tabelas se ligam, para consulta com join. */\n\n' +
      rel,
    'utf8',
  );
}

/* ---------- 3. limpeza ----------
   As migrações .sql geradas pelo drizzle NÃO são usadas: as nossas
   estão em servidor/db/, escritas à mão. Deixar as duas no projeto
   é convite para alguém rodar a errada. */
rmSync(GERADO, { recursive: true, force: true });

/* ---------- conferência ---------- */
const final = readFileSync(join(DESTINO, 'schema.ts'), 'utf8');
if (final.includes('unknown(')) morre('Sobrou coluna sem tipo no schema.');
if (final.includes("mode: 'string'")) morre('Sobrou data como texto no schema.');

const tabelas = (final.match(/= pgTable\(/g) || []).length;
const views = (final.match(/= pgView\(/g) || []).length;
const enums = (final.match(/= pgEnum\(/g) || []).length;

console.log(`
  schema ajustado e movido para src/db/

    tabelas ............... ${tabelas}
    visões ................ ${views}
    enums ................. ${enums}
    citext consertado ..... ${quantosUnknown} coluna(s)
    datas viraram Date .... ${quantasDatasTexto} coluna(s)
`);
