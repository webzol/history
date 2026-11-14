// 太阳码（官方小程序码）编码中枢：海报码图 URL 构建 + 扫码 scene 解析。
// 生成端 tools/gen_wxacode.js（GitHub Actions）直接 require 本模块，
// scene 规则 / 文件名 / URL 基址单一来源，两端永不漂移。
//
// scene 规范（getwxacodeunlimit：≤32 可见字符，数字/字母/!#$&'()*+,/:;=?@-._~）：
//   p=<id> / e=<id> / d=<id>（person/event/period 三页）
//   g=<栏目短码>&i=<id>：archive 页短 id 直存；超限改 g=<短码>&h=<sha1 前 12 位 base36>，
//   扫码后查 idx/<栏目>.json 的 {hash: id} 还原。id 不变则 scene 恒定，增量生成恒安全。
//   cards 另带 &t=<分类key>（数据定位必需）。
// 码图：data/img/wxacode/<分组>/<id>.jpg（jsDelivr，主包外）；取不到时海报回退本地二维码。
'use strict';

// 与 eraImages 同源约定：图片二进制走 gcore（cdn 域名 301 不可达），备用域名 testingcf 重试一次；
// idx 清单是 JSON 文本走 cdn 直出（与 archiveArt 的 art-remote.json 同模式）
const IMG_HOST = 'https://gcore.jsdelivr.net';
const IMG_ALT_HOST = 'https://testingcf.jsdelivr.net';
const IMG_PATH = '/gh/webzol/history@main/miniprogram/data/img/wxacode';
const IDX_HOST = 'https://cdn.jsdelivr.net';
const IDX_PATH = '/gh/webzol/history@main/miniprogram/data/img/wxacode/idx';

// 资料库栏目短码 ↔ 全名（apkData.DIRS 八栏 + cards + poems 五体裁）
const KIND_OF_SHORT = {
  f: 'figures',
  m: 'emperors',
  v: 'events',
  w: 'wars',
  y: 'dynasty',
  q: 'quotes',
  n: 'wenyan',
  p: 'poemquotes',
  c: 'cards',
  ps: 'poems-shi',
  pc: 'poems-ci',
  pw: 'poems-wen',
  pq: 'poems-qu',
  pf: 'poems-fu'
};
const SHORT_OF_KIND = {};
Object.keys(KIND_OF_SHORT).forEach((k) => {
  SHORT_OF_KIND[KIND_OF_SHORT[k]] = k;
});

// getwxacodeunlimit scene 允许的字符集（微信文档 40129 界定）
const SCENE_RE = /^[0-9A-Za-z!#$&'()*+,/:;=?@._~-]+$/;

function validScene(scene) {
  return typeof scene === 'string' && scene.length <= 32 && SCENE_RE.test(scene);
}

// 码 page 参数：无前导 /、不带 query（query 一律进 scene）
function pageOf(target) {
  if (!target) return '';
  if (target.page === 'person') return 'pages/person/person';
  if (target.page === 'event') return 'pages/event/event';
  if (target.page === 'period') return 'pages/period/period';
  if (target.page === 'archive') return 'pages/archive-detail/archive-detail';
  return '';
}

// 码图分组目录名：三主库页 + 资料库栏目（cards 按分类分目录）
function groupOf(target) {
  if (!target) return '';
  if (target.page === 'person') return 'person';
  if (target.page === 'event') return 'event';
  if (target.page === 'period') return 'period';
  if (target.page === 'archive') {
    if (!SHORT_OF_KIND[target.kind]) return '';
    return target.kind === 'cards' ? 'cards-' + (target.type || '') : target.kind;
  }
  return '';
}

// 码图文件相对路径（wxacode/ 下），生成端写文件与海报端拼 URL 共用
function codeFileOf(target) {
  const group = groupOf(target);
  if (!group || !target.id) return '';
  return group + '/' + target.id + '.jpg';
}

// scene 编码。hashOf(id) → 12 位 base36 短哈希（sha1 前 12 位），仅生成端注入；
// 返回 null 表示无法编码（栏目未知 / 超限且无 hashFn），绝不产出非法 scene。
function sceneOf(target, hashOf) {
  if (!target || !target.id) return null;
  if (target.page === 'person') return validScene('p=' + target.id) ? 'p=' + target.id : null;
  if (target.page === 'event') return validScene('e=' + target.id) ? 'e=' + target.id : null;
  if (target.page === 'period') return validScene('d=' + target.id) ? 'd=' + target.id : null;
  if (target.page === 'archive') {
    const short = SHORT_OF_KIND[target.kind];
    if (!short) return null;
    const head = 'g=' + short + (target.kind === 'cards' ? '&t=' + (target.type || '') : '');
    const direct = head + '&i=' + target.id;
    if (validScene(direct)) return direct;
    const hash = typeof hashOf === 'function' ? hashOf(target.id) : '';
    const hashed = head + '&h=' + hash;
    return hash && validScene(hashed) ? hashed : null;
  }
  return null;
}

// scene 解码 → {page, id?, kind?, type?, hash?}；非本项目 scene 返回 null
function decodeScene(raw) {
  let scene = String(raw || '');
  if (scene.indexOf('%') >= 0) {
    try {
      scene = decodeURIComponent(scene);
    } catch (e) { /* 保留原串按失败处理 */ }
  }
  if (!validScene(scene)) return null;
  const kv = {};
  scene.split('&').forEach((pair) => {
    const i = pair.indexOf('=');
    if (i > 0) kv[pair.slice(0, i)] = pair.slice(i + 1);
  });
  if (kv.p) return { page: 'person', id: kv.p };
  if (kv.e) return { page: 'event', id: kv.e };
  if (kv.d) return { page: 'period', id: kv.d };
  if (kv.g && KIND_OF_SHORT[kv.g]) {
    const out = { page: 'archive', kind: KIND_OF_SHORT[kv.g], type: kv.t || '' };
    if (kv.i) out.id = kv.i;
    else if (kv.h) out.hash = kv.h;
    else return null;
    return out;
  }
  return null;
}

// 页面 onLoad 入参合并：扫太阳码进入时 options 只有 scene，解出参数补进 opts；
// 普通跳转（无 scene）原样返回。h= 场景置空 id 并带 wxacodeHash，由 archive-detail
// 异步查 idx 清单还原后再加载（见 resolveIndex）。
function mergeScene(options) {
  const opts = Object.assign({}, options || {});
  if (!opts.scene) return opts;
  const d = decodeScene(opts.scene);
  if (!d) return opts;
  if (d.id) opts.id = d.id;
  if (d.kind) {
    opts.kind = d.kind;
    if (d.type) opts.type = d.type;
  }
  if (d.hash) {
    opts.id = '';
    opts.wxacodeHash = d.hash;
  }
  return opts;
}

// 分享路径（sharePayload().path）→ 目标页描述；无法识别返回 null
function targetFromPath(path) {
  const m = /^\/pages\/([\w-]+)\/([\w-]+)(?:\?(.*))?$/.exec(String(path || ''));
  if (!m) return null;
  const query = {};
  (m[3] || '').split('&').forEach((pair) => {
    if (!pair) return;
    const i = pair.indexOf('=');
    if (i <= 0) return;
    let v = pair.slice(i + 1);
    try {
      v = decodeURIComponent(v);
    } catch (e) { /* 保留原值 */ }
    query[pair.slice(0, i)] = v;
  });
  const route = m[1] + '/' + m[2];
  if (route === 'person/person') return { page: 'person', id: query.id || '' };
  if (route === 'event/event') return { page: 'event', id: query.id || '' };
  if (route === 'period/period') return { page: 'period', id: query.id || '' };
  if (route === 'archive-detail/archive-detail') {
    return { page: 'archive', kind: query.kind || '', type: query.type || '', id: query.id || '' };
  }
  return null;
}

// 分享路径 → 海报太阳码图远端 URL；无法识别返回 ''（海报走本地二维码兜底）
function codeUrlOf(path) {
  const target = targetFromPath(path);
  const file = target && codeFileOf(target);
  if (!file) return '';
  return IMG_HOST + IMG_PATH + '/' + encodeURIComponent(file).replace(/%2F/g, '/');
}

// 备用域名重试：与 eraImages.altArt 同策略，非主域名 URL 返回 ''
function altCodeUrl(url) {
  if (typeof url !== 'string' || url.indexOf(IMG_HOST + IMG_PATH) !== 0) return '';
  return IMG_ALT_HOST + url.slice(IMG_HOST.length);
}

// 扫码 h= 场景还原：拉 idx/<栏目>.json（{hash: id}）查回全量 id。
// 内存 → 7 天 storage 缓存 → wx.request（失败重试一次，仿 apkData.loadFile 退避）。
const IDX_TTL = 7 * 24 * 60 * 60 * 1000;
const idxMemory = {};

function readIdxCache(kind) {
  try {
    if (typeof wx === 'undefined' || typeof wx.getStorageSync !== 'function') return null;
    const hit = wx.getStorageSync('shige_wxacode_idx_' + kind);
    if (!hit || !hit.at || !hit.map || typeof hit.map !== 'object') return null;
    if (Date.now() - hit.at > IDX_TTL) return null;
    return hit.map;
  } catch (e) {
    return null;
  }
}

function writeIdxCache(kind, map) {
  try {
    if (typeof wx === 'undefined' || typeof wx.setStorageSync !== 'function') return;
    wx.setStorageSync('shige_wxacode_idx_' + kind, { at: Date.now(), map });
  } catch (e) { /* 缓存失败不阻断解析 */ }
}

function fetchIdx(kind, cb, retried) {
  if (typeof wx === 'undefined' || typeof wx.request !== 'function') {
    cb(new Error('request unavailable'));
    return;
  }
  wx.request({
    url: IDX_HOST + IDX_PATH + '/' + kind + '.json',
    method: 'GET',
    timeout: 15000,
    success: (res) => {
      const map = res && res.statusCode < 400 && res.data && typeof res.data === 'object' ? res.data : null;
      if (map) {
        idxMemory[kind] = map;
        writeIdxCache(kind, map);
        cb(null, map);
        return;
      }
      if (!retried) setTimeout(() => fetchIdx(kind, cb, true), 600);
      else cb(new Error('bad idx'));
    },
    fail: () => {
      if (!retried) setTimeout(() => fetchIdx(kind, cb, true), 600);
      else cb(new Error('request fail'));
    }
  });
}

function resolveIndex(kind, hash, cb) {
  const cached = idxMemory[kind] || readIdxCache(kind);
  if (cached) {
    idxMemory[kind] = cached;
    const id = cached[hash];
    cb(id ? null : new Error('not found'), id || '');
    return;
  }
  fetchIdx(kind, (err, map) => {
    if (err) {
      cb(err);
      return;
    }
    const id = map[hash];
    cb(id ? null : new Error('not found'), id || '');
  });
}

module.exports = {
  IMG_HOST,
  IMG_ALT_HOST,
  IMG_PATH,
  KIND_OF_SHORT,
  SHORT_OF_KIND,
  validScene,
  pageOf,
  groupOf,
  codeFileOf,
  sceneOf,
  decodeScene,
  mergeScene,
  targetFromPath,
  codeUrlOf,
  altCodeUrl,
  resolveIndex
};
