#!/usr/bin/env pwsh
# ProphetLedger Deployment Script for Vercel + Supabase

Write-Host "🔮 ProphetLedger Deployment" -ForegroundColor Magenta
Write-Host "=========================" -ForegroundColor Magenta

# Step 1: Check prerequisites
Write-Host "`n📋 Checking prerequisites..." -ForegroundColor Cyan
$vercelExists = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelExists) {
    Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

# Step 2: Deploy Supabase Edge Functions (if supabase CLI installed)
$supabaseExists = Get-Command supabase -ErrorAction SilentlyContinue
if ($supabaseExists) {
    Write-Host "`n🚀 Deploying Supabase Edge Functions..." -ForegroundColor Cyan
    supabase functions deploy anomaly-detection
    supabase functions deploy forecast
    supabase functions deploy classification
} else {
    Write-Host "Supabase CLI not installed. Skipping edge functions deployment." -ForegroundColor Yellow
}

# Step 3: Deploy to Vercel
Write-Host "`n🚀 Deploying to Vercel..." -ForegroundColor Cyan
vercel --prod

Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
Write-Host "📍 Frontend: https://prophetledger.vercel.app" -ForegroundColor Cyan
Write-Host "📍 API: https://prophetledger.vercel.app/api" -ForegroundColor Cyan
