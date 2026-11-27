const REPO = '/gh/webzol/history@main/miniprogram/data/relics/v1/';
const JSON_BASE = `https://cdn.jsdelivr.net${REPO}`;
const IMAGE_BASE = `https://testingcf.jsdelivr.net${REPO}`;
const ALT_IMAGE_BASE = `https://gcore.jsdelivr.net${REPO}`;
const PAGE_SIZE = 8;
const ID_PATTERN = /^(?:\d+|cma-\d{4}\.[0-9a-z.-]+)$/;
const CACHE_LIMIT = 24;
const cache = new Map();
const pending = new Map();

function requestJson(file, validate, done) {
  if (cache.has(file)) {
    const value = cache.get(file);
    cache.delete(file);
    cache.set(file, value);
    done(null, value);
    return;
  }
  if (pending.has(file)) {
    pending.get(file).push(done);
    return;
  }
  pending.set(file, [done]);
  function finish(error, value) {
    const listeners = pending.get(file);
    pending.delete(file);
    if (!error && value) {
      cache.set(file, value);
      if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value);
    }
    listeners.forEach(listener => listener(error, value));
  }
  wx.request({
    url: JSON_BASE + file,
    timeout: 5000,
    success(response) {
      if (response.statusCode === 404 && file.startsWith('detail/')) return finish(null, null);
      if (response.statusCode !== 200 || !validate(response.data)) return finish(new Error(`文物数据不可用：${file}`));
      finish(null, response.data);
    },
    fail: (error) => finish(error || new Error(`文物数据获取失败：${file}`))
  });
}

function getManifest(done) {
  requestJson('manifest.json', data => data?.version === 1 && data.pageSize === PAGE_SIZE
    && data.groups && typeof data.groups === 'object' && !Array.isArray(data.groups), done);
}

function groupFor(manifest, type = '', era = '') {
  const group = manifest?.groups[`${type}|${era}`];
  return group && /^[0-9]+-[0-9]+$/.test(group.key) && Number.isSafeInteger(group.count) && group.count > 0 ? group : null;
}

function getPage(group, page, done) {
  const expected = Math.min(PAGE_SIZE, group.count - page * PAGE_SIZE);
  requestJson(`list/${group.key}/${page}.json`, data => Array.isArray(data?.rows) && data.rows.length === expected
    && new Set(data.rows.map(row => row?.id)).size === expected
    && data.rows.every(row => row && typeof row.id === 'string' && ID_PATTERN.test(row.id)
      && typeof row.title === 'string' && row.title && typeof row.period === 'string' && row.period
      && typeof row.type === 'string' && row.type), done);
}

function getDetail(id, done) {
  if (typeof id !== 'string' || !ID_PATTERN.test(id)) return done(null, null);
  requestJson(`detail/${id}.json`, data => data?.id === id && data.title && data.period && data.type
    && data.date && data.description && data.accession && Number.isFinite(data.imageRatio) && data.imageRatio > 0, done);
}

function imageUrl(id, size) { return `${IMAGE_BASE}images/${size}-${id}.jpg`; }

function alternateImage(url) {
  return url.startsWith(IMAGE_BASE) ? ALT_IMAGE_BASE + url.slice(IMAGE_BASE.length) : '';
}

module.exports = { PAGE_SIZE, ID_PATTERN, getManifest, groupFor, getPage, getDetail, imageUrl, alternateImage };
