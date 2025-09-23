const fs = require('fs-extra');
const { execSync } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');
const path = require('path');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to detect the correct branch name (master or main)
function getCurrentBranchName() {
  try {
    // Get current branch name
    const currentBranch = execSync('git branch --show-current', { 
      stdio: 'pipe',
      encoding: 'utf8'
    }).trim();
    
    // Also check what the default branch is on remote
    try {
      const defaultBranch = execSync('git symbolic-ref refs/remotes/origin/HEAD', { 
        stdio: 'pipe',
        encoding: 'utf8'
      }).replace('refs/remotes/origin/', '').trim();
      
      // If we have a default branch from remote, prefer that
      if (defaultBranch && (defaultBranch === 'master' || defaultBranch === 'main')) {
        return defaultBranch;
      }
    } catch (e) {
      // If we can't get remote default, continue with current branch
    }
    
    // Return current branch if it's master or main
    if (currentBranch === 'master' || currentBranch === 'main') {
      return currentBranch;
    }
    
    // Fallback to checking remote branches
    try {
      const remoteBranches = execSync('git branch -r', { 
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      if (remoteBranches.includes('origin/master')) {
        return 'master';
      } else if (remoteBranches.includes('origin/main')) {
        return 'main';
      }
    } catch (e) {
      // Continue with fallback
    }
    
    // Final fallback - try main first, then master
    try {
      execSync('git show-ref --verify --quiet refs/heads/main');
      return 'main';
    } catch (e) {
      try {
        execSync('git show-ref --verify --quiet refs/heads/master');
        return 'master';
      } catch (e) {
        // Default to main as it's the modern standard
        return 'main';
      }
    }
  } catch (error) {
    // If all else fails, default to main
    console.log(chalk.yellow('⚠️  Could not detect branch name, defaulting to main'));
    return 'main';
  }
}

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

async function updateApp() {
  console.log(chalk.blue('🔄 Web2APK Update - Updating your Android app!'));
  console.log(chalk.yellow('🎯 This will update your app with any changes you made to your website files.'));
  console.log('');

  try {
    // Step 1: Check if we're in the right directory and have existing config
    await checkUpdatePrerequisites();

    // Step 2: Check GitHub CLI
    const ghCommand = await checkAndSetupGitHubCLI();

    // Step 3: Update website files if needed
    await updateWebsiteFiles();

    // Step 4: Update app configuration if needed
    await updateAppConfiguration();

    // Step 5: Update version number
    const newVersion = await updateVersionNumber();

    // Step 6: Push changes to GitHub
    await pushUpdateToGitHub(ghCommand, newVersion);

    // Step 7: Wait for build and download updated APK
    await waitForUpdateBuildAndDownload(newVersion);

    // Success!
    console.log(chalk.green('\n🎉🎉🎉 UPDATE SUCCESSFUL! 🎉🎉🎉'));
    console.log(chalk.blue('Your app has been updated with the latest changes!'));
    console.log(chalk.cyan('📱 Check the downloads/ folder for your updated APK file!'));
    console.log(chalk.yellow('📲 You can now install the updated APK on your Android device!'));

  } catch (error) {
    console.log(chalk.red('\n❌ Update failed: ' + error.message));
    console.log(chalk.yellow('💡 Don\'t worry! You can try again or ask for help.'));
  } finally {
    rl.close();
  }
}

async function checkUpdatePrerequisites() {
  const spinner = ora('Checking update prerequisites...').start();
  
  try {
    // Check if we're in the right directory
    if (!await fs.pathExists('package.json')) {
      throw new Error('Please run this command from the web2apk directory');
    }

    // Check if apk-config.json exists
    if (!await fs.pathExists('apk-config.json')) {
      throw new Error('No apk-config.json found. Please run "web2apk" first to create your initial app.');
    }

    // Check if www directory exists
    if (!await fs.pathExists('www')) {
      throw new Error('No www directory found. Please run "web2apk" first to create your initial app.');
    }

    // Check if git repository exists
    if (!await fs.pathExists('.git')) {
      throw new Error('No Git repository found. Please run "web2apk" first to create your initial app.');
    }

    spinner.succeed(chalk.green('✅ Update prerequisites check passed!'));
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
      throw new Error('GitHub CLI not found. Please install it first.');
    }

    // Check if authenticated
    try {
      execSync(`${ghCommand} auth status`, { stdio: 'pipe' });
      spinner.succeed(chalk.green('✅ GitHub CLI is ready!'));
    } catch (authError) {
      throw new Error('GitHub CLI not authenticated. Please run "gh auth login" first.');
    }

    return ghCommand;

  } catch (error) {
    spinner.fail(chalk.red('❌ ' + error.message));
    throw error;
  }
}

async function updateWebsiteFiles() {
  console.log(chalk.blue('\n📁 Checking for website file changes in www/ folder...'));
  
  try {
    // Check if www directory exists
    if (!await fs.pathExists('www')) {
      console.log(chalk.yellow('⚠️  No www directory found. Skipping file updates.'));
      return;
    }

    // Check for uncommitted changes in www folder
    const hasChanges = await checkForUncommittedChanges();
    
    if (hasChanges) {
      console.log(chalk.green('✅ Changes detected in www/ folder!'));
      console.log(chalk.blue('📝 The following files have been modified:'));
      
      // Show what files changed
      try {
        const gitStatus = execSync('git status --porcelain www/', { encoding: 'utf8' });
        const changedFiles = gitStatus.split('\n')
          .filter(line => line.trim())
          .map(line => line.substring(3).trim()); // Remove status indicators
        
        if (changedFiles.length > 0) {
          changedFiles.forEach(file => {
            console.log(chalk.gray(`  📄 ${file}`));
          });
        }
      } catch (e) {
        console.log(chalk.gray('  📄 Files in www/ folder have been modified'));
      }
      
      console.log(chalk.green('✅ Website files are ready for update!'));
    } else {
      console.log(chalk.yellow('⚠️  No changes detected in www/ folder.'));
      console.log(chalk.blue('💡 Make changes to your files in the www/ directory and run update again.'));
      
      const continueChoice = await askQuestion('Do you want to continue with the update anyway? (y/n): ');
      if (continueChoice.toLowerCase() !== 'y' && continueChoice.toLowerCase() !== 'yes') {
        console.log(chalk.blue('📁 Skipping update due to no changes.'));
        return;
      }
    }
    
  } catch (error) {
    console.log(chalk.red('❌ Failed to check website files: ' + error.message));
    throw error;
  }
}

async function checkForUncommittedChanges() {
  try {
    // Check if there are any uncommitted changes in www folder
    const gitStatus = execSync('git status --porcelain www/', { encoding: 'utf8' });
    return gitStatus.trim().length > 0;
  } catch (error) {
    // If git command fails, assume there are changes
    console.log(chalk.gray('Could not check git status, assuming changes exist.'));
    return true;
  }
}

async function updateAppConfiguration() {
  console.log(chalk.blue('\n🎨 Checking for app configuration updates...'));
  
  const configChoice = await askQuestion('Do you want to update your app settings (name, icon, splash, etc.)? (y/n): ');
  
  if (configChoice.toLowerCase() === 'y' || configChoice.toLowerCase() === 'yes') {
    // Import the customizeAppSettings function from the main file
    const { customizeAppSettings } = require('../web2apk.js');
    await customizeAppSettings();
  } else {
    console.log(chalk.blue('📱 Keeping existing app configuration.'));
  }
}

async function updateVersionNumber() {
  console.log(chalk.blue('\n📦 Updating version number...'));
  
  try {
    // Read current config
    const config = await fs.readJson('apk-config.json');
    const currentVersion = config.version || '1.0.0';
    
    console.log(chalk.cyan(`Current version: ${currentVersion}`));
    
    const versionChoice = await askQuestion('How do you want to update the version? (patch/minor/major/custom): ');
    
    let newVersion;
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    
    switch (versionChoice.toLowerCase()) {
      case 'patch':
        newVersion = `${major}.${minor}.${patch + 1}`;
        break;
      case 'minor':
        newVersion = `${major}.${minor + 1}.0`;
        break;
      case 'major':
        newVersion = `${major + 1}.0.0`;
        break;
      case 'custom':
        newVersion = await askQuestion('Enter new version (e.g., 1.2.3): ');
        break;
      default:
        newVersion = `${major}.${minor}.${patch + 1}`;
        console.log(chalk.yellow('Invalid choice, using patch update.'));
    }
    
    // Update config
    config.version = newVersion;
    await fs.writeJson('apk-config.json', config, { spaces: 2 });
    
    console.log(chalk.green(`✅ Version updated to: ${newVersion}`));
    return newVersion;
    
  } catch (error) {
    console.log(chalk.red('❌ Failed to update version: ' + error.message));
    return '1.0.1'; // Fallback version
  }
}

async function pushUpdateToGitHub(ghCommand, newVersion) {
  console.log(chalk.blue('\n🚀 Pushing update to GitHub...'));
  
  // Detect the correct branch name
  const branchName = getCurrentBranchName();
  console.log(chalk.gray(`🔧 Using branch: ${branchName}`));
  
  const spinner = ora('Pushing changes...').start();
  
  try {
    // Add all changes
    execSync('git add .', { stdio: 'pipe' });
    
    // Commit with update message
    const commitMessage = `Update: Version ${newVersion} - App update with latest changes`;
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'pipe' });
    
    // Push to GitHub
    execSync(`git push origin ${branchName}`, { stdio: 'pipe' });
    
    spinner.succeed(chalk.green('✅ Update pushed to GitHub successfully!'));
    console.log(chalk.blue('🔄 GitHub Actions is now building your updated APK...'));
    
  } catch (error) {
    spinner.fail(chalk.red('❌ Failed to push update: ' + error.message));
    throw error;
  }
}

async function waitForUpdateBuildAndDownload(newVersion) {
  console.log(chalk.blue('\n⏳ Waiting for your updated APK to be built...'));
  console.log(chalk.yellow('This usually takes 5-15 minutes. We\'ll check every 10 seconds.'));
  console.log(chalk.cyan('🔨 Building updated APK...'));
  
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
      console.log(chalk.green('✅ Update build already completed! Downloading APK...'));
      await downloadUpdatedAPK(owner, repoName, workflowStatus.runId, ghCommand, newVersion);
    } else {
      console.log(chalk.blue('🔄 Update build in progress, waiting for completion...'));
      await waitForUpdateBuildCompletion(owner, repoName, workflowStatus.runId, ghCommand, newVersion);
    }

  } catch (error) {
    console.log(chalk.yellow('⚠️  Could not automatically download updated APK: ' + error.message));
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

async function waitForUpdateBuildCompletion(owner, repo, runId, ghCommand, newVersion) {
  console.log(chalk.yellow('\n🔄 Waiting for update build to complete...'));
  console.log(chalk.blue('⏱️  Checking every 10 seconds for updates...\n'));
  
  let attempts = 0;
  const maxAttempts = 180; // 30 minutes max wait time
  
  while (attempts < maxAttempts) {
    try {
      await new Promise(resolve => setTimeout(resolve, 10000));
      attempts++;
      
      const output = execSync(`${ghCommand} run view ${runId} --repo ${owner}/${repo} --json status,conclusion,createdAt,updatedAt`, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const runData = JSON.parse(output);
      const status = runData.status;
      const conclusion = runData.conclusion;
      const createdAt = new Date(runData.createdAt);
      
      const now = new Date();
      const elapsedMinutes = Math.floor((now - createdAt) / (1000 * 60));
      
      let statusMessage = 'Building updated APK...';
      if (elapsedMinutes > 2) statusMessage = 'Finalizing update...';
      
      process.stdout.write(`\r${chalk.blue('🔨')} ${statusMessage} ${chalk.gray(`(${elapsedMinutes}min elapsed)`)}`);
      
      if (status === 'completed') {
        console.log('\n');
        
        if (conclusion === 'success') {
          console.log(chalk.green('✅ Update build completed successfully!'));
          console.log(chalk.blue('📥 Downloading updated APK...'));
          
          await downloadUpdatedAPK(owner, repo, runId, ghCommand, newVersion);
          
          console.log(chalk.green('\n🎉 Updated APK ready! Build and download completed successfully!'));
          console.log(chalk.cyan('📱 You can now install the updated APK on your Android device.'));
          return;
          
        } else if (conclusion === 'failure') {
          console.log(chalk.red('\n❌ Update build failed!'));
          console.log(chalk.red(`🔗 View error details: https://github.com/${owner}/${repo}/actions/runs/${runId}`));
          return;
          
        } else {
          console.log(chalk.yellow(`\n⚠️  Update build completed with status: ${conclusion}`));
          return;
        }
      }
      
    } catch (error) {
      console.log(chalk.red(`\n❌ Error checking update build status: ${error.message}`));
      return;
    }
  }
  
  console.log(chalk.yellow('\n⏰ Update build is taking longer than expected. You can check manually:'));
  console.log(chalk.blue(`🔗 https://github.com/${owner}/${repo}/actions/runs/${runId}`));
}

async function downloadUpdatedAPK(owner, repo, runId, ghCommand, newVersion) {
  try {
    // Create downloads directory
    await fs.ensureDir('downloads');
    
    // Create versioned subdirectory
    const versionDir = `downloads/app-update-v${newVersion}`;
    await fs.ensureDir(versionDir);
    
    // Download artifacts
    const downloadPath = path.join(process.cwd(), versionDir);
    execSync(`${ghCommand} run download ${runId} --repo ${owner}/${repo} --dir "${downloadPath}"`, { 
      stdio: 'pipe' 
    });
    
    // Find and move APK file with versioned name
    const files = await fs.readdir(downloadPath);
    let apkFile = null;
    
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
      const finalApkPath = path.join(downloadPath, `app-update-v${newVersion}.apk`);
      await fs.copy(apkFile, finalApkPath);
      
      // Also copy to main downloads folder with versioned name
      const mainDownloadPath = path.join('downloads', `app-update-v${newVersion}.apk`);
      await fs.copy(apkFile, mainDownloadPath);
      
      console.log(chalk.green(`✅ Updated APK downloaded: ${mainDownloadPath}`));
      console.log(chalk.cyan(`📁 Version details folder: ${versionDir}`));
      
      // Show file size
      const stats = await fs.stat(mainDownloadPath);
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(chalk.cyan(`📊 Updated APK Size: ${fileSizeInMB} MB`));
      
    } else {
      console.log(chalk.yellow('⚠️  APK file not found in artifacts'));
    }
    
  } catch (error) {
    throw new Error('Failed to download updated APK: ' + error.message);
  }
}

// Run the update function if this script is executed directly
if (require.main === module) {
  updateApp().catch(console.error);
}

module.exports = { updateApp };
