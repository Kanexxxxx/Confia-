# confia? — Asaas, o pagamento

**Aberto em:** 27/08/2026
**Etapa:** 9 do [PLANO.md](PLANO.md)
**Situação:** chave de **produção** ligada, Pix confirmado funcionando por teste
real. O código que cobra dentro do site ainda não existe.

Este arquivo é o mapa do pagamento. Ele existe porque conversa nova começa do
zero, e porque dinheiro é a parte do projeto onde errar custa mais do que tempo.

---

## Antes de tudo: como você me passa a chave

**Nunca cole a chave do Asaas numa conversa comigo.** Nem aqui, nem em nenhum
chat. Chave colada em conversa vira texto guardado em servidor que não é seu, e
não tem como desapagar depois.

Também não vale escrever ela num comando do terminal (`ASAAS_API_KEY=... npm
...`): o terminal guarda histórico, em texto puro, para sempre.

O jeito certo já está pronto:

```bash
cd web
npm run asaas-chave
```

Ele pede a chave com o **teclado mudo** — o terminal não mostra nada enquanto
você digita, nem asterisco. A chave vai direto para `web/.env.local`, que o Git
ignora. Ela não passa por mim, não aparece na tela e não entra no histórico.

Os outros usos:

```bash
npm run asaas-chave -- --conferir     # o que está guardado (mostra só o fim da chave)
npm run asaas-chave -- --producao     # grava a chave de PRODUÇÃO (exige escrever isso)
npm run asaas-chave -- --apagar       # remove
```

Depois de gravar, **reinicie o `npm run dev`** — ele lê o `.env.local` só na
partida.

---

## ⚠ Estamos rodando em PRODUÇÃO, de propósito

**Decisão da dona do projeto em 27/08/2026.** Ela não tem conta de sandbox e
preferiu testar na conta real, cobrando a si mesma. O plano já previa isso —
[PLANO.md](PLANO.md), Etapa 9: *"você assina o Básico com Pix, no seu próprio
cartão"*.

O que isso significa na prática:

- o dinheiro sai dela e volta para ela, **menos a taxa do Asaas**;
- a cobrança de teste é uma cobrança **real**, e aparece no extrato;
- a conta **já tinha 9 clientes de verdade** quando começamos. Teste ali não é
  numa base vazia.

Por isso todo teste passa por `npm run asaas-teste`, que é construído em cima de
uma ideia só: **teste tem que ser reconhecível e reversível.** Ver a seção
"Testar cobrança" mais abaixo.

> A sandbox continua sendo o lugar certo para o volume de testes da Etapa 9 —
> é grátis, é conta separada em `sandbox.asaas.com`, e não suja a base real.
> Quando der, vale criar.

---

## A taxa de R$ 1,99 por Pix — e o que ela faz com os planos

Medido no teste real de 27/08/2026, não estimado:

| | |
|---|---|
| Valor cobrado | R$ 5,00 |
| **Valor recebido** | **R$ 3,01** |
| Taxa do Asaas | R$ 1,99 |

**Não havia nada de "a mais".** Desconto, multa e juros estavam zerados, e todos
os canais de notificação do cliente (e-mail, SMS, WhatsApp e voz) estavam
**desligados** — conferido em `GET /customers/{id}/notifications`. Os R$ 1,99
são a taxa de recebimento de Pix, pura.

### O problema: a taxa é FIXA, não percentual

Isso muda tudo quando o valor é baixo. Por assinante, por ano:

| Plano | Bruto | Taxas | Líquido | Perdido |
|---|---|---|---|---|
| Básico **mensal** (12× R$ 12,90) | R$ 154,80 | R$ 23,88 | R$ 130,92 | **15,4%** |
| Básico **anual** (1× R$ 99,00) | R$ 99,00 | R$ 1,99 | R$ 97,01 | 2,0% |
| Premium **mensal** (12× R$ 24,90) | R$ 298,80 | R$ 23,88 | R$ 274,92 | 8,0% |
| Premium **anual** (1× R$ 198,96) | R$ 198,96 | R$ 1,99 | R$ 196,97 | 1,0% |

Ou seja: **o plano mais barato é o que mais sofre.** Um assinante do Básico
mensal deixa quase um sexto do que paga na taxa — e a taxa é a mesma que um
Premium anual paga uma vez só no ano inteiro.

### O que fazer com isso — decisões suas

- **Empurrar o anual** deixa de ser só desconto para o cliente: é a diferença
  entre perder 15,4% e perder 2%. Vale dar um desconto maior no anual do que o
  de hoje e ainda assim ganhar mais.
- **Conferir se o Asaas tem plano com taxa menor.** Eles têm planos pagos com
  tarifa de Pix reduzida ou zerada. Com volume, a conta pode virar.
- **Cobrança avulsa barata está fora** de qualquer jeito — ver o piso abaixo.

⚠ Isto é conta de **hoje**, com a tarifa de hoje, e a tarifa do Asaas muda.
Refaça a conta antes de fechar preço.

---

## O piso de R$ 5,00 — descoberto na marra

O Asaas **recusa qualquer cobrança abaixo de R$ 5,00**:

```
HTTP 400 — O valor da cobrança (R$ 1,00) menos o valor do desconto (R$ 0,00)
           não pode ser menor que R$ 5,00.
```

Isso não é detalhe de teste, é **restrição de produto**: qualquer ideia de
cobrança avulsa barata (uma verificação solta por R$ 1,99, por exemplo) não
existe nesta plataforma.

Os planos de hoje passam com folga:

| Plano | Mensal | No anual (por mês) | Passa? |
|---|---|---|---|
| Grátis | — | — | não cobra |
| Básico | R$ 12,90 | R$ 8,25 | ✅ |
| Premium | R$ 24,90 | R$ 16,58 | ✅ |
| Empresa | sob consulta | — | ✅ |

---

## Os dois mundos, e por que confundir sai caro

O Asaas tem dois ambientes separados, cada um com sua chave e seu endereço:

| | Chave começa com | Endereço | O dinheiro |
|---|---|---|---|
| **Sandbox** | `$aact_hmlg_` | `https://api-sandbox.asaas.com/v3` | é de mentira |
| **Produção** | `$aact_prod_` | `https://api.asaas.com/v3` | é de verdade |

Fonte: [docs.asaas.com/docs/authentication](https://docs.asaas.com/docs/authentication)

**Neste projeto a decisão foi produção** (ver a seção acima). Isso torna as
travas abaixo mais importantes, não menos: com a chave de produção guardada,
qualquer código que chame o Asaas mexe com dinheiro de verdade, e não existe
mais a rede de proteção de "é só sandbox".

Três coisas protegem contra a troca acidental de ambiente:

1. `npm run asaas-chave` **recusa** gravar chave de produção sem você escrever
   `--producao` à mão;
2. o **ambiente é deduzido do prefixo da chave**, nunca de uma variável separada
   — duas variáveis podem discordar uma da outra, e o erro só apareceria na hora
   de cobrar (ver `web/src/lib/asaas.ts`);
3. `npm run prova-asaas` diz na cara qual dos dois mundos está ligado.

---

## Conferir se a chave funciona

```bash
cd web
npm run prova-asaas
```

Ela responde, em ordem:

```
  ok    a chave existe                         $aact_hmlg_…ABCD
  ok    o prefixo é reconhecido                SANDBOX
  ok    o endereço bate com o prefixo          https://api-sandbox.asaas.com/v3
  ok    o Asaas aceita a chave                 HTTP 200
  ok    dá para ler dados da conta             0 cliente(s) cadastrado(s)
```

**Esta prova só lê.** Ela chama `GET /customers?limit=1` — não cria cliente, não
cria cobrança, não apaga nada. Dá para rodar quantas vezes quiser, inclusive com
a chave de produção.

Isso é escolha de projeto: uma prova que "cria uma cobrança de teste" seria mais
convincente e muito pior de rodar sem pensar.

### Se der 401

Quase sempre não é a chave estar errada — é ela estar **no mundo errado**. Chave
de sandbox contra o endereço de produção devolve 401, e o 401 faz todo mundo
achar que a chave é inválida. A prova já diz qual ambiente ela leu; confira se é
o que você esperava.

A outra causa é a chave ter sido regerada no painel do Asaas. Regerar invalida a
anterior na hora.

---

## Testar cobrança de verdade

```bash
cd web
npm run asaas-teste -- --quem       # acha você entre os clientes da conta
npm run asaas-teste -- --cobrar --cliente=<id>
npm run asaas-teste -- --situacao   # foi pago?
npm run asaas-teste -- --limpar     # apaga as cobrancas de teste
```

### As seis travas, em português claro

Elas existem para **um erro de quem programa não virar prejuízo de quem paga**.

| A trava | O que ela impede na prática |
|---|---|
| Teto de R$ 10 | Digitar `500` sem querer e cobrar R$ 500 de alguém |
| Digitar `COBRAR` | O script rodar sozinho e cobrar por acidente |
| Marca `TESTE-CONFIA` | Cobrança de teste se misturar com venda de verdade no extrato |
| `--limpar` só vê o que tem a marca | Apagar sem querer cobrança de cliente real |
| Não apaga cobrança paga | Sumir com registro de dinheiro que já entrou (apagar ≠ devolver) |
| Não cria cliente novo | Encher a base de "Cliente Teste 1, 2, 3" |

### E as mesmas seis, com o detalhe técnico

1. **Teto de R$ 10,00.** Um erro de digitação não vira cobrança de R$ 500. O
   padrão é R$ 5,00 — o menor que a plataforma aceita.
2. **Confirmação escrita à mão.** É preciso digitar `COBRAR`. Rodar sem querer
   não cobra ninguém.
3. **Toda cobrança nasce marcada** com `externalReference` começando em
   `TESTE-CONFIA`, e a descrição diz `TESTE` em maiúscula — se aparecer num
   extrato ou numa nota, tem que ser óbvio que não foi venda.
4. **`--limpar` só enxerga o que tem essa marca.** Os clientes e cobranças que
   já existiam na conta são invisíveis para ele.
5. **`--limpar` se recusa a apagar cobrança paga.** A documentação do Asaas
   avisa: exclusão não é estorno. Paga, o caminho é reembolso, e é decisão de
   gente.
6. **Nenhum cliente novo é criado.** O script reaproveita o que já existe, para
   não encher uma base real de cliente de teste.

⚠ O QR Code é salvo em `web/pix-teste-<id>.png` e **está no `.gitignore`**. É um
código de pagamento real: quem tiver a imagem, paga.

### O que este teste já provou (27/08/2026)

| | |
|---|---|
| A chave de produção responde | ✅ HTTP 200 |
| **O Pix está ativado na conta** | ✅ o QR Code voltou |
| Criar cobrança funciona | ✅ `pay_txwi7w3wvjj19mgz`, R$ 5,00 |
| **O Pix foi pago de verdade** | ✅ situação virou `RECEIVED` |
| Detectar o pagamento por consulta | ✅ `--situacao`, sem webhook nenhum |
| Apagar cobrança não paga | ✅ `--limpar` |

### O ciclo inteiro está provado

```
criar cobrança → gerar o Pix → a pessoa paga → o sistema detecta
```

**Isso destrava a Etapa 9 antes da Etapa 7.** A dúvida era se dava para
construir o pagamento sem endereço público para o webhook. Dá: perguntando ao
Asaas em vez de esperar o aviso dele.

Para produção o webhook continua sendo o certo — consulta gasta chamada e tem
atraso. Mas a construção inteira pode acontecer agora, e o webhook entra como
troca de peça no fim, não como pré-requisito.

---

## O que já existe e o que não existe

### Existe

| O quê | Onde |
|---|---|
| Guardar a chave sem vazar | `web/scripts/asaas-chave.mjs` |
| Provar que a chave funciona | `web/scripts/prova-asaas.mjs` |
| Testar cobrança real, com seis travas | `web/scripts/asaas-teste.mjs` |
| A porta única de saída para o Asaas | `web/src/lib/asaas.ts` |
| As variáveis declaradas | `web/src/lib/env.ts` (`ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`) |
| Os 4 planos, semeados no banco | migração `002` |
| A página `/planos` | `web/src/app/planos/` |

### Não existe

- **Criar cobrança.** Nenhuma linha do site cobra alguém hoje.
- **Checkout.** O botão de assinar leva para `/criar-conta`.
- **Webhook.** Ver a seção abaixo — ele está travado por outra etapa.
- **Limite de plano valendo.** O contador de verificações depende da Etapa 8.

⚠ **A regra que ficou valendo em 27/08/2026:** o aviso "a cobrança ainda não
existe" saiu de `/planos` a pedido da dona do projeto, porque o Asaas está
chegando. Quem segura a honestidade da página agora é o **texto do botão** —
"Criar minha conta grátis", indo para `/criar-conta`, que é exatamente o que ele
faz. **Enquanto o Asaas não estiver ligado, esse texto não pode virar
"Assinar".** Se ele mudar antes, o aviso tem que voltar. Está escrito também no
topo de `web/src/app/planos/page.tsx`.

---

## O webhook está travado pela Etapa 7

O webhook é como o Asaas avisa que um pagamento caiu. Sem ele, o site nunca
descobre que alguém pagou — Pix e boleto não confirmam na hora do clique.

**E ele precisa de um endereço público na internet.** O Asaas chama a gente, não
o contrário. `localhost:3000` não serve: o Asaas não alcança sua máquina.

Ou seja: **o webhook só pode ser testado depois de `beta.confiia.com.br` estar
no ar**, que é a Etapa 7. Isso não é um detalhe de ordem — é o que decide o que
dá para construir agora e o que não dá.

O que **dá** para fazer antes do beta subir:

- criar cliente no Asaas (`POST /customers`);
- criar cobrança (`POST /payments`) e ver o link de pagamento;
- pagar no sandbox e conferir o resultado **consultando** a cobrança
  (`GET /payments/{id}`), em vez de esperar o aviso.

Consultar funciona e não depende de endereço público. É mais lento e não serve
para produção, mas destrava a construção inteira antes do deploy.

⚠ Quando o webhook entrar, ele **precisa** conferir o `ASAAS_WEBHOOK_TOKEN`. Uma
rota de webhook sem conferência de origem é qualquer pessoa da internet podendo
dizer "fulano pagou".

---

## Decisões de segurança que já estão no código

**`import 'server-only'` no topo de `asaas.ts`.** Se alguém importar esse arquivo
num componente de cliente, o build **quebra** em vez de publicar a chave dentro
do JavaScript que todo visitante baixa. É a mesma trava de `armadilha.ts`, e ela
está lá porque neste projeto já escorregou segredo para o navegador uma vez.

**Nunca prefixar com `NEXT_PUBLIC_`.** O prefixo é literalmente o que publica.

**A chave não entra em mensagem de erro.** Erro vira log, log vira backup, e a
chave não pode ir junto. `chamaAsaas()` monta a mensagem a partir do que o Asaas
respondeu, nunca do que a gente mandou.

**Tempo limite de 15s em toda chamada.** A VPS tem 1 núcleo: uma chamada travada
segura uma requisição do site inteiro.

**O cabeçalho é `access_token`, não `Authorization: Bearer`.** O Asaas não usa o
padrão Bearer. Trocar isso dá 401 com mensagem que não explica nada.

**O `User-Agent` é obrigatório** para contas criadas depois de 13/06/2024 — a
nossa é de 2026. Sem ele o Asaas recusa, e a mensagem não diz que o problema é
esse.

---

## Ordem do trabalho, quando for construir

1. **Sandbox de pé** — `npm run prova-asaas` passando. ← *é aqui que a gente está*
2. **Cliente** — criar o cliente do Asaas quando a pessoa assina, guardando o
   `customerId` na conta. Sem CPF/CNPJ obrigatório enquanto der.
3. **Cobrança** — criar a cobrança e mostrar o link. Pix primeiro: converte muito
   mais que cartão no Brasil.
4. **Conferência por consulta** — enquanto não há webhook, o site pergunta ao
   Asaas se a cobrança foi paga.
5. **Etapa 7 sobe o beta** — e só aí:
6. **Webhook** — com conferência do token, e trocando a consulta pelo aviso.
7. **Limite do plano valendo** — depende da Etapa 8 existir.
8. **Cancelamento e reembolso** — a regra tem que bater com `/reembolso`, que
   hoje está com prazos errados (§ II, etapa 11).

⚠ Só o passo 1 está feito.

---

## O que ainda depende de você

Isto sai daqui e vai para o [PENDENCIAS.md](PENDENCIAS.md) quando for resolvido.

- [ ] **Conta do Asaas aprovada** — leva alguns dias, pede documento antes.
- [ ] **Pix ativado** na conta.
- [ ] **Emissão de nota fiscal** — definir se o Asaas emite.
- [ ] **CNPJ.** Sem empresa, a conta do Asaas é pessoa física, e o dinheiro cai
      no seu CPF com a tributação que vem junto. Isso é o item 2 do
      `PENDENCIAS.md`.
- [ ] **Webhook apontado** para `beta.confiia.com.br/api/asaas/webhook` — só
      depois da Etapa 7.
- [ ] **Decidir o `ASAAS_WEBHOOK_TOKEN`** e gravar do mesmo jeito da chave.

---

## Comandos, resumidos

```bash
cd web

npm run asaas-chave                 # grava a chave de sandbox (teclado mudo)
npm run asaas-chave -- --producao   # grava a de produção (exige escrever isso)
npm run asaas-chave -- --conferir   # qual está guardada, e de qual mundo
npm run asaas-chave -- --apagar     # remove

npm run prova-asaas                 # a chave funciona? (só lê, não cobra)
```
