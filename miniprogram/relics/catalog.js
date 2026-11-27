const TYPES = ['青铜', '陶瓷', '玉器', '书画'];
const ERAS = ['新石器时代', '二里头文化', '商', '西周', '东周', '汉', '魏晋南北朝', '唐', '五代', '宋', '元', '明', '清'];

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
    id: 'cma-1991.115', title: '玉钺', type: '玉器', eras: ['二里头文化'], period: '二里头文化', date: '约公元前1900至前1500年',
    imageRatio: 145.833,
    material: '软玉', dimensions: '高10.5厘米，厚0.5厘米', accession: '1991.115',
    description: '钺本是兵器，玉钺则用于仪仗。这件玉钺窄长扁薄，上端开孔，可缚柄执持。馆方将它归入二里头文化，玉制礼兵在青铜时代早期仍与铜器并行。'
  },
  {
    id: 'cma-1989.150', title: '青铜斝', type: '青铜', eras: ['二里头文化'], period: '二里头文化', date: '约公元前1700至前1500年',
    imageRatio: 107.93,
    material: '青铜', dimensions: '高24厘米', accession: '1989.150',
    description: '斝是一种温酒器。这件斝的宽口上立着两根柱，三条长足把器腹架高。馆方将它归入二里头文化，认为可能来自河南。'
  },
  {
    id: 'cma-1915.630', title: '玉琮', type: '玉器', eras: ['商'], period: '商', date: '约公元前1600至前1050年',
    imageRatio: 137.64,
    material: '软玉', dimensions: '高20.6厘米', accession: '1915.630',
    description: '玉琮外方内圆，中贯穿孔。这件琮高达二十余厘米，内孔由两端对钻，中部留有相接的台阶。《周礼》记「黄琮礼地」，馆方指出琮在新石器时代社会中的原始功能尚不完全清楚。'
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
    id: 'cma-1952.490', title: '玉鹿', type: '玉器', eras: ['西周'], period: '西周', date: '约公元前1100至前900年',
    imageRatio: 81.837,
    material: '玉', dimensions: '高5.6厘米，宽6.1厘米', accession: '1952.490',
    description: '西周玉饰多作鹿、兔、鸟一类小动物。这件片雕玉鹿四肢舒展，角枝后掠，形象生动，可穿绳佩戴。这类肖生玉常见于西周墓葬，或为组佩中的构件。'
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
    id: 'cma-1989.3', title: '青铜钟', type: '青铜', eras: ['西周'], period: '西周', date: '约公元前800至前700年',
    imageRatio: 131.016,
    material: '青铜', dimensions: '通高70.3厘米，宽37厘米，厚26.6厘米', accession: '1989.3',
    description: '钟在周代用于宗庙礼乐。馆方记此钟为八件编钟中的次大者，合瓦形钟体能正侧各发一音。钟上铭文一百一十八字，记述主人家世及其受周王册命的经过，是西周晚期金文的重要材料。'
  },
  {
    id: '44784', title: '青铜豆', type: '青铜', eras: ['东周'], period: '东周', date: '公元前6世纪末至前5世纪初',
    imageRatio: 133.515,
    material: '青铜', dimensions: '通高26.7厘米，口径18.4厘米，足径12.4厘米', accession: '25.20.2a, b',
    description: '豆是盛放腌菜、肉酱一类食物的器皿，上为浅盘，下接柄和底座。这件豆带盖，馆方把年代定在春秋晚期至战国早期。'
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
    id: '74527', title: '战国至西汉玉璧', type: '玉器', eras: ['东周', '汉'], period: '战国至西汉', date: '公元前3至前2世纪',
    imageRatio: 75.102,
    material: '玉', dimensions: '直径14.6厘米，厚1厘米', accession: '2008.287',
    description: '玉璧作圆板形，中心开圆孔，器面光素。璧在先秦两汉的礼仪中用作礼器，也见于墓葬随葬。'
  },
  {
    id: '72544', title: '金饰玉梳', type: '玉器', eras: ['汉'], period: '东汉', date: '公元25至220年',
    imageRatio: 82.449,
    material: '软玉、金', dimensions: '高5.1厘米，长7.6厘米', accession: '2004.322',
    description: '梳背上嵌着金饰，下方是一排细密的玉梳齿。金与玉在一件小器物上相接，可以从梳背细看两种材料的处理。'
  },
  {
    id: 'cma-1986.46.a', title: '青铜博山炉', type: '青铜', eras: ['汉'], period: '西汉', date: '公元前200至前100年',
    imageRatio: 123.737,
    material: '青铜', dimensions: '通高18.4厘米，腹径9.9厘米', accession: '1986.46.a',
    description: '炉盖做成尖耸的山形，山间铸出人物与走兽。汉人焚香时把香料放在炉身中点燃，烟从盖上的镂孔散出，望去像山间的雾气。'
  },
  {
    id: 'cma-1946.238', title: '二桃杀三士画像砖', type: '陶瓷', eras: ['汉'], period: '汉', date: '公元前2世纪至公元2世纪',
    imageRatio: 50.816,
    material: '灰陶，施黑红彩', dimensions: '高47厘米，长102.2厘米', accession: '1946.238',
    description: '这块汉墓画像砖以黑红两彩在白粉层上作画，题材为「二桃杀三士」：晏婴设谋，以两枚桃子令三位勇士争功相残。故事出自《晏子春秋》，汉代墓室壁画与画像石常用它寓戒逞勇。'
  },
  {
    id: 'cma-1952.473', title: '玉剑珌', type: '玉器', eras: ['汉'], period: '汉', date: '公元前202至公元220年',
    imageRatio: 82.857,
    material: '玉', dimensions: '高4.8厘米，宽5.5厘米', accession: '1952.473',
    description: '剑珌是玉具剑鞘末端的饰件，与剑首、剑格、剑璏合成一套。汉代天子百官佩玉具剑，玉饰的优劣按身份等差使用。这件珌作梯形，底端略宽，玉色温润。'
  },
  {
    id: 'cma-1989.71', title: '绿釉陶楼', type: '陶瓷', eras: ['汉'], period: '东汉', date: '公元25至220年',
    imageRatio: 107.692,
    material: '绿釉陶', dimensions: '通高54.3厘米，底径39厘米', accession: '1989.71',
    description: '这座陶楼是东汉墓葬中的明器，楼身塑出斗栱与栏槛，猎手、乐舞人物与家畜环列楼下，一派庄园气象。低温铅釉烧成后釉面明亮，如罩一层玻璃。汉代人事死如事生，把现世的排场照样搬进墓葬。'
  },
  {
    id: 'cma-1995.296', title: '规矩纹铜镜', type: '青铜', eras: ['汉'], period: '东汉', date: '公元1至3世纪初',
    imageRatio: 99.796,
    material: '青铜', dimensions: '直径14.2厘米', accession: '1995.296',
    description: '镜背中央置钮，环列乳钉，其间布出T、L、V形的规矩纹。这类纹样常与四神瑞兽相配，被认为同天圆地方的宇宙图式有关，是东汉铜镜最流行的样式之一。'
  },
  {
    id: 'cma-1995.326', title: '神兽纹铜镜', type: '青铜', eras: ['汉'], period: '东汉至三国', date: '公元175至225年',
    imageRatio: 94.49,
    material: '青铜', dimensions: '直径11.8厘米', accession: '1995.326',
    description: '镜背神人瑞兽相间环列，外饰半圆、方枚各一周。缘上铸铭一圈，大意为「炼三金作明镜，摹写无穷之形」。这类神兽镜流行于东汉末年至三国，铭文兼记作镜与颂吉之语。'
  },
  {
    id: 'cma-1970.152', title: '越窑青釉虎首罐', type: '陶瓷', eras: ['魏晋南北朝'], period: '西晋', date: '公元3世纪晚期至4世纪',
    imageRatio: 78.571,
    material: '青釉炻器，越窑', dimensions: '高20.5厘米', accession: '1970.152',
    description: '罐肩塑出虎首形流，是西晋越窑青瓷的典型装饰。胎上施青釉，釉色青中泛黄。越窑分布在今浙江一带，最早烧成高温青瓷，六朝时期产量极盛，馆方将这件罐定在西晋。'
  },
  {
    id: 'cma-2017.16', title: '青釉莲瓣纹盖罐', type: '陶瓷', eras: ['魏晋南北朝'], period: '南北朝', date: '公元386至581年',
    imageRatio: 98.776,
    material: '青釉炻器', dimensions: '连盖高24.6厘米，口径24.3厘米', accession: '2017.16',
    description: '罐与盖通体刻仰覆莲瓣，罩青釉，肩部附双复系可穿绳提携。原盖钮当作莲蕾形，惜已失。莲瓣是南北朝青瓷最流行的装饰，与佛教传播同步；馆方指出这类罐带原盖存世者极少。'
  },
  {
    id: 'cma-1973.84', title: '青釉鸡首壶', type: '陶瓷', eras: ['魏晋南北朝'], period: '南朝', date: '公元5至6世纪',
    imageRatio: 132.432,
    material: '青釉炻器，越窑', dimensions: '高23.5厘米', accession: '1973.84',
    description: '壶肩一侧塑鸡首作流，另一侧附把手，是六朝青瓷特有的器形，由汉代的盘口壶加饰鸡首演变而来。早期鸡首壶器身浑圆，鸡首多为实心装饰；馆方记这件南朝制品器身修长，腹部刻莲瓣，可见其晚期演进。'
  },
  {
    id: 'cma-1963.579', title: '螭纹玉环', type: '玉器', eras: ['魏晋南北朝'], period: '南北朝', date: '公元5世纪',
    imageRatio: 117.225,
    material: '玉', dimensions: '直径6.4厘米', accession: '1963.579',
    description: '环上高浮雕蟠绕的螭虎，身躯起伏辗转，是汉代玉器流行的纹样，此环延续其遗风。馆方将它定为六朝（公元5世纪）物，这类传世玉环的断代多依造型与雕工比对。'
  },
  {
    id: 'cma-1930.731', title: '鎏金铜铺首', type: '青铜', eras: ['魏晋南北朝'], period: '北朝', date: '公元6世纪',
    imageRatio: 83.673,
    material: '鎏金青铜', dimensions: '高13.6厘米，宽20厘米', accession: '1930.731',
    description: '铺首是钉在门扇上衔环的底座。这件鎏金铺首铸成兽面，双目凸出，獠牙吐舌，额部与四肢旁留有铆孔供钉门之用，口中衔环早已不存。狰狞的造型既作门环实用，也用来震慑邪祟。馆方据风格将它定在北朝。'
  },
  {
    id: 'cma-1995.352', title: '海兽葡萄纹铜镜', type: '青铜', eras: ['唐'], period: '唐', date: '约公元7至9世纪',
    imageRatio: 100.0,
    material: '青铜', dimensions: '直径11.2厘米', accession: '1995.352',
    description: '镜背高浮雕瑞兽穿行于葡萄藤蔓之间，间以飞鸟蜂蝶，是唐代最常见的镜类之一。葡萄纹随丝路传入，与本土瑞兽同饰一镜，纹样繁密，是唐代铜镜工艺的代表。'
  },
  {
    id: 'cma-1973.74', title: '金银平脱花鸟纹铜镜', type: '青铜', eras: ['唐'], period: '唐', date: '公元8世纪',
    imageRatio: 96.122,
    material: '青铜，漆面镶金银片', dimensions: '直径19.2厘米', accession: '1973.74',
    description: '平脱是在漆地上粘贴金银薄片再髹漆磨平的工艺。这面镜背以薄如纸的金银片饰出衔枝凤鸟、蜂蝶与花卉卷草，纹样带有波斯与中亚气息。馆方指出这类奢侈品曾被唐皇帝用作外交赠礼，日本正仓院藏有同类之镜。'
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
    id: 'cma-1918.470', title: '白瓷碗', type: '陶瓷', eras: ['唐', '五代'], period: '唐末至五代', date: '约公元875至925年',
    imageRatio: 66.939,
    material: '白瓷', dimensions: '高11.9厘米，口径21.6厘米', accession: '1918.470',
    description: '碗身撇口弧腹，通体施白釉，釉色温润泛牙白。这类南方白瓷烧成于唐末五代，是青釉传统之外的南方窑口转向白瓷的实例，为后来的青白瓷开辟了先路。'
  },
  {
    id: 'cma-1975.92', title: '释迦三尊像', type: '书画', eras: ['五代'], period: '唐末五代', date: '约公元900年',
    imageRatio: 152.174,
    material: '绢本设色，立轴', dimensions: '画心纵94厘米，横61厘米', accession: '1975.92',
    description: '绢本立轴绘释迦坐像，文殊骑狮、普贤骑六牙白象分列左右。馆方将它断在公元900年前后。唐末绢本佛画存世极稀，此轴保存了释迦三尊组合的完整样式。'
  },
  {
    id: 'cma-1959.348', title: '巨然《溪山兰若图》', type: '书画', eras: ['宋'], period: '北宋', date: '公元960至985年',
    imageRatio: 347.518,
    material: '绢本水墨，立轴', dimensions: '画心纵184.5厘米，横56.1厘米', accession: '1959.348',
    description: '巨然原为南唐僧人，随李后主归宋北上，与董源同开江南山水一派。画面主峰高耸满幅，山顶矾头累叠，湿笔披麻皴写雾气氤氲的溪山兰若。馆方视此轴为北宋初巨幛山水「主峰当堂」构图的代表作。'
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
    id: 'cma-1953.126', title: '《溪山无尽图》', type: '书画', eras: ['宋'], period: '北宋末至金', date: '公元1100至1150年',
    imageRatio: 15.51,
    material: '绢本设色，手卷', dimensions: '画心纵35.1厘米，横213厘米，全卷长逾11米', accession: '1953.126', imageNote: '手卷局部',
    description: '手卷长逾十一米，画心仅35厘米高，描绘一路行旅穿行溪山，楼观、村舍与渔樵往来其间。画风承北宋全景山水的余绪，馆方视为十二世纪前半叶北方画派的巨制。1953年入藏，奠定馆内中国书画收藏的根基。'
  },
  {
    id: 'cma-1933.220', title: '米友仁《云山图》', type: '书画', eras: ['宋'], period: '南宋', date: '公元1130年',
    imageRatio: 17.755,
    material: '绢本设色，手卷', dimensions: '画心纵43.7厘米，横192.6厘米', accession: '1933.220', imageNote: '手卷局部',
    description: '米友仁是米芾长子，父子创「米氏云山」，以横点积叠写江南雨景。此卷作于1130年：靖康之变后他避地浙东，画赠新昌寓所主人以谢款留之谊。卷上烟云流动，林木模糊，是米氏「墨戏」的成熟之作，也是馆藏最早的纪年中国画之一。'
  },
  {
    id: 'cma-1983.85', title: '刘松年《听琴图》', type: '书画', eras: ['宋'], period: '南宋', date: '公元12世纪晚期至13世纪初',
    imageRatio: 95.918,
    material: '绢本设色，册页', dimensions: '纵23.8厘米，横24.6厘米', accession: '1983.85', imageNote: '册页',
    description: '松荫之下一人抚琴，二人对坐聆听，取伯牙鼓琴、子期知音的故事。馆方记人物衣纹用「钉头鼠尾描」，笔致劲利。刘松年与李唐、马远、夏圭并称南宋四家，此页可见其院体画风的整饬。'
  },
  {
    id: 'cma-1961.421', title: '马麟《坐看云起图》', type: '书画', eras: ['宋'], period: '南宋', date: '约公元1256年',
    imageRatio: 41.429,
    material: '绢本墨笔，册页', dimensions: '纵25.1厘米，横25.3厘米', accession: '1961.421', imageNote: '册页',
    description: '画面中一位士人倚坐，望向山间升起的云气，题名取自王维的诗句。南宋时这类诗意图常画在绢本册页或团扇上。'
  },
  {
    id: 'cma-1958.427', title: '牧溪《龙虎图》', type: '书画', eras: ['宋'], period: '南宋', date: '约公元1250至1279年',
    imageRatio: 147.59,
    material: '绢本水墨，对轴', dimensions: '每轴画心纵125.2厘米，横57.2厘米', accession: '1958.427', imageNote: '对轴',
    description: '龙腾波云之上，虎伏坡石之间，一升一伏相为表里，取龙虎阴阳相济之意。作者牧溪是宋末禅僧，水墨纵逸，不求形似。这对立轴原悬于禅寺，东传日本后备受珍视，牧溪画名在日本画史上尤高。'
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
    id: 'cma-1962.223', title: '玉雕卧牛', type: '玉器', eras: ['清'], period: '清初', date: '公元1642至1722年',
    imageRatio: 67.347,
    material: '玉', dimensions: '高6.2厘米，长7.7厘米', accession: '1962.223',
    description: '玉牛伏卧回首，肌肉起伏以阴线与浅浮雕表现，可作文房镇纸。明清两代玉器走向市肆，馆方记此时玉雕匠人直面市场竞争，小件文玩成为文人书斋与市民的共同趣味。这件卧牛刀法圆熟，是康熙年间的精品。'
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
  }
];

function imagePath(id, size) {
  return `/relics/assets/${size}-${id}.jpg`;
}

// 详情大图不放分包（60 件全放会超出媒体预算，进入栏目也要白下几百 KB）：
// 与人物/史事专属图同一套 jsDelivr 分发，缩略图（200×144）留在包内作离线兜底。
// 主域 testingcf，备用 gcore，双域都失败时详情页降级显示包内缩略图。
const DETAIL_HOSTS = [
  'https://testingcf.jsdelivr.net/gh/webzol/history@main',
  'https://gcore.jsdelivr.net/gh/webzol/history@main'
];

function detailUrls(id) {
  return DETAIL_HOSTS.map(host => `${host}/miniprogram/data/img/relics/${id}.jpg`);
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
    imageUrl: detailUrls(relic.id)[0]
  };
}

module.exports = { TYPES, ERAS, RELICS, LIST_PATH, DETAIL_PATH, DETAIL_HOSTS, imagePath, detailUrls, sourceFor, shareMessage };
