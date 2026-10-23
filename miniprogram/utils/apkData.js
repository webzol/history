// APK 资料库远端数据：按需加载，减少主包体积。
// 数据由 tools/import_apk_data.py 生成，放在 data/apk/ 下并从主包排除，
// 通过 jsDelivr 读取；首次打开某类后写入本地缓存，7 天内离线可读。
const meta = require('../data/archive-meta.js');

const BASE =
  'https://cdn.jsdelivr.net/gh/webzol/history@main/miniprogram/data/apk/';
const CACHE_PREFIX = 'shige_apk_';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
// 单类数据过大时只放内存，避免挤占小程序 10MB 本地存储
const MAX_CACHE_BYTES = 1.5 * 1024 * 1024;
const memory = {};
const inflight = {};

const FILES = {
  figures: 'figures.json',
  events: 'events.json',
  wars: 'wars.json',
  emperors: 'emperors.json',
  dynasty: 'dynasty-events.json',
  quotes: 'quotes.json',
  wenyan: 'wenyanwen.json',
  poemquotes: 'poem-quotes.json'
};

function getMeta() {
  return meta;
}

function fileFor(kind, type) {
  if (kind === 'cards') return type ? `cards/${type}.json` : '';
  if (kind.indexOf('poems-') === 0) {
    const genre = kind.slice(6);
    return type ? `poems/${genre}/${type}.json` : `poems/${genre}/index.json`;
  }
  return FILES[kind] || '';
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

function writeCache(file, items) {
  try {
    const raw = JSON.stringify(items);
    if (utf8Bytes(raw) > MAX_CACHE_BYTES) return;
    wx.setStorageSync(cacheKey(file), { at: Date.now(), items });
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

// kind: cards | figures | events | wars | emperors | dynasty | quotes | wenyan | poemquotes | poems-<genre>
// type: cards 的分类 key（如 5）
function load(kind, type, cb) {
  const file = fileFor(kind, type);
  if (!file) {
    if (typeof cb === 'function') cb(new Error('unknown kind'));
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

function find(kind, type, id, cb) {
  load(kind, type, (err, items) => {
    if (err) {
      cb(err);
      return;
    }
    const item = items.find((x) => x.id === id);
    cb(item ? null : new Error('not found'), item);
  });
}

module.exports = {
  BASE,
  getMeta,
  fileFor,
  load,
  find
};
