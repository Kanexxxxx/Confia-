/* =============================================================
   confiia.com.br — moldura de todas as páginas
   Por enquanto só o mínimo. Ganha cabeçalho, rodapé e o vidro
   da marca na Etapa 6, quando o site migrar para cá.
   ============================================================= */

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'confia?',
  description: 'Verifique antes de clicar.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
