@echo off
echo Testing GitHub CLI installation...
echo.

REM Try to find GitHub CLI in common locations
set "GH_PATH="

REM Check if gh is in PATH
gh --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ GitHub CLI found in PATH
    gh --version
    echo.
    echo Testing authentication...
    gh auth status
    if %errorlevel% equ 0 (
        echo ✅ GitHub CLI is authenticated and ready to use!
        echo.
        echo You can now run: npm run web2apk getapp
    ) else (
        echo ⚠️  GitHub CLI is installed but not authenticated
        echo.
        echo Please run: gh auth login
    )
    goto :end
)

REM Check common installation paths
if exist "C:\Program Files\GitHub CLI\gh.exe" (
    set "GH_PATH=C:\Program Files\GitHub CLI\gh.exe"
    echo ✅ Found GitHub CLI at: %GH_PATH%
) else if exist "C:\Program Files (x86)\GitHub CLI\gh.exe" (
    set "GH_PATH=C:\Program Files (x86)\GitHub CLI\gh.exe"
    echo ✅ Found GitHub CLI at: %GH_PATH%
) else (
    echo ❌ GitHub CLI not found in common locations
    echo.
    echo Please try:
    echo 1. Restart your terminal/command prompt
    echo 2. Or reinstall: winget install GitHub.cli
    goto :end
)

REM Test the found GitHub CLI
echo Testing GitHub CLI...
"%GH_PATH%" --version
if %errorlevel% equ 0 (
    echo.
    echo Testing authentication...
    "%GH_PATH%" auth status
    if %errorlevel% equ 0 (
        echo ✅ GitHub CLI is authenticated and ready to use!
        echo.
        echo You can now run: npm run web2apk getapp
    ) else (
        echo ⚠️  GitHub CLI is installed but not authenticated
        echo.
        echo Please run: "%GH_PATH%" auth login
    )
) else (
    echo ❌ GitHub CLI found but not working properly
)

:end
echo.
pause
