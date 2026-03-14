// 拍照签到页面逻辑
Page({
  data: {
    workers: [],
    workerNames: [],
    selectedWorkerIndex: 0,
    selectedWorker: null,
    hasTakenPhoto: false,
    photoPath: '',
    locationInfo: '',
    latitude: 0,
    longitude: 0,
    currentTime: '',
    currentDate: '',
    isLoading: false,
    loadingText: '',
    locationError: false,  // 位置获取失败标志
    locationRetryCount: 0,  // 位置重试次数
    selectedDuration: 'full'  // 默认选中"一天"
  },
  onLoad: function(options) {
    console.log('拍照签到页面加载');
    this.initPage();
  },

  onShow: function() {
    this.updateWorkers();
    this.updateCurrentTime();
  },

  initPage: function() {
    this.loadStartTime = Date.now();
    
    wx.showLoading({
      title: '初始化中...',
      mask: true
    });
    
    this.updateCurrentTime();
    this.updateWorkers();
    
    // 使用 Promise 并行初始化相机和位置
    var that = this;
    Promise.all([
      this.initCameraPromise(),
      this.getLocationPromise()
    ]).then(function() {
      wx.hideLoading();
      var loadTime = Date.now() - that.loadStartTime;
      console.log('打卡页面初始化完成，耗时:', loadTime, 'ms');
    }).catch(function(error) {
      wx.hideLoading();
      console.error('初始化失败:', error);
    });
  },

  // Promise 封装的相机初始化
  initCameraPromise: function() {
    var that = this;
    return new Promise(function(resolve) {
      that.initCamera();
      // 相机初始化是异步的，给它一些时间
      setTimeout(function() {
        resolve();
      }, 100);
    });
  },

  // Promise 封装的位置获取
  getLocationPromise: function() {
    var that = this;
    return new Promise(function(resolve) {
      that.getLocation();
      // 位置获取有5秒超时，这里等待它完成
      setTimeout(function() {
        resolve();
      }, 300);
    });
  },

  initCamera: function() {
    const that = this;
    
    wx.getSetting({
      success: function(res) {
        if (!res.authSetting['scope.camera']) {
          wx.authorize({
            scope: 'scope.camera',
            success: function() {
              that.createCameraContext();
            },
            fail: function() {
              console.error('相机权限被拒绝');
              wx.showToast({
                title: '请允许相机权限',
                icon: 'none'
              });
            }
          });
        } else {
          that.createCameraContext();
        }
      },
      fail: function(error) {
        console.error('获取设置失败:', error);
      }
    });
  },

  createCameraContext: function() {
    try {
      this.cameraContext = wx.createCameraContext();
      console.log('相机初始化成功');
    } catch (error) {
      console.error('相机初始化失败:', error);
    }
  },

  updateWorkers: function() {
    const app = getApp();
    const workers = app.globalData.workers || [];
    const workerNames = workers.map(function(worker) {
      return worker.name;
    });
    const selectedWorker = workers.length > 0 ? workers[0] : null;
    
    this.setData({
      workers: workers,
      workerNames: workerNames,
      selectedWorker: selectedWorker
    });
  },

bindWorkerChange: function(e) {
const index = e.detail.value;
const worker = this.data.workers[index];
this.setData({
selectedWorkerIndex: index,
selectedWorker: worker
});
  },

  // 选择工作时长
  selectDuration: function(e) {
    const duration = e.currentTarget.dataset.duration;
    this.setData({
      selectedDuration: duration
    });
  },

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

  getLocation: function() {
    var that = this;
    
    wx.getLocation({
      type: 'wgs84',
      altitude: false,
      timeout: 5000,
      success: function(res) {
        that.setData({
          latitude: res.latitude,
          longitude: res.longitude,
          locationError: false,
          locationRetryCount: 0
        });
        that.getAddress(res.latitude, res.longitude);
      },
      fail: function(error) {
        console.error('位置获取失败:', error);
        var retryCount = that.data.locationRetryCount;
        that.setData({
          locationInfo: '位置获取失败，点击重试',
          locationError: true,
          locationRetryCount: retryCount + 1
        });
        
        // 如果是第一次失败，自动重试一次
        if (retryCount === 0) {
          console.log('自动重试获取位置...');
          setTimeout(function() {
            that.getLocation();
          }, 1000);
        }
      }
    });
  },

  // 手动重试获取位置
  retryGetLocation: function() {
    if (this.data.locationError) {
      this.setData({
        locationInfo: '正在获取位置...',
        locationError: false
      });
      this.getLocation();
    }
  },


  getAddress: function(latitude, longitude) {
    const that = this;
    
    wx.request({
      url: 'https://apis.map.qq.com/ws/geocoder/v1/',
      data: {
        location: latitude + ',' + longitude,
        key: 'OB4BZ-D4W3U-B7VVO-4PJWW-6TKDJ-WPB77'
      },
      success: function(res) {
        if (res.data.status === 0 && res.data.result) {
          const address = res.data.result.address;
          that.setData({
            locationInfo: address
          });
        } else {
          that.setData({
            locationInfo: latitude.toFixed(4) + ', ' + longitude.toFixed(4)
          });
        }
      },
      fail: function() {
        that.setData({
          locationInfo: latitude.toFixed(4) + ', ' + longitude.toFixed(4)
        });
      }
    });
  },

  takePhoto: function() {
    var that = this;
    
    if (!this.cameraContext) {
      this.cameraContext = wx.createCameraContext();
      if (!this.cameraContext) {
        wx.showToast({
          title: '相机未初始化',
          icon: 'none'
        });
        return;
      }
    }
    
    if (!this.data.selectedWorker) {
      wx.showToast({
        title: '请先选择工人',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '拍照中...',
      mask: true
    });
    
    // 设置超时处理
    var timeoutId = setTimeout(function() {
      wx.hideLoading();
      wx.showToast({
        title: '拍照超时，请重试',
        icon: 'none'
      });
    }, 10000);
    
    this.cameraContext.takePhoto({
      quality: 'normal',
      success: function(res) {
        clearTimeout(timeoutId);
        wx.hideLoading();
        console.log('拍照成功，路径:', res.tempImagePath);
        
        // 更新页面状态，显示照片预览
        that.setData({
          hasTakenPhoto: true,
          photoPath: res.tempImagePath
        });
        
        wx.showToast({
          title: '拍照成功',
          icon: 'success',
          duration: 1000
        });
      },
      fail: function(error) {
        clearTimeout(timeoutId);
        wx.hideLoading();
        console.error('拍照失败:', error);
        wx.showToast({
          title: '拍照失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  retakePhoto: function() {
    this.setData({
      hasTakenPhoto: false,
      photoPath: ''
    });
  },

  confirmCheckin: function() {
    if (!this.data.selectedWorker) {
      wx.showToast({
        title: '请选择工人',
        icon: 'none'
      });
      return;
    }
    
    if (!this.data.photoPath) {
      wx.showToast({
        title: '请先拍照',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '保存中...',
      mask: true
    });
    
const record = {
workerId: this.data.selectedWorker.id,
workerName: this.data.selectedWorker.name,
date: this.data.currentDate,
time: this.data.currentTime,
location: this.data.locationInfo,
latitude: this.data.latitude,
longitude: this.data.longitude,
      photoUrl: this.data.photoPath,
      duration: this.data.selectedDuration,
      durationLabel: this.data.selectedDuration === 'half' ? '半天' : '一天'
};
    
    const app = getApp();
    app.addRecord(record, function(success, error) {
      wx.hideLoading();
      if (success) {
        wx.showToast({
          title: '签到成功',
          icon: 'success'
        });
        setTimeout(function() {
          // 使用 switchTab 跳转到记录页面（因为是 tabBar 页面）
          wx.switchTab({
            url: '/pages/records/records'
          });
        }, 1000);
      } else {
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        });
      }
    });
  },

  handleCameraError: function(e) {
    console.error('相机错误:', e.detail);
    wx.showToast({
      title: '相机出错',
      icon: 'none'
    });
  }
});
