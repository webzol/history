#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""「我的」页随机头像变体生成器。

基于 tools/avatar-scholar.svg（手绘史官）参数化出 N 张变体：
随机组合 冠巾（幞头/东坡巾/乌纱帽/纶巾）× 袍色（朝代色板）× 胡须 × 纸底色，
经 headless Chrome 渲成 miniprogram/assets/avatars/avatar-NN.png（200×200）。

复现：python tools/gen_avatars.py
"""
import os
import random
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD = os.path.join(ROOT, "tools", "_avatar_build")
OUT = os.path.join(ROOT, "miniprogram", "assets", "avatars")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
COUNT = int(sys.argv[1]) if len(sys.argv) > 1 else 20
SEED = 20261023

# 冠巾样式：每项为 (名称, svg 片段函数)。坐标沿用 400×400 视图，脸部约 y 104-252。
def hat_futou(ink):
    # 幞头（原稿样式）：黑冠体 + 冠前缘 + 双软翅
    return f"""
  <path d="M154 140 L 154 92 Q 154 62 182 62 L 218 62 Q 246 62 246 92 L 246 140 Z" fill="{ink}"/>
  <path d="M156 78 Q 200 68 244 78" fill="none" stroke="#3A3630" stroke-width="2" opacity="0.8"/>
  <rect x="146" y="132" width="108" height="18" rx="9" fill="#1D1B18"/>
  <path d="M148 140 C 146 158 148 172 152 182 C 158 170 160 156 160 142 Z" fill="{ink}"/>
  <path d="M252 140 C 254 158 252 172 248 182 C 242 170 240 156 240 142 Z" fill="{ink}"/>"""

def hat_dongpo(ink):
    # 东坡巾（宋）：高桶冠 + 前后坡面 + 顶脊
    return f"""
  <path d="M152 138 L 152 84 Q 152 56 178 54 L 222 54 Q 248 56 248 84 L 248 138 Z" fill="{ink}"/>
  <path d="M164 56 L 164 136" stroke="#15130F" stroke-width="3" opacity="0.55"/>
  <path d="M236 56 L 236 136" stroke="#15130F" stroke-width="3" opacity="0.55"/>
  <path d="M148 70 Q 200 58 252 70 L 252 84 Q 200 72 148 84 Z" fill="#262626" opacity="0.9"/>
  <rect x="146" y="132" width="108" height="18" rx="9" fill="#1D1B18"/>"""

def hat_wusha(ink):
    # 乌纱帽（明）：圆顶纱帽 + 两侧椭圆帽翅
    return f"""
  <path d="M156 138 Q 150 84 200 74 Q 250 84 244 138 Z" fill="{ink}"/>
  <path d="M162 96 Q 200 82 238 96" fill="none" stroke="#15130F" stroke-width="2.4" opacity="0.7"/>
  <ellipse cx="122" cy="128" rx="26" ry="13" fill="{ink}" stroke="#15130F" stroke-width="1.5"/>
  <ellipse cx="278" cy="128" rx="26" ry="13" fill="{ink}" stroke="#15130F" stroke-width="1.5"/>
  <rect x="146" y="132" width="108" height="18" rx="9" fill="#1D1B18"/>"""

def hat_guanjin(ink, cloth):
    # 纶巾（布巾软帽 + 顶髻），颜色随袍色系
    return f"""
  <path d="M148 134 Q 144 86 200 76 Q 256 86 252 134 Z" fill="{cloth}"/>
  <path d="M150 104 Q 200 90 250 104" fill="none" stroke="#3A342C" stroke-width="2" opacity="0.5"/>
  <circle cx="200" cy="70" r="13" fill="{cloth}" stroke="#3A342C" stroke-width="2.5"/>
  <path d="M190 62 Q 200 54 210 62" fill="none" stroke="#3A342C" stroke-width="2.2"/>
  <rect x="146" y="130" width="108" height="18" rx="9" fill="{cloth}" stroke="#3A342C" stroke-width="2"/>"""

HATS = [
    ("futou", lambda ink, cloth: hat_futou(ink)),
    ("dongpo", lambda ink, cloth: hat_dongpo(ink)),
    ("wusha", lambda ink, cloth: hat_wusha(ink)),
    ("guanjin", lambda ink, cloth: hat_guanjin(ink, cloth)),
]

# 袍色（朝代感色板：名, 上, 下, 领缘影）
ROBES = [
    ("竹青", "#788780", "#55635E"),
    ("黛青", "#5A6B7A", "#3E4C5C"),
    ("绛红", "#9A5A50", "#7A4038"),
    ("赭黄", "#A9825E", "#86613F"),
    ("玄墨", "#4A4640", "#2F2C28"),
    ("藕荷", "#8E7A8A", "#6D5C6E"),
    ("月白", "#8FA3A8", "#6E848C"),
    ("秋香", "#9A8F5A", "#7A7044"),
    ("豆绿", "#7E9276", "#5E725A"),
    ("驼灰", "#8C7F6E", "#6E6252"),
]

# 纸底 / 光环微调（保持宣纸暖调族内）
PAPERS = [
    ("#FCF7ED", "#EDE2CE", "#E2D6C0", "#BCAA8D"),
    ("#FBF3E6", "#EADCC2", "#DFD0B4", "#B8A183"),
    ("#F8F4EC", "#E3DACB", "#D8CDBC", "#AFA38D"),
    ("#FCF6EA", "#EFE0CB", "#E4D3BC", "#C0A98A"),
]

# 胡须：无 / 短髭须（原稿）/ 长髯
def beard_none():
    return ""

def beard_short():
    return """
  <path d="M184 232 Q 200 254 216 232 Q 210 248 200 250 Q 190 248 184 232 Z" fill="#4A443A"/>"""

def beard_long():
    return """
  <path d="M184 230 Q 200 252 216 230 Q 214 254 200 262 Q 186 254 184 230 Z" fill="#4A443A"/>
  <path d="M188 252 Q 200 296 212 252 Q 208 276 200 280 Q 192 276 188 252 Z" fill="#4A443A" opacity="0.92"/>"""

BEARDS = [beard_none, beard_short, beard_long, beard_long]


def build_svg(idx, hat, robe, beard, paper):
    p0, p1, halo, ring = paper
    name, top, bot = robe
    ink = "#26231F" if name not in ("玄墨",) else "#1B1916"
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="200" height="200">
  <defs>
    <radialGradient id="paper" cx="50%" cy="36%" r="74%">
      <stop offset="0%" stop-color="{p0}"/>
      <stop offset="100%" stop-color="{p1}"/>
    </radialGradient>
    <linearGradient id="robe" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="{top}"/>
      <stop offset="100%" stop-color="{bot}"/>
    </linearGradient>
  </defs>

  <rect width="400" height="400" fill="url(#paper)"/>
  <circle cx="200" cy="166" r="130" fill="{halo}" opacity="0.5"/>
  <circle cx="200" cy="166" r="130" fill="none" stroke="{ring}" stroke-width="1.2" opacity="0.5"/>
  <path d="M36 318 Q 108 260 168 300 T 366 278" fill="none" stroke="#C6B79E" stroke-width="2" opacity="0.32"/>

  <path d="M52 400 C 60 332 104 296 158 282 L 242 282 C 296 296 340 332 348 400 Z" fill="url(#robe)" stroke="#2F3A36" stroke-width="3"/>
  <path d="M156 284 C 136 314 124 354 118 400 L 78 400 C 88 348 112 306 156 284 Z" fill="{bot}" opacity="0.45"/>
  <path d="M244 284 C 264 314 276 354 282 400 L 322 400 C 312 348 288 306 244 284 Z" fill="{top}" opacity="0.4"/>

  <path d="M176 240 L 224 240 L 226 286 L 174 286 Z" fill="#D8B78F" stroke="#3A342C" stroke-width="2.5"/>
  <path d="M160 282 L 198 352 L 212 340 L 178 276 Z" fill="#F3E9D6" stroke="#3A342C" stroke-width="2.5"/>
  <path d="M240 282 L 202 352 L 188 340 L 222 276 Z" fill="#E7DAC1" stroke="#3A342C" stroke-width="2.5"/>
  <path d="M196 350 L 204 350 L 205 400 L 195 400 Z" fill="#3A342C" opacity="0.55"/>

  <ellipse cx="140" cy="184" rx="9" ry="17" fill="#DDBB95" stroke="#3A342C" stroke-width="2.5"/>
  <ellipse cx="260" cy="184" rx="9" ry="17" fill="#DDBB95" stroke="#3A342C" stroke-width="2.5"/>
  <ellipse cx="200" cy="178" rx="60" ry="74" fill="#E7CBA5" stroke="#3A342C" stroke-width="3"/>

  {hat(ink, top)}
  {beard}
  <path d="M158 165 Q 170 159 184 164" stroke="#2A2723" stroke-width="3.6" fill="none" stroke-linecap="round"/>
  <path d="M216 164 Q 230 159 242 165" stroke="#2A2723" stroke-width="3.6" fill="none" stroke-linecap="round"/>
  <path d="M162 181 Q 171 175 181 181 Q 171 187 162 181 Z" fill="#2A2723"/>
  <path d="M219 181 Q 229 175 238 181 Q 229 187 219 181 Z" fill="#2A2723"/>
  <circle cx="170" cy="179.5" r="1.6" fill="#F6EFE2"/>
  <circle cx="227" cy="179.5" r="1.6" fill="#F6EFE2"/>

  <ellipse cx="160" cy="203" rx="10" ry="7" fill="#D9A983" opacity="0.22"/>
  <ellipse cx="240" cy="203" rx="10" ry="7" fill="#D9A983" opacity="0.22"/>
  <path d="M200 180 L 197 204 Q 200 209 206 204" stroke="#8C6A4C" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <path d="M188 214 Q 178 217 170 212" stroke="#4A443A" stroke-width="2.8" fill="none" stroke-linecap="round"/>
  <path d="M212 214 Q 222 217 230 212" stroke="#4A443A" stroke-width="2.8" fill="none" stroke-linecap="round"/>
  <path d="M190 222 Q 200 226 210 222" stroke="#8C4A40" stroke-width="2.2" fill="none" stroke-linecap="round"/>

  <path d="M150 372 L 250 372" stroke="#A9825E" stroke-width="10" opacity="0.8"/>
  <path d="M150 372 L 250 372" stroke="#6E543C" stroke-width="1.5" opacity="0.5"/>
  <path d="M132 330 C 150 342 168 348 186 350" stroke="#3D4A45" stroke-width="2" fill="none" opacity="0.4"/>
  <path d="M268 330 C 250 342 232 348 214 350" stroke="#3D4A45" stroke-width="2" fill="none" opacity="0.4"/>
</svg>
"""


def main():
    if not os.path.exists(CHROME):
        print("chrome not found:", CHROME)
        sys.exit(1)
    os.makedirs(BUILD, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    rng = random.Random(SEED)
    made = []
    for i in range(1, COUNT + 1):
        hat_name, hat_fn = HATS[(i - 1) % len(HATS)]
        robe = ROBES[rng.randrange(len(ROBES))]
        paper = PAPERS[rng.randrange(len(PAPERS))]
        beard = BEARDS[rng.randrange(len(BEARDS))]
        svg = build_svg(i, hat_fn, robe, beard(), paper)
        svg_path = os.path.join(BUILD, "av-%02d.svg" % i)
        with open(svg_path, "w", encoding="utf-8") as f:
            f.write(svg)
        png_path = os.path.join(OUT, "avatar-%02d.png" % i)
        cmd = [
            CHROME, "--headless=new", "--disable-gpu", "--no-sandbox",
            "--hide-scrollbars", "--window-size=200,200",
            "--screenshot=" + png_path,
            "file:///" + svg_path.replace("\\", "/"),
        ]
        subprocess.run(cmd, check=True, capture_output=True)
        # Chrome 截的是 200px PNG（约 28KB/张）；主包余量小，统一转 120px JPEG（约 2KB/张，
        # 展示尺寸 140rpx≈70px，1.7x 密度足够）
        from PIL import Image
        im = Image.open(png_path).convert("RGB").resize((120, 120), Image.LANCZOS)
        jpg_path = png_path[:-4] + ".jpg"
        im.save(jpg_path, "JPEG", quality=60, optimize=True)
        os.remove(png_path)
        made.append((os.path.basename(jpg_path), hat_name, robe[0]))
        print("ok", made[-1])
    print("total:", len(made))


if __name__ == "__main__":
    main()
