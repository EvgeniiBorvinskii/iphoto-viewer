@echo off

REM Auto-update to GitHub silently
cd /d "%~dp0"

git add . >nul 2>&1
git commit -m "Auto-update: %date% %time%" >nul 2>&1
git push >nul 2>&1

exit
