// Keep arrow keys available to native inputs and instrument widgets.
export function mountProjectNavigation({dialog,previous,next,count,index,open}){
  const abort=new AbortController();
  const move=direction=>{if(dialog.open&&count>0)open(((index()+direction)%count+count)%count);};
  previous.addEventListener('click',()=>move(-1),{signal:abort.signal});
  next.addEventListener('click',()=>move(1),{signal:abort.signal});
  dialog.addEventListener('keydown',event=>{
    if(!dialog.open||event.defaultPrevented||event.isComposing||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
    if(!['ArrowLeft','ArrowRight'].includes(event.key))return;
    if(event.composedPath().some(el=>el?.isContentEditable||el?.matches?.('input,textarea,select,video,audio,[role="slider"],[role="spinbutton"],[role="combobox"],[role="listbox"],[role="tablist"],[role="menu"],[role="grid"],[data-project-keys="local"]')))return;
    event.preventDefault();move(event.key==='ArrowLeft'?-1:1);
  },{signal:abort.signal});
  return()=>abort.abort();
}
