Page({
  goTab(e) {
    const page = e.currentTarget.dataset.page;
    if (!page || page === 'discover') return;
    wx.redirectTo({
      url: `/pages/${page}/${page}`
    });
  }
});
