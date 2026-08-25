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
   ============================================================= */

import { useActionState, useState } from 'react';
import Link from 'next/link';
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

export function FormaLoja() {
  const [estado, acao, enviando] = useActionState(cadastrarLoja, null);
  const [cnpj, setCnpj] = useState('');

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
        <span className="dica">
          MEI também vale. É de graça e sai no mesmo dia, pelo Portal do Empreendedor.
        </span>
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
        <select id="categoria" name="categoria" defaultValue="">
          <option value="" disabled>Escolha…</option>
          {CATEGORIAS.map((c) => (
            <option value={c.v} key={c.v}>{c.t}</option>
          ))}
        </select>
      </div>

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

      <div className="recado recado--info" style={{ marginBottom: 20 }}>
        <i className="bi bi-info-circle-fill" aria-hidden="true" />
        <p>
          <b>O cadastro não custa nada e não vira assinatura.</b> Ele existe porque
          separar loja honesta de loja falsa é bom para você e é bom para quem compra.
          Você pode sair quando quiser, por e-mail, sem justificar.
        </p>
      </div>

      <label className="opcao opcao--bloco">
        <input type="checkbox" name="aceite" />
        <span>
          <i className="bi bi-check2-square" aria-hidden="true" />
          Declaro que represento esta empresa e que os dados são verdadeiros.
        </span>
      </label>

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
          <i className="bi bi-shield-check" aria-hidden="true" />{' '}
          {enviando ? 'Enviando…' : 'Cadastrar loja'}
        </button>
      </div>
    </form>
  );
}
