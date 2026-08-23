/* =============================================================
   confiia.com.br — configuração das ferramentas de banco

   Serve para o `drizzle-kit`, que é a ferramenta de linha de
   comando. A aplicação em si não lê este arquivo.

   O QUE ELE FAZ AQUI:
   `npm run db:puxar` lê o banco de verdade e reescreve
   `src/db/schema.ts` com as tabelas que existem lá.

   ATENÇÃO À DIREÇÃO: aqui o BANCO manda no código, não o
   contrário. As migrações continuam sendo os arquivos .sql em
   `servidor/db/`, escritos à mão e cheios de comentário. O
   Drizzle só lê o resultado e gera os tipos para o TypeScript.

   Por que assim: aquelas migrações têm regra de negócio que
   gerador nenhum sabe escrever — gatilho que recusa selo sem
   posse do domínio, política de moderação, cálculo de score.
   Deixar uma ferramenta reescrever isso seria perder o que o
   sistema tem de melhor.

   CUIDADO AO MEXER:
     - Usa DATABASE_URL_MIGRACAO (usuário dono), não a do app.
     - Precisa do túnel SSH de pé: `npm run tunel`.
   ============================================================= */

import { defineConfig } from 'drizzle-kit';

/* Carrega o .env.local sem depender de biblioteca externa.
   O Next carrega sozinho quando roda o site; o drizzle-kit não. */
import { loadEnvFile } from 'node:process';
try {
  loadEnvFile('.env.local');
} catch {
  /* Sem .env.local: só quebra na hora de conectar, com mensagem
     melhor do que "undefined". */
}

const url = process.env.DATABASE_URL_MIGRACAO;
if (!url) {
  throw new Error(
    'Falta DATABASE_URL_MIGRACAO no .env.local.\n' +
    'Esse arquivo é gerado a partir do servidor — veja o PLANO.md, Etapa 3.',
  );
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url },
  /* Só o schema public. Sem isso ele traria tabelas internas
     do Postgres junto. */
  schemaFilter: ['public'],
  verbose: true,
  strict: true,
});
