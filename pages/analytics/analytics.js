// 数据分析页面逻辑
Page({
  /**
   * 页面数据
   */
  data: {
    timeRange: 'week', // 时间范围：week, month, year
    overview: {
      totalAttendance: 0,
      attendanceRate: 0,
      lateCount: 0
    },
    isLoading: false,
    loadingText: '',
    attendanceData: [],
    lateData: [],
    trendData: []
  },
  
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    console.log('数据分析页面加载');
    this.loadData();
  },
  
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    // 每次显示页面时重新加载数据
    this.loadData();
  },
  
  /**
   * 设置时间范围
   * @param {Object} e - 事件对象
   */
  setTimeRange: function(e) {
    const range = e.currentTarget.dataset.range;
    this.setData({
      timeRange: range
    });
    this.loadData();
  },
  
  /**
   * 加载数据
   */
  loadData: function() {
    // 记录加载开始时间
    this.loadStartTime = Date.now();
    
    this.showLoading('加载数据中...');
    
    try {
      const app = getApp();
      const workers = app.globalData.workers || [];
      const records = app.globalData.records || [];
      const timeRange = this.data.timeRange;
      
      // 计算时间范围
      const { startDate, endDate, labels } = this.calculateDateRange(timeRange);
      
      // 限制记录数量，只处理时间范围内的记录
      const timeRangeRecords = records.filter(record => {
        return record.date >= startDate && record.date <= endDate;
      });
      
      // 批量计算数据
      const calculatedData = this.calculateAllData(timeRangeRecords, workers, startDate, endDate, labels, timeRange);
      
      this.setData({
        overview: calculatedData.overview,
        attendanceData: calculatedData.attendanceData,
        lateData: calculatedData.lateData,
        trendData: calculatedData.trendData
      });
      
      // 延迟绘制图表，确保数据已更新
      setTimeout(() => {
        const drawStartTime = Date.now();
        this.drawCharts();
        this.hideLoading();
        
        const loadTime = Date.now() - this.loadStartTime;
        const drawTime = Date.now() - drawStartTime;
        console.log('分析数据加载完成，耗时:', loadTime, 'ms，图表绘制耗时:', drawTime, 'ms');
        
        // 记录页面性能到全局监控
        app.recordPageLoad('/pages/analytics/analytics');
        
        // 记录操作性能
        app.recordOperation('loadAnalyticsData', this.loadStartTime, {
          timeRange: timeRange,
          recordCount: timeRangeRecords.length,
          drawTime: drawTime
        });
      }, 100);
      
    } catch (error) {
      console.error('加载数据失败:', error);
      this.showError('加载数据失败');
      this.hideLoading();
    }
  },
  
  /**
   * 批量计算所有数据，减少重复遍历
   * @param {Array} records - 时间范围内的记录
   * @param {Array} workers - 工人列表
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @param {Array} labels - 标签
   * @param {string} timeRange - 时间范围
   * @returns {Object} 计算结果
   */
  calculateAllData: function(records, workers, startDate, endDate, labels, timeRange) {
    // 只过滤一次记录，避免重复计算
    const filteredRecords = records.filter(record => {
      return record.date >= startDate && record.date <= endDate;
    });
    
    // 计算概览数据
    const overview = this.calculateOverview(filteredRecords, workers, startDate, endDate);
    
    // 计算出勤数据
    const attendanceData = this.calculateAttendanceData(filteredRecords, workers, startDate, endDate, labels, timeRange);
    
    // 计算迟到数据
    const lateData = this.calculateLateData(filteredRecords, startDate, endDate, labels, timeRange);
    
    // 计算趋势数据
    const trendData = this.calculateTrendData(filteredRecords, workers, startDate, endDate, labels, timeRange);
    
    return {
      overview: overview,
      attendanceData: attendanceData,
      lateData: lateData,
      trendData: trendData
    };
  },
  
  /**
   * 计算时间范围
   * @param {string} timeRange - 时间范围类型
   * @returns {Object} 时间范围对象
   */
  calculateDateRange: function(timeRange) {
    const now = new Date();
    let startDate, endDate, labels = [];
    
    if (timeRange === 'week') {
      // 最近7天
      endDate = new Date(now);
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 6);
      
      // 生成最近7天的标签
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        labels.push(`${date.getMonth() + 1}/${date.getDate()}`);
      }
    } else if (timeRange === 'month') {
      // 最近30天
      endDate = new Date(now);
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 29);
      
      // 生成最近30天的标签（每3天一个）
      for (let i = 29; i >= 0; i -= 3) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        labels.push(`${date.getMonth() + 1}/${date.getDate()}`);
      }
    } else if (timeRange === 'year') {
      // 最近12个月
      endDate = new Date(now);
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 11);
      
      // 生成最近12个月的标签
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        labels.push(`${date.getMonth() + 1}月`);
      }
    }
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      labels: labels
    };
  },
  
  /**
   * 计算数据概览
   * @param {Array} records - 已经过滤好的签到记录
   * @param {Array} workers - 工人列表
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @returns {Object} 概览数据
   */
  calculateOverview: function(records, workers, startDate, endDate) {
    // 计算总出勤人数
    const uniqueWorkers = new Set(records.map(record => record.workerId));
    const totalAttendance = uniqueWorkers.size;
    
    // 计算出勤率
    const attendanceRate = workers.length > 0 ? Math.round((totalAttendance / workers.length) * 100) : 0;
    
    // 计算迟到人数
    // 假设9:00为上班时间，超过9:00算迟到
    const lateCount = records.filter(record => {
      const time = new Date(record.timestamp).getHours();
      return time >= 9;
    }).length;
    
    return {
      totalAttendance: totalAttendance,
      attendanceRate: attendanceRate,
      lateCount: lateCount
    };
  },
  
  /**
   * 计算出勤数据
   * @param {Array} records - 已经过滤好的签到记录
   * @param {Array} workers - 工人列表
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @param {Array} labels - 标签
   * @param {string} timeRange - 时间范围
   * @returns {Array} 出勤数据
   */
  calculateAttendanceData: function(records, workers, startDate, endDate, labels, timeRange) {
    const data = [];
    
    // 使用已经过滤好的记录
    const filteredRecords = records;
    
    if (timeRange === 'week') {
      // 按天统计
      labels.forEach((label, index) => {
        const [month, day] = label.split('/');
        const targetDate = `${new Date().getFullYear()}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        
        const dayRecords = filteredRecords.filter(record => record.date === targetDate);
        const dayAttendance = new Set(dayRecords.map(record => record.workerId)).size;
        data.push(dayAttendance);
      });
    } else if (timeRange === 'month') {
      // 按3天统计
      labels.forEach((label, index) => {
        const [month, day] = label.split('/');
        const start = new Date(new Date().getFullYear(), month - 1, day);
        const end = new Date(start);
        end.setDate(end.getDate() + 2);
        
        const periodRecords = filteredRecords.filter(record => {
          const recordDate = new Date(record.date);
          return recordDate >= start && recordDate <= end;
        });
        
        const periodAttendance = new Set(periodRecords.map(record => record.workerId)).size;
        data.push(periodAttendance);
      });
    } else if (timeRange === 'year') {
      // 按月统计
      labels.forEach((label, index) => {
        const month = parseInt(label);
        const monthRecords = filteredRecords.filter(record => {
          const recordMonth = new Date(record.date).getMonth() + 1;
          return recordMonth === month;
        });
        
        const monthAttendance = new Set(monthRecords.map(record => record.workerId)).size;
        data.push(monthAttendance);
      });
    }
    
    return data;
  },
  
  /**
   * 计算迟到数据
   * @param {Array} records - 已经过滤好的签到记录
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @param {Array} labels - 标签
   * @param {string} timeRange - 时间范围
   * @returns {Array} 迟到数据
   */
  calculateLateData: function(records, startDate, endDate, labels, timeRange) {
    const data = [];
    
    // 使用已经过滤好的记录
    const filteredRecords = records;
    
    if (timeRange === 'week') {
      // 按天统计
      labels.forEach((label, index) => {
        const [month, day] = label.split('/');
        const targetDate = `${new Date().getFullYear()}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        
        const dayLateRecords = filteredRecords.filter(record => {
          const recordDate = record.date === targetDate;
          const recordHour = new Date(record.timestamp).getHours();
          return recordDate && recordHour >= 9;
        });
        
        data.push(dayLateRecords.length);
      });
    } else if (timeRange === 'month') {
      // 按3天统计
      labels.forEach((label, index) => {
        const [month, day] = label.split('/');
        const start = new Date(new Date().getFullYear(), month - 1, day);
        const end = new Date(start);
        end.setDate(end.getDate() + 2);
        
        const periodLateRecords = filteredRecords.filter(record => {
          const recordDate = new Date(record.date);
          const recordHour = new Date(record.timestamp).getHours();
          return recordDate >= start && recordDate <= end && recordHour >= 9;
        });
        
        data.push(periodLateRecords.length);
      });
    } else if (timeRange === 'year') {
      // 按月统计
      labels.forEach((label, index) => {
        const month = parseInt(label);
        const monthLateRecords = filteredRecords.filter(record => {
          const recordMonth = new Date(record.date).getMonth() + 1;
          const recordHour = new Date(record.timestamp).getHours();
          return recordMonth === month && recordHour >= 9;
        });
        
        data.push(monthLateRecords.length);
      });
    }
    
    return data;
  },
  
  /**
   * 计算趋势数据
   * @param {Array} records - 已经过滤好的签到记录
   * @param {Array} workers - 工人列表
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @param {Array} labels - 标签
   * @param {string} timeRange - 时间范围
   * @returns {Array} 趋势数据
   */
  calculateTrendData: function(records, workers, startDate, endDate, labels, timeRange) {
    const data = [];
    
    // 使用已经过滤好的记录
    const filteredRecords = records;
    
    if (timeRange === 'week') {
      // 按天统计
      labels.forEach((label, index) => {
        const [month, day] = label.split('/');
        const targetDate = `${new Date().getFullYear()}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        
        const dayRecords = filteredRecords.filter(record => record.date === targetDate);
        const dayAttendance = new Set(dayRecords.map(record => record.workerId)).size;
        const rate = workers.length > 0 ? Math.round((dayAttendance / workers.length) * 100) : 0;
        data.push(rate);
      });
    } else if (timeRange === 'month') {
      // 按3天统计
      labels.forEach((label, index) => {
        const [month, day] = label.split('/');
        const start = new Date(new Date().getFullYear(), month - 1, day);
        const end = new Date(start);
        end.setDate(end.getDate() + 2);
        
        const periodRecords = filteredRecords.filter(record => {
          const recordDate = new Date(record.date);
          return recordDate >= start && recordDate <= end;
        });
        
        const periodAttendance = new Set(periodRecords.map(record => record.workerId)).size;
        const rate = workers.length > 0 ? Math.round((periodAttendance / workers.length) * 100) : 0;
        data.push(rate);
      });
    } else if (timeRange === 'year') {
      // 按月统计
      labels.forEach((label, index) => {
        const month = parseInt(label);
        const monthRecords = filteredRecords.filter(record => {
          const recordMonth = new Date(record.date).getMonth() + 1;
          return recordMonth === month;
        });
        
        const monthAttendance = new Set(monthRecords.map(record => record.workerId)).size;
        const rate = workers.length > 0 ? Math.round((monthAttendance / workers.length) * 100) : 0;
        data.push(rate);
      });
    }
    
    return data;
  },
  
  /**
   * 绘制图表
   */
  drawCharts: function() {
    const timeRange = this.data.timeRange;
    const { startDate, endDate, labels } = this.calculateDateRange(timeRange);
    
    // 检查设备性能，调整绘制策略
    const app = getApp();
    const performanceLevel = app.globalData.performanceLevel || 'medium';
    const deviceStrategy = app.globalData.deviceStrategy || {
      canvasQuality: 'medium',
      animationEnabled: true
    };
    
    console.log('根据设备性能绘制图表，性能等级:', performanceLevel);
    
    // 根据设备性能决定是否绘制所有图表
    if (performanceLevel === 'low') {
      // 低性能设备只绘制关键图表
      this.drawAttendanceChart(labels, deviceStrategy);
    } else {
      // 高性能设备绘制所有图表
      this.drawAttendanceChart(labels, deviceStrategy);
      this.drawLateChart(labels, deviceStrategy);
      this.drawTrendChart(labels, deviceStrategy);
    }
  },
  
  /**
   * 绘制出勤统计图表
   * @param {Array} labels - 标签
   * @param {Object} deviceStrategy - 设备策略
   */
  drawAttendanceChart: function(labels, deviceStrategy) {
    const ctx = wx.createCanvasContext('attendanceChart');
    const data = this.data.attendanceData;
    const canvasWidth = wx.getSystemInfoSync().windowWidth - 64;
    const canvasHeight = deviceStrategy.canvasQuality === 'low' ? 200 : 300;
    
    // 根据设备策略调整绘制质量
    const lineWidth = deviceStrategy.canvasQuality === 'low' ? 0.5 : 1;
    const fontSize = deviceStrategy.canvasQuality === 'low' ? 10 : 12;
    
    // 设置样式
    ctx.setStrokeStyle('#007AFF');
    ctx.setFillStyle('#007AFF');
    ctx.setFontSize(fontSize);
    
    // 绘制网格（低性能设备减少网格数量）
    ctx.setStrokeStyle('#e0e0e0');
    ctx.setLineWidth(lineWidth);
    const gridCount = deviceStrategy.canvasQuality === 'low' ? 3 : 5;
    for (let i = 0; i <= gridCount; i++) {
      const y = canvasHeight - (i * canvasHeight / gridCount);
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(canvasWidth - 20, y);
      ctx.stroke();
    }
    
    // 绘制标签
    ctx.setFillStyle('#666');
    labels.forEach((label, index) => {
      // 低性能设备减少标签数量
      if (deviceStrategy.canvasQuality === 'low' && index % 2 !== 0) return;
      
      const x = 40 + (index * (canvasWidth - 60) / (labels.length - 1));
      ctx.fillText(label, x - 15, canvasHeight - 5);
    });
    
    // 绘制柱状图
    ctx.setFillStyle('#007AFF');
    const maxValue = Math.max(...data, 10);
    data.forEach((value, index) => {
      const barWidth = (canvasWidth - 60) / labels.length * 0.6;
      const x = 40 + (index * (canvasWidth - 60) / (labels.length - 1)) - barWidth / 2;
      const barHeight = (value / maxValue) * (canvasHeight - 30);
      ctx.fillRect(x, canvasHeight - barHeight - 20, barWidth, barHeight);
    });
    
    ctx.draw(deviceStrategy.animationEnabled);
  },
  
  /**
   * 绘制迟到分析图表
   * @param {Array} labels - 标签
   * @param {Object} deviceStrategy - 设备策略
   */
  drawLateChart: function(labels, deviceStrategy) {
    const ctx = wx.createCanvasContext('lateChart');
    const data = this.data.lateData;
    const canvasWidth = wx.getSystemInfoSync().windowWidth - 64;
    const canvasHeight = deviceStrategy.canvasQuality === 'low' ? 200 : 300;
    
    // 根据设备策略调整绘制质量
    const lineWidth = deviceStrategy.canvasQuality === 'low' ? 0.5 : 1;
    const fontSize = deviceStrategy.canvasQuality === 'low' ? 10 : 12;
    
    // 设置样式
    ctx.setStrokeStyle('#FF3B30');
    ctx.setFillStyle('#FF3B30');
    ctx.setFontSize(fontSize);
    
    // 绘制网格（低性能设备减少网格数量）
    ctx.setStrokeStyle('#e0e0e0');
    ctx.setLineWidth(lineWidth);
    const gridCount = deviceStrategy.canvasQuality === 'low' ? 3 : 5;
    for (let i = 0; i <= gridCount; i++) {
      const y = canvasHeight - (i * canvasHeight / gridCount);
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(canvasWidth - 20, y);
      ctx.stroke();
    }
    
    // 绘制标签
    ctx.setFillStyle('#666');
    labels.forEach((label, index) => {
      // 低性能设备减少标签数量
      if (deviceStrategy.canvasQuality === 'low' && index % 2 !== 0) return;
      
      const x = 40 + (index * (canvasWidth - 60) / (labels.length - 1));
      ctx.fillText(label, x - 15, canvasHeight - 5);
    });
    
    // 绘制柱状图
    ctx.setFillStyle('#FF3B30');
    const maxValue = Math.max(...data, 5);
    data.forEach((value, index) => {
      const barWidth = (canvasWidth - 60) / labels.length * 0.6;
      const x = 40 + (index * (canvasWidth - 60) / (labels.length - 1)) - barWidth / 2;
      const barHeight = (value / maxValue) * (canvasHeight - 30);
      ctx.fillRect(x, canvasHeight - barHeight - 20, barWidth, barHeight);
    });
    
    ctx.draw(deviceStrategy.animationEnabled);
  },
  
  /**
   * 绘制出勤率趋势图表
   * @param {Array} labels - 标签
   * @param {Object} deviceStrategy - 设备策略
   */
  drawTrendChart: function(labels, deviceStrategy) {
    const ctx = wx.createCanvasContext('trendChart');
    const data = this.data.trendData;
    const canvasWidth = wx.getSystemInfoSync().windowWidth - 64;
    const canvasHeight = deviceStrategy.canvasQuality === 'low' ? 200 : 300;
    
    // 根据设备策略调整绘制质量
    const lineWidth = deviceStrategy.canvasQuality === 'low' ? 1 : 2;
    const fontSize = deviceStrategy.canvasQuality === 'low' ? 10 : 12;
    const pointSize = deviceStrategy.canvasQuality === 'low' ? 2 : 4;
    
    // 设置样式
    ctx.setStrokeStyle('#34C759');
    ctx.setFillStyle('#34C759');
    ctx.setFontSize(fontSize);
    ctx.setLineWidth(lineWidth);
    
    // 绘制网格（低性能设备减少网格数量）
    ctx.setStrokeStyle('#e0e0e0');
    ctx.setLineWidth(lineWidth * 0.5);
    const gridCount = deviceStrategy.canvasQuality === 'low' ? 3 : 5;
    for (let i = 0; i <= gridCount; i++) {
      const y = canvasHeight - (i * canvasHeight / gridCount);
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(canvasWidth - 20, y);
      ctx.stroke();
    }
    
    // 绘制标签
    ctx.setFillStyle('#666');
    labels.forEach((label, index) => {
      // 低性能设备减少标签数量
      if (deviceStrategy.canvasQuality === 'low' && index % 2 !== 0) return;
      
      const x = 40 + (index * (canvasWidth - 60) / (labels.length - 1));
      ctx.fillText(label, x - 15, canvasHeight - 5);
    });
    
    // 绘制折线图
    ctx.setStrokeStyle('#34C759');
    ctx.beginPath();
    const maxValue = 100;
    data.forEach((value, index) => {
      const x = 40 + (index * (canvasWidth - 60) / (labels.length - 1));
      const y = canvasHeight - (value / maxValue) * (canvasHeight - 30) - 20;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    
    // 绘制数据点（低性能设备减少数据点）
    if (deviceStrategy.canvasQuality !== 'low') {
      ctx.setFillStyle('#34C759');
      data.forEach((value, index) => {
        const x = 40 + (index * (canvasWidth - 60) / (labels.length - 1));
        const y = canvasHeight - (value / maxValue) * (canvasHeight - 30) - 20;
        ctx.beginPath();
        ctx.arc(x, y, pointSize, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
    
    ctx.draw(deviceStrategy.animationEnabled);
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
  }
});