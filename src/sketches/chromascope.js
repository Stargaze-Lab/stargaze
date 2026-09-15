import React from 'react';
import {createRoot} from 'react-dom/client';
import Chromascope from '../instruments/chromascope/instrument';
import fontUrl from '../instruments/chromascope/fonts/dm-mono-regular.woff?url';
import styles from '../instruments/chromascope/inline.css?inline';

export default function mount(container,{language='pt'}={}){
  // Font faces must be registered on the document for reliable Shadow DOM support.
  if(!document.querySelector('style[data-chromascope-font]')){
    const font=document.createElement('style');font.dataset.chromascopeFont='';
    font.textContent=`@font-face{font-family:"DM Mono";src:url("${fontUrl}") format("woff");font-weight:400;font-style:normal;font-display:swap}`;
    document.head.append(font);
  }
  const host=document.createElement('div');host.className='chromascope-inline';host.tabIndex=-1;
  host.setAttribute('aria-label','Chromascope');
  const shadow=host.attachShadow({mode:'open'}),sheet=document.createElement('style'),surface=document.createElement('div');
  sheet.textContent=styles;shadow.append(sheet,surface);container.append(host);
  const root=createRoot(surface);root.render(React.createElement(Chromascope,{language}));host.focus({preventScroll:true});
  let disposed=false;return()=>{if(disposed)return;disposed=true;root.unmount();host.remove();};
}
