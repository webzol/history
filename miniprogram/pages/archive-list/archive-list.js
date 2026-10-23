const font = require('../../utils/font.js');
const apk = require('../../utils/apkData.js');
const archiveImages = require('../../utils/archiveImages.js');

const PAGE_SIZE = 60;
const fmt = (n) => String(n || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

function safeTitle(value, fallback) {
  if (!value) return fallback;
  try {
    const text = decodeURIComponent(value);
    return text || fallback;
  } catch (e) {
    return value;
  }
}

Page({
  data: {
    pageTitle: '资料库',
    cover: '/assets/palace.jpg',
    coverMeta: '正在加载',
    kind: '',
    type: '',
    keyword: '',
    searchPlaceholder: '搜索资料',
    shown: [],
    total: 0,
    totalText: '0',
    loading: true,
    error: '',
    empty: false,
    fontClass: 'm'
  },

  onLoad(options) {
    font.apply(this);
    const opts = options || {};
    const kind = opts.kind || 'figures';
    const type = opts.type || '';
    const title = safeTitle(opts.title, this.fallbackTitle(kind, type));
    const isPoem = kind.indexOf('poems-') === 0;
    const searchPlaceholder = isPoem ? '搜索篇名 / 作者 / 朝代' : `在${title}中搜索`;
    this.limit = PAGE_SIZE;
    this.all = [];
    this.setData({
      kind,
      type,
      pageTitle: title,
      searchPlaceholder,
      cover: archiveImages.cover(kind, type),
      coverMeta: '正在加载',
      loading: true,
      error: ''
    });
    this.fetch();
  },

  onShow() {
    font.apply(this);
  },

  fallbackTitle(kind, type) {
    const meta = apk.getMeta();
    if (kind === 'cards') {
      const cat = (meta.categories || []).find((x) => x.key === type);
      return cat ? cat.name : '典籍辞条';
    }
    const section = (meta.sections || []).find((x) => x.key === kind);
    return section ? section.name : '资料库';
  },

  fetch() {
    this.setData({
      loading: true,
      error: '',
      empty: false,
      shown: [],
      total: 0,
      totalText: '0',
      coverMeta: '正在加载'
    });
    apk.load(this.data.kind, this.data.type, (err, items) => {
      if (err) {
        this.all = [];
        this.setData({
          loading: false,
          error: '资料加载失败，请检查网络后重试',
          empty: false,
          coverMeta: '加载失败'
        });
        return;
      }
      this.all = items;
      this.limit = PAGE_SIZE;
      this.setData({ loading: false, error: '' });
      this.applyFilter();
    });
  },

  applyFilter() {
    const kw = (this.data.keyword || '').trim().toLowerCase();
    const list = kw
      ? this.all.filter((item) =>
          `${item.title || ''} ${item.meta || ''} ${item.summary || ''} ${item.text || ''}`
            .toLowerCase()
            .indexOf(kw) >= 0
        )
      : this.all;
    this.filtered = list;
    this.setData({
      shown: list.slice(0, this.limit),
      total: list.length,
      totalText: fmt(list.length),
      coverMeta: `${fmt(list.length)} 条`,
      empty: list.length === 0
    });
  },

  onInput(e) {
    this.limit = PAGE_SIZE;
    this.setData({ keyword: (e.detail && e.detail.value) || '' });
    this.applyFilter();
  },

  clearKeyword() {
    this.limit = PAGE_SIZE;
    this.setData({ keyword: '' });
    this.applyFilter();
  },

  onMore() {
    this.limit += PAGE_SIZE;
    this.setData({ shown: (this.filtered || []).slice(0, this.limit) });
  },

  retry() {
    this.fetch();
  },

  onItem(e) {
    const id = e.currentTarget.dataset.id;
    const shard = e.currentTarget.dataset.shard || '';
    const type = this.data.kind.indexOf('poems-') === 0 ? shard : this.data.type;
    wx.navigateTo({
      url: `/pages/archive-detail/archive-detail?kind=${this.data.kind}&type=${encodeURIComponent(type)}&title=${encodeURIComponent(this.data.pageTitle)}&id=${encodeURIComponent(id)}`
    });
  },

  goBack() {
    wx.navigateBack({ fail: () => wx.redirectTo({ url: '/pages/archive/archive' }) });
  },

  onShareAppMessage() {
    return {
      title: `史页 · ${this.data.pageTitle}`,
      path: `/pages/archive-list/archive-list?kind=${this.data.kind}&type=${encodeURIComponent(this.data.type)}&title=${encodeURIComponent(this.data.pageTitle)}`
    };
  }
});
