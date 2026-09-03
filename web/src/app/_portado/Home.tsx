/* =============================================================
   GERADO por scripts/porta-pagina.mjs a partir de
   index.html

   Foi conferido à mão depois? Se este aviso ainda estiver aqui,
   NÃO. Confira antes de publicar.
   ============================================================= */

import Link from 'next/link';
import { Verificador } from '@/components/verificador';
import { Golpes } from '@/components/golpes';
/* `ContadorGolpes` foi APAGADO em 27/08/2026, junto com a seção
   "O tamanho do problema" e o CSS dele. Está no histórico do Git
   se alguém quiser de volta. Ver MELHORIAS.md § II, etapa 3. */

export function Home() {
  return (
    /* ESTRUTURA — POR QUE <main> ENVOLVE TUDO

       No protótipo o <main> era só o card do verificador. Parece
       detalhe, mas quem usa leitor de tela navega por marcos: com o
       <main> naquele lugar, o texto de apresentação, o "como
       funciona", os números e as políticas ficavam FORA de qualquer
       marco — a leitura pula direto para o card e o resto da página
       some da navegação rápida.

       Agora o <main> é a página, o card virou uma <section> com
       nome próprio, e o link "Pular para o conteúdo" do layout cai
       aqui. Só existe UM <main> por página: se esta página for
       aninhada em outra, tire este. */
    <main id="conteudo">

      <div className="hero" id="topo">

        <section className="pitch">
          <h1>
            <span className="ln"><span className="w" style={{ '--d': '.06s' } as React.CSSProperties}>Aquele link</span></span>
            <span className="ln"><span className="w" style={{ '--d': '.15s' } as React.CSSProperties}>é de verdade ou</span></span>
            <span className="ln"><span className="w" style={{ '--d': '.24s' } as React.CSSProperties}>é <em>golpe</em>?</span></span>
          </h1>

          {/* "em português" saiu daqui em 27/08/2026, pelo mesmo
              motivo que saiu do passo 3: o domínio é .com.br, a
              gente só opera no Brasil, e prometer o óbvio gasta a
              linha mais lida da página.

              ⚠ Se você mexer nesta frase, leia o passo 3 do
              `#como` antes. As duas dizem a mesma promessa — a
              resposta vem com o MOTIVO — e não podem divergir. */}
          <p className="sub rv" style={{ '--d': '.36s' } as React.CSSProperties}>
            Cole o link, o @ do perfil ou o print da conversa. A gente abre num ambiente
            isolado, longe do seu aparelho, e responde em segundos — com o motivo de cada
            conclusão, para você poder discordar.
          </p>

          {/* A DÚVIDA, NA PRIMEIRA PESSOA.

              Duas correções de uma vez.

              1. TAMANHO. Eram frases de 30 e poucos caracteres, e
                 dez delas viravam uma COLUNA de dez linhas numa
                 janela estreita — parecia lista de botões, não
                 apoio ao título. Encurtadas, formam uma nuvem que
                 quebra em duas ou três por linha.

              2. PESSOA. "Loja que você nunca ouviu falar" é a
                 gente falando da pessoa. "Loja que eu não conheço"
                 é o pensamento DELA, do jeito que ele aparece na
                 cabeça antes de clicar. Reconhecimento é o trabalho
                 inteiro deste bloco: a pessoa precisa ver a
                 situação dela aqui e entender que o site é pra ela.

              3. SÓ O QUE A GENTE FAZ — 27/08/2026. Eram dez, e
                 quatro delas prometiam o que o verificador não
                 verifica. "Central do banco" é ligação telefônica;
                 "Empréstimo fácil demais", "Vaga boa demais" e
                 "Skin muito barata" não chegam como link, @ ou
                 print — chegam como conversa.

                 A nuvem fica logo acima do campo onde a pessoa
                 cola alguma coisa. Cada frase aqui é lida como
                 "isto eu posso trazer". Prometer o que não se faz,
                 a dois centímetros do campo, é o pior lugar
                 possível para prometer errado.

                 Sobraram seis, e todas cabem no que o campo
                 aceita: link, endereço de site, @ e print.

              O movimento vem do CSS: a lupa da marca passa devagar
              por cima da nuvem. Ver `.marks::after` no globals. */}
          <div className="marks" id="marks">
            <span className="mark"><i className="bi bi-whatsapp" aria-hidden="true"></i> Link no WhatsApp</span>
            <span className="mark"><i className="bi bi-shop" aria-hidden="true"></i> Loja que não conheço</span>
            <span className="mark"><i className="bi bi-at" aria-hidden="true"></i> Perfil que me chamou</span>
            <span className="mark"><i className="bi bi-tag" aria-hidden="true"></i> Preço bom demais</span>
            <span className="mark"><i className="bi bi-gift" aria-hidden="true"></i> Prêmio que não disputei</span>
            <span className="mark"><i className="bi bi-link-45deg" aria-hidden="true"></i> Site com letra trocada</span>
          </div>
        </section>

        <section className="tablet lg" id="verificador" aria-label="Verificador">
          <span className="lg-refract"></span><span className="lg-tint"></span><span className="lg-shine"></span>

          <div className="screen">
            <svg className="mark-logo" role="img" aria-label="confia?"><use href="#logo-confia"/></svg>

            <p className="assinatura">
              Antes de clicar ou pagar… <b>confia?</b><br />
              Verifique links, sites e perfis em segundos.
            </p>

            <Verificador />

            <div className="conta">
              {/* A RESSALVA, NO LUGAR DA PROPAGANDA.

                  Aqui dizia "Depois das 2 primeiras, a conta guarda
                  o que você já verificou" — uma frase de venda,
                  colada embaixo do botão que a pessoa vai apertar
                  quando estiver com medo de perder dinheiro.

                  O lugar mais importante da página não é para
                  vender conta. É para avisar que a resposta pode
                  errar. Todo assistente sério faz isso; num serviço
                  antigolpe, deixar de fazer seria a própria
                  contradição — a pessoa confiaria cegamente numa
                  ferramenta que existe para ensinar a não confiar
                  cegamente. */}
              <p className="conta-nota">
                <i className="bi bi-info-circle" aria-hidden="true"></i>
                <span>
                  O confia? pode errar. Confira sempre os motivos que a gente mostra e,
                  em caso de dúvida, procure o banco ou a loja pelo canal oficial.{' '}
                  {/* O ponto vai DENTRO do link: solto do lado de fora ele
                      caía sozinho na linha seguinte quando o texto quebrava. */}
                  <Link href="/termos">Ler os termos.</Link>
                </span>
              </p>

              <div className="conta-acoes">
                <Link className="conta-btn" href="/criar-conta">
                  <i className="bi bi-person-plus" aria-hidden="true"></i> Criar conta
                </Link>
                <span className="conta-sep" aria-hidden="true"></span>
                <Link className="conta-link" href="/entrar">Já tenho conta</Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section id="como">
        <div className="sec-head">
          <p className="eyebrow">Como funciona</p>
          <h2>Três passos, uns poucos segundos</h2>
          <p>Você não precisa entender nada de internet. Se der pra copiar e colar, dá pra verificar.</p>
        </div>

        <div className="steps">
          <article className="step pane">
            <p className="num"><i className="bi bi-clipboard-plus" aria-hidden="true"></i> Passo 1</p>
            <h3>Cole ou anexe</h3>
            <p>Aquele link que chegou no WhatsApp, o site da loja, o perfil que te chamou no direct ou o print da conversa.</p>
            <ul>
              <li><i className="bi bi-check2" aria-hidden="true"></i> Link ou endereço de site</li>
              <li><i className="bi bi-check2" aria-hidden="true"></i> @ de perfil em rede social</li>
              <li><i className="bi bi-check2" aria-hidden="true"></i> Print, foto ou anúncio</li>
            </ul>
          </article>

          <article className="step pane">
            <p className="num"><i className="bi bi-binoculars" aria-hidden="true"></i> Passo 2</p>
            <h3>A gente abre no lugar do seu celular</h3>
            <p>O link é aberto num ambiente isolado, longe do seu aparelho. Ali dá pra ver pra onde ele leva de verdade e quem está por trás.</p>
            <ul>
              <li><i className="bi bi-check2" aria-hidden="true"></i> Seu aparelho não é exposto</li>
              <li><i className="bi bi-check2" aria-hidden="true"></i> Seguimos todos os redirecionamentos</li>
              <li><i className="bi bi-check2" aria-hidden="true"></i> Conferimos quem registrou o site</li>
            </ul>
          </article>

          {/* "RESPOSTA EM PORTUGUÊS" SAIU DAQUI — 27/08/2026

              O domínio é .com.br e a gente só opera no Brasil.
              Prometer que a resposta vem em português é prometer o
              óbvio — e o óbvio ocupou por meses o lugar da única
              promessa que separa este site de um antivírus: a
              resposta vem com o MOTIVO, e dá para discordar dele.

              É a mesma ideia do bloco de limites e do "a gente
              pode errar": o que sustenta confiança aqui não é
              dizer que acerta, é mostrar como chegou. */}
          <article className="step pane">
            <p className="num"><i className="bi bi-patch-check" aria-hidden="true"></i> Passo 3</p>
            <h3>Você vê por que, não só o quê</h3>
            <p>Nada de relatório técnico e nada de veredito seco. Vem a resposta, a lista do que
            encontramos, e o que fazer agora — para você poder discordar da gente.</p>
            <ul>
              <li><i className="bi bi-check2" aria-hidden="true"></i> Pode confiar</li>
              <li><i className="bi bi-check2" aria-hidden="true"></i> Melhor desconfiar</li>
              <li><i className="bi bi-check2" aria-hidden="true"></i> É golpe — não clique</li>
            </ul>
          </article>
        </div>
      </section>


      {/* A SEÇÃO "O TAMANHO DO PROBLEMA" FOI REMOVIDA — 27/08/2026

          Saíram juntos: o contador ao vivo, os três números
          (24 milhoes / R$ 29 bi / +43%) e a nota de fonte da
          Serasa. Decisao da dona do projeto: "nao gostei como
          voce fez, voce vai remover ele".

          O componente `ContadorGolpes` e o CSS dele foram
          apagados junto — ela nem lembrava que existiam, o que
          responde bem se valia a pena guardar. Está tudo no
          histórico do Git.

          ⚠ Se voltar a existir uma secao de numeros aqui, a fonte
          tem que voltar junto. Numero sem fonte neste site e o
          defeito que ele aponta nos outros. */}

      <section id="checagens">
        <div className="sec-head">
          <p className="eyebrow">Tipos de golpe</p>
          <h2>O que a gente reconhece</h2>
          <p>Estes são os golpes que dá para identificar a partir de um link, um @ ou um
          print — que é exatamente o que o verificador aceita. Se o seu caso está aqui,
          a gente consegue ajudar.</p>
        </div>

        {/* OS TRÊS DOSSIÊS FORAM REMOVIDOS — 27/08/2026

            Saíram os cartões de falsa venda / falsa central /
            WhatsApp, com os números da Febraban (174 mil, +314% e
            companhia), o parágrafo do 4º ao 10º lugar e a nota de
            fonte. Decisão da dona do projeto: "retire aquelas
            porcentagens do lado, não faz sentido estar ali, só
            deixa os exemplos".

            ⚠ O QUE SE PERDEU, PARA QUEM VIER DEPOIS: era o dado
            real que ordenava a lista sozinho — a troca de cartão,
            justamente o golpe que a gente NÃO verifica, caía para
            sétimo sem ninguém filtrar nada à mão. Sem número, a
            ordem da lista abaixo é escolha nossa, e o critério
            passou a ser outro: ela lista o que o verificador
            consegue reconhecer, e só isso.

            ⚠ Se um dia voltar número para esta seção, a fonte volta
            junto e o PERÍODO junto com ela. Número sem período
            vira mentira em seis meses. */}

        {/* A ORDEM DESTA SEÇÃO FOI INVERTIDA EM 27/08/2026

            Estava: título "O que a gente reconhece" → o bloco
            vermelho do que a gente NÃO faz → só então os exemplos.
            O título prometia uma coisa e a primeira coisa embaixo
            dele era a contrária.

            Agora vem o que a gente reconhece, e o limite depois —
            que é a ordem em que a pessoa pergunta: primeiro "vocês
            servem para o meu caso?", e só quem não se encontrou na
            lista precisa do bloco vermelho.

            ⚠ O limite continua ANTES do fim da página e em
            vermelho de largura inteira, de propósito. Ele perdeu a
            primeira posição, não o destaque. */}

        {/* OS DEZ GOLPES VIRARAM COMPONENTE — 27/08/2026

            Eram dez blocos de HTML escritos à mão aqui dentro.
            Viraram `components/golpes.tsx` porque a dona do
            projeto pediu um botão "saber mais" em cada um,
            abrindo uma caixa que explica como o golpe funciona —
            e isso precisa de JavaScript, que uma página de
            servidor não tem.

            ⚠ O texto de cada golpe, e principalmente A FONTE de
            cada um, mora lá. Não escreva golpe novo aqui: golpe
            sem fonte oficial é exatamente o que este site existe
            para não fazer.

            Os ícones continuam batendo com a legenda, e continua
            valendo o conferidor `npm run confere-icones`. */}
        <Golpes />

        {/* ─────────────────────────────────────────────────────────
            O QUE A GENTE NÃO FAZ — EM DESTAQUE, NÃO EM NOTA DE RODAPÉ

            Isto era um parágrafo pequeno no fim da seção. Num site que
            pede confiança, o limite do serviço é informação de
            primeira linha: quem não lê corre o risco de achar que
            estamos cobrindo o que não cobrimos, e confiar num "não
            encontramos nada" que nunca foi checado.
            ───────────────────────────────────────────────────────── */}
        <div className="limite">
          <div className="limite-topo">
            <i className="bi bi-hand-thumbs-down" aria-hidden="true"></i>
            <div>
              {/* <h3> e não <b> — 27/08/2026.

                  Este é o segundo assunto da seção, e quem navega
                  por leitor de tela pula de título em título. Como
                  <b>, o bloco inteiro não existia nessa navegação:
                  a pessoa saía de "O que a gente reconhece" direto
                  para "Por que existimos" e nunca sabia que havia
                  um aviso de limite no meio.

                  O tamanho continua vindo de `.limite-topo h3` no
                  globals — trocar a etiqueta não mudou nada na
                  aparência, de propósito. */}
              <h3>O que a gente ainda NÃO consegue verificar</h3>
              <span>Se o seu caso for um destes, a nossa resposta não serve — e é melhor
              você saber disso agora do que confiar num &ldquo;não encontramos nada&rdquo;
              que nunca foi checado. Em cada um está escrito o que fazer.</span>
            </div>
          </div>
          <ul className="limite-lista">
            {/* "CARTÃO CLONADO" SAIU EM 27/08/2026, pelo mesmo
                motivo do Pix: a gente não vai atrás de banco, e
                conta bancária não é "limite do nosso serviço" —
                é assunto que não é nosso.

                Com ele saiu a única citação da Febraban que ainda
                restava na home. Não faz falta: nada aqui afirma
                número, então não há o que fundamentar. */}
            {/* O ITEM DE PIX/BOLETO SAIU DAQUI — 27/08/2026

                Decisão da dona do projeto: a gente não vai atrás
                de banco, então conta bancária não é "limite do
                nosso serviço", é assunto que não é nosso.

                MAS O MED NÃO FOI APAGADO. Ele está em /denunciar,
                no bloco "Perdeu dinheiro agora?" — que é onde
                está quem precisa dele, e não quem só veio
                verificar um link. Os 80 dias são a informação
                desta página que mais faz dinheiro voltar; apagar
                seria custar dinheiro de gente real para arrumar
                uma seção.

                SE VOCÊ MEXER ALI, LEMBRE DAQUI: /denunciar virou
                o único lugar do site com o prazo do MED. */}
            <li>
              <i className="bi bi-telephone-x" aria-hidden="true"></i>
              <b>Ligação telefônica</b>
              <span>A gente confere link, site, perfil e print. Chamada de voz não deixa
              rastro que dê para conferir.</span>
              <p className="saida">
                <i className="bi bi-arrow-return-right" aria-hidden="true"></i>
                <b>O que fazer:</b> desligue e ligue <b>você</b> para o número oficial, o do
                site ou o do verso do cartão. Nenhuma empresa séria se ofende com isso — e
                golpista, ao contrário, insiste para você não desligar.
              </p>
            </li>

            {/* OS QUATRO ABAIXO ENTRARAM EM 27/08/2026

                Pedido da dona do projeto: "é até bom você colocar
                mais coisas, para deixar cem por cento explicativo".
                E ficou necessário — tirando o Pix e o cartão, a
                lista tinha sobrado com um item só, o que fazia
                parecer que a gente cobre quase tudo.

                REGRA DOS ITENS DAQUI: nenhum é sobre banco (não é
                assunto nosso), e todo um termina em CAMINHO. Bloco
                que lista o que não faz e para ali deixa a pessoa
                parada no meio do problema — foi crítica dela na
                rodada anterior, e vale para os novos também. */}

            <li>
              <i className="bi bi-chat-dots" aria-hidden="true"></i>
              <b>Mensagem sem link, sem @ e sem print</b>
              <span>Se a conversa foi só por áudio ou texto solto, não existe endereço,
              perfil nem imagem para abrir. Não tem o que conferir.</span>
              <p className="saida">
                <i className="bi bi-arrow-return-right" aria-hidden="true"></i>
                <b>O que fazer:</b> peça o site, o CNPJ ou o perfil, e traga aqui. Quem é
                honesto manda na hora. <b>Quem não manda já respondeu sua pergunta.</b>
              </p>
            </li>

            <li>
              <i className="bi bi-lock" aria-hidden="true"></i>
              <b>Perfil, grupo ou canal fechado</b>
              <span>A gente não entra em conta privada nem em grupo — e não vai criar
              perfil falso para isso, que seria fazer o que a gente denuncia.</span>
              <p className="saida">
                <i className="bi bi-arrow-return-right" aria-hidden="true"></i>
                <b>O que fazer:</b> mande o print. Da conversa, do anúncio, da tela de
                pagamento. Print a gente lê.
              </p>
            </li>

            <li>
              <i className="bi bi-box-seam" aria-hidden="true"></i>
              <b>Se a loja de verdade vai entregar</b>
              <span>A gente confere se a empresa <b>existe e é quem diz ser</b>. Não confere
              se o produto é bom, se chega no prazo ou se o atendimento presta — loja real
              também atrasa e também decepciona.</span>
              <p className="saida">
                <i className="bi bi-arrow-return-right" aria-hidden="true"></i>
                <b>O que fazer:</b> para problema de compra com empresa que existe, o
                caminho é o <b>consumidor.gov.br</b> (oficial, do governo, e as empresas
                respondem) ou o Procon da sua cidade.
              </p>
            </li>

            <li>
              <i className="bi bi-phone" aria-hidden="true"></i>
              <b>Aplicativo já instalado no seu celular</b>
              <span>Se você já baixou e instalou alguma coisa, a análise passa a ser do
              aparelho, e ela não acontece por aqui.</span>
              <p className="saida">
                <i className="bi bi-arrow-return-right" aria-hidden="true"></i>
                <b>O que fazer:</b> desinstale, e troque as senhas <b>de outro aparelho</b>
                — trocar do celular comprometido é entregar a senha nova junto.
              </p>
            </li>
          </ul>
        </div>

      </section>


      <section id="historia">
        <div className="historia">
          <div>
            <p className="eyebrow">Por que existimos</p>
            <h2>Ninguém cai por ser bobo. Cai por estar com pressa.</h2>

            {/* A skin de jogo saiu daqui em 27/08/2026, a pedido da
                dona do projeto. As três histórias precisam ser as
                que qualquer pessoa reconhece na própria família —
                e skin só é reconhecível para quem joga. Entrou a
                encomenda parada na alfândega, que é do mesmo
                tamanho de "todo mundo conhece alguém". */}
            <p>Todo mundo conhece alguém que caiu. A mãe que pagou um boleto que não era da
            loja. O primo que pagou a taxa para liberar uma encomenda que nunca existiu. O
            avô que atendeu a central do banco que não era o banco.</p>

            <p>O que essas histórias têm em comum não é burrice. É o <b>momento</b>. O golpe
            chega quando a pessoa está distraída, com medo, ou com vontade de acreditar — e
            a decisão precisa sair em segundos. Ninguém abre o registro do domínio no meio
            de uma conversa no WhatsApp.</p>

            <p>O confia? existe para ocupar esses segundos. Você cola o link, a gente abre
            num ambiente isolado, longe do seu aparelho, e responde em português: o que
            encontrou, por que aquilo é sinal de golpe, e o que fazer agora.{' '}
            <b>Sem termo técnico e sem julgar quem perguntou.</b></p>

            {/* A RESSALVA DE BETA E A ASSINATURA SAÍRAM — 27/08/2026

                Duas remoções pedidas pela dona do projeto: o
                parágrafo "ainda estamos em beta" e o "Feito no
                interior de São Paulo, melhorando toda semana".

                ⚠ O QUE ISSO CUSTOU, para quem vier depois: o
                CLAUDE.md lista quatro lugares onde o site avisa o
                que ainda não entrega. Este era um deles. Ficaram
                três — a faixa vermelha do /resultado, o "a gente
                pode errar" na ressalva embaixo do verificador, e a
                loja que nasce sempre `em_analise`.

                O aviso de que a gente pode errar NÃO sumiu do
                site: ele continua colado no verificador, que é
                onde a pessoa decide se confia. Era lá que ele
                importava. */}
          </div>

          <div className="crencas">
            <p className="crencas-titulo">O que a gente promete</p>

            <div className="crenca">
              <i className="bi bi-list-check" aria-hidden="true"></i>
              <div>
                <b>Mostramos o porquê</b>
                <span>Nunca só “é golpe”. Sempre a lista do que encontramos — domínio criado
                ontem, CNPJ que não existe, foto reaproveitada — para você conferir e decidir.</span>
              </div>
            </div>

            <div className="crenca">
              <i className="bi bi-patch-question" aria-hidden="true"></i>
              <div>
                <b>Não prometemos milagre</b>
                <span>Quando não temos certeza, a resposta é “melhor desconfiar”, não um
                veredito inventado. E dizemos o que não conseguimos verificar.</span>
              </div>
            </div>

            <div className="crenca">
              <i className="bi bi-trash3" aria-hidden="true"></i>
              <div>
                <b>Guardamos o mínimo</b>
                <span>O print que você manda é apagado assim que a análise termina. Fica o
                resultado, não a sua imagem.</span>
              </div>
            </div>

            <div className="crenca">
              <i className="bi bi-building-check" aria-hidden="true"></i>
              <div>
                <b>Empresa tem direito de resposta</b>
                <span>Loja honesta que aparecer com sinal ruim se cadastra, comprova o CNPJ
                e responde. De graça, e sem precisar falar com vendedor.</span>
              </div>
            </div>

            {/* A QUINTA PROMESSA — 27/08/2026

                Ditada pela dona do projeto, e ela enxergou uma
                coisa que faltava: até aqui as quatro promessas
                falavam só com QUEM DESCONFIA. Nenhuma falava com
                quem é alvo da desconfiança.

                E empresa nova carrega reputação suja sem ter feito
                nada — domínio recente, dono oculto, zero avaliação
                são exatamente os sinais que a gente aponta. Ela
                não consegue crescer porque parece golpe, e não
                tem como provar que não é.

                Isso é o nicho que traz empresa pequena até nós, e
                é por isso que esta promessa fica logo acima do
                convite "Tem uma loja? Cadastre de graça". As duas
                são a mesma ideia: uma explica, a outra convida.

                ⚠ Se você mexer no convite `#convites` lá embaixo,
                leia esta promessa antes — elas têm que continuar
                dizendo a mesma coisa. */}
            <div className="crenca">
              <i className="bi bi-shop-window" aria-hidden="true"></i>
              <div>
                <b>Ser novo não é ser golpe</b>
                <span>Empresa pequena começa parecendo suspeita: site recente, ninguém
                conhece, nenhuma avaliação. Ela perde venda por isso, sem ter feito nada.
                Aqui ela tem onde provar que é real — e é de graça, porque cobrar para
                alguém deixar de ser confundido com golpista seria o nosso próprio golpe.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="convites">
        <div className="convites">
          <a className="convite" href="/registrar-loja">
            <i className="ico bi bi-shop" aria-hidden="true"></i>
            <h3>Tem uma loja? Cadastre de graça</h3>
            <p>Loja nova sofre com desconfiança justamente por ser nova. Cadastre seu CNPJ e o endereço
            do seu site: quando alguém verificar sua loja, aparece que ela é registrada e conferida
            por aqui. Não custa nada e leva poucos minutos.</p>
            <em>Registrar minha loja <i className="bi bi-arrow-right" aria-hidden="true"></i></em>
          </a>

          <a className="convite" href="/denunciar">
            <i className="ico bi bi-megaphone" aria-hidden="true"></i>
            <h3>Caiu ou quase caiu? Conte pra gente</h3>
            <p>Sua denúncia entra na base e derruba a nota do site, do perfil ou do número.
            A próxima pessoa que verificar aquilo já recebe o aviso. Pode anexar prints e o
            boletim de ocorrência, e é anônima por padrão.</p>
            <em>Fazer uma denúncia <i className="bi bi-arrow-right" aria-hidden="true"></i></em>
          </a>
        </div>
      </section>

      <section id="politicas">
        <div className="sec-head">
          <p className="eyebrow">Ajuda e políticas</p>
          <h2>Transparência é parte do serviço</h2>
          <p>Um site que pede confiança devia começar respondendo o que ninguém gosta de
          perguntar. Aqui estão as respostas curtas. As longas estão nas políticas — e dizem
          exatamente a mesma coisa.</p>
        </div>

        {/* As quatro perguntas que a pessoa faz de verdade, com a
            resposta começando pela palavra que decide: Não / Vê /
            Só se você quiser / A gente pode errar. Duas delas não
            pegam bem, e é justamente por isso que estão aqui.
            ⚠ Toda resposta aqui é o que a política de privacidade já
              diz. Mudou lá, muda aqui. */}
        <div className="francas">
          <div className="franca">
            <p className="franca-p">&ldquo;O print que eu mandar fica guardado?&rdquo;</p>
            <p className="franca-r"><b>Não.</b> Imagem e print são apagados assim que a análise
            termina. Fica só o resultado — sem a imagem.</p>
          </div>
          <div className="franca">
            <p className="franca-p">&ldquo;Alguém de fora vê o que eu envio?&rdquo;</p>
            <p className="franca-r"><b>Vê.</b> Para ler o conteúdo a gente usa a OpenAI, e para
            saber se uma imagem foi feita por inteligência artificial, a Hive AI. As duas ficam
            nos Estados Unidos. A política tem a tabela do que cada uma recebe.</p>
          </div>
          <div className="franca">
            <p className="franca-p">&ldquo;Se eu denunciar, aparece meu nome?&rdquo;</p>
            <p className="franca-r"><b>Só se você quiser</b> — e mesmo assim com um apelido que
            você escolhe, nunca com o seu nome. A denúncia fica guardada por tempo
            indeterminado, já desligada de quem denunciou.</p>
          </div>
          <div className="franca">
            <p className="franca-p">&ldquo;E se vocês errarem?&rdquo;</p>
            <p className="franca-r"><b>A gente pode errar.</b> Não somos o seu banco nem a
            polícia, e a nossa resposta não substitui nenhum dos dois. Se a análise estiver
            errada, escreve pra gente: respondemos em até 7 dias, ou 15 se for pedido da LGPD.</p>
          </div>
        </div>

        <div className="grid-pol">
          <Link className="pol pane" href="/privacidade">
            <i className="ico bi bi-shield-lock" aria-hidden="true"></i>
            <b>Privacidade</b>
            <span>A tabela inteira: cada dado, o prazo dele e o motivo de existir. Mais os seus direitos e como usá-los.</span>
            <em>Ler a política <i className="bi bi-arrow-right" aria-hidden="true"></i></em>
          </Link>
          <Link className="pol pane" href="/termos">
            <i className="ico bi bi-file-earmark-text" aria-hidden="true"></i>
            <b>Termos de uso</b>
            <span>O que o confia? faz, o que ele não promete, e as regras de quem usa o serviço.</span>
            <em>Ler os termos <i className="bi bi-arrow-right" aria-hidden="true"></i></em>
          </Link>
          <Link className="pol pane" href="/denunciar">
            <i className="ico bi bi-megaphone" aria-hidden="true"></i>
            <b>Denunciar golpe</b>
            <span>Caiu ou quase caiu? Conte o caso. Cada denúncia protege a próxima pessoa que receber o mesmo link.</span>
            <em>Fazer denúncia <i className="bi bi-arrow-right" aria-hidden="true"></i></em>
          </Link>
          {/* Não há página de contato, e inventar uma que não
              responde seria pior que não ter. O e-mail é o canal
              que funciona hoje. Quando existir a página, troque
              aqui e no rodapé. */}
          <a className="pol pane" href="mailto:contato@confiia.com.br">
            <i className="ico bi bi-envelope" aria-hidden="true"></i>
            <b>Falar com a gente</b>
            <span>Dúvida, erro de análise ou sugestão. Tem gente de verdade lendo do outro lado.</span>
            <em>contato@confiia.com.br <i className="bi bi-arrow-right" aria-hidden="true"></i></em>
          </a>
        </div>
      </section>




    </main>
  );
}
