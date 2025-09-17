const fs = require('fs-extra');
const { execSync } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');

async function setup() {
  const spinner = ora('Setting up Web2App converter...').start();
  
  try {
    // Create necessary directories
    await fs.ensureDir('www');
    await fs.ensureDir('android');
    
    // Check if user has their website files
    const hasIndexHtml = await fs.pathExists('index.html');
    const hasWwwFiles = await fs.pathExists('www/index.html');
    
    if (!hasIndexHtml && !hasWwwFiles) {
      spinner.warn('No index.html found. Creating example files...');
      await createExampleFiles();
    }
    
    // Ensure website exists in www (Capacitor webDir)
    if (!hasWwwFiles && hasIndexHtml) {
      await fs.copy('index.html', 'www/index.html');
      for (const extra of ['style.css', 'script.js', 'manifest.json', 'sw.js']) {
        if (await fs.pathExists(extra)) {
          await fs.copy(extra, `www/${extra}`);
        }
      }
    }
    
    // Initialize Capacitor (skip when config exists or project initialized)
    const hasCapConfig = await fs.pathExists('capacitor.config.ts') || await fs.pathExists('capacitor.config.json') || await fs.pathExists('capacitor.config.js');
    spinner.text = 'Initializing Capacitor...';
    try {
      if (!hasCapConfig) {
        execSync('npx cap init "Web2App" "com.example.web2app"', { stdio: 'pipe' });
      } else {
        console.log('Capacitor already initialized');
      }
    } catch (error) {
      console.log('Capacitor init skipped:', error.message);
    }
    
    // Clean up existing Android platform if it exists
    if (await fs.pathExists('android')) {
      spinner.text = 'Removing existing Android platform...';
      await fs.remove('android');
      console.log('🗑️  Removed existing Android platform');
    }

    // Add Android platform
    spinner.text = 'Adding Android platform...';
    try {
      execSync('npx cap add android', { stdio: 'pipe' });
      console.log('✅ Android platform added successfully');
    } catch (error) {
      console.log('❌ Failed to add Android platform:', error.message);
      throw error;
    }
    
    // Sync files
    spinner.text = 'Syncing files...';
    try {
      execSync('npx cap sync', { stdio: 'pipe' });
    } catch (error) {
      console.log('Cap sync failed:', error.message);
      // Try to continue anyway
    }
    
    // Update app configuration (icon, splash, etc.) after platform is created
    spinner.text = 'Applying app customization...';
    try {
      execSync('node scripts/update-config.js', { stdio: 'pipe' });
      console.log('✅ App customization applied');
    } catch (error) {
      console.log('App customization failed:', error.message);
      // Continue anyway
    }
    
    spinner.succeed(chalk.green('Setup completed successfully!'));
    console.log(chalk.blue('\n📱 Your website is ready to be converted to APK!'));
    console.log(chalk.yellow('Run: npm run buildapk'));
    
  } catch (error) {
    spinner.fail(chalk.red('Setup failed: ' + error.message));
    process.exit(1);
  }
}

async function createExampleFiles() {
  const exampleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Web App</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            max-width: 600px;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        h1 {
            font-size: 3em;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        p {
            font-size: 1.2em;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        .btn {
            background: #ff6b6b;
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 50px;
            font-size: 1.1em;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Welcome to Web2App!</h1>
        <p>This is an example website that will be converted to an Android APK. Replace this content with your own website files!</p>
        <button class="btn" onclick="showAlert()">Click Me!</button>
    </div>

    <script>
        function showAlert() {
            alert('Hello from your Web2App! 🎉');
        }
        
        // Add some interactive features
        document.addEventListener('DOMContentLoaded', function() {
            console.log('Web2App is ready!');
        });
    </script>
</body>
</html>`;

  await fs.writeFile('index.html', exampleHtml);
  await fs.copy('index.html', 'www/index.html');
  
  console.log(chalk.green('✅ Created example index.html file'));
}

if (require.main === module) {
  setup();
}

module.exports = { setup };

