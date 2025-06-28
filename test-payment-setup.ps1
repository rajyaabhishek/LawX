# Test Payment System
Write-Host " Testing Payment System Configuration..." -ForegroundColor Cyan

# Check .env file
Write-Host "
 Checking .env configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host " .env file exists" -ForegroundColor Green
     = Get-Content .env
    
    # Check key variables
     =  | Where-Object {  -like "NODE_ENV=*" }
     =  | Where-Object {  -like "CASHFREE_ENVIRONMENT=*" }
     =  | Where-Object {  -like "CLIENT_URL=*" }
    
    Write-Host "  NODE_ENV: " -ForegroundColor White
    Write-Host "  CASHFREE_ENVIRONMENT: " -ForegroundColor White  
    Write-Host "  CLIENT_URL: " -ForegroundColor White
} else {
    Write-Host " .env file not found" -ForegroundColor Red
}

# Check frontend .env
Write-Host "
 Checking frontend/.env..." -ForegroundColor Yellow
if (Test-Path "frontend/.env") {
    Write-Host " frontend/.env exists" -ForegroundColor Green
} else {
    Write-Host " frontend/.env not found" -ForegroundColor Red
}

Write-Host "
 Ready to test payment system!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Start backend: cd backend && npm start" -ForegroundColor White
Write-Host "2. Start frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host "3. Go to: http://localhost:5173/premium" -ForegroundColor White
Write-Host "4. Test payment flow with sandbox credentials" -ForegroundColor White
