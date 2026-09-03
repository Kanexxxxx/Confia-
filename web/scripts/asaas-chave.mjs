/* =============================================================
   confiia.com.br — guardar a chave do Asaas sem ela vazar

   Uso:
     npm run asaas-chave              → grava a chave (sandbox)
     npm run asaas-chave -- --producao  → grava chave de PRODUÇÃO
     npm run asaas-chave -- --conferir  → diz o que já está guardado
     npm run asaas-chave -- --apagar    → remove a chave

   ─────────────────────────────────────────────────────────────
   POR QUE ESTE SCRIPT EXISTE

   A chave do Asaas move dinheiro. Ela não pode ser colada:
     · numa conversa de chat  — vira texto da conversa, guardado
       em servidor que não é seu;
     · num arquivo do Git     — commit não se desapaga do
       histórico de quem já clonou;
     · num comando do terminal — fica no histórico do shell, em
       texto puro, para sempre.

   Então ela é digitada AQUI, com o teclado mudo (o terminal não
   mostra o que você digita, nem em asterisco), e vai direto para
   `web/.env.local`, que o Git ignora. Ela não aparece na tela,
   não entra no histórico e não passa por mais ninguém.

   É a mesma lógica da COFRE_CHAVE, no PENDENCIAS.md item 6.
   ─────────────────────────────────────────────────────────────

   CUIDADO AO MEXER:
     - A chave é gravada entre ASPAS SIMPLES de propósito. Ela
       começa com `$`, e `$` em arquivo lido por shell vira
       expansão de variável: sem as aspas, um `source .env.local`
       transformaria a chave em vazio, silenciosamente.
     - Chave de PRODUÇÃO exige `--producao` escrito à mão. Não é
       burocracia: é a diferença entre testar e cobrar gente de
       verdade, e o prefixo das duas só muda quatro letras.
     - Este script NUNCA imprime a chave inteira. Se você mudar
       isso para depurar, desfaça antes de commitar.
   ============================================================= */

import { readFileSync, writeFileSync, existsSync, chmodSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';

const AQUI = dirname(fileURLToPath(import.meta.url));
const ENV = resolve(AQUI, '..', '.env.local');

const args = process.argv.slice(2);
const querProducao = args.includes('--producao');
const querConferir = args.includes('--conferir');
const querApagar = args.includes('--apagar');

const VARIAVEL = 'ASAAS_API_KEY';

/* Os dois prefixos vêm da documentação oficial:
   https://docs.asaas.com/docs/authentication */
const PREFIXO = { sandbox: '$aact_hmlg_', producao: '$aact_prod_' };

function encoberta(chave) {
  return `${chave.slice(0, 11)}…${chave.slice(-4)}`;
}

function leEnv() {
  return existsSync(ENV) ? readFileSync(ENV, 'utf8') : '';
}

function chaveGuardada() {
  const linha = leEnv()
    .split(/\r?\n/)
    .find((l) => l.trim().startsWith(`${VARIAVEL}=`));
  if (!linha) return null;
  return linha.slice(linha.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '');
}

/* A QUEBRA DE LINHA DO ARQUIVO É PRESERVADA

   Este arquivo nasce no Windows, com CRLF. Gravar de volta com LF
   funciona (o Node lê os dois), mas reescreve TODAS as linhas do
   ponto de vista de qualquer comparação — e aí um `diff` para
   conferir "o que mudou no meu .env.local" mostra o arquivo
   inteiro, incluindo os segredos, em vez da única linha que
   mudou de verdade.

   Num arquivo que guarda a COFRE_CHAVE, poder comparar sem
   despejar tudo na tela não é conforto: é segurança. */
function quebraDoArquivo(texto) {
  return texto.includes('\r\n') ? '\r\n' : '\n';
}

/* Substitui a linha se ela existir; acrescenta no fim se não.
   Reescrever o arquivo inteiro seria mais simples e apagaria o
   resto das variáveis — inclusive a COFRE_CHAVE, que não tem
   cópia e tranca todo mundo com 2FA para fora se sumir. */
function gravaChave(chave) {
  const texto = leEnv();
  const quebra = quebraDoArquivo(texto);
  const linhas = texto.split(/\r?\n/);
  const nova = `${VARIAVEL}='${chave}'`;
  const i = linhas.findIndex((l) => l.trim().startsWith(`${VARIAVEL}=`));

  if (i >= 0) linhas[i] = nova;
  else {
    if (linhas.length && linhas[linhas.length - 1].trim() !== '') linhas.push('');
    linhas.push('# Asaas — gravada por `npm run asaas-chave`. Não commite este arquivo.');
    linhas.push(nova);
    linhas.push('');
  }

  writeFileSync(ENV, linhas.join(quebra), 'utf8');

  /* Só o dono lê. No Windows isto é praticamente decorativo, mas
     o mesmo script roda no servidor Linux, onde não é. */
  try { chmodSync(ENV, 0o600); } catch { /* sistema que não suporta */ }
}

function apagaChave() {
  const texto = leEnv();
  const quebra = quebraDoArquivo(texto);
  const restantes = texto.split(/\r?\n/).filter(
    (l) => !l.trim().startsWith(`${VARIAVEL}=`)
        && !l.includes('gravada por `npm run asaas-chave`'),
  );
  writeFileSync(ENV, restantes.join(quebra), 'utf8');
}

/* ---------- pergunta com o teclado mudo ----------
   Sem eco NENHUM, nem asterisco: contar quantos caracteres a
   chave tem já é informação de graça para quem estiver olhando a
   tela por cima do seu ombro. */
function perguntaEmSilencio(pergunta) {
  return new Promise((resolvido) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });

    const escrever = process.stdout.write.bind(process.stdout);
    let mudo = false;
    process.stdout.write = (pedaco, ...resto) => (mudo ? true : escrever(pedaco, ...resto));

    rl.question(pergunta, (resposta) => {
      process.stdout.write = escrever;
      escrever('\n');
      rl.close();
      resolvido(resposta.trim());
    });

    mudo = true;
  });
}

/* ---------- conferir ---------- */
if (querConferir) {
  const chave = chaveGuardada();
  console.log();
  if (!chave) {
    console.log('  Nenhuma chave do Asaas guardada.');
    console.log('  Para gravar:  npm run asaas-chave\n');
    process.exit(0);
  }
  const ambiente =
    chave.startsWith(PREFIXO.sandbox) ? 'SANDBOX (dinheiro de mentira)'
    : chave.startsWith(PREFIXO.producao) ? 'PRODUÇÃO (dinheiro de verdade)'
    : 'DESCONHECIDO — o prefixo não bate com nenhum dos dois';

  console.log(`  Chave guardada : ${encoberta(chave)}`);
  console.log(`  Ambiente       : ${ambiente}`);
  console.log(`  Arquivo        : web/.env.local (o Git ignora)`);
  console.log('\n  Para testar se ela funciona:  npm run prova-asaas\n');
  process.exit(0);
}

/* ---------- apagar ---------- */
if (querApagar) {
  if (!chaveGuardada()) {
    console.log('\n  Não havia chave guardada. Nada a fazer.\n');
    process.exit(0);
  }
  apagaChave();
  console.log('\n  Chave removida de web/.env.local.');
  console.log('  ⚠ Ela continua válida no painel do Asaas — se o motivo');
  console.log('    for suspeita de vazamento, revogue lá também.\n');
  process.exit(0);
}

/* ---------- gravar ---------- */
const alvo = querProducao ? 'producao' : 'sandbox';
const prefixoEsperado = PREFIXO[alvo];

console.log();
console.log(`  Guardando a chave de ${alvo === 'producao' ? 'PRODUÇÃO' : 'SANDBOX'} do Asaas.`);
console.log();

if (alvo === 'producao') {
  console.log('  ⚠ ATENÇÃO — CHAVE DE PRODUÇÃO');
  console.log('    Esta chave cobra pessoas de verdade. Antes dela, o certo');
  console.log('    é o sandbox funcionar inteiro: `npm run asaas-chave` sem');
  console.log('    o --producao. Se foi sem querer, aperte Ctrl+C agora.');
  console.log();
}

console.log('  Cole a chave e aperte Enter. O terminal NÃO vai mostrar nada');
console.log('  enquanto você digita — isso é de propósito.');
console.log();

const chave = await perguntaEmSilencio('  Chave: ');

if (!chave) {
  console.error('  Nada foi digitado. Nada foi gravado.\n');
  process.exit(1);
}

if (!chave.startsWith('$aact_')) {
  console.error('  Isso não parece uma chave do Asaas — elas começam com $aact_.');
  console.error('  Nada foi gravado. (Confira se não colou o e-mail ou o ID da conta.)\n');
  process.exit(1);
}

if (!chave.startsWith(prefixoEsperado)) {
  const veio = chave.startsWith(PREFIXO.sandbox) ? 'SANDBOX'
             : chave.startsWith(PREFIXO.producao) ? 'PRODUÇÃO'
             : 'desconhecido';
  console.error(`  Você pediu ${alvo.toUpperCase()}, mas colou uma chave de ${veio}.`);
  console.error('  Nada foi gravado — misturar os dois é o erro que faz uma');
  console.error('  cobrança de teste virar cobrança de verdade.');
  console.error(
    alvo === 'sandbox'
      ? '\n  Se era mesmo a de produção:  npm run asaas-chave -- --producao\n'
      : '\n  Se era mesmo a de sandbox:   npm run asaas-chave\n',
  );
  process.exit(1);
}

gravaChave(chave);

console.log(`  Guardada: ${encoberta(chave)}`);
console.log('  Onde    : web/.env.local  (ignorado pelo Git)');
console.log();
console.log('  Agora teste se ela funciona:');
console.log('    npm run prova-asaas');
console.log();
if (alvo === 'sandbox') {
  console.log('  ⚠ Reinicie o `npm run dev` — ele lê o .env.local só na partida.');
  console.log();
}
