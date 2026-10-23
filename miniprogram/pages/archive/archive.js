const font = require('../../utils/font.js');
const apk = require('../../utils/apkData.js');
const archiveImages = require('../../utils/archiveImages.js');

const fmt = (n) => String(n || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

function safeTitle(value, fallback) {
  if (!value) return fallback;
  try {
    return decodeURIComponent(value);
  } catch (e) {
    return value;
  }
}

const GROUP_DEFS = [
  { key: 'cards', name: '典籍辞条', desc: '职官、典故、成语与诗词名句' },
  { key: 'people', name: '人物', desc: '历代人物与帝王世系' },
  { key: 'events', name: '事件', desc: '历史事件、战争与三国纪事' },
  { key: 'docs', name: '文献', desc: '名句赏析与文言辞条' },
  { key: 'poems', name: '诗文', desc: '名句与诗、词、文、曲、赋全文' }
];

const GROUP_KEYS = {
  people: ['figures', 'emperors'],
  events: ['events', 'wars', 'dynasty'],
  docs: ['quotes', 'wenyan'],
  poems: ['poemquotes', 'poems-shi', 'poems-ci', 'poems-wen', 'poems-qu', 'poems-fu']
};

function buildRows(groups, openKey) {
  const rows = [];
  groups.forEach((group) => {
    rows.push({
      rowType: 'group',
      key: `group-${group.key}`,
      groupKey: group.key,
      index: group.index,
      name: group.name,
      desc: group.desc,
      meta: group.meta,
      countText: group.countText,
      cover: group.cover,
      open: group.key === openKey
    });
    if (group.key !== openKey) return;
    group.items.forEach((item) => {
      rows.push({ ...item, rowType: 'item', key: `item-${group.key}-${item.key}` });
    });
  });
  return rows;
}

Page({
  data: {
    stats: { total: 0, cards: 0, figures: 0, events: 0, categories: 0 },
    categories: [],
    sections: [],
    groups: [],
    rows: [],
    openKey: '',
    fontClass: 'm'
  },

  onLoad() {
    font.apply(this);
    const meta = apk.getMeta();
    const stats = {
      ...meta.stats,
      totalText: fmt(meta.stats.total),
      cardsText: fmt(meta.stats.cards),
      figuresText: fmt(meta.stats.figures),
      eventsText: fmt(meta.stats.events)
    };
    const categories = (meta.categories || []).map((item) => ({
      ...item,
      countText: fmt(item.count)
    }));
    const sections = (meta.sections || []).map((item) => ({
      ...item,
      countText: fmt(item.count)
    }));
    const sectionMap = {};
    sections.forEach((item) => {
      sectionMap[item.key] = item;
    });
    const cardItems = categories.map((item) => ({
      key: `card-${item.key}`,
      kind: 'cards',
      type: item.key,
      name: item.name,
      desc: item.sample || item.name,
      countText: item.countText
    }));
    const groups = GROUP_DEFS.map((def, index) => {
      const number = index + 1;
      const items = def.key === 'cards'
        ? cardItems
        : (GROUP_KEYS[def.key] || []).map((key) => sectionMap[key]).filter(Boolean).map((item) => ({
          key: item.key,
          kind: item.key,
          type: '',
          name: item.name,
          desc: item.desc,
          countText: item.countText
        }));
      const count = items.reduce((sum, item) => sum + Number(item.countText.replace(/,/g, '') || 0), 0);
      return {
        ...def,
        index: number < 10 ? `0${number}` : String(number),
        meta: `${items.length} 类`,
        cover: archiveImages.groupCover(def.key),
        count,
        countText: fmt(count),
        items
      };
    });
    const groupByKey = {};
    groups.forEach((group) => {
      groupByKey[group.key] = group;
    });
    stats.figuresText = fmt(groupByKey.people.count);
    stats.eventsText = fmt(groupByKey.events.count);
    this.groups = groups;
    this.setData({
      stats,
      categories,
      sections,
      groups,
      rows: buildRows(groups, ''),
      openKey: ''
    });
  },

  onShow() {
    font.apply(this);
  },

  goBack() {
    wx.navigateBack({ fail: () => wx.redirectTo({ url: '/pages/home/home' }) });
  },

  onToggle(e) {
    const key = e.currentTarget.dataset.key;
    const openKey = this.data.openKey === key ? '' : key;
    this.setData({
      openKey,
      rows: buildRows(this.groups || [], openKey)
    });
  },

  onEntry(e) {
    const { kind, type, name } = e.currentTarget.dataset;
    if (kind === 'cards') {
      this.onCategory({ currentTarget: { dataset: { key: type, name } } });
      return;
    }
    this.onSection({ currentTarget: { dataset: { key: kind, name } } });
  },

  onCategory(e) {
    const key = e.currentTarget.dataset.key;
    const name = safeTitle(e.currentTarget.dataset.name, '典籍辞条');
    wx.navigateTo({
      url: `/pages/archive-list/archive-list?kind=cards&type=${encodeURIComponent(key)}&title=${encodeURIComponent(name)}`
    });
  },

  onSection(e) {
    const key = e.currentTarget.dataset.key;
    const name = safeTitle(e.currentTarget.dataset.name, '资料库');
    wx.navigateTo({
      url: `/pages/archive-list/archive-list?kind=${encodeURIComponent(key)}&title=${encodeURIComponent(name)}`
    });
  },

  onShareAppMessage() {
    return { title: '史页 · 资料库', path: '/pages/archive/archive' };
  }
});
