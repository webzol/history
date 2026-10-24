const hd = require('../../utils/historyData.js');
const store = require('../../utils/store.js');
const font = require('../../utils/font.js');
const eventImage = require('../../utils/eraImages.js').eventImage;
const personImageThumb = require('../../utils/eraImages.js').personImageThumb;
const personThumb = require('../../utils/eraImages.js').personThumb;
const altArt = require('../../utils/eraImages.js').altArt;

Page({
  data: {
    event: null,
    seal: '',
    headImg: '',
    relatedPersons: [],
    thumbLoaded: {},
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

    // 反查人物列表：人物详情里登记过 relatedEvents 的人，即与该事件相关。
    // fallback 恒为本地时代细部图：远端专属图加载中/失败时垫底，秒出且不闪破图。
    const relatedPersons = hd
      .get()
      .persons.filter((person) =>
        (person.relatedEvents || []).indexOf(event.id) >= 0
      )
      .map((person, index) => ({
        ...person,
        img: personImageThumb(person.id, person.era, index),
        fallback: personThumb(person.era, index)
      }));

    this.setData({
      event,
      headImg: eventImage(event.id, event.era),
      relatedPersons,
      thumbLoaded: {},
      seal: event.title.charAt(0),
      collected: store.isFavorite('event', event.id)
    });

    store.addFootprint('event', event.id);
  },

  onThumbLoad(e) {
    const id = e.currentTarget.dataset.id;
    if (id && !this.data.thumbLoaded[id]) {
      this.setData({ ['thumbLoaded.' + id]: true });
    }
  },

  // 远端专属图加载失败 → 换备用 jsDelivr 域名重试一次；再失败则露出垫底时代图
  onHeadImgErr() {
    const alt = altArt(this.data.headImg);
    if (alt) this.setData({ headImg: alt });
  },

  onThumbErr(e) {
    const id = e.currentTarget.dataset.id;
    const index = this.data.relatedPersons.findIndex((p) => p.id === id);
    if (index < 0) return;
    const item = this.data.relatedPersons[index];
    // 换备用 jsDelivr 域名重试一次；仍失败则置回垫底图（img === fallback 时上层隐藏）
    this.setData({ ['relatedPersons[' + index + '].img']: altArt(item.img) || item.fallback });
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
