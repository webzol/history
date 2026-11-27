const feedback = require('./feedback.js');
// 分享面板：分享卡片海报（宣纸纹理 + 立轴题图 + 页面内容摘要 + 每日名句落款）+ 保存相册，纯前端实现。
//
// 渲染架构（2026-11-14 高清化）：canvas 2d API（type="2d"），固定 4.5 倍缓冲（1170×1908，
// 与设备像素比无关）——所有绘制坐标按 260×424 逻辑尺寸书写，每帧重设 4.5 倍变换；
// 导出按缓冲原生分辨率，相册里 1170×1908 全高清。旧版 canvas 的缓冲尺寸随设备 dpr 浮动，
// 低像素比设备上 3 倍拉伸导出发虚，是本次迁移的直接原因。
// 每次重新查询节点，缓冲尺寸有变化时才重设。真机可复用同一块缓冲，预览可找到新挂载的节点。
//
// 海报统一使用 TD 提供的固定小程序码。好友直达仍由微信原生分享传入详情路由。
//
// 页面接入约定：
//   1. data 里初始化 share: { open: false }
//   2. 页面提供 sharePayload()，返回 { kicker, title, desc, img, path }
//      img 为海报题图（本地图 /assets/... 或远端图 URL 均可）
//   3. Page 方法 openShare/closeShare/saveQr 各一行委托本模块
const solarlunar = require('./solarlunar.js');
const hd = require('./historyData.js');

// 兜底固定图（canvas 绘制失败/导出失败时展示与保存，tools/gen_share_fallback.py 生成）
const FALLBACK_IMG = '/assets/share-fallback.jpg';
// 题图兜底：复用首页宫阙，离线也能显示画心。
const FALLBACK_COVER = '/assets/palace.jpg';
// 宣纸纹理：与全站页面同一张图（各页 <image class="paper-bg"> 同源同铺法），海报卷面直接绘入
const PAPER_BG = '/assets/paper-bg.jpg';
const SHARE_CODE = '/assets/share-wxacode.jpg';

// 海报逻辑尺寸（px，与 app.wxss .ss-canvas 一致）与高清倍率
const CANVAS_ID = 'ssQrCanvas';
const W = 260;
const H = 424;
const SCALE = 4.5;
const BW = Math.round(W * SCALE); // 缓冲 1170
const BH = Math.round(H * SCALE); // 缓冲 1908
const INK = '#4C3C2D';
const PAPER = '#F4EEE4';
const CARD = '#F9F3E9';
const MUTED = '#746456';
const CINNABAR = '#943B30';

// 主标题和名句用楷体，落款用宋体。
const KAI = '"Kaiti SC", "STKaiti", "KaiTi", serif';
const SONG = '"Songti SC", "STSong", "SimSun", serif';

// 图片对象缓存（createImage 按 src 复用；ok:false 记失败，避免重复请求）
const imgCache = {};

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

// 按画布实际字体测量中文、数字和混排。末行留出省略号，不挤出版心。
function wrapText(ctx, text, width, limit) {
  const chars = Array.from(String(text || '').trim().replace(/\s+/g, ' '));
  const rows = [];
  for (let start = 0; start < chars.length && rows.length < limit;) {
    let end = start + 1;
    let row = chars[start];
    while (end < chars.length && ctx.measureText(row + chars[end]).width <= width) {
      row += chars[end];
      end += 1;
    }
    if (end < chars.length && rows.length === limit - 1) {
      while (end > start && ctx.measureText(chars.slice(start, end).join('') + '…').width > width) end -= 1;
      rows.push(chars.slice(start, end).join('') + '…');
      break;
    }
    if (end < chars.length) {
      // 优先在靠近行尾的断句处折行，收尾标点不单独落到下一行。
      const bound = Math.max(start + 1, end - 3);
      let pause = end - 1;
      while (pause >= bound && !/[，。！？：；、]/.test(chars[pause])) pause -= 1;
      if (pause >= bound) end = pause + 1;
      else if (end > start + 1 && /^[，。！？：；、）》」』]$/.test(chars[end])) end -= 1;
    }
    rows.push(chars.slice(start, end).join('').trim());
    start = end;
  }
  return rows;
}

function drawLines(ctx, text, width, limit, y, lineHeight) {
  const rows = wrapText(ctx, text, width, limit);
  rows.forEach((row, index) => ctx.fillText(row, W / 2, y + index * lineHeight));
  return rows.length;
}

// 查询 2d canvas 节点（每次绘制/装载/导出都重新查询，wx:if 重挂载与 harness 重渲染后仍有效）
function getCanvasNode(page, cb, onMissing = () => {}) {
  if (typeof wx.createSelectorQuery !== 'function') return onMissing();
  wx.createSelectorQuery()
    .in(page)
    .select('#' + CANVAS_ID)
    .fields({ node: true, size: true })
    .exec((res) => {
      const node = res && res[0] && res[0].node;
      if (node && typeof node.getContext === 'function') cb(node);
      else onMissing();
    });
}

// 题图补绘时复用高清缓冲，由整幅宣纸底覆盖上一帧。
function frameCanvas(node) {
  if (node.width !== BW) node.width = BW;
  if (node.height !== BH) node.height = BH;
  const ctx = node.getContext('2d');
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  return ctx;
}

// 装载 2d canvas 图像对象：createImage 本地图/远端图都支持，不受域名白名单限制。
// 缓存命中同步返回；失败记录 ok:false 不再重试。回调 (img|null)，img 带 width/height。
function loadCanvasImg(page, src, cb) {
  if (!src) {
    cb(null);
    return;
  }
  const hit = imgCache[src];
  if (hit) {
    if (hit.callbacks) hit.callbacks.push(cb);
    else cb(hit.ok ? hit.img : null);
    return;
  }
  const pending = { callbacks: [cb] };
  imgCache[src] = pending;
  const finish = (img, remember = true) => {
    if (imgCache[src] === pending) {
      if (remember) imgCache[src] = { ok: !!img, img };
      else delete imgCache[src];
    }
    pending.callbacks.forEach((done) => done(img));
  };
  getCanvasNode(page, (node) => {
    if (typeof node.createImage !== 'function') {
      finish(null);
      return;
    }
    const img = node.createImage();
    img.onload = () => finish(img);
    img.onerror = () => finish(null);
    img.src = src;
  }, () => finish(null, false));
}

// 绘制中只读缓存取图（不触发加载/重绘——加载统一在 drawPoster 的预取步骤完成，
// 避免"同步加载回调→递归重绘"导致一次调用内多层绘制互相覆盖）
function peekImg(src) {
  if (!src) return null;
  const hit = imgCache[src];
  return hit && hit.ok ? hit.img : null;
}

// 绘制前预取海报需要的全部图：缓存未命中的发起异步装载，就绪后触发下一轮重绘。
// 真机：首绘只有纸底，图陆续就绪逐次补绘收敛；同步 mock 环境：当轮即可全部命中。
function preloadPosterImgs(page, share) {
  const srcs = [
    PAPER_BG,
    share.imgLocal || FALLBACK_COVER,
    share.imgLocal ? FALLBACK_COVER : '', // 题图装载中先备好兜底卷首
    '/assets/seal.png',
    SHARE_CODE
  ];
  srcs.forEach((src) => {
    if (!src || imgCache[src]) return;
    loadCanvasImg(page, src, (img) => {
      if (img && page.data.share && page.data.share.open) drawPoster(page);
    });
  });
}

// 测试/网络环境切换用：清空图片对象缓存（下次绘制重新装载）
function resetImgs() {
  Object.keys(imgCache).forEach((k) => delete imgCache[k]);
}

function open(page) {
  const payload = (typeof page.sharePayload === 'function' && page.sharePayload()) || {};
  const quote = dailyQuote();

  page.__qrPayload = payload;
  page.setData({
    share: {
      open: true,
      kicker: payload.kicker || '',
      title: payload.title || '阅史记',
      desc: payload.desc || '',
      img: payload.img || '',
      imgLocal: '',  // 题图源（就绪后重绘；空则画预置卷首兜底图）
      quote: quote ? quote.quote : '',
      quoteSource: quote ? quote.source : '',
      dateText: dateText(),
      lunarText: lunarText()
    }
  });

  // canvas 由 wx:if 挂载，稍等渲染后首绘（先纸底 + 兜底卷首，题图就绪后补绘）。
  // 远端题图失败时回退 imgFallback（本地朝代画），保证顶部始终是当前相关图。
  setTimeout(() => {
    if (page.__qrPayload === payload && page.data.share.open) attachCanvas(page, payload);
  }, 120);
}

// 首绘 + 启动题图装载链（open 的延迟回调；测试里可同步调用）
function attachCanvas(page, payload) {
  drawPoster(page);
  startCoverChain(page, payload || page.__qrPayload);
}

// 题图装载链：远端专属图 → imgFallback（本地朝代画）→ 都失败则画预置卷首兜底图
function startCoverChain(page, payload) {
  const primary = (payload && payload.img) || '';
  const fallback = (payload && payload.imgFallback) || '';
  const trySrc = (src) => {
    if (!src) {
      drawPoster(page);
      return;
    }
    loadCanvasImg(page, src, (img) => {
      if (!page.data.share.open || page.__qrPayload !== payload) return;
      if (img) {
        page.setData({ 'share.imgLocal': src });
        drawPoster(page);
        return;
      }
      trySrc(fallback && src !== fallback ? fallback : '');
    });
  };
  trySrc(primary);
}

function close(page) {
  page.setData({ 'share.open': false });
}

// 圆角路径兼容微信 2D Canvas 和浏览器预览。
function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.lineTo(x, y + h - r);
  ctx.quadraticCurveTo(x, y + h, x + r, y + h);
  ctx.lineTo(x + w - r, y + h);
  ctx.quadraticCurveTo(x + w, y + h, x + w, y + h - r);
  ctx.lineTo(x + w, y + r);
  ctx.quadraticCurveTo(x + w, y, x + w - r, y);
  ctx.closePath();
}

function drawCropped(ctx, img, x, y, width, height) {
  const scale = Math.max(width / img.width, height / img.height);
  const sw = width / scale;
  const sh = height / scale;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, width, height);
}

function washMountains(ctx, top, color, mirrored) {
  ctx.save();
  ctx.translate(mirrored ? W : 0, top);
  if (mirrored) ctx.scale(-1, 1);
  const wash = ctx.createLinearGradient(0, 12, 0, 56);
  wash.addColorStop(0, color);
  wash.addColorStop(0.55, color);
  wash.addColorStop(1, 'rgba(174, 143, 106, 0)');
  ctx.fillStyle = wash;
  ctx.beginPath();
  ctx.moveTo(0, 32);
  ctx.quadraticCurveTo(9, 14, 20, 17);
  ctx.quadraticCurveTo(28, 7, 38, 15);
  ctx.lineTo(51, 26);
  ctx.quadraticCurveTo(64, 18, 78, 34);
  ctx.quadraticCurveTo(90, 35, 106, 51);
  ctx.lineTo(0, 56);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCloudRule(ctx) {
  const y = 262;
  const x = W / 2;
  ctx.fillStyle = '#DECAB5';
  ctx.fillRect(36, y, 80, 0.55);
  ctx.fillRect(W - 116, y, 80, 0.55);
  ctx.strokeStyle = '#B99B7E';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(x - 11, y);
  ctx.quadraticCurveTo(x - 7, y - 3, x - 5, y - 1.5);
  ctx.quadraticCurveTo(x, y - 8, x + 5, y - 1.5);
  ctx.quadraticCurveTo(x + 7, y - 3, x + 11, y);
  ctx.quadraticCurveTo(x + 7, y + 3, x + 4, y + 2);
  ctx.quadraticCurveTo(x, y + 6, x - 4, y + 2);
  ctx.quadraticCurveTo(x - 7, y + 3, x - 11, y);
  ctx.moveTo(x - 6, y + 1);
  ctx.quadraticCurveTo(x - 2, y - 3, x - 2, y + 1);
  ctx.moveTo(x + 6, y + 1);
  ctx.quadraticCurveTo(x + 2, y - 3, x + 2, y + 1);
  ctx.stroke();
}

function drawFooterIcon(ctx, type, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = '#A8876A';
  ctx.fillStyle = '#A8876A';
  ctx.lineWidth = 0.65;
  if (type === 'date') {
    roundRectPath(ctx, 0.5, 1.2, 8.0, 7.2, 0.9);
    ctx.moveTo(1, 3.4);
    ctx.lineTo(8, 3.4);
    ctx.moveTo(2.7, 0.2);
    ctx.lineTo(2.7, 2.4);
    ctx.moveTo(6.2, 0.2);
    ctx.lineTo(6.2, 2.4);
    ctx.stroke();
    ctx.fillRect(2.6, 4.8, 1, 0.9);
    ctx.fillRect(4.1, 4.8, 1, 0.9);
    ctx.fillRect(5.6, 4.8, 1, 0.9);
  } else if (type === 'lunar') {
    ctx.beginPath();
    ctx.arc(4.4, 4.4, 3.8, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(4.4, 0.6);
    ctx.quadraticCurveTo(2, 2.5, 4.4, 4.4);
    ctx.quadraticCurveTo(6.8, 6.3, 4.4, 8.2);
    ctx.stroke();
    ctx.fillRect(5.2, 2.1, 0.9, 0.9);
    ctx.fillRect(2.7, 5.7, 0.9, 0.9);
  } else {
    ctx.beginPath();
    ctx.moveTo(0.5, 1.4);
    ctx.quadraticCurveTo(2.2, 0.6, 4.4, 2.2);
    ctx.quadraticCurveTo(6.6, 0.6, 8.3, 1.4);
    ctx.lineTo(8.3, 7.7);
    ctx.quadraticCurveTo(6.6, 7.1, 4.4, 8.5);
    ctx.quadraticCurveTo(2.2, 7.1, 0.5, 7.7);
    ctx.closePath();
    ctx.moveTo(4.4, 2.2);
    ctx.lineTo(4.4, 8.1);
    ctx.stroke();
  }
  ctx.restore();
}

function paintPoster(ctx, share, getImage = peekImg) {
  const paper = getImage(PAPER_BG);
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  if (paper && paper.width && paper.height) {
    ctx.save();
    ctx.globalAlpha = 0.32;
    drawCropped(ctx, paper, 0, 0, W, H);
    ctx.restore();
  }
  washMountains(ctx, 9, 'rgba(174, 143, 106, 0.09)', false);
  washMountains(ctx, 356, 'rgba(174, 143, 106, 0.12)', true);

  ctx.save();
  ctx.shadowColor = 'rgba(111, 80, 48, 0.16)';
  ctx.shadowBlur = 45;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = '#FCF8F1';
  roundRectPath(ctx, 16, 40, 228, 349, 11);
  ctx.fill();
  ctx.restore();

  const x = 21.5, y = 45, width = 217, height = 339;
  ctx.save();
  roundRectPath(ctx, x, y, width, height, 7);
  ctx.clip();
  ctx.fillStyle = CARD;
  ctx.fillRect(x, y, width, height);
  if (paper && paper.width && paper.height) {
    ctx.globalAlpha = 0.2;
    drawCropped(ctx, paper, x, y, width, height);
    ctx.globalAlpha = 1;
  }
  washMountains(ctx, 343, 'rgba(179, 141, 104, 0.10)', true);

  const cover = (share.imgLocal && getImage(share.imgLocal)) || getImage(FALLBACK_COVER);
  if (cover && cover.width && cover.height) {
    ctx.globalAlpha = 0.86;
    drawCropped(ctx, cover, x, y, width, 109);
    ctx.globalAlpha = 1;
  }
  const fade = ctx.createLinearGradient(0, 108, 0, 154);
  fade.addColorStop(0, 'rgba(249, 243, 233, 0)');
  fade.addColorStop(0.58, 'rgba(249, 243, 233, 0.76)');
  fade.addColorStop(1, CARD);
  ctx.fillStyle = fade;
  ctx.fillRect(x, 108, width, 46);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '11px ' + KAI;
  const kicker = wrapText(ctx, share.kicker, 144, 1)[0] || '';
  if (kicker) {
    const gap = ctx.measureText(kicker).width / 2 + 9;
    ctx.fillStyle = '#CF9484';
    ctx.fillRect(W / 2 - gap - 24, 151, 24, 0.5);
    ctx.fillRect(W / 2 + gap, 151, 24, 0.5);
    ctx.fillStyle = CINNABAR;
    ctx.fillText(kicker, W / 2, 151);
  }

  const title = share.title || '阅史记';
  const shortTitle = Array.from(title).length <= 2;
  let size = shortTitle ? 43 : 29;
  ctx.font = 'bold ' + size + 'px ' + KAI;
  if (!shortTitle && ctx.measureText(title).width > 183) {
    size = ctx.measureText(title).width * 22 / 29 > 376 ? 19 : 22;
    ctx.font = 'bold ' + size + 'px ' + KAI;
  }
  const titleRows = wrapText(ctx, title, 188, 2);
  if (shortTitle) {
    ctx.strokeStyle = 'rgba(173, 136, 98, 0.095)';
    ctx.lineWidth = 7.5;
    ctx.beginPath();
    ctx.arc(W / 2, 185, 28, -1.05, 4.96);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(184, 145, 105, 0.08)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(W / 2, 185, 32, 1.7, 4.25);
    ctx.stroke();
  }
  ctx.fillStyle = INK;
  titleRows.forEach((row, index) => ctx.fillText(row, W / 2, 185 + (index - (titleRows.length - 1) / 2) * (size + 3)));

  ctx.font = '12px ' + KAI;
  drawLines(ctx, share.desc, 178, 2, 224, 18);
  drawCloudRule(ctx);

  ctx.fillStyle = INK;
  ctx.font = '12.5px ' + KAI;
  const quote = share.quote || '';
  const quoteWidth = ctx.measureText(quote).width;
  if (quoteWidth > 191 && quoteWidth * 11 / 12.5 <= 191) ctx.font = '11px ' + KAI;
  const quoteLines = drawLines(ctx, quote, 191, 2, 283, 14);
  if (quoteLines && share.quoteSource) {
    ctx.fillStyle = MUTED;
    ctx.font = '9.4px ' + SONG;
    drawLines(ctx, '—— ' + share.quoteSource, 178, 1, quoteLines === 1 ? 304 : 312, 0);
  }

  ctx.fillStyle = '#E4D5C5';
  ctx.fillRect(27.5, 326, 205, 0.55);
  const code = getImage(SHARE_CODE);
  ctx.textAlign = 'left';
  ctx.font = (code ? '9px ' : '9.3px ') + SONG;
  const footer = [
    ['date', share.dateText, 342, INK],
    ['lunar', share.lunarText, 357, MUTED],
    ['book', '阅史记 · 一页一页读历史', share.dateText ? 372 : 357, MUTED]
  ];
  footer.forEach(([icon, label, baseline, color]) => {
    if (!label) return;
    drawFooterIcon(ctx, icon, 34, baseline - 4.5);
    ctx.fillStyle = color;
    ctx.fillText(label, 50, baseline, code ? 106 : 144);
  });

  const seal = getImage('/assets/seal.png');
  if (seal && seal.width && seal.height) {
    const sealH = code ? 26 : 40;
    const sealW = sealH * seal.width / seal.height;
    ctx.drawImage(seal, (code ? 175 : 229) - sealW, code ? 343 : 334, sealW, sealH);
  }
  if (code && code.width && code.height) {
    // 码图按正方形整幅绘入，保留原有白边、码点和绿色微信标识。
    ctx.fillStyle = '#FFFFFF';
    roundRectPath(ctx, 180, 327, 54, 51.5, 3);
    ctx.fill();
    ctx.drawImage(code, 182, 328, 50, 50);
    ctx.textAlign = 'center';
    ctx.fillStyle = MUTED;
    ctx.font = '5.5px ' + SONG;
    ctx.fillText('微信扫一扫', 207, 381);
  }
  ctx.restore();
}

function drawPoster(page) {
  const share = page.data.share;
  if (!share || !share.open) return; // 面板已关
  if (typeof wx.createSelectorQuery !== 'function') return; // 无环境静默跳过
  const host = feedback.current();

  getCanvasNode(page, (node) => {
    try {
      const ctx = frameCanvas(node);
      preloadPosterImgs(page, share);
      paintPoster(ctx, share);
    } catch (e) {
      console.error('qrshare drawPoster:', e);
      // 绘制异常降级：面板切预置静态卡片图（保持完整视觉，见 tools/gen_share_fallback.py）
      if (page && page.setData) page.setData({ 'share.fallback': true });
      feedback.toast({ title: '已切换备用卡片', icon: 'none' }, host);
    }
  });
}

// 写入相册（授权被拒则引导去设置，回来自动重试一次）
function writeAlbum(filePath, host) {
  require('./privacy.js').authorize(() => saveAlbum(filePath, host), host);
}

function saveAlbum(filePath, host) {
  wx.saveImageToPhotosAlbum({
    filePath,
    success: () => feedback.toast({ title: '已保存到相册', icon: 'success' }, host),
    fail: (err) => {
      const msg = (err && err.errMsg) || '';
      if (/privacy/.test(msg) || (err && err.errno === 104)) {
        feedback.toast({ title: '已取消保存，可继续阅读', icon: 'none' }, host);
        return;
      }
      if (msg.indexOf('auth') < 0 && msg.indexOf('deny') < 0) {
        feedback.toast({ title: '保存失败', icon: 'none' }, host);
        return;
      }
      feedback.modal({
        title: '需要相册权限',
        content: '请在设置中允许「保存到相册」',
        confirmText: '去设置',
        success: (res) => {
          if (!res.confirm || typeof wx.openSetting !== 'function') return;
          wx.openSetting({
            success: (setting) => {
              if (setting && setting.authSetting && setting.authSetting['scope.writePhotosAlbum']) {
                writeAlbum(filePath, host);
              }
            }
          });
        }
      }, host);
    }
  });
}

// 导出海报 → 保存到相册；导出失败或 canvas 已降级时，改保存预置兜底图。
// 2d canvas 导出传节点本身，按缓冲原生分辨率出图（1170×1908）。
// 小程序码就绪后再导出，加载失败时保存自带同一码的备用卡。
function save(page) {
  const share = page.data.share;
  if (!share || !share.open) return;
  const host = feedback.current();
  if (share.fallback || typeof wx.canvasToTempFilePath !== 'function') {
    saveFallback(page, host);
    return;
  }

  const payload = page.__qrPayload;
  loadCanvasImg(page, SHARE_CODE, (code) => {
    if (page.__qrPayload !== payload || !page.data.share.open) return;
    if (!code) return saveFallback(page, host);
    getCanvasNode(page, (node) => {
      if (page.__qrPayload !== payload || !page.data.share.open) return;
      try {
        paintPoster(frameCanvas(node), page.data.share);
      } catch (e) {
        return saveFallback(page, host);
      }
      wx.canvasToTempFilePath({
        canvas: node,
        destWidth: BW,
        destHeight: BH,
        success: (res) => writeAlbum(res.tempFilePath, host),
        fail: () => saveFallback(page, host)
      });
    }, () => saveFallback(page, host));
  });
}

// 兜底保存：把包内静态卡片图（FALLBACK_IMG）经用户目录转存到相册。
// saveImageToPhotosAlbum 不接受代码包路径，须用 FileSystemManager 中转。
function saveFallback(page, host = feedback.current()) {
  if (typeof wx.getFileSystemManager !== 'function' || !wx.env || !wx.env.USER_DATA_PATH) {
    feedback.toast({ title: '暂不支持保存备用卡片', icon: 'none' }, host);
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
          success: () => writeAlbum(dst, host),
          fail: () => feedback.toast({ title: '保存失败', icon: 'none' }, host)
        });
      },
      fail: () => {
        if (i + 1 < tryPaths.length) attempt(i + 1);
        else feedback.toast({ title: '备用卡片不可用', icon: 'none' }, host);
      }
    });
  })(0);
}

module.exports = {
  open, close, save, saveFallback, drawPoster, attachCanvas,
  dailyQuote, lunarText, dateText, resetImgs, paintPoster,
  FALLBACK_IMG, CANVAS_ID, CANVAS_SIZE: W, CANVAS_HEIGHT: H, SCALE
};
