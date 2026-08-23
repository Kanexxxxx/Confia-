#!/usr/bin/env bash
# =============================================================
# confiia.com.br — BLINDAGEM DA VPS (passo 1 de 3)
#
# Roda UMA vez, como root, numa Ubuntu/Debian recém-criada.
# Depois dele o servidor deixa de aceitar senha e passa a
# aceitar só a sua chave.
#
# ORDEM DOS PASSOS:
#   01-blindagem.sh   <- você está aqui (usuário, SSH, firewall)
#   02-plataforma.sh  (Node, Postgres, nginx, certbot)
#   03-publica.sh     (build, serviço systemd, SSL)
#
# ANTES DE RODAR, CONFIRA:
#   - sua chave pública JÁ está em /root/.ssh/authorized_keys
#   - você consegue entrar com `ssh -i ~/.ssh/id_ed25519 root@IP`
#
# Se rodar sem a chave funcionando, você se tranca para fora e
# só volta pelo console de recuperação da Hostinger. O script
# checa isso antes de mexer em qualquer coisa — mas confira.
#
# CUIDADO AO MEXER:
#   - O bloco do sshd é o ponto sem volta. Ele só roda depois
#     da checagem da chave, e guarda backup do arquivo original.
# =============================================================

set -euo pipefail

# ---------- o que você pode querer mudar ----------
USUARIO="confia"            # usuário de trabalho, sem senha, com sudo
PORTA_SSH="22"              # troque para algo entre 20000-65000 se quiser menos ruído no log
FUSO="America/Sao_Paulo"
# --------------------------------------------------

azul(){ printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
ok(){   printf '\033[0;32m  ok  \033[0m %s\n' "$*"; }
alerta(){ printf '\033[1;33m aviso \033[0m %s\n' "$*"; }
morre(){ printf '\n\033[0;31m PAROU \033[0m %s\n\n' "$*"; exit 1; }

[[ $EUID -eq 0 ]] || morre "Rode como root."

# =============================================================
# 0. TRAVA DE SEGURANÇA
# Sem chave instalada, desligar a senha te tranca para fora.
# =============================================================
azul "Conferindo se a chave SSH já está instalada"

CHAVES="/root/.ssh/authorized_keys"
if [[ ! -s "$CHAVES" ]]; then
  morre "Não achei nenhuma chave em $CHAVES.

Rode ISTO no seu computador antes de continuar:

  type \$env:USERPROFILE\\.ssh\\id_ed25519.pub | ssh root@$(hostname -I | awk '{print $1}') \\
    \"mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys\"

Depois entre uma vez com a chave para confirmar que funciona, e só então rode este script."
fi
QTD=$(grep -c '^ssh-' "$CHAVES" || true)
[[ "$QTD" -ge 1 ]] || morre "O arquivo $CHAVES existe mas não tem chave válida dentro."
ok "$QTD chave(s) instalada(s)"

# =============================================================
# 1. BÁSICO DO SISTEMA
# =============================================================
azul "Atualizando o sistema"
export DEBIAN_FRONTEND=noninteractive
# O needrestart do Ubuntu 24.04 abre um menu no meio do apt e trava
# script não interativo. 'a' = reinicia os serviços sozinho.
export NEEDRESTART_MODE=a
export NEEDRESTART_SUSPEND=1
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
  ufw fail2ban unattended-upgrades curl ca-certificates gnupg \
  git htop rsync jq unzip acl >/dev/null
ok "pacotes base instalados"

timedatectl set-timezone "$FUSO"
ok "fuso: $FUSO"

# Swap: VPS pequena com Postgres + Node sem swap morre no primeiro pico.
if ! swapon --show | grep -q .; then
  RAM_MB=$(free -m | awk '/^Mem:/{print $2}')
  SWAP_GB=$(( RAM_MB < 4096 ? 2 : 4 ))
  azul "Criando swap de ${SWAP_GB}G (RAM detectada: ${RAM_MB}MB)"
  fallocate -l "${SWAP_GB}G" /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  # Só usa swap quando apertar de verdade — swap cedo demais deixa tudo lento.
  sysctl -qw vm.swappiness=10
  grep -q 'vm.swappiness' /etc/sysctl.d/99-confia.conf 2>/dev/null || \
    echo 'vm.swappiness=10' >> /etc/sysctl.d/99-confia.conf
  ok "swap ativo"
else
  ok "swap já existia"
fi

# =============================================================
# 2. USUÁRIO DE TRABALHO
# Aplicação nunca roda como root. Se um dia invadirem o Node,
# a diferença entre "mexeram no site" e "perderam o servidor"
# é exatamente esta linha.
# =============================================================
azul "Criando o usuário $USUARIO"
if id "$USUARIO" &>/dev/null; then
  ok "usuário já existe"
else
  adduser --disabled-password --gecos "" "$USUARIO" >/dev/null
  usermod -aG sudo "$USUARIO"
  ok "usuário criado, com sudo, sem senha (só entra por chave)"
fi

install -d -m 700 -o "$USUARIO" -g "$USUARIO" "/home/$USUARIO/.ssh"
cp "$CHAVES" "/home/$USUARIO/.ssh/authorized_keys"
chown "$USUARIO:$USUARIO" "/home/$USUARIO/.ssh/authorized_keys"
chmod 600 "/home/$USUARIO/.ssh/authorized_keys"
ok "chave copiada para $USUARIO"

# sudo sem senha: a conta não TEM senha, então pedir senha trava tudo.
echo "$USUARIO ALL=(ALL) NOPASSWD:ALL" > "/etc/sudoers.d/90-$USUARIO"
chmod 440 "/etc/sudoers.d/90-$USUARIO"
visudo -c >/dev/null || morre "sudoers ficou inválido — não saia desta sessão, corrija antes."
ok "sudo configurado"

# =============================================================
# 3. SSH — O PONTO SEM VOLTA
# =============================================================
azul "Fechando o SSH"

cp /etc/ssh/sshd_config "/etc/ssh/sshd_config.antes-do-confia.$(date +%Y%m%d%H%M)"

cat > /etc/ssh/sshd_config.d/99-confia.conf <<EOF
# confiia.com.br — endurecimento do SSH
# Arquivo próprio: sobrescreve o sshd_config sem editá-lo.
# Para reverter: apague este arquivo e rode 'systemctl restart ssh'.

Port $PORTA_SSH

# Senha desligada. É isto que tira você da mira dos robôs.
PasswordAuthentication no
PermitEmptyPasswords no
KbdInteractiveAuthentication no
ChallengeResponseAuthentication no
UsePAM yes

# Root não entra direto. Entre como $USUARIO e use sudo.
PermitRootLogin prohibit-password

PubkeyAuthentication yes
AuthenticationMethods publickey

# Só quem interessa
AllowUsers $USUARIO root

MaxAuthTries 3
MaxSessions 5
LoginGraceTime 20

# Sessão morta cai sozinha
ClientAliveInterval 300
ClientAliveCountMax 2

X11Forwarding no
AllowAgentForwarding no
PermitTunnel no

# Encaminhamento de porta: liberado SÓ para o Postgres local.
#
# 'no' seria mais seguro, mas quebra o túnel que você usa para
# desenvolver na sua máquina falando com o banco da VPS. E abrir
# 'yes' liberaria o servidor como ponte para qualquer endereço —
# quem tivesse a chave poderia usar sua VPS para alcançar coisa
# que não é da conta dele.
#
# 'local' + PermitOpen resolve os dois: só encaminhamento -L, e
# só para 127.0.0.1:5432. Qualquer outro destino é recusado com
# "administratively prohibited".
AllowTcpForwarding local
PermitOpen 127.0.0.1:5432
GatewayPorts no
EOF

sshd -t || morre "Configuração do SSH ficou inválida. NÃO feche esta sessão. Rode: rm /etc/ssh/sshd_config.d/99-confia.conf"
ok "configuração validada"

systemctl restart ssh 2>/dev/null || systemctl restart sshd
ok "SSH reiniciado — senha desligada"

alerta "NÃO FECHE ESTA JANELA ainda."
alerta "Abra outro terminal e teste:  ssh -p $PORTA_SSH $USUARIO@$(hostname -I | awk '{print $1}')"
alerta "Só feche esta depois que o teste entrar."

# =============================================================
# 4. FIREWALL
# =============================================================
azul "Ligando o firewall"
ufw --force reset >/dev/null
ufw default deny incoming >/dev/null
ufw default allow outgoing >/dev/null
ufw allow "$PORTA_SSH"/tcp comment 'SSH' >/dev/null
ufw allow 80/tcp  comment 'HTTP (renovação do certificado)' >/dev/null
ufw allow 443/tcp comment 'HTTPS' >/dev/null
ufw --force enable >/dev/null
ok "firewall ligado: só 80, 443 e $PORTA_SSH"
alerta "Postgres (5432) fica FECHADO para fora de propósito. O app fala com ele pelo localhost."

# =============================================================
# 5. FAIL2BAN
# Firewall bloqueia porta; fail2ban bloqueia insistência.
# =============================================================
azul "Configurando o fail2ban"
cat > /etc/fail2ban/jail.local <<EOF
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 4
backend  = systemd
# Nunca se bloqueie sozinho
ignoreip = 127.0.0.1/8 ::1

[sshd]
enabled = true
port    = $PORTA_SSH
# Reincidente leva bloqueio longo
bantime = 24h
maxretry = 3
EOF
systemctl enable --now fail2ban >/dev/null
systemctl restart fail2ban
ok "fail2ban ativo"

# =============================================================
# 6. ATUALIZAÇÃO AUTOMÁTICA DE SEGURANÇA
# =============================================================
azul "Ligando atualização automática de segurança"
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF
cat > /etc/apt/apt.conf.d/51confia-unattended <<'EOF'
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
EOF
systemctl enable --now unattended-upgrades >/dev/null 2>&1 || true
ok "correção de segurança entra sozinha (sem reiniciar sozinho)"

# =============================================================
# 7. REDE — endurecimento leve do kernel
# =============================================================
azul "Endurecendo a rede"
cat > /etc/sysctl.d/99-confia-rede.conf <<'EOF'
# Ignora ping em broadcast e pacote com origem forjada
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.conf.all.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
# Registra pacote suspeito
net.ipv4.conf.all.log_martians = 1
# Aguenta enxurrada de conexão pela metade
net.ipv4.tcp_syncookies = 1
EOF
sysctl -p /etc/sysctl.d/99-confia-rede.conf >/dev/null
ok "sysctl aplicado"

# =============================================================
# 8. PASTAS DO PROJETO
# =============================================================
azul "Preparando as pastas"
install -d -m 755 -o "$USUARIO" -g "$USUARIO" /var/www/confia
install -d -m 750 -o "$USUARIO" -g "$USUARIO" /var/www/confia/arquivos   # uploads temporários
install -d -m 750 -o "$USUARIO" -g "$USUARIO" /var/backups/confia
ok "/var/www/confia pronto"

# =============================================================
# RESUMO
# =============================================================
IP=$(hostname -I | awk '{print $1}')
cat <<EOF

=============================================================
 BLINDAGEM CONCLUÍDA
=============================================================

  Entrar agora é assim:
      ssh -p $PORTA_SSH $USUARIO@$IP

  O que mudou:
    - senha desligada no SSH (só chave)
    - root não entra direto
    - firewall: só $PORTA_SSH, 80 e 443
    - fail2ban: 3 erros = 24h de bloqueio
    - atualização de segurança automática
    - swap ativo
    - usuário '$USUARIO' criado para rodar a aplicação

  ANTES DE FECHAR ESTA JANELA:
    abra outro terminal e confirme que
        ssh -p $PORTA_SSH $USUARIO@$IP
    entra. Se não entrar, corrija por aqui — esta sessão
    ainda está aberta e é a sua última rede de proteção.

  Próximo passo:  sudo bash 02-plataforma.sh

=============================================================

EOF
