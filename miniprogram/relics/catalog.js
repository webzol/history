const TYPES = ['青铜', '陶瓷', '玉器', '书画'];
const ERAS = ['新石器时代', '二里头文化', '商', '汉', '唐', '宋', '明'];

const RELICS = [
  {
    id: '60514', title: '青铜鼎', type: '青铜', eras: ['商'], period: '商', date: '公元前13至12世纪',
    imageRatio: 75.102,
    material: '青铜', dimensions: '通高20.3厘米，口径17.1厘米', accession: '2001.210',
    description: '两耳立在口沿，三足托起圆腹。鼎原可用来烹煮、盛放食物，在商代礼仪中也用来陈设祭品。'
  },
  {
    id: 'cma-1989.150', title: '青铜斝', type: '青铜', eras: ['二里头文化'], period: '二里头文化', date: '约公元前1700至前1500年',
    imageRatio: 107.93,
    material: '青铜', dimensions: '高24厘米', accession: '1989.150',
    description: '斝是一种温酒器。这件斝的宽口上立着两根柱，三条长足把器腹架高。馆方将它归入二里头文化，认为可能来自河南。'
  },
  {
    id: '44757', title: '良渚文化玉璧', type: '玉器', eras: ['新石器时代'], period: '新石器时代 · 良渚文化', shortPeriod: '新石器时代', date: '公元前3千纪中叶',
    imageRatio: 75.102,
    material: '软玉', dimensions: '直径21.3厘米', accession: '1986.112',
    description: '玉璧呈圆盘形，中间开孔。将玉料磨成薄而平整的圆盘，再磨出圆孔，需要细致加工。良渚墓葬中常可见到这类玉器。'
  },
  {
    id: '39919', title: '米芾《吴江舟中诗》', type: '书画', eras: ['宋'], period: '北宋', date: '约公元1095年',
    imageRatio: 43.265,
    material: '纸本墨书，手卷', dimensions: '31.1 × 556.9厘米', accession: '1984.174', imageNote: '手卷局部',
    description: '米芾以草书写下舟中诗。卷中笔势有快慢，字形倾侧、大小不一，连缀起来却自有节奏。手卷通常由右向左逐段展开。'
  },
  {
    id: '49368', title: '三彩陶骆驼俑', type: '陶瓷', eras: ['唐'], period: '唐', date: '公元8世纪',
    imageRatio: 142.029,
    material: '三彩釉陶', dimensions: '高37.1厘米，宽11.9厘米，长27.9厘米', accession: '67.43.1',
    description: '这件陶俑塑出双峰驼昂首站立的姿态。骆驼是古代长途运输的役畜，唐代墓葬也常用陶俑表现它的形象。'
  },
  {
    id: '42480', title: '龙泉窑青釉盖罐', type: '陶瓷', eras: ['宋'], period: '南宋', date: '公元12至13世纪',
    imageRatio: 66.531,
    material: '青釉瓷质器，釉下刻饰及立体装饰', dimensions: '连盖高25.4厘米', accession: '34.113.4a, b',
    description: '罐身和盖子施青釉，器身有刻饰，罐盖附近还有立体装饰。顺着釉色看起伏，可以分辨刻入胎体的线条与突起的造型。'
  },
  {
    id: '53561', title: '青铜爵', type: '青铜', eras: ['商'], period: '商', date: '公元前12至11世纪',
    imageRatio: 133.515,
    material: '青铜', dimensions: '高19.7厘米', accession: '1974.289.5',
    description: '前端伸出长流，后端上翘，器身下有三足。顺着长流可以辨出倾倒酒液的方向，也能看出爵与斝的器形差别。'
  },
  {
    id: '49376', title: '玉璋', type: '玉器', eras: ['新石器时代', '商'], period: '新石器时代至商', date: '公元前2千纪',
    imageRatio: 133.152,
    material: '软玉', dimensions: '长35.2厘米，宽8.3厘米，厚0.6厘米', accession: '30.120.124',
    description: '璋体扁长，刃端内弧，窄端有一小孔。馆方将它归入礼仪用器，并将年代定在新石器时代至商这一较宽的范围。'
  },
  {
    id: '72544', title: '金饰玉梳', type: '玉器', eras: ['汉'], period: '东汉', date: '公元25至220年',
    imageRatio: 82.449,
    material: '软玉、金', dimensions: '高5.1厘米，长7.6厘米', accession: '2004.322',
    description: '梳背上嵌着金饰，下方是一排细密的玉梳齿。金与玉在一件小器物上相接，可以从梳背细看两种材料的处理。'
  },
  {
    id: '42514', title: '龙泉窑青釉刻牡丹纹盘', type: '陶瓷', eras: ['明'], period: '明', date: '公元14世纪晚期至15世纪初',
    imageRatio: 75.102,
    material: '青釉炻器，釉下刻纹', dimensions: '高8.9厘米，口径50.8厘米', accession: '1984.358',
    description: '盘径超过半米，盘心刻牡丹，外围的纹线从盘心向盘沿展开。青釉覆在刻纹上，花纹随釉层深浅显现。'
  },
  {
    id: '45684', title: '沈周《赠汉文诗》', type: '书画', eras: ['明'], period: '明', date: '公元1493年',
    imageRatio: 52.041,
    material: '洒金纸本墨书，扇面装册', dimensions: '16.5 × 47厘米', accession: '1989.363.47',
    description: '沈周将行书布在折扇形的纸面上。字虽小，横斜伸展的笔画仍能看出馆方所说的黄庭坚书风。'
  },
  {
    id: '45685', title: '沈周《四季花卉图》', type: '书画', eras: ['明'], period: '明', date: '公元15世纪至16世纪初',
    imageRatio: 42.449,
    material: '纸本设色，手卷', dimensions: '27.5 × 504.8厘米', accession: '1982.205', imageNote: '手卷局部',
    description: '沈周把不同季节的花草画在同一手卷中。顺着枝叶的转折看，深浅不一的叶片与细线勾出的花瓣各有层次。'
  }
];

function imagePath(id, size) {
  return `/relics/assets/${size}-${id}.jpg`;
}

function sourceFor(id) {
  if (id === 'cma-1989.150') {
    return { museum: '克利夫兰艺术博物馆', url: 'https://www.clevelandart.org/art/1989.150' };
  }
  return { museum: '大都会艺术博物馆', url: `https://www.metmuseum.org/art/collection/search/${id}` };
}

module.exports = { TYPES, ERAS, RELICS, imagePath, sourceFor };
