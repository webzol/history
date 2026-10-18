const history = require('../../data/history.js');

Page({
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

    const daily = history.daily.find((item) => item.month === month && item.day === day) || history.daily[0];
    const era = history.topics.find((item) => item.id === 'tang');
    const modern = history.topics.find((item) => item.id === 'modern-china');

    this.setData({
      dateText: `${month}月${day}日 · 今天`,
      hero: daily,
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
        (index) => this.showDetail(history.periods[index])
      );
      return;
    }

    if (page === 'person') {
      this.showList(
        '选择一位人物',
        history.persons.map((item) => `${item.name} · ${item.roles}`),
        (index) => this.showPerson(history.persons[index])
      );
      return;
    }

    if (page === 'event') {
      const items = history.events.slice(-6).reverse();
      this.showList(
        '选择一件史事',
        items.map((item) => `${item.yearText} · ${item.title}`),
        (index) => this.showDetail(items[index])
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

  showPerson(person) {
    const content = [
      `${person.dates} · ${person.era}`,
      person.summary,
      person.quote ? `“${person.quote}” ${person.quoteSource}` : '',
      person.source ? `史料：${person.source}` : ''
    ].filter(Boolean).join('\n\n');

    wx.showModal({
      title: person.name,
      content,
      showCancel: false,
      confirmText: '知道了'
    });
  },

  onHeroTap() {
    this.showDetail(this.data.hero);
  },

  onEraTap() {
    this.showDetail(this.data.era);
  },

  onModernTap() {
    this.showDetail(this.data.modern);
  }
});
