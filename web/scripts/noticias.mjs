/* =============================================================
   confiia.com.br — puxar notícias de golpe de fonte pública

   Uso:
     npm run noticias              → busca e grava as novas
     npm run noticias -- --seco    → mostra o que acharia, sem gravar
     npm run noticias -- --lista   → o que já está guardado

   ─────────────────────────────────────────────────────────────
   POR QUE ESTE SCRIPT EXISTE, E NÃO UMA BUSCA NA HORA

   Medido antes de escrever, em 27/08/2026: as seis editorias da
   Agência Brasil devolvem 10 itens cada, e naquele dia NENHUM dos
   60 falava de golpe — era agosto de eleição e o feed inteiro era
   eleitoral.

   Uma página que filtrasse o feed ao vivo abriria vazia na
   maioria dos dias. Notícia de golpe não sai todo dia; sai toda
   semana. O que serve é acumular.

   Então: este script roda de tempos em tempos, guarda o que
   achou, e a página lê do banco. Ver a migração 019.

   ─────────────────────────────────────────────────────────────
   TRÊS REGRAS QUE NÃO SE NEGOCIAM

   1. SÓ MANCHETE, LINK, FONTE E DATA. O `description` do RSS traz
      a matéria inteira e imagem de CDN de terceiro. Copiar o
      texto é violar direito autoral do veículo. Exibir a imagem
      entrega o IP de cada visitante ao CDN — contra a nossa
      Política de Privacidade, e desfazendo o trabalho da Etapa 6,
      que tirou toda requisição externa do navegador.

   2. A BUSCA ACONTECE AQUI, NUNCA NO NAVEGADOR DE QUEM VISITA.
      Este script roda na sua máquina ou no servidor. O visitante
      só fala com a gente.

   3. NADA É INVENTADO. Se o filtro não achar nada, o script diz
      "nada novo" e a página continua com o que já tinha. Ela
      nunca preenche espaço com notícia que não é sobre golpe.

   ─────────────────────────────────────────────────────────────
   CUIDADO AO MEXER:
     - Conecta como DONO (`DATABASE_URL_MIGRACAO`). É de propósito:
       a aplicação só tem SELECT nesta tabela. Rota pública com
       poder de gravar numa tabela alimentada de fora seria um
       jeito de estranho plantar link no nosso site.
     - `link` é UNIQUE no banco. É o que faz rodar duas vezes não
       duplicar nada — o script não precisa ser esperto, o banco
       resolve.
     - Se a Agência Brasil mudar o endereço dos feeds, o script
       avisa e segue com os que responderam. Fonte fora do ar não
       pode derrubar as outras.
   ============================================================= */

import postgres from 'postgres';

const args = process.argv.slice(2);
const seco = args.includes('--seco');
const listar = args.includes('--lista');

/* AS FONTES

   Agência Brasil é a agência pública de notícias da EBC (empresa
   pública federal). Escolhida porque: é pública, é gratuita, tem
   RSS estável, e não é um veículo que a gente precise pedir
   licença para citar manchete.

   ⚠ Ao acrescentar fonte nova, confira se ela tem RSS e se a
   licença permite citar manchete com link. Não ponha veículo que
   proíba — o custo não é técnico, é jurídico. */
const FONTES = [
  { nome: 'Agência Brasil', secao: 'justica',          url: 'https://agenciabrasil.ebc.com.br/rss/justica/feed.xml' },
  { nome: 'Agência Brasil', secao: 'economia',         url: 'https://agenciabrasil.ebc.com.br/rss/economia/feed.xml' },
  { nome: 'Agência Brasil', secao: 'geral',            url: 'https://agenciabrasil.ebc.com.br/rss/geral/feed.xml' },
  { nome: 'Agência Brasil', secao: 'direitos-humanos', url: 'https://agenciabrasil.ebc.com.br/rss/direitos-humanos/feed.xml' },
];

/* O FILTRO

   Palavras que indicam que a notícia é sobre o nosso assunto.
   Cada uma é testada no TÍTULO, sem acento e em minúscula.

   ⚠ Palavra curta demais aqui vira lixo na página. "pix" sozinho
   pegaria toda notícia de economia que menciona Pix; por isso ele
   entra só acompanhado ("golpe do pix"). Prefira errar para menos:
   página com cinco notícias certas vale mais que trinta duvidosas. */
const PALAVRAS = [
  'golpe', 'golpes', 'fraude', 'fraudes', 'estelionato', 'estelionatario',
  'phishing', 'falso site', 'site falso', 'perfil falso', 'aplicativo falso',
  'clonagem', 'clonado', 'clonada', 'falsificacao',
  'golpe do pix', 'roubo de dados', 'vazamento de dados',
  'crime cibernetico', 'crimes ciberneticos', 'ciberataque',
  'consumidor alerta', 'procon alerta',
];

const semAcento = (t) =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/* Leitor de RSS mínimo, escrito à mão.

   Não vale trazer uma biblioteca para isto: são três campos, e
   dependência nova é superfície nova para auditar — o projeto tem
   `npm audit` em 0 falhas e a intenção é continuar. */
function leRss(xml) {
  const itens = [];
  for (const bloco of xml.split('<item>').slice(1)) {
    const pega = (tag) => {
      const m = bloco.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
      if (!m) return null;
      return m[1]
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        .trim();
    };
    const titulo = pega('title');
    const link = pega('link');
    const data = pega('pubDate') || pega('dc:date');
    /* `description` é lido DE PROPÓSITO nenhuma vez. Ver a regra 1
       no topo: o texto da matéria não é nosso para republicar. */
    if (titulo && link) itens.push({ titulo, link, data });
  }
  return itens;
}

async function busca(fonte) {
  try {
    const r = await fetch(fonte.url, {
      /* ⚠ SÓ ASCII AQUI. Cabeçalho HTTP é ByteString: qualquer
         caractere acima de 255 derruba o fetch antes de sair da
         máquina. Esta linha tinha um travessão (—, U+2014) e os
         quatro feeds falhavam com uma mensagem que não dizia isso.
         Nada de acento, nada de travessão, nada de emoji. */
      headers: { 'User-Agent': 'confia? (confiia.com.br) - leitor de RSS' },
      signal: AbortSignal.timeout(20_000),
    });
    if (!r.ok) {
      console.log(`  aviso  ${fonte.secao.padEnd(18)} HTTP ${r.status} — seguindo sem ela`);
      return [];
    }
    return leRss(await r.text()).map((i) => ({ ...i, fonte: fonte.nome }));
  } catch (e) {
    console.log(`  aviso  ${fonte.secao.padEnd(18)} ${e instanceof Error ? e.message : e}`);
    return [];
  }
}

function interessa(titulo) {
  const t = semAcento(titulo);
  return PALAVRAS.find((p) => t.includes(p)) ?? null;
}

async function principal() {
  const conexao = process.env.DATABASE_URL_MIGRACAO;
  if (!conexao) {
    console.log('\n  Falta DATABASE_URL_MIGRACAO no .env.local.');
    console.log('  Este script grava, então conecta como dono — ver o topo.\n');
    return 1;
  }
  const sql = postgres(conexao, { max: 1 });

  try {
    if (listar) {
      const guardadas = await sql`
        SELECT titulo, fonte, publicada_em, achada_por
          FROM noticias_golpe ORDER BY publicada_em DESC LIMIT 40`;
      console.log(`\n  ${guardadas.length} notícia(s) guardada(s):\n`);
      for (const n of guardadas) {
        const d = new Intl.DateTimeFormat('pt-BR').format(n.publicadaEm ?? n.publicada_em);
        console.log(`    ${d}  [${n.achada_por ?? n.achadaPor}]  ${n.titulo.slice(0, 74)}`);
      }
      console.log();
      return 0;
    }

    console.log('\n  Buscando nos feeds públicos…\n');
    const todas = (await Promise.all(FONTES.map(busca))).flat();
    console.log(`  ${todas.length} manchete(s) lida(s) em ${FONTES.length} feed(s).`);

    const escolhidas = [];
    for (const n of todas) {
      const palavra = interessa(n.titulo);
      if (palavra) escolhidas.push({ ...n, palavra });
    }

    console.log(`  ${escolhidas.length} fala(m) de golpe.\n`);

    if (!escolhidas.length) {
      console.log('  Nada novo desta vez, e isso é normal: notícia de golpe');
      console.log('  não sai todo dia. A página continua com o que já tinha —');
      console.log('  ela não inventa nem enche espaço com assunto que não é.\n');
      return 0;
    }

    for (const n of escolhidas) {
      console.log(`    [${n.palavra}] ${n.titulo.slice(0, 78)}`);
    }
    console.log();

    if (seco) {
      console.log('  --seco: nada foi gravado.\n');
      return 0;
    }

    let novas = 0;
    for (const n of escolhidas) {
      const quando = n.data ? new Date(n.data) : new Date();
      if (Number.isNaN(quando.getTime())) continue;
      /* ON CONFLICT no `link`: rodar de novo não duplica. A trava
         é do banco, não da esperteza deste script. */
      const r = await sql`
        INSERT INTO noticias_golpe (titulo, link, fonte, publicada_em, achada_por)
        VALUES (${n.titulo}, ${n.link}, ${n.fonte}, ${quando}, ${n.palavra})
        ON CONFLICT (link) DO NOTHING
        RETURNING id`;
      if (r.length) novas++;
    }

    console.log(`  ${novas} nova(s) guardada(s). ${escolhidas.length - novas} já estava(m) lá.\n`);
    return 0;
  } catch (e) {
    console.error(`\n  ERRO: ${e instanceof Error ? e.message : e}\n`);
    return 1;
  } finally {
    await sql.end();
  }
}

process.exitCode = await principal();
