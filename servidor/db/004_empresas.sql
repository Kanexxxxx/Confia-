-- =============================================================
-- confiia.com.br — migration 004
-- LOJAS E EMPRESAS VERIFICADAS
--
-- Ideia: a loja se cadastra, manda CNPJ e documentos, a gente confere.
-- Quando alguém verificar o site dela, o selo soma pontos.
--
-- ISSO RESOLVE UM PROBLEMA REAL: loja honesta recém-criada hoje
-- é penalizada por ser nova. Com o selo, ela deixa de ser.
--
-- CUIDADO AO MEXER:
--   - `empresa_dominios` é o coração. Sem prova de posse do domínio,
--     um golpista cadastra o site dos outros. Ver bloco 3.
--   - O bônus do selo NUNCA anula sinal técnico grave. Ver bloco 6.
--   - Mudou nível ou bônus? Confira `bonus_empresa()`.
-- =============================================================

-- -------------------------------------------------------------
-- 1. NÍVEIS
--
-- Não é "verificado ou não". São degraus, porque cada degrau
-- prova uma coisa diferente — e promete uma coisa diferente.
-- -------------------------------------------------------------

CREATE TYPE nivel_empresa AS ENUM (
  'registrada',   -- CNPJ existe e está ativo na Receita. Automático.
  'verificada',   -- documentos conferidos + posse do site comprovada
  'estabelecida', -- verificada há 1+ ano, sem denúncia procedente
  'curadoria'     -- grandes marcas que NÓS cadastramos (Instagram, bancos)
);

CREATE TYPE status_empresa AS ENUM (
  'rascunho',     -- começou o cadastro
  'em_analise',   -- documentos enviados, aguardando conferência
  'aprovada',
  'recusada',
  'suspensa',     -- perdeu o selo temporariamente (denúncias)
  'revogada'      -- perdeu de vez
);

-- -------------------------------------------------------------
-- 2. A EMPRESA
-- -------------------------------------------------------------

CREATE TABLE empresas (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id      uuid REFERENCES contas(id) ON DELETE SET NULL, -- quem administra

  -- Identificação. cnpj guardado só com números, sem pontuação,
  -- senão o mesmo CNPJ entraria duas vezes escrito diferente.
  cnpj          char(14) UNIQUE,
  razao_social  text,
  nome_fantasia text NOT NULL,

  -- O que a Receita respondeu. Guardado pra não consultar toda hora
  -- e pra provar depois o que a gente viu na data da aprovação.
  receita_situacao   text,          -- ATIVA | BAIXADA | SUSPENSA | INAPTA
  receita_abertura   date,
  receita_cnae       text,
  receita_capital_cent bigint,
  receita_endereco   jsonb,
  receita_consultada_em timestamptz,

  nivel         nivel_empresa,
  status        status_empresa NOT NULL DEFAULT 'rascunho',

  -- Contato conferido (não é o que ele digitou: é o que a gente validou)
  email_contato    citext,
  email_validado_em timestamptz,
  telefone_contato text,
  telefone_validado_em timestamptz,

  logo_url      text,
  descricao     text,
  categoria     text,               -- moda | eletronico | alimentacao | servico

  aprovada_em   timestamptz,
  aprovada_por  uuid REFERENCES contas(id),
  suspensa_em   timestamptz,
  motivo_status text,
  revisar_em    date,               -- revalidação periódica

  criada_em     timestamptz NOT NULL DEFAULT now(),
  atualizada_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_empresas_status ON empresas (status, criada_em DESC);
CREATE INDEX idx_empresas_revisar ON empresas (revisar_em) WHERE status = 'aprovada';

CREATE TRIGGER tg_empresas_upd BEFORE UPDATE ON empresas
  FOR EACH ROW EXECUTE FUNCTION toca_atualizada_em();

-- -------------------------------------------------------------
-- 3. OS SITES E PERFIS DA EMPRESA  ← O PONTO MAIS DELICADO
--
-- PROBLEMA: se eu deixo a empresa dizer "o site magazineluiza.com.br
-- é meu" e confio, qualquer golpista pega o selo da Magalu.
--
-- SOLUÇÃO: ela precisa PROVAR que controla o domínio, colocando
-- um código que a gente gera num registro TXT do DNS ou num arquivo
-- dentro do site. Só quem tem acesso de verdade consegue fazer isso.
--
-- NUNCA aprove um domínio com posse_confirmada_em nulo.
-- -------------------------------------------------------------

CREATE TYPE tipo_propriedade AS ENUM ('site','instagram','facebook','whatsapp','tiktok','loja_marketplace');
CREATE TYPE metodo_posse AS ENUM ('dns_txt','arquivo_html','email_do_dominio','manual');

CREATE TABLE empresa_dominios (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id   uuid NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo         tipo_propriedade NOT NULL DEFAULT 'site',
  valor        text NOT NULL,        -- dominio limpo ou @perfil, mesmo formato de `alvos`

  -- prova de posse
  codigo_posse text,                 -- confia-verificacao=abc123...
  metodo       metodo_posse,
  posse_confirmada_em timestamptz,   -- NULO = não confirmado = não vale selo
  ultima_checagem_em  timestamptz,   -- reconferimos de tempos em tempos

  principal    boolean NOT NULL DEFAULT false,
  criado_em    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tipo, valor)               -- um domínio pertence a uma empresa só
);
CREATE INDEX idx_emp_dom_empresa ON empresa_dominios (empresa_id);
CREATE INDEX idx_emp_dom_valor   ON empresa_dominios (valor)
  WHERE posse_confirmada_em IS NOT NULL;

COMMENT ON COLUMN empresa_dominios.posse_confirmada_em IS
  'Sem isso preenchido o domínio NÃO recebe bônus. É o que impede alguém de reivindicar site alheio.';

-- -------------------------------------------------------------
-- 4. DOCUMENTOS
--
-- LGPD: documento é dado sensível. Guardamos o mínimo, com prazo
-- pra apagar. O arquivo vive fora do banco (disco/S3); aqui fica
-- só a referência e o que foi conferido.
-- -------------------------------------------------------------

CREATE TYPE tipo_documento AS ENUM
  ('contrato_social','cartao_cnpj','documento_socio','selfie_socio',
   'comprovante_endereco','alvara','print_faturamento','outro');

CREATE TABLE empresa_documentos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  uuid NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo        tipo_documento NOT NULL,
  arquivo_ref text NOT NULL,           -- caminho no storage, nunca o arquivo aqui
  sha256      text NOT NULL,
  conferido   boolean,
  conferido_por uuid REFERENCES contas(id),
  conferido_em  timestamptz,
  observacao  text,
  apagar_em   date NOT NULL,           -- prazo de retenção. Rotina apaga depois disso.
  criado_em   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_emp_doc_apagar ON empresa_documentos (apagar_em) WHERE arquivo_ref IS NOT NULL;

-- -------------------------------------------------------------
-- 5. HISTÓRICO DO SELO
-- Toda mudança de nível fica registrada. Se a empresa reclamar
-- depois, existe registro de quando e por quê.
-- -------------------------------------------------------------

CREATE TABLE empresa_eventos (
  id         bigserial PRIMARY KEY,
  empresa_id uuid NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  evento     text NOT NULL,     -- cadastrou | enviou_doc | aprovada | suspensa | revogada
  de_status  status_empresa,
  para_status status_empresa,
  de_nivel   nivel_empresa,
  para_nivel nivel_empresa,
  motivo     text,
  ator_id    uuid REFERENCES contas(id),
  criado_em  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_emp_ev ON empresa_eventos (empresa_id, criado_em DESC);

-- -------------------------------------------------------------
-- 6. QUANTO O SELO VALE  ← A REGRA MAIS IMPORTANTE DO ARQUIVO
--
-- O selo SOMA pontos. Ele NÃO substitui a análise técnica.
--
-- Por quê: se a loja verificada for invadida e passar a servir
-- página de phishing, o selo não pode dizer "confiável". Empresa
-- honesta pode ter o site hackeado — e nesse momento o site É perigoso.
--
-- Por isso `bonus_empresa()` recebe `tem_sinal_grave` e devolve ZERO
-- quando existe. Não mexa nisso sem pensar muito.
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION bonus_empresa(
  p_nivel nivel_empresa,
  p_denuncias int DEFAULT 0,
  p_tem_sinal_grave boolean DEFAULT false
) RETURNS smallint AS $$
DECLARE v_bonus smallint;
BEGIN
  -- Sinal técnico grave (phishing ativo, malware, certificado clonado)
  -- anula qualquer selo. A evidência do agora vale mais que o cadastro.
  IF p_tem_sinal_grave THEN RETURN 0; END IF;

  v_bonus := CASE p_nivel
    WHEN 'curadoria'    THEN 40   -- Instagram, WhatsApp, bancos
    WHEN 'estabelecida' THEN 35
    WHEN 'verificada'   THEN 25
    WHEN 'registrada'   THEN 10   -- só CNPJ ativo prova pouco
    ELSE 0
  END;

  -- Denúncia corrói o selo. 4 denúncias procedentes zeram o bônus.
  v_bonus := GREATEST(0, v_bonus - (p_denuncias * 10));
  RETURN v_bonus;
END $$ LANGUAGE plpgsql IMMUTABLE;

-- Liga a empresa ao alvo. É isso que a análise consulta.
ALTER TABLE alvos
  ADD COLUMN empresa_id uuid REFERENCES empresas(id) ON DELETE SET NULL,
  ADD COLUMN bonus_selo smallint NOT NULL DEFAULT 0;

CREATE INDEX idx_alvos_empresa ON alvos (empresa_id) WHERE empresa_id IS NOT NULL;

-- Dado um domínio, existe empresa verificada por trás?
CREATE OR REPLACE FUNCTION empresa_do_alvo(p_valor text)
RETURNS TABLE (empresa_id uuid, nome text, nivel nivel_empresa,
               desde date, bonus smallint) AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.nome_fantasia, e.nivel,
         e.aprovada_em::date,
         bonus_empresa(e.nivel,
           (SELECT count(*)::int FROM denuncias d
             WHERE d.alvo = p_valor AND d.status = 'confirmada'),
           false)
  FROM empresa_dominios ed
  JOIN empresas e ON e.id = ed.empresa_id
  WHERE ed.valor = p_valor
    AND ed.posse_confirmada_em IS NOT NULL   -- sem prova de posse, não conta
    AND e.status = 'aprovada'
  LIMIT 1;
END $$ LANGUAGE plpgsql;

-- -------------------------------------------------------------
-- 7. SUSPENSÃO AUTOMÁTICA
--
-- Loja verificada que começa a receber denúncia perde o selo
-- SOZINHA, sem esperar alguém olhar. Depois um humano decide
-- se volta ou se revoga de vez.
--
-- É isso que impede o selo de virar escudo pra golpista.
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION suspende_empresa_por_denuncia() RETURNS trigger AS $$
DECLARE v_empresa uuid; v_qtd int;
BEGIN
  SELECT ed.empresa_id INTO v_empresa
  FROM empresa_dominios ed
  WHERE ed.valor = NEW.alvo AND ed.posse_confirmada_em IS NOT NULL
  LIMIT 1;

  IF v_empresa IS NULL THEN RETURN NEW; END IF;

  SELECT count(*) INTO v_qtd FROM denuncias d
   JOIN empresa_dominios ed2 ON ed2.valor = d.alvo
   WHERE ed2.empresa_id = v_empresa
     AND d.status <> 'recusada'
     AND d.criada_em > now() - interval '90 days';

  IF v_qtd >= 3 THEN
    UPDATE empresas SET status = 'suspensa', suspensa_em = now(),
           motivo_status = v_qtd || ' denúncias em 90 dias'
     WHERE id = v_empresa AND status = 'aprovada';

    INSERT INTO empresa_eventos (empresa_id, evento, para_status, motivo)
    VALUES (v_empresa, 'suspensa_automatica', 'suspensa',
            v_qtd || ' denúncias em 90 dias');
  END IF;

  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER tg_denuncia_empresa AFTER INSERT ON denuncias
  FOR EACH ROW EXECUTE FUNCTION suspende_empresa_por_denuncia();

-- -------------------------------------------------------------
-- 8. MARCAS CONHECIDAS (curadoria)
--
-- Cadastradas por nós, com fonte oficial. Não passam pelo fluxo
-- de documento — elas nem sabem que existimos ainda.
--
-- Serve pra duas coisas:
--   (a) reconhecer o site verdadeiro
--   (b) detectar imitação: "1nstagram.com" parece com "instagram.com"
-- -------------------------------------------------------------

INSERT INTO empresas (nome_fantasia, nivel, status, categoria, aprovada_em, motivo_status)
VALUES
 ('Instagram','curadoria','aprovada','rede_social', now(),'curadoria interna'),
 ('WhatsApp','curadoria','aprovada','rede_social', now(),'curadoria interna'),
 ('Facebook','curadoria','aprovada','rede_social', now(),'curadoria interna'),
 ('Mercado Livre','curadoria','aprovada','marketplace', now(),'curadoria interna'),
 ('Correios','curadoria','aprovada','logistica', now(),'curadoria interna');

INSERT INTO empresa_dominios (empresa_id, tipo, valor, metodo, posse_confirmada_em, principal)
SELECT e.id, 'site', d.dominio, 'manual', now(), true
FROM empresas e
JOIN (VALUES
  ('Instagram','instagram.com'),
  ('WhatsApp','whatsapp.com'),
  ('Facebook','facebook.com'),
  ('Mercado Livre','mercadolivre.com.br'),
  ('Correios','correios.com.br')
) AS d(nome, dominio) ON d.nome = e.nome_fantasia
WHERE e.nivel = 'curadoria';

COMMENT ON TABLE empresas IS
  'Selo = a empresa existe e foi conferida. NÃO é garantia de conduta comercial. Ver textos legais.';
