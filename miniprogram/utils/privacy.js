const feedback = require('./feedback.js');
// 隐私同意状态以微信为准；不使用本地 storage 代替平台授权。
const BUTTON_ID = 'privacy-agree-button';
const DEFAULT_CONTRACT = '《阅史记小程序用户隐私保护指引》';
let initialized = false;
let active = null;
let checked = false;
let revision = 0;
let contractName = DEFAULT_CONTRACT;
let pending = [];

function show() {
  if (active) active.setData({ visible: true, contractName });
}

function init() {
  if (initialized) return;
  // 只用接口存在性判断：canIUse 的数据文件随基础库更新，新版 open-type 可能被漏报，
  // 若据此 return 会让 initialized 永远为 false、整条自定义弹窗链路静默失效。
  // getPrivacySetting 与 button.open-type=agreePrivacyAuthorization 同为 2.32.3 起支持，
  // 故只要前者存在，原生同意按钮即可用。
  if (typeof wx.onNeedPrivacyAuthorization !== 'function' ||
      typeof wx.getPrivacySetting !== 'function') return;
  initialized = true;
  // 该监听为覆盖式注册，整个应用只注册一次，避免 tab 常驻页面抢占回调。
  wx.onNeedPrivacyAuthorization((resolve) => {
    if (!active) {
      resolve({ event: 'disagree' });
      return;
    }
    pending.push(resolve);
    checked = true;
    show();
    resolve({ event: 'exposureAuthorization' });
  });
}

function activate(view) {
  init();
  if (active && active !== view) settle(active, false);
  active = view;
  if (!initialized || checked) return;
  checked = true;
  const version = revision;
  wx.getPrivacySetting({
    success(res) {
      contractName = res.privacyContractName || DEFAULT_CONTRACT;
      if (revision !== version) return;
      // needAuthorization=false 有两种可能：已同意，或后台尚未声明隐私收集类型
      // （官方文档：未声明 → false）。真机不弹框时据此判断是声明缺失还是已同意。
      if (typeof console !== 'undefined') {
        console.log('[privacy] needAuthorization=' + res.needAuthorization + ' contract=' + contractName);
      }
      if (res.needAuthorization) show();
    },
    // 查询失败时仍允许普通阅读；敏感操作由微信隐私接口再次核验。
    fail(err) {
      if (typeof console !== 'undefined') {
        console.warn('[privacy] getPrivacySetting 失败', err && err.errMsg);
      }
    }
  });
}

function settle(view, agree) {
  if (view !== active || (!view.data.visible && !pending.length)) return;
  revision += 1;
  const callbacks = pending;
  pending = [];
  // 必须在按钮仍挂载时 resolve，且同意仅由原生授权按钮事件调用。
  callbacks.forEach((resolve) => {
    resolve(agree ? { event: 'agree', buttonId: BUTTON_ID } : { event: 'disagree' });
  });
  view.setData({ visible: false });
}

function detach(view) {
  if (active !== view) return;
  settle(view, false);
  active = null;
}

function openContract() {
  const host = feedback.current();
  if (typeof wx.openPrivacyContract !== 'function') {
    feedback.toast({ title: '请升级微信后查看隐私指引', icon: 'none' }, host);
    return;
  }
  wx.openPrivacyContract({
    fail() { feedback.toast({ title: '隐私指引暂不可用，请稍后重试', icon: 'none' }, host); }
  });
}

function authorize(onAgree, host = feedback.current()) {
  if (typeof wx.requirePrivacyAuthorize !== 'function') {
    // 老基础库由原有相册权限流程处理，不伪造微信隐私同意状态。
    onAgree();
    return;
  }
  wx.requirePrivacyAuthorize({
    success: onAgree,
    fail(err) {
      const msg = (err && err.errMsg) || '';
      const unavailable = (err && err.errno === 112) || /not declared|banned/.test(msg);
      feedback.toast({
        title: unavailable ? '暂无法保存，请稍后重试' : '已取消保存，可继续阅读',
        icon: 'none'
      }, host);
    }
  });
}

module.exports = { init, activate, settle, detach, openContract, authorize, BUTTON_ID, DEFAULT_CONTRACT };
