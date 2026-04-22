const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

// 混淆配置（最简配置）
const obfuscateOptions = { compact: true };

// 递归遍历目录，混淆所有 .js 文件
function obfuscateDirectory(sourceDir, targetDir) {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const files = fs.readdirSync(sourceDir);
  for (const file of files) {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);

    if (fs.statSync(sourcePath).isDirectory()) {
      // 递归处理子目录
      obfuscateDirectory(sourcePath, targetPath);
    } else if (file.endsWith('.js') && file !== 'obfuscate.js') {
      // 混淆 .js 文件，排除 obfuscate.js
      const sourceCode = fs.readFileSync(sourcePath, 'utf8');
      const obfuscationResult = JavaScriptObfuscator.obfuscate(sourceCode, obfuscateOptions);
      fs.writeFileSync(targetPath, obfuscationResult.getObfuscatedCode());
      console.log(`混淆完成: ${sourcePath} -> ${targetPath}`);
    } else {
      // 非 .js 文件直接复制
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`复制文件: ${sourcePath} -> ${targetPath}`);
    }
  }
}

// 混淆项目根目录下的 util 目录、app.js 和 config.json
const rootDir = path.resolve(__dirname, '..');
const obfuscatedRootDir = path.join(rootDir, 'obfuscated');
if (!fs.existsSync(obfuscatedRootDir)) {
  fs.mkdirSync(obfuscatedRootDir);
}

// 混淆 app.js
const appJsPath = path.join(rootDir, 'index.js');
const appJsTargetPath = path.join(obfuscatedRootDir, 'index.js');
console.log(appJsTargetPath)
if (fs.existsSync(appJsPath)) {
  const appJsCode = fs.readFileSync(appJsPath, 'utf8');
  const obfuscationResult = JavaScriptObfuscator.obfuscate(appJsCode, obfuscateOptions);
  fs.writeFileSync(appJsTargetPath, obfuscationResult.getObfuscatedCode());
  console.log(`混淆完成: ${appJsPath} -> ${appJsTargetPath}`);
}

// 复制 config.json
const configJsonPath = path.join(rootDir, 'config.json');
const configJsonTargetPath = path.join(obfuscatedRootDir, 'config.json');
if (fs.existsSync(configJsonPath)) {
  fs.copyFileSync(configJsonPath, configJsonTargetPath);
  console.log(`复制文件: ${configJsonPath} -> ${configJsonTargetPath}`);
}

// 复制 package.json
const packageJsonPath = path.join(rootDir, 'package.json');
const packageJsonTargetPath = path.join(obfuscatedRootDir, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  fs.copyFileSync(packageJsonPath, packageJsonTargetPath);
  console.log(`复制文件: ${packageJsonPath} -> ${packageJsonTargetPath}`);
}

// 混淆 api 目录
const apiSourceDir = path.join(rootDir, 'api');
const apiTargetDir = path.join(obfuscatedRootDir, 'api');
obfuscateDirectory(apiSourceDir, apiTargetDir);

// 混淆 chrome-scriptes 目录
const chromeScriptsSourceDir = path.join(rootDir, 'chrome-scriptes');
const chromeScriptsTargetDir = path.join(obfuscatedRootDir, 'chrome-scriptes');
if (fs.existsSync(chromeScriptsSourceDir)) {
  obfuscateDirectory(chromeScriptsSourceDir, chromeScriptsTargetDir);
}

console.log('项目混淆完成！'); 