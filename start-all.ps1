Write-Host "🔮 Starting ProphetLedger - Full Stack" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

# Start backend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Users\danie\OneDrive\Desktop\ProphetLedger; .\start-backend.ps1"

# Wait a few seconds
Start-Sleep -Seconds 3

# Start frontend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Users\danie\OneDrive\Desktop\ProphetLedger; .\start-frontend.ps1"

Write-Host "✅ Backend starting at: http://localhost:8000" -ForegroundColor Green
Write-Host "✅ Frontend starting at: http://localhost:3000" -ForegroundColor Green
Write-Host "📝 API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
