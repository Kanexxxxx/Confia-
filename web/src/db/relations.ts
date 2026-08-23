/* GERADO por `npm run db:puxar`. Não edite à mão.
   Descreve como as tabelas se ligam, para consulta com join. */

import { relations } from "drizzle-orm/relations";
import { contas, tokens, assinaturas, planos, sessoes, pagamentos, membros, verificacoes, verificacaoItens, monitoramentos, apiChaves, denuncias, golpesConhecidos, webhooks, tickets, ticketMensagens, emails, auditoria, logsExternos, pedidosLgpd, campanhasGolpe, telefones, empresas, alvos, alvoHistorico, empresaDocumentos, contestacoes, empresaEventos, contestacaoAnexos, telefoneRelatos, admins, empresaDominios, contestacaoMensagens, imagens, denunciaProvas, usoMensal } from "./schema";

export const tokensRelations = relations(tokens, ({one}) => ({
	conta: one(contas, {
		fields: [tokens.contaId],
		references: [contas.id]
	}),
}));

export const contasRelations = relations(contas, ({many}) => ({
	tokens: many(tokens),
	assinaturas: many(assinaturas),
	sessoes: many(sessoes),
	membros_membroId: many(membros, {
		relationName: "membros_membroId_contas_id"
	}),
	membros_titularId: many(membros, {
		relationName: "membros_titularId_contas_id"
	}),
	verificacoes_contaId: many(verificacoes, {
		relationName: "verificacoes_contaId_contas_id"
	}),
	verificacoes_revisadoPor: many(verificacoes, {
		relationName: "verificacoes_revisadoPor_contas_id"
	}),
	monitoramentos: many(monitoramentos),
	apiChaves: many(apiChaves),
	denuncias_analisadaPor: many(denuncias, {
		relationName: "denuncias_analisadaPor_contas_id"
	}),
	denuncias_contaId: many(denuncias, {
		relationName: "denuncias_contaId_contas_id"
	}),
	webhooks: many(webhooks),
	tickets: many(tickets),
	ticketMensagens: many(ticketMensagens),
	emails: many(emails),
	auditorias: many(auditoria),
	pedidosLgpds: many(pedidosLgpd),
	empresas_aprovadaPor: many(empresas, {
		relationName: "empresas_aprovadaPor_contas_id"
	}),
	empresas_contaId: many(empresas, {
		relationName: "empresas_contaId_contas_id"
	}),
	empresaDocumentos: many(empresaDocumentos),
	contestacoes_decididaPor: many(contestacoes, {
		relationName: "contestacoes_decididaPor_contas_id"
	}),
	contestacoes_solicitanteConta: many(contestacoes, {
		relationName: "contestacoes_solicitanteConta_contas_id"
	}),
	empresaEventos: many(empresaEventos),
	telefoneRelatos: many(telefoneRelatos),
	admins: many(admins),
	contestacaoMensagens: many(contestacaoMensagens),
	usoMensals: many(usoMensal),
}));

export const assinaturasRelations = relations(assinaturas, ({one, many}) => ({
	conta: one(contas, {
		fields: [assinaturas.contaId],
		references: [contas.id]
	}),
	plano: one(planos, {
		fields: [assinaturas.planoId],
		references: [planos.id]
	}),
	pagamentos: many(pagamentos),
}));

export const planosRelations = relations(planos, ({many}) => ({
	assinaturas: many(assinaturas),
}));

export const sessoesRelations = relations(sessoes, ({one}) => ({
	conta: one(contas, {
		fields: [sessoes.contaId],
		references: [contas.id]
	}),
}));

export const pagamentosRelations = relations(pagamentos, ({one}) => ({
	assinatura: one(assinaturas, {
		fields: [pagamentos.assinaturaId],
		references: [assinaturas.id]
	}),
}));

export const membrosRelations = relations(membros, ({one}) => ({
	conta_membroId: one(contas, {
		fields: [membros.membroId],
		references: [contas.id],
		relationName: "membros_membroId_contas_id"
	}),
	conta_titularId: one(contas, {
		fields: [membros.titularId],
		references: [contas.id],
		relationName: "membros_titularId_contas_id"
	}),
}));

export const verificacoesRelations = relations(verificacoes, ({one, many}) => ({
	conta_contaId: one(contas, {
		fields: [verificacoes.contaId],
		references: [contas.id],
		relationName: "verificacoes_contaId_contas_id"
	}),
	conta_revisadoPor: one(contas, {
		fields: [verificacoes.revisadoPor],
		references: [contas.id],
		relationName: "verificacoes_revisadoPor_contas_id"
	}),
	verificacaoItens: many(verificacaoItens),
	tickets: many(tickets),
	logsExternos: many(logsExternos),
	imagens: many(imagens),
}));

export const verificacaoItensRelations = relations(verificacaoItens, ({one}) => ({
	verificacoe: one(verificacoes, {
		fields: [verificacaoItens.verificacaoId],
		references: [verificacoes.id]
	}),
}));

export const monitoramentosRelations = relations(monitoramentos, ({one}) => ({
	conta: one(contas, {
		fields: [monitoramentos.contaId],
		references: [contas.id]
	}),
}));

export const apiChavesRelations = relations(apiChaves, ({one}) => ({
	conta: one(contas, {
		fields: [apiChaves.contaId],
		references: [contas.id]
	}),
}));

export const denunciasRelations = relations(denuncias, ({one, many}) => ({
	conta_analisadaPor: one(contas, {
		fields: [denuncias.analisadaPor],
		references: [contas.id],
		relationName: "denuncias_analisadaPor_contas_id"
	}),
	conta_contaId: one(contas, {
		fields: [denuncias.contaId],
		references: [contas.id],
		relationName: "denuncias_contaId_contas_id"
	}),
	golpesConhecido: one(golpesConhecidos, {
		fields: [denuncias.golpeId],
		references: [golpesConhecidos.id]
	}),
	denunciaProvas: many(denunciaProvas),
}));

export const golpesConhecidosRelations = relations(golpesConhecidos, ({many}) => ({
	denuncias: many(denuncias),
}));

export const webhooksRelations = relations(webhooks, ({one}) => ({
	conta: one(contas, {
		fields: [webhooks.contaId],
		references: [contas.id]
	}),
}));

export const ticketsRelations = relations(tickets, ({one, many}) => ({
	conta: one(contas, {
		fields: [tickets.contaId],
		references: [contas.id]
	}),
	verificacoe: one(verificacoes, {
		fields: [tickets.verificacaoId],
		references: [verificacoes.id]
	}),
	ticketMensagens: many(ticketMensagens),
}));

export const ticketMensagensRelations = relations(ticketMensagens, ({one}) => ({
	conta: one(contas, {
		fields: [ticketMensagens.autorId],
		references: [contas.id]
	}),
	ticket: one(tickets, {
		fields: [ticketMensagens.ticketId],
		references: [tickets.id]
	}),
}));

export const emailsRelations = relations(emails, ({one}) => ({
	conta: one(contas, {
		fields: [emails.contaId],
		references: [contas.id]
	}),
}));

export const auditoriaRelations = relations(auditoria, ({one}) => ({
	conta: one(contas, {
		fields: [auditoria.atorId],
		references: [contas.id]
	}),
}));

export const logsExternosRelations = relations(logsExternos, ({one}) => ({
	verificacoe: one(verificacoes, {
		fields: [logsExternos.verificacaoId],
		references: [verificacoes.id]
	}),
}));

export const pedidosLgpdRelations = relations(pedidosLgpd, ({one}) => ({
	conta: one(contas, {
		fields: [pedidosLgpd.contaId],
		references: [contas.id]
	}),
}));

export const telefonesRelations = relations(telefones, ({one, many}) => ({
	campanhasGolpe: one(campanhasGolpe, {
		fields: [telefones.campanhaId],
		references: [campanhasGolpe.id]
	}),
	telefoneRelatos: many(telefoneRelatos),
}));

export const campanhasGolpeRelations = relations(campanhasGolpe, ({many}) => ({
	telefones: many(telefones),
}));

export const empresasRelations = relations(empresas, ({one, many}) => ({
	conta_aprovadaPor: one(contas, {
		fields: [empresas.aprovadaPor],
		references: [contas.id],
		relationName: "empresas_aprovadaPor_contas_id"
	}),
	conta_contaId: one(contas, {
		fields: [empresas.contaId],
		references: [contas.id],
		relationName: "empresas_contaId_contas_id"
	}),
	empresaDocumentos: many(empresaDocumentos),
	alvos: many(alvos),
	contestacoes: many(contestacoes),
	empresaEventos: many(empresaEventos),
	empresaDominios: many(empresaDominios),
}));

export const alvoHistoricoRelations = relations(alvoHistorico, ({one}) => ({
	alvo: one(alvos, {
		fields: [alvoHistorico.chave],
		references: [alvos.chave]
	}),
}));

export const alvosRelations = relations(alvos, ({one, many}) => ({
	alvoHistoricos: many(alvoHistorico),
	empresa: one(empresas, {
		fields: [alvos.empresaId],
		references: [empresas.id]
	}),
}));

export const empresaDocumentosRelations = relations(empresaDocumentos, ({one}) => ({
	conta: one(contas, {
		fields: [empresaDocumentos.conferidoPor],
		references: [contas.id]
	}),
	empresa: one(empresas, {
		fields: [empresaDocumentos.empresaId],
		references: [empresas.id]
	}),
}));

export const contestacoesRelations = relations(contestacoes, ({one, many}) => ({
	conta_decididaPor: one(contas, {
		fields: [contestacoes.decididaPor],
		references: [contas.id],
		relationName: "contestacoes_decididaPor_contas_id"
	}),
	empresa: one(empresas, {
		fields: [contestacoes.empresaId],
		references: [empresas.id]
	}),
	conta_solicitanteConta: one(contas, {
		fields: [contestacoes.solicitanteConta],
		references: [contas.id],
		relationName: "contestacoes_solicitanteConta_contas_id"
	}),
	contestacaoAnexos: many(contestacaoAnexos),
	contestacaoMensagens: many(contestacaoMensagens),
}));

export const empresaEventosRelations = relations(empresaEventos, ({one}) => ({
	conta: one(contas, {
		fields: [empresaEventos.atorId],
		references: [contas.id]
	}),
	empresa: one(empresas, {
		fields: [empresaEventos.empresaId],
		references: [empresas.id]
	}),
}));

export const contestacaoAnexosRelations = relations(contestacaoAnexos, ({one}) => ({
	contestacoe: one(contestacoes, {
		fields: [contestacaoAnexos.contestacaoId],
		references: [contestacoes.id]
	}),
}));

export const telefoneRelatosRelations = relations(telefoneRelatos, ({one}) => ({
	conta: one(contas, {
		fields: [telefoneRelatos.contaId],
		references: [contas.id]
	}),
	telefone: one(telefones, {
		fields: [telefoneRelatos.numeroE164],
		references: [telefones.numeroE164]
	}),
}));

export const adminsRelations = relations(admins, ({one}) => ({
	conta: one(contas, {
		fields: [admins.contaId],
		references: [contas.id]
	}),
}));

export const empresaDominiosRelations = relations(empresaDominios, ({one}) => ({
	empresa: one(empresas, {
		fields: [empresaDominios.empresaId],
		references: [empresas.id]
	}),
}));

export const contestacaoMensagensRelations = relations(contestacaoMensagens, ({one}) => ({
	conta: one(contas, {
		fields: [contestacaoMensagens.autorId],
		references: [contas.id]
	}),
	contestacoe: one(contestacoes, {
		fields: [contestacaoMensagens.contestacaoId],
		references: [contestacoes.id]
	}),
}));

export const imagensRelations = relations(imagens, ({one}) => ({
	verificacoe: one(verificacoes, {
		fields: [imagens.verificacaoId],
		references: [verificacoes.id]
	}),
}));

export const denunciaProvasRelations = relations(denunciaProvas, ({one}) => ({
	denuncia: one(denuncias, {
		fields: [denunciaProvas.denunciaId],
		references: [denuncias.id]
	}),
}));

export const usoMensalRelations = relations(usoMensal, ({one}) => ({
	conta: one(contas, {
		fields: [usoMensal.contaId],
		references: [contas.id]
	}),
}));