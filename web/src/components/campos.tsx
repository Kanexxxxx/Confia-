'use client';

/* =============================================================
   confiia.com.br — peças de formulário

   Ficam separadas porque se repetem em entrar, criar conta e
   nova senha. Uma correção de acessibilidade aqui vale para as
   três telas.

   CUIDADO AO MEXER:
     - O botão de mostrar senha precisa de aria-pressed e de
       aria-label que MUDA conforme o estado. Sem isso, quem usa
       leitor de tela não sabe se a senha está visível.
   ============================================================= */

import { useState, useId } from 'react';
import { useFormStatus } from 'react-dom';

/* ---------- recado de erro ou sucesso ---------- */
export function Recado({
  tipo, children,
}: { tipo: 'erro' | 'ok' | 'info' | 'aviso'; children: React.ReactNode }) {
  const icones = {
    erro: 'bi-exclamation-circle-fill',
    ok: 'bi-check-circle-fill',
    info: 'bi-info-circle-fill',
    aviso: 'bi-exclamation-triangle-fill',
  } as const;

  return (
    /* role="alert" faz o leitor de tela anunciar na hora que
       aparece — sem isso a pessoa preenche de novo sem saber
       que deu erro. */
    <div className={`recado recado--${tipo}`} role={tipo === 'erro' ? 'alert' : 'status'}>
      <i className={`bi ${icones[tipo]}`} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

/* ---------- campo de texto ---------- */
export function Campo({
  nome, rotulo, tipo = 'text', dica, autoComplete, obrigatorio = true,
  autoFocus, valorInicial, erro,
}: {
  nome: string; rotulo: string; tipo?: string; dica?: string;
  autoComplete?: string; obrigatorio?: boolean; autoFocus?: boolean;
  valorInicial?: string; erro?: boolean;
}) {
  const id = useId();
  const idDica = dica ? `${id}-dica` : undefined;

  return (
    <div className={`campo${erro ? ' erro' : ''}`}>
      <label htmlFor={id}>{rotulo}</label>
      <input
        id={id}
        name={nome}
        type={tipo}
        required={obrigatorio}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        defaultValue={valorInicial}
        aria-describedby={idDica}
        aria-invalid={erro || undefined}
      />
      {dica && <span className="dica" id={idDica}>{dica}</span>}
    </div>
  );
}

/* ---------- campo de senha, com mostrar/esconder ---------- */
export function CampoSenha({
  nome = 'senha', rotulo = 'Senha', dica, autoComplete = 'current-password',
  autoFocus, erro,
}: {
  nome?: string; rotulo?: string; dica?: string;
  autoComplete?: string; autoFocus?: boolean; erro?: boolean;
}) {
  const [vendo, setVendo] = useState(false);
  const id = useId();
  const idDica = dica ? `${id}-dica` : undefined;

  return (
    <div className={`campo${erro ? ' erro' : ''}`}>
      <label htmlFor={id}>{rotulo}</label>

      {/* O invólucro existe só para o botão se posicionar pelo CAMPO,
          e não pela caixa inteira — que inclui rótulo e dica. */}
      <span className="caixa-senha">
        <input
          id={id}
          name={nome}
          type={vendo ? 'text' : 'password'}
          required
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          aria-describedby={idDica}
          aria-invalid={erro || undefined}
        />
        <button
          type="button"
          onClick={() => setVendo((v) => !v)}
          aria-pressed={vendo}
          aria-label={vendo ? 'Esconder a senha' : 'Mostrar a senha'}
          aria-controls={id}
        >
          <i className={`bi ${vendo ? 'bi-eye-slash' : 'bi-eye'}`} aria-hidden="true" />
        </button>
      </span>

      {dica && <span className="dica" id={idDica}>{dica}</span>}
    </div>
  );
}

/* ---------- botão que mostra que está trabalhando ----------
   Sem isto a pessoa clica de novo achando que não funcionou, e
   a ação roda duas vezes. */
export function BotaoEnviar({
  children, icone,
}: { children: React.ReactNode; icone?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      className="btn btn--forte"
      type="submit"
      disabled={pending}
      {...(pending ? { 'data-carregando': '' } : {})}
    >
      {icone && !pending && <i className={`bi ${icone}`} aria-hidden="true" />}
      {children}
      {pending && <span className="sr">enviando…</span>}
    </button>
  );
}
