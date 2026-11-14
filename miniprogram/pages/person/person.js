const hd = require('../../utils/historyData.js');
const store = require('../../utils/store.js');
const font = require('../../utils/font.js');
const qrshare = require('../../utils/qrshare.js');
const wxacode = require('../../utils/wxacode.js');
const personImage = require('../../utils/eraImages.js').personImage;
const eventImage = require('../../utils/eraImages.js').eventImage;
const altArt = require('../../utils/eraImages.js').altArt;
const PERSON_ART = require('../../utils/eraImages.js').PERSON_ART;
const eraImage = require('../../utils/eraImages.js').eraImage;

// 近现代识别色为蓝灰；其余时代走古代赭石色
const MODERN_ERAS = ['晚清', '民国', '新中国', '近现代', '现代'];

Page({
  data: {
    person: null,
    accent: 'ancient',
    seal: '',
    headImg: '',
    related: [],
    collected: false,
    fontClass: 'm',
    share: { open: false }
  },

  onLoad(options) {
    font.apply(this);
    // 太阳码扫码进入：options 只有 scene，mergeScene 解出 id（普通跳转原样透传）
    this.curId = wxacode.mergeScene(options || {}).id;
    this.apply(true);
    hd.refresh((changed) => {
      if (changed) this.apply(false);
    });
  },

  onShow() {
    font.apply(this);
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
      .map((event) => ({ ...event, img: eventImage(event.id, event.era) }));

    this.setData({
      person,
      related,
      headImg: personImage(person.id, person.era),
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

  // 远端专属图加载失败 → 换备用 jsDelivr 域名重试一次；再失败则隐藏该图（头卡露纸底/行图隐藏）
  onHeadImgErr() {
    const alt = altArt(this.data.headImg);
    if (alt) this.setData({ headImg: alt });
  },

  onRelImgErr(e) {
    const id = e.currentTarget.dataset.id;
    const index = this.data.related.findIndex((ev) => ev.id === id);
    if (index < 0) return;
    const alt = altArt(this.data.related[index].img);
    if (alt) this.setData({ ['related[' + index + '].img']: alt });
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

  openShare() {
    qrshare.open(this);
  },

  closeShare() {
    qrshare.close(this);
  },

  saveQr() {
    qrshare.save(this);
  },

  sharePayload() {
    const person = this.data.person;
    return {
      kicker: person ? `人物 · ${person.era || ''}` : '人物',
      title: person ? person.name : '阅史记',
      desc: person ? person.summary || '' : '',
      img: this.data.headImg || '',
      imgFallback: (person && (PERSON_ART[person.id] || eraImage(person.era))) || '/assets/palace.jpg',
      path: person ? `/pages/person/person?id=${person.id}` : '/pages/home/home'
    };
  },

  onShareAppMessage() {
    const person = this.data.person;
    return {
      title: person ? `${person.name} · 阅史记` : '阅史记',
      path: this.sharePayload().path
    };
  }
});
