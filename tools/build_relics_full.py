# 批量生成文物目录分片与配图同步：
#   1. 读 tmp/relic-discovery/cma.json（馆方全字段记录）+ relics/catalog.js（60 件精修条目）
#   2. 类型/时代/纪年/标题/材质/尺寸映射（馆方记录模板化，标注 t:1 未审校）
#   3. 输出 data/relics/index.json + detail-NN.json（packOptions 忽略，jsDelivr 分发）
#   4. 批量缩略/详情图同步到 data/img/relics/（CDN）
#   5. 重写 docs/relic-sources.json（精修 60 条逐条记录 + 批量段说明）
# 用法：python tools/build_relics_full.py [--work tmp/relic-full] [--dry]
"""Bulk relic catalog builder. Requires zhconv (pip install zhconv) for t2s."""

import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

try:
    from zhconv import convert as t2s
except ImportError:
    sys.exit("缺少 zhconv：pip install zhconv")

ROOT = Path(__file__).resolve().parents[1]
STEP = 200

TYPES = ["青铜", "陶瓷", "玉器", "书画", "雕塑", "漆器", "玻璃珐琅", "其他"]
ERAS = ["新石器时代", "二里头文化", "商", "西周", "东周", "汉", "魏晋南北朝",
        "唐", "五代", "宋", "元", "明", "清"]

CATEGORY = {
    "Metalwork": "青铜", "Silver": "青铜", "Vessels": "青铜",
    "Ceramic": "陶瓷",
    "Jade": "玉器", "Glyptic": "玉器",
    "Painting": "书画", "Calligraphy": "书画", "Print": "书画",
    "Drawing": "书画", "Bound Volume": "书画",
    "Sculpture": "雕塑", "Stone": "雕塑",
    "Lacquer": "漆器",
    "Glass": "玻璃珐琅", "Enamel": "玻璃珐琅",
}


def year_bucket(begin, end):
    y = end if end else begin
    if y < -2000:
        return "新石器时代", "新石器时代"
    if y < -1300:
        return "二里头文化", "二里头文化"
    if y < -1046:
        return "商", "商"
    if y < -771:
        return "西周", "西周"
    if y < -221:
        return "东周", "东周"
    if y < 220:
        return "汉", "汉"
    if y < 618:
        return "魏晋南北朝", "魏晋南北朝"
    if y < 907:
        return "唐", "唐"
    if y < 960:
        return "五代", "五代"
    if y < 1279:
        return "宋", "宋"
    if y < 1368:
        return "元", "元"
    if y < 1644:
        return "明", "明"
    return "清", "清"


DYNASTY_MAP = [
    ("Neolithic", "新石器时代", "新石器时代"),
    ("Erlitou", "二里头文化", "二里头文化"),
    ("Shang", "商", "商"),
    ("Western Zhou", "西周", "西周"),
    ("Eastern Zhou", "东周", "东周"),
    ("Spring and Autumn", "东周", "春秋"),
    ("Warring States", "东周", "战国"),
    ("Zhou Dynasty", None, "周"),
    ("Western Han", "汉", "西汉"),
    ("Eastern Han", "汉", "东汉"),
    ("Han Dynasty", "汉", "汉"),
    ("Three Kingdoms", "魏晋南北朝", "三国"),
    ("Southern Dynasties", "魏晋南北朝", "南朝"),
    ("Northern Dynasties", "魏晋南北朝", "北朝"),
    ("Six Dynasties", "魏晋南北朝", "六朝"),
    ("Jin Dynasty", None, "晋"),
    ("Sui Dynasty", "魏晋南北朝", "隋"),
    ("Tang Dynasty", "唐", "唐"),
    ("Five Dynasties", "五代", "五代"),
    ("Liao Dynasty", "宋", "辽"),
    ("Xi Xia", "宋", "西夏"),
    ("Northern Song", "宋", "北宋"),
    ("Southern Song", "宋", "南宋"),
    ("Song Dynasty", "宋", "宋"),
    ("Yuan Dynasty", "元", "元"),
    ("Ming Dynasty", "明", "明"),
    ("Qing Dynasty", "清", "清"),
]

CENTURY_WORDS = {"early": "早期", "mid": "中期", "late": "晚期", "first half": "前半",
                 "second half": "后半", "first quarter": "初", "second quarter": "前叶",
                 "third quarter": "中叶", "fourth quarter": "末"}

# 题名括号内的馆方拼音器名 → 汉字
PINYIN_GLOSS = [
    ("bi", "璧"), ("cong", "琮"), ("ding", "鼎"), ("gui", "簋"), ("zun", "尊"),
    ("jue", "爵"), ("pan", "盘"), ("yi", "匜"), ("you", "卣"),
    ("lei", "罍"), ("jia", "斝"), ("zhang", "璋"), ("ge", "戈"), ("fu", "斧"),
    ("yan", "甗"), ("gu", "觚"), ("zhi", "觯"), ("he", "盉"), ("bu", "钵"),
    ("dou", "豆"), ("huang", "璜"),
]

TITLE_PHRASES = [
    ("album of calligraphy and painting", "书画册"),
    ("double-handled", "双耳"), ("dagger axe", "戈"), ("dagger", "匕"),
    ("wine warmer", "温酒爵"), ("bovine mask", "牛首"), ("capped horns", "双角"),
    ("horses", "马"), ("jade blade", "玉戈"), ("ritual vessel", "礼器"),
    ("ritual object", "礼器"), ("ceremonial object", "礼器"),
    ("jar guan", "罐"), ("lidded", "带盖"),
    ("album of calligraphy and painting", "书画册"),
    ("double-handled", "双耳"), ("dagger axe", "戈"), ("dagger", "匕"),
    ("cong", "琮"), ("zhang", "璋"), ("ge", "戈"), ("jue", "爵"), ("you", "卣"),
    ("lei", "罍"), ("jia", "斝"), ("gu", "觚"), ("zhi", "觯"), ("bu", "钵"),
    ("dou", "豆"), ("huang", "璜"), ("hu", "壶"),
    ("snuff bottle", "鼻烟壶"), ("opium pipe", "鸦片烟枪"), ("opium", "鸦片"),
    ("blue-and-white", "青花"), ("blanc de chine", "德化白瓷"),
    ("famille rose", "粉彩"), ("famille verte", "五彩"), ("famille noire", "墨彩"),
    ("celadon glaze", "青釉"), ("celadon", "青瓷"),
    ("hanging scroll", "立轴"), ("handscroll", "手卷"), ("album leaf", "册页"),
    ("album of calligraphy", "书法册"), ("album of paintings", "画册"),
    ("album of landscapes", "山水册"), ("landscape album", "山水册"),
    ("calligraphy and painting", "书画"),
    ("paintings after ancient masters", "仿古人山水"),
    ("album of", "册"), ("album", "册"), ("leaf", "页"), ("scroll", "卷轴"),
    ("incense burner", "香炉"), ("censer", "香炉"),
    ("tea bowl", "茶盏"), ("wine cup", "酒杯"), ("water dropper", "水滴"),
    ("brush washer", "笔洗"), ("brush pot", "笔筒"), ("ink stone", "砚"),
    ("inkstone", "砚"), ("ink cake", "墨锭"), ("paperweight", "镇纸"),
    ("armrest", "臂搁"), ("writing box", "文具盒"),
    ("belt hook", "带钩"), ("sword fitting", "剑饰"),
    ("snuff", "鼻烟"), ("stopper", "盖塞"), ("pipe", "烟杆"),
    ("thumb ring", "扳指"), ("perforated disc", "玉璧"), ("ceremonial disc", "璧"),
    ("ceremonial tube", "琮"), ("ceremonial blade", "礼兵器"),
    ("mirror", "镜"), ("bottle", "壶瓶"), ("vase", "瓶"), ("jar", "罐"),
    ("bowl", "碗"), ("dish", "盘"), ("plate", "盘"), ("cup", "杯"),
    ("beaker", "杯"), ("box", "盒"), ("ewer", "执壶"), ("pot", "壶"),
    ("tripod", "三足器"), ("stand", "座"), ("lamp", "灯"), ("candlestand", "灯台"),
    ("cover", "盖"), ("lid", "盖"), ("handle", "耳"), ("spout", "流"),
    ("garment", "服饰"), ("robe", "袍"), ("textile", "织物"), ("rug", "毯"),
    ("fragment", "残片"), ("figure", "像"), ("head", "首"), ("mask", "兽面"),
    ("pendant", "佩"), ("plaque", "牌饰"), ("ornament", "饰"), ("fitting", "饰件"),
    ("comb", "梳"), ("hairpin", "簪"), ("bracelet", "镯"), ("earring", "耳饰"),
    ("ring", "环"), ("bead", "珠"), ("buckle", "扣"),
    ("sculpture", "塑像"), ("statue", "造像"), ("stele", "碑"),
    ("figurine", "俑"), ("tile", "砖"), ("brick", "砖"),
    ("screen", "屏"), ("fan", "扇"), ("chair", "椅"), ("table", "桌"),
    ("cabinet", "柜"), ("stool", "凳"), ("bed", "榻"),
    ("sword", "剑"), ("halberd", "戈"), ("knife", "刀"), ("axe", "斧"),
    ("bell", "钟"), ("drum", "鼓"), ("coin", "钱币"), ("seal", "印"),
    ("calligraphy", "书法"), ("paintings", "画册"), ("painting", "画"),
    ("landscape", "山水"), ("landscapes", "山水"), ("portrait", "像"),
    ("themes", "题"), ("poems", "诗"), ("poem", "诗"),
    ("dragon", "龙"), ("dragons", "龙"), ("phoenix", "凤"), ("tiger", "虎"),
    ("lotus", "莲"), ("peony", "牡丹"), ("chrysanthemum", "菊"),
    ("plum", "梅"), ("orchid", "兰"), ("bamboo", "竹"), ("pine", "松"),
    ("wisteria", "紫藤"), ("gourd", "瓜"), ("pomegranate", "石榴"),
    ("flower", "花"), ("flowers", "花卉"), ("floral", "花卉"),
    ("flowerpot", "花盆"), ("birds and flowers", "花鸟"), ("flower bird", "花鸟"),
    ("bird", "鸟"), ("birds", "鸟"),
    ("crane", "鹤"), ("deer", "鹿"), ("horse", "马"), ("buffalo", "牛"),
    ("dog", "犬"), ("cat", "猫"), ("rabbit", "兔"), ("monkey", "猴"),
    ("bat", "蝠"), ("bats", "蝠"), ("butterfly", "蝶"), ("fish", "鱼"),
    ("goose", "雁"), ("lion", "狮"), ("bear", "熊"), ("camel", "驼"),
    ("qilin", "麒麟"), ("taotie", "饕餮"),
    ("cloud", "云"), ("wave", "水波"), ("mountain", "山"),
    ("rock", "石"), ("garden", "园"), ("palace", "宫"), ("pavilion", "亭"),
    ("tower", "塔"), ("bridge", "桥"), ("boat", "舟"), ("river", "江"),
    ("stream", "溪"), ("moon", "月"), ("star", "星"),
    ("immortal", "仙"), ("immortals", "仙人"), ("daoist", "道"), ("buddhist", "佛"),
    ("buddha", "佛"), ("bodhisattva", "菩萨"), ("arhats", "罗汉"),
    ("arhat", "罗汉"), ("luohans", "罗汉"), ("luohan", "罗汉"),
    ("guanyin", "观音"),
    ("deities", "神"), ("deity", "神"), ("gods", "神"),
    ("one hundred", "百"), ("hundred", "百"), ("thousand", "千"),
    ("eighteen", "十八"), ("sixteen", "十六"),
    ("one", "一"), ("two", "二"), ("three", "三"), ("four", "四"),
    ("five", "五"), ("six", "六"), ("eight", "八"), ("nine", "九"), ("ten", "十"),
    ("pair", "成对"), ("double", "双"), ("old masters", "古人"), ("after", "仿"),
    ("wine", "酒"), ("tea", "茶"), ("autumn", "秋"), ("winter", "冬"),
    ("scholar", "文人"), ("ladies", "仕女"), ("lady", "仕女"),
    ("children", "婴戏"), ("boys", "童"), ("boy", "童"),
    ("procession", "出行"), ("court", "宫廷"), ("hunting", "猎"),
    ("grape", "葡萄"), ("grapes", "葡萄"), ("melon", "瓜"),
    ("shrimp", "虾"), ("egret", "鹭"), ("duck", "鸭"),
    ("quail", "鹌鹑"), ("magpie", "鹊"), ("swallow", "燕"), ("parrot", "鹦鹉"),
    ("kingfisher", "翠鸟"), ("rose", "蔷薇"), ("peach", "桃"), ("apricot", "杏"),
    ("narcissus", "水仙"), ("hibiscus", "芙蓉"), ("gardenia", "栀子"),
    ("camellia", "山茶"), ("poppy", "罂粟"),
    ("gilt", "鎏金"), ("inlaid", "镶嵌"), ("lacquer", "漆"),
    ("jade", "玉"), ("nephrite", "软玉"), ("silver", "银"), ("gold", "金"),
    ("bronze", "铜"), ("enamel", "珐琅"), ("glass", "玻璃"), ("cloisonn", "掐丝"),
    ("wood", "木"), ("bamboo carving", "竹刻"), ("ivory", "象牙"),
    ("coral", "珊瑚"), ("amber", "琥珀"),
    ("figures", "人物"), ("woodblock", "木刻"), ("print", "版画"),
    ("new year", "年画"),
    ("with", ""), ("of", ""), ("the", ""), ("and", ""), ("in", ""), ("on", ""),
    ("a", ""), ("an", ""), ("for", ""), ("from", ""), ("at", ""), ("by", ""),
    ("shaped", ""), ("form", ""), ("decoration", ""), ("decorated", ""),
    ("design", ""), ("pattern", ""), ("motif", ""), ("style", ""),
    ("jian ware", "建盏"), ("yue ware", "越窑瓷"), ("cizhou ware", "磁州窑"),
    ("ding ware", "定窑"), ("longquan ware", "龙泉窑"), ("guan ware", "官窑"),
    ("ware", "窑"), ("glazed", "釉"), ("glaze", "釉"), ("porcelain", "瓷"),
    ("stoneware", "炻器"), ("earthenware", "陶器"),
    ("yue", "越窑"), ("cizhou", "磁州窑"), ("ding", "定窑"), ("longquan", "龙泉窑"),
    ("jun", "钧窑"), ("ru", "汝窑"), ("jian", "建窑"), ("xing", "邢窑"),
    ("yaozhou", "耀州窑"), ("jingdezhen", "景德镇"), ("qingbai", "青白釉"),
    ("sancai", "三彩"), ("fahua", "珐华"), ("dehua", "德化"),
    ("wucai", "五彩"),
]


def translate_title(en):
    en_clean = re.sub(r"\([^)]*\)", " ", en.strip())
    en_low = " " + en_clean.lower() + " "
    paren = en.strip().lower()
    zh_extra = ""
    for pinyin, zh in PINYIN_GLOSS:
        if "(" + pinyin + ")" in paren:
            zh_extra += " " + zh + " "
    out = en_low + zh_extra
    for phrase, zh in TITLE_PHRASES:
        if not phrase:
            continue
        if re.fullmatch(r"[a-z](?:[a-z -]*[a-z])?", phrase):
            # ASCII 短语按词边界替换，避免 "an" 命中 "jian" 中段这类误伤
            out = re.sub(r"(?<![a-z])" + phrase.replace(" ", "\s+") + r"(?![a-z])",
                         lambda m: " " + zh + " ", out)
        elif phrase in out:
            out = out.replace(phrase, " " + zh + " ")
    tokens = [t for t in out.split() if t]
    zh_tokens = [t for t in tokens if not re.fullmatch(r"[a-z'-]+", t)]
    leftover = [t for t in tokens if re.fullmatch(r"[a-z'-]+", t)]
    if zh_tokens and not leftover:
        return "".join(zh_tokens)
    if zh_tokens and len("".join(zh_tokens)) >= 4 and len(leftover) <= 1:
        return "".join(zh_tokens)
    return ""


def zh_date(en, begin, end):
    if not en:
        return year_bucket(begin, end)[1] + "藏品"
    s = str(en).strip()
    if re.search(r"\bBCE?\b", s, re.I):
        nums = [int(n) for n in re.findall(r"\d{3,4}", s)]
        if len(nums) >= 2:
            return f"公元前{nums[0]}至前{nums[1]}年"
        if len(nums) == 1:
            return f"公元前{nums[0]}年"
    s = re.sub(r"\bCE?\b", "", s, flags=re.I)
    s = re.sub(r"\bc\.\s*", "约", s, flags=re.I)
    s = re.sub(r"\bcirca\s*", "约", s, flags=re.I)
    s = re.sub(r"\bof\s+(the\s+)?", " ", s, flags=re.I)
    for word, zh in CENTURY_WORDS.items():
        s = re.sub(r"\b" + word.replace(" ", r"\s+") + r"\b", zh + " ", s, flags=re.I)
    s = re.sub(r"(\d+)(?:st|nd|rd|th)\s+centur(y|ies)",
               lambda m: m.group(1) + "世纪", s, flags=re.I)

    def expand(m):
        a, b = m.group(1), m.group(2)
        if len(b) < len(a):
            b = a[: len(a) - len(b)] + b
        return f"{a}–{b}"
    s = re.sub(r"\b(\d{3,4})\s*[–-]\s*(\d{1,4})\b", expand, s)

    def century(m):
        return f"{(int(m.group(1)) - 1) // 100 + 1}世纪"
    s = re.sub(r"\b(\d{3,4})s\b", century, s)
    s = re.sub(r"(早期|中期|晚期|前半|后半|初|前叶|中叶|末)\s*(\d+世纪)", r"\2\1", s)
    s = re.sub(r"(\d{3,4}(?:\s*[–-]\s*\d{3,4})?)(?!\d)", lambda m: m.group(1) + "年", s)
    if re.search(r"\d", s):
        s = "公元" + s
    return re.sub(r"\s+", " ", s).strip() or year_bucket(begin, end)[1] + "藏品"


DIM_LABELS = {"overall": "通", "diameter": "直径", "diam": "直径", "height": "高",
              "h": "高", "length": "长", "l": "长", "width": "宽", "w": "宽",
              "thickness": "厚", "depth": "深", "w. lid": "连盖", "with lid": "连盖",
              "lid": "盖", "vessel only": "器身", "image": "画心", "painting": "画心",
              "sheet": "纸", "each": "每件", "base": "底径", "top": "口径"}


def zh_dimensions(measure):
    if not measure:
        return ""
    parts = []
    for m in re.finditer(r"([A-Za-z][A-Za-z /.'’]*?):\s*([\d.]+)\s*cm", measure):
        label = re.sub(r"\s+", " ", m.group(1)).strip().lower()
        zh = DIM_LABELS.get(label, "")
        val = m.group(2)
        parts.append(f"{zh}{val}厘米" if zh else f"{val}厘米")
    if parts:
        return "，".join(parts[:3])
    nums = re.findall(r"([\d.]+)\s*cm", measure)
    return "约" + " × ".join(nums[:2]) + "厘米" if nums else ""


def zh_material(record, category):
    tech = (record.get("technique") or "") + " " + (record.get("materials") or "")
    tech_low = tech.lower()
    title_low = (record.get("title") or "").lower()
    if category == "陶瓷":
        if "porcelain" in tech_low:
            return "瓷"
        if "stoneware" in tech_low:
            return "炻器"
        if "earthenware" in tech_low:
            return "陶器"
        return "陶瓷"
    if category == "青铜":
        if "gilt" in tech_low:
            return "鎏金青铜"
        if "silver" in tech_low:
            return "银"
        return "青铜"
    if category == "玉器":
        return "软玉" if "nephrite" in tech_low else "玉"
    if category == "书画":
        if "silk" in tech_low:
            return "绢本"
        if "paper" in tech_low:
            return "纸本"
        return "纸绢"
    if category == "雕塑":
        for key, zh in (("bronze", "铜"), ("wood", "木"), ("stone", "石"), ("clay", "泥")):
            if key in tech_low:
                return zh
        return "造像"
    if category == "漆器":
        return "漆木"
    if category == "玻璃珐琅":
        return "珐琅" if "enamel" in tech_low else "玻璃"
    for key, zh in (("ink", "墨"), ("wood", "木"), ("ivory", "象牙"),
                    ("glass", "玻璃"), ("silver", "银"), ("horn", "角"),
                    ("bone", "骨"), ("stone", "石"), ("bamboo", "竹")):
        if key in tech_low or key in title_low:
            return zh
    return "多种材质"


def period_of(record):
    coll = (record.get("collection") or "") + " " + " ".join(record.get("culture") or [])
    begin, end = record.get("begin") or 0, record.get("end") or 0
    for key, era, period in DYNASTY_MAP:
        if key.lower() in coll.lower():
            if era is None:
                if key == "Zhou Dynasty":
                    era, period = ("西周", "西周") if end < -771 else ("东周", "东周")
                elif key == "Jin Dynasty":
                    if begin > 1000:
                        era, period = "宋", "金"
                    else:
                        era, period = "魏晋南北朝", "晋"
                else:
                    continue
            return era, period
    return year_bucket(begin, end)


CURATED_YEAR = {
    "44757": -2400, "cma-1953.628": -4000, "49376": -1500, "cma-1991.115": -1700,
    "cma-1989.150": -1600, "60514": -1250, "cma-1915.630": -1300, "53561": -1150,
    "44617": -1200, "748361": -1250, "cma-1952.490": -1000, "42176": -1050,
    "42167": -1050, "cma-1989.3": -750, "44784": -510, "61403": -450,
    "75242": -450, "39637": -250, "74527": -250, "cma-1986.46.a": -150,
    "cma-1946.238": -100, "cma-1952.473": -100, "cma-1989.71": 100,
    "cma-1995.296": 100, "cma-1995.326": 200, "cma-1970.152": 300,
    "cma-1963.579": 450, "cma-2017.16": 400, "cma-1973.84": 500,
    "cma-1930.731": 550, "cma-1995.352": 650, "cma-1973.74": 750,
    "49368": 750, "cma-2000.118.1": 710, "cma-1918.470": 900, "cma-1975.92": 900,
    "cma-1959.348": 970, "cma-1957.40": 1090, "39919": 1095, "39918": 1095,
    "cma-1953.126": 1125, "cma-1933.220": 1130, "cma-1983.85": 1200,
    "42480": 1200, "cma-1948.206": 1200, "cma-1961.421": 1256, "cma-1958.427": 1260,
    "cma-1961.92": 1350, "45684": 1493, "cma-1954.582": 1490, "45685": 1500,
    "45797": 1540, "42514": 1400, "42526": 1580, "cma-1962.223": 1680,
    "49167": 1690, "36071": 1693, "cma-1971.145": 1760, "cma-1952.510": 1760,
}


def jpeg_size(path):
    with open(path, "rb") as fh:
        if fh.read(2) != b"\xff\xd8":
            raise ValueError("not a jpeg")
        while True:
            b = fh.read(1)
            if not b:
                raise ValueError("no SOF")
            if b != b"\xff":
                continue
            marker = fh.read(1)
            while marker == b"\xff":
                marker = fh.read(1)
            if marker[0] in range(0xC0, 0xD0) and marker[0] not in (0xC4, 0xC8, 0xCC):
                fh.read(3)
                h = int.from_bytes(fh.read(2), "big")
                w = int.from_bytes(fh.read(2), "big")
                return w, h
            length = int.from_bytes(fh.read(2), "big")
            fh.seek(length - 2, 1)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--work", type=Path, default=ROOT / "tmp" / "relic-full")
    parser.add_argument("--assets", type=Path, default=None)
    parser.add_argument("--dry", action="store_true")
    args = parser.parse_args()
    assets = args.assets or (args.work / "assets")

    out_root = ROOT / "miniprogram" / "data" / "relics"
    img_root = ROOT / "miniprogram" / "data" / "img" / "relics"

    curated_out = subprocess.check_output([
        "node", "-e",
        "const c=require('./miniprogram/relics/catalog.js');"
        "process.stdout.write(JSON.stringify(c.RELICS))"
    ], cwd=str(ROOT), text=True, encoding="utf-8")
    curated = json.loads(curated_out)
    curated_ids = {r["id"] for r in curated}

    candidates = json.loads((ROOT / "tmp" / "relic-discovery" / "cma.json").read_text(encoding="utf-8"))
    acc_set = {r["accession"] for r in candidates}
    bulk = []
    for r in candidates:
        acc = r["accession"]
        if re.search(r"\.[a-z]+$", acc, re.I):
            base = re.sub(r"\.[a-z]+$", "", acc, flags=re.I)
            if base in acc_set:
                continue
        if r["id"] in curated_ids:
            continue
        bulk.append(r)
    print(f"精修 {len(curated)} 件 + 批量 {len(bulk)} 件 = {len(curated) + len(bulk)} 件")

    rows = []
    details = {}
    missing_img = []
    type_stats = {}
    zh_title_count = 0
    id2sort = {}
    for r in curated:
        rows.append({"id": r["id"], "title": r["title"], "period": r["period"], "type": r["type"]})
        entry = {
            "title": r["title"], "period": r["period"], "date": r["date"],
            "material": r["material"], "dimensions": r["dimensions"],
            "accession": r["accession"], "description": r["description"],
            "imageRatio": r["imageRatio"],
        }
        if r.get("imageNote"):
            entry["imageNote"] = r["imageNote"]
        details[r["id"]] = entry
        year = CURATED_YEAR.get(r["id"], 1900)
        id2sort[r["id"]] = (year, year, r["id"])

    for r in bulk:
        category = CATEGORY.get(r["type"], "其他")
        _, period_head = period_of(r)
        date_zh = zh_date(r.get("date"), r.get("begin") or 0, r.get("end") or 0)
        title = (r.get("titleZh") or "").strip()
        if title:
            title = t2s(title, "zh-cn").strip()
        if title:
            zh_title_count += 1
        else:
            title = translate_title(r["title"])
        if not title:
            title = r["title"]
        material = zh_material(r, category)
        dims = zh_dimensions(r.get("dimensions"))
        desc = (
            f"克利夫兰艺术博物馆藏{period_head}遗珍。年代：{date_zh}。"
            f"材质：{material}。"
            + (f"尺寸：{dims}。" if dims else "")
            + f"馆藏号 {r['accession']}。条目按馆方开放数据生成，未经史实审校。"
        )
        detail_path = assets / f"detail-{r['id']}.jpg"
        if not detail_path.exists():
            missing_img.append(r["id"])
            continue
        width, height = jpeg_size(detail_path)
        ratio = round(height * 100 / width, 3)
        rows.append({"id": r["id"], "title": title, "period": period_head, "type": category})
        details[r["id"]] = {
            "title": title, "period": period_head, "date": date_zh,
            "material": material, "dimensions": dims, "accession": r["accession"],
            "description": desc, "imageRatio": ratio, "t": 1,
        }
        type_stats[category] = type_stats.get(category, 0) + 1
        id2sort[r["id"]] = (r.get("begin") or 0, r.get("end") or 0, r["id"])

    if missing_img:
        print(f"缺配图 {len(missing_img)} 件（跳过）：{missing_img[:10]}…")

    rows.sort(key=lambda row: id2sort[row["id"]])
    shards = []
    for i in range(0, len(rows), STEP):
        chunk = rows[i:i + STEP]
        shards.append({"v": 1, "items": {row["id"]: details[row["id"]] for row in chunk}})

    # 首屏只拉 index-head（前 200 行 + 精确计数元数据），其余行进 index-part-NN 后台/按需补。
    # ERA_ALIAS 与 relics/pages/relic-list/relic-list.js 的 ERA_MATCH 保持一致（显示期名 → 筛选时代）。
    ERA_ALIAS = {
        "新石器时代": ["新石器时代"], "二里头文化": ["二里头文化"], "商": ["商"], "西周": ["西周"],
        "东周": ["东周", "春秋", "战国"], "汉": ["汉", "秦"],
        "魏晋南北朝": ["魏晋南北朝", "三国", "晋", "南朝", "北朝", "六朝", "隋"],
        "唐": ["唐"], "五代": ["五代"], "宋": ["宋", "辽", "金", "西夏"],
        "元": ["元"], "明": ["明"], "清": ["清"],
    }

    def era_of_period(period_head):
        for era, aliases in ERA_ALIAS.items():
            if any(alias in period_head for alias in aliases):
                return era
        return "其他"

    type_counts = {t: 0 for t in TYPES}
    era_counts = {e: 0 for e in ERAS}
    joint = {t: {e: 0 for e in ERAS} for t in TYPES}
    for row in rows:
        era = era_of_period(row["period"])
        if row["type"] in type_counts:
            type_counts[row["type"]] += 1
        if era in era_counts:
            era_counts[era] += 1
        if row["type"] in joint and era in joint[row["type"]]:
            joint[row["type"]][era] += 1

    head_rows = rows[:STEP]
    head = {
        "v": 2,
        "total": len(rows),
        "step": STEP,
        "parts": len(shards),
        "types": TYPES,
        "eras": ERAS,
        "typeCounts": type_counts,
        "eraCounts": era_counts,
        "joint": joint,
        "rows": head_rows,
    }
    parts_rows = [rows[i:i + STEP] for i in range(STEP, len(rows), STEP)]
    print("类别分布:", type_stats)
    print("中文题名（原题名+词表）:", zh_title_count, "/", len(bulk))

    if args.dry:
        return

    out_root.mkdir(parents=True, exist_ok=True)
    old_index = out_root / "index.json"
    if old_index.exists():
        old_index.unlink()
    (out_root / "index-head.json").write_text(
        json.dumps(head, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    for n, part_rows in enumerate(parts_rows, start=1):
        (out_root / f"index-part-{n:02d}.json").write_text(
            json.dumps({"v": 2, "rows": part_rows}, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8")
    for n, shard in enumerate(shards):
        (out_root / f"detail-{n:02d}.json").write_text(
            json.dumps(shard, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    img_root.mkdir(parents=True, exist_ok=True)
    copied = 0
    for r in bulk:
        if r["id"] not in details:
            continue
        shutil.copyfile(assets / f"detail-{r['id']}.jpg", img_root / f"{r['id']}.jpg")
        shutil.copyfile(assets / f"thumb-{r['id']}.jpg", img_root / f"thumb-{r['id']}.jpg")
        copied += 1
    print(f"分片 {len(shards) + 1} 个 → {out_root}；同步配图 {copied} 组 → {img_root}")

    existing = json.loads((ROOT / "docs" / "relic-sources.json").read_text(encoding="utf-8"))
    curated_sources = existing["curated"] if isinstance(existing, dict) else existing
    doc = {
        "curated": curated_sources,
        "bulk": {
            "museum": "克利夫兰艺术博物馆",
            "license": "CC0",
            "count": len(bulk),
            "api": "https://openaccess-api.clevelandart.org/api/artworks/",
            "query": "department=Chinese Art&cc0=1&has_image=1（creation_date_latest ≤ 1911）",
            "pulledAt": "2026-11-28",
            "note": "批量条目按馆方记录模板生成（build_relics_full.py），馆方页 https://www.clevelandart.org/art/<馆藏号>，未经史实审校。",
        },
    }
    (ROOT / "docs" / "relic-sources.json").write_text(
        json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("relic-sources.json 已重写（精修 + 批量段）")


if __name__ == "__main__":
    main()
