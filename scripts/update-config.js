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

    // Handle app icon
    if (config.icon.enabled && await fs.pathExists(config.icon.path)) {
      await updateAppIcon(config.icon);
    }

    // Handle splash screen
    if (config.splash.enabled && await fs.pathExists(config.splash.path)) {
      await updateSplashScreen(config.splash);
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

  // Copy icon to all density folders
  const densities = [
    { folder: 'mipmap-mdpi', size: iconConfig.sizes.mdpi },
    { folder: 'mipmap-hdpi', size: iconConfig.sizes.hdpi },
    { folder: 'mipmap-xhdpi', size: iconConfig.sizes.xhdpi },
    { folder: 'mipmap-xxhdpi', size: iconConfig.sizes.xxhdpi },
    { folder: 'mipmap-xxxhdpi', size: iconConfig.sizes.xxxhdpi }
  ];

  for (const density of densities) {
    const targetPath = `${androidResPath}/${density.folder}/ic_launcher.png`;
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
    styles = styles.replace(
      /android:color="[^"]*"/,
      `android:color="${splashConfig.color}"`
    );
    await fs.writeFile(stylesPath, styles);
  }

  console.log(chalk.green('✅ Splash screen updated'));
}

if (require.main === module) {
  updateConfig();
}

module.exports = { updateConfig };
