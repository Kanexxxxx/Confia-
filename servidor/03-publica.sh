#!/usr/bin/env bash
# =============================================================
# confiia.com.br — PUBLICAR O SITE (passo 3 de 3)
#
# Roda como root, depois do 01-blindagem.sh e do 02-banco.sh.
# Ao fim, https://beta.confiia.com.br responde, e http:// leva
# para lá sozinho.
#
# ORDEM DOS PASSOS:
#   01-blindagem.sh   (usuário, SSH, firewall)
#   02-banco.sh       (Postgres, migrações, backup)
#   03-publica.sh     <- você está aqui (Node, nginx, SSL, serviço)
#
# ─────────────────────────────────────────────────────────────
# ⚠  O DOMÍNIO RAIZ NÃO É NOSSO
#
# `confiia.com.br` sem prefixo hospeda a versão de outra pessoa.
# ELA NÃO SE TOCA. Este script só configura `beta.confiia.com.br`
# e RECUSA rodar se alguém trocar o SUBDOMINIO pelo domínio nu.
# A trava está logo abaixo, e é de propósito que ela seja chata
# de contornar.
#
# ─────────────────────────────────────────────────────────────
# CUIDADO AO MEXER:
#   - O certbot tem limite de 5 pedidos por semana para o mesmo
#     nome. Errar a configuração e ficar repetindo trava você por
#     sete dias. Por isso o script testa com --dry-run primeiro.
#   - O serviço roda como o usuário `confia`, não como root. Se
#     alguém achar buraco no Next, acha um processo sem poder.
#   - `.env` fica em /etc/confia/, com dono root e modo 600. NÃO
#     ponha ele dentro da pasta do site: um erro de configuração
#     do nginx passa a servir o arquivo.
# =============================================================

set -euo pipefail

# ---------- o que você pode querer mudar ----------
SUBDOMINIO="beta.confiia.com.br"
USUARIO="confia"
PASTA="/var/www/confia"
PORTA_NODE="3000"
EMAIL_CERT="contato@confiia.com.br"   # avisos de vencimento do certificado

# =============================================================
# A TRAVA DO DOMÍNIO RAIZ
#
# Um `if` de cinco linhas que evita derrubar o site de um amigo.
# =============================================================
case "$SUBDOMINIO" in
  confiia.com.br|www.confiia.com.br)
    echo
    echo "  PARE. '$SUBDOMINIO' é o domínio raiz, e ele hospeda a"
    echo "  versão de OUTRA PESSOA. Configurar nginx para ele aqui"
    echo "  derruba o site dela."
    echo
    echo "  O nosso é um subdomínio: beta.confiia.com.br"
    echo
    exit 1
    ;;
esac

# ---------- cores, do mesmo jeito dos outros dois ----------
azul(){ printf '\n\033[1;34m▸ %s\033[0m\n' "$1"; }
ok(){   printf '  \033[0;32m✓\033[0m %s\n' "$1"; }
aviso(){ printf '  \033[0;33m!\033[0m %s\n' "$1"; }
morre(){ printf '\n\033[0;31m✗ %s\033[0m\n\n' "$1"; exit 1; }

[[ $EUID -eq 0 ]] || morre "Rode como root: sudo bash 03-publica.sh"
id "$USUARIO" >/dev/null 2>&1 || morre "Usuário '$USUARIO' não existe. Rode o 01-blindagem.sh antes."
[[ -f /etc/confia/banco.env ]] || morre "Não achei /etc/confia/banco.env. Rode o 02-banco.sh antes."

# =============================================================
# 1. O DNS PRECISA APONTAR PARA CÁ ANTES DE PEDIR CERTIFICADO
#
# O certbot prova que o domínio é seu servindo um arquivo nele.
# Se o DNS ainda não propagou, ele falha — e gasta uma das cinco
# tentativas da semana. Conferir antes é de graça.
# =============================================================
azul "Conferindo se o DNS já aponta para esta máquina"

meu_ip=$(curl -s --max-time 10 https://api.ipify.org || echo '')
ip_dns=$(getent hosts "$SUBDOMINIO" | awk '{print $1}' | head -1 || echo '')

if [[ -z "$ip_dns" ]]; then
  morre "$SUBDOMINIO não resolve para IP nenhum. Crie o registro A no painel do domínio e espere propagar."
fi
if [[ -n "$meu_ip" && "$ip_dns" != "$meu_ip" ]]; then
  morre "$SUBDOMINIO aponta para $ip_dns, mas esta máquina é $meu_ip. Corrija o DNS antes."
fi
ok "$SUBDOMINIO → $ip_dns (é esta máquina)"

# =============================================================
# 2. NODE E NGINX
# =============================================================
azul "Instalando Node 22 e nginx"

if ! command -v node >/dev/null || [[ "$(node -v | cut -c2-3)" -lt 22 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null 2>&1
  apt-get install -y nodejs >/dev/null 2>&1
fi
apt-get install -y nginx certbot python3-certbot-nginx >/dev/null 2>&1
ok "node $(node -v), nginx $(nginx -v 2>&1 | grep -o '[0-9.]*$')"

# =============================================================
# 3. NGINX SEM SSL AINDA — só o suficiente para o certbot provar
#
# O certificado ainda não existe, então este bloco é só HTTP.
# O certbot vai reescrever este arquivo daqui a pouco, e AÍ
# passa a valer o de verdade (passo 5).
# =============================================================
azul "Configurando o nginx"

cat > /etc/nginx/sites-available/confia <<EOF
# =============================================================
# confiia.com.br — configuração do nginx
# Escrita pelo 03-publica.sh. Editar aqui e não lá se perde.
#
# NÃO adicione bloco para confiia.com.br nu: é o site de outra
# pessoa e não passa por esta máquina.
# =============================================================
server {
    listen 80;
    listen [::]:80;
    server_name $SUBDOMINIO;

    # O certbot escreve o arquivo de prova aqui.
    location /.well-known/acme-challenge/ { root /var/www/html; }

    location / { return 301 https://\$host\$request_uri; }
}
EOF

ln -sf /etc/nginx/sites-available/confia /etc/nginx/sites-enabled/confia
rm -f /etc/nginx/sites-enabled/default          # o "Welcome to nginx" some
nginx -t >/dev/null 2>&1 || morre "Configuração do nginx inválida. Rode 'nginx -t' para ver."
systemctl reload nginx
ok "nginx no ar, respondendo por $SUBDOMINIO"

# =============================================================
# 4. O CERTIFICADO
#
# --dry-run primeiro: ele faz o mesmo caminho sem gastar
# tentativa. Se o de mentira falha, o de verdade também falharia,
# e falhar cinco vezes trava o domínio por uma semana.
# =============================================================
azul "Pedindo o certificado"

if [[ -d "/etc/letsencrypt/live/$SUBDOMINIO" ]]; then
  ok "certificado já existe (o certbot renova sozinho)"
else
  certbot certonly --nginx -d "$SUBDOMINIO" --dry-run \
      --non-interactive --agree-tos -m "$EMAIL_CERT" >/dev/null 2>&1 \
    || morre "O ensaio do certbot falhou. Nada foi gasto. Confira o DNS e o firewall (porta 80 aberta)."
  ok "ensaio passou"

  certbot --nginx -d "$SUBDOMINIO" \
      --non-interactive --agree-tos -m "$EMAIL_CERT" \
      --redirect >/dev/null 2>&1 \
    || morre "O certbot falhou de verdade. Veja /var/log/letsencrypt/letsencrypt.log"
  ok "certificado emitido"
fi

systemctl enable certbot.timer >/dev/null 2>&1 || true
ok "renovação automática ligada"

# =============================================================
# 5. A CONFIGURAÇÃO DE VERDADE — HTTPS FORÇADO
#
# Aqui é o item "Forçar HTTPS" da lista de segurança, e ele são
# três coisas, não uma:
#
#   1. A porta 80 não serve o site. Ela só redireciona, com 301.
#      Sem isso, quem digitar o endereço sem https manda a senha
#      em texto puro pela rede antes de qualquer redirecionamento
#      acontecer.
#
#   2. HSTS (`Strict-Transport-Security`). O redirecionamento
#      protege da segunda visita em diante; a PRIMEIRA ainda sai
#      em HTTP. O HSTS manda o navegador lembrar, por dois anos,
#      que este domínio é só HTTPS — e ele deixa de tentar HTTP
#      antes mesmo de sair da máquina.
#
#   3. `includeSubDomains` e `preload`. Com o preload, o domínio
#      entra numa lista que já vem dentro do Chrome e do Firefox:
#      nem a primeira visita sai em HTTP.
#
# ⚠  SOBRE O `preload`: é uma decisão SEM VOLTA na prática. Entrar
#    na lista leva semanas; sair leva MESES, e enquanto isso
#    qualquer subdomínio que não tenha certificado fica
#    inacessível. Ele está escrito abaixo mas COMENTADO. Ligue
#    quando o site estiver estável, não agora.
# =============================================================
azul "Escrevendo a configuração final (HTTPS forçado)"

cat > /etc/nginx/sites-available/confia <<EOF
# =============================================================
# confiia.com.br — configuração do nginx
# Escrita pelo 03-publica.sh.
#
# CUIDADO AO MEXER:
#   - Rodar o 03-publica.sh de novo SOBRESCREVE este arquivo.
#     Mudança feita à mão aqui se perde. Mude no script.
#   - Os cabeçalhos de segurança do NAVEGADOR (CSP, X-Frame) NÃO
#     estão aqui de propósito: eles saem do web/src/proxy.ts, que
#     gera um nonce diferente a cada requisição. Repetir aqui
#     criaria duas políticas brigando, e a mais fraca costuma
#     ganhar. Aqui ficam só os que o Next não tem como mandar.
# =============================================================

# ---------- porta 80: não serve nada, só aponta o caminho ----------
server {
    listen 80;
    listen [::]:80;
    server_name $SUBDOMINIO;

    location /.well-known/acme-challenge/ { root /var/www/html; }

    # 301 e não 302: o navegador guarda o 301 e nem tenta HTTP
    # da próxima vez.
    location / { return 301 https://\$host\$request_uri; }
}

# ---------- porta 443: o site ----------
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name $SUBDOMINIO;

    ssl_certificate     /etc/letsencrypt/live/$SUBDOMINIO/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$SUBDOMINIO/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # ---------- HSTS: o navegador lembra e nem tenta HTTP ----------
    # 63072000 = 2 anos. Menos que 1 ano não conta para a lista de
    # preload, se um dia você ligar.
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
    # Só descomente quando o site estiver estável — ver o aviso no
    # 03-publica.sh. Sair da lista leva meses.
    # add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # ---------- o que o Next não manda ----------
    # Estes três o proxy.ts não cobre, então saem daqui.
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;

    # Não anunciar a versão do nginx: é dizer ao atacante qual
    # lista de falhas consultar.
    server_tokens off;

    # Print de golpe chega em imagem. 12 MB dá folga sobre o
    # limite de 10 MB que a tela mostra — o erro deve vir da
    # nossa mensagem, não de um 413 seco do nginx.
    client_max_body_size 12M;

    location / {
        proxy_pass http://127.0.0.1:$PORTA_NODE;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;

        # Sem estas duas o limite por IP do site vê todo mundo
        # como 127.0.0.1 e vira limite global.
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        proxy_cache_bypass \$http_upgrade;
    }

    # Arquivo estático do Next tem hash no nome: pode cachear
    # para sempre sem medo de servir versão velha.
    location /_next/static/ {
        proxy_pass http://127.0.0.1:$PORTA_NODE;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
EOF

nginx -t >/dev/null 2>&1 || morre "Configuração final do nginx inválida. Rode 'nginx -t'."
systemctl reload nginx
ok "HTTPS forçado: porta 80 só redireciona, HSTS de 2 anos ligado"

# =============================================================
# 6. O SERVIÇO DO SITE
# =============================================================
azul "Ligando o site como serviço"

install -d -o "$USUARIO" -g "$USUARIO" "$PASTA"

cat > /etc/systemd/system/confia.service <<EOF
[Unit]
Description=confia? — site
After=network.target postgresql.service

[Service]
Type=simple
User=$USUARIO
WorkingDirectory=$PASTA
EnvironmentFile=/etc/confia/site.env
ExecStart=/usr/bin/node $PASTA/.next/standalone/server.js
Restart=always
RestartSec=5

# Se acharem buraco no Next, acham um processo sem poder nenhum.
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$PASTA/.next/cache

[Install]
WantedBy=multi-user.target
EOF

if [[ ! -f /etc/confia/site.env ]]; then
  cat > /etc/confia/site.env <<'EOF'
# =============================================================
# confiia.com.br — variáveis do site
#
# PREENCHA À MÃO. O script não inventa estes valores.
#
# ⚠  COFRE_CHAVE: copie a MESMA que está em web/.env.local na sua
#    máquina. Se for outra, todo mundo com segundo fator fica
#    trancado do lado de fora e NÃO TEM COMO VOLTAR. Ver a seção
#    6 do PENDENCIAS.md.
# =============================================================
NODE_ENV=production
PORT=3000
DATABASE_URL=
COFRE_CHAVE=
RESEND_API_KEY=
EOF
  chmod 600 /etc/confia/site.env
  aviso "/etc/confia/site.env criado VAZIO — preencha antes de iniciar o serviço"
fi

systemctl daemon-reload
systemctl enable confia.service >/dev/null 2>&1
ok "serviço confia.service registrado (não iniciado ainda)"

# =============================================================
# 7. O QUE FALTA
# =============================================================
cat <<EOF

=============================================================

  https://$SUBDOMINIO está configurado e com HTTPS forçado.

  FALTA VOCÊ FAZER, nesta ordem:

    1. Preencher /etc/confia/site.env
       - DATABASE_URL: está em /etc/confia/banco.env
       - COFRE_CHAVE:  copie de web/.env.local da sua máquina
                       (a MESMA — ver PENDENCIAS.md seção 6)

    2. Subir o código para $PASTA e compilar:
         cd $PASTA && npm ci && npm run build

    3. Iniciar:
         systemctl start confia

    4. Conferir se as trancas do banco vieram junto:
         cd $PASTA && npm run confere-banco

  O domínio raiz confiia.com.br NÃO foi tocado por este script.

=============================================================

EOF
