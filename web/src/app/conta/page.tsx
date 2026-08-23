/* =============================================================
   confiia.com.br — a conta da pessoa

   Primeira tela de quem entrou. Por enquanto mostra os dados e os
   aparelhos conectados; ganha histórico de consultas e cobrança
   nas Etapas 6 e 9.

   O QUE JÁ IMPORTA AQUI:
   A lista de aparelhos conectados não é enfeite. É como a pessoa
   descobre que alguém entrou na conta dela — e como ela expulsa
   essa pessoa sem depender da gente.
   ============================================================= */

import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { sessaoAtual, aparelhosConectados } from '@/lib/sessao';
import { sair } from '@/lib/acoes-conta';

export const metadata: Metadata = { title: 'Minha conta' };
export const dynamic = 'force-dynamic';

function quando(d: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(d);
}

export default async function Conta() {
  const quem = await sessaoAtual();
  if (!quem) redirect('/entrar?destino=/conta');

  const aparelhos = await aparelhosConectados(quem.id);

  return (
    <main className="folha-conta" id="conteudo">
      <header className="cabeca-conta">
        <div>
          <h1>Olá, {quem.nome.split(' ')[0]}</h1>
          <p>Sua conta no confia?</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link className="btn btn--calmo btn--linha" href="/conta/seguranca">
            <i className="bi bi-shield-lock" aria-hidden="true" /> Segurança
          </Link>
          <form action={sair}>
            <button className="btn btn--calmo btn--linha" type="submit">
              <i className="bi bi-box-arrow-right" aria-hidden="true" /> Sair
            </button>
          </form>
        </div>
      </header>

      <section className="bloco">
        <h2>Seus dados</h2>
        <div className="linha">
          <span className="rot">Nome</span>
          <span className="val">{quem.nome}</span>
        </div>
        <div className="linha">
          <span className="rot">E-mail</span>
          <span className="val">{quem.email}</span>
        </div>
        <div className="linha">
          <span className="rot">E-mail confirmado</span>
          <span className="val">
            {quem.emailVerificado ? (
              <span className="selo selo--ok">
                <i className="bi bi-check-circle-fill" aria-hidden="true" /> sim
              </span>
            ) : (
              <span className="selo selo--aviso">
                <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" /> falta confirmar
              </span>
            )}
          </span>
        </div>
        <div className="linha">
          <span className="rot">Plano</span>
          <span className="val">Grátis · 5 verificações por mês</span>
        </div>
      </section>

      <section className="bloco">
        <h2>Aparelhos conectados</h2>
        {aparelhos.map((a, i) => (
          <div className="aparelho" key={a.id}>
            <i
              className={`bi ${
                /iPhone|Android/.test(a.navegador ?? '') ? 'bi-phone' : 'bi-laptop'
              }`}
              aria-hidden="true"
              style={{ fontSize: 18, color: 'rgba(234,241,253,.5)' }}
            />
            <span>
              <b>{a.navegador ?? 'Aparelho desconhecido'}</b>
              <span> · entrou em {quando(a.criadaEm)}</span>
            </span>
            {i === 0 && <span className="agora">este aqui</span>}
          </div>
        ))}
        <p style={{ margin: '14px 0 0', fontSize: 12.5, lineHeight: 1.65, color: 'rgba(234,241,253,.5)' }}>
          Não reconhece algum? Troque sua senha — isso desconecta todos de uma vez.{' '}
          <Link href="/esqueci-senha" style={{ color: 'var(--sky-soft)' }}>Trocar senha</Link>
        </p>
      </section>

      <section className="bloco">
        <h2>Privacidade</h2>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.7, color: 'rgba(234,241,253,.74)' }}>
          Guardamos seu nome, seu e-mail e o que você verificou. Imagem enviada é apagada
          assim que a análise termina — fica o resultado, não a foto.
        </p>
        <p style={{ margin: '12px 0 0', fontSize: 13.5, color: 'rgba(234,241,253,.55)' }}>
          Exportar ou apagar seus dados: escreva para{' '}
          <a href="mailto:privacidade@confiia.com.br" style={{ color: 'var(--sky-soft)' }}>
            privacidade@confiia.com.br
          </a>
          . Respondemos em até 15 dias.
        </p>
      </section>

      {quem.ehAdmin && (
        <section className="bloco" style={{ borderColor: 'rgba(255,198,92,.3)' }}>
          <h2>Administração</h2>
          <p style={{ margin: 0, fontSize: 13.5, color: 'rgba(234,241,253,.74)' }}>
            Sua conta tem acesso ao painel. Ele ainda não exige segundo fator —
            isso entra na Etapa 5, e até lá o painel não vai para produção.
          </p>
        </section>
      )}
    </main>
  );
}
