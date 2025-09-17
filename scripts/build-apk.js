const fs = require('fs-extra');
const { execSync } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');
const path = require('path');

async function buildApk() {
  const spinner = ora('Building APK...').start();
  
  try {
    // Step 1: Ensure setup is complete
    spinner.text = 'Checking setup...';
    await ensureSetup();
    
    // Step 2: Ensure website files are in webDir (www)
    spinner.text = 'Preparing website files...';
    await prepareWebsiteFiles();
    
    // Step 3: Sync with Capacitor
    spinner.text = 'Syncing with Capacitor...';
    execSync('npx cap sync', { stdio: 'pipe' });
    
    // Step 4: Build APK
    spinner.text = 'Building Android APK...';
    const buildCommand = process.platform === 'win32' 
      ? 'cd android && gradlew assembleDebug'
      : 'cd android && ./gradlew assembleDebug';
    
    // Set environment variables for GitHub Actions
    const env = {
      ...process.env,
      ANDROID_HOME: process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT,
      ANDROID_SDK_ROOT: process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME
    };
    
    execSync(buildCommand, { 
      stdio: 'pipe',
      env: env
    });
    
    // Step 5: Copy APK to root directory
    spinner.text = 'Copying APK to project folder...';
    await copyApkToRoot();
    
    spinner.succeed(chalk.green('APK built successfully! 🎉'));
    
    // Show success message with file location
    const apkPath = path.resolve('app-debug.apk');
    console.log(chalk.blue('\n📱 Your APK is ready!'));
    console.log(chalk.yellow(`📁 Location: ${apkPath}`));
    console.log(chalk.green('\n✨ You can now install this APK on any Android device!'));
    
    // Show file size
    const stats = await fs.stat(apkPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(chalk.cyan(`📊 APK Size: ${fileSizeInMB} MB`));
    
  } catch (error) {
    spinner.fail(chalk.red('APK build failed: ' + error.message));
    console.log(chalk.red('\n💡 Troubleshooting tips:'));
    console.log(chalk.yellow('1. Make sure you have Android Studio installed'));
    console.log(chalk.yellow('2. Ensure JAVA_HOME is set correctly'));
    console.log(chalk.yellow('3. Try running: npm run setup'));
    console.log(chalk.yellow('4. Check that your website files are in the root directory'));
    process.exit(1);
  }
}

async function ensureSetup() {
  // Check if Capacitor is initialized
  if (!await fs.pathExists('capacitor.config.ts') && !await fs.pathExists('capacitor.config.js')) {
    throw new Error('Capacitor not initialized. Run "npm run setup" first.');
  }
  
  // Check if Android platform exists
  if (!await fs.pathExists('android')) {
    throw new Error('Android platform not found. Run "npm run setup" first.');
  }
}

async function prepareWebsiteFiles() {
  // Check for website files in different locations
  const possibleIndexFiles = [
    'www/index.html',
    'index.html',
    'src/index.html',
    'public/index.html'
  ];
  
  let indexFile = null;
  for (const file of possibleIndexFiles) {
    if (await fs.pathExists(file)) {
      indexFile = file;
      break;
    }
  }
  
  if (!indexFile) {
    throw new Error('No index.html found. Please add your website files to the project.');
  }
  
  // Ensure www directory exists and contains the site
  await fs.ensureDir('www');
  if (indexFile === 'www/index.html') {
    // Already in place
    return;
  } else if (indexFile === 'index.html') {
    const filesToCopy = ['index.html', 'style.css', 'script.js', 'manifest.json', 'sw.js'];
    for (const file of filesToCopy) {
      if (await fs.pathExists(file) && !await fs.pathExists(`www/${file}`)) {
        await fs.copy(file, `www/${file}`);
      }
    }
  } else {
    // Copy from src or other directory into www
    const sourceDir = path.dirname(indexFile);
    await fs.copy(sourceDir, 'www', { overwrite: false });
  }
}

async function copyApkToRoot() {
  const apkPath = 'android/app/build/outputs/apk/debug/app-debug.apk';
  
  if (await fs.pathExists(apkPath)) {
    await fs.copy(apkPath, 'app-debug.apk');
    console.log(chalk.green('✅ APK copied to project root'));
  } else {
    throw new Error('APK file not found in expected location');
  }
}

if (require.main === module) {
  buildApk();
}

module.exports = { buildApk };

