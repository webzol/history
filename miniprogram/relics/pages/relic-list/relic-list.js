const font = require('../../../utils/font.js');
const share = require('../../../utils/share.js');
const { ERAS, TYPES, RELICS, imagePath } = require('../../catalog.js');

const PAGE_SIZE = 8;
const LIST_PATH = '/relics/pages/relic-list/relic-list';
const TYPE_OPTIONS = ['全部', ...TYPES];
const ERA_OPTIONS = ['不限', ...ERAS];

Page({
  data: {
    fontClass: 'm',
    types: TYPE_OPTIONS,
    eras: ERA_OPTIONS,
    typeIndex: 0,
    eraIndex: 0,
    rows: [],
    count: 0,
    hasMore: false
  },

  onLoad() {
    share.enableMenu();
    font.apply(this);
    this.updateFilters(0, 0);
  },

  onShow() { font.apply(this); },

  onType(e) { this.updateFilters(Number(e.detail.value), this.data.eraIndex); },

  onEra(e) { this.updateFilters(this.data.typeIndex, Number(e.detail.value)); },

  resetFilters() { this.updateFilters(0, 0); },

  updateFilters(typeIndex, eraIndex) {
    this.matches = RELICS.filter(item => (!typeIndex || item.type === TYPE_OPTIONS[typeIndex])
      && (!eraIndex || item.eras.includes(ERA_OPTIONS[eraIndex])));
    this.setData({ typeIndex, eraIndex, count: this.matches.length, ...this.nextRows(0) });
  },

  nextRows(offset) {
    const batch = this.matches.slice(offset, offset + PAGE_SIZE).map(({ id, title, period, shortPeriod, type }) => ({
      id, title, period: shortPeriod || period, type, thumb: imagePath(id, 'thumb')
    }));
    return { rows: offset ? this.data.rows.concat(batch) : batch, hasMore: offset + batch.length < this.matches.length };
  },

  loadMore() {
    if (this.data.hasMore) this.setData(this.nextRows(this.data.rows.length));
  },

  openRelic(e) {
    wx.navigateTo({ url: `/relics/pages/relic-detail/relic-detail?id=${encodeURIComponent(e.currentTarget.dataset.id)}` });
  },

  goBack() {
    wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/home/home' }) });
  },

  onShareAppMessage() { return { title: '阅史记 · 文物', path: LIST_PATH, imageUrl: '/assets/relic-home-ink.png' }; },

  onShareTimeline() { return { title: '阅史记 · 文物', imageUrl: '/assets/relic-home-ink.png' }; }
});
