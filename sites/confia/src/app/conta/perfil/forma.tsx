'use client';

/* =============================================================
   confiia.com.br — o formulário de perfil

   Cliente por causa do `useActionState`: ele é quem devolve o
   erro do servidor sem recarregar a página e quem sabe dizer se
   o envio ainda está em andamento.

   CUIDADO AO MEXER:
     - `defaultValue`, e não `value`: estes campos são livres. Com
       `value` sem `onChange` o React congela a digitação.
     - O botão fica desabilitado enquanto envia. Sem isso, dois
       cliques rápidos mandam dois salvamentos.
     - O recado de erro está ligado ao formulário por
       `aria-live`: quem usa leitor de tela precisa OUVIR que
       deu erro, não descobrir procurando.
   ============================================================= */

import { useActionState } from 'react';
import { salvarPerfil } from '@/lib/acoes-perfil';
import { EscolheAvatar } from '@/components/escolhe-avatar';

export function FormaPerfil({
  nome, apelido, telefone, avatar,
}: {
  nome: string;
  apelido: string;
  telefone: string;
  avatar: string;
}) {
  const [estado, acao, enviando] = useActionState(salvarPerfil, null);

  return (
    <form action={acao} className="forma-perfil">
      <EscolheAvatar nome={apelido || nome} inicial={avatar} />

      <div className="campo">
        <label htmlFor="apelido">Como você quer ser chamado</label>
        <input
          id="apelido"
          name="apelido"
          type="text"
          maxLength={24}
          defaultValue={apelido}
          placeholder={nome.split(' ')[0]}
          autoComplete="nickname"
          aria-describedby="dica-apelido"
        />
        <p className="dica" id="dica-apelido">
          É o que aparece no cabeçalho do site. Deixe em branco para usar seu primeiro nome.
        </p>
      </div>

      <div className="campo">
        <label htmlFor="telefone">Telefone (opcional)</label>
        <input
          id="telefone"
          name="telefone"
          type="tel"
          inputMode="numeric"
          maxLength={16}
          defaultValue={telefone}
          placeholder="(16) 99999-9999"
          autoComplete="tel-national"
          aria-describedby="dica-telefone"
        />
        <p className="dica" id="dica-telefone">
          Serve como segunda porta se você perder o acesso ao e-mail. A gente não manda
          propaganda e não passa seu número para ninguém.
        </p>
      </div>

      {/* aria-live="polite": anuncia o resultado sem interromper o
          que a pessoa estiver fazendo. */}
      <div aria-live="polite">
        {estado?.erro && (
          <p className="recado recado--erro">
            <i className="bi bi-exclamation-circle-fill" aria-hidden="true" /> {estado.erro}
          </p>
        )}
        {estado?.ok && (
          <p className="recado recado--ok">
            <i className="bi bi-check-circle-fill" aria-hidden="true" /> {estado.ok}
          </p>
        )}
      </div>

      <button className="btn btn--forte" type="submit" disabled={enviando}>
        {enviando ? 'Salvando…' : 'Salvar alterações'}
      </button>
    </form>
  );
}
