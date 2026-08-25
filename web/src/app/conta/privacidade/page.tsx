/* =============================================================
   confiia.com.br — privacidade da conta

   Os direitos que a LGPD dá (art. 18) escritos em português, e
   não em citação de lei. A pessoa precisa saber o que pode
   pedir, não decorar o número do artigo.

   CUIDADO AO MEXER: os prazos aqui são PROMESSA. 15 dias para
   responder é o que a Política de Privacidade diz. Mudar um
   número aqui sem mudar lá cria duas promessas diferentes sobre
   a mesma coisa — e a que vale contra a gente é sempre a mais
   generosa das duas.
   ============================================================= */

import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { sessaoAtual } from '@/lib/sessao';

export const metadata: Metadata = { title: 'Privacidade' };
export const dynamic = 'force-dynamic';

const EMAIL_PRIVACIDADE = 'privacidade@confiia.com.br';

const DIREITOS = [
  {
    icone: 'bi-download',
    titulo: 'Pedir uma cópia',
    texto:
      'A gente manda tudo o que temos sobre você num arquivo, em formato que dá para abrir.',
    assunto: 'Quero uma cópia dos meus dados',
  },
  {
    icone: 'bi-pencil-square',
    titulo: 'Corrigir o que está errado',
    texto:
      'Nome, e-mail, telefone. O que dá para arrumar sozinho está em Perfil; o resto, é só pedir.',
    assunto: 'Quero corrigir um dado meu',
  },
  {
    icone: 'bi-trash3',
    titulo: 'Apagar a conta',
    texto:
      'Apagamos seus dados pessoais. O resultado das verificações continua, sem nada que ligue a você.',
    assunto: 'Quero apagar minha conta',
  },
  {
    icone: 'bi-slash-circle',
    titulo: 'Retirar uma autorização',
    texto:
      'O cookie de medição, por exemplo. Você pode desligar quando quiser, sem perder nada do serviço.',
    assunto: 'Quero retirar uma autorização',
  },
];

export default async function Privacidade() {
  const quem = await sessaoAtual();
  if (!quem) redirect('/entrar?destino=/conta/privacidade');

  return (
    <>
      <div className="painel-titulo">
        <h1>Privacidade</h1>
        <p>
          O que a gente guarda sobre você, por quanto tempo, e o que você pode exigir
          da gente a qualquer momento.
        </p>
      </div>

      <section className="cartao" aria-labelledby="t-guardamos">
        <div className="cartao-topo">
          <div>
            <h2 id="t-guardamos">O que fica guardado</h2>
          </div>
        </div>

        <div className="dados">
          <div className="dado">
            <span className="dado-rot">Nome, e-mail e telefone</span>
            <span className="dado-val">enquanto a conta existir</span>
          </div>
          <div className="dado">
            <span className="dado-rot">Rastro de entrada (aparelho e data)</span>
            <span className="dado-val">15 dias</span>
          </div>
          <div className="dado">
            <span className="dado-rot">Print ou foto que você envia</span>
            <span className="dado-val">
              <span className="selo selo--ok">
                <i className="bi bi-check-circle-fill" aria-hidden="true" /> apagado após a análise
              </span>
            </span>
          </div>
          <div className="dado">
            <span className="dado-rot">Resultado da verificação</span>
            <span className="dado-val">fica, sem ligação com você</span>
          </div>
        </div>

        {/* Este parágrafo é o que separa "guardamos o mínimo" de
            marketing vazio: explica POR QUE o resultado fica. */}
        <p className="cartao-texto" style={{ marginTop: 18 }}>
          O resultado continua guardado porque é ele que protege a próxima pessoa que
          verificar o mesmo link. Ele não guarda quem perguntou — só o que foi
          encontrado sobre o site, o perfil ou o número.
        </p>
      </section>

      <section className="cartao" aria-labelledby="t-direitos">
        <div className="cartao-topo">
          <div>
            <h2 id="t-direitos">O que você pode exigir</h2>
            <p>
              São direitos seus por lei. A gente responde em até <b>15 dias</b>, e não
              cobra nada por isso.
            </p>
          </div>
        </div>

        <ul className="direitos">
          {DIREITOS.map((d) => (
            <li className="direito" key={d.titulo}>
              <i className={`bi ${d.icone}`} aria-hidden="true" />
              <div>
                <b>{d.titulo}</b>
                <span>{d.texto}</span>
              </div>
              <a
                className="direito-acao"
                href={`mailto:${EMAIL_PRIVACIDADE}?subject=${encodeURIComponent(d.assunto)}`}
              >
                Pedir
              </a>
            </li>
          ))}
        </ul>

        <p className="cartao-texto" style={{ marginTop: 18 }}>
          Tudo por <a href={`mailto:${EMAIL_PRIVACIDADE}`}>{EMAIL_PRIVACIDADE}</a>. Se
          quiser ler a regra inteira, ela está na{' '}
          <Link href="/privacidade">Política de Privacidade</Link>.
        </p>
      </section>
    </>
  );
}
