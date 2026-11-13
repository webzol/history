# -*- coding: utf-8 -*-
# 生成分享海报兜底固定图 assets/share-fallback.jpg：
# canvas 绘制失败 / 导出失败时，分享面板降级展示/保存这张静态宣纸笺卡，
# 保证任何异常下用户看到的都是完整、符合全站风格的卡片（qrshare.js 引用）。
#
# 用法：python tools/gen_share_fallback.py
# 复现：改文案/配色后重跑；输出 780×1272（海报 260×424 的 3 倍，与 canvas destWidth 同倍率）。

from PIL import Image, ImageDraw, ImageFont
import os

ROOT = os.path.join(os.path.dirname(__file__), '..')
OUT = os.path.join(ROOT, 'miniprogram', 'assets', 'share-fallback.jpg')

W, H = 780, 1272  # 260×424 的 3 倍
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

# 顶/底朱砂界格细线
cinnabar_line = (198, 122, 111)
d.rectangle([72, 54, W - 72, 57], fill=cinnabar_line)
d.rectangle([72, H - 57, W - 72, H - 54], fill=cinnabar_line)

# 裱底（圆角暖白）+ 占位画心
round_r = 18
d.rounded_rectangle([48, 84, W - 48, 474], radius=round_r, fill=CARD)
d.rounded_rectangle([72, 108, W - 72, 450], radius=6, fill=CANVAS_BG)
f_center = ImageFont.truetype(FONT_KAI, 44)
bbox = d.textbbox((0, 0), '阅史记', font=f_center)
d.text(((W - (bbox[2] - bbox[0])) / 2 - bbox[0], 260), '阅史记', font=f_center, fill=(185, 174, 158))

# 朱砂 kicker
f_kicker = ImageFont.truetype(FONT_KAI, 34)
text = '阅 史 记'
bbox = d.textbbox((0, 0), text, font=f_kicker)
d.text(((W - (bbox[2] - bbox[0])) / 2 - bbox[0], 540), text, font=f_kicker, fill=CINNABAR)

# 「共此卷」大字
f_title = ImageFont.truetype(FONT_KAI, 96)
bbox = d.textbbox((0, 0), '共此卷', font=f_title)
d.text(((W - (bbox[2] - bbox[0])) / 2 - bbox[0], 600), '共此卷', font=f_title, fill=INK)

# 淡墨细线
d.rectangle([120, 780, W - 120, 782], fill=(199, 190, 178))

# 楷体名句（通用句）
f_quote = ImageFont.truetype(FONT_KAI, 46)
text = '以千年为卷轴，读万古事'
bbox = d.textbbox((0, 0), text, font=f_quote)
d.text(((W - (bbox[2] - bbox[0])) / 2 - bbox[0], 830), text, font=f_quote, fill=(59, 55, 49))

# 出处行
f_src = ImageFont.truetype(FONT_KAI, 30)
text = '—— 一页一页读历史'
bbox = d.textbbox((0, 0), text, font=f_src)
d.text(((W - (bbox[2] - bbox[0])) / 2 - bbox[0], 910), text, font=f_src, fill=FADE)

# 底部信息区：提示（左）+「史载」印（右）
f_note = ImageFont.truetype(FONT_HEI, 30)
d.text([90, 1000], '转发好友，直达本页', font=f_note, fill=GRAY)
seal = Image.open(os.path.join(ROOT, 'miniprogram', 'assets', 'seal.png')).convert('RGBA')
seal_h = 156
seal_w = round(seal_h * seal.width / seal.height)
seal = seal.resize((seal_w, seal_h), Image.LANCZOS)
img.paste(seal, (W - 96 - seal_w, 966), seal)

# 品牌行
f_brand = ImageFont.truetype(FONT_HEI, 30)
text = '阅史记 · 一页一页读历史'
bbox = d.textbbox((0, 0), text, font=f_brand)
d.text(((W - (bbox[2] - bbox[0])) / 2 - bbox[0], H - 116), text, font=f_brand, fill=FADE)

img.save(OUT, 'JPEG', quality=88)
print('OK', os.path.relpath(OUT, ROOT), img.size)
