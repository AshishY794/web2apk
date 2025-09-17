@echo off
REM Web2App Converter - User Project Setup Script for Windows
REM This script helps users set up their own project

echo 🚀 Web2App Converter - User Project Setup
echo ==========================================
echo.

REM Check if www directory exists
if not exist "www" (
    echo ❌ www directory not found. Please run this script from the Web2App converter directory.
    pause
    exit /b 1
)

REM Check if user is logged into GitHub
echo 🔐 Checking GitHub authentication...
gh auth status >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ You are not logged into GitHub CLI
    echo.
    echo 📋 GitHub Login Steps:
    echo 1. Install GitHub CLI if not installed:
    echo    - Windows: winget install GitHub.cli
    echo    - Or download from: https://cli.github.com/
    echo.
    echo 2. Login to GitHub:
    echo    gh auth login
    echo.
    echo 3. Follow the prompts to authenticate
    echo.
    set /p choice="Do you want to login to GitHub now? (y/n): "
    if /i "%choice%"=="y" (
        echo 🔑 Starting GitHub authentication...
        gh auth login
        if %errorlevel% equ 0 (
            echo ✅ Successfully logged into GitHub!
        ) else (
            echo ❌ GitHub login failed. Please try again.
            pause
            exit /b 1
        )
    ) else (
        echo ⚠️  You need to login to GitHub to create releases and push code.
        echo    Run 'gh auth login' when you're ready.
    )
) else (
    echo ✅ You are logged into GitHub CLI
    gh auth status
)
echo.

echo 📁 Current project structure:
echo    - www/ (your website files go here)
echo    - .github/ (GitHub Actions workflows)
echo    - package.json (dependencies)
echo.

echo 📋 Next steps:
echo 1. Copy your website files to the www/ folder
echo 2. Remove current git remote and add your own
echo 3. Commit and push to your repository
echo.

set /p choice="Do you want to remove the current git remote? (y/n): "
if /i "%choice%"=="y" (
    echo 🗑️  Removing current git remote...
    git remote remove origin
    echo ✅ Current git remote removed
    echo.
    echo 📝 Now add your own repository:
    echo    git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
    echo.
)

echo 🎯 Ready to add your website files!
echo    Just copy your HTML, CSS, JS files to the www/ folder
echo    Then commit and push to build your APK automatically!
echo.
echo Happy building! 🚀
pause
