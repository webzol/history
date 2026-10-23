# 史页 · 微信小程序

当前版本按用户上传参考图的“现代新中式 · 纸上春秋”风格开发。

## 运行

1. 打开微信开发者工具。
2. 导入目录：`E:\AI\history\miniprogram`。
3. AppID：已配置 `wxe61b785946958cc7`。
4. 基础库：3.x。
5. 编译预览。

> 当前工程未在微信开发者工具/真机中实际编译；只做了 JS/JSON/WXML/资源引用静态检查。首次运行请重点看顶部胶囊避让、底部安全区、宋体回退，以及资料库首次加载耗时。

## 页面状态（13 页）

| 页面 | 状态 |
|---|---|
| 首页 | 已实现，接入本地真实历史数据种子 + 远端热更 |
| 时间轴 | 古代/近现代切换，接入真实事件 |
| 发现 | 已实现；顶部有「史页资料库」入口 |
| 我的 | 已实现；收藏/足迹/字号/统计/清缓存 |
| 人物详情 | 已实现 |
| 事件详情 | 已实现 |
| 朝代详情 | 已实现 |
| 搜索 | 已实现 |
| 收藏 | 已实现 |
| 足迹 | 已实现 |
| 资料库首页 | 已实现；28,248 条资料、9 类辞条、8 个入口 |
| 资料库列表 | 已实现；搜索 + 60 条分页加载 |
| 资料详情 | 已实现；正文分段/资料卡/译文/分享 |

## 真实数据

- `data/history.js`：24 朝代 / 100 史事 / 72 人物 / 2 专题 + 今日史事日期库。
- `data/archive-meta.js` + `data/apk/*.json`：APK 资料库 28,248 条（辞条 13,285 / 人物 4,869 / 事件 705 / 帝王 373 / 战争 466 / 三国纪事 29 / 名句 677 / 文言辞条 3,889 / 诗文名句 3,955）。
- `data/apk/` 已通过 `project.config.json` 的 `packOptions.ignore` 排除出主包，由 `utils/apkData.js` 从 jsDelivr 按需加载；单类 UTF-8 超过 1.5MB 只保留内存缓存，避免挤占 10MB 本地存储。
- 资料库条目暂未接入收藏/足迹。

## 关键文件

```text
app.js / app.json / app.wxss
project.config.json
data/history.js / history-extra.js
data/archive-meta.js
data/apk/*.json
utils/historyData.js / apkData.js
utils/store.js / font.js / entries.js
pages/home|timeline|discover|profile
pages/person|event|period|search|favorites|footprints
pages/archive|archive-list|archive-detail
assets/paper-bg.jpg
assets/back-arrow.png
assets/paintings/（原型搜图素材，见 SOURCES.md）
```

## 已知问题

- 未在微信开发者工具/真机中实际编译；胶囊避让、底部安全区、资料库加载速度待确认。
- 资料库数据来自 APK 迁移，尚未逐条史实/授权审校。
- `poem2.db` 的 10,817 篇诗文全文、`official_data.db` 尚未纳入；后者与职官辞典高度重复。
- 资料库条目暂未接入收藏/足迹。
- `project.config.json` 已配置 AppID `wxe61b785946958cc7`；正式发布前确认归属与权限。
- hero 插画、盛唐背景、搜图素材仅用于原型；上线前需确认授权或替换。

## 开发记录

- 项目交接：`../AGENTS.md`
- 开发日志：`../docs/DEVELOPMENT_LOG.md`
- 当前视觉规范：`../docs/UI_REFERENCE_STYLE.md`
- 网页首页预览：`../ui/reference/home-v3.html`
