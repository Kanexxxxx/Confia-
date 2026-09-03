import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { sessaoAtual } from '@/lib/sessao';
import { FormaCriarConta } from './forma';

export const metadata: Metadata = { title: 'Criar conta' };
export const dynamic = 'force-dynamic';

export default async function CriarConta() {
  if (await sessaoAtual()) redirect('/conta');

  /* `porta--larga`: SO esta pagina abre em duas colunas no computador.
     /entrar usa a mesma `.porta` e tem dois campos; alargar la deixaria
     dois campos perdidos dentro de um cartao grande. A regra que faz
     isso esta em globals.css, no @media de 900px.
     ⚠ Comentario AQUI, e nao dentro do return: `return (` aceita UM
       elemento raiz, e um comentario JSX solto ao lado do <main> conta
       como segundo. Isso ja derrubou esta pagina uma vez. */
  return (
    <main className="porta porta--larga" id="conteudo">
      <Link className="porta-marca" href="/" aria-label="confia? — início">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo-confia.svg" alt="confia?" />
      </Link>
      <FormaCriarConta />
      <p className="abaixo">
        Guardamos o mínimo: seu nome, seu e-mail e o que você verificou.
        Nada de foto de documento, nada de dado bancário.
      </p>
    </main>
  );
}
