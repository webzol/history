const { artAsset } = require('./eraImages.js');
// 资料库分类题图：复用仓库绘画和缩略图，只做分类或栏目题图。
// 条目本身没有图片字段，避免把某张时代画误配成具体人物/事件配图。
const GROUP_COVERS = {
  cards: '/assets/scroll-accent.jpg',
  people: artAsset('/assets/thumbs/tang-1.jpg'),
  events: artAsset('/assets/thumbs/ming-2.jpg'),
  docs: artAsset('/assets/thumbs/song-2.jpg'),
  poems: artAsset('/assets/thumbs/republic-1.jpg')
};

const CARD_COVERS = {
  '5': '/assets/tang-bg.jpg',
  '14': artAsset('/assets/paintings/ming.jpg'),
  '6': artAsset('/assets/paintings/han.jpg'),
  '7': artAsset('/assets/paintings/han.jpg'),
  '13': artAsset('/assets/paintings/landscape.jpg'),
  '4': artAsset('/assets/paintings/ming.jpg'),
  '8': '/assets/palace.jpg',
  '12': artAsset('/assets/paintings/tang.jpg'),
  '11': artAsset('/assets/paintings/ming.jpg')
};

const KIND_COVERS = {
  figures: artAsset('/assets/paintings/tang.jpg'),
  emperors: artAsset('/assets/paintings/tang.jpg'),
  events: artAsset('/assets/paintings/ming.jpg'),
  wars: artAsset('/assets/paintings/ming.jpg'),
  dynasty: artAsset('/assets/paintings/han.jpg'),
  quotes: artAsset('/assets/paintings/song.jpg'),
  wenyan: artAsset('/assets/paintings/song.jpg'),
  poemquotes: artAsset('/assets/paintings/landscape.jpg'),
  'poems-shi': artAsset('/assets/paintings/landscape.jpg'),
  'poems-ci': artAsset('/assets/paintings/landscape.jpg'),
  'poems-wen': artAsset('/assets/paintings/landscape.jpg'),
  'poems-qu': artAsset('/assets/paintings/landscape.jpg'),
  'poems-fu': artAsset('/assets/paintings/landscape.jpg')
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
