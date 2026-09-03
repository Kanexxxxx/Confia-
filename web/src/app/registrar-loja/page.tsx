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
import { carimboDeAgora } from '@/lib/armadilha';

export const metadata: Metadata = {
  title: 'Cadastrar minha loja',
  description:
    'Loja nova sofre desconfiança justamente por ser nova. Cadastre o CNPJ e o site: '
    + 'quem verificar sua loja vê que ela foi conferida por aqui. De graça.',
};

export const dynamic = 'force-dynamic';

/* OS ÍCONES DOS QUATRO NÍVEIS — refeitos em 27/08/2026

   A dona do projeto disse que um deles "parece que está
   quebrado". Estava certa, e não era ícone faltando: o
   `npm run confere-icones` passava, porque todos os quatro
   existiam mesmo no pacote.

   Eram DOIS defeitos visuais, os dois só visíveis ampliando:

     1. `bi-file-earmark-check` é ícone de CONTORNO, e os outros
        três eram PREENCHIDOS. Contorno fino, em cinza de 55% de
        opacidade, sobre fundo escuro, lê exatamente como ícone
        que não carregou. Virou a versão `-fill`.

     2. `bi-award-fill` (a medalha) vira um borrão verde nesse
        tamanho — a fita embaixo do círculo some e o desenho não
        lê como medalha. Trocado por `bi-calendar-check-fill`,
        que além de ler melhor DIZ o que o nível significa: mais
        de um ano de casa.

   ⚠ REGRA PARA MEXER AQUI: os quatro têm que ser do mesmo peso
   (todos `-fill`). Misturar contorno e preenchido na mesma
   escada faz o de contorno parecer defeito, não escolha. */
const NIVEIS = [
  {
    n: 1,
    icone: 'bi-file-earmark-check-fill',
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
    icone: 'bi-calendar-check-fill',
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
                <i className="bi bi-patch-question" aria-hidden="true" /> O que o selo diz
              </h2>

              {/* REESCRITO EM 27/08/2026

                  A dona do projeto leu e não entendeu o que o selo
                  dizia. O motivo estava na estrutura, não nas
                  palavras: o título era "o que o selo NÃO diz" e o
                  primeiro parágrafo dizia o que ele DIZ. Quem lia
                  na ordem levava uma contradição na primeira
                  linha e desistia.

                  Agora são duas colunas de significado, cada uma
                  com o seu rótulo, e a frase mais curta possível
                  em cada lado. "Se eu não entendi, ninguém vai
                  entender" — e ela tinha razão. */}
              <div className="selo-diz">
                <p className="selo-sim">
                  <i className="bi bi-check-circle-fill" aria-hidden="true" />
                  <span>
                    <b>Que a empresa existe e é quem diz ser.</b> O CNPJ está ativo, e o
                    site é mesmo dela.
                  </span>
                </p>
                <p className="selo-nao">
                  <i className="bi bi-x-circle-fill" aria-hidden="true" />
                  <span>
                    <b>Não diz que a loja é boa.</b> Nada sobre produto, prazo de entrega
                    ou atendimento. Loja honesta também atrasa, e isso não é golpe.
                  </span>
                </p>
              </div>

              <p className="selo-cai">
                <i className="bi bi-hourglass-split" aria-hidden="true" />
                <span>
                  E ele não é para sempre: <b>5 denúncias confirmadas em 90 dias derrubam
                  o selo sozinhas</b>, sem ninguém precisar decidir.{' '}
                  <b>Confirmadas</b> — denúncia que ninguém analisou não conta, senão
                  bastaria um concorrente com paciência.
                </span>
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

            <FormaLoja carimbo={carimboDeAgora()} />
          </div>
        </div>
      </main>

      <Rodape />
    </>
  );
}
