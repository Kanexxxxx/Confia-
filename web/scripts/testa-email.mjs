/* =============================================================
   confiia.com.br — confere o Resend de ponta a ponta

   Uso:
     node scripts/testa-email.mjs                    (só confere)
     node scripts/testa-email.mjs voce@exemplo.com   (confere e envia)

   O QUE ELE FAZ:
     1. lê a chave do .env.local
     2. pergunta ao Resend se o domínio está verificado
     3. mostra quais registros de DNS ele considera prontos
     4. se você passar um e-mail, manda um de teste de verdade

   A CHAVE NUNCA É IMPRESSA. Só o prefixo e o tamanho, o
   suficiente para saber se ela chegou inteira no arquivo.

   CUIDADO AO MEXER:
     - Este script fala com a internet e gasta cota de envio.
       Não coloque em laço nem em teste automático.
   ============================================================= */

import { loadEnvFile } from 'node:process';

try {
  loadEnvFile('.env.local');
} catch {
  console.error('\n  ✗ Não achei o web/.env.local. Rode de dentro da pasta web/.\n');
  process.exit(1);
}

const chave = process.env.RESEND_API_KEY;
const remetente = process.env.EMAIL_REMETENTE;
const resposta = process.env.EMAIL_RESPOSTA;
const destino = process.argv[2];

const verde = (t) => `\x1b[32m${t}\x1b[0m`;
const vermelho = (t) => `\x1b[31m${t}\x1b[0m`;
const amarelo = (t) => `\x1b[33m${t}\x1b[0m`;

console.log('\n  ── Resend ──────────────────────────────────\n');

/* ---------- 1. a chave chegou? ---------- */
if (!chave) {
  console.error(vermelho('  ✗ RESEND_API_KEY não está no .env.local'));
  process.exit(1);
}
if (!chave.startsWith('re_')) {
  console.error(vermelho(`  ✗ A chave não começa com "re_". Veio truncada ou é outra coisa.`));
  process.exit(1);
}
/* Mostra só o começo — o bastante para conferir sem expor. */
console.log(`  chave ............ ${verde('presente')}  ${chave.slice(0, 6)}…${' '}(${chave.length} caracteres)`);
console.log(`  remetente ........ ${remetente ?? vermelho('FALTANDO')}`);
console.log(`  responder para ... ${resposta ?? amarelo('não definido')}`);

async function resend(caminho, opcoes = {}) {
  const r = await fetch(`https://api.resend.com${caminho}`, {
    ...opcoes,
    headers: {
      Authorization: `Bearer ${chave}`,
      'Content-Type': 'application/json',
      ...(opcoes.headers ?? {}),
    },
  });
  const corpo = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, corpo };
}

/* ---------- 2. a chave é aceita? ---------- */
console.log('\n  ── Domínio ─────────────────────────────────\n');

const dominios = await resend('/domains');

/* 401/403 aqui NÃO é erro de chave.
   Chave criada com "Sending access" limitada a um domínio não tem
   permissão para LISTAR domínios — só para enviar. É de propósito:
   se ela vazar, quem pegar não consegue nem descobrir o que existe
   na conta. Então seguimos para o teste que importa: enviar. */
const chaveRestrita = dominios.status === 401 || dominios.status === 403;

if (chaveRestrita) {
  console.log(verde('  ✓ chave restrita a envio') + ' — não lista domínios, e isso é o certo.');
  console.log('    A prova de que funciona é o envio abaixo.');
} else if (!dominios.ok) {
  console.error(vermelho(`  ✗ O Resend respondeu ${dominios.status}.`));
  console.error('   ', JSON.stringify(dominios.corpo));
  process.exit(1);
}

const lista = chaveRestrita ? [] : (dominios.corpo?.data ?? []);
if (!chaveRestrita && lista.length === 0) {
  console.log(amarelo('  ⚠ A chave funciona, mas nenhum domínio aparece nela.'));
  console.log('    Se a chave foi criada limitada a um domínio, isso é normal —');
  console.log('    ela consegue enviar, mas não consegue listar.');
} else {
  for (const d of lista) {
    const pronto = d.status === 'verified';
    console.log(`  ${pronto ? verde('✓') : amarelo('…')} ${d.name}  ${pronto ? verde(d.status) : amarelo(d.status)}  (${d.region ?? '—'})`);
    for (const reg of d.records ?? []) {
      const okReg = reg.status === 'verified';
      console.log(
        `      ${okReg ? verde('✓') : amarelo('…')} ${reg.record.padEnd(6)} ${String(reg.name).slice(0, 34).padEnd(34)} ${okReg ? '' : amarelo(reg.status)}`,
      );
    }
  }
}

/* ---------- 3. envio de verdade ---------- */
if (!destino) {
  console.log('\n  Para enviar um teste de verdade:');
  console.log('      node scripts/testa-email.mjs seu@email.com\n');
  process.exit(0);
}

console.log(`\n  ── Enviando para ${destino} ─────────────\n`);

const envio = await resend('/emails', {
  method: 'POST',
  body: JSON.stringify({
    from: remetente,
    to: [destino],
    ...(resposta ? { reply_to: resposta } : {}),
    subject: 'confia? — teste de envio',
    text:
      'Se você está lendo isto, o envio de e-mail do confia? está funcionando.\n\n' +
      'Confira três coisas:\n' +
      '  1. caiu na caixa de entrada, e não no spam;\n' +
      '  2. o remetente aparece como "confia?";\n' +
      '  3. ao responder, o destino é contato@confiia.com.br.\n\n' +
      'Enviado pela Etapa 4 do PLANO.md.',
    html:
      '<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:28px;' +
      'background:#050f1e;color:#e9f1fc;border-radius:14px">' +
      '<h1 style="margin:0 0 6px;font-size:20px;color:#fff">confia?</h1>' +
      '<p style="margin:0 0 22px;font-size:13px;color:rgba(233,241,252,.45)">teste de envio</p>' +
      '<p style="line-height:1.7;color:rgba(233,241,252,.75)">Se você está lendo isto, o envio de e-mail ' +
      'do confia? está funcionando.</p>' +
      '<p style="line-height:1.7;color:rgba(233,241,252,.75)">Confira três coisas:</p>' +
      '<ol style="line-height:1.9;color:rgba(233,241,252,.75);padding-left:20px">' +
      '<li>caiu na <b style="color:#e9f1fc">caixa de entrada</b>, e não no spam;</li>' +
      '<li>o remetente aparece como <b style="color:#e9f1fc">confia?</b>;</li>' +
      '<li>ao responder, o destino é <b style="color:#e9f1fc">contato@confiia.com.br</b>.</li>' +
      '</ol>' +
      '<p style="margin-top:24px;padding-top:16px;border-top:1px solid rgba(255,255,255,.09);' +
      'font-size:12px;color:rgba(233,241,252,.4)">Enviado pela Etapa 4 do PLANO.md.</p>' +
      '</div>',
  }),
});

if (!envio.ok) {
  console.error(vermelho(`  ✗ Não enviou (${envio.status}).`));
  console.error('   ', JSON.stringify(envio.corpo, null, 2));
  if (envio.corpo?.message?.includes('domain')) {
    console.error('\n    Costuma ser o remetente: o domínio do EMAIL_REMETENTE');
    console.error('    precisa ser exatamente o que está verificado no Resend.');
  }
  process.exit(1);
}

console.log(verde('  ✓ Enviado.'));
console.log(`    id: ${envio.corpo?.id}`);
console.log('\n    Confira a caixa de entrada — e o spam também.');
console.log('    Se caiu no spam, o problema é reputação, não configuração:');
console.log('    domínio novo demora alguns envios para ganhar confiança.\n');
