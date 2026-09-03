/* =============================================================
   confiia.com.br — prova que a armadilha para robô funciona

   Uso:  npm run prova-armadilha

   ─────────────────────────────────────────────────────────────
   POR QUE ISTO EXISTE COMO SCRIPT E NÃO COMO TESTE MANUAL

   Uma armadilha quebrada não faz barulho. Se o carimbo parar de
   ser conferido, nada na tela muda: o formulário continua
   funcionando para gente e volta a aceitar robô em silêncio.
   Este script é o único jeito de saber.

   Ele importa `src/lib/armadilha.ts` DE VERDADE — não uma cópia.
   Se alguém mexer nas regras lá, é aqui que aparece.

   ─────────────────────────────────────────────────────────────
   CUIDADO AO MEXER:
     - Rode depois de qualquer mudança em `lib/armadilha.ts`.
     - Precisa da COFRE_CHAVE: é ela que assina o carimbo.
     - `--experimental-strip-types` é o que deixa o Node ler .ts
       direto. Se cair num Node < 22, este script para de rodar —
       o site não.
     - `--conditions=react-server` é obrigatório: `armadilha.ts` é
       `server-only`, e esse pacote foi feito para EXPLODIR quando
       importado fora do servidor. Nessa condição ele resolve para
       um módulo vazio e o import passa. Tirar a flag faz este
       script falhar sem que nada esteja errado no site.
   ============================================================= */

import { createHmac } from 'node:crypto';
import { carimboDeAgora, pareceRobo } from '../src/lib/armadilha.ts';

let falhas = 0;

function caso(nome, montar, esperado) {
  const f = new FormData();
  montar(f);
  const deu = pareceRobo(f);
  const ok = deu === esperado;
  if (!ok) falhas++;
  console.log(`  ${ok ? 'ok   ' : 'FALHA'} ${nome.padEnd(38)} ${deu ? 'barrado' : 'passou'}`);
}

const assina = (v) => createHmac('sha256', process.env.COFRE_CHAVE).update(v).digest('base64url');
/* Um carimbo legítimo, assinado, de `ms` atrás. */
const ha = (ms) => { const t = String(Date.now() - ms); return `${t}.${assina(t)}`; };

console.log('\n  Como um robô manda — tudo isto tem que ser barrado');
caso('isca preenchida',            (f) => { f.set('website', 'http://x.com'); f.set('carimbo', ha(10_000)); }, true);
caso('sem carimbo nenhum',         (f) => { f.set('website', ''); }, true);
caso('carimbo inventado',          (f) => { f.set('carimbo', '9999999999999.qualquercoisa'); }, true);
caso('assinatura adulterada',      (f) => { f.set('carimbo', `${Date.now() - 10_000}.${assina('outra-coisa')}`); }, true);
caso('enviado no mesmo instante',  (f) => { f.set('carimbo', carimboDeAgora()); }, true);
caso('página guardada há 7 horas', (f) => { f.set('carimbo', ha(7 * 60 * 60 * 1000)); }, true);

console.log('\n  Como uma pessoa manda — tudo isto tem que passar');
caso('10 s depois de abrir',       (f) => { f.set('carimbo', ha(10_000)); f.set('website', ''); }, false);
caso('2 min depois de abrir',      (f) => { f.set('carimbo', ha(120_000)); f.set('website', ''); }, false);
caso('1 h depois de abrir',        (f) => { f.set('carimbo', ha(60 * 60 * 1000)); }, false);

console.log(falhas === 0 ? '\n  A armadilha está de pé.\n' : `\n  ${falhas} caso(s) errado(s).\n`);
process.exitCode = falhas === 0 ? 0 : 1;
