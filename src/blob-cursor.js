import {t} from './site-language.js';
export function mountCursor(){
  const query=matchMedia('(hover:hover) and (pointer:fine)');
  const el=document.createElement('div');el.className='blob-cursor';el.setAttribute('aria-hidden','true');el.innerHTML='<i></i><span></span>';document.body.append(el);
  const abort=new AbortController(),label=el.querySelector('span'),dialogs=[...document.querySelectorAll('dialog')];let visible=false,lastHint='';
  function hide(){visible=false;el.hidden=true;document.documentElement.classList.remove('blob-active');}
  document.addEventListener('pointermove',event=>{
    if(!query.matches||event.pointerType!=='mouse'||event.target.closest('input,textarea,select,iframe,.music-mounted')){hide();return;}
    const modal=dialogs.find(d=>d.open),parent=modal||document.body;let x=event.clientX,y=event.clientY,right=innerWidth;
    if(modal){const rect=modal.getBoundingClientRect();x-=rect.left+modal.clientLeft;y-=rect.top+modal.clientTop;x+=modal.scrollLeft;y+=modal.scrollTop;right=rect.right;}
    if(el.parentElement!==parent){parent.append(el);el.classList.toggle('in-dialog',!!modal);}
    // Direct pointer coordinates, with no easing loop or trailing frames.
    el.style.transform=`translate3d(${x}px,${y}px,0)`;
    if(!visible){visible=true;el.hidden=false;document.documentElement.classList.add('blob-active');}
    el.classList.toggle('flip-hint',event.clientX>right-110);
    const hit=event.target.closest('button,a,summary,[data-cursor]');
    const hint=hit?.dataset.cursor==='read'?t('leia +','read +'):hit?.dataset.cursor==='drag'?t('arraste','drag'):hit?.dataset.cursor==='rotate'?t('gire','rotate'):hit?t('clique','click'):'';
    if(hint!==lastHint){lastHint=hint;label.textContent=hint;el.classList.toggle('has-hint',!!hint);}
  },{signal:abort.signal,passive:true});
  document.addEventListener('pointerdown',()=>el.classList.add('pressed'),{signal:abort.signal});document.addEventListener('pointerup',()=>el.classList.remove('pressed'),{signal:abort.signal});
  document.addEventListener('pointerleave',hide,{signal:abort.signal});window.addEventListener('blur',hide,{signal:abort.signal});document.addEventListener('keydown',hide,{signal:abort.signal});document.addEventListener('close',hide,{signal:abort.signal,capture:true});
  const changed=()=>hide();query.addEventListener('change',changed);hide();
  return()=>{hide();abort.abort();query.removeEventListener('change',changed);el.remove();};
}
