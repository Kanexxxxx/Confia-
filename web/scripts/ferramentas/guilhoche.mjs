/* =============================================================
   confiia.com.br — gera o guilhochê do fundo

   Uso:  node scripts/ferramentas/guilhoche.mjs
   Saída: public/assets/guilhoche.svg

   ─────────────────────────────────────────────────────────────
   O QUE É ISSO E POR QUE EXISTE

   Guilhochê é a gravura de segurança da cédula de dinheiro:
   aquelas linhas finíssimas que se cruzam e formam ondas, que
   você só vê de perto e que impressora comum não reproduz.

   Ele entra aqui por DOIS motivos, e o segundo é o que importa.

   1. Ele é do assunto. Este site existe para o segundo em que a
      pessoa levanta a nota contra a luz procurando a marca
      d'água. O fundo ser a gravura da própria cédula não é
      enfeite — é dizer do que a página trata, sem escrever.

   2. ELE CONSERTA O EFEITO DE VIDRO.

      Antes daqui o fundo eram três manchas de gradiente com
      `filter: blur(60px)`. O vidro por cima pedia
      `backdrop-filter: blur(18px)` — e não acontecia nada, porque
      não havia o que borrar: já era mancha. O vidro virava um
      retângulo cinza chapado.

      Vidro só parece vidro quando tem DETALHE FINO atrás para
      deformar. É por isso que no iPhone o efeito é impressionante
      e aqui não era: lá atrás do vidro tem foto — contraste,
      borda nítida, alta frequência. Aqui atrás não tinha nada.

      Estas linhas são alta frequência pura. Ao serem borradas,
      elas escorrem, se misturam e formam a moiré que o olho lê
      como "tem vidro aqui".

   ─────────────────────────────────────────────────────────────
   COMO O DESENHO É FEITO

   Não é aleatório. São ondas senoidais sobrepostas, com
   frequências que fecham no tamanho do ladrilho — por isso o
   padrão emenda sem costura ao se repetir.

   Cada linha soma três senos de frequências diferentes. Uma só
   daria ondulação de piscina; três se interferem e produzem o
   ritmo irregular da gravura de verdade.

   ─────────────────────────────────────────────────────────────
   CUIDADO AO MEXER:
     - `LADRILHO` precisa ser o mesmo do `background-size` no CSS,
       senão a emenda aparece como uma grade fantasma.
     - As frequências (`ONDAS`) têm que ser INTEIRAS. Fracionária,
       a linha não volta ao mesmo ponto na borda e a costura fica
       visível.
     - Linha muito grossa vira listra e sobrecarrega a tela; muito
       fina some no celular e o vidro perde o que refratar.
       0.5–0.7px é a faixa que funciona nos dois.
   ============================================================= */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SAIDA = resolve(AQUI, '../../public/assets/guilhoche.svg');

const LADRILHO = 320;   // px — precisa bater com o background-size do CSS
const LINHAS = 26;      // quantas linhas de gravura no ladrilho
const PASSO = 8;        // px entre pontos da curva (menor = mais suave, arquivo maior)

/* Três ondas por linha. `f` é a frequência (INTEIRA, para fechar
   no ladrilho), `a` a amplitude em px, `fase` o deslocamento. */
const ONDAS = [
  { f: 1, a: 15, fase: 0 },
  { f: 3, a: 6,  fase: 1.1 },
  { f: 7, a: 2.4, fase: 2.7 },
];

function curva(deslocamento, inclinacao) {
  const pontos = [];
  for (let x = 0; x <= LADRILHO; x += PASSO) {
    const t = (x / LADRILHO) * Math.PI * 2;
    let y = deslocamento + x * inclinacao;
    for (const o of ONDAS) y += Math.sin(t * o.f + o.fase + deslocamento * 0.02) * o.a;
    pontos.push(`${x},${(y % LADRILHO).toFixed(1)}`);
  }
  return pontos;
}

/* Uma linha pode "dar a volta" no ladrilho (y passa de 320 para 0).
   Cortar ali em vez de desenhar o salto evita um risco horizontal
   atravessando a tela. */
function caminhos(pontos) {
  const partes = [];
  let atual = [pontos[0]];
  for (let i = 1; i < pontos.length; i++) {
    const yA = parseFloat(pontos[i - 1].split(',')[1]);
    const yB = parseFloat(pontos[i].split(',')[1]);
    if (Math.abs(yB - yA) > LADRILHO / 2) { partes.push(atual); atual = [pontos[i]]; }
    else atual.push(pontos[i]);
  }
  partes.push(atual);
  return partes.filter((p) => p.length > 1).map((p) => `M${p.join(' L')}`);
}

const linhas = [];
for (let i = 0; i < LINHAS; i++) {
  const deslocamento = (i / LINHAS) * LADRILHO;
  /* Duas famílias cruzadas, como na cédula: uma quase horizontal e
     outra inclinada. O cruzamento é o que faz a trama. */
  linhas.push(...caminhos(curva(deslocamento, 0.06)));
  linhas.push(...caminhos(curva(deslocamento + 6, -0.09)));
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${LADRILHO}" height="${LADRILHO}" viewBox="0 0 ${LADRILHO} ${LADRILHO}">
<g fill="none" stroke="#ffffff" stroke-width="0.6" stroke-linecap="round" opacity="0.5">
${linhas.map((d) => `<path d="${d}"/>`).join('\n')}
</g>
</svg>`;

mkdirSync(dirname(SAIDA), { recursive: true });
writeFileSync(SAIDA, svg);
console.log(`  guilhoche.svg  ${LADRILHO}×${LADRILHO}px  ${linhas.length} traços  ${(svg.length / 1024).toFixed(1)} KB`);
