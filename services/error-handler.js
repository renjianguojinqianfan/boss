const storageService = require('./storage-service');

class ErrorHandler {
  constructor() {
    this.errorLogs = [];
    this.MAX_ERROR_LOGS = 50;
    this.ERROR_TYPES = {
      NETWORK: 'network',
      STORAGE: 'storage',
      PERMISSION: 'permission',
      BUSINESS: 'business',
      UNKNOWN: 'unknown'
    };
  }

  handle(error, message = '操作失败', context = {}) {
    console.error('错误处理:', message, error);
    
    const errorInfo = this.buildErrorInfo(error, message, context);
    this.saveErrorLog(errorInfo);
    this.reportError(errorInfo);
    
    return errorInfo;
  }

  buildErrorInfo(error, message, context) {
    return {
      message: message,
      error: error && error.message ? error.message : String(error),
      stack: error && error.stack ? error.stack : '',
      timestamp: new Date().toISOString(),
      context: context,
      type: this.getErrorType(error)
    };
  }

  getErrorType(error) {
    if (!error) return this.ERROR_TYPES.UNKNOWN;
    
    if (error.errMsg) {
      if (error.errMsg.includes('network') || error.errMsg.includes('timeout')) {
        return this.ERROR_TYPES.NETWORK;
      }
      if (error.errMsg.includes('storage') || error.errMsg.includes('data')) {
        return this.ERROR_TYPES.STORAGE;
      }
      if (error.errMsg.includes('auth') || error.errMsg.includes('permission')) {
        return this.ERROR_TYPES.PERMISSION;
      }
    }
    
    return this.ERROR_TYPES.UNKNOWN;
  }

  saveErrorLog(errorInfo) {
    try {
      this.errorLogs.push(errorInfo);
      
      if (this.errorLogs.length > this.MAX_ERROR_LOGS) {
        this.errorLogs.splice(0, this.errorLogs.length - this.MAX_ERROR_LOGS);
      }
      
      wx.setStorageSync('errorLogs', this.errorLogs);
      console.log('错误日志保存成功');
    } catch (error) {
      console.error('保存错误日志失败:', error);
    }
  }

  reportError(errorInfo) {
    console.log('上报错误:', errorInfo);
  }

  getErrorLogs() {
    return this.errorLogs;
  }

  loadErrorLogs() {
    try {
      const logs = wx.getStorageSync('errorLogs') || [];
      this.errorLogs = logs;
      return logs;
    } catch (error) {
      console.error('加载错误日志失败:', error);
      return [];
    }
  }

  clearErrorLogs() {
    this.errorLogs = [];
    try {
      wx.removeStorageSync('errorLogs');
      console.log('错误日志已清空');
    } catch (error) {
      console.error('清空错误日志失败:', error);
    }
  }

  handleNetworkError(error) {
    console.error('网络错误:', error);
    
    let message = '网络连接失败，请检查网络设置';
    
    if (error.errMsg) {
      if (error.errMsg.includes('timeout')) {
        message = '网络请求超时，请稍后重试';
      } else if (error.errMsg.includes('fail')) {
        message = '网络请求失败，请稍后重试';
      } else if (error.errMsg.includes('network')) {
        message = '网络连接异常，请检查网络设置';
      }
    }
    
    return this.handle(error, message, { type: 'network' });
  }

  handleStorageError(error, operation = 'unknown') {
    console.error('存储错误:', error);
    
    const message = '数据存储失败，请稍后重试';
    return this.handle(error, message, { type: 'storage', operation: operation });
  }

  handlePermissionError(permission) {
    console.error('权限错误:', permission);
    
    let message = '权限被拒绝，请在设置中允许相关权限';
    
    if (permission === 'scope.camera') {
      message = '相机权限被拒绝，请在设置中允许相机权限';
    } else if (permission === 'scope.userLocation') {
      message = '位置权限被拒绝，请在设置中允许位置权限';
    }
    
    const error = new Error(message);
    return this.handle(error, message, { type: 'permission', permission: permission });
  }

  handleBusinessError(errorCode, errorMessage) {
    console.error('业务逻辑错误:', errorCode, errorMessage);
    
    const error = new Error(errorMessage);
    return this.handle(error, errorMessage, { type: 'business', code: errorCode });
  }

  handleMemoryWarning(res) {
    console.warn('内存警告:', res);
    
    const warningInfo = {
      level: res.level,
      timestamp: new Date().toISOString(),
      type: 'memory'
    };
    
    console.log('上报内存警告:', warningInfo);
    return warningInfo;
  }

  getErrorStatistics() {
    const stats = {
      total: this.errorLogs.length,
      byType: {}
    };
    
    this.errorLogs.forEach(log => {
      const type = log.type || 'unknown';
      if (!stats.byType[type]) {
        stats.byType[type] = 0;
      }
      stats.byType[type]++;
    });
    
    return stats;
  }
}

const errorHandler = new ErrorHandler();
module.exports = errorHandler;
