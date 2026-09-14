import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {readFile,access} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {outputFiles}=await build({stdin:{contents:`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {LissajousInstrument} from './src/instruments/lissajous/instrument.tsx';module.exports=renderToStaticMarkup(React.createElement(LissajousInstrument));`,resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',logLevel:'silent'});
globalThis.localStorage={getItem:()=>null};
for(const lang of ['pt','en']){
  globalThis.location={search:'?lang='+lang};
  const module={exports:{}};
  new Function('require','module','exports',outputFiles[0].text)(require,module,module.exports);
  const html=module.exports;
  assert.ok(html.includes(lang==='pt'?'Volume dos sinais':'Signal volume'));
  assert.ok(html.includes(lang==='pt'?'OUVIR SINAL':'LISTEN'));
  assert.ok(html.includes('62%'),'Recovered master volume preserved');
  assert.equal((html.match(/class="piano-key/g)||[]).length,26,'Both chromatic keyboards preserved');
  assert.ok(!html.includes('NaN')&&!html.includes('undefined'));
}
await access('dist/studies/lissajous/index.html');
const page=await readFile('dist/studies/lissajous/index.html','utf8');
for(const match of page.matchAll(/(?:src|href)="([^"#]+)"/g)){
  if(match[1].startsWith('?')||match[1].startsWith('http'))continue;
  await access(new URL(match[1],new URL('../dist/studies/lissajous/index.html',import.meta.url)));
}
console.log('Lissajous passed: real component rendering in PT/EN, 26 keys, volume, audio controls and built route assets. Browser/audio playback not exercised.');
