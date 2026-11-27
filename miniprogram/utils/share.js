function enableMenu() {
  if (typeof wx.showShareMenu === 'function') {
    wx.showShareMenu({ menus: ['shareAppMessage', 'shareTimeline'] });
  }
}

function timeline({ title, path }, imageUrl) {
  const card = { title, imageUrl: imageUrl || '/assets/palace.jpg' };
  // 微信朋友圈固定打开当前页，只需传入现有分享路径的查询部分。
  const queryStart = path.indexOf('?');
  if (queryStart >= 0) card.query = path.slice(queryStart + 1);
  return card;
}

module.exports = { enableMenu, timeline };
