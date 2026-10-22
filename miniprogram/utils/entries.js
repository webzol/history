// 收藏 / 足迹条目解析：type+id → 展示条目（人物/事件）
const hd = require('./historyData.js');
const personThumb = require('./eraImages.js').personThumb;

const MODERN_ERAS = ['晚清', '民国', '新中国', '近现代', '现代'];

function resolveEntry(x, index) {
  if (x.type === 'person') {
    const p = hd.get().persons.find((item) => item.id === x.id);
    if (!p) return null;
    return {
      type: 'person',
      id: p.id,
      title: p.name,
      sub: `${p.era} · ${p.roles}`,
      img: personThumb(p.era, index),
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
      img: personThumb(ev.era, index),
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

// 收藏/足迹全量页：按人物、史事分组（保持组内原有顺序）
function groupByType(list) {
  return [
    { key: 'person', label: '人物', items: list.filter((x) => x.type === 'person') },
    { key: 'event', label: '史事', items: list.filter((x) => x.type === 'event') }
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

module.exports = { resolveEntry, fmtWhen, groupByType, flattenGroups };
