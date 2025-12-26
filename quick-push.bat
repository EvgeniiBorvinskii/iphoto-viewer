@echo off
echo.
echo ================================================
echo   iPhoto Viewer - Quick Push to GitHub
echo ================================================
echo.

git add .
git commit -m "Quick update: %date% %time%"
git push

if errorlevel 1 (
    echo.
    echo Update failed! Check the error above.
    echo.
) else (
    echo.
    echo ================================================
    echo   Successfully pushed to GitHub!
    echo ================================================
    echo.
    echo View at: https://github.com/EvgeniiBorvinskii/iphoto-viewer
    echo.
)

timeout /t 3 >nul
