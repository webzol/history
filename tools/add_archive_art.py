#!/usr/bin/env python3
"""资料库条目配图批量抓取（「只搜图，不画图」约定，授权见 assets/paintings/SOURCES.md）。

覆盖 data/apk 里的人物类条目（figures/emperors）与事件类条目（events/wars），
输出 data/img/archive/<栏目>/<id>.jpg（360×360 q55），并生成
miniprogram/utils/archiveArtRemote.js 可用清单（勿手改）。

匹配优先级（utils/archiveArt.js）：主站人物/事件专属图（archiveArtMatch.js）>
本脚本自抓图（archiveArtRemote.js）> 无图（详情页只保留分类题图）。

用法：
  python tools/add_archive_art.py                # 全部四类（存在即跳过，可断点重跑）
  python tools/add_archive_art.py emperors       # 只抓指定栏目
  python tools/add_archive_art.py emperors 50    # 限制条数（调试用）

搜图源：百度图搜 flip 接口（复用 add_all_art.py 的抓取函数）。
查询词自动生成：人物类「<名> 画像 / <名> 古画 画像」，事件类「<名> 古画 / <名> 历史场景」。
"""
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from add_all_art import grab  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
APK = ROOT / 'miniprogram' / 'data' / 'apk'
OUT = ROOT / 'miniprogram' / 'data' / 'img' / 'archive'
ART_JS = ROOT / 'miniprogram' / 'utils' / 'archiveArtRemote.js'
DIRS = ['emperors', 'events', 'wars', 'figures']
SIZE = (360, 360)
QUALITY = 55


def query_for(kind, title):
    if kind in ('figures', 'emperors'):
        return (f'{title} 画像', f'{title} 古画 画像')
    return (f'{title} 古画', f'{title} 历史 场景')


def write_manifest():
    mapping = {}
    for kind in DIRS:
        d = OUT / kind
        mapping[kind] = sorted(p.stem for p in d.glob('*.jpg') if p.stat().st_size > 4000) if d.exists() else []
    lines = [
        '// 自动生成：tools/add_archive_art.py —— 资料库条目自抓图可用清单（勿手改）',
        '// 图片在 miniprogram/data/img/archive/<栏目>/<id>.jpg，主包外，经 jsDelivr 提供',
        '// utils/archiveArt.js 据此拼远端 URL；与 archiveArtMatch.js（主站图匹配）互为补充',
        'module.exports = {',
    ]
    for kind in DIRS:
        lines.append('  %s: %s,' % (kind, repr(mapping[kind])))
    lines.append('};')
    ART_JS.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print('\narchiveArtRemote.js: ' + ', '.join('%s %d' % (k, len(v)) for k, v in mapping.items()), flush=True)


def main():
    args = sys.argv[1:]
    kinds = [a for a in args if a in DIRS]
    limit = next((int(a) for a in args if a.isdigit()), 0)
    kinds = kinds or DIRS

    failed = []
    done = 0
    for kind in kinds:
        rows = json.loads((APK / kind / 'index.json').read_text(encoding='utf-8'))
        outdir = OUT / kind
        outdir.mkdir(parents=True, exist_ok=True)
        print('== %s：%d 条' % (kind, len(rows)), flush=True)
        count = 0
        for row in rows:
            entry_id, title = row[0], row[1]
            if limit and count >= limit:
                break
            out = outdir / f'{entry_id}.jpg'
            if out.exists() and out.stat().st_size > 4000:
                continue
            q1, q2 = query_for(kind, title)
            res = grab(entry_id, title, q1, q2, out, SIZE, QUALITY)
            if res == 'FAILED':
                failed.append((kind, entry_id, title))
            count += 1
            done += 1
            time.sleep(0.35)
            if done % 50 == 0:
                print('-- 进度 %d（失败 %d）' % (done, len(failed)), flush=True)
                write_manifest()
    write_manifest()
    print('完成：新抓 %d，失败 %d' % (done, len(failed)), flush=True)
    if failed:
        print('失败清单：', ', '.join('%s/%s(%s)' % f for f in failed[:80]), flush=True)


if __name__ == '__main__':
    main()
