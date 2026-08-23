'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { criarConta, type Estado } from '@/lib/acoes-conta';
import { Campo, CampoSenha, BotaoEnviar, Recado } from '@/components/campos';

export function FormaCriarConta() {
  const [estado, acao] = useActionState<Estado, FormData>(criarConta, null);

  return (
    <div className="cartao-conta">
      <h1>Criar conta</h1>
      <p className="lead">
        É de graça. Com conta você tem 5 verificações por mês e o histórico do
        que já conferiu.
      </p>

      {estado?.erro && <Recado tipo="erro">{estado.erro}</Recado>}

      <form action={acao} noValidate>
        <Campo
          nome="nome"
          rotulo="Como você quer ser chamado"
          autoComplete="given-name"
          autoFocus
          erro={estado?.campo === 'nome'}
        />

        <Campo
          nome="email"
          rotulo="E-mail"
          tipo="email"
          autoComplete="email"
          dica="Vamos mandar um link para confirmar que é seu."
          erro={estado?.campo === 'email'}
        />

        <CampoSenha
          autoComplete="new-password"
          dica="Pelo menos 10 caracteres. Três palavras que só você junta funcionam melhor que símbolo no meio."
          erro={estado?.campo === 'senha'}
        />

        <label className="aceite">
          <input type="checkbox" name="aceite" required />
          <span>
            Li e aceito os <Link href="/termos">Termos de uso</Link> e a{' '}
            <Link href="/privacidade">Política de Privacidade</Link>.
          </span>
        </label>

        <BotaoEnviar icone="bi-person-plus">Criar minha conta</BotaoEnviar>
      </form>

      <p className="pe-conta">
        Já tem conta? <Link href="/entrar">Entrar</Link>
      </p>
    </div>
  );
}
