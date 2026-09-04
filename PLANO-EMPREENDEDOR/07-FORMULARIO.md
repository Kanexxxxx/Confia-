# O formulário — script pronto + o visual da marca

**15 segundos de script + 3 minutos de visual.** Em vez de 40 minutos digitando.

---

## Antes: o que dá e o que não dá para automatizar

Pesquisei a documentação oficial antes de escrever. O resultado importa porque
economiza você tentando:

| | Dá por código? |
|---|---|
| Criar o formulário e as 12 perguntas | ✅ sim |
| Marcar obrigatórias, ordem, seções | ✅ sim |
| Desligar a coleta de e-mail | ✅ sim |
| **Cor do tema** | ❌ **não** |
| **Imagem de cabeçalho (banner)** | ❌ **não** |
| **Fonte do tema** | ❌ **não** |

Não é limitação do script — é que **não existe**. A classe `Form` do Apps Script não
tem `setTheme`, `setHeaderImage` nem `setFont`, e a API REST v1 do Forms também não:
os únicos campos de topo dela são `info` (título e descrição), `settings`, `items`,
`revisionId`, `responderUri`, `linkedSheetId` e `publishSettings`. Nenhum de tema.

> Fontes: [Class Form](https://developers.google.com/apps-script/reference/forms/form)
> · [Forms Service](https://developers.google.com/apps-script/reference/forms)
> · [Forms API v1 — recurso forms](https://developers.google.com/workspace/forms/api/reference/rest/v1/forms)

⚠ **Cuidado com uma pegadinha:** existe `addImageItem()`, mas ele insere imagem
**dentro do corpo** do formulário, como se fosse uma pergunta. Não é o banner do
topo. São coisas diferentes.

**Então:** o script faz o trabalho chato, e o visual são 4 cliques no fim desta
página.

---

## PASSO 1 · Rodar o script · 2 minutos

1. Abra **[script.google.com](https://script.google.com)** → **Novo projeto**
2. Apague o que estiver lá e **cole o código inteiro** abaixo
3. Clique em **Executar** (▶)
4. Ele vai pedir autorização: **Revisar permissões** → sua conta → **Avançado** →
   *Ir para Projeto sem título (não seguro)* → **Permitir**
5. Quando terminar, abra **Execuções** (ou `Ctrl+Enter`) e copie os dois links que
   ele imprime

⚠ O aviso de "não seguro" é normal e aparece em qualquer script pessoal não
publicado. Você está autorizando o seu próprio script a mexer no seu próprio Drive.

```javascript
/**
 * confia? — gerador da pesquisa do Plano Empreendedor
 *
 * Cria o formulário inteiro, com as 12 perguntas na ordem certa.
 * O VISUAL (cor, fonte, banner) NÃO entra aqui: o Apps Script não
 * expõe tema. Isso são 4 cliques na interface, explicados embaixo
 * do código no 07-FORMULARIO.md.
 *
 * Se você mexer nas perguntas aqui, mexa também em 02-COLETA-DE-CAMPO.md
 * e nos critérios de sucesso — os números do Portfólio saem daqui.
 */
function criarPesquisaConfia() {

  var form = FormApp.create('Golpes pela internet — 2 minutos');

  form.setDescription(
    'Pesquisa anônima para um projeto do Senac sobre golpe pela internet.\n\n' +
    'São 12 perguntas de múltipla escolha e leva mesmo 2 minutos.\n' +
    'Não pedimos seu nome, seu e-mail nem nenhum dado seu.'
  );

  // Anônimo de verdade. Um formulário de projeto antigolpe que já
  // começa pedindo dado pessoal contradiz o próprio produto.
  form.setCollectEmail(false);
  form.setProgressBar(true);
  form.setConfirmationMessage(
    'Pronto — obrigado! Se puder passar para mais alguém, ajuda muito.'
  );

  // ---------------------------------------------------------------
  // BLOCO 1 — quem respondeu
  // A pergunta 3 existe para ser CRUZADA com a 11 lá no fim:
  // quem cuida de alguém aceita pagar mais? É o cruzamento que
  // sustenta o plano Premium no Portfólio.
  // ---------------------------------------------------------------
  form.addSectionHeaderItem()
      .setTitle('Sobre você')
      .setHelpText('Três perguntas rápidas, sem identificação.');

  form.addMultipleChoiceItem()
      .setTitle('Sua idade')
      .setChoiceValues(['até 24', '25 a 39', '40 a 59', '60 ou mais'])
      .setRequired(true);

  form.addMultipleChoiceItem()
      .setTitle('Com que frequência você compra pela internet?')
      .setChoiceValues(['quase todo dia', 'algumas vezes por mês',
                        'raramente', 'nunca'])
      .setRequired(true);

  form.addMultipleChoiceItem()
      .setTitle('Você ajuda alguém da família a usar internet (pai, mãe, avó, filho)?')
      .setChoiceValues(['sim, sempre', 'às vezes', 'não'])
      .setRequired(true);

  // ---------------------------------------------------------------
  // BLOCO 2 — o problema existe?
  // Estas cinco viram os números da seção 3.3 do Portfólio.
  // ---------------------------------------------------------------
  form.addPageBreakItem()
      .setTitle('O que já aconteceu com você');

  form.addMultipleChoiceItem()
      .setTitle('Nos últimos 30 dias, você recebeu link, oferta ou mensagem que ' +
                'desconfiou ser golpe?')
      .setChoiceValues(['sim', 'não', 'não sei dizer'])
      .setRequired(true);

  form.addMultipleChoiceItem()
      .setTitle('Quantas vezes, mais ou menos?')
      .setChoiceValues(['nenhuma', '1 a 2', '3 a 5', 'mais de 5'])
      .setRequired(true);

  form.addCheckboxItem()
      .setTitle('Quando você desconfia, o que faz?')
      .setHelpText('Pode marcar mais de uma.')
      .setChoiceValues(['ignoro', 'pergunto para alguém',
                        'pesquiso no Google', 'procuro o CNPJ',
                        'clico mesmo assim', 'não sei o que fazer'])
      .setRequired(true);

  form.addMultipleChoiceItem()
      .setTitle('Você já deixou de comprar alguma coisa por não conseguir ' +
                'confirmar se a loja era de verdade?')
      .setChoiceValues(['sim', 'não'])
      .setRequired(true);

  form.addMultipleChoiceItem()
      .setTitle('Você ou alguém próximo já perdeu dinheiro num golpe pela internet?')
      .setChoiceValues(['eu já', 'alguém próximo', 'não'])
      .setRequired(true);

  // ---------------------------------------------------------------
  // BLOCO 3 — a solução faz sentido?
  // ---------------------------------------------------------------
  form.addPageBreakItem()
      .setTitle('Uma ideia');

  form.addCheckboxItem()
      .setTitle('Se um site dissesse em segundos se um link é confiável — e ' +
                'explicasse o motivo — quando você usaria?')
      .setHelpText('Pode marcar mais de uma.')
      .setChoiceValues(['antes de comprar em loja nova',
                        'quando chega link no WhatsApp',
                        'antes de fazer Pix para desconhecido',
                        'para conferir perfil de rede social',
                        'não usaria'])
      .setRequired(true);

  // ---------------------------------------------------------------
  // BLOCO 4 — preço
  // A ordem 10 → 11 → 12 é de propósito. A 11 sozinha superestima
  // ("sim falso"). Cruzada com a 12, mostra onde o preço TRAVA de
  // verdade — e é isso que vira o gráfico de disposição a pagar.
  // ---------------------------------------------------------------
  form.addPageBreakItem()
      .setTitle('Última parte: quanto valeria')
      .setHelpText('Não estamos vendendo nada. É pesquisa.');

  form.addMultipleChoiceItem()
      .setTitle('Quanto por mês você acharia justo pagar por isso?')
      .setChoiceValues(['não pagaria', 'até R$ 5', 'R$ 6 a 10',
                        'R$ 11 a 15', 'R$ 16 a 25', 'mais de R$ 25'])
      .setRequired(true);

  form.addMultipleChoiceItem()
      .setTitle('Por R$ 12,90 por mês (30 verificações + 5 imagens), você assinaria?')
      .setChoiceValues(['sim', 'talvez', 'não'])
      .setRequired(true);

  form.addMultipleChoiceItem()
      .setTitle('A partir de qual valor mensal você acharia caro demais, ' +
                'mesmo gostando?')
      .setChoiceValues(['R$ 10', 'R$ 15', 'R$ 20', 'R$ 30', 'R$ 50',
                        'qualquer valor é caro'])
      .setRequired(true);

  Logger.log('=================================================');
  Logger.log('EDITAR (para pôr cor e banner): ' + form.getEditUrl());
  Logger.log('MANDAR PARA AS PESSOAS:         ' + form.getPublishedUrl());
  Logger.log('=================================================');
}
```

---

## PASSO 2 · O visual da marca · 3 minutos

Abra o **link de EDITAR** que o script imprimiu e clique no ícone de **paleta 🎨**,
no topo.

| Onde | O que pôr |
|---|---|
| **Cabeçalho** | Enviar imagem → o banner (ver abaixo) |
| **Cor** | O azul-escuro do confia? — **`#0B2443`** |
| **Cor do plano de fundo** | O tom mais claro que ele oferece do mesmo azul |
| **Fonte** | **Playfair Display** não. Use **Básico** ou **Formal** |

⚠ **Não invente fonte nova.** O projeto usa Inter e Poppins, e trocar fonte sem
perguntar já deu problema uma vez — está escrito no `CLAUDE.md`. Como o Forms não
oferece nenhuma das duas, fique no neutro: **Básico**.

### O banner

O Google Forms corta o cabeçalho em **1600 × 400 px**. Monte no Canva em 2 minutos:

- Fundo: **`#0B2443`** (o azul do site)
- No centro-esquerda: a logo — `web/public/assets/logo-confia.svg`
- Ao lado, em branco: **"Golpes pela internet"** e, menor, **"pesquisa de 2 minutos"**
- Nada mais. Banner cheio de coisa vira ruído no celular

**As cores da marca**, se precisar de mais alguma:

```
azul-escuro  #0B2443   ← principal
azul-claro   #4D9FFF
verde        #2FD39B
areia        #F5F8FD
```

---

## PASSO 3 · Testar antes de mandar · 1 minuto

- [ ] Abrir o **link de mandar** numa **janela anônima** — tem que abrir sem login
- [ ] Responder você mesmo, do começo ao fim, **pelo celular**
- [ ] Conferir que **não pede e-mail** em lugar nenhum
- [ ] Ver se as 12 perguntas apareceram, na ordem

⚠ **Responda uma vez de verdade e depois apague essa resposta.** Formulário que
ninguém testou costuma ter uma pergunta obrigatória travando no meio — e você só
descobre pelas pessoas que desistiram.

---

## Se você conseguir 100 respostas

Você falou que consegue. Vale mirar, porque muda de faixa na avaliação:

| | Mínimo do roteiro | Ideal do roteiro |
|---|---|---|
| Pesquisa quantitativa | 50 | **100+** |
| Pesquisa de preço | 30 | 50+ |

Como este formulário faz as duas coisas de uma vez, **100 respostas fecham as duas
na faixa "ideal"** — e aí a seção 3.3 deixa de dizer "atingimos o mínimo" e passa a
dizer "superamos o recomendado". É uma frase melhor no Sumário Executivo.

⚠ **Só não empurre resposta.** Amostra grande de gente que respondeu no automático
para ajudar é pior que amostra pequena de gente que leu. Se der 60, deu 60.
