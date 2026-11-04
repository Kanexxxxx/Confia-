# Documentação do confia?

Índice do que está escrito no repositório. Os arquivos em
`docs/pesquisa/` foram copiados como chegaram, sem edição.

Para retomar o trabalho no código, a ordem continua a de
`CLAUDE.md`: `MELHORIAS.md` § II, depois `PLANO.md`, depois
`PENDENCIAS.md`.

## Auditoria (4 de novembro de 2026)

Leitura do repositório, do Next local e de `vaideconfia.com`.
Não altera código de produção.

| Arquivo | O que tem |
|---|---|
| [AUDITORIA.md](AUDITORIA.md) | Achados numerados por gravidade, com arquivo e linha, comparação com o site no ar, pagamentos e o que ficou de fora |
| [ARQUITETURA.md](ARQUITETURA.md) | Stack, rotas, banco, e-mail, deploy, e uma organização de pastas recomendada |
| [ROADMAP.md](ROADMAP.md) | Fases: correções críticas, pagamentos, celular com PWA, desktop, vidro líquido, integrações |
| [auditoria/screens/](auditoria/screens/) | Capturas a 1440 px e 390 px do Next local (`desktop/`, `celular/`, `fluxos/`) e do site no ar (`ao-vivo/`) |

## Pesquisa anexada (4 de novembro de 2026)

Material de referência. Descreve o site público como ele estava
nessa data (HTML estático, ícones via CDN) e propostas que ainda
não foram aplicadas ao Next.

| Arquivo | O que tem |
|---|---|
| [pesquisa/TRANSICOES.md](pesquisa/TRANSICOES.md) | 119 transições e microinterações, com onde usar, referência e trecho mínimo. Separa desktop, celular e os dois |
| [pesquisa/ICONES.md](pesquisa/ICONES.md) | Comparação de bibliotecas de ícone e recomendação de uso no Confia |
| [pesquisa/INTEGRACOES.md](pesquisa/INTEGRACOES.md) | APIs para o motor de verificação, pagamentos, WhatsApp, e-mail e operação, com custo de tabela |
| [pesquisa/TEMPLATES.md](pesquisa/TEMPLATES.md) | Catálogo de mensagens: e-mail, WhatsApp, push e SMS |
| [pesquisa/links_verificados.txt](pesquisa/links_verificados.txt) | URLs citadas na pesquisa, conferidas com HTTP 200 ou redirecionamento |

## Mapa do produto

| Arquivo | O que tem |
|---|---|
| [../README.md](../README.md) | O que é o confia?, onde fica cada pasta e como rodar no dia a dia |
| [../CLAUDE.md](../CLAUDE.md) | Regras que não se discutem e armadilhas que já custaram horas. Ler inteiro numa conversa nova |
| [../COMECAR-CHAT-NOVO.md](../COMECAR-CHAT-NOVO.md) | O prompt que abre uma conversa nova |
| [../PLANO.md](../PLANO.md) | As 10 etapas de construção e em qual estamos |
| [../MELHORIAS.md](../MELHORIAS.md) | Lista viva de crítica. A § II é a rodada de 27/08/2026 |
| [../PENDENCIAS.md](../PENDENCIAS.md) | O que depende de ação humana: MEI, advogado, chaves |
| [../SEGURANCA.md](../SEGURANCA.md) | As 20 travas e como conferir cada uma |
| [../ASAAS.md](../ASAAS.md) | Pagamento: onde a chave fica, sandbox e produção, o que o site ainda não cobra |
| [../minimundo.md](../minimundo.md) | Descrição histórica do produto, preservada na consolidação dos repositórios |

## Plano Empreenda (SENAC)

Não é o código. É o portfólio, o pitch e o vídeo.
Começa por [../PLANO-EMPREENDEDOR/AGORA.md](../PLANO-EMPREENDEDOR/AGORA.md)
e segue o [mapa](../PLANO-EMPREENDEDOR/00-MAPA.md).

| Arquivo | O que tem |
|---|---|
| [00-MAPA.md](../PLANO-EMPREENDEDOR/00-MAPA.md) | Mapa da entrega |
| [01-EVIDENCIAS-DO-REPOSITORIO.md](../PLANO-EMPREENDEDOR/01-EVIDENCIAS-DO-REPOSITORIO.md) | O que o repositório já prova |
| [02-COLETA-DE-CAMPO.md](../PLANO-EMPREENDEDOR/02-COLETA-DE-CAMPO.md) | O que só dado de cliente preenche |
| [03-VIDEO.md](../PLANO-EMPREENDEDOR/03-VIDEO.md) | O vídeo |
| [04-RESULTADOS.md](../PLANO-EMPREENDEDOR/04-RESULTADOS.md) | Resultados |
| [05-PORTFOLIO-RASCUNHO.md](../PLANO-EMPREENDEDOR/05-PORTFOLIO-RASCUNHO.md) | Rascunho do portfólio |
| [06-PRINTS-E-PROVAS.md](../PLANO-EMPREENDEDOR/06-PRINTS-E-PROVAS.md) | Prints e provas |
| [07-FORMULARIO.md](../PLANO-EMPREENDEDOR/07-FORMULARIO.md) | Formulário |
| [AGORA.md](../PLANO-EMPREENDEDOR/AGORA.md) | O que fazer na entrega |
| [AGORA-MINIMUNDO-HISTORICO.md](../PLANO-EMPREENDEDOR/AGORA-MINIMUNDO-HISTORICO.md) | Variante histórica, preservada inteira |
| [RETOMAR.md](../PLANO-EMPREENDEDOR/RETOMAR.md) | Como retomar essa frente |

## Dentro de `web/`

| Arquivo | O que tem |
|---|---|
| [../web/AGENTS.md](../web/AGENTS.md) | Regras do Next.js 16 neste repositório. Ler `node_modules/next/dist/docs/` antes de escrever código de framework |
| [../web/CLAUDE.md](../web/CLAUDE.md) | Aponta para `AGENTS.md` |
| [../web/CSS-ARMADILHAS.md](../web/CSS-ARMADILHAS.md) | Ordem do `backdrop-filter` e as outras falhas de CSS que não avisam |
| [../web/README.md](../web/README.md) | Texto gerado pelo create-next-app. Não descreve o Confia |
