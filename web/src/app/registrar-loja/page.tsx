/* =============================================================
   confiia.com.br — /registrar-loja

   ─────────────────────────────────────────────────────────────
   A LATERAL É O ARGUMENTO, NÃO DECORAÇÃO

   Quem chega aqui está desconfiado: é uma loja pequena que
   apareceu com sinal de alerta num site que ela não escolheu. Os
   três blocos da lateral respondem, em ordem, as três perguntas
   que essa pessoa faz:

     1. "O que eu ganho?"        → os quatro níveis
     2. "Vocês vão me julgar?"   → o que o selo NÃO diz
     3. "E o estrago já feito?"  → como contestar

   O terceiro é o mais importante e por isso não fica escondido:
   quem já foi prejudicado precisa saber que existe recurso antes
   de decidir se confia na gente.
   ─────────────────────────────────────────────────────────────
   ============================================================= */

import type { Metadata } from 'next';
import { Cabecalho, Rodape } from '@/components/moldura';
import { EMAIL_CONTATO } from '@/lib/contato';
import { FormaLoja } from './forma';

export const metadata: Metadata = {
  title: 'Cadastrar minha loja',
  description:
    'Loja nova sofre desconfiança justamente por ser nova. Cadastre o CNPJ e o site: '
    + 'quem verificar sua loja vê que ela foi conferida por aqui. De graça.',
};

export const dynamic = 'force-dynamic';

const NIVEIS = [
  {
    n: 1,
    icone: 'bi-file-earmark-check',
    nome: 'Registrada',
    texto: 'CNPJ ativo conferido na Receita. Sai na hora.',
  },
  {
    n: 2,
    icone: 'bi-patch-check-fill',
    nome: 'Verificada',
    texto: 'Você provou que o site é seu. É o selo que aparece para o cliente.',
  },
  {
    n: 3,
    icone: 'bi-award-fill',
    nome: 'Estabelecida',
    texto: 'Mais de um ano de casa e nenhuma denúncia confirmada.',
  },
  {
    n: 4,
    icone: 'bi-star-fill',
    nome: 'Curadoria',
    texto: 'Conferimos uma a uma, à mão. Poucas chegam aqui.',
  },
];

export default function RegistrarLoja() {
  return (
    <>
      <Cabecalho atual="/registrar-loja" />

      <main id="conteudo">
        <div className="capa">
          <p className="eyebrow">
            <i className="bi bi-shop" aria-hidden="true" /> Para lojas e prestadores
          </p>
          <h1>Cadastre sua loja. De graça.</h1>
          <p className="lead">
            Loja nova sofre desconfiança justamente por ser nova — domínio recente e
            dados do dono ocultos são exatamente os sinais que a gente aponta.
            Cadastrando, quem verificar seu site vê que a empresa foi conferida por
            aqui, e não só os sinais de alerta.
          </p>
        </div>

        <div className="corpo">
          <aside className="lateral">
            <div className="bloco pane">
              <h2>
                <i className="bi bi-bar-chart-steps" aria-hidden="true" /> Os quatro níveis
              </h2>
              {/* Aqui a numeração encoda algo real: é uma ESCADA, e
                  cada degrau exige o anterior. Não é decoração. */}
              <ol className="escada">
                {NIVEIS.map((d) => (
                  <li className={`degrau degrau--${d.n}`} key={d.nome}>
                    <i className={`bi ${d.icone}`} aria-hidden="true" />
                    <span>
                      <b>{d.nome}</b>
                      <span>{d.texto}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="bloco pane">
              <h2>
                <i className="bi bi-exclamation-diamond" aria-hidden="true" /> O que o selo{' '}
                <em>não</em> diz
              </h2>
              <p>
                Que a empresa <b>é quem diz ser</b> — só isso, e é bastante.
              </p>
              <p>
                Ele não diz que o produto é bom, que a entrega é rápida nem que você vai
                gostar do atendimento. Não somos avaliação de compra.
              </p>
              <p>
                E não é para sempre: <b>3 denúncias confirmadas em 90 dias derrubam o
                selo sozinhas</b>, sem ninguém precisar decidir.
              </p>
            </div>

            <div className="bloco pane">
              <h2>
                <i className="bi bi-chat-left-quote" aria-hidden="true" /> Já apareceu com
                sinal ruim?
              </h2>
              <p>
                Se sua loja já foi verificada por alguém e o resultado te prejudicou, você
                pode contestar. A gente reanalisa e responde <b>em até 7 dias</b>.
              </p>
              <p>
                Não apagamos relato de consumidor sem prova de que é falso — mas
                publicamos a sua versão junto. As duas ficam visíveis.
              </p>
              <p>
                <a href={`mailto:${EMAIL_CONTATO}?subject=${encodeURIComponent('Contestar resultado')}`}>
                  Contestar um resultado
                </a>
              </p>
            </div>
          </aside>

          <div className="folha">
            <div className="passos">
              <i>1</i> <span>Dados da empresa</span>
              <span aria-hidden="true" className="passos-seta">›</span>
              <i>2</i> <span>Onde ela atende</span>
              <span aria-hidden="true" className="passos-seta">›</span>
              <i>3</i> <span>Provar que é sua</span>
            </div>

            <FormaLoja />
          </div>
        </div>
      </main>

      <Rodape />
    </>
  );
}
