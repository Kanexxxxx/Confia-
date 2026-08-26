-- =============================================================
-- confiia.com.br — os gatilhos passam a rodar com a autoridade
--                  do banco, não com a de quem escreveu a linha
--
-- O QUE ESTA MIGRAÇÃO RESOLVE
--
-- A migração 015 cortou o acesso de `confia_app` de 52 objetos
-- para 14. O site continuou abrindo, entrando na conta e salvando
-- perfil. Mas a primeira denúncia enviada depois disso morreu com
-- "Não conseguimos registrar agora".
--
-- O motivo é uma coisa que não dá para ver lendo o código da
-- aplicação: um `INSERT INTO denuncias` de UMA linha dispara
-- QUATRO gatilhos, e três deles escrevem em OUTRAS tabelas —
-- `alvos`, `golpes_conhecidos`, `empresas`. Gatilho comum roda com
-- os direitos de quem provocou a escrita. Como quem provocou era
-- `confia_app`, e `confia_app` tinha acabado de perder o acesso
-- àquelas tabelas, o INSERT inteiro voltava atrás.
--
-- A lição, escrita aqui para não se perder: medir "o que a
-- aplicação usa" lendo o código da aplicação é medir menos do que
-- acontece. O banco faz trabalho por conta própria atrás de cada
-- escrita, e esse trabalho também precisa de direitos.
--
-- ─────────────────────────────────────────────────────────────
-- AS DUAS SAÍDAS, E POR QUE ESTA
--
--   (a) Devolver a `confia_app` escrita em `alvos`,
--       `golpes_conhecidos`, `empresas` e `empresa_eventos`.
--       Funciona — e joga fora metade do que a 015 conquistou.
--
--   (b) Fazer os gatilhos rodarem como o DONO deles.
--
-- (b), porque é o que descreve a verdade: derrubar a nota de um
-- alvo quando chega denúncia não é uma coisa que o site faz. É
-- uma coisa que o BANCO faz, sozinho, sempre, mesmo que a linha
-- venha de outro lugar. Quem é dono da regra deve ser dono da
-- autoridade para executá-la.
--
-- É o mesmo desenho que a 015 já deu à `registra()`: a aplicação
-- provoca, o banco realiza, e a aplicação nunca precisa poder
-- fazer aquilo com as próprias mãos.
--
-- ─────────────────────────────────────────────────────────────
-- POR QUE SÓ QUATRO FUNÇÕES E NÃO AS ONZE
--
-- Das onze que disparam nas tabelas graváveis, sete só mexem na
-- linha que está sendo escrita (`NEW.codigo := ...`). Essas não
-- precisam de direito nenhum além do que quem escreveu já tem.
-- Dar SECURITY DEFINER a elas seria poder de graça, que é
-- exatamente o que a 015 foi feita para tirar.
--
-- As quatro que sobram, e para onde escrevem:
--
--   conta_golpe                    → golpes_conhecidos
--   denuncia_derruba_alvo          → alvos
--   suspende_empresa_por_denuncia  → empresas, empresa_eventos
--   derruba_selo_sem_posse         → empresas
--
-- ─────────────────────────────────────────────────────────────
-- CUIDADO AO MEXER:
--   - `ALTER FUNCTION` e não `CREATE OR REPLACE`: o corpo destas
--     funções NÃO é copiado para cá. Copiar corpo é criar duas
--     versões da mesma regra e esperar que ninguém edite a
--     errada. Aqui só o modo de execução muda.
--   - `SET search_path` é obrigatório em SECURITY DEFINER e não é
--     formalidade: sem ele, quem chama pode criar um `alvos` falso
--     num esquema próprio e fazer a função escrever lá, com
--     poderes de dono.
--   - Ao escrever gatilho NOVO que toque outra tabela: ou ele
--     entra nesta lista, ou o INSERT que o dispara vai falhar em
--     produção e o motivo não vai estar no código da aplicação.
--     Perdi uma hora com isso; fica o aviso.
-- =============================================================

ALTER FUNCTION conta_golpe()                   SECURITY DEFINER;
ALTER FUNCTION conta_golpe()                   SET search_path = public, pg_temp;

ALTER FUNCTION denuncia_derruba_alvo()         SECURITY DEFINER;
ALTER FUNCTION denuncia_derruba_alvo()         SET search_path = public, pg_temp;

ALTER FUNCTION suspende_empresa_por_denuncia() SECURITY DEFINER;
ALTER FUNCTION suspende_empresa_por_denuncia() SET search_path = public, pg_temp;

ALTER FUNCTION derruba_selo_sem_posse()        SECURITY DEFINER;
ALTER FUNCTION derruba_selo_sem_posse()        SET search_path = public, pg_temp;

COMMENT ON FUNCTION denuncia_derruba_alvo IS
  'Derruba a nota do alvo quando chega denúncia. SECURITY DEFINER: '
  'escreve em `alvos`, onde a aplicação não tem acesso. Ver 016.';
COMMENT ON FUNCTION conta_golpe IS
  'Conta a ocorrência do golpe. SECURITY DEFINER: escreve em '
  '`golpes_conhecidos`, onde a aplicação não tem acesso. Ver 016.';
COMMENT ON FUNCTION suspende_empresa_por_denuncia IS
  'Suspende empresa com denúncia demais. SECURITY DEFINER: escreve '
  'em `empresas` e `empresa_eventos`. Ver 016.';
COMMENT ON FUNCTION derruba_selo_sem_posse IS
  'Tira o selo quando o domínio perde a prova de posse. SECURITY '
  'DEFINER: escreve em `empresas`. Ver 016.';
