// 代码验证脚本
// 用于检查小程序代码的语法和结构

const fs = require('fs');
const path = require('path');

/**
 * 检查文件是否存在
 * @param {string} filePath - 文件路径
 */
function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * 读取文件内容
 * @param {string} filePath - 文件路径
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`读取文件失败: ${filePath}`, error);
    return null;
  }
}

/**
 * 检查文件语法
 * @param {string} content - 文件内容
 * @param {string} filePath - 文件路径
 */
function checkSyntax(content, filePath) {
  try {
    // 尝试解析为JavaScript代码
    new Function(content);
    return true;
  } catch (error) {
    console.error(`文件语法错误: ${filePath}`, error.message);
    return false;
  }
}

/**
 * 检查JSON文件格式
 * @param {string} content - 文件内容
 * @param {string} filePath - 文件路径
 */
function checkJSONSyntax(content, filePath) {
  try {
    JSON.parse(content);
    return true;
  } catch (error) {
    console.error(`JSON格式错误: ${filePath}`, error.message);
    return false;
  }
}

/**
 * 检查小程序配置文件
 */
function checkAppConfig() {
  console.log('检查小程序配置文件...');
  
  const appJsonPath = path.join(__dirname, '../app.json');
  if (!checkFileExists(appJsonPath)) {
    console.error('app.json 文件不存在');
    return false;
  }
  
  const appJsonContent = readFile(appJsonPath);
  if (!appJsonContent) {
    return false;
  }
  
  if (!checkJSONSyntax(appJsonContent, appJsonPath)) {
    return false;
  }
  
  console.log('app.json 配置文件检查通过');
  return true;
}

/**
 * 检查小程序入口文件
 */
function checkAppJs() {
  console.log('检查小程序入口文件...');
  
  const appJsPath = path.join(__dirname, '../app.js');
  if (!checkFileExists(appJsPath)) {
    console.error('app.js 文件不存在');
    return false;
  }
  
  const appJsContent = readFile(appJsPath);
  if (!appJsContent) {
    return false;
  }
  
  if (!checkSyntax(appJsContent, appJsPath)) {
    return false;
  }
  
  console.log('app.js 入口文件检查通过');
  return true;
}

/**
 * 检查页面文件
 */
function checkPages() {
  console.log('检查页面文件...');
  
  const pagesDir = path.join(__dirname, '../pages');
  if (!checkFileExists(pagesDir)) {
    console.error('pages 目录不存在');
    return false;
  }
  
  const pageFolders = fs.readdirSync(pagesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  let allPagesValid = true;
  
  pageFolders.forEach(pageName => {
    console.log(`检查页面: ${pageName}`);
    
    const pageDir = path.join(pagesDir, pageName);
    const jsFilePath = path.join(pageDir, `${pageName}.js`);
    const jsonFilePath = path.join(pageDir, `${pageName}.json`);
    const wxmlFilePath = path.join(pageDir, `${pageName}.wxml`);
    const wxssFilePath = path.join(pageDir, `${pageName}.wxss`);
    
    // 检查JS文件
    if (checkFileExists(jsFilePath)) {
      const jsContent = readFile(jsFilePath);
      if (jsContent && !checkSyntax(jsContent, jsFilePath)) {
        allPagesValid = false;
      }
    } else {
      console.warn(`页面 ${pageName} 缺少 JS 文件`);
    }
    
    // 检查JSON文件
    if (checkFileExists(jsonFilePath)) {
      const jsonContent = readFile(jsonFilePath);
      if (jsonContent && !checkJSONSyntax(jsonContent, jsonFilePath)) {
        allPagesValid = false;
      }
    } else {
      console.warn(`页面 ${pageName} 缺少 JSON 文件`);
    }
    
    // 检查WXML文件
    if (!checkFileExists(wxmlFilePath)) {
      console.warn(`页面 ${pageName} 缺少 WXML 文件`);
    }
    
    // 检查WXSS文件
    if (!checkFileExists(wxssFilePath)) {
      console.warn(`页面 ${pageName} 缺少 WXSS 文件`);
    }
  });
  
  if (allPagesValid) {
    console.log('所有页面文件检查通过');
  }
  
  return allPagesValid;
}

/**
 * 检查工具文件
 */
function checkUtils() {
  console.log('检查工具文件...');
  
  const utilsDir = path.join(__dirname, '../utils');
  if (!checkFileExists(utilsDir)) {
    console.warn('utils 目录不存在');
    return true; // 工具目录不是必须的
  }
  
  const utilFiles = fs.readdirSync(utilsDir)
    .filter(file => file.endsWith('.js'));
  
  let allUtilsValid = true;
  
  utilFiles.forEach(fileName => {
    const filePath = path.join(utilsDir, fileName);
    const content = readFile(filePath);
    if (content && !checkSyntax(content, filePath)) {
      allUtilsValid = false;
    }
  });
  
  if (allUtilsValid) {
    console.log('工具文件检查通过');
  }
  
  return allUtilsValid;
}

/**
 * 运行代码验证
 */
function runCodeValidation() {
  console.log('=== 微信小程序代码验证 ===');
  
  const validationResults = {
    appConfig: checkAppConfig(),
    appJs: checkAppJs(),
    pages: checkPages(),
    utils: checkUtils()
  };
  
  const allValidationsPassed = Object.values(validationResults).every(result => result);
  
  console.log('\n=== 验证结果 ===');
  console.log(`整体结果: ${allValidationsPassed ? '通过' : '失败'}`);
  console.log('详细结果:');
  console.log(`  配置文件: ${validationResults.appConfig ? '通过' : '失败'}`);
  console.log(`  入口文件: ${validationResults.appJs ? '通过' : '失败'}`);
  console.log(`  页面文件: ${validationResults.pages ? '通过' : '失败'}`);
  console.log(`  工具文件: ${validationResults.utils ? '通过' : '失败'}`);
  
  console.log('\n=== 验证完成 ===');
  
  return {
    success: allValidationsPassed,
    results: validationResults,
    timestamp: new Date().toISOString()
  };
}

// 执行验证
if (require.main === module) {
  runCodeValidation();
}

module.exports = {
  runCodeValidation,
  checkAppConfig,
  checkAppJs,
  checkPages,
  checkUtils
};
