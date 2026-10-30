const hd = require('../../utils/historyData.js');
const store = require('../../utils/store.js');
const font = require('../../utils/font.js');

const lower = (text) => (text || '').toLowerCase();

// 检索索引：随数据中枢热替换整库重建。
// 载入时一次性拼串 + 小写化，检索时对预生成串做 indexOf，零拼串零分配。
let idxRef = null;
let personHay = [];
let eventHay = [];

function ensureIndex(history) {
  if (idxRef === history) return;
  personHay = history.persons.map((p) =>
    lower([p.name, p.era, p.roles, p.summary, p.dates].concat(p.details || []).join(' '))
  );
  eventHay = history.events.map((e) =>
    lower([e.title, e.era, e.tags, e.desc, e.yearText].concat(e.details || []).join(' '))
  );
  idxRef = history;
}

Page({
  data: {
    keyword: '',
    hot: ['孔子', '秦始皇', '赤壁之战', '岳飞', '张居正', '辛亥革命'],
    results: null,
    empty: false,
    metaText: '',
    fontClass: 'm'
  },

  onShow() {
    font.apply(this);
  },

  onInput(e) {
    const keyword = e.detail.value;
    this.setData({ keyword });
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
    if (!keyword.trim()) {
      // 清空同步回热门页，不等防抖
      this.setData({ results: null, empty: false, metaText: '' });
      return;
    }
    // 输入即搜（150ms 防抖），无需点「搜索」
    this.searchTimer = setTimeout(() => {
      this.searchTimer = null;
      this.onSearch();
    }, 150);
  },

  // 立即执行排队的检索（键盘确认 / 热词 / 自测用）
  flushSearch() {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
    this.onSearch();
  },

  onHide() {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
  },

  onUnload() {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
  },

  onSearch() {
    const word = this.data.keyword.trim();
    if (!word) {
      this.setData({ results: null, empty: false, metaText: '' });
      return;
    }
    const kw = lower(word);
    const modern = (era) => (era || '').indexOf('近现') >= 0 || (era || '').indexOf('民国') >= 0;
    const history = hd.get();
    ensureIndex(history);

    // 标题/姓名直接命中的排前面，正文命中靠后（搜「汉武帝」时汉武帝本人排孔子等正文提及者之前）
    const persons = [];
    history.persons.forEach((p, i) => {
      if (personHay[i].indexOf(kw) < 0) return;
      persons.push({
        id: p.id,
        title: p.name,
        sub: `${p.era} · ${p.roles}`,
        modern: modern(p.era),
        rank: lower(p.name).indexOf(kw) >= 0 ? 0 : 1
      });
    });
    persons.sort((a, b) => a.rank - b.rank);

    const events = [];
    history.events.forEach((e, i) => {
      if (eventHay[i].indexOf(kw) < 0) return;
      events.push({
        id: e.id,
        title: e.title,
        sub: `${e.yearText} · ${e.era}`,
        modern: e.mode === 'modern',
        rank: lower(e.title).indexOf(kw) >= 0 ? 0 : 1
      });
    });
    events.sort((a, b) => a.rank - b.rank);

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
      .filter((p) => lower(p.title).indexOf(kw) >= 0 || lower(p.sub).indexOf(kw) >= 0);

    const hits = persons.length + events.length + panels.length;
    this.setData({
      results: { persons, events, panels },
      empty: hits === 0,
      // 后端式返回汇总：检索范围 + 命中数，空态同样可见
      metaText: `已检索 ${history.events.length} 史事 · ${history.persons.length} 人物 · ${history.periods.length + history.topics.length} 朝代专题 · 命中 ${hits} 条`
    });
  },

  onHotTap(e) {
    const word = e.currentTarget.dataset.word;
    this.setData({ keyword: word }, () => this.flushSearch());
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
