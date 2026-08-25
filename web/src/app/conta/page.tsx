/* =============================================================
   confiia.com.br — visão geral da conta

   A porta de entrada do painel. NÃO repete o conteúdo das outras
   abas: mostra só o que precisa de atenção agora e o resumo de
   uso. Quem quer detalhe clica na aba.

   A regra que guia esta página: se um cartão daqui não leva a
   uma decisão ou a uma ação, ele não deveria estar aqui.
   ============================================================= */

import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { contas } from '@/db/schema';
import { sessaoAtual, aparelhosConectados } from '@/lib/sessao';

export const metadata: Metadata = { title: 'Minha conta' };
export const dynamic = 'force-dynamic';

export default async function VisaoGeral() {
  const quem = await sessaoAtual();
  if (!quem) redirect('/entrar?destino=/conta');

  const [perfil] = await db
    .select({
      totpAtivadoEm: contas.totpAtivadoEm,
      telefone: contas.telefone,
      criadaEm: contas.criadaEm,
    })
    .from(contas)
    .where(eq(contas.id, quem.id))
    .limit(1);

  const aparelhos = await aparelhosConectados(quem.id);

  /* PENDÊNCIAS — só entram aqui as que a pessoa RESOLVE hoje.
     Aviso que ela não pode resolver vira ruído, e depois de duas
     visitas ela para de ler o painel inteiro. */
  const pendencias: { texto: string; onde: string; acao: string; grave: boolean }[] = [];

  if (!quem.emailVerificado) {
    pendencias.push({
      texto: 'Seu e-mail ainda não foi confirmado. Sem isso não dá para recuperar a senha.',
      onde: '/conta/perfil',
      acao: 'Confirmar e-mail',
      grave: true,
    });
  }
  if (!perfil?.totpAtivadoEm) {
    pendencias.push({
      texto: 'O segundo fator está desligado. É o que impede alguém de entrar só com a sua senha.',
      onde: '/conta/seguranca',
      acao: 'Ligar agora',
      grave: false,
    });
  }
  if (!perfil?.telefone) {
    pendencias.push({
      texto: 'Você ainda não cadastrou telefone. Ele é uma segunda porta se você perder o e-mail.',
      onde: '/conta/perfil',
      acao: 'Cadastrar',
      grave: false,
    });
  }

  const desde = perfil?.criadaEm
    ? new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(perfil.criadaEm)
    : '—';

  return (
    <>
      <div className="painel-titulo">
        <h1>Olá, {quem.nome.split(' ')[0]}</h1>
        <p>Aqui você vê o que precisa de atenção e o quanto já usou este mês.</p>
      </div>

      {pendencias.length > 0 && (
        <section className="cartao" aria-labelledby="t-pendencias">
          <div className="cartao-topo">
            <div>
              <h2 id="t-pendencias">Precisa da sua atenção</h2>
              <p>
                {pendencias.length === 1
                  ? 'Um item para resolver.'
                  : `${pendencias.length} itens para resolver.`}
              </p>
            </div>
          </div>

          <ul className="pendencias">
            {pendencias.map((p) => (
              <li key={p.onde + p.acao} className={p.grave ? 'pendencia pendencia--grave' : 'pendencia'}>
                <i
                  className={`bi ${p.grave ? 'bi-exclamation-octagon-fill' : 'bi-shield-exclamation'}`}
                  aria-hidden="true"
                />
                <span>{p.texto}</span>
                <Link className="pendencia-acao" href={p.onde}>{p.acao}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* RESUMO DE USO.
          Os números de verificação ainda não existem: o motor entra
          na Etapa 8. Mostrar "0" daria a impressão de que a pessoa
          não usou, quando na verdade o recurso não existe. Por isso
          o cartão diz o que é, em vez de fingir um número. */}
      <section className="cartao" aria-labelledby="t-uso">
        <div className="cartao-topo">
          <div>
            <h2 id="t-uso">Seu plano</h2>
            <p>Grátis · 5 verificações por mês</p>
          </div>
          <Link className="btn btn--calmo btn--linha" href="/conta/plano">Ver detalhes</Link>
        </div>

        <div className="dados">
          <div className="dado">
            <span className="dado-rot">Verificações usadas este mês</span>
            <span className="dado-val">
              <span className="selo selo--aviso">
                <i className="bi bi-cone-striped" aria-hidden="true" /> a partir da Etapa 8
              </span>
            </span>
          </div>
          <div className="dado">
            <span className="dado-rot">Aparelhos conectados</span>
            <span className="dado-val">
              {aparelhos.length}{' '}
              <Link href="/conta/aparelhos" className="dado-link">ver</Link>
            </span>
          </div>
          <div className="dado">
            <span className="dado-rot">Conta criada em</span>
            <span className="dado-val">{desde}</span>
          </div>
        </div>
      </section>

      {quem.ehAdmin && (
        <section className="cartao cartao--admin" aria-labelledby="t-admin">
          <div className="cartao-topo">
            <div>
              <h2 id="t-admin">
                <i className="bi bi-key-fill" aria-hidden="true" /> Administração
              </h2>
              <p>
                Sua conta tem acesso ao painel interno. O endereço dele não fica no menu
                de propósito — quem não sabe o caminho recebe 404, não uma tela de login.
              </p>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
