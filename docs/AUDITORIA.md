# Auditoria do Confia

Data da leitura: 4 de novembro de 2026.
Escopo: o repositório inteiro, o Next em execução local e o site
público `https://vaideconfia.com`. Nenhum arquivo de produção foi
alterado. Esta pasta é só documentação e captura de tela.

As capturas estão em `docs/auditoria/screens/`:

| Pasta | O que é |
|---|---|
| `desktop/` | App local, largura 1440 |
| `celular/` | App local, largura 390 |
| `fluxos/` | Verificar, planos, senha errada, denúncia |
| `ao-vivo/` | O domínio público, nas duas larguras |

---

## O que foi executado

Ambiente local, criado só para esta leitura: PostgreSQL 16.15,
banco `confia_dev`, papéis `confia_dono` e `confia_app`, as 19
migrações aplicadas na ordem. Conta comum semeada com
`npm run conta-teste`. Conta de admin semeada à parte, com TOTP,
porque o script `--admin` quebra (achado M7).

| Comando | Resultado |
|---|---|
| `npm ci` | 398 pacotes |
| `npx tsc --noEmit` | passou |
| `npm run lint` | passou, 9 avisos, 0 erros |
| `node scripts/confere-css.mjs` | nenhuma variável órfã |
| `node scripts/confere-icones.mjs` | 2078 ícones, nenhum quebrado |
| `npm run prova-armadilha` | 9 casos, a armadilha está de pé |
| `npm run confere-banco` | 15 objetos, auditoria fechada, RLS em 44 tabelas, 5/5 gatilhos com autoridade de dono |
| `npm run build` | passou. Next 16.3.2. Rotas listadas em `docs/ARQUITETURA.md` |
| `npm run confere-paginas` contra `next start` | 12 páginas, nenhum defeito automático |
| Chrome headless | login da conta comum, 2FA do admin, 404 do usuário comum no caminho do painel, painel do admin, comparação com o site no ar |

O build imprime `[sessao] banco indisponível` ao gerar
`/cookies`, `/privacidade`, `/reembolso` e `/termos`. O banco
estava no ar. A exceção é o Next avisando que a página usou
`cookies()` durante a pré-renderização, e `sessaoAtual` trata
qualquer erro como queda de banco (achado B4).

Não há script `test` no `package.json`. O que existe de prova
automatizada rodou. Não há teste de ponta a ponta no repositório;
a navegação desta auditoria foi feita à parte, com Chrome, e não
entrou no Git como dependência.

---

## Mapa curto

O Next é a aplicação. O protótipo HTML é o que está publicado em
`vaideconfia.com`. O beta previsto (`beta.confiia.com.br`) não foi
consultado: esta máquina não tem o túnel `confia-vps`.

O verificador não analisa nada. O pagamento não cobra. O painel
admin do Next é uma porta trancada com um parágrafo dentro. O
painel que o público encontra em `/admin` no domínio ao vivo é o
HTML de `prototipo/admin.html`, sem sessão.

Detalhe de pastas, banco, e-mail e deploy: `docs/ARQUITETURA.md`.
Ordem sugerida de conserto: `docs/ROADMAP.md`.

---

## Comparação com vaideconfia.com

Medido em 4 de novembro de 2026, com HTTPS e Cloudflare na frente.

| | Site no ar | Next deste repositório |
|---|---|---|
| Natureza | HTML estático do protótipo | Aplicação com banco |
| `/` | 200. Fontes do Google e ícones do jsDelivr | 200. Fonte e ícone servidos pelo próprio site |
| `/entrar`, `/criar-conta` | 404 com corpo vazio | formulários que gravam conta |
| Botões "Criar conta" e "Já tenho conta" na home | `href="#"` | `/criar-conta` e `/entrar` |
| Planos | cartões com `href="#"` | diálogo que leva a `/criar-conta` |
| Links internos | mistura `planos.html`, `index.html` e caminho sem extensão | `next/link` |
| `/admin` | 200, trilho Fila / Contas / Empresas / Custos, sem login | 404 |
| `/robots.txt`, `/sitemap.xml`, favicon | 404 | não existem arquivos; o `metadata` pede `noindex` |
| Cabeçalhos | Cloudflare. Sem CSP, sem `X-Frame-Options`, sem `Referrer-Policy` | CSP com nonce, `X-Frame-Options: DENY`, `nosniff`, COOP, HSTS em produção |
| 404 | corpo vazio; o Chrome mostra a página de erro dele | 404 padrão do Next, em inglês, texto preto sobre o azul-marinho |

O domínio no ar contradiz a política de privacidade que o Next
já escreveu: cada visita manda o IP para `fonts.googleapis.com` e
`cdn.jsdelivr.net`. O Next tirou isso de propósito
(`web/src/app/layout.tsx`).

Capturas: `docs/auditoria/screens/ao-vivo/`.

---

## Pagamentos

O que existe:

- Quatro planos semeados em `servidor/db/001_schema.sql` (grátis, básico, premium, enterprise), preços em centavos.
- Tabelas `assinaturas` e `pagamentos`, esta com `asaas_id` único.
- `web/src/lib/asaas.ts`: uma função `chamaAsaas`. `server-only` no topo, ambiente deduzido do prefixo da chave (`$aact_hmlg_` ou `$aact_prod_`), cabeçalho `access_token`, tempo limite de 15 s. Nenhuma página importa esse arquivo.
- Scripts de operação: `asaas-chave` (grava a chave no `.env.local` sem eco), `prova-asaas` (só lê), `asaas-teste` (cobrança reconhecível). O mapa operacional está em `ASAAS.md`.
- `ligado.pagamento` em `env.ts` fica verdadeiro quando a chave existe. Nenhuma tela lê essa bandeira.
- O diálogo de `/planos` tem o botão "Criar minha conta grátis". Os cartões, porém, já dizem "Assinar Básico" e "Assinar Premium" (achado A6).

O que não existe:

- Rota de checkout, de assinatura ou de cobrança avulsa.
- Webhook do Asaas. Sem ele, pagamento confirmado não vira plano.
- Tela de fatura, estorno, nota ou cartão. A política de reembolso descreve um fluxo que o código não executa.
- Uso de `pagamentos` e `assinaturas` pelo app. `confia_app` pode ler `assinaturas` e não pode escrever nela (migração 015).
- Sandbox obrigatório. `ASAAS.md` registra que a chave ligada no ambiente da dona do projeto era de produção.

A `Permissions-Policy` manda `payment=()`. Isso bloqueia a Payment
Request API do navegador. Pix via Asaas não precisa dessa API; se
um dia o checkout usar a API de pagamento do navegador, o
cabeçalho em `web/next.config.ts` tem que ser revisto junto.

---

## Nexakeep

Não há a palavra Nexakeep, nem import, nem comentário de cópia, em
nenhum arquivo do repositório.

O que tem cara de CRM, e não de verificador de golpe:

- `prototipo/admin.html` e `prototipo/assets/admin.js`: trilho com Painel, Fila, Contas, Empresas e Custos, busca por protocolo, e-mail ou domínio, gaveta lateral. É uma bancada de operação. Está publicada sem autenticação em `https://vaideconfia.com/admin` (achado A4). No Next, o equivalente é só a porta em `web/src/app/[chave]/painel/page.tsx`.
- O esquema tem `tickets`, `ticket_mensagens` e `membros`, no formato de help desk e de conta familiar. Nenhuma tela lê isso.
- A área `/conta` ("Visão geral", perfil, segurança, aparelhos, plano, privacidade) é painel de usuário. O vocabulário cabe no Confia. O defeito dela no celular é de layout (achado A5), não de produto emprestado.

Não dá para afirmar que algum bloco foi copiado do Nexakeep. Dá
para afirmar que o admin estático é um console genérico de fila e
cadastro, e que ele não deveria estar num domínio público.

---

## Achados

Gravidade alta: dá para tirar a pessoa do site, furar o limite, ou
o que está no ar mente sobre o que o produto faz.
Média: quebra função, vaza informação de conta, ou contradiz uma
regra que o próprio projeto escreveu.
Baixa: acabamento, texto, ou dívida já cercada por outro controle.

### A1 — Depois do login, um destino com barra invertida sai do site

**Gravidade:** alta
**Onde:** `web/src/lib/acoes-conta.ts:261`, valor vindo de `web/src/app/entrar/page.tsx:30` e `web/src/app/entrar/forma.tsx:27`

A checagem aceita qualquer destino que comece com `/` e não com
`//`. Um destino que começa com `/` seguido de barra invertida
passou. No Chrome headless, o login da conta de teste terminou em
`https://example.com/`.

Quem manda o link "entre para ver o resultado" escolhe o site que
abre depois da senha. Num produto antigolpe, a página que aparece
logo após o Confia é exatamente o lugar onde a pessoa baixa a guarda.

**Correção:** só redirecionar para um caminho interno de uma lista
curta (`/conta`, `/denunciar`, `/resultado`, …). Recusar barra
invertida, controle, `%2f`, `%5c` e qualquer coisa que o navegador
possa tratar como outro host. Na dúvida, `/conta`.

### A2 — O limite de tentativa acredita no IP que o cliente declara

**Gravidade:** alta
**Onde:** `web/src/lib/limite.ts:82-86`, o mesmo padrão em `web/src/lib/sessao.ts:54-57`, e o nginx em `servidor/03-publica.sh:267-268`

O código usa o primeiro valor de `X-Forwarded-For`. O nginx faz
`proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for`, que
acrescenta o IP real no fim e preserva o que o cliente mandou no
começo. Quem chama a rota escolhe o endereço que conta para o
limite, para a auditoria e para a coluna `inet` da sessão.

O próprio `limite.ts` explica por que isso importa: o scrypt gasta
memória de propósito, e sem limite essa defesa vira negação de
serviço no único núcleo da VPS. O limite também é a trava da
denúncia anônima e do cadastro de loja.

Um valor que não é IP ainda pode derrubar a gravação da sessão,
porque a coluna é `inet` (`servidor/db/001_schema.sql:37`).

**Correção:** atrás do nginx, ler `X-Real-IP`, que o script já
define como `$remote_addr`, ou o último salto acrescentado pelo
proxy. Ignorar o prefixo enviado pelo cliente. Rejeitar o que não
for IP antes de inserir.

### A3 — A página estática e o 404 têm o JavaScript bloqueado pela CSP

**Gravidade:** alta
**Onde:** `web/src/proxy.ts:83-98` e `web/src/app/esqueci-senha/page.tsx` (não declara `force-dynamic`)

A CSP exige nonce por requisição e `strict-dynamic`. Páginas
renderizadas na hora recebem o nonce certo. `/esqueci-senha` saiu
estática no build (`○`). O HTML foi gerado com um nonce; a
resposta traz outro. O Chrome recusou os chunks:

`Loading the script '…/_next/static/chunks/…' violates the following Content Security Policy directive`

O mesmo apareceu no 404 padrão. O formulário de "esqueci a senha"
depende de componente de cliente. Sem o script, a página desenha
e a interação que o React deveria assumir não sobe.

**Correção:** toda página que carrega script do Next precisa ser
dinâmica enquanto a CSP for por nonce (`export const dynamic = 'force-dynamic'`), ou a CSP precisa de um modo que o HTML estático consiga satisfazer. O 404 próprio (`not-found.tsx`) entra no mesmo regime. Conferir no console, não só no status HTTP.

### A4 — O painel de operação está publicado sem login

**Gravidade:** alta no domínio que está no ar
**Onde:** `prototipo/admin.html` servido em `https://vaideconfia.com/admin` (HTTP 200). No Next, `web/src/app/[chave]/painel/page.tsx:49-52` devolve 404 para quem não é admin, e isso foi confirmado com a conta comum.

A captura `ao-vivo/desktop/admin.png` mostra o trilho: Painel,
Fila (selo 10), Contas, Empresas (selo 2), Custos, busca por
protocolo, e-mail ou domínio, e o rodapé "protótipo · dados de
exemplo". Não pede senha. O `noindex` do HTML não impede quem
digita o endereço.

Os dados são de exemplo. A forma da ferramenta, a existência da
fila e o nome no rodapé do protótipo não são.

**Correção:** tirar `admin.html` (e `assets/admin.js`) do host
público. O painel real continua só atrás de `exigeAdmin()`.

### A5 — No celular, a conta inteira fica fora da tela

**Gravidade:** alta
**Onde:** `web/src/app/globals.css:1891-1896` e `:2002-2010`

Em 390 px, `/conta` e as cinco subpáginas produziram rolagem
horizontal de 503 a 588 px. A captura `celular/conta.png` mostra
o miolo branco cortado na borda direita: o texto "Olá, Kaina", os
avisos de 2FA e o plano começam fora da primeira dobra horizontal.

A partir de 1080 px a grelha vira uma coluna e o menu vira faixa.
A faixa é `flex-direction: row` com `white-space: nowrap` e sem
`min-width: 0`. O mínimo do conteúdo da faixa (todos os itens
numa linha só) alarga a grelha, e a página cresce com ela. O
`overflow-x: auto` da faixa não chega a agir.

**Correção:** `min-width: 0` em `.painel`, `.painel-lado` e
`.conta-nav`. A faixa rola por dentro. Conferir de novo as seis
rotas em 390 px: a rolagem horizontal do documento tem que ser 0.

### A6 — O botão do plano diz "Assinar" e não cobra

**Gravidade:** alta, pela regra de honestidade do próprio projeto
**Onde:** `web/src/app/planos/cartoes.tsx:118` e `:154`, em contradição com `:46-51` e com `web/src/app/planos/page.tsx:22-26`

A regra escrita no topo da página: enquanto o pagamento não
estiver ligado, o botão não pode dizer "Assinar". Os cartões
dizem "Assinar Básico" e "Assinar Premium". O diálogo que abre
em seguida é que diz "Criar minha conta grátis" e aponta para
`/criar-conta`.

Quem lê o cartão entende que vai pagar. O servidor não tem rota
de cobrança.

**Correção:** o texto visível do cartão volta a "Criar minha conta
grátis" até existir checkout. Quando o checkout existir, o aviso
de "a cobrança ainda não existe" só sai no mesmo commit que liga
o webhook.

### A7 — Senha de teste escrita no repositório

**Gravidade:** alta se essa conta existir em qualquer host alcançável; hoje o script recusa banco que não se chame `confia_dev`
**Onde:** `CLAUDE.md` (bloco "Como rodar") e `web/scripts/conta-teste.mjs:62-63`. O valor não é repetido aqui.

O e-mail e a senha da conta de teste estão no Git. O script
confere o nome do banco e sai se não for `confia_dev`
(`conta-teste.mjs:74-79`). Isso impede plantar a senha em
produção por engano. Não impede alguém de usar o par se a mesma
conta tiver sido criada no banco da dona do projeto e esse banco,
ou um beta, estiver acessível.

**Correção:** trocar a senha dessa conta em todo banco que não
seja a máquina local. Tirar a senha dos documentos versionados e
deixar o script exigi-la por argumento, sem padrão.

---

### M1 — Conta suspensa continua entrando, e a página prometida é 404

**Gravidade:** média
**Onde:** `web/src/lib/guarda.ts:61`. Não existe `web/src/app/conta/suspensa/`. As páginas em `web/src/app/conta/` usam `sessaoAtual()` e não leem `status`.

`exigeLogin` manda a conta suspensa para `/conta/suspensa`. Essa
rota responde 404 (captura `desktop/conta-suspensa.png`). O layout
de `/conta` não chama `exigeLogin`. Uma sessão válida de conta
suspensa ainda renderiza o painel.

**Correção:** uma página curta, em português, dizendo que a conta
está suspensa e para qual e-mail escrever. O layout de `/conta`
aplica a mesma regra, senão a página nova não é alcançada por quem
já tem cookie.

### M2 — Confirmar o e-mail também faz login, por GET

**Gravidade:** média
**Onde:** `web/src/app/api/confirmar/route.ts:27-35` e `web/src/lib/acoes-conta.ts:291-293`

O link do e-mail é um GET que grava o cookie de sessão. Quem
convence a pessoa a abrir o link de confirmação de outra conta
deixa essa pessoa dentro da conta errada. O token vai na query
string, então também pode parar em log e em histórico.

**Correção:** a página mostra "confirmar" e um POST faz a troca.
Não criar sessão no GET. Sessão nova no mesmo navegador encerra a
anterior, para o link não empilhar contas.

### M3 — Criar conta com e-mail já confirmado responde mais rápido e não avisa o dono

**Gravidade:** média
**Onde:** `web/src/lib/acoes-conta.ts:140-149`

O comentário diz que a resposta é a mesma e que quem já tem conta
recebe um e-mail. O código só reenvia o link quando a conta ainda
não foi confirmada. Conta já confirmada cai direto no redirect,
sem o tempo do envio. Dá para distinguir "este e-mail é cliente"
pelo tempo, e o dono não fica sabendo da tentativa.

**Correção:** os dois caminhos esperam o mesmo trabalho (enviar
um aviso genérico, ou um atraso equivalente) e a mensagem na tela
continua única.

### M4 — A política de cookies lista cookies que o site não grava

**Gravidade:** média
**Onde:** `web/src/app/_portado/Cookies.tsx:44-55` e `web/src/components/aviso-cookies.tsx:15-21`

A página nomeia `confia_csrf`, `confia_limite` e `confia_uso`.
No código só existem `confia_sessao` (`sessao.ts:42`) e
`confia_cookies` (a escolha do aviso). O limite é memória do
processo, não cookie. Não há medição. O aviso fala de um cookie
de medição que nada lê.

**Correção:** a tabela lista só o que o servidor seta. O botão
"Aceitar todos" sai, ou passa a ligar uma medição que exista de
fato. Os dois textos, página e aviso, mudam juntos.

### M5 — Segredo TOTP antigo ainda é aceito em texto puro

**Gravidade:** média enquanto a migração de cifra não tiver rodado em todo banco
**Onde:** `web/src/lib/cofre.ts:113-117`

`abreDoCofre` devolve o valor cru quando ele não começa com `v1$`.
O comentário chama isso de ponte. Quem copiar o banco e ainda
encontrar segredo sem o prefixo gera o código de 6 dígitos.

**Correção:** rodar `scripts/cifra-segredos.mjs` onde ainda houver
linha antiga e, depois, tratar valor sem `v1$` como erro.

### M6 — Ligar ou desligar o 2FA é registrado como troca de senha

**Gravidade:** média
**Onde:** `web/src/lib/acoes-seguranca.ts:85-88`, `:173-176` e `:217-219`

A ação gravada é `conta.senha_trocada` ao ligar o segundo fator,
ao gerar códigos de reserva e ao desligar. Uma investigação de
"quem trocou a senha" mistura três fatos diferentes. O campo
`depois` distingue, se alguém souber olhar.

**Correção:** ações próprias (`conta.2fa_ligado`, `conta.2fa_desligado`, `conta.codigos_reserva`). Não reaproveitar o nome da troca de senha.

### M7 — `npm run conta-teste -- --admin` quebra

**Gravidade:** média para quem opera o projeto; não está no caminho do visitante
**Onde:** `web/scripts/conta-teste.mjs:122` e `:152`. Não há `import` de `OTPAuth`.

Rodado nesta auditoria contra `confia_dev`, com outro e-mail:
`Falhou: OTPAuth is not defined`. A conta chega a ser inserida
antes da exceção. O admin e o TOTP não. O import existe em
`web/src/lib/dois-fatores.ts:40` e faltou aqui.

**Correção:** importar `otpauth` no script. Gravar o segredo com
`guardaNoCofre`, não em texto puro, para o script e o login
falarem a mesma língua.

### M8 — O 404 é inglês e some no fundo

**Gravidade:** média
**Onde:** não há `web/src/app/not-found.tsx`. Captura `desktop/nao-existe.png`.

O texto é "404 | This page could not be found.", preto, sobre o
azul escuro do `body`. Não tem link de volta. No ar, o 404 de
`vaideconfia.com` é pior: corpo de zero bytes.

**Correção:** `not-found.tsx` em português, cor do texto clara,
um link para a home e o mesmo nonce da CSP (achado A3).

### M9 — O aviso de cookies cobre o aviso de que o Confia pode errar

**Gravidade:** média
**Onde:** `web/src/app/globals.css:1825-1832`. Captura `desktop/home-dobra-cookies.png`.

O cartão fica fixo no canto inferior direito, 430 px de largura,
`z-index: 880`. Nessa posição ele senta em cima do rodapé do
verificador, inclusive da frase "O confia? pode errar" e do link
de criar conta. Essa frase é a que o projeto marcou como a mais
importante, porque é onde a pessoa decide.

No celular o cartão ocupa quase a largura toda (`calc(100vw - 40px)`).

**Correção:** subir o cartão para não cruzar o verificador, ou
reservar padding no card enquanto o aviso estiver aberto. O texto
de honestidade tem que permanecer legível nos dois tamanhos.

### M10 — `COFRE_CHAVE` não entra na conferência de ambiente

**Gravidade:** média
**Onde:** `web/src/lib/env.ts:25-66` não lista a variável. `web/src/lib/armadilha.ts:87-91` só exige a chave em produção, na hora de assinar. `servidor/03-publica.sh:334` deixa `COFRE_CHAVE=` vazio no modelo.

O processo sobe. O primeiro formulário público em produção, sem a
chave, lança erro. Em desenvolvimento, sem chave, a assinatura
usa a constante `'sem-chave-em-desenvolvimento'`, que está no
código. Quem publicar com `NODE_ENV` errado publica a constante
junto.

Também não existe `.env.exemplo`, embora `env.ts:19` mande
atualizá-lo. O `.gitignore` está preparado para não ignorar esse
arquivo (`!.env.exemplo` na raiz).

**Correção:** `COFRE_CHAVE` obrigatória quando `NODE_ENV=production`, com tamanho mínimo, na mesma lista das outras. Criar `.env.exemplo` sem valores. O script de publicação falha se a chave estiver vazia.

### M11 — `exigeDono` não tem nenhum chamador

**Gravidade:** média como dívida, não como falha explorável hoje
**Onde:** `web/src/lib/guarda.ts:106`. A busca por `exigeDono(` no `src` só acha a definição.

Não há página de verificação, denúncia alheia ou empresa alheia
para trocar o id. No dia em que essa página nascer, o comentário
do arquivo diz que ela tem que começar por essa função. Hoje nada
obriga isso além do comentário.

**Correção:** quando a rota existir, o primeiro teste é pedir o
id de outra conta e receber 404. Até lá, um teste que importe a
função e falhe se alguma page de recurso não a referenciar.

---

### B1 — O verificador guarda o arquivo só na memória do navegador, e o botão está em inglês

**Gravidade:** baixa
**Onde:** `web/src/components/verificador.tsx:50-53`, `:234-242` e `:311`

Não há endpoint de upload. O arquivo não sai do browser, então
não há validação de tipo no servidor para fazer. O botão diz
"Uploads". O envio mostra, corretamente, que a análise ainda não
existe (confirmado no fluxo: "A análise ainda está sendo construída…").

**Correção:** quando o motor existir, o upload passa por tipo,
tamanho, nome e antivírus no servidor, e o botão fala português.
Até lá, "Anexar print" descreve o que o botão faz.

### B2 — A meta de planos anuncia R$ 8,25 e a tela abre em R$ 12,90

**Gravidade:** baixa
**Onde:** `web/src/app/planos/page.tsx:40-41` e `cartoes.tsx:116`

R$ 8,25 é o anual do Básico dividido por doze. A página abre no
ciclo mensal, R$ 12,90. Quem lê o título do link vê um preço que
a primeira dobra não mostra.

**Correção:** a descrição usa o preço do ciclo que a página mostra
por padrão, ou diz "no anual".

### B3 — Sobra do create-next-app em `public/`

**Gravidade:** baixa
**Onde:** `web/public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`

Não são usados pela interface. São a marca de projeto gerado.

**Correção:** apagar quando alguém for mexer em `public/` por outro motivo.

### B4 — Queda de banco e erro de renderização são o mesmo `catch`

**Gravidade:** baixa
**Onde:** `web/src/lib/sessao.ts:135-142`

Qualquer exceção em `leSessao` vira "ninguém logado" e um log de
banco indisponível. Falha para o lado fechado, o que é certo para
conexão. Também esconde bug de código e polui o log do build, como
nesta auditoria.

**Correção:** capturar erro de conexão. Deixar subir erro de
programação e o bailout dinâmico do Next.

### B5 — Avisos de lint que não quebram o build

**Gravidade:** baixa
**Onde:** `web/public/assets/acessibilidade.js` (5), `web/scripts/ajusta-schema.mjs`, `web/scripts/conta-teste.mjs:33` (`timingSafeEqual` importado e não usado), `web/scripts/porta-pagina.mjs`

`npm run lint` termina 0. São avisos.

**Correção:** tirar o import morto e o parâmetro não usado na próxima passagem por esses arquivos. O `acessibilidade.js` é cópia do protótipo; mexer nos dois juntos.

### B6 — O esquema Drizzle não entende `citext`

**Gravidade:** baixa
**Onde:** `web/src/db/schema.ts`, comentários `TODO: failed to parse database type 'citext'` (por exemplo a linha 257)

O `db:puxar` deixou a nota. E-mail continua sendo coluna `citext`
no SQL, que é o que importa para não duplicar conta por maiúscula.
O tipo gerado fica mais frouxo do que a coluna.

**Correção:** no ajuste pós-geração (`scripts/ajusta-schema.mjs`), mapear `citext` para `string` com um comentário, e apagar o TODO.

---

## O que foi olhado e não virou achado

- Injeção de SQL nas ações do site: consultas parametrizadas pelo Drizzle ou pelo `postgres` com valor fora da string. Os identificadores de `exigeDono` saem de uma lista fixa de tabelas.
- XSS por `dangerouslySetInnerHTML`: não há uso. O texto de golpe com `<b>` é montado como elemento (`golpes.tsx`).
- Upload malicioso: não há receptor no servidor.
- Admin do Next aberto para usuário comum: a conta de teste recebeu 404 em `/painel-auditoria-local/painel`. A conta admin, com TOTP, viu a porta e só a porta.
- Honeypot: `prova-armadilha` passou os 9 casos. O preenchimento automático do formulário de denúncia no navegador não chegou a exercitar o servidor (o estado do React não acompanhou o valor escrito à força); isso não invalida o script.
- Segredos de API no Git: a busca por chave de Asaas completa, chave de Resend, `sk-` e URL de Postgres com senha real não achou valor. As ocorrências de `postgres://` em `servidor/02-banco.sh:224-227` são variáveis do shell (`$APP`, `$SENHA_APP`), não senha gravada. `ASAAS.md` documenta o prefixo da chave, não a chave.
- O incidente de 27/08/2026 em que um `diff` de `.env.local` imprimiu segredos numa conversa está narrado em `MELHORIAS.md`, item 10. Não está no Git. Se a rotação ainda não foi feita, ela continua valendo: Resend, senhas do Postgres e `COFRE_CHAVE`.

---

## O que esta auditoria não cobriu

- O beta `beta.confiia.com.br` e a VPS. Não há túnel `confia-vps` nesta máquina, e publicar está fora do pedido.
- Chamada real ao Asaas, ao Resend, à OpenAI, ao Hive e ao Safe Browsing. Nenhuma chave estava no ambiente.
- Telefone físico. O celular é a viewport de 390 px no Chrome.
- O centro de `vaideconfia.com/admin` na captura ficou escuro; o trilho renderizou. O miolo desse protótipo é preenchido por `admin.js` conforme o hash. Não cliquei as cinco telas de exemplo uma a uma.
- Pentest completo (fuzz de todo campo, corrida de sessão, carga). Os achados altos foram reproduzidos; o resto é leitura de código com linha.
- Diff contra o código-fonte do Nexakeep. O nome não aparece aqui, então não houve o que comparar arquivo a arquivo.
