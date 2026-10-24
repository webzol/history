const hd = require('../../utils/historyData.js');
const store = require('../../utils/store.js');
const font = require('../../utils/font.js');

const lower = (text) => (text || '').toLowerCase();

Page({
  data: {
    keyword: '',
    hot: ['孔子', '秦始皇', '赤壁之战', '岳飞', '张居正', '辛亥革命'],
    results: null,
    empty: false,
    fontClass: 'm'
  },

  onShow() {
    font.apply(this);
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
    const history = hd.get();

    // 标题/姓名直接命中的排前面，正文命中靠后（搜「汉武帝」时汉武帝本人排孔子等正文提及者之前）
    const persons = history.persons
      .filter((p) => hit([p.name, p.era, p.roles, p.summary, p.dates].concat(p.details || [])))
      .map((p) => ({
        id: p.id,
        title: p.name,
        sub: `${p.era} · ${p.roles}`,
        modern: modern(p.era),
        rank: lower(p.name).indexOf(kw) >= 0 ? 0 : 1
      }))
      .sort((a, b) => a.rank - b.rank);

    const events = history.events
      .filter((e) => hit([e.title, e.era, e.tags, e.desc, e.yearText].concat(e.details || [])))
      .map((e) => ({
        id: e.id,
        title: e.title,
        sub: `${e.yearText} · ${e.era}`,
        modern: e.mode === 'modern',
        rank: lower(e.title).indexOf(kw) >= 0 ? 0 : 1
      }))
      .sort((a, b) => a.rank - b.rank);

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
      store.setPendingTimelineMode(mode || 'ancient');
      wx.switchTab({ url: '/pages/timeline/timeline' });
    }
  },

  goBack() {
    wx.navigateBack({ fail: () => wx.redirectTo({ url: '/pages/home/home' }) });
  }
});
