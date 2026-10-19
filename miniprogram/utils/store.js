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
function toggleFavorite(type, id) {
  const list = listFavorites();
  const idx = list.findIndex((x) => x.type === type && x.id === id);
  if (idx >= 0) {
    list.splice(idx, 1);
    save(KEY_FAV, list);
    return false;
  }
  list.unshift({ type, id, ts: Date.now() });
  save(KEY_FAV, list);
  return true;
}

function addFootprint(type, id) {
  let list = load(KEY_FOOT).filter((x) => !(x.type === type && x.id === id));
  list.unshift({ type, id, ts: Date.now() });
  list = list.slice(0, FOOT_MAX);
  save(KEY_FOOT, list);
}

function listFootprints() {
  return load(KEY_FOOT);
}

module.exports = {
  listFavorites,
  isFavorite,
  toggleFavorite,
  addFootprint,
  listFootprints
};
