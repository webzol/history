"""压缩小程序图片资产以通过 2MB 预览包限制。

- paper-bg.png -> paper-bg.jpg（统一宣纸底，尺寸降到 585x1266，质量 72）
- palace.png -> palace.jpg（hero 插画，卡片底色 #FCFAFB 已有，无需透明通道）
- tang-bg.jpg / song.jpg -> 同名覆盖（宽 900 内，质量 72）
"""
import io
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / 'miniprogram'


def save_jpg(img, path, quality=72, max_w=1200):
    img = img.convert('RGB')
    if img.width > max_w:
        img = img.resize((max_w, round(img.height * max_w / img.width)))
    img.save(path, 'JPEG', quality=quality, optimize=True)
    size = Path(path).stat().st_size // 1024
    print(f'{path.name}: {size} KB  ({img.width}x{img.height})')


bg = Image.open(ROOT / 'assets/paper-bg.png')
print('paper-bg 原尺寸', bg.size)
w = 585
bg2 = bg.resize((w, round(bg.height * w / bg.width)))
save_jpg(bg2, ROOT / 'assets/paper-bg.jpg', quality=72)

palace = Image.open(ROOT / 'assets/palace.png')
print('palace 原尺寸', palace.size)
save_jpg(palace, ROOT / 'assets/palace.jpg', quality=84, max_w=760)

save_jpg(Image.open(ROOT / 'assets/tang-bg.jpg'), ROOT / 'assets/tang-bg.jpg', quality=70, max_w=900)
save_jpg(Image.open(ROOT / 'assets/paintings/song.jpg'), ROOT / 'assets/paintings/song.jpg', quality=74, max_w=900)
