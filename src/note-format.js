export const NOTE_FORMATS = {processo:'Registro de processo',ensaio:'Artigo / ensaio',referencias:'Desenhos e referências'};
export const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function validateNote(note, {draft = false} = {}) {
  const errors = [];
  if (!note || typeof note !== 'object' || Array.isArray(note)) return ['O arquivo não contém uma nota válida.'];
  if (![1,2].includes(note.schemaVersion)) errors.push('Versão de arquivo não reconhecida.');
  for (const [key,limit] of [['title',150],['author',100],['summary',500],['body',100000]]) {
    if (typeof note[key] !== 'string') errors.push(`Campo inválido: ${key}.`);
    else if(note[key].length > limit) errors.push(`O campo ${key} excede ${limit} caracteres.`);
    else if(!draft && key !== 'summary' && !note[key].trim()) errors.push(`Preencha ${key === 'title' ? 'o título' : key === 'author' ? 'a autoria' : 'o texto'}.`);
  }
  if (!Object.hasOwn(NOTE_FORMATS,note.format)) errors.push('Escolha um formato de nota.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(note.date || '') || !Number.isFinite(Date.parse(note.date)) || new Date(note.date).toISOString().slice(0,10) !== note.date) errors.push('Informe uma data válida.');
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(note.slug || '') || note.slug.length>180) errors.push('Identificador de nota inválido.');
  if(!['draft','ready','published'].includes(note.status)) errors.push('Status de nota inválido.');
  if(note.schemaVersion===2) {
    if(!Array.isArray(note.media)||note.media.length>20) errors.push('Use até 20 mídias.');
    else {
      const ids=new Set();
      for(const item of note.media){
        if(!item||!/^asset-[a-f0-9]{24}$/.test(item.id)||ids.has(item.id))errors.push('Identificador de mídia inválido ou repetido.');
        ids.add(item?.id);
        if(!item||!/^asset-[a-f0-9]{24}\.(png|jpg|webp|mp4|webm)$/.test(item.file||'')||item.file.split('.')[0]!==item.id||!['image','video'].includes(item.kind))errors.push('Arquivo de mídia inválido.');
        else if((item.kind==='image')!==/\.(png|jpg|webp)$/.test(item.file))errors.push('Tipo de mídia incompatível.');
        if(typeof item?.alt!=='string'||item.alt.length>500||(!draft&&!item.alt.trim()))errors.push('Descreva cada imagem ou vídeo.');
        if(typeof item?.caption!=='string'||item.caption.length>1000)errors.push('Legenda inválida.');
      }
      for(const token of (note.body||'').matchAll(/\{\{media:([^}]+)\}\}/g))if(!ids.has(token[1]))errors.push('O texto referencia uma mídia ausente.');
    }
  } else if(!Array.isArray(note.images) || note.images.length>4) errors.push('Use até quatro imagens.');
  else for(const image of note.images) {
    if(!image || typeof image.data !== 'string' || image.data.length > 2100000 || !/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(image.data)) errors.push('Imagem inválida ou maior que 1,5 MB.');
    if(typeof image?.alt !== 'string' || image.alt.length>500 || (!draft && !image.alt.trim())) errors.push('Adicione uma descrição alternativa para cada imagem.');
    if(typeof image?.caption !== 'string' || image.caption.length>1000) errors.push('Legenda de imagem inválida.');
  }
  return errors;
}

function safeURL(value) {
  try { const url = new URL(value); return ['http:','https:'].includes(url.protocol) && !url.username && !url.password ? url.href : null; }
  catch { return null; }
}
export function inlineMarkdown(source) {
  const tokens = /\[([^\]\n]+)\]\(([^\s)]+)\)|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*|`([^`\n]+)`/g;
  let result='', last=0;
  for(const match of source.matchAll(tokens)) {
    result+=escapeHTML(source.slice(last,match.index));
    if(match[1]) { const href=safeURL(match[2]); result+=href?`<a href="${escapeHTML(href)}" target="_blank" rel="noopener noreferrer">${escapeHTML(match[1])}</a>`:escapeHTML(match[0]); }
    else if(match[3]) result+=`<strong>${escapeHTML(match[3])}</strong>`;
    else if(match[4]) result+=`<em>${escapeHTML(match[4])}</em>`;
    else result+=`<code>${escapeHTML(match[5])}</code>`;
    last=match.index+match[0].length;
  }
  return result+escapeHTML(source.slice(last));
}
export function renderMarkdown(source) {
  const lines=source.replace(/\r\n/g,'\n').split('\n');
  let html='',paragraph=[], list=[];
  const flushParagraph=()=>{if(paragraph.length){html+=`<p>${paragraph.map(inlineMarkdown).join('<br />')}</p>`;paragraph=[];}};
  const flushList=()=>{if(list.length){html+=`<ul>${list.map(s=>`<li>${inlineMarkdown(s)}</li>`).join('')}</ul>`;list=[];}};
  for(const row of lines) {
    if(!row.trim()){flushParagraph();flushList();continue;}
    const heading=row.match(/^(#{1,3})\s+(.+)$/), item=row.match(/^[-*]\s+(.+)$/), quote=row.match(/^>\s?(.*)$/);
    if(heading){flushParagraph();flushList();const level=heading[1].length===3?3:2;html+=`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`;}
    else if(item){flushParagraph();list.push(item[1]);}
    else if(quote){flushParagraph();flushList();html+=`<blockquote>${inlineMarkdown(quote[1])}</blockquote>`;}
    else {flushList();paragraph.push(row);}
  }
  flushParagraph();flushList();return html;
}
export function mediaMarkup(item,base) {
  const src=escapeHTML(base+item.file),alt=escapeHTML(item.alt);
  return `<figure>${item.kind==='video'?`<video src="${src}" controls playsinline preload="metadata" aria-label="${alt}"></video>`:`<img src="${src}" alt="${alt}" loading="lazy" />`}${item.caption?`<figcaption>${escapeHTML(item.caption)}</figcaption>`:''}</figure>`;
}
export function noteMarkup(note, {preview = false,mediaBase='./media/',locale='pt'} = {}) {
  const date=new Date(`${note.date}T12:00:00`).toLocaleDateString(locale==='en'?'en-GB':'pt-BR',{day:'numeric',month:'long',year:'numeric'});
  const used=new Set();
  const body=(note.body||'').split(/(\{\{media:asset-[a-f0-9]{24}\}\})/g).map(part=>{
    const token=part.match(/^\{\{media:(asset-[a-f0-9]{24})\}\}$/),item=token&&note.media?.find(m=>m.id===token[1]);
    if(item){used.add(item.id);return mediaMarkup(item,mediaBase);}return renderMarkdown(part);
  }).join('');
  return `${preview?'<p class="draft-indicator">PRÉVIA LOCAL · NÃO PUBLICADO</p>':''}<span class="eyebrow">${(locale==='en'?{processo:'Process note',ensaio:'Article / essay',referencias:'Drawings and references'}[note.format]:NOTE_FORMATS[note.format]) || 'Field Notes'}</span><h1 id="note-reader-title">${escapeHTML(note.title || 'Sem título')}</h1>${note.summary?`<p class="note-summary">${escapeHTML(note.summary)}</p>`:''}<p class="note-byline">${escapeHTML(note.author || 'Autoria a preencher')} · ${escapeHTML(date)}</p><div class="note-body">${body}</div>${(note.media||[]).filter(m=>!used.has(m.id)).map(m=>mediaMarkup(m,mediaBase)).join('')}${(note.images||[]).map(img=>`<figure><img src="${escapeHTML(img.data)}" alt="${escapeHTML(img.alt)}" loading="lazy" />${img.caption?`<figcaption>${escapeHTML(img.caption)}</figcaption>`:''}</figure>`).join('')}`;
}
