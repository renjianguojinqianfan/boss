# AGENTS.md - AI Agent Coding Guidelines

Guidelines for AI agents working on this WeChat Mini Program (微信小程序) project.

## Project Overview

| Property | Value |
|----------|-------|
| Type | WeChat Mini Program |
| Language | JavaScript (ES6+) |
| Framework | WeChat Native Framework |
| Package Manager | None (native wx.* APIs only) |

## Build & Test Commands

```bash
# Run all tests
node test/test-runner.js all

# Run specific test suites
node test/test-runner.js device    # Device compatibility
node test/test-runner.js network   # Network compatibility
node test/test-runner.js sdk       # SDK compatibility
node test/test-runner.js page      # Page performance
node test/test-runner.js function  # Function compatibility

# Code validation
node test/code-validation.js

# Development (WeChat DevTools)
# 1. Open WeChat DevTools
# 2. Import project: E:\打卡系统\wechat-miniprogram
# 3. Press Ctrl+B to compile
```

## File Structure

```
wechat-miniprogram/
├── app.js                 # App entry
├── app.json               # App config
├── app.wxss               # Global styles
├── pages/{page}/          # Page files
│   ├── {page}.js          # Page logic
│   ├── {page}.json        # Page config
│   ├── {page}.wxml        # Page template
│   └── {page}.wxss        # Page styles
├── services/              # Singleton services
├── components/            # Reusable components
└── utils/                 # Utility functions
```

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `storage-service.js` |
| Classes | PascalCase | `StorageService` |
| Functions | camelCase | `getWorkers()` |
| Variables | camelCase | `workerList` |
| Constants | UPPER_SNAKE_CASE | `MAX_ERROR_LOGS` |
| Storage Keys | UPPER_SNAKE_CASE | `WORKERS: 'workers'` |
| Components | kebab-case | `loading-spinner` |

## Module System (CommonJS Only)

```javascript
// Import
const storageService = require('./services/storage-service');
const { formatDate } = require('./utils/util');

// Export singleton
const storageService = new StorageService();
module.exports = storageService;

// Named exports (utilities)
module.exports = { formatDate, formatTime };
```

**NEVER use ES modules** (`import`/`export`) - WeChat Mini Programs require CommonJS.

## Error Handling

Always use try-catch with centralized error handler:

```javascript
try {
  const workers = await storageService.getWorkers();
} catch (error) {
  console.error('Failed to get workers:', error);
  errorHandler.handle(error, 'Failed to get workers');
}
```

**Error Types** (from error-handler.js):
- `ERROR_TYPES.NETWORK` - Network errors
- `ERROR_TYPES.STORAGE` - Storage errors
- `ERROR_TYPES.PERMISSION` - Permission errors
- `ERROR_TYPES.BUSINESS` - Business logic errors
- `ERROR_TYPES.UNKNOWN` - Unknown errors

## Page Pattern

```javascript
Page({
  data: { /* page data */ },
  
  onLoad: function(options) {
    this.initPage();
  },
  onShow: function() {
    this.updateData();
  },
  
  // Private methods
  initPage: function() {
    const app = getApp();
    // Access global data via app.globalData
  }
});
```

## Service Pattern (Singleton)

```javascript
class ServiceName {
  constructor() {
    this.STORAGE_KEYS = { KEY: 'key' };
  }
  
  /**
   * Method description
   * @param {Type} param - Description
   * @returns {Promise<Type>} Result
   */
  async methodName(param) {
    return new Promise((resolve, reject) => {
      wx.apiName({
        success: (res) => resolve(res),
        fail: (err) => reject(err)
      });
    });
  }
}

module.exports = new ServiceName();
```

## Global App Access

```javascript
const app = getApp();
const workers = app.globalData.workers;
app.showLoading('Loading...');
```

## Key Services

| Service | Purpose |
|---------|---------|
| `storage-service.js` | Local data persistence |
| `ui-service.js` | Toasts, modals, loading |
| `error-handler.js` | Centralized error handling |
| `network-manager.js` | Network status & retry logic |
| `device-manager.js` | Device capability detection |
| `performance-monitor.js` | Performance monitoring |

## Storage Keys

```javascript
STORAGE_KEYS = {
  WORKERS: 'workers',
  RECORDS: 'records',
  ERROR_LOGS: 'errorLogs'
}
```

## WXSS Guidelines

- Use `rpx` for responsive sizing
- BEM-like naming: `.page__element--modifier`
- Scope styles to page/component
- Define patterns in `app.wxss`

## Common Pitfalls

1. **Never use ES modules** - Use `require`/`module.exports`
2. **Never use Node.js APIs** - Use `wx.*` APIs only
3. **Watch `this` context** - Use arrow functions or `.bind(this)`
4. **Check initialization** - App data may not be ready in `onLoad`
5. **Handle permissions** - Always check camera/location permissions
6. **No DOM manipulation** - Use `setData()` to update view
7. **Data flow**: Services → App → Page via `setData()`

## Architecture

- **State**: `app.globalData` + page `data` via `setData()`
- **Error Handling**: Centralized through `error-handler`
- **Storage**: Local only (persists until app uninstall)
- **Performance**: Device-aware strategies (image quality, animations)
