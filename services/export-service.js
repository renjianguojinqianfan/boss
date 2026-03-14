/**
 * 导出服务 - 数据导出功能
 */
const XLSX = require('../vendor/xlsx.mini.min.js');
const storageService = require('./storage-service');

class ExportService {
  constructor() {
    this.FILE_PREFIX = '考勤记录';
  }

  /**
   * 生成CSV格式的导出数据
   * 由于微信小程序限制，使用CSV格式更可靠
   */
  async exportToCSV() {
    try {
      // 获取所有记录
      const records = await storageService.getRecords();
      
      if (records.length === 0) {
        throw new Error('暂无数据可导出');
      }

      // CSV 表头
      const headers = ['序号', '工人姓名', '签到日期', '签到时间', '工作时长', '签到地点', '备注'];
      
      // 准备数据行
      const rows = records.map((record, index) => [
        index + 1,
        record.workerName,
        record.date,
        record.time,
        record.durationLabel || '一天',
        record.location || '',
        record.remark || ''
      ]);

      // 转换为CSV格式
      let csvContent = '\uFEFF'; // BOM头，确保Excel正确识别UTF-8
      csvContent += headers.join(',') + '\n';
      
      rows.forEach(row => {
        // 处理可能包含逗号的字段
        const formattedRow = row.map(field => {
          const str = String(field);
          if (str.includes(',') || str.includes('\n') || str.includes('"')) {
            return '"' + str.replace(/"/g, '""') + '"';
          }
          return str;
        });
        csvContent += formattedRow.join(',') + '\n';
      });

      // 保存文件
      const fileName = `${this.FILE_PREFIX}_${this.formatDateTime(new Date())}.csv`;
      const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;
      
      const fs = wx.getFileSystemManager();
      fs.writeFileSync(filePath, csvContent, 'utf8');

      // 分享文件
      await this.shareFile(filePath, fileName);
      
      // 记录导出时间
      wx.setStorageSync('LAST_EXPORT_TIME', new Date().toISOString());
      
      return { success: true, fileName, recordCount: records.length };
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  /**
   * 生成Excel文件并分享
   */
  async exportToExcel() {
    try {
      // 获取所有记录
      const records = await storageService.getRecords();
      
      if (records.length === 0) {
        throw new Error('暂无数据可导出');
      }

      // 准备数据
      const data = records.map((record, index) => ({
        '序号': index + 1,
        '工人姓名': record.workerName,
        '签到日期': record.date,
        '签到时间': record.time,
        '工作时长': record.durationLabel || '一天',
        '签到地点': record.location || '',
        '备注': record.remark || ''
      }));

      // 创建工作簿
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.book_new();
      XLSX.book_append_sheet(wb, ws, '考勤记录');

      // 生成文件
      const fileData = XLSX.write(wb, { type: 'base64' });
      const fileName = `${this.FILE_PREFIX}_${this.formatDateTime(new Date())}.xlsx`;
      const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;

      // 保存文件
      const fs = wx.getFileSystemManager();
      fs.writeFileSync(filePath, fileData, 'base64');

      // 分享文件
      await this.shareFile(filePath, fileName);
      
      // 记录导出时间
      wx.setStorageSync('LAST_EXPORT_TIME', new Date().toISOString());
      
      return { success: true, fileName, recordCount: records.length };
    } catch (error) {
      console.error('Excel export failed, fallback to CSV:', error);
      // 如果Excel导出失败，回退到CSV
      return this.exportToCSV();
    }
  }

  /**
   * 分享文件
   */
  shareFile(filePath, fileName) {
    return new Promise((resolve, reject) => {
      wx.shareFileMessage({
        filePath: filePath,
        fileName: fileName,
        success: resolve,
        fail: (err) => {
          console.error('分享失败:', err);
          reject(err);
        }
      });
    });
  }

  /**
   * 格式化日期时间
   */
  formatDateTime(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d}_${h}-${min}`;
  }

  /**
   * 获取上次导出时间
   */
  getLastExportTime() {
    return wx.getStorageSync('LAST_EXPORT_TIME');
  }

  /**
   * 检查是否需要备份提醒
   */
  shouldRemindBackup() {
    const lastExport = this.getLastExportTime();
    if (!lastExport) return true;
    
    const daysSinceExport = Math.floor((new Date() - new Date(lastExport)) / (1000 * 60 * 60 * 24));
    return daysSinceExport >= 30;
  }
}

module.exports = new ExportService();
