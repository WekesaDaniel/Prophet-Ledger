Write-Host "🚀 Starting ProphetLedger Backend..." -ForegroundColor Cyan
cd C:\Users\danie\OneDrive\Desktop\ProphetLedger\backend
.\venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
