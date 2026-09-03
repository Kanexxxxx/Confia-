/* =============================================================
   confiia.com.br — testar cobrança de verdade, na conta de verdade

   Uso:
     npm run asaas-teste -- --quem            → acha você entre os clientes
     npm run asaas-teste -- --cobrar          → cria um Pix de R$ 5,00 (piso do Asaas)
     npm run asaas-teste -- --cobrar --valor=2.50
     npm run asaas-teste -- --situacao        → foi pago?
     npm run asaas-teste -- --limpar          → apaga as cobranças de teste

   ─────────────────────────────────────────────────────────────
   ⚠ ISTO RODA EM PRODUÇÃO. O DINHEIRO É DE VERDADE.

   Decisão da dona do projeto em 27/08/2026: ela não tem conta de
   sandbox, e preferiu testar na conta real cobrando a si mesma.
   O plano já previa isso — PLANO.md, Etapa 9: "você assina o
   Básico com Pix, no seu próprio cartão".

   O dinheiro sai dela e volta para ela, menos a taxa do Asaas.
   O risco não é perder dinheiro: é a cobrança de teste virar
   registro real numa conta que JÁ TEM CLIENTES DE VERDADE — e
   isso aparece em extrato e em nota fiscal.

   Por isso este script inteiro é construído em cima de uma ideia
   só: TESTE TEM QUE SER RECONHECÍVEL E REVERSÍVEL.
   ─────────────────────────────────────────────────────────────

   AS SEIS TRAVAS, E POR QUE CADA UMA EXISTE

     1. Teto de R$ 10,00. Um erro de digitação num teste não pode
        virar uma cobrança de R$ 500. O padrão é R$ 5,00, que é o
        MENOR valor que o Asaas aceita — ver PISO_ASAAS abaixo.

     2. Confirmação escrita à mão. Rodar sem querer não cobra
        ninguém: é preciso digitar COBRAR.

     3. Toda cobrança nasce marcada com `externalReference`
        começando em TESTE-CONFIA. É o que separa teste de
        cliente real, e é o único critério que `--limpar` aceita.

     4. `--limpar` NUNCA toca em nada sem essa marca. Os clientes
        que já existiam na conta não são vistos por ele.

     5. `--limpar` se recusa a apagar cobrança PAGA. A própria
        documentação do Asaas avisa: exclusão não é estorno. Se
        já foi paga, o caminho é reembolso, e é decisão de gente.

     6. Nenhum cliente novo é criado. O script reaproveita o que
        já existe (`--quem` acha), porque criar cliente de teste
        numa base real é exatamente o lixo que a gente quer
        evitar.

   CUIDADO AO MEXER:
     - Este script NÃO grava nada no nosso banco. Ele é uma sonda
       para ver o Asaas funcionando, não a integração. A
       integração de verdade é a Etapa 9 e passa por
       `src/lib/asaas.ts`.
     - Não imprima a chave, nunca. E o CPF dos clientes sai
       mascarado de propósito: a conta tem gente real.
   ============================================================= */

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';

const AQUI = dirname(fileURLToPath(import.meta.url));

const chave = process.env.ASAAS_API_KEY;
const args = process.argv.slice(2);
const pega = (nome, padrao) => {
  const a = args.find((x) => x.startsWith(`--${nome}=`));
  return a ? a.slice(nome.length + 3) : padrao;
};

/* O PISO É DO ASAAS, NÃO NOSSO — descoberto na marra em
   27/08/2026, tentando cobrar R$ 1,00:

     HTTP 400 — "O valor da cobrança (R$ 1,00) menos o valor do
     desconto (R$ 0,00) não pode ser menor que R$ 5,00."

   Ou seja: não existe teste mais barato que R$ 5,00 no Asaas.
   Isso muda o plano de preços também — o Básico de R$ 12,90
   passa, mas qualquer ideia de cobrança avulsa abaixo de R$ 5
   não existe nesta plataforma. Anotado em ASAAS.md. */
const PISO_ASAAS = 5;
const PADRAO = 5;                     /* o mais barato que dá */
const TETO = 10;                      /* trava 1 */
const MARCA = 'TESTE-CONFIA';         /* trava 3 */
const USER_AGENT = 'confia? (confiia.com.br)';

function ambienteDaChave(k) {
  if (!k) return null;
  if (k.startsWith('$aact_hmlg_')) return 'sandbox';
  if (k.startsWith('$aact_prod_')) return 'producao';
  return null;
}

const ambiente = ambienteDaChave(chave);
const BASE = ambiente === 'producao'
  ? 'https://api.asaas.com/v3'
  : 'https://api-sandbox.asaas.com/v3';

if (!ambiente) {
  console.log('\n  Sem chave do Asaas (ou com formato desconhecido).');
  console.log('  Grave com:  npm run asaas-chave\n');
  process.exitCode = 1;
}

/* Máscara para CPF/CNPJ: a conta tem clientes de verdade, e o
   documento deles não precisa aparecer na tela para você
   reconhecer qual é você. */
const mascara = (d) => (d && d.length > 5 ? `${d.slice(0, 3)}…${d.slice(-2)}` : '—');
const reais = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

async function asaas(caminho, opcoes = {}) {
  const r = await fetch(`${BASE}${caminho}`, {
    method: opcoes.metodo ?? 'GET',
    headers: {
      access_token: chave,
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
    },
    body: opcoes.corpo === undefined ? undefined : JSON.stringify(opcoes.corpo),
    signal: AbortSignal.timeout(20_000),
  });
  /* Corpo lido SEMPRE, mesmo no erro — senão o socket fica aberto
     e o Node estoura na saída (a mesma armadilha de prova-asaas). */
  const texto = await r.text();
  let dados = null;
  try { dados = texto ? JSON.parse(texto) : null; } catch { /* segue */ }
  return { status: r.status, ok: r.ok, dados, texto };
}

function pergunta(texto) {
  return new Promise((ok) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(texto, (r) => { rl.close(); ok(r.trim()); });
  });
}

function avisoDeProducao() {
  if (ambiente !== 'producao') return;
  console.log('  ┌──────────────────────────────────────────────────────────┐');
  console.log('  │  ⚠  CONTA DE PRODUÇÃO — O DINHEIRO É DE VERDADE          │');
  console.log('  │     A cobrança criada aqui é uma cobrança real, e vai    │');
  console.log('  │     aparecer no seu extrato do Asaas.                    │');
  console.log('  └──────────────────────────────────────────────────────────┘');
  console.log();
}

/* ============================================================
   --quem : achar você entre os clientes que já existem
   ============================================================ */
async function quem() {
  const busca = pega('nome', 'KAIN');
  console.log(`\n  Procurando cliente com nome parecido com "${busca}"…\n`);

  const r = await asaas(`/customers?name=${encodeURIComponent(busca)}&limit=20`);
  if (!r.ok) {
    console.log(`  O Asaas recusou: HTTP ${r.status}`);
    console.log(`  ${r.texto.slice(0, 200)}\n`);
    return 1;
  }

  const lista = r.dados?.data ?? [];
  if (!lista.length) {
    console.log('  Nenhum cliente com esse nome.');
    console.log('  Tente outro pedaço:  npm run asaas-teste -- --quem --nome=SEU_NOME\n');
    return 1;
  }

  console.log(`  ${lista.length} encontrado(s):\n`);
  for (const c of lista) {
    console.log(`    id        ${c.id}`);
    console.log(`    nome      ${c.name}`);
    console.log(`    e-mail    ${c.email || '—'}`);
    console.log(`    documento ${mascara(c.cpfCnpj)}`);
    console.log();
  }

  console.log('  Para cobrar um deles:');
  console.log(`    npm run asaas-teste -- --cobrar --cliente=${lista[0].id}\n`);
  return 0;
}

/* ============================================================
   --cobrar : cria um Pix pequeno, marcado como teste
   ============================================================ */
async function cobrar() {
  const cliente = pega('cliente');
  if (!cliente) {
    console.log('\n  Falta dizer qual cliente. Ache o seu com:');
    console.log('    npm run asaas-teste -- --quem\n');
    return 1;
  }

  const valor = Number(pega('valor', String(PADRAO)));
  if (!Number.isFinite(valor) || valor <= 0) {
    console.log('\n  Valor inválido. Ex.: --valor=5\n');
    return 1;
  }
  /* Barrado aqui em vez de deixar o Asaas recusar: a mensagem
     dele chega depois de a chamada sair, e explicar antes poupa
     a viagem e a confusão. */
  if (valor < PISO_ASAAS) {
    console.log(`\n  ${reais(valor)} está abaixo do piso do Asaas (${reais(PISO_ASAAS)}).`);
    console.log('  Não é trava nossa: a plataforma recusa com HTTP 400.\n');
    return 1;
  }
  /* trava 1 */
  if (valor > TETO) {
    console.log(`\n  ${reais(valor)} passa do teto de ${reais(TETO)} para teste.`);
    console.log('  O teto existe para um erro de digitação não virar cobrança grande.');
    console.log('  Se for proposital, mude a constante TETO neste arquivo — à mão,');
    console.log('  sabendo o que está fazendo.\n');
    return 1;
  }

  console.log();
  avisoDeProducao();

  /* Confere que o cliente existe e mostra QUEM vai ser cobrado.
     Cobrar o id errado numa base com clientes reais é o pior
     acidente possível aqui. */
  const c = await asaas(`/customers/${cliente}`);
  if (!c.ok) {
    console.log(`  Não achei esse cliente (HTTP ${c.status}).`);
    console.log('  Confira com:  npm run asaas-teste -- --quem\n');
    return 1;
  }

  console.log(`  Vai cobrar : ${c.dados.name}`);
  console.log(`  Documento  : ${mascara(c.dados.cpfCnpj)}`);
  console.log(`  Valor      : ${reais(valor)}`);
  console.log(`  Forma      : Pix`);
  console.log();

  /* trava 2 */
  const ok = await pergunta('  Digite COBRAR para confirmar (qualquer outra coisa cancela): ');
  if (ok !== 'COBRAR') {
    console.log('\n  Cancelado. Nada foi criado.\n');
    return 0;
  }

  /* Vence hoje: é um teste, não faz sentido deixar aberto por dias. */
  const hoje = new Date().toISOString().slice(0, 10);
  const referencia = `${MARCA}-${Date.now()}`;   /* trava 3 */

  console.log('\n  Criando a cobrança…\n');

  const p = await asaas('/payments', {
    metodo: 'POST',
    corpo: {
      customer: cliente,
      billingType: 'PIX',
      value: valor,
      dueDate: hoje,
      /* A descrição diz TESTE em maiúscula de propósito: se um dia
         isso aparecer num extrato ou numa nota, tem que ser óbvio
         que não foi venda. */
      description: 'TESTE do confia? — validacao tecnica do Pix, nao e venda',
      externalReference: referencia,
    },
  });

  if (!p.ok) {
    console.log(`  O Asaas recusou: HTTP ${p.status}`);
    const erros = p.dados?.errors?.map((e) => e.description).join('; ');
    console.log(`  ${erros || p.texto.slice(0, 300)}\n`);
    return 1;
  }

  const pag = p.dados;
  console.log(`  ok    cobrança criada        ${pag.id}`);
  console.log(`  ok    situação               ${pag.status}`);
  console.log(`  ok    marca de teste         ${referencia}`);
  if (pag.invoiceUrl) console.log(`  ok    página de pagamento   ${pag.invoiceUrl}`);

  /* O QR Code do Pix — o que a pessoa realmente usa. */
  const qr = await asaas(`/payments/${pag.id}/pixQrCode`);
  if (qr.ok && qr.dados?.payload) {
    console.log('\n  ── Pix copia e cola ──────────────────────────────────────\n');
    console.log(`  ${qr.dados.payload}`);
    console.log();

    if (qr.dados.encodedImage) {
      const arquivo = resolve(AQUI, '..', `pix-teste-${pag.id}.png`);
      writeFileSync(arquivo, Buffer.from(qr.dados.encodedImage, 'base64'));
      console.log(`  QR Code salvo em: web/pix-teste-${pag.id}.png`);
      console.log('  (abra o arquivo e leia com o app do banco)');
    }
    if (qr.dados.expirationDate) {
      console.log(`  Vence em: ${qr.dados.expirationDate}`);
    }
  } else {
    console.log('\n  ⚠ A cobrança foi criada, mas o QR Code não veio.');
    console.log('    Isso costuma ser Pix não ativado na conta do Asaas.');
    console.log(`    Dá para pagar pela página: ${pag.invoiceUrl || '(sem link)'}`);
  }

  console.log('\n  Depois de pagar, confira com:');
  console.log('    npm run asaas-teste -- --situacao');
  console.log('\n  Para apagar sem pagar:');
  console.log('    npm run asaas-teste -- --limpar\n');
  return 0;
}

/* ============================================================
   --situacao : o que aconteceu com as cobranças de teste
   ============================================================ */
async function situacao() {
  console.log('\n  Cobranças marcadas como teste:\n');

  const r = await asaas(`/payments?limit=50`);
  if (!r.ok) {
    console.log(`  O Asaas recusou: HTTP ${r.status}\n`);
    return 1;
  }

  /* trava 4: só o que tem a marca. */
  const testes = (r.dados?.data ?? []).filter(
    (p) => typeof p.externalReference === 'string' && p.externalReference.startsWith(MARCA),
  );

  if (!testes.length) {
    console.log('  Nenhuma. (Nada de teste foi criado, ou já foi limpo.)\n');
    return 0;
  }

  /* MOSTRA O LÍQUIDO, NÃO SÓ O BRUTO

     A dona do projeto pagou R$ 5,00 e recebeu R$ 3,01, e a tela
     antiga só dizia "R$ 5,00 RECEIVED" — o que fez parecer que
     alguma coisa tinha sido cobrada escondido. Não tinha: é a
     taxa de R$ 1,99 do Pix.

     Cobrança tem dois valores, e quem vende precisa ver os dois.
     Mostrar só o bruto é o tipo de meia-informação que este site
     existe para não fazer. */
  for (const p of testes) {
    const pago = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(p.status);
    console.log(`    ${p.id}   ${reais(p.value).padEnd(12)} ${p.status}${pago ? '  ← PAGA' : ''}`);
    if (typeof p.netValue === 'number' && p.netValue !== p.value) {
      const taxa = p.value - p.netValue;
      console.log(
        `      você recebe ${reais(p.netValue)}`
        + `   (taxa do Asaas: ${reais(taxa)}, ${((taxa / p.value) * 100).toFixed(1)}%)`,
      );
    }
  }
  console.log();
  return 0;
}

/* ============================================================
   --limpar : apaga as de teste, e só elas
   ============================================================ */
async function limpar() {
  console.log('\n  Procurando cobranças de teste para apagar…\n');

  const r = await asaas(`/payments?limit=50`);
  if (!r.ok) {
    console.log(`  O Asaas recusou: HTTP ${r.status}\n`);
    return 1;
  }

  const testes = (r.dados?.data ?? []).filter(
    (p) => typeof p.externalReference === 'string' && p.externalReference.startsWith(MARCA),
  );

  if (!testes.length) {
    console.log('  Nenhuma cobrança de teste. Nada a fazer.\n');
    return 0;
  }

  let apagadas = 0;
  for (const p of testes) {
    /* trava 5: paga não se apaga. */
    const pago = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(p.status);
    if (pago) {
      console.log(`    ${p.id}  ${p.status} — NÃO apagada.`);
      console.log('      Cobrança paga não se apaga: exclusão não é estorno.');
      console.log('      Se precisar devolver, use reembolso no painel do Asaas.');
      continue;
    }

    const d = await asaas(`/payments/${p.id}`, { metodo: 'DELETE' });
    if (d.ok) { console.log(`    ${p.id}  apagada`); apagadas++; }
    else console.log(`    ${p.id}  não deu (HTTP ${d.status})`);
  }

  console.log(`\n  ${apagadas} apagada(s).\n`);
  return 0;
}

/* ---------- despachante ---------- */
async function principal() {
  if (!ambiente) return 1;

  if (args.includes('--quem')) return quem();
  if (args.includes('--cobrar')) return cobrar();
  if (args.includes('--situacao')) return situacao();
  if (args.includes('--limpar')) return limpar();

  console.log(`
  Testar cobrança no Asaas — ambiente: ${ambiente === 'producao' ? 'PRODUÇÃO (dinheiro real)' : 'sandbox'}

    npm run asaas-teste -- --quem       acha você entre os clientes
    npm run asaas-teste -- --cobrar --cliente=<id>   cria um Pix de R$ 5,00
    npm run asaas-teste -- --situacao   foi pago?
    npm run asaas-teste -- --limpar     apaga as cobranças de teste

  Teto de teste: ${reais(TETO)}. Toda cobrança nasce marcada como ${MARCA}.
`);
  return 0;
}

process.exitCode = await principal();
