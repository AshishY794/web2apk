@echo off
REM Web2App Converter - Complete Setup Script for Windows
REM This script provides a complete setup experience for users

echo 🚀 Web2App Converter - Complete Setup
echo =====================================
echo.

REM Check if we're in the right directory
if not exist "www" (
    echo ❌ www directory not found. Please run this script from the Web2App converter directory.
    pause
    exit /b 1
)

REM Check if VS Code is installed
echo 🔍 Checking VS Code installation...
where code >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ VS Code is installed
    
    REM Check if GitHub extension is installed
    echo 🔐 Checking VS Code GitHub extension...
    code --list-extensions | findstr "github.vscode-pull-request-github" >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ GitHub extension is installed in VS Code
    ) else (
        echo ⚠️  GitHub extension not found in VS Code
        echo 📋 To install GitHub extension:
        echo 1. Open VS Code
        echo 2. Go to Extensions (Ctrl+Shift+X)
        echo 3. Search for 'GitHub Pull Requests and Issues'
        echo 4. Install the extension
        echo.
    )
) else (
    echo ❌ VS Code is not installed
    echo 📋 Install VS Code:
    echo 1. Go to: https://code.visualstudio.com/
    echo 2. Download and install VS Code
    echo 3. Restart your terminal after installation
    echo.
    set /p choice="Do you want to continue without VS Code? (y/n): "
    if /i not "%choice%"=="y" (
        echo Please install VS Code and run this script again.
        pause
        exit /b 1
    )
)

REM Check GitHub CLI authentication
echo 🔐 Checking GitHub CLI authentication...
gh auth status >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ You are not logged into GitHub CLI
    echo.
    echo 📋 GitHub CLI Setup:
    echo 1. Install GitHub CLI:
    echo    - Windows: winget install GitHub.cli
    echo    - Or download from: https://cli.github.com/
    echo.
    echo 2. Login to GitHub:
    echo    gh auth login
    echo.
    echo 3. Choose authentication method:
    echo    - Login with a web browser (recommended)
    echo    - Paste an authentication token
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

REM Check if user has a GitHub repository
echo 📁 Checking for existing GitHub repository...
git remote -v | findstr "origin" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Git remote 'origin' is configured
    git remote -v
) else (
    echo ⚠️  No git remote configured
    echo.
    echo 📋 Next steps:
    echo 1. Create a new repository on GitHub
    echo 2. Add your website files to the www/ folder
    echo 3. Configure git remote:
    echo    git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
    echo.
)

REM Show project structure
echo 📁 Current project structure:
echo    - www/ (your website files go here)
echo    - .github/ (GitHub Actions workflows)
echo    - package.json (dependencies)
echo.

REM Show next steps
echo 🎯 Next Steps:
echo 1. Add your website files to the www/ folder
echo 2. Customize your APK (optional):
echo    - Edit apk-config.json for app name, icon, etc.
echo    - Add icon.png to www/ folder for custom app icon
echo 3. Configure git remote (if not done already)
echo 4. Commit and push your changes
echo 5. Use 'web2apk getapp' to check status and download APK
echo.

REM Ask if user wants to open VS Code
where code >nul 2>&1
if %errorlevel% equ 0 (
    set /p choice="Do you want to open this project in VS Code? (y/n): "
    if /i "%choice%"=="y" (
        echo 🚀 Opening project in VS Code...
        code .
    )
)

echo.
echo 🎉 Setup complete! Happy building! 🚀
pause
