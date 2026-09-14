import React from 'react';
import {createRoot} from 'react-dom/client';
import {LissajousInstrument} from './instrument';
import {language,tr} from './language';
import {renderLissajousContext} from '../../lissajous-context.js';
import './instrument.css';
import './integration.css';

document.documentElement.lang=language==='pt'?'pt-BR':'en';
document.title=tr('Lissajous — Stargaze','Lissajous — Stargaze');
const root=createRoot(document.getElementById('instrument')!);
root.render(<LissajousInstrument/>);
document.getElementById('study-help')!.textContent=tr('Escolha duas notas. Arraste o campo para alterar a fase. Ligue o som para ouvir a relação e ajuste o volume.','Choose two notes. Drag the field to shift phase. Enable sound to hear the relationship and adjust the volume.');
document.getElementById('study-context')!.innerHTML=renderLissajousContext(language);
document.getElementById('back-home')!.textContent=tr('← Voltar à Stargaze','← Back to Stargaze');
document.getElementById('context-title')!.textContent=tr('Som que ganha forma.','Sound taking shape.');
document.querySelectorAll<HTMLAnchorElement>('[data-study-language]').forEach(a=>{a.href='?lang='+a.dataset.studyLanguage;a.setAttribute('aria-current',a.dataset.studyLanguage===language?'page':'false');});
window.addEventListener('pagehide',event=>{if(!event.persisted)root.unmount();});

