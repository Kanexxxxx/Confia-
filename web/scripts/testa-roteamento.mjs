/* =============================================================
   confiia.com.br — o roteamento de e-mail do Cloudflare funciona?

   Uso:  node scripts/testa-roteamento.mjs contato@confiia.com.br

   POR QUE ISTO EXISTE:
   O Resend só cuida de ENVIAR. Quem RECEBE em @confiia.com.br é o
   Email Routing do Cloudflare, que encaminha para o seu Gmail.
   São dois serviços diferentes, e um funcionando não diz nada
   sobre o outro.

   Em vez de procurar no painel se a regra existe, este script
   manda um e-mail de verdade para o endereço e pergunta ao Resend
   o que aconteceu com ele:

     delivered  -> a regra existe e o encaminhamento funciona
     bounced    -> não existe regra para esse endereço
     (nada)     -> ainda em trânsito, rode de novo em um minuto

   CUIDADO AO MEXER:
     - Gasta cota de envio. Não coloque em laço.
   ============================================================= */

import { loadEnvFile } from 'node:process';

try { loadEnvFile('.env.local'); } catch {
  console.error('\n  ✗ Rode de dentro da pasta web/.\n');
  process.exit(1);
}

const chave = process.env.RESEND_API_KEY;
const remetente = process.env.EMAIL_REMETENTE;
const destino = process.argv[2] ?? process.env.EMAIL_RESPOSTA;

const verde = (t) => `\x1b[32m${t}\x1b[0m`;
const vermelho = (t) => `\x1b[31m${t}\x1b[0m`;
const amarelo = (t) => `\x1b[33m${t}\x1b[0m`;

if (!chave || !remetente || !destino) {
  console.error(vermelho('\n  ✗ Falta RESEND_API_KEY, EMAIL_REMETENTE ou o destino.\n'));
  process.exit(1);
}

async function resend(caminho, opcoes = {}) {
  const r = await fetch(`https://api.resend.com${caminho}`, {
    ...opcoes,
    headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json', ...(opcoes.headers ?? {}) },
  });
  return { ok: r.ok, status: r.status, corpo: await r.json().catch(() => ({})) };
}

console.log(`\n  ── Testando o recebimento em ${destino} ──\n`);

const envio = await resend('/emails', {
  method: 'POST',
  body: JSON.stringify({
    from: remetente,
    to: [destino],
    subject: 'confia? — teste de recebimento',
    text:
      'Este e-mail foi enviado PARA o endereço do domínio, não para o seu Gmail direto.\n\n' +
      'Se ele chegou na sua caixa, o Email Routing do Cloudflare está encaminhando\n' +
      'certo — e resposta de cliente vai chegar até você.\n\n' +
      'Se não chegou, falta criar a regra no Cloudflare.',
  }),
});

if (!envio.ok) {
  console.error(vermelho(`  ✗ O Resend não aceitou o envio (${envio.status}).`));
  console.error('   ', JSON.stringify(envio.corpo));
  process.exit(1);
}

const id = envio.corpo?.id;
console.log(`  enviado · id ${id}`);
console.log('  perguntando o que aconteceu com ele...\n');

/* O resultado da entrega não é imediato: o Resend precisa falar
   com o servidor do Cloudflare e esperar a resposta. */
let ultimo = null;
for (let tentativa = 1; tentativa <= 8; tentativa++) {
  await new Promise((r) => setTimeout(r, 4000));
  const consulta = await resend(`/emails/${id}`);

  if (consulta.status === 401 || consulta.status === 403) {
    console.log(amarelo('  ⚠ A chave é restrita a envio e não consegue consultar o resultado.'));
    console.log('    Confira direto no seu Gmail se o e-mail chegou.\n');
    process.exit(0);
  }

  ultimo = consulta.corpo?.last_event ?? null;
  process.stdout.write(`  ${tentativa}/8 · ${ultimo ?? 'aguardando'}          \r`);

  if (ultimo && ultimo !== 'sent' && ultimo !== 'queued') break;
}

console.log('\n');

if (ultimo === 'delivered') {
  console.log(verde('  ✓ ENTREGUE — o roteamento do Cloudflare está funcionando.'));
  console.log('    Resposta de cliente vai chegar no seu Gmail.\n');
} else if (ultimo === 'bounced') {
  console.log(vermelho('  ✗ RECUSADO — não existe regra para esse endereço.'));
  console.log('    Precisa criar no Cloudflare: E-mail → Email Routing.\n');
} else if (ultimo === 'complained') {
  console.log(amarelo('  ⚠ Marcado como spam pelo destinatário.\n'));
} else {
  console.log(amarelo(`  … ainda em trânsito (${ultimo ?? 'sem resposta'}).`));
  console.log('    Rode de novo em um minuto, ou olhe direto no Gmail.\n');
}
