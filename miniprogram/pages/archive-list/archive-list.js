const font = require('../../utils/font.js');
const apk = require('../../utils/apkData.js');
const archiveImages = require('../../utils/archiveImages.js');
const { nextArt } = require('../../utils/eraImages.js');

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

const share = require('../../utils/share.js');

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
    resultCount: 0,
    loadedText: '0',
    loading: true,
    partial: false,
    stalled: false,
    error: '',
    empty: false,
    fontClass: 'm'
  },

  onLoad(options) {
    share.enableMenu();
    font.apply(this);
    const opts = options || {};
    const kind = opts.kind || 'figures';
    const type = opts.type || '';
    const title = safeTitle(opts.title, this.fallbackTitle(kind, type));
    const isPoem = kind.indexOf('poems-') === 0;
    const searchPlaceholder = isPoem ? '搜索篇名 / 作者 / 朝代' : `在${title}中搜索`;
    this.limit = PAGE_SIZE;
    this.all = [];
    this.haystack = [];
    this.filtered = [];
    this.setData({
      kind,
      type,
      pageTitle: title,
      searchPlaceholder,
      cover: archiveImages.cover(kind, type),
      keyword: '',
      shown: [],
      resultCount: 0,
      partial: false,
      empty: false,
      coverMeta: '正在加载'
    });
    this.fetch();
  },

  onShow() {
    font.apply(this);
  },

  onUnload() {
    this.requestId += 1;
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
    const requestId = (this.requestId || 0) + 1;
    this.requestId = requestId;
    this.setData({ loading: !this.data.partial, error: '', stalled: false });
    apk.load(this.data.kind, this.data.type, (err, items, info) => {
      if (requestId !== this.requestId) return;
      if (err) {
        this.setData({
          loading: false,
          error: '资料加载失败，请检查网络后重试',
          coverMeta: '加载失败'
        });
        return;
      }
      const start = this.all.length;
      if (items.length > start) {
        this.all = items;
        this.buildIndex(items, start);
        this.filterItems(this.data.keyword, start);
      }
      const total = info.total || items.length;
      const totalText = fmt(total);
      this.updateShown({
        loading: false,
        error: '',
        partial: info.partial,
        stalled: !!info.stalled,
        loadedText: fmt(this.all.length),
        total,
        totalText,
        coverMeta: `${totalText} 条`,
        empty: this.filtered.length === 0 && !info.partial
      });
    });
  },

  // 分块补齐时只处理追加的条目；关键字变化时复用已有检索串。
  buildIndex(items, start) {
    for (let i = start; i < items.length; i += 1) {
      const { title, meta, summary } = items[i];
      this.haystack.push(`${title || ''} ${meta || ''} ${summary || ''}`.toLowerCase());
    }
  },

  filterItems(keyword, start) {
    const kw = keyword.trim().toLowerCase();
    for (let i = start; i < this.all.length; i += 1) {
      if (!kw || this.haystack[i].includes(kw)) this.filtered.push(this.all[i]);
    }
  },

  updateShown(patch, replace = false) {
    const count = Math.min(this.limit, this.filtered.length);
    if (replace || (!this.data.shown.length && count)) {
      patch.shown = this.filtered.slice(0, count);
    } else {
      for (let i = this.data.shown.length; i < count; i += 1) {
        patch[`shown[${i}]`] = this.filtered[i];
      }
    }
    if (this.data.resultCount !== this.filtered.length) patch.resultCount = this.filtered.length;
    if (Object.keys(patch).length) this.setData(patch);
  },

  applyFilter(keyword) {
    this.limit = PAGE_SIZE;
    this.filtered = [];
    this.filterItems(keyword, 0);
    this.updateShown({
      keyword,
      empty: this.filtered.length === 0 && !this.data.partial && !this.data.loading && !this.data.error
    }, true);
  },

  onInput(e) {
    this.applyFilter((e.detail && e.detail.value) || '');
  },

  clearKeyword() {
    this.applyFilter('');
  },

  onMore() {
    if (this.data.loading || this.data.error || this.data.shown.length >= this.filtered.length) return;
    this.limit += PAGE_SIZE;
    this.updateShown({});
  },

  onReachBottom() {
    this.onMore();
  },

  retry() {
    if (this.data.stalled || this.data.error) this.fetch();
  },

  onItem(e) {
    const id = e.currentTarget.dataset.id;
    const shard = e.currentTarget.dataset.shard || '';
    const type = this.data.kind.indexOf('poems-') === 0 ? shard : this.data.type;
    // 转场期间提前拉详情分卷（~50–320KB），详情页命中缓存秒开
    apk.prefetchShard(this.data.kind, this.data.type, shard);
    wx.navigateTo({
      url: `/pages/archive-detail/archive-detail?kind=${this.data.kind}&type=${encodeURIComponent(type)}&shard=${encodeURIComponent(shard)}&title=${encodeURIComponent(this.data.pageTitle)}&id=${encodeURIComponent(id)}`
    });
  },

  goBack() {
    wx.navigateBack({ fail: () => wx.redirectTo({ url: '/pages/archive/archive' }) });
  },

  onCoverErr() {
    const src = nextArt(this.data.cover);
    if (src) this.setData({ cover: src });
  },

  onShareAppMessage() {
    return {
      title: `阅史记 · ${this.data.pageTitle}`,
      path: `/pages/archive-list/archive-list?kind=${this.data.kind}&type=${encodeURIComponent(this.data.type)}&title=${encodeURIComponent(this.data.pageTitle)}`
    };
  },

  onShareTimeline() {
    return share.timeline(this.onShareAppMessage(), this.data.cover);
  }
});
