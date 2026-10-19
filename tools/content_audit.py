# -*- coding: utf-8 -*-
"""检查 data/history.js：哪些事件/人物还缺 details 正文段落。"""
import io
import re

src = io.open('miniprogram/data/history.js', encoding='utf-8').read()


def scan(label):
    seg = src.split(f'const {label} = [')[1].split('const ')[0]
    for block in re.split(r'\n  \{\n', seg):
        m = re.search(r"id: '([a-z0-9-]+)'", block)
        if m:
            flags = []
            flags.append('details' if 'details' in block else 'NO-details')
            flags.append('desc' if 'desc:' in block else 'NO-desc')
            print(label, m.group(1), ' '.join(flags))


scan('events')
scan('persons')
