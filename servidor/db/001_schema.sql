-- =============================================================
-- confiia.com.br — esquema do banco (PostgreSQL 16+)
-- Rodar:  psql -U confia -d confia -f db/001_schema.sql
-- =============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;     -- e-mail sem diferenciar maiúscula

-- =============================================================
-- 1. CONTAS
-- =============================================================

CREATE TYPE status_conta AS ENUM ('ativa', 'suspensa', 'excluida');

CREATE TABLE contas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           citext UNIQUE NOT NULL,
  senha_hash      text,                       -- nulo em conta criada por login social
  nome            text NOT NULL,
  telefone        text,
  status          status_conta NOT NULL DEFAULT 'ativa',
  email_verificado_em timestamptz,
  aceitou_termos_em   timestamptz,
  aceitou_termos_versao text,                 -- prova de qual versão foi aceita (LGPD)
  ultimo_acesso_em    timestamptz,
  criada_em       timestamptz NOT NULL DEFAULT now(),
  atualizada_em   timestamptz NOT NULL DEFAULT now(),
  excluida_em     timestamptz                 -- exclusão lógica; some do produto, fica pro jurídico
);
CREATE INDEX idx_contas_status ON contas (status) WHERE excluida_em IS NULL;

-- Sessão em banco (e não só JWT) para conseguir derrubar acesso na hora
CREATE TABLE sessoes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id      uuid NOT NULL REFERENCES contas(id) ON DELETE CASCADE,
  token_hash    text UNIQUE NOT NULL,         -- guarda o hash, nunca o token
  ip            inet,
  navegador     text,
  expira_em     timestamptz NOT NULL,
  revogada_em   timestamptz,
  criada_em     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sessoes_conta ON sessoes (conta_id) WHERE revogada_em IS NULL;

-- Verificar e-mail, trocar senha, convidar familiar
CREATE TYPE tipo_token AS ENUM ('verificar_email', 'trocar_senha', 'convite_familia', 'trocar_email');

CREATE TABLE tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id    uuid NOT NULL REFERENCES contas(id) ON DELETE CASCADE,
  tipo        tipo_token NOT NULL,
  token_hash  text UNIQUE NOT NULL,
  destino     citext,                          -- e-mail alvo (troca de e-mail, convite)
  tentativas  smallint NOT NULL DEFAULT 0,
  expira_em   timestamptz NOT NULL,
  usado_em    timestamptz,
  criado_em   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tokens_conta_tipo ON tokens (conta_id, tipo) WHERE usado_em IS NULL;

-- =============================================================
-- 2. PLANOS E ASSINATURAS
-- =============================================================

CREATE TABLE planos (
  id            smallserial PRIMARY KEY,
  slug          text UNIQUE NOT NULL,         -- gratis | basico | premium | enterprise
  nome          text NOT NULL,
  preco_mes_cent  integer NOT NULL DEFAULT 0, -- centavos, nunca float com dinheiro
  preco_ano_cent  integer NOT NULL DEFAULT 0,
  limites       jsonb NOT NULL,               -- {verificacoes_mes, imagens_mes, lote, membros, ...}
  recursos      jsonb NOT NULL DEFAULT '{}',  -- {monitoramento:true, revisao_humana:true, api:false}
  visivel       boolean NOT NULL DEFAULT true,
  ordem         smallint NOT NULL DEFAULT 0
);

INSERT INTO planos (slug, nome, preco_mes_cent, preco_ano_cent, limites, recursos, ordem) VALUES
('gratis','Grátis',0,0,
 '{"verificacoes_mes":5,"verificacoes_anonimo":2,"imagens_mes":0,"lote":1,"membros":1,"historico_dias":7}',
 '{"extensao":false,"monitoramento":false,"revisao_humana":false,"busca_reversa":false,"api":false}',1),
('basico','Básico',1290,9900,
 '{"verificacoes_mes":30,"imagens_mes":5,"lote":2,"membros":1,"historico_dias":null}',
 '{"extensao":true,"monitoramento":false,"revisao_humana":false,"busca_reversa":false,"api":false}',2),
('premium','Premium',2490,19900,
 '{"verificacoes_mes":150,"imagens_mes":40,"lote":10,"membros":5,"historico_dias":null}',
 '{"extensao":true,"monitoramento":true,"revisao_humana":true,"busca_reversa":true,"api":false}',3),
('enterprise','Enterprise',0,0,
 '{"verificacoes_mes":null,"imagens_mes":null,"lote":null,"membros":null,"historico_dias":null}',
 '{"extensao":true,"monitoramento":true,"revisao_humana":true,"busca_reversa":true,"api":true}',4);

CREATE TYPE status_assinatura AS ENUM
  ('ativa','pendente','atrasada','cancelada','expirada','teste');
CREATE TYPE ciclo_cobranca AS ENUM ('mensal','anual');

CREATE TABLE assinaturas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id        uuid NOT NULL REFERENCES contas(id) ON DELETE CASCADE,
  plano_id        smallint NOT NULL REFERENCES planos(id),
  status          status_assinatura NOT NULL DEFAULT 'pendente',
  ciclo           ciclo_cobranca NOT NULL DEFAULT 'mensal',
  asaas_cliente_id     text,
  asaas_assinatura_id  text UNIQUE,
  inicio_em       timestamptz,
  proxima_cobranca date,
  cancelada_em    timestamptz,
  motivo_cancelamento text,
  criada_em       timestamptz NOT NULL DEFAULT now(),
  atualizada_em   timestamptz NOT NULL DEFAULT now()
);
-- uma assinatura ativa por conta
CREATE UNIQUE INDEX idx_assinatura_viva ON assinaturas (conta_id)
  WHERE status IN ('ativa','pendente','atrasada','teste');

CREATE TYPE status_pagamento AS ENUM
  ('pendente','confirmado','recebido','vencido','estornado','falhou');

CREATE TABLE pagamentos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assinatura_id  uuid NOT NULL REFERENCES assinaturas(id) ON DELETE CASCADE,
  asaas_id       text UNIQUE NOT NULL,
  valor_cent     integer NOT NULL,
  metodo         text,                        -- PIX | CREDIT_CARD | BOLETO
  status         status_pagamento NOT NULL DEFAULT 'pendente',
  vencimento     date,
  pago_em        timestamptz,
  estornado_em   timestamptz,
  link_fatura    text,
  criado_em      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pagamentos_assinatura ON pagamentos (assinatura_id, criado_em DESC);

-- Toda notificação do Asaas fica registrada (evita processar duas vezes e serve de prova)
CREATE TABLE asaas_eventos (
  id           bigserial PRIMARY KEY,
  evento_id    text UNIQUE NOT NULL,
  tipo         text NOT NULL,
  corpo        jsonb NOT NULL,
  processado_em timestamptz,
  erro         text,
  recebido_em  timestamptz NOT NULL DEFAULT now()
);

-- =============================================================
-- 3. FAMÍLIA (Premium: até 5 pessoas)
-- =============================================================

CREATE TYPE papel_membro AS ENUM ('dono','membro');

CREATE TABLE membros (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titular_id   uuid NOT NULL REFERENCES contas(id) ON DELETE CASCADE,
  membro_id    uuid NOT NULL REFERENCES contas(id) ON DELETE CASCADE,
  papel        papel_membro NOT NULL DEFAULT 'membro',
  apelido      text,                          -- "Mãe", "Vô Zé"
  modo_simples boolean NOT NULL DEFAULT false,-- tela reduzida pra quem tem dificuldade
  entrou_em    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (titular_id, membro_id)
);
CREATE INDEX idx_membros_membro ON membros (membro_id);

-- =============================================================
-- 4. VERIFICAÇÕES
-- =============================================================

CREATE TYPE tipo_alvo   AS ENUM ('link','dominio','perfil','imagem','texto');
CREATE TYPE veredito    AS ENUM ('confiavel','suspeito','perigoso','inconclusivo');
CREATE TYPE origem_req  AS ENUM ('site','extensao','app','api','whatsapp');

CREATE TABLE verificacoes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id      uuid REFERENCES contas(id) ON DELETE SET NULL,  -- nulo = anônimo (as 2 grátis)
  anonimo_hash  text,                         -- hash de IP+navegador, controla as 2 sem conta
  tipo          tipo_alvo NOT NULL,
  alvo          text NOT NULL,                -- URL, @perfil ou hash da imagem
  alvo_normalizado text,                      -- domínio limpo, pra cache e monitoramento
  veredito      veredito,
  score         smallint CHECK (score BETWEEN 0 AND 100),
  confianca     smallint CHECK (confianca BETWEEN 0 AND 100),
  resumo        text,                         -- a frase que a pessoa lê
  origem        origem_req NOT NULL DEFAULT 'site',
  modelo        text,                         -- gpt-5.6-luna | terra | sol
  custo_micro   integer,                      -- custo em micro-dólares (10^-6), pra medir margem
  duracao_ms    integer,
  revisado_por  uuid REFERENCES contas(id),   -- revisão humana (Premium)
  revisado_em   timestamptz,
  criada_em     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_verif_conta   ON verificacoes (conta_id, criada_em DESC);
CREATE INDEX idx_verif_alvo    ON verificacoes (alvo_normalizado, criada_em DESC);
CREATE INDEX idx_verif_anonimo ON verificacoes (anonimo_hash, criada_em DESC) WHERE conta_id IS NULL;
CREATE INDEX idx_verif_busca   ON verificacoes USING gin (to_tsvector('portuguese', coalesce(alvo,'') || ' ' || coalesce(resumo,'')));

-- Cada linha do "Detalhes da análise"
CREATE TYPE estado_item AS ENUM ('ok','alerta','risco','indisponivel');

CREATE TABLE verificacao_itens (
  id             bigserial PRIMARY KEY,
  verificacao_id uuid NOT NULL REFERENCES verificacoes(id) ON DELETE CASCADE,
  chave          text NOT NULL,   -- url | ssl | dns | safe_browsing | marca | imagem_ia | reputacao
  titulo         text NOT NULL,
  estado         estado_item NOT NULL,
  detalhe        text,
  etiquetas      jsonb NOT NULL DEFAULT '[]', -- [{"texto":"6 dias de idade","cor":"alerta"}]
  peso           smallint NOT NULL DEFAULT 0, -- quanto mexeu no score
  ordem          smallint NOT NULL DEFAULT 0
);
CREATE INDEX idx_itens_verif ON verificacao_itens (verificacao_id, ordem);

-- =============================================================
-- 5. IMAGENS
-- A imagem some depois da análise. Fica só o que foi concluído.
-- =============================================================

CREATE TABLE imagens (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verificacao_id uuid NOT NULL REFERENCES verificacoes(id) ON DELETE CASCADE,
  sha256         text NOT NULL,               -- evita reanalisar a mesma imagem
  mime           text NOT NULL,
  bytes          integer NOT NULL,
  largura        integer,
  altura         integer,

  -- selo de origem (C2PA / SynthID): quando existe, vale mais que qualquer detector
  c2pa_presente  boolean NOT NULL DEFAULT false,
  c2pa_valido    boolean,                     -- false = assinatura quebrada, sinal de adulteração
  c2pa_emissor   text,                        -- "OpenAI", "Adobe", "Leica"
  c2pa_declara_ia boolean,                    -- o próprio arquivo assume que é de IA
  c2pa_bruto     jsonb,

  -- detector dedicado (Hive), usado quando não há selo
  ia_probabilidade smallint CHECK (ia_probabilidade BETWEEN 0 AND 100),
  ia_gerador     text,                        -- "Midjourney", "Sora"
  ia_fornecedor  text NOT NULL DEFAULT 'hive',

  texto_extraido text,                        -- OCR do print
  apagada_em     timestamptz,                 -- arquivo removido do disco
  criada_em      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_imagens_sha ON imagens (sha256);

-- =============================================================
-- 6. LIMITES DE USO
-- =============================================================

CREATE TABLE uso_mensal (
  conta_id     uuid NOT NULL REFERENCES contas(id) ON DELETE CASCADE,
  competencia  date NOT NULL,                 -- sempre dia 1 do mês
  verificacoes integer NOT NULL DEFAULT 0,
  imagens      integer NOT NULL DEFAULT 0,
  revisoes     integer NOT NULL DEFAULT 0,
  PRIMARY KEY (conta_id, competencia)
);

-- Cache: domínio já analisado há pouco não gasta IA de novo
CREATE TABLE cache_dominio (
  dominio       text PRIMARY KEY,
  score         smallint,
  veredito      veredito,
  itens         jsonb,
  fonte         text,
  expira_em     timestamptz NOT NULL,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_cache_expira ON cache_dominio (expira_em);

-- =============================================================
-- 7. MONITORAMENTO (Premium)
-- =============================================================

CREATE TABLE monitoramentos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id       uuid NOT NULL REFERENCES contas(id) ON DELETE CASCADE,
  alvo           text NOT NULL,
  score_anterior smallint,
  ultima_checagem timestamptz,
  proxima_checagem timestamptz,
  ativo          boolean NOT NULL DEFAULT true,
  criado_em      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conta_id, alvo)
);
CREATE INDEX idx_monitor_fila ON monitoramentos (proxima_checagem) WHERE ativo;

-- =============================================================
-- 8. DENÚNCIAS DA COMUNIDADE
-- =============================================================

CREATE TYPE status_denuncia AS ENUM ('nova','em_analise','confirmada','recusada');

CREATE TABLE denuncias (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id    uuid REFERENCES contas(id) ON DELETE SET NULL,
  alvo        text NOT NULL,
  categoria   text NOT NULL,                  -- loja | jogo | emprestimo | emprego | premio | perfil
  relato      text,
  prejuizo_cent integer,
  status      status_denuncia NOT NULL DEFAULT 'nova',
  analisada_por uuid REFERENCES contas(id),
  analisada_em  timestamptz,
  criada_em   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_denuncias_status ON denuncias (status, criada_em DESC);
CREATE INDEX idx_denuncias_alvo ON denuncias (alvo);

-- =============================================================
-- 9. API (Enterprise)
-- =============================================================

CREATE TABLE api_chaves (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id    uuid NOT NULL REFERENCES contas(id) ON DELETE CASCADE,
  nome        text NOT NULL,
  prefixo     text NOT NULL,                  -- 8 primeiros caracteres, pra exibir
  chave_hash  text UNIQUE NOT NULL,
  escopos     text[] NOT NULL DEFAULT '{verificar}',
  limite_min  integer NOT NULL DEFAULT 60,
  ultimo_uso_em timestamptz,
  revogada_em timestamptz,
  criada_em   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE webhooks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id    uuid NOT NULL REFERENCES contas(id) ON DELETE CASCADE,
  url         text NOT NULL,
  segredo     text NOT NULL,
  eventos     text[] NOT NULL DEFAULT '{verificacao.concluida}',
  ativo       boolean NOT NULL DEFAULT true,
  falhas      smallint NOT NULL DEFAULT 0,
  criado_em   timestamptz NOT NULL DEFAULT now()
);

-- =============================================================
-- 10. SUPORTE
-- =============================================================

CREATE TYPE status_ticket AS ENUM ('aberto','respondido','aguardando','resolvido','fechado');

CREATE TABLE tickets (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id   uuid REFERENCES contas(id) ON DELETE SET NULL,
  email      citext NOT NULL,
  assunto    text NOT NULL,
  status     status_ticket NOT NULL DEFAULT 'aberto',
  prioridade smallint NOT NULL DEFAULT 3,     -- 1 = Enterprise, 2 = Premium, 3 = resto
  verificacao_id uuid REFERENCES verificacoes(id) ON DELETE SET NULL,
  criado_em  timestamptz NOT NULL DEFAULT now(),
  fechado_em timestamptz
);
CREATE INDEX idx_tickets_fila ON tickets (status, prioridade, criado_em);

CREATE TABLE ticket_mensagens (
  id         bigserial PRIMARY KEY,
  ticket_id  uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  autor_id   uuid REFERENCES contas(id) ON DELETE SET NULL,
  do_suporte boolean NOT NULL DEFAULT false,
  corpo      text NOT NULL,
  criada_em  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ticket_msg ON ticket_mensagens (ticket_id, criada_em);

-- =============================================================
-- 11. E-MAIL ENVIADO (Resend)
-- =============================================================

CREATE TABLE emails (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id   uuid REFERENCES contas(id) ON DELETE SET NULL,
  destino    citext NOT NULL,
  modelo     text NOT NULL,          -- verificar_email | trocar_senha | alerta_monitor | fatura
  resend_id  text,
  status     text NOT NULL DEFAULT 'enviado', -- enviado|entregue|aberto|falhou|spam
  erro       text,
  enviado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_emails_conta ON emails (conta_id, enviado_em DESC);

-- =============================================================
-- 12. ADMIN E AUDITORIA
-- =============================================================

CREATE TABLE admins (
  conta_id  uuid PRIMARY KEY REFERENCES contas(id) ON DELETE CASCADE,
  nivel     smallint NOT NULL DEFAULT 1,      -- 1 = dono, 2 = operação
  criado_em timestamptz NOT NULL DEFAULT now()
);

-- Toda ação sensível fica registrada. Sem isso não há como auditar nada.
CREATE TABLE auditoria (
  id         bigserial PRIMARY KEY,
  ator_id    uuid REFERENCES contas(id) ON DELETE SET NULL,
  acao       text NOT NULL,                   -- conta.suspender | plano.alterar | verificacao.revisar
  alvo_tipo  text,
  alvo_id    text,
  antes      jsonb,
  depois     jsonb,
  ip         inet,
  criada_em  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_auditoria_ator ON auditoria (ator_id, criada_em DESC);
CREATE INDEX idx_auditoria_alvo ON auditoria (alvo_tipo, alvo_id, criada_em DESC);

-- Erros e chamadas externas, pra achar problema sem adivinhar
CREATE TABLE logs_externos (
  id         bigserial PRIMARY KEY,
  servico    text NOT NULL,                   -- openai | hive | safebrowsing | asaas | resend
  operacao   text,
  http       smallint,
  duracao_ms integer,
  custo_micro integer,
  erro       text,
  verificacao_id uuid REFERENCES verificacoes(id) ON DELETE SET NULL,
  criado_em  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_logs_servico ON logs_externos (servico, criado_em DESC);

-- =============================================================
-- 13. LGPD — pedidos do titular
-- =============================================================

CREATE TYPE tipo_pedido_lgpd AS ENUM ('exportar','excluir','corrigir','revogar_consentimento');

CREATE TABLE pedidos_lgpd (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id   uuid NOT NULL REFERENCES contas(id) ON DELETE CASCADE,
  tipo       tipo_pedido_lgpd NOT NULL,
  status     text NOT NULL DEFAULT 'pendente',
  arquivo_url text,
  atendido_em timestamptz,
  criado_em  timestamptz NOT NULL DEFAULT now()
);

-- =============================================================
-- 14. GATILHOS
-- =============================================================

CREATE OR REPLACE FUNCTION toca_atualizada_em() RETURNS trigger AS $$
BEGIN
  NEW.atualizada_em = now();
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER tg_contas_upd     BEFORE UPDATE ON contas
  FOR EACH ROW EXECUTE FUNCTION toca_atualizada_em();
CREATE TRIGGER tg_assinaturas_upd BEFORE UPDATE ON assinaturas
  FOR EACH ROW EXECUTE FUNCTION toca_atualizada_em();

-- Conta o uso do mês automaticamente
CREATE OR REPLACE FUNCTION conta_uso() RETURNS trigger AS $$
BEGIN
  IF NEW.conta_id IS NULL THEN RETURN NEW; END IF;
  INSERT INTO uso_mensal (conta_id, competencia, verificacoes, imagens)
  VALUES (NEW.conta_id, date_trunc('month', now())::date, 1,
          CASE WHEN NEW.tipo = 'imagem' THEN 1 ELSE 0 END)
  ON CONFLICT (conta_id, competencia) DO UPDATE
    SET verificacoes = uso_mensal.verificacoes + 1,
        imagens      = uso_mensal.imagens + CASE WHEN NEW.tipo = 'imagem' THEN 1 ELSE 0 END;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER tg_uso AFTER INSERT ON verificacoes
  FOR EACH ROW EXECUTE FUNCTION conta_uso();

-- =============================================================
-- 15. VISÕES PARA O ADMIN
-- =============================================================

CREATE VIEW v_conta_completa AS
SELECT c.id, c.email, c.nome, c.status, c.criada_em, c.ultimo_acesso_em,
       p.slug  AS plano,
       a.status AS status_assinatura,
       a.proxima_cobranca,
       COALESCE(u.verificacoes, 0) AS usou_mes,
       COALESCE(u.imagens, 0)      AS imagens_mes,
       (p.limites->>'verificacoes_mes')::int AS limite_mes
FROM contas c
LEFT JOIN assinaturas a ON a.conta_id = c.id
     AND a.status IN ('ativa','pendente','atrasada','teste')
LEFT JOIN planos p ON p.id = COALESCE(a.plano_id, 1)
LEFT JOIN uso_mensal u ON u.conta_id = c.id
     AND u.competencia = date_trunc('month', now())::date
WHERE c.excluida_em IS NULL;

CREATE VIEW v_custo_dia AS
SELECT date_trunc('day', criado_em)::date AS dia,
       servico,
       count(*) AS chamadas,
       sum(custo_micro) / 1000000.0 AS custo_usd
FROM logs_externos
GROUP BY 1, 2
ORDER BY 1 DESC;
