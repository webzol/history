// 生成 data/history.json（jsDelivr 远端数据源）
// 用法：node tools/build_data_json.js
// 流程：require 本地 history.js 种子 → JSON 序列化 → data/history.json
//       （project.config.json packOptions 已忽略该文件，不进小程序包）

'use strict';

const fs = require('fs');
const path = require('path');

const seed = require(path.join(__dirname, '..', 'miniprogram', 'data', 'history.js'));
const out = path.join(__dirname, '..', 'miniprogram', 'data', 'history.json');

fs.writeFileSync(out, JSON.stringify(seed), 'utf8');
console.log(`OK data/history.json ${(fs.statSync(out).size / 1024).toFixed(1)}KB（已生成，随仓库提交供 jsDelivr 出数据）`);
