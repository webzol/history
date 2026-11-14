// 太阳码批量生成：stable_token → getwxacodeunlimit，输出 data/img/wxacode/<分组>/<id>.jpg。
// 用法：WX_APPSECRET=xxx node tools/gen_wxacode.js [--dry] [--only a,b] [--force] [--prune]
//   --dry        只构建清单并校验 scene，不调微信接口、不需要 AppSecret
//   --only       只生成指定分组（逗号分隔：person,event,period,figures,emperors,cards,poems-shi...）
//   --force      已存在的码图也重新生成（默认 skip-if-exists 增量）
//   --prune      删除清单外遗留码图（数据下线后清理）
// 触发：GitHub Actions（.github/workflows/wxacode.yml）在数据变更 push 后自动增量生成。
// scene/文件名规则复用 miniprogram/utils/wxacode.js（与小程序端单一样式来源）。
//
// 微信接口错误处理：
//   89503 需管理员确认 → 每 30s 重试并提示管理员在微信上确认（Actions IP 动态的固有流程）
//   40164 IP 不在白名单 → 给出指引后退出（白名单无法容纳 Actions 动态 IP，走 89503 确认或本地运行）
//   40001 token 失效 → 重取一次；45009/45011 限流 → 退避 30s；40129/41030 记录失败继续
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..', 'miniprogram');
const OUT = path.join(ROOT, 'data', 'img', 'wxacode');
const wxacode = require(path.join(ROOT, 'utils', 'wxacode.js'));
const seed = require(path.join(ROOT, 'data', 'history.js'));
const meta = require(path.join(ROOT, 'data', 'archive-meta.js'));

const API_BASE = 'https://api.weixin.qq.com';
const WIDTH = 280; // getwxacodeunlimit 出图边长（下限 280），海报 54px + 3 倍导出足够清晰
const CONCURRENCY = 4;
const WORKER_DELAY = 150; // 每个 worker 每次请求后节流，避开 45009 限流

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const flag = (name) => args.indexOf(name) >= 0;
const onlyArg = flag('--only') ? (args[args.indexOf('--only') + 1] || '').split(',').filter(Boolean) : null;
const DRY = flag('--dry');
const FORCE = flag('--force');
const PRUNE = flag('--prune');

const log = (...parts) => console.log(new Date().toISOString().slice(11, 19), ...parts);

// ---------------------------------------------------------------------------
// 短哈希：sha1(id) 前 12 位 base36（仅生成端使用，客户端只查 idx 清单不计算）
// ---------------------------------------------------------------------------

const B36 = '0123456789abcdefghijklmnopqrstuvwxyz';
function shortHash(s) {
  const hex = crypto.createHash('sha1').update(String(s), 'utf8').digest('hex');
  let n = BigInt('0x' + hex);
  let out = '';
  while (out.length < 12) {
    out = B36[Number(n % 36n)] + out;
    n /= 36n;
  }
  return out;
}

// ---------------------------------------------------------------------------
// 清单构建：主库三页（history.js 种子）+ 资料库全栏目（data/apk 各 index.json）
// ---------------------------------------------------------------------------

function apkIndexIds(dir) {
  const file = path.join(ROOT, 'data', 'apk', dir, 'index.json');
  const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
  const ids = [];
  rows.forEach((row) => {
    const id = Array.isArray(row) ? row[0] : row && row.id;
    if (id) ids.push(String(id));
  });
  return ids;
}

function collectTasks() {
  const tasks = [];
  const seen = new Set();

  const push = (target) => {
    const file = wxacode.codeFileOf(target);
    const scene = wxacode.sceneOf(target, shortHash);
    if (!file || !scene) {
      console.error('  无法编码（跳过）：', JSON.stringify(target));
      return;
    }
    const key = file;
    if (seen.has(key)) {
      console.error('  码图文件重名（跳过）：', file, JSON.stringify(target));
      return;
    }
    seen.add(key);
    tasks.push({ target, file, scene, hashed: scene.indexOf('&h=') >= 0 });
  };

  seed.persons.forEach((p) => push({ page: 'person', id: p.id }));
  seed.events.forEach((e) => push({ page: 'event', id: e.id }));
  seed.periods.forEach((p) => push({ page: 'period', id: p.id }));

  // 资料库：八栏 + cards 分类 + poems 体裁，栏目清单以短码表为准（与解码同源）
  Object.keys(wxacode.SHORT_OF_KIND).forEach((kind) => {
    if (kind === 'cards') {
      (meta.categories || []).forEach((cat) => {
        apkIndexIds('cards/' + cat.key).forEach((id) => push({ page: 'archive', kind, type: cat.key, id }));
      });
      return;
    }
    const dir = kind.indexOf('poems-') === 0 ? 'poems/' + kind.slice(6) : kind;
    apkIndexIds(dir).forEach((id) => push({ page: 'archive', kind, id }));
  });

  return tasks;
}

// 超限 id 的 idx 清单：{hash: id}，按 id 排序写入保证 diff 稳定
function buildIdxMaps(tasks) {
  const maps = {};
  tasks.forEach((t) => {
    if (!t.hashed) return;
    const kind = t.target.kind;
    const hash = t.scene.split('&h=')[1];
    (maps[kind] = maps[kind] || {})[hash] = t.target.id;
  });
  return maps;
}

function writeIdxMaps(maps) {
  const dir = path.join(OUT, 'idx');
  fs.mkdirSync(dir, { recursive: true });
  // 清掉数据下线后不再需要的 idx 清单
  const keep = new Set(Object.keys(maps).map((k) => k + '.json'));
  fs.readdirSync(dir).forEach((name) => {
    if (name.endsWith('.json') && !keep.has(name)) fs.unlinkSync(path.join(dir, name));
  });
  Object.keys(maps).forEach((kind) => {
    const map = maps[kind];
    const ordered = {};
    Object.keys(map).sort((a, b) => (map[a] < map[b] ? -1 : 1)).forEach((h) => {
      ordered[h] = map[h];
    });
    fs.writeFileSync(path.join(dir, kind + '.json'), JSON.stringify(ordered), 'utf8');
    log(`idx ${kind}.json：${Object.keys(ordered).length} 条超限 id`);
  });
}

// ---------------------------------------------------------------------------
// 微信接口
// ---------------------------------------------------------------------------

let appid = process.env.WX_APPID || '';
let appsecret = process.env.WX_APPSECRET || '';
let accessToken = '';
let tokenRefreshed = 0;

function loadAppid() {
  if (appid) return;
  const conf = JSON.parse(fs.readFileSync(path.join(ROOT, 'project.config.json'), 'utf8'));
  appid = conf.appid || '';
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callApi(url, body) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal
    });
    const buf = Buffer.from(await res.arrayBuffer());
    return { status: res.status, buf, type: res.headers.get('content-type') || '' };
  } finally {
    clearTimeout(timer);
  }
}

function jsonOf(buf) {
  try {
    return JSON.parse(buf.toString('utf8'));
  } catch (e) {
    return null;
  }
}

async function fetchToken() {
  const res = await callApi(API_BASE + '/cgi-bin/stable_token', {
    grant_type: 'client_credential',
    appid,
    secret: appsecret,
    force_refresh: false
  });
  const data = jsonOf(res.buf) || {};
  if (data.access_token) {
    accessToken = data.access_token;
    return;
  }
  const code = data.errcode || 0;
  if (code === 89503) {
    throw Object.assign(new Error('NEED_ADMIN_CONFIRM'), { code, retriable: true });
  }
  if (code === 40164) {
    console.error('');
    console.error('调用接口的 IP 不在白名单（40164）。两条路：');
    console.error('  1. 公众平台「开发管理-开发设置-服务器域名/IP白名单」加当前出口 IP（本地运行适用）；');
    console.error('  2. GitHub Actions 出口 IP 动态，加不了白名单 —— 保持 89503 管理员确认流程：');
    console.error('     运行时微信会给小程序管理员推确认消息，确认后本次调用放行。');
    throw Object.assign(new Error('IP_NOT_WHITELISTED'), { code, fatal: true });
  }
  throw Object.assign(new Error('token failed: ' + JSON.stringify(data)), { code, fatal: true });
}

async function ensureToken() {
  if (accessToken) return;
  for (let i = 0; i < 20; i += 1) {
    try {
      await fetchToken();
      return;
    } catch (e) {
      if (e.code === 89503) {
        log('89503：等待管理员在微信「公众平台安全中心」确认本次调用…（已重试 ' + (i + 1) + '/20）');
        await sleep(30000);
        continue;
      }
      throw e;
    }
  }
  throw new Error('管理员确认超时（20 次 × 30s），请重新触发 workflow');
}

// 单张码图生成，返回 'ok' | 'skip' | 'fail'
async function generateOne(task, state) {
  const out = path.join(OUT, task.file);
  if (!FORCE && fs.existsSync(out) && fs.statSync(out).size > 500) return 'skip';

  const page = wxacode.pageOf(task.target);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await ensureToken();
    try {
      const res = await callApi(API_BASE + '/wxa/getwxacodeunlimit?access_token=' + accessToken, {
        page,
        scene: task.scene,
        width: WIDTH,
        check_path: true,
        env_version: 'release'
      });
      const err = jsonOf(res.buf);
      if (err && err.errcode) {
        const code = err.errcode;
        if (code === 40001 && tokenRefreshed < 2) {
          tokenRefreshed += 1;
          accessToken = '';
          continue;
        }
        if ((code === 45009 || code === 45011) && attempt < 4) {
          log('限流 ' + code + '，退避 30s…');
          await sleep(30000);
          continue;
        }
        if (code === 40129 || code === 41030) {
          console.error('  ' + code + ' ' + (err.errmsg || '') + '：' + page + ' scene=' + task.scene);
          return 'fail';
        }
        console.error('  接口错误 ' + code + ' ' + (err.errmsg || '') + '：' + task.file);
        return 'fail';
      }
      if (res.buf.length < 500) {
        console.error('  返回过小（' + res.buf.length + 'B）：' + task.file);
        return 'fail';
      }
      fs.mkdirSync(path.dirname(out), { recursive: true });
      const existing = fs.existsSync(out) ? fs.readFileSync(out) : null;
      if (!existing || !existing.equals(res.buf)) {
        fs.writeFileSync(out, res.buf);
        state.written += 1;
      } else {
        state.untouched += 1;
      }
      return 'ok';
    } catch (e) {
      if (attempt < 4) {
        await sleep(1500 * (attempt + 1));
        continue;
      }
      console.error('  网络失败放弃：' + task.file + ' ' + e.message);
      return 'fail';
    }
  }
  return 'fail';
}

// 清理清单外遗留码图（--prune）
function pruneTasks(tasks) {
  const keep = new Set(tasks.map((t) => t.file));
  let removed = 0;
  const walk = (dir, rel) => {
    fs.readdirSync(dir).forEach((name) => {
      const full = path.join(dir, name);
      const r = rel ? rel + '/' + name : name;
      if (fs.statSync(full).isDirectory()) {
        walk(full, r);
        return;
      }
      if ((r.endsWith('.jpg') || r.endsWith('.png')) && !keep.has(r)) {
        fs.unlinkSync(full);
        removed += 1;
      }
    });
  };
  if (fs.existsSync(OUT)) walk(OUT, '');
  log('prune：清理清单外码图 ' + removed + ' 张');
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------

async function main() {
  const t0 = Date.now();
  const tasks = collectTasks();

  // 过滤 --only
  const all = onlyArg ? tasks.filter((t) => {
    const group = wxacode.groupOf(t.target);
    return onlyArg.some((o) => group === o || group.indexOf(o + '-') === 0 || t.target.page === o);
  }) : tasks;
  if (onlyArg) log('only 过滤：' + all.length + '/' + tasks.length);

  // 分组统计 + scene 全量自校验
  const byGroup = {};
  let hashed = 0;
  let invalid = 0;
  all.forEach((t) => {
    byGroup[wxacode.groupOf(t.target)] = (byGroup[wxacode.groupOf(t.target)] || 0) + 1;
    if (t.hashed) hashed += 1;
    if (!wxacode.validScene(t.scene) || t.scene.length > 32) {
      invalid += 1;
      console.error('  scene 非法！' + t.scene + '（' + t.file + '）');
    }
  });
  log('清单 ' + all.length + ' 张（超限走 idx 的 ' + hashed + ' 张，scene 非法 ' + invalid + ' 张）');
  Object.keys(byGroup).sort().forEach((g) => log('  ' + g + ': ' + byGroup[g]));
  if (invalid > 0) process.exit(1);

  const maps = buildIdxMaps(all);
  if (DRY) {
    log('dry 样例：');
    ['person', 'event', 'period', 'figures', 'emperors', 'cards'].forEach((g) => {
      const t = all.find((x) => wxacode.groupOf(x.target) === g);
      if (t) log('  [' + g + '] ' + t.scene + ' → ' + t.file);
    });
    Object.keys(maps).forEach((k) => log('  idx/' + k + '.json 将写入 ' + Object.keys(maps[k]).length + ' 条'));
    log('dry 完成（未调接口）。');
    return;
  }

  if (!appsecret) {
    console.error('缺少 WX_APPSECRET 环境变量（GitHub Secrets 或本地 export）。');
    process.exit(1);
  }
  loadAppid();
  log('appid ' + appid + '，开始生成…');

  const state = { written: 0, untouched: 0, skipped: 0, failed: 0 };
  let cursor = 0;
  const worker = async () => {
    while (cursor < all.length) {
      const task = all[cursor];
      cursor += 1;
      const r = await generateOne(task, state);
      if (r === 'skip') state.skipped += 1;
      if (r === 'fail') state.failed += 1;
      const done = state.written + state.untouched + state.skipped + state.failed;
      if (done % 500 === 0) {
        log('进度 ' + done + '/' + all.length +
          '（写 ' + state.written + ' 未变 ' + state.untouched + ' 跳 ' + state.skipped + ' 败 ' + state.failed + '）');
      }
      await sleep(WORKER_DELAY);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  writeIdxMaps(maps);
  if (PRUNE) pruneTasks(all);

  log('完成：新写 ' + state.written + '，内容未变 ' + state.untouched + '，已存在跳过 ' + state.skipped +
    '，失败 ' + state.failed + '，用时 ' + Math.round((Date.now() - t0) / 1000) + 's');
  if (state.failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error('gen_wxacode:', e.message);
  process.exit(1);
});
