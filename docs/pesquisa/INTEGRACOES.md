# Integrações e APIs recomendadas — Confia (vaideconfia.com)

> Pesquisa de 04/11/2026. Os links foram verificados com HTTP 200 (`links_verificados.txt`). Taxas são **as de tabela publicadas nos sites** em out–nov/2026 e podem mudar; confira na conta antes de assinar.
> **Cotas free** (VirusTotal, GNews, NewsData, AbuseIPDB, Resend, Brevo) são as que esses serviços divulgam com frequência, mas **não foram relidas hoje**: confirme na página de preços antes de decidir. As taxas de pagamento, essas sim, foram lidas hoje.

## O que o Confia é (lido no site público hoje)
"**confia? — Verifique antes de clicar.**" A pessoa cola um link, um @ de perfil ou um print (loja, jogo/skin, empréstimo, vaga, prêmio, perfil clonado). O servidor abre o link num **ambiente isolado**, segue os redirecionamentos, confere quem registrou o domínio e responde em português: **Pode confiar / Melhor desconfiar / É golpe**. Dá 2 verificações sem conta. Depois disso é preciso criar conta para ter histórico. Tem páginas de Planos (`planos.html`), Denunciar (`denunciar.html`) e Registrar loja (`registrar-loja.html`), além de Instagram @confia.iia. A home cita dados da Serasa e da Febraban e marca com honestidade o que **ainda não cobre** (clonagem de cartão), o que está **em construção** (golpe do Pix) e o que já é verificado.
→ As integrações abaixo foram escolhidas para **(1) melhorar a precisão do veredito**, **(2) cobrar os planos**, **(3) distribuir o produto onde os golpes chegam (WhatsApp)** e **(4) operar com segurança**.

---
## 1. Motor de verificação (prioridade máxima: é o produto)
| Fonte | Para quê | Custo/limite | Link |
|---|---|---|---|
| **Google Safe Browsing v4** | Lista de phishing/malware do Google | Grátis para uso não comercial; uso comercial → Web Risk API (paga) | https://developers.google.com/safe-browsing/v4 |
| **VirusTotal API v3** | Reputação de URL/domínio em ~70 motores | Free: 4 req/min, uso não comercial; comercial = plano pago | https://docs.virustotal.com/reference/overview |
| **urlscan.io API** | Abre a URL em sandbox, screenshot, redirecionamentos, veredito | Free com cota diária; planos pagos | https://urlscan.io/docs/api/ |
| **URLhaus (abuse.ch)** | URLs de distribuição de malware | Grátis | https://urlhaus.abuse.ch/api/ |
| **PhishTank** / **OpenPhish** | Feeds de phishing | Grátis (feed comunitário) | https://phishtank.org · https://openphish.com |
| **RDAP Registro.br** | Data de criação/titular de domínios **.br** ("loja criada semana passada") | Grátis, com rate-limit | https://rdap.registro.br/ |
| **BrasilAPI** | Consulta **CNPJ** da loja (situação na Receita, data de abertura), CEP, bancos | Grátis | https://brasilapi.com.br/docs |
| **AbuseIPDB** | Reputação do IP do servidor do site | Free 1.000 checks/dia | https://www.abuseipdb.com/api.html |
| **ipinfo** | ASN/país/hosting do IP (ex.: loja "brasileira" hospedada fora) | Free tier | https://ipinfo.io/developers |
| **Cloudflare Radar** | Rank/popularidade e categoria do domínio | Grátis com conta CF | https://developers.cloudflare.com/radar/ |

**Recomendação:** pipeline no servidor = RDAP/WHOIS → Safe Browsing → URLhaus/PhishTank (cache local do feed) → urlscan (só se ainda incerto) → CNPJ via BrasilAPI quando a página exibir CNPJ → regra de pontuação → texto em PT. Guardar **cache por domínio** (24 h) para economizar cota. **Atenção às licenças:** Safe Browsing e VirusTotal free proíbem uso comercial; se houver plano pago no Confia, migrar para Web Risk / VT premium.

---
## 2. Pagamentos (aba Planos — "a aba de pagamentos está ruim")
Tarifas de tabela publicadas (fontes: [Asaas](https://www.asaas.com/precos-e-taxas), [Stripe BR](https://stripe.com/br/pricing/local-payment-methods), [Mercado Pago](https://www.mercadopago.com.br/blog/quanto-custa-vender-on-line-com-mercado-pago), comparativo [dardo.studio 17/10/2026](https://dardo.studio/pt/blog/gateway-de-pagamento/)):

| Gateway | Pix | Cartão à vista | Assinatura recorrente (API) | Boleto | Docs |
|---|---|---|---|---|---|
| **Mercado Pago** | 0,99% na hora | 4,99% na hora · 3,99% em 30 dias | Sim (`preapproval`/Assinaturas) | R$ 3,49 | https://www.mercadopago.com.br/developers/pt/docs |
| **Asaas** | R$ 2,15 fixo padrão (promo R$ 1,08 por 3 meses na página hoje) | R$ 0,49 + 2,99% (32 dias) | **Sim, nativa e simples** (`/subscriptions`) + Pix automático | R$ 2,15 | https://docs.asaas.com |
| **Pagar.me (Stone)** | 0,99% (oferta Essencial) | 4,19% em 1 dia | Sim (planos/assinaturas) | não publicado | https://docs.pagar.me |
| **Stripe** | 1,19% — **Pix só por convite** para empresa BR | 3,99% + R$ 0,39 (repasse 30 dias) | Sim, a melhor API (Billing) | R$ 3,45 | https://docs.stripe.com/payments/pix |
| Pix direto no banco (Pix API do BCB via PSP) | normalmente grátis/baixo p/ PJ | — | Pix Automático | — | https://www.bcb.gov.br/estabilidadefinanceira/pix |

**Recomendação única: Asaas** para os planos do Confia. Os motivos:
- O ticket de assinatura é baixo (alguns reais por mês). Pix por % (0,99%) sai mais barato em tickets baixos, mas o Asaas ganha em **recorrência**: assinatura com Pix/cartão/boleto numa só chamada, cobrança automática, notificação do pagador por e-mail/SMS/WhatsApp inclusa, sandbox completo e webhooks claros.
- Cartão R$ 0,49 + 2,99% é a menor taxa de tabela do grupo.
- **Mercado Pago como segunda opção:** é marca conhecida (dá confiança ao usuário), o Pix a 0,99% é imbatível para tickets abaixo de ~R$ 200 e o checkout tem carteira MP.
- **Stripe só se houver venda internacional.** O Pix por convite e o repasse em 30 dias pesam contra.

**Implementação:** a página de planos cria a assinatura no backend (`POST /v3/subscriptions` no Asaas) e o checkout mostra o QR Pix com contagem regressiva e "copia e cola". O webhook `PAYMENT_RECEIVED` libera o plano. Valide sempre o **token do webhook** e use **idempotência**. Nunca confie no retorno do front.

---
## 3. Notícias 24 h ("notícias que rodam 24 horas")
| Fonte | Tipo | Observação | Link |
|---|---|---|---|
| **Google News RSS** (busca "golpe" pt-BR) | RSS grátis | `https://news.google.com/rss/search?q=golpe+pix&hl=pt-BR&gl=BR&ceid=BR:pt-419`; mostrar só título + link + fonte | https://news.google.com/rss?hl=pt-BR&gl=BR&ceid=BR:pt-419 |
| **g1 Tecnologia RSS** | RSS | Exibir título/resumo com link para o g1 | https://g1.globo.com/rss/g1/tecnologia/ |
| **GNews API** | API | Free 100 req/dia, filtro `lang=pt&country=br` | https://gnews.io |
| **NewsData.io** | API | Free 200 créditos/dia, tem Brasil/pt | https://newsdata.io |
| **NewsAPI** | API | Free só em desenvolvimento (não produção) | https://newsapi.org |
| **CERT.br** / **Febraban** / **Serasa** | Fontes oficiais para "Alertas" | Curadoria manual/RSS quando houver | https://cert.br · https://febraban.org.br · https://www.serasaexperian.com.br |

**Recomendação:** um Cron Worker (Cloudflare) a cada 30 min lê o Google News RSS + g1 com a consulta "golpe OR fraude OR phishing OR Pix", deduplica pelo título e grava no KV/D1. A página "Golpes da semana" mostra o feed, e um destaque no app diz: "Novo golpe circulando: …". Respeite direitos: apenas título, fonte e link.

---
## 4. Login social
- **Google (Sign in with Google / One Tap):** https://developers.google.com/identity/gsi/web. É o essencial no Brasil, e o One Tap transforma a 3ª verificação em conta com 1 toque.
- **Apple:** https://developer.apple.com/sign-in-with-apple/. Obrigatório se um dia houver app iOS com login social.
- **Gov.br:** https://www.gov.br/governodigital/pt-br/identidade/conta-gov-br. Selo de confiança forte, mas exige credenciamento de órgão/convênio; vale avaliar só no futuro.
- Camada de auth: **Better Auth** (https://better-auth.com, open-source, roda em Workers), **Supabase Auth** (https://supabase.com/docs/guides/auth) ou **Clerk** (https://clerk.com/docs, pago, mais rápido). Ative **passkeys** (WebAuthn). Num produto anti-golpe, login sem senha é coerente com a marca.

## 5. E-mail transacional
- **Resend** (https://resend.com/docs). Tem ótima DX e templates em **React Email** (https://react.email); free de 3.000/mês.
- **Brevo** (https://www.brevo.com/pt/). Empresa europeia com suporte em PT, free de 300/dia, faz SMS também.
- Obrigatório: domínio próprio `mail.vaideconfia.com` com **SPF, DKIM e DMARC (p=quarantine → reject)**. Num site anti-golpe, e-mail sem DMARC é risco de alguém se passar pelo Confia. Veja os templates em `TEMPLATES.md`.

## 6. WhatsApp ("o golpe chega pelo WhatsApp")
- **WhatsApp Cloud API (Meta):** https://developers.facebook.com/docs/whatsapp/cloud-api.
- **Feature-chave: o "Confia no WhatsApp".** O usuário **encaminha** o link ou print suspeito para o número do Confia e recebe o veredito na conversa. Mensagens iniciadas pelo usuário abrem a janela de 24 h de *service conversation*, e o preço por mensagem segue a tabela da Meta para o Brasil (conferir na doc antes).
- Templates (alerta, código de login) ficam em `TEMPLATES.md`. O mesmo know-how da Nexakeep (webhook assinado, templates aprovados) se reaproveita aqui.

## 7. Push / SMS
- **Web Push nativo** (https://developer.mozilla.org/en-US/docs/Web/API/Push_API) no PWA. Funciona no iOS 16.4+ quando o app está instalado na tela inicial. Alternativas: **OneSignal** (https://onesignal.com) e **FCM** (https://firebase.google.com/docs/cloud-messaging).
- **SMS:** Zenvia (https://www.zenvia.com, BR) ou Twilio (https://www.twilio.com/docs/sms). Use só para OTP/alerta crítico, porque golpista também manda SMS e o usuário desconfia.

## 8. Anti-bot
- **Cloudflare Turnstile** (https://developers.cloudflare.com/turnstile/). É grátis e invisível. Proteja: as 2 verificações anônimas (senão viram API grátis para bots), cadastro, login, denúncia e registro de loja. Valide o token no servidor (`siteverify`).
- Some a isso o **rate limit** por IP/conta no Worker e o WAF da Cloudflare. Alternativa: hCaptcha (https://docs.hcaptcha.com).

## 9. PWA instalável ("baixar pelo celular")
- Guia: https://web.dev/learn/pwa · gerador/empacotador: **PWABuilder** (https://www.pwabuilder.com). O PWABuilder gera também **pacote para Google Play (TWA)**, e assim o Confia fica "na loja" sem app nativo.
- O que precisa: `manifest.webmanifest` (nome, ícones 192/512 maskable, `display: standalone`, `theme_color #0b2443`), service worker (cache do shell; nunca dos resultados), botão de instalar (`beforeinstallprompt`) e instrução para iOS.
- **Diferencial:** `share_target` no manifesto. No Android, o Confia aparece no menu **Compartilhar** do WhatsApp/Instagram, e o link suspeito vai direto para verificação (detalhes em TRANSICOES.md #97).

## 10. Analytics e monitoramento
- **Cloudflare Web Analytics** (https://developers.cloudflare.com/web-analytics/). Grátis, sem cookie e sem banner LGPD. **Recomendado** para o público.
- **PostHog** (https://posthog.com/docs). Funis (colou link → verificou → criou conta → assinou), feature flags e session replay (https://posthog.com/docs/session-replay). **Mascare inputs**, porque links podem conter dados pessoais. Alternativa simples: Plausible (https://plausible.io).
- **Sentry** (https://docs.sentry.io/platforms/javascript/). Erros de front e de Worker, com source maps e alertas.

## 11. Parcerias sugeridas (não técnicas)
- **Febraban / Observatório**, **Serasa**: já são citados como fonte. Buscar parceria de conteúdo ou selo.
- **Procons estaduais, delegacias de crimes cibernéticos e SaferNet**: botão "Denunciar oficialmente" após um veredito "É golpe".
- **ANPD/LGPD** (https://www.gov.br/anpd/pt-br): o site processa prints e links que podem ter dados pessoais. Precisa de política de privacidade clara, retenção curta e DPO.
- **Lojas legítimas:** o "Registrar loja" pode virar **selo "Verificado pelo Confia"** com widget embutível. É uma fonte de receita B2B.

## Prioridade sugerida
1. Turnstile e rate limit (sem isso, as 2 verificações grátis serão abusadas)
2. Motor: RDAP, Safe Browsing, URLhaus e BrasilAPI CNPJ
3. Asaas nos Planos
4. PWA com Share Target
5. E-mail Resend com DMARC
6. WhatsApp "encaminhe o link"
7. Notícias 24 h
8. PostHog e Sentry
