# =============================================================
# confiia.com.br — agenda o backup automatico
#
# Roda UMA vez. Depois disso o Windows cuida sozinho: a cada
# 3 dias ele baixa o backup do banco da VPS para esta maquina.
#
# Se o computador estiver desligado na hora, ele roda assim que
# voce ligar (StartWhenAvailable).
#
# COMO RODAR:
#   Abra o PowerShell nesta pasta e cole:
#       powershell -ExecutionPolicy Bypass -File servidorgenda-backup.ps1
#
# PARA DESLIGAR DEPOIS:
#       Unregister-ScheduledTask -TaskName confia-backup -Confirm:$false
# =============================================================

$ErrorActionPreference = 'Stop'

$nome   = 'confia-backup'
$script = Join-Path $PSScriptRoot 'baixa-backup.ps1'

if (-not (Test-Path $script)) { Write-Error "Nao achei $script" }

# Remove agendamento anterior, se existir
try { Unregister-ScheduledTask -TaskName $nome -Confirm:$false -ErrorAction Stop } catch {}

$acao = New-ScheduledTaskAction -Execute 'powershell.exe' `
    -Argument ('-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "{0}"' -f $script)

# A cada 3 dias, as 19h
$gatilho = New-ScheduledTaskTrigger -Daily -DaysInterval 3 -At 19:00

$config = New-ScheduledTaskSettingsSet -StartWhenAvailable `
    -DontStopIfGoingOnBatteries -AllowStartIfOnBatteries `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 10)

Register-ScheduledTask -TaskName $nome -Action $acao -Trigger $gatilho -Settings $config `
    -Description 'Baixa o backup do banco do confia? da VPS para esta maquina, a cada 3 dias.' | Out-Null

$info = Get-ScheduledTaskInfo -TaskName $nome
Write-Output ''
Write-Output "  Agendado. A cada 3 dias, as 19h."
Write-Output ("  Proxima vez: {0}" -f $info.NextRunTime)
Write-Output ''
Write-Output "  Rodar agora, sem esperar:"
Write-Output "      Start-ScheduledTask -TaskName $nome"
Write-Output ''
