"""按 fetch_plan.json 批量搜图并下载。

每个 target 依次尝试 queries，每个查询依次尝试候选 murl，
下载成功（合法 JPEG/PNG 且 >= 8KB）即保存；全部失败则报错退出。
"""
import io
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from fetch_images import bing_search, download

ROOT = Path(__file__).resolve().parents[1]
plan = json.loads(io.open(Path(__file__).with_name('fetch_plan.json'), encoding='utf-8').read())

failed = []
for target in plan['targets']:
    out = ROOT / target['output']
    if out.exists():
        print('SKIP  (exists)', target['output'])
        continue
    out.parent.mkdir(parents=True, exist_ok=True)
    saved = False
    for query in target['queries']:
        try:
            candidates = bing_search(query)
        except Exception as exc:
            print('  search error:', exc)
            continue
        print('  query %-30s candidates %d' % (query, len(candidates)))
        for cand in candidates:
            try:
                size = download(cand['murl'], str(out))
                print('SAVED %s (%d bytes)  [%s]' % (
                    out.relative_to(ROOT), size, cand['title'][:30]))
                saved = True
                break
            except Exception as exc:
                print('   skip:', str(exc)[:70])
        if saved:
            break
    if not saved:
        failed.append(target['output'])

if failed:
    print('FAILED targets:', failed)
    sys.exit(2)
print('ALL DONE')
