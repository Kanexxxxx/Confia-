/* =============================================================
   GERADO por scripts/porta-pagina.mjs a partir de
   index.html

   Foi conferido à mão depois? Se este aviso ainda estiver aqui,
   NÃO. Confira antes de publicar.
   ============================================================= */

import Link from 'next/link';
import { Verificador } from '@/components/verificador';
import { ContadorGolpes } from '@/components/contador-golpes';

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

          <p className="sub rv" style={{ '--d': '.36s' } as React.CSSProperties}>
            Cole o link, o @ do perfil ou o print da conversa. A gente abre num ambiente
            isolado, longe do seu aparelho, e responde em segundos — em português, com o
            motivo de cada conclusão.
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

              O movimento vem do CSS: a lupa da marca passa devagar
              por cima da nuvem. Ver `.marks::after` no globals. */}
          <div className="marks" id="marks">
            <span className="mark"><i className="bi bi-whatsapp" aria-hidden="true"></i> Link no WhatsApp</span>
            <span className="mark"><i className="bi bi-shop" aria-hidden="true"></i> Loja que não conheço</span>
            <span className="mark"><i className="bi bi-at" aria-hidden="true"></i> Perfil que me chamou</span>
            <span className="mark"><i className="bi bi-tag" aria-hidden="true"></i> Preço bom demais</span>
            <span className="mark"><i className="bi bi-bank" aria-hidden="true"></i> Central do banco</span>
            <span className="mark"><i className="bi bi-cash-coin" aria-hidden="true"></i> Empréstimo fácil demais</span>
            <span className="mark"><i className="bi bi-briefcase" aria-hidden="true"></i> Vaga boa demais</span>
            <span className="mark"><i className="bi bi-gift" aria-hidden="true"></i> Prêmio que não disputei</span>
            <span className="mark"><i className="bi bi-controller" aria-hidden="true"></i> Skin muito barata</span>
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

          <article className="step pane">
            <p className="num"><i className="bi bi-patch-check" aria-hidden="true"></i> Passo 3</p>
            <h3>Resposta em português</h3>
            <p>Nada de relatório técnico. Você recebe uma resposta direta, o motivo dela e o que fazer agora.</p>
            <ul>
              <li><i className="bi bi-check2" aria-hidden="true"></i> Pode confiar</li>
              <li><i className="bi bi-check2" aria-hidden="true"></i> Melhor desconfiar</li>
              <li><i className="bi bi-check2" aria-hidden="true"></i> É golpe — não clique</li>
            </ul>
          </article>
        </div>
      </section>


      <section id="numeros">
        <div className="sec-head">
          <p className="eyebrow">O tamanho do problema</p>
          <h2>Não é azar. É indústria.</h2>
          <p>Golpe no Brasil deixou de ser caso isolado e virou operação organizada, com roteiro,
          equipe e meta. Estes números são de instituições públicas e do setor bancário.</p>
        </div>

        <div className="numeros">
          {/* O contador substitui o cartão "1 a cada 2,3s", que dizia
              a mesma coisa parada. É a mesma fonte e o mesmo dado —
              só que agora dá para VER acontecendo. */}
          <ContadorGolpes />

          <div className="numero">
            <b>24 milhões</b>
            <span>De brasileiros atingidos por golpes de Pix e boleto em 12 meses</span>
          </div>
          <div className="numero">
            <b>R$ 29 bi</b>
            <span>Perdidos nesse mesmo período</span>
          </div>
          <div className="numero">
            <b>+43%</b>
            <span>De aumento entre jovens de até 25 anos — hoje passam os idosos</span>
          </div>
        </div>

        <p className="fonte">Fontes: Serasa Experian (1º semestre de 2025) e levantamento sobre golpes de
        Pix e boleto entre julho de 2024 e junho de 2025.</p>
      </section>

      <section id="checagens">
        <div className="sec-head">
          <p className="eyebrow">Tipos de golpe</p>
          <h2>Não é só link falso</h2>
          <p>Golpe bom é o que parece normal. A gente estuda o roteiro de cada tipo — o que
          eles falam, como cobram e onde escorregam — pra reconhecer o padrão antes de
          você pagar.</p>
        </div>

        {/* RANKING — só o que a gente verifica DE VERDADE hoje.

            Antes esta lista trazia os seis golpes mais relatados do
            país, e os dois primeiros vinham marcados "ainda não
            cobrimos". Ou seja: o topo da nossa própria lista
            anunciava o que a gente não faz. O que a gente não faz
            tem lugar próprio, logo abaixo, e bem visível. */}
        <div className="ranking">
          <div className="rank">
            <span className="pos">1</span>
            <span className="nome"><b>Golpe do WhatsApp</b><span>Número clonado ou perfil copiado pedindo dinheiro a conhecidos</span></span>
            <span className="barra"><i style={{ width: '100%' }}></i></span>
            <span className="pct">34%</span>
          </div>
          <div className="rank">
            <span className="pos">2</span>
            <span className="nome"><b>Falsa central do banco</b><span>Mensagem dizendo que sua conta foi invadida, pedindo transferência para uma “conta segura”</span></span>
            <span className="barra"><i style={{ width: '91%' }}></i></span>
            <span className="pct">31%</span>
          </div>
          <div className="rank">
            <span className="pos">3</span>
            <span className="nome"><b>CPF usado por SMS</b><span>Mensagem com link que rouba seus dados para abrir conta no seu nome</span></span>
            <span className="barra"><i style={{ width: '38%' }}></i></span>
            <span className="pct">13%</span>
          </div>
          <div className="rank">
            <span className="pos">4</span>
            <span className="nome"><b>Leilão ou loja falsa</b><span>Site que não entrega, preço fora da realidade, loja criada semana passada</span></span>
            <span className="barra"><i style={{ width: '29%' }}></i></span>
            <span className="pct">10%</span>
          </div>
        </div>

        <p className="fonte">Ranking do Observatório Febraban, pesquisa IPESPE. O percentual
        indica quantas pessoas entrevistadas relataram ter sofrido cada tipo. Estão aqui
        só os que a gente já verifica hoje.</p>

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
              <b>O que a gente ainda NÃO consegue verificar</b>
              <span>Se o seu caso for um destes, a nossa resposta não serve — procure seu
              banco e registre boletim de ocorrência.</span>
            </div>
          </div>
          <ul className="limite-lista">
            <li>
              <i className="bi bi-credit-card-2-front" aria-hidden="true"></i>
              <b>Cartão clonado ou trocado</b>
              <span>É o golpe mais relatado do país, e depende de dados que só o banco tem.
              A gente nem tenta adivinhar.</span>
            </li>
            <li>
              <i className="bi bi-qr-code" aria-hidden="true"></i>
              <b>Chave Pix, boleto e comprovante</b>
              <span>Precisa de acesso ao sistema bancário. Estamos atrás disso — e responder
              errado sobre dinheiro é pior do que não responder.</span>
            </li>
            <li>
              <i className="bi bi-telephone-x" aria-hidden="true"></i>
              <b>Ligação telefônica</b>
              <span>A gente confere link, site, perfil e print. Chamada de voz não deixa
              rastro que dê para conferir.</span>
            </li>
          </ul>
        </div>

        {/* Nove tipos: os que dá para reconhecer a partir de um link,
            um @ ou um print — que é exatamente o que o verificador
            aceita. Cada ícone diz a MESMA coisa que o texto ao lado.
            Ícone que contradiz a legenda confunde mais do que ajuda,
            e já aconteceu aqui. */}
        <div className="grid-check" style={{ marginTop: '34px' }}>
          <div className="check pane">
            <i className="ico ico--risk bi bi-bag-x" aria-hidden="true"></i>
            <div><b>Loja que não entrega</b><span>Site criado semana passada, preço fora da realidade, pagamento só por transferência ou Pix.</span></div>
          </div>
          <div className="check pane">
            <i className="ico ico--risk bi bi-shield-exclamation" aria-hidden="true"></i>
            <div><b>Página de login falsa</b><span>Cópia da tela do banco ou da rede social para roubar sua senha. Muda uma letra no endereço.</span></div>
          </div>
          <div className="check pane">
            <i className="ico ico--risk bi bi-person-bounding-box" aria-hidden="true"></i>
            <div><b>Perfil clonado</b><span>Conta nova copiando o nome e as fotos de alguém que você conhece — ou de uma marca.</span></div>
          </div>
          <div className="check pane">
            <i className="ico ico--risk bi bi-controller" aria-hidden="true"></i>
            <div><b>Skin, case e conta de jogo</b><span>Sorteio de skin, troca fora da plataforma oficial, intermediário que some com o item.</span></div>
          </div>
          <div className="check pane">
            <i className="ico ico--warn bi bi-cash-coin" aria-hidden="true"></i>
            <div><b>Empréstimo com taxa adiantada</b><span>Crédito aprovado sem consulta — desde que você pague antes um seguro ou taxa de liberação.</span></div>
          </div>
          <div className="check pane">
            <i className="ico ico--warn bi bi-briefcase" aria-hidden="true"></i>
            <div><b>Vaga e renda extra</b><span>Trabalho fácil por aplicativo, tarefa paga que pede depósito para liberar o saque.</span></div>
          </div>
          <div className="check pane">
            <i className="ico ico--warn bi bi-gift" aria-hidden="true"></i>
            <div><b>Prêmio que você não disputou</b><span>Sorteio, cupom ou “você foi selecionado”. Cobra um frete ou uma taxa para liberar.</span></div>
          </div>
          <div className="check pane">
            <i className="ico ico--warn bi bi-graph-up-arrow" aria-hidden="true"></i>
            <div><b>Investimento milagroso</b><span>Rendimento garantido, cripto que só sobe, robô que nunca erra. Some com o depósito.</span></div>
          </div>
          <div className="check pane">
            <i className="ico ico--warn bi bi-ticket-perforated" aria-hidden="true"></i>
            <div><b>Ingresso e evento falso</b><span>Revenda de show, jogo ou festa. Entrega um PDF que não passa na catraca.</span></div>
          </div>
        </div>
      </section>


      <section id="historia">
        <div className="historia">
          <div>
            <p className="eyebrow">Por que existimos</p>
            <h2>Ninguém cai por ser bobo. Cai por estar com pressa.</h2>

            <p>Todo mundo conhece alguém que caiu. A mãe que pagou um boleto que não era da
            loja. O amigo que comprou uma skin e nunca recebeu. O avô que atendeu a central
            do banco que não era o banco.</p>

            <p>O que essas histórias têm em comum não é burrice. É o <b>momento</b>. O golpe
            chega quando a pessoa está distraída, com medo, ou com vontade de acreditar — e
            a decisão precisa sair em segundos. Ninguém abre o registro do domínio no meio
            de uma conversa no WhatsApp.</p>

            <p>O confia? existe para ocupar esses segundos. Você cola o link, a gente abre
            num ambiente isolado, longe do seu aparelho, e responde em português: o que
            encontrou, por que aquilo é sinal de golpe, e o que fazer agora.{' '}
            <b>Sem termo técnico e sem julgar quem perguntou.</b></p>

            {/* Isto não é modéstia decorativa: é o que separa este site
                de um que promete 100%. Quem promete 100% está mentindo,
                e num serviço antigolpe a mentira é o produto do
                concorrente. */}
            <p className="ressalva">
              <i className="bi bi-exclamation-diamond" aria-hidden="true"></i>
              Ainda estamos em beta, e dizemos isso na cara. Nenhuma ferramenta honesta
              acerta sempre — a nossa também não. Por isso mostramos o motivo de cada
              conclusão, para você poder discordar da gente.
            </p>

            <p className="assina">Feito no interior de São Paulo, melhorando toda semana.</p>
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
          <p>Um site que pede confiança precisa explicar direitinho o que faz com o que você envia.</p>
        </div>

        <div className="grid-pol">
          <Link className="pol pane" href="/privacidade">
            <i className="ico bi bi-shield-lock" aria-hidden="true"></i>
            <b>Privacidade</b>
            <span>O que guardamos, por quanto tempo e o que nunca sai daqui. Prints são apagados após a análise.</span>
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
