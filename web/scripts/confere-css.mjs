/* =============================================================
   confiia.com.br — procura variável CSS usada e nunca definida

   POR QUE ISTO EXISTE:
   Três defeitos visíveis do site vieram do MESMO erro: uma
   variável CSS citada em var() que ninguém definiu.

     --shell   → o texto colava na borda esquerda da tela
     --r-2xl   → o card do verificador ficava quadrado
     (o próximo, que este script vai pegar antes de você ver)

   O navegador não avisa. Ele descarta a declaração inteira em
   silêncio e segue. Não há erro no console, não há aviso no
   build, e o resultado é só "está estranho".

   Uso:
     node scripts/confere-css.mjs

   Sai com código 1 se achar alguma — dá para pendurar no CI.
   ============================================================= */

import { readFileSync } from 'node:fs';

const ARQUIVOS = ['src/app/globals.css', 'public/assets/acessibilidade.css'];

/* Definidas fora do CSS, e por isso invisíveis para este script:
     --fonte-texto / --fonte-titulo  vêm do next/font, no <html>
     --mx / --my                     vêm do revelacao.tsx, e já
                                     têm valor de reserva no var() */
const DE_FORA = new Set(['--fonte-texto', '--fonte-titulo', '--mx', '--my']);

let problemas = 0;

for (const arq of ARQUIVOS) {
  let css;
  try { css = readFileSync(arq, 'utf8'); } catch { continue; }
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');

  const definidas = new Set([...css.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map((m) => m[1]));
  const usos = [...css.matchAll(/var\((--[a-z0-9-]+)\s*(,)?/gi)];

  for (const u of usos) {
    const nome = u[1];
    const temReserva = Boolean(u[2]);
    if (definidas.has(nome) || DE_FORA.has(nome) || temReserva) continue;

    const linha = css.slice(0, u.index).split('\n').length;
    console.error(`  ${arq}:${linha}  ${nome} é usada e nunca definida`);
    problemas++;
  }
}

if (problemas) {
  console.error(`\n  ${problemas} variável(is) sem definição.`);
  console.error('  O navegador descarta a declaração inteira, sem avisar.\n');
  process.exit(1);
}
console.log('  nenhuma variável CSS órfã.\n');
