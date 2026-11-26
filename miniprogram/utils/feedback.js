const store = require('./store.js');
const EMPTY = { kind: '', title: '', content: '', confirmText: '', cancelText: '', icon: '' };
let active = null;

function activate(view) {
  if (active && active !== view) deactivate(active);
  active = view;
}

function clearPending(view) {
  clearTimeout(view.feedbackTimer);
  view.feedbackTimer = null;
  view.feedbackCallback = null;
}

function reset(view) {
  clearPending(view);
  if (view.data.notice.kind) view.setData({ notice: EMPTY });
}

function deactivate(view, detached = false) {
  if (active !== view) return;
  active = null;
  if (detached) clearPending(view);
  else reset(view);
}

function present(kind, options, view) {
  if (view !== active) return;
  if (!view) {
    const native = { modal: 'showModal', toast: 'showToast', loading: 'showLoading' }[kind];
    if (typeof wx[native] === 'function') wx[native](options);
    return;
  }
  if (view.data.notice.kind === 'modal' && kind !== 'modal') return;
  clearPending(view);
  view.feedbackCallback = kind === 'modal' ? options.success : null;
  view.setData({
    notice: {
      kind,
      title: options.title,
      content: options.content || '',
      confirmText: options.confirmText || '确定',
      cancelText: options.showCancel === false ? '' : options.cancelText || '取消',
      icon: options.icon === 'success' ? 'success' : ''
    },
    fontClass: store.getFontKey()
  });
  if (kind === 'toast') view.feedbackTimer = setTimeout(() => reset(view), options.duration || 1800);
}

function dismiss(view, confirm) {
  if (view !== active || view.data.notice.kind !== 'modal') return;
  const callback = view.feedbackCallback;
  reset(view);
  if (typeof callback === 'function') callback({ confirm, cancel: !confirm });
}

function toast(options, view = active) { present('toast', options, view); }
function modal(options, view = active) { present('modal', options, view); }
function loading(options, view = active) { present('loading', options, view); }
function hideLoading(view = active) {
  if (view !== active) return;
  if (view && view.data.notice.kind === 'loading') reset(view);
  if (!view && typeof wx.hideLoading === 'function') wx.hideLoading();
}

module.exports = { EMPTY, activate, deactivate, dismiss, current: () => active, toast, modal, loading, hideLoading };
