Write-Host "Fetching Vercel Project IDs..." -ForegroundColor Cyan
Write-Host ""

# Get Vercel Org ID
$orgInfo = vercel whoami
Write-Host "Organization Info:" -ForegroundColor Yellow
Write-Host $orgInfo
Write-Host ""

# Get projects list with IDs
Write-Host "Projects List:" -ForegroundColor Yellow
vercel projects list

Write-Host ""
Write-Host "To get Project IDs manually:" -ForegroundColor Green
Write-Host "1. Go to https://vercel.com/dashboard"
Write-Host "2. Click on your project"
Write-Host "3. Go to Settings → General"
Write-Host "4. Copy the 'Project ID' (starts with 'prj_')"
Write-Host ""
Write-Host "Required Secrets for GitHub:" -ForegroundColor Magenta
Write-Host "VERCEL_ORG_ID - Your organization ID"
Write-Host "VERCEL_PROJECT_ID_FRONTEND - Project ID for prophet-ledger"
Write-Host "VERCEL_PROJECT_ID_BACKEND - Project ID for prophetledger-api"
Write-Host "VERCEL_TOKEN - Your Vercel access token"
