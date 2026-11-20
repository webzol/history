# -*- coding: utf-8 -*-
"""数据完整性审计（全量版）。

旧版用正则扫 history.js 源码，history-extra.js 并入种子后只覆盖到
部分条目（41 事件 / 23 人物），与真实数据量脱节。现改为 node require
种子数据做全量审计，并与远端热更 JSON（data/history.json）逐键对比，
防止「改了种子忘记 node tools/build_data_json.js」。

用法：python tools/content_audit.py（发现问题时退出码 1）
"""
import io
import json
import subprocess
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

SEED = 'miniprogram/data/history.js'
REMOTE = 'miniprogram/data/history.json'

# 与 pages/period/period.js 的 MODERN_ERAS 保持一致：近现代面板兼容的 era 别名
MODERN_ERAS = ['晚清', '民国', '新中国', '近现代', '现代']
# 与 period.js 的 PERIOD_ERAS 对齐：这些 era 已并入对应朝代页收录
MERGED_ERAS = {'晚清': '清'}


def load_seed():
    r = subprocess.run(
        ['node', '-e', 'console.log(JSON.stringify(require("./' + SEED + '")))'],
        capture_output=True, check=True)
    return json.loads(r.stdout.decode('utf-8'))


def audit_entries(label, rows, need_details, need_desc, problems):
    ids = [r.get('id') for r in rows]
    dup = sorted({i for i in ids if ids.count(i) > 1})
    if dup:
        problems.append('%s 重复 id: %s' % (label, ', '.join(dup)))
    for r in rows:
        rid = r.get('id') or '?'
        if need_details and not (isinstance(r.get('details'), list) and r['details']):
            problems.append('%s %s details 缺失或为空' % (label, rid))
        if need_desc and not r.get('desc'):
            problems.append('%s %s desc 缺失' % (label, rid))
        if not r.get('source'):
            problems.append('%s %s source 缺失' % (label, rid))


def main():
    data = load_seed()
    problems = []

    events = data.get('events', [])
    persons = data.get('persons', [])
    periods = data.get('periods', [])
    topics = data.get('topics', [])
    daily = data.get('daily', [])

    audit_entries('events', events, True, True, problems)
    audit_entries('persons', persons, True, False, problems)
    audit_entries('periods', periods, False, True, problems)

    # era 引用有效性：命中朝代名，或近现代别名（晚清已并入清页收录）
    names = {p.get('name') for p in periods}
    for e in events:
        era = e.get('era')
        if era not in names and era not in MODERN_ERAS:
            problems.append('events %s era「%s」无法映射到任何朝代' % (e.get('id'), era))

    # 人物 relatedEvents 引用存在性
    event_ids = {e.get('id') for e in events}
    for p in persons:
        for rel in p.get('relatedEvents') or []:
            rid = rel.get('id') if isinstance(rel, dict) else rel
            if rid not in event_ids:
                problems.append('persons %s relatedEvents 引用不存在的事件 %s' % (p.get('id'), rid))

    # 每日史事日期库：引用存在 + 日期合法
    for d in daily:
        if d.get('eventId') not in event_ids:
            problems.append('daily 引用不存在的事件 %s' % d.get('eventId'))
        m, day = d.get('month'), d.get('day')
        if not (isinstance(m, int) and isinstance(day, int) and 1 <= m <= 12 and 1 <= day <= 31):
            problems.append('daily 日期非法 %s-%s (%s)' % (m, day, d.get('eventId')))
    fb = (data.get('dailyFallback') or {}).get('eventId')
    if fb not in event_ids:
        problems.append('dailyFallback 引用不存在的事件 %s' % fb)

    # 专题字段
    for t in topics:
        for k in ('kicker', 'title', 'desc', 'source'):
            if not t.get(k):
                problems.append('topics %s 缺 %s' % (t.get('id'), k))

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
    if problems:
        print('FAIL %d 项：' % len(problems))
        for p in problems:
            print('  -', p)
        sys.exit(1)
    print('PASS 数据完整性全部通过（含 history.js ↔ history.json 一致性）')


if __name__ == '__main__':
    main()
