@echo off
cd /d "%~dp0"
echo Pushing latest files to GitHub...
git add -A
git commit -m "manual deploy %date% %time%"
git push origin main
echo.
echo Done (if no errors). Render will redeploy in ~1-2 min.
pause
