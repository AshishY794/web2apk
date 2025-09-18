#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask questions
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Helper function to get the correct GitHub CLI command
function getGitHubCLICommand() {
  try {
    execSync('gh --version', { stdio: 'pipe' });
    return 'gh';
  } catch (ghError) {
    // Check common installation paths
    const possiblePaths = [
      'C:\\Program Files\\GitHub CLI\\gh.exe',
      'C:\\Program Files (x86)\\GitHub CLI\\gh.exe',
      'C:\\Users\\' + process.env.USERNAME + '\\AppData\\Local\\Programs\\GitHub CLI\\gh.exe',
      '/usr/local/bin/gh',
      '/usr/bin/gh'
    ];
    
    for (const path of possiblePaths) {
      try {
        execSync(`"${path}" --version`, { stdio: 'pipe' });
        return `"${path}"`;
      } catch (e) {
        // Continue checking other paths
      }
    }
    
    return 'gh'; // Fallback
  }
}

// Main command handler
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'help':
      showHelp();
      break;
    case 'gitconfig':
      await setupGitUserConfigManual();
      rl.close();
      break;
    case 'enter':
    case undefined:
    default:
      // If no command or 'enter' command, run the fully automated setup
      await fullyAutomatedSetup();
      break;
  }
}

async function fullyAutomatedSetup() {
  console.log(chalk.blue('🚀 Welcome to Web2APK - Fully Automated Setup!'));
  console.log(chalk.yellow('🎯 This will guide you through everything step by step!'));
  console.log('');

  try {
    // Step 1: Check if we're in the right directory
    await checkProjectStructure();

    // Step 2: Check GitHub CLI
    const ghCommand = await checkAndSetupGitHubCLI();

    // Step 3: Get user's website files
    await getWebsiteFiles();

    // Step 4: Setup Git repository
    await setupGitRepository();

    // Step 4.5: Setup Git user configuration
    await setupGitUserConfig();

    // Step 5: Customize app settings
    await customizeAppSettings();

    // Step 6: Push to GitHub
    await pushToGitHub(ghCommand);

    // Step 7: Wait for build and download APK
    await waitForBuildAndDownload();

    // Success!
    console.log(chalk.green('\n🎉🎉🎉 SUCCESS! 🎉🎉🎉'));
    console.log(chalk.blue('Your website has been converted to an Android app!'));
    console.log(chalk.cyan('📱 Check the downloads/ folder for your APK file!'));
    console.log(chalk.yellow('📲 You can now install it on any Android device!'));

  } catch (error) {
    console.log(chalk.red('\n❌ Setup failed: ' + error.message));
    console.log(chalk.yellow('💡 Don\'t worry! You can try again or ask for help.'));
  } finally {
    rl.close();
  }
}

async function checkProjectStructure() {
  const spinner = ora('Checking project structure...').start();
  
  try {
    // Check if we're in the right directory
    if (!await fs.pathExists('package.json')) {
      throw new Error('Please run this command from the web2apk directory');
    }

    // Check if www directory exists
    if (!await fs.pathExists('www')) {
      await fs.ensureDir('www');
    }

    spinner.succeed(chalk.green('✅ Project structure is ready!'));
  } catch (error) {
    spinner.fail(chalk.red('❌ ' + error.message));
    throw error;
  }
}

async function checkAndSetupGitHubCLI() {
  const spinner = ora('Checking GitHub CLI...').start();
  
  try {
    // Check if GitHub CLI is installed
    let ghCommand = 'gh';
    let ghFound = false;
    
    try {
      execSync('gh --version', { stdio: 'pipe' });
      ghFound = true;
    } catch (ghError) {
      // Check common installation paths
      const possiblePaths = [
        'C:\\Program Files\\GitHub CLI\\gh.exe',
        'C:\\Program Files (x86)\\GitHub CLI\\gh.exe',
        'C:\\Users\\' + process.env.USERNAME + '\\AppData\\Local\\Programs\\GitHub CLI\\gh.exe',
        '/usr/local/bin/gh',
        '/usr/bin/gh'
      ];
      
      for (const path of possiblePaths) {
        try {
          execSync(`"${path}" --version`, { stdio: 'pipe' });
          ghCommand = `"${path}"`;
          ghFound = true;
          break;
        } catch (e) {
          // Continue checking other paths
        }
      }
    }
    
    if (!ghFound) {
      spinner.fail(chalk.red('❌ GitHub CLI not found'));
      console.log(chalk.yellow('🔧 Let\'s install GitHub CLI first!'));
      
      const installChoice = await askQuestion('Do you want to install GitHub CLI now? (y/n): ');
      if (installChoice.toLowerCase() === 'y' || installChoice.toLowerCase() === 'yes') {
        await installGitHubCLI();
        // After installation, try to find gh command again
        try {
          execSync('gh --version', { stdio: 'pipe' });
          ghCommand = 'gh';
          ghFound = true;
        } catch (e) {
          // Check paths again after installation
          const possiblePaths = [
            'C:\\Program Files\\GitHub CLI\\gh.exe',
            'C:\\Program Files (x86)\\GitHub CLI\\gh.exe',
            'C:\\Users\\' + process.env.USERNAME + '\\AppData\\Local\\Programs\\GitHub CLI\\gh.exe'
          ];
          
          for (const path of possiblePaths) {
            try {
              execSync(`"${path}" --version`, { stdio: 'pipe' });
              ghCommand = `"${path}"`;
              ghFound = true;
              break;
            } catch (e2) {
              // Continue checking other paths
            }
          }
        }
      } else {
        throw new Error('GitHub CLI is required. Please install it manually and try again.');
      }
    }

    // Check if authenticated
    try {
      execSync(`${ghCommand} auth status`, { stdio: 'pipe' });
      spinner.succeed(chalk.green('✅ GitHub CLI is ready!'));
    } catch (authError) {
      spinner.fail(chalk.red('❌ GitHub CLI not authenticated'));
      console.log(chalk.yellow('🔐 Let\'s log in to GitHub!'));
      
      const loginChoice = await askQuestion('Do you want to log in to GitHub now? (y/n): ');
      if (loginChoice.toLowerCase() === 'y' || loginChoice.toLowerCase() === 'yes') {
        await authenticateGitHub(ghCommand);
      } else {
        throw new Error('GitHub authentication is required. Please run "gh auth login" and try again.');
      }
    }

    return ghCommand; // Return the ghCommand for use in other functions

  } catch (error) {
    spinner.fail(chalk.red('❌ ' + error.message));
    throw error;
  }
}

async function installGitHubCLI() {
  console.log(chalk.blue('📦 Installing GitHub CLI...'));
  
  const os = process.platform;
  if (os === 'win32') {
    console.log(chalk.yellow('🪟 Windows detected. Installing via winget...'));
    try {
      execSync('winget install GitHub.cli', { stdio: 'inherit' });
      console.log(chalk.green('✅ GitHub CLI installed! Please restart your terminal and run this command again.'));
      process.exit(0);
    } catch (error) {
      console.log(chalk.red('❌ Failed to install via winget. Please install manually from: https://cli.github.com/'));
      throw error;
    }
  } else if (os === 'darwin') {
    console.log(chalk.yellow('🍎 macOS detected. Installing via Homebrew...'));
    try {
      execSync('brew install gh', { stdio: 'inherit' });
      console.log(chalk.green('✅ GitHub CLI installed!'));
    } catch (error) {
      console.log(chalk.red('❌ Failed to install via Homebrew. Please install manually from: https://cli.github.com/'));
      throw error;
    }
  } else {
    console.log(chalk.yellow('🐧 Linux detected. Installing via apt...'));
    try {
      execSync('sudo apt update && sudo apt install gh', { stdio: 'inherit' });
      console.log(chalk.green('✅ GitHub CLI installed!'));
    } catch (error) {
      console.log(chalk.red('❌ Failed to install via apt. Please install manually from: https://cli.github.com/'));
      throw error;
    }
  }
}

async function authenticateGitHub(ghCommand) {
  console.log(chalk.blue('🔐 Starting GitHub authentication...'));
  console.log(chalk.yellow('This will open a browser window for you to log in.'));
  console.log(chalk.cyan('💡 If the browser doesn\'t open automatically, you can:'));
  console.log(chalk.white('   1. Copy the URL that appears below'));
  console.log(chalk.white('   2. Paste it in your browser'));
  console.log(chalk.white('   3. Complete the login process'));
  console.log(chalk.white('   4. Come back here and press Enter'));
  console.log('');
  
  try {
    // Use interactive mode with better error handling
    const { spawn } = require('child_process');
    
    return new Promise((resolve, reject) => {
      const authProcess = spawn(ghCommand.replace(/"/g, ''), ['auth', 'login'], {
        stdio: 'inherit',
        shell: true
      });
      
      authProcess.on('close', (code) => {
        if (code === 0) {
          console.log(chalk.green('✅ GitHub authentication successful!'));
          resolve();
        } else {
          console.log(chalk.red('❌ GitHub authentication failed. Please try again.'));
          reject(new Error('GitHub authentication failed'));
        }
      });
      
      authProcess.on('error', (error) => {
        console.log(chalk.red('❌ GitHub authentication error: ' + error.message));
        reject(error);
      });
    });
    
  } catch (error) {
    console.log(chalk.red('❌ GitHub authentication failed. Please try again.'));
    console.log(chalk.yellow('💡 You can also run this command manually:'));
    console.log(chalk.white(`   ${ghCommand} auth login`));
    throw error;
  }
}

async function getWebsiteFiles() {
  console.log(chalk.blue('\n📁 Let\'s add your website files!'));
  console.log(chalk.yellow('You have a few options:'));
  console.log('1. Use the example website (good for testing)');
  console.log('2. Add your own website files');
  console.log('3. Skip for now (you can add files later)');
  
  const choice = await askQuestion('What would you like to do? (1/2/3): ');
  
  if (choice === '1') {
    console.log(chalk.green('✅ Using example website!'));
    // Example website is already in the repo
  } else if (choice === '2') {
    await addCustomWebsite();
  } else if (choice === '3') {
    console.log(chalk.yellow('⏭️  Skipping website files for now.'));
  } else {
    console.log(chalk.yellow('⏭️  Invalid choice, skipping website files for now.'));
  }
}

async function addCustomWebsite() {
  console.log(chalk.blue('\n📂 Adding your custom website...'));
  console.log(chalk.yellow('💡 We\'ll look for your website files in the parent directory.'));
  console.log(chalk.yellow('   If you have files like index.html, style.css, script.js in the parent folder, we\'ll copy them!'));
  
  try {
    // Check if www directory already has files
    if (await fs.pathExists('www')) {
      const existingFiles = await fs.readdir('www');
      if (existingFiles.length > 0) {
        console.log(chalk.yellow(`⚠️  Found existing files in www/: ${existingFiles.join(', ')}`));
        // Do NOT clear www anymore; always keep existing files (like manifest.json, sw.js)
        console.log(chalk.blue('📁 Keeping existing files, will add new ones...'));
      }
    }
    
    // Check parent directory for common website files (including modern frameworks)
    const parentDir = path.join(process.cwd(), '..');
    const commonFiles = [
      // Basic HTML/CSS/JS
      'index.html', 'style.css', 'script.js', 'app.js', 'main.js', 'styles.css',
      // React
      'package.json', 'src', 'public', 'build', 'dist',
      // Vue
      'vue.config.js', 'src', 'public', 'dist',
      // Angular
      'angular.json', 'src', 'dist',
      // Svelte
      'svelte.config.js', 'src', 'public', 'build',
      // Next.js
      'next.config.js', 'pages', 'app', 'public', '.next',
      // Nuxt.js
      'nuxt.config.js', 'pages', 'components', 'public', '.nuxt'
    ];
    
    let foundFiles = [];
    for (const file of commonFiles) {
      const filePath = path.join(parentDir, file);
      if (await fs.pathExists(filePath)) {
        foundFiles.push(file);
      }
    }
    
    if (foundFiles.length > 0) {
      console.log(chalk.green(`✅ Found project files: ${foundFiles.join(', ')}`));
      
      // Detect project type
      let projectType = 'Basic HTML/CSS/JS';
      if (foundFiles.includes('package.json')) {
        try {
          const packageJson = await fs.readJson(path.join(parentDir, 'package.json'));
          if (packageJson.dependencies && packageJson.dependencies.react) {
            projectType = 'React';
          } else if (packageJson.dependencies && packageJson.dependencies.vue) {
            projectType = 'Vue';
          } else if (packageJson.dependencies && packageJson.dependencies['@angular/core']) {
            projectType = 'Angular';
          } else if (packageJson.dependencies && packageJson.dependencies.svelte) {
            projectType = 'Svelte';
          } else if (packageJson.dependencies && packageJson.dependencies.next) {
            projectType = 'Next.js';
          } else if (packageJson.dependencies && packageJson.dependencies.nuxt) {
            projectType = 'Nuxt.js';
          } else {
            projectType = 'Node.js/JavaScript';
          }
        } catch (e) {
          projectType = 'JavaScript Project';
        }
      }
      
      console.log(chalk.blue(`🎯 Detected project type: ${projectType}`));
      
      // Ensure www directory exists
      await fs.ensureDir('www');
      
      // For modern frameworks, copy the entire project structure
      if (['React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Nuxt.js', 'Node.js/JavaScript', 'JavaScript Project'].includes(projectType)) {
        console.log(chalk.yellow('📦 Copying entire project structure...'));
        await fs.copy(parentDir, 'www', {
          filter: (src, dest) => {
            // Skip node_modules, .git, and other unnecessary folders
            const relativePath = path.relative(parentDir, src);
            return !relativePath.startsWith('node_modules') && 
                   !relativePath.startsWith('.git') && 
                   !relativePath.startsWith('.next') && 
                   !relativePath.startsWith('.nuxt') &&
                   !relativePath.startsWith('dist') &&
                   !relativePath.startsWith('build');
          }
        });
        console.log(chalk.green('✅ Project structure copied successfully!'));
      } else {
        // For basic HTML/CSS/JS, copy individual files
        for (const file of foundFiles) {
          const sourcePath = path.join(parentDir, file);
          const destPath = path.join('www', file);
          await fs.copy(sourcePath, destPath, { overwrite: false });
          console.log(chalk.gray(`📄 Copied (no overwrite): ${file}`));
        }
        
        // Also copy any other HTML, CSS, JS files
        const allFiles = await fs.readdir(parentDir);
        for (const file of allFiles) {
          const filePath = path.join(parentDir, file);
          const stat = await fs.stat(filePath);
          
          if (stat.isFile() && (file.endsWith('.html') || file.endsWith('.css') || file.endsWith('.js'))) {
            const destPath = path.join('www', file);
            if (!await fs.pathExists(destPath)) { // Don't overwrite existing files
              await fs.copy(filePath, destPath);
              console.log(chalk.gray(`📄 Copied: ${file}`));
            }
          }
        }
        
        // Also copy icon and splash files if they exist
        const iconFiles = ['icon.png', 'icon.jpg', 'icon.jpeg', 'icon.svg'];
        const splashFiles = ['splash.png', 'splash.jpg', 'splash.jpeg', 'splash.svg'];
        
        for (const iconFile of iconFiles) {
          const iconPath = path.join(parentDir, iconFile);
          if (await fs.pathExists(iconPath)) {
            await fs.copy(iconPath, 'www/icon.png');
            console.log(chalk.gray(`🖼️  Copied icon: ${iconFile} → www/icon.png`));
            break; // Only copy the first icon found
          }
        }
        
        for (const splashFile of splashFiles) {
          const splashPath = path.join(parentDir, splashFile);
          if (await fs.pathExists(splashPath)) {
            await fs.copy(splashPath, 'www/splash.png');
            console.log(chalk.gray(`🌅 Copied splash: ${splashFile} → www/splash.png`));
            break; // Only copy the first splash found
          }
        }
        
        console.log(chalk.green('✅ Website files copied successfully!'));
        try {
          execSync('git add www', { stdio: 'pipe' });
          execSync('git commit -m "chore: add website files to www"', { stdio: 'pipe' });
        } catch (_) {}
      }
    } else {
      // Ask for manual path if no files found
      const websitePath = await askQuestion('No website files found in parent directory. Enter the path to your website folder: ');
      
      if (await fs.pathExists(websitePath)) {
        // Ensure www directory exists
        await fs.ensureDir('www');
        
        // Copy files
        await fs.copy(websitePath, 'www');
        
        // Also check for icon and splash files in the copied directory
        const iconFiles = ['icon.png', 'icon.jpg', 'icon.jpeg', 'icon.svg'];
        const splashFiles = ['splash.png', 'splash.jpg', 'splash.jpeg', 'splash.svg'];
        
        for (const iconFile of iconFiles) {
          const iconPath = path.join('www', iconFile);
          if (await fs.pathExists(iconPath)) {
            await fs.copy(iconPath, 'www/icon.png');
            console.log(chalk.gray(`🖼️  Found icon: ${iconFile} → www/icon.png`));
            break;
          }
        }
        
        for (const splashFile of splashFiles) {
          const splashPath = path.join('www', splashFile);
          if (await fs.pathExists(splashPath)) {
            await fs.copy(splashPath, 'www/splash.png');
            console.log(chalk.gray(`🌅 Found splash: ${splashFile} → www/splash.png`));
            break;
          }
        }
        
        console.log(chalk.green('✅ Website files copied successfully!'));
        try {
          execSync('git add www', { stdio: 'pipe' });
          execSync('git commit -m "chore: add website files to www"', { stdio: 'pipe' });
        } catch (_) {}
      } else {
        console.log(chalk.red('❌ Path not found. Please check the path and try again.'));
        throw new Error('Website path not found');
      }
    }
  } catch (error) {
    console.log(chalk.red('❌ Failed to copy website files: ' + error.message));
    throw error;
  }
}

async function setupGitRepository() {
  console.log(chalk.blue('\n🔧 Setting up Git repository...'));
  
  // Get repository information first
  const username = await askQuestion('Enter your GitHub username: ');
  const repoName = await askQuestion('Enter your repository name: ');
  
  // Create a clean Git repository (remove existing .git to avoid template history)
  console.log(chalk.yellow('🧹 Creating clean Git repository...'));
  if (await fs.pathExists('.git')) {
    console.log(chalk.gray('   Removing existing Git history to create clean repository...'));
    await fs.remove('.git');
  }
  
  // Initialize fresh Git repository
  console.log(chalk.yellow('📦 Initializing fresh Git repository...'));
  execSync('git init', { stdio: 'pipe' });
  
  // Add new remote
  const remoteUrl = `https://github.com/${username}/${repoName}.git`;
  execSync(`git remote add origin ${remoteUrl}`, { stdio: 'pipe' });
  
  console.log(chalk.green('✅ Clean Git repository configured!'));
  console.log(chalk.blue(`📡 Remote URL: ${remoteUrl}`));
  console.log(chalk.gray('   (No template commit history - fresh start!)'));
}

async function setupGitUserConfig() {
  console.log(chalk.blue('\n🔐 Setting up Git user configuration...'));
  
  try {
    // Check current Git user configuration
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
        currentEmail !== 'witbloxashish@example.com' &&
        currentName !== 'AshishY794' &&
        currentEmail !== 'auy1583@gmail.com') {
      console.log(chalk.green('✅ Git is already configured with your details:'));
      console.log(chalk.cyan(`   Name: ${currentName}`));
      console.log(chalk.cyan(`   Email: ${currentEmail}`));
      return;
    }
    
    // Try to get user details automatically
    let userName = '';
    let userEmail = '';
    
    // Try to get username from system
    try {
      userName = process.env.USERNAME || process.env.USER || 'User';
    } catch (e) {
      userName = 'User';
    }
    
    // Try to get email from GitHub CLI if available
    try {
      const ghCommand = getGitHubCLICommand();
      const ghUser = execSync(`${ghCommand} api user`, { encoding: 'utf8' });
      const userData = JSON.parse(ghUser);
      userEmail = userData.email || `${userName.toLowerCase()}@example.com`;
      userName = userData.name || userName;
    } catch (e) {
      // Fallback to system username
      userEmail = `${userName.toLowerCase()}@example.com`;
    }
    
    // Set Git configuration automatically
    execSync(`git config user.name "${userName}"`, { stdio: 'pipe' });
    execSync(`git config user.email "${userEmail}"`, { stdio: 'pipe' });
    
    console.log(chalk.green('✅ Git user configuration set automatically!'));
    console.log(chalk.cyan(`   Name: ${userName}`));
    console.log(chalk.cyan(`   Email: ${userEmail}`));
    console.log(chalk.blue('🚀 Your commits will now show your name instead of the template author!'));
    console.log(chalk.gray('💡 You can change this later with: git config user.name "Your Name"'));
    
  } catch (error) {
    console.log(chalk.red('❌ Error setting up Git configuration: ' + error.message));
    console.log(chalk.yellow('💡 You can set it manually later with: git config user.name "Your Name"'));
  }
}

async function setupGitUserConfigManual() {
  console.log(chalk.blue('🔐 Manual Git Configuration Setup'));
  console.log(chalk.yellow('This will help you set up your Git identity manually.'));
  console.log('');
  
  try {
    // Check current Git user configuration
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
        currentEmail !== 'witbloxashish@example.com' &&
        currentName !== 'AshishY794' &&
        currentEmail !== 'auy1583@gmail.com') {
      console.log(chalk.green('✅ Git is already configured with your details:'));
      console.log(chalk.cyan(`   Name: ${currentName}`));
      console.log(chalk.cyan(`   Email: ${currentEmail}`));
      return;
    }
    
    console.log(chalk.yellow('📝 Let\'s set up your Git identity for this project...'));
    console.log(chalk.gray('   (This ensures your commits show YOUR name, not the template author)'));
    console.log('');
    
    // Get user details
    const name = await askQuestion('Enter your name: ');
    const email = await askQuestion('Enter your email: ');
    
    if (!name.trim() || !email.trim()) {
      console.log(chalk.red('❌ Name and email are required. Using default values...'));
      execSync('git config user.name "Your Name"', { stdio: 'pipe' });
      execSync('git config user.email "your.email@example.com"', { stdio: 'pipe' });
      return;
    }
    
    // Set Git configuration
    execSync(`git config user.name "${name.trim()}"`, { stdio: 'pipe' });
    execSync(`git config user.email "${email.trim()}"`, { stdio: 'pipe' });
    
    console.log(chalk.green('\n✅ Git user configuration set successfully!'));
    console.log(chalk.cyan(`   Name: ${name.trim()}`));
    console.log(chalk.cyan(`   Email: ${email.trim()}`));
    console.log(chalk.blue('🚀 Your commits will now show your name instead of the template author!'));
    
  } catch (error) {
    console.log(chalk.red('❌ Error setting up Git configuration: ' + error.message));
    console.log(chalk.yellow('💡 You can set it manually later with: git config user.name "Your Name"'));
  }
}

async function customizeAppSettings() {
  console.log(chalk.blue('\n🎨 App Configuration'));
  console.log(chalk.yellow('You can customize your app settings or use the default ones.'));
  
  const customizeChoice = await askQuestion('Do you want to customize your app settings? (y/n): ');
  
  let appName, appId, version, description;
  let iconEnabled = false;
  let iconPath = 'www/icon.png';
  let splashEnabled = false;
  let splashPath = 'www/splash.png';
  let splashColor = '#ffffff';
  
  if (customizeChoice.toLowerCase() === 'y' || customizeChoice.toLowerCase() === 'yes') {
    console.log(chalk.blue('\n🎨 Let\'s customize your app!'));
    
    appName = await askQuestion('Enter your app name (or press Enter for "My Web App"): ') || 'My Web App';
    appId = await askQuestion('Enter your app ID (or press Enter for "com.example.myapp"): ') || 'com.example.myapp';
    version = await askQuestion('Enter version (or press Enter for "1.0.0"): ') || '1.0.0';
    description = await askQuestion('Enter description (or press Enter for "My converted web app"): ') || 'My converted web app';
    
    // Optional icon
    const iconChoice = await askQuestion('Do you want to use a custom app icon? (y/n): ');
    if (iconChoice.toLowerCase() === 'y' || iconChoice.toLowerCase() === 'yes') {
      iconEnabled = true;
      const ip = await askQuestion('Enter icon path (default: www/icon.png): ');
      if (ip && ip.trim()) iconPath = ip.trim();
      
      // Try to copy icon to www/
      try {
        if (iconPath === 'www/icon.png') {
          // Check if icon already exists in www/
          if (await fs.pathExists(iconPath)) {
            console.log(chalk.gray('📱 Using existing icon: www/icon.png'));
            iconEnabled = true; // Ensure enabled flag is set
          } else {
            // Try to find and copy icon from parent directory
            const parentDir = path.resolve('..');
            const iconFiles = ['icon.png', 'icon.jpg', 'icon.jpeg', 'icon.svg'];
            let iconFound = false;
            
            for (const iconFile of iconFiles) {
              const parentIconPath = path.join(parentDir, iconFile);
              if (await fs.pathExists(parentIconPath)) {
                await fs.copy(parentIconPath, 'www/icon.png');
                console.log(chalk.green(`✅ Icon copied from parent: ${iconFile} → www/icon.png`));
                iconFound = true;
                iconEnabled = true; // Ensure enabled flag is set
                break;
              }
            }
            
            if (!iconFound) {
              console.log(chalk.yellow('⚠️  No icon found in www/ or parent directory'));
              iconEnabled = false; // Disable if no icon found
            }
          }
        } else if (await fs.pathExists(iconPath)) {
          await fs.copy(iconPath, 'www/icon.png');
          console.log(chalk.green('✅ Icon copied to www/icon.png'));
          iconEnabled = true; // Ensure enabled flag is set
        } else {
          console.log(chalk.yellow('⚠️  Icon file not found at: ' + iconPath));
          console.log(chalk.blue('💡 Please place your icon file and run the setup again.'));
          iconEnabled = false; // Disable if file not found
        }
      } catch (error) {
        console.log(chalk.red('❌ Failed to copy icon: ' + error.message));
        iconEnabled = false; // Disable on error
      }
    }

    // Optional splash
    const splashChoice = await askQuestion('Do you want a splash screen? (y/n): ');
    if (splashChoice.toLowerCase() === 'y' || splashChoice.toLowerCase() === 'yes') {
      splashEnabled = true;
      const sp = await askQuestion('Enter splash image path (default: www/splash.png): ');
      const sc = await askQuestion('Enter splash background color (default: #ffffff): ');
      if (sp && sp.trim()) splashPath = sp.trim();
      if (sc && sc.trim()) splashColor = sc.trim();
      
      // Try to copy splash to www/
      try {
        if (splashPath === 'www/splash.png') {
          // Check if splash already exists in www/
          if (await fs.pathExists(splashPath)) {
            console.log(chalk.gray('🌅 Using existing splash: www/splash.png'));
          } else {
            // Try to find and copy splash from parent directory
            const parentDir = path.resolve('..');
            const splashFiles = ['splash.png', 'splash.jpg', 'splash.jpeg', 'splash.svg'];
            let splashFound = false;
            
            for (const splashFile of splashFiles) {
              const parentSplashPath = path.join(parentDir, splashFile);
              if (await fs.pathExists(parentSplashPath)) {
                await fs.copy(parentSplashPath, 'www/splash.png');
                console.log(chalk.green(`✅ Splash copied from parent: ${splashFile} → www/splash.png`));
                splashFound = true;
                break;
              }
            }
            
            if (!splashFound) {
              console.log(chalk.yellow('⚠️  No splash found in www/ or parent directory'));
            }
          }
        } else if (await fs.pathExists(splashPath)) {
          await fs.copy(splashPath, 'www/splash.png');
          console.log(chalk.green('✅ Splash screen copied to www/splash.png'));
        } else {
          console.log(chalk.yellow('⚠️  Splash file not found at: ' + splashPath));
          console.log(chalk.blue('💡 Please place your splash file and run the setup again.'));
        }
      } catch (error) {
        console.log(chalk.red('❌ Failed to copy splash: ' + error.message));
      }
    }

    console.log(chalk.green('✅ App customization completed!'));
  } else {
    console.log(chalk.blue('📱 Using default app settings...'));
    
    // Use default settings
    appName = 'My Web App';
    appId = 'com.example.myapp';
    version = '1.0.0';
    description = 'My converted web app';
    
    console.log(chalk.green('✅ Default app settings applied!'));
  }

  // Create apk-config.json
  const config = {
    appName: appName,
    appId: appId,
    version: version,
    description: description,
    icon: {
      enabled: iconEnabled,
      path: iconPath
    },
    // Use unified 'splash' object that update-config.js also supports
    splash: {
      enabled: splashEnabled,
      path: splashPath,
      color: splashColor
    }
  };

  await fs.writeJson('apk-config.json', config, { spaces: 2 });
  console.log(chalk.green('✅ App configuration saved!'));
  // Stage apk-config.json immediately so it gets pushed
  try {
    execSync('git add apk-config.json', { stdio: 'pipe' });
    execSync('git commit -m "chore: save user apk-config.json"', { stdio: 'pipe' });
  } catch (_) {}
  
  // Show summary of what user entered
  console.log(chalk.blue('\n📋 Your App Configuration Summary:'));
  console.log(chalk.cyan(`📱 App Name: ${appName}`));
  console.log(chalk.cyan(`🆔 App ID: ${appId}`));
  console.log(chalk.cyan(`📦 Version: ${version}`));
  console.log(chalk.cyan(`📝 Description: ${description}`));
  console.log(chalk.yellow('\n🔄 What happens next:'));
  console.log(chalk.white('1. 📤 Push your files to GitHub'));
  console.log(chalk.white('2. 🏗️  GitHub Actions will build your APK'));
  console.log(chalk.white('3. ⏳ Wait for build completion (5-15 minutes)'));
  console.log(chalk.white('4. 📥 Download your APK automatically'));
  console.log(chalk.white('5. 📱 Install APK on your Android device'));
}

async function pushToGitHub(ghCommand = null) {
  console.log(chalk.blue('\n🚀 Pushing to GitHub...'));
  
  // Get the correct GitHub CLI command
  const actualGhCommand = ghCommand || getGitHubCLICommand();
  console.log(chalk.gray(`🔧 Using GitHub CLI: ${actualGhCommand}`));
  
  const spinner = ora('Checking repository status...').start();
  
  try {
    // Always stage and attempt a commit so freshly written files (like apk-config.json) are included
    try {
      execSync('git add .', { stdio: 'pipe' });
      execSync('git commit -m "Initial commit: Add website and APK configuration"', { stdio: 'pipe' });
    } catch (e) {
      // Ignore if there's nothing to commit
    }

    // Ensure the current auth token has required scopes for repo creation
    await ensureGitHubRepoScopes(actualGhCommand);

    // Check if repository exists and has files
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    const repoMatch = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
    
    if (repoMatch) {
      const [, username, repoName] = repoMatch;
      const cleanRepoName = repoName.replace('.git', '');
      
      // Check if repository exists
      try {
        execSync(`${actualGhCommand} repo view ${username}/${cleanRepoName}`, { stdio: 'pipe' });
        
        // Repository exists, check if it has files (with timeout)
        spinner.text = 'Checking for existing files in repository...';
        try {
          // Use a timeout for the git ls-remote command
          const filesOutput = execSync(`git ls-remote --heads origin main`, { 
            stdio: 'pipe',
            timeout: 10000 // 10 second timeout
          });
          if (filesOutput.toString().trim()) {
            // Repository has files, we need to force push or handle existing files
            console.log(chalk.yellow('\n⚠️  Repository already has files.'));
            const replaceChoice = await askQuestion('Do you want to replace all existing files? (y/n): ');
            
            if (replaceChoice.toLowerCase() === 'y' || replaceChoice.toLowerCase() === 'yes') {
              console.log(chalk.blue('🗑️  Replacing all existing files...'));
              
              // Force push to replace all files
              spinner.text = 'Force pushing to replace all files...';
              execSync('git add .', { stdio: 'pipe' });
              execSync('git commit -m "Update: Replace all files with new website"', { stdio: 'pipe' });
              execSync('git push origin main --force', { stdio: 'pipe' });
              
              spinner.succeed(chalk.green('✅ Successfully replaced all files in repository!'));
              console.log(chalk.blue('🔄 GitHub Actions is now building your APK...'));
              return;
            } else {
              console.log(chalk.blue('📁 Keeping existing files, adding new ones...'));
            }
          }
        } catch (e) {
          // Repository exists but no main branch yet, or timeout occurred
          console.log(chalk.gray('📝 Repository exists but no main branch found, proceeding with normal push...'));
        }
      } catch (repoError) {
        // Repository doesn't exist, create it
        spinner.text = 'Creating GitHub repository...';
        
        try {
          // First, remove existing remote if it exists
          try {
            execSync('git remote remove origin', { stdio: 'pipe' });
          } catch (e) {
            // Remote doesn't exist, that's fine
          }
          
          // Try to create the repository and push in one go (fast path)
          execSync(`${actualGhCommand} repo create ${cleanRepoName} --public --source=. --push`, { stdio: 'pipe' });
          spinner.succeed(chalk.green('✅ Created GitHub repository and pushed successfully!'));
          console.log(chalk.blue('🔄 GitHub Actions is now building your APK...'));
          return;
        } catch (createError) {
          // If the above fails, try a different approach
          try {
            console.log(chalk.yellow('🔄 Trying alternative repository creation method...'));
            
            // Attempt creation via gh api (works even if repo create shorthand fails due to scope parsing)
            await createRepoViaApi(actualGhCommand, cleanRepoName, /*isPrivate*/ false);
            
            // Add remote manually
            execSync(`git remote add origin https://github.com/${username}/${cleanRepoName}.git`, { stdio: 'pipe' });
            
            // Push manually (ensure apk-config.json and other files are staged)
            try { execSync('git add .', { stdio: 'pipe' }); } catch(_) {}
            try { execSync('git commit -m "Initial commit: Convert website to Android app"', { stdio: 'pipe' }); } catch(_) {}
            execSync('git push origin main', { stdio: 'pipe' });
            
            spinner.succeed(chalk.green('✅ Created GitHub repository and pushed successfully!'));
            console.log(chalk.blue('🔄 GitHub Actions is now building your APK...'));
            return;
          } catch (altError) {
            spinner.fail(chalk.red('❌ Failed to create repository: ' + createError.message));
            console.log(chalk.yellow('💡 Please create the repository manually on GitHub and try again.'));
            console.log(chalk.blue(`🔗 Go to: https://github.com/new`));
            console.log(chalk.blue(`📝 Repository name: ${cleanRepoName}`));
            console.log(chalk.yellow(`🔧 GitHub CLI command used: ${actualGhCommand}`));
            throw createError;
          }
        }
      }
    }
    
    // Normal push process
    spinner.text = 'Adding files to Git...';
    // Add all files including latest apk-config.json
    try { execSync('git add .', { stdio: 'pipe' }); } catch(_) {}
    
    spinner.text = 'Committing changes...';
    // Commit; if nothing to commit, continue gracefully
    try { execSync('git commit -m "Initial commit: Convert website to Android app"', { stdio: 'pipe' }); } catch(_) {}
    
    spinner.text = 'Pushing to GitHub...';
    execSync('git push origin main', { stdio: 'pipe' });
    
    spinner.succeed(chalk.green('✅ Successfully pushed to GitHub!'));
    console.log(chalk.blue('🔄 GitHub Actions is now building your APK...'));
    
  } catch (error) {
    spinner.fail(chalk.red('❌ Failed to push to GitHub: ' + error.message));
    throw error;
  }
}

// Ensure the authenticated GitHub CLI session has scopes to create repositories and run workflows
async function ensureGitHubRepoScopes(ghCommand) {
  try {
    // Check current auth status; if missing, this will throw above
    execSync(`${ghCommand} auth status`, { stdio: 'pipe' });

    // Try a lightweight API call to fetch the current token scopes
    // GitHub CLI exposes token scopes via the headers from an API call
    // We use the rate_limit endpoint because it's safe and fast
    const output = execSync(`${ghCommand} api rate_limit -i`, { encoding: 'utf8', stdio: 'pipe' });
    // Example header line we care about: x-oauth-scopes: repo, workflow
    const scopeLine = output.split('\n').find(line => /x-oauth-scopes:/i.test(line)) || '';
    const scopes = scopeLine.split(':').slice(1).join(':').trim().toLowerCase();

    const required = ['repo', 'workflow'];
    const missing = required.filter(scope => !scopes.includes(scope));

    if (missing.length > 0) {
      console.log(chalk.yellow(`\n🔐 Missing GitHub token scopes: ${missing.join(', ')}`));
      console.log(chalk.blue('Attempting to refresh GitHub CLI token with required scopes...'));
      try {
        // Prefer refresh when available
        execSync(`${ghCommand} auth refresh -s repo -s workflow`, { stdio: 'pipe' });
      } catch (e) {
        // Fall back to a login requesting scopes with better handling
        console.log(chalk.yellow('🔄 Refreshing GitHub authentication with required scopes...'));
        try {
          const { spawn } = require('child_process');
          const refreshProcess = spawn(ghCommand.replace(/"/g, ''), ['auth', 'login', '-s', 'repo', '-s', 'workflow'], {
            stdio: 'inherit',
            shell: true
          });
          
          refreshProcess.on('close', (code) => {
            if (code !== 0) {
              console.log(chalk.red('❌ Failed to refresh GitHub authentication.'));
            }
          });
        } catch (spawnError) {
          console.log(chalk.red('❌ Failed to refresh GitHub authentication.'));
        }
      }
      console.log(chalk.green('✅ GitHub token scopes updated.'));
    }
  } catch (e) {
    // If anything goes wrong here, continue; repo creation path will surface errors clearly
  }
}

// Create a repository using GitHub REST via gh api. Works for personal accounts.
async function createRepoViaApi(ghCommand, repoName, isPrivate) {
  try {
    // Create under the authenticated user account
    execSync(`${ghCommand} api -X POST user/repos -f name=${repoName} -F private=${isPrivate ? 'true' : 'false'}`, { stdio: 'pipe' });
  } catch (e) {
    // If user selected an organization earlier (remote URL parsing), try creating under that org
    // Detect current remote (if any) to infer owner; otherwise rethrow
    try {
      const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8', stdio: 'pipe' }).trim();
      const match = remoteUrl.match(/github\.com[:/]([^/]+)\//);
      const owner = match ? match[1] : null;
      if (owner) {
        execSync(`${ghCommand} api -X POST orgs/${owner}/repos -f name=${repoName} -F private=${isPrivate ? 'true' : 'false'}`, { stdio: 'pipe' });
        return;
      }
    } catch (_) {
      // ignore and rethrow original
    }
    throw e;
  }
}

async function waitForBuildAndDownload() {
  console.log(chalk.blue('\n⏳ Waiting for your APK to be built...'));
  console.log(chalk.yellow('This usually takes 5-15 minutes. We\'ll check every 10 seconds.'));
  console.log(chalk.cyan('🔨 Building Gradle... Building APK...'));
  
  // Wait a bit for the workflow to start
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  try {
    // Get repository info
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    const repoMatch = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
    
    if (!repoMatch) {
      throw new Error('Could not determine GitHub repository from git remote.');
    }

    const [, owner, repo] = repoMatch;
    const repoName = repo.replace('.git', '');
    
    // Get GitHub CLI command
    const ghCommand = getGitHubCLICommand();
    
    // Get workflow status
    const workflowStatus = await getWorkflowStatus(owner, repoName, ghCommand);
    
    if (workflowStatus.status === 'completed' && workflowStatus.conclusion === 'success') {
      console.log(chalk.green('✅ Build already completed! Downloading APK...'));
      await downloadAPK(owner, repoName, workflowStatus.runId, ghCommand);
    } else {
      console.log(chalk.blue('🔄 Build in progress, waiting for completion...'));
      await waitForBuildCompletion(owner, repoName, workflowStatus.runId, ghCommand);
    }

  } catch (error) {
    console.log(chalk.yellow('⚠️  Could not automatically download APK: ' + error.message));
    console.log(chalk.blue('💡 You can manually download it from GitHub Actions when ready.'));
    console.log(chalk.blue('🔗 Go to: https://github.com/' + (repoMatch ? repoMatch[1] + '/' + repoMatch[2].replace('.git', '') : 'your-repo') + '/actions'));
  }
}

async function getWorkflowStatus(owner, repo, ghCommand) {
  try {
    // Get the latest workflow run
    const output = execSync(`${ghCommand} run list --repo ${owner}/${repo} --limit 1 --json databaseId,status,conclusion`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    const runs = JSON.parse(output);
    if (runs.length === 0) {
      throw new Error('No workflow runs found. The workflow may not have started yet.');
    }
    
    const latestRun = runs[0];
    return {
      runId: latestRun.databaseId,
      status: latestRun.status,
      conclusion: latestRun.conclusion,
      ghCommand: ghCommand
    };
    
  } catch (error) {
    throw new Error('Failed to get workflow status: ' + error.message);
  }
}

async function waitForBuildCompletion(owner, repo, runId, ghCommand) {
  console.log(chalk.yellow('\n🔄 Waiting for build to complete...'));
  console.log(chalk.blue('⏱️  Checking every 10 seconds for updates...\n'));
  
  let attempts = 0;
  const maxAttempts = 180; // 30 minutes max wait time (180 * 10 seconds)
  
  while (attempts < maxAttempts) {
    try {
      // Wait 10 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 10000));
      attempts++;
      
      // Get current status with more detailed info
      const output = execSync(`${ghCommand} run view ${runId} --repo ${owner}/${repo} --json status,conclusion,createdAt,updatedAt`, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const runData = JSON.parse(output);
      const status = runData.status;
      const conclusion = runData.conclusion;
      const createdAt = new Date(runData.createdAt);
      const updatedAt = new Date(runData.updatedAt);
      
      // Show build status without percentages
      const now = new Date();
      const elapsedMinutes = Math.floor((now - createdAt) / (1000 * 60));
      
      // Show build status messages
      let statusMessage = 'Building Gradle...';
      if (elapsedMinutes > 2) statusMessage = 'Building APK...';
      if (elapsedMinutes > 5) statusMessage = 'Finalizing build...';
      
      process.stdout.write(`\r${chalk.blue('🔨')} ${statusMessage} ${chalk.gray(`(${elapsedMinutes}min elapsed)`)}`);
      
      if (status === 'completed') {
        console.log('\n'); // New line after progress
        
        if (conclusion === 'success') {
          console.log(chalk.green('✅ Build completed successfully!'));
          console.log(chalk.blue('📥 Downloading APK...'));
          
          // Download the APK
          await downloadAPK(owner, repo, runId, ghCommand);
          
          console.log(chalk.green('\n🎉 APK ready! Build and download completed successfully!'));
          console.log(chalk.cyan('📱 You can now install the APK on your Android device.'));
          return;
          
        } else if (conclusion === 'failure') {
          console.log(chalk.red('\n❌ Build failed!'));
          console.log(chalk.red(`🔗 View error details: https://github.com/${owner}/${repo}/actions/runs/${runId}`));
          return;
          
        } else {
          console.log(chalk.yellow(`\n⚠️  Build completed with status: ${conclusion}`));
          return;
        }
      }
      
    } catch (error) {
      console.log(chalk.red(`\n❌ Error checking build status: ${error.message}`));
      return;
    }
  }
  
  console.log(chalk.yellow('\n⏰ Build is taking longer than expected. You can check manually:'));
  console.log(chalk.blue(`🔗 https://github.com/${owner}/${repo}/actions/runs/${runId}`));
}

async function downloadAPK(owner, repo, runId, ghCommand) {
  try {
    // Create downloads directory
    await fs.ensureDir('downloads');
    
    // Download artifacts
    const downloadPath = path.join(process.cwd(), 'downloads');
    execSync(`${ghCommand} run download ${runId} --repo ${owner}/${repo} --dir "${downloadPath}"`, { 
      stdio: 'pipe' 
    });
    
    // Find and move APK file
    const files = await fs.readdir(downloadPath);
    let apkFile = null;
    
    // Look for APK files in subdirectories
      for (const file of files) {
      const filePath = path.join(downloadPath, file);
        const stat = await fs.stat(filePath);
      
        if (stat.isDirectory()) {
          const subFiles = await fs.readdir(filePath);
        for (const subFile of subFiles) {
          if (subFile.endsWith('.apk')) {
            apkFile = path.join(filePath, subFile);
            break;
          }
        }
      } else if (file.endsWith('.apk')) {
        apkFile = filePath;
      }
      
      if (apkFile) break;
    }
    
    if (apkFile) {
      const finalApkPath = path.join(downloadPath, 'app-debug.apk');
      await fs.copy(apkFile, finalApkPath);
      console.log(chalk.green(`✅ APK downloaded: ${finalApkPath}`));
    } else {
      console.log(chalk.yellow('⚠️  APK file not found in artifacts'));
    }
    
  } catch (error) {
    throw new Error('Failed to download APK: ' + error.message);
  }
}

function showHelp() {
  console.log(chalk.blue('🚀 Web2APK - Fully Automated Website to Android App Converter'));
  console.log('');
  console.log(chalk.green('Commands:'));
  console.log('  web2apk           - Start fully automated setup (default)');
  console.log('  web2apk gitconfig - Set up Git user configuration manually');
  console.log('  web2apk help      - Show this help message');
  console.log('');
  console.log(chalk.blue('What web2apk does automatically:'));
  console.log('1. ✅ Checks your project structure');
  console.log('2. 🔧 Sets up GitHub CLI (installs if needed)');
  console.log('3. 🔐 Authenticates with GitHub');
  console.log('4. 📁 Helps you add your website files');
  console.log('5. 🏠 Configures your Git repository');
  console.log('6. 🎨 Customizes your app settings');
  console.log('7. 🚀 Pushes everything to GitHub');
  console.log('8. ⏳ Waits for build and downloads your APK');
  console.log('');
  console.log(chalk.yellow('📚 For more information, visit:'));
  console.log('https://github.com/AshishY794/web2apk');
}

// Run the main function
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
