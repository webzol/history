// 空闲预热：首屏渲染只依赖打包内本地种子（秒开），启动 3s 后静默拉一次
// 远端热更 JSON（24h 缓存内命中则零请求），之后进任何页面 refresh 都不再等网络
const hd = require('./utils/historyData.js');

App({
  globalData: {
    appName: '史页'
  },

  onLaunch() {
    setTimeout(() => {
      try {
        hd.refresh(() => {});
      } catch (e) {
        void e;
      }
    }, 3000);
  }
});
