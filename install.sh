#!/bin/bash

# Web2App Converter Installation Script
# This script helps users set up the Web2App converter quickly

echo "🚀 Web2App Converter - Installation Script"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v16 or higher) first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not available. Please install npm."
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Run setup
echo ""
echo "⚙️  Running initial setup..."
npm run setup

if [ $? -ne 0 ]; then
    echo "❌ Setup failed"
    exit 1
fi

echo ""
echo "🎉 Installation completed successfully!"
echo ""
echo "📱 Your Web2App converter is ready to use!"
echo ""
echo "Next steps:"
echo "1. Add your website files (index.html, style.css, script.js) to this directory"
echo "2. Run: npm run buildapk"
echo "3. Your APK will be generated as 'app-debug.apk'"
echo ""
echo "For more information, check the README.md file"
echo ""
echo "Happy building! 🚀"

