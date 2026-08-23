# =============================================================
# confiia.com.br — traz o backup do banco para esta máquina
#
# POR QUE ISTO EXISTE:
# O servidor já faz backup sozinho todo dia às 3:30. Mas backup
# que mora na mesma máquina não protege contra a máquina morrer —
# e VPS morre: disco falha, conta é suspensa, alguém apaga sem
# querer. Só vale como backup o que está em OUTRO lugar.
#
# Roda a cada 3 dias, sozinho, pela Tarefa Agendada do Windows.
# Se o computador estiver desligado na hora, ele roda assim que
# ligar (a tarefa é criada com StartWhenAvailable).
#
# ATENÇÃO — O QUE TEM DENTRO DESTES ARQUIVOS:
# Cópia do banco = e-mail, telefone e relato de vítima de golpe.
# É dado pessoal de gente real. A pasta `backups/` está no
# .gitignore de propósito. Não mande esses arquivos por e-mail,
# não coloque em pasta compartilhada, não suba para lugar nenhum.
#
# Rodar na mão:  powershell -File servidor\baixa-backup.ps1
# =============================================================

# NOTA SOBRE ESTE ARQUIVO:
# Ele está gravado em UTF-8 COM BOM. Não converta para UTF-8 sem BOM:
# o PowerShell 5.1 do Windows lê .ps1 sem BOM como ANSI, e aí todo
# acento vira lixo e o script para de rodar com erro de sintaxe.

$ErrorActionPreference = 'Stop'

# A pasta do projeto é a que contém a pasta 'servidor'
$raiz    = Split-Path -Parent $PSScriptRoot
$destino = Join-Path $raiz 'backups'
$manter  = 10   # quantas cópias guardar aqui

if (-not (Test-Path $destino)) { New-Item -ItemType Directory -Path $destino | Out-Null }

Write-Output ("[{0}] buscando backup na VPS..." -f (Get-Date -Format 'dd/MM/yyyy HH:mm'))

# Lista o que existe lá
$remotos = & ssh -o BatchMode=yes confia-vps 'ls -1 /var/backups/confia/*.sql.gz 2>/dev/null'
if ($LASTEXITCODE -ne 0 -or -not $remotos) {
    Write-Error "Não consegui falar com a VPS, ou não há backup lá."
}

$novos = 0
foreach ($caminho in $remotos) {
    $nome  = Split-Path $caminho -Leaf
    $local = Join-Path $destino $nome
    if (Test-Path $local) { continue }   # já tenho este

    & scp -q -o BatchMode=yes "confia-vps:$caminho" $local
    if ($LASTEXITCODE -eq 0) {
        $kb = [math]::Round((Get-Item $local).Length / 1KB, 1)
        Write-Output ("  baixado: {0} ({1} KB)" -f $nome, $kb)
        $novos++
    } else {
        Write-Warning ("  falhou: {0}" -f $nome)
    }
}

if ($novos -eq 0) { Write-Output "  nada novo — já estava tudo aqui" }

# Backup vazio é backup que não existe. Confere o mais recente.
$ultimo = Get-ChildItem $destino -Filter '*.sql.gz' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($ultimo -and $ultimo.Length -lt 2000) {
    Write-Warning ("O backup mais recente tem só {0} bytes. Isso é suspeito — confira o banco." -f $ultimo.Length)
}

# Guarda só as N cópias mais recentes
Get-ChildItem $destino -Filter '*.sql.gz' |
    Sort-Object LastWriteTime -Descending |
    Select-Object -Skip $manter |
    ForEach-Object { Remove-Item $_.FullName -Force; Write-Output ("  apagado (antigo): " + $_.Name) }

$total = (Get-ChildItem $destino -Filter '*.sql.gz').Count
Write-Output ("  pronto — {0} cópia(s) em {1}" -f $total, $destino)
