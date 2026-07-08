# NETRUN OS — rename the placeholder players to the real characters.
# Run from the project folder:  .\scripts\rename.ps1
# Asks for your Supabase secret key, then renames player2..5. Nothing is saved to disk.

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "NETRUN OS - player rename" -ForegroundColor Magenta
Write-Host "--------------------------------"
Write-Host "Get your key from: Supabase Dashboard -> your project -> Settings -> API"
Write-Host "Use the 'service_role' key (legacy) OR a 'secret' key (starts with sb_secret_)."
Write-Host ""

$key = Read-Host "Paste the secret key here, then press Enter"

if ([string]::IsNullOrWhiteSpace($key)) {
  Write-Host "No key entered. Aborting." -ForegroundColor Red
  exit 1
}

$env:SUPABASE_URL = "https://irjfldzilfpkifmylxfp.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = $key.Trim()

Write-Host ""
Write-Host "Renaming..." -ForegroundColor Cyan
node "$PSScriptRoot\rename-players.mjs"

$env:SUPABASE_SERVICE_ROLE_KEY = ""
Write-Host ""
Write-Host "Finished. You can close this window." -ForegroundColor Green
