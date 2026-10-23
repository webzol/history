#!/usr/bin/env python3
"""全量人物/事件专属配图抓取（「只搜图，不画图」约定，授权见 assets/paintings/SOURCES.md）。

- miniprogram/data/img/persons/<id>.jpg  人物专属图（480×360 q55）
- miniprogram/data/img/events/<id>.jpg   事件专属图（280×280 q56，与 assets/eventart 同规格）
- miniprogram/utils/artRemote.js         生成远端可用 id 清单（eraImages.js 据此拼 jsDelivr URL）

目录 data/img 已被 project.config.json packOptions.ignore 排除出主包，
线上经 https://cdn.jsdelivr.net/gh/webzol/history@main/miniprogram/data/img/ 提供。

用法：
  python tools/add_all_art.py              # 全量（已存在的跳过，可断点重跑）
  python tools/add_all_art.py kongzi lanting   # 只处理指定 key
  python tools/add_all_art.py --force      # 忽略已有文件全部重抓

搜图源：百度图搜 flip 接口（项目内约定，同 add_person_art.py）。
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
IMG_DIR = ROOT / 'miniprogram/data/img'
PERSONS_DIR = IMG_DIR / 'persons'
EVENTS_DIR = IMG_DIR / 'events'
ARTREMOTE = ROOT / 'miniprogram/utils/artRemote.js'
for d in (PERSONS_DIR, EVENTS_DIR):
    d.mkdir(parents=True, exist_ok=True)

UA = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
      'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36')

# 人物查询词：id -> (中文名, 词1, 词2)；已具本地专属图的 han-wudi/wei-qing/zhang-qian/huo-qubing 不在此列
PERSON_Q = {
    'da-yu': ('大禹', '大禹 治水 古画', '大禹 画像'),
    'cheng-tang': ('商汤', '商汤 画像 古画', '商汤 王 画像'),
    'fu-hao': ('妇好', '妇好 画像', '妇好 女将军 雕像'),
    'zhou-wuwang': ('周武王', '周武王 画像', '周武王 伐纣 古画'),
    'zhou-gong': ('周公旦', '周公 画像 古画', '周公旦 制礼作乐'),
    'kongzi': ('孔子', '孔子 画像 古画', '孔子 行教图'),
    'laozi': ('老子', '老子 画像 古画', '老子 骑牛图'),
    'shang-yang': ('商鞅', '商鞅 画像', '商鞅变法 古画'),
    'qu-yuan': ('屈原', '屈原 画像 古画', '屈原 行吟图'),
    'qin-shihuang': ('秦始皇', '秦始皇 画像 古画', '秦始皇帝 画像'),
    'sima-qian': ('司马迁', '司马迁 画像', '司马迁 撰史记 古画'),
    'zhang-heng': ('张衡', '张衡 画像', '张衡 地动仪'),
    'cai-lun': ('蔡伦', '蔡伦 画像', '蔡伦 造纸 古画'),
    'guangwu': ('光武帝', '光武帝 刘秀 画像', '刘秀 画像 古画'),
    'ban-chao': ('班超', '班超 画像', '班超 投笔从戎'),
    'cao-cao': ('曹操', '曹操 画像 古画', '魏武帝 曹操 画像'),
    'zhuge-liang': ('诸葛亮', '诸葛亮 画像 古画', '诸葛亮 出师 画像'),
    'sima-yan': ('司马炎', '晋武帝 司马炎 画像', '司马炎 画像'),
    'chen-shou': ('陈寿', '陈寿 画像', '陈寿 三国志'),
    'wang-xizhi': ('王羲之', '王羲之 画像 古画', '王羲之 换鹅图'),
    'tao-yuanming': ('陶渊明', '陶渊明 画像', '陶渊明 归去来图'),
    'zu-chongzhi': ('祖冲之', '祖冲之 画像', '祖冲之 圆周率'),
    'xiao-wendi': ('孝文帝', '北魏孝文帝 画像', '孝文帝 拓跋宏'),
    'sui-wendi': ('隋文帝', '隋文帝 杨坚 画像', '杨坚 画像'),
    'sui-yangdi': ('隋炀帝', '隋炀帝 杨广 画像', '杨广 画像 古画'),
    'tang-taizong': ('李世民', '唐太宗 李世民 画像', '李世民 画像'),
    'wu-zetian': ('武则天', '武则天 画像 古画', '武则天 帝后像'),
    'xuanzang': ('玄奘', '玄奘 画像', '玄奘 取经图 壁画'),
    'li-bai': ('李白', '李白 画像 古画', '李白 行吟图'),
    'du-fu': ('杜甫', '杜甫 画像 古画', '杜甫 草堂 画像'),
    'zhu-wen': ('朱温', '朱温 画像', '后梁 太祖 画像'),
    'li-yu': ('李煜', '李煜 画像', '南唐 李煜 画像'),
    'yelu-abaoji': ('耶律阿保机', '耶律阿保机 画像', '辽太祖 画像'),
    'xiao-chuo': ('萧绰', '萧太后 画像', '萧绰 辽 画像'),
    'zhao-kuangyin': ('赵匡胤', '宋太祖 赵匡胤 画像', '赵匡胤 画像'),
    'wang-anshi': ('王安石', '王安石 画像', '王安石 变法 图'),
    'su-shi': ('苏轼', '苏轼 画像 古画', '苏东坡 画像'),
    'fan-zhongyan': ('范仲淹', '范仲淹 画像', '范仲淹 先忧后乐'),
    'li-yuanhao': ('李元昊', '李元昊 画像', '西夏 皇帝 画像'),
    'wanyan-aguda': ('完颜阿骨打', '完颜阿骨打 画像', '金太祖 画像'),
    'yue-fei': ('岳飞', '岳飞 画像 古画', '岳飞 像'),
    'zhu-xi': ('朱熹', '朱熹 画像 古画', '朱子 画像'),
    'cheng-jisihan': ('成吉思汗', '成吉思汗 画像', '元太祖 画像'),
    'kublai': ('忽必烈', '忽必烈 画像 古画', '元世祖 画像'),
    'guo-shoujing': ('郭守敬', '郭守敬 画像', '郭守敬 授时历'),
    'zheng-he': ('郑和', '郑和 画像', '郑和 宝船'),
    'yu-qian': ('于谦', '于谦 画像', '于谦 明朝 画像'),
    'qi-jiguang': ('戚继光', '戚继光 画像', '戚继光 抗倭'),
    'wang-shouren': ('王守仁', '王阳明 画像', '王守仁 画像'),
    'zhu-yuanzhang': ('朱元璋', '朱元璋 画像 古画', '明太祖 画像'),
    'zhu-di': ('朱棣', '明成祖 朱棣 画像', '朱棣 画像'),
    'li-shizhen': ('李时珍', '李时珍 画像', '李时珍 本草纲目'),
    'xu-guangqi': ('徐光启', '徐光启 画像', '徐光启 农政全书'),
    'song-yingxing': ('宋应星', '宋应星 画像', '宋应星 天工开物'),
    'zhang-juzheng': ('张居正', '张居正 画像', '张居正 明朝 画像'),
    'cao-xueqin': ('曹雪芹', '曹雪芹 画像', '曹雪芹 红楼梦'),
    'hong-xiuquan': ('洪秀全', '洪秀全 画像', '太平天国 洪秀全'),
    'zeng-guofan': ('曾国藩', '曾国藩 画像', '曾国藩 肖像'),
    'zuo-zongtang': ('左宗棠', '左宗棠 画像', '左宗棠 肖像'),
    'kangxi': ('康熙', '康熙 画像', '康熙帝 朝服像'),
    'qianlong': ('乾隆', '乾隆 画像', '乾隆帝 朝服像'),
    'lin-zexu': ('林则徐', '林则徐 画像', '林则徐 肖像'),
    'li-hongzhang': ('李鸿章', '李鸿章 画像', '李鸿章 肖像'),
    'lu-xun': ('鲁迅', '鲁迅 画像', '鲁迅 肖像 照片'),
    'chen-duxiu': ('陈独秀', '陈独秀 肖像', '陈独秀 画像'),
    'sun-zhongshan': ('孙中山', '孙中山 画像', '孙中山 肖像'),
    'deng-xiaoping': ('邓小平', '邓小平 画像', '邓小平 肖像'),
    'mao-zedong': ('毛泽东', '毛泽东 画像', '毛泽东 肖像'),
}

# 事件查询词：id -> (标题, 词1, 词2)；已具本地专属图的 6 个不在此列
EVENT_Q = {
    'xia-establish': ('禹传子启', '大禹 治水 古画', '夏朝 大禹'),
    'shang-tang': ('商汤灭夏', '商汤 灭夏 古画', '商汤 画像'),
    'zhou-wuwang': ('武王伐纣', '武王伐纣 古画', '牧野之战 古画'),
    'zhougong-lizhi': ('周公制礼作乐', '周公 画像 古画', '周公 制礼'),
    'qi-huan-gong': ('齐桓公称霸', '齐桓公 画像', '齐桓公 春秋'),
    'kongzi-sheng': ('孔子诞生', '孔子 圣迹图', '孔子 诞生 古画'),
    'shang-yang-bianfa': ('商鞅变法', '商鞅变法 古画', '商鞅 画像'),
    'changping': ('长平之战', '长平之战 古画', '长平之战 绘画'),
    'fen-shu': ('焚书坑儒', '焚书坑儒 古画', '焚书 绘画'),
    'chensheng': ('陈胜吴广起义', '陈胜吴广 起义', '大泽乡起义'),
    'chuhan': ('楚汉相争', '楚汉相争 古画', '鸿门宴 古画'),
    'simaqian-shiji': ('《史记》成书', '司马迁 史记 古画', '司马迁 画像'),
    'guangwu': ('光武中兴', '光武帝 刘秀 画像', '光武中兴 古画'),
    'banchao': ('班超经营西域', '班超 定远 画像', '班超 西域'),
    'cailun': ('蔡伦改进造纸术', '蔡伦 造纸 古画', '造纸术 古画'),
    'zhangheng': ('张衡造地动仪', '地动仪 复原', '张衡 地动仪'),
    'huangjin': ('黄巾起义', '黄巾起义 古画', '黄巾起义 绘画'),
    'guandu': ('官渡之战', '官渡之战 古画', '官渡之战 绘画'),
    'caopi': ('曹丕称帝', '曹丕 画像', '三国鼎立 古画'),
    'wuzhangyuan': ('诸葛亮病逝五丈原', '诸葛亮 五丈原', '诸葛亮 出师图'),
    'babwang-291': ('八王之乱', '八王之乱 古画', '西晋 战乱'),
    'yongjia-316': ('永嘉之乱', '永嘉之乱 古画', '衣冠南渡'),
    'lanting': ('兰亭雅集', '兰亭集序 古画', '兰亭修禊图'),
    'feishui': ('淝水之战', '淝水之战 古画', '淝水之战 绘画'),
    'zuchongzhi': ('祖冲之精算圆周率', '祖冲之 画像', '古代 算筹'),
    'xiaowen': ('孝文帝迁都洛阳', '孝文帝 迁都 洛阳', '北魏 迁都'),
    'sui-unify': ('隋灭陈统一', '隋 灭陈 古画', '隋朝 统一'),
    'keju': ('进士科始设', '科举考试 古画', '科举 殿试'),
    'xuanzang': ('玄奘西行求法', '玄奘 取经图', '玄奘 西行'),
    'wuzetian': ('武则天称帝', '武则天 画像', '武则天 称帝'),
    'huangchao': ('黄巢起义', '黄巢起义 古画', '黄巢 起义'),
    'zhuwen': ('朱温篡唐', '朱温 画像', '五代十国 古画'),
    'chairong': ('后周世宗改革', '柴荣 画像', '后周 世宗'),
    'jin-mie-liao': ('金灭辽', '金灭辽 古画', '辽金 战争'),
    'yuefei': ('岳飞郾城大捷', '岳飞 郾城', '岳飞 抗金'),
    'shaoxing': ('绍兴和议', '绍兴和议 古画', '宋金 和议'),
    'zhuxi-ehu': ('鹅湖之会', '鹅湖之会 古画', '朱熹 陆九渊'),
    'yashan': ('崖山海战', '崖山海战 古画', '崖山之战'),
    'mongol-1206': ('铁木真统一蒙古', '成吉思汗 骑射', '蒙古 铁骑'),
    'yuan-establish': ('忽必烈定国号元', '忽必烈 画像', '元大都 绘画'),
    'guo-shoujing': ('《授时历》颁行', '郭守敬 画像', '授时历 天文'),
    'hongjin': ('红巾军起义', '红巾军起义', '元末 起义'),
    'ming-establish': ('朱元璋建立明朝', '朱元璋 画像', '明太祖 画像'),
    'yongle-beijing': ('永乐迁都北京', '紫禁城 古画', '明代 北京城'),
    'bencao': ('《本草纲目》成书', '本草纲目 古籍', '李时珍 本草纲目'),
    'tiangong': ('《天工开物》刊行', '天工开物 插图', '天工开物 古籍'),
    'nongzheng': ('《农政全书》成书', '农政全书 古籍', '徐光启 农政全书'),
    'qing-ruguan': ('清军入关', '清军入关 古画', '山海关之战'),
    'sanfan': ('三藩之乱', '三藩之乱 古画', '康熙 平三藩'),
    'fuhao-1200': ('妇好领兵征伐', '妇好 画像', '妇好 青铜钺'),
    'ying-du-278': ('屈原投江', '屈原 行吟图', '屈原 投江 古画'),
    'jin-unify-280': ('西晋灭吴', '西晋灭吴 古画', '王濬 楼船'),
    'sanguozhi-290': ('陈寿撰《三国志》', '陈寿 画像', '三国志 古籍'),
    'nan-tang-975': ('宋灭南唐', '李煜 画像', '南唐 金陵'),
    'qingli-1043': ('庆历新政', '范仲淹 画像', '庆历 新政'),
    'siku-1773': ('编纂《四库全书》', '四库全书 古籍', '四库全书 书影'),
    'zhangqian-138': ('张骞出使西域', '张骞 出使西域 古画', '丝路 驼队'),
    'mobei-119': ('漠北之战', '漠北之战 古画', '汉匈 战争'),
    'zhenguan-627': ('贞观之治', '唐太宗 画像', '贞观之治 古画'),
    'kaiyuan-713': ('开元盛世', '开元盛世 古画', '唐 明皇'),
    'anshi-755': ('安史之乱', '安史之乱 古画', '安史之乱 绘画'),
    'chenqiao-960': ('陈桥兵变', '陈桥兵变 古画', '黄袍加身'),
    'chanyuan-1005': ('澶渊之盟', '澶渊之盟 古画', '澶州 宋辽'),
    'wanganshi-1069': ('王安石变法', '王安石变法 古画', '王安石 画像'),
    'jingkang-1127': ('靖康之变', '靖康之变 古画', '靖康之难'),
    'opium-war-1840': ('鸦片战争', '鸦片战争 古画', '鸦片战争 海战'),
    'jiawu-1894': ('甲午战争', '甲午海战', '甲午战争 绘画'),
    'wuxu-1898': ('戊戌变法', '戊戌变法', '戊戌六君子'),
    'newculture-1915': ('新文化运动', '新文化运动', '新青年 封面'),
    'xinhai-1911': ('辛亥革命', '辛亥革命', '武昌起义'),
    'mayfourth-1919': ('五四运动', '五四运动', '五四运动 绘画'),
    'mukden-1931': ('九一八事变', '九一八事变', '九一八 历史照片'),
    'zunyi-1935': ('遵义会议', '遵义会议 油画', '遵义会议 会址'),
    'kangzhan-1945': ('抗战胜利', '抗战胜利 历史照片', '日本投降'),
    'prc-1949': ('中华人民共和国成立', '开国大典 油画', '开国大典'),
    'reform-1978': ('十一届三中全会', '十一届三中全会', '十一届三中全会 会场'),
    'xuanwumen-626': ('玄武门之变', '玄武门之变 古画', '玄武门'),
    'beifa-1926': ('北伐战争', '北伐战争 历史照片', '北伐军'),
    'jinggangshan-1927': ('秋收起义与井冈山', '秋收起义 油画', '井冈山会师'),
    'longmarch-1934': ('红军长征', '红军长征 油画', '飞夺泸定桥'),
    'qidan-916': ('契丹建国', '耶律阿保机 画像', '契丹 壁画'),
    'xixia-1038': ('西夏立国', '李元昊 画像', '西夏 王陵'),
    'jurchen-1115': ('女真建国', '完颜阿骨打 画像', '女真 骑兵'),
    'tumu-1449': ('土木堡之变', '土木堡之变', '土木之变'),
    'zhangjuzheng-1581': ('张居正改革', '张居正 画像', '万历 朝'),
    'ming-wang-1644': ('崇祯自缢·明亡', '崇祯 画像', '煤山 崇祯'),
    'ningwang-1519': ('平定宁王之乱', '王阳明 画像', '宁王之乱'),
    'taizhou-1561': ('台州大捷', '戚继光 抗倭', '戚家军'),
    'kangxi-1681': ('平三藩·收台湾', '康熙 平三藩', '施琅 收复台湾'),
    'hongloumeng-1754': ('《红楼梦》成书', '红楼梦 改琦 插图', '红楼梦 古画'),
    'taiping-1851': ('太平天国运动', '太平天国 绘画', '洪秀全 画像'),
    'yangwu-1861': ('洋务运动', '洋务运动 历史照片', '江南制造总局'),
    'xinjiang-1878': ('收复新疆', '左宗棠 画像', '左宗棠 收复新疆'),
    'yuanmingyuan-1860': ('圆明园罹劫', '圆明园 铜版画', '圆明园 遗址'),
}


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


def crop_ratio(img, out_w, out_h):
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


def grab(key, cn, q1, q2, out, size, quality):
    """size=(w,h)。成功返回 True。"""
    if out.exists() and out.stat().st_size > 4000:
        print('  exists (%dKB) skip' % (out.stat().st_size // 1024), flush=True)
        return 'EXISTS'
    for q in (q1, q2):
        try:
            cands = baidu_search(q)
        except Exception as e:
            print('  search fail "%s": %s' % (q, e), flush=True)
            time.sleep(1.0)
            continue
        tried = 0
        for c in cands:
            if tried >= 8:
                break
            tried += 1
            img = fetch_img(c['murl'])
            if img:
                crop_ratio(img, size[0], size[1]).save(out, 'JPEG', quality=quality, optimize=True)
                print('  OK %dKB <- %s' % (out.stat().st_size // 1024, c['murl'][:70]), flush=True)
                return 'OK'
            time.sleep(0.2)
        time.sleep(0.6)
    return 'FAILED'


def write_artremote():
    persons = sorted(p.stem for p in PERSONS_DIR.glob('*.jpg') if p.stat().st_size > 4000)
    events = sorted(p.stem for p in EVENTS_DIR.glob('*.jpg') if p.stat().st_size > 4000)
    body = (
        '// 自动生成：tools/add_all_art.py —— 远端专属图可用清单（勿手改）\n'
        '// 图片在 miniprogram/data/img/{persons,events}/，主包外，经 jsDelivr 提供\n'
        '// eraImages.js 按 id 命中后拼 https://cdn.jsdelivr.net/gh/webzol/history@main/... URL\n'
        'module.exports = {\n'
        '  persons: ' + repr(persons).replace("'", "'") + ',\n'
        '  events: ' + repr(events).replace("'", "'") + '\n'
        '};\n'
    )
    ARTREMOTE.write_text(body, encoding='utf-8')
    print('\nartRemote.js: %d persons / %d events' % (len(persons), len(events)), flush=True)


def main():
    args = sys.argv[1:]
    force = '--force' in args
    keys = [a for a in args if not a.startswith('--')]
    if force:
        print('!! --force: 重抓全部（覆盖已有文件）', flush=True)

    results = {'person': {}, 'event': {}}
    for key, (cn, q1, q2) in PERSON_Q.items():
        if keys and key not in keys:
            continue
        out = PERSONS_DIR / (key + '.jpg')
        if force and out.exists():
            out.unlink()
        print('\n[person] %s (%s)' % (cn, key), flush=True)
        results['person'][key] = grab(key, cn, q1, q2, out, (480, 360), 55)
        time.sleep(0.5)

    for key, (cn, q1, q2) in EVENT_Q.items():
        if keys and key not in keys:
            continue
        out = EVENTS_DIR / (key + '.jpg')
        if force and out.exists():
            out.unlink()
        print('\n[event] %s (%s)' % (cn, key), flush=True)
        results['event'][key] = grab(key, cn, q1, q2, out, (280, 280), 56)
        time.sleep(0.5)

    write_artremote()
    print('\n=== SUMMARY ===', flush=True)
    failed = []
    for kind in ('person', 'event'):
        ok = sum(1 for v in results[kind].values() if v in ('OK', 'EXISTS'))
        total = len(results[kind])
        print('%s: %d/%d ok' % (kind, ok, total), flush=True)
        failed += ['%s:%s' % (kind[0], k) for k, v in results[kind].items() if v == 'FAILED']
    if failed:
        print('NEED-RETRY: %s' % ' '.join(failed), flush=True)
        print('重跑：python tools/add_all_art.py %s' % ' '.join(k.split(':')[1] for k in failed), flush=True)
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
