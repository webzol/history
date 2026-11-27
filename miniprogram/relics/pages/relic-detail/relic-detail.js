const font = require('../../../utils/font.js');
const share = require('../../../utils/share.js');
const { RELICS, imagePath, sourceFor } = require('../../catalog.js');

const LIST_PATH = '/relics/pages/relic-list/relic-list';
const DETAIL_PATH = '/relics/pages/relic-detail/relic-detail';

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

  goBack() {
    wx.navigateBack({ fail: () => wx.redirectTo({ url: LIST_PATH }) });
  },

  onShareAppMessage() {
    const { relic } = this.data;
    return relic ? { title: `阅史记 · ${relic.title}`, path: `${DETAIL_PATH}?id=${relic.id}`, imageUrl: relic.image }
      : { title: '阅史记 · 文物', path: LIST_PATH, imageUrl: '/assets/relic-home-ink.png' };
  },

  onShareTimeline() {
    return share.timeline(this.onShareAppMessage(), this.data.relic?.image);
  }
});
