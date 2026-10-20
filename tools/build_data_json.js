// 生成 data/history.json（jsDelivr 远端数据源）
// 用法：node tools/build_data_json.js
// 流程：require 本地 history.js 种子 → JSON 序列化 → data/history.json
//       （project.config.json packOptions 已忽略该文件，不进小程序包）

'use strict';

const fs = require('fs');
const path = require('path');

const seed = require(path.join(__dirname, '..', 'miniprogram', 'data', 'history.js'));
const out = path.join(__dirname, '..', 'miniprogram', 'data', 'history.json');

// 版本戳：远端载荷带构建时间，供「检查内容更新」展示
const now = new Date();
const pad = (n) => ('' + n).padStart(2, '0');
const builtAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

const payload = { ...seed, meta: { builtAt } };

fs.writeFileSync(out, JSON.stringify(payload), 'utf8');
console.log(`OK data/history.json ${(fs.statSync(out).size / 1024).toFixed(1)}KB builtAt=${builtAt}（已生成，随仓库提交供 jsDelivr 出数据）`);
