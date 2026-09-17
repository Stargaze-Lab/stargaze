import {projects,sketches} from './projects.generated.js';
import {notes} from './notes.generated.js';
import home from '../content/home.json';
import {createFieldEngine,nextSceneIndex} from './visual-fields.js';
import {escapeHTML} from './note-format.js';
import {mountNotes} from './note-reader.js';
import {t,language,mountLanguage,projectEnglish} from './site-language.js';
import {mountProjectNavigation} from './project-navigation.js';
import {renderLissajousContext} from './lissajous-context.js';
import {mountCursor} from './blob-cursor.js';

const scenes=[
  {id:'flock',name:'Cardume · movimentos coletivos',short:'Cardume',color:'#e7bd6d'},
  {id:'network',name:'Redes · ideias em relação',short:'Redes',color:'#94bde5'},
  {id:'lissajous',name:'Lissajous · uma relação 4:5',short:'Pulso',color:'#b3a7dc'},
  {id:'kaleidoscope',name:'Caleidoscópio · matéria em simetria',short:'Lente',color:'#a8c8bc'},
];
const sketchModules=import.meta.glob('./sketches/*.js');
const sourceEntries=new Map([...projects,...sketches].map(entry=>[entry.slug,entry]));
const groups={selection:home.selection,instruments:home.instruments,shelf:home.shelf};
const collection=Object.values(groups).flat().map(item=>({...sourceEntries.get(item.slug),...item}));
const bySlug=new Map(collection.map(item=>[item.slug,item]));
const engine=createFieldEngine();
const abort=new AbortController();
const on=(el,event,fn)=>el.addEventListener(event,fn,{signal:abort.signal});
const hero=document.querySelector('.hero'),art=document.querySelector('#hero-art');
let currentScene=0,selectedSlug=null,heroVisible=true,cycleElapsed=0,lastCycle=performance.now(),interactionAt=0;
let heroField,transitionTimer=0,transitionClassTimer=0,dialogField,cleanupSketch=null,loadToken=0,dialogIndex=0;
const fieldMounts=[];
const motionQuery=matchMedia('(prefers-reduced-motion: reduce)');

function theme(hex){document.documentElement.style.setProperty('--accent',hex);engine.setTone(hex);}
function clearSelection(){
  selectedSlug=null;document.querySelectorAll('[data-card]').forEach(card=>{card.classList.remove('is-selected');card.querySelector('.card-tune').setAttribute('aria-pressed','false');});
  document.querySelector('#focus-message').textContent=t('Um mesmo lugar. Diferentes formas de olhar.','One place. Different ways of seeing.');
  document.querySelector('#reset-field').hidden=true;
}
function changeField(scene,label,color){
  // Celeste retains its cover, but the dome no longer enters the hero.
  if(scene==='dome')scene=scenes[currentScene].id;
  hero.dataset.cursor=['network','kaleidoscope'].includes(scene)?'drag':'interact';
  clearTimeout(transitionTimer);clearTimeout(transitionClassTimer);cycleElapsed=0;
  document.querySelector('#scene-progress').style.transform='scaleX(0)';
  theme(color);
  document.querySelectorAll('[data-scene-index]').forEach(button=>button.setAttribute('aria-pressed',String(scenes[Number(button.dataset.sceneIndex)].id===scene)));
  if(!heroField){heroField=engine.mount(art,scene,{hero:true,pointerSurface:hero});return;}
  if(motionQuery.matches || engine.paused){heroField.setScene(scene);art.classList.remove('changing');return;}
  art.classList.add('changing');
  transitionTimer=setTimeout(()=>{heroField.setScene(scene);transitionClassTimer=setTimeout(()=>art.classList.remove('changing'),50);},450);
}
function chooseScene(index){
  currentScene=index;clearSelection();const scene=scenes[index];changeField(scene.id,scene.name,scene.color);
  try {sessionStorage.setItem('stargaze.last-hero-scene',String(index));}catch{/* Session preference is optional. */}
}
function selectProject(slug){
  const entry=bySlug.get(slug);if(!entry)return;
  selectedSlug=slug;
  document.querySelectorAll('[data-card]').forEach(card=>{const selected=card.dataset.card===slug;card.classList.toggle('is-selected',selected);card.querySelector('.card-tune').setAttribute('aria-pressed',String(selected));});
  document.querySelector('#focus-message').textContent=t(`Campo sintonizado: ${entry.title}.`,`Field tuned to ${entry.title}.`);
  document.querySelector('#reset-field').hidden=false;
  changeField(entry.scene,`${entry.title} · campo sintonizado`,entry.color);
}

scenes.forEach((scene,index)=>{
  const button=document.createElement('button');button.type='button';button.dataset.sceneIndex=String(index);
  button.setAttribute('aria-label',t(`Cena ${index+1} de ${scenes.length}`,`Scene ${index+1} of ${scenes.length}`));button.setAttribute('aria-pressed','false');
  button.innerHTML='<span class="scene-dot" aria-hidden="true"></span>';
  on(button,'click',()=>{chooseScene(index);interactionAt=performance.now();});document.querySelector('#scene-selectors').append(button);
});

function renderGroup(group,target){
  const container=document.querySelector(target);
  group.forEach((item,index)=>{
    const entry=bySlug.get(item.slug),card=document.createElement('article');
    card.className='project-card';card.dataset.card=entry.slug;card.dataset.size=entry.size;
    card.dataset.cursor='open';
    card.innerHTML=`<div class="card-art-wrap"><div class="card-art" aria-hidden="true"></div><span class="card-index" aria-hidden="true">${String(index+1).padStart(2,'0')}</span></div><div class="card-meta"><div><p class="card-category"></p><h3>${escapeHTML(entry.title)}</h3><p class="card-summary"></p>${entry.state?'<span class="card-state"></span>':''}</div><span class="card-arrow" aria-hidden="true">↗</span></div><button class="card-tune" type="button" aria-haspopup="dialog"></button>`;
    container.append(card);
    fieldMounts.push(engine.mount(card.querySelector('.card-art'),entry.scene));
    on(card.querySelector('.card-tune'),'click',()=>openProject(entry.slug));
  });
}
renderGroup(groups.selection,'#selected-projects');renderGroup(groups.instruments,'#instrument-projects');renderGroup(groups.shelf,'#shelf-projects');

const dialog=document.querySelector('#project-dialog');
const dialogArt=document.querySelector('#project-dialog-art');
function cleanupStage(){loadToken++;cleanupSketch?.();cleanupSketch=null;dialogField?.destroy();dialogField=null;dialogArt.classList.remove('music-mounted','lissajous-mounted','chromascope-mounted');dialogArt.replaceChildren();}
function projectHref(entry){
  if(!entry.href)return null;
  const url=new URL(entry.href,new URL(document.documentElement.dataset.siteRoot||'./',location.href));
  return ['https:','http:'].includes(url.protocol)?url.href:null;
}
function openProject(slug){
  const entry=bySlug.get(slug);if(!entry)return;
  selectProject(slug);cleanupStage();dialogIndex=collection.findIndex(e=>e.slug===slug);
  const translated=projectEnglish[entry.slug];
  document.querySelector('#project-dialog-label').textContent=t(entry.category,translated[0]);
  document.querySelector('#project-dialog-title').textContent=entry.title;
  document.querySelector('#project-dialog-summary').textContent=t(entry.summary,translated[1]);
  const context=document.querySelector('#project-dialog-context');context.hidden=entry.slug!=='lissajous';
  context.open=false;context.querySelector('summary').textContent=t('Contexto e referências','Context and references');
  document.querySelector('#project-dialog-references').innerHTML=entry.slug==='lissajous'?renderLissajousContext(language):'';
  document.querySelector('#project-dialog-tags').innerHTML=(entry.tools||[]).map(tag=>`<span>${escapeHTML(tag)}</span>`).join('');
  document.querySelector('#project-dialog-hint').textContent=entry.scene==='network'?t('Arraste um nó para puxar a rede. Arraste o vazio para girar.','Drag a node to pull the network. Drag empty space to rotate.'):entry.scene==='kaleidoscope'?t('Arraste para reorganizar os fragmentos.','Drag to rearrange the fragments.'):entry.scene==='lissajous'?t('Clique para mudar a fase. Arraste para explorar a curva.','Click to shift the phase. Drag to explore the curve.'):t('Explore a capa com o mouse ou o toque.','Explore the cover with your pointer or touch.');
  const action=document.querySelector('#project-dialog-action');action.replaceChildren();
  const href=projectHref(entry);
  if(entry.status==='live' && entry.sketch && sketchModules['./sketches/'+entry.sketch+'.js']){
    const button=document.createElement('button');button.type='button';button.className='outline-button';button.textContent=t('Abrir '+entry.title+' aqui','Open '+entry.title+' here');
    on(button,'click',()=>startSketch(entry,button));action.append(button);
  }else if(href && entry.slug!=='life-threads') {
    const link=document.createElement('a');link.href=href;if(entry.slug==='lissajous'){const url=new URL(href);url.searchParams.set('lang',language);link.href=url.href;}link.target='_blank';link.rel='noopener noreferrer';link.className='outline-button';link.textContent=t('Abrir projeto completo ↗','Open full project ↗');action.append(link);
  }else{
    const note=document.createElement('p');note.textContent=entry.slug==='life-threads'?t('Pesquisa pausada.','Research on hold.'):t('Capa animada. Experimento completo em integração.','Animated cover. Full experiment awaiting integration.');action.append(note);
  }
  if(!dialog.open)dialog.showModal();dialog.scrollTop=0;
  dialogField=engine.mount(dialogArt,entry.scene);
}
async function startSketch(entry,button){
  cleanupStage();const token=loadToken;button.disabled=true;button.textContent=t('Abrindo instrumento…','Opening instrument…');
  try{
    const module=await sketchModules['./sketches/'+entry.sketch+'.js']();
    if(token!==loadToken||!dialog.open)return;
    dialogArt.classList.add(entry.sketch==='lissajous'?'lissajous-mounted':entry.sketch==='chromascope'?'chromascope-mounted':'music-mounted');
    const stage=document.createElement('div');stage.className='inline-stage';dialogArt.append(stage);
    const mounted=module.default?module.default(stage,{language}):module.mount(stage,{language});
    const cleanup=mounted instanceof Promise?await mounted:mounted;
    if(token!==loadToken||!dialog.open){cleanup?.();return;}
    cleanupSketch=typeof cleanup==='function'?cleanup:module.cleanup;
    document.querySelector('#project-dialog-hint').textContent=entry.sketch==='chromascope'?t('Arraste a lente para girar. Compor permite editar as peças.','Drag the lens to rotate. Compose lets you edit the pieces.'):entry.sketch==='lissajous'?t('Arraste para mudar a fase. Ajustar abre os controles.','Drag to shift phase. Settings opens the controls.'):t('Explore o instrumento e seus controles dentro do quadro.','Explore the instrument and its controls inside the frame.');
    button.textContent=t('Instrumento aberto','Instrument open');
  }catch(error){
    if(token!==loadToken)return;
    dialogArt.classList.remove('music-mounted','lissajous-mounted','chromascope-mounted');button.disabled=false;button.textContent=t('Tentar abrir novamente','Try again');
    const p=document.createElement('p');p.textContent=t('O instrumento não pôde iniciar. Tente novamente.','The instrument could not start. Please try again.');dialogArt.replaceChildren(p);console.error(error);
  }
}
on(document.querySelector('[data-close-project]'),'click',()=>dialog.close());
on(dialog,'close',cleanupStage);
const cleanupNavigation=mountProjectNavigation({dialog,previous:document.querySelector('#previous-project'),next:document.querySelector('#next-project'),count:collection.length,index:()=>dialogIndex,open:index=>openProject(collection[index].slug)});
on(document.querySelector('#reset-field'),'click',()=>chooseScene(currentScene));

function updatePauseButton(){
  const button=document.querySelector('#motion-toggle');button.setAttribute('aria-pressed',String(engine.paused));
  button.innerHTML=engine.paused?'<span aria-hidden="true">▷</span>':'<span aria-hidden="true">Ⅱ</span>';
  button.setAttribute('aria-label',engine.paused?t('Retomar animações e alternância de cenas','Resume animation and scene cycling'):t('Pausar todas as animações e a alternância de cenas','Pause all animation and scene cycling'));
}
on(document.querySelector('#motion-toggle'),'click',()=>{engine.pause(!engine.paused);updatePauseButton();});
const onReducedMotion=()=>{engine.pause(motionQuery.matches);updatePauseButton();};motionQuery.addEventListener('change',onReducedMotion);
on(hero,'pointermove',()=>{interactionAt=performance.now();});on(hero,'pointerdown',()=>{interactionAt=performance.now();});
const heroObserver=new IntersectionObserver(([entry])=>{heroVisible=entry.isIntersecting;},{threshold:.05});heroObserver.observe(hero);
let last=-1;try{const raw=sessionStorage.getItem('stargaze.last-hero-scene');if(raw!==null)last=Number(raw);}catch{/* optional */}
chooseScene(nextSceneIndex(last,scenes.length));updatePauseButton();
const cycle=setInterval(()=>{
  const now=performance.now(),delta=Math.min(now-lastCycle,350);lastCycle=now;
  if(engine.paused||selectedSlug||!heroVisible||document.hidden||document.querySelector('dialog[open]')||now-interactionAt<2500||hero.contains(document.activeElement))return;
  cycleElapsed+=delta;document.querySelector('#scene-progress').style.transform=`scaleX(${Math.min(1,cycleElapsed/18000)})`;
  if(cycleElapsed>=18000)chooseScene((currentScene+1)%scenes.length);
},160);
let cleanupNotes=mountNotes(notes);
function updateLanguage(){
  document.querySelectorAll('[data-card]').forEach(card=>{const entry=bySlug.get(card.dataset.card),en=projectEnglish[entry.slug];card.querySelector('.card-category').textContent=t(entry.category,en[0]);card.querySelector('.card-summary').textContent=t(entry.summary,en[1]);const state=card.querySelector('.card-state');if(state)state.textContent=t(entry.state,en[2]);card.querySelector('.card-tune').ariaLabel=t(`Abrir ${entry.title}`,`Open ${entry.title}`);});
  document.querySelectorAll('[data-scene-index]').forEach(b=>{const i=Number(b.dataset.sceneIndex)+1;b.ariaLabel=t(`Cena ${i} de ${scenes.length}`,`Scene ${i} of ${scenes.length}`);});
  updatePauseButton();if(!selectedSlug)document.querySelector('#focus-message').textContent=t('Um mesmo lugar. Diferentes formas de olhar.','One place. Different ways of seeing.');
  else document.querySelector('#focus-message').textContent=t(`Campo sintonizado: ${bySlug.get(selectedSlug).title}.`,`Field tuned to ${bySlug.get(selectedSlug).title}.`);
  cleanupNotes();document.querySelector('#notes-list').replaceChildren();cleanupNotes=mountNotes(notes);
  if(dialog.open)openProject(collection[dialogIndex].slug);
}
const cleanupLanguage=mountLanguage(updateLanguage);updateLanguage();const cleanupCursor=mountCursor();
// Native page lifecycle releases all canvases, audio and local editor listeners.
on(window,'pagehide',event=>{
  if(event.persisted)return;
  clearInterval(cycle);clearTimeout(transitionTimer);clearTimeout(transitionClassTimer);heroObserver.disconnect();
  cleanupNavigation();cleanupStage();cleanupNotes();cleanupLanguage();cleanupCursor();fieldMounts.forEach(f=>f.destroy());heroField?.destroy();engine.destroy();
  motionQuery.removeEventListener('change',onReducedMotion);abort.abort();
});
