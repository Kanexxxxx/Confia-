# confia?

Serviço brasileiro de verificação antigolpe. A pessoa cola um link, um perfil,
um print ou um número de telefone, e recebe de volta uma resposta em português
com **o motivo de cada conclusão** — não um "é golpe" sem explicação.

**Site:** confiia.com.br · **Beta:** beta.confiia.com.br
**Instagram:** [@confia.iia](https://www.instagram.com/confia.iia/) ·
**Facebook:** [confia?](https://www.facebook.com/profile.php?id=100081737570267)

> **Estado:** em construção. Veja [PLANO.md](PLANO.md) para saber exatamente
> onde estamos — são 10 etapas, e cada uma termina com algo funcionando.

---

## Onde fica cada coisa

```
confia/
├── PLANO.md          O mapa. Abra este primeiro.
├── PENDENCIAS.md     O que só você pode resolver (contas, chaves, CNPJ).
│
├── web/              A APLICAÇÃO. É isto que vira o produto.
│   ├── src/app/        páginas (Next.js)
│   ├── src/db/         tabelas em TypeScript — GERADO, não edite
│   ├── src/lib/        senha, sessão, e-mail, auditoria
│   └── scripts/        ferramentas de linha de comando
│
├── servidor/         O SERVIDOR.
│   ├── 01-blindagem.sh   SSH, firewall, fail2ban  (já rodou)
│   ├── 02-banco.sh       PostgreSQL + migrações   (já rodou)
│   └── db/*.sql          as migrações, comentadas uma a uma
│
└── prototipo/        O DESENHO. HTML estático, feito antes da aplicação.
    ├── index.html      … serve de referência para a migração (Etapa 6)
    ├── assets/
    └── arquivo/        versões de design descartadas, guardadas por história
```

---

## Como mexer no dia a dia

```bash
cd web
npm run tunel     # terminal 1 — túnel até o banco na VPS. Deixe aberto.
npm run dev       # terminal 2 — abre em localhost:3000
```

| Comando | Para quê |
|---|---|
| `npm run db:puxar` | Regera os tipos depois de mudar alguma tabela |
| `npm run db:estudio` | Abre o banco numa tela, para olhar os dados |
| `node scripts/testa-email.mjs seu@email.com` | Confere se o envio de e-mail funciona |

**Entrar no servidor:** `ssh confia-vps`

---

## Três regras que não se quebram

**1. Quem manda no banco são os arquivos `.sql`.**
`web/src/db/schema.ts` é gerado a partir deles e é reescrito inteiro a cada
`npm run db:puxar`. Editar à mão é perder o trabalho na próxima vez.
Para mudar uma tabela: escreva uma migração nova, rode, regere.

**2. Migração já aplicada não se edita.**
Se precisar corrigir algo, crie o arquivo seguinte. O banco guarda o `sha256`
de cada uma e avisa se alguma mudou depois de rodar.

**3. Segredo nenhum entra no Git.**
Senhas e chaves ficam em `web/.env.local` (sua máquina) e em
`/etc/confia/banco.env` (servidor). Os dois estão fora do histórico.

---

## Decisões que já foram tomadas, e por quê

| Escolha | Motivo |
|---|---|
| **scrypt** para senha, do próprio Node | Sem biblioteca nativa que quebra entre Windows e Linux |
| **Dois usuários de banco** | Se escapar uma injeção de SQL, o app não consegue apagar tabela |
| **`log_statement='ddl'`** no Postgres | Log não pode guardar e-mail nem relato de vítima em texto puro |
| **Regras críticas em gatilho** | Selo sem posse do domínio é recusado pelo BANCO, não só pela tela |
| **Banco `confia_dev` separado** | Não se programa em cima do banco de produção |

---

## Não confundir

`confiia.com.br` roda uma versão anterior, **feita por outra pessoa**.
Ela não se apaga e não se substitui. O que está sendo construído aqui vai
para `beta.confiia.com.br`.
