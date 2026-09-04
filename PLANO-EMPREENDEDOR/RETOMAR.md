# Retomar num computador novo — cole isto na primeira mensagem

Você vai continuar em outro notebook. **Nada do chat viaja junto** — só o que está
escrito no repositório sobrevive. Por isso este arquivo existe.

---

## Passo 1 · Baixar o projeto

```bash
git clone https://github.com/Kanexxxxx/confia-minimundo.git
cd confia-minimundo
```

## Passo 2 · Abrir uma conversa nova dentro da pasta e colar isto

```
Estou retomando a entrega do Plano Empreendedor do Empreenda Senac para o meu
projeto confia? — um serviço brasileiro de verificação antigolpe.

PRAZO EXTERNO E INEGOCIÁVEL: 09/09/2026, às 21h.

Você não participou das conversas anteriores. Antes de escrever qualquer coisa,
leia NESTA ORDEM:

1. PLANO-EMPREENDEDOR/AGORA.md          — o que falta fazer, dia a dia. Comece aqui.
2. PLANO-EMPREENDEDOR/00-MAPA.md        — prazo, o que desclassifica, o que trava
3. PLANO-EMPREENDEDOR/04-RESULTADOS.md  — os números que eu coletei em campo
4. PLANO-EMPREENDEDOR/05-PORTFOLIO-RASCUNHO.md — o texto, 7 das 10 seções prontas
5. CLAUDE.md                            — as regras do projeto que não se discutem

Depois de ler, me diga em poucas linhas: o que já está pronto, o que falta, e o
que você faria agora. Não comece a escrever antes disso.

CONTEXTO QUE NÃO ESTÁ ÓBVIO NOS ARQUIVOS:

- Equipe de UMA pessoa: Kainã Rodrigues Pinto. Cursos Técnicos, Senac Ribeirão
  Preto, Técnico em Desenvolvimento de Sistemas. Código da equipe: VPQ2TCB.
- A entrega é UM PDF só (Portfólio + Pitch Deck, nessa ordem, até 20 MB) mais um
  link de vídeo público de no máximo 1 minuto.
- O que desclassifica está listado em 00-MAPA.md. Confira antes de qualquer coisa.
- O Pitch Deck tem que ser A4 PAISAGEM, não 16:9. Isso desclassifica.
- O Portfólio tem que estar em Arial ou Calibri, tamanho 12 ou maior.
- NADA de link nem QR Code dentro do PDF: os avaliadores ignoram por regra.

TRÊS REGRAS QUE EU NÃO QUERO REPETIR:

- NÃO INVENTE DADO DE VALIDAÇÃO. Os números vêm de 04-RESULTADOS.md e de mais
  lugar nenhum. Se faltar número, escreva que faltou. Um projeto antigolpe que
  falseia evidência é o próprio problema que ele diz combater.
- Não prometa que o motor de verificação funciona. Ele ainda não existe (Etapa 8
  do PLANO.md), e a tela /resultado diz que é demonstração. Isso é honestidade
  proposital do produto, não uma falha a esconder.
- Não pode ter cara de texto de IA: genérico, tudo centralizado, marketing vazio.
  Já recusei isso várias vezes.

Use skills.
```

---

## Passo 3 · O que já está pronto e o que não está

| | |
|---|---|
| ✅ Seções 0, 2, 5, 6, 7, 8, 9 do Portfólio | escritas, em `05-PORTFOLIO-RASCUNHO.md` |
| ✅ Mercado com fonte e período | GASA, Febraban, ABIACOM — apêndice do mesmo arquivo |
| ✅ Financeiro com tabela mês a mês | SOM de 300 assinantes em 12 meses |
| ✅ Roteiro do vídeo de 55s | `03-VIDEO.md` |
| ✅ Script do formulário | `07-FORMULARIO.md` |
| ✅ Instrumentos de campo | `02-COLETA-DE-CAMPO.md` |
| 🔴 Seções 1, 3 e 4 | dependem dos números de campo |
| 🔴 Pitch Deck | 12 slides, ainda não feito |

---

## Passo 4 · Rodar o site, se precisar de print

```bash
cd web
npm install
npm run tunel   # túnel do Postgres na porta 5433 — precisa ficar aberto
npm run dev     # http://localhost:3000
```

⚠ Se der `ECONNREFUSED 127.0.0.1:5433`, o túnel caiu. Reabra.

⚠ **O `.env.local` não vem no Git**, de propósito — ele tem senha de banco e chave
de cofre. No computador novo o site não sobe sem ele. Para só tirar print das
telas, isso não é problema: as páginas estáticas abrem. Para logar, você precisa
copiar o `.env.local` do notebook antigo por pendrive ou gerenciador de senha.
**Nunca por chat, por e-mail nem por WhatsApp.**

---

## Passo 5 · Onde as coisas ficam

```
PLANO-EMPREENDEDOR/
├── AGORA.md                     ← abra este primeiro
├── 00-MAPA.md                   prazo, o que desclassifica, calendário
├── 01-EVIDENCIAS-DO-REPOSITORIO.md   o que o projeto já prova
├── 02-COLETA-DE-CAMPO.md        perguntas das conversas e dos testes
├── 03-VIDEO.md                  roteiro dos 55 segundos
├── 04-RESULTADOS.md             ← os números de campo caem aqui
├── 05-PORTFOLIO-RASCUNHO.md     o texto do Portfólio
├── 06-PRINTS-E-PROVAS.md        prints de golpe: onde entram e como tarjar
├── 07-FORMULARIO.md             script do Google Forms + visual da marca
└── RETOMAR.md                   este arquivo
```
