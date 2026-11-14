// 分享面板：分享卡片海报（宣纸纹理 + 立轴题图 + 页面内容摘要 + 太阳码）+ 保存相册，纯前端实现。
//
// 渲染架构（2026-11-14 高清化）：canvas 2d API（type="2d"），固定 4.5 倍缓冲（1170×1908，
// 与设备像素比无关）——所有绘制坐标仍按 260×424 逻辑尺寸书写，ctx.scale(4.5) 一次放大；
// 导出按缓冲原生分辨率，相册里 1170×1908 全高清。旧版 canvas 的缓冲尺寸随设备 dpr 浮动，
// 低像素比设备上 3 倍拉伸导出发虚，是本次迁移的直接原因。
// 每次绘制都重新查询 canvas 节点并整幅重画（width 赋值会重置画布状态，正好配合全幅重绘）：
// 真机 wx:if 节点持久、查询开销可忽略；harness 整页重渲染后也能拿到新元素。
//
// 卡片太阳码：Actions 预生成走 jsDelivr（utils/wxacode.js），扫码直达当前页；
// 码图取不到自动回退本地编码二维码（qrcode.js，内容为页内路径文本），零劣化。
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
// 宣纸纹理：与全站页面同一张图（各页 <image class="paper-bg"> 同源同铺法），海报卷面直接绘入
const PAPER_BG = '/assets/paper-bg.jpg';

// 海报逻辑尺寸（px，与 app.wxss .ss-canvas 一致）与高清倍率
const CANVAS_ID = 'ssQrCanvas';
const W = 260;
const H = 424;
const SCALE = 4.5;
const BW = Math.round(W * SCALE); // 缓冲 1170
const BH = Math.round(H * SCALE); // 缓冲 1908
const CODE_SIZE = 54; // 太阳码/二维码边长
const INK = '#1F1D19';
const PAPER = '#F6F1EA';

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

// 二维码编码（typeNumber 0 = 自动版本；中文走 UTF-8 字节模式，纠错 M）
function encode(text) {
  const qr = qrcode(0, 'M');
  qr.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
  qr.addData(text, 'Byte');
  qr.make();
  return qr;
}

// 二维码文本：零依赖方案——编码页内路径文本，扫码可读「这是哪个页面」。
function qrTextOf(path) {
  return `阅史记：${path || '/pages/home/home'}`;
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
// 真机：首绘只有纸底/本地码，图陆续就绪逐次补绘收敛；同步 mock 环境：当轮即可全部命中。
function preloadPosterImgs(page, share) {
  const srcs = [
    PAPER_BG,
    share.imgLocal || FALLBACK_COVER,
    share.imgLocal ? FALLBACK_COVER : '', // 题图装载中先备好兜底卷首
    '/assets/seal.png',
    share.codeImg || ''
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
  const path = payload.path || '/pages/home/home';
  const quote = dailyQuote();

  page.__qrPath = path;
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
      lunarText: lunarText(),
      qrText: qrTextOf(path),
      codeImg: ''   // 太阳码图源（jsDelivr 就绪后重绘；空则画本地编码二维码）
    }
  });

  // canvas 由 wx:if 挂载，稍等渲染后首绘（先纸底 + 兜底卷首 + 本地码，图就绪各自补绘）。
  // 远端题图失败时回退 imgFallback（本地朝代画），保证顶部始终是当前相关图。
  setTimeout(() => attachCanvas(page, payload, path), 120);
}

// 首绘 + 启动题图/太阳码装载链（open 的延迟回调；测试里可同步调用）
function attachCanvas(page, payload, path) {
  drawPoster(page);
  startCoverChain(page, payload || page.__qrPayload);
  startCodeChain(page, path || page.__qrPath);
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

// 太阳码装载链：主域名 → 备用域名重试一次 → 都失败保持本地编码二维码
function startCodeChain(page, path) {
  const codeUrl = wxacode.codeUrlOf(path);
  if (!codeUrl) return;
  const trySrc = (url) => {
    if (!url) return;
    loadCanvasImg(page, url, (img) => {
      if (!page.data.share.open) return;
      if (img) {
        page.setData({ 'share.codeImg': url });
        drawPoster(page);
        return;
      }
      trySrc(wxacode.altCodeUrl(url));
    });
  };
  trySrc(codeUrl);
}

function close(page) {
  page.setData({ 'share.open': false });
}

// 海报：宣纸卷轴风——宣纸纹理卷面 + 天地轴杆绫边 + 装裱题图 + 楷体名句 + 码/日期落款 + 「史载」朱砂印。
// 纯绘制函数：图一律经 peekImg 读缓存（缺图由预取触发下一轮重绘补上），本函数不含任何异步。
function paintPoster(ctx, share) {
  // 立轴挂画形态：天杆 / 地杆（深木色横杆）+ 左右绫边（暗褐绢色 + 内金线）+ 宣纸卷面
  const drawBar = (y, h) => {
    ctx.fillStyle = '#2E2820';
    ctx.fillRect(0, y, W, h);
    ctx.fillStyle = 'rgba(246, 241, 234, 0.20)';
    ctx.fillRect(0, y + 1, W, 1);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.30)';
    ctx.fillRect(0, y + h - 2, W, 2);
  };
  drawBar(0, 12);
  drawBar(H - 12, 12);
  // 地杆两端轴头（立轴地杆出头）
  ctx.fillStyle = '#1B1712';
  ctx.beginPath();
  ctx.arc(3, H - 6, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(W - 3, H - 6, 5, 0, Math.PI * 2);
  ctx.fill();

  // 左右绫边 + 内金线
  const RIB = 12;
  ctx.fillStyle = '#463C30';
  ctx.fillRect(0, 12, RIB, H - 24);
  ctx.fillRect(W - RIB, 12, RIB, H - 24);
  ctx.fillStyle = 'rgba(190, 150, 90, 0.35)';
  ctx.fillRect(RIB - 1, 12, 1, H - 24);
  ctx.fillRect(W - RIB, 12, 1, H - 24);

  // 宣纸卷面：先铺底色，再 aspectFill 居中裁切绘入与全站同源的宣纸纹理（clip 防溢出）
  const tw = W - RIB * 2;
  const th = H - 24;
  ctx.fillStyle = PAPER;
  ctx.fillRect(RIB, 12, tw, th);
  const paper = peekImg(PAPER_BG);
  if (paper && paper.width && paper.height) {
    const s = Math.max(tw / paper.width, th / paper.height);
    const pw = paper.width * s;
    const ph = paper.height * s;
    ctx.save();
    ctx.beginPath();
    ctx.rect(RIB, 12, tw, th);
    ctx.clip();
    ctx.drawImage(paper, RIB + (tw - pw) / 2, 12 + (th - ph) / 2, pw, ph);
    ctx.restore();
  }

  // 卷面右缘竖排「阅史记」淡墨透背字（宣纸透背书法质感）
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(31, 29, 25, 0.055)';
  ctx.font = '16px ' + KAI;
  '阅史记'.split('').forEach((ch, i) => ctx.fillText(ch, W - RIB - 12, 178 + i * 21));

  // 卷首画：当前页相关图**完整展示不裁切**（contain），底部虚化渐隐融入卷面
  // （远端图加载失败回退 share.imgFallback 本地朝代画，再失败画预置卷首兜底图）
  const dx = RIB + 14, dy = 22, dw = W - RIB * 2 - 28, dh = 108;
  const cover = (share.imgLocal && peekImg(share.imgLocal)) || peekImg(FALLBACK_COVER);
  if (cover) {
    const iw = cover.width || 0;
    const ih = cover.height || 0;
    if (iw > 0 && ih > 0) {
      const scale = Math.min(dw / iw, dh / ih);
      const dw2 = Math.round(iw * scale);
      const dh2 = Math.round(ih * scale);
      ctx.drawImage(cover, Math.round(dx + (dw - dw2) / 2), Math.round(dy + (dh - dh2) / 2), dw2, dh2);
    } else {
      ctx.drawImage(cover, dx, dy, dw, dh);
    }
  }
  // 题图底部虚化渐隐：逐行覆盖宣纸色（alpha 0→0.95），人物完整不裁切且下缘融入卷面
  const fadeY = dy + dh - 24;
  for (let i = 0; i < 24; i += 1) {
    ctx.fillStyle = 'rgba(246, 241, 234, ' + ((i / 24) * 0.95).toFixed(3) + ')';
    ctx.fillRect(dx, fadeY + i, dw, 1);
  }

  // kicker（朱砂小字）
  ctx.textAlign = 'center';
  ctx.fillStyle = '#A34A3E';
  ctx.font = '10px ' + SANS;
  ctx.fillText(share.kicker, W / 2, 164);

  // 标题（宋体大字，最多一行）
  ctx.fillStyle = INK;
  ctx.font = 'bold 19px ' + SONG;
  ctx.fillText(clipText(share.title, 19, 208, true), W / 2, 190);

  // 摘要（淡墨，最多两行）
  ctx.fillStyle = '#5F5A52';
  ctx.font = '11px ' + SANS;
  const rows = wrapText(share.desc, 11, 196, 2);
  rows.forEach((row, i) => ctx.fillText(row, W / 2, 212 + i * 17));

  // 淡墨分隔细线
  ctx.fillStyle = 'rgba(70, 58, 45, 0.14)';
  ctx.fillRect(36, 248, W - 72, 1);

  // 每日名句（楷体，最多两行）+ 出处
  if (share.quote) {
    ctx.fillStyle = '#3B3731';
    ctx.font = '12px ' + KAI;
    const qrows = wrapText(share.quote, 12, 196, 2);
    qrows.forEach((row, i) => ctx.fillText(row, W / 2, 266 + i * 19));
    ctx.fillStyle = '#8C857A';
    ctx.font = '9px ' + SANS;
    ctx.fillText(share.quoteSource ? `—— ${share.quoteSource}` : '', W / 2, 266 + (qrows.length - 1) * 19 + 16);
  }

  // 淡墨分隔细线
  ctx.fillStyle = 'rgba(70, 58, 45, 0.10)';
  ctx.fillRect(36, 316, W - 72, 1);

  // 落款区：太阳码/二维码（左）+ 公历/农历日期（中）+「史载」朱砂印（右）
  const cy = 330;
  const cx = 24;
  const codeImg = peekImg(share.codeImg);
  if (codeImg) {
    // 官方小程序码（圆形白底）就绪：直接绘制，微信扫一扫直达当前页
    ctx.drawImage(codeImg, cx, cy, CODE_SIZE, CODE_SIZE);
  } else {
    // 本地编码兜底：零依赖普通二维码，内容为页内路径文本
    try {
      const qr = encode(share.qrText);
      const count = qr.getModuleCount();
      const m = 4;
      const cell = Math.floor((CODE_SIZE - m * 2) / count);
      const off = Math.round((CODE_SIZE - cell * count) / 2);
      ctx.fillStyle = INK;
      for (let r = 0; r < count; r += 1) {
        for (let c = 0; c < count; c += 1) {
          if (qr.isDark(r, c)) {
            ctx.fillRect(cx + off + c * cell, cy + off + r * cell, cell + 0.3, cell + 0.3);
          }
        }
      }
    } catch (e) { /* 码文本异常时留白 */ }
  }

  ctx.textAlign = 'left';
  ctx.fillStyle = INK;
  ctx.font = '11px ' + SANS;
  ctx.fillText(share.dateText || '', 90, cy + 22);
  ctx.fillStyle = '#8C857A';
  ctx.font = '10px ' + SANS;
  ctx.fillText(share.lunarText || '', 90, cy + 42);

  // 「史载」朱砂印（assets/seal.png，114×197 竖长按比例）
  const seal = peekImg('/assets/seal.png');
  if (seal) {
    const sealH = 52;
    const sealW = Math.round(sealH * 114 / 197);
    ctx.drawImage(seal, W - RIB - 14 - sealW, cy - 2, sealW, sealH);
  }

  // 品牌行
  ctx.textAlign = 'center';
  ctx.fillStyle = '#8C857A';
  ctx.font = '10px ' + SANS;
  ctx.fillText('阅史记 · 一页一页读历史', W / 2, H - 24);
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
  open, close, save, saveFallback, drawPoster, attachCanvas, encode, qrTextOf,
  dailyQuote, lunarText, dateText, resetImgs,
  FALLBACK_IMG, CANVAS_ID, CANVAS_SIZE: W, CANVAS_HEIGHT: H, SCALE
};
