const history = require('../../data/history.js');

// 近现代识别色为蓝灰；其余时代走古代赭石色
const MODERN_ERAS = ['晚清', '民国', '新中国', '近现代', '现代'];

Page({
  data: {
    person: null,
    accent: 'ancient',
    seal: '',
    related: []
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
      seal: person.name.charAt(0)
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
  }
});
