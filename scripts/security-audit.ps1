# Security audit script (PowerShell)
# Usage: .\scripts\security-audit.ps1

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$prodUrl = "https://immo-pastler-dashboard.vercel.app"
$supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
$anonKey = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY

if (-not $supabaseUrl -or -not $anonKey) {
  Get-Content ".env", ".env.local" -ErrorAction SilentlyContinue | ForEach-Object {
    if ($_ -match "^NEXT_PUBLIC_SUPABASE_URL=(.+)$") { $supabaseUrl = $Matches[1].Trim() }
    if ($_ -match "^NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)$") { $anonKey = $Matches[1].Trim() }
  }
}

Write-Host "=== Pastler Dashboard Security Audit ===" -ForegroundColor Cyan

Write-Host "`n[1] Secret scan..." -ForegroundColor Yellow
$secretHits = git grep -i "eyJ\|service_role\|sk_live\|sb_secret" -- "*.ts" "*.tsx" "*.js" 2>$null
if ($secretHits) { $secretHits } else { Write-Host "  OK: no secrets in source" -ForegroundColor Green }

Write-Host "`n[2] inhalt_text / console.log in app/..." -ForegroundColor Yellow
$appHits = Get-ChildItem -Path "app" -Recurse -Include "*.ts","*.tsx" -ErrorAction SilentlyContinue |
  Select-String -Pattern "inhalt_text|console\.log"
if ($appHits) { $appHits } else { Write-Host "  OK: none found" -ForegroundColor Green }

Write-Host "`n[3] Partner tables not queried without role gate..." -ForegroundColor Yellow
$partnerHits = Get-ChildItem -Path "app" -Recurse -Include "*.ts","*.tsx" -ErrorAction SilentlyContinue |
  Select-String -Pattern "pastler_partner|partnerNachrichten" |
  Where-Object { $_.Path -notmatch "api[/\\]partner|partner[/\\]|todos[/\\]page|inserate[/\\]\[id\]" }
if ($partnerHits) { $partnerHits } else { Write-Host "  OK: partner queries gated to partner routes" -ForegroundColor Green }

Write-Host "`n[4] npm audit (high+)..." -ForegroundColor Yellow
npm audit --audit-level=high 2>&1

Write-Host "`n[5] type-check..." -ForegroundColor Yellow
npm run type-check 2>&1
if ($LASTEXITCODE -eq 0) { Write-Host "  OK" -ForegroundColor Green }

Write-Host "`n[6] build..." -ForegroundColor Yellow
npm run build 2>&1
if ($LASTEXITCODE -eq 0) { Write-Host "  OK" -ForegroundColor Green }

Write-Host "`n[7] API 401 without session (GET, read-only auth check)..." -ForegroundColor Yellow
$baseUrl = $env:AUDIT_BASE_URL
if (-not $baseUrl) { $baseUrl = $prodUrl }
$todoGet = curl.exe -s -o NUL -w "%{http_code}" "$baseUrl/api/todos/00000000-0000-0000-0000-000000000001"
$partnerGet = curl.exe -s -o NUL -w "%{http_code}" "$baseUrl/api/partner"
if ($todoGet -eq "401" -and $partnerGet -eq "401") {
  Write-Host "  OK: todos=$todoGet partner=$partnerGet ($baseUrl)" -ForegroundColor Green
} else {
  Write-Host "  FAIL: todos=$todoGet partner=$partnerGet on $baseUrl (expected 401)" -ForegroundColor Red
  Write-Host "  Hint: set AUDIT_BASE_URL=http://localhost:3002 for local dev server" -ForegroundColor DarkYellow
}

Write-Host "`n[8] Security headers ($baseUrl/login)..." -ForegroundColor Yellow
$headers = curl.exe -sI "$baseUrl/login"
$required = @("Strict-Transport-Security", "Content-Security-Policy", "X-Frame-Options")
foreach ($h in $required) {
  if ($headers -match "(?i)$h") {
    Write-Host "  OK: $h" -ForegroundColor Green
  } else {
    Write-Host "  FAIL: $h missing" -ForegroundColor Red
  }
}

Write-Host "`n[9] Anon key RLS (empty arrays)..." -ForegroundColor Yellow
if ($supabaseUrl -and $anonKey) {
  $tables = @("pastler_inserate", "pastler_mieter", "pastler_todos", "pastler_emails", "pastler_partner", "pastler_partner_nachrichten")
  foreach ($table in $tables) {
    $body = curl.exe -s "$supabaseUrl/rest/v1/${table}?select=id&limit=1" `
      -H "apikey: $anonKey" -H "Authorization: Bearer $anonKey"
    if ($body -eq "[]") {
      Write-Host "  OK: $table -> []" -ForegroundColor Green
    } else {
      Write-Host "  FAIL: $table -> $body" -ForegroundColor Red
    }
  }
} else {
  Write-Host "  SKIP: Supabase env not loaded" -ForegroundColor DarkYellow
}

Write-Host "`n[10] Vercel env (requires vercel CLI)..." -ForegroundColor Yellow
vercel env ls 2>&1

Write-Host "`nDone. Manual steps: docs/AUDIT_ARBEITSPLAN.md (Phases C, F, G)" -ForegroundColor Cyan
