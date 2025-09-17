@echo off
echo Installing GitHub CLI...
echo.

REM Check if winget is available
winget --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Using winget to install GitHub CLI...
    winget install GitHub.cli
    if %errorlevel% equ 0 (
        echo.
        echo ✅ GitHub CLI installed successfully!
        echo.
        echo Next steps:
        echo 1. Restart your terminal/command prompt
        echo 2. Run: gh auth login
        echo 3. Follow the authentication steps
        echo 4. Then you can use: npm run web2apk getapp
    ) else (
        echo ❌ Failed to install GitHub CLI using winget
        echo.
        echo Please install manually from: https://cli.github.com/
    )
) else (
    echo ❌ winget is not available on this system
    echo.
    echo Please install GitHub CLI manually:
    echo 1. Go to: https://cli.github.com/
    echo 2. Download and install GitHub CLI
    echo 3. Run: gh auth login
    echo 4. Then you can use: npm run web2apk getapp
)

echo.
pause
