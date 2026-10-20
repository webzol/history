const hd = require('../../utils/historyData.js');
const store = require('../../utils/store.js');

const lower = (text) => (text || '').toLowerCase();

Page({
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
    const history = hd.get();

    const persons = history.persons
      .filter((p) => hit([p.name, p.era, p.roles, p.summary, p.dates].concat(p.details || [])))
      .map((p) => ({
        id: p.id,
        title: p.name,
        sub: `${p.era} · ${p.roles}`,
        modern: modern(p.era)
      }));

    const events = history.events
      .filter((e) => hit([e.title, e.era, e.tags, e.desc, e.yearText].concat(e.details || [])))
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
      store.setPendingTimelineMode(mode || 'ancient');
      wx.switchTab({ url: '/pages/timeline/timeline' });
    }
  },

  goBack() {
    wx.navigateBack({ fail: () => wx.redirectTo({ url: '/pages/home/home' }) });
  }
});
