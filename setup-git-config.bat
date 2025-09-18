@echo off
echo 🔧 Setting up Git configuration for your project...
echo.

REM Check if Git is configured with real user details
for /f "tokens=*" %%i in ('git config user.name 2^>nul') do set current_name=%%i
for /f "tokens=*" %%i in ('git config user.email 2^>nul') do set current_email=%%i

REM If already configured with real values, skip
if not "%current_name%"=="" if not "%current_email%"=="" (
    if not "%current_name%"=="Your Name" (
        if not "%current_email%"=="your.email@example.com" (
            if not "%current_name%"=="WitbloxAshish" (
                if not "%current_email%"=="witbloxashish@example.com" (
                    echo ✅ Git is already configured with your details:
                    echo    Name: %current_name%
                    echo    Email: %current_email%
                    echo.
                    pause
                    exit /b 0
                )
            )
        )
    )
)

echo 📝 Let's set up your Git identity for this project...
echo.

set /p user_name="Enter your name: "
set /p user_email="Enter your email: "

if "%user_name%"=="" (
    echo ❌ Name is required. Exiting...
    pause
    exit /b 1
)

if "%user_email%"=="" (
    echo ❌ Email is required. Exiting...
    pause
    exit /b 1
)

REM Set Git configuration
git config user.name "%user_name%"
git config user.email "%user_email%"

echo.
echo ✅ Git configuration set successfully!
echo    Name: %user_name%
echo    Email: %user_email%
echo.
echo 🚀 You can now commit and push your changes!
echo    Your commits will show your name instead of the template author.
echo.
pause
