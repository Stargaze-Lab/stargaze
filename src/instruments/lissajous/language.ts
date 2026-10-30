import {chooseLanguage} from '../../site-language.js';
const requested=new URLSearchParams(location.search).get('lang');
let saved;try{saved=localStorage.getItem('stargaze.language');}catch{}
export let language=chooseLanguage({saved:['pt','en'].includes(requested||'')?requested:saved,browser:navigator.language});
export function setInstrumentLanguage(value:string){language=value==='en'?'en':'pt';}
export const tr=(pt:string,en:string)=>language==='pt'?pt:en;
