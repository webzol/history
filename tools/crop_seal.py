"""从 palace.jpg 裁出首页同款"史载"印章，并生成透明背景 PNG（assets/seal.png）。

印章为"白底红边框红字"样式：红色像素保留为前景并做柔边 alpha，
米色/其他背景全部置为透明，这样印在 #FCFBF8 卡片或宣纸上都无缝。
"""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1] / 'miniprogram/assets'
palace = Image.open(root / 'palace.jpg').convert('RGB')
w, h = palace.size

# 1) 检测印章红色像素包围盒
min_x, min_y, max_x, max_y = w, h, 0, 0
px = palace.load()
for y in range(h):
    for x in range(w):
        r, g, b = px[x, y]
        if r > 120 and r - g > 50 and r - b > 50:
            min_x, min_y = min(min_x, x), min(min_y, y)
            max_x, max_y = max(max_x, x), max(max_y, y)

print('red bbox:', min_x, min_y, max_x, max_y)
box = (max(0, min_x - 3), max(0, min_y - 3), min(w, max_x + 4), min(h, max_y + 4))
seal = palace.crop(box)

# 2) 3x 放大后做 alpha 抠图（边更平滑，渲染回 44x74 不虚）
seal = seal.resize((seal.width * 3, seal.height * 3), Image.LANCZOS)

# 3) "红度"决定透明度：红 -> 不透明；米色 -> 透明
alpha = seal.convert('L')
opa = Image.new('L', seal.size, 0)
sp = seal.load()
ap = opa.load()
for y in range(seal.height):
    for x in range(seal.width):
        r, g, b = sp[x, y]
        redness = min(r - g, r - b)      # 双通道降低误判
        a = max(0, min(255, int((redness - 26) * 10)))
        ap[x, y] = a

out = seal.convert('RGB')
out.putalpha(opa)

# 4) 裁掉大片全透明边
bbox = opa.getbbox()
out = out.crop(bbox)
out.save(root / 'seal.png', optimize=True)
print('saved seal.png', out.size, (root / 'seal.png').stat().st_size, 'bytes')
