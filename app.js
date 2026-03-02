const storageService = require('./services/storage-service');
const uiService = require('./services/ui-service');
const performanceMonitor = require('./services/performance-monitor');
const deviceManager = require('./services/device-manager');
const networkManager = require('./services/network-manager');
const errorHandler = require('./services/error-handler');

App({
  onLaunch: function() {
    this.startTime = Date.now();
    
    this.initServices();
    this.initGlobalData();
    
    setTimeout(() => {
      this.checkPermissions();
    }, 1000);
    
    console.log('小程序启动');
  },

  initServices: function() {
    performanceMonitor.init();
    deviceManager.init();
    networkManager.init();
    
    networkManager.setOnStatusChangeCallback((status) => {
      if (this.globalData) {
        this.globalData.networkType = status.networkType;
        this.globalData.isConnected = status.isConnected;
        this.globalData.networkStrategy = status.strategy;
      }
    });
  },

  initGlobalData: async function() {
    this.globalData = {
      workers: [],
      records: [],
      currentDate: new Date().toISOString().split('T')[0],
      isLoading: false,
      loadingCount: 0,
      isInitialized: false,
      networkType: 'unknown',
      isConnected: true,
      networkStrategy: {
        imageQuality: 'medium',
        timeout: 20000,
        retryCount: 2
      },
      deviceInfo: null,
      performanceLevel: 'medium',
      isSDKCompatible: true,
      deviceStrategy: {
        canvasQuality: 'medium',
        imageCompression: 0.7,
        animationEnabled: true,
        concurrentTasks: 2
      }
    };
    
    try {
      const workers = await storageService.getWorkers();
      const records = await storageService.getRecords();
      
      this.globalData.workers = workers;
      this.globalData.records = records;
      this.globalData.isInitialized = true;
      
      // 初始化完成后更新服务数据
      this.updateGlobalDataFromServices();
      
      const loadTime = Date.now() - this.startTime;
      performanceMonitor.setStartupTime(loadTime);
      
      console.log('小程序初始化完成，耗时:', loadTime, 'ms');
      
      if (this.onInitialized) {
        this.onInitialized();
      }
    } catch (error) {
      console.error('初始化全局数据失败:', error);
      errorHandler.handle(error, '初始化全局数据失败');
      
      // 即使失败也更新服务数据
      this.updateGlobalDataFromServices();
    }
  },

  checkInitialization: function() {
    if (!this.globalData.isInitialized) {
      if (this.globalData.workers !== undefined && this.globalData.records !== undefined) {
        this.globalData.isInitialized = true;
        const loadTime = Date.now() - this.startTime;
        performanceMonitor.setStartupTime(loadTime);
        console.log('小程序初始化完成，耗时:', loadTime, 'ms');
        
        if (this.onInitialized) {
          this.onInitialized();
        }
      }
    }
  },

  checkPermissions: function() {
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.camera']) {
          setTimeout(() => {
            wx.authorize({
              scope: 'scope.camera',
              success: () => {
                console.log('相机权限已授权');
              },
              fail: () => {
                console.log('相机权限未授权');
              }
            });
          }, 500);
        }
        
        if (!res.authSetting['scope.userLocation']) {
          setTimeout(() => {
            wx.authorize({
              scope: 'scope.userLocation',
              success: () => {
                console.log('位置权限已授权');
              },
              fail: () => {
                console.log('位置权限未授权');
              }
            });
          }, 800);
        }
      },
      fail: (error) => {
        console.error('检查权限失败:', error);
      }
    });
  },

  saveWorkers: async function(workers, callback) {
    try {
      this.globalData.workers = workers;
      await storageService.saveWorkers(workers);
      console.log('工人数据保存成功');
      if (callback) callback(true);
    } catch (error) {
      console.error('工人数据保存失败:', error);
      errorHandler.handleStorageError(error, 'saveWorkers');
      if (callback) callback(false, error);
    }
  },

  saveRecords: async function(records, callback) {
    try {
      this.globalData.records = records;
      await storageService.saveRecords(records);
      console.log('签到记录保存成功');
      if (callback) callback(true);
    } catch (error) {
      console.error('签到记录保存失败:', error);
      errorHandler.handleStorageError(error, 'saveRecords');
      if (callback) callback(false, error);
    }
  },

  addWorker: async function(worker, callback) {
    try {
      uiService.showLoading('添加中...');
      
      worker.id = Date.now().toString();
      const workers = this.globalData.workers;
      workers.push(worker);
      
      await storageService.saveWorkers(workers);
      this.globalData.workers = workers;
      
      uiService.hideLoading();
      uiService.showSuccess('添加成功');
      
      if (callback) callback(true, worker);
      return worker;
    } catch (error) {
      uiService.hideLoading();
      uiService.showError('添加失败');
      errorHandler.handle(error, '添加工人失败');
      if (callback) callback(false, error);
      return null;
    }
  },

  addRecord: async function(record, callback) {
    try {
      uiService.showLoading('保存中...');
      
      record.id = Date.now().toString();
      record.timestamp = new Date().toISOString();
      const records = this.globalData.records;
      records.push(record);
      
      await storageService.saveRecords(records);
      this.globalData.records = records;
      
      uiService.hideLoading();
      uiService.showSuccess('保存成功');
      
      if (callback) callback(true, record);
      return record;
    } catch (error) {
      uiService.hideLoading();
      uiService.showError('保存失败');
      errorHandler.handle(error, '保存记录失败');
      if (callback) callback(false, error);
      return null;
    }
  },

  showLoading: function(text, mask) {
    uiService.showLoading(text, mask);
  },

  hideLoading: function() {
    uiService.hideLoading();
  },

  showSuccess: function(message, duration) {
    uiService.showSuccess(message, duration);
  },

  showError: function(message, duration) {
    uiService.showError(message, duration);
  },

  showWarning: function(message, duration) {
    uiService.showWarning(message, duration);
  },

  showInfo: function(message, duration) {
    uiService.showInfo(message, duration);
  },

  showModal: function(title, content, showCancel, confirmText, cancelText, success) {
    uiService.showModal({
      title: title,
      content: content,
      showCancel: showCancel !== false,
      confirmText: confirmText || '确定',
      cancelText: cancelText || '取消'
    }).then(success);
  },

  showActionSheet: function(itemList, success) {
    uiService.showActionSheet(itemList).then(success);
  },

  handleError: function(error, message, showError) {
    console.error('全局错误处理:', message, error);
    
    uiService.hideLoading();
    
    if (showError !== false) {
      uiService.showError(message);
    }
    
    errorHandler.handle(error, message);
  },

  handleNetworkError: function(error) {
    uiService.hideLoading();
    const message = networkManager.getErrorMessage(error);
    uiService.showError(message);
    errorHandler.handleNetworkError(error);
  },

  handlePermissionError: function(permission) {
    uiService.hideLoading();
    uiService.showPermissionDialog(permission);
    errorHandler.handlePermissionError(permission);
  },

  handleStorageError: function(error) {
    uiService.hideLoading();
    uiService.showError('数据存储失败，请稍后重试');
    errorHandler.handleStorageError(error);
  },

  handleBusinessError: function(errorCode, errorMessage) {
    uiService.hideLoading();
    uiService.showError(errorMessage || '操作失败，请稍后重试');
    errorHandler.handleBusinessError(errorCode, errorMessage);
  },

  getPerformanceReport: function() {
    return performanceMonitor.getReport();
  },

  recordPageLoad: function(pagePath) {
    return performanceMonitor.recordPageLoad(pagePath);
  },

  recordOperation: function(operation, startTime, context) {
    return performanceMonitor.recordOperation(operation, startTime, context);
  },

  retryRequest: function(requestFn, maxRetries, delay) {
    return networkManager.retry(requestFn, maxRetries, delay);
  },

  getNetworkStatus: function() {
    return networkManager.getStatus();
  },

  getDeviceStrategy: function() {
    return deviceManager.getStrategy();
  },

  globalData: {
    workers: [],
    records: [],
    currentDate: '',
    isLoading: false,
    loadingCount: 0,
    isInitialized: false,
    networkType: 'unknown',
    isConnected: true,
    networkStrategy: {
      imageQuality: 'medium',
      timeout: 20000,
      retryCount: 2
    },
    deviceInfo: null,
    performanceLevel: 'medium',
    isSDKCompatible: true,
    deviceStrategy: {
      canvasQuality: 'medium',
      imageCompression: 0.7,
      animationEnabled: true,
      concurrentTasks: 2
    },
    platform: 'unknown',
    isHarmonyOS: false
  },

  updateGlobalDataFromServices: function() {
    const networkStatus = networkManager.getStatus();
    this.globalData.networkType = networkStatus.networkType;
    this.globalData.isConnected = networkStatus.isConnected;
    this.globalData.networkStrategy = networkStatus.strategy;
    
    this.globalData.deviceInfo = deviceManager.getDeviceInfo();
    this.globalData.performanceLevel = deviceManager.getPerformanceLevel();
    this.globalData.isSDKCompatible = deviceManager.isCompatible();
    this.globalData.deviceStrategy = deviceManager.getStrategy();
    
    // HarmonyOS 平台信息
    const platformInfo = deviceManager.getPlatformInfo();
    if (platformInfo) {
      this.globalData.platform = platformInfo.platform;
      this.globalData.isHarmonyOS = platformInfo.isHarmonyOS;
      console.log('平台信息:', platformInfo);
    }
  }
});
