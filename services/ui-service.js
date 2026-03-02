class UIService {
  constructor() {
    this.loadingCount = 0;
    this.isLoading = false;
  }

  showToast(message, icon = 'none', duration = 2000) {
    wx.showToast({
      title: message,
      icon: icon,
      duration: duration
    });
  }

  showSuccess(message, duration = 2000) {
    this.showToast(message, 'success', duration);
  }

  showError(message, duration = 2000) {
    this.showToast(message, 'none', duration);
  }

  showWarning(message, duration = 2000) {
    this.showToast(message, 'none', duration);
  }

  showInfo(message, duration = 2000) {
    this.showToast(message, 'none', duration);
  }

  showLoading(text = '加载中...', mask = true) {
    this.loadingCount++;
    
    if (!this.isLoading) {
      this.isLoading = true;
      wx.showLoading({
        title: text,
        mask: mask
      });
    }
  }

  hideLoading() {
    if (this.loadingCount > 0) {
      this.loadingCount--;
    }
    
    if (this.loadingCount <= 0 && this.isLoading) {
      this.isLoading = false;
      wx.hideLoading();
    }
  }

  forceHideLoading() {
    this.loadingCount = 0;
    this.isLoading = false;
    wx.hideLoading();
  }

  showModal(options) {
    const defaultOptions = {
      title: '提示',
      content: '',
      showCancel: true,
      confirmText: '确定',
      cancelText: '取消'
    };
    
    return new Promise((resolve) => {
      wx.showModal({
        ...defaultOptions,
        ...options,
        success: (res) => {
          resolve(res);
        }
      });
    });
  }

  showConfirm(title, content) {
    return this.showModal({
      title: title,
      content: content,
      showCancel: true
    });
  }

  showAlert(title, content) {
    return this.showModal({
      title: title,
      content: content,
      showCancel: false
    });
  }

  showActionSheet(itemList) {
    return new Promise((resolve, reject) => {
      wx.showActionSheet({
        itemList: itemList,
        success: (res) => {
          resolve(res);
        },
        fail: (error) => {
          reject(error);
        }
      });
    });
  }

  showPermissionDialog(permission) {
    let message = '权限被拒绝，请在设置中允许相关权限';
    
    if (permission === 'scope.camera') {
      message = '相机权限被拒绝，请在设置中允许相机权限';
    } else if (permission === 'scope.userLocation') {
      message = '位置权限被拒绝，请在设置中允许位置权限';
    }
    
    return this.showModal({
      title: '权限提示',
      content: message,
      confirmText: '去设置',
      cancelText: '取消'
    }).then((res) => {
      if (res.confirm) {
        wx.openSetting();
      }
      return res;
    });
  }
}

const uiService = new UIService();
module.exports = uiService;
