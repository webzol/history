// 批量截图：Chrome headless 渲染 ui/preview 的各页面与交互态。
// 用法：node tools/preview_shots.js

'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = path.join(__dirname, '..', 'ui', 'preview', 'shots');
const BASE = 'http://127.0.0.1:8137/ui/preview/index.html#';

fs.mkdirSync(OUT_DIR, { recursive: true });

const esc = encodeURIComponent;
const targets = [
  ['01-home', 'home?shot=1'],
  ['02-home-sheet-dynasty', `home?shot=1&s=${esc('click:.quick-item.t2')}`],
  ['03-timeline-ancient', 'timeline?shot=1'],
  ['04-timeline-modern', `timeline?shot=1&s=${esc('click:.seg-item:nth-child(2)')}`],
  ['05-discover', 'discover?shot=1'],
  ['06-period-tang', `discover?shot=1&s=${esc('click:.dyn-card:nth-child(2)')}`],
  ['07-profile', 'profile?shot=1'],
  ['08-profile-clear-cache', `profile?shot=1&s=${esc('click:.menu-row.last')}`],
  ['09-search', 'search?shot=1'],
  ['10-search-hanwudi', `search?shot=1&s=${esc('input:.search-input,汉武帝|click:.search-btn')}`],
  ['11-search-empty', `search?shot=1&s=${esc('input:.search-input,周文王|click:.search-btn')}`],
  ['12-person-sushi', 'person?shot=1&id=su-shi'],
  ['13-person-luxun', 'person?shot=1&id=lu-xun'],
  ['14-event-chanyuan', 'event?shot=1&id=chanyuan-1005'],
  ['15-event-xinhai', 'event?shot=1&id=xinhai-1911'],
  ['16-period-han', 'period?shot=1&id=han'],
  ['17-period-modern', 'period?shot=1&id=modern'],
  ['18-person-collect', `person?shot=1&id=su-shi&s=${esc('click:.ghost-btn')}`],
  ['19-event-zhenghe', 'event?shot=1&id=zhenghe-1405'],
  ['20-person-yuqian', 'person?shot=1&id=yu-qian']
];

let miss = 0;
for (const [name, hash] of targets) {
  const out = path.join(OUT_DIR, `${name}.png`);
  const res = spawnSync(
    CHROME,
    [
      '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
      '--window-size=522,1036',
      '--virtual-time-budget=5000',
      `--screenshot=${out}`,
      `${BASE}${hash}`
    ],
    { stdio: 'ignore', timeout: 45000 }
  );
  const ok = fs.existsSync(out) && fs.statSync(out).size > 10240 && !res.error;
  console.log((ok ? 'OK   ' : 'MISS ') + name);
  if (!ok) miss += 1;
}
console.log(miss ? `完成，缺 ${miss} 张` : '完成，全部截图成功');
process.exit(miss ? 1 : 0);
