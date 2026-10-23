const hd = require('../../utils/historyData.js');
const store = require('../../utils/store.js');
const font = require('../../utils/font.js');
const apk = require('../../utils/apkData.js');

const fmt = (n) => String(n || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// 朝代卡配图（搜图素材，见 assets/paintings/SOURCES.md）
const PERIOD_META = {
  han: { img: '/assets/paintings/han.jpg', yearText: '前202–公元9', seal: '汉' },
  tang: { img: '/assets/paintings/tang.jpg', yearText: '618–907', seal: '唐' },
  song: { img: '/assets/paintings/song.jpg', yearText: '960–1127', seal: '宋' },
  ming: { img: '/assets/paintings/ming.jpg', yearText: '1368–1644', seal: '明' },
  qing: { img: '/assets/paintings/qing.jpg', yearText: '1644–1912', seal: '清' },
  modern: { img: '/assets/paintings/modern.jpg', yearText: '1840–1949', seal: '近' }
};

Page({
  data: {
    periods: [],
    era: {},
    modern: {},
    picks: [],
    archive: {},
    fontClass: 'm'
  },

  onLoad() {
    font.apply(this);
    this.build();
  },

  onShow() {
    this.setTab();
    font.apply(this);
    hd.refresh((changed) => {
      if (changed) this.build();
    });
  },

  build() {
    const history = hd.get();
    const meta = apk.getMeta();
    const archive = {
      totalText: fmt(meta.stats.total),
      cardsText: fmt(meta.stats.cards),
      figuresText: fmt(meta.stats.figures),
      eventsText: fmt(meta.stats.events)
    };
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
      picks: history.events.slice(-6).reverse(),
      archive
    });
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
    if (!hd.get().periods.find((period) => period.id === id)) return;
    wx.navigateTo({ url: `/pages/period/period?id=${id}` });
  },

  onPick(e) {
    wx.navigateTo({
      url: `/pages/event/event?id=${e.currentTarget.dataset.id}`
    });
  },

  goArchive() {
    wx.navigateTo({ url: '/pages/archive/archive' });
  },

  onShareAppMessage() {
    return { title: '史页 · 发现', path: '/pages/discover/discover' };
  }
});
