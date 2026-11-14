// 分享面板：分享卡片海报（题图 + 页面内容摘要 + 二维码）+ 保存相册，纯前端实现。
//
// 卡片二维码：本地编码绘制（qrcode.js），内容为页内路径文本（零配置、零第三方依赖，
// 扫码可读「这是哪个页面」）；好友直达分享走「转寄好友」的微信原生卡片，不依赖二维码。
//
// 页面接入约定：
//   1. data 里初始化 share: { open: false }
//   2. 页面提供 sharePayload()，返回 { kicker, title, desc, img, path }
//      img 为海报题图（本地图 /assets/... 或远端图 URL 均可）
//   3. Page 方法 openShare/closeShare/saveQr 各一行委托本模块
const qrcode = require('./qrcode.js');
const solarlunar = require('./solarlunar.js');
const hd = require('./historyData.js');
const wxacode = require('./wxacode.js');

// 兜底固定图（canvas 绘制失败/导出失败时展示与保存，tools/gen_share_fallback.py 生成）
const FALLBACK_IMG = '/assets/share-fallback.jpg';
// 题图兜底：当前页相关图全链路取不到时的卷首画
const FALLBACK_COVER = '/assets/share-cover-fallback.jpg';

// 海报 canvas 尺寸（px，与 app.wxss .ss-canvas 一致；面板内显示+保存导出同源）
const CANVAS_ID = 'ssQrCanvas';
const W = 260;
const H = 424;
const CODE_SIZE = 54; // 二维码边长
const INK = '#1F1D19';

// 每日名句：日期做种子从人物引文库确定性抽取（同一天全用户同一句，隔天自动换）
function dailyQuote(now) {
  const d = now || new Date();
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  const pool = [];
  (hd.get().persons || []).forEach((p) => {
    if (typeof p.quote === 'string' && p.quote.length >= 4) pool.push(p);
  });
  if (!pool.length) return null;
  const pick = pool[seed % pool.length];
  return { quote: pick.quote, source: pick.quoteSource || '' };
}

// 农历日期文本：「农历丙午年 十月初六」
function lunarText(now) {
  const d = now || new Date();
  const r = solarlunar.solar2lunar(d.getFullYear(), d.getMonth() + 1, d.getDate());
  if (!r || !r.monthCn) return '';
  return `农历${r.gzYear}年 ${r.monthCn}${r.dayCn}`;
}

// 公历日期文本：「2026年11月14日」
function dateText(now) {
  const d = now || new Date();
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

// 二维码编码（typeNumber 0 = 自动版本；中文走 UTF-8 字节模式，纠错 M）
function encode(text) {
  const qr = qrcode(0, 'M');
  qr.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
  qr.addData(text, 'Byte');
  qr.make();
  return qr;
}

// 二维码文本：零依赖方案——编码页内路径文本，扫码可读「这是哪个页面」；
// 将来若公众平台配置「扫普通链接二维码打开小程序」，改回 https 链接即可扫码直达。
function qrTextOf(path) {
  return `阅史记：${path || '/pages/home/home'}`;
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

// 装载图片：统一走 getImageInfo 拿真实宽高（contain 展示需要；本地图/远端图都支持，
// 且 getImageInfo 不受 downloadFile 域名白名单限制，零配置）。失败回调 null。
function loadImg(src, cb) {
  if (!src) { cb(null); return; }
  if (typeof wx.getImageInfo !== 'function') {
    // 无 getImageInfo 环境：本地路径仍可直接画（drawCover 走估计尺寸）
    cb(src.indexOf('http') !== 0 ? src : null);
    return;
  }
  wx.getImageInfo({
    src,
    success: (res) => cb(res.path || null, res.width || 0, res.height || 0),
    fail: () => {
      // 远端失败彻底回退 null；本地路径失败也直画兜底（估计尺寸）
      cb(src.indexOf('http') !== 0 ? src : null);
    }
  });
}

function open(page) {
  const payload = (typeof page.sharePayload === 'function' && page.sharePayload()) || {};
  const path = payload.path || '/pages/home/home';
  const quote = dailyQuote();

  page.setData({
    share: {
      open: true,
      kicker: payload.kicker || '',
      title: payload.title || '阅史记',
      desc: payload.desc || '',
      img: payload.img || '',
      imgLocal: '',  // 题图本地路径（就绪后重画；空则画占位底）
      imgW: 0,       // 题图真实宽高（getImageInfo 返回，用于动态 cover 裁剪）
      imgH: 0,
      quote: quote ? quote.quote : '',
      quoteSource: quote ? quote.source : '',
      dateText: dateText(),
      lunarText: lunarText(),
      qrText: qrTextOf(path),
      codeImg: ''   // 太阳码图本地路径（jsDelivr 就绪后重画；空则画本地编码二维码）
    }
  });

  // canvas 由 wx:if 挂载，先画基础版（占位题图 + 内容 + 二维码），题图就绪后重画。
  // 远端题图失败时回退 imgFallback（本地朝代画），保证顶部始终是当前相关图。
  setTimeout(() => drawPoster(page), 120);

  // 太阳码（官方小程序码）：Actions 预生成走 jsDelivr，扫码直达当前页；
  // 主域名失败换备用域名重试一次，仍未取到则保持本地编码二维码兜底。
  const codeUrl = wxacode.codeUrlOf(path);
  if (codeUrl) {
    loadImg(codeUrl, (img) => {
      if (page.data.share.open && img) {
        page.setData({ 'share.codeImg': img });
        drawPoster(page);
        return;
      }
      const alt = wxacode.altCodeUrl(codeUrl);
      if (alt) {
        loadImg(alt, (img2) => {
          if (page.data.share.open && img2) {
            page.setData({ 'share.codeImg': img2 });
            drawPoster(page);
          }
        });
      }
    });
  }
  if (payload.img) {
    loadImg(payload.img, (local, w, h) => {
      if (page.data.share.open && local) {
        page.setData({ 'share.imgLocal': local, 'share.imgW': w || 0, 'share.imgH': h || 0 });
        drawPoster(page);
        return;
      }
      if (payload.imgFallback) {
        loadImg(payload.imgFallback, (local2, w2, h2) => {
          if (page.data.share.open && local2) {
            page.setData({ 'share.imgLocal': local2, 'share.imgW': w2 || 0, 'share.imgH': h2 || 0 });
            drawPoster(page);
          }
        });
      }
    });
  }
}

function close(page) {
  page.setData({ 'share.open': false });
}

// 海报：宣纸笺风——宣纸底 + 界格朱砂线 + 装裱题图 + 楷体名句 + 码/日期落款 + 「史载」朱砂印
// 圆角矩形（旧 canvas 无 arcTo，用 quadraticCurveTo 模拟）
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawPoster(page) {
  const share = page.data.share;
  if (!share || !share.open) return;
  if (typeof wx.createCanvasContext !== 'function') return; // 无 canvas 环境静默跳过

  try {
    const ctx = wx.createCanvasContext(CANVAS_ID);

    // 立轴挂画形态：天杆 / 地杆（深木色横杆）+ 左右绫边（暗褐绢色 + 内金线）+ 宣纸卷面
    const drawBar = (y, h) => {
      ctx.setFillStyle('#2E2820');
      ctx.fillRect(0, y, W, h);
      ctx.setFillStyle('rgba(246, 241, 234, 0.20)');
      ctx.fillRect(0, y + 1, W, 1);
      ctx.setFillStyle('rgba(0, 0, 0, 0.30)');
      ctx.fillRect(0, y + h - 2, W, 2);
    };
    drawBar(0, 12);
    drawBar(H - 12, 12);
    // 地杆两端轴头（立轴地杆出头）
    ctx.setFillStyle('#1B1712');
    ctx.beginPath();
    ctx.arc(3, H - 6, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(W - 3, H - 6, 5, 0, Math.PI * 2);
    ctx.fill();

    // 左右绫边 + 内金线
    const RIB = 12;
    ctx.setFillStyle('#463C30');
    ctx.fillRect(0, 12, RIB, H - 24);
    ctx.fillRect(W - RIB, 12, RIB, H - 24);
    ctx.setFillStyle('rgba(190, 150, 90, 0.35)');
    ctx.fillRect(RIB - 1, 12, 1, H - 24);
    ctx.fillRect(W - RIB, 12, 1, H - 24);

    // 宣纸卷面
    ctx.setFillStyle('#F6F1EA');
    ctx.fillRect(RIB, 12, W - RIB * 2, H - 24);

    // 卷面右缘竖排「阅史记」淡墨透背字（宣纸透背书法质感）
    ctx.setTextAlign('center');
    ctx.setFillStyle('rgba(31, 29, 25, 0.055)');
    ctx.font = '16px "Kaiti SC", "STKaiti", "KaiTi", serif';
    '阅史记'.split('').forEach((ch, i) => ctx.fillText(ch, W - RIB - 12, 178 + i * 21));
    ctx.font = '';

    // 卷首画：当前页相关图**完整展示不裁切**（contain），底部虚化渐隐融入卷面
    // （远端图加载失败回退 share.imgFallback 本地朝代画，再失败画预置卷首兜底图）
    const dx = RIB + 14, dy = 22, dw = W - RIB * 2 - 28, dh = 108;
    const drawCover = (src) => {
      const iw = share.imgW || (/\/data\/img\//.test(src) ? 360 : 0);
      const ih = share.imgH || (/\/data\/img\//.test(src) ? 360 : 0);
      if (iw > 0 && ih > 0) {
        const scale = Math.min(dw / iw, dh / ih);
        const dw2 = Math.round(iw * scale);
        const dh2 = Math.round(ih * scale);
        ctx.drawImage(src, Math.round(dx + (dw - dw2) / 2), Math.round(dy + (dh - dh2) / 2), dw2, dh2);
      } else {
        ctx.drawImage(src, dx, dy, dw, dh);
      }
    };
    if (share.imgLocal) {
      drawCover(share.imgLocal);
    } else {
      // 全链路（远端 + imgFallback）都未取到时，画预置卷首兜底图（tools/gen_share_fallback.py 生成）
      ctx.drawImage(FALLBACK_COVER, dx, dy, dw, dh);
    }
    // 题图底部虚化渐隐：逐行覆盖宣纸色（alpha 0→0.95），人物完整不裁切且下缘融入卷面
    const fadeY = dy + dh - 24;
    for (let i = 0; i < 24; i += 1) {
      ctx.setFillStyle('rgba(246, 241, 234, ' + ((i / 24) * 0.95).toFixed(3) + ')');
      ctx.fillRect(dx, fadeY + i, dw, 1);
    }

    // kicker（朱砂小字）
    ctx.setTextAlign('center');
    ctx.setFillStyle('#A34A3E');
    ctx.setFontSize(10);
    ctx.fillText(share.kicker, W / 2, 164);

    // 标题（宋体大字，最多一行）
    ctx.setFillStyle(INK);
    ctx.font = 'bold 19px "Songti SC", "STSong", "SimSun", serif';
    ctx.fillText(clipText(share.title, 19, 208, true), W / 2, 190);
    ctx.font = '';

    // 摘要（淡墨，最多两行）
    ctx.setFillStyle('#5F5A52');
    ctx.setFontSize(11);
    const rows = wrapText(share.desc, 11, 196, 2);
    rows.forEach((row, i) => ctx.fillText(row, W / 2, 212 + i * 17));

    // 淡墨分隔细线
    ctx.setFillStyle('rgba(70, 58, 45, 0.14)');
    ctx.fillRect(36, 248, W - 72, 1);

    // 每日名句（楷体，最多两行）+ 出处
    if (share.quote) {
      ctx.setFillStyle('#3B3731');
      ctx.font = '12px "Kaiti SC", "STKaiti", "KaiTi", serif';
      const qrows = wrapText(share.quote, 12, 196, 2);
      qrows.forEach((row, i) => ctx.fillText(row, W / 2, 266 + i * 19));
      ctx.font = '';
      ctx.setFillStyle('#8C857A');
      ctx.setFontSize(9);
      ctx.fillText(share.quoteSource ? `—— ${share.quoteSource}` : '', W / 2, 266 + (qrows.length - 1) * 19 + 16);
    }

    // 淡墨分隔细线
    ctx.setFillStyle('rgba(70, 58, 45, 0.10)');
    ctx.fillRect(36, 316, W - 72, 1);

    // 落款区：太阳码/二维码（左）+ 公历/农历日期（中）+「史载」朱砂印（右）
    const cy = 330;
    const cx = 24;
    if (share.codeImg) {
      // 官方小程序码（圆形白底）就绪：直接绘制，微信扫一扫直达当前页
      ctx.drawImage(share.codeImg, cx, cy, CODE_SIZE, CODE_SIZE);
    } else {
      // 本地编码兜底：零依赖普通二维码，内容为页内路径文本
      try {
        const qr = encode(share.qrText);
        const count = qr.getModuleCount();
        const m = 4;
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
    }

    ctx.setTextAlign('left');
    ctx.setFillStyle(INK);
    ctx.setFontSize(11);
    ctx.fillText(share.dateText || '', 90, cy + 22);
    ctx.setFillStyle('#8C857A');
    ctx.setFontSize(10);
    ctx.fillText(share.lunarText || '', 90, cy + 42);

    // 「史载」朱砂印（assets/seal.png，114×197 竖长按比例）
    const sealH = 52;
    const sealW = Math.round(sealH * 114 / 197);
    ctx.drawImage('/assets/seal.png', W - RIB - 14 - sealW, cy - 2, sealW, sealH);

    // 品牌行
    ctx.setTextAlign('center');
    ctx.setFillStyle('#8C857A');
    ctx.setFontSize(10);
    ctx.fillText('阅史记 · 一页一页读历史', W / 2, H - 24);

    ctx.draw();
  } catch (e) {
    console.error('qrshare drawPoster:', e);
    // 绘制异常降级：面板切预置静态卡片图（保持完整视觉，见 tools/gen_share_fallback.py）
    if (page && page.setData) page.setData({ 'share.fallback': true });
    if (wx.showToast) wx.showToast({ title: '已切换备用卡片', icon: 'none' });
  }
}

// 写入相册（授权被拒则引导去设置，回来自动重试一次）
function writeAlbum(filePath) {
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
}

// 导出海报 → 保存到相册；导出失败或 canvas 已降级时，改保存预置兜底图
function save(page) {
  const share = page.data.share;
  if (!share || !share.open) return;
  if (share.fallback || typeof wx.canvasToTempFilePath !== 'function') {
    saveFallback(page);
    return;
  }

  wx.canvasToTempFilePath({
    canvasId: CANVAS_ID,
    destWidth: W * 3, // 3 倍分辨率导出，避免保存图发虚
    destHeight: H * 3,
    success: (res) => writeAlbum(res.tempFilePath),
    fail: () => saveFallback(page)
  });
}

// 兜底保存：把包内静态卡片图（FALLBACK_IMG）经用户目录转存到相册。
// saveImageToPhotosAlbum 不接受代码包路径，须用 FileSystemManager 中转。
function saveFallback(page) {
  if (typeof wx.getFileSystemManager !== 'function' || !wx.env || !wx.env.USER_DATA_PATH) {
    wx.showToast({ title: '暂不支持保存备用卡片', icon: 'none' });
    return;
  }
  const fsm = wx.getFileSystemManager();
  const dst = `${wx.env.USER_DATA_PATH}/share-fallback.jpg`;
  // 代码包路径各版本对前导 / 行为不一，两级尝试
  const tryPaths = [FALLBACK_IMG, FALLBACK_IMG.replace(/^\//, '')];

  (function attempt(i) {
    fsm.readFile({
      filePath: tryPaths[i],
      success: (res) => {
        fsm.writeFile({
          filePath: dst,
          data: res.data,
          success: () => writeAlbum(dst),
          fail: () => wx.showToast({ title: '保存失败', icon: 'none' })
        });
      },
      fail: () => {
        if (i + 1 < tryPaths.length) attempt(i + 1);
        else wx.showToast({ title: '备用卡片不可用', icon: 'none' });
      }
    });
  })(0);
}

module.exports = {
  open, close, save, saveFallback, drawPoster, encode, qrTextOf, loadImg,
  dailyQuote, lunarText, dateText,
  FALLBACK_IMG, CANVAS_ID, CANVAS_SIZE: W, CANVAS_HEIGHT: H
};
