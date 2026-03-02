// 拍照签到页面逻辑
Page({
  /**
   * 页面数据
   */
  data: {
    // 工人相关
    workers: [],
    workerNames: [],
    selectedWorkerIndex: 0,
    selectedWorker: null,
    
    // 相机相关
    hasTakenPhoto: false,
    photoPath: '',
    cameraContext: null,
    
    // 位置相关
    locationInfo: '',
    latitude: 0,
    longitude: 0,
    
    // 时间相关
    currentTime: '',
    currentDate: '',
    
    // 加载状态
    isLoading: false,
    loadingText: '',
    
    // 错误信息
    errorMessage: ''
  },
  
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    console.log('拍照签到页面加载');
    this.initPage();
  },
  
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    // 每次显示页面时更新工人列表和时间
    this.updateWorkers();
    this.updateCurrentTime();
  },
  
  /**
   * 初始化页面
   */
  initPage: function() {
    // 记录页面加载时间
    this.loadStartTime = Date.now();
    
    this.showLoading('初始化中...');
    
    // 分步骤初始化，优先处理关键功能
    
    // 1. 首先更新时间（最快）
    this.updateCurrentTime();
    
    // 2. 更新工人列表
    this.updateWorkers();
    
    // 3. 初始化相机（异步）
    setTimeout(() => {
      this.initCamera();
    }, 100);
    
    // 4. 获取位置信息（异步，非关键）
    setTimeout(() => {
      this.getLocation();
    }, 300);
    
    // 延迟隐藏加载，确保用户体验流畅
    setTimeout(() => {
      this.hideLoading();
      const loadTime = Date.now() - this.loadStartTime;
      console.log('打卡页面初始化完成，耗时:', loadTime, 'ms');
      
      // 记录页面性能到全局监控
      const app = getApp();
      app.recordPageLoad('/pages/checkin/checkin');
    }, 500);
  },
  
  /**
   * 初始化相机
   */
  initCamera: function() {
    const that = this;
    
    // 检查相机权限
    wx.getSetting({
      success: function(res) {
        if (!res.authSetting['scope.camera']) {
          // 没有相机权限，请求权限
          wx.authorize({
            scope: 'scope.camera',
            success: function() {
              // 权限获取成功，初始化相机
              that.createCameraContext();
            },
            fail: function() {
              // 权限获取失败，提示用户
              console.error('相机权限被拒绝');
              that.showError('相机权限被拒绝，请在设置中允许相机权限');
            }
          });
        } else {
          // 已有相机权限，直接初始化相机
          that.createCameraContext();
        }
      },
      fail: function(error) {
        console.error('获取设置失败:', error);
        that.showError('获取相机权限状态失败');
      }
    });
  },
  
  /**
   * 创建相机上下文
   */
  createCameraContext: function() {
    try {
      this.setData({
        cameraContext: wx.createCameraContext()
      });
      console.log('相机初始化成功');
    } catch (error) {
      console.error('相机初始化失败:', error);
      this.showError('相机初始化失败，请检查设备');
    }
  },
  
  /**
   * 更新工人列表
   */
  updateWorkers: function() {
    const app = getApp();
    const workers = app.globalData.workers;
    
    if (workers.length === 0) {
      this.setData({
        workers: [],
        workerNames: [],
        selectedWorkerIndex: 0,
        selectedWorker: null
      });
      return;
    }
    
    const workerNames = workers.map(worker => worker.name);
    const selectedWorker = workers[0];
    
    this.setData({
      workers: workers,
      workerNames: workerNames,
      selectedWorkerIndex: 0,
      selectedWorker: selectedWorker
    });
  },
  
  /**
   * 获取位置信息
   */
  getLocation: function() {
    // 不显示加载动画，避免阻塞用户操作
    
    // 使用缓存的位置信息（如果有）
    const cachedLocation = wx.getStorageSync('cachedLocation');
    const cacheTime = wx.getStorageSync('locationCacheTime');
    const now = Date.now();
    
    // 如果有缓存且缓存时间不超过5分钟，使用缓存
    if (cachedLocation && cacheTime && (now - cacheTime < 5 * 60 * 1000)) {
      this.setData({
        locationInfo: cachedLocation.address || `${cachedLocation.latitude.toFixed(4)}, ${cachedLocation.longitude.toFixed(4)}`,
        latitude: cachedLocation.latitude,
        longitude: cachedLocation.longitude
      });
      console.log('使用缓存的位置信息');
      return;
    }
    
    wx.getLocation({
      type: 'wgs84',
      altitude: false, // 不需要高度信息，加快获取速度
      timeout: 5000, // 设置超时，避免长时间阻塞
      success: (res) => {
        console.log('位置获取成功:', res);
        
        this.setData({
          latitude: res.latitude,
          longitude: res.longitude
        });
        
        // 缓存位置信息
        const locationData = {
          latitude: res.latitude,
          longitude: res.longitude,
          timestamp: now
        };
        wx.setStorageSync('cachedLocation', locationData);
        wx.setStorageSync('locationCacheTime', now);
        
        // 逆地理编码获取详细地址（异步）
        this.getAddress(res.latitude, res.longitude);
      },
      fail: (error) => {
        console.error('位置获取失败:', error);
        this.setData({
          locationInfo: '位置获取失败',
          latitude: 0,
          longitude: 0
        });
        // 不显示错误提示，避免影响用户体验
        // 可以在需要时再提示
      }
    });
  },
  
  /**
   * 获取详细地址
   * @param {number} latitude - 纬度
   * @param {number} longitude - 经度
   */
  getAddress: function(latitude, longitude) {
    // 尝试使用微信内置的逆地理编码获取详细地址
    const that = this;
    
    wx.request({
      url: `https://apis.map.qq.com/ws/geocoder/v1/`,
      data: {
        location: `${latitude},${longitude}`,
        key: 'OB4BZ-D4W3U-B7VVO-4PJWW-6TKDJ-WPB77' // 腾讯地图API密钥（仅供测试使用）
      },
      success: function(res) {
        if (res.data.status === 0 && res.data.result) {
          // 获取到详细地址
          const address = res.data.result.address || res.data.result.formatted_addresses.recommend;
          that.setData({
            locationInfo: address
          });
          
          // 缓存地址信息
          const cachedLocation = wx.getStorageSync('cachedLocation') || {};
          cachedLocation.address = address;
          wx.setStorageSync('cachedLocation', cachedLocation);
          
          console.log('逆地理编码成功:', address);
        } else {
          // 逆地理编码失败，使用坐标
          that.showCoordinates(latitude, longitude);
        }
      },
      fail: function(error) {
        console.error('逆地理编码失败:', error);
        // 失败时使用坐标
        that.showCoordinates(latitude, longitude);
      }
    });
  },

  /**
   * 显示坐标信息
   * @param {number} latitude - 纬度
   * @param {number} longitude - 经度
   */
  showCoordinates: function(latitude, longitude) {
    const locationStr = `坐标: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    this.setData({
      locationInfo: locationStr
    });
    
    // 缓存地址信息
    const cachedLocation = wx.getStorageSync('cachedLocation') || {};
    cachedLocation.address = locationStr;
    wx.setStorageSync('cachedLocation', cachedLocation);
  },
  
  /**
   * 更新当前时间
   */
  updateCurrentTime: function() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const dateStr = now.toISOString().split('T')[0];
    
    this.setData({
      currentTime: timeStr,
      currentDate: dateStr
    });
  },
  
  /**
   * 工人选择变化
   */
  bindWorkerChange: function(e) {
    const index = e.detail.value;
    const worker = this.data.workers[index];
    
    this.setData({
      selectedWorkerIndex: index,
      selectedWorker: worker
    });
  },
  
  /**
   * 拍照
   */
  takePhoto: function() {
    if (!this.data.cameraContext) {
      this.showError('相机未初始化');
      return;
    }
    
    if (!this.data.selectedWorker) {
      this.showError('请选择工人');
      return;
    }
    
    // 检查网络状态
    const app = getApp();
    if (!app.globalData.isConnected) {
      this.showWarning('当前无网络连接，拍照功能可能受限');
    }
    
    this.showLoading('拍照中...');
    
    // 根据网络状态调整图片质量
    const networkStrategy = app.globalData.networkStrategy || { imageQuality: 'medium' };
    let photoQuality = 'medium';
    
    switch (networkStrategy.imageQuality) {
      case 'high':
        photoQuality = 'high';
        break;
      case 'low':
        photoQuality = 'low';
        break;
      default:
        photoQuality = 'medium';
    }
    
    console.log('根据网络状态设置拍照质量:', photoQuality);
    
    this.data.cameraContext.takePhoto({
      quality: photoQuality,
      success: (res) => {
        console.log('拍照成功:', res);
        // 异步处理水印，避免阻塞主线程
        setTimeout(() => {
          this.addWatermark(res.tempImagePath);
        }, 100);
      },
      fail: (error) => {
        console.error('拍照失败:', error);
        this.showError('拍照失败，请重试');
        this.hideLoading();
      }
    });
  },
  
  /**
   * 添加水印
   * @param {string} imagePath - 原始图片路径
   */
  addWatermark: function(imagePath) {
    const that = this;
    const worker = this.data.selectedWorker;
    const location = this.data.locationInfo || '位置信息未获取';
    const time = this.data.currentTime;
    const date = this.data.currentDate;
    
    try {
      // 创建Canvas上下文
      const ctx = wx.createCanvasContext('watermarkCanvas');
      
      // 获取图片信息
      wx.getImageInfo({
        src: imagePath,
        success: (imageInfo) => {
          // 设置Canvas尺寸为固定大小，避免大图片处理缓慢
          const maxWidth = 1200;
          const maxHeight = 900;
          let canvasWidth = imageInfo.width;
          let canvasHeight = imageInfo.height;
          
          // 调整图片尺寸，避免Canvas过大
          if (canvasWidth > maxWidth) {
            const ratio = maxWidth / canvasWidth;
            canvasWidth = maxWidth;
            canvasHeight = canvasHeight * ratio;
          }
          if (canvasHeight > maxHeight) {
            const ratio = maxHeight / canvasHeight;
            canvasHeight = maxHeight;
            canvasWidth = canvasWidth * ratio;
          }
          
          // 绘制图片
          ctx.drawImage(imagePath, 0, 0, canvasWidth, canvasHeight);
          
          // 设置水印样式
          ctx.setFontSize(20); // 减小字体大小
          ctx.setFillStyle('rgba(255, 255, 255, 0.8)');
          ctx.setTextAlign('left');
          
          // 添加水印内容
          const watermarkContent = [
            `工人: ${worker.name}`,
            `时间: ${date} ${time}`,
            `地点: ${location}`
          ];
          
          // 绘制水印
          watermarkContent.forEach((text, index) => {
            ctx.fillText(text, 15, canvasHeight - 60 + index * 25);
          });
          
          // 绘制完成
          ctx.draw(false, () => {
            // 导出图片
            wx.canvasToTempFilePath({
              canvasId: 'watermarkCanvas',
              quality: 0.8, // 降低导出质量，提高速度
              success: (res) => {
                console.log('水印添加成功:', res);
                that.setData({
                  hasTakenPhoto: true,
                  photoPath: res.tempFilePath
                });
                that.hideLoading();
                that.showSuccess('拍照成功');
              },
              fail: (error) => {
                console.error('水印添加失败:', error);
                // 失败时使用原图
                that.handleWatermarkError(imagePath);
              }
            });
          });
        },
        fail: (error) => {
          console.error('获取图片信息失败:', error);
          // 失败时使用原图
          that.handleWatermarkError(imagePath);
        }
      });
    } catch (error) {
      console.error('水印处理异常:', error);
      // 异常时使用原图
      this.handleWatermarkError(imagePath);
    }
  },
  
  /**
   * 处理水印添加失败的情况
   * @param {string} imagePath - 原始图片路径
   */
  handleWatermarkError: function(imagePath) {
    this.setData({
      hasTakenPhoto: true,
      photoPath: imagePath
    });
    this.hideLoading();
    this.showSuccess('拍照成功');
  },
  
  /**
   * 重新拍照
   */
  retakePhoto: function() {
    this.setData({
      hasTakenPhoto: false,
      photoPath: ''
    });
  },
  
  /**
   * 确认签到
   */
  confirmCheckin: function() {
    if (!this.data.selectedWorker) {
      this.showError('请选择工人');
      return;
    }
    
    if (!this.data.photoPath) {
      this.showError('请先拍照');
      return;
    }
    
    // 位置信息不是必须的，可以在没有位置时继续
    
    this.showLoading('签到中...');
    
    // 检查是否重复签到
    if (this.checkDuplicateCheckin()) {
      this.hideLoading();
      this.showError('该工人今日已签到');
      return;
    }
    
    // 创建签到记录
    const record = this.createCheckinRecord();
    
    // 保存记录（使用异步方法）
    const app = getApp();
    try {
      app.addRecord(record, (success, error) => {
        if (success) {
          console.log('签到记录保存成功:', record);
          
          this.hideLoading();
          this.showSuccess('签到成功');
          
          // 跳转到记录页面
          setTimeout(() => {
            wx.navigateTo({
              url: '/pages/records/records'
            });
          }, 1000); // 减少延迟，提高响应速度
        } else {
          console.error('签到记录保存失败:', error);
          this.hideLoading();
          this.showError('签到失败，请重试');
        }
      });
    } catch (error) {
      console.error('签到过程异常:', error);
      this.hideLoading();
      this.showError('签到失败，请重试');
    }
  },
  
  /**
   * 检查是否重复签到
   * @returns {boolean} 是否重复签到
   */
  checkDuplicateCheckin: function() {
    const app = getApp();
    const records = app.globalData.records;
    const workerId = this.data.selectedWorker.id;
    const currentDate = this.data.currentDate;
    
    return records.some(record => {
      return record.workerId === workerId && record.date === currentDate;
    });
  },
  
  /**
   * 创建签到记录
   * @returns {Object} 签到记录
   */
  createCheckinRecord: function() {
    const worker = this.data.selectedWorker;
    
    return {
      workerId: worker.id,
      workerName: worker.name,
      date: this.data.currentDate,
      time: this.data.currentTime,
      location: this.data.locationInfo,
      latitude: this.data.latitude,
      longitude: this.data.longitude,
      photoUrl: this.data.photoPath,
      // id和timestamp会在app.addRecord中自动添加
    };
  },
  
  /**
   * 处理相机错误
   */
  handleCameraError: function(e) {
    console.error('相机错误:', e.detail);
    this.showError('相机错误，请检查设备');
  },
  
  /**
   * 显示加载动画
   * @param {string} text - 加载文本
   */
  showLoading: function(text) {
    this.setData({
      isLoading: true,
      loadingText: text
    });
  },
  
  /**
   * 隐藏加载动画
   */
  hideLoading: function() {
    this.setData({
      isLoading: false,
      loadingText: ''
    });
  },
  
  /**
   * 显示成功提示
   * @param {string} message - 提示信息
   */
  showSuccess: function(message) {
    wx.showToast({
      title: message,
      icon: 'success',
      duration: 2000
    });
  },
  
  /**
   * 显示错误提示
   * @param {string} message - 错误信息
   */
  showError: function(message) {
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    });
  },
  
  /**
   * 显示模态对话框
   * @param {string} title - 标题
   * @param {string} content - 内容
   */
  showModal: function(title, content) {
    wx.showModal({
      title: title,
      content: content,
      showCancel: false
    });
  },
  
  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {
    console.log('拍照签到页面卸载');
  }
});