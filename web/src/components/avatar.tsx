/* =============================================================
   confiia.com.br — AVATAR

   NÃO EXISTE UPLOAD DE FOTO DE PERFIL. É decisão de produto, e as
   razões são todas boas:

     - foto enviada precisa de moderação humana — alguém sempre
       sobe o que não pode, e aí vira trabalho seu toda semana;
     - arquivo enviado por desconhecido é porta de entrada;
     - foto de rosto é dado pessoal que teríamos que guardar,
       proteger, e apagar no prazo. Contraria o "guardamos o
       mínimo" que a nossa Política promete;
     - e não melhora nada no produto.

   Então: uma lista de desenhos que moram no nosso código. O banco
   guarda só o NOME do escolhido ('onda', 'arco'…), nunca caminho
   de arquivo.

   O PADRÃO É A INICIAL, com uma cor tirada do próprio nome. Assim
   quem não escolher nada já tem algo pessoal — e sempre a mesma
   cor, o que ajuda a reconhecer a própria conta de relance.

   CUIDADO AO MEXER:
     - Acrescentar avatar aqui é seguro. REMOVER quebra a conta de
       quem escolheu aquele: caia no `inicial` em vez de sumir.
     - Todo SVG é decorativo (aria-hidden). O nome da pessoa já
       está escrito ao lado — repetir seria o leitor de tela
       falando duas vezes.
   ============================================================= */

/* Paleta da marca. Cada par é fundo + traço. */
const CORES = [
  ['#0b2443', '#4d9fff'], // navy · azul
  ['#11375f', '#a9cdff'], // navy claro · céu
  ['#123d33', '#2fd39b'], // verde escuro · verde
  ['#3d2f10', '#ffc65c'], // âmbar escuro · âmbar
  ['#3d1f1a', '#ff7a6b'], // vinho · coral
  ['#1a2c4a', '#7fb3ff'], // azul aço
  ['#2a1f3d', '#b89cff'], // roxo
  ['#0f3536', '#5fd6d0'], // petróleo
] as const;

/** Cor estável a partir do texto: a mesma pessoa recebe sempre a
 *  mesma cor, em qualquer aparelho, sem guardar nada. */
function corDe(texto: string): readonly [string, string] {
  let n = 0;
  for (let i = 0; i < texto.length; i++) n = (n * 31 + texto.charCodeAt(i)) >>> 0;
  return CORES[n % CORES.length];
}

function iniciais(nome: string): string {
  const partes = (nome || '?').trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

/* -------------------------------------------------------------
   OS DESENHOS

   Formas geométricas simples, de propósito: leem bem a 32px,
   não envelhecem, e não carregam significado cultural que possa
   incomodar alguém.
   ------------------------------------------------------------- */
type Desenho = (traco: string) => React.ReactNode;

export const AVATARES: Record<string, { nome: string; desenho: Desenho }> = {
  onda: {
    nome: 'Onda',
    desenho: (c) => (
      <path d="M4 30c6-9 12-9 18 0s12 9 18 0" stroke={c} strokeWidth="4"
            fill="none" strokeLinecap="round" />
    ),
  },
  arco: {
    nome: 'Arco',
    desenho: (c) => (
      <path d="M10 34a12 12 0 0 1 24 0" stroke={c} strokeWidth="4"
            fill="none" strokeLinecap="round" />
    ),
  },
  anel: {
    nome: 'Anel',
    desenho: (c) => (
      <>
        <circle cx="22" cy="22" r="12" stroke={c} strokeWidth="3.5" fill="none" />
        <circle cx="22" cy="22" r="4" fill={c} />
      </>
    ),
  },
  meia: {
    nome: 'Meia-lua',
    desenho: (c) => (
      <path d="M22 8a14 14 0 1 0 0 28z" fill={c} />
    ),
  },
  cruz: {
    nome: 'Cruz',
    desenho: (c) => (
      <>
        <rect x="19.5" y="9" width="5" height="26" rx="2.5" fill={c} />
        <rect x="9" y="19.5" width="26" height="5" rx="2.5" fill={c} />
      </>
    ),
  },
  montanha: {
    nome: 'Montanha',
    desenho: (c) => (
      <path d="M7 32l9-13 6 8 5-6 10 11z" fill={c} />
    ),
  },
  tres: {
    nome: 'Três pontos',
    desenho: (c) => (
      <>
        <circle cx="13" cy="22" r="4" fill={c} />
        <circle cx="22" cy="22" r="4" fill={c} />
        <circle cx="31" cy="22" r="4" fill={c} />
      </>
    ),
  },
  losango: {
    nome: 'Losango',
    desenho: (c) => (
      <rect x="22" y="6" width="22" height="22" rx="4" fill={c}
            transform="rotate(45 22 6)" />
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
  /* De onde vem a cor:
       'inicial'  -> do NOME. É a figura pessoal: cada pessoa tem a
                     sua cor, sempre a mesma, em qualquer aparelho.
       os desenhos -> do próprio DESENHO. Assim cada opção da lista
                     aparece com uma cor diferente, e a escolha vira
                     "qual desenho E qual cor" em vez de oito
                     círculos iguais. */
  const [fundo, traco] = corDe(avatar === 'inicial' ? nome : avatar);
  const desenho = AVATARES[avatar]?.desenho;

  return (
    <span
      className="avatar"
      style={{ width: tamanho, height: tamanho, background: fundo }}
      /* Decorativo: o nome da pessoa já aparece escrito ao lado.
         Anunciar de novo seria o leitor de tela repetindo. */
      aria-hidden="true"
    >
      {desenho ? (
        <svg viewBox="0 0 44 44" width={tamanho} height={tamanho}>
          {desenho(traco)}
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
