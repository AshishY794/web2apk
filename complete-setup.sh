#!/bin/bash

# Web2App Converter - Complete Setup Script
# This script provides a complete setup experience for users

echo "🚀 Web2App Converter - Complete Setup"
echo "====================================="
echo ""

# Check if we're in the right directory
if [ ! -d "www" ]; then
    echo "❌ www directory not found. Please run this script from the Web2App converter directory."
    exit 1
fi

# Check if VS Code is installed
echo "🔍 Checking VS Code installation..."
if command -v code >/dev/null 2>&1; then
    echo "✅ VS Code is installed"
    
    # Check if user is logged into VS Code
    echo "🔐 Checking VS Code GitHub authentication..."
    if code --list-extensions | grep -q "github.vscode-pull-request-github"; then
        echo "✅ GitHub extension is installed in VS Code"
    else
        echo "⚠️  GitHub extension not found in VS Code"
        echo "📋 To install GitHub extension:"
        echo "1. Open VS Code"
        echo "2. Go to Extensions (Ctrl+Shift+X)"
        echo "3. Search for 'GitHub Pull Requests and Issues'"
        echo "4. Install the extension"
        echo ""
    fi
else
    echo "❌ VS Code is not installed"
    echo "📋 Install VS Code:"
    echo "1. Go to: https://code.visualstudio.com/"
    echo "2. Download and install VS Code"
    echo "3. Restart your terminal after installation"
    echo ""
    read -p "Do you want to continue without VS Code? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Please install VS Code and run this script again."
        exit 1
    fi
fi

# Check GitHub CLI authentication
echo "🔐 Checking GitHub CLI authentication..."
if ! gh auth status >/dev/null 2>&1; then
    echo "❌ You are not logged into GitHub CLI"
    echo ""
    echo "📋 GitHub CLI Setup:"
    echo "1. Install GitHub CLI:"
    echo "   - Windows: winget install GitHub.cli"
    echo "   - Mac: brew install gh"
    echo "   - Linux: sudo apt install gh"
    echo ""
    echo "2. Login to GitHub:"
    echo "   gh auth login"
    echo ""
    echo "3. Choose authentication method:"
    echo "   - Login with a web browser (recommended)"
    echo "   - Paste an authentication token"
    echo ""
    read -p "Do you want to login to GitHub now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔑 Starting GitHub authentication..."
        gh auth login
        if [ $? -eq 0 ]; then
            echo "✅ Successfully logged into GitHub!"
        else
            echo "❌ GitHub login failed. Please try again."
            exit 1
        fi
    else
        echo "⚠️  You need to login to GitHub to create releases and push code."
        echo "   Run 'gh auth login' when you're ready."
    fi
else
    echo "✅ You are logged into GitHub CLI"
    gh auth status
fi
echo ""

# Check if user has a GitHub repository
echo "📁 Checking for existing GitHub repository..."
if git remote -v | grep -q "origin"; then
    echo "✅ Git remote 'origin' is configured"
    git remote -v
else
    echo "⚠️  No git remote configured"
    echo ""
    echo "📋 Next steps:"
    echo "1. Create a new repository on GitHub"
    echo "2. Add your website files to the www/ folder"
    echo "3. Configure git remote:"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git"
    echo ""
fi

# Show project structure
echo "📁 Current project structure:"
echo "   - www/ (your website files go here)"
echo "   - .github/ (GitHub Actions workflows)"
echo "   - package.json (dependencies)"
echo ""

# Show next steps
echo "🎯 Next Steps:"
echo "1. Add your website files to the www/ folder"
echo "2. Customize your APK (optional):"
echo "   - Edit apk-config.json for app name, icon, etc."
echo "   - Add icon.png to www/ folder for custom app icon"
echo "3. Configure git remote (if not done already)"
echo "4. Commit and push your changes"
echo "5. Use 'web2apk getapp' to check status and download APK"
echo ""

# Ask if user wants to open VS Code
if command -v code >/dev/null 2>&1; then
    read -p "Do you want to open this project in VS Code? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🚀 Opening project in VS Code..."
        code .
    fi
fi

echo ""
echo "🎉 Setup complete! Happy building! 🚀"
