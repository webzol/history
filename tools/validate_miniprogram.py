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
    """全量目录分片一致性（2026-11-28 索引 v2）：
    index-head.json（前 200 行 + 计数元数据）+ index-part-NN.json ↔ 详情分卷 ↔ CDN 配图对账。"""
    relics_dir = ROOT / "data" / "relics"
    head_path = relics_dir / "index-head.json"
    if not head_path.exists():
        return ["relics 分片：缺少 data/relics/index-head.json"]
    try:
        head = json.loads(head_path.read_text(encoding="utf-8"))
    except Exception as exc:
        return [f"relics 分片 index-head.json 解析失败：{exc}"]
    errors = []
    if head.get("v") != 2:
        errors.append(f"relics 分片：head v 应为 2，实际 {head.get('v')}")
    total = head.get("total")
    step = head.get("step") or 200
    parts = head.get("parts")
    head_rows = head.get("rows") or []
    if not isinstance(total, int) or total < 1:
        return errors + [f"relics 分片：head total 非法 {total}"]
    if parts != (total + step - 1) // step:
        errors.append(f"relics 分片：parts {parts} 与 total/step 不一致")
    if len(head_rows) != min(total, step):
        errors.append(f"relics 分片：head 行数 {len(head_rows)} 应为 {min(total, step)}")
    for field in ("types", "eras", "typeCounts", "eraCounts", "typeCovers", "eraCovers", "joint"):
        if not isinstance(head.get(field), dict if field in ("typeCounts", "eraCounts", "typeCovers", "eraCovers", "joint") else list):
            errors.append(f"relics 分片：head 缺少 {field}")
    if errors:
        return errors  # 结构不完整时不再往下对账

    # part-NN 与详情分卷号对齐（part NN 的行 = detail NN 的条目），按序合并成全量行
    idx_parts = parts - 1 if total > step else 0
    rows = list(head_rows)
    for n in range(1, idx_parts + 1):
        part_path = relics_dir / f"index-part-{n:02d}.json"
        if not part_path.exists():
            errors.append(f"relics 分片：缺少 index-part-{n:02d}.json")
            continue
        try:
            part = json.loads(part_path.read_text(encoding="utf-8"))
        except Exception as exc:
            errors.append(f"relics 分片 index-part-{n:02d}.json 解析失败：{exc}")
            continue
        expect = min(step, total - n * step)
        if part.get("v") != 2:
            errors.append(f"relics index-part-{n:02d}：v 应为 2，实际 {part.get('v')}")
        part_rows = part.get("rows") or []
        if len(part_rows) != expect:
            errors.append(f"relics index-part-{n:02d}：行数 {len(part_rows)} 应为 {expect}")
        rows.extend(part_rows)

    ids = [row.get("id") for row in rows]
    if len(set(ids)) != len(ids):
        errors.append("relics 分片：索引 id 重复")
    if total != len(rows):
        errors.append(f"relics 分片：total {total} 与合并行数 {len(rows)} 不一致")

    # head 筛选计数与全量行重算一致（ERA_ALIAS 与 build_relics_full.py 一致）
    era_alias = {
        "新石器时代": ["新石器时代"], "二里头文化": ["二里头文化"], "商": ["商"], "西周": ["西周"],
        "东周": ["东周", "春秋", "战国"], "汉": ["汉", "秦"],
        "魏晋南北朝": ["魏晋南北朝", "三国", "晋", "南朝", "北朝", "六朝", "隋"],
        "唐": ["唐"], "五代": ["五代"], "宋": ["宋", "辽", "金", "西夏"],
        "元": ["元"], "明": ["明"], "清": ["清"],
    }

    def era_of(period_text):
        for era, aliases in era_alias.items():
            if any(alias in period_text for alias in aliases):
                return era
        return "其他"

    type_counts = {t: 0 for t in head["types"]}
    era_counts = {e: 0 for e in head["eras"]}
    joint = {t: {e: 0 for e in head["eras"]} for t in head["types"]}
    for row in rows:
        era = era_of(row.get("period") or "")
        if row.get("type") in type_counts:
            type_counts[row["type"]] += 1
        if era in era_counts:
            era_counts[era] += 1
        if row.get("type") in joint and era in joint[row["type"]]:
            joint[row["type"]][era] += 1
    if head.get("typeCounts") != type_counts:
        errors.append("relics 分片：head.typeCounts 与全量行重算不一致")
    if head.get("eraCounts") != era_counts:
        errors.append("relics 分片：head.eraCounts 与全量行重算不一致")
    if head.get("joint") != joint:
        errors.append("relics 分片：head.joint 与全量行重算不一致")

    # 分类封面契约：该类第一件精修件优先，否则该类第一件；封面 id 必须在目录内且归属该类
    row_by_id = {row.get("id"): row for row in rows}
    first_type, first_era, cur_type, cur_era = {}, {}, {}, {}
    for row in rows:
        era = era_of(row.get("period") or "")
        first_type.setdefault(row.get("type"), row.get("id"))
        first_era.setdefault(era, row.get("id"))
        if row.get("id") in curated_ratio:
            cur_type.setdefault(row.get("type"), row.get("id"))
            cur_era.setdefault(era, row.get("id"))
    expect_type_covers = {t: cur_type.get(t) or first_type.get(t) or "" for t in head["types"]}
    expect_era_covers = {e: cur_era.get(e) or first_era.get(e) or "" for e in head["eras"]}
    if head.get("typeCovers") != expect_type_covers:
        errors.append("relics 分片：head.typeCovers 与「精修优先、否则首件」规则重算不一致")
    if head.get("eraCovers") != expect_era_covers:
        errors.append("relics 分片：head.eraCovers 与「精修优先、否则首件」规则重算不一致")
    for cat, cover_id in (head.get("typeCovers") or {}).items():
        row = row_by_id.get(cover_id)
        if cat not in type_counts:
            errors.append(f"relics 分片：typeCovers 含未知器类 {cat}")
        elif not row or row.get("type") != cat:
            errors.append(f"relics 分片：器类封面 {cat} → {cover_id} 不属于该类")
    for cat, cover_id in (head.get("eraCovers") or {}).items():
        row = row_by_id.get(cover_id)
        if cat not in era_counts:
            errors.append(f"relics 分片：eraCovers 含未知时代 {cat}")
        elif not row or era_of(row.get("period") or "") != cat:
            errors.append(f"relics 分片：时代封面 {cat} → {cover_id} 不属于该时代")

    detail_entries = {}
    for n in range(parts):
        shard_path = relics_dir / f"detail-{n:02d}.json"
        if not shard_path.exists():
            errors.append(f"relics 分片：缺少 detail-{n:02d}.json")
            continue
        try:
            shard = json.loads(shard_path.read_text(encoding="utf-8"))
        except Exception as exc:
            errors.append(f"relics 分片 detail-{n:02d}.json 解析失败：{exc}")
            continue
        expect = min(step, total - n * step)
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
