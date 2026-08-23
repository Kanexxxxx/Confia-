-- =============================================================
-- confiia.com.br — migration 006
-- GOLPE NOVO (inédito)
--
-- Quem descobre um golpe novo é sempre a primeira vítima —
-- nunca a máquina. Se a pessoa avisa que aquilo é diferente de
-- tudo que ela conhecia, isso precisa passar na frente da fila:
-- ninguém está protegido ainda, e cada dia parado vira mais vítima.
--
-- CUIDADO AO MEXER:
--   - `denuncias.golpe_novo` alimenta a prioridade em `v_fila_admin`.
--   - Ao confirmar um golpe novo, crie a linha em `golpes_conhecidos`
--     e vincule as denúncias parecidas. É isso que ensina o sistema.
-- =============================================================

ALTER TABLE denuncias
  ADD COLUMN golpe_novo      boolean NOT NULL DEFAULT false,
  ADD COLUMN descricao_novo  text,
  ADD COLUMN golpe_id        uuid,        -- preenchido quando reconhecemos o padrão
  ADD COLUMN bo_anexado      boolean NOT NULL DEFAULT false;

CREATE INDEX idx_denuncias_novo ON denuncias (criada_em DESC)
  WHERE golpe_novo AND status IN ('nova','em_analise');

COMMENT ON COLUMN denuncias.golpe_novo IS
  'Marcado pela própria vítima: "nunca vi isso antes". Vai para o topo da fila.';
COMMENT ON COLUMN denuncias.bo_anexado IS
  'Denúncia com boletim de ocorrência anexado pesa mais na análise.';

-- Anexos da denúncia (prints, comprovantes, boletim de ocorrência)
CREATE TYPE tipo_prova AS ENUM
  ('print_conversa','comprovante','anuncio','pagina','boletim_ocorrencia','outro');

CREATE TABLE denuncia_provas (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  denuncia_id  uuid NOT NULL REFERENCES denuncias(id) ON DELETE CASCADE,
  tipo         tipo_prova NOT NULL DEFAULT 'outro',
  arquivo_ref  text NOT NULL,
  sha256       text NOT NULL,
  mime         text,
  bytes        integer,
  -- Prova fica mais tempo que imagem de verificação: ela sustenta
  -- a decisão se a empresa contestar depois.
  apagar_em    date NOT NULL DEFAULT (now() + interval '2 years')::date,
  criada_em    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_provas_denuncia ON denuncia_provas (denuncia_id);

-- Marca a denúncia quando um boletim de ocorrência é anexado
CREATE OR REPLACE FUNCTION marca_bo() RETURNS trigger AS $$
BEGIN
  IF NEW.tipo = 'boletim_ocorrencia' THEN
    UPDATE denuncias SET bo_anexado = true WHERE id = NEW.denuncia_id;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER tg_bo AFTER INSERT ON denuncia_provas
  FOR EACH ROW EXECUTE FUNCTION marca_bo();

-- -------------------------------------------------------------
-- CATÁLOGO DE GOLPES
--
-- Cada golpe confirmado vira uma linha aqui, com o roteiro.
-- Serve para: (a) reconhecer o mesmo golpe quando voltar com
-- outro nome, (b) alimentar a página pública de tipos de golpe,
-- (c) treinar o prompt da análise.
-- -------------------------------------------------------------

CREATE TABLE golpes_conhecidos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          text NOT NULL,             -- "Falso suporte de carteira cripto"
  apelido       text,                      -- como as vítimas chamam
  categoria     text NOT NULL,
  roteiro       text NOT NULL,             -- passo a passo de como aplicam
  sinais        jsonb NOT NULL DEFAULT '[]', -- pistas para reconhecer
  como_evitar   text,

  primeira_denuncia_em timestamptz,
  denuncias     integer NOT NULL DEFAULT 0,
  prejuizo_total_cent bigint NOT NULL DEFAULT 0,
  ativo         boolean NOT NULL DEFAULT true,  -- ainda circulando?
  publicado     boolean NOT NULL DEFAULT false, -- aparece no site?

  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_golpes_ativos ON golpes_conhecidos (ativo, denuncias DESC);

ALTER TABLE denuncias
  ADD CONSTRAINT fk_denuncia_golpe
  FOREIGN KEY (golpe_id) REFERENCES golpes_conhecidos(id) ON DELETE SET NULL;

CREATE TRIGGER tg_golpes_upd BEFORE UPDATE ON golpes_conhecidos
  FOR EACH ROW EXECUTE FUNCTION toca_atualizada_em();

-- Mantém a contagem do catálogo em dia
CREATE OR REPLACE FUNCTION conta_golpe() RETURNS trigger AS $$
BEGIN
  IF NEW.golpe_id IS NULL THEN RETURN NEW; END IF;
  UPDATE golpes_conhecidos g SET
    denuncias = (SELECT count(*) FROM denuncias d
                  WHERE d.golpe_id = NEW.golpe_id AND d.status <> 'recusada'),
    prejuizo_total_cent = (SELECT COALESCE(sum(d.prejuizo_cent),0) FROM denuncias d
                            WHERE d.golpe_id = NEW.golpe_id AND d.status <> 'recusada'),
    primeira_denuncia_em = LEAST(COALESCE(g.primeira_denuncia_em, NEW.criada_em), NEW.criada_em)
  WHERE g.id = NEW.golpe_id;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER tg_conta_golpe AFTER INSERT OR UPDATE OF golpe_id ON denuncias
  FOR EACH ROW EXECUTE FUNCTION conta_golpe();

-- -------------------------------------------------------------
-- FILA: golpe novo passa na frente
-- Substitui a view criada na 005.
-- -------------------------------------------------------------

-- ATENÇÃO À FORMA DESTA VIEW:
-- O ORDER BY fica FORA do UNION, dentro de um SELECT que envolve
-- tudo. Depois de um UNION o Postgres só aceita ordenar por nome
-- de coluna do resultado — expressão como
--     ORDER BY (urgencia = 'prioridade') DESC
-- é recusada com "invalid UNION/INTERSECT/EXCEPT ORDER BY clause".
-- Embrulhar num subselect resolve e mantém a regra legível.
CREATE OR REPLACE VIEW v_fila_admin AS
SELECT f.*
  FROM (
    SELECT 'golpe_novo' AS fila,
           d.id::text   AS id,
           left(d.id::text, 8) AS referencia,
           COALESCE(d.descricao_novo, d.categoria) AS assunto,
           d.alvo,
           d.criada_em + interval '2 days' AS prazo_em,   -- prazo curto de propósito
           'prioridade'::text AS urgencia,
           d.criada_em
      FROM denuncias d
     WHERE d.golpe_novo AND d.status IN ('nova','em_analise')

    UNION ALL

    SELECT 'contestacao', c.id::text, c.protocolo, c.tipo::text, c.alvo, c.prazo_em,
           CASE WHEN c.prazo_em < now() THEN 'atrasado'
                WHEN c.prazo_em < now() + interval '2 days' THEN 'urgente'
                ELSE 'no prazo' END,
           c.criada_em
      FROM contestacoes c
     WHERE c.status IN ('recebida','aguardando_prova','em_analise')

    UNION ALL

    SELECT 'denuncia', d.id::text, left(d.id::text, 8), d.categoria, d.alvo,
           d.criada_em + interval '7 days',
           CASE WHEN d.criada_em < now() - interval '7 days' THEN 'atrasado'
                WHEN d.bo_anexado THEN 'urgente'      -- com B.O. tem peso maior
                WHEN d.criada_em < now() - interval '5 days' THEN 'urgente'
                ELSE 'no prazo' END,
           d.criada_em
      FROM denuncias d
     WHERE NOT d.golpe_novo AND d.status IN ('nova','em_analise')

    UNION ALL

    SELECT 'empresa', e.id::text, e.nome_fantasia, 'cadastro', coalesce(e.cnpj,''),
           e.criada_em + interval '7 days',
           CASE WHEN e.criada_em < now() - interval '7 days' THEN 'atrasado'
                WHEN e.criada_em < now() - interval '5 days' THEN 'urgente'
                ELSE 'no prazo' END,
           e.criada_em
      FROM empresas e
     WHERE e.status = 'em_analise'
  ) AS f
 ORDER BY (f.urgencia = 'prioridade') DESC,   -- golpe novo primeiro
          f.prazo_em;                          -- depois, o que vence antes

COMMENT ON VIEW v_fila_admin IS
  'Ordem: golpe novo primeiro, depois o que está atrasado, depois por prazo.';
