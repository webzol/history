const font = require('../../../utils/font.js');
const share = require('../../../utils/share.js');
const qrshare = require('../../../utils/qrshare.js');
const { RELICS, LIST_PATH, imagePath, detailUrls, sourceFor, shareMessage } = require('../../catalog.js');

Page({
  data: { fontClass: 'm', relic: null, degraded: false, sourceOpen: false, share: { open: false } },

  onLoad(options = {}) {
    share.enableMenu();
    font.apply(this);
    const item = RELICS.find(relic => relic.id === options.id);
    if (!item) return;
    const { id, title, type, period, date, material, dimensions, accession, description, imageNote, imageRatio } = item;
    const { museum, url, rights } = sourceFor(id);
    // 详情大图按 CDN 主域 → 备用域依次加载（binderror 步进），都失败降级为包内缩略图
    this.detailSources = detailUrls(id);
    this.setData({
      relic: { id, title, type, period, date, material, dimensions, accession, description,
        imageNote: imageNote || '', imageRatio, museum, url, rights,
        image: this.detailSources[0], imageThumb: imagePath(id, 'thumb') }
    }, () => {
      if (options.share === '1') this.openShare();
    });
  },

  onShow() { font.apply(this); },

  onUnload() {
    this.__qrPayload = null;
    this.data.share.open = false;
  },

  onImageError() {
    if (this.data.degraded) return;
    const current = this.detailSources.indexOf(this.data.relic.image);
    if (current >= 0 && current + 1 < this.detailSources.length) {
      this.setData({ 'relic.image': this.detailSources[current + 1] });
      return;
    }
    this.setData({ degraded: true });
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
      // 海报题图走 CDN 主域，失败回退包内缩略图（qrshare 的 imgFallback 链）
      img: detailUrls(relic.id)[0],
      imgFallback: relic.imageThumb,
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
