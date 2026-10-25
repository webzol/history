// 收藏与浏览足迹（本地存储；随数据种子走，后端接入后可替换）
const KEY_FAV = 'shige_favorites';
const KEY_FOOT = 'shige_footprints';
const FOOT_MAX = 20;

function load(key) {
  try {
    return wx.getStorageSync(key) || [];
  } catch (e) {
    return [];
  }
}

function save(key, list) {
  try {
    wx.setStorageSync(key, list);
  } catch (e) { /* 存储异常时静默 */ }
}

function listFavorites() {
  return load(KEY_FAV);
}

function isFavorite(type, id) {
  return listFavorites().some((x) => x.type === type && x.id === id);
}

// 返回切换后的状态：true=已收藏，false=已取消
// extra：展示快照（如资料条目的 kind/shard/标题等），随条目一并存储，避免收藏页回查远端数据
function toggleFavorite(type, id, extra) {
  const list = listFavorites();
  const idx = list.findIndex((x) => x.type === type && x.id === id);
  if (idx >= 0) {
    list.splice(idx, 1);
    save(KEY_FAV, list);
    return false;
  }
  list.unshift(Object.assign({ type, id, ts: Date.now() }, extra || {}));
  save(KEY_FAV, list);
  return true;
}

function addFootprint(type, id, extra) {
  let list = load(KEY_FOOT).filter((x) => !(x.type === type && x.id === id));
  list.unshift(Object.assign({ type, id, ts: Date.now() }, extra || {}));
  list = list.slice(0, FOOT_MAX);
  save(KEY_FOOT, list);
}

function listFootprints() {
  return load(KEY_FOOT);
}

function clearFavorites() {
  save(KEY_FAV, []);
}

function clearFootprints() {
  save(KEY_FOOT, []);
}

// switchTab 不带查询参数：跨 tab 的 mode 通过存储交接（时间轴分段用）
const KEY_TAB_PARAMS = 'shige_tab_params';

// 阅读字号：s 小 / m 标准 / l 大 / xl 特大（默认标准）
const KEY_FONT = 'shige_font_key';
const FONT_KEYS = ['s', 'm', 'l', 'xl'];

function getFontKey() {
  try {
    const v = wx.getStorageSync(KEY_FONT);
    return FONT_KEYS.indexOf(v) >= 0 ? v : 'm';
  } catch (e) {
    return 'm';
  }
}

function setFontKey(key) {
  const v = FONT_KEYS.indexOf(key) >= 0 ? key : 'm';
  save(KEY_FONT, v);
  return v;
}

function setPendingTimelineMode(mode) {
  save(KEY_TAB_PARAMS, { timelineMode: mode || 'ancient' });
}

function popPendingTimelineMode() {
  const cur = load('shige_tab_params');
  if (!cur || !cur.timelineMode) return '';
  try {
    wx.removeStorageSync(KEY_TAB_PARAMS);
  } catch (e) { /* 静默 */ }
  return cur.timelineMode;
}

module.exports = {
  listFavorites,
  isFavorite,
  toggleFavorite,
  addFootprint,
  listFootprints,
  clearFavorites,
  clearFootprints,
  setPendingTimelineMode,
  popPendingTimelineMode,
  getFontKey,
  setFontKey
};
