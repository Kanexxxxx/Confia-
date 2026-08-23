-- =============================================================
-- confiia.com.br — migration 005
-- MODERAÇÃO: pedidos de remoção, contestação e fila do admin
--
-- Contexto: o e-mail de contato vai receber pedido de remoção de
-- gente irritada — inclusive de golpista se passando por empresa
-- legítima. Sem processo definido, você decide no impulso e erra
-- para os dois lados: ou remove golpe de verdade, ou mantém
-- acusação injusta contra empresa honesta.
--
-- Este arquivo transforma isso num fluxo com prova, prazo e registro.
--
-- CUIDADO AO MEXER:
--   - `contestacoes.prazo_em` nasce do prazo prometido nos Termos
--     (hoje 7 dias). Mudou lá, mude o DEFAULT aqui.
--   - Toda decisão precisa gravar em `auditoria` — é a sua defesa.
-- =============================================================

-- -------------------------------------------------------------
-- 1. QUEM PEDE E POR QUÊ
-- -------------------------------------------------------------

CREATE TYPE tipo_contestacao AS ENUM (
  'remocao',        -- "tire meu site da lista"
  'correcao',       -- "a informação está errada"
  'direito_resposta', -- "quero registrar minha versão"
  'lgpd'            -- titular pedindo exclusão de dado pessoal
);

CREATE TYPE status_contestacao AS ENUM (
  'recebida',
  'aguardando_prova',  -- pedimos documento e estamos esperando
  'em_analise',
  'deferida',          -- aceita: removemos ou corrigimos
  'parcial',           -- aceita em parte
  'indeferida',        -- mantida a avaliação
  'arquivada'          -- sem resposta do solicitante no prazo
);

CREATE TABLE contestacoes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo     text UNIQUE NOT NULL,   -- CT-2026-000123, é o que a pessoa recebe

  tipo          tipo_contestacao NOT NULL,
  status        status_contestacao NOT NULL DEFAULT 'recebida',

  -- sobre o quê
  alvo          text NOT NULL,          -- mesmo formato de `alvos.chave`
  empresa_id    uuid REFERENCES empresas(id) ON DELETE SET NULL,

  -- quem pediu (pode não ter conta)
  solicitante_nome  text NOT NULL,
  solicitante_email citext NOT NULL,
  solicitante_conta uuid REFERENCES contas(id) ON DELETE SET NULL,
  relacao       text,                   -- 'dono' | 'representante' | 'titular_dado' | 'outro'
  alegacao      text NOT NULL,

  -- identidade conferida?
  -- Este é o campo que separa pedido legítimo de golpista tentando
  -- limpar a ficha. NUNCA deferir com identidade não confirmada.
  identidade_confirmada boolean NOT NULL DEFAULT false,
  metodo_identidade text,               -- 'email_do_dominio' | 'dns_txt' | 'documento' | 'procuracao'

  -- prazo e decisão
  prazo_em      timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  decidida_em   timestamptz,
  decidida_por  uuid REFERENCES contas(id),
  decisao       text,                   -- o que foi respondido, na íntegra
  score_antes   smallint,
  score_depois  smallint,

  criada_em     timestamptz NOT NULL DEFAULT now(),
  atualizada_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_cont_fila  ON contestacoes (status, prazo_em)
  WHERE status IN ('recebida','aguardando_prova','em_analise');
CREATE INDEX idx_cont_alvo  ON contestacoes (alvo, criada_em DESC);
CREATE INDEX idx_cont_email ON contestacoes (solicitante_email);

CREATE TRIGGER tg_cont_upd BEFORE UPDATE ON contestacoes
  FOR EACH ROW EXECUTE FUNCTION toca_atualizada_em();

-- Provas anexadas pelo solicitante (contrato social, procuração, print)
CREATE TABLE contestacao_anexos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contestacao_id uuid NOT NULL REFERENCES contestacoes(id) ON DELETE CASCADE,
  arquivo_ref    text NOT NULL,
  sha256         text NOT NULL,
  descricao      text,
  apagar_em      date NOT NULL DEFAULT (now() + interval '2 years')::date,
  criado_em      timestamptz NOT NULL DEFAULT now()
);

-- Conversa do protocolo. Tudo escrito fica registrado.
CREATE TABLE contestacao_mensagens (
  id             bigserial PRIMARY KEY,
  contestacao_id uuid NOT NULL REFERENCES contestacoes(id) ON DELETE CASCADE,
  autor_id       uuid REFERENCES contas(id) ON DELETE SET NULL,
  do_confia      boolean NOT NULL DEFAULT false,
  corpo          text NOT NULL,
  criada_em      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_cont_msg ON contestacao_mensagens (contestacao_id, criada_em);

-- Gera o protocolo automaticamente: CT-2026-000123
CREATE SEQUENCE seq_protocolo START 1;

CREATE OR REPLACE FUNCTION gera_protocolo() RETURNS trigger AS $$
BEGIN
  IF NEW.protocolo IS NULL OR NEW.protocolo = '' THEN
    NEW.protocolo := 'CT-' || to_char(now(),'YYYY') || '-' ||
                     lpad(nextval('seq_protocolo')::text, 6, '0');
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER tg_protocolo BEFORE INSERT ON contestacoes
  FOR EACH ROW EXECUTE FUNCTION gera_protocolo();


-- -------------------------------------------------------------
-- 2. A REGRA DE DECISÃO
--
-- Serve para você decidir sempre igual, e não pelo humor do dia.
-- Ela também vira o texto da resposta ao solicitante.
-- -------------------------------------------------------------

CREATE TABLE politica_moderacao (
  situacao    text PRIMARY KEY,
  exige       text NOT NULL,     -- o que o solicitante precisa comprovar
  decisao     text NOT NULL,     -- o que fazemos
  prazo_dias  smallint NOT NULL DEFAULT 7
);

INSERT INTO politica_moderacao (situacao, exige, decisao) VALUES

('dono comprova o site e não há denúncia',
 'Prova de posse do domínio (DNS TXT ou e-mail do próprio domínio) + CNPJ ativo',
 'Reanalisar. Se os indícios eram só idade do domínio e dados ocultos, subir o score e convidar para o cadastro de empresa verificada.'),

('dono comprova o site mas há denúncia de usuário',
 'Prova de posse + resposta ponto a ponto às denúncias',
 'Manter o registro das denúncias, publicar a versão da empresa junto e reanalisar. Não removemos relato de consumidor sem prova de que é falso.'),

('empresa alega erro na análise técnica',
 'Indicar qual item está errado',
 'Conferir o item. Estando errado, corrigir, registrar a correção e responder explicando.'),

('titular pede exclusão de dado pessoal (LGPD)',
 'Confirmação de identidade do titular',
 'Excluir o dado pessoal em até 15 dias. O alvo denunciado, quando não for dado pessoal, permanece.'),

('pedido sem comprovação de identidade',
 'Nada apresentado',
 'Não decidir. Solicitar comprovação e aguardar. Sem resposta em 15 dias, arquivar.'),

('ordem judicial',
 'Ofício ou decisão judicial',
 'Cumprir no prazo determinado, registrar e comunicar quem publicou, quando permitido.'),

('suspeita de golpista pedindo limpeza de ficha',
 'Qualquer prova apresentada não confere com dados públicos',
 'Indeferir, registrar a tentativa e manter tudo. Reincidência: bloquear o e-mail solicitante.');

COMMENT ON TABLE politica_moderacao IS
  'Consulte SEMPRE antes de decidir. Decisão fora daqui deve ser justificada por escrito na contestação.';


-- -------------------------------------------------------------
-- 3. FILA ÚNICA DO ADMIN
--
-- Junta tudo que espera decisão humana num lugar só, já ordenado
-- por urgência: o que está perto de estourar o prazo vem primeiro.
-- -------------------------------------------------------------

CREATE VIEW v_fila_admin AS
  SELECT 'contestacao' AS fila,
         c.id::text    AS id,
         c.protocolo   AS referencia,
         c.tipo::text  AS assunto,
         c.alvo,
         c.prazo_em,
         CASE WHEN c.prazo_em < now() THEN 'atrasado'
              WHEN c.prazo_em < now() + interval '2 days' THEN 'urgente'
              ELSE 'no prazo' END AS urgencia,
         c.criada_em
    FROM contestacoes c
   WHERE c.status IN ('recebida','aguardando_prova','em_analise')

  UNION ALL

  SELECT 'denuncia', d.id::text, left(d.id::text, 8), d.categoria, d.alvo,
         d.criada_em + interval '7 days',
         CASE WHEN d.criada_em < now() - interval '7 days' THEN 'atrasado'
              WHEN d.criada_em < now() - interval '5 days' THEN 'urgente'
              ELSE 'no prazo' END,
         d.criada_em
    FROM denuncias d
   WHERE d.status IN ('nova','em_analise')

  UNION ALL

  SELECT 'empresa', e.id::text, e.nome_fantasia, 'cadastro', coalesce(e.cnpj,''),
         e.criada_em + interval '7 days',
         CASE WHEN e.criada_em < now() - interval '7 days' THEN 'atrasado'
              WHEN e.criada_em < now() - interval '5 days' THEN 'urgente'
              ELSE 'no prazo' END,
         e.criada_em
    FROM empresas e
   WHERE e.status = 'em_analise'

  ORDER BY prazo_em;

COMMENT ON VIEW v_fila_admin IS
  'Tela inicial do admin. Se algo aparece como "atrasado", o prazo prometido nos Termos foi furado.';


-- -------------------------------------------------------------
-- 4. TETO DE GASTO
--
-- Você definiu R$ 70/mês para as APIs no beta. Este bloco corta
-- o gasto antes de estourar, em vez de você descobrir na fatura.
-- -------------------------------------------------------------

CREATE TABLE orcamento (
  competencia   date PRIMARY KEY,         -- dia 1 do mês
  teto_cent     integer NOT NULL,         -- 7000 = R$ 70,00
  gasto_cent    integer NOT NULL DEFAULT 0,
  alerta_em_pct smallint NOT NULL DEFAULT 70,
  travado       boolean NOT NULL DEFAULT false, -- true = para de chamar IA
  avisado_em    timestamptz
);

INSERT INTO orcamento (competencia, teto_cent)
VALUES (date_trunc('month', now())::date, 7000);

-- Chame antes de cada análise paga. Devolve false = não gaste.
CREATE OR REPLACE FUNCTION pode_gastar(p_previsto_cent int DEFAULT 1)
RETURNS boolean AS $$
DECLARE v RECORD;
BEGIN
  SELECT * INTO v FROM orcamento
   WHERE competencia = date_trunc('month', now())::date;

  IF NOT FOUND THEN
    INSERT INTO orcamento (competencia, teto_cent)
    VALUES (date_trunc('month', now())::date, 7000);
    RETURN true;
  END IF;

  IF v.travado THEN RETURN false; END IF;
  RETURN (v.gasto_cent + p_previsto_cent) <= v.teto_cent;
END $$ LANGUAGE plpgsql;

-- Soma o gasto e trava sozinho ao bater o teto
CREATE OR REPLACE FUNCTION soma_gasto() RETURNS trigger AS $$
DECLARE v_cent int;
BEGIN
  IF NEW.custo_micro IS NULL OR NEW.custo_micro = 0 THEN RETURN NEW; END IF;

  -- custo_micro é micro-dólar. Ajuste o câmbio conforme a realidade.
  v_cent := GREATEST(1, (NEW.custo_micro * 5.5 / 10000)::int);

  UPDATE orcamento SET
    gasto_cent = gasto_cent + v_cent,
    travado    = (gasto_cent + v_cent) >= teto_cent
  WHERE competencia = date_trunc('month', now())::date;

  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER tg_gasto AFTER INSERT ON logs_externos
  FOR EACH ROW EXECUTE FUNCTION soma_gasto();

COMMENT ON TABLE orcamento IS
  'Teto mensal de API. travado=true faz o sistema responder só com as checagens gratuitas.';
