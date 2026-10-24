// APK 资料库远端数据：列表索引 + 详情分卷，按需加载，减少主包体积与首屏等待。
// 数据由 tools/import_apk_data.py 生成，放在 data/apk/ 下并从主包排除，
// 通过 jsDelivr 读取；索引和最近看过的分卷会写入本地缓存，7 天内离线可读。
const meta = require('../data/archive-meta.js');

const BASE =
  'https://cdn.jsdelivr.net/gh/webzol/history@main/miniprogram/data/apk/';
// v2：数据结构从“整类 JSON”改为“索引 + 分卷”，旧缓存需整体失效。
const CACHE_PREFIX = 'shige_apk_v2_';
const LEGACY_CACHE_PREFIX = 'shige_apk_';
const CACHE_META_KEY = CACHE_PREFIX + 'meta';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
// 单个文件缓存上限；索引约 40–900KB，分卷约 50–320KB。
const MAX_CACHE_BYTES = 1.5 * 1024 * 1024;
// 资料库缓存总预算，给收藏/足迹/字号等业务数据留空间；超预算先淘汰旧分卷。
const CACHE_TOTAL_BYTES = 5 * 1024 * 1024;
const memory = {};
const inflight = {};

const DIRS = {
  figures: 'figures',
  events: 'events',
  wars: 'wars',
  emperors: 'emperors',
  dynasty: 'dynasty',
  quotes: 'quotes',
  wenyan: 'wenyan',
  poemquotes: 'poemquotes'
};

let legacyCacheCleaned = false;

function cleanupLegacyCache() {
  if (legacyCacheCleaned) return;
  legacyCacheCleaned = true;
  try {
    if (typeof wx === 'undefined' || typeof wx.getStorageInfoSync !== 'function') return;
    const info = wx.getStorageInfoSync() || {};
    (info.keys || []).forEach((key) => {
      if (key.indexOf(LEGACY_CACHE_PREFIX) !== 0 || key.indexOf(CACHE_PREFIX) === 0) return;
      try {
        wx.removeStorageSync(key);
      } catch (e) {
        // 单个旧 key 删除失败不阻断新缓存
      }
    });
  } catch (e) {
    // 存储信息不可用时留给正常读写兜底
  }
}

cleanupLegacyCache();

function getMeta() {
  return meta;
}

function dirFor(kind, type) {
  if (kind === 'cards') return type ? `cards/${type}` : '';
  if (kind.indexOf('poems-') === 0) {
    const genre = kind.slice(6);
    return genre ? `poems/${genre}` : '';
  }
  return DIRS[kind] || '';
}

function indexFileFor(kind, type) {
  const dir = dirFor(kind, type);
  return dir ? `${dir}/index.json` : '';
}

function headFileFor(kind, type) {
  const dir = dirFor(kind, type);
  return dir ? `${dir}/head.json` : '';
}

function partFileFor(kind, type, n) {
  const dir = dirFor(kind, type);
  return dir ? `${dir}/part-${n}.json` : '';
}

function shardFileFor(kind, type, shard) {
  const dir = dirFor(kind, type);
  return dir && shard ? `${dir}/${shard}.json` : '';
}

// 兼容旧调用：fileFor 现在指向列表索引。
function fileFor(kind, type) {
  return indexFileFor(kind, type);
}

function cacheKey(file) {
  return CACHE_PREFIX + file.replace(/[^\w]/g, '_');
}

function readCache(file) {
  try {
    const hit = wx.getStorageSync(cacheKey(file));
    if (!hit || !hit.at || !Array.isArray(hit.items)) return null;
    if (Date.now() - hit.at > CACHE_TTL) return null;
    return hit.items;
  } catch (e) {
    return null;
  }
}

function utf8Bytes(text) {
  let bytes = 0;
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    if (code < 0x80) bytes += 1;
    else if (code < 0x800) bytes += 2;
    else bytes += 3;
  }
  return bytes;
}

function readCacheMeta() {
  try {
    const value = wx.getStorageSync(CACHE_META_KEY);
    return value && typeof value === 'object' ? value : {};
  } catch (e) {
    return {};
  }
}

function pruneCache(cacheMeta, currentFile) {
  let keys = Object.keys(cacheMeta);
  let total = keys.reduce((sum, key) => sum + (cacheMeta[key].bytes || 0), 0);
  while (total > CACHE_TOTAL_BYTES && keys.length > 1) {
    const candidates = keys
      .filter((key) => key !== currentFile)
      .sort((a, b) => {
        const ai = cacheMeta[a].index ? 1 : 0;
        const bi = cacheMeta[b].index ? 1 : 0;
        if (ai !== bi) return ai - bi;
        return (cacheMeta[a].at || 0) - (cacheMeta[b].at || 0);
      });
    const victim = candidates[0];
    if (!victim) break;
    try {
      wx.removeStorageSync(cacheKey(victim));
    } catch (e) {
      // 单个 key 删除失败不阻断后续读取
    }
    total -= cacheMeta[victim].bytes || 0;
    delete cacheMeta[victim];
    keys = Object.keys(cacheMeta);
  }
}

function writeCache(file, items) {
  try {
    const raw = JSON.stringify(items);
    const bytes = utf8Bytes(raw);
    if (bytes > MAX_CACHE_BYTES) return;
    const at = Date.now();
    wx.setStorageSync(cacheKey(file), { at, items });
    const cacheMeta = readCacheMeta();
    cacheMeta[file] = {
      at,
      bytes,
      index: /\/index\.json$/.test(file)
    };
    pruneCache(cacheMeta, file);
    wx.setStorageSync(CACHE_META_KEY, cacheMeta);
  } catch (e) {
    // 超过本地存储上限时只保留内存缓存，不阻断阅读
  }
}

function parsePayload(data) {
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : null;
    } catch (e) {
      return null;
    }
  }
  return null;
}

// 索引是固定列数组 [id, title, meta, summary, shard]；同时兼容旧对象数组。
function normalizeIndex(data) {
  if (!Array.isArray(data)) return null;
  if (!data.length || !Array.isArray(data[0])) return data;
  return data.map((row) => ({
    id: row[0] || '',
    title: row[1] || '',
    meta: row[2] || '',
    summary: row[3] || '',
    shard: row[4] || ''
  }));
}

function loadFile(file, cb) {
  if (!file) {
    if (typeof cb === 'function') cb(new Error('unknown file'));
    return;
  }
  if (memory[file]) {
    if (typeof cb === 'function') cb(null, memory[file]);
    return;
  }
  const cached = readCache(file);
  if (cached) {
    memory[file] = cached;
    if (typeof cb === 'function') cb(null, cached);
    return;
  }
  if (inflight[file]) {
    inflight[file].push(cb);
    return;
  }
  inflight[file] = [cb];
  const done = (err, items) => {
    const list = inflight[file] || [];
    delete inflight[file];
    list.forEach((fn) => {
      if (typeof fn === 'function') fn(err, items);
    });
  };
  if (typeof wx.request !== 'function') {
    done(new Error('request unavailable'));
    return;
  }
  wx.request({
    url: BASE + file,
    method: 'GET',
    timeout: 15000,
    success: (res) => {
      const items = parsePayload(res && res.data);
      if (!items) {
        done(new Error('bad payload'));
        return;
      }
      memory[file] = items;
      writeCache(file, items);
      done(null, items);
    },
    fail: () => done(new Error('request fail'))
  });
}

function loadIndex(kind, type, cb) {
  const file = indexFileFor(kind, type);
  loadFile(file, (err, data) => {
    if (err) {
      if (typeof cb === 'function') cb(err);
      return;
    }
    const items = normalizeIndex(data);
    if (!items) {
      if (typeof cb === 'function') cb(new Error('bad index'));
      return;
    }
    if (typeof cb === 'function') cb(null, items);
  });
}

// 首屏轻量包：head.json = { total, step, parts, items }（items 与 index.json 同构的固定列数组）。
// 只在内存/缓存里存 normalize 后的 head 对象。
function loadHead(kind, type, cb) {
  const file = headFileFor(kind, type);
  if (!file) {
    if (typeof cb === 'function') cb(new Error('unknown dir'));
    return;
  }
  const hit = memory[file] || (() => {
    const cached = readCache(file);
    if (cached) memory[file] = cached;
    return cached;
  })();
  if (hit) {
    if (typeof cb === 'function') cb(null, hit);
    return;
  }
  if (inflight[file]) {
    inflight[file].push(cb);
    return;
  }
  inflight[file] = [cb];
  const done = (err, head) => {
    const list = inflight[file] || [];
    delete inflight[file];
    list.forEach((fn) => {
      if (typeof fn === 'function') fn(err, head);
    });
  };
  if (typeof wx.request !== 'function') {
    done(new Error('request unavailable'));
    return;
  }
  wx.request({
    url: BASE + file,
    method: 'GET',
    timeout: 15000,
    success: (res) => {
      const data = res && res.data;
      const raw =
        data && typeof data === 'object' && !Array.isArray(data)
          ? data
          : null;
      const items = raw ? normalizeIndex(raw.items) : null;
      if (!raw || !items || !Array.isArray(raw.items) || !raw.items.length) {
        done(new Error('bad head'));
        return;
      }
      const head = {
        total: raw.total || items.length,
        step: raw.step || 120,
        parts: raw.parts || 0,
        items
      };
      memory[file] = head;
      writeCache(file, head.items);
      done(null, head);
    },
    fail: () => done(new Error('request fail'))
  });
}

// head 首屏回调后，后台并行补齐剩余分块并合并成完整索引（写入 index.json 的内存与缓存）。
const assembling = {};

function fetchParts(kind, type, head, done) {
  const file = indexFileFor(kind, type);
  if (assembling[file]) {
    assembling[file].push(done);
    return;
  }
  assembling[file] = [done];
  let pending = head.parts;
  let failed = 0;
  const rows = [];
  const finish = () => {
    const list = assembling[file] || [];
    delete assembling[file];
    const full = normalizeIndex(head.items.concat(rows));
    memory[file] = full;
    writeCache(file, full);
    list.forEach((fn) => fn(failed));
  };
  for (let n = 1; n <= head.parts; n += 1) {
    loadFile(partFileFor(kind, type, n), (err, data) => {
      if (err || !Array.isArray(data)) failed += 1;
      else rows.push(...data);
      pending -= 1;
      if (!pending) finish();
    });
  }
}

function loadShard(kind, type, shard, cb) {
  const file = shardFileFor(kind, type, shard);
  loadFile(file, cb);
}

function resolveShard(kind, type, shard) {
  if (kind.indexOf('poems-') === 0) return shard || type || '';
  return shard || '';
}

function findIn(items, id) {
  return (items || []).find((x) => x.id === id);
}

function findByIndex(kind, type, id, cb) {
  loadIndex(kind, type, (err, items) => {
    if (err) {
      cb(err);
      return;
    }
    const hit = findIn(items, id);
    if (!hit || !hit.shard) {
      cb(new Error('not found'));
      return;
    }
    loadShard(kind, type, hit.shard, (shardErr, shardItems) => {
      if (shardErr) {
        cb(shardErr);
        return;
      }
      const item = findIn(shardItems, id);
      cb(item ? null : new Error('not found'), item);
    });
  });
}

// kind: cards | figures | events | wars | emperors | dynasty | quotes | wenyan | poemquotes | poems-<genre>
// type: cards 的分类 key（如 5）；poems-* 可传旧 shard。
// shard: 新的详情分卷 key（如 00）；不传时按索引查找并自动加载对应分卷。
function find(kind, type, id, shard, cb) {
  if (typeof shard === 'function') {
    cb = shard;
    shard = '';
  }
  const direct = resolveShard(kind, type, shard);
  if (!direct) {
    findByIndex(kind, type, id, cb);
    return;
  }
  loadShard(kind, type, direct, (err, items) => {
    if (!err) {
      const item = findIn(items, id);
      if (item) {
        cb(null, item);
        return;
      }
    }
    // 分享链接里的 shard 可能过期或被重新分卷；回退到索引重新定位。
    findByIndex(kind, type, id, cb);
  });
}

// 列表加载（2026-10-24 首屏提速）：
// 1) 完整索引已在内存/缓存 → 一次回调全量；
// 2) 否则先拉 head.json（~12KB）回调首屏（info.partial=true, info.total=全量条数），
//    后台并行拉 part-N.json 合并成完整索引后再次回调（partial=false）。
//    个别分块失败时保持 partial=true（列表可用，搜索范围提示受限）。
// 3) head.json 不可用（旧数据未拆分/请求失败）→ 回退拉整份 index.json。
function load(kind, type, cb) {
  const file = indexFileFor(kind, type);
  if (memory[file]) {
    if (typeof cb === 'function') cb(null, memory[file], { partial: false });
    return;
  }
  const cached = readCache(file);
  if (cached) {
    memory[file] = cached;
    if (typeof cb === 'function') cb(null, cached, { partial: false });
    return;
  }
  loadHead(kind, type, (err, head) => {
    if (err || !head || !head.items || !head.items.length) {
      loadIndex(kind, type, (err2, items) => {
        if (typeof cb === 'function') cb(err2 || err || new Error('bad index'), items, { partial: false });
      });
      return;
    }
    if (typeof cb === 'function') {
      cb(null, head.items, { partial: head.parts > 0, total: head.total });
    }
    if (!head.parts) {
      memory[file] = head.items;
      writeCache(file, head.items);
      return;
    }
    fetchParts(kind, type, head, (failed) => {
      if (typeof cb === 'function') {
        cb(null, memory[file], { partial: failed > 0, total: head.total });
      }
    });
  });
}

// 预取：只为提前写入内存与本地缓存，失败静默（列表/详情真正加载时会走同一套缓存）。
// 首屏提速关键在「点击之前」就发请求——资料库首页空闲预取各栏目 head，
// 点击入口时再触发一次（已缓存则瞬间返回），转场动画期间请求已在路上。
function prefetchHead(kind, type) {
  loadHead(kind, type, () => {});
}

function prefetchShard(kind, type, shard) {
  const file = shardFileFor(kind, type, shard);
  if (!file) return;
  if (memory[file] || readCache(file)) return;
  loadFile(file, () => {});
}

module.exports = {
  BASE,
  getMeta,
  dirFor,
  indexFileFor,
  headFileFor,
  shardFileFor,
  fileFor,
  load,
  loadIndex,
  loadHead,
  loadShard,
  find,
  prefetchHead,
  prefetchShard
};
