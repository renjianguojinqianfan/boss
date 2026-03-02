// 编辑工人页面 - pages/edit-worker/edit-worker.js
Page({
  data: {
    workerId: '',
    name: '',
    phone: '',
    department: '',
    position: '',
    originalName: '',  // 原始姓名，用于重复校验
    originalPhone: ''  // 原始电话，用于重复校验
  },

  onLoad: function (options) {
    // 获取传入的工人ID
    if (options.id) {
      const app = getApp();
      const worker = app.globalData.workers.find(w => w.id === options.id);
      if (worker) {
        this.setData({
          workerId: worker.id,
          name: worker.name,
          phone: worker.phone,
          department: worker.department || '',
          position: worker.position || '',
          originalName: worker.name,
          originalPhone: worker.phone
        });
      }
    }
  },

  // 输入处理
  onNameInput: function (e) {
    this.setData({ name: e.detail.value });
  },
  onPhoneInput: function (e) {
    this.setData({ phone: e.detail.value });
  },
  onDeptInput: function (e) {
    this.setData({ department: e.detail.value });
  },
  onPositionInput: function (e) {
    this.setData({ position: e.detail.value });
  },

  // 检查是否重复（排除当前编辑的工人）
  checkDuplicate: function (name, phone) {
    const app = getApp();
    const workers = app.globalData.workers;
    const { workerId, originalName, originalPhone } = this.data;
    
    // 检查姓名是否与其他工人重复
    const duplicateName = workers.find(w => 
      w.id !== workerId && 
      w.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (duplicateName) {
      return { isDuplicate: true, message: '该姓名已被其他工人使用' };
    }
    
    // 检查电话是否与其他工人重复
    const duplicatePhone = workers.find(w => 
      w.id !== workerId && 
      w.phone.trim() === phone.trim()
    );
    if (duplicatePhone) {
      return { isDuplicate: true, message: '该电话号码已被其他工人使用' };
    }
    
    return { isDuplicate: false };
  },

  // 保存
  saveWorker: function () {
    const { workerId, name, phone, department, position } = this.data;

    // 验证必填项
    if (!name || !phone) {
      wx.showToast({
        title: '姓名和电话不能为空',
        icon: 'none'
      });
      return;
    }

    // 验证电话格式（中国大陆手机号）
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone.trim())) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      });
      return;
    }

    // 检查重复
    const checkResult = this.checkDuplicate(name, phone);
    if (checkResult.isDuplicate) {
      wx.showModal({
        title: '提示',
        content: checkResult.message + '，是否继续保存？',
        success: (res) => {
          if (res.confirm) {
            this.doSaveWorker();
          }
        }
      });
      return;
    }

    // 保存工人
    this.doSaveWorker();
  },

  // 执行保存
  doSaveWorker: function () {
    const { workerId, name, phone, department, position } = this.data;
    const app = getApp();

    const workers = app.globalData.workers.map(worker => {
      if (worker.id === workerId) {
        return {
          ...worker,
          name: name.trim(),
          phone: phone.trim(),
          department: department.trim() || '',
          position: position.trim() || '',
          updatedAt: new Date().toISOString()
        };
      }
      return worker;
    });

    // 更新全局数据
    app.globalData.workers = workers;

    // 异步保存
    app.saveWorkers(workers, (success, error) => {
      if (success) {
        wx.showToast({
          title: '编辑成功',
          icon: 'success',
          success: () => {
            // 延迟返回，让用户看到成功提示
            setTimeout(() => {
              wx.navigateBack();
            }, 1000);
          }
        });
      } else {
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        });
        console.error('保存失败:', error);
      }
    });
  },

  // 取消
  cancel: function () {
    wx.navigateBack();
  }
});
