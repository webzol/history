// 文物栏目性能探针：加载真实列表/详情页代码，量 setData 载荷与次数、
// 首屏渲染行数、页面发起的请求数，并实测 jsDelivr 详情图可用性与延迟。
// 用法：node tools/relic_perf_probe.js [--net]
//   --net 额外抽样探测 CDN 详情图（testingcf 主域，gcore 备用域）
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
    if (opts.url.indexOf('/data/relics/') >= 0) {
      const rel = opts.url.split('/data/relics/')[1];
      try {
        const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'relics', rel), 'utf8'));
        opts.success({ data, statusCode: 200 });
      } catch (e) {
        if (opts.fail) opts.fail(e);
      }
      return;
    }
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

const catalog = require(path.join(ROOT, 'relics', 'catalog.js'));

function load(name, file) {
  currentFile = name;
  delete require.cache[require.resolve(file)];
  require(file);
}

function kb(n) { return (n / 1024).toFixed(n < 10240 ? 2 : 1) + ' KB'; }

function loadIndexRows() {
  const relicsDir = path.join(ROOT, 'data', 'relics');
  const head = JSON.parse(fs.readFileSync(path.join(relicsDir, 'index-head.json'), 'utf8'));
  const rows = head.rows.slice();
  for (let n = 1; n < head.parts; n++) {
    rows.push(...JSON.parse(fs.readFileSync(
      path.join(relicsDir, 'index-part-' + String(n).padStart(2, '0') + '.json'), 'utf8')).rows);
  }
  return { head, rows };
}

function main() {
  load('relic-list', path.join(ROOT, 'relics', 'pages', 'relic-list', 'relic-list.js'));
  const list = pages['relic-list'];
  const ledger = stats['relic-list'];
  const { head, rows: indexRows } = loadIndexRows();
  const index = { total: head.total, step: head.step, parts: head.parts, rows: indexRows };

  const t0 = Date.now();
  list.onLoad();
  const cateCalls = ledger.calls;
  const cateBytes = ledger.bytes;
  const cateCards = list.data.cateCards.length;
  const headKB = Math.round(fs.statSync(path.join(ROOT, 'data', 'relics', 'index-head.json')).size / 1024);

  // 点分类进网格（青铜）
  const beforeGrid = ledger.calls;
  list.enterGrid(1, 0);
  const gridCall = ledger.entries[beforeGrid];
  const gridRows = list.data.rows.length;

  list.loadMore();
  list.onReachBottom();
  const tailCalls = ledger.calls - cateCalls - 1;
  const tailBytes = ledger.entries.slice(beforeGrid + 1).reduce((s, e) => s + e.bytes, 0);

  // 反事实：一次渲染全部行（同一映射规则）
  const fullBytes = JSON.stringify(index.rows).length;
  const before = ledger.calls;
  list.updateFilters(1, 0);
  const filterCall = ledger.entries[before];
  const filterRows = list.data.rows.length;

  const partRequests = requests.filter((u) => u.indexOf('index-part-') >= 0).length;
  console.log(`== 文物列表（索引 ${index.total} 行，分类首屏 ${Date.now() - t0}ms） ==`);
  console.log(`首屏为分类视图：${cateCards} 张器类卡（计数/封面来自 head ${headKB}KB 单请求），onLoad setData ${cateCalls} 次 / ${kb(cateBytes)}`);
  console.log(`点「青铜」进网格：1 次 setData / ${gridCall.bytes} 字节（rows ${gridRows} 行）`);
  console.log(`行卡载荷 ≈ ${Math.round(gridCall.bytes / gridRows)} 字节/行；一次渲染 ${index.total} 行需 ${kb(fullBytes)}，分页后首屏只传 ${kb(gridCall.bytes)}（省 ${(100 * (1 - gridCall.bytes / fullBytes)).toFixed(1)}%）`);
  console.log(`续载 2 屏：${tailCalls} 次 setData / 合计 ${kb(tailBytes)}（rows[offset+i] 逐项追加）`);
  console.log(`网格内切筛选：1 次 setData / ${filterCall.bytes} 字节（rows 重置 ${filterRows} 行 + 计数）`);
  console.log(`wx.request 次数（列表冷启动）：首屏 1 次 head + 后台补齐 ${partRequests} 次 part = ${requests.length}（缩略图走 <image> 不计）`);

  requests.length = 0;
  load('relic-detail', path.join(ROOT, 'relics', 'pages', 'relic-detail', 'relic-detail.js'));
  const detail = pages['relic-detail'];
  // 精修件（包内快路径）
  detail.onLoad({ id: 'cma-1952.510' });
  const d1 = stats['relic-detail'];
  console.log('== 文物详情（精修件，包内快路径） ==');
  console.log(`onLoad setData ${d1.calls} 次 / ${kb(d1.bytes)}；wx.request ${requests.length} 次`);

  // 批量件（索引定位 + 详情分卷）
  const bulkRow = index.rows[index.rows.length - 2];
  const before2 = requests.length;
  const callsBefore = stats['relic-detail'].calls;
  const bytesBefore = stats['relic-detail'].bytes;
  detail.onLoad({ id: bulkRow.id });
  const d2 = stats['relic-detail'];
  console.log('== 文物详情（批量件，索引+分卷） ==');
  console.log(`onLoad setData ${d2.calls - callsBefore} 次 / ${kb(d2.bytes - bytesBefore)}；wx.request ${requests.length - before2} 次（index 缓存后仅 detail 分卷 1 次）`);
}

main();

// ---------------------------------------------------------------------------
// 可选：抽样探测 CDN 详情图（主域 + 备用域）
// ---------------------------------------------------------------------------

async function probeNet() {
  const { rows: indexRows } = loadIndexRows();
  const total = indexRows.length;
  const sample = [];
  for (let i = 0; i < total; i += Math.ceil(total / 12)) {
    sample.push(indexRows[i].id);
  }
  const rows = [];
  for (const id of sample) {
    const url = `https://testingcf.jsdelivr.net/gh/webzol/history@main/miniprogram/data/img/relics/${id}.jpg`;
    const t0 = Date.now();
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(25000) });
      const size = res.ok ? (await res.arrayBuffer()).byteLength : 0;
      rows.push({ id, status: res.status, ms: Date.now() - t0, size });
    } catch (e) {
      rows.push({ id, status: 'ERR', ms: Date.now() - t0, size: 0 });
    }
    await delay(400);
  }
  rows.sort((a, b) => a.ms - b.ms);
  const okRows = rows.filter((r) => r.status === 200);
  const pick = (q) => okRows[Math.min(okRows.length - 1, Math.floor(q * (okRows.length - 1)))];
  console.log(`== CDN 主域抽样（${okRows.length}/${rows.length} 张 200） ==`);
  if (okRows.length) {
    console.log(`延迟 p50 ${pick(0.5).ms}ms / 最大 ${okRows[okRows.length - 1].ms}ms；单图 p50 ${kb(pick(0.5).size)}`);
  }
  rows.filter((r) => r.status !== 200).forEach((r) => console.log(` - ${r.id} ${r.status}`));

  const alt = sample[1];
  const t1 = Date.now();
  const res = await fetch(`https://gcore.jsdelivr.net/gh/webzol/history@main/miniprogram/data/img/relics/${alt}.jpg`, { signal: AbortSignal.timeout(25000) });
  console.log(`== 备用域 gcore 抽样 == ${alt} ${res.status} ${Date.now() - t1}ms`);
}

if (process.argv.includes('--net')) probeNet().catch((e) => { console.error(e.message); process.exitCode = 1; });
