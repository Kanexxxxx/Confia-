/* =============================================================
   confiia.com.br — as tabelas do banco, em TypeScript

   ┌─────────────────────────────────────────────────────────┐
   │  ARQUIVO GERADO. NÃO EDITE À MÃO.                       │
   │  Ele é reescrito inteiro a cada `npm run db:puxar`.      │
   └─────────────────────────────────────────────────────────┘

   QUEM MANDA AQUI É O BANCO.
   A estrutura de verdade está nos arquivos .sql comentados em
   `servidor/db/`. Este arquivo é só o retrato deles em TypeScript,
   para o editor saber o que existe e avisar antes de quebrar.

   PARA MUDAR UMA TABELA:
     1. escreva uma migração nova em servidor/db/
     2. rode-a no banco
     3. `npm run db:puxar`  (regera este arquivo)

   Nunca o contrário. Migração aplicada não se edita.
   ============================================================= */

import { citext } from './tipos';
import { pgTable, index, foreignKey, unique, uuid, text, smallint, timestamp, check, inet, smallserial, integer, jsonb, boolean, date, bigserial, char, bigint, uniqueIndex, primaryKey, pgView, numeric, pgSequence, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const categoriaLigacao = pgEnum("categoria_ligacao", ['golpe', 'telemarketing', 'cobranca', 'trote', 'robo', 'desconhecido', 'legitimo'])
export const cicloCobranca = pgEnum("ciclo_cobranca", ['mensal', 'anual'])
export const classeImagem = pgEnum("classe_imagem", ['print_conversa', 'comprovante', 'anuncio_produto', 'perfil', 'documento', 'site', 'outra'])
export const estadoItem = pgEnum("estado_item", ['ok', 'alerta', 'risco', 'indisponivel'])
export const metodoPosse = pgEnum("metodo_posse", ['dns_txt', 'arquivo_html', 'email_do_dominio', 'manual'])
export const metodoRecuperacao = pgEnum("metodo_recuperacao", ['email', 'reserva', 'sms'])
export const nivelEmpresa = pgEnum("nivel_empresa", ['registrada', 'verificada', 'estabelecida', 'curadoria'])
export const origemRelato = pgEnum("origem_relato", ['usuario', 'parceiro', 'anatel', 'procon', 'importacao'])
export const origemReq = pgEnum("origem_req", ['site', 'extensao', 'app', 'api', 'whatsapp'])
export const papelMembro = pgEnum("papel_membro", ['dono', 'membro'])
export const statusAssinatura = pgEnum("status_assinatura", ['ativa', 'pendente', 'atrasada', 'cancelada', 'expirada', 'teste'])
export const statusConta = pgEnum("status_conta", ['ativa', 'suspensa', 'excluida'])
export const statusContestacao = pgEnum("status_contestacao", ['recebida', 'aguardando_prova', 'em_analise', 'deferida', 'parcial', 'indeferida', 'arquivada'])
export const statusDenuncia = pgEnum("status_denuncia", ['nova', 'em_analise', 'confirmada', 'recusada'])
export const statusEmpresa = pgEnum("status_empresa", ['rascunho', 'em_analise', 'aprovada', 'recusada', 'suspensa', 'revogada'])
export const statusPagamento = pgEnum("status_pagamento", ['pendente', 'confirmado', 'recebido', 'vencido', 'estornado', 'falhou'])
export const statusTicket = pgEnum("status_ticket", ['aberto', 'respondido', 'aguardando', 'resolvido', 'fechado'])
export const tipoAlvo = pgEnum("tipo_alvo", ['link', 'dominio', 'perfil', 'imagem', 'texto', 'telefone'])
export const tipoContestacao = pgEnum("tipo_contestacao", ['remocao', 'correcao', 'direito_resposta', 'lgpd'])
export const tipoDocumento = pgEnum("tipo_documento", ['contrato_social', 'cartao_cnpj', 'documento_socio', 'selfie_socio', 'comprovante_endereco', 'alvara', 'print_faturamento', 'outro'])
export const tipoPedidoLgpd = pgEnum("tipo_pedido_lgpd", ['exportar', 'excluir', 'corrigir', 'revogar_consentimento'])
export const tipoPessoa = pgEnum("tipo_pessoa", ['fisica', 'juridica'])
export const tipoPropriedade = pgEnum("tipo_propriedade", ['site', 'instagram', 'facebook', 'whatsapp', 'tiktok', 'loja_marketplace'])
export const tipoProva = pgEnum("tipo_prova", ['print_conversa', 'comprovante', 'anuncio', 'pagina', 'boletim_ocorrencia', 'outro'])
export const tipoToken = pgEnum("tipo_token", ['verificar_email', 'trocar_senha', 'convite_familia', 'trocar_email'])
export const veredito = pgEnum("veredito", ['confiavel', 'suspeito', 'perigoso', 'inconclusivo'])

export const seqProtocolo = pgSequence("seq_protocolo", {  startWith: "1", increment: "1", minValue: "1", maxValue: "9223372036854775807", cache: "1", cycle: false })

export const tokens = pgTable("tokens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	contaId: uuid("conta_id").notNull(),
	tipo: tipoToken().notNull(),
	tokenHash: text("token_hash").notNull(),
	// TODO: failed to parse database type 'citext'
	destino: citext("destino"),
	tentativas: smallint().default(0).notNull(),
	expiraEm: timestamp("expira_em", { withTimezone: true, mode: 'date' }).notNull(),
	usadoEm: timestamp("usado_em", { withTimezone: true, mode: 'date' }),
	criadoEm: timestamp("criado_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("idx_tokens_conta_tipo").using("btree", table.contaId.asc().nullsLast().op("uuid_ops"), table.tipo.asc().nullsLast().op("uuid_ops")).where(sql`(usado_em IS NULL)`),
	foreignKey({
			columns: [table.contaId],
			foreignColumns: [contas.id],
			name: "tokens_conta_id_fkey"
		}).onDelete("cascade"),
	unique("tokens_token_hash_key").on(table.tokenHash),
]);

export const contas = pgTable("contas", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	// TODO: failed to parse database type 'citext'
	email: citext("email").notNull(),
	senhaHash: text("senha_hash"),
	nome: text().notNull(),
	telefone: text(),
	status: statusConta().default('ativa').notNull(),
	emailVerificadoEm: timestamp("email_verificado_em", { withTimezone: true, mode: 'date' }),
	aceitouTermosEm: timestamp("aceitou_termos_em", { withTimezone: true, mode: 'date' }),
	aceitouTermosVersao: text("aceitou_termos_versao"),
	ultimoAcessoEm: timestamp("ultimo_acesso_em", { withTimezone: true, mode: 'date' }),
	criadaEm: timestamp("criada_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	atualizadaEm: timestamp("atualizada_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	excluidaEm: timestamp("excluida_em", { withTimezone: true, mode: 'date' }),
	tipoPessoa: tipoPessoa("tipo_pessoa").default('fisica').notNull(),
	telefoneVerificadoEm: timestamp("telefone_verificado_em", { withTimezone: true, mode: 'date' }),
	apelido: text(),
	avatar: text().default('inicial').notNull(),
	recuperacao: metodoRecuperacao().default('email').notNull(),
}, (table) => [
	index("idx_contas_status").using("btree", table.status.asc().nullsLast().op("enum_ops")).where(sql`(excluida_em IS NULL)`),
	index("idx_contas_telefone").using("btree", table.telefone.asc().nullsLast().op("text_ops")).where(sql`((telefone IS NOT NULL) AND (excluida_em IS NULL))`),
	unique("contas_email_key").on(table.email),
	check("avatar_conhecido", sql`avatar ~ '^[a-z][a-z0-9-]{0,23}$'::text`),
	check("telefone_obrigatorio_para_empresa", sql`(tipo_pessoa = 'fisica'::tipo_pessoa) OR ((telefone IS NOT NULL) AND (length(regexp_replace(telefone, '\D'::text, ''::text, 'g'::text)) >= 10))`),
]);

export const sessoes = pgTable("sessoes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	contaId: uuid("conta_id").notNull(),
	tokenHash: text("token_hash").notNull(),
	ip: inet(),
	navegador: text(),
	expiraEm: timestamp("expira_em", { withTimezone: true, mode: 'date' }).notNull(),
	revogadaEm: timestamp("revogada_em", { withTimezone: true, mode: 'date' }),
	criadaEm: timestamp("criada_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("idx_sessoes_conta").using("btree", table.contaId.asc().nullsLast().op("uuid_ops")).where(sql`(revogada_em IS NULL)`),
	foreignKey({
			columns: [table.contaId],
			foreignColumns: [contas.id],
			name: "sessoes_conta_id_fkey"
		}).onDelete("cascade"),
	unique("sessoes_token_hash_key").on(table.tokenHash),
]);

export const planos = pgTable("planos", {
	id: smallserial().primaryKey().notNull(),
	slug: text().notNull(),
	nome: text().notNull(),
	precoMesCent: integer("preco_mes_cent").default(0).notNull(),
	precoAnoCent: integer("preco_ano_cent").default(0).notNull(),
	limites: jsonb().notNull(),
	recursos: jsonb().default({}).notNull(),
	visivel: boolean().default(true).notNull(),
	ordem: smallint().default(0).notNull(),
}, (table) => [
	unique("planos_slug_key").on(table.slug),
]);

export const pagamentos = pgTable("pagamentos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	assinaturaId: uuid("assinatura_id").notNull(),
	asaasId: text("asaas_id").notNull(),
	valorCent: integer("valor_cent").notNull(),
	metodo: text(),
	status: statusPagamento().default('pendente').notNull(),
	vencimento: date(),
	pagoEm: timestamp("pago_em", { withTimezone: true, mode: 'date' }),
	estornadoEm: timestamp("estornado_em", { withTimezone: true, mode: 'date' }),
	linkFatura: text("link_fatura"),
	criadoEm: timestamp("criado_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("idx_pagamentos_assinatura").using("btree", table.assinaturaId.asc().nullsLast().op("timestamptz_ops"), table.criadoEm.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.assinaturaId],
			foreignColumns: [assinaturas.id],
			name: "pagamentos_assinatura_id_fkey"
		}).onDelete("cascade"),
	unique("pagamentos_asaas_id_key").on(table.asaasId),
]);

export const asaasEventos = pgTable("asaas_eventos", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	eventoId: text("evento_id").notNull(),
	tipo: text().notNull(),
	corpo: jsonb().notNull(),
	processadoEm: timestamp("processado_em", { withTimezone: true, mode: 'date' }),
	erro: text(),
	recebidoEm: timestamp("recebido_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	unique("asaas_eventos_evento_id_key").on(table.eventoId),
]);

export const membros = pgTable("membros", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	titularId: uuid("titular_id").notNull(),
	membroId: uuid("membro_id").notNull(),
	papel: papelMembro().default('membro').notNull(),
	apelido: text(),
	modoSimples: boolean("modo_simples").default(false).notNull(),
	entrouEm: timestamp("entrou_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("idx_membros_membro").using("btree", table.membroId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.membroId],
			foreignColumns: [contas.id],
			name: "membros_membro_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.titularId],
			foreignColumns: [contas.id],
			name: "membros_titular_id_fkey"
		}).onDelete("cascade"),
	unique("membros_titular_id_membro_id_key").on(table.titularId, table.membroId),
]);

export const verificacoes = pgTable("verificacoes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	contaId: uuid("conta_id"),
	anonimoHash: text("anonimo_hash"),
	tipo: tipoAlvo().notNull(),
	alvo: text().notNull(),
	alvoNormalizado: text("alvo_normalizado"),
	veredito: veredito(),
	score: smallint(),
	confianca: smallint(),
	resumo: text(),
	origem: origemReq().default('site').notNull(),
	modelo: text(),
	custoMicro: integer("custo_micro"),
	duracaoMs: integer("duracao_ms"),
	revisadoPor: uuid("revisado_por"),
	revisadoEm: timestamp("revisado_em", { withTimezone: true, mode: 'date' }),
	criadaEm: timestamp("criada_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	codigo: text(),
}, (table) => [
	index("idx_verif_alvo").using("btree", table.alvoNormalizado.asc().nullsLast().op("timestamptz_ops"), table.criadaEm.desc().nullsFirst().op("text_ops")),
	index("idx_verif_anonimo").using("btree", table.anonimoHash.asc().nullsLast().op("timestamptz_ops"), table.criadaEm.desc().nullsFirst().op("timestamptz_ops")).where(sql`(conta_id IS NULL)`),
	index("idx_verif_busca").using("gin", sql`to_tsvector('portuguese'::regconfig, ((COALESCE(alvo, ''::text)`),
	index("idx_verif_conta").using("btree", table.contaId.asc().nullsLast().op("uuid_ops"), table.criadaEm.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_verificacoes_codigo").using("btree", table.codigo.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.contaId],
			foreignColumns: [contas.id],
			name: "verificacoes_conta_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.revisadoPor],
			foreignColumns: [contas.id],
			name: "verificacoes_revisado_por_fkey"
		}),
	unique("verificacoes_codigo_key").on(table.codigo),
	check("verificacoes_confianca_check", sql`(confianca >= 0) AND (confianca <= 100)`),
	check("verificacoes_score_check", sql`(score >= 0) AND (score <= 100)`),
]);

export const verificacaoItens = pgTable("verificacao_itens", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	verificacaoId: uuid("verificacao_id").notNull(),
	chave: text().notNull(),
	titulo: text().notNull(),
	estado: estadoItem().notNull(),
	detalhe: text(),
	etiquetas: jsonb().default([]).notNull(),
	peso: smallint().default(0).notNull(),
	ordem: smallint().default(0).notNull(),
}, (table) => [
	index("idx_itens_verif").using("btree", table.verificacaoId.asc().nullsLast().op("int2_ops"), table.ordem.asc().nullsLast().op("int2_ops")),
	foreignKey({
			columns: [table.verificacaoId],
			foreignColumns: [verificacoes.id],
			name: "verificacao_itens_verificacao_id_fkey"
		}).onDelete("cascade"),
]);

export const cacheDominio = pgTable("cache_dominio", {
	dominio: text().primaryKey().notNull(),
	score: smallint(),
	veredito: veredito(),
	itens: jsonb(),
	fonte: text(),
	expiraEm: timestamp("expira_em", { withTimezone: true, mode: 'date' }).notNull(),
	atualizadoEm: timestamp("atualizado_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("idx_cache_expira").using("btree", table.expiraEm.asc().nullsLast().op("timestamptz_ops")),
]);

export const denuncias = pgTable("denuncias", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	contaId: uuid("conta_id"),
	alvo: text().notNull(),
	categoria: text().notNull(),
	relato: text(),
	prejuizoCent: integer("prejuizo_cent"),
	status: statusDenuncia().default('nova').notNull(),
	analisadaPor: uuid("analisada_por"),
	analisadaEm: timestamp("analisada_em", { withTimezone: true, mode: 'date' }),
	criadaEm: timestamp("criada_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	golpeNovo: boolean("golpe_novo").default(false).notNull(),
	descricaoNovo: text("descricao_novo"),
	golpeId: uuid("golpe_id"),
	boAnexado: boolean("bo_anexado").default(false).notNull(),
	codigo: text(),
}, (table) => [
	index("idx_denuncias_alvo").using("btree", table.alvo.asc().nullsLast().op("text_ops")),
	index("idx_denuncias_codigo").using("btree", table.codigo.asc().nullsLast().op("text_ops")),
	index("idx_denuncias_novo").using("btree", table.criadaEm.desc().nullsFirst().op("timestamptz_ops")).where(sql`(golpe_novo AND (status = ANY (ARRAY['nova'::status_denuncia, 'em_analise'::status_denuncia])))`),
	index("idx_denuncias_status").using("btree", table.status.asc().nullsLast().op("enum_ops"), table.criadaEm.desc().nullsFirst().op("enum_ops")),
	foreignKey({
			columns: [table.analisadaPor],
			foreignColumns: [contas.id],
			name: "denuncias_analisada_por_fkey"
		}),
	foreignKey({
			columns: [table.contaId],
			foreignColumns: [contas.id],
			name: "denuncias_conta_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.golpeId],
			foreignColumns: [golpesConhecidos.id],
			name: "fk_denuncia_golpe"
		}).onDelete("set null"),
	unique("denuncias_codigo_key").on(table.codigo),
]);

export const monitoramentos = pgTable("monitoramentos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	contaId: uuid("conta_id").notNull(),
	alvo: text().notNull(),
	scoreAnterior: smallint("score_anterior"),
	ultimaChecagem: timestamp("ultima_checagem", { withTimezone: true, mode: 'date' }),
	proximaChecagem: timestamp("proxima_checagem", { withTimezone: true, mode: 'date' }),
	ativo: boolean().default(true).notNull(),
	criadoEm: timestamp("criado_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("idx_monitor_fila").using("btree", table.proximaChecagem.asc().nullsLast().op("timestamptz_ops")).where(sql`ativo`),
	foreignKey({
			columns: [table.contaId],
			foreignColumns: [contas.id],
			name: "monitoramentos_conta_id_fkey"
		}).onDelete("cascade"),
	unique("monitoramentos_conta_id_alvo_key").on(table.contaId, table.alvo),
]);

export const apiChaves = pgTable("api_chaves", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	contaId: uuid("conta_id").notNull(),
	nome: text().notNull(),
	prefixo: text().notNull(),
	chaveHash: text("chave_hash").notNull(),
	escopos: text().array().default(["verificar"]).notNull(),
	limiteMin: integer("limite_min").default(60).notNull(),
	ultimoUsoEm: timestamp("ultimo_uso_em", { withTimezone: true, mode: 'date' }),
	revogadaEm: timestamp("revogada_em", { withTimezone: true, mode: 'date' }),
	criadaEm: timestamp("criada_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.contaId],
			foreignColumns: [contas.id],
			name: "api_chaves_conta_id_fkey"
		}).onDelete("cascade"),
	unique("api_chaves_chave_hash_key").on(table.chaveHash),
]);

export const webhooks = pgTable("webhooks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	contaId: uuid("conta_id").notNull(),
	url: text().notNull(),
	segredo: text().notNull(),
	eventos: text().array().default(["verificacao.concluida"]).notNull(),
	ativo: boolean().default(true).notNull(),
	falhas: smallint().default(0).notNull(),
	criadoEm: timestamp("criado_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.contaId],
			foreignColumns: [contas.id],
			name: "webhooks_conta_id_fkey"
		}).onDelete("cascade"),
]);

export const tickets = pgTable("tickets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	contaId: uuid("conta_id"),
	// TODO: failed to parse database type 'citext'
	email: citext("email").notNull(),
	assunto: text().notNull(),
	status: statusTicket().default('aberto').notNull(),
	prioridade: smallint().default(3).notNull(),
	verificacaoId: uuid("verificacao_id"),
	criadoEm: timestamp("criado_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	fechadoEm: timestamp("fechado_em", { withTimezone: true, mode: 'date' }),
}, (table) => [
	index("idx_tickets_fila").using("btree", table.status.asc().nullsLast().op("enum_ops"), table.prioridade.asc().nullsLast().op("int2_ops"), table.criadoEm.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.contaId],
			foreignColumns: [contas.id],
			name: "tickets_conta_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.verificacaoId],
			foreignColumns: [verificacoes.id],
			name: "tickets_verificacao_id_fkey"
		}).onDelete("set null"),
]);

export const ticketMensagens = pgTable("ticket_mensagens", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	ticketId: uuid("ticket_id").notNull(),
	autorId: uuid("autor_id"),
	doSuporte: boolean("do_suporte").default(false).notNull(),
	corpo: text().notNull(),
	criadaEm: timestamp("criada_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("idx_ticket_msg").using("btree", table.ticketId.asc().nullsLast().op("timestamptz_ops"), table.criadaEm.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.autorId],
			foreignColumns: [contas.id],
			name: "ticket_mensagens_autor_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.ticketId],
			foreignColumns: [tickets.id],
			name: "ticket_mensagens_ticket_id_fkey"
		}).onDelete("cascade"),
]);

export const emails = pgTable("emails", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	contaId: uuid("conta_id"),
	// TODO: failed to parse database type 'citext'
	destino: citext("destino").notNull(),
	modelo: text().notNull(),
	resendId: text("resend_id"),
	status: text().default('enviado').notNull(),
	erro: text(),
	enviadoEm: timestamp("enviado_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("idx_emails_conta").using("btree", table.contaId.asc().nullsLast().op("timestamptz_ops"), table.enviadoEm.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.contaId],
			foreignColumns: [contas.id],
			name: "emails_conta_id_fkey"
		}).onDelete("set null"),
]);

export const telefones = pgTable("telefones", {
	numeroE164: text("numero_e164").primaryKey().notNull(),
	ddd: smallint(),
	tipoLinha: text("tipo_linha"),
	operadora: text(),
	portado: boolean(),
	origemVerificada: boolean("origem_verificada"),
	emNaoPerturbe: boolean("em_nao_perturbe"),
	relatosTotal: integer("relatos_total").default(0).notNull(),
	relatosGolpe: integer("relatos_golpe").default(0).notNull(),
	relatos30D: integer("relatos_30d").default(0).notNull(),
	categoriaPredominante: categoriaLigacao("categoria_predominante"),
	score: smallint(),
	veredito: veredito(),
	primeiroRelatoEm: timestamp("primeiro_relato_em", { withTimezone: true, mode: 'date' }),
	ultimoRelatoEm: timestamp("ultimo_relato_em", { withTimezone: true, mode: 'date' }),
	atualizadoEm: timestamp("atualizado_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	sinais: jsonb().default([]).notNull(),
	campanhaId: uuid("campanha_id"),
	primeiraVezVisto: timestamp("primeira_vez_visto", { withTimezone: true, mode: 'date' }).defaultNow(),
}, (table) => [
	index("idx_telefones_recente").using("btree", table.ultimoRelatoEm.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_telefones_score").using("btree", table.score.asc().nullsLast().op("int2_ops")).where(sql`(relatos_total > 0)`),
	foreignKey({
			columns: [table.campanhaId],
			foreignColumns: [campanhasGolpe.id],
			name: "telefones_campanha_id_fkey"
		}).onDelete("set null"),
	check("telefones_score_check", sql`(score >= 0) AND (score <= 100)`),
]);

export const auditoria = pgTable("auditoria", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	atorId: uuid("ator_id"),
	acao: text().notNull(),
	alvoTipo: text("alvo_tipo"),
	alvoId: text("alvo_id"),
	antes: jsonb(),
	depois: jsonb(),
	ip: inet(),
	criadaEm: timestamp("criada_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("idx_auditoria_alvo").using("btree", table.alvoTipo.asc().nullsLast().op("text_ops"), table.alvoId.asc().nullsLast().op("timestamptz_ops"), table.criadaEm.desc().nullsFirst().op("text_ops")),
	index("idx_auditoria_ator").using("btree", table.atorId.asc().nullsLast().op("uuid_ops"), table.criadaEm.desc().nullsFirst().op("uuid_ops")),
	foreignKey({
			columns: [table.atorId],
			foreignColumns: [contas.id],
			name: "auditoria_ator_id_fkey"
		}).onDelete("set null"),
]);

export const logsExternos = pgTable("logs_externos", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	servico: text().notNull(),
	operacao: text(),
	http: smallint(),
	duracaoMs: integer("duracao_ms"),
	custoMicro: integer("custo_micro"),
	erro: text(),
	verificacaoId: uuid("verificacao_id"),
	criadoEm: timestamp("criado_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("idx_logs_servico").using("btree", table.servico.asc().nullsLast().op("text_ops"), table.criadoEm.desc().nullsFirst().op("text_ops")),
	foreignKey({
			columns: [table.verificacaoId],
			foreignColumns: [verificacoes.id],
			name: "logs_externos_verificacao_id_fkey"
		}).onDelete("set null"),
]);

export const pedidosLgpd = pgTable("pedidos_lgpd", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	contaId: uuid("conta_id").notNull(),
	tipo: tipoPedidoLgpd().notNull(),
	status: text().default('pendente').notNull(),
	arquivoUrl: text("arquivo_url"),
	atendidoEm: timestamp("atendido_em", { withTimezone: true, mode: 'date' }),
	criadoEm: timestamp("criado_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.contaId],
			foreignColumns: [contas.id],
			name: "pedidos_lgpd_conta_id_fkey"
		}).onDelete("cascade"),
]);

export const campanhasGolpe = pgTable("campanhas_golpe", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sePassaPor: text("se_passa_por").notNull(),
	setor: text(),
	numeros: integer().default(0).notNull(),
	relatos: integer().default(0).notNull(),
	regioes: text().array(),
	roteiro: text(),
	ativa: boolean().default(true).notNull(),
	detectadaEm: timestamp("detectada_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	encerradaEm: timestamp("encerrada_em", { withTimezone: true, mode: 'date' }),
}, (table) => [
	index("idx_campanhas_ativas").using("btree", table.ativa.asc().nullsLast().op("timestamptz_ops"), table.detectadaEm.desc().nullsFirst().op("timestamptz_ops")),
]);

export const empresas = pgTable("empresas", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	contaId: uuid("conta_id"),
	cnpj: char({ length: 14 }),
	razaoSocial: text("razao_social"),
	nomeFantasia: text("nome_fantasia").notNull(),
	receitaSituacao: text("receita_situacao"),
	receitaAbertura: date("receita_abertura"),
	receitaCnae: text("receita_cnae"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	receitaCapitalCent: bigint("receita_capital_cent", { mode: "number" }),
	receitaEndereco: jsonb("receita_endereco"),
	receitaConsultadaEm: timestamp("receita_consultada_em", { withTimezone: true, mode: 'date' }),
	nivel: nivelEmpresa(),
	status: statusEmpresa().default('rascunho').notNull(),
	// TODO: failed to parse database type 'citext'
	emailContato: citext("email_contato"),
	emailValidadoEm: timestamp("email_validado_em", { withTimezone: true, mode: 'date' }),
	telefoneContato: text("telefone_contato"),
	telefoneValidadoEm: timestamp("telefone_validado_em", { withTimezone: true, mode: 'date' }),
	logoUrl: text("logo_url"),
	descricao: text(),
	categoria: text(),
	aprovadaEm: timestamp("aprovada_em", { withTimezone: true, mode: 'date' }),
	aprovadaPor: uuid("aprovada_por"),
	suspensaEm: timestamp("suspensa_em", { withTimezone: true, mode: 'date' }),
	motivoStatus: text("motivo_status"),
	revisarEm: date("revisar_em"),
	criadaEm: timestamp("criada_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	atualizadaEm: timestamp("atualizada_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	codigo: text(),
}, (table) => [
	index("idx_empresas_codigo").using("btree", table.codigo.asc().nullsLast().op("text_ops")),
	index("idx_empresas_revisar").using("btree", table.revisarEm.asc().nullsLast().op("date_ops")).where(sql`(status = 'aprovada'::status_empresa)`),
	index("idx_empresas_status").using("btree", table.status.asc().nullsLast().op("enum_ops"), table.criadaEm.desc().nullsFirst().op("enum_ops")),
	foreignKey({
			columns: [table.aprovadaPor],
			foreignColumns: [contas.id],
			name: "empresas_aprovada_por_fkey"
		}),
	foreignKey({
			columns: [table.contaId],
			foreignColumns: [contas.id],
			name: "empresas_conta_id_fkey"
		}).onDelete("set null"),
	unique("empresas_cnpj_key").on(table.cnpj),
	unique("empresas_codigo_key").on(table.codigo),
]);

export const alvoHistorico = pgTable("alvo_historico", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	chave: text().notNull(),
	score: smallint(),
	veredito: veredito(),
	motivo: text(),
	itens: jsonb(),
	criadoEm: timestamp("criado_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("idx_hist_chave").using("btree", table.chave.asc().nullsLast().op("text_ops"), table.criadoEm.desc().nullsFirst().op("text_ops")),
	foreignKey({
			columns: [table.chave],
			foreignColumns: [alvos.chave],
			name: "alvo_historico_chave_fkey"
		}).onDelete("cascade"),
]);

export const numerosOficiais = pgTable("numeros_oficiais", {
	numeroE164: text("numero_e164").primaryKey().notNull(),
	empresa: text().notNull(),
	setor: text(),
	fonte: text(),
	conferidoEm: timestamp("conferido_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("idx_oficiais_empresa").using("btree", table.empresa.asc().nullsLast().op("text_ops")),
]);

export const empresaDocumentos = pgTable("empresa_documentos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	empresaId: uuid("empresa_id").notNull(),
	tipo: tipoDocumento().notNull(),
	arquivoRef: text("arquivo_ref").notNull(),
	sha256: text().notNull(),
	conferido: boolean(),
	conferidoPor: uuid("conferido_por"),
	conferidoEm: timestamp("conferido_em", { withTimezone: true, mode: 'date' }),
	observacao: text(),
	apagarEm: date("apagar_em").notNull(),
	criadoEm: timestamp("criado_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("idx_emp_doc_apagar").using("btree", table.apagarEm.asc().nullsLast().op("date_ops")).where(sql`(arquivo_ref IS NOT NULL)`),
	foreignKey({
			columns: [table.conferidoPor],
			foreignColumns: [contas.id],
			name: "empresa_documentos_conferido_por_fkey"
		}),
	foreignKey({
			columns: [table.empresaId],
			foreignColumns: [empresas.id],
			name: "empresa_documentos_empresa_id_fkey"
		}).onDelete("cascade"),
]);

export const alvos = pgTable("alvos", {
	chave: text().primaryKey().notNull(),
	tipo: tipoAlvo().notNull(),
	score: smallint(),
	veredito: veredito(),
	resumo: text(),
	itens: jsonb(),
	confianca: smallint(),
	consultas: integer().default(0).notNull(),
	aproveitamentos: integer().default(0).notNull(),
	denuncias: integer().default(0).notNull(),
	analisadoEm: timestamp("analisado_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	expiraEm: timestamp("expira_em", { withTimezone: true, mode: 'date' }).notNull(),
	travado: boolean().default(false).notNull(),
	primeiraVezEm: timestamp("primeira_vez_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	ultimaVezEm: timestamp("ultima_vez_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	custoMicroTotal: integer("custo_micro_total").default(0).notNull(),
	empresaId: uuid("empresa_id"),
	bonusSelo: smallint("bonus_selo").default(0).notNull(),
}, (table) => [
	index("idx_alvos_empresa").using("btree", table.empresaId.asc().nullsLast().op("uuid_ops")).where(sql`(empresa_id IS NOT NULL)`),
	index("idx_alvos_expira").using("btree", table.expiraEm.asc().nullsLast().op("timestamptz_ops")).where(sql`(NOT travado)`),
	index("idx_alvos_perigosos").using("btree", table.score.asc().nullsLast().op("int2_ops")).where(sql`(score < 40)`),
	index("idx_alvos_populares").using("btree", table.consultas.desc().nullsFirst().op("int4_ops")),
	index("idx_alvos_tipo").using("btree", table.tipo.asc().nullsLast().op("enum_ops"), table.ultimaVezEm.desc().nullsFirst().op("enum_ops")),
	foreignKey({
			columns: [table.empresaId],
			foreignColumns: [empresas.id],
			name: "alvos_empresa_id_fkey"
		}).onDelete("set null"),
	check("alvos_score_check", sql`(score >= 0) AND (score <= 100)`),
]);

export const contestacoes = pgTable("contestacoes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	protocolo: text().notNull(),
	tipo: tipoContestacao().notNull(),
	status: statusContestacao().default('recebida').notNull(),
	alvo: text().notNull(),
	empresaId: uuid("empresa_id"),
	solicitanteNome: text("solicitante_nome").notNull(),
	// TODO: failed to parse database type 'citext'
	solicitanteEmail: citext("solicitante_email").notNull(),
	solicitanteConta: uuid("solicitante_conta"),
	relacao: text(),
	alegacao: text().notNull(),
	identidadeConfirmada: boolean("identidade_confirmada").default(false).notNull(),
	metodoIdentidade: text("metodo_identidade"),
	prazoEm: timestamp("prazo_em", { withTimezone: true, mode: 'date' }).default(sql`(now() + '7 days'::interval)`).notNull(),
	decididaEm: timestamp("decidida_em", { withTimezone: true, mode: 'date' }),
	decididaPor: uuid("decidida_por"),
	decisao: text(),
	scoreAntes: smallint("score_antes"),
	scoreDepois: smallint("score_depois"),
	criadaEm: timestamp("criada_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	atualizadaEm: timestamp("atualizada_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("idx_cont_alvo").using("btree", table.alvo.asc().nullsLast().op("text_ops"), table.criadaEm.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_cont_email").using("btree", table.solicitanteEmail.asc().nullsLast().op("citext_ops")),
	index("idx_cont_fila").using("btree", table.status.asc().nullsLast().op("enum_ops"), table.prazoEm.asc().nullsLast().op("enum_ops")).where(sql`(status = ANY (ARRAY['recebida'::status_contestacao, 'aguardando_prova'::status_contestacao, 'em_analise'::status_contestacao]))`),
	foreignKey({
			columns: [table.decididaPor],
			foreignColumns: [contas.id],
			name: "contestacoes_decidida_por_fkey"
		}),
	foreignKey({
			columns: [table.empresaId],
			foreignColumns: [empresas.id],
			name: "contestacoes_empresa_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.solicitanteConta],
			foreignColumns: [contas.id],
			name: "contestacoes_solicitante_conta_fkey"
		}).onDelete("set null"),
	unique("contestacoes_protocolo_key").on(table.protocolo),
]);

export const empresaEventos = pgTable("empresa_eventos", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	empresaId: uuid("empresa_id").notNull(),
	evento: text().notNull(),
	deStatus: statusEmpresa("de_status"),
	paraStatus: statusEmpresa("para_status"),
	deNivel: nivelEmpresa("de_nivel"),
	paraNivel: nivelEmpresa("para_nivel"),
	motivo: text(),
	atorId: uuid("ator_id"),
	criadoEm: timestamp("criado_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("idx_emp_ev").using("btree", table.empresaId.asc().nullsLast().op("timestamptz_ops"), table.criadoEm.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.atorId],
			foreignColumns: [contas.id],
			name: "empresa_eventos_ator_id_fkey"
		}),
	foreignKey({
			columns: [table.empresaId],
			foreignColumns: [empresas.id],
			name: "empresa_eventos_empresa_id_fkey"
		}).onDelete("cascade"),
]);

export const politicaModeracao = pgTable("politica_moderacao", {
	situacao: text().primaryKey().notNull(),
	exige: text().notNull(),
	decisao: text().notNull(),
	prazoDias: smallint("prazo_dias").default(7).notNull(),
	chave: text().notNull(),
}, (table) => [
	unique("politica_moderacao_chave_key").on(table.chave),
]);

export const contestacaoAnexos = pgTable("contestacao_anexos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	contestacaoId: uuid("contestacao_id").notNull(),
	arquivoRef: text("arquivo_ref").notNull(),
	sha256: text().notNull(),
	descricao: text(),
	apagarEm: date("apagar_em").default(sql`((now() + '2 years'`).notNull(),
	criadoEm: timestamp("criado_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.contestacaoId],
			foreignColumns: [contestacoes.id],
			name: "contestacao_anexos_contestacao_id_fkey"
		}).onDelete("cascade"),
]);

export const telefoneRelatos = pgTable("telefone_relatos", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	numeroE164: text("numero_e164").notNull(),
	contaId: uuid("conta_id"),
	categoria: categoriaLigacao().notNull(),
	origem: origemRelato().default('usuario').notNull(),
	relato: text(),
	sePassouPor: text("se_passou_por"),
	prejuizoCent: integer("prejuizo_cent"),
	ipHash: text("ip_hash"),
	criadoEm: timestamp("criado_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("idx_relato_unico").using("btree", sql`numero_e164`, sql`conta_id`, sql`(((criado_em AT TIME ZONE 'America/Sao_Paulo'::text))::date)`).where(sql`(conta_id IS NOT NULL)`),
	index("idx_relatos_conta").using("btree", table.contaId.asc().nullsLast().op("uuid_ops"), table.criadoEm.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_relatos_numero").using("btree", table.numeroE164.asc().nullsLast().op("timestamptz_ops"), table.criadoEm.desc().nullsFirst().op("text_ops")),
	foreignKey({
			columns: [table.contaId],
			foreignColumns: [contas.id],
			name: "telefone_relatos_conta_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.numeroE164],
			foreignColumns: [telefones.numeroE164],
			name: "telefone_relatos_numero_e164_fkey"
		}).onDelete("cascade"),
]);

export const politicaIaImagem = pgTable("politica_ia_imagem", {
	classe: classeImagem().primaryKey().notNull(),
	peso: smallint().notNull(),
	limiar: smallint().notNull(),
	mensagem: text().notNull(),
});

export const admins = pgTable("admins", {
	contaId: uuid("conta_id").primaryKey().notNull(),
	nivel: smallint().default(1).notNull(),
	criadoEm: timestamp("criado_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	totpSegredo: text("totp_segredo"),
	totpAtivadoEm: timestamp("totp_ativado_em", { withTimezone: true, mode: 'date' }),
	ultimoIp: inet("ultimo_ip"),
	ultimoAcessoEm: timestamp("ultimo_acesso_em", { withTimezone: true, mode: 'date' }),
}, (table) => [
	foreignKey({
			columns: [table.contaId],
			foreignColumns: [contas.id],
			name: "admins_conta_id_fkey"
		}).onDelete("cascade"),
]);

export const empresaDominios = pgTable("empresa_dominios", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	empresaId: uuid("empresa_id").notNull(),
	tipo: tipoPropriedade().default('site').notNull(),
	valor: text().notNull(),
	codigoPosse: text("codigo_posse"),
	metodo: metodoPosse(),
	posseConfirmadaEm: timestamp("posse_confirmada_em", { withTimezone: true, mode: 'date' }),
	ultimaChecagemEm: timestamp("ultima_checagem_em", { withTimezone: true, mode: 'date' }),
	principal: boolean().default(false).notNull(),
	criadoEm: timestamp("criado_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("idx_emp_dom_empresa").using("btree", table.empresaId.asc().nullsLast().op("uuid_ops")),
	index("idx_emp_dom_valor").using("btree", table.valor.asc().nullsLast().op("text_ops")).where(sql`(posse_confirmada_em IS NOT NULL)`),
	foreignKey({
			columns: [table.empresaId],
			foreignColumns: [empresas.id],
			name: "empresa_dominios_empresa_id_fkey"
		}).onDelete("cascade"),
	unique("empresa_dominios_tipo_valor_key").on(table.tipo, table.valor),
]);

export const contestacaoMensagens = pgTable("contestacao_mensagens", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	contestacaoId: uuid("contestacao_id").notNull(),
	autorId: uuid("autor_id"),
	doConfia: boolean("do_confia").default(false).notNull(),
	corpo: text().notNull(),
	criadaEm: timestamp("criada_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("idx_cont_msg").using("btree", table.contestacaoId.asc().nullsLast().op("timestamptz_ops"), table.criadaEm.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.autorId],
			foreignColumns: [contas.id],
			name: "contestacao_mensagens_autor_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.contestacaoId],
			foreignColumns: [contestacoes.id],
			name: "contestacao_mensagens_contestacao_id_fkey"
		}).onDelete("cascade"),
]);

export const imagens = pgTable("imagens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	verificacaoId: uuid("verificacao_id").notNull(),
	sha256: text().notNull(),
	mime: text().notNull(),
	bytes: integer().notNull(),
	largura: integer(),
	altura: integer(),
	c2PaPresente: boolean("c2pa_presente").default(false).notNull(),
	c2PaValido: boolean("c2pa_valido"),
	c2PaEmissor: text("c2pa_emissor"),
	c2PaDeclaraIa: boolean("c2pa_declara_ia"),
	c2PaBruto: jsonb("c2pa_bruto"),
	iaProbabilidade: smallint("ia_probabilidade"),
	iaGerador: text("ia_gerador"),
	iaFornecedor: text("ia_fornecedor").default('hive').notNull(),
	textoExtraido: text("texto_extraido"),
	apagadaEm: timestamp("apagada_em", { withTimezone: true, mode: 'date' }),
	criadaEm: timestamp("criada_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	classe: classeImagem(),
	classeConf: smallint("classe_conf"),
	iaPeso: smallint("ia_peso").default(0),
	pedidoDireto: boolean("pedido_direto").default(false).notNull(),
	sinaisEdicao: jsonb("sinais_edicao"),
}, (table) => [
	index("idx_imagens_sha").using("btree", table.sha256.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.verificacaoId],
			foreignColumns: [verificacoes.id],
			name: "imagens_verificacao_id_fkey"
		}).onDelete("cascade"),
	check("imagens_classe_conf_check", sql`(classe_conf >= 0) AND (classe_conf <= 100)`),
	check("imagens_ia_probabilidade_check", sql`(ia_probabilidade >= 0) AND (ia_probabilidade <= 100)`),
]);

export const orcamento = pgTable("orcamento", {
	competencia: date().primaryKey().notNull(),
	tetoCent: integer("teto_cent").notNull(),
	gastoCent: integer("gasto_cent").default(0).notNull(),
	alertaEmPct: smallint("alerta_em_pct").default(70).notNull(),
	travado: boolean().default(false).notNull(),
	avisadoEm: timestamp("avisado_em", { withTimezone: true, mode: 'date' }),
});

export const denunciaProvas = pgTable("denuncia_provas", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	denunciaId: uuid("denuncia_id").notNull(),
	tipo: tipoProva().default('outro').notNull(),
	arquivoRef: text("arquivo_ref").notNull(),
	sha256: text().notNull(),
	mime: text(),
	bytes: integer(),
	apagarEm: date("apagar_em").default(sql`((now() + '2 years'`).notNull(),
	criadaEm: timestamp("criada_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("idx_provas_denuncia").using("btree", table.denunciaId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.denunciaId],
			foreignColumns: [denuncias.id],
			name: "denuncia_provas_denuncia_id_fkey"
		}).onDelete("cascade"),
]);

export const golpesConhecidos = pgTable("golpes_conhecidos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	nome: text().notNull(),
	apelido: text(),
	categoria: text().notNull(),
	roteiro: text().notNull(),
	sinais: jsonb().default([]).notNull(),
	comoEvitar: text("como_evitar"),
	primeiraDenunciaEm: timestamp("primeira_denuncia_em", { withTimezone: true, mode: 'date' }),
	denuncias: integer().default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	prejuizoTotalCent: bigint("prejuizo_total_cent", { mode: "number" }).default(0).notNull(),
	ativo: boolean().default(true).notNull(),
	publicado: boolean().default(false).notNull(),
	criadoEm: timestamp("criado_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	atualizadoEm: timestamp("atualizado_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("idx_golpes_ativos").using("btree", table.ativo.asc().nullsLast().op("int4_ops"), table.denuncias.desc().nullsFirst().op("int4_ops")),
]);

export const assinaturas = pgTable("assinaturas", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	contaId: uuid("conta_id").notNull(),
	planoId: smallint("plano_id").notNull(),
	status: statusAssinatura().default('pendente').notNull(),
	ciclo: cicloCobranca().default('mensal').notNull(),
	asaasClienteId: text("asaas_cliente_id"),
	asaasAssinaturaId: text("asaas_assinatura_id"),
	inicioEm: timestamp("inicio_em", { withTimezone: true, mode: 'date' }),
	proximaCobranca: date("proxima_cobranca"),
	canceladaEm: timestamp("cancelada_em", { withTimezone: true, mode: 'date' }),
	motivoCancelamento: text("motivo_cancelamento"),
	criadaEm: timestamp("criada_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	atualizadaEm: timestamp("atualizada_em", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	documentoUltimos: char("documento_ultimos", { length: 4 }),
	documentoTipo: text("documento_tipo"),
}, (table) => [
	uniqueIndex("idx_assinatura_viva").using("btree", table.contaId.asc().nullsLast().op("uuid_ops")).where(sql`(status = ANY (ARRAY['ativa'::status_assinatura, 'pendente'::status_assinatura, 'atrasada'::status_assinatura, 'teste'::status_assinatura]))`),
	foreignKey({
			columns: [table.contaId],
			foreignColumns: [contas.id],
			name: "assinaturas_conta_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.planoId],
			foreignColumns: [planos.id],
			name: "assinaturas_plano_id_fkey"
		}),
	unique("assinaturas_asaas_assinatura_id_key").on(table.asaasAssinaturaId),
	check("assinaturas_documento_tipo_check", sql`documento_tipo = ANY (ARRAY['cpf'::text, 'cnpj'::text])`),
	check("documento_so_os_ultimos", sql`(documento_ultimos IS NULL) OR (documento_ultimos ~ '^[0-9]{4}$'::text)`),
]);

export const usoMensal = pgTable("uso_mensal", {
	contaId: uuid("conta_id").notNull(),
	competencia: date().notNull(),
	verificacoes: integer().default(0).notNull(),
	imagens: integer().default(0).notNull(),
	revisoes: integer().default(0).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.contaId],
			foreignColumns: [contas.id],
			name: "uso_mensal_conta_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.contaId, table.competencia], name: "uso_mensal_pkey"}),
]);
export const vPainelFila = pgView("v_painel_fila", {	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	prioridade: bigint({ mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	atrasados: bigint({ mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	urgentes: bigint({ mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	noPrazo: bigint("no_prazo", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	total: bigint({ mode: "number" }),
	maisAntigaEm: timestamp("mais_antiga_em", { withTimezone: true, mode: 'date' }),
}).as(sql`SELECT count(*) FILTER (WHERE urgencia = 'prioridade'::text) AS prioridade, count(*) FILTER (WHERE urgencia = 'atrasado'::text) AS atrasados, count(*) FILTER (WHERE urgencia = 'urgente'::text) AS urgentes, count(*) FILTER (WHERE urgencia = 'no prazo'::text) AS no_prazo, count(*) AS total, min(criada_em) AS mais_antiga_em FROM v_fila_admin`);

export const vCustoServicoMes = pgView("v_custo_servico_mes", {	servico: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	chamadas: bigint({ mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	falhas: bigint({ mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	custoMicro: bigint("custo_micro", { mode: "number" }),
	medioMicro: numeric("medio_micro"),
	medioMs: numeric("medio_ms"),
}).as(sql`SELECT servico, count(*) AS chamadas, count(*) FILTER (WHERE erro IS NOT NULL) AS falhas, COALESCE(sum(custo_micro), 0::bigint) AS custo_micro, round(COALESCE(avg(custo_micro), 0::numeric)) AS medio_micro, round(COALESCE(avg(duracao_ms), 0::numeric)) AS medio_ms FROM logs_externos WHERE criado_em >= date_trunc('month'::text, now()) GROUP BY servico ORDER BY (COALESCE(sum(custo_micro), 0::bigint)) DESC`);

export const vContaCompleta = pgView("v_conta_completa", {	id: uuid(),
	// TODO: failed to parse database type 'citext'
	email: citext("email"),
	nome: text(),
	status: statusConta(),
	criadaEm: timestamp("criada_em", { withTimezone: true, mode: 'date' }),
	ultimoAcessoEm: timestamp("ultimo_acesso_em", { withTimezone: true, mode: 'date' }),
	plano: text(),
	statusAssinatura: statusAssinatura("status_assinatura"),
	proximaCobranca: date("proxima_cobranca"),
	usouMes: integer("usou_mes"),
	imagensMes: integer("imagens_mes"),
	limiteMes: integer("limite_mes"),
}).as(sql`SELECT c.id, c.email, c.nome, c.status, c.criada_em, c.ultimo_acesso_em, p.slug AS plano, a.status AS status_assinatura, a.proxima_cobranca, COALESCE(u.verificacoes, 0) AS usou_mes, COALESCE(u.imagens, 0) AS imagens_mes, (p.limites ->> 'verificacoes_mes'::text)::integer AS limite_mes FROM contas c LEFT JOIN assinaturas a ON a.conta_id = c.id AND (a.status = ANY (ARRAY['ativa'::status_assinatura, 'pendente'::status_assinatura, 'atrasada'::status_assinatura, 'teste'::status_assinatura])) LEFT JOIN planos p ON p.id = COALESCE(a.plano_id::integer, 1) LEFT JOIN uso_mensal u ON u.conta_id = c.id AND u.competencia = date_trunc('month'::text, now())::date WHERE c.excluida_em IS NULL`);

export const vCustoDia = pgView("v_custo_dia", {	dia: date(),
	servico: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	chamadas: bigint({ mode: "number" }),
	custoUsd: numeric("custo_usd"),
}).as(sql`SELECT date_trunc('day'::text, criado_em)::date AS dia, servico, count(*) AS chamadas, sum(custo_micro)::numeric / 1000000.0 AS custo_usd FROM logs_externos GROUP BY (date_trunc('day'::text, criado_em)::date), servico ORDER BY (date_trunc('day'::text, criado_em)::date) DESC`);

export const vMemoria = pgView("v_memoria", {	tipo: tipoAlvo(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	alvosGuardados: bigint("alvos_guardados", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	consultasTotais: bigint("consultas_totais", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	respostasDaMemoria: bigint("respostas_da_memoria", { mode: "number" }),
	economiaPct: numeric("economia_pct"),
	gastoUsd: numeric("gasto_usd"),
}).as(sql`SELECT tipo, count(*) AS alvos_guardados, sum(consultas) AS consultas_totais, sum(aproveitamentos) AS respostas_da_memoria, round(100.0 * sum(aproveitamentos)::numeric / NULLIF(sum(consultas), 0)::numeric, 1) AS economia_pct, sum(custo_micro_total)::numeric / 1000000.0 AS gasto_usd FROM alvos GROUP BY tipo`);

export const vAlvosPopulares = pgView("v_alvos_populares", {	chave: text(),
	tipo: tipoAlvo(),
	score: smallint(),
	veredito: veredito(),
	consultas: integer(),
	denuncias: integer(),
	ultimaVezEm: timestamp("ultima_vez_em", { withTimezone: true, mode: 'date' }),
}).as(sql`SELECT chave, tipo, score, veredito, consultas, denuncias, ultima_vez_em FROM alvos ORDER BY consultas DESC LIMIT 200`);

export const vFilaAdmin = pgView("v_fila_admin", {	fila: text(),
	id: text(),
	referencia: text(),
	assunto: text(),
	alvo: text(),
	prazoEm: timestamp("prazo_em", { withTimezone: true, mode: 'date' }),
	urgencia: text(),
	criadaEm: timestamp("criada_em", { withTimezone: true, mode: 'date' }),
}).as(sql`SELECT fila, id, referencia, assunto, alvo, prazo_em, urgencia, criada_em FROM ( SELECT 'golpe_novo'::text AS fila, d.id::text AS id, "left"(d.id::text, 8) AS referencia, COALESCE(d.descricao_novo, d.categoria) AS assunto, d.alvo, d.criada_em + '2 days'::interval AS prazo_em, 'prioridade'::text AS urgencia, d.criada_em FROM denuncias d WHERE d.golpe_novo AND (d.status = ANY (ARRAY['nova'::status_denuncia, 'em_analise'::status_denuncia])) UNION ALL SELECT 'contestacao'::text, c.id::text AS id, c.protocolo, c.tipo::text AS tipo, c.alvo, c.prazo_em, CASE WHEN c.prazo_em < now() THEN 'atrasado'::text WHEN c.prazo_em < (now() + '2 days'::interval) THEN 'urgente'::text ELSE 'no prazo'::text END AS "case", c.criada_em FROM contestacoes c WHERE c.status = ANY (ARRAY['recebida'::status_contestacao, 'aguardando_prova'::status_contestacao, 'em_analise'::status_contestacao]) UNION ALL SELECT 'denuncia'::text, d.id::text AS id, "left"(d.id::text, 8) AS "left", d.categoria, d.alvo, d.criada_em + '7 days'::interval, CASE WHEN d.criada_em < (now() - '7 days'::interval) THEN 'atrasado'::text WHEN d.bo_anexado THEN 'urgente'::text WHEN d.criada_em < (now() - '5 days'::interval) THEN 'urgente'::text ELSE 'no prazo'::text END AS "case", d.criada_em FROM denuncias d WHERE NOT d.golpe_novo AND (d.status = ANY (ARRAY['nova'::status_denuncia, 'em_analise'::status_denuncia])) UNION ALL SELECT 'empresa'::text, e.id::text AS id, e.nome_fantasia, 'cadastro'::text, COALESCE(e.cnpj, ''::bpchar) AS "coalesce", e.criada_em + '7 days'::interval, CASE WHEN e.criada_em < (now() - '7 days'::interval) THEN 'atrasado'::text WHEN e.criada_em < (now() - '5 days'::interval) THEN 'urgente'::text ELSE 'no prazo'::text END AS "case", e.criada_em FROM empresas e WHERE e.status = 'em_analise'::status_empresa) f ORDER BY (urgencia = 'prioridade'::text) DESC, prazo_em`);

export const vMargemDia = pgView("v_margem_dia", {	dia: date(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	verificacoes: bigint({ mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	comImagem: bigint("com_imagem", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	custoMicro: bigint("custo_micro", { mode: "number" }),
	microPorVerificacao: numeric("micro_por_verificacao"),
}).as(sql`SELECT date_trunc('day'::text, criada_em)::date AS dia, count(*) AS verificacoes, count(*) FILTER (WHERE tipo = 'imagem'::tipo_alvo) AS com_imagem, COALESCE(sum(custo_micro), 0::bigint) AS custo_micro, CASE WHEN count(*) = 0 THEN 0::numeric ELSE round(COALESCE(sum(custo_micro), 0::bigint)::numeric / count(*)::numeric) END AS micro_por_verificacao FROM verificacoes v WHERE criada_em >= (now() - '30 days'::interval) GROUP BY (date_trunc('day'::text, criada_em)::date) ORDER BY (date_trunc('day'::text, criada_em)::date) DESC`);

export const vEmpresaPainel = pgView("v_empresa_painel", {	id: uuid(),
	nomeFantasia: text("nome_fantasia"),
	razaoSocial: text("razao_social"),
	cnpj: char({ length: 14 }),
	status: statusEmpresa(),
	nivel: nivelEmpresa(),
	receitaSituacao: text("receita_situacao"),
	receitaAbertura: date("receita_abertura"),
	criadaEm: timestamp("criada_em", { withTimezone: true, mode: 'date' }),
	aprovadaEm: timestamp("aprovada_em", { withTimezone: true, mode: 'date' }),
	posseConfirmada: boolean("posse_confirmada"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	propriedades: bigint({ mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	denuncias90D: bigint("denuncias_90d", { mode: "number" }),
}).as(sql`SELECT id, nome_fantasia, razao_social, cnpj, status, nivel, receita_situacao, receita_abertura, criada_em, aprovada_em, tem_posse_confirmada(id) AS posse_confirmada, ( SELECT count(*) AS count FROM empresa_dominios d WHERE d.empresa_id = e.id) AS propriedades, ( SELECT count(*) AS count FROM denuncias dn JOIN empresa_dominios d2 ON d2.empresa_id = e.id AND dn.alvo = d2.valor WHERE dn.status = 'confirmada'::status_denuncia AND dn.criada_em > (now() - '90 days'::interval)) AS denuncias_90d FROM empresas e`);