// 分享面板：分享卡片海报（题图 + 页面内容摘要 + 二维码）+ 保存相册，纯前端实现。
//
// 卡片二维码：本地编码绘制（qrcode.js），内容为页面 https 链接。将来若在小程序
// 公众平台配置「扫普通链接二维码打开小程序」（需已备案域名），把 QR_BASE 换成
// 该域名即可扫码直达；好友直达分享始终走「转寄好友」的微信原生卡片。
//
// 页面接入约定：
//   1. data 里初始化 share: { open: false }
//   2. 页面提供 sharePayload()，返回 { kicker, title, desc, img, path }
//      img 为海报题图（本地图 /assets/... 或远端图 URL 均可）
//   3. Page 方法 openShare/closeShare/saveQr 各一行委托本模块
const qrcode = require('./qrcode.js');

// 普通二维码兜底域名：待配置——公众平台「扫普通链接二维码打开小程序」绑定已备案域名后替换
const QR_BASE = 'https://yueshiji.cn';

// 海报 canvas 尺寸（px，与 app.wxss .ss-canvas 一致；面板内显示+保存导出同源）
const CANVAS_ID = 'ssQrCanvas';
const W = 260;
const H = 372;
const IMG_H = 150; // 题图高度
const CODE_SIZE = 66; // 二维码边长
const INK = '#1F1D19';

// 二维码编码（typeNumber 0 = 自动版本；中文走 UTF-8 字节模式，纠错 M）
function encode(text) {
  const qr = qrcode(0, 'M');
  qr.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
  qr.addData(text, 'Byte');
  qr.make();
  return qr;
}

// 二维码文本（页面 https 链接）
function qrTextOf(path) {
  return QR_BASE + (path || '/pages/home/home');
}

// 中英文混排宽度估算（旧 canvas 无 measureText）
function charW(ch, size) {
  return /[\u2E80-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF\u3000-\u303F]/.test(ch) ? size : size * 0.56;
}

// 截断到 maxW 宽；ellipsis=true 时末尾加省略号
function clipText(s, size, maxW, ellipsis) {
  let w = 0;
  for (let i = 0; i < s.length; i += 1) {
    const cw = charW(s[i], size);
    if (w + cw > maxW) return ellipsis ? s.slice(0, i) + '…' : s.slice(0, i);
    w += cw;
  }
  return s;
}

// 按宽折行（最多 lines 行，末行截断加省略号）
function wrapText(s, size, maxW, lines) {
  const rows = [];
  let rest = String(s || '');
  for (let i = 0; i < lines && rest; i += 1) {
    const last = i === lines - 1;
    const row = clipText(rest, size, maxW, last);
    rows.push(row);
    rest = row.slice(-1) === '…' ? '' : rest.slice(row.length);
  }
  return rows;
}

// 装载图片：本地路径原样回调；远端 URL 走 downloadFile（需在 downloadFile 合法域名加
// gcore.jsdelivr.net）。失败回调 null，由调用方决定降级画法。
function loadImg(src, cb) {
  if (!src || typeof wx.downloadFile !== 'function') { cb(null); return; }
  if (src.indexOf('http') !== 0) { cb(src); return; }
  wx.downloadFile({
    url: src,
    success: (res) => cb(res.statusCode === 200 ? res.tempFilePath : null),
    fail: () => cb(null)
  });
}

function open(page) {
  const payload = (typeof page.sharePayload === 'function' && page.sharePayload()) || {};
  const path = payload.path || '/pages/home/home';

  page.setData({
    share: {
      open: true,
      kicker: payload.kicker || '',
      title: payload.title || '阅史记',
      desc: payload.desc || '',
      img: payload.img || '',
      imgLocal: '',  // 题图本地路径（就绪后重画；空则画占位底）
      qrText: qrTextOf(path)
    }
  });

  // canvas 由 wx:if 挂载，先画基础版（占位题图 + 内容 + 二维码），题图就绪后重画
  setTimeout(() => drawPoster(page), 120);
  if (payload.img) {
    loadImg(payload.img, (local) => {
      if (page.data.share.open) {
        page.setData({ 'share.imgLocal': local || '' });
        drawPoster(page);
      }
    });
  }
}

function close(page) {
  page.setData({ 'share.open': false });
}

// 海报：题图（cover 裁切）+ kicker + 标题 + 摘要 + 二维码 + 品牌行
function drawPoster(page) {
  const share = page.data.share;
  if (!share || !share.open) return;
  if (typeof wx.createCanvasContext !== 'function') return; // 无 canvas 环境静默跳过

  try {
    const ctx = wx.createCanvasContext(CANVAS_ID);

    // 底
    ctx.setFillStyle('#FFFFFF');
    ctx.fillRect(0, 0, W, H);

    // 题图：远端专属图按 360×360 裁中带（避免拉伸变形），其余直接铺
    const drawCover = (src) => {
      if (/\/data\/img\//.test(src)) {
        ctx.drawImage(src, 0, 77, 360, 208, 0, 0, W, IMG_H);
      } else {
        ctx.drawImage(src, 0, 0, W, IMG_H);
      }
    };
    if (share.imgLocal) {
      drawCover(share.imgLocal);
    } else {
      ctx.setFillStyle('#EFE9DD');
      ctx.fillRect(0, 0, W, IMG_H);
      ctx.setFillStyle('#B9AE9E');
      ctx.setFontSize(13);
      ctx.setTextAlign('center');
      ctx.fillText('阅史记', W / 2, IMG_H / 2 + 5);
    }

    // kicker（朱砂小字）
    ctx.setTextAlign('center');
    ctx.setFillStyle('#A34A3E');
    ctx.setFontSize(10);
    ctx.fillText(share.kicker, W / 2, IMG_H + 24);

    // 标题（宋体大字，最多一行）
    ctx.setFillStyle(INK);
    ctx.setFontSize(19);
    ctx.fillText(clipText(share.title, 19, W - 48, true), W / 2, IMG_H + 50);

    // 摘要（淡墨，最多两行）
    ctx.setFillStyle('#5F5A52');
    ctx.setFontSize(11);
    const rows = wrapText(share.desc, 11, W - 56, 2);
    rows.forEach((row, i) => ctx.fillText(row, W / 2, IMG_H + 74 + i * 17));

    // 分隔细线
    ctx.setFillStyle('rgba(70, 58, 45, 0.14)');
    ctx.fillRect(40, IMG_H + 110, W - 80, 1);

    // 二维码（本地编码绘制）
    try {
      const qr = encode(share.qrText);
      const count = qr.getModuleCount();
      const cx = Math.round((W - CODE_SIZE) / 2);
      const cy = IMG_H + 124;
      const m = 5;
      const cell = Math.floor((CODE_SIZE - m * 2) / count);
      const off = Math.round((CODE_SIZE - cell * count) / 2);
      ctx.setFillStyle(INK);
      for (let r = 0; r < count; r += 1) {
        for (let c = 0; c < count; c += 1) {
          if (qr.isDark(r, c)) {
            ctx.fillRect(cx + off + c * cell, cy + off + r * cell, cell + 0.3, cell + 0.3);
          }
        }
      }
    } catch (e) { /* 码文本异常时留白 */ }

    // 品牌行
    ctx.setFillStyle('#8C857A');
    ctx.setFontSize(10);
    ctx.fillText('阅史记 · 一页一页读历史', W / 2, IMG_H + 124 + CODE_SIZE + 20);

    ctx.draw();
  } catch (e) {
    if (wx.showToast) wx.showToast({ title: '海报绘制失败', icon: 'none' });
  }
}

// 导出海报 → 保存到相册（授权被拒则引导去设置，回来自动重试一次）
function save(page) {
  const share = page.data.share;
  if (!share || !share.open) return;
  if (typeof wx.canvasToTempFilePath !== 'function') return;

  const writeAlbum = (filePath) => {
    wx.saveImageToPhotosAlbum({
      filePath,
      success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }),
      fail: (err) => {
        const msg = (err && err.errMsg) || '';
        if (msg.indexOf('auth') < 0 && msg.indexOf('deny') < 0) {
          wx.showToast({ title: '保存失败', icon: 'none' });
          return;
        }
        wx.showModal({
          title: '需要相册权限',
          content: '请在设置中允许「保存到相册」',
          confirmText: '去设置',
          success: (res) => {
            if (!res.confirm || typeof wx.openSetting !== 'function') return;
            wx.openSetting({
              success: (setting) => {
                if (setting && setting.authSetting && setting.authSetting['scope.writePhotosAlbum']) {
                  writeAlbum(filePath);
                }
              }
            });
          }
        });
      }
    });
  };

  wx.canvasToTempFilePath({
    canvasId: CANVAS_ID,
    destWidth: W * 3, // 3 倍分辨率导出，避免保存图发虚
    destHeight: H * 3,
    success: (res) => writeAlbum(res.tempFilePath),
    fail: () => wx.showToast({ title: '海报导出失败', icon: 'none' })
  });
}

module.exports = {
  open, close, save, drawPoster, encode, qrTextOf, loadImg,
  QR_BASE, CANVAS_ID, CANVAS_SIZE: W, CANVAS_HEIGHT: H
};
