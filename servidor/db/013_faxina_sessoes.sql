-- =============================================================
-- confiia.com.br — faxina automática do rastro de login
--
-- O QUE ESTA MIGRAÇÃO RESOLVE
--
-- A tabela `sessoes` guarda, por linha, o IP e o navegador de
-- cada entrada na conta. Isso é necessário: é como a pessoa
-- descobre que alguém entrou na conta dela, e como ela expulsa
-- essa pessoa sem depender de falar com a gente.
--
-- Mas é também, literalmente, o histórico de onde e quando cada
-- pessoa esteve. Guardar isso para sempre não serve a ninguém:
-- não ajuda a pessoa a reconhecer invasão de seis meses atrás, e
-- transforma o nosso banco num alvo mais valioso do que precisa
-- ser. A LGPD chama isso de necessidade e de prazo (art. 6º, III
-- e V) — a gente chama de não guardar o que não vamos usar.
--
-- A REGRA, ENTÃO:
--   sessão encerrada ou vencida  →  apagada 15 dias depois
--   sessão ativa                 →  fica, é o acesso da pessoa
--
-- O QUE NÃO É APAGADO: o RESULTADO das verificações. Nota de um
-- site, sinais encontrados. Aquilo protege a próxima pessoa que
-- verificar o mesmo link e não diz nada sobre quem perguntou.
-- São coisas diferentes e têm prazos diferentes.
--
-- CUIDADO AO MEXER:
--   - Mudar os 15 dias aqui obriga a mudar o texto em
--     /conta/aparelhos e /conta/privacidade. A promessa está
--     escrita na tela, e a tela é o contrato.
--   - A faxina roda pelo `pg_cron` se ele existir; se não, pela
--     chamada manual da função. Ela é idempotente: rodar duas
--     vezes não faz mal.
-- =============================================================

-- -------------------------------------------------------------
-- 1. A função
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION faxina_sessoes()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  apagadas integer;
BEGIN
  DELETE FROM sessoes
   WHERE (revogada_em IS NOT NULL AND revogada_em < now() - interval '15 days')
      OR (expira_em   < now() - interval '15 days');

  GET DIAGNOSTICS apagadas = ROW_COUNT;

  -- A própria faxina fica registrada. Sem isso não há como
  -- provar, numa fiscalização, que ela roda de verdade.
  INSERT INTO auditoria (ator_id, acao, alvo_tipo, depois)
  VALUES (NULL, 'sessao.faxina', 'sessoes',
          jsonb_build_object('apagadas', apagadas, 'prazo_dias', 15));

  RETURN apagadas;
END;
$$;

COMMENT ON FUNCTION faxina_sessoes() IS
  'Apaga rastro de login encerrado/vencido há mais de 15 dias. '
  'O prazo está prometido em /conta/aparelhos e /conta/privacidade.';

-- -------------------------------------------------------------
-- 2. Agendar, se o pg_cron estiver disponível
--
-- `pg_cron` não vem no Postgres padrão e exige extensão instalada
-- no servidor. Em vez de a migração FALHAR onde ele não existe,
-- ela tenta e segue. Se não der, o agendamento fica por conta do
-- systemd timer da VPS (ver servidor/02-banco.sh).
-- -------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    BEGIN
      CREATE EXTENSION IF NOT EXISTS pg_cron;
      PERFORM cron.schedule(
        'faxina-sessoes',
        '17 4 * * *',              -- 04:17, quando ninguém está usando
        'SELECT faxina_sessoes()'
      );
      RAISE NOTICE 'faxina_sessoes agendada no pg_cron (04:17 todo dia)';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'pg_cron existe mas nao deu para agendar: %', SQLERRM;
      RAISE NOTICE 'Agende pelo systemd timer da VPS.';
    END;
  ELSE
    RAISE NOTICE 'pg_cron nao disponivel — agende faxina_sessoes() pelo systemd timer.';
  END IF;
END;
$$;

-- -------------------------------------------------------------
-- 3. Uma limpeza agora, do que já está velho
-- -------------------------------------------------------------
SELECT faxina_sessoes();
