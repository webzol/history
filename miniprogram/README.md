# 史页 · 微信小程序

当前版本按用户上传参考图的“现代新中式 · 纸上春秋”风格开发。

## 运行

1. 打开微信开发者工具。
2. 导入目录：`E:\AI\history\miniprogram`。
3. AppID：已配置 `wxe61b785946958cc7`。
4. 基础库：3.x。
5. 编译预览。

> 当前工程未在微信开发者工具/真机中实际编译；只做了 JS/JSON/WXML/资源引用静态检查。首次运行请重点看顶部胶囊避让、底部安全区、宋体回退，以及资料库索引首屏 / 分卷切换耗时。

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
| 资料库首页 | 已实现；39,067 条资料，5 个默认收起的分类组（典籍辞条 / 人物 / 事件 / 文献 / 诗文），每组带本地分类题图，展开后共 22 个入口 |
| 资料库列表 | 已实现；分类题图横幅 + 搜索 + 60 条分页；只加载轻量索引，诗文/人物/事件/文献/辞条统一 |
| 资料详情 | 已实现；按 `shard` 只加载一册；分类题图 / 结构化正文分段（原文 / 注释 / 译文 / 赏析） / 资料卡键值网格 / 分享 |

## 真实数据

- `data/history.js`：24 朝代 / 100 史事 / 72 人物 / 2 专题 + 今日史事日期库。
- `data/archive-meta.js` + `data/apk/*`：APK 资料库 39,067 条（辞条 13,287 / 人物 4,869 / 事件 705 / 帝王 373 / 战争 466 / 三国纪事 29 / 名句 677 / 文言辞条 3,889 / 诗文名句 3,955 / 诗文全文 10,817）。
- 全部栏目统一为「列表索引 + 详情分卷」：`data/apk/<栏目>/index.json` 只保留 `[id,title,meta,summary,shard]` 固定列（摘要 44 字），`00.json`… 为详情分卷；非诗文 ≤180 条 / ≤320KB，诗文 ≤120 条 / ≤320KB。列表只加载索引，详情按条目 `shard` 只加载一册。
- 分类辞条路径为 `data/apk/cards/<type>/index.json`；人物/事件/帝王/战争/三国/名句/文言/诗文名句为 `data/apk/<key>/index.json`；诗文全文为 `data/apk/poems/<shi|ci|wen|qu|fu>/index.json`。
- `data/apk/` 已通过 `project.config.json` 的 `packOptions.ignore` 排除出主包，由 `utils/apkData.js` 从 jsDelivr 按需加载；单文件 ≤1.5MB，资料库本地缓存总预算 5MB（LRU，先淘汰旧分卷），避免挤占 10MB 本地存储。
- `official_data.db` 与「职官辞典」去重后仅补入 2 条，职官辞典现为 3,720 条。

## 关键文件

```text
app.js / app.json / app.wxss
project.config.json
data/history.js / history-extra.js
data/archive-meta.js
data/apk/<栏目>/{index,00,01...}.json
utils/historyData.js / apkData.js / archiveImages.js
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
- 列表搜索只覆盖轻量索引字段（标题/分类/摘要；诗词为篇名/作者/朝代/摘要），暂不支持全文检索。
- 资料库条目暂未接入收藏/足迹。
- `project.config.json` 已配置 AppID `wxe61b785946958cc7`；正式发布前确认归属与权限。
- hero 插画、盛唐背景、搜图素材仅用于原型；上线前需确认授权或替换。

## 开发记录

- 项目交接：`../AGENTS.md`
- 开发日志：`../docs/DEVELOPMENT_LOG.md`
- 当前视觉规范：`../docs/UI_REFERENCE_STYLE.md`
- 网页首页预览：`../ui/reference/home-v3.html`
