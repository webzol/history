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
    partial: false,
    stalled: false,
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
    this.totalAll = 0;
    this.haystack = null;
    this.setData({
      loading: true,
      error: '',
      empty: false,
      partial: false,
      stalled: false,
      shown: [],
      total: 0,
      totalText: '0',
      coverMeta: '正在加载'
    });
    // apk.load 会回调两次：先 head 轻量包（partial）渲染首屏，
    // 后台分块补齐后带全量再回调一次（partial=false）。
    apk.load(this.data.kind, this.data.type, (err, items, info) => {
      if (err || !items || !items.length) {
        this.all = [];
        this._gotPartial = false;
        this.setData({
          loading: false,
          error: '资料加载失败，请检查网络后重试',
          empty: false,
          partial: false,
          stalled: false,
          coverMeta: '加载失败'
        });
        return;
      }
      this.all = items;
      this.buildIndex(items);
      this.totalAll = (info && info.total) || items.length;
      const partial = !!(info && info.partial);
      // 首屏 partial 属正常进行中；二次回调仍 partial 说明有分块拉取失败（限流/断网）
      const stalled = partial && this._gotPartial;
      if (partial) this._gotPartial = true;
      else this._gotPartial = false;
      this.setData({ loading: false, error: '', partial, stalled });
      this.applyFilter();
    });
  },

  // 预生成小写检索串：按键过滤零拼串零分配，万级条目（13,287 辞条）也不卡输入
  buildIndex(items) {
    this.haystack = items.map((item) =>
      `${item.title || ''} ${item.meta || ''} ${item.summary || ''}`.toLowerCase()
    );
  },

  applyFilter() {
    const kw = (this.data.keyword || '').trim().toLowerCase();
    // 列表索引只保留标题/分类/摘要；全文不再下载，避免首屏拉整类正文。
    let list;
    if (!kw) {
      list = this.all;
    } else {
      const hay = this.haystack || [];
      const src = this.all;
      list = [];
      for (let i = 0; i < src.length; i++) {
        if ((hay[i] || '').indexOf(kw) >= 0) list.push(src[i]);
      }
    }
    this.filtered = list;
    // 目录总数用 head 包的全量 total；partial 时底部提示完整目录载入中
    const total = this.totalAll || list.length;
    this.setData({
      shown: list.slice(0, this.limit),
      total,
      totalText: fmt(total),
      coverMeta: `${fmt(total)} 条`,
      empty: list.length === 0 && !this.data.partial
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

  // 滚到底自动追加下一批（本地切片，瞬时完成）；加载中/出错/完整目录载入中/已到底不触发
  onReachBottom() {
    if (this.data.loading || this.data.error || this.data.partial) return;
    if (!this.data.total || this.data.shown.length >= this.data.total) return;
    this.onMore();
  },

  retry() {
    this.fetch();
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

  onShareAppMessage() {
    return {
      title: `史页 · ${this.data.pageTitle}`,
      path: `/pages/archive-list/archive-list?kind=${this.data.kind}&type=${encodeURIComponent(this.data.type)}&title=${encodeURIComponent(this.data.pageTitle)}`
    };
  }
});
