/* =============================================================
   confiia.com.br — o botão de WhatsApp que flutua na tela

   Fica no canto inferior ESQUERDO, empilhado acima do botão de
   acessibilidade, no mesmo material e no mesmo tamanho. Os dois
   juntos formam uma coluna, não dois enfeites soltos.

   ─────────────────────────────────────────────────────────────
   VERDE, CONFORME A DECISÃO MAIS RECENTE

   MELHORIAS.md § II reverteu o azul para verde. A revisão de
   novembro aplica essa decisão e usa um SVG de tamanho fixo:
   o símbolo fica centrado sem depender da linha de base da fonte.
   ─────────────────────────────────────────────────────────────

   NÃO É COMPONENTE DE CLIENTE. É um link. Não tem estado, não
   ouve evento, não precisa de JavaScript — a expansão ao passar
   o mouse é CSS puro. Marcar 'use client' aqui só mandaria
   JavaScript à toa para o navegador.

   CUIDADO AO MEXER:
     - O número vem de src/lib/contato.ts. Não escreva número
       aqui: ele aparece em outros três lugares e precisa bater.
     - `target="_blank"` exige `rel="noopener"`. Sem isso a página
       aberta ganha acesso à sua pela `window.opener` — é uma via
       de sequestro de aba, e num site antigolpe seria irônico.
     - A posição (bottom:88px) depende da altura do botão de
       acessibilidade (56px) + respiro. Se um mudar, mude o outro.
   ============================================================= */

import { WHATSAPP_LINK, WHATSAPP_VISIVEL } from '@/lib/contato';

export function BotaoWhatsApp() {
  return (
    <a
      className="zap-flutua"
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Falar com a gente no WhatsApp, ${WHATSAPP_VISIVEL}`}
    >
      {/* SVG oficial do símbolo: não depende da linha de base de uma fonte. */}
      <span className="zap-simbolo" aria-hidden="true"><svg viewBox="0 0 24 24" width="25" height="25" fill="currentColor">
        <path d="M20.52 3.48A11.9 11.9 0 0 0 12.05 0C5.47 0 .12 5.35.12 11.93c0 2.1.55 4.15 1.6 5.96L0 24l6.27-1.64a11.94 11.94 0 0 0 5.77 1.47h.01c6.58 0 11.93-5.35 11.93-11.93 0-3.19-1.24-6.18-3.49-8.43ZM12.05 21.8a9.88 9.88 0 0 1-5.04-1.38l-.36-.22-3.72.98.99-3.63-.24-.37a9.84 9.84 0 0 1-1.51-5.25c0-5.47 4.45-9.92 9.92-9.92a9.85 9.85 0 0 1 7.02 2.91 9.85 9.85 0 0 1 2.9 7.02c0 5.47-4.45 9.92-9.92 9.92Zm5.44-7.43c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.18.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.49.71.3 1.27.49 1.7.63.71.22 1.36.19 1.87.11.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.29.18-1.42-.08-.12-.28-.2-.58-.35Z" />
      </svg></span>
      {/* O rótulo aparece ao passar o mouse ou ao receber foco.
          `aria-hidden` porque o nome acessível já está no
          aria-label do link — sem isso, o leitor de tela lê o
          nome duas vezes. */}
      <span className="zap-rotulo" aria-hidden="true">Falar com a gente</span>
    </a>
  );
}
