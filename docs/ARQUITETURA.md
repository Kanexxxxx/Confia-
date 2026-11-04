# Arquitetura do Confia

Documento de auditoria. Descreve o que o repositório é hoje e uma
organização de pastas que acompanha o produto que ele pretende ser.
Nenhum diretório foi movido nesta rodada.

O produto é um verificador brasileiro de golpe: a pessoa chega com
um link, um CNPJ, um telefone ou um print e o site responde se aquilo
tem cara de golpe, com o motivo de cada conclusão. O código que sobe
é o de `web/`. O desenho anterior está em `prototipo/`. O servidor
está em `servidor/`.

Há dois endereços que não são a mesma coisa:

| Endereço | O que responde hoje |
|---|---|
| `vaideconfia.com` | HTML estático do protótipo, atrás da Cloudflare. Sem conta, sem banco, sem API. |
| `beta.confiia.com.br` | Alvo do Next.js, segundo `servidor/03-publica.sh`. O domínio raiz `confiia.com.br` é de outra pessoa e o script recusa publicá-lo. |
| `confiia.com.br` | Fora deste repositório. Não mexer. |

---

## Stack

| Camada | Escolha |
|---|---|
| Interface | Next.js 16.3.2 (App Router, `proxy.ts` no lugar de `middleware.ts`), React 19, TypeScript |
| Estilo | CSS próprio em `web/src/app/globals.css`. Fontes Inter e Poppins via `next/font`. Ícones `bootstrap-icons` empacotados, sem CDN |
| Validação | Zod 4 nas variáveis de ambiente. Formulários conferidos de novo no servidor |
| Banco | PostgreSQL 16, Drizzle ORM, driver `postgres`. Migrações em SQL comentado, não no Drizzle Kit |
| Sessão | Cookie `confia_sessao` httpOnly, valor aleatório; no banco só o SHA-256. Sem JWT |
| Senha | scrypt do Node, sal por conta |
| Segundo fator | TOTP (`otpauth`) + códigos de reserva. Segredo novo vai cifrado (AES-256-GCM) por `COFRE_CHAVE` |
| E-mail | Resend, só se `RESEND_API_KEY` existir. Remetente padrão `naoresponda@confiia.com.br` |
| Pagamento | Cliente HTTP do Asaas em `web/src/lib/asaas.ts`. Nenhuma rota do site o chama |
| Antirrobô dos formulários públicos | Campo isca + carimbo HMAC. Sem captcha de terceiro |
| Limite de tentativa | Memória do processo, por IP e por alvo |
| Deploy previsto | VPS, nginx, systemd, Certbot. Scripts `servidor/01-blindagem.sh`, `02-banco.sh`, `03-publica.sh` |

Não há suíte de teste de framework (Jest, Vitest, Playwright). As provas
automáticas são scripts: `prova-armadilha`, `confere-banco`, `confere-css`,
`confere-icones`, `confere-paginas`.

---

## Estrutura atual

```
/
├── PLANO.md, SEGURANCA.md, ASAAS.md, MELHORIAS.md, PENDENCIAS.md
├── PLANO-EMPREENDEDOR/          entrega do SENAC, não é o runtime
├── prototipo/                   HTML estático de referência
│   ├── index.html, planos.html, denunciar.html, …
│   └── admin.html               bancada de operação, ainda desligada do Next
├── servidor/
│   ├── 01-blindagem.sh
│   ├── 02-banco.sh              Postgres, dois papéis, backup
│   ├── 03-publica.sh            nginx + TLS só para beta.confiia.com.br
│   └── db/001_schema.sql … 019_noticias_de_golpe.sql
└── web/
    ├── src/app/                 rotas
    ├── src/components/          cabeçalho, verificador, vidro, menus
    ├── src/lib/                 sessão, senha, e-mail, Asaas, guarda
    ├── src/db/                  schema.ts gerado; não editar à mão
    ├── src/proxy.ts             CSP com nonce, HSTS em produção
    ├── public/assets/           logo e o painel de acessibilidade
    └── scripts/                 conta de teste, provas, Asaas, notícias
```

### Rotas do Next

Públicas, com cabeçalho e rodapé:

| Rota | Função hoje |
|---|---|
| `/` | Home e verificador. O botão Verificar explica que o motor ainda não existe |
| `/noticias` | Manchetes em `noticias_golpe` (pode abrir vazia) e órgãos oficiais |
| `/planos` | Quatro planos. O botão do cartão diz "Assinar"; o diálogo manda criar conta |
| `/registrar-loja` | Cadastro que nasce `em_analise`. Sem upload |
| `/denunciar` | Denúncia sem conta obrigatória. Sem upload no servidor |
| `/resultado` | Demonstração com faixa de aviso. Fora do índice |
| `/termos`, `/privacidade`, `/cookies`, `/reembolso` | Textos portados de `src/app/_portado/` |

Conta:

| Rota | Função hoje |
|---|---|
| `/entrar`, `/entrar/codigo` | Senha e, se houver, TOTP |
| `/criar-conta` | Pessoa física ou jurídica. CNPJ só no segundo caso |
| `/esqueci-senha`, `/nova-senha` | Recuperação. A primeira é página estática |
| `/confirmar`, `/api/confirmar` | O link do e-mail confirma e já abre sessão |
| `/conta` | Visão geral |
| `/conta/perfil` | Nome, apelido, figura. Sem foto |
| `/conta/seguranca` | 2FA |
| `/conta/aparelhos` | Sessões revogáveis |
| `/conta/plano` | Plano grátis e o aviso de que o contador não existe |
| `/conta/privacidade` | Direitos da LGPD como texto e mailto. Sem exportação automática |

Administração:

| Rota | Função hoje |
|---|---|
| `/admin`, `/painel` | 404 de propósito |
| `/<PAINEL_CAMINHO>/painel` | Porta. Exige sessão, linha em `admins` e 2FA conferido no banco. O miolo é um texto dizendo que as telas vêm na etapa 10 |

Não existe `not-found.tsx`. O 404 é o padrão do Next, em inglês.
Não existe `robots.txt`, `sitemap.xml` nem manifesto de PWA. O
`metadata` global pede `noindex`.

### API

Uma rota HTTP: `GET /api/confirmar`. O resto são Server Actions:

| Arquivo | Ações |
|---|---|
| `src/lib/acoes-conta.ts` | criar conta, entrar, sair, confirmar e-mail, esqueci, nova senha |
| `src/lib/acoes-perfil.ts` | salvar perfil |
| `src/lib/acoes-seguranca.ts` | ligar e desligar 2FA, códigos de reserva, código no login |
| `src/lib/acoes-denuncia.ts` | gravar denúncia |
| `src/lib/acoes-loja.ts` | gravar loja e domínios |

Não há rota de verificação, de upload, de webhook do Asaas, de
exportação LGPD nem de saúde (`/saude`).

### Banco

Dezenove migrações. No Postgres 16 local desta auditoria elas
aplicaram e deixaram 44 tabelas. O papel `confia_app` alcança 15
objetos, não a base inteira. RLS está ligada em todas; `auditoria`
não tem política para o app e só recebe linha pela função
`registra()`, que roda como dono.

Tabelas que o site realmente grava hoje: `contas`, `sessoes`,
`tokens`, `emails`, `codigos_reserva`, `denuncias`, `empresas`,
`empresa_dominios`, leitura de `admins` e de `noticias_golpe`.

O esquema também tem `verificacoes`, `assinaturas`, `pagamentos`,
`tickets`, `ticket_mensagens`, `membros`, `api_chaves`,
`monitoramentos`, `webhooks`. Nenhuma tela do Next usa essas tabelas
ainda. `exigeDono()` em `guarda.ts` foi escrita para elas e nenhuma
rota a chama.

Dois papéis: `confia_dono` migra e promove admin; `confia_app` atende
o site. A senha de cada um fica fora do Git (`web/.env.local` e
`/etc/confia/banco.env`).

### E-mail

`src/lib/email.ts` enfileira em `emails` e envia pelo Resend quando a
chave existe. Sem chave, a função avisa e segue. Fluxos previstos:
confirmar e-mail, esqueci a senha, senha trocada, boas-vindas.
Não há fila worker separada no repositório além do envio na hora da ação.

### Pagamento

Ver a seção correspondente em `docs/AUDITORIA.md`. Resumo: tabela
`planos` semeada, tabela `pagamentos` com `asaas_id`, cliente
`chamaAsaas()`, scripts `asaas-chave`, `prova-asaas` e `asaas-teste`.
Nenhum botão do site cria cobrança.

### Deploy

`03-publica.sh` sobe Node na porta 3000, nginx com TLS, cabeçalhos
`X-Real-IP` e `X-Forwarded-For` (`$proxy_add_x_forwarded_for`), e
recusa o domínio raiz. O serviço roda como o usuário `confia`.
O arquivo de ambiente de produção fica em `/etc/confia/`, modo 600.

O que está no ar em `vaideconfia.com` não passa por esse script.
É o protótipo, com `planos.html` reescrito para `/planos` e com
`admin.html` publicado em `/admin`.

---

## Estrutura recomendada

A árvore atual é legível. O que falta é separar o que já é produto
do que ainda é promessa, e dar um lugar óbvio para pagamento,
verificação e o painel. Sugestão, sem mover nada até uma rodada
que tenha teste em volta:

```
web/src/
├── app/
│   ├── (site)/                 home, notícias, planos, denúncia, loja, resultado, legais
│   ├── (auth)/                 entrar, criar-conta, senha, confirmar
│   ├── (conta)/conta/          painel da pessoa
│   ├── (admin)/[chave]/painel/ porta e, depois, fila, contas, empresas, custos
│   ├── api/
│   │   ├── confirmar/
│   │   ├── asaas/webhook/      ainda não existe
│   │   └── saude/              ainda não existe
│   ├── not-found.tsx
│   ├── robots.ts               noindex enquanto for beta
│   └── manifest.ts             quando a PWA entrar
├── components/                 o que é desenho, sem regra de negócio
├── lib/
│   ├── auth/                   sessão, senha, 2FA, guarda, limite
│   ├── pagamentos/             Asaas, assinatura, webhook, idempotência
│   ├── verificacao/            motor da etapa 8, quando existir
│   └── email.ts
├── db/                         continua gerado
└── proxy.ts

web/tests/                      o que hoje está só em scripts/
prototipo/                      permanece como referência, fora do host público
```

Regras que a estrutura nova precisa continuar carregando, porque já
custaram incidente:

- Segredo não vai para componente de cliente. `server-only` fica.
- Dono do dado sai da sessão, nunca da URL. `exigeDono()` passa a ser chamada de verdade quando a tela de verificação existir.
- Migração aplicada não se edita. Tabela nova nasce sem `GRANT`; o direito é escrito na mesma migração, com o motivo.
- Botão de plano não diz "Assinar" enquanto `chamaAsaas` não for chamado por uma rota.
- O domínio raiz `confiia.com.br` continua fora de `03-publica.sh`.
