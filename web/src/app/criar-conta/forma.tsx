'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { criarConta, type Estado } from '@/lib/acoes-conta';
import { Campo, CampoSenha, BotaoEnviar, Recado } from '@/components/campos';

/* Máscara só de aparência. Quem vale é a limpeza no servidor e o
   gatilho do banco, que guardam só os números. */
function mascaraTelefone(v: string) {
  const n = v.replace(/\D/g, '').slice(0, 11);
  if (n.length <= 2) return n;
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}

export function FormaCriarConta() {
  const [estado, acao] = useActionState<Estado, FormData>(criarConta, null);
  const [tipo, setTipo] = useState<'fisica' | 'juridica'>('fisica');
  const [tel, setTel] = useState('');

  const ehEmpresa = tipo === 'juridica';

  return (
    <div className="cartao-conta">
      <h1>Criar conta</h1>
      <p className="lead">
        É de graça. Com conta você tem 5 verificações por mês e o histórico do
        que já conferiu.
      </p>

      {estado?.erro && <Recado tipo="erro">{estado.erro}</Recado>}

      <form action={acao} noValidate>
        {/* ---- pessoa ou empresa ----
            Muda o caminho depois do cadastro, então vem primeiro. */}
        <fieldset className="escolha-tipo">
          <legend>Você é</legend>
          <div className="tipos">
            <label>
              <input
                type="radio" name="tipo" value="fisica"
                checked={!ehEmpresa}
                onChange={() => setTipo('fisica')}
              />
              <span>
                <i className="bi bi-person" aria-hidden="true" />
                <b>Pessoa</b>
                <small>Quero verificar links e perfis</small>
              </span>
            </label>
            <label>
              <input
                type="radio" name="tipo" value="juridica"
                checked={ehEmpresa}
                onChange={() => setTipo('juridica')}
              />
              <span>
                <i className="bi bi-shop" aria-hidden="true" />
                <b>Empresa</b>
                <small>Quero cadastrar minha loja</small>
              </span>
            </label>
          </div>
        </fieldset>

        <Campo
          nome="nome"
          rotulo={ehEmpresa ? 'Seu nome (quem administra a conta)' : 'Como você quer ser chamado'}
          autoComplete="name"
          erro={estado?.campo === 'nome'}
        />

        <Campo
          nome="email"
          rotulo="E-mail"
          tipo="email"
          autoComplete="email"
          dica={ehEmpresa
            ? 'Se for um e-mail do domínio da empresa, ele já ajuda a comprovar que a loja é sua.'
            : 'Vamos mandar um link para confirmar que é seu.'}
          erro={estado?.campo === 'email'}
        />

        {/* ---- telefone ----
            Opcional para pessoa, obrigatório para empresa. O texto da
            dica muda junto, para a pessoa saber POR QUE estamos
            pedindo — e não só que estamos. */}
        <div className={`campo${estado?.campo === 'telefone' ? ' erro' : ''}`}>
          <label htmlFor="telefone">
            Telefone{' '}
            {!ehEmpresa && (
              <span style={{ fontWeight: 400, color: 'var(--ink-3)' }}>(opcional)</span>
            )}
          </label>
          <input
            id="telefone"
            name="telefone"
            type="tel"
            inputMode="numeric"
            placeholder="(00) 00000-0000"
            autoComplete="tel"
            value={tel}
            onChange={(e) => setTel(mascaraTelefone(e.target.value))}
            required={ehEmpresa}
            aria-describedby="dica-tel"
            aria-invalid={estado?.campo === 'telefone' || undefined}
          />
          <span className="dica" id="dica-tel">
            {ehEmpresa
              ? 'É o contato que aparece no cadastro da sua loja.'
              : 'Serve só para recuperar a conta se você perder o acesso ao e-mail. Não mandamos mensagem.'}
          </span>
        </div>

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

        <BotaoEnviar icone="bi-person-plus">
          {ehEmpresa ? 'Criar conta da empresa' : 'Criar minha conta'}
        </BotaoEnviar>
      </form>

      <p className="pe-conta">
        Já tem conta? <Link href="/entrar">Entrar</Link>
      </p>
    </div>
  );
}
