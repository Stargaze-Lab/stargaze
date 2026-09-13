import {escapeHTML,noteMarkup,NOTE_FORMATS} from './note-format.js';
import {t,language} from './site-language.js';

// Public reading only. Authoring lives in tools/editor and is never bundled.
export function mountNotes(notes) {
  const abort=new AbortController(),list=document.querySelector('#notes-list');
  const dialog=document.querySelector('#note-dialog'),reader=document.querySelector('#note-reader');
  for(const note of notes.filter(note=>note.status==='published')) {
    const button=document.createElement('button');button.type='button';button.className='note-card';button.dataset.cursor='read';button.setAttribute('aria-haspopup','dialog');
    button.innerHTML=`<span class="eyebrow">${t(NOTE_FORMATS[note.format],{processo:'Process note',ensaio:'Article / essay',referencias:'Drawings and references'}[note.format])}</span><h3>${escapeHTML(note.title)}</h3><p>${escapeHTML(note.summary)}</p><span class="note-byline">${escapeHTML(note.author)} · ${escapeHTML(note.date)}</span>`;
    button.addEventListener('click',()=>{reader.innerHTML=noteMarkup(note,{locale:language,mediaBase:new URL(`notes/${note.slug}/media/`,new URL(document.documentElement.dataset.siteRoot||'./',location.href)).href});dialog.showModal();dialog.scrollTop=0;},{signal:abort.signal});list.append(button);
  }
  document.querySelector('#notes-empty').hidden=list.children.length>0;
  document.querySelector('[data-close-note]').addEventListener('click',()=>dialog.close(),{signal:abort.signal});
  dialog.addEventListener('close',()=>{reader.querySelectorAll('video').forEach(video=>video.pause());},{signal:abort.signal});
  return()=>abort.abort();
}
