"""Generate the rice-paper background for 史页.

Usage:
    python tools/make_paper_bg.py

Output:
    ui/reference/assets/paper-bg.png

The background is intentionally very low contrast: warm paper, light noise,
faint vertical calligraphy columns, and thin vertical rules. Keep it subtle so
it does not compete with headings and body copy.
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "ui" / "reference" / "assets" / "paper-bg.png"
FONT_PATH = Path("C:/Windows/Fonts/simsun.ttc")

W, H = 750, 1624


def vertical_text(draw, text, x, y, font, fill, step=48):
    for char in text:
        bbox = draw.textbbox((0, 0), char, font=font)
        draw.text((x - (bbox[2] - bbox[0]) / 2, y), char, font=font, fill=fill)
        y += step


def main():
    base = Image.new("RGBA", (W, H), (246, 241, 234, 255))

    # Light paper grain.
    rng = np.random.default_rng(7)
    noise = rng.normal(0, 3.0, (H, W, 1)).repeat(3, axis=2)
    arr = np.asarray(base.convert("RGB")).astype(np.float32) + noise
    arr = np.clip(arr, 0, 255).astype(np.uint8)
    base = Image.fromarray(arr, "RGB").convert("RGBA")

    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Faint vertical rules and binding lines, like bamboo slips.
    for x in (604, 640, 676, 712):
        draw.line([(x, 42), (x, H - 42)], fill=(120, 100, 80, 14), width=1)
    for y in (112, 760, 1380):
        draw.line([(552, y), (W - 18, y)], fill=(120, 100, 80, 10), width=1)

    if not FONT_PATH.exists():
        raise FileNotFoundError(
            "SimSun not found at C:/Windows/Fonts/simsun.ttc; "
            "update FONT_PATH for your OS or skip the calligraphy layer."
        )

    font = ImageFont.truetype(str(FONT_PATH), 44)
    font_small = ImageFont.truetype(str(FONT_PATH), 30)

    vertical_text(draw, "究天人之际", 688, 86, font, (115, 95, 75, 27))
    vertical_text(draw, "通古今之变", 650, 142, font, (115, 95, 75, 22))
    vertical_text(draw, "成一家之言", 614, 104, font, (115, 95, 75, 19))
    vertical_text(draw, "史家之绝唱", 32, 164, font, (115, 95, 75, 17))
    vertical_text(draw, "无韵之离骚", 70, 232, font, (115, 95, 75, 15))

    # A faint seal at the lower right.
    draw.rectangle([666, 1390, 704, 1428], outline=(166, 70, 58, 45), width=2)
    draw.text((675, 1398), "史", font=font_small, fill=(166, 70, 58, 65))

    result = Image.alpha_composite(base, overlay)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    result.convert("RGB").save(OUT, optimize=True)
    print(f"saved {OUT} ({result.size[0]}x{result.size[1]})")


if __name__ == "__main__":
    main()
