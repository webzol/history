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

  goTimeband(e) {
    const mode = e.currentTarget.dataset.mode || 'ancient';
    wx.redirectTo({ url: `/pages/timeline/timeline?mode=${mode}` });
  },

  onPeriod(e) {
    const id = e.currentTarget.dataset.id;
    if (!history.periods.find((period) => period.id === id)) return;
    wx.navigateTo({ url: `/pages/period/period?id=${id}` });
  },

  onPick(e) {
    wx.navigateTo({
      url: `/pages/event/event?id=${e.currentTarget.dataset.id}`
    });
  },

  onShareAppMessage() {
    return { title: '史页 · 发现', path: '/pages/discover/discover' };
  }
});
