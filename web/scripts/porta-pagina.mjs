/* =============================================================
   confiia.com.br — converte HTML do protótipo em JSX

   Uso:
     node scripts/porta-pagina.mjs ../prototipo/termos.html Termos

   POR QUE UM SCRIPT E NÃO NA MÃO:
   São 200 KB de HTML em dez páginas, e boa parte é documento
   legal. Transcrever à mão significa errar uma palavra em algum
   lugar — e num texto que promete coisa ao usuário, uma palavra
   trocada não é bug de programação, é problema jurídico.

   O script faz a parte MECÂNICA (que é quase tudo) e avisa o que
   ele não sabe fazer. Aí eu conserto só isso.

   O QUE ELE FAZ:
     class=        →  className=
     for=          →  htmlFor=
     style="a:b"   →  style={{ a: 'b' }}
     <br>          →  <br />
     comentário HTML  →  comentário JSX
     &nbsp; etc    →  o caractere de verdade
     { }           →  escapados no texto

   O QUE ELE NÃO FAZ (e avisa):
     - <script> embutido: vira componente cliente à mão
     - <style> embutido: extraído para um .css separado
     - onclick= e afins: não existem em React

   CUIDADO AO MEXER:
     - Este script NÃO valida o resultado. Rode `npx tsc` depois,
       e olhe a página no navegador. Ele economiza digitação, não
       substitui conferência.
   ============================================================= */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

const [, , entrada, nomeComponente] = process.argv;
if (!entrada || !nomeComponente) {
  console.error('\n  uso: node scripts/porta-pagina.mjs <arquivo.html> <NomeDoComponente>\n');
  process.exit(1);
}

let html = readFileSync(entrada, 'utf8');
const avisos = [];

/* ---------- 1. tira o que vira outro arquivo ---------- */
const estilos = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
if (estilos.length) {
  html = html.replace(/<style>[\s\S]*?<\/style>/g, '');
  avisos.push(`${estilos.length} bloco(s) <style> extraído(s) para .css`);
}

const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)];
if (scripts.length) {
  html = html.replace(/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/g, '');
  avisos.push(`${scripts.length} bloco(s) <script> REMOVIDO(S) — vire componente cliente à mão`);
}
html = html.replace(/<script[^>]*\bsrc=[^>]*><\/script>/g, '');
html = html.replace(/<link[^>]*>/g, '');
html = html.replace(/<meta[^>]*>/g, '');

/* ---------- 2. só o miolo do <body> ---------- */
const corpo = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
let jsx = corpo ? corpo[1] : html;

/* ---------- 3. comentários HTML → comentários JSX ---------- */
jsx = jsx.replace(/<!--([\s\S]*?)-->/g, (_, c) => `{/*${c.replace(/\*\//g, '* /')}*/}`);

/* ---------- 4. atributos ---------- */
jsx = jsx.replace(/\bclass=/g, 'className=');
jsx = jsx.replace(/\bfor=/g, 'htmlFor=');
jsx = jsx.replace(/\btabindex=/g, 'tabIndex=');
jsx = jsx.replace(/\bmaxlength=/g, 'maxLength=');
jsx = jsx.replace(/\bminlength=/g, 'minLength=');
jsx = jsx.replace(/\breadonly\b/g, 'readOnly');
jsx = jsx.replace(/\bautocomplete=/g, 'autoComplete=');
jsx = jsx.replace(/\bautofocus\b/g, 'autoFocus');
jsx = jsx.replace(/\binputmode=/g, 'inputMode=');
jsx = jsx.replace(/\bnovalidate\b/g, 'noValidate');
jsx = jsx.replace(/\bcolspan=/g, 'colSpan=');
jsx = jsx.replace(/\browspan=/g, 'rowSpan=');
jsx = jsx.replace(/\bsrcset=/g, 'srcSet=');
jsx = jsx.replace(/\bcrossorigin\b/g, 'crossOrigin');

/* eventos inline não existem em React */
const eventos = jsx.match(/\son[a-z]+=/g);
if (eventos) avisos.push(`${eventos.length} evento(s) inline (${[...new Set(eventos)].join(', ')}) — precisam virar componente cliente`);

/* ---------- 5. style="a:b;c:d" → style={{ a:'b', c:'d' }} ---------- */
jsx = jsx.replace(/style="([^"]*)"/g, (_, css) => {
  const pares = css.split(';').map((p) => p.trim()).filter(Boolean).map((p) => {
    const i = p.indexOf(':');
    if (i === -1) return null;
    const bruta = p.slice(0, i).trim();
    const valor = p.slice(i + 1).trim();

    /* VARIÁVEL CSS (--x) NÃO VIRA camelCase.
       Testar isto ANTES da conversão é obrigatório: `--d` passado
       pelo camelCase vira `-D`, porque a regra `-([a-z])` casa com
       o SEGUNDO traço. O JSX então recebe `{ -D: '.02s' }`, que
       nem é sintaxe válida. Aconteceu na home. */
    const chave = bruta.startsWith('--')
      ? `'${bruta}'`
      : bruta.replace(/-([a-z])/g, (_m, c) => c.toUpperCase());
    return `${chave}: '${valor.replace(/'/g, "\\'")}'`;
  }).filter(Boolean);
  const corpo = pares.join(', ');

  /* O tipo CSSProperties do React não conhece variável CSS (--x).
     Sem a afirmação de tipo, o TypeScript recusa — mesmo o valor
     funcionando no navegador. */
  return corpo.includes("'--")
    ? `style={{ ${corpo} } as React.CSSProperties}`
    : `style={{ ${corpo} }}`;
});

/* ---------- 6. tags que se fecham sozinhas ---------- */
for (const t of ['br', 'hr', 'img', 'input', 'source', 'use', 'path', 'circle',
                 'ellipse', 'rect', 'line', 'polygon', 'stop', 'feImage',
                 'feDisplacementMap', 'col', 'area']) {
  jsx = jsx.replace(new RegExp(`<${t}\\b([^>]*?)\\s*/?>`, 'g'), (m, attrs) =>
    m.includes('/>') ? m : `<${t}${attrs} />`);
}

/* ---------- 7. entidades ---------- */
const entidades = {
  '&nbsp;': ' ', '&mdash;': '—', '&ndash;': '–', '&hellip;': '…',
  '&laquo;': '«', '&raquo;': '»', '&rsquo;': '’', '&lsquo;': '‘',
  '&ldquo;': '“', '&rdquo;': '”', '&times;': '×', '&middot;': '·',
  '&amp;': '&', '&lt;': '<', '&gt;': '>',
};
for (const [e, c] of Object.entries(entidades)) jsx = jsx.split(e).join(c);
/* aspas ficam como entidade JSX para o ESLint não reclamar */
jsx = jsx.replace(/&quot;/g, '{"\\""}');

/* ---------- 7c. aspas retas viram aspas de verdade ----------
   O ESLint recusa " solto dentro de texto JSX (react/no-unescaped-
   entities), e ele tem razão pelo motivo errado: o problema real é
   tipográfico. Texto em português usa “aspas curvas”. O protótipo
   foi escrito com a aspa reta do teclado.
   Só converte PARES dentro de texto — atributo não é tocado, porque
   este passo roda depois de style/className já estarem resolvidos. */
jsx = jsx.replace(/>([^<]*)</g, (m, texto) => {
  if (!texto.includes('"')) return m;
  let n = 0;
  return '>' + texto.replace(/"/g, () => (n++ % 2 === 0 ? '“' : '”')) + '<';
});

/* ---------- 7b. <table> sem <tbody> ----------
   O navegador INSERE <tbody> ao ler o HTML do servidor. O React
   não insere. Resultado: a árvore do servidor e a do cliente
   ficam diferentes e a hidratação quebra — com uma mensagem que
   não diz onde está o problema.
   Escrever o <tbody> na mão resolve. */
jsx = jsx.replace(/(<table[^>]*>)([\s\S]*?)(<\/table>)/g,
  (m, abre, dentro, fecha) =>
    /<tbody|<thead/.test(dentro) ? m : `${abre}<tbody>${dentro}</tbody>${fecha}`);

/* ---------- 8. chaves soltas no texto quebram o JSX ---------- */
jsx = jsx.replace(/>([^<]*)</g, (m, texto) => {
  if (!/[{}]/.test(texto)) return m;
  if (texto.includes('{/*') || texto.includes('{"')) return m;
  return '>' + texto.replace(/([{}])/g, '{\'$1\'}') + '<';
});

/* ---------- 8b. tira o que agora vem de moldura.tsx ----------
   Cabeçalho, rodapé, fundo decorativo e link de pular existem uma
   vez só, no layout. Note o `[^>]*` no <header>: a home usa
   `<header class="topbar" id="topbar">`, e um recorte que exigisse
   `>` logo depois de "topbar" deixaria passar. Deixou. */
/* CUIDADO: estes literais NÃO podem ter quebra de linha de verdade
   dentro deles. Uma edição anterior transformou os `\n` escritos em
   quebras reais e o arquivo inteiro parou de carregar, com
   "Invalid regular expression: missing /" — que não diz nada sobre
   a causa. Se precisar de fim de linha aqui, escreva `\n`. */
const RECORTES = [
  /\s*<header className="topbar"[^>]*>[\s\S]*?<\/header>\n?/g,
  /\s*<footer[^>]*>[\s\S]*?<\/footer>\n?/g,
  /\s*<div className="bg"><\/div>\n?/g,
  /\s*<div className="orbs"[\s\S]*?<\/div>\n?/g,
  /\s*<div className="grain"><\/div>\n?/g,
  /\s*<a className="pular"[\s\S]*?<\/a>\n?/g,
  /\s*<a className="skip"[\s\S]*?<\/a>\n?/g,
];
for (const r of RECORTES) jsx = jsx.replace(r, '\n');

/* endereços do protótipo → rotas de verdade */
const ROTAS = [
  ['href="index.html#politicas"', 'href="/#politicas"'],
  ['href="index.html"', 'href="/"'],
  ['href="privacidade.html"', 'href="/privacidade"'],
  ['href="termos.html"', 'href="/termos"'],
  ['href="reembolso.html"', 'href="/reembolso"'],
  ['href="cookies.html"', 'href="/cookies"'],
  ['href="denunciar.html"', 'href="/denunciar"'],
  ['href="planos.html"', 'href="/planos"'],
  ['href="registrar-loja.html"', 'href="/registrar-loja"'],
  ['href="resultado.html"', 'href="/resultado"'],
  ['src="assets/', 'src="/assets/'],
  ['spellcheck=', 'spellCheck='],
];
for (const [de, para] of ROTAS) jsx = jsx.split(de).join(para);

/* ---------- 8d. as @media do protótipo ----------
   AVISO IMPORTANTE. O CSS extraído vai para um .css separado, mas
   quem funde no globals costuma pular regras que começam com `@`
   para não duplicar media query. Foi assim que /denunciar e
   /registrar-loja perderam o colapso para uma coluna e abriram
   com duas colunas espremidas num celular.

   Este aviso existe para a próxima pessoa não repetir. */
const midias = [...(estilos.join('\n').match(/@media[^{]*\{/g) ?? [])];
if (midias.length) {
  avisos.push(
    `${midias.length} @media no CSS — NÃO os esqueça ao fundir no globals ` +
    `(é onde mora o responsivo)`,
  );
}

/* ---------- 9. monta o arquivo ---------- */
const saidaDir = join('src', 'app', '_portado');
mkdirSync(saidaDir, { recursive: true });

const arquivo = join(saidaDir, `${nomeComponente}.tsx`);
writeFileSync(arquivo,
`/* =============================================================
   GERADO por scripts/porta-pagina.mjs a partir de
   ${basename(entrada)}

   Foi conferido à mão depois? Se este aviso ainda estiver aqui,
   NÃO. Confira antes de publicar.
   ============================================================= */

export function ${nomeComponente}() {
  return (
    <>
${jsx.split('\n').map((l) => (l.trim() ? '      ' + l : '')).join('\n')}
    </>
  );
}
`, 'utf8');

if (estilos.length) {
  const css = join(saidaDir, `${nomeComponente}.css`);
  writeFileSync(css,
    `/* CSS extraído de ${basename(entrada)} por porta-pagina.mjs.\n` +
    `   Revise: pode haver regra que agora vive no globals.css. */\n\n` +
    estilos.join('\n\n'), 'utf8');
}

console.log(`\n  ${basename(entrada)} → ${arquivo}`);
if (avisos.length) {
  console.log('\n  PRECISA DE MÃO:');
  for (const a of avisos) console.log('    · ' + a);
}
console.log('');
