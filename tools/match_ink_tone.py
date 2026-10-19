# -*- coding: utf-8 -*-
"""把 person-ink.jpg 的宣纸底色归一到页面统一宣纸色 #F6F1EA。

画像素材本身底色偏深偏黄（实测约 rgb(229,219,210)），
按通道增益整体校正（深色墨迹按比例同样微调），使图像背景与
页面 paper-bg 平均色一致，消除右上角色差。
"""
from pathlib import Path
from PIL import Image
import statistics

root = Path(__file__).resolve().parents[1] / 'miniprogram/assets'
path = root / 'paintings/person-ink.jpg'
img = Image.open(path).convert('RGB')
w, h = img.size
px = img.load()

# 1) 实测上边缘条带的背景色（人物以外的留白区）
rs, gs, bs = [], [], []
for x in range(0, w, 5):
    for y in range(0, max(40, h // 14), 3):
        r, g, b = px[x, y]
        rs.append(r); gs.append(g); bs.append(b)
bg = (statistics.mean(rs), statistics.mean(gs), statistics.mean(bs))
print('measured bg:', [round(v) for v in bg])

TARGET = (246, 241, 234)  # 页面统一宣纸色 #F6F1EA
gain = [min(1.25, t / b) for t, b in zip(TARGET, bg)]
print('gain:', [round(g, 3) for g in gain])

# 2) 逐像素应用增益（曲线裁剪）
lut = []
for g in gain:
    lut += [min(255, int(i * g + 0.5)) for i in range(256)]
img = img.point(lut)

# 校验校正后的背景
px2 = img.load()
rs, gs, bs = [], [], []
for x in range(0, w, 5):
    for y in range(0, max(40, h // 14), 3):
        r, g, b = px2[x, y]
        rs.append(r); gs.append(g); bs.append(b)
print('normalized bg:', round(statistics.mean(rs)), round(statistics.mean(gs)), round(statistics.mean(bs)))

img.save(path, 'JPEG', quality=78, optimize=True)
print('saved', (path.stat().st_size // 1024), 'KB')
