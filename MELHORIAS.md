# Rodada de acabamento — tudo que você apontou

**Aberta em:** 24/08/2026
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

## Fora do escopo desta rodada (mas anotado)

Motor de verificação (Etapa 8), pagamento/Asaas, CNPJ e dados da empresa nos
documentos — esses estão em `PLANO.md` e `PENDENCIAS.md`.
