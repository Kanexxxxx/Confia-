import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { sessaoAtual } from '@/lib/sessao';
import { FormaCriarConta } from './forma';

export const metadata: Metadata = { title: 'Criar conta' };
export const dynamic = 'force-dynamic';

export default async function CriarConta() {
  if (await sessaoAtual()) redirect('/conta');

  return (
    <main className="porta" id="conteudo">
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
