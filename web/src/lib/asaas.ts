import 'server-only';

/* =============================================================
   confiia.com.br — a conversa com o Asaas

   ⚠ `import 'server-only'` NO TOPO, E ELE NÃO É ENFEITE.

   A chave do Asaas move dinheiro de verdade. Se algum dia alguém
   importar este arquivo num componente de cliente, o build QUEBRA
   aqui em vez de publicar a chave dentro do JavaScript que todo
   visitante baixa. É a mesma trava de `armadilha.ts`, e ela está
   aqui pela mesma razão: já aconteceu neste projeto de segredo
   escorregar para o navegador (ver CLAUDE.md, "não assine nada no
   navegador").

   E nunca, em hipótese nenhuma, prefixe a chave com
   NEXT_PUBLIC_. O prefixo é o que publica.

   ─────────────────────────────────────────────────────────────
   O AMBIENTE É DEDUZIDO DA CHAVE, E ISSO É DE PROPÓSITO

   O Asaas tem dois mundos: sandbox (dinheiro de mentira) e
   produção (dinheiro de verdade). Cada um tem sua própria chave e
   seu próprio endereço.

   Eu poderia ter criado uma variável `ASAAS_AMBIENTE` para dizer
   qual usar. NÃO CRIEI, de propósito: duas variáveis podem
   discordar uma da outra. Uma chave de sandbox com
   `ASAAS_AMBIENTE=producao` apontaria a chave de teste para o
   servidor de dinheiro real — e o erro só apareceria na hora de
   cobrar alguém.

   O prefixo da chave já diz tudo, e ele não mente:
     $aact_hmlg_  → sandbox   → https://api-sandbox.asaas.com/v3
     $aact_prod_  → produção  → https://api.asaas.com/v3

   Fonte: https://docs.asaas.com/docs/authentication
   ───────────────────────────────────────────────────────────── */

import { env } from '@/lib/env';

export type AmbienteAsaas = 'sandbox' | 'producao';

const ENDERECOS: Record<AmbienteAsaas, string> = {
  sandbox: 'https://api-sandbox.asaas.com/v3',
  producao: 'https://api.asaas.com/v3',
};

/* O User-Agent é OBRIGATÓRIO para contas criadas depois de
   13/06/2024 — a nossa é de 2026. Sem ele o Asaas recusa, e a
   mensagem de erro não diz que o problema é este. */
const USER_AGENT = 'confia? (confiia.com.br)';

/* Lê o prefixo e devolve o mundo. `null` quando a chave não
   existe ou tem formato que a gente não reconhece — e o "não
   reconhecido" é tratado como erro, não como "deve ser produção".
   Chutar produção aqui seria chutar dinheiro real. */
export function ambienteDaChave(chave: string | undefined): AmbienteAsaas | null {
  if (!chave) return null;
  if (chave.startsWith('$aact_hmlg_')) return 'sandbox';
  if (chave.startsWith('$aact_prod_')) return 'producao';
  return null;
}

/* Para a tela e para os scripts: nunca imprima a chave inteira em
   log nenhum. Log vai para arquivo, arquivo vai para backup, e aí
   a chave está em três lugares que ninguém lembra de limpar. */
export function chaveEncoberta(chave: string | undefined): string {
  if (!chave) return '(nenhuma)';
  return `${chave.slice(0, 11)}…${chave.slice(-4)}`;
}

export type RespostaAsaas<T> =
  | { ok: true; dados: T; ambiente: AmbienteAsaas }
  | { ok: false; erro: string; status?: number; ambiente: AmbienteAsaas | null };

/* =============================================================
   A ÚNICA PORTA DE SAÍDA PARA O ASAAS

   Toda chamada passa por aqui. Não é burocracia: é o lugar onde
   ficam, num sítio só, o cabeçalho de autenticação, o tempo
   limite e a regra de nunca vazar a chave numa mensagem de erro.
   Código novo que chame `fetch` direto no Asaas perde as três.

   CUIDADO AO MEXER:
     - O cabeçalho é `access_token`, NÃO `Authorization: Bearer`.
       O Asaas não usa o padrão Bearer. Trocar isso dá 401 com
       mensagem que não explica nada.
     - O tempo limite existe porque sem ele uma chamada travada
       segura uma requisição do site inteiro. A VPS tem 1 núcleo.
   ============================================================= */
export async function chamaAsaas<T = unknown>(
  caminho: string,
  opcoes: { metodo?: string; corpo?: unknown; tempoLimiteMs?: number } = {},
): Promise<RespostaAsaas<T>> {
  const chave = env.ASAAS_API_KEY;
  const ambiente = ambienteDaChave(chave);

  if (!chave || !ambiente) {
    return {
      ok: false,
      ambiente: null,
      erro:
        'ASAAS_API_KEY ausente ou com formato desconhecido. '
        + 'A chave precisa começar com $aact_hmlg_ (sandbox) ou $aact_prod_ (produção). '
        + 'Use: npm run asaas-chave',
    };
  }

  const corta = AbortSignal.timeout(opcoes.tempoLimiteMs ?? 15_000);

  try {
    const resposta = await fetch(`${ENDERECOS[ambiente]}${caminho}`, {
      method: opcoes.metodo ?? 'GET',
      headers: {
        access_token: chave,
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT,
      },
      body: opcoes.corpo === undefined ? undefined : JSON.stringify(opcoes.corpo),
      signal: corta,
      /* Cobrança nunca pode vir de cache. */
      cache: 'no-store',
    });

    const texto = await resposta.text();
    const dados = texto ? JSON.parse(texto) : null;

    if (!resposta.ok) {
      /* A mensagem do Asaas entra; a chave, não. Erro vira log,
         log vira backup — e a chave não pode ir junto. */
      const detalhe =
        dados?.errors?.map((e: { description?: string }) => e.description).filter(Boolean).join('; ')
        || `HTTP ${resposta.status}`;
      return { ok: false, ambiente, status: resposta.status, erro: detalhe };
    }

    return { ok: true, ambiente, dados: dados as T };
  } catch (e) {
    const motivo = e instanceof Error ? e.message : String(e);
    return { ok: false, ambiente, erro: `não deu para falar com o Asaas: ${motivo}` };
  }
}
