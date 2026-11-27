// 文物栏目性能探针：加载真实列表/详情页代码，量 setData 载荷与次数、
// 首屏渲染行数、页面发起的请求数，并实测 jsDelivr 详情图可用性与延迟。
// 用法：node tools/relic_perf_probe.js [--net]
//   --net 额外全量探测 60 张详情图（testingcf 主域，gcore 抽样）
'use strict';

const fs = require('fs');
const path = require('path');
const { setTimeout: delay } = require('node:timers/promises');

const ROOT = path.join(__dirname, '..', 'miniprogram');

// ---------------------------------------------------------------------------
// wx / Page mock（与 selftest 同型，最小集）
// ---------------------------------------------------------------------------

const storage = {};
const requests = [];
const wx = {
  setStorageSync(k, v) { storage[k] = v; },
  getStorageSync(k) { return Object.prototype.hasOwnProperty.call(storage, k) ? storage[k] : ''; },
  removeStorageSync(k) { delete storage[k]; },
  clearStorageSync() { Object.keys(storage).forEach((k) => delete storage[k]); },
  showShareMenu() {},
  showToast() {},
  showModal() {},
  showLoading() {},
  hideLoading() {},
  request(opts) {
    requests.push(opts.url);
    if (opts.fail) opts.fail(new Error('probe offline'));
  },
  navigateTo() {},
  redirectTo() {},
  switchTab() {},
  navigateBack() {},
  createSelectorQuery() {
    const chain = {};
    ['in', 'select', 'fields'].forEach((m) => { chain[m] = () => chain; });
    chain.exec = (cb) => cb([]);
    return chain;
  }
};
global.wx = wx;
global.App = (cfg) => cfg;
global.getApp = () => ({ globalData: {} });

const stats = {};
const pages = {};
let currentFile = '';

global.Page = (cfg) => {
  const page = Object.assign({ __name: currentFile, data: JSON.parse(JSON.stringify(cfg.data || {})) }, cfg);
  const ledger = stats[currentFile] = { calls: 0, bytes: 0, entries: [] };
  Object.defineProperty(page, 'setData', {
    value(patch, cb) {
      const json = JSON.stringify(patch);
      ledger.calls += 1;
      ledger.bytes += json.length;
      ledger.entries.push({ keys: Object.keys(patch).join(','), bytes: json.length });
      Object.keys(patch).forEach((key) => {
        const seg = key.replace(/\[(\d+)\]/g, '.$1').split('.');
        let node = page.data;
        for (let i = 0; i < seg.length - 1; i++) {
          if (node[seg[i]] === undefined || typeof node[seg[i]] !== 'object') node[seg[i]] = {};
          node = node[seg[i]];
        }
        node[seg[seg.length - 1]] = patch[key];
      });
      if (cb) cb();
    }
  });
  pages[currentFile] = page;
};

['font', 'share', 'qrshare'].forEach((util) => {
  const file = path.join(ROOT, 'utils', `${util}.js`);
  delete require.cache[require.resolve(file)];
  require(file);
});

const catalog = require(path.join(ROOT, 'relics', 'catalog.js'));

function load(name, file) {
  currentFile = name;
  delete require.cache[require.resolve(file)];
  require(file);
}

function kb(n) { return (n / 1024).toFixed(n < 10240 ? 2 : 1) + ' KB'; }

function main() {
  load('relic-list', path.join(ROOT, 'relics', 'pages', 'relic-list', 'relic-list.js'));
  const list = pages['relic-list'];
  const ledger = stats['relic-list'];
  list.onLoad();
  const firstCalls = ledger.calls;
  const firstBytes = ledger.bytes;
  const firstRows = list.data.rows.length;
  const rowBytes = ledger.entries.slice(0, firstCalls)
    .filter((e) => e.keys.indexOf('rows') >= 0)
    .reduce((s, e) => s + e.bytes, 0);
  const chromeBytes = firstBytes - rowBytes;
  list.loadMore();
  list.onReachBottom();
  list.onReachBottom();
  const tailCalls = ledger.calls - firstCalls;
  const tailBytes = ledger.entries.slice(firstCalls).reduce((s, e) => s + e.bytes, 0);
  const perRow = Math.round(rowBytes / firstRows);
  const finalRows = list.data.rows.length;

  // 反事实：一次渲染全部 60 行的载荷（同一映射规则）
  const mapRow = ({ id, title, period, shortPeriod, type }) => ({
    id, title, period: shortPeriod || period, type, thumb: catalog.imagePath(id, 'thumb')
  });
  const fullBytes = JSON.stringify(catalog.RELICS.map(mapRow)).length;

  // 筛选：器类→青铜
  const before = ledger.calls;
  list.updateFilters(1, 0);
  const filterCall = ledger.entries[before];
  const filterRows = list.data.rows.length;

  console.log('== 文物列表 ==');
  console.log(`目录 ${catalog.RELICS.length} 件；首屏渲染 ${firstRows} 行，3 次续载后 ${finalRows} 行（全量 ${catalog.RELICS.length} 行）`);
  console.log(`onLoad setData ${firstCalls} 次 / ${kb(firstBytes)}（rows ${kb(rowBytes)} + 框架状态 ${kb(chromeBytes)}）`);
  console.log(`行卡载荷 ≈ ${perRow} 字节/行；一次渲染 ${catalog.RELICS.length} 行需 ${kb(fullBytes)}，分页后首屏只传 ${kb(rowBytes)}（省 ${(100 * (1 - rowBytes / fullBytes)).toFixed(0)}%）`);
  console.log(`续载 3 屏：${tailCalls} 次 setData / 合计 ${kb(tailBytes)}（rows[offset] 路径只追加新一批，不整组重发）`);
  console.log(`切筛选青铜：1 次 setData / ${filterCall.bytes} 字节（rows 重置 ${filterRows} 行 + 计数）`);
  console.log(`wx.request 次数（列表全流程）：${requests.length}（缩略图为包内文件，不走网络）`);

  requests.length = 0;
  load('relic-detail', path.join(ROOT, 'relics', 'pages', 'relic-detail', 'relic-detail.js'));
  const detail = pages['relic-detail'];
  detail.onLoad({ id: 'cma-1952.510' });
  const d = stats['relic-detail'];
  console.log('== 文物详情 ==');
  console.log(`onLoad setData ${d.calls} 次 / ${kb(d.bytes)}（单件字段：标题/简介/四 facts/授权/比例）`);
  console.log('详情大图：<image> 按需加载 1 张（testingcf 主域，失败步进 gcore，再失败降级包内缩略图）');
  console.log(`wx.request 次数（详情打开）：${requests.length}`);
}

main();

// ---------------------------------------------------------------------------
// 可选：全量探测 CDN 详情图（主域全量 + 备用域抽样）
// ---------------------------------------------------------------------------

async function probeNet() {
  const ids = catalog.RELICS.map((r) => r.id);
  const urls = ids.map((id) => [id, catalog.detailUrls(id)[0]]);
  const rows = [];
  let next = 0;
  const failures = [];
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (next < urls.length) {
      const [id, url] = urls[next++];
      for (let attempt = 0; attempt < 2; attempt++) {
        const t0 = Date.now();
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
          const ms = Date.now() - t0;
          if (res.ok) {
            const buf = await res.arrayBuffer();
            rows.push({ id, ms, size: buf.byteLength });
            break;
          }
          if (attempt === 1) failures.push(`${id}: HTTP ${res.status}`);
        } catch (e) {
          if (attempt === 1) failures.push(`${id}: ${e.message}`);
        }
        await delay(800);
      }
    }
  }));
  rows.sort((a, b) => a.ms - b.ms);
  const pick = (q) => rows[Math.min(rows.length - 1, Math.floor(q * (rows.length - 1)))];
  const totalBytes = rows.reduce((s, r) => s + r.size, 0);
  console.log(`== CDN 主域 testingcf 全量探测（${rows.length}/${ids.length} 张 200） ==`);
  if (rows.length) {
    console.log(`延迟 p50 ${pick(0.5).ms}ms / p95 ${pick(0.95).ms}ms / 最大 ${rows[rows.length - 1].ms}ms；单图 p50 ${kb(pick(0.5).size)}；全部合计 ${kb(totalBytes)}`);
  }
  if (failures.length) console.log('失败：\n - ' + failures.join('\n - '));

  // 备用域抽 8 张（模拟主域失败后换 gcore）
  const sample = ids.filter((_, i) => i % 8 === 0).map((id) => [id, catalog.detailUrls(id)[1]]);
  const gcore = [];
  for (const [id, url] of sample) {
    const t0 = Date.now();
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
      gcore.push(`${id} ${res.status} ${Date.now() - t0}ms`);
    } catch (e) {
      gcore.push(`${id} ERR ${e.message}`);
    }
  }
  console.log('== 备用域 gcore 抽样 ==');
  gcore.forEach((line) => console.log(' - ' + line));
}

if (process.argv.includes('--net')) probeNet().catch((e) => { console.error(e.message); process.exitCode = 1; });
