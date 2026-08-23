'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { pedirNovaSenha, type Estado } from '@/lib/acoes-conta';
import { Campo, BotaoEnviar, Recado } from '@/components/campos';

export function FormaEsqueci() {
  const [estado, acao] = useActionState<Estado, FormData>(pedirNovaSenha, null);

  /* Depois de enviar, some com o formulário: deixar o campo ali
     convida a pessoa a mandar de novo achando que não foi. */
  if (estado?.ok) {
    return (
      <div className="cartao-conta">
        <h1>Confira seu e-mail</h1>
        <Recado tipo="ok">{estado.ok}</Recado>
        <p className="lead" style={{ marginTop: 18 }}>
          O link chega em alguns segundos. Se não aparecer, procure na caixa de spam —
          e confira se digitou o mesmo e-mail do cadastro.
        </p>
        <Link className="btn btn--calmo" href="/entrar">Voltar para entrar</Link>
      </div>
    );
  }

  return (
    <div className="cartao-conta">
      <h1>Esqueci minha senha</h1>
      <p className="lead">
        Diga seu e-mail e mandamos um link para você criar outra. Sua senha atual
        continua valendo até você terminar.
      </p>

      {estado?.erro && <Recado tipo="erro">{estado.erro}</Recado>}

      <form action={acao} noValidate>
        <Campo
          nome="email"
          rotulo="E-mail da conta"
          tipo="email"
          autoComplete="email"
          autoFocus
          erro={estado?.campo === 'email'}
        />
        <BotaoEnviar icone="bi-envelope">Mandar o link</BotaoEnviar>
      </form>

      <p className="pe-conta">
        Lembrou? <Link href="/entrar">Voltar para entrar</Link>
      </p>
    </div>
  );
}
