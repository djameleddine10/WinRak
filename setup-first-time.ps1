# WinRak - إعداد أول مرة فقط
# شغّله كـ Administrator

Write-Host "🚖 WinRak First-Time Setup" -ForegroundColor Yellow
Write-Host "==========================" -ForegroundColor Yellow

# Restart PostgreSQL to reload config
Write-Host "`n▶ Restarting PostgreSQL service..." -ForegroundColor Cyan
Restart-Service "postgresql-x64-17" -ErrorAction Stop
Start-Sleep -Seconds 4
Write-Host "  ✅ PostgreSQL restarted" -ForegroundColor Green

# Create database
Write-Host "`n▶ Creating database 'winrak'..." -ForegroundColor Cyan
$env:PGPASSWORD = "Djamel31201015@159632100"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h 127.0.0.1 -c "CREATE DATABASE winrak;" 2>&1
Write-Host "  ✅ Done" -ForegroundColor Green

# Install backend deps
Write-Host "`n▶ Installing backend packages..." -ForegroundColor Cyan
Set-Location C:\winrak\backend
& npm install 2>&1 | Select-Object -Last 3
Write-Host "  ✅ Done" -ForegroundColor Green

# Push Prisma schema
Write-Host "`n▶ Creating database tables (Prisma)..." -ForegroundColor Cyan
& npx prisma db push 2>&1 | Select-Object -Last 5
Write-Host "  ✅ Tables created" -ForegroundColor Green

# Install dashboard deps
Write-Host "`n▶ Installing dashboard packages..." -ForegroundColor Cyan
Set-Location C:\winrak\apps\web-dashboard
& npm install 2>&1 | Select-Object -Last 3
Write-Host "  ✅ Done" -ForegroundColor Green

Write-Host "`n✅ Setup complete! Now run: start.ps1 (as Admin)" -ForegroundColor Green
