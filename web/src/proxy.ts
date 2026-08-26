/* =============================================================
   confiia.com.br — a política de conteúdo (CSP) e o resto dos
   cabeçalhos que dependem de cada requisição

   ─────────────────────────────────────────────────────────────
   O QUE A CSP RESOLVE, E POR QUE ELA IMPORTA AQUI MAIS DO QUE
   NA MÉDIA DOS SITES

   Sem CSP, um XSS é o fim: o script do atacante roda com todo o
   poder da página. Com CSP, ele precisa ainda passar por uma
   segunda tranca — o navegador se recusa a executar script que
   não traga o número de uso único (nonce) daquela requisição.

   Num site cujo produto é dizer "confie nesta página", uma
   injeção de script seria a contradição perfeita: o atacante
   usaria a NOSSA credibilidade para aplicar o golpe.

   ─────────────────────────────────────────────────────────────
   POR QUE `proxy.ts` E NÃO `middleware.ts`

   Esta versão do Next renomeou o arquivo. `middleware.ts` não é
   mais lido — ver node_modules/next/dist/docs/01-app/02-guides/
   content-security-policy.md.

   ─────────────────────────────────────────────────────────────
   AS DECISÕES DE CADA DIRETIVA

   script-src   'nonce-…' + 'strict-dynamic'. Nada roda sem o
                número da vez. `strict-dynamic` deixa um script
                autorizado carregar outro — é o que o Next precisa
                para os pedaços dele.

   style-src    inclui 'unsafe-inline', e isto é uma ESCOLHA
                consciente. O React escreve `style="..."` no
                elemento em 47 lugares (larguras de barra, atrasos
                de animação), e a CSP bloqueia atributo de estilo
                sem essa permissão. Injeção por CSS é um risco
                real mas muito menor que execução de script — dá
                para desfigurar a página, não para roubar sessão.
                Tirar isto exigiria reescrever os 47 lugares como
                variável CSS, e é uma dívida anotada, não um
                esquecimento.

   img-src      `data:` e `blob:` porque o verificador mostra a
                pré-visualização do print que a pessoa anexa, sem
                que ele saia do navegador.

   connect-src  só o próprio site. Nada de telemetria para fora.

   frame-ancestors 'none'  ninguém coloca o confia? dentro de um
                iframe. É assim que se monta a tela falsa por cima
                da verdadeira, e num site antigolpe isso seria
                irônico demais.

   VLIBRAS      vlibras.gov.br aparece em script-src e connect-src
                porque o tradutor de Libras do governo federal é
                carregado de lá — SÓ quando a pessoa liga. Sem
                esta linha, quem precisa de Libras clica e não
                acontece nada, e o erro só apareceria no console.

   ─────────────────────────────────────────────────────────────
   CUIDADO AO MEXER:
     - Recurso novo de terceiro exige linha nova aqui, senão ele
       é bloqueado em silêncio para o visitante (o erro fica no
       console, que ninguém abre).
     - `'unsafe-eval'` entra SÓ em desenvolvimento: o React usa
       `eval` para remontar a pilha de erro do servidor no
       navegador. Em produção nem o React nem o Next usam.
     - Este arquivo roda em TODA requisição. Nada de consulta ao
       banco aqui dentro.
   ============================================================= */

import { NextResponse, type NextRequest } from 'next/server';

/* O tradutor de Libras do governo. Carregado sob demanda pelo
   acessibilidade.js — ver o comentário longo lá. */
const VLIBRAS = 'https://vlibras.gov.br';

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const emDesenvolvimento = process.env.NODE_ENV === 'development';

  const politica = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${VLIBRAS}${
      emDesenvolvimento ? " 'unsafe-eval'" : ''
    };
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: ${VLIBRAS};
    font-src 'self';
    connect-src 'self' ${VLIBRAS};
    media-src 'self' ${VLIBRAS};
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, ' ')
    .trim();

  /* O nonce vai no cabeçalho da REQUISIÇÃO para o layout poder
     lê-lo com `headers()` e repassar aos scripts que precisarem. */
  const cabecalhosDaRequisicao = new Headers(request.headers);
  cabecalhosDaRequisicao.set('x-nonce', nonce);

  const resposta = NextResponse.next({
    request: { headers: cabecalhosDaRequisicao },
  });

  resposta.headers.set('Content-Security-Policy', politica);

  /* HSTS — "deste domínio, só por HTTPS, e não pergunte de novo".
     Fecha a janela em que alguém na mesma rede intercepta o
     primeiro acesso em http e desvia a pessoa.

     Só em produção: em desenvolvimento o site roda em http, e o
     navegador guardaria essa ordem para `localhost` — quebrando
     todo outro projeto seu que use localhost sem TLS.

     Sem `preload` por enquanto: entrar na lista dos navegadores é
     fácil e sair leva meses. Isso se faz com o domínio estável e
     HTTPS funcionando há um tempo, não no primeiro dia. */
  if (!emDesenvolvimento) {
    resposta.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains',
    );
  }

  /* Isola a janela de páginas abertas por ela. Sem isto, uma aba
     aberta pelo site pode conversar com esta pela `window.opener`. */
  resposta.headers.set('Cross-Origin-Opener-Policy', 'same-origin');

  return resposta;
}

export const config = {
  /* Não roda nos arquivos estáticos nem nos pedaços do Next: eles
     não precisam de CSP e a conta de gerar um nonce por imagem
     seria desperdício em toda visita. */
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
