-- =============================================================
-- confiia.com.br — migration 002
-- (a) verificação de telefone
-- (b) classificação da imagem, que define o peso da detecção de IA
-- =============================================================

-- -------------------------------------------------------------
-- (a) TELEFONE
-- -------------------------------------------------------------

ALTER TYPE tipo_alvo ADD VALUE IF NOT EXISTS 'telefone';

CREATE TYPE origem_relato AS ENUM ('usuario','parceiro','anatel','procon','importacao');
CREATE TYPE categoria_ligacao AS ENUM
  ('golpe','telemarketing','cobranca','trote','robo','desconhecido','legitimo');

-- Reputação acumulada de cada número. Uma linha por telefone.
CREATE TABLE telefones (
  numero_e164     text PRIMARY KEY,            -- sempre +5511999999999
  ddd             smallint,
  tipo_linha      text,                        -- movel | fixo | voip | 0800 | internacional
  operadora       text,
  portado         boolean,
  origem_verificada boolean,                   -- selo novo da Anatel (substituiu o 0303)
  em_nao_perturbe boolean,

  relatos_total   integer NOT NULL DEFAULT 0,
  relatos_golpe   integer NOT NULL DEFAULT 0,
  relatos_30d     integer NOT NULL DEFAULT 0,  -- número queimado costuma sumir; recência importa
  categoria_predominante categoria_ligacao,

  score           smallint CHECK (score BETWEEN 0 AND 100),
  veredito        veredito,
  primeiro_relato_em timestamptz,
  ultimo_relato_em   timestamptz,
  atualizado_em   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_telefones_score ON telefones (score) WHERE relatos_total > 0;
CREATE INDEX idx_telefones_recente ON telefones (ultimo_relato_em DESC);

-- Cada relato individual. É daqui que sai a base própria — o ativo mais valioso.
CREATE TABLE telefone_relatos (
  id           bigserial PRIMARY KEY,
  numero_e164  text NOT NULL REFERENCES telefones(numero_e164) ON DELETE CASCADE,
  conta_id     uuid REFERENCES contas(id) ON DELETE SET NULL,
  categoria    categoria_ligacao NOT NULL,
  origem       origem_relato NOT NULL DEFAULT 'usuario',
  relato       text,
  se_passou_por text,                          -- "Banco do Brasil", "Correios", "Nubank"
  prejuizo_cent integer,
  ip_hash      text,                           -- barra o mesmo IP denunciando 500 vezes
  criado_em    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_relatos_numero ON telefone_relatos (numero_e164, criado_em DESC);
CREATE INDEX idx_relatos_conta  ON telefone_relatos (conta_id, criado_em DESC);
-- Uma pessoa relata o mesmo número uma vez por dia.
--
-- "Por dia" é o dia DE QUEM? Precisa estar escrito. `criado_em::date`
-- sozinho usa o fuso de quem está consultando — o mesmo relato cairia
-- em dias diferentes dependendo da sessão. Por isso o Postgres recusa
-- esse índice ("must be marked IMMUTABLE").
-- Fixando o fuso de São Paulo a expressão vira imutável e a regra
-- passa a valer o que a pessoa entende por "hoje".
CREATE UNIQUE INDEX idx_relato_unico ON telefone_relatos
  (numero_e164, conta_id, ((criado_em AT TIME ZONE 'America/Sao_Paulo')::date))
  WHERE conta_id IS NOT NULL;

-- Recalcula a reputação a cada novo relato
CREATE OR REPLACE FUNCTION recalcula_telefone() RETURNS trigger AS $$
DECLARE
  v_total int; v_golpe int; v_30d int; v_cat categoria_ligacao; v_score int;
BEGIN
  SELECT count(*), count(*) FILTER (WHERE categoria IN ('golpe','trote')),
         count(*) FILTER (WHERE criado_em > now() - interval '30 days')
    INTO v_total, v_golpe, v_30d
  FROM telefone_relatos WHERE numero_e164 = NEW.numero_e164;

  SELECT categoria INTO v_cat FROM telefone_relatos
   WHERE numero_e164 = NEW.numero_e164
   GROUP BY categoria ORDER BY count(*) DESC LIMIT 1;

  -- 100 = limpo. Cada relato de golpe derruba, com peso extra pros recentes.
  v_score := GREATEST(0, 100 - (v_golpe * 12) - (v_30d * 6) - ((v_total - v_golpe) * 3));

  UPDATE telefones SET
    relatos_total = v_total,
    relatos_golpe = v_golpe,
    relatos_30d   = v_30d,
    categoria_predominante = v_cat,
    score    = v_score,
    veredito = CASE WHEN v_score < 40 THEN 'perigoso'::veredito
                    WHEN v_score < 70 THEN 'suspeito'::veredito
                    ELSE 'confiavel'::veredito END,
    primeiro_relato_em = LEAST(COALESCE(primeiro_relato_em, NEW.criado_em), NEW.criado_em),
    ultimo_relato_em   = NEW.criado_em,
    atualizado_em      = now()
  WHERE numero_e164 = NEW.numero_e164;

  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER tg_telefone_relato AFTER INSERT ON telefone_relatos
  FOR EACH ROW EXECUTE FUNCTION recalcula_telefone();

-- -------------------------------------------------------------
-- (b) CLASSIFICAÇÃO DA IMAGEM
-- O peso da detecção de IA depende do QUE a imagem é.
-- Foto de produto gerada por IA = loja fantasma.
-- Meme gerado por IA = não é golpe nenhum.
-- -------------------------------------------------------------

CREATE TYPE classe_imagem AS ENUM (
  'print_conversa',     -- WhatsApp, Instagram, SMS
  'comprovante',        -- Pix, transferência, boleto pago
  'anuncio_produto',    -- foto de produto, oferta
  'perfil',             -- foto de perfil / selfie
  'documento',          -- RG, CNH, contrato
  'site',               -- print de página
  'outra'
);

ALTER TABLE imagens
  ADD COLUMN classe        classe_imagem,
  ADD COLUMN classe_conf   smallint CHECK (classe_conf BETWEEN 0 AND 100),
  ADD COLUMN ia_peso       smallint DEFAULT 0,   -- quanto a detecção de IA pesou no veredito
  ADD COLUMN pedido_direto boolean NOT NULL DEFAULT false, -- a pessoa perguntou "isso é IA?"
  ADD COLUMN sinais_edicao jsonb;                -- recorte, camada colada, fonte trocada

-- Tabela de política: quanto a detecção de IA pesa em cada tipo de imagem.
-- Fica no banco (e não no código) pra você ajustar sem novo deploy.
CREATE TABLE politica_ia_imagem (
  classe        classe_imagem PRIMARY KEY,
  peso          smallint NOT NULL,     -- 0 a 100: quanto derruba o score se for IA
  limiar        smallint NOT NULL,     -- a partir de qual probabilidade a gente age
  mensagem      text NOT NULL          -- o que a pessoa lê quando dá positivo
);

INSERT INTO politica_ia_imagem (classe, peso, limiar, mensagem) VALUES
('comprovante', 95, 60,
 'Este comprovante tem sinais de ter sido criado ou editado por computador. Comprovante falso é um dos golpes mais comuns — confirme o valor direto no aplicativo do seu banco.'),
('anuncio_produto', 80, 65,
 'A foto do produto parece gerada por inteligência artificial. Isso costuma indicar que o produto anunciado não existe de verdade.'),
('documento', 90, 60,
 'Este documento apresenta sinais de geração ou montagem digital. Não use como comprovação de identidade.'),
('print_conversa', 70, 70,
 'Este print parece ter sido montado ou gerado. Uma conversa que nunca aconteceu pode ter sido criada para dar credibilidade ao golpe.'),
('perfil', 65, 70,
 'A foto de perfil parece gerada por inteligência artificial — comum em conta falsa e em golpe de relacionamento.'),
('site', 60, 70,
 'A imagem da página parece montada. Confira o endereço direto no navegador.'),
('outra', 15, 80,
 'Esta imagem provavelmente foi gerada por inteligência artificial. Por si só isso não é golpe.');

COMMENT ON TABLE politica_ia_imagem IS
  'Regra: imagem gerada por IA só vira alerta de golpe quando o TIPO da imagem torna isso relevante.';

-- Consulta de telefone também entra no histórico e conta como verificação.
COMMENT ON COLUMN verificacoes.alvo IS
  'URL, domínio, @perfil, telefone em E.164 ou sha256 da imagem.';
