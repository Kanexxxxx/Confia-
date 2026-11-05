import type { Metadata } from 'next';
import { Cabecalho, Rodape } from '@/components/moldura';
import { Home } from '@/app/_portado/Home';

export const metadata: Metadata = {
  /* `absolute` foge do gabarito `%s · confia?` do layout. Sem
     isso a aba da home viraria "confia? — Verifique antes de
     clicar · confia?", com a marca escrita duas vezes. */
  title: { absolute: 'confia? — Verifique antes de clicar' },
  description:
    'Cole o link, o @ ou o print: a gente investiga no nosso servidor e responde ' +
    'em segundos, com o motivo de cada conclusão.',
};

/* A home lê a sessão pelo cabeçalho, então não pode ser estática. */
export const dynamic = 'force-dynamic';

export default function Pagina() {
  return (
    <>
      <Cabecalho atual="/" />
      <Home />
      <Rodape />
    </>
  );
}
