/* =============================================================
   confiia.com.br — os casos de DEMONSTRAÇÃO de /resultado

   ─────────────────────────────────────────────────────────────
   ISTO É INVENTADO, E A TELA DIZ ISSO EM LETRA GRANDE

   Nenhum destes vereditos veio de análise. Os endereços não
   existem. Este arquivo existe para a tela de resultado estar
   pronta quando o motor de verificação entrar — e para dar para
   MOSTRAR como o veredito se lê, numa apresentação, sem precisar
   fingir que o motor já funciona.

   O aviso na tela não é rodapé: é uma faixa fixa no topo. Numa
   página que dá veredito sobre golpe, deixar dúvida sobre o que é
   real seria o pior tipo de erro.

   QUANDO A API EXISTIR: é este mesmo formato que ela devolve, e
   este arquivo some.
   ─────────────────────────────────────────────────────────────

   Os scores foram espalhados (17 / 54 / 93). No protótipo eram
   58 / 65 / 80 — sete pontos entre "perigoso" e "suspeito", e a
   barra não contava a história sozinha. Numa tela cujo trabalho é
   demonstrar a leitura do veredito, ela precisa contar.
   ============================================================= */

export type Estado = 'perigoso' | 'suspeito' | 'confiavel';

export type Item = {
  t: string;
  e: 'ok' | 'alerta' | 'risco';
  p: string;
  aberto?: boolean;
  tags: { x: string; c: string }[];
};

export type Caso = {
  veredito: string;
  classe: string;
  icone: string;
  alvo: string;
  score: number;
  itens: Item[];
};

export const CASOS: Record<Estado, Caso> = {
    perigoso: {
      veredito: 'Perigoso',
      classe: 'v-risco',
      icone: 'bi-exclamation-triangle-fill',
      alvo: 'premio-liberado-2026.shop',
      score: 17,
      itens: [
        {
          t: 'Análise de URL',
          e: 'ok',
          p: 'Endereço legível, sem caracteres trocados para imitar outro site.',
          tags: [],
        },
        {
          t: 'Certificado SSL',
          e: 'risco',
          aberto: true,
          p: 'O cadeado existe, mas o certificado foi emitido há 3 dias e não cobre o endereço que aparece na barra. Cadeado não é sinal de site confiável.',
          tags: [
            {
              x: 'Emitido há 3 dias',
              c: 'risco',
            },
            {
              x: 'Não cobre o domínio',
              c: 'risco',
            },
          ],
        },
        {
          t: 'Domínio e DNS',
          e: 'alerta',
          aberto: true,
          p: 'Domínio registrado há 6 dias, com os dados do dono ocultos e servidor em outro país.',
          tags: [
            {
              x: '6 dias de idade',
              c: 'alerta',
            },
          ],
        },
        {
          t: 'Safe Browsing',
          e: 'risco',
          aberto: true,
          p: 'O endereço já foi denunciado e aparece em listas públicas de páginas usadas para roubar senha.',
          tags: [
            {
              x: 'Em lista de phishing',
              c: 'risco',
            },
          ],
        },
        {
          t: 'Imitação de marca',
          e: 'ok',
          p: 'Não encontramos cópia de logo ou nome de marca conhecida.',
          tags: [],
        },
      ],
    },
    suspeito: {
      veredito: 'Suspeito',
      classe: 'v-alerta',
      icone: 'bi-exclamation-triangle-fill',
      alvo: 'ofertas-relampago.com.br',
      score: 54,
      itens: [
        {
          t: 'Análise de URL',
          e: 'ok',
          p: 'Endereço direto, sem redirecionamento escondido.',
          tags: [],
        },
        {
          t: 'Certificado SSL',
          e: 'ok',
          p: 'Certificado válido e emitido para este mesmo endereço.',
          tags: [],
        },
        {
          t: 'Safe Browsing',
          e: 'ok',
          p: 'Nenhuma denúncia registrada até agora.',
          tags: [],
        },
        {
          t: 'Domínio e DNS',
          e: 'alerta',
          aberto: true,
          p: 'Domínio criado há 2 meses. Não é proibido, mas loja nova com preço muito abaixo do mercado pede cautela.',
          tags: [
            {
              x: '2 meses de idade',
              c: 'alerta',
            },
          ],
        },
        {
          t: 'Imitação de marca',
          e: 'alerta',
          aberto: true,
          p: 'O nome lembra o de uma loja conhecida, com uma letra diferente. Confira se é mesmo o site oficial.',
          tags: [
            {
              x: 'Nome parecido',
              c: 'alerta',
            },
          ],
        },
      ],
    },
    confiavel: {
      veredito: 'Confiável',
      classe: 'v-ok',
      icone: 'bi-check-circle-fill',
      alvo: 'www.exemplo-oficial.com.br',
      score: 93,
      itens: [
        {
          t: 'Análise de URL',
          e: 'ok',
          p: 'Endereço legível e sem disfarce.',
          tags: [],
        },
        {
          t: 'Certificado SSL',
          e: 'ok',
          p: 'Certificado válido, emitido para este endereço e dentro do prazo.',
          tags: [],
        },
        {
          t: 'Safe Browsing',
          e: 'ok',
          p: 'Sem denúncias em listas públicas.',
          tags: [],
        },
        {
          t: 'Domínio e DNS',
          e: 'alerta',
          aberto: true,
          p: 'Domínio antigo e estável. O único ponto: os dados do responsável estão ocultos no registro.',
          tags: [
            {
              x: 'Dono não identificado',
              c: 'alerta',
            },
          ],
        },
        {
          t: 'Imitação de marca',
          e: 'ok',
          p: 'Nenhum sinal de cópia de marca.',
          tags: [],
        },
      ],
    },
  };
