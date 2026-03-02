// 签到记录页面逻辑
Page({
  /**
   * 页面数据
   */
  data: {
    records: [],
    filteredRecords: [],
    workers: [],
    workerNames: [],
    workerMap: {},
    selectedWorkerIndex: 0,
    startDate: '',
    endDate: '',
    currentDate: '',
    isLoading: false,
    loadingText: '',
    showDetailModal: false,
    showPhotoViewer: false,
    currentRecord: null,
    currentPhotoUrl: '',
    selectedRecordId: ''
  },
    records: [],
    filteredRecords: [],
    workers: [],
    workerNames: [],
    selectedWorkerIndex: 0,
    startDate: '',
    endDate: '',
    currentDate: '',
    isLoading: false,
    loadingText: '',
    showDetailModal: false,
    showPhotoViewer: false,
    currentRecord: null,
    currentPhotoUrl: '',
    selectedRecordId: ''
  },
  
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    console.log('签到记录页面加载');
    this.initData();
    this.loadRecords();
  },
  
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    // 每次显示页面时重新加载记录
    this.loadRecords();
  },
  
  /**
   * 初始化数据
   */
  initData: function() {
    const today = new Date().toISOString().split('T')[0];
    this.setData({
      currentDate: today,
      startDate: today,
      endDate: today
    });
  },
  
  /**
   * 加载签到记录
   */
  loadRecords: function() {
    // 记录加载时间
    this.loadStartTime = Date.now();
    
    this.showLoading('加载记录中...');
    
    try {
      const app = getApp();
      const records = app.globalData.records || [];
      const workers = app.globalData.workers || [];
      
      // 限制记录数量，只加载最近的记录
      const recentRecords = [...records].sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp);
      }).slice(0, 100).map(record => {
        // 格式化坐标信息
        if (record.latitude && record.longitude) {
          record.coordinateStr = `${record.latitude.toFixed(4)}, ${record.longitude.toFixed(4)}`;
        }
        return record;
      }); // 只保留最近100条记录
      
      // 构建工人名称映射，方便快速查找
      const workerMap = {};
      workers.forEach(worker => {
        workerMap[worker.id] = worker.name;
      });
      
      this.setData({
        records: recentRecords,
        filteredRecords: recentRecords,
        workers: workers,
        workerMap: workerMap,
        totalRecords: records.length
      });
      
      const loadTime = Date.now() - this.loadStartTime;
      console.log('签到记录加载成功:', recentRecords.length, '条，总记录数:', records.length, '，耗时:', loadTime, 'ms');
      
      // 记录页面性能到全局监控
      app.recordPageLoad('/pages/records/records');
      
      // 记录操作性能
      app.recordOperation('loadRecords', this.loadStartTime, {
        recordCount: recentRecords.length,
        totalCount: records.length
      });
    } catch (error) {
      console.error('加载签到记录失败:', error);
      this.showError('加载记录失败');
    } finally {
      this.hideLoading();
    }
  },
  
  /**
   * 开始日期选择
   * @param {Object} e - 事件对象
   */
  bindStartDateChange: function(e) {
    this.setData({
      startDate: e.detail.value
    });
  },
  
  /**
   * 结束日期选择
   * @param {Object} e - 事件对象
   */
  bindEndDateChange: function(e) {
    this.setData({
      endDate: e.detail.value
    });
  },
  
  /**
   * 工人选择
   * @param {Object} e - 事件对象
   */
  bindWorkerChange: function(e) {
    this.setData({
      selectedWorkerIndex: e.detail.value
    });
  },
  
  /**
   * 应用筛选
   */
  applyFilter: function() {
    const { records, startDate, endDate, selectedWorkerIndex, workers } = this.data;
    
    // 记录筛选开始时间
    const filterStartTime = Date.now();
    
    // 使用更高效的筛选方式
    const filtered = records.filter(record => {
      // 日期筛选
      const dateMatch = record.date >= startDate && record.date <= endDate;
      
      // 工人筛选
      const workerMatch = selectedWorkerIndex === 0 || 
        record.workerId === workers[selectedWorkerIndex - 1].id;
      
      return dateMatch && workerMatch;
    });
    
    this.setData({
      filteredRecords: filtered
    });
    
    const filterTime = Date.now() - filterStartTime;
    console.log('筛选完成，结果:', filtered.length, '条，耗时:', filterTime, 'ms');
  },
  
  /**
   * 重置筛选
   */
  resetFilter: function() {
    const today = new Date().toISOString().split('T')[0];
    this.setData({
      startDate: today,
      endDate: today,
      selectedWorkerIndex: 0,
      filteredRecords: this.data.records
    });
    
    console.log('筛选已重置');
  },
  
  /**
   * 查看记录详情
   * @param {Object} e - 事件对象
   */
  viewRecordDetail: function(e) {
    const record = e.currentTarget.dataset.record;
    console.log('查看记录详情:', record);
    
    // 格式化坐标信息
    if (record.latitude && record.longitude) {
      record.coordinateStr = `${record.latitude.toFixed(4)}, ${record.longitude.toFixed(4)}`;
    }
    
    this.setData({
      currentRecord: record,
      showDetailModal: true
    });
  },
  
  /**
   * 关闭详情模态框
   */
  closeDetailModal: function() {
    this.setData({
      showDetailModal: false,
      currentRecord: null
    });
  },
  
  /**
   * 查看照片
   * @param {Object} e - 事件对象
   */
  viewPhoto: function(e) {
    const photoUrl = e.currentTarget.dataset.photoUrl;
    console.log('查看照片:', photoUrl);
    
    this.setData({
      currentPhotoUrl: photoUrl,
      showPhotoViewer: true
    });
  },
  
  /**
   * 关闭照片查看器
   */
  closePhotoViewer: function() {
    this.setData({
      showPhotoViewer: false,
      currentPhotoUrl: ''
    });
  },
  
  /**
   * 处理长按事件
   * @param {Object} e - 事件对象
   */
  handleLongPress: function(e) {
    const recordId = e.currentTarget.dataset.recordId;
    console.log('长按记录:', recordId);
    
    this.setData({
      selectedRecordId: recordId
    });
    
    // 显示删除确认
    this.showDeleteConfirm();
  },
  
  /**
   * 显示删除确认
   */
  showDeleteConfirm: function() {
    const that = this;
    wx.showModal({
      title: '删除记录',
      content: '确定要删除这条签到记录吗？此操作不可恢复。',
      success: function(res) {
        if (res.confirm) {
          that.deleteRecord();
        }
      }
    });
  },
  
  /**
   * 确认删除记录
   */
  confirmDeleteRecord: function() {
    const recordId = this.data.currentRecord.id;
    this.setData({
      selectedRecordId: recordId
    });
    this.deleteRecord();
  },
  
  /**
   * 删除记录
   */
  deleteRecord: function() {
    const recordId = this.data.selectedRecordId;
    console.log('删除记录:', recordId);
    
    try {
      const app = getApp();
      const records = app.globalData.records;
      const updatedRecords = records.filter(record => record.id !== recordId);
      
      app.saveRecords(updatedRecords);
      
      // 更新本地数据
      this.setData({
        records: updatedRecords,
        filteredRecords: updatedRecords.filter(record => {
          const { startDate, endDate, selectedWorkerIndex, workers } = this.data;
          let match = true;
          
          // 重新应用筛选
          if (record.date < startDate || record.date > endDate) {
            match = false;
          }
          
          if (selectedWorkerIndex > 0) {
            const selectedWorkerId = workers[selectedWorkerIndex - 1].id;
            if (record.workerId !== selectedWorkerId) {
              match = false;
            }
          }
          
          return match;
        })
      });
      
      // 关闭模态框
      this.closeDetailModal();
      
      this.showSuccess('记录删除成功');
      console.log('记录删除成功:', recordId);
    } catch (error) {
      console.error('删除记录失败:', error);
      this.showError('删除记录失败');
    }
  },
  
  /**
   * 格式化时间
   * @param {string} timestamp - ISO时间戳
   * @returns {string} 格式化后的时间字符串
   */
  formatTime: function(timestamp) {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('时间格式化失败:', error);
      return timestamp;
    }
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
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {
    console.log('签到记录页面卸载');
  }
});
