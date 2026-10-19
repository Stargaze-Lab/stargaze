import { DE } from './de.js';

// Bilingual editorial layer. The English text is kept in the document as the
// canonical source. Translations are applied to text nodes, not by replacing
// HTML blocks, so all D3 / Three / LAB event listeners and user state survive.
const languageButtons = [...document.querySelectorAll('.language-switch [data-lang]')];
const originalText = new WeakMap();
const originalAttributes = new WeakMap();
const attributeNames = ['aria-label', 'title', 'placeholder', 'alt'];
let lang = new URLSearchParams(location.search).get('lang') === 'de' ? 'de' : 'en';

function translate(english) {
  const raw = english.trim();
  if (!raw) return english;
  let de = DE[raw];
  if (!de) {
    // Dynamic SVG labels and sentence compounds are composed from known phrases.
    if (raw.startsWith('Go to ')) de = `Zu ${translate(raw.slice(6))}`;
    else if (raw.includes(' / ')) {
      const halves = raw.split(' / ');
      if (halves.some(v => DE[v.trim()])) de = halves.map(v => translate(v)).join(' / ');
    }
    if (!de && /^([A-Z0-9\/ «»“”+ -]+)\. (.+)$/.test(raw)) {
      const m=raw.match(/^([A-Z0-9\/ «»“”+ -]+)\. (.+)$/);
      if (DE[m[1]] && DE[m[2]]) de=`${translate(m[1])}. ${translate(m[2])}`;
    }
    if (!de && /^RESPONSIBILITY LENS\s*\/\s*/.test(raw))
      de = raw.replace('RESPONSIBILITY LENS', DE['RESPONSIBILITY LENS'] || 'VERANTWORTUNGSPERSPEKTIVE').replace(/\/ ([A-Z +]+)/, (_,part)=>`/ ${translate(part)}`);
    if (!de && /^DEMAND\s+[-+]?\d+%/.test(raw))
      de = raw.replace(/^DEMAND/, 'NACHFRAGE').replace('NO SPATIAL ALLOCATION', DE['NO SPATIAL ALLOCATION']);
    if (!de && /^Δ .*ha \/ modeled shift$/.test(raw))
      de = raw.replace('modeled shift','modellierte Verschiebung');
    if (!de && /^(Current|Modeled S3) (arable land|grassland):/.test(raw))
      de = raw.replace('Current','Aktuell').replace('Modeled S3','Modelliert S3').replace('arable land','Ackerland').replace('grassland','Grünland').replace('hectares','Hektaren');
  }
  if (!de || de === raw) return english;
  const left = english.match(/^\s*/u)?.[0] || '';
  const right = english.match(/\s*$/u)?.[0] || '';
  return left + de + right;
}
function applyText(node) {
  if (!node || node.nodeType !== Node.TEXT_NODE || node.parentElement?.closest('script,style,.language-switch')) return;
  let state = originalText.get(node);
  if (!state) {state = {en:node.data,last:node.data}; originalText.set(node,state);}
  else if (node.data !== state.last) state.en = node.data; // interaction generated new English
  const next = lang === 'de' ? translate(state.en) : state.en;
  state.last = next;
  if (node.data !== next) node.data = next;
}
function applyAttributes(el) {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return;
  if (el.closest('.language-switch')) return;
  let stored=originalAttributes.get(el);
  if (!stored) {stored={};originalAttributes.set(el,stored);}
  for(const key of attributeNames) {
    if(!el.hasAttribute(key)) continue;
    const now=el.getAttribute(key);
    let state=stored[key];
    if(!state) {state={en:now,last:now};stored[key]=state;}
    else if(now!==state.last) state.en=now;
    const next=lang==='de'?translate(state.en):state.en;
    state.last=next;
    if(now!==next) el.setAttribute(key,next);
  }
}
function scan(root) {
  if (!root) return;
  if(root.nodeType===Node.TEXT_NODE) {applyText(root);return;}
  if(root.nodeType!==Node.ELEMENT_NODE && root.nodeType!==Node.DOCUMENT_NODE) return;
  if(root.nodeType===Node.ELEMENT_NODE) applyAttributes(root);
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
  let current;
  while((current=walker.nextNode())) {
    if(current.nodeType===Node.TEXT_NODE)applyText(current);
    else applyAttributes(current);
  }
}
function setLanguage(next,updateUrl=true) {
  lang = next==='de'?'de':'en';
  document.documentElement.lang=lang==='de'?'de-CH':'en';
  document.title=lang==='de'?'Das Etikett ist nicht die Herkunft | Stargaze':'The Label Is Not the Origin | Stargaze';
  const description=document.querySelector('meta[name="description"]');
  if(description)description.content=lang==='de'
    ? 'Schweizer Lebensmittel vom Feld bis ins Regal: eine interaktive Untersuchung von Herkunft, Handel und begrenztem Land.'
    : 'Following Swiss food from field to shelf, and finding where "made here" stops. A Stargaze open-data investigation.';
  languageButtons.forEach(button=>{
    const selected=button.dataset.lang===lang;
    button.classList.toggle('is-active',selected);
    button.setAttribute('aria-pressed',String(selected));
  });
  scan(document.body);
  if(updateUrl) {
    const url=new URL(location.href);
    if(lang==='de')url.searchParams.set('lang','de');
    else url.searchParams.delete('lang');
    history.replaceState(history.state,'',url.pathname+url.search+url.hash);
  }
  document.dispatchEvent(new CustomEvent('swiss-language-change',{detail:{language:lang}}));
}
languageButtons.forEach(button=>button.addEventListener('click',()=>setLanguage(button.dataset.lang)));

// Capture new D3 chart labels, source cards and tooltips without rerendering the site.
const observer=new MutationObserver(records=>{
  for(const record of records){
    if(record.type==='characterData')applyText(record.target);
    else if(record.type==='childList'){
      record.addedNodes.forEach(scan);
    }
  }
});
observer.observe(document.body,{subtree:true,childList:true,characterData:true});
setLanguage(lang,false);

export { setLanguage, translate };
