const font = require('../../../utils/font.js');
const share = require('../../../utils/share.js');
const { ERAS, TYPES, RELICS, DETAIL_PATH, imagePath, shareMessage } = require('../../catalog.js');

const PAGE_SIZE = 8;
const TYPE_OPTIONS = ['全部', ...TYPES];
const ERA_OPTIONS = ['不限', ...ERAS];

Page({
  data: {
    fontClass: 'm',
    types: TYPE_OPTIONS,
    eras: ERA_OPTIONS,
    typeIndex: 0,
    eraIndex: 0,
    filterSheet: null,
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

  openFilter(e) {
    const kind = e.currentTarget.dataset.kind;
    const isType = kind === 'type';
    this.setData({ filterSheet: {
      kind,
      title: isType ? '选择器类' : '选择时代',
      options: isType ? TYPE_OPTIONS : ERA_OPTIONS,
      selected: isType ? this.data.typeIndex : this.data.eraIndex
    } });
  },

  closeFilter() { this.setData({ filterSheet: null }); },

  onFilterPick(e) {
    const sheet = this.data.filterSheet;
    const index = Number(e.currentTarget.dataset.index);
    if (!sheet || !Number.isInteger(index) || index < 0 || index >= sheet.options.length) return;
    if (index === sheet.selected) return this.closeFilter();
    this.updateFilters(sheet.kind === 'type' ? index : this.data.typeIndex,
      sheet.kind === 'era' ? index : this.data.eraIndex);
  },

  noop() {},

  resetFilters() { this.updateFilters(0, 0); },

  updateFilters(typeIndex, eraIndex) {
    this.matches = RELICS.filter(item => (!typeIndex || item.type === TYPE_OPTIONS[typeIndex])
      && (!eraIndex || item.eras.includes(ERA_OPTIONS[eraIndex])));
    this.setData({ typeIndex, eraIndex, filterSheet: null, count: this.matches.length, ...this.nextRows(0) });
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
    wx.navigateTo({ url: `${DETAIL_PATH}?id=${encodeURIComponent(e.currentTarget.dataset.id)}` });
  },

  goBack() {
    wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/home/home' }) });
  },

  onShareAppMessage() { return shareMessage(); },

  onShareTimeline() {
    const { title, imageUrl } = this.onShareAppMessage();
    return { title, imageUrl };
  }
});
