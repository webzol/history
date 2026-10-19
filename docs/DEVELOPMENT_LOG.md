# 史页 · 开发日志 / 交接记录

> 每次开发后在这里追加一条记录：日期、目标、改动、验证、遗留问题、下一步。
> 下一次模型请先读 `AGENTS.md`，再读本文件。

---

## 2026-10-18 · 阶段 0：产品大纲

**目标**：确认产品范围、内容结构、技术路线。

**产出**

- `docs/历史小程序开发大纲.md`
- 确定：中国史为主，史前至 2024；古代史 + 近现代史；时间轴、人物、事件、朝代、世纪、专题、搜索。
- 内容策略：完整框架 + 分级词条 + 持续扩充；不追求首版“全量”。
- 技术建议：原生小程序 + TypeScript，NestJS + PostgreSQL（后续），Vue3 内容后台。

**状态**：大纲已完成，待用户确认细节。

---

## 2026-10-18 · 阶段 1：第一版 UI 概念（纸墨东方）

**目标**：给用户看第一版视觉方向。

**产出**

- `ui/board.html`、`ui/board-2.html`
- 7 个页面：首页、时间轴、人物、事件、朝代、世纪、搜索。
- 视觉：纸白、墨黑、朱砂、宋体标题、细线图标。

**结果**：用户提出“现代新中式国风 + 浅米宣纸 + 简牍暗纹 + 大圆角白卡 + 柔和轻阴影 + 赭石青黛 + 朱砂小印章”。

---

## 2026-10-18 · 阶段 2：neo 新中式（10 页）

**目标**：按“现代新中式”重做，并把近现代史加进去。

**产出**

- `ui/neo/board-1.html`、`board-2.html`、`board-3.html`
- 10 个页面：首页、古代时间轴、苏轼、澶渊之盟、北宋、11 世纪、搜索、近现代时间轴、辛亥革命、鲁迅。
- 设计：浅米纸、大圆角白卡、赭石=古代、青黛=近现代、朱砂印章、大量留白。
- 设计说明：`docs/UI设计说明.md`（现归档）。

**结果**：用户上传了一张新的参考图，要求按参考图风格开发。

---

## 2026-10-18 · 阶段 3：参考图风格（当前）

**用户参考图特征**

- 浅米宣纸底，右侧/边缘有极淡的竖排书法暗纹
- 大号黑色宋体字标“史页”，右上角搜索 + 菜单
- “今日史事”大圆角白卡，带手绘宫殿/山水插画 + 朱砂“史载”印章
- 四枚浅色功能磁贴：时间轴、朝代、人物、事件
- “沿着时间走”横向卡片：盛唐气象 + 建筑插画
- 底部四栏：首页 / 时间轴 / 发现 / 我的；首页为实心黑色图标
- 整体：留白多、低对比、轻阴影、细腻线稿

**已落地**

- 网页首页：`ui/reference/home-v3.html`
- 网页截图：`ui/reference/home-final.png`
- 早期原创 SVG（阶段 4 已改为参考图裁切，仅归档）：`ui/reference/assets/palace-v2.svg`、`pavilion.svg`
- 宣纸背景：`ui/reference/assets/paper-bg.png`
- 小程序工程：`miniprogram/`

**当前小程序页面**

| 页面 | 状态 |
|---|---|
| 首页 | 已实现：背景、今日史事、四磁贴、盛唐气象、百年中国入口、底部四栏 |
| 时间轴 | 基础版：北宋 4 个事件的卡片列表；“近现代”点击为 Toast |
| 发现 | 占位空态 |
| 我的 | 占位空态 |

**关键文件**

```text
miniprogram/pages/home/home.{js,json,wxml,wxss}
miniprogram/pages/timeline/timeline.{js,json,wxml,wxss}
miniprogram/pages/discover/discover.{js,json,wxml,wxss}
miniprogram/pages/profile/profile.{js,json,wxml,wxss}
miniprogram/assets/paper-bg.png
miniprogram/assets/palace.png
miniprogram/assets/pavilion.png
miniprogram/assets/icons/*.png
miniprogram/data/history.js
```

**验证**

- JS 语法检查：通过（`node --check`）。
- JSON 解析：通过。
- app.json 页面四件套：全部存在。
- WXML 标签闭合：静态检查通过。
- 所有本地 `src="/assets/..."` 引用：全部存在。

**未验证**

- 未在微信开发者工具中实际编译。
- 未在真机检查胶囊避让、安全区、字体回退。
- 阶段 4 已用参考图裁切替换简化线稿；但仍未在微信开发者工具中验证最终效果。

**已知问题**

1. 自定义导航栏的顶部搜索/菜单使用 `margin-right: 180rpx` 避让胶囊，需真机确认。
2. 自绘底部四栏用 `wx.redirectTo` 跳转，不是原生 tabBar；后续可改 `custom-tab-bar`。
3. 时间轴“近现代”仍是 Toast。
4. 发现 / 我的为占位。
5. 无真实数据/后端/搜索/详情页。
6. `touristappid` 仅用于开发；正式上线需替换。
7. `paper-bg.png` 约 871KB，后续可压缩。
8. 当前 hero/pavilion PNG 从参考图裁切：`palace.png` 背景 `#FCFAFB`，`pavilion.png` 背景 `#F3EFE6`；改卡片底色时要重新裁切/导出。参考图素材仅用于原型。

---

## 2026-10-18 · 交接文档与静态校验

**目标**：按用户要求补开发记录，方便下一次模型继续。

**新增**

- `AGENTS.md`：项目交接说明、阅读顺序、当前状态、约束、风险、下一步。
- `docs/DEVELOPMENT_LOG.md`：本文件。
- `docs/UI_REFERENCE_STYLE.md`：当前参考图风格的视觉规范。
- `miniprogram/README.md`：小程序导入与运行说明。
- `tools/make_paper_bg.py`：宣纸背景的可复现生成脚本。
- `ui/reference/home-final.png`：当前首页最终截图。
- 旧版 `docs/UI设计说明.md` 顶部加归档说明，指向当前规范。

**校验**

- `node --check`：5 个 JS 文件全部通过。
- JSON：`app.json`、`project.config.json`、`sitemap.json`、4 个页面 JSON 全部通过。
- `app.json` 的 4 个页面四件套：全部存在。
- 4 个 WXML 标签闭合：静态检查通过。
- 所有本地 `src="/assets/..."` 引用：全部存在。
- 未在微信开发者工具中编译，未真机验证。

**清理**

- 删除中间截图、旧版首页 HTML、临时校验脚本；保留 `ui/reference/home-v3.html`、`home-final.png`、源 SVG、图标表与资源包装 HTML。
- `ui/neo/` 保留为上一版归档，不删除。

---

## 2026-10-18 · 阶段 4：1:1 还原 + 真实数据

**用户指令**

- UI 按上传参考图 1:1 还原。
- 不要画图/找图替代。
- 需要真实数据。

**视觉改动**

- 从用户提供的参考图中裁切 hero 宫殿插画（含“史载”印章）与“盛唐气象”楼阁插画，替换之前的 SVG 手绘稿。
- 移除手绘轮船，近现代入口改为 CSS 蓝灰竖条，不再画图/找图。
- 首页 hero 卡片背景改为 `#FCFAFB`，匹配裁切图底色；盛唐卡片背景改为 `#F3EFE6`，匹配楼阁裁切图。
- 页面布局、字体、留白、四磁贴、底部四栏继续对齐参考图。

**真实数据**

- 新增 `miniprogram/data/history.js`：
  - 4 个时代/时期：西汉、唐、北宋、近现代。
  - 12 个事件：汉武帝即位、陈桥兵变、澶渊之盟、王安石变法、靖康之变、鸦片战争、辛亥革命、五四运动、九一八、新中国成立、十一届三中全会、圆明园罹劫。
  - 3 位人物：汉武帝、苏轼、鲁迅。
  - 2 个专题：盛唐气象、百年中国。
  - 1 条今日史事：汉武帝即位（编辑精选）。
- 首页改为数据驱动：hero、盛唐卡、百年中国入口来自 `history.js`。
- 首页四磁贴：时间轴跳转；朝代/人物/事件打开真实数据的 ActionSheet + Modal。
- 时间轴：古代/近现代切换已接入真实事件；事件点击用 Modal 展示年份、简介、史料。
- 所有数据条目带 `source` 字段，但尚未完成逐条历史审校。

**校验**

- 6 个 JS 文件 `node --check` 通过（含 `data/history.js`）。
- JSON、页面四件套、本地资源引用全部通过。
- 未在微信开发者工具中编译；胶囊/安全区/字体仍需真机检查。

**注意**

- 参考图裁切素材只用于本项目原型，**上线前必须确认授权或替换**。
- 首页“今日史事”目前是编辑精选（汉武帝），与 10 月 18 日的精确日期匹配尚未完成；正式内容要按日期库核对。
- 事件/人物详情目前是 Modal，还不是独立页面。

---

## 2026-10-18 · 首页细节修正

**用户要求**

- 去掉首页右上角搜索/三条杠菜单。
- “百年中国”区域的 UI 要和上方卡片保持一致。

**改动**

- 首页顶部只保留“史页”字标；删除搜索/菜单图标、样式和事件处理。
- “百年中国”从浅蓝条改成与“盛唐气象”同规格的白色大圆角卡片：相同圆角、轻阴影、宋体标题层级。
- 卡片右侧保留 1840/1949 蓝灰年份和朱砂“近”小印，保持近现代识别色。
- 调整首页间距和 hero/era 卡片高度，让“百年中国”卡片完整落在底部四栏上方，不被遮挡。
- 同步修改 `ui/reference/home-v3.html` 与 `miniprogram/pages/home/`；重新导出 `home-final.png`。

**校验**

- `node --check` 全部通过；JSON、页面四件套、本地资源引用通过。
- 新增 `tools/validate_miniprogram.py`，当前输出：`OK: 4 pages, JSON/assets/WXML checks passed.`
- 仍未在微信开发者工具中实际编译。

---

## 2026-10-18 · 首页比例与盛唐卡修正

**用户反馈**

- “今日史事”内容区太高，需要再低一些。
- “盛唐气象”要按上传参考图继续高度还原。

**改动**

- Hero 卡高度从 242px 降到 214px，标题/正文/插画整体收紧。
- “盛唐气象”改成参考图的横卡比例：高度 112px，楼阁插画缩小到 120px，朱砂“唐”印不再压住屋顶。
- 新增参考图右侧蓝灰卷轴裁切 `scroll-accent.png`，放在盛唐卡右侧，恢复参考图的横向构图。
- 同步调整小程序 rpx 尺寸：hero 412rpx、era row 216rpx、楼阁 230rpx、卷轴 56rpx。
- 保持“百年中国”白卡与上方统一，并完整落在底部四栏上方。

**校验**

- `python tools/validate_miniprogram.py` 通过。
- 仍未在微信开发者工具中实际编译。

---

## 2026-10-18 · 盛唐气象整卡背景更换

**用户要求**

- 用新上传的盛唐楼阁图替换“盛唐气象”背景。
- 按小程序卡片比例裁剪。

**改动**

- 从新上传图裁切 `2048×756`（约 2.71:1），与盛唐卡比例一致。
- 保存为 `tang-bg.jpg`（质量 90，约 285KB），同时用于网页和小程序。
- “盛唐气象”改为整卡背景图：文字在左，楼阁在右；左侧加一层极淡纸色渐变保证标题/说明可读。
- 保留右侧蓝灰卷轴裁切装饰和朱砂“唐”小印。
- 小程序用 `<image class="era-bg" mode="aspectFill">` 实现，避免 WXSS 本地背景图限制。

**校验**

- `python tools/validate_miniprogram.py` 通过。
- 仍未在微信开发者工具中实际编译。

---

## 2026-10-18 · 去掉盛唐右上角“唐”印

**用户要求**

- “盛唐气象”不需要右上角的印章。

**改动**

- 移除网页与小程序盛唐卡右上角的“唐”印章及对应 `mini-seal` 样式。
- 保留 Hero 插画内的“史载”印与“百年中国”的“近”印。
- 重新导出 `home-final.png`。

**校验**

- `python tools/validate_miniprogram.py` 通过。
- 尚未在微信开发者工具中实际编译。

---

## 2026-10-18 · 去掉百年中国“近”印

**用户要求**

- 底部现代史“百年中国”也不要印章。

**改动**

- 移除网页与小程序“百年中国”卡右上角的“近”印章及对应样式。
- 仅保留 Hero 插画内原有的“史载”印；盛唐卡、百年中国卡均无印章。
- 重新导出 `home-final.png`。

**校验**

- `python tools/validate_miniprogram.py` 通过。
- 尚未在微信开发者工具中实际编译。

---

## 2026-10-19 傍晚 · 全站交互自测 + 浏览器 UI 预览 harness（201 断言 / 15 截图全过）

**目标**：接入真实数据后做全站自测——mock 层跑真实页面代码验证数据与交互，浏览器渲染层核对每个页面 UI 与交互。

### 1. `tools/selftest.js` — Node 交互自测（PASS 201 / FAIL 0）

- 自建极简 `wx`/`Page`/`App` mock，**加载 `miniprogram/pages/*` 的真实 JS**（通过 `tools/build_preview.js` 生成的 `ui/preview/_bundle.js` 同源模块池思路，selftest 内部独立实现）。
- 覆盖：
  - 数据完整性：12 事件 / 3 人物 / 4 朝代 / 2 专题 id 唯一、`details` 全覆盖、`source` 字段、relatedEvents 双向引用、全部引用素材文件存在；
  - 7 页生命周期（onLoad/onShow）与全部点击处理器（磁贴、时代带、朝代卡、菜单行、搜索按钮、热门词）；
  - Modal / ActionSheet（4 时代）/ Toast 三类弹层语义；
  - 未知 id 回退（person/event 对未知 id 取默认对象不崩溃）；
  - 路由闭合：所有 `navigateTo/redirectTo` 目标都存在。
- **发现并修复 1 个真实 bug**：timeline 时代带上一版硬编码数据，改为从 events 数据推导（eraName 如「西汉—北宋」/「晚清—新中国」，eraMeta 含纪年区间与时代列表），与 selftest 断言一致后通过。

### 2. 浏览器 UI 预览 harness — `ui/preview/`（纯前端渲染 7 个页面）

- 新增 `tools/build_preview.js`：把 app.js + data/history.js + 7 页四件套打包为 `ui/preview/_bundle.js`（tiny CommonJS；WXML/WXSS 转模块字符串）。
- 新增 `ui/preview/index.html` + `ui/preview/harness.js`：WXML 渲染子集（view/text/image/input/block、wx:for、wx:if/wx:else 相邻兄弟、bindtap/bindinput、data-*、`{{}}` 插值），wx API mock（存储/toast/modal/actionsheet/导航，自绘 Modal/ActionSheet/Toast），`?s=` 场景执行器（`click:`、`input:`、`mark:` 走红条通道），`?shot=1` 截图模式（#phone 恒 390×844 + transform 缩放适配）。
- 新增 `tools/preview_server.js`（node http 静态服务，端口 8137）与 `tools/preview_shots.js`（批量 15 张截图 → `ui/preview/shots/`）。
- **核对结论（15/15 无 UI 问题）**：01 首页、02 朝代 ActionSheet（4 时代选项）、03/04 时间轴古代/近现代（时代带推导正确）、05 发现、06 唐 Modal、07 我的（统计 4/12/3/2）、08 清缓存 Modal、09 搜索、10 搜索汉武帝三组结果、**11 空态**、12/13 人物苏轼/鲁迅（双色调、顶栏小印取名首字）、14/14-15 事件澶渊之盟/辛亥革命（modern 蓝灰调）。
- harness 侧修复 3 个环境坑（非小程序代码问题）：页内多参方法调用被只转发首参的包装吞掉（改 `apply`）；场景链 rAF 在 virtual-time/dump-dom 下饿死（改 `setTimeout` 链）；wx:for/wx:if 属性值需剥 `{{}}`。

### 3. 本轮小修（主代码，均已过 selftest + 截图）

- home「全部朝代 ›」跳发现页；发现页「专题长卷/精选史事」两个 section-link 接时间轴/时代带。
- event.wxml 清理死表达式 `{{item.mode === 'modern' ? '' : ''}}`；person/event 顶栏小印改为取人名/事件名首字；profile 删未用字段、"字数索引"→"出处索引"。

**校验**：`node tools/selftest.js` **PASS 201 / FAIL 0**；`python tools/validate_miniprogram.py` OK 7 pages；全部页面 JS 与 tools JS `node --check` 通过。

**遗留**

- 预览 harness 的截图仅覆盖 happy path；ActionSheet/Modal 的取消路径靠 selftest mock 断言覆盖。
- 早期 PowerShell 版截图脚本 `tools/preview_shots.ps1` 已由 `preview_shots.js` 取代并删除。

---

## 2026-10-19 下午 · 搜索页上线（roadmap #3 完成）+ 全部事件补正文

**新增搜索页 `pages/search/search`（已注册 app.json，全站第 7 页）**

- 自定义顶栏：返回 + 「史页 · 搜索」+ 首页同款 seal.png 小印（缩至 34×58）
- 搜索卡片：圆角纸白卡 + 朱砂 ⌕ + 无边框 input + 朱砂"搜索"按钮；input `confirm-type="search"` 支持键盘确认
- 无关键词时显示"热门检索"标签chips（汉武帝/苏轼/澶渊之盟/辛亥革命/五四运动/盛唐），点击即搜
- 结果分三组：**人物**（名字+朝代·身份，进人物详情）、**史事**（年代+朝代，进事件详情）、**朝代与专题**（进时间轴，古代/近现代由 period/topic 判定）；近现代结果用蓝灰 #7E9A9A 副标题色
- 匹配字段：事件（title/era/tags/desc/yearText）、人物（name/era/roles/summary/dates）、periods+topics 合并 panel；大小写不敏感的 includes 检索
- 空结果文案 + 建议；权限沿用首页同款宣纸底/卡片/圆角/细阴影 tokens

**入口**：「我的」页 menu-card 顶部新增「搜索史事 · 人物」行（onSearch → navigateTo）。四主页面顶部仍保持纯字标（2026-10-19 约定不变）。

**数据补全（roadmap #4 一部分）**

- 为全部 10 个缺 `details` 的事件补写 4-5 段审校级正文：陈桥兵变、王安石变法、靖康之变、鸦片战争、五四运动、九一八事变、开国大典、十一届三中全会、圆明园罹劫、汉武帝即位——事件详情页 body-card 现在对全部 12 条事件都有多段正文；风格对齐澶渊之盟/辛亥革命既有条目（编年叙事、含具体年月日/条约/人物，结尾以影响收束）。
- 新增 `tools/content_audit.py`：扫描 history.js 输出"哪些 events/persons 缺 details/desc"，后续扩数据可复跑。

**校验**

- search/profile 两页 wcc exit 0；validate OK **7 pages**；`node --check` 通过 data/history.js 与 search.js/profile.js。
- 事件/人物详情跳转链路：search → event/person → relatedPersons 反查（复用既有逻辑）。

**遗留**

- 人物仅 3 位（汉武帝/苏轼/鲁迅），赵匡胤、王安石、林则徐等为搜索高频词但无独立人物卡——下一轮补人物条目。
- 收藏/足迹仍占位（Toast）；后端方案 A（NestJS）尚未启动。

---

## 2026-10-19 · 时间轴印章调小（用户要求）

- `.brand-seal` 48×82 → **38×64rpx**（margin-top 10rpx）；`.era-mini-seal` 44×74 → **34×58rpx**（margin-top 8rpx）；均保持 rotate 2° 与 aspectFit 无变形。
- wcc exit 0；validate OK 6 pages。

---

## 2026-10-19 · 移除时间轴右上角水墨画像（用户：图片展示不好看，取消）

- timeline.wxml 删除 `.person-ink` 图片与 `.person-fade-x/-y` 遮罩；timeline.wxss 删除对应三类样式、`.header` 恢复为纯"品牌行"结构（position: relative; margin-top: 76rpx）。
- 资产 `paintings/person-ink.jpg` 已删除（不再引用）；SOURCES.md 标记"已移除"；`tools/match_ink_tone.py` 保留作为色调归一方法备用。
- 时间轴顶部现在是：字标"时间轴" + 首页同款印章图，其下直接 intro 与分段条；头部高度变矮，页面更清爽。
- 自测：grep 无 person-ink/person-fade 残留；wcc exit 0；validate OK 6 pages；包体 557KB。

---

## 2026-10-19 · 移除时间轴页四边细线内框（用户要求）

- `.frame`（fixed 四边 1rpx 朱砂细线框）从 timeline.wxml / timeline.wxss 中整体删除；宣纸底直接铺满屏幕。
- 自测：该 class 仅时间轴页使用，无其他页面引用残留；wcc exit 0；validate OK 6 pages。

---

## 2026-10-19 · era-band 卡右上角色差（用户：整体背景色要一致）

**根源**：`.person-fade-x/-y` 是 `z-index:1` 绝对定位遮罩（330×350rpx，延伸到卡片区域），而 `.era-band` 虽 `position:relative` 但无 z-index（z auto），被 z1 遮罩压住；遮罩底部近实色宣纸（0.97 #F6F1EA）叠在 #FCFBF8 白卡上产生右上角色差。`.seg` 有 z-index:2 所以正常。

**修复**：`.era-band` 和 `.event-list` 补 `z-index: 2`，卡片背景一致压过画像与其遮罩；卡片右上是纯 #FCFBF8。

**校验**：wcc exit 0；validate OK 6 pages。

---

## 2026-10-19 · 时间轴右上角水墨画像底色统一（用户截图：右上角色调不一致）

**现象**：画像素材自身纸底偏深偏黄（实测 rgb(229,219,210)），与页面宣纸 #F6F1EA(246,240,234) 明显色差，右上角露出时形成色调不一致的区块；且旧渐变遮罩用 100% 不透明平色，把纸纹理盖平了。

**修复**：

- 新增 `tools/match_ink_tone.py`：实测图像上缘背景均值 → 按通道增益（×1.076/1.103/1.116）整体归一，校正后背景恰为 246/241/234，与 paper-bg 平均色一致（38KB）。
- `.person-fade-x/-y` 渐变由平色停点改为半透明停点（顶部 0.25、左侧 0.8→0.35→0；底缘 0.97 收墨色），宣纸纹理可透出，不再有"平色贴片"感。
- 自测：palace.jpg（首页 hero）边角 (250,249,247) 与卡片 #FCFBF8 一致，无需处理；全页其余色块（seg 卡、事件卡）均为统一 #FCFBF8。

**校验**：wcc exit 0；validate OK 6 pages；包体 596KB。

---

## 2026-10-19 · seal.png 透明化（用户截图：印章底色块与卡片不一致）

**现象**：era-band 卡上的印章图自带米色底，和卡片 #FCFBF8 有色差，形成可见色块（用户红框标注）。

**修复**：`tools/crop_seal.py` 升级——红色像素 bbox 裁切后 3x LANCZOS 放大，按"红度"（min(r-g, r-b)）计算 alpha 抠图；米色背景全部透明，印章在白卡/宣纸上无缝。输出 114×197 RGBA（46KB）；展示尺寸不变（48×82 / 44×74rpx aspectFit）。

**校验**：wcc exit 0；validate OK 6 pages；包体 ~600KB。

---

## 2026-10-19 · 时间轴印章改为图片 + 取消大"宋"印（用户截图反馈）

**用户反馈**：①"人有志"“大事记”两枚竖排印太长，要像首页印章那样（找图不用 CSS 画）；②北宋卡右侧大"宋"印文字看不清，直接取消；③整体 UI 自测。

**改动**

- 新增 `assets/seal.png`（39×67，6.5KB）：`tools/crop_seal.py` 用红色像素检测从 `assets/palace.jpg`（首页 hero）裁出"史载"印——**与首页完全同源**，不是画图。
- 时间轴标题旁与朝代头卡的两处印章改为该图片印（48×82 / 44×74rpx，rotate 2°），原 CSS 文字印删除。
- 移除朝代头卡右侧大"宋"印（`.era-seal` 及 JS 的 eraSeal 数据）。
- 自测复核：无 `eraSeal`/`class="ss"` 残留；wcc exit 0；validate OK 6 pages；包体 563KB。

**遗留自测点（下次真机复核）**

- seg 分段条下缘不再透出山水纹理（背景已近实色 0.94）。
- 事件卡内"公元前141年"朱砂小字与标题基线对齐情况。
- 发现页朝代卡右上角浮签与画面对比度。

---

## 2026-10-19 · 修复预览包超限（2MB）+ 时间轴画像错位

**问题 1：预览报"源码包超出最大限制 source size 2455KB > 2MB"**

- 大头：paper-bg.png 851KB / palace.png 526KB / tang-bg.jpg 279KB / song.jpg 230KB。
- 处理：新增 `tools/compress_assets.py`——paper-bg 重生成并转 JPG（585 宽 q72，后重新导出 750×1624 q70 = 25KB）；palace.png 转 palace.jpg（30KB）；tang-bg/song 重压缩；删除已无引用的 pavilion.png（143KB）。
- 全部 6 个页面 WXML 的 `paper-bg.png` → `paper-bg.jpg`、`palace.png` → `palace.jpg`（用 Python UTF-8 安全替换；**教训：PowerShell `Get-Content|Set-Content` 管道会按 GBK 误写 UTF-8 文件导致全量乱码，已用 `git checkout --` 恢复后改用 Python**）。
- 结果：包体 2455KB → **约 550KB**；全部 6 页 wcc 编译 exit 0。

**问题 2：时间轴（及人物相关展示）错位**

- 水墨画像此前 top:-30rpx 高 400rpx，底部经半透明 seg 透出、面部可能被胶囊遮挡 → 图整体下移（top 40rpx、高 350rpx），seg 背景改近实色（0.94）并在 z 轴上盖住可能的重叠。
- 两枚竖排小印（人有志 / 大事记）从"依赖宽度自动换行"改为逐字 `<text>` 堆叠的固定结构，杜绝不同字体度量下的错位。
- 真机复核点：胶囊与画像重叠不可再遮脸；seg 圆角条内不应透出图像纹理。

**校验**

- wcc exit 0；validate_miniprogram.py OK 6 pages；node --check 通过；包体 550KB。

---

## 2026-10-19 · 时间轴按参考图重构

**用户依据**：上传时间轴页面参考图（宣纸 + 内框细线 + 水墨人物 + 朱砂印 + 竖线挂卡）。

**布局改动（保持当前程序色调不变）**

- 保留统一宣纸背景 `paper-bg.png`不变；新增四周内框细线 `.frame`（朱砂色低透明度，仅装饰）。
- 顶部：大宋体"时间轴" + 右侧竖排小朱砂印"人有志"；下方引言句不变。
- 右上角新增水墨人物 + 淡远山图（`assets/paintings/person-ink.jpg`，百度图搜 + PIL 裁水印），用左/下两层宣纸色渐变融入背景；位置避让胶囊区。
- 分段控件改为参考图样式：容器浅纸色胶囊，选中项白底圆角 + 朱砂字"古代"（近现代态同规则）。
- 朝代头卡：宋体大字时代名 + 竖排小印"大事记" + 右上大朱砂方印（宋/近，rotate -2°），meta 行沿用真实数据。
- 事件列表改为"竖线挂卡"：左侧深灰细线 rail，圆点红（#A34A3E）/青（#7E9A9A，即现行蓝灰）相间；卡片起点右移挂在轴上。
- 卡片内部：年份与标题同行（基线对齐），公元前纪年年份用朱砂红小字，其余黑色宋体；desc/tags 照旧；史料改为楷体括号行"（史料 · 《…》）"。
- 事件按纪年升序排列（近现代的 1860 圆明园罹劫移到 1840 之后）。
- 逻辑保留：mode 查询参数、switchMode、goTab、onEvent 进详情页。

**素材**

- 新增 `assets/paintings/person-ink.jpg`（500×590，已裁水印），来源记入 SOURCES.md。

**校验**

- `wcc.exe` 编译 timeline.wxml：exit 0；`validate_miniprogram.py`：OK 6 pages；`node --check` 通过。
- 未真机验证：水墨图与胶囊区重叠效果、frame 边框在窄屏的表现、rail 底部位置需在开发者工具里目检。

---

## 2026-10-19 · 移除时间轴/发现页顶部搜索与菜单图标

**用户要求**：时间轴、发现页左上角的搜索与三条杠菜单图标去掉。

**改动**

- `pages/timeline/`：删除 `top-actions`（search/menu 图标）与 `topbar` 的 space-between；删除 JS 中 `onSearch`/`onMenu`（页内已有"古代/近现代"分段切换，无需菜单）；清理对应 WXSS 样式。
- `pages/discover/`：同样删除图标、事件处理与样式。

**影响**

- 四个主页面（首页/时间轴/发现/我的）顶部现在均为纯宋体字标，视觉更统一。
- 时间轴的菜单入口（古代/近现代切换/关于）此前仅是快捷方式，页内分段控件已覆盖；"关于史页"保留在我的页。
- 搜索入口暂时无处触发（原本就是 Toast 占位），不影响后续正式搜索页。

**校验**

- `wcc.exe` 编译两个 WXML：exit 0；`validate_miniprogram.py`：OK 6 pages；`node --check` 通过。
- 同步更新 AGENTS.md 第 6 节约定与已知问题 8。

---

## 2026-10-19 · 发现 / 我的占位页落地

**目标**：完成两个占位页，视觉与首页/时间轴一致；素材路径走"搜图不画图"。

**搜图素材（tools 搜图工具链 + cn.bing/baidu 图搜，均目检验收）**

- 新增 `miniprogram/assets/paintings/`：`han.jpg`（长信宫灯）、`tang.jpg`（步辇图）、`song.jpg`（清明上河图·郊野段，故宫博物院官网）、`modern.jpg`（开国大典油画）、`landscape.jpg`（千里江山图真迹横卷局部）。
- 全部为原型演示素材，来源与授权状态记录在 `assets/paintings/SOURCES.md`；上线前需确认授权或替换。
- 新增工具：`tools/fetch_images.py`（Bing 搜图+下载）、`fetch_all.py`+`fetch_plan.json`（批量）、`list_candidates.py`（候选清单 JSON）、`contact_sheet.py`（九宫格对比图，PIL 拼图目检）。
- 过程教训：cn.bing 图搜关键词易被"比亚迪汉/兔子/素材站"污染，且 Wikipedia/百度百科直连被拒（超时/403）；最终可用通道为 Bing + 百度图片 thumbURL（400px，够卡片缩略）+ 指定 URL 直下（故宫 dpm.org.cn / bkimg.cdn.bcebos.com 可达），每张图必须目检验收。

**发现页（pages/discover/，替换占位）**

- 数据驱动：`history.periods` 过滤出汉/唐/宋/近现代四张朝代卡（2×2，配画 aspectFill + 底部压暗渐变 + 宋体朝代名/年代 + 小浮签"大汉气象"等），点击弹 Modal 显示 period.desc/史料。
- 专题长卷：盛唐气象复用 `tang-bg.jpg` 构图（era-card 同首页视觉语言），百年中国复用 modern-card；两点分别跳时间轴 ancient/modern。
- 精选史事：最近 6 条事件列表（古代赭/近现代蓝灰年份色），点击进事件详情页。
- 底部一行占位说明"世纪·历史地图·更多专题整理中"；顶部搜索/菜单图标按现行规范保留（margin-right 180rpx 避让胶囊）。

**我的页（pages/profile/，替换占位）**

- 头卡：千里江山图圆形头像（同样使用本图，避免再加素材）+ "史页客"昵称 + 纪念语 + 朱砂"史"印。
- 统计卡：朝代/史事/人物/专题数据量，全部从 `history.js` 读取。
- 千古长卷横幅：landscape.jpg 全宽卡，点击弹《千里江山图》说明 Modal。
- 功能清单：我的收藏/浏览足迹（Toast 占位）、数据与史料说明、素材与授权说明（指向 SOURCES.md）、关于史页、清除缓存（确认后 wx.clearStorageSync）。
- 底部四栏 tabbar，"我的"高亮。

**校验**

- `wcc.exe` 真编译 `discover.wxml` / `profile.wxml`：exit 0。
- `python tools/validate_miniprogram.py`：OK: 6 pages（含新素材引用检查）。
- `node --check`：相关 JS 全部通过。
- 未真机验证；朝代卡在新素材下的文字可读性（浅色画+深色渐变）待开发者工具里确认。

---

## 2026-10-19 · 修复事件详情页 WXML 编译错误

**现象**：微信开发者工具报 `pages/event/event.wxml unexpected end`（错误指向文件末尾第 61 行空行，无有效线索）。

**定位过程**（`wcc.exe` 二分法）：

- 用开发者工具自带的 `D:\wxcode\...\wcc-exec\wcc.exe` 本地重现该错误，绕过 GUI 反复试错。
- 标签闭合检查、文件字节（BOM/换行/不可见字符）均正常。
- 逐块删除定位到"其时其人"区，逐行删除定位到**第 43 行**。
- 表达式枚举实验确认：`class="p-char"` 文本里写成了 `{{item.name']}}`，多了一个 `']`，wcc 遇到非法表达式在解析后期直接崩溃，报错只落在 EOF。

**修复**

- `pages/event/event.wxml` 第 43 行：`{{item.name']}}` → `{{item.name}}`。
- `tools/validate_miniprogram.py` 新增"插值表达式完整性"检查：`{{`/`}}` 必须成对、单条表达式内引号必须配对；同类错误今后在静态校验阶段直接报出。
- 用 `wcc.exe` 逐一编译全部 6 个页面 WXML，全部 `OK`（后续页面问题可直接复用此验证方式，路径见本条记录开头）。

**教训**

- wcc 对非法插值表达式的报错位置（EOF）具有欺骗性；排查 WXML 编译错误优先二分 + wcc 本地重现。
- `validate_miniprogram.py` 的标签闭合检查覆盖不了表达式内部语法，已补上。

---

## 2026-10-19 · 独立详情页（人物 / 事件）

**目标**：落实交接文档第 8 节优先级第 2 条：用独立详情页替换首页/时间轴的 `wx.showModal`。

**改动**

- 新增 `miniprogram/pages/person/`（人物详情页四件套）：
  - 宋体大字人名、生卒年、身份行、时代 chip（古代赭石 / 近现代蓝灰双色调）
  - 楷体引文块（带左侧朱砂线）
  - 正文段落卡（`person.details`）
  - "生平际会 · 相关史事"列表，点击跳事件详情页
  - 底部史料来源行；顶部返回按钮（文字"‹"，无返回图标资源，后续可补 PNG）
- 新增 `miniprogram/pages/event/`（事件详情页四件套）：
  - 大字年份 + 宋体标题；古代赭石 / 近现代蓝灰双色调（顶栏小印、chip、卡片顶部色条联动）
  - lead 摘要 + `event.details` 段落
  - "其时其人"卡片（由 `person.relatedEvents` 反查），点击跳人物详情页
  - "回时间轴再看一眼"按钮（`wx.redirectTo` 携带 `mode` 参数）
- `data/history.js` 扩充（均真实史实，附 source）：
  - 三位人物补 `details`（人物详情段落）与 `relatedEvents`
  - 澶渊之盟、辛亥革命补 `details`（4–5 段过程叙述）
- 页面跳转改造：
  - 首页"人物/事件"磁贴：ActionSheet 选择后 `navigateTo` 详情页（不再弹 Modal）
  - 首页"今日史事"hero 卡：跳事件详情页（依赖 `daily.eventId`）；朝代/专题仍为 Modal
  - 时间轴事件卡：改为跳事件详情页
  - 时间轴 `onLoad` 支持接收 `mode` 查询参数（供事件页返回时间轴定位）
- `app.json` 注册两个新页面。

**校验**

- `python tools/validate_miniprogram.py` → `OK: 6 pages, JSON/assets/WXML checks passed.`
- `node --check`：5 个 JS 全部通过。
- 仍未在微信开发者工具中实际编译、未真机验证。

**遗留 / 注意**

- 详情页返回用文字"‹"，视觉上偏细线风格；如需一致的线性图标，需在 `ui/reference/icons.html` 补一枚 back.png。
- 其余 10 个事件尚未补 `details`（当前列表页 Modal/卡片仍可用，详情页只显示 lead 段）。
- 首页"朝代"磁贴仍为 ActionSheet + Modal；可考虑后续做朝代详情页。

---

## 下一步（按优先级）

1. ~~做独立的人物详情（苏轼 / 鲁迅）与事件详情（澶渊之盟 / 辛亥革命），替换当前 Modal。~~ ✅ 2026-10-19 已完成（见上文当日记录）；剩余其他事件可按需补 `details`。
2. 在微信开发者工具中导入 `miniprogram/`，跑通首页、时间轴与新详情页；修胶囊/安全区/字体。
3. 做搜索页，支持人物/事件/朝代/专题与古今结果并列。
4. 扩充 `data/history.js` 真实内容，补日期匹配、史料审校、其余事件 `details` 和更多近现代条目。
5. 接入后端 API / CMS（自建，不用云开发）；在此之前保持本地数据种子可替换。
6. 做分享卡片与收藏。

---

## 资源再生成

### 宣纸背景

- 执行：`python tools/make_paper_bg.py`
- 输出：`ui/reference/assets/paper-bg.png`
- 说明：浅米底 + 噪点 + 竖排淡墨书法 + 细竖线；当前版本 opacity 很低，避免干扰文字。

### 参考图裁切插画

当前 `palace.png` / `pavilion.png` 是按用户要求从上传的参考图裁切，不再使用手绘 SVG：

- `palace.png`：参考图 hero 插画区域，含“史载”印章；背景 `#FCFAFB`
- `pavilion.png`：参考图“盛唐气象”楼阁区域；背景 `#F3EFE6`
- 近现代入口不再使用轮船图，改为 CSS 蓝灰竖条 `.modern-bar`
- 如果重新裁切，保持卡片底色与裁切图背景一致，否则会出现色块边界。
- 参考图裁切素材仅用于原型，上线前需确认授权或替换。

### 旧版 SVG（归档）

`palace-v2.svg`、`pavilion.svg` 是阶段 3 的手绘稿，当前首页不再使用；保留仅作历史参考。

### 图标

- 透明 PNG 图标由 `ui/reference/icons.html` 图标表渲染后裁切；图标为 1.4px 细线，48×48。
- 新增图标时沿用同一线宽、圆角端点、黑色 `#1F1D19`。

---

## 下次开发检查清单

- [ ] 先读 `AGENTS.md` 和本日志
- [ ] 打开 `ui/reference/home-v3.html` 看当前视觉基准
- [ ] 确认没有误用 `ui/neo/` 旧风格
- [ ] 改完网页后同步改小程序 WXML/WXSS
- [ ] 跑 JS/JSON/WXML/资源引用静态检查
- [ ] 在微信开发者工具里检查一次
- [ ] 在本文件追加一条记录
