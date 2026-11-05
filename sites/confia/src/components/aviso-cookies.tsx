'use client';

/* =============================================================
   confiia.com.br — o aviso de cookies

   Antes, para escolher, a pessoa tinha que descobrir sozinha o
   link no rodapé, abrir /cookies e decidir lá. Ninguém faz isso.
   Agora a escolha está na frente dela, com os dois botões.

   ─────────────────────────────────────────────────────────────
   ELE OBEDECE À NOSSA PRÓPRIA POLÍTICA — NÃO INVENTA CATEGORIA

   A página /cookies declara, e este componente cumpre:

     NECESSÁRIOS   confia_sessao, confia_csrf, confia_cookies,
                   confia_limite. Não dependem de autorização,
                   e por isso NÃO aparecem como opção aqui —
                   oferecer escolha sobre o que não é opcional
                   é teatro de consentimento.

     DE MEDIÇÃO    confia_uso. Só com autorização. É a única
                   coisa que estes botões decidem.

   A escolha é guardada no cookie `confia_cookies` por 12 meses,
   exatamente como a política promete. Se mudar aqui, mude lá —
   a política é o contrato, o código é só o cumprimento.
   ─────────────────────────────────────────────────────────────

   RECUSAR É TÃO FÁCIL QUANTO ACEITAR. Os dois botões têm o mesmo
   tamanho e o mesmo peso visual. Banner que esconde o "recusar"
   atrás de "gerenciar preferências" é padrão escuro, e num site
   que existe para combater enganação isso seria contradição.

   ─────────────────────────────────────────────────────────────
   POR QUE useSyncExternalStore

   O cookie é estado que vive FORA do React. Com useState eu
   precisaria de um efeito só para dar o primeiro valor — o React
   19 recusa isso, e com razão: é um render extra em toda visita.

   De quebra resolve a hidratação: `getServerSnapshot` devolve
   'ainda-nao-sei', o servidor não manda nada no HTML, e a
   decisão acontece no navegador, onde o cookie existe.
   ─────────────────────────────────────────────────────────────

   CUIDADO AO MEXER:
     - Não use `position:fixed` com `inset:0` nem trave o foco:
       este aviso NÃO bloqueia a página. Quem quiser ignorar,
       ignora — e continua lendo.
   ============================================================= */

import { useSyncExternalStore } from 'react';
import Link from 'next/link';

const COOKIE = 'confia_cookies';
const DOZE_MESES = 60 * 60 * 24 * 365;

type Escolha = 'tudo' | 'so-necessarios';
type Estado = Escolha | 'nao-escolheu' | 'ainda-nao-sei';

const ouvintes = new Set<() => void>();

function assina(avisar: () => void) {
  ouvintes.add(avisar);
  return () => ouvintes.delete(avisar);
}

function agora(): Estado {
  const achado = document.cookie.split('; ').find((c) => c.startsWith(`${COOKIE}=`));
  const valor = achado?.split('=')[1];
  return valor === 'tudo' || valor === 'so-necessarios' ? valor : 'nao-escolheu';
}

/* No servidor não há cookie do visitante. Este valor não renderiza
   nada, então o HTML do servidor e o do cliente batem. */
const noServidor = (): Estado => 'ainda-nao-sei';

function grava(valor: Escolha) {
  /* `Secure` só em https: no desenvolvimento a página é http e o
     navegador descartaria o cookie em silêncio — a escolha não
     seria guardada e o aviso voltaria a cada visita. */
  const seguro = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${COOKIE}=${valor}; Max-Age=${DOZE_MESES}; Path=/; SameSite=Lax${seguro}`;
  for (const avisar of ouvintes) avisar();
}

export function AvisoCookies() {
  const estado = useSyncExternalStore(assina, agora, noServidor);

  if (estado !== 'nao-escolheu') return null;

  return (
    <div className="cookies" role="region" aria-label="Aviso sobre cookies">
      <div className="cookies-texto">
        <p className="cookies-titulo">
          <i className="bi bi-cookie" aria-hidden="true" />
          A gente usa poucos cookies
        </p>
        <p>
          Os necessários mantêm você conectado e não dão para desligar. Além deles, só um:
          o de <b>medição</b>, que conta quais páginas as pessoas usam — sempre de forma
          agregada, nunca individual.{' '}
          <b>Nada de propaganda, pixel de rede social ou venda de dados.</b>{' '}
          <Link href="/cookies">Ler a política</Link>.
        </p>
      </div>

      {/* Os dois botões têm o mesmo tamanho de propósito: recusar
          precisa ser tão fácil quanto aceitar. */}
      <div className="cookies-acoes">
        <button type="button" className="cookies-btn" onClick={() => grava('so-necessarios')}>
          Só os necessários
        </button>
        <button
          type="button"
          className="cookies-btn cookies-btn--sim"
          onClick={() => grava('tudo')}
        >
          Aceitar todos
        </button>
      </div>
    </div>
  );
}
