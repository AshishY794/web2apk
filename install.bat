@echo off
REM Web2App Converter Installation Script for Windows
REM This script helps users set up the Web2App converter quickly

echo 🚀 Web2App Converter - Installation Script
echo ==========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js (v16 or higher) first.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detected

REM Check if npm is available
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not available. Please install npm.
    pause
    exit /b 1
)

echo ✅ npm detected

REM Install dependencies
echo.
echo 📦 Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

REM Run setup
echo.
echo ⚙️  Running initial setup...
npm run setup

if %errorlevel% neq 0 (
    echo ❌ Setup failed
    pause
    exit /b 1
)

echo.
echo 🎉 Installation completed successfully!
echo.
echo 📱 Your Web2App converter is ready to use!
echo.
echo Next steps:
echo 1. Add your website files (index.html, style.css, script.js) to this directory
echo 2. Run: npm run buildapk
echo 3. Your APK will be generated as 'app-debug.apk'
echo.
echo For more information, check the README.md file
echo.
echo Happy building! 🚀
pause

