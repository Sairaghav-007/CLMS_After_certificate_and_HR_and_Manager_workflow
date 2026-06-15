# PostgreSQL Database Backup Script
$ErrorActionPreference = "Stop"

# Configuration
$PgDumpPath = "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe"
$DbUser = "postgres"
$DbPort = "5432"
$DbHost = "localhost"
$BackupDir = "d:\Postgresql"
$Databases = @("postgres", "LMS_V1")

# Set Password Env Var (dynamically prompt if not set)
if (-not $env:PGPASSWORD) {
    $env:PGPASSWORD = Read-Host -Prompt "Enter PostgreSQL password for '$DbUser'"
}

# Ensure backup directory exists
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

Write-Host "Starting PostgreSQL backups to $BackupDir..." -ForegroundColor Cyan

foreach ($db in $Databases) {
    $backupFile = Join-Path $BackupDir "$db`_-backup.sql"
    Write-Host "Exporting database '$db' to '$backupFile'..." -ForegroundColor Yellow
    
    try {
        & $PgDumpPath -h $DbHost -p $DbPort -U $DbUser -d $db -f $backupFile --clean --if-exists
        $fileSize = (Get-Item $backupFile).Length
        Write-Host "Successfully exported '$db' ($fileSize bytes)." -ForegroundColor Green
    }
    catch {
        Write-Error "Failed to backup database '$db': $_"
    }
}

# Clear password from environment
$env:PGPASSWORD = $null
Write-Host "All backups completed!" -ForegroundColor Cyan
