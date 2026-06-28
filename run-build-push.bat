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
git commit -m "feat: votre message de commit ici"

git push origin main

echo.
echo === DONE ===
echo Vercel deploie automatiquement depuis main.
echo URL : https://ueemt-tokat.vercel.app
echo.
pause
