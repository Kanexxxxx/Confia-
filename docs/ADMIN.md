# Como entrar no painel admin do Next

Este texto é para a dona do projeto. Ele explica como abrir o
painel de verdade, o que mora no Next em `/<chave>/painel`.
Não é o `prototipo/admin.html`.

O painel de hoje é a porta, não a bancada. Quando o acesso está
certo, a tela diz que as cinco áreas (fila, contas, empresas,
custos) ainda entram na etapa 10. Se aparecer isso, deu certo.
Se aparecer 404, alguma das travas abaixo não passou. O site
responde 404 de propósito: não existe tela de "acesso negado".

Nada neste arquivo é senha, chave ou caminho. Os nomes das
variáveis podem ser escritos. Os valores não. Não cole valor de
`web/.env.local`, de `/etc/confia/site.env` nem de
`/etc/confia/banco.env` em conversa, print ou commit.

---

## O que trava a porta

As três coisas têm que existir ao mesmo tempo.

1. A variável `PAINEL_CAMINHO` define o pedaço `<chave>` do
   endereço. Sem ela, o painel não existe: qualquer caminho
   responde 404, inclusive `/admin` e `/painel`.
2. A conta está na tabela `admins`. Quem coloca alguém lá é o
   script `web/scripts/admin.mjs`, rodado na máquina, não uma
   tela do site.
3. A mesma conta tem e-mail confirmado e segundo fator (TOTP)
   ligado. A função `admin_pode_entrar` no banco confere isso.
   Sem o código do celular, a senha não abre o painel.

A sessão de quem é admin vence em 12 horas. Depois disso é
entrar de novo. Conta comum dura 30 dias; a de admin, não.

---

## 1. Gerar a chave do caminho

O código exige pelo menos 8 caracteres (`web/src/lib/env.ts`).
Use bem mais, e só letras e números, para a chave caber num
endereço sem barra.

Na sua máquina, na pasta `web`:

```bash
openssl rand -hex 24
```

O comando imprime uma linha. Essa linha é o valor. Ela não vai
para o Git, não vai para o chat e não vai para um print.

- No computador de desenvolvimento, grave no `web/.env.local`
  uma linha cuja variável se chama `PAINEL_CAMINHO`.
- No servidor, a mesma variável entra em `/etc/confia/site.env`
  (passo 7). Pode ser outro valor, se você quiser um caminho
  diferente no beta. Os dois arquivos não se commitam.

O modelo que o `servidor/03-publica.sh` cria ainda não traz
`PAINEL_CAMINHO`. A linha é acrescentada à mão.

O Next só lê o ambiente quando o processo sobe. Mudou a
variável, reinicie o `npm run dev` ou o serviço `confia`.

Não publique o endereço. Caminho vazado deixa de atrapalhar robô.
A trava que importa continua sendo sessão + `admins` + 2FA.

---

## 2. A chave do cofre, antes de ligar o 2FA

O script `admin.mjs` não lê `COFRE_CHAVE`. O site lê, na hora em
que você liga o segundo fator: o segredo do aplicativo é cifrado
com ela e só assim vai para o banco.

Ela precisa ter no mínimo 32 caracteres. Se ainda não existe no
`web/.env.local`:

```bash
openssl rand -base64 32
```

Grave o resultado na variável `COFRE_CHAVE` do `.env.local` e
reinicie o `npm run dev`.

Se já existe alguém com 2FA nesse banco, não troque o valor.
Trocar a chave não "atualiza" o que está cifrado: o código do
celular deixa de bater e não há recuperação automática. A cópia
de segurança dessa chave fica fora do computador (gerenciador de
senha ou papel), como está em `PENDENCIAS.md`, item 6. No
servidor, `/etc/confia/site.env` recebe a mesma `COFRE_CHAVE` da
máquina que cifrou os segredos. Outra chave tranca as contas que
já ligaram o 2FA.

---

## 3. Criar a conta no site e ligar o 2FA

O `admin.mjs` não cria usuário. Ele só promove uma conta que já
existe, com e-mail confirmado e 2FA ligado. Se o 2FA estiver
desligado, o script recusa e o banco também recusa.

Não use `npm run conta-teste` para esta conta. Aquele script
existe para o banco `confia_dev`, planta uma senha conhecida e,
com `--admin`, hoje quebra antes de concluir.

Ordem:

1. Suba o site (`npm run dev` no computador, ou o beta no ar).
2. Abra `/criar-conta` e crie a conta com um e-mail que você lê
   e uma senha que não está em outro site.
3. Confirme o e-mail pelo link. Com `RESEND_API_KEY` no ambiente,
   o link chega na caixa. Sem essa chave, e só em desenvolvimento,
   o terminal do `npm run dev` imprime o link no lugar do envio.
   Esse link também é segredo: não cole em conversa.
4. Entre em `/entrar`.
5. Abra `/conta/seguranca`.
6. Toque em **Ligar o segundo fator**.
7. No celular, abra o Google Authenticator (a tela pede esse
   aplicativo). Toque em **+**, escolha **Ler código QR** e
   aponte para a figura. Sem câmera, digite no aplicativo o
   código manual que a página mostra ao lado do QR. O emissor
   que aparece no aplicativo é `confia?`, com o seu e-mail.
8. Digite no site o número de 6 dígitos que o aplicativo mostra
   naquele momento e confirme **Confirmar e ligar**. O número
   muda a cada 30 segundos. Se o site recusar um código que
   parece certo, confira se o relógio do celular está no
   automático.
9. Ainda em `/conta/seguranca`, toque em **Gerar novos códigos de
   reserva**. Aparecem dez códigos, uma vez só. Guarde fora do
   computador, no mesmo lugar da `COFRE_CHAVE`. Cada um funciona
   uma vez. Gerar um lote novo apaga o lote anterior.

Conta que administra o painel não consegue desligar o 2FA pela
tela. O botão some, e o banco recusa.

---

## 4. Promover a conta com `admin.mjs`

O script grava em `admins` e em `auditoria`. O usuário
`confia_app`, que é o `DATABASE_URL` do site, não tem esse
direito. O script usa `DATABASE_URL_MIGRACAO` se ela existir, e
só cai no `DATABASE_URL` se a primeira faltar. Para funcionar,
`DATABASE_URL_MIGRACAO` tem que ser a conexão do `confia_dono`,
a mesma variável que o `servidor/02-banco.sh` grava em
`/etc/confia/banco.env`.

### No computador

O túnel até o Postgres da VPS, se o banco não estiver na própria
máquina:

```bash
cd web
npm run tunel
```

Em outro terminal, com `DATABASE_URL_MIGRACAO` e `COFRE_CHAVE` já
no `web/.env.local` (a segunda não é lida pelo script, mas o site
precisa dela antes do passo 3):

```bash
cd web
npm run admin -- --conceder=SEU_EMAIL
```

Troque `SEU_EMAIL` pelo e-mail da conta que acabou de ligar o
2FA. O `npm run admin` já carrega o `.env.local`.

Conferir a lista, sem promover ninguém:

```bash
cd web
npm run admin
```

A saída mostra e-mail, nome, papel e se o 2FA está ligado. Não
copie essa saída para um lugar público.

Outros usos, todos a partir de `web`:

```bash
npm run admin -- --remover=SEU_EMAIL
npm run admin -- --somente=SEU_EMAIL
```

`--somente` concede a essa conta e apaga todos os outros admins.
Leia a lista antes. Rodar por engano deixa você do lado de fora.

Se o script disser que a conta não tem segundo fator, volte ao
passo 3. Se disser que a conta não existe, o e-mail não é o da
conta ativa.

### No servidor (VPS do beta)

Entre por `ssh confia-vps`. O código fica em `/var/www/confia`.
Não crie um `.env.local` dentro dessa pasta: o `03-publica.sh`
guarda segredo em `/etc/confia/` justamente para um erro de
nginx não servir o arquivo.

O `banco.env` é legível por root e pelo grupo `confia`. Não dê
`cat` nele. Carregue só para o comando:

```bash
cd /var/www/confia
set -a
. /etc/confia/banco.env
set +a
node scripts/admin.mjs --conceder=SEU_EMAIL
```

`node scripts/admin.mjs` sem argumento lista. O `postgres` do
Node precisa estar instalado nessa pasta (`npm ci` já feito no
deploy).

---

## 5. Entrar

O menu do site não aponta para o painel. Você digita o endereço.

1. Abra o login.
   - Computador: `http://localhost:3000/entrar`
   - Beta: `https://beta.confiia.com.br/entrar`
2. E-mail e senha. Com o 2FA ligado, o site manda para
   `/entrar/codigo` e pede os 6 dígitos. Essa sessão pela metade
   dura 10 minutos. Passou disso, comece de novo em `/entrar`.
3. Depois de entrar, abra o painel no mesmo host:
   `https://beta.confiia.com.br/` + o valor de `PAINEL_CAMINHO` +
   `/painel`. No computador, o host é `http://localhost:3000`.

`/admin` e `/painel` continuam 404. Isso é o esperado.

Uma conta logada que não está em `admins` também recebe 404 nesse
endereço. Não é bug de página sumida.

---

## 6. Se perder o 2FA

Faça nesta ordem. Pare no primeiro passo que funcionar.

1. **Código de reserva.** Em `/entrar`, entre com a senha. Na
   tela do código, escolha **Perdi o celular — usar código de
   reserva** e digite um dos dez. Cada código vale uma vez.
   Entrou, gere um lote novo em `/conta/seguranca` e guarde.
2. **A chave do cofre sumiu, o celular não.** Os códigos de
   reserva continuam válidos: eles são hash, não dependem de
   `COFRE_CHAVE`. O código do aplicativo deixa de bater, porque
   o servidor não consegue abrir o segredo cifrado. Recupere a
   mesma `COFRE_CHAVE` da cópia de fora do computador e coloque
   de volta no `.env.local` e no `/etc/confia/site.env`. Não
   invente outra. Reinicie o site.
3. **Celular e códigos de reserva sumiram.** Aí só no servidor,
   com a conexão de dono (`DATABASE_URL_MIGRACAO` /
   `confia_dono`), na conta que é sua. Zere o segundo fator
   dessa conta (`totp_segredo`, `totp_ativado_em` e o contador) e
   apague os códigos de reserva dela. Não apague a linha em
   `admins`: com o 2FA desligado o painel responde 404, mas a
   conta volta a entrar só com a senha. Entre, ligue o 2FA de
   novo no passo 3 e guarde códigos novos. Quando
   `totp_ativado_em` voltar, `admin_pode_entrar` aceita de novo,
   sem precisar de outro `--conceder`.

Não rode o passo 3 "por garantia" numa conta que ainda tem o
celular. Enquanto o 2FA está zerado, a senha sozinha entra.

---

## 7. O mesmo caminho no beta

Resumo do que muda entre a máquina local e a VPS. O significado
das variáveis é o mesmo.

| | Computador | VPS (`beta.confiia.com.br`) |
|---|---|---|
| Ambiente do site | `web/.env.local` | `/etc/confia/site.env` |
| Conexão de dono, para o `admin.mjs` | `DATABASE_URL_MIGRACAO` dentro do `.env.local` | `/etc/confia/banco.env`, carregado no comando do passo 4 |
| `PAINEL_CAMINHO` | no `.env.local` | acrescentar à mão no `site.env` |
| `COFRE_CHAVE` | no `.env.local`, antes de ligar o 2FA | a mesma chave no `site.env` |
| Subir de novo depois de mudar ambiente | parar e rodar `npm run dev` | `sudo systemctl restart confia` |
| Login | `http://localhost:3000/entrar` | `https://beta.confiia.com.br/entrar` |
| Painel | `http://localhost:3000/<chave>/painel` | `https://beta.confiia.com.br/<chave>/painel` |

O `DATABASE_URL` do site continua sendo o usuário `confia_app`.
Não aponte o site para o `confia_dono`.

O domínio raiz `confiia.com.br` não entra nesse serviço. O
`03-publica.sh` recusa configurá-lo.

---

## Tirar o admin de mentira do vaideconfia.com

`https://vaideconfia.com/admin` publica o `prototipo/admin.html`.
Não pede senha. Mostra o trilho de fila, contas, empresas e
custos, com dados de exemplo. Qualquer pessoa que digitar o
endereço vê a ferramenta.

O Next já responde 404 em `/admin`. O arquivo estático é outro
site, na frente da Cloudflare, e não passa pelo `03-publica.sh`.

Recomendação: no host que serve `vaideconfia.com`, apagar
`admin.html` e o `assets/admin.js` que ele carrega, ou deixar de
publicar essa pasta. O protótipo pode continuar no repositório,
em `prototipo/`, como desenho da etapa 10. Não deve continuar
num endereço público.

Enquanto isso estiver no ar, não use aquele trilho para operar
nada. A porta real é só a do Next, no beta ou no `localhost`,
com `PAINEL_CAMINHO`, `admins` e 2FA.
