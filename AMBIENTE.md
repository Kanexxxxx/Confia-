# Ambiente de desenvolvimento

Preparação iniciada em 04/11/2026. O produto continua em construção;
este documento descreve o ambiente local, não uma publicação.

## Iniciar no Windows

Requisitos: Node.js 24, npm e PostgreSQL instalado. Nesta máquina foram usados
Node 24.20.0 e PostgreSQL 18.6. A VPS histórica usava PostgreSQL 16;
compatibilidade com ela deve ser validada antes de publicar.

Na pasta `web/`:

```powershell
npm ci
npm run ambiente:preparar
npm run dev:local
```

Abra http://localhost:3000. O comando `dev:local` escuta apenas no próprio
computador. Para testar no celular, use `npm run dev` conscientemente na rede local.

`ambiente:preparar` inicia um cluster independente em `127.0.0.1:55433`, cria
`confia_dev`, os papéis `confia_dono` e `confia_app` e aplica as migrações de
`servidor/db/` em ordem, com transação e conferência de hash. Repetir o comando
preserva os dados e pula migrações já aplicadas. Migração aplicada não se edita.

O executável padrão fica em `C:\Program Files\PostgreSQL\18\bin`. Se a instalação
estiver em outro lugar, defina `CONFIA_PG_BIN` antes de preparar.
O serviço PostgreSQL já instalado para outros projetos não é reconfigurado.

O cluster e suas credenciais ficam em `%LOCALAPPDATA%\Confia\desenvolvimento`,
fora do OneDrive e do repositório. O `.env.local` gerado fica ignorado pelo Git.
As senhas são aleatórias e a chave de cifra local é diferente da chave antiga.
Não compartilhe `config.json`, arquivos `.env` ou cópias do banco.

Para parar apenas este banco, sem apagar dados:

```powershell
npm run banco:parar
```

## Conta de teste

O banco local começa sem contas. Para preparar a conta comum descrita no
`CLAUDE.md`, execute `npm run conta-teste`. Esse comando redefine a senha,
desliga o 2FA dessa conta e encerra suas sessões; use apenas quando necessário.
Não foi criado administrador automaticamente.

## Configuração antiga recuperada

Nesta máquina foi encontrada uma cópia em
`C:\Users\Kanex\chaves-do-confia\env.local.txt`. Ela foi preservada também como
`web/.env.vps-recuperado`, ignorada pelo Git. Contém segredos: não abrir em logs,
diffs ou mensagens. O ambiente local não usa as chaves de Asaas e Resend dessa cópia;
assim testes locais não criam cobrança nem enviam e-mail real.

O atalho SSH `confia-vps` existe em `~/.ssh/config` e referencia uma chave existente.
A conexão expirou antes da autenticação. A consulta de leitura à Hostinger em
04/11/2026 retornou a VPS listada como `destroyed`, sem IP atribuído. Não foi
criado ou alterado servidor, DNS ou serviço remoto. Os dados remotos antigos
não foram recuperados; o banco local foi criado pelas migrações, sem dados reais.

## Verificações

Execute na pasta `web/`:

```powershell
npm run confere
npm run confere-banco
npm run prova-armadilha
npm run build
# Com o site rodando em outro terminal:
npm run confere-paginas
npm audit
```

`confere` valida CSS, ícones, tipos e lint. `confere-banco` confere permissões,
RLS e auditoria; `prova-armadilha` cobre nove casos do formulário. A varredura
das páginas verifica HTML servido, mas não substitui testes visuais ou login.

## Continuidade do produto

Resultados observados em 04/11/2026: 19 migrações aplicadas; uma conta comum de
teste; banco reiniciado sem perder dados; login e área da conta abertos pelo
navegador; verificação de banco aprovada (15 objetos permitidos, RLS em 44
tabelas e 5/5 funções com autoridade do dono); nove casos anti-robô aprovados;
12 páginas públicas varridas sem achados pelo script existente.
`npm run confere` e `npm run build` também terminaram com código zero após
as atualizações de dependências. As mensagens de sessão abaixo continuam presentes.

Next.js e eslint-config-next foram atualizados para 16.4.5. As correções
compatíveis de dependências também foram aplicadas. `npm audit --omit=dev`
retornou zero vulnerabilidades conhecidas. A auditoria completa ainda retorna
20 alertas moderados nas cadeias de esbuild/drizzle-kit e minimatch/ESLint.
Não foi usado `--force`: a solução automática propõe versões incompatíveis
mais antigas de ferramentas. Esses alertas continuam pendentes de revisão.

O build anterior emitiu mensagens de `Dynamic server usage` nas páginas legais,
capturadas pelo tratamento genérico de sessão como se fossem falha de banco.
Isso deve ser investigado ao revisar a sessão; não comprova banco indisponível.

1. Reproduzir o aviso incorreto de 2FA listado em `MELHORIAS.md`, usando dados locais.
2. Conciliar `PENDENCIAS.md`, `PLANO.md` e a lista viva conforme evidências.
3. Implementar e testar motor de verificação e histórico.
4. Completar privacidade, anexos de provas, moderação e painel administrativo.
5. Integrar pagamentos em sandbox e conferir limites dos planos.
6. Validar acessibilidade, documentos, recuperação de backup e segurança final.
7. Só então preparar a publicação em `beta.confiia.com.br`.

As decisões pendentes sobre provas, atendimento e dados da empresa continuam
em `MELHORIAS.md` e `PENDENCIAS.md`. O domínio raiz e o `www` pertencem à versão
do amigo e não são alvos de publicação deste projeto.
