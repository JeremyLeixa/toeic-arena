# deploy-edge-functions.ps1
# Redeploy Supabase Edge Functions after the Verse Arena rename + domain migration.
#
# What it does:
#   1. Updates the function secrets to the new app domain (app.verse-arena.fr)
#   2. Redeploys the 2 functions that carry brand text / app URLs
#
# Prereqs:
#   - Supabase CLI installed         (https://supabase.com/docs/guides/cli)
#   - Logged in                      (run: supabase login)
#   - Project linked (ref huklmklwvwwhhrrcyytq) -- already done in this repo
#   - Run from the repo root
#
# Usage (PowerShell):   .\scripts\deploy-edge-functions.ps1

$ErrorActionPreference = "Stop"

function Step($desc, [scriptblock]$cmd) {
    Write-Host ""
    Write-Host "==> $desc" -ForegroundColor Cyan
    & $cmd
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAILED (exit $LASTEXITCODE): $desc" -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

# Sanity check: CLI present
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "Supabase CLI not found on PATH. Install it first, then 'supabase login'." -ForegroundColor Red
    exit 1
}

# --- 1. Secrets (new domain) ---
# APP_URL feeds the password-reset email link; VERCEL_APP_URL feeds the streak push URL.
Step "Set APP_URL secret"        { supabase secrets set APP_URL="https://app.verse-arena.fr" }
Step "Set VERCEL_APP_URL secret" { supabase secrets set VERCEL_APP_URL="https://app.verse-arena.fr" }

# Optional: only if RESEND_FROM was previously set with the OLD brand name.
# If RESEND_FROM is unset, the function code already defaults to "Verse Arena <onboarding@resend.dev>".
# Uncomment to force it:
# Step "Set RESEND_FROM secret" { supabase secrets set RESEND_FROM="Verse Arena <onboarding@resend.dev>" }

# --- 2. Deploy the functions touched by the rename ---
Step "Deploy password-reset-request" { supabase functions deploy password-reset-request }
Step "Deploy streak-reminder"        { supabase functions deploy streak-reminder }

Write-Host ""
Write-Host "Done. Verify with: supabase functions list" -ForegroundColor Green
Write-Host "Reminder: also confirm the Vercel env vars (RESEND_FROM for feedback-send) point to the new brand if previously set." -ForegroundColor Yellow
