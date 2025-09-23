const fs = require('fs-extra');
const chalk = require('chalk');
const ora = require('ora');

async function githubSetup() {
  const spinner = ora('Setting up GitHub Actions workflow...').start();
  
  try {
    // Check if we're in a git repository
    if (!await fs.pathExists('.git')) {
      throw new Error('Not a git repository. Please run "git init" first.');
    }
    
    // Check if .github/workflows directory exists
    await fs.ensureDir('.github/workflows');
    
    // Check if workflow files exist
    const workflowExists = await fs.pathExists('.github/workflows/build-apk.yml');
    
    if (workflowExists) {
      spinner.warn('GitHub Actions workflow already exists!');
      console.log(chalk.blue('\n📋 Your repository is ready for GitHub Actions!'));
    } else {
      spinner.succeed('GitHub Actions workflow is ready!');
      console.log(chalk.blue('\n📋 Next steps:'));
    }
    
    console.log(chalk.yellow('\n1. Push your code to GitHub:'));
    console.log(chalk.cyan('   git add .'));
    console.log(chalk.cyan('   git commit -m "Add Web2App converter"'));
    console.log(chalk.cyan('   git push origin main  # (or master, depending on your repo)'));
    
    console.log(chalk.yellow('\n2. Check the Actions tab in your GitHub repository'));
    console.log(chalk.yellow('\n3. Your APK will be built automatically!'));
    
    console.log(chalk.green('\n✨ No Android Studio required - everything runs in the cloud!'));
    
    // Check for required files
    const requiredFiles = ['index.html', 'style.css', 'script.js'];
    const missingFiles = [];
    
    for (const file of requiredFiles) {
      if (!await fs.pathExists(file)) {
        missingFiles.push(file);
      }
    }
    
    if (missingFiles.length > 0) {
      console.log(chalk.yellow('\n⚠️  Missing files:'));
      missingFiles.forEach(file => {
        console.log(chalk.red(`   - ${file}`));
      });
      console.log(chalk.blue('\n💡 The example files are already included, but you can replace them with your own!'));
    } else {
      console.log(chalk.green('\n✅ All required files are present!'));
    }
    
  } catch (error) {
    spinner.fail(chalk.red('GitHub setup failed: ' + error.message));
    process.exit(1);
  }
}

if (require.main === module) {
  githubSetup();
}

module.exports = { githubSetup };
