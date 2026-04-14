
# SHS Portal Installation Script (Windows PowerShell)
Write-Host "Installing SHS Portal..." -ForegroundColor Green

# Frontend
Set-Location cid-shs-portal/frontend
npm install
npm run dev

Write-Host "Frontend running on localhost:5175" -ForegroundColor Yellow

# Backend (separate terminal)
Write-Host "Backend: cd cid-shs-portal/backend && npm install && npm start" -ForegroundColor Cyan

Write-Host "Complete!" -ForegroundColor Green

