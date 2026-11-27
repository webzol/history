// Generate the public relic manifest, query pages and details from the remote catalog.
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ERAS, TYPES, RELICS, sourceFor } = require('../miniprogram/relics/catalog.js');
const { PAGE_SIZE, ID_PATTERN } = require('../miniprogram/relics/remote.js');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'miniprogram', 'data', 'relics');
const OUTPUT = path.join(DATA, 'v1');
const check = process.argv.includes('--check');
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const items = readJson(path.join(DATA, 'catalog.json'));
const sources = readJson(path.join(ROOT, 'docs', 'relic-remote-sources.json'));

function write(file, value) {
  const destination = path.join(OUTPUT, file);
  const content = JSON.stringify(value) + '\n';
  if (check) {
    assert.equal(fs.readFileSync(destination, 'utf8').replace(/\r\n/g, '\n'), content, file);
    return;
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, content, 'utf8');
}

const localIds = new Set(RELICS.map(item => item.id));
const ids = new Set();
const grouped = new Map();
assert.equal(items.length, sources.length);
for (const [index, item] of items.entries()) {
  const { id, title, type, period, eras } = item;
  assert.ok(typeof id === 'string' && ID_PATTERN.test(id) && !ids.has(id) && !localIds.has(id), id);
  assert.ok(TYPES.includes(type) && Array.isArray(eras) && eras.length
    && new Set(eras).size === eras.length && eras.every(era => ERAS.includes(era)), `${id}: invalid filters`);
  assert.ok(title && period && item.date && item.material && item.dimensions && item.description
    && Number.isFinite(item.imageRatio) && item.imageRatio > 0, `${id}: incomplete metadata`);
  const source = sources[index];
  assert.equal(source.id, id);
  assert.equal(source.accession, item.accession);
  assert.equal(source.collectionUrl, sourceFor(id).url);
  assert.equal(source.rights, id.startsWith('cma-') ? 'CC0' : 'Public Domain');
  for (const size of ['thumb', 'detail']) assert.ok(fs.existsSync(path.join(OUTPUT, 'images', `${size}-${id}.jpg`)), `${id}: missing ${size}`);
  ids.add(id);
  write(`detail/${id}.json`, item);

  const row = { id, title, type, period: item.shortPeriod || period };
  for (const selectedType of ['', type]) for (const era of ['', ...eras]) {
    const filter = `${selectedType}|${era}`;
    if (!grouped.has(filter)) {
      const key = `${TYPES.indexOf(selectedType) + 1}-${ERAS.indexOf(era) + 1}`;
      grouped.set(filter, { key, rows: [] });
    }
    grouped.get(filter).rows.push(row);
  }
}

const groups = {};
for (const [filter, { key, rows }] of grouped) {
  groups[filter] = { key, count: rows.length };
  for (let offset = 0; offset < rows.length; offset += PAGE_SIZE) {
    write(`list/${key}/${offset / PAGE_SIZE}.json`, { rows: rows.slice(offset, offset + PAGE_SIZE) });
  }
}
write('manifest.json', { version: 1, pageSize: PAGE_SIZE, groups });
console.log(`${check ? 'Verified' : 'Built'} ${ids.size} remote relics and ${grouped.size} filter groups.`);
