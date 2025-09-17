#!/bin/bash
echo "Installing GitHub CLI..."
echo

# Check if we're on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # Check if Homebrew is installed
    if command -v brew &> /dev/null; then
        echo "Using Homebrew to install GitHub CLI..."
        brew install gh
        if [ $? -eq 0 ]; then
            echo
            echo "✅ GitHub CLI installed successfully!"
            echo
            echo "Next steps:"
            echo "1. Run: gh auth login"
            echo "2. Follow the authentication steps"
            echo "3. Then you can use: npm run web2apk getapp"
        else
            echo "❌ Failed to install GitHub CLI using Homebrew"
            echo
            echo "Please install manually from: https://cli.github.com/"
        fi
    else
        echo "❌ Homebrew is not installed"
        echo
        echo "Please install GitHub CLI manually:"
        echo "1. Go to: https://cli.github.com/"
        echo "2. Download and install GitHub CLI"
        echo "3. Run: gh auth login"
        echo "4. Then you can use: npm run web2apk getapp"
    fi
# Check if we're on Linux
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Check if apt is available
    if command -v apt &> /dev/null; then
        echo "Using apt to install GitHub CLI..."
        sudo apt update
        sudo apt install gh
        if [ $? -eq 0 ]; then
            echo
            echo "✅ GitHub CLI installed successfully!"
            echo
            echo "Next steps:"
            echo "1. Run: gh auth login"
            echo "2. Follow the authentication steps"
            echo "3. Then you can use: npm run web2apk getapp"
        else
            echo "❌ Failed to install GitHub CLI using apt"
            echo
            echo "Please install manually from: https://cli.github.com/"
        fi
    else
        echo "❌ apt is not available on this system"
        echo
        echo "Please install GitHub CLI manually:"
        echo "1. Go to: https://cli.github.com/"
        echo "2. Download and install GitHub CLI"
        echo "3. Run: gh auth login"
        echo "4. Then you can use: npm run web2apk getapp"
    fi
else
    echo "❌ Unsupported operating system"
    echo
    echo "Please install GitHub CLI manually:"
    echo "1. Go to: https://cli.github.com/"
    echo "2. Download and install GitHub CLI"
    echo "3. Run: gh auth login"
    echo "4. Then you can use: npm run web2apk getapp"
fi

echo
