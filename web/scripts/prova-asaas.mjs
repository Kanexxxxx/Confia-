/* =============================================================
   confiia.com.br — a chave do Asaas funciona mesmo?

   Uso:
     npm run prova-asaas

   ─────────────────────────────────────────────────────────────
   O QUE ESTA PROVA RESPONDE

   Guardar a chave e a chave FUNCIONAR são duas coisas. Esta prova
   fecha a distância entre as duas, e responde na ordem em que as
   coisas dão errado na vida real:

     1. a chave existe?
     2. o prefixo é de sandbox ou de produção?
     3. o endereço que a gente vai usar bate com esse prefixo?
     4. o Asaas aceita a chave?
     5. a conta está de pé e dá para ler dados dela?

   O passo 3 é o que mais morde: chave de sandbox contra o
   endereço de produção devolve 401, e o 401 faz todo mundo achar
   que a chave está errada. Ela não está — está no mundo errado.

   ─────────────────────────────────────────────────────────────
   ESTA PROVA NÃO CRIA NADA E NÃO COBRA NINGUÉM

   Ela só LÊ (`GET /customers?limit=1`). Nenhuma cobrança nasce,
   nenhum cliente é criado, nada é apagado. Dá para rodar quantas
   vezes quiser, inclusive com a chave de produção — e é por isso
   que ela usa leitura, e não o "cria uma cobrança de teste" que
   seria mais convincente e muito pior de rodar sem pensar.

   Endpoint e cabeçalhos conferidos em:
   https://docs.asaas.com/docs/authentication

   ─────────────────────────────────────────────────────────────
   CUIDADO AO MEXER — DUAS ARMADILHAS DO NODE NO WINDOWS

   1. NÃO use `process.exit()` aqui. Chamar `exit` com a conexão
      do `fetch` ainda fechando derruba o Node com uma asserção
      do libuv ("UV_HANDLE_CLOSING", em async.c) — o script já
      tinha terminado o trabalho e ainda assim aparecia um erro
      feio na tela de quem rodou. Por isso tudo acontece dentro de
      `principal()`, que DEVOLVE o código de saída, e o processo
      termina sozinho.

   2. SEMPRE consuma o corpo da resposta, mesmo quando ela é um
      erro que você vai ignorar. Corpo não lido deixa o socket
      aberto, e é o que segura o processo (ou faz ele estourar na
      saída, que foi o caso).
   ───────────────────────────────────────────────────────────── */

const ENDERECOS = {
  sandbox: 'https://api-sandbox.asaas.com/v3',
  producao: 'https://api.asaas.com/v3',
};

/* Repetido de `src/lib/asaas.ts` de propósito: este script roda
   fora do Next (sem os atalhos de `@/`), e um import quebrado
   aqui derrubaria a prova que existe justamente para dizer se as
   coisas estão de pé.

   SE VOCÊ MUDAR OS PREFIXOS OU OS ENDEREÇOS, MUDE NOS DOIS. */
function ambienteDaChave(k) {
  if (!k) return null;
  if (k.startsWith('$aact_hmlg_')) return 'sandbox';
  if (k.startsWith('$aact_prod_')) return 'producao';
  return null;
}

const encoberta = (k) => `${k.slice(0, 11)}…${k.slice(-4)}`;
const ok = (t, d) => console.log(`  ok    ${t.padEnd(38)} ${d}`);
const nao = (t, d) => console.log(`  NÃO   ${t.padEnd(38)} ${d}`);

async function principal() {
  const chave = process.env.ASAAS_API_KEY;

  console.log();

  /* ---------- 1. a chave existe? ---------- */
  if (!chave) {
    console.log('  Nenhuma chave do Asaas em web/.env.local.');
    console.log();
    console.log('  Para gravar (o terminal não mostra o que você digita):');
    console.log('    npm run asaas-chave');
    console.log();
    return 1;
  }
  ok('a chave existe', encoberta(chave));

  /* ---------- 2. sandbox ou produção? ---------- */
  const ambiente = ambienteDaChave(chave);
  if (!ambiente) {
    nao('o prefixo é reconhecido', 'não é $aact_hmlg_ nem $aact_prod_');
    console.log();
    console.log('  Uma chave do Asaas começa com um dos dois. Se a sua não');
    console.log('  começa, provavelmente foi copiado outro campo do painel.');
    console.log();
    return 1;
  }
  ok('o prefixo é reconhecido', ambiente === 'sandbox' ? 'SANDBOX' : 'PRODUÇÃO');

  /* ---------- 3. o endereço bate? ---------- */
  const base = ENDERECOS[ambiente];
  ok('o endereço bate com o prefixo', base);

  if (ambiente === 'producao') {
    console.log();
    console.log('  ⚠ Esta é a chave de PRODUÇÃO. Esta prova só lê, então nada');
    console.log('    é cobrado aqui — mas qualquer código que use esta chave');
    console.log('    mexe com dinheiro de gente real.');
  }

  /* ---------- 4 e 5. o Asaas aceita? ---------- */
  console.log();
  console.log('  Falando com o Asaas…');
  console.log();

  let resposta;
  let texto;
  try {
    resposta = await fetch(`${base}/customers?limit=1`, {
      headers: {
        access_token: chave,
        'Content-Type': 'application/json',
        /* Obrigatório para contas criadas depois de 13/06/2024.
           Sem ele o Asaas recusa e a mensagem não diz o motivo. */
        'User-Agent': 'confia? (confiia.com.br)',
      },
      signal: AbortSignal.timeout(15_000),
    });
    /* Lido SEMPRE, inclusive no erro — ver a armadilha 2 no topo. */
    texto = await resposta.text();
  } catch (e) {
    nao('o Asaas respondeu', e instanceof Error ? e.message : String(e));
    console.log();
    console.log('  Isto costuma ser rede, não chave: internet caída, firewall');
    console.log('  ou o Asaas fora do ar. A chave nem chegou a ser julgada.');
    console.log();
    return 1;
  }

  if (resposta.status === 401) {
    nao('o Asaas aceita a chave', '401 — recusada');
    console.log();
    console.log('  As duas causas, em ordem de frequência:');
    console.log(`    1. a chave é de outro ambiente (esta foi lida como ${ambiente});`);
    console.log('    2. a chave foi revogada ou regerada no painel do Asaas.');
    console.log();
    return 1;
  }

  if (!resposta.ok) {
    nao('o Asaas aceita a chave', `HTTP ${resposta.status}`);
    console.log(`\n  Resposta: ${texto.slice(0, 300)}\n`);
    return 1;
  }

  ok('o Asaas aceita a chave', `HTTP ${resposta.status}`);

  let dados = null;
  try { dados = texto ? JSON.parse(texto) : null; } catch { /* segue */ }
  const total = typeof dados?.totalCount === 'number' ? dados.totalCount : '?';
  ok('dá para ler dados da conta', `${total} cliente(s) cadastrado(s)`);

  console.log();
  console.log(
    ambiente === 'sandbox'
      ? '  A chave de sandbox está de pé. Dá para construir a cobrança em cima dela.'
      : '  A chave de produção está de pé.',
  );
  console.log();
  console.log('  ⚠ O que esta prova NÃO testa, e ainda falta (ver ASAAS.md):');
  console.log('    · o webhook — precisa de endereço público, que é a Etapa 7;');
  console.log('    · a cobrança em si — ainda não existe código que cobre.');
  console.log();
  return 0;
}

/* `exitCode` e não `exit()`. Ver a armadilha 1 no topo. */
process.exitCode = await principal();
