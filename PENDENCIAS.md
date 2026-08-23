# confia? — O que precisa ser adquirido, contratado e configurado

**Situação do projeto:** versão beta, em construção.
**Domínio:** confiia.com.br
**Última revisão:** 22/08/2026

Este arquivo é a lista viva do que **só você pode resolver** — contratos, contas,
chaves e decisões. Marque `[x]` conforme for concluindo.

---

## 🔴 URGENTE — sem isso não pode ir ao ar com usuário real

### 1. Contratos de proteção de dados (DPA)
> Você envia print de usuário para servidor nos Estados Unidos. Sem estes contratos,
> está em descumprimento da LGPD desde o primeiro usuário.

- [ ] **OpenAI** — solicitar o *Data Processing Addendum* em
      `platform.openai.com` → Settings → Data controls → DPA. É gratuito e assinado online.
- [ ] **OpenAI** — **desativar treinamento**: Settings → Data controls →
      desligar "Improve the model for everyone". Tirar um print como comprovante.
- [ ] **OpenAI** — ativar **Zero Data Retention** se disponível na sua conta
      (a API não guarda nada, nem por 30 dias). Precisa solicitar ao suporte.
- [ ] **Hive AI** — pedir o DPA por e-mail comercial antes de assinar.
- [ ] Guardar os dois contratos assinados numa pasta. Isso é sua defesa em fiscalização.

### 2. Dados da empresa para os documentos legais
> Os trechos em amarelo de `privacidade.html`, `termos.html` e `reembolso.html`.

- [ ] Razão social completa
- [ ] CNPJ
- [ ] Endereço completo da sede
- [ ] Nome do **encarregado de proteção de dados** (pode ser você mesmo — a LGPD só exige indicar alguém)

### 3. E-mails do domínio
- [ ] `privacidade@confiia.com.br` — obrigatório pela LGPD
- [ ] `contato@confiia.com.br`
- [ ] `suporte@confiia.com.br`
- [ ] `naoresponda@confiia.com.br` — para os e-mails automáticos

### 4. Revisão jurídica
- [ ] Levar `privacidade.html`, `termos.html` e `reembolso.html` a um advogado.
      Dois pontos merecem atenção especial:
      **(a)** o texto sobre indícios de golpe em site de terceiro;
      **(b)** a responsabilidade do selo de loja verificada.

---

### 5. Painel administrativo — trancar antes de abrir para o público
> `admin.html` hoje é protótipo e abre para qualquer um que souber o endereço.
> Ele enxerga a base inteira: contas, denúncias, provas e boletim de ocorrência.
> Isso é vazamento de dado pessoal esperando acontecer.

- [ ] **Login próprio de admin**, conferindo a tabela `admins` — não basta o login comum
- [ ] **Segundo fator (2FA) obrigatório.** A migração `007_admin.sql` já criou a coluna
      `admins.totp_segredo`; falta gerar o segredo e **recusar login sem ele**
- [ ] Publicar o painel **fora do caminho óbvio** (`/painel-<algo>`) e manter o `noindex`
- [ ] Ligar as ações na API — hoje os botões da gaveta não gravam nada
- [ ] Garantir que **toda** decisão passe pela função `registra()` e caia em `auditoria`
- [ ] Decidir quem mais terá acesso e em qual nível (1 = dono, 2 = operação)

---

## 🟡 NECESSÁRIO — para o serviço funcionar de verdade

### 6. Contas e chaves de API

| Serviço | Para quê | Onde pegar | Custo |
|---|---|---|---|
| [ ] **OpenAI** | Ler print e interpretar conteúdo | platform.openai.com | por uso (~R$ 0,06/imagem) |
| [ ] **Hive AI** | Detectar imagem gerada por IA | thehive.ai | US$ 0,003/imagem |
| [ ] **Google Safe Browsing** | Consultar listas de phishing | console.cloud.google.com | grátis |
| [ ] **Resend** | E-mails do sistema | resend.com | grátis até 3.000/mês |
| [ ] **Asaas** | Pagamento e assinatura | asaas.com | % por transação |
| [ ] **WHOIS / RDAP** | Idade e dono do domínio | registro.br (grátis) + API paga p/ .com | a definir |

> Guarde todas as chaves em variáveis de ambiente no servidor.
> **Nunca** coloque chave dentro do código ou em arquivo que vá pro Git.

### 7. Configuração de e-mail (senão cai em spam)
- [ ] **SPF** — registro TXT no DNS autorizando o Resend
- [ ] **DKIM** — assinatura, o Resend gera os registros
- [ ] **DMARC** — política de tratamento; comece com `p=none` e depois endureça
- [ ] Testar em `mail-tester.com` — buscar nota 9 ou 10 antes de enviar em volume

### 8. Servidor (Hostinger)
- [ ] Contratar o VPS
- [ ] Apontar o domínio (registros A e AAAA)
- [ ] Certificado SSL (Let's Encrypt, gratuito)
- [ ] Firewall: liberar só 80, 443 e SSH
- [ ] SSH **apenas por chave**, senha desativada
- [ ] Backup automático do Postgres, com cópia **fora** do servidor
- [ ] Fail2ban contra tentativa de invasão

### 9. Asaas
- [ ] Conta aprovada (leva alguns dias, envia documento antes)
- [ ] Chave de API de produção
- [ ] Configurar **webhook** apontando para `confiia.com.br/api/asaas/webhook`
- [ ] Ativar **Pix** — converte muito mais que cartão no Brasil
- [ ] Definir emissão de nota fiscal

---

## 🟢 IMPORTANTE — antes de crescer

### 10. Segurança
- [ ] Rate limit por IP e por conta (impede alguém torrar sua cota de IA)
- [ ] Captcha ou desafio no cadastro (evita conta em massa)
- [ ] Monitorar gasto diário das APIs, com alerta de teto
- [ ] Rotina que apaga imagens antigas de fato — não só marcar como apagada
- [ ] Rotina que apaga logs de acesso com mais de 6 meses

### 11. Marca e presença
- [ ] Perfis oficiais (Instagram, TikTok) — **registre antes que golpista registre**
- [ ] Registro da marca no INPI
- [ ] WhatsApp Business no número **(16) 99706-2339**

### 12. Base de conhecimento
- [ ] Lista de números oficiais de bancos e empresas grandes (alimenta `numeros_oficiais`)
- [ ] Lista de domínios oficiais das marcas mais imitadas (alimenta `empresa_dominios`)
- [ ] Definir quem revisa denúncia e em quanto tempo

---

## Decisões que ainda dependem de você

- [ ] **Limite do plano grátis logado** — hoje está 5/mês na página de planos
- [ ] **Quanto tempo guardar histórico** de quem cancelou o plano
- [ ] **Quem revisa** as análises marcadas para revisão humana (Premium)
- [ ] **Prazo de resposta** para denúncia — o site promete "conferimos", precisa de prazo real
- [ ] Se o nível **Registrada** entra automático por CNPJ ativo ou passa por conferência

---

## Custo mensal estimado no início

| Item | Estimativa |
|---|---|
| VPS Hostinger | R$ 40 – 120 |
| Domínio (.com.br anual) | ~R$ 40/ano |
| Resend | grátis até 3.000 e-mails |
| OpenAI + Hive | por uso — com 500 verificações/mês, ~R$ 30 |
| Asaas | % sobre o que receber |
| **Total fixo** | **~R$ 60 – 150/mês** |

Com 10 assinantes do Básico (R$ 12,90) o custo fixo já está pago.
