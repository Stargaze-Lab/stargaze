import './styles.css';
import { ThreeWorld } from './three-world.js';
import { initBalanceChart } from './balance.js';
import { initNetwork } from './network.js';
import { initTerritoryFlow } from './territory.js';
import { initLab } from './lab.js';
import { sources } from './data.js';

const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const body=document.body;
const progress=document.querySelector('.scroll-progress i');
const atlasButtons=[...document.querySelectorAll('[data-atlas]')];
atlasButtons.forEach(button=>button.addEventListener('click',()=>{
  document.body.dataset.atlas=button.dataset.atlas;
  atlasButtons.forEach(btn=>{const on=btn===button;btn.classList.toggle('is-active',on);btn.setAttribute('aria-pressed',String(on));});
}));
document.body.dataset.atlas='blend';
let world;
try{world=new ThreeWorld(document.querySelector('#three-stage'));}
catch(err){console.warn('Three.js unavailable: narrative uses SVG fallback.',err);world={setMode(){},setTerritoryState(){}};document.body.classList.add('no-webgl');}
const network=initNetwork(document.querySelector('#network-svg'));
const territory=initTerritoryFlow(document.querySelector('#territory-flow'));
initBalanceChart(document.querySelector('#balance-chart'));
initLab();

// Accessible, reversible category lens drawn directly from the frozen observed AREA raster.
const mapLensButtons=[...document.querySelectorAll('[data-map-category]')];
const mapLensImage=document.querySelector('#territory-active-layer');
const mapLensReadout=document.querySelector('#territory-map-readout');
let selectedMapCategory=null;
const mapLensInfo={
  agriculture:'Agriculture (35%): arable land, local pasture, orchards and alpine agricultural areas.',
  wooded:'Wooded areas (32%): forests and other tree-covered land.',
  unproductive:'Unproductive land (25%): water, unused vegetation, rock, bare soil, snow and glaciers.',
  settlements:'Settlements (8%): built environment, housing, industry and infrastructure.',
  arable:'Arable land (9.2% of Swiss territory): a subset of agricultural land, mainly in lowland areas.',
  rockice:'Rock / bare ground / ice (20.8%): rocky and unvegetated terrain plus permanent ice, not a map of altitude.'
};
function updateMapLens(category){
  const active=category||selectedMapCategory;
  document.body.dataset.mapFocus=active||'all';
  if(mapLensImage)mapLensImage.src=active?`${import.meta.env.BASE_URL}assets/area-highlight-${active}.png`:`${import.meta.env.BASE_URL}assets/area-four-groups.png`;
  if(mapLensReadout)mapLensReadout.textContent=active?mapLensInfo[active]:'Hover, focus or tap a category to highlight it in the observed map.';
  mapLensButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mapCategory===selectedMapCategory)));
}
mapLensButtons.forEach(button=>{
  button.setAttribute('aria-pressed','false');
  button.addEventListener('pointerenter',()=>updateMapLens(button.dataset.mapCategory));
  button.addEventListener('pointerleave',()=>updateMapLens());
  button.addEventListener('focus',()=>updateMapLens(button.dataset.mapCategory));
  button.addEventListener('blur',()=>updateMapLens());
  button.addEventListener('click',()=>{selectedMapCategory=selectedMapCategory===button.dataset.mapCategory?null:button.dataset.mapCategory;updateMapLens();});
});
updateMapLens();

// Reflow LAB into control / map / evidence panes without duplicating live IDs.
const labShell=document.querySelector('.lab-shell');
const labSide=document.createElement('aside');labSide.className='lab-insights';labSide.setAttribute('aria-label','Live dependency responses');
labSide.innerHTML='<div class="insight-heading">LIVE RESPONSES <small>Qualitative unless stated</small></div><section class="insight-block" id="lab-response-block"><h3>01 / DEMAND</h3></section><section class="insight-block" id="lab-production-block"><h3>02 / PRODUCTION</h3></section><section class="insight-block insight-calibration" id="lab-wheat-block"><h3>03 / WHEAT → BREAD</h3></section>';
labShell.appendChild(labSide);
const response=document.querySelector('#lab-directions');
const dependency=document.querySelector('#dependency-radar');
const calibration=document.querySelector('.calibration');
if(response)document.querySelector('#lab-response-block').appendChild(response);
if(dependency)document.querySelector('#lab-production-block').appendChild(dependency);
if(calibration)document.querySelector('#lab-wheat-block').appendChild(calibration);
// Preserve computation but remove duplicated, oversized SVG caption legend from public layout.
const chart=document.querySelector('#lab-output-viz');if(chart){chart.hidden=true;chart.setAttribute('aria-hidden','true');}

const nav=document.querySelector('#story-nav');
const navItems=[];
function registerNav(key,label,target,major=false){
  navItems.push({key,label,target,major});
}
registerNav('hero','INTRO',document.querySelector('#hero'),true);
const stepLabels={
  'balance:hook':'50% PRODUCED',
  'balance:plate':'THE PLATE',
  'balance:split':'31 / 93%',
  'balance:shock':'WEATHER · 2024',
  'network:system':'SYSTEM',
  'network:milk':'MILK',
  'network:wheat':'WHEAT',
  'network:coffee':'COFFEE',
  'network:compare':'COMPARE',
  'territory:current':'CURRENT',
  'territory:capability':'CAPABILITY',
  'territory:constraints':'CONSTRAINTS',
  'territory:question':'2050',
};
const majorFirst=new Set(['balance:hook','network:system','territory:current']);
[...document.querySelectorAll('.step')].forEach((step,i)=>{
  const key=`${step.dataset.scene}:${step.dataset.state}`;
  step.id=`beat-${i+1}`;
  registerNav(key,stepLabels[key]||step.dataset.state.toUpperCase(),step,majorFirst.has(key));
});
// Transitions are full narrative moments, not gaps between numbered scenes.
registerNav('bridge:balance-network','TO NETWORK',document.querySelector('#from-balance'),true);
registerNav('bridge:network-territory','TO TERRITORY',document.querySelector('#from-network'),true);
registerNav('bridge:territory-lab','TO LAB',document.querySelector('#from-territory'),true);
registerNav('lab','LAB',document.querySelector('#lab'),true);
registerNav('takeaway','FINDINGS',document.querySelector('#takeaway'),true);
registerNav('about','ABOUT',document.querySelector('#about'),true);
registerNav('notes','TECHNICAL NOTES',document.querySelector('#technical-notes'),true);
// The step elements and interludes are discovered separately. Sort by actual
// document order so keyboard navigation follows the visible reading sequence.
navItems.sort((a,b)=>a.target===b.target?0:(a.target.compareDocumentPosition(b.target)&Node.DOCUMENT_POSITION_FOLLOWING)?-1:1);
nav.innerHTML=navItems.map((item,i)=>`<button class="story-dot ${item.major?'is-major':''}" data-nav-key="${item.key}" type="button" aria-label="Go to ${item.label}"><i></i><span>${String(i).padStart(2,'0')} · ${item.label}</span></button>`).join('');
nav.querySelectorAll('.story-dot').forEach((btn,i)=>btn.addEventListener('click',()=>{
  navItems[i].target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
}));
let activeNavKey='hero';
function setNav(key){
  activeNavKey=key;
  nav.querySelectorAll('.story-dot').forEach(el=>el.classList.toggle('is-active',el.dataset.navKey===key));
}
// Previous / next narrative beat; keep native arrow behavior in interactive controls.
document.addEventListener('keydown',event=>{
  if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
  if(event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||event.defaultPrevented)return;
  const focused=event.target;
  if(focused?.closest('input, textarea, select, button, a, summary, [contenteditable], [role="slider"], [role="textbox"], [role="dialog"]'))return;

  const current=navItems.findIndex(item=>item.key===activeNavKey);
  const next=Math.max(0,Math.min(navItems.length-1,(current<0?0:current)+(event.key==='ArrowRight'?1:-1)));
  if(next===(current<0?0:current))return;
  event.preventDefault();
  navItems[next].target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});
  setNav(navItems[next].key);
});

function setStatement(group,state){
  document.querySelectorAll(`#${group} .statement`).forEach(el=>{
    const active=el.dataset.state===state; el.classList.toggle('is-active',active); el.setAttribute('aria-hidden',String(!active));el.inert=!active;
  });
}
function setBalance(state){body.dataset.balance=state;setStatement('balance-statements',state);setNav(`balance:${state}`);}
function setNetwork(state){body.dataset.network=state;setStatement('network-statements',state);network.setState(state);setNav(`network:${state}`);}
function setTerritory(state){
  body.dataset.territory=state;setStatement('territory-statements',state);territory.setState(state);world.setTerritoryState(state);setNav(`territory:${state}`);
  document.querySelector('#territory-caption').textContent=state==='current'?'OBSERVED / CURRENT USE':state==='capability'?'MODELED / SITE-ADAPTED':state==='constraints'?'OBSERVED + POLICY / CONSTRAINTS':'SCENARIO / 2050 QUESTION';
}

const handlers={balance:setBalance,network:setNetwork,territory:setTerritory};
const steps=[...document.querySelectorAll('.step')];
const io=new IntersectionObserver(entries=>{
  const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>Math.abs(a.boundingClientRect.top-innerHeight*.52)-Math.abs(b.boundingClientRect.top-innerHeight*.52));
  if(!visible.length)return; const s=visible[0].target; handlers[s.dataset.scene]?.(s.dataset.state);
},{rootMargin:'-42% 0px -42% 0px',threshold:0}); steps.forEach(s=>io.observe(s));

// Track interludes as active destinations while the reader scrolls normally.
// This also makes the corresponding navigation dot light up on transition screens.
const transitions=[
  ['bridge:balance-network','#from-balance'],
  ['bridge:network-territory','#from-network'],
  ['bridge:territory-lab','#from-territory']
];
const transitionObserver=new IntersectionObserver(entries=>{
  const visible=entries.filter(e=>e.isIntersecting);
  if(!visible.length)return;
  const target=visible.sort((a,b)=>Math.abs(a.boundingClientRect.top+a.boundingClientRect.height/2-innerHeight/2)-Math.abs(b.boundingClientRect.top+b.boundingClientRect.height/2-innerHeight/2))[0].target;
  const current=transitions.find(([,selector])=>document.querySelector(selector)===target);
  if(current)setNav(current[0]);
},{rootMargin:'-38% 0px -38% 0px',threshold:0});
transitions.forEach(([,selector])=>transitionObserver.observe(document.querySelector(selector)));

const systems=[...document.querySelectorAll('.system')];
const sysObs=new IntersectionObserver(entries=>{
  entries.filter(e=>e.isIntersecting).forEach(e=>{
    const mode=e.target.dataset.system; world.setMode(mode); body.dataset.system=mode;
    if(mode==='splash') setNav('hero');
    if(mode==='lab') setNav('lab');
    if(mode==='takeaway') setNav('takeaway');
    if(mode==='about') setNav('about');
    if(mode==='notes') setNav('notes');
  });
},{rootMargin:'-35% 0px -35% 0px',threshold:0}); systems.forEach(s=>sysObs.observe(s));

const revealObs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('is-visible');}),{threshold:.18});
document.querySelectorAll('.reveal,.mask').forEach(el=>revealObs.observe(el));

function onScroll(){
  const h=document.documentElement.scrollHeight-innerHeight; progress.style.transform=`scaleX(${h?scrollY/h:0})`;
  document.querySelectorAll('.chapter').forEach(ch=>{
    const r=ch.getBoundingClientRect(); const p=clamp((-r.top)/(r.height-innerHeight)); ch.style.setProperty('--chapter-progress',p);
  });
}
addEventListener('scroll',onScroll,{passive:true}); addEventListener('resize',onScroll); onScroll();

// Primary sources remain attached to their own scenes and are indexed at the end.
const list=document.querySelector('#sources-list');
if(list) list.innerHTML=sources.map((s,i)=>`<article><span>${String(i+1).padStart(2,'0')} · ${s.tag}</span><h3 lang="${/Nahrungs|Futter/.test(s.title)?'de':'en'}">${s.title.replace('Nahrungsmittelbilanz','Nahrungs\u00admittel\u00adbilanz').replace('Futtermittelbilanz','Futter\u00admittel\u00adbilanz')}</h3><p>${s.use}</p><a href="${s.href}" target="_blank" rel="noopener noreferrer">${s.publisher} ↗</a></article>`).join('');

// Source shortcuts open the requested panel without changing the published URL.
// Both disclosures remain closed by default on initial page load.
const sourceDisclosure=document.querySelector('#sources-disclosure');
const notesDisclosure=document.querySelector('#notes-disclosure');
document.querySelectorAll('a[href="#technical-notes"]').forEach(link=>{
  link.addEventListener('click',()=>{
    const label=(link.textContent||'').trim().toUpperCase();
    if(link.id==='sources-open' || label.startsWith('SOURCES') || label.startsWith('QUELLEN')) sourceDisclosure.open=true;
    else notesDisclosure.open=true;
  });
});

// subtle cursor magnetic response
const cursor=document.createElement('div');cursor.className='cursor';document.body.appendChild(cursor);let cx=0,cy=0,tx=0,ty=0;addEventListener('pointermove',e=>{tx=e.clientX;ty=e.clientY;cursor.classList.add('on');},{passive:true});
(function loop(){cx+=(tx-cx)*.18;cy+=(ty-cy)*.18;cursor.style.transform=`translate3d(${cx}px,${cy}px,0)`;requestAnimationFrame(loop)})();
document.querySelectorAll('a,button,input').forEach(el=>{el.addEventListener('pointerenter',()=>cursor.classList.add('hot'));el.addEventListener('pointerleave',()=>cursor.classList.remove('hot'));});

setBalance('hook');setNetwork('system');setTerritory('current');
