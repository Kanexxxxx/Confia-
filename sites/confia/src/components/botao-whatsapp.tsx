/* =============================================================
   confiia.com.br — o botão de WhatsApp que flutua na tela

   Fica no canto inferior ESQUERDO, empilhado acima do botão de
   acessibilidade, no mesmo material e no mesmo tamanho. Os dois
   juntos formam uma coluna, não dois enfeites soltos.

   ─────────────────────────────────────────────────────────────
   POR QUE AZUL E NÃO VERDE

   Todo site do mundo põe o balãozinho verde do WhatsApp no canto.
   O verde é a marca DELES, e usá-lo aqui faz o elemento parecer
   colado por cima do site em vez de fazer parte dele.

   Em azul, ele lê como um botão do confia? que leva ao WhatsApp —
   que é o que ele é. O ícone já diz qual aplicativo abre; a cor
   não precisa repetir a informação.
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
      <i className="bi bi-whatsapp" aria-hidden="true" />
      {/* O rótulo aparece ao passar o mouse ou ao receber foco.
          `aria-hidden` porque o nome acessível já está no
          aria-label do link — sem isso, o leitor de tela lê o
          nome duas vezes. */}
      <span className="zap-rotulo" aria-hidden="true">Falar com a gente</span>
    </a>
  );
}
