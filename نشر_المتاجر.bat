@echo off
chcp 65001 >nul
title WinRak - النشر على المتاجر
color 0B

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║   🚖 WinRak — نشر على Play Store & App Store ║
echo  ╚══════════════════════════════════════════════╝
echo.

:menu
echo  اختر ما تريد بناءه:
echo.
echo  [1] APK للأندرويد (تجريبي - للتثبيت المباشر)
echo  [2] AAB للأندرويد (Play Store - للنشر الرسمي)
echo  [3] IPA للـ iPhone (App Store - للنشر الرسمي)
echo  [4] كلاهما معاً (أندرويد + iOS)
echo  [5] رفع مباشر لـ Play Store (Internal Testing)
echo  [6] خروج
echo.

set /p choice="أدخل رقم الاختيار: "

cd /d C:\winrak\apps\mobile

if "%choice%"=="1" goto android_apk
if "%choice%"=="2" goto android_aab
if "%choice%"=="3" goto ios_ipa
if "%choice%"=="4" goto both
if "%choice%"=="5" goto submit_play
if "%choice%"=="6" exit

:android_apk
echo.
echo  ▶ بناء APK للأندرويد (التثبيت المباشر)...
echo  ⏳ يستغرق 10-15 دقيقة على خوادم Expo...
echo.
npx eas build --platform android --profile preview --non-interactive
echo.
echo  ✅ اكتمل! سيظهر رابط تحميل APK أعلاه
echo  انسخ الرابط وشاركه للمختبرين للتثبيت المباشر
goto end

:android_aab
echo.
echo  ▶ بناء AAB للـ Play Store...
npx eas build --platform android --profile production --non-interactive
echo  ✅ جاهز لرفعه على Google Play Console
goto end

:ios_ipa
echo.
echo  ▶ بناء IPA للـ App Store...
echo  ⚠️  تأكد أن لديك Apple Developer Account ($99/سنة)
npx eas build --platform ios --profile production --non-interactive
echo  ✅ جاهز لرفعه على App Store Connect
goto end

:both
echo.
echo  ▶ بناء للمنصتين معاً...
npx eas build --platform all --profile production --non-interactive
goto end

:submit_play
echo.
echo  ▶ رفع مباشر لـ Play Store - Internal Testing...
npx eas submit --platform android --latest
goto end

:end
echo.
pause
