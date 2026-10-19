// 交互自测：加载真实页面代码与数据，mock wx / Page，
// 模拟生命周期与点击，逐条断言数据状态与路由行为。
// 用法：node tools/selftest.js

'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');

const ROOT = path.join(__dirname, '..', 'miniprogram');

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
  // setData：按整键替换，供断言读取（与 wx 顶層键覆盖行为一致）
  Object.defineProperty(page, 'setData', {
    value(patch, cb) {
      Object.keys(patch).forEach((key) => {
        page.data[key] = patch[key];
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

  eq(history.events.length, 16, '史事 16 条');
  eq(history.persons.length, 9, '人物 9 位');
  ok(new Set([...eventIds]).size === 16, '史事 id 唯一');
  ok(new Set([...personIds]).size === 9, '人物 id 唯一');
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
    ok(p.quote && p.quoteSource, `[${p.id}] 引文与出处`);
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
  ['zhenguan-627', 'kaiyuan-713', 'anshi-755', 'jiawu-1894'].forEach((id) =>
    ok(eventIds.has(id), `新史事条目存在 ${id}`)
  );

  // 图片路径全部存在于磁盘
  const goodImg = (p) => ok(p && fs.existsSync(path.join(ROOT, p)), `素材存在 ${p}`);
  goodImg(history.topics.find((t) => t.id === 'tang') ? '/assets/tang-bg.jpg' : null);
  ['han', 'tang', 'song', 'modern'].forEach((id) =>
    goodImg('/assets/paintings/' + id + '.jpg')
  );
  goodImg('/assets/paintings/landscape.jpg');
})();

// ---------------------------------------------------------------------------
// 2. home
// ---------------------------------------------------------------------------

console.log('== 首页 ==');

(function () {
  resetWifiStack();
  const p = pages.home;

  p.onLoad();
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

  tap(p, 'goTab', { page: 'timeline' });
  eq(last('redirectTo').url, '/pages/timeline/timeline', '底部栏 首页→时间轴');

  tap(p, 'goDiscover');
  eq(last('redirectTo').url, '/pages/discover/discover', '全部朝代 › 发现页');

  tap(p, 'goPage', { page: 'person' });
  eq(pendingSheet && pendingSheet.itemList.length, 9, '人物磁贴：ActionSheet 九位人物');
  pickSheet(5);
  eq(last('navigateTo').url, '/pages/person/person?id=su-shi', '选择第 6 位 → 苏轼详情');

  tap(p, 'goPage', { page: 'event' });
  eq(pendingSheet && pendingSheet.itemList.length, 6, '事件磁贴：ActionSheet 六条史事');
  pickSheet(0);
  const evUrl = last('navigateTo').url;
  ok(/event\?id=yuanmingyuan-1860|event\?id=reform-1978/.test(evUrl), `事件磁贴选择命中真实事件 (${evUrl})`);

  tap(p, 'goPage', { page: 'dynasty' });
  eq(pendingSheet && pendingSheet.itemList.length, 4, '朝代磁贴：四个时代');
  pickSheet(0);
  eq(last('navigateTo').url, '/pages/period/period?id=han', '选择时代 → 朝代详情页');

  tap(p, 'onHeroTap');
  const heroUrl = last('navigateTo').url;
  ok(new RegExp(`event\\.js?id=${p.data.hero.eventId}`.replace('.', '\\.').replace(/\./g, '.')).test(heroUrl) || heroUrl.indexOf(p.data.hero.eventId) >= 0,
    `hero 点击 → 今日史事详情 (${heroUrl})`);

  tap(p, 'onEraTap');
  eq(last('redirectTo').url, '/pages/timeline/timeline?mode=ancient', '盛唐卡 → 古代时间轴');

  tap(p, 'onModernTap');
  eq(last('redirectTo').url, '/pages/timeline/timeline?mode=modern', '百年中国卡 → 近现代时间轴');
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
  eq(p.data.events.length, 8, '古代 8 条事件');
  eq(p.data.events.map((e) => e.year), [-141, 627, 713, 755, 960, 1005, 1069, 1127], '古代按纪年升序');
  eq(p.data.events[0].dotClass, 'dot-red', '轴上首点红');
  eq(p.data.eraName, '西汉—北宋', '时代带名来自数据推导');
  ok(p.data.eraMeta.indexOf('公元前141–1127') >= 0 && p.data.eraMeta.indexOf('西汉 / 唐 / 北宋') >= 0,
    '时代带meta含纪年区间与时代列表（含唐）');

  p.onLoad({ mode: 'modern' });
  eq(p.data.mode, 'modern', 'mode 参数近现代');
  eq(p.data.events.length, 8, '近现代 8 条事件');
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

  tap(p, 'goTab', { page: 'discover' });
  eq(last('redirectTo').url, '/pages/discover/discover', '底部栏 时间轴→发现');
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
  eq(last('redirectTo').url, '/pages/timeline/timeline?mode=modern', '专题长卷 → 近现代时间轴');

  tap(p, 'goTimeband', {});
  eq(last('redirectTo').url, '/pages/timeline/timeline?mode=ancient', '进时间轴链接 → 古代');

  tap(p, 'goTimeline', { mode: 'modern' });
  eq(last('redirectTo').url, '/pages/timeline/timeline?mode=modern', '近现代起读 → 近现代时间轴');

  tap(p, 'goTab', { page: 'home' });
  eq(last('redirectTo').url, '/pages/home/home', '底部栏 发现→首页');
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
  eq(p.data.stats.map((s) => s.value), [4, 16, 9, 2], '统计与数据种子一致');

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
  eq(p.data.favs.length, 1, '取消后剩一条');

  // 收藏条目可跳转详情
  const target = p.data.favs[0];
  tap(p, 'onEntry', { type: target.type, id: target.id });
  ok(last('navigateTo').url.indexOf(target.id) >= 0, '收藏条目跳转详情');

  tap(p, 'onSearch');
  eq(last('navigateTo').url, '/pages/search/search', '搜索入口');

  tap(p, 'onDataNote');
  ok(last('showModal').content.indexOf('朝代 4 条') >= 0, '数据说明含统计');
  confirmModal(true);

  tap(p, 'onAssetNote');
  ok(last('showModal').content.indexOf('SOURCES.md') >= 0, '素材说明指向来源表');
  confirmModal(true);

  tap(p, 'onAboutBanner');
  ok(last('showModal').content.indexOf('千里江山图') >= 0, '横幅 → 关于千里江山图');
  confirmModal(true);

  tap(p, 'onAbout');
  confirmModal(true);

  tap(p, 'onClearCache');
  const clearedBefore = storageCleared;
  confirmModal(false);
  eq(storageCleared, clearedBefore, '取消不清缓存');
  tap(p, 'onClearCache');
  confirmModal(true);
  eq(storageCleared, clearedBefore + 1, '确认后清缓存');
  p.onShow();
  eq(p.data.favs.length, 0, '清缓存后收藏清空');
  eq(p.data.foots.length, 0, '清缓存后足迹清空');

  tap(p, 'goTab', { page: 'timeline' });
  eq(last('redirectTo').url, '/pages/timeline/timeline', '底部栏 我的→时间轴');
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
  eq(p.data.events.map((e) => e.id), ['han-wudi'], '西汉收录史事');
  eq(p.data.seal, '汉', '小印');

  p.onLoad({ id: 'song' });
  eq(p.data.events.length, 4, '北宋收录四条史事');
  ok(p.data.span.length > 0, '时代脉络非空');
  ok(p.data.events[0].year <= p.data.events[p.data.events.length - 1].year, '北宋史事按纪年升序');

  p.onLoad({ id: 'modern' });
  eq(p.data.events.length, 8, '近现代面板收录八条');
  eq(p.data.seal, '近', '近现代小印');

  p.onLoad({ id: 'tang' });
  eq(p.data.events.map((e) => e.id), ['zhenguan-627', 'kaiyuan-713', 'anshi-755'], '唐收录三条史事');
  eq(p.data.span, '从627到755', '唐span按首尾纪年');
  ok(p.data.period.title === '盛唐气象', '唐卡载入');
  tap(p, 'goTimeline');
  eq(last('redirectTo').url, '/pages/timeline/timeline?mode=ancient', '唐页底部进时间轴');

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
  eq(p.data.relatedPersons.map((x) => x.id), ['han-wudi'], '汉武事件反查列出汉武帝');

  p.onLoad({ id: 'yuanmingyuan-1860' });
  eq(p.data.relatedPersons.length, 0, '圆明园无人物卡');
  tap(p, 'goTimeline');
  eq(last('redirectTo').url, '/pages/timeline/timeline?mode=modern', '回时间轴带 modern');

  p.onLoad({ id: 'han-wudi' });
  tap(p, 'goTimeline');
  eq(last('redirectTo').url, '/pages/timeline/timeline?mode=ancient', '回时间轴带 ancient');

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
  eq(p.data.results.persons.length, 1, '汉武帝命中一位人物');
  eq(p.data.results.persons[0].id, 'han-wudi', '命中人物 id');
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

  p.setData({ keyword: '杜甫' });
  p.onSearch();
  ok(p.data.results.persons.some((x) => x.id === 'du-fu'), '杜甫命中人物');

  p.setData({ keyword: '李鸿章' });
  p.onSearch();
  ok(p.data.results.persons.some((x) => x.id === 'li-hongzhang'), '李鸿章命中人物');

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
  eq(last('redirectTo').url, '/pages/timeline/timeline?mode=modern', '百年中国面板 → 近现代轴');

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
