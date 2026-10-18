Page({
  goTab(e) {
    const page = e.currentTarget.dataset.page;
    if (!page || page === 'profile') return;
    wx.redirectTo({
      url: `/pages/${page}/${page}`
    });
  }
});
