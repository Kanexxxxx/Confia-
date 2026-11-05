'use client';

/* =============================================================
   confiia.com.br — a navegação lateral do painel da conta

   É cliente por um motivo só: precisa saber em qual página a
   pessoa está para marcar o item atual. `usePathname` é o que
   dá isso, e ele só existe no navegador.

   ─────────────────────────────────────────────────────────────
   POR QUE `aria-current="page"` E NÃO SÓ UMA COR

   Quem enxerga vê o item aceso. Quem usa leitor de tela não vê
   cor nenhuma — precisa ouvir "página atual". São duas formas de
   dizer a mesma coisa, e as duas são obrigatórias.
   ─────────────────────────────────────────────────────────────

   CUIDADO AO MEXER:
     - A comparação é exata (`===`), não `startsWith`. Com
       `startsWith`, "/conta" ficaria marcado em TODAS as
       subpáginas, e a pessoa nunca saberia onde está.
     - Item novo aqui precisa de pasta correspondente em
       src/app/conta/. Link para rota que não existe vira 404 no
       meio do painel.
   ============================================================= */

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type ItemConta = {
  href: string;
  texto: string;
  icone: string;
  /* Mostrado em cinza ao lado do item — para avisar de pendência
     sem precisar abrir a página. */
  aviso?: string;
};

export function MenuConta({ itens }: { itens: ItemConta[] }) {
  const caminho = usePathname();

  return (
    <nav className="conta-nav" aria-label="Seções da sua conta">
      {itens.map((i) => {
        const atual = caminho === i.href;
        return (
          <Link
            key={i.href}
            href={i.href}
            className="conta-nav-item"
            aria-current={atual ? 'page' : undefined}
          >
            <i className={`bi ${i.icone}`} aria-hidden="true" />
            <span>{i.texto}</span>
            {i.aviso && <em className="conta-nav-aviso">{i.aviso}</em>}
          </Link>
        );
      })}
    </nav>
  );
}
