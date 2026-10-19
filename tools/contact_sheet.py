"""百度图搜候选 → 网格对比图。

用法：python tools/contact_sheet.py <查询词> <输出网格图> [n=9]
"""
import io
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from fetch_images import baidu_search, UA

from PIL import Image, ImageDraw

query, out_path = sys.argv[1], sys.argv[2]
n = int(sys.argv[3]) if len(sys.argv) > 3 else 9

results = baidu_search(query, limit=n)
tiles = []
for r in results:
    try:
        req = urllib.request.Request(r['murl'], headers={'User-Agent': UA,
                                                        'Referer': 'https://image.baidu.com/'})
        data = urllib.request.urlopen(req, timeout=12).read()
        img = Image.open(io.BytesIO(data)).convert('RGB')
        tiles.append((img, r['murl']))
    except Exception:
        continue

cols = 3
rows = (min(len(tiles), n) + cols - 1) // cols
cell = 300
sheet = Image.new('RGB', (cols * cell, rows * cell), 'white')
draw = ImageDraw.Draw(sheet)
for i, (img, url) in enumerate(tiles[:rows * cols]):
    img.thumbnail((cell, cell))
    x, y = (i % cols) * cell, (i // cols) * cell
    sheet.paste(img, (x + (cell - img.width) // 2, y + (cell - img.height) // 2))
    draw.text((x + 6, y + 4), str(i), fill='red')
sheet.save(out_path)
print('%d tiles -> %s' % (len(tiles), out_path))
for i, (img, url) in enumerate(tiles):
    print(i, url[:110])
