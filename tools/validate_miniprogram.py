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
    for page in app["pages"]:
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
    config = json.loads((ROOT / "project.config.json").read_text(encoding="utf-8"))
    ignore_rules = (config.get("packOptions") or {}).get("ignore") or []
    package_budget_kb = 1536
    media_budget_kb = 200

    def is_ignored(rel):
        rel = rel.replace("\\", "/")
        for rule in ignore_rules:
            value = rule.get("value", "").replace("\\", "/").rstrip("/")
            if value and (rel == value or rel.startswith(value + "/")):
                return True
        return False

    total = 0
    media = 0
    for path in ROOT.rglob("*"):
        if not path.is_file() or is_ignored(str(path.relative_to(ROOT))):
            continue
        if path.name in {"project.config.json", "project.private.config.json"} and path.parent == ROOT:
            continue
        size = path.stat().st_size
        total += size
        if path.suffix.lower() in MEDIA_SUFFIXES:
            media += size
    size_kb = total / 1024
    media_kb = media / 1024
    if size_kb >= package_budget_kb:
        errors.append(f"main package {size_kb:.1f}KB must be below {package_budget_kb}KB")
    if media_kb >= media_budget_kb:
        errors.append(f"packaged images/audio {media_kb:.1f}KB must be below {media_budget_kb}KB")
    if app.get("lazyCodeLoading") != "requiredComponents":
        errors.append("app.json must enable requiredComponents lazy code loading")

    if errors:
        print("FAIL")
        for error in errors:
            print(" -", error)
        raise SystemExit(1)

    print(
        f"OK: {len(app['pages'])} pages, main package {size_kb:.1f}KB / {package_budget_kb}KB, "
        f"images/audio {media_kb:.1f}KB / {media_budget_kb}KB, "
        "JSON/assets/WXML checks passed."
    )


if __name__ == "__main__":
    main()
