'use client';

/* =============================================================
   confiia.com.br — o formulário de cadastro de loja

   ─────────────────────────────────────────────────────────────
   QUEM CHEGA AQUI ESTÁ DESCONFIADO DA GENTE

   É uma loja pequena que apareceu com sinal de alerta num site
   que ela não escolheu. A primeira reação é irritação, não boa
   vontade. O formulário precisa ser curto, dizer o que faz com
   cada dado, e nunca pedir nada que não use.

   Por isso: seis campos, dois opcionais, nenhum upload, nenhuma
   pergunta sobre faturamento ou porte. Se um dado não muda o que
   a gente faz, ele não entra.
   ─────────────────────────────────────────────────────────────

   CUIDADO AO MEXER:
     - A máscara do CNPJ é só visual. O servidor recebe o que for
       e limpa — nunca confie na máscara para garantir formato.
     - `noValidate`: as mensagens são as nossas, em português, e
       dizem o que fazer. As do navegador aparecem em inglês em
       parte dos aparelhos.
     - A declaração final é o que responsabiliza quem cadastra.
       Ela não pode vir marcada por padrão.

     - E ela trava o envio em DOIS lugares, de propósito:
       aqui (para a pessoa saber ANTES de mandar) e em
       `lib/acoes-loja.ts`, que recusa sem ela. Se você tirar a
       trava daqui, a de lá segura — mas a pessoa só descobre
       depois da viagem até o servidor, que é o defeito que
       existia. Se tirar a de lá, não sobra nada: o navegador é
       do outro lado, e do outro lado ninguém manda.

     - `noValidate` no <form> desliga a validação do navegador
       (as mensagens dele saem em inglês em parte dos aparelhos).
       Então `required` no checkbox NÃO faria nada aqui. É por
       isso que a trava é escrita à mão logo abaixo.
   ============================================================= */

import { useActionState, useRef, useState } from 'react';
import Link from 'next/link';
import { CamposArmadilha } from '@/components/campos-armadilha';
import { cadastrarLoja } from '@/lib/acoes-loja';
import { EMAIL_CONTATO } from '@/lib/contato';

const CATEGORIAS = [
  { v: 'moda',        t: 'Moda e acessórios' },
  { v: 'eletronicos', t: 'Eletrônicos e informática' },
  { v: 'casa',        t: 'Casa e decoração' },
  { v: 'alimentacao', t: 'Alimentação' },
  { v: 'servicos',    t: 'Serviços e assistência' },
  { v: 'automotivo',  t: 'Peças e automotivo' },
  { v: 'saude',       t: 'Saúde e beleza' },
  { v: 'outro',       t: 'Outro' },
];

/* 12345678000199 → 12.345.678/0001-99, conforme digita. */
function mascara(v: string) {
  const n = v.replace(/\D/g, '').slice(0, 14);
  if (n.length <= 2) return n;
  if (n.length <= 5) return `${n.slice(0, 2)}.${n.slice(2)}`;
  if (n.length <= 8) return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5)}`;
  if (n.length <= 12) return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8)}`;
  return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8, 12)}-${n.slice(12)}`;
}

export function FormaLoja({ carimbo }: { carimbo: string }) {
  const [estado, acao, enviando] = useActionState(cadastrarLoja, null);
  const [cnpj, setCnpj] = useState('');
  /* Só para revelar o campo do "Outro". A pergunta era feita e a
     resposta descartada — ver lib/acoes-loja.ts. */
  const [categoria, setCategoria] = useState('');

  /* A DECLARAÇÃO E A TRAVA DELA

     `aceito` guarda o estado do checkbox; `faltaAceitar` só vira
     true quando a pessoa TENTA enviar sem marcar. São dois
     estados e não um porque cobrar antes da tentativa é implicar
     com quem ainda está preenchendo — o aviso vermelho tem que
     aparecer no momento em que ele explica alguma coisa.

     `refAceite` existe para o foco voltar ao checkbox quando o
     envio é barrado. Sem isso, quem navega por teclado ou usa
     leitor de tela fica parado no botão sem saber para onde ir. */
  const [aceito, setAceito] = useState(false);
  const [faltaAceitar, setFaltaAceitar] = useState(false);
  const refAceite = useRef<HTMLInputElement>(null);

  if (estado?.protocolo) {
    return (
      <div className="denuncia-pronta">
        <i className="bi bi-check-circle-fill" aria-hidden="true" />
        <h2>Cadastro recebido</h2>
        <p>
          A gente confere a situação do CNPJ na Receita Federal e responde no e-mail que
          você deixou. Enquanto isso, a loja já aparece como <b>registrada</b>.
        </p>

        <p className="protocolo-rot">Seu protocolo</p>
        <p className="protocolo">{estado.protocolo}</p>

        {estado.precisaProvar ? (
          <div className="recado recado--info" style={{ marginTop: 22, textAlign: 'left' }}>
            <i className="bi bi-key" aria-hidden="true" />
            <p>
              <b>Falta provar que o site é seu.</b> A gente manda no e-mail de contato o
              passo a passo — é colocar um código no DNS ou um arquivo no servidor. Só
              depois disso o selo de <b>verificada</b> aparece para o cliente.
            </p>
          </div>
        ) : (
          <div className="recado recado--ok" style={{ marginTop: 22, textAlign: 'left' }}>
            <i className="bi bi-patch-check-fill" aria-hidden="true" />
            <p>
              <b>Você usou um e-mail do próprio domínio.</b> Isso já serve como prova de
              posse — é só confirmar o e-mail que a gente mandou e você pula o passo do
              DNS.
            </p>
          </div>
        )}

        <div className="denuncia-pronta-acoes">
          <Link className="btn btn--calmo" href="/">Voltar ao início</Link>
          <a className="btn btn--forte" href={`mailto:${EMAIL_CONTATO}?subject=${encodeURIComponent('Cadastro ' + estado.protocolo)}`}>
            Falar com a gente
          </a>
        </div>
      </div>
    );
  }

  return (
    <form action={acao} noValidate>
      <CamposArmadilha carimbo={carimbo} />

      <h2 className="forma-secao">Dados da empresa</h2>
      <p className="forma-secao-nota">
        A conferência na Receita Federal acontece na análise. Aqui a gente só confere se
        os números do CNPJ fecham entre si.
      </p>

      <div className="campo">
        <label htmlFor="cnpj">CNPJ</label>
        <input
          id="cnpj"
          name="cnpj"
          type="text"
          inputMode="numeric"
          value={cnpj}
          onChange={(e) => setCnpj(mascara(e.target.value))}
          placeholder="00.000.000/0000-00"
          autoComplete="off"
        />
      </div>

      <div className="campo">
        <label htmlFor="fantasia">Nome que aparece para o cliente</label>
        <input
          id="fantasia"
          name="fantasia"
          type="text"
          maxLength={120}
          placeholder="Kaza Verde Decorações"
        />
        <span className="dica">
          O nome pelo qual as pessoas conhecem a loja, não a razão social.
        </span>
      </div>

      <div className="campo">
        <label htmlFor="categoria">O que vocês fazem</label>
        <select
          id="categoria"
          name="categoria"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        >
          <option value="" disabled>Escolha…</option>
          {CATEGORIAS.map((c) => (
            <option value={c.v} key={c.v}>{c.t}</option>
          ))}
        </select>
      </div>

      {/* "Outro" gravava a palavra "outro" e nada mais. Quem não
          cabe em nenhuma das oito é justamente quem mais precisa
          explicar o que vende. */}
      {categoria === 'outro' && (
        <div className="campo campo--revelado">
          <label htmlFor="categoria_outro">O que vocês vendem ou fazem?</label>
          <input
            id="categoria_outro"
            name="categoria_outro"
            type="text"
            maxLength={80}
            autoFocus
            placeholder="Ex.: aluguel de equipamento para festa"
          />
          <span className="dica">
            É o que aparece para o cliente quando ele verificar sua loja.
          </span>
        </div>
      )}

      <div className="divisor" />

      <h2 className="forma-secao">Onde a loja atende</h2>
      <p className="forma-secao-nota">
        Cada endereço aqui passa a ser reconhecido como seu quando alguém verificar.
        Coloque só o que é realmente da empresa.
      </p>

      <div className="campo">
        <label htmlFor="site">Endereço do site</label>
        <input
          id="site"
          name="site"
          type="text"
          placeholder="minhaloja.com.br"
          autoComplete="url"
        />
        <span className="dica">
          Só o endereço, sem <code>https://</code>. É neste que a prova de posse é feita.
        </span>
      </div>

      <div className="dupla">
        <div className="campo">
          <label htmlFor="instagram">Instagram <em>(opcional)</em></label>
          <input id="instagram" name="instagram" type="text" placeholder="@minhaloja" />
        </div>
        <div className="campo">
          <label htmlFor="whatsapp">WhatsApp <em>(opcional)</em></label>
          <input
            id="whatsapp"
            name="whatsapp"
            type="tel"
            inputMode="numeric"
            placeholder="(00) 00000-0000"
          />
        </div>
      </div>

      <div className="campo">
        <label htmlFor="email">E-mail de contato</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="contato@minhaloja.com.br"
          autoComplete="email"
        />
        <span className="dica">
          Se for um e-mail <b>do próprio domínio</b>, ele já serve como prova de posse e
          você pula o passo do DNS.
        </span>
      </div>

      <div className="divisor" />

      {/* POR QUE ISTO NÃO É MAIS UM `.opcao`

          Era. E `.opcao` esconde o checkbox de verdade
          (`opacity:0`) e desenha uma pílula no lugar — o mesmo
          traço das escolhas de categoria logo acima. A declaração
          ficava com cara de preferência, de "marque se quiser",
          quando ela é a única linha do formulário que transfere
          responsabilidade para quem preenche.

          Agora é bloco próprio, com o quadrado de marcar à vista.
          Se você mexer no visual daqui, mexa sabendo disso: o que
          esta linha faz é separar "cadastrei minha empresa" de
          "cadastrei a empresa dos outros". */}
      <label className={`declaracao${faltaAceitar ? ' declaracao--cobrada' : ''}`}>
        <input
          ref={refAceite}
          type="checkbox"
          name="aceite"
          checked={aceito}
          onChange={(e) => {
            setAceito(e.target.checked);
            if (e.target.checked) setFaltaAceitar(false);
          }}
          aria-describedby="declaracao-peso"
        />
        <span>
          <b>Declaro que represento esta empresa</b> e que os dados que escrevi acima são
          verdadeiros.
          <span className="declaracao-peso" id="declaracao-peso">
            Cadastrar empresa que não é sua é falsidade — e o cadastro fica registrado com
            data, hora e endereço de onde foi enviado.
          </span>
        </span>
      </label>

      <div aria-live="polite">
        {faltaAceitar && !estado?.erro && (
          <p className="recado recado--erro">
            <i className="bi bi-exclamation-circle-fill" aria-hidden="true" /> Marque a
            declaração acima para continuar — ela é o que responsabiliza quem cadastra.
          </p>
        )}
        {estado?.erro && (
          <p className="recado recado--erro">
            <i className="bi bi-exclamation-circle-fill" aria-hidden="true" /> {estado.erro}
          </p>
        )}
      </div>

      <div className="rodape-form">
        <Link className="btn btn--calmo" href="/">Cancelar</Link>
        {/* `aria-disabled` E NÃO `disabled` — a diferença importa

            Botão com `disabled` de verdade some da navegação por
            teclado e fica mudo para leitor de tela: a pessoa chega
            ao fim do formulário, não acha botão nenhum e não é
            informada do motivo. Com `aria-disabled` ele continua
            alcançável, anuncia que está indisponível, e o clique
            leva o foco de volta à declaração dizendo o que falta.

            O `disabled` de verdade fica só para `enviando`, que é
            outra coisa: ali o objetivo é impedir envio em dobro,
            e dura um instante. */}
        <button
          className={`btn btn--forte${!aceito ? ' btn--travado' : ''}`}
          type="submit"
          disabled={enviando}
          aria-disabled={!aceito}
          onClick={(e) => {
            if (aceito) return;
            e.preventDefault();
            setFaltaAceitar(true);
            refAceite.current?.focus();
          }}
        >
          <i className="bi bi-shield-check" aria-hidden="true" />{' '}
          {enviando ? 'Enviando…' : 'Cadastrar loja'}
        </button>
      </div>
    </form>
  );
}
