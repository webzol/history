// Download the official source records and rebuild the curated relic images in tmp/.
'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { setTimeout: delay } = require('node:timers/promises');
const { RELICS, sourceFor } = require('../miniprogram/relics/catalog.js');

const ROOT = path.resolve(__dirname, '..');
const IMAGE_HOSTS = new Set(['images.metmuseum.org', 'collectionapi.metmuseum.org', 'openaccess-cdn.clevelandart.org']);

async function fetchFile(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    let response;
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    } catch (error) {
      if (attempt === 2) throw error;
    }
    if (response?.ok) return response;
    // 馆方 WAF 对突发请求会回 403（稍后重试即恢复），与 429、5xx 一并退避重试
    if (response && ((response.status < 500 && response.status !== 429 && response.status !== 403) || attempt === 2)) {
      throw new Error(`${url}: HTTP ${response.status}`);
    }
    await delay((attempt + 1) * 1500);
  }
}

async function acquire(relic, originals) {
  const cleveland = relic.id.startsWith('cma-');
  const apiUrl = cleveland
    ? `https://openaccess-api.clevelandart.org/api/artworks/?accession_number=${encodeURIComponent(relic.accession)}&limit=1`
    : `https://collectionapi.metmuseum.org/public/collection/v1/objects/${encodeURIComponent(relic.id)}`;
  const response = await (await fetchFile(apiUrl)).json();
  const record = cleveland ? response.data?.[0] : response;
  const accession = cleveland ? record?.accession_number : record?.accessionNumber;
  const open = cleveland ? record?.share_license_status === 'CC0' : record?.isPublicDomain === true;
  const imageUrl = cleveland ? record?.images?.web?.url : record?.primaryImageSmall;
  if (accession !== relic.accession || !open || !imageUrl) {
    throw new Error(`${relic.id}: expected accession ${relic.accession} and an open image`);
  }
  const imageAddress = new URL(imageUrl);
  if (imageAddress.protocol !== 'https:' || !IMAGE_HOSTS.has(imageAddress.hostname)) {
    throw new Error(`${relic.id}: unexpected image URL ${imageUrl}`);
  }
  const image = await fetchFile(imageUrl);
  if (!image.headers.get('content-type')?.startsWith('image/')) {
    throw new Error(`${relic.id}: source did not return an image`);
  }
  await fs.writeFile(path.join(originals, `${relic.id}.jpg`), Buffer.from(await image.arrayBuffer()));
  await fs.writeFile(path.join(originals, `${relic.id}.json`), JSON.stringify(record, null, 2) + '\n');
  const { url: collectionUrl } = sourceFor(relic.id);
  return { id: relic.id, accession, collectionUrl, apiUrl, imageUrl, rights: cleveland ? 'CC0' : 'Public Domain' };
}

async function main() {
  const temp = path.join(ROOT, 'tmp');
  await fs.mkdir(temp, { recursive: true });
  const output = await fs.mkdtemp(path.join(temp, 'relic-import-'));
  const originals = path.join(output, 'originals');
  await fs.mkdir(originals);
  console.log(`Working directory: ${output}`);

  const sources = [];
  for (let offset = 0; offset < RELICS.length; offset += 3) {
    sources.push(...await Promise.all(RELICS.slice(offset, offset + 3).map(relic => acquire(relic, originals))));
  }
  const manifest = { sources, expectedRatios: Object.fromEntries(RELICS.map(item => [item.id, item.imageRatio])) };
  await fs.writeFile(path.join(output, 'sources.json'), JSON.stringify(manifest, null, 2) + '\n');
  execFileSync(process.env.RELIC_PYTHON || 'python', [path.join(__dirname, 'prepare_relic_images.py'), output], { stdio: 'inherit' });
  console.log(`Acquired ${sources.length} museum records. Review ${output} before applying any updates.`);
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
