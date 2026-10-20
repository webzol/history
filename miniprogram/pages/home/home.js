const history = require('../../data/history.js');
const store = require('../../utils/store.js');

Page({
  data: {
    dateText: '10月18日 · 今天',
    hero: {},
    era: {},
    modern: {}
  },

  onShow() {
    this.setTab();
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

  setTab() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ active: 'home' });
    }
  },

  goDiscover() {
    wx.switchTab({ url: '/pages/discover/discover' });
  },

  goPage(e) {
    const page = e.currentTarget.dataset.page;

    if (page === 'timeline') {
      wx.switchTab({ url: '/pages/timeline/timeline' });
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
    store.setPendingTimelineMode('ancient');
    wx.switchTab({ url: '/pages/timeline/timeline' });
  },

  onModernTap() {
    store.setPendingTimelineMode('modern');
    wx.switchTab({ url: '/pages/timeline/timeline' });
  },

  onShareAppMessage() {
    return { title: '史页 · 一页一页读历史', path: '/pages/home/home' };
  }
});
