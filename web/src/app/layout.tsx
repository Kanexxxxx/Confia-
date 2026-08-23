/* =============================================================
   confiia.com.br — moldura de todas as páginas

   O link "pular para o conteúdo" e o painel de acessibilidade
   entram aqui, uma vez só, e valem para o site inteiro. Foi a
   regra que combinamos: acessibilidade não é etapa, é condição.
   ============================================================= */

import type { Metadata, Viewport } from 'next';
import './globals.css';

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
    <html lang="pt-BR">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
        />
        {/* Vem depois do globals.css de propósito: precisa vencer. */}
        <link rel="stylesheet" href="/assets/acessibilidade.css" />
      </head>
      <body>
        <a className="pular" href="#conteudo">Pular para o conteúdo</a>
        {children}
        <script src="/assets/acessibilidade.js" defer />
      </body>
    </html>
  );
}
