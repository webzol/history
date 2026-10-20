// 远端数据源：jsDelivr CDN 直出仓库里的 data/history.json（真正接口化的最小形态）
// - 仓库更新 → CDN 同步（最长缓存 12 小时）→ 小程序内容更新，无需发版
// - 上线前需把 https://cdn.jsdelivr.net 加入小程序后台 request 合法域名
// - 本地按 24h 缓存最近一次成功结果；无网络/坏数据一律回调 err，
//   由 historyData 回退打包内的本地种子，页面永远有数据可渲染。

const REMOTE_URL =
  'https://cdn.jsdelivr.net/gh/webzol/history@main/miniprogram/data/history.json';
const PURGE_URL =
  'https://purge.jsdelivr.net/gh/webzol/history@main/miniprogram/data/history.json';
const CACHE_KEY = 'shige_history_remote';
const CACHE_TTL = 24 * 60 * 60 * 1000;

function readCache() {
  const raw = wx.getStorageSync(CACHE_KEY);
  if (!raw || !raw.data) return null;
  if (Date.now() - raw.at > CACHE_TTL) return null;
  return raw.data;
}

function writeCache(data) {
  try {
    wx.setStorageSync(CACHE_KEY, { at: Date.now(), data });
  } catch (e) {
    // 存储失败不影响当次使用
  }
}

// 请求 jsDelivr 清其 CDN 缓存（官方 purge 端点），让「检查更新」即时拉到新内容
function purgeRemoteCache(cb) {
  if (typeof wx.request !== 'function') {
    if (typeof cb === 'function') cb(new Error('request unavailable'));
    return;
  }
  wx.request({
    url: PURGE_URL,
    method: 'GET',
    timeout: 10000,
    success: () => {
      if (typeof cb === 'function') cb(null);
    },
    fail: () => {
      if (typeof cb === 'function') cb(new Error('purge fail'));
    }
  });
}

function fetchRemoteHistory(cb, opts) {
  const fresh = !!(opts && opts.fresh); // true = 绕过本地缓存强制拉取
  const cached = fresh ? null : readCache();
  if (cached) {
    if (typeof cb === 'function') cb(null, cached);
    return;
  }
  if (typeof wx.request !== 'function') {
    if (typeof cb === 'function') cb(new Error('request unavailable'));
    return;
  }
  wx.request({
    url: REMOTE_URL,
    method: 'GET',
    timeout: 10000,
    success: (res) => {
      const data = res && res.data;
      if (!data || !Array.isArray(data.events)) {
        if (typeof cb === 'function') cb(new Error('bad payload'));
        return;
      }
      writeCache(data);
      if (typeof cb === 'function') cb(null, data);
    },
    fail: () => {
      if (typeof cb === 'function') cb(new Error('request fail'));
    }
  });
}

module.exports = {
  REMOTE_URL,
  PURGE_URL,
  purgeRemoteCache,
  fetchRemoteHistory
};
