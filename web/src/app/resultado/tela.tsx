'use client';

/* =============================================================
   confiia.com.br — a tela de resultado (DEMONSTRAÇÃO)

   Mostra como o veredito se lê. Os três botões trocam entre um
   caso perigoso, um suspeito e um confiável.

   ─────────────────────────────────────────────────────────────
   O AVISO DE DEMONSTRAÇÃO É PARTE DA PÁGINA, NÃO UM RODAPÉ

   Esta é a única tela do site que dá um VEREDITO. Num serviço
   antigolpe, deixar qualquer dúvida sobre o que é análise real e
   o que é maquete seria o erro mais grave possível — a pessoa
   sairia daqui achando que um endereço foi conferido quando não
   foi.

   Por isso o aviso é uma faixa fixa no topo, que acompanha a
   rolagem, e não some. Ele sai junto com a chegada do motor de
   análise, e não antes.
   ─────────────────────────────────────────────────────────────

   CUIDADO AO MEXER:
     - Os detalhes usam <details>/<summary> nativos: abrem e
       fecham por teclado sem uma linha de JavaScript, e o leitor
       de tela anuncia "recolhido/expandido" sozinho.
     - A barra do score é decorativa (`aria-hidden`): o número
       está escrito ao lado, e uma barra sem valor não diz nada a
       quem não enxerga.
   ============================================================= */

import { useState } from 'react';
import Link from 'next/link';
import { CASOS, type Estado } from './casos';

const BOTOES: { id: Estado; texto: string }[] = [
  { id: 'perigoso', texto: 'Perigoso' },
  { id: 'suspeito', texto: 'Suspeito' },
  { id: 'confiavel', texto: 'Confiável' },
];

export function TelaResultado() {
  const [estado, setEstado] = useState<Estado>('perigoso');
  const caso = CASOS[estado];

  return (
    <>
      {/* A faixa que não deixa dúvida. Ver o comentário do topo. */}
      <div className="faixa-demo" role="note">
        <i className="bi bi-cone-striped" aria-hidden="true" />
        <p>
          <b>Isto é uma demonstração.</b> Os endereços são inventados e os vereditos não
          vêm de análise nenhuma. A tela existe para mostrar como o resultado vai se ler
          quando a verificação de verdade entrar.
        </p>
      </div>

      <div className="demo" role="group" aria-label="Ver outro exemplo">
        <b>Ver exemplo</b>
        {BOTOES.map((b) => (
          <button
            type="button"
            key={b.id}
            aria-pressed={estado === b.id}
            onClick={() => setEstado(b.id)}
          >
            {b.texto}
          </button>
        ))}
      </div>

      <div className="tablet lg res-tablet">
        <span className="lg-refract" />
        <span className="lg-tint" />
        <span className="lg-shine" />

        <div className="tela">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="marca" src="/assets/logo-confia.svg" alt="confia?" />

          <div className={`veredito ${caso.classe}`}>
            <i className={`sinal bi ${caso.icone}`} aria-hidden="true" />
            <div>
              <h1>{caso.veredito}</h1>
              <span className="alvo">{caso.alvo}</span>
            </div>
          </div>

          <div className="score">
            <div className="score-topo">
              <span>Score de segurança</span>
              <b>
                {caso.score}
                <i>/100</i>
              </b>
            </div>
            <div className="res-barra" aria-hidden="true">
              <span className={caso.classe} style={{ width: `${caso.score}%` }} />
            </div>
            <div className="escala" aria-hidden="true">
              <span>Perigoso</span>
              <span>Suspeito</span>
              <span>Confiável</span>
            </div>
          </div>

          <p className="res-rotulo">Detalhes da análise</p>

          <ul className="itens">
            {caso.itens.map((it) => (
              <li key={it.t}>
                {/* <details> nativo: teclado e leitor de tela de
                    graça, sem JavaScript nenhum. */}
                <details open={it.aberto}>
                  <summary>
                    <i
                      className={`bi ${
                        it.e === 'ok'
                          ? 'bi-check-circle-fill'
                          : it.e === 'alerta'
                            ? 'bi-exclamation-circle-fill'
                            : 'bi-x-circle-fill'
                      } e-${it.e}`}
                      aria-hidden="true"
                    />
                    <span>{it.t}</span>
                    <i className="bi bi-chevron-down seta" aria-hidden="true" />
                  </summary>
                  <div className="item-corpo">
                    <p>{it.p}</p>
                    {it.tags.length > 0 && (
                      <div className="tags">
                        {it.tags.map((t) => (
                          <span className={`tag tag--${t.c}`} key={t.x}>{t.x}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </details>
              </li>
            ))}
          </ul>

          <div className="acoes">
            <Link className="acao acao--ghost" href="/">
              <i className="bi bi-arrow-left" aria-hidden="true" /> Voltar
            </Link>
            <Link className="acao acao--forte" href="/#verificador">
              <i className="bi bi-search" aria-hidden="true" /> Nova verificação
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
