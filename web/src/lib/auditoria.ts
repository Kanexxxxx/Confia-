/* =============================================================
   confiia.com.br — registro de auditoria

   Toda ação que muda a vida de alguém passa por aqui: suspender
   conta, deferir contestação, revelar dado pessoal, alterar plano.

   Chama a função `registra()` que já existe no banco
   (servidor/db/007_admin.sql). Ter um caminho só evita o problema
   clássico: metade do sistema gravando auditoria, metade não, e
   ninguém percebendo até precisar da informação que falta.

   CUIDADO AO MEXER:
     - NUNCA coloque senha, token ou o conteúdo de um documento
       dentro de `antes`/`depois`. Auditoria é lida por gente e
       fica guardada por anos. Guarde o QUE mudou, não o segredo.
     - Falha ao auditar não pode derrubar a ação principal, mas
       também não pode passar em silêncio — por isso o console.error.
   ============================================================= */

import { sql } from '@/db';

export type Acao =
  /* conta */
  | 'conta.criar' | 'conta.entrar' | 'conta.sair' | 'conta.entrar_negado'
  | 'conta.email_confirmado' | 'conta.senha_trocada' | 'conta.senha_esquecida'
  | 'conta.suspender' | 'conta.reativar' | 'conta.excluir'
  /* admin */
  | 'dado.revelar' | 'plano.alterar'
  | 'contestacao.decidir' | 'denuncia.decidir' | 'empresa.decidir';

type Registro = {
  ator?: string | null;      // conta que fez (nulo = anônimo ou sistema)
  acao: Acao;
  alvoTipo?: string | null;  // 'conta' | 'contestacao' | 'empresa' | ...
  alvoId?: string | null;
  antes?: unknown;
  depois?: unknown;
  ip?: string | null;
};

export async function registra(r: Registro): Promise<void> {
  try {
    await sql`
      SELECT registra(
        ${r.ator ?? null}::uuid,
        ${r.acao}::text,
        ${r.alvoTipo ?? null}::text,
        ${r.alvoId ?? null}::text,
        ${r.antes ? JSON.stringify(r.antes) : null}::jsonb,
        ${r.depois ? JSON.stringify(r.depois) : null}::jsonb,
        ${r.ip ?? null}::inet
      )
    `;
  } catch (e) {
    /* A ação principal já aconteceu. Derrubá-la agora seria pior:
       o usuário veria erro numa operação que deu certo. Mas isto
       precisa gritar no log — auditoria falhando é problema sério. */
    console.error('[auditoria] NÃO GRAVOU:', r.acao, e);
  }
}
