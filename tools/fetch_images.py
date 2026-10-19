"""搜图 + 下载助手：从 cn.bing.com 图片搜索取原图 URL，依次尝试下载到本地。

用法：
  python tools/fetch_images.py <查询词...>            # 只列出候选 murl
  python tools/fetch_images.py -o <输出文件> <查询词>  # 原图下载（逐个候选择第一个能下的）
"""
import json
import re
import sys
import time
import urllib.request

UA = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/126.0 Safari/537.36')


# 明显无关/防盗链站点与占位图过滤
BAD_DOMAINS = ('nipic.com', 'ibaotu.com', 'sohu.com', 'zhiku.com', 'docin.com',
               'taobao', 'jd.com', '1688', 'pinduoduo', 'alibaba')
BAD_TITLE = ('防盗链', '模板', '素材', '下载', '报价', '天梯')


def baidu_search(query, limit=20):
    url = ('https://image.baidu.com/search/flip?tn=baiduimage&ie=utf-8&word=' +
           urllib.parse.quote(query) + '&pn=0')
    req = urllib.request.Request(url, headers={'User-Agent': UA,
                                               'Accept-Language': 'zh-CN,zh;q=0.9'})
    with urllib.request.urlopen(req, timeout=20) as r:
        html = r.read().decode('utf-8', 'ignore')
    results = []
    for m in re.finditer(r'"thumbURL":"([^"]+)"', html):
        murl = m.group(1)
        # 排除防盗链站点
        if any(d in murl for d in BAD_DOMAINS):
            continue
        results.append({'murl': murl, 'title': '', 'w': '', 'h': ''})
    return results[:limit]


def bing_search(query, limit=40):
    url = ('https://cn.bing.com/images/search?q=' +
           urllib.parse.quote(query))
    req = urllib.request.Request(url, headers={'User-Agent': UA,
                                               'Accept-Language': 'zh-CN,zh;q=0.9'})
    with urllib.request.urlopen(req, timeout=20) as r:
        html = r.read().decode('utf-8', 'ignore')
    results = []
    for m in re.finditer(r'm="({[^"]+})"', html):
        try:
            data = json.loads(m.group(1).replace('&quot;', '"').replace('&amp;', '&'))
        except Exception:
            continue
        murl = data.get('murl', '')
        title = data.get('t', '')
        w = int(data.get('mw') or 0)
        h = int(data.get('mh') or 0)
        if any(d in murl for d in BAD_DOMAINS):
            continue
        if any(b in title for b in BAD_TITLE):
            continue
        if w and h and h * 2.2 < w:  # 太扁的横幅多是切片/广告
            continue
        if data.get('murl'):
            results.append({'murl': data['murl'],
                            'title': data.get('t', ''),
                            'w': data.get('mw', ''), 'h': data.get('mh', '')})
    return results[:limit]


def download(url, path, min_bytes=8000):
    req = urllib.request.Request(url, headers={'User-Agent': UA,
                                               'Referer': 'https://cn.bing.com/'})
    with urllib.request.urlopen(req, timeout=25) as r:
        data = r.read()
    if len(data) < min_bytes:
        raise IOError('too small: %d bytes' % len(data))
    for magic, ext in ((b'\xff\xd8\xff', 'jpg'), (b'\x89PNG', 'png'),
                       (b'GIF8', 'gif'), (b'RIFF', 'webp')):
        if data.startswith(magic):
            if ext != 'jpg' and ext != 'png':
                raise IOError('unwanted format %s' % ext)
            break
    else:
        raise IOError('not an image')
    with open(path, 'wb') as f:
        f.write(data)
    return len(data)


if __name__ == '__main__':
    args = sys.argv[1:]
    out = None
    if args and args[0] == '-o':
        out, args = args[1], args[2:]
    query = ' '.join(args)
    found = bing_search(query)
    print('query: %s, candidates: %d' % (query, len(found)))
    if not out:
        for i, item in enumerate(found[:15]):
            print(i, '%sx%s' % (item['w'], item['h']), item['title'][:36], item['murl'])
        sys.exit(0)
    for item in found:
        try:
            size = download(item['murl'], out)
            print('SAVED %s (%d bytes) <- %s' % (out, size, item['murl']))
            sys.exit(0)
        except Exception as exc:
            print('skip: %s' % exc)
            time.sleep(0.3)
    print('FAILED: no candidate downloadable')
    sys.exit(2)
