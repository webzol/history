const font = require('../../utils/font.js');
const apk = require('../../utils/apkData.js');

const fmt = (n) => String(n || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

function safeTitle(value, fallback) {
  if (!value) return fallback;
  try {
    return decodeURIComponent(value);
  } catch (e) {
    return value;
  }
}

Page({
  data: {
    stats: { total: 0, cards: 0, figures: 0, events: 0, categories: 0 },
    categories: [],
    sections: [],
    fontClass: 'm'
  },

  onLoad() {
    font.apply(this);
    const meta = apk.getMeta();
    const stats = {
      ...meta.stats,
      totalText: fmt(meta.stats.total),
      cardsText: fmt(meta.stats.cards),
      figuresText: fmt(meta.stats.figures),
      eventsText: fmt(meta.stats.events)
    };
    this.setData({
      stats,
      categories: (meta.categories || []).map((item) => ({
        ...item,
        countText: fmt(item.count)
      })),
      sections: (meta.sections || []).map((item) => ({
        ...item,
        countText: fmt(item.count)
      }))
    });
  },

  onShow() {
    font.apply(this);
  },

  goBack() {
    wx.navigateBack({ fail: () => wx.redirectTo({ url: '/pages/home/home' }) });
  },

  onCategory(e) {
    const key = e.currentTarget.dataset.key;
    const name = safeTitle(e.currentTarget.dataset.name, '典籍辞条');
    wx.navigateTo({
      url: `/pages/archive-list/archive-list?kind=cards&type=${encodeURIComponent(key)}&title=${encodeURIComponent(name)}`
    });
  },

  onSection(e) {
    const key = e.currentTarget.dataset.key;
    const name = safeTitle(e.currentTarget.dataset.name, '资料库');
    wx.navigateTo({
      url: `/pages/archive-list/archive-list?kind=${encodeURIComponent(key)}&title=${encodeURIComponent(name)}`
    });
  },

  onShareAppMessage() {
    return { title: '史页 · 资料库', path: '/pages/archive/archive' };
  }
});
