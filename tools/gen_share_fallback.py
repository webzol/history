#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""用小程序同一份 Canvas 绘制函数生成分享卡备用图。"""

from base64 import b64decode, b64encode
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'miniprogram' / 'assets'
CHROME = os.environ.get('CHROME_PATH', r'C:\Program Files\Google\Chrome\Application\chrome.exe')


def image_data(name, mime):
    return f'data:{mime};base64,' + b64encode((ASSETS / name).read_bytes()).decode('ascii')


def main():
    source = (ROOT / 'miniprogram/utils/qrshare.js').read_text(encoding='utf-8')
    images = {
        '/assets/palace.jpg': image_data('palace.jpg', 'image/jpeg'),
        '/assets/paper-bg.jpg': image_data('paper-bg.jpg', 'image/jpeg'),
        '/assets/seal.png': image_data('seal.png', 'image/png'),
    }
    html = """<!doctype html><meta charset="utf-8">
<canvas id="card"></canvas>
<pre id="jpeg"></pre>
<script>
const moduleStub = { exports: {} };
new Function('require', 'module', SOURCE)(() => ({}), moduleStub);
const { paintPoster, CANVAS_SIZE, CANVAS_HEIGHT } = moduleStub.exports;
Promise.all(Object.entries(IMAGES).map(([name, src]) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve([name, image]);
  image.onerror = () => reject(Error(name + ' 读取失败'));
  image.src = src;
}))).then((entries) => {
  const images = Object.fromEntries(entries);
  const canvas = document.getElementById('card');
  canvas.width = CANVAS_SIZE * 2;
  canvas.height = CANVAS_HEIGHT * 2;
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);
  paintPoster(ctx, {
    kicker: '阅史记',
    title: '共此卷',
    desc: '以千年为卷轴，读万古事。',
    quote: '究天人之际，通古今之变，成一家之言。',
    quoteSource: '《报任安书》'
  }, (id) => images[id]);
  document.getElementById('jpeg').textContent = canvas.toDataURL('image/jpeg', 0.82);
}).catch((error) => { document.getElementById('jpeg').textContent = error.message; });
</script>"""
    html = html.replace('SOURCE', json.dumps(source, ensure_ascii=False)).replace(
        'IMAGES', json.dumps(images)
    )
    with tempfile.TemporaryDirectory(prefix='history-share-fallback-') as directory:
        page = Path(directory) / 'card.html'
        page.write_text(html, encoding='utf-8')
        result = subprocess.run(
            [CHROME, '--headless=new', '--disable-gpu', '--no-sandbox', '--dump-dom',
             '--virtual-time-budget=2500', page.as_uri()],
            capture_output=True, check=True, timeout=40,
        )
    match = re.search(rb'<pre id="jpeg">data:image/jpeg;base64,([A-Za-z0-9+/=]+)</pre>', result.stdout)
    if not match:
        raise RuntimeError('Chrome 没有生成备用卡片。请检查浏览器或绘制函数。')
    output = ASSETS / 'share-fallback.jpg'
    output.write_bytes(b64decode(match.group(1)))
    print(f'OK {output.relative_to(ROOT)} ({output.stat().st_size} bytes)')


if __name__ == '__main__':
    main()
