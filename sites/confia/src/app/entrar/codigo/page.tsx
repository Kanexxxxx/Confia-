import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { sessaoPendente } from '@/lib/sessao';
import { FormaCodigo } from './forma';

export const metadata: Metadata = { title: 'Código de verificação' };
export const dynamic = 'force-dynamic';

export default async function Codigo() {
  /* Sem sessão pela metade, esta tela não faz sentido. E é aqui
     que a tranca fecha: quem chegar direto no endereço, sem ter
     acertado a senha, volta para o começo. */
  const pendente = await sessaoPendente();
  if (!pendente) redirect('/entrar');

  return (
    <main className="porta" id="conteudo">
      <Link className="porta-marca" href="/" aria-label="confia? — início">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo-confia.svg" alt="confia?" />
      </Link>
      <FormaCodigo nome={pendente.nome.split(' ')[0]} />
    </main>
  );
}
