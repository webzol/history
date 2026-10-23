#!/usr/bin/env python3
"""为 ERA_IMAGES 缺失朝代补充 paintings + thumbs。

对尚无画作映射的朝代（夏/商/西周/春秋/战国/秦/三国/西晋/隋/五代十国/元/辽/西夏/金/上古），
从百度图片搜索（项目内 tools/fetch_images.baidu_search，Bing 已失效）下载代表性古画/文物，
保存到 miniprogram/assets/paintings/<era>.jpg，再裁 4 个 160x160 缩略图到 thumbs/<era>-1..4.jpg。

用法：
  python tools/add_era_paintings.py            # 全量
  python tools/add_era_paintings.py 商 秦 三国  # 只处理指定朝代

注意：搜图素材仅用于原型演示，正式授权需另审校（见 assets/paintings/SOURCES.md）。
"""
import io
import re
import sys
import time
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT / 'tools'
sys.path.insert(0, str(TOOLS))
try:
    from fetch_images import baidu_search, download as _baidu_download, UA
except Exception as e:
    print('WARN: 未能导入 fetch_images（%s），改用内置兜底' % e)
    baidu_search = None

PAINTINGS_DIR = ROOT / 'miniprogram/assets/paintings'
THUMBS_DIR = ROOT / 'miniprogram/assets/thumbs'

MISSING_ERAS = [
    ('shanggu', '上古', '女娲补天 古画', '盘古开天 女娲补天 古画', '上古神话·女娲/盘古（公有领域）'),
    ('xia', '夏', '夏朝 大禹 古画', '大禹治水 古画 壁画', '夏朝·大禹治水（公有领域）'),
    ('shang', '商', '商朝 甲骨文 文物', '商 妇好 青铜器 文物', '商朝·甲骨文/妇好青铜器（公有领域）'),
    ('zhou', '西周', '西周 何尊 青铜器', '何尊 西周 青铜 文物', '西周·何尊（公有领域）'),
    ('chunqiu', '春秋', '孔子 画像 古画', '孔子 画像 春秋', '春秋·孔子（公有领域）'),
    ('zhanguo', '战国', '战国 曾侯乙 编钟', '曾侯乙墓 编钟 战国 文物', '战国·曾侯乙编钟（公有领域）'),
    ('qin', '秦', '秦朝 兵马俑 文物', '秦始皇 兵马俑 文物', '秦·秦始皇兵马俑（公有领域）'),
    ('sanguo', '三国', '三顾茅庐 古画', '三顾茅庐 三国 绘画', '三国·三顾茅庐（公有领域）'),
    ('xijin', '西晋', '竹林七贤 古画', '顾恺之 竹林七贤 古画', '西晋·竹林七贤（顾恺之风格，公有领域）'),
    ('sui', '隋', '隋代 古画 展子野', '隋代 绘画 古画 展子野', '隋·展子野（公有领域）'),
    ('wudai', '五代十国', '五代 顾闳中 古画', '五代十国 古画 顾闳中', '五代十国·顾闳中（公有领域）'),
    ('yuan', '元', '黄公望 富春山居图', '富春山居图 黄公望', '元·黄公望《富春山居图》（公有领域）'),
    ('liao', '辽', '辽代 契丹 古画', '辽 契丹 壁画 古画', '辽·契丹（公有领域）'),
    ('xixia', '西夏', '西夏 古画 党项', '西夏 党项 古画 文物', '西夏·党项（公有领域）'),
    ('jin', '金', '金代 女真 古画', '金 女真 古画 文物', '金朝·女真（公有领域）'),
    ('dongjin', '东晋', '顾恺之 洛神赋图 古画', '洛神赋图 顾恺之 东晋 绘画', '东晋·顾恺之《洛神赋图》（公有领域）'),
    ('nanbeichao', '南北朝', '云冈石窟 北魏 造像', '南北朝 敦煌壁画 古画', '南北朝·云冈石窟/敦煌壁画（公有领域）'),
]


def _import_baidu_search(query, limit=20):
    """内联兜底：直接抓百度图搜 flip 接口，返回 [{murl,title}]。"""
    import urllib.request, urllib.parse
    url = ('https://image.baidu.com/search/flip?tn=baiduimage&ie=utf-8&word='
           + urllib.parse.quote(query) + '&pn=0')
    req = urllib.request.Request(url, headers={
        'User-Agent': ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                       'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'),
        'Accept-Language': 'zh-CN,zh;q=0.9',
    })
    html = urllib.request.urlopen(req, timeout=20).read().decode('utf-8', 'ignore')
    out = []
    for murl in re.finditer(r'"thumbURL":"([^"]+)"', html):
        out.append({'murl': murl.group(1), 'title': ''})
        if len(out) >= limit:
            break
    return out


def search(query):
    if baidu_search is not None:
        try:
            return baidu_search(query, limit=20)
        except Exception as e:
            print('  baidu_search err: %s' % e)
    return _import_baidu_search(query)


def baidu_thumb_to_orig(murl):
    """把百度 thumbURL 尽量升级成原图：去掉 ?w=&h= 缩放查询，保留 u= 主体。"""
    m = re.match(r'(https?://img\d\.baidu\.com/it/u=[^&]+)&?[^&]*(.*)$', murl)
    if m:
        return m.group(1) + '&fm=253&fmt=auto'
    return murl


def download_one(murl, out_path):
    import urllib.request
    variants = [baidu_thumb_to_orig(murl), murl]
    for u in variants:
        try:
            req = urllib.request.Request(u, headers={
                'User-Agent': UA if UA else 'Mozilla/5.0',
                'Referer': 'https://image.baidu.com/',
            })
            with urllib.request.urlopen(req, timeout=25) as r:
                data = r.read()
            if len(data) < 6000:
                continue
            img = Image.open(io.BytesIO(data)).convert('RGB')
            if img.width < 300 or img.height < 300:
                continue
            if img.width > 640:
                img = img.resize((640, round(img.height * 640 / img.width)))
            if img.height > 640:
                img = img.resize((round(img.width * 640 / img.height), 640))
            img.save(out_path, 'JPEG', quality=74, optimize=True)
            return True
        except Exception:
            time.sleep(0.3)
            continue
    return False


def make_thumbs(painting, era_key):
    img = Image.open(painting).convert('RGB')
    w, h = img.size
    crops = [
        (0, 0, min(160, w), min(160, h)),
        (max(0, w - 160), 0, w, min(160, h)),
        (0, max(0, h - 160), min(160, w), h),
        (max(0, w - 160), max(0, h - 160), w, h),
    ]
    for i, (l, t, r, b) in enumerate(crops, 1):
        out = THUMBS_DIR / ('%s-%d.jpg' % (era_key, i))
        thumb = img.crop((l, t, r, b))
        if thumb.width < 160 or thumb.height < 160:
            thumb = thumb.resize((160, 160))
        thumb.save(out, 'JPEG', quality=72, optimize=True)
        print('    thumb: %s  %dKB' % (out.name, out.stat().st_size // 1024))


def run(keys_filter=None):
    PAINTINGS_DIR.mkdir(parents=True, exist_ok=True)
    THUMBS_DIR.mkdir(parents=True, exist_ok=True)
    results = {}
    for era_key, era_cn, q1, q2, desc in MISSING_ERAS:
        if keys_filter and era_cn not in keys_filter:
            continue
        painting = PAINTINGS_DIR / (era_key + '.jpg')
        print('\n--- [%s] -> %s  (%s) ---' % (era_cn, painting.name, desc))
        if painting.exists() and painting.stat().st_size > 5000:
            print('  already exists (%dKB); regenerating thumbs' % (painting.stat().st_size // 1024))
            make_thumbs(painting, era_key)
            results[era_cn] = 'EXISTS'
            continue
        ok = False
        for q in (q1, q2):
            cands = search(q)
            print('  baidu candidates for "%s": %d' % (q, len(cands)))
            for c in cands:
                if download_one(c['murl'], painting):
                    kb = painting.stat().st_size // 1024
                    print('  OK: %dKB  <- %s' % (kb, c['murl'][:80]))
                    ok = True
                    break
                time.sleep(0.3)
            if ok:
                break
            time.sleep(0.6)
        if ok:
            make_thumbs(painting, era_key)
            results[era_cn] = 'OK'
        else:
            results[era_cn] = 'FAILED'
        time.sleep(0.8)

    print('\n=== SUMMARY ===')
    for era_cn, status in results.items():
        print('%6s : %s' % (era_cn, status))
    failed = [k for k, v in results.items() if v == 'FAILED']
    if failed:
        print('\nNEED-MANUAL: %s' % failed)
    return failed


if __name__ == '__main__':
    keys = sys.argv[1:] if len(sys.argv) > 1 else None
    failed = run(keys)
    sys.exit(1 if failed else 0)
