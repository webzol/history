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

## 2026-10-20 · 修复返回胶囊「扭曲/拉伸」——箭头改内联位图、文字不再随字号撑开

**现象（用户反馈）**：`pages/event/event` 顶部返回胶囊里的箭头/文字看起来被拉长扭曲，要求正常展示、不拉伸。

**原因**：原箭头由「2rpx 长横线 + 旋转 45° 的边框方块」两个 view 拼成，细线在真机不同 DPR 下会被拉伸模糊、箭头与横线接缝错位；同时文字用 `flex:1` 撑满剩余空间并随 `--fs` 字号缩放，胶囊高度固定 56rpx，字号变大后文字被挤压/错位。

**修复（6 个内页统一：event/person/period/search/favorites/footprints）**

- 箭头改为单元素 + 内联 2x PNG（`data:image/png;base64`，112×48 画布显示 56×24rpx）：等比缩放、任意 DPR 下不拉伸不发虚，去掉 `arrow-shaft`/`arrow-head` 两个 view。
- 胶囊布局改为 `justify-content: center`，箭头绝对定位在左侧 22rpx，「返回」真正居中；文字固定 26rpx、`line-height: 1`、`letter-spacing: 0.12em` + `text-indent` 抵消尾部空白，**不再随阅读字号缩放**（避免撑破固定高度胶囊）。
- 胶囊保持 240×56rpx（4.29:1）不变形。

**校验**：selftest **PASS 1271 / FAIL 0**；validate OK 10 pages；strip_bom 0；bundle 重建；20 张截图重截核对（14 事件页 / 15 辛亥革命 / 12 人物页胶囊箭头与「返回」居中正常）。

**二次修复（同日晚，真机仍反馈变形）**：

- 放弃 WXSS `background-image` + data URI（真机对 `background-size` 折算不稳，箭头/文字比例会跑偏）。
- 箭头改为本地资源 `assets/back-arrow.png`（128×56，圆头长箭头），wxml 用 `<image class="back-arrow" src="/assets/back-arrow.png" mode="aspectFit">`，容器钉死 56×24rpx —— `aspectFit` 保证任何情况下等比缩放、不拉伸。
- 文字改为**绝对定位铺满胶囊 + `line-height: 56rpx`**，去掉 flex 居中（真机 `flex + line-height` 会导致文字下沉）；胶囊加 `overflow: hidden` 兜底。
- 复现方式：截图 harness 4x 放大核对；文字不再偏移、箭头与杆身接缝连续。

---

## 2026-10-20 · 真机首跑修复：60s API 429 限流 → 失败冷却 30min

**现象（开发者工具/真机 lib 3.17.4 首跑）**：首页「历史上的今天」每次 onShow 都请求 `60s.viki.moe`，上游限流返回 **429**；此前失败不写缓存，导致反复越限越请求。

**修复（utils/api.js）**

- 失败也写缓存：`{ day, at, fail: true }`，**冷却 TTL 30 分钟**——冷却期内 `fetchTodayInHistory` 直接回调 `cooldown`，不发请求；板块维持隐藏。
- 成功路径不变（statodynamics TTL 6h）；冷却过期后自动恢复正常请求。
- 所有失败路径（断网 fail / 非 200 / 空数据）统一入冷却，防限流雪崩。

**selftest（624 → 630）**：新增 3 组断言——失败写冷却标记、冷却内不回调数据且不再发请求、回拨时间戳模拟冷却过期后恢复请求。

**校验**：PASS 630 / FAIL 0；validate OK 8 pages；strip_bom 0；bundle 重建。

**遗留**：429 属上游限流预期行为，冷却后下次冷启动可恢复；若仍频繁 429，可考虑换镜像域名或拉长冷却。

---

## 2026-10-20 · 第十七轮：清代建线 + 明代补链（37 史事 / 20 人物）

**新史事（4 条，插在 ming-wang-1644 之后 / yuanmingyuan-1860 之前）**

- `ningwang-1519` 平定宁王之乱（明）——宸濠寿宴发难、反间滞敌、鄱阳湖四十三日擒王、让功张永避祸；闭合王守仁 relatedEvents
- `taizhou-1561` 台州大捷（明）——义乌募兵戚家军、鸳鸯阵、台州九战九捷；后续横屿/平海卫/闽粤扫倭与蓟镇十六年；闭合戚继光 relatedEvents
- `kangxi-1681` 平三藩·收台湾（清）——1673 撤藩引起、专治三桂策略、1681 会师昆明、1683 施琅澎湖与设府；清代第一条，古代时代带由「西汉—明」延至「西汉—清」（公元前141–1839）
- `humen-1839` 虎门销烟（清）——黄爵滋奏议、广州传谕具结、义律缴烟 20,283 箱、六月三日起销二十三日、裨治文见证、1840 战争爆发衔接近代；闭合林则徐 relatedEvents（['humen-1839','opium-war-1840']）

**新人物（1 位，追加数组末尾）**

- `cao-xueqin` 曹雪芹（约1715–约1763，清）：织造世家→抄没北返、西郊著书、泪尽而逝、红楼梦成书与流传五段；quote《红楼梦》第一回题绝；relatedEvents 空属记录我可后续補红楼梦事件

**数据正确性复核记录（本轮自查，勿重蹈）**

- 组稿时曾写错若干史实，已逐段修正：销烟结束日（6/25 非 6/23）、平海卫大捷年份（1563 非"四十一年"）、武宗南征献俘张永等；所有日期/数目以"常见通说+正史传"口径落笔，正式发布前仍需历史审校。
- 过程事故：修复 topics 数组时误删 `id: 'tang'` 行，selftest 立即以"素材存在 null + era undefined"暴露；教训——**数组结构型编辑后必须先 `node --check` + 被 selftest 数据段全覆盖**。

**selftest 契约同步（586 → 624）**

- counts 33→37 / 19→20；id 唯一性集合同步；存在性清单 +4 史事 +1 人物；弹层人物 19→20 位；我的页统计 [4,37,20,2]
- 古代轴 18→22 条、升序数组插 1519/1561/1581 前 + 1681/1839；时代带断言改「西汉—清 · 公元前141–1839 · 时代列表含清」
- 新增 relatedEvents 反查闭环断言（王守仁→ningwang-1519、戚继光→taizhou-1561、林则徐→销烟+鸦片战争）

**校验与产物**

- `node tools/selftest.js` **PASS 624 / FAIL 0**；validate OK 8 pages；strip_bom 0
- `build_data_json` 重建 history.json（70.9KB，builtAt=2026-10-20 19:43），随仓库提交后 jsDelivr 自动同步
- 截图套件 20 张重截 OK（03 古代轴核对：时代带「西汉—清」正确渲染）；另临时截图核对 humen-1839 详情页（大字年份/清 chip/正文段落正常）

**遗留**

- 明/辽金夏/清仍未加朝代卡（time period 面板仍 4 朝代）；曹雪芹 relatedEvents 空待红楼梦事件；新增条目待历史审校

---

## 2026-10-20 · 第十六轮：缓存及时生效——「检查内容更新」（jsDelivr purge 强制链路）

**功能**

- 「我的」页新增菜单行「检查内容更新」（搜索行下第一行）：`onCheckUpdate` → `wx.showLoading(检查更新)` → 顺序三步：**purge jsDelivr CDN 缓存**（`purge.jsdelivr.net/gh/.../history.json` 官方清缓存端点）→ **绕过本地 24h 缓存**强制拉取 → 应用/提示：
  - 有更新：toast「已更新 · builtAt」，同时 onShow 重算统计/收藏/足迹；
  - 无更新：toast「内容已是最新」；离线：toast「暂无网络，稍后再试」；`updating` 状态防连点。
- `utils/remote.js` 新增 `purgeRemoteCache` 与 `fetchRemoteHistory(cb,{fresh})`（fresh 跳过本地缓存）；`utils/historyData.refresh(cb,{fresh})` 透传。
- `tools/build_data_json.js`：远端载荷新增 `meta.builtAt`（构建时间，展示用；历史校验不强制）。
- selftest 补桩 `showLoading/hideLoading`（harness 同步）；新增断言：强制刷新先发 purge 请求、一致不重复应用、失败复位、history.json 带 builtAt。

**校验（580→586）**

- `node tools/selftest.js` PASS 586 / FAIL 0；validate OK；strip_bom 0；bundle 重建。
- **真链路实测**：GitHub push c976e0a → purge 请求 → CDN 重新拉源 → cdn.jsdelivr.net 返回内容已带 `builtAt=2026-10-20 16:26` 全成功（此前最长 12h 的 CDN 缓存延迟被 purge 打穿）。
- 域名白名单需追加：`purge.jsdelivr.net`（仅「检查更新」按钮用；未加白名单时该按钮会走离线提示，不影响其余功能）。

---

## 2026-10-20 · 第十五轮：交互（二）弹层体系统一——信息详情全站去原生弹框

**改动**

- 首页「历史上的今天」条目点击：原生 `showModal` → 同风格宣纸信息弹层（`info` 状态 + `info-panel`/`info-body`/`info-para` 样式，多段正文、× / 知道了 / 遮罩三种关闭）。
- 首页 hero 点击的兜底详情（`showDetail`，hero 无 eventId 时）：同上替换，字段（时间/描述/史料）拆为多段。
- 「我的」页四个信息菜单（数据与史料说明 / 素材与授权说明 / 关于史页 / 千古长卷 banner）：原生 `showModal` → 信息弹层；统计段落仍实时读 `stats`（33 史事 / 19 人物等）。
- **保留原生**：`profile.onClearCache` 与 `onFavLongPress`（确认型双按钮）、`wx.showToast`（轻提示）——纯信息展示才用自绘弹层。
- selftest：tih 点击/profile 四菜单断言改为 info 弹层打开·内容·关闭；喊掉旧的 showModal 断言。

**校验**

- `node tools/selftest.js` **PASS 580 / FAIL 0**；validate OK；strip_bom 0；bundle 重建；20 张截图重截（profile 首屏核对 33/19 统计卡片）。
- 全站 `wx.showModal` 仅剩 2 处（均为确认型），`wx.showActionSheet` 0 处。

**遗留**

- 8137 场景暂未把 info 弹层纳入固定套件（本次临时截图核对）；如需回归可在 preview_shots 加 `profile?shot=1&s=click:.menu-row:nth-child(2)` 场景。

---

## 2026-10-20 · 第十四轮：交互（一）磁贴自绘弹层替代原生 ActionSheet + 时代带右侧竖条移除

**改动**

- **视觉（用户指图反馈）**：首页时代带右侧的 scroll-accent 半屏竖条（千里江山装饰列）整体移除，盛唐卡经 `era-row` flex 独占整行（`_`assets/scroll-accent.png 保留在 assets，未删文件）。
- **交互（用户要求“不要自带弹框”）**：首页三个磁贴（朝代/人物/事件）的选择列表由 `wx.showActionSheet` 改为**自绘底部弹层**：
  - `home.js`：`openSheet/closeSheet/noop/onSheetItem` 四件套；三种弹层内容仍全部实时取自 `hd.get()`（4 时代含起讫纪年 / 19 人物带时代与身份 / 精选 6 史事带纪年与朝代）；选中即关弹层并 `navigateTo` 真实条目。
  - `home.wxml`：页面根级 `sheet-layer`（遮罩 + 面板 + 拖柄 + 标题行 + 滚动列表 + 取消胶囊）；面板 `catchtap=noop` 阻冒泡，点遮罩/×/取消均关闭。
  - `home.wxss`：宣纸白卡圆角顶、淡墨分隔线、入场 `sheetUp` 动画、`env(safe-area-inset-bottom)` 安全区。
- **selftest 保真**：mock `setData` 升级支持 `'a.b'` 点路径（与真机行为一致）；首页块断言改为弹层打开/条数/选择跳转/选择后关闭/点取消关闭。
- 截图套件不变（`02-home-sheet-dynasty` 场景即拍到新弹层，视觉核对通过）。

**校验**

- `node tools/selftest.js` **PASS 576 / FAIL 0**；validate OK；strip_bom 0；bundle 重建。
- 原生 `wx.showActionSheet` 全站已无调用（home.js 的 showList 移除）；harness 的 drawSheet 桩仍保留（无调用方，不影响）。

**遗留**

- 发现页/朝代页等列表均为页面内真实渲染，无原生弹层依赖；detail 页收藏 Toast 仍用 wx.showToast（原生提示，保留）。

---

## 2026-10-20 · 第十三轮：内容扩充——明代 + 辽/西夏/金建国线（33 史事 / 19 人物）

**新增史事（7 条，全部 ancient，插在 `yuanmingyuan-1860` 之前保住精选首条契约）**

- `qidan-916` 契丹建国（辽）——阿保机统一八部、汉城置州县、947 改国号辽与南北面官
- `xixia-1038` 西夏立国（西夏）——元昊称帝、西夏文创制、三败宋军与庆历和议
- `jurchen-1115` 女真建国（金）——来流水誓师、海上之盟、辽亡与靖康之引线
- `zhenghe-1405` 郑和首下西洋（明）——首航占城—古里、七下西洋概述、劳罢之后果
- `tumu-1449` 土木堡之变（明）——亲征溃覆、于谦主战与北京保卫战、夺门之变
- `zhangjuzheng-1581` 张居正改革（明）——考成法、清丈田亩、一条鞭法通行天下
- `ming-wang-1644` 崇祯自缢·明亡（明）——大顺建国、煤山之变、吴三桂引清兵入关

**新增人物（4 位，追加数组末尾保住 ActionSheet 索引契约）**

- `zheng-he` 郑和（**quote 空**——无可靠自述引文；person 页 quote 块改 `wx:if` 可选渲染，selftest 断言放宽为「引文与出处配对」）
- `yu-qian` 于谦（引文《石灰吟》；relatedEvents → tumu-1449）
- `qi-jiguang` 戚继光（引文《止止堂集·韬钤深处》；relatedEvents 空——抗倭暂无对应事件条）
- `wang-shouren` 王守仁（引文《王阳明全集》「破心中贼难」；relatedEvents 空——平宁王暂无事件条）

**契约联动（selftest 全部同步）**

- counts：events 26→33 / persons 15→19 / stats [4,33,19,2]；人物磁贴 15→19 位
- 时间轴古代升序年表补 916/1038/1115/1405/1449/1581/1644（18 条）；时代带断言更新为 `西汉—明`、`公元前141–1644`、时代列表含 辽/西夏/金/明
- 新增 id 存在性列表补 7 事件 + 4 人物；远端热更测试用种子自动跟随

**校验与产物**

- `node tools/selftest.js` **PASS 571 / FAIL 0**；validate OK；strip_bom 0；`build_data_json` 重建 history.json（62.2KB，随仓库提交后 jsDelivr 自动同步）
- 截图套件 18→**20** 张：新增 `19-event-zhenghe`、`20-person-yuqian`，渲染核对通过（纪年 chip、引文块、其时其人列表均正确）

**遗留**

- time period 面板仍只有 4 朝代卡（汉/唐/宋/近现代）；明/辽金夏走时间轴与事件页，未加朝代卡——郑和/戚继光/王守仁 relatedEvents 为空的补事件后代做
- 新增条目正式发布前需历史审校（书目已列 source）

---

## 2026-10-20 · 第十二轮：A 方案落地——首页「历史上的今天」60s 实时板块

**功能（本轮上线）**

- 首页新增「历史上的今天」板块（`pages/home/`）：数据来自 60s API `https://60s.viki.moe/v2/today_in_history`（免费无 key，上游百度百科）。
  - `utils/api.js` 归一化：剔脏项（缺年/缺题）、清理 `[注 x]` 标记、event_type 映射「出生/逝世/事件」、按年份升序；**天级缓存 6h**（storage `shige_tih_月-日`，防上游限流）。
  - 板块展示前 6 条：朱砂纪年 + 类型标签（出生 #EEF0F0 / 事件 #F1E8DD / 逝世 #F0F0F1）+ 单行标题/简介；底部显示「共 N 条 · 点击条目看详情」；点击条目 `showModal` 出详情。
  - 失败兜底：无网/空数据/坏载荷 → 板块整体隐藏（`wx:if tih.length`），页面其余内容零影响；预览 harness 无 request 能力时同样自动回退。
- selftest 桩升级：`wx.request` 按 URL 分流（`today_in_history` → `mockRequest.today`，jsDelivr → `mockRequest.payload`），新增「今日接口」块（放文件末尾，涉及当天缓存不污染前面的断言）：归一化条数、升序、总数、当日日期、点击模态、断网清空板块。

**测试与校验（497→504）**

- `node tools/selftest.js` **PASS 504 / FAIL 0**；validate OK 8 pages；strip_bom 0；bundle 重建；18 张截图重截 OK（首页板块渲染核对通过）。
- 域名白名单：用户已在小程序后台添加 `cdn.jsdelivr.net`；**`60s.viki.moe` 也需加入**（本轮板块的 request 域名），开发期可先勾「不校验合法域名」。

**遗留**

- 板块内容来自百科上游，正式发布前需抽样审校（尤其年份/事件表述）。
- jsDelivr CDN 缓存最长 12h；NestJS 上线后统一替换 remote.js/api.js 的 URL 与解析。

---

## 2026-10-20 · 第十一轮：数据接口化第一步——jsDelivr 远端热更（用户确认选 B 方案）

**架构（本轮落地）**

- 新增 `utils/remote.js`：`wx.request` 拉 `https://cdn.jsdelivr.net/gh/webzol/history@main/miniprogram/data/history.json`（仓库直出、免服务器、HSV 缓存最长 12h），本地 24h 敏缓存。
- 新增 `utils/historyData.js` 数据中枢：初始=打包内种子（离线零依赖）；`refresh()` 拉远端 JSON → 结构校验（events/persons/periods/topics/daily 结构齐全）→ 通过则**热替换** current 并通知订阅回调重建页面。
- **8 个页面全部接中枢**：四个 tab 页在 onShow 应用数据并静默 refresh（changed 再重渲染）；event/person/period 以 `apply(redirectOnMiss)` 模式支持刷新后重建同一条目；search 每次检索实时读中枢。
- 新增 `tools/build_data_json.js`：把 history.js 种子序列化为 history.json（48.8KB）随仓库提交；`project.config.json` packOptions **忽略该文件**不进包（种子 js 仍在包内兜底）。
- 早前新建的 `utils/api.js`（60s「历史上的今天」）本轮一并纳入中枢体系与测试，页面暂不使用，A 方案触发时即插即用。

**工程纪律（新增）**

- 每次改动 `data/history.js` 后必须跑 `node tools/build_data_json.js` 重建 history.json 并提交，远端才同步。
- 上线前需在小程序后台把 `cdn.jsdelivr.net`（B）与 `60s.viki.moe`（A）加入 request 合法域名；开发期勾选「不校验合法域名」。

**测试与校验（423→479→497）**

- selftest 新增 `wx.request` 桩与「数据中枢」段（置于文件末尾，避免远端热替换污染页面断言）：种子初始态、远端热替换+订阅通知、相同数据不重复应用、缓存命中不发请求、坏数据拒绝、normalizeToday 归一化、天级缓存写入。
- `node tools/selftest.js` **PASS 497 / FAIL 0**；validate OK 8 pages；全部 JS `node --check` 通过。
- bundle 重建；18 张截图重截 OK（首页等无回归；预览版无 request 能力自动回退种子）。

**遗留**

- jsDelivr 有 CDN 缓存（最长 12h），内容更新存在延迟；NestJS 上线（remote.js 单点替换）后消除。
- 真机需确认 request 域名与「不校验合法域名」开关；custom-tab-bar 安全区仍待真机核对。

---

## 2026-10-20 · 修复 timeline.wxss BOM 编译错误（真机 lib 3.17.4）

**现象**：时间轴页 `timeline.wxss` 开头带 UTF-8 BOM（`EF BB BF`），新版基础库 WXSS 编译器报 `unexpected '﻿' at pos 1`；此前 wcc 旧链路容忍该 BOM，未暴露。

**修复**：

- 新增 `tools/strip_bom.py`：扫描 miniprogram 全部 js/json/wxml/wxss，剥离文件头 BOM；本次仅 `timeline.wxss` 带 BOM，已清除（首字节现为 `.page`）。
- 以后新会话若用 PowerShell/其他工具写文件，入库前跑一遍 `python tools/strip_bom.py`。

**校验**：strip 后 0 个 BOM 文件；selftest PASS 479 / FAIL 0；validate OK 8 pages。

---

## 2026-10-20 · 第十轮：秋收起义与井冈山 + 红军长征 + 人物毛泽东

**新史事（共 26 条），1927–1949 连续主线上线**

- **秋收起义与井冈山 1927**（民国）：八七会议"枪杆子里面出政权"→文家市转兵→三湾改编→引兵井冈→1928 朱毛会师红四军五段，source《中国共产党历史》第一卷。日期库补 9-9（秋收起义日），现共 **16 组**。
- **红军长征 1934**（民国）：瑞金出发→湘江之痛→遵义改组（另立条目）→四渡赤水/泸定桥→吴起镇与会宁会师五段。
- 至此近现代时间表 **15 条**：1840–1978 每2–5年一条主脉络，无断档。

**新人物（共 15 位）**

- **毛泽东**（1893–1976，新中国）：湖南一师/建党→井冈山道路→遵义与延安→重庆谈判与开国→建设探索与晚年五段，quote「星星之火，可以燎原。」
- relatedEvents: jinggangshan-1927 / longmarch-1934 / zunyi-1935 / prc-1949——长征与遵义会议事件页"其时其人"自动收入毛泽东，红色主线事件↔人物反查闭环。

**selftest 断言同步（453 → 479）**

- 数量契约：史事 26 / 人物 15 / 近现代轴 15 / 近现代面板 15 / ActionSheet 十五位 / 我的页统计 [4,26,15,2]。
- 新增条目存在性：jinggangshan-1927、longmarch-1934、mao-zedong；新增"长征/遵义反查含毛泽东"断言。

**校验**

- `node tools/selftest.js` **PASS 479 / FAIL 0**；validate OK 8 pages；`node --check` 通过。
- bundle 重建；18 张截图全部重截 OK（近现代轴顶部核对无异常）。

**遗留**

- 西夏/辽金、明代（郑和、永乐）两块仍空，需先定 period 配图方案再扩。
- 毛泽东条目为概要性梳理，正式发布前与全部条目一并进行历史审校。

---

## 2026-10-20 · 第九轮：玄武门之变 + 北伐战争 + 卫青/霍去病

**新史事（共 24 条）**

- **玄武门之变 626**（唐，ancient）：两系相忌→伏兵宫门→传位即位→"得位之讥与政业之颂"五段，source《资治通鉴·唐纪八》。李世民 relatedEvents 补 xuanwumen-626，事件↔人物反查闭环。时间轴古代现 **11 条**（前141–1127），朝代页唐面板 **4 条**（从626到755）。
- **北伐战争 1926**（民国，modern）：广州誓师→汀泗桥/武昌→江西与迁都武汉→工农运动→四一二/东北易帜五段，source《中国共产党历史》第一卷。时间轴近现代现 **13 条**。日期库补 7-9（北伐誓师日），现共 **15 组**。

**新人物（共 14 位）**

- **卫青**（？–前106，西汉）：骑奴→龙城→收河南置朔方→高阙拜大将军→漠北武刚车五段 + 恭谨自处收束，quote「人臣奉法遵职而已，何与招士！」。
- **霍去病**（前140–前117，西汉）：剽姚校尉→两次河西→受降浑邪王→封狼居胥→"匈奴未灭，无以家为也"→二十四岁卒、冢象祁连山五段。
- 两人 relatedEvents 均为 mobei-119 + han-wudi：漠北之战事件页"其时其人"自动列出卫青/霍去病，汉武帝事件页反查升为四人（汉武帝/张骞/卫青/霍去病），西汉人物磁贴链成形。

**selftest 断言同步（423 → 453）**

- 数量契约：史事 24 / 人物 14 / 古代 11 / 近现代 13（轴+面板）/ 唐面板 4 条 / span 从626到755 / 人物 ActionSheet 十四位 / 我的页统计 [4,24,14,2]。
- 古代升序数组插入 626；新增条目存在性断言 xuanwumen-626、beifa-1926、wei-qing、huo-qubing；新增"漠北之战反查"与"汉武事件反查四人"断言。

**校验**

- `node tools/selftest.js` **PASS 453 / FAIL 0**；`python tools/validate_miniprogram.py` OK 8 pages；`node --check` 通过。
- bundle 重建；18 张截图全部重截核对（03 古代轴含玄武门之变、06 唐面板四条"从626到755"、04 近现代轴正常）。

**遗留**

- 近现代 1927–1934 断档（四一二后至九一八之间），可补井冈山/长征类条目。
- 卫青/霍去病人物卡确认无图占位，与既有 14 位一致（均以姓名首字徽格展示）。

---

## 2026-10-20 · 第八轮（收口）：custom-tab-bar 迁移

**底层导航重构**

- `app.json` 启用 `"tabBar": { "custom": true }`，新增 `custom-tab-bar/` 组件（四 tab 图标/高亮/switchTab），删除四个 tab 页内自绘 tabbar；tab 样式收编进 `app.wxss`（web 预览外壳复用），组件 wxss 真实生效。
- 真机语义变化：tab 页间改用 `wx.switchTab`，页面常驻（onLoad 仅一次，onShow 每次触发；首页日期匹配、我的统计、时间轴分段在 onShow 中维持最新）。
- tab 页无法带查询参数：新增 `utils/store.js` `setPendingTimelineMode/popPendingTimelineMode`（存储键 `shige_tab_params`）；首页盛唐/百年中国卡、发现页专题长卷、朝代页「进时间轴」、事件页「回时间轴」、搜索面板跳转全部改为 switchTab + pending 交接，时间轴 onShow 读取分段。分享路径中的 `?mode=` 在 switchTab 语义下会被截去，属预期（时间轴默认古代）。
- 预览链路适配：`harness.js` 补 `wx.switchTab` mock（收栈 + onShow）、注入 tab 外壳（高亮跟随 hash）；截图与此前视觉一致。
- 校验：`node tools/selftest.js` **PASS 423 / FAIL 0**（新增 pending 交接、switchTab 收栈断言）；`python tools/validate_miniprogram.py` OK 8 pages；`node --check` 全部通过；18 张截图核对（底部栏高亮、我的页统计 4/22/12/2 正常）。
- **风险提醒**：custom-tab-bar 未经微信开发者工具真机编译（安全区 env() 与组件生命周期需真机确认），首次打开开发者工具时优先核对底部栏。

---

## 2026-10-20 · 第七轮：遵义会议 + 抗战胜利 + 人物邓小平

- **新史事（共 22 条）**：**遵义会议 1935**（民国，长征转折四段）、**抗战胜利 1945**（民国，终战诏书→密苏里号→南京受降→重庆谈判四段，source《中国共产党历史》）。近现代带 1840–1978 现共 12 条，补齐 1931–1949 主线。
- **新人物（共 12 位）**：**邓小平**（1904–1997，新中国）：百色起义→刘邓大军→三落三起→改革开放五段，quote「发展才是硬道理。」relatedEvents: prc-1949 / reform-1978；同步补写三中全会 details 提及《解放思想，实事求是》讲话，形成事件↔人物反查闭环。
- 日期库补 9-3（抗战胜利纪念日）、1-15（遵义会议），现共 14 组。
- 校验：`node tools/selftest.js` **PASS 418 / FAIL 0**；validate OK 8 pages；bundle 重建、18 张截图核对。

---

## 2026-10-20 · 第六轮：新文化运动 + 人物陈独秀

- **新史事（共 20 条）**：**新文化运动 1915**（民国）：《敬告青年》→北大《新青年》北迁→德先生赛先生→马克思主义传播与五四合流四段。日期库补 9-15（创刊日），现共 12 组。
- **新人物（共 11 位）**：**陈独秀**（1879–1942，民国），quote《敬告青年》；relatedEvents: newculture-1915 / mayfourth-1919（鲁迅、陈独秀在五四事件页双双现身）。
- 时间轴近现代 10 条；era 带「晚清—新中国 · 晚清 / 民国 / 新中国」结构保持完整。
- 搜索：陈独秀同轮命中新文化运动；「德先生」命中事件正文；年份 1915 可搜。
- 校验：`node tools/selftest.js` **PASS 390 / FAIL 0**；validate OK 8 pages；content_audit 无缺 details；bundle 重建、18 张截图核对。
- **网页参考同步**：`ui/reference/home-v3.html` 首页 hero 更新为当前数据驱动的文案（10月20日 · 今天 / 编辑精选汉武帝），并重截 `home-final.png`，网页参考与小程序首页视觉一致。

---

## 2026-10-20 · 第五轮：漠北之战 + 收藏长按移除

- **新史事（共 19 条）**：**漠北之战 前119**（西汉）：卫青武刚车结阵、霍去病封狼居胥四段，source《史记·卫将军骠骑列传》。西汉朝代页现共录 3 条（跨前141—前119），时间轴古代 10 条。
- **交互**：「我的」收藏列表行新增**长按移出**（弹窗确认 → store 同步删除 → Toast），断言覆盖存储层。
- 搜索：关键词「卫青」经 details 全文命中漠北之战。
- 校验：`node tools/selftest.js` **PASS 372 / FAIL 0**；validate OK 8 pages；bundle 重建、18 张截图核对（17 近现代页 9 条含戊戌变法）。

---

## 2026-10-20 · 第四轮：张骞出使西域 + 戊戌变法 + 人物张骞

- **新史事（共 18 条）**：**张骞出使西域 前138**（西汉，凿空五段）、**戊戌变法 1898**（晚清，公车上书→百日维新→六君子四段）。日期库补 6-11（明定国是诏），现共 11 组。
- **新人物（共 10 位）**：**张骞**（约前164–前114，西汉），quote「为人强力，宽大信人，蛮夷爱之。」，relatedEvents: zhangqian-138 / han-wudi。
- **反向联动**：汉武帝即位事件页「其时其人」现列出汉武帝+张骞；搜索「张骞」同轮命中人物+事件，1898 年份可搜。
- 时间轴古代 9 条 / 近现代 9 条；西汉朝代页共录 2 条（跨前141—前138）。
- 校验：`node tools/selftest.js` **PASS 360 / FAIL 0**；validate OK 8 pages；bundle 重建、18 张截图核对（03 古代轴含张骞、16 西汉页双条目、07 空态卡正常）。

---

## 2026-10-20 · 第三轮：搜索 details 全文匹配 + 我的页空态引导 + 日期库补黄海海战

- **搜索**：人物/史事匹配字段加入 `details` 全文——「李世民」同轮命中贞观之治、「李鸿章」同轮命中甲午战争、「虎门」命中鸦片战争；标题前缀契约断言保留。selftest **PASS 332 / FAIL 0**。
- **我的页**：收藏/足迹为空时不再整卡隐藏，改为浅墨引导卡（「还没有收藏…」「还没有足迹…」），新用户首屏有行动指引。
- **日期库**：补 9-17（黄海海战）→ 甲午战争，现共 10 组；4-17 马关条约签订日已有。
- 校验：validate OK 8 pages；bundle 重建、18 张截图重截核对（07 我的空态卡、统计 4/16/9/2 正常）。

---

## 2026-10-20 · 数据扩充第二轮：唐代三条史事 + 甲午战争 + 三位新人物

**新史事（现共 16 条）**

- **贞观之治 627** / **开元盛世 713** / **安史之乱 755**（era 唐）：补齐唐朝代详情页的收录史事（此前唐为空态引导）。朝代页唐卡现显示「从627到755，共录史事 3 条」。
- **甲午战争 1894**（era 晚清，近现代）：丰岛海战→黄海海战→威海卫覆没→《马关条约》四段正文，source《清史稿·德宗本纪》等。
- 日期库新增 4-17 → 甲午战争（马关条约签订日），现共 9 组。

**新人物（现共 9 位）**

- **李世民**（599–649，唐）：玄武门→贞观→天可汗五段，quote「以人为镜，可以明得失。」relatedEvents: zhenguan-627, kaiyuan-713。
- **杜甫**（712–770，唐）：「诗史」五段，quote《春望》。relatedEvents: anshi-755, kaiyuan-713。
- **李鸿章**（1823–1901，晚清）：淮军/洋务/北洋/马关/辛丑五段，quote《临终诗》。relatedEvents: jiawu-1894。

**影响面与校验**

- 时间轴古代轴现 8 条（前141/627/713/755/960/1005/1069/1127），时代带「西汉—北宋 · 西汉 / 唐 / 北宋」；近现代轴 8 条。
- 搜索契约：李世民/杜甫/李鸿章命中人物；1894 可按年份搜。
- `node tools/selftest.js` **PASS 327 / FAIL 0**（新增唐收录断言、甲午/新人物断言、人物磁贴 9 位）。
- `python tools/validate_miniprogram.py` OK 8 pages；bundle 重建、18 张截图重截核对（06-period-tang 三条史事、03/04 时间轴、01 首页均正常）。
- 当日（10-20）无日期库条目，首页回退编辑精选（汉武帝即位），符合设计。

---

## 2026-10-19 晚 · 完善批次：人物扩充 / 日期匹配 / 收藏足迹 / 朝代详情页 / 分享

**数据扩充（roadmap #4）**

- 新增 3 位人物条目（现共 6 位）：**赵匡胤**（陈桥兵变一条相关）、**王安石**（变法+澶渊两条）、**林则徐**（鸦片战争一条）——每条 5 段审校级生平 `details` + `quote/quoteSource` + `source` + `relatedEvents`，era/年代按考评。
- 今日史事改为**「月-日」公历日期库**（history.daily 8 组映射：10-18/10-19→圆明园罹劫、10-10→辛亥革命、10-1→开国大典、9-18→九一八、5-4→五四、12-18→三中全会、8-29→南京条约），匹配不到回退 `dailyFallback`（汉武帝即位编辑精选）。农历事件（陈桥兵变）暂不列入日期库。
- home.js hero 由日期库解析事件对象生成 desc（`yearText，desc`），hero 点击直达对应事件详情。

**收藏 + 浏览足迹落地（原 Toast 占位）**

- 新增 `miniprogram/utils/store.js`：favorites/footprints 本地存储（`shige_favorites` / `shige_footprints`），toggle 幂等、足迹限 20 条、按浏览时间倒序。
- person/event 详情页：底部新增「收藏此人物 / 收藏此史事」ghost 按钮（古代朱砂、近现代蓝灰两态，已收藏显示 ✓），进入即写足迹；`onShareAppMessage` 分享（带 id 直达路径）。
- 「我的」页：新增「我的收藏」「浏览足迹」列表卡（人物/事 char 徽格 + 标题 + 副标题/时间，点击跳详情）；菜单区移除占位行；清缓存语义更新为「收藏与足迹一并清除」并在确认后即时刷新列表；头像区统计人物数自动跟随种子（6）。

**朝代详情页 `pages/period/`（第 8 个页面，替换 Modal）**

- 顶栏「‹ 返回 + 史页·朝代 + 小印」、配画头卡（与发现页同款搜图素材）、`body` 时代脉络段（首尾纪年跨度；单条用「自」，空收录不渲染）、收录史事列表（按纪年升序）、无收录时（唐）给「进时间轴」ghost 引导；分享带 id。
- 接线替换：home 朝代磁贴 ActionSheet → period 页；发现页朝代卡 → period 页（原 Modal 删除）；首页盛唐/百年中国卡 → 时间轴（古代/近现代 mode）。
- selftest 断言朝代收录：西汉 1 条、北宋 4 条、近现代 7 条、唐 0 条。

**分享**

- home / timeline / discover（入口型）+ person / event / period（内容型带 id）全部接入 `onShareAppMessage`并断言。

**校验**

- `node tools/selftest.js` **PASS 276 / FAIL 0**（扩充至 8 页断言：新增日期库、收藏/足迹流、period 页、分享、新人物检索）。
- `python tools/validate_miniprogram.py` OK **8 pages**；`node --check` 全部 JS 通过。
- 浏览器截图 18 张（新增 16/17 period 两张、18 人物收藏态；06 改名 period-tang）逐张核对无 UI 问题。

**遗留**

- 唐朝代无独立事件收录，period 页引导进时间轴；后续可补贞观/开元史事。
- 人物 6 位仍偏少（下轮可补武则天、辛弃疾、张之洞等）；素材授权与微信开发者工具实机编译仍未完成。

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

## 2026-10-22 · 第十八轮：清代补链（二）——红楼梦/太平天国/洋务/收复新疆（41 史事 / 23 人物）

**目标**：补上曹雪芹反查空洞，扩充清代与晚清史事，让人物页「相关史事」不再有空白。

**变化（`miniprogram/data/history.js`）**

- 新增 4 条史事（均插入在 `yuanmingyuan-1860` 之前，保持精选首条为圆明园）：
  - `hongloumeng-1754`《红楼梦》成书（古代 · 清，1754，甲戌本）
  - `taiping-1851` 太平天国运动（近现代 · 晚清）
  - `yangwu-1861` 洋务运动（近现代 · 晚清）
  - `xinjiang-1878` 收复新疆（近现代 · 晚清，含 1881 伊犁交涉 / 1884 建省）
- 新增 3 位人物（追加数组末尾，磁贴索引契约不变）：洪秀全（引文《原道醒世训》）、曾国藩（《曾国藩日记》）、左宗棠（《自题书斋联》）。
- 反查打通：曹雪芹 → 红楼梦成书；李鸿章 → 洋务运动 + 甲午；曾国藩 → 太平天国 + 洋务；左宗棠 → 收复新疆。
- 规模：**37 史事 / 20 人物 → 41 史事 / 23 人物**；时间轴古代 23 条（+1754）、近现代 18 条（+1851/1861/1878）。

**校验**

- `node tools/selftest.js` **PASS 698 / FAIL 0**（630 → 698）。新增断言：全员 `relatedEvents` 非空且指向真实史事（23/23 闭环）、曹雪芹/李鸿章/曾国藩/左宗棠反查命中。
- `node tools/build_data_json.js` 重建 `history.json`（80.7KB，builtAt=2026-10-22 09:55）；validate OK 8 pages；strip_bom 0；bundle 重建 + 20 张截图重截。
- 逐页核对截图：左宗棠人物页（引文/小印/正文）、太平天国事件页（近现代蓝灰条）、发现页、首页（60s 板块正常）。

**遗留**

- 朝代卡仍为 4 个（西汉/唐/北宋/近现代），清/明/辽金夏只在时间轴与列表中出现；扩展需先定配图方案。
- `assets/paintings/` 素材授权仍为原型用途。

---

## 2026-10-22 · 第十九轮：朝代卡扩展明代 / 清代（4 → 6 张）

**目标**：把已进时间轴的明、清两代提到「发现」页朝代一览，补上 2×2 变 2×3 的空位。

**数据（`miniprogram/data/history.js`）**

- `periods` 增 `ming`（明，1368–1644，题「大明」）与 `qing`（清，1644–1912，题「大清」），顺序按纪年插在北宋与近现代之间。
- 朝代详情页 `period.js`：新增 `PERIOD_ERAS = { qing: ['清','晚清'] }`，清代页合并收录 era「清」与「晚清」的史事（共 10 条，1681–1898）；明代页 6 条（1405–1644）。
- 发现页 `PERIOD_META` 与朝代详情页 `PERIOD_META` 各补 ming/qing 配图与纪年。

**配图（新增 2 张，未动旧素材）**

- `assets/paintings/ming.jpg`：《出警入跸图·出警图》局部（明，佚名，台北故宫博物院藏）。
- `assets/paintings/qing.jpg`：《乾隆南巡图》卷四·淮黄交流局部（清 徐扬等，大都会艺术博物馆藏）。
- 两张均为 Wikimedia Commons **CC0**，已按卡片 16:15 裁切、压到 560×525（72KB / 54KB）；来源与授权状态已登记 `assets/paintings/SOURCES.md`。
- 说明：原有四张图分别是汉/唐/宋/近现代，直接裁切会**错代**，故明、清改用公版明清绘画。

**UI**

- 发现页朝代卡从 2×2 变 2×3（布局本身是 flex-wrap，无需改结构；CSS 注释更正为「2 列」）。
- 首页「朝代」磁贴弹层自动由 4 项变 6 项；「我的」页统计朝代 4 → 6。

**校验**

- `node tools/selftest.js` **PASS 707 / FAIL 0**（698 → 707）：新增明代 6 条 / 清代合并 10 条断言、朝代弹层第 4 项 → 明、统计 6、六张卡配图存在。
- `build_data_json`（81.1KB，builtAt=2026-10-22 10:33）、validate OK、bundle 重建、20 张截图重截；另临时核对明/清朝代详情页渲染（已删临时图）。

**遗留**

- 辽 / 西夏 / 金 暂未做朝代卡（需再定三张配图；可继续用 Commons 公版画作）。
- 清卡与近现代卡在 1840–1912 段有意重叠（朝代视角 vs 近现代视角）。

---

## 2026-10-22 · 第二十轮：事件页「时代配画」头卡 + 人物缩略图

**用户反馈**：事件页头卡（年份/标题）和「其时其人」的纯色块太素，希望加背景图 / 图片展示。

**改动**

- 新增 `utils/eraImages.js`：`eraImage(era)` 供事件头卡按时代取画（西汉/唐/北宋/明/清/晚清/民国/新中国/近现代），辽/西夏/金等无专属绘画的时代回退 `palace.jpg`；`personThumb(era, index)` 取 `assets/thumbs/<时代>-1..4.jpg` 按行序轮换。
- 事件头卡：196rpx 全宽配画横幅，底部 `linear-gradient` 渐隐到暖白 `#FCFBF8`；标题/年份/时代 chip 仍落在暖白区，墨色对比不变。
- 「其时其人」：红底字块改为 96rpx 圆角配画缩略图 + 姓名 / 生卒 / 身份三行；缩略图 `saturate(0.75) brightness(1.04)`，与宣纸调性一致。
- 新增 `assets/thumbs/` 24 张（6 时代 × 4 个细部，160×160，JPEG q72，共 137KB），由 `assets/paintings/` 原画同源裁切，未引入新授权素材；`SOURCES.md` 已登记为派生裁切。
- harness 新增 `?s=scroll:<px>` 场景步骤（`#page-host` 临时 `overflow:auto`），可截图核对长页下半屏。
- `build_preview.js` 打包列表加入 `utils/eraImages.js`（漏加会报 `SRC[full] is not a function`）。

**校验**

- `node tools/selftest.js` **PASS 720 / FAIL 0**（707 → 720）：`eraImage` 西汉/晚清/民国/辽回退、`personThumb` 轮换与回退、24 张缩略图齐备、汉武事件头卡配汉画、澶渊头卡配宋画、辽事件回退宫阙、汉武事件四人缩略图 4 张各不相同。
- validate OK 8 pages；bundle 重建；截图核对事件页头卡、滚动到「其时其人」（4 张不同细部）与明/清朝代页。

**遗留**

- 缩略图是时代画细部，不是人物肖像；若要人物专属画像，需逐位找 PD 肖像（部分人物无可靠画像）。
- 清画本身偏淡，清时代缩略图对比偏弱；如用户觉得糊，可单独提 contrast。

---

## 2026-10-22 · 第二十一轮：人物页配画底纹 + 相关史事缩略图

**用户反馈**：人物页看着可以加背景图的地方加个背景图。

**改动**

- 人物页头卡：时代画作铺满卡片（46% 透明度、降饱和），上覆暖白渐变遮罩，人名/生卒/引文仍在墨色可读区；引文块底色提到 `rgba(252,251,248,0.72)`，避免压图后发灰。
- 「生平际会 · 相关史事」每行右侧加 80rpx 同源缩略图（按行序轮换），与事件页「其时其人」视觉语言一致。
- 修正时代映射：民国/近现代改用《千里江山图》作山河底色（与「我的」横幅同源），不再错配 1949《开国大典》；新中国仍用《开国大典》。同步新增 `assets/thumbs/republic-1..4.jpg`（千里江山图细部，共 28 张缩略图）。
- 影响面：辛亥革命/五四/长征/遵义等民国事件头卡也一并改为千里江山图，鲁迅/陈独秀人物缩略图随之为山河细部。

**校验**

- `node tools/selftest.js` **PASS 728 / FAIL 0**（720 → 728）：苏轼头卡宋画、相关史事四张缩略图按序轮换、鲁迅头卡山河底（不误配开国大典）、毛泽东头卡开国大典、民国 `eraImage`/`personThumb` 映射、28 张缩略图齐备。
- validate OK 8 pages；bundle 重建；20 张截图重截，另滚动核对苏轼「相关史事」四行缩略图与鲁迅/毛泽东头卡。

**遗留**

- 还是时代画/山河底纹，不是人物肖像；若后续要人物专属画像，可逐位替换为公有领域肖像。
- 民国事件统一用千里江山图，属于装饰性底色，不代表具体史事场景。

---

## 2026-10-22 · 第二十二轮：配图改「装裱画片」+ 我的页形象重做

**用户反馈**：事件页头卡与「其时其人」的图片展示换个方式；我的页图片展示换风格，头像改手绘历史形象，展示图片的位置都用图片。

**事件页**

- 头卡去掉全宽横幅，改为右侧 200rpx 装裱画片（4rpx 纸白边框 + 轻阴影），年份/标题/时代 chip 回到左侧主位；长标题自动两行，画片垂直居中。
- 「其时其人」缩略图改为 104rpx 画片式（白边 + 阴影 + 0.86 饱和），仍按行序轮换时代细部。

**我的页**

- 新增手绘史官头像 `assets/avatar-scholar.png`（216×216）：幞头 + 圆领袍 + 短须，纸色底；矢量稿 `tools/avatar-scholar.svg`，由 Chrome 光栅化，不依赖外部素材。
- 「千古长卷」由满幅淡彩改为装裱画片：画心 208rpx + 底部题签（标题 / 作者与馆藏），画心恢复较高饱和度。
- 收藏 / 足迹行把「人」「事」色块换成 72rpx 时代缩略图（白边 + 阴影），人物与史事都走 `personThumb(era, index)`。
- 头卡印章从 CSS 文字块改为 `assets/seal.png` 图片，符合「印章一律用图片」的约定。

**工具**

- harness 新增 `?fav=person:su-shi,event:xinhai-1911&foot=...` 预置收藏/足迹，便于截到有列表的「我的」页。

**校验**

- `node tools/selftest.js` **PASS 732 / FAIL 0**（728 → 732）：收藏/足迹条目均带存在配图、辛亥革命收藏用山河细部、手绘头像文件存在。
- validate OK 8 pages；bundle 重建；20 张截图重截，另核对长标题事件（中华人民共和国成立 / 《红楼梦》成书）、事件页滚动到「其时其人」、我的页带 2 收藏 + 3 足迹。

**遗留**

- 头像是通用史官形象，不是具体历史人物；如需「司马迁/苏轼」等专属形象，可再单独绘制替换。
- 我的页空态（无收藏/足迹）仍为纯文字提示。

---

## 2026-10-22 · 第二十三轮：全站阅读字号（小 / 标准 / 大 / 特大）

**用户需求**：新增文本字号设置；随后明确「整体字体需要是阅读字体大小」——不只正文/引文，页面所有文字都要跟着缩放。

**实现**

- 新增 `utils/font.js`：四档 `OPTIONS`（小 s / 标准 m / 大 l / 特大 xl）、`fontKey()`、`apply(page)`；设置存 `utils/store.js` 的 `shige_font_key`，非法值回落 `m`。
- `app.wxss` 定义 `.fs-s/.fs-m/.fs-l/.fs-xl { --fs: 0.9/1/1.14/1.28 }`；8 个页面根节点统一 `class="page fs-{{fontClass}}"`，`onLoad/onShow` 调 `font.apply(this)`，tab 页返回/详情页回退都会重读设置。
- 页面 WXSS 的 127 处 `font-size` 与 7 处定值 `line-height` 全部改为 `calc(Nrpx * var(--fs, 1))`，标题、正文、列表、按钮、统计数字随设置整体缩放；图标/箭头/引号/印章等符号按选择器排除，保持固定尺寸。
- 「我的」页统计卡下新增「阅读设置」卡：小/标准/大/特大分段控件 + 示例句，点选落库并 Toast 反馈；说明文案为「全站文字」。

**布局修正（特大档核对）**

- 朝代页 / 人物页相关史事的纪年列原为固定 130rpx，特大档「公元前141年」会折成两行；改为 `flex: 0 0 auto + white-space: nowrap`，让正文列自适应。

**校验**

- `node tools/selftest.js` **PASS 762 / FAIL 0**（732 → 762）：默认标准、四档选项、非法值回落、8 页根节点类名、切到特大后各页 `fontClass` 同步、我的页点选落库 + Toast、重进页面保持设置、复位。
- validate OK 8 pages；bundle 重建（`utils/font.js` 已加入打包列表）；20 张截图重截；另用 `?font=xl` 核对首页/时间轴/发现/我的/人物/事件/朝代/搜索八页特大档，无溢出。

**遗留**

- `calc()` + CSS 变量在微信 WebView 的兼容性尚未真机验证；若基础库过旧需回退为四套静态类。
- 底部自定义 tab bar 不在页面根节点内，tab 文案不随字号缩放（保留固定导航尺寸）。

---

## 下次开发检查清单

- [ ] 先读 `AGENTS.md` 和本日志
- [ ] 打开 `ui/reference/home-v3.html` 看当前视觉基准
- [ ] 确认没有误用 `ui/neo/` 旧风格
- [ ] 改完网页后同步改小程序 WXML/WXSS
- [ ] 跑 JS/JSON/WXML/资源引用静态检查
- [ ] 在微信开发者工具里检查一次
- [ ] 在本文件追加一条记录

---

## 2026-10-22 · 第二十四轮：古风返回胶囊、收藏/足迹折叠与独立页、清空

**用户需求**：左上角返回键改成上传图那条「长胶囊 + 长左箭头 + 楷体返回」；收藏/足迹只显示前三条，「查看全部」进独立分类页；独立页加「清空」。

**返回胶囊**

- 用 CSS 复刻上传图：`240×56rpx`（约 4.29:1，保持比例、不拉伸），左侧 58rpx 长箭头（杆 + 45° 箭头），右侧楷体「返回」，墨褐 `#6B5A33` + 赭金 `#B98556`，边框/浅纸底/轻阴影。
- person / event / period / search / footprints / favorites 六页统一；删除未采用的 `back-medallion.png/svg` 与临时预览。
- 顶栏标题由 50% 微调到 `left: 54%`，避免与加宽后的胶囊贴住；特大字号下仍有间距（已用 `?font=xl` 截图核对）。

**折叠与独立页**

- 「我的」页收藏/足迹各只渲染前 3 条；超过 3 条时在卡片底部显示「查看全部收藏 / 查看全部足迹」+ 总数，跳独立页。
- 新增 `pages/favorites/`、`pages/footprints/`：按「人物 / 史事」分组、显示组内条数；足迹保留「10月22日 16:41」时间；点击进对应详情。
- 独立页「清空」：原生确认弹框（确认型弹框允许）→ `store.clearFavorites()` / `clearFootprints()` → 即时刷新 + Toast；取消不动数据。
- 新增 `utils/entries.js` 统一解析收藏/足迹条目、时间格式、分组与展平；「我的」页与两个独立页共用，避免三处重复映射。
- 为解决预览 harness 不支持嵌套 `wx:for-item`，独立页把分组展平为 `rows`（header/item）单层渲染；真机与预览行为一致。

**校验**

- `node tools/selftest.js` **PASS 797 / FAIL 0**（732 → 797）：折叠阈值、独立页分组/条数、点击跳转、清空确认/取消、存储清空、六页返回胶囊、10 页字号同步等。
- `python tools/validate_miniprogram.py`：OK，10 pages。
- harness 修正：所有页面初始与 `navigateTo` 后都补调 `onShow`，独立页数据不再为空；`?fav/?foot/?font` 预置仍可用。
- bundle 重建；20 张标准截图 + 收藏/足迹/清空弹层/XL 顶栏核对，胶囊比例与标题间距正常。

**遗留**

- 返回胶囊与标题在极窄屏（<320px）仍需真机看一眼；当前按 390px 基准。
- 人物/事件/朝代三页右上角仍是「姓氏小印」文字块（现代为蓝灰），与收藏/足迹/搜索页的 `seal.png` 不完全统一；是否统一待确认。
- 历代人物/事件大扩尚未开始（下一步）。

---

## 2026-10-22 · 第二十五轮：历代内容扩展（24 朝代 / 93 史事 / 48 人物）

**用户需求**：继续补全历代人物与史事，「全部都加进去」。

**实现**

- 新增 `miniprogram/data/history-extra.js`：补夏、商、西周、春秋、战国、秦、东汉、三国、西晋、东晋、南北朝、隋、五代十国、南宋、辽、西夏、金、元 18 个朝代；新增 52 条史事、25 位人物（孔子、老子、商鞅、秦始皇、司马迁、张衡、蔡伦、曹操、诸葛亮、王羲之、陶渊明、祖冲之、隋文帝、武则天、玄奘、李白、岳飞、朱熹、成吉思汗、忽必烈、朱元璋、朱棣、李时珍、徐光启、宋应星等）。
- `history.js` 合并扩展数据：periods 按起始年排序，persons 按时代排序；`events.unshift` 保持发现页精选仍为近现代。最终 **24 朝代 / 93 史事（75 古代 + 18 近现代）/ 48 人物 / 2 专题**。
- `period.js` 补齐 24 个朝代 PERIOD_META（配图/纪年/小印）；时代脉络改为按年份统一输出「公元前202–前91年」「公元626–875年」，不再混用 yearText。
- `eraImages.js` 增加东汉、东晋、南北朝、南宋的配图与缩略图映射；无专属绘画的朝代继续回退 `palace.jpg`。
- 首页「朝代/人物」弹层现在可浏览全部 24 朝代、48 人物；搜索热词改为孔子/秦始皇/赤壁之战/岳飞/张居正/辛亥革命。发现页仍保留 6 张精选朝代卡。
- 修复首页弹层：`sheetUp` 去掉 opacity 动画，避免弹层半透明；「历史上的今天」footer 改用 `tihMore` 布尔量，避免预览 harness 把 `>` 解析成文本。截图 harness 在 `?shot=1` 时禁用动画，保证截到最终态。

**校验**

- `node tools/selftest.js` **PASS 1271 / FAIL 0**：数据计数、id 唯一、人物 relatedEvents、时间轴 75 条排序、秦/南宋/明/清/唐朝代页、搜索热词、统计 24/93/48/2。
- `python tools/validate_miniprogram.py` OK（10 pages）；`node tools/build_data_json.js` 重建 `history.json` 144.4KB（24/93/48）；`node tools/build_preview.js` 完成。
- 20 张标准截图重截；另核对孔子/秦始皇/岳飞详情、秦/南宋/夏朝代页、首页 24 朝代与 48 人物弹层、XL 字号。

**遗留**

- 新增内容仍需逐条历史审校；部分人物配图回退 `palace.jpg`，后续可补专属绘画。
- 发现页仅展示 6 个精选朝代，其余经首页弹层/搜索进入；若希望发现页展示全部 24 个，需要再设计分组长卷。
- 西晋补「八王之乱」「永嘉之乱」两条，避免朝代页空白。

---

## 2026-10-23 · 第二十六轮：返回胶囊等比修正 + 补全八代人物（24 / 100 / 72 / 2）

**用户需求**：返回按钮在截图中仍显得变形，要求等比例展示；同时按开发计划继续补全历代人物。

**返回胶囊修正**

- 复现后确认：小程序 WXML 已用 `aspectFit`，但预览 harness 把 `<image>` 当普通 `<img>`，没有实现 `mode`，截图时按容器 `56×24rpx` 强行拉伸，造成“预览变形”的误判；真机与预览表现不一致。
- 六页（person/event/period/search/favorites/footprints）统一改为 `mode="widthFix"`，箭头 CSS 改为 `width:56rpx; height:auto; top:50%; transform:translateY(-50%)`，由图片原始 `128×56` 比例决定高度，彻底消除纵向拉伸。
- 「返回」文字不再铺满整个胶囊居中，改为右侧独立区域 `left:76rpx; right:18rpx`，避免设备缺楷体、回退到宋体后字宽变大压住箭头；字号/颜色保持原样。
- 预览 harness 新增 `mode` 支持：`aspectFit→object-fit:contain`、`aspectFill→cover`、`widthFix→height:auto`、`heightFix→width:auto`；以后所有图片截图都与小程序一致。
- 另截图核对事件页、人物页、四字标题事件页，箭头头尾完整、比例与文字间距正常。

**内容扩展**

- 新增 7 条史事：妇好领兵征伐（约前1200）、秦拔郢都屈原投江（前278）、西晋灭吴（280）、《三国志》成书（290）、宋灭南唐（975）、庆历新政（1043）、开馆编纂《四库全书》（1773）。
- 新增 24 位人物：大禹、商汤、妇好、周武王、周公旦、屈原、光武帝、班超、司马炎、陈寿、孝文帝、隋炀帝、朱温、李煜、耶律阿保机、萧绰、李元昊、完颜阿骨打、范仲淹、郭守敬、张居正、康熙、乾隆、孙中山。
- 夏、商、西周、西晋、五代十国、辽、西夏、金 8 个此前无人物条目的时代全部补齐；所有新人物 `relatedEvents` 均指向真实史事。
- 数据规模：**24 朝代 / 100 史事（82 古代 + 18 近现代）/ 72 人物 / 2 专题**；`history.json` 重建为 169.1KB。

**校验**

- `node tools/selftest.js` **PASS 1492 / FAIL 0**：计数、id 唯一、全员 relatedEvents 闭环、八代人物覆盖、北宋新增庆历新政、清新增四库全书、澶渊之盟反查萧绰、六页返回箭头 widthFix/height:auto 断言。
- `python tools/validate_miniprogram.py` OK（10 pages）；`node tools/build_data_json.js`；`node tools/build_preview.js`。
- 20 张标准截图全部重截；另抽查大禹、妇好、李煜、完颜阿骨打人物页与四库全书事件页。

**遗留**

- 返回胶囊在极窄屏（<320px）与真机缺楷体环境仍需开发者工具/真机再看一眼；当前以 390px 为基准。
- 近现代人物仍只有鲁迅，下一步优先补孙中山之外的思想家、文学家、科学家与改革开放人物。
- 内容仍为单人轻量版：距开发大纲约 120 人物 / 400 史事 / 12 专题还有距离，继续按批次扩充并做史料审校。

---

## 2026-10-23 · 第二十七轮：APK 资料库接入（28,248 条）

**用户需求**：分析用户提供的 `org.raphets.history` APK，把其中的历史、文献数据导入现有「史页」小程序，并继续确认返回按钮等比展示。

**数据导入**

- 原始 APK 解包与解密只在本地 `import/apk-assets/` 进行，`import/` 已加入 `.gitignore`，不进入仓库；不修改 APK 原文件。
- 新增 `tools/import_apk_data.py`，从 SQLCipher 库读取 `history_card_v2`、`history_event_v17`、`figure_list_v4`、`emperor_v7`、`war_v4`、`dynasty_event_v2`、`quotation_v3`；另读取明文 SQLite `poem2.db`、`wenyanwen.db`、`official_data.db`。
- 资料统一为 `id/title/meta/summary/text/facts/source/era` 结构；辞条额外带 `type`，名句额外带 `translation`。
- 已导入 **28,248 条**：
  - 典籍辞条 13,285（9 类：职官辞典、典故小词典、历史文化常识、成语故事、历代诗词名句鉴赏、历史典故、历史年表、诸子百家名句赏析、二十五史名句赏析）
  - 历代人物 4,869
  - 历史事件 705
  - 历代帝王 373
  - 历代战争 466
  - 三国纪事 29
  - 名句赏析 677
  - 文言辞条 3,889（`wenyanwen.db`）
  - 诗文名句 3,955（`poem2.db` 的 `quotes`，已与名句赏析去重）
- `official_data.db` 的 3,721 条与「职官辞典」重复 3,717 条，未单独导入；`poem2.db` 的 10,817 篇诗文全文因单类体积与列表承载限制暂未导入，后续如需全文，应做分卷或后端分页。
- 生成文件：`miniprogram/data/apk/catalog.json`、`cards/*.json`、`figures/events/emperors/wars/dynasty-events/quotes/wenyanwen/poem-quotes.json`，以及 `miniprogram/data/archive-meta.js`；JSON 合计约 23.0MB，最大单文件 `cards/6.json` 约 3.63MB。
- 资料 ID 全量校验唯一；修复帝王表重复 `figure_id` 导致的 ID 冲突，帝王 ID 改为 `hem-{序号}-{figure_id}`。

**小程序接入**

- 新增三页：`pages/archive/`（资料库首页）、`pages/archive-list/`（分类/搜索/加载更多）、`pages/archive-detail/`（正文分段、资料卡、译文、分享）。
- 发现页新增「史页资料库」入口与总量、辞条数展示，入口跳 `/pages/archive/archive`。
- 数据走远端按需加载：`utils/apkData.js` 以 jsDelivr 为基址，内存缓存 + 7 天本地缓存 + 并发请求合并；单类 UTF-8 超过 1.5MB 只保留内存缓存，避免挤占小程序 10MB 本地存储。
- `miniprogram/project.config.json` 增加 `data/apk` 的 `packOptions.ignore`，资料 JSON 不进入主包；主包仍保持 2MB 以内。
- 资料库详情页不引用 APK 内百度/搜史外部图片，避免小程序域名白名单问题；正文按 `\n` 分段，`###` 行渲染为小标题。
- 资料库条目暂未接入收藏/足迹，避免改动现有 `utils/entries.js` 的解析逻辑。

**返回按钮**

- 返回胶囊保持 `240×56rpx`；箭头仍用 `assets/back-arrow.png`（原始 128×56）+ `mode="widthFix"` + `height:auto`，文字在右侧独立区域。
- 预览 harness 已支持 `mode` 与 `wx:elif`，并修复资料库条件渲染；21–25 号截图核对箭头头尾完整、箭头/文字间距正常。
- 本轮未在微信开发者工具/真机实际编译，胶囊避让、底部安全区仍需真机确认。

**校验**

- `node tools/selftest.js`：**PASS 1544 / FAIL 0**；新增资料库入口、分类/人物/名句/文言/诗文列表、详情分段、分享参数、返回胶囊断言，页面总数 13。
- `python tools/validate_miniprogram.py`：`OK: 13 pages, JSON/assets/WXML checks passed.`
- `node tools/build_preview.js`：13 页打包成功；`node tools/preview_shots.js`：25 张截图全部成功，新增 `21-archive`、`22-archive-list`、`23-archive-detail`、`24-archive-wenyan`、`25-archive-poemquote`。
- `miniprogram/data/history.json` 未改数据，仅按流程重建后还原，避免无关 `builtAt` diff。

**遗留 / 下一步**

- 真机核对资料库首次加载耗时、缓存占用、返回胶囊、底部安全区。
- 资料库数据仍需逐条史实/授权审校；`poem2.db` 诗文全文、`official_data.db` 去重后增量可按需追加。
- 是否把资料库条目接入收藏/足迹，需先扩展 `entries.js` 与「我的」页分组。

---

## 2026-10-23 · 第二十八轮：补齐 APK 诗文全文与职官增量（39,067 条）

**用户需求**：把上一轮暂未纳入的 APK 数据也加入小程序，沿用现有资料库/远端按需加载架构，不破坏现有种子数据与阅读功能。

**数据导入**

- `poem2.db` 的 `works` 全部 10,817 篇诗文全文纳入：
  - 诗 2,938、词 4,523、文 2,991、曲 338、赋 27。
  - 每篇正文统一整理为 `### 题解 / ### 原文 / ### 注释 / ### 译文 / ### 赏析 / ### 名家点评 / ### 前言` 分段，空段自动省略；列表摘要取题解或原文前 96 字。
  - 按体裁拆分索引与分卷：`data/apk/poems/<shi|ci|wen|qu|fu>/index.json` 只存列表字段，`00.json`… 为详情分卷。诗/词/曲/赋每册 300 篇，文每册 100 篇，共 59 册详情分卷。
  - 最大分卷为 `poems/wen/` 约 3.06MB；最大索引为 `poems/ci/index.json` 约 1.77MB；全库最大 JSON 仍是 `cards/6.json` 约 3.63MB。
- `official_data.db` 去重后仅 2 条未收录，补入职官辞典；职官辞典由 3,718 增至 3,720，辞条总数 13,287。
- 当前资料总量 **39,067 条**：辞条 13,287 / 人物 4,869 / 事件 705 / 帝王 373 / 战争 466 / 三国纪事 29 / 名句 677 / 文言辞条 3,889 / 诗文名句 3,955 / 诗文全文 10,817。
- `catalog.json` 与 `archive-meta.js` 的 sections 增至 13 个；JSON 合计 83,512,583 bytes（约 83.5MB）。`history.json` 未改，现有 24 朝代 / 100 史事 / 72 人物 / 2 专题保持不变。

**小程序接入**

- `utils/apkData.js` 新增 `poems-<genre>` 路径映射：列表加载 `poems/<genre>/index.json`，详情按 `type=shard` 加载 `poems/<genre>/<shard>.json`，沿用内存缓存、7 天本地缓存与并发合并。
- `archive-list` 列表条目透传 `data-shard`；诗文条目点击时把 `shard` 作为详情 `type`，其余资料仍用原分类 `type`。诗文列表搜索提示改为“搜索篇名 / 作者 / 朝代”，搜索范围是索引字段，不加载全文分卷。
- `archive-detail` 对 `poems-*` 关闭摘要重复展示，正文直接按 `###` 分段渲染；分享参数保留 `type=shard`，可回到同册详情。
- 资料库首页自动多出 5 个诗文入口（诗/词/文/曲/赋），仍由 `archive-meta.js` 驱动，无需新增页面。

**返回按钮**

- 返回胶囊未改：`240×56rpx` + `assets/back-arrow.png` + `mode="widthFix"` + `height:auto`；26/27 号截图核对箭头比例正常，真机仍待确认。

**校验**

- `node tools/selftest.js`：**PASS 1553 / FAIL 0**；新增诗文列表总数/搜索提示/分卷字段、详情原文分段、非重复摘要断言。
- `python tools/validate_miniprogram.py`：`OK: 13 pages, JSON/assets/WXML checks passed.`
- `node tools/build_preview.js` 成功；`node tools/preview_shots.js` **27 张截图全部成功**，新增 `26-archive-poems`、`27-archive-poem-detail`。
- 数据完整性额外校验：5 个体裁索引中的 `shard` 均有对应分卷文件（0 缺失），体裁内 ID 无重复；诗文详情 `hpw-10020`《问刘十九》可正常打开。
- 截图核对：资料库首页显示 39,067 条与 9 类辞条；诗文列表 2,938 条、60 条首屏、朝代/作者/体裁元信息完整；详情页题解、原文、注释、译文、赏析分段正常。

**遗留 / 下一步**

- 真机核对诗文索引（1–1.8MB）与单册详情（最大约 3.06MB）的首次加载耗时、缓存占用、返回胶囊与底部安全区。
- 诗文列表只做索引字段搜索，暂不支持全文检索；如需要，另建轻量全文索引或后端搜索。
- 资料库仍未接入收藏/足迹；接入前需扩展 `utils/entries.js` 与「我的」页分组。
- 数据仍需逐条史实/授权审校。

---

## 2026-10-23 · 第二十九轮：资料库首页 UI 修复

**用户反馈**：`pages/archive/archive` 在真机/开发者工具中，9 个辞条分类变成单列窄卡，右侧大量留白；顶栏小印与微信原生胶囊重叠。

**调整**

- 辞条分类改为稳定的两列布局：去掉对 `flex gap` 的依赖，卡片使用 `width: 48.5%` + `box-sizing: border-box` + `justify-content: space-between`，避免旧基础库下 `calc(50% - 7rpx)` 与 padding 叠加导致换行。
- 分类卡补充 `:active` 状态与底部间距，9 类在移动端恢复为 5 行两列。
- 资料库顶栏移除右侧小印，避免与微信原生胶囊重叠；标题仅保留「返回 + 史页 · 资料库」。
- 第二段标题由「人物 · 事件 · 文献」改为「人物 · 事件 · 文献 · 诗文」，与现有 13 个入口一致。
- 重建预览 bundle 并重截 `21-archive.png`；另用滚动截图核对第二段 13 行入口布局。

**校验**

- `node tools/selftest.js`：**PASS 1553 / FAIL 0**。
- `python tools/validate_miniprogram.py`：`OK: 13 pages, JSON/assets/WXML checks passed.`
- `node tools/build_preview.js` / `node tools/preview_shots.js`：27 张截图成功；`21-archive.png` 已更新为两列布局。
- 仍需在微信开发者工具/真机确认原生胶囊位置、底部安全区与分类卡在窄屏（320px）下的文字换行。

---

## 2026-10-23 · 第三十轮：资料库分类折叠 + 全站顶栏避让

**用户需求**：继续优化 UI/交互，不要一进页面就铺开大量分类/条目；按分类组织；逐页检查并自测。

**资料库首页**

- 首屏从「9 个辞条卡 + 13 行入口」改为 **4 个默认收起的分类组**：
  - 典籍辞条：9 类，13,287 条
  - 人物与事件：5 类，6,442 条
  - 诗文：6 类，14,772 条
  - 文献：2 类，4,566 条
- 四组合计 39,067 条；每组显示序号、条目数、条数与一句说明，点击组头展开/收起，一次只展开一组。
- 展开后使用单列入口行（名称 / 示例或说明 / 条数 / 箭头），避免再次出现密集双列；保留 `:active` 按下态与箭头旋转动效。
- `archive.js` 新增 `GROUP_DEFS`、`GROUP_KEYS`、`buildRows`、`onToggle`、`onEntry`；保留 `categories`、`sections`、`onCategory`、`onSection` 兼容旧调用和自测。
- `archive.wxml` 用扁平 `rows` 渲染组头和条目，规避嵌套 `wx:for-item` 在旧基础库/预览 harness 中的差异。

**顶栏统一**

- 详情/列表页标题不再带「史页 · 」前缀，改为短页面名：人物 / 事件 / 朝代 / 搜索 / 收藏 / 足迹 / 资料库。
- 小印统一 `position: absolute; right: 200rpx`，位于标题右侧、微信原生胶囊左侧；`archive` 首页继续不显示小印。
- `app.wxss` 增加 `@media (max-width: 360px)`：隐藏 `.page .top-seal`，并把 `.page .top-title` 略移到 `left: 56%`，让窄屏优先保证标题与返回胶囊。
- 复核 `09-search`、`12-person-sushi`、`14-event-chanyuan`、`16-period-han`、`21-archive`、`22-archive-list`、`23-archive-detail`、`28-archive-cards-open`：标题不再被小印压字，展开态列表与底部栏正常。

**校验**

- `node tools/selftest.js`：**PASS 1561 / FAIL 0**；新增「首屏 4 组」「展开 9 类」「再次收起」「诗文组入口」「折叠项进列表」断言。
- `python tools/validate_miniprogram.py`：`OK: 13 pages, JSON/assets/WXML checks passed.`
- `node tools/build_preview.js` 成功；`node tools/preview_shots.js` **28 张截图全部成功**，新增 `28-archive-cards-open`。
- 仍需真机确认：折叠展开后的滚动位置、资料库首次加载耗时、微信原生胶囊实际位置、320px 窄屏布局与底部安全区。

---

## 2026-10-23 · 第三十一轮：人物 / 事件 / 文献 / 诗文 单独成组

**用户反馈**：资料库首页应按「人物 · 事件 · 文献 · 诗文」分别展示，不再把人物和事件合成一组。

**调整**

- 资料库首页分类组由 4 组调整为 5 组，保留典籍辞条，并把人物、事件拆开：
  - 典籍辞条：9 类，13,287 条
  - 人物：2 类（历代人物 4,869 / 历代帝王 373），5,242 条
  - 事件：3 类（历史事件 705 / 历代战争 466 / 三国纪事 29），1,200 条
  - 文献：2 类（名句赏析 677 / 文言辞条 3,889），4,566 条
  - 诗文：6 类（诗文名句 3,955 / 诗 2,938 / 词 4,523 / 文 2,991 / 曲 338 / 赋 27），14,772 条
- 五组合计仍为 39,067 条，数据未增删；首页首屏只显示 5 个组头，默认全部收起。
- 首屏统计改为 `13,287 / 5,242 / 1,200`（典籍辞条 / 人物 / 事件），与分组数量一致，标签由「历代人物 / 历史事件」改为「人物 / 事件」。
- `GROUP_DEFS` / `GROUP_KEYS` 拆分人物与事件；折叠、展开、单组互斥和进入列表逻辑不变。

**校验**

- `node tools/selftest.js`：**PASS 1576 / FAIL 0**；新增五组名称/数量、人物组首条、事件组包含历代战争、首屏统计与分组一致等断言。
- `python tools/validate_miniprogram.py`：`OK: 13 pages, JSON/assets/WXML checks passed.`
- `node tools/build_preview.js` 成功；`node tools/preview_shots.js` **28 张截图全部成功**；`21-archive.png` 已更新为五组首屏，`28-archive-cards-open.png` 仍正常。
- 仍需真机确认五组首屏高度、展开后的滚动位置和原生胶囊位置。

---

## 2026-10-23 · 第三十二轮：资料库分类题图

**用户反馈**：继续优化，有图的位置需要补图。

**调整**

- 新增 `miniprogram/utils/archiveImages.js`，统一管理资料库分类题图，复用现有本地绘画/缩略图，不引入外部图片。
- 资料库首页 5 个分类组各加 84rpx 方形题图：
  - 典籍辞条：`scroll-accent.png`（卷轴山水）
  - 人物：`thumbs/tang-1.jpg`
  - 事件：`thumbs/ming-2.jpg`
  - 文献：`thumbs/song-2.jpg`
  - 诗文：`thumbs/republic-1.jpg`（青绿山水）
- 资料库列表页增加 168rpx 分类题图横幅，标题与条数压在图上；左右渐变遮罩和文字阴影保证白字可读。
- 资料详情页头卡顶部增加 160rpx 分类题图；标题、分类、资料卡仍保持原结构。
- 列表/详情按 `kind` 与 `type` 取栏目题图：人物/帝王用唐画，事件/战争用明画，名句/文言用宋画，诗文用青绿山水，典籍辞条按 9 个分类分别取图，未知栏目回退 `palace.jpg`。
- 不逐条配图：APK 资料没有图片字段，避免把同一张时代画错配给具体人物或事件；题图只承担分类识别与版面节奏。
- `tools/build_preview.js` 补入 `utils/archiveImages.js`，修复预览 harness 因新模块未打包导致的 `SRC[full]` 报错。

**校验**

- `node tools/selftest.js`：**PASS 1582 / FAIL 0**；新增分组题图、列表题图/条数、详情题图断言。
- `python tools/validate_miniprogram.py`：`OK: 13 pages, JSON/assets/WXML checks passed.`
- `node tools/build_preview.js` 成功；`node tools/preview_shots.js` **28 张截图全部成功**。
- 已核对 `21-archive.png`（五组题图）、`22-archive-list.png`（分类横幅 + 列表）、`23-archive-detail.png`（详情题图）、`24–27` 诗文/文言题图、`28-archive-cards-open.png`（展开态）。
- 仍需真机确认：题图在 320px 窄屏的裁切、长分类名的省略、图片加载抖动与顶部胶囊位置。

---

## 2026-10-23 · 第三十三轮：资料详情阅读版式

**用户反馈**：`pages/archive-detail/archive-detail` 页面 UI 需要优化展示。

**调整**

- 正文不再整块铺开：解析 `【原文】/【注释】/【译文】/【赏析】` 与 `### 题解` 等内嵌小标题，按段渲染；小标题用宋体朱砂 + 细渐变线，`原文` 用宋体大行距，`注释/译文` 降一级字号和对比。
- 没有小标题的条目继续按原段落兜底；`item.translation` 与正文里的 `译文` 段去重，避免重复展示。
- 资料卡从整行文字改为 2 列键值网格，显示条目数；字段名与值分层，无字段名的长内容自动整行。
- 头卡分类标签改为药丸样式，meta 加虚线分隔，题图底部渐隐到暖白卡片；来源行改为浅米底注。
- WXML 嵌套循环统一使用默认 `item`，避开预览 harness 对 `wx:for-item` 的兼容差异；无 `source` 时不显示空来源行。
- 数据与题图仍走 `utils/apkData.js` / `utils/archiveImages.js`，不逐条配图。

**校验**

- `node tools/selftest.js`：**PASS 1589 / FAIL 0**；新增名句正文分段、原文小标题、结构化开关、诗文名句资料卡键值、诗文原文段断言。
- `python tools/validate_miniprogram.py`：`OK: 13 pages, JSON/assets/WXML checks passed.`
- `node tools/build_preview.js` 成功；`node tools/preview_shots.js` **28 张截图全部成功**。
- 已核对 `23-archive-detail.png`（四段式正文 + 来源底注）、`25-archive-poemquote.png`（2×2 资料卡）、`27-archive-poem-detail.png`（题解 / 原文 / 注释分段）。
- 仍需真机确认：长文滚动、320px 窄屏资料卡两列换行、字号切换后的段间距。
- 本次只改详情展示层；资料库列表/详情仍按整类 JSON 加载，首屏慢的索引 + 分卷迁移未包含在本轮。

---

## 2026-10-23 · 第三十四轮：轻量列表索引 + 详情分卷

**用户反馈**：做“轻量列表索引 + 详情分卷”，直接解决首屏等待。

**调整**

- 全部资料栏目统一改为「列表索引 + 详情分卷」，不再保留 `cards/<type>.json`、`figures.json`、`wenyanwen.json` 等整类大文件。
  - 索引：`cards/<type>/index.json`、`figures/index.json`、`events/index.json`、`wars/index.json`、`emperors/index.json`、`dynasty/index.json`、`quotes/index.json`、`wenyan/index.json`、`poemquotes/index.json`、`poems/<shi|ci|wen|qu|fu>/index.json`。
  - 分卷：同目录 `00.json`、`01.json`…；非诗文 ≤180 条 / ≤320KB，诗文 ≤120 条 / ≤320KB，按条目数与 UTF-8 字节数双重封顶。
- 索引改为固定列数组 `[id, title, meta, summary, shard]`，摘要压到 44 字，并优先取第一个正文段，去掉 `【原文】【注释】` 等标签，列表预览不再被标签占满。
- `utils/apkData.js` 新增 `loadIndex` / `loadShard`；`load` 只加载索引，`find` 可直接按 `shard` 取单卷。旧分享链接没有 `shard` 时，先查索引定位、再加载对应分卷，保证兼容。
- 列表页只请求 `index.json`；点条目把 `shard` 带进详情页。详情页按 `shard` 只拉一册，分享路径也带 `shard`。
- 缓存改为「单文件 ≤1.5MB + 资料库总预算 5MB」：超预算先淘汰旧分卷，索引优先保留；索引与最近详情分卷仍缓存 7 天。缓存前缀升级为 `shige_apk_v2_`，首次启动清理旧版整类 JSON 缓存，避免旧分卷映射残留。
- 列表搜索改为只覆盖索引字段（标题 / 分类 / 摘要；诗词为篇名 / 作者 / 朝代 / 摘要），不下载正文；全文检索需要另建索引或后端搜索。
- `tools/import_apk_data.py` 重写生成逻辑：清空旧输出后统一生成索引/分卷，并重新切分诗文分卷；39,067 条数据量不变。
- `tools/selftest.js` 增补列表只拉索引、详情只拉分卷、旧整类 JSON 已移除、索引/分卷写入缓存等断言。

**体积变化（单项 UTF-8）**

- `cards/6`：3.46MB → 索引 500KB + 15 卷（单卷最大 322KB）。
- `cards/5`：2.34MB → 索引 607KB + 21 卷（单卷最大 125KB）。
- `figures`：1.47MB → 索引 482KB + 28 卷（单卷最大 60KB）。
- `wenyan`：2.87MB → 索引 565KB + 22 卷（单卷最大 163KB）。
- `poems/ci`：索引 1.77MB → 901KB + 51 卷（单卷最大 321KB）。
- 全部索引合计约 6.0MB，最大单卷 322KB；首屏不再拉整类正文。

**校验**

- `node tools/selftest.js`：**PASS 1600 / FAIL 0**。
- `python tools/validate_miniprogram.py`：`OK: 13 pages, JSON/assets/WXML checks passed.`
- `node tools/build_preview.js` 成功；`node tools/preview_shots.js` **28 张截图全部成功**。
- 已核对 `22-archive-list.png`（摘要干净、分页正常）、`23-archive-detail.png`、`24-archive-wenyan.png`、`25-archive-poemquote.png`、`26-archive-poems.png`、`27-archive-poem-detail.png`。
- 仍需真机确认：jsDelivr 冷启动/缓存命中下的索引首屏耗时、分卷切换、5MB 缓存预算与返回栈表现。

---

## 2026-10-23 · 第三十五轮：返回按钮改为窄纸捻胶囊 + CSS 笔锋

**用户反馈**：左上角返回按钮看起来变形，而且太宽；按现有纸感/墨色风格重新设计，并要求更窄。

**调整**

- 九个详情/列表页（person/event/period/search/favorites/footprints/archive/archive-list/archive-detail）统一重做返回按钮，保留 `bindtap="goBack"` 与原有返回栈行为。
- 不再使用 `assets/back-arrow.png` + `mode="widthFix"`：位图在容器/预览中容易被拉长，是“变形”的根源。箭头改为纯 CSS：
  - `back-icon` + `back-chevron`（12×12rpx，左上/下边框旋转 45°）+ `back-shaft`（22×2rpx 渐变横线）。
  - 中间 1rpx 赭金细分隔线；右侧楷体「返回」。
- 胶囊从 240×56rpx 缩到 **156×56rpx**（约 2.79:1），减少顶部占用，避免与页面名/小印互撞；暖纸渐变 + 赭金细边 + 内高光，按下态 `back-pressed` 轻微缩放。
- 使用 flex 居中排布，去掉原先箭头的绝对定位和文字独立区域；字体回退/不同字号下不会再压住箭头。
- 更新 `tools/selftest.js` 的九页返回按钮断言：CSS 箭头、`back-pressed`、156×56 胶囊。

**校验**

- `node tools/selftest.js`：**PASS 1600 / FAIL 0**。
- `python tools/validate_miniprogram.py`：`OK: 13 pages, JSON/assets/WXML checks passed.`
- `node tools/build_preview.js` 成功；`node tools/preview_shots.js` **28 张截图全部成功**。
- 已核对 `06-period-tang.png`、`12-person-sushi.png`、`22-archive-list.png`、`23-archive-detail.png` 的返回按钮；宽度已收窄，箭头/文字比例正常。
- 仍需真机确认：楷体回退、微信原生胶囊间距、320px 窄屏下的顶栏三者避让。

---

## 2026-10-23 · 第三十六轮：时间轴朝代总览卡片排版

**用户反馈**：时间轴顶部红圈里的「夏—清」数据挤在一段灰色文字里，纪年、朝代混排，阅读和版式都需要优化。

**调整**

- 把头卡拆成三层：标题印章行 / 纪年行 / 朝代行，标题右侧补「23 朝」计数。
- 纪年与朝代各用固定宽度的小标签（楷体赭金），值用宋体墨色，左侧加一条赭金细线，形成清晰的键值层级。
- 朝代不再用一整串文本，改为 `eraList` 动态渲染：每个朝代是独立词元，词元内部带分隔点，换行时不会出现行首孤立「·」。
- 收紧头卡内边距、字号与行高；近现代只有 3 个时代时自动收成单行，不为古代列表留空。
- `timeline.js` 的 `eraMeta` 拆成 `eraRange` / `eraList` / `eraCount`，并移除未使用的 `years` 变量。

**校验**

- `node tools/selftest.js`：**PASS 1600 / FAIL 0**；时间轴断言改为校验 23 个朝代、纪年区间与首尾朝代序列。
- `python tools/validate_miniprogram.py`：`OK: 13 pages, JSON/assets/WXML checks passed.`
- `node tools/build_preview.js` 成功；`node tools/preview_shots.js` **28 张截图全部成功**。
- 已核对 `03-timeline-ancient.png`、`04-timeline-modern.png`：古代 23 朝完整展示且无行首分隔点，近现代 3 朝单行。
- 仍需真机确认：320px 窄屏下「晚清—新中国」标题与小印/计数的避让，以及楷体回退后的行宽。

## 2026-10-23 · 补全 14 个无专属绘画时代的朝代配画（人物/事件"有事件但缺图"清零回退）

- 背景：72 位有 `relatedEvents` 的人物中 47 位时代有专属绘画，25 位（夏/商/西周/春秋/战国/秦/三国/西晋/隋/五代十国/元/辽/西夏/金）时代无绘画、人物页头卡与相关史事缩略图全部回退 `palace.jpg`。
- 新增 `miniprogram/assets/paintings/` 15 张：shanggu/xia/shang/zhou/chunqiu/zhanguo/qin/sanguo/xijin/sui/wudai/yuan/liao/xixia/jin（百度图搜 thumbURL 直下，PIL 压至 640 内、JPEG q74），每张均经目检验收（换图剔除带水印/大标题条/明显错位的候选）。
- 新增 `miniprogram/assets/thumbs/` 60 张（15 画 × 4 个 160×160 细部，JPEG q72），沿用既有派生裁切约定（`tools/add_era_paintings.py` 可复现；Bing 旧 `m="..."` 接口已失效，改走百度通道）。
- `utils/eraImages.js`：`ERA_IMAGES` / `THUMB_BASE` 补全上述时代映射；未知朝代仍回退 `palace.jpg`。
- `tools/selftest.js`：`辽/秦/元/战国` 专属画图断言、缩略图 22 组 × 4 = 88 张、`qidan-916/fen-shu` 头卡断言同步更新。
- 文档：`SOURCES.md` 登记 15 张新画与 60 张派生缩略图（均为未确认授权，上线前需审校）；`AGENTS.md §5` 回退说明更新。
- 验证：`node tools/selftest.js` PASS / FAIL 0；`python tools/validate_miniprogram.py` 通过。
- 遗留：15 张新画未逐张确认授权（标注"未确认授权"）；`ui/preview/era_refetch_sheet*.jpg` 为目检临时产物，不提交。

## 2026-10-23 · 修复主包超限（新增朝代图压缩）

- 背景：上一步新增 15 张朝代画 + 60 张缩略图（合计约 1.1MB 主包增量）使源码包 2217KB 超出微信 2MB 限制，开发者工具预览报错 `source size exceed max limit`。
- 处理：新 15 张朝代画压至 480px / JPEG q70（824→517KB），60 张新缩略图从压缩后的原画重裁 160×160 / q62（270→252KB）；旧 7 张朝代画与 28 张旧缩略图不动。主包从 2465KB 降到约 1972KB，回到限制内。
- 新增 `tools/compress_new_assets.py`（可复现压缩）；`ui/preview/era_refetch_sheet*.jpg` 目检临时总览图已加入 `.gitignore` 不入库。
- 验证：`node tools/selftest.js` PASS 1604 / FAIL 0；`python tools/validate_miniprogram.py` 通过；包体积实测 1972KB < 2048KB。
- 遗留：若后续继续补朝代图，压完先测包体积再提交。

## 2026-10-23 · 首页「历史上的今天」只展示 3 条

- 首页 60s 板块 `loadTih()` 展示上限 6 → 3（`miniprogram/pages/home/home.js`）；`tihTotal` 仍为全量，WXML「共 N 条 · 点击条目看详情」提示不变。
- `tools/selftest.js`：mock 增至 4 条有效项，新增「展示 3 / 总数 4」断言。
- 验证：`node tools/selftest.js` PASS 1605 / FAIL 0。
