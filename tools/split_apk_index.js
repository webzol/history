// 把 data/apk/**/index.json 拆成 head.json + part-N.json：
// - head.json：{ total, step, parts, items } —— 前 step(120) 条，列表页首屏只拉这一份（~12–25KB）
// - part-N.json：剩余条目按 step 切块的行数组，列表页首屏渲染后后台补齐
// index.json 保留不动（拆分工具的输入与旧版本兼容回退）。可重复执行，幂等。
// 用法：node tools/split_apk_index.js
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const APK = path.join(ROOT, 'miniprogram', 'data', 'apk');
const STEP = 120;

function walk(dir, out) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((ent) => {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.name === 'index.json') out.push(p);
  });
  return out;
}

const files = walk(APK, []);
let splitCount = 0;
let skipped = 0;

files.forEach((file) => {
  const dir = path.dirname(file);
  const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(rows)) {
    console.warn(`跳过（非数组）：${file}`);
    skipped += 1;
    return;
  }
  const total = rows.length;
  const parts = Math.max(0, Math.ceil((total - STEP) / STEP));
  const head = { total, step: STEP, parts, items: rows.slice(0, STEP) };
  fs.writeFileSync(path.join(dir, 'head.json'), JSON.stringify(head));
  for (let i = 0; i < parts; i += 1) {
    const from = STEP + i * STEP;
    fs.writeFileSync(
      path.join(dir, `part-${i + 1}.json`),
      JSON.stringify(rows.slice(from, from + STEP))
    );
  }
  splitCount += 1;
  console.log(`${path.relative(APK, dir)}: ${total} 条 → head(${Math.min(STEP, total)}) + ${parts} part`);
});

console.log(`完成：拆分 ${splitCount} 个栏目，跳过 ${skipped} 个。`);
