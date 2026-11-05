import type { Metadata } from 'next';
import { Cabecalho, Rodape } from '@/components/moldura';
import { Reembolso } from '@/app/_portado/Reembolso';

export const metadata: Metadata = {
  title: 'Política de reembolso',
  description: 'Como funciona o cancelamento e o reembolso das assinaturas do confia?.',
};

export default function Pagina() {
  return (
    <>
      <Cabecalho />
      <div id="conteudo">
        <Reembolso />
      </div>
      <Rodape />
    </>
  );
}
