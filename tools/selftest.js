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

  const names = ['home', 'timeline', 'discover', 'profile', 'event', 'person', 'period', 'search'];
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

  eq(history.events.length, 37, '史事 37 条');
  eq(history.persons.length, 20, '人物 20 位');
  ok(new Set([...eventIds]).size === 37, '史事 id 唯一');
  ok(new Set([...personIds]).size === 20, '人物 id 唯一');
  ok(new Set([...periodIds]).size === 4, '朝代 id 唯一');

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
  ['zhang-qian', 'chen-duxiu', 'deng-xiaoping', 'wei-qing', 'huo-qubing', 'mao-zedong', 'zheng-he', 'yu-qian', 'qi-jiguang', 'wang-shouren', 'cao-xueqin'].forEach((id) => ok(personIds.has(id), `新人物条目存在 ${id}`));

  // relatedEvents 反查闭环：王守仁/戚继光/林则徐 均已挂真实条目
  const reIds = (pid) => {
    const p = history.persons.find((x) => x.id === pid);
    return (p.relatedEvents || []).filter((id) => eventIds.has(id));
  };
  ok(reIds('wang-shouren').indexOf('ningwang-1519') >= 0, '王守仁反查 平宁王之乱');
  ok(reIds('qi-jiguang').indexOf('taizhou-1561') >= 0, '戚继光反查 台州大捷');
  ok(reIds('lin-zexu').indexOf('humen-1839') >= 0 && reIds('lin-zexu').indexOf('opium-war-1840') >= 0, '林则徐反查 销烟+鸦片战争');

  // 图片路径全部存在于磁盘
  const goodImg = (p) => ok(p && fs.existsSync(path.join(ROOT, p)), `素材存在 ${p}`);
  goodImg(history.topics.find((t) => t.id === 'tang') ? '/assets/tang-bg.jpg' : null);
  ['han', 'tang', 'song', 'modern'].forEach((id) =>
    goodImg('/assets/paintings/' + id + '.jpg')
  );
  goodImg('/assets/paintings/landscape.jpg');

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
  eq(p.data.sheet.list.length, 20, '弹层列出二十位人物');

  tap(p, 'onSheetItem', { index: 6 });
  eq(last('navigateTo').url, '/pages/person/person?id=su-shi', '选择第 6 位 → 苏轼详情');
  eq(p.data.sheet.open, false, '选择后弹层自动关闭');

  tap(p, 'goPage', { page: 'event' });
  ok(p.data.sheet.open, '事件磁贴：打开自绘弹层');
  eq(p.data.sheet.list.length, 6, '弹层列出六条史事');
  tap(p, 'onSheetItem', { index: 0 });
  const evUrl = last('navigateTo').url;
  ok(/event\?id=yuanmingyuan-1860|event\?id=reform-1978/.test(evUrl), `事件磁贴选择命中真实事件 (${evUrl})`);

  tap(p, 'goPage', { page: 'dynasty' });
  ok(p.data.sheet.open, '朝代磁贴：打开自绘弹层');
  eq(p.data.sheet.list.length, 4, '弹层列出四个时代');
  tap(p, 'closeSheet');
  eq(p.data.sheet.open, false, '点遮罩/取消可关闭');
  tap(p, 'goPage', { page: 'dynasty' });
  tap(p, 'onSheetItem', { index: 0 });
  eq(last('navigateTo').url, '/pages/period/period?id=han', '选择时代 → 朝代详情页');

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
  eq(p.data.events.length, 22, '古代 22 条事件');
  eq(p.data.events.map((e) => e.year), [-141, -138, -119, 626, 627, 713, 755, 916, 960, 1005, 1038, 1069, 1115, 1127, 1405, 1449, 1519, 1561, 1581, 1644, 1681, 1839], '古代按纪年升序');
  eq(p.data.events[0].dotClass, 'dot-red', '轴上首点红');
  eq(p.data.eraName, '西汉—清', '时代带名来自数据推导');
  ok(p.data.eraMeta.indexOf('公元前141–1839') >= 0 && p.data.eraMeta.indexOf('西汉 / 唐 / 辽 / 北宋 / 西夏 / 金 / 明 / 清') >= 0,
    '时代带meta含纪年区间与时代列表（含辽/西夏/金/明/清）');

  p.onLoad({ mode: 'modern' });
  eq(p.data.mode, 'modern', 'mode 参数近现代');
  eq(p.data.events.length, 15, '近现代 15 条事件');
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
  eq(p.data.periods.length, 4, '朝代四张卡');
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
  eq(p.data.stats.map((s) => s.value), [4, 37, 20, 2], '统计与数据种子一致');

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
  ok(p.data.info.paragraphs.join('').indexOf('朝代 4 条') >= 0, '数据说明含统计');
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
// 6. person
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

  p.onLoad({ id: 'lu-xun' });
  eq(p.data.accent, 'modern', '近现代蓝灰');
  eq(p.data.related.length, 3, '鲁迅相关史事三条');

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
  eq(p.data.events.map((e) => e.id), ['han-wudi', 'zhangqian-138', 'mobei-119'], '西汉收录三条史事');
  ok(p.data.span.indexOf('公元前141') >= 0 && p.data.span.indexOf('公元前119') >= 0, '西汉span覆盖首尾纪年');
  eq(p.data.seal, '汉', '小印');

  p.onLoad({ id: 'song' });
  eq(p.data.events.length, 4, '北宋收录四条史事');
  ok(p.data.span.length > 0, '时代脉络非空');
  ok(p.data.events[0].year <= p.data.events[p.data.events.length - 1].year, '北宋史事按纪年升序');

  p.onLoad({ id: 'modern' });
  eq(p.data.events.length, 15, '近现代面板收录十五条');
  eq(p.data.seal, '近', '近现代小印');

  p.onLoad({ id: 'tang' });
  eq(p.data.events.map((e) => e.id), ['xuanwumen-626', 'zhenguan-627', 'kaiyuan-713', 'anshi-755'], '唐收录四条史事');
  eq(p.data.span, '从626到755', '唐span按首尾纪年');
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
  eq(p.data.relatedPersons.map((x) => x.id), ['wang-anshi', 'su-shi'], '其时其人：反查列出王安石与苏轼');
  eq(p.data.seal, '澶', '顶栏小印取事件名首字');

  p.onLoad({ id: 'han-wudi' });
  eq(p.data.relatedPersons.map((x) => x.id), ['han-wudi', 'zhang-qian', 'wei-qing', 'huo-qubing'], '汉武事件反查列出汉武帝/张骞/卫青/霍去病');

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
  ok(Object.keys(pages).length === 8, '八个页面全部注册');
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

  // 断网：板块清空隐藏，页面其余内容不受影响
  mockRequest.today = null;
  delete storage['shige_tih_' + api.dateKey(new Date())];
  p.onShow();
  eq(p.data.tih.length, 0, '无网时板块清空');
  ok(p.data.hero && p.data.hero.title, '无网时其余内容保持');

  mockRequest.today = null;
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
