@echo off
setlocal
cd /d "%~dp0"
echo ==============================================
echo    OVERCLOCK  -  one-time auto-deploy setup
echo ==============================================
echo.
where git >nul 2>nul
if errorlevel 1 (
  echo [!] Git is not installed on this PC.
  echo     1^) Download "Git for Windows": https://git-scm.com/download/win
  echo     2^) Install it ^(all default options are fine^)
  echo     3^) Double-click this file again.
  echo.
  pause
  exit /b 1
)
echo Initializing repository in this folder...
git init
git config user.email "marius.sisden@gmail.com"
git config user.name "Lichking16"
git branch -M main
git remote remove origin >nul 2>nul
git remote add origin https://github.com/Lichking16/overclock-server.git
git add -A
git commit -m "sync local OVERCLOCK server"
echo.
echo Pushing to GitHub. A sign-in window may pop up -- log in as Lichking16.
echo.
git push -u origin main --force
echo.
echo ----------------------------------------------
echo If there are NO errors above, you are all set.
echo Next: double-click  deploy-watch.bat  to start
echo hands-free auto-deploy, and leave that window open.
echo ----------------------------------------------
echo.
pause
