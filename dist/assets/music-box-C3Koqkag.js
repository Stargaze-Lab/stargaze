const O="stargaze-music-box-styles-v3",Y=[["C",0],["C♯",1],["D",2],["E♭",3],["E",4],["F",5],["F♯",6],["G",7],["A♭",8],["A",9],["B♭",10],["B",11]],I={major:{label:"Major",steps:[0,2,4,5,7,9,11]},minor:{label:"Minor",steps:[0,2,3,5,7,8,10]},dorian:{label:"Dorian",steps:[0,2,3,5,7,9,10]},phrygian:{label:"Phrygian",steps:[0,1,3,5,7,8,10]},lydian:{label:"Lydian",steps:[0,2,4,6,7,9,11]},mixolydian:{label:"Mixolydian",steps:[0,2,4,5,7,9,10]},locrian:{label:"Locrian",steps:[0,1,3,5,6,8,10]},pentatonicMajor:{label:"Major pent.",steps:[0,2,4,7,9]},pentatonicMinor:{label:"Minor pent.",steps:[0,3,5,7,10]}},z={kalimba:"Kalimba",tom:"Tom kit",flute:"Bamboo flute",xylophone:"Wood xylophone",glass:"Glass bell"},X=["C","C♯","D","E♭","E","F","F♯","G","A♭","A","B♭","B"],K=["1","2","3","4","5","6","7","8"],H=`
  .sg-music-box,
  .sg-music-box * { box-sizing: border-box; }

  .sg-music-box {
    --music-accent: var(--accent, #58d7bd);
    --ink: #f5f3ef;
    --muted: rgba(245, 243, 239, 0.52);
    --line: rgba(245, 243, 239, 0.17);
    --surface: rgba(14, 14, 14, 0.9);
    position: relative;
    width: 100%;
    min-height: 100%;
    height: 100%;
    overflow: hidden;
    color: var(--ink);
    background-color: #080808;
    background-image:
      radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--music-accent) 5%, transparent), transparent 34%),
      linear-gradient(#080808, #080808);
    font-family: "Space Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
    isolation: isolate;
  }

  .sg-music-box__canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    cursor: crosshair;
    touch-action: none;
  }

  .sg-music-box__canvas[data-hover-node='true'] { cursor: grab; }
  .sg-music-box__canvas[data-dragging='true'] { cursor: grabbing; }

  .sg-music-box__header,
  .sg-music-box__footer {
    position: absolute;
    z-index: 3;
    left: 18px;
    right: 18px;
    display: flex;
    align-items: center;
    pointer-events: none;
  }

  .sg-music-box__header { top: 16px; justify-content: space-between; align-items: flex-start; gap: 18px; }
  .sg-music-box__footer { bottom: 16px; justify-content: space-between; align-items: flex-end; }
  .sg-music-box__identity { display: flex; align-items: center; gap: 10px; flex: 0 0 auto; }

  .sg-music-box__mark {
    width: 11px;
    height: 11px;
    border: 1px solid var(--music-accent);
    transform: rotate(45deg);
  }

  .sg-music-box__title {
    margin: 0;
    font-family: "Syne", "Inter", Arial, sans-serif;
    font-size: clamp(18px, 2vw, 30px);
    font-weight: 700;
    line-height: 0.9;
    letter-spacing: -0.04em;
    text-transform: lowercase;
  }

  .sg-music-box__title em {
    color: var(--music-accent);
    font-family: "Fraunces", Georgia, serif;
    font-weight: 400;
  }

  .sg-music-box__controls {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 7px;
    max-width: min(850px, 78vw);
    pointer-events: auto;
  }

  .sg-music-box__field,
  .sg-music-box__button {
    min-height: 34px;
    border: 1px solid var(--line);
    border-radius: 3px;
    color: var(--ink);
    background: var(--surface);
    backdrop-filter: blur(10px);
    font: 10px/1 "Space Mono", ui-monospace, monospace;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .sg-music-box__field { display: flex; align-items: center; gap: 7px; padding: 0 8px; }
  .sg-music-box__field span { color: var(--muted); }
  .sg-music-box select { border: 0; outline: 0; color: var(--ink); background: transparent; font: inherit; text-transform: uppercase; cursor: pointer; }
  .sg-music-box select option { color: #f5f3ef; background: #111; }
  .sg-music-box input[type='range'] { accent-color: var(--music-accent); cursor: ew-resize; }

  .sg-music-box__button { padding: 0 10px; cursor: pointer; white-space: nowrap; }
  .sg-music-box__button:hover,
  .sg-music-box__button:focus-visible { border-color: var(--music-accent); color: var(--music-accent); }
  .sg-music-box__button[aria-pressed='true'] { border-color: var(--music-accent); color: var(--music-accent); }
  .sg-music-box__button[disabled] { opacity: 0.32; cursor: not-allowed; }
  .sg-music-box__button--record[aria-pressed='true']::before { content: ''; display: inline-block; width: 6px; height: 6px; margin-right: 6px; border-radius: 50%; background: #ff6b68; box-shadow: 0 0 12px #ff6b68; }

  .sg-music-box__settings {
    position: absolute;
    z-index: 4;
    top: 68px;
    right: 18px;
    width: min(278px, calc(100% - 36px));
    padding: 16px;
    border: 1px solid var(--line);
    border-radius: 3px;
    background: rgba(10, 10, 10, 0.95);
    backdrop-filter: blur(18px);
    transform: translateX(calc(100% + 24px));
    opacity: 0;
    pointer-events: none;
    transition: transform 180ms ease, opacity 180ms ease;
  }

  .sg-music-box__settings[data-open='true'] { transform: translateX(0); opacity: 1; pointer-events: auto; }
  .sg-music-box__settings-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 14px; }
  .sg-music-box__settings-title { margin: 0; font: 700 11px/1 "Syne", "Inter", Arial, sans-serif; letter-spacing: 0.08em; text-transform: uppercase; }
  .sg-music-box__settings-note { margin: 0; color: var(--muted); font-size: 8px; letter-spacing: 0.08em; text-transform: uppercase; }
  .sg-music-box__slider { display: grid; grid-template-columns: 68px 1fr 30px; align-items: center; gap: 8px; min-height: 32px; color: var(--muted); font-size: 9px; letter-spacing: 0.06em; text-transform: uppercase; }
  .sg-music-box__slider input { width: 100%; min-width: 0; }
  .sg-music-box__slider output { color: var(--ink); text-align: right; }

  .sg-music-box__hint,
  .sg-music-box__status { max-width: 52ch; margin: 0; color: var(--muted); font-size: 9px; line-height: 1.5; letter-spacing: 0.07em; text-transform: uppercase; }
  .sg-music-box__status { color: var(--music-accent); text-align: right; }
  .sg-music-box__rec-dot { display: none; width: 6px; height: 6px; margin-right: 7px; border-radius: 50%; background: #ff6b68; vertical-align: 1px; }
  .sg-music-box[data-recording='true'] .sg-music-box__rec-dot { display: inline-block; animation: sg-recording 1.2s ease-in-out infinite; }
  @keyframes sg-recording { 50% { opacity: 0.3; } }

  @media (max-width: 900px) {
    .sg-music-box { min-height: 100%; }
    .sg-music-box__controls { max-width: 76vw; }
  }

  @media (max-width: 650px) {
    .sg-music-box__header { left: 12px; right: 12px; top: 10px; gap: 10px; }
    .sg-music-box__footer { left: 12px; right: 12px; bottom: 10px; }
    .sg-music-box__title { font-size: 16px; }
    .sg-music-box__mark { width: 9px; height: 9px; }
    .sg-music-box__controls { gap: 5px; max-width: 78vw; }
    .sg-music-box__field { min-height: 32px; padding: 0 6px; }
    .sg-music-box__field span { display: none; }
    .sg-music-box__field select { max-width: 116px; }
    .sg-music-box__button { min-height: 32px; padding: 0 8px; }
    .sg-music-box__settings { top: 150px; right: 12px; }
    .sg-music-box__status { display: none; }
    .sg-music-box__hint { max-width: 42ch; }
  }

  @media (max-width: 420px) {
    .sg-music-box__identity { padding-top: 8px; }
    .sg-music-box__button[data-control='download'] { font-size: 0; }
    .sg-music-box__button[data-control='download']::after { content: 'WAV'; font-size: 9px; }
    .sg-music-box__hint { max-width: 32ch; }
  }

  @media (prefers-reduced-motion: reduce) {
    .sg-music-box__canvas { cursor: default; }
    .sg-music-box__settings { transition: none; }
    .sg-music-box[data-recording='true'] .sg-music-box__rec-dot { animation: none; }
  }
`;let k=null;function Q(){if(document.getElementById(O))return;const h=document.createElement("style");h.id=O,h.textContent=H,document.head.appendChild(h)}function J(h){return 440*2**((h-69)/12)}function S(h){return`${X[(h%12+12)%12]}${Math.floor(h/12)-1}`}function f(h,t,e){return Math.max(t,Math.min(e,h))}function Z(h,t,e){const s=h.reduce((a,l)=>a+l.length,0),n=new ArrayBuffer(44+s*4),i=new DataView(n),o=(a,l)=>[...l].forEach((c,u)=>i.setUint8(a+u,c.charCodeAt(0)));o(0,"RIFF"),i.setUint32(4,36+s*4,!0),o(8,"WAVE"),o(12,"fmt "),i.setUint32(16,16,!0),i.setUint16(20,1,!0),i.setUint16(22,2,!0),i.setUint32(24,e,!0),i.setUint32(28,e*4,!0),i.setUint16(32,4,!0),i.setUint16(34,16,!0),o(36,"data"),i.setUint32(40,s*4,!0);let r=44;for(let a=0;a<h.length;a+=1){const l=h[a],c=t[a]||l;for(let u=0;u<l.length;u+=1){const d=f(l[u],-1,1),m=f(c[u]??d,-1,1);i.setInt16(r,d<0?d*32768:d*32767,!0),i.setInt16(r+2,m<0?m*32768:m*32767,!0),r+=4}}return new Blob([n],{type:"audio/wav"})}class tt{constructor(){this.context=null,this.input=null,this.filter=null,this.dry=null,this.reverbDelay=null,this.reverbFilter=null,this.reverbFeedback=null,this.wet=null,this.master=null,this.compressor=null,this.recorder=null,this.recordingSink=null,this.noiseBuffer=null,this.recording=!1,this.leftChunks=[],this.rightChunks=[],this.muted=!1,this.instrument="kalimba",this.settings={volume:.68,tone:.62,decay:.58,reverb:.22,texture:.45}}async ensure(){if(!this.context){const t=window.AudioContext||window.webkitAudioContext;if(!t)return!1;this.context=new t,this.input=this.context.createGain(),this.filter=this.context.createBiquadFilter(),this.dry=this.context.createGain(),this.reverbDelay=this.context.createDelay(.5),this.reverbFilter=this.context.createBiquadFilter(),this.reverbFeedback=this.context.createGain(),this.wet=this.context.createGain(),this.master=this.context.createGain(),this.compressor=this.context.createDynamicsCompressor(),this.filter.type="lowpass",this.reverbDelay.delayTime.value=.145,this.reverbFilter.type="lowpass",this.reverbFilter.frequency.value=4200,this.reverbFeedback.gain.value=.28,this.compressor.threshold.value=-18,this.compressor.knee.value=14,this.compressor.ratio.value=5,this.compressor.attack.value=.004,this.compressor.release.value=.2,this.input.connect(this.filter),this.filter.connect(this.dry).connect(this.master),this.filter.connect(this.reverbDelay),this.reverbDelay.connect(this.reverbFilter),this.reverbFilter.connect(this.wet).connect(this.master),this.reverbFilter.connect(this.reverbFeedback).connect(this.reverbDelay),this.master.connect(this.compressor).connect(this.context.destination),this.noiseBuffer=this.createNoiseBuffer(2),this.applySettings()}return this.context.state==="suspended"&&await this.context.resume(),!0}createNoiseBuffer(t){const e=Math.floor(this.context.sampleRate*t),s=this.context.createBuffer(1,e,this.context.sampleRate),n=s.getChannelData(0);let i=0;for(let o=0;o<e;o+=1){const r=Math.random()*2-1;i=i*.72+r*.28,n[o]=i}return s}setupRecorder(){this.recorder||(this.recorder=this.context.createScriptProcessor(4096,2,2),this.recordingSink=this.context.createGain(),this.recordingSink.gain.value=0,this.compressor.connect(this.recorder),this.recorder.connect(this.recordingSink).connect(this.context.destination),this.recorder.onaudioprocess=t=>{const e=t.outputBuffer;for(let i=0;i<e.numberOfChannels;i+=1)e.getChannelData(i).fill(0);if(!this.recording)return;const s=t.inputBuffer;this.leftChunks.push(new Float32Array(s.getChannelData(0)));const n=s.numberOfChannels>1?s.getChannelData(1):s.getChannelData(0);this.rightChunks.push(new Float32Array(n))})}teardownRecorder(){this.recorder&&(this.recorder.onaudioprocess=null,this.recorder.disconnect(),this.recorder=null),this.recordingSink&&(this.recordingSink.disconnect(),this.recordingSink=null)}setInstrument(t){this.instrument=z[t]?t:"kalimba"}setSetting(t,e){t in this.settings&&(this.settings[t]=f(Number(e),0,1),this.applySettings())}applySettings(){if(!this.context)return;const t=this.context.currentTime;this.master.gain.setTargetAtTime(this.muted?0:this.settings.volume*.68,t,.015),this.filter.frequency.setTargetAtTime(700+this.settings.tone**1.7*13e3,t,.025),this.filter.Q.setTargetAtTime(.35+this.settings.texture*1.6,t,.025),this.dry.gain.setTargetAtTime(.98-this.settings.reverb*.22,t,.025),this.wet.gain.setTargetAtTime(this.settings.reverb*.42,t,.025),this.reverbFeedback.gain.setTargetAtTime(.08+this.settings.reverb*.38,t,.025)}setMuted(t){this.muted=t,this.applySettings()}async startRecording(){return await this.ensure()?(this.leftChunks=[],this.rightChunks=[],this.setupRecorder(),this.recording=!0,!0):!1}stopRecording(){if(!this.context||!this.recording)return null;this.recording=!1;const t=this.leftChunks.length?Z(this.leftChunks,this.rightChunks,this.context.sampleRate):null;return this.teardownRecorder(),t}envelope(t,e,s,n,i){t.gain.cancelScheduledValues(i),t.gain.setValueAtTime(1e-4,i),t.gain.exponentialRampToValueAtTime(Math.max(2e-4,e),i+Math.max(.004,s)),t.gain.exponentialRampToValueAtTime(1e-4,i+Math.max(s+.02,n))}oscillator(t,e,s,n,i,o,r=0){const a=this.context.currentTime,l=this.context.createOscillator(),c=this.context.createGain();l.type=e,l.frequency.setValueAtTime(t,a),l.detune.setValueAtTime(r,a),this.envelope(c,s,n,i,a),l.connect(c).connect(o),l.start(a),l.stop(a+i+.08)}noise(t,e,s,n,i){const o=this.context.currentTime,r=this.context.createBufferSource(),a=this.context.createBiquadFilter(),l=this.context.createGain();r.buffer=this.noiseBuffer,a.type=s,a.frequency.value=n,a.Q.value=.8,this.envelope(l,e,.003,t,o),r.connect(a).connect(l).connect(i);const c=Math.max(0,this.noiseBuffer.duration-t-.01);r.start(o,Math.random()*c,Math.min(t,this.noiseBuffer.duration))}async play(t,e=.75){if(this.muted||!await this.ensure())return;const s=.3+this.settings.decay*1.75,n=this.settings.texture,i=this.context.createGain();i.gain.value=e,i.connect(this.input),this.instrument==="tom"?this.playTom(t,s,n,i):this.instrument==="flute"?this.playFlute(t,s,n,i):this.instrument==="xylophone"?this.playXylophone(t,s,n,i):this.instrument==="glass"?this.playGlass(t,s,n,i):this.playKalimba(t,s,n,i)}playKalimba(t,e,s,n){this.oscillator(t,"sine",.68,.006,e*.92,n,(Math.random()-.5)*3),this.oscillator(t*2.01,"sine",.16+s*.12,.004,e*.42,n),this.oscillator(t*3.98,"triangle",.05+s*.08,.003,e*.2,n),this.noise(.018+s*.018,.035+s*.045,"bandpass",Math.min(6200,t*7),n)}playTom(t,e,s,n){const i=this.context.currentTime,o=f(t*.24,58,220),r=this.context.createOscillator(),a=this.context.createGain();r.type=s>.55?"triangle":"sine",r.frequency.setValueAtTime(o*(1.8+s*.4),i),r.frequency.exponentialRampToValueAtTime(o,i+.08),this.envelope(a,.95,.004,.22+e*.42,i),r.connect(a).connect(n),r.start(i),r.stop(i+.35+e*.5),this.noise(.035,.06+s*.08,"lowpass",1100+s*2200,n)}playFlute(t,e,s,n){const i=.55+e*.9;this.oscillator(t,"sine",.48,.055,i,n,-2),this.oscillator(t,"triangle",.12+s*.1,.08,i*.92,n,4),this.oscillator(t*2,"sine",.025+s*.04,.07,i*.72,n),this.noise(i*.7,.012+s*.025,"bandpass",Math.min(5e3,t*3),n)}playXylophone(t,e,s,n){const i=.2+e*.28;this.oscillator(t,"sine",.56,.004,i,n),this.oscillator(t*3.92,"sine",.16+s*.08,.003,i*.48,n),this.oscillator(t*9.1,"sine",.025+s*.05,.002,i*.22,n),this.noise(.012,.025+s*.05,"highpass",2600,n)}playGlass(t,e,s,n){const i=.85+e*1.5;this.oscillator(t,"sine",.42,.008,i,n),this.oscillator(t*2.002,"sine",.2,.006,i*.72,n,2),this.oscillator(t*2.996,"sine",.08+s*.09,.004,i*.45,n,-3),this.oscillator(t*4.21,"sine",.03+s*.07,.004,i*.3,n)}close(){this.recording=!1,this.teardownRecorder(),this.context&&this.context.state!=="closed"&&this.context.close(),this.context=null}}class et{constructor(t){this.container=t,this.root=document.createElement("section"),this.root.className="sg-music-box",this.root.dataset.recording="false",this.root.innerHTML=`
      <canvas class="sg-music-box__canvas" aria-label="Interactive musical canvas"></canvas>
      <header class="sg-music-box__header">
        <div class="sg-music-box__identity">
          <span class="sg-music-box__mark" aria-hidden="true"></span>
          <h1 class="sg-music-box__title">music <em>box</em></h1>
        </div>
        <div class="sg-music-box__controls" aria-label="Music controls">
          <label class="sg-music-box__field"><span>voice</span><select data-control="instrument" aria-label="Instrument"></select></label>
          <label class="sg-music-box__field sg-music-box__field--key"><span>key</span><select data-control="key" aria-label="Base key"></select></label>
          <label class="sg-music-box__field sg-music-box__field--scale"><span>scale</span><select data-control="scale" aria-label="Scale"></select></label>
          <button class="sg-music-box__button" data-control="transport" type="button" aria-pressed="false">pause</button>
          <button class="sg-music-box__button sg-music-box__button--record" data-control="record" type="button" aria-pressed="false">record</button>
          <button class="sg-music-box__button" data-control="download" type="button" disabled>download</button>
          <button class="sg-music-box__button" data-control="settings" type="button" aria-pressed="false">settings</button>
          <button class="sg-music-box__button" data-control="clear" type="button">clear</button>
        </div>
      </header>
      <aside class="sg-music-box__settings" data-open="false" aria-label="Sound settings">
        <div class="sg-music-box__settings-head">
          <h2 class="sg-music-box__settings-title">sound settings</h2>
          <p class="sg-music-box__settings-note">live</p>
        </div>
        <label class="sg-music-box__slider"><span>volume</span><input data-setting="volume" type="range" min="0" max="100" value="68"><output>68</output></label>
        <label class="sg-music-box__slider"><span>tone</span><input data-setting="tone" type="range" min="0" max="100" value="62"><output>62</output></label>
        <label class="sg-music-box__slider"><span>decay</span><input data-setting="decay" type="range" min="0" max="100" value="58"><output>58</output></label>
        <label class="sg-music-box__slider"><span>reverb</span><input data-setting="reverb" type="range" min="0" max="100" value="22"><output>22</output></label>
        <label class="sg-music-box__slider"><span>texture</span><input data-setting="texture" type="range" min="0" max="100" value="45"><output>45</output></label>
        <label class="sg-music-box__slider"><span>pulse</span><input data-setting="speed" type="range" min="180" max="900" value="480"><output>480</output></label>
      </aside>
      <footer class="sg-music-box__footer">
        <p class="sg-music-box__hint">tap to place · drag to tune · hold for intervals</p>
        <p class="sg-music-box__status" aria-live="polite"><span class="sg-music-box__rec-dot"></span><span data-status>place two notes to begin</span></p>
      </footer>
    `,this.container.replaceChildren(this.root),this.canvas=this.root.querySelector("canvas"),this.context=this.canvas.getContext("2d"),this.instrumentControl=this.root.querySelector('[data-control="instrument"]'),this.keyControl=this.root.querySelector('[data-control="key"]'),this.scaleControl=this.root.querySelector('[data-control="scale"]'),this.transportControl=this.root.querySelector('[data-control="transport"]'),this.recordControl=this.root.querySelector('[data-control="record"]'),this.downloadControl=this.root.querySelector('[data-control="download"]'),this.settingsControl=this.root.querySelector('[data-control="settings"]'),this.clearControl=this.root.querySelector('[data-control="clear"]'),this.settingsPanel=this.root.querySelector(".sg-music-box__settings"),this.status=this.root.querySelector("[data-status]"),this.nodes=[],this.key=0,this.scaleName="major",this.speed=480,this.synth=new tt,this.pulse=null,this.isPlaying=!0,this.recordingBlob=null,this.downloadUrl="",this.pointer=null,this.radial=null,this.longPressTimer=null,this.hoveredNode=-1,this.routeCycle=0,this.width=0,this.height=0,this.dpr=1,this.lastFrame=performance.now(),this.frameRequest=0,this.visible=!0,this.reducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches,this.onResize=this.resize.bind(this),this.onPointerDown=this.pointerDown.bind(this),this.onPointerMove=this.pointerMove.bind(this),this.onPointerUp=this.pointerUp.bind(this),this.onPointerCancel=this.pointerCancel.bind(this),this.onVisibility=this.visibilityChange.bind(this),this.tick=this.animate.bind(this),this.populateControls(),this.bindEvents(),this.resize(),this.frameRequest=requestAnimationFrame(this.tick)}populateControls(){Object.entries(z).forEach(([t,e])=>this.instrumentControl.add(new Option(e,t))),Y.forEach(([t,e])=>this.keyControl.add(new Option(t,String(e)))),Object.entries(I).forEach(([t,e])=>this.scaleControl.add(new Option(e.label,t)))}bindEvents(){this.canvas.addEventListener("pointerdown",this.onPointerDown),this.canvas.addEventListener("pointermove",this.onPointerMove),this.canvas.addEventListener("pointerup",this.onPointerUp),this.canvas.addEventListener("pointercancel",this.onPointerCancel),this.canvas.addEventListener("contextmenu",t=>t.preventDefault()),this.instrumentControl.addEventListener("change",()=>{this.synth.setInstrument(this.instrumentControl.value),this.nodes.length&&this.playNode(0,.62),this.status.textContent=z[this.instrumentControl.value]}),this.keyControl.addEventListener("change",()=>{this.key=Number(this.keyControl.value),this.retuneNodes()}),this.scaleControl.addEventListener("change",()=>{this.scaleName=this.scaleControl.value,this.retuneNodes()}),this.transportControl.addEventListener("click",()=>this.toggleTransport()),this.recordControl.addEventListener("click",()=>this.toggleRecording()),this.downloadControl.addEventListener("click",()=>this.downloadRecording()),this.settingsControl.addEventListener("click",()=>this.toggleSettings()),this.clearControl.addEventListener("click",()=>this.clear()),this.root.querySelectorAll("[data-setting]").forEach(t=>{t.addEventListener("input",()=>{t.nextElementSibling.value=t.value,t.dataset.setting==="speed"?this.speed=Number(t.value):this.synth.setSetting(t.dataset.setting,Number(t.value)/100)})}),window.addEventListener("resize",this.onResize),document.addEventListener("visibilitychange",this.onVisibility)}resize(){const t=this.root.getBoundingClientRect();this.width=Math.max(1,t.width),this.height=Math.max(1,t.height),this.dpr=Math.min(window.devicePixelRatio||1,2),this.canvas.width=Math.round(this.width*this.dpr),this.canvas.height=Math.round(this.height*this.dpr),this.canvas.style.width=`${this.width}px`,this.canvas.style.height=`${this.height}px`,this.context.setTransform(this.dpr,0,0,this.dpr,0,0)}localPoint(t){const e=this.canvas.getBoundingClientRect();return{x:t.clientX-e.left,y:t.clientY-e.top}}nodePoint(t){return{x:t.x*this.width,y:t.y*this.height}}hitNode(t){let e=-1,s=26;return this.nodes.forEach((n,i)=>{const o=this.nodePoint(n),r=Math.hypot(t.x-o.x,t.y-o.y);r<s&&(e=i,s=r)}),e}pointerDown(t){if(t.button!==0)return;const e=this.localPoint(t);this.canvas.setPointerCapture(t.pointerId),this.synth.ensure();let s=this.hitNode(e);const n=s<0;n?s=this.addNode(e):this.playNode(s,.48);const i=this.nodes[s];i.grabbed=performance.now(),this.pointer={id:t.pointerId,start:e,current:e,nodeIndex:s,created:n,dragging:!1,lastMidi:i.midi,lastPreview:0},this.canvas.dataset.dragging="false",this.longPressTimer=window.setTimeout(()=>this.openRadial(),360)}pointerMove(t){const e=this.localPoint(t);if(this.hoveredNode=this.hitNode(e),this.canvas.dataset.hoverNode=String(this.hoveredNode>=0),!this.pointer||this.pointer.id!==t.pointerId)return;this.pointer.current=e,Math.hypot(e.x-this.pointer.start.x,e.y-this.pointer.start.y)>5&&!this.radial&&(this.pointer.dragging=!0,this.canvas.dataset.dragging="true",clearTimeout(this.longPressTimer)),this.pointer.dragging&&!this.radial&&this.moveNode(this.pointer.nodeIndex,e,performance.now()),this.radial&&this.updateRadialSelection(e)}pointerUp(t){if(!(!this.pointer||this.pointer.id!==t.pointerId)){if(clearTimeout(this.longPressTimer),this.radial)this.commitRadial();else if(this.pointer.dragging){this.moveNode(this.pointer.nodeIndex,this.localPoint(t),performance.now(),!1),this.playNode(this.pointer.nodeIndex,.76);const e=this.nodes[this.pointer.nodeIndex];e.dropped=performance.now(),this.status.textContent=`${S(e.midi)} · placed`}this.pointer=null,this.radial=null,this.canvas.dataset.dragging="false"}}pointerCancel(){clearTimeout(this.longPressTimer),this.pointer=null,this.radial=null,this.canvas.dataset.dragging="false"}moveNode(t,e,s=performance.now(),n=!0){const i=this.nodes[t];if(!i)return;i.x=f(e.x/this.width,.035,.965),i.y=f(e.y/this.height,.11,.91);const o=i.midi,r=this.degreeAndMidiFromY(i.y);i.degree=r.degree,i.octaveLift=0,i.midi=r.midi,i.moved=s,n&&i.midi!==o&&s-this.pointer.lastPreview>72&&(this.pointer.lastPreview=s,this.pointer.lastMidi=i.midi,this.playNode(t,.32))}openRadial(){if(!this.pointer)return;const t=this.pointer.nodeIndex,e=this.nodePoint(this.nodes[t]);this.radial={nodeIndex:t,center:e,selected:this.nodes[t].degree},this.updateRadialSelection(this.pointer.current)}updateRadialSelection(t){if(!this.radial)return;const e=t.x-this.radial.center.x,s=t.y-this.radial.center.y;if(Math.hypot(e,s)<28)return;const n=(Math.atan2(s,e)+Math.PI/2+Math.PI*2)%(Math.PI*2);this.radial.selected=Math.round(n/(Math.PI*2)*8)%8}commitRadial(){if(!this.radial)return;const t=this.nodes[this.radial.nodeIndex],e=I[this.scaleName].steps.length;t.degree=this.radial.selected%e,t.octaveLift=this.radial.selected>=e?1:0,this.tuneNode(t),this.playNode(this.radial.nodeIndex,.85),this.status.textContent=`${S(t.midi)} · degree ${this.radial.selected+1}`}degreeAndMidiFromY(t,e=null,s=0){const n=I[this.scaleName].steps,i=84-f(t,0,1)*36;let o={midi:60,degree:0,distance:1/0};for(let r=2;r<=7;r+=1)n.forEach((a,l)=>{if(e!==null&&l!==e)return;const c=12*(r+1)+this.key+a,u=Math.abs(c-i);u<o.distance&&(o={midi:c,degree:l,distance:u})});return o.midi+=s*12,o}tuneNode(t){t.midi=this.degreeAndMidiFromY(t.y,t.degree,t.octaveLift||0).midi}retuneNodes(){const t=I[this.scaleName].steps.length;this.nodes.forEach(e=>{e.degree%=t,this.tuneNode(e)}),this.nodes.length&&this.playNode(0,.55)}addNode(t,e=!0){const s=f(t.y/this.height,.12,.9),n=this.degreeAndMidiFromY(s),i={x:f(t.x/this.width,.04,.96),y:s,degree:n.degree,octaveLift:0,midi:n.midi,born:performance.now(),hit:0,grabbed:0,dropped:0,moved:0,visits:0};this.nodes.push(i);const o=this.nodes.length-1;return this.playNode(o,.72),e&&(this.status.textContent=`${S(i.midi)} · node ${o+1}`),this.nodes.length===2&&this.startPulse(),o}startPulse(){this.nodes.length<2||(this.nodes.forEach(t=>{t.visits=0}),this.nodes[0].visits=1,this.pulse={from:0,to:this.chooseNextNode(0,-1),previous:-1,progress:0},this.isPlaying=!0,this.updateTransport(),this.playNode(0,.86),this.status.textContent="pattern playing")}playNode(t,e=.75){const s=this.nodes[t];s&&(s.hit=performance.now(),this.synth.play(J(s.midi),e))}chooseNextNode(t,e){if(this.nodes.length<2)return t;if(this.nodes.length===2)return t===0?1:0;let s=this.nodes.map((a,l)=>({node:a,index:l})).filter(({index:a})=>a!==t&&a!==e);const n=Math.min(...s.map(({node:a})=>a.visits||0)),i=s.filter(({node:a})=>(a.visits||0)===n);i.length&&(s=i);const o=this.nodePoint(this.nodes[t]);s.forEach(a=>{const l=this.nodePoint(a.node),c=Math.hypot(l.x-o.x,l.y-o.y);a.score=c*(.72+Math.random()*.56)}),s.sort((a,l)=>a.score-l.score);const r=s.slice(0,Math.min(3,s.length));return r[Math.floor(Math.random()*r.length)].index}advancePulse(t){if(!this.isPlaying||!this.pulse||this.nodes.length<2)return;const e=this.nodePoint(this.nodes[this.pulse.from]),s=this.nodePoint(this.nodes[this.pulse.to]),n=Math.max(38,Math.hypot(s.x-e.x,s.y-e.y)),i=f(n/this.speed,.16,.86);if(this.pulse.progress+=t/i,this.pulse.progress>=1){this.playNode(this.pulse.to,.82),this.nodes[this.pulse.to].visits=(this.nodes[this.pulse.to].visits||0)+1;const o=this.pulse.from;this.pulse.from=this.pulse.to,this.pulse.previous=o,this.pulse.to=this.chooseNextNode(this.pulse.from,o),this.pulse.progress=0}}toggleTransport(){if(this.synth.ensure(),this.nodes.length<2){this.status.textContent="place two notes to begin";return}this.pulse?this.isPlaying=!this.isPlaying:(this.nodes.forEach(t=>{t.visits=0}),this.nodes[0].visits=1,this.pulse={from:0,to:this.chooseNextNode(0,-1),previous:-1,progress:0},this.isPlaying=!0,this.playNode(0,.86)),this.updateTransport(),this.status.textContent=this.isPlaying?"pattern playing":"pattern paused"}updateTransport(){this.transportControl.textContent=this.isPlaying?"pause":"play",this.transportControl.setAttribute("aria-pressed",String(!this.isPlaying))}async toggleRecording(){if(this.synth.recording){this.recordingBlob=this.synth.stopRecording(),this.root.dataset.recording="false",this.recordControl.textContent="record",this.recordControl.setAttribute("aria-pressed","false"),this.downloadControl.disabled=!this.recordingBlob,this.status.textContent=this.recordingBlob?"recording ready · download WAV":"nothing was recorded";return}if(this.downloadUrl&&(URL.revokeObjectURL(this.downloadUrl),this.downloadUrl=""),this.recordingBlob=null,this.downloadControl.disabled=!0,!await this.synth.startRecording()){this.status.textContent="audio recording is unavailable";return}this.nodes.length>=2&&!this.isPlaying&&this.toggleTransport(),this.root.dataset.recording="true",this.recordControl.textContent="finish",this.recordControl.setAttribute("aria-pressed","true"),this.status.textContent="recording · press finish when ready"}downloadRecording(){if(!this.recordingBlob)return;this.downloadUrl&&URL.revokeObjectURL(this.downloadUrl),this.downloadUrl=URL.createObjectURL(this.recordingBlob);const t=document.createElement("a"),e=new Date().toISOString().replace(/[:.]/g,"-").slice(0,19);t.href=this.downloadUrl,t.download=`stargaze-music-box-${e}.wav`,t.click(),this.status.textContent="WAV downloaded"}toggleSettings(){const t=this.settingsPanel.dataset.open!=="true";this.settingsPanel.dataset.open=String(t),this.settingsControl.setAttribute("aria-pressed",String(t))}clear(){this.nodes=[],this.pulse=null,this.radial=null,this.status.textContent="place two notes to begin"}accent(){return getComputedStyle(this.root).getPropertyValue("--music-accent").trim()||"#58d7bd"}drawBackground(t){const e=Math.max(46,Math.min(72,this.width/13));t.fillStyle="rgba(245, 243, 239, 0.07)";for(let s=e*.6;s<this.width;s+=e)for(let n=e*.6;n<this.height;n+=e)t.beginPath(),t.arc(s,n,.75,0,Math.PI*2),t.fill()}drawConnections(t){if(this.nodes.length<2)return;const e=new Set;if(t.lineWidth=1,this.nodes.forEach((s,n)=>{const i=this.nodePoint(s);let o=null,r=1/0;if(this.nodes.forEach((l,c)=>{if(c===n)return;const u=this.nodePoint(l),d=Math.hypot(u.x-i.x,u.y-i.y);d<r&&(r=d,o={candidateIndex:c,point:u})}),!o)return;const a=[n,o.candidateIndex].sort((l,c)=>l-c).join(":");e.has(a)||(e.add(a),t.strokeStyle="rgba(245, 243, 239, 0.11)",t.setLineDash([2,9]),t.beginPath(),t.moveTo(i.x,i.y),t.lineTo(o.point.x,o.point.y),t.stroke())}),this.pulse){const s=this.nodePoint(this.nodes[this.pulse.from]),n=this.nodePoint(this.nodes[this.pulse.to]);t.setLineDash([]),t.strokeStyle=this.accent(),t.globalAlpha=.22,t.beginPath(),t.moveTo(s.x,s.y),t.lineTo(n.x,n.y),t.stroke(),t.globalAlpha=1}t.setLineDash([])}drawNodes(t,e){const s=this.accent();this.nodes.forEach((n,i)=>{const o=this.nodePoint(n),r=Math.min(1,(e-n.born)/350),a=(e-n.hit)/1e3,l=a>=0&&a<.65?(1-a/.65)*18:0,c=(e-Math.max(n.dropped||0,n.grabbed||0))/1e3,u=c>=0&&c<.28?Math.sin(c/.28*Math.PI)*3:0,d=this.pointer?.nodeIndex===i&&!this.radial,m=(i===this.hoveredNode||d?11:8)*r+u;l>0&&(t.beginPath(),t.arc(o.x,o.y,10+l,0,Math.PI*2),t.strokeStyle=s,t.globalAlpha=Math.max(0,.42-a*.6),t.stroke(),t.globalAlpha=1),t.save(),t.shadowBlur=d?22:10,t.shadowColor=i===0||d?s:"rgba(245, 243, 239, 0.35)",t.beginPath(),t.arc(o.x,o.y,m+5,0,Math.PI*2),t.fillStyle="rgba(8, 8, 8, 0.86)",t.fill(),t.strokeStyle=i===0||d?s:"rgba(245, 243, 239, 0.34)",t.lineWidth=1,t.stroke(),t.beginPath(),t.arc(o.x,o.y,Math.max(2.5,m*.42),0,Math.PI*2),t.fillStyle=i===0||i===this.hoveredNode||d?s:"#f5f3ef",t.fill(),t.restore(),(i===this.hoveredNode||d)&&(t.fillStyle="rgba(245, 243, 239, 0.62)",t.font='8px "Space Mono", monospace',t.textAlign="center",t.fillText(S(n.midi),o.x,o.y+m+22))})}drawPulse(t){if(!this.pulse||this.nodes.length<2)return;const e=this.nodePoint(this.nodes[this.pulse.from]),s=this.nodePoint(this.nodes[this.pulse.to]),n=this.reducedMotion?1:this.pulse.progress,i=e.x+(s.x-e.x)*n,o=e.y+(s.y-e.y)*n,r=this.accent(),a=t.createRadialGradient(i,o,0,i,o,24);a.addColorStop(0,r),a.addColorStop(.18,r),a.addColorStop(1,"transparent"),t.beginPath(),t.arc(i,o,24,0,Math.PI*2),t.fillStyle=a,t.globalAlpha=.34,t.fill(),t.globalAlpha=1,t.beginPath(),t.arc(i,o,3.2,0,Math.PI*2),t.fillStyle=this.isPlaying?"#f5f3ef":r,t.fill()}drawRadial(t){if(!this.radial)return;const{center:e,selected:s,nodeIndex:n}=this.radial,i=this.nodes[n],o=62,r=this.accent();t.fillStyle="rgba(8, 8, 8, 0.9)",t.beginPath(),t.arc(e.x,e.y,86,0,Math.PI*2),t.fill(),t.strokeStyle="rgba(245, 243, 239, 0.16)",t.beginPath(),t.arc(e.x,e.y,o,0,Math.PI*2),t.stroke();for(let a=0;a<8;a+=1){const l=-Math.PI/2+a*Math.PI*2/8,c=e.x+Math.cos(l)*o,u=e.y+Math.sin(l)*o,d=a===s;t.beginPath(),t.arc(c,u,d?15:12,0,Math.PI*2),t.fillStyle=d?r:"#111",t.fill(),t.strokeStyle=d?r:"rgba(245, 243, 239, 0.34)",t.stroke(),t.fillStyle=d?"#080808":"#f5f3ef",t.font='9px "Space Mono", monospace',t.textAlign="center",t.textBaseline="middle",t.fillText(K[a],c,u+.5)}t.fillStyle="rgba(245, 243, 239, 0.62)",t.font='8px "Space Mono", monospace',t.fillText(S(i.midi),e.x,e.y),t.textBaseline="alphabetic"}animate(t){const e=Math.min(.05,(t-this.lastFrame)/1e3);this.lastFrame=t,this.visible&&this.advancePulse(e);const s=this.context;s.clearRect(0,0,this.width,this.height),this.drawBackground(s),this.drawConnections(s),this.drawPulse(s),this.drawNodes(s,t),this.drawRadial(s),this.frameRequest=requestAnimationFrame(this.tick)}visibilityChange(){this.visible=!document.hidden,this.lastFrame=performance.now(),!this.visible&&this.synth.context?.state==="running"&&this.synth.context.suspend()}destroy(){cancelAnimationFrame(this.frameRequest),clearTimeout(this.longPressTimer),window.removeEventListener("resize",this.onResize),document.removeEventListener("visibilitychange",this.onVisibility),this.downloadUrl&&URL.revokeObjectURL(this.downloadUrl),this.synth.close(),this.root.remove()}}function nt(h){if(!h)return()=>{};const t=h.getContext("2d"),e=h.parentElement,s=[[.16,.58,.2],[.31,.27,1.4],[.47,.63,2.6],[.64,.34,3.5],[.83,.55,4.7],[.69,.78,5.6]],n=[0,2,5,1,4,3],i=window.matchMedia("(prefers-reduced-motion: reduce)").matches;let o=0,r=0,a=0,l=!0,c=!0;const u=()=>{const w=e.getBoundingClientRect(),y=Math.min(window.devicePixelRatio||1,2);o=w.width,r=w.height,h.width=Math.max(1,Math.round(o*y)),h.height=Math.max(1,Math.round(r*y)),h.style.width=`${o}px`,h.style.height=`${r}px`,t.setTransform(y,0,0,y,0,0)},d=(w=0)=>{if(!l)return;t.clearRect(0,0,o,r);const y=getComputedStyle(h),v=y.getPropertyValue("--card-accent").trim()||y.getPropertyValue("--accent").trim()||"#e7bd6d",P=i?1200:w,M=s.map(([p,b,g])=>[(p+Math.cos(P*42e-5+g)*.018)*o,(b+Math.sin(P*34e-5+g*1.3)*.025)*r]),F=o*.5,L=r*.53,A=t.createRadialGradient(F,L,0,F,L,Math.max(o,r)*.58);A.addColorStop(0,`${v}17`),A.addColorStop(.48,`${v}08`),A.addColorStop(1,"transparent"),t.fillStyle=A,t.fillRect(0,0,o,r),t.save(),t.globalCompositeOperation="lighter",t.lineWidth=1,M.forEach(([p,b],g)=>{const C=M[(g+2)%M.length],_=Math.sin(P*5e-4+g)*Math.min(o,r)*.08;t.strokeStyle=g%2?"rgba(242,240,234,.13)":v,t.globalAlpha=g%2?.55:.16,t.beginPath(),t.moveTo(p,b),t.quadraticCurveTo(F+_,L-_*.45,C[0],C[1]),t.stroke()});const B=(i?.38:P*27e-5%1)*n.length,G=Math.floor(B)%n.length,j=n[G],$=n[(G+1)%n.length],U=B-Math.floor(B),D=U*U*(3-2*U),x=M[j],T=M[$],E=x[0]+(T[0]-x[0])*D,N=x[1]+(T[1]-x[1])*D;M.forEach(([p,b],g)=>{const C=Math.hypot(p-E,b-N),_=Math.max(0,1-C/Math.max(90,o*.25)),W=1+Math.sin(P*.0015+g*1.7)*.12;t.globalAlpha=.18+_*.28,t.strokeStyle=g%2?"#f2f0ea":v,t.beginPath(),t.arc(p,b,(13+_*22)*W,0,Math.PI*2),t.stroke(),t.globalAlpha=.72+_*.28,t.fillStyle=g%2?"#f2f0ea":v,t.beginPath(),t.arc(p,b,2.2+_*1.7,0,Math.PI*2),t.fill()});for(let p=10;p>=0;p-=1){const b=Math.max(0,D-p*.024),g=x[0]+(T[0]-x[0])*b,C=x[1]+(T[1]-x[1])*b;t.globalAlpha=(1-p/11)*.12,t.fillStyle=v,t.beginPath(),t.arc(g,C,2+(1-p/11)*2.5,0,Math.PI*2),t.fill()}const R=t.createRadialGradient(E,N,0,E,N,38);R.addColorStop(0,"#f2f0ea"),R.addColorStop(.12,v),R.addColorStop(1,"transparent"),t.globalAlpha=.82,t.fillStyle=R,t.beginPath(),t.arc(E,N,38,0,Math.PI*2),t.fill(),t.restore(),t.globalAlpha=1,!i&&c&&(a=requestAnimationFrame(d))},m=new ResizeObserver(()=>{u(),d(performance.now())}),V=new IntersectionObserver(([w])=>{c=w.isIntersecting,cancelAnimationFrame(a),c&&l&&!i&&(a=requestAnimationFrame(d))});return m.observe(e),V.observe(h),u(),d(performance.now()),()=>{l=!1,cancelAnimationFrame(a),m.disconnect(),V.disconnect()}}function st(h){if(!h)throw new Error("Music Box needs a container element.");return q(),Q(),k=new et(h),k}function q(){k&&(k.destroy(),k=null)}async function ot(h){return st(h),q}export{q as cleanup,ot as default,st as mount,nt as mountPreview};
