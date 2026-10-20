// 数据中枢：所有页面统一从这里读历史数据
// - 初始返回打包内的本地种子 require('../data/history.js')（离线零依赖）
// - onShow 时页面调用 refresh()：jsDelivr 拉到新 JSON 且校验通过 → 热替换，
//   并通知订阅回调重建页面数据（内容更新不用发版）
// - 校验不通过/网络失败 → 保持 current 不变，UI 零影响
// - 09B 后 NestJS 上线时，仅需替换 remote.js 的 URL 与载荷解析

const seed = require('../data/history.js');
const remote = require('./remote.js');

let current = seed;
const subs = [];

function valid(data) {
  return !!(
    data &&
    data === Object(data) &&
    Array.isArray(data.events) &&
    data.events.length > 0 &&
    Array.isArray(data.persons) &&
    Array.isArray(data.periods) &&
    data.periods.length > 0 &&
    Array.isArray(data.topics) &&
    Array.isArray(data.daily) &&
    data.dailyFallback &&
    data.dailyFallback.eventId
  );
}

function get() {
  return current;
}

// 订阅数据热替换；若当前已是远端数据，注册即同步一次
function subscribe(fn) {
  if (typeof fn !== 'function') return;
  subs.push(fn);
  if (current !== seed) fn(current);
}

function apply(data) {
  if (data === current || !valid(data)) return false;
  current = data;
  subs.slice().forEach((fn) => {
    try {
      fn(current);
    } catch (e) {
      // 单个订阅方异常不阻断其他页面
    }
  });
  return true;
}

function sameData(a, b) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch (e) {
    return false;
  }
}

// cb(changed:boolean, err:Error|null)
function refresh(cb) {
  remote.fetchRemoteHistory((err, data) => {
    if (err || !data) {
      if (typeof cb === 'function') cb(false, err);
      return;
    }
    if (sameData(data, current)) {
      if (typeof cb === 'function') cb(false, null);
      return;
    }
    if (typeof cb === 'function') cb(apply(data), null);
  });
}

module.exports = {
  get,
  subscribe,
  refresh,
  valid
};
