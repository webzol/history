"""列出某查询的图片候选（murl+标题），写入 UTF-8 JSON 供人工挑选。

用法：python tools/list_candidates.py <查询词> <输出json>
"""
import io
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from fetch_images import bing_search

query = sys.argv[1]
out_path = sys.argv[2]
results = bing_search(query)
io.open(out_path, 'w', encoding='utf-8').write(
    json.dumps([{'w': r['w'], 'h': r['h'], 'title': r['title'], 'murl': r['murl']}
                for r in results], ensure_ascii=False, indent=1))
print('wrote %d candidates -> %s' % (len(results), out_path))
