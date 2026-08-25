'use client';

/* =============================================================
   confiia.com.br — o painel que conta os golpes em tempo real

   Inspirado nos painéis públicos que ficam rodando na rua (o do
   imposto, o da dívida): um número grande que sobe sozinho diz
   mais do que qualquer estatística parada. "24 milhões por ano" é
   abstrato; ver o número virar na sua frente, não.

   ─────────────────────────────────────────────────────────────
   DE ONDE VEM O NÚMERO — E POR QUE ELE NÃO É INVENTADO

   A Serasa Experian publicou: no 1º semestre de 2025, o Brasil
   registrou uma tentativa de fraude a cada 2,3 segundos.

   O painel NÃO inventa um total. Ele faz a única conta que a taxa
   permite: quantos segundos se passaram desde 1º de janeiro,
   dividido por 2,3. Isso é uma PROJEÇÃO a partir de um dado
   publicado, e a tela diz isso com todas as letras.

   Num site que existe para combater desinformação, número inflado
   seria o pior erro possível. Se a taxa for atualizada, mude só a
   constante abaixo.
   ─────────────────────────────────────────────────────────────
   CADA DÍGITO NA SUA CASINHA

   Os algarismos ficam em compartimentos separados, e só o que
   muda vira. Isso é o que dá a leitura de painel mecânico — e
   resolve um problema real de legibilidade: com o número inteiro
   num bloco só, TODA a linha parece piscar a cada atualização, e
   o olho não consegue pousar.

   A separação de milhar também é uma "casinha", mais estreita e
   sem borda. Ela nunca muda, então nunca anima.
   ─────────────────────────────────────────────────────────────

   POR QUE useSyncExternalStore E NÃO useState + useEffect

   O valor vem do relógio, que é uma fonte de fora do React e muda
   sozinha. Com useState eu precisaria chamar setState dentro do
   efeito só para dar o primeiro valor — o React 19 recusa isso, e
   com razão. Ele ainda resolve a hidratação de graça:
   `getServerSnapshot` devolve null e o servidor manda traços.

   CUIDADO AO MEXER:
     - `aria-hidden` nos dígitos é obrigatório. Número mudando
       duas vezes por segundo num leitor de tela é tortura. A
       leitura acessível é o parágrafo estático abaixo.
     - Quem pediu menos movimento recebe o painel parado, com o
       valor do instante em que abriu. O dado continua; só não
       pulsa.
   ============================================================= */

import { useSyncExternalStore } from 'react';

/* Serasa Experian, 1º semestre de 2025. */
const SEGUNDOS_POR_TENTATIVA = 2.3;

/* 2,3s por tentativa: 400ms faz o número subir de forma visível
   sem virar estroboscópio. */
const INTERVALO = 400;

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

function inicioDoAno() {
  return new Date(new Date().getFullYear(), 0, 1).getTime();
}

/* ---------- a fonte externa ----------
   Um relógio só, compartilhado. Se o componente aparecer duas
   vezes na página, elas contam juntas em vez de brigar.

   ATENÇÃO — O ERRO QUE ME CUSTOU UMA TELA BRANCA:

   `getSnapshot` do useSyncExternalStore NÃO pode devolver valor
   novo a cada chamada. O React chama essa função durante o render
   e compara com a anterior; se o valor SEMPRE muda — e
   `Date.now()` sempre muda — ele conclui que o estado externo
   nunca estabiliza, re-renderiza, chama de novo, e entra em laço
   infinito. A página morre com "This page couldn't load".

   A correção: o instante fica GUARDADO num campo, e só é
   atualizado quando o timer bate. Entre dois tiques, `getSnapshot`
   devolve exatamente o mesmo número — que é o que o React exige. */
const relogio = {
  abertura: 0,
  instante: 0,          // valor congelado entre um tique e outro
  ouvintes: new Set<() => void>(),
  timer: undefined as ReturnType<typeof setInterval> | undefined,

  assina(avisar: () => void) {
    if (this.abertura === 0) {
      this.abertura = Date.now();
      this.instante = this.abertura;
    }
    this.ouvintes.add(avisar);

    const parado = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!parado && this.timer === undefined) {
      this.timer = setInterval(() => {
        relogio.instante = Date.now();
        for (const o of relogio.ouvintes) o();
      }, INTERVALO);
    }
    return () => {
      this.ouvintes.delete(avisar);
      if (this.ouvintes.size === 0 && this.timer !== undefined) {
        clearInterval(this.timer);
        this.timer = undefined;
      }
    };
  },

  /* Todos leem de `instante`, nunca de Date.now(). */
  noAno: () => Math.floor((relogio.instante - inicioDoAno()) / 1000 / SEGUNDOS_POR_TENTATIVA),
  desdeQueAbriu: () =>
    relogio.abertura === 0
      ? 0
      : Math.floor((relogio.instante - relogio.abertura) / 1000 / SEGUNDOS_POR_TENTATIVA),
  agora: () => relogio.instante,
};

const semRelogio = () => null;

/* ---------- os compartimentos ---------- */
function Painel({ valor }: { valor: number | null }) {
  /* Sem valor ainda (servidor, ou primeiro quadro): traços do
     mesmo tamanho, para o bloco não pular quando o número chegar. */
  const texto = valor === null ? '—————––' : valor.toLocaleString('pt-BR');

  return (
    <p className="odo" aria-hidden="true">
      {[...texto].map((c, i) => (
        <span
          key={i}
          className={/\d/.test(c) ? 'odo-casa' : 'odo-sep'}
          /* `key` pelo ÍNDICE de propósito: a casa é um lugar fixo
             no painel, e o que muda é o algarismo dentro dela. Com
             key pelo valor, o React trocaria a casa inteira e a
             animação aconteceria no lugar errado. */
        >
          {c}
        </span>
      ))}
    </p>
  );
}

export function ContadorGolpes() {
  const noAno = useSyncExternalStore((a) => relogio.assina(a), relogio.noAno, semRelogio);
  const nesteMomento = useSyncExternalStore(
    (a) => relogio.assina(a), relogio.desdeQueAbriu, () => 0,
  );
  const agora = useSyncExternalStore((a) => relogio.assina(a), relogio.agora, semRelogio);

  const d = agora === null ? null : new Date(agora);
  const relogioTexto = d
    ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
    : '--:--:--';
  const dataTexto = d
    ? `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`
    : '—';

  return (
    <section className="contador" aria-labelledby="t-contador">
      <header className="contador-topo">
        <div className="contador-titulo">
          <span className="contador-ponto" aria-hidden="true" />
          <h3 id="t-contador">Tentativas de fraude no Brasil</h3>
        </div>
        {/* Data e hora: é o que transforma "um número na página" em
            "está acontecendo agora, enquanto você lê". */}
        <p className="contador-quando" aria-hidden="true">
          <span>{dataTexto}</span>
          <b>{relogioTexto}</b>
        </p>
      </header>

      <Painel valor={noAno} />

      <p className="contador-desde" aria-hidden="true">desde 1º de janeiro</p>

      <div className="contador-rodape">
        <p className="contador-vivo">
          {nesteMomento > 0 ? (
            <>
              <b>{nesteMomento.toLocaleString('pt-BR')}</b>{' '}
              {nesteMomento === 1 ? 'aconteceu' : 'aconteceram'} desde que você abriu
              esta página.
            </>
          ) : (
            <>Uma a cada 2,3 segundos. A próxima acontece antes de você terminar de ler isto.</>
          )}
        </p>

        <p className="contador-fonte">
          Projeção a partir da taxa publicada pela <b>Serasa Experian</b> — uma tentativa
          a cada 2,3 segundos, 1º semestre de 2025 — contada desde 1º de janeiro.
          Não é medição ao vivo: é a conta que essa taxa permite fazer.
        </p>
      </div>
    </section>
  );
}
