const history = require('../../data/history.js');

// 朝代卡配图（与发现页一致，见 assets/paintings/SOURCES.md）
const PERIOD_META = {
  han: { img: '/assets/paintings/han.jpg', yearText: '前202–公元9', seal: '汉' },
  tang: { img: '/assets/paintings/tang.jpg', yearText: '618–907', seal: '唐' },
  song: { img: '/assets/paintings/song.jpg', yearText: '960–1127', seal: '宋' },
  modern: { img: '/assets/paintings/modern.jpg', yearText: '1840–1949', seal: '近' }
};

const MODERN_ERAS = ['晚清', '民国', '新中国', '近现代', '现代'];

Page({
  data: {
    period: null,
    events: [],
    span: '',
    seal: ''
  },

  onLoad(options) {
    const period = history.periods.find((item) => item.id === options.id);
    if (!period) {
      wx.navigateBack({ fail: () => wx.redirectTo({ url: '/pages/home/home' }) });
      return;
    }

    const meta = PERIOD_META[period.id] || {};
    // 该时代下的史事：事件 era 命中朝代名，或与近现代面板对应
    const inPeriod = (event) =>
      event.era === period.name ||
      (period.id === 'modern' && MODERN_ERAS.indexOf(event.era) >= 0);
    const events = history.events
      .filter(inPeriod)
      .sort((a, b) => a.year - b.year);

    // 时代脉络：以收录史事的首尾纪年概括跨度（单条用「自」起句）
    const span = events.length > 1
      ? `从${events[0].yearText}到${events[events.length - 1].yearText}`
      : events.length === 1
        ? `自${events[0].yearText}`
        : '';

    this.setData({
      period: { ...period, ...meta },
      events,
      span,
      seal: meta.seal || period.name.charAt(0)
    });
  },

  goBack() {
    wx.navigateBack({
      fail: () => wx.redirectTo({ url: '/pages/home/home' })
    });
  },

  goEvent(e) {
    wx.navigateTo({
      url: `/pages/event/event?id=${e.currentTarget.dataset.id}`
    });
  },

  goTimeline() {
    wx.redirectTo({
      url: `/pages/timeline/timeline?mode=${this.data.period.id === 'modern' ? 'modern' : 'ancient'}`
    });
  },

  onShareAppMessage() {
    const period = this.data.period;
    return {
      title: period ? `${period.name} · 史页` : '史页',
      path: period ? `/pages/period/period?id=${period.id}` : '/pages/home/home'
    };
  }
});
