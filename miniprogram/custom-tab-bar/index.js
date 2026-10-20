const TABS = [
  { key: 'home', label: '首页', icon: '/assets/icons/home.png', activeIcon: '/assets/icons/home-active.png' },
  { key: 'timeline', label: '时间轴', icon: '/assets/icons/timeline.png' },
  { key: 'discover', label: '发现', icon: '/assets/icons/discover.png' },
  { key: 'profile', label: '我的', icon: '/assets/icons/profile.png' }
];

Component({
  data: {
    tabs: TABS,
    active: 'home'
  },

  methods: {
    onTabTap(e) {
      const key = e.currentTarget.dataset.key;
      if (!key || key === this.data.active) return;
      wx.switchTab({ url: `/pages/${key}/${key}` });
    }
  }
});
