const hd = require('../../utils/historyData.js');
const store = require('../../utils/store.js');
const font = require('../../utils/font.js');
const identity = require('../../utils/identity.js');
const { resolveEntry, fmtWhen } = require('../../utils/entries.js');
const altArt = require('../../utils/eraImages.js').altArt;

Page({
  data: {
    stats: [
      { key: 'periods', label: '朝代', value: 0 },
      { key: 'events', label: '史事', value: 0 },
      { key: 'persons', label: '人物', value: 0 },
      { key: 'topics', label: '专题', value: 0 }
    ],
    favs: [],
    favsShow: [],
    favCount: 0,
    favHasMore: false,
    foots: [],
    footsShow: [],
    footCount: 0,
    footHasMore: false,
    info: { open: false, title: '', paragraphs: [] },
    updating: false,
    fontOptions: font.OPTIONS,
    fontKey: 'm',
    fontClass: 'm',
    identity: { avatar: '/assets/avatar-scholar.png', nick: '史页客', motto: '以千年为卷轴，读万古事' }
  },

  onLoad() {
    this.doStats();
    this.setData({ identity: identity.get() });
  },

  onRerollIdentity() {
    this.setData({ identity: identity.reroll() });
  },

  onShow() {
    this.setTab();
    this.doStats();
    font.apply(this);
    this.setData({ fontKey: store.getFontKey() });
    hd.refresh((changed) => {
      if (changed) this.doStats();
    });
    const favs = store
      .listFavorites()
      .map((x, i) => resolveEntry(x, i))
      .filter(Boolean);
    const foots = store
      .listFootprints()
      .map((x, i) => {
        const entry = resolveEntry(x, i);
        return entry ? { ...entry, when: fmtWhen(x.ts) } : null;
      })
      .filter(Boolean);
    this.setData({
      favs,
      favsShow: favs.slice(0, 3),
      favCount: favs.length,
      favHasMore: favs.length > 3,
      foots,
      footsShow: foots.slice(0, 3),
      footCount: foots.length,
      footHasMore: foots.length > 3
    });
  },

  doStats() {
    const history = hd.get();
    this.setData({
      stats: [
        { key: 'periods', label: '朝代', value: history.periods.length },
        { key: 'events', label: '史事', value: history.events.length },
        { key: 'persons', label: '人物', value: history.persons.length },
        { key: 'topics', label: '专题', value: history.topics.length }
      ]
    });
  },

  setTab() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ active: 'profile' });
    }
  },

  onSearch() {
    wx.navigateTo({ url: '/pages/search/search' });
  },

  onAllFoots() {
    wx.navigateTo({ url: '/pages/footprints/footprints' });
  },

  onAllFavs() {
    wx.navigateTo({ url: '/pages/favorites/favorites' });
  },

  onFontPick(e) {
    const key = e.currentTarget.dataset.key;
    const saved = store.setFontKey(key);
    this.setData({ fontKey: saved, fontClass: saved });
    const opt = font.OPTIONS.find((x) => x.key === saved);
    wx.showToast({ title: `字号：${opt ? opt.label : '标准'}`, icon: 'none' });
  },

  // 检查内容更新：purge jsDelivr 缓存 → 绕过本地缓存强制拉取
  onCheckUpdate() {
    if (this.data.updating) return;
    this.setData({ updating: true });
    wx.showLoading({ title: '检查更新', mask: true });
    hd.refresh((changed, err) => {
      this.setData({ updating: false });
      wx.hideLoading();
      if (err) {
        wx.showToast({ title: '暂无网络，稍后再试', icon: 'none' });
        return;
      }
      if (changed) {
        const meta = hd.get().meta || {};
        this.onShow(); // 重算统计与收藏/足迹解析
        wx.showToast({
          title: meta.builtAt ? `已更新 · ${meta.builtAt}` : '已更新至最新内容',
          icon: 'none',
          duration: 2600
        });
        return;
      }
      wx.showToast({ title: '内容已是最新', icon: 'none' });
    }, { fresh: true });
  },

  closeInfo() {
    this.setData({ 'info.open': false });
  },

  noop() {},

  onEntry(e) {
    const { type, id } = e.currentTarget.dataset;
    const url = type === 'person' ? `/pages/person/person?id=${id}` : `/pages/event/event?id=${id}`;
    const exist = hd.get()[type === 'person' ? 'persons' : 'events'].find((item) => item.id === id);
    if (!exist) return;
    wx.navigateTo({ url });
  },

  // 收藏/足迹行远端专属图加载失败 → 换备用 jsDelivr 域名重试一次
  onRowImgErr(e) {
    const { list, type, id } = e.currentTarget.dataset;
    const rows = this.data[list];
    if (!rows) return;
    const index = rows.findIndex((r) => r.id === id && r.type === type);
    if (index < 0) return;
    const alt = altArt(rows[index].img);
    if (alt) this.setData({ [list + '[' + index + '].img']: alt });
  },

  onFavLongPress(e) {
    const { type, id } = e.currentTarget.dataset;
    if (!store.isFavorite(type, id)) return;
    wx.showModal({
      title: '移出收藏',
      content: '确定将这条内容移出收藏？',
      confirmText: '移出',
      success: (res) => {
        if (!res.confirm) return;
        store.toggleFavorite(type, id);
        this.onShow();
        wx.showToast({ title: '已移出收藏', icon: 'none' });
      }
    });
  },

  // 数据说明 / 素材授权 / 关于 三合一，减少菜单项（2026-10-24 用户要求精简）
  onAbout() {
    this.setData({
      info: {
        open: true,
        title: '关于史页',
        paragraphs: [
          '一页一页读历史。古代史与近现代史并列，史料可追溯。',
          `收录朝代 ${this.data.stats[0].value} · 史事 ${this.data.stats[1].value} · 人物 ${this.data.stats[2].value} · 专题 ${this.data.stats[3].value}。`,
          '素材来源于公开网络，如有侵权请联系我们删除。'
        ]
      }
    });
  },

  onClearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '只清空本地临时缓存；收藏与浏览足迹会一并清除。',
      confirmText: '清除',
      success: (res) => {
        if (!res.confirm) return;
        wx.clearStorageSync();
        this.onShow();
        wx.showToast({ title: '已清除', icon: 'success' });
      }
    });
  }
});
