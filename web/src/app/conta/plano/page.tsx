/* =============================================================
   confiia.com.br — plano e uso

   ─────────────────────────────────────────────────────────────
   ESTA PÁGINA NÃO INVENTA NÚMERO

   O motor de verificação entra na Etapa 8 e a cobrança na 9.
   Até lá não existe "3 de 5 verificações usadas" — existe zero
   verificação feita, porque o recurso não existe.

   Mostrar uma barra em 0% daria a impressão de que a pessoa
   simplesmente não usou. Mostrar um número inventado seria pior.
   Então a página diz o que é: o plano existe, o contador ainda
   não. Num site que promete honestidade sobre o que não sabe,
   começar mentindo no próprio painel seria contradição.
   ─────────────────────────────────────────────────────────────
   ============================================================= */

import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { sessaoAtual } from '@/lib/sessao';

export const metadata: Metadata = { title: 'Plano e uso' };
export const dynamic = 'force-dynamic';

/* Os MESMOS planos de /planos. Se divergirem, a pessoa vê um
   preço no site e outro dentro da conta — e passa a duvidar dos
   dois. Ao mexer aqui, mexa em src/app/planos/cartoes.tsx. */
const PLANOS = [
  {
    id: 'gratis',
    nome: 'Grátis',
    preco: 'R$ 0',
    periodo: 'para sempre, sem cartão',
    atual: true,
    itens: [
      '5 verificações por mês',
      'Link, site e perfil de rede social',
      'O motivo de cada conclusão',
      'Histórico dos últimos 7 dias',
    ],
  },
  {
    id: 'basico',
    nome: 'Básico',
    preco: 'R$ 12,90',
    periodo: 'por mês · R$ 8,25 no anual',
    atual: false,
    itens: [
      '30 verificações por mês',
      '5 imagens: print, anúncio, foto',
      'Detecta imagem feita por IA',
      'Extensão de navegador',
    ],
  },
  {
    id: 'premium',
    nome: 'Premium',
    preco: 'R$ 24,90',
    periodo: 'por mês · R$ 16,58 no anual',
    atual: false,
    itens: [
      '150 verificações por mês',
      'Até 5 pessoas na mesma conta',
      'Gente de verdade revisa a dúvida',
      'Aviso se um site aprovado piorar',
    ],
  },
];


export default async function Plano() {
  const quem = await sessaoAtual();
  if (!quem) redirect('/entrar?destino=/conta/plano');

  return (
    <>
      <div className="painel-titulo">
        <h1>Plano e uso</h1>
        <p>Você está no plano grátis. Ele não expira e não pede cartão.</p>
      </div>

      <section className="cartao" aria-labelledby="t-uso">
        <div className="cartao-topo">
          <div>
            <h2 id="t-uso">Uso deste mês</h2>
          </div>
        </div>

        {/* Honestidade acima de tudo: o contador entra junto com o
            motor de análise. Até lá, dizemos isso. */}
        <div className="aviso-etapa">
          <i className="bi bi-cone-striped" aria-hidden="true" />
          <div>
            <b>O contador ainda não existe</b>
            <span>
              A análise de verdade entra na próxima etapa da construção. Quando ela
              existir, aqui vai aparecer quantas das suas 5 verificações do mês você já
              usou — e não um número inventado enquanto isso.
            </span>
          </div>
        </div>
      </section>

      <section className="cartao" aria-labelledby="t-planos">
        <div className="cartao-topo">
          <div>
            <h2 id="t-planos">Os planos</h2>
            <p>
              Os preços já estão definidos, mas a cobrança ainda não existe. Você vai ver
              aqui antes de qualquer cobrança, e o plano grátis não pede cartão.
            </p>
          </div>
        </div>

        <div className="conta-planos">
          {PLANOS.map((p) => (
            <div className={p.atual ? 'conta-plano conta-plano--atual' : 'conta-plano'} key={p.id}>
              <div className="conta-plano-topo">
                <b>{p.nome}</b>
                {p.atual && <span className="selo selo--ok">seu plano</span>}
              </div>
              <p className="conta-plano-preco">
                {p.preco} <span>{p.periodo}</span>
              </p>
              <ul className="conta-plano-itens">
                {p.itens.map((i) => (
                  <li key={i}>
                    <i className="bi bi-check2" aria-hidden="true" />
                    {i}
                  </li>
                ))}
              </ul>
              {!p.atual && (
                <Link className="btn btn--calmo btn--linha" href="/planos">
                  Ver detalhes
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
