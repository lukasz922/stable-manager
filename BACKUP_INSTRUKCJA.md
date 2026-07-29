# Kopie zapasowe StableManager

## Automatyczne kopie

Usługa `db-backup`:

- tworzy kopię po uruchomieniu kontenera,
- wykonuje kolejną kopię co 24 godziny,
- zapisuje pliki w folderze `backups`,
- przechowuje kopie przez 14 dni,
- używa formatu PostgreSQL Custom (`.dump`).

Uruchomienie:

```powershell
docker compose up -d --build
```

Kontrola:

```powershell
docker compose ps
docker compose logs db-backup --tail=100
Get-ChildItem .\backups
```

## Ręczna kopia

```powershell
powershell -ExecutionPolicy Bypass -File .\backup-now.ps1
```

## Przywracanie

```powershell
powershell -ExecutionPolicy Bypass -File .\restore-backup.ps1 -BackupFile ".\backups\stable_manager_2026-07-28_23-00-00.dump"
```

Przywracanie zatrzymuje backend, odtwarza bazę i ponownie uruchamia backend.
