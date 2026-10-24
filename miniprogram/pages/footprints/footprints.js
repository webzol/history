const store = require('../../utils/store.js');
const font = require('../../utils/font.js');
const altArt = require('../../utils/eraImages.js').altArt;
const { resolveEntry, fmtWhen, groupByType, flattenGroups } = require('../../utils/entries.js');

Page({
  data: {
    foots: [],
    groups: [],
    rows: [],
    footCount: 0,
    fontClass: 'm'
  },

  onLoad() {
    font.apply(this);
  },

  onShow() {
    font.apply(this);
    this.load();
  },

  load() {
    const foots = store
      .listFootprints()
      .map((x, i) => {
        const entry = resolveEntry(x, i);
        return entry ? { ...entry, when: fmtWhen(x.ts) } : null;
      })
      .filter(Boolean);
    const groups = groupByType(foots);
    this.setData({ foots, groups, rows: flattenGroups(groups), footCount: foots.length });
  },

  goBack() {
    wx.navigateBack({
      fail: () => wx.redirectTo({ url: '/pages/profile/profile' })
    });
  },

  onEntry(e) {
    const { type, id } = e.currentTarget.dataset;
    const url = type === 'person' ? `/pages/person/person?id=${id}` : `/pages/event/event?id=${id}`;
    wx.navigateTo({ url });
  },

  // 远端专属图加载失败 → 换备用 jsDelivr 域名重试一次
  onRowImgErr(e) {
    const { type, id } = e.currentTarget.dataset;
    const index = this.data.rows.findIndex((r) => r.kind === 'item' && r.id === id && r.type === type);
    if (index < 0) return;
    const alt = altArt(this.data.rows[index].img);
    if (alt) this.setData({ ['rows[' + index + '].img']: alt });
  },

  onClear() {
    if (!this.data.footCount) return;
    wx.showModal({
      title: '清空足迹',
      content: '将移除全部浏览足迹，是否继续？',
      confirmText: '清空',
      success: (res) => {
        if (!res.confirm) return;
        store.clearFootprints();
        this.load();
        wx.showToast({ title: '已清空足迹', icon: 'none' });
      }
    });
  },

  onShareAppMessage() {
    return {
      title: '我的浏览足迹 · 史页',
      path: '/pages/footprints/footprints'
    };
  }
});
