# NETRUN OS — friendly one-step account seeder.
# Run this from the project folder:  .\scripts\seed.ps1
# It asks for your Supabase secret key, then creates the 6 accounts + Steven's sheet.
# Nothing is saved to disk; the key is used only for this one run.

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "NETRUN OS - account seeder" -ForegroundColor Magenta
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
Write-Host "Seeding..." -ForegroundColor Cyan
node "$PSScriptRoot\seed-accounts.mjs"

# Clear the key from this shell's memory when done.
$env:SUPABASE_SERVICE_ROLE_KEY = ""
Write-Host ""
Write-Host "Finished. You can close this window." -ForegroundColor Green
