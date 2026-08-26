'use client';

/* =============================================================
   confiia.com.br — os planos

   ─────────────────────────────────────────────────────────────
   O QUE ESTAVA ERRADO AQUI, E POR QUÊ

   A versão anterior era uma CORRIDA DE CHECKMARKS: quatro colunas
   de ticks, quarenta linhas, e o leitor tendo que cruzar tudo na
   cabeça para descobrir o que serve para ele. É a página de preço
   genérica que existe em qualquer serviço, sobre qualquer assunto
   — e era boa parte da sensação de "feito por máquina".

   Pior: cada item era um RÓTULO PELADO. "Detecta se a foto foi
   feita por IA" não significa nada para quem tem 62 anos e caiu
   num perfil falso. O tick dizia que existe; não dizia o que é.

   DUAS MUDANÇAS DE FUNDO:

   1. A pergunta de quem chega aqui não é "qual tem mais recurso".
      É "QUAL DESSES SOU EU?". Por isso a página abre com quatro
      situações escritas na primeira pessoa, antes de qualquer
      preço. A pessoa se reconhece numa frase e já sabe para onde
      olhar.

   2. Todo item traz o que ele FAZ, em uma linha, sempre visível.
      Não em tooltip, não atrás de clique: este site fala com
      gente que não vai caçar informação escondida. O cartão fica
      mais alto e isso é aceitável — a lista completa item por
      item continua na tabela comparativa, para quem quiser.

   Menos itens por cartão, cada um explicado, é melhor que a lista
   inteira sem explicação nenhuma.

   ─────────────────────────────────────────────────────────────
   CUIDADO AO MEXER:
     - Os limites (5, 30, 150 verificações) aparecem em TRÊS
       lugares: aqui, em `detalhes.tsx` e em `/conta/plano`.
       Mudar um sem os outros faz a pessoa ver números diferentes
       para a mesma coisa, que é exatamente o que este site diz
       para desconfiar.
     - `Antes de assinar` NÃO fica solto na página. Ele abre ao
       clicar em assinar, que é quando a pergunta existe. Ver
       `AntesDeAssinar` no fim deste arquivo.
     - A cobrança não existe (é a Etapa 9). A página diz isso em
       vez de fingir: página de preço com botão que não cobra é
       promessa vazia, e este site existe para ensinar a
       desconfiar disso.
   ============================================================= */

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { WHATSAPP_LINK } from '@/lib/contato';

type Ciclo = 'mes' | 'ano';

/* Um item do plano. `termo` é o que a pessoa procura; `oque` é o
   que aquilo significa na vida dela. Os dois sempre juntos. */
type Item = { termo: string; oque: string; falta?: boolean };

type Plano = {
  id: string;
  nome: string;
  /* A frase em primeira pessoa. É por ela que a pessoa se
     reconhece — vale mais que o nome do plano. */
  euSou: string;
  mes: string | null;
  ano: string | null;
  notaAno?: string;
  notaFixa?: string;
  destaque?: boolean;
  fita?: string;
  acao: { texto: string; href: string; forte?: boolean; externo?: boolean; assina?: boolean };
  itens: Item[];
};

const PLANOS: Plano[] = [
  {
    id: 'gratis',
    nome: 'Grátis',
    euSou: 'Chegou um link e eu só quero tirar essa dúvida.',
    mes: null, ano: null,
    notaFixa: 'Sem cartão. Sem virar cobrança depois.',
    acao: { texto: 'Verificar agora', href: '/#verificador' },
    itens: [
      {
        termo: '5 verificações por mês',
        oque: 'Uma verificação é cada link, perfil ou telefone que você manda conferir.',
      },
      {
        termo: 'O motivo, não só o veredito',
        oque: 'A gente mostra o que encontrou — domínio criado ontem, CNPJ que não existe — para você conferir e decidir.',
      },
      {
        termo: 'Histórico dos últimos 7 dias',
        oque: 'As consultas recentes ficam guardadas para você voltar nelas.',
      },
      {
        termo: 'Denunciar golpe',
        oque: 'Sempre de graça, em qualquer plano, e anônima por padrão.',
      },
      {
        termo: 'Análise de print e foto',
        oque: 'Mandar imagem custa caro para a gente processar. Entra no Básico.',
        falta: true,
      },
    ],
  },
  {
    id: 'basico',
    nome: 'Básico',
    euSou: 'Eu compro bastante pela internet e recebo link o dia todo.',
    mes: '12,90', ano: '8,25',
    notaAno: 'R$ 99 por ano, à vista',
    acao: { texto: 'Assinar Básico', href: '/criar-conta', assina: true },
    itens: [
      {
        termo: '30 verificações por mês',
        oque: 'Uma por dia, com folga. Se acabar, a gente avisa antes e você escolhe o que fazer.',
      },
      {
        termo: '5 imagens por mês',
        oque: 'Print da conversa, foto do anúncio, foto do perfil. A gente lê a imagem e diz o que viu nela.',
      },
      {
        termo: 'Reconhece rosto feito por computador',
        oque: 'Perfil falso quase sempre usa uma foto que nunca foi de ninguém. Dá para perceber, e a gente percebe.',
      },
      {
        termo: 'Histórico completo, com busca',
        oque: 'Tudo que você já verificou, procurável pelo nome do site ou do perfil.',
      },
      {
        termo: 'Botão no navegador',
        oque: 'Verifica a página que você está vendo sem precisar copiar o endereço e vir até aqui.',
      },
      {
        termo: 'Aviso ao abrir site reprovado',
        oque: 'Se você entrar num endereço que a gente já reprovou, aparece um aviso na hora — antes de você digitar qualquer coisa.',
      },
    ],
  },
  {
    id: 'premium',
    nome: 'Premium',
    euSou: 'Eu cuido de alguém que não entende de internet.',
    mes: '24,90', ano: '16,58',
    notaAno: 'R$ 199 por ano, à vista',
    destaque: true,
    fita: 'Mais escolhido',
    acao: { texto: 'Assinar Premium', href: '/criar-conta', forte: true, assina: true },
    itens: [
      {
        termo: 'Até 5 pessoas na mesma conta',
        oque: 'Sua mãe, seu pai, seu filho. Cada um entra com o próprio acesso, e a conta é uma só.',
      },
      {
        termo: 'Modo simples',
        oque: 'Letra grande, quase nenhum botão na tela e a resposta em uma frase. Para quem se perde numa tela cheia de opção.',
      },
      {
        termo: '150 verificações e 40 imagens por mês',
        oque: 'Divididas entre todo mundo da conta.',
      },
      {
        termo: 'A gente avisa se um site mudar',
        oque: 'Loja aprovada hoje pode trocar de dono amanhã. A gente continua olhando e avisa se mudar.',
      },
      {
        termo: 'Gente de verdade quando a máquina fica na dúvida',
        oque: 'Se a análise não tiver certeza, uma pessoa olha antes de responder. Palpite sobre dinheiro é pior que não responder.',
      },
      {
        termo: 'Alerta se seus dados vazarem',
        oque: 'Quando seu e-mail ou telefone aparecer num vazamento conhecido, você fica sabendo por nós.',
      },
    ],
  },
  {
    id: 'enterprise',
    nome: 'Empresa',
    euSou: 'Minha empresa precisa proteger clientes ou a equipe.',
    mes: null, ano: null,
    notaFixa: 'O preço sai conforme o volume',
    acao: { texto: 'Falar com a gente', href: WHATSAPP_LINK, externo: true },
    itens: [
      {
        termo: 'Volume combinado',
        oque: 'Sem teto fixo. A gente conversa sobre quanto sua operação usa e fecha em cima disso.',
      },
      {
        termo: 'API e webhooks',
        oque: 'Seu sistema pergunta direto ao nosso, sem ninguém abrir o site. Com documentação.',
      },
      {
        termo: 'Painel de equipe',
        oque: 'Quem vê o quê, quem pode o quê. Cada pessoa com o próprio acesso.',
      },
      {
        termo: 'WhatsApp Business e Slack',
        oque: 'A verificação acontece onde sua equipe já trabalha.',
      },
      {
        termo: 'Prazo de resposta em contrato',
        oque: 'SLA escrito, não promessa verbal.',
      },
      {
        termo: 'Nota fiscal e faturamento',
        oque: 'Pagamento por boleto ou faturamento mensal, com nota.',
      },
    ],
  },
];

/* =============================================================
   "QUAL DESSES É VOCÊ?"

   Vem ANTES de qualquer preço, e é a coisa mais importante desta
   página. Quem chega aqui não está comparando recursos: está
   tentando descobrir qual caixa é a dele.

   Clicar leva ao cartão e o destaca. É rolagem, não navegação —
   a página inteira continua ali para quem quiser ler tudo.
   ============================================================= */
function QualEVoce({ aoEscolher }: { aoEscolher: (id: string) => void }) {
  return (
    <section className="qual-voce" aria-labelledby="qual-voce-t">
      <h2 id="qual-voce-t">Qual desses é você?</h2>
      <p className="qual-voce-nota">
        Toque no que mais parece com a sua situação. Preço a gente vê depois.
      </p>
      <div className="qual-voce-grade">
        {PLANOS.map((p) => (
          <button
            type="button"
            className="qual-voce-op"
            key={p.id}
            onClick={() => aoEscolher(p.id)}
          >
            <span className="qual-voce-frase">{p.euSou}</span>
            <span className="qual-voce-leva">
              {p.nome} <i className="bi bi-arrow-down" aria-hidden="true" />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* =============================================================
   "ANTES DE ASSINAR"

   Estava solto no fim da página, como mais uma caixa entre
   outras. Ninguém lê aviso antes de ter a pergunta.

   Agora ele aparece no momento em que a pergunta existe: ao
   clicar em assinar. São os quatro fatos que mudam a decisão —
   e nenhum deles é vendedor.

   CUIDADO AO MEXER:
     - `<dialog>` de verdade, não uma div com z-index: o navegador
       cuida de Esc, do foco preso dentro e de esconder o resto da
       página do leitor de tela. Refazer isso à mão dá errado.
     - O último item diz que a gente pode errar. Ele fica, mesmo
       sendo o oposto do que uma tela de assinatura costuma dizer.
   ============================================================= */
const ANTES: { i: string; t: string; d: string }[] = [
  {
    i: 'bi-x-circle',
    t: 'Cancela quando quiser, sozinho',
    d: 'Direto na sua conta, sem ligar para ninguém e sem falar com vendedor. O plano vale até o fim do período que você já pagou.',
  },
  {
    i: 'bi-arrow-counterclockwise',
    t: '7 dias para desistir',
    d: 'Mudou de ideia? Devolvemos tudo, sem perguntar por quê. É o Código de Defesa do Consumidor, e a gente cumpre.',
  },
  {
    i: 'bi-eye-slash',
    t: 'Seus prints não ficam guardados',
    d: 'A imagem é apagada assim que a análise termina. Fica o resultado no seu histórico — nunca a foto.',
  },
  {
    i: 'bi-exclamation-triangle',
    t: 'A gente pode errar',
    d: 'Nenhuma ferramenta honesta garante que você não vai cair em golpe. A gente investiga o que dá para investigar e mostra o motivo de cada conclusão. A decisão continua sendo sua.',
  },
];

function AntesDeAssinar({
  plano,
  aoFechar,
}: {
  plano: Plano | null;
  aoFechar: () => void;
}) {
  const caixa = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = caixa.current;
    if (!d) return;
    if (plano && !d.open) d.showModal();
    if (!plano && d.open) d.close();
  }, [plano]);

  return (
    <dialog className="antes" ref={caixa} onClose={aoFechar} aria-labelledby="antes-t">
      {plano && (
        <>
          <div className="antes-topo">
            <p className="antes-olho">Antes de assinar</p>
            <h2 id="antes-t">{plano.nome}</h2>
            <button
              type="button"
              className="antes-fechar"
              onClick={aoFechar}
              aria-label="Fechar"
            >
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          </div>

          <ul className="antes-lista">
            {ANTES.map((a) => (
              <li key={a.t}>
                <i className={`bi ${a.i}`} aria-hidden="true" />
                <div>
                  <b>{a.t}</b>
                  <span>{a.d}</span>
                </div>
              </li>
            ))}
          </ul>

          {/* A verdade sobre onde este botão leva. Sem isto, a
              pessoa clicaria esperando uma tela de pagamento. */}
          <div className="antes-real">
            <i className="bi bi-cone-striped" aria-hidden="true" />
            <p>
              <b>A cobrança ainda não existe.</b> Continuar cria uma conta grátis, que
              funciona inteira. Quando a assinatura entrar no ar, a gente avisa você por
              e-mail — e nada é cobrado sem você aceitar de novo.
            </p>
          </div>

          <div className="antes-acoes">
            {/* Classes próprias, não `.btn--calmo`/`.btn--forte`.
                Aquelas foram desenhadas para o cartão BRANCO do
                verificador, onde `.btn--calmo` (branco, borda
                cinza) é o discreto da dupla. Sobre esta caixa
                escura, branco seria a coisa mais forte da tela e a
                hierarquia inverteria: a saída gritaria mais que a
                ação principal. Aqui o discreto é o transparente
                com borda fina. */}
            <button type="button" className="antes-btn antes-btn--sai" onClick={aoFechar}>
              Voltar
            </button>
            <Link className="antes-btn antes-btn--vai" href={plano.acao.href}>
              Criar minha conta grátis
            </Link>
          </div>
        </>
      )}
    </dialog>
  );
}

export function CartoesPlano() {
  const [ciclo, setCiclo] = useState<Ciclo>('mes');
  const [aceso, setAceso] = useState<string | null>(null);
  const [assinando, setAssinando] = useState<Plano | null>(null);

  /* Levar até o cartão e acender por um instante. O destaque
     apaga sozinho: marca permanente na tela vira sujeira. */
  function irPara(id: string) {
    document.getElementById(`plano-${id}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
    setAceso(id);
    window.setTimeout(() => setAceso((a) => (a === id ? null : a)), 2200);
  }

  return (
    <>
      <QualEVoce aoEscolher={irPara} />

      <div className="ciclo" role="group" aria-label="Ciclo de cobrança">
        <button type="button" aria-pressed={ciclo === 'mes'} onClick={() => setCiclo('mes')}>
          Mensal
        </button>
        <button type="button" aria-pressed={ciclo === 'ano'} onClick={() => setCiclo('ano')}>
          Anual <span className="selo">2 meses grátis</span>
        </button>
      </div>

      <div className="grade">
        {PLANOS.map((p) => {
          const preco = ciclo === 'ano' ? p.ano : p.mes;
          const nota = p.notaFixa ?? (ciclo === 'ano' ? p.notaAno : '');
          const classes = [
            'plano',
            p.destaque ? 'plano--destaque' : '',
            aceso === p.id ? 'plano--aceso' : '',
          ].filter(Boolean).join(' ');

          return (
            <article className={classes} id={`plano-${p.id}`} key={p.id}>
              {p.fita && <span className="fita">{p.fita}</span>}

              <h2>{p.nome}</h2>
              <p className="pra">{p.euSou}</p>

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

              {/* Altura reservada mesmo sem nota: sem isso os
                  cartões pulam de altura ao trocar o ciclo. */}
              <p className="preco-nota">{nota || ' '}</p>

              {p.acao.assina ? (
                <button
                  type="button"
                  className={p.acao.forte ? 'cta cta--forte' : 'cta cta--calma'}
                  onClick={() => setAssinando(p)}
                >
                  {p.acao.texto}
                </button>
              ) : p.acao.externo ? (
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

              <ul className="plano-itens">
                {p.itens.map((i) => (
                  <li className={i.falta ? 'na' : undefined} key={i.termo}>
                    <i
                      className={`bi ${i.falta ? 'bi-dash-lg' : 'bi-check-lg'}`}
                      aria-hidden="true"
                    />
                    <div>
                      <b>{i.termo}</b>
                      <span>{i.oque}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>

      <AntesDeAssinar plano={assinando} aoFechar={() => setAssinando(null)} />
    </>
  );
}
