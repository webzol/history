const hd = require('../../utils/historyData.js');
const store = require('../../utils/store.js');

Page({
  data: {
    mode: 'ancient',
    eraName: '',
    eraMeta: '',
    events: []
  },

  onLoad(options) {
    const mode = options && options.mode === 'modern' ? 'modern' : 'ancient';
    this.loadMode(mode);
  },

  onShow() {
    this.setTab();
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
    // 纪年升序；轴上圆点红/青相间
    const events = history.events
      .filter((item) => item.mode === mode)
      .sort((a, b) => a.year - b.year)
      .map((item, index) => ({
        ...item,
        dotClass: index % 2 === 0 ? 'dot-red' : 'dot-teal',
        // 公元前的纪年用朱砂显示
        yearAncientText: item.year < 0
      }));

    // 时代带全部由事件数据推导：涵盖的时期名 + 纪年区间
    const eras = [];
    events.forEach((event) => {
      if (eras.indexOf(event.era) < 0) eras.push(event.era);
    });
    const years = events.map((event) => event.year);
    const eraName = eras.length > 1 ? `${eras[0]}—${eras[eras.length - 1]}` : eras[0] || '';
    const first = events[0];
    const last = events[events.length - 1];
    const fmt = (item) => (item.year < 0 ? `公元前${-item.year}` : item.year);
    const eraMeta = `${first ? fmt(first) : ''}–${last ? fmt(last) : ''} · ${eras.join(' / ')}`;

    this.setData({
      mode,
      events,
      eraName,
      eraMeta
    });
  },

  onEvent(e) {
    const id = e.currentTarget.dataset.id;
    const item = hd.get().events.find((event) => event.id === id);
    if (!item) return;
    wx.navigateTo({ url: `/pages/event/event?id=${item.id}` });
  },

  onShareAppMessage() {
    return { title: '史页 · 时间轴上的中国', path: '/pages/timeline/timeline' };
  }
});
