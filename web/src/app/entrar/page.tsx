import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { sessaoAtual } from '@/lib/sessao';
import { FormaEntrar } from './forma';

export const metadata: Metadata = { title: 'Entrar' };
export const dynamic = 'force-dynamic';

export default async function Entrar({
  searchParams,
}: {
  searchParams: Promise<{ destino?: string; trocou?: string; saiu?: string }>;
}) {
  /* Em Next 16 searchParams é uma promessa. */
  const q = await searchParams;

  /* Já está logado? Não faz sentido mostrar a tela de entrar. */
  const quem = await sessaoAtual();
  if (quem) redirect('/conta');

  return (
    <main className="porta" id="conteudo">
      <Link className="porta-marca" href="/" aria-label="confia? — início">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo-confia.svg" alt="confia?" />
      </Link>

      <FormaEntrar
        destino={q.destino}
        trocouSenha={q.trocou === '1'}
        saiu={q.saiu === '1'}
      />

      <p className="abaixo">
        Ao entrar você concorda com os{' '}
        <Link href="/termos">Termos de uso</Link> e a{' '}
        <Link href="/privacidade">Política de Privacidade</Link>.
      </p>
    </main>
  );
}
