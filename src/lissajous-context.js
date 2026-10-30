import context from '../content/lissajous-context.json';
import {escapeHTML} from './note-format.js';
export function renderLissajousContext(language='pt'){
  const copy=context[language==='en'?'en':'pt'];
  return `<p>${escapeHTML(copy.body)}</p><div class="context-links">${copy.links.map(link=>`<a href="${escapeHTML(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(link.label)} ↗</a>`).join('')}</div>`;
}
