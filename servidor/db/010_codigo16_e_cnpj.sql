-- =============================================================
-- confiia.com.br — migration 010
-- CÓDIGO DE 16 E O CNPJ DA EMPRESA
-- =============================================================


-- -------------------------------------------------------------
-- 1. CÓDIGO PÚBLICO: 12 → 16 CARACTERES
--
-- Comparação honesta, porque a conta anterior estava errada num
-- comentário antigo (falava em "13 Mega-Senas", o que é falso):
--
--   Mega-Sena, uma aposta ....... 1 em 5,0 × 10^7
--   código de 12 ................ 1 em 1,0 × 10^20   ≈ 2,7 Mega-Senas seguidas
--   código de 16 ................ 1 em 5,2 × 10^27   ≈ 3,6 Mega-Senas seguidas
--   UUID .......................... 1 em 5,3 × 10^36  ≈ 4,8 Mega-Senas seguidas
--
-- 12 já era inviável de adivinhar. 16 custa quatro caracteres e
-- dá sete ordens de grandeza a mais. Vale.
--
-- MAS O IMPORTANTE CONTINUA SENDO OUTRO: o código não é a tranca.
-- A tranca é o servidor conferir o dono a cada acesso
-- (web/src/lib/guarda.ts). Código difícil só evita que alguém
-- descubra endereços chutando; não protege endereço que vazou.
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION gera_codigo(tamanho int DEFAULT 16)
RETURNS text AS $$
DECLARE
  alfabeto CONSTANT text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  n CONSTANT int := length(alfabeto);
  saida text := '';
  i int;
BEGIN
  FOR i IN 1..tamanho LOOP
    saida := saida || substr(alfabeto, (get_byte(gen_random_bytes(1), 0) % n) + 1, 1);
  END LOOP;
  RETURN saida;
END $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION poe_codigo() RETURNS trigger AS $$
BEGIN
  IF NEW.codigo IS NULL THEN NEW.codigo := gera_codigo(16); END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

-- Os que já existem continuam com 12 e seguem válidos: quebrar
-- endereço que já foi compartilhado seria pior que a diferença
-- de entropia. Novos nascem com 16.


-- -------------------------------------------------------------
-- 2. CNPJ DA EMPRESA
--
-- POR QUE O CNPJ ENTRA E O CPF NÃO:
--
--   CNPJ é DADO PÚBLICO. A Receita Federal publica razão social,
--   situação, endereço e sócios de todo CNPJ ativo. Guardar não
--   cria risco novo — e é o que sustenta o selo: sem ele não dá
--   para dizer "esta empresa existe e está ativa".
--
--   CPF é DADO PESSOAL. Vazou, vira instrumento de fraude. Ele
--   nunca entra aqui: vai direto para o Asaas no checkout, e do
--   nosso lado ficam só os 4 últimos dígitos (migração 009).
--
-- A distinção não é detalhe jurídico — é a diferença entre um
-- vazamento constrangedor e um vazamento que faz vítima.
-- -------------------------------------------------------------

ALTER TABLE contas
  ADD COLUMN cnpj char(14);

COMMENT ON COLUMN contas.cnpj IS
  'Só para conta de empresa. Dado público da Receita. CPF NUNCA entra aqui — vai para o Asaas no checkout.';

-- Empresa precisa de CNPJ; pessoa física não pode ter.
ALTER TABLE contas
  ADD CONSTRAINT cnpj_combina_com_o_tipo
  CHECK (
    (tipo_pessoa = 'juridica' AND cnpj IS NOT NULL AND cnpj ~ '^[0-9]{14}$')
    OR
    (tipo_pessoa = 'fisica' AND cnpj IS NULL)
  );

-- Guardado só com números, para "12.345.678/0001-90" e
-- "12345678000190" não virarem dois cadastros diferentes.
CREATE OR REPLACE FUNCTION limpa_cnpj() RETURNS trigger AS $$
BEGIN
  IF NEW.cnpj IS NOT NULL THEN
    NEW.cnpj := regexp_replace(NEW.cnpj, '\D', '', 'g');
    IF NEW.cnpj = '' THEN NEW.cnpj := NULL; END IF;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER tg_limpa_cnpj BEFORE INSERT OR UPDATE OF cnpj ON contas
  FOR EACH ROW EXECUTE FUNCTION limpa_cnpj();

-- Um CNPJ, uma conta. Sem isto, dez contas para a mesma empresa e
-- ninguém sabe qual é a de verdade.
CREATE UNIQUE INDEX idx_contas_cnpj ON contas (cnpj)
  WHERE cnpj IS NOT NULL AND excluida_em IS NULL;


-- -------------------------------------------------------------
-- 3. CONFERÊNCIA DOS DÍGITOS DO CNPJ, NO BANCO
--
-- Os dois últimos dígitos do CNPJ são calculados a partir dos
-- outros doze. Conferir isso barra número inventado e erro de
-- digitação antes de qualquer coisa — sem depender de consulta
-- externa, e sem depender do formulário.
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION cnpj_valido(p text)
RETURNS boolean AS $$
DECLARE
  n text := regexp_replace(COALESCE(p, ''), '\D', '', 'g');
  pesos1 CONSTANT int[] := ARRAY[5,4,3,2,9,8,7,6,5,4,3,2];
  pesos2 CONSTANT int[] := ARRAY[6,5,4,3,2,9,8,7,6,5,4,3,2];
  soma int := 0;
  d1 int; d2 int; i int;
BEGIN
  IF length(n) <> 14 THEN RETURN false; END IF;

  -- 11111111111111 e afins passam na conta dos dígitos, mas não existem
  IF n ~ '^(\d)\1{13}$' THEN RETURN false; END IF;

  FOR i IN 1..12 LOOP
    soma := soma + substr(n, i, 1)::int * pesos1[i];
  END LOOP;
  d1 := 11 - (soma % 11);
  IF d1 >= 10 THEN d1 := 0; END IF;
  IF substr(n, 13, 1)::int <> d1 THEN RETURN false; END IF;

  soma := 0;
  FOR i IN 1..13 LOOP
    soma := soma + substr(n, i, 1)::int * pesos2[i];
  END LOOP;
  d2 := 11 - (soma % 11);
  IF d2 >= 10 THEN d2 := 0; END IF;

  RETURN substr(n, 14, 1)::int = d2;
END $$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION cnpj_valido IS
  'Confere os dígitos verificadores. Diz que o número é bem formado — não que a empresa existe. Isso só a Receita responde.';

ALTER TABLE contas
  ADD CONSTRAINT cnpj_com_digito_certo
  CHECK (cnpj IS NULL OR cnpj_valido(cnpj));
