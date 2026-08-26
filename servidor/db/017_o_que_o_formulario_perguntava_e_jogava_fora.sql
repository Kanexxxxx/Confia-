-- =============================================================
-- confiia.com.br — o que o formulário perguntava e jogava fora
--
-- O QUE ESTA MIGRAÇÃO RESOLVE
--
-- Três perguntas dos formulários públicos não tinham onde cair.
-- Duas delas são pior que campo faltando: são pergunta feita e
-- resposta ignorada.
--
--   1. /denunciar oferece "Como sua denúncia aparece: anônima ou
--      COM APELIDO". Escolher apelido não abria campo nenhum. A
--      pessoa dizia "quero aparecer com apelido" e nunca era
--      perguntado qual. A denúncia saía anônima do mesmo jeito.
--
--   2. /denunciar tem "Outro" na lista de tipos de golpe. Marcar
--      "Outro" gravava a palavra "outro" e mais nada. Justamente
--      a denúncia mais valiosa — a que não cabe em nenhuma
--      gaveta que a gente já conhece — era a que chegava vazia.
--
--   3. /registrar-loja tem "Outro" em "o que vocês fazem", com o
--      mesmo problema.
--
-- Nenhuma dava erro. O formulário respondia "recebido", e a
-- resposta era descartada em silêncio no caminho.
--
-- ─────────────────────────────────────────────────────────────
-- POR QUE COLUNA NOVA E NÃO REAPROVEITAR `descricao_novo`
--
-- `denuncias.descricao_novo` já existe e guarda "o que teve de
-- diferente" quando a pessoa marca GOLPE NOVO. É outra pergunta:
-- "golpe novo" é sobre o roteiro ser inédito; "outro" é sobre a
-- nossa lista não ter a gaveta. Uma denúncia pode ser as duas
-- coisas, ou só uma. Juntar as duas numa coluna faria a segunda
-- apagar a primeira.
--
-- ─────────────────────────────────────────────────────────────
-- CUIDADO AO MEXER:
--   - `apelido` é DADO DE PESSOA, e aparece em público. Ele é o
--     único campo do /denunciar que sai na tela para estranhos.
--     Se algum dia houver moderação de conteúdo, é por aqui que
--     ela começa.
--   - Os dois `categoria_outro` são texto livre escrito por
--     qualquer um da internet, sem conta. Trate como texto, nunca
--     como HTML — o React já escapa, mas se algum relatório for
--     gerado fora dele, escape lá também.
--   - Limite de 60/80 caracteres é de propósito: campo curto é
--     campo que não vira parágrafo de propaganda.
-- =============================================================

-- ---------- /denunciar ----------

ALTER TABLE denuncias ADD COLUMN IF NOT EXISTS apelido text;
ALTER TABLE denuncias ADD COLUMN IF NOT EXISTS categoria_outro text;

COMMENT ON COLUMN denuncias.apelido IS
  'Como a pessoa quer ser chamada quando visibilidade = apelido. '
  'É o ÚNICO campo desta tabela que aparece em público.';
COMMENT ON COLUMN denuncias.categoria_outro IS
  'O que a pessoa escreveu quando marcou categoria = outro. '
  'Diferente de descricao_novo, que é sobre golpe inédito.';

-- Apelido só faz sentido com a visibilidade que o pede, e
-- visibilidade "apelido" sem apelido é a promessa quebrada de
-- novo. O banco passa a recusar as duas combinações erradas.
ALTER TABLE denuncias DROP CONSTRAINT IF EXISTS denuncia_apelido_coerente;
ALTER TABLE denuncias ADD CONSTRAINT denuncia_apelido_coerente CHECK (
  (visibilidade = 'apelido' AND apelido IS NOT NULL AND length(btrim(apelido)) BETWEEN 2 AND 60)
  OR
  (visibilidade <> 'apelido' AND apelido IS NULL)
);

ALTER TABLE denuncias DROP CONSTRAINT IF EXISTS denuncia_categoria_outro_curta;
ALTER TABLE denuncias ADD CONSTRAINT denuncia_categoria_outro_curta CHECK (
  categoria_outro IS NULL OR length(btrim(categoria_outro)) BETWEEN 3 AND 80
);

-- ---------- /registrar-loja ----------

ALTER TABLE empresas ADD COLUMN IF NOT EXISTS categoria_outro text;

COMMENT ON COLUMN empresas.categoria_outro IS
  'O que a loja escreveu quando escolheu categoria = outro.';

ALTER TABLE empresas DROP CONSTRAINT IF EXISTS empresa_categoria_outro_curta;
ALTER TABLE empresas ADD CONSTRAINT empresa_categoria_outro_curta CHECK (
  categoria_outro IS NULL OR length(btrim(categoria_outro)) BETWEEN 3 AND 80
);
