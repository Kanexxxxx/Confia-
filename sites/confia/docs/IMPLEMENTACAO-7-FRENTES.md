# Confia — sete frentes de implementação

1. Conta e persistência: login hospedado com ChatGPT, dados em D1, perfil editável e exportação. Cadastro próprio por e-mail e migração de contas PostgreSQL antigas seguem pendentes.
2. Verificador: análise preliminar da estrutura de domínio e consulta opcional ao Google Safe Browsing. Histórico privado persistente. Não abre nem executa o destino; sem veredito de segurança por ausência de alerta. Faltam sandbox, reputação, RDAP e prints.
3. Fluxos: denúncias privadas e cadastros de lojas persistem com protocolo. Faltam anexos privados, prova de posse e consulta oficial de CNPJ.
4. Administração: fila de denúncias/lojas, atualização de status e justificativa, auditoria atômica. Restrita ao titular por identidade da hospedagem e TOTP em cada operação. Não concede selo automaticamente. Faltam papéis adicionais, custos e atendimento completo.
5. Integrações: pagamentos bloqueados; e-mail próprio e sandbox Asaas pendentes. Chaves só em segredos de runtime.
6. Qualidade: layout responsivo das novas telas, validação de tipos e build. PWA e teste físico seguem pendentes.
7. Facebook / Meta / WhatsApp: conferir página existente antes de criar outra; configurar empresa e aplicativo Meta, WABA e número; quatro templates de utilidade preparados; submissão protegida e webhook assinado implementados. Aprovação Meta, conta/número e envs ainda necessários. Nenhuma mensagem é enviada automaticamente.

As implementações desta pasta se referem ao runtime Sites em `sites/confia/` na cópia do GitHub. O Next/PostgreSQL histórico em `web/` é preservado. Não restauramos dados da VPS antiga nem substituímos chaves do cofre antigo.
