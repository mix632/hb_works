const fs = require('fs');
const path = require('path');
let JavaScriptObfuscator = null;
try {
  JavaScriptObfuscator = require('javascript-obfuscator');
} catch (err) {
  console.error('缺少依赖 javascript-obfuscator，请先执行: npm i -D javascript-obfuscator');
  process.exit(1);
}

const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'obfuscated');
const configPath = path.join(__dirname, 'obfuscator-config.json');

function loadObfuscateOptions() {
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    console.warn(`读取 ${configPath} 失败，使用最小配置。`, err.message);
    return { compact: true };
  }
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(source, target) {
  ensureDir(path.dirname(target));
  fs.copyFileSync(source, target);
  console.log(`复制文件: ${source} -> ${target}`);
}

function obfuscateFile(source, target, options) {
  const sourceCode = fs.readFileSync(source, 'utf8');
  const result = JavaScriptObfuscator.obfuscate(sourceCode, options);
  ensureDir(path.dirname(target));
  fs.writeFileSync(target, result.getObfuscatedCode());
  console.log(`混淆完成: ${source} -> ${target}`);
}

// 递归遍历目录：.js 混淆，其他文件原样复制
function processDirectory(sourceDir, targetDir, options) {
  if (!fs.existsSync(sourceDir)) return;
  ensureDir(targetDir);

  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      processDirectory(sourcePath, targetPath, options);
      continue;
    }

    if (entry.name === '.DS_Store') continue;
    if (entry.name.endsWith('.js')) {
      obfuscateFile(sourcePath, targetPath, options);
    } else {
      copyFile(sourcePath, targetPath);
    }
  }
}

function main() {
  const options = loadObfuscateOptions();

  // 每次构建都清理旧产物
  fs.rmSync(outputDir, { recursive: true, force: true });
  ensureDir(outputDir);

  // 新结构：入口和业务代码都在 src/
  processDirectory(path.join(rootDir, 'src'), path.join(outputDir, 'src'), options);

  // 运行所需根文件直接复制
  const rootFilesToCopy = [
    'package.json',
    'package-lock.json',
    'config.json',
    'ecosystem.config.js',
  ];
  for (const name of rootFilesToCopy) {
    const source = path.join(rootDir, name);
    const target = path.join(outputDir, name);
    if (fs.existsSync(source)) copyFile(source, target);
  }

  console.log(`项目混淆完成，输出目录: ${outputDir}`);
}

main();
