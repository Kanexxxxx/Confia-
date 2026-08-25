-- =============================================================
-- confiia.com.br — o que faltava para a denúncia do site caber
--
-- O formulário de /denunciar coleta quatro coisas que a tabela
-- `denuncias` ainda não guardava. Cada uma tem um motivo:
--
--   se_passou     De quem o golpista se fingiu (Correios, um
--                 banco, um parente). É o campo que revela
--                 CAMPANHA: quando dez denúncias diferentes
--                 citam a mesma marca na mesma semana, não é
--                 coincidência, é uma operação em andamento.
--
--   ocorrido_em   Quando aconteceu. Sem isso não dá para saber
--                 se um alvo está ativo agora ou se é um caso
--                 antigo que já saiu do ar.
--
--   email_aviso   Para contar o desfecho a quem denunciou. É
--                 OPCIONAL, e não aparece na denúncia publicada.
--
--   visibilidade  'anonima' ou 'apelido'. O padrão é anônima, e
--                 a coluna nasce com esse padrão de propósito:
--                 se um dia alguém esquecer de preencher, o
--                 comportamento seguro é o que acontece.
--
-- CUIDADO AO MEXER:
--   - `email_aviso` é dado pessoal de quem denunciou. Ele NÃO
--     pode aparecer em nenhuma consulta pública. A view de
--     denúncia publicada não o inclui — mantenha assim.
--   - Não crie índice sobre `email_aviso`. Índice é uma forma de
--     buscar, e ninguém deveria poder buscar denúncia por e-mail
--     de quem denunciou.
-- =============================================================

ALTER TABLE denuncias
  ADD COLUMN IF NOT EXISTS se_passou    text,
  ADD COLUMN IF NOT EXISTS ocorrido_em  date,
  ADD COLUMN IF NOT EXISTS email_aviso  citext,
  ADD COLUMN IF NOT EXISTS visibilidade text NOT NULL DEFAULT 'anonima';

-- Só os dois valores que a tela oferece. Sem isto, um valor
-- digitado errado viraria uma denúncia que não é nem anônima nem
-- identificada — e o código teria que adivinhar o que fazer.
ALTER TABLE denuncias
  DROP CONSTRAINT IF EXISTS denuncias_visibilidade_valida;
ALTER TABLE denuncias
  ADD CONSTRAINT denuncias_visibilidade_valida
  CHECK (visibilidade IN ('anonima', 'apelido'));

-- Data no futuro é erro de digitação, não denúncia.
ALTER TABLE denuncias
  DROP CONSTRAINT IF EXISTS denuncias_ocorrido_no_passado;
ALTER TABLE denuncias
  ADD CONSTRAINT denuncias_ocorrido_no_passado
  CHECK (ocorrido_em IS NULL OR ocorrido_em <= CURRENT_DATE);

COMMENT ON COLUMN denuncias.se_passou IS
  'Marca/pessoa de quem o golpista se fingiu. Cruzar este campo é o que revela campanha.';
COMMENT ON COLUMN denuncias.email_aviso IS
  'Opcional, só para avisar o desfecho. DADO PESSOAL: nunca sai em consulta pública.';
COMMENT ON COLUMN denuncias.visibilidade IS
  'anonima (padrão) | apelido. O padrão seguro é o que acontece quando ninguém decide.';

-- Campanha em andamento: quais marcas estão sendo usadas agora.
-- Índice parcial — só o que tem valor e é recente importa.
CREATE INDEX IF NOT EXISTS idx_denuncias_se_passou
  ON denuncias (lower(se_passou), criada_em DESC)
  WHERE se_passou IS NOT NULL;
