# register_dev_task.ps1
# Lit SYNC_INTERVAL_MINUTES depuis .env et (re)crée la tâche planifiée
# Windows équivalente au cron de prod, avec le même intervalle.
# À relancer chaque fois que SYNC_INTERVAL_MINUTES change dans .env.
#
# Usage (PowerShell, depuis le dossier du projet) :
#   .\register_dev_task.ps1

$envFile = Join-Path $PSScriptRoot ".env"
$line = Get-Content $envFile | Where-Object { $_ -match '^SYNC_INTERVAL_MINUTES=' }

if (-not $line) {
    Write-Error "SYNC_INTERVAL_MINUTES introuvable dans .env"
    exit 1
}

$minutes = ($line -split '=')[1].Trim()
$taskName = "AFI-SyncYoutubeEtStats"
$batPath = Join-Path $PSScriptRoot "run_sync.bat"

if (-not (Test-Path $batPath)) {
    Write-Error "run_sync.bat introuvable à côté de ce script ($batPath)"
    exit 1
}

# Supprime l'ancienne tâche si elle existe déjà, pour repartir propre.
schtasks /Delete /TN $taskName /F 2>$null | Out-Null

schtasks /Create /TN $taskName /TR "`"$batPath`"" /SC MINUTE /MO $minutes /RL LIMITED /F

Write-Host "Tâche '$taskName' planifiée toutes les $minutes minutes."