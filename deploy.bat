@echo off
echo ========================================
echo   Deploying Frontend to Vercel
echo ========================================
echo.

REM Check if vercel is installed
where vercel >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Vercel CLI not found. Installing...
    call npm install -g vercel
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install Vercel CLI
        echo Please run: npm install -g vercel
        pause
        exit /b 1
    )
)

echo.
echo Starting deployment...
echo.

REM Deploy to production
call vercel --prod

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   Deployment Successful!
    echo ========================================
) else (
    echo.
    echo ========================================
    echo   Deployment Failed
    echo ========================================
)

echo.
pause
