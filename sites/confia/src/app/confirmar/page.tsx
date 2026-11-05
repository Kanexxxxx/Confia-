/* =============================================================
   confiia.com.br — resultado da confirmação de e-mail

   Esta página não confirma nada: quem confirma é
   /api/confirmar, porque criar a sessão precisa gravar cookie.
   Aqui só mostramos o que aconteceu.
   ============================================================= */

import type { Metadata } from 'next';
import Link from 'next/link';
import { Recado } from '@/components/campos';

export const metadata: Metadata = { title: 'Confirmar e-mail' };
export const dynamic = 'force-dynamic';

const RECADOS = {
  invalido: 'Este link não é válido. Ele pode ter sido copiado pela metade.',
  expirado: 'Este link passou de 2 dias e não vale mais.',
  usado: 'Este e-mail já foi confirmado — você pode entrar normalmente.',
} as const;

type Erro = keyof typeof RECADOS;

export default async function Confirmar({
  searchParams,
}: { searchParams: Promise<{ ok?: string; erro?: string; enviado?: string }> }) {
  const q = await searchParams;
  const erro = (q.erro && q.erro in RECADOS ? q.erro : undefined) as Erro | undefined;

  return (
    <main className="porta" id="conteudo">
      <Link className="porta-marca" href="/" aria-label="confia? — início">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo-confia.svg" alt="confia?" />
      </Link>

      {/* acabou de criar conta */}
      {q.enviado === '1' && (
        <div className="cartao-conta">
          <h1>Confira seu e-mail</h1>
          <Recado tipo="ok">
            <b>Mandamos um link de confirmação.</b> Clique nele para ativar sua conta.
          </Recado>
          <p className="lead">
            Não chegou em alguns minutos? Procure na caixa de <b>spam</b> ou em{' '}
            <b>Promoções</b>. O link vale por 2 dias.
          </p>
          <div className="recado recado--info">
            <i className="bi bi-shield-check" aria-hidden="true" />
            <span>
              O e-mail vem de <b>naoresponda@confiia.com.br</b> e <b>nunca pede sua senha</b>.
              Se algum e-mail pedir dizendo que é da gente, é golpe.
            </span>
          </div>
          <Link className="btn btn--calmo" href="/entrar">Voltar para entrar</Link>
        </div>
      )}

      {/* deu certo */}
      {q.ok === '1' && (
        <div className="cartao-conta">
          <h1>Tudo certo</h1>
          <Recado tipo="ok">
            <b>E-mail confirmado.</b> Sua conta está ativa e você já está conectado.
          </Recado>
          <p className="lead">
            Agora é só colar um link, um @ ou um print quando bater a dúvida.
          </p>
          <Link className="btn btn--forte" href="/conta">Ir para minha conta</Link>
        </div>
      )}

      {/* deu errado */}
      {erro && (
        <div className="cartao-conta">
          <h1>Não deu para confirmar</h1>
          <Recado tipo={erro === 'usado' ? 'info' : 'aviso'}>{RECADOS[erro]}</Recado>
          <Link
            className="btn btn--forte"
            href={erro === 'usado' ? '/entrar' : '/criar-conta'}
          >
            {erro === 'usado' ? 'Entrar' : 'Criar conta'}
          </Link>
        </div>
      )}

      {/* endereço solto, sem nada */}
      {!q.enviado && !q.ok && !erro && (
        <div className="cartao-conta">
          <h1>Link incompleto</h1>
          <Recado tipo="aviso">
            Este endereço não traz o código de verificação. Copie o link inteiro do e-mail.
          </Recado>
          <Link className="btn btn--forte" href="/entrar">Ir para entrar</Link>
        </div>
      )}
    </main>
  );
}
