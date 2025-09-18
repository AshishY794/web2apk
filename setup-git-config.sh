#!/bin/bash

echo "🔧 Setting up Git configuration for your project..."
echo

# Check if Git is configured with real user details
current_name=$(git config user.name 2>/dev/null)
current_email=$(git config user.email 2>/dev/null)

# If already configured with real values, skip
if [[ -n "$current_name" && -n "$current_email" ]]; then
    if [[ "$current_name" != "Your Name" && "$current_email" != "your.email@example.com" && 
          "$current_name" != "WitbloxAshish" && "$current_email" != "witbloxashish@example.com" ]]; then
        echo "✅ Git is already configured with your details:"
        echo "   Name: $current_name"
        echo "   Email: $current_email"
        echo
        exit 0
    fi
fi

echo "📝 Let's set up your Git identity for this project..."
echo

read -p "Enter your name: " user_name
read -p "Enter your email: " user_email

if [[ -z "$user_name" ]]; then
    echo "❌ Name is required. Exiting..."
    exit 1
fi

if [[ -z "$user_email" ]]; then
    echo "❌ Email is required. Exiting..."
    exit 1
fi

# Set Git configuration
git config user.name "$user_name"
git config user.email "$user_email"

echo
echo "✅ Git configuration set successfully!"
echo "   Name: $user_name"
echo "   Email: $user_email"
echo
echo "🚀 You can now commit and push your changes!"
echo "   Your commits will show your name instead of the template author."
echo
