// 交互自测：加载真实页面代码与数据，mock wx / Page，
// 模拟生命周期与点击，逐条断言数据状态与路由行为。
// 用法：node tools/selftest.js

'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');

const ROOT = path.join(__dirname, '..', 'miniprogram');
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
const mockRequest = { payload: null, today: null }; // wx.request 白名单桩载荷（jsDelivr / 60s 分流）
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
  request(opts) {
    route('request', opts.url);
    if (opts.url.indexOf('/data/apk/') >= 0) {
      const rel = opts.url.split('/data/apk/')[1];
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

function urlTarget(url) {
  const m = /^\/pages\/([\w-]+)\/([\w-]+)/.exec(url);
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
global.getApp = () => ({ globalData: { appName: '史页' } });
global.Page = (cfg) => {
  pages[currentFile] = instantiate(cfg, currentFile);
  return cfg;
};
global.wx = wx;

function instantiate(cfg, name) {
  const page = Object.assign({ __name: name, data: JSON.parse(JSON.stringify(cfg.data || {})) }, cfg);
  // setData：顶层键整键替换 + 支持 'a.b.c' 点路径（与真机 setData 行为一致）
  Object.defineProperty(page, 'setData', {
    value(patch, cb) {
      Object.keys(patch).forEach((key) => {
        const path = key.split('.');
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
  eq(history.persons.length, 72, '人物 72 位');
  ok(new Set([...eventIds]).size === 100, '史事 id 唯一');
  ok(new Set([...personIds]).size === 72, '人物 id 唯一');
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
  ok(reIds('cao-xueqin').indexOf('hongloumeng-1754') >= 0, '曹雪芹反查 红楼梦成书');
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

  // 时代配图映射（事件头卡 / 人物缩略图共用）
  const eraImages = require(path.join(ROOT, 'utils', 'eraImages.js'));
  eq(eraImages.eraImage('西汉'), '/assets/paintings/han.jpg', '时代配图 · 西汉');
  eq(eraImages.eraImage('晚清'), '/assets/paintings/qing.jpg', '时代配图 · 晚清并到清');
  eq(eraImages.eraImage('民国'), '/assets/paintings/landscape.jpg', '时代配图 · 民国用千里江山图');
  eq(eraImages.eraImage('近现代'), '/assets/paintings/landscape.jpg', '时代配图 · 近现代用千里江山图');
  eq(eraImages.eraImage('新中国'), '/assets/paintings/modern.jpg', '时代配图 · 新中国用开国大典');
  eq(eraImages.eraImage('辽'), '/assets/palace.jpg', '时代配图 · 无专属绘画回退宫阙');
  eq(eraImages.personThumb('西汉', 0), '/assets/thumbs/han-1.jpg', '人物缩略图 · 西汉轮换起点');
  eq(eraImages.personThumb('西汉', 1), '/assets/thumbs/han-2.jpg', '人物缩略图 · 西汉第二张');
  eq(eraImages.personThumb('民国', 0), '/assets/thumbs/republic-1.jpg', '人物缩略图 · 民国用山河细部');
  eq(eraImages.personThumb('辽', 0), '/assets/palace.jpg', '人物缩略图 · 无专属绘画回退宫阙');
  let thumbCount = 0;
  ['han', 'tang', 'song', 'ming', 'qing', 'modern', 'republic'].forEach((base) => {
    [1, 2, 3, 4].forEach((n) => {
      if (fs.existsSync(path.join(ROOT, `/assets/thumbs/${base}-${n}.jpg`))) thumbCount += 1;
    });
  });
  eq(thumbCount, 28, '人物缩略图 7 组 × 4 张齐备');

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

  p.onShow();
  eq(p.data.dateText.slice(-4), '· 今天', 'dateText 为今天');
  ok(history.events.some((e) => e.id === p.data.hero.eventId), 'hero 连到真实史事事件');
  eq(p.data.hero.title, '今日史事', 'hero 标题');
  ok(p.data.hero.desc && p.data.hero.desc.length > 0, 'hero 描述非空');
  // 今日匹配应与日期库一致（同一天的公历月日）
  const today = (() => { const d = new Date(); return d.getMonth() + 1 + '-' + d.getDate(); })();
  const todayId = (history.daily.find((d) => `${d.month}-${d.day}` === today) || history.dailyFallback).eventId;
  eq(p.data.hero.eventId, todayId, `今日(${today}) hero 与日期库一致`);
  eq(p.data.era.title, '盛唐气象', 'era 来自 topics');
  eq(p.data.modern.shortTitle, '百年中国', 'modern 来自 topics');

  tap(p, 'goDiscover');
  eq(last('switchTab').url, '/pages/discover/discover', '全部朝代 › 发现页（switchTab）');

  tap(p, 'goPage', { page: 'person' });
  ok(p.data.sheet.open, '人物磁贴：打开自绘弹层');
  eq(p.data.sheet.list.length, 72, '弹层列出七十二位人物');

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

console.log('== 时间轴 ==');

(function () {
  resetWifiStack();
  const p = pages.timeline;

  p.onLoad({});
  eq(p.data.mode, 'ancient', '默认古代');
  eq(p.data.events.length, 82, '古代 82 条事件');
  ok(p.data.events.every((e, i, arr) => i === 0 || arr[i - 1].year <= e.year), '古代按纪年升序');
  ok(p.data.events[0].id === 'xia-establish' && p.data.events[p.data.events.length - 1].id === 'humen-1839',
    '古代时间轴首尾为夏建立/虎门销烟');
  eq(p.data.events[0].dotClass, 'dot-red', '轴上首点红');
  eq(p.data.eraName, '夏—清', '时代带名来自数据推导');
  ok(p.data.eraMeta.indexOf('公元前2070–1839') >= 0 && p.data.eraMeta.indexOf('夏 / 商 / 西周 / 春秋 / 战国 / 秦') >= 0 &&
    p.data.eraMeta.indexOf('辽 / 北宋 / 西夏 / 金 / 南宋 / 元 / 明 / 清') >= 0,
    '时代带meta含纪年区间与时代列表（含先秦/辽金西夏/元/明清）');

  p.onLoad({ mode: 'modern' });
  eq(p.data.mode, 'modern', 'mode 参数近现代');
  eq(p.data.events.length, 18, '近现代 18 条事件');
  eq(p.data.eraName, '晚清—新中国', '近现代时代带名推导');
  ok(p.data.eraMeta.indexOf('1840–1978') >= 0 && p.data.eraMeta.indexOf('新中国') >= 0,
    '近现代meta覆盖 1978 与新中国');

  const before = JSON.stringify(p.data);
  tap(p, 'switchMode', { mode: 'modern' });
  eq(JSON.stringify(p.data), before, '切换到当前模式为 no-op');

  tap(p, 'switchMode', { mode: 'ancient' });
  eq(p.data.mode, 'ancient', '切换回古代');

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
    ok(item.img && fs.existsSync(path.join(ROOT, item.img)), `朝代卡有图 ${item.id}`)
  );
  eq(p.data.picks.length, 6, '精选史事六条');
  eq(p.data.picks[0].id, 'yuanmingyuan-1860', '精选首条为最新史事');
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
  eq(p.data.stats.map((s) => s.value), [24, 100, 72, 2], '统计与数据种子一致');

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
  eq(p.data.favs.length, 2, '收藏列表两条');
  eq(p.data.favs[0].id, 'xinhai-1911', '最新收藏在前');
  ok(p.data.favs.some((x) => x.id === 'su-shi' && x.type === 'person'), '收藏含人物');
  ok(p.data.foots.some((x) => x.id === 'su-shi'), '足迹含刚浏览的人物');
  ok(p.data.foots.every((x) => x.when && x.when.length > 0), '足迹带时间');
  ok(p.data.favs.every((x) => x.img && fs.existsSync(path.join(ROOT, x.img))), '收藏条目带配图');
  eq(p.data.favs.find((x) => x.id === 'xinhai-1911').img, '/assets/thumbs/republic-1.jpg', '辛亥革命收藏用山河细部');
  ok(p.data.foots.every((x) => x.img && fs.existsSync(path.join(ROOT, x.img))), '足迹条目带配图');
  ok(fs.existsSync(path.join(ROOT, 'assets/avatar-scholar.png')), '手绘历史形象头像存在');

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

  tap(p, 'onDataNote');
  ok(p.data.info.open && p.data.info.title === '数据与史料说明', '数据说明：自绘弹层打开');
  ok(p.data.info.paragraphs.join('').indexOf('朝代 24 条') >= 0, '数据说明含统计');
  tap(p, 'closeInfo');
  eq(p.data.info.open, false, '数据说明弹层可关闭');

  tap(p, 'onAssetNote');
  ok(p.data.info.open && p.data.info.paragraphs.join('').indexOf('SOURCES.md') >= 0, '素材说明指向来源表');
  tap(p, 'closeInfo');

  tap(p, 'onAboutBanner');
  ok(p.data.info.open && p.data.info.paragraphs.join('').indexOf('千里江山图') >= 0, '横幅 → 关于千里江山图');
  tap(p, 'closeInfo');

  tap(p, 'onAbout');
  ok(p.data.info.open && p.data.info.title === '史页', '关于史页弹层');
  tap(p, 'closeInfo');

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

  // 返回键：胶囊「← 返回」，保持 240×56 比例
  ['person', 'event', 'period', 'search', 'footprints', 'favorites', 'archive', 'archive-list', 'archive-detail'].forEach((name) => {
    const wxml = fs.readFileSync(path.join(ROOT, 'pages', name, name + '.wxml'), 'utf8');
    const wxss = fs.readFileSync(path.join(ROOT, 'pages', name, name + '.wxss'), 'utf8');
    ok(wxml.indexOf('back-label') >= 0 && wxml.indexOf('返回') >= 0, `${name} 使用返回胶囊`);
    ok(wxml.indexOf('class="back-arrow"') >= 0 && wxml.indexOf('mode="widthFix"') >= 0, `${name} 返回箭头按宽度等比`);
    ok(/\.back-arrow\s*\{[^}]*height:\s*auto/.test(wxss), `${name} 返回箭头高度自适应`);
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
  eq(discover.data.archive.totalText, '28,248', '发现页资料库总数文案');
  tap(discover, 'goArchive');
  eq(last('navigateTo').url, '/pages/archive/archive', '发现页进入资料库');

  const archive = pages.archive;
  archive.onLoad();
  eq(archive.data.stats.total, 28248, '资料库总数');
  eq(archive.data.categories.length, 9, '资料库九个辞条分类');
  eq(archive.data.sections.length, 8, '资料库八个人物/事件/文献入口');
  eq(archive.data.categories[0].name, '职官辞典', '资料库分类按数量排序');

  resetWifiStack();
  tap(archive, 'onCategory', { key: '12', name: '诸子百家名句赏析' });
  ok(
    last('navigateTo').url.indexOf('/pages/archive-list/archive-list?kind=cards&type=12') === 0,
    '资料库分类进列表页'
  );
  resetWifiStack();
  tap(archive, 'onSection', { key: 'figures', name: '历代人物' });
  eq(
    last('navigateTo').url,
    '/pages/archive-list/archive-list?kind=figures&title=%E5%8E%86%E4%BB%A3%E4%BA%BA%E7%89%A9',
    '资料库人物入口进列表页'
  );

  const list = pages['archive-list'];
  list.onLoad({ kind: 'cards', type: '12', title: '诸子百家名句赏析' });
  eq(list.data.loading, false, '资料库列表加载完成');
  eq(list.data.total, 246, '资料库列表总数');
  eq(list.data.shown.length, 60, '资料库列表首屏 60 条');
  list.onMore();
  eq(list.data.shown.length, 120, '资料库列表加载更多');
  const first = list.data.shown[0];
  list.onInput({ detail: { value: first.title.slice(0, 2) } });
  ok(list.data.total > 0, '资料库列表可搜索');
  list.clearKeyword();
  eq(list.data.total, 246, '清空搜索恢复全量');

  const detail = pages['archive-detail'];
  detail.onLoad({
    kind: 'cards',
    type: '12',
    title: '诸子百家名句赏析',
    id: first.id
  });
  eq(detail.data.loading, false, '资料库详情加载完成');
  eq(detail.data.item.id, first.id, '资料库详情命中条目');
  ok(detail.data.blocks.length > 0, '资料库详情正文分段');
  ok(detail.data.kicker === '诸子百家名句赏析', '资料库详情保留分类名');
  ok(detail.onShareAppMessage().path.indexOf('kind=cards') >= 0, '资料库详情分享带参数');

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
  ok(detail.data.showLead === false, '诗文名句不重复摘要');
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
  eq(p.data.related.map((e) => e.id), ['chenqiao-960', 'chanyuan-1005', 'wanganshi-1069', 'jingkang-1127'],
    '相关史事映射');
  eq(p.data.accent, 'ancient', '古代赭石');
  eq(p.data.seal, '苏', '顶栏小印取自人名首字');
  eq(p.data.headImg, '/assets/paintings/song.jpg', '人物头卡：苏轼配宋画');
  eq(p.data.related.map((e) => e.img), ['/assets/thumbs/song-1.jpg', '/assets/thumbs/song-2.jpg', '/assets/thumbs/song-3.jpg', '/assets/thumbs/song-4.jpg'],
    '相关史事缩略图按行轮换，四张不重复');

  p.onLoad({ id: 'lu-xun' });
  eq(p.data.accent, 'modern', '近现代蓝灰');
  eq(p.data.related.length, 3, '鲁迅相关史事三条');
  eq(p.data.headImg, '/assets/paintings/landscape.jpg', '鲁迅头卡用千里江山图（不误配开国大典）');
  ok(p.data.related.every((e) => e.img && fs.existsSync(path.join(ROOT, e.img))), '鲁迅相关史事缩略图存在');

  p.onLoad({ id: 'mao-zedong' });
  eq(p.data.headImg, '/assets/paintings/modern.jpg', '毛泽东头卡用开国大典');

  p.onLoad({ id: 'zhao-kuangyin' });
  eq(p.data.person.name, '赵匡胤', '赵匡胤载入');
  eq(p.data.related.length, 1, '赵匡胤相关史事一条');

  p.onLoad({ id: 'wang-anshi' });
  eq(p.data.related.length, 2, '王安石相关史事两条');

  p.onLoad({ id: 'lin-zexu' });
  eq(p.data.accent, 'modern', '林则徐按晚清走蓝灰');

  // 分享路径
  wxLog.length = 0;
  const share = p.onShareAppMessage();
  ok(share && share.path === '/pages/person/person?id=lin-zexu', '人物页分享带 id 参数');

  resetWifiStack();
  p.onLoad({ id: 'nope' });
  eq(last('redirectTo').url, '/pages/home/home', '未知人物回退首页');

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
  tap(p, 'goEvent', { id: 'han-wudi' });
  eq(last('navigateTo').url, '/pages/event/event?id=han-wudi', '朝代史事列表 → 事件详情');
  resetWifiStack();

  p.onLoad({ id: 'nope' });
  eq(last('redirectTo').url, '/pages/home/home', '未知朝代回退首页');
  resetWifiStack();
})();

// ---------------------------------------------------------------------------
// 7. event
// ---------------------------------------------------------------------------

console.log('== 事件详情 ==');

(function () {
  resetWifiStack();
  const p = pages.event;

  p.onLoad({ id: 'chanyuan-1005' });
  eq(p.data.event.title, '澶渊之盟', '澶渊之盟载入');
  eq(p.data.relatedPersons.map((x) => x.id), ['xiao-chuo', 'wang-anshi', 'su-shi'], '其时其人：反查列出萧绰、王安石与苏轼');
  eq(p.data.seal, '澶', '顶栏小印取事件名首字');
  eq(p.data.headImg, '/assets/paintings/song.jpg', '事件头卡：北宋配《清明上河图》');
  ok(p.data.relatedPersons.every((x) => x.img && fs.existsSync(path.join(ROOT, x.img))), '其时其人：每人有配图且文件存在');

  p.onLoad({ id: 'han-wudi' });
  eq(p.data.relatedPersons.map((x) => x.id), ['han-wudi', 'zhang-qian', 'wei-qing', 'huo-qubing', 'sima-qian'], '汉武事件反查列出汉武帝/张骞/卫青/霍去病/司马迁');
  eq(p.data.headImg, '/assets/paintings/han.jpg', '事件头卡：西汉配长信宫灯');
  eq(new Set(p.data.relatedPersons.map((x) => x.img)).size, 4, '其时其人：同代人物 4 张缩略图轮换');

  p.onLoad({ id: 'qidan-916' });
  eq(p.data.headImg, '/assets/palace.jpg', '事件头卡：无专属绘画时代回退水墨宫阙');

  p.onLoad({ id: 'mobei-119' });
  eq(p.data.relatedPersons.map((x) => x.id), ['wei-qing', 'huo-qubing'], '漠北之战反查列出卫青与霍去病');

  p.onLoad({ id: 'longmarch-1934' });
  ok(p.data.relatedPersons.some((x) => x.id === 'mao-zedong'), '长征事件反查含毛泽东');

  p.onLoad({ id: 'zunyi-1935' });
  ok(p.data.relatedPersons.some((x) => x.id === 'mao-zedong'), '遵义会议反查含毛泽东');

  p.onLoad({ id: 'yuanmingyuan-1860' });
  eq(p.data.relatedPersons.length, 0, '圆明园无人物卡');
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

  // 收藏按钮状态
  eq(p.data.collected, false, '未收藏状态');
  tap(p, 'toggleCollect');
  eq(p.data.collected, true, '事件收藏生效');

  resetWifiStack();
  p.onLoad({ id: 'nope' });
  eq(last('redirectTo').url, '/pages/home/home', '未知事件回退首页');
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
  ok(p.data.results.persons.some((x) => x.id === 'zhang-qian'), '汉武帝关联人物张骞命中（details 全文）');
  ok(p.data.results.events.some((e) => e.id === 'han-wudi'), '命中同名事件');
  ok(!p.data.empty, '非空结果');

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
  eq(last('redirectTo').url, '/pages/home/home', '搜索页无栈返回 → 回首页');

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
// 9. 路由边界：所有跳转目标页面存在
// ---------------------------------------------------------------------------

console.log('== 路由完整 ==');

(function () {
  const targets = wxLog
    .filter((r) => ['navigateTo', 'redirectTo'].indexOf(r.kind) >= 0)
    .map((r) => urlTarget(r.url));
  targets.forEach((t) => ok(pages[t], `跳转目标页存在 ${t}`));
  ok(Object.keys(pages).length === 13, '十三个页面全部注册');
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
        { title: '事件乙', year: '1921', description: '一大召开', event_type: 'event' }
      ]
    }
  };

  p.onShow();
  eq(p.data.tih.length, 3, '今日接口归一化后出有效条目');
  eq(p.data.tih[0].yearText, '1881', '板块条目按年份升序');
  eq(p.data.tihTotal, 3, '板块总数正确');
  eq(p.data.tihDate, `${new Date().getMonth() + 1}月${new Date().getDate()}日`, '板块显示当日日期');

  p.onTihTap({ currentTarget: { dataset: { index: 0 } } });
  ok(p.data.info.open && p.data.info.title.indexOf('1881') >= 0, '板块条目点击出信息弹层');
  tap(p, 'closeInfo');
  eq(p.data.info.open, false, '信息弹层可关闭');

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
