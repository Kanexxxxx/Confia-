# Vídeo de Apoio — roteiro dos 55 segundos

**Decisão de 03/09/2026: regravar.** O de abril fica no canal como registro da
Fase Inicial; o que muda é o link enviado no portal.

**Meta de duração: 55 segundos.** Não 60.
**Gravar em: 06/09**, depois que a coleta terminar — ver o porquê no fim.

---

## As regras que desclassificam

| Regra | O número |
|---|---|
| Duração | **Máximo 1 minuto. Nem 1 segundo a mais** |
| Hospedagem | YouTube, Google Drive, Dropbox ou OneDrive — **e mais nenhum** |
| Acesso | **Público.** Testar em janela anônima antes de enviar |
| Formato | `.mp4`, `.avi`, `.mpeg`, `.wmv` ou similar |

⚠ **Por que 55 e não 60.** O YouTube arredonda a duração para baixo: um arquivo de
60,4s aparece como "60" na página. Se alguém cronometrar o arquivo em vez da
página, 60,4 vira 61 e a inscrição cai. Cinco segundos de margem custam uma frase
mais curta e eliminam o risco inteiro.

⚠ **Confira a duração no arquivo antes de subir**, não depois. Qualquer editor
mostra. Se passar de 57s, corte — não acelere: áudio acelerado é audível e passa
a impressão errada.

---

## As quatro perguntas obrigatórias

O roteiro do Empreenda exige que o vídeo responda estas quatro, nesta proporção:

| Pergunta | Tempo | O que tem que ficar claro |
|---|---|---|
| **PÚBLICO** | ~10s | Quem é o cliente, **específico** — não "as pessoas" |
| **PROBLEMA** | ~15s | Quem sofre + qual é a dor + qual o impacto |
| **SOLUÇÃO** | ~20s | O que é e como funciona |
| **MONETIZAÇÃO** | ~15s | Modelo de receita e **preço validado** |

⚠ **A monetização é a que o vídeo de abril provavelmente não tinha**, porque em
abril não existia preço. Hoje existe: R$ 12,90 e R$ 24,90 estão na tela de planos.
Se o vídeo novo não falar de dinheiro, ele repete a falha do antigo.

---

## O roteiro falado

Aproximadamente **138 palavras**, que a 150 palavras por minuto dão **~55s**.
Os `[__]` são os números que só existem depois da coleta.

### 0 – 15s · PÚBLICO + PROBLEMA

> "Chega um link no WhatsApp com uma oferta boa demais.
> Você tem trinta segundos para decidir se clica.
> E se quem recebeu foi a sua mãe, é pior: ela te liga —
> e você nem sempre pode atender."

**Na tela:** print de uma conversa de WhatsApp com um link de oferta. Sem marca de
banco nem de loja real — o próprio site já segue essa regra (`MELHORIAS.md`).

### 15 – 33s · SOLUÇÃO

> "O confia? responde se aquilo tem cara de golpe — e mostra o motivo.
> Domínio criado ontem. CNPJ que não existe.
> Foto de perfil que nunca foi de ninguém.
> Você vê por que, não só o quê.
> Serve para link, perfil, telefone e print."

**Na tela:** gravação da tela do produto rodando. Colar um endereço na home,
e a resposta aparecendo em `/resultado` com os motivos listados.

### 33 – 43s · VALIDAÇÃO

> "`[__]` pessoas testaram.
> `[__]` delas souberam explicar sozinhas por que o site foi reprovado —
> que é a promessa inteira do produto."

**Na tela:** foto de alguém usando no celular, ou um número grande.

### 43 – 55s · MONETIZAÇÃO

> "Assinatura de doze reais e noventa por mês.
> `[__]`% aceitaram esse preço na pesquisa.
> Com dez assinantes, o custo do serviço já está pago.
> Confia? — o motivo, não só o veredito."

**Na tela:** a tela de planos, e no fim a marca.

---

## Duas coisas que este roteiro faz de propósito

**Ele não diz que o motor já funciona.** Diz o que o produto faz e o que as
pessoas entenderam — nunca "detectamos X% dos golpes", porque isso seria mentira:
o motor de verificação é a Etapa 8 do `PLANO.md` e ainda não existe. `/resultado`
mostra faixa vermelha dizendo que é demonstração, e isso está certo assim.

⚠ **Se você improvisar na gravação, é aqui que o improviso escorrega.** Frase como
"o confia? identifica golpes com precisão" não está no roteiro por escolha, não por
esquecimento. Um serviço antigolpe que promete o que não entrega é o próprio
problema que ele diz combater — está no `CLAUDE.md`, e vale para o vídeo igual.

**Ele fecha com validação e preço, não com a solução.** É a ordem que o Empreenda
pede e é a ordem que convence: o avaliador já viu cem vídeos explicando um app. Os
poucos que ele lembra são os que terminam com "testei com gente e elas pagariam".

---

## Como gravar

- **Celular na horizontal** serve. Câmera boa importa menos que áudio limpo
- **Grave o áudio num lugar sem eco** — banheiro e cozinha ecoam; quarto com
  cama e cortina, não
- **Grave a tela do produto separado** e junte na edição. Filmar a tela do
  computador com o celular fica ilegível
- **Rode `npm run dev`** e grave a home, o resultado e a página de planos
- **Legenda ajuda** — muita gente assiste sem som. E é coerente com o projeto,
  que tem Lighthouse 100 em acessibilidade

⚠ **Não coloque QR Code nem endereço de site esperando que alguém acesse.** No PDF
os avaliadores ignoram links por regra; no vídeo, ninguém vai pausar para digitar.
O que importa tem que estar dito ou mostrado.

---

## Antes de enviar o link

- [ ] Duração do arquivo conferida: **≤ 57s**
- [ ] Subido no YouTube como **Público** (não "Não listado")
- [ ] Aberto em **janela anônima**, sem estar logado, e tocou
- [ ] Responde as quatro perguntas — público, problema, solução, monetização
- [ ] Nenhuma frase promete precisão que o motor ainda não tem
- [ ] Link colado no portal e o comprovante com o número de protocolo guardado

⚠ **Por que gravar dia 6 e não hoje.** Dois dos quatro blocos citam número de
validação, e nenhum desses números existe antes de as conversas e os testes
terminarem. Gravar agora é gravar duas vezes — e a segunda seria em cima do prazo.
