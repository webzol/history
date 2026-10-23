"""把 APK 内的 SQLCipher / SQLite 历史资料整理成小程序可直接读取的 JSON。

数据源（不提交到仓库）：
  import/apk-assets/assets/*.db

输出（提交到仓库，供 jsDelivr 远端按需加载）：
  miniprogram/data/apk/catalog.json
  miniprogram/data/apk/cards/<type>.json
  miniprogram/data/apk/{figures,events,wars,emperors,dynasty-events,quotes,wenyanwen,poem-quotes}.json
  miniprogram/data/archive-meta.js

用法：
  python tools/import_apk_data.py
"""

from __future__ import annotations

import json
import os
import re
import sqlite3
from pathlib import Path

from sqlcipher3 import dbapi2 as sqlcipher

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "import" / "apk-assets" / "assets"
OUT = ROOT / "miniprogram" / "data" / "apk"
META_JS = ROOT / "miniprogram" / "data" / "archive-meta.js"

KEYS = {
    "history_card_v2.db": "RaphetS@zhls1240497",
    "history_event_v17.db": "RaphetS@zhls1240497",
    "dynasty_event_v2.db": "RaphetS@zhls1240497",
    "figure_list_v4.db": "RaphetS@zhls1240497",
    "emperor_v7.db": "RaphetS@zhls1240497",
    "war_v4.db": "RaphetS@zhls1240497",
    "quotation_v3.db": "123456",
}

PERIODS = [
    (-2070, "夏"), (-1600, "商"), (-1046, "西周"), (-771, "春秋"), (-475, "战国"),
    (-221, "秦"), (-202, "西汉"), (9, "东汉"), (220, "三国"), (265, "西晋"),
    (317, "东晋"), (420, "南北朝"), (581, "隋"), (618, "唐"), (907, "五代十国"),
    (960, "北宋"), (1127, "南宋"), (1271, "元"), (1368, "明"), (1644, "清"),
    (1840, "近现代"),
]


def q(fn: str, sql: str):
    path = ASSETS / fn
    con = sqlcipher.connect(str(path))
    cur = con.cursor()
    cur.execute("PRAGMA key='" + KEYS[fn].replace("'", "''") + "'")
    rows = cur.execute(sql).fetchall()
    con.close()
    return rows


def q_plain(fn: str, sql: str):
    """读取 APK 内的明文 SQLite（poem2 / wenyanwen / official_data）。"""
    path = ASSETS / fn
    con = sqlite3.connect(str(path))
    try:
        rows = con.execute(sql).fetchall()
    finally:
        con.close()
    return rows


def norm(text: str) -> str:
    return re.sub(r"\s+", "", text or "")


def clean(value) -> str:
    if value is None:
        return ""
    text = str(value)
    text = text.replace("\ufeff", "").replace("\u200b", "").replace("\u200c", "")
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    lines = [line.strip() for line in text.split("\n")]
    text = "\n".join(lines)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def cut(text: str, limit: int = 84) -> str:
    text = re.sub(r"\s+", " ", text or "").strip()
    if len(text) <= limit:
        return text
    return text[: limit - 1].rstrip() + "…"


def era_of(dynasty: str, big: str = "") -> str:
    d = (dynasty or "") + " " + (big or "")
    if "中华民国" in d or "民国" in d:
        return "民国"
    if "中华人民共和国" in d or "新中国" in d:
        return "新中国"
    for key, era in [
        ("东晋", "东晋"), ("西晋", "西晋"), ("东汉", "东汉"), ("西汉", "西汉"),
        ("南北朝", "南北朝"), ("五代十国", "五代十国"), ("北宋", "北宋"),
        ("南宋", "南宋"), ("西夏", "西夏"), ("十六国", "十六国"),
        ("夏", "夏"), ("商", "商"), ("西周", "西周"), ("春秋", "春秋"),
        ("战国", "战国"), ("秦", "秦"), ("三国", "三国"), ("晋", "西晋"),
        ("隋", "隋"), ("唐", "唐"), ("辽", "辽"), ("宋", "北宋"),
        ("金", "金"), ("元", "元"), ("明", "明"), ("清", "清"),
        ("上古", "上古"), ("近现代", "近现代"),
    ]:
        if key in d:
            return era
    start = year_of(dynasty)
    if start is not None:
        return era_for_year(start)
    return ""


def year_of(text: str):
    if not text:
        return None
    m = re.search(r"(-?\d{1,7})", text.replace("−", "-"))
    if not m:
        return None
    try:
        return int(m.group(1))
    except ValueError:
        return None


def era_for_year(year):
    if year is None:
        return ""
    for start, name in reversed(PERIODS):
        if year >= start:
            return name
    return "上古"


def dates_of(row: dict) -> str:
    birth = clean(row.get("birthday")) or (str(row.get("birth_year")) if row.get("birth_year") else "")
    death = clean(row.get("deathday")) or (str(row.get("death_year")) if row.get("death_year") else "")
    if birth and death:
        return f"{birth}–{death}"
    if birth:
        return birth
    if death:
        return f"卒于 {death}"
    return ""


def write_json(name: str, data):
    path = OUT / name
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as fh:
        json.dump(data, fh, ensure_ascii=False, separators=(",", ":"))
    return path


def build_cards():
    rows = q(
        "history_card_v2.db",
        "SELECT title, content, author, type, type_name FROM history_card ORDER BY rowid",
    )
    by_type = {}
    for title, content, author, type_, type_name in rows:
        key = clean(type_) or "0"
        name = clean(type_name) or clean(author) or "历史资料"
        by_type.setdefault(key, {"name": name, "items": []})
        text = clean(content)
        by_type[key]["items"].append({
            "id": f"hc-{key}-{len(by_type[key]['items']) + 1:05d}",
            "title": clean(title),
            "meta": name,
            "summary": cut(text, 96),
            "text": text,
            "facts": [],
            "source": name,
            "type": key,
        })

    categories = []
    for key, group in sorted(by_type.items(), key=lambda kv: -len(kv[1]["items"])):
        items = group["items"]
        write_json(f"cards/{key}.json", items)
        categories.append({
            "key": key,
            "name": group["name"],
            "count": len(items),
            "file": f"cards/{key}.json",
            "sample": items[0]["title"] if items else "",
        })
    return categories, sum(c["count"] for c in categories)


def build_events():
    rows = q(
        "history_event_v17.db",
        "SELECT id, title, one_sentence_desc, summary, subject, event_time, sort_time FROM all_history_event ORDER BY sort_time, id",
    )
    items = []
    for idx, (rid, title, desc, summary, subject, event_time, sort_time) in enumerate(rows):
        desc = clean(desc)
        summary = clean(summary)
        text = summary or desc
        year = int(sort_time) if sort_time is not None else None
        facts = []
        if subject:
            facts.append("主题：" + clean(subject))
        if event_time:
            facts.append("时间：" + clean(event_time))
        items.append({
            "id": f"he-{rid}",
            "title": clean(title),
            "meta": clean(event_time),
            "summary": cut(desc or text, 96),
            "text": text,
            "facts": facts,
            "source": "历史事件库",
            "era": era_for_year(year) if year is not None else "",
            "year": year,
        })
        items[-1]["id"] = f"he-{rid}" if rid is not None else f"he-{idx + 1:04d}"
    return items


def build_wars():
    rows = q(
        "war_v4.db",
        "SELECT war_id, war_name, war_time, war_describe, war_type, dynasty FROM war ORDER BY rowid",
    )
    items = []
    for idx, (wid, name, when, desc, typ, dynasty) in enumerate(rows):
        text = clean(desc)
        facts = []
        if dynasty:
            facts.append("朝代：" + clean(dynasty))
        if typ:
            facts.append("类型：" + clean(typ))
        if when:
            facts.append("时间：" + clean(when))
        items.append({
            "id": f"hw-{clean(wid) or idx + 1}",
            "title": clean(name),
            "meta": clean(when),
            "summary": cut(text, 100),
            "text": text,
            "facts": facts,
            "source": "历代战争库",
            "era": era_of(clean(dynasty) or clean(typ)) if (dynasty or typ) else "",
        })
    return items


def build_emperors():
    rows = q(
        "emperor_v7.db",
        "SELECT name, one_sentence_desc, dynasty, temple_name, posthumous_title, reign_name, reign_time, reign_year, age, figure_id, sort_value FROM emperor ORDER BY dynasty, sort_value",
    )
    items = []
    for idx, (name, desc, dynasty, temple, posthumous, reign, reign_time, reign_year, age, figure_id, sort_value) in enumerate(rows):
        facts = []
        for label, val in [
            ("朝代", dynasty), ("庙号", temple), ("谥号", posthumous),
            ("年号", reign), ("在位", reign_time), ("在位年数", reign_year), ("享年", age),
        ]:
            val = clean(val)
            if val:
                facts.append(f"{label}：{val}")
        text = clean(desc)
        items.append({
            "id": f"hem-{idx + 1:04d}" + (("-" + clean(figure_id)) if figure_id else ""),
            "title": clean(name),
            "meta": " · ".join(x for x in [clean(dynasty), clean(temple), clean(reign)] if x),
            "summary": cut(text, 96),
            "text": text,
            "facts": facts,
            "source": "历代帝王库",
            "era": era_of(clean(dynasty)),
        })
    return items


def build_figures():
    rows = q(
        "figure_list_v4.db",
        "SELECT figure_id, figure_name, figure_intro, category, dynasty, tag, alias, birthday, deathday, birth_year, death_year, big_dynasty, fictional, identity FROM figure_list ORDER BY id",
    )
    items = []
    for idx, row in enumerate(rows):
        (figure_id, name, intro, category, dynasty, tag, alias, birthday, deathday,
         birth_year, death_year, big, fictional, identity) = row
        info = {
            "birthday": birthday, "deathday": deathday,
            "birth_year": birth_year, "death_year": death_year,
        }
        dates = dates_of(info)
        roles = clean(identity) or clean(category) or "历史人物"
        intro = clean(intro)
        facts = []
        if dynasty:
            facts.append("朝代：" + clean(dynasty))
        if roles:
            facts.append("身份：" + roles)
        if dates:
            facts.append("生卒：" + dates)
        if alias:
            facts.append("别名：" + clean(alias))
        if tag:
            facts.append("标签：" + clean(tag))
        if fictional:
            facts.append("说明：出自神话传说")
        items.append({
            "id": "hf-" + (clean(figure_id) or f"{idx + 1:04d}"),
            "title": clean(name),
            "meta": " · ".join(x for x in [clean(dynasty), roles] if x),
            "summary": cut(intro, 96),
            "text": intro,
            "facts": facts,
            "source": "历史人物库",
            "era": era_of(clean(dynasty), clean(big)),
            "dates": dates,
        })
    return items


def build_dynasty_events():
    rows = q(
        "dynasty_event_v2.db",
        "SELECT dynasty_event_id, dynasty_event_name, dynasty_event_time, dynasty_event_describe, dynasty_event_content, sort_value FROM dynasty_event ORDER BY sort_value",
    )
    items = []
    for idx, (rid, name, when, desc, content, sort_value) in enumerate(rows):
        text = clean(content)
        summary = clean(desc) or cut(text, 120)
        facts = []
        if when:
            facts.append("时间：" + clean(when))
        facts.append("时期：三国")
        items.append({
            "id": f"hde-{rid if rid is not None else idx + 1}",
            "title": clean(name),
            "meta": clean(when),
            "summary": cut(summary, 120),
            "text": text,
            "facts": facts,
            "source": "三国纪事",
            "era": "三国",
        })
    return items


def build_quotes():
    rows = q("quotation_v3.db", "SELECT content, source, transtation FROM quation ORDER BY rowid")
    items = []
    for idx, (content, source, translation) in enumerate(rows):
        content = clean(content)
        source = clean(source).lstrip("—").strip()
        translation = clean(translation)
        items.append({
            "id": f"hq-{idx + 1:04d}",
            "title": cut(content, 34),
            "meta": source,
            "summary": cut(translation or content, 100),
            "text": content,
            "translation": translation,
            "facts": [f"出处：{source}"] if source else [],
            "source": source or "名句赏析",
            "era": "",
        })
    return items


def build_wenyan():
    rows = q_plain(
        "wenyanwen.db",
        "SELECT id, title, prononunce, pinyin, summary, content FROM cidian ORDER BY CAST(id AS INTEGER), id",
    )
    items = []
    for idx, (rid, title, pronounce, pinyin, summary, content) in enumerate(rows):
        title = clean(title)
        pronounce = clean(pronounce)
        pinyin = clean(pinyin)
        summary = clean(summary)
        content = clean(content)
        facts = []
        if pronounce:
            facts.append("读音：" + pronounce)
        if pinyin:
            facts.append("拼音：" + pinyin)
        items.append({
            "id": f"hwy-{idx + 1:04d}",
            "title": title,
            "meta": pronounce or "文言辞条",
            "summary": cut(summary or content, 96),
            "text": content or summary,
            "facts": facts,
            "source": "文言辞条",
            "era": "",
        })
    return items


def build_poem_quotes(skip=None):
    """诗文名句：poem2.db 的 quotes 是简体原文；*_tr 是繁体，不是译文，故不取。"""
    rows = q_plain(
        "poem2.db",
        "SELECT id, quote, dynasty, author, kind, work_title FROM quotes ORDER BY id",
    )
    kind_cn = {"shi": "诗", "ci": "词", "qu": "曲", "fu": "赋", "wen": "文"}
    seen = set(skip or [])
    items = []
    for rid, quote, dynasty, author, kind, work_title in rows:
        text = clean(quote)
        key = norm(text)
        if not text or key in seen:
            continue
        seen.add(key)
        dynasty = clean(dynasty)
        author = clean(author)
        kind_name = kind_cn.get(clean(kind), clean(kind))
        work_title = clean(work_title)
        facts = []
        for label, val in [
            ("朝代", dynasty), ("作者", author), ("体裁", kind_name), ("出处", work_title),
        ]:
            if val:
                facts.append(f"{label}：{val}")
        items.append({
            "id": f"hpq-{clean(rid)}",
            "title": cut(text, 34),
            "meta": " · ".join(x for x in [dynasty, author, kind_name] if x),
            "summary": "",
            "text": text,
            "translation": "",
            "facts": facts,
            "source": work_title or "诗文名句",
            "era": era_of(dynasty),
        })
    return items


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    categories, card_count = build_cards()
    figures = build_figures()
    events = build_events()
    wars = build_wars()
    emperors = build_emperors()
    dynasty_events = build_dynasty_events()
    quotes = build_quotes()
    wenyan = build_wenyan()
    poem_quotes = build_poem_quotes({norm(x.get("text", "")) for x in quotes})

    for name, items in [
        ("figures.json", figures), ("events.json", events), ("wars.json", wars),
        ("emperors.json", emperors), ("dynasty-events.json", dynasty_events),
        ("quotes.json", quotes), ("wenyanwen.json", wenyan),
        ("poem-quotes.json", poem_quotes),
    ]:
        write_json(name, items)

    sections = [
        {"key": "figures", "name": "历代人物", "count": len(figures), "file": "figures.json", "desc": "按朝代与身份浏览人物小传"},
        {"key": "events", "name": "历史事件", "count": len(events), "file": "events.json", "desc": "从上古到近现代的事件索引"},
        {"key": "emperors", "name": "历代帝王", "count": len(emperors), "file": "emperors.json", "desc": "帝王世系、庙号与在位信息"},
        {"key": "wars", "name": "历代战争", "count": len(wars), "file": "wars.json", "desc": "战争背景与结果速览"},
        {"key": "dynasty", "name": "三国纪事", "count": len(dynasty_events), "file": "dynasty-events.json", "desc": "三国时期专题长文"},
        {"key": "quotes", "name": "名句赏析", "count": len(quotes), "file": "quotes.json", "desc": "原文、出处与白话译文"},
        {"key": "wenyan", "name": "文言辞条", "count": len(wenyan), "file": "wenyanwen.json", "desc": "古文常见字词的读音、释义与例句"},
        {"key": "poemquotes", "name": "诗文名句", "count": len(poem_quotes), "file": "poem-quotes.json", "desc": "历代诗词名句，按朝代与作者浏览"},
    ]
    stats = {
        "cards": card_count,
        "figures": len(figures),
        "events": len(events),
        "emperors": len(emperors),
        "wars": len(wars),
        "dynastyEvents": len(dynasty_events),
        "quotes": len(quotes),
        "wenyan": len(wenyan),
        "poemQuotes": len(poem_quotes),
        "categories": len(categories),
        "total": card_count + len(figures) + len(events) + len(emperors) + len(wars) + len(dynasty_events) + len(quotes) + len(wenyan) + len(poem_quotes),
    }
    catalog = {
        "generatedAt": "2026-10-23",
        "source": "org.raphets.history APK",
        "stats": stats,
        "categories": categories,
        "sections": sections,
    }
    write_json("catalog.json", catalog)
    META_JS.write_text(
        "// 自动生成：python tools/import_apk_data.py（勿手改）\n"
        "module.exports = " + json.dumps(catalog, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
        newline="\n",
    )

    print("APK data imported")
    for key, val in stats.items():
        print(f"  {key}: {val}")
    total_bytes = sum(p.stat().st_size for p in OUT.rglob("*.json"))
    print(f"  json bytes: {total_bytes:,}")


if __name__ == "__main__":
    main()
