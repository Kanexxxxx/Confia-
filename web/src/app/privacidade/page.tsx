import type { Metadata } from 'next';
import { Cabecalho, Rodape } from '@/components/moldura';
import { Privacidade } from '@/app/_portado/Privacidade';

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: 'O que o confia? guarda, por quanto tempo, e como você pede para apagar.',
};

export default function Pagina() {
  return (
    <>
      <Cabecalho />
      <div id="conteudo">
        <Privacidade />
      </div>
      <Rodape />
    </>
  );
}
