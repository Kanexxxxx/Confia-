'use client';

/* =============================================================
   confiia.com.br — o menu de vidro, com o indicador que desliza

   Duas coisas que precisam de navegador e por isso vivem aqui:

   1. O INDICADOR QUE SEGUE O CURSOR. Uma pílula clara que desliza
      até o item sob o ponteiro e volta para o item atual quando
      o ponteiro sai. Sem ela o menu de vidro fica sem vida.

   2. O ESTADO DE ROLAGEM. Ao descer a página, o cabeçalho ganha
      um tom escuro no fundo. Não é enfeite: sobre o card branco
      do verificador, o vidro totalmente transparente deixa o
      texto do menu ilegível. O tom entra só quando precisa.

   CUIDADO AO MEXER:
     - O indicador é posicionado em pixels, medidos do DOM. Ele
       precisa ser recalculado quando a janela muda de tamanho —
       senão fica parado no lugar errado.
     - `aria-hidden` no indicador: ele é decoração. Quem usa
       leitor de tela já recebe o `aria-current` do link certo.
   ============================================================= */

import { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

type Item = { href: string; texto: string };

export function MenuVivo({ itens, atual }: { itens: Item[]; atual?: string }) {
  const menu = useRef<HTMLElement>(null);
  const pino = useRef<HTMLSpanElement>(null);

  const mover = useCallback((el: HTMLElement | null) => {
    if (!pino.current || !el) return;
    pino.current.style.width = `${el.offsetWidth}px`;
    pino.current.style.transform = `translateX(${el.offsetLeft}px)`;
  }, []);

  const voltarAoAtual = useCallback(() => {
    const el = menu.current?.querySelector<HTMLElement>('[aria-current="page"]')
      ?? menu.current?.querySelector<HTMLElement>('.nav-link');
    mover(el ?? null);
  }, [mover]);

  useEffect(() => {
    /* Primeiro posicionamento sem animação: senão o indicador
       "voa" da esquerda até o lugar toda vez que a página abre. */
    const p = pino.current;
    if (p) {
      p.style.transition = 'none';
      voltarAoAtual();
      requestAnimationFrame(() => { p.style.transition = ''; });
    }

    const aoRedimensionar = () => voltarAoAtual();
    addEventListener('resize', aoRedimensionar);

    /* Escurece o cabeçalho ao rolar. `passive` porque não
       cancelamos o evento — sem isso o navegador espera a função
       terminar antes de rolar, e a rolagem trava. */
    let pendente = false;
    const aoRolar = () => {
      if (pendente) return;
      pendente = true;
      requestAnimationFrame(() => {
        document.body.classList.toggle('is-scrolled', scrollY > 18);
        pendente = false;
      });
    };
    addEventListener('scroll', aoRolar, { passive: true });
    aoRolar();

    /* No celular o menu rola de lado e ganha um esmaecido na borda
       direita, que é o sinal de "tem mais aqui". Quando a pessoa
       chega no fim, o sinal sai — senão o último item fica apagado
       para sempre e parece desativado.

       Se mexer aqui, mexa também na regra `.glass[data-fim]` do
       globals.css: uma coisa não funciona sem a outra. */
    const faixa = menu.current;
    const aoRolarAFaixa = () => {
      if (!faixa) return;
      const sobra = faixa.scrollWidth - faixa.clientWidth - faixa.scrollLeft;
      /* 2px de folga: navegador arredonda e `sobra` quase nunca
         chega a zero exato. */
      faixa.toggleAttribute('data-fim', sobra <= 2);
    };
    faixa?.addEventListener('scroll', aoRolarAFaixa, { passive: true });
    aoRolarAFaixa();

    return () => {
      removeEventListener('resize', aoRedimensionar);
      removeEventListener('scroll', aoRolar);
      faixa?.removeEventListener('scroll', aoRolarAFaixa);
    };
  }, [voltarAoAtual]);

  return (
    <nav
      ref={menu}
      className="glass lg"
      id="nav"
      aria-label="Principal"
      onPointerLeave={voltarAoAtual}
    >
      <span className="lg-refract" />
      <span className="lg-tint" />
      <span className="lg-shine" />
      <span className="pin" id="pin" aria-hidden="true" ref={pino} />

      {itens.map((i) => (
        <Link
          key={i.href}
          className="nav-link"
          href={i.href}
          aria-current={atual === i.href ? 'page' : undefined}
          onPointerEnter={(e) => mover(e.currentTarget)}
          onFocus={(e) => mover(e.currentTarget)}
        >
          {i.texto}
        </Link>
      ))}
    </nav>
  );
}
