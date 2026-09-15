// Exercise the real component handlers and animation effects without a browser.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';

let raf=new Map(),sequence=0,draws=0,lines=0;
globalThis.requestAnimationFrame=fn=>{raf.set(++sequence,fn);return sequence;};
globalThis.cancelAnimationFrame=id=>raf.delete(id);
const context=new Proxy({}, {get(target,key){if(key in target)return target[key];if(key==='createRadialGradient')return()=>({addColorStop(){}});return(...args)=>{args.forEach(n=>{if(typeof n==='number')assert.ok(Number.isFinite(n),String(key));});draws++;if(key==='lineTo')lines++;};},set(t,k,v){t[k]=v;return true;}});
const canvas=()=>({width:0,height:0,getBoundingClientRect:()=>({width:640,height:640,left:0,top:0}),getContext:()=>context,setPointerCapture(){}});
globalThis.window={devicePixelRatio:1};globalThis.devicePixelRatio=1;
globalThis.document={hidden:false,createElement:()=>canvas()};
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
const chroma=await harness(source,'Chromascope');chroma.render();
const draw=()=>chroma.find(n=>typeof n.type==='function'&&n.type.name==='DrawPad');
const control=label=>chroma.find(n=>n.props?.label===label);
const pieces=()=>chroma.all(n=>n.type==='g'&&n.props?.className?.startsWith('piece-choice'));
const triangle=[{x:10,y:10},{x:100,y:10},{x:90,y:60},{x:60,y:100},{x:20,y:80},{x:10,y:40}];
const firstColor=draw().props.color;draw().props.onComplete(triangle);chroma.render();assert.equal(pieces().length,1);assert.notEqual(draw().props.color,firstColor,'Next shape changes color');
draw().props.onComplete(triangle);chroma.render();assert.equal(pieces().length,2);
pieces()[0].props.onClick();chroma.render();assert.equal(draw().props.shape.color,firstColor);const id=draw().props.shape.id;
draw().props.onEdit([{x:-.2,y:-.4},{x:.2,y:-.4},{x:0,y:.4}]);chroma.render();assert.equal(draw().props.shape.points.length,3);assert.equal(draw().props.shape.id,id);
chroma.find(n=>n.props?.['aria-label']==='Cor 3').props.onClick();chroma.render();assert.notEqual(draw().props.shape.color,firstColor);
control('Apagar').props.onClick();chroma.render();assert.equal(pieces().length,1);
control('Explorar').props.onClick();chroma.render();assert.equal(chroma.find(n=>n.type==='section').props['data-mode'],'view');
for(let t=16;t<2000;t+=16)frame(t);
control('6 eixos +').props.onClick();chroma.render();control('7 eixos +');
control('Cópias 5').props.onClick();chroma.render();control('Cópias 6');
control('Misturar').props.onClick();control('Girar ↷').props.onClick();frame(2016);
control('Limpar').props.onClick();chroma.render();assert.equal(pieces().length,0);assert.equal(chroma.find(n=>n.type==='section').props['data-mode'],'edit');
chroma.dispose();assert.equal(raf.size,0);
const liss=await readFile('src/instruments/lissajous/instrument.tsx','utf8');
const scope=liss.slice(liss.indexOf('function LissajousScope('),liss.indexOf('export function LissajousInstrument'));
const test=await harness(scope,'LissajousScope','const tr=(p)=>p;const idealRatio=()=>({x:4,y:5});const frequency=v=>440*Math.pow(2,v/12);const drawGrid=()=>{};');
let p={monochrome:true,xValue:0,yValue:4,locked:true,persistence:58,speed:200,phase:0,setPhase:v=>{p={...p,phase:v};},powered:true,pulse:0};
test.render(p);for(let t=16;t<2000;t+=16)frame(t);const normal=lines;frame(2000);const incremental=lines-normal;
p={...p,phase:1};test.render(p);const before=lines;frame(2016);assert.ok(lines-before>incremental*10,'Changing phase reprojects existing trail, without restarting');
const cv=test.find(n=>n.type==='canvas');cv.props.onPointerDown({button:0,pointerId:1,clientX:50,clientY:50,currentTarget:canvas()});cv.props.onPointerMove({pointerId:1,clientX:150,clientY:70,currentTarget:canvas()});assert.ok(p.phase!==1);cv.props.onPointerUp();
test.dispose();assert.equal(raf.size,0);assert.equal(observers,0);assert.ok(draws>1000);
console.log('Inline checks passed: drawing, automatic colors, shape editing/recolor/delete, separate modes, axes, density, shake, cleanup, finite Canvas geometry and phase trail continuity. Browser/audio not exercised.');
