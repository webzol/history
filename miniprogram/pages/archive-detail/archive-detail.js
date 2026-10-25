const font = require('../../utils/font.js');
const apk = require('../../utils/apkData.js');
const archiveImages = require('../../utils/archiveImages.js');
const archiveArt = require('../../utils/archiveArt.js');
const altArt = require('../../utils/eraImages.js').altArt;
const store = require('../../utils/store.js');
const entries = require('../../utils/entries.js');

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

function toneOf(label) {
  if (label === '原文' || label === '诗文') return 'verse';
  if (label === '注释' || label === '译文') return 'note';
  return '';
}

// 把「【原文】/### 题解」这类内嵌小标题整理成独立段落，避免整页挤成一块。
function sectionsOf(text) {
  const source = String(text || '').replace(/\r\n/g, '\n');
  const sections = [];
  let current = null;

  const ensure = (label) => {
    current = {
      id: `s${sections.length}`,
      label: label || '',
      tone: toneOf(label || ''),
      paras: []
    };
    sections.push(current);
    return current;
  };

  const addPara = (value) => {
    const body = String(value || '').trim();
    if (!body) return;
    if (!current) ensure('');
    current.paras.push({
      id: `${current.id}-p${current.paras.length}`,
      text: body
    });
  };

  source.split('\n').forEach((line) => {
    const value = line.trim();
    if (!value) return;
    const heading = /^#{1,6}\s*(.+)$/.exec(value);
    if (heading) {
      ensure(heading[1].trim());
      return;
    }
    const bracket = /^【([^】]{1,12})】\s*(.*)$/.exec(value);
    if (bracket) {
      ensure(bracket[1].trim());
      if (bracket[2].trim()) addPara(bracket[2]);
      return;
    }
    addPara(value);
  });

  return sections.filter((section) => section.label || section.paras.length);
}

function factRowsOf(facts) {
  return (facts || [])
    .map((fact, index) => {
      const value = String(fact || '').trim();
      const match = /^([^：:]{1,10})[：:]\s*(.+)$/.exec(value);
      if (match) {
        return {
          id: `f${index}`,
          key: match[1].trim(),
          value: match[2].trim(),
          wide: false
        };
      }
      return { id: `f${index}`, key: '', value, wide: true };
    })
    .filter((row) => row.key || row.value);
}

Page({
  data: {
    kicker: '资料库',
    cover: '/assets/palace.jpg',
    art: '',
    item: null,
    blocks: [],
    sections: [],
    factRows: [],
    showLead: false,
    showMeta: false,
    showBody: false,
    showSections: false,
    showTranslation: false,
    loading: true,
    error: '',
    collected: false,
    fontClass: 'm'
  },

  onLoad(options) {
    font.apply(this);
    const opts = options || {};
    this.kind = opts.kind || 'figures';
    this.type = opts.type || '';
    this.id = safeTitle(opts.id, '');
    // 列表页会带上 shard；旧分享链接没有 shard 时，find 会先用索引定位。
    this.shard = opts.shard || (this.kind.indexOf('poems-') === 0 ? this.type : '');
    this.setData({
      kicker: safeTitle(opts.title, this.fallbackTitle(this.kind, this.type)),
      cover: archiveImages.cover(this.kind, this.type),
      loading: true,
      error: ''
    });
    this.fetch();
  },

  onShow() {
    font.apply(this);
    // 从收藏/足迹页返回时同步收藏态
    if (this.data.item) {
      this.setData({ collected: store.isFavorite('archive', this.entryKey()) });
    }
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
      item: null,
      art: '',
      blocks: [],
      sections: [],
      factRows: [],
      showLead: false,
      showMeta: false,
      showBody: false,
      showSections: false,
      showTranslation: false
    });
    apk.find(this.kind, this.type, this.id, this.shard, (err, item) => {
      if (err || !item) {
        this.setData({ loading: false, error: '资料加载失败，请检查网络后重试' });
        return;
      }
      this.shard = item.shard || this.shard;
      const kicker = this.data.kicker;
      const key = entries.archiveKey(this.kind, this.type, item.id);
      // 浏览足迹：带展示快照（标题/朝代身份/分类名/分卷），收藏与足迹页据此渲染，不回查远端数据
      store.addFootprint('archive', key, {
        info: {
          kind: this.kind,
          aType: this.type,
          shard: this.shard,
          rawId: item.id,
          cat: kicker,
          meta: item.meta || '',
          title: item.title
        }
      });
      const blocks = blocksOf(item.text);
      const sections = sectionsOf(item.text);
      const factRows = factRowsOf(item.facts);
      const hasTranslationSection = sections.some((section) => section.label === '译文');
      const showSections = sections.length > 0 && item.text !== item.title;
      this.setData({
        loading: false,
        error: '',
        item,
        collected: store.isFavorite('archive', key),
        art: archiveArt.entryImage(this.kind, item.id),
        blocks,
        sections,
        factRows,
        showSections,
        showBody: !showSections && blocks.length > 0 && item.text !== item.title,
        showTranslation: !!item.translation && !hasTranslationSection,
        showLead:
          this.kind !== 'cards' &&
          this.kind !== 'quotes' &&
          this.kind !== 'poemquotes' &&
          this.kind !== 'wenyan' &&
          this.kind.indexOf('poems-') !== 0 &&
          !!item.summary &&
          item.summary !== item.text,
        showMeta: !!item.meta && item.meta !== kicker
      });
    });
  },

  retry() {
    this.fetch();
  },

  // 收藏/足迹用的唯一键：kind|type|条目id（条目 id 各栏目内唯一）
  entryKey() {
    return entries.archiveKey(this.kind, this.type, this.data.item && this.data.item.id);
  },

  toggleCollect() {
    const key = this.entryKey();
    if (!key) return;
    const on = store.toggleFavorite('archive', key, {
      info: {
        kind: this.kind,
        aType: this.type,
        shard: this.shard,
        rawId: this.data.item.id,
        cat: this.data.kicker,
        meta: this.data.item.meta || '',
        title: this.data.item.title
      }
    });
    this.setData({ collected: on });
    wx.showToast({ title: on ? '已收藏' : '已取消收藏', icon: 'none' });
  },

  // 条目画片（远端图）加载失败 → 换备用 jsDelivr 域名重试一次；再失败置空隐藏画片（露出纯文字版式）
  onArtErr() {
    this.setData({ art: altArt(this.data.art) });
  },

  goBack() {
    wx.navigateBack({ fail: () => wx.redirectTo({ url: '/pages/archive/archive' }) });
  },

  onShareAppMessage() {
    const item = this.data.item;
    return {
      title: item ? `史页 · ${item.title}` : '史页 · 资料库',
      path: `/pages/archive-detail/archive-detail?kind=${this.kind}&type=${encodeURIComponent(this.type)}&shard=${encodeURIComponent(this.shard || '')}&title=${encodeURIComponent(this.data.kicker)}&id=${encodeURIComponent(this.id)}`
    };
  }
});
