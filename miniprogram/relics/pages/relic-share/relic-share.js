const font = require('../../../utils/font.js');
const share = require('../../../utils/share.js');
const qrshare = require('../../../utils/qrshare.js');
const { RELICS, LIST_PATH, shareMessage } = require('../../catalog.js');

Page({
  data: { fontClass: 'm', share: { open: false } },

  onLoad(options = {}) {
    font.apply(this);
    this.relic = RELICS.find(item => item.id === options.id);
    if (!this.relic) return;
    share.enableMenu();
    qrshare.open(this);
  },

  onShow() { font.apply(this); },

  onUnload() {
    this.__qrPayload = null;
    this.data.share.open = false;
  },

  sharePayload() {
    const relic = this.relic;
    const message = shareMessage(relic);
    return {
      kicker: `文物 · ${relic.period}`,
      title: relic.title,
      desc: relic.description,
      img: message.imageUrl,
      coverFit: 'contain'
    };
  },

  saveQr() {
    if (!this.data.share.coverPending || this.data.share.fallback) qrshare.save(this);
  },

  goBack() {
    const url = this.relic ? shareMessage(this.relic).path : LIST_PATH;
    wx.navigateBack({ fail: () => wx.redirectTo({ url }) });
  },

  onShareAppMessage() { return shareMessage(this.relic); },

  onShareTimeline() {
    const card = this.onShareAppMessage();
    return share.timeline(card, card.imageUrl);
  }
});
