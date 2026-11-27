const font = require('../../../utils/font.js');
const share = require('../../../utils/share.js');
const { RELICS, LIST_PATH, imagePath, sourceFor, shareMessage } = require('../../catalog.js');

Page({
  data: { fontClass: 'm', relic: null, imageFailed: false, sourceOpen: false },

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
    });
  },

  onShow() { font.apply(this); },

  onImageError() { this.setData({ imageFailed: true }); },

  toggleSource() { this.setData({ sourceOpen: !this.data.sourceOpen }); },

  openShare() {
    const { relic } = this.data;
    if (relic) wx.navigateTo({ url: `/relics/pages/relic-share/relic-share?id=${encodeURIComponent(relic.id)}` });
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
