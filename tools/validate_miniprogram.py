"""Static checks for the 史页 WeChat mini program.

Usage:
    python tools/validate_miniprogram.py

Checks:
- JSON files parse
- pages listed in app.json have js/json/wxml/wxss
- local asset references in WXML exist
- WXML tags are balanced (best-effort)
- WXML interpolation expressions are well-formed ({{...}} pairs, balanced quotes)
"""

import json
import re
import subprocess
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "miniprogram"
VOID = {"image", "input", "br", "hr", "meta", "link"}
MEDIA_SUFFIXES = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".ico",
                  ".mp3", ".aac", ".wav", ".m4a", ".ogg", ".amr", ".flac"}


class Checker(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.errors = []

    def handle_starttag(self, tag, attrs):
        if tag not in VOID:
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if not self.stack:
            self.errors.append(f"unexpected </{tag}>")
            return
        if self.stack[-1] == tag:
            self.stack.pop()
        else:
            self.errors.append(f"expected </{self.stack[-1]}>, got </{tag}>")
            if tag in self.stack:
                while self.stack and self.stack[-1] != tag:
                    self.stack.pop()
                if self.stack:
                    self.stack.pop()


def main():
    errors = []

    for path in ROOT.rglob("*.json"):
        try:
            json.loads(path.read_text(encoding="utf-8"))
        except Exception as exc:
            errors.append(f"JSON {path.relative_to(ROOT)}: {exc}")

    app = json.loads((ROOT / "app.json").read_text(encoding="utf-8"))
    subpackages = app.get("subPackages", [])
    pages = app["pages"] + [f"{pack['root']}/{page}" for pack in subpackages for page in pack["pages"]]
    for page in pages:
        for ext in ("js", "json", "wxml", "wxss"):
            path = ROOT / f"{page}.{ext}"
            if not path.exists():
                errors.append(f"missing page file: {path.relative_to(ROOT)}")

    for wxml in ROOT.rglob("*.wxml"):
        text = wxml.read_text(encoding="utf-8")
        for src in re.findall(r'src="([^"]+)"', text):
            if src.startswith("/") and not (ROOT / src.lstrip("/")).exists():
                errors.append(f"missing asset: {src} in {wxml.name}")

        # 插值表达式完整性：{{...}} 必须成对，且单个表达式内引号必须配对。
        # wcc 编译器遇到非法表达式会报"unexpected end"（指向文件末尾），极难定位。
        for lineno, line in enumerate(text.splitlines(), start=1):
            if line.count("{{") != line.count("}}"):
                errors.append(f"{wxml.name}:{lineno}: unbalanced mustache braces")
                continue
            for expr in re.findall(r"\{\{([^{}]*)\}\}", line):
                if expr.count('"') % 2 or expr.count("'") % 2:
                    errors.append(f"{wxml.name}:{lineno}: unbalanced quotes in expression: {expr}")

        checker = Checker()
        checker.feed(text)
        if checker.errors:
            errors.extend(f"{wxml.name}: {message}" for message in checker.errors)
        if checker.stack:
            errors.append(f"{wxml.name}: unclosed tags {checker.stack}")

    # 按微信开发者工具的代码质量阈值估算，packOptions.ignore 的文件不计入。
    # 主包媒体预算 200KB：随小程序一起下发，必须守住。分包媒体预算放宽到 1024KB——
    # 分包只在进入对应栏目时才下载，图片留在包内可以离线可读（文物栏目的藏品照即属此类）。
    config = json.loads((ROOT / "project.config.json").read_text(encoding="utf-8"))
    ignore_rules = (config.get("packOptions") or {}).get("ignore") or []
    package_budget_kb = 1536
    media_budget_kb = {"main": 200}
    subpackage_media_budget_kb = 1024

    def is_ignored(rel):
        rel = rel.replace("\\", "/")
        for rule in ignore_rules:
            value = rule.get("value", "").replace("\\", "/").rstrip("/")
            if value and (rel == value or rel.startswith(value + "/")):
                return True
        return False

    package_roots = [pack["root"].rstrip("/") for pack in subpackages]
    package_sizes = {name: [0, 0] for name in ["main", *package_roots]}
    for path in ROOT.rglob("*"):
        relative = path.relative_to(ROOT).as_posix()
        if not path.is_file() or is_ignored(relative):
            continue
        if path.name in {"project.config.json", "project.private.config.json"} and path.parent == ROOT:
            continue
        size = path.stat().st_size
        package = next((name for name in package_roots if relative.startswith(name + "/")), "main")
        package_sizes[package][0] += size
        if path.suffix.lower() in MEDIA_SUFFIXES:
            package_sizes[package][1] += size
    reports = []
    for package, (total, media) in package_sizes.items():
        size_kb = total / 1024
        media_kb = media / 1024
        media_budget = media_budget_kb.get(package, subpackage_media_budget_kb)
        if size_kb >= package_budget_kb:
            errors.append(f"{package} package {size_kb:.1f}KB must be below {package_budget_kb}KB")
        if media_kb >= media_budget:
            errors.append(f"{package} images/audio {media_kb:.1f}KB must be below {media_budget}KB")
        reports.append(f"{package} package {size_kb:.1f}KB / {package_budget_kb}KB, images/audio {media_kb:.1f}KB / {media_budget}KB")
    if app.get("lazyCodeLoading") != "requiredComponents":
        errors.append("app.json must enable requiredComponents lazy code loading")

    errors.extend(check_relic_catalog())

    if errors:
        print("FAIL")
        for error in errors:
            print(" -", error)
        raise SystemExit(1)

    print(f"OK: {len(pages)} pages, {'; '.join(reports)}. JSON/assets/WXML/WXSS checks passed.")


def jpeg_size(path):
    """读 JPEG 尺寸，避免给静态校验引入 Pillow 依赖。"""
    with open(path, "rb") as handle:
        if handle.read(2) != b"\xff\xd8":
            raise ValueError("not a JPEG")
        while True:
            byte = handle.read(1)
            if not byte:
                raise ValueError("no SOF marker")
            if byte != b"\xff":
                continue
            marker = handle.read(1)
            while marker == b"\xff":
                marker = handle.read(1)
            if marker[0] in range(0xC0, 0xD0) and marker[0] not in (0xC4, 0xC8, 0xCC):
                handle.read(3)  # 段长 + 精度
                height = int.from_bytes(handle.read(2), "big")
                width = int.from_bytes(handle.read(2), "big")
                return width, height
            length = int.from_bytes(handle.read(2), "big")
            handle.seek(length - 2, 1)


def check_relic_catalog():
    """本地和在线目录都要有 thumb/detail 两图，并核对尺寸与 imageRatio。"""
    errors = []
    script = (
        "const c = require(process.argv[1]);"
        "process.stdout.write(JSON.stringify(c.RELICS.map(r => [r.id, r.imageRatio])));"
    )
    try:
        result = subprocess.run(
            ["node", "-e", script, str(ROOT / "relics" / "catalog.js")],
            capture_output=True, text=True, encoding="utf-8", check=True,
        )
        entries = json.loads(result.stdout)
    except Exception as exc:  # node 缺失或 catalog.js 语法错误都在这里暴露
        return [f"relics/catalog.js 无法读取条目：{exc}"]

    remote_file = ROOT / "data" / "relics" / "catalog.json"
    remote_entries = json.loads(remote_file.read_text(encoding="utf-8"))
    images = [(item_id, ratio, ROOT / "relics" / "assets") for item_id, ratio in entries]
    images.extend((item["id"], item["imageRatio"], remote_file.parent / "v1" / "images") for item in remote_entries)
    for relic_id, ratio, directory in images:
        for size in ("thumb", "detail"):
            path = directory / f"{size}-{relic_id}.jpg"
            if not path.exists():
                errors.append(f"relics {relic_id}: 缺少配图 {path.name}")
                continue
            try:
                width, height = jpeg_size(path)
            except (OSError, ValueError, IndexError) as exc:
                errors.append(f"relics {path.name}: 图片无法读取：{exc}")
                continue
            if size == "thumb":
                if (width, height) != (200, 144):
                    errors.append(f"relics {path.name}: 缩略图应为 200×144")
                continue
            if max(width, height) > 490 or min(width, height) <= 0:
                errors.append(f"relics {path.name}: 详情图尺寸超出预算")
                continue
            actual = round(height * 100 / width, 3)
            if abs(actual - ratio) > 0.05:
                errors.append(f"relics {relic_id}: imageRatio {ratio} 与 detail 图实际 {actual} 不符")
    return errors


if __name__ == "__main__":
    main()
