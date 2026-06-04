# WinRak - سكريبت تشغيل سريع
# شغّله كـ Administrator: Right-click → Run with PowerShell

Write-Host "🚖 WinRak Startup Script" -ForegroundColor Yellow
Write-Host "========================" -ForegroundColor Yellow

# 1. Redis
Write-Host "`n▶ Starting Redis..." -ForegroundColor Cyan
$redis = Get-Process redis-server -ErrorAction SilentlyContinue
if (-not $redis) {
    Start-Process "C:\Program Files\Redis\redis-server.exe" -WindowStyle Hidden
    Start-Sleep -Seconds 2
}
$ping = & "C:\Program Files\Redis\redis-cli.exe" ping 2>&1
if ($ping -eq "PONG") { Write-Host "  ✅ Redis running" -ForegroundColor Green }
else { Write-Host "  ❌ Redis failed" -ForegroundColor Red }

# 2. PostgreSQL
Write-Host "`n▶ Starting PostgreSQL..." -ForegroundColor Cyan
$pgService = Get-Service "postgresql-x64-17" -ErrorAction SilentlyContinue
if ($pgService -and $pgService.Status -ne "Running") {
    Start-Service "postgresql-x64-17"
    Start-Sleep -Seconds 3
}
if ($pgService.Status -eq "Running") { Write-Host "  ✅ PostgreSQL running" -ForegroundColor Green }
else { Write-Host "  ❌ PostgreSQL not running" -ForegroundColor Red }

# 3. Create DB if not exists
Write-Host "`n▶ Checking database..." -ForegroundColor Cyan
$env:PGPASSWORD = "Djamel31201015@159632100"
$dbExists = & "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h 127.0.0.1 -tAc "SELECT 1 FROM pg_database WHERE datname='winrak';" 2>&1
if ($dbExists -ne "1") {
    & "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h 127.0.0.1 -c "CREATE DATABASE winrak;" 2>&1
    Write-Host "  ✅ Database 'winrak' created" -ForegroundColor Green
} else {
    Write-Host "  ✅ Database 'winrak' exists" -ForegroundColor Green
}

# 4. Backend
Write-Host "`n▶ Starting Backend (port 3000)..." -ForegroundColor Cyan
Start-Process cmd -ArgumentList "/k cd /d C:\winrak\backend && npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3

# 5. Web Dashboard
Write-Host "`n▶ Starting Dashboard (port 5173)..." -ForegroundColor Cyan
Start-Process cmd -ArgumentList "/k cd /d C:\winrak\apps\web-dashboard && npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host "`n✅ WinRak is starting up!" -ForegroundColor Green
Write-Host "   📊 Dashboard:  http://localhost:5173" -ForegroundColor White
Write-Host "   🔌 API:        http://localhost:3000" -ForegroundColor White
Write-Host "   ❤️  Health:     http://localhost:3000/health" -ForegroundColor White
Write-Host "`n   وين راك؟ نجيك! 🚖" -ForegroundColor Yellow

# Open browser
Start-Sleep -Seconds 5
Start-Process "http://localhost:5173"
