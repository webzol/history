// 自动生成：node tools/build_preview.js（勿手改）
(function () {
  var MOD = window.__SRC = {};
  function __register(p, f) { MOD[p] = f; }

__register('/app.js', function (require, module, exports) {
App('project://app.js', {
  globalData: {
    appName: '史页'
  }
});

});
__register('/data/history.js', function (require, module, exports) {
// 真实历史数据种子（首版）
// 说明：小程序端先用本地 JS 种子，后续替换为 API/CMS。
// 史料来源字段仅作内容索引；正式发布前需由历史审校逐条核对。

const periods = [
  {
    id: 'han',
    name: '西汉',
    start: -202,
    end: 9,
    title: '大汉气象',
    desc: '从文景之治到汉武盛世，奠定此后两千年的制度与文化底色。',
    source: '《汉书》'
  },
  {
    id: 'tang',
    name: '唐',
    start: 618,
    end: 907,
    title: '盛唐气象',
    desc: '从贞观之治到开元盛世，万国来朝。',
    source: '《资治通鉴》'
  },
  {
    id: 'song',
    name: '北宋',
    start: 960,
    end: 1127,
    title: '北宋',
    desc: '与士大夫共治天下，城市、商业与市民文化走向成熟。',
    source: '《宋史》'
  },
  {
    id: 'modern',
    name: '近现代',
    start: 1840,
    end: 1949,
    title: '百年中国',
    desc: '从鸦片战争到开国大典，寻找现代中国的来路。',
    source: '《清史稿》；《中国共产党历史》'
  }
];

const events = [
  {
    id: 'han-wudi',
    mode: 'ancient',
    year: -141,
    yearText: '公元前141年',
    era: '西汉',
    title: '汉武帝即位',
    desc: '刘彻即位，随后推行推恩令、盐铁官营与北击匈奴，西汉进入鼎盛期。',
    tags: '政治 · 西汉',
    source: '《汉书·武帝纪》',
    details: [
      '公元前141年，十六岁的刘彻即皇帝位。即位之初崇尚黄老无为，建元六年窦太后去世后，儒学开始登上政治舞台。',
      '采纳主父偃之谋颁布“推恩令”，令诸侯分封子弟，王国势力从此瓦解；设中朝、置十三部刺史，中央集权空前强化。',
      '任用卫青、霍去病多次大规模出击匈奴，收河南地、取河西走廊；张骞两度出使西域，丝绸之路自此开通。',
      '罢黜百家、表章六经，确立儒学正统；置五经博士、兴太学，同时推行盐铁官营、均输平准，国家财政高度集中。',
      '晚年连年征伐致海内虚耗，巫蛊之祸牵连甚广；征和四年下轮台诏自责，转向守文。其后托孤霍光，为昭宣中兴埋下伏笔。'
    ]
  },
  {
    id: 'chenqiao-960',
    mode: 'ancient',
    year: 960,
    yearText: '960',
    era: '北宋',
    title: '陈桥兵变',
    desc: '赵匡胤黄袍加身，建立北宋。',
    tags: '建国 · 政治',
    source: '《宋史·太祖本纪》',
    details: [
      '960年正月初一，边报称北汉联合辽军南侵，殿前都点检赵匡胤奉命率军北上御敌；大军行至开封东北的陈桥驿驻营。',
      '次日黎明，将士将黄袍披于赵匡胤之身，拥立其为帝，回师开封；后周恭帝禅位，赵匡胤即位，国号“宋”，是为宋太祖。',
      '太祖以“先南后北、先易后难”为方略，先后攻灭荆南、后蜀、南汉、南唐诸政权，基本结束五代十国的分裂局面。',
      '即位次年以“杯酒释兵权”解除宿将典禁兵之权，确立殿前司、侍卫司分掌，文臣知州、通判互察的制度，重文轻武自此成为宋代立国基调。'
    ]
  },
  {
    id: 'chanyuan-1005',
    mode: 'ancient',
    year: 1005,
    yearText: '1005',
    era: '北宋',
    title: '澶渊之盟',
    desc: '宋辽订盟，以岁币换取长期和平。',
    tags: '外交 · 宋辽',
    source: '《续资治通鉴长编》',
    details: [
      '1004年（景德元年）秋，辽萧太后与辽圣宗亲率大军南下，绕过坚城深入宋境，直逼黄河岸边的澶州（今河南濮阳），汴京震动。',
      '宰相寇准力排南迁金陵、成都之议，坚持请宋真宗亲征。真宗渡河至澶州北城，黄龙旗立于城楼，宋军士气大振，阵前射杀辽将萧挞凛。',
      '双方于次年正月在澶州（古称澶渊）议和：约定宋辽为兄弟之国，宋每年送辽岁币银十万两、绢二十万匹，两国于边境开放榷场，史称“澶渊之盟”。',
      '此后宋辽约百余年未再大规模交兵，边境贸易与使节往来不绝；但岁币负担与“以钱买和”的非议，也成为日后改革派批评的口实。'
    ]
  },
  {
    id: 'wanganshi-1069',
    mode: 'ancient',
    year: 1069,
    yearText: '1069',
    era: '北宋',
    title: '王安石变法',
    desc: '熙宁新政，从青苗法到保甲法。',
    tags: '改革 · 经济',
    source: '《宋史·王安石传》',
    details: [
      '1069年（熙宁二年），宋神宗任王安石为参知政事，设“制置三司条例司”主持变法；此前一年越次入对，王安石以“天变不足惧、人言不足恤、祖宗之法不足守”自励。',
      '理财诸法相继推出：青苗法以官钱贷于民、十收取息二分，免役钱改差役为雇役，农田水利法鼓励垦荒浚渠，均输法、市易法则欲“稍收轻重敛散之权”归公。',
      '整军诸法并行：保甲法编民为兵、更置将法改变兵不识将之弊，保马法使民间代官养马，随后又置军器监讲求兵器精利。',
      '变法在朝野引起激烈争论：司马光、韩琦等以为“与民争利”，新旧党争自此绵延数十年。1074年王安石罢相，1076年再罢，新法由神宗独任推进，其后几经反复，直至徽宗朝变异为聚敛之具。'
    ]
  },
  {
    id: 'jingkang-1127',
    mode: 'ancient',
    year: 1127,
    yearText: '1127',
    era: '北宋',
    title: '靖康之变',
    desc: '汴京陷落，北宋灭亡。',
    tags: '战争 · 转折',
    source: '《宋史·钦宗本纪》',
    details: [
      '1120年宋与金结“海上之盟”相约灭辽；辽亡之后，金以接收叛将、纳叛失约等事为由，于1125年十月分两路大举南侵。',
      '1126年（靖康元年）金兵围汴京，宋钦宗罢免起用不久的李纲，又以“许岁币、割三镇”议和；汴京一度解围，金军退而复进，闰十一月再次围城。',
      '闰十一月城破，十二月金命宋钦宗出郊奉表投降，索取金银绢帛以千万计；靖康二年三月，金废徽宗、钦宗为庶人。',
      '四月，金军携徽、钦二帝并宗室、后妃、百工技艺等十余万人北去，府库图籍一空，史称“靖康之变”；徽宗第九子康王赵构在外督军得免，五月即位于南京应天府，是为宋高宗，南宋自此肇建。'
    ]
  },
  {
    id: 'opium-war-1840',
    mode: 'modern',
    year: 1840,
    yearText: '1840',
    era: '晚清',
    title: '鸦片战争',
    desc: '英国发动鸦片战争，中国近代史由此开始。',
    tags: '战争 · 晚清',
    source: '《清史稿·宣宗本纪》',
    details: [
      '1839年6月，林则徐在虎门海滩当众销毁鸦片二百余万斤；英国政府以此为借口，1840年6月派出舰队封锁珠江口，鸦片战争爆发。',
      '英军北犯攻陷定海、直逼天津白河口，清廷将林则徐革职查办，以琦善赴广东议和；1841年1月英军强占香港岛，战事再起。',
      '1842年英军溯长江而上，攻陷吴淞、镇江，兵临南京城下；耆英、伊里布奉命求和。',
      '1842年8月29日，清政府与英国签订《南京条约》：割让香港岛，开放广州、厦门、福州、宁波、上海五口通商，赔款银二千一百万元——这是中国近代史上第一个不平等条约，中国从此被卷入世界市场的漩涡。'
    ]
  },
  {
    id: 'xinhai-1911',
    mode: 'modern',
    year: 1911,
    yearText: '1911',
    era: '民国',
    title: '辛亥革命',
    desc: '武昌起义爆发，各省响应，清帝退位，中华民国建立。',
    tags: '革命 · 民国',
    source: '《清史稿·宣统皇帝本纪》',
    details: [
      '1911年10月10日夜，武昌新军工程第八营打响起义第一枪，随即占领楚望台军械库，一夜之间攻取湖广总督署，光复武汉三镇。',
      '起义军推举黎元洪为都督，成立湖北军政府；此后两个月内，十余行省相继响应，纷纷宣告独立。',
      '12月，独立各省代表在南京集会，选举孙中山为临时大总统；1912年1月1日，中华民国临时政府在南京成立。',
      '1912年2月12日，隆裕太后颁布退位诏书，清帝退位，延续两千余年的帝制就此终结。',
      '革命虽推翻帝制，政权不久旁落袁世凯，共和之名行之维艰——这一未竟之局，成为新文化运动于此发端的深层原因。'
    ]
  },
  {
    id: 'mayfourth-1919',
    mode: 'modern',
    year: 1919,
    yearText: '1919',
    era: '民国',
    title: '五四运动',
    desc: '北京学生游行，新文化运动与爱国运动汇合。',
    tags: '思想 · 民国',
    source: '《中国共产党历史》第一卷',
    details: [
      '1919年5月4日，北京十三所学校三千余名学生齐集天安门，抗议巴黎和会将在山东的德国权益转让日本，高呼“外争主权、内除国贼”，火烧赵家楼曹汝霖宅。',
      '军警当场逮捕学生三十余人，激起全国愤慨；天津、上海、武汉等地学生相继罢课声援，北京政府被迫释放被捕学生。',
      '6月3日后，上海工人罢工、商人罢市，“三罢”斗争扩展至全国，运动主力由学生转向工人阶级；北洋政府罢免曹汝霖、章宗祥、陆宗舆。',
      '6月28日，中国代表最终拒绝在对德和约（凡尔赛和约）上签字。五四运动后，白话文、新思想迅猛传播，一批先进知识分子转向马克思主义，为中国共产党的建立作了思想上和干部上的准备。'
    ]
  },
  {
    id: 'mukden-1931',
    mode: 'modern',
    year: 1931,
    yearText: '1931',
    era: '民国',
    title: '九一八事变',
    desc: '日本发动九一八事变，东北沦陷，民族危机加深。',
    tags: '抗战 · 民国',
    source: '《中国共产党历史》第一卷',
    details: [
      '1931年9月18日夜，日本关东军自爆南满铁路柳条湖段路轨，反诬中国军队所为，随即进攻沈阳北大营；东北军奉“不抵抗”命令撤入关内，沈阳一夕失守。',
      '至1932年2月，吉林、辽宁、黑龙江三省主要城镇相继陷落，东北军政中枢与吉林、沈阳兵工厂、东三省官银号尽为日军夺取。',
      '1932年3月，日本扶植溥仪成立伪“满洲国”，殖民统治东北十四年由此开端。',
      '九一八事变后，东北各地义勇军风起，中国共产党号召抗日并派杨靖宇等赴东北组织抗日联军；民族矛盾从此上升为中国社会的主要矛盾，全民抗战的起点即在于此。'
    ]
  },
  {
    id: 'prc-1949',
    mode: 'modern',
    year: 1949,
    yearText: '1949',
    era: '新中国',
    title: '中华人民共和国成立',
    desc: '中国人民站起来了，历史翻开新的一页。',
    tags: '建国 · 现代',
    source: '《中华人民共和国史稿》',
    details: [
      '1949年4月人民解放军占领南京；9月，中国人民政治协商会议第一届全体会议在北平召开，通过具有临时宪法性质的《共同纲领》，定国名为中华人民共和国，定都北平并改名北京。',
      '10月1日下午三时，开国大典在天安门广场举行，毛泽东宣读中央人民政府公告，宣告中华人民共和国中央人民政府成立，三十万军民参加典礼。',
      '中央人民政府随即任命周恩来为政务院总理，施政以恢复经济、稳定物价为先；至1950年，西藏和平解放，除台湾及少数海岛外全国大陆实现统一。',
      '新政权实行土地改革、没收官僚资本建立国营经济、统一财经管理，为数十年的建设时期确立了基本框架；亚洲和世界政治格局亦自此改观。'
    ]
  },
  {
    id: 'reform-1978',
    mode: 'modern',
    year: 1978,
    yearText: '1978',
    era: '新中国',
    title: '十一届三中全会',
    desc: '作出把党和国家工作中心转移到经济建设上来、实行改革开放的历史性决策。',
    tags: '改革 · 现代',
    source: '《中国共产党简史》',
    details: [
      '1978年5月，《实践是检验真理的唯一标准》一文引发全国性的真理标准问题大讨论，为思想解放打开闸门。',
      '12月18日至22日，中共十一届三中全会在北京召开：全会停止“以阶级斗争为纲”的提法，作出把党和国家工作中心转移到经济建设上来、实行改革开放的历史性决策。',
      '全会恢复民主集中制的传统，成立中央纪律检查委员会，审查并纠正历史上的一批重大冤假错案，平反随之陆续展开。',
      '此后家庭联产承包责任制在农村推开，经济特区相继设立；从农村到城市、从沿海到内地，改革逐步成为时代的主旋律。'
    ]
  },
  {
    id: 'yuanmingyuan-1860',
    mode: 'modern',
    year: 1860,
    yearText: '1860年10月18日',
    era: '晚清',
    title: '圆明园罹劫',
    desc: '英法联军纵火圆明园，这座皇家园林在火光中化为废墟。',
    tags: '近代 · 文化',
    source: '《清史稿·文宗本纪》；圆明园档案',
    details: [
      '1860年（咸丰十年）9月，僧格林沁所部在八里桥之战败于英法联军，咸丰皇帝逃往热河避暑山庄，圆明园遂入联军之手。',
      '10月上旬，联军先在园内大肆劫掠，无数书画典籍、金玉珍玩、青铜礼器被盗运出境，流失海外至今。',
      '10月18日、19日两日，英军奉额尔金之命纵火焚烧圆明园，附园诸景“万园之园”化为焦土，烟尘三日不绝，恭亲王奕䜣在城外望火痛哭。',
      '10月下旬，清政府被迫与英、法签订《北京条约》，增开天津商埠、割九龙司地方一区与英、赔款各八百万两。圆明园之劫从此成为中国近代文物流散与国耻记忆的象征。'
    ]
  }
];

const persons = [
  {
    id: 'han-wudi',
    name: '汉武帝',
    dates: '前156–前87',
    era: '西汉',
    roles: '皇帝 · 政治家',
    summary: '罢黜百家，独尊儒术；北击匈奴，开疆拓土。',
    quote: '盖有非常之功，必待非常之人。',
    quoteSource: '《求茂才异等诏》',
    source: '《汉书·武帝纪》',
    details: [
      '公元前141年，十六岁的刘彻即位，是为汉武帝。即位之初崇尚黄老，建元六年窦太后崩后，儒学开始登上政治舞台。',
      '采纳主父偃之谋颁布“推恩令”，令诸侯分封子弟，王国势力从此瓦解；设中朝、置十三部刺史，中央集权空前强化。',
      '任用卫青、霍去病三次大规模出击匈奴，收河南地，取河西走廊；张骞两度出使西域，丝路自此开通。',
      '罢黜百家、表章六经，确立儒学正统；置五经博士、兴太学，同时行盐铁官营、均输平准，国家财政高度集中。',
      '晚年连年征伐致海内虚耗，巫蛊之祸牵连甚广；征和四年下轮台诏自责，转向守文。其后托孤霍光，为昭宣中兴埋下伏笔。'
    ],
    relatedEvents: ['han-wudi']
  },
  {
    id: 'zhao-kuangyin',
    name: '赵匡胤',
    dates: '927–976',
    era: '北宋',
    roles: '皇帝 · 军事家',
    summary: '黄袍加身，杯酒释兵权，奠定宋代文治基调。',
    quote: '卧榻之侧，岂容他人鼾睡乎。',
    quoteSource: '《续资治通鉴长编》',
    source: '《宋史·太祖本纪》',
    details: [
      '赵匡胤，涿州人，出身军人家庭，早年投郭威帐下，历仕后周，因高平之战与征淮南有功，累官至殿前都点检，执掌禁军。',
      '960年正月，奉命北上御敌的禁军行至陈桥驿，将士夜聚哗变，以黄袍加于其身，拥立为帝；回师开封，后周恭帝禅位，建国号“宋”，是为宋太祖。',
      '即位后以“先南后北、先易后难”统一天下：攻灭荆南、后蜀、南汉，平定南唐，基本结束五代十国分裂局面；对北方的北汉与辽则取守势。',
      '建隆二年（961年）以“杯酒释兵权”请石守信等宿将告老解除兵柄，确立禁军三衙统兵、文臣知州的制度，重文轻武自此成为宋代立国基调。',
      '开宝九年（976年）卒于开封，年五十，死因成谜（“烛影斧声”）；其弟赵光义继位，是为宋太宗。'
    ],
    relatedEvents: ['chenqiao-960']
  },
  {
    id: 'wang-anshi',
    name: '王安石',
    dates: '1021–1086',
    era: '北宋',
    roles: '政治家 · 改革家 · 文学家',
    summary: '天变不足惧，人言不足恤，祖宗之法不足守。',
    quote: '不畏浮云遮望眼，自缘身在最高层。',
    quoteSource: '《登飞来峰》',
    source: '《宋史·王安石传》',
    details: [
      '王安石，字介甫，号半山，抚州临川人。庆历二年进士，历官鄞县、常州，在地方试行贷谷于民、兴修水利，声名渐起。',
      '嘉祐三年上万言书主张改革未被采纳；熙宁元年（1068年）越次入对，神宗问“为治所先”，答以“择术为先”，次年拜参知政事，设制置三司条例司主持变法。',
      '新法以理财、整军为核心：青苗、免役、市易、方田均税、农田水利诸法行于财政，保甲、将兵、保马诸法行于军政，欲在不增赋税的前提下充实国用。',
      '变法引发司马光、韩琦等激烈反对，新旧党争绵延数十年；熙宁七年罢相，九年复相、旋再罢，退居江宁钟山，著《字说》自遣。',
      '元祐元年（1086年）卒于江宁。散文雄健，为“唐宋八大家”之一；其诗遒劲清新，《泊船瓜洲》《梅花》等为人传诵。'
    ],
    relatedEvents: ['wanganshi-1069', 'chanyuan-1005']
  },
  {
    id: 'su-shi',
    name: '苏轼',
    dates: '1037–1101',
    era: '北宋',
    roles: '文学家 · 政治家',
    summary: '一蓑烟雨任平生。',
    quote: '回首向来萧瑟处，归去，也无风雨也无晴。',
    quoteSource: '《定风波》',
    source: '《宋史·苏轼传》',
    details: [
      '苏轼，字子瞻，号东坡居士，眉州眉山人。嘉祐二年与弟苏辙同榜进士，主考欧阳修读其文章而惊叹，谓“老夫当避路，放他出一头地”。',
      '历仕仁宗至徽宗五朝，先后任职凤翔、杭州、密州、徐州、湖州等地，治西湖、筑苏堤、赈济灾民，所至有政声。',
      '元丰二年（1079年）因“乌台诗案”下狱，免死之后责授黄州团练副使。在黄州躬耕东坡，写下《赤壁赋》《后赤壁赋》与《念奴娇·赤壁怀古》。',
      '宣仁太后临朝、元祐更化时一度还朝坐殿；晚年政局再变，一贬再贬，自惠州而至海南儋州。',
      '徽宗即位后遇赦北归，建中靖国元年（1101年）卒于常州。诗、词、文、书、画皆为一代宗师，“唐宋八大家”之一，代表了宋代文化的最高峰。'
    ],
    relatedEvents: ['chenqiao-960', 'chanyuan-1005', 'wanganshi-1069', 'jingkang-1127']
  },
  {
    id: 'lin-zexu',
    name: '林则徐',
    dates: '1785–1850',
    era: '晚清',
    roles: '官员 · 民族英雄',
    summary: '苟利国家生死以，岂因祸福避趋之。',
    quote: '苟利国家生死以，岂因祸福避趋之。',
    quoteSource: '《赴戍登程口占示家人》',
    source: '《清史稿·林则徐传》',
    details: [
      '林则徐，字元抚，一字少穆，福建侯官人。嘉庆十六年进士，历官按察使、布政使、巡抚、总督，以清廉干练著称，所至兴修水利、整顿吏治。',
      '道光年间力主严禁鸦片，1838年上疏力陈“流毒于人身、鸦片不禁绝，国日贫、民日弱”，道光帝召对十九次，派为钦差大臣赴广东查办。',
      '1839年抵广州，会同邓廷桢、关天培收缴英商鸦片二万余箱于虎门，6月3日起在虎门海滩当众销毁，历时二十三日，史称“虎门销烟”。',
      '组织翻译西方书报，编《四洲志》，主张“师敌之长技以制敌”，被誉为“开眼看世界第一人”；同时整顿海防，多次挫败英军挑衅。',
      '鸦片战争爆发后被革职查办，充军伊犁；在新疆兴修坎儿井、垦复屯田。1845年起复用，历任陕西巡抚、云贵总督；1850年病逝于赴广西途中。'
    ],
    relatedEvents: ['opium-war-1840']
  },
  {
    id: 'lu-xun',
    name: '鲁迅',
    dates: '1881–1936',
    era: '近现代',
    roles: '文学家 · 思想家',
    summary: '以笔为剑，唤醒沉睡的人。',
    quote: '其实地上本没有路，走的人多了，也便成了路。',
    quoteSource: '《故乡》',
    source: '《鲁迅全集》',
    details: [
      '鲁迅，原名周树人，字豫才，浙江绍兴人。1902年赴日本留学，初入仙台医学专门学校，后因“幻灯片事件”深感国民精神之麻木，弃医从文。',
      '1909年归国后任职教育部，1918年在《新青年》发表中国现代文学史上第一篇白话小说《狂人日记》，首次署名“鲁迅”。',
      '此后陆续出版小说集《呐喊》《彷徨》、散文集《朝花夕拾》与散文诗集《野草》，塑造了阿Q、祥林嫂、孔乙己等一系列经典形象。',
      '1926年离京南下，先后任教厦门、广州；1927年定居上海，以杂文为主要武器，主持编辑《语丝》《奔流》《萌芽》等刊物，培育大批青年作家。',
      '1936年10月19日病逝于上海，数万民众自发送棺，覆于灵枢之上的一面白布写着“民族魂”三个字。'
    ],
    relatedEvents: ['xinhai-1911', 'mayfourth-1919', 'mukden-1931']
  }
];

const topics = [
  {
    id: 'tang',
    kicker: '盛唐气象',
    title: '盛唐气象',
    desc: '从贞观之治到开元盛世，万国来朝。',
    source: '《资治通鉴》'
  },
  {
    id: 'modern-china',
    kicker: '近现代 · 1840–1949',
    title: '百年中国：从鸦片战争到开国大典',
    shortTitle: '百年中国',
    desc: '从鸦片战争到开国大典，寻找现代中国的来路。',
    source: '《清史稿》；《中国共产党历史》'
  }
];

// 今日史事：按「月-日」精确匹配的公历日期库（农历事件如陈桥兵变暂不列入）。
// 匹配不到的日子回退到 fallback 精选（汉武帝即位）。
const daily = [
  { month: 10, day: 18, eventId: 'yuanmingyuan-1860' },
  { month: 10, day: 19, eventId: 'yuanmingyuan-1860' },
  { month: 10, day: 10, eventId: 'xinhai-1911' },
  { month: 10, day: 1, eventId: 'prc-1949' },
  { month: 9, day: 18, eventId: 'mukden-1931' },
  { month: 5, day: 4, eventId: 'mayfourth-1919' },
  { month: 12, day: 18, eventId: 'reform-1978' },
  { month: 8, day: 29, eventId: 'opium-war-1840' }
];

// 无匹配日期时的编辑精选
const dailyFallback = { eventId: 'han-wudi' };

module.exports = {
  periods,
  events,
  persons,
  topics,
  daily,
  dailyFallback
};

});
__register('/utils/store.js', function (require, module, exports) {
// 收藏与浏览足迹（本地存储；随数据种子走，后端接入后可替换）
const KEY_FAV = 'shige_favorites';
const KEY_FOOT = 'shige_footprints';
const FOOT_MAX = 20;

function load(key) {
  try {
    return wx.getStorageSync(key) || [];
  } catch (e) {
    return [];
  }
}

function save(key, list) {
  try {
    wx.setStorageSync(key, list);
  } catch (e) { /* 存储异常时静默 */ }
}

function listFavorites() {
  return load(KEY_FAV);
}

function isFavorite(type, id) {
  return listFavorites().some((x) => x.type === type && x.id === id);
}

// 返回切换后的状态：true=已收藏，false=已取消
function toggleFavorite(type, id) {
  const list = listFavorites();
  const idx = list.findIndex((x) => x.type === type && x.id === id);
  if (idx >= 0) {
    list.splice(idx, 1);
    save(KEY_FAV, list);
    return false;
  }
  list.unshift({ type, id, ts: Date.now() });
  save(KEY_FAV, list);
  return true;
}

function addFootprint(type, id) {
  let list = load(KEY_FOOT).filter((x) => !(x.type === type && x.id === id));
  list.unshift({ type, id, ts: Date.now() });
  list = list.slice(0, FOOT_MAX);
  save(KEY_FOOT, list);
}

function listFootprints() {
  return load(KEY_FOOT);
}

module.exports = {
  listFavorites,
  isFavorite,
  toggleFavorite,
  addFootprint,
  listFootprints
};

});

__register('/pages/home/home.js', function (require, module, exports) {
const history = require('../../data/history.js');

Page('project://pages/home/home.js', {
  data: {
    dateText: '10月18日 · 今天',
    hero: {},
    era: {},
    modern: {}
  },

  onLoad() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    // 今日史事：按「月-日」匹配日期库；无匹配时回退编辑精选
    const daily = history.daily.find((item) => item.month === month && item.day === day) || history.dailyFallback;
    const dailyEvent = history.events.find((item) => item.id === daily.eventId);
    const hero = dailyEvent
      ? { eventId: dailyEvent.id, title: '今日史事', desc: `${dailyEvent.yearText}，${dailyEvent.desc}` }
      : { eventId: daily.eventId, title: '今日史事', desc: daily.desc || '' };
    const era = history.topics.find((item) => item.id === 'tang');
    const modern = history.topics.find((item) => item.id === 'modern-china');

    this.setData({
      dateText: `${month}月${day}日 · 今天`,
      hero,
      era,
      modern
    });
  },

  goTab(e) {
    const page = e.currentTarget.dataset.page;
    if (!page || page === 'home') return;
    wx.redirectTo({
      url: `/pages/${page}/${page}`
    });
  },

  goDiscover() {
    wx.redirectTo({ url: '/pages/discover/discover' });
  },

  goPage(e) {
    const page = e.currentTarget.dataset.page;

    if (page === 'timeline') {
      wx.redirectTo({
        url: '/pages/timeline/timeline'
      });
      return;
    }

    if (page === 'dynasty') {
      this.showList(
        '选择一个时代',
        history.periods.map((item) => `${item.name} · ${item.title}`),
        (index) => {
          const period = history.periods[index];
          wx.navigateTo({ url: `/pages/period/period?id=${period.id}` });
        }
      );
      return;
    }

    if (page === 'person') {
      this.showList(
        '选择一位人物',
        history.persons.map((item) => `${item.name} · ${item.roles}`),
        (index) => {
          const person = history.persons[index];
          wx.navigateTo({ url: `/pages/person/person?id=${person.id}` });
        }
      );
      return;
    }

    if (page === 'event') {
      const items = history.events.slice(-6).reverse();
      this.showList(
        '选择一件史事',
        items.map((item) => `${item.yearText} · ${item.title}`),
        (index) => {
          const event = items[index];
          wx.navigateTo({ url: `/pages/event/event?id=${event.id}` });
        }
      );
    }
  },

  showList(title, itemList, onSelect) {
    wx.showActionSheet({
      alertText: title,
      itemList,
      success: (res) => {
        onSelect(res.tapIndex);
      }
    });
  },

  showDetail(item) {
    const content = [
      item.dateText ? `时间：${item.dateText}` : '',
      item.desc || item.summary || '',
      item.source ? `史料：${item.source}` : ''
    ].filter(Boolean).join('\n\n');

    wx.showModal({
      title: item.title || item.name,
      content,
      showCancel: false,
      confirmText: '知道了'
    });
  },

  onHeroTap() {
    const hero = this.data.hero;
    if (hero.eventId) {
      wx.navigateTo({ url: `/pages/event/event?id=${hero.eventId}` });
      return;
    }
    this.showDetail(hero);
  },

  onEraTap() {
    wx.redirectTo({ url: '/pages/timeline/timeline?mode=ancient' });
  },

  onModernTap() {
    wx.redirectTo({ url: '/pages/timeline/timeline?mode=modern' });
  },

  onShareAppMessage() {
    return { title: '史页 · 一页一页读历史', path: '/pages/home/home' };
  }
});

});
__register('/pages/home/home.wxml', function (require, module, exports) { module.exports = "<view class=\"page\">\r\n  <image class=\"paper-bg\" src=\"/assets/paper-bg.jpg\" mode=\"aspectFill\"></image>\r\n  <view class=\"screen\">\r\n    <view class=\"topbar\">\r\n      <text class=\"brand\">史页</text>\r\n    </view>\r\n\r\n    <view class=\"date\">{{dateText}}</view>\r\n\r\n    <view class=\"hero\" bindtap=\"onHeroTap\">\r\n      <view class=\"hero-inner\">\r\n        <text class=\"hero-title\">{{hero.title}}</text>\r\n        <text class=\"hero-desc\">{{hero.desc}}</text>\r\n      </view>\r\n      <image class=\"hero-art\" src=\"/assets/palace.jpg\" mode=\"widthFix\"></image>\r\n    </view>\r\n\r\n    <view class=\"quick\">\r\n      <view class=\"quick-item t1\" data-page=\"timeline\" bindtap=\"goPage\">\r\n        <image class=\"quick-icon\" src=\"/assets/icons/timeline-tile.png\" mode=\"aspectFit\"></image>\r\n        <text class=\"quick-label\">时间轴</text>\r\n      </view>\r\n      <view class=\"quick-item t2\" data-page=\"dynasty\" bindtap=\"goPage\">\r\n        <text class=\"quick-char\">朝</text>\r\n        <text class=\"quick-label\">朝代</text>\r\n      </view>\r\n      <view class=\"quick-item t3\" data-page=\"person\" bindtap=\"goPage\">\r\n        <image class=\"quick-icon\" src=\"/assets/icons/person.png\" mode=\"aspectFit\"></image>\r\n        <text class=\"quick-label\">人物</text>\r\n      </view>\r\n      <view class=\"quick-item t4\" data-page=\"event\" bindtap=\"goPage\">\r\n        <image class=\"quick-icon\" src=\"/assets/icons/event.png\" mode=\"aspectFit\"></image>\r\n        <text class=\"quick-label\">事件</text>\r\n      </view>\r\n    </view>\r\n\r\n    <view class=\"section-head\">\r\n      <text class=\"section-title\">沿着时间走</text>\r\n      <text class=\"section-link\" bindtap=\"goDiscover\">全部朝代 ›</text>\r\n    </view>\r\n\r\n    <view class=\"era-row\">\r\n      <view class=\"era-card\" bindtap=\"onEraTap\">\r\n        <image class=\"era-bg\" src=\"/assets/tang-bg.jpg\" mode=\"aspectFill\"></image>\r\n        <view class=\"era-shade\"></view>\r\n        <text class=\"era-title\">{{era.title}}</text>\r\n        <text class=\"era-desc\">{{era.desc}}</text>\r\n      </view>\r\n      <view class=\"scroll-accent\">\r\n        <image class=\"scroll-accent-img\" src=\"/assets/scroll-accent.png\" mode=\"aspectFill\"></image>\r\n      </view>\r\n    </view>\r\n\r\n    <view class=\"modern-card\" bindtap=\"onModernTap\">\r\n      <view class=\"modern-copy\">\r\n        <text class=\"modern-kicker\">{{modern.kicker}}</text>\r\n        <text class=\"modern-title\">{{modern.shortTitle}}</text>\r\n        <text class=\"modern-desc\">{{modern.desc}}</text>\r\n      </view>\r\n      <view class=\"modern-years\">\r\n        <text>1840</text>\r\n        <view class=\"modern-dash\"></view>\r\n        <text>1949</text>\r\n      </view>\r\n    </view>\r\n  </view>\r\n\r\n  <view class=\"tabbar\">\r\n    <view class=\"tab active\" data-page=\"home\" bindtap=\"goTab\">\r\n      <image class=\"tab-icon\" src=\"/assets/icons/home-active.png\" mode=\"aspectFit\"></image>\r\n      <text>首页</text>\r\n    </view>\r\n    <view class=\"tab\" data-page=\"timeline\" bindtap=\"goTab\">\r\n      <image class=\"tab-icon\" src=\"/assets/icons/timeline.png\" mode=\"aspectFit\"></image>\r\n      <text>时间轴</text>\r\n    </view>\r\n    <view class=\"tab\" data-page=\"discover\" bindtap=\"goTab\">\r\n      <image class=\"tab-icon\" src=\"/assets/icons/discover.png\" mode=\"aspectFit\"></image>\r\n      <text>发现</text>\r\n    </view>\r\n    <view class=\"tab\" data-page=\"profile\" bindtap=\"goTab\">\r\n      <image class=\"tab-icon\" src=\"/assets/icons/profile.png\" mode=\"aspectFit\"></image>\r\n      <text>我的</text>\r\n    </view>\r\n  </view>\r\n</view>\r\n"; });
__register('/pages/home/home.wxss', function (require, module, exports) { module.exports = ".page {\n  position: relative;\n  min-height: 100vh;\n  overflow: hidden;\n  background: #F6F1EA;\n}\n\n.paper-bg {\n  position: fixed;\n  left: 0;\n  top: 0;\n  z-index: 0;\n  width: 100%;\n  height: 100%;\n  opacity: 0.96;\n}\n\n.screen {\n  position: relative;\n  z-index: 2;\n  padding: 0 46rpx 160rpx;\n}\n\n.topbar {\n  margin-top: 88rpx;\n  height: 124rpx;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n}\n\n.brand {\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\n  font-size: 58rpx;\n  font-weight: 400;\n  letter-spacing: 0.10em;\n  line-height: 1;\n  color: #1F1D19;\n}\n\n.date {\n  margin-top: 34rpx;\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\n  font-size: 30rpx;\n  letter-spacing: 0.04em;\n  color: #1F1D19;\n}\n\n.hero {\n  position: relative;\n  height: 412rpx;\n  margin-top: 24rpx;\n  border-radius: 42rpx;\n  background: #FCFAFB;\n  border: 1rpx solid rgba(80, 65, 48, 0.05);\n  box-shadow: 0 28rpx 58rpx rgba(90, 70, 50, 0.08), 0 4rpx 12rpx rgba(90, 70, 50, 0.03);\n  overflow: hidden;\n}\n\n.hero-inner {\n  position: relative;\n  z-index: 3;\n  padding: 30rpx 30rpx 0;\n}\n\n.hero-title {\n  display: block;\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\n  font-size: 46rpx;\n  font-weight: 400;\n  letter-spacing: 0.08em;\n  line-height: 1.1;\n  color: #1F1D19;\n}\n\n.hero-desc {\n  display: block;\n  max-width: 600rpx;\n  margin-top: 14rpx;\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\n  font-size: 24rpx;\n  line-height: 1.65;\n  color: #5F5A52;\n}\n\n.hero-art {\n  position: absolute;\n  left: 0;\n  bottom: 0;\n  z-index: 1;\n  width: 100%;\n  height: auto;\n  display: block;\n}\n\n.quick {\n  display: flex;\n  margin-top: 28rpx;\n}\n\n.quick-item {\n  flex: 1;\n  height: 168rpx;\n  margin-right: 20rpx;\n  border-radius: 34rpx;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  box-shadow: 0 16rpx 34rpx rgba(90, 70, 50, 0.045);\n}\n\n.quick-item:last-child {\n  margin-right: 0;\n}\n\n.quick-item.t1 {\n  background: #EEF0F0;\n}\n\n.quick-item.t2 {\n  background: #F1E8DD;\n}\n\n.quick-item.t3 {\n  background: #F0F0F1;\n}\n\n.quick-item.t4 {\n  background: #FBF9F6;\n}\n\n.quick-icon {\n  width: 46rpx;\n  height: 46rpx;\n  display: block;\n}\n\n.quick-char {\n  height: 54rpx;\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\n  font-size: 58rpx;\n  line-height: 1;\n  color: #2A2722;\n}\n\n.quick-label {\n  margin-top: 12rpx;\n  font-size: 21rpx;\n  letter-spacing: 0.04em;\n  color: #3B3731;\n}\n\n.section-head {\n  margin-top: 38rpx;\n  display: flex;\n  align-items: baseline;\n  justify-content: space-between;\n}\n\n.section-title {\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\n  font-size: 34rpx;\n  letter-spacing: 0.07em;\n  color: #1F1D19;\n}\n\n.section-link {\n  font-size: 19rpx;\n  letter-spacing: 0.04em;\n  color: #8C857A;\n}\n\n.era-row {\n  display: flex;\n  align-items: stretch;\n  gap: 16rpx;\n  margin-top: 20rpx;\n}\n\n.era-card {\n  position: relative;\n  flex: 1;\n  height: 216rpx;\n  padding: 26rpx 30rpx;\n  border-radius: 38rpx;\n  background: #F3EFE6;\n  overflow: hidden;\n  box-shadow: 0 20rpx 46rpx rgba(90, 70, 50, 0.06);\n}\n\n.era-title {\n  position: relative;\n  z-index: 2;\n  display: block;\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\n  font-size: 34rpx;\n  letter-spacing: 0.08em;\n  color: #1F1D19;\n}\n\n.era-desc {\n  position: relative;\n  z-index: 2;\n  display: block;\n  max-width: 350rpx;\n  margin-top: 12rpx;\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\n  font-size: 19rpx;\n  line-height: 1.55;\n  color: #5F5A52;\n}\n\n.era-bg {\n  position: absolute;\n  left: 0;\n  top: 0;\n  z-index: 0;\n  width: 100%;\n  height: 100%;\n  display: block;\n}\n\n.era-shade {\n  position: absolute;\n  left: 0;\n  top: 0;\n  bottom: 0;\n  z-index: 1;\n  width: 52%;\n  background: linear-gradient(90deg, rgba(250, 247, 241, 0.42), rgba(250, 247, 241, 0));\n  pointer-events: none;\n}\n\n.scroll-accent {\n  flex: 0 0 56rpx;\n  height: 216rpx;\n  border-radius: 28rpx;\n  overflow: hidden;\n  box-shadow: 0 16rpx 34rpx rgba(90, 70, 50, 0.05);\n}\n\n.scroll-accent-img {\n  width: 100%;\n  height: 100%;\n  display: block;\n}\n\n.modern-card {\n  position: relative;\n  height: 200rpx;\n  margin-top: 16rpx;\n  padding: 28rpx 30rpx;\n  border-radius: 38rpx;\n  background: #FCFBF8;\n  box-shadow: 0 20rpx 46rpx rgba(90, 70, 50, 0.05);\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  overflow: hidden;\n}\n\n.modern-copy {\n  position: relative;\n  z-index: 2;\n  flex: 1;\n  min-width: 0;\n  padding-right: 150rpx;\n}\n\n.modern-kicker {\n  display: block;\n  font-size: 15rpx;\n  letter-spacing: 0.12em;\n  color: #7E9A9A;\n}\n\n.modern-title {\n  display: block;\n  margin-top: 8rpx;\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\n  font-size: 34rpx;\n  letter-spacing: 0.05em;\n  color: #1F1D19;\n}\n\n.modern-desc {\n  display: block;\n  max-width: 420rpx;\n  margin-top: 9rpx;\n  font-size: 19rpx;\n  line-height: 1.55;\n  color: #5F5A52;\n}\n\n.modern-years {\n  position: absolute;\n  right: 28rpx;\n  bottom: 24rpx;\n  z-index: 2;\n  display: flex;\n  flex-direction: column;\n  align-items: flex-end;\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\n  font-size: 26rpx;\n  line-height: 1.1;\n  letter-spacing: 0.03em;\n  color: #A9BCC4;\n}\n\n.modern-dash {\n  width: 44rpx;\n  height: 1rpx;\n  margin: 8rpx 0;\n  background: rgba(126, 154, 154, 0.55);\n}\n\n.tabbar {\n  position: fixed;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  z-index: 10;\n  min-height: 128rpx;\n  padding: 16rpx 20rpx 0;\n  padding-bottom: constant(safe-area-inset-bottom);\n  padding-bottom: env(safe-area-inset-bottom);\n  display: flex;\n  background: rgba(250, 248, 243, 0.96);\n  border-top: 1rpx solid rgba(70, 58, 45, 0.10);\n}\n\n.tab {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 10rpx;\n  font-size: 20rpx;\n  letter-spacing: 0.03em;\n  color: #7B746A;\n}\n\n.tab-icon {\n  width: 44rpx;\n  height: 44rpx;\n  display: block;\n  opacity: 0.52;\n}\n\n.tab.active {\n  color: #211E1A;\n}\n\n.tab.active .tab-icon {\n  opacity: 1;\n}\n"; });
__register('/pages/timeline/timeline.js', function (require, module, exports) {
const history = require('../../data/history.js');

Page('project://pages/timeline/timeline.js', {
  data: {
    mode: 'ancient',
    eraName: '',
    eraMeta: '',
    events: []
  },

  onLoad(options) {
    const mode = options && options.mode === 'modern' ? 'modern' : 'ancient';
    this.loadMode(mode);
  },

  switchMode(e) {
    const mode = e.currentTarget.dataset.mode;
    if (!mode || mode === this.data.mode) return;
    this.loadMode(mode);
  },

  loadMode(mode) {
    // 纪年升序；轴上圆点红/青相间
    const events = history.events
      .filter((item) => item.mode === mode)
      .sort((a, b) => a.year - b.year)
      .map((item, index) => ({
        ...item,
        dotClass: index % 2 === 0 ? 'dot-red' : 'dot-teal',
        // 公元前的纪年用朱砂显示
        yearAncientText: item.year < 0
      }));

    // 时代带全部由事件数据推导：涵盖的时期名 + 纪年区间
    const eras = [];
    events.forEach((event) => {
      if (eras.indexOf(event.era) < 0) eras.push(event.era);
    });
    const years = events.map((event) => event.year);
    const eraName = eras.length > 1 ? `${eras[0]}—${eras[eras.length - 1]}` : eras[0] || '';
    const first = events[0];
    const last = events[events.length - 1];
    const fmt = (item) => (item.year < 0 ? `公元前${-item.year}` : item.year);
    const eraMeta = `${first ? fmt(first) : ''}–${last ? fmt(last) : ''} · ${eras.join(' / ')}`;

    this.setData({
      mode,
      events,
      eraName,
      eraMeta
    });
  },

  goTab(e) {
    const page = e.currentTarget.dataset.page;
    if (!page || page === 'timeline') return;
    wx.redirectTo({
      url: `/pages/${page}/${page}`
    });
  },

  onEvent(e) {
    const id = e.currentTarget.dataset.id;
    const item = history.events.find((event) => event.id === id);
    if (!item) return;
    wx.navigateTo({ url: `/pages/event/event?id=${item.id}` });
  },

  onShareAppMessage() {
    return { title: '史页 · 时间轴上的中国', path: '/pages/timeline/timeline' };
  }
});

});
__register('/pages/timeline/timeline.wxml', function (require, module, exports) { module.exports = "<view class=\"page\">\r\n  <image class=\"paper-bg\" src=\"/assets/paper-bg.jpg\" mode=\"aspectFill\"></image>\r\n  <view class=\"screen\">\r\n\r\n    <view class=\"header\">\r\n      <view class=\"topbar\">\r\n        <text class=\"brand\">时间轴</text>\r\n        <image class=\"brand-seal\" src=\"/assets/seal.png\" mode=\"aspectFit\"></image>\r\n      </view>\r\n      <view class=\"intro\">从史前到今天，一条可以走下去的河。</view>\r\n    </view>\r\n\r\n    <view class=\"seg\">\r\n      <text class=\"seg-item {{mode === 'ancient' ? 'active' : ''}}\" data-mode=\"ancient\" bindtap=\"switchMode\">古代</text>\r\n      <text class=\"seg-item {{mode === 'modern' ? 'active' : ''}}\" data-mode=\"modern\" bindtap=\"switchMode\">近现代</text>\r\n    </view>\r\n\r\n    <view class=\"era-band\">\r\n      <view class=\"era-title-row\">\r\n        <text class=\"era-name\">{{eraName}}</text>\r\n        <image class=\"era-mini-seal\" src=\"/assets/seal.png\" mode=\"aspectFit\"></image>\r\n      </view>\r\n      <text class=\"era-meta\">{{eraMeta}}</text>\r\n    </view>\r\n\r\n    <view class=\"event-list\">\r\n      <view class=\"rail\"></view>\r\n      <view\r\n        wx:for=\"{{events}}\"\r\n        wx:key=\"id\"\r\n        class=\"event-item\"\r\n        data-id=\"{{item.id}}\"\r\n        bindtap=\"onEvent\"\r\n      >\r\n        <text class=\"dot {{item.dotClass}}\"></text>\r\n        <view class=\"event-card\">\r\n          <view class=\"event-head\">\r\n            <text class=\"event-year {{item.yearAncientText ? 'year-red' : ''}}\">{{item.yearText}}</text>\r\n            <text class=\"event-title\">{{item.title}}</text>\r\n          </view>\r\n          <text class=\"event-desc\">{{item.desc}}</text>\r\n          <text class=\"event-tags\">{{item.tags}}</text>\r\n          <text class=\"event-source\">（史料 · {{item.source}}）</text>\r\n        </view>\r\n      </view>\r\n    </view>\r\n  </view>\r\n\r\n  <view class=\"tabbar\">\r\n    <view class=\"tab\" data-page=\"home\" bindtap=\"goTab\">\r\n      <image class=\"tab-icon\" src=\"/assets/icons/home.png\" mode=\"aspectFit\"></image>\r\n      <text>首页</text>\r\n    </view>\r\n    <view class=\"tab active\" data-page=\"timeline\" bindtap=\"goTab\">\r\n      <image class=\"tab-icon\" src=\"/assets/icons/timeline.png\" mode=\"aspectFit\"></image>\r\n      <text>时间轴</text>\r\n    </view>\r\n    <view class=\"tab\" data-page=\"discover\" bindtap=\"goTab\">\r\n      <image class=\"tab-icon\" src=\"/assets/icons/discover.png\" mode=\"aspectFit\"></image>\r\n      <text>发现</text>\r\n    </view>\r\n    <view class=\"tab\" data-page=\"profile\" bindtap=\"goTab\">\r\n      <image class=\"tab-icon\" src=\"/assets/icons/profile.png\" mode=\"aspectFit\"></image>\r\n      <text>我的</text>\r\n    </view>\r\n  </view>\r\n</view>\r\n"; });
__register('/pages/timeline/timeline.wxss', function (require, module, exports) { module.exports = ".page {\r\n  position: relative;\r\n  min-height: 100vh;\r\n  overflow: hidden;\r\n  background: #F6F1EA;\r\n}\r\n\r\n.paper-bg {\r\n  position: fixed;\r\n  left: 0;\r\n  top: 0;\r\n  z-index: 0;\r\n  width: 100%;\r\n  height: 100%;\r\n  opacity: 0.96;\r\n}\r\n\r\n/* 参考图四周的内框细线 */\r\n.screen {\r\n  position: relative;\r\n  z-index: 2;\r\n  padding: 0 56rpx 160rpx;\r\n}\r\n\r\n/* 顶部：品牌行 */\r\n.header {\r\n  position: relative;\r\n  margin-top: 76rpx;\r\n}\r\n\r\n.topbar {\r\n  position: relative;\r\n  z-index: 2;\r\n  display: flex;\r\n  align-items: flex-start;\r\n  gap: 20rpx;\r\n}\r\n\r\n.brand {\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 60rpx;\r\n  font-weight: 400;\r\n  letter-spacing: 0.10em;\r\n  line-height: 1.15;\r\n  color: #1F1D19;\r\n}\r\n\r\n/* 标题旁的小朱砂印：首页同款\"史载\"印章图（assets/seal.png，自 palace 裁切） */\r\n.brand-seal {\r\n  margin-top: 10rpx;\r\n  width: 38rpx;\r\n  height: 64rpx;\r\n  transform: rotate(2deg);\r\n}\r\n\r\n.intro {\r\n  position: relative;\r\n  z-index: 2;\r\n  margin-top: 22rpx;\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 24rpx;\r\n  line-height: 1.6;\r\n  letter-spacing: 0.02em;\r\n  color: #5F5A52;\r\n}\r\n\r\n/* 古代 / 近现代 分段 */\r\n.seg {\r\n  position: relative;\r\n  z-index: 2;\r\n  display: flex;\r\n  margin-top: 30rpx;\r\n  padding: 8rpx;\r\n  border-radius: 44rpx;\r\n  background: rgba(252, 251, 248, 0.94);\r\n  box-shadow: inset 0 0 0 1rpx rgba(70, 58, 45, 0.06);\r\n}\r\n\r\n.seg-item {\r\n  flex: 1;\r\n  height: 78rpx;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  border-radius: 36rpx;\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 28rpx;\r\n  letter-spacing: 0.10em;\r\n  color: #1F1D19;\r\n}\r\n\r\n.seg-item.active {\r\n  background: #FCFBF8;\r\n  color: #A34A3E;\r\n  box-shadow: 0 10rpx 24rpx rgba(90, 70, 50, 0.10), inset 0 0 0 1rpx rgba(163, 74, 62, 0.16);\r\n}\r\n\r\n/* 朝代头卡 */\r\n.era-band {\r\n  position: relative;\r\n  z-index: 2;\r\n  margin-top: 30rpx;\r\n  padding: 30rpx 34rpx;\r\n  border-radius: 36rpx;\r\n  background: #FCFBF8;\r\n  box-shadow: 0 20rpx 46rpx rgba(90, 70, 50, 0.06);\r\n}\r\n\r\n.era-title-row {\r\n  display: flex;\r\n  align-items: flex-start;\r\n  gap: 16rpx;\r\n}\r\n\r\n.era-name {\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 52rpx;\r\n  letter-spacing: 0.10em;\r\n  line-height: 1.15;\r\n  color: #1F1D19;\r\n}\r\n\r\n/* 北宋旁的小立印：同款印章图 */\r\n.era-mini-seal {\r\n  margin-top: 8rpx;\r\n  width: 34rpx;\r\n  height: 58rpx;\r\n  transform: rotate(2deg);\r\n}\r\n\r\n.era-meta {\r\n  display: block;\r\n  margin-top: 14rpx;\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 22rpx;\r\n  letter-spacing: 0.04em;\r\n  color: #8C857A;\r\n}\r\n\r\n/* 沿竖线挂卡的事件列表 */\r\n.event-list {\r\n  position: relative;\r\n  z-index: 2;\r\n  margin-top: 32rpx;\r\n  padding-left: 56rpx;\r\n}\r\n\r\n.rail {\r\n  position: absolute;\r\n  left: 19rpx;\r\n  top: 16rpx;\r\n  bottom: 26rpx;\r\n  width: 2rpx;\r\n  background: rgba(31, 27, 22, 0.26);\r\n}\r\n\r\n.event-item {\r\n  position: relative;\r\n  margin-bottom: 30rpx;\r\n}\r\n\r\n.dot {\r\n  position: absolute;\r\n  left: -45rpx;\r\n  top: 40rpx;\r\n  width: 18rpx;\r\n  height: 18rpx;\r\n  border-radius: 50%;\r\n  z-index: 2;\r\n}\r\n\r\n.dot-red {\r\n  background: #A34A3E;\r\n}\r\n\r\n.dot-teal {\r\n  background: #7E9A9A;\r\n}\r\n\r\n.event-card {\r\n  padding: 28rpx 30rpx;\r\n  border-radius: 30rpx;\r\n  background: #FCFBF8;\r\n  box-shadow: 0 18rpx 40rpx rgba(90, 70, 50, 0.06);\r\n}\r\n\r\n.event-head {\r\n  display: flex;\r\n  align-items: baseline;\r\n  gap: 18rpx;\r\n  flex-wrap: wrap;\r\n}\r\n\r\n.event-year {\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 32rpx;\r\n  letter-spacing: 0.05em;\r\n  color: #1F1D19;\r\n}\r\n\r\n.event-year.year-red {\r\n  font-size: 24rpx;\r\n  color: #A34A3E;\r\n}\r\n\r\n.event-title {\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 32rpx;\r\n  letter-spacing: 0.07em;\r\n  color: #1F1D19;\r\n}\r\n\r\n.event-desc {\r\n  display: block;\r\n  margin-top: 14rpx;\r\n  font-size: 21rpx;\r\n  line-height: 1.7;\r\n  color: #5F5A52;\r\n}\r\n\r\n.event-tags {\r\n  display: block;\r\n  margin-top: 12rpx;\r\n  font-size: 17rpx;\r\n  letter-spacing: 0.05em;\r\n  color: #8C857A;\r\n}\r\n\r\n.event-source {\r\n  display: block;\r\n  margin-top: 8rpx;\r\n  font-family: \"KaiTi\", \"STKaiti\", serif;\r\n  font-size: 17rpx;\r\n  letter-spacing: 0.02em;\r\n  color: #A39A8E;\r\n}\r\n\r\n.tabbar {\r\n  position: fixed;\r\n  left: 0;\r\n  right: 0;\r\n  bottom: 0;\r\n  z-index: 10;\r\n  min-height: 128rpx;\r\n  padding: 16rpx 20rpx 0;\r\n  padding-bottom: constant(safe-area-inset-bottom);\r\n  padding-bottom: env(safe-area-inset-bottom);\r\n  display: flex;\r\n  background: rgba(250, 248, 243, 0.96);\r\n  border-top: 1rpx solid rgba(70, 58, 45, 0.10);\r\n}\r\n\r\n.tab {\r\n  flex: 1;\r\n  display: flex;\r\n  flex-direction: column;\r\n  align-items: center;\r\n  gap: 10rpx;\r\n  font-size: 20rpx;\r\n  letter-spacing: 0.03em;\r\n  color: #7B746A;\r\n}\r\n\r\n.tab-icon {\r\n  width: 44rpx;\r\n  height: 44rpx;\r\n  display: block;\r\n  opacity: 0.52;\r\n}\r\n\r\n.tab.active {\r\n  color: #211E1A;\r\n}\r\n\r\n.tab.active .tab-icon {\r\n  opacity: 1;\r\n}\r\n"; });
__register('/pages/discover/discover.js', function (require, module, exports) {
const history = require('../../data/history.js');

// 朝代卡配图（搜图素材，见 assets/paintings/SOURCES.md）
const PERIOD_META = {
  han: { img: '/assets/paintings/han.jpg', yearText: '前202–公元9', seal: '汉' },
  tang: { img: '/assets/paintings/tang.jpg', yearText: '618–907', seal: '唐' },
  song: { img: '/assets/paintings/song.jpg', yearText: '960–1127', seal: '宋' },
  modern: { img: '/assets/paintings/modern.jpg', yearText: '1840–1949', seal: '近' }
};

Page('project://pages/discover/discover.js', {
  data: {
    periods: [],
    era: {},
    modern: {},
    picks: []
  },

  onLoad() {
    const periods = history.periods
      .filter((item) => PERIOD_META[item.id])
      .map((item) => ({
        ...item,
        ...PERIOD_META[item.id],
        isModern: item.id === 'modern'
      }));

    this.setData({
      periods,
      era: history.topics.find((item) => item.id === 'tang'),
      modern: history.topics.find((item) => item.id === 'modern-china'),
      picks: history.events.slice(-6).reverse()
    });
  },

  goTab(e) {
    const page = e.currentTarget.dataset.page;
    if (!page || page === 'discover') return;
    wx.redirectTo({ url: `/pages/${page}/${page}` });
  },

  goTimeline(e) {
    const mode = e.currentTarget.dataset.mode || 'ancient';
    wx.redirectTo({ url: `/pages/timeline/timeline?mode=${mode}` });
  },

  goTimeband(e) {
    const mode = e.currentTarget.dataset.mode || 'ancient';
    wx.redirectTo({ url: `/pages/timeline/timeline?mode=${mode}` });
  },

  onPeriod(e) {
    const id = e.currentTarget.dataset.id;
    if (!history.periods.find((period) => period.id === id)) return;
    wx.navigateTo({ url: `/pages/period/period?id=${id}` });
  },

  onPick(e) {
    wx.navigateTo({
      url: `/pages/event/event?id=${e.currentTarget.dataset.id}`
    });
  },

  onShareAppMessage() {
    return { title: '史页 · 发现', path: '/pages/discover/discover' };
  }
});

});
__register('/pages/discover/discover.wxml', function (require, module, exports) { module.exports = "<view class=\"page\">\r\n  <image class=\"paper-bg\" src=\"/assets/paper-bg.jpg\" mode=\"aspectFill\"></image>\r\n  <view class=\"screen\">\r\n    <view class=\"topbar\">\r\n      <text class=\"brand\">发现</text>\r\n    </view>\r\n\r\n    <view class=\"intro\">朝代在文物里，专题在长卷里。</view>\r\n\r\n    <view class=\"section-head\">\r\n      <text class=\"section-title\">朝代一览</text>\r\n      <text class=\"section-link\">点开看简介</text>\r\n    </view>\r\n    <view class=\"dyn-grid\">\r\n      <view\r\n        wx:for=\"{{periods}}\"\r\n        wx:key=\"id\"\r\n        class=\"dyn-card {{item.isModern ? 'dyn-modern' : ''}}\"\r\n        data-id=\"{{item.id}}\"\r\n        bindtap=\"onPeriod\"\r\n      >\r\n        <image class=\"dyn-bg\" src=\"{{item.img}}\" mode=\"aspectFill\"></image>\r\n        <view class=\"dyn-shade\"></view>\r\n        <view class=\"dyn-copy\">\r\n          <text class=\"dyn-name\">{{item.name}}</text>\r\n          <text class=\"dyn-years\">{{item.yearText}}</text>\r\n        </view>\r\n        <text class=\"dyn-title\">{{item.title}}</text>\r\n      </view>\r\n    </view>\r\n\r\n    <view class=\"section-head\">\r\n      <text class=\"section-title\">专题长卷</text>\r\n      <text class=\"section-link\" bindtap=\"goTimeband\" data-mode=\"ancient\">进时间轴 ›</text>\r\n    </view>\r\n    <view class=\"era-card\" data-mode=\"ancient\" bindtap=\"goTimeline\">\r\n      <image class=\"era-bg\" src=\"/assets/tang-bg.jpg\" mode=\"aspectFill\"></image>\r\n      <view class=\"era-shade\"></view>\r\n      <view class=\"era-copy\">\r\n        <text class=\"era-title\">{{era.title}}</text>\r\n        <text class=\"era-desc\">{{era.desc}}</text>\r\n      </view>\r\n      <text class=\"era-go\">›</text>\r\n    </view>\r\n    <view class=\"modern-card\" data-mode=\"modern\" bindtap=\"goTimeline\">\r\n      <view class=\"modern-copy\">\r\n        <text class=\"modern-kicker\">{{modern.kicker}}</text>\r\n        <text class=\"modern-title\">{{modern.shortTitle}}</text>\r\n        <text class=\"modern-desc\">{{modern.desc}}</text>\r\n      </view>\r\n      <view class=\"modern-years\">\r\n        <text>1840</text>\r\n        <view class=\"modern-dash\"></view>\r\n        <text>1949</text>\r\n      </view>\r\n    </view>\r\n\r\n    <view class=\"section-head\">\r\n      <text class=\"section-title\">精选史事</text>\r\n      <text class=\"section-link\" bindtap=\"goTimeline\" data-mode=\"modern\">近现代起读 ›</text>\r\n    </view>\r\n    <view class=\"pick-list\">\r\n      <view\r\n        wx:for=\"{{picks}}\"\r\n        wx:key=\"id\"\r\n        class=\"pick-card\"\r\n        data-id=\"{{item.id}}\"\r\n        bindtap=\"onPick\"\r\n      >\r\n        <text class=\"pick-year {{item.mode === 'modern' ? 'pick-year-modern' : ''}}\">{{item.yearText}}</text>\r\n        <view class=\"pick-body\">\r\n          <text class=\"pick-title\">{{item.title}}</text>\r\n          <text class=\"pick-desc\">{{item.desc}}</text>\r\n        </view>\r\n        <text class=\"pick-arrow\">›</text>\r\n      </view>\r\n    </view>\r\n\r\n    <view class=\"tba-note\">世纪 · 历史地图 · 更多专题，正在整理中。</view>\r\n  </view>\r\n\r\n  <view class=\"tabbar\">\r\n    <view class=\"tab\" data-page=\"home\" bindtap=\"goTab\">\r\n      <image class=\"tab-icon\" src=\"/assets/icons/home.png\" mode=\"aspectFit\"></image>\r\n      <text>首页</text>\r\n    </view>\r\n    <view class=\"tab\" data-page=\"timeline\" bindtap=\"goTab\">\r\n      <image class=\"tab-icon\" src=\"/assets/icons/timeline.png\" mode=\"aspectFit\"></image>\r\n      <text>时间轴</text>\r\n    </view>\r\n    <view class=\"tab active\" data-page=\"discover\" bindtap=\"goTab\">\r\n      <image class=\"tab-icon\" src=\"/assets/icons/discover.png\" mode=\"aspectFit\"></image>\r\n      <text>发现</text>\r\n    </view>\r\n    <view class=\"tab\" data-page=\"profile\" bindtap=\"goTab\">\r\n      <image class=\"tab-icon\" src=\"/assets/icons/profile.png\" mode=\"aspectFit\"></image>\r\n      <text>我的</text>\r\n    </view>\r\n  </view>\r\n</view>\r\n"; });
__register('/pages/discover/discover.wxss', function (require, module, exports) { module.exports = ".page {\r\n  position: relative;\r\n  min-height: 100vh;\r\n  overflow: hidden;\r\n  background: #F6F1EA;\r\n}\r\n\r\n.paper-bg {\r\n  position: fixed;\r\n  left: 0;\r\n  top: 0;\r\n  z-index: 0;\r\n  width: 100%;\r\n  height: 100%;\r\n  opacity: 0.96;\r\n}\r\n\r\n.screen {\r\n  position: relative;\r\n  z-index: 2;\r\n  padding: 0 46rpx 160rpx;\r\n}\r\n\r\n.topbar {\r\n  margin-top: 88rpx;\r\n  height: 124rpx;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: space-between;\r\n}\r\n\r\n.brand {\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 54rpx;\r\n  font-weight: 400;\r\n  letter-spacing: 0.08em;\r\n  color: #1F1D19;\r\n}\r\n\r\n.intro {\r\n  margin-top: 26rpx;\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 24rpx;\r\n  line-height: 1.6;\r\n  letter-spacing: 0.02em;\r\n  color: #5F5A52;\r\n}\r\n\r\n.section-head {\r\n  margin-top: 38rpx;\r\n  display: flex;\r\n  align-items: baseline;\r\n  justify-content: space-between;\r\n}\r\n\r\n.section-title {\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 34rpx;\r\n  letter-spacing: 0.07em;\r\n  color: #1F1D19;\r\n}\r\n\r\n.section-link {\r\n  font-size: 19rpx;\r\n  letter-spacing: 0.04em;\r\n  color: #8C857A;\r\n}\r\n\r\n/* 朝代 2×2 卡 */\r\n.dyn-grid {\r\n  margin-top: 20rpx;\r\n  display: flex;\r\n  flex-wrap: wrap;\r\n  gap: 18rpx;\r\n}\r\n\r\n.dyn-card {\r\n  position: relative;\r\n  width: 320rpx;\r\n  height: 300rpx;\r\n  border-radius: 34rpx;\r\n  overflow: hidden;\r\n  box-shadow: 0 20rpx 46rpx rgba(90, 70, 50, 0.07);\r\n}\r\n\r\n.dyn-bg {\r\n  position: absolute;\r\n  left: 0;\r\n  top: 0;\r\n  width: 100%;\r\n  height: 100%;\r\n  display: block;\r\n}\r\n\r\n.dyn-shade {\r\n  position: absolute;\r\n  left: 0;\r\n  right: 0;\r\n  bottom: 0;\r\n  top: 0;\r\n  background: linear-gradient(180deg, rgba(246, 241, 234, 0.06) 40%, rgba(31, 27, 22, 0.55));\r\n}\r\n\r\n.dyn-copy {\r\n  position: absolute;\r\n  left: 24rpx;\r\n  bottom: 20rpx;\r\n  z-index: 2;\r\n}\r\n\r\n.dyn-name {\r\n  display: block;\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 40rpx;\r\n  letter-spacing: 0.08em;\r\n  color: #FFF8EF;\r\n}\r\n\r\n.dyn-years {\r\n  display: block;\r\n  margin-top: 6rpx;\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 19rpx;\r\n  letter-spacing: 0.05em;\r\n  color: rgba(255, 248, 239, 0.78);\r\n}\r\n\r\n.dyn-title {\r\n  position: absolute;\r\n  right: 24rpx;\r\n  top: 20rpx;\r\n  z-index: 2;\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 20rpx;\r\n  letter-spacing: 0.08em;\r\n  color: rgba(31, 27, 22, 0.72);\r\n  background: rgba(252, 251, 248, 0.72);\r\n  padding: 6rpx 14rpx;\r\n  border-radius: 16rpx;\r\n}\r\n\r\n.dyn-card.dyn-modern .dyn-title {\r\n  color: rgba(126, 154, 154, 0.95);\r\n}\r\n\r\n/* 专题卡（盛唐气象复用首页视觉语言） */\r\n.era-card {\r\n  position: relative;\r\n  height: 216rpx;\r\n  margin-top: 20rpx;\r\n  padding: 26rpx 30rpx;\r\n  border-radius: 38rpx;\r\n  overflow: hidden;\r\n  box-shadow: 0 20rpx 46rpx rgba(90, 70, 50, 0.06);\r\n}\r\n\r\n.era-bg {\r\n  position: absolute;\r\n  left: 0;\r\n  top: 0;\r\n  width: 100%;\r\n  height: 100%;\r\n  display: block;\r\n}\r\n\r\n.era-shade {\r\n  position: absolute;\r\n  left: 0;\r\n  top: 0;\r\n  bottom: 0;\r\n  width: 52%;\r\n  background: linear-gradient(90deg, rgba(250, 247, 241, 0.42), rgba(250, 247, 241, 0));\r\n  pointer-events: none;\r\n}\r\n\r\n.era-copy {\r\n  position: relative;\r\n  z-index: 2;\r\n  max-width: 480rpx;\r\n}\r\n\r\n.era-title {\r\n  display: block;\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 34rpx;\r\n  letter-spacing: 0.08em;\r\n  color: #1F1D19;\r\n}\r\n\r\n.era-desc {\r\n  display: block;\r\n  margin-top: 12rpx;\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 19rpx;\r\n  line-height: 1.55;\r\n  color: #5F5A52;\r\n}\r\n\r\n.era-go {\r\n  position: absolute;\r\n  right: 28rpx;\r\n  bottom: 22rpx;\r\n  z-index: 2;\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 36rpx;\r\n  color: rgba(31, 27, 22, 0.45);\r\n}\r\n\r\n.modern-card {\r\n  position: relative;\r\n  height: 200rpx;\r\n  margin-top: 16rpx;\r\n  padding: 28rpx 30rpx;\r\n  border-radius: 38rpx;\r\n  background: #FCFBF8;\r\n  box-shadow: 0 20rpx 46rpx rgba(90, 70, 50, 0.05);\r\n  display: flex;\r\n  align-items: center;\r\n  overflow: hidden;\r\n}\r\n\r\n.modern-copy {\r\n  position: relative;\r\n  z-index: 2;\r\n  flex: 1;\r\n  min-width: 0;\r\n  padding-right: 150rpx;\r\n}\r\n\r\n.modern-kicker {\r\n  display: block;\r\n  font-size: 15rpx;\r\n  letter-spacing: 0.12em;\r\n  color: #7E9A9A;\r\n}\r\n\r\n.modern-title {\r\n  display: block;\r\n  margin-top: 8rpx;\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 34rpx;\r\n  letter-spacing: 0.05em;\r\n  color: #1F1D19;\r\n}\r\n\r\n.modern-desc {\r\n  display: block;\r\n  max-width: 420rpx;\r\n  margin-top: 9rpx;\r\n  font-size: 19rpx;\r\n  line-height: 1.55;\r\n  color: #5F5A52;\r\n}\r\n\r\n.modern-years {\r\n  position: absolute;\r\n  right: 28rpx;\r\n  bottom: 24rpx;\r\n  display: flex;\r\n  flex-direction: column;\r\n  align-items: flex-end;\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 26rpx;\r\n  line-height: 1.1;\r\n  letter-spacing: 0.03em;\r\n  color: #A9BCC4;\r\n}\r\n\r\n.modern-dash {\r\n  width: 44rpx;\r\n  height: 1rpx;\r\n  margin: 8rpx 0;\r\n  background: rgba(126, 154, 154, 0.55);\r\n}\r\n\r\n/* 精选史事 */\r\n.pick-list {\r\n  margin-top: 20rpx;\r\n}\r\n\r\n.pick-card {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 20rpx;\r\n  margin-bottom: 16rpx;\r\n  padding: 24rpx 26rpx;\r\n  border-radius: 30rpx;\r\n  background: #FCFBF8;\r\n  box-shadow: 0 16rpx 34rpx rgba(90, 70, 50, 0.04);\r\n}\r\n\r\n.pick-year {\r\n  width: 130rpx;\r\n  flex: 0 0 130rpx;\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 22rpx;\r\n  color: #A9825E;\r\n}\r\n\r\n.pick-year-modern {\r\n  color: #7E9A9A;\r\n}\r\n\r\n.pick-body {\r\n  flex: 1;\r\n  min-width: 0;\r\n}\r\n\r\n.pick-title {\r\n  display: block;\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 27rpx;\r\n  letter-spacing: 0.04em;\r\n  color: #1F1D19;\r\n}\r\n\r\n.pick-desc {\r\n  display: block;\r\n  margin-top: 6rpx;\r\n  font-size: 20rpx;\r\n  line-height: 1.55;\r\n  color: #5F5A52;\r\n}\r\n\r\n.pick-arrow {\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 32rpx;\r\n  color: #A39A8E;\r\n}\r\n\r\n.tba-note {\r\n  margin-top: 26rpx;\r\n  font-size: 18rpx;\r\n  letter-spacing: 0.04em;\r\n  color: #A39A8E;\r\n}\r\n\r\n.tabbar {\r\n  position: fixed;\r\n  left: 0;\r\n  right: 0;\r\n  bottom: 0;\r\n  z-index: 10;\r\n  min-height: 128rpx;\r\n  padding: 16rpx 20rpx 0;\r\n  padding-bottom: constant(safe-area-inset-bottom);\r\n  padding-bottom: env(safe-area-inset-bottom);\r\n  display: flex;\r\n  background: rgba(250, 248, 243, 0.96);\r\n  border-top: 1rpx solid rgba(70, 58, 45, 0.10);\r\n}\r\n\r\n.tab {\r\n  flex: 1;\r\n  display: flex;\r\n  flex-direction: column;\r\n  align-items: center;\r\n  gap: 10rpx;\r\n  font-size: 20rpx;\r\n  letter-spacing: 0.03em;\r\n  color: #7B746A;\r\n}\r\n\r\n.tab-icon {\r\n  width: 44rpx;\r\n  height: 44rpx;\r\n  display: block;\r\n  opacity: 0.52;\r\n}\r\n\r\n.tab.active {\r\n  color: #211E1A;\r\n}\r\n\r\n.tab.active .tab-icon {\r\n  opacity: 1;\r\n}\r\n"; });
__register('/pages/profile/profile.js', function (require, module, exports) {
const history = require('../../data/history.js');
const store = require('../../utils/store.js');

const MODERN_ERAS = ['晚清', '民国', '新中国', '近现代', '现代'];

// type+id → 展示条目（人物/事件）
function resolveEntry(x) {
  if (x.type === 'person') {
    const p = history.persons.find((item) => item.id === x.id);
    if (!p) return null;
    return {
      type: 'person',
      id: p.id,
      title: p.name,
      sub: `${p.era} · ${p.roles}`,
      modern: MODERN_ERAS.indexOf(p.era) >= 0
    };
  }
  if (x.type === 'event') {
    const ev = history.events.find((item) => item.id === x.id);
    if (!ev) return null;
    return {
      type: 'event',
      id: ev.id,
      title: ev.title,
      sub: `${ev.yearText} · ${ev.era}`,
      modern: ev.mode === 'modern'
    };
  }
  return null;
}

function fmtWhen(ts) {
  const d = new Date(ts);
  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

Page('project://pages/profile/profile.js', {
  data: {
    stats: [
      { key: 'periods', label: '朝代', value: 0 },
      { key: 'events', label: '史事', value: 0 },
      { key: 'persons', label: '人物', value: 0 },
      { key: 'topics', label: '专题', value: 0 }
    ],
    favs: [],
    favCount: 0,
    foots: [],
    footCount: 0
  },

  onLoad() {
    this.setData({
      stats: [
        { key: 'periods', label: '朝代', value: history.periods.length },
        { key: 'events', label: '史事', value: history.events.length },
        { key: 'persons', label: '人物', value: history.persons.length },
        { key: 'topics', label: '专题', value: history.topics.length }
      ]
    });
  },

  onShow() {
    const favs = store
      .listFavorites()
      .map(resolveEntry)
      .filter(Boolean);
    const foots = store
      .listFootprints()
      .map((x) => {
        const entry = resolveEntry(x);
        return entry ? { ...entry, when: fmtWhen(x.ts) } : null;
      })
      .filter(Boolean);
    this.setData({ favs, favCount: favs.length, foots, footCount: foots.length });
  },

  goTab(e) {
    const page = e.currentTarget.dataset.page;
    if (!page || page === 'profile') return;
    wx.redirectTo({ url: `/pages/${page}/${page}` });
  },

  onSearch() {
    wx.navigateTo({ url: '/pages/search/search' });
  },

  onEntry(e) {
    const { type, id } = e.currentTarget.dataset;
    const url = type === 'person' ? `/pages/person/person?id=${id}` : `/pages/event/event?id=${id}`;
    const exist = history[type === 'person' ? 'persons' : 'events'].find((item) => item.id === id);
    if (!exist) return;
    wx.navigateTo({ url });
  },

  onDataNote() {
    wx.showModal({
      title: '数据与史料说明',
      content: [
        '当前内容为本地真实史料种子：',
        `朝代 ${this.data.stats[0].value} 条、史事 ${this.data.stats[1].value} 条、人物 ${this.data.stats[2].value} 条、专题 ${this.data.stats[3].value} 条。`,
        '每条均附史料出处索引；正式发布前会逐条完成历史审校。'
      ].join('\n'),
      showCancel: false,
      confirmText: '知道了'
    });
  },

  onAssetNote() {
    wx.showModal({
      title: '素材与授权说明',
      content: '插画与文物图片来自公开网络搜索与参考图裁切，仅用于原型演示；正式上线前将替换为有授权的来源。明细见工程 assets/paintings/SOURCES.md。',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  onAbout() {
    wx.showModal({
      title: '史页',
      content: '一页一页读历史。古代史与近现代史并列，史料可追溯。',
      showCancel: false
    });
  },

  onAboutBanner() {
    wx.showModal({
      title: '千古长卷',
      content: '王希孟《千里江山图》卷（局部），现藏故宫博物院。十八岁完成此卷，青绿千年不褪。',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  onClearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '只清空本地临时缓存；收藏与浏览足迹会一并清除。',
      confirmText: '清除',
      success: (res) => {
        if (!res.confirm) return;
        wx.clearStorageSync();
        this.onShow();
        wx.showToast({ title: '已清除', icon: 'success' });
      }
    });
  }
});

});
__register('/pages/profile/profile.wxml', function (require, module, exports) { module.exports = "<view class=\"page\">\r\n  <image class=\"paper-bg\" src=\"/assets/paper-bg.jpg\" mode=\"aspectFill\"></image>\r\n  <view class=\"screen\">\r\n    <view class=\"topbar\">\r\n      <text class=\"brand\">我的</text>\r\n    </view>\r\n\r\n    <view class=\"head-card\">\r\n      <view class=\"avatar-wrap\">\r\n        <image class=\"avatar\" src=\"/assets/paintings/landscape.jpg\" mode=\"aspectFill\"></image>\r\n      </view>\r\n      <view class=\"head-info\">\r\n        <text class=\"nick\">史页客</text>\r\n        <text class=\"tagline\">以千年为卷轴，读万古事</text>\r\n      </view>\r\n      <text class=\"head-seal\">史</text>\r\n    </view>\r\n\r\n    <view class=\"stats-card\">\r\n      <view class=\"stat\" wx:for=\"{{stats}}\" wx:key=\"key\">\r\n        <text class=\"stat-num\">{{item.value}}</text>\r\n        <text class=\"stat-label\">{{item.label}}</text>\r\n      </view>\r\n    </view>\r\n\r\n    <view class=\"banner-card\" bindtap=\"onAboutBanner\">\r\n      <image class=\"banner-bg\" src=\"/assets/paintings/landscape.jpg\" mode=\"aspectFill\"></image>\r\n      <view class=\"banner-shade\"></view>\r\n      <text class=\"banner-title\">千古长卷</text>\r\n      <text class=\"banner-sub\">王希孟《千里江山图》卷 · 故宫博物院藏</text>\r\n    </view>\r\n\r\n    <view class=\"list-card\" wx:if=\"{{favs.length}}\">\r\n      <view class=\"list-head\">\r\n        <text class=\"list-title\">我的收藏</text>\r\n        <text class=\"list-count\">{{favCount}} 条</text>\r\n      </view>\r\n      <view\r\n        class=\"list-row\"\r\n        wx:for=\"{{favs}}\"\r\n        wx:key=\"id\"\r\n        data-type=\"{{item.type}}\"\r\n        data-id=\"{{item.id}}\"\r\n        bindtap=\"onEntry\"\r\n      >\r\n        <text class=\"row-char {{item.modern ? 'row-modern' : ''}}\">{{item.type === 'person' ? '人' : '事'}}</text>\r\n        <view class=\"row-main\">\r\n          <text class=\"row-title\">{{item.title}}</text>\r\n          <text class=\"row-sub {{item.modern ? 'sub-modern' : ''}}\">{{item.sub}}</text>\r\n        </view>\r\n        <text class=\"row-arrow\">›</text>\r\n      </view>\r\n    </view>\r\n\r\n    <view class=\"list-card\" wx:if=\"{{foots.length}}\">\r\n      <view class=\"list-head\">\r\n        <text class=\"list-title\">浏览足迹</text>\r\n        <text class=\"list-count\">{{footCount}} 条</text>\r\n      </view>\r\n      <view\r\n        class=\"list-row\"\r\n        wx:for=\"{{foots}}\"\r\n        wx:key=\"id\"\r\n        data-type=\"{{item.type}}\"\r\n        data-id=\"{{item.id}}\"\r\n        bindtap=\"onEntry\"\r\n      >\r\n        <text class=\"row-char {{item.modern ? 'row-modern' : ''}}\">{{item.type === 'person' ? '人' : '事'}}</text>\r\n        <view class=\"row-main\">\r\n          <text class=\"row-title\">{{item.title}}</text>\r\n          <text class=\"row-sub {{item.modern ? 'sub-modern' : ''}}\">{{item.sub}}</text>\r\n        </view>\r\n        <text class=\"row-when\">{{item.when}}</text>\r\n      </view>\r\n    </view>\r\n\r\n    <view class=\"menu-card\">\r\n      <view class=\"menu-row\" bindtap=\"onSearch\">\r\n        <text class=\"menu-label\">搜索史事 · 人物</text>\r\n        <text class=\"menu-arrow\">›</text>\r\n      </view>\r\n      <view class=\"menu-row\" bindtap=\"onDataNote\">\r\n        <text class=\"menu-label\">数据与史料说明</text>\r\n        <text class=\"menu-arrow\">›</text>\r\n      </view>\r\n      <view class=\"menu-row\" bindtap=\"onAssetNote\">\r\n        <text class=\"menu-label\">素材与授权说明</text>\r\n        <text class=\"menu-arrow\">›</text>\r\n      </view>\r\n      <view class=\"menu-row\" bindtap=\"onAbout\">\r\n        <text class=\"menu-label\">关于史页</text>\r\n        <text class=\"menu-arrow\">›</text>\r\n      </view>\r\n      <view class=\"menu-row last\" bindtap=\"onClearCache\">\r\n        <text class=\"menu-label\">清除缓存</text>\r\n        <text class=\"menu-arrow\">›</text>\r\n      </view>\r\n    </view>\r\n  </view>\r\n\r\n  <view class=\"tabbar\">\r\n    <view class=\"tab\" data-page=\"home\" bindtap=\"goTab\">\r\n      <image class=\"tab-icon\" src=\"/assets/icons/home.png\" mode=\"aspectFit\"></image>\r\n      <text>首页</text>\r\n    </view>\r\n    <view class=\"tab\" data-page=\"timeline\" bindtap=\"goTab\">\r\n      <image class=\"tab-icon\" src=\"/assets/icons/timeline.png\" mode=\"aspectFit\"></image>\r\n      <text>时间轴</text>\r\n    </view>\r\n    <view class=\"tab\" data-page=\"discover\" bindtap=\"goTab\">\r\n      <image class=\"tab-icon\" src=\"/assets/icons/discover.png\" mode=\"aspectFit\"></image>\r\n      <text>发现</text>\r\n    </view>\r\n    <view class=\"tab active\" data-page=\"profile\" bindtap=\"goTab\">\r\n      <image class=\"tab-icon\" src=\"/assets/icons/profile.png\" mode=\"aspectFit\"></image>\r\n      <text>我的</text>\r\n    </view>\r\n  </view>\r\n</view>\r\n"; });
__register('/pages/profile/profile.wxss', function (require, module, exports) { module.exports = ".page {\r\n  position: relative;\r\n  min-height: 100vh;\r\n  overflow: hidden;\r\n  background: #F6F1EA;\r\n}\r\n\r\n.paper-bg {\r\n  position: fixed;\r\n  left: 0;\r\n  top: 0;\r\n  z-index: 0;\r\n  width: 100%;\r\n  height: 100%;\r\n  opacity: 0.96;\r\n}\r\n\r\n.screen {\r\n  position: relative;\r\n  z-index: 2;\r\n  padding: 0 46rpx 160rpx;\r\n}\r\n\r\n.topbar {\r\n  margin-top: 88rpx;\r\n  height: 124rpx;\r\n  display: flex;\r\n  align-items: center;\r\n}\r\n\r\n.brand {\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 54rpx;\r\n  font-weight: 400;\r\n  letter-spacing: 0.08em;\r\n  color: #1F1D19;\r\n}\r\n\r\n/* 用户头卡 */\r\n.head-card {\r\n  margin-top: 22rpx;\r\n  padding: 34rpx;\r\n  border-radius: 38rpx;\r\n  background: #FCFBF8;\r\n  box-shadow: 0 20rpx 46rpx rgba(90, 70, 50, 0.06);\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 24rpx;\r\n}\r\n\r\n.avatar-wrap {\r\n  width: 108rpx;\r\n  height: 108rpx;\r\n  border-radius: 50%;\r\n  overflow: hidden;\r\n  border: 2rpx solid rgba(169, 130, 94, 0.35);\r\n}\r\n\r\n.avatar {\r\n  width: 100%;\r\n  height: 100%;\r\n  display: block;\r\n}\r\n\r\n.head-info {\r\n  flex: 1;\r\n  min-width: 0;\r\n}\r\n\r\n.nick {\r\n  display: block;\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 36rpx;\r\n  letter-spacing: 0.06em;\r\n  color: #1F1D19;\r\n}\r\n\r\n.tagline {\r\n  display: block;\r\n  margin-top: 10rpx;\r\n  font-size: 20rpx;\r\n  letter-spacing: 0.03em;\r\n  color: #8C857A;\r\n}\r\n\r\n.head-seal {\r\n  width: 46rpx;\r\n  height: 52rpx;\r\n  background: #A34A3E;\r\n  color: #FFF8EF;\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 22rpx;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  transform: rotate(2deg);\r\n}\r\n\r\n/* 数据统计 */\r\n.stats-card {\r\n  margin-top: 18rpx;\r\n  padding: 30rpx 20rpx;\r\n  border-radius: 34rpx;\r\n  background: #FCFBF8;\r\n  box-shadow: 0 16rpx 34rpx rgba(90, 70, 50, 0.045);\r\n  display: flex;\r\n}\r\n\r\n.stat {\r\n  flex: 1;\r\n  display: flex;\r\n  flex-direction: column;\r\n  align-items: center;\r\n  gap: 8rpx;\r\n}\r\n\r\n.stat-num {\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 44rpx;\r\n  line-height: 1;\r\n  color: #A9825E;\r\n}\r\n\r\n.stat-label {\r\n  font-size: 20rpx;\r\n  letter-spacing: 0.05em;\r\n  color: #8C857A;\r\n}\r\n\r\n/* 千古长卷横幅 */\r\n.banner-card {\r\n  position: relative;\r\n  height: 220rpx;\r\n  margin-top: 18rpx;\r\n  border-radius: 38rpx;\r\n  overflow: hidden;\r\n  box-shadow: 0 20rpx 46rpx rgba(90, 70, 50, 0.07);\r\n}\r\n\r\n.banner-bg {\r\n  position: absolute;\r\n  left: 0;\r\n  top: 0;\r\n  width: 100%;\r\n  height: 100%;\r\n  display: block;\r\n}\r\n\r\n.banner-shade {\r\n  position: absolute;\r\n  left: 0;\r\n  right: 0;\r\n  bottom: 0;\r\n  background: linear-gradient(180deg, rgba(246, 241, 234, 0) 30%, rgba(31, 27, 22, 0.60));\r\n}\r\n\r\n.banner-title {\r\n  position: absolute;\r\n  left: 28rpx;\r\n  bottom: 44rpx;\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 34rpx;\r\n  letter-spacing: 0.08em;\r\n  color: #FFF8EF;\r\n}\r\n\r\n.banner-sub {\r\n  position: absolute;\r\n  left: 28rpx;\r\n  bottom: 18rpx;\r\n  font-size: 18rpx;\r\n  letter-spacing: 0.04em;\r\n  color: rgba(255, 248, 239, 0.82);\r\n}\r\n\r\n/* 功能清单 */\r\n.menu-card {\r\n  margin-top: 22rpx;\r\n  border-radius: 34rpx;\r\n  background: #FCFBF8;\r\n  box-shadow: 0 16rpx 34rpx rgba(90, 70, 50, 0.045);\r\n  padding: 6rpx 28rpx;\r\n}\r\n\r\n.menu-row {\r\n  display: flex;\r\n  align-items: center;\r\n  height: 96rpx;\r\n  border-bottom: 1rpx solid rgba(70, 58, 45, 0.07);\r\n}\r\n\r\n.menu-row.last {\r\n  border-bottom: none;\r\n}\r\n\r\n.menu-label {\r\n  flex: 1;\r\n  font-size: 24rpx;\r\n  letter-spacing: 0.04em;\r\n  color: #2C2924;\r\n}\r\n\r\n.menu-hint {\r\n  margin-right: 14rpx;\r\n  font-size: 18rpx;\r\n  letter-spacing: 0.04em;\r\n  color: #A39A8E;\r\n}\r\n\r\n.menu-arrow {\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 30rpx;\r\n  color: #A39A8E;\r\n}\r\n\r\n/* 收藏 / 足迹列表 */\r\n.list-card {\r\n  margin-top: 22rpx;\r\n  border-radius: 34rpx;\r\n  background: #FCFBF8;\r\n  box-shadow: 0 16rpx 34rpx rgba(90, 70, 50, 0.045);\r\n  padding: 26rpx 28rpx 12rpx;\r\n}\r\n\r\n.list-head {\r\n  display: flex;\r\n  align-items: baseline;\r\n  justify-content: space-between;\r\n  padding: 0 4rpx 14rpx;\r\n}\r\n\r\n.list-title {\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 27rpx;\r\n  letter-spacing: 0.06em;\r\n  color: #1F1D19;\r\n}\r\n\r\n.list-count {\r\n  font-size: 18rpx;\r\n  letter-spacing: 0.05em;\r\n  color: #A39A8E;\r\n}\r\n\r\n.list-row {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 20rpx;\r\n  padding: 20rpx 4rpx;\r\n  border-top: 1rpx solid rgba(70, 58, 45, 0.07);\r\n}\r\n\r\n.row-char {\r\n  flex: 0 0 72rpx;\r\n  width: 72rpx;\r\n  height: 72rpx;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  border-radius: 20rpx;\r\n  background: rgba(163, 74, 62, 0.08);\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 24rpx;\r\n  color: #A34A3E;\r\n}\r\n\r\n.row-char.row-modern {\r\n  background: rgba(126, 154, 154, 0.14);\r\n  color: #5F7E7E;\r\n}\r\n\r\n.row-main {\r\n  flex: 1;\r\n  min-width: 0;\r\n}\r\n\r\n.row-title {\r\n  display: block;\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 24rpx;\r\n  letter-spacing: 0.04em;\r\n  color: #1F1D19;\r\n}\r\n\r\n.row-sub {\r\n  display: block;\r\n  margin-top: 6rpx;\r\n  font-size: 18rpx;\r\n  letter-spacing: 0.03em;\r\n  color: #8C857A;\r\n}\r\n\r\n.row-sub.sub-modern {\r\n  color: #7E9A9A;\r\n}\r\n\r\n.row-arrow {\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 30rpx;\r\n  color: #A39A8E;\r\n}\r\n\r\n.row-when {\r\n  flex: 0 0 auto;\r\n  font-size: 17rpx;\r\n  letter-spacing: 0.02em;\r\n  color: #A39A8E;\r\n}\r\n\r\n.tabbar {\r\n  position: fixed;\r\n  left: 0;\r\n  right: 0;\r\n  bottom: 0;\r\n  z-index: 10;\r\n  min-height: 128rpx;\r\n  padding: 16rpx 20rpx 0;\r\n  padding-bottom: constant(safe-area-inset-bottom);\r\n  padding-bottom: env(safe-area-inset-bottom);\r\n  display: flex;\r\n  background: rgba(250, 248, 243, 0.96);\r\n  border-top: 1rpx solid rgba(70, 58, 45, 0.10);\r\n}\r\n\r\n.tab {\r\n  flex: 1;\r\n  display: flex;\r\n  flex-direction: column;\r\n  align-items: center;\r\n  gap: 10rpx;\r\n  font-size: 20rpx;\r\n  letter-spacing: 0.03em;\r\n  color: #7B746A;\r\n}\r\n\r\n.tab-icon {\r\n  width: 44rpx;\r\n  height: 44rpx;\r\n  display: block;\r\n  opacity: 0.52;\r\n}\r\n\r\n.tab.active {\r\n  color: #211E1A;\r\n}\r\n\r\n.tab.active .tab-icon {\r\n  opacity: 1;\r\n}\r\n"; });
__register('/pages/event/event.js', function (require, module, exports) {
const history = require('../../data/history.js');
const store = require('../../utils/store.js');

Page('project://pages/event/event.js', {
  data: {
    event: null,
    seal: '',
    relatedPersons: [],
    collected: false
  },

  onLoad(options) {
    const event = history.events.find((item) => item.id === options.id);
    if (!event) {
      wx.navigateBack({ fail: () => wx.redirectTo({ url: '/pages/home/home' }) });
      return;
    }

    // 反查人物列表：人物详情里登记过 relatedEvents 的人，即与该事件相关
    const relatedPersons = history.persons.filter((person) =>
      (person.relatedEvents || []).indexOf(event.id) >= 0
    );

    this.setData({
      event,
      relatedPersons,
      seal: event.title.charAt(0),
      collected: store.isFavorite('event', event.id)
    });

    store.addFootprint('event', event.id);
  },

  toggleCollect() {
    if (!this.data.event) return;
    const on = store.toggleFavorite('event', this.data.event.id);
    this.setData({ collected: on });
    wx.showToast({ title: on ? '已收藏' : '已取消收藏', icon: 'none' });
  },

  goBack() {
    wx.navigateBack({
      fail: () => wx.redirectTo({ url: '/pages/home/home' })
    });
  },

  goPerson(e) {
    wx.navigateTo({
      url: `/pages/person/person?id=${e.currentTarget.dataset.id}`
    });
  },

  goTimeline() {
    wx.redirectTo({
      url: `/pages/timeline/timeline?mode=${this.data.event.mode}`
    });
  },

  onShareAppMessage() {
    const event = this.data.event;
    return {
      title: event ? `${event.title} · 史页` : '史页',
      path: event ? `/pages/event/event?id=${event.id}` : '/pages/home/home'
    };
  }
});

});
__register('/pages/event/event.wxml', function (require, module, exports) { module.exports = "<view class=\"page\">\r\n  <image class=\"paper-bg\" src=\"/assets/paper-bg.jpg\" mode=\"aspectFill\"></image>\r\n  <view class=\"screen\" wx:if=\"{{event}}\">\r\n    <view class=\"topbar\">\r\n      <view class=\"back\" bindtap=\"goBack\">\r\n        <text class=\"back-icon\">‹</text>\r\n      </view>\r\n      <text class=\"top-title\">史页 · 事件</text>\r\n      <text class=\"top-seal {{event.mode === 'modern' ? 'seal-modern' : ''}}\">{{seal}}</text>\r\n    </view>\r\n\r\n    <view class=\"head-card {{event.mode === 'modern' ? 'head-modern' : ''}}\">\r\n      <text class=\"e-year\">{{event.yearText}}</text>\r\n      <text class=\"e-title\">{{event.title}}</text>\r\n      <view class=\"e-meta\">\r\n        <view class=\"era-chip {{event.mode === 'modern' ? 'chip-modern' : ''}}\">\r\n          <text>{{event.era}}</text>\r\n        </view>\r\n        <text class=\"e-tags\">{{event.tags}}</text>\r\n      </view>\r\n    </view>\r\n\r\n    <view class=\"body-card\">\r\n      <view class=\"para lead\" wx:if=\"{{event.desc}}\">\r\n        <text>{{event.desc}}</text>\r\n      </view>\r\n      <view class=\"para\" wx:for=\"{{event.details}}\" wx:key=\"*this\">\r\n        <text>{{item}}</text>\r\n      </view>\r\n    </view>\r\n\r\n    <view class=\"section-head\" wx:if=\"{{relatedPersons.length}}\">\r\n      <text class=\"section-title\">其时其人</text>\r\n    </view>\r\n    <view class=\"p-list\" wx:if=\"{{relatedPersons.length}}\">\r\n      <view\r\n        wx:for=\"{{relatedPersons}}\"\r\n        wx:key=\"id\"\r\n        class=\"p-card\"\r\n        data-id=\"{{item.id}}\"\r\n        bindtap=\"goPerson\"\r\n      >\r\n        <text class=\"p-char\">{{item.name}}</text>\r\n        <view class=\"p-info\">\r\n          <text class=\"p-dates {{event.mode === 'modern' ? 'accent-modern' : ''}}\">{{item.dates}}</text>\r\n          <text class=\"p-roles\">{{item.roles}}</text>\r\n        </view>\r\n        <text class=\"rel-arrow\">›</text>\r\n      </view>\r\n    </view>\r\n\r\n    <view class=\"foot-actions\">\r\n      <view class=\"ghost-btn {{collected ? (event.mode === 'modern' ? 'on on-modern' : 'on') : ''}}\" bindtap=\"toggleCollect\">\r\n        <text>{{collected ? '✓ 已收藏' : '收藏此史事'}}</text>\r\n      </view>\r\n      <view class=\"ghost-btn\" bindtap=\"goTimeline\">\r\n        <text>回时间轴再看一眼</text>\r\n      </view>\r\n    </view>\r\n\r\n    <view class=\"source-line\">史料 · {{event.source}}</view>\r\n  </view>\r\n</view>\r\n"; });
__register('/pages/event/event.wxss', function (require, module, exports) { module.exports = ".page {\r\n  position: relative;\r\n  min-height: 100vh;\r\n  overflow: hidden;\r\n  background: #F6F1EA;\r\n}\r\n\r\n.paper-bg {\r\n  position: fixed;\r\n  left: 0;\r\n  top: 0;\r\n  z-index: 0;\r\n  width: 100%;\r\n  height: 100%;\r\n  opacity: 0.96;\r\n}\r\n\r\n.screen {\r\n  position: relative;\r\n  z-index: 2;\r\n  padding: 0 46rpx 120rpx;\r\n}\r\n\r\n.topbar {\r\n  margin-top: 88rpx;\r\n  height: 76rpx;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: space-between;\r\n}\r\n\r\n.back {\r\n  width: 64rpx;\r\n  height: 64rpx;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n}\r\n\r\n.back-icon {\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 44rpx;\r\n  line-height: 1;\r\n  color: #1F1D19;\r\n}\r\n\r\n.top-title {\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 26rpx;\r\n  letter-spacing: 0.08em;\r\n  color: #8C857A;\r\n}\r\n\r\n.top-seal {\r\n  width: 44rpx;\r\n  height: 50rpx;\r\n  background: #A34A3E;\r\n  color: #FFF8EF;\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 20rpx;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  transform: rotate(2deg);\r\n}\r\n\r\n.top-seal.seal-modern {\r\n  background: #7E9A9A;\r\n}\r\n\r\n.head-card {\r\n  margin-top: 26rpx;\r\n  padding: 40rpx 34rpx 34rpx;\r\n  border-radius: 38rpx;\r\n  background: #FCFBF8;\r\n  border-top: 6rpx solid rgba(169, 130, 94, 0.55);\r\n  box-shadow: 0 20rpx 46rpx rgba(90, 70, 50, 0.06);\r\n}\r\n\r\n.head-card.head-modern {\r\n  border-top-color: rgba(126, 154, 154, 0.6);\r\n}\r\n\r\n.e-year {\r\n  display: block;\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 30rpx;\r\n  letter-spacing: 0.08em;\r\n  color: #A9825E;\r\n}\r\n\r\n.head-modern .e-year {\r\n  color: #7E9A9A;\r\n}\r\n\r\n.e-title {\r\n  display: block;\r\n  margin-top: 14rpx;\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 54rpx;\r\n  letter-spacing: 0.06em;\r\n  line-height: 1.25;\r\n  color: #1F1D19;\r\n}\r\n\r\n.e-meta {\r\n  margin-top: 22rpx;\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 18rpx;\r\n}\r\n\r\n.era-chip {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  height: 44rpx;\r\n  padding: 0 20rpx;\r\n  border-radius: 22rpx;\r\n  border: 1rpx solid rgba(169, 130, 94, 0.35);\r\n  font-size: 19rpx;\r\n  letter-spacing: 0.06em;\r\n  color: #A9825E;\r\n}\r\n\r\n.era-chip.chip-modern {\r\n  border-color: rgba(126, 154, 154, 0.45);\r\n  color: #7E9A9A;\r\n}\r\n\r\n.e-tags {\r\n  font-size: 19rpx;\r\n  letter-spacing: 0.05em;\r\n  color: #8C857A;\r\n}\r\n\r\n.body-card {\r\n  margin-top: 22rpx;\r\n  padding: 34rpx;\r\n  border-radius: 34rpx;\r\n  background: #FCFBF8;\r\n  box-shadow: 0 16rpx 34rpx rgba(90, 70, 50, 0.045);\r\n}\r\n\r\n.para {\r\n  font-size: 23rpx;\r\n  line-height: 1.85;\r\n  letter-spacing: 0.02em;\r\n  color: #2C2924;\r\n}\r\n\r\n.para + .para {\r\n  margin-top: 22rpx;\r\n}\r\n\r\n.para.lead {\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 25rpx;\r\n  color: #1F1D19;\r\n  margin-bottom: 22rpx;\r\n  padding-bottom: 20rpx;\r\n  border-bottom: 1rpx solid rgba(70, 58, 45, 0.08);\r\n}\r\n\r\n.section-head {\r\n  margin-top: 34rpx;\r\n}\r\n\r\n.section-title {\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 30rpx;\r\n  letter-spacing: 0.06em;\r\n  color: #1F1D19;\r\n}\r\n\r\n.p-list {\r\n  margin-top: 18rpx;\r\n}\r\n\r\n.p-card {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 22rpx;\r\n  margin-bottom: 16rpx;\r\n  padding: 24rpx 26rpx;\r\n  border-radius: 30rpx;\r\n  background: #FCFBF8;\r\n  box-shadow: 0 16rpx 34rpx rgba(90, 70, 50, 0.04);\r\n}\r\n\r\n.p-char {\r\n  width: 96rpx;\r\n  flex: 0 0 96rpx;\r\n  height: 96rpx;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  border-radius: 24rpx;\r\n  background: rgba(163, 74, 62, 0.08);\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 30rpx;\r\n  letter-spacing: 0.05em;\r\n  color: #A34A3E;\r\n}\r\n\r\n.p-info {\r\n  flex: 1;\r\n  min-width: 0;\r\n}\r\n\r\n.p-dates {\r\n  display: block;\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 20rpx;\r\n  color: #A9825E;\r\n}\r\n\r\n.p-dates.accent-modern {\r\n  color: #7E9A9A;\r\n}\r\n\r\n.p-roles {\r\n  display: block;\r\n  margin-top: 6rpx;\r\n  font-size: 22rpx;\r\n  letter-spacing: 0.03em;\r\n  color: #5F5A52;\r\n}\r\n\r\n.rel-arrow {\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 32rpx;\r\n  color: #A39A8E;\r\n}\r\n\r\n.foot-actions {\r\n  margin-top: 30rpx;\r\n  display: flex;\r\n  gap: 16rpx;\r\n}\r\n\r\n.ghost-btn {\r\n  flex: 1;\r\n  height: 76rpx;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  border: 1rpx solid rgba(70, 58, 45, 0.14);\r\n  border-radius: 38rpx;\r\n  background: rgba(252, 251, 248, 0.6);\r\n  font-size: 23rpx;\r\n  letter-spacing: 0.05em;\r\n  color: #5F5A52;\r\n}\r\n\r\n.ghost-btn.on {\r\n  border-color: rgba(163, 74, 62, 0.45);\r\n  background: rgba(163, 74, 62, 0.06);\r\n  color: #A34A3E;\r\n}\r\n\r\n.ghost-btn.on.on-modern {\r\n  border-color: rgba(126, 154, 154, 0.5);\r\n  background: rgba(126, 154, 154, 0.08);\r\n  color: #5F7E7E;\r\n}\r\n\r\n.source-line {\r\n  margin-top: 30rpx;\r\n  font-size: 19rpx;\r\n  letter-spacing: 0.03em;\r\n  color: #A39A8E;\r\n}\r\n"; });
__register('/pages/person/person.js', function (require, module, exports) {
const history = require('../../data/history.js');
const store = require('../../utils/store.js');

// 近现代识别色为蓝灰；其余时代走古代赭石色
const MODERN_ERAS = ['晚清', '民国', '新中国', '近现代', '现代'];

Page('project://pages/person/person.js', {
  data: {
    person: null,
    accent: 'ancient',
    seal: '',
    related: [],
    collected: false
  },

  onLoad(options) {
    const person = history.persons.find((item) => item.id === options.id);
    if (!person) {
      wx.navigateBack({ fail: () => wx.redirectTo({ url: '/pages/home/home' }) });
      return;
    }

    const related = (person.relatedEvents || [])
      .map((id) => history.events.find((event) => event.id === id))
      .filter(Boolean);

    this.setData({
      person,
      related,
      accent: MODERN_ERAS.indexOf(person.era) >= 0 ? 'modern' : 'ancient',
      seal: person.name.charAt(0),
      collected: store.isFavorite('person', person.id)
    });

    store.addFootprint('person', person.id);
  },

  toggleCollect() {
    if (!this.data.person) return;
    const on = store.toggleFavorite('person', this.data.person.id);
    this.setData({ collected: on });
    wx.showToast({ title: on ? '已收藏' : '已取消收藏', icon: 'none' });
  },

  goBack() {
    wx.navigateBack({
      fail: () => wx.redirectTo({ url: '/pages/home/home' })
    });
  },

  goEvent(e) {
    wx.navigateTo({
      url: `/pages/event/event?id=${e.currentTarget.dataset.id}`
    });
  },

  onShareAppMessage() {
    const person = this.data.person;
    return {
      title: person ? `${person.name} · 史页` : '史页',
      path: person ? `/pages/person/person?id=${person.id}` : '/pages/home/home'
    };
  }
});

});
__register('/pages/person/person.wxml', function (require, module, exports) { module.exports = "<view class=\"page\">\r\n  <image class=\"paper-bg\" src=\"/assets/paper-bg.jpg\" mode=\"aspectFill\"></image>\r\n  <view class=\"screen\" wx:if=\"{{person}}\">\r\n    <view class=\"topbar\">\r\n      <view class=\"back\" bindtap=\"goBack\">\r\n        <text class=\"back-icon\">‹</text>\r\n      </view>\r\n      <text class=\"top-title\">史页 · 人物</text>\r\n      <text class=\"top-seal {{accent === 'modern' ? 'seal-modern' : ''}}\">{{seal}}</text>\r\n    </view>\r\n\r\n    <view class=\"head-card\">\r\n      <text class=\"p-name\">{{person.name}}</text>\r\n      <view class=\"p-meta\">\r\n        <text class=\"p-dates {{accent === 'modern' ? 'accent-modern' : ''}}\">{{person.dates}}</text>\r\n        <text class=\"p-dot\">·</text>\r\n        <text class=\"p-roles\">{{person.roles}}</text>\r\n      </view>\r\n      <view class=\"era-chip {{accent === 'modern' ? 'chip-modern' : ''}}\">\r\n        <text>{{person.era}}</text>\r\n      </view>\r\n      <view class=\"quote-block\">\r\n        <text class=\"quote-mark\">“</text>\r\n        <text class=\"quote\">{{person.quote}}</text>\r\n        <text class=\"quote-src\">——{{person.quoteSource}}</text>\r\n      </view>\r\n    </view>\r\n\r\n    <view class=\"body-card\">\r\n      <view class=\"para\" wx:for=\"{{person.details}}\" wx:key=\"*this\">\r\n        <text>{{item}}</text>\r\n      </view>\r\n    </view>\r\n\r\n    <view class=\"section-head\" wx:if=\"{{related.length}}\">\r\n      <text class=\"section-title\">生平际会 · 相关史事</text>\r\n    </view>\r\n    <view class=\"rel-list\" wx:if=\"{{related.length}}\">\r\n      <view\r\n        wx:for=\"{{related}}\"\r\n        wx:key=\"id\"\r\n        class=\"rel-card\"\r\n        data-id=\"{{item.id}}\"\r\n        bindtap=\"goEvent\"\r\n      >\r\n        <text class=\"rel-year {{accent === 'modern' && item.mode === 'modern' ? 'accent-modern' : ''}}\">{{item.yearText}}</text>\r\n        <view class=\"rel-body\">\r\n          <text class=\"rel-title\">{{item.title}}</text>\r\n          <text class=\"rel-desc\">{{item.desc}}</text>\r\n        </view>\r\n        <text class=\"rel-arrow\">›</text>\r\n      </view>\r\n    </view>\r\n\r\n    <view class=\"foot-actions\">\r\n      <view class=\"ghost-btn {{collected ? (accent === 'modern' ? 'on on-modern' : 'on') : ''}}\" bindtap=\"toggleCollect\">\r\n        <text>{{collected ? '✓ 已收藏此人物' : '收藏此人物'}}</text>\r\n      </view>\r\n    </view>\r\n\r\n    <view class=\"source-line\">史料 · {{person.source}}</view>\r\n  </view>\r\n</view>\r\n"; });
__register('/pages/person/person.wxss', function (require, module, exports) { module.exports = ".page {\r\n  position: relative;\r\n  min-height: 100vh;\r\n  overflow: hidden;\r\n  background: #F6F1EA;\r\n}\r\n\r\n.paper-bg {\r\n  position: fixed;\r\n  left: 0;\r\n  top: 0;\r\n  z-index: 0;\r\n  width: 100%;\r\n  height: 100%;\r\n  opacity: 0.96;\r\n}\r\n\r\n.screen {\r\n  position: relative;\r\n  z-index: 2;\r\n  padding: 0 46rpx 120rpx;\r\n}\r\n\r\n.topbar {\r\n  margin-top: 88rpx;\r\n  height: 76rpx;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: space-between;\r\n}\r\n\r\n.back {\r\n  width: 64rpx;\r\n  height: 64rpx;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n}\r\n\r\n.back-icon {\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 44rpx;\r\n  line-height: 1;\r\n  color: #1F1D19;\r\n}\r\n\r\n.top-title {\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 26rpx;\r\n  letter-spacing: 0.08em;\r\n  color: #8C857A;\r\n}\r\n\r\n.top-seal {\r\n  width: 44rpx;\r\n  height: 50rpx;\r\n  background: #A34A3E;\r\n  color: #FFF8EF;\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 20rpx;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  transform: rotate(2deg);\r\n}\r\n\r\n.top-seal.seal-modern {\r\n  background: #7E9A9A;\r\n}\r\n\r\n.head-card {\r\n  margin-top: 26rpx;\r\n  padding: 40rpx 34rpx 34rpx;\r\n  border-radius: 38rpx;\r\n  background: #FCFBF8;\r\n  box-shadow: 0 20rpx 46rpx rgba(90, 70, 50, 0.06);\r\n}\r\n\r\n.p-name {\r\n  display: block;\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 64rpx;\r\n  letter-spacing: 0.08em;\r\n  line-height: 1.2;\r\n  color: #1F1D19;\r\n}\r\n\r\n.p-meta {\r\n  margin-top: 16rpx;\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 14rpx;\r\n}\r\n\r\n.p-dates {\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 24rpx;\r\n  letter-spacing: 0.04em;\r\n  color: #A9825E;\r\n}\r\n\r\n.p-dates.accent-modern {\r\n  color: #7E9A9A;\r\n}\r\n\r\n.p-dot {\r\n  color: #8C857A;\r\n}\r\n\r\n.p-roles {\r\n  font-size: 24rpx;\r\n  letter-spacing: 0.03em;\r\n  color: #5F5A52;\r\n}\r\n\r\n.era-chip {\r\n  margin-top: 22rpx;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  height: 44rpx;\r\n  padding: 0 20rpx;\r\n  border-radius: 22rpx;\r\n  border: 1rpx solid rgba(169, 130, 94, 0.35);\r\n  font-size: 19rpx;\r\n  letter-spacing: 0.06em;\r\n  color: #A9825E;\r\n}\r\n\r\n.era-chip.chip-modern {\r\n  border-color: rgba(126, 154, 154, 0.45);\r\n  color: #7E9A9A;\r\n}\r\n\r\n.quote-block {\r\n  margin-top: 28rpx;\r\n  padding: 26rpx 26rpx 24rpx;\r\n  border-left: 4rpx solid rgba(163, 74, 62, 0.4);\r\n  background: rgba(246, 241, 234, 0.5);\r\n  border-radius: 0 24rpx 24rpx 0;\r\n}\r\n\r\n.quote-mark {\r\n  font-family: \"KaiTi\", \"STKaiti\", serif;\r\n  font-size: 40rpx;\r\n  line-height: 0.6;\r\n  color: #A39A8E;\r\n}\r\n\r\n.quote {\r\n  display: block;\r\n  margin-top: 8rpx;\r\n  font-family: \"KaiTi\", \"STKaiti\", serif;\r\n  font-size: 28rpx;\r\n  line-height: 1.7;\r\n  color: #1F1D19;\r\n}\r\n\r\n.quote-src {\r\n  display: block;\r\n  margin-top: 12rpx;\r\n  font-family: \"KaiTi\", \"STKaiti\", serif;\r\n  font-size: 20rpx;\r\n  color: #8C857A;\r\n  text-align: right;\r\n}\r\n\r\n.body-card {\r\n  margin-top: 22rpx;\r\n  padding: 34rpx;\r\n  border-radius: 34rpx;\r\n  background: #FCFBF8;\r\n  box-shadow: 0 16rpx 34rpx rgba(90, 70, 50, 0.045);\r\n}\r\n\r\n.para {\r\n  font-size: 23rpx;\r\n  line-height: 1.85;\r\n  letter-spacing: 0.02em;\r\n  color: #2C2924;\r\n}\r\n\r\n.para + .para {\r\n  margin-top: 22rpx;\r\n}\r\n\r\n.section-head {\r\n  margin-top: 34rpx;\r\n}\r\n\r\n.section-title {\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 30rpx;\r\n  letter-spacing: 0.06em;\r\n  color: #1F1D19;\r\n}\r\n\r\n.rel-list {\r\n  margin-top: 18rpx;\r\n}\r\n\r\n.rel-card {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 20rpx;\r\n  margin-bottom: 16rpx;\r\n  padding: 24rpx 26rpx;\r\n  border-radius: 30rpx;\r\n  background: #FCFBF8;\r\n  box-shadow: 0 16rpx 34rpx rgba(90, 70, 50, 0.04);\r\n}\r\n\r\n.rel-year {\r\n  width: 130rpx;\r\n  flex: 0 0 130rpx;\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 22rpx;\r\n  color: #A9825E;\r\n}\r\n\r\n.rel-year.accent-modern {\r\n  color: #7E9A9A;\r\n}\r\n\r\n.rel-body {\r\n  flex: 1;\r\n  min-width: 0;\r\n}\r\n\r\n.rel-title {\r\n  display: block;\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 26rpx;\r\n  letter-spacing: 0.04em;\r\n  color: #1F1D19;\r\n}\r\n\r\n.rel-desc {\r\n  display: block;\r\n  margin-top: 6rpx;\r\n  font-size: 20rpx;\r\n  line-height: 1.55;\r\n  color: #5F5A52;\r\n}\r\n\r\n.rel-arrow {\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 32rpx;\r\n  color: #A39A8E;\r\n}\r\n\r\n.foot-actions {\r\n  margin-top: 30rpx;\r\n  display: flex;\r\n  gap: 16rpx;\r\n}\r\n\r\n.ghost-btn {\r\n  flex: 1;\r\n  height: 76rpx;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  border: 1rpx solid rgba(70, 58, 45, 0.14);\r\n  border-radius: 38rpx;\r\n  background: rgba(252, 251, 248, 0.6);\r\n  font-size: 23rpx;\r\n  letter-spacing: 0.05em;\r\n  color: #5F5A52;\r\n}\r\n\r\n.ghost-btn.on {\r\n  border-color: rgba(163, 74, 62, 0.45);\r\n  background: rgba(163, 74, 62, 0.06);\r\n  color: #A34A3E;\r\n}\r\n\r\n.ghost-btn.on.on-modern {\r\n  border-color: rgba(126, 154, 154, 0.5);\r\n  background: rgba(126, 154, 154, 0.08);\r\n  color: #5F7E7E;\r\n}\r\n\r\n.source-line {\r\n  margin-top: 30rpx;\r\n  font-size: 19rpx;\r\n  letter-spacing: 0.03em;\r\n  color: #A39A8E;\r\n}\r\n"; });
__register('/pages/period/period.js', function (require, module, exports) {
const history = require('../../data/history.js');

// 朝代卡配图（与发现页一致，见 assets/paintings/SOURCES.md）
const PERIOD_META = {
  han: { img: '/assets/paintings/han.jpg', yearText: '前202–公元9', seal: '汉' },
  tang: { img: '/assets/paintings/tang.jpg', yearText: '618–907', seal: '唐' },
  song: { img: '/assets/paintings/song.jpg', yearText: '960–1127', seal: '宋' },
  modern: { img: '/assets/paintings/modern.jpg', yearText: '1840–1949', seal: '近' }
};

const MODERN_ERAS = ['晚清', '民国', '新中国', '近现代', '现代'];

Page('project://pages/period/period.js', {
  data: {
    period: null,
    events: [],
    span: '',
    seal: ''
  },

  onLoad(options) {
    const period = history.periods.find((item) => item.id === options.id);
    if (!period) {
      wx.navigateBack({ fail: () => wx.redirectTo({ url: '/pages/home/home' }) });
      return;
    }

    const meta = PERIOD_META[period.id] || {};
    // 该时代下的史事：事件 era 命中朝代名，或与近现代面板对应
    const inPeriod = (event) =>
      event.era === period.name ||
      (period.id === 'modern' && MODERN_ERAS.indexOf(event.era) >= 0);
    const events = history.events
      .filter(inPeriod)
      .sort((a, b) => a.year - b.year);

    // 时代脉络：以收录史事的首尾纪年概括跨度（单条用「自」起句）
    const span = events.length > 1
      ? `从${events[0].yearText}到${events[events.length - 1].yearText}`
      : events.length === 1
        ? `自${events[0].yearText}`
        : '';

    this.setData({
      period: { ...period, ...meta },
      events,
      span,
      seal: meta.seal || period.name.charAt(0)
    });
  },

  goBack() {
    wx.navigateBack({
      fail: () => wx.redirectTo({ url: '/pages/home/home' })
    });
  },

  goEvent(e) {
    wx.navigateTo({
      url: `/pages/event/event?id=${e.currentTarget.dataset.id}`
    });
  },

  goTimeline() {
    wx.redirectTo({
      url: `/pages/timeline/timeline?mode=${this.data.period.id === 'modern' ? 'modern' : 'ancient'}`
    });
  },

  onShareAppMessage() {
    const period = this.data.period;
    return {
      title: period ? `${period.name} · 史页` : '史页',
      path: period ? `/pages/period/period?id=${period.id}` : '/pages/home/home'
    };
  }
});

});
__register('/pages/period/period.wxml', function (require, module, exports) { module.exports = "<view class=\"page\">\n  <image class=\"paper-bg\" src=\"/assets/paper-bg.jpg\" mode=\"aspectFill\"></image>\n  <view class=\"screen\" wx:if=\"{{period}}\">\n    <view class=\"topbar\">\n      <view class=\"back\" bindtap=\"goBack\">\n        <text class=\"back-icon\">‹</text>\n      </view>\n      <text class=\"top-title\">史页 · 朝代</text>\n      <text class=\"top-seal {{period.id === 'modern' ? 'seal-modern' : ''}}\">{{seal}}</text>\n    </view>\n\n    <view class=\"head-card {{period.id === 'modern' ? 'head-modern' : ''}}\">\n      <view class=\"hero-band\">\n        <image class=\"hero-img\" src=\"{{period.img}}\" mode=\"aspectFill\"></image>\n        <view class=\"hero-shade\"></view>\n        <view class=\"hero-copy\">\n          <text class=\"p-name\">{{period.name}}</text>\n          <text class=\"p-years\">{{period.yearText}}</text>\n        </view>\n        <text class=\"hero-title\">{{period.title}}</text>\n      </view>\n      <text class=\"p-desc\">{{period.desc}}</text>\n    </view>\n\n    <view class=\"body-card\" wx:if=\"{{span}}\">\n      <view class=\"para\">\n        <text>{{span}}，共录史事 {{events.length}} 条；点击下方条目可看正文与史料。</text>\n      </view>\n    </view>\n\n    <view class=\"foot-actions\" wx:if=\"{{!events.length}}\">\n      <view class=\"time-btn\" bindtap=\"goTimeline\">\n        <text>进时间轴看这个时代的脉络</text>\n      </view>\n    </view>\n\n    <view class=\"section-head\" wx:if=\"{{events.length}}\">\n      <text class=\"section-title\">这个时代的史事</text>\n      <text class=\"section-count\">{{events.length}} 条</text>\n    </view>\n    <view class=\"rel-list\" wx:if=\"{{events.length}}\">\n      <view\n        wx:for=\"{{events}}\"\n        wx:key=\"id\"\n        class=\"rel-card\"\n        data-id=\"{{item.id}}\"\n        bindtap=\"goEvent\"\n      >\n        <text class=\"rel-year {{period.id === 'modern' ? 'accent-modern' : ''}}\">{{item.yearText}}</text>\n        <view class=\"rel-body\">\n          <text class=\"rel-title\">{{item.title}}</text>\n          <text class=\"rel-desc\">{{item.desc}}</text>\n        </view>\n        <text class=\"rel-arrow\">›</text>\n      </view>\n    </view>\n\n    <view class=\"source-line\">史料 · {{period.source}}</view>\n  </view>\n</view>\n"; });
__register('/pages/period/period.wxss', function (require, module, exports) { module.exports = ".page {\n  position: relative;\n  min-height: 100vh;\n  overflow: hidden;\n  background: #F6F1EA;\n}\n\n.paper-bg {\n  position: fixed;\n  left: 0;\n  top: 0;\n  z-index: 0;\n  width: 100%;\n  height: 100%;\n  opacity: 0.96;\n}\n\n.screen {\n  position: relative;\n  z-index: 2;\n  padding: 0 46rpx 120rpx;\n}\n\n.topbar {\n  margin-top: 88rpx;\n  height: 76rpx;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n}\n\n.back {\n  width: 64rpx;\n  height: 64rpx;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n\n.back-icon {\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\n  font-size: 44rpx;\n  line-height: 1;\n  color: #1F1D19;\n}\n\n.top-title {\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\n  font-size: 26rpx;\n  letter-spacing: 0.08em;\n  color: #8C857A;\n}\n\n.top-seal {\n  width: 44rpx;\n  height: 50rpx;\n  background: #A34A3E;\n  color: #FFF8EF;\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\n  font-size: 20rpx;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  transform: rotate(2deg);\n}\n\n.top-seal.seal-modern {\n  background: #7E9A9A;\n}\n\n.head-card {\n  margin-top: 26rpx;\n  padding: 24rpx 24rpx 34rpx;\n  border-radius: 38rpx;\n  background: #FCFBF8;\n  border-top: 6rpx solid rgba(169, 130, 94, 0.55);\n  box-shadow: 0 20rpx 46rpx rgba(90, 70, 50, 0.06);\n}\n\n.head-card.head-modern {\n  border-top-color: rgba(126, 154, 154, 0.6);\n}\n\n.hero-band {\n  position: relative;\n  height: 300rpx;\n  border-radius: 30rpx;\n  overflow: hidden;\n}\n\n.hero-img {\n  position: absolute;\n  left: 0;\n  top: 0;\n  width: 100%;\n  height: 100%;\n  display: block;\n}\n\n.hero-shade {\n  position: absolute;\n  left: 0;\n  top: 0;\n  right: 0;\n  bottom: 0;\n  background: linear-gradient(180deg, rgba(30, 26, 20, 0.06) 30%, rgba(30, 26, 20, 0.5));\n}\n\n.hero-copy {\n  position: absolute;\n  left: 28rpx;\n  bottom: 24rpx;\n  z-index: 2;\n}\n\n.p-name {\n  display: block;\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\n  font-size: 52rpx;\n  letter-spacing: 0.08em;\n  line-height: 1.1;\n  color: #FCFBF8;\n}\n\n.p-years {\n  display: block;\n  margin-top: 10rpx;\n  font-size: 21rpx;\n  letter-spacing: 0.08em;\n  color: rgba(252, 251, 248, 0.86);\n}\n\n.hero-title {\n  position: absolute;\n  right: 24rpx;\n  bottom: 24rpx;\n  z-index: 2;\n  height: 44rpx;\n  padding: 0 18rpx;\n  display: inline-flex;\n  align-items: center;\n  border-radius: 22rpx;\n  background: rgba(252, 251, 248, 0.92);\n  font-size: 19rpx;\n  letter-spacing: 0.05em;\n  color: #5F5A52;\n}\n\n.p-desc {\n  display: block;\n  margin-top: 24rpx;\n  padding: 0 10rpx;\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\n  font-size: 24rpx;\n  line-height: 1.7;\n  letter-spacing: 0.02em;\n  color: #5F5A52;\n}\n\n.body-card {\n  margin-top: 22rpx;\n  padding: 34rpx;\n  border-radius: 34rpx;\n  background: #FCFBF8;\n  box-shadow: 0 16rpx 34rpx rgba(90, 70, 50, 0.045);\n}\n\n.para {\n  font-size: 23rpx;\n  line-height: 1.85;\n  letter-spacing: 0.02em;\n  color: #2C2924;\n}\n\n.para + .para {\n  margin-top: 22rpx;\n}\n\n.para.lead {\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\n  font-size: 25rpx;\n  color: #1F1D19;\n}\n\n.section-head {\n  margin-top: 34rpx;\n  display: flex;\n  align-items: baseline;\n  justify-content: space-between;\n}\n\n.section-title {\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\n  font-size: 30rpx;\n  letter-spacing: 0.06em;\n  color: #1F1D19;\n}\n\n.section-count {\n  font-size: 19rpx;\n  letter-spacing: 0.05em;\n  color: #8C857A;\n}\n\n.rel-list {\n  margin-top: 18rpx;\n}\n\n.rel-card {\n  display: flex;\n  align-items: center;\n  gap: 22rpx;\n  margin-bottom: 16rpx;\n  padding: 24rpx 26rpx;\n  border-radius: 30rpx;\n  background: #FCFBF8;\n  box-shadow: 0 16rpx 34rpx rgba(90, 70, 50, 0.04);\n}\n\n.rel-year {\n  flex: 0 0 130rpx;\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\n  font-size: 21rpx;\n  letter-spacing: 0.02em;\n  color: #A9825E;\n}\n\n.rel-year.accent-modern {\n  color: #7E9A9A;\n}\n\n.rel-body {\n  flex: 1;\n  min-width: 0;\n}\n\n.rel-title {\n  display: block;\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\n  font-size: 25rpx;\n  letter-spacing: 0.04em;\n  color: #1F1D19;\n}\n\n.rel-desc {\n  display: block;\n  margin-top: 8rpx;\n  font-size: 20rpx;\n  line-height: 1.6;\n  color: #8C857A;\n}\n\n.rel-arrow {\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\n  font-size: 32rpx;\n  color: #A39A8E;\n}\n\n.source-line {\n  margin-top: 30rpx;\n  font-size: 19rpx;\n  letter-spacing: 0.03em;\n  color: #A39A8E;\n}\n\n.foot-actions {\n  margin-top: 30rpx;\n}\n\n.time-btn {\n  height: 76rpx;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border: 1rpx solid rgba(70, 58, 45, 0.14);\n  border-radius: 38rpx;\n  background: rgba(252, 251, 248, 0.6);\n  font-size: 23rpx;\n  letter-spacing: 0.05em;\n  color: #5F5A52;\n}\n"; });
__register('/pages/search/search.js', function (require, module, exports) {
const history = require('../../data/history.js');

const lower = (text) => (text || '').toLowerCase();

Page('project://pages/search/search.js', {
  data: {
    keyword: '',
    hot: ['汉武帝', '苏轼', '澶渊之盟', '辛亥革命', '五四运动', '盛唐'],
    results: null,
    empty: false
  },

  onInput(e) {
    const keyword = e.detail.value;
    this.setData({
      keyword,
      results: keyword.trim() ? this.data.results : null,
      empty: keyword.trim() ? this.data.empty : false
    });
  },

  onSearch() {
    const word = this.data.keyword.trim();
    if (!word) {
      this.setData({ results: null, empty: false });
      return;
    }
    const kw = lower(word);
    const hit = (fields) => fields.some((field) => lower(field).indexOf(kw) >= 0);
    const modern = (era) => (era || '').indexOf('近现') >= 0 || (era || '').indexOf('民国') >= 0;

    const persons = history.persons
      .filter((p) => hit([p.name, p.era, p.roles, p.summary, p.dates]))
      .map((p) => ({
        id: p.id,
        title: p.name,
        sub: `${p.era} · ${p.roles}`,
        modern: modern(p.era)
      }));

    const events = history.events
      .filter((e) => hit([e.title, e.era, e.tags, e.desc, e.yearText]))
      .map((e) => ({
        id: e.id,
        title: e.title,
        sub: `${e.yearText} · ${e.era}`,
        modern: e.mode === 'modern'
      }));

    const panels = []
      .concat(
        history.periods.map((p) => ({
          id: p.id,
          key: `period-${p.id}`,
          title: p.name,
          sub: `${p.start < 0 ? `公元前${-p.start}` : p.start}–${p.end < 0 ? `公元前${-p.end}` : p.end}`,
          mode: p.id === 'modern' ? 'modern' : 'ancient',
          modern: p.id === 'modern'
        })),
        history.topics.map((t) => ({
          id: t.id,
          key: `topic-${t.id}`,
          title: t.shortTitle || t.title,
          sub: t.kicker,
          mode: t.id === 'modern-china' ? 'modern' : 'ancient',
          modern: t.id === 'modern-china'
        }))
      )
      .filter((p) => hit([p.title, p.sub]));

    this.setData({
      results: { persons, events, panels },
      empty: !persons.length && !events.length && !panels.length
    });
  },

  onHotTap(e) {
    const word = e.currentTarget.dataset.word;
    this.setData({ keyword: word }, () => this.onSearch());
  },

  onRowTap(e) {
    const { type, id, mode } = e.currentTarget.dataset;
    if (type === 'person') {
      wx.navigateTo({ url: `/pages/person/person?id=${id}` });
    } else if (type === 'event') {
      wx.navigateTo({ url: `/pages/event/event?id=${id}` });
    } else {
      wx.redirectTo({ url: `/pages/timeline/timeline?mode=${mode || 'ancient'}` });
    }
  },

  goBack() {
    wx.navigateBack({ fail: () => wx.redirectTo({ url: '/pages/home/home' }) });
  }
});

});
__register('/pages/search/search.wxml', function (require, module, exports) { module.exports = "<view class=\"page\">\r\n  <image class=\"paper-bg\" src=\"/assets/paper-bg.jpg\" mode=\"aspectFill\"></image>\r\n  <view class=\"screen\">\r\n\r\n    <view class=\"topbar\">\r\n      <view class=\"back\" bindtap=\"goBack\">\r\n        <text class=\"back-icon\">‹</text>\r\n      </view>\r\n      <text class=\"top-title\">史页 · 搜索</text>\r\n      <image class=\"top-seal\" src=\"/assets/seal.png\" mode=\"aspectFit\"></image>\r\n    </view>\r\n\r\n    <view class=\"search-card\">\r\n      <text class=\"search-icon\">⌕</text>\r\n      <input\r\n        class=\"search-input\"\r\n        value=\"{{keyword}}\"\r\n        placeholder=\"搜史事 · 人物 · 朝代\"\r\n        placeholder-class=\"ph\"\r\n        confirm-type=\"search\"\r\n        focus\r\n        bindinput=\"onInput\"\r\n        bindconfirm=\"onSearch\"\r\n      />\r\n      <text class=\"search-btn\" bindtap=\"onSearch\">搜索</text>\r\n    </view>\r\n\r\n    <block wx:if=\"{{!results}}\">\r\n      <view class=\"section-head\">\r\n        <text class=\"section-title\">热门检索</text>\r\n      </view>\r\n      <view class=\"hot-wrap\">\r\n        <text\r\n          wx:for=\"{{hot}}\"\r\n          wx:key=\"*this\"\r\n          class=\"hot-chip\"\r\n          data-word=\"{{item}}\"\r\n          bindtap=\"onHotTap\"\r\n        >{{item}}</text>\r\n      </view>\r\n    </block>\r\n\r\n    <block wx:else>\r\n      <block wx:if=\"{{results.persons.length}}\">\r\n        <view class=\"section-head\">\r\n          <text class=\"section-title\">人物</text>\r\n          <text class=\"section-count\">{{results.persons.length}} 位</text>\r\n        </view>\r\n        <view class=\"result-card\">\r\n          <view\r\n            wx:for=\"{{results.persons}}\"\r\n            wx:key=\"id\"\r\n            class=\"row\"\r\n            data-type=\"person\"\r\n            data-id=\"{{item.id}}\"\r\n            bindtap=\"onRowTap\"\r\n          >\r\n            <view class=\"row-main\">\r\n              <text class=\"row-title\">{{item.title}}</text>\r\n              <text class=\"row-sub {{item.modern ? 'sub-modern' : ''}}\">{{item.sub}}</text>\r\n            </view>\r\n            <text class=\"row-arrow\">›</text>\r\n          </view>\r\n        </view>\r\n      </block>\r\n\r\n      <block wx:if=\"{{results.events.length}}\">\r\n        <view class=\"section-head\">\r\n          <text class=\"section-title\">史事</text>\r\n          <text class=\"section-count\">{{results.events.length}} 条</text>\r\n        </view>\r\n        <view class=\"result-card\">\r\n          <view\r\n            wx:for=\"{{results.events}}\"\r\n            wx:key=\"id\"\r\n            class=\"row\"\r\n            data-type=\"event\"\r\n            data-id=\"{{item.id}}\"\r\n            bindtap=\"onRowTap\"\r\n          >\r\n            <view class=\"row-main\">\r\n              <text class=\"row-title\">{{item.title}}</text>\r\n              <text class=\"row-sub {{item.modern ? 'sub-modern' : ''}}\">{{item.sub}}</text>\r\n            </view>\r\n            <text class=\"row-arrow\">›</text>\r\n          </view>\r\n        </view>\r\n      </block>\r\n\r\n      <block wx:if=\"{{results.panels.length}}\">\r\n        <view class=\"section-head\">\r\n          <text class=\"section-title\">朝代与专题</text>\r\n          <text class=\"section-count\">{{results.panels.length}} 个</text>\r\n        </view>\r\n        <view class=\"result-card\">\r\n          <view\r\n            wx:for=\"{{results.panels}}\"\r\n            wx:key=\"key\"\r\n            class=\"row\"\r\n            data-type=\"panel\"\r\n            data-id=\"{{item.id}}\"\r\n            data-mode=\"{{item.mode}}\"\r\n            bindtap=\"onRowTap\"\r\n          >\r\n            <view class=\"row-main\">\r\n              <text class=\"row-title\">{{item.title}}</text>\r\n              <text class=\"row-sub {{item.modern ? 'sub-modern' : ''}}\">{{item.sub}}</text>\r\n            </view>\r\n            <text class=\"row-arrow\">›</text>\r\n          </view>\r\n        </view>\r\n      </block>\r\n\r\n      <view class=\"empty\" wx:if=\"{{empty}}\">\r\n        <text class=\"empty-line\">未找到\"{{keyword}}\"相关内容</text>\r\n        <text class=\"empty-sub\">换个说法试试，比如\"汉武帝\"\"北宋\"\"辛亥\"</text>\r\n      </view>\r\n    </block>\r\n\r\n  </view>\r\n</view>\r\n"; });
__register('/pages/search/search.wxss', function (require, module, exports) { module.exports = ".page {\r\n  position: relative;\r\n  min-height: 100vh;\r\n  overflow: hidden;\r\n  background: #F6F1EA;\r\n}\r\n\r\n.paper-bg {\r\n  position: fixed;\r\n  left: 0;\r\n  top: 0;\r\n  z-index: 0;\r\n  width: 100%;\r\n  height: 100%;\r\n  opacity: 0.96;\r\n}\r\n\r\n.screen {\r\n  position: relative;\r\n  z-index: 2;\r\n  padding: 0 46rpx 120rpx;\r\n}\r\n\r\n/* 顶部：返回 + 页名 + 小印 */\r\n.topbar {\r\n  margin-top: 88rpx;\r\n  height: 76rpx;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: space-between;\r\n}\r\n\r\n.back {\r\n  width: 64rpx;\r\n  height: 64rpx;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n}\r\n\r\n.back-icon {\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 44rpx;\r\n  line-height: 1;\r\n  color: #1F1D19;\r\n}\r\n\r\n.top-title {\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 26rpx;\r\n  letter-spacing: 0.08em;\r\n  color: #8C857A;\r\n}\r\n\r\n.top-seal {\r\n  width: 34rpx;\r\n  height: 58rpx;\r\n  transform: rotate(2deg);\r\n}\r\n\r\n/* 搜索框卡片 */\r\n.search-card {\r\n  margin-top: 30rpx;\r\n  padding: 18rpx 24rpx;\r\n  border-radius: 34rpx;\r\n  background: #FCFBF8;\r\n  box-shadow: 0 18rpx 42rpx rgba(90, 70, 50, 0.06);\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 16rpx;\r\n}\r\n\r\n.search-icon {\r\n  font-size: 34rpx;\r\n  color: #A34A3E;\r\n  line-height: 1;\r\n}\r\n\r\n.search-input {\r\n  flex: 1;\r\n  height: 64rpx;\r\n  font-size: 28rpx;\r\n  letter-spacing: 0.02em;\r\n  color: #1F1D19;\r\n}\r\n\r\n.ph {\r\n  color: #B9B2A6;\r\n  letter-spacing: 0.04em;\r\n}\r\n\r\n.search-btn {\r\n  padding: 10rpx 26rpx;\r\n  border-radius: 26rpx;\r\n  background: #A34A3E;\r\n  color: #FFF8EF;\r\n  font-size: 24rpx;\r\n  letter-spacing: 0.08em;\r\n}\r\n\r\n/* 分组标题 */\r\n.section-head {\r\n  margin-top: 40rpx;\r\n  display: flex;\r\n  align-items: baseline;\r\n  justify-content: space-between;\r\n}\r\n\r\n.section-title {\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 30rpx;\r\n  letter-spacing: 0.12em;\r\n  color: #1F1D19;\r\n}\r\n\r\n.section-count {\r\n  font-size: 20rpx;\r\n  letter-spacing: 0.06em;\r\n  color: #B9B2A6;\r\n}\r\n\r\n/* 热门标签 */\r\n.hot-wrap {\r\n  margin-top: 22rpx;\r\n  display: flex;\r\n  flex-wrap: wrap;\r\n  gap: 18rpx;\r\n}\r\n\r\n.hot-chip {\r\n  padding: 12rpx 28rpx;\r\n  border-radius: 30rpx;\r\n  background: #FCFBF8;\r\n  box-shadow: inset 0 0 0 1rpx rgba(70, 58, 45, 0.08);\r\n  font-size: 24rpx;\r\n  letter-spacing: 0.06em;\r\n  color: #5F5A52;\r\n}\r\n\r\n/* 结果列表 */\r\n.result-card {\r\n  margin-top: 22rpx;\r\n  border-radius: 34rpx;\r\n  background: #FCFBF8;\r\n  box-shadow: 0 18rpx 42rpx rgba(90, 70, 50, 0.06);\r\n  padding: 6rpx 30rpx;\r\n}\r\n\r\n.row {\r\n  display: flex;\r\n  align-items: center;\r\n  padding: 26rpx 0;\r\n}\r\n\r\n.row + .row {\r\n  border-top: 1rpx solid rgba(70, 58, 45, 0.08);\r\n}\r\n\r\n.row-main {\r\n  flex: 1;\r\n  min-width: 0;\r\n}\r\n\r\n.row-title {\r\n  display: block;\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 30rpx;\r\n  letter-spacing: 0.05em;\r\n  color: #1F1D19;\r\n}\r\n\r\n.row-sub {\r\n  display: block;\r\n  margin-top: 8rpx;\r\n  font-size: 21rpx;\r\n  letter-spacing: 0.04em;\r\n  color: #A9825E;\r\n}\r\n\r\n.row-sub.sub-modern {\r\n  color: #7E9A9A;\r\n}\r\n\r\n.row-arrow {\r\n  font-size: 34rpx;\r\n  line-height: 1;\r\n  color: #C8C1B4;\r\n}\r\n\r\n/* 空结果 */\r\n.empty {\r\n  margin-top: 90rpx;\r\n  display: flex;\r\n  flex-direction: column;\r\n  align-items: center;\r\n}\r\n\r\n.empty-line {\r\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\r\n  font-size: 28rpx;\r\n  letter-spacing: 0.06em;\r\n  color: #5F5A52;\r\n}\r\n\r\n.empty-sub {\r\n  margin-top: 16rpx;\r\n  font-size: 22rpx;\r\n  letter-spacing: 0.04em;\r\n  color: #B9B2A6;\r\n}\r\n"; });

__register('/styles/app.wxss', function (require, module, exports) { module.exports = "page {\n  background: #F6F1EA;\n  color: #1F1D19;\n  font-family: \"Noto Sans SC\", \"PingFang SC\", \"Microsoft YaHei\", sans-serif;\n  -webkit-font-smoothing: antialiased;\n}\n\nview, text, image {\n  box-sizing: border-box;\n}\n\n.serif {\n  font-family: \"Songti SC\", \"STSong\", \"SimSun\", serif;\n}\n"; });
})();