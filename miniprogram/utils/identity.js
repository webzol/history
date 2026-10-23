// 「我的」页随机身份：历史风格昵称 + 头像变体（本地存储，可换一换）
// 头像由 tools/gen_avatars.py 生成（手绘史官参数化变体），勿手改清单。
const KEY = 'shige_identity';

const AVATAR_COUNT = 20;

// 字号式昵称：前字 × 号尾，读起来像古人自号（听松居士 / 锄月山人 / 青简先生…）
const NICK_A = [
  '听松', '卧云', '观澜', '抱朴', '枕流', '问梅', '扫叶', '临溪', '对月', '烟波',
  '青简', '锄月', '餐霞', '佩韦', '拾遗', '守拙', '怀沙', '梦笔', '濯缨', '种菊'
];
const NICK_B = ['居士', '山人', '主人', '先生', '散人', '道人', '行者', '书生', '叟', '翁'];

// 座右铭（原「以千年为卷轴」一句保留在首位）
const MOTTOS = [
  '以千年为卷轴，读万古事',
  '一卷千年，灯下史页',
  '韦编三绝，不废江河',
  '读史早知今日事',
  '青简为舟，渡百年潮',
  '兴亡看饱，卷里春秋'
];

function avatarPath(n) {
  return '/assets/avatars/avatar-' + (n < 10 ? '0' + n : '' + n) + '.jpg';
}

function allAvatars() {
  const list = [];
  for (let i = 1; i <= AVATAR_COUNT; i += 1) list.push(avatarPath(i));
  return list;
}

function pick(except) {
  const avatar = avatarPath(1 + Math.floor(Math.random() * AVATAR_COUNT));
  const nick = NICK_A[Math.floor(Math.random() * NICK_A.length)] +
    NICK_B[Math.floor(Math.random() * NICK_B.length)];
  const motto = MOTTOS[Math.floor(Math.random() * MOTTOS.length)];
  if (except && except.avatar === avatar && except.nick === nick) return pick(except);
  return { avatar, nick, motto };
}

function get() {
  try {
    const saved = wx.getStorageSync(KEY);
    if (saved && saved.avatar && saved.nick) return saved;
  } catch (e) { /* 本地存储异常时走随机兜底 */ }
  const fresh = pick();
  try { wx.setStorageSync(KEY, fresh); } catch (e) { /* 忽略写入失败 */ }
  return fresh;
}

function reroll() {
  const fresh = pick(get());
  try { wx.setStorageSync(KEY, fresh); } catch (e) { /* 忽略写入失败 */ }
  return fresh;
}

module.exports = { KEY, AVATAR_COUNT, NICK_A, NICK_B, MOTTOS, avatarPath, allAvatars, get, reroll };
