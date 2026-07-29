$ErrorActionPreference = "Stop"

$backupDir = Join-Path $PSScriptRoot "backups"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$containerFile = "/tmp/stable_manager_$timestamp.dump"
$hostFile = Join-Path $backupDir "stable_manager_$timestamp.dump"

Write-Host "Tworzenie kopii bazy..."
docker compose exec -T db pg_dump `
  -U stable_user `
  -d stable_manager `
  --format=custom `
  --compress=9 `
  --no-owner `
  --no-privileges `
  --file=$containerFile

docker cp "stable_manager_db:$containerFile" $hostFile
docker compose exec -T db rm -f $containerFile

Write-Host "Gotowe: $hostFile"
