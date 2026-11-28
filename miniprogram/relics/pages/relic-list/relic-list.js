const font = require('../../../utils/font.js');
const share = require('../../../utils/share.js');
const relicData = require('../../relicData.js');
const { ERAS, TYPES, ERA_MATCH, DETAIL_PATH, shareMessage } = require('../../catalog.js');

const PAGE_SIZE = 8;
const TYPE_OPTIONS = ['全部', ...TYPES];
const ERA_OPTIONS = ['不限', ...ERAS];

Page({
  data: {
    fontClass: 'm',
    // cate 分类首屏（器类/时代卡片，计数来自 head 预计算，秒开）| grid 分类内文物网格
    mode: 'cate',
    cateTab: 'type',
    cateCards: [],
    gridLabel: '',
    types: TYPE_OPTIONS,
    eras: ERA_OPTIONS,
    typeIndex: 0,
    eraIndex: 0,
    filterSheet: null,
    rows: [],
    count: 0,
    total: 0,
    loadedText: '0',
    totalText: '0',
    partial: false,
    stalled: false,
    hasMore: false,
    indexLoading: true,
    indexFailed: false
  },

  onLoad() {
    share.enableMenu();
    font.apply(this);
    this.all = [];
    this.matches = [];
    this.cateMeta = null;
    this.rendered = false;
    this.loadCatalog();
  },

  onShow() { font.apply(this); },

  // 目录分块加载：head 首屏先出（~19KB），后台补齐 part；每次接上连续前缀都回调。
  loadCatalog() {
    const requestId = (this.requestId || 0) + 1;
    this.requestId = requestId;
    relicData.loadIndex((rows, info) => {
      if (requestId !== this.requestId) return; // 重试后丢弃旧装配的回调
      if (!rows) {
        this.setData({ indexLoading: false, indexFailed: true, filterSheet: null });
        return;
      }
      const start = this.all.length;
      if (rows.length > start) {
        this.all = rows;
        // 分块按序追加，matches 只增不减；筛选变更时 updateFilters 全量重建
        for (let i = start; i < rows.length; i += 1) {
          if (matchesFilter(rows[i], this.data.typeIndex, this.data.eraIndex)) this.matches.push(rows[i]);
        }
      }
      if (!this.cateMeta) this.readMeta(info);
      const total = (info && info.total) || rows.length;
      const patch = {
        indexLoading: false,
        indexFailed: false,
        partial: !!(info && info.partial),
        stalled: !!(info && info.stalled),
        total,
        loadedText: String(rows.length),
        totalText: String(total)
      };
      if (this.data.mode === 'cate') {
        // 分类首屏：head 元数据到位即出卡片（计数/封面精确，不等补齐）；补齐回调不重复建卡
        if (!this.cateBuilt) this.buildCateCards();
        this.setData(patch);
        return;
      }
      patch.count = this.displayCount(this.data.typeIndex, this.data.eraIndex);
      patch.hasMore = this.data.rows.length < this.matches.length;
      if (!this.rendered) {
        this.rendered = true;
        const { patch: rowPatch } = this.appendRows(0);
        this.setData(Object.assign(patch, rowPatch));
        return;
      }
      // 分块补齐：首屏未满先补（如晚出分类先于所在分块到达），否则只刷新计数/进度，
      // 不动已渲染行（滚动位置不跳，下滑续载取自 matches）
      if (this.data.rows.length < PAGE_SIZE && this.matches.length > this.data.rows.length) {
        const { patch: rowPatch, hasMore } = this.appendRows(this.data.rows.length);
        patch.hasMore = hasMore;
        this.setData(Object.assign(patch, rowPatch));
        return;
      }
      this.setData(patch);
    });
  },

  // 分类元数据：head 带（精确，部分索引可用）或完整行集计算（全量缓存命中路径）
  readMeta(info) {
    const h = info && info.head;
    if (h && h.typeCounts && h.typeCovers) {
      this.cateMeta = {
        types: h.types, eras: h.eras,
        typeCounts: h.typeCounts, eraCounts: h.eraCounts,
        typeCovers: h.typeCovers, eraCovers: h.eraCovers, joint: h.joint
      };
    } else if (this.all.length && (!info || !info.partial)) {
      this.cateMeta = relicData.cateMetaFromRows(this.all);
    }
  },

  buildCateCards() {
    const meta = this.cateMeta;
    if (!meta) return;
    this.cateBuilt = true;
    const byType = this.data.cateTab === 'type';
    const names = byType ? meta.types : meta.eras;
    const counts = byType ? meta.typeCounts : meta.eraCounts;
    const covers = byType ? meta.typeCovers : meta.eraCovers;
    this.setData({
      cateCards: (names || []).map((name) => ({
        key: (byType ? 't-' : 'e-') + name,
        name,
        count: counts[name] || 0,
        thumb: covers[name] ? relicData.thumbFor(covers[name]) : ''
      }))
    });
  },

  switchCateTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (!tab || tab === this.data.cateTab) return;
    this.setData({ cateTab: tab });
    this.buildCateCards();
  },

  // 分类封面 CDN 失败换备用域一次
  onCateThumbError(e) {
    const i = e.currentTarget.dataset.index;
    const card = this.data.cateCards[i];
    const alt = relicData.thumbAlt(card && card.thumb);
    if (alt) this.setData({ [`cateCards[${i}].thumb`]: alt });
  },

  // 分类卡进入网格：设置对应维度，另一维清零
  openCategory(e) {
    const kind = e.currentTarget.dataset.kind;
    const index = Number(e.currentTarget.dataset.index);
    if (!Number.isInteger(index) || index < 0) return;
    this.enterGrid(kind === 'type' ? index + 1 : 0, kind === 'era' ? index + 1 : 0);
  },

  enterGrid(typeIndex, eraIndex) {
    this.matches = this.all.filter(item => matchesFilter(item, typeIndex, eraIndex));
    const { patch, hasMore } = this.appendRows(0);
    this.rendered = true;
    this.setData({
      mode: 'grid',
      typeIndex,
      eraIndex,
      gridLabel: gridLabel(typeIndex, eraIndex),
      filterSheet: null,
      count: this.displayCount(typeIndex, eraIndex),
      hasMore,
      indexLoading: false,
      indexFailed: false,
      ...patch
    });
  },

  backToCate() {
    this.setData({ mode: 'cate', typeIndex: 0, eraIndex: 0, gridLabel: '', filterSheet: null });
    this.buildCateCards(); // 元数据晚到时补建
  },

  retryIndex() {
    if (this.data.indexLoading) return;
    this.setData({ indexLoading: true, indexFailed: false, stalled: false });
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
    const typeIndex = sheet.kind === 'type' ? index : this.data.typeIndex;
    const eraIndex = sheet.kind === 'era' ? index : this.data.eraIndex;
    if (!typeIndex && !eraIndex) return this.backToCate(); // 两维都清空 → 回分类首屏
    this.updateFilters(typeIndex, eraIndex);
  },

  noop() {},

  // 空态「返回分类」：两维清空回首屏
  resetFilters() { this.backToCate(); },

  updateFilters(typeIndex, eraIndex) {
    this.matches = this.all.filter(item => matchesFilter(item, typeIndex, eraIndex));
    const { patch, hasMore } = this.appendRows(0);
    this.setData({ typeIndex, eraIndex, filterSheet: null, gridLabel: gridLabel(typeIndex, eraIndex),
      count: this.displayCount(typeIndex, eraIndex), hasMore,
      indexLoading: false, indexFailed: false, ...patch });
  },

  // 网格计数：部分索引时用 head 预计数的精确值（该类条目可能还没载入，实际匹配数会虚小），
  // 补齐后 matches 即精确值
  displayCount(typeIndex, eraIndex) {
    if (!this.data.partial) return this.matches.length;
    const meta = this.cateMeta;
    if (!meta) return this.matches.length;
    if (typeIndex && eraIndex) {
      const row = meta.joint && meta.joint[TYPES[typeIndex - 1]];
      return (row && row[ERAS[eraIndex - 1]]) || 0;
    }
    if (typeIndex) return (meta.typeCounts && meta.typeCounts[TYPES[typeIndex - 1]]) || 0;
    if (eraIndex) return (meta.eraCounts && meta.eraCounts[ERAS[eraIndex - 1]]) || 0;
    return this.matches.length;
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

// 时代筛选：索引行存显示期名（北宋/金/南朝…），按别名归组到 13 个筛选时代（共用 catalog.ERA_MATCH）
function matchesFilter(item, typeIndex, eraIndex) {
  if (typeIndex && item.type !== TYPE_OPTIONS[typeIndex]) return false;
  if (!eraIndex) return true;
  const aliases = ERA_MATCH[ERA_OPTIONS[eraIndex]];
  return !!aliases && aliases.some((alias) => item.period.indexOf(alias) >= 0);
}

function gridLabel(typeIndex, eraIndex) {
  const parts = [];
  if (typeIndex) parts.push(TYPE_OPTIONS[typeIndex]);
  if (eraIndex) parts.push(ERA_OPTIONS[eraIndex]);
  return parts.join(' · ');
}
