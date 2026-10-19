const history = require('../../data/history.js');

Page({
  data: {
    stats: [
      { key: 'periods', label: '朝代', value: 0 },
      { key: 'events', label: '史事', value: 0 },
      { key: 'persons', label: '人物', value: 0 },
      { key: 'topics', label: '专题', value: 0 }
    ],
    events: [],
    persons: []
  },

  onLoad() {
    this.setData({
      events: history.events,
      persons: history.persons,
      stats: [
        { key: 'periods', label: '朝代', value: history.periods.length },
        { key: 'events', label: '史事', value: history.events.length },
        { key: 'persons', label: '人物', value: history.persons.length },
        { key: 'topics', label: '专题', value: history.topics.length }
      ]
    });
  },

  goTab(e) {
    const page = e.currentTarget.dataset.page;
    if (!page || page === 'profile') return;
    wx.redirectTo({ url: `/pages/${page}/${page}` });
  },

  onFav() {
    wx.showToast({ title: '收藏将在下一版开放', icon: 'none' });
  },

  onFootprints() {
    wx.showToast({ title: '浏览足迹整理中', icon: 'none' });
  },

  onDataNote() {
    wx.showModal({
      title: '数据与史料说明',
      content: [
        '当前内容为本地真实史料种子：',
        `朝代 ${this.data.stats[0].value} 条、史事 ${this.data.stats[1].value} 条、人物 ${this.data.stats[2].value} 条、专题 ${this.data.stats[3].value} 条。`,
        '每条均附史料出处字数索引；正式发布前会逐条完成历史审校。'
      ].join('\n'),
      showCancel: false,
      confirmText: '知道了'
    });
  },

  onAssetNote() {
    wx.showModal({
      title: '素材与授权说明',
      content: '插画与文物图片来自公开网络搜索与参考图裁切，仅用于原型演示；正式上线前将替换为有授权的来源。明细见工程 assets/paintings/SOURCES.md。',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  onAbout() {
    wx.showModal({
      title: '史页',
      content: '一页一页读历史。古代史与近现代史并列，史料可追溯。',
      showCancel: false
    });
  },

  onAboutBanner() {
    wx.showModal({
      title: '千古长卷',
      content: '王希孟《千里江山图》卷（局部），现藏故宫博物院。十八岁完成此卷，青绿千年不褪。',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  onClearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '只清空本地临时缓存，不影响收藏（尚未开放）。',
      confirmText: '清除',
      success: (res) => {
        if (!res.confirm) return;
        wx.clearStorageSync();
        wx.showToast({ title: '已清除', icon: 'success' });
      }
    });
  }
});
