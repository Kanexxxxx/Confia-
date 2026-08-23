/* =============================================================
   confiia.com.br — moldura de todas as páginas

   ─────────────────────────────────────────────────────────────
   POR QUE A FONTE E OS ÍCONES NÃO VÊM MAIS DA INTERNET

   O protótipo carregava a fonte do Google e os ícones do jsDelivr.
   Isso significa que, em TODA visita, o endereço de IP da pessoa
   ia para essas duas empresas antes mesmo de ela clicar em nada.

   E a nossa Política de Privacidade promete guardar o mínimo. Ter
   um texto que promete uma coisa e um site que faz outra é
   exatamente o tipo de contradição que vira problema — e, num
   produto sobre confiança, é pior ainda.

   Agora:
     - `next/font/google` baixa a fonte na hora de compilar e
       serve do NOSSO servidor. A documentação do Next diz isso
       com todas as letras: "removes external network requests
       for improved privacy".
     - Os ícones vêm do pacote npm, servidos por nós.

   Resultado: nenhuma requisição sai para fora quando alguém abre
   o site. Some junto o piscar da fonte ao carregar.
   ─────────────────────────────────────────────────────────────

   CUIDADO AO MEXER:
     - Não volte a usar <link> para fonts.googleapis.com ou
       cdn.jsdelivr.net. Se precisar de outra fonte, importe pelo
       next/font; se precisar de outro ícone, instale o pacote.
   ============================================================= */

import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Inter, Poppins } from 'next/font/google';

/* Ícones: do pacote instalado, não de CDN. */
import 'bootstrap-icons/font/bootstrap-icons.css';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--fonte-texto',
  display: 'swap',
});

/* Poppins só nos títulos, e só nos pesos que usamos: cada peso a
   mais é um arquivo a mais para o celular baixar. */
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['600'],
  variable: '--fonte-titulo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'confia?', template: '%s · confia?' },
  description: 'Verifique links, sites e perfis antes de clicar ou pagar.',
  robots: { index: false, follow: false }, // beta: fora do Google por enquanto
};

export const viewport: Viewport = {
  themeColor: '#0b2443',
  width: 'device-width',
  initialScale: 1,
  /* Não travamos o zoom. Impedir a pessoa de ampliar a tela é uma
     das barreiras de acessibilidade mais comuns em site brasileiro. */
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        {/* Vem depois do globals.css de propósito: precisa vencer. */}
        <link rel="stylesheet" href="/assets/acessibilidade.css" />
      </head>
      <body>
        <a className="pular" href="#conteudo">Pular para o conteúdo</a>
        {children}

        {/* POR QUE next/script E NÃO <script defer>:
            O acessibilidade.js monta o botão e o painel dentro do
            <body>. Com <script defer> ele fazia isso ANTES de o
            React hidratar — e o React, ao hidratar, encontrava um
            <body> diferente do que tinha renderizado. Resultado:
            erro de hidratação E o painel sumindo da tela.

            `lazyOnload` roda depois de tudo estar de pé, então o
            React já terminou e não desfaz nada. */}
        <Script src="/assets/acessibilidade.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
