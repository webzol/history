// 空闲预热：首屏渲染只依赖打包内本地种子（秒开），启动 3s 后静默拉一次
// 远端热更 JSON（24h 缓存内命中则零请求），之后进任何页面 refresh 都不再等网络。
// 同时预热资料库自抓图清单（170KB JSON，7 天缓存；主包 2MB 上限后移出，见 utils/archiveArt.js）
const hd = require('./utils/historyData.js');
const archiveArt = require('./utils/archiveArt.js');

App({
  globalData: {
    appName: '阅史记'
  },

  onLaunch() {
    setTimeout(() => {
      try {
        hd.refresh(() => {});
      } catch (e) {
        void e;
      }
      try {
        archiveArt.ensure(() => {});
      } catch (e) {
        void e;
      }
    }, 3000);
  }
});
