const history = require('../../data/history.js');
const store = require('../../utils/store.js');

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

  onShow() {
    this.setTab();
  },

  setTab() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ active: 'discover' });
    }
  },

  goTimeline(e) {
    const mode = e.currentTarget.dataset.mode || 'ancient';
    store.setPendingTimelineMode(mode);
    wx.switchTab({ url: '/pages/timeline/timeline' });
  },

  goTimeband(e) {
    const mode = e.currentTarget.dataset.mode || 'ancient';
    store.setPendingTimelineMode(mode);
    wx.switchTab({ url: '/pages/timeline/timeline' });
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
