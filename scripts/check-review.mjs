import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {validateNote,renderMarkdown,noteMarkup} from '../src/note-format.js';
import {createFieldEngine,lissajousPoint,nextSceneIndex,spherePoint,pickNetworkNode,makeNetwork,stepNetwork} from '../src/visual-fields.js';
import {chooseLanguage} from '../src/site-language.js';

const note={schemaVersion:1,slug:'nota-de-teste',title:'Meu título',author:'Autoria manual',date:'2026-09-05',format:'ensaio',summary:'',body:'Uma pergunta minha.\n\n## Processo\n\n- observação\n- hipótese',status:'ready',images:[]};
assert.deepEqual(validateNote(note),[]);
assert.ok(validateNote({...note,date:'2026-02-30'}).length);
assert.ok(validateNote({...note,author:''}).length);
assert.ok(validateNote({...note,status:'live'}).length);
assert.ok(validateNote({...note,images:[{data:'data:image/svg+xml;base64,AAAA',alt:'a',caption:''}]}).length);
assert.ok(!renderMarkdown('<script>alert(1)</script>').includes('<script>'));
assert.ok(!renderMarkdown('[bad](javascript:alert) [bad](data:text/html,test)').includes('<a '));
assert.ok(renderMarkdown('[ok](https://example.com/?q=a&x=b)').includes('rel="noopener noreferrer"'));
assert.ok(renderMarkdown('**intenção** e *processo*').includes('<strong>intenção</strong>'));
assert.ok(noteMarkup(note).includes('Autoria manual'));
assert.equal(note.body,'Uma pergunta minha.\n\n## Processo\n\n- observação\n- hipótese');
for(let i=0;i<5;i++)for(const random of [()=>0,()=>.5,()=>.99999])assert.notEqual(nextSceneIndex(i,5,random),i);
const a=lissajousPoint(.4),b=lissajousPoint(.4+Math.PI*2);
assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1])<1e-10);
assert.ok(Math.abs(Math.hypot(...spherePoint(.7,1.2))-1)<1e-10);
assert.equal(chooseLanguage({country:'BR',browser:'en-US'}),'pt');
assert.equal(chooseLanguage({country:'US',browser:'pt-BR'}),'en');
assert.equal(chooseLanguage({saved:'en',country:'BR'}),'en');
assert.equal(chooseLanguage({browser:'pt-BR'}),'pt');
assert.equal(pickNetworkNode([[10,10,0],[100,100,0]],12,12),0);
assert.equal(pickNetworkNode([[10,10,0],[100,100,0]],60,60),-1);
const elastic=makeNetwork();elastic.nodes[0][0]+=.8;elastic.grab=0;elastic.dragging=true;
const held=elastic.nodes[0][0];for(let i=0;i<30;i++)stepNetwork(elastic,1/60);
assert.equal(elastic.nodes[0][0],held,'The dragged node stays under the pointer');
assert.ok(elastic.nodes.some((p,i)=>i>0&&Math.hypot(...p.map((v,k)=>v-elastic.rest[i][k]))>.001),'Links transmit the pull');
elastic.dragging=false;elastic.grab=-1;for(let i=0;i<360;i++)stepNetwork(elastic,1/60);
assert.ok(elastic.nodes.every((p,i)=>Math.hypot(...p.map((v,k)=>v-elastic.rest[i][k]))<.001),'Released nodes settle back into their clusters');

// Renderer smoke checks without a browser: finite drawing coordinates, resize,
// reduced motion, scene replacement and teardown at phone/desktop sizes.
let tasks=new Map(),counter=0,drawCalls=0,signature=0;
globalThis.requestAnimationFrame=fn=>{tasks.set(++counter,fn);return counter;};
globalThis.cancelAnimationFrame=id=>tasks.delete(id);
globalThis.matchMedia=()=>({matches:false});
globalThis.devicePixelRatio=2;
globalThis.ResizeObserver=class{constructor(fn){this.fn=fn;}observe(){this.fn();}disconnect(){}};
globalThis.IntersectionObserver=class{constructor(fn){this.fn=fn;}observe(target){this.fn([{target,isIntersecting:true,intersectionRatio:1}]);}unobserve(){}disconnect(){}};
const ctx=new Proxy({}, {get(target,key){
  if(key==='createRadialGradient')return()=>({addColorStop(){}});
  if(key in target)return target[key];
  return(...args)=>{for(const arg of args)if(typeof arg==='number'){assert.ok(Number.isFinite(arg),`${String(key)} received a non-finite argument`);signature+=Math.sin(arg);}drawCalls++;};
},set(target,key,value){target[key]=value;return true;}});
globalThis.document={hidden:false,addEventListener(){},removeEventListener(){},createElement(){return{setAttribute(){},getContext(){return ctx;},remove(){},style:{}};}};
const scenes=['flock','network','globe','dome','threads','lissajous','kaleidoscope','music'];
function frame(t){const callbacks=[...tasks.values()];tasks.clear();for(const callback of callbacks)callback(t);}
for(const width of [320,390,1440]){
  const engine=createFieldEngine();
  const container={append(){},getBoundingClientRect(){return{width,height:width<700?390:680};},addEventListener(){},removeEventListener(){}};
  const mounts=scenes.map(scene=>engine.mount(container,scene,{hero:true}));
  for(let t=100;t<400;t+=40)frame(t);
  engine.setTone('#94bde5');engine.pause(true);frame(500);
  mounts[0].setScene('lissajous');frame(600);
  engine.pause(false);frame(700);
  mounts.forEach(m=>m.destroy());engine.destroy();assert.equal(tasks.size,0);
}
assert.ok(drawCalls>1000);
for(const scene of ['network','dome','lissajous','kaleidoscope']){
  const listeners=new Map(),engine=createFieldEngine();engine.pause(true);
  const container={append(){},getBoundingClientRect(){return{left:0,top:0,width:960,height:680};},addEventListener(type,fn){listeners.set(type,fn);},removeEventListener(type){listeners.delete(type);}};
  const mount=engine.mount(container,scene,{hero:true});signature=0;frame(800);const before=signature;
  listeners.get('pointerdown')({clientX:700,clientY:270,pointerType:'touch',target:{closest(){return null;}}});signature=0;frame(840);assert.notEqual(signature,before,`${scene} must change its geometry after touch`);
  listeners.get('pointercancel')();frame(880);mount.destroy();engine.destroy();assert.equal(listeners.size,0);
}

const root=resolve(import.meta.dirname,'..');
const html=await readFile(resolve(root,'design-studies/index.html'),'utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'Duplicate HTML ids');
for(const file of ['equilibrium.js','note-reader.js']){
  const source=await readFile(resolve(root,'src',file),'utf8');
  for(const match of source.matchAll(/querySelector\(['"]#([\w-]+)['"]\)/g))assert.ok(ids.includes(match[1]),`Missing target ${match[1]}`);
}
assert.ok(!html.includes('editor-dialog')&&!html.includes('open-editor'),'No authoring UI in the public page');
const generated=await readFile(resolve(root,'src/notes.generated.js'),'utf8');
assert.ok(generated.includes('export const notes = []'),'No invented essays should be published');
console.log(`Review checks passed: note safety, authored text, 4:5 curve, non-repeating entry, ${scenes.length} renderers at 3 viewport sizes, target IDs and cleanup (${drawCalls} drawing calls).`);
