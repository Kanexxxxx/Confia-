import type { NextConfig } from 'next';

/* =============================================================
   confiia.com.br — configuração do Next

   CUIDADO AO MEXER:
     - Os cabeçalhos de segurança abaixo valem para todas as
       páginas. Tirar algum é abrir uma porta que estava fechada.
   ============================================================= */

const nextConfig: NextConfig = {
  /* O indicador de desenvolvimento nasce embaixo à esquerda —
     exatamente onde fica o botão de acessibilidade. Mudo o dele,
     porque o nosso é o que a pessoa vai usar de verdade. */
  devIndicators: { position: 'bottom-right' },

  /* Não anunciar qual servidor roda o site. Não é segurança de
     verdade, mas não há motivo para facilitar a vida de quem
     varre a internet procurando versão com falha conhecida. */
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/:caminho*',
        headers: [
          /* Impede que o navegador "adivinhe" o tipo do arquivo.
             Sem isso, um upload de texto pode acabar executado
             como script. */
          { key: 'X-Content-Type-Options', value: 'nosniff' },

          /* Ninguém coloca o confia? dentro de um iframe. É assim
             que se monta a tela falsa por cima da verdadeira
             (clickjacking) — e num site antigolpe isso seria irônico
             demais. */
          { key: 'X-Frame-Options', value: 'DENY' },

          /* Ao sair para outro site, não entregamos o endereço
             completo de onde a pessoa estava. O caminho pode
             conter o que ela verificou. */
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

          /* Não usamos câmera, microfone nem localização. Declarar
             isso impede que um script de terceiro tente. */
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
