const history = require('../../data/history.js');
const store = require('../../utils/store.js');

const MODERN_ERAS = ['晚清', '民国', '新中国', '近现代', '现代'];

// type+id → 展示条目（人物/事件）
function resolveEntry(x) {
  if (x.type === 'person') {
    const p = history.persons.find((item) => item.id === x.id);
    if (!p) return null;
    return {
      type: 'person',
      id: p.id,
      title: p.name,
      sub: `${p.era} · ${p.roles}`,
      modern: MODERN_ERAS.indexOf(p.era) >= 0
    };
  }
  if (x.type === 'event') {
    const ev = history.events.find((item) => item.id === x.id);
    if (!ev) return null;
    return {
      type: 'event',
      id: ev.id,
      title: ev.title,
      sub: `${ev.yearText} · ${ev.era}`,
      modern: ev.mode === 'modern'
    };
  }
  return null;
}

function fmtWhen(ts) {
  const d = new Date(ts);
  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

Page({
  data: {
    stats: [
      { key: 'periods', label: '朝代', value: 0 },
      { key: 'events', label: '史事', value: 0 },
      { key: 'persons', label: '人物', value: 0 },
      { key: 'topics', label: '专题', value: 0 }
    ],
    favs: [],
    favCount: 0,
    foots: [],
    footCount: 0
  },

  onLoad() {
    this.setData({
      stats: [
        { key: 'periods', label: '朝代', value: history.periods.length },
        { key: 'events', label: '史事', value: history.events.length },
        { key: 'persons', label: '人物', value: history.persons.length },
        { key: 'topics', label: '专题', value: history.topics.length }
      ]
    });
  },

  onShow() {
    this.setTab();
    const favs = store
      .listFavorites()
      .map(resolveEntry)
      .filter(Boolean);
    const foots = store
      .listFootprints()
      .map((x) => {
        const entry = resolveEntry(x);
        return entry ? { ...entry, when: fmtWhen(x.ts) } : null;
      })
      .filter(Boolean);
    this.setData({ favs, favCount: favs.length, foots, footCount: foots.length });
  },

  setTab() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ active: 'profile' });
    }
  },

  onSearch() {
    wx.navigateTo({ url: '/pages/search/search' });
  },

  onEntry(e) {
    const { type, id } = e.currentTarget.dataset;
    const url = type === 'person' ? `/pages/person/person?id=${id}` : `/pages/event/event?id=${id}`;
    const exist = history[type === 'person' ? 'persons' : 'events'].find((item) => item.id === id);
    if (!exist) return;
    wx.navigateTo({ url });
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

  onDataNote() {
    wx.showModal({
      title: '数据与史料说明',
      content: [
        '当前内容为本地真实史料种子：',
        `朝代 ${this.data.stats[0].value} 条、史事 ${this.data.stats[1].value} 条、人物 ${this.data.stats[2].value} 条、专题 ${this.data.stats[3].value} 条。`,
        '每条均附史料出处索引；正式发布前会逐条完成历史审校。'
      ].join('\n'),
      showCancel: false,
      confirmText: '知道了'
    });
  },

  onAssetNote() {
    wx.showModal({
      title: '素材与授权说明',
      content: '插画与文物图片来自公开网络搜索与参考图裁切，仅用于原型演示；正式上线前将替换为有授权的来源。明细见工程 assets/paintings/SOURCES.md。',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  onAbout() {
    wx.showModal({
      title: '史页',
      content: '一页一页读历史。古代史与近现代史并列，史料可追溯。',
      showCancel: false
    });
  },

  onAboutBanner() {
    wx.showModal({
      title: '千古长卷',
      content: '王希孟《千里江山图》卷（局部），现藏故宫博物院。十八岁完成此卷，青绿千年不褪。',
      showCancel: false,
      confirmText: '知道了'
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
