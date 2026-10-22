const hd = require('../../utils/historyData.js');
const store = require('../../utils/store.js');
const eraImage = require('../../utils/eraImages.js').eraImage;
const personThumb = require('../../utils/eraImages.js').personThumb;

// 近现代识别色为蓝灰；其余时代走古代赭石色
const MODERN_ERAS = ['晚清', '民国', '新中国', '近现代', '现代'];

Page({
  data: {
    person: null,
    accent: 'ancient',
    seal: '',
    headImg: '',
    related: [],
    collected: false
  },

  onLoad(options) {
    this.curId = options.id;
    this.apply(true);
    hd.refresh((changed) => {
      if (changed) this.apply(false);
    });
  },

  apply(redirectOnMiss) {
    const history = hd.get();
    const person = history.persons.find((item) => item.id === this.curId);
    if (!person) {
      if (!redirectOnMiss) return;
      wx.navigateBack({ fail: () => wx.redirectTo({ url: '/pages/home/home' }) });
      return;
    }

    const related = (person.relatedEvents || [])
      .map((id) => history.events.find((event) => event.id === id))
      .filter(Boolean)
      .map((event, index) => ({ ...event, img: personThumb(event.era, index) }));

    this.setData({
      person,
      related,
      headImg: eraImage(person.era),
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
