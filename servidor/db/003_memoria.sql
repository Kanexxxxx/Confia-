-- =============================================================
-- confiia.com.br — migration 003
-- A MEMÓRIA DO SISTEMA
--
-- Ideia: se o João verificou "loja-x.com" hoje de manhã e a Maria
-- verificar a mesma loja à tarde, a Maria recebe a resposta na hora
-- e não gasta nada de IA. E quanto mais gente usa, mais o sistema sabe.
--
-- ATENÇÃO AO MEXER:
--   - Mudou algo em `alvos`? Confira `atualiza_alvo()` mais abaixo.
--   - Mudou o tempo de validade? É a função `validade_alvo()`.
--   - Toda verificação nova PRECISA passar por `alvos` primeiro,
--     senão a economia não acontece.
-- =============================================================

-- -------------------------------------------------------------
-- 1. O CÉREBRO: uma linha por coisa já verificada
-- -------------------------------------------------------------

CREATE TABLE alvos (
  -- A chave é o alvo já limpo e padronizado.
  -- Ex.: "https://WWW.Loja-X.com/promo?id=9" vira "loja-x.com"
  --      "(11) 9 9999-9999" vira "+5511999999999"
  -- Isso é essencial: sem padronizar, o mesmo site entraria 10 vezes
  -- e a memória não serviria pra nada.
  chave           text PRIMARY KEY,
  tipo            tipo_alvo NOT NULL,

  -- O último resultado conhecido
  score           smallint CHECK (score BETWEEN 0 AND 100),
  veredito        veredito,
  resumo          text,
  itens           jsonb,          -- as linhas do "Detalhes da análise", prontas pra devolver
  confianca       smallint,

  -- Quanto o sistema já viu esse alvo
  consultas       integer NOT NULL DEFAULT 0,   -- quantas vezes pediram
  aproveitamentos integer NOT NULL DEFAULT 0,   -- quantas vezes a memória evitou reanálise
  denuncias       integer NOT NULL DEFAULT 0,   -- quantas pessoas denunciaram

  -- Controle de validade. Explicação em validade_alvo() lá embaixo.
  analisado_em    timestamptz NOT NULL DEFAULT now(),
  expira_em       timestamptz NOT NULL,
  travado         boolean NOT NULL DEFAULT false, -- true = decidido na mão, não recalcula

  primeira_vez_em timestamptz NOT NULL DEFAULT now(),
  ultima_vez_em   timestamptz NOT NULL DEFAULT now(),
  custo_micro_total integer NOT NULL DEFAULT 0   -- quanto esse alvo já custou no total
);

CREATE INDEX idx_alvos_tipo     ON alvos (tipo, ultima_vez_em DESC);
CREATE INDEX idx_alvos_expira   ON alvos (expira_em) WHERE NOT travado;
CREATE INDEX idx_alvos_populares ON alvos (consultas DESC);
-- Os piores da base: alimenta a lista de bloqueio da extensão
CREATE INDEX idx_alvos_perigosos ON alvos (score) WHERE score < 40;

COMMENT ON TABLE alvos IS
  'Memória compartilhada. Toda verificação consulta aqui ANTES de gastar IA.';


-- -------------------------------------------------------------
-- 2. HISTÓRICO: como o alvo mudou ao longo do tempo
--
-- Serve pra duas coisas:
--   (a) o monitoramento do Premium ("esse site era seguro e piorou")
--   (b) provar depois por que a gente deu tal resposta em tal data
-- -------------------------------------------------------------

CREATE TABLE alvo_historico (
  id          bigserial PRIMARY KEY,
  chave       text NOT NULL REFERENCES alvos(chave) ON DELETE CASCADE,
  score       smallint,
  veredito    veredito,
  motivo      text,        -- 'reanalise' | 'denuncia' | 'manual' | 'monitoramento'
  itens       jsonb,
  criado_em   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_hist_chave ON alvo_historico (chave, criado_em DESC);

-- Só grava no histórico quando o veredito REALMENTE mudou.
-- Sem esse filtro, a tabela cresceria sem parar sem informação nova.
CREATE OR REPLACE FUNCTION registra_mudanca_alvo() RETURNS trigger AS $$
BEGIN
  IF OLD.veredito IS DISTINCT FROM NEW.veredito
     OR abs(COALESCE(OLD.score,0) - COALESCE(NEW.score,0)) >= 15 THEN
    INSERT INTO alvo_historico (chave, score, veredito, motivo, itens)
    VALUES (NEW.chave, NEW.score, NEW.veredito, 'reanalise', NEW.itens);
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER tg_alvo_mudou AFTER UPDATE ON alvos
  FOR EACH ROW EXECUTE FUNCTION registra_mudanca_alvo();


-- -------------------------------------------------------------
-- 3. QUANTO TEMPO A RESPOSTA VALE
--
-- Não dá pra usar um prazo só. Um site criado ontem pode virar
-- golpe amanhã; o site dos Correios não vira golpe em 6 horas.
--
-- MEXEU AQUI? Os números abaixo definem seu custo de IA.
-- Prazo maior = mais barato, porém resposta mais velha.
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION validade_alvo(
  p_tipo tipo_alvo,
  p_score smallint,
  p_idade_dominio_dias int DEFAULT NULL
) RETURNS interval AS $$
BEGIN
  -- Já provado golpe: não vai melhorar. Guarda por bastante tempo.
  IF p_score IS NOT NULL AND p_score < 30 THEN
    RETURN interval '30 days';
  END IF;

  CASE p_tipo
    -- Imagem é identificada pelo conteúdo (sha256). A mesma imagem
    -- é sempre a mesma imagem — a resposta nunca muda.
    WHEN 'imagem' THEN RETURN interval '365 days';

    -- Telefone muda de dono e de uso rápido. Um dia é o suficiente.
    WHEN 'telefone' THEN RETURN interval '24 hours';

    -- Perfil de rede social muda de nome e foto com facilidade.
    WHEN 'perfil' THEN RETURN interval '12 hours';

    -- Site/link: depende da idade do domínio.
    WHEN 'link', 'dominio' THEN
      IF p_idade_dominio_dias IS NULL OR p_idade_dominio_dias < 30 THEN
        RETURN interval '6 hours';    -- recém-criado: reanalisa logo
      ELSIF p_idade_dominio_dias < 365 THEN
        RETURN interval '2 days';
      ELSE
        RETURN interval '7 days';     -- domínio antigo e estável
      END IF;

    ELSE RETURN interval '24 hours';
  END CASE;
END $$ LANGUAGE plpgsql IMMUTABLE;


-- -------------------------------------------------------------
-- 4. GRAVAR NA MEMÓRIA
--
-- O servidor chama esta função no fim de cada análise.
-- Se o alvo já existia, atualiza. Se não, cria.
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION atualiza_alvo(
  p_chave text,
  p_tipo tipo_alvo,
  p_score smallint,
  p_veredito veredito,
  p_resumo text,
  p_itens jsonb,
  p_confianca smallint,
  p_custo_micro int DEFAULT 0,
  p_idade_dominio_dias int DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO alvos (chave, tipo, score, veredito, resumo, itens, confianca,
                     consultas, analisado_em, expira_em, custo_micro_total)
  VALUES (p_chave, p_tipo, p_score, p_veredito, p_resumo, p_itens, p_confianca,
          1, now(), now() + validade_alvo(p_tipo, p_score, p_idade_dominio_dias),
          p_custo_micro)
  ON CONFLICT (chave) DO UPDATE SET
    -- travado = alguém decidiu na mão. A máquina não sobrescreve.
    score     = CASE WHEN alvos.travado THEN alvos.score    ELSE EXCLUDED.score    END,
    veredito  = CASE WHEN alvos.travado THEN alvos.veredito ELSE EXCLUDED.veredito END,
    resumo    = CASE WHEN alvos.travado THEN alvos.resumo   ELSE EXCLUDED.resumo   END,
    itens     = CASE WHEN alvos.travado THEN alvos.itens    ELSE EXCLUDED.itens    END,
    confianca = EXCLUDED.confianca,
    consultas = alvos.consultas + 1,
    analisado_em = now(),
    ultima_vez_em = now(),
    expira_em = now() + validade_alvo(p_tipo, EXCLUDED.score, p_idade_dominio_dias),
    custo_micro_total = alvos.custo_micro_total + p_custo_micro;
END $$ LANGUAGE plpgsql;


-- -------------------------------------------------------------
-- 5. LER DA MEMÓRIA
--
-- Devolve a resposta guardada, se ainda valer.
-- Devolve nada se expirou — aí o servidor analisa de novo.
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION consulta_alvo(p_chave text)
RETURNS TABLE (score smallint, veredito veredito, resumo text,
               itens jsonb, confianca smallint, analisado_em timestamptz) AS $$
BEGIN
  UPDATE alvos SET
    consultas = alvos.consultas + 1,
    aproveitamentos = alvos.aproveitamentos + 1,
    ultima_vez_em = now()
  WHERE chave = p_chave AND (expira_em > now() OR travado);

  RETURN QUERY
  SELECT a.score, a.veredito, a.resumo, a.itens, a.confianca, a.analisado_em
  FROM alvos a
  WHERE a.chave = p_chave AND (a.expira_em > now() OR a.travado);
END $$ LANGUAGE plpgsql;


-- -------------------------------------------------------------
-- 6. DENÚNCIA DERRUBA O SCORE NA HORA
--
-- Se 3 pessoas denunciam o mesmo site, ele não espera reanálise:
-- cai na hora e a próxima pessoa já é avisada.
-- É aqui que o sistema "aprende" com os usuários.
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION denuncia_derruba_alvo() RETURNS trigger AS $$
DECLARE v_total int;
BEGIN
  SELECT count(*) INTO v_total FROM denuncias
   WHERE alvo = NEW.alvo AND status <> 'recusada';

  UPDATE alvos SET
    denuncias = v_total,
    score = GREATEST(0, COALESCE(score, 70) - (v_total * 10)),
    veredito = CASE
      WHEN GREATEST(0, COALESCE(score,70) - (v_total*10)) < 40 THEN 'perigoso'::veredito
      WHEN GREATEST(0, COALESCE(score,70) - (v_total*10)) < 70 THEN 'suspeito'::veredito
      ELSE veredito END,
    expira_em = now()      -- força reanálise na próxima consulta
  WHERE chave = NEW.alvo AND NOT travado;

  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER tg_denuncia_alvo AFTER INSERT ON denuncias
  FOR EACH ROW EXECUTE FUNCTION denuncia_derruba_alvo();


-- -------------------------------------------------------------
-- 7. TELEFONE — o que faltava
-- -------------------------------------------------------------

-- (a) Números oficiais de empresas conhecidas.
-- Golpista liga dizendo "aqui é do Banco X". Se o número não for
-- o oficial do Banco X, isso por si só já é um sinal forte.
CREATE TABLE numeros_oficiais (
  numero_e164 text PRIMARY KEY,
  empresa     text NOT NULL,
  setor       text,              -- banco | operadora | governo | varejo
  fonte       text,              -- de onde veio (site oficial, Anatel)
  conferido_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_oficiais_empresa ON numeros_oficiais (empresa);

COMMENT ON TABLE numeros_oficiais IS
  'Lista branca. Se o relato diz "se passou por Banco X" e o número não está aqui, é bandeira vermelha.';

-- (b) Campanha: golpista não usa um número, usa dezenas.
-- Quando vários números diferentes se passam pela MESMA empresa
-- no MESMO período, isso é uma campanha em andamento —
-- e aí dá pra avisar todo mundo antes de virar prejuízo.
CREATE TABLE campanhas_golpe (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  se_passa_por text NOT NULL,
  setor        text,
  numeros      integer NOT NULL DEFAULT 0,
  relatos      integer NOT NULL DEFAULT 0,
  regioes      text[],           -- DDDs atingidos
  roteiro      text,             -- o que eles falam
  ativa        boolean NOT NULL DEFAULT true,
  detectada_em timestamptz NOT NULL DEFAULT now(),
  encerrada_em timestamptz
);
CREATE INDEX idx_campanhas_ativas ON campanhas_golpe (ativa, detectada_em DESC);

-- (c) Sinais estruturais do número.
-- Não dependem de ninguém ter denunciado antes — funcionam
-- já na primeira vez que o número aparece.
ALTER TABLE telefones
  ADD COLUMN sinais jsonb NOT NULL DEFAULT '[]',
  -- exemplos guardados aqui:
  --   ddd_diferente_do_alegado  (diz ser banco de SP, liga de outro DDD)
  --   voip                      (linha de internet, descartável e barata)
  --   internacional             (+1, +44 fingindo ser empresa brasileira)
  --   sem_origem_verificada     (empresa séria hoje usa o selo da Anatel)
  --   numero_novo               (linha ativada há poucos dias)
  ADD COLUMN campanha_id uuid REFERENCES campanhas_golpe(id) ON DELETE SET NULL,
  ADD COLUMN primeira_vez_visto timestamptz DEFAULT now();

COMMENT ON COLUMN telefones.sinais IS
  'Pistas que valem mesmo sem denúncia anterior. É o que salva o PRIMEIRO a receber a ligação.';


-- -------------------------------------------------------------
-- 8. PAINEL: a memória está valendo a pena?
-- -------------------------------------------------------------

CREATE VIEW v_memoria AS
SELECT
  tipo,
  count(*)                        AS alvos_guardados,
  sum(consultas)                  AS consultas_totais,
  sum(aproveitamentos)            AS respostas_da_memoria,
  round(100.0 * sum(aproveitamentos) / NULLIF(sum(consultas),0), 1) AS economia_pct,
  sum(custo_micro_total)/1000000.0 AS gasto_usd
FROM alvos
GROUP BY tipo;

COMMENT ON VIEW v_memoria IS
  'economia_pct = quanto das consultas foi respondido de graça pela memória. Quanto maior, melhor.';

-- Os alvos mais consultados: dá pra reanalisar esses com prioridade
CREATE VIEW v_alvos_populares AS
SELECT chave, tipo, score, veredito, consultas, denuncias, ultima_vez_em
FROM alvos
ORDER BY consultas DESC
LIMIT 200;
