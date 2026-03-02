# AGENTS.md - 代理编码指南

本文档为在此微信小程序项目中工作的AI代理提供上下文指导。

## 项目概述

**项目类型**: 微信小程序  
**编程语言**: JavaScript (ES6+)  
**框架**: 微信原生小程序框架  
**AppID**: wx98e05798d24cd888

## 构建与开发命令

### 运行项目

1. **在微信开发者工具中打开**
   - 启动微信开发者工具
   - 导入项目: `E:\打卡系统\wechat-miniprogram`
   - 或打开: `project.config.json`

2. **编译与预览**
   - 点击"编译"按钮 (或 `Ctrl+B`)

### 测试

**运行所有测试:**
```bash
node test/test-runner.js all
```

**运行单个测试:**
```bash
node test/test-runner.js device    # 设备兼容性
node test/test-runner.js network   # 网络兼容性
node test/test-runner.js sdk       # SDK兼容性
node test/test-runner.js page      # 页面性能
node test/test-runner.js function  # 功能兼容性
```

**运行代码验证:**
```bash
node test/code-validation.js
```

## 代码风格指南

### 文件组织结构

```
wechat-miniprogram/
├── app.js              # 应用入口
├── app.json            # 应用配置
├── app.wxss            # 全局样式
├── pages/              # 页面目录
│   └── {page}/
│       ├── {page}.js   # 页面逻辑
│       ├── {page}.json # 页面配置
│       ├── {page}.wxml # 页面模板
│       └── {page}.wxss # 页面样式
├── services/           # 服务层
├── components/         # 可复用组件
└── utils/              # 工具函数
```

### 命名规范

| 类型 | 规范 | 示例 |
|------|------------|---------|
| 文件 | 短横线连接 | `storage-service.js` |
| 类 | 大驼峰 | `StorageService` |
| 函数 | 小驼峰 | `getWorkers()` |
| 变量 | 小驼峰 | `workerList` |
| 常量 | 全大写下划线 | `MAX_ERROR_LOGS` |
| 存储键 | 全大写下划线 | `WORKERS: 'workers'` |

### 导入/导出模式

**使用 CommonJS (小程序必需):**
```javascript
// 导入
const storageService = require('./services/storage-service');

// 导出单例
const storageService = new StorageService();
module.exports = storageService;

// 具名导出 (工具函数)
module.exports = { formatDate, formatTime };
```

### JSDoc 注释

为公共函数添加 JSDoc 注释:
```javascript
/**
 * 保存工人到存储
 * @param {Array} workers - 工人列表
 * @returns {Promise<boolean>} 成功状态
 */
saveWorkers(workers) { }
```

### 错误处理

**始终使用 try-catch 配合集中式错误处理器:**
```javascript
try {
  const workers = await storageService.getWorkers();
} catch (error) {
  console.error('获取工人列表失败:', error);
  errorHandler.handle(error, '获取工人列表失败');
}
```

**错误类型 (来自 error-handler.js):**
- `ERROR_TYPES.NETWORK` - 网络错误
- `ERROR_TYPES.STORAGE` - 存储错误
- `ERROR_TYPES.PERMISSION` - 权限错误
- `ERROR_TYPES.BUSINESS` - 业务逻辑错误
- `ERROR_TYPES.UNKNOWN` - 未知错误

### 页面生命周期模式

```javascript
Page({
  data: { /* 页面数据 */ },
  
  onLoad: function(options) { 
    this.initPage();
  },
  onShow: function() { 
    this.updateData();
  },
  onReady: function() { },
  onHide: function() { },
  onUnload: function() { }
});
```

### 全局 App 访问

```javascript
// 获取应用实例
const app = getApp();

// 访问全局数据
const workers = app.globalData.workers;

// 使用应用方法
app.saveWorkers(workers);
app.showLoading('加载中...');
```

### 数据存储

**存储键名 (定义在 StorageService 中):**
```javascript
this.STORAGE_KEYS = {
  WORKERS: 'workers',
  RECORDS: 'records',
  ERROR_LOGS: 'errorLogs'
};
```

### CSS/WXSS 指南

- 使用 `rpx` 进行响应式尺寸设置
- 遵循 BEM-like 命名: `.page__header`, `.page__header--active`
- 样式限定在页面/组件范围内
- 在 `app.wxss` 中定义通用样式模式

### 常见陷阱

1. **不要使用 ES 模块** - 使用 CommonJS (`require`/`module.exports`)
2. **不要使用 Node.js API** - 使用微信的 `wx.*` API
3. **注意 `this` 上下文** - 使用箭头函数或 `.bind(this)`
4. **检查初始化状态** - App 数据在 `onLoad` 中可能尚未准备好
5. **处理权限** - 始终检查相机/位置权限

## 关键服务

| 服务 | 用途 |
|---------|---------|
| `storage-service.js` | 本地数据持久化 |
| `ui-service.js` | 提示框、模态框、加载动画 UI |
| `error-handler.js` | 集中式错误处理 |
| `network-manager.js` | 网络状态与重试逻辑 |
| `device-manager.js` | 设备能力检测 |
| `performance-monitor.js` | 性能监控 |

## 架构说明

- **状态管理**: 应用 `globalData` + 页面 `data` 通过 `setData()`
- **数据流**: 服务层 → 应用 → 页面
- **错误处理**: 通过 `error-handler` 服务集中处理
- **性能**: 设备感知策略 (图片质量、动画)
- **存储**: 仅本地存储，数据持续到应用卸载
