-- =============================================================
-- confiia.com.br — migration 012
-- O CONTADOR DO ÚLTIMO CÓDIGO ACEITO
--
-- POR QUE ISTO EXISTE:
-- O código do autenticador dura 30 segundos. Dentro dessa janela
-- ele funciona quantas vezes for usado — e é aí que mora a falha
-- que quase todo mundo deixa passar:
--
--   alguém vê seu código (olhando por cima do ombro, num print,
--   num teclado gravado) e usa antes de você.
--
-- Guardando o contador do último código aceito, qualquer código
-- igual ou anterior é recusado. O 2FA passa a proteger também
-- contra quem estava olhando a sua tela.
--
-- CUIDADO AO MEXER:
--   - Este número não é segredo, mas apagá-lo reabre a janela de
--     reuso até o próximo login.
-- =============================================================

ALTER TABLE contas
  ADD COLUMN totp_ultimo_contador bigint;

COMMENT ON COLUMN contas.totp_ultimo_contador IS
  'Passo de 30s do último código aceito. Código igual ou anterior é recusado — impede reuso por quem viu a sua tela.';
