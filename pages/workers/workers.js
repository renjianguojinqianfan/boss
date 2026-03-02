// 工人管理页面逻辑
Page({
  /**
   * 页面的初始数据
   */
  data: {
    workers: []
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
   * 打开添加工人页面
   */
  openAddModal: function () {
    wx.navigateTo({
      url: '/pages/add-worker/add-worker'
    });
  },

  /**
   * 打开编辑工人页面
   */
  openEditModal: function (e) {
    const worker = e.currentTarget.dataset.worker;
    wx.navigateTo({
      url: '/pages/edit-worker/edit-worker?id=' + worker.id
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
          
          // 先更新页面数据（乐观更新）
          this.setData({
            workers: workers
          });

          // 保存到全局存储
          const app = getApp();
          app.globalData.workers = workers;
          
          // 异步保存到本地存储
          app.saveWorkers(workers, (success, error) => {
            if (success) {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
            } else {
              wx.showToast({
                title: '删除失败，请重试',
                icon: 'none'
              });
              console.error('删除工人失败:', error);
            }
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
