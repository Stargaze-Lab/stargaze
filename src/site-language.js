export function chooseLanguage({saved,country,browser='en'}={}){
  if(['pt','en'].includes(saved))return saved;
  if(/^[A-Z]{2}$/.test(country||''))return country==='BR'?'pt':'en';
  return browser.toLowerCase().startsWith('pt')?'pt':'en';
}
let saved;try{saved=localStorage.getItem('stargaze.language');}catch{}
export let language=chooseLanguage({saved,browser:globalThis.navigator?.language});
export const t=(pt,en)=>language==='pt'?pt:en;
const staticCopy={
  '.skip-link':'Skip to studies','.header-edition':'Independent laboratory <span aria-hidden="true">/</span> Brazil',
  '.site-header nav a[href="#universes"]':'Studies','.site-header nav a[href="#about"]':'About',
  '.hero-eyebrow>span:first-child':'Data. Stories. Possibilities.','.revision-label':'Equilibrium / study 02',
  '#hero-title':'New ways<br />to <em>see an idea.</em>',
  '.hero-footer p':'A space to explore new universes —<br class="desktop-break" /> through data, stories and creative code.',
  '.hero-footer .quiet-link':'Explore the studies <span aria-hidden="true">↓</span>',
  '#universes .section-id':'01 / EXHIBITION','#work-title':'Open universes.',
  '#universes .section-head>p':'Open a study.<br />Follow a new thread.',
  '#reset-field':'Return to the open field','#instruments .section-id':'02 / EXPERIMENTATION',
  '#instruments-title':'Ideas to play with.','#instruments .section-head>p':'Sound, rhythm and symmetry.<br />Studies at different stages.',
  '#notes-title':'What happens<br /><em>between projects.</em>',
  '.notes-intro p':'Processes, essays, drawings and references.<br />A space for personal writing.',
  '.notes-empty h3':'The first note<br /><em>is still to be written.</em>',
  '.notes-empty p':'Observations, discoveries and questions in progress.<br />New notes coming soon.',
  '.research .section-id':'ON THE SHELF','#research-title':'Research on hold',
  '#about-title':'One laboratory.<br /><em>Many questions.</em>',
  '.about-content p':'Stargaze grew from a desire to make projects that rarely find space in everyday design work. An independent practice of exploration, innovation and experimentation.',
  '.site-footer>span':'A field always in the making.','.archive-link':'View earlier studies',
  '#previous-project':'← Previous','#next-project':'Next →',
  '.dialog-caption':'Generative cover study.',
};
const originals=new Map();
export function applyLanguage(){
  document.documentElement.lang=language==='pt'?'pt-BR':'en';document.title=t('Stargaze — laboratório visual','Stargaze — visual laboratory');
  document.querySelector('meta[name="description"]').content=t('Stargaze. Um laboratório independente de dados, narrativas e experimentação visual.','Stargaze. An independent laboratory for data, stories and visual experimentation.');
  for(const [selector,en] of Object.entries(staticCopy))for(const el of document.querySelectorAll(selector)){if(!originals.has(el))originals.set(el,el.innerHTML);el.innerHTML=language==='en'?en:originals.get(el);}
  document.querySelectorAll('[data-language]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.language===language)));
  document.querySelector('[data-close-project]').ariaLabel=t('Fechar projeto','Close project');document.querySelector('[data-close-note]').ariaLabel=t('Fechar leitura','Close reading');
  document.querySelector('.site-header nav').ariaLabel=t('Navegação principal','Main navigation');
  document.querySelector('#scene-selectors').ariaLabel=t('Escolher cena do hero','Choose hero scene');
  document.querySelectorAll('.brand').forEach(el=>el.ariaLabel=t('Stargaze, início','Stargaze, home'));
}
export function mountLanguage(onChange){
  let manual=['pt','en'].includes(saved);const abort=new AbortController(),geoAbort=new AbortController();
  const change=value=>{language=value;applyLanguage();onChange();};
  document.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',()=>{manual=true;try{localStorage.setItem('stargaze.language',button.dataset.language);}catch{}change(button.dataset.language);},{signal:abort.signal}));
  applyLanguage();
  if(!manual){
    let cached;try{cached=sessionStorage.getItem('stargaze.country');}catch{}
    if(cached)change(chooseLanguage({country:cached,browser:navigator.language}));
    else {
      const timer=setTimeout(()=>geoAbort.abort(),2500);
      // GeoJS returns country from the requesting IP; no GPS, account or API key.
      fetch('https://get.geojs.io/v1/ip/country.json',{credentials:'omit',referrerPolicy:'no-referrer',signal:geoAbort.signal}).then(r=>r.ok?r.json():Promise.reject()).then(data=>{
        if(!/^[A-Z]{2}$/.test(data.country))return;
        try{sessionStorage.setItem('stargaze.country',data.country);}catch{}
        if(!manual)change(chooseLanguage({country:data.country}));
      }).catch(()=>{}).finally(()=>clearTimeout(timer));
    }
  }
  return()=>{abort.abort();geoAbort.abort();};
}
export const projectEnglish={
  'wikiverso':['Knowledge atlas','One idea leads to another. Small universes emerge from connections between subjects.',''],
  'colony-globe':['Data · territory · power','Six centuries of colonial rule, explored across space and time.',''],
  'celeste':['Personal celestial atlas','A place, a moment and a sky to explore.',''],
  'music-box':['Sound instrument','Musical pieces arranged in space. The cover previews the sequential pulse of the next version.','Experiment available'],
  'lissajous':['Frequency · phase · form','A pulse draws a 4:5 relationship: a tonic and a just major third.','Cover study · integration pending'],
  'chromascope':['Lens · symmetry · matter','Fragments transform into a field of reflections.','Cover study · integration pending'],
  'life-threads':['Interwoven biographies','Research on hold until a broader event dataset is available.','On hold'],
};
