const history = require('../../data/history.js');

Page({
  data: {
    mode: 'ancient',
    eraName: '北宋',
    eraMeta: '960–1127 · 九帝 · 开封',
    eraSeal: '宋',
    events: []
  },

  onLoad(options) {
    const mode = options && options.mode === 'modern' ? 'modern' : 'ancient';
    this.loadMode(mode);
  },

  switchMode(e) {
    const mode = e.currentTarget.dataset.mode;
    if (!mode || mode === this.data.mode) return;
    this.loadMode(mode);
  },

  loadMode(mode) {
    const events = history.events.filter((item) => item.mode === mode);
    const isAncient = mode === 'ancient';
    this.setData({
      mode,
      events,
      eraName: isAncient ? '北宋' : '近现代',
      eraMeta: isAncient ? '960–1127 · 九帝 · 开封' : '1840–1949 · 晚清 / 民国',
      eraSeal: isAncient ? '宋' : '近'
    });
  },

  goTab(e) {
    const page = e.currentTarget.dataset.page;
    if (!page || page === 'timeline') return;
    wx.redirectTo({
      url: `/pages/${page}/${page}`
    });
  },

  onEvent(e) {
    const id = e.currentTarget.dataset.id;
    const item = history.events.find((event) => event.id === id);
    if (!item) return;
    wx.navigateTo({ url: `/pages/event/event?id=${item.id}` });
  },

  onSearch() {
    wx.showToast({
      title: '搜索将在下一版接入',
      icon: 'none'
    });
  },

  onMenu() {
    wx.showActionSheet({
      itemList: ['古代', '近现代', '世纪', '关于史页'],
      success: (res) => {
        if (res.tapIndex === 0) this.loadMode('ancient');
        if (res.tapIndex === 1) this.loadMode('modern');
        if (res.tapIndex === 3) {
          wx.showModal({
            title: '史页',
            content: '一页一页读历史。古代史与近现代史并列，史料可追溯。',
            showCancel: false
          });
        }
      }
    });
  }
});
