@echo off
title UEEMT Build + Push
cd /d "C:\Users\pc\Documents\GitHub\ueemt-tokat"

echo.
echo === npm run build ===
call npm run build
if %errorlevel% neq 0 (
  echo.
  echo BUILD ECHOUE - corriger les erreurs TypeScript avant de continuer.
  pause
  exit /b %errorlevel%
)

echo.
echo === git add + commit + push ===
git add -A
git commit -m "feat: PWA icon fix + UX v2 ameliorations

- Route /api/pwa-icon : icone PWA dynamique depuis Supabase site_settings
- manifest.json pointe vers /api/pwa-icon (toujours a jour si logo change)
- layout.tsx : apple-touch-icon + meta icon vers /api/pwa-icon
- FeedClient : reactions emoji 👍 ❤️ 🎉 avec picker au survol + animation pop
- DashboardClient : avatar dans le header, completion profil avec barre %, onglet Activites utile
- MembresClient : hover -translate-y-1 + shadow-lg
- globals.css : keyframes animate-reaction-pop"

git push origin main

echo.
echo === DONE ===
echo Vercel deploie automatiquement depuis main.
echo URL : https://ueemt-tokat.vercel.app
echo.
pause
