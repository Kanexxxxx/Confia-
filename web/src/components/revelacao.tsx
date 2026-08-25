'use client';

/* =============================================================
   confiia.com.br — a entrada da página e a revelação ao rolar

   Substitui o trecho final de prototipo/assets/confia.js. Faz
   três coisas, todas puramente visuais:

     1. ENTRADA. Marca <body class="is-ready"> no segundo quadro,
        e aí as linhas do título sobem e o card do verificador
        aparece.
     2. REVELAÇÃO. Cada bloco surge quando entra na tela, uma
        única vez — quem já viu não vê de novo ao rolar de volta.
     3. BRILHO DO VIDRO. O reflexo acompanha o ponteiro sobre
        qualquer superfície de vidro.

   ─────────────────────────────────────────────────────────────
   ISTO É DECORAÇÃO, E TEM QUE FALHAR BEM

   Nada aqui carrega informação. Se este componente não rodar, a
   regra `@media (scripting: enabled)` do globals.css também não
   se aplica, e a página nasce inteira e visível — ver o
   comentário longo lá.

   Quem pediu menos movimento (prefers-reduced-motion) recebe a
   página parada: o CSS vence com !important e este componente
   nem precisa saber disso.
   ─────────────────────────────────────────────────────────────

   CUIDADO AO MEXER:
     - `unobserve` depois de revelar não é economia à toa: sem
       ele o observador continua acordando a cada rolagem, na
       página inteira, para sempre.
     - O seletor de alvos é a lista de classes do desenho. Bloco
       novo que precise aparecer suave: ou ganha `rv` no JSX, ou
       entra em ALVOS aqui.
     - O `--d` de cada grade é o atraso em cascata. Ele é escrito
       aqui e lido pelo CSS em `transition-delay:var(--d)`.
   ============================================================= */

import { useEffect } from 'react';

/* Blocos que sobem ao entrar na tela. `.rv` é o que já vem
   marcado no JSX; o resto são as famílias de card do desenho. */
const ALVOS = '.rv, .sec-head, .step, .check, .pol, .aviso';

/* Grades cujos filhos aparecem em cascata, um depois do outro. */
const GRADES = ['.steps', '.grid-check', '.grid-pol'];

export function Revelacao() {
  useEffect(() => {
    /* --- cascata dos chips do herói ("Loja e marketplace", etc.) ---
       Começa em .44s para entrar depois do subtítulo, não junto. */
    const marks = document.getElementById('marks');
    if (marks) {
      Array.from(marks.children).forEach((el, i) => {
        el.classList.add('rv');
        (el as HTMLElement).style.setProperty('--d', `${(0.44 + i * 0.07).toFixed(2)}s`);
      });
    }

    /* --- entrada ---
       Dois requestAnimationFrame: o primeiro devolve o controle
       depois que o React montou, o segundo garante que o
       navegador já pintou o estado inicial. Marcar `is-ready`
       antes disso faz o navegador juntar as duas mudanças e a
       transição simplesmente não acontece. */
    let quadro = requestAnimationFrame(() => {
      quadro = requestAnimationFrame(() => document.body.classList.add('is-ready'));
    });

    /* --- atraso em cascata dentro de cada grade --- */
    for (const sel of GRADES) {
      const grade = document.querySelector(sel);
      if (!grade) continue;
      Array.from(grade.children).forEach((el, i) => {
        (el as HTMLElement).style.setProperty('--d', `${(i * 0.08).toFixed(2)}s`);
      });
    }

    /* --- revelação ao rolar --- */
    const alvos = Array.from(document.querySelectorAll<HTMLElement>(ALVOS));
    for (const el of alvos) el.classList.add('rv');

    let obs: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      obs = new IntersectionObserver(
        (entradas) => {
          for (const en of entradas) {
            if (!en.isIntersecting) continue;
            en.target.classList.add('is-in');
            obs?.unobserve(en.target);
          }
        },
        /* -12% embaixo: o bloco só conta como visível quando já
           entrou de verdade, não quando encosta a primeira linha
           na borda da tela. */
        { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
      );
      for (const el of alvos) obs.observe(el);
    } else {
      /* Navegador sem observador: mostra tudo de uma vez. Melhor
         sem animação do que com a página em branco. */
      for (const el of alvos) el.classList.add('is-in');
    }

    /* --- brilho que segue o ponteiro sobre o vidro ---
       Um só ouvinte no documento, em vez de um por superfície:
       `closest('.lg')` resolve qual vidro recebeu o movimento.
       O protótipo prendia um ouvinte em cada elemento, o que
       deixava de fora todo vidro criado depois. */
    const aoMover = (e: PointerEvent) => {
      const vidro = (e.target as Element | null)?.closest<HTMLElement>('.lg');
      if (!vidro) return;
      const r = vidro.getBoundingClientRect();
      vidro.style.setProperty('--mx', `${e.clientX - r.left}px`);
      vidro.style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    document.addEventListener('pointermove', aoMover, { passive: true });

    return () => {
      cancelAnimationFrame(quadro);
      obs?.disconnect();
      document.removeEventListener('pointermove', aoMover);
      /* `is-ready` sai junto: se a pessoa voltar para esta página
         pelo histórico, a entrada acontece de novo do começo. */
      document.body.classList.remove('is-ready');
    };
  }, []);

  return null;
}
