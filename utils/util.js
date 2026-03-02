// 工具函数文件

/**
 * 格式化日期
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的日期字符串 (YYYY-MM-DD)
 */
function formatDate(date) {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 格式化时间
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的时间字符串 (HH:MM)
 */
function formatTime(date) {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 格式化日期时间
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的日期时间字符串 (YYYY-MM-DD HH:MM)
 */
function formatDateTime(date) {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  return `${formatDate(date)} ${formatTime(date)}`;
}

/**
 * 获取当前日期
 * @returns {string} 当前日期 (YYYY-MM-DD)
 */
function getCurrentDate() {
  return formatDate(new Date());
}

/**
 * 生成唯一ID
 * @returns {string} 唯一ID
 */
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

/**
 * 深拷贝对象
 * @param {any} obj - 要拷贝的对象
 * @returns {any} 拷贝后的对象
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

/**
 * 计算两个日期之间的天数
 * @param {string} date1 - 第一个日期 (YYYY-MM-DD)
 * @param {string} date2 - 第二个日期 (YYYY-MM-DD)
 * @returns {number} 天数差
 */
function getDaysDiff(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const timeDiff = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

/**
 * 检查是否是今天
 * @param {string} dateStr - 日期字符串 (YYYY-MM-DD)
 * @returns {boolean} 是否是今天
 */
function isToday(dateStr) {
  return dateStr === getCurrentDate();
}

/**
 * 格式化数字，添加千分位
 * @param {number} num - 数字
 * @returns {string} 格式化后的数字字符串
 */
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 生成月份列表
 * @param {number} months - 月份数量
 * @returns {Array} 月份列表
 */
function generateMonthList(months = 6) {
  const result = [];
  const now = new Date();
  
  for (let i = 0; i < months; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      value: date.getFullYear() + '-' + (date.getMonth() + 1).toString().padStart(2, '0'),
      label: (date.getMonth() + 1) + '月'
    });
  }
  
  return result;
}

/**
 * 生成星期列表
 * @returns {Array} 星期列表
 */
function generateWeekList() {
  const now = new Date();
  const result = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    result.push({
      value: formatDate(date),
      label: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
    });
  }
  
  return result;
}

/**
 * 计算出勤率
 * @param {Array} records - 签到记录
 * @param {Array} workers - 工人列表
 * @param {string} startDate - 开始日期
 * @param {string} endDate - 结束日期
 * @returns {number} 出勤率
 */
function calculateAttendanceRate(records, workers, startDate, endDate) {
  if (workers.length === 0) {
    return 0;
  }
  
  const filteredRecords = records.filter(record => {
    return record.date >= startDate && record.date <= endDate;
  });
  
  const workingDays = getDaysDiff(startDate, endDate) + 1;
  const expectedAttendances = workers.length * workingDays;
  const actualAttendances = filteredRecords.length;
  
  return Math.round((actualAttendances / expectedAttendances) * 100);
}

/**
 * 按日期分组记录
 * @param {Array} records - 签到记录
 * @returns {Object} 按日期分组的记录
 */
function groupRecordsByDate(records) {
  return records.reduce((groups, record) => {
    const date = record.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(record);
    return groups;
  }, {});
}

/**
 * 按工人分组记录
 * @param {Array} records - 签到记录
 * @returns {Object} 按工人分组的记录
 */
function groupRecordsByWorker(records) {
  return records.reduce((groups, record) => {
    const workerId = record.workerId;
    if (!groups[workerId]) {
      groups[workerId] = [];
    }
    groups[workerId].push(record);
    return groups;
  }, {});
}

/**
 * 计算每个工人的出勤天数
 * @param {Array} records - 签到记录
 * @param {Array} workers - 工人列表
 * @param {string} startDate - 开始日期
 * @param {string} endDate - 结束日期
 * @returns {Object} 每个工人的出勤天数
 */
function calculateWorkerAttendance(records, workers, startDate, endDate) {
  const result = {};
  
  // 初始化每个工人的出勤天数为0
  workers.forEach(worker => {
    result[worker.id] = {
      name: worker.name,
      days: 0
    };
  });
  
  // 计算每个工人的出勤天数
  records.forEach(record => {
    if (record.date >= startDate && record.date <= endDate) {
      if (result[record.workerId]) {
        result[record.workerId].days++;
      }
    }
  });
  
  return result;
}

// 导出模块
module.exports = {
  formatDate,
  formatTime,
  formatDateTime,
  getCurrentDate,
  generateId,
  deepClone,
  getDaysDiff,
  isToday,
  formatNumber,
  generateMonthList,
  generateWeekList,
  calculateAttendanceRate,
  groupRecordsByDate,
  groupRecordsByWorker,
  calculateWorkerAttendance
};