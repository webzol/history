const hd = require('../../utils/historyData.js');
const store = require('../../utils/store.js');
const font = require('../../utils/font.js');
const eraImage = require('../../utils/eraImages.js').eraImage;
const personThumb = require('../../utils/eraImages.js').personThumb;

Page({
  data: {
    event: null,
    seal: '',
    headImg: '',
    relatedPersons: [],
    collected: false,
    fontClass: 'm'
  },

  onLoad(options) {
    font.apply(this);
    this.curId = options.id;
    this.apply(true);
    hd.refresh((changed) => {
      if (changed) this.apply(false);
    });
  },

  onShow() {
    font.apply(this);
  },

  apply(redirectOnMiss) {
    const event = hd.get().events.find((item) => item.id === this.curId);
    if (!event) {
      if (!redirectOnMiss) return;
      wx.navigateBack({ fail: () => wx.redirectTo({ url: '/pages/home/home' }) });
      return;
    }

    // 反查人物列表：人物详情里登记过 relatedEvents 的人，即与该事件相关
    const relatedPersons = hd
      .get()
      .persons.filter((person) =>
        (person.relatedEvents || []).indexOf(event.id) >= 0
      )
      .map((person, index) => ({ ...person, img: personThumb(person.era, index) }));

    this.setData({
      event,
      headImg: eraImage(event.era),
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
    store.setPendingTimelineMode(this.data.event.mode);
    wx.switchTab({ url: '/pages/timeline/timeline' });
  },

  onShareAppMessage() {
    const event = this.data.event;
    return {
      title: event ? `${event.title} · 史页` : '史页',
      path: event ? `/pages/event/event?id=${event.id}` : '/pages/home/home'
    };
  }
});
