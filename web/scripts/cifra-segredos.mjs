/* =============================================================
   confiia.com.br — cifra os segredos de 2FA que já estão gravados

   Uso:
     npm run cifra-segredos -- --conferir   (só mostra, não muda)
     npm run cifra-segredos                 (cifra de verdade)

   ─────────────────────────────────────────────────────────────
   O QUE ESTE SCRIPT CONSERTA

   Os segredos do segundo fator foram gravados em TEXTO PURO
   antes de `cofre.ts` existir. Uma cópia do banco permitiria
   gerar o código de 6 dígitos de qualquer conta — o segundo
   fator existiria no papel e não na prática.

   Ele cifra o que ainda está em claro, e ignora o que já está
   cifrado. Rodar duas vezes não faz mal.

   ─────────────────────────────────────────────────────────────
   CUIDADO AO MEXER:
     - FAÇA BACKUP ANTES. Se `COFRE_CHAVE` mudar depois disso,
       os segredos viram bytes sem significado e todas as contas
       com 2FA ficam trancadas do lado de fora.
     - Rode com `--conferir` primeiro. Ele mostra quantas linhas
       seriam tocadas sem tocar em nenhuma.
     - Uma transação por conta, não uma para todas: se falhar no
       meio, o que já passou continua válido e o resto roda na
       próxima vez.
   ============================================================= */

import { createCipheriv, randomBytes, createHash } from 'node:crypto';
import postgres from 'postgres';

const CONFERIR = process.argv.includes('--conferir');

/* Mesma implementação de src/lib/cofre.ts. Duplicada de propósito:
   este script roda fora do Next e não consegue importar de `@/`.
   Se o formato mudar lá, mude aqui — está escrito nos dois. */
const VERSAO = 'v1';
const ALGORITMO = 'aes-256-gcm';

function chave() {
  const bruta = process.env.COFRE_CHAVE;
  if (!bruta || bruta.length < 32) {
    console.error('\n  COFRE_CHAVE ausente ou curta demais no .env.local.\n');
    process.exit(1);
  }
  return createHash('sha256').update(bruta).digest();
}

function guardaNoCofre(claro) {
  const iv = randomBytes(12);
  const cifra = createCipheriv(ALGORITMO, chave(), iv);
  const cifrado = Buffer.concat([cifra.update(claro, 'utf8'), cifra.final()]);
  return [VERSAO, iv.toString('base64'),
    cifra.getAuthTag().toString('base64'), cifrado.toString('base64')].join('$');
}

const url = process.env.DATABASE_URL_MIGRACAO || process.env.DATABASE_URL;
if (!url) {
  console.error('\n  Falta DATABASE_URL. Rode com: node --env-file=.env.local\n');
  process.exit(1);
}

const sql = postgres(url);
const banco = new URL(url).pathname.replace(/^\//, '');

try {
  const contas = await sql`
    SELECT id, email, totp_segredo
      FROM contas
     WHERE totp_segredo IS NOT NULL
       AND totp_segredo NOT LIKE ${VERSAO + '$%'}
  `;

  const [{ ja }] = await sql`
    SELECT count(*)::int AS ja FROM contas WHERE totp_segredo LIKE ${VERSAO + '$%'}
  `;

  console.log(`\n  Banco: ${banco}`);
  console.log(`  Já cifrados : ${ja}`);
  console.log(`  Em texto puro: ${contas.length}\n`);

  if (contas.length === 0) {
    console.log('  Nada a fazer.\n');
  } else if (CONFERIR) {
    for (const c of contas) console.log(`    ${c.email}`);
    console.log('\n  Modo conferência: nada foi alterado.');
    console.log('  Rode sem --conferir para cifrar.\n');
  } else {
    let feitos = 0;
    for (const c of contas) {
      await sql`
        UPDATE contas SET totp_segredo = ${guardaNoCofre(c.totp_segredo)}
         WHERE id = ${c.id}
      `;
      feitos++;
      console.log(`    ${c.email}  cifrado`);
    }
    console.log(`\n  ${feitos} segredo(s) cifrado(s).`);
    console.log('  GUARDE UMA CÓPIA DA COFRE_CHAVE: sem ela, nenhum deles volta.\n');
  }
} catch (e) {
  console.error('\n  Falhou:', e.message, '\n');
  process.exitCode = 1;
} finally {
  await sql.end();
}
