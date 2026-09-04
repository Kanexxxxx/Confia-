# confia? — o guia único para retomar

**Escrito em 04/09/2026**, no dia em que a dona do projeto avisou que ia formatar
o computador.

Se você é uma conversa nova: **leia este arquivo inteiro antes de tocar em
qualquer coisa.** Ele existe para você não precisar reconstruir o contexto
perguntando — está tudo aqui, e o que não está, está apontado.

---

# 🔴 PARTE 0 — O QUE MORRE NO FORMAT

**Leia isto antes de formatar. Nada aqui tem segunda via automática.**

O código está seguro: tudo commitado e empurrado para o GitHub. **O que não está
no Git é o que se perde**, e três coisas dessas são graves.

## 1. `web/.env.local` — o arquivo mais perigoso de perder

Ele está no `.gitignore` de propósito (chave em repositório é chave publicada).
Tem **dez variáveis**, e uma delas não tem conserto:

| Variável | Se perder |
|---|---|
| **`COFRE_CHAVE`** | ☠️ **IRREVERSÍVEL.** É a chave que decifra o segredo do 2FA de cada pessoa. Sem ela, **toda conta com 2FA fica trancada por fora** — nem você entra. Não é senha que se compare: é o segredo em si. Hoje são 2 contas; depois de haver usuário real, não tem mais volta. |
| `ASAAS_API_KEY` | Chave de **produção**, mexe com dinheiro real. Dá para regerar no painel do Asaas, mas a antiga continua valendo até você revogar. |
| `DATABASE_URL` e `DATABASE_URL_MIGRACAO` | Senhas do Postgres. Recuperáveis: `servidor/02-banco.sh` regera. |
| `PAINEL_CAMINHO` | O endereço secreto do painel admin. Recuperável (é só gerar outro), mas aí muda o endereço. |
| `RESEND_API_KEY` | Recuperável no painel do Resend. |
| `APP_URL`, `NODE_ENV`, `EMAIL_REMETENTE`, `EMAIL_RESPOSTA` | Sem segredo, fáceis de reescrever. |

**O que fazer agora:**

```
1. Abra web/.env.local
2. Copie o arquivo INTEIRO para um gerenciador de senhas
   (Bitwarden, 1Password, o cofre do navegador)
3. A COFRE_CHAVE tem que ter uma SEGUNDA cópia em outro lugar —
   papel guardado em casa serve. OneDrive sozinho não serve:
   se a conta cair, cai junto.
```

⚠ **Não cole essas chaves numa conversa de chat.** Nem comigo. Conversa vira
texto guardado em servidor que não é seu, e não desapaga.

## 2. `~/.ssh/` — a chave da VPS

Fora do repositório, some no format. Sem ela **você perde o acesso ao servidor**:

- `~/.ssh/confia_deploy_ed25519` (+ `.pub`) — a chave em si
- `~/.ssh/config` — o apelido `confia-vps` e o **IP da VPS**, que de propósito não
  está escrito em lugar nenhum do repositório

O `npm run tunel` depende desse apelido. Sem ele, nada de banco.

**Copie a pasta `~/.ssh` inteira para o pen drive / gerenciador de senhas.**

Se perder mesmo assim, dá para recuperar pelo painel da Hostinger (console de
recuperação), mas é trabalho e susto.

## 3. `backups/` e `.claude/`

- `backups/` — cópias locais do banco. O servidor tem as dele (diárias, 14 dias),
  então não é fatal, mas é a sua única cópia **fora** da VPS.
- `.claude/` — configurações locais do Claude Code. Perda pequena.

## 4. Antes de formatar, confira que está tudo empurrado

```bash
cd CONFIA
git status              # tem que estar limpo
git log origin/main..HEAD --oneline   # tem que sair vazio
```

---

# PARTE 1 — COMO VOLTAR A RODAR NO PC NOVO

```bash
# 1. Instalar: Node 20+, Git, e o cliente SSH do Windows
# 2. Baixar o projeto
git clone https://github.com/Kanexxxxx/Confia-.git CONFIA
cd CONFIA/web
npm install

# 3. Devolver os segredos
#    - recrie web/.env.local com as 10 variáveis que você guardou
#    - recoloque ~/.ssh/config e ~/.ssh/confia_deploy_ed25519
#    - no Linux/Git Bash: chmod 600 ~/.ssh/confia_deploy_ed25519

# 4. Conferir que o servidor responde
ssh confia-vps 'echo ok'

# 5. Rodar
npm run tunel     # terminal 1 — túnel do Postgres na porta 5433, fica aberto
npm run dev       # terminal 2 — http://localhost:3000
```

**Conta de teste** (já existe no banco de desenvolvimento):

```
e-mail : voce@confiia.com.br
senha  : testando-o-confia-2026
2FA    : desligado  ← mantenha assim; é o que a documentação promete
```

⚠ `ECONNREFUSED 127.0.0.1:5433` = o túnel caiu. Reabra.

---

# PARTE 2 — O QUE É O PROJETO, EM CINCO LINHAS

**confia?** é um serviço brasileiro de verificação antigolpe. A pessoa chega com
um link, um @, um CNPJ ou um print, e o site responde se aquilo tem cara de
golpe — **com o motivo de cada conclusão**, para ela poder discordar.

Vai ser apresentado no **Plano Empreenda SENAC**. Não é projeto de estudo: é para
ir ao ar e ter gente usando.

O endereço é **`beta.confiia.com.br`**. A raiz `confiia.com.br` **é de outra
pessoa** — ver a Parte 6.

---

# PARTE 3 — ONDE CADA COISA ESTÁ ESCRITA

Este arquivo é o mapa. Os detalhes estão nos outros:

| Arquivo | Para quê |
|---|---|
| **`RETOMAR-TUDO.md`** | **Você está aqui.** O guia único. |
| `CLAUDE.md` | As regras que não se discutem e as armadilhas técnicas. Leitura obrigatória. |
| **`MELHORIAS.md` § II** | **A LISTA VIVA do código.** Onze etapas ditadas pela dona do projeto, o que está feito e o que falta. |
| `PLANO.md` | As 10 etapas do projeto. Estamos na 6, com pedaços da 9 prontos. |
| `PENDENCIAS.md` | O que depende só dela: MEI/CNPJ, advogado, DPAs, chaves. |
| `SEGURANCA.md` | As 20 travas e como conferir cada uma. |
| `ASAAS.md` | O pagamento: chave, sandbox × produção, taxas, o que já foi provado. |
| **`PLANO-EMPREENDEDOR/AGORA.md`** | **A entrega do SENAC. PRAZO: 09/09/2026, 21h.** |
| `PLANO-EMPREENDEDOR/RETOMAR.md` | O prompt específico para retomar só a parte do SENAC. |
| `web/AGENTS.md` | Regras do Next.js 16 (escrito pelo próprio `next dev`). |
| `web/CSS-ARMADILHAS.md` | Os defeitos de CSS que já custaram horas. |

---

# PARTE 4 — O QUE ESTÁ PRONTO

## O servidor e o banco (Etapas 1 a 3 — fechadas)

- VPS blindada: SSH só por chave, root bloqueado, firewall (22/80/443), fail2ban,
  swap de 2 GB. **48 GB de disco, 40 GB livres, 3,9 GB de RAM, 1 núcleo.**
- PostgreSQL 16, **44 tabelas**, **19 migrações** aplicadas (`servidor/db/`).
- **Dois usuários**: `confia_dono` (migra) e `confia_app` (só lê e grava linha).
  A aplicação alcança **15 objetos**, não 44.
- RLS ligada nas 44 tabelas. `auditoria` é invisível para a aplicação.
- Backup diário às 3:30, 14 dias. ⚠ **Falta cópia fora da VPS.**
- Banco de desenvolvimento separado (`confia_dev`).

## Conta, login e segundo fator (Etapas 4 e 5 — fechadas)

- Cadastro, login, recuperação de senha, confirmação por e-mail (Resend).
- Senha em **scrypt**, sal por pessoa, conferência em **tempo constante**.
- Sessão no banco (revogável), não JWT. 30 dias para pessoa, **12h para admin**.
- **2FA TOTP** com QR e dez códigos de reserva. Admin sem 2FA **o banco recusa**.
- Painel admin atrás de caminho secreto + sessão + tabela `admins` + 2FA.
  Quem chega sem isso recebe **404**, não tela de login.

## As páginas (Etapa 6 — quase fechada)

23 rotas no ar em desenvolvimento:

```
/  /noticias  /planos  /registrar-loja  /denunciar  /resultado
/entrar  /entrar/codigo  /criar-conta  /esqueci-senha  /nova-senha  /confirmar
/conta  /conta/perfil  /conta/seguranca  /conta/aparelhos  /conta/plano  /conta/privacidade
/termos  /privacidade  /reembolso  /cookies  /[chave]/painel
```

**Zero requisição externa no navegador** — fonte e ícones saem do nosso servidor.
Era problema de LGPD: o IP de cada visitante ia para o Google.

**Lighthouse 100 em acessibilidade**, computador e celular.

## O que a rodada de 27/08 entregou (MELHORIAS.md § II)

| Etapa | O que ficou pronto |
|---|---|
| 1 | A nuvem da home caiu de 10 para **6 situações** — as quatro que saíram prometiam o que o verificador não faz |
| 2 | **O @ agora pergunta de qual rede é.** Link colado não pergunta (o endereço já responde). "Resposta em português" virou "Você vê por que, não só o quê" |
| 3 | Seção "O tamanho do problema" **removida inteira**, com o contador e o CSS morto (172 linhas). Os dossiês com porcentagem saíram; a seção virou "O que a gente reconhece" |
| 4 | **10 golpes com "saber mais"**, cada um com como funciona, o que entrega e **fonte oficial conferida abrindo o link**. 8 dos 10 têm o botão — skins e ingressos ficaram sem porque não achei fonte pública viva |
| 5 | Saiu a ressalva de beta e o "Feito no interior de SP". Entrou a 5ª promessa: **"Ser novo não é ser golpe"** |
| 6A | "Como funciona" saiu do menu; entrou **`/noticias`**, puxada de feed público |
| 6B | Ícones dos níveis refeitos, `.escada` duplicada apagada, **selo reescrito**, e a regra do selo passou de 3 para **5 denúncias confirmadas** |
| 7 | Tela de obrigado com o "o que acontece agora"; lateral enxugada para **um bloco**; "quem lê é uma pessoa, não um robô" |
| 8 | **Bug do 2FA consertado** (ver abaixo) |

## Três defeitos sérios achados e consertados nessa rodada

**1. O selo caía com denúncia que ninguém tinha olhado.** O gatilho contava
`status <> 'recusada'`, e `nova`/`em_analise` contavam. **Três denúncias sem
análise derrubavam o selo de uma loja honesta** — bastava um concorrente. A
página prometia "confirmadas"; o banco fazia outra coisa. Migração `018`
conserta, e o gatilho passou a rodar também no `UPDATE` (nenhuma denúncia nasce
confirmada).

**2. O aviso de 2FA não sumia depois de ligar.** O banco gravava certo e as telas
já eram `force-dynamic` — mas **`force-dynamic` manda no servidor**, e o cache do
roteador no navegador servia a versão velha. Faltava `revalidatePath` nas ações
de segurança (o `acoes-perfil.ts` já fazia isso desde sempre). Consertado no
ligar, no desligar, no login por 2FA e nos códigos de reserva.

**3. A declaração "represento esta empresa" não travava o envio.** O servidor
recusava, mas o navegador deixava enviar e a pessoa só descobria depois da
viagem. E a declaração se disfarçava de chip de opção. Agora é bloco próprio e
trava no clique. Junto: o cadastro de loja passou a **gravar o IP** na auditoria
— era a única ação do projeto que não gravava.

## O pagamento (Etapa 9 — começada)

**Provado com dinheiro de verdade em 27/08/2026:**

- Chave de **produção** guardada sem passar por chat (`npm run asaas-chave`,
  teclado mudo).
- **Pix funciona de ponta a ponta**: cobrança criada → QR gerado → paga de
  verdade (R$ 5,00) → detectada por consulta. Sem webhook.
- Isso **destrava a Etapa 9 antes da Etapa 7**: dá para construir a cobrança
  inteira consultando o Asaas, e o webhook entra no fim como troca de peça.

**Duas descobertas que mudam o negócio:**

- **Piso de R$ 5,00 por cobrança.** Cobrança avulsa barata não existe nessa
  plataforma.
- **A taxa de R$ 1,99 é FIXA, não percentual.** O Básico mensal perde **15,4%**
  ao ano; o anual perde 2%. Empurrar o anual deixa de ser desconto e vira
  margem.

---

# PARTE 5 — O QUE FALTA

## No código (MELHORIAS.md § II tem o detalhe)

| Etapa | Falta | Trava em |
|---|---|---|
| 4 | Mais golpes além dos dez | — |
| 6B | **Avaliações públicas de loja, com comentário.** A maior obra das onze | advogado (difamação) |
| 7 | **Anexar provas** na denúncia | decisão de tamanho/prazo |
| 8 | Visão geral completa, **avatares refeitos**, `/conta/privacidade` sem `mailto:`, migrar conta física → CNPJ | — |
| 9 | **Refazer o desenho dos e-mails** | SPF/DKIM/DMARC |
| 10 | Planos resumidos, **chat ao vivo**, consertar o painel de acessibilidade | quem atende o chat |
| 11 | **Documentos legais**: cortar, tirar o nome dela dos Termos | CNPJ + advogado |
| — | Painel do admin completo (Etapa 10 do PLANO) | — |
| — | Histórico de consultas | depende do motor (Etapa 8) |

## As decisões que travam trabalho

Estão na tabela "O que trava" no fim do `MELHORIAS.md`. As que continuam abertas:

1. **Provas na denúncia** — a VPS tem 40 GB livres. 5 arquivos × 100 MB = 500 MB
   por denúncia → **o disco enche em ~80 denúncias**, e disco cheio derruba site
   e banco. **Recomendação: 3 arquivos × 20 MB** (~660 denúncias). Falta decidir
   também **por quanto tempo guardar** e **quem apaga** — a Política de
   Privacidade promete apagar a imagem quando a análise termina.
2. **Chat ao vivo** — quem responde, em que horário, e o que aparece fora dele.
   Prometer "30 minutos" sem alguém do outro lado é promessa vazia.
3. **Painel de acessibilidade** — ela disse que "tem coisas que não funcionam".
   Falta saber quais, ou testar os seis controles um por um.
4. **Os segredos que eu vazei num `diff`** em 27/08 — `COFRE_CHAVE`, senhas do
   Postgres e chave do Resend saíram numa conversa. Trocar a `COFRE_CHAVE` só é
   barato **enquanto não houver usuário real**.

## O que depende só dela (PENDENCIAS.md)

- **CNPJ / MEI** — sem empresa, ela responde com CPF e patrimônio pessoal, e o
  nome dela não sai dos Termos.
- **Advogado** nos três documentos legais.
- **DPA da OpenAI e da Hive** — obrigatório pela LGPD antes do primeiro usuário.
- **Cópia do backup fora da VPS.**
- **SPF, DKIM, DMARC** — sem isso o e-mail cai em spam por mais bonito que seja.

---

# PARTE 6 — AS REGRAS QUE NÃO SE DISCUTEM

Estas estão no `CLAUDE.md` e valem sempre. Repetidas aqui porque quebrar
qualquer uma custa caro:

1. **`confiia.com.br` sem `beta.` é de outra pessoa** — um amigo dela. Não se
   apaga nada, nem no servidor nem no registro `A`. O nosso é
   **`beta.confiia.com.br`**. O `servidor/03-publica.sh` **recusa rodar** com a
   raiz; esse `exit 1` está lá de propósito.
2. **Subir o site é a ÚLTIMA coisa.** Não faça deploy por iniciativa própria.
3. **Segurança nível Pentágono.** Mexeu em banco, permissão, autenticação ou
   formulário público? Rode `npm run confere-banco` **e** `npm run
   prova-armadilha` antes de dizer que terminou.
4. **Celular sempre**, em toda tela. Não é etapa final.
5. **Não pode ter cara de IA.** Genérico, tudo centralizado, caixinha igual
   atrás de caixinha igual, texto de marketing vazio — tudo já foi recusado.
6. **Comentário em português explicando o PORQUÊ**, e principalmente o *"se você
   mexer aqui, tem que mexer ali também"*.
7. **Não troque a fonte sem perguntar.** Hoje: Inter + Poppins.
8. **Sem upload de foto de perfil.** (Refazer os desenhos dos avatares **é**
   pedido dela — é outra coisa.)
9. **Textura de fundo foi testada e recusada.**

---

# PARTE 7 — AS ARMADILHAS QUE JÁ CUSTARAM TEMPO

- **Next.js 16 usa `proxy.ts`, não `middleware.ts`.** É onde moram os cabeçalhos
  de segurança e a CSP. Leia `node_modules/next/dist/docs/` antes de escrever
  código de framework.
- **`force-dynamic` manda no servidor, não no navegador.** Ação que muda algo do
  menu ou da lateral precisa de **`revalidatePath`**. Não dá erro quando falta —
  a tela só fica velha, que é pior de achar.
- **`CREATE OR REPLACE FUNCTION` apaga o `SECURITY DEFINER` e o `search_path`.**
  Gatilho sem `search_path` fixo é escalada de privilégio. Quem pega é o
  `npm run confere-banco`.
- **lightningcss mantém a ÚLTIMA de um par prefixado/sem prefixo.** Regra:
  **prefixada primeiro, padrão por último**, senão o `backdrop-filter` some.
- **Classe CSS definida duas vezes se soma em silêncio.** Já aconteceu com
  `.eyebrow` e com `.escada`. **Procure a classe antes de escrever CSS novo.**
- **Cor errada de paleta.** `--ink*` para o que vive dentro de `.folha` (cartão
  branco); `--on-dark*` para o que vive direto na página (escura). Errar dá
  texto branco em fundo branco, que passa em todos os testes.
- **`text-align` desce por herança.** O desalinhamento geral era um
  `.topo{text-align:center}` escorrendo até dentro dos cartões.
- **Cabeçalho HTTP é ByteString** — só ASCII. Um travessão no `User-Agent`
  derrubou os quatro feeds de notícia.
- **Não assine nada no navegador.** `armadilha.ts` tem `import 'server-only'`
  para o build quebrar se alguém repetir o erro.
- **Heredoc de Python destrói `\n` dentro de template literal de JS.**
- **Olhe a tela ampliada.** Dois diagnósticos já saíram errados por leitura de
  screenshot reduzido.

---

# PARTE 8 — OS COMANDOS

```bash
cd web

# rodar
npm run tunel            # túnel do Postgres (5433) — deixe aberto
npm run dev              # localhost:3000 e 192.168.1.100:3000

# conferir (rode SEMPRE antes de dizer que terminou)
npm run confere          # CSS órfão, ícone inexistente, tipos, lint
npm run confere-banco    # RLS, alcance, auditoria, gatilhos
npm run prova-armadilha  # a trava anti-robô, 9 casos

# banco
npm run db:puxar         # regera os tipos a partir do banco
npm run db:estudio       # navegador do banco

# ferramentas
npm run admin            # conceder/remover admin
npm run conta-teste      # prepara conta com senha conhecida
npm run cifra-segredos -- --conferir
npm run noticias         # puxa notícias de golpe dos feeds públicos
npm run noticias -- --seco    # mostra o que acharia, sem gravar

# pagamento
npm run asaas-chave      # guarda a chave (teclado mudo)
npm run prova-asaas      # a chave funciona? (só lê)
npm run asaas-teste -- --quem
npm run asaas-teste -- --situacao
```

---

# PARTE 9 — ⏰ O SENAC, QUE TEM PRAZO

**Entrega: 09/09/2026, às 21h.** Hoje é 04/09. **Faltam 5 dias.**

Isto **não é código** — e é o único prazo com data marcada no projeto inteiro.

O detalhe está em **`PLANO-EMPREENDEDOR/AGORA.md`**. O resumo:

- **Seis das dez seções do Portfólio já estão escritas.** A logomarca e as cores
  já existem.
- **O que falta é quase tudo trabalho dela, não meu:** publicar e espalhar o
  formulário, 15 conversas em profundidade, 8 testes do produto observando,
  prints de golpe, e gravar um vídeo de 55s.
- **O diagnóstico honesto que está escrito lá:** o projeto tem muita prova de
  execução e **nenhuma prova de cliente**. As duas seções que mais pesam na
  avaliação só se escrevem com dado de campo.

⚠ **Duas armadilhas de formato que desclassificam:** o Pitch Deck tem que ser
**A4** (não 16:9), e o Portfólio em retrato com o Pitch em paisagem. Configure o
tamanho **antes** do primeiro slide — corrigir depois desloca tudo.

---

# PARTE 10 — COMO COMEÇAR A PRÓXIMA CONVERSA

Cole isto na primeira mensagem, dentro da pasta do projeto:

```
Estou retomando o confia?, meu projeto de verificação antigolpe que vou
apresentar no Plano Empreenda SENAC. Você não participou das conversas
anteriores.

Leia RETOMAR-TUDO.md inteiro antes de responder qualquer coisa. Ele é o guia
único: tem o que já foi feito, o que falta, as regras que não se discutem e as
armadilhas que já custaram tempo.

Depois me diga em poucas linhas onde a gente parou e o que você faria primeiro.
Não comece a mexer em código antes disso.
```

⚠ Se o assunto for a entrega do SENAC (e não o código), use o prompt de
`PLANO-EMPREENDEDOR/RETOMAR.md` — é mais específico e economiza tempo.
