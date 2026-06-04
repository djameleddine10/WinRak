@echo off
chcp 65001 >nul
title WinRak - تشغيل التطبيق
color 0A

echo.
echo  ╔═══════════════════════════════════════╗
echo  ║     🚖  WinRak - وين راك نجيك!       ║
echo  ╚═══════════════════════════════════════╝
echo.

:: ─── أوقف العمليات القديمة على المنافذ المطلوبة ───
echo  ▶ تنظيف المنافذ القديمة...

for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000 "') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":5173 "') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul
echo  ✅ المنافذ جاهزة

:: ─── Redis (اختياري) ───
if exist "C:\Program Files\Redis\redis-server.exe" (
    echo  ▶ تشغيل Redis...
    start "" /min "C:\Program Files\Redis\redis-server.exe"
    timeout /t 2 /nobreak >nul
)

:: ─── Backend ───
echo  ▶ تشغيل Backend API...
start "WinRak - Backend :3000" cmd /k "cd /d C:\winrak\backend && npm run dev"
timeout /t 10 /nobreak >nul

:: ─── Dashboard ───
echo  ▶ تشغيل لوحة التحكم...
start "WinRak - Dashboard :5173" cmd /k "cd /d C:\winrak\apps\web-dashboard && npm run dev"
timeout /t 6 /nobreak >nul

:: ─── فتح المتصفح ───
start "" http://localhost:5173

echo.
echo  ════════════════════════════════════════
echo  ✅ WinRak جاهز للتجربة!
echo  ════════════════════════════════════════
echo.
echo  📊 لوحة التحكم:  http://localhost:5173
echo  🔌 Backend API:  http://localhost:3000/health
echo.
echo  📱 حسابات الاختبار:
echo     الراكب : +213555000001  ^|  OTP: 000000
echo     السائق : +213660000001  ^|  OTP: 000000
echo.
echo  💡 في المستقبل: انقر مرتين على هذا الملف فقط
echo  ════════════════════════════════════════
echo.
pause
