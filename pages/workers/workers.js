// 工人管理页面逻辑
Page({
  /**
   * 页面的初始数据
   */
  data: {
    workers: [],
    showAddModal: false,
    showEditModal: false,
    currentWorker: null,
    formData: {
      id: '',
      name: '',
      phone: '',
      department: '',
      position: ''
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.loadWorkers();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.loadWorkers();
  },

  /**
   * 加载工人数据
   */
  loadWorkers: function () {
    const app = getApp();
    const workers = app.globalData.workers;
    this.setData({
      workers: workers
    });
  },

  /**
   * 保存工人数据到全局存储
   */
  saveWorkers: function (workers) {
    const app = getApp();
    app.saveWorkers(workers);
  },

  /**
   * 打开添加工人弹窗
   */
  openAddModal: function () {
    this.setData({
      showAddModal: true,
      formData: {
        id: '',
        name: '',
        phone: '',
        department: '',
        position: ''
      }
    });
  },

  /**
   * 打开编辑工人弹窗
   */
  openEditModal: function (e) {
    const worker = e.currentTarget.dataset.worker;
    this.setData({
      showEditModal: true,
      currentWorker: worker,
      formData: {
        id: worker.id,
        name: worker.name,
        phone: worker.phone,
        department: worker.department,
        position: worker.position
      }
    });
  },

  /**
   * 关闭弹窗
   */
  closeModal: function () {
    this.setData({
      showAddModal: false,
      showEditModal: false,
      currentWorker: null
    });
  },

  /**
   * 输入框输入事件
   */
  handleInput: function (e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`formData.${field}`]: value
    });
  },

  /**
   * 添加工人
   */
  addWorker: function () {
    const { name, phone, department, position } = this.data.formData;
    
    if (!name || !phone) {
      wx.showToast({
        title: '姓名和电话不能为空',
        icon: 'none'
      });
      return;
    }

    const newWorker = {
      id: Date.now().toString(),
      name: name,
      phone: phone,
      department: department || '',
      position: position || '',
      createdAt: new Date().toISOString()
    };

    const workers = [...this.data.workers, newWorker];
    this.saveWorkers(workers);
    this.loadWorkers();
    this.closeModal();

    wx.showToast({
      title: '添加成功',
      icon: 'success'
    });
  },

  /**
   * 编辑工人
   */
  editWorker: function () {
    const { id, name, phone, department, position } = this.data.formData;
    
    if (!name || !phone) {
      wx.showToast({
        title: '姓名和电话不能为空',
        icon: 'none'
      });
      return;
    }

    const workers = this.data.workers.map(worker => {
      if (worker.id === id) {
        return {
          ...worker,
          name: name,
          phone: phone,
          department: department || '',
          position: position || '',
          updatedAt: new Date().toISOString()
        };
      }
      return worker;
    });

    this.saveWorkers(workers);
    this.loadWorkers();
    this.closeModal();

    wx.showToast({
      title: '编辑成功',
      icon: 'success'
    });
  },

  /**
   * 删除工人
   */
  deleteWorker: function (e) {
    const workerId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个工人吗？',
      success: (res) => {
        if (res.confirm) {
          const workers = this.data.workers.filter(worker => worker.id !== workerId);
          this.saveWorkers(workers);
          this.loadWorkers();
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },

  /**
   * 搜索工人
   */
  searchWorkers: function (e) {
    const keyword = e.detail.value;
    const app = getApp();
    const allWorkers = app.globalData.workers;
    
    if (!keyword) {
      this.setData({
        workers: allWorkers
      });
      return;
    }

    const filteredWorkers = allWorkers.filter(worker => {
      return worker.name.includes(keyword) || 
             worker.phone.includes(keyword) || 
             (worker.department && worker.department.includes(keyword));
    });

    this.setData({
      workers: filteredWorkers
    });
  }
});