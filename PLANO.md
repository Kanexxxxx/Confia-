# confia? — Plano de construção em 10 etapas

**Este arquivo é o mapa.** Você não precisa lembrar de nada que está aqui.
Quando quiser saber onde estamos, abra este arquivo. Quando terminar uma
etapa, ela vira ✅.

**Regra das etapas:** cada uma termina com **alguma coisa funcionando que
você consegue ver**. Nada de "etapa concluída" sem prova na tela.

**Última atualização:** 22/08/2026

---

## Onde estamos agora

```
[✅] 1. Servidor blindado
[✅] 2. Banco de dados no ar
[✅] 3. TypeScript ligado no banco
[🔨] 4. Conta: cadastro, login, e-mail   <-- é aqui que estamos
[  ] 5. 2FA e painel trancado de verdade
[  ] 6. Site migrado para o Next
[  ] 7. No ar com HTTPS
[  ] 8. Motor de verificação
[  ] 9. Planos e pagamento
[  ] 10. Painel ligado e auditoria final
```

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

## Etapa 4 — Conta: cadastro, login, e-mail

**Objetivo:** dá para criar conta e entrar.

- [ ] Cadastro com crítica de senha
- [ ] Login com bloqueio por tentativas
- [ ] Sessão no banco, revogável (dá para derrubar sessão de longe)
- [ ] Confirmação de e-mail (Resend)
- [ ] Recuperação de senha
- [ ] Trocar senha e trocar e-mail
- [ ] Telas: entrar, criar conta, e-mail enviado, link expirado

**Prova:** você cria uma conta com seu e-mail de verdade, recebe o e-mail,
confirma e entra.

**Preciso de você:** ⚠️ **chave da API do Resend** e o domínio verificado lá
(SPF, DKIM, DMARC no DNS). Sem isso o e-mail cai em spam ou não sai.

---

## Etapa 5 — 2FA e painel trancado de verdade

**Objetivo:** o painel para de ser porta de banheiro.

- [ ] TOTP (Google Authenticator, Authy, 1Password) com QR Code
- [ ] Códigos de reserva — para você não se trancar fora se perder o celular
- [ ] Login de admin **recusado sem 2FA ativo**
- [ ] Conferência da tabela `admins` a cada requisição, no servidor
- [ ] Sessão de admin vence em 12 horas
- [ ] Apagar a tranca provisória (`assets/tranca.js`)

**Prova:** você entra no painel com senha + código do celular. Sem o código,
não entra — nem sabendo a senha.

**Preciso de você:** um app de autenticação no celular.

---

## Etapa 6 — Site migrado para o Next

**Objetivo:** as páginas que já existem viram aplicação.

- [ ] `index`, `planos`, `resultado`, `denunciar`, políticas → Next
- [ ] `registrar-loja` — **ainda não existe** e a home já aponta para ela
- [ ] Histórico de consultas
- [ ] **Hospedar fonte e ícone no seu servidor** (hoje o IP de cada visitante
      vai para o Google e para o jsDelivr — contradiz sua Política de Privacidade)
- [ ] Design continua exatamente o mesmo

**Prova:** o site parece igual, mas agora tem conta, histórico e dado real.

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

- [ ] Criar registro `A`: **`beta`** → `147.93.9.185`, com proxy
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

## Depois das 10

Extensão do navegador, aplicativo, documentação da API. Nenhuma delas faz
sentido antes do site funcionar.

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
| Site | Fonte e ícone vindos do Google e do jsDelivr — **o IP de cada visitante vai para eles**, contra o que sua política promete | ⚠️ resolve na Etapa 6 |
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
