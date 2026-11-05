/* =============================================================
   confiia.com.br — /noticias

   A dona do projeto decidiu em 27/08/2026 que a página de
   notícias puxaria de fonte externa.

   ─────────────────────────────────────────────────────────────
   POR QUE ESTA PÁGINA TEM DUAS PARTES, E NÃO UMA

   Medido antes de escrever: as quatro editorias da Agência Brasil
   devolvem 40 manchetes, e naquele dia NENHUMA falava de golpe —
   era agosto de eleição. O filtro estava certo (provado com oito
   casos); o feed do dia é que não tinha o assunto.

   Notícia de golpe não sai todo dia. Sai toda semana. Uma página
   que só mostrasse o feed do momento abriria vazia na maioria das
   visitas — e página vazia num site que pede confiança parece
   site abandonado.

   Então ela tem duas partes, e a segunda é a que nunca falha:

     1. O ARQUIVO que cresce. Vem do banco, alimentado pelo
        `npm run noticias`. Começa pequeno e vai enchendo.

     2. ONDE SE INFORMAR NA FONTE. Os órgãos oficiais que
        publicam alerta de golpe, com link direto. Isso vale hoje,
        vale com o arquivo vazio, e continua valendo depois — e é
        a parte que realmente resolve para quem chegou aqui
        desconfiado de alguma coisa.

   ⚠ A parte 2 NÃO é enfeite para tapar buraco. Se um dia o
   arquivo estiver cheio, ela fica: mandar a pessoa para a fonte
   primária é melhor conselho do que qualquer manchete que a gente
   republique.

   ─────────────────────────────────────────────────────────────
   O QUE ESTA PÁGINA NÃO FAZ, E POR QUÊ

   · Não copia o texto da matéria. Manchete + crédito + link é o
     que se pode republicar. O corpo é do veículo.
   · Não mostra a imagem da notícia. Ela vem de CDN de terceiro, e
     carregá-la entregaria o IP de cada visitante — contra a nossa
     Política de Privacidade e desfazendo o trabalho da Etapa 6,
     que tirou TODA requisição externa do navegador.
   · Não busca o feed no navegador de quem visita. Quem busca é o
     script, no nosso lado. O visitante só fala com a gente.

   ⚠ Se alguém acrescentar um `<img src="https://...">` aqui, a
   promessa de zero requisição externa cai — e ela está escrita na
   Política de Privacidade, não só no código.

   CUIDADO AO MEXER:
     - Esta rota entrou no menu no lugar de "Como funciona". Ver
       `components/moldura.tsx`.
     - As fontes oficiais abaixo são as MESMAS de
       `components/golpes.tsx`. Se um link cair lá, cai aqui.
   ============================================================= */

import type { Metadata } from 'next';
import { desc } from 'drizzle-orm';
import { Cabecalho, Rodape } from '@/components/moldura';
import { db } from '@/db';
import { noticiasGolpe } from '@/db/schema';

export const metadata: Metadata = {
  title: 'Notícias de golpe',
  description:
    'O que saiu na imprensa pública sobre golpe, fraude e estelionato — com link '
    + 'para a fonte. E onde se informar direto nos órgãos oficiais.',
};

/* Lê o banco a cada visita: o arquivo muda quando o script roda,
   e uma página de notícia servida de cache velho é o oposto do
   que ela promete. */
export const dynamic = 'force-dynamic';

/* Os órgãos que publicam alerta de golpe, com o assunto de cada
   um. Conferidos abrindo o endereço em 27/08/2026 — os mesmos
   quatro que sustentam as caixas de "saber mais" na home. */
const OFICIAIS = [
  {
    orgao: 'Receita Federal',
    oque: 'Manual "É Golpe?" — compras em site falso, cobrança por SMS, e-mail suspeito.',
    icone: 'bi-shield-check',
    url: 'https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/manuais/remessas-postal-e-expressa/e-golpe',
  },
  {
    orgao: 'Correios',
    oque: 'Mensagens falsas sobre encomendas — o golpe da taxa de alfândega.',
    icone: 'bi-box-seam',
    url: 'https://www.correios.com.br/central-de-informacoes/boletim-aos-clientes/mensagens-falsas-sobre-encomendas',
  },
  {
    orgao: 'CVM',
    oque: 'Alertas de oferta irregular e lista de quem está autorizado a investir seu dinheiro.',
    icone: 'bi-graph-up-arrow',
    url: 'https://www.gov.br/cvm/pt-br/assuntos/protecao/alertas/ofertas-atuacoes-irregulares',
  },
  {
    orgao: 'Ministério da Justiça',
    oque: 'Aliança Nacional de Combate a Fraudes Bancárias e Digitais.',
    icone: 'bi-bank',
    url: 'https://www.gov.br/mj/pt-br/assuntos/alianca-nacional-de-combate-a-fraudes-bancarias-digitais',
  },
];

function quando(d: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  }).format(d);
}

export default async function Noticias() {
  /* Se o banco estiver fora do ar, a página ainda abre com a
     parte oficial. Notícia é o extra; a fonte primária é o que
     não pode faltar. */
  let noticias: { id: string; titulo: string; link: string; fonte: string; publicadaEm: Date }[] = [];
  try {
    noticias = await db
      .select({
        id: noticiasGolpe.id,
        titulo: noticiasGolpe.titulo,
        link: noticiasGolpe.link,
        fonte: noticiasGolpe.fonte,
        publicadaEm: noticiasGolpe.publicadaEm,
      })
      .from(noticiasGolpe)
      .orderBy(desc(noticiasGolpe.publicadaEm))
      .limit(40);
  } catch {
    /* Silêncio de propósito: o bloco oficial abaixo continua. */
  }

  return (
    <>
      <Cabecalho atual="/noticias" />

      <main id="conteudo">
        <div className="capa">
          <p className="eyebrow">
            <i className="bi bi-newspaper" aria-hidden="true" /> Notícias
          </p>
          <h1>Golpe é notícia todo mês</h1>
          <p className="lead">
            Aqui ficam as manchetes da imprensa pública sobre golpe, fraude e estelionato —
            com link para a matéria no veículo de origem. Embaixo, os órgãos oficiais que
            publicam alerta: é lá que a informação nasce.
          </p>
        </div>

        <div className="corpo corpo--largo">
          <section className="folha" aria-labelledby="t-manchetes">
            <h2 id="t-manchetes">
              <i className="bi bi-rss" aria-hidden="true" /> O que saiu na imprensa
            </h2>

            {noticias.length > 0 ? (
              <>
                <ul className="manchetes">
                  {noticias.map((n) => (
                    <li key={n.id}>
                      {/* `target="_blank"` com `rel="noopener noreferrer"`:
                          a pessoa não perde a nossa página, e o site de
                          destino não ganha referência à janela nem sabe
                          de onde ela veio. */}
                      <a href={n.link} target="_blank" rel="noopener noreferrer">
                        {n.titulo}
                        <i className="bi bi-box-arrow-up-right" aria-hidden="true" />
                      </a>
                      <p className="manchete-pe">
                        {n.fonte} · {quando(n.publicadaEm)}
                      </p>
                    </li>
                  ))}
                </ul>
                <p className="manchetes-nota">
                  Só a manchete e o link. O texto da matéria é do veículo que escreveu —
                  clique para ler lá.
                </p>
              </>
            ) : (
              /* O VAZIO É DITO, NÃO DISFARÇADO.

                 A alternativa seria encher a lista com notícia
                 que não é sobre golpe, e aí a página mentiria
                 sobre o que ela é. Num site antigolpe isso é a
                 contradição inteira. */
              <div className="recado recado--info">
                <i className="bi bi-hourglass-split" aria-hidden="true" />
                <p>
                  <b>Ainda não há manchete guardada aqui.</b> Esta lista se enche com o
                  tempo: a gente lê os feeds públicos e guarda o que fala de golpe — e
                  isso não sai todo dia. Enquanto não houver, os órgãos oficiais logo
                  abaixo respondem melhor do que qualquer notícia.
                </p>
              </div>
            )}
          </section>

          <section className="folha" aria-labelledby="t-oficiais">
            <h2 id="t-oficiais">
              <i className="bi bi-building-check" aria-hidden="true" /> Onde a informação nasce
            </h2>
            <p className="forma-secao-nota">
              Estes são os órgãos que publicam alerta de golpe no Brasil. Vale guardar:
              quando chegar uma mensagem estranha em nome de algum deles, é aqui que você
              confere se aquilo existe.
            </p>

            <ul className="oficiais">
              {OFICIAIS.map((o) => (
                <li key={o.orgao}>
                  <i className={`bi ${o.icone}`} aria-hidden="true" />
                  <div>
                    <a href={o.url} target="_blank" rel="noopener noreferrer">
                      {o.orgao}
                      <i className="bi bi-box-arrow-up-right" aria-hidden="true" />
                    </a>
                    <span>{o.oque}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>

      <Rodape />
    </>
  );
}
