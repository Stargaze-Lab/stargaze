import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolveHomeGroups } from '../src/project-catalog.js';

const root = new URL('../', import.meta.url);
const read = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const home = await read('content/home.json');
const records = [];
for (const folder of ['projects','sketches']) {
  for (const file of await readdir(new URL(`content/${folder}/`, root))) {
    if (file.endsWith('.json')) records.push(await read(`content/${folder}/${file}`));
  }
}
const expected = records.find(record => record.slug === 'swiss-made');
for (const slug of ['swiss-made','switzerland-2050']) {
  const staleHome = structuredClone(home);
  Object.assign(staleHome.selection[0], {slug, title:'', href:'', summary:'Texto antigo', category:'Data Visualization · 2026'});
  const groups = resolveHomeGroups(staleHome, records), card = groups.selection[0];
  assert.equal(card.title, 'The Label Is Not the Origin');
  assert.equal(card.href, './studies/swiss-made/');
  assert.equal(card.slug, 'swiss-made');
  assert.equal(card.summary, expected.portfolioCopy.pt[0]);
  assert.equal(card.category, expected.eyebrow);
}
assert.throws(() => resolveHomeGroups(home, records.filter(record=>record!==expected)), /cadastro ausente/);
assert.throws(() => resolveHomeGroups(home, records.map(record=>record===expected?{...record,href:''}:record)), /link do estudo ausente/);
assert.throws(() => resolveHomeGroups(home, records.map(record=>record===expected?{...record,title:''}:record)), /título ou resumo ausente/);
console.log('Catalog regression passed: old/new slug, stale home copy, missing record/title/link.');
