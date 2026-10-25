// 在线数据源封装（首个真实接口）
// 数据源：60s API「历史上的今天」（开源免费、无需 Key）
//   原始结构 { code, message, data: { date, month, day, items: [{ title, year, description, event_type, link }] } }
//   上游同步自百度百科；开源仓库 https://github.com/vikiboss/60s
// 注意：
//   1) 开发者工具需勾选「不校验合法域名」；正式上线需把 https://60s.viki.moe
//      加入小程序后台 request 合法域名。
//   2) 上游限流较严，这里按「天」缓存最近一次成功结果（storage，TTL 6 小时）。
//   3) 任何失败（无网络/无 request 能力/空数据）都不抛错，仅回调 err，页面自行回退本地数据。

const SOURCE = 'https://60s.viki.moe/v2/today_in_history';
const CACHE_PREFIX = 'shige_tih_';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6h（成功结果）
const FAIL_TTL = 30 * 60 * 1000; // 30min（失败冷却：429/断网后一段时间内不再发请求）

function dateKey(date) {
  const d = date || new Date();
  return `${d.getMonth() + 1}-${d.getDate()}`;
}

// 每日随机精选：以日期字符串为种子的确定性抽取——
// 同一天所有用户看到同一条，隔天自动换；优先取有描述的条目（信息更丰富），无描述回退全量
function pickDaily(items, seed) {
  const src = items || [];
  const pool = src.filter((x) => x.desc);
  const list = pool.length ? pool : src;
  if (!list.length) return null;
  const key = String(seed == null ? dateKey() : seed);
  let h = 0;
  for (let i = 0; i < key.length; i += 1) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return list[h % list.length];
}

// 归一化：剔除脏项 → 字段统一 → 按年份升序
function normalizeToday(payload) {
  const data = payload && payload.data;
  if (!payload || payload.code !== 200 || !data || !Array.isArray(data.items)) return [];
  return data.items
    .filter((item) => item && item.title && item.year)
    .map((item) => ({
      year: Number(String(item.year).replace(/\D/g, '')) || 0,
      yearText: String(item.year),
      title: String(item.title).replace(/\[.*?\]/g, ''),
      desc: item.description || '',
      type: item.event_type === 'birth' ? '出生' : item.event_type === 'death' ? '逝世' : '事件',
      link: item.link || ''
    }))
    .filter((item) => item.year > 0)
    .sort((a, b) => a.year - b.year);
}

// 读缓存：命中成功数据返回 { items }；处于失败冷却期返回 { cooldown: true }；否则 null
function readCache(day) {
  const raw = wx.getStorageSync(CACHE_PREFIX + day);
  if (!raw || raw.day !== day) return null;
  const age = Date.now() - raw.at;
  if (raw.fail) return age < FAIL_TTL ? { cooldown: true } : null;
  if (age > CACHE_TTL) return null;
  return Array.isArray(raw.items) && raw.items.length ? { items: raw.items } : null;
}

function writeCache(day, items) {
  try {
    wx.setStorageSync(CACHE_PREFIX + day, { day, at: Date.now(), items });
  } catch (e) {
    // 存储失败不影响本次展示
  }
}

function writeFail(day) {
  try {
    wx.setStorageSync(CACHE_PREFIX + day, { day, at: Date.now(), fail: true });
  } catch (e) {
    // 存储失败不影响本次展示
  }
}

function fetchTodayInHistory(cb) {
  const day = dateKey();
  const cached = readCache(day);
  if (cached) {
    if (typeof cb === 'function') {
      if (cached.cooldown) cb(new Error('cooldown')); // 冷却期：不打网络，页面自行隐藏板块
      else cb(null, cached.items);
    }
    return;
  }
  if (typeof wx.request !== 'function') {
    if (typeof cb === 'function') cb(new Error('request unavailable'));
    return;
  }
  wx.request({
    url: SOURCE,
    method: 'GET',
    timeout: 10000,
    success: (res) => {
      const items = normalizeToday(res && res.data);
      if (!items.length) {
        // 非 200 / 空数据（含 429 限流）：写失败冷却，板块自动隐藏
        writeFail(day);
        if (typeof cb === 'function') cb(new Error('empty payload'));
        return;
      }
      writeCache(day, items);
      if (typeof cb === 'function') cb(null, items);
    },
    fail: () => {
      writeFail(day);
      if (typeof cb === 'function') cb(new Error('request fail'));
    }
  });
}

module.exports = {
  SOURCE,
  dateKey,
  pickDaily,
  normalizeToday,
  fetchTodayInHistory
};
