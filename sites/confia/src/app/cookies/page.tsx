import type { Metadata } from 'next';
import { Cabecalho, Rodape } from '@/components/moldura';
import { Cookies } from '@/app/_portado/Cookies';

export const metadata: Metadata = {
  title: 'Cookies',
  description: 'Quais cookies o confia? usa e como você escolhe.',
};

export default function Pagina() {
  return (
    <>
      <Cabecalho />
      <div id="conteudo">
        <Cookies />
      </div>
      <Rodape />
    </>
  );
}
