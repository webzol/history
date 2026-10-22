// 阅读字号：设置项与详情页根节点类名（样式见 app.wxss 的 .fs-*）
const store = require('./store.js');

const OPTIONS = [
  { key: 's', label: '小' },
  { key: 'm', label: '标准' },
  { key: 'l', label: '大' },
  { key: 'xl', label: '特大' }
];

function fontKey() {
  return store.getFontKey();
}

// 页面显示/加载时同步根节点字号类（只改 data，不触发布局抖动）
function apply(page) {
  const key = fontKey();
  if (page && page.setData && page.data.fontClass !== key) {
    page.setData({ fontClass: key });
  }
  return key;
}

module.exports = { OPTIONS, fontKey, apply };
