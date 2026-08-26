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

import { FiltrosVidro } from '@/components/filtros-vidro';
import { Revelacao } from '@/components/revelacao';
import { BotaoWhatsApp } from '@/components/botao-whatsapp';
import { AvisoCookies } from '@/components/aviso-cookies';

/* Ícones: do pacote instalado, não de CDN. */
import 'bootstrap-icons/font/bootstrap-icons.css';
import './globals.css';

/* =============================================================
   AS DUAS FONTES — Inter no texto, Poppins nos títulos

   Cheguei a trocar por Instrument Sans + Fraunces, argumentando
   que Inter e Poppins são as duas famílias mais usadas em
   interface gerada automaticamente. Você viu e pediu para voltar.
   Voltou.

   ─────────────────────────────────────────────────────────────
   O QUE FICOU DA PASSAGEM, E É BOM QUE TENHA FICADO

   Ao trocar, apareceu que havia TRINTA regras no globals.css com
   `font-family:Poppins` escrito na mão, herdadas do protótipo. A
   variável `--fonte-titulo` existia e as trinta passavam por cima
   dela: trocar a fonte aqui não mudava nada na tela, e não havia
   erro nenhum para avisar.

   Aquilo foi corrigido e continua corrigido. Hoje o CSS usa
   `var(--fonte-titulo)` e `var(--fonte-texto)` em todo lugar, e
   estas duas declarações mandam de verdade.

   ─────────────────────────────────────────────────────────────
   CUIDADO AO MEXER:
     - Peso a mais é arquivo a mais para o celular baixar. Poppins
       vem só no peso que os títulos usam.
     - Nunca escreva nome de fonte na mão no CSS. Use as
       variáveis. Foi assim que o problema acima nasceu.
     - Trocou a fonte? Confira NO NAVEGADOR com
       `getComputedStyle(document.querySelector('h1')).fontFamily`.
       Só o arquivo não conta a verdade.
   ============================================================= */

const inter = Inter({
  subsets: ['latin'],
  variable: '--fonte-texto',
  display: 'swap',
});

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
        {/* Vem depois do globals.css DE PROPÓSITO: as regras de
            acessibilidade precisam vencer as do desenho, e a ordem
            é o que decide isso. Passar pelo import do bundler
            colocaria o arquivo junto do resto, sem garantia de vir
            por último.

            O ESLint sugere não usar <link> manual; aqui é o
            objetivo, não um descuido. */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/assets/acessibilidade.css" />
      </head>
      <body>
        <a className="pular" href="#conteudo">Pular para o conteúdo</a>

        {/* =====================================================
            O CENÁRIO — quatro camadas, de trás para frente

            Aqui havia três esferas de gradiente à deriva. Saíram
            por dois motivos:

            1. Você as descreveu como "uma bola andando", e estava
               certo: mancha colorida flutuando é o fundo padrão de
               interface gerada por máquina. Aparece igual em
               qualquer site, sobre qualquer assunto.

            2. Elas ESTRAGAVAM o efeito de vidro. Vinham com
               `filter: blur(60px)`, então o `backdrop-filter` do
               vidro tentava borrar o que já era borrão. Não sobrava
               detalhe para deformar, e o vidro virava retângulo
               cinza. Era essa a diferença para o iPhone: lá o vidro
               fica sobre FOTO — contraste, borda, alta frequência.

            No lugar entrou uma textura de guilhochê — a gravura da
            cédula. Ela também saiu: a emenda do ladrilho aparecia
            no zoom e o desenho ficou estranho na tela.

            O cenário hoje é só LUZ E GRÃO, sem desenho nenhum:

               .cena-fundo   o breu
               .cena-luz     a luz quente vinda de trás
               .cena-grao    o grão do papel

            ⚠  ISSO TEM UM PREÇO, E ELE É CONHECIDO: sem detalhe
            fino atrás, o vidro tem pouco o que refratar. O efeito
            existe pela luz e pela borda, mas não chega ao que se
            vê no iPhone — lá o vidro fica sobre foto. Se um dia o
            vidro voltar a parecer chapado, é daqui que vem.

            Tudo `fixed`, z-index negativo, `aria-hidden`: não entra
            no fluxo, não recebe clique, não existe para leitor de
            tela. ===================================================== */}
        <div className="cena" aria-hidden="true">
          <div className="cena-fundo" />
          <div className="cena-luz" />
          <div className="cena-grao" />
        </div>

        {/* Definições SVG dos filtros de vidro. Ver filtros-vidro.tsx:
            o CSS chama #warp-pill e #warp-card, e eles precisam
            existir na página onde o vidro aparece — ou seja, todas. */}
        <FiltrosVidro />

        {children}

        {/* Entrada da página, revelação ao rolar e o brilho do
            vidro. Fica no layout, não na home: as regras que
            escondem (`opacity:0`) valem no site inteiro, então o
            componente que revela também precisa valer. Numa
            página sem nada para revelar ele não faz nada. */}
        <Revelacao />

        {/* Canto inferior esquerdo: WhatsApp em cima, acessibilidade
            embaixo (esse é montado pelo acessibilidade.js). Os dois
            formam uma coluna só. */}
        <BotaoWhatsApp />

        {/* Aviso de cookies — canto oposto ao dos botões, e sem
            travar a página. Só aparece para quem ainda não escolheu. */}
        <AvisoCookies />

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
