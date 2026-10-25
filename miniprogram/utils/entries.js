// 收藏 / 足迹条目解析：type+id → 展示条目（人物/事件/资料库条目）
const hd = require('./historyData.js');
const personImageThumb = require('./eraImages.js').personImageThumb;
const eventImage = require('./eraImages.js').eventImage;
const archiveArt = require('./archiveArt.js');
const archiveImages = require('./archiveImages.js');

const MODERN_ERAS = ['晚清', '民国', '新中国', '近现代', '现代'];

// 资料库条目的收藏/足迹唯一键（kind 与条目 id 均为 ASCII，'|' 作分隔不会歧义）
function archiveKey(kind, aType, rawId) {
  return `${kind}|${aType || ''}|${rawId}`;
}

// 资料详情页跳转链接（收藏/足迹行与分享共用同一参数结构）
function archiveUrl(info) {
  return (
    `/pages/archive-detail/archive-detail?kind=${info.kind}` +
    `&type=${encodeURIComponent(info.aType || '')}` +
    `&shard=${encodeURIComponent(info.shard || '')}` +
    `&title=${encodeURIComponent(info.cat || '')}` +
    `&id=${encodeURIComponent(info.rawId || '')}`
  );
}

function resolveEntry(x, index) {
  if (x.type === 'person') {
    const p = hd.get().persons.find((item) => item.id === x.id);
    if (!p) return null;
    return {
      type: 'person',
      id: p.id,
      title: p.name,
      sub: `${p.era} · ${p.roles}`,
      img: personImageThumb(p.id, p.era, index),
      nav: `/pages/person/person?id=${p.id}`,
      modern: MODERN_ERAS.indexOf(p.era) >= 0
    };
  }
  if (x.type === 'event') {
    const ev = hd.get().events.find((item) => item.id === x.id);
    if (!ev) return null;
    return {
      type: 'event',
      id: ev.id,
      title: ev.title,
      sub: `${ev.yearText} · ${ev.era}`,
      img: eventImage(ev.id, ev.era),
      nav: `/pages/event/event?id=${ev.id}`,
      modern: ev.mode === 'modern'
    };
  }
  if (x.type === 'archive') {
    // 资料条目用收藏/足迹里存的快照渲染（39,067 条远端数据不回查）；行图走条目配图，分类题图兜底
    const info = x.info || {};
    if (!info.title || !info.kind) return null;
    return {
      type: 'archive',
      id: x.id,
      title: info.title,
      sub: info.meta || info.cat || '史页资料库',
      img: archiveArt.entryImage(info.kind, info.rawId) || archiveImages.cover(info.kind, info.aType),
      nav: archiveUrl(info),
      modern: false
    };
  }
  return null;
}

function fmtWhen(ts) {
  const d = new Date(ts);
  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 收藏/足迹全量页：按人物、史事、资料分组（保持组内原有顺序）
function groupByType(list) {
  return [
    { key: 'person', label: '人物', items: list.filter((x) => x.type === 'person') },
    { key: 'event', label: '史事', items: list.filter((x) => x.type === 'event') },
    { key: 'archive', label: '资料', items: list.filter((x) => x.type === 'archive') }
  ].filter((g) => g.items.length);
}

// 展平成「分组标题 + 条目」单层列表，兼容 WXML 单层 wx:for 渲染
function flattenGroups(groups) {
  const rows = [];
  groups.forEach((g) => {
    rows.push({ kind: 'header', key: 'h-' + g.key, label: g.label, count: g.items.length });
    g.items.forEach((item) => {
      rows.push({ kind: 'item', key: item.type + '-' + item.id, ...item });
    });
  });
  return rows;
}

module.exports = { resolveEntry, fmtWhen, groupByType, flattenGroups, archiveKey, archiveUrl };
