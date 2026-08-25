'use client';

/* =============================================================
   confiia.com.br — os cartões de plano, com o seletor de ciclo

   Cliente porque o botão Mensal/Anual troca o preço de todos os
   cartões ao mesmo tempo. É a única coisa interativa da página;
   a tabela comparativa e as dúvidas ficam no servidor.

   ─────────────────────────────────────────────────────────────
   OS PREÇOS SÃO DADOS, NÃO TEXTO SOLTO

   No protótipo cada preço estava escrito dentro do HTML, em dois
   atributos (`data-mes` e `data-ano`), e um script trocava o
   texto na mão. Isso significa que aumentar um preço exigia
   caçar o número em três lugares — o cartão, a nota e a tabela —
   e esquecer um deixava o site anunciando dois preços
   diferentes para a mesma coisa.

   Aqui o preço mora em UM lugar: a lista abaixo.
   ─────────────────────────────────────────────────────────────

   CUIDADO AO MEXER:
     - `aria-pressed` nos botões não é enfeite: é como quem usa
       leitor de tela sabe qual ciclo está escolhido. Cor sozinha
       não conta.
     - Mexer em preço aqui NÃO muda a tabela comparativa nem a
       página /conta/plano. Confira as três.
     - O botão de assinar ainda não leva a lugar nenhum: a
       cobrança é a Etapa 9. Ele diz isso, em vez de fingir.
   ============================================================= */

import { useState } from 'react';
import Link from 'next/link';
import { WHATSAPP_LINK } from '@/lib/contato';

type Ciclo = 'mes' | 'ano';

type Plano = {
  id: string;
  nome: string;
  pra: string;
  /* `null` = não tem preço fixo (grátis ou sob medida) */
  mes: string | null;
  ano: string | null;
  notaAno?: string;
  notaFixa?: string;
  destaque?: boolean;
  fita?: string;
  acao: { texto: string; href: string; forte?: boolean; externo?: boolean };
  itens: { texto: string; falta?: boolean }[];
};

const PLANOS: Plano[] = [
  {
    id: 'gratis',
    nome: 'Grátis',
    pra: 'Pra tirar a dúvida daquele link que acabou de chegar.',
    mes: null, ano: null,
    notaFixa: 'Sem cartão, sem pegadinha',
    acao: { texto: 'Verificar agora', href: '/#verificador' },
    itens: [
      { texto: '2 verificações sem criar conta' },
      { texto: '5 por mês criando conta grátis' },
      { texto: 'Link, site e perfil de rede social' },
      { texto: 'Veredito com o motivo explicado' },
      { texto: 'Histórico dos últimos 7 dias' },
      { texto: 'Denunciar golpe que você recebeu' },
      { texto: 'Análise de print e foto', falta: true },
    ],
  },
  {
    id: 'basico',
    nome: 'Básico',
    pra: 'Pra quem compra online e recebe link o dia todo.',
    mes: '12,90', ano: '8,25',
    notaAno: 'R$ 99 por ano, à vista',
    acao: { texto: 'Assinar Básico', href: '/criar-conta' },
    itens: [
      { texto: '30 verificações por mês' },
      { texto: '5 imagens por mês — print, anúncio, foto de perfil' },
      { texto: 'Detecta se a foto foi feita por IA' },
      { texto: 'Histórico completo, com busca' },
      { texto: 'Extensão de navegador' },
      { texto: 'Aviso ao abrir site já reprovado' },
      { texto: 'Suporte por e-mail em até 24h' },
    ],
  },
  {
    id: 'premium',
    nome: 'Premium',
    pra: 'Pra cuidar de você e de quem não entende de internet.',
    mes: '24,90', ano: '16,58',
    notaAno: 'R$ 199 por ano, à vista',
    destaque: true,
    fita: 'Mais escolhido',
    acao: { texto: 'Assinar Premium', href: '/criar-conta', forte: true },
    itens: [
      { texto: '150 verificações por mês' },
      { texto: '40 imagens por mês' },
      { texto: 'Até 5 pessoas na mesma conta' },
      { texto: 'Modo simples pra quem tem dificuldade' },
      { texto: 'Monitoramento: avisamos se um site aprovado mudar' },
      { texto: 'Gente de verdade revisa quando a IA fica na dúvida' },
      { texto: 'Alerta se seu e-mail ou telefone vazar' },
      { texto: 'Resumo mensal do que chegou pra família' },
      { texto: 'Suporte prioritário' },
    ],
  },
  {
    id: 'enterprise',
    nome: 'Enterprise',
    pra: 'Pra empresa que precisa proteger clientes ou equipe.',
    mes: null, ano: null,
    notaFixa: 'Conforme volume e integração',
    acao: { texto: 'Falar com a gente', href: WHATSAPP_LINK, externo: true },
    itens: [
      { texto: 'Volume combinado, sem teto fixo' },
      { texto: 'API e webhooks com documentação' },
      { texto: 'Painel de equipe com permissões' },
      { texto: 'Integração com WhatsApp Business e Slack' },
      { texto: 'Relatório de tudo que passou pela empresa' },
      { texto: 'SLA em contrato' },
      { texto: 'Atendimento ao vivo' },
      { texto: 'Nota fiscal e faturamento' },
    ],
  },
];

export function CartoesPlano() {
  const [ciclo, setCiclo] = useState<Ciclo>('mes');

  return (
    <>
      <div className="ciclo" role="group" aria-label="Ciclo de cobrança">
        <button
          type="button"
          aria-pressed={ciclo === 'mes'}
          onClick={() => setCiclo('mes')}
        >
          Mensal
        </button>
        <button
          type="button"
          aria-pressed={ciclo === 'ano'}
          onClick={() => setCiclo('ano')}
        >
          Anual <span className="selo">2 meses grátis</span>
        </button>
      </div>

      <div className="grade">
        {PLANOS.map((p) => {
          const preco = ciclo === 'ano' ? p.ano : p.mes;
          const nota = p.notaFixa ?? (ciclo === 'ano' ? p.notaAno : '');

          return (
            <article
              className={p.destaque ? 'plano plano--destaque' : 'plano'}
              key={p.id}
            >
              {p.fita && <span className="fita">{p.fita}</span>}
              <h2>{p.nome}</h2>
              <p className="pra">{p.pra}</p>

              <div className="preco">
                {preco ? (
                  <>
                    <span className="moeda">R$</span>
                    <span className="valor">{preco}</span>
                    <span className="ciclo-txt">
                      {ciclo === 'ano' ? '/mês, no anual' : '/mês'}
                    </span>
                  </>
                ) : p.id === 'gratis' ? (
                  <>
                    <span className="moeda">R$</span>
                    <span className="valor">0</span>
                  </>
                ) : (
                  <span className="valor valor--texto">Sob medida</span>
                )}
              </div>

              {/* Altura reservada mesmo quando não há nota: sem isso
                  os cartões pulam de altura ao trocar o ciclo. */}
              <p className="preco-nota">{nota || ' '}</p>

              {p.acao.externo ? (
                <a
                  className={p.acao.forte ? 'cta cta--forte' : 'cta cta--calma'}
                  href={p.acao.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {p.acao.texto}
                </a>
              ) : (
                <Link
                  className={p.acao.forte ? 'cta cta--forte' : 'cta cta--calma'}
                  href={p.acao.href}
                >
                  {p.acao.texto}
                </Link>
              )}

              <ul>
                {p.itens.map((i) => (
                  <li className={i.falta ? 'na' : undefined} key={i.texto}>
                    <i
                      className={`bi ${i.falta ? 'bi-dash-lg' : 'bi-check-lg'}`}
                      aria-hidden="true"
                    />
                    <span>{i.texto}</span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </>
  );
}
