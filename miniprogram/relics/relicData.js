// 文物目录分片加载器：index.json 全量索引 + detail-NN.json 详情分卷，
// 经 jsDelivr 分发（testingcf 主域 → gcore 备用域），内存 + 7 天本地缓存。
// 精修 60 件（catalog.js）始终走包内快路径，批量条目走远端。
const { RELICS, sourceFor, detailUrls, imagePath } = require('./catalog.js');

const INDEX_URLS = [
  'https://testingcf.jsdelivr.net/gh/webzol/history@main/miniprogram/data/relics/index.json',
  'https://gcore.jsdelivr.net/gh/webzol/history@main/miniprogram/data/relics/index.json'
];
const DETAIL_URLS = (n) => [
  `https://testingcf.jsdelivr.net/gh/webzol/history@main/miniprogram/data/relics/detail-${String(n).padStart(2, '0')}.json`,
  `https://gcore.jsdelivr.net/gh/webzol/history@main/miniprogram/data/relics/detail-${String(n).padStart(2, '0')}.json`
];
const INDEX_KEY = 'shige_relic_index_v1';
const DETAIL_KEY_PREFIX = 'shige_relic_det_v1_';
const TTL = 7 * 24 * 60 * 60 * 1000;

// 精修条目快路径：id → 详情对象（与列表行一起构建）
const curatedById = {};
const curatedThumb = {};
RELICS.forEach((item) => {
  curatedById[item.id] = item;
  curatedThumb[item.id] = true;
});

const memory = { index: null, indexPending: null, shards: {} };

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

// 全量索引（rows: [{id,title,period,type}]）。cb(rows|null)，失败 cb(null) 由页面兜底。
function loadIndex(cb) {
  if (memory.index) return cb(memory.index);
  if (memory.indexPending) return memory.indexPending.push(cb);
  memory.indexPending = [cb];
  const done = (rows) => {
    if (rows) memory.index = rows;
    const pending = memory.indexPending;
    memory.indexPending = null;
    pending.forEach((fn) => fn(rows));
  };
  const cached = readCache(INDEX_KEY);
  if (cached && Array.isArray(cached.rows) && cached.rows.length) return done(cached.rows);
  fetchJson(INDEX_URLS, (data) => {
    if (data && Array.isArray(data.rows) && data.rows.length) {
      writeCache(INDEX_KEY, data);
      done(data.rows);
    } else {
      done(null);
    }
  });
}

// 单件详情：精修走包内；批量按 index 定位分卷加载。
// cb({ relic, source } | null)，source: 'curated' | 'remote'
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
  loadIndex((rows) => {
    if (!rows) return cb(null);
    const pos = rows.findIndex((row) => row.id === id);
    if (pos < 0) return cb(null);
    const shard = Math.floor(pos / 200);
    const give = (entry) => {
      if (!entry) return cb(null);
      const { museum, url, rights } = sourceFor(id);
      cb({
        source: 'remote',
        relic: {
          id, title: entry.title, type: rows[pos].type, period: entry.period, date: entry.date,
          material: entry.material, dimensions: entry.dimensions, accession: entry.accession,
          description: entry.description, imageNote: entry.imageNote || '',
          imageRatio: entry.imageRatio, museum, url, rights,
          image: detailUrls(id)[0], imageThumb: '', template: !!entry.t
        }
      });
    };
    const key = DETAIL_KEY_PREFIX + shard;
    const cached = readCache(key);
    if (cached && cached.items && cached.items[id]) return give(cached.items[id]);
    if (memory.shards[shard]) return give(memory.shards[shard][id] || null);
    fetchJson(DETAIL_URLS(shard), (data) => {
      if (data && data.items) {
        memory.shards[shard] = data.items;
        writeCache(key, data);
        give(data.items[id] || null);
      } else {
        give(null);
      }
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
