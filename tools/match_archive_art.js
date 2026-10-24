// 把资料库条目（figures/emperors/events/wars）按标题匹配到主站人物/事件专属图，
// 生成 miniprogram/utils/archiveArtMatch.js（自动生成，勿手改，可重跑）。
// 命中的条目零下载复用现有专属图；未命中的由 tools/add_archive_art.py 补抓。
// 取图优先级见 utils/archiveArt.js：主站匹配图 > 资料库自抓图 > 无图。
// 用法：node tools/match_archive_art.js
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const APK = path.join(ROOT, 'miniprogram', 'data', 'apk');
const OUT = path.join(ROOT, 'miniprogram', 'utils', 'archiveArtMatch.js');

global.wx = { getStorageSync: () => '', setStorageSync: () => {}, removeStorageSync: () => {} };
const hist = require(path.join(ROOT, 'miniprogram/data/history.js'));
const extra = require(path.join(ROOT, 'miniprogram/data/history-extra.js'));
const artRemote = require(path.join(ROOT, 'miniprogram/utils/artRemote.js'));
const data = hist.data || hist;
const persons = (data.persons || []).concat((extra.data && extra.data.persons) || []);
const events = (data.events || []).concat((extra.data && extra.data.events) || []);

// 有专属图的人物/事件 id（本地 personart/eventart 4+6 张 + 远端 162 张）
const LOCAL_PERSONS = ['han-wudi', 'wei-qing', 'zhang-qian', 'huo-qubing'];
const LOCAL_EVENTS = ['chibi', 'qin-unify', 'zhenghe-1405', 'dayunhe', 'humen-1839', 'han-wudi'];
const hasPersonArt = (id) => LOCAL_PERSONS.indexOf(id) >= 0 || artRemote.persons.indexOf(id) >= 0;
const hasEventArt = (id) => LOCAL_EVENTS.indexOf(id) >= 0 || artRemote.events.indexOf(id) >= 0;

const norm = (s) => String(s || '').replace(/[\s·]/g, '');
const personByName = {};
persons.forEach((p) => { personByName[norm(p.name)] = p.id; });
const eventByTitle = {};
events.forEach((e) => { eventByTitle[norm(e.title)] = e.id; });

// 常见别称/庙号 ↔ 主站人物 id（主站名匹配不到时兜底）
const ALIASES = {
  刘彻: 'han-wudi',
  李世民: 'tang-taizong',
  赵匡胤: 'zhao-kuangyin',
  朱元璋: 'zhu-yuanzhang',
  爱新觉罗玄烨: 'kangxi',
  爱新觉罗弘历: 'qianlong',
  刘秀: 'guangwu',
  商汤: 'cheng-tang',
  周公旦: 'zhou-gong',
  魏武帝: 'cao-cao'
};

const KINDS = ['figures', 'emperors', 'events', 'wars'];
const result = {};
let totalMatch = 0;

KINDS.forEach((kind) => {
  const rows = JSON.parse(fs.readFileSync(path.join(APK, kind, 'index.json'), 'utf8'));
  const map = {};
  rows.forEach((row) => {
    const id = row[0];
    const title = norm(row[1]);
    const pid = personByName[title] || ALIASES[title] || '';
    if (pid && hasPersonArt(pid)) {
      map[id] = ['p', pid];
      return;
    }
    const eid = eventByTitle[title];
    if (eid && hasEventArt(eid)) {
      map[id] = ['e', eid];
    }
  });
  result[kind] = map;
  totalMatch += Object.keys(map).length;
  console.log(`${kind}: ${rows.length} 条，命中主站图 ${Object.keys(map).length}`);
});

const lines = [
  '// 自动生成：tools/match_archive_art.js —— 资料库条目 → 主站人物/事件专属图匹配表（勿手改）',
  '// 值为 ["p"|"e", 主站 id]；取图优先级见 utils/archiveArt.js，未命中的条目走 add_archive_art.py 自抓图',
  'module.exports = {'
];
KINDS.forEach((kind) => {
  const entries = Object.keys(result[kind])
    .sort()
    .map((id) => `    '${id}': ['${result[kind][id][0]}', '${result[kind][id][1]}']`);
  lines.push(`  ${kind}: {`);
  if (entries.length) lines.push(entries.join(',\n') + '\n  }' + (kind === 'wars' ? '' : ','));
  else lines.push('  }' + (kind === 'wars' ? '' : ','));
});
lines.push('};');
OUT.writeText ? OUT.writeText : fs.writeFileSync(OUT, lines.join('\n') + '\n', 'utf8');
console.log(`共命中 ${totalMatch} 条，已写入 ${path.relative(ROOT, OUT)}`);
