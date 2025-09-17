const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

async function updateConfig() {
  try {
    // Read APK configuration
    const configPath = 'apk-config.json';
    if (!await fs.pathExists(configPath)) {
      console.log(chalk.yellow('⚠️  apk-config.json not found. Using default settings.'));
      return;
    }

    const config = await fs.readJson(configPath);
    console.log(chalk.blue('🔧 Updating APK configuration...'));

    // Update Capacitor config
    const capacitorConfigPath = 'capacitor.config.ts';
    if (await fs.pathExists(capacitorConfigPath)) {
      let capacitorConfig = await fs.readFile(capacitorConfigPath, 'utf8');
      
      // Update app name and ID
      capacitorConfig = capacitorConfig.replace(
        /appId:\s*['"][^'"]*['"]/,
        `appId: '${config.appId}'`
      );
      capacitorConfig = capacitorConfig.replace(
        /appName:\s*['"][^'"]*['"]/,
        `appName: '${config.appName}'`
      );

      await fs.writeFile(capacitorConfigPath, capacitorConfig);
      console.log(chalk.green('✅ Updated Capacitor configuration'));
    }

    // Update package.json
    const packageJsonPath = 'package.json';
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      packageJson.name = config.appId.replace(/\./g, '-');
      packageJson.description = config.description;
      packageJson.version = config.version;
      
      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
      console.log(chalk.green('✅ Updated package.json'));
    }

    // Handle app icon (guarded)
    const iconCfg = config.icon || {};
    if (iconCfg.enabled && iconCfg.path && await fs.pathExists(iconCfg.path)) {
      await updateAppIcon(iconCfg);
    } else {
      console.log(chalk.gray('📱 Skipping icon update (not enabled or file not found)'));
    }

    // Handle splash screen (supports both splash and splashScreen shapes)
    const splashCfg = (config.splash || config.splashScreen) || {};
    if (splashCfg.enabled && splashCfg.path && await fs.pathExists(splashCfg.path)) {
      await updateSplashScreen(splashCfg);
    } else {
      console.log(chalk.gray('🌅 Skipping splash update (not enabled or file not found)'));
    }

    console.log(chalk.green('🎉 APK configuration updated successfully!'));

  } catch (error) {
    console.log(chalk.red('❌ Error updating configuration: ' + error.message));
  }
}

async function updateAppIcon(iconConfig) {
  console.log(chalk.blue('🎨 Updating app icon...'));
  
  const iconPath = iconConfig.path;
  const androidResPath = 'android/app/src/main/res';
  
  // Create directories if they don't exist
  const directories = [
    `${androidResPath}/mipmap-mdpi`,
    `${androidResPath}/mipmap-hdpi`,
    `${androidResPath}/mipmap-xhdpi`,
    `${androidResPath}/mipmap-xxhdpi`,
    `${androidResPath}/mipmap-xxxhdpi`
  ];

  for (const dir of directories) {
    await fs.ensureDir(dir);
  }

  // Copy icon to all density folders (just copy the same file to all densities)
  const densityFolders = [
    'mipmap-mdpi',
    'mipmap-hdpi', 
    'mipmap-xhdpi',
    'mipmap-xxhdpi',
    'mipmap-xxxhdpi'
  ];

  for (const folder of densityFolders) {
    const targetPath = `${androidResPath}/${folder}/ic_launcher.png`;
    await fs.copy(iconPath, targetPath);
  }

  console.log(chalk.green('✅ App icon updated'));
}

async function updateSplashScreen(splashConfig) {
  console.log(chalk.blue('🖼️  Updating splash screen...'));
  
  // Update splash screen color in styles.xml
  const stylesPath = 'android/app/src/main/res/values/styles.xml';
  if (await fs.pathExists(stylesPath)) {
    let styles = await fs.readFile(stylesPath, 'utf8');
    const splashColor = splashConfig.color || '#ffffff';
    styles = styles.replace(
      /android:color="[^"]*"/,
      `android:color="${splashColor}"`
    );
    await fs.writeFile(stylesPath, styles);
    console.log(chalk.green('✅ Splash screen color updated'));
  } else {
    console.log(chalk.yellow('⚠️  styles.xml not found, skipping splash color update'));
  }
}

if (require.main === module) {
  updateConfig();
}

module.exports = { updateConfig };
