const history = require('../../data/history.js');

Page({
  data: {
    event: null,
    seal: '',
    relatedPersons: []
  },

  onLoad(options) {
    const event = history.events.find((item) => item.id === options.id);
    if (!event) {
      wx.navigateBack({ fail: () => wx.redirectTo({ url: '/pages/home/home' }) });
      return;
    }

    // 反查人物列表：人物详情里登记过 relatedEvents 的人，即与该事件相关
    const relatedPersons = history.persons.filter((person) =>
      (person.relatedEvents || []).indexOf(event.id) >= 0
    );

    this.setData({
      event,
      relatedPersons,
      seal: event.era.charAt(0)
    });
  },

  goBack() {
    wx.navigateBack({
      fail: () => wx.redirectTo({ url: '/pages/home/home' })
    });
  },

  goPerson(e) {
    wx.navigateTo({
      url: `/pages/person/person?id=${e.currentTarget.dataset.id}`
    });
  },

  goTimeline() {
    wx.redirectTo({
      url: `/pages/timeline/timeline?mode=${this.data.event.mode}`
    });
  }
});
