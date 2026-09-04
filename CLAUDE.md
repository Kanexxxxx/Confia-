# confia? — leia isto antes de qualquer coisa
USE SKLLIS

Este arquivo existe por um motivo específico: **conversa nova começa do zero.**
O Claude não carrega nada do chat anterior. Só o que está escrito no repositório
sobrevive. Então o que estava só "na cabeça dele" foi escrito aqui.

Se você é uma sessão nova: leia esta página inteira antes de tocar em código.

---

## O que é

**confia?** — serviço brasileiro de verificação contra golpe. A pessoa chega com
um link, um CNPJ, um número de telefone ou um print, e o site responde se aquilo
tem cara de golpe. Vai ser apresentado no **Plano Empreenda SENAC** este ano.

Não é um projeto de estudo. É para ir ao ar e ter gente usando.

---

## Regras que não se discutem

### 1. O domínio raiz não é nosso

`confiia.com.br` (sem `beta.`) hospeda **a versão de outra pessoa** — um amigo
da dona do projeto. Palavras dela: *"nao apaga nada dele"*.

- O nosso endereço é **`beta.confiia.com.br`**, e só ele.
- Nunca mexa no registro `A` da raiz, nem no `www`.
- `servidor/03-publica.sh` **recusa rodar** se receber a raiz como argumento.
  Esse `exit 1` está lá de propósito. Não remova.

### 2. Segurança nível Pentágono

É o pedido literal. As 20 travas do checklist estão fechadas e documentadas em
`SEGURANCA.md`. Duas provas automáticas guardam isso:

```bash
cd web
npm run confere-banco     # RLS, permissões, gatilhos, cofre
npm run prova-armadilha   # a trava anti-robô, 9 casos
```

Se você mexer em banco, permissão ou formulário público, **rode as duas**.

### 3. Celular sempre

Toda tela, toda vez. Não é etapa final, é requisito de cada coisa que se escreve.

### 4. Comentário explicando o porquê

O código deste projeto é comentado pesado, em português, explicando **a razão** —
e principalmente o *"se você mexer aqui, tem que mexer ali também"*. Isso é
pedido da dona do projeto. Mantenha o tom: comentário que conta o motivo, não
comentário que repete o que a linha já diz.

### 5. Subir o site é a ÚLTIMA coisa

*"A última coisa que a gente vai fazer é subir o projeto no ar."* Tem muita
coisa para testar antes. Não faça deploy por iniciativa própria.

### 6. Não pode ter cara de IA

A crítica mais repetida, e a mais importante. Genérico, quadradinho, informação
empilhada, tudo centralizado, texto de marketing vazio — tudo isso já foi
apontado e recusado. Estética conta.

### 7. Não troque a fonte sem perguntar

Já foi trocada uma vez sem perguntar e teve que voltar. Hoje é **Inter**
(texto) + **Poppins** (título), via `--fonte-texto` / `--fonte-titulo`.

### 8. Sem foto de avatar

Decisão tomada. Não implemente upload de foto de perfil.

### 9. Textura de fundo foi testada e recusada

Guilhochê (aquelas linhas finas de cédula) chegou a existir, teve o erro de
emenda consertado, e mesmo assim: *"retire essas texturas"*. Não tente de novo
sem perguntar. A consequência está anotada em `globals.css`: **sem detalhe fino
atrás, o vidro tem pouco o que refratar** — não conserte isso aumentando o blur,
não é assim que vidro funciona.

---

## Onde está escrito o que

| Arquivo | O que tem dentro |
|---|---|
| **`RETOMAR-TUDO.md`** | **COMECE POR AQUI.** O guia único, escrito em 04/09/2026 quando a dona do projeto formatou o computador: o que está pronto, o que falta, as decisões travadas, as armadilhas e os comandos. Se você só for ler um arquivo, é este. |
| **`MELHORIAS.md` § II** | **A LISTA VIVA do código**, com o detalhe item a item que o guia acima resume. É a última rodada de crítica — onze etapas ditadas em 27/08/2026 — com o que falta e as nove decisões que dependem da dona do projeto. A § I é a rodada anterior, e o que sobrou nela em `[ ]` continua valendo. |
| `COMECAR-CHAT-NOVO.md` | O prompt que a dona do projeto cola ao abrir uma conversa nova. Se as regras mudarem, mudam lá também. |
| `PLANO.md` | As etapas do projeto, 1 a 10. Onde estamos e o que vem. |
| `PENDENCIAS.md` | O que depende de ação humana (MEI, advogado, chave do cofre). |
| `SEGURANCA.md` | As 20 travas, como cada uma foi fechada, e como conferir. |
| `ASAAS.md` | O pagamento (Etapa 9): como a chave é guardada sem vazar, sandbox × produção, e por que o webhook depende da Etapa 7. |
| **`PLANO-EMPREENDEDOR/`** | **A ENTREGA DO SENAC, com prazo externo: 09/09/2026, 21h.** Começa em **`AGORA.md`** (o que fazer hoje) e depois `00-MAPA.md`. Não é sobre o código — é o Portfólio de Evidências, o Pitch Deck e o vídeo. O diagnóstico honesto está lá: o projeto tem muita prova de execução e **nenhuma** prova de cliente, e as duas seções que mais pesam na avaliação (3.3 e 3.4) só se escrevem com dado de campo. |
| `web/AGENTS.md` | Regras do Next.js 16 neste repositório. |

**Ordem de leitura para retomar o trabalho:** `RETOMAR-TUDO.md` → `MELHORIAS.md`
§ II → `PLANO.md` → `PENDENCIAS.md`.

---

## Armadilhas técnicas já pagas com tempo

Cada uma destas custou horas. Estão aqui para não custarem de novo.

- **Next.js 16 usa `proxy.ts`, não `middleware.ts`.** O arquivo existe e é onde
  moram os cabeçalhos de segurança (CSP inclusive). Antes de escrever código de
  framework, leia `node_modules/next/dist/docs/` — é obrigação escrita em
  `web/AGENTS.md`.

- **lightningcss (o CSS do Turbopack) apaga pares de propriedade prefixada e sem
  prefixo, e mantém a ÚLTIMA.** Regra: **prefixada primeiro, padrão por último.**
  Ao contrário, seu `backdrop-filter` some sem aviso.

- **Vidro só parece vidro se tiver detalhe atrás para entortar.** Blur em cima
  de fundo já borrado não produz nada. O assassino do efeito era
  `.topbar::after` — uma cortina de `backdrop-filter` cobrindo o topo inteiro.
  Hoje ela só existe com `.is-scrolled`.

- **Qualquer ancestral com `filter`, `opacity<1`, `transform`, `will-change`,
  `contain`, `isolation` ou `backdrop-filter` vira raiz de backdrop** e corta o
  que o vidro consegue enxergar.

- **`text-align` desce por herança.** O desalinhamento geral que a dona do
  projeto apontou era um `.topo{text-align:center}` do herói escorrendo até
  dentro dos cartões de plano.

- **Não assine nada no navegador.** Já aconteceu: o honeypot gerava o HMAC no
  cliente, onde `COFRE_CHAVE` não existe — a trava virava falsificável. Por isso
  `armadilha.ts` tem `import 'server-only'` no topo: se alguém repetir o erro,
  **o build quebra** em vez de passar. O carimbo nasce no componente de servidor
  e desce como prop.

- **Gatilho de banco roda com a autoridade de quem chamou.** Depois de ligar RLS,
  a denúncia parou de entrar: quatro gatilhos escrevem em tabelas que o
  `confia_app` não alcança. Migração `016` os tornou `SECURITY DEFINER`.
  **Lição:** ler o código do app mede menos do que o banco realmente faz.

- **Heredoc de Python destrói `\n` dentro de template literal de JS.** Já mordeu
  duas vezes. Use a ferramenta de edição, não heredoc, quando houver `\n`.

---

## Como rodar

```bash
cd web
npm run tunel   # túnel SSH para o Postgres (porta 5433) — precisa estar aberto
npm run dev     # http://localhost:3000  e  http://192.168.1.100:3000 (celular)
```

Conta de teste que já existe no banco:

```
e-mail : voce@confiia.com.br
senha  : testando-o-confia-2026
2FA    : desligado
```

⚠ Se der `ECONNREFUSED 127.0.0.1:5433`, o túnel caiu. Reabra.
⚠ Se o dev server disser "porta 3000 em uso", provavelmente já tem um rodando —
confira antes de matar o processo.

---

## Honestidade é característica do produto, não acidente

Isto foi decidido de propósito, várias vezes, e deve continuar:

- `/resultado` mostra faixa vermelha dizendo que é demonstração — o motor de
  verificação **não existe ainda** (Etapa 8).
- Embaixo do verificador, na home: *"O confia? pode errar. Confira sempre os
  motivos."* Este é o mais importante dos três — fica onde a pessoa decide.
- Loja cadastrada entra sempre como `em_analise`, nunca aprovada sozinha.

⚠ **Dois avisos saíram em 27/08/2026, por decisão da dona do projeto**, e é
importante saber o que segura a honestidade no lugar de cada um:

- **O aviso de "a cobrança ainda não existe" em `/planos`.** Saiu porque o Asaas
  chegou. Quem segura agora é o **texto do botão**: "Criar minha conta grátis",
  indo para `/criar-conta`. Enquanto o pagamento não estiver ligado dentro do
  site, esse texto **não vira "Assinar"** — se virar, o aviso volta. A regra
  inteira está no topo de `web/src/app/planos/page.tsx`.
- **A ressalva de beta no bloco "Por que existimos".** Saiu da home, mas o "a
  gente pode errar" continua colado no verificador, que é onde ele importa.

Um site anti-golpe que promete o que não entrega é o próprio problema que ele diz
combater. Se for escrever texto novo, escreva com esse padrão.
