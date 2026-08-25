# confia? — Plano de construção em 10 etapas

**Este arquivo é o mapa.** Você não precisa lembrar de nada que está aqui.
Quando quiser saber onde estamos, abra este arquivo. Quando terminar uma
etapa, ela vira ✅.

**Regra das etapas:** cada uma termina com **alguma coisa funcionando que
você consegue ver**. Nada de "etapa concluída" sem prova na tela.

**Última atualização:** 23/08/2026
**Segurança:** o mapa das camadas está em [SEGURANCA.md](SEGURANCA.md)

> O IP de verdade da VPS **não fica escrito aqui** — este arquivo está num
> repositório público. Ele está no seu `~/.ssh/config`, sob o apelido
> `confia-vps`. Para ver: `ssh -G confia-vps | grep hostname`

---

## Onde estamos agora

```
[✅] 1. Servidor blindado
[✅] 2. Banco de dados no ar
[✅] 3. TypeScript ligado no banco
[✅] 4. Conta: cadastro, login, e-mail
[✅] 5. 2FA e painel trancado de verdade
[🔨] 6. Site migrado para o Next          <-- é aqui que estamos
[  ] 7. No ar com HTTPS
[  ] 8. Motor de verificação
[  ] 9. Planos e pagamento
[  ] 10. Painel ligado e auditoria final
```

> **Sempre, em toda etapa:** celular funcionando e acessibilidade 100.
> Ver "Regras que valem em TODAS as etapas", no fim deste arquivo.

---

## ✅ Etapa 1 — Servidor blindado

**Objetivo:** ninguém entra na VPS além de você.

- [x] Chave SSH no lugar de senha
- [x] Login por senha **desligado**
- [x] `root` não entra direto — usuário `confia` com sudo
- [x] Firewall: só 22, 80 e 443
- [x] fail2ban: 3 erros = 24h de bloqueio
- [x] Swap de 2 GB (a VPS tem 3,8 GB e 1 núcleo)
- [x] Correção de segurança automática
- [x] Atalho `ssh confia-vps`

**Prova:** senha responde `Permission denied`. Chave entra.
**Arquivo:** `servidor/01-blindagem.sh`

---

## ✅ Etapa 2 — Banco de dados no ar

**Objetivo:** o Postgres existe, com as suas 7 migrações rodadas.

- [x] PostgreSQL 16 instalado
- [x] Banco `confia` criado
- [x] **Dois usuários**: `confia_dono` (só migra) e `confia_app` (só lê e grava linha)
- [x] Postgres escutando **só** em `localhost`
- [x] Migrações `001` a `007` aplicadas, com registro do que já rodou
- [x] Backup diário às 3:30, guardando 14 dias
- [x] Memória ajustada: `shared_buffers` 508MB, sem paralelismo (1 núcleo)
- [ ] **Falta você:** cópia do backup **fora** do servidor

**Resultado:**

| | |
|---|---|
| Tabelas | 43 |
| Visões | 9 |
| Funções e gatilhos | 107 |
| Planos semeados | 4 |

**Provas que rodaram:**
- `confia_app` tentou criar tabela → **negado** (é o que se quer)
- Dar selo "verificada" sem posse do domínio → **recusado pelo banco**
- Deferir contestação sem identidade confirmada → **recusado pelo banco**
- Fechar decisão sem texto escrito → **recusado**
- Protocolo `CT-2026-000001` gerado sozinho

**Arquivo:** `servidor/02-banco.sh`
**Credenciais:** `/etc/confia/banco.env` no servidor (nunca saem de lá)

---

## ✅ Etapa 3 — TypeScript ligado no banco

**Objetivo:** aqui o projeto deixa de ser HTML e vira aplicação de verdade.

- [x] Banco **separado** para desenvolvimento (`confia_dev`) — não se programa
      em cima do banco de produção
- [x] `src/db/schema.ts` — 42 tabelas, 9 visões, 24 enums, gerados do banco
- [x] Conexão com pool ajustado (4 em dev, 10 em produção)
- [x] `src/lib/env.ts` — a aplicação se recusa a subir se faltar variável
- [x] Túnel SSH na porta 5433
- [x] `npm run dev` lendo dado real

**Prova:** a tela de diagnóstico em `localhost:3000` mostra PostgreSQL 16.15,
42 tabelas e os 4 planos **vindos do banco**, não escritos no código.

E o TypeScript pega erro antes de rodar:

```
Property 'nomeCompleto' does not exist on type ... "contas"
```

Coluna que não existe, valor fora do ENUM, tipo trocado — o editor
sublinha na hora. Era isso que faltava.

### Como trabalhar no dia a dia

```bash
cd web
npm run tunel     # terminal 1 — precisa ficar aberto
npm run dev       # terminal 2 — abre em localhost:3000
```

Mudou alguma tabela no banco? `npm run db:puxar` regera os tipos.

**Arquivos:** `web/src/db/`, `web/src/lib/env.ts`, `web/scripts/ajusta-schema.mjs`

---

## ✅ Etapa 4 — Conta: cadastro, login, e-mail

**Objetivo:** dá para criar conta e entrar.

- [x] Cadastro com crítica de senha
- [x] Login com bloqueio por tentativas (5 erros = 15 min)
- [x] Sessão no banco, revogável — dá para derrubar de longe
- [x] Confirmação de e-mail pelo Resend
- [x] Recuperação de senha
- [x] Página da conta com os **aparelhos conectados**
- [x] Telas: entrar, criar conta, e-mail enviado, link expirado, link usado
- [ ] Trocar e-mail — fica para quando houver quem precise

**Provado no banco, não no papel:**

| Teste | Resultado |
|---|---|
| Criar conta grava tudo | conta + token + e-mail + auditoria |
| Senha errada | recusada, e a tentativa fica registrada |
| Senha certa | entra e cria sessão |
| Trocar senha derruba tudo | 3 sessões revogadas, **0 ativas** |
| Token de e-mail vale uma vez | segunda vez responde "já usado" |
| Lighthouse (celular) | **100** em acessibilidade |

### Decisões de segurança que ficaram no código

**Não contamos quem tem conta.** "E-mail ou senha errados", nunca "este e-mail
não existe" — e o mesmo ao criar conta e ao pedir nova senha. Sem isso, qualquer
pessoa poderia testar uma lista de e-mails e descobrir quem é nosso cliente.
Num serviço antigolpe, saber quem já foi vítima tem valor para quem aplica golpe.

**Tempo constante.** Não basta a mensagem ser igual; a demora também. Quando a
conta não existe, o sistema gasta o mesmo tempo de uma conferência de verdade.

**Trocar senha derruba TODAS as sessões.** Se alguém tinha entrado na conta,
sai agora. Sem isso, trocar a senha seria teatro: o invasor continuaria dentro
com o cookie que já tinha.

**Sessão no banco, não em JWT.** JWT não dá para cancelar antes de expirar.
Custa uma consulta por requisição — barato perto de não conseguir expulsar
ninguém.

**Limite de tentativas é obrigatório aqui, não opcional.** A conferência de
senha gasta 32 MB e um pedaço do único núcleo de propósito. Sem limite, essa
mesma proteção vira a arma: vinte tentativas ao mesmo tempo derrubam o site.

**Arquivos:** `web/src/lib/` (senha, sessao, tokens, email, limite, acoes-conta)
e `web/src/app/` (entrar, criar-conta, esqueci-senha, nova-senha, confirmar, conta)

### Conta de teste

`teste@confiia.com.br` já existe no banco de desenvolvimento. Para entrar,
use **Esqueci minha senha** — o e-mail cai no seu Gmail pelo catch-all, e você
testa o fluxo inteiro de quebra.

---

## ✅ Etapa 5 — 2FA e painel trancado de verdade

**Objetivo:** o painel para de ser porta de banheiro.

- [x] TOTP com QR Code — **Google Authenticator**
- [x] **Códigos de reserva** — dez, de uso único, para não se trancar fora
- [x] Login de admin **recusado sem 2FA** — e a regra vale no BANCO
- [x] Conferência da tabela `admins` a cada requisição
- [x] Sessão de admin vence em **12 horas**
- [x] Endereço do painel **fora do código** (vem do ambiente)
- [x] Quem chega sem ser admin recebe **404**, não tela de login
- [x] Tranca provisória do protótipo apagada

**2FA para TODAS as contas, não só admin.** A senha de um usuário comum
abre o histórico dele — o que verificou, o que denunciou, o que perdeu num
golpe. Para quem já foi vítima, essa lista é justamente o que não pode vazar.

### Provado, não prometido

| Teste | Resultado |
|---|---|
| `/admin`, `/painel`, `/wp-admin` | **404** |
| Caminho certo, sem sessão | **404** |
| Caminho certo, admin com 2FA | abre |
| Código errado no login | recusado, e registrado na auditoria |
| Código certo | entra |
| Promover a admin sem 2FA | **o banco recusa** |
| Código já usado | recusado (contador guardado) |

### Duas decisões que valem explicar

**Código usado não vale de novo.** O código dura 30 segundos e funciona
quantas vezes for usado dentro da janela. Se alguém o vir — por cima do
ombro, num print, num teclado gravado — usa antes de você. Guardamos o
contador do último aceito e recusamos qualquer igual ou anterior.

**A sessão pela metade existe no banco.** Acertar a senha com 2FA ligado
cria uma sessão que não dá acesso a nada e morre em 10 minutos. Ela existe
para ficar **registrada**: se alguém acertar sua senha e travar no código,
isso aparece na sua lista de aparelhos — e é o aviso de que sua senha vazou.

**Arquivos:** `web/src/lib/dois-fatores.ts`, `acoes-seguranca.ts`, `guarda.ts`,
`web/src/app/conta/seguranca/`, `web/src/app/entrar/codigo/`,
`servidor/db/011_dois_fatores.sql` e `012_contador_totp.sql`

---

## 🔨 Etapa 6 — Site migrado para o Next

**Objetivo:** as páginas que já existem viram aplicação.

### Já feito

- [x] **Fonte e ícones no seu servidor.** Era o problema de LGPD: o IP de cada
      visitante ia para o Google e para o jsDelivr em toda visita, enquanto a
      Política promete guardar o mínimo. **Zero requisição externa agora** —
      conferido na aba de rede.
- [x] Cabeçalho e rodapé num lugar só (antes: copiados em dez arquivos)
- [x] O cabeçalho reconhece quem está logado e mostra o bicho + apelido
- [x] `privacidade`, `termos`, `reembolso`, `cookies` → rotas de verdade
- [x] Sistema visual do protótipo incorporado
- [x] **A home (a maior: 62 KB).** O script trouxe o HTML; o
      comportamento foi reescrito em três componentes de cliente —
      `verificador`, `menu-vivo` e `revelacao`.
- [x] `<main>` passou a envolver a página inteira. Antes envolvia só o card
      do verificador, e todo o resto ficava fora de qualquer marco de
      navegação — quem usa leitor de tela perdia a página.
- [x] Seis links que apontavam para `#` agora vão para rotas de verdade
      (`/criar-conta`, `/entrar`, `/privacidade`, `/termos`, `/denunciar`)
- [x] "Como funciona" de volta ao menu

### Três defeitos sérios encontrados no caminho

Nenhum dava erro no console nem quebrava o build. Estão documentados em
`web/CSS-ARMADILHAS.md`:

1. **O efeito de vidro não existia no Chrome.** A ordem das declarações com
   prefixo estava invertida no CSS, e o compilador guardava só a forma
   `-webkit-`, que o Chrome atual não reconhece mais.
2. **O texto do menu era ilegível: 1,29:1** (a norma pede 4,5:1). Duas
   causas somadas — `isolation:isolate` no vidro apagando o texto, e a
   tinta clara demais sobre o card branco. Hoje: **10,4:1**, nível AAA.
3. **`--shell` era usada e nunca definida**, então a largura de contenção
   sumia e o texto colava na borda esquerda da tela.

### Falta

- [x] `planos` — com seletor mensal/anual e a tabela comparativa
- [ ] `resultado`
- [x] `denunciar` — grava no banco, com protocolo e limite por IP
- [x] `registrar-loja` — grava no banco; a conferência na Receita entra na análise
- [ ] Histórico de consultas
- [ ] Apagar a pasta `prototipo/` quando tudo tiver migrado

**Prova até aqui:** as quatro páginas legais abrem em `/termos`, `/privacidade`,
`/reembolso`, `/cookies`, com Lighthouse **100** em acessibilidade no celular.

### Como está sendo feito

`web/scripts/porta-pagina.mjs` converte o HTML em JSX. São 200 KB em dez
páginas, e boa parte é documento legal: transcrever à mão significaria errar
uma palavra em algum lugar — e num texto que promete coisa ao usuário, uma
palavra trocada não é bug, é problema jurídico.

O script faz a parte mecânica e **avisa o que não sabe fazer**. Duas coisas já
apareceram e viraram regra dentro dele:

- **`<table>` sem `<tbody>`** quebrava a hidratação. O navegador insere o
  `<tbody>` ao ler o HTML do servidor; o React não. As duas árvores ficavam
  diferentes, com uma mensagem de erro que não dizia onde estava o problema.
- **Script que mexe no `<body>`** precisa rodar *depois* da hidratação, senão
  o React desfaz. O painel de acessibilidade estava sumindo por isso.

**Preciso de você:** nada.

---

## Etapa 7 — No ar com HTTPS

**Objetivo:** o site novo abre para o mundo, **sem derrubar o do seu amigo**.

> ⛔ **REGRA DESTA ETAPA — NÃO ESQUECER**
> `confiia.com.br` (54.39.96.172) é a versão que seu amigo fez.
> **Não se apaga, não se substitui, não se mexe.** Nem no servidor
> dele, nem no registro `A` do domínio raiz.
>
> O site novo vai para **`beta.confiia.com.br`**, num registro
> separado. Criar subdomínio não afeta o principal.
>
> A troca do endereço principal, se um dia acontecer, é decisão
> sua com ele — não é passo técnico deste plano.

- [ ] Criar registro `A`: **`beta`** → `IP-DA-VPS`, com proxy
      **desligado** (nuvem cinza — o certificado precisa falar
      direto com a VPS)
- [ ] nginx na frente da aplicação
- [ ] Certificado SSL grátis (Let's Encrypt), renovando sozinho
- [ ] Serviço systemd — sobe sozinho se a VPS reiniciar
- [ ] Cabeçalhos de segurança (CSP, HSTS)
- [ ] Publicação com um comando, e como voltar atrás se der errado

**Prova:** você abre `https://beta.confiia.com.br` no celular e o cadeado
está lá — e `confiia.com.br` continua mostrando o site do seu amigo.

**Preciso de você:** ⚠️ criar **só** o registro `beta` no Cloudflare.
Nada mais é alterado.

---

## Etapa 8 — Motor de verificação

**Objetivo:** o produto faz o que promete.

- [ ] Idade e dono do domínio (WHOIS/RDAP)
- [ ] Certificado e configuração do site
- [ ] Listas públicas de phishing (Google Safe Browsing — grátis)
- [ ] Leitura de print e comprovante (OpenAI)
- [ ] Detecção de imagem feita por IA (Hive)
- [ ] Consulta à sua própria base de denúncias
- [ ] Cálculo do score e do texto que a pessoa lê
- [ ] **Teto de R$ 70 travando de verdade** antes de gastar
- [ ] Apagar a imagem assim que a análise termina

**Prova:** você cola um link e recebe a resposta com os motivos.

**Preciso de você:** ⚠️ **chaves da OpenAI, Hive e Google Safe Browsing.**
E os contratos de proteção de dados (DPA) da OpenAI e da Hive — está no
`PENDENCIAS.md`, item 1, e é obrigatório pela LGPD.

---

## Etapa 9 — Planos e pagamento

**Objetivo:** entra dinheiro.

- [ ] Checkout no Asaas (Pix, cartão, boleto)
- [ ] Webhook confirmando pagamento
- [ ] Limite de cada plano valendo de verdade
- [ ] Aviso quando estiver perto do limite
- [ ] Cancelamento e a regra de reembolso que a gente definiu
- [ ] Página de cobrança do assinante

**Prova:** você assina o Básico com Pix, no seu próprio cartão, e o limite muda.

**Preciso de você:** ⚠️ **chave de produção do Asaas** e o webhook apontado
para `confiia.com.br/api/asaas/webhook`.

---

## Etapa 10 — Painel ligado e auditoria final

**Objetivo:** você opera o negócio, e ele aguenta ser olhado por fora.

- [ ] Painel lendo dado real (as 5 telas já desenhadas)
- [ ] Toda decisão gravando em `auditoria`
- [ ] **Auditoria de segurança completa da aplicação:**
  - [ ] Limite de requisições por IP e por conta
  - [ ] Injeção, XSS, falsificação de requisição
  - [ ] Quem pode ver o quê (uma conta não enxerga a outra)
  - [ ] Upload: tipo, tamanho, e o arquivo sendo apagado mesmo
  - [ ] Segredo nenhum no código
  - [ ] Cabeçalhos e cookies
- [ ] **Revisão de LGPD:** o que o site faz bate com o que a política promete
- [ ] Teste de recuperação: derrubar o banco e restaurar do backup

**Prova:** relatório escrito, item por item, com o que passou e o que não passou.

**Preciso de você:** ⚠️ a revisão de um advogado nos três documentos legais.

---

## Regras que valem em TODAS as etapas

Não são etapas — são condições. Se alguma delas quebrar, a etapa não está pronta.

### 📱 Celular vem primeiro, não depois

A pessoa que precisa do confia? está com o celular na mão, no meio de uma
conversa de WhatsApp, decidindo se clica. É ali que o produto é usado.

**Um site só, que se adapta.** Não existe "versão para celular" separada:
dois códigos seriam dois lugares para consertar cada bug, e um sempre ficaria
para trás. Toda tela nova é conferida em `390px` de largura antes de ser
considerada pronta.

- [x] Sem rolagem lateral em nenhuma página
- [x] Alvo de toque de **44px** (recomendação da Apple, do Google e da WCAG 2.5.5)
- [x] Campo de texto com fonte de 16px — abaixo disso o iPhone dá zoom sozinho
- [x] Layout aguenta o texto a 150% sem quebrar

### ♿ Acessibilidade não é enfeite

Quem mais cai em golpe de central falsa e de boleto é justamente quem enxerga
menos, escuta menos e tem menos intimidade com tecnologia. Um site antigolpe
que só serve para quem tem visão perfeita está deixando de fora exatamente
quem mais precisa dele.

E é **lei**: Lei Brasileira de Inclusão (13.146/2015), artigo 63.

- [x] Painel de acessibilidade em todas as páginas (botão ♿ no canto)
- [x] Tamanho do texto em 4 níveis, até 150%
- [x] Alto contraste (preto, branco e amarelo)
- [x] Espaçamento de leitura, que ajuda na dislexia
- [x] Destacar links, para não depender só da cor
- [x] Reduzir animação, para quem sente tontura
- [x] **Libras** pelo VLibras do governo — carregado só quando a pessoa liga,
      para não entregar o IP de todo visitante a um terceiro
- [x] Link "pular para o conteúdo" em todas as páginas
- [x] Tudo pelo teclado, com foco sempre visível
- [x] **Lighthouse 100/100** em acessibilidade, no computador e no celular

Toda tela nova passa pelo Lighthouse antes de entrar. Nota abaixo de 100 é
tratada como bug, não como detalhe.

---

## Depois das 10

### 📱 Aplicativo para celular

**Vai existir.** É o formato natural do produto: dá para compartilhar um link
direto do WhatsApp para o confia? sem copiar e colar, e dá para avisar a
pessoa por notificação quando um site que ela verificou piorar.

Só não vem antes porque depende de tudo que está nas 10 etapas — conta,
verificação, pagamento. Aplicativo sem isso é uma casca bonita.

Quando chegar a hora, a decisão será entre app nativo e um site que instala
como app (PWA). Para começar, o segundo entrega quase tudo por uma fração do
trabalho, e usa o mesmo código do site.

### Também depois

Extensão do navegador e documentação da API. Nenhuma delas faz sentido antes
do site funcionar.

---

## O que a auditoria já achou

Segurança não é uma etapa — está dentro de todas. A Etapa 10 é a conferência
final. O que já apareceu até agora:

| Onde | Achado | Situação |
|---|---|---|
| VPS | Login por senha ligado | ✅ desligado |
| VPS | `root` entrando direto | ✅ fechado |
| VPS | Sem firewall | ✅ ligado |
| VPS | Sem fail2ban | ✅ ligado |
| VPS | Sem swap, 1 núcleo — travaria no primeiro pico | ✅ 2 GB |
| VPS | Docker instalado e ocioso — **fura o firewall** se um dia você publicar porta de container | ⚠️ anotado |
| Painel | Aberto para quem soubesse o endereço | 🔒 tranca provisória; resolve de verdade na Etapa 5 |
| Site | Fonte e ícone vindos do Google e do jsDelivr — **o IP de cada visitante vai para eles**, contra o que sua política promete | ✅ resolvido, zero requisição externa |
| Site | Efeito de vidro não renderizava no Chrome: ordem invertida das declarações com prefixo, e o compilador descartava a versão que o navegador entende | ✅ corrigido |
| Site | Menu ilegível sobre o card branco — 1,29:1 onde a norma pede 4,5:1 | ✅ corrigido, 10,4:1 (AAA) |
| Site | `<main>` envolvia só o card do verificador; o resto da home ficava fora de qualquer marco para leitor de tela | ✅ corrigido |
| Cloudflare | O navegador **traduz** o painel: mostra `enviar` no lugar de `send`, `incluir:` no lugar de `include:`, `p=nenhum` no lugar de `p=none`. Editar e salvar com a página traduzida **grava o texto traduzido** e quebra o e-mail em silêncio | ⚠️ **sempre** clicar em "Mostrar original" antes de editar DNS |
| Senha | Custo do scrypt alto demais para 1 núcleo — viraria porta de ataque | ✅ ajustado |
| Banco | `002`: índice sobre `criado_em::date` — o Postgres recusa, porque o resultado muda conforme o fuso de quem consulta | ✅ corrigido, fuso fixado em São Paulo |
| Banco | `006`: `ORDER BY` com expressão depois de `UNION ALL` — não é aceito | ✅ corrigido |
| Banco | App rodaria com usuário dono das tabelas | ✅ separado em dois usuários |
| Banco | Log poderia gravar e-mail e relato de vítima em texto puro | ✅ `log_statement='ddl'` |
| Backup | Só existe dentro da própria VPS | ⚠️ **falta você**: cópia fora |
| SSH | `AllowTcpForwarding no` (minha própria trava) barrava o túnel de desenvolvimento | ✅ trocado por `local` + `PermitOpen 127.0.0.1:5432` — libera só o Postgres, nada mais |
| Dev | Desenvolvimento apontaria para o banco de produção | ✅ banco `confia_dev` separado |
| Código | `.env.local` com senha do banco | ✅ já ignorado pelo Git |

---

## Chaves que você precisa buscar, e para qual etapa

| Etapa | O que | Onde | Custo |
|---|---|---|---|
| 4 | Resend + DNS do e-mail | resend.com | grátis até 3.000/mês |
| 7 | DNS do domínio apontando para a VPS | onde registrou o domínio | — |
| 8 | OpenAI (+ DPA e treinamento desligado) | platform.openai.com | por uso |
| 8 | Hive (+ DPA) | thehive.ai | US$ 0,003/imagem |
| 8 | Google Safe Browsing | console.cloud.google.com | grátis |
| 9 | Asaas produção | asaas.com | % por transação |

O detalhe de cada uma está no `PENDENCIAS.md`.
