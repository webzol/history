# -*- coding: utf-8 -*-
"""核对主库内部一致性、热更 JSON 和资料库分卷。史实原文需另行核源。"""
import io
import json
import re
import subprocess
import sys
from collections import Counter
from datetime import date
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

SEED = 'miniprogram/data/history.js'
REMOTE = 'miniprogram/data/history.json'
ARCHIVE_META = 'miniprogram/data/archive-meta.js'
ARCHIVE_ROOT = Path('miniprogram/data/apk')

# 与 pages/period/period.js 的 MODERN_ERAS 保持一致：近现代面板兼容的 era 别名
MODERN_ERAS = ['晚清', '民国', '新中国', '近现代', '现代']
# 与 period.js 的 PERIOD_ERAS 对齐：这些 era 已并入对应朝代页收录
MERGED_ERAS = {'晚清': '清'}

# 关联史事可追溯前因或遗著刊行，保留有明确正文依据的三处。
CONTEXT_LINKS = {
    ('liu-yuan', 'yongjia-316'),       # 所建政权后来攻灭西晋
    ('wanyan-aguda', 'jin-mie-liao'),  # 起兵者，其继任者灭辽
    ('xu-guangqi', 'nongzheng'),       # 陈子龙等整理遗稿后刊行
}

EVENT_DATE = re.compile(r'(?:约)?(?:公元)?(前)?([1-9]\d*)年(?:(\d{1,2})月(\d{1,2})日)?(?:（约）)?')
PERSON_YEAR = re.compile(r'约?(前)?([1-9]\d*)')


def load_js_data(file):
    r = subprocess.run(
        ['node', '-e', 'console.log(JSON.stringify(require("./" + process.argv[1])))', file],
        capture_output=True, check=True)
    return json.loads(r.stdout.decode('utf-8'))


def has_text(value):
    return isinstance(value, str) and bool(value.strip())


def audit_entries(label, rows, fields, problems):
    for entry_id, count in Counter(r.get('id') for r in rows).items():
        if count > 1:
            problems.append(f'{label} 重复 id: {entry_id}')
    for r in rows:
        rid = r.get('id') or '?'
        for field in ('id', 'source', *fields):
            if not has_text(r.get(field)):
                problems.append(f'{label} {rid} {field} 缺失或为空')
        if label in ('events', 'persons'):
            details = r.get('details')
            if not (isinstance(details, list) and details and all(map(has_text, details))):
                problems.append(f'{label} {rid} details 缺失或包含空段')


def parsed_year(match):
    return (-1 if match[1] else 1) * int(match[2])


def valid_date(year, month, day):
    if not all(type(n) is int for n in (year, month, day)):
        return False
    try:
        date(year, month, day)
        return True
    except ValueError:
        return False


def audit_archive(problems):
    meta = load_js_data(ARCHIVE_META)
    catalogs = meta['categories'] + meta['sections']
    total = 0
    shard_count = 0

    def read(path):
        return json.loads(path.read_text(encoding='utf-8'))

    for catalog in catalogs:
        index_path = ARCHIVE_ROOT / catalog['file']
        folder = index_path.parent
        try:
            index = read(index_path)
            head = read(folder / 'head.json')
            step = head['step']
            if type(step) is not int or step < 1:
                raise ValueError('head.step 必须为正整数')
            parts = max(0, (len(index) - 1) // step)
            if (head['total'], head['parts'], head['items']) != (len(index), parts, index[:step]):
                problems.append(f'{catalog["file"]} head 元数据或前缀不一致')
            for n in range(1, parts + 1):
                if read(folder / f'part-{n}.json') != index[n * step:(n + 1) * step]:
                    problems.append(f'{catalog["file"]} part-{n} 与完整索引不一致')
            if len(index) != catalog['count'] or len({row[0] for row in index}) != len(index):
                problems.append(f'{catalog["file"]} 数量不符或 id 重复')

            shards = {}
            for entry_id, title, subtitle, _, shard in index:
                if shard not in shards:
                    details = read(folder / f'{shard}.json')
                    by_id = {}
                    for entry in details:
                        detail_id = entry['id']
                        by_id[detail_id] = (entry.get('title'), entry.get('meta'), entry.get('shard'))
                        if not has_text(entry.get('text')) or not has_text(entry.get('source')):
                            problems.append(f'{catalog["file"]} {detail_id} 缺少正文或来源字段')
                    if len(by_id) != len(details):
                        problems.append(f'{catalog["file"]} {shard} 有重复详情 id')
                    shards[shard] = by_id
                if not has_text(title) or shards[shard].get(entry_id) != (title, subtitle, shard):
                    problems.append(f'{catalog["file"]} {entry_id} 缺少对应详情或条目信息不一致')
            if sum(map(len, shards.values())) != len(index):
                problems.append(f'{catalog["file"]} 索引与详情分卷总数不一致')
            total += len(index)
            shard_count += len(shards)
        except (OSError, ValueError, TypeError, KeyError, IndexError) as err:
            problems.append(f'{catalog["file"]} 资料库数据读取失败：{err}')

    if total != meta['stats']['total']:
        problems.append(f'资料库总数 {total} 与元数据 {meta["stats"]["total"]} 不一致')
    print(f'archive catalogs={len(catalogs)} rows={total} shards={shard_count}')


def main():
    data = load_js_data(SEED)
    problems = []

    events = data.get('events', [])
    persons = data.get('persons', [])
    periods = data.get('periods', [])
    topics = data.get('topics', [])
    daily = data.get('daily', [])

    audit_entries('events', events, ('title', 'desc', 'yearText', 'era', 'tags'), problems)
    audit_entries('persons', persons, ('name', 'dates', 'era', 'roles', 'summary'), problems)
    audit_entries('periods', periods, ('name', 'title', 'desc'), problems)
    audit_entries('topics', topics, ('kicker', 'title', 'desc'), problems)

    by_name = {p.get('name'): p for p in periods}
    for p in periods:
        start, end = p.get('start'), p.get('end')
        if type(start) is not int or type(end) is not int or not start or not end or start > end:
            problems.append(f'periods {p.get("id")} 起止年份非法')
    event_dates = {}
    for e in events:
        eid, era, year = e.get('id'), e.get('era'), e.get('year')
        period = by_name.get(MERGED_ERAS.get(era, era))
        if not period and era not in MODERN_ERAS:
            problems.append(f'events {eid} era「{era}」无法映射到任何朝代')
        time = EVENT_DATE.fullmatch(str(e.get('yearText', '')))
        if e.get('mode') not in ('ancient', 'modern'):
            problems.append(f'events {eid} mode 非法')
        if type(year) is not int or not time or parsed_year(time) != year:
            problems.append(f'events {eid} year 与 yearText 不一致')
            continue
        if period and not period['start'] <= year <= period['end']:
            problems.append(f'events {eid} 年份超出 {period["name"]} 范围')
        if time[3]:
            month, day = int(time[3]), int(time[4])
            if not valid_date(year, month, day):
                problems.append(f'events {eid} 精确日期非法')
            event_dates[eid] = (month, day)

    events_by_id = {e.get('id'): e for e in events}
    for p in persons:
        pid = p.get('id')
        if p.get('era') not in by_name and p.get('era') not in MODERN_ERAS:
            problems.append(f'persons {pid} era 无法映射到任何朝代')
        if has_text(p.get('quote')) != has_text(p.get('quoteSource')):
            problems.append(f'persons {pid} 引文与出处不完整')
        dates = str(p.get('dates', '')).split('–', 1)
        years = [PERSON_YEAR.fullmatch(part) for part in dates]
        start, end = [parsed_year(year) if year else None for year in (years + [None])[:2]]
        if start is not None and end is not None and start > end:
            problems.append(f'persons {pid} 生卒年份倒置')
        if not p.get('relatedEvents'):
            problems.append(f'persons {pid} relatedEvents 为空')
        for rel in p.get('relatedEvents') or []:
            rid = rel.get('id') if isinstance(rel, dict) else rel
            event = events_by_id.get(rid)
            if not event:
                problems.append(f'persons {pid} relatedEvents 引用不存在的事件 {rid}')
                continue
            year = event.get('year')
            if type(year) is int and (pid, rid) not in CONTEXT_LINKS:
                if (start is not None and year < start) or (end is not None and year > end):
                    problems.append(f'persons {pid} 关联史事 {rid} 超出生卒范围')

    seen_days = set()
    for d in daily:
        eid, m, day = d.get('eventId'), d.get('month'), d.get('day')
        if eid not in events_by_id:
            problems.append(f'daily 引用不存在的事件 {eid}')
        if not valid_date(d.get('year', 2000), m, day):
            problems.append(f'daily 日期非法 {m}-{day} ({eid})')
        if (m, day) in seen_days:
            problems.append(f'daily 日期重复 {m}-{day}')
        seen_days.add((m, day))
        if ('year' in d) != has_text(d.get('desc')):
            problems.append(f'daily {m}-{day} 节点年份与文案需同时填写')
        if eid in event_dates and (m, day) != event_dates[eid] and not has_text(d.get('desc')):
            problems.append(f'daily {m}-{day} 与 {eid} 精确日期不同，需单独注明当天节点')
    fb = (data.get('dailyFallback') or {}).get('eventId')
    if fb not in events_by_id:
        problems.append('dailyFallback 引用不存在的事件 %s' % fb)

    # 种子 ↔ 远端热更 JSON 一致性（内容键逐键对比，时间戳不参与）
    try:
        with io.open(REMOTE, encoding='utf-8') as f:
            remote = json.load(f)
        for k in ('periods', 'events', 'persons', 'topics', 'daily', 'dailyFallback'):
            a = json.dumps(data.get(k), ensure_ascii=False, sort_keys=True)
            b = json.dumps(remote.get(k), ensure_ascii=False, sort_keys=True)
            if a != b:
                problems.append('history.json 的 %s 与 history.js 不一致（改种子后忘记 node tools/build_data_json.js？）' % k)
    except FileNotFoundError:
        problems.append('data/history.json 不存在（需 node tools/build_data_json.js 生成）')

    print('events=%d persons=%d periods=%d topics=%d daily=%d' % (
        len(events), len(persons), len(periods), len(topics), len(daily)))
    audit_archive(problems)
    if problems:
        print('FAIL %d 项：' % len(problems))
        for p in problems:
            print('  -', p)
        sys.exit(1)
    print('PASS 数据完整性全部通过（含 history.js ↔ history.json 一致性）')


if __name__ == '__main__':
    main()
