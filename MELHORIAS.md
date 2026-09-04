# Rodada de acabamento — tudo que você apontou

**Aberta em:** 24/08/2026 · **última revisão:** 26/08/2026
**Regra desta rodada:** estética e experiência primeiro. Motor de análise,
pagamento e app ficam para depois.

Marque `[x]` conforme eu for entregando. O que estiver `[ ]` ainda não existe —
e eu não vou dizer que existe.

---

## A · Home — o que você viu na tela

- [x] **Quadrado atrás do card do verificador.** Era `--r-2xl` usada e nunca definida: o navegador descartava o arredondamento inteiro e o card ficava de canto reto, com a moldura branca desenhando um quadrado. Criei `npm run confere` para pegar variável órfã antes de você ver. Um retângulo aparece por trás
      do efeito de vidro no `.tablet`. Some.
- [ ] **Alinhamento.** Título, subtítulo e texto de apoio não batem na mesma
      linha vertical em várias seções.
- [x] **Títulos amontoados.** Havia dois `.eyebrow` diferentes com o mesmo nome — pílula (das páginas legais, que ninguém usava) e traço+rótulo (da home). Fundidos, viravam uma pílula esticada de ponta a ponta. A morta foi removida.
- [ ] **O vidro em si.** Consertei o que impedia de renderizar; agora é
      melhorar o efeito, não só fazê-lo existir.
- [x] **Tipos de golpe.** O ranking agora só lista o que a gente verifica de verdade. Os dois que não fazíamos saíram do topo da lista. Hoje são 6, e alguns a gente **não verifica**
      (clonagem de cartão, por exemplo). Não faz sentido anunciar o que não
      fazemos. Trocar por uma lista maior, real, do que a gente cobre.
- [x] **Contador ao vivo**, refeito como painel: cada algarismo na sua casinha, ponto pulsando de "ao vivo", data por extenso e relógio com segundos. Derivado da taxa da Serasa (1 a cada 2,3s), e diz na cara que é projeção, não medição. Como o painel do imposto de renda: um número que
      sobe sozinho na tela, mostrando quantas pessoas caem em golpe enquanto a
      pessoa lê. Hoje é só "1 a cada 2,3s" parado.
- [x] **Cards de exemplo: 9**, em grade 3×3.
- [x] **Ícones.** Os nove tipos ganharam ícone que bate com a legenda. Um deles, `bi-scales`, **nem existia** no pacote — aparecia como espaço vazio ao lado de "Empresa tem direito de resposta". Criei `confere-icones.mjs` para pegar isso.
- [x] **"O que ainda não conseguimos verificar"** virou um bloco vermelho de largura inteira, com os três casos e o que fazer em cada um.
- [x] **"Por que o confia? existe"** reescrito: título novo ("Ninguém cai por ser bobo. Cai por estar com pressa."), ressalva do beta em destaque, e as quatro promessas com texto concreto.

## A2 · Segunda rodada na home

- [x] **"2 verificações sem criar conta"** removido do topo.
- [x] **Os chips viraram situações reais**, de 6 categorias abstratas para 10 frases
      que a pessoa reconhece: "Link que chegou no WhatsApp", "Central do banco que
      ligou", "Preço bom demais para ser verdade".
- [x] **A nota de venda embaixo do verificador saiu.** No lugar entrou a ressalva que
      todo assistente sério tem: "O confia? pode errar. Confira sempre os motivos" —
      com link para os termos.
- [x] **Aviso de cookies conferido:** funciona. Você não estava vendo porque seu
      navegador já tinha a escolha gravada de uma visita anterior — ele só aparece
      uma vez, que é o comportamento certo.

## B · Coisas que flutuam na tela

- [x] **Aviso de cookies** com os dois botões do mesmo tamanho (recusar tão fácil quanto aceitar). Grava no cookie `confia_cookies`, 12 meses, exatamente como a política promete. com "aceitar" ali mesmo — sem obrigar a descer até
      o rodapé.
- [x] **Botão de acessibilidade** centralizado. O ícone estava 2px acima do centro (14px em cima, 16px embaixo); `line-height:1` resolveu — medido no pixel, agora é 15 e 15.
- [x] **Card do WhatsApp** no canto inferior esquerdo, azul da marca, empilhado sobre o de acessibilidade. Expande no hover mostrando "Falar com a gente". no canto inferior **esquerdo**, no mesmo estilo do
      de acessibilidade. **Azul, não verde.**

## C · Conta e perfil — hoje está tudo empilhado num lugar só

- [x] **Virou painel de verdade**: barra lateral com avatar e navegação, e seis
      páginas próprias — visão geral, perfil, segurança, aparelhos, plano e
      privacidade. A visão geral abre com o que precisa de atenção.
- [x] **Formato no computador.** Era `max-width:760px` — uma tira no meio da tela.
      Agora são duas colunas ocupando a largura, e no celular a lateral vira faixa
      rolável em cima. Hoje é uma faixa estreita e comprida no meio
      da tela — "paralelepípedo deitado". Tem que ocupar a largura, da esquerda
      para a direita. No celular pode continuar como está.
- [x] **Avatar aparece** na barra lateral, no cabeçalho e no seletor.
- [x] **Mais avatares: 16.** Entraram lobo-guará, tamanduá, jacaré, boto, beija-flor,
      tatu, bem-te-vi e peixe-boi.
- [x] **Logo maior** nas telas de entrar e criar conta: de 118px para até 168px.
- [x] **O traço embaixo de "Entrar"** removido. Virou `<a>` ao ganhar navegação e herdou o sublinhado padrão.
- [x] **Aparelhos conectados** com faxina automática de 15 dias. A função
      `faxina_sessoes()` está na migração `013`, agendada por systemd timer às 4:17
      (o `pg_cron` não existe na VPS). O resultado das verificações continua
      guardado; o rastro de login, não.

## D · Páginas que ainda não existem

- [x] `/planos` — seletor mensal/anual funcionando, quatro planos, tabela
      comparativa de 41 linhas e as dúvidas. Com aviso no topo de que a cobrança
      ainda não existe: página de preço com botão que não cobra é promessa vazia,
      e este site existe para ensinar a desconfiar disso.
- [x] `/registrar-loja` — grava empresa e endereços no banco, valida os dígitos do
      CNPJ, limpa o domínio (`https://www.x.com.br/` vira `x.com.br`) e detecta
      e-mail do próprio domínio como meia prova de posse. Nasce `em_analise`,
      nunca aprovada: selo dado sem conferência não vale nada.
- [x] `/denunciar` — formulário completo gravando no banco de verdade, com protocolo
      para acompanhar, limite de 5 por hora por IP (senão dá para derrubar a nota de
      um concorrente honesto), e anônima por padrão. Migração `014` acrescentou as
      quatro colunas que faltavam.
- [x] `/resultado` — a tela de veredito, como DEMONSTRAÇÃO. Faixa vermelha fixa no
      topo dizendo que os endereços são inventados, `noindex`, e três exemplos para
      trocar. Ela existe para o desenho estar resolvido antes do motor chegar, e
      para dar para mostrar numa apresentação sem mentir sobre o que existe.
- [ ] Histórico de consultas

## E · Documentos legais

- [ ] **Termos:** "Quem somos" abre com o seu nome. Deixar anônimo (a empresa,
      não a pessoa). Alinhamento e blocos grudados.
- [ ] **Reembolso:** prazos, antecedência e planos de pagamento estão errados.
- [x] **Rodapé:** "Feito em Pitangueiras, interior de São Paulo · desde 2026", mais e-mail e WhatsApp. Cidade, ano e contatos saem de `src/lib/contato.ts` — um lugar só, para não divergirem entre rodapé e documentos legais.

## F · Painel do admin

- [x] **Sua conta é a única admin.** `kainarodrigues684@gmail.com` recebeu nível dono e o admin anterior foi removido. Criei `npm run admin` para conceder, remover ou listar — com `--somente=email`, que dá para uma e tira de todas as outras.
- [ ] Painel **completo**. Nada básico.

## G · Versão de teste

- [~] **Meio caminho:** criei `npm run conta-teste`, que prepara uma conta com
      senha conhecida (e `--admin` configura o 2FA de verdade, porque o banco se
      recusa a dar admin sem ele — e essa trava está certa). Ainda falta pôr o site
      num endereço que você acesse do seu computador.

## H · Aplicativo (por último, quando sobrar tempo)

- [ ] PWA — o site instala como aplicativo, com convite para instalar.
      Você quer que os avaliadores do SENAC instalem na apresentação.

---

## I · Terceira rodada — 26/08/2026

O que você apontou olhando o site pronto.

⚠ **Esta seção deixou de ser a lista viva em 27/08/2026.** A lista viva agora é
a **§ II**, no fim deste arquivo. A § I fica como registro do que já foi
entregue — e o que sobrou dela em `[ ]` continua valendo, então não apague.

### Feito nesta rodada

- [x] **Os botões de cancelar e enviar** em /denunciar e /registrar-loja estavam
      desiguais (`flex:1` só no enviar). Cancelar virou link discreto: ele é
      saída, não ação de peso igual.
- [x] **"Com apelido" não abria campo nenhum.** A pessoa pedia para aparecer com
      apelido e nunca era perguntado qual — a denúncia saía anônima. Mesmo
      defeito no "Outro" dos dois formulários: gravava a palavra "outro" e mais
      nada. Migração `017` criou as três colunas.
- [x] **Fora a dica "MEI também vale"** embaixo do CNPJ e o aviso "o cadastro
      não custa nada" no fim — a página já diz isso antes.
- [x] **/planos refeita.** Era corrida de checkmark: quatro colunas de ticks e
      quarenta linhas. Agora abre com **"Qual desses é você?"** em primeira
      pessoa, antes de qualquer preço, e cada item diz **o que faz**, não só o
      nome. "Antes de assinar" saiu do fim da página e abre no clique de
      assinar, que é quando a pergunta existe.
- [x] **O alinhamento.** A causa era `.topo{text-align:center}` do herói
      escorrendo por herança até dentro dos cartões.
- [x] **A "bola branca" que passava** era a animação `lupa-passa` sobre os
      chips. Removida.
- [x] **A textura de fundo** (guilhochê) foi tentada, tinha erro de emenda no
      ladrilho, foi consertada e mesmo assim **você mandou tirar**. Está fora.
      ⚠ Consequência anotada em `globals.css`: sem detalhe fino atrás, o vidro
      tem pouco o que refratar.
- [x] **A fonte** foi trocada (Instrument Sans + Fraunces) e **você mandou
      voltar**. Voltou para Inter + Poppins.
      ⚠ **Não troque a fonte de novo sem perguntar.**
- [x] **Tipos de golpe, refeito do zero.** Você disse: "não especificou, não
      exemplos, não pegou fontes reais, não pegou as evidências". As quatro
      barras com 34%/31%/13%/10% saíram inteiras. No lugar entraram três
      **dossiês**, com dado que dá para conferir: ocorrências relatadas pelos
      clientes aos bancos da Febraban no 1º semestre de 2025 — falsa venda
      (174 mil, +314%), falsa central (139 mil, +195,7%) e WhatsApp (73 mil,
      −9,9%). Cada dossiê traz a **reprodução** do que a vítima viu (o anúncio,
      a ligação, a conversa), **por que funciona** e **o que entrega**. A fonte
      está em cada cartão, não numa nota só no fim.
      Dois efeitos que não estavam previstos:
      • o dado real **reordena a lista sozinho** — a troca de cartão, justamente
        o golpe que a gente não verifica, cai para 7º e sai do topo sem precisar
        filtrar nada à mão, que era o remendo anterior;
      • do 4º ao 10º a Febraban publicou a ordem mas não o número de casos, e
        está escrito na página que por isso a gente não inventou nenhum.
      ⚠ Consertei junto uma contradição que isso criou: o bloco de limites dizia
      que cartão clonado é "o golpe mais relatado do país". É verdade na pesquisa
      que pergunta às pessoas, e falso no ranking de ocorrências no banco. Agora
      a frase diz qual das duas medidas está falando.
      ⚠ As reproduções não citam banco nem loja real, de propósito.
- [x] **"O que a gente ainda NÃO consegue verificar" agora diz quem resolve.**
      Antes listava três coisas que a gente não faz e parava ali, deixando a
      pessoa parada no meio do problema. Cada limite terminou virando um caminho
      concreto: contestar pelo app e registrar BO; ligar **você** para o número do
      verso do cartão; e o principal — o **MED** do Banco Central, que dá **80 dias
      corridos** para contestar um Pix, no próprio extrato do aplicativo, com a
      observação de que pedir no mesmo dia muda muito a chance. Essa é informação
      que salva dinheiro e faltava numa página sobre golpe.
- [x] **"Transparência é parte do serviço" passou a ser transparente.** Era um
      título prometendo transparência em cima de quatro links para políticas.
      Agora responde antes as quatro perguntas incômodas — "o print fica
      guardado?", "alguém de fora vê?", "aparece meu nome?", "e se vocês
      errarem?" — e a resposta começa pela palavra que decide: Não / Vê / Só se
      você quiser / **A gente pode errar**. Duas delas não pegam bem, e é por isso
      que ficam antes dos links.
      ⚠ Cada resposta é cópia do que a política de privacidade já diz. **Mudou a
      política, muda este bloco** — senão a home promete uma coisa e o documento
      vale outra, que é o defeito que o bloco existe para não ter.

### Falta — o que você pediu e ainda não fiz

- [ ] **A lateral de /denunciar** ("Perdeu dinheiro agora?", "O que acontece
      depois", "Tem print da conversa?") — informação demais, junto.
- [ ] **Perfil e empresa** — melhorar.
- [ ] **Painel do admin** — você ainda não viu nem o protótipo.
- [x] **Criar conta ficou horizontal no computador.** Eram nove blocos
      empilhados num cartão de 420px: sobrava tela dos dois lados e faltava
      embaixo. De 900px para cima o cartão abre para 780px e os campos correm em
      duas colunas — nome | apelido, e-mail | telefone, senha | sua figura. No
      celular continua uma coluna só, que lá é a forma certa.
      A página caiu de ~1.900px para 1.235px de altura.
      ⚠ Só vale com a classe `porta--larga`, que está apenas nesta página.
      `/entrar` usa o mesmo `.porta` e tem dois campos — alargar lá deixaria
      dois campos perdidos dentro de um cartão grande.
      ⚠ O bloco das figuras sozinho ocupava 316px, mais que nome, apelido,
      e-mail e telefone somados. Os círculos foram para 36px **por prop**, não
      por CSS: o `<Avatar>` escreve o tamanho no atributo `style`, e estilo
      inline ganha de classe. No celular o alvo de toque continua 56px.

### Regras suas que valem daqui para a frente

- **Subir o site é a ÚLTIMA coisa.** Tem muita coisa para testar antes.
- **Não deixar com cara de inteligência artificial.** Bonito, agradável, com
  algo em movimento — mas movimento que serve, não que aparece sozinho.
- **Acessibilidade no celular sempre**, em toda tela.

---

## Fora do escopo desta rodada (mas anotado)

Motor de verificação (Etapa 8), pagamento/Asaas, CNPJ e dados da empresa nos
documentos — esses estão em `PLANO.md` e `PENDENCIAS.md`.

---

# II · Quarta rodada — 27/08/2026

Ditada por você em **onze etapas**. Mantive a sua numeração, inclusive onde ela
repetiu (você disse "etapa seis" duas vezes — virou etapa 6, parte A e parte B).

**Esta seção passa a ser a LISTA VIVA.** A § I fica como registro do que já foi
entregue; quem retomar o trabalho começa por aqui.

Cada item diz **onde a coisa mora no código**, para a próxima conversa não ter
que procurar. Onde eu precisei interpretar o que você ditou, está escrito
**"entendi assim:"** — é aí que você me corrige se eu errei.

⚠ Nove itens dependem de decisão sua antes de virar código. Estão juntos no
fim, em **"O que trava"**.

---

## Etapa 1 · A nuvem de situações da home

`web/src/app/_portado/Home.tsx` — `.marks`, linhas 64–75

- [x] **Tirar quatro das dez situações.** **Feito em 27/08/2026.** Saíram
      "Central do banco", "Empréstimo fácil demais", "Vaga boa demais" e "Skin
      muito barata". Sobraram seis: Link no WhatsApp, Loja que não conheço,
      Perfil que me chamou, Preço bom demais, Prêmio que não disputei, Site com
      letra trocada.

      Achei o motivo enquanto fazia, e ele é melhor que "são muitas": as quatro
      que saíram **prometiam o que o verificador não faz**. Central do banco é
      ligação; empréstimo, vaga e skin chegam como conversa, não como link, @ ou
      print. E a nuvem fica a dois centímetros do campo onde a pessoa cola — é o
      pior lugar possível para prometer errado.

      ⚠ Se você quiser menos de seis, é só dizer.

---

## Etapa 2 · O @ tem que dizer de onde veio

`web/src/components/verificador.tsx` · passo 3 de `#como` em `Home.tsx:161`

- [x] **Perguntar a rede social do @.** **Feito em 27/08/2026.** Colou um @,
      aparece a escolha: Instagram, WhatsApp, TikTok, Facebook, Telegram e
      Outra. Sem escolher, o formulário não anda.

      A pergunta **só aparece quando ela existe**: link colado inteiro
      (`instagram.com/fulana`) não pergunta nada, porque o endereço já responde.
      Provado no navegador — link, site e telefone não perguntam; `@fulana` e
      `fulana` perguntam.

      ⚠ Se você acrescentar rede na lista, a Etapa 8 vai precisar saber ler
      aquela rede. Oferecer na tela o que o motor não verifica é prometer o que
      não se entrega.

- [x] **"Resposta em português" saiu do passo 3.** **Feito em 27/08/2026.**
      Virou **"Você vê por que, não só o quê"**.

      O óbvio estava ocupando o lugar da única promessa que separa este site de
      um antivírus: a resposta vem com o motivo, e dá para discordar dele.

---

## Etapa 3 · "O tamanho do problema" sai inteiro

`Home.tsx` — `<section id="numeros">` (173–204) e `<section id="checagens">`
(205 em diante) · `web/src/components/contador-golpes.tsx`

- [x] **Remover o medidor e os números.** **Feito em 27/08/2026.** A seção
      `#numeros` não existe mais — saíram o contador ao vivo, os 24 milhões, os
      R$ 29 bi, os +43% e a nota da Serasa.

      ⚠ **`contador-golpes.tsx` continua no repositório, sem nenhum uso.** Não
      apaguei porque é decisão sua (item 8 da tabela lá embaixo). Enquanto
      estiver lá, ele engana quem abrir o repositório achando que está no ar.

- [x] **Tirar as porcentagens dos golpes.** **Feito em 27/08/2026.** Os três
      dossiês saíram inteiros, com os +314% / +195,7% / −9,9%, o parágrafo do 4º
      ao 10º lugar e a nota da Febraban. A seção virou **"O que a gente
      reconhece"**, com **dez exemplos** e nenhum número.

      ⚠ O que se perdeu, para você saber: era o dado real que ordenava a lista
      sozinho. Sem número, a ordem é escolha nossa — e o critério que eu usei é
      outro: a lista mostra **o que o verificador consegue reconhecer**, e só.

      ⚠ Se um dia voltar número ali, a fonte volta junto **e o período junto com
      ela**. Número sem período vira mentira em seis meses.

---

## Etapa 4 · Limites e a lista de golpes, explicando de verdade

`Home.tsx` — `.limite` (~420–465) e `.grid-check` (~473–516)

- [x] **Tirar dos limites tudo que é conta bancária.** **Feito em 27/08/2026:**
      o item "Chave Pix, boleto e comprovante" saiu da home.

      ⚠ **O MED não foi apagado — mudou de lugar.** Os 80 dias para contestar
      um Pix estão agora em `/denunciar`, dentro de "Perdeu dinheiro agora?",
      reforçados com o detalhe do mesmo dia. Motivo: é a informação do site que
      mais faz dinheiro voltar, e /denunciar é onde está quem JÁ perdeu — não
      quem veio conferir um link antes de clicar. Ficou melhor ali do que
      estava na home.

      ⚠ Hoje `/denunciar` é o **único** lugar do site com esse prazo. Mexeu
      ali, lembre disso.

- [ ] **"Cartão clonado" sai junto?** Também é banco, e entendi que sai pelo
      mesmo motivo — mas você citou só o Pix, então deixei. **Confirme.**

- [x] **Acrescentar mais limites.** **Feito em 27/08/2026.** Virou necessário:
      tirando o Pix e o cartão, a lista tinha sobrado com **um item só**, o que
      fazia parecer que a gente cobre quase tudo.

      Entraram quatro, nenhum sobre banco: mensagem sem link/@/print, perfil ou
      grupo fechado, se a loja de verdade vai entregar, e aplicativo já
      instalado no celular.

      ⚠ Regra que ficou valendo para os itens deste bloco: **todo um termina em
      caminho.** Listar o que não se faz e parar ali deixa a pessoa parada no
      meio do problema — foi crítica sua na rodada anterior, e vale para os
      novos também. Um deles manda para o `consumidor.gov.br`, que é oficial.

- [x] **O golpe da alfândega entrou.** **Feito em 27/08/2026**, junto com a
      etapa 3 (é a mesma lista). Você tinha razão em estranhar a ausência.

      Ele é o único da lista que chega **depois** da compra — a pessoa já pagou
      e está ansiosa esperando o pacote. Por isso a legenda fala do link para
      pagar a taxa: é ele que a pessoa vem colar aqui.

- [ ] **Mais golpes na lista**, além dos dez de hoje.

- [x] **Botão "saber mais" em cada golpe.** **Feito em 27/08/2026.** A lista
      virou `web/src/components/golpes.tsx`, e cada golpe abre uma caixa com
      **como funciona** (os passos, numerados — a ordem é a informação) e **o
      que entrega** (os sinais).

      **8 dos 10 têm o botão. Dois não têm, e isso é a regra funcionando.**

      Eu tinha escrito que golpe sem fonte entra sem "saber mais". Aconteceu:
      *skins* e *ingressos* ficaram sem. Não foi por falta de procurar —

      | O que eu achei | Por que caiu |
      |---|---|
      | Procon-RS sobre ingressos falsos | 404 |
      | Senacon/MJ sobre golpe em ingressos | exige login |
      | Secom sobre a alfândega | exige login |
      | Procon-SP | só a home responde, e home não prova nada |

      As páginas de notícia do gov.br ficam atrás de autenticação — testei
      inclusive fingindo ser navegador, para descartar bloqueio de robô. Fonte
      que você não consegue abrir é a mesma coisa que fonte nenhuma.

      As oito que ficaram são Receita Federal, Correios, CVM e Ministério da
      Justiça, **e eu abri as oito para conferir** antes de commitar.

      ⚠ Achou fonte pública para skins ou ingressos? Põe a constante e o
      `fonte:` no golpe — o botão aparece sozinho. E confira o endereço
      abrindo, não só olhando.

      ⚠ Página de governo muda de endereço com frequência. Vale refazer essa
      conferência de tempos em tempos.

---

## Etapa 5 · "Por que existimos"

`Home.tsx` — `<section id="historia">` (517–590) · rodapé em
`web/src/components/moldura.tsx:154`

Tudo desta etapa foi **feito em 27/08/2026**.

- [x] **Saiu a skin de jogo** das três histórias. No lugar entrou a encomenda
      parada na alfândega — do mesmo tamanho de "todo mundo conhece alguém",
      enquanto skin só é reconhecível para quem joga.

- [x] **Saiu a ressalva de beta.**

      ⚠ Era um dos quatro lugares onde o site avisa o que ainda não entrega.
      Ficaram três. **O aviso de que a gente pode errar não sumiu do site** —
      ele continua colado no verificador, que é onde a pessoa decide se confia.
      Era lá que ele importava. Atualizei o `CLAUDE.md`.

- [x] **Saiu "Feito no interior de São Paulo, melhorando toda semana."**

- [x] **No rodapé, "Feito em Pitangueiras" virou "Empresa localizada em
      Pitangueiras".** Não é só palavra: "feito em" descreve trabalho artesanal,
      "empresa localizada em" descreve pessoa jurídica com endereço — que é o
      que um site que pede confiança precisa parecer.

- [x] **Entrou a quinta promessa: "Ser novo não é ser golpe".**

      Você enxergou uma coisa que faltava: as quatro promessas falavam só com
      quem desconfia. Nenhuma falava com quem é **alvo** da desconfiança. Agora
      a quinta diz que empresa pequena começa parecendo suspeita — site recente,
      ninguém conhece, nenhuma avaliação — e perde venda sem ter feito nada.

      Fechei com a frase que amarra na ética do projeto: é de graça, porque
      cobrar para alguém deixar de ser confundido com golpista seria o nosso
      próprio golpe.

      ⚠ Ela fica logo acima do convite "Tem uma loja? Cadastre de graça". As
      duas dizem a mesma coisa — mexeu numa, leia a outra.

---

### Revisão das etapas 1, 2, 3 e 5 — 27/08/2026

Você pediu para eu olhar de novo o que dava para melhorar. Achei três coisas, e
as três estavam feitas:

- [x] **A seção estava na ordem contrária.** O título dizia "O que a gente
      reconhece" e a primeira coisa embaixo dele era o bloco vermelho do que a
      gente **não** faz. Invertido: os dez exemplos vêm primeiro, o limite
      depois — que é a ordem em que a pessoa pergunta. Quem se encontrou na
      lista nem precisa do bloco vermelho.
      ⚠ O limite perdeu a primeira posição, não o destaque: continua vermelho e
      de largura inteira.

- [x] **O título do bloco vermelho era um `<b>`, não um título.** Quem navega
      por leitor de tela pula de título em título, e o bloco inteiro não
      existia nessa navegação — a pessoa saltava de "O que a gente reconhece"
      direto para "Por que existimos". Virou `<h3>`. A aparência não mudou.

- [x] **O subtítulo do herói ainda prometia "em português"**, que eu tinha
      tirado do passo 3 justamente por ser óbvio. Os dois lugares diziam
      promessas diferentes. Agora dizem a mesma: a resposta vem com o motivo.

### Os três pendentes, resolvidos

- [x] **`contador-golpes.tsx` apagado**, com as ~170 linhas de CSS que morreram
      junto (`.contador*`, `.odo*`, `.numeros`, `.dossie*`, `.reproducao`...).
      Não deixei comentado: CSS morto comentado é pior que apagado — ninguém
      sabe se ainda vale, e o arquivo cresce para sempre. Está no Git.

- [x] **Os botões flutuantes ficaram lado a lado no celular.** Empilhados eles
      tapavam 136px de tela — uma coluna de dois dedos passando por cima do que
      rola atrás, e foi em cima da pergunta "esse @ é de qual rede?" que você
      viu. Lado a lado cabem em 64px.
      Botão fixo sempre cobre alguma coisa; isso corta pela metade o que ele
      cobre. E o rodapé ganhou 78px de folga, senão os links de Privacidade e
      Termos ficavam escondidos embaixo deles — justamente os documentos que a
      lei obriga a deixar acessíveis.
      ⚠ A etapa 10 traz o chat ao vivo, e ele vai para o **lado direito** por
      isso. Não empilhe mais nada nesta esquina.

- [x] **"Cartão clonado" saiu** dos limites, pelo mesmo motivo do Pix.

---

## Etapa 6 · Menu, notícias e a página de registrar loja

Você numerou as duas partes como "seis". Ficaram A e B.

### A · Menu do topo

`web/src/components/moldura.tsx` — const `MENU`, linhas 62–68

- [x] **"Como funciona" saiu do menu.** **Feito em 27/08/2026.** No lugar entrou
      **Notícias**. A âncora `/#como` continua existindo na home, para quem
      chegar por link direto.

- [x] **Entra "Notícias", puxada de fonte externa.** **Feito em 27/08/2026**,
      com a sua decisão de puxar de fora.

      **Mas a medição mudou o desenho da página, e isso é o mais importante
      daqui.** Antes de escrever eu li os feeds: as quatro editorias da Agência
      Brasil devolvem 40 manchetes, e naquele dia **nenhuma** falava de golpe —
      era agosto de eleição e o feed inteiro era eleitoral.

      Provei que o filtro estava certo antes de culpar o feed: oito casos de
      teste, oito acertos, pegando golpe/fraude/estelionato e ignorando eleição.
      **O código estava certo; o feed do dia é que não tinha o assunto.**

      Então a página não podia ser uma vitrine do momento — abriria vazia na
      maioria das visitas. Ela virou **duas partes**:

      1. **O arquivo que cresce.** `npm run noticias` lê os feeds, filtra e
         guarda no banco (tabela nova, migração `019`). Começa vazio e enche com
         o tempo.
      2. **Onde a informação nasce.** Receita Federal, Correios, CVM e
         Ministério da Justiça, com link direto. **Essa parte nunca fica
         vazia**, e é a que mais resolve para quem chegou desconfiado.

      ⚠ A parte 2 não é enfeite para tapar buraco. Mesmo com o arquivo cheio ela
      fica: mandar a pessoa para a fonte primária é melhor conselho do que
      qualquer manchete que a gente republique.

      ⚠ **Com o arquivo vazio, a página diz que está vazio.** Não enche a lista
      com notícia que não é sobre golpe — isso seria a página mentindo sobre o
      que ela é, num site antigolpe.

      **As duas contas que eu tinha avisado, pagas:**

      · **Direito autoral** — só manchete, fonte e data, com link para o veículo.
        O texto da matéria não é copiado, e a tabela nem tem coluna para ele: a
        ausência é a trava.
      · **Privacidade** — a busca acontece no nosso lado, nunca no navegador de
        quem visita. E nenhuma imagem da notícia é exibida: ela viria de CDN de
        terceiro e entregaria o IP de cada visitante, desfazendo o trabalho da
        Etapa 6 e contrariando a Política de Privacidade.

      ⚠ **A tabela é `SELECT` para a aplicação, e só.** É a única alimentada por
      conteúdo de fora, então o site não escreve nela — quem grava é o script,
      como dono, rodado por você. Tabela que a internet alimenta E o site escreve
      é como link de estranho vai parar na sua página. Está anotado no
      `confere-banco.mjs`, que agora confere 15 objetos em vez de 14.

      **Falta você:** rodar `npm run noticias` de vez em quando para o arquivo
      encher. Quando o beta subir (Etapa 7), isso vira tarefa agendada no
      servidor, como a faxina de sessões da migração `013`.

### B · /registrar-loja

`web/src/app/registrar-loja/page.tsx` e `forma.tsx`

- [x] **A declaração "represento esta empresa" agora aparece e trava.**
      **Feito em 27/08/2026.**

      ⚠ Correção do que eu tinha escrito aqui antes: eu disse que "o envio não
      depende dele". Estava errado — `lib/acoes-loja.ts` já recusava sem a
      marca. O defeito era outro, e era de tela: `.opcao` esconde o checkbox
      (`opacity:0`) e desenha uma pílula igual à dos botões de categoria, então
      a declaração lia como preferência. E o navegador deixava enviar, com a
      pessoa só descobrindo o problema depois da viagem até o servidor.

      O que mudou: bloco próprio com o quadrado à vista, o peso da frase
      escrito embaixo, e trava no clique — foco volta para a declaração, o
      bloco fica vermelho e o recado explica. Provado no navegador: barra,
      devolve o foco, e libera ao marcar.

      ⚠ E o cadastro de loja passou a gravar o **IP** na auditoria
      (`acoes-loja.ts`). Era a única ação do projeto que não gravava — e é
      justamente a que precisa responder "quem foi" quando alguém cadastrar
      empresa dos outros. A tela promete isso à pessoa; tirando o IP de lá, a
      promessa vira falsa.

- [x] **Ícone quebrado no quadro dos quatro níveis.** **Feito em 27/08/2026** —
      e não era ícone faltando: o `confere-icones` passava, porque os quatro
      existiam mesmo no pacote. Eram dois defeitos visuais, e os dois só
      apareceram ampliando a tela:

      · o da **Registrada** era o único de **contorno** entre três
        **preenchidos**. Contorno fino, em cinza de 55%, sobre fundo escuro, lê
        exatamente como ícone que não carregou. Virou a versão `-fill`, e a cor
        subiu para 74%;
      · o `bi-award-fill` da **Estabelecida** vira um borrão verde nesse tamanho
        — a fita da medalha some. Trocado por `bi-calendar-check-fill`, que lê
        melhor **e** diz o que o nível significa: mais de um ano de casa.

      ⚠ Achei junto uma coisa pior: `.escada` e `.degrau` estavam definidas
      **duas vezes** no `globals.css`. É a mesma armadilha que este projeto já
      pagou com o `.eyebrow` — dois blocos com o mesmo nome se somam em silêncio,
      e aqui um dizia `display:grid` e o outro `display:flex`. A cópia morta foi
      apagada.

- [x] **Três denúncias viraram cinco, em 90 dias.** **Feito em 27/08/2026**, na
      página **e no banco** (migração `018`).

      ⚠ **E o banco estava fazendo coisa pior do que o texto dizia.** O gatilho
      contava `status <> 'recusada'` — ou seja, `nova` e `em_analise` contavam.
      **Três denúncias que ninguém tinha olhado derrubavam o selo de uma loja.**
      Bastava um concorrente, ou três pessoas que entenderam errado.

      E a página prometia "3 denúncias **confirmadas**". A promessa era mais
      protetora que o banco — num site que existe para apontar promessa que não
      se cumpre, essa é a pior espécie de defeito. Agora conta só `confirmada`.

      ⚠ Isso obrigou o gatilho a mudar de evento: era `AFTER INSERT`, e nenhuma
      denúncia nasce confirmada. Virou `AFTER INSERT OR UPDATE OF status` — senão
      ele nunca mais suspenderia ninguém, e o defeito viraria o oposto,
      igualmente silencioso.

      ⚠ E o `npm run confere-banco` pegou um erro **meu** no caminho:
      `CREATE OR REPLACE FUNCTION` apaga o `SET search_path`, e SECURITY DEFINER
      sem search_path fixo é escalada de privilégio. É exatamente para isso que
      aquela prova existe, e é por isso que ela não é opcional.

- [x] **"O que o selo não diz", reescrito.** **Feito em 27/08/2026.**

      O motivo de você não ter entendido estava na **estrutura**, não nas
      palavras: o título era "o que o selo **não** diz" e o primeiro parágrafo
      dizia o que ele **diz**. Contradição na primeira linha — quem lia na ordem
      levava um tranco e desistia.

      Agora o título é "O que o selo diz", e embaixo vêm duas linhas rotuladas:
      ✓ verde para o que ele diz, ✕ vermelho para o que não diz. A perda do selo
      saiu para uma caixa própria, porque é outro assunto.

      ⚠ A cor não é a única pista: cada linha tem ícone e começa dizendo o que
      é. Quem não distingue cor entende igual.

- [ ] **Avaliações e denúncias públicas da loja, com comentário.** A pessoa vê o
      que já foi denunciado sobre aquela empresa, comenta, e comenta no
      comentário de outra pessoa para trocar informação sobre como a empresa
      agiu. Anônimo: aparece a primeira parte do nome e o resto em asterisco.

      ⚠ **É o maior item das onze etapas.** Tabela nova, moderação, denúncia de
      comentário, RLS, limite por IP e por conta. Não sai junto com o resto
      desta etapa — é obra própria.

      ⚠ **Risco jurídico real:** comentário falso sobre empresa real é processo
      por difamação, contra quem escreveu **e contra quem hospedou**. Entra na
      revisão do advogado (`PENDENCIAS.md`, item 4) antes de ir ao ar.

      ⚠ Ver o perfil de quem comentou fica para depois, como você disse.

---

## Etapa 7 · /denunciar

`web/src/app/denunciar/page.tsx` (lateral) e `forma.tsx`

- [ ] **Anexar prova.** "Você tem prova do golpe?" — até **5 arquivos**, vídeo
      até **100 MB**. **NÃO FEITO — trava na decisão nº 7**, e agora com números.

      Medi a VPS: **48 GB de disco, 40 GB livres, 3,9 GB de RAM, 1 núcleo.**

      A conta que decide: 5 arquivos × 100 MB = **500 MB por denúncia**. Com
      40 GB livres, isso enche o disco em **~80 denúncias** no pior caso. E
      **disco cheio derruba o site e o Postgres junto** — não é lentidão, é
      queda.

      Três caminhos, e o custo de cada um:

      | Onde guardar | O que muda |
      |---|---|
      | **Na VPS** | Grátis, e o mais rápido de fazer. Mas o teto é 80 denúncias, e precisa de faxina automática antes disso. |
      | **Object storage** (S3, R2, Backblaze) | Some o limite de disco. Custa alguns reais por mês e é mais código. |
      | **Baixar o limite** | 3 arquivos × 20 MB = 60 MB por denúncia → ~660 denúncias. Print de conversa tem 1–3 MB; vídeo de 100 MB é caso raro. |

      **Eu recomendo o terceiro**, e por um motivo que não é técnico: quem manda
      vídeo de 100 MB de um golpe é exceção, e o limite alto convida o disco a
      encher com o que quase ninguém usa. Dá para subir depois; descer depois é
      quebrar promessa.

      ⚠ E ainda falta decidir **por quanto tempo guardar** e **quem apaga**. A
      Política de Privacidade promete apagar a imagem assim que a análise
      termina. Se a prova da denúncia fica guardada para o atendente ver depois,
      **a política muda junto**.

- [x] **Quem analisa é gente, não IA.** **Feito em 27/08/2026.** Está escrito no
      formulário, logo acima do botão de enviar: *"quem lê a sua denúncia é uma
      pessoa, não um robô"*, com o motivo — denúncia mexe com a reputação de
      quem foi denunciado e com o prejuízo de quem denunciou.

      ⚠ Isso vira promessa no momento em que aparece na tela. Se um dia a
      triagem virar automática, a frase sai **antes**, não depois.

- [x] **"O que acontece depois" saiu da lateral** e virou a **tela de obrigado**.
      **Feito em 27/08/2026.**

      A tela agora abre com agradecimento — *"o que você acabou de contar não
      fica só com a gente: ele protege a próxima pessoa que receber o mesmo
      link"* — depois o protocolo, e só então os quatro passos do que acontece
      agora. Testado enviando denúncia de verdade, passando pela armadilha; as
      duas de teste foram apagadas do banco.

      ⚠ **Um defeito real apareceu aí, e só na tela.** Escrevi o bloco com a
      paleta do fundo escuro (`#fff` de texto), mas ele vive dentro de `.folha`,
      que é o cartão **branco**. Texto branco em fundo branco: o bloco inteiro
      invisível. Não deu erro e passou no `npm run confere`. Corrigido, e a
      regra ficou anotada no `globals.css`: `--ink*` para o que vive em `.folha`,
      `--on-dark*` para o que vive direto na página.

- [x] **"Tem print da conversa?" saiu.** **Feito em 27/08/2026.** Ele mandava
      guardar e **esperar** a gente pedir — espera que deixa de fazer sentido
      quando o anexo existir.

      O aviso de guardar as provas foi para a tela de obrigado, com outro
      sentido: não é "espere a gente pedir", é o que sustenta um boletim de
      ocorrência ou uma contestação no banco.

- [x] **A lateral ficou com um bloco só.** **Feito em 27/08/2026.** Sobrou
      "Perdeu dinheiro agora?", que é o que salva dinheiro — e com um bloco só,
      é a primeira coisa que a pessoa lê. Você tinha dito que era "informação
      demais, junto".

      ⚠ Não encha esta lateral de novo.

      ⚠ **Upload é a mudança mais perigosa desta rodada.** Hoje **não existe
      rota de upload** no projeto, e isso é de propósito (`SEGURANCA.md`). Cinco
      arquivos de 100 MB numa VPS de 1 núcleo e 3,8 GB é decisão de
      infraestrutura, não de tela: onde guarda, por quanto tempo, quem apaga, e
      o que impede alguém de usar a gente como hospedagem grátis.

      ⚠ Tipo, tamanho e conteúdo conferidos **no servidor**. `accept="image/*"`
      e o limite da tela são sugestão para quem é honesto.

      ⚠ Prova de golpe é dado sensível: print de conversa, comprovante, nome de
      terceiro. A política promete apagar a imagem assim que a análise termina.
      Se a prova da denúncia fica guardada para o atendente ver depois, **a
      política muda junto** — senão a home promete uma coisa e o documento vale
      outra.

      ⚠ Mexe em formulário público e em banco → `npm run confere-banco` e
      `npm run prova-armadilha` antes de eu dizer que terminei.

---

## Etapa 8 · A conta

`web/src/app/conta/` (visão geral, perfil, segurança, aparelhos, plano,
privacidade) · `web/src/components/avatar.tsx`

- [x] **BUG: 2FA ligado e a visão geral continuava mandando ligar.**
      **Consertado em 27/08/2026.** Você não estava enganada, e o banco não
      estava errado.

      **O que era.** O `totp_ativado_em` era gravado certinho. As duas telas que
      mostram o aviso — a visão geral e a barra lateral — já eram
      `force-dynamic`. Só que **`force-dynamic` manda no servidor**; o cache do
      roteador, dentro do navegador, guarda a resposta anterior daquela rota e a
      reaproveita na próxima navegação. Banco dizendo ligado, tela pedindo para
      ligar.

      **O conserto.** `revalidatePath('/conta', 'layout')` dentro da ação, que é
      o que joga a cópia velha fora. O `acoes-perfil.ts` já fazia isso desde
      sempre — para apelido e avatar aparecerem trocados sem recarregar. O
      `acoes-seguranca.ts` tinha **zero** chamadas. Era a única diferença entre
      os dois arquivos.

      `'layout'` e não `'page'`: o aviso da lateral mora no layout, e revalidar
      só a página deixaria a lateral mentindo.

      **Achei mais dois no mesmo arquivo, da mesma família:**

      · **desligar o 2FA** — sem revalidar, a tela continuaria dizendo que ele
        está ligado. É uma tela mentindo sobre segurança **na direção
        perigosa**;
      · **entrar com o código do 2FA** — entrar troca o cabeçalho do site
        inteiro. Sem revalidar a raiz, a pessoa entra, volta para a home e vê
        "Entrar" de novo.

      E os **códigos de reserva**: gerar dez novos e a tela continuar dizendo
      "2 restantes" faria a pessoa gerar de novo, invalidando os que ela acabou
      de anotar.

      **Provado no navegador, não no papel.** Entrei com `voce@confiia.com.br`,
      liguei o 2FA de verdade (li o segredo do formulário e calculei o código
      TOTP), naveguei para a visão geral **pelo menu, sem recarregar** — o aviso
      sumiu. Depois desliguei e ele voltou. A conta de teste ficou com o 2FA
      **desligado**, como o `CLAUDE.md` documenta.

      ⚠ **REGRA QUE FICOU:** ação que muda algo mostrado no menu ou na lateral
      precisa de `revalidatePath`. **Não dá erro quando falta** — a tela só fica
      velha, que é muito pior de achar.

- [ ] **Visão geral vira vistoria completa:** conta, plano, verificações,
      aparelhos, suas avaliações, registros, denúncias — tudo que precisa de
      atenção, num lugar.

- [ ] **Migrar conta de pessoa física para CNPJ**, com provas. A pessoa tem
      direito de abrir como física e virar empresa depois.

      ⚠ Banco novo + fluxo de análise humana. Não é tela, é funcionalidade.

- [ ] **Avatares refeitos.** Os 16 de hoje são desenho básico, alguns estranhos,
      e em outros não dá para saber que bicho é. Desenho de novo, com mais
      caráter, e te mostro antes de trocar.

      ⚠ Isto **não** é foto de perfil enviada pela pessoa — aquilo continua fora,
      como está decidido. É o nosso conjunto de figuras.

- [ ] **/conta/privacidade: os quatro botões viram pedido de verdade.** Hoje os
      quatro abrem o programa de e-mail (`page.tsx:130`, `mailto:`). A pessoa não
      tem que redigir e-mail para nós: ela aperta, o pedido fica **registrado**,
      e ela recebe um e-mail dizendo que a solicitação está em análise e que
      teremos retorno.

      ⚠ Isto é obrigação de LGPD **com prazo**. O registro é o que prova que a
      gente cumpriu; o `mailto:` não prova nada — some na caixa de entrada.

      ⚠ Banco + e-mail → as duas provas de novo.

---

## Etapa 9 · Os e-mails

`web/src/lib/email.ts`

- [ ] **Refazer o desenho dos e-mails.** Hoje o modelo é básico demais. Tem que
      ter a logo do confia?, ser bonito, ter gancho — e não cair em spam.

      ⚠ Não cair em spam é **metade desenho e metade DNS**. SPF, DKIM e DMARC
      estão em `PENDENCIAS.md` item 8 e dependem de você. E-mail lindo sem DKIM
      cai em spam igual.

      ⚠ Logo em e-mail é imagem hospedada, e boa parte dos programas de e-mail
      bloqueia imagem por padrão. Vou fazer para ficar bom **também** com as
      imagens desligadas.

---

## Etapa 10 · Planos, chat ao vivo, acessibilidade

`web/src/app/planos/` · `web/public/assets/acessibilidade.js` ·
`web/src/components/botao-whatsapp.tsx`

- [ ] **Resumir os quatro cartões de plano.** Informação demais em cima confunde
      na hora de escolher. A explicação detalhada **fica**, embaixo — você disse
      que é bom ter. Em cima, resumo.

- [ ] **Mensagem antes de assinar:** o que você está garantindo, em poucas
      linhas, na hora de apertar assinar. Estudar como e-commerce e SaaS fazem.

- [ ] **Melhorar muito os planos** — estrutura, desenho, ética.

- [ ] **Chat ao vivo.** Botão parecido com o do WhatsApp, **do outro lado da
      tela** — acessibilidade e WhatsApp ficam à esquerda, este vai à direita —
      pulsando, para chamar. "Respondemos em até 30 minutos". De 5 a 10 dúvidas
      prontas, ou a pessoa escreve a dela. Mostra quem é o atendente.

- [ ] **Botão do WhatsApp em verde.**

      ⚠ Reverte a decisão da § B ("Azul, não verde") e o comentário em
      `botao-whatsapp.tsx:11-16`. É sua decisão — anoto a reversão aqui para ela
      não voltar sozinha na próxima conversa.

- [ ] **Consertar o painel de acessibilidade** — "tem algumas coisas que não
      estão funcionando". Preciso saber **quais**, ou eu testo os seis controles
      um por um e te digo o que achei.

- [x] **Tirar "a cobrança ainda não existe".** **Feito em 27/08/2026**, nos dois
      lugares: o painel de "Antes de assinar" e o aviso do topo da página.

      Decisão sua, com o motivo: o Asaas está sendo contratado, a cobrança
      entra, e o aviso de obra sai antes dela chegar.

      ⚠ **A regra que passou a valer:** quem segura a honestidade da página
      agora não é mais o aviso — é o **texto do botão**, "Criar minha conta
      grátis", indo para `/criar-conta`, que é exatamente o que ele faz.
      Enquanto o Asaas não estiver ligado, esse texto **não pode virar
      "Assinar"** nem "Ir para o pagamento". Se mudar antes, o aviso volta. Os
      dois não podem estar fora ao mesmo tempo.

      Está escrito no topo de `planos/page.tsx` e em `ASAAS.md`.

      ⚠ O chat promete **30 minutos**. Quem responde? Sem alguém do outro lado,
      é a mesma promessa vazia com outra roupa. Precisa da sua decisão: horário
      de atendimento, e o que o chat responde fora dele.

---

## Etapa 11 · Os documentos legais

`web/src/app/termos/`, `privacidade/`, `reembolso/`, `cookies/` e `denunciar`

- [ ] **Cortar.** Muita informação, muita frase que não faz sentido, muita
      paposeira. Fica o mínimo, em linguagem que qualquer pessoa entenda.

- [ ] **Tirar o seu nome de "Quem somos"**, nos Termos.

- [ ] **Dizer que é uma empresa recém-criada**, em descrição breve — só o
      importante, só o necessário.

      ⚠ Uma coisa eu **não** vou fazer: inventar dado de empresa. Razão social,
      CNPJ e endereço são o item 2 do `PENDENCIAS.md` e não existem ainda. Dado
      inventado em contrato de consumo é o processo que você mencionou, não a
      defesa contra ele.

      ⚠ E tem um nó que só o CNPJ desata: **sem empresa, quem responde pelo site
      é você, pessoa física** — está escrito no `SEGURANCA.md`. Um contrato com
      o consumidor precisa dizer quem responde. Dá para tirar seu nome do lugar
      de destaque e escrever "empresa em constituição, dados completos
      publicados assim que registrada", mas o nome só sai de vez quando houver
      CNPJ. Até lá ele fica num lugar só, discreto, e não no primeiro parágrafo.

      ⚠ Cortar demais tem custo: alguns trechos estão lá porque a LGPD e o CDC
      exigem. Eu marco o que é exigido por lei e não corto sem te avisar.

---

## O que trava — decisões suas

Nenhuma destas eu resolvo sozinho. Estão em ordem de quanto atrasam o trabalho.

| # | Etapa | A decisão |
|---|---|---|
| ~~1~~ | ~~4~~ | ~~O MED sai do site ou muda de lugar?~~ **Resolvido:** mudou para `/denunciar`. |
| ~~2~~ | ~~4~~ | ~~"Cartão clonado" sai junto com o Pix?~~ **Resolvido:** saiu, mesmo motivo. |
| ~~3~~ | ~~10~~ | ~~Tirar o aviso "a cobrança ainda não existe"?~~ **Resolvido:** saiu, com o Asaas a caminho. |
| 4 | 10 | Chat ao vivo: **quem responde**, em que horário, e o que aparece fora dele? |
| 5 | 10 | Quais controles do painel de acessibilidade estão quebrados? (senão eu testo os seis) |
| ~~6~~ | ~~6A~~ | ~~Notícias: à mão ou de fonte externa?~~ **Resolvido:** puxadas de fonte externa (Agência Brasil). |
| **7** | **7** | **Provas: onde guardar, quanto, por quanto tempo.** Agora com número medido: a VPS tem **40 GB livres**, e 5×100 MB por denúncia enche o disco em **~80 denúncias** — o que derruba site e banco junto. Minha recomendação: **3 arquivos × 20 MB** (~660 denúncias). Ver a etapa 7 acima. |
| ~~8~~ | ~~3~~ | ~~`contador-golpes.tsx` fica ou apago?~~ **Resolvido:** apagado — ela nem lembrava dele. |
| ~~9~~ | ~~1~~ | ~~Seis situações na nuvem está bom?~~ **Resolvido:** ficaram seis. |
| 10 | — | **Trocar os segredos que eu vazei num `diff` em 27/08/2026?** Ver a nota abaixo. |

### A nota do item 10 — segredos expostos por erro meu

Em 27/08/2026 eu rodei um `diff` no `web/.env.local` para conferir se um script
tinha estragado o arquivo. O `diff` imprimiu o arquivo inteiro na conversa:
`COFRE_CHAVE`, as duas senhas do Postgres e a chave do Resend. O script já foi
consertado (ele preserva as quebras de linha, então a comparação passou a
mostrar só a linha que mudou), mas o que saiu, saiu.

Recomendação, em ordem de facilidade:

| Segredo | Custo de trocar |
|---|---|
| `RESEND_API_KEY` | Baixo. Gera outra no painel e regrava. |
| Senhas do Postgres | Médio. `servidor/02-banco.sh` regera; o túnel precisa ser refeito. |
| `COFRE_CHAVE` | **Agora ou nunca.** Derruba o 2FA de 2 contas de teste hoje. Depois que houver usuário real, trocar tranca todo mundo por fora — ver `PENDENCIAS.md` item 6. |

---

## Ordem que eu sugiro

**Primeiro as etapas 1, 2, 3 e 5 juntas.** As quatro moram no mesmo arquivo
(`Home.tsx`). Fazer separado significa abrir, mexer e conferir a home quatro
vezes — e é justamente onde mora a armadilha de herança de `text-align` que já
custou tempo. Uma passada só, e você olha a home inteira de uma vez.

**Depois a etapa 4**, que é a mesma home mas exige pesquisa de fonte por golpe —
é trabalho de outro tipo, e não deve atrasar as quatro de cima.

**Depois 6A (menu), 10 (planos, verde, acessibilidade) e 8 (conta).** Começando
pelo bug do 2FA da etapa 8: bug antes de enfeite.

**Depois 9 (e-mails) e 11 (documentos).**

**Por último as três obras grandes:** upload de provas (7), avaliações públicas
de loja (6B) e chat ao vivo (10). As três mexem em banco e em segurança, as três
pedem `npm run confere-banco` e `npm run prova-armadilha`, e as duas primeiras
passam pelo advogado antes de ir ao ar.
