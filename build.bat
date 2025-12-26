@echo off
echo ================================================
echo   iPhoto Viewer - Build for Production
echo ================================================
echo.
echo Building the application for Windows...
echo This may take a few minutes...
echo.

npm run build:win

echo.
echo ================================================
echo Build complete!
echo.
echo The installer can be found in:
echo   ./release/
echo ================================================
pause
