'use client';

/* =============================================================
   confiia.com.br — os dez golpes, com "saber mais"

   Antes isto era HTML parado dentro da Home: dez cartõezinhos com
   nome e uma linha de legenda. A dona do projeto pediu o botão de
   "saber mais" abrindo uma caixa que explica COMO o golpe
   funciona, com fonte pesquisada.

   ─────────────────────────────────────────────────────────────
   A REGRA QUE VALE PARA CADA LINHA DESTE ARQUIVO

   **Nada aqui é inventado.** Cada golpe tem uma fonte oficial
   brasileira, escrita no rodapé da própria caixa, com link. Isso
   não é rigor acadêmico — é o produto: um site que ensina a
   desconfiar não pode ser o site que afirma sem mostrar de onde
   tirou.

   ⚠ SE VOCÊ ACRESCENTAR UM GOLPE AQUI e não achar fonte oficial
   para ele, ele entra SEM o "saber mais". Cartão sem botão é
   melhor que botão com texto inventado.

   ⚠ E se a fonte cair (link quebrado, página tirada do ar), a
   explicação sai junto. Fonte que ninguém consegue conferir é a
   mesma coisa que fonte nenhuma.
   ─────────────────────────────────────────────────────────────

   POR QUE UMA CAIXA, E NÃO O CARTÃO CRESCENDO

   Dez cartões numa grade. Se o clique fizesse o cartão crescer no
   lugar, os outros nove pulariam de posição — e a pessoa perderia
   de vista onde estava. A caixa abre por cima, sem mexer na
   grade, e fecha voltando o foco para o botão que a abriu.

   É `<dialog>` nativo, e não uma `<div>` fingindo de janela: ele
   já vem com prisão de foco, Esc para fechar e o anúncio certo
   para leitor de tela. O mesmo padrão do "Antes de assinar" em
   `/planos` — dois lugares com o mesmo comportamento devem usar a
   mesma peça.

   CUIDADO AO MEXER:
     - `showModal()` (e não `show()`) é o que prende o foco dentro
       da caixa. Trocar por `show()` deixa o teclado escapar para
       a página atrás, que continua rolando.
     - O `<dialog>` fica FORA da grade no JSX. Dentro dela ele
       herdaria `display:grid` e viraria mais uma célula.
   ============================================================= */

import { useState, useRef, useEffect } from 'react';

type Golpe = {
  id: string;
  /* `risk` é vermelho, `warn` é amarelo. A separação já existia no
     HTML antigo e diz o quanto o golpe custa: risco é dinheiro que
     some na hora; alerta é o que costuma dar tempo de perceber. */
  nivel: 'risk' | 'warn';
  icone: string;
  nome: string;
  resumo: string;
  comoFunciona: string[];
  entrega: string[];
  /* OPCIONAL DE PROPÓSITO. Golpe sem fonte pública conferível
     não ganha o botão "saber mais" — ver a regra no topo. */
  fonte?: { quem: string; url: string };
};

/* AS FONTES — todas oficiais, brasileiras, e TODAS CONFERIDAS
   ABRINDO O ENDEREÇO em 27/08/2026:

     RF        Receita Federal, manual "É Golpe?" de remessas
     CORREIOS  boletim "Mensagens falsas sobre encomendas"
     CVM       Comissão de Valores Mobiliários
     MJ        Ministério da Justiça, Aliança Nacional de Combate
               a Fraudes Bancárias e Digitais
     SENACON   Secretaria Nacional do Consumidor (MJ)

   ⚠ TRÊS FONTES FORAM TROCADAS DEPOIS DE CONFERIR, e vale saber
   por quê — é a regra do arquivo funcionando:

     · a do Procon-RS sobre ingressos respondia 404;
     · a do Secom sobre a alfândega redirecionava para uma tela
       de login, ou seja, ninguém de fora conseguia ler;
     · a de skins apontava para a HOME do Procon-SP, e home não é
       fonte — não prova a afirmação que estava do lado.

   Conferir com `curl` leva um minuto e é a diferença entre citar
   e fingir que citou. Refaça isso de tempos em tempos: página de
   governo muda de endereço com frequência. */
const RF_COMPRAS = {
  quem: 'Receita Federal — manual "É Golpe?"',
  url: 'https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/manuais/remessas-postal-e-expressa/e-golpe/compras-em-redes-sociais/compras-em-redes-sociais',
};
const RF_EMAIL = {
  quem: 'Receita Federal — "Recebi um e-mail suspeito"',
  url: 'https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/manuais/remessas-postal-e-expressa/e-golpe/recebi-um-e-mail-suspeito',
};
const CORREIOS = {
  quem: 'Correios — "Mensagens falsas sobre encomendas"',
  url: 'https://www.correios.com.br/central-de-informacoes/boletim-aos-clientes/mensagens-falsas-sobre-encomendas',
};
const CVM = {
  quem: 'CVM — alertas sobre ofertas irregulares',
  url: 'https://www.gov.br/cvm/pt-br/assuntos/protecao/alertas/ofertas-atuacoes-irregulares',
};
const MJ = {
  quem: 'Ministério da Justiça — Glossário de Fraudes e Golpes Digitais (out/2025)',
  url: 'https://www.gov.br/mj/pt-br/assuntos/alianca-nacional-de-combate-a-fraudes-bancarias-digitais',
};
/* DOIS GOLPES ESTÃO AQUI SEM FONTE, E ISSO É A REGRA FUNCIONANDO

   `jogo` (skins) e `ingresso` não têm `fonte`, então não ganham o
   botão "saber mais" — o cartão fica só com o resumo.

   Não foi por falta de procurar. O que apareceu, e por que caiu:

     · Procon-RS sobre ingressos falsos ........... 404
     · Senacon/MJ sobre golpe em ingressos ........ exige login
     · Secom sobre alfândega ...................... exige login
     · Procon-SP ................................... só a home responde

   As páginas de notícia do gov.br (`/assuntos/noticias/...`)
   ficam atrás de autenticação — testado inclusive com User-Agent
   de navegador, para descartar bloqueio de robô. Fonte que a
   pessoa não consegue abrir é a mesma coisa que fonte nenhuma.

   ⚠ ACHOU FONTE PÚBLICA PARA UM DELES? Acrescente a constante,
   ponha `fonte:` no golpe, e CONFIRA O ENDEREÇO ABRINDO antes de
   commitar. O botão aparece sozinho. */

const GOLPES: Golpe[] = [
  {
    id: 'loja',
    nivel: 'risk',
    icone: 'bi-bag-x',
    nome: 'Loja que não entrega',
    resumo: 'Site criado semana passada, preço fora da realidade, pagamento só por transferência ou Pix.',
    comoFunciona: [
      'A loja aparece num anúncio de rede social, com preço muito abaixo do mercado.',
      'Você compra e recebe uma confirmação de pagamento que parece real.',
      'Depois vem um código de rastreio — que não segue o padrão dos Correios nem das transportadoras.',
      'Aí chega a parte que dá lucro: uma <b>taxa de reenvio</b> ou de liberação, para o pedido "voltar a andar".',
      'Alguns criam até um site de rastreio falso, só para a história continuar de pé.',
    ],
    entrega: [
      'Nenhuma loja de verdade cobra taxa DEPOIS da compra já paga.',
      'Palavras como "descartado", "bloqueado" ou "leiloado" não são usadas por transportadora nenhuma.',
      'Confira o código de rastreio no site oficial dos Correios, nunca no link que te mandaram.',
    ],
    fonte: RF_COMPRAS,
  },
  {
    id: 'login',
    nivel: 'risk',
    icone: 'bi-shield-exclamation',
    nome: 'Página de login falsa',
    resumo: 'Cópia da tela do banco ou da rede social para roubar sua senha. Muda uma letra no endereço.',
    comoFunciona: [
      'Chega um SMS, e-mail ou mensagem com um susto ou uma pressa: conta bloqueada, prêmio expirando, entrega parada.',
      'O link leva a uma página igual à verdadeira — o desenho é copiado do site real.',
      'Você digita usuário e senha. A página guarda os dois e te joga no site verdadeiro, para parecer que só deu erro.',
      'Quando você percebe, quem entrou na conta foi outra pessoa.',
    ],
    entrega: [
      'O endereço tem uma letra trocada, um hífen a mais, ou termina em domínio que não é o da empresa.',
      'Órgão público e empresa séria não mandam link de pagamento nem de login por SMS.',
      'Em vez de clicar, abra o aplicativo ou digite o endereço você mesmo.',
    ],
    fonte: RF_EMAIL,
  },
  {
    id: 'perfil',
    nivel: 'risk',
    icone: 'bi-person-bounding-box',
    nome: 'Perfil clonado',
    resumo: 'Conta nova copiando o nome e as fotos de alguém que você conhece — ou de uma marca.',
    comoFunciona: [
      'O golpista copia foto, nome e até o texto de apresentação de um perfil real.',
      'Quando imita empresa, usa o nome, o CNPJ e às vezes o site da companhia verdadeira, só para ganhar credibilidade.',
      'Ele chama os contatos da pessoa copiada com uma emergência: um Pix urgente, uma oportunidade que acaba hoje.',
      'A conversa é feita para não sobrar tempo de você conferir.',
    ],
    entrega: [
      'Perfil criado há pouco tempo, com poucas publicações e poucos seguidores em comum.',
      'Pressa. Golpe de perfil clonado vive de urgência — dá para desmontar só esperando um dia.',
      'Ligue para a pessoa no número que você já tinha. Não no que apareceu na mensagem.',
    ],
    fonte: CVM,
  },
  {
    id: 'jogo',
    nivel: 'risk',
    icone: 'bi-controller',
    nome: 'Skin, case e conta de jogo',
    resumo: 'Sorteio de skin, troca fora da plataforma oficial, intermediário que some com o item.',
    comoFunciona: [
      'O item aparece por um preço muito abaixo do que vale no mercado.',
      'A negociação sai da plataforma oficial do jogo — vai para mensagem privada.',
      'O pagamento é pedido por Pix ou transferência, que não têm como voltar atrás.',
      'Depois do pagamento, o item não chega e o perfil some ou bloqueia você.',
    ],
    entrega: [
      'Preço muito abaixo do mercado é o primeiro sinal, e vale para qualquer compra.',
      'Sair da plataforma oficial é o que tira a sua proteção — é justamente por isso que ele pede.',
      'Pix e transferência para desconhecido não têm garantia de compra.',
    ],
  },
  {
    id: 'emprestimo',
    nivel: 'warn',
    icone: 'bi-cash-coin',
    nome: 'Empréstimo com taxa adiantada',
    resumo: 'Crédito aprovado sem consulta — desde que você pague antes um seguro ou taxa de liberação.',
    comoFunciona: [
      'Chega uma oferta de crédito com juros bem menores que os do mercado, e sem consulta ao seu nome.',
      'O empréstimo é "aprovado" rápido, às vezes com documento e contrato de aparência oficial.',
      'Antes do dinheiro cair, pedem um depósito: seguro, taxa de liberação, custo de cartório.',
      'Você paga, e o dinheiro do empréstimo nunca chega.',
    ],
    entrega: [
      'Instituição autorizada <b>desconta</b> a taxa do valor liberado. Nunca pede depósito antes.',
      'Juros muito abaixo do mercado, sem consultar seu nome, não existem.',
      'Confira se a instituição é autorizada pelo Banco Central antes de qualquer pagamento.',
    ],
    fonte: MJ,
  },
  {
    id: 'emprego',
    nivel: 'warn',
    icone: 'bi-briefcase',
    nome: 'Vaga e renda extra',
    resumo: 'Trabalho fácil por aplicativo, tarefa paga que pede depósito para liberar o saque.',
    comoFunciona: [
      'A mensagem chega por SMS ou WhatsApp: "você foi selecionado" para trabalho remoto, salário bom, tarefa simples.',
      'No começo funciona: você faz avaliações ou curte publicações e recebe valores pequenos de verdade.',
      'Aí seu saldo cresce, e para sacar aparece uma condição — depositar um valor para "liberar" ou subir de nível.',
      'Quanto mais você deposita, mais alta fica a próxima exigência.',
    ],
    entrega: [
      'Emprego de verdade não cobra taxa de cadastro, de treinamento nem de liberação.',
      'Os primeiros pagamentos pequenos são o investimento do golpista — servem para você confiar no maior.',
      'Ninguém paga bem por tarefa que não exige nada.',
    ],
    fonte: MJ,
  },
  {
    id: 'premio',
    nivel: 'warn',
    icone: 'bi-gift',
    nome: 'Prêmio que você não disputou',
    resumo: 'Sorteio, cupom ou “você foi selecionado”. Cobra um frete ou uma taxa para liberar.',
    comoFunciona: [
      'Chega a notícia de um prêmio, um cupom ou um valor esquecido em seu nome.',
      'Para receber, falta só uma coisa: um frete pequeno, uma taxa de saque, um imposto.',
      'O valor pedido é sempre baixo perto do prêmio — é o que faz parecer que vale a pena arriscar.',
      'Pago o primeiro, aparece um segundo. E um terceiro.',
    ],
    entrega: [
      'Prêmio de verdade não cobra nada para ser entregue.',
      'Você não ganha sorteio de que não participou.',
      'Valor esquecido em banco se consulta só no site oficial do Banco Central, e a consulta é de graça.',
    ],
    fonte: MJ,
  },
  {
    id: 'investimento',
    nivel: 'warn',
    icone: 'bi-graph-up-arrow',
    nome: 'Investimento milagroso',
    resumo: 'Rendimento garantido, cripto que só sobe, robô que nunca erra. Some com o depósito.',
    comoFunciona: [
      'A oferta chega por rede social ou grupo de mensagem, com ganho alto e rápido.',
      'Aparece uma plataforma com painel bonito, onde o seu saldo "rende" na tela todo dia.',
      'Pequenos saques no começo funcionam — é o que convence você a colocar mais, e a chamar gente conhecida.',
      'Quando o dinheiro que entra não cobre mais o que precisa sair, a plataforma some.',
    ],
    entrega: [
      '<b>Rendimento garantido não existe.</b> Promessa de ganho fixo e alto é sinal de fraude, não de oportunidade.',
      'Pressa para decidir é ferramenta do golpe, não característica do investimento.',
      'Consulte se a empresa é autorizada no cadastro da CVM antes de pôr um centavo.',
    ],
    fonte: CVM,
  },
  {
    id: 'ingresso',
    nivel: 'warn',
    icone: 'bi-ticket-perforated',
    nome: 'Ingresso e evento falso',
    resumo: 'Revenda de show, jogo ou festa. Entrega um PDF que não passa na catraca.',
    comoFunciona: [
      'O ingresso aparece esgotado no site oficial, e alguém oferece na rede social ou em grupo.',
      'O pagamento é pedido por Pix ou transferência, com pressa porque "tem outra pessoa querendo".',
      'Chega um PDF com código de barras — que pode ser cópia de um ingresso real já usado, ou vendido a dez pessoas.',
      'O problema só aparece na catraca, no dia, com você já no local.',
    ],
    entrega: [
      'Compre no site oficial do evento ou na bilheteria. É a única forma com garantia.',
      'Pix e transferência para desconhecido não voltam — e é por isso que é o que pedem.',
      'O mesmo código pode ter sido vendido várias vezes. Quem passar primeiro entra.',
    ],
  },
  {
    id: 'alfandega',
    nivel: 'warn',
    icone: 'bi-box-seam',
    nome: 'Taxa da alfândega',
    resumo: 'Seu pedido “parou na alfândega” e pede uma taxa para liberar. Chega por SMS ou e-mail, dias depois de você comprar de verdade.',
    comoFunciona: [
      'Você comprou alguma coisa de fora — isso é verdade, e é o que faz a mensagem colar.',
      'Dias depois chega SMS ou e-mail dizendo que a encomenda está retida na alfândega.',
      'Vem um link para pagar a taxa de liberação, normalmente por Pix, com prazo curto.',
      'O dinheiro vai para o golpista, e a sua encomenda seguia normal o tempo todo.',
    ],
    entrega: [
      '<b>Os Correios não mandam e-mail nem mensagem de aplicativo</b> sobre retenção na alfândega.',
      '<b>A Receita Federal nunca liga nem manda mensagem</b> cobrando para liberar mercadoria.',
      'Nenhum dos dois manda link de pagamento por SMS.',
      'Imposto de remessa se paga só no site dos Correios, em "Minhas Importações". E e-mail da Receita só vem de @RFB.GOV.BR.',
    ],
    fonte: CORREIOS,
  },
];

export function Golpes() {
  const [aberto, setAberto] = useState<Golpe | null>(null);
  const caixa = useRef<HTMLDialogElement>(null);
  /* Guarda quem abriu, para o foco voltar exatamente ali no fechar.
     Sem isso o foco cai no começo da página e quem usa teclado
     perde o lugar na grade de dez cartões. */
  const abridor = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const d = caixa.current;
    if (!d) return;
    if (aberto && !d.open) d.showModal();
    if (!aberto && d.open) d.close();
  }, [aberto]);

  function fechar() {
    setAberto(null);
    abridor.current?.focus();
  }

  return (
    <>
      <div className="grid-check">
        {GOLPES.map((g) => (
          <div className="check pane" key={g.id}>
            <i className={`ico ico--${g.nivel} bi ${g.icone}`} aria-hidden="true" />
            <div>
              <b>{g.nome}</b>
              <span>{g.resumo}</span>
              {/* Sem fonte, sem botão. Ver a regra no topo do
                  arquivo — dois dos dez estão nessa situação, e
                  cartão sem botão é melhor que botão com texto
                  que ninguém pode conferir. */}
              {g.fonte && (
                <button
                  type="button"
                  className="saber"
                  onClick={(e) => { abridor.current = e.currentTarget; setAberto(g); }}
                >
                  {/* O nome do golpe entra no rótulo só para leitor de
                      tela. Oito botões dizendo "Saber mais" e nada
                      mais são oito botões idênticos na lista de
                      links. */}
                  Saber mais<span className="sr"> sobre {g.nome}</span>
                  <i className="bi bi-arrow-right-short" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <dialog className="golpe-caixa" ref={caixa} onClose={fechar} aria-labelledby="golpe-t">
        {aberto && (
          <>
            <div className="golpe-topo">
              <i className={`ico ico--${aberto.nivel} bi ${aberto.icone}`} aria-hidden="true" />
              <h3 id="golpe-t">{aberto.nome}</h3>
              <button type="button" className="golpe-fechar" onClick={fechar} aria-label="Fechar">
                <i className="bi bi-x-lg" aria-hidden="true" />
              </button>
            </div>

            <div className="golpe-corpo">
              <section>
                <h4><i className="bi bi-diagram-3" aria-hidden="true" /> Como funciona</h4>
                <ol>
                  {aberto.comoFunciona.map((passo, i) => (
                    /* `dangerouslySetInnerHTML` NÃO é usado aqui, e não
                       pode ser: o projeto tem zero ocorrências dele, e
                       isso está escrito no SEGURANCA.md como uma das
                       defesas contra XSS. O <b> vem de dentro deste
                       arquivo, então é montado como elemento. */
                    <li key={i}>{comNegrito(passo)}</li>
                  ))}
                </ol>
              </section>

              <section>
                <h4><i className="bi bi-eye" aria-hidden="true" /> O que entrega</h4>
                <ul>
                  {aberto.entrega.map((sinal, i) => (
                    <li key={i}>
                      <i className="bi bi-check2" aria-hidden="true" />
                      <span>{comNegrito(sinal)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* A caixa só existe para golpe COM fonte, mas o
                TypeScript não sabe disso — a checagem aqui é o que
                prova para ele, e continua valendo se alguém abrir
                a caixa por outro caminho no futuro. */}
            {aberto.fonte && (
              <p className="golpe-fonte">
                <i className="bi bi-file-earmark-text" aria-hidden="true" />
                <span>
                  Fonte:{' '}
                  <a href={aberto.fonte.url} target="_blank" rel="noopener noreferrer">
                    {aberto.fonte.quem}
                  </a>
                </span>
              </p>
            )}
          </>
        )}
      </dialog>
    </>
  );
}

/* Transforma <b>isto</b> em elemento de verdade.

   Existe para o texto acima poder destacar a palavra que decide —
   "rendimento garantido não existe" — sem `dangerouslySetInnerHTML`,
   que este projeto não usa em lugar nenhum de propósito.

   Só entende <b>. Se você precisar de outra etiqueta, acrescente
   aqui em vez de abrir exceção para HTML cru. */
function comNegrito(texto: string) {
  const partes = texto.split(/<b>(.*?)<\/b>/g);
  return partes.map((p, i) => (i % 2 === 1 ? <b key={i}>{p}</b> : p));
}
