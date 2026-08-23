-- =============================================================
-- confiia.com.br — migration 011
-- SEGUNDO FATOR (2FA) E CÓDIGOS DE RESERVA
--
-- O QUE MUDA:
--   qualquer conta PODE ligar o segundo fator
--   conta de admin PRECISA ter
--
-- POR QUE PARA TODOS, E NÃO SÓ PARA ADMIN:
-- A senha de um usuário comum abre o histórico dele — o que ele
-- verificou, o que denunciou, o que perdeu num golpe. Para quem
-- já foi vítima, essa lista é justamente o que não pode vazar.
-- Oferecer 2FA só ao dono do site seria dizer que a conta dele
-- vale mais que a das pessoas.
--
-- POR QUE TOTP E NÃO SMS:
-- TOTP (Google Authenticator) gera o código no próprio aparelho,
-- sem passar por operadora. Não existe SIM swap contra ele — e o
-- SIM swap é um dos golpes que este produto combate.
--
-- CUIDADO AO MEXER:
--   - `totp_segredo` é o que permite gerar os códigos. Vale tanto
--     quanto a senha. Nunca apareça em log, em tela de admin, nem
--     em auditoria.
--   - Os códigos de reserva são guardados como HASH, igual à
--     senha. Se o banco vazar, ninguém entra com eles.
-- =============================================================


-- -------------------------------------------------------------
-- 1. O SEGREDO SAI DE `admins` E VAI PARA `contas`
--
-- Na migração 007 ele nasceu em `admins`, quando a ideia era
-- proteger só o painel. Agora vale para todo mundo.
-- Nenhum admin existe ainda, então não há dado a migrar.
-- -------------------------------------------------------------

ALTER TABLE admins
  DROP COLUMN IF EXISTS totp_segredo,
  DROP COLUMN IF EXISTS totp_ativado_em;

ALTER TABLE contas
  ADD COLUMN totp_segredo    text,
  ADD COLUMN totp_ativado_em timestamptz;

COMMENT ON COLUMN contas.totp_segredo IS
  'Segredo do app autenticador. Vale tanto quanto a senha: nunca em log, nunca em tela, nunca em auditoria.';
COMMENT ON COLUMN contas.totp_ativado_em IS
  'Nulo = segundo fator desligado. Preenchido só depois de a pessoa acertar um código, provando que o app funciona.';


-- -------------------------------------------------------------
-- 2. CÓDIGOS DE RESERVA
--
-- Sem eles, perder o celular é perder a conta para sempre — e a
-- pessoa que mais precisa de 2FA é justamente a que tem mais medo
-- de se trancar para fora.
--
-- São a alternativa ao e-mail na recuperação, e mais forte que
-- ele: não dependem de uma caixa de entrada que também pode ter
-- sido invadida.
-- -------------------------------------------------------------

CREATE TABLE codigos_reserva (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id    uuid NOT NULL REFERENCES contas(id) ON DELETE CASCADE,
  codigo_hash text NOT NULL,          -- SHA-256. O código em claro só existe uma vez, na tela
  usado_em    timestamptz,
  criado_em   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reserva_conta ON codigos_reserva (conta_id) WHERE usado_em IS NULL;
CREATE UNIQUE INDEX idx_reserva_hash ON codigos_reserva (codigo_hash);

COMMENT ON TABLE codigos_reserva IS
  'Dez códigos de uso único. Guardados como hash. Gerar de novo apaga os anteriores.';


-- -------------------------------------------------------------
-- 3. SESSÃO PELA METADE
--
-- Quando a conta tem 2FA, acertar a senha não entra: cria uma
-- sessão marcada como `aguardando_2fa`, que não dá acesso a nada.
-- Só depois do código ela vira sessão de verdade.
--
-- POR QUE UMA SESSÃO E NÃO UM COOKIE TEMPORÁRIO:
-- Porque assim a tentativa fica registrada e é revogável. Se
-- alguém acertar a sua senha e travar no segundo fator, isso
-- aparece na sua lista de aparelhos — e é o aviso de que a sua
-- senha vazou.
-- -------------------------------------------------------------

ALTER TABLE sessoes
  ADD COLUMN aguardando_2fa boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN sessoes.aguardando_2fa IS
  'true = senha certa, código ainda não. Não dá acesso a nada. Vira false quando o código é aceito.';

-- Sessão pela metade não pode durar: é uma janela de ataque.
CREATE OR REPLACE FUNCTION expira_sessao_admin() RETURNS trigger AS $$
BEGIN
  -- 10 minutos para digitar o código do celular é de sobra
  IF NEW.aguardando_2fa THEN
    NEW.expira_em := LEAST(NEW.expira_em, now() + interval '10 minutes');
    RETURN NEW;
  END IF;

  -- Sessão de admin vence em 12 horas, sempre
  IF EXISTS (SELECT 1 FROM admins WHERE conta_id = NEW.conta_id) THEN
    NEW.expira_em := LEAST(NEW.expira_em, now() + interval '12 hours');
  END IF;

  RETURN NEW;
END $$ LANGUAGE plpgsql;


-- -------------------------------------------------------------
-- 4. ADMIN SEM 2FA NÃO ENTRA — E A REGRA VALE NO BANCO
--
-- A conferência também existe na aplicação. Aqui é o que garante
-- que ela vale mesmo para código novo que esqueça de conferir.
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION admin_pode_entrar(p_conta uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
      FROM admins a
      JOIN contas c ON c.id = a.conta_id
     WHERE a.conta_id = p_conta
       AND c.totp_ativado_em IS NOT NULL
       AND c.status = 'ativa'
       AND c.excluida_em IS NULL
       AND c.email_verificado_em IS NOT NULL
  );
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION admin_pode_entrar IS
  'Admin só opera com segundo fator ligado. Saber a senha não basta.';

-- Recusa promover alguém a admin antes de o 2FA estar ligado.
CREATE OR REPLACE FUNCTION trava_admin_sem_2fa() RETURNS trigger AS $$
DECLARE v_tem boolean;
BEGIN
  SELECT totp_ativado_em IS NOT NULL INTO v_tem FROM contas WHERE id = NEW.conta_id;
  IF NOT COALESCE(v_tem, false) THEN
    RAISE EXCEPTION
      'Esta conta não pode virar admin: o segundo fator não está ligado. '
      'Ligue o 2FA na conta antes de dar acesso ao painel.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER tg_admin_precisa_2fa BEFORE INSERT OR UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION trava_admin_sem_2fa();


-- -------------------------------------------------------------
-- 5. AGORA A RECUPERAÇÃO POR CÓDIGO DE RESERVA EXISTE DE VERDADE
--
-- Na migração 009 o ENUM já previa 'reserva'. Só agora ele tem
-- do que falar.
-- -------------------------------------------------------------

COMMENT ON COLUMN contas.recuperacao IS
  'email = link na caixa de entrada. reserva = um dos dez códigos guardados. sms continua desligado (SIM swap).';
