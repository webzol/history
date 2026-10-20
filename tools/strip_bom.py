# -*- coding: utf-8 -*-
"""检查并移除 miniprogram 源码文件（js/ts/json/wxml/wxss）的 UTF-8 BOM。"""
import io
from pathlib import Path

root = Path(__file__).resolve().parents[1] / 'miniprogram'
exts = {'.js', '.json', '.wxml', '.wxss'}
fixed = []
for f in root.rglob('*'):
    if f.suffix not in exts or not f.is_file():
        continue
    data = f.read_bytes()
    if data.startswith(b'\xef\xbb\xbf'):
        f.write_bytes(data[3:])
        fixed.append(str(f.relative_to(root)))
print('BOM files:', len(fixed))
for name in fixed:
    print(' -', name)
