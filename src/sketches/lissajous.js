import React from 'react';
import {createRoot} from 'react-dom/client';
import {LissajousInstrument} from '../instruments/lissajous/instrument';
import {setInstrumentLanguage} from '../instruments/lissajous/language';
import styles from '../instruments/lissajous/inline.css?inline';

export default function mount(container,{language='pt'}={}){
  setInstrumentLanguage(language);
  const host=document.createElement('div');host.className='lissajous-inline';host.tabIndex=-1;
  host.setAttribute('aria-label',language==='pt'?'Instrumento Lissajous':'Lissajous instrument');
  const shadow=host.attachShadow({mode:'open'});
  const sheet=document.createElement('style');sheet.textContent=styles;
  const surface=document.createElement('div');surface.style.cssText='width:100%;height:100%';shadow.append(sheet,surface);container.append(host);
  const root=createRoot(surface);root.render(React.createElement(LissajousInstrument,{embedded:true}));
  host.focus({preventScroll:true});
  let disposed=false;
  return()=>{if(disposed)return;disposed=true;root.unmount();host.remove();};
}
