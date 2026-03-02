class NetworkManager {
  constructor() {
    this.networkType = 'unknown';
    this.isConnected = true;
    this.strategy = {
      imageQuality: 'medium',
      timeout: 20000,
      retryCount: 2
    };
    this.NETWORK_NAMES = {
      wifi: 'WiFi',
      '4g': '4G',
      '3g': '3G',
      '2g': '2G',
      none: '无网络',
      unknown: '未知网络'
    };
    this.onStatusChangeCallback = null;
  }

  init() {
    this.checkNetworkStatus();
    this.monitorNetworkStatus();
    console.log('网络管理初始化完成');
  }

  setOnStatusChangeCallback(callback) {
    this.onStatusChangeCallback = callback;
  }

  checkNetworkStatus() {
    return new Promise((resolve) => {
      wx.getNetworkType({
        success: (res) => {
          this.networkType = res.networkType;
          this.isConnected = true;
          this.setStrategy(res.networkType);
          console.log('当前网络状态:', res.networkType);
          this.notifyStatusChange();
          resolve(res);
        },
        fail: (error) => {
          console.error('获取网络状态失败:', error);
          this.networkType = 'unknown';
          this.isConnected = false;
          this.notifyStatusChange();
          resolve(null);
        }
      });
    });
  }

  monitorNetworkStatus() {
    wx.onNetworkStatusChange((res) => {
      this.handleNetworkStatusChange(res);
    });
  }

  handleNetworkStatusChange(res) {
    console.log('网络状态变化:', res);
    
    this.networkType = res.networkType;
    this.isConnected = res.isConnected;
    
    if (res.isConnected) {
      this.setStrategy(res.networkType);
    }
    
    this.notifyStatusChange();
  }

  notifyStatusChange() {
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(this.getStatus());
    }
  }

  setStrategy(networkType) {
    switch (networkType) {
      case 'wifi':
        this.strategy = {
          imageQuality: 'high',
          timeout: 30000,
          retryCount: 3
        };
        break;
      case '4g':
        this.strategy = {
          imageQuality: 'medium',
          timeout: 20000,
          retryCount: 2
        };
        break;
      case '3g':
      case '2g':
        this.strategy = {
          imageQuality: 'low',
          timeout: 15000,
          retryCount: 1
        };
        break;
      default:
        this.strategy = {
          imageQuality: 'medium',
          timeout: 20000,
          retryCount: 2
        };
    }
    
    console.log('网络策略设置:', this.strategy);
  }

  getNetworkTypeName(networkType) {
    return this.NETWORK_NAMES[networkType] || networkType;
  }

  getStatus() {
    return {
      networkType: this.networkType,
      isConnected: this.isConnected,
      strategy: this.strategy
    };
  }

  getNetworkType() {
    return this.networkType;
  }

  isConnected() {
    return this.isConnected;
  }

  getStrategy() {
    return this.strategy;
  }

  getTimeout() {
    return this.strategy.timeout;
  }

  getRetryCount() {
    return this.strategy.retryCount;
  }

  getImageQuality() {
    return this.strategy.imageQuality;
  }

  isWifi() {
    return this.networkType === 'wifi';
  }

  isMobileNetwork() {
    return ['4g', '3g', '2g'].includes(this.networkType);
  }

  isSlowNetwork() {
    return ['3g', '2g'].includes(this.networkType);
  }

  retry(requestFn, maxRetries = null, delay = 1000) {
    const retries = maxRetries !== null ? maxRetries : this.strategy.retryCount;
    
    return new Promise((resolve, reject) => {
      let attempts = 0;
      
      const attempt = () => {
        requestFn()
          .then(resolve)
          .catch(error => {
            attempts++;
            if (attempts <= retries) {
              console.log(`请求失败，${delay}ms后重试 (${attempts}/${retries})`);
              setTimeout(attempt, delay);
            } else {
              reject(error);
            }
          });
      };
      
      attempt();
    });
  }

  request(options) {
    const requestOptions = {
      ...options,
      timeout: options.timeout || this.strategy.timeout
    };
    
    return new Promise((resolve, reject) => {
      wx.request({
        ...requestOptions,
        success: (res) => {
          resolve(res);
        },
        fail: (error) => {
          reject(error);
        }
      });
    });
  }

  requestWithRetry(options, maxRetries = null) {
    return this.retry(() => this.request(options), maxRetries);
  }

  getErrorMessage(error) {
    if (!this.isConnected) {
      return '当前无网络连接，请检查网络设置';
    }
    
    if (error.errMsg) {
      if (error.errMsg.includes('timeout')) {
        return '网络请求超时，请稍后重试';
      }
      if (error.errMsg.includes('fail')) {
        return '网络请求失败，请稍后重试';
      }
      if (error.errMsg.includes('network')) {
        return '网络连接异常，请检查网络设置';
      }
    }
    
    return '网络连接失败，请检查网络设置';
  }
}

const networkManager = new NetworkManager();
module.exports = networkManager;
