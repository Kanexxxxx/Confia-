/* =============================================================
   confiia.com.br — o link de confirmação do e-mail cai aqui

   POR QUE UM ROUTE HANDLER E NÃO UMA PÁGINA:
   Confirmar o e-mail também deixa a pessoa logada, e para isso
   é preciso GRAVAR um cookie. O Next só permite gravar cookie
   dentro de Server Action ou Route Handler — nunca ao renderizar
   uma página.

   Isso não é frescura do framework: renderizar pode acontecer
   várias vezes, em cache, em paralelo. Gravar cookie ali seria
   imprevisível. A separação obriga o efeito colateral a ficar
   num lugar que roda uma vez só.

   Fluxo: e-mail → /api/confirmar?t=… → confirma, cria sessão,
   e manda para /confirmar com o resultado.

   CUIDADO AO MEXER:
     - O endereço deste arquivo está dentro dos e-mails já
       enviados. Mudar o caminho quebra os links que estão na
       caixa de entrada das pessoas.
   ============================================================= */

import { redirect } from 'next/navigation';
import { confirmarEmail } from '@/lib/acoes-conta';

export async function GET(pedido: Request) {
  const token = new URL(pedido.url).searchParams.get('t');

  if (!token) redirect('/confirmar?erro=invalido');

  const r = await confirmarEmail(token);

  if (r.ok) redirect('/confirmar?ok=1');
  redirect(`/confirmar?erro=${r.motivo}`);
}
