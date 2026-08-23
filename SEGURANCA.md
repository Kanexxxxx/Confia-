# confia? — Segurança

**Última revisão:** 23/08/2026

---

## Primeiro, a verdade

**Não existe site impenetrável.** O Pentágono já foi invadido. A Sony, a Equifax,
o governo brasileiro. Quem promete "impenetrável" está vendendo, não protegendo.

O que existe é **camada**. Cada tranca que o atacante precisa furar:

- aumenta o custo dele (a maioria desiste e vai no site do lado);
- aumenta o tempo até ele conseguir algo;
- aumenta a chance de você perceber antes do estrago.

E existe uma coisa mais importante que qualquer tranca: **não guardar o que não
precisa**. Dado que não existe no seu banco não vaza. É por isso que aqui não
tem CPF, não tem foto de documento, não tem dado de cartão — não é preguiça, é
a defesa mais barata e mais eficaz que existe.

> A pergunta certa não é "é invadível?" — é sempre sim.
> É: **"o que o invasor consegue, e em quanto tempo eu descubro?"**

---

## O seu exemplo: `/cliente01` → `/cliente02`

Você acertou em cheio. Essa falha tem nome — **IDOR** — e derruba site grande
todo ano. Aqui ela está fechada por **duas** trancas, e as duas são necessárias.

### Tranca 1 — o endereço não é adivinhável

Não existe `/cliente/01`. Todo identificador no confia? é um **UUID**:

```
verificacao/a3f8b2c1-9d4e-4a7f-b012-8e6c4d1f9a30
```

Não existe "o próximo".

**A conta, para dar ideia** (corrigi um número que eu havia exagerado antes):

| | Combinações | Mega-Senas seguidas |
|---|---|---|
| Mega-Sena, uma aposta | 5,0 × 10⁷ | 1 |
| Código público (16 caracteres) | 5,2 × 10²⁷ | **~3,6** |
| UUID interno | 5,3 × 10³⁶ | **~4,8** |

O endereço que aparece na URL usa o código de 16. O UUID continua sendo a chave
interna, e não sai do banco.

### Tranca 2 — mesmo com o endereço, o servidor pergunta de quem é

Esta é a que importa de verdade.

UUID é **segredo**, não é **tranca**. Segredo escapa: num print que a pessoa
manda no grupo, no histórico de um computador de lan house, num link
compartilhado, num log. Se o servidor confiasse só no ID difícil, bastaria o
endereço vazar uma vez.

Por isso, em toda página que mostra dado de alguém, o servidor confere:

```
Este recurso pertence a quem está pedindo AGORA?
```

E quem está pedindo **sai da sessão** — nunca da URL, nunca do formulário.
Aceitar `?conta=123` seria reabrir a porta que a tranca fecha.

Está em `web/src/lib/guarda.ts`, e é obrigatório: página nova que mostre dado
de alguém começa chamando `exigeDono()`.

### E responde "não existe", não "não pode"

Se a resposta fosse *"você não tem permissão"*, ela contaria que aquele ID é
real. Quem estivesse varrendo aprenderia quais IDs existem.

Respondendo **404** nos dois casos, a pessoa não aprende nada.

---

## O seu outro exemplo: `confiia.com.br/admin`

Aqui a resposta tem três partes, e a primeira é a que menos vale:

**1. O endereço não vai ser `/admin`.** Todo robô que varre a internet testa
`/admin`, `/wp-admin`, `/painel`. Usar um caminho previsível é só barulho no
log. Vamos usar algo que não se adivinha.

**Mas isso é o mais fraco das três.** Segurança por obscuridade não é segurança:
o dia em que o endereço aparecer num print, acabou. Só serve para diminuir
ruído.

**2. Achar o endereço não dá nada.** Quem chegar lá sem sessão de admin recebe
**404** — a mesma resposta de qualquer endereço inventado. Não recebe tela de
login, não recebe "acesso negado". Nada que confirme que existe.

**3. A tranca de verdade, que vem na Etapa 5:** sessão válida **+** estar na
tabela `admins` **+** segundo fator no celular **+** sessão que vence em 12h.
Saber a senha não basta.

E toda tentativa de acesso negado fica registrada em `auditoria`. Um pico
dessas linhas é alguém varrendo — e isso a gente precisa **enxergar**.

---

## As camadas, uma a uma

### O servidor

| Ataque | O que impede |
|---|---|
| Chutar senha de SSH | Senha **desligada**. Só chave. |
| Entrar como root | Bloqueado. Entra usuário comum, sobe com sudo. |
| Varrer portas | Firewall: só 22, 80 e 443. Postgres **não aparece** na internet. |
| Insistir | fail2ban: 3 erros = 24h de bloqueio. |
| Falha conhecida do sistema | Correção de segurança automática. |

### O banco

| Ataque | O que impede |
|---|---|
| Injeção de SQL | Toda consulta é parametrizada (Drizzle). Nenhum texto colado. |
| Injeção que passe assim mesmo | O app usa `confia_app`, que **não cria nem apaga tabela**. O estrago vira "mexeram nos dados", não "apagaram o banco". |
| Ler o banco de fora | Escuta só em `localhost`. De fora, só por túnel SSH. |
| Log com dado pessoal | `log_statement='ddl'` — registra estrutura, nunca conteúdo. |

### A senha

| Ataque | O que impede |
|---|---|
| Vazar o banco e ler as senhas | Não existe senha guardada. Só hash **scrypt**, com sal diferente por pessoa. |
| Quebrar o hash com placa de vídeo | scrypt gasta 32 MB por tentativa **de propósito**. Torna caro. |
| Medir o tempo de resposta | Conferência em tempo constante. Conta que não existe demora igual. |
| Chutar senha no site | 5 erros = 15 minutos parado. |
| Usar a senha vazada de outro site | Nada impede — por isso a tela pede senha que você **não use em outro lugar**. |

### A sessão

| Ataque | O que impede |
|---|---|
| Roubar o cookie por script na página | `httpOnly` — JavaScript não enxerga o cookie. |
| Roubar no meio do caminho | `secure` — só trafega por HTTPS (a partir da Etapa 7). |
| Fazer você clicar em algo de outro site | `sameSite=lax` + conferência de origem do Next. |
| Vazar o banco e usar as sessões | Guardamos só o **hash** do token, igual à senha. |
| Continuar dentro depois que você troca a senha | **Todas as sessões caem.** Provado: 3 revogadas, 0 ativas. |
| Sessão eterna | 30 dias para pessoa, **12 horas** para admin. |

### A página

| Ataque | O que impede |
|---|---|
| XSS (injetar script) | React escapa tudo. Zero `dangerouslySetInnerHTML` no projeto. |
| Clickjacking (tela falsa por cima) | `X-Frame-Options: DENY`. |
| Navegador adivinhar tipo de arquivo | `X-Content-Type-Options: nosniff`. |
| Vazar o que você verificou ao sair do site | `Referrer-Policy` restrito. |
| Script de terceiro ligar sua câmera | `Permissions-Policy` nega câmera, microfone, localização. |

### Descobrir quem é cliente

| Ataque | O que impede |
|---|---|
| Testar lista de e-mails no login | "E-mail ou senha errados" — sempre igual. |
| Testar no cadastro | Mesma resposta exista ou não. |
| Testar no "esqueci a senha" | Mesma resposta. |
| Medir o tempo para diferenciar | Tempo constante nos três. |

> Isso importa mais aqui do que em loja: **a lista de quem já foi vítima de
> golpe tem valor para quem aplica golpe.**

---

## O que AINDA NÃO está protegido

Esta lista existe porque esconder buraco não tapa buraco.

| Falta | Risco | Quando |
|---|---|---|
| **HTTPS** | Hoje o beta é HTTP. Senha trafega em claro numa rede aberta. | Etapa 7 |
| **CSP** | Sem ela, um script injetado teria menos barreira. | Etapa 7 |
| **2FA no admin** | Saber a senha do admin hoje basta. | **Etapa 5** |
| **Limite compartilhado** | O contador vive na memória de um servidor. Com dois, o limite real triplica. | Etapa 10 |
| **Backup fora** | Existe cópia local, mas sem automação rodando. | você |
| **DMARC firme** | Está em `p=none`. Dá para falsificar e-mail em nome do confia?. | Etapa 7 |
| **Teste de invasão** | Nada disso foi testado por alguém de fora. | depois da 10 |
| **CNPJ** | Sem empresa, você responde com **CPF e patrimônio pessoal**. | você |

---

## O que fazer se acontecer

Plano curto, para não improvisar no susto:

1. **Cortar** — `sudo ufw deny 80 && sudo ufw deny 443` tira o site do ar.
   Site fora do ar é ruim; site vazando dado é pior.
2. **Trocar tudo** — senhas do banco (`servidor/02-banco.sh` regera), chave do
   Resend, chave SSH.
3. **Derrubar todas as sessões** — `UPDATE sessoes SET revogada_em = now()`.
4. **Olhar a auditoria** — é para isso que ela existe. O que foi acessado, por
   quem, quando.
5. **Avisar** — a LGPD (Art. 48) obriga comunicar a ANPD e as pessoas atingidas
   em prazo razoável. Esconder vazamento multiplica a multa.

---

## Como isso é conferido

- `npm audit` a cada mudança de dependência — hoje: **0 falhas conhecidas**
- Lighthouse a cada tela nova — hoje: **100** em acessibilidade
- Auditoria final na Etapa 10, item por item, com relatório escrito
- Teste de restauração do backup: derrubar e voltar

**Nada aqui é "confie em mim".** Cada linha desta página aponta para um arquivo
do projeto que você pode abrir e ler.
