-- =============================================================
-- confiia.com.br — migration 007
-- O QUE SUSTENTA O PAINEL ADMINISTRATIVO
--
-- O admin.html mostra travas na tela: "não pode deferir sem
-- identidade confirmada", "não pode dar selo sem posse do domínio".
-- Trava desenhada em tela não trava nada — quem souber chamar a API
-- passa por cima dela em dois minutos. Este arquivo coloca as
-- mesmas regras no banco, onde ninguém contorna.
--
-- Também acrescenta:
--   - as linhas de politica_moderacao que faltavam (denúncia e
--     cadastro de empresa), porque o painel promete mostrar a regra
--     escrita antes de cada decisão — e a regra precisa existir;
--   - uma coluna `chave` na política, para o código apontar para a
--     regra por identificador e não pelo texto (texto muda);
--   - registra(), a função única de auditoria;
--   - revela_dado(), que devolve dado pessoal SÓ gravando quem viu;
--   - as visões que o painel consome.
--
-- CUIDADO AO MEXER:
--   - Mexer nos gatilhos tg_trava_deferimento / tg_trava_selo muda
--     a regra de negócio inteira. Se um dia precisar de exceção,
--     crie um caminho explícito e auditado, não afrouxe o gatilho.
--   - Os prazos aqui espelham o que está escrito nos Termos
--     (termos.html §10). Mudou lá, muda aqui e em admin.js.
-- =============================================================


-- -------------------------------------------------------------
-- 1. POLÍTICA: chave estável + as regras que faltavam
-- -------------------------------------------------------------

ALTER TABLE politica_moderacao
  ADD COLUMN chave text UNIQUE;

-- Liga as 7 situações já cadastradas em 005 às chaves usadas no painel
UPDATE politica_moderacao SET chave = 'dono_sem_denuncia'
  WHERE situacao = 'dono comprova o site e não há denúncia';
UPDATE politica_moderacao SET chave = 'dono_com_denuncia'
  WHERE situacao = 'dono comprova o site mas há denúncia de usuário';
UPDATE politica_moderacao SET chave = 'erro_tecnico'
  WHERE situacao = 'empresa alega erro na análise técnica';
UPDATE politica_moderacao SET chave = 'lgpd_titular'
  WHERE situacao = 'titular pede exclusão de dado pessoal (LGPD)';
UPDATE politica_moderacao SET chave = 'sem_identidade'
  WHERE situacao = 'pedido sem comprovação de identidade';
UPDATE politica_moderacao SET chave = 'judicial'
  WHERE situacao = 'ordem judicial';
UPDATE politica_moderacao SET chave = 'suspeita_golpista'
  WHERE situacao = 'suspeita de golpista pedindo limpeza de ficha';

ALTER TABLE politica_moderacao
  ALTER COLUMN chave SET NOT NULL;

COMMENT ON COLUMN politica_moderacao.chave IS
  'Identificador estável usado pelo painel. O texto de `situacao` pode ser reescrito; a chave, não.';

-- Faltavam as regras de denúncia e de cadastro de empresa: sem elas,
-- a decisão mais frequente do dia a dia era a única sem critério escrito.
INSERT INTO politica_moderacao (chave, situacao, exige, decisao, prazo_dias) VALUES

('denuncia_comum',
 'denúncia de consumidor sobre alvo já conhecido',
 'Relato com data, valor e ao menos uma prova (print, comprovante ou boletim de ocorrência)',
 'Confirmar quando o relato bate com os indícios técnicos do alvo. Sem prova nenhuma, manter como "nova" e pedir complemento — não recusar de cara, e não confirmar de cara. Não julgamos o mérito comercial da empresa: divergência sobre o que aconteceu se resolve publicando as duas versões.',
 7),

('denuncia_golpe_novo',
 'denúncia marcada como golpe novo',
 'Descrição do que foi diferente de tudo que a pessoa já conhecia',
 'Analisar em até 2 dias. Confirmado, abrir a linha em golpes_conhecidos com o roteiro e vincular as denúncias parecidas. Golpe conhecido já tem gente protegida; golpe novo não tem ninguém.',
 2),

('empresa_cadastro',
 'empresa pedindo cadastro',
 'CNPJ ativo na Receita + posse comprovada de pelo menos uma propriedade',
 'Sem posse comprovada, só o nível "registrada". O selo "verificada" exige DNS TXT, arquivo no domínio ou e-mail do próprio domínio. CNPJ ativo prova que a empresa existe, não que ela é dona daquele site.',
 7),

('empresa_reincidente',
 'empresa aprovada que passou a receber denúncias',
 'Nada — o contador de denúncias confirmadas dispara sozinho',
 'Ao chegar em 3 denúncias confirmadas em 90 dias, o selo cai automaticamente e a empresa vai para análise. Reativar exige resposta ponto a ponto às denúncias, não só pedido.',
 7);


-- -------------------------------------------------------------
-- 2. AUDITORIA EM UMA CHAMADA SÓ
--
-- Se registrar auditoria for trabalhoso, um dia você não registra.
-- Por isso: uma função, sempre a mesma assinatura.
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION registra(
  p_ator      uuid,
  p_acao      text,
  p_alvo_tipo text,
  p_alvo_id   text,
  p_antes     jsonb DEFAULT NULL,
  p_depois    jsonb DEFAULT NULL,
  p_ip        inet  DEFAULT NULL
) RETURNS bigint AS $$
DECLARE v_id bigint;
BEGIN
  INSERT INTO auditoria (ator_id, acao, alvo_tipo, alvo_id, antes, depois, ip)
  VALUES (p_ator, p_acao, p_alvo_tipo, p_alvo_id, p_antes, p_depois, p_ip)
  RETURNING id INTO v_id;
  RETURN v_id;
END $$ LANGUAGE plpgsql;

COMMENT ON FUNCTION registra IS
  'Único caminho para gravar auditoria. Toda ação de admin passa por aqui.';


-- -------------------------------------------------------------
-- 3. AS TRAVAS DE VERDADE
--
-- 3.1 — Não se defere contestação sem identidade confirmada.
--
-- Esta é a trava que separa pedido legítimo de golpista limpando a
-- ficha. Se ela existir só no botão da tela, basta uma chamada
-- direta na API para o golpista sumir das buscas.
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION trava_deferimento() RETURNS trigger AS $$
BEGIN
  IF NEW.status IN ('deferida','parcial')
     AND COALESCE(NEW.identidade_confirmada, false) = false THEN
    RAISE EXCEPTION
      'Contestação % não pode ser deferida: identidade do solicitante não confirmada. '
      'Ver politica_moderacao, chave "sem_identidade".', NEW.protocolo
      USING ERRCODE = 'check_violation';
  END IF;

  -- Decisão sem texto é decisão que você não consegue defender depois.
  IF NEW.status IN ('deferida','parcial','indeferida')
     AND (NEW.decisao IS NULL OR length(btrim(NEW.decisao)) < 20) THEN
    RAISE EXCEPTION
      'Contestação %: escreva a decisão antes de fechar. É o texto que a pessoa recebe '
      'e a sua defesa se isso virar processo.', NEW.protocolo
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.status IN ('deferida','parcial','indeferida') AND NEW.decidida_em IS NULL THEN
    NEW.decidida_em := now();
  END IF;

  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER tg_trava_deferimento BEFORE UPDATE ON contestacoes
  FOR EACH ROW EXECUTE FUNCTION trava_deferimento();


-- -------------------------------------------------------------
-- 3.2 — Selo acima de "registrada" exige posse comprovada.
--
-- "Registrada" quer dizer: existe um CNPJ ativo com esse nome.
-- "Verificada" quer dizer: nós conferimos que quem cadastrou é dono
-- daquele endereço. São coisas diferentes e o usuário lê o selo como
-- se fosse a segunda. Dar a segunda sem prova é assinar embaixo.
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION tem_posse_confirmada(p_empresa uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM empresa_dominios
     WHERE empresa_id = p_empresa
       AND posse_confirmada_em IS NOT NULL
  );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION trava_selo() RETURNS trigger AS $$
BEGIN
  IF NEW.nivel IS NOT NULL
     AND NEW.nivel <> 'registrada'
     AND NOT tem_posse_confirmada(NEW.id) THEN
    RAISE EXCEPTION
      'Empresa "%" não pode receber o nível %: nenhuma propriedade com posse comprovada. '
      'Exija DNS TXT, arquivo no domínio ou e-mail do próprio domínio.',
      NEW.nome_fantasia, NEW.nivel
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER tg_trava_selo BEFORE INSERT OR UPDATE OF nivel ON empresas
  FOR EACH ROW EXECUTE FUNCTION trava_selo();

-- Perder a posse derruba o selo junto. Domínio que expirou e foi
-- comprado por outra pessoa não pode continuar carregando o selo.
CREATE OR REPLACE FUNCTION derruba_selo_sem_posse() RETURNS trigger AS $$
BEGIN
  IF OLD.posse_confirmada_em IS NOT NULL AND NEW.posse_confirmada_em IS NULL THEN
    UPDATE empresas e SET nivel = 'registrada', motivo_status = 'Posse do domínio deixou de ser confirmada'
     WHERE e.id = NEW.empresa_id
       AND e.nivel IS NOT NULL AND e.nivel <> 'registrada'
       AND NOT tem_posse_confirmada(e.id);
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER tg_derruba_selo AFTER UPDATE OF posse_confirmada_em ON empresa_dominios
  FOR EACH ROW EXECUTE FUNCTION derruba_selo_sem_posse();


-- -------------------------------------------------------------
-- 4. DADO PESSOAL NO PAINEL
--
-- Minimização (LGPD Art. 6º, III) vale para você também. O painel
-- mostra e-mail e telefone cobertos; revelar passa por aqui, e aqui
-- grava quem revelou, de quem e por quê. Sem "por quê" não revela.
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION mascara_email(p_email text)
RETURNS text AS $$
  SELECT CASE
    WHEN p_email IS NULL THEN NULL
    WHEN position('@' in p_email) < 3 THEN '•••' || substring(p_email from position('@' in p_email))
    ELSE left(p_email, 1) || '•••••' ||
         substring(p_email from position('@' in p_email) - 1)
  END;
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION revela_dado(
  p_admin  uuid,
  p_conta  uuid,
  p_campo  text,          -- 'email' | 'telefone'
  p_motivo text           -- ticket, protocolo ou pedido do titular
) RETURNS text AS $$
DECLARE v_valor text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admins WHERE conta_id = p_admin) THEN
    RAISE EXCEPTION 'Só admin revela dado pessoal.' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_motivo IS NULL OR length(btrim(p_motivo)) < 4 THEN
    RAISE EXCEPTION 'Informe o motivo (ticket, protocolo ou pedido do titular).'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT CASE p_campo WHEN 'email' THEN email::text
                      WHEN 'telefone' THEN telefone
                      ELSE NULL END
    INTO v_valor
    FROM contas WHERE id = p_conta;

  IF v_valor IS NULL THEN
    RAISE EXCEPTION 'Campo % não existe ou está vazio.', p_campo;
  END IF;

  PERFORM registra(p_admin, 'dado.revelar', 'conta', p_conta::text,
                   NULL, jsonb_build_object('campo', p_campo, 'motivo', p_motivo));
  RETURN v_valor;
END $$ LANGUAGE plpgsql;

COMMENT ON FUNCTION revela_dado IS
  'Único caminho para o painel ver e-mail/telefone em claro. Sempre grava quem viu e por quê.';


-- -------------------------------------------------------------
-- 5. VISÕES QUE O PAINEL CONSOME
-- -------------------------------------------------------------

-- 5.1 Resumo da fila (o bloco de cima do painel)
CREATE OR REPLACE VIEW v_painel_fila AS
SELECT
  count(*) FILTER (WHERE urgencia = 'prioridade') AS prioridade,
  count(*) FILTER (WHERE urgencia = 'atrasado')   AS atrasados,
  count(*) FILTER (WHERE urgencia = 'urgente')    AS urgentes,
  count(*) FILTER (WHERE urgencia = 'no prazo')   AS no_prazo,
  count(*)                                        AS total,
  min(criada_em)                                  AS mais_antiga_em
FROM v_fila_admin;

COMMENT ON VIEW v_painel_fila IS
  'Se `atrasados` > 0, o prazo prometido nos Termos foi furado. É o número mais importante do painel.';

-- 5.2 Gasto por serviço no mês corrente
CREATE OR REPLACE VIEW v_custo_servico_mes AS
SELECT servico,
       count(*)                                   AS chamadas,
       count(*) FILTER (WHERE erro IS NOT NULL)   AS falhas,
       COALESCE(sum(custo_micro), 0)              AS custo_micro,
       round(COALESCE(avg(custo_micro), 0))       AS medio_micro,
       round(COALESCE(avg(duracao_ms), 0))        AS medio_ms
  FROM logs_externos
 WHERE criado_em >= date_trunc('month', now())
 GROUP BY servico
 ORDER BY custo_micro DESC;

-- 5.3 Custo por verificação, por dia — a conta que diz se o negócio fecha
CREATE OR REPLACE VIEW v_margem_dia AS
SELECT date_trunc('day', v.criada_em)::date       AS dia,
       count(*)                                    AS verificacoes,
       count(*) FILTER (WHERE v.tipo = 'imagem')   AS com_imagem,
       COALESCE(sum(v.custo_micro), 0)             AS custo_micro,
       CASE WHEN count(*) = 0 THEN 0
            ELSE round(COALESCE(sum(v.custo_micro), 0)::numeric / count(*))
       END                                         AS micro_por_verificacao
  FROM verificacoes v
 WHERE v.criada_em >= now() - interval '30 days'
 GROUP BY 1
 ORDER BY 1 DESC;

-- 5.4 Empresas com o estado de posse já resolvido (evita N+1 no painel)
CREATE OR REPLACE VIEW v_empresa_painel AS
SELECT e.id, e.nome_fantasia, e.razao_social, e.cnpj, e.status, e.nivel,
       e.receita_situacao, e.receita_abertura, e.criada_em, e.aprovada_em,
       tem_posse_confirmada(e.id) AS posse_confirmada,
       (SELECT count(*) FROM empresa_dominios d WHERE d.empresa_id = e.id) AS propriedades,
       (SELECT count(*) FROM denuncias dn
         JOIN empresa_dominios d2 ON d2.empresa_id = e.id AND dn.alvo = d2.valor
        WHERE dn.status = 'confirmada'
          AND dn.criada_em > now() - interval '90 days')                   AS denuncias_90d
  FROM empresas e;

COMMENT ON VIEW v_empresa_painel IS
  'posse_confirmada = false trava o selo acima de "registrada" (ver tg_trava_selo).';


-- -------------------------------------------------------------
-- 6. SESSÃO DE ADMIN COM PRAZO CURTO
--
-- A conta que enxerga a base inteira não pode ficar logada para
-- sempre num notebook. Sessão de admin vence em 12 horas e exige
-- segundo fator.
-- -------------------------------------------------------------

ALTER TABLE admins
  ADD COLUMN totp_segredo    text,          -- segundo fator, obrigatório em produção
  ADD COLUMN totp_ativado_em timestamptz,
  ADD COLUMN ultimo_ip       inet,
  ADD COLUMN ultimo_acesso_em timestamptz;

COMMENT ON COLUMN admins.totp_segredo IS
  'Sem 2FA ativo o login de admin deve ser recusado. Uma senha vazada abre a base inteira.';

CREATE OR REPLACE FUNCTION expira_sessao_admin() RETURNS trigger AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM admins WHERE conta_id = NEW.conta_id) THEN
    NEW.expira_em := LEAST(NEW.expira_em, now() + interval '12 hours');
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER tg_sessao_admin BEFORE INSERT ON sessoes
  FOR EACH ROW EXECUTE FUNCTION expira_sessao_admin();
