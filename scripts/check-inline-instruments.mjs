// Exercise the real component handlers and animation effects without a browser.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';

let raf=new Map(),sequence=0,draws=0,lines=0,geometry=[];
globalThis.requestAnimationFrame=fn=>{raf.set(++sequence,fn);return sequence;};
globalThis.cancelAnimationFrame=id=>raf.delete(id);
const context=new Proxy({}, {get(target,key){if(key in target)return target[key];if(key==='createRadialGradient')return()=>({addColorStop(){}});return(...args)=>{args.forEach(n=>{if(typeof n==='number')assert.ok(Number.isFinite(n),String(key));});draws++;if(key==='lineTo')lines++;if(key==='lineTo'||key==='moveTo')geometry.push([key,...args]);};},set(t,k,v){t[k]=v;return true;}});
const canvas=()=>({width:0,height:0,getBoundingClientRect:()=>({width:640,height:640,left:0,top:0}),getContext:()=>context,setPointerCapture(){}});
let reducedMotion=false;globalThis.window={devicePixelRatio:1,matchMedia:()=>({matches:reducedMotion})};globalThis.devicePixelRatio=1;
let visibilityListener;globalThis.document={hidden:false,createElement:()=>canvas(),addEventListener(name,fn){visibilityListener=fn;},removeEventListener(){visibilityListener=null;}};
let observers=0;globalThis.ResizeObserver=class{constructor(fn){this.fn=fn;observers++;}observe(){this.fn();}disconnect(){observers--;}};
function frame(t){const pending=[...raf.values()];raf.clear();pending.forEach(fn=>fn(t));}
function harness(source,name,helpers=''){
 const slots=[],effects=[],cleanups=[];let cursor=0,queued=[],props={},tree;
 const same=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
 const hooks={useRef(v){const i=cursor++;return slots[i]??=( {current:v});},useState(v){const i=cursor++;if(!(i in slots))slots[i]=typeof v==='function'?v():v;return[slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];},useEffect(fn,deps){const i=cursor++;if(!same(effects[i],deps)){queued.push(()=>{cleanups[i]?.();cleanups[i]=fn();});effects[i]=deps;}},useCallback(fn){cursor++;return fn;},useId(){const i=cursor++;return`test-${i}`;}};
 const React={createElement(type,props,...children){return{type,props:{...props,children:children.flat(Infinity)}};}};
 return transform(source.replace(/^import .*;\n/gm,'').replace('export default function','function'),{loader:'tsx',jsx:'transform'}).then(({code})=>{
 const component=new Function('React','hooks',`const {useRef,useState,useEffect,useCallback,useId}=hooks;${helpers}\n${code}\nreturn ${name};`)(React,hooks);
 function walk(node,fn){if(!node||typeof node!=='object')return;fn(node);node.props?.children?.forEach(n=>walk(n,fn));}
 const api={render(next=props){props=next;cursor=0;tree=component(props);walk(tree,n=>{if(n.type==='canvas'&&n.props.ref&&!n.props.ref.current)n.props.ref.current=canvas();});const q=queued;queued=[];q.forEach(fn=>fn());return tree;},find(fn){let found;walk(tree,n=>{if(fn(n))found=n;});assert.ok(found,'Expected control');return found;},all(fn){const out=[];walk(tree,n=>{if(fn(n))out.push(n);});return out;},dispose(){cleanups.forEach(fn=>fn?.());}};return api;
 });
}
const source=await readFile('src/instruments/chromascope/instrument.tsx','utf8');
const engine=(await transform(await readFile('src/instruments/chromascope/optics.ts','utf8'),{loader:'ts',format:'esm'})).code.replace(/^export \{[\s\S]*?\};?\s*$/m,'');
const drawing=(await transform(await readFile('src/instruments/chromascope/drawing.ts','utf8'),{loader:'ts',format:'esm'})).code.replace(/^import .*;\n/gm,'').replace(/^export \{[\s\S]*?\};?\s*$/m,'');
const icons='const Trash2=()=>null,Undo2=()=>null,Pencil=()=>null,MousePointer2=()=>null,Minus=()=>null,Plus=()=>null,X=()=>null,RotateCcw=()=>null;';
const chroma=await harness(source,'Chromascope',engine+drawing+icons);chroma.render();frame(16);const originalGeometry=JSON.stringify(geometry);
assert.equal(raf.size,0,'Rendering settles without scheduling another frame');
const control=label=>chroma.find(n=>n.props?.label===label);
assert.equal(control('Visualizar').props.pressed,true);assert.equal(control('Compor').props.pressed,false);
const cvChroma=()=>chroma.find(n=>n.type==='canvas');
const pieces=()=>chroma.all(n=>n.type==='button'&&n.props?.className?.startsWith('piece-choice'));
// Explicit drift is reversible, pauses without snapping and is separate from rotation.
control('Movimento suave').props.onClick();chroma.render();frame(20);for(let t=36;t<1036;t+=16)frame(t);
assert.equal(control('Movimento suave').props.pressed,true);assert.equal(raf.size,1);
geometry=[];frame(1052);const driftGeometry=JSON.stringify(geometry);assert.notEqual(driftGeometry,originalGeometry);
control('Movimento suave').props.onClick();chroma.render();geometry=[];frame(1068);assert.ok(JSON.stringify(geometry)===driftGeometry,'Pause freezes the visible pose');assert.equal(raf.size,0);
control('Desfazer').props.onClick();chroma.render();geometry=[];frame(1084);assert.ok(JSON.stringify(geometry)===originalGeometry,'Undo restores the source shapes before drift');
control('Movimento suave').props.onClick();chroma.render();frame(1100);control('Compor').props.onClick();chroma.render();frame(1116);assert.equal(raf.size,0);assert.equal(control('Compor').props.pressed,true);assert.equal(control('Visualizar').props.pressed,false);
control('Visualizar').props.onClick();chroma.render();assert.equal(control('Movimento suave').props.pressed,false);
reducedMotion=true;control('Movimento suave').props.onClick();chroma.render();frame(1132);assert.equal(raf.size,0,'Reduced motion uses a single small displacement');assert.equal(control('Movimento suave').props.pressed,false);reducedMotion=false;
control('Desfazer').props.onClick();chroma.render();frame(1148);

let eventTime=0;const e=(x,y)=>({timeStamp:eventTime+=16,button:0,pointerId:1,clientX:320+x*310.4,clientY:320+y*310.4,currentTarget:canvas()});
cvChroma().props.onPointerDown(e(.5,0));cvChroma().props.onPointerMove(e(0,.5));frame(32);cvChroma().props.onPointerUp(e(0,.5));chroma.render();frame(48);
const movingDraws=draws;frame(64);assert.ok(draws>movingDraws,'Release continues the rotation');
for(let t=80;t<6000;t+=16)frame(t);assert.equal(raf.size,0,'Damped inertia eventually settles');
const settledDraws=draws;frame(6016);assert.equal(draws,settledDraws,'No permanent idle loop');
control('Desfazer').props.onClick();chroma.render();geometry=[];frame(6032);assert.ok(JSON.stringify(geometry)===originalGeometry,'One undo restores the whole gesture, including its coast');
function flick(){cvChroma().props.onPointerDown(e(.5,0));cvChroma().props.onPointerMove(e(0,.5));cvChroma().props.onPointerUp(e(0,.5));chroma.render();}
flick();frame(6048);assert.equal(raf.size,1);cvChroma().props.onPointerDown(e(.5,0));cvChroma().props.onPointerUp(e(.5,0));chroma.render();frame(6064);assert.equal(raf.size,0,'Touch stops the coast');
reducedMotion=true;flick();frame(6080);assert.equal(raf.size,0,'Respect reduced motion');reducedMotion=false;
flick();frame(6096);document.hidden=true;visibilityListener();frame(6112);assert.equal(raf.size,0,'Hidden document stops the coast');document.hidden=false;
flick();frame(6128);
control('Compor').props.onClick();chroma.render();frame(6144);assert.equal(raf.size,0,'Editing stops the coast');assert.equal(pieces().length,3,'Editable example supplies three real shapes');
control('Limpar peças').props.onClick();chroma.render();assert.equal(pieces().length,0);
control('Desfazer').props.onClick();chroma.render();assert.equal(pieces().length,3,'Clear is reversible');
control('Limpar peças').props.onClick();chroma.render();
const colorButton=()=>chroma.find(n=>n.type==='button'&&n.props?.className==='color-choice selected');
const firstColor=colorButton().props['aria-label'];
cvChroma().props.onPointerDown(e(.15,.10));for(const [x,y] of [[.4,.08],[.5,.2],[.44,.4],[.24,.42],[.15,.25]])cvChroma().props.onPointerMove(e(x,y));cvChroma().props.onPointerUp(e(.15,.25));chroma.render();frame(2016);
assert.equal(pieces().length,1);assert.notEqual(colorButton().props['aria-label'],firstColor,'New drawing advances the color');
pieces()[0].props.onClick();chroma.render();const beforeShape=pieces()[0].props.children[0].props.children[0].props.points;
cvChroma().props.onKeyDown({key:'ArrowRight',preventDefault(){},stopPropagation(){}});chroma.render();assert.notEqual(pieces()[0].props.children[0].props.children[0].props.points,beforeShape,'Keyboard moves the selected piece');
chroma.find(n=>n.props?.['aria-label']==='Cor 3').props.onClick();chroma.render();assert.equal(pieces()[0].props.children[0].props.children[0].props.fill,'#aacbc2');
control('Prisma').props.onClick();chroma.render();control('Tidal');control('Desfazer').props.onClick();chroma.render();control('Prisma');
control('Mais eixos').props.onClick();chroma.render();control('7 eixos');
pieces()[0].props.onClick();chroma.render();control('Apagar peça selecionada').props.onClick();chroma.render();assert.equal(pieces().length,0);
control('Desfazer').props.onClick();chroma.render();assert.equal(pieces().length,1);
// Pointer cancellation restores the plate and produces no new shape.
control('Traço: auto').props.onClick();chroma.render();cvChroma().props.onPointerDown(e(-.4,-.4));cvChroma().props.onPointerMove(e(-.2,-.2));cvChroma().props.onPointerCancel(e(-.2,-.2));chroma.render();assert.equal(pieces().length,1);
// Exercise the real PNG export handler and its asynchronous unmount boundary.
let download=null,pendingBlob=null,output=null;const objectUrls=new Set();
globalThis.URL={createObjectURL(){objectUrls.add('blob:test');return 'blob:test';},revokeObjectURL(url){objectUrls.delete(url);}};
globalThis.document={hidden:false,addEventListener(){},removeEventListener(){},body:{append(){}},createElement(tag){if(tag==='a')return {click(){download={href:this.href,name:this.download};},remove(){}};output={...canvas(),toBlob(fn,type){assert.equal(type,'image/png');pendingBlob=fn;}};return output;}};
control('Salvar imagem').props.onClick();chroma.render();control('Salvando');assert.equal(output.width,2048);assert.equal(output.height,2048);
pendingBlob({});chroma.render();assert.deepEqual(download,{href:'blob:test',name:'chromascope.png'});assert.equal(objectUrls.size,1);
control('Salvar imagem').props.onClick();chroma.render();download=null;
chroma.dispose();pendingBlob({});assert.equal(download,null,'Finishing an export after closing must not download');assert.equal(objectUrls.size,0);assert.equal(raf.size,0);assert.equal(observers,0);
const liss=await readFile('src/instruments/lissajous/instrument.tsx','utf8');
const scope=liss.slice(liss.indexOf('function LissajousScope('),liss.indexOf('export function LissajousInstrument'));
const test=await harness(scope,'LissajousScope','const tr=(p)=>p;const idealRatio=()=>({x:4,y:5});const frequency=v=>440*Math.pow(2,v/12);const drawGrid=()=>{};');
let p={monochrome:true,xValue:0,yValue:4,locked:true,persistence:58,speed:200,phase:0,setPhase:v=>{p={...p,phase:v};},powered:true,pulse:0};
test.render(p);for(let t=16;t<2000;t+=16)frame(t);const normal=lines;frame(2000);const incremental=lines-normal;
p={...p,phase:1};test.render(p);const before=lines;frame(2016);assert.ok(lines-before>incremental*10,'Changing phase reprojects existing trail, without restarting');
const cv=test.find(n=>n.type==='canvas');cv.props.onPointerDown({button:0,pointerId:1,clientX:50,clientY:50,currentTarget:canvas()});cv.props.onPointerMove({pointerId:1,clientX:150,clientY:70,currentTarget:canvas()});assert.ok(p.phase!==1);cv.props.onPointerUp();
test.dispose();assert.equal(raf.size,0);assert.equal(observers,0);assert.ok(draws>1000);
console.log('Inline checks passed: drawing, automatic colors, shape editing/recolor/delete, persistent modes, gentle drift/pause/undo, axes, undo, damped inertia, PNG export/unmount, cleanup, finite Canvas geometry and phase trail continuity. Browser/audio not exercised.');
