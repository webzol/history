// 文物目录分片加载器（2026-11-28 索引 v2）：
//   index-head.json —— 前 200 行 + total/step/parts + 筛选计数（typeCounts/eraCounts/joint）
//   index-part-NN.json —— 其余行每 200 行一块（NN 与详情分卷号对齐：part NN 的行 = detail NN 的条目）
//   detail-NN.json —— 详情分卷（布局未变）
// 经 jsDelivr 分发（testingcf 主域 → gcore 备用域），内存 + 7 天本地缓存。
// 分块交付同 utils/apkData.js「不断层」：head 首屏先回调，后台 4 并发补齐 part，
// 只合并「head + 连续成功前缀」，失败退避重试，每接上一块再回调一次；残缺绝不写全量缓存。
// 精修 60 件（catalog.js）始终走包内快路径，批量条目走远端。
const { RELICS, sourceFor, detailUrls, imagePath } = require('./catalog.js');

const HEAD_URLS = [
  'https://testingcf.jsdelivr.net/gh/webzol/history@main/miniprogram/data/relics/index-head.json',
  'https://gcore.jsdelivr.net/gh/webzol/history@main/miniprogram/data/relics/index-head.json'
];
const PART_URLS = (n) => [
  `https://testingcf.jsdelivr.net/gh/webzol/history@main/miniprogram/data/relics/index-part-${pad(n)}.json`,
  `https://gcore.jsdelivr.net/gh/webzol/history@main/miniprogram/data/relics/index-part-${pad(n)}.json`
];
const DETAIL_URLS = (n) => [
  `https://testingcf.jsdelivr.net/gh/webzol/history@main/miniprogram/data/relics/detail-${pad(n)}.json`,
  `https://gcore.jsdelivr.net/gh/webzol/history@main/miniprogram/data/relics/detail-${pad(n)}.json`
];
// v2：索引拆 head + part（2026-11-28），布局与 v1 整份索引缓存不兼容，整体失效。
const CACHE_PREFIX = 'shige_relic_index_v2_';
const HEAD_FILE = 'index-head.json';
const FULL_KEY = CACHE_PREFIX + 'full';
const DETAIL_KEY_PREFIX = 'shige_relic_det_v1_'; // 详情分卷布局未变，沿用 v1 缓存
const LEGACY_INDEX_KEY = 'shige_relic_index_v1';
const TTL = 7 * 24 * 60 * 60 * 1000;
const STEP_DEFAULT = 200;

let legacyCleaned = false;
function cleanupLegacyCache() {
  if (legacyCleaned) return;
  legacyCleaned = true;
  try {
    wx.removeStorageSync(LEGACY_INDEX_KEY);
  } catch (e) { /* 无旧缓存时静默 */ }
}
cleanupLegacyCache();

function pad(n) { return String(n).padStart(2, '0'); }

// 精修条目快路径：id → 详情对象（与列表行一起构建）
const curatedById = {};
const curatedThumb = {};
RELICS.forEach((item) => {
  curatedById[item.id] = item;
  curatedThumb[item.id] = true;
});

const memory = { files: {}, full: null };
const inflight = {};
let assembling = null;

function fetchJson(urls, cb) {
  const tryHost = (i) => {
    if (i >= urls.length) return cb(null);
    wx.request({
      url: urls[i],
      timeout: 20000,
      success: (res) => {
        if (res.statusCode === 200 && res.data) cb(res.data);
        else tryHost(i + 1);
      },
      fail: () => tryHost(i + 1)
    });
  };
  tryHost(0);
}

function readCache(key) {
  try {
    const hit = wx.getStorageSync(key);
    if (hit && hit.t && Date.now() - hit.t < TTL && hit.data) return hit.data;
  } catch (e) { /* 存储异常按无缓存处理 */ }
  return null;
}

function writeCache(key, data) {
  try { wx.setStorageSync(key, { t: Date.now(), data }); } catch (e) { /* 超限静默 */ }
}

// 单文件加载：内存 → 7 天缓存 → jsDelivr 双域（各文件请求内部快速重试一次，避开限流窗口）
function loadJson(file, urls, validate, cb) {
  if (memory.files[file]) return cb(memory.files[file]);
  if (inflight[file]) return inflight[file].push(cb);
  const cached = readCache(CACHE_PREFIX + file.replace(/[^\w]/g, '_'));
  if (cached) {
    memory.files[file] = cached;
    return cb(cached);
  }
  inflight[file] = [cb];
  const done = (data) => {
    const subs = inflight[file] || [];
    delete inflight[file];
    if (data) {
      memory.files[file] = data;
      writeCache(CACHE_PREFIX + file.replace(/[^\w]/g, '_'), data);
    }
    subs.forEach((fn) => fn(data));
  };
  const attempt = (left) => {
    fetchJson(urls, (raw) => {
      const data = raw && validate(raw);
      if (data) return done(data);
      if (left > 0) return setTimeout(() => attempt(left - 1), 600);
      done(null);
    });
  };
  attempt(1);
}

function validateHead(data) {
  if (!data || data.v !== 2 || !Array.isArray(data.rows)) return null;
  const { total, step, parts } = data;
  if (!Number.isInteger(total) || total < 1 || !Number.isInteger(step) || step < 1) return null;
  if (data.rows.length !== Math.min(total, step) || parts !== Math.ceil(total / step)) return null;
  if (!Array.isArray(data.types) || !Array.isArray(data.eras)) return null;
  return data;
}

function validatePart(size) {
  return (data) => {
    if (!data || data.v !== 2 || !Array.isArray(data.rows) || data.rows.length !== size) return null;
    return data;
  };
}

function validateDetail(data) {
  if (!data || !data.items || typeof data.items !== 'object') return null;
  return data;
}

// head 首屏回调后，后台补齐剩余分块并按序合并（不断层，同 apkData.fetchParts）。
const PART_CONCURRENCY = 4;
const PART_RETRY_DELAYS = [1500, 4000]; // 首轮之后再补两轮，避开 jsDelivr 限流窗口

function assemble(head, cb) {
  if (assembling) {
    assembling.push(cb);
    return;
  }
  assembling = [cb];

  const { total, step } = head;
  const idxParts = head.parts - 1; // head 已含前 step 行，part NN 覆盖 [NN*step, (NN+1)*step)
  const rowsByN = new Array(idxParts);
  let list = head.rows;
  let prefix = 0;
  let remaining = []; // 本轮待拉分块序号（最小序号优先，尽快推进连续前缀）
  let failed = [];
  let active = 0;
  let round = 0;
  for (let n = 1; n <= idxParts; n += 1) remaining.push(n);

  const emit = (complete, stalled) => {
    if (complete) {
      memory.full = list;
      writeCache(FULL_KEY, list); // 全部到齐才写全量缓存（残缺绝不落盘）
    }
    const info = { partial: !complete, total, loaded: list.length, stalled: !!stalled };
    const subs = assembling || [];
    if (complete || stalled) assembling = null;
    subs.forEach((fn) => {
      if (typeof fn === 'function') fn(list, info);
    });
  };

  const settle = () => {
    if (!failed.length) return emit(true);
    if (round >= PART_RETRY_DELAYS.length) return emit(false, true);
    const delay = PART_RETRY_DELAYS[round];
    round += 1;
    remaining = failed;
    failed = [];
    setTimeout(() => start(Math.min(PART_CONCURRENCY, remaining.length)), delay);
  };

  const worker = () => {
    if (!remaining.length) return;
    const n = remaining.shift();
    const size = Math.min(step, total - n * step);
    active += 1;
    loadJson(`index-part-${pad(n)}.json`, PART_URLS(n), validatePart(size), (data) => {
      active -= 1;
      if (!data) {
        failed.push(n);
      } else {
        rowsByN[n - 1] = data.rows;
        const start = prefix;
        while (rowsByN[prefix]) prefix += 1;
        if (prefix > start) {
          list = list.concat(...rowsByN.slice(start, prefix));
          if (prefix < idxParts) emit(false);
        }
      }
      if (!remaining.length && !active) settle();
      else worker();
    });
  };

  const start = (count) => {
    for (let i = 0; i < count; i += 1) worker();
  };

  start(Math.min(PART_CONCURRENCY, idxParts));
}

// 目录加载：内存/缓存里有完整索引 → 一次回调全量；否则先回调 head 首屏
// （info.partial=true, info.total=全量件数），后台补齐 part：每接上一块连续前缀
// 就再回调一次（info.loaded=已载入件数），全部到齐回调完整目录（partial=false）；
// 失败分块退避重试，绝不合并出带洞数据，耗尽后回调 info.stalled=true 由页面提示重试。
function loadIndex(cb) {
  if (typeof cb !== 'function') return;
  if (!memory.full) {
    const cachedFull = readCache(FULL_KEY);
    if (Array.isArray(cachedFull) && cachedFull.length) memory.full = cachedFull;
  }
  if (memory.full) {
    return cb(memory.full, { partial: false, total: memory.full.length, loaded: memory.full.length });
  }
  if (assembling) {
    assembling.push(cb);
    return;
  }
  loadJson(HEAD_FILE, HEAD_URLS, validateHead, (head) => {
    if (!head) return cb(null);
    if (head.parts <= 1) {
      memory.full = head.rows;
      writeCache(FULL_KEY, head.rows);
      return cb(head.rows, { partial: false, total: head.total, loaded: head.rows.length });
    }
    cb(head.rows, { partial: true, total: head.total, loaded: head.rows.length });
    assemble(head, cb);
  });
}

// 单件详情：精修走包内；批量按索引定位分卷加载。
// cb({ relic, source } | null, err)，source: 'curated' | 'remote'；err.stalled=true 表示
// 分块补齐受阻（网络不可用），与「未知条目」区分，页面据此显示重试。
function loadDetail(id, cb) {
  const curated = curatedById[id];
  if (curated) {
    const { id: rid, title, type, period, date, material, dimensions, accession, description, imageNote, imageRatio } = curated;
    const { museum, url, rights } = sourceFor(rid);
    return cb({
      source: 'curated',
      relic: {
        id: rid, title, type, period, date, material, dimensions, accession, description,
        imageNote: imageNote || '', imageRatio, museum, url, rights,
        image: detailUrls(rid)[0], imageThumb: imagePath(rid, 'thumb'), template: false
      }
    });
  }
  let settled = false;
  const finish = (entry, err) => {
    if (settled) return;
    settled = true;
    if (!entry) return cb(null, err);
    const { museum, url, rights } = sourceFor(id);
    cb({
      source: 'remote',
      relic: {
        id, title: entry.title, type: entry.type, period: entry.period, date: entry.date,
        material: entry.material, dimensions: entry.dimensions, accession: entry.accession,
        description: entry.description, imageNote: entry.imageNote || '',
        imageRatio: entry.imageRatio, museum, url, rights,
        image: detailUrls(id)[0], imageThumb: '', template: !!entry.t
      }
    });
  };
  loadIndex((rows, info) => {
    if (!rows) return finish(null);
    const pos = rows.findIndex((row) => row.id === id);
    if (pos < 0) {
      if (info.stalled) return finish(null, { stalled: true });
      if (!info.partial) return finish(null); // 完整索引仍无此 id → 未知条目
      return; // 部分索引未命中：等后续分块合并回调再找
    }
    // 详情分卷条目不含 type（列表索引行才有），命中行随路携带
    const row = rows[pos];
    const head = memory.files[HEAD_FILE];
    const step = head && head.step ? head.step : STEP_DEFAULT;
    const shard = Math.floor(pos / step);
    loadJson(`detail-${pad(shard)}.json`, DETAIL_URLS(shard), validateDetail, (data) => {
      const entry = data && data.items[id];
      if (!entry) return finish(null);
      finish(Object.assign({ type: row.type }, entry));
    });
  });
}

function isCurated(id) { return !!curatedThumb[id]; }

// 列表缩略图：精修 60 件包内直读（离线可读），批量走 CDN（列表 binderror 换备用域）
function thumbFor(id) {
  return curatedThumb[id] ? imagePath(id, 'thumb')
    : `https://testingcf.jsdelivr.net/gh/webzol/history@main/miniprogram/data/img/relics/thumb-${id}.jpg`;
}

function thumbAlt(src) {
  if (typeof src === 'string' && src.indexOf('testingcf.jsdelivr.net') >= 0) {
    return src.replace('testingcf', 'gcore');
  }
  return '';
}

module.exports = { loadIndex, loadDetail, thumbFor, thumbAlt, isCurated };

// 自测专用：清空模块内存态（本地缓存由自测自行清理）
module.exports._reset = () => {
  memory.files = {};
  memory.full = null;
  Object.keys(inflight).forEach((k) => delete inflight[k]);
  assembling = null;
  legacyCleaned = false;
};
