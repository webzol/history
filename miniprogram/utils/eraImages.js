// 时代配图：按事件/人物所属时代取画画局部（与发现页朝代卡同源，见 assets/paintings/SOURCES.md）
// 无对应绘制的时代（辽/西夏/金等）回退到首页同款水墨宫阙 palace.jpg
const ERA_IMAGES = {
  西汉: '/assets/paintings/han.jpg',
  唐: '/assets/paintings/tang.jpg',
  北宋: '/assets/paintings/song.jpg',
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
  西汉: 'han',
  唐: 'tang',
  北宋: 'song',
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

module.exports = { ERA_IMAGES, FALLBACK, THUMB_BASE, THUMB_FALLBACK, eraImage, personThumb };
