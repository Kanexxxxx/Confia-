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

O que você apontou olhando o site pronto. **Esta seção é a lista viva:**
se você abrir uma conversa nova, é por aqui que se retoma.

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

- [ ] **Criar conta: na HORIZONTAL no computador.** Hoje é uma coluna comprida
      e a pessoa arrasta o mouse à toa. Comprido só no celular.
- [ ] **A lateral de /denunciar** ("Perdeu dinheiro agora?", "O que acontece
      depois", "Tem print da conversa?") — informação demais, junto.
- [ ] **Perfil e empresa** — melhorar.
- [ ] **Painel do admin** — você ainda não viu nem o protótipo.

### Regras suas que valem daqui para a frente

- **Subir o site é a ÚLTIMA coisa.** Tem muita coisa para testar antes.
- **Não deixar com cara de inteligência artificial.** Bonito, agradável, com
  algo em movimento — mas movimento que serve, não que aparece sozinho.
- **Acessibilidade no celular sempre**, em toda tela.

---

## Fora do escopo desta rodada (mas anotado)

Motor de verificação (Etapa 8), pagamento/Asaas, CNPJ e dados da empresa nos
documentos — esses estão em `PLANO.md` e `PENDENCIAS.md`.
