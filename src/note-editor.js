import {escapeHTML,validateNote,noteMarkup,NOTE_FORMATS} from './note-format.js';

const STORAGE_KEY='stargaze.field-notes.drafts.v1';
const formKeys=['title','author','date','format','summary','body'];
const uid=()=>globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const localDate=()=>{const date=new Date();return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;};
const slugify=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100).replace(/-$/,'');

export function mountNotes(publishedNotes) {
  const editor=document.querySelector('#editor-dialog'), form=document.querySelector('#note-form');
  const reader=document.querySelector('#note-dialog'), readerBody=document.querySelector('#note-reader');
  const status=document.querySelector('#draft-status'), draftList=document.querySelector('#draft-list');
  const attachmentList=document.querySelector('#note-attachments');
  let drafts=[],active=null,saveTimer=0,storageFailed=false,storageReadBlocked=false,initialWarning='',closed=false;
  const imageURLs=new Set(),downloadTimers=new Set();
  const abort=new AbortController();
  const on=(el,event,fn)=>el.addEventListener(event,fn,{signal:abort.signal});

  try {
    const data=localStorage.getItem(STORAGE_KEY);
    if(data) {
      const parsed=JSON.parse(data);
      if(Array.isArray(parsed)) {
        drafts=parsed.filter(d=>d && typeof d.id==='string' && !validateNote(d,{draft:true}).length);
        if(drafts.length!==parsed.length){storageReadBlocked=true;storageFailed=true;initialWarning='Há dados locais que não puderam ser lidos. Eles foram preservados; baixe os novos rascunhos em vez de depender do salvamento local.';}
      } else {storageReadBlocked=true;storageFailed=true;initialWarning='O armazenamento local não tem uma lista válida. Os dados foram preservados. Importe uma cópia exportada para recuperar o texto.';}
    }
  } catch { initialWarning='O armazenamento local está indisponível. Exporte o rascunho antes de fechar.';storageFailed=true;storageReadBlocked=true; }

  function message(text,error=false){status.textContent=text;status.classList.toggle('is-error',error);}
  function collect() {
    if(!active) return;
    for(const key of formKeys) active[key]=form.elements.namedItem(key).value;
    active.updatedAt=new Date().toISOString();
    active.slug=`${slugify(active.title)||'nota'}-${active.id.replace(/[^a-z0-9]/g,'').slice(-8)}`;
  }
  function persist() {
    clearTimeout(saveTimer); collect();
    try {
      if(storageReadBlocked)throw new Error('Preserving unreadable storage');
      localStorage.setItem(STORAGE_KEY,JSON.stringify(drafts));storageFailed=false;
      message('Rascunho salvo neste navegador. Ainda não publicado.');
    } catch {storageFailed=true;message('Não foi possível salvar neste navegador. O texto permanece aberto: baixe uma cópia agora.',true);}
  }
  function scheduleSave(){collect();document.querySelector('#publication-result').hidden=true;message('Alterações ainda não salvas…');clearTimeout(saveTimer);saveTimer=setTimeout(persist,550);}
  function drawDraftList(){
    draftList.replaceChildren();
    drafts.slice().reverse().forEach(d=>{
      const button=document.createElement('button');button.type='button';button.textContent=d.title||'Nota sem título';button.setAttribute('aria-pressed',String(d===active));
      button.addEventListener('click',()=>{persist();selectDraft(d);});draftList.append(button);
    });
  }
  function drawAttachments(){
    attachmentList.innerHTML=(active?.images||[]).map((img,i)=>`<div class="attachment-row"><img src="${escapeHTML(img.data)}" alt="" /><div class="attachment-fields"><label>Descrição alternativa<input data-image-alt="${i}" value="${escapeHTML(img.alt)}" maxlength="500" placeholder="O que a imagem mostra?" /></label><label>Legenda / crédito<input data-image-caption="${i}" value="${escapeHTML(img.caption)}" maxlength="1000" /></label></div><button type="button" data-remove-image="${i}">Remover imagem</button></div>`).join('');
  }
  function selectDraft(d){
    active=d;for(const key of formKeys) form.elements.namedItem(key).value=d[key];
    drawDraftList();drawAttachments();document.querySelector('#publication-result').hidden=true;
    message(storageFailed?'Exporte uma cópia: salvamento local indisponível.':'Rascunho local · nenhuma publicação online.',storageFailed);
  }
  function newDraft(){
    if(active)persist();
    const id=uid(),d={id,schemaVersion:1,slug:`nota-${id.replace(/[^a-z0-9]/g,'').slice(-8)}`,title:'',author:'',date:localDate(),format:'processo',summary:'',body:'',status:'draft',images:[]};
    drafts.push(d);selectDraft(d);persist();form.elements.namedItem('title').focus();
  }
  function showNote(note,preview=false){readerBody.innerHTML=noteMarkup(note,{preview});reader.showModal();reader.scrollTop=0;}

  const list=document.querySelector('#notes-list');
  publishedNotes.forEach(note=>{
    const button=document.createElement('button');button.className='note-card';button.type='button';
    button.innerHTML=`${note.images[0]?`<img src="${escapeHTML(note.images[0].data)}" alt="${escapeHTML(note.images[0].alt)}" loading="lazy" />`:''}<span class="eyebrow">${NOTE_FORMATS[note.format]}</span><h3>${escapeHTML(note.title)}</h3>${note.summary?`<p>${escapeHTML(note.summary)}</p>`:''}<span class="note-byline">${escapeHTML(note.author)} · ${escapeHTML(note.date)}</span>`;
    on(button,'click',()=>showNote(note));list.append(button);
  });
  document.querySelector('#notes-empty').hidden=publishedNotes.length>0;
  on(document.querySelector('#open-editor'),'click',()=>{
    editor.showModal();if(!active){if(drafts.length)selectDraft(drafts.at(-1));else newDraft();}
    if(initialWarning){message(initialWarning,true);initialWarning='';}
  });
  on(document.querySelector('#close-editor'),'click',()=>editor.close());
  on(editor,'close',()=>{persist();drawDraftList();});
  on(document.querySelector('[data-close-note]'),'click',()=>reader.close());
  on(document.querySelector('#new-note'),'click',newDraft);
  on(form,'input',event=>{
    if(event.target.dataset.imageAlt!==undefined)active.images[Number(event.target.dataset.imageAlt)].alt=event.target.value;
    if(event.target.dataset.imageCaption!==undefined)active.images[Number(event.target.dataset.imageCaption)].caption=event.target.value;
    scheduleSave();
  });
  on(form.elements.namedItem('title'),'change',drawDraftList);
  on(attachmentList,'click',event=>{
    const button=event.target.closest('[data-remove-image]');if(!button)return;
    active.images.splice(Number(button.dataset.removeImage),1);drawAttachments();scheduleSave();
  });
  on(document.querySelector('#preview-note'),'click',()=>{collect();showNote(active,true);});

  function download(note,statusValue){
    const {schemaVersion,slug,title,author,date,format,summary,body,images}=note;
    const payload={schemaVersion,slug,title,author,date,format,summary,body,status:statusValue,images};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'});
    const url=URL.createObjectURL(blob);imageURLs.add(url);
    const link=document.createElement('a');link.href=url;link.download=`${slug}.json`;document.body.append(link);link.click();link.remove();
    const timer=setTimeout(()=>{URL.revokeObjectURL(url);imageURLs.delete(url);downloadTimers.delete(timer);},30000);downloadTimers.add(timer);
  }
  on(document.querySelector('#export-draft'),'click',()=>{persist();download(active,'draft');message('Cópia do rascunho preparada para download. Guarde esse arquivo.');});
  on(form,'submit',event=>{
    event.preventDefault();collect();const errors=validateNote({...active,status:'ready'});
    if(errors.length){message(errors.join(' '),true);return;}
    persist();download(active,'ready');document.querySelector('#publication-result').hidden=false;
    message('Arquivo de publicação preparado, com o seu texto intacto. Não publicado online.');
  });
  on(document.querySelector('#import-note'),'change',async event=>{
    const file=event.target.files?.[0];event.target.value='';if(!file)return;
    if(file.size>8500000){message('Arquivo maior que 8,5 MB. Importe uma nota exportada pelo caderno.',true);return;}
    try {
      const note=JSON.parse(await file.text());const errors=validateNote(note,{draft:note.status==='draft'});
      if(errors.length)throw new Error(errors.join(' '));
      if(closed)return;
      persist();
      const d={schemaVersion:1,id:uid(),slug:note.slug,title:note.title,author:note.author,date:note.date,format:note.format,summary:note.summary,body:note.body,status:'draft',images:note.images.map(({data,alt,caption})=>({data,alt,caption}))};
      drafts.push(d);selectDraft(d);persist();message(storageFailed?'Nota importada, mas não salva neste navegador. Baixe uma cópia.':'Nota importada como novo rascunho. Nenhum texto existente foi substituído.',storageFailed);
    }catch(error){message(`Não foi possível importar. ${error.message}`,true);}
  });
  on(document.querySelector('#note-images'),'change',async event=>{
    const files=[...event.target.files];event.target.value='';const target=active;
    const warnings=[];
    for(const file of files){
      if(target.images.length>=4){warnings.push('Limite de quatro imagens atingido.');break;}
      if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>1500000){warnings.push(`${file.name}: use PNG, JPEG ou WebP de até 1,5 MB.`);continue;}
      try{
        const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('Falha na leitura'));r.readAsDataURL(file);});
        if(closed)return;
        target.images.push({data,alt:'',caption:''});
      }catch{warnings.push(`Não foi possível ler ${file.name}.`);}
    }
    if(target===active)drawAttachments();persist();
    if(warnings.length)message(warnings.join(' '),true);
  });
  const flushOnHide=()=>{if(document.hidden&&active)persist();};
  on(document,'visibilitychange',flushOnHide);
  const unload=event=>{if(active){persist();if(storageFailed){event.preventDefault();event.returnValue='';}}};
  on(window,'beforeunload',unload);
  return ()=>{closed=true;if(active)persist();clearTimeout(saveTimer);abort.abort();for(const timer of downloadTimers)clearTimeout(timer);for(const url of imageURLs)URL.revokeObjectURL(url);};
}
