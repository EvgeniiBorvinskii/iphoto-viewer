@echo off
echo.
echo ================================================
echo   iPhoto Viewer - Update GitHub Repository
echo ================================================
echo.

REM Check if there are changes to commit
git status --porcelain > nul 2>&1
if errorlevel 1 (
    echo Error: Not a git repository!
    pause
    exit /b 1
)

echo Checking for changes...
git status --short

echo.
set /p commit_msg="Enter commit message (or press Enter for default): "

if "%commit_msg%"=="" (
    set commit_msg=Update: %date% %time%
)

echo.
echo Adding all changes...
git add .

echo.
echo Creating commit: %commit_msg%
git commit -m "%commit_msg%"

if errorlevel 1 (
    echo.
    echo No changes to commit or commit failed.
    echo.
) else (
    echo.
    echo Pushing to GitHub...
    git push

    if errorlevel 1 (
        echo.
        echo Push failed! Please check your connection and credentials.
        echo.
    ) else (
        echo.
        echo ================================================
        echo   Successfully updated GitHub repository!
        echo ================================================
        echo.
        echo Your project is now available at:
        echo https://github.com/EvgeniiBorvinskii/iphoto-viewer
        echo.
    )
)

pause
