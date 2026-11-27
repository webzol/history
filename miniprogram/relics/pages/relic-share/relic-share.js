const font = require('../../../utils/font.js');
const { RELICS, LIST_PATH, shareMessage } = require('../../catalog.js');

Page({
  data: { fontClass: 'm', failed: false },

  onLoad(options = {}) {
    font.apply(this);
    const relic = RELICS.find(item => item.id === options.id);
    this.nextUrl = relic ? `${shareMessage(relic).path}&share=1` : LIST_PATH;
  },

  onReady() {
    wx.redirectTo({ url: this.nextUrl, fail: () => this.setData({ failed: true }) });
  },

  goBack() { wx.redirectTo({ url: LIST_PATH }); }
});
