const font = require('../../../utils/font.js');
const share = require('../../../utils/share.js');
const qrshare = require('../../../utils/qrshare.js');
const { RELICS, LIST_PATH, imagePath, sourceFor, shareMessage } = require('../../catalog.js');

Page({
  data: { fontClass: 'm', relic: null, imageFailed: false, sourceOpen: false, share: { open: false } },

  onLoad(options = {}) {
    share.enableMenu();
    font.apply(this);
    const item = RELICS.find(relic => relic.id === options.id);
    if (!item) return;
    const { id, title, type, period, date, material, dimensions, accession, description, imageNote, imageRatio } = item;
    const { museum, url } = sourceFor(id);
    this.setData({
      relic: { id, title, type, period, date, material, dimensions, accession, description,
        imageNote: imageNote || '', imageRatio, museum, url, image: imagePath(id, 'detail') }
    }, () => {
      if (options.share === '1') this.openShare();
    });
  },

  onShow() { font.apply(this); },

  onUnload() {
    this.__qrPayload = null;
    this.data.share.open = false;
  },

  onImageError() { this.setData({ imageFailed: true }); },

  toggleSource() { this.setData({ sourceOpen: !this.data.sourceOpen }); },

  openShare() {
    if (this.data.relic && !this.data.share.open) qrshare.open(this);
  },

  closeShare() { qrshare.close(this); },

  noop() {},

  sharePayload() {
    const { relic } = this.data;
    return {
      kicker: `文物 · ${relic.period}`,
      title: relic.title,
      desc: relic.description,
      img: relic.image,
      coverFit: 'contain'
    };
  },

  saveQr() {
    if (!this.data.share.coverPending || this.data.share.fallback) qrshare.save(this);
  },

  goBack() {
    wx.navigateBack({ fail: () => wx.redirectTo({ url: LIST_PATH }) });
  },

  onShareAppMessage() { return shareMessage(this.data.relic); },

  onShareTimeline() {
    const card = this.onShareAppMessage();
    return share.timeline(card, card.imageUrl);
  }
});
