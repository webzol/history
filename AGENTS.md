# 史页 · 开发交接说明（先读我）

**最后更新：2026-10-19 上午（Asia/Shanghai）**

## 0. 一句话

「史页」是一个中国历史微信小程序，覆盖古代史与近现代史。当前视觉方向以用户上传的参考图为准：**浅米宣纸 + 淡墨书法暗纹 + 大圆角白卡 + 手绘建筑插画 + 浅色功能磁贴 + 朱砂小印章 + 底部四栏**。

当前已有：

- 高保真网页首页：`ui/reference/home-v3.html`
- 原生小程序骨架：`miniprogram/`
- 首页已实现，并接入本地真实历史数据种子；时间轴支持古代/近现代切换与真实事件；发现/我的为占位页。
- 尚无后端、搜索、独立的人物/事件详情页。

> 重要：`ui/neo/` 与 `docs/UI设计说明.md` 是上一版“极简新中式”探索，**已归档，不是当前视觉基准**。当前基准是这份说明、`docs/DEVELOPMENT_LOG.md` 和 `ui/reference/home-v3.html`。

---

## 1. 建议阅读顺序

1. `AGENTS.md`（本文件）
2. `docs/DEVELOPMENT_LOG.md`（开发日志、决策、待办）
3. `docs/UI_REFERENCE_STYLE.md`（当前视觉规范）
4. `docs/历史小程序开发大纲.md`（产品范围与内容规划）
5. `ui/reference/home-v3.html`（当前首页视觉源文件）
6. `miniprogram/`（原生小程序代码）

上一版归档（旧版“极简新中式”，非当前基准）：

- `docs/UI设计说明.md`（neo 风格说明）
- `ui/neo/`（10 页 neo 概念板与 HTML）

---

## 2. 当前页面状态

| 页面 | 状态 | 代码 | 说明 |
|---|---|---|---|
| 首页 | 已实现，数据驱动 | `miniprogram/pages/home/` | 宣纸背景、今日史事、四磁贴、盛唐气象、近现代入口、底部四栏；数据来自 `data/history.js` |
| 时间轴 | 已接入真实数据 | `miniprogram/pages/timeline/` | 古代/近现代切换；北宋与近现代事件列表；点击事件跳独立事件详情页 |
| 人物详情 | 已实现 | `miniprogram/pages/person/` | 大字人名、楷体引文、正文段落、相关史事列表（跳事件详情）；支持古代/近现代双色调 |
| 事件详情 | 已实现 | `miniprogram/pages/event/` | 大字年份、双色调色条、正文段落、"其时其人"人物卡（跳人物详情）、回时间轴按钮 |
| 发现 | 已实现（占位说明保留在页尾） | `miniprogram/pages/discover/` | 朝代 2×2 配画卡（搜图素材）、专题长卷（盛唐/百年中国→时间轴）、精选史事列表→事件详情 |
| 我的 | 已实现 | `miniprogram/pages/profile/` | 千里江山图头像+横幅、本地数据统计、收藏/足迹占位、数据/素材/关于说明、清除缓存 |

网页预览：

- `ui/reference/home-v3.html`：当前首页，390×844 基准
- `ui/reference/home-final.png`：当前首页截图（780×1688，2x）

---

## 3. 目录结构

```text
E:\hish\
├─ AGENTS.md                         # 本文件，先读
├─ docs\
│  ├─ DEVELOPMENT_LOG.md             # 开发日志 / 交接
│  ├─ UI_REFERENCE_STYLE.md          # 当前视觉规范
│  ├─ UI设计说明.md                   # 上一版 neo 风格（归档）
│  └─ 历史小程序开发大纲.md            # 产品范围、内容规划
├─ miniprogram\                      # 原生微信小程序
│  ├─ app.js / app.json / app.wxss
│  ├─ project.config.json
│  ├─ sitemap.json
│  ├─ data\history.js               # 本地真实历史数据种子
│  ├─ assets\                        # 参考图裁切插画、宣纸背景、图标 PNG
│  └─ pages\home|timeline|discover|profile
└─ ui\
   ├─ reference\                     # 当前参考图风格
   │  ├─ home-v3.html                # 当前首页 HTML
   │  ├─ home-final.png              # 当前首页截图
   │  └─ assets\                     # 用户参考图裁切、paper-bg、旧版 SVG
   └─ neo\                           # 上一版 10 页概念板（归档）
```

---

## 4. 如何运行 / 预览

### 网页预览

直接用浏览器打开：

```text
E:\hish\ui\reference\home-v3.html
```

重新截图（Windows + Chrome）：

```powershell
& 'C:\Program Files\Google\Chrome\Application\chrome.exe' `
  --headless=new --disable-gpu --no-sandbox --hide-scrollbars `
  --force-device-scale-factor=2 --window-size=390,844 `
  --virtual-time-budget=2500 `
  --screenshot='E:\hish\ui\reference\home-final.png' `
  'file:///E:/hish/ui/reference/home-v3.html'
```

### 微信小程序

1. 打开微信开发者工具。
2. 导入 `E:\hish\miniprogram`。
3. AppID 可先使用测试号 / `touristappid`。
4. 基础库建议 3.x，编译预览。

静态校验：

```powershell
python tools/validate_miniprogram.py
```

注意：当前工程**未在微信开发者工具里实际编译过**，只做了 JS/JSON/WXML 静态校验；首次打开需要重点检查自定义导航栏、胶囊避让、底部安全区。

---

## 5. 当前视觉约束（必须遵守）

- 底色：`#F6F1EA`（宣纸）
- 卡片：`#FCFBF8`（暖白）
- 主墨：`#1F1D19`
- 次墨：`#5F5A52`
- 淡墨：`#8C857A`
- 朱砂：`#A34A3E`（只做印章/少量强调）
- 近现代蓝灰：`#A9BCC4` / `#7E9A9A`
- 唐代卡片：`#F3EFE6`
- 磁贴：`#EEF0F0` / `#F1E8DD` / `#F0F0F1` / `#FBF9F6`

字体：

- 标题、年份、人名：宋体（Songti SC / STSong / SimSun）
- 正文、按钮、标签：Noto Sans SC / PingFang SC
- 引文：楷体（KaiTi）

版式：

- 设计基准 390px → 小程序 750rpx；本工程用 1px ≈ 1.923rpx 换算
- 页面左右边距 46rpx
- 大卡圆角 38–42rpx，小卡 30–34rpx
- 轻阴影，禁止重投影
- 纤细线性图标
- 背景必须保留淡墨竖排书法/简牍暗纹
- 首页顶部只保留“史页”字标，不放搜索/菜单；朱砂印章保留在 Hero 插画内
- 近现代内容必须在首页可见（当前用“百年中国”入口）

---

## 6. 代码约定

- 原生小程序，不引入 Taro/uni-app。
- 页面结构：`pages/<name>/<name>.{js,json,wxml,wxss}`。
- 使用 `rpx`；1px 细线可用 `px`（或 1rpx）。
- 自定义导航栏：`navigationStyle: "custom"`；**四个主页面（首页/时间轴/发现/我的）顶部都只保留"史页"类字标，不放搜索/菜单图标**（2026-10-19 用户要求移除时间轴、发现页的搜索/菜单）。详情页顶栏为"‹ 返回 + 页面名 + 小印"。
- 当前没有配置原生 `tabBar`，底部四栏是自绘的，用 `wx.redirectTo` 在 4 个页面间跳转。**这是临时方案**，后续可以改为 `custom-tab-bar` 组件。
- 图片全部本地 PNG；小程序 `<image>` 使用绝对路径 `/assets/...`。
- 当前 hero 插画、盛唐背景 PNG/JPG 是按用户要求从参考图/新图裁切的；`paper-bg.png` 由 `tools/make_paper_bg.py` 生成；图标是透明 PNG。
- 参考图裁切素材仅用于本项目原型；正式上线前必须确认授权，或替换为有授权的素材。不要自行手绘/找图替代，除非用户明确要求。
- 真实数据在 `miniprogram/data/history.js`；新增内容必须带 `source` 字段，正式发布前需历史审校。
- 搜图素材（`assets/paintings/`）只用于原型：来源与授权状态见 `assets/paintings/SOURCES.md`，移除或更换某张图时要同步更新该表；复现链路 `tools/fetch_*.py`、`contact_sheet.py`。

---

## 7. 已知问题 / 风险

1. **未在微信开发者工具中编译验证**。WXML/JS/JSON 结构已通过静态检查，但真机样式、胶囊避让、安全区需要实际看。
2. **hero 插画、盛唐背景从用户参考图/新图裁切**，属于原型素材；正式上线前必须确认授权或替换。
3. **事件/人物详情已独立成页**（`pages/event/`、`pages/person/`，2026-10-19）；朝代与专题（盛唐气象/百年中国）仍是 Modal，可后续做成朝代/专题详情页。
4. **发现 / 我的已完成基础版（2026-10-19）**；收藏、浏览足迹仍为 Toast 占位。
5. **没有后端、搜索、独立详情页**；数据是本地 `data/history.js` 种子，尚未接 CMS。
6. `project.config.json` 使用 `touristappid`，正式开发需替换。
7. `paper-bg.png` 约 871KB，后续可压缩或改用更小的纹理。
8. 首页按要求去掉搜索/菜单后，2026-10-19 时间轴、发现页的搜索/菜单图标也已移除：四个主页面顶部均为纯字标；时间轴靠页内"古代/近现代"分段切换，无需菜单。
9. 首页“今日史事”目前是编辑精选（汉武帝），与 10 月 18 日的精确日期匹配尚未完成；正式内容要按日期库核对。
10. 旧版 `ui/neo/` 和 `docs/UI设计说明.md` 容易误用；除非用户明确要求，否则不要用旧版风格覆盖当前实现。

---

## 8. 下一步优先级

1. 在微信开发者工具中跑通首页与时间轴，修胶囊/安全区/字体回退。
2. ~~做独立的人物详情（苏轼 / 鲁迅）与事件详情（澶渊之盟 / 辛亥革命），替换当前 Modal。~~ ✅ 2026-10-19 已完成；其余事件按需补 `details`。3. 做搜索页，支持人物/事件/朝代/专题与古今结果并列。
4. 扩充 `data/history.js` 真实内容，补日期匹配、史料审校和更多近现代条目。
5. 接入后端 API / CMS；在此之前保持本地数据种子可替换。
6. 做分享卡片与收藏。

---

## 9. 每次开发后必须更新

- `docs/DEVELOPMENT_LOG.md`：日期、改了什么、为什么、验证结果、遗留问题、下一步。
- 如果架构/视觉规范发生变化，同步更新本文件。
- 保持网页预览与小程序的视觉同步；如果改了颜色/字体/卡片，两个地方都要改。
- 不要删除 `ui/reference/assets/` 里的参考图裁切、`paper-bg.png` 和 `tools/make_paper_bg.py`；它们是目前视觉复现的依据。

---

## 10. 给下一次模型的一句话

> 先看 `docs/DEVELOPMENT_LOG.md`，再改代码；当前视觉是“参考图风格”，不是 `ui/neo/` 的极简新中式。改完记得写日志。
