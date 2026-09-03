/* =============================================================
   confiia.com.br — aparelhos conectados

   Isto não é enfeite de painel. É como a pessoa DESCOBRE que
   alguém entrou na conta dela, e como ela expulsa essa pessoa
   sem depender de falar com a gente.

   ─────────────────────────────────────────────────────────────
   O QUE A GENTE GUARDA, E POR QUANTO TEMPO

   Guardar rastro de login é um dever de segurança e um risco de
   privacidade ao mesmo tempo: é exatamente o histórico de onde e
   quando a pessoa esteve.

   A regra do projeto: o rastro serve para a pessoa reconhecer
   uma invasão, e para nada além disso. Por isso ele se apaga
   sozinho em 15 dias. O que fica para sempre é o RESULTADO das
   verificações — nota do site, sinais encontrados —, porque
   isso protege a próxima pessoa que verificar o mesmo link e
   não diz nada sobre quem perguntou.

   A faxina é feita pelo banco, não por esta página. Ver a
   migração `013_faxina_sessoes.sql`.
   ─────────────────────────────────────────────────────────────
   ============================================================= */

import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { sessaoAtual, aparelhosConectados } from '@/lib/sessao';

export const metadata: Metadata = { title: 'Aparelhos conectados' };
export const dynamic = 'force-dynamic';

function quando(d: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(d);
}

/* O texto do navegador é longo e cheio de ruído técnico. A pessoa
   precisa reconhecer o APARELHO dela, não ler uma User-Agent. */
function apelidoDoAparelho(ua: string | null) {
  if (!ua) return { nome: 'Aparelho desconhecido', icone: 'bi-question-circle' };
  if (/iPhone/i.test(ua)) return { nome: 'iPhone', icone: 'bi-phone' };
  if (/iPad/i.test(ua)) return { nome: 'iPad', icone: 'bi-tablet' };
  if (/Android/i.test(ua)) return { nome: 'Celular Android', icone: 'bi-phone' };
  if (/Mac OS X|Macintosh/i.test(ua)) return { nome: 'Mac', icone: 'bi-laptop' };
  if (/Windows/i.test(ua)) return { nome: 'Computador com Windows', icone: 'bi-laptop' };
  if (/Linux/i.test(ua)) return { nome: 'Computador com Linux', icone: 'bi-laptop' };
  return { nome: 'Aparelho desconhecido', icone: 'bi-question-circle' };
}

export default async function Aparelhos() {
  const quem = await sessaoAtual();
  if (!quem) redirect('/entrar?destino=/conta/aparelhos');

  const aparelhos = await aparelhosConectados(quem.id);

  return (
    <>
      <div className="painel-titulo">
        <h1>Aparelhos conectados</h1>
        <p>
          Onde a sua conta está aberta agora. Se tiver algum que você não reconhece,
          troque a senha — isso desconecta todos de uma vez.
        </p>
      </div>

      <section className="cartao" aria-labelledby="t-lista">
        <div className="cartao-topo">
          <div>
            <h2 id="t-lista">
              {aparelhos.length === 1 ? '1 aparelho' : `${aparelhos.length} aparelhos`}
            </h2>
            <p>O primeiro da lista é este em que você está agora.</p>
          </div>
          <Link className="btn btn--calmo btn--linha" href="/esqueci-senha">
            <i className="bi bi-shield-lock" aria-hidden="true" /> Trocar senha
          </Link>
        </div>

        <ul className="aparelhos">
          {aparelhos.map((a, i) => {
            const { nome, icone } = apelidoDoAparelho(a.navegador);
            return (
              <li className="aparelho-item" key={a.id}>
                <i className={`bi ${icone}`} aria-hidden="true" />
                <div className="aparelho-texto">
                  <b>{nome}</b>
                  <span>Entrou em {quando(a.criadaEm)}</span>
                </div>
                {i === 0 && <span className="selo selo--ok">este aqui</span>}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="cartao" aria-labelledby="t-rastro">
        <div className="cartao-topo">
          <div>
            <h2 id="t-rastro">
              <i className="bi bi-clock-history" aria-hidden="true" /> Por quanto tempo
              guardamos isto
            </h2>
          </div>
        </div>

        <p className="cartao-texto">
          O registro de cada entrada — aparelho e data — é apagado sozinho{' '}
          <b>15 dias</b> depois. Ele existe para você reconhecer uma invasão, e não
          serve para mais nada, então não fica guardado além disso.
        </p>
        <p className="cartao-texto">
          O que continua guardado é o <b>resultado</b> das verificações: a nota de um
          site, os sinais encontrados. Isso protege a próxima pessoa que verificar o
          mesmo link — e não diz nada sobre quem perguntou.
        </p>
      </section>
    </>
  );
}
