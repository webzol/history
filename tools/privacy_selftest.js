// 隐私授权行为回归：运行真实协调模块/组件，模拟微信记录及异步回调。
// node tools/privacy_selftest.js
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..', 'miniprogram');
let count = 0;
function test(name, fn) {
  fn();
  count += 1;
  console.log('OK ' + name);
}

function environment(options = {}) {
  const calls = { listener: 0, settings: [], toast: [], contract: 0, auth: [] };
  const wx = {
    onNeedPrivacyAuthorization(fn) { calls.listener += 1; calls.listenerFn = fn; },
    getPrivacySetting(o) { calls.settings.push(o); },
    openPrivacyContract(o) { calls.contract += 1; calls.contractOptions = o; },
    requirePrivacyAuthorize(o) { calls.auth.push(o); },
    showToast(o) { calls.toast.push(o); }
  };
  // 模拟仅装有一半隐私接口的畸形基础库：getPrivacySetting 存在、onNeedPrivacy 缺失。
  if (options.noListener) delete wx.onNeedPrivacyAuthorization;
  if (options.noSetting) delete wx.getPrivacySetting;
  const mod = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'utils/privacy.js'), 'utf8'), { wx, module: mod });
  const privacy = mod.exports;
  let cfg;
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'components/privacy-popup/index.js'), 'utf8'), {
    Component(o) { cfg = o; },
    require(p) {
      if (p.endsWith('privacy.js')) return privacy;
      return { apply(view) { view.setData({ fontClass: options.font || 'm' }); } };
    }
  });
  function view() {
    const v = {
      data: JSON.parse(JSON.stringify(cfg.data)),
      setData(patch) { Object.assign(this.data, patch); },
      show() { cfg.pageLifetimes.show.call(this); },
      detach() { cfg.lifetimes.detached.call(this); }
    };
    Object.assign(v, cfg.methods);
    return v;
  }
  function setting(needAuthorization, privacyContractName) {
    calls.settings.at(-1).success({ needAuthorization, privacyContractName });
  }
  function request() {
    const events = [];
    calls.listenerFn((res) => {
      // 原生按钮需留在树中，平台才能验证此次同意来自用户点击。
      if (res.event === 'agree' && activeTestView) assert.equal(activeTestView.data.visible, true);
      events.push({ ...res });
    });
    return events;
  }
  let activeTestView;
  return { wx, calls, privacy, view, setting, request, track(v) { activeTestView = v; } };
}

test('首次进入由微信状态决定是否提示，使用正式协议名称', () => {
  const e = environment({ font: 'xl' });
  const v = e.view();
  v.show();
  e.setting(true, '《正式指引》');
  assert.equal(v.data.visible, true);
  assert.equal(v.data.contractName, '《正式指引》');
  assert.equal(v.data.fontClass, 'xl');
  e.privacy.init();
  assert.equal(e.calls.listener, 1);
});

test('微信已同意或未声明隐私类型时不误弹，也不写本地同意标记', () => {
  const e = environment();
  const v = e.view();
  v.show();
  e.setting(false);
  assert.equal(v.data.visible, false);
  assert.equal(typeof e.wx.setStorageSync, 'undefined');
});

test('拒绝后普通阅读继续，同一会话换 tab 不反复弹窗', () => {
  const e = environment();
  const v = e.view();
  v.show();
  e.setting(true);
  v.onDecline();
  assert.equal(v.data.visible, false);
  const next = e.view();
  next.show();
  assert.equal(next.data.visible, false);
  assert.equal(e.calls.settings.length, 1);
});

test('拒绝后敏感操作再次征询，批量回调只结算一次', () => {
  const e = environment();
  const v = e.view();
  v.show();
  e.setting(true);
  v.onDecline();
  const a = e.request();
  const b = e.request();
  assert.equal(v.data.visible, true);
  assert.equal(a[0].event, 'exposureAuthorization');
  e.track(v);
  v.onAgree();
  assert.deepEqual(a.at(-1), { event: 'agree', buttonId: e.privacy.BUTTON_ID });
  assert.deepEqual(b.at(-1), { event: 'agree', buttonId: e.privacy.BUTTON_ID });
  assert.equal(v.data.visible, false);
  v.onAgree();
  assert.equal(a.length, 2);
});

test('保存前等待平台授权，取消时不执行相册写入', () => {
  const e = environment();
  let saved = 0;
  e.privacy.authorize(() => { saved += 1; });
  assert.equal(saved, 0);
  e.calls.auth[0].fail({ errMsg: 'privacy permission is not authorized' });
  assert.equal(saved, 0);
  assert.match(e.calls.toast.at(-1).title, /已取消保存/);
  e.privacy.authorize(() => { saved += 1; });
  e.calls.auth[1].success();
  assert.equal(saved, 1);
});

test('后台未声明/接口被禁用时不误导用户开启相册权限', () => {
  const e = environment();
  e.privacy.authorize(() => assert.fail('不应保存'));
  e.calls.auth[0].fail({ errno: 112, errMsg: 'api scope is not declared in the privacy agreement' });
  assert.match(e.calls.toast.at(-1).title, /暂无法保存/);
});

test('查看指引不会丢失待授权回调，返回后可继续同意', () => {
  const e = environment();
  const v = e.view();
  v.show();
  e.setting(true);
  const events = e.request();
  v.onOpenContract();
  v.show();
  assert.equal(e.calls.contract, 1);
  assert.equal(events.length, 1);
  e.track(v);
  v.onAgree();
  assert.equal(events.at(-1).event, 'agree');
});

test('切换页面或卸载时拒绝旧页 pending，隐藏页不抢占新页回调', () => {
  const e = environment();
  const a = e.view();
  a.show();
  e.setting(true);
  const old = e.request();
  const b = e.view();
  b.show();
  assert.equal(old.at(-1).event, 'disagree');
  const current = e.request();
  a.detach();
  a.onAgree();
  assert.equal(current.length, 1);
  b.detach();
  assert.equal(current.at(-1).event, 'disagree');
});

test('异步查询跟随当前页，旧查询不能在用户决定后再次弹窗', () => {
  const e = environment();
  const a = e.view();
  a.show();
  const b = e.view();
  b.show();
  e.setting(true);
  assert.equal(a.data.visible, false);
  assert.equal(b.data.visible, true);
  const delayed = environment();
  const v = delayed.view();
  v.show();
  delayed.request();
  v.onDecline();
  delayed.setting(true);
  assert.equal(v.data.visible, false);
});

test('查询/指引打开失败可恢复，缺少隐私接口时不注册监听', () => {
  const e = environment();
  const v = e.view();
  v.show();
  e.calls.settings[0].fail({});
  assert.equal(v.data.visible, false);
  e.request();
  assert.equal(v.data.visible, true);
  v.onOpenContract();
  e.calls.contractOptions.fail();
  assert.match(e.calls.toast.at(-1).title, /暂不可用/);
  // 缺 onNeedPrivacyAuthorization：自定义弹窗无法结算待授权接口，整条链路不启用
  const noListener = environment({ noListener: true });
  noListener.view().show();
  assert.equal(noListener.calls.listener, 0);
  assert.equal(noListener.calls.settings.length, 0);
  // 缺 getPrivacySetting：连查询能力都没有，同样不启用
  const noSetting = environment({ noSetting: true });
  noSetting.view().show();
  assert.equal(noSetting.calls.listener, 0);
  assert.equal(noSetting.calls.settings.length, 0);
});

test('不依赖 canIUse 判断同意按钮：接口在即注册监听', () => {
  // canIUse 数据文件可能漏报新版 open-type，据此 return 会静默禁用整条弹窗链路。
  const e = environment();
  e.wx.canIUse = () => false;
  const v = e.view();
  v.show();
  assert.equal(e.calls.listener, 1);
  assert.equal(e.calls.settings.length, 1);
  e.setting(true);
  assert.equal(v.data.visible, true);
});

test('无页面宿主时及时拒绝，不让敏感接口永久 pending', () => {
  const e = environment();
  e.privacy.init();
  assert.equal(e.request().at(-1).event, 'disagree');
});

test('真实海报保存链路：拒绝不写相册、不引导设置；同意后保存一次', () => {
  const e = environment();
  const v = e.view();
  v.show();
  e.setting(true);
  let saved = 0;
  e.wx.env = { USER_DATA_PATH: 'wxfile://test' };
  e.wx.getFileSystemManager = () => ({
    readFile(o) { o.success({ data: 'jpg' }); },
    writeFile(o) { o.success({}); }
  });
  e.wx.saveImageToPhotosAlbum = (o) => { saved += 1; o.success(); };
  e.wx.openSetting = () => assert.fail('隐私拒绝不应引导设置相册权限');
  e.wx.requirePrivacyAuthorize = (o) => {
    e.calls.listenerFn((res) => {
      if (res.event === 'agree') o.success();
      else if (res.event === 'disagree') o.fail({ errMsg: 'privacy permission is not authorized' });
    });
  };
  const previousWx = global.wx;
  global.wx = e.wx;
  try {
    const qrshare = require(path.join(ROOT, 'utils/qrshare.js'));
    qrshare.saveFallback({});
    assert.equal(saved, 0);
    v.onDecline();
    assert.equal(saved, 0);
    qrshare.saveFallback({});
    assert.equal(v.data.visible, true);
    v.onAgree();
    assert.equal(saved, 1);
  } finally {
    global.wx = previousWx;
  }
});

test('13 页均挂载组件；同意只能由微信原生事件触发', () => {
  const app = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8'));
  assert.equal(app.usingComponents['privacy-popup'], '/components/privacy-popup/index');
  for (const page of app.pages) {
    assert.match(fs.readFileSync(path.join(ROOT, page + '.wxml'), 'utf8'), /<privacy-popup>/);
  }
  const wxml = fs.readFileSync(path.join(ROOT, 'components/privacy-popup/index.wxml'), 'utf8');
  assert.match(wxml, /open-type="agreePrivacyAuthorization" bindagreeprivacyauthorization="onAgree"/);
  assert.doesNotMatch(wxml, /bindtap="onAgree"/);
  assert.match(wxml, /id="privacy-agree-button"/);
});

console.log(`PASS ${count} / FAIL 0`);
