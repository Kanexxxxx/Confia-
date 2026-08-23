'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { definirNovaSenha, type Estado } from '@/lib/acoes-conta';
import { CampoSenha, BotaoEnviar, Recado } from '@/components/campos';

export function FormaNovaSenha({ token }: { token: string }) {
  const [estado, acao] = useActionState<Estado, FormData>(definirNovaSenha, null);

  return (
    <div className="cartao-conta">
      <h1>Criar nova senha</h1>
      <p className="lead">
        Escolha uma senha que você não use em outro lugar. Se este site vazar um dia,
        a senha repetida abriria as suas outras contas junto.
      </p>

      {estado?.erro && <Recado tipo="erro">{estado.erro}</Recado>}

      <form action={acao} noValidate>
        <input type="hidden" name="token" value={token} />

        <CampoSenha
          rotulo="Nova senha"
          autoComplete="new-password"
          autoFocus
          dica="Pelo menos 10 caracteres."
          erro={estado?.campo === 'senha'}
        />
        <CampoSenha
          nome="repetida"
          rotulo="Repita a nova senha"
          autoComplete="new-password"
        />

        <div className="recado recado--info" style={{ marginBottom: 20 }}>
          <i className="bi bi-shield-lock-fill" aria-hidden="true" />
          <span>
            Ao salvar, <b>todos os aparelhos conectados serão desconectados</b> — inclusive
            este. É assim de propósito: se alguém tinha entrado na sua conta, sai agora.
          </span>
        </div>

        <BotaoEnviar icone="bi-check-lg">Salvar a nova senha</BotaoEnviar>
      </form>

      <p className="pe-conta">
        <Link href="/entrar">Voltar para entrar</Link>
      </p>
    </div>
  );
}
