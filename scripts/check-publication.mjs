import assert from 'node:assert/strict';
import {readFile,access,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..'),dist=resolve(root,'dist');
const html=await readFile(resolve(dist,'index.html'),'utf8');
assert.ok(html.includes('id="selected-projects"')&&html.includes('id="hero-art"'),'Equilibrium must be the root home');
assert.ok(!html.includes('noindex')&&!html.includes('editor-dialog')&&!html.includes('archive-link'));
assert.equal((await readFile(resolve(dist,'CNAME'),'utf8')).trim(),'stargaze.glitchme.art');
assert.ok(!(await readFile(resolve(dist,'robots.txt'),'utf8')).includes('Disallow: /\n'));
for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
  if(/^(https?:|data:|mailto:)/.test(match[1]))continue;
  await access(resolve(dist,match[1].split(/[?#]/)[0]));
}
for(const path of ['colony/index.html','wikiverso/index.html','string-tuner/index.html','experimento-01/index.html','celeste/index.html'])await access(resolve(dist,path));
for(const file of await readdir(resolve(dist,'assets'))){if(!file.endsWith('.js'))continue;const source=await readFile(resolve(dist,'assets',file),'utf8');assert.ok(!source.includes('/api/save')&&!source.includes('stargaze.field-notes.drafts'),'No editor or draft storage in the public bundle');}
for(const [page,base] of [['https://example.com/','./'],['https://example.com/design-studies/','../'],['https://example.com/stargaze/','./'],['https://example.com/stargaze/design-studies/','../']]){
  const expected=page.includes('/stargaze/')?'https://example.com/stargaze/':'https://example.com/';
  assert.equal(new URL('./celeste/',new URL(base,page)).href,expected+'celeste/');
  assert.equal(new URL('notes/ensaio/media/a.png',new URL(base,page)).href,expected+'notes/ensaio/media/a.png');
}
console.log('Publication checks passed: root home, indexability, domain, local assets, standalone studies, note paths and editor isolation.');
