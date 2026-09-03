-- =============================================================
-- confiia.com.br — o selo só cai com denúncia CONFIRMADA
--
-- O QUE ESTA MIGRAÇÃO RESOLVE
--
-- Duas coisas, e a segunda é séria.
--
--   1. O número muda de 3 para 5. Pedido da dona do projeto em
--      27/08/2026: "achei pouco, coloque cinco denúncias em
--      noventa dias".
--
--   2. ⚠ O GATILHO CONTAVA DENÚNCIA QUE NINGUÉM TINHA OLHADO.
--
--      A condição era `d.status <> 'recusada'`. O ENUM é
--      ('nova','em_analise','confirmada','recusada') — então
--      `nova` e `em_analise` contavam.
--
--      Ou seja: TRÊS DENÚNCIAS SEM ANÁLISE NENHUMA derrubavam o
--      selo de uma loja. Bastava um concorrente, ou três pessoas
--      que entenderam errado, e a loja honesta era suspensa antes
--      de qualquer humano ler o que foi denunciado.
--
--      E a página /registrar-loja prometia, com todas as letras,
--      "3 denúncias CONFIRMADAS em 90 dias derrubam o selo". A
--      promessa era mais protetora que o banco. Num site que
--      existe para apontar promessa que não se cumpre, essa era a
--      pior espécie de defeito.
--
--      Agora conta só `status = 'confirmada'`.
--
-- ─────────────────────────────────────────────────────────────
-- POR QUE O GATILHO PRECISOU MUDAR DE EVENTO
--
-- Ele era `AFTER INSERT ON denuncias`. Isso funcionava enquanto a
-- conta incluía `nova`, porque toda denúncia nasce `nova`.
--
-- Passando a exigir `confirmada`, o INSERT deixa de ser o momento
-- útil: nenhuma denúncia nasce confirmada. Se ficasse só no
-- INSERT, o gatilho nunca mais suspenderia ninguém — o defeito
-- viraria o oposto, e igualmente silencioso.
--
-- Por isso agora é `AFTER INSERT OR UPDATE OF status`. Quem
-- confirma uma denúncia é que dispara a conta.
--
-- ─────────────────────────────────────────────────────────────
-- ⚠ SECURITY DEFINER PRECISA SER REESCRITO AQUI
--
-- A migração 016 tornou este gatilho SECURITY DEFINER, porque ele
-- escreve em `empresas` e `empresa_eventos`, que o usuário
-- `confia_app` não alcança depois do RLS.
--
-- `CREATE OR REPLACE FUNCTION` **não preserva** esse atributo: a
-- função volta a ser SECURITY INVOKER se a gente não repetir. E o
-- sintoma seria o mesmo de agosto — a denúncia parando de entrar
-- sem erro no código do app. Está escrito no CLAUDE.md, e é por
-- isso que o `SECURITY DEFINER` está explícito lá embaixo.
--
-- ⚠ E O `search_path` TAMBÉM SE PERDE. Isto quase passou:
-- `CREATE OR REPLACE` apagou o `SET search_path` que a migração
-- 016 tinha posto, e SECURITY DEFINER sem search_path fixo é
-- escalada de privilégio — quem conseguir criar um objeto num
-- esquema que venha antes no caminho sequestra as chamadas da
-- função, que roda com a autoridade do DONO do banco.
--
-- Quem pegou foi o `npm run confere-banco`, não eu. É exatamente
-- para isso que aquela prova existe: ela roda depois de QUALQUER
-- mexida em banco, e não é opcional.
--
-- Confira depois de aplicar:  cd web && npm run confere-banco
-- =============================================================

CREATE OR REPLACE FUNCTION suspende_empresa_por_denuncia() RETURNS trigger AS $$
DECLARE v_empresa uuid; v_qtd int;
BEGIN
  /* Só interessa denúncia que virou confirmada agora. Sem esta
     saída rápida, todo UPDATE em denuncias faria a consulta
     pesada abaixo à toa. */
  IF NEW.status <> 'confirmada' THEN RETURN NEW; END IF;

  SELECT ed.empresa_id INTO v_empresa
  FROM empresa_dominios ed
  WHERE ed.valor = NEW.alvo AND ed.posse_confirmada_em IS NOT NULL
  LIMIT 1;

  IF v_empresa IS NULL THEN RETURN NEW; END IF;

  /* CONFIRMADA, e só. Ver o bloco 2 do cabeçalho: contar denúncia
     sem análise entrega o selo de qualquer loja a quem tiver
     paciência de escrever cinco formulários. */
  SELECT count(*) INTO v_qtd FROM denuncias d
   JOIN empresa_dominios ed2 ON ed2.valor = d.alvo
   WHERE ed2.empresa_id = v_empresa
     AND d.status = 'confirmada'
     AND d.criada_em > now() - interval '90 days';

  /* 5, e não 3. Se você mudar este número, mude também o texto de
     `web/src/app/registrar-loja/page.tsx` — a página promete o
     número para quem cadastra, e os dois não podem divergir. */
  IF v_qtd >= 5 THEN
    UPDATE empresas SET status = 'suspensa', suspensa_em = now(),
           motivo_status = v_qtd || ' denúncias confirmadas em 90 dias'
     WHERE id = v_empresa AND status = 'aprovada';

    INSERT INTO empresa_eventos (empresa_id, evento, para_status, motivo)
    VALUES (v_empresa, 'suspensa_automatica', 'suspensa',
            v_qtd || ' denúncias confirmadas em 90 dias');
  END IF;

  RETURN NEW;
END $$ LANGUAGE plpgsql SECURITY DEFINER;

/* O `SET search_path` da migração 016 é apagado pelo
   `CREATE OR REPLACE` acima, e sem ele o SECURITY DEFINER vira
   porta de escalada. Reposto aqui, na mesma forma da 016.
   NÃO APAGUE ESTA LINHA. */
ALTER FUNCTION suspende_empresa_por_denuncia() SET search_path = public, pg_temp;

/* Ver o bloco "POR QUE O GATILHO PRECISOU MUDAR DE EVENTO". */
DROP TRIGGER IF EXISTS tg_denuncia_empresa ON denuncias;
CREATE TRIGGER tg_denuncia_empresa
  AFTER INSERT OR UPDATE OF status ON denuncias
  FOR EACH ROW EXECUTE FUNCTION suspende_empresa_por_denuncia();

COMMENT ON FUNCTION suspende_empresa_por_denuncia() IS
  'Suspende a empresa com 5+ denúncias CONFIRMADAS em 90 dias. '
  'SECURITY DEFINER: escreve em empresas e empresa_eventos, fora '
  'do alcance de confia_app. Ver migração 018.';
