/* =============================================================
   confiia.com.br — procura ícone que não existe

   POR QUE ISTO EXISTE:
   `<i className="bi bi-scales">` estava na home havia semanas.
   Esse ícone NÃO EXISTE no bootstrap-icons. O resultado é um
   espaço vazio do tamanho certo, ao lado de um título — não
   parece erro, parece decisão de design.

   O navegador não avisa. A classe simplesmente não casa com
   nenhuma regra, e o ::before fica sem conteúdo.

   Uso:
     node scripts/confere-icones.mjs
   ============================================================= */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const FONTE = 'node_modules/bootstrap-icons/font/bootstrap-icons.css';

const existentes = new Set(
  [...readFileSync(FONTE, 'utf8').matchAll(/^\.(bi-[a-z0-9-]+)::before/gm)].map((m) => m[1]),
);

function varrer(dir, achados = []) {
  for (const nome of readdirSync(dir)) {
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) { varrer(p, achados); continue; }
    if (!['.tsx', '.ts', '.css', '.html'].includes(extname(p))) continue;
    achados.push(p);
  }
  return achados;
}

let problemas = 0;
for (const arq of varrer('src')) {
  const txt = readFileSync(arq, 'utf8');
  /* pega `bi bi-alguma-coisa` em className / class */
  for (const m of txt.matchAll(/\bbi\s+(bi-[a-z0-9-]+)/g)) {
    if (existentes.has(m[1])) continue;
    const linha = txt.slice(0, m.index).split('\n').length;
    console.error(`  ${arq}:${linha}  ${m[1]} não existe no bootstrap-icons`);
    problemas++;
  }
}

if (problemas) {
  console.error(`\n  ${problemas} ícone(s) inexistente(s) — aparecem como espaço vazio.\n`);
  process.exit(1);
}
console.log(`  todos os ícones existem (${existentes.size} disponíveis).\n`);
