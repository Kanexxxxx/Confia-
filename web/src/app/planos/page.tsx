/* =============================================================
   confiia.com.br — /planos

   Três partes:
     · o topo e os cartões (cartoes.tsx — precisa de JavaScript
       por causa do seletor mensal/anual)
     · a tabela comparativa e as dúvidas (detalhes.tsx — texto
       puro, vai inteiro pelo servidor)
     · o aviso de que a cobrança ainda não existe

   ─────────────────────────────────────────────────────────────
   O AVISO NO TOPO NÃO É OPCIONAL

   Os preços estão na tela, mas não há como pagar: a cobrança é a
   Etapa 9. Uma página de planos com botão "Assinar" que não
   assina é a definição de promessa vazia — e este site existe
   justamente para ensinar a desconfiar de promessa vazia.

   O aviso sai quando o pagamento entrar. Até lá, ele fica.
   ─────────────────────────────────────────────────────────────
   ============================================================= */

import type { Metadata } from 'next';
import { Cabecalho, Rodape } from '@/components/moldura';
import { CartoesPlano } from './cartoes';
import { DetalhesPlanos } from './detalhes';

export const metadata: Metadata = {
  title: 'Planos',
  description:
    'Comece de graça, sem cartão. Planos a partir de R$ 8,25 por mês para quem '
    + 'recebe link o dia todo — e para cuidar de quem não entende de internet.',
};

export const dynamic = 'force-dynamic';

export default function Planos() {
  return (
    <>
      <Cabecalho atual="/planos" />

      <main id="conteudo">
        <section className="topo">
          <p className="eyebrow">
            <i className="bi bi-tags" aria-hidden="true" /> Planos
          </p>
          <h1>
            Custa menos que cair
            <br />
            em um golpe só
          </h1>
          <p className="topo-sub">
            Comece de graça, sem cartão. Se precisar de mais, o plano acompanha —
            inclusive para proteger quem você ama e não entende de internet.
          </p>

          {/* Honestidade acima de tudo. Ver o comentário do topo. */}
          <div className="aviso-etapa aviso-etapa--centro">
            <i className="bi bi-cone-striped" aria-hidden="true" />
            <div>
              <b>Ainda não dá para assinar</b>
              <span>
                Os preços abaixo já estão definidos, mas a cobrança entra numa próxima
                etapa da construção. Por enquanto, o plano grátis funciona inteiro e não
                pede cartão.
              </span>
            </div>
          </div>

          <CartoesPlano />
        </section>

        <DetalhesPlanos />
      </main>

      <Rodape />
    </>
  );
}
