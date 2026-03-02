// 添加工人页面 - pages/add-worker/add-worker.js
Page({
  data: {
    name: '',
    phone: '',
    department: '',
    position: ''
  },

  onLoad: function () {
    // 页面加载
  },

  /**
   * 生命周期函数--监听页面显示
   * 从其他页面返回时清空表单，避免显示之前输入的数据
   */
  onShow: function () {
    this.clearForm();
  },

  /**
   * 清空表单数据
   */
  clearForm: function () {
    this.setData({
      name: '',
      phone: '',
      department: '',
      position: ''
    });
  },
  // 输入处理

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

  // 检查是否重复
  checkDuplicate: function (name, phone) {
    const app = getApp();
    const workers = app.globalData.workers;
    
    // 检查姓名是否已存在（不区分大小写）
    const duplicateName = workers.find(w => w.name.trim().toLowerCase() === name.trim().toLowerCase());
    if (duplicateName) {
      return { isDuplicate: true, message: '该姓名已存在' };
    }
    
    // 检查电话是否已存在
    const duplicatePhone = workers.find(w => w.phone.trim() === phone.trim());
    if (duplicatePhone) {
      return { isDuplicate: true, message: '该电话号码已存在' };
    }
    
    return { isDuplicate: false };
  },

  // 保存
  saveWorker: function () {
    const { name, phone, department, position } = this.data;

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
        content: checkResult.message + '，是否继续添加？',
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
    const { name, phone, department, position } = this.data;
    const app = getApp();

    const newWorker = {
      id: Date.now().toString(),
      name: name.trim(),
      phone: phone.trim(),
      department: department.trim() || '',
      position: position.trim() || '',
      createdAt: new Date().toISOString()
    };

    const workers = [...app.globalData.workers, newWorker];

    // 更新全局数据
    app.globalData.workers = workers;

    // 异步保存到本地存储
    app.saveWorkers(workers, (success, error) => {
      if (success) {
        wx.showToast({
          title: '添加成功',
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
