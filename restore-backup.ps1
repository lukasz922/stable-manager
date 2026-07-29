param(
    [Parameter(Mandatory = $true)]
    [string]$BackupFile
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupFile)) {
    throw "Nie znaleziono pliku kopii: $BackupFile"
}

$resolved = (Resolve-Path $BackupFile).Path
$containerFile = "/tmp/stable_manager_restore.dump"

Write-Host "UWAGA: przywracanie zastąpi zawartość bazy stable_manager."
$confirmation = Read-Host "Wpisz PRZYWRACAM, aby kontynuować"

if ($confirmation -ne "PRZYWRACAM") {
    Write-Host "Anulowano."
    exit 0
}

Write-Host "Zatrzymywanie backendu..."
docker compose stop backend

Write-Host "Kopiowanie pliku do kontenera..."
docker cp $resolved "stable_manager_db:$containerFile"

Write-Host "Rozłączanie aktywnych połączeń..."
docker compose exec -T db psql `
  -U stable_user `
  -d postgres `
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'stable_manager' AND pid <> pg_backend_pid();"

Write-Host "Odtwarzanie bazy..."
docker compose exec -T db dropdb `
  -U stable_user `
  --if-exists stable_manager

docker compose exec -T db createdb `
  -U stable_user `
  stable_manager

docker compose exec -T db pg_restore `
  -U stable_user `
  -d stable_manager `
  --clean `
  --if-exists `
  --no-owner `
  --no-privileges `
  $containerFile

docker compose exec -T db rm -f $containerFile

Write-Host "Uruchamianie backendu..."
docker compose start backend

Write-Host "Przywracanie zakończone."
