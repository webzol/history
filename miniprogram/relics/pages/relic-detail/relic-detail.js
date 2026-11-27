const font = require('../../../utils/font.js');
const share = require('../../../utils/share.js');
const qrshare = require('../../../utils/qrshare.js');
const { RELICS, LIST_PATH, imagePath, sourceFor, shareMessage } = require('../../catalog.js');
const remote = require('../../remote.js');

Page({
  data: { fontClass: 'm', relic: null, loadState: '', imageFailed: false, sourceOpen: false, share: { open: false } },

  onLoad(options = {}) {
    share.enableMenu();
    font.apply(this);
    this.options = options;
    this.loadRelic();
  },

  loadRelic() {
    const { id } = this.options;
    const local = RELICS.find(item => item.id === id);
    if (local) return this.showRelic(local, imagePath(id, 'detail'));
    if (!id || !remote.ID_PATTERN.test(id)) return this.setData({ loadState: '' });
    const request = {};
    this.detailRequest = request;
    this.setData({ loadState: 'loading' });
    remote.getDetail(id, (error, item) => {
      if (this.detailRequest !== request) return;
      if (error) return this.setData({ loadState: 'retry' });
      if (!item) return this.setData({ loadState: '' });
      this.showRelic(item, remote.imageUrl(id, 'detail'));
    });
  },

  showRelic(item, image) {
    const { id, title, type, period, date, material, dimensions, accession, description, imageNote, imageRatio } = item;
    const { museum, url, rights } = sourceFor(id);
    this.setData({
      loadState: '',
      imageFailed: false,
      relic: { id, title, type, period, date, material, dimensions, accession, description,
        imageNote: imageNote || '', imageRatio, museum, url, rights, image }
    }, () => {
      if (this.options.share === '1') this.openShare();
    });
  },

  onShow() { font.apply(this); },

  onUnload() {
    this.detailRequest = null;
    this.__qrPayload = null;
    this.data.share.open = false;
  },

  onImageError() {
    if (!this.data.relic) return;
    const alt = remote.alternateImage(this.data.relic.image);
    this.setData(alt ? { 'relic.image': alt } : { imageFailed: true });
  },

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
      imgFallback: remote.alternateImage(relic.image),
      coverFit: 'contain',
      // 与 onShareAppMessage 同源（catalog.shareMessage），转发路径只有一处定义
      path: shareMessage(relic).path
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
