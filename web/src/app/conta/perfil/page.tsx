/* =============================================================
   confiia.com.br — perfil

   O que a pessoa pode mudar sozinha (apelido, avatar, telefone)
   e o que ela não pode (nome, e-mail, tipo de pessoa, CNPJ).

   POR QUE E-MAIL E NOME NÃO SE EDITAM AQUI:
   Trocar e-mail é trocar a chave da casa — precisa de confirmação
   nos dois endereços, senão vira caminho de sequestro de conta.
   Isso é um fluxo próprio, não um campo de formulário. Enquanto
   ele não existir, a página diz como fazer, em vez de oferecer
   um campo que não funcionaria direito.
   ============================================================= */

import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { contas } from '@/db/schema';
import { sessaoAtual } from '@/lib/sessao';
import { EMAIL_CONTATO } from '@/lib/contato';
import { FormaPerfil } from './forma';

export const metadata: Metadata = { title: 'Perfil e avatar' };
export const dynamic = 'force-dynamic';

/* 11 dígitos → (16) 99999-9999 · 10 dígitos → (16) 3333-4444 */
function telefoneBonito(t: string | null) {
  if (!t) return '';
  const n = t.replace(/\D+/g, '');
  if (n.length === 11) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
  if (n.length === 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return t;
}

function cnpjBonito(c: string | null) {
  if (!c) return null;
  const n = c.replace(/\D+/g, '');
  if (n.length !== 14) return c;
  return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8, 12)}-${n.slice(12)}`;
}

export default async function Perfil() {
  const quem = await sessaoAtual();
  if (!quem) redirect('/entrar?destino=/conta/perfil');

  const [perfil] = await db
    .select({
      apelido: contas.apelido,
      avatar: contas.avatar,
      telefone: contas.telefone,
      telefoneVerificadoEm: contas.telefoneVerificadoEm,
      tipoPessoa: contas.tipoPessoa,
      cnpj: contas.cnpj,
    })
    .from(contas)
    .where(eq(contas.id, quem.id))
    .limit(1);

  const cnpj = cnpjBonito(perfil?.cnpj ?? null);

  return (
    <>
      <div className="painel-titulo">
        <h1>Perfil e avatar</h1>
        <p>Como você aparece no site e como a gente fala com você.</p>
      </div>

      <section className="cartao" aria-labelledby="t-editar">
        <div className="cartao-topo">
          <div>
            <h2 id="t-editar">O que você pode mudar</h2>
            <p>A figura aparece no cabeçalho e ao lado do seu nome.</p>
          </div>
        </div>

        <FormaPerfil
          nome={quem.nome}
          apelido={perfil?.apelido ?? ''}
          telefone={telefoneBonito(perfil?.telefone ?? null)}
          avatar={perfil?.avatar ?? 'inicial'}
        />
      </section>

      <section className="cartao" aria-labelledby="t-fixo">
        <div className="cartao-topo">
          <div>
            <h2 id="t-fixo">O que fica fixo</h2>
            <p>Para mudar qualquer um destes, fale com a gente — é de propósito.</p>
          </div>
        </div>

        <div className="dados">
          <div className="dado">
            <span className="dado-rot">Nome completo</span>
            <span className="dado-val">{quem.nome}</span>
          </div>
          <div className="dado">
            <span className="dado-rot">E-mail</span>
            <span className="dado-val">{quem.email}</span>
          </div>
          <div className="dado">
            <span className="dado-rot">E-mail confirmado</span>
            <span className="dado-val">
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
          <div className="dado">
            <span className="dado-rot">Tipo de cadastro</span>
            <span className="dado-val">
              {perfil?.tipoPessoa === 'juridica' ? 'Empresa (PJ)' : 'Pessoa física'}
            </span>
          </div>
          {cnpj && (
            <div className="dado">
              <span className="dado-rot">CNPJ</span>
              <span className="dado-val">{cnpj}</span>
            </div>
          )}
        </div>

        <p className="cartao-texto" style={{ marginTop: 18 }}>
          Trocar de e-mail é trocar a chave da casa: precisa de confirmação nos dois
          endereços, senão viraria caminho de sequestro de conta. Enquanto essa tela não
          existe, escreva para <a href={`mailto:${EMAIL_CONTATO}`}>{EMAIL_CONTATO}</a>{' '}
          que a gente faz com você. Para apagar a conta, veja{' '}
          <Link href="/conta/privacidade">Privacidade</Link>.
        </p>
      </section>
    </>
  );
}
