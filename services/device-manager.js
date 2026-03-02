class DeviceManager {
  constructor() {
    this.deviceInfo = null;
    this.performanceLevel = 'medium';
    this.isSDKCompatible = true;
    this.strategy = {
      canvasQuality: 'medium',
      imageCompression: 0.7,
      animationEnabled: true,
      concurrentTasks: 2
    };
    this.MIN_SDK_VERSION = [2, 10, 0];
  }

  init() {
    this.getDeviceInfo();
    this.detectPerformance();
    this.initStrategy();
    console.log('设备管理初始化完成');
  }

  getDeviceInfo() {
    try {
      let deviceInfo = {};
      
      if (wx.getDeviceInfo) {
        const info = wx.getDeviceInfo();
        deviceInfo.model = info.model;
        deviceInfo.system = info.system;
        deviceInfo.platform = info.platform;
        deviceInfo.SDKVersion = info.SDKVersion;
      } else {
        const systemInfo = wx.getSystemInfoSync();
        deviceInfo = systemInfo;
      }
      
      if (wx.getWindowInfo) {
        const windowInfo = wx.getWindowInfo();
        deviceInfo.screenWidth = windowInfo.screenWidth;
        deviceInfo.screenHeight = windowInfo.screenHeight;
        deviceInfo.pixelRatio = windowInfo.pixelRatio;
      } else if (!deviceInfo.screenWidth) {
        const systemInfo = wx.getSystemInfoSync();
        deviceInfo.screenWidth = systemInfo.screenWidth;
        deviceInfo.screenHeight = systemInfo.screenHeight;
        deviceInfo.pixelRatio = systemInfo.pixelRatio;
      }
      
      this.deviceInfo = deviceInfo;
      this.checkSDKVersion(deviceInfo.SDKVersion);
      
      console.log('设备信息:', {
        model: deviceInfo.model,
        system: deviceInfo.system,
        platform: deviceInfo.platform,
        screenWidth: deviceInfo.screenWidth,
        screenHeight: deviceInfo.screenHeight,
        pixelRatio: deviceInfo.pixelRatio,
        SDKVersion: deviceInfo.SDKVersion
      });
      
      return deviceInfo;
    } catch (error) {
      console.error('获取设备信息失败:', error);
      return null;
    }
  }

  detectPerformance() {
    if (!this.deviceInfo) {
      this.performanceLevel = 'medium';
      return;
    }
    
    const model = this.deviceInfo.model.toLowerCase();
    const platform = this.deviceInfo.platform;
    
    if (model.includes('iphone') || model.includes('ipad')) {
      this.performanceLevel = 'high';
    } else if (platform === 'android') {
      if (this.deviceInfo.screenWidth > 1080 && this.deviceInfo.pixelRatio > 2) {
        this.performanceLevel = 'medium';
      } else {
        this.performanceLevel = 'low';
      }
    } else if (platform === 'harmony') {
      // HarmonyOS 性能适配
      if (this.deviceInfo.screenWidth > 1080 && this.deviceInfo.pixelRatio > 2) {
        this.performanceLevel = 'high';
      } else {
        this.performanceLevel = 'medium';
      }
    } else {
      this.performanceLevel = 'medium';
    }
    
    console.log('设备性能等级:', this.performanceLevel);
  }

  initStrategy() {
    switch (this.performanceLevel) {
      case 'high':
        this.strategy = {
          canvasQuality: 'high',
          imageCompression: 0.8,
          animationEnabled: true,
          concurrentTasks: 3
        };
        break;
      case 'medium':
        this.strategy = {
          canvasQuality: 'medium',
          imageCompression: 0.7,
          animationEnabled: true,
          concurrentTasks: 2
        };
        break;
      case 'low':
        this.strategy = {
          canvasQuality: 'low',
          imageCompression: 0.6,
          animationEnabled: false,
          concurrentTasks: 1
        };
        break;
      default:
        this.strategy = {
          canvasQuality: 'medium',
          imageCompression: 0.7,
          animationEnabled: true,
          concurrentTasks: 2
        };
    }
    
    console.log('设备适配策略:', this.strategy);
  }

  checkSDKVersion(sdkVersion) {
    if (!sdkVersion) {
      console.warn('无法获取SDK版本，默认为兼容');
      this.isSDKCompatible = true;
      return true;
    }
    
    try {
      const version = sdkVersion.split('.').map(Number);
      let isCompatible = true;
      
      for (let i = 0; i < this.MIN_SDK_VERSION.length; i++) {
        if (version[i] < this.MIN_SDK_VERSION[i]) {
          isCompatible = false;
          break;
        } else if (version[i] > this.MIN_SDK_VERSION[i]) {
          break;
        }
      }
      
      this.isSDKCompatible = isCompatible;
      console.log('SDK版本兼容性:', isCompatible ? '兼容' : '不兼容');
      
      if (!isCompatible) {
        console.warn('当前SDK版本过低，可能存在兼容性问题');
      }
      
      return isCompatible;
    } catch (error) {
      console.error('检查SDK版本失败:', error);
      this.isSDKCompatible = true;
      return true;
    }
  }

  getPerformanceLevel() {
    return this.performanceLevel;
  }

  getStrategy() {
    return this.getPlatformSpecificStrategy();
  }

  isCompatible() {
    return this.isSDKCompatible;
  }

  isLowPerformance() {
    return this.performanceLevel === 'low';
  }

  isHighPerformance() {
    return this.performanceLevel === 'high';
  }

  shouldEnableAnimation() {
    return this.strategy.animationEnabled;
  }

  getImageCompression() {
    return this.strategy.imageCompression;
  }

  getConcurrentTasks() {
    return this.strategy.concurrentTasks;
  }

  /**
   * 是否为 HarmonyOS 平台
   */
  isHarmonyOS() {
    return this.deviceInfo && this.deviceInfo.platform === 'harmony';
  }

  /**
   * 获取平台特定的适配策略
   */
  getPlatformSpecificStrategy() {
    if (this.isHarmonyOS()) {
      // HarmonyOS 特定适配
      const harmonyStrategy = {
        ...this.strategy,
        animationEnabled: true, // HarmonyOS 对动画支持较好
        canvasQuality: 'medium', // 平衡性能和质量
        imageCompression: 0.75, // 稍高的压缩质量
        concurrentTasks: 2 // 合理的并发任务数
      };
      console.log('HarmonyOS 适配策略:', harmonyStrategy);
      return harmonyStrategy;
    }
    return this.strategy;
  }

  /**
   * 获取平台信息
   */
  getPlatformInfo() {
    if (!this.deviceInfo) {
      return null;
    }
    
    return {
      platform: this.deviceInfo.platform,
      isHarmonyOS: this.isHarmonyOS(),
      model: this.deviceInfo.model,
      system: this.deviceInfo.system
    };
  }

  /**
   * 获取 HarmonyOS 特定的优化建议
   */
  getHarmonyOSOptimizations() {
    if (!this.isHarmonyOS()) {
      return null;
    }
    
    return {
      useArkUIComponents: true,
      enableSmoothAnimation: true,
      optimizeMemoryUsage: false,
      recommendedImageFormat: 'webp'
    };
  }
}

const deviceManager = new DeviceManager();
module.exports = deviceManager;