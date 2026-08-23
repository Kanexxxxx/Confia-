#!/usr/bin/env bash
# =============================================================
# confiia.com.br — BANCO DE DADOS (passo 2 de 3)
#
# Instala o PostgreSQL, ajusta para esta máquina (1 núcleo,
# 3,8 GB), cria os usuários, roda as migrações e liga o backup.
#
# DOIS USUÁRIOS, DE PROPÓSITO:
#
#   confia_dono  — dono das tabelas. Só aparece na hora de migrar.
#   confia_app   — o que a aplicação usa no dia a dia. Consegue
#                  ler e gravar linha, e MAIS NADA. Não cria
#                  tabela, não apaga tabela, não lê senha de
#                  outro usuário do banco.
#
# Por que separar: se um dia escapar uma falha de injeção de SQL
# na aplicação, o estrago fica em "mexeram nos dados" em vez de
# "apagaram o banco inteiro". É a mesma ideia do usuário `confia`
# no lugar do root — o app roda com o mínimo que precisa.
#
# AS SENHAS SÃO GERADAS AQUI DENTRO e gravadas em
# /etc/confia/banco.env (só root e o grupo confia leem).
# Elas nunca são impressas na tela e nunca saem do servidor.
#
# CUIDADO AO MEXER:
#   - Rodar de novo é seguro: migração já aplicada é pulada,
#     e as senhas existentes são reaproveitadas.
#   - Postgres escuta SÓ em localhost. Se um dia precisar acessar
#     de fora, faça por túnel SSH — nunca abrindo a porta 5432.
# =============================================================

set -euo pipefail

PASTA_SQL="${1:-/root/db}"
BANCO="confia"
DONO="confia_dono"
APP="confia_app"
ENV_ARQ="/etc/confia/banco.env"

azul(){ printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
ok(){   printf '\033[0;32m  ok  \033[0m %s\n' "$*"; }
alerta(){ printf '\033[1;33m aviso \033[0m %s\n' "$*"; }
morre(){ printf '\n\033[0;31m PAROU \033[0m %s\n\n' "$*"; exit 1; }

[[ $EUID -eq 0 ]] || morre "Rode com sudo."
[[ -d "$PASTA_SQL" ]] || morre "Não achei os arquivos .sql em $PASTA_SQL"

export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_MODE=a

# =============================================================
# 1. INSTALAR
# =============================================================
azul "Instalando o PostgreSQL"
if ! command -v psql >/dev/null; then
  apt-get update -qq
  apt-get install -y -qq postgresql postgresql-contrib >/dev/null
  ok "instalado"
else
  ok "já estava instalado"
fi

VERSAO=$(ls /etc/postgresql/ | sort -V | tail -1)
CONF_DIR="/etc/postgresql/$VERSAO/main"
[[ -d "$CONF_DIR" ]] || morre "Não achei a configuração em $CONF_DIR"
ok "PostgreSQL $VERSAO"

# =============================================================
# 2. AJUSTAR PARA ESTA MÁQUINA
#
# O padrão do Postgres é conservador de propósito — ele não sabe
# em que máquina vai rodar. Aqui: 1 núcleo, 3,8 GB, disco SSD,
# e o Node dividindo a mesma RAM.
# =============================================================
azul "Ajustando a configuração"

RAM_MB=$(free -m | awk '/^Mem:/{print $2}')
NUCLEOS=$(nproc)
# ~13% da RAM para o Postgres. O resto fica para o Node e para o
# cache do sistema — numa máquina compartilhada, tomar 25% da RAM
# (a receita clássica) faz o app engasgar.
SHARED=$(( RAM_MB * 13 / 100 ))
CACHE=$(( RAM_MB * 40 / 100 ))

cat > "$CONF_DIR/conf.d/99-confia.conf" <<EOF
# confiia.com.br — ajustes desta máquina
# Gerado por 02-banco.sh em $(date +%d/%m/%Y).
# RAM detectada: ${RAM_MB}MB · núcleos: ${NUCLEOS}
# Para reverter: apague este arquivo e reinicie o postgresql.

# ---------- rede ----------
# Só localhost. A aplicação está na mesma máquina; o banco não
# precisa aparecer na internet e não vai aparecer.
listen_addresses = 'localhost'
port = 5432
password_encryption = scram-sha-256

# ---------- memória ----------
shared_buffers = ${SHARED}MB
effective_cache_size = ${CACHE}MB
maintenance_work_mem = 192MB
work_mem = 6MB

# ---------- conexões ----------
# 50 é folgado para o pool do Node. Mais conexão não é mais
# velocidade — com 1 núcleo, é mais briga pelo mesmo núcleo.
max_connections = 50

# ---------- disco SSD ----------
random_page_cost = 1.1
effective_io_concurrency = 200

# ---------- escrita ----------
wal_buffers = 16MB
min_wal_size = 512MB
max_wal_size = 2GB
checkpoint_completion_target = 0.9

# ---------- paralelismo ----------
# Com 1 núcleo, dividir a consulta em várias partes só cria
# trabalho extra. Desligado de propósito.
max_parallel_workers_per_gather = 0
max_parallel_workers = ${NUCLEOS}
max_worker_processes = $(( NUCLEOS + 1 ))

# ---------- registro ----------
timezone = 'America/Sao_Paulo'
log_timezone = 'America/Sao_Paulo'
# Consulta lenta aparece no log. É assim que se acha gargalo
# sem adivinhar.
log_min_duration_statement = 500ms
# ATENÇÃO LGPD: 'ddl' registra só mudança de estrutura.
# NÃO troque para 'all' — isso jogaria e-mail, telefone e relato
# de vítima dentro do arquivo de log, em texto puro.
log_statement = 'ddl'
log_line_prefix = '%m [%p] %u@%d '
log_checkpoints = on
log_autovacuum_min_duration = 0
EOF

ok "shared_buffers=${SHARED}MB · cache=${CACHE}MB · conexões=50"

systemctl restart postgresql
sleep 2
systemctl is-active --quiet postgresql || morre "O PostgreSQL não subiu. Veja: journalctl -u postgresql -n 40"
ok "PostgreSQL reiniciado"

# =============================================================
# 3. SENHAS E USUÁRIOS
# =============================================================
azul "Criando os usuários do banco"

install -d -m 750 -o root -g confia /etc/confia

# 40 caracteres hexadecimais = 160 bits de aleatoriedade.
# NÃO use `tr -dc ... </dev/urandom | head -c N` aqui: quando o
# `head` já tem o que queria, ele fecha o cano e o `tr` morre de
# SIGPIPE. Com `set -o pipefail` isso derruba o script inteiro,
# sem mensagem nenhuma. Foi exatamente o que aconteceu.
gera_senha(){ openssl rand -hex 20; }

if [[ -f "$ENV_ARQ" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_ARQ"
  SENHA_DONO="${SENHA_DONO:-$(gera_senha)}"
  SENHA_APP="${SENHA_APP:-$(gera_senha)}"
  ok "reaproveitando as senhas que já existiam"
else
  SENHA_DONO=$(gera_senha)
  SENHA_APP=$(gera_senha)
  ok "senhas novas geradas (não aparecem na tela, de propósito)"
fi

# psql como o usuário postgres do sistema
pg(){ sudo -u postgres psql -v ON_ERROR_STOP=1 -qtAX "$@"; }

# Papel dono — cria e é dono das tabelas
if [[ -z "$(pg -c "SELECT 1 FROM pg_roles WHERE rolname='$DONO'")" ]]; then
  pg -c "CREATE ROLE $DONO LOGIN PASSWORD '$SENHA_DONO';" >/dev/null
  ok "usuário $DONO criado"
else
  pg -c "ALTER ROLE $DONO PASSWORD '$SENHA_DONO';" >/dev/null
  ok "usuário $DONO já existia"
fi

# Papel da aplicação — sem poder nenhum ainda; os direitos vêm depois
if [[ -z "$(pg -c "SELECT 1 FROM pg_roles WHERE rolname='$APP'")" ]]; then
  pg -c "CREATE ROLE $APP LOGIN PASSWORD '$SENHA_APP';" >/dev/null
  ok "usuário $APP criado"
else
  pg -c "ALTER ROLE $APP PASSWORD '$SENHA_APP';" >/dev/null
  ok "usuário $APP já existia"
fi

# Banco
if [[ -z "$(pg -c "SELECT 1 FROM pg_database WHERE datname='$BANCO'")" ]]; then
  pg -c "CREATE DATABASE $BANCO OWNER $DONO ENCODING 'UTF8' LC_COLLATE 'pt_BR.UTF-8' LC_CTYPE 'pt_BR.UTF-8' TEMPLATE template0;" >/dev/null 2>&1 \
    || pg -c "CREATE DATABASE $BANCO OWNER $DONO ENCODING 'UTF8' TEMPLATE template0;" >/dev/null
  ok "banco '$BANCO' criado"
else
  ok "banco '$BANCO' já existia"
fi

# Ninguém entra no banco além de quem interessa
pg -d "$BANCO" -c "REVOKE ALL ON DATABASE $BANCO FROM PUBLIC;" >/dev/null
pg -d "$BANCO" -c "GRANT CONNECT ON DATABASE $BANCO TO $APP;" >/dev/null
pg -d "$BANCO" -c "ALTER SCHEMA public OWNER TO $DONO;" >/dev/null
pg -d "$BANCO" -c "REVOKE ALL ON SCHEMA public FROM PUBLIC;" >/dev/null
pg -d "$BANCO" -c "GRANT USAGE ON SCHEMA public TO $APP;" >/dev/null
ok "acesso fechado no básico"

# Guarda as senhas — só root e o grupo confia leem
umask 027
cat > "$ENV_ARQ" <<EOF
# confiia.com.br — credenciais do banco
# GERADO AUTOMATICAMENTE. Não edite à mão, não copie para o Git,
# não mande por mensagem. Se vazar, rode 02-banco.sh de novo
# depois de apagar este arquivo: senhas novas serão geradas.

SENHA_DONO=$SENHA_DONO
SENHA_APP=$SENHA_APP

# A aplicação usa esta:
DATABASE_URL=postgres://$APP:$SENHA_APP@127.0.0.1:5432/$BANCO

# Só as migrações usam esta:
DATABASE_URL_MIGRACAO=postgres://$DONO:$SENHA_DONO@127.0.0.1:5432/$BANCO
EOF
chown root:confia "$ENV_ARQ"
chmod 640 "$ENV_ARQ"
ok "credenciais em $ENV_ARQ (modo 640, root:confia)"

# =============================================================
# 4. MIGRAÇÕES
#
# Cada arquivo roda dentro de uma transação: ou entra inteiro,
# ou não entra nada. E fica registrado, para rodar de novo não
# aplicar duas vezes.
# =============================================================
azul "Rodando as migrações"

export PGPASSWORD="$SENHA_DONO"
dono_psql(){ psql -v ON_ERROR_STOP=1 -qtAX -h 127.0.0.1 -U "$DONO" -d "$BANCO" "$@"; }

dono_psql -c "
CREATE TABLE IF NOT EXISTS migracoes (
  arquivo   text PRIMARY KEY,
  sha256    text NOT NULL,
  rodada_em timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE migracoes IS 'Quais arquivos .sql já foram aplicados. Não apague linhas daqui.';
" >/dev/null

APLICADAS=0
PULADAS=0
for arq in $(ls "$PASTA_SQL"/*.sql | sort); do
  nome=$(basename "$arq")
  soma=$(sha256sum "$arq" | cut -d' ' -f1)
  ja=$(dono_psql -c "SELECT sha256 FROM migracoes WHERE arquivo='$nome'")

  if [[ -n "$ja" ]]; then
    if [[ "$ja" != "$soma" ]]; then
      alerta "$nome já rodou, mas o arquivo MUDOU desde então."
      alerta "  Migração aplicada não se edita — crie um arquivo novo."
    else
      PULADAS=$((PULADAS+1))
    fi
    continue
  fi

  printf '     rodando %s ... ' "$nome"
  if dono_psql -1 -f "$arq" >/dev/null 2>/tmp/erro_migracao; then
    dono_psql -c "INSERT INTO migracoes (arquivo, sha256) VALUES ('$nome','$soma');" >/dev/null
    printf '\033[0;32mok\033[0m\n'
    APLICADAS=$((APLICADAS+1))
  else
    printf '\033[0;31mfalhou\033[0m\n'
    echo "--- erro ---"; cat /tmp/erro_migracao; echo "------------"
    morre "A migração $nome falhou. Nada dela foi aplicado (rodou dentro de transação). Corrija e rode de novo."
  fi
done
ok "$APLICADAS aplicada(s), $PULADAS já estavam"

# =============================================================
# 5. DIREITOS DA APLICAÇÃO
#
# Só agora, com as tabelas existindo. E `ALTER DEFAULT PRIVILEGES`
# garante que tabela criada no futuro já nasça acessível — senão
# a próxima migração quebra o app em produção.
# =============================================================
azul "Dando à aplicação o mínimo que ela precisa"

dono_psql <<EOF >/dev/null
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES    IN SCHEMA public TO $APP;
GRANT USAGE, SELECT                  ON ALL SEQUENCES IN SCHEMA public TO $APP;
GRANT EXECUTE                        ON ALL FUNCTIONS IN SCHEMA public TO $APP;

ALTER DEFAULT PRIVILEGES FOR ROLE $DONO IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO $APP;
ALTER DEFAULT PRIVILEGES FOR ROLE $DONO IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO $APP;
ALTER DEFAULT PRIVILEGES FOR ROLE $DONO IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO $APP;

-- A tabela de migrações é do dono. A aplicação nem lê.
REVOKE ALL ON migracoes FROM $APP;
EOF
ok "$APP: lê e grava linha, e nada além disso"

# =============================================================
# 6. BACKUP DIÁRIO
# =============================================================
azul "Ligando o backup"

cat > /usr/local/bin/confia-backup <<'EOF'
#!/usr/bin/env bash
# Backup do banco do confia?. Chamado pelo timer do systemd.
set -euo pipefail
source /etc/confia/banco.env
DESTINO=/var/backups/confia
ARQ="$DESTINO/confia-$(date +%Y%m%d-%H%M).sql.gz"

install -d -m 750 -o confia -g confia "$DESTINO"

PGPASSWORD="$SENHA_DONO" pg_dump -h 127.0.0.1 -U confia_dono -d confia \
  --no-owner --no-acl | gzip -9 > "$ARQ"

chmod 640 "$ARQ"; chown confia:confia "$ARQ"

# Guarda 14 dias
find "$DESTINO" -name 'confia-*.sql.gz' -mtime +14 -delete

# Backup que ninguém confere é backup que não existe.
TAM=$(stat -c%s "$ARQ")
if [[ "$TAM" -lt 2000 ]]; then
  echo "BACKUP SUSPEITO: $ARQ tem só $TAM bytes" >&2
  exit 1
fi
echo "ok $ARQ ($(numfmt --to=iec "$TAM"))"
EOF
chmod 750 /usr/local/bin/confia-backup

cat > /etc/systemd/system/confia-backup.service <<'EOF'
[Unit]
Description=Backup do banco do confia?
After=postgresql.service

[Service]
Type=oneshot
ExecStart=/usr/local/bin/confia-backup
EOF

cat > /etc/systemd/system/confia-backup.timer <<'EOF'
[Unit]
Description=Backup diário do banco do confia?

[Timer]
OnCalendar=*-*-* 03:30:00
Persistent=true
RandomizedDelaySec=300

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now confia-backup.timer >/dev/null
ok "backup todo dia às 3:30"

/usr/local/bin/confia-backup && ok "primeiro backup feito agora"

# =============================================================
# CONFERÊNCIA
# =============================================================
azul "Conferindo"
TABELAS=$(dono_psql -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'")
VIEWS=$(dono_psql -c "SELECT count(*) FROM information_schema.views WHERE table_schema='public'")
FUNCS=$(dono_psql -c "SELECT count(*) FROM information_schema.routines WHERE routine_schema='public'")

# A aplicação consegue ler? E consegue criar tabela (não pode)?
export PGPASSWORD="$SENHA_APP"
APP_LE=$(psql -qtAX -h 127.0.0.1 -U "$APP" -d "$BANCO" -c "SELECT count(*) FROM planos" 2>&1 || echo ERRO)
APP_CRIA=$(psql -qtAX -h 127.0.0.1 -U "$APP" -d "$BANCO" -c "CREATE TABLE teste_invasao(x int)" 2>&1 || true)
unset PGPASSWORD

echo
echo "  tabelas ............. $TABELAS"
echo "  visões .............. $VIEWS"
echo "  funções ............. $FUNCS"
echo "  planos cadastrados .. $APP_LE"
if echo "$APP_CRIA" | grep -qi "permission denied\|permissão negada"; then
  echo "  app cria tabela? .... NÃO (correto)"
else
  alerta "  app CONSEGUIU criar tabela — os direitos não fecharam. Confira o passo 5."
fi

cat <<EOF

=============================================================
 BANCO NO AR
=============================================================

  Entrar no banco para olhar:
      sudo -u postgres psql confia
      \\dt          lista as tabelas
      \\q           sai

  Credenciais:  /etc/confia/banco.env   (não abra em print)
  Backup:       /var/backups/confia/
  Testar backup agora:  sudo /usr/local/bin/confia-backup

  FALTA VOCÊ FAZER:
    Cópia do backup FORA do servidor. Backup que mora na mesma
    máquina não protege contra a máquina morrer.

  Próximo passo: Etapa 3 — TypeScript ligado no banco

=============================================================

EOF
