# 阅史记文物数据交接

更新于 2026-11-27（北京时间）。当前目录由 36 件扩至 60 件，功能与数据见提交 [`9c5547d`](https://github.com/webzol/history/commit/9c5547dc488e1aee25a7762521c1d0b92a3a1693)。

## 已入库

- 青铜、陶瓷、玉器、书画各 15 件。本批新增 24 件，其中大都会 15 件、克利夫兰 9 件。北魏与隋各新增一个时代筛选，元代新增青花器、书法、山水和界画。元至明等跨期藏品保留馆方定年范围。
- [`catalog.js`](../miniprogram/relics/catalog.js) 维护目录、年代、器类、中文解说和详情图比例。[`relic-sources.json`](relic-sources.json) 同序记录馆方藏品页、馆藏号、接口、图像地址和许可。以馆方与馆藏号定位作品，入库时同步维护两份数据。
- `thumb-*.jpg` 为 200×144 列表图，`detail-*.jpg` 为长边不超过 490px 的等比详情图。60 件的 120 张图均随文物分包提供，点击首页文物入口时才下载分包。列表首屏 8 条，缩略图懒加载。
- 本次静态估算主包 754.2 KB，文物分包 1054.8 KB，其中媒体 **1001.5 KB**，距 **1024 KB** 媒体预算还有 **22.5 KB**。中文解说待逐条历史审校，真机表现待复核。

## 来源规模与统计口径

以下为 2026-11-27 快照。前两行来自馆方接口的 `total`，入库前按相同查询重新核对数量。

| 来源 | 现有统计 | 复查方式 |
| --- | --- | --- |
| 大都会艺术博物馆 | 亚洲艺术部、中国地域共 **14,392** 条，带图 **12,673** 条候选。逐件以作品接口的 `isPublicDomain` 和 `primaryImageSmall` 判断能否使用图片。 | [有图候选查询](https://collectionapi.metmuseum.org/public/collection/v1.1/search?departmentId=6&geoLocation=China&hasImages=true&limit=1) · [总记录查询](https://collectionapi.metmuseum.org/public/collection/v1.1/search?departmentId=6&geoLocation=China&limit=1) · [馆方 API 文档](https://metmuseum.github.io/) |
| 克利夫兰艺术博物馆 | 中国艺术部共 **2,645** 条，其中同时带图且标为 CC0 的记录 **2,514** 条。逐件核对 `share_license_status` 和 `images.web.url`。 | [CC0 带图查询](https://openaccess-api.clevelandart.org/api/artworks/?department=Chinese%20Art&cc0=1&has_image=1&limit=1) · [部门总记录查询](https://openaccess-api.clevelandart.org/api/artworks/?department=Chinese%20Art&limit=1) · [馆方 API 文档](https://www.clevelandart.org/open-access-api) |
| 台北故宫 | 截至 2026-10-31 馆藏 **699,159 件／册**，约 **41 万幅**开放低分辨率 CC0 图像。馆方文字与中阶图像采用 CC BY 4.0。媒体数可能包含同一藏品的多个视角。目录尚未接入此来源，需另核对字段、逐件许可与下载可达性。 | [馆藏统计](https://www.npm.gov.tw/Articles.aspx?l=1&sno=03001524) · [图像开放说明](https://digitalarchive.npm.gov.tw/Collection) |

两家已接入馆方筛选结果合计 **15,187 条候选**。这是后续筛选的规模估计。入库数还取决于馆藏归属、图片许可、年代、四个器类及重复记录。台北故宫的馆藏与图像统计另计。

## 复现与验证

1. 运行 `node tools/fetch_relic_assets.js`，脚本按目录馆藏编号拉取官方详情记录，校验馆藏号与图片许可，再调用 Pillow 处理图片。获取与处理结果位于忽略目录 `tmp/relic-import-*`。
2. 审查输出中的 `sources.json`、目录内年代与授权字段、图片比例和配图体积。需要从同一批原图重新处理时，运行 `python tools/prepare_relic_images.py <本次输出目录>`。`imageRatio` 为详情图实际高度除以宽度乘 100。
3. 更新目录与配图后，运行 `node tools/build_preview.js`、`node tools/selftest.js`、`node tools/privacy_selftest.js`、`python tools/validate_miniprogram.py` 和 `python tools/content_audit.py`。本次 60 条馆方来源及 120 张配图可复现，2439 项交互自测、14 项隐私自测和 42 张预览回归通过。

## 下一阶段估算

- 若按两馆约 1.52 万条候选做成可检索目录，粗估 **2–5 个工作日**，包括批量获取、授权筛选、去重、分类、远端分页和页面验证。逐条核对中文短解以每件 1–2 分钟计，约 **250–500 工时**，撰写时间另计。估算随筛选规则和实际可用图片数量调整。
- 建议把现有 60 件作为可离线打开的一批，新增条目采用远端分卷索引与按需图片。可参考 `utils/apkData.js` 的首屏索引、分卷与缓存做法。列表保留分页和展示字段裁减，详情与分享继续使用稳定文物 ID。远端文物加载尚未实现。
- 下一轮依次核对素材许可、归属、定年和配图内容，再测小屏特大字号、筛选、长画幅、分享海报、弱网与缓存回退。真机首次分包加载及相册、读屏表现仍待验收。
