/* =============================================================
   confiia.com.br — varredura das páginas servidas

   Busca cada página no servidor de desenvolvimento e procura os
   defeitos que só aparecem no HTML pronto:

     · link para rota que devolve 404
     · link morto (href="#" ou vazio)
     · imagem sem alt
     · botão ou link sem nome acessível
     · campo de formulário sem rótulo
     · mais de um <h1>, ou nenhum
     · salto na hierarquia de títulos (h2 → h4)

   POR QUE NO HTML SERVIDO, E NÃO NO CÓDIGO:
   O código pode estar certo e a página sair errada — um
   componente condicional, um dado que não veio, um `map` vazio.
   O que a pessoa recebe é isto aqui.

   Uso:
     npm run confere-paginas

   CUIDADO AO MEXER:
     - Ele NÃO substitui olhar a página. Pega o que dá para
       automatizar; contraste, hierarquia visual e se o texto faz
       sentido continuam sendo trabalho de gente.
     - Página que exige login responde com redirecionamento e é
       pulada — testá-la exigiria sessão, e sessão de teste no
       script viraria porta dos fundos.
   ============================================================= */

const BASE = process.env.BASE ?? 'http://localhost:3000';

const PAGINAS = [
  '/', '/planos', '/denunciar', '/registrar-loja',
  '/termos', '/privacidade', '/cookies', '/reembolso',
  '/entrar', '/criar-conta', '/esqueci-senha',
];

const achados = [];
function anota(pagina, tipo, detalhe) {
  achados.push({ pagina, tipo, detalhe });
}

/* Extrai atributos de uma tag sem depender de biblioteca. */
function attrs(tag) {
  const m = {};
  for (const a of tag.matchAll(/([a-zA-Z-]+)\s*=\s*"([^"]*)"/g)) m[a[1]] = a[2];
  return m;
}

/* Texto visível dentro de um trecho, sem as tags. */
function texto(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

const paginasOk = new Set();

async function busca(caminho) {
  const r = await fetch(BASE + caminho, { redirect: 'manual' });
  return { status: r.status, html: r.status === 200 ? await r.text() : '' };
}

/* ---------- 1. todas as páginas respondem? ---------- */
const conteudo = new Map();
for (const p of PAGINAS) {
  const { status, html } = await busca(p);
  if (status === 200) {
    paginasOk.add(p);
    conteudo.set(p, html);
  } else if (status >= 300 && status < 400) {
    console.log(`  · ${p} redireciona (${status}) — exige login, pulando`);
  } else {
    anota(p, 'PAGINA', `respondeu ${status}`);
  }
}

/* ---------- 2. defeitos dentro de cada página ---------- */
const destinosInternos = new Set();

for (const [pagina, html] of conteudo) {
  /* --- corpo só, sem os scripts do Next --- */
  const corpo = html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '');

  /* --- links --- */
  for (const m of corpo.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)) {
    const a = attrs('<a ' + m[1] + '>');
    const href = a.href ?? '';
    const nome = a['aria-label'] || texto(m[2]);

    if (!href || href === '#') {
      anota(pagina, 'LINK MORTO', `href="${href}" — "${nome.slice(0, 40)}"`);
    } else if (href.startsWith('/') && !href.startsWith('//')) {
      destinosInternos.add(href.split('#')[0].split('?')[0] || '/');
    }

    if (!nome) {
      anota(pagina, 'LINK SEM NOME', `href="${href}"`);
    }

    /* Aba nova sem rel=noopener dá à página aberta acesso à sua
       pela window.opener — via de sequestro de aba. */
    if (a.target === '_blank' && !(a.rel ?? '').includes('noopener')) {
      anota(pagina, 'ABA NOVA SEM noopener', href);
    }
  }

  /* --- imagens --- */
  for (const m of corpo.matchAll(/<img\b([^>]*)>/g)) {
    const a = attrs(m[0]);
    if (a.alt === undefined) {
      anota(pagina, 'IMG SEM alt', a.src ?? '(sem src)');
    }
  }

  /* --- botões sem nome --- */
  for (const m of corpo.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
    const a = attrs('<button ' + m[1] + '>');
    const nome = a['aria-label'] || texto(m[2]);
    if (!nome) anota(pagina, 'BOTAO SEM NOME', m[0].slice(0, 70));
  }

  /* --- campos sem rótulo ---

     Um campo pode ser rotulado de TRÊS formas, e as três valem:

       1. <label for="x"> … <input id="x">      (explícita)
       2. <label>Texto <input></label>          (implícita: o
          campo mora DENTRO do rótulo)
       3. aria-label / aria-labelledby

     A primeira versão deste verificador só conhecia a 1 e a 3, e
     acusava os nove rádios do formulário de denúncia — que usam a
     2, que é justamente a forma correta para caixinha de escolha.

     Campo com o atributo `hidden` também sai: ele não está na
     tela e não recebe foco. */
  const rotulosPorFor = new Set(
    [...corpo.matchAll(/<label\b([^>]*)>/g)]
      .map((m) => attrs(m[0]).for)
      .filter(Boolean),
  );

  /* Tudo que está DENTRO de algum <label>…</label>. */
  const dentroDeLabel = [...corpo.matchAll(/<label\b[^>]*>([\s\S]*?)<\/label>/g)]
    .map((m) => m[1])
    .join('\n');

  for (const m of corpo.matchAll(/<(input|select|textarea)\b([^>]*)>/g)) {
    const a = attrs(m[0]);
    if (a.type === 'hidden' || /(^|\s)hidden(\s|=|$)/.test(m[2])) continue;

    const temNome =
      a['aria-label'] ||
      a['aria-labelledby'] ||
      (a.id && rotulosPorFor.has(a.id)) ||
      dentroDeLabel.includes(m[0]);

    if (!temNome) {
      anota(pagina, 'CAMPO SEM ROTULO', `<${m[1]} id="${a.id ?? ''}" name="${a.name ?? ''}">`);
    }
  }

  /* --- títulos --- */
  const titulos = [...corpo.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/g)]
    .map((m) => ({ nivel: Number(m[1]), texto: texto(m[2]).slice(0, 44) }));

  const h1 = titulos.filter((t) => t.nivel === 1);
  if (h1.length === 0) anota(pagina, 'SEM H1', 'nenhum título principal');
  if (h1.length > 1) anota(pagina, 'H1 REPETIDO', `${h1.length} títulos principais`);

  let anterior = 0;
  for (const t of titulos) {
    if (anterior && t.nivel > anterior + 1) {
      anota(pagina, 'SALTO DE TITULO', `h${anterior} → h${t.nivel} em "${t.texto}"`);
    }
    anterior = t.nivel;
  }
}

/* ---------- 3. os destinos internos existem? ---------- */
const testados = new Map();
for (const destino of [...destinosInternos].sort()) {
  if (testados.has(destino)) continue;
  const r = await fetch(BASE + destino, { redirect: 'manual' });
  testados.set(destino, r.status);
  if (r.status === 404) {
    anota('(vários)', 'DESTINO 404', destino);
  }
}

/* ---------- relatório ---------- */
console.log('');
if (achados.length === 0) {
  console.log(`  ${conteudo.size} páginas varridas, nenhum defeito.\n`);
  process.exit(0);
}

const porTipo = new Map();
for (const a of achados) {
  if (!porTipo.has(a.tipo)) porTipo.set(a.tipo, []);
  porTipo.get(a.tipo).push(a);
}

console.log(`  ${achados.length} defeito(s) em ${conteudo.size} páginas:\n`);
for (const [tipo, lista] of [...porTipo].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`  ${tipo} (${lista.length})`);
  for (const a of lista.slice(0, 8)) {
    console.log(`     ${a.pagina.padEnd(17)} ${a.detalhe}`);
  }
  if (lista.length > 8) console.log(`     … e mais ${lista.length - 8}`);
  console.log('');
}
process.exit(1);
