#!/usr/bin/env node

const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupGitConfig() {
  console.log('🔧 Setting up Git configuration for your project...\n');
  
  try {
    // Get current Git user (if any)
    let currentName = '';
    let currentEmail = '';
    
    try {
      currentName = execSync('git config user.name', { encoding: 'utf8' }).trim();
    } catch (e) {
      // No name set
    }
    
    try {
      currentEmail = execSync('git config user.email', { encoding: 'utf8' }).trim();
    } catch (e) {
      // No email set
    }
    
    // If already configured with real values, skip
    if (currentName && currentEmail && 
        currentName !== 'Your Name' && 
        currentEmail !== 'your.email@example.com' &&
        currentName !== 'WitbloxAshish' &&
        currentEmail !== 'witbloxashish@example.com') {
      console.log('✅ Git is already configured with your details:');
      console.log(`   Name: ${currentName}`);
      console.log(`   Email: ${currentEmail}\n`);
      rl.close();
      return;
    }
    
    console.log('📝 Let\'s set up your Git identity for this project...\n');
    
    // Get user details
    const name = await question('Enter your name: ');
    const email = await question('Enter your email: ');
    
    if (!name.trim() || !email.trim()) {
      console.log('❌ Name and email are required. Exiting...\n');
      rl.close();
      return;
    }
    
    // Set Git configuration
    execSync(`git config user.name "${name.trim()}"`, { stdio: 'inherit' });
    execSync(`git config user.email "${email.trim()}"`, { stdio: 'inherit' });
    
    console.log('\n✅ Git configuration set successfully!');
    console.log(`   Name: ${name.trim()}`);
    console.log(`   Email: ${email.trim()}\n`);
    
    console.log('🚀 You can now commit and push your changes!');
    console.log('   Your commits will show your name instead of the template author.\n');
    
  } catch (error) {
    console.error('❌ Error setting up Git configuration:', error.message);
  } finally {
    rl.close();
  }
}

// Run if called directly
if (require.main === module) {
  setupGitConfig();
}

module.exports = { setupGitConfig };
