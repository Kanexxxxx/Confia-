# Catálogo de templates — e-mail, WhatsApp, push e SMS (Confia)

> Tom: português simples, sem termo técnico (como o site), voz "a gente". **Regra anti-golpe da própria marca:** nenhuma mensagem do Confia pede senha, código, Pix ou pagamento por link encurtado. Todo template termina com um lembrete: "O Confia nunca pede senha, código ou Pix por mensagem". Links sempre por extenso em `vaideconfia.com`.
> Stack de e-mail: React Email (https://react.email) ou MJML (https://mjml.io) para HTML responsivo (desktop/celular), com cabeçalho navy `#0b2443`, logo, cartão claro e botão `--sky`. Dark mode via `@media (prefers-color-scheme: dark)`. Remetente `Confia <nao-responda@mail.vaideconfia.com>` com SPF/DKIM/DMARC.
> WhatsApp: os templates precisam ser aprovados pela Meta. **Categorias:** AUTHENTICATION para códigos, UTILITY para transacionais e MARKETING para promoções. Variáveis no formato `{{1}}`.

## A. Conta e segurança
| # | Nome técnico | Canal | Gatilho | Assunto / texto |
|---|---|---|---|---|
| 1 | `conta_boas_vindas` | E-mail | Cadastro | **Assunto:** "Bem-vindo ao confia? — sua conta está pronta". Corpo: o que é; 3 dicas; botão "Verificar um link" |
| 2 | `conta_confirmar_email` | E-mail | Cadastro | "Confirme seu e-mail" + botão (válido 24 h) + "Se não foi você, ignore" |
| 3 | `auth_codigo` | WhatsApp (AUTHENTICATION) / SMS | Login sem senha / 2FA | "Seu código confia? é {{1}}. Não compartilhe com ninguém — nem com quem diz ser do Confia." |
| 4 | `conta_link_magico` | E-mail | Login por link | "Seu link de acesso (expira em 15 min)" |
| 5 | `conta_redefinir_senha` | E-mail | Esqueci a senha | "Redefinir sua senha" + IP/cidade aproximada do pedido |
| 6 | `conta_senha_alterada` | E-mail + push | Senha trocada | "Sua senha foi alterada. Não foi você? Proteja sua conta" |
| 7 | `conta_novo_dispositivo` | E-mail + push | Login novo | "Novo acesso: {{aparelho}} em {{cidade}}, {{data}}" |
| 8 | `conta_2fa_ativado` | E-mail | 2FA ligado | "Verificação em duas etapas ativada" |
| 9 | `conta_exclusao_solicitada` | E-mail | LGPD | "Recebemos seu pedido de exclusão — concluído em até {{prazo}}" |
| 10 | `conta_dados_exportados` | E-mail | LGPD | "Seus dados estão prontos para baixar (link válido 48 h)" |

## B. Verificações (o produto)
| # | Nome | Canal | Gatilho | Texto |
|---|---|---|---|---|
| 11 | `verif_resultado_golpe` | E-mail + push + WhatsApp (UTILITY) | Veredito "É golpe" | "⚠ {{dominio}}: é golpe — não clique nem pague. Motivo: {{motivo}}. Ver detalhes: vaideconfia.com/v/{{id}}" |
| 12 | `verif_resultado_desconfiar` | push/WhatsApp | "Melhor desconfiar" | "{{dominio}}: melhor desconfiar. {{motivo}}. O que fazer agora: …" |
| 13 | `verif_resultado_ok` | push/WhatsApp | "Pode confiar" | "✓ {{dominio}} parece legítimo. Mesmo assim, pague só pelo site oficial." |
| 14 | `verif_pronta` | Push | Análise demorada concluída | "Sua verificação ficou pronta" |
| 15 | `verif_status_mudou` | E-mail + push | Domínio verificado antes virou golpe | "Atenção: a loja {{dominio}} que você verificou em {{data}} agora foi marcada como golpe" |
| 16 | `verif_limite_gratis` | In-app/e-mail | Usou 2 grátis | "Você usou as 2 verificações grátis. Crie conta para continuar e guardar o histórico" |
| 17 | `verif_resumo_semanal` | E-mail | Semanal | "Sua semana: {{n}} links verificados, {{g}} golpes evitados" |
| 18 | `whatsapp_recebido` | WhatsApp (resposta de serviço) | Usuário encaminhou link | "Recebi! Estou verificando {{dominio}}… respondo em segundos." |
| 19 | `whatsapp_print_recebido` | WhatsApp | Usuário mandou print | "Recebi o print. Estou lendo o que está nele…" |

## C. Denúncias e lojas
| # | Nome | Canal | Gatilho | Texto |
|---|---|---|---|---|
| 20 | `denuncia_recebida` | E-mail | denunciar.html | "Recebemos sua denúncia nº {{protocolo}}" + próximos passos (BO, banco, Procon) |
| 21 | `denuncia_analisada` | E-mail + push | Moderação | "Sua denúncia ajudou: {{dominio}} agora é alertado para todos" |
| 22 | `loja_registro_recebido` | E-mail | registrar-loja.html | "Recebemos o cadastro da loja {{nome}} — análise em até {{prazo}}" |
| 23 | `loja_aprovada` | E-mail | Aprovação | "{{nome}} foi verificada. Seu selo e código para o site:" |
| 24 | `loja_reprovada` | E-mail | Reprovação | "Não conseguimos verificar {{nome}}: {{motivo}}. Como corrigir" |
| 25 | `loja_selo_expirando` | E-mail | 30 dias antes | "Seu selo Confia vence em {{data}}" |

## D. Pagamentos / planos (Asaas)
| # | Nome | Canal | Gatilho | Texto |
|---|---|---|---|---|
| 26 | `pag_pix_gerado` | E-mail | Assinatura criada | "Seu Pix de R$ {{valor}} — vale até {{hora}}". QR + copia e cola. **Avisar:** "o recebedor aparece como {{razao_social}}" (anti-golpe) |
| 27 | `pag_confirmado` | E-mail + push + WhatsApp (UTILITY) | Webhook `PAYMENT_RECEIVED` | "Pagamento confirmado. Plano {{plano}} ativo até {{data}}" |
| 28 | `pag_recibo` | E-mail | Pagamento | Recibo/nota com itens, CNPJ e forma de pagamento |
| 29 | `pag_falhou` | E-mail + push | Cartão recusado | "Não conseguimos cobrar seu cartão. Atualize em vaideconfia.com/conta" |
| 30 | `pag_vencendo` | E-mail | 3 dias antes | "Seu plano renova em {{data}}" |
| 31 | `pag_vencido` | E-mail + WhatsApp | Atraso | "Seu plano venceu — histórico mantido por {{dias}} dias" |
| 32 | `plano_cancelado` | E-mail | Cancelamento | "Cancelamento confirmado. Você tem acesso até {{data}}" |
| 33 | `plano_upgrade` | E-mail | Troca de plano | "Bem-vindo ao {{plano}}: o que mudou" |
| 34 | `reembolso` | E-mail | Estorno | "Reembolso de R$ {{valor}} enviado — chega em até {{prazo}}" |

## E. Educação / engajamento (MARKETING, só com opt-in)
| # | Nome | Canal | Texto |
|---|---|---|---|
| 35 | `alerta_golpe_semana` | E-mail/push | "Golpe da semana: {{titulo}} — como reconhecer em 3 sinais" (alimentado pelo feed de notícias) |
| 36 | `dica_mensal` | E-mail | Newsletter com 3 golpes do mês + estatística Febraban/Serasa |
| 37 | `reengajamento_30d` | E-mail | "Faz tempo! Antes de comprar na Black Friday, verifique a loja" |
| 38 | `sazonal_black_friday` / `sazonal_natal` / `sazonal_ir` | E-mail/push | Golpes típicos da data (loja falsa, falso entregador, falsa Receita) |
| 39 | `instale_app` | E-mail/in-app | "Tenha o confia? no celular: instale em 2 toques" (PWA) |
| 40 | `indique_familia` | WhatsApp (share) | Texto pronto: "Antes de clicar em link estranho, cola aqui: vaideconfia.com" |

## F. Admin / interno
| # | Nome | Canal | Gatilho |
|---|---|---|---|
| 41 | `admin_novo_golpe_em_alta` | E-mail/Slack | Mesmo domínio denunciado ≥ N vezes/h |
| 42 | `admin_fila_moderacao` | E-mail diário | Denúncias/lojas pendentes |
| 43 | `admin_erro_motor` | Sentry → e-mail | API externa (Safe Browsing/urlscan) falhando |
| 44 | `admin_pagamento_divergente` | E-mail | Webhook sem assinatura correspondente |

## Exemplo completo (WhatsApp UTILITY) — `verif_resultado_golpe`
```
Cabeçalho: ⚠ Alerta confia?
Corpo: O link {{1}} é golpe.
Motivo: {{2}}
Não clique, não pague e não passe códigos.
Rodapé: O Confia nunca pede senha, código ou Pix.
Botão (URL): Ver detalhes → https://vaideconfia.com/v/{{1}}
```

## Exemplo e-mail (estrutura React Email)
```tsx
<Html lang="pt-BR"><Head/><Preview>{dominio}: é golpe — não clique</Preview>
<Body style={{background:"#f5f8fd",fontFamily:"Inter,Segoe UI,Arial"}}>
 <Container style={{maxWidth:560}}>
  <Section style={{background:"#0b2443",padding:24,borderRadius:"20px 20px 0 0"}}><Img src="https://vaideconfia.com/email/logo.png" width="120" alt="confia?"/></Section>
  <Section style={{background:"#fff",padding:28}}>
   <Heading>⚠ {dominio} é golpe</Heading><Text>{motivo}</Text>
   <Button href={url} style={{background:"#4d9fff",color:"#04101f",padding:"14px 22px",borderRadius:14}}>Ver detalhes</Button>
   <Text style={{fontSize:12,color:"#62738b"}}>O Confia nunca pede senha, código ou Pix por mensagem.</Text>
  </Section></Container></Body></Html>
```
