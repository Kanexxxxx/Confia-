-- =============================================================
-- confiia.com.br — notícias de golpe (a página /noticias)
--
-- POR QUE UMA TABELA, E NÃO BUSCAR O FEED NA HORA
--
-- A dona do projeto decidiu em 27/08/2026 que as notícias viriam
-- de fonte externa. Ao medir antes de escrever, apareceu o motivo
-- de isso não poder ser uma busca ao vivo:
--
--   As seis editorias da Agência Brasil devolvem 10 itens cada, e
--   naquele dia NENHUM dos 60 falava de golpe. Era agosto de
--   eleição, e o feed inteiro era eleitoral.
--
-- Ou seja: uma página que filtrasse o feed na hora abriria VAZIA
-- na maioria dos dias. Notícia de golpe não sai todo dia, mas sai
-- toda semana — o que serve é ACUMULAR, não espiar o instante.
--
-- Por isso esta tabela. Ela é um arquivo que só cresce: o que
-- entrou fica, e a página mostra do mais novo para o mais velho.
--
-- ─────────────────────────────────────────────────────────────
-- O QUE ENTRA AQUI, E O QUE NUNCA ENTRA
--
-- ENTRA: título, link, nome da fonte e data. É o que se pode
-- republicar — manchete com crédito e link para o original é uso
-- legítimo, e é assim que agregador sério funciona.
--
-- NUNCA ENTRA: o texto da matéria. O `description` do RSS vem com
-- a notícia inteira e com imagem hospedada em CDN de terceiro.
-- Copiar o texto é violar direito autoral do veículo; exibir a
-- imagem entrega o IP de cada visitante ao CDN, contra o que a
-- nossa Política de Privacidade promete — e contra o trabalho da
-- Etapa 6, que tirou TODA requisição externa do navegador.
--
-- Por isso não existe coluna de texto nem de imagem. A ausência
-- é a trava: não dá para guardar o que não tem onde caber.
--
-- ─────────────────────────────────────────────────────────────
-- CUIDADO AO MEXER:
--   - `link` é UNIQUE. É o que impede a mesma notícia de entrar
--     dez vezes quando o puxador roda de hora em hora.
--   - A aplicação só LÊ (`GRANT SELECT`). Quem escreve é o
--     `npm run noticias`, que conecta como dono. Rota pública com
--     poder de INSERT numa tabela alimentada de fora seria um
--     jeito de estranhos plantarem link no nosso site.
-- =============================================================

CREATE TABLE IF NOT EXISTS noticias_golpe (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo        text        NOT NULL,
  link          text        NOT NULL UNIQUE,
  fonte         text        NOT NULL,
  publicada_em  timestamptz NOT NULL,
  capturada_em  timestamptz NOT NULL DEFAULT now(),

  -- Qual palavra fez a notícia entrar. Serve para você olhar
  -- depois e ajustar o filtro sem adivinhar o que ele pegou.
  achada_por    text,

  CONSTRAINT noticia_titulo_util CHECK (length(btrim(titulo)) BETWEEN 10 AND 300),
  CONSTRAINT noticia_link_http   CHECK (link ~ '^https://')
);

COMMENT ON TABLE noticias_golpe IS
  'Manchetes sobre golpe vindas de feed público. Só título, link, '
  'fonte e data — nunca o texto nem a imagem da matéria. Ver 019.';

CREATE INDEX IF NOT EXISTS idx_noticias_data
  ON noticias_golpe (publicada_em DESC);

-- -------------------------------------------------------------
-- PERMISSÃO: a aplicação LÊ, e só.
--
-- Compare com as outras tabelas em 015: `denuncias` tem
-- SELECT, INSERT porque o formulário público grava. Aqui não há
-- formulário — quem grava é um script rodado por você, como
-- dono. Então INSERT não é dado a ninguém pelo site.
-- -------------------------------------------------------------
GRANT SELECT ON noticias_golpe TO confia_app;

ALTER TABLE noticias_golpe ENABLE ROW LEVEL SECURITY;

-- Mesma forma das outras: RLS ligada, e uma política nomeada
-- `app_usa`. Sem política escrita, a tabela responde zero linha
-- mesmo com GRANT — que é a trava da 015, e vale aqui também.
DROP POLICY IF EXISTS app_usa ON noticias_golpe;
CREATE POLICY app_usa ON noticias_golpe
  FOR SELECT TO confia_app USING (true);
