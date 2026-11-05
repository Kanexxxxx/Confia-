'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { entrar, type Estado } from '@/lib/acoes-conta';
import { Campo, CampoSenha, BotaoEnviar, Recado } from '@/components/campos';

export function FormaEntrar({
  destino, trocouSenha, saiu,
}: { destino?: string; trocouSenha?: boolean; saiu?: boolean }) {
  const [estado, acao] = useActionState<Estado, FormData>(entrar, null);

  return (
    <div className="cartao-conta">
      <h1>Entrar</h1>
      <p className="lead">Sua conta guarda o que você já verificou.</p>

      {trocouSenha && (
        <Recado tipo="ok">
          <b>Senha trocada.</b> Entre com a nova. Os outros aparelhos foram desconectados.
        </Recado>
      )}
      {saiu && <Recado tipo="info">Você saiu da sua conta.</Recado>}
      {estado?.erro && <Recado tipo="erro">{estado.erro}</Recado>}

      <form action={acao} noValidate>
        <input type="hidden" name="destino" value={destino ?? '/conta'} />

        <Campo
          nome="email"
          rotulo="E-mail"
          tipo="email"
          autoComplete="email"
          autoFocus
          erro={estado?.campo === 'email'}
        />

        <CampoSenha
          autoComplete="current-password"
          erro={estado?.campo === 'senha'}
        />

        <div style={{ marginTop: -6, marginBottom: 20, textAlign: 'right' }}>
          <Link href="/esqueci-senha" style={{ fontSize: 13.5, color: '#2970d3' }}>
            Esqueci minha senha
          </Link>
        </div>

        <BotaoEnviar icone="bi-box-arrow-in-right">Entrar</BotaoEnviar>
      </form>

      <p className="pe-conta">
        Ainda não tem conta? <Link href="/criar-conta">Criar agora</Link>
      </p>
    </div>
  );
}
