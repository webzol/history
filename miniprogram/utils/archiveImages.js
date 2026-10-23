// 资料库分类题图：复用本地绘画/缩略图，只做分类或栏目题图。
// 条目本身没有图片字段，避免把某张时代画误配成具体人物/事件配图。
const GROUP_COVERS = {
  cards: '/assets/scroll-accent.png',
  people: '/assets/thumbs/tang-1.jpg',
  events: '/assets/thumbs/ming-2.jpg',
  docs: '/assets/thumbs/song-2.jpg',
  poems: '/assets/thumbs/republic-1.jpg'
};

const CARD_COVERS = {
  '5': '/assets/tang-bg.jpg',
  '14': '/assets/paintings/ming.jpg',
  '6': '/assets/paintings/han.jpg',
  '7': '/assets/paintings/han.jpg',
  '13': '/assets/paintings/landscape.jpg',
  '4': '/assets/paintings/ming.jpg',
  '8': '/assets/palace.jpg',
  '12': '/assets/paintings/tang.jpg',
  '11': '/assets/paintings/ming.jpg'
};

const KIND_COVERS = {
  figures: '/assets/paintings/tang.jpg',
  emperors: '/assets/paintings/tang.jpg',
  events: '/assets/paintings/ming.jpg',
  wars: '/assets/paintings/ming.jpg',
  dynasty: '/assets/paintings/han.jpg',
  quotes: '/assets/paintings/song.jpg',
  wenyan: '/assets/paintings/song.jpg',
  poemquotes: '/assets/paintings/landscape.jpg',
  'poems-shi': '/assets/paintings/landscape.jpg',
  'poems-ci': '/assets/paintings/landscape.jpg',
  'poems-wen': '/assets/paintings/landscape.jpg',
  'poems-qu': '/assets/paintings/landscape.jpg',
  'poems-fu': '/assets/paintings/landscape.jpg'
};

const FALLBACK = '/assets/palace.jpg';

function groupCover(key) {
  return GROUP_COVERS[key] || FALLBACK;
}

function cover(kind, type) {
  if (kind === 'cards') {
    return CARD_COVERS[type] || '/assets/tang-bg.jpg';
  }
  return KIND_COVERS[kind] || FALLBACK;
}

module.exports = { groupCover, cover };
