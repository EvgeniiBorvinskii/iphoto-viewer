@echo off
if not "%1"=="am_admin" (
    powershell -WindowStyle Hidden -Command "Start-Process -FilePath '%~f0' -ArgumentList 'am_admin' -WindowStyle Hidden"
    exit /b
)

cd /d "%~dp0"
npm run dev
