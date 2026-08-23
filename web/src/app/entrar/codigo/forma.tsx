'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { confirmaCodigoLogin, type Estado2FA } from '@/lib/acoes-seguranca';
import { BotaoEnviar, Recado } from '@/components/campos';

export function FormaCodigo({ nome }: { nome: string }) {
  const [estado, acao] = useActionState<Estado2FA, FormData>(confirmaCodigoLogin, null);
  const [reserva, setReserva] = useState(false);

  return (
    <div className="cartao-conta">
      <h1>Falta o código</h1>
      <p className="lead">
        Oi, {nome}. Abra o <b>Google Authenticator</b> no seu celular e digite o
        número de 6 dígitos que aparece para o confia?.
      </p>

      {estado?.erro && <Recado tipo="erro">{estado.erro}</Recado>}

      <form action={acao} noValidate>
        <input type="hidden" name="reserva" value={reserva ? '1' : '0'} />

        <div className="campo">
          <label htmlFor="codigo">
            {reserva ? 'Código de reserva' : 'Código do aplicativo'}
          </label>
          <input
            id="codigo"
            name="codigo"
            type="text"
            inputMode={reserva ? 'text' : 'numeric'}
            autoComplete="one-time-code"
            /* Sem isto o navegador do celular às vezes preenche com
               o CEP ou o cartão salvo, e a pessoa não entende. */
            placeholder={reserva ? 'ABCDE-FGHJK' : '000000'}
            maxLength={reserva ? 11 : 6}
            autoFocus
            required
            className={reserva ? undefined : 'codigo-grande'}
          />
          <span className="dica">
            {reserva
              ? 'Um dos dez códigos que você guardou ao ligar o segundo fator. Cada um vale uma vez.'
              : 'O número muda a cada 30 segundos. Se der errado, confira se a hora do celular está automática.'}
          </span>
        </div>

        <BotaoEnviar icone="bi-shield-check">Entrar</BotaoEnviar>
      </form>

      <div className="divide">ou</div>

      <button
        type="button"
        className="btn btn--calmo"
        onClick={() => setReserva((v) => !v)}
      >
        <i className={`bi ${reserva ? 'bi-phone' : 'bi-key'}`} aria-hidden="true" />
        {reserva ? 'Usar o aplicativo' : 'Perdi o celular — usar código de reserva'}
      </button>

      <p className="pe-conta">
        <Link href="/entrar">Entrar com outra conta</Link>
      </p>
    </div>
  );
}
