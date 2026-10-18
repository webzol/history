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
    source: '《汉书·武帝纪》'
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
    source: '《宋史·太祖本纪》'
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
    source: '《续资治通鉴长编》'
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
    source: '《宋史·王安石传》'
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
    source: '《宋史·钦宗本纪》'
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
    source: '《清史稿·宣宗本纪》'
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
    source: '《清史稿·宣统皇帝本纪》'
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
    source: '《中国共产党历史》第一卷'
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
    source: '《中国共产党历史》第一卷'
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
    source: '《中华人民共和国史稿》'
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
    source: '《中国共产党简史》'
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
    source: '《清史稿·文宗本纪》；圆明园档案'
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
    source: '《汉书·武帝纪》'
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
    source: '《宋史·苏轼传》'
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
    source: '《鲁迅全集》'
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

// 今日史事：当前按 10 月 18 日匹配；首版先用“汉武帝即位”作为编辑精选。
// 正式内容应按“月-日”精确匹配，并由历史审校核对日期。
const daily = [
  {
    month: 10,
    day: 18,
    title: '今日史事',
    dateText: '公元前141年',
    desc: '公元前141年，汉武帝即位，开启西汉鼎盛时代',
    eventId: 'han-wudi',
    source: '《汉书·武帝纪》'
  }
];

module.exports = {
  periods,
  events,
  persons,
  topics,
  daily
};
