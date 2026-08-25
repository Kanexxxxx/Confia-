/* =============================================================
   confiia.com.br — prepara uma conta para TESTAR o site

   Cria (ou reaproveita) uma conta com senha conhecida, e-mail já
   confirmado e SEM segundo fator, para dar para entrar e navegar
   sem depender do celular.

   Uso:
     npm run conta-teste                  → conta comum
     npm run conta-teste -- --admin       → conta com acesso ao painel
     npm run conta-teste -- --email=x@y.z --senha=outrasenha

   ─────────────────────────────────────────────────────────────
   POR QUE ISTO SÓ RODA CONTRA O BANCO DE DESENVOLVIMENTO

   Um script que planta senha conhecida é uma porta dos fundos.
   Em produção seria a falha mais boba possível: a conta de teste
   fica lá, com senha que está escrita neste arquivo, no
   repositório, para sempre.

   Por isso ele CONFERE o nome do banco antes de qualquer coisa e
   se recusa a rodar se não for `confia_dev`. Não é um aviso: é
   uma trava.
   ─────────────────────────────────────────────────────────────

   CUIDADO AO MEXER:
     - O formato do hash tem que continuar igual ao de
       src/lib/senha.ts: `scrypt$N$r$p$sal$hash`, base64. Se
       aquele arquivo mudar de custo, mude aqui também — senão o
       login rejeita a senha e ninguém entende por quê.
   ============================================================= */

import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import postgres from 'postgres';

const scrypt = promisify(scryptCb);

/* Iguais aos de src/lib/senha.ts. */
const CUSTO_N = 32_768;
const CUSTO_R = 8;
const CUSTO_P = 1;
const TAMANHO_HASH = 64;
const TAMANHO_SAL = 16;

async function guardaSenha(senha) {
  const sal = randomBytes(TAMANHO_SAL);
  const hash = await scrypt(senha.normalize('NFKC'), sal, TAMANHO_HASH, {
    N: CUSTO_N, r: CUSTO_R, p: CUSTO_P, maxmem: 128 * CUSTO_N * CUSTO_R * 2,
  });
  return ['scrypt', CUSTO_N, CUSTO_R, CUSTO_P,
    sal.toString('base64'), hash.toString('base64')].join('$');
}

/* ---------- argumentos ---------- */
const args = process.argv.slice(2);
const pega = (nome, padrao) => {
  const a = args.find((x) => x.startsWith(`--${nome}=`));
  return a ? a.slice(nome.length + 3) : padrao;
};

const EMAIL = pega('email', 'voce@confiia.com.br');
const SENHA = pega('senha', 'testando-o-confia-2026');
const NOME = pega('nome', 'Kaina Rodrigues');
const ADMIN = args.includes('--admin');

/* ---------- a trava ---------- */
const url = process.env.DATABASE_URL_MIGRACAO || process.env.DATABASE_URL;
if (!url) {
  console.error('\n  Falta DATABASE_URL. Rode com: node --env-file=.env.local\n');
  process.exit(1);
}

const nomeDoBanco = new URL(url).pathname.replace(/^\//, '');
if (nomeDoBanco !== 'confia_dev') {
  console.error(`\n  RECUSADO. Este script só roda contra 'confia_dev'.`);
  console.error(`  O banco apontado é '${nomeDoBanco}'.\n`);
  console.error('  Ele planta uma senha conhecida — em produção isso é uma porta dos fundos.\n');
  process.exit(1);
}

const sql = postgres(url);

try {
  const hash = await guardaSenha(SENHA);
  const agora = new Date();

  const [conta] = await sql`
    INSERT INTO contas (email, nome, senha_hash, email_verificado_em,
                        aceitou_termos_em, aceitou_termos_versao, apelido, avatar)
    VALUES (${EMAIL}, ${NOME}, ${hash}, ${agora},
            ${agora}, '1.0', ${NOME.split(' ')[0]}, 'coruja')
    ON CONFLICT (email) DO UPDATE SET
      senha_hash          = EXCLUDED.senha_hash,
      email_verificado_em = EXCLUDED.email_verificado_em,
      excluida_em         = NULL,
      status              = 'ativa',
      /* Desliga o segundo fator: sem o celular na mão, ele
         impediria justamente o teste que este script existe para
         permitir. */
      totp_segredo        = NULL,
      totp_ativado_em     = NULL
    RETURNING id, email, nome
  `;

  /* ---------- acesso de administrador ----------

     O BANCO SE RECUSA a marcar como admin uma conta sem segundo
     fator. Essa trava está em 011_dois_fatores.sql, e ela está
     CERTA: painel de administração protegido só por senha é uma
     chave única para a base inteira.

     Então este script não burla a trava — ele CUMPRE. Configura o
     TOTP de verdade e imprime a chave para você cadastrar no
     autenticador uma vez só. */
  let virouAdmin = false;
  let segredoTotp = null;

  if (ADMIN) {
    const [tabela] = await sql`SELECT to_regclass('public.admins') IS NOT NULL AS existe`;
    if (tabela?.existe) {
      segredoTotp = new OTPAuth.Secret({ size: 20 }).base32;

      await sql`
        UPDATE contas
           SET totp_segredo    = ${segredoTotp},
               totp_ativado_em = now()
         WHERE id = ${conta.id}
      `;

      /* `nivel` 1 = dono, 2 = operação (ver 001_schema.sql). */
      await sql`
        INSERT INTO admins (conta_id, nivel)
        VALUES (${conta.id}, 1)
        ON CONFLICT (conta_id) DO UPDATE SET nivel = 1
      `;
      virouAdmin = true;
    }
  }

  /* Toda sessão antiga cai: se a senha mudou, quem estava dentro
     com a senha velha não continua dentro. */
  await sql`UPDATE sessoes SET revogada_em = now() WHERE conta_id = ${conta.id} AND revogada_em IS NULL`;

  console.log('\n  Conta de teste pronta:\n');
  console.log(`    e-mail : ${conta.email}`);
  console.log(`    senha  : ${SENHA}`);
  console.log(`    2FA    : ${segredoTotp ? 'LIGADO (obrigatório para admin)' : 'desligado'}`);
  if (ADMIN) console.log(`    admin  : ${virouAdmin ? 'sim' : 'NÃO (tabela admins não existe ainda)'}`);

  if (segredoTotp) {
    const totp = new OTPAuth.TOTP({
      issuer: 'confia?', label: conta.email,
      algorithm: 'SHA1', digits: 6, period: 30,
      secret: OTPAuth.Secret.fromBase32(segredoTotp),
    });
    console.log('\n  ── SEGUNDO FATOR ──────────────────────────────────');
    console.log('  O banco EXIGE 2FA para conta de admin, e essa trava');
    console.log('  está certa. Cadastre uma vez no autenticador:');
    console.log(`\n    chave manual : ${segredoTotp}`);
    console.log(`    ou este link : ${totp.toString()}`);
    console.log(`\n    código agora : ${totp.generate()}  (troca a cada 30s)`);
    console.log('  ───────────────────────────────────────────────────');
  }

  console.log('\n  Entre em http://localhost:3000/entrar\n');
} catch (e) {
  console.error('\n  Falhou:', e.message, '\n');
  process.exitCode = 1;
} finally {
  await sql.end();
}
