const font = require('../../utils/font.js');
const apk = require('../../utils/apkData.js');

function safeTitle(value, fallback) {
  if (!value) return fallback;
  try {
    return decodeURIComponent(value) || fallback;
  } catch (e) {
    return value;
  }
}

function blocksOf(text) {
  const source = String(text || '').replace(/\r\n/g, '\n');
  const blocks = [];
  source.split('\n').forEach((line) => {
    const value = line.trim();
    if (!value) return;
    const heading = /^#{1,6}\s+(.+)$/.exec(value);
    blocks.push({
      id: `b${blocks.length}`,
      kind: heading ? 'heading' : 'para',
      text: heading ? heading[1].trim() : value
    });
  });
  if (!blocks.length && source.trim()) {
    blocks.push({ id: 'b0', kind: 'para', text: source.trim() });
  }
  return blocks;
}

Page({
  data: {
    kicker: '资料库',
    item: null,
    blocks: [],
    showLead: false,
    showMeta: false,
    showBody: false,
    loading: true,
    error: '',
    fontClass: 'm'
  },

  onLoad(options) {
    font.apply(this);
    const opts = options || {};
    this.kind = opts.kind || 'figures';
    this.type = opts.type || '';
    this.id = safeTitle(opts.id, '');
    this.setData({
      kicker: safeTitle(opts.title, this.fallbackTitle(this.kind, this.type)),
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
    this.setData({ loading: true, error: '', item: null, blocks: [], showLead: false, showMeta: false, showBody: false });
    apk.find(this.kind, this.type, this.id, (err, item) => {
      if (err || !item) {
        this.setData({ loading: false, error: '资料加载失败，请检查网络后重试' });
        return;
      }
      const kicker = this.data.kicker;
      const blocks = blocksOf(item.text);
      this.setData({
        loading: false,
        error: '',
        item,
        blocks,
        showBody: blocks.length > 0 && item.text !== item.title,
        showLead:
          this.kind !== 'cards' &&
          this.kind !== 'quotes' &&
          this.kind !== 'poemquotes' &&
          this.kind !== 'wenyan' &&
          !!item.summary &&
          item.summary !== item.text,
        showMeta: !!item.meta && item.meta !== kicker
      });
    });
  },

  retry() {
    this.fetch();
  },

  goBack() {
    wx.navigateBack({ fail: () => wx.redirectTo({ url: '/pages/archive/archive' }) });
  },

  onShareAppMessage() {
    const item = this.data.item;
    return {
      title: item ? `史页 · ${item.title}` : '史页 · 资料库',
      path: `/pages/archive-detail/archive-detail?kind=${this.kind}&type=${encodeURIComponent(this.type)}&title=${encodeURIComponent(this.data.kicker)}&id=${encodeURIComponent(this.id)}`
    };
  }
});
