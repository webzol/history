// 预览准备：把小程序源码（JS/WXML/WXSS）打包进 ui/preview/_bundle.js
// 供 ui/preview/index.html + harness.js 在浏览器里以真实代码渲染与交互。
// 用法：node tools/build_preview.js

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'miniprogram');
const OUT = path.join(__dirname, '..', 'ui', 'preview');

const PAGES = ['home', 'timeline', 'discover', 'profile', 'event', 'person', 'period', 'search'];
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

  function wrapJs(modPath, source) {
    const isEntry = /^pages\/[\w-]+\/[\w-]+\.js$/.test(modPath) || modPath === 'app.js';
    let code = source;
    if (isEntry) {
      // Page(/App( 各文件仅一处调用（已核实）；把模块路径绑进配置便于浏览器端注册
      code = code.replace(/\b(Page|App)\(\s*\{/, (m, kind) => `${kind}('project://${modPath}', {`);
    }
    return `__register('/${modPath}', function (require, module, exports) {\n${code}\n});`;
  }

const parts = [];

parts.push('// 自动生成：node tools/build_preview.js（勿手改）');
parts.push('(function () {');
parts.push('  var MOD = window.__SRC = {};');
parts.push('  function __register(p, f) { MOD[p] = f; }');
parts.push('');

// app + data + utils
parts.push(wrapJs('app.js', read('app.js')));
parts.push(wrapJs('data/history.js', read('data/history.js')));
parts.push(wrapJs('utils/store.js', read('utils/store.js')));
parts.push(wrapJs('utils/historyData.js', read('utils/historyData.js')));
parts.push(wrapJs('utils/remote.js', read('utils/remote.js')));
parts.push(wrapJs('utils/api.js', read('utils/api.js')));
parts.push(wrapJs('utils/eraImages.js', read('utils/eraImages.js')));
parts.push('');

  const stringMod = (modPath, text) =>
    `__register('/${modPath}', function (require, module, exports) { module.exports = ${JSON.stringify(text)}; });`;

// pages
const pageBundle = {};
PAGES.forEach((name) => {
  const js = read(path.join('pages', name, `${name}.js`));
  const wxml = read(path.join('pages', name, `${name}.wxml`));
  const wxss = read(path.join('pages', name, `${name}.wxss`));
  parts.push(wrapJs(`pages/${name}/${name}.js`, js));
  parts.push(stringMod(`pages/${name}/${name}.wxml`, wxml));
  parts.push(stringMod(`pages/${name}/${name}.wxss`, wxss));
  pageBundle[name] = true;
});
parts.push('');

parts.push(stringMod('styles/app.wxss', read('app.wxss')));

parts.push('})();');

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, '_bundle.js'), parts.join('\n'), 'utf8');
console.log(`OK ui/preview/_bundle.js （${PAGES.length} 页 + app + data + utils 已打包）`);
