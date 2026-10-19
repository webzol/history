"""从 palace.jpg 裁出首页同款"史载"朱砂印章缩略图 -> assets/seal.png"""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1] / 'miniprogram/assets'
palace = Image.open(root / 'palace.jpg').convert('RGB')
w, h = palace.size

# 检测印章的红色像素包围盒（朱砂：r 高、r-g 差大）
min_x, min_y, max_x, max_y = w, h, 0, 0
px = palace.load()
for y in range(h):
    for x in range(w):
        r, g, b = px[x, y]
        if r > 120 and r - g > 50 and r - b > 50:
            min_x, min_y = min(min_x, x), min(min_y, y)
            max_x, max_y = max(max_x, x), max(max_y, y)

print('red bbox:', min_x, min_y, max_x, max_y)
# 2px 余量
box = (max(0, min_x - 2), max(0, min_y - 2), min(w, max_x + 3), min(h, max_y + 3))
seal = palace.crop(box)
seal.save(root / 'seal.png', optimize=True)
print('saved seal.png', seal.size, (root / 'seal.png').stat().st_size, 'bytes')
