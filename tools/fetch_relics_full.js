// 全量拉取克利夫兰候选文物：下载全部原图与官方记录到 tmp/relic-full/，
// 并写出 prepare_relic_images.py 可消费的 manifest（sources.json）。
// 候选来自 tools/discover_relics.js 的缓存（tmp/relic-discovery/cma.json，CC0 + 中国 + 有图 + ≤1911）。
// 用法：node tools/fetch_relics_full.js
'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');

const ROOT = path.resolve(__dirname, '..');
const CACHE = path.join(ROOT, 'tmp', 'relic-discovery', 'cma.json');
const OUT = path.join(ROOT, 'tmp', 'relic-full');
const IMAGE_HOSTS = new Set(['openaccess-cdn.clevelandart.org']);
const CONCURRENCY = 4;

async function getJson(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    let response;
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    } catch (error) {
      if (attempt === 3) throw error;
    }
    if (response?.ok) return response.json();
    if (response && response.status < 500 && response.status !== 429 && response.status !== 403) {
      throw new Error(`${url}: HTTP ${response.status}`);
    }
    await delay((attempt + 1) * 1500);
  }
  throw new Error(`${url}: retries exhausted`);
}

async function download(url, dest) {
  for (let attempt = 0; attempt < 4; attempt++) {
    let response;
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
    } catch (error) {
      if (attempt === 3) throw error;
    }
    if (response?.ok) {
      const address = new URL(url);
      if (!IMAGE_HOSTS.has(address.hostname)) throw new Error(`unexpected image host ${address.hostname}`);
      const type = response.headers.get('content-type') || '';
      if (!type.startsWith('image/')) throw new Error(`${url}: not an image (${type})`);
      await fs.writeFile(dest, Buffer.from(await response.arrayBuffer()));
      return;
    }
    if (response && response.status < 500 && response.status !== 429 && response.status !== 403) {
      throw new Error(`${url}: HTTP ${response.status}`);
    }
    await delay((attempt + 1) * 1500);
  }
  throw new Error(`${url}: retries exhausted`);
}

async function main() {
  const candidates = JSON.parse(await fs.readFile(CACHE, 'utf8'));
  const curated = require(path.join(ROOT, 'miniprogram', 'relics', 'catalog.js'));
  const curatedIds = new Set(curated.RELICS.map((r) => r.id));
  // 已精修的 60 件不入批量管线（缩略图在分包、文案已人工写）
  const bulk = candidates.filter((r) => !curatedIds.has(r.id));
  console.log(`候选 ${candidates.length} 件，扣除已精修 ${curatedIds.size} 件，批量拉取 ${bulk.length} 件`);

  const originals = path.join(OUT, 'originals');
  await fs.mkdir(originals, { recursive: true });

  let done = 0;
  let next = 0;
  const failed = [];
  async function worker() {
    while (next < bulk.length) {
      const item = bulk[next++];
      const dest = path.join(originals, `${item.id}.jpg`);
      try {
        await fs.access(dest);
      } catch {
        try {
          await download(item.image, dest);
        } catch (error) {
          failed.push(`${item.id}: ${error.message}`);
          continue;
        }
      }
      if (++done % 100 === 0) console.log(`  ${done}/${bulk.length}`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  if (failed.length) {
    console.error(`下载失败 ${failed.length} 张：\n - ${failed.slice(0, 20).join('\n - ')}`);
    process.exitCode = 1;
  }

  // 官方记录快照（授权/馆藏号复核依据），并写 prepare 所需 manifest
  const sources = [];
  const expectedRatios = {};
  for (const item of bulk) {
    await fs.writeFile(
      path.join(originals, `${item.id}.json`),
      JSON.stringify(item, null, 1)
    );
    sources.push({
      id: item.id,
      accession: item.accession,
      collectionUrl: `https://www.clevelandart.org/art/${item.accession}`,
      apiUrl: `https://openaccess-api.clevelandart.org/api/artworks/?accession_number=${encodeURIComponent(item.accession)}&limit=1`,
      imageUrl: item.image,
      rights: 'CC0'
    });
  }
  await fs.writeFile(
    path.join(OUT, 'sources.json'),
    JSON.stringify({ sources, expectedRatios }, null, 1)
  );
  console.log(`完成：${bulk.length} 件原图与记录 → ${OUT}（失败 ${failed.length}）`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
