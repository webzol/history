#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""「我的」页随机头像变体生成器。

沿用 tools/avatar-scholar.svg 的手绘史官画风。前 20 张按固定种子组合，
后续头像逐款绘制冠巾并搭配袍色，经 Chrome 渲染并压成 120×120 JPEG。

复现全部：python tools/gen_avatars.py
只生成新增一组：python tools/gen_avatars.py --start 21
"""
import argparse
import os
from pathlib import Path
import random
import subprocess
import sys
import tempfile

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "miniprogram", "assets", "avatars")
CHROME = os.environ.get("CHROME_PATH", r"C:\Program Files\Google\Chrome\Application\chrome.exe")
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


def hair_flower(ink, cloth):
    return f"""
  <path d="M138 184 C126 143 141 94 182 91 C211 67 254 91 260 126 L264 182 Q253 176 245 148 Q220 144 196 117 Q179 140 151 150 Z" fill="{ink}"/>
  <ellipse cx="183" cy="80" rx="29" ry="23" transform="rotate(-17 183 80)" fill="{ink}"/>
  <path d="M151 136 Q178 116 184 98 M211 111 Q235 121 244 137" fill="none" stroke="#786756" stroke-width="2.5"/>
  <path d="M159 93 L236 69" stroke="#C1915F" stroke-width="5" stroke-linecap="round"/>
  <path d="M229 76 C209 72 217 57 228 61 C238 48 250 58 244 69 C259 75 245 91 235 83 Z" fill="{cloth}" stroke="#694940" stroke-width="2"/>
  <circle cx="235" cy="72" r="4" fill="#EDC58F"/>"""


def hair_double_buns(ink, cloth):
    return f"""
  <ellipse cx="150" cy="91" rx="24" ry="27" transform="rotate(-31 150 91)" fill="{ink}"/>
  <ellipse cx="250" cy="91" rx="24" ry="27" transform="rotate(31 250 91)" fill="{ink}"/>
  <path d="M142 179 C129 159 137 123 155 112 Q200 80 245 112 C263 123 271 159 258 179 L248 148 Q220 139 200 112 Q179 140 152 148 Z" fill="{ink}"/>
  <path d="M134 112 Q148 94 168 104 M232 104 Q250 94 266 112" stroke="{cloth}" stroke-width="7" fill="none" stroke-linecap="round"/>
  <path d="M145 107 Q131 130 134 157 M255 107 Q269 131 266 157" stroke="{cloth}" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M161 135 Q186 121 194 109 M239 135 Q214 121 206 109" stroke="#71604F" stroke-width="2.3" fill="none"/>"""


def hat_bamboo(ink, cloth):
    return f"""
  <path d="M144 141 Q135 163 140 183 M256 141 Q265 163 260 183" stroke="{ink}" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M96 139 Q149 101 190 62 Q200 57 211 63 Q250 98 304 139 Q201 160 96 139 Z" fill="#C7A377" stroke="#674C37" stroke-width="3"/>
  <path d="M111 136 Q199 118 290 135 M136 120 Q198 104 264 120 M159 101 Q200 91 241 103 M184 80 Q201 77 218 82" fill="none" stroke="#876240" stroke-width="2.6"/>
  <path d="M120 137 Q198 111 195 65 M280 137 Q204 111 205 65" fill="none" stroke="#F0D2A1" stroke-width="2.5" opacity="0.75"/>
  <path d="M112 142 Q200 154 288 142" fill="none" stroke="{cloth}" stroke-width="5"/>"""


def hat_folded_cloth(ink, cloth):
    return f"""
  <path d="M143 144 Q138 94 165 74 Q194 50 220 68 Q249 78 256 137 L241 151 L160 149 Z" fill="{cloth}" stroke="{ink}" stroke-width="3"/>
  <path d="M150 122 Q170 100 207 79 L231 84 Q199 91 175 129" fill="#EFE4C9" opacity="0.36"/>
  <path d="M159 96 Q179 112 199 122 Q228 127 250 110 M155 129 Q198 115 243 137" fill="none" stroke="{ink}" stroke-width="3" opacity="0.6"/>
  <path d="M235 132 Q258 120 265 137 Q269 149 259 159 L269 187 L257 184 L250 155 Q238 152 235 132 Z" fill="{cloth}" stroke="{ink}" stroke-width="2.5"/>
  <path d="M147 138 Q199 127 252 137 L251 150 Q200 141 149 152 Z" fill="{ink}" opacity="0.83"/>"""


def hat_felt(ink, cloth):
    return f"""
  <path d="M146 143 Q147 86 190 65 Q200 59 209 65 Q254 84 255 145 Z" fill="{cloth}" stroke="{ink}" stroke-width="3"/>
  <path d="M199 66 Q177 93 173 120 M204 66 Q229 93 233 120" fill="none" stroke="#E4C7A2" stroke-width="2.5" opacity="0.55"/>
  <path d="M141 126 Q199 115 259 126 L253 147 Q201 137 147 149 Z" fill="#CCAF86" stroke="#5F4A38" stroke-width="3"/>
  <path d="M148 136 Q200 125 253 136" fill="none" stroke="#F1D9B0" stroke-width="2.5" stroke-dasharray="5 4"/>
  <path d="M197 68 Q183 47 194 43 Q207 48 202 67" fill="#9A5A50" stroke="#694036" stroke-width="2"/>"""


def hair_jade_pin(ink, cloth):
    return f"""
  <path d="M137 185 Q125 154 143 120 Q156 96 181 91 Q184 72 202 65 Q229 58 238 82 Q241 94 236 102 Q270 124 262 183 L250 174 Q244 153 221 137 Q199 136 186 119 Q171 146 150 150 L146 181 Z" fill="{ink}"/>
  <path d="M142 183 Q137 213 128 243 Q135 253 149 249 L156 194 M257 182 Q263 212 272 242 Q263 250 252 248 L244 194" fill="{ink}"/>
  <path d="M160 138 Q181 119 191 98 M204 89 Q219 78 230 85 M208 121 Q230 126 246 146" fill="none" stroke="#7D6854" stroke-width="2.3"/>
  <path d="M167 112 L245 101" stroke="#D6B681" stroke-width="5" stroke-linecap="round"/>
  <path d="M238 97 Q250 82 256 96 Q256 108 241 108 Z" fill="{cloth}" stroke="#DFD2B4" stroke-width="2.2"/>
  <path d="M246 107 L247 128 M253 103 L256 121" stroke="#C7A777" stroke-width="2.5"/>
  <circle cx="247" cy="130" r="4" fill="#E7D6AF"/>
  <circle cx="256" cy="123" r="4" fill="#E7D6AF"/>"""


# 每张新头像独立选择袍色和冠巾轮廓，保持在小尺寸下可辨认。
NEW_PORTRAITS = [
    ("簪花高髻", hair_flower, ROBES[2], beard_none, PAPERS[0]),
    ("双髻垂带", hair_double_buns, ROBES[5], beard_none, PAPERS[2]),
    ("竹笠访客", hat_bamboo, ROBES[8], beard_short, PAPERS[1]),
    ("叠巾书客", hat_folded_cloth, ROBES[1], beard_none, PAPERS[3]),
    ("毡帽行客", hat_felt, ROBES[3], beard_long, PAPERS[2]),
    ("玉簪长髻", hair_jade_pin, ROBES[0], beard_none, PAPERS[0]),
]


def build_svg(hat, robe, beard, paper, moustache):
    p0, p1, halo, ring = paper
    name, top, bot = robe
    ink = "#26231F" if name not in ("玄墨",) else "#1B1916"
    facial_hair = """
  <path d="M188 214 Q 178 217 170 212" stroke="#4A443A" stroke-width="2.8" fill="none" stroke-linecap="round"/>
  <path d="M212 214 Q 222 217 230 212" stroke="#4A443A" stroke-width="2.8" fill="none" stroke-linecap="round"/>""" if moustache else ""
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
  {facial_hair}
  <path d="M190 222 Q 200 226 210 222" stroke="#8C4A40" stroke-width="2.2" fill="none" stroke-linecap="round"/>

  <path d="M150 372 L 250 372" stroke="#A9825E" stroke-width="10" opacity="0.8"/>
  <path d="M150 372 L 250 372" stroke="#6E543C" stroke-width="1.5" opacity="0.5"/>
  <path d="M132 330 C 150 342 168 348 186 350" stroke="#3D4A45" stroke-width="2" fill="none" opacity="0.4"/>
  <path d="M268 330 C 250 342 232 348 214 350" stroke="#3D4A45" stroke-width="2" fill="none" opacity="0.4"/>
</svg>
"""


def main():
    standard_count = 20
    total = standard_count + len(NEW_PORTRAITS)
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("count", type=int, nargs="?", default=total, help="最后一个头像编号")
    parser.add_argument("--start", type=int, default=1, help="第一个头像编号")
    args = parser.parse_args()
    if not 1 <= args.start <= args.count <= total:
        parser.error(f"头像编号须在 1 到 {total} 之间，且起始编号不得超过最后编号")
    if not os.path.exists(CHROME):
        print("chrome not found:", CHROME)
        sys.exit(1)
    os.makedirs(OUT, exist_ok=True)
    rng = random.Random(SEED)
    portraits = []
    for i in range(1, standard_count + 1):
        hat_name, hat_fn = HATS[(i - 1) % len(HATS)]
        robe = ROBES[rng.randrange(len(ROBES))]
        paper = PAPERS[rng.randrange(len(PAPERS))]
        beard = BEARDS[rng.randrange(len(BEARDS))]
        portraits.append((hat_name, hat_fn, robe, beard, paper))
    portraits.extend(NEW_PORTRAITS)
    with tempfile.TemporaryDirectory(prefix="history-avatars-") as folder:
        svg_path = Path(folder) / "avatar.svg"
        png_path = Path(folder) / "avatar.png"
        for i in range(args.start, args.count + 1):
            hat_name, hat_fn, robe, beard, paper = portraits[i - 1]
            moustache = i <= standard_count or beard is not beard_none
            svg_path.write_text(build_svg(hat_fn, robe, beard(), paper, moustache), encoding="utf-8")
            cmd = [
                CHROME, "--headless=new", "--disable-gpu", "--no-sandbox",
                "--hide-scrollbars", "--window-size=200,200", "--force-device-scale-factor=1",
                "--screenshot=" + str(png_path), svg_path.as_uri(),
            ]
            subprocess.run(cmd, check=True, capture_output=True)
            with Image.open(png_path) as image:
                thumbnail = image.convert("RGB").resize((120, 120), Image.Resampling.LANCZOS)
            jpg_path = Path(OUT) / f"avatar-{i:02d}.jpg"
            thumbnail.save(jpg_path, "JPEG", quality=60, optimize=True)
            print("ok", jpg_path.name, hat_name, robe[0], jpg_path.stat().st_size)
    print("total:", args.count - args.start + 1)


if __name__ == "__main__":
    main()
