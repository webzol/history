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
  ['20-person-yuqian', 'person?shot=1&id=yu-qian'],
  ['21-archive', 'archive?shot=1'],
  ['22-archive-list', `archive-list?shot=1&kind=cards&type=12&title=${esc('诸子百家名句赏析')}`],
  ['23-archive-detail', `archive-detail?shot=1&kind=cards&type=12&shard=00&title=${esc('诸子百家名句赏析')}&id=hc-12-00001`],
  ['24-archive-wenyan', `archive-list?shot=1&kind=wenyan&title=${esc('文言辞条')}`],
  ['25-archive-poemquote', `archive-detail?shot=1&kind=poemquotes&shard=00&title=${esc('诗文名句')}&id=hpq-1`],
  ['26-archive-poems', `archive-list?shot=1&kind=poems-shi&title=${esc('诗文全文 · 诗')}`],
  ['27-archive-poem-detail', `archive-detail?shot=1&kind=poems-shi&type=00&shard=00&title=${esc('诗文全文 · 诗')}&id=hpw-10020`],
  ['28-archive-cards-open', `archive?shot=1&s=${esc('click:.group-card')}`]
];

let miss = 0;

// 起跑前先确认预览服务在线：服务没起时 Chrome 不写文件，
// 旧图存在会让「文件存在即 OK」的判断全绿（漏报），必须先探测。
try {
  const probe = spawnSync('curl', ['-s', '-o', 'nul', '-w', '%{http_code}', '--max-time', '3', BASE.replace('#', '')]);
  const code = String((probe.stdout || '').toString().trim());
  if (code !== '200') {
    console.error(`预览服务未就绪（${BASE.replace('#', '')} 返回 ${code || '无响应'}）。请先运行：node tools/preview_server.js`);
    process.exit(2);
  }
} catch (e) {
  console.error('无法探测预览服务：', e.message);
  process.exit(2);
}

for (const [name, hash] of targets) {
  const out = path.join(OUT_DIR, `${name}.png`);
  const mtimeBefore = fs.existsSync(out) ? fs.statSync(out).mtimeMs : 0;
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
  // 必须确认本次真的写出了新文件（mtime 前进），防止旧图顶替新渲染
  const wrote = fs.existsSync(out) && fs.statSync(out).mtimeMs > mtimeBefore + 1;
  const ok = wrote && fs.statSync(out).size > 10240 && !res.error && res.status === 0;
  console.log((ok ? 'OK   ' : 'MISS ') + name);
  if (!ok) miss += 1;
}
console.log(miss ? `完成，缺 ${miss} 张` : '完成，全部截图成功');
process.exit(miss ? 1 : 0);
