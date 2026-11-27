// 原画和缩略图仍保存在仓库，按页面从 CDN 加载。宫阙兜底保留在主包。
const REPO_PATH = '/gh/webzol/history@main/miniprogram';
const ART_HOST = 'https://testingcf.jsdelivr.net';
const IMG_HOST = 'https://gcore.jsdelivr.net';
const IMG_BASE = IMG_HOST + REPO_PATH + '/data/img';

function artAsset(path) {
  return ART_HOST + REPO_PATH + path;
}

const ERA_IMAGES = {
  上古: artAsset('/assets/paintings/shanggu.jpg'),
  夏: artAsset('/assets/paintings/xia.jpg'),
  商: artAsset('/assets/paintings/shang.jpg'),
  西周: artAsset('/assets/paintings/zhou.jpg'),
  春秋: artAsset('/assets/paintings/chunqiu.jpg'),
  战国: artAsset('/assets/paintings/zhanguo.jpg'),
  秦: artAsset('/assets/paintings/qin.jpg'),
  东汉: artAsset('/assets/paintings/han.jpg'),
  西汉: artAsset('/assets/paintings/han.jpg'),
  三国: artAsset('/assets/paintings/sanguo.jpg'),
  西晋: artAsset('/assets/paintings/xijin.jpg'),
  东晋: artAsset('/assets/paintings/dongjin.jpg'),
  南北朝: artAsset('/assets/paintings/nanbeichao.jpg'),
  隋: artAsset('/assets/paintings/sui.jpg'),
  五代十国: artAsset('/assets/paintings/wudai.jpg'),
  唐: artAsset('/assets/paintings/tang.jpg'),
  北宋: artAsset('/assets/paintings/song.jpg'),
  南宋: artAsset('/assets/paintings/song.jpg'),
  辽: artAsset('/assets/paintings/liao.jpg'),
  西夏: artAsset('/assets/paintings/xixia.jpg'),
  金: artAsset('/assets/paintings/jin.jpg'),
  元: artAsset('/assets/paintings/yuan.jpg'),
  明: artAsset('/assets/paintings/ming.jpg'),
  清: artAsset('/assets/paintings/qing.jpg'),
  晚清: artAsset('/assets/paintings/qing.jpg'),
  民国: artAsset('/assets/paintings/landscape.jpg'),
  新中国: artAsset('/assets/paintings/modern.jpg'),
  近现代: artAsset('/assets/paintings/landscape.jpg'),
  现代: artAsset('/assets/paintings/modern.jpg')
};

const FALLBACK = '/assets/palace.jpg';

// 人物缩略图：每个时代从原画裁 4 个细部（assets/thumbs/*-1..4.jpg），按行序轮换避免整列重复
// 民国/近现代用《千里江山图》山河底色（与「我的」横幅同源），避免把 1949 开国大典错配给鲁迅、辛亥革命
const THUMB_BASE = {
  上古: 'shanggu',
  夏: 'xia',
  商: 'shang',
  西周: 'zhou',
  春秋: 'chunqiu',
  战国: 'zhanguo',
  秦: 'qin',
  东汉: 'han',
  西汉: 'han',
  三国: 'sanguo',
  西晋: 'xijin',
  东晋: 'dongjin',
  南北朝: 'nanbeichao',
  隋: 'sui',
  五代十国: 'wudai',
  唐: 'tang',
  北宋: 'song',
  南宋: 'song',
  辽: 'liao',
  西夏: 'xixia',
  金: 'jin',
  元: 'yuan',
  明: 'ming',
  清: 'qing',
  晚清: 'qing',
  民国: 'republic',
  新中国: 'modern',
  近现代: 'republic',
  现代: 'modern'
};

const THUMB_FALLBACK = '/assets/palace.jpg';

function eraImage(era) {
  return ERA_IMAGES[era] || FALLBACK;
}

function personThumb(era, index) {
  const base = THUMB_BASE[era];
  if (!base) return THUMB_FALLBACK;
  const n = (Math.abs(parseInt(index, 10) || 0) % 4) + 1;
  return artAsset(`/assets/thumbs/${base}-${n}.jpg`);
}

// 事件级专属配图（assets/eventart/<id>.jpg，280×280 方图）：
// 标志性史事优先用自己的名场面/古画，没有专属图的事件回退朝代级 eraImage(era)。
// 由 tools/add_event_art.py 下载（「只搜图，不画图」约定，授权见 paintings/SOURCES.md）。
const EVENT_ART = {
  'chibi': artAsset('/assets/eventart/chibi.jpg'),         // 赤壁之战（火攻名场面）
  'qin-unify': artAsset('/assets/eventart/qin-unify.jpg'), // 秦始皇统一六国
  'zhenghe-1405': artAsset('/assets/eventart/zhenghe.jpg'), // 郑和首下西洋（宝船队）
  'dayunhe': artAsset('/assets/eventart/dayunhe.jpg'),     // 隋·开凿大运河
  'humen-1839': artAsset('/assets/eventart/humen.jpg'),    // 虎门销烟
  'han-wudi': artAsset('/assets/eventart/han-wudi.jpg')   // 汉武帝即位
};

// 人物级专属配图（assets/personart/<id>.jpg，480×360 q58）：
// 标志性人物页头卡底纹与事件页「其时其人」行图优先用专属人物图；
// 没有专属图的人物回退朝代级（eraImage / personThumb）。由 tools/add_person_art.py 下载。
const PERSON_ART = {
  'han-wudi': artAsset('/assets/personart/wudi.jpg'),      // 汉武帝
  'wei-qing': artAsset('/assets/personart/wei-qing.jpg'),  // 卫青
  'zhang-qian': artAsset('/assets/personart/zhang-qian.jpg'), // 张骞（出使西域驼队）
  'huo-qubing': artAsset('/assets/personart/huo-qubing.jpg')  // 霍去病
};

// 人物头卡底纹（人物页全幅 46% 透明垫底）：专属 480×360 人物图 > 朝代画
// 人物小图（事件页「其时其人」104rpx 行首）：专属 160×160 细部缩略 > 朝代细部轮换
const PERSON_THUMB = {
  'han-wudi': artAsset('/assets/thumbs/wudi.jpg'),
  'wei-qing': artAsset('/assets/thumbs/wei-qing.jpg'),
  'zhang-qian': artAsset('/assets/thumbs/zhang-qian.jpg'),
  'huo-qubing': artAsset('/assets/thumbs/huo-qubing.jpg')
};

// 全量专属图（2026-10-23）：本地表之外的 id 走 GitHub 远端
// miniprogram/data/img/{persons,events}/<id>.jpg（packOptions 排除出主包，jsDelivr 直出，
// 清单由 tools/add_all_art.py 生成）。取图优先级：本地专属 > 远端专属 > 朝代级。
// 2026-10-24：cdn.jsdelivr.net 对图片二进制一律 301 跳 raw.githubusercontent.com（国内不可达），
// 改走 gcore.jsdelivr.net 直出；altArt 供 <image binderror> 换 testingcf 备用域名重试一次。
const REMOTE_ART = require('./artRemote.js');

function remotePerson(id) {
  return REMOTE_ART.persons.indexOf(id) >= 0 ? IMG_BASE + '/persons/' + id + '.jpg' : '';
}

function remoteEvent(id) {
  return REMOTE_ART.events.indexOf(id) >= 0 ? IMG_BASE + '/events/' + id + '.jpg' : '';
}

// 远端图加载失败时换备用 jsDelivr 域名重试；非远端图或已重试过则返回 ''（放弃，露出垫底图）
function altArt(src) {
  if (typeof src !== 'string') return '';
  if (src.startsWith(ART_HOST + REPO_PATH + '/assets/')) {
    return 'https://cdn.jsdelivr.net' + src.slice(ART_HOST.length);
  }
  if (src.startsWith(IMG_BASE + '/')) return ART_HOST + src.slice(IMG_HOST.length);
  return '';
}

function nextArt(src) {
  return altArt(src) || (typeof src === 'string' && src.startsWith('https://') ? FALLBACK : '');
}

function personImage(id, era) {
  return PERSON_ART[id] || remotePerson(id) || eraImage(era);
}

function personImageThumb(id, era, index) {
  // 人物整幅画优先（本地 480×360 > 远端 480×360），细部裁切只是兜底——
  // 细部是画上抠的局部，可能只有题字/山水碎片，认不出人
  return PERSON_ART[id] || remotePerson(id) || PERSON_THUMB[id] || personThumb(era, index);
}

function eventImage(id, era) {
  return EVENT_ART[id] || remoteEvent(id) || eraImage(era);
}

module.exports = {
  ERA_IMAGES, FALLBACK, THUMB_BASE, THUMB_FALLBACK,
  EVENT_ART, PERSON_ART, PERSON_THUMB, IMG_BASE, artAsset, eraImage, personThumb, eventImage, personImage, personImageThumb, altArt, nextArt, remotePerson, remoteEvent
};
