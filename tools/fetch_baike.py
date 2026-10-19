"""从百度百科词条页提取 bkimg.cdn.bcebos.com 图片直链并下载。"""
import io
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from fetch_images import download, UA


def baike_images(title, limit=10):
    url = 'https://baike.baidu.com/item/' + urllib.parse.quote(title)
    req = urllib.request.Request(url, headers={
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-CN,zh;q=0.9',
    })
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            html = r.read().decode('utf-8', 'ignore')
    except Exception as exc:
        print('  baike fetch error:', str(exc)[:80])
        return []
    imgs = re.findall(r'https://bkimg\.cdn\.bcebos\.com/pic/[^"\'\\ )}]+' , html)
    seen, out = set(), []
    for u in imgs:
        u = re.sub(r'&amp;', '&', u)
        if u not in seen:
            seen.add(u)
            out.append(u)
        if len(out) >= limit:
            break
    return out


if __name__ == '__main__':
    title = sys.argv[1]
    out = sys.argv[2]
    print('title:', title, '->', out)
    urls = baike_images(title)
    print('candidates:', len(urls))
    for u in urls[:10]:
        print('  ', u[:120])
    for i, u in enumerate(urls):
        try:
            size = download(u, out, min_bytes=20000)
            print('SAVED', out, size, 'bytes  candidate#%d' % i)
            sys.exit(0)
        except Exception as exc:
            print('  skip:', str(exc)[:70])
    print('FAILED')
    sys.exit(2)
