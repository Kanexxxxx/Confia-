/* =============================================================
   confiia.com.br — /planos

   Duas partes:
     · o topo e os cartões (cartoes.tsx — precisa de JavaScript
       por causa do seletor mensal/anual)
     · a tabela comparativa e as dúvidas (detalhes.tsx — texto
       puro, vai inteiro pelo servidor)

   ─────────────────────────────────────────────────────────────
   O AVISO DE "AINDA NÃO DÁ PARA ASSINAR" SAIU — 27/08/2026

   Decisão da dona do projeto: o Asaas está sendo contratado, a
   cobrança entra, e o aviso de obra some antes dela chegar.

   O QUE SEGURA A HONESTIDADE ENQUANTO O ASAAS NÃO ENTRA não é
   mais o aviso — é o BOTÃO. Ele diz "Criar minha conta grátis" e
   leva para `/criar-conta`, que é exatamente o que ele faz. Uma
   página de preço só vira promessa vazia quando o botão promete
   pagamento e não entrega; este não promete.

   ⚠ ENTÃO A REGRA VIROU ESTA: enquanto o Asaas não estiver
   ligado, o botão NÃO pode virar "Assinar", "Ir para o
   pagamento" nem nada parecido. No dia em que o texto do botão
   mudar sem o pagamento existir, o aviso tem que voltar — os
   dois não podem estar fora ao mesmo tempo.

   Ver `acao.href` em cartoes.tsx, e a Etapa 9 do PLANO.md.
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

          <CartoesPlano />
        </section>

        <DetalhesPlanos />
      </main>

      <Rodape />
    </>
  );
}
