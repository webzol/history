// 交互自测：加载真实页面代码与数据，mock wx / Page，
// 模拟生命周期与点击，逐条断言数据状态与路由行为。
// 用法：node tools/selftest.js

'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');

const ROOT = path.join(__dirname, '..', 'miniprogram');
const qrshare = require(path.join(ROOT, 'utils', 'qrshare.js'));

// 分享面板 mock 状态：ops/fills=绘制填充次数 texts=文字绘制 images=图片绘制
// saved=成功保存次数 denied=相册授权被拒 netFail=远端图失败 exportFail=canvas 导出失败
const mockQr = { ops: 0, saved: 0, denied: false, netFail: false, exportFail: false, fsWrites: [] };
const mockPoster = { fills: 0, texts: 0, images: 0 };

// mock canvas 2d 节点（canvas type="2d"）：getContext 返回计数 ctx，
// createImage 同步 onload（netFail 模拟远端图失败，本地路径始终可画）
function makeMockCanvasNode() {
  const counts = { fills: 0, texts: 0, images: 0 };
  const sync = () => {
    mockPoster.fills = counts.fills;
    mockPoster.texts = counts.texts;
    mockPoster.images = counts.images;
  };
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    font: '',
    textAlign: '',
    globalAlpha: 1,
    measureText(t) { return { width: String(t).length * 7 }; },
    createLinearGradient() { return { addColorStop() {} }; },
    scale() {},
    setTransform() {},
    translate() {},
    save() {},
    restore() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    rect() {},
    quadraticCurveTo() {},
    arc() {},
    closePath() {},
    clip() {},
    fill() {},
    stroke() {},
    fillRect() { counts.fills += 1; sync(); },
    fillText() { counts.texts += 1; sync(); },
    drawImage() { counts.images += 1; sync(); }
  };
  return {
    width: 0,
    height: 0,
    getContext() { return ctx; },
    createImage() {
      const img = { width: 480, height: 320, onload: null, onerror: null, _src: '' };
      Object.defineProperty(img, 'src', {
        set(v) {
          img._src = v;
          const remoteFail = mockQr.netFail && typeof v === 'string' && v.indexOf('http') === 0;
          if (remoteFail) {
            if (img.onerror) img.onerror();
          } else if (img.onload) {
            img.onload();
          }
        },
        get() { return img._src; }
      });
      return img;
    }
  };
}

// 远端专属图（jsDelivr URL）映射回仓库内 miniprogram/data/img/ 检查存在性
// 2026-10-24：cdn.jsdelivr.net 对图片一律 301 跳 raw.githubusercontent.com，图片基址已切 gcore
const artUrl = (asset) => 'https://testingcf.jsdelivr.net/gh/webzol/history@main/miniprogram' + asset;
const IMG_CDN_PREFIX = 'https://gcore.jsdelivr.net/gh/webzol/history@main/miniprogram';
function imgOk(img) {
  if (!img) return false;
  const repoPath = img.match(/^https:\/\/[^/]+\.jsdelivr\.net\/gh\/webzol\/history@main\/miniprogram(\/.*)$/);
  if (repoPath) return fs.existsSync(path.join(ROOT, repoPath[1]));
  return fs.existsSync(path.join(ROOT, img));
}
function remoteEventImg(id) {
  const rel = '/data/img/events/' + id + '.jpg';
  return fs.existsSync(path.join(ROOT, rel)) ? IMG_CDN_PREFIX + rel : '';
}
function remotePersonImg(id) {
  const rel = '/data/img/persons/' + id + '.jpg';
  return fs.existsSync(path.join(ROOT, rel)) ? IMG_CDN_PREFIX + rel : '';
}
const store = require(path.join(ROOT, 'utils', 'store.js'));

// ---------------------------------------------------------------------------
// 统计与断言
// ---------------------------------------------------------------------------

let passCount = 0;
const failures = [];

function ok(cond, name) {
  if (cond) {
    passCount += 1;
  } else {
    failures.push(name);
    console.error('  FAIL  ' + name);
  }
}

function eq(actual, expected, name) {
  const head = `${actual} === ${expected}`;
  ok(JSON.stringify(actual) === JSON.stringify(expected), `${name} (${head})`);
}

function fail(name) {
  failures.push(name);
  console.error('  FAIL  ' + name);
}

// ---------------------------------------------------------------------------
// wx mock
// ---------------------------------------------------------------------------

const wxLog = [];
let pendingModal = null;    // 最近一次 showModal(opts)
let pendingSheet = null;    // 最近一次 showActionSheet(opts)
const storage = {};
const mockRequest = { payload: null, today: null, apkFail: null, wxacodeIdx: null }; // wx.request 白名单桩载荷（jsDelivr / 60s 分流）；apkFail(rel) 返回 true 则该资料库请求失败；wxacodeIdx 为太阳码 idx 清单桩
let storageCleared = 0;

function route(kind, url, rest) {
  wxLog.push({ kind, url, ...rest });
}

const wx = {
  __log: wxLog,
  getStorageInfoSync() { return { keys: Object.keys(storage) }; },
  setStorageSync(k, v) { storage[k] = v; },
  getStorageSync(k) { return Object.prototype.hasOwnProperty.call(storage, k) ? storage[k] : ''; },
  removeStorageSync(k) { delete storage[k]; },
  clearStorageSync() {
    storageCleared += 1;
    Object.keys(storage).forEach((k) => delete storage[k]);
  },
  showToast(opts) { route('showToast', '', opts); },
  showShareMenu(opts) { route('showShareMenu', '', opts); },
  showModal(opts) {
    pendingModal = opts;
    route('showModal', '', { title: opts.title, content: opts.content });
  },
  showActionSheet(opts) {
    pendingSheet = opts;
    route('showActionSheet', '', { alertText: opts.alertText, count: (opts.itemList || []).length });
  },
  showLoading(o) { route('showLoading', '', { title: o && o.title }); },
  hideLoading() { route('hideLoading', '', {}); },
  // 分享面板海报（utils/qrshare.js canvas 2d API）：SelectorQuery 返回 mock 画布节点，
  // 2d ctx 逐次记录填充/文字/图片次数（直接更新 mockPoster，2d API 无 draw()）
  createSelectorQuery() {
    const chain = {};
    ['in', 'select', 'fields'].forEach((m) => { chain[m] = () => chain; });
    chain.exec = (cb) => {
      cb([{ node: makeMockCanvasNode() }]);
      return chain;
    };
    return chain;
  },
  canvasToTempFilePath(opts) {
    if (mockQr.exportFail || !(opts && opts.canvas)) {
      if (opts && opts.fail) opts.fail({ errMsg: 'canvasToTempFilePath:fail' });
      return;
    }
    if (opts.success) opts.success({ tempFilePath: 'tmp://qr-share.png' });
  },
  env: { USER_DATA_PATH: 'wxfile://mockusr' },
  getFileSystemManager() {
    return {
      readFile(opts) {
        if ((opts.filePath || '').indexOf('share-fallback.jpg') >= 0) {
          if (opts.success) opts.success({ data: { __mock: 'jpg-bytes' } });
          return;
        }
        if (opts.fail) opts.fail({ errMsg: 'readFile:fail ' + opts.filePath });
      },
      writeFile(opts) {
        mockQr.fsWrites.push(opts.filePath);
        if (opts.success) opts.success({});
      }
    };
  },
  saveImageToPhotosAlbum(opts) {
    if (mockQr.denied) {
      opts.fail({ errMsg: 'saveImageToPhotosAlbum:fail auth deny' });
      return;
    }
    mockQr.saved += 1;
    route('saveImage', '', { filePath: opts.filePath });
    if (opts.success) opts.success({});
  },
  openSetting(opts) {
    route('openSetting', '', {});
    mockQr.denied = false; // 用户在设置页开启权限
    if (opts.success) opts.success({ authSetting: { 'scope.writePhotosAlbum': true } });
  },
  request(opts) {
    route('request', opts.url);
    if (opts.url.indexOf('/data/img/wxacode/') >= 0) {
      if (mockRequest.wxacodeIdx) opts.success({ data: mockRequest.wxacodeIdx, statusCode: 200 });
      else if (opts.fail) opts.fail(new Error('no idx fixture'));
      return;
    }
    if (opts.url.indexOf('/data/apk/') >= 0) {
      const rel = opts.url.split('/data/apk/')[1];
      if (mockRequest.apkFail && mockRequest.apkFail(rel)) {
        if (opts.fail) opts.fail(new Error('mock apk 403'));
        return;
      }
      try {
        const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'apk', rel), 'utf8'));
        if (opts.success) opts.success({ data, statusCode: 200 });
      } catch (e) {
        if (opts.fail) opts.fail(e);
      }
      return;
    }
    const hook = opts.url.indexOf('today_in_history') >= 0 ? mockRequest.today : mockRequest.payload;
    if (hook) opts.success({ data: hook });
    else if (opts.fail) opts.fail(new Error('offline'));
  },
  navigateTo(opts) {
    route('navigateTo', opts.url);
    navStack.push(urlTarget(opts.url));
    if (opts.success) opts.success({});
  },
  redirectTo(opts) {
    route('redirectTo', opts.url);
    navStack[navStack.length - 1] = urlTarget(opts.url);
    if (opts.success) opts.success({});
  },
  switchTab(opts) {
    route('switchTab', opts.url);
    navStack.length = 1; // tab 页为根，收掉普通页栈
    if (opts.success) opts.success({});
  },
  navigateBack(opts = {}) {
    if (navStack.length > 1) {
      navStack.pop();
      if (opts.success) opts.success({});
    } else if (opts.fail) {
      opts.fail(new Error('no page to back'));
    }
  }
};

const navStack = ['fixture'];

function resetWifiStack() {
  navStack.splice(1, navStack.length - 1);
}

// 模拟用户选择模态按钮
function confirmModal(confirm) {
  const opts = pendingModal;
  pendingModal = null;
  if (!opts) return;
  const res = confirm ? { confirm: true, cancel: false } : { confirm: false, cancel: true };
  if (confirm && opts.success) opts.success(res);
  else if (!confirm && opts.success) opts.success(res);
  else if (opts.fail) opts.fail({});
}

// 模拟用户在 ActionSheet 里选择第 index 项
function pickSheet(index) {
  const opts = pendingSheet;
  pendingSheet = null;
  if (!opts) return;
  if (opts.success) opts.success({ tapIndex: index });
}

// 分享面板通用断言（详情页四页共用）：打开 → 卡片内容 → 海报绘制 → 保存（成功 + 授权拒绝重试）→ 关闭
// cfg: { kicker, pathTail }
function assertSharePanel(page, cfg, tag) {
  page.openShare();
  ok(page.data.share.open, `${tag}分享面板打开`);
  qrshare.attachCanvas(page); // mock exec 同步回调：挂载 2d 画布并跑完题图/太阳码装载链
  eq(page.data.share.kicker, cfg.kicker, `${tag}分享卡片 kicker`);
  ok(page.data.share.desc.length >= 8, `${tag}分享卡片含页面摘要`);
  ok(page.data.share.img.length > 0, `${tag}分享卡片含题图`);
  ok(page.data.share.quote.length >= 4, `${tag}分享卡片含每日历史名句`);
  ok(page.data.share.quoteSource.length > 0, `${tag}名句含出处`);
  ok(page.data.share.lunarText.indexOf('农历') === 0, `${tag}海报含农历日期（${page.data.share.lunarText}）`);
  ok(page.data.share.dateText.indexOf('年') > 0, `${tag}海报含公历日期`);
  qrshare.drawPoster(page);
  ok(mockPoster.texts >= 8, `${tag}海报含 kicker/标题/摘要/名句/出处/日期/品牌文字层`);
  ok(mockPoster.fills >= 5, `${tag}海报有基础绘制层（宣纸/界格/装裱/分隔细线）`);
  ok(mockPoster.images >= 4, `${tag}海报含宣纸、题图、「史载」印和小程序码`);
  const msg = page.onShareAppMessage();
  ok(msg.path === page.sharePayload().path, `${tag}转发 path 与 sharePayload 同源`);
  mockQr.saved = 0;
  page.saveQr();
  ok(mockQr.saved === 1, `${tag}保存分享卡片到相册`);
  mockQr.denied = true;
  page.saveQr();
  ok(pendingModal && pendingModal.title === '需要相册权限', `${tag}授权被拒 → 引导弹窗`);
  confirmModal(true);
  ok(last('openSetting'), `${tag}引导去设置页`);
  ok(mockQr.saved === 2, `${tag}授权恢复后自动重试保存（累计 2 次）`);
  mockQr.denied = false;
  // 异常降级：导出失败 → 兜底静态图经用户目录转存相册
  mockQr.exportFail = true;
  mockQr.saved = 0;
  mockQr.fsWrites = [];
  page.saveQr();
  ok(mockQr.saved === 1, `${tag}导出失败降级保存兜底图`);
  ok(mockQr.fsWrites.some((p) => p.indexOf('share-fallback.jpg') >= 0), `${tag}兜底图经用户目录转存`);
  // canvas 降级态（drawPoster 异常已切静态图）→ 直接保存兜底图
  page.data.share.fallback = true;
  mockQr.saved = 0;
  page.saveQr();
  ok(mockQr.saved === 1, `${tag}降级态直接保存兜底图`);
  page.data.share.fallback = false;
  mockQr.exportFail = false;
  page.closeShare();
  eq(page.data.share.open, false, `${tag}分享面板关闭`);
}

function urlTarget(url) {
  const m = /^\/(?:relics\/)?pages\/([\w-]+)\/([\w-]+)/.exec(url);
  return m ? m[1] : url;
}

function last(kind) {
  for (let i = wxLog.length - 1; i >= 0; i -= 1) {
    if (wxLog[i].kind === kind) return wxLog[i];
  }
  return null;
}

// ---------------------------------------------------------------------------
// Page / App 全局 + 页面装载
// ---------------------------------------------------------------------------

const pages = {};
let currentFile = '';

global.App = (cfg) => cfg;
global.getApp = () => ({ globalData: { appName: '阅史记' } });
global.Page = (cfg) => {
  pages[currentFile] = instantiate(cfg, currentFile);
  return cfg;
};
global.wx = wx;

function instantiate(cfg, name) {
  const page = Object.assign({ __name: name, data: JSON.parse(JSON.stringify(cfg.data || {})) }, cfg);
  // setData：支持 'a.b.c' 与 'rows[0]' 路径（与真机 setData 行为一致）
  Object.defineProperty(page, 'setData', {
    value(patch, cb) {
      Object.keys(patch).forEach((key) => {
        const path = key.replace(/\[(\d+)\]/g, '.$1').split('.');
        let node = page.data;
        for (let i = 0; i < path.length - 1; i++) {
          if (node[path[i]] === undefined || typeof node[path[i]] !== 'object') node[path[i]] = {};
          node = node[path[i]];
        }
        node[path[path.length - 1]] = patch[key];
      });
      if (cb) cb();
    }
  });
  return page;
}

function loadAll() {
  global.__CUR = 'app';
  currentFile = '__app__';
  require(path.join(ROOT, 'app.js'));
  require(path.join(ROOT, 'data', 'history.js'));

  const names = [
    'home', 'timeline', 'discover', 'profile', 'event', 'person', 'period', 'search',
    'footprints', 'favorites', 'archive', 'archive-list', 'archive-detail'
  ];
  names.forEach((name) => {
    currentFile = name;
    global.__CUR = name;
    pages[name];
    delete require.cache[require.resolve(path.join(ROOT, 'pages', name, `${name}.js`))];
    require(path.join(ROOT, 'pages', name, `${name}.js`));
  });

  // 文物分包页（relics/pages/*）
  ['relic-list', 'relic-detail', 'relic-share'].forEach((name) => {
    currentFile = name;
    global.__CUR = name;
    pages[name];
    const file = path.join(ROOT, 'relics', 'pages', name, `${name}.js`);
    delete require.cache[require.resolve(file)];
    require(file);
  });
}
loadAll();

const history = require(path.join(ROOT, 'data', 'history.js'));

function tap(page, handlerName, dataset) {
  page[handlerName]({ currentTarget: { dataset: dataset || {} } });
}

// ---------------------------------------------------------------------------
// 1. 数据完整性（history.js 真实数据）
// ---------------------------------------------------------------------------

console.log('== 数据完整性 ==');

(function () {
  const eventIds = new Set(history.events.map((e) => e.id));
  const personIds = new Set(history.persons.map((p) => p.id));
  const periodIds = new Set(history.periods.map((p) => p.id));

  eq(history.events.length, 100, '史事 100 条');
  eq(history.persons.length, 89, '人物 89 位');
  ok(new Set([...eventIds]).size === 100, '史事 id 唯一');
  ok(new Set([...personIds]).size === 89, '人物 id 唯一');
  ok(new Set([...periodIds]).size === 24, '朝代 id 唯一');

  history.events.forEach((e) => {
    ok(e.mode === 'ancient' || e.mode === 'modern', `[${e.id}] mode 合法`);
    ok(typeof e.year === 'number', `[${e.id}] year 为数字`);
    ok(e.yearText && /\d/.test(e.yearText), `[${e.id}] yearText 非空`);
    if (e.year < 0) ok(/公元前/.test(e.yearText), `[${e.id}] 公元前纪年一致`);
    ok(Array.isArray(e.details) && e.details.length >= 1, `[${e.id}] details 已补正文`);
    ok(e.source, `[${e.id}] source 非空`);
  });

  history.persons.forEach((p) => {
    ok(Array.isArray(p.details) && p.details.length >= 1, `[${p.id}] details 已补生平`);
    ok(p.quote ? !!p.quoteSource : true, `[${p.id}] 引文与出处配对（引文可为空）`);
    ok(p.source, `[${p.id}] source 非空`);
    (p.relatedEvents || []).forEach((id) => ok(eventIds.has(id), `[${p.id}] relatedEvents->${id} 存在`));
  });

  ok(eventIds.has(history.daily[0].eventId), 'daily.eventId 指向真实史事');
  history.daily.forEach((d) => {
    ok(d.month >= 1 && d.month <= 12 && d.day >= 1 && d.day <= 31, `[daily ${d.month}-${d.day}] 日期合法`);
    ok(eventIds.has(d.eventId), `[daily ${d.month}-${d.day}] 指向真实史事`);
  });
  ok(eventIds.has(history.dailyFallback.eventId), 'dailyFallback 指向真实史事');
  ok(personIds.has('lu-xun') && (history.events.find((e) => e.id === 'yuanmingyuan-1860').source || '').length > 0, '鲁迅人物与圆明园事件数据完整');
  ok(personIds.has('han-wudi') && eventIds.has('han-wudi'), '汉武帝人物/事件同名 id 并存');
  ok(periodIds.has('tang') && periodIds.has('modern'), '朝代含 唐 / 近现代');
  ['zhao-kuangyin', 'wang-anshi', 'lin-zexu', 'tang-taizong', 'du-fu', 'li-hongzhang'].forEach((id) =>
    ok(personIds.has(id), `新人物条目存在 ${id}`)
  );
  ['zhenguan-627', 'kaiyuan-713', 'anshi-755', 'jiawu-1894', 'zhangqian-138', 'wuxu-1898', 'mobei-119', 'newculture-1915', 'zunyi-1935', 'kangzhan-1945', 'xuanwumen-626', 'beifa-1926', 'jinggangshan-1927', 'longmarch-1934', 'qidan-916', 'xixia-1038', 'jurchen-1115', 'zhenghe-1405', 'tumu-1449', 'zhangjuzheng-1581', 'ming-wang-1644', 'ningwang-1519', 'taizhou-1561', 'kangxi-1681', 'humen-1839'].forEach((id) =>
    ok(eventIds.has(id), `新史事条目存在 ${id}`)
  );
  ['zhang-qian', 'chen-duxiu', 'deng-xiaoping', 'wei-qing', 'huo-qubing', 'mao-zedong', 'zheng-he', 'yu-qian', 'qi-jiguang', 'wang-shouren', 'cao-xueqin', 'hong-xiuquan', 'zeng-guofan', 'zuo-zongtang'].forEach((id) => ok(personIds.has(id), `新人物条目存在 ${id}`));
  ['da-yu', 'cheng-tang', 'fu-hao', 'zhou-wuwang', 'zhou-gong', 'qu-yuan', 'guangwu', 'ban-chao', 'sima-yan', 'chen-shou', 'xiao-wendi', 'sui-yangdi', 'zhu-wen', 'li-yu', 'yelu-abaoji', 'xiao-chuo', 'li-yuanhao', 'wanyan-aguda', 'fan-zhongyan', 'guo-shoujing', 'zhang-juzheng', 'kangxi', 'qianlong', 'sun-zhongshan'].forEach((id) =>
    ok(personIds.has(id), `补全人物条目存在 ${id}`)
  );
  ['fuhao-1200', 'ying-du-278', 'jin-unify-280', 'sanguozhi-290', 'nan-tang-975', 'qingli-1043', 'siku-1773'].forEach((id) =>
    ok(eventIds.has(id), `补全史事条目存在 ${id}`)
  );
  ['夏', '商', '西周', '西晋', '五代十国', '辽', '西夏', '金'].forEach((era) =>
    ok(history.persons.some((p) => p.era === era), `${era}已有代表人物`)
  );

  // relatedEvents 反查闭环：王守仁/戚继光/林则徐 均已挂真实条目
  const reIds = (pid) => {
    const p = history.persons.find((x) => x.id === pid);
    return (p.relatedEvents || []).filter((id) => eventIds.has(id));
  };
  ok(reIds('wang-shouren').indexOf('ningwang-1519') >= 0, '王守仁反查 平宁王之乱');
  ok(reIds('qi-jiguang').indexOf('taizhou-1561') >= 0, '戚继光反查 台州大捷');
  ok(reIds('lin-zexu').indexOf('humen-1839') >= 0 && reIds('lin-zexu').indexOf('opium-war-1840') >= 0, '林则徐反查 销烟+鸦片战争');
  ok(reIds('cao-xueqin').indexOf('hongloumeng-1754') >= 0, '曹雪芹反查 石头记甲戌再评');
  ok(reIds('li-hongzhang').indexOf('yangwu-1861') >= 0, '李鸿章反查 洋务运动');
  ok(reIds('zeng-guofan').indexOf('taiping-1851') >= 0 && reIds('zuo-zongtang').indexOf('xinjiang-1878') >= 0,
    '曾国藩/左宗棠反查 太平天国/收复新疆');
  ok(reIds('fu-hao').indexOf('fuhao-1200') >= 0, '妇好反查 妇好领兵征伐');
  ok(reIds('li-yu').indexOf('nan-tang-975') >= 0, '李煜反查 宋灭南唐');
  ok(reIds('sun-zhongshan').indexOf('xinhai-1911') >= 0, '孙中山反查 辛亥革命');
  ok(reIds('wanyan-aguda').indexOf('jurchen-1115') >= 0 && reIds('wanyan-aguda').indexOf('jin-mie-liao') >= 0,
    '完颜阿骨打反查 女真建国/金灭辽');
  // 全员反查闭环：每位人物的 relatedEvents 都指向真实条目且非空
  history.persons.forEach((p) =>
    ok((p.relatedEvents || []).length > 0 && (p.relatedEvents || []).every((id) => eventIds.has(id)),
      `[${p.id}] 反查闭环非空且指向真实史事`)
  );

  // 图片路径全部存在于磁盘
  const goodImg = (p) => ok(p && fs.existsSync(path.join(ROOT, p)), `素材存在 ${p}`);
  goodImg(history.topics.find((t) => t.id === 'tang') ? '/assets/tang-bg.jpg' : null);
  ['han', 'tang', 'song', 'modern'].forEach((id) =>
    goodImg('/assets/paintings/' + id + '.jpg')
  );
  goodImg('/assets/paintings/landscape.jpg');
  goodImg('/assets/paintings/dongjin.jpg');
  goodImg('/assets/paintings/nanbeichao.jpg');
  ['chibi', 'qin-unify', 'zhenghe', 'dayunhe', 'humen', 'han-wudi'].forEach((id) =>
    goodImg('/assets/eventart/' + id + '.jpg')
  );
  ['wudi', 'wei-qing', 'zhang-qian', 'huo-qubing'].forEach((id) => {
    goodImg('/assets/personart/' + id + '.jpg');
    goodImg('/assets/thumbs/' + id + '.jpg');
  });

  // 时代配图映射（事件头卡 / 人物缩略图共用）
  const eraImages = require(path.join(ROOT, 'utils', 'eraImages.js'));
  eq(eraImages.eraImage('西汉'), artUrl('/assets/paintings/han.jpg'), '时代配图 · 西汉');
  eq(eraImages.eraImage('晚清'), artUrl('/assets/paintings/qing.jpg'), '时代配图 · 晚清并到清');
  eq(eraImages.eraImage('民国'), artUrl('/assets/paintings/landscape.jpg'), '时代配图 · 民国用千里江山图');
  eq(eraImages.eraImage('近现代'), artUrl('/assets/paintings/landscape.jpg'), '时代配图 · 近现代用千里江山图');
  eq(eraImages.eraImage('新中国'), artUrl('/assets/paintings/modern.jpg'), '时代配图 · 新中国用开国大典');
  eq(eraImages.eraImage('辽'), artUrl('/assets/paintings/liao.jpg'), '时代配图 · 辽代有专属绘画');
  eq(eraImages.eraImage('东晋'), artUrl('/assets/paintings/dongjin.jpg'), '时代配图 · 东晋用顾恺之洛神赋图');
  eq(eraImages.eraImage('南北朝'), artUrl('/assets/paintings/nanbeichao.jpg'), '时代配图 · 南北朝用云冈石窟');
  eq(eraImages.eraImage('秦'), artUrl('/assets/paintings/qin.jpg'), '时代配图 · 秦代有专属绘画');
  eq(eraImages.eraImage('元'), artUrl('/assets/paintings/yuan.jpg'), '时代配图 · 元代有专属绘画');
  eq(eraImages.personThumb('西汉', 0), artUrl('/assets/thumbs/han-1.jpg'), '人物缩略图 · 西汉轮换起点');
  eq(eraImages.personThumb('西汉', 1), artUrl('/assets/thumbs/han-2.jpg'), '人物缩略图 · 西汉第二张');
  eq(eraImages.personThumb('民国', 0), artUrl('/assets/thumbs/republic-1.jpg'), '人物缩略图 · 民国用山河细部');
  eq(eraImages.personThumb('辽', 0), artUrl('/assets/thumbs/liao-1.jpg'), '人物缩略图 · 辽代有专属细部');
  eq(eraImages.personThumb('战国', 0), artUrl('/assets/thumbs/zhanguo-1.jpg'), '人物缩略图 · 战国有专属细部');
  eq(eraImages.personThumb('东晋', 0), artUrl('/assets/thumbs/dongjin-1.jpg'), '人物缩略图 · 东晋有专属细部');
  eq(eraImages.personThumb('南北朝', 0), artUrl('/assets/thumbs/nanbeichao-1.jpg'), '人物缩略图 · 南北朝有专属细部');
  eq(eraImages.eventImage('chibi', '三国'), artUrl('/assets/eventart/chibi.jpg'), '事件配图 · 赤壁之战用专属图');
  eq(eraImages.eventImage('qin-unify', '秦'), artUrl('/assets/eventart/qin-unify.jpg'), '事件配图 · 秦统一用专属图');
  eq(eraImages.eventImage('no-such-id', '北宋'), artUrl('/assets/paintings/song.jpg'), '事件配图 · 无专属图回退朝代级');
  eq(eraImages.eventImage('han-wudi', '西汉'), artUrl('/assets/eventart/han-wudi.jpg'), '事件配图 · 汉武帝即位用专属图');
  eq(eraImages.personImage('zhang-qian', '西汉'), artUrl('/assets/personart/zhang-qian.jpg'), '人物配图 · 张骞用专属图');
  eq(eraImages.personImage('wei-qing', '西汉'), artUrl('/assets/personart/wei-qing.jpg'), '人物配图 · 卫青用专属图');
  eq(eraImages.personImage('huo-qubing', '西汉'), artUrl('/assets/personart/huo-qubing.jpg'), '人物配图 · 霍去病用专属图');
  eq(eraImages.personImage('han-wudi', '西汉'), artUrl('/assets/personart/wudi.jpg'), '人物配图 · 汉武帝用专属图');
  eq(eraImages.personImageThumb('zhang-qian', '西汉', 0), artUrl('/assets/personart/zhang-qian.jpg'), '人物小图 · 人物整幅画优先于细部裁切');
  eq(eraImages.personImageThumb('sima-qian', '西汉', 0), 'https://gcore.jsdelivr.net/gh/webzol/history@main/miniprogram/data/img/persons/sima-qian.jpg', '人物小图 · 司马迁命中远端专属图');
  ok(eraImages.altArt('https://gcore.jsdelivr.net/gh/webzol/history@main/miniprogram/data/img/persons/sima-qian.jpg') === 'https://testingcf.jsdelivr.net/gh/webzol/history@main/miniprogram/data/img/persons/sima-qian.jpg', '远端图兜底 · altArt 换备用域名');
  ok(eraImages.altArt('/assets/personart/zhang-qian.jpg') === '' && eraImages.altArt('https://testingcf.jsdelivr.net/gh/webzol/history@main/miniprogram/data/img/persons/sima-qian.jpg') === '', '远端图兜底 · 本地图与已重试图不二次兜底');
  eq(eraImages.personImageThumb('no-such-person', '西汉', 0), artUrl('/assets/thumbs/han-1.jpg'), '人物小图 · 无专属回退朝代细部');
  let thumbCount = 0;
  ['han', 'tang', 'song', 'ming', 'qing', 'modern', 'republic',
     'shanggu', 'xia', 'shang', 'zhou', 'chunqiu', 'zhanguo', 'qin', 'sanguo',
     'xijin', 'sui', 'wudai', 'yuan', 'liao', 'xixia', 'jin',
     'dongjin', 'nanbeichao'].forEach((base) => {
    [1, 2, 3, 4].forEach((n) => {
      if (fs.existsSync(path.join(ROOT, `/assets/thumbs/${base}-${n}.jpg`))) thumbCount += 1;
    });
  });
  eq(thumbCount, 96, '人物缩略图 24 组 × 4 张齐备');

  // 远端 data/history.json 应带 builtAt 版本戳
  try {
    const remoteJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'history.json'), 'utf8'));
    ok(remoteJson.meta && remoteJson.meta.builtAt, 'history.json 带 builtAt 版本戳');
  } catch (e) {
    ok(false, `history.json 可解析且带 meta（${e.message}）`);
  }
})();

// ---------------------------------------------------------------------------
// 2. home
// ---------------------------------------------------------------------------

console.log('== 首页 ==');

(function () {
  resetWifiStack();
  const p = pages.home;

  p.onLoad();
  eq(last('showShareMenu')?.menus, ['shareAppMessage', 'shareTimeline'], '首页原生菜单启用好友和朋友圈分享');
  const friendShare = p.onShareAppMessage();
  eq(friendShare.path, '/pages/home/home', '首页好友分享仍打开首页');
  const timelineShare = p.onShareTimeline();
  eq(timelineShare.title, friendShare.title, '朋友圈分享沿用首页品牌标题');
  ok(imgOk(timelineShare.imageUrl), '朋友圈分享题图位于小程序包内');
  ok(!timelineShare.path, '朋友圈分享由微信打开当前首页');

  p.onShow();
  eq(p.data.dateText.slice(-4), '· 今天', 'dateText 为今天');
  ok(history.events.some((e) => e.id === p.data.hero.eventId), 'hero 连到真实史事事件');
  eq(p.data.hero.title, '今日史事', 'hero 标题');
  ok(p.data.hero.desc && p.data.hero.desc.length > 0, 'hero 描述非空');
  // 今日史事：纪念日按日期库；无匹配日「每日随机」（api.pickDaily 以公历月日为种子，同一天稳定、隔天换）
  const apiHome = require(path.join(ROOT, 'utils', 'api.js'));
  const today = (() => { const d = new Date(); return d.getMonth() + 1 + '-' + d.getDate(); })();
  const matched = history.daily.find((d) => `${d.month}-${d.day}` === today);
  const expectedId = matched ? matched.eventId : apiHome.pickDaily(history.events).id;
  eq(p.data.hero.eventId, expectedId, `今日(${today}) hero：纪念日按日期库，其余每日随机`);
  p.apply();
  eq(p.data.hero.eventId, expectedId, '同一天重复 apply 精选不变（确定性）');
  [
    [4, 17, 'jiawu-1894', '公元1895年，清政府与日本签订《马关条约》。'],
    [8, 29, 'opium-war-1840', '公元1842年，清政府与英国签订《南京条约》。'],
    [10, 19, 'yuanmingyuan-1860', '公元1860年，英军继续焚烧圆明园。']
  ].forEach(([month, day, id, desc]) => {
    p.apply(new Date(2026, month - 1, day));
    eq(p.data.hero.eventId, id, `${month}月${day}日继续跳转关联史事`);
    eq(p.data.hero.desc, desc, `${month}月${day}日显示当天的年份与历史节点`);
  });
  p.apply();
  eq(p.data.era.title, '盛唐气象', 'era 来自 topics');
  eq(p.data.modern.shortTitle, '百年中国', 'modern 来自 topics');

  tap(p, 'goDiscover');
  eq(last('switchTab').url, '/pages/discover/discover', '全部朝代 › 发现页（switchTab）');

  tap(p, 'goPage', { page: 'person' });
  ok(p.data.sheet.open, '人物磁贴：打开自绘弹层');
  eq(p.data.sheet.list.length, 89, '弹层列出八十九位人物');

  const suIdx = p.data.sheet.list.findIndex((x) => x.id === 'su-shi');
  tap(p, 'onSheetItem', { index: suIdx });
  eq(last('navigateTo').url, '/pages/person/person?id=su-shi', '选择苏轼 → 人物详情');
  eq(p.data.sheet.open, false, '选择后弹层自动关闭');

  tap(p, 'goPage', { page: 'event' });
  ok(p.data.sheet.open, '事件磁贴：打开自绘弹层');
  eq(p.data.sheet.list.length, 6, '弹层列出六条史事');
  tap(p, 'onSheetItem', { index: 0 });
  const evUrl = last('navigateTo').url;
  ok(/event\?id=yuanmingyuan-1860|event\?id=reform-1978/.test(evUrl), `事件磁贴选择命中真实事件 (${evUrl})`);

  tap(p, 'goPage', { page: 'dynasty' });
  ok(p.data.sheet.open, '朝代磁贴：打开自绘弹层');
  eq(p.data.sheet.list.length, 24, '弹层列出二十四个时代');
  tap(p, 'closeSheet');
  eq(p.data.sheet.open, false, '点遮罩/取消可关闭');
  tap(p, 'goPage', { page: 'dynasty' });
  const hanIdx = p.data.sheet.list.findIndex((x) => x.id === 'han');
  tap(p, 'onSheetItem', { index: hanIdx });
  eq(last('navigateTo').url, '/pages/period/period?id=han', '选择西汉 → 朝代详情页');
  tap(p, 'goPage', { page: 'dynasty' });
  const mingIdx = p.data.sheet.list.findIndex((x) => x.id === 'ming');
  tap(p, 'onSheetItem', { index: mingIdx });
  eq(last('navigateTo').url, '/pages/period/period?id=ming', '朝代弹层含明代并正确跳转');

  tap(p, 'onHeroTap');
  const heroUrl = last('navigateTo').url;
  ok(new RegExp(`event\\.js?id=${p.data.hero.eventId}`.replace('.', '\\.').replace(/\./g, '.')).test(heroUrl) || heroUrl.indexOf(p.data.hero.eventId) >= 0,
    `hero 点击 → 今日史事详情 (${heroUrl})`);

  tap(p, 'goPage', { page: 'timeline' });
  eq(last('switchTab').url, '/pages/timeline/timeline', '时间轴磁贴 → switchTab');

  tap(p, 'onEraTap');
  eq(last('switchTab').url, '/pages/timeline/timeline', '盛唐卡 → switchTab 时间轴');
  eq(storage.shige_tab_params && storage.shige_tab_params.timelineMode, 'ancient', 'pending 交接 ancient');

  tap(p, 'onModernTap');
  eq(storage.shige_tab_params && storage.shige_tab_params.timelineMode, 'modern', 'pending 交接 modern');

  // 时间轴 onShow 读取并清空 pending mode
  const tp = pages.timeline;
  tp.onLoad({});
  tp.onShow();
  eq(tp.data.mode, 'modern', 'pending mode 在 onShow 落地');
  eq(storage.shige_tab_params, undefined, 'pending 已清空');

  // 同值不重载、再次 onShow 稳定
  tp.onShow();
  eq(tp.data.mode, 'modern', '再次 onShow 保持 modern');
})();

// ---------------------------------------------------------------------------
// 3. timeline
// ---------------------------------------------------------------------------

console.log('== 四季装饰与页面提示 ==');

(function () {
  const { seasonFor } = require(path.join(ROOT, 'utils/identity.js'));
  [
    [1, 31, 'winter'], [2, 3, 'winter'], [2, 4, 'spring'],
    [5, 4, 'spring'], [5, 5, 'summer'], [8, 6, 'summer'],
    [8, 7, 'autumn'], [11, 6, 'autumn'], [11, 7, 'winter']
  ].forEach(([month, day, season]) => {
    eq(seasonFor(new Date(2026, month - 1, day)).key, season, `2026/${month}/${day} 按立季日切换装饰`);
  });

  const feedback = require(path.join(ROOT, 'utils/feedback.js'));
  let config;
  global.Component = (cfg) => { config = cfg; };
  require(path.join(ROOT, 'components/feedback-popup/index.js'));
  delete global.Component;
  function makeView() {
    return Object.assign({
      data: { ...config.data },
      setData(patch) { Object.assign(this.data, patch); }
    }, config.methods);
  }
  const first = makeView();
  const second = makeView();
  const choices = [];
  const modal = { title: '清空收藏', success: ({ confirm }) => choices.push(confirm) };
  config.pageLifetimes.show.call(first);
  feedback.modal(modal);
  eq(first.data.notice.kind, 'modal', '确认框由页面内组件承接');
  first.onCancel();
  eq(choices, [false], '点击取消只回调一次且不确认');
  feedback.modal(modal);
  feedback.toast({ title: '后台消息' });
  eq(first.data.notice.title, '清空收藏', '后台提示不覆盖待确认操作');
  first.onConfirm();
  first.onConfirm();
  eq(choices, [false, true], '重复点击确认不会再次执行操作');
  feedback.loading({ title: '检查更新' });
  eq(first.data.notice.kind, 'loading', '加载状态由页面组件承接');
  feedback.hideLoading();
  eq(first.data.notice.kind, '', '完成时收起加载层');
  feedback.modal(modal);
  config.pageLifetimes.hide.call(first);
  config.pageLifetimes.show.call(second);
  feedback.toast({ title: '旧页请求已完成' }, first);
  first.onConfirm();
  eq([first.data.notice.kind, second.data.notice.kind, choices.length], ['', '', 2], '切页丢弃旧页提示与未确认操作');
  feedback.toast({ title: '已收藏' });
  eq(second.data.notice.title, '已收藏', '新页面仍可收到自己的短提示');
  config.lifetimes.detached.call(second);
})();

console.log('== 时间轴 ==');

(function () {
  resetWifiStack();
  const p = pages.timeline;

  p.onLoad({});
  eq(p.data.mode, 'ancient', '默认古代');
  eq(p.data.groups.map((group) => group.items.length), [24], '古代首屏只渲染一组');
  ok(p.data.hasMore, '古代首屏可以继续加载');
  p.onReachBottom();
  eq(p.data.groups.map((group) => group.items.length), [24, 24], '滚动到底仅追加一组');
  p.loadMode('ancient');
  eq(p.data.groups.length, 2, '同模式更新保留已展开的范围');
  p.onMore();
  p.onReachBottom();
  p.onMore();
  eq(p.data.groups.map((group) => group.items.length), [24, 24, 24, 10], '全部 82 条按组渲染且末尾不重复');
  ok(!p.data.hasMore, '全部展开后隐藏加载入口');
  const events = p.data.groups.flatMap((group) => group.items);
  ok(events.every((e, i) => i === 0 || events[i - 1].year <= e.year), '古代按纪年升序');
  ok(events[0].id === 'xia-establish' && events[events.length - 1].id === 'humen-1839',
    '古代时间轴首尾为夏建立/虎门销烟');
  ok(events.every((event, i) => event.dotClass === (i % 2 === 0 ? 'dot-red' : 'dot-teal')), '各组连接处也保持圆点交替');
  eq(p.data.eraName, '夏—清', '时代带名来自数据推导');
  ok(p.data.eraCount === 23 && p.data.eraRange === '公元前2070—1839' &&
    p.data.eraList.slice(0, 6).join(' · ') === '夏 · 商 · 西周 · 春秋 · 战国 · 秦' &&
    p.data.eraList.slice(-8).join(' · ') === '辽 · 北宋 · 西夏 · 金 · 南宋 · 元 · 明 · 清',
    '时代带含纪年区间与完整朝代脉络（含先秦/辽金西夏/元/明清）');

  p.onLoad({ mode: 'modern' });
  eq(p.data.mode, 'modern', 'mode 参数近现代');
  eq(p.data.groups.map((group) => group.items.length), [18], '近现代一组收录 18 条事件');
  eq(p.data.eraName, '晚清—新中国', '近现代时代带名推导');
  ok(p.data.eraCount === 3 && p.data.eraRange === '1840—1978' && p.data.eraList.indexOf('新中国') >= 0,
    '近现代时代带覆盖 1978 与新中国');

  const before = JSON.stringify(p.data);
  tap(p, 'switchMode', { mode: 'modern' });
  eq(JSON.stringify(p.data), before, '切换到当前模式为 no-op');

  tap(p, 'switchMode', { mode: 'ancient' });
  eq(p.data.mode, 'ancient', '切换回古代');
  eq(p.data.groups.length, 1, '返回古代时从首组开始');

  tap(p, 'onEvent', { id: 'chanyuan-1005' });
  eq(last('navigateTo').url, '/pages/event/event?id=chanyuan-1005', '事件卡 → 事件详情');

  const callsBefore = wxLog.length;
  tap(p, 'onEvent', { id: 'nope' });
  eq(wxLog.length, callsBefore, '未知 id 不产生导航');
})();

// ---------------------------------------------------------------------------
// 4. discover
// ---------------------------------------------------------------------------

console.log('== 发现 ==');

(function () {
  resetWifiStack();
  const p = pages.discover;

  p.onLoad();
  eq(p.data.periods.length, 6, '朝代六张卡');
  p.data.periods.forEach((item) =>
    ok(imgOk(item.img), `朝代卡有图 ${item.id}`)
  );
  eq(p.data.picks.length, 1, '精选史事只展示一条');
  eq(p.data.picks[0].id, 'yuanmingyuan-1860', '精选条为最新史事');
  eq(p.data.era.title, '盛唐气象', '盛唐长卷');
  eq(p.data.modern.shortTitle, '百年中国', '百年中国长卷');

  tap(p, 'onPeriod', { id: 'tang' });
  eq(last('navigateTo').url, '/pages/period/period?id=tang', '朝代卡 → 朝代详情页');

  const callsBefore = wxLog.length;
  tap(p, 'onPeriod', { id: 'nope' });
  eq(wxLog.length, callsBefore && wxLog.length, '未知朝代不导航');

  tap(p, 'onPick', { id: 'mukden-1931' });
  eq(last('navigateTo').url, '/pages/event/event?id=mukden-1931', '精选史事 → 事件详情');

  tap(p, 'goTimeline', { mode: 'modern' });
  eq(last('switchTab').url, '/pages/timeline/timeline', '专题长卷 → switchTab 近现代');
  eq(storage.shige_tab_params && storage.shige_tab_params.timelineMode, 'modern', '专题长卷 pending modern');

  tap(p, 'goTimeband', {});
  eq(storage.shige_tab_params && storage.shige_tab_params.timelineMode, 'ancient', '进时间轴链接 pending ancient');

  tap(p, 'goTimeline', { mode: 'modern' });
  tap(p, 'goTimeline', { mode: 'modern' });
  eq(last('switchTab').url, '/pages/timeline/timeline', '近现代起读 → switchTab');
})();

// ---------------------------------------------------------------------------
// 5. profile
// ---------------------------------------------------------------------------

console.log('== 我的 ==' );

(function () {
  resetWifiStack();
  const p = pages.profile;
  const personP = pages.person;
  const eventP = pages.event;

  p.onLoad();
  eq(p.data.stats.map((s) => s.value), [24, 100, 89, 2], '统计与数据种子一致');

  // 收藏：在人物详情页收藏苏轼 → 我的页出现
  personP.onLoad({ id: 'su-shi' });
  eq(personP.data.collected, false, '初始未收藏');
  tap(personP, 'toggleCollect');
  eq(personP.data.collected, true, '收藏后状态 true');
  personP.onLoad({ id: 'su-shi' });
  eq(personP.data.collected, true, '重进详情保持已收藏（本地存储）');
  const toastOn = last('showToast').title;
  ok(toastOn === '已收藏' || toastOn === '已取消收藏', `收藏 Toast (${toastOn})`);

  // 事件页收藏辛亥革命 → 累计两条
  eventP.onLoad({ id: 'xinhai-1911' });
  tap(eventP, 'toggleCollect');

  p.onShow();
  eq(p.data.identityMotion, true, '进入我的页启用身份卡入场动画');
  p.onHide();
  eq(p.data.identityMotion, false, '离开我的页移除身份卡动画类');
  p.refreshView();
  eq(p.data.identityMotion, false, '后台刷新数据不会触发入场动画');
  p.onShow();
  eq(p.data.identityMotion, true, '返回我的页重新启用入场动画');
  eq(p.data.favs.length, 2, '收藏列表两条');
  eq(p.data.favs[0].id, 'xinhai-1911', '最新收藏在前');
  ok(p.data.favs.some((x) => x.id === 'su-shi' && x.type === 'person'), '收藏含人物');
  ok(p.data.foots.some((x) => x.id === 'su-shi'), '足迹含刚浏览的人物');
  ok(p.data.foots.every((x) => x.when && x.when.length > 0), '足迹带时间');
  ok(p.data.favs.every((x) => x.img && imgOk(x.img)), '收藏条目带配图');
  eq(p.data.favs.find((x) => x.id === 'xinhai-1911').img, remoteEventImg('xinhai-1911') || artUrl('/assets/thumbs/republic-1.jpg'), '辛亥革命收藏优先专属事件图');
  ok(p.data.foots.every((x) => x.img && imgOk(x.img)), '足迹条目带配图');
  ok(fs.existsSync(path.join(ROOT, 'assets/avatar-scholar.jpg')), '手绘历史形象头像存在');

  // 取消收藏
  personP.onLoad({ id: 'su-shi' });
  tap(personP, 'toggleCollect');
  p.onShow();
  eq(p.data.favs.length, 1, '取消后剩一条收藏');

  // 再收藏一条用于跳转与移除验证
  tap(personP, 'toggleCollect');
  p.onShow();
  const target = p.data.favs[0];
  tap(p, 'onEntry', { type: target.type, id: target.id });
  ok(last('navigateTo').url.indexOf(target.id) >= 0, '收藏条目跳转详情');

  // 长按收藏行 → 确认移出
  tap(p, 'onFavLongPress', { type: 'person', id: 'su-shi' });
  eq(last('showModal').title, '移出收藏', '长按收藏行弹移出确认');
  confirmModal(true);
  p.onShow();
  eq(p.data.favs.length, 1, '确认后移出收藏');
  eq(store.listFavorites().length, 1, '存储层同步删除');

  tap(p, 'onSearch');
  eq(last('navigateTo').url, '/pages/search/search', '搜索入口');

  // 检查内容更新（离线路径）：提示 + 状态复位
  tap(p, 'onCheckUpdate');
  eq(last('showToast').title, '暂无网络，稍后再试', '检查更新离线提示');
  eq(p.data.updating, false, '检查更新失败后状态复位');

  // 关于阅史记（数据/素材/关于三合一）
  tap(p, 'onAbout');
  ok(p.data.info.open && p.data.info.title === '关于阅史记', '关于阅史记弹层');
  const aboutText = p.data.info.paragraphs.join('');
  ok(aboutText.indexOf('史事 100') >= 0, '关于弹层含数据统计');
  ok(aboutText.indexOf('公开网络') >= 0 && aboutText.indexOf('删除') >= 0, '关于弹层含素材来源一句话声明');
  ok(aboutText.indexOf('@DING') >= 0 && aboutText.indexOf('2026') >= 0, '关于弹层含开发者版权署名');
  tap(p, 'closeInfo');
  eq(p.data.info.open, false, '关于弹层可关闭');

  tap(p, 'onClearCache');
  const clearedBefore = storageCleared;
  confirmModal(false);
  eq(storageCleared, clearedBefore, '取消不清缓存');
  tap(p, 'onClearCache');
  confirmModal(true);
  eq(storageCleared, clearedBefore + 1, '确认后清缓存');
  p.onShow();
  eq(p.data.favs.length, 0, '清缓存后收藏清空（空态引导卡显示）');
  eq(p.data.foots.length, 0, '清缓存后足迹清空（空态引导卡显示）');
})();

// ---------------------------------------------------------------------------
// 6. 收藏 / 足迹折叠与分类页
// ---------------------------------------------------------------------------

console.log('== 收藏与足迹折叠 ==');

(function () {
  resetWifiStack();
  const p = pages.profile;

  ['su-shi', 'lu-xun'].forEach((id) => store.toggleFavorite('person', id));
  ['xinhai-1911', 'chanyuan-1005'].forEach((id) => store.toggleFavorite('event', id));
  store.addFootprint('person', 'su-shi');
  store.addFootprint('person', 'lu-xun');
  store.addFootprint('event', 'xinhai-1911');
  store.addFootprint('event', 'chanyuan-1005');

  p.onShow();
  eq(p.data.favCount, 4, '收藏总数四条');
  eq(p.data.favsShow.length, 3, '我的页收藏只展示前三条');
  eq(p.data.favHasMore, true, '收藏超过三条显示查看全部');
  eq(p.data.footsShow.length, 3, '我的页足迹只展示前三条');
  eq(p.data.footHasMore, true, '足迹超过三条显示查看全部');

  tap(p, 'onAllFavs');
  eq(last('navigateTo').url, '/pages/favorites/favorites', '查看全部收藏进独立页');
  const favPage = pages.favorites;
  favPage.onShow();
  eq(favPage.data.favCount, 4, '收藏页展示全部四条');
  eq(favPage.data.groups.map((g) => g.label), ['人物', '史事'], '收藏页按人物/史事分类');
  eq(favPage.data.groups.map((g) => g.items.length), [2, 2], '收藏分类计数');
  eq(favPage.data.fontClass, 'm', '收藏页同步字号');
  tap(favPage, 'onEntry', { type: 'person', id: 'su-shi' });
  eq(last('navigateTo').url, '/pages/person/person?id=su-shi', '收藏页条目跳人物详情');

  resetWifiStack();
  tap(p, 'onAllFoots');
  eq(last('navigateTo').url, '/pages/footprints/footprints', '查看全部足迹进独立页');
  const footPage = pages.footprints;
  footPage.onShow();
  eq(footPage.data.footCount, 4, '足迹页展示全部四条');
  eq(footPage.data.groups.map((g) => g.label), ['人物', '史事'], '足迹页按人物/史事分类');
  ok(footPage.data.foots.every((x) => x.when), '足迹页保留浏览时间');
  tap(footPage, 'onEntry', { type: 'event', id: 'chanyuan-1005' });
  eq(last('navigateTo').url, '/pages/event/event?id=chanyuan-1005', '足迹页条目跳事件详情');

  // 三条以内不出现「查看全部」
  store.toggleFavorite('person', 'su-shi');
  store.toggleFavorite('person', 'lu-xun');
  p.onShow();
  eq(p.data.favCount, 2, '取消后收藏两条');
  eq(p.data.favHasMore, false, '两条收藏不显示查看全部');

  // 返回键：纸捻胶囊 + CSS 笔锋，固定 156×56，不依赖位图比例
  ['person', 'event', 'period', 'search', 'footprints', 'favorites', 'archive', 'archive-list', 'archive-detail'].forEach((name) => {
    const wxml = fs.readFileSync(path.join(ROOT, 'pages', name, name + '.wxml'), 'utf8');
    const wxss = fs.readFileSync(path.join(ROOT, 'pages', name, name + '.wxss'), 'utf8');
    ok(wxml.indexOf('back-label') >= 0 && wxml.indexOf('返回') >= 0 && /hover-class="back-(?:hit-)?pressed"/.test(wxml), `${name} 使用返回胶囊`);
    ok(wxml.indexOf('back-chevron') >= 0 && wxml.indexOf('back-shaft') >= 0 && wxml.indexOf('back-arrow') < 0, `${name} 返回箭头由 CSS 绘制`);
    ok(/\.back\s*\{[^}]*display:\s*flex[^}]*width:\s*156rpx[^}]*height:\s*56rpx/.test(wxss) && /\.back-(?:pressed|hit-pressed\s+\.back)\s*\{[^}]*scale\(0\.97\)/.test(wxss), `${name} 返回胶囊固定 156×56`);
    if (['person', 'event', 'period', 'search'].includes(name)) {
      ok(/class="back-hit" bindtap="goBack" aria-role="button" aria-label="返回上一页"/.test(wxml), `${name} 返回区可被读屏识别为按钮`);
    }
  });

  // 独立页清空：确认后清空并刷新
  favPage.onShow();
  tap(favPage, 'onClear');
  eq(last('showModal').title, '清空收藏', '收藏页清空确认');
  confirmModal(true);
  eq(favPage.data.favCount, 0, '确认后收藏页清空');
  eq(store.listFavorites().length, 0, '收藏存储清空');

  footPage.onShow();
  tap(footPage, 'onClear');
  eq(last('showModal').title, '清空足迹', '足迹页清空确认');
  confirmModal(false);
  eq(footPage.data.footCount, 4, '取消不清空足迹');
  tap(footPage, 'onClear');
  confirmModal(true);
  eq(footPage.data.footCount, 0, '确认后足迹页清空');
  eq(store.listFootprints().length, 0, '足迹存储清空');
})();

// ---------------------------------------------------------------------------
// 7. 资料库
// ---------------------------------------------------------------------------

console.log('== 资料库 ==');

(function () {
  resetWifiStack();
  const discover = pages.discover;
  discover.onLoad();
  eq(discover.data.archive.totalText, '39,067', '发现页资料库总数文案');
  tap(discover, 'goArchive');
  eq(last('navigateTo').url, '/pages/archive/archive', '发现页进入资料库');

  const archive = pages.archive;
  archive.onLoad();
  eq(archive.data.stats.total, 39067, '资料库总数');
  eq(archive.data.stats.poemWorks, 10817, '诗文全文总数');
  eq(archive.data.categories.length, 9, '资料库九个辞条分类');
  eq(archive.data.sections.length, 13, '资料库十三个人物/事件/文献入口');
  eq(archive.data.categories[0].name, '职官辞典', '资料库分类按数量排序');
  eq(archive.data.rows.length, 5, '资料库首屏展示五个分类组');
  eq(archive.data.rows[0].name, '典籍辞条', '资料库首组为典籍辞条');
  eq(archive.data.groups.length, 5, '资料库五个分类组');
  eq(archive.data.groups[1].name, '人物', '人物单独成组');
  eq(archive.data.groups[1].countText, '5,242', '人物组数量');
  eq(archive.data.groups[2].name, '事件', '事件单独成组');
  eq(archive.data.groups[2].countText, '1,200', '事件组数量');
  eq(archive.data.groups[3].name, '文献', '文献单独成组');
  eq(archive.data.groups[3].countText, '4,566', '文献组数量');
  eq(archive.data.groups[4].name, '诗文', '诗文单独成组');
  eq(archive.data.groups[4].countText, '14,772', '诗文组数量');
  ok(archive.data.groups.every((group) => imgOk(group.cover)), '资料库五组都有分类题图');
  eq(archive.data.groups[0].cover, '/assets/scroll-accent.jpg', '典籍辞条题图');
  eq(archive.data.groups[2].cover, artUrl('/assets/thumbs/ming-2.jpg'), '事件题图');
  tap(archive, 'onGroupCoverErr', { key: 'events', index: 2 });
  ok(archive.data.rows[2].cover.startsWith('https://cdn.jsdelivr.net/'), '资料库分类题图失败后换备用域名');
  tap(archive, 'onGroupCoverErr', { key: 'events', index: 2 });
  eq(archive.data.rows[2].cover, '/assets/palace.jpg', '资料库分类题图双域失败显示本地图');
  eq(archive.data.stats.figuresText, '5,242', '首屏人物统计与人物组一致');
  eq(archive.data.stats.eventsText, '1,200', '首屏事件统计与事件组一致');

  tap(archive, 'onToggle', { key: 'cards' });
  eq(archive.data.openKey, 'cards', '展开典籍辞条');
  eq(archive.data.rows.length, 14, '展开后显示九个辞条分类');
  eq(archive.data.rows[1].name, '职官辞典', '展开后首条为职官辞典');
  tap(archive, 'onToggle', { key: 'cards' });
  eq(archive.data.rows.length, 5, '再次点击收起分类组');

  tap(archive, 'onToggle', { key: 'people' });
  eq(archive.data.rows.length, 7, '展开人物组显示两个入口');
  eq(archive.data.rows[2].name, '历代人物', '人物组首条为历代人物');
  tap(archive, 'onToggle', { key: 'people' });

  tap(archive, 'onToggle', { key: 'events' });
  eq(archive.data.rows.length, 8, '展开事件组显示三个入口');
  ok(
    archive.data.rows.some((row) => row.name === '历代战争'),
    '事件组包含历代战争'
  );
  tap(archive, 'onToggle', { key: 'events' });

  tap(archive, 'onToggle', { key: 'poems' });
  ok(
    archive.data.rows.some((row) => row.name === '诗文全文 · 诗'),
    '展开诗文组显示诗文入口'
  );
  resetWifiStack();
  tap(archive, 'onEntry', { kind: 'poems-shi', type: '', name: '诗文全文 · 诗' });
  ok(
    last('navigateTo').url.indexOf('/pages/archive-list/archive-list?kind=poems-shi') === 0,
    '资料库折叠项进列表页'
  );

  resetWifiStack();
  const catBefore = wxLog.length;
  tap(archive, 'onCategory', { key: '12', name: '诸子百家名句赏析' });
  ok(
    last('navigateTo').url.indexOf('/pages/archive-list/archive-list?kind=cards&type=12') === 0,
    '资料库分类进列表页'
  );
  resetWifiStack();
  tap(archive, 'onSection', { key: 'figures', name: '历代人物' });
  ok(
    wxLog.slice(-3).some((entry) => entry.kind === 'request' && /figures\/head\.json$/.test(entry.url)),
    '点击入口即预取栏目 head（转场期间请求已在路上）'
  );
  eq(
    last('navigateTo').url,
    '/pages/archive-list/archive-list?kind=figures&title=%E5%8E%86%E4%BB%A3%E4%BA%BA%E7%89%A9',
    '资料库人物入口进列表页'
  );

  const list = pages['archive-list'];
  const listBefore = wxLog.length;
  list.onLoad({ kind: 'cards', type: '12', title: '诸子百家名句赏析' });
  const listUrls = wxLog
    .slice(catBefore)
    .filter((entry) => entry.kind === 'request')
    .map((entry) => entry.url);
  ok(listUrls.some((url) => /\/cards\/12\/head\.json$/.test(url)), '首屏只拉 head 轻量包（~12KB）');
  ok(
    listUrls.filter((url) => /\/cards\/12\/part-\d+\.json$/.test(url)).length === 1,
    '后台限流补齐全部分块'
  );
  ok(!listUrls.some((url) => /\/cards\/12\/index\.json$/.test(url)), '不再整份拉 index.json');
  ok(!listUrls.some((url) => /\/cards\/12\/00\.json$/.test(url)), '列表首屏不拉详情分卷');
  eq(list.data.loading, false, '资料库列表加载完成');
  eq(list.data.total, 246, '资料库列表总数');
  eq(list.data.cover, artUrl('/assets/paintings/tang.jpg'), '资料库列表分类题图');
  eq(list.data.coverMeta, '246 条', '资料库列表题图显示条数');
  eq(list.data.shown.length, 60, '资料库列表首屏 60 条');
  list.onMore();
  eq(list.data.shown.length, 120, '资料库列表加载更多');
  list.onReachBottom();
  eq(list.data.shown.length, 180, '滚动到底自动加载下一批');
  list.limit = list.data.total + 60; // 模拟已到末尾
  list.setData({ shown: list.filtered.slice(0, list.limit) });
  list.onReachBottom();
  ok(list.data.shown.length <= list.data.total, '已到末尾不再追加');
  const first = list.data.shown[0];
  ok(first.shard, '列表索引带详情分卷 key');
  ok(!first.text, '列表索引不携带正文');
  ok(fs.existsSync(path.join(ROOT, 'data', 'apk', 'cards', '12', 'index.json')), '分类列表索引文件存在');
  ok(!fs.existsSync(path.join(ROOT, 'data', 'apk', 'cards', '12.json')), '旧整类 JSON 已移除');
  ok(
    storage['shige_apk_v3_cards_12_index_json'] &&
      storage['shige_apk_v3_cards_12_index_json'].items.length === 246,
    '列表索引写入本地缓存'
  );
  list.onInput({ detail: { value: first.title.slice(0, 2) } });
  ok(list.data.total > 0, '资料库列表可搜索');
  list.clearKeyword();
  eq(list.data.total, 246, '清空搜索恢复全量');
  ok(list.haystack && list.haystack.length === 246, '检索索引预构建（万级条目零分配过滤）');
  list.onInput({ detail: { value: 'zzz绝无仅有' } });
  ok(list.data.empty, '资料库检索无结果进空态');
  list.clearKeyword();
  eq(list.data.total, 246, '清空后再次恢复全量');

  // 不断层（2026-10-31）：分块失败时只合并「head + 连续成功前缀」，中段绝不空洞；
  // 残缺数据不写缓存；退避重试补齐后无缝续上完整索引。
  // quotes：677 条 = head 200 + part-1 200 + part-2 200 + part-3 77。
  const realSetTimeout = global.setTimeout;
  global.setTimeout = (fn) => { fn(); return 0; }; // 退避等待压缩为同步，重试轮在测试内跑完
  let apkFailLeft = 2; // part-2 首轮两次尝试（含 loadFile 内部重试）都失败
  mockRequest.apkFail = (rel) => /quotes\/part-2\.json$/.test(rel) && apkFailLeft-- > 0;
  const apkPath = path.join(ROOT, 'utils', 'apkData.js');
  delete require.cache[require.resolve(apkPath)]; // 全新模块实例，避免既有内存/缓存干扰
  const apkFresh = require(apkPath);
  Object.keys(storage).forEach((k) => {
    if (k.indexOf('shige_apk_v3_quotes') === 0) delete storage[k];
  });
  const seen = [];
  let cacheDuringPartial = null;
  apkFresh.load('quotes', '', (err, items, info) => {
    if (items.length === 400 && cacheDuringPartial === null) {
      cacheDuringPartial = !!storage['shige_apk_v3_quotes_index_json'];
    }
    seen.push({ err: !!err, items, info });
  });
  mockRequest.apkFail = null;
  global.setTimeout = realSetTimeout;

  eq(seen[0].items.length, 200, '首屏先出 head 200 条（优先加载一部分）');
  ok(seen[0].info.partial && seen[0].info.total === 677, '首屏 partial 且 total 为全量条数');
  const partial400 = seen.find((s) => s.items.length === 400);
  ok(partial400 && partial400.info.partial, 'part-2 失败：交付 head+part-1 连续前缀');
  ok(partial400 && partial400.info.loaded === 400, '进度回调带已载入条数');
  ok(partial400 && partial400.items.every((x) => x.id), '部分交付条目也全部规范化');
  ok(!seen.some((s) => s.items.length === 477), '绝不交付「part-3 顶上」的开洞数据（477）');
  ok(cacheDuringPartial === false, '残缺索引绝不写入缓存（partial 交付时点快照）');
  eq(seen[seen.length - 1].items.length, 677, '重试补齐 part-2 后交付完整索引（677 无断层）');
  ok(!seen[seen.length - 1].info.partial && seen[seen.length - 1].info.loaded === 677,
    '完整交付 partial=false 且 loaded=全量');
  ok(
    storage['shige_apk_v3_quotes_index_json'] &&
      storage['shige_apk_v3_quotes_index_json'].items.length === 677,
    '完整索引才写缓存'
  );
  ok(seen[seen.length - 1].items.every((x) => x.id), '完整索引条目全部规范化');

  const detail = pages['archive-detail'];
  const detailBefore = wxLog.length;
  detail.onLoad({
    kind: 'cards',
    type: '12',
    shard: first.shard,
    title: '诸子百家名句赏析',
    id: first.id
  });
  const detailUrls = wxLog
    .slice(detailBefore)
    .filter((entry) => entry.kind === 'request')
    .map((entry) => entry.url);
  ok(detailUrls.some((url) => /\/cards\/12\/00\.json$/.test(url)), '详情直接请求单卷');
  ok(!detailUrls.some((url) => /\/cards\/12\/index\.json$/.test(url)), '详情不再重复拉列表索引');
  ok(storage['shige_apk_v3_cards_12_00_json'], '详情分卷写入本地缓存');
  eq(detail.data.loading, false, '资料库详情加载完成');
  eq(detail.data.item.id, first.id, '资料库详情命中条目');
  eq(detail.data.cover, artUrl('/assets/paintings/tang.jpg'), '资料详情分类题图');
  ok(detail.data.blocks.length > 0, '资料库详情正文分段');
  ok(detail.data.sections.length >= 4, '名句详情拆出原文/注释/译文/赏析');
  ok(detail.data.sections.some((section) => section.label === '原文'), '名句详情保留原文小标题');
  ok(detail.data.showSections === true, '名句详情启用结构化段落');
  ok(detail.data.kicker === '诸子百家名句赏析', '资料库详情保留分类名');
  ok(detail.onShareAppMessage().path.indexOf('kind=cards') >= 0, '资料库详情分享带参数');
  ok(detail.onShareAppMessage().path.indexOf('shard=' + first.shard) >= 0, '资料库详情分享带分卷');
  assertSharePanel(detail, { kicker: detail.data.kicker, pathTail: 'archive-detail/archive-detail?kind=' }, '资料详情页');

  // 列表点击条目 → 转场期间预取详情分卷
  resetWifiStack();
  list.onItem({ currentTarget: { dataset: { id: first.id, shard: '01' } } });
  ok(
    wxLog.slice(-2).some((entry) => entry.kind === 'request' && /\/cards\/12\/01\.json$/.test(entry.url)),
    '点击条目即预取详情分卷'
  );
  ok(last('navigateTo').url.indexOf('/pages/archive-detail/archive-detail') === 0, '点击条目进详情页');

  // head 分批加载契约（2026-10-31 渐进交付）：首回调 head 200 条（partial + 全量 total），
  // 每接上一块「连续前缀」就再回调一次（长度单调不减、无断层），最终回调完整索引（partial=false）
  const apkMod = require(path.join(ROOT, 'utils', 'apkData.js'));
  const headCalls = [];
  apkMod.load('wars', '', (err, items, info) => {
    headCalls.push({
      err,
      n: items ? items.length : 0,
      partial: !!(info && info.partial),
      total: (info && info.total) || 0
    });
  });
  ok(headCalls.length >= 2, '分批渐进回调（head → 连续前缀 → 完整）');
  ok(headCalls[0].partial === true && headCalls[0].n === 200 && headCalls[0].total === 466,
    '首屏回调 head 200 条且带全量 total');
  const finalCall = headCalls[headCalls.length - 1];
  ok(finalCall.partial === false && finalCall.n === 466, '完整目录后台补齐后终回调全量');
  ok(headCalls.every((c, i) => i === 0 || c.n >= headCalls[i - 1].n), '渐进回调长度单调不减（列表平滑生长）');
  ok(!headCalls.some((c) => c.n !== 200 && c.n !== 400 && c.n !== 466),
    '每个交付点都在块边界上，绝不交付带洞数据');

  list.onLoad({ kind: 'figures', title: '历代人物' });
  eq(list.data.total, 4869, '人物资料列表总数');
  eq(list.data.shown.length, 60, '人物资料首屏 60 条');
  const figure = list.data.shown[0];
  ok(figure.title && figure.meta, '人物资料含姓名与朝代身份');
  detail.onLoad({ kind: 'figures', title: '历代人物', id: figure.id });
  eq(detail.data.loading, false, '人物资料详情加载完成');
  ok(detail.data.blocks.length > 0, '人物资料详情有正文');
  ok(detail.data.showLead === false, '人物小传不重复摘要');

  list.onLoad({ kind: 'quotes', title: '名句赏析' });
  eq(list.data.total, 677, '名句资料列表总数');
  const quote = list.data.shown[0];
  detail.onLoad({ kind: 'quotes', title: '名句赏析', id: quote.id });
  eq(detail.data.loading, false, '名句资料详情加载完成');
  ok(detail.data.item.translation, '名句资料带译文');
  ok(detail.data.showTranslation === true, '名句资料显示译文段');

  list.onLoad({ kind: 'wenyan', title: '文言辞条' });
  eq(list.data.total, 3889, '文言辞条列表总数');
  const wenyan = list.data.shown[0];
  ok(wenyan.title && wenyan.meta, '文言辞条含字头与读音');
  detail.onLoad({ kind: 'wenyan', title: '文言辞条', id: wenyan.id });
  eq(detail.data.loading, false, '文言辞条详情加载完成');
  ok(detail.data.blocks.length > 0, '文言辞条详情有正文');

  list.onLoad({ kind: 'poemquotes', title: '诗文名句' });
  eq(list.data.total, 3955, '诗文名句列表总数');
  const poemQuote = list.data.shown[0];
  ok(poemQuote.title && poemQuote.meta, '诗文名句含原文与作者');
  detail.onLoad({ kind: 'poemquotes', title: '诗文名句', id: poemQuote.id });
  eq(detail.data.loading, false, '诗文名句详情加载完成');
  ok(detail.data.item.facts.length > 0, '诗文名句详情保留出处信息');
  eq(detail.data.factRows.length, detail.data.item.facts.length, '诗文名句资料卡解析为键值');
  ok(detail.data.factRows.every((row) => row.key), '诗文名句资料卡都有字段名');
  ok(detail.data.showLead === false, '诗文名句不重复摘要');

  list.onLoad({ kind: 'poems-shi', title: '诗文全文 · 诗' });
  eq(list.data.total, 2938, '诗文全文·诗 列表总数');
  eq(list.data.searchPlaceholder, '搜索篇名 / 作者 / 朝代', '诗文列表搜索提示');
  eq(list.data.shown.length, 60, '诗文全文首屏 60 条');
  const poem = list.data.shown[0];
  ok(poem.shard && poem.title && poem.meta, '诗文索引带分卷与作者');
  detail.onLoad({
    kind: 'poems-shi',
    type: poem.shard,
    title: '诗文全文 · 诗',
    id: poem.id
  });
  eq(detail.data.loading, false, '诗文全文详情加载完成');
  ok(detail.data.item.text.indexOf('### 原文') >= 0, '诗文全文含原文分段');
  ok(detail.data.showLead === false, '诗文全文不重复摘要');
  ok(detail.data.blocks.length > 1, '诗文全文详情多段渲染');
  ok(detail.data.sections.some((section) => section.label === '原文'), '诗文详情拆出原文段');

  // 条目配图（2026-10-24）：主站图匹配 > 资料库自抓图 > 无图
  // 自抓图清单已移出主包（jsDelivr 加载），selftest 从仓库 JSON 注入测试
  const archiveArt = require(path.join(ROOT, 'utils', 'archiveArt.js'));
  archiveArt._setRemote(JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'img', 'archive', 'art-remote.json'), 'utf8')));
  ok(archiveArt.isLoaded(), '资料详情配图 · 自抓图清单（远端版）注入');
  ok(archiveArt.entryImage('figures', 'hf-song4chao2_su1shi4') === remotePersonImg('su-shi'),
    '资料详情配图 · 苏轼条目匹配主站人物图');
  ok(archiveArt.entryImage('emperors', 'hem-0186-tang2chao2_li3shi4min2') === remotePersonImg('tang-taizong'),
    '资料详情配图 · 唐太宗条目匹配主站人物图');
  ok(archiveArt.entryImage('events', 'he-195') === remoteEventImg('chanyuan-1005'),
    '资料详情配图 · 澶渊之盟条目匹配主站事件图');
  ok(archiveArt.entryImage('wars', 'hw-w17066792697D6B4') === artUrl('/assets/eventart/chibi.jpg'),
    '资料详情配图 · 赤壁之战条目命中已有专属图');
  ok(archiveArt.entryImage('figures', 'no-such-id') === '', '资料详情配图 · 未命中且未自抓返回空');
  ok(archiveArt.entryImage('cards', '12') === '' && archiveArt.entryImage('quotes', 'x') === '',
    '资料详情配图 · 辞条/名句类不配图');
  const matchCount = ['figures', 'emperors', 'events', 'wars']
    .reduce((sum, kind) => sum + Object.keys(require(path.join(ROOT, 'utils', 'archiveArtMatch.js'))[kind]).length, 0);
  ok(matchCount >= 120, `主站图标题匹配覆盖 ${matchCount} 条（>=120）`);
  // 完整索引拼接后必须全为对象行（part 行已规范化），part 区段条目可按 id 找到
  apkMod.loadIndex('figures', '', (e, items) => {
    ok(items.length === 4869 && items.every((x) => x && x.id && x.title), '完整索引全量对象行（part 行已规范化）');
    ok(items.some((x) => x.id === 'hf-song4chao2_su1shi4'), 'part 区段条目（苏轼）在完整索引中');
  });
  detail.onLoad({ kind: 'figures', id: 'hf-song4chao2_su1shi4', title: '历代人物' });
  ok(detail.data.art === remotePersonImg('su-shi'), '详情页 onLoad 装配条目画片');

  const entryCount = (archive.groups || []).reduce((sum, group) => sum + (group.items || []).length, 0);
  eq(entryCount, 22, '资料库共 22 个栏目入口');
  const beforeIdle = wxLog.length;
  const setTimeoutReal = global.setTimeout;
  try {
    global.setTimeout = (fn) => { fn(); return 0; };
    archive.onShow();
  } finally {
    global.setTimeout = setTimeoutReal;
  }
  ok(!wxLog.slice(beforeIdle).some((entry) => entry.kind === 'request'), '资料库首页空闲浏览不发栏目请求');

  // 跨进程保留 head 元数据；旧缓存中的完整索引仍兼容固定列数组。
  apkMod.prefetchHead('emperors', '');
  delete require.cache[require.resolve(apkPath)];
  const restarted = require(apkPath);
  const afterRestart = wxLog.length;
  const warm = [];
  restarted.load('emperors', '', (err, items, info) => warm.push({ err, items, info }));
  eq(warm[0].info.total, 373, '重启后缓存 head 保留栏目总数');
  eq(warm[0].items.length, 200, '重启后从缓存交付 head 首屏');
  eq(warm[warm.length - 1].items.length, 373, '重启后继续补齐目录');
  ok(!wxLog.slice(afterRestart).some((entry) => /emperors\/head\.json$/.test(entry.url)), '重启后无需重复下载 head');

  try {
    global.setTimeout = (fn) => { fn(); return 0; };
    mockRequest.apkFail = (rel) => rel === 'dynasty/head.json';
    restarted.load('dynasty', '', (err, items, info) => {
      ok(!err && items.length === 29 && !info.partial, 'head 不可用时，旧版整份索引回退成功');
    });
  } finally {
    mockRequest.apkFail = null;
    global.setTimeout = setTimeoutReal;
  }

  storage.shige_apk_v3_poems_fu_index_json = {
    at: Date.now(),
    items: JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'apk', 'poems', 'fu', 'index.json'), 'utf8'))
  };
  const beforeLegacy = wxLog.length;
  restarted.load('poems-fu', '', (err, items) => {
    ok(!err && items.length === 27 && items.every((item) => item.id && item.title), '旧版完整索引缓存规范化为展示行');
  });
  eq(wxLog.length, beforeLegacy, '旧版完整索引缓存可以离线使用');

  list.onLoad({ kind: 'emperors' });
  list.onInput({ detail: { value: '高从诲' } });
  const corrected = list.data.shown.find((item) => item.id === 'hem-0050-wu3dai4shi2guo2_gao1cong2hui4');
  ok(corrected && corrected.title === '高从诲', '用更正后的姓名可搜到原条目');
  detail.onLoad({ kind: 'emperors', id: 'hem-0050-wu3dai4shi2guo2_gao1cong2hui4', shard: '00' });
  ok(detail.data.showSections && detail.data.item.source.includes('南平世家'), '修订条目保留旧链接并展示正文及出处');

  const requestReal = wx.request;
  const heldParts = [];
  try {
    wx.request = (opts) => {
      if (/\/events\/part-\d+\.json$/.test(opts.url)) heldParts.push(opts);
      else requestReal(opts);
    };
    list.onLoad({ kind: 'events' });
  } finally {
    wx.request = requestReal;
  }
  eq(heldParts.length, 3, '史事栏目首屏后并发请求三块');
  eq(list.data.shown.length, 60, '分块在途时可读首屏');
  list.onReachBottom();
  eq(list.data.shown.length, 120, '分块在途时可以翻已经载入的条目');
  const eventsIndex = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'apk', 'events', 'index.json'), 'utf8'));
  const keyword = eventsIndex.slice(400).find((row) => !eventsIndex.slice(0, 400).some((earlier) => earlier.slice(1, 4).join(' ').includes(row[1])))[1];
  list.onInput({ detail: { value: keyword } });
  ok(!list.data.empty && list.data.resultCount === 0, '分块在途时无匹配不显示已检索完毕');
  requestReal(heldParts[2]);
  requestReal(heldParts[0]);
  try {
    global.setTimeout = (fn) => { fn(); return 0; };
    mockRequest.apkFail = (rel) => rel === 'events/part-2.json';
    requestReal(heldParts[1]);
  } finally {
    global.setTimeout = setTimeoutReal;
    mockRequest.apkFail = null;
  }
  ok(list.data.stalled && list.all.length === 400, '重试耗尽时保持连续前缀并允许点按重试');
  ok(!storage.shige_apk_v3_events_index_json, '重试耗尽时不缓存残缺索引');
  const beforeRetry = wxLog.length;
  list.retry();
  const retried = wxLog.slice(beforeRetry).filter((event) => event.kind === 'request');
  eq(retried.length, 1, '点按重试复用已成功的分块');
  ok(retried.some((event) => /events\/part-2\.json$/.test(event.url)), '只重新下载失败分块');
  ok(!list.data.partial && !list.data.stalled && list.all.length === 705, '点按重试后目录补齐');
  ok(list.data.shown.some((item) => item.title === keyword), '分块补齐后自动更新当前搜索结果');
  eq(list.data.resultCount, list.data.shown.length, '搜索结果翻页按实际匹配数计算');
  list.onReachBottom();
  eq(list.limit, 60, '搜索结果已全部显示时滚动不再增加分页');
})();

// ---------------------------------------------------------------------------
// 6.5 资料库条目收藏与足迹
// ---------------------------------------------------------------------------

console.log('== 资料收藏与足迹 ==');

(function () {
  resetWifiStack();
  store.clearFavorites();
  store.clearFootprints();
  const detail = pages['archive-detail'];
  const p = pages.profile;
  const favPage = pages.favorites;
  const footPage = pages.footprints;
  const key = 'figures||hf-song4chao2_su1shi4';

  // 浏览即留足迹，快照含标题/栏目/条目id/分卷/分类名
  detail.onLoad({ kind: 'figures', id: 'hf-song4chao2_su1shi4', title: '历代人物' });
  eq(detail.data.loading, false, '资料详情加载完成（收藏链路）');
  const foot = store.listFootprints().find((x) => x.type === 'archive' && x.id === key);
  ok(!!foot, '浏览资料详情留下足迹');
  ok(
    !!foot &&
      foot.info.title === '苏轼' &&
      foot.info.kind === 'figures' &&
      foot.info.aType === '' &&
      foot.info.rawId === 'hf-song4chao2_su1shi4' &&
      foot.info.shard === '18' &&
      foot.info.cat === '历代人物',
    '足迹快照含标题/栏目/条目id/分卷/分类名'
  );

  // 收藏切换：详情页按钮 → 存储 → 重进保持
  eq(detail.data.collected, false, '资料初始未收藏');
  tap(detail, 'toggleCollect');
  eq(detail.data.collected, true, '资料收藏生效');
  ok(store.isFavorite('archive', key), '资料收藏写入存储');
  detail.onLoad({ kind: 'figures', id: 'hf-song4chao2_su1shi4', title: '历代人物' });
  eq(detail.data.collected, true, '重进资料详情保持已收藏');

  // 我的页：解析快照出展示行（不回查远端数据）
  p.onShow();
  const fav = p.data.favs.find((x) => x.type === 'archive');
  ok(!!fav && fav.title === '苏轼', '我的页收藏含资料条目');
  ok(!!fav && fav.sub === '宋朝 · 文学家、词人、书法家', '资料收藏行副标题取条目 meta');
  ok(!!fav && imgOk(fav.img), '资料收藏行图有效（主站匹配/自抓图/分类题图）');
  ok(
    !!fav &&
      fav.nav.indexOf('/pages/archive-detail/archive-detail?kind=figures') === 0 &&
      fav.nav.indexOf('id=hf-song4chao2_su1shi4') >= 0 &&
      fav.nav.indexOf('shard=18') >= 0,
    '资料收藏跳转链接完整（kind/shard/id）'
  );
  tap(p, 'onEntry', { type: 'archive', id: key });
  ok(last('navigateTo').url.indexOf('/pages/archive-detail/archive-detail') === 0, '我的页资料收藏可跳转');

  // 长按移出（与人物/史事同一交互）
  tap(p, 'onFavLongPress', { type: 'archive', id: key });
  eq(last('showModal').title, '移出收藏', '资料收藏长按弹移出确认');
  confirmModal(true);
  ok(store.listFavorites().length === 0, '资料收藏可移出');

  // 收藏页「资料」分组与跳转
  store.toggleFavorite('archive', key, { info: foot.info });
  store.toggleFavorite('person', 'su-shi');
  favPage.onShow();
  ok(
    favPage.data.groups.some((g) => g.key === 'archive' && g.label === '资料'),
    '收藏页出现「资料」分组'
  );
  ok(
    favPage.data.rows.filter((r) => r.kind === 'header').map((r) => r.label).join('/') === '人物/资料',
    '收藏页分组顺序人物在前资料在后'
  );
  const row = favPage.data.rows.find((r) => r.kind === 'item' && r.type === 'archive');
  ok(!!row && imgOk(row.img), '收藏页资料行带有效行图');
  favPage.onEntry({ currentTarget: { dataset: { type: 'archive', id: key } } });
  ok(last('navigateTo').url.indexOf('kind=figures') >= 0, '收藏页资料行跳资料详情');

  // 足迹页：资料分组 + 浏览时间
  footPage.onShow();
  ok(footPage.data.groups.some((g) => g.key === 'archive'), '足迹页出现「资料」分组');
  ok(footPage.data.foots.every((x) => x.when && x.when.length > 0), '资料足迹带浏览时间');
  footPage.onEntry({ currentTarget: { dataset: { type: 'archive', id: key } } });
  ok(last('navigateTo').url.indexOf('/pages/archive-detail/archive-detail') === 0, '足迹页资料行跳资料详情');

  // 无快照的残缺条目解析为 null，不进收藏页
  store.clearFavorites();
  store.toggleFavorite('archive', 'figures||bad-id');
  favPage.onShow();
  ok(!favPage.data.rows.some((r) => r.kind === 'item' && r.type === 'archive'), '残缺资料收藏不渲染');

  // 清理，不影响后续分段
  store.clearFavorites();
  store.clearFootprints();
})();

// ---------------------------------------------------------------------------
// 7. person
// ---------------------------------------------------------------------------

console.log('== 人物详情 ==');

(function () {
  resetWifiStack();
  const p = pages.person;

  p.onLoad({ id: 'su-shi' });
  eq(p.data.person.name, '苏轼', '苏轼载入');
  eq(p.data.related.map((e) => e.id), ['wanganshi-1069'],
    '相关史事映射（对齐审校后：苏轼仅关联王安石变法）');
  eq(p.data.accent, 'ancient', '古代赭石');
  eq(p.data.seal, '苏', '顶栏小印取自人名首字');
  eq(p.data.headImg, remotePersonImg('su-shi') || artUrl('/assets/paintings/song.jpg'), '人物头卡：苏轼优先专属图，否则宋画');
  eq(p.data.related.map((e) => e.img),
    p.data.related.map((e) => remoteEventImg(e.id) || artUrl('/assets/paintings/song.jpg')),
    '相关史事行图：事件专属图优先，无则朝代画');

  p.onLoad({ id: 'lu-xun' });
  eq(p.data.accent, 'modern', '近现代蓝灰');
  eq(p.data.related.length, 3, '鲁迅相关史事三条');
  eq(p.data.headImg, remotePersonImg('lu-xun') || artUrl('/assets/paintings/landscape.jpg'), '鲁迅头卡优先专属图，否则千里江山图');
  ok(p.data.related.every((e) => e.img && imgOk(e.img)), '鲁迅相关史事缩略图存在');

  p.onLoad({ id: 'mao-zedong' });
  eq(p.data.headImg, remotePersonImg('mao-zedong') || artUrl('/assets/paintings/modern.jpg'), '毛泽东头卡优先专属图，否则开国大典');

  p.onLoad({ id: 'zhao-kuangyin' });
  eq(p.data.person.name, '赵匡胤', '赵匡胤载入');
  eq(p.data.related.length, 1, '赵匡胤相关史事一条');

  p.onLoad({ id: 'wang-anshi' });
  eq(p.data.related.length, 1, '王安石相关史事一条');

  p.onLoad({ id: 'lin-zexu' });
  eq(p.data.accent, 'modern', '林则徐按晚清走蓝灰');

  // 分享路径
  wxLog.length = 0;
  const share = p.onShareAppMessage();
  ok(share && share.path === '/pages/person/person?id=lin-zexu', '人物页分享带 id 参数');
  assertSharePanel(p, { kicker: '人物 · 晚清', pathTail: '/pages/person/person?id=lin-zexu' }, '人物页');

  // 每日名句：同日确定性抽取（日期种子），不同日期种子可换
  const q1 = qrshare.dailyQuote();
  const q2 = qrshare.dailyQuote();
  ok(q1 && q2 && q1.quote === q2.quote && q1.source === q2.source, '每日名句同日确定性');
  const qFixed = qrshare.dailyQuote(new Date(2026, 10, 14));
  ok(typeof qFixed.quote === 'string' && qFixed.quote.length >= 4, '每日名句固定日期可复现抽取');
  ok(qrshare.lunarText(new Date(2026, 10, 14)).indexOf('农历') === 0, '农历日期文本格式');
  ok(qrshare.dateText(new Date(2026, 10, 14)) === '2026年11月14日', '公历日期文本格式');

  resetWifiStack();
  p.onLoad({ id: 'nope' });
  eq(last('switchTab').url, '/pages/home/home', '未知人物回退首页');

  p.onLoad({ id: 'su-shi' });
  tap(p, 'goEvent', { id: 'jingkang-1127' });
  eq(last('navigateTo').url, '/pages/event/event?id=jingkang-1127', '相关史事 → 事件详情');
})();

// ---------------------------------------------------------------------------
// 6.5 朝代详情页
// ---------------------------------------------------------------------------

console.log('== 朝代详情 ==');

(function () {
  resetWifiStack();
  const p = pages.period;

  p.onLoad({ id: 'han' });
  eq(p.data.period.name, '西汉', '西汉朝代载入');
  eq(p.data.period.yearText, '前202–公元9', '纪年带载入');
  eq(p.data.events.map((e) => e.id), ['chuhan', 'han-wudi', 'zhangqian-138', 'mobei-119', 'simaqian-shiji'], '西汉收录五条史事');
  ok(p.data.span.indexOf('公元前202') >= 0 && p.data.span.indexOf('前91') >= 0, '西汉span覆盖首尾纪年');
  eq(p.data.seal, '汉', '小印');

  p.onLoad({ id: 'song' });
  eq(p.data.events.map((e) => e.id), ['chenqiao-960', 'chanyuan-1005', 'qingli-1043', 'wanganshi-1069', 'jingkang-1127'], '北宋收录五条史事（含庆历新政）');
  ok(p.data.span.length > 0, '时代脉络非空');
  ok(p.data.events[0].year <= p.data.events[p.data.events.length - 1].year, '北宋史事按纪年升序');

  p.onLoad({ id: 'qin' });
  eq(p.data.period.name, '秦', '秦朝代载入');
  eq(p.data.events.map((e) => e.id), ['qin-unify', 'fen-shu', 'chensheng'], '秦收录统一/焚书/陈胜');
  eq(p.data.seal, '秦', '秦代小印');
  ok(p.data.period.img && fs.existsSync(path.join(ROOT, p.data.period.img)), '秦代配图存在');

  p.onLoad({ id: 'nansong' });
  eq(p.data.events.map((e) => e.id), ['yuefei', 'shaoxing', 'zhuxi-ehu', 'yashan'], '南宋收录四条史事');
  ok(p.data.span.indexOf('1140') >= 0 && p.data.span.indexOf('1279') >= 0, '南宋 span 覆盖首尾');

  p.onLoad({ id: 'ming' });
  eq(p.data.period.name, '明', '明代载入');
  eq(p.data.events.map((e) => e.id),
    ['ming-establish', 'zhenghe-1405', 'yongle-beijing', 'tumu-1449', 'ningwang-1519', 'taizhou-1561', 'bencao', 'zhangjuzheng-1581', 'tiangong', 'nongzheng', 'ming-wang-1644'],
    '明收录十一条史事（纪年升序）');
  eq(p.data.seal, '明', '明代小印');

  p.onLoad({ id: 'qing' });
  eq(p.data.period.name, '清', '清代载入');
  eq(p.data.events.map((e) => e.year), [1644, 1673, 1681, 1754, 1773, 1839, 1840, 1851, 1860, 1861, 1878, 1894, 1898], '清合并「清/晚清」史事（纪年升序，含四库全书）');
  ok(p.data.span.indexOf('1644') >= 0 && p.data.span.indexOf('1898') >= 0, '清 span 覆盖首尾纪年');

  p.onLoad({ id: 'modern' });
  eq(p.data.events.length, 18, '近现代面板收录十八条');
  eq(p.data.seal, '近', '近现代小印');

  p.onLoad({ id: 'tang' });
  eq(p.data.events.map((e) => e.id), ['xuanwumen-626', 'zhenguan-627', 'xuanzang', 'wuzetian', 'kaiyuan-713', 'anshi-755', 'huangchao'], '唐收录七条史事');
  ok(p.data.span.indexOf('626') >= 0 && p.data.span.indexOf('875') >= 0, '唐span按首尾纪年');
  ok(p.data.period.title === '盛唐气象', '唐卡载入');
  tap(p, 'goTimeline');
  eq(last('switchTab').url, '/pages/timeline/timeline', '唐页底部进时间轴（switchTab）');
  eq(storage.shige_tab_params && storage.shige_tab_params.timelineMode, 'ancient', '唐页 pending ancient');

  wxLog.length = 0;
  p.onLoad({ id: 'han' });
  ok(p.onShareAppMessage().path === '/pages/period/period?id=han', '朝代页分享带 id 参数');
  assertSharePanel(p, { kicker: '大汉气象', pathTail: '/pages/period/period?id=han' }, '朝代页');
  tap(p, 'goEvent', { id: 'han-wudi' });
  eq(last('navigateTo').url, '/pages/event/event?id=han-wudi', '朝代史事列表 → 事件详情');
  resetWifiStack();

  p.onLoad({ id: 'nope' });
  eq(last('switchTab').url, '/pages/home/home', '未知朝代回退首页');
  resetWifiStack();
})();

// ---------------------------------------------------------------------------
// 7. event
// ---------------------------------------------------------------------------

console.log('== 分享直达返回 ==');
for (const [name, fallback, method] of [
  ['event', 'home', 'switchTab'],
  ['person', 'home', 'switchTab'],
  ['period', 'home', 'switchTab'],
  ['archive-detail', 'archive', 'redirectTo'],
  ['archive-list', 'archive', 'redirectTo'],
  ['archive', 'home', 'switchTab'],
  ['search', 'home', 'switchTab'],
  ['favorites', 'profile', 'switchTab'],
  ['footprints', 'profile', 'switchTab']
]) {
  resetWifiStack();
  navStack[0] = name;
  wxLog.length = 0;
  tap(pages[name], 'goBack');
  eq(last(method)?.url, `/pages/${fallback}/${fallback}`, `${name} 无上一页时返回指定入口`);

  navStack[0] = 'fixture';
  navStack.push(name);
  wxLog.length = 0;
  tap(pages[name], 'goBack');
  eq(navStack, ['fixture'], `${name} 有上一页时正常返回`);
  eq(wxLog.length, 0, `${name} 有上一页时不触发兜底跳转`);
}

console.log('== 事件详情 ==');

(function () {
  resetWifiStack();
  const p = pages.event;

  p.onLoad({ id: 'chanyuan-1005' });
  eq(p.data.event.title, '澶渊之盟', '澶渊之盟载入');
  eq(p.data.relatedPersons.map((x) => x.id), ['xiao-chuo', 'kou-zhun'], '其时其人：反查列出萧绰与寇准（对齐审校后）');
  eq(p.data.seal, '澶', '顶栏小印取事件名首字');
  eq(p.data.headImg, remoteEventImg('chanyuan-1005') || artUrl('/assets/paintings/song.jpg'), '事件头卡：澶渊之盟优先专属图，否则清明上河图');
  ok(p.data.relatedPersons.every((x) => x.img && imgOk(x.img)), '其时其人：每人有配图且文件存在');
  ok(p.data.relatedPersons.every((x) => x.fallback && imgOk(x.fallback) && x.fallback.indexOf('https://') !== 0), '其时其人：每人有本地默认垫底图');
  eq(p.data.thumbLoaded, {}, '其时其人：初始未标记加载完成');
  const thumbP = p.data.relatedPersons[0];
  p.onThumbLoad({ currentTarget: { dataset: { id: thumbP.id } } });
  eq(p.data.thumbLoaded[thumbP.id], true, '其时其人：图片 load 后标记淡入');

  p.onLoad({ id: 'han-wudi' });
  eq(p.data.relatedPersons.map((x) => x.id), ['han-wudi', 'zhang-qian', 'wei-qing', 'sima-qian'], '汉武帝即位时霍去病尚未出生');
  eq(p.data.headImg, artUrl('/assets/eventart/han-wudi.jpg'), '事件头卡：汉武帝即位用专属事件图');
  eq(new Set(p.data.relatedPersons.map((x) => x.img)).size, 4, '其时其人：四位人物各有不同配图');

  p.onLoad({ id: 'qidan-916' });
  eq(p.data.headImg, remoteEventImg('qidan-916') || artUrl('/assets/paintings/liao.jpg'), '事件头卡：契丹建国优先专属图，否则辽画');
  
  p.onLoad({ id: 'fen-shu' });
  eq(p.data.headImg, remoteEventImg('fen-shu') || artUrl('/assets/paintings/qin.jpg'), '事件头卡：焚书坑儒优先专属图，否则秦画');

  p.onLoad({ id: 'mobei-119' });
  eq(p.data.relatedPersons.map((x) => x.id), ['wei-qing', 'huo-qubing'], '漠北之战反查列出卫青与霍去病');

  p.onLoad({ id: 'longmarch-1934' });
  ok(p.data.relatedPersons.some((x) => x.id === 'mao-zedong'), '长征事件反查含毛泽东');

  p.onLoad({ id: 'zunyi-1935' });
  ok(p.data.relatedPersons.some((x) => x.id === 'mao-zedong'), '遵义会议反查含毛泽东');

  p.onLoad({ id: 'yuanmingyuan-1860' });
  eq(p.data.relatedPersons.length, 1, '圆明园反查含奕䜣');
  tap(p, 'goTimeline');
  eq(last('switchTab').url, '/pages/timeline/timeline', '回时间轴（switchTab）');
  eq(storage.shige_tab_params && storage.shige_tab_params.timelineMode, 'modern', 'modern 交接 pending');

  p.onLoad({ id: 'han-wudi' });
  tap(p, 'goTimeline');
  eq(storage.shige_tab_params && storage.shige_tab_params.timelineMode, 'ancient', 'ancient 交接 pending');

  tap(p, 'goPerson', { id: 'lu-xun' });
  eq(last('navigateTo').url, '/pages/person/person?id=lu-xun', '其时其人 → 人物详情');

  // 分享路径
  wxLog.length = 0;
  p.onLoad({ id: 'xinhai-1911' });
  ok(p.onShareAppMessage().path === '/pages/event/event?id=xinhai-1911', '事件页分享带 id 参数');
  assertSharePanel(p, { kicker: '史事 · 民国', pathTail: '/pages/event/event?id=xinhai-1911' }, '事件页');

  // 收藏按钮状态
  eq(p.data.collected, false, '未收藏状态');
  tap(p, 'toggleCollect');
  eq(p.data.collected, true, '事件收藏生效');

  resetWifiStack();
  p.onLoad({ id: 'nope' });
  eq(last('switchTab').url, '/pages/home/home', '未知事件回退首页');
})();

// ---------------------------------------------------------------------------
// 8. search
// ---------------------------------------------------------------------------

console.log('== 搜索 ==');

(function () {
  resetWifiStack();
  const p = pages.search;

  // 热词全部能搜出结果（热词与数据种子的契约）
  p.data.hot.forEach((word) => {
    p.setData({ keyword: word });
    p.onSearch();
    const r = p.data.results;
    ok(r && ((r.persons && r.persons.length) || (r.events && r.events.length) || (r.panels && r.panels.length)),
      `热词「${word}」有结果`);
  });
  p.setData({ keyword: '' });
  p.onInput({ detail: { value: '' } });
  eq(p.data.results, null, '清空输入回到热门页');

  p.setData({ keyword: '汉武帝' });
  p.onSearch();
  ok(p.data.results.persons.some((x) => x.id === 'han-wudi'), '命中汉武帝人物');
  eq(p.data.results.persons[0].id, 'han-wudi', '姓名直接命中排正文命中之前（汉武帝第一）');
  ok(p.data.results.persons.some((x) => x.id === 'zhang-qian'), '汉武帝关联人物张骞命中（details 全文）');
  eq(p.data.results.events[0].id, 'han-wudi', '同名事件标题命中排第一');
  ok(!p.data.empty, '非空结果');
  ok(p.data.metaText.indexOf('89 人物') >= 0 && p.data.metaText.indexOf('命中') >= 0,
    '检索汇总带库规模与命中数（后端式提示）');

  p.setData({ keyword: '盛唐' });
  p.onSearch();
  eq(p.data.results.panels.length, 1, '盛唐命中专题长卷');
  ok(p.data.results.panels[0].mode === 'ancient', '盛唐面板走古代轴');

  p.setData({ keyword: '赵匡胤' });
  p.onSearch();
  ok(p.data.results.persons.some((x) => x.id === 'zhao-kuangyin'), '赵匡胤命中人物');

  p.setData({ keyword: '王安石' });
  p.onSearch();
  ok(p.data.results.persons.some((x) => x.id === 'wang-anshi'), '王安石命中人物');
  ok(p.data.results.events.some((x) => x.id === 'wanganshi-1069'), '王安石命中同名事件');

  p.setData({ keyword: '林则徐' });
  p.onSearch();
  ok(p.data.results.persons.some((x) => x.id === 'lin-zexu'), '林则徐命中人物');

  p.setData({ keyword: '李世民' });
  p.onSearch();
  ok(p.data.results.persons.some((x) => x.id === 'tang-taizong'), '李世民命中人物');
  ok(p.data.results.events.some((e) => e.id === 'zhenguan-627'), '同轮命中贞观之治（details 全文）');

  p.setData({ keyword: '杜甫' });
  p.onSearch();
  ok(p.data.results.persons.some((x) => x.id === 'du-fu'), '杜甫命中人物');

  p.setData({ keyword: '李鸿章' });
  p.onSearch();
  ok(p.data.results.persons.some((x) => x.id === 'li-hongzhang'), '李鸿章命中人物');
  ok(p.data.results.events.some((e) => e.id === 'jiawu-1894'), '同轮命中甲午战争（details 全文）');

  p.setData({ keyword: '虎门' });
  p.onSearch();
  ok(p.data.results.events.some((e) => e.id === 'opium-war-1840'), '史实词「虎门」命中鸦片战争（details 全文）');

  p.setData({ keyword: '张骞' });
  p.onSearch();
  ok(p.data.results.persons.some((x) => x.id === 'zhang-qian'), '张骞命中人物');
  ok(p.data.results.events.some((e) => e.id === 'zhangqian-138'), '张骞命中同名事件');

  p.setData({ keyword: '戊戌变法' });
  p.onSearch();
  ok(p.data.results.events.some((e) => e.id === 'wuxu-1898'), '戊戌变法命中事件');

  p.setData({ keyword: '1898' });
  p.onSearch();
  ok(p.data.results.events.some((e) => e.id === 'wuxu-1898'), '年份 1898 可搜');

  p.setData({ keyword: '卫青' });
  p.onSearch();
  ok(p.data.results.events.some((e) => e.id === 'mobei-119'), '「卫青」命中漠北之战（details 全文）');

  p.setData({ keyword: '陈独秀' });
  p.onSearch();
  ok(p.data.results.persons.some((x) => x.id === 'chen-duxiu'), '陈独秀命中人物');
  ok(p.data.results.events.some((e) => e.id === 'newculture-1915'), '同轮命中新文化运动');

  p.setData({ keyword: '德先生' });
  p.onSearch();
  ok(p.data.results.events.some((e) => e.id === 'newculture-1915'), '「德先生」命中新文化运动（desc/details）');

  p.setData({ keyword: '遵义' });
  p.onSearch();
  ok(p.data.results.events.some((e) => e.id === 'zunyi-1935'), '「遵义」命中遵义会议');

  p.setData({ keyword: '1945' });
  p.onSearch();
  ok(p.data.results.events.some((e) => e.id === 'kangzhan-1945'), '年份 1945 可搜');

  p.setData({ keyword: '邓小平' });
  p.onSearch();
  ok(p.data.results.persons.some((x) => x.id === 'deng-xiaoping'), '邓小平命中人物');
  ok(p.data.results.events.some((e) => e.id === 'reform-1978'), '同轮命中改革开放（details 全文）');

  p.setData({ keyword: '1894' });
  p.onSearch();
  ok(p.data.results.events.some((e) => e.id === 'jiawu-1894'), '年份 1894 可搜');

  p.setData({ keyword: '1978' });
  p.onSearch();
  ok(p.data.results.events.some((e) => e.id === 'reform-1978'), '年份数字可搜');

  p.setData({ keyword: 'zzz不存在' });
  p.onSearch();
  ok(p.data.empty, '无结果为空态');
  ok(p.data.metaText.indexOf('命中 0 条') >= 0, '空态汇总显示命中 0 条');

  p.onInput({ detail: { value: '苏轼' } });
  ok(!!p.searchTimer, '输入即排队检索（150ms 防抖）');
  p.flushSearch();
  ok(p.data.results.persons.some((x) => x.id === 'su-shi'), '实时检索命中苏轼');
  eq(p.data.keyword, '苏轼', '实时检索沿用输入关键词');

  p.clearKeyword();
  eq(p.data.keyword, '', '清除按钮清空关键词');
  eq(p.data.results, null, '清除后回到热门检索页');
  eq(p.data.metaText, '', '清除后检索汇总同步清空');
  p.setData({ keyword: '' });
  p.onInput({ detail: { value: '' } });

  p.setData({ keyword: '辛亥' });
  p.onHotTap({ currentTarget: { dataset: { word: '辛亥革命' } } });
  eq(p.data.keyword, '辛亥革命', '热词回填关键词');
  ok(p.data.results.events.some((e) => e.id === 'xinhai-1911'), '热词搜索命中辛亥革命');

  p.onRowTap({ currentTarget: { dataset: { type: 'panel', id: 'modern-china', mode: 'modern' } } });
  eq(last('switchTab').url, '/pages/timeline/timeline', '百年中国面板 → switchTab 近现代轴');
  eq(storage.shige_tab_params && storage.shige_tab_params.timelineMode, 'modern', '面板 pending modern');

  p.onRowTap({ currentTarget: { dataset: { type: 'person', id: 'lu-xun' } } });
  eq(last('navigateTo').url, '/pages/person/person?id=lu-xun', '人物结果 → 人物详情');

  p.onRowTap({ currentTarget: { dataset: { type: 'event', id: 'xinhai-1911' } } });
  eq(last('navigateTo').url, '/pages/event/event?id=xinhai-1911', '史事结果 → 事件详情');

  wxLog.length = 0;
  resetWifiStack();
  p.goBack();
  eq(last('switchTab').url, '/pages/home/home', '搜索页无栈返回 → 回首页');

  // 顶栏返回（有栈场景已在前文 navigateTo 后保留栈）
  resetWifiStack();

  // 全量事件标题均可搜索命中（数据与搜索契约）
  history.events.forEach((e) => {
    const probe = e.title.slice(0, 2);
    p.setData({ keyword: probe });
    p.onSearch();
    ok(p.data.results.events.some((x) => x.id === e.id), `「${probe}…」可命中 ${e.id}`);
  });
})();

// ---------------------------------------------------------------------------
// 9. 文物分包（relics：列表筛选 / 详情 / 分享兼容入口）
// ---------------------------------------------------------------------------

console.log('== 文物分包 ==');

(function () {
  resetWifiStack();
  const catalog = require(path.join(ROOT, 'relics', 'catalog.js'));

  eq(catalog.RELICS.length, 60, '文物目录 60 件');
  eq(catalog.TYPES, ['青铜', '陶瓷', '玉器', '书画'], '器类四类');
  catalog.TYPES.forEach((type) => {
    eq(catalog.RELICS.filter((r) => r.type === type).length, 15, `${type} 各 15 件`);
  });
  const ids = catalog.RELICS.map((r) => r.id);
  eq(new Set(ids).size, catalog.RELICS.length, '文物 id 不重复');
  const sources = JSON.parse(fs.readFileSync(path.join(ROOT, '..', 'docs', 'relic-sources.json'), 'utf8'));
  eq(sources.map((record) => record.id), ids, '文物来源清单与目录顺序一致');
  ok(sources.every((source, index) => source.accession === catalog.RELICS[index].accession
    && source.collectionUrl === catalog.sourceFor(source.id).url
    && source.rights === (source.id.startsWith('cma-') ? 'CC0' : 'Public Domain')), '馆藏号、来源地址与图片授权一致');
  catalog.RELICS.forEach((relic) => {
    ok(relic.eras.length > 0 && relic.eras.every((era) => catalog.ERAS.indexOf(era) >= 0),
      `${relic.id} 时代取值在筛选项内`);
    ok(relic.title && relic.period && relic.date && relic.material && relic.dimensions
      && relic.accession && relic.description.length >= 20 && relic.imageRatio > 0,
      `${relic.id} 展示字段齐全`);
  });
  catalog.ERAS.forEach((era) => {
    ok(catalog.RELICS.some((r) => r.eras.indexOf(era) >= 0), `筛选时代 ${era} 下有藏品`);
  });
  // 配图必须真实存在，且详情图高宽比与 catalog 的 imageRatio 一致（页面按它撑图框）
  catalog.RELICS.forEach((relic) => {
    ['thumb', 'detail'].forEach((size) => {
      ok(fs.existsSync(path.join(ROOT, 'relics', 'assets', `${size}-${relic.id}.jpg`)),
        `${relic.id} 有 ${size} 配图`);
    });
  });
  // 馆方页与授权按 id 前缀推导（cma- 为克利夫兰 CC0，其余为大都会公有领域）
  eq(catalog.sourceFor('cma-1952.510'), {
    museum: '克利夫兰艺术博物馆',
    url: 'https://www.clevelandart.org/art/1952.510',
    rights: 'CC0'
  }, '克利夫兰条目映射 CC0 与馆方页');
  eq(catalog.sourceFor('60514'), {
    museum: '大都会艺术博物馆',
    url: 'https://www.metmuseum.org/art/collection/search/60514',
    rights: '公有领域'
  }, '大都会条目映射公有领域与馆方页');

  // 列表页：默认 8 条分页 + 器类/时代双筛选
  const list = pages['relic-list'];
  list.onLoad();
  eq(list.data.rows.length, 8, '列表首屏 8 条');
  eq(list.data.count, catalog.RELICS.length, '列表默认显示全部藏品');
  eq(list.data.hasMore, true, '列表有待加载');
  list.loadMore();
  eq(list.data.rows.length, 16, '加载更多追加一屏');
  eq(list.data.rows[0].thumb, '/relics/assets/thumb-44757.jpg', '行卡缩略图路径');
  eq(Object.keys(list.data.rows[0]).sort(),
    ['id', 'period', 'thumb', 'title', 'type'], '行卡只传展示字段');

  tap(list, 'openFilter', { kind: 'type' });
  eq(list.data.filterSheet.title, '选择器类', '器类弹层标题');
  eq(list.data.filterSheet.options.length, 5, '器类弹层含「全部」');
  tap(list, 'onFilterPick', { index: 1 });
  eq(list.data.filterSheet, null, '选中后关闭弹层');
  eq(list.data.count, 15, '筛青铜 15 件');
  eq(list.data.typeIndex, 1, '器类选择保留');
  tap(list, 'openFilter', { kind: 'era' });
  tap(list, 'onFilterPick', { index: catalog.ERAS.indexOf('东周') + 1 });
  eq(list.data.count, 4, '青铜 × 东周的组合筛选');
  tap(list, 'onFilterPick', { index: 99 });
  eq(list.data.count, 4, '越界索引不生效');
  tap(list, 'resetFilters', {});
  eq(list.data.count, catalog.RELICS.length, '清除筛选恢复全部');
  eq([list.data.typeIndex, list.data.eraIndex], [0, 0], '清除筛选同时复位两个选择');
  // 无结果态（时代与器类无交集时）：青铜 × 清
  tap(list, 'openFilter', { kind: 'type' });
  tap(list, 'onFilterPick', { index: 1 });
  tap(list, 'openFilter', { kind: 'era' });
  tap(list, 'onFilterPick', { index: catalog.ERAS.indexOf('清') + 1 });
  eq(list.data.count, 0, '组合无交集时归零');
  eq(list.data.rows.length, 0, '无结果不渲染卡片');
  tap(list, 'resetFilters', {});
  for (const [era, id] of [['北魏', 'cma-1962.216'], ['隋', '62991']]) {
    tap(list, 'openFilter', { kind: 'era' });
    tap(list, 'onFilterPick', { index: catalog.ERAS.indexOf(era) + 1 });
    eq(list.data.rows.map((row) => row.id), [id], `${era}可单独筛选`);
  }
  tap(list, 'resetFilters', {});

  resetWifiStack();
  tap(list, 'openRelic', { id: 'cma-1952.510' });
  eq(last('navigateTo').url, '/relics/pages/relic-detail/relic-detail?id=cma-1952.510', '列表进详情带 id');
  list.goBack();
  eq(last('switchTab').url, '/pages/home/home', '列表无栈返回回首页');

  // 详情页：字段、授权、分享面板
  const detail = pages['relic-detail'];
  detail.onLoad({ id: 'cma-1952.510' });
  eq(detail.data.relic.title, '双仙人耳玉杯', '详情标题');
  eq(detail.data.relic.museum, '克利夫兰艺术博物馆', '详情馆方');
  eq(detail.data.relic.rights, 'CC0', '详情授权文案');
  eq(detail.data.relic.image, '/relics/assets/detail-cma-1952.510.jpg', '详情配图路径');
  eq(detail.data.relic.imageRatio, 55.714, '详情图框比例');
  tap(detail, 'toggleSource', {});
  eq(detail.data.sourceOpen, true, '展开馆方藏品页地址');
  assertSharePanel(detail, {
    kicker: '文物 · 清',
    pathTail: 'relic-detail?id=cma-1952.510'
  }, '文物详情');
  ok(detail.sharePayload().coverFit === 'contain', '文物题图等比完整排入');
  detail.onImageError();
  eq(detail.data.imageFailed, true, '配图失败显示占位');

  // 未知 id 兜底：目录查不到即不渲染（onLoad 直接 return），页面走 wxml 的空态分支
  ok(!catalog.RELICS.some((r) => r.id === 'not-exist'), '未知 id 不在目录内');
  resetWifiStack();
  tap(detail, 'goBack', {});
  eq(last('redirectTo').url, catalog.LIST_PATH, '详情无栈返回回列表');

  // 分享直达：?share=1 直接在详情打开共此卷面板
  const direct = pages['relic-detail'];
  direct.data.share.open = false;
  direct.onLoad({ id: '60514', share: '1' });
  ok(direct.data.share.open, 'share=1 直达打开分享面板');

  // 旧分享页兼容入口：转详情并带 share=1
  resetWifiStack();
  const share = pages['relic-share'];
  share.onLoad({ id: '39919' });
  share.onReady();
  eq(last('redirectTo').url, '/relics/pages/relic-detail/relic-detail?id=39919&share=1', '旧分享页转详情弹层');
  share.onLoad({ id: 'not-exist' });
  share.onReady();
  eq(last('redirectTo').url, catalog.LIST_PATH, '旧分享页未知 id 回列表');

  // 首页入口
  resetWifiStack();
  tap(pages.home, 'goRelics', {});
  eq(last('navigateTo').url, '/relics/pages/relic-list/relic-list', '首页进入文物列表');
  const homeWxml = fs.readFileSync(path.join(ROOT, 'pages', 'home', 'home.wxml'), 'utf8');
  ok(homeWxml.indexOf('青铜 · 陶瓷 · 玉器 · 书画') >= 0, '首页文物入口列出四类');
})();

(function () {
  const root = path.join(ROOT, 'data', 'relics', 'v1');
  const files = [];
  const originalRequest = wx.request;
  const copyPage = name => instantiate({ ...pages[name], data: structuredClone(pages[name].data) }, name);
  const request = (file) => {
    const next = files.shift();
    eq(next?.file, file, `按需请求文物 ${file}`);
    return next?.options;
  };
  const respond = file => request(file)?.success({ statusCode: 200, data: JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')) });
  wx.request = (options) => files.push({ file: options.url.split('/data/relics/v1/')[1], options });
  try {
    const list = copyPage('relic-list');
    list.onLoad();
    eq(list.data.rows.length, 8, '远端清单未返回时仍显示本地首屏');
    eq(list.data.count, 60, '初始计数只含离线藏品');
    request('manifest.json')?.fail(new Error('offline'));
    eq(list.data.remoteState, 'retry', '离线时在线馆藏可手动重试');
    eq(list.data.rows.length, 8, '离线不清空本地列表');
    list.retryRemote();
    respond('manifest.json');
    eq(list.data.count, 72, '清单成功后显示离线与在线合计');
    eq(files.length, 0, '清单到达不预取在线详情或列表分卷');
    while (list.data.hasLocalMore) list.loadMore();
    eq(files.length, 0, '本地分页不发在线请求');

    list.loadMore();
    list.loadMore();
    eq(files.length, 1, '重复点击只请求一次在线分页');
    list.updateFilters(4, list.data.eras.indexOf('清'));
    const count = list.data.count;
    respond('list/0-0/0.json');
    eq(list.data.count, count, '上一组选项的响应不覆盖新筛选');
    ok(list.data.rows.every(row => row.type === '书画'), '筛选切换后列表无旧数据');

    list.resetFilters();
    while (list.data.hasLocalMore) list.loadMore();
    list.loadMore();
    eq(list.data.rows.length, 68, '在线第一页复用缓存并追加 8 件');
    list.loadMore();
    request('list/0-0/1.json')?.fail(new Error('offline'));
    eq(list.data.rows.length, 68, '在线分页失败保留已加载项');
    list.retryRemote();
    respond('list/0-0/1.json');
    eq(new Set(list.data.rows.map(row => row.id)).size, 72, '重试追加 4 件且无重复');
    eq(list.data.hasMore, false, '在线最后一页后无更多按钮');

    const detail = copyPage('relic-detail');
    detail.setData({ relic: null, share: { open: false } });
    detail.onLoad({ id: '53937' });
    request('detail/53937.json')?.fail(new Error('offline'));
    eq(detail.data.loadState, 'retry', '在线详情可在失败时重试');
    detail.loadRelic();
    respond('detail/53937.json');
    eq(detail.data.relic.accession, '17.118.42', '在线详情读取对应馆藏号');
    eq(detail.onShareAppMessage().path, '/relics/pages/relic-detail/relic-detail?id=53937', '在线文物好友分享保持稳定 ID');
    ok(detail.sharePayload().img.startsWith('https://testingcf.jsdelivr.net'), '在线分享使用远端配图');
    detail.onImageError();
    ok(detail.data.relic.image.startsWith('https://gcore.jsdelivr.net'), '在线图片失败后切换备用域名');
    detail.onImageError();
    eq(detail.data.imageFailed, true, '备用域名失败后停止重试，显示占位');
  } finally {
    wx.request = originalRequest;
  }
})();

// ---------------------------------------------------------------------------
// 10. 路由边界：所有跳转目标页面存在
// ---------------------------------------------------------------------------

console.log('== 路由完整 ==');

(function () {
  const targets = wxLog
    .filter((r) => ['navigateTo', 'redirectTo'].indexOf(r.kind) >= 0)
    .map((r) => urlTarget(r.url));
  targets.forEach((t) => ok(pages[t], `跳转目标页存在 ${t}`));
  ok(Object.keys(pages).length === 16, '十六个页面全部注册（13 主包页 + 3 文物分包页）');
})();

// ---------------------------------------------------------------------------
// 数据中枢 + 在线数据源（放最后：远端热替换不污染前面的页面断言）
// ---------------------------------------------------------------------------

console.log('== 数据中枢 ==');

(function () {
  resetWifiStack();
  const hd = require(path.join(ROOT, 'utils', 'historyData.js'));
  const remote = require(path.join(ROOT, 'utils', 'remote.js'));
  const api = require(path.join(ROOT, 'utils', 'api.js'));

  // 打包种子为初始数据
  eq(hd.get(), history, '未刷新前返回本地种子');

  // 远端合法 JSON：热替换 + 订阅通知
  const remoteSeed = JSON.parse(JSON.stringify(history));
  remoteSeed.events.push({
    id: 'demo-remote',
    mode: 'ancient',
    year: -100,
    yearText: '公元前100年',
    era: '西汉',
    title: '演示事件',
    desc: '演示用',
    tags: '演示',
    source: 'selftest',
    details: ['演示段落']
  });
  mockRequest.payload = remoteSeed;

  let notified = 0;
  hd.subscribe(() => {
    notified += 1;
  });
  eq(notified, 0, '种子态注册订阅不触发');

  let changed = null;
  hd.refresh((c) => {
    changed = c;
  });
  eq(changed, true, '远端数据应用成功');
  eq(hd.get().events.length, history.events.length + 1, '热替换后史事 +1');
  eq(notified, 1, '订阅回调收到通知');

  // 缓存命中：不再发请求；相同数据不重复应用
  const before = wxLog.filter((x) => x.kind === 'request').length;
  mockRequest.payload = null;
  let second = null;
  hd.refresh((c) => {
    second = c;
  });
  eq(second, false, '相同数据不重复应用');
  eq(wxLog.filter((x) => x.kind === 'request').length, before, '缓存命中不再发请求');

  // 非法 payload：不应用
  mockRequest.payload = { events: [] };
  let bad = null;
  hd.refresh((c) => {
    bad = c;
  });
  eq(bad, false, '坏数据不应用');
  eq(hd.get().events.length, history.events.length + 1, 'current 保持远端合法数据');

  // 强制刷新：先 purge jsDelivr 缓存，再绕过本地缓存重新拉取并应用
  mockRequest.payload = remoteSeed;
  delete storage['shige_history_remote'];
  const purgeBefore = wxLog.filter((x) => x.kind === 'request' && /purge\.jsdelivr\.net/.test(x.url)).length;
  let freshChanged = null;
  let freshErr = null;
  hd.refresh((c, e) => {
    freshChanged = c;
    freshErr = e;
  }, { fresh: true });
  const purgeAfter = wxLog.filter((x) => x.kind === 'request' && /purge\.jsdelivr\.net/.test(x.url)).length;
  ok(purgeAfter > purgeBefore, '强制刷新先发 purge 请求');
  eq(freshChanged, false, '远端与当前一致不重复应用');
  eq(freshErr, null, '强制刷新无错误');
  mockRequest.payload = null;

  // remote 模块独立回调
  mockRequest.payload = remoteSeed;
  let fetched = null;
  remote.fetchRemoteHistory((err, data) => {
    fetched = err ? null : data;
  });
  eq(fetched, remoteSeed, 'remote.fetchRemoteHistory 返回缓存数据');
  ok(remote.REMOTE_URL.indexOf('https://cdn.jsdelivr.net') === 0, '远端域名 jsDelivr(https)');

  // api.js：60s 历史上的今天 归一化
  const fix = {
    code: 200,
    data: {
      items: [
        { title: '事件甲', year: '1949', description: 'd1', event_type: 'event', link: 'l1' },
        { title: '人物乙[注 1]', year: '1921', description: '', event_type: 'birth' },
        { title: '无效项', year: '', description: 'x', event_type: 'event' }
      ]
    }
  };
  const items = api.normalizeToday(fix);
  eq(items.map((i) => i.year), [1921, 1949], 'normalize 年份升序并剔除缺年项');
  eq(items[0].type, '出生', 'event_type 映射出生');
  ok(items[1].title.indexOf('[注') < 0, '条目标记文本已清理');
  eq(api.normalizeToday(null).length, 0, '空载荷归零');
  eq(api.dateKey(new Date(2026, 9, 20)), '10-20', 'dateKey 月-日无补零');

  // pickDaily：日期种子确定性抽取（每日随机精选的底层）
  const daily = [
    { title: '事件甲', year: 1949, desc: 'd1' },
    { title: '事件乙', year: 1921, desc: '' },
    { title: '事件丙', year: 1966, desc: 'd2' },
    { title: '事件丁', year: 1978, desc: 'd3' }
  ];
  eq(api.pickDaily(daily, '10-25').title, api.pickDaily(daily, '10-25').title, 'pickDaily 同种子结果一致');
  ok(['事件甲', '事件丙', '事件丁'].indexOf(api.pickDaily(daily, '10-25').title) >= 0, 'pickDaily 只在有描述池内取');
  eq(api.pickDaily([], 'x'), null, 'pickDaily 空数据返回 null');
  eq(api.pickDaily([{ title: '事件甲', year: 1, desc: '' }], 'x').title, '事件甲', 'pickDaily 无描述回退全量');
  eq(api.pickDaily(null, 'x'), null, 'pickDaily 空入参返回 null');
  const seedDist = new Set(
    Array.from({ length: 24 }, (_, i) => api.pickDaily(daily, `${(i % 12) + 1}-${(i % 28) + 1}`).title)
  );
  ok(seedDist.size >= 2, `不同日期种子出现不同精选（实测 ${seedDist.size} 种）`);

  // api.js：请求 + 天级缓存（60s URL 用 mockRequest.today）
  mockRequest.today = fix;
  let tih = null;
  api.fetchTodayInHistory((e, list) => {
    tih = list;
  });
  ok(tih && tih.length === 2, 'fetchTodayInHistory 回调归一化数据');
  const tihKey = 'shige_tih_' + api.dateKey(new Date());
  ok(storage[tihKey] && storage[tihKey].items.length === 2, '60s 结果写入天级缓存');

  // 清场：本地存储与 mock 载荷，块与块之间互不影响
  mockRequest.payload = null;
  mockRequest.today = null;
  delete storage['shige_history_remote'];
  delete storage[tihKey];
})();

// ---------------------------------------------------------------------------
// 首页 60s「历史上的今天」板块（放最后：涉及当天缓存，避免污染前面断言）
// ---------------------------------------------------------------------------

console.log('== 今日接口 ==');

(function () {
  resetWifiStack();
  const api = require(path.join(ROOT, 'utils', 'api.js'));
  const p = pages.home;

  p.setData({ tih: [], tihTotal: 0, tihDate: '' });
  mockRequest.today = {
    code: 200,
    data: {
      items: [
        { title: '事件甲', year: '1949', description: '开国大典', event_type: 'event', link: 'l1' },
        { title: '人物乙', year: '1881', description: '', event_type: 'birth' },
        { title: '无效项', year: '', description: 'x', event_type: 'event' },
        { title: '事件乙', year: '1921', description: '一大召开', event_type: 'event' },
        { title: '事件丙', year: '1966', description: '展示上限校验项', event_type: 'event' }
      ]
    }
  };

  p.onShow();
  eq(p.data.tih.length, 1, '今日接口归一化后展示1条精选');
  ok(!!p.data.tih[0].desc, '每日精选优先取有描述的条目');
  eq(p.data.tihTotal, 4, '板块总数为全量（展示只取1条精选）');
  eq(p.data.tih.length, 1, '板块只展示1条精选');
  eq(p.data.tihDate, `${new Date().getMonth() + 1}月${new Date().getDate()}日`, '板块显示当日日期');

  // 每日随机精选：同一天两次载入结果一致（确定性），点击弹层展示当前精选（点击不重随机）
  const featuredYear = p.data.tih[0].yearText;
  p.setData({ tih: [], tihTotal: 0, tihDate: '' });
  p.onShow();
  eq(p.data.tih[0].yearText, featuredYear, '同一天两次载入精选一致（按日期确定性）');

  p.onTihTap({ currentTarget: { dataset: { index: 0 } } });
  ok(
    p.data.info.open && p.data.info.title.indexOf(featuredYear) >= 0,
    '点击弹层展示当前每日精选（点击不重随机）'
  );
  tap(p, 'closeInfo');
  eq(p.data.info.open, false, '信息弹层可关闭');
  ok(
    fs.readFileSync(path.join(ROOT, 'pages', 'home', 'home.wxml'), 'utf8').indexOf('每日随机精选') >= 0,
    '卡片脚注提示每日随机精选'
  );

  // 断网：板块清空隐藏，页面其余内容不受影响；失败进入冷却期不再连续发请求
  mockRequest.today = null;
  const dayKey = api.dateKey(new Date());
  delete storage['shige_tih_' + dayKey];
  const reqBefore = wxLog.filter((x) => x.kind === 'request' && /today_in_history/.test(x.url)).length;
  p.onShow();
  eq(p.data.tih.length, 0, '无网时板块清空');
  ok(p.data.hero && p.data.hero.title, '无网时其余内容保持');
  eq(wxLog.filter((x) => x.kind === 'request' && /today_in_history/.test(x.url)).length, reqBefore + 1, '断网首发失败请求');

  // 失败冷却：storage 写入 fail 标记后，冷却期内不再发请求、不再回调数据
  ok(storage['shige_tih_' + dayKey] && storage['shige_tih_' + dayKey].fail === true, '失败写入冷却标记');
  let cdErr = null;
  api.fetchTodayInHistory((err) => {
    cdErr = err;
  });
  ok(cdErr && /cooldown/.test(cdErr.message), '冷却期内回调 cooldown');
  eq(wxLog.filter((x) => x.kind === 'request' && /today_in_history/.test(x.url)).length, reqBefore + 1, '冷却期内不再发请求');

  // 冷却过期：重新请求（_at 回拨超过 FAIL_TTL）
  storage['shige_tih_' + dayKey].at -= 31 * 60 * 1000;
  let retryErr = null;
  api.fetchTodayInHistory((err) => {
    retryErr = err;
  });
  ok(retryErr && /request fail/.test(retryErr.message), '冷却过期后恢复请求（仍失败再入冷却）');
  eq(wxLog.filter((x) => x.kind === 'request' && /today_in_history/.test(x.url)).length, reqBefore + 2, '冷却过期后重新发请求');

  mockRequest.today = null;
  delete storage['shige_tih_' + dayKey];
})();

// ---------------------------------------------------------------------------
// 阅读字号
// ---------------------------------------------------------------------------

console.log('== 阅读字号 ==');

(function () {
  const font = require(path.join(ROOT, 'utils', 'font.js'));
  eq(store.getFontKey(), 'm', '默认字号标准');
  eq(font.OPTIONS.map((o) => o.key), ['s', 'm', 'l', 'xl'], '字号四档');
  eq(font.fontKey(), 'm', '字号工具读取设置');

  // 非法值回落
  eq(store.setFontKey('huge'), 'm', '非法字号回落标准');
  eq(store.getFontKey(), 'm', '非法字号不落库');

  // 详情页与主页面根节点都挂 fs-*
  const names = [
    'home', 'timeline', 'discover', 'profile', 'person', 'event', 'period', 'search',
    'footprints', 'favorites', 'archive', 'archive-list', 'archive-detail'
  ];
  names.forEach((name) => {
    const wxml = fs.readFileSync(path.join(ROOT, 'pages', name, name + '.wxml'), 'utf8');
    ok(wxml.indexOf('class="page fs-{{fontClass}}"') >= 0, `${name} 根节点挂字号类`);
  });

  store.setFontKey('xl');
  names.forEach((name) => {
    const page = pages[name];
    page.onShow();
    eq(page.data.fontClass, 'xl', `${name} 切到特大字号`);
  });

  // 「我的」页分段控件：点选 → 落库 + Toast
  const p = pages.profile;
  p.onShow();
  eq(p.data.fontKey, 'xl', '我的页同步当前字号');
  tap(p, 'onFontPick', { key: 'l' });
  eq(p.data.fontKey, 'l', '我的页点选大号');
  eq(p.data.fontClass, 'l', '我的页根节点跟随字号');
  eq(storage.shige_font_key, 'l', '字号写入本地存储');
  eq(last('showToast').title, '字号：大', '字号切换 Toast 反馈');
  p.onShow();
  eq(p.data.fontKey, 'l', '重进我的页保持字号');
  pages.person.onShow();
  eq(pages.person.data.fontClass, 'l', '已开人物页随 onShow 更新');

  eq(store.setFontKey('m'), 'm', '字号复位标准');
  p.onShow();
  eq(p.data.fontClass, 'm', '复位后根节点标准');
})();

// ---------------------------------------------------------------------------
// 我的 · 随机身份（头像变体 + 历史风格昵称）
// ---------------------------------------------------------------------------

(function () {
  const identity = require(path.join(ROOT, 'utils', 'identity.js'));
  let avatarFiles = 0;
  for (let i = 1; i <= identity.AVATAR_COUNT; i += 1) {
    if (fs.existsSync(path.join(ROOT, identity.avatarPath(i)))) avatarFiles += 1;
  }
  eq(avatarFiles, identity.AVATAR_COUNT, `随机头像变体 ${identity.AVATAR_COUNT} 张齐备`);

  delete storage[identity.KEY];
  const a = identity.get();
  ok(a.avatar.indexOf('/assets/avatars/avatar-') === 0, '身份头像走本地变体池');
  ok(identity.NICK_B.some((b) => a.nick.slice(-b.length) === b), '昵称带历史字号尾');
  ok(identity.MOTTOS.indexOf(a.motto) >= 0, '座右铭出自词库');
  eq(identity.get().nick, a.nick, '身份读取稳定（不闪变）');
  eq(storage[identity.KEY].nick, a.nick, '身份写入本地存储');

  let differs = false;
  for (let i = 0; i < 10 && !differs; i += 1) {
    const b = identity.reroll();
    differs = b.nick !== a.nick || b.avatar !== a.avatar;
  }
  ok(differs, '「换一位史客」产生新身份');
  eq(storage[identity.KEY].nick, identity.get().nick, '换身份后读取一致');

  const legacy = { avatar: '/assets/avatars/avatar-20.jpg', nick: '种菊翁', motto: identity.MOTTOS[0] };
  storage[identity.KEY] = legacy;
  const p = pages.profile;
  p.onLoad();
  eq(p.data.identity, legacy, '扩充词库后旧身份仍可正常装配');
  const random = Math.random;
  const rolls = [0.999, 0.999, 0.999, 0];
  try {
    Math.random = () => rolls.shift();
    p.onRerollIdentity();
  } finally {
    Math.random = random;
  }
  eq(p.data.identity.avatar, '/assets/avatars/avatar-26.jpg', '换一位史客可抽到新增头像');
  eq(p.data.identity.nick, '藏卷隐者', '换一位史客可抽到新增字号');
  eq(identity.get().nick, '藏卷隐者', '换得的新增身份会保存');
})();

// ---------------------------------------------------------------------------
// 太阳码（utils/wxacode.js 编解码 + qrshare 海报码图分支）
// ---------------------------------------------------------------------------

console.log('== 太阳码 wxacode ==');
(function () {
  const wxacode = require(path.join(ROOT, 'utils', 'wxacode.js'));

  // scene 编解码 round-trip：主库三页 + 资料库
  eq(wxacode.sceneOf({ page: 'person', id: 'han-wudi' }), 'p=han-wudi', 'person scene 编码');
  eq(wxacode.sceneOf({ page: 'event', id: 'zhenghe-1405' }), 'e=zhenghe-1405', 'event scene 编码');
  eq(wxacode.sceneOf({ page: 'period', id: 'han' }), 'd=han', 'period scene 编码');
  const figScene = wxacode.sceneOf({ page: 'archive', kind: 'figures', id: 'hf-shang4gu3_shun4di4' });
  eq(figScene, 'g=f&i=hf-shang4gu3_shun4di4', 'archive 短 id scene 编码');
  eq(wxacode.decodeScene(figScene), { page: 'archive', kind: 'figures', type: '', id: 'hf-shang4gu3_shun4di4' }, 'archive scene 解码');
  const cardsScene = wxacode.sceneOf({ page: 'archive', kind: 'cards', type: '5', id: 'hc-5-00001' });
  eq(cardsScene, 'g=c&t=5&i=hc-5-00001', 'cards scene 编码带分类');
  eq(wxacode.decodeScene(cardsScene).type, '5', 'cards scene 解码还原分类');
  eq(wxacode.decodeScene('g=ps&i=hpw-100087').kind, 'poems-shi', 'poems 短码解码');
  eq(wxacode.sceneOf({ page: 'archive', kind: 'nope', id: 'x' }), null, '未知栏目拒绝编码');
  eq(wxacode.sceneOf({ page: 'person', id: '含中文' }), null, '非法字符集拒绝编码');

  // 超限 id（figures/emperors 长拼音 id）：hash scene + 解码
  const longId = 'hf-qing1chao2_gu4lun2wen1zhuang1zhang3gong1zhu3';
  const hashScene = wxacode.sceneOf({ page: 'archive', kind: 'figures', id: longId }, () => 'abc123def456');
  ok(hashScene === 'g=f&h=abc123def456', '超限 id 走 hash scene');
  ok(hashScene.length <= 32 && wxacode.validScene(hashScene), 'hash scene 合法且 ≤32');
  const decodedHash = wxacode.decodeScene(hashScene);
  ok(decodedHash.hash === 'abc123def456' && !decodedHash.id, 'hash scene 解码带 hash 不带 id');
  eq(wxacode.sceneOf({ page: 'archive', kind: 'figures', id: longId }), null, '超限 id 无 hashFn 拒绝编码');

  // mergeScene：扫码进入补参数；普通跳转原样透传
  eq(wxacode.mergeScene({ scene: 'p=han-wudi' }), { scene: 'p=han-wudi', id: 'han-wudi' }, 'mergeScene person 补 id');
  eq(wxacode.mergeScene({ id: 'kongzi' }), { id: 'kongzi' }, 'mergeScene 无 scene 原样透传');
  const mergedHash = wxacode.mergeScene({ scene: hashScene });
  ok(mergedHash.id === '' && mergedHash.wxacodeHash === 'abc123def456' && mergedHash.kind === 'figures', 'mergeScene hash 置空 id 带 wxacodeHash');
  eq(wxacode.mergeScene({ scene: 'bad scene!' }), { scene: 'bad scene!' }, '非法 scene 不注入任何参数');

  // 海报码图 URL：主库三页 + 资料库分组 + 备用域名
  eq(wxacode.codeUrlOf('/pages/person/person?id=han-wudi'),
    'https://gcore.jsdelivr.net/gh/webzol/history@main/miniprogram/data/img/wxacode/person/han-wudi.jpg',
    'person 海报码图 URL');
  ok(wxacode.codeUrlOf('/pages/archive-detail/archive-detail?kind=cards&type=5&id=hc-5-00001')
    .indexOf('/wxacode/cards-5/hc-5-00001.jpg') > 0, 'cards 码图分组带分类');
  ok(wxacode.codeUrlOf('/pages/archive-detail/archive-detail?kind=poems-shi&id=hpw-100087')
    .indexOf('/wxacode/poems-shi/hpw-100087.jpg') > 0, 'poems 码图分组');
  eq(wxacode.codeUrlOf('/pages/home/home'), '', '无目标路径返回空（走本地二维码兜底）');
  const mainUrl = wxacode.codeUrlOf('/pages/person/person?id=han-wudi');
  eq(wxacode.altCodeUrl(mainUrl), mainUrl.replace('gcore.jsdelivr.net', 'testingcf.jsdelivr.net'), '备用域名切换');
  eq(wxacode.altCodeUrl('https://other.example/a.jpg'), '', '非主域名不给备用');

  // resolveIndex：hash → 全量 id（wx.request 桩 + 内存缓存）
  const LONG = 'hf-qing1chao2_gu4lun2wen1zhuang1zhang3gong1zhu3';
  mockRequest.wxacodeIdx = { abc123def456: LONG };
  const beforeReq = wxLog.filter((x) => x.kind === 'request').length;
  let resolved = '';
  wxacode.resolveIndex('figures', 'abc123def456', (err, id) => { resolved = err ? '' : id; });
  ok(resolved === LONG, 'resolveIndex 还原超限 id');
  ok(wxLog.filter((x) => x.kind === 'request').length === beforeReq + 1, 'resolveIndex 发出请求');
  let cached = '';
  wxacode.resolveIndex('figures', 'abc123def456', (err, id) => { cached = err ? '' : id; });
  ok(cached === LONG, 'resolveIndex 命中缓存');
  ok(wxLog.filter((x) => x.kind === 'request').length === beforeReq + 1, '缓存命中不再发请求');
  let missing = false;
  wxacode.resolveIndex('figures', 'zzzzzzzzzzzz', (err) => { missing = !!err; });
  ok(missing, 'idx 未命中报错');
  mockRequest.wxacodeIdx = null;

  // 页面接入：person onLoad scene 解析（普通参数与扫码参数一致）
  resetWifiStack();
  const p = pages.person;
  p.onLoad({ id: 'su-shi' });
  eq(p.data.person.name, '苏轼', '普通跳转 onLoad 不受影响');
  p.onLoad({ scene: 'p=su-shi' });
  eq(p.data.person.name, '苏轼', '太阳码扫码进入等价 ?id=');

  // 固定小程序码直接绘入海报，仍沿用详情页自己的好友分享路径。
  const person = pages.person;
  person.onLoad({ id: 'han-wudi' });
  person.openShare();
  qrshare.attachCanvas(person);
  eq(person.onShareAppMessage().path, '/pages/person/person?id=han-wudi', '添加固定码后好友分享仍直达人物详情');
  ok(mockPoster.images >= 4, '海报绘入固定小程序码');
  person.closeShare();
})();

// ---------------------------------------------------------------------------
// 朋友圈分享
// ---------------------------------------------------------------------------

console.log('== 朋友圈分享 ==');

(function () {
  const archiveOptions = { kind: 'cards', type: '12', title: '诸子百家名句赏析' };
  const cases = {
    timeline: [{ mode: 'modern' }, (page) => page.data.mode],
    event: [{ id: 'xinhai-1911' }, (page) => page.data.event?.id],
    person: [{ id: 'su-shi' }, (page) => page.data.person?.id],
    period: [{ id: 'han' }, (page) => page.data.period?.id],
    'archive-list': [archiveOptions, (page) => page.data.pageTitle],
    'archive-detail': [{ ...archiveOptions, shard: '00', id: 'hc-12-00001' }, (page) => page.data.item?.title]
  };
  const app = require(path.join(ROOT, 'app.json'));
  app.pages.forEach((route) => {
    const name = urlTarget('/' + route);
    const [options = {}, selected] = cases[name] || [];
    const makePage = () => instantiate({ ...pages[name], data: structuredClone(pages[name].data) }, name);
    const source = makePage();
    const logStart = wxLog.length;
    source.onLoad(options);
    ok(wxLog.slice(logStart).some((entry) => entry.kind === 'showShareMenu' &&
      entry.menus.includes('shareAppMessage') && entry.menus.includes('shareTimeline')), `${name} 开启原生朋友圈菜单`);
    const card = source.onShareTimeline();
    eq(card.title, source.onShareAppMessage().title, `${name} 朋友圈标题`);
    ok(imgOk(card.imageUrl), `${name} 使用可访问的分享题图`);
    ok(!Object.hasOwn(card, 'path'), `${name} 由微信打开当前页`);
    if (!selected) {
      eq(card.query, undefined, `${name} 分享页面入口`);
      return;
    }
    const query = Object.fromEntries(new URLSearchParams(card.query));
    Object.entries(options).forEach(([key, value]) => eq(query[key], value, `${name} 分享参数 ${key}`));
    const receiver = makePage();
    receiver.onLoad(query);
    ok(selected(source), `${name} 分享前读到指定内容`);
    eq(selected(receiver), selected(source), `${name} 从朋友圈参数打开同一内容`);
  });
})();

{
  const ctx = makeMockCanvasNode().getContext('2d');
  const rows = [];
  ctx.measureText = function (label) {
    const size = Number(/([\d.]+)px/.exec(this.font)?.[1]);
    return { width: Array.from(label).length * size };
  };
  ctx.fillText = function (label, x, y) {
    rows.push({ label, x, y, width: this.measureText(label).width });
  };
  qrshare.paintPoster(ctx, {
    kicker: '阅史记 · 资料库',
    title: '这是一条用来验证题名折行和省略效果的长资料标题',
    desc: '这是一段用于验证分享卡摘要换行的内容。'.repeat(4),
    quote: '这是一段用于验证分享卡印刷版心的名句。'.repeat(4),
    quoteSource: '《一份用来验证落款窄列和出处对齐的长篇史料》',
    dateText: '2026年11月27日', lunarText: '农历丙午年 十月十九'
  }, () => null);
  const title = rows.filter((row) => row.y >= 172 && row.y < 200);
  eq(title.length, 2, '海报长标题最多两行');
  ok(title[1].label.endsWith('…'), '海报长标题溢出在第二行留省略号');
  ok(rows.filter((row) => row.x === 130).every((row) => row.width <= 191), '居中文字不越出版心');
  eq(rows.filter((row) => row.y >= 342).map((row) => row.x), [50, 50, 50], '公历、农历和品牌在左侧同列');
  rows.length = 0;
  const quote = '料敌合变，出奇无穷，声震天下。';
  qrshare.paintPoster(ctx, { title: '夏', quote }, () => null);
  eq(rows.filter((row) => row.y >= 283 && row.y <= 297).map((row) => row.label), [quote], '参考图题句完整排在一行');
  const code = { width: 288, height: 288 };
  const seal = { width: 114, height: 197 };
  const images = [];
  ctx.drawImage = (...args) => images.push(args);
  rows.length = 0;
  const assets = { '/assets/share-wxacode.png': code, '/assets/seal.png': seal };
  qrshare.paintPoster(ctx, { title: '夏' }, (src) => assets[src]);
  eq(images[0], [seal, 229 - 27 * 114 / 197, 298, 27 * 114 / 197, 27], '史载印放在名句右侧');
  eq(images[1], [code, 181, 329, 52, 52], '小程序码完整绘入，不裁切或拉伸');
  ok(rows.every((row) => !row.label.includes('扫一扫')), '海报码图下方不显示提示语');
}

// ---------------------------------------------------------------------------
// 汇总
// ---------------------------------------------------------------------------

console.log('');
console.log(`PASS ${passCount}  FAIL ${failures.length}`);
if (failures.length) {
  console.error('\n失败项：');
  failures.forEach((f) => console.error(' - ' + f));
  process.exit(1);
}
console.log('全部通过 ✔');
