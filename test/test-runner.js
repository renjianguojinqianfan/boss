// 兼容性测试运行器
// 用于运行所有兼容性测试并生成测试报告

// 导入测试函数
const {
  testDeviceCompatibility,
  testNetworkCompatibility,
  testSDKCompatibility,
  testPagePerformance,
  testFunctionCompatibility,
  runAllCompatibilityTests
} = require('./compatibility-test');

/**
 * 运行测试并生成报告
 */
function runTests() {
  console.log('=== 微信小程序兼容性测试 ===');
  console.log('开始运行测试...');
  
  // 运行所有测试
  const results = runAllCompatibilityTests();
  
  // 生成测试报告
  generateTestReport(results);
  
  console.log('=== 测试完成 ===');
}

/**
 * 生成测试报告
 * @param {Object} results - 测试结果
 */
function generateTestReport(results) {
  console.log('\n=== 测试报告 ===');
  console.log(`测试时间: ${results.timestamp}`);
  console.log(`整体结果: ${results.success ? '通过' : '失败'}`);
  console.log('\n详细结果:');
  
  // 设备兼容性测试结果
  console.log('\n1. 设备兼容性测试:');
  const deviceResult = results.results.deviceCompatibility;
  console.log(`   结果: ${deviceResult.success ? '通过' : '失败'}`);
  if (deviceResult.success && deviceResult.deviceInfo) {
    console.log(`   设备型号: ${deviceResult.deviceInfo.model}`);
    console.log(`   系统版本: ${deviceResult.deviceInfo.system}`);
    console.log(`   平台: ${deviceResult.deviceInfo.platform}`);
  }
  
  // 网络兼容性测试结果
  console.log('\n2. 网络兼容性测试:');
  const networkResult = results.results.networkCompatibility;
  console.log(`   结果: ${networkResult.success ? '通过' : '失败'}`);
  if (networkResult.success) {
    console.log(`   网络类型: ${networkResult.networkType}`);
    console.log(`   连接状态: ${networkResult.isConnected ? '已连接' : '未连接'}`);
  }
  
  // SDK兼容性测试结果
  console.log('\n3. SDK兼容性测试:');
  const sdkResult = results.results.sdkCompatibility;
  console.log(`   结果: ${sdkResult.success ? '通过' : '失败'}`);
  if (sdkResult.success) {
    console.log(`   SDK版本: ${sdkResult.sdkVersion}`);
  }
  
  // 页面性能测试结果
  console.log('\n4. 页面性能测试:');
  const pageResult = results.results.pagePerformance;
  console.log(`   结果: ${pageResult.success ? '通过' : '失败'}`);
  if (pageResult.success && pageResult.results) {
    console.log('   页面加载性能:');
    Object.entries(pageResult.results).forEach(([page, result]) => {
      console.log(`   - ${page}: ${result.success ? '通过' : '失败'}`);
    });
  }
  
  // 功能兼容性测试结果
  console.log('\n5. 功能兼容性测试:');
  const functionResult = results.results.functionCompatibility;
  console.log(`   结果: ${functionResult ? '通过' : '失败'}`);
  
  console.log('\n=== 测试报告结束 ===');
}

/**
 * 运行单个测试
 * @param {string} testName - 测试名称
 */
function runSingleTest(testName) {
  console.log(`=== 运行测试: ${testName} ===`);
  
  let result;
  
  switch (testName) {
    case 'device':
      result = testDeviceCompatibility();
      break;
    case 'network':
      result = testNetworkCompatibility();
      break;
    case 'sdk':
      result = testSDKCompatibility();
      break;
    case 'page':
      result = testPagePerformance();
      break;
    case 'function':
      result = testFunctionCompatibility();
      break;
    default:
      console.log('未知测试名称');
      return;
  }
  
  console.log(`测试结果: ${result.success ? '通过' : '失败'}`);
  if (!result.success && result.error) {
    console.log(`错误信息: ${result.error}`);
  }
  
  console.log(`=== 测试完成 ===`);
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log('=== 兼容性测试帮助 ===');
  console.log('可用命令:');
  console.log('  node test-runner.js all    - 运行所有测试');
  console.log('  node test-runner.js device - 运行设备兼容性测试');
  console.log('  node test-runner.js network - 运行网络兼容性测试');
  console.log('  node test-runner.js sdk     - 运行SDK兼容性测试');
  console.log('  node test-runner.js page    - 运行页面性能测试');
  console.log('  node test-runner.js function - 运行功能兼容性测试');
  console.log('  node test-runner.js help    - 显示帮助信息');
  console.log('=== 帮助结束 ===');
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command || command === 'help') {
    showHelp();
  } else if (command === 'all') {
    runTests();
  } else if (['device', 'network', 'sdk', 'page', 'function'].includes(command)) {
    runSingleTest(command);
  } else {
    console.log('未知命令，请使用 help 查看可用命令');
    showHelp();
  }
}

// 如果直接运行此文件，则执行主函数
if (require.main === module) {
  main();
}

// 导出函数
module.exports = {
  runTests,
  generateTestReport,
  runSingleTest,
  showHelp
};
