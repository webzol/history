"""Build list covers and detail photos from a fetch_relic_assets.js output directory."""

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageOps


RESAMPLE = Image.Resampling.LANCZOS
COVER_SIZE = (640, 460)


def gallery_photo(source):
    width, height = COVER_SIZE
    if abs((source.width / source.height) / (width / height) - 1) < 0.1:
        return ImageOps.fit(source, COVER_SIZE, RESAMPLE)

    photo = ImageOps.contain(source, COVER_SIZE, RESAMPLE)
    x = (width - photo.width) // 2
    y = (height - photo.height) // 2
    canvas = Image.new("RGB", COVER_SIZE)
    soft = photo.filter(ImageFilter.GaussianBlur(14))
    mask = Image.new("L", photo.size, 255)
    draw = ImageDraw.Draw(mask)
    canvas.paste(soft, (x, y))

    if x:
        edges = ((0, 0, x), (x + photo.width, photo.width - 1, width - x - photo.width))
        for position, edge, padding in edges:
            if padding:
                strip = soft.crop((edge, 0, edge + 1, photo.height))
                canvas.paste(strip.resize((padding, height)), (position, 0))
        for offset in range(9):
            for column in (offset, photo.width - 1 - offset):
                draw.line((column, 0, column, photo.height), fill=45 + offset * 23)

    if y:
        edges = ((0, 0, y), (y + photo.height, photo.height - 1, height - y - photo.height))
        for position, edge, padding in edges:
            if padding:
                strip = soft.crop((0, edge, photo.width, edge + 1))
                canvas.paste(strip.resize((width, padding)), (0, position))
        for offset in range(12):
            for row in (offset, photo.height - 1 - offset):
                draw.line((0, row, photo.width, row), fill=30 + offset * 19)

    canvas.paste(photo, (x, y), mask)
    return canvas


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("work_dir", type=Path)
    args = parser.parse_args()
    root = args.work_dir
    manifest = json.loads((root / "sources.json").read_text(encoding="utf-8"))
    assets = root / "assets"
    assets.mkdir(exist_ok=True)
    changed_ratios = []

    for item in manifest["sources"]:
        key = item["id"]
        with Image.open(root / "originals" / f"{key}.jpg") as image:
            source = ImageOps.exif_transpose(image).convert("RGB")
        detail = source.copy()
        detail.thumbnail((490, 490), RESAMPLE)
        detail.save(assets / f"detail-{key}.jpg", quality=55, optimize=True)
        cover = gallery_photo(source).resize((200, 144), RESAMPLE)
        cover.save(assets / f"thumb-{key}.jpg", quality=66, optimize=True)
        ratio = round(detail.height * 100 / detail.width, 3)
        if ratio != manifest["expectedRatios"][key]:
            changed_ratios.append(f"{key} imageRatio: {ratio}")

    if changed_ratios:
        raise SystemExit("Review image ratios before putting these assets in the package:\n" + "\n".join(changed_ratios))
    size = sum(file.stat().st_size for file in assets.glob("*.jpg"))
    print(f"Prepared {len(manifest['sources']) * 2} images ({size / 1024:.1f} KB) in {assets}")


if __name__ == "__main__":
    main()
