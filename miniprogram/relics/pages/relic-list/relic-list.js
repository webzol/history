const font = require('../../../utils/font.js');
const share = require('../../../utils/share.js');
const relicData = require('../../relicData.js');
const { ERAS, TYPES, DETAIL_PATH, shareMessage } = require('../../catalog.js');

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
    hasMore: false,
    indexLoading: true,
    indexFailed: false
  },

  onLoad() {
    share.enableMenu();
    font.apply(this);
    this.all = [];
    this.loadCatalog();
  },

  onShow() { font.apply(this); },

  // 全量索引（约 2,300 行，gzip 后约数十 KB）：内存/7 天缓存 → jsDelivr 双域
  loadCatalog() {
    relicData.loadIndex((rows) => {
      if (!rows) {
        this.setData({ indexLoading: false, indexFailed: true, filterSheet: null });
        return;
      }
      this.all = rows;
      this.updateFilters(this.data.typeIndex, this.data.eraIndex);
    });
  },

  retryIndex() {
    if (this.data.indexLoading) return;
    this.setData({ indexLoading: true, indexFailed: false });
    this.loadCatalog();
  },

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
    this.matches = this.all.filter(item => (!typeIndex || item.type === TYPE_OPTIONS[typeIndex])
      && (!eraIndex || matchesEra(item, ERA_OPTIONS[eraIndex])));
    const { patch, hasMore } = this.appendRows(0);
    this.setData({ typeIndex, eraIndex, filterSheet: null, count: this.matches.length,
      hasMore, indexLoading: false, indexFailed: false, ...patch });
  },

  // 每屏只映射展示字段；续载按 rows[offset+i] 逐项路径追加（ setData 单键数组
  // 只会整组塞进一个下标），不发已渲染过的行
  appendRows(offset) {
    const batch = this.matches.slice(offset, offset + PAGE_SIZE).map(row => ({
      id: row.id, title: row.title, period: row.period, type: row.type,
      thumb: relicData.thumbFor(row.id)
    }));
    const patch = {};
    if (offset) batch.forEach((row, i) => { patch[`rows[${offset + i}]`] = row; });
    else patch.rows = batch;
    return { patch, hasMore: offset + batch.length < this.matches.length };
  },

  // CDN 缩略图失败换备用域一次
  onThumbError(e) {
    const i = e.currentTarget.dataset.index;
    const row = this.data.rows[i];
    const alt = relicData.thumbAlt(row && row.thumb);
    if (alt) this.setData({ [`rows[${i}].thumb`]: alt });
  },

  loadMore() {
    if (this.data.hasMore) {
      const { patch, hasMore } = this.appendRows(this.data.rows.length);
      this.setData({ hasMore, ...patch });
    }
  },

  // 触底自动续载一屏，避免一次渲染全部行卡；「加载更多」按钮保留作兜底
  onReachBottom() { this.loadMore(); },

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

// 时代筛选：索引行存显示期名（北宋/金/南朝…），按别名归组到 13 个筛选时代
function matchesEra(item, era) {
  const aliases = ERA_MATCH[era];
  return !!aliases && aliases.some((alias) => item.period.indexOf(alias) >= 0);
}
const ERA_MATCH = {
  '新石器时代': ['新石器时代'],
  '二里头文化': ['二里头文化'],
  '商': ['商'],
  '西周': ['西周'],
  '东周': ['东周', '春秋', '战国'],
  '汉': ['汉', '秦'],
  '魏晋南北朝': ['魏晋南北朝', '三国', '晋', '南朝', '北朝', '六朝', '隋'],
  '唐': ['唐'],
  '五代': ['五代'],
  '宋': ['宋', '辽', '金', '西夏'],
  '元': ['元'],
  '明': ['明'],
  '清': ['清']
};
