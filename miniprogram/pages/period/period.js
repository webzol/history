const hd = require('../../utils/historyData.js');
const store = require('../../utils/store.js');
const font = require('../../utils/font.js');

// 朝代卡配图（与发现页一致，见 assets/paintings/SOURCES.md）
const PERIOD_META = {
  xia: { img: '/assets/palace.jpg', yearText: '约前2070–前1600', seal: '夏' },
  shang: { img: '/assets/palace.jpg', yearText: '约前1600–前1046', seal: '商' },
  xizhou: { img: '/assets/palace.jpg', yearText: '前1046–前771', seal: '周' },
  chunqiu: { img: '/assets/palace.jpg', yearText: '前770–前476', seal: '春' },
  zhanguo: { img: '/assets/palace.jpg', yearText: '前475–前221', seal: '战' },
  qin: { img: '/assets/palace.jpg', yearText: '前221–前207', seal: '秦' },
  han: { img: '/assets/paintings/han.jpg', yearText: '前202–公元9', seal: '汉' },
  donghan: { img: '/assets/paintings/han.jpg', yearText: '25–220', seal: '汉' },
  sanguo: { img: '/assets/palace.jpg', yearText: '184–280', seal: '三' },
  xijin: { img: '/assets/palace.jpg', yearText: '266–316', seal: '晋' },
  dongjin: { img: '/assets/paintings/landscape.jpg', yearText: '317–420', seal: '晋' },
  nanbeichao: { img: '/assets/paintings/landscape.jpg', yearText: '420–589', seal: '南' },
  sui: { img: '/assets/palace.jpg', yearText: '581–618', seal: '隋' },
  tang: { img: '/assets/paintings/tang.jpg', yearText: '618–907', seal: '唐' },
  wudai: { img: '/assets/palace.jpg', yearText: '907–979', seal: '五' },
  song: { img: '/assets/paintings/song.jpg', yearText: '960–1127', seal: '宋' },
  nansong: { img: '/assets/paintings/song.jpg', yearText: '1127–1279', seal: '宋' },
  liao: { img: '/assets/palace.jpg', yearText: '916–1125', seal: '辽' },
  xixia: { img: '/assets/palace.jpg', yearText: '1038–1227', seal: '夏' },
  jin: { img: '/assets/palace.jpg', yearText: '1115–1234', seal: '金' },
  yuan: { img: '/assets/palace.jpg', yearText: '1206–1368', seal: '元' },
  ming: { img: '/assets/paintings/ming.jpg', yearText: '1368–1644', seal: '明' },
  qing: { img: '/assets/paintings/qing.jpg', yearText: '1644–1912', seal: '清' },
  modern: { img: '/assets/paintings/modern.jpg', yearText: '1840–1949', seal: '近' }
};

const MODERN_ERAS = ['晚清', '民国', '新中国', '近现代', '现代'];

// 清代史事的 era 分「清」「晚清」两段；朝代页合并收录
const PERIOD_ERAS = { qing: ['清', '晚清'] };

Page({
  data: {
    period: null,
    events: [],
    span: '',
    seal: '',
    fontClass: 'm'
  },

  onLoad(options) {
    font.apply(this);
    this.curId = options.id;
    this.apply(true);
    hd.refresh((changed) => {
      if (changed) this.apply(false);
    });
  },

  onShow() {
    font.apply(this);
  },

  apply(redirectOnMiss) {
    const history = hd.get();
    const period = history.periods.find((item) => item.id === this.curId);
    if (!period) {
      if (!redirectOnMiss) return;
      wx.navigateBack({ fail: () => wx.redirectTo({ url: '/pages/home/home' }) });
      return;
    }

    const meta = PERIOD_META[period.id] || {};
    // 该时代下的史事：事件 era 命中朝代名，或与近现代面板对应
    const inPeriod = (event) => {
      const eras = PERIOD_ERAS[period.id] || [period.name];
      return eras.indexOf(event.era) >= 0 ||
        (period.id === 'modern' && MODERN_ERAS.indexOf(event.era) >= 0);
    };
    const events = history.events
      .filter(inPeriod)
      .sort((a, b) => a.year - b.year);

    // 时代脉络：以收录史事的首尾年份概括跨度，统一「公元前/公元」写法
    const span = (() => {
      if (!events.length) return '';
      const y0 = events[0].year;
      const y1 = events[events.length - 1].year;
      if (events.length === 1) return y0 < 0 ? `公元前${-y0}年` : `公元${y0}年`;
      if (y0 < 0 && y1 < 0) return `公元前${-y0}–前${-y1}年`;
      if (y0 < 0) return `公元前${-y0}–公元${y1}年`;
      return `公元${y0}–${y1}年`;
    })();

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
    store.setPendingTimelineMode(this.data.period.id === 'modern' ? 'modern' : 'ancient');
    wx.switchTab({ url: '/pages/timeline/timeline' });
  },

  onShareAppMessage() {
    const period = this.data.period;
    return {
      title: period ? `${period.name} · 史页` : '史页',
      path: period ? `/pages/period/period?id=${period.id}` : '/pages/home/home'
    };
  }
});
