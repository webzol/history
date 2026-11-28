const font = require('../../../utils/font.js');
const relicData = require('../../relicData.js');
const { RELICS, LIST_PATH, DETAIL_PATH, shareMessage } = require('../../catalog.js');

// 旧分享入口：转详情并带 share=1。精修件包内即时判断；批量条目查远端索引。
Page({
  data: { fontClass: 'm', failed: false },

  onLoad(options = {}) {
    font.apply(this);
    const id = options.id;
    const curated = RELICS.find(item => item.id === id);
    if (curated) {
      this.nextUrl = `${shareMessage(curated).path}&share=1`;
      return;
    }
    relicData.loadIndex((rows, info) => {
      if (!rows) { this.nextUrl = LIST_PATH; return; }
      if (rows.some(row => row.id === id)) {
        this.nextUrl = `${DETAIL_PATH}?id=${encodeURIComponent(id)}&share=1`;
        return;
      }
      // 部分索引未命中：等后续分块合并回调再判；完整索引仍未见才是未知条目
      if (info && !info.partial) this.nextUrl = LIST_PATH;
    });
  },

  onReady() {
    const go = () => {
      if (!this.nextUrl) return; // 索引未就绪：稍后重试
      wx.redirectTo({ url: this.nextUrl, fail: () => this.setData({ failed: true }) });
    };
    if (this.nextUrl) go();
    else setTimeout(go, 300);
  },

  noop() {}
});
