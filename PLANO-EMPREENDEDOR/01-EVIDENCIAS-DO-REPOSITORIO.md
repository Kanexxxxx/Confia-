# O que o projeto já prova — inventário para o Portfólio

**Levantado em 03/09/2026**, direto do repositório. Cada linha aqui tem origem
verificável num arquivo, não em lembrança de conversa.

> **Para que serve este arquivo.** O Portfólio de Evidências é, nas palavras do
> roteiro, *"o bastidor do seu negócio"*. Você tem quatro meses de bastidor
> guardados em `PLANO.md`, `MELHORIAS.md` e `SEGURANCA.md` — só que escritos como
> documentação técnica, não como evidência de avaliação. Este arquivo faz a
> tradução, uma vez, para o Portfólio não ter que procurar de novo.

⚠ **O que este arquivo NÃO é.** Nada aqui vale como validação de cliente. Prova de
execução responde *"vocês conseguem construir?"*. As seções 3.3 e 3.4 perguntam
outra coisa: *"alguém quer isso, e paga?"*. Essa resposta só vem de campo.

---

## O ativo que quase nenhuma equipe tem

O roteiro lista seis tipos de protótipo aceitos (Tabela 13). O mais simples é
*"desenho à mão"*; o mais completo, *"telas clicáveis (Figma, Canva)"*.

**Você não tem protótipo. Você tem o produto rodando** — 22 páginas em Next.js,
ligadas a um PostgreSQL com 18 migrações, com login, 2FA e cobrança por Pix que
já recebeu dinheiro de verdade.

Isso muda duas coisas na entrega:

1. **O teste da seção 3.4 é de software real, não de maquete.** Onde as outras
   equipes escrevem "o usuário achou o fluxo confuso no papel", você escreve o que
   a pessoa fez com o produto na mão.
2. **O Slide 4 (Produto) e o Slide 8 (Validação) ficam fáceis de encher** — com
   print de tela de verdade.

⚠ **E é onde mora o risco de o Portfólio virar relatório técnico.** O avaliador não
está julgando arquitetura de software; está julgando se o negócio foi validado com
gente. Regra para escrever: **cada dado técnico só entra se responder a uma
pergunta de negócio.** "43 tabelas" não diz nada. "A denúncia entra com protocolo
e o dado da vítima é cifrado, porque quem já caiu num golpe não vai relatar num
formulário que ele não confia" — isso diz.

---

## Seção 2 · Planejamento da Ideia — 🟢 dá para escrever hoje

As quatro dimensões do roteiro (Tabela 7) já estão decididas dentro do produto.
Não são hipótese nova: são o que o site faz.

| Dimensão | O que dá para afirmar, e de onde sai |
|---|---|
| **CLIENTE** | A página `/planos` já separa três públicos por frase, não por recurso: *"chegou um link e eu só quero tirar essa dúvida"*, *"eu compro bastante pela internet e recebo link o dia todo"*, *"eu cuido de alguém que não entende de internet"* (`planos/cartoes.tsx`, campo `euSou`) |
| **PROBLEMA** | A nuvem da home tem seis situações reais de entrada: link no WhatsApp, loja desconhecida, perfil que chamou, preço bom demais, prêmio não disputado, site com letra trocada (`_portado/Home.tsx`) |
| **SOLUÇÃO** | Verificação de link, perfil, CNPJ, telefone e print, **com o motivo de cada conclusão** |
| **MONETIZAÇÃO** | Assinatura em quatro faixas, já precificada e semeada no banco |

⚠ **A terceira frase do `euSou` é a mais forte das três, e a documentação nunca
tratou ela como descoberta.** *"Eu cuido de alguém que não entende de internet"*
não é o usuário: é o **filho, a filha, o neto** que paga para proteger outra
pessoa. Quem usa é diferente de quem paga — e o roteiro tem uma seção inteira só
sobre isso (3.2, "Atenção: quem usa é diferente de quem paga?"), que exige tabela
de dimensões, frase-chave e metodologia **para cada um dos dois públicos**.

→ Isso precisa aparecer no Portfólio de propósito, não por acaso. É um dos poucos
lugares onde dá para mostrar maturidade de modelo de negócio sem inventar nada.

### A frase-chave, no modelo que o roteiro pede

O modelo é: *"Quando [CLIENTE] [SITUAÇÃO], ele quer [OBJETIVO], mas [PROBLEMA],
então busca [SOLUÇÃO]."* Um rascunho que sai só do que já existe:

> *"Quando alguém recebe um link de oferta no WhatsApp, quer aproveitar sem correr
> risco, mas não sabe distinguir loja real de site clonado em trinta segundos —
> então busca uma segunda opinião que explique o motivo, e não só diga sim ou não."*

⚠ Está marcada como rascunho de propósito. **A frase-chave definitiva se escreve
depois das 15 conversas**, porque a situação e o objetivo são exatamente o que as
conversas revelam. Escrever agora e não mexer depois é o erro que o roteiro chama
de "lista de intenções".

---

## Seção 4 · Testando a Solução — 🟡 metade pronta

A parte de **"o que existe para testar"** está pronta. A parte de **"quem testou e
o que descobriu"** é 100% campo.

O que dá para mostrar como protótipo, hoje, com print:

| Tela | Rota | Serve para mostrar |
|---|---|---|
| Home com o verificador | `/` | O fluxo de entrada — cola e pergunta |
| Resultado | `/resultado` | Como a resposta aparece **com os motivos** |
| Denunciar | `/denunciar` | Protocolo gerado, e o prazo de 80 dias do MED |
| Registrar loja | `/registrar-loja` | O outro lado do marketplace |
| Planos | `/planos` | O modelo de receita, já com preço na tela |
| Conta e segurança | `/conta/seguranca` | 2FA — que é confiança, não enfeite |

⚠ **`/resultado` mostra faixa vermelha dizendo que é demonstração**, porque o motor
de verificação ainda não existe (Etapa 8 do `PLANO.md`).

**Isso vai no Portfólio, escrito por você, antes que o avaliador descubra sozinho.**
Duas razões, e a segunda é a que importa: primeiro, o roteiro premia honestidade
("seja honesto" aparece em três seções); segundo, **é a mesma decisão de produto
que o site inteiro toma** — o aviso *"O confia? pode errar. Confira sempre os
motivos"* está embaixo do verificador, no lugar onde a pessoa decide. Um serviço
antigolpe que esconde a própria limitação está fazendo o que os golpistas fazem.
Dito assim, a limitação vira argumento.

---

## Seção 7 · Projeção Financeira — 🟢 os custos são reais, não estimados

Isto é raro numa entrega de Empreenda: a maioria das projeções é preço pesquisado
na internet. **Os seus são de contas contratadas.** Fonte: `PENDENCIAS.md`.

| Item | Valor | De onde vem |
|---|---|---|
| VPS Hostinger | R$ 40 – 120/mês | Já contratada e rodando |
| Domínio `.com.br` | ~R$ 40/ano | Já registrado |
| Resend (e-mail) | Grátis até 3.000/mês | Já em uso |
| OpenAI + Hive | ~R$ 30/mês a 500 verificações | Preço de tabela por uso |
| Asaas | % por transação | **Já recebeu R$ 5,00 de verdade** |
| **Custo fixo total** | **R$ 60 – 150/mês** | |

⚠ **Esta tabela é o que o `PENDENCIAS.md` diz, e ela está desatualizada num ponto.**
Ela não inclui o **DAS do MEI (~R$ 76/mês)**, que só existe depois de formalizar.
Com ele, o custo fixo vai para **R$ 120 – 200**. O número corrigido está na seção 7
de [`05-PORTFOLIO-RASCUNHO.md`](05-PORTFOLIO-RASCUNHO.md) — **use aquele**, não este.

**O ponto de equilíbrio já está calculado no repositório**, e é a frase mais forte
que o financeiro tem:

> *"Com 10 assinantes do Básico (R$ 12,90) o custo fixo já está pago."*

⚠ **Com o MEI, viram 13.** A frase continua sendo a mais forte do financeiro, mas
o número mudou. Portfólio e Pitch precisam bater entre si — se um disser 10 e o
outro 13, o avaliador acha, e é o tipo de erro que derruba a credibilidade da
seção inteira.

Preço de venda R$ 12,90; custo variável por verificação ~R$ 0,06 por imagem. Com
custo fixo de R$ 129/mês (meio da faixa), o cálculo do roteiro fecha em torno de
**10 a 11 assinantes/mês para empatar** — número baixo, verificável e defensável.

⚠ **O que falta aqui é só o seu SOM.** Ponto de equilíbrio em 10 assinantes só vira
projeção se houver uma meta de quantos assinantes em 12 meses. Esse número é
decisão sua (item 5 de "O que trava").

⚠ **Cuidado com o custo variável.** Ele não é fixo por assinante: quem manda 5
imagens/mês custa ~R$ 0,30; quem só cola link custa quase nada. O Premium, com 150
verificações e 40 imagens, é o que aperta a margem. Vale uma linha no Portfólio —
mostra que a conta foi pensada, não copiada.

---

## Seção 8 · Próximos Passos — 🟢 já existe, e chama `PLANO.md`

O roteiro pede *"roadmap de 6-12 meses com marcos concretos"* e avisa que o erro
fatal é *"lista genérica tipo crescer ou expandir"*.

**As etapas 7 a 10 do `PLANO.md` são exatamente esse roadmap**, e são o oposto de
genéricas — cada uma termina com uma prova na tela:

| Etapa | O marco | A prova que a etapa exige |
|---|---|---|
| 7 | No ar com HTTPS | Abrir `beta.confiia.com.br` no celular e ver o cadeado |
| 8 | Motor de verificação | Colar um link e receber a resposta com os motivos |
| 9 | Planos e pagamento | Assinar o Básico com Pix e ver o limite mudar |
| 10 | Painel e auditoria final | Relatório item por item do que passou e do que não passou |

E o **próximo passo imediato** que o roteiro pede ("o que a equipe faria amanhã")
já está escrito e é específico: **as chaves da OpenAI, Hive e Google Safe Browsing,
com os contratos de proteção de dados (DPA) assinados antes do primeiro usuário
real** — `PENDENCIAS.md`, item 1.

⚠ Note o que isso mostra sem precisar dizer: a equipe sabe que tratar print de
vítima em servidor nos Estados Unidos sem DPA é descumprir a LGPD, e **parou o
roadmap por causa disso**. É maturidade demonstrada, não declarada.

### Os desafios, que o roteiro também pede — e que já estão anotados

O roteiro pede honestidade sobre o que pode dar errado. Não precisa inventar:

- **Custo de IA por verificação sobe com o uso.** Já existe teto de R$ 70 previsto
  na Etapa 8, travando antes de gastar
- **Falso positivo tem custo real** — reprovar loja honesta é prejuízo de terceiro.
  Por isso loja cadastrada entra como `em_analise`, nunca aprovada sozinha
- **Revisão jurídica dos três documentos legais** ainda não aconteceu
  (`PENDENCIAS.md`, item 4)

---

## Seção 9 · Impacto — 🟢 dois ODS com ligação genuína

O erro fatal é *"forçar conexão com ODS que não existe"*. Dois se sustentam sem
esforço, e um terceiro é tentação a evitar.

**ODS 16 — Paz, Justiça e Instituições Eficazes.** É o encaixe direto: estelionato
digital é crime, e o produto reduz a chance de a pessoa cair nele. A denúncia é
anônima por padrão e gera protocolo (`CT-2026-000001`) — dá rastro a um crime que
quase nunca é denunciado, porque a vítima tem vergonha.

**ODS 10 — Redução das Desigualdades.** Este não é discurso, é decisão de código
tomada meses atrás e escrita no `PLANO.md`:

> *"Quem mais cai em golpe de central falsa e de boleto é justamente quem enxerga
> menos, escuta menos e tem menos intimidade com tecnologia. Um site antigolpe que
> só serve para quem tem visão perfeita está deixando de fora exatamente quem mais
> precisa dele."*

E tem prova: **Lighthouse 100/100 em acessibilidade**, no computador e no celular;
VLibras; alto contraste; texto até 150%; tudo pelo teclado. Mais o "modo simples"
do Premium — letra grande e resposta em uma frase.

⚠ **Não force o ODS 4 (Educação) nem o ODS 8 (Trabalho).** Dá para argumentar, e
seria exatamente a "conexão forçada" da Tabela 19. Dois ODS bem defendidos valem
mais que três, sendo um deles empurrado. O roteiro deixa escolher **até** 3, não
exige 3.

---

## Provas de execução que valem citar — mas só uma linha cada

Servem para a seção 6 (A Equipe: *"por que vocês são as pessoas certas"*) e para o
Slide 9. **Não são seção própria.**

| Prova | O número | Onde está |
|---|---|---|
| Banco em produção | 43 tabelas, 9 visões, 107 funções e gatilhos, 18 migrações | `PLANO.md` Etapa 2, `servidor/db/` |
| Regras críticas no banco | Selo sem posse do domínio: **recusado pelo banco**, não só pela tela | `PLANO.md` Etapa 2 |
| Acessibilidade | **Lighthouse 100/100**, celular e computador | `PLANO.md` Etapa 4 |
| Contraste corrigido | De **1,29:1** para **10,4:1** (AAA) | `MELHORIAS.md` |
| Segundo fator | TOTP + 10 códigos de reserva; admin **não entra sem 2FA** | `PLANO.md` Etapa 5 |
| Pagamento real | Pix de **R$ 5,00**, `pay_txwi7w3wvjj19mgz`, status `RECEIVED` | `PLANO.md` Etapa 9 |
| LGPD na prática | **Zero requisição externa** — nenhum IP de visitante vai para o Google | `PLANO.md` Etapa 6 |
| Segurança | 20 travas documentadas, com duas provas automáticas que rodam por comando | `SEGURANCA.md` |

⚠ **Conflito de número que precisa ser resolvido antes de imprimir.** O `PLANO.md`
diz **43 tabelas** na Etapa 2 e **42** na Etapa 3. A diferença tem explicação
(bancos diferentes, produção e desenvolvimento), mas o roteiro avisa que Portfólio
e Pitch precisam bater entre si. **Confira num `\dt` antes de escrever o número, ou
não cite número nenhum** — o argumento não depende dele.

---

## O que sobra, e é o Portfólio inteiro

Depois de tudo acima, ainda falta a coisa que decide a nota:

- **Seção 3** (Cliente e Problema) — 15 conversas + 50 respostas
- **Seção 4**, metade (Validação) — 8 testes + 30 respostas de preço
- **Seção 5** (Mercado) — TAM/SAM/SOM com fonte, 4 concorrentes
- **Seção 1** (Sumário Executivo) — que resume os números acima e por isso é o último

A Seção 5 eu levanto com pesquisa de fonte pública (IBGE, Febraban, SSP-SP, Serasa)
e não depende de você. **As outras três dependem de campo, e o campo começa hoje:**
[`02-COLETA-DE-CAMPO.md`](02-COLETA-DE-CAMPO.md).
