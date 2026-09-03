# Duas armadilhas de CSS que quase foram para o ar

Ambas falham **em silêncio**: nenhum erro no console, nenhum aviso no
build, nenhum teste quebrando. Só o site errado na tela.

---

## 1. A ordem das declarações com prefixo importa

## O que aconteceu

O efeito de vidro do site inteiro — o cabeçalho, a pílula do menu e
o card do verificador — simplesmente não existia no Chrome. Sem erro
no console, sem aviso no build. O elemento continuava lá, do tamanho
certo, com o texto certo; só não borrava o que estava atrás.

O `globals.css` estava assim, herdado do protótipo:

```css
.haze span:first-child{
  backdrop-filter:blur(18px);          /* padrão, primeiro */
  -webkit-backdrop-filter:blur(18px);  /* prefixo, por último */
}
```

O lightningcss (que o Turbopack usa sempre) trata as duas como a
mesma propriedade e **guarda só a última**. Chegava ao navegador
apenas:

```css
.haze span:first-child{
  -webkit-backdrop-filter:blur(18px);
}
```

E o Chrome atual **não reconhece mais** `-webkit-backdrop-filter`.
Ou seja: sobrava exatamente a versão morta.

## A regra

**Prefixo primeiro. Padrão por último.**

```css
/* certo */
-webkit-backdrop-filter:blur(18px);
backdrop-filter:blur(18px);

/* errado — o padrão é descartado */
backdrop-filter:blur(18px);
-webkit-backdrop-filter:blur(18px);
```

É a convenção de sempre em CSS, pelo mesmo motivo de fundo: quando
duas declarações disputam, quem vem depois vence, e quem deve vencer
é a forma padrão. O que muda com um compilador no meio é que a
perdedora não fica só sem efeito — ela desaparece.

Vale para qualquer par com prefixo. Hoje no projeto:
`backdrop-filter` e `mask-image`.

## Caminhos que testei e não resolveram

| Tentativa | Resultado |
| --- | --- |
| Declarar `browserslist` | Nenhuma mudança — nunca foi o alvo de navegador (foi revertido: o padrão do Next já é chrome/edge/firefox 111 + safari 16.4) |
| `experimental.lightningCssFeatures: { exclude: ['vendor-prefixes'] }` | Piorou: o compilador para de gerar prefixo e continua deduplicando |
| Escrever só a forma padrão | Funciona no Chrome, mas o Safari 16.4–17 fica sem vidro |

O que funciona é escrever o par na ordem certa e deixar a
configuração em paz. Confirmado na saída servida: 13 declarações de
cada forma.

## CUIDADO AO MEXER

- Este tipo de falha é **silenciosa**. Nenhum teste do projeto pega.
- Depois de mexer em CSS com prefixo, abra uma página com vidro no
  navegador e confira. Ou, mais rápido, no console:

  ```js
  getComputedStyle(document.querySelector('.topbar .haze span')).backdropFilter
  // "blur(18px)"  → certo
  // "none"        → o padrão foi descartado de novo
  ```


---

## 2. `isolation:isolate` + `backdrop-filter` apaga o texto por cima

O menu de vidro ficou com o texto quase invisível — **1,29:1** de
contraste medido no pixel, onde a WCAG pede 4,5:1. Não era cor: as
cores estavam certas no CSS o tempo todo.

A causa estava aqui:

```css
.lg{position:relative;isolation:isolate}   /* <- este isolation */
```

`isolation:isolate` faz o `.lg` virar um contexto de empilhamento, e
com isso ele passa a ser o *backdrop root* do filho `.lg-refract`,
que tem `backdrop-filter`. O filtro passa a amostrar o interior do
próprio `.lg` em vez da página atrás, e o navegador compõe o grupo
inteiro de um jeito que apaga o conteúdo desenhado por cima.

Testado, um de cada vez:

| Configuração | Contraste do texto |
| --- | --- |
| `isolation:isolate` (como estava) | 1,29:1 |
| `z-index:0` no lugar dele | 1,44:1 |
| Sem backdrop-filter, com isolation | 1,44:1 |
| **Sem contexto de empilhamento** | **10,43:1** |

Ou seja: qualquer coisa que crie contexto de empilhamento no `.lg`
reproduz o problema. A correção é não criar nenhum.

**O que isso custa:** os `z-index` das camadas do vidro (refração 0,
tinta 1, brilho 2, pino 2, conteúdo 3) deixam de ser locais e passam
a valer no contexto do pai. Hoje não há conflito porque nada no
cabeçalho nem no herói se sobrepõe ao vidro. Se um dia um vizinho
aparecer na camada errada, é essa a explicação — resolva pela ordem
no DOM, não devolvendo o `isolation`.

### Como conferir

Contraste real, no pixel, não o que o CSS promete:

```js
// no console, com a página rolada de modo que algo claro passe
// por trás do cabeçalho
getComputedStyle(document.querySelector('.topbar .nav-link')).color
// e depois OLHE o menu. Se o texto sumiu, é isto.
```

Há um leitor de PNG sem dependências em
`scripts/ferramentas/lepng.py` para medir contraste a partir de uma
captura, que foi como este problema apareceu.
