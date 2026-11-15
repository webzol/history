// 分享面板：分享卡片海报（宣纸纹理 + 立轴题图 + 页面内容摘要 + 每日名句落款）+ 保存相册，纯前端实现。
//
// 渲染架构（2026-11-14 高清化）：canvas 2d API（type="2d"），固定 4.5 倍缓冲（1170×1908，
// 与设备像素比无关）——所有绘制坐标仍按 260×424 逻辑尺寸书写，ctx.scale(4.5) 一次放大；
// 导出按缓冲原生分辨率，相册里 1170×1908 全高清。旧版 canvas 的缓冲尺寸随设备 dpr 浮动，
// 低像素比设备上 3 倍拉伸导出发虚，是本次迁移的直接原因。
// 每次绘制都重新查询 canvas 节点并整幅重画（width 赋值会重置画布状态，正好配合全幅重绘）：
// 真机 wx:if 节点持久、查询开销可忽略；harness 整页重渲染后也能拿到新元素。
//
// 卡片不带任何二维码/小程序码（2026-11-15 定稿「只要卡片」，qrcode.js 随之移出主包）；
// 好友直达分享走「转寄好友」微信原生卡片。扫码进入支持保留在 utils/wxacode.js（mergeScene），
// 历史流传的太阳码仍可扫入对应详情页。
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
// 题图兜底：当前页相关图全链路取不到时的卷首画
const FALLBACK_COVER = '/assets/share-cover-fallback.jpg';
// 宣纸纹理：与全站页面同一张图（各页 <image class="paper-bg"> 同源同铺法），海报卷面直接绘入
const PAPER_BG = '/assets/paper-bg.jpg';
// 底部水墨山水带（千里江山图，低透明度晕染，仿参考稿底部淡山水）
const LANDSCAPE_BG = '/assets/paintings/landscape.jpg';

// 海报逻辑尺寸（px，260×563 与参考稿 1125×2436 同比例）与高清倍率
const CANVAS_ID = 'ssQrCanvas';
const W = 260;
const H = 563;
const SCALE = 4.5;
const BW = Math.round(W * SCALE); // 缓冲 1170
const BH = Math.round(H * SCALE); // 缓冲 1908
const INK = '#1F1D19';
const PAPER = '#F6F1EA';
const CINNABAR = '#A34A3E'; // 朱砂（品牌题字/kicker/画名签）

// 字体栈：与 app.wxss 同源（标题宋体 / 名句楷体 / 其余默认黑体系）
const KAI = '"Kaiti SC", "STKaiti", "KaiTi", serif';
const SONG = '"Songti SC", "STSong", "SimSun", serif';
const SANS = '"PingFang SC", "Noto Sans SC", sans-serif';

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

// 中英文混排宽度估算（与旧版一致，折行结果保持稳定）
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

// 查询 2d canvas 节点（每次绘制/装载/导出都重新查询，wx:if 重挂载与 harness 重渲染后仍有效）
function getCanvasNode(page, cb) {
  if (typeof wx.createSelectorQuery !== 'function') return;
  wx.createSelectorQuery()
    .in(page)
    .select('#' + CANVAS_ID)
    .fields({ node: true, size: true })
    .exec((res) => {
      const node = res && res[0] && res[0].node;
      if (node && typeof node.getContext === 'function') cb(node);
    });
}

// 建画布帧：设固定缓冲 → getContext → scale(4.5)，返回就绪的 2d ctx。
// 对 width 赋值会重置画布全部状态，正好配合 paintPoster 的整幅重绘。
function frameCanvas(node) {
  node.width = BW;
  node.height = BH;
  const ctx = node.getContext('2d');
  ctx.scale(SCALE, SCALE);
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
    cb(hit.ok ? hit.img : null);
    return;
  }
  getCanvasNode(page, (node) => {
    if (typeof node.createImage !== 'function') {
      cb(null);
      return;
    }
    const img = node.createImage();
    img.onload = () => {
      imgCache[src] = { ok: true, img };
      cb(img);
    };
    img.onerror = () => {
      imgCache[src] = { ok: false, img: null };
      cb(null);
    };
    img.src = src;
  });
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
    LANDSCAPE_BG
  ];
  srcs.forEach((src) => {
    if (!src || imgCache[src]) return;
    loadCanvasImg(page, src, () => {
      if (page.data.share && page.data.share.open) drawPoster(page);
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
  setTimeout(() => attachCanvas(page, payload), 120);
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
      if (!page.data.share.open) return;
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

// 海报：仿参考稿 1:1 版式（2026-11-15）——顶部朱砂品牌题字 + 大幅圆角卷首画（含朱砂画名签）
// + 两侧古风竖排文字 + 史事 kicker（双侧短线）+ 大标题 + 摘要 + 名句卡（含「史载」印）
// + 日历日期落款 + 底部淡彩山水晕染。整张宣纸纹理打底，无任何二维码。
// 纯绘制函数：图一律经 peekImg 读缓存（缺图由预取触发下一轮重绘补上），本函数不含任何异步。

// 圆角矩形路径（quadraticCurveTo 模拟 arcTo，兼容旧 webview）
function roundRectPath(ctx, x, y, w, h, r) {
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

// 竖排文字列（逐字 fillText，楷体/宋体淡墨）
function vtext(ctx, text, x, y0, step) {
  String(text).split('').forEach((ch, i) => ctx.fillText(ch, x, y0 + i * step));
}

function paintPoster(ctx, share) {
  // 整张宣纸打底：底色 + aspectFill 纹理（clip 防溢出）
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  const paper = peekImg(PAPER_BG);
  if (paper && paper.width && paper.height) {
    const ps = Math.max(W / paper.width, H / paper.height);
    const pw = paper.width * ps;
    const ph = paper.height * ps;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.clip();
    ctx.drawImage(paper, (W - pw) / 2, (H - ph) / 2, pw, ph);
    ctx.restore();
  }

  // 底部水墨山水带（画在内容之下，仿参考稿日期以下的整段山水）：
  // 源裁切千里江山图右段山势最密集区，alpha 0.32 + 顶缘 36 行纸色渐隐融入宣纸
  const landscape = peekImg(LANDSCAPE_BG);
  if (landscape && landscape.width && landscape.height) {
    const by = 370;
    const bh = H - by;
    const sx = 300, sw2 = 420; // 右段山势密集区（源像素）
    const sh2 = landscape.height;
    const ls = Math.max(W / sw2, bh / sh2);
    const lw2 = sw2 * ls;
    const lh2 = sh2 * ls;
    ctx.save();
    ctx.globalAlpha = 0.32;
    ctx.beginPath();
    ctx.rect(0, by, W, bh);
    ctx.clip();
    ctx.drawImage(landscape, sx, 0, sw2, sh2, (W - lw2) / 2, by + (bh - lh2) / 2, lw2, lh2);
    ctx.restore();
    // 顶缘 36 行纸色渐隐，山水上缘不生硬
    ctx.fillStyle = PAPER;
    for (let i = 0; i < 36; i += 1) {
      ctx.globalAlpha = 1 - i / 36;
      ctx.fillRect(0, by + i, W, 1);
    }
    ctx.globalAlpha = 1;
  }

  // 顶部品牌题字「阅史记」+ 朱砂小横线
  ctx.textAlign = 'center';
  ctx.fillStyle = CINNABAR;
  ctx.font = 'bold 17px ' + SONG;
  ctx.fillText('阅史记', W / 2, 30);
  ctx.fillRect(W / 2 - 7, 36, 14, 2);

  // 卷首画大幅圆角卡：纸白卡底 + 画心 cover 裁切铺满（不变形只裁边）+ 左上朱砂画名签
  ctx.fillStyle = '#FCFBF8';
  roundRectPath(ctx, 29, 42, 202, 166, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(70, 58, 45, 0.14)';
  roundRectPath(ctx, 29.5, 42.5, 201, 165, 6);
  ctx.stroke();
  const cover = (share.imgLocal && peekImg(share.imgLocal)) || peekImg(FALLBACK_COVER);
  if (cover && cover.width && cover.height) {
    const ix = 33, iy = 46, iw2 = 194, ih2 = 158;
    const cs = Math.max(iw2 / cover.width, ih2 / cover.height);
    const cw2 = cover.width * cs;
    const ch2 = cover.height * cs;
    ctx.save();
    roundRectPath(ctx, ix, iy, iw2, ih2, 4);
    ctx.clip();
    ctx.drawImage(cover, ix + (iw2 - cw2) / 2, iy + (ih2 - ch2) / 2, cw2, ch2);
    ctx.restore();
    // 朱砂画名签（竖排白字，取标题前 4 字）
    const chipText = String(share.title || '').replace(/[，。！？、\s·]/g, '').slice(0, 4) || '阅史记';
    const chars = chipText.split('');
    ctx.fillStyle = CINNABAR;
    roundRectPath(ctx, 40, 62, 12, 10 + chars.length * 8, 3);
    ctx.fill();
    ctx.fillStyle = 'rgba(252, 251, 248, 0.95)';
    ctx.font = '7px ' + SANS;
    chars.forEach((ch, i) => ctx.fillText(ch, 46, 70 + i * 8));
  }

  // 两侧古风竖排（右：读史可以明智 / 知古可以鉴今；左：以史为鉴 / 与古为新）
  ctx.fillStyle = 'rgba(122, 114, 100, 0.62)';
  ctx.font = '8px ' + SONG;
  vtext(ctx, '读史可以明智', 252, 46, 11);
  vtext(ctx, '知古可以鉴今', 241, 46, 11);
  vtext(ctx, '以史为鉴', 20, 58, 11);
  vtext(ctx, '与古为新', 9.5, 58, 11);

  // 史事 kicker（朱砂）+ 两侧短线
  ctx.textAlign = 'center';
  ctx.fillStyle = CINNABAR;
  ctx.font = '11px ' + SONG;
  ctx.fillText(share.kicker, W / 2, 226);
  let kw = 0;
  if (typeof ctx.measureText === 'function') {
    kw = ctx.measureText(share.kicker).width;
  } else {
    share.kicker.split('').forEach((ch) => { kw += charW(ch, 11); });
  }
  ctx.fillRect(W / 2 - kw / 2 - 20, 222.5, 14, 1.5);
  ctx.fillRect(W / 2 + kw / 2 + 6, 222.5, 14, 1.5);

  // 大标题（宋体特大，最多一行）
  ctx.fillStyle = INK;
  ctx.font = 'bold 24px ' + SONG;
  ctx.fillText(clipText(share.title, 24, 224, true), W / 2, 254);

  // 摘要（淡墨，最多两行）
  ctx.fillStyle = '#5F5A52';
  ctx.font = '10.5px ' + SANS;
  const rows = wrapText(share.desc, 10.5, 208, 2);
  rows.forEach((row, i) => ctx.fillText(row, W / 2, 280 + i * 16));

  // 名句卡：纸白圆角卡 + 楷体名句 + 出处 +「史载」朱砂印（右）
  ctx.fillStyle = '#FCFBF8';
  roundRectPath(ctx, 10, 306, 240, 56, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(70, 58, 45, 0.10)';
  roundRectPath(ctx, 10.5, 306.5, 239, 55, 8);
  ctx.stroke();
  if (share.quote) {
    ctx.fillStyle = '#3B3731';
    ctx.font = '13px ' + KAI;
    const qrows = wrapText(share.quote, 13, 150, 2);
    qrows.forEach((row, i) => ctx.fillText(row, 112, 324 + i * 17));
    ctx.fillStyle = '#8C857A';
    ctx.font = '9px ' + SANS;
    ctx.fillText(share.quoteSource ? `—— ${share.quoteSource}` : '', 112, 324 + (qrows.length - 1) * 17 + 16);
  }
  const seal = peekImg('/assets/seal.png');
  if (seal) {
    const sealH = 30;
    const sealW = Math.round(sealH * 114 / 197);
    ctx.drawImage(seal, 210, 319, sealW, sealH);
  }

  // 日期落款：手绘日历小图标 + 公历/农历（压在山水晕染带上，与参考稿一致）
  ctx.strokeStyle = '#5F5A52';
  roundRectPath(ctx, 92, 374, 11, 11, 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(92, 378);
  ctx.lineTo(103, 378);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(95, 372.5);
  ctx.lineTo(95, 375.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(100, 372.5);
  ctx.lineTo(100, 375.5);
  ctx.stroke();
  ctx.fillStyle = '#5F5A52';
  ctx.fillRect(94.5, 380.5, 3, 3);
  ctx.textAlign = 'left';
  ctx.fillStyle = INK;
  ctx.font = '11px ' + SANS;
  ctx.fillText(share.dateText || '', 108, 383);
  ctx.fillStyle = '#8C857A';
  ctx.font = '9.5px ' + SANS;
  ctx.fillText(share.lunarText || '', 108, 397);
}

function drawPoster(page) {
  const share = page.data.share;
  if (!share || !share.open) return; // 面板已关
  if (typeof wx.createSelectorQuery !== 'function') return; // 无环境静默跳过

  getCanvasNode(page, (node) => {
    try {
      const ctx = frameCanvas(node);
      preloadPosterImgs(page, share);
      paintPoster(ctx, share);
    } catch (e) {
      console.error('qrshare drawPoster:', e);
      // 绘制异常降级：面板切预置静态卡片图（保持完整视觉，见 tools/gen_share_fallback.py）
      if (page && page.setData) page.setData({ 'share.fallback': true });
      if (wx.showToast) wx.showToast({ title: '已切换备用卡片', icon: 'none' });
    }
  });
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

// 导出海报 → 保存到相册；导出失败或 canvas 已降级时，改保存预置兜底图。
// 2d canvas 导出传节点本身，按缓冲原生分辨率出图（1170×1908）。
// 节点被重建过（缓冲尺寸不符）时先重设缓冲并重画一帧再导出，避免导出空白。
function save(page) {
  const share = page.data.share;
  if (!share || !share.open) return;
  if (share.fallback || typeof wx.canvasToTempFilePath !== 'function') {
    saveFallback(page);
    return;
  }

  getCanvasNode(page, (node) => {
    try {
      if (node.width !== BW || node.height !== BH) {
        const ctx = frameCanvas(node);
        preloadPosterImgs(page, share);
        paintPoster(ctx, share);
      }
    } catch (e) { /* 重画失败仍按当前缓冲导出，导出失败有兜底 */ }
    wx.canvasToTempFilePath({
      canvas: node,
      destWidth: BW,
      destHeight: BH,
      success: (res) => writeAlbum(res.tempFilePath),
      fail: () => saveFallback(page)
    });
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
  open, close, save, saveFallback, drawPoster, attachCanvas,
  dailyQuote, lunarText, dateText, resetImgs,
  FALLBACK_IMG, CANVAS_ID, CANVAS_SIZE: W, CANVAS_HEIGHT: H, SCALE
};
