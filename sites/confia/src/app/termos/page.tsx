import type { Metadata } from 'next';
import { Cabecalho, Rodape } from '@/components/moldura';
import { Termos } from '@/app/_portado/Termos';

export const metadata: Metadata = {
  title: 'Termos de uso',
  description: 'As regras de uso do confia?, o que prometemos e o que não prometemos.',
};

export default function Pagina() {
  return (
    <>
      <Cabecalho />
      <div id="conteudo">
        <Termos />
      </div>
      <Rodape />
    </>
  );
}
