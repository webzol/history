const hd = require('../../utils/historyData.js');
const store = require('../../utils/store.js');
const font = require('../../utils/font.js');
const PAGE_SIZE = 24;

Page({
  data: {
    mode: 'ancient',
    eraName: '',
    eraRange: '',
    eraList: [],
    eraCount: 0,
    groups: [],
    hasMore: false,
    fontClass: 'm'
  },

  onLoad(options) {
    font.apply(this);
    const mode = options && options.mode === 'modern' ? 'modern' : 'ancient';
    this.loadMode(mode);
  },

  onShow() {
    this.setTab();
    font.apply(this);
    // 专题长卷/朝代页等先经 switchTab 交接的 mode 参数
    const pending = store.popPendingTimelineMode();
    if (pending && pending !== this.data.mode) this.loadMode(pending);
    hd.refresh((changed) => {
      if (changed) this.loadMode(this.data.mode);
    });
  },

  setTab() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ active: 'timeline' });
    }
  },

  switchMode(e) {
    const mode = e.currentTarget.dataset.mode;
    if (!mode || mode === this.data.mode) return;
    this.loadMode(mode);
  },

  loadMode(mode) {
    const history = hd.get();
    // 纪年升序；时代带先在全量数据上推导，行卡再瘦身
    const sorted = history.events
      .filter((item) => item.mode === mode)
      .sort((a, b) => a.year - b.year);

    // 时代带全部由事件数据推导：涵盖的时期名 + 纪年区间
    const eras = [];
    sorted.forEach((event) => {
      if (eras.indexOf(event.era) < 0) eras.push(event.era);
    });
    const eraName = eras.length > 1 ? `${eras[0]}—${eras[eras.length - 1]}` : eras[0] || '';
    const fmt = (item) => (item.year < 0 ? `公元前${-item.year}` : item.year);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const eraRange = first && last ? `${fmt(first)}—${fmt(last)}` : '';

    // 行卡只取展示字段：details 正文留在逻辑层，
    // 避免 100 条事件整段正文随 setData 跨 JS↔native 桥序列化（year 供排序断言）
    const events = sorted.map((item, index) => ({
      id: item.id,
      year: item.year,
      yearText: item.yearText,
      title: item.title,
      desc: item.desc,
      tags: item.tags,
      source: item.source,
      dotClass: index % 2 === 0 ? 'dot-red' : 'dot-teal',
      // 公元前的纪年用朱砂显示
      yearAncientText: item.year < 0
    }));

    const visibleGroups = mode === this.data.mode ? Math.max(1, this.data.groups.length) : 1;
    this.eventGroups = [];
    for (let start = 0; start < events.length; start += PAGE_SIZE) {
      this.eventGroups.push({ start, items: events.slice(start, start + PAGE_SIZE) });
    }
    this.setData({
      mode,
      groups: this.eventGroups.slice(0, visibleGroups),
      hasMore: this.eventGroups.length > visibleGroups,
      eraName,
      eraRange,
      eraList: eras,
      eraCount: eras.length
    });
  },

  onReachBottom() {
    this.onMore();
  },

  onMore() {
    if (!this.data.hasMore) return;
    const index = this.data.groups.length;
    this.setData({
      [`groups[${index}]`]: this.eventGroups[index],
      hasMore: index + 1 < this.eventGroups.length
    });
  },

  onEvent(e) {
    const id = e.currentTarget.dataset.id;
    const item = hd.get().events.find((event) => event.id === id);
    if (!item) return;
    wx.navigateTo({ url: `/pages/event/event?id=${item.id}` });
  },

  onShareAppMessage() {
    return { title: '阅史记 · 时间轴上的中国', path: '/pages/timeline/timeline' };
  }
});
