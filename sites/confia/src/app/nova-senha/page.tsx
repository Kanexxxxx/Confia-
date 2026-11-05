import type { Metadata } from 'next';
import Link from 'next/link';
import { FormaNovaSenha } from './forma';
import { Recado } from '@/components/campos';

export const metadata: Metadata = { title: 'Criar nova senha' };
export const dynamic = 'force-dynamic';

export default async function NovaSenha({
  searchParams,
}: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;

  return (
    <main className="porta" id="conteudo">
      <Link className="porta-marca" href="/" aria-label="confia? — início">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo-confia.svg" alt="confia?" />
      </Link>

      {t ? (
        <FormaNovaSenha token={t} />
      ) : (
        <div className="cartao-conta">
          <h1>Link incompleto</h1>
          <Recado tipo="aviso">
            Este endereço não traz o código de verificação. Ele costuma quebrar quando
            o e-mail corta o link no meio.
          </Recado>
          <p className="lead">
            Copie o endereço inteiro do e-mail, ou peça outro link.
          </p>
          <Link className="btn btn--forte" href="/esqueci-senha">Pedir outro link</Link>
        </div>
      )}
    </main>
  );
}
