const history = require('../../data/history.js');
const store = require('../../utils/store.js');

// 近现代识别色为蓝灰；其余时代走古代赭石色
const MODERN_ERAS = ['晚清', '民国', '新中国', '近现代', '现代'];

Page({
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
