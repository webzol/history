const history = require('../../data/history.js');

// 朝代卡配图（搜图素材，见 assets/paintings/SOURCES.md）
const PERIOD_META = {
  han: { img: '/assets/paintings/han.jpg', yearText: '前202–公元9', seal: '汉' },
  tang: { img: '/assets/paintings/tang.jpg', yearText: '618–907', seal: '唐' },
  song: { img: '/assets/paintings/song.jpg', yearText: '960–1127', seal: '宋' },
  modern: { img: '/assets/paintings/modern.jpg', yearText: '1840–1949', seal: '近' }
};

Page({
  data: {
    periods: [],
    era: {},
    modern: {},
    picks: []
  },

  onLoad() {
    const periods = history.periods
      .filter((item) => PERIOD_META[item.id])
      .map((item) => ({
        ...item,
        ...PERIOD_META[item.id],
        isModern: item.id === 'modern'
      }));

    this.setData({
      periods,
      era: history.topics.find((item) => item.id === 'tang'),
      modern: history.topics.find((item) => item.id === 'modern-china'),
      picks: history.events.slice(-6).reverse()
    });
  },

  goTab(e) {
    const page = e.currentTarget.dataset.page;
    if (!page || page === 'discover') return;
    wx.redirectTo({ url: `/pages/${page}/${page}` });
  },

  goTimeline(e) {
    const mode = e.currentTarget.dataset.mode || 'ancient';
    wx.redirectTo({ url: `/pages/timeline/timeline?mode=${mode}` });
  },

  onPeriod(e) {
    const id = e.currentTarget.dataset.id;
    const item = history.periods.find((period) => period.id === id);
    if (!item) return;
    wx.showModal({
      title: `${item.name} · ${item.title}`,
      content: `${item.desc}\n\n史料：${item.source}`,
      showCancel: false,
      confirmText: '知道了'
    });
  },

  onPick(e) {
    wx.navigateTo({
      url: `/pages/event/event?id=${e.currentTarget.dataset.id}`
    });
  },

  onSearch() {
    wx.showToast({ title: '搜索将在下一版接入', icon: 'none' });
  },

  onMenu() {
    wx.showActionSheet({
      itemList: ['时间轴', '百年中国', '关于史页'],
      success: (res) => {
        if (res.tapIndex === 0) wx.redirectTo({ url: '/pages/timeline/timeline' });
        if (res.tapIndex === 1) wx.redirectTo({ url: '/pages/timeline/timeline?mode=modern' });
        if (res.tapIndex === 2) {
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
