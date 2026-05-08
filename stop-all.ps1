# ProphetLedger - Simple Stop Script

Write-Host "🛑 Stopping ProphetLedger services..." -ForegroundColor Yellow

# Stop Node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "  ✅ Stopped Node/React"

# Stop Python processes
Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*uvicorn*" } | Stop-Process -Force
Write-Host "  ✅ Stopped Python/Uvicorn"

# Stop Docker container
docker stop prophetledger-db 2>$null
Write-Host "  ✅ Stopped PostgreSQL"

Write-Host "`n✅ All services stopped!" -ForegroundColor Green
