/* =============================================================
   confiia.com.br — AVATAR

   NÃO EXISTE UPLOAD DE FOTO DE PERFIL. É decisão de produto:
     - foto enviada precisa de moderação humana — alguém sempre
       sobe o que não pode, e vira trabalho toda semana;
     - arquivo de desconhecido é porta de entrada;
     - foto de rosto é dado pessoal que teríamos que guardar,
       proteger e apagar no prazo, contra o "guardamos o mínimo"
       que a nossa Política promete.

   ─────────────────────────────────────────────────────────────
   POR QUE BICHOS BRASILEIROS, E NÃO FORMAS GEOMÉTRICAS

   A primeira versão era círculo, onda, losango. Funcionava e não
   dizia nada — poderia ser de qualquer aplicativo do mundo.

   Bicho tem três coisas que forma geométrica não tem:

     1. É lembrado. "Eu sou a capivara" é uma frase que a pessoa
        fala. "Eu sou o losango" ninguém fala.
     2. É afetivo. Boa parte de quem mais precisa deste site tem
        60 anos ou mais e não tem intimidade com tecnologia. Uma
        carinha amigável desarma mais que um triângulo.
     3. É nosso. Capivara, tucano, arara e onça dizem "isto é
        brasileiro" sem precisar escrever bandeira em lugar nenhum.

   E a CORUJA é a que abre a lista de propósito: é o bicho que
   enxerga no escuro e vigia enquanto os outros dormem. É
   exatamente o que este produto faz.
   ─────────────────────────────────────────────────────────────

   CUIDADO AO MEXER:
     - Acrescentar avatar é seguro. REMOVER quebra a conta de quem
       escolheu aquele — o componente cai no 'inicial' em vez de
       sumir, mas a pessoa perde a figura dela.
     - Cada desenho vive num viewBox 44×44. Desenhe cheio: o
       avatar aparece a 32px em lista, e detalhe fino some.
     - Todo SVG é decorativo (aria-hidden): o nome da pessoa já
       está escrito ao lado.
   ============================================================= */

/* Paleta das iniciais. Para os bichos, cada um traz a sua. */
const CORES = [
  ['#0b2443', '#4d9fff'], ['#11375f', '#a9cdff'],
  ['#123d33', '#2fd39b'], ['#3d2f10', '#ffc65c'],
  ['#3d1f1a', '#ff7a6b'], ['#1a2c4a', '#7fb3ff'],
  ['#2a1f3d', '#b89cff'], ['#0f3536', '#5fd6d0'],
] as const;

function corDe(texto: string): readonly [string, string] {
  let n = 0;
  for (let i = 0; i < texto.length; i++) n = (n * 31 + texto.charCodeAt(i)) >>> 0;
  return CORES[n % CORES.length];
}

function iniciais(nome: string): string {
  /* Só pedaços que COMEÇAM com letra. Sem isto, "Kaina (teste)"
     vira "K(" — o parêntese entra como inicial. O mesmo valeria
     para nomes com hífen, aspas ou emoji. */
  const partes = (nome || '')
    .trim()
    .split(/\s+/)
    .filter((p) => /^\p{L}/u.test(p));

  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

type Bicho = {
  nome: string;
  fundo: string;
  desenho: React.ReactNode;
};

/* Olho padrão: ponto escuro com um brilho branco em cima. O brilho
   é o que separa "bicho vivo" de "adesivo". */
const olho = (x: number, y: number, r = 3.1) => (
  <>
    <circle cx={x} cy={y} r={r} fill="#1b1205" />
    <circle cx={x + r * 0.34} cy={y - r * 0.36} r={r * 0.34} fill="#fff" opacity=".95" />
  </>
);

export const AVATARES: Record<string, Bicho> = {
  /* ---------- CORUJA — a que vigia enquanto os outros dormem ---------- */
  coruja: {
    nome: 'Coruja',
    fundo: '#2b1e3f',
    desenho: (
      <>
        {/* tufos */}
        <path d="M9 15c1-5 4-7 6-7s3 3 2 6z" fill="#c9a227" />
        <path d="M35 15c-1-5-4-7-6-7s-3 3-2 6z" fill="#c9a227" />
        {/* corpo/cabeça */}
        <ellipse cx="22" cy="24" rx="14" ry="14" fill="#e0b84a" />
        <ellipse cx="22" cy="30" rx="10" ry="9" fill="#f2d489" />
        {/* discos faciais */}
        <circle cx="16" cy="21" r="7" fill="#fff8e6" />
        <circle cx="28" cy="21" r="7" fill="#fff8e6" />
        {olho(16, 21, 4)}
        {olho(28, 21, 4)}
        {/* bico */}
        <path d="M22 24l3.2 5.4h-6.4z" fill="#e07a2f" />
      </>
    ),
  },

  /* ---------- CAPIVARA ---------- */
  capivara: {
    nome: 'Capivara',
    fundo: '#3a2a1c',
    desenho: (
      <>
        <ellipse cx="13" cy="14" rx="3.4" ry="3" fill="#8a5a34" />
        <ellipse cx="31" cy="14" rx="3.4" ry="3" fill="#8a5a34" />
        {/* cabeça: retangular e achatada, que é o jeito dela */}
        <path d="M8 22c0-6 6-9 14-9s14 3 14 9v6c0 5-6 8-14 8S8 33 8 28z" fill="#a3703f" />
        {/* focinho */}
        <ellipse cx="22" cy="30" rx="8" ry="5.5" fill="#c08d55" />
        {olho(16, 21, 2.6)}
        {olho(28, 21, 2.6)}
        <ellipse cx="22" cy="28.5" rx="3" ry="2" fill="#4a2f18" />
        {/* sempre de boa */}
        <path d="M18.5 32.5q3.5 2.4 7 0" stroke="#4a2f18" strokeWidth="1.5"
              fill="none" strokeLinecap="round" />
      </>
    ),
  },

  /* ---------- TUCANO ----------
     Cabeça de frente e bico saindo para o lado. A primeira versão
     tinha o bico "colado" num vulto preto: sem o peito claro e sem
     o anel azul do olho, um tucano vira uma mancha. */
  tucano: {
    nome: 'Tucano',
    fundo: '#0d2b22',
    desenho: (
      <>
        {/* cabeça e peito */}
        <circle cx="17" cy="22" r="12.5" fill="#191919" />
        <path d="M8 27c1.5 5 5 8 9 8.6 3-2.6 4.6-6 5-9.6-4.6 2-9.6 2-14 1z" fill="#f7f1df" />
        <ellipse cx="14.5" cy="26" rx="7.5" ry="5" fill="#fbf6e8" />
        {/* bico: preso na cabeça, e com a linha da boca visível */}
        <path d="M25 16.5c7.5-1.6 14 .8 16.5 4.4-2.6 3.8-9 5.6-16.5 4z" fill="#f2a521" />
        <path d="M25 20.9c7.5 1.4 13.9-.4 16.5-4.4.6.9.9 1.9.9 2.9-2.6 3.8-9 5.6-16.5 4z"
              fill="#d95f1e" />
        <path d="M25 16.5c7.5-1.6 14 .8 16.5 4.4" stroke="#8a3c10" strokeWidth="1"
              fill="none" opacity=".6" />
        <path d="M39.5 21.4l2 -.5" stroke="#6d2f0c" strokeWidth="1.6" strokeLinecap="round" />
        {/* pele azul em volta do olho — é o que dá vida */}
        <circle cx="15" cy="19" r="5.4" fill="#63c9dd" />
        {olho(15, 19, 3.2)}
      </>
    ),
  },

  /* ---------- ARARA ----------
     O bico de arara é CURVO e ganchudo, e nasce colado no rosto.
     Na primeira versão ele era um retângulo escuro ao lado da
     cabeça — parecia outra coisa presa ali. */
  arara: {
    nome: 'Arara',
    fundo: '#0b2443',
    desenho: (
      <>
        {/* penas do alto */}
        <path d="M11 13c1-4 4-7 8-7.6-1.6 2.4-2.4 5-2.4 7.6z" fill="#1a6fd4" />
        <path d="M17 11c1.6-4 5-6.4 9-6-2.4 2-4 4.4-5 7z" fill="#2f8ce8" />
        <circle cx="19" cy="23" r="12.5" fill="#1a6fd4" />
        {/* rosto claro com as linhas de pena, marca da arara */}
        <ellipse cx="16.5" cy="22" rx="8" ry="7.6" fill="#fdfdfd" />
        <path d="M11 19.5h11M11 22.5h11M11 25.5h10" stroke="#cfe0f0" strokeWidth=".9" />
        {/* peito amarelo */}
        <path d="M10 31c3.6 3.4 8.6 4.4 13 2.6-.6-2.6-1.6-4.6-3-6.2-3.4 2-7 2.8-10 3.6z"
              fill="#f5c518" />
        {/* bico ganchudo, encaixado no rosto */}
        <path d="M25 17.5c5.6.4 8.6 3.4 8.6 7.2 0 4.4-4 7.4-8 6.6 2.4-2 3.4-4.4 3.4-7
                 0-2.6-1.6-5-4-6.8z" fill="#2a2a2a" />
        <path d="M25 17.5c5.6.4 8.6 3.4 8.6 7.2 0 1-.2 2-.6 2.8-1-3.6-4-6.4-8-8z"
              fill="#4f4f4f" />
        {olho(16.5, 21, 3.2)}
      </>
    ),
  },

  /* ---------- ONÇA ---------- */
  onca: {
    nome: 'Onça',
    fundo: '#3d2f10',
    desenho: (
      <>
        <path d="M10 13l4 5-4 2z" fill="#c98a24" />
        <path d="M34 13l-4 5 4 2z" fill="#c98a24" />
        <circle cx="12" cy="17" r="4.6" fill="#e5a83a" />
        <circle cx="32" cy="17" r="4.6" fill="#e5a83a" />
        <ellipse cx="22" cy="24" rx="13" ry="12" fill="#f0bd52" />
        {/* pintas */}
        <circle cx="12" cy="24" r="2" fill="#5c3d10" opacity=".7" />
        <circle cx="32" cy="24" r="2" fill="#5c3d10" opacity=".7" />
        <circle cx="15" cy="30" r="1.6" fill="#5c3d10" opacity=".7" />
        <circle cx="29" cy="30" r="1.6" fill="#5c3d10" opacity=".7" />
        <circle cx="22" cy="15" r="1.8" fill="#5c3d10" opacity=".7" />
        <ellipse cx="22" cy="28" rx="7" ry="5" fill="#fdf0d0" />
        {olho(17, 22, 3)}
        {olho(27, 22, 3)}
        <path d="M22 26l2 2h-4z" fill="#8a4a2a" />
        <path d="M22 28v2M22 30q-2.4 1.6-4.6 0M22 30q2.4 1.6 4.6 0"
              stroke="#8a4a2a" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      </>
    ),
  },

  /* ---------- PREGUIÇA ---------- */
  preguica: {
    nome: 'Preguiça',
    fundo: '#2d3a24',
    desenho: (
      <>
        <ellipse cx="22" cy="24" rx="13" ry="13" fill="#a89272" />
        <ellipse cx="22" cy="26" rx="10" ry="10" fill="#d8c9a8" />
        {/* as manchas escuras dos olhos, que é a marca dela */}
        <ellipse cx="16" cy="22" rx="4.6" ry="5.4" fill="#6b5535" transform="rotate(-18 16 22)" />
        <ellipse cx="28" cy="22" rx="4.6" ry="5.4" fill="#6b5535" transform="rotate(18 28 22)" />
        {olho(16, 22, 2.4)}
        {olho(28, 22, 2.4)}
        <ellipse cx="22" cy="28" rx="2.6" ry="2" fill="#5c4a2e" />
        {/* o sorriso mais tranquilo da lista */}
        <path d="M17.5 31q4.5 3.4 9 0" stroke="#5c4a2e" strokeWidth="1.6"
              fill="none" strokeLinecap="round" />
      </>
    ),
  },

  /* ---------- TARTARUGA ---------- */
  tartaruga: {
    nome: 'Tartaruga',
    fundo: '#0f3536',
    desenho: (
      <>
        <ellipse cx="22" cy="34" rx="6" ry="4.6" fill="#7cc36a" />
        {olho(19.5, 33, 2)}
        {olho(24.5, 33, 2)}
        <ellipse cx="9" cy="27" rx="4" ry="3" fill="#7cc36a" />
        <ellipse cx="35" cy="27" rx="4" ry="3" fill="#7cc36a" />
        {/* casco */}
        <path d="M22 7c9 0 15 7 15 13 0 5-7 8-15 8S7 25 7 20C7 14 13 7 22 7z" fill="#2f8f4e" />
        <path d="M22 11c6 0 10 4.4 10 8.6 0 3.4-4.6 5.4-10 5.4s-10-2-10-5.4C12 15.4 16 11 22 11z"
              fill="#3fa85f" />
        <path d="M22 12v13M13 20h18M17 14l3 5M27 14l-3 5M17 25l3-4M27 25l-3-4"
              stroke="#1f6b39" strokeWidth="1.3" strokeLinecap="round" />
      </>
    ),
  },

  /* ---------- MICO-LEÃO-DOURADO ----------
     Entrou no lugar do tatu, que entrou no lugar do boto.

     O boto era de perfil e virava mancha. O tatu, de frente, tinha
     o casco em cima da cabeça — e lia como corte de cabelo
     tigelinha, não como bicho.

     O mico resolve os dois: a juba dourada em volta do rosto
     escuro é a silhueta mais reconhecível da fauna brasileira, e
     funciona de frente porque é assim que ele sempre é retratado.
     A 32px continua sendo "aquele macaquinho laranja". */
  mico: {
    nome: 'Mico-leão',
    fundo: '#123024',
    desenho: (
      <>
        {/* juba */}
        <circle cx="22" cy="23" r="15" fill="#e07a1f" />
        <circle cx="22" cy="23" r="15" fill="none" stroke="#c2621a" strokeWidth="1" />
        {/* fios da juba: sem eles vira só um círculo laranja */}
        <path d="M22 8v4M12.5 11.5l2.4 3.2M31.5 11.5l-2.4 3.2M7.5 19l3.8 1.4M36.5 19l-3.8 1.4
                 M8.5 29l3.6-1.8M35.5 29l-3.6-1.8M14 36l1.8-3.4M30 36l-1.8-3.4"
              stroke="#f0a04b" strokeWidth="1.7" strokeLinecap="round" />
        {/* rosto */}
        <ellipse cx="22" cy="24.5" rx="8.2" ry="9" fill="#3f3128" />
        <ellipse cx="22" cy="27" rx="5.4" ry="5.2" fill="#5a483a" />
        {olho(18.8, 22.5, 2.7)}
        {olho(25.2, 22.5, 2.7)}
        <ellipse cx="22" cy="27" rx="1.9" ry="1.4" fill="#241a14" />
        <path d="M19.4 30q2.6 2 5.2 0" stroke="#241a14" strokeWidth="1.4"
              fill="none" strokeLinecap="round" />
      </>
    ),
  },
  /* ---------- LOBO-GUARÁ ----------
     O bicho do Cerrado, e o que estampa a nota de 200 reais.
     A marca dele são as orelhas enormes e a pelagem laranja. */
  lobo: {
    nome: 'Lobo-guará',
    fundo: '#3d2411',
    desenho: (
      <>
        {/* orelhas: altas e pontudas, o traço que o identifica */}
        <path d="M11 17c-1-6 0-10 2-11 2.4 1.6 4.4 5 5 9z" fill="#c9662a" />
        <path d="M33 17c1-6 0-10-2-11-2.4 1.6-4.4 5-5 9z" fill="#c9662a" />
        <path d="M12.5 16c-.6-4 0-6.6 1.2-7.2 1.4 1.2 2.6 3.4 3 6z" fill="#f0b088" />
        <path d="M31.5 16c.6-4 0-6.6-1.2-7.2-1.4 1.2-2.6 3.4-3 6z" fill="#f0b088" />
        {/* cabeça */}
        <path d="M9 25c0-7 5.8-11 13-11s13 4 13 11c0 6-4 10-13 10S9 31 9 25z" fill="#d4732f" />
        {/* focinho comprido e claro */}
        <path d="M15.5 28c0-3.4 2.8-5 6.5-5s6.5 1.6 6.5 5c0 3.6-3 6-6.5 6s-6.5-2.4-6.5-6z"
              fill="#f2c9a4" />
        {olho(16, 22, 2.7)}
        {olho(28, 22, 2.7)}
        <ellipse cx="22" cy="28.5" rx="2.6" ry="1.9" fill="#2b1a0c" />
        <path d="M22 30.4v2.2" stroke="#2b1a0c" strokeWidth="1.3" strokeLinecap="round" />
      </>
    ),
  },

  /* ---------- TAMANDUÁ ----------
     Focinho comprido é a silhueta inteira do bicho: sem ele,
     vira um cachorro escuro qualquer. */
  tamandua: {
    nome: 'Tamanduá',
    fundo: '#2a2f24',
    desenho: (
      <>
        <path d="M13 20c0-5 4.6-8 9.5-8S32 15 32 20v5c0 5-4 8-9.5 8S13 30 13 25z" fill="#6b6152" />
        {/* a faixa preta do peito, marca da espécie */}
        <path d="M15 22c4-1.6 9-1.6 13.6.6-.6 5.4-3.4 9-6.6 10.2-3.4-1.4-6-5-7-10.8z"
              fill="#2f2b25" />
        {/* focinho: fino, longo e curvado para baixo */}
        <path d="M14 21c-4.4 1.6-8 5.6-9.4 10.6 1.4.9 2.8 1.1 4 .6
                 1.6-4.2 4-7 7-8.6z" fill="#6b6152" />
        <circle cx="5.2" cy="31.4" r="1.5" fill="#221f1a" />
        {/* orelha pequena e redonda */}
        <circle cx="27.5" cy="14.5" r="3.4" fill="#544c40" />
        {olho(20, 19, 2.3)}
      </>
    ),
  },

  /* ---------- JACARÉ ---------- */
  jacare: {
    nome: 'Jacaré',
    fundo: '#12331f',
    desenho: (
      <>
        {/* olhos no alto da cabeça, como o bicho de verdade */}
        <ellipse cx="22" cy="26" rx="15" ry="10" fill="#4e8c46" />
        <ellipse cx="22" cy="30" rx="13" ry="5.6" fill="#7bb96a" />
        {/* dentes: a fileira é o que faz ler "jacaré" na hora */}
        <path d="M11 29.5l2 2.6 2-2.6 2 2.6 2-2.6 2 2.6 2-2.6 2 2.6 2-2.6 2 2.6 2-2.6"
              fill="#fff" stroke="#fff" strokeWidth=".6" strokeLinejoin="round" />
        {/* protuberâncias dos olhos */}
        <circle cx="15" cy="17" r="5.4" fill="#4e8c46" />
        <circle cx="29" cy="17" r="5.4" fill="#4e8c46" />
        <circle cx="15" cy="16.5" r="3.6" fill="#dcae2e" />
        <circle cx="29" cy="16.5" r="3.6" fill="#dcae2e" />
        {/* pupila em fenda vertical, de réptil */}
        <ellipse cx="15" cy="16.5" rx="1.1" ry="3" fill="#14180f" />
        <ellipse cx="29" cy="16.5" rx="1.1" ry="3" fill="#14180f" />
        <circle cx="15.9" cy="15" r="1" fill="#fff" opacity=".9" />
        <circle cx="29.9" cy="15" r="1" fill="#fff" opacity=".9" />
        {/* narinas */}
        <ellipse cx="19" cy="24" rx="1.3" ry="1" fill="#2c5c2a" />
        <ellipse cx="25" cy="24" rx="1.3" ry="1" fill="#2c5c2a" />
      </>
    ),
  },

  /* ---------- BOTO-COR-DE-ROSA ---------- */
  boto: {
    nome: 'Boto',
    fundo: '#3d1f33',
    desenho: (
      <>
        <ellipse cx="21" cy="24" rx="14" ry="12" fill="#e79ab8" />
        <ellipse cx="21" cy="28" rx="11" ry="7" fill="#f6c6d8" />
        {/* bico comprido, que é o que diferencia do golfinho comum */}
        <path d="M33 25c4.4.4 7.6 2 8.6 3.8-1.4 1.8-4.6 2.8-8.6 2.6z" fill="#e79ab8" />
        <path d="M33 28.6c4-.2 7.2.2 8.6 1.2-1.4 1.2-4.6 1.8-8.6 1.6z" fill="#f6c6d8" />
        {/* nadadeira dorsal */}
        <path d="M18 12.6c2.6-2.6 6-3.4 8.6-2-.6 2.6-2.6 4.8-5.4 6z" fill="#d2789c" />
        {olho(15, 22, 2.6)}
        {/* o sorriso do boto */}
        <path d="M26 30.4q3 2 5.6.6" stroke="#a85277" strokeWidth="1.4"
              fill="none" strokeLinecap="round" />
      </>
    ),
  },

  /* ---------- BEIJA-FLOR ----------
     Pequeno, mas o bico longo e as asas em movimento dão a
     silhueta inconfundível. */
  'beija-flor': {
    nome: 'Beija-flor',
    fundo: '#0d3330',
    desenho: (
      <>
        {/* asas: uma acima e outra abaixo, sugerindo o bater */}
        <path d="M20 20c-5-4.4-11-5.6-15-3.4 2.6 3.4 7.6 5.6 13 5.6z" fill="#2fa88f" opacity=".85" />
        <path d="M20 26c-5 4.4-10.4 6-14.4 4.4 2.4-3.6 7-6 12.4-6.6z" fill="#1d7d6c" opacity=".85" />
        {/* corpo */}
        <ellipse cx="25" cy="24" rx="9.6" ry="8.4" fill="#2fd39b" />
        <ellipse cx="26" cy="27" rx="7" ry="5.4" fill="#8ff0cd" />
        {/* a garganta iridescente, marca do macho */}
        <path d="M20 27c2.6 2.4 6 3.4 9.4 2.8-.6 2.4-2.6 4-5.4 4.2-2.2-1.4-3.6-3.8-4-7z"
              fill="#e0457b" />
        {/* bico: fino e longo */}
        <path d="M16 22l-11 2.6 11 1.8z" fill="#1b1b1b" />
        {olho(25, 21, 2.5)}
        {/* topete */}
        <path d="M28 16c1.6-2.6 4-4 6.4-3.6-1 2.4-2.8 4.2-5 5z" fill="#1d7d6c" />
      </>
    ),
  },

  /* ---------- TATU-BOLA ----------
     As faixas da carapaça são a identidade dele. Sem elas,
     é só um bicho marrom arredondado. */
  tatu: {
    nome: 'Tatu',
    fundo: '#332a1c',
    desenho: (
      <>
        {/* carapaça */}
        <path d="M6 27c0-8.6 7.2-14 16-14s16 5.4 16 14c0 4.4-2 7-6 8H12c-4-1-6-3.6-6-8z"
              fill="#8a7550" />
        {/* as faixas */}
        <path d="M13 14.6c-2 3.6-3 8-3 13.4M20 12.4c-1.2 4-1.8 9.4-1.8 15.6
                 M28 13.2c.8 4 1.2 9.2 1.2 14.8M34.4 17c1 3 1.6 6.6 1.6 11"
              stroke="#5f4e32" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* cabeça, saindo da carapaça */}
        <path d="M22 30c-4 0-7 2.2-7 5.4 0 2.4 3 4.2 7 4.2s7-1.8 7-4.2c0-3.2-3-5.4-7-5.4z"
              fill="#b39a6d" />
        {olho(18.6, 34.6, 1.9)}
        {olho(25.4, 34.6, 1.9)}
        <ellipse cx="22" cy="38.4" rx="2" ry="1.4" fill="#4a3c26" />
        {/* orelhas pequenas e pontudas */}
        <path d="M14.6 31.4c-1.6-1.6-2.4-3.4-2-5 1.8.4 3.2 1.8 4 3.6z" fill="#8a7550" />
        <path d="M29.4 31.4c1.6-1.6 2.4-3.4 2-5-1.8.4-3.2 1.8-4 3.6z" fill="#8a7550" />
      </>
    ),
  },

  /* ---------- BEM-TE-VI ----------
     O pássaro que todo brasileiro já ouviu antes de ver. Peito
     amarelo e a faixa branca na cabeça. */
  bemtevi: {
    nome: 'Bem-te-vi',
    fundo: '#2b2410',
    desenho: (
      <>
        <circle cx="21" cy="21" r="12" fill="#3b3b3b" />
        {/* faixa branca por cima dos olhos, a marca da espécie */}
        <path d="M9.6 18c3.4-2.6 7.6-4 11.4-4s7.6 1.2 10.8 3.4c-.4 1.6-1 2.6-1.8 3
                 -6-2.6-12.4-2.6-18.6.4-.8-.6-1.4-1.6-1.8-2.8z" fill="#fdfdfd" />
        {/* peito amarelo */}
        <path d="M10 28c2.6 5.6 7 8.8 11.4 9 3.4-2.6 5.4-6.6 6-11.4-5.6 2.6-11.6 3-17.4 2.4z"
              fill="#f5c518" />
        <ellipse cx="19" cy="30" rx="7.6" ry="5.6" fill="#ffd94a" />
        {/* bico curto e forte */}
        <path d="M31 21.6c4.4-.6 8 .6 9.6 2.6-1.8 2.2-5.4 3.2-9.6 2.6z" fill="#2a2a2a" />
        <path d="M31 24.2c4.2.4 7.8-.4 9.6-2.6.4.7.6 1.4.6 2-1.8 2.2-5.4 3.2-10.2 2.6z"
              fill="#4a4a4a" />
        {olho(17, 19.6, 3)}
      </>
    ),
  },

  /* ---------- PEIXE-BOI ----------
     Gordo, cinza e manso. O focinho arredondado com bigodes é
     o que impede de virar uma pedra. */
  'peixe-boi': {
    nome: 'Peixe-boi',
    fundo: '#1f3540',
    desenho: (
      <>
        <ellipse cx="22" cy="25" rx="15" ry="12.4" fill="#7f8f96" />
        <ellipse cx="22" cy="29" rx="12" ry="8" fill="#a3b1b6" />
        {/* nadadeiras */}
        <path d="M8 30c-3.6 2-5.6 4.6-5.6 7 2.8.4 5.6-1 8-4z" fill="#6c7b82" />
        <path d="M36 30c3.6 2 5.6 4.6 5.6 7-2.8.4-5.6-1-8-4z" fill="#6c7b82" />
        {/* focinho */}
        <ellipse cx="22" cy="30.6" rx="7.4" ry="5.4" fill="#c2cdd1" />
        <ellipse cx="19" cy="29.4" rx="1.6" ry="1.2" fill="#4d5a60" />
        <ellipse cx="25" cy="29.4" rx="1.6" ry="1.2" fill="#4d5a60" />
        {/* bigodes */}
        <path d="M16 32.6l-3.4 1M16 34l-3 1.8M28 32.6l3.4 1M28 34l3 1.8"
              stroke="#5c696f" strokeWidth=".9" strokeLinecap="round" />
        <path d="M18.6 34.6q3.4 2.2 6.8 0" stroke="#5c696f" strokeWidth="1.4"
              fill="none" strokeLinecap="round" />
        {olho(15.6, 21, 2.4)}
        {olho(28.4, 21, 2.4)}
      </>
    ),
  },
};

export const NOMES_AVATAR = ['inicial', ...Object.keys(AVATARES)] as const;
export type NomeAvatar = (typeof NOMES_AVATAR)[number];

/* -------------------------------------------------------------
   O COMPONENTE
   ------------------------------------------------------------- */
export function Avatar({
  nome, avatar = 'inicial', tamanho = 44,
}: {
  nome: string;
  avatar?: string;
  tamanho?: number;
}) {
  const bicho = AVATARES[avatar];
  const [fundoInicial, traco] = corDe(nome);

  return (
    <span
      className="avatar"
      style={{ width: tamanho, height: tamanho, background: bicho?.fundo ?? fundoInicial }}
      /* Decorativo: o nome da pessoa já aparece escrito ao lado. */
      aria-hidden="true"
    >
      {bicho ? (
        <svg viewBox="0 0 44 44" width={tamanho} height={tamanho}>
          {bicho.desenho}
        </svg>
      ) : (
        <span
          className="avatar-iniciais"
          style={{ color: traco, fontSize: Math.round(tamanho * 0.38) }}
        >
          {iniciais(nome)}
        </span>
      )}
    </span>
  );
}
