'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/* Materiais do Optical Lab 01 e cortinas do CRM Motion Lab 001.
 * A navegação continua sendo do Next: não interceptamos clique, não criamos
 * espera artificial e não encobrimos formulário enquanto ele envia dados.
 * A cortina acompanha a página que acabou de chegar, com entrada e saída.
 */
export function CenaOptica() {
  const rota = usePathname();
  const anterior = useRef(rota);
  const cortina = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (anterior.current === rota) return;
    anterior.current = rota;
    const camada = cortina.current;
    if (!camada || matchMedia('(prefers-reduced-motion: reduce)').matches ||
        document.documentElement.dataset.animacao === 'reduzida') return;

    const movimentos = Array.from(camada.children).map((painel, i) => painel.animate([
      { transform: `translateX(${i === 0 ? '-110%' : '110%'})`, opacity: 0 },
      { transform: 'translateX(0)', opacity: 1, offset: 0.32 },
      { transform: `translateX(${i === 0 ? '110%' : '-110%'})`, opacity: 0 },
    ], { duration: 620, easing: 'cubic-bezier(.22,.7,.16,1)' }));

    const conteudo = document.querySelector('main');
    if (conteudo) movimentos.push(conteudo.animate([
      { opacity: 0.65, transform: 'translateY(12px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ], { duration: 420, easing: 'cubic-bezier(.22,.7,.16,1)' }));
    return () => movimentos.forEach((a) => a.cancel());
  }, [rota]);

  return <>
    <div className="optical-scene" aria-hidden="true">
      <div className="optical-blob optical-blob--violet" />
      <div className="optical-blob optical-blob--aqua" />
      <div className="optical-orbit" />
      <div className="optical-caustic" />
    </div>
    <div className="crystal-transition" ref={cortina} aria-hidden="true">
      <span /><span />
    </div>
  </>;
}
