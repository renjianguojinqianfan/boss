// 首页逻辑文件
Page({
  /**
   * 页面数据
   */
  data: {
    todayCheckinCount: 0,
    totalWorkers: 0,
    recentRecords: [],
    userName: '管理员',
    currentDateText: '',
    checkinRate: 0
  },
  
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    console.log('首页加载');
    const app = getApp();
    
    if (app.globalData.isInitialized) {
      this.updateData();
    } else {
      app.onInitialized = () => {
        this.updateData();
      };
    }
  },
  
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    // 每次显示页面时更新数据
    this.updateData();
  },
  
  /**
   * 更新页面数据
   */
  updateData: function() {
    const app = getApp();
    const workers = app.globalData.workers;
    const records = app.globalData.records;
    const currentDate = app.globalData.currentDate;
    
    // 计算今日打卡数
    const todayCheckins = records.filter(record => {
      return record.date === currentDate;
    });
    
    // 计算打卡率
    const checkinRate = workers.length > 0 ? Math.round((todayCheckins.length / workers.length) * 100) : 0;
    
    // 获取最近5条签到记录
    const recentRecords = [...records]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);
    
    // 格式化当前日期
    const currentDateText = this.formatDate(new Date());
    
    this.setData({
      todayCheckinCount: todayCheckins.length,
      totalWorkers: workers.length,
      recentRecords: recentRecords,
      currentDateText: currentDateText,
      checkinRate: checkinRate
    });
  },
  
  /**
   * 跳转到拍照签到页面
   */
  goToCheckin: function() {
    wx.navigateTo({
      url: '/pages/checkin/checkin'
    });
  },
  
  /**
   * 跳转到签到记录页面
   */
  goToRecords: function() {
    wx.navigateTo({
      url: '/pages/records/records'
    });
  },
  
  /**
   * 跳转到工人管理页面
   */
  goToWorkers: function() {
    wx.navigateTo({
      url: '/pages/workers/workers'
    });
  },
  
  /**
   * 跳转到数据分析页面
   */
  goToAnalytics: function() {
    wx.navigateTo({
      url: '/pages/analytics/analytics'
    });
  },
  
  /**
   * 格式化时间
   * @param {string} timestamp - ISO格式的时间戳
   * @returns {string} 格式化后的时间字符串
   */
  formatTime: function(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  },
  
  /**
   * 格式化日期
   * @param {Date} date - 日期对象
   * @returns {string} 格式化后的日期字符串
   */
  formatDate: function(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekDay = weekDays[date.getDay()];
    return `${year}年${month}月${day}日 ${weekDay}`;
  }
});