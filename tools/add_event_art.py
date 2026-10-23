#!/usr/bin/env python3
"""为标志性史事补事件级专属配图（assets/eventart/<key>.jpg）。

事件页头卡装裱画片原走朝代级 eraImage(era)（同朝代事件共用一张画）。
本脚本按事件 id 从百度图搜下载专属古画/名场面，中心裁方并压到 280×280 q56，
与主包 2MB 限额配套使用（先压缩旧朝代画腾余量，再放事件专属图）。

用法：
  python tools/add_event_art.py            # 全量
  python tools/add_event_art.py chibi qin-unify   # 只处理指定事件 key

注意：搜图素材仅用于原型演示，正式授权需另审校（见 assets/paintings/SOURCES.md）。
"""
import io
import re
import sys
import time
import urllib.request
import urllib.parse
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
EVENTART_DIR = ROOT / 'miniprogram/assets/eventart'
EVENTART_DIR.mkdir(parents=True, exist_ok=True)

UA = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
      'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36')

# (key, event_cn, query1, query2, desc)
EVENTS = [
    ('chibi',       '赤壁之战', '赤壁之战 古画', '赤壁之战 三国 绘画', '三国·赤壁之战（公有领域）'),
    ('qin-unify',   '秦始皇统一六国', '秦始皇 统一六国 古画', '秦朝 统一 古画 文物', '秦·统一六国（公有领域）'),
    ('zhenghe',     '郑和下西洋', '郑和 下西洋 宝船 古画', '郑和 航海 宝船 图', '明·郑和下西洋（公有领域）'),
    ('dayunhe',     '隋大运河', '隋朝 大运河 古画', '隋唐 大运河 图 古画', '隋·大运河（公有领域）'),
    ('humen',       '虎门销烟', '林则徐 虎门销烟 古画', '虎门销烟 历史 图', '晚清·虎门销烟（公有领域）'),
]


def baidu_thumb_to_orig(murl):
    m = re.match(r'(https?://img\d\.baidu\.com/it/u=[^&]+)&?[^&]*(.*)$', murl)
    if m:
        return m.group(1) + '&fm=253&fmt=auto'
    return murl


def baidu_search(query, limit=20):
    url = ('https://image.baidu.com/search/flip?tn=baiduimage&ie=utf-8&word='
           + urllib.parse.quote(query) + '&pn=0')
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9'})
    html = urllib.request.urlopen(req, timeout=20).read().decode('utf-8', 'ignore')
    out = []
    for m in re.finditer(r'"thumbURL":"([^"]+)"', html):
        out.append({'murl': m.group(1), 'title': ''})
        if len(out) >= limit:
            break
    return out


def download_square(murl, out_path, size=280):
    """下载并按中心裁方压到 size×size q56，返回是否成功。"""
    import urllib.request as ur
    for u in (baidu_thumb_to_orig(murl), murl):
        try:
            req = ur.Request(u, headers={'User-Agent': UA, 'Referer': 'https://image.baidu.com/'})
            with ur.urlopen(req, timeout=25) as r:
                data = r.read()
            if len(data) < 6000:
                continue
            img = Image.open(io.BytesIO(data)).convert('RGB')
            if img.width < 300 or img.height < 300:
                continue
            # 中心裁方
            s = min(img.width, img.height)
            l = (img.width - s) // 2
            t = (img.height - s) // 2
            img = img.crop((l, t, l + s, t + s))
            img = img.resize((size, size))
            img.save(out_path, 'JPEG', quality=56, optimize=True)
            return True
        except Exception:
            time.sleep(0.3)
            continue
    return False


def run(keys_filter=None):
    results = {}
    for key, cn, q1, q2, desc in EVENTS:
        if keys_filter and key not in keys_filter:
            continue
        out = EVENTART_DIR / (key + '.jpg')
        print('\n--- [%s] -> %s  (%s) ---' % (cn, out.name, desc))
        if out.exists() and out.stat().st_size > 4000:
            print('  already exists (%dKB); skip' % (out.stat().st_size // 1024))
            results[key] = 'EXISTS'
            continue
        ok = False
        for q in (q1, q2):
            cands = baidu_search(q)
            print('  baidu candidates "%s": %d' % (q, len(cands)))
            for c in cands:
                if download_square(c['murl'], out):
                    print('  OK: %dKB  <- %s' % (out.stat().st_size // 1024, c['murl'][:70]))
                    ok = True
                    break
                time.sleep(0.3)
            if ok:
                break
            time.sleep(0.6)
        results[key] = 'OK' if ok else 'FAILED'
        time.sleep(0.8)

    print('\n=== SUMMARY ===')
    for k, v in results.items():
        print('%-10s : %s' % (k, v))
    failed = [k for k, v in results.items() if v == 'FAILED']
    if failed:
        print('\nNEED-MANUAL: %s' % failed)
    return failed


if __name__ == '__main__':
    keys = sys.argv[1:] if len(sys.argv) > 1 else None
    failed = run(keys)
    sys.exit(1 if failed else 0)
