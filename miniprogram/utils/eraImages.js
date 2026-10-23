// 时代配图：按事件/人物所属时代取画画局部（与发现页朝代卡同源，见 assets/paintings/SOURCES.md）
// 无对应绘制的时代回退到首页同款水墨宫阙 palace.jpg（2026-10-23 补全 15+2 张朝代画后，已知时代不再回退）；标志性事件另有事件级专属图（eventImage，assets/eventart/）
const ERA_IMAGES = {
  上古: '/assets/paintings/shanggu.jpg',
  夏: '/assets/paintings/xia.jpg',
  商: '/assets/paintings/shang.jpg',
  西周: '/assets/paintings/zhou.jpg',
  春秋: '/assets/paintings/chunqiu.jpg',
  战国: '/assets/paintings/zhanguo.jpg',
  秦: '/assets/paintings/qin.jpg',
  东汉: '/assets/paintings/han.jpg',
  西汉: '/assets/paintings/han.jpg',
  三国: '/assets/paintings/sanguo.jpg',
  西晋: '/assets/paintings/xijin.jpg',
  东晋: '/assets/paintings/dongjin.jpg',
  南北朝: '/assets/paintings/nanbeichao.jpg',
  隋: '/assets/paintings/sui.jpg',
  五代十国: '/assets/paintings/wudai.jpg',
  唐: '/assets/paintings/tang.jpg',
  北宋: '/assets/paintings/song.jpg',
  南宋: '/assets/paintings/song.jpg',
  辽: '/assets/paintings/liao.jpg',
  西夏: '/assets/paintings/xixia.jpg',
  金: '/assets/paintings/jin.jpg',
  元: '/assets/paintings/yuan.jpg',
  明: '/assets/paintings/ming.jpg',
  清: '/assets/paintings/qing.jpg',
  晚清: '/assets/paintings/qing.jpg',
  民国: '/assets/paintings/landscape.jpg',
  新中国: '/assets/paintings/modern.jpg',
  近现代: '/assets/paintings/landscape.jpg',
  现代: '/assets/paintings/modern.jpg'
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
  return `/assets/thumbs/${base}-${n}.jpg`;
}

// 事件级专属配图（assets/eventart/<id>.jpg，280×280 方图）：
// 标志性史事优先用自己的名场面/古画，没有专属图的事件回退朝代级 eraImage(era)。
// 由 tools/add_event_art.py 下载（「只搜图，不画图」约定，授权见 paintings/SOURCES.md）。
const EVENT_ART = {
  'chibi': '/assets/eventart/chibi.jpg',         // 赤壁之战（火攻名场面）
  'qin-unify': '/assets/eventart/qin-unify.jpg', // 秦始皇统一六国
  'zhenghe-1405': '/assets/eventart/zhenghe.jpg', // 郑和首下西洋（宝船队）
  'dayunhe': '/assets/eventart/dayunhe.jpg',     // 隋·开凿大运河
  'humen-1839': '/assets/eventart/humen.jpg',    // 虎门销烟
  'han-wudi': '/assets/eventart/han-wudi.jpg'   // 汉武帝即位
};

// 人物级专属配图（assets/personart/<id>.jpg，480×360 q58）：
// 标志性人物页头卡底纹与事件页「其时其人」行图优先用专属人物图；
// 没有专属图的人物回退朝代级（eraImage / personThumb）。由 tools/add_person_art.py 下载。
const PERSON_ART = {
  'han-wudi': '/assets/personart/wudi.jpg',      // 汉武帝
  'wei-qing': '/assets/personart/wei-qing.jpg',  // 卫青
  'zhang-qian': '/assets/personart/zhang-qian.jpg', // 张骞（出使西域驼队）
  'huo-qubing': '/assets/personart/huo-qubing.jpg'  // 霍去病
};

// 人物头卡底纹（人物页全幅 46% 透明垫底）：专属 480×360 人物图 > 朝代画
function personImage(id, era) {
  return PERSON_ART[id] || eraImage(era);
}

// 人物小图（事件页「其时其人」104rpx 行首）：专属 160×160 细部缩略 > 朝代细部轮换
const PERSON_THUMB = {
  'han-wudi': '/assets/thumbs/wudi.jpg',
  'wei-qing': '/assets/thumbs/wei-qing.jpg',
  'zhang-qian': '/assets/thumbs/zhang-qian.jpg',
  'huo-qubing': '/assets/thumbs/huo-qubing.jpg'
};

function personImageThumb(id, era, index) {
  return PERSON_THUMB[id] || personThumb(era, index);
}

function eventImage(id, era) {
  return EVENT_ART[id] || eraImage(era);
}

module.exports = {
  ERA_IMAGES, FALLBACK, THUMB_BASE, THUMB_FALLBACK,
  EVENT_ART, PERSON_ART, PERSON_THUMB, eraImage, personThumb, eventImage, personImage, personImageThumb
};
