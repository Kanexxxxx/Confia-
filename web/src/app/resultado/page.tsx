/* =============================================================
   confiia.com.br — /resultado

   A tela que dá o veredito. Hoje é DEMONSTRAÇÃO: o motor de
   análise entra na Etapa 8, e até lá nada aqui vem de
   verificação real.

   ─────────────────────────────────────────────────────────────
   POR QUE ELA EXISTE ANTES DO MOTOR

   Duas razões, e nenhuma delas é fingir que o produto está
   pronto:

     1. O desenho do veredito precisa estar resolvido ANTES de a
        análise chegar. Descobrir na Etapa 8 que a leitura do
        resultado não funciona seria descobrir tarde.

     2. Dá para MOSTRAR como o resultado se lê, numa
        apresentação, sem precisar mentir sobre o que existe.

   O aviso de demonstração é uma faixa fixa no topo, não um
   rodapé — ver tela.tsx.

   `robots: noindex` reforça: uma tela de veredito falso indexada
   no Google seria desinformação com o nosso nome em cima.
   ─────────────────────────────────────────────────────────────
   ============================================================= */

import type { Metadata } from 'next';
import { Cabecalho, Rodape } from '@/components/moldura';
import { TelaResultado } from './tela';

export const metadata: Metadata = {
  title: 'Resultado (demonstração)',
  description:
    'Como o veredito de uma verificação vai se ler. Tela de demonstração: os '
    + 'endereços são inventados e a análise de verdade ainda não está ligada.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function Resultado() {
  return (
    <>
      <Cabecalho />
      <main id="conteudo" className="res-pagina">
        <TelaResultado />
      </main>
      <Rodape />
    </>
  );
}
