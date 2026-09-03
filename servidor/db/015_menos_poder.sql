-- =============================================================
-- confiia.com.br — tirar da aplicação o poder que ela não usa
--
-- O QUE ESTA MIGRAÇÃO RESOLVE
--
-- O `02-banco.sh` dizia, no fim: "confia_app: lê e grava linha, e
-- nada além disso". Mas o comando logo acima dizia:
--
--     GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES ...
--
-- Ou seja: a aplicação web podia APAGAR as 43 tabelas do banco.
-- Inclusive `auditoria` — o registro de quem fez o quê — e
-- `admins` — a lista de quem manda. Um log que o próprio sistema
-- pode apagar não é um log; é uma sugestão. E uma lista de admins
-- gravável pela página pública é uma porta com a chave na fechadura.
--
-- Nada disso foi explorado. É poder que estava lá sobrando, que é
-- exatamente o que um invasor procura depois de entrar.
--
-- ─────────────────────────────────────────────────────────────
-- O QUE A APLICAÇÃO REALMENTE USA — medido, não chutado
--
-- Varrendo `web/src/` fora do arquivo de esquema, o site inteiro
-- toca NOVE tabelas:
--
--   contas             ler, criar, alterar
--   sessoes            criar, ler, encerrar (encerrar é UPDATE)
--   tokens             criar, ler, marcar usado
--   emails             só enfileirar
--   codigos_reserva    criar, ler, gastar, apagar
--   denuncias          só criar (e ler para conferir dono)
--   empresas           criar e ler
--   empresa_dominios   só criar
--   admins             SÓ LER (sessao.ts:181)
--
-- Mais SELECT em cinco tabelas que o `exigeDono()` consulta para
-- saber de quem é um registro, e mais nada.
--
-- `auditoria` sai da lista: ver a Parte 1.
--
-- ─────────────────────────────────────────────────────────────
-- AS TRÊS PARTES
--
--   1. `registra()` passa a rodar como o dono. A aplicação perde
--      o acesso direto à tabela `auditoria` e passa a só poder
--      ACRESCENTAR linha, por uma porta só.
--   2. Devolve à aplicação exatamente a lista acima, e só ela.
--   3. Liga RLS em tudo, como segunda tranca atrás da primeira.
--
-- ─────────────────────────────────────────────────────────────
-- CUIDADO AO MEXER:
--   - O `02-banco.sh` roda as migrações ANTES de dar os direitos.
--     O bloco de GRANT dele foi corrigido junto com esta migração;
--     se voltar a ser `ON ALL TABLES`, ele desfaz tudo isto na
--     próxima instalação e ninguém percebe. Os dois andam juntos.
--   - Ao criar tabela nova numa migração futura: ela nasce SEM
--     acesso para a aplicação, de propósito. Se o site precisar
--     dela, o GRANT tem que ser escrito na mão. É chato uma vez;
--     é o que impede a lista de voltar a crescer sozinha.
--   - RLS aqui é ENABLE, não FORCE: o dono (`confia_dono`) segue
--     passando por cima. É ele que roda migração e o `npm run
--     admin`. Forçar quebraria as duas coisas sem proteger nada a
--     mais — `confia_app`, que é quem atende a internet, não é
--     dono de tabela nenhuma e portanto obedece às políticas.
-- =============================================================


-- =============================================================
-- PARTE 1 — a auditoria vira mão única
--
-- `registra()` era LANGUAGE plpgsql comum: rodava com os direitos
-- de quem chamasse. Como quem chama é `confia_app`, ela precisava
-- de INSERT na tabela — e quem tem INSERT direto tinha DELETE
-- junto, pelo GRANT geral.
--
-- SECURITY DEFINER faz a função rodar como o DONO dela. Agora a
-- aplicação chama a função sem ter direito nenhum sobre a tabela.
-- Só dá para acrescentar linha, e só por aqui.
--
-- `search_path` fixo é obrigatório em SECURITY DEFINER: sem ele,
-- quem chama poderia criar um `auditoria` falso num esquema seu e
-- fazer a função gravar lá dentro, com poderes de dono.
-- =============================================================

CREATE OR REPLACE FUNCTION registra(
  p_ator      uuid,
  p_acao      text,
  p_alvo_tipo text,
  p_alvo_id   text,
  p_antes     jsonb DEFAULT NULL,
  p_depois    jsonb DEFAULT NULL,
  p_ip        inet  DEFAULT NULL
) RETURNS bigint AS $$
DECLARE v_id bigint;
BEGIN
  INSERT INTO auditoria (ator_id, acao, alvo_tipo, alvo_id, antes, depois, ip)
  VALUES (p_ator, p_acao, p_alvo_tipo, p_alvo_id, p_antes, p_depois, p_ip)
  RETURNING id INTO v_id;
  RETURN v_id;
END $$
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;

COMMENT ON FUNCTION registra IS
  'Único caminho para gravar auditoria. SECURITY DEFINER: a aplicação '
  'chama sem ter direito sobre a tabela, e por isso só consegue '
  'ACRESCENTAR. Não remova o SET search_path.';


-- =============================================================
-- PARTE 2 — devolver só o que é usado
--
-- Zera primeiro, devolve depois. Zerar primeiro é o que faz esta
-- migração ser a verdade única: rodar de novo dá o mesmo
-- resultado, e um GRANT esquecido em outro lugar é apagado.
-- =============================================================

REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM confia_app;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM confia_app;

-- O direito de EXECUTE em toda função também era geral demais.
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM confia_app;

GRANT USAGE ON SCHEMA public TO confia_app;

-- ---------- contas: o site cria, lê e altera perfil e 2FA ----------
GRANT SELECT, INSERT, UPDATE ON contas TO confia_app;

-- ---------- entrada e saída ----------
-- Sem DELETE em `sessoes`: encerrar sessão é UPDATE (a linha fica
-- para a pessoa ver o histórico em /conta/aparelhos), e quem apaga
-- de verdade é a `faxina_sessoes()`, aos 15 dias, rodando como
-- `postgres` pelo timer. A aplicação não precisa apagar nada aqui.
GRANT SELECT, INSERT, UPDATE ON sessoes         TO confia_app;
GRANT SELECT, INSERT, UPDATE ON tokens          TO confia_app;

-- Códigos de reserva do 2FA: gasta e apaga de verdade.
GRANT SELECT, INSERT, UPDATE, DELETE ON codigos_reserva TO confia_app;

-- ---------- fila de e-mail: só enfileira ----------
GRANT SELECT, INSERT, UPDATE ON emails          TO confia_app;

-- ---------- o que o público grava ----------
GRANT SELECT, INSERT ON denuncias        TO confia_app;
GRANT SELECT, INSERT ON empresas         TO confia_app;
GRANT SELECT, INSERT ON empresa_dominios TO confia_app;

-- ---------- admins: LER e mais nada ----------
-- `sessao.ts` pergunta "esta conta é admin?" a cada requisição.
-- Perguntar é tudo o que o site faz. Quem promove alguém a admin
-- é o `npm run admin`, que conecta como dono.
GRANT SELECT ON admins TO confia_app;

-- ---------- só para o exigeDono() saber de quem é ----------
-- `guarda.ts` lê a coluna de dono destas tabelas para decidir se
-- devolve 404. Ler o dono é tudo o que ele faz.
GRANT SELECT ON verificacoes   TO confia_app;
GRANT SELECT ON monitoramentos TO confia_app;
GRANT SELECT ON api_chaves     TO confia_app;
GRANT SELECT ON tickets        TO confia_app;
GRANT SELECT ON assinaturas    TO confia_app;

-- ---------- sequências das tabelas acima ----------
-- INSERT numa tabela com id serial precisa da sequência junto.
-- Sem isto, o INSERT falha com "permission denied for sequence".
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO confia_app;

-- ---------- as funções que o site chama pelo nome ----------
GRANT EXECUTE ON FUNCTION registra(uuid, text, text, text, jsonb, jsonb, inet)
  TO confia_app;
GRANT EXECUTE ON FUNCTION admin_pode_entrar(uuid) TO confia_app;

-- ---------- as visões (v_*) ----------
-- Nenhuma é usada pelo site — foram feitas para relatório e para o
-- painel, que roda como dono. Elas ficam de fora do GRANT acima e
-- é importante que fiquem: visão comum roda com os direitos de
-- QUEM A CRIOU, então uma visão liberada seria um caminho por
-- baixo de tudo o que esta migração acabou de trancar.

-- ---------- o padrão para tabela futura ----------
-- Tabela criada daqui para a frente nasce sem acesso. Se o site
-- precisar dela, escreva o GRANT na migração que a cria.
ALTER DEFAULT PRIVILEGES FOR ROLE confia_dono IN SCHEMA public
  REVOKE ALL ON TABLES FROM confia_app;
ALTER DEFAULT PRIVILEGES FOR ROLE confia_dono IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO confia_app;
ALTER DEFAULT PRIVILEGES FOR ROLE confia_dono IN SCHEMA public
  REVOKE ALL ON FUNCTIONS FROM confia_app;


-- =============================================================
-- PARTE 3 — RLS, a segunda tranca
--
-- A Parte 2 já resolve. Então por que isto?
--
-- Porque `GRANT ... ON ALL TABLES` é o comando mais fácil de
-- digitar do Postgres, e o mais fácil de digitar de novo sem
-- pensar — foi assim que a lista de 52 nasceu. Se alguém (nós,
-- daqui a um ano, às duas da manhã) rodar aquilo outra vez, a
-- Parte 2 evapora em silêncio.
--
-- Com RLS ligada e nenhuma política escrita, a tabela responde
-- ZERO LINHA para `confia_app` mesmo com GRANT total. A tranca de
-- baixo continua fechada.
--
-- Onde o site precisa de acesso, a política diz `USING (true)`:
-- não é enfeite, é a declaração explícita de que ali o acesso é
-- por tabela inteira e a dona da regra é a aplicação. As tabelas
-- SEM política são a maioria, e são o ponto.
-- =============================================================

DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables
     WHERE schemaname = 'public' AND tablename <> 'migracoes'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- As políticas, uma por tabela que o site usa. `DROP ... IF EXISTS`
-- antes de criar deixa a migração poder rodar duas vezes.
DO $$
DECLARE
  t    text;
  usa  text[] := ARRAY[
    'contas', 'sessoes', 'tokens', 'emails', 'codigos_reserva',
    'denuncias', 'empresas', 'empresa_dominios', 'admins',
    'verificacoes', 'monitoramentos', 'api_chaves', 'tickets', 'assinaturas'
  ];
BEGIN
  FOREACH t IN ARRAY usa LOOP
    EXECUTE format('DROP POLICY IF EXISTS app_usa ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY app_usa ON public.%I FOR ALL TO confia_app '
      'USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

-- Repare no que NÃO está na lista acima: `auditoria`. Ela fica com
-- RLS ligada e política nenhuma — a aplicação não enxerga um byte
-- dela. O único jeito de uma linha entrar ali é pela `registra()`,
-- que roda como dono. É isso que faz o registro ser confiável.
