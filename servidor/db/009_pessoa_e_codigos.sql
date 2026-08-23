-- =============================================================
-- confiia.com.br — migration 009
-- CÓDIGO CURTO, APELIDO, AVATAR E O CAMINHO DO DOCUMENTO
--
-- Quatro coisas:
--   1. código curto no lugar do UUID na URL
--   2. nome completo + apelido
--   3. avatar escolhido de uma lista (não tem upload)
--   4. onde o CPF/CNPJ vai ficar quando o pagamento entrar
-- =============================================================


-- -------------------------------------------------------------
-- 1. CÓDIGO CURTO PARA A URL
--
-- O UUID continua sendo a chave. O código é só a cara pública:
--
--     /verificacao/a3f8b2c1-9d4e-4a7f-b012-8e6c4d1f9a30
--     /v/7Kd3mQx9Rt2P
--
-- POR QUE NÃO É "MENOS SEGURO":
-- 12 caracteres num alfabeto de 54 dão 54^12 ≈ 10^20 combinações —
-- cerca de 69 bits. Chutar continua inviável. E, como sempre, o que
-- protege de verdade não é o código ser difícil: é o servidor
-- conferir o dono a cada acesso (web/src/lib/guarda.ts).
--
-- O ALFABETO NÃO TEM 0, O, 1, l NEM I.
-- Isso não é capricho: um dia alguém vai ler esse código em voz
-- alta no telefone, ou digitar olhando um print. "zero ou ó?" é
-- atendimento perdido.
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION gera_codigo(tamanho int DEFAULT 12)
RETURNS text AS $$
DECLARE
  -- sem 0 O 1 l I — caracteres que se confundem lidos ou digitados
  alfabeto CONSTANT text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  n CONSTANT int := length(alfabeto);
  saida text := '';
  i int;
BEGIN
  FOR i IN 1..tamanho LOOP
    -- gen_random_bytes vem do pgcrypto: aleatoriedade de verdade,
    -- não a do random(), que é previsível.
    saida := saida || substr(alfabeto, (get_byte(gen_random_bytes(1), 0) % n) + 1, 1);
  END LOOP;
  RETURN saida;
END $$ LANGUAGE plpgsql;

COMMENT ON FUNCTION gera_codigo IS
  'Código público para URL. Alfabeto sem caracteres que se confundem ao ler ou digitar.';

-- Onde o código aparece
ALTER TABLE verificacoes ADD COLUMN codigo text UNIQUE;
ALTER TABLE denuncias    ADD COLUMN codigo text UNIQUE;
ALTER TABLE empresas     ADD COLUMN codigo text UNIQUE;

CREATE OR REPLACE FUNCTION poe_codigo() RETURNS trigger AS $$
BEGIN
  IF NEW.codigo IS NULL THEN NEW.codigo := gera_codigo(12); END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER tg_codigo_verificacao BEFORE INSERT ON verificacoes
  FOR EACH ROW EXECUTE FUNCTION poe_codigo();
CREATE TRIGGER tg_codigo_denuncia BEFORE INSERT ON denuncias
  FOR EACH ROW EXECUTE FUNCTION poe_codigo();
CREATE TRIGGER tg_codigo_empresa BEFORE INSERT ON empresas
  FOR EACH ROW EXECUTE FUNCTION poe_codigo();

-- Preenche o que já existe
UPDATE verificacoes SET codigo = gera_codigo(12) WHERE codigo IS NULL;
UPDATE denuncias    SET codigo = gera_codigo(12) WHERE codigo IS NULL;
UPDATE empresas     SET codigo = gera_codigo(12) WHERE codigo IS NULL;

CREATE INDEX idx_verificacoes_codigo ON verificacoes (codigo);
CREATE INDEX idx_denuncias_codigo    ON denuncias (codigo);
CREATE INDEX idx_empresas_codigo     ON empresas (codigo);


-- -------------------------------------------------------------
-- 2. NOME COMPLETO E APELIDO
--
-- São coisas diferentes e servem a momentos diferentes:
--   nome     "Kaina Rodrigues da Silva"  → nota fiscal, contrato
--   apelido  "Kaina"                     → "Olá, Kaina" na tela
--
-- Sem separar, ou a nota sai errada ou o site chama a pessoa pelo
-- nome inteiro toda vez, o que soa como cobrança de banco.
-- -------------------------------------------------------------

ALTER TABLE contas
  ADD COLUMN apelido text;

-- Quem já existe: apelido = primeiro nome
UPDATE contas SET apelido = split_part(btrim(nome), ' ', 1) WHERE apelido IS NULL;

CREATE OR REPLACE FUNCTION poe_apelido() RETURNS trigger AS $$
BEGIN
  IF NEW.apelido IS NULL OR btrim(NEW.apelido) = '' THEN
    NEW.apelido := split_part(btrim(NEW.nome), ' ', 1);
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER tg_apelido BEFORE INSERT OR UPDATE OF nome, apelido ON contas
  FOR EACH ROW EXECUTE FUNCTION poe_apelido();

COMMENT ON COLUMN contas.nome IS 'Nome completo. Usado em documento e cobrança.';
COMMENT ON COLUMN contas.apelido IS 'Como a pessoa quer ser chamada na tela.';


-- -------------------------------------------------------------
-- 3. AVATAR — ESCOLHIDO, NUNCA ENVIADO
--
-- Não existe upload de foto de perfil. É decisão de produto, e as
-- razões são boas:
--
--   - foto enviada precisa de moderação humana (alguém vai subir
--     algo que não pode);
--   - arquivo enviado por desconhecido é porta de entrada;
--   - foto de rosto é dado pessoal sensível que a gente teria que
--     guardar, proteger e apagar no prazo;
--   - e não melhora nada no produto.
--
-- Guardamos só o NOME do avatar escolhido. Ele é um desenho que
-- mora no nosso código.
-- -------------------------------------------------------------

ALTER TABLE contas
  ADD COLUMN avatar text NOT NULL DEFAULT 'inicial',
  ADD CONSTRAINT avatar_conhecido CHECK (avatar ~ '^[a-z][a-z0-9-]{0,23}$');

COMMENT ON COLUMN contas.avatar IS
  'Nome do avatar escolhido da lista. NUNCA um caminho de arquivo enviado — não existe upload de foto de perfil.';


-- -------------------------------------------------------------
-- 4. COMO A PESSOA RECUPERA A CONTA
--
-- A pessoa escolhe. Hoje há dois caminhos, e o terceiro fica
-- preparado mas desligado:
--
--   email    o link chega no e-mail                 (pronto)
--   reserva  códigos guardados por ela              (Etapa 5)
--   sms      código por mensagem                    (NÃO ligado)
--
-- POR QUE SMS ESTÁ AQUI MAS DESLIGADO:
-- Recuperar conta por SMS é vulnerável ao golpe do SIM swap — o
-- golpista convence a operadora a passar o número para o chip dele
-- e recebe o código. É um dos golpes que este produto existe para
-- combater.
--
-- Um serviço antigolpe recuperando conta por SMS estaria
-- recomendando o que denuncia. Se um dia for ligado, que seja como
-- decisão consciente, e nunca como o único caminho.
-- -------------------------------------------------------------

CREATE TYPE metodo_recuperacao AS ENUM ('email', 'reserva', 'sms');

ALTER TABLE contas
  ADD COLUMN recuperacao metodo_recuperacao NOT NULL DEFAULT 'email';

COMMENT ON COLUMN contas.recuperacao IS
  'Como a pessoa prefere recuperar a conta. sms existe no ENUM mas está desligado — ver SEGURANCA.md.';


-- -------------------------------------------------------------
-- 5. CPF / CNPJ — ONDE VAI FICAR, E POR QUE NÃO AQUI
--
-- O Asaas exige cpfCnpj para criar o cliente. Então precisamos
-- dele — no CHECKOUT, não no cadastro.
--
-- Quem usa o plano grátis nunca paga. Pedir documento no cadastro
-- seria guardar CPF de gente que nunca vai precisar dele — e
-- documento guardado à toa é só risco esperando.
--
-- E mesmo no checkout, o desenho é este:
--   1. a pessoa digita o CPF/CNPJ
--   2. mandamos para o Asaas e criamos o cliente lá
--   3. guardamos o ID DO CLIENTE e os 4 ÚLTIMOS DÍGITOS
--   4. o documento completo NÃO fica no nosso banco
--
-- Assim, se o nosso banco vazar, não vaza documento de ninguém.
-- Quem tem obrigação legal de guardar isso é a instituição de
-- pagamento — e ela tem estrutura para isso.
-- -------------------------------------------------------------

ALTER TABLE assinaturas
  ADD COLUMN documento_ultimos char(4),
  ADD COLUMN documento_tipo text CHECK (documento_tipo IN ('cpf','cnpj'));

COMMENT ON COLUMN assinaturas.documento_ultimos IS
  'Só os 4 últimos dígitos, para a pessoa reconhecer na tela. O documento completo fica no Asaas, nunca aqui.';

-- Trava contra alguém guardar o documento inteiro sem querer
ALTER TABLE assinaturas
  ADD CONSTRAINT documento_so_os_ultimos
  CHECK (documento_ultimos IS NULL OR documento_ultimos ~ '^[0-9]{4}$');
