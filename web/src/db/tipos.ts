/* =============================================================
   confiia.com.br — tipos de coluna que o Drizzle não conhece

   O Postgres tem tipos vindos de extensão. O Drizzle não sabe
   traduzi-los sozinho, e quando lê o banco marca a coluna como
   "unknown" — o que apaga a checagem de tipo justamente nas
   colunas mais sensíveis do sistema.

   CUIDADO AO MEXER:
     - `scripts/ajusta-schema.mjs` procura por estes nomes ao
       consertar o arquivo gerado. Renomeou aqui, renomeie lá.
   ============================================================= */

import { customType } from 'drizzle-orm/pg-core';

/**
 * `citext` — texto que não diferencia maiúscula de minúscula.
 *
 * Usado em toda coluna de e-mail. É o que faz `Joao@Gmail.com` e
 * `joao@gmail.com` serem a MESMA conta — no banco, não no código.
 *
 * Isso importa mais do que parece: sem `citext`, duas pessoas
 * criariam contas diferentes com o mesmo e-mail só trocando uma
 * letra de caixa, e a recuperação de senha ficaria ambígua.
 * Como a regra está no banco, ela vale mesmo para código novo
 * que esqueça de normalizar antes de consultar.
 */
export const citext = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'citext';
  },
});
