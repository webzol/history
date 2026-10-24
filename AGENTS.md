# 史页 · 开发交接说明（先读我）

**最后更新：2026-10-23（Asia/Shanghai）**

## 0. 一句话

「史页」是一个中国历史微信小程序，覆盖古代史与近现代史。当前视觉方向以用户上传的参考图为准：**浅米宣纸 + 淡墨书法暗纹 + 大圆角白卡 + 手绘建筑插画 + 浅色功能磁贴 + 朱砂小印章 + 底部四栏**。

当前已有：

- 高保真网页首页：`ui/reference/home-v3.html`
- 原生小程序（13 页全部落地）：首页 / 时间轴 / 发现 / 我的 + 人物、事件、**朝代**详情页 + 搜索页 + 收藏、足迹独立页 + **资料库首页/列表/详情**；数据=本地真实历史种子 `miniprogram/data/history.js`（100 史事 / 72 人物 / 24 朝代 / 2 专题 + 今日史事日期库 16 组），并叠加 **jsDelivr 远端热更**：`utils/historyData.js` 数据中枢统一供数，远端 JSON（`data/history.json`，由 `tools/build_data_json.js` 生成——**改数据后必须重建并提交**）；「我的」页「检查内容更新」可 purge jsDelivr 缓存即时生效（`purge.jsdelivr.net` 需白名单）。首页「历史上的今天」板块走 **60s API**（`utils/api.js`，天级缓存 6h，失败自动隐藏板块）。在线域名白名单：`cdn.jsdelivr.net`、`purge.jsdelivr.net`、`60s.viki.moe`。
- 「史页资料库」：APK 数据 39,067 条（辞条 13,287 / 人物 4,869 / 事件 705 / 帝王 373 / 战争 466 / 三国纪事 29 / 名句 677 / 文言辞条 3,889 / 诗文名句 3,955 / 诗文全文 10,817），入口在发现页；数据放 `miniprogram/data/apk/`，由 `project.config.json` 的 `packOptions.ignore` 排除出主包，`utils/apkData.js` 通过 jsDelivr 按需加载（内存 + 7 天本地缓存；单文件 ≤1.5MB，资料库总预算 5MB，超预算先淘汰旧分卷）。**首屏提速（2026-10-24）**：每个栏目索引拆成 `head.json`（`{total, step:200, parts, items}`，前 200 条，~15–30KB，列表页首屏只拉这一份）+ `part-N.json`（剩余条目每 200 条一块，首屏渲染后后台 **4 并发限流**补齐并合并写回 index.json 缓存；请求失败/403 自动重试一次——jsDelivr 对突发请求会 403 限流）；`index.json` 保留作拆分输入与旧版回退。本地缓存 key 为 `shige_apk_v3_*`（分块布局变更时须升版本号整体失效）。全部栏目统一为「列表索引 + 详情分卷」：索引固定列 `[id,title,meta,summary,shard]`（摘要 44 字），`00.json`… 为详情分卷（非诗文 ≤180 条 / ≤320KB，诗文 ≤120 条 / ≤320KB）；列表只加载索引，详情按 `shard` 只加载一册。拆分工具 `tools/split_apk_index.js`（幂等，改索引数据后重跑）。原始 APK/DB 在 `import/`，不提交。
- 收藏 / 浏览足迹已落地（本地存储，utils/store.js，收藏行支持长按移出）；「我的」页各只展示前 3 条，>3 条时「查看全部」进独立分类页，独立页支持清空；分享已接入各页。
- 质量链路：`node tools/selftest.js`（1600 断言交互自测）+ `ui/preview/` 浏览器渲染 harness（28 张标准截图核对）+ `python tools/validate_miniprogram.py` 静态校验。
- 尚无后端。

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
| 时间轴 | 已接入真实数据，按 2026-10-19 上传参考图重构 | `miniprogram/pages/timeline/` | 宣纸统一底（无线框）；顶部字标 + 首页同款印章图（assets/seal.png）；红/青圆点竖线轴；事件纪年挂轴排列，点击进事件详情页；无大时代印、无水墨人物图（用户已取消） |
| 搜索 | 已实现（入口在「我的」页首行） | `miniprogram/pages/search/` | 热门检索标签 + 三组结果（人物/史事/朝代与专题）；近现代蓝灰副标题；点击进对应详情页或时间轴 |
| 收藏 | 已实现 | `miniprogram/pages/favorites/` | 按人物 / 史事分组、组内条数；点击进详情；右上「清空」原生确认后清空存储；数据来自 `utils/entries.js` |
| 足迹 | 已实现 | `miniprogram/pages/footprints/` | 同收藏页，额外显示浏览时间「10月22日 16:41」；清空后空态提示 |
| 人物详情 | 已实现 | `miniprogram/pages/person/` | 大字人名 + 时代配画底纹头卡、楷体引文、正文段落、相关史事列表（配画缩略图，跳事件详情）；支持古代/近现代双色调 |
| 事件详情 | 已实现 | `miniprogram/pages/event/` | 头卡右侧装裱画片（按 era 取画，200rpx 白边小画）、大字年份、双色调色条、正文段落、"其时其人"人物卡（时代细部缩略图 + 姓名，跳人物详情）、收藏按钮、回时间轴按钮 |
| 朝代详情 | 已实现 | `miniprogram/pages/period/` | 配画头卡、时代脉络段、收录史事列表（纪年升序）；home 磁贴/发现页朝代卡均跳此页；24 个朝代均有 PERIOD_META，西晋/秦/南宋等可直接查看 |
| 发现 | 已实现（占位说明保留在页尾） | `miniprogram/pages/discover/` | 精选 6 张朝代配画卡（西汉/唐/北宋/明/清/近现代）；顶部「史页资料库」入口（39,067 条）；其余 18 个朝代从首页「朝代」弹层/搜索进入，避免发现页被同质配图淹没；专题长卷、精选史事列表 |
| 资料库首页 | 已实现 | `miniprogram/pages/archive/` | 资料总量 + 5 个默认收起的分类组（典籍辞条 / 人物 / 事件 / 文献 / 诗文），每组带本地分类题图，点击展开 9+2+3+2+6 个入口；数据来自 `data/archive-meta.js` |
| 资料库列表 | 已实现 | `miniprogram/pages/archive-list/` | 分类题图横幅 + 搜索 + 60 条分页；只拉 `index.json`（标题/分类/摘要），点条目带 `shard` 进详情；数据走 `utils/apkData.js` |
| 资料详情 | 已实现 | `miniprogram/pages/archive-detail/` | 按 `shard` 只拉一册详情；分类题图 / 标题 / 结构化正文分段（原文 / 注释 / 译文 / 赏析） / 资料卡键值网格 / 分享；不引用 APK 外部图片，不逐条配图 |
| 我的 | 已实现 | `miniprogram/pages/profile/` | 随机身份头像 + 历史字号昵称（`utils/identity.js`，可「换一位史客」）、装裱画片横幅、收藏/足迹配图缩略图（各只展示前 3 条 + 查看全部入口）、阅读字号设置、本地数据统计、数据/素材/关于说明、清除缓存 |

网页预览：

- `ui/reference/home-v3.html`：当前首页，390×844 基准
- `ui/reference/home-final.png`：当前首页截图（780×1688，2x）

---

## 3. 目录结构

```text
E:\AI\history\
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
│  ├─ data\history.js               # 本地真实历史数据种子（合并 history-extra.js）
│  ├─ data\history-extra.js         # 历代扩展内容（与 history.js 合并；当前合计 24 朝代/100 史事/72 人物）
│  ├─ data\archive-meta.js          # 资料库统计/分类/入口元数据（由导入脚本生成）
│  ├─ data\apk\                     # 39,067 条资料的列表索引 + 详情分卷（主包排除，jsDelivr 远端加载）
│  ├─ utils\store.js                # 收藏 / 浏览足迹 / 阅读字号（本地存储）
│  ├─ utils\font.js                 # 阅读字号选项、根节点类名、页面同步
│  ├─ utils\entries.js              # 收藏/足迹条目解析、时间格式、分组与展平
│  ├─ utils\historyData.js          # 数据中枢（本地种子 + jsDelivr 热更）
│  ├─ utils\apkData.js              # 资料库按需加载 / 缓存 / 详情查找
│  ├─ utils\archiveImages.js        # 资料库分类题图映射（人物/事件/文献/诗文）
│  ├─ assets\                        # 参考图裁切插画、宣纸背景、paintings 搜图素材(SOURCES.md)、图标 PNG
│  └─ pages\home|timeline|discover|profile|person|event|period|search|favorites|footprints|archive|archive-list|archive-detail
├─ tools\
│  ├─ selftest.js                   # 交互自测（node tools/selftest.js；PASS 1600 / FAIL 0）
│  ├─ build_preview.js              # 小程序源码 → ui/preview/_bundle.js
│  ├─ preview_server.js             # 静态服务（http://127.0.0.1:8137）
│  ├─ preview_shots.js              # 批量截图 28 张 → ui/preview/shots/
│  ├─ import_apk_data.py            # APK SQLCipher/明文 SQLite → data/apk/<栏目>/{index,分卷}.json
│  ├─ validate_miniprogram.py       # JS/JSON/WXML/资源静态校验
│  ├─ content_audit.py              # 数据完整性审计（缺 details/source 等）
│  ├─ compress_assets.py / make_paper_bg.py / crop_seal.py 等   # 素材复现链路
└─ ui\
   ├─ preview\                      # 浏览器预览 harness（index.html + harness.js + _bundle.js + shots/）
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
E:\AI\history\ui\reference\home-v3.html
```

重新截图（Windows + Chrome）：

```powershell
& 'C:\Program Files\Google\Chrome\Application\chrome.exe' `
  --headless=new --disable-gpu --no-sandbox --hide-scrollbars `
  --force-device-scale-factor=2 --window-size=390,844 `
  --virtual-time-budget=2500 `
  --screenshot='E:\AI\history\ui\reference\home-final.png' `
  'file:///E:/hish/ui/reference/home-v3.html'
```

### 微信小程序

1. 打开微信开发者工具。
2. 导入 `E:\AI\history\miniprogram`。
3. AppID 已配置为 `wxe61b785946958cc7`（正式发布前确认归属）。
4. 基础库建议 3.x，编译预览。

### 自测工具（2026-10-19 起可用）

```powershell
# 交互自测（mock wx/Page 跑真实页面代码；PASS 1600 / FAIL 0）
node tools/selftest.js

# 浏览器 UI 预览：起服务 → 打开 http://127.0.0.1:8137/ui/preview/index.html#home
node tools/preview_server.js

# 小程序源码改动后需重建 bundle，再批量截图核对 ui/preview/shots/（28 张）
node tools/build_preview.js
node tools/preview_shots.js
```

注意：harness 场景支持 `?s=click:选择器|input:选择器,值|scroll:像素|mark:标签`（mark 结果打红条，scroll 用于核对长页下半屏），另可用 `?fav=person:su-shi,event:xinhai-1911&foot=...` 预置收藏/足迹截图，调试交互态不用手点。

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

阅读字号：

- 四档：小 `s`（--fs 0.9）/ 标准 `m`（1）/ 大 `l`（1.14）/ 特大 `xl`（1.28），默认标准；设置存 `shige_font_key`。
- 13 个页面根节点统一 `class="page fs-{{fontClass}}"`，页面 `onLoad/onShow` 调 `utils/font.js` 的 `apply(this)` 重读设置。
- 页面 WXSS 的字号/定值行高一律写 `calc(Nrpx * var(--fs, 1))`；**不要在页面里写死 `font-size: Nrpx`**，否则该元素不随设置缩放。图标/箭头/引号/印章等符号保持固定尺寸。
- 新增页面必须同时挂根类名与 `font.apply`，否则用户改字号后该页不生效。

版式：

- 设计基准 390px → 小程序 750rpx；本工程用 1px ≈ 1.923rpx 换算
- 页面左右边距 46rpx
- 大卡圆角 38–42rpx，小卡 30–34rpx
- 轻阴影，禁止重投影
- 纤细线性图标
- 背景必须保留淡墨竖排书法/简牍暗纹
- 印章一律用 `assets/seal.png`（首页 hero 裁切的"史载"印图片，`tools/crop_seal.py` 可复现）；不要用 CSS/文字手绘印章
- 首页顶部只保留“史页”字标，不放搜索/菜单；朱砂印章保留在 Hero 插画内
- 近现代内容必须在首页可见（当前用“百年中国”入口）
- 事件详情头卡右侧是装裱画片（200rpx 白边小画），不再用全宽横幅；「其时其人」缩略图取 `assets/thumbs/<时代>-1..4.jpg`（由 `assets/paintings/` 原画裁 4 个细部），按行序轮换避免整列重复；有专属绘画的时代不再回退（2026-10-23 补全 15 张：shanggu/xia/shang/zhou/chunqiu/zhanguo/qin/sanguo/xijin/sui/wudai/yuan/liao/xixia/jin，其余未知朝代仍回退 `assets/palace.jpg`）。人物页头卡用时代画作 46% 透明度垫底 + 暖白渐隐；民国/近现代统一用《千里江山图》作山河底色（不误配 1949 开国大典），新中国用《开国大典》。映射统一走 `utils/eraImages.js`（`eraImage` / `personThumb`），不要在页面里另写一份。
- **人物/事件专属图（2026-10-23 全量覆盖）**：全部 72 人物 + 100 事件均有专属配图。取图优先级：本地专属（`assets/personart|eventart/`，10 张）> 远端专属（`data/img/persons|events/<id>.jpg`，162 张，`packOptions.ignore` 排除出主包，经 jsDelivr 提供）> 朝代级回退。**图片域名（2026-10-24 起）必须是 `https://gcore.jsdelivr.net/gh/webzol/history@main/miniprogram/data/img/...`**——`cdn.jsdelivr.net` 已改为对图片二进制一律 301 跳 `raw.githubusercontent.com`（国内不可达、也不在白名单），只有 JS/JSON 文本仍直出，所以资料库/热更 JSON 留在 cdn 域名不动。远端图加载失败走 `eraImages.altArt` 二级域名 `testingcf.jsdelivr.net` 重试一次（person/event/favorites/footprints/profile 五页 `<image binderror>` 已接）。可用 id 清单在 `utils/artRemote.js`（`tools/add_all_art.py` 生成，勿手改）。人物页相关史事行图、收藏/足迹行图也走专属图（`eventImage` / `personImageThumb`）；行图为人物时**整幅画优先**（personart > data/img/persons > 细部裁切 > 朝代细部），细部可能不含人只作兜底；行图槽位一律 `aspectFit` 完整显示。注意：`<image>` 组件不受域名白名单限制，但若改用 `wx.downloadFile` 拉图需把 `gcore.jsdelivr.net` 加入 downloadFile 合法域名（request 白名单为 `cdn.jsdelivr.net`/`purge.jsdelivr.net`/`60s.viki.moe`）；图片更新走 git push（jsDelivr 有缓存，必要时 purge）。
- 资料库**分类**题图统一走 `utils/archiveImages.js`：首页 5 组用小方图，列表页用 168rpx 横幅，详情页头卡用 160rpx 横幅；人物/帝王取唐画，事件/战争取明画，名句/文言取宋画，诗文取青绿山水，典籍辞条按 9 类取图，未知栏目回退 `palace.jpg`。
- 资料库**条目**配图（2026-10-24，用户要求覆盖旧「不要逐条配图」约定）：仅 figures/emperors/events/wars 四类，详情页头卡右侧 164rpx 装裱画片，取图走 `utils/archiveArt.js`——主站人物/事件专属图标题匹配（`archiveArtMatch.js`，`tools/match_archive_art.js` 生成，131 条命中）> 资料库自抓图（`archiveArtRemote.js` 清单，`tools/add_archive_art.py` 抓取，`data/img/archive/<栏目>/<id>.jpg` 360×360 q55，jsDelivr 提供）> 无图（只保留分类题图）。加载失败用 `eraImages.altArt` 换备用域名重试一次，仍失败隐藏画片。自抓图授权未审校（见 paintings/SOURCES.md）。
- 「我的」页走**随机身份**（`utils/identity.js`）：头像为手绘史官参数化变体 20 张（`assets/avatars/avatar-01..20.jpg`，幞头/东坡巾/乌纱帽/纶巾 × 朝代袍色 × 胡须，`tools/gen_avatars.py` 可复现），昵称为字号式随机组名（听松居士/锄月山人…，20 前字 × 10 号尾）+ 座右铭词库；身份存 `shige_identity`，点头像或「换一位史客」重掷。原 `assets/avatar-scholar.png` 保留作默认兜底（矢量稿 `tools/avatar-scholar.svg`，不依赖外部素材）；横幅为装裱画片（画心 + 底部题签），收藏/足迹行用时代缩略图代替「人/事」色块；页内印章一律 `<image src="/assets/seal.png">`。

---

## 6. 代码约定

- 原生小程序，不引入 Taro/uni-app。
- 页面结构：`pages/<name>/<name>.{js,json,wxml,wxss}`。
- 使用 `rpx`；1px 细线可用 `px`（或 1rpx）。
- 自定义导航栏：`navigationStyle: "custom"`；**四个主页面（首页/时间轴/发现/我的）顶部都只保留"史页"类字标，不放搜索/菜单图标**（2026-10-19 用户要求移除时间轴、发现页的搜索/菜单）。详情/列表页顶栏为「返回胶囊 + 短页面名 + 小印」；页面名只写「人物 / 事件 / 朝代 / 搜索 / 收藏 / 足迹 / 资料库」，不再带「史页 · 」前缀，避免和右侧小印挤字。返回胶囊改为 `156×56rpx`（约 2.79:1）的窄纸捻胶囊：暖纸渐变 + 赭金细边 + 内高光，左侧纯 CSS 笔锋箭头（`back-icon` + `back-chevron` + `back-shaft`），中间 1rpx 细分隔线，右侧楷体「返回」；按下 `back-pressed` 轻微缩放。**不再使用 `assets/back-arrow.png` / `mode="widthFix"`**，避免位图比例导致拉伸；箭头与文字用 flex 排布，不依赖绝对定位。小印 `right: 200rpx` 绝对定位，避让微信原生胶囊；标题 `left: 54%`，九页统一（person/event/period/search/favorites/footprints/archive/archive-list/archive-detail）。**例外：事件页（2026-10-23）标题真正居中、右侧紧跟 `assets/seal.png` 小印（`.top-center` 组合），不再用 CSS 字印。**`app.wxss` 在 `max-width: 360px` 下隐藏 `.page .top-seal`，并把 `.page .top-title` 略移到 `left: 56%`，避免小屏上标题、小印和胶囊三者互撞。预览 harness 已按 `mode` 实现 `object-fit`，截图不会再误判变形。
- 底部导航：`app.json` 已启用 `tabBar.custom = true` + `custom-tab-bar/` 组件（2026-10-20）；tab 页间用 `wx.switchTab`，页面常驻（onShow 维持数据新鲜）；跨 tab 的 timeline 分段用 `utils/store.js` 的 pending mode 交接（`?mode=` 在 switchTab 下不可用）。
- **未经微信开发者工具真机编译**：custom-tab-bar 的安全区 env() 与组件生命周期需真机确认，首次打开开发者工具时优先核对底部栏。
- 图片全部本地 PNG/JPG；小程序 `<image>` 使用绝对路径 `/assets/...`；宣纸底为 `assets/paper-bg.jpg`（**不要再用 paper-bg.png，已删除**）。
- 当前 hero 插画、盛唐背景 PNG/JPG 是按用户要求从参考图/新图裁切的；`paper-bg.png` 由 `tools/make_paper_bg.py` 生成；图标是透明 PNG。
- 参考图裁切素材仅用于本项目原型；正式上线前必须确认授权，或替换为有授权的素材。不要自行手绘/找图替代，除非用户明确要求。
- 真实数据在 `miniprogram/data/history.js`；新增内容必须带 `source` 字段，正式发布前需历史审校。
- 搜图素材（`assets/paintings/`）只用于原型：来源与授权状态见 `assets/paintings/SOURCES.md`，移除或更换某张图时要同步更新该表；复现链路 `tools/fetch_*.py`、`contact_sheet.py`。

---

## 7. 已知问题 / 风险

1. **未在微信开发者工具中编译验证**。WXML/JS/JSON 结构已通过静态检查（13 页），但真机样式、胶囊避让、安全区需要实际看；资料库还需实测索引首屏、详情分卷切换、jsDelivr 缓存命中与 5MB 本地缓存预算。
2. **hero 插画、盛唐背景从用户参考图/新图裁切**，属于原型素材；正式上线前必须确认授权或替换。
3. ~~事件/人物详情独立成页；朝代 Modal~~ → 2026-10-19 晚：朝代详情页 `pages/period/` 已落地，全站仅剩专题（盛唐气象/百年中国）走时间轴，无 Modal 残留。
4. ~~收藏、浏览足迹占位~~ → 2026-10-19 晚：已落地（`utils/store.js` 本地存储；详情页收藏按钮、「我的」页列表、清缓存联动）。
5. 搜索已完成（2026-10-19 下午，入口在「我的」页）；全部 12 条事件已补 details 正文；数据仍在本地 `data/history.js` 种子，后端/CMS 尚未启动。
6. `project.config.json` 已配置 AppID `wxe61b785946958cc7`；正式发布前确认归属与权限。
7. ~~paper-bg.png 约 871KB~~ → 已解决：全部图片转优化 JPG（paper-bg.jpg 25KB 等），包体 550KB；`tools/compress_assets.py` 可复现。
8. 四个主页面顶部均为纯字标；时间轴靠页内"古代/近现代"分段切换，无需菜单。
9. ~~首页"今日史事"日期匹配未完成~~ → 2026-10-19 晚：已按公历「月-日」日期库匹配（8 组），无匹配日回退编辑精选；农历事件暂未列入，正式发布前仍需历史审校。
10. 旧版 `ui/neo/` 和 `docs/UI设计说明.md` 容易误用；除非用户明确要求，否则不要用旧版风格覆盖当前实现。
11. 资料库数据来自 APK 迁移，尚未逐条史实/授权审校；诗文全文已按体裁/分卷纳入（诗 2,938 / 词 4,523 / 文 2,991 / 曲 338 / 赋 27）。列表搜索只覆盖轻量索引字段（标题/分类/摘要；诗词为篇名/作者/朝代/摘要），不做全文检索；详情正文只在打开条目时按 `shard` 拉取。
12. 资料库条目暂未接入收藏/足迹；接入前需扩展 `utils/entries.js` 与「我的」页分组，避免破坏现有收藏解析。

---

## 8. 下一步优先级

1. 在微信开发者工具中跑通首页、时间轴与资料库，修胶囊/安全区/字体回退，实测 jsDelivr 首屏加载与缓存占用。
2. ~~做独立的人物详情（苏轼 / 鲁迅）与事件详情（澶渊之盟 / 辛亥革命），替换当前 Modal。~~ ✅ 2026-10-19 已完成。
3. ~~做搜索页~~ ✅ 2026-10-19 下午已完成（入口：我的页首行）；下轮可补人物条目（赵匡胤/王安石/林则徐等）让搜索结果更完整。~~ → ✅ 2026-10-19 晚已补 3 位。
4. 内容扩展已完成第二轮（24 朝代 / 100 史事 / 72 人物），夏、商、西周、西晋、五代十国、辽、西夏、金均已有代表人物；下一步做史料审校、补近现代人物与专题（目标约 120 人物 / 400 史事 / 12 专题）。
5. 接入后端 API / CMS；在此之前保持本地数据种子可替换。
6. 做分享卡片与收藏。~~ → ✅ 2026-10-19 晚：收藏/足迹/分享已落地。
7. 资料库：真机验证索引首屏、详情分卷切换、缓存命中与返回胶囊；决定是否接入收藏/足迹；全文检索如需要，另建轻量全文索引或后端搜索。

---

## 9. Git 工作流（每次必须）

- **开发开始前**：先 `git pull origin main`（若代理 127.0.0.1:7897 未开会连接失败，先开代理；远端可能有其他会话的更新，拉取后先读日志再动手）。
- **开发结束后**：`git add -A` → commit（信息说明改了什么与验证结果）→ `git push origin main`，保证与 GitHub 同步。
- 若 pull 后日志/代码与本地认知不一致，以远端为准调整计划，不要覆盖其他人/会话已完成的工作。

---

## 10. 每次开发后必须更新

- `docs/DEVELOPMENT_LOG.md`：日期、改了什么、为什么、验证结果、遗留问题、下一步。
- **如果改了 `data/history.js`：必须 `node tools/build_data_json.js` 重建 `data/history.json` 并一并提交**（否则线上 jsDelivr 数据不更新）。
- 如果架构/视觉规范发生变化，同步更新本文件。
- 保持网页预览与小程序的视觉同步；如果改了颜色/字体/卡片，两个地方都要改。
- 不要删除 `ui/reference/assets/` 里的参考图裁切、`paper-bg.png` 和 `tools/make_paper_bg.py`；它们是目前视觉复现的依据。

---

## 11. 给下一次模型的一句话

**日期**：每次动手前先 `git pull`，收工前 commit + push（见 §9）。

> 先看 `docs/DEVELOPMENT_LOG.md`，再改代码；当前视觉是“参考图风格”，不是 `ui/neo/` 的极简新中式。改完记得写日志。
