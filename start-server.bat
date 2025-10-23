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
