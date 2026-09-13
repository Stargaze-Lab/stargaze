import {escapeHTML} from '/note-format.js';
const $=s=>document.querySelector(s),form=$('#form'),keys=['title','author','date','format','slug','summary','body'];
let notes=[],active,saveTimer,previewTimer,queue=Promise.resolve(),dirty=false,revision=0,previewRevision=0,busy=false;
const message=(text,error=false)=>{$('#status').textContent=text;$('#status').style.color=error?'#e7bd6d':'';};
async function api(path,value,{binary=false,raw=false}={}){
  const response=await fetch(`/api/${path}`,{method:value===undefined?'GET':'POST',headers:{'X-Stargaze-Editor':'1',...(value===undefined?{}:{'Content-Type':raw?'application/octet-stream':'application/json'})},body:value===undefined?undefined:raw?value:JSON.stringify(value)});
  if(!response.ok){let data;try{data=await response.json();}catch{}throw new Error(data?.error||'Não foi possível completar a ação.');}
  return binary?response.blob():path==='preview'?response.text():response.json();
}
function collect(){if(!active)return;for(const key of keys)active[key]=form.elements.namedItem(key).value;}
function list(){
  $('#drafts').replaceChildren();for(const note of notes){const button=document.createElement('button');button.textContent=note.title||'Nota sem título';button.setAttribute('aria-current',String(note.id===active?.id));button.addEventListener('click',()=>run(async()=>{await save();select(note);}));$('#drafts').append(button);}
}
function select(note){active=note;for(const key of keys)form.elements.namedItem(key).value=note[key];dirty=false;revision++;list();attachments();preview();}
function save(){
  clearTimeout(saveTimer);collect();if(!active)return queue;
  const snapshot=structuredClone(active),version=revision;
  queue=queue.catch(()=>{}).then(async()=>{const saved=await api('save',snapshot);Object.assign(snapshot,{updatedAt:saved.updatedAt});if(active.id===snapshot.id&&revision===version){dirty=false;message('Salvo neste computador.');}return saved;});return queue;
}
function changed(){collect();dirty=true;revision++;message('Alterações ainda não salvas…');clearTimeout(saveTimer);saveTimer=setTimeout(()=>save().catch(error=>message(`Não foi salvo: ${error.message}`,true)),650);clearTimeout(previewTimer);previewTimer=setTimeout(preview,1000);}
async function preview(){
  if(!active)return;collect();const token=++previewRevision;
  try{const html=await api('preview',active);if(token===previewRevision)$('#preview').srcdoc=html;}catch(error){message(error.message,true);}
}
async function run(action){
  if(busy)return;busy=true;const controls=[...document.querySelectorAll('button,input,textarea,select')];controls.forEach(c=>c.disabled=true);
  try{await action();}catch(error){message(error.message,true);}finally{busy=false;controls.forEach(c=>c.disabled=false);}
}
function newNote(){
  const id=crypto.randomUUID().replaceAll('-','').slice(0,24),date=new Date();
  const note={id,schemaVersion:2,slug:`nota-${id.slice(0,8)}`,title:'',author:active?.author||'',date:`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`,format:'processo',summary:'',body:'',status:'draft',media:[],images:[]};
  notes.unshift(note);select(note);dirty=true;revision++;return save();
}
function insert(text){const field=form.elements.namedItem('body');field.setRangeText(text,field.selectionStart,field.selectionEnd,'end');field.focus();changed();}
function attachments(){
  $('#attachments').innerHTML=active.media.map(m=>`<div class="attachment" data-id="${m.id}">${m.kind==='video'?`<video src="/media/${m.file}" controls playsinline preload="metadata"></video>`:`<img src="/media/${m.file}" alt="">`}<label>Descrição ${m.kind==='video'?'do vídeo':'alternativa'}<input data-meta="alt" value="${escapeHTML(m.alt)}" maxlength="500"></label><label>Legenda / crédito<textarea data-meta="caption" rows="2" maxlength="1000">${escapeHTML(m.caption)}</textarea></label><footer><button type="button" data-action="insert">Inserir no texto</button><button type="button" data-action="remove">Retirar da nota</button></footer></div>`).join('');
}
async function upload(files){
  await save();for(const file of files){
    if(active.media.length>=20)throw new Error('Limite de 20 mídias por nota.');
    if(file.size>50*1024*1024)throw new Error(`${file.name}: limite de 50 MB.`);
    message(`Adicionando ${file.name}…`);const media=await api('media',file,{raw:true});active.media.push(media);dirty=true;revision++;await save();
  }
  attachments();preview();message('Mídias salvas. Descreva-as e escolha onde entram no texto.');
}
form.addEventListener('submit',event=>event.preventDefault());
form.addEventListener('input',event=>{
  if(event.target.dataset.meta){const id=event.target.closest('[data-id]').dataset.id;active.media.find(m=>m.id===id)[event.target.dataset.meta]=event.target.value;}
  changed();
});
form.elements.namedItem('title').addEventListener('change',list);
$('.toolbar').addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;const field=form.elements.namedItem('body'),selected=field.value.slice(field.selectionStart,field.selectionEnd);
  insert(button.dataset.wrap?`${button.dataset.wrap}${selected||'texto'}${button.dataset.wrap}`:`\n${button.dataset.prefix}${selected||'texto'}\n`);
});
$('#attachments').addEventListener('click',event=>{
  const button=event.target.closest('[data-action]');if(!button)return;const id=button.closest('[data-id]').dataset.id;
  if(button.dataset.action==='insert')insert(`\n\n{{media:${id}}}\n\n`);
  else {collect();active.media=active.media.filter(m=>m.id!==id);form.elements.namedItem('body').value=active.body.replaceAll(`{{media:${id}}}`,'');attachments();changed();}
});
$('#new').addEventListener('click',()=>run(async()=>{await save();await newNote();}));
$('#save').addEventListener('click',()=>run(save));
$('#refresh').addEventListener('click',preview);
$('#upload').addEventListener('change',event=>{const files=[...event.target.files];event.target.value='';run(()=>upload(files));});
document.addEventListener('dragover',event=>{if(event.dataTransfer.types.includes('Files')){event.preventDefault();document.body.classList.add('dragging');}});
document.addEventListener('dragleave',event=>{if(!event.relatedTarget)document.body.classList.remove('dragging');});
document.addEventListener('drop',event=>{if(!event.dataTransfer.files.length)return;event.preventDefault();document.body.classList.remove('dragging');run(()=>upload([...event.dataTransfer.files]));});
$('#import').addEventListener('change',event=>{
  const file=event.target.files[0];event.target.value='';if(!file)return;
  run(async()=>{await save();if(file.size>9*1024*1024)throw new Error('JSON acima de 9 MB.');const note=await api('import',JSON.parse(await file.text()));notes.unshift(note);select(note);message('Nota importada como novo rascunho.');});
});
$('#export').addEventListener('click',()=>run(async()=>{
  await save();message('Preparando página e mídias…');const blob=await api('export',{id:active.id},{binary:true}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`${active.slug}.zip`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);$('#result').showModal();message('ZIP preparado. Nenhuma publicação online.');
}));
$('#close-result').addEventListener('click',()=>$('#result').close());
window.addEventListener('beforeunload',event=>{if(dirty||busy){event.preventDefault();event.returnValue='';}});
await run(async()=>{notes=await api('drafts');if(notes.length){select(notes[0]);message('Rascunhos recuperados deste computador.');}else await newNote();});
