# -*- coding: utf-8 -*-
"""压缩新增的 15 张朝代画 + 60 张缩略图，让主包回到 2MB 限制内。

- paintings：新 15 张限宽 480、JPEG q70（旧 7 张 han/tang/song/ming/qing/modern/landscape 不动）
- thumbs：新 60 张保持 160x160、JPEG q62（旧 28 张不动）
"""
from pathlib import Path
from PIL import Image

ROOT = Path('E:/AI/history/miniprogram/assets')

NEW_PAINTINGS = ['shanggu','xia','shang','zhou','chunqiu','zhanguo','qin',
                 'sanguo','xijin','sui','wudai','yuan','liao','xixia','jin']
OLD_PAINTINGS = {'han','tang','song','ming','qing','modern','landscape'}

NEW_THUMB_KEYS = NEW_PAINTINGS + []  # 缩略图 key 与 painting key 同名
OLD_THUMB_BASES = {'han','tang','song','ming','qing','modern','republic'}

def paint_new_thumbs():
    """按新标准重新裁 160x160 q62 缩略图（从已压缩后的 painting 裁）"""
    for key in NEW_PAINTINGS:
        p = ROOT / 'paintings' / (key + '.jpg')
        img = Image.open(p).convert('RGB')
        w, h = img.size
        crops = [(0,0,160,160),(max(0,w-160),0,w,160),
                 (0,max(0,h-160),160,h),(max(0,w-160),max(0,h-160),w,h)]
        for i,(l,t,r,b) in enumerate(crops,1):
            out = ROOT / 'thumbs' / ('%s-%d.jpg' % (key,i))
            th = img.crop((l,t,r,b))
            if th.width < 160 or th.height < 160:
                th = th.resize((160,160))
            th.save(out, 'JPEG', quality=62, optimize=True)

def compress_paintings():
    for key in NEW_PAINTINGS:
        p = ROOT / 'paintings' / (key + '.jpg')
        img = Image.open(p).convert('RGB')
        if img.width > 480:
            img = img.resize((480, round(img.height * 480 / img.width)))
        elif img.height > 480:
            img = img.resize((round(img.width * 480 / img.height), 480))
        img.save(p, 'JPEG', quality=70, optimize=True)
        print('%s: %dKB (%dx%d)' % (key, p.stat().st_size//1024, img.width, img.height))

def compress_thumbs():
    for key in NEW_PAINTINGS:
        for n in (1,2,3,4):
            p = ROOT / 'thumbs' / ('%s-%d.jpg' % (key,n))
            img = Image.open(p).convert('RGB')
            img.save(p, 'JPEG', quality=62, optimize=True)

compress_paintings()
print('---- repaint thumbs from compressed paintings ----')
paint_new_thumbs()

# 报告
pk = sum((ROOT/'paintings'/f).stat().st_size for f in [k+'.jpg' for k in NEW_PAINTINGS])
tk = sum((ROOT/'thumbs'/f).stat().st_size for f in ['%s-%d.jpg'%(k,n) for k in NEW_PAINTINGS for n in (1,2,3,4)])
old_p = sum((ROOT/'paintings'/f).stat().st_size for f in [k+'.jpg' for k in OLD_PAINTINGS] if (ROOT/'paintings'/f).exists())
print('new paintings: %d KB | new thumbs: %d KB | old paintings: %d KB' % (pk//1024, tk//1024, old_p//1024))
