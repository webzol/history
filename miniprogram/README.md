# 史页 · 微信小程序（首页开发版）

当前版本按用户上传参考图的“现代新中式 · 纸上春秋”风格开发。

## 运行

1. 打开微信开发者工具。
2. 导入目录：`E:\hish\miniprogram`。
3. AppID：可先用测试号 / `touristappid`。
4. 基础库：3.x。
5. 编译预览。

> 当前工程未在微信开发者工具中实际编译；只做了 JS/JSON/WXML/资源引用静态检查。首次运行请重点看顶部胶囊避让、底部安全区、宋体回退。

## 页面状态

| 页面 | 状态 |
|---|---|
| 首页 | 已实现，接入本地真实历史数据种子 |
| 时间轴 | 古代/近现代切换，接入真实事件 |
| 发现 | 占位空态 |
| 我的 | 占位空态 |

## 首页结构

- 宣纸背景 + 竖排书法暗纹
- `史页` 字标 + 搜索/菜单
- 今日史事大卡（参考图裁切的宫殿插画 + “史载”印章）
- 时间轴 / 朝代 / 人物 / 事件 四磁贴
- 盛唐气象横卡：整卡使用 `tang-bg.jpg`（按卡片比例裁切），右侧蓝灰卷轴装饰
- 百年中国近现代入口：与盛唐卡同规格白卡，蓝灰 1840/1949 + 朱砂“近”印
- 自绘底部四栏

## 真实数据

- `data/history.js`：4 个时代/时期、12 个事件、3 位人物、2 个专题、1 条今日史事。
- 首页与时间轴均由该数据驱动；事件/人物/朝代点击目前用 ActionSheet + Modal 展示。
- 所有条目带 `source` 字段，尚未完成逐条历史审校。

## 关键文件

```text
app.js / app.json / app.wxss
project.config.json
data/history.js
pages/home/home.{js,json,wxml,wxss}
pages/timeline/timeline.{js,json,wxml,wxss}
pages/discover/discover.{js,json,wxml,wxss}
pages/profile/profile.{js,json,wxml,wxss}
assets/paper-bg.png
assets/palace.png
assets/tang-bg.jpg
assets/scroll-accent.png
assets/icons/*.png
```

## 已知问题

- 未在微信开发者工具中实际编译。
- 自绘底部四栏用 `wx.redirectTo`，不是原生 tabBar；后续建议改 `custom-tab-bar`。
- 发现/我的为占位。
- 事件/人物详情目前是 Modal，不是独立页面。
- 首页“今日史事”目前是编辑精选（汉武帝），精确日期匹配待审校。
- hero 插画与盛唐背景从用户参考图/新图裁切，仅用于原型；上线前需确认授权或替换。
- `paper-bg.png` 约 871KB，后续可压缩。
- `project.config.json` 使用 `touristappid`，正式开发需替换。

## 开发记录

- 项目交接：`../AGENTS.md`
- 开发日志：`../docs/DEVELOPMENT_LOG.md`
- 当前视觉规范：`../docs/UI_REFERENCE_STYLE.md`
- 网页首页预览：`../ui/reference/home-v3.html`
