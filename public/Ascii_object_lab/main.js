import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { TeapotGeometry } from 'three/addons/geometries/TeapotGeometry.js';

// ASCII / OBJECT LAB — all input models stay in the browser.
// The algorithm is a transparent, editable CPU reference implementation:
// Three.js lit render → sample coverage/luminance → Bayer dither → glyphs.
// A GPU shader/atlas is a possible future optimization for larger scenes.

const W = 1000, H = 760;
const SAMPLE_W = 640, SAMPLE_H = 486;
const REFERENCE = Object.freeze({
  bgColor: '#070619', shadowColor: '#8381be',
  midColor: '#b3b0fd', highColor: '#f4f2ff'
});
const RAMPS = Object.freeze({
  ship: ' .,:;i1rXSGMH',
  classic: ' .:-=+*#%@',
  dense: ' .`\'":;!i1tlI?+xX0O#MW@',
  dots: ' ·∙•●◉⬤',
  orbitals: ' ·°∘○◌◍◎◉●',
  braille: ' ⠁⠃⠇⠏⠟⠿⣯⣿',
  blocks: ' ░▒▓█',
  stars: ' ·✧✦✳✸✹✺',
  symbols: ' ·∴∷⋮⌇≋╳╬▩■',
  binary: ' .:X#'
});
const BAYER4 = [
  [0,8,2,10],
  [12,4,14,6],
  [3,11,1,9],
  [15,7,13,5]
];
const DEFAULT = Object.freeze({
  cellSize:14, dither:36, contrast:1.4, exposure:0.02, gamma:1,
  invert:false, keyLight:2.1, ambient:0.35, lightX:-3, lightY:5,
  autoRotate:true, speed:.5, rebuildEnabled:true, rebuildTime:2.5, guides:true, charsetPreset:'ship',
  charsetInput:RAMPS.ship, model:'knot', ...REFERENCE
});
const K = Object.keys(DEFAULT);
const state = { ...DEFAULT };
let modelName = 'ORBITAL KNOT';
let currentObj = null;
let currentPreset = 'knot';
let lastGlyphs = [];
let lastRows = [];
let currentGrid = {cols:0,rows:0};
let isRendering = false;
let pendingRender = true;
let rebuildActive = false;
let rebuildProgress = 1;
let toastTimer;
const $ = id => document.getElementById(id);
const output = $('asciiCanvas');
const ctx = output.getContext('2d', {alpha:false});
const sampleCanvas = document.createElement('canvas');
sampleCanvas.width = SAMPLE_W;
sampleCanvas.height = SAMPLE_H;
const sampleCtx = sampleCanvas.getContext('2d', {willReadFrequently:true});
const interactionLayer = $('interactionLayer');

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, powerPreference:'low-power' });
renderer.setPixelRatio(1);
renderer.setSize(SAMPLE_W, SAMPLE_H, false);
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.domElement.style.display = 'none';
const camera = new THREE.PerspectiveCamera(36, W/H, .1, 100);
camera.position.set(3.2,2.05,6.1);
const controls = new OrbitControls(camera, interactionLayer);
controls.enableDamping = true;
controls.dampingFactor = .075;
controls.enablePan = false;
controls.minDistance = 3.1;
controls.maxDistance = 13;
controls.target.set(0,0,0);
controls.addEventListener('change', () => { pendingRender = true; });
const modelRoot = new THREE.Group();
scene.add(modelRoot);
const ambientLight = new THREE.AmbientLight(0xffffff, state.ambient);
const keyLight = new THREE.DirectionalLight(0xffffff, state.keyLight);
scene.add(ambientLight,keyLight);
const fillLight = new THREE.DirectionalLight(0x9e98ff, .32);
fillLight.position.set(3,-3,-5);
scene.add(fillLight);

const starfield = buildStars(96);
function buildStars(count){
  // Stable pseudo-random coordinates, shared by Canvas and SVG export.
  let seed = 61213;
  const rnd = () => ((seed = (seed*1664525 + 1013904223) >>> 0) / 4294967296);
  return Array.from({length:count}, () => ({
    x:rnd()*W, y:rnd()*H,
    type:rnd()>.85?'cross':'dot', size:.6+rnd()*.6,
    opacity:.16+rnd()*.37
  }));
}
function clamp(n,a=0,b=1){return Math.max(a,Math.min(b,n));}
function hexToRgb(hex){const n=parseInt(hex.replace('#',''),16);return [(n>>16)&255,(n>>8)&255,n&255];}
function toHex(n){return Math.round(clamp(n,0,255)).toString(16).padStart(2,'0');}
function blendHex(a,b,t){const A=hexToRgb(a),B=hexToRgb(b);return `#${A.map((x,i)=>toHex(x+(B[i]-x)*t)).join('')}`;}
function glyphColor(t){
  return t<.56 ? blendHex(state.shadowColor,state.midColor,clamp(t/.56))
     : blendHex(state.midColor,state.highColor,clamp((t-.56)/.44));
}
function escapeXml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');}
function titleForModel(key){return {knot:'ORBITAL KNOT',orb:'RINGED ORB',station:'GRAVITY-RING SPACECRAFT',teapot:'UTAH TEAPOT'}[key]||key.toUpperCase();}
function toast(msg){
  const n=$('toast'); n.textContent=msg; n.classList.add('visible');
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>n.classList.remove('visible'),4600);
}

function cylinderBetween(a, b, radius, material = undefined) {
  const direction = new THREE.Vector3().subVectors(b,a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 10), material);
  mesh.position.copy(a).add(b).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());
  return mesh;
}
function makeSpacecraft(){
  // A procedural artificial-gravity spaceship: inhabited rotating torus,
  // spokes, rigid central keel, docking nose and aft propulsion units.
  const craft=new THREE.Group();
  const torus=(radius,tube,z=0)=>{
    const mesh=new THREE.Mesh(new THREE.TorusGeometry(radius,tube,12,108));
    mesh.position.z=z;
    craft.add(mesh);
    return mesh;
  };
  torus(1.42,.145,-.12); // broad habitat ring
  torus(1.42,.055,.13);  // structural outer rim
  torus(1.14,.027,.02);  // inner running track
  for(let i=0;i<10;i++){
    const a=2*Math.PI*i/10;
    const from=new THREE.Vector3(Math.cos(a)*.31,Math.sin(a)*.31,.02);
    const to=new THREE.Vector3(Math.cos(a)*1.43,Math.sin(a)*1.43,.02);
    craft.add(cylinderBetween(from,to,.038));
    // Distributed living modules on the gravity wheel.
    const cabin=new THREE.Mesh(new THREE.BoxGeometry(.46,.23,.36));
    cabin.position.set(1.44*Math.cos(a),1.44*Math.sin(a),-.08);
    cabin.rotation.z=a+Math.PI/2;
    craft.add(cabin);
  }
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.72,24));
  hub.rotation.x=Math.PI/2; craft.add(hub);
  torus(.37,.045,.37);
  const spine=new THREE.Mesh(new THREE.CylinderGeometry(.18,.29,3.45,16));
  spine.rotation.x=Math.PI/2; spine.position.z=-.24; craft.add(spine);
  const nose=new THREE.Mesh(new THREE.ConeGeometry(.29,.74,16));
  nose.rotation.x=Math.PI/2; nose.position.z=1.66; craft.add(nose);
  // Engines, four trusses, and dual solar/radiator wings.
  for(let i=0;i<4;i++){
    const a=2*Math.PI*i/4+Math.PI/4;
    const x=.41*Math.cos(a),y=.41*Math.sin(a);
    const engine=new THREE.Mesh(new THREE.CylinderGeometry(.15,.2,.65,12));
    engine.rotation.x=Math.PI/2;
    engine.position.set(x,y,-1.87);
    craft.add(engine);
    const exhaust=new THREE.Mesh(new THREE.TorusGeometry(.18,.035,9,22));
    exhaust.position.set(x,y,-2.19);craft.add(exhaust);
    craft.add(cylinderBetween(new THREE.Vector3(x,y,-1.45),new THREE.Vector3(.1*Math.cos(a),.1*Math.sin(a),-.8),.045));
  }
  for(const sign of [-1,1]){
    craft.add(cylinderBetween(new THREE.Vector3(sign*.3,0,-.95),new THREE.Vector3(sign*1.83,0,-1.18),.065));
    const wing=new THREE.Mesh(new THREE.BoxGeometry(1.02,.62,.055));
    wing.position.set(sign*2.25,0,-1.18);craft.add(wing);
    // panel segmentation gives the wing light-catching relief in ASCII.
    for(let n=-1;n<=1;n++){
      const rib=new THREE.Mesh(new THREE.BoxGeometry(.027,.64,.07));
      rib.position.set(sign*2.25+n*.25,0,-1.18);craft.add(rib);
    }
  }
  craft.rotation.set(-.18,-.28,.22);
  return craft;
}
function makePreset(key){
  let obj;
  switch(key){
    case 'orb':{
      obj=new THREE.Group();
      const sphere=new THREE.Mesh(new THREE.SphereGeometry(.94,40,24));
      sphere.scale.set(1,.98,1); obj.add(sphere);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(1.55,.095,14,140));
      ring.rotation.x=1.03;ring.rotation.y=.42; obj.add(ring);
      const ring2=new THREE.Mesh(new THREE.TorusGeometry(1.81,.015,8,120));
      ring2.rotation.copy(ring.rotation); obj.add(ring2);
      break;
    }
    case 'teapot':{
      obj=new THREE.Mesh(new TeapotGeometry(1.42,11,true,true,true,true,true));
      obj.rotation.set(-.12,.32,.06);
      break;
    }
    case 'station': obj=makeSpacecraft(); break;
    case 'knot':
    default: obj=new THREE.Mesh(new THREE.TorusKnotGeometry(1.08,.34,190,22,2,3));
  }
  return obj;
}
function normalizeModel(obj){
  obj.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(obj);
  if (box.isEmpty()) throw new Error('The model has no visible geometry.');
  const size=box.getSize(new THREE.Vector3());
  const maxDim=Math.max(size.x,size.y,size.z);
  if(!Number.isFinite(maxDim)||maxDim<1e-8) throw new Error('Unable to measure the model bounds.');
  // Preserve the original object's transforms by centering/scaling a parent.
  const center=box.getCenter(new THREE.Vector3());
  const parent=new THREE.Group();
  parent.add(obj);
  obj.position.sub(center);
  parent.scale.setScalar(3.0/maxDim);
  // Force neutral light-reactive material; ignore source textures by design.
  parent.traverse(o=>{
    if (!o.isMesh) return;
    o.material = new THREE.MeshStandardMaterial({
      color:0xe8e6ff,metalness:0,roughness:.86,side:THREE.DoubleSide,
      flatShading:false
    });
    o.castShadow=false;
    if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals();
  });
  return parent;
}
function removeCurrent(){
  if (!currentObj) return;
  modelRoot.remove(currentObj);
  currentObj.traverse(o=>{
    if(!o.isMesh) return;
    // Dispose geometries/materials of removed object, including imported meshes.
    o.geometry?.dispose();
    if (Array.isArray(o.material)) o.material.forEach(m=>m.dispose());
    else o.material?.dispose();
  });
  currentObj=null;
}
function activateModel(obj,label,preset=null){
  // Normalize FIRST to avoid losing the previous model if a file is invalid.
  const normalized=normalizeModel(obj);
  removeCurrent();currentObj=normalized;modelRoot.rotation.set(0,0,0);
  modelRoot.add(currentObj);
  modelName=label;currentPreset=preset;state.model=preset||'custom';
  $('modelName').textContent=`${preset?'PRESET':'IMPORTED'} / ${label}`;
  $('modelBadge').textContent=preset?'LIVE':'LOCAL';
  document.querySelectorAll('[data-model]').forEach(b=>b.classList.toggle('active',b.dataset.model===preset));
  pendingRender=true;
  if(state.rebuildEnabled) startRebuild();
  else finishRebuild();
  // Successful loading is reflected in the MODEL / FILE line only. No toast overlay.
  clearTimeout(toastTimer);
  $('toast').classList.remove('visible');
}
function preset(key){
  activateModel(makePreset(key),titleForModel(key),key);
}

async function loadModelFile(file){
  if(!file)return;
  const ext=file.name.split('.').pop().toLowerCase();
  if(!['glb','gltf','obj','stl'].includes(ext)){toast('Unsupported format. Use GLB, embedded GLTF, OBJ, or STL.');return;}
  if(file.size>60*1024*1024){toast('File is too large (60 MB maximum).');return;}
  $('modelBadge').textContent='LOADING';
  try{
    let object;
    if(ext==='obj'){
      object=new OBJLoader().parse(await file.text());
    }else if(ext==='stl'){
      const geometry=new STLLoader().parse(await file.arrayBuffer());
      object=new THREE.Mesh(geometry);
    }else{
      // A .glb is self-contained. .gltf is supported when all assets are embedded.
      const data=ext==='glb'?await file.arrayBuffer():await file.text();
      const gltf=await new Promise((resolve,reject)=>{
        new GLTFLoader().parse(data, '',resolve,reject);
      });
      object=gltf.scene;
    }
    activateModel(object,file.name,null);
  }catch(e){
    console.error('Model load error',e);
    $('modelBadge').textContent=currentPreset?'LIVE':'LOCAL';
    toast(ext==='gltf'
      ? 'Unable to load GLTF. Embed its assets or export a single GLB file.'
      : `Unable to load file: ${e.message||'invalid format'}`);
  }
}

function updateRebuildStatus(){
  const pct=Math.round(rebuildProgress*100);
  $('rebuildState').textContent=rebuildActive?'RECONSTRUCTING':'ASSEMBLY READY';
  $('rebuildPercent').textContent=`${pct}%`;
  $('rebuildMeterFill').style.width=`${pct}%`;
}
function startRebuild(){
  rebuildActive=true;
  rebuildProgress=0;
  updateRebuildStatus();
  pendingRender=true;
}
function finishRebuild(){
  rebuildActive=false;
  rebuildProgress=1;
  updateRebuildStatus();
  pendingRender=true;
}
function replayRebuild(){
  if(!state.rebuildEnabled){
    state.rebuildEnabled=true;
    $('rebuildEnabled').checked=true;
  }
  startRebuild();
}
function cellHash(x,y){
  let n=(Math.imul(x+311,374761393)+Math.imul(y+197,668265263))|0;
  n=Math.imul(n^(n>>>13),1274126177);
  return ((n^(n>>>16))>>>0)/4294967295;
}
function updateLights(){
  ambientLight.intensity=Number(state.ambient);
  keyLight.intensity=Number(state.keyLight);
  keyLight.position.set(Number(state.lightX),Number(state.lightY),6);
  pendingRender=true;
}
function drawBackdrop(context){
  context.fillStyle=state.bgColor;
  context.fillRect(0,0,W,H);
  if(!state.guides)return;
  const accent=hexToRgb(state.midColor);
  context.save();
  context.strokeStyle=`rgba(${accent.join(',')},.44)`;
  context.lineWidth=1.3;
  context.setLineDash([3,10]);
  context.beginPath();context.moveTo(-35,200);context.bezierCurveTo(290,121,620,155,1035,59);context.stroke();
  context.beginPath();context.moveTo(-35,651);context.bezierCurveTo(297,568,729,602,1036,505);context.stroke();
  context.setLineDash([]);
  for(const s of starfield){
    context.globalAlpha=s.opacity;
    if(s.type==='dot'){
      context.fillStyle=state.midColor;
      context.fillRect(s.x,s.y,s.size,s.size);
    }else{
      context.beginPath();context.moveTo(s.x-4,s.y);context.lineTo(s.x+4,s.y);
      context.moveTo(s.x,s.y-4);context.lineTo(s.x,s.y+4);
      context.stroke();
    }
  }
  context.restore();
}
function sampleCell(imageData,fx,fy,dx,dy){
  const dat=imageData.data;
  let alpha=0,lum=0;
  // Four samples across the glyph cell reduce single-pixel coverage artifacts.
  for(const offset of [[-.19,-.19],[.19,-.19],[-.19,.19],[.19,.19]]){
    const sx=Math.max(0,Math.min(SAMPLE_W-1,Math.floor((fx+offset[0]*dx)*SAMPLE_W/W)));
    const sy=Math.max(0,Math.min(SAMPLE_H-1,Math.floor((fy+offset[1]*dy)*SAMPLE_H/H)));
    const k=(sy*SAMPLE_W+sx)*4;
    const a=dat[k+3]/255;
    alpha+=a;
    lum+=(dat[k]*.2126+dat[k+1]*.7152+dat[k+2]*.0722)*a;
  }
  if(alpha<.4)return {coverage:0,lum:0};
  return {coverage:alpha/4,lum:lum/(alpha*255)};
}
function computeTone(luminance,x,y){
  let tone=Math.pow(clamp((luminance-.5)*Number(state.contrast)+.5+Number(state.exposure)),1/Number(state.gamma));
  const d=(BAYER4[y%4][x%4]-.5-7)/16;
  tone=clamp(tone+d*(Number(state.dither)/100)*.33);
  if(state.invert)tone=1-tone;
  return tone;
}
function renderAscii(){
  if(isRendering)return;
  isRendering=true;
  try{
    renderer.render(scene,camera);
    sampleCtx.clearRect(0,0,SAMPLE_W,SAMPLE_H);
    sampleCtx.drawImage(renderer.domElement,0,0,SAMPLE_W,SAMPLE_H);
    const pixels=sampleCtx.getImageData(0,0,SAMPLE_W,SAMPLE_H);
    drawBackdrop(ctx);
    const cellH=Number(state.cellSize);
    const cellW=cellH*.65;
    const cols=Math.floor(W/cellW),rows=Math.floor(H/cellH);
    const stepX=W/cols,stepY=H/rows;
    // Array.from preserves Unicode code points (Braille, geometric glyphs, etc.).
    const chars=Array.from(state.charsetInput || RAMPS.ship);
    const records=[];
    const rowsText=[];
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font=`600 ${Math.round(cellH*.95)}px ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace`;
    for(let y=0;y<rows;y++){
      let line='';
      for(let x=0;x<cols;x++){
        const px=(x+.5)*stepX,py=(y+.5)*stepY;
        const pixel=sampleCell(pixels,px,py,stepX,stepY);
        if(pixel.coverage<.2){line+=' ';continue;}
        const t=computeTone(pixel.lum,x,y);
        const idx=Math.min(chars.length-1,Math.floor(t*chars.length));
        let char=chars[idx] || ' ';
        let drawX=px,drawY=py;
        let assemblyAlpha=1;
        if(rebuildProgress<1){
          // A rising scan wave + seeded stochastic reveal gives the illusion
          // of fragments finding their final position in the finished shape.
          const threshold=.72*(.55*y/rows+.45*cellHash(x,y));
          const local=clamp((rebuildProgress-threshold)/.24);
          if(local<=0){line+=' ';continue;}
          if(local<.98){
            const jitter=(1-local);
            const wobble=Math.floor(rebuildProgress*90);
            drawX+=(cellHash(x+wobble,y)-.5)*cellH*7*jitter;
            drawY+=(cellHash(x,y+wobble)-.5)*cellH*7*jitter;
            const alt=Math.floor(cellHash(x+wobble,y+73)*chars.length);
            if(cellHash(x+91,y+wobble)>(.3+.7*local))char=chars[alt]||char;
            assemblyAlpha=.20+.8*local;
          }
        }
        line+=char;
        if(char===' ')continue;
        const color=glyphColor(t);
        ctx.fillStyle=color;
        ctx.globalAlpha=clamp(pixel.coverage*1.5,.3,1)*assemblyAlpha;
        ctx.fillText(char,drawX,drawY);
        records.push({char,x:drawX,y:drawY,color,alpha:ctx.globalAlpha,size:Math.round(cellH*.95)});
      }
      rowsText.push(line);
    }
    ctx.globalAlpha=1;
    lastGlyphs=records;
    lastRows=rowsText;
    currentGrid={cols,rows};
    $('gridStat').textContent=`${cols} COL × ${rows} ROW / ${records.length.toLocaleString('en-US')} GLYPHS`;
  }catch(e){console.error('Render error',e);toast(`Render: ${e.message}`);}
  finally{isRendering=false;}
}
function renderNow(forceComplete=false){
  const savedProgress=rebuildProgress;
  if(forceComplete)rebuildProgress=1;
  controls.update();renderAscii();pendingRender=false;
  rebuildProgress=savedProgress;
}
let lastFrame=0;
function loop(now){
  requestAnimationFrame(loop);
  if(now-lastFrame<48)return; // capped to ~20 FPS for older laptops.
  const dt=Math.min((now-lastFrame)/1000,.1);lastFrame=now;
  if(state.autoRotate && currentObj){modelRoot.rotation.y+=dt*Number(state.speed)*.42;pendingRender=true;}
  if(rebuildActive){
    rebuildProgress=Math.min(1,rebuildProgress+dt/Number(state.rebuildTime));
    if(rebuildProgress>=1)rebuildActive=false;
    updateRebuildStatus();pendingRender=true;
  }
  controls.update();
  if(pendingRender){renderAscii();pendingRender=false;}
}

function downloadBlob(data,name,type){
  const blob=data instanceof Blob?data:new Blob([data],{type});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function exportBase(){
  return `ascii-object_${modelName.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}`;
}
function canvasPNG(){
  renderNow(true);
  output.toBlob(blob=>{if(blob){downloadBlob(blob,`${exportBase()}.png`,'image/png');toast('PNG exported (1000 × 760 px).');}},'image/png');
}
function backdropSvg(){
  if(!state.guides)return '';
  const mid=state.midColor;
  let s=`<g fill="none" stroke="${mid}" stroke-opacity=".44" stroke-width="1.3" stroke-dasharray="3 10"><path d="M -35 200 C 290 121 620 155 1035 59"/><path d="M -35 651 C 297 568 729 602 1036 505"/></g>`;
  for(const p of starfield){
    if(p.type==='dot')s+=`<rect x="${p.x.toFixed(1)}" y="${p.y.toFixed(1)}" width="${p.size.toFixed(1)}" height="${p.size.toFixed(1)}" fill="${mid}" opacity="${p.opacity.toFixed(3)}"/>`;
    else s+=`<path d="M ${(p.x-4).toFixed(1)} ${p.y.toFixed(1)} h 8 M ${p.x.toFixed(1)} ${(p.y-4).toFixed(1)} v 8" fill="none" stroke="${mid}" stroke-opacity="${p.opacity.toFixed(3)}"/>`;
  }
  return s;
}
function exportSVG(){
  renderNow(true);
  // Real SVG text: editable vector layout. Some design apps may convert glyphs to outlines.
  const glyphs=lastGlyphs.map(g=>`<text x="${g.x.toFixed(2)}" y="${g.y.toFixed(2)}" fill="${g.color}" opacity="${g.alpha.toFixed(3)}" font-size="${g.size}" text-anchor="middle" dominant-baseline="central">${escapeXml(g.char)}</text>`).join('');
  const s=`<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><title>ASCII Object — ${escapeXml(modelName)}</title><rect width="${W}" height="${H}" fill="${state.bgColor}"/>${backdropSvg()}<g font-family="'SFMono-Regular', Consolas, 'Liberation Mono', monospace" font-weight="600">${glyphs}</g></svg>`;
  downloadBlob(s,`${exportBase()}.svg`,'image/svg+xml;charset=utf-8');toast('SVG exported with editable text glyphs.');
}
function exportTXT(){
  renderNow(true);
  downloadBlob(lastRows.join('\n'),`${exportBase()}.txt`,'text/plain;charset=utf-8');
  toast('TXT exported: editable ASCII matrix.');
}
function serializePreset(){
  return {app:'ASCII / OBJECT LAB',version:3,params:Object.fromEntries(K.filter(k=>k!=='model').map(k=>[k,state[k]]))};
}
function exportPreset(){
  downloadBlob(JSON.stringify(serializePreset(),null,2),'ascii-object-preset.json','application/json');
  toast('JSON preset saved.');
}

// ---- Self-contained embed. The GLB is written inline as Base64.
// No remote model URL, separate deployment or backend is required.
// Three.js modules remain CDN dependencies (same version as the editor).
let embeddedRuntimePromise = null;
let lastEmbed = null;
const EMBED_MODEL_LIMIT = 8 * 1024 * 1024; // prevent huge inline HTML snippets
function htmlAttribute(s) {
  return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function safeScriptJson(value) {
  return JSON.stringify(value).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
}
function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let text = '';
  // Chunk to avoid argument limits in String.fromCharCode.
  for(let i = 0; i < bytes.length; i += 16384){
    text += String.fromCharCode(...bytes.subarray(i, i + 16384));
  }
  return btoa(text);
}
async function getEmbedRuntime() {
  if(!embeddedRuntimePromise){
    embeddedRuntimePromise = fetch('./embed-runtime.js').then(async response => {
      if(!response.ok) throw new Error('Embedded viewer runtime could not be loaded.');
      return response.text();
    }).catch(err => { embeddedRuntimePromise = null; throw err; });
  }
  return embeddedRuntimePromise;
}
async function exportCurrentAsGlb(){
  if (!currentObj) throw new Error('Select or import a model first.');
  return new Promise((resolve,reject) => {
    new GLTFExporter().parse(currentObj, resolve, reject, {binary:true, onlyVisible:true, trs:true});
  });
}
async function createEmbed(){
  const [buffer, runtime] = await Promise.all([exportCurrentAsGlb(),getEmbedRuntime()]);
  if (!(buffer instanceof ArrayBuffer)) throw new Error('GLB export returned an unexpected result.');
  if(buffer.byteLength > EMBED_MODEL_LIMIT){
    throw new Error('This model exceeds the 8 MB inline embed limit. Simplify it in Blender before exporting.');
  }
  const embeddedConfig={
    params: Object.fromEntries(K.filter(k=>k!=='model').map(k=>[k,state[k]])),
    camera:camera.position.toArray(),target:controls.target.toArray(),rotation:modelRoot.rotation.toArray()
  };
  const safeBg = /^#[0-9a-f]{6}$/i.test(state.bgColor) ? state.bgColor : '#070619';
  const html=`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ASCII Object — Interactive 3D Embed</title>
<style>
*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:${safeBg}}
#ascii{width:100%;height:100%;display:block;object-fit:contain;background:${safeBg}}
#interaction{position:absolute;inset:0;touch-action:none;cursor:grab}
#interaction:active{cursor:grabbing}
#error{position:absolute;left:12px;right:12px;bottom:12px;color:#fff;font:12px sans-serif}
</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/"}}</script>
</head><body><canvas id="ascii" width="1000" height="760" aria-label="Interactive 3D ASCII object"></canvas><div id="interaction" aria-label="Drag to rotate, scroll to zoom"></div><p id="error" hidden></p>
<script type="module">
const EMBED_CONFIG=${safeScriptJson(embeddedConfig)};
const EMBED_GLB_BASE64=${safeScriptJson(toBase64(buffer))};
${runtime}
</script></body></html>`;
  const iframe=`<iframe title="Interactive ASCII 3D Object" loading="lazy" sandbox="allow-scripts" style="display:block;width:100%;height:auto;aspect-ratio:1000 / 760;border:0;" srcdoc="${htmlAttribute(html)}"></iframe>`;
  return {html,iframe,bytes:buffer.byteLength};
}
async function copyText(text){
  try{
    if(!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
    await navigator.clipboard.writeText(text);
    return true;
  }catch(err){
    try{
      const textarea = $('embedCode');
      textarea.value = text;
      textarea.focus(); textarea.select();
      return document.execCommand('copy');
    }catch{ return false; }
  }
}
function embedBusy(isBusy){
  $('copyEmbed').disabled=isBusy;
  $('downloadEmbed').disabled=isBusy;
  $('copyFromDialog').disabled=isBusy;
  $('downloadFromDialog').disabled=isBusy;
  if (isBusy) $('embedStatus').textContent='PACKAGING MODEL…';
}
async function generateEmbed(action){
  embedBusy(true);
  try{
    const result=await createEmbed();
    lastEmbed=result;
    if(action==='download'){
      downloadBlob(result.html,`${exportBase()}-interactive-embed.html`,'text/html;charset=utf-8');
      $('embedStatus').textContent='INTERACTIVE HTML DOWNLOADED';
    }else{
      const copied=await copyText(result.iframe);
      if(copied){
        $('embedStatus').textContent='EMBED CODE COPIED';
      }else{
        $('embedCode').value=result.iframe;
        $('embedDialog').showModal();
        $('embedStatus').textContent='SELECT & COPY FROM DIALOG';
      }
    }
    if(result.bytes > 2 * 1024 * 1024){
      $('embedStatus').textContent += ' · LARGE EMBED: DOWNLOAD HTML MAY BE EASIER';
    }
  }catch(error){
    console.error('Embed generation:',error);
    $('embedStatus').textContent='EMBED ERROR';
    toast(error.message || 'Unable to generate embed.');
  }finally{embedBusy(false);}
}

function updateLabel(id){
  const el=$(`${id}Value`);if(!el)return;
  const value=Number(state[id]);
  const format={cellSize:`${value} px`,dither:`${value}%`,contrast:`${value.toFixed(2)}×`,exposure:`${value>=0?'+':''}${value.toFixed(2)}`,gamma:value.toFixed(2),keyLight:value.toFixed(2),ambient:value.toFixed(2),lightX:value.toFixed(1),lightY:value.toFixed(1),speed:`${value.toFixed(2)}×`,rebuildTime:`${value.toFixed(2)} s`};
  el.textContent=format[id]??String(value);
  const input=$(id);if(input?.type==='range')input.style.setProperty('--progress',`${100*(value-Number(input.min))/(Number(input.max)-Number(input.min))}%`);
}
function syncUI(){
  for(const key of K){
    const element=$(key);if(!element)continue;
    if(element.type==='checkbox')element.checked=Boolean(state[key]);
    else element.value=state[key];
    updateLabel(key);
  }
  updateLights();
}
function applyPreset(json){
  if(!json?.params||json.app!=='ASCII / OBJECT LAB')throw new Error('Unrecognized preset format.');
  for(const key of K){
    if(key==='model'||!(key in json.params))continue;
    const val=json.params[key];
    if(typeof DEFAULT[key]==='boolean'&&typeof val==='boolean')state[key]=val;
    else if(typeof DEFAULT[key]==='number'&&Number.isFinite(Number(val))){
      const slider=$(key);
      state[key]=slider?.type==='range'?Math.max(Number(slider.min),Math.min(Number(slider.max),Number(val))):Number(val);
    }else if(typeof DEFAULT[key]==='string'&&typeof val==='string'&&val.length<100){
      state[key]=val;
    }
  }
  state.charsetInput=String(state.charsetInput).slice(0,70)||RAMPS.ship;
  syncUI();if(!state.rebuildEnabled)finishRebuild();pendingRender=true;
}
function initUI(){
  const rangeIds=['cellSize','dither','contrast','exposure','gamma','keyLight','ambient','lightX','lightY','speed','rebuildTime'];
  for(const id of rangeIds){
    $(id).addEventListener('input',e=>{
      state[id]=Number(e.target.value);
      updateLabel(id);
      if(['keyLight','ambient','lightX','lightY'].includes(id))updateLights();
      pendingRender=true;
    });
  }
  for(const id of ['invert','autoRotate','guides','rebuildEnabled'])$(id).addEventListener('change',e=>{
    state[id]=e.target.checked;
    if(id==='rebuildEnabled'&&!state.rebuildEnabled)finishRebuild();
    pendingRender=true;setPlayLabel();
  });
  for(const id of ['bgColor','shadowColor','midColor','highColor'])$(id).addEventListener('input',e=>{state[id]=e.target.value;pendingRender=true;});
  $('charsetPreset').addEventListener('change',e=>{
    state.charsetPreset=e.target.value;
    if(RAMPS[state.charsetPreset])state.charsetInput=RAMPS[state.charsetPreset];
    $('charsetInput').value=state.charsetInput;pendingRender=true;
  });
  $('charsetInput').addEventListener('input',e=>{state.charsetInput=e.target.value||' ';state.charsetPreset='custom';$('charsetPreset').value='custom';pendingRender=true;});
  $('modelPresets').addEventListener('click',e=>{const b=e.target.closest('[data-model]');if(b)preset(b.dataset.model);});
  $('modelInput').addEventListener('change',async e=>{await loadModelFile(e.target.files[0]);e.target.value='';});
  $('dropZone').addEventListener('click',()=> $('modelInput').click());
  $('dropZone').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('modelInput').click();}});
  // Drop support across the stage as well as the input area.
  let depth=0;
  for(const id of ['canvasShell','dropZone']){
    const node=$(id);
    node.addEventListener('dragenter',e=>{e.preventDefault();depth++;node.classList.add('dragover');});
    node.addEventListener('dragover',e=>{e.preventDefault();e.dataTransfer.dropEffect='copy';});
    node.addEventListener('dragleave',e=>{e.preventDefault();depth=Math.max(0,depth-1);if(!depth)node.classList.remove('dragover');});
    node.addEventListener('drop',async e=>{e.preventDefault();depth=0;node.classList.remove('dragover');await loadModelFile(e.dataTransfer.files?.[0]);});
  }
  $('rebuildReplay').addEventListener('click',replayRebuild);
  $('replayStage').addEventListener('click',replayRebuild);
  $('resetView').addEventListener('click',()=>{camera.position.set(3.2,2.05,6.1);controls.target.set(0,0,0);modelRoot.rotation.set(0,0,0);controls.update();pendingRender=true;});
  $('playPause').addEventListener('click',()=>{state.autoRotate=!state.autoRotate;$('autoRotate').checked=state.autoRotate;setPlayLabel();pendingRender=true;});
  $('resetPalette').addEventListener('click',()=>{Object.assign(state,REFERENCE);for(const k of Object.keys(REFERENCE))$(k).value=state[k];pendingRender=true;toast('Reference palette restored.');});
  $('exportPng').addEventListener('click',canvasPNG);
  $('exportSvg').addEventListener('click',exportSVG);
  $('exportTxt').addEventListener('click',exportTXT);
  $('copyEmbed').addEventListener('click',()=>generateEmbed('copy'));
  $('downloadEmbed').addEventListener('click',()=>generateEmbed('download'));
  $('copyFromDialog').addEventListener('click',async()=>{if(lastEmbed){const ok=await copyText(lastEmbed.iframe);$('embedStatus').textContent=ok?'EMBED CODE COPIED':'SELECT THE CODE AND COPY MANUALLY';}});
  $('downloadFromDialog').addEventListener('click',()=>{if(lastEmbed)downloadBlob(lastEmbed.html,`${exportBase()}-interactive-embed.html`,'text/html;charset=utf-8');});
  $('exportPreset').addEventListener('click',exportPreset);
  $('importPreset').addEventListener('click',()=> $('presetInput').click());
  $('presetInput').addEventListener('change',async e=>{
    const file=e.target.files[0];if(!file)return;
    try{applyPreset(JSON.parse(await file.text()));toast('Preset loaded. Parameters restored.');}
    catch(err){toast('Cannot load JSON: '+err.message);}
    e.target.value='';
  });
  document.addEventListener('keydown',e=>{
    if(/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName))return;
    if(e.code==='Space'){e.preventDefault();$('playPause').click();}
    if(e.key==='r'||e.key==='R')$('resetView').click();
  });
  syncUI();setPlayLabel();
}
function setPlayLabel(){
  $('playIcon').textContent=state.autoRotate?'Ⅱ':'▷';
  $('playText').textContent=state.autoRotate?'PAUSE MOTION':'START MOTION';
}
initUI();
updateLights();
preset('knot');
requestAnimationFrame(loop);
