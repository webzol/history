// 列出可供挑选的候选文物：按两家馆方的开放接口取「中国 + 开放授权 + 有配图 + 清代及以前」的藏品，
// 原始记录缓存在 tmp/relic-discovery/，供人工挑选后再写进 miniprogram/relics/catalog.js。
// 只读馆方接口，不改仓库内任何文件。用法：node tools/discover_relics.js [--only met|cma]
'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');

const ROOT = path.resolve(__dirname, '..');
const CACHE = path.join(ROOT, 'tmp', 'relic-discovery');
const MET_SEARCH = 'https://collectionapi.metmuseum.org/public/collection/v1.1/search';
const MET_OBJECT = 'https://collectionapi.metmuseum.org/public/collection/v1/objects';
const CMA_ARTWORKS = 'https://openaccess-api.clevelandart.org/api/artworks';
const END_YEAR = 1911; // 目录止于清代
const PAGE = 500;

// 大都会检索分组：晚明以前的陶瓷与绘画全量取；清瓷、明清绘画量大（各近两千件），只取相关度靠前的一页，
// 再按名家补查。页面上限 500 条/页（接口上限），offset + limit 不超过 10000。
const MET_ARTISTS = [
  'Wang Hui', 'Dong Qichang', 'Tang Yin', 'Wen Zhengming', 'Shen Zhou', 'Qiu Ying', 'Zhu Da', 'Shitao',
  'Yun Shouping', 'Zheng Xie', 'Jin Nong', 'Wu Li', 'Wang Shimin', 'Wang Jian', 'Wang Yuanqi',
  'Zhao Mengfu', 'Ni Zan', 'Wang Meng', 'Wu Zhen', 'Huang Gongwang', 'Qian Xuan', 'Gao Kegong',
  'Li Gonglin', 'Mi Fu', 'Huang Tingjian', 'Su Shi', 'Mi Youren', 'Ma Yuan', 'Xia Gui', 'Liang Kai',
  'Chen Rong', 'Guo Xi', 'Juran', 'Dong Yuan', 'Han Gan', 'Zhou Fang', 'Zhang Xuan', 'Xu Wei', 'Chen Chun'
];
const MET_QUERIES = [
  { label: 'bronze', medium: 'Bronze' },
  { label: 'jade', medium: 'Jade' },
  { label: 'ceramics to 959', medium: 'Ceramics', dateEnd: 959 },
  { label: 'ceramics 960–1644', medium: 'Ceramics', dateBegin: 960, dateEnd: 1644 },
  { label: 'ceramics 1645–1911 (first page)', medium: 'Ceramics', dateBegin: 1645, dateEnd: 1911, pages: 1 },
  { label: 'paintings to 1367', medium: 'Paintings', dateEnd: 1367 },
  { label: 'calligraphy', medium: 'Calligraphy' },
  { label: 'paintings 1368–1911 (first page)', medium: 'Paintings', dateBegin: 1368, dateEnd: 1911, pages: 1 },
  ...MET_ARTISTS.map((artist) => ({ label: `artist ${artist}`, q: artist, culture: false }))
];

async function getJson(url) {
  for (let attempt = 0; attempt < 5; attempt++) {
    let response;
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    } catch (error) {
      if (attempt === 4) throw error;
    }
    if (response?.ok) return response.json();
    // 馆方 WAF 对突发请求会回 403/429（稍后重试即恢复），与 5xx、超时同样退避重试
    if (response && response.status < 500 && response.status !== 429 && response.status !== 403) {
      throw new Error(`${url}: HTTP ${response.status}`);
    }
    await delay((attempt + 1) * 2000);
  }
  throw new Error(`${url}: retries exhausted`);
}

async function pool(items, size, worker) {
  let next = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (next < items.length) await worker(items[next++]);
  }));
}

async function readCache(file) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return null;
  }
}

function compactMet(record) {
  const { objectID } = record;
  return {
    museum: 'met',
    id: String(objectID),
    accession: record.accessionNumber,
    title: record.title,
    objectName: record.objectName,
    classification: record.classification,
    culture: record.culture,
    period: record.period,
    dynasty: record.dynasty,
    reign: record.reign,
    date: record.objectDate,
    begin: record.objectBeginDate,
    end: record.objectEndDate,
    medium: record.medium,
    dimensions: record.dimensions,
    artist: [record.artistPrefix, record.artistDisplayName].filter(Boolean).join(' '),
    artistBio: record.artistDisplayBio,
    highlight: record.isHighlight === true,
    timeline: record.isTimelineWork === true,
    image: record.primaryImageSmall,
    tags: (record.tags || []).map((tag) => tag.term)
  };
}

// 大都会：按材质分组检索全部对象编号，再逐条取记录（记录落盘缓存，重跑只补缺的）。
async function discoverMet() {
  const objects = path.join(CACHE, 'met-objects');
  await fs.mkdir(objects, { recursive: true });
  const ids = new Set();
  for (const { label, pages, culture = true, ...filters } of MET_QUERIES) {
    const params = { departmentId: '6', hasImages: 'true' };
    if (culture) Object.assign(params, { 'artistOrCulture': 'true', 'q': 'China' });
    Object.assign(params, filters);
    let offset = 0;
    let total = Infinity;
    while (offset < total && offset < PAGE * (pages || Infinity)) {
      const query = new URLSearchParams({ ...params, 'offset': String(offset), 'limit': String(PAGE) });
      const page = await getJson(`${MET_SEARCH}?${query}`);
      total = page.total;
      (page.objectIDs || []).forEach((id) => ids.add(id));
      offset += PAGE;
    }
    console.log(`Met ${label}: ${total} hits`);
  }
  const wanted = [...ids];
  const missing = [];
  for (const id of wanted) {
    if (!(await readCache(path.join(objects, `${id}.json`)))) missing.push(id);
  }
  console.log(`Met: ${wanted.length} unique objects, ${missing.length} to fetch`);
  let done = 0;
  const failed = [];
  await pool(missing, 5, async (id) => {
    try {
      const record = await getJson(`${MET_OBJECT}/${id}`);
      await fs.writeFile(path.join(objects, `${id}.json`), JSON.stringify(record));
    } catch (error) {
      failed.push(id);
      console.log(`  skip ${id}: ${error.message}`);
    }
    if (++done % 250 === 0) console.log(`  fetched ${done}/${missing.length}`);
  });
  if (failed.length) console.log(`Met: ${failed.length} objects skipped after retries`);

  const rows = [];
  for (const id of wanted) {
    const record = await readCache(path.join(objects, `${id}.json`));
    if (!record || record.isPublicDomain !== true || !record.primaryImageSmall) continue;
    if (record.culture !== 'China' || (record.objectEndDate && record.objectEndDate > END_YEAR)) continue;
    rows.push(compactMet(record));
  }
  rows.sort((a, b) => (a.begin || 0) - (b.begin || 0) || Number(a.id) - Number(b.id));
  await fs.writeFile(path.join(CACHE, 'met.json'), JSON.stringify(rows, null, 1));
  return rows;
}

function compactCma(record) {
  return {
    museum: 'cma',
    id: `cma-${record.accession_number}`,
    accession: record.accession_number,
    title: record.title,
    type: record.type,
    collection: record.collection,
    culture: record.culture,
    date: record.creation_date,
    begin: record.creation_date_earliest,
    end: record.creation_date_latest,
    technique: record.technique,
    materials: record.support_materials,
    dimensions: record.measurements,
    artist: record.creators?.map((creator) => [creator.qualifier, creator.description].filter(Boolean).join(' ')).filter(Boolean).join('; '),
    highlight: record.is_highlight === true,
    image: record.images?.web?.url,
    imageWidth: Number(record.images?.web?.width),
    imageHeight: Number(record.images?.web?.height),
    description: record.description || '',
    note: record.did_you_know || ''
  };
}

// 克利夫兰：Chinese Art 部门的 CC0 藏品，列表接口直接返回完整记录。
async function discoverCma() {
  const rows = [];
  let skip = 0;
  let total = Infinity;
  while (skip < total) {
    const query = new URLSearchParams({
      'department': 'Chinese Art', 'cc0': '1', 'has_image': '1',
      'limit': '100', 'skip': String(skip)
    });
    const page = await getJson(`${CMA_ARTWORKS}?${query}`);
    total = page.info.total;
    for (const record of page.data) {
      if (record.share_license_status !== 'CC0' || !record.images?.web?.url) continue;
      if (!(record.culture || []).some((culture) => culture.startsWith('China'))) continue;
      if (record.creation_date_latest > END_YEAR) continue;
      rows.push(compactCma(record));
    }
    skip += 100;
    await delay(200);
  }
  rows.sort((a, b) => (a.begin || 0) - (b.begin || 0) || a.id.localeCompare(b.id));
  await fs.writeFile(path.join(CACHE, 'cma.json'), JSON.stringify(rows, null, 1));
  console.log(`Cleveland: ${total} CC0 records, ${rows.length} Chinese candidates dated through ${END_YEAR}`);
  return rows;
}

function summarize(rows) {
  const count = (key) => rows.reduce((map, row) => ((map[row[key]] = (map[row[key]] || 0) + 1), map), {});
  const top = (map, n = 14) => Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, n)
    .map(([name, value]) => `${name} ${value}`).join(' · ');
  const buckets = rows.reduce((map, row) => {
    const year = row.end || row.begin || 0;
    const key = year < -221 ? '先秦以前' : year < 220 ? '秦汉' : year < 589 ? '魏晋南北朝' : year < 907 ? '隋唐五代'
      : year < 1279 ? '宋' : year < 1368 ? '元' : year < 1644 ? '明' : '清';
    map[key] = (map[key] || 0) + 1;
    return map;
  }, {});
  console.log(`  highlights: ${rows.filter((row) => row.highlight).length}`);
  console.log(`  by period: ${JSON.stringify(buckets)}`);
  console.log(`  by classification: ${top(count(rows[0].classification !== undefined ? 'classification' : 'type'))}`);
}

async function main() {
  const only = (process.argv.find((arg) => arg.startsWith('--only=')) || '').split('=')[1];
  await fs.mkdir(CACHE, { recursive: true });
  if (!only || only === 'met') {
    const met = await discoverMet();
    console.log(`Met: ${met.length} candidates`);
    summarize(met);
  }
  if (!only || only === 'cma') {
    const cma = await discoverCma();
    summarize(cma);
  }
  console.log(`Candidates written to ${CACHE}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
