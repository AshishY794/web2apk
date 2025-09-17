@echo off
echo Setting up GitHub CLI authentication...
echo.

REM Try different GitHub CLI paths
set "GH_EXE="

if exist "C:\Program Files\GitHub CLI\gh.exe" (
    set "GH_EXE=C:\Program Files\GitHub CLI\gh.exe"
    echo ✅ Found GitHub CLI at: %GH_EXE%
) else if exist "C:\Program Files (x86)\GitHub CLI\gh.exe" (
    set "GH_EXE=C:\Program Files (x86)\GitHub CLI\gh.exe"
    echo ✅ Found GitHub CLI at: %GH_EXE%
) else (
    echo ❌ GitHub CLI not found. Please install it first:
    echo    winget install GitHub.cli
    echo    Then restart your terminal and run this script again.
    pause
    exit /b 1
)

echo.
echo Testing GitHub CLI...
"%GH_EXE%" --version
if %errorlevel% neq 0 (
    echo ❌ GitHub CLI found but not working properly
    pause
    exit /b 1
)

echo.
echo Starting GitHub CLI authentication...
echo This will open a browser window for authentication.
echo.
pause

"%GH_EXE%" auth login
if %errorlevel% equ 0 (
    echo.
    echo ✅ GitHub CLI authentication successful!
    echo.
    echo Testing connection...
    "%GH_EXE%" auth status
    if %errorlevel% equ 0 (
        echo.
        echo 🎉 Everything is ready! You can now use:
        echo    npm run web2apk getapp
    ) else (
        echo ⚠️  Authentication completed but status check failed
    )
) else (
    echo ❌ GitHub CLI authentication failed
    echo Please try again or use manual download method
)

echo.
pause
