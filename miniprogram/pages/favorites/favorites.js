const store = require('../../utils/store.js');
const font = require('../../utils/font.js');
const { resolveEntry, groupByType, flattenGroups } = require('../../utils/entries.js');

Page({
  data: {
    favs: [],
    groups: [],
    rows: [],
    favCount: 0,
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
    const favs = store
      .listFavorites()
      .map((x, i) => resolveEntry(x, i))
      .filter(Boolean);
    const groups = groupByType(favs);
    this.setData({ favs, groups, rows: flattenGroups(groups), favCount: favs.length });
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

  onClear() {
    if (!this.data.favCount) return;
    wx.showModal({
      title: '清空收藏',
      content: '将移除全部收藏，是否继续？',
      confirmText: '清空',
      success: (res) => {
        if (!res.confirm) return;
        store.clearFavorites();
        this.load();
        wx.showToast({ title: '已清空收藏', icon: 'none' });
      }
    });
  },

  onShareAppMessage() {
    return {
      title: '我的收藏 · 史页',
      path: '/pages/favorites/favorites'
    };
  }
});
