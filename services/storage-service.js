class StorageService {
  constructor() {
    this.STORAGE_KEYS = {
      WORKERS: 'workers',
      RECORDS: 'records',
      ERROR_LOGS: 'errorLogs'
    };
  }

  set(key, data) {
    return new Promise((resolve, reject) => {
      wx.setStorage({
        key: key,
        data: data,
        success: () => {
          console.log(`存储成功: ${key}`);
          resolve(true);
        },
        fail: (error) => {
          console.error(`存储失败: ${key}`, error);
          reject(error);
        }
      });
    });
  }

  get(key, defaultValue = null) {
    return new Promise((resolve) => {
      wx.getStorage({
        key: key,
        success: (res) => {
          resolve(res.data || defaultValue);
        },
        fail: () => {
          console.log(`获取失败，使用默认值: ${key}`);
          resolve(defaultValue);
        }
      });
    });
  }

  getSync(key, defaultValue = null) {
    try {
      const data = wx.getStorageSync(key);
      return data || defaultValue;
    } catch (error) {
      console.error(`同步获取失败: ${key}`, error);
      return defaultValue;
    }
  }

  setSync(key, data) {
    try {
      wx.setStorageSync(key, data);
      return true;
    } catch (error) {
      console.error(`同步存储失败: ${key}`, error);
      return false;
    }
  }

  remove(key) {
    return new Promise((resolve, reject) => {
      wx.removeStorage({
        key: key,
        success: () => {
          console.log(`删除成功: ${key}`);
          resolve(true);
        },
        fail: (error) => {
          console.error(`删除失败: ${key}`, error);
          reject(error);
        }
      });
    });
  }

  clear() {
    return new Promise((resolve, reject) => {
      wx.clearStorage({
        success: () => {
          console.log('清空存储成功');
          resolve(true);
        },
        fail: (error) => {
          console.error('清空存储失败:', error);
          reject(error);
        }
      });
    });
  }

  saveWorkers(workers) {
    return this.set(this.STORAGE_KEYS.WORKERS, workers);
  }

  getWorkers() {
    return this.get(this.STORAGE_KEYS.WORKERS, []);
  }

  saveRecords(records) {
    return this.set(this.STORAGE_KEYS.RECORDS, records);
  }

  getRecords() {
    return this.get(this.STORAGE_KEYS.RECORDS, []);
  }

  saveErrorLogs(logs) {
    return this.set(this.STORAGE_KEYS.ERROR_LOGS, logs);
  }

  getErrorLogs() {
    return this.get(this.STORAGE_KEYS.ERROR_LOGS, []);
  }

  getStorageInfo() {
    return new Promise((resolve, reject) => {
      wx.getStorageInfo({
        success: (res) => {
          resolve(res);
        },
        fail: (error) => {
          reject(error);
        }
      });
    });
  }
}

const storageService = new StorageService();
module.exports = storageService;
