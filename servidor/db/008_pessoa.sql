-- =============================================================
-- confiia.com.br — migration 008
-- PESSOA FÍSICA OU EMPRESA, E TELEFONE
--
-- Duas informações novas no cadastro:
--
--   tipo_pessoa   'fisica' ou 'juridica'
--   telefone      já existia na tabela; ganha confirmação e regra
--
-- POR QUE SEPARAR PF DE PJ:
-- Não é burocracia — muda o produto. Quem cadastra como empresa
-- vai para o fluxo de `empresas` (CNPJ, prova de posse do domínio,
-- selo). Quem é pessoa física quer só verificar link e não deve
-- levar formulário de CNPJ na cara.
--
-- POR QUE O TELEFONE NÃO É OBRIGATÓRIO PARA PESSOA FÍSICA:
-- A nossa Política de Privacidade promete guardar o MÍNIMO. Dado
-- que a gente pede "porque pode ser útil um dia" é dado que um dia
-- vaza sem nunca ter servido para nada.
--
-- Para pessoa física o telefone serve para recuperar a conta se ela
-- perder o e-mail — o que é bom ter, e não vale exigir de todo
-- mundo. Para empresa é diferente: canal de contato comercial é
-- parte do que ela está pedindo para publicar no selo.
--
-- Resultado: opcional para PF, obrigatório para PJ. A regra está no
-- CHECK abaixo, e não só na tela — tela se contorna.
--
-- CUIDADO AO MEXER:
--   - Tornar o telefone obrigatório para todo mundo exige mudar a
--     Política de Privacidade junto. Prometer uma coisa e coletar
--     outra é o que vira multa.
-- =============================================================

CREATE TYPE tipo_pessoa AS ENUM ('fisica', 'juridica');

ALTER TABLE contas
  ADD COLUMN tipo_pessoa tipo_pessoa NOT NULL DEFAULT 'fisica',
  ADD COLUMN telefone_verificado_em timestamptz;

COMMENT ON COLUMN contas.tipo_pessoa IS
  'Decide o caminho depois do cadastro: PF vai verificar link, PJ vai cadastrar empresa.';
COMMENT ON COLUMN contas.telefone IS
  'Opcional para pessoa física (recuperação de conta). Obrigatório para empresa (contato comercial).';

-- A regra vale no banco, não só no formulário.
ALTER TABLE contas
  ADD CONSTRAINT telefone_obrigatorio_para_empresa
  CHECK (
    tipo_pessoa = 'fisica'
    OR (telefone IS NOT NULL AND length(regexp_replace(telefone, '\D', '', 'g')) >= 10)
  );

-- Telefone guardado sempre só com números, para não existirem
-- "(16) 99706-2339" e "16997062339" como se fossem diferentes.
CREATE OR REPLACE FUNCTION limpa_telefone() RETURNS trigger AS $$
BEGIN
  IF NEW.telefone IS NOT NULL THEN
    NEW.telefone := regexp_replace(NEW.telefone, '\D', '', 'g');
    IF NEW.telefone = '' THEN NEW.telefone := NULL; END IF;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER tg_limpa_telefone BEFORE INSERT OR UPDATE OF telefone ON contas
  FOR EACH ROW EXECUTE FUNCTION limpa_telefone();

-- Índice parcial: só quem tem telefone entra. Serve para achar a
-- conta na recuperação, e para barrar o mesmo número em conta em
-- massa.
CREATE INDEX idx_contas_telefone ON contas (telefone)
  WHERE telefone IS NOT NULL AND excluida_em IS NULL;

-- -------------------------------------------------------------
-- O QUE NÃO ESTAMOS PEDINDO, E POR QUÊ
--
-- CPF e CNPJ NÃO entram aqui. Eles só aparecem quando houver
-- motivo concreto:
--   - CNPJ: no cadastro de empresa (tabela `empresas`), porque é
--     o que sustenta o selo;
--   - CPF: só se e quando o gateway de pagamento exigir, na
--     Etapa 9, e guardado por ELE, não por nós.
--
-- Guardar documento "porque todo site pede" é assumir o risco de
-- vazar documento sem ter ganho nada com ele.
-- -------------------------------------------------------------

COMMENT ON TABLE contas IS
  'Dados mínimos: nome, e-mail, senha. Telefone só quando serve. Documento, nunca aqui.';
