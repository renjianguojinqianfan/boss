class PerformanceMonitor {
  constructor() {
    this.metrics = {
      startup: {
        time: 0,
        steps: {},
        completeTime: null
      },
      pages: {},
      operations: {}
    };
    this.pageStartTime = null;
    this.currentPagePath = null;
    this.startTime = null;
  }

  init() {
    this.startTime = Date.now();
    this.monitorPagePerformance();
    this.monitorMemoryWarning();
    console.log('性能监控初始化完成');
  }

  setStartupTime(time) {
    this.metrics.startup.time = time;
    this.metrics.startup.completeTime = new Date().toISOString();
  }

  monitorPagePerformance() {
    wx.onAppRoute((res) => {
      if (res.openType === 'navigateTo' || res.openType === 'switchTab') {
        this.currentPagePath = res.path;
        this.pageStartTime = Date.now();
        console.log('页面开始加载:', res.path);
      }
    });
  }

  monitorMemoryWarning() {
    wx.onMemoryWarning((res) => {
      this.handleMemoryWarning(res);
    });
  }

  recordPageLoad(pagePath) {
    if (this.pageStartTime) {
      const loadTime = Date.now() - this.pageStartTime;
      
      if (!this.metrics.pages[pagePath]) {
        this.metrics.pages[pagePath] = [];
      }
      
      this.metrics.pages[pagePath].push({
        time: loadTime,
        timestamp: new Date().toISOString()
      });
      
      console.log(`页面 ${pagePath} 加载完成，耗时: ${loadTime}ms`);
      this.pageStartTime = null;
      
      return loadTime;
    }
    return 0;
  }

  recordOperation(operation, startTime, context = {}) {
    const duration = Date.now() - startTime;
    
    if (!this.metrics.operations[operation]) {
      this.metrics.operations[operation] = [];
    }
    
    this.metrics.operations[operation].push({
      duration: duration,
      timestamp: new Date().toISOString(),
      context: context
    });
    
    if (duration > 1000) {
      console.warn(`操作 ${operation} 耗时过长: ${duration}ms`);
      this.reportPerformanceIssue(operation, duration, context);
    }
    
    return duration;
  }

  startOperation(operation) {
    return {
      operation: operation,
      startTime: Date.now()
    };
  }

  endOperation(operationInfo, context = {}) {
    if (operationInfo && operationInfo.startTime) {
      return this.recordOperation(operationInfo.operation, operationInfo.startTime, context);
    }
    return 0;
  }

  handleMemoryWarning(res) {
    console.warn('内存警告:', res);
    this.reportMemoryWarning(res);
  }

  reportPerformanceIssue(operation, duration, context) {
    const issueInfo = {
      operation: operation,
      duration: duration,
      context: context,
      timestamp: new Date().toISOString()
    };
    
    console.log('上报性能问题:', issueInfo);
  }

  reportMemoryWarning(res) {
    const warningInfo = {
      level: res.level,
      timestamp: new Date().toISOString()
    };
    
    console.log('上报内存警告:', warningInfo);
  }

  getReport() {
    return this.metrics;
  }

  getStartupTime() {
    return this.metrics.startup.time;
  }

  getPageLoadTimes(pagePath) {
    if (pagePath) {
      return this.metrics.pages[pagePath] || [];
    }
    return this.metrics.pages;
  }

  getOperationTimes(operation) {
    if (operation) {
      return this.metrics.operations[operation] || [];
    }
    return this.metrics.operations;
  }

  clearMetrics() {
    this.metrics = {
      startup: {
        time: 0,
        steps: {},
        completeTime: null
      },
      pages: {},
      operations: {}
    };
    console.log('性能指标已清空');
  }
}

const performanceMonitor = new PerformanceMonitor();
module.exports = performanceMonitor;
