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
    """文物目录与配图一致性：每件文物在分包内要有 thumb 缩略图（列表离线可读），
    详情大图放 data/img/relics/（jsDelivr 分发，分包不装），catalog.js 的 imageRatio
    必须等于详情图实际高宽比 ×100（页面按它撑图框）。"""
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

    for relic_id, ratio in entries:
        thumb = ROOT / "relics" / "assets" / f"thumb-{relic_id}.jpg"
        detail = ROOT / "data" / "img" / "relics" / f"{relic_id}.jpg"
        if not thumb.exists():
            errors.append(f"relics {relic_id}: 缺少缩略图 {thumb.name}")
        if not detail.exists():
            errors.append(f"relics {relic_id}: 缺少详情图 data/img/relics/{detail.name}")
            continue
        width, height = jpeg_size(detail)
        actual = round(height * 100 / width, 3)
        if abs(actual - ratio) > 0.05:
            errors.append(f"relics {relic_id}: imageRatio {ratio} 与详情图实际 {actual} 不符")

    errors.extend(check_relic_shards(dict(entries)))
    return errors


def check_relic_shards(curated_ratio):
    """全量目录分片一致性：index 行 ↔ 详情分卷 ↔ CDN 配图三方对账。"""
    relics_dir = ROOT / "data" / "relics"
    index_path = relics_dir / "index.json"
    if not index_path.exists():
        return ["relics 分片：缺少 data/relics/index.json"]
    try:
        index = json.loads(index_path.read_text(encoding="utf-8"))
    except Exception as exc:
        return [f"relics 分片 index.json 解析失败：{exc}"]
    errors = []
    rows = index.get("rows") or []
    total = index.get("total")
    step = index.get("step") or 200
    parts = index.get("parts")
    if total != len(rows):
        errors.append(f"relics 分片：total {total} 与 rows {len(rows)} 不一致")
    if parts != (len(rows) + step - 1) // step:
        errors.append(f"relics 分片：parts {parts} 与 rows/step 不一致")
    ids = [row.get("id") for row in rows]
    if len(set(ids)) != len(ids):
        errors.append("relics 分片：索引 id 重复")

    detail_entries = {}
    for n in range(parts or 0):
        shard_path = relics_dir / f"detail-{n:02d}.json"
        if not shard_path.exists():
            errors.append(f"relics 分片：缺少 detail-{n:02d}.json")
            continue
        try:
            shard = json.loads(shard_path.read_text(encoding="utf-8"))
        except Exception as exc:
            errors.append(f"relics 分片 detail-{n:02d}.json 解析失败：{exc}")
            continue
        expect = min(step, len(rows) - n * step)
        if len(shard.get("items") or {}) != expect:
            errors.append(f"relics 分卷 {n}：条数 {len(shard.get('items') or {})} 应为 {expect}")
        detail_entries.update(shard.get("items") or {})

    for row in rows:
        relic_id = row.get("id")
        if not relic_id or not row.get("title") or not row.get("period") or not row.get("type"):
            errors.append(f"relics 索引行字段缺失：{relic_id}")
            continue
        entry = detail_entries.get(relic_id)
        if not entry:
            errors.append(f"relics {relic_id}: 索引行无对应详情分卷条目")
            continue
        if relic_id in curated_ratio:
            continue  # 精修件比例已在上循环校验
        detail = ROOT / "data" / "img" / "relics" / f"{relic_id}.jpg"
        thumb = ROOT / "data" / "img" / "relics" / f"thumb-{relic_id}.jpg"
        if not thumb.exists():
            errors.append(f"relics {relic_id}: 缺少 CDN 缩略图")
        if not detail.exists():
            errors.append(f"relics {relic_id}: 缺少 CDN 详情图")
            continue
        width, height = jpeg_size(detail)
        actual = round(height * 100 / width, 3)
        if abs(actual - entry.get("imageRatio", 0)) > 0.05:
            errors.append(f"relics {relic_id}: imageRatio {entry.get('imageRatio')} 与详情图实际 {actual} 不符")
        if entry.get("t") and len(entry.get("description") or "") < 30:
            errors.append(f"relics {relic_id}: 模板简介过短")
    return errors


if __name__ == "__main__":
    main()
