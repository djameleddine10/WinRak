@echo off
chcp 65001 >nul
title WinRak - بناء APK
echo.
echo  بناء تطبيق WinRak كـ APK مستقل
echo  ═══════════════════════════════
echo.
echo  الخطوة 1: تسجيل الدخول لـ Expo (مجاني)
echo  الخطوة 2: بناء APK للأندرويد
echo.
cd /d C:\winrak\apps\mobile
echo  ▶ تسجيل دخول EAS...
npx eas login
echo.
echo  ▶ بناء APK...
npx eas build --platform android --profile preview
echo.
echo  بعد البناء (10-15 دقيقة) ستحصل على رابط تحميل APK
echo  اسمه في الهاتف: WinRak
pause
