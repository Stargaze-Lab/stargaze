import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createEditorServer} from '../tools/editor/server.mjs';
import {validateNote} from '../src/note-format.js';

const dataDir=await mkdtemp(join(tmpdir(),'stargaze-editor-check-'));
let server,origin;
async function start(){server=await createEditorServer({dataDir,port:0});origin=`http://127.0.0.1:${server.address().port}`;}
async function stop(){await new Promise(resolve=>server.close(resolve));}
const request=(path,data,headers={})=>fetch(origin+path,{method:data===undefined?'GET':'POST',headers:{'X-Stargaze-Editor':'1',...(data===undefined?{}:{Origin:origin}),...headers},body:data===undefined?undefined:Buffer.isBuffer(data)?data:JSON.stringify(data)});
function unzip(buffer){const entries=new Map();let at=0;while(buffer.readUInt32LE(at)===0x04034b50){const size=buffer.readUInt32LE(at+18),n=buffer.readUInt16LE(at+26),extra=buffer.readUInt16LE(at+28),path=buffer.toString('utf8',at+30,at+30+n),start=at+30+n+extra;entries.set(path,buffer.subarray(start,start+size));at=start+size;}assert.equal(buffer.readUInt32LE(at),0x02014b50);assert.equal(buffer.readUInt32LE(buffer.length-22),0x06054b50);return entries;}
try{
  await start();
  assert.equal((await fetch(origin+'/api/drafts')).status,403);
  assert.equal((await request('/api/save',{}, {Origin:'https://unrelated.example'})).status,403);
  assert.equal((await request('/api/drafts')).status,200);
  assert.equal((await fetch(origin+'/')).status,200);
  assert.equal((await fetch(origin+'/editor.js')).status,200);
  assert.equal((await request('/api/media',Buffer.from('<svg/>'))).status,400);
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a1E0AAAAASUVORK5CYII=','base64');
  const image=await(await request('/api/media',png)).json();image.alt='Meu desenho';image.caption='Crédito escrito por mim.';
  const mp4=Buffer.from([0,0,0,24,102,116,121,112,105,115,111,109,0,0,0,0,105,115,111,109,109,112,52,49]);
  const video=await(await request('/api/media',mp4)).json();video.alt='Descrição do vídeo';
  assert.equal(video.kind,'video');
  const range=await fetch(origin+`/media/${video.file}`,{headers:{Range:'bytes=4-7'}});assert.equal(range.status,206);assert.equal(await range.text(),'ftyp');
  const note={id:'1234567890abcdef12345678',schemaVersion:2,slug:'nota-de-teste',title:'Minha nota <script>',author:'Autoria manual',date:'2026-09-06',format:'ensaio',summary:'Resumo meu.',body:`Uma ideia **minha**.\n\n{{media:${image.id}}}\n\nDepois da imagem.\n\n{{media:${video.id}}}`,media:[image,video],images:[],status:'draft'};
  assert.deepEqual(validateNote(note),[]);
  assert.ok(validateNote({...note,media:[{...image,file:'../../secreto'}]}).length);
  assert.equal((await request('/api/save',note)).status,200);
  const preview=await(await request('/api/preview',note)).text();assert.ok(preview.includes('&lt;script&gt;'));assert.ok(preview.includes(' controls playsinline'));assert.ok(preview.indexOf(image.file)<preview.indexOf('Depois da imagem.'));
  const downloaded=await request('/api/export',{id:note.id});assert.equal(downloaded.status,200);
  const entries=unzip(Buffer.from(await downloaded.arrayBuffer()));
  assert.deepEqual(entries.get(`public/notes/${note.slug}/media/${image.file}`),png);
  assert.deepEqual(entries.get(`public/notes/${note.slug}/media/${video.file}`),mp4);
  const published=JSON.parse(entries.get(`content/notes/${note.slug}.json`).toString());assert.equal(published.status,'published');assert.equal(published.body,note.body);
  const page=entries.get(`public/notes/${note.slug}/index.html`).toString();assert.ok(page.includes(`./media/${image.file}`));assert.ok(!page.includes('/api/')&&!page.includes('PRÉVIA LOCAL'));
  const disk=JSON.parse(await readFile(join(dataDir,'drafts',note.id+'.json'),'utf8'));assert.equal(disk.status,'draft');assert.equal(disk.body,note.body);
  await stop();await start();const restored=await(await request('/api/drafts')).json();assert.equal(restored[0].body,note.body);
  const legacy={...note,schemaVersion:1,images:[{data:'data:image/png;base64,'+png.toString('base64'),alt:'imagem antiga',caption:''}],body:'Texto original'};delete legacy.media;
  const imported=await(await request('/api/import',legacy)).json();assert.equal(imported.body,'Texto original');assert.equal(imported.media.length,1);assert.notEqual(imported.id,note.id);
  console.log('Local editor checks passed: localhost isolation, save/reopen, legacy import, image/video packaging, ranges, safe preview and authored text. No browser or codec playback test performed.');
}finally{if(server?.listening)await stop();await rm(dataDir,{recursive:true,force:true});}
