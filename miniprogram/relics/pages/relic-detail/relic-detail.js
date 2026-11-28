const font = require('../../../utils/font.js');
const share = require('../../../utils/share.js');
const qrshare = require('../../../utils/qrshare.js');
const relicData = require('../../relicData.js');
const { RELICS, LIST_PATH, imagePath, detailUrls, shareMessage } = require('../../catalog.js');

const TEMPLATE_DATA_NOTE = '条目按馆方开放数据生成，未经史实审校。';

Page({
  data: { fontClass: 'm', relic: null, loading: true, notFound: false, failed: false, degraded: false, sourceOpen: false, share: { open: false } },

  onLoad(options = {}) {
    share.enableMenu();
    font.apply(this);
    this.relicId = options.id;
    this.setData({ loading: true, notFound: false, failed: false, degraded: false, relic: null });
    // 精修 60 件包内即时出；批量条目按索引分卷异步解析
    relicData.loadDetail(options.id, (payload, err) => {
      if (!payload) {
        if (err && err.stalled) {
          this.setData({ loading: false, failed: true });
          return;
        }
        this.setData({ loading: false, notFound: true });
        return;
      }
      const relic = payload.relic;
      const description = (relic.description || '').trim();
      relic.dataNote = relic.template ? TEMPLATE_DATA_NOTE : '';
      relic.descriptionBody = relic.dataNote && description.endsWith(relic.dataNote)
        ? description.slice(0, -relic.dataNote.length).trim()
        : description;
      this.detailSources = detailUrls(relic.id);
      relic.image = this.detailSources[0];
      this.setData({ relic, loading: false }, () => {
        if (options.share === '1') this.openShare();
      });
    });
  },

  // 分块补齐受阻后的重试入口：重新解析当前 id（已到分块直接命中缓存）
  retryLoad() {
    if (this.data.loading) return;
    this.onLoad({ id: this.relicId, share: this.data.share.open ? '1' : undefined });
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
      // 海报题图走 CDN 主域，精修件回退包内缩略图（批量件无包内图，走兜底卷首）
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
