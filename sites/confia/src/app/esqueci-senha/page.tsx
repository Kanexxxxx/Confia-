import type { Metadata } from 'next';
import Link from 'next/link';
import { FormaEsqueci } from './forma';

export const metadata: Metadata = { title: 'Esqueci minha senha' };

export default function Esqueci() {
  return (
    <main className="porta" id="conteudo">
      <Link className="porta-marca" href="/" aria-label="confia? — início">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo-confia.svg" alt="confia?" />
      </Link>
      <FormaEsqueci />
    </main>
  );
}
