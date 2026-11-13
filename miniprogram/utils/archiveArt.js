// 资料库条目配图（2026-10-24）：detail 页头卡画片按条目取图。
// 优先级：主站人物/事件专属图（archiveArtMatch.js 标题匹配，零下载）>
// 资料库自抓图（清单经 jsDelivr 远端加载，data/img/archive/<栏目>/<id>.jpg）>
// ''（无图，详情页只保留分类题图）。仅 figures/emperors/events/wars 四类有图。
// 远端图加载失败时用 eraImages.altArt 换备用域名重试一次。
//
// 清单体 170KB（6,406 条 id），2026-11-14 起移出主包（主包 2MB 上限）：
// 改为 data/img/archive/art-remote.json 经 jsDelivr 按需加载（内存 + 7 天本地缓存），
// app.js onLaunch 静默预取。清单未就绪/无网时 remoteImage 返回 ''（画片隐藏）——
// 与远端图本身在无网时不可用的降级一致，不影响其他功能。
const eraImages = require('./eraImages.js');
const MATCH = require('./archiveArtMatch.js');

const ARCHIVE_BASE = eraImages.IMG_BASE + '/archive';
const LIST_URL = 'https://cdn.jsdelivr.net/gh/webzol/history@main/miniprogram/data/img/archive/art-remote.json';
const CACHE_KEY = 'shige_art_remote';
const CACHE_TTL = 7 * 86400 * 1000;

let REMOTE = null;
let loading = false;
let loaded = false;
const waiters = [];

function flush() {
  const list = REMOTE;
  waiters.splice(0).forEach((w) => { try { w(list); } catch (e) { /* 回调异常不影响其他 */ } });
}

// 清单就绪保证：内存 → 7 天本地缓存 → jsDelivr；失败时也放行回调（REMOTE 为 null，画片降级隐藏）
function ensure(cb) {
  if (REMOTE) {
    if (cb) cb(REMOTE);
    return;
  }
  if (cb) waiters.push(cb);
  if (loading) return;
  loading = true;
  try {
    const cached = wx.getStorageSync(CACHE_KEY);
    if (cached && cached.t && Date.now() - cached.t < CACHE_TTL && cached.d) {
      REMOTE = cached.d;
      loaded = true;
      loading = false;
      flush();
      return;
    }
  } catch (e) { /* 缓存异常走远端 */ }
  wx.request({
    url: LIST_URL,
    success: (res) => {
      REMOTE = (res.data && typeof res.data === 'object') ? res.data : null;
      if (REMOTE) {
        try { wx.setStorageSync(CACHE_KEY, { t: Date.now(), d: REMOTE }); } catch (e) { /* 存储满不影响本次 */ }
      }
      loaded = true;
      loading = false;
      flush();
    },
    fail: () => {
      loading = false;
      flush();
    }
  });
}

function matchedImage(kind, id) {
  const hit = MATCH[kind] && MATCH[kind][id];
  if (!hit) return '';
  if (hit[0] === 'p') {
    return eraImages.PERSON_ART[hit[1]] || eraImages.remotePerson(hit[1]) || '';
  }
  return eraImages.EVENT_ART[hit[1]] || eraImages.remoteEvent(hit[1]) || '';
}

function remoteImage(kind, id) {
  const ids = REMOTE && REMOTE[kind];
  return ids && ids.indexOf(id) >= 0 ? ARCHIVE_BASE + '/' + kind + '/' + id + '.jpg' : '';
}

function entryImage(kind, id) {
  return matchedImage(kind, id) || remoteImage(kind, id);
}

// 测试注入口（selftest 用）：直接预置清单
function _setRemote(list) {
  REMOTE = list;
  loaded = true;
}

module.exports = { entryImage, matchedImage, remoteImage, ensure, _setRemote, isLoaded: () => loaded };
