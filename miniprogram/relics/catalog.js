const TYPES = ['青铜', '陶瓷', '玉器', '书画'];
const ERAS = ['新石器时代', '二里头文化', '商', '西周', '东周', '汉', '北魏', '隋', '唐', '宋', '元', '明', '清'];

// 按年代先后排列。以文物本体的形制与用途为主，馆方的断代与出土地随文说明。
// imageRatio = 详情图 高/宽 × 100，须与 tools/prepare_relic_images.py 的输出一致（改图须同步改这里）。
const RELICS = [
  {
    id: '44757', title: '良渚文化玉璧', type: '玉器', eras: ['新石器时代'], period: '新石器时代 · 良渚文化', shortPeriod: '新石器时代', date: '公元前3千纪中叶',
    imageRatio: 75.102,
    material: '软玉', dimensions: '直径21.3厘米', accession: '1986.112',
    description: '玉璧呈圆盘形，中间开孔。将玉料磨成薄而平整的圆盘，再磨出圆孔，需要细致加工。良渚墓葬中常可见到这类玉器。'
  },
  {
    id: 'cma-1953.628', title: '红山文化玉人', type: '玉器', eras: ['新石器时代'], period: '新石器时代 · 红山文化', shortPeriod: '新石器时代', date: '约公元前4700至前2920年',
    imageRatio: 147.59,
    material: '软玉', dimensions: '高14.6厘米，宽6厘米', accession: '1953.628',
    description: '玉人作坐姿，头部为牛首，顶上生出四角。两肩上方钻出一对相通的小孔，可以穿绳悬佩。这类玉器出自东北地区的红山文化，一般认为与当时的原始信仰有关。'
  },
  {
    id: '49376', title: '玉璋', type: '玉器', eras: ['新石器时代', '商'], period: '新石器时代至商', date: '公元前2千纪',
    imageRatio: 133.152,
    material: '软玉', dimensions: '长35.2厘米，宽8.3厘米，厚0.6厘米', accession: '30.120.124',
    description: '璋体扁长，刃端内弧，窄端有一小孔。馆方将它归入礼仪用器，并将年代定在新石器时代至商这一较宽的范围。'
  },
  {
    id: 'cma-1989.150', title: '青铜斝', type: '青铜', eras: ['二里头文化'], period: '二里头文化', date: '约公元前1700至前1500年',
    imageRatio: 107.93,
    material: '青铜', dimensions: '高24厘米', accession: '1989.150',
    description: '斝是一种温酒器。这件斝的宽口上立着两根柱，三条长足把器腹架高。馆方将它归入二里头文化，认为可能来自河南。'
  },
  {
    id: '60514', title: '青铜鼎', type: '青铜', eras: ['商'], period: '商', date: '公元前13至12世纪',
    imageRatio: 75.102,
    material: '青铜', dimensions: '通高20.3厘米，口径17.1厘米', accession: '2001.210',
    description: '两耳立在口沿，三足托起圆腹。鼎原可用来烹煮、盛放食物，在商代礼仪中也用来陈设祭品。'
  },
  {
    id: '53561', title: '青铜爵', type: '青铜', eras: ['商'], period: '商', date: '公元前12至11世纪',
    imageRatio: 133.515,
    material: '青铜', dimensions: '高19.7厘米', accession: '1974.289.5',
    description: '前端伸出长流，后端上翘，器身下有三足。顺着长流可以辨出倾倒酒液的方向，也能看出爵与斝的器形差别。'
  },
  {
    id: '44617', title: '青铜簋', type: '青铜', eras: ['商'], period: '商', date: '公元前12世纪',
    imageRatio: 75.102,
    material: '青铜', dimensions: '高11.7厘米，双耳间宽23.5厘米，口径15.9厘米', accession: '62.217',
    description: '簋是盛放煮熟的黍稷一类饭食的器皿。这件簋的双耳安在器身两侧，下接圈足。商代墓葬中，簋常与鼎等食器成套随葬。'
  },
  {
    id: '748361', title: '商代蟠龙形玉佩', type: '玉器', eras: ['商'], period: '商', date: '公元前13至12世纪',
    imageRatio: 74.898,
    material: '软玉', dimensions: '直径4.4厘米，厚1厘米', accession: '2019.193.1',
    description: '玉佩的龙身蜷曲成环，首尾相接，环中留出一孔。商代玉器多用这类卷曲的动物造型，或作佩饰，或用于礼仪。'
  },
  {
    id: '42176', title: '青铜角', type: '青铜', eras: ['西周'], period: '西周', date: '公元前11世纪晚期',
    imageRatio: 133.152,
    material: '青铜', dimensions: '高20厘米，口沿宽14.6厘米，腹深6.4厘米', accession: '24.72.13',
    description: '角是饮酒器，口沿两端分别作流和尾，口上立两根短柱，器身下有三足。这件角与同一批入藏的西周礼器同号著录。'
  },
  {
    id: '42167', title: '青铜尊', type: '青铜', eras: ['西周'], period: '西周', date: '公元前11世纪晚期',
    imageRatio: 116.114,
    material: '青铜', dimensions: '高34.9厘米，口径28.3厘米，足径17.5厘米', accession: '24.72.4',
    description: '尊是盛酒器，用来盛放祭祀用的酒。这件尊的口沿向外展开，器身下承圈足，与同一批入藏的西周礼器同号著录。'
  },
  {
    id: '53558', title: '西周青铜簋', type: '青铜', eras: ['西周'], period: '西周', date: '公元前10世纪',
    imageRatio: 75.102,
    material: '青铜', dimensions: '高15.2厘米，宽30.5厘米，口径20.6厘米', accession: '13.100.155',
    description: '簋是盛放食物的礼器。这件簋的两侧有宽大的环耳，腹部饰成排凸起的纹样，下承圈足。'
  },
  {
    id: '44734', title: '青铜敦', type: '青铜', eras: ['东周'], period: '东周', date: '公元前6世纪初',
    imageRatio: 75.102,
    material: '青铜', dimensions: '高20.3厘米，直径27厘米', accession: '1992.165.24a, b',
    description: '敦是盛食用器。这件敦的盖和器身相合，形成鼓圆的轮廓，侧面带环耳，下方有短足。'
  },
  {
    id: '44784', title: '青铜豆', type: '青铜', eras: ['东周'], period: '东周', date: '公元前6世纪末至前5世纪初',
    imageRatio: 133.515,
    material: '青铜', dimensions: '通高26.7厘米，口径18.4厘米，足径12.4厘米', accession: '25.20.2a, b',
    description: '豆是盛放腌菜、肉酱一类食物的器皿，上为浅盘，下接柄和底座。这件豆带盖，馆方把年代定在春秋晚期至战国早期。'
  },
  {
    id: '39762', title: '青铜钮钟', type: '青铜', eras: ['东周'], period: '东周', date: '公元前5世纪',
    imageRatio: 133.515,
    material: '青铜', dimensions: '高29.8厘米，宽17.8厘米，厚11.4厘米', accession: '1997.442.8',
    description: '钟顶立有供悬挂的钮，钟面分布着成组的突起。礼仪场合可将这一类钟悬挂起来，从外部敲击。'
  },
  {
    id: '61403', title: '交龙纹铜镜', type: '青铜', eras: ['东周'], period: '战国', date: '公元前5至前4世纪',
    imageRatio: 86.531,
    material: '青铜', dimensions: '直径13.3厘米', accession: '23.120.5',
    description: '铜镜背面铸出相互盘绕的龙纹，镜钮居中，纹饰在镜背上铺满一圈。战国时期的铜镜用于照容，背面常饰这类动物纹样。'
  },
  {
    id: '75242', title: '战国龙形玉佩', type: '玉器', eras: ['东周'], period: '战国', date: '公元前5世纪',
    imageRatio: 133.515,
    material: '软玉', dimensions: '长10.8厘米，高2.5厘米', accession: '2009.94',
    description: '玉佩作龙形，龙首生角，龙身向上卷起。战国时期的玉作坊常用蟠曲的龙形制佩，这件器物用透闪石软玉琢成。'
  },
  {
    id: '39637', title: '战国蟠结龙纹玉环', type: '玉器', eras: ['东周'], period: '战国', date: '公元前3世纪',
    imageRatio: 111.364,
    material: '软玉', dimensions: '高7.9厘米，宽5.2厘米', accession: '1985.214.99',
    description: '环体由一条蟠结的龙绕成，龙首与爪在环上转折相接，龙身各处用阴线刻出细部。'
  },
  {
    id: 'cma-1952.571.2', title: '兽面纹玉璜', type: '玉器', eras: ['东周', '汉'], period: '战国至西汉', date: '约公元前300至前100年',
    imageRatio: 64.082,
    material: '软玉', dimensions: '长12.8厘米', accession: '1952.571.2',
    description: '这件玉佩呈弧形，两端收窄。馆方依据纹饰将其辨作兽面与交缠兽带纹，细线沿着弧面展开。'
  },
  {
    id: '74527', title: '战国至西汉玉璧', type: '玉器', eras: ['东周', '汉'], period: '战国至西汉', date: '公元前3至前2世纪',
    imageRatio: 75.102,
    material: '玉', dimensions: '直径14.6厘米，厚1厘米', accession: '2008.287',
    description: '玉璧作圆板形，中心开圆孔，器面光素。璧在先秦两汉的礼仪中用作礼器，也见于墓葬随葬。'
  },
  {
    id: '61094', title: '青铜奔兽纹壶', type: '青铜', eras: ['汉'], period: '西汉', date: '公元前3至前2世纪',
    imageRatio: 133.515,
    material: '青铜', dimensions: '高28.9厘米，直径22.9厘米', accession: '18.56.6',
    description: '这是一件酒器，壶颈收窄，腹部浑圆。奔兽纹沿器身排列，侧面环耳与宽腹形成鲜明的轮廓。'
  },
  {
    id: '39523', title: '彩绘陶女俑', type: '陶瓷', eras: ['汉'], period: '西汉', date: '公元前2世纪',
    imageRatio: 109.865,
    material: '彩绘陶', dimensions: '高68.6厘米', accession: '1997.1.1',
    description: '陶俑双手在身前相合，长衣下摆外张。衣缘仍能看见彩绘痕迹，和塑出的衣褶一起交代服饰层次。'
  },
  {
    id: '49900', title: '绿釉陶罐', type: '陶瓷', eras: ['汉'], period: '西汉', date: '公元前1世纪',
    imageRatio: 96.327,
    material: '绿釉陶', dimensions: '高30.5厘米', accession: '17.154',
    description: '罐身圆腹，口沿收紧。大都会将胎体记为陶，外施绿釉，肩部的纹带沿罐身环绕。'
  },
  {
    id: '72544', title: '金饰玉梳', type: '玉器', eras: ['汉'], period: '东汉', date: '公元25至220年',
    imageRatio: 82.449,
    material: '软玉、金', dimensions: '高5.1厘米，长7.6厘米', accession: '2004.322',
    description: '梳背上嵌着金饰，下方是一排细密的玉梳齿。金与玉在一件小器物上相接，可以从梳背细看两种材料的处理。'
  },
  {
    id: '44396', title: '玉卧猪', type: '玉器', eras: ['汉'], period: '东汉', date: '公元1至2世纪',
    imageRatio: 75.102,
    material: '软玉', dimensions: '高2.9厘米，长11.4厘米', accession: '1994.605.96',
    description: '玉猪伏卧，背部连成长弧。头部和四肢用简洁的阴刻线概括，几道刻线便能辨出卧姿。'
  },
  {
    id: '44405', title: '神仙异兽纹铜镜', type: '青铜', eras: ['汉'], period: '东汉', date: '公元2世纪晚期',
    imageRatio: 95.102,
    material: '青铜', dimensions: '直径10.8厘米', accession: '1994.605.105',
    description: '镜背中央有圆钮，神仙与异兽纹围绕镜钮布置。环形边纹把中央的图案收拢在圆形镜面内。'
  },
  {
    id: 'cma-1986.46.a', title: '青铜博山炉', type: '青铜', eras: ['汉'], period: '西汉', date: '公元前200至前100年',
    imageRatio: 123.737,
    material: '青铜', dimensions: '通高18.4厘米，腹径9.9厘米', accession: '1986.46.a',
    description: '炉盖做成尖耸的山形，山间铸出人物与走兽。汉人焚香时把香料放在炉身中点燃，烟从盖上的镂孔散出，望去像山间的雾气。'
  },
  {
    id: '61050', title: '青铜灯', type: '青铜', eras: ['汉'], period: '汉', date: '约公元前206年至公元220年',
    imageRatio: 133.515,
    material: '青铜', dimensions: '高23.2厘米，直径14.6厘米', accession: '13.220.46',
    description: '灯盘宽而浅，细长的灯柱接在外撇的底座上。盘、柱和座组成简洁的照明器具。'
  },
  {
    id: 'cma-1962.216', title: '北魏官吏陶俑', type: '陶瓷', eras: ['北魏'], period: '北魏', date: '公元6世纪初',
    imageRatio: 150.307,
    material: '灰陶，带残存彩绘', dimensions: '高36厘米', accession: '1962.216',
    description: '俑戴平顶小帽，衣襟交叠，一手抬至胸前。细长的身形和下摆的竖向刻线凸显了站姿。'
  },
  {
    id: '62991', title: '釉陶骆驼俑', type: '陶瓷', eras: ['隋'], period: '隋', date: '公元6世纪晚期至7世纪',
    imageRatio: 127.273,
    material: '施釉陶，带残存彩绘', dimensions: '高37.8厘米，宽30.5厘米，厚20.3厘米', accession: '63.175.1',
    description: '骆驼立在底板上，背部的鞍具和两侧驮囊仍清楚可辨。馆方将它列为随葬陶俑。'
  },
  {
    id: '49368', title: '三彩陶骆驼俑', type: '陶瓷', eras: ['唐'], period: '唐', date: '公元8世纪',
    imageRatio: 142.029,
    material: '三彩釉陶', dimensions: '高37.1厘米，宽11.9厘米，长27.9厘米', accession: '67.43.1',
    description: '这件陶俑塑出双峰驼昂首站立的姿态。骆驼是古代长途运输的役畜，唐代墓葬也常用陶俑表现它的形象。'
  },
  {
    id: 'cma-2000.118.1', title: '三彩镇墓兽', type: '陶瓷', eras: ['唐'], period: '唐', date: '公元8世纪初',
    imageRatio: 144.543,
    material: '三彩釉陶', dimensions: '通高92.3厘米，宽43.8厘米', accession: '2000.118.1',
    description: '镇墓兽作兽面，头顶生角，蹲踞在座上，遍身竖起的尖刺加强威慑。唐三彩以铅釉低温烧成，绿、黄、白三色在窑中自然流动。这类陶塑成对放在墓中，用来镇守。'
  },
  {
    id: '42180', title: '唐代玉带饰', type: '玉器', eras: ['唐'], period: '唐', date: '公元7世纪至8世纪初',
    imageRatio: 36.327,
    material: '软玉', dimensions: '方件各5.7 × 5.7厘米，末端配件11.1 × 5.7厘米', accession: '1992.165.22a–j',
    description: '这组带饰由多块方形玉片和一块较长的端部配件组成。把它们排在一起，可以看出腰带饰件如何组合。'
  },
  {
    id: '39919', title: '米芾《吴江舟中诗》', type: '书画', eras: ['宋'], period: '北宋', date: '约公元1095年',
    imageRatio: 43.265,
    material: '纸本墨书，手卷', dimensions: '31.1 × 556.9厘米', accession: '1984.174', imageNote: '手卷局部',
    description: '米芾以草书写下舟中诗。卷中笔势有快慢，字形倾侧、大小不一，连缀起来却自有节奏。手卷通常由右向左逐段展开。'
  },
  {
    id: '39918', title: '黄庭坚《廉颇蔺相如列传》', type: '书画', eras: ['宋'], period: '北宋', date: '约公元1095年',
    imageRatio: 46.531,
    material: '纸本墨书，手卷', dimensions: '纵33.7厘米，横1840.2厘米', accession: '1989.363.4', imageNote: '手卷局部',
    description: '黄庭坚以行书写下《史记》中的这篇列传，全卷长逾十八米，字迹随书写推进而起伏，笔画中段收紧、撇捺向外送出。'
  },
  {
    id: 'cma-1961.421', title: '马麟《坐看云起图》', type: '书画', eras: ['宋'], period: '南宋', date: '约公元1256年',
    imageRatio: 41.429,
    material: '绢本墨笔，册页', dimensions: '纵25.1厘米，横25.3厘米', accession: '1961.421', imageNote: '册页',
    description: '画面中一位士人倚坐，望向山间升起的云气，题名取自王维的诗句。南宋时这类诗意图常画在绢本册页或团扇上。'
  },
  {
    id: '42480', title: '龙泉窑青釉盖罐', type: '陶瓷', eras: ['宋'], period: '南宋', date: '公元12至13世纪',
    imageRatio: 66.531,
    material: '青釉瓷质器，釉下刻饰及立体装饰', dimensions: '连盖高25.4厘米', accession: '34.113.4a, b',
    description: '罐身和盖子施青釉，器身有刻饰，罐盖附近还有立体装饰。顺着釉色看起伏，可以分辨刻入胎体的线条与突起的造型。'
  },
  {
    id: 'cma-1957.40', title: '汝窑青釉笔洗', type: '陶瓷', eras: ['宋'], period: '北宋', date: '公元11世纪晚期至1127年',
    imageRatio: 53.469,
    material: '青瓷，汝窑', dimensions: '高3.8厘米，口径12.8厘米', accession: '1957.40',
    description: '笔洗作浅盘形，通体施淡青釉，釉面开有细密的片纹。汝窑为北宋宫廷烧造的时间不长，烧成的器物数量很少，器底细小的支钉痕是它的一项特征。'
  },
  {
    id: 'cma-1948.206', title: '建窑黑釉兔毫盏', type: '陶瓷', eras: ['宋'], period: '南宋', date: '公元12至13世纪',
    imageRatio: 69.592,
    material: '黑釉瓷，建窑', dimensions: '高8.7厘米，口径17.8厘米', accession: '1948.206',
    description: '盏内壁的黑釉上泛出红褐色的条状结晶，因形似兔毛而被称作「兔毫」。这件盏的口沿原镶金属边，尺寸比常见的建盏更大。'
  },
  {
    id: 'cma-1961.92', title: '龙泉窑青釉凸龙纹盘', type: '陶瓷', eras: ['元'], period: '元', date: '公元14世纪',
    imageRatio: 99.388,
    material: '青釉炻器，龙泉窑', dimensions: '口径43.2厘米', accession: '1961.92',
    description: '盘心凸起一条盘绕的龙，周围衬以云纹和水波，盘沿环绕五瓣花，龙首前方有一颗火珠。青釉覆在凸起的纹饰上，颜色随釉层的厚薄深浅不同。'
  },
  {
    id: '40512', title: '鲜于枢《石鼓歌》', type: '书画', eras: ['元'], period: '元', date: '公元1301年',
    imageRatio: 66.531,
    material: '纸本墨书，手卷', dimensions: '书心44.9 × 459.9厘米', accession: '1989.363.29', imageNote: '手卷局部',
    description: '鲜于枢以草书抄写韩愈《石鼓歌》。字与字之间疏密有变，转折处提按分明，展开手卷可逐段看笔势。'
  },
  {
    id: 'cma-1978.66', title: '赵孟頫《江村渔乐图》', type: '书画', eras: ['元'], period: '元', date: '约公元1302至1303年',
    imageRatio: 95.714,
    material: '绢本设色，扇面装册', dimensions: '28.6 × 30厘米', accession: '1978.66',
    description: '小幅扇面在水岸之间画出渔人、树木与村居。近处枝干细密，远处坡岸铺开，青绿设色把两层景物连起来。'
  },
  {
    id: 'cma-1962.154', title: '青花双狮头罐', type: '陶瓷', eras: ['元'], period: '元', date: '公元14世纪',
    imageRatio: 94.286,
    material: '釉下彩绘瓷', dimensions: '通体39.4 × 37.5厘米，口径15.6厘米', accession: '1962.154',
    description: '这件景德镇青花罐以双狮头作耳。肩部到腹部划分出多道纹带，较宽的纹带中能看到凤鸟和花卉。'
  },
  {
    id: 'cma-1964.169', title: '青花龙纹高足杯', type: '陶瓷', eras: ['元'], period: '元', date: '公元14世纪',
    imageRatio: 94.082,
    material: '釉下青花瓷，带模印装饰', dimensions: '高11.8厘米，口径13.3厘米', accession: '1964.169',
    description: '杯沿外撇，下接高足，青花龙纹绕杯腹展开。杯身浅而足高，是这类高足杯最显眼的轮廓。'
  },
  {
    id: 'cma-1978.65', title: '倪瓒《筠石乔柯》', type: '书画', eras: ['元'], period: '元', date: '公元14世纪',
    imageRatio: 164.43,
    material: '纸本水墨，立轴', dimensions: '画心67.3 × 36.8厘米', accession: '1978.65',
    description: '画中乔木斜生，竹叶从石旁伸出。上方的题字与下部稀疏的枝叶相对，纸面保留了大片空白。'
  },
  {
    id: 'cma-1915.704', title: '宫殿图册页', type: '书画', eras: ['元'], period: '元', date: '公元1271至1368年',
    imageRatio: 92.449,
    material: '绢本设色，册页', dimensions: '画面直径26.2厘米', accession: '1915.704',
    description: '圆形画面中，楼阁、廊道和院墙沿地势错落展开。屋檐和栏杆用细线勾画，建筑间还能辨出小小的人物。'
  },
  {
    id: 'cma-1997.94', title: '王蒙《松下著书图》', type: '书画', eras: ['元'], period: '元', date: '公元14世纪',
    imageRatio: 70.408,
    material: '纸本设色，册页', dimensions: '画心39.8 × 56.9厘米', accession: '1997.94',
    description: '山石、松林和草屋层层叠起，画中人物坐在屋内。馆方指出，画右有王蒙所题的篆书，左侧另有署款与印。'
  },
  {
    id: '41912', title: '镂雕玉头饰', type: '玉器', eras: ['元', '明'], period: '元至明', date: '公元14至16世纪',
    imageRatio: 75.102,
    material: '软玉', dimensions: '高4.2厘米，宽6.4厘米，长3.8厘米', accession: '02.18.391',
    description: '饰件呈拱形，两侧逐渐收低。纹样间镂空，从正面和侧面都能看到雕刻的层次。'
  },
  {
    id: '45685', title: '沈周《四季花卉图》', type: '书画', eras: ['明'], period: '明', date: '公元15世纪至16世纪初',
    imageRatio: 42.449,
    material: '纸本设色，手卷', dimensions: '27.5 × 504.8厘米', accession: '1982.205', imageNote: '手卷局部',
    description: '沈周把不同季节的花草画在同一手卷中。顺着枝叶的转折看，深浅不一的叶片与细线勾出的花瓣各有层次。'
  },
  {
    id: '45684', title: '沈周《赠汉文诗》', type: '书画', eras: ['明'], period: '明', date: '公元1493年',
    imageRatio: 52.041,
    material: '洒金纸本墨书，扇面装册', dimensions: '16.5 × 47厘米', accession: '1989.363.47',
    description: '沈周将行书布在折扇形的纸面上。字虽小，横斜伸展的笔画仍能看出馆方所说的黄庭坚书风。'
  },
  {
    id: '45797', title: '陈淳花卉册页', type: '书画', eras: ['明'], period: '明', date: '公元1540年',
    imageRatio: 56.735,
    material: '纸本设色，册页', dimensions: '每开约33 × 57厘米', accession: '1986.266.1a–u', imageNote: '册页选开',
    description: '册中收花卉十六开，另附书迹一开。每开画一种花草，用墨色的深浅分出花瓣与叶片，枝叶的走向各有差别。'
  },
  {
    id: 'cma-1954.582', title: '杜堇《陪月闲行图》', type: '书画', eras: ['明'], period: '明', date: '公元15世纪晚期',
    imageRatio: 211.207,
    material: '纸本设色，立轴', dimensions: '纵156.4厘米，横72.4厘米', accession: '1954.582',
    description: '画中一位文人在月下踱步，身后是梅树和坡石。原题画的是北宋诗人林逋，他在西湖边隐居，以梅为妻、以鹤为子。'
  },
  {
    id: '43778', title: '镂雕玉带牌', type: '玉器', eras: ['明'], period: '明', date: '公元16世纪',
    imageRatio: 53.265,
    material: '软玉', dimensions: '高5.4厘米，宽13.2厘米，厚0.7厘米', accession: '02.18.390',
    description: '长方形玉带牌的外沿保留窄框，内部雕出密集的镂空纹样。从透空处可以看出这件薄玉牌的雕工。'
  },
  {
    id: '42514', title: '龙泉窑青釉刻牡丹纹盘', type: '陶瓷', eras: ['明'], period: '明', date: '公元14世纪晚期至15世纪初',
    imageRatio: 75.102,
    material: '青釉炻器，釉下刻纹', dimensions: '高8.9厘米，口径50.8厘米', accession: '1984.358',
    description: '盘径超过半米，盘心刻牡丹，外围的纹线从盘心向盘沿展开。青釉覆在刻纹上，花纹随釉层深浅显现。'
  },
  {
    id: '42526', title: '青花栀子花纹盘', type: '陶瓷', eras: ['明'], period: '明', date: '公元16世纪晚期',
    imageRatio: 75.102,
    material: '瓷，釉下青花及釉上彩', dimensions: '口径26厘米', accession: '19.28.10',
    description: '盘心以釉下钴蓝画出一枝栀子花，釉上再加彩色，外壁另有一圈纹饰。青花与釉上彩先后入窑，是明代景德镇常用的做法。'
  },
  {
    id: 'cma-1971.145', title: '珐琅彩锦鸡花卉蒜头瓶', type: '陶瓷', eras: ['清'], period: '清', date: '公元1736至1795年',
    imageRatio: 150.307,
    material: '瓷，珐琅彩', dimensions: '高18.6厘米，腹径10.5厘米', accession: '1971.145',
    description: '瓶口作蒜头形，器身用珐琅彩画出锦鸡与花卉。这类器物先在景德镇烧成白瓷，再送进宫中的作坊加绘，由宫廷画师按样稿落笔。'
  },
  {
    id: '49167', title: '恽冰花卉册页', type: '书画', eras: ['清'], period: '清', date: '公元17世纪',
    imageRatio: 90.612,
    material: '纸本设色，册页', dimensions: '纵31.1厘米，横34.3厘米', accession: '1983.412.1', imageNote: '册页',
    description: '册页上画一枝花，花瓣用色层层晕染，叶片直接以色彩点染成形。恽冰是清代的女画家，以没骨花卉见长。'
  },
  {
    id: '36071', title: '王翚山水图轴', type: '书画', eras: ['清'], period: '清', date: '公元1693年',
    imageRatio: 149.847,
    material: '纸本墨笔，立轴', dimensions: '纵85.7厘米，横43.8厘米', accession: '55.211.2',
    description: '立轴画山峦与林木，用墨的干湿分出远近层次，山石的轮廓以侧笔勾出。王翚是清初「四王」之一，这幅画作于1693年。'
  },
  {
    id: 'cma-1952.510', title: '双仙人耳玉杯', type: '玉器', eras: ['清'], period: '清', date: '公元1736至1795年',
    imageRatio: 55.714,
    material: '软玉，青白玉', dimensions: '高6.5厘米，连耳宽16厘米', accession: '1952.510',
    description: '杯的两侧各以一位仙人作耳，器身上环绕着仙人、乐人和侍从。这件杯曾被看作元代器物，新的研究将它改定在清代乾隆时期；器上没有乾隆款识，因此可能未曾入宫。'
  },
  {
    id: '43265', title: '玉花插', type: '玉器', eras: ['清'], period: '清', date: '公元18世纪',
    imageRatio: 133.515,
    material: '软玉', dimensions: '高18.3厘米，连座高21.6厘米，最大宽11.1厘米', accession: '65.86.189a, b',
    description: '花插顺着花叶造型向上伸展，枝叶彼此穿插。光线落到薄处时，可以看出玉料色泽与雕刻层次。'
  },
  {
    id: 'cma-2019.167', title: '袁耀《蜀栈行旅图》', type: '书画', eras: ['清'], period: '清·乾隆八年', date: '公元1743年',
    imageRatio: 73.673,
    material: '绢本设色，立轴', dimensions: '画心187 × 256.5厘米', accession: '2019.167',
    description: '岩壁之间的栈道牵出行旅路线。山势占据大部分画面，沿路的楼阁和行人很小，能看出立轴表现的山岭尺度。'
  }
];

function imagePath(id, size) {
  return `/relics/assets/${size}-${id}.jpg`;
}

// 馆方藏品页与图像授权：cma- 前缀为克利夫兰艺术博物馆（CC0），其余为大都会艺术博物馆（公有领域）。
function sourceFor(id) {
  if (id.startsWith('cma-')) {
    return {
      museum: '克利夫兰艺术博物馆',
      url: `https://www.clevelandart.org/art/${id.slice(4)}`,
      rights: 'CC0'
    };
  }
  return {
    museum: '大都会艺术博物馆',
    url: `https://www.metmuseum.org/art/collection/search/${id}`,
    rights: '公有领域'
  };
}

const LIST_PATH = '/relics/pages/relic-list/relic-list';
const DETAIL_PATH = '/relics/pages/relic-detail/relic-detail';

function shareMessage(relic) {
  if (!relic) return { title: '阅史记 · 文物', path: LIST_PATH, imageUrl: '/assets/relic-home-ink.png' };
  return {
    title: `阅史记 · ${relic.title}`,
    path: `${DETAIL_PATH}?id=${encodeURIComponent(relic.id)}`,
    imageUrl: imagePath(relic.id, 'detail')
  };
}

module.exports = { TYPES, ERAS, RELICS, LIST_PATH, DETAIL_PATH, imagePath, sourceFor, shareMessage };
