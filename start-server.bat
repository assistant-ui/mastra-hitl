@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Human-in-the-Loop AI Assistant
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed
    echo Please install Node.js from https://nodejs.org/
    echo Recommended version: 18.x or higher
    pause
    exit /b 1
)

REM Display Node.js version
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [OK] Node.js %NODE_VERSION% detected
echo.

REM Check for git updates
where git >nul 2>nul
if %errorlevel% equ 0 (
    if exist .git (
        echo Checking for updates...
        git fetch 2>nul

        REM Get current branch
        for /f "tokens=*" %%i in ('git branch --show-current 2^>nul') do set CURRENT_BRANCH=%%i

        if not "!CURRENT_BRANCH!"=="" (
            REM Get local and remote commits
            for /f "tokens=*" %%i in ('git rev-parse !CURRENT_BRANCH! 2^>nul') do set LOCAL_COMMIT=%%i
            for /f "tokens=*" %%i in ('git rev-parse origin/!CURRENT_BRANCH! 2^>nul') do set REMOTE_COMMIT=%%i

            if not "!LOCAL_COMMIT!"=="!REMOTE_COMMIT!" (
                REM Check if local is behind remote
                for /f "tokens=*" %%i in ('git rev-list --count !CURRENT_BRANCH!..origin/!CURRENT_BRANCH! 2^>nul') do set BEHIND_COUNT=%%i

                if !BEHIND_COUNT! gtr 0 (
                    echo There are !BEHIND_COUNT! new commit(s) available on origin/!CURRENT_BRANCH!.
                    set /p PULL_UPDATES="Would you like to pull the updates? (y/n): "
                    if /i "!PULL_UPDATES!"=="y" (
                        echo Pulling updates...
                        git pull
                        echo [OK] Updates applied successfully
                        echo.
                    ) else (
                        echo Continuing without pulling updates.
                        echo.
                    )
                ) else (
                    echo [OK] No updates available
                    echo.
                )
            ) else (
                echo [OK] No updates available
                echo.
            )
        )
    )
)

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed
    echo Please install npm (usually comes with Node.js)
    pause
    exit /b 1
)

REM Install dependencies
echo Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo [OK] Dependencies installed
echo.

REM Start the development server
echo Starting development server...
echo The application will open in your browser automatically.
echo.

REM Open browser after a short delay (in background)
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

REM Start the dev server
call npm run dev
