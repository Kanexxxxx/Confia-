'use client';

/* =============================================================
   confiia.com.br — o formulário de denúncia

   ─────────────────────────────────────────────────────────────
   QUEM CHEGA AQUI ACABOU DE PERDER DINHEIRO

   Isso muda tudo no desenho do formulário:

     · O obrigatório é o MÍNIMO — tipo, alvo e relato. Todo o
       resto é opcional e diz isso na etiqueta. Um formulário
       longo demais é uma denúncia que não chega.
     · O erro nunca culpa quem escreveu. "Conte um pouco mais",
       não "campo inválido".
     · O primeiro bloco da lateral é o que fazer AGORA para tentar
       reaver o dinheiro. Ele vem antes do formulário na ordem de
       leitura em telas estreitas — a denúncia pode esperar cinco
       minutos, ligar para o banco não.
   ─────────────────────────────────────────────────────────────

   CUIDADO AO MEXER:
     - `noValidate` é de propósito: a validação é a do servidor,
       e as mensagens são as nossas. As do navegador aparecem em
       inglês em parte dos aparelhos e não dizem o que fazer.
     - O campo "o que teve de diferente" só aparece quando a
       pessoa marca "golpe novo". Sem `hidden` condicional ele
       seria mais um campo para ignorar.
     - O protocolo devolvido é a única forma de a pessoa
       acompanhar. Ele precisa ficar em destaque e dar para
       copiar com um toque.
   ============================================================= */

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { CamposArmadilha } from '@/components/campos-armadilha';
import { enviarDenuncia } from '@/lib/acoes-denuncia';

const TIPOS = [
  { v: 'loja',         i: 'bi-bag-x',                 t: 'Compra que não chegou' },
  { v: 'jogo',         i: 'bi-controller',            t: 'Jogo, skin ou case' },
  { v: 'emprestimo',   i: 'bi-cash-coin',             t: 'Empréstimo' },
  { v: 'emprego',      i: 'bi-briefcase',             t: 'Vaga ou renda extra' },
  { v: 'premio',       i: 'bi-gift',                  t: 'Prêmio ou sorteio' },
  { v: 'investimento', i: 'bi-graph-up-arrow',        t: 'Investimento' },
  { v: 'perfil',       i: 'bi-person-bounding-box',   t: 'Perfil falso' },
  { v: 'ligacao',      i: 'bi-telephone',             t: 'Ligação ou SMS' },
  { v: 'outro',        i: 'bi-three-dots',            t: 'Outro' },
];

export function FormaDenuncia({ carimbo }: { carimbo: string }) {
  const [estado, acao, enviando] = useActionState(enviarDenuncia, null);
  const [golpeNovo, setGolpeNovo] = useState(false);
  /* Estes dois existem só para revelar campo. Antes a tela
     perguntava e não tinha onde a resposta cair — ver o comentário
     em lib/acoes-denuncia.ts. */
  const [categoria, setCategoria] = useState('');
  const [visibilidade, setVisibilidade] = useState('anonima');

  /* Deu certo: o formulário sai da tela e fica só o protocolo.
     Mostrar o formulário preenchido junto com "enviado" faz a
     pessoa achar que precisa mandar de novo. */
  if (estado?.protocolo) {
    return (
      /* A TELA DE OBRIGADO — refeita em 27/08/2026

         Pedido da dona do projeto: "aparece uma mensagem na tela
         dela falando obrigado pela sua denúncia, isso ajuda nós e
         a população, e você fala o que acontece depois lá embaixo".

         O "o que acontece depois" VEIO DA LATERAL do formulário.
         Lá ele estava antes do envio, e ela disse que não fazia
         sentido: quem ainda está preenchendo não precisa saber do
         nosso processo interno — precisa é conseguir preencher.
         Depois de enviar, a mesma informação vira o que a pessoa
         quer saber. Mesma frase, momento certo.

         ⚠ SE VOCÊ MEXER AQUI, LEMBRE DA LATERAL em
         `denunciar/page.tsx`: os dois textos não podem voltar a
         existir ao mesmo tempo. */
      <div className="denuncia-pronta">
        <i className="bi bi-check-circle-fill" aria-hidden="true" />
        <h2>Obrigado. Sua denúncia entrou.</h2>

        {/* O agradecimento vem antes do processo, e é sincero: sem
            denúncia não existe base, e sem base o site não serve
            para nada. Quem acabou de relatar um golpe merece saber
            que aquilo teve utilidade. */}
        <p className="denuncia-obrigado">
          O que você acabou de contar não fica só com a gente: <b>ele protege a próxima
          pessoa que receber o mesmo link</b>. É assim que a nossa base cresce — uma
          denúncia de cada vez, de gente que passou por isso.
        </p>

        <p className="protocolo-rot">Seu protocolo</p>
        <p className="protocolo">{estado.protocolo}</p>
        <p className="protocolo-nota">
          Anote esse código. É por ele que a gente encontra a sua denúncia se você
          precisar falar com a gente.
        </p>

        <div className="depois">
          <h3>
            <i className="bi bi-clock-history" aria-hidden="true" /> O que acontece agora
          </h3>
          <ol>
            <li>
              <b>A gente confere</b> o que você mandou e cruza com outras denúncias do
              mesmo site, perfil ou número.
            </li>
            <li>
              <b>Quem confere é gente, não robô.</b> Denúncia é sobre a vida de alguém —
              de quem foi enganado e de quem foi acusado. Isso não se decide sozinho.
            </li>
            <li>
              <b>Confirmando, o alvo passa a aparecer marcado</b> para todo mundo que
              verificar aquilo aqui.
            </li>
            <li>
              <b>Se você deixou e-mail, a gente conta o desfecho.</b> Se não deixou, o
              protocolo acima é o seu caminho de volta.
            </li>
          </ol>
        </div>

        <p className="denuncia-guarde">
          <i className="bi bi-folder-check" aria-hidden="true" />
          <span>
            <b>Guarde as suas provas.</b> Print da conversa, comprovante, o anúncio — não
            apague nada. Se virar boletim de ocorrência ou contestação no banco, é isso
            que sustenta a sua versão.
          </span>
        </p>

        <div className="denuncia-pronta-acoes">
          <Link className="btn btn--calmo" href="/">Voltar ao início</Link>
          <Link className="btn btn--forte" href="/denunciar">Denunciar outro</Link>
        </div>
      </div>
    );
  }

  return (
    <form action={acao} noValidate>
      <CamposArmadilha carimbo={carimbo} />

      {/* ---------- que tipo ---------- */}
      <fieldset className="campo campo--grupo">
        <legend>Que tipo de golpe foi?</legend>
        <div className="opcoes">
          {TIPOS.map((o) => (
            <label className="opcao" key={o.v}>
              <input
                type="radio"
                name="categoria"
                value={o.v}
                checked={categoria === o.v}
                onChange={() => setCategoria(o.v)}
              />
              <span>
                <i className={`bi ${o.i}`} aria-hidden="true" /> {o.t}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* "Outro" gravava a palavra "outro" e mais nada — e é
          justamente a denúncia mais valiosa: a que não cabe em
          nenhuma gaveta que a gente já conhece. */}
      {categoria === 'outro' && (
        <div className="campo campo--revelado">
          <label htmlFor="categoria_outro">Que tipo de golpe foi?</label>
          <input
            id="categoria_outro"
            name="categoria_outro"
            type="text"
            maxLength={80}
            autoFocus
            placeholder="Ex.: cobrança de dívida que eu não tinha"
          />
          <span className="dica">
            Poucas palavras bastam. É assim que a gente descobre um tipo que ainda não
            está na lista.
          </span>
        </div>
      )}

      {/* Golpe inédito passa na frente da fila: ninguém está
          protegido dele ainda, nem tem aviso na base. */}
      <label className="novo">
        <input
          type="checkbox"
          name="golpe_novo"
          checked={golpeNovo}
          onChange={(e) => setGolpeNovo(e.target.checked)}
        />
        <span className="marca-novo" aria-hidden="true">
          <i className="bi bi-check-lg" />
        </span>
        <span className="txt-novo">
          <b>
            <i className="bi bi-lightning-charge-fill" aria-hidden="true" /> É um golpe
            novo, nunca vi isso antes
          </b>
          <small>
            Marque se não se parece com nenhum tipo acima, ou se o jeito de aplicar é
            diferente do que você conhecia. Golpe novo passa na frente da nossa fila.
          </small>
        </span>
      </label>

      {golpeNovo && (
        <div className="campo">
          <label htmlFor="descricao_novo">O que teve de diferente?</label>
          <input
            id="descricao_novo"
            name="descricao_novo"
            type="text"
            maxLength={200}
            placeholder="Ex.: pediram para instalar um aplicativo de banco pelo link"
          />
          <span className="dica">
            Em poucas palavras, o que fez esse golpe ser diferente dos que você conhecia.
          </span>
        </div>
      )}

      <div className="divisor" />

      {/* ---------- onde ---------- */}
      <div className="campo">
        <label htmlFor="alvo">Onde aconteceu?</label>
        <input
          id="alvo"
          name="alvo"
          type="text"
          maxLength={500}
          placeholder="Cole o link, o @ do perfil ou o número de telefone"
        />
        <span className="dica">
          É o dado mais importante da denúncia — é ele que fica marcado na nossa base.
        </span>
      </div>

      <div className="dupla">
        <div className="campo">
          <label htmlFor="quando">Quando foi? <em>(opcional)</em></label>
          <input id="quando" name="quando" type="date" />
        </div>
        <div className="campo">
          <label htmlFor="prejuizo">Quanto você perdeu? <em>(opcional)</em></label>
          <input
            id="prejuizo"
            name="prejuizo"
            type="text"
            inputMode="decimal"
            placeholder="R$ 0,00"
          />
          <span className="dica">Se não perdeu dinheiro, deixe em branco.</span>
        </div>
      </div>

      <div className="campo">
        <label htmlFor="se_passou">
          O golpista se passou por alguém? <em>(opcional)</em>
        </label>
        <input
          id="se_passou"
          name="se_passou"
          type="text"
          maxLength={120}
          placeholder="Ex.: Correios, um banco, uma loja conhecida, um parente"
        />
        <span className="dica">
          Quando várias denúncias citam a mesma empresa, a gente identifica que há uma
          campanha em andamento.
        </span>
      </div>

      <div className="campo">
        <label htmlFor="relato">Como foi? Conte com suas palavras</label>
        <textarea
          id="relato"
          name="relato"
          rows={6}
          maxLength={5000}
          placeholder="O que te chamou pra conversa, o que prometeram, como pediram o pagamento, o que aconteceu depois…"
        />
        <span className="dica">
          Quanto mais detalhe do roteiro, melhor a gente reconhece o mesmo golpe quando
          ele voltar com outro nome.
        </span>
      </div>

      <div className="divisor" />

      {/* ---------- contato ---------- */}
      <div className="dupla">
        <div className="campo">
          <label htmlFor="email">Seu e-mail <em>(opcional)</em></label>
          <input id="email" name="email" type="email" placeholder="voce@email.com" />
          <span className="dica">Só para te avisar do resultado. Não aparece na denúncia.</span>
        </div>
        <div className="campo">
          <label htmlFor="visibilidade">Como sua denúncia aparece</label>
          <select
            id="visibilidade"
            name="visibilidade"
            value={visibilidade}
            onChange={(e) => setVisibilidade(e.target.value)}
          >
            <option value="anonima">Anônima — ninguém vê quem denunciou</option>
            <option value="apelido">Com um apelido meu</option>
          </select>
        </div>
      </div>

      {/* Escolher "com apelido" não abria campo nenhum: a pessoa
          pedia para aparecer com apelido e nunca era perguntado
          qual. A denúncia saía anônima do mesmo jeito. */}
      {visibilidade === 'apelido' && (
        <div className="campo campo--revelado">
          <label htmlFor="apelido">Que apelido deve aparecer?</label>
          <input
            id="apelido"
            name="apelido"
            type="text"
            maxLength={60}
            autoFocus
            placeholder="Ex.: Vizinha do 302"
          />
          <span className="dica">
            <b>Não use seu nome verdadeiro.</b> Este é o único dado desta página que
            aparece para estranhos — o resto nunca sai daqui.
          </span>
        </div>
      )}

      <div className="recado recado--info">
        <i className="bi bi-shield-lock" aria-hidden="true" />
        <p>
          <b>Sua denúncia é anônima por padrão.</b> Publicamos o que foi denunciado — o
          site, o perfil, o número — nunca quem denunciou.
        </p>
      </div>

      {/* QUEM ANALISA É GENTE — 27/08/2026

          Pedido da dona do projeto: "essa parte não será dedicada
          à API da inteligência artificial e sim humana".

          Dizer isso na tela não é enfeite. Todo o resto do site
          fala em análise automática, e a pessoa que denuncia
          precisa saber que AQUI é diferente — porque denúncia
          decide a reputação de alguém. Errar sozinho, por conta de
          um robô, seria fazer com uma empresa o que a gente
          combate.

          ⚠ Isto vira promessa no momento em que aparece na tela.
          Se um dia a triagem virar automática, esta frase sai
          ANTES — não depois. */}
      <div className="recado recado--info">
        <i className="bi bi-person-check" aria-hidden="true" />
        <p>
          <b>Quem lê a sua denúncia é uma pessoa, não um robô.</b> Denúncia mexe com a
          reputação de quem foi denunciado e com o prejuízo de quem denunciou. Isso não
          se decide no automático.
        </p>
      </div>

      {/* aria-live: quem usa leitor de tela precisa OUVIR o erro,
          não descobrir procurando. */}
      <div aria-live="polite">
        {estado?.erro && (
          <p className="recado recado--erro">
            <i className="bi bi-exclamation-circle-fill" aria-hidden="true" /> {estado.erro}
          </p>
        )}
      </div>

      <div className="rodape-form">
        <Link className="btn btn--calmo" href="/">Cancelar</Link>
        <button className="btn btn--forte" type="submit" disabled={enviando}>
          <i className="bi bi-send" aria-hidden="true" />{' '}
          {enviando ? 'Enviando…' : 'Enviar denúncia'}
        </button>
      </div>
    </form>
  );
}
