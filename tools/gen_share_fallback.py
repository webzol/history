# -*- coding: utf-8 -*-
# 生成分享海报兜底固定图 assets/share-fallback.jpg：
# canvas 绘制失败 / 导出失败时，分享面板降级展示/保存这张静态宣纸笺卡，
# 保证任何异常下用户看到的都是完整、符合全站风格的卡片（qrshare.js 引用）。
#
# 用法：python tools/gen_share_fallback.py
# 复现：改文案/配色后重跑；输出 520×848（海报 260×424 的 2 倍，主包 2MB 上限下的
# 体积/清晰度平衡；2026-11-14 从 3 倍降为 2 倍 + q75，56KB→约 25KB）。

from PIL import Image, ImageDraw, ImageFont
import os

ROOT = os.path.join(os.path.dirname(__file__), '..')
OUT = os.path.join(ROOT, 'miniprogram', 'assets', 'share-fallback.jpg')
OUT_COVER = os.path.join(ROOT, 'miniprogram', 'assets', 'share-cover-fallback.jpg')

W, H = 520, 848  # 260×424 的 2 倍
PAPER = (246, 241, 234)      # #F6F1EA 宣纸
CARD = (252, 251, 248)       # #FCFBF8 暖白裱底
CANVAS_BG = (239, 233, 221)  # #EFE9DD 占位画心
INK = (31, 29, 25)           # #1F1D19 主墨
GRAY = (95, 90, 82)          # #5F5A52 次墨
FADE = (140, 133, 122)       # #8C857A 淡墨
CINNABAR = (163, 74, 62)     # #A34A3E 朱砂

FONT_KAI = 'C:/Windows/Fonts/simkai.ttf'
FONT_HEI = 'C:/Windows/Fonts/simhei.ttf'

img = Image.new('RGB', (W, H), PAPER)
d = ImageDraw.Draw(img)

# 卷轴形态：顶/底深木墨色轴杆（分段模拟圆柱高光）
def draw_rod(y):
    d.rectangle([0, y, W, y + 8], fill=(46, 40, 32))
    d.rectangle([0, y + 1, W, y + 2], fill=(78, 70, 58))
    d.rectangle([0, y + 6, W, y + 8], fill=(22, 18, 14))
    d.rectangle([0, y, 4, y + 8], fill=(27, 23, 18))
    d.rectangle([W - 4, y, W, y + 8], fill=(27, 23, 18))

draw_rod(0)
draw_rod(H - 8)

# 右缘竖排「阅史记」淡墨透背字
f_bg = ImageFont.truetype(FONT_KAI, 40)
for i, ch in enumerate('阅史记'):
    bbox = d.textbbox((0, 0), ch, font=f_bg)
    d.text((W - 60, 320 + i * 66), ch, font=f_bg, fill=(31, 29, 25, 14))

# 顶/底朱砂界格细线
cinnabar_line = (198, 122, 111)
d.rectangle([72, 60, W - 72, 63], fill=cinnabar_line)
d.rectangle([72, H - 63, W - 72, H - 60], fill=cinnabar_line)

# 裱底（圆角暖白）+ 占位画心
round_r = 18
d.rounded_rectangle([48, 90, W - 48, 480], radius=round_r, fill=CARD)
d.rounded_rectangle([72, 114, W - 72, 456], radius=6, fill=CANVAS_BG)
f_center = ImageFont.truetype(FONT_KAI, 44)
bbox = d.textbbox((0, 0), '阅史记', font=f_center)
d.text(((W - (bbox[2] - bbox[0])) / 2 - bbox[0], 266), '阅史记', font=f_center, fill=(185, 174, 158))

# 朱砂 kicker
f_kicker = ImageFont.truetype(FONT_KAI, 34)
text = '阅 史 记'
bbox = d.textbbox((0, 0), text, font=f_kicker)
d.text(((W - (bbox[2] - bbox[0])) / 2 - bbox[0], 546), text, font=f_kicker, fill=CINNABAR)

# 「共此卷」大字
f_title = ImageFont.truetype(FONT_KAI, 96)
bbox = d.textbbox((0, 0), '共此卷', font=f_title)
d.text(((W - (bbox[2] - bbox[0])) / 2 - bbox[0], 606), '共此卷', font=f_title, fill=INK)

# 淡墨细线
d.rectangle([120, 786, W - 120, 788], fill=(199, 190, 178))

# 楷体名句（通用句）
f_quote = ImageFont.truetype(FONT_KAI, 46)
text = '以千年为卷轴，读万古事'
bbox = d.textbbox((0, 0), text, font=f_quote)
d.text(((W - (bbox[2] - bbox[0])) / 2 - bbox[0], 836), text, font=f_quote, fill=(59, 55, 49))

# 出处行
f_src = ImageFont.truetype(FONT_KAI, 30)
text = '—— 一页一页读历史'
bbox = d.textbbox((0, 0), text, font=f_src)
d.text(((W - (bbox[2] - bbox[0])) / 2 - bbox[0], 916), text, font=f_src, fill=FADE)

# 底部信息区：提示（左）+「史载」印（右）
f_note = ImageFont.truetype(FONT_HEI, 30)
d.text([90, 1006], '转发好友，直达本页', font=f_note, fill=GRAY)
seal = Image.open(os.path.join(ROOT, 'miniprogram', 'assets', 'seal.png')).convert('RGBA')
seal_h = 156
seal_w = round(seal_h * seal.width / seal.height)
seal = seal.resize((seal_w, seal_h), Image.LANCZOS)
img.paste(seal, (W - 96 - seal_w, 972), seal)

# 品牌行
f_brand = ImageFont.truetype(FONT_HEI, 30)
text = '阅史记 · 一页一页读历史'
bbox = d.textbbox((0, 0), text, font=f_brand)
d.text(((W - (bbox[2] - bbox[0])) / 2 - bbox[0], H - 122), text, font=f_brand, fill=FADE)

img.save(OUT, 'JPEG', quality=75, optimize=True)
print('OK', os.path.relpath(OUT, ROOT), img.size)

# ---------------------------------------------------------------------------
# 第二张：海报题图兜底图 share-cover-fallback.jpg（780×426 = 题图区 260×142 的 3 倍）。
# 当前页相关图（远端/回退链）全部获取不到时，drawPoster 画这张作为卷首画，
# 替代原来的灰底占位——保证海报顶部永远是完整的历史视觉。
# ---------------------------------------------------------------------------
CW, CH = 520, 284  # 260×142 的 2 倍（主包体积余量收紧）
cover = Image.new('RGB', (CW, CH), PAPER)
dc = ImageDraw.Draw(cover)

# 淡墨横向界格（上下各一条，卷面留白感）
dc.rectangle([60, 40, CW - 60, 43], fill=(214, 205, 190))
dc.rectangle([60, CH - 43, CW - 60, CH - 40], fill=(214, 205, 190))

# 中央「史载」朱砂大印（半透明贴，像卷首钤印）
seal_raw = Image.open(os.path.join(ROOT, 'miniprogram', 'assets', 'seal.png')).convert('RGBA')
seal_c = seal_raw.resize((125, 216), Image.LANCZOS)
cover.paste(seal_c, ((CW - 125) // 2, 20), seal_c)

# 印下方品牌题字
f_cover = ImageFont.truetype(FONT_KAI, 34)
text = '阅史记 · 卷首'
bbox = dc.textbbox((0, 0), text, font=f_cover)
dc.text(((CW - (bbox[2] - bbox[0])) / 2 - bbox[0], CH - 68), text, font=f_cover, fill=FADE)

cover.save(OUT_COVER, 'JPEG', quality=75, optimize=True)
print('OK', os.path.relpath(OUT_COVER, ROOT), cover.size)
