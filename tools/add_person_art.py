#!/usr/bin/env python3
"""为标志性人物/事件补专属配图（「只搜图，不画图」约定，授权见 assets/paintings/SOURCES.md）。

- assets/personart/<key>.jpg   人物专属图（4:3 横向 480×360 q58）：人物页头卡底纹 / 事件页「其时其人」按人物取图
- assets/eventart/<key>.jpg    事件专属图（280×280 方图 q56）：事件页头卡装裱画片（与 add_event_art.py 同源约定）
- assets/thumbs/<key>.jpg      人物细部缩略（160×160 q60）：事件页「其时其人」行首小图

用法：
  python tools/add_person_art.py            # 全量
  python tools/add_person_art.py zhang-qian  # 只处理指定 key

搜图源：百度图搜 flip 接口（项目内约定，见 add_event_art.py）。
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
PERSONART_DIR = ROOT / 'miniprogram/assets/personart'
EVENTART_DIR = ROOT / 'miniprogram/assets/eventart'
THUMBS_DIR = ROOT / 'miniprogram/assets/thumbs'
for d in (PERSONART_DIR, EVENTART_DIR, THUMBS_DIR):
    d.mkdir(parents=True, exist_ok=True)

UA = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
      'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36')

# (key, cn, query1, query2, desc)
PERSONS = [
    ('wudi', '汉武帝', '汉武帝 画像 古画', '汉武帝 刘彻 画像', '西汉·汉武帝（画像风格，公有领域）'),
    ('wei-qing', '卫青', '卫青 画像 将军', '卫青 西汉 将军 古画', '西汉·卫青（画像风格）'),
    ('zhang-qian', '张骞', '张骞 出使西域 古画', '张骞 西域 骆驼 绘画', '西汉·张骞出使西域（古画风格，公有领域）'),
    ('huo-qubing', '霍去病', '霍去病 画像 将军', '霍去病 西汉 骑兵 古画', '西汉·霍去病（画像风格）'),
]

EVENTS = [
    ('han-wudi', '汉武帝即位', '汉武帝 登基 古画', '汉武帝 朝会 古画', '西汉·汉武帝即位（古画风格）'),
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


def fetch_img(murl):
    for u in (baidu_thumb_to_orig(murl), murl):
        try:
            req = urllib.request.Request(u, headers={'User-Agent': UA, 'Referer': 'https://image.baidu.com/'})
            with urllib.request.urlopen(req, timeout=25) as r:
                data = r.read()
            if len(data) < 6000:
                continue
            img = Image.open(io.BytesIO(data)).convert('RGB')
            if img.width < 300 or img.height < 300:
                continue
            return img
        except Exception:
            time.sleep(0.3)
            continue
    return None


def crop_ratio(img, ratio_wh, out_w, out_h):
    """按 宽:高 中心裁切再缩放。"""
    target_ratio = out_w / out_h
    w, h = img.size
    if w / h > target_ratio:
        new_w = round(h * target_ratio)
        l = (w - new_w) // 2
        img = img.crop((l, 0, l + new_w, h))
    else:
        new_h = round(w / target_ratio)
        t = (h - new_h) // 2
        img = img.crop((0, t, w, t + new_h))
    return img.resize((out_w, out_h))


def save_person(key, img, out):
    img = crop_ratio(img, 4 / 3, 480, 360)
    img.save(out, 'JPEG', quality=58, optimize=True)
    # 细部缩略：左上 160×160
    th = img.crop((0, 0, 160, 160))
    th.save(THUMBS_DIR / (key + '.jpg'), 'JPEG', quality=60, optimize=True)


def run(keys_filter=None):
    results = {}
    for key, cn, q1, q2, desc in PERSONS:
        if keys_filter and key not in keys_filter:
            continue
        out = PERSONART_DIR / (key + '.jpg')
        print('\n--- [person] %s -> %s  (%s) ---' % (cn, out.name, desc))
        if out.exists() and out.stat().st_size > 5000:
            print('  already exists (%dKB); skip' % (out.stat().st_size // 1024))
            results[key] = 'EXISTS'
            continue
        ok = False
        for q in (q1, q2):
            cands = baidu_search(q)
            print('  baidu candidates "%s": %d' % (q, len(cands)))
            for c in cands:
                img = fetch_img(c['murl'])
                if img:
                    save_person(key, img, out)
                    print('  OK: person %dKB + thumb %dKB  <- %s' %
                          (out.stat().st_size // 1024,
                           (THUMBS_DIR / (key + '.jpg')).stat().st_size // 1024,
                           c['murl'][:60]))
                    ok = True
                    break
                time.sleep(0.3)
            if ok:
                break
            time.sleep(0.6)
        results[key] = 'OK' if ok else 'FAILED'
        time.sleep(0.8)

    for key, cn, q1, q2, desc in EVENTS:
        if keys_filter and key not in keys_filter:
            continue
        out = EVENTART_DIR / (key + '.jpg')
        print('\n--- [event] %s -> %s  (%s) ---' % (cn, out.name, desc))
        if out.exists() and out.stat().st_size > 4000:
            print('  already exists (%dKB); skip' % (out.stat().st_size // 1024))
            results[key] = 'EXISTS'
            continue
        ok = False
        for q in (q1, q2):
            cands = baidu_search(q)
            print('  baidu candidates "%s": %d' % (q, len(cands)))
            for c in cands:
                img = fetch_img(c['murl'])
                if img:
                    crop_ratio(img, 1, 280, 280).save(out, 'JPEG', quality=56, optimize=True)
                    print('  OK: event %dKB  <- %s' % (out.stat().st_size // 1024, c['murl'][:60]))
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
        print('%-12s : %s' % (k, v))
    failed = [k for k, v in results.items() if v == 'FAILED']
    if failed:
        print('\nNEED-MANUAL: %s' % failed)
    return failed


if __name__ == '__main__':
    keys = sys.argv[1:] if len(sys.argv) > 1 else None
    failed = run(keys)
    sys.exit(1 if failed else 0)
