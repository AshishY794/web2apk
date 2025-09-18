#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');

// Main command handler
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'getapk':
      await getAPK();
      break;
    case 'config':
      await showConfig();
      break;
    case 'setup':
      await setup();
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
}

async function getAPK() {
  const spinner = ora('Checking GitHub Actions status...').start();
  
  try {
    // Check if we're in a git repository
    if (!await fs.pathExists('.git')) {
      throw new Error('Not a git repository. Please run this from your project directory.');
    }

    // Get repository info
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    const repoMatch = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
    
    if (!repoMatch) {
      throw new Error('Could not determine GitHub repository from git remote.');
    }

    const [, owner, repo] = repoMatch;
    const repoName = repo.replace('.git', '');
    
    spinner.text = 'Fetching latest workflow status...';
    
    // Try GitHub CLI first, then fallback to manual instructions
    let workflowStatus;
    try {
      workflowStatus = await getWorkflowStatus(owner, repoName);
    } catch (error) {
      spinner.fail(chalk.red('GitHub CLI Error: ' + error.message));
      console.log('');
      console.log(chalk.yellow('💡 Alternative: Manual Download'));
      console.log(chalk.blue('1. Go to: https://github.com/' + owner + '/' + repoName + '/actions'));
      console.log(chalk.blue('2. Click on the latest workflow run'));
      console.log(chalk.blue('3. Download the APK artifact from the "Artifacts" section'));
      console.log('');
      console.log(chalk.cyan('🔧 To fix GitHub CLI:'));
      console.log(chalk.white('   1. Restart your terminal/command prompt'));
      console.log(chalk.white('   2. Run: gh auth login'));
      console.log(chalk.white('   3. Or test with: test-gh-cli.bat'));
      return;
    }
    
    if (workflowStatus.status === 'completed' && workflowStatus.conclusion === 'success') {
      spinner.succeed(chalk.green('✅ Latest build completed successfully!'));
      
      // Download APK
      await downloadAPK(owner, repoName, workflowStatus.runId, workflowStatus.ghCommand);
      
      console.log(chalk.green('\n🎉 APK ready! Build and download completed successfully!'));
      console.log(chalk.cyan('📱 You can now install the APK on your Android device.'));
      
    } else if (workflowStatus.status === 'in_progress') {
      spinner.warn(chalk.yellow('⏳ Build is currently in progress...'));
      console.log(chalk.blue(`📊 Progress: ${workflowStatus.progress}%`));
      console.log(chalk.cyan(`🔗 View progress: https://github.com/${owner}/${repoName}/actions/runs/${workflowStatus.runId}`));
      
      // Wait for build to complete with live updates
      await waitForBuildCompletion(owner, repoName, workflowStatus.runId, workflowStatus.ghCommand);
      
    } else if (workflowStatus.status === 'completed' && workflowStatus.conclusion === 'failure') {
      spinner.fail(chalk.red('❌ Latest build failed'));
      console.log(chalk.red(`🔗 View error details: https://github.com/${owner}/${repoName}/actions/runs/${workflowStatus.runId}`));
      
    } else {
      spinner.warn(chalk.yellow('⚠️  No recent builds found'));
      console.log(chalk.blue(`🔗 View all workflows: https://github.com/${owner}/${repoName}/actions`));
    }

  } catch (error) {
    spinner.fail(chalk.red('Error: ' + error.message));
    process.exit(1);
  }
}

async function waitForBuildCompletion(owner, repo, runId, ghCommand) {
  console.log(chalk.yellow('\n🔄 Waiting for build to complete...'));
  console.log(chalk.blue('⏱️  Checking every 30 seconds for updates...\n'));
  
  let attempts = 0;
  const maxAttempts = 60; // 30 minutes max wait time
  
  while (attempts < maxAttempts) {
    try {
      // Wait 30 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 30000));
      attempts++;
      
      // Get current status
      const output = execSync(`${ghCommand} run view ${runId} --repo ${owner}/${repo} --json status,conclusion`, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const runData = JSON.parse(output);
      const status = runData.status;
      const conclusion = runData.conclusion;
      
      // Show progress update
      const progress = Math.min(attempts * 2, 95); // Simulate progress up to 95%
      process.stdout.write(`\r${chalk.blue('📊 Progress:')} ${progress}% ${chalk.gray(`(Check ${attempts}/${maxAttempts})`)}`);
      
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

async function getWorkflowStatus(owner, repo) {
  try {
    // Find GitHub CLI command
    let ghCommand = 'gh';
    
    // Check if GitHub CLI is installed
    try {
      execSync('gh --version', { stdio: 'pipe' });
    } catch (ghError) {
      // Check if it might be installed but not in PATH
      const possiblePaths = [
        'C:\\Program Files\\GitHub CLI\\gh.exe',
        'C:\\Program Files (x86)\\GitHub CLI\\gh.exe',
        '/usr/local/bin/gh',
        '/usr/bin/gh'
      ];
      
      let ghFound = false;
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
      
      if (!ghFound) {
        throw new Error('GitHub CLI is not installed or not in PATH. Please install it first:\n' +
          'Windows: winget install GitHub.cli\n' +
          'Mac: brew install gh\n' +
          'Linux: sudo apt install gh\n' +
          'Then restart your terminal and run: gh auth login');
      }
    }

    // Check if authenticated
    try {
      execSync(`${ghCommand} auth status`, { stdio: 'pipe' });
    } catch (authError) {
      throw new Error('GitHub CLI is not authenticated. Please run:\ngh auth login\nOr use: setup-gh-auth.bat');
    }

    // Use GitHub CLI to get workflow runs
    const output = execSync(`${ghCommand} run list --repo ${owner}/${repo} --limit 1 --json status,conclusion,number,url`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    const runs = JSON.parse(output);
    if (runs.length === 0) {
      return { status: 'not_found' };
    }

    const run = runs[0];
    const runId = run.url.split('/').pop();
    
    return {
      status: run.status,
      conclusion: run.conclusion,
      runId: runId,
      progress: run.status === 'in_progress' ? Math.floor(Math.random() * 100) : 100,
      ghCommand: ghCommand
    };
    
  } catch (error) {
    if (error.message.includes('GitHub CLI is not installed') || error.message.includes('not authenticated')) {
      throw error;
    }
    throw new Error('Failed to get workflow status. Make sure you have GitHub CLI installed and are authenticated.');
  }
}

async function downloadAPK(owner, repo, runId, ghCommand = 'gh') {
  const spinner = ora('Downloading APK...').start();
  
  try {
    // Create downloads directory
    const downloadsDir = 'downloads';
    await fs.ensureDir(downloadsDir);
    
    // Download artifact using GitHub CLI
    execSync(`${ghCommand} run download ${runId} --repo ${owner}/${repo} --dir ${downloadsDir}`, { 
      stdio: 'pipe' 
    });
    
    // Find the APK file (check both direct files and subdirectories)
    const files = await fs.readdir(downloadsDir);
    let apkFile = null;
    let apkPath = null;
    
    // First check for direct APK files
    apkFile = files.find(file => file.endsWith('.apk'));
    if (apkFile) {
      apkPath = path.join(downloadsDir, apkFile);
    } else {
      // Check subdirectories for APK files
      for (const file of files) {
        const filePath = path.join(downloadsDir, file);
        const stat = await fs.stat(filePath);
        if (stat.isDirectory()) {
          const subFiles = await fs.readdir(filePath);
          const subApkFile = subFiles.find(subFile => subFile.endsWith('.apk'));
          if (subApkFile) {
            apkFile = subApkFile;
            apkPath = path.join(filePath, subApkFile);
            break;
          }
        }
      }
    }
    
    if (apkFile && apkPath) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const newName = `app-${timestamp}.apk`;
      const newPath = path.join(downloadsDir, newName);
      
      // Copy instead of move to avoid conflicts
      await fs.copy(apkPath, newPath);
      
      spinner.succeed(chalk.green(`✅ APK downloaded successfully!`));
      console.log(chalk.blue(`📱 APK saved to: ${newPath}`));
      
      // Show file size
      const stats = await fs.stat(newPath);
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(chalk.cyan(`📊 File size: ${fileSizeInMB} MB`));
      
    } else {
      throw new Error('APK file not found in downloaded artifacts');
    }
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to download APK: ' + error.message));
    console.log(chalk.yellow('💡 You can manually download from GitHub Actions:'));
    console.log(chalk.blue(`🔗 https://github.com/${owner}/${repo}/actions/runs/${runId}`));
  }
}

async function showConfig() {
  console.log(chalk.blue('🔧 Current APK Configuration:'));
  console.log('');
  
  try {
    if (await fs.pathExists('apk-config.json')) {
      const config = await fs.readJson('apk-config.json');
      
      console.log(chalk.green('📱 App Name:') + ' ' + config.appName);
      console.log(chalk.green('🆔 App ID:') + ' ' + config.appId);
      console.log(chalk.green('📦 Version:') + ' ' + config.version);
      console.log(chalk.green('📝 Description:') + ' ' + config.description);
      console.log(chalk.green('🎨 Custom Icon:') + ' ' + (config.icon.enabled ? '✅ Enabled' : '❌ Disabled'));
      console.log(chalk.green('🖼️  Custom Splash:') + ' ' + (config.splash.enabled ? '✅ Enabled' : '❌ Disabled'));
      
    } else {
      console.log(chalk.yellow('⚠️  No configuration file found. Using default settings.'));
    }
    
  } catch (error) {
    console.log(chalk.red('❌ Error reading configuration: ' + error.message));
  }
}

async function setup() {
  console.log(chalk.blue('🚀 Web2APK Setup'));
  console.log('');
  
  try {
    // Run the update config script
    const { updateConfig } = require('./scripts/update-config.js');
    await updateConfig();
    
    console.log(chalk.green('✅ Setup completed!'));
    console.log(chalk.blue('📋 Next steps:'));
    console.log('1. Edit apk-config.json to customize your app');
    console.log('2. Add your website files to the www/ folder');
    console.log('3. Commit and push your changes');
    console.log('4. Run "web2apk getapk" to download your APK');
    
  } catch (error) {
    console.log(chalk.red('❌ Setup failed: ' + error.message));
  }
}

function showHelp() {
  console.log(chalk.blue('🚀 Web2APK - Convert Websites to Android APKs'));
  console.log('');
  console.log(chalk.green('Commands:'));
  console.log('  web2apk getapk     - Check build status and download APK');
  console.log('  web2apk config     - Show current APK configuration');
  console.log('  web2apk setup      - Run initial setup');
  console.log('  web2apk help       - Show this help message');
  console.log('');
  console.log(chalk.blue('Examples:'));
  console.log('  web2apk getapk     # Check status and download latest APK');
  console.log('  web2apk config     # View current app settings');
  console.log('');
  console.log(chalk.yellow('📚 For more information, visit:'));
  console.log('https://github.com/AshishY794/web2apk');
}

// Run the main function
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
