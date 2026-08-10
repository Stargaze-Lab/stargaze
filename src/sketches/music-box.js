const STYLE_ID = 'stargaze-music-box-styles-v3';

const KEYS = [
  ['C', 0], ['C♯', 1], ['D', 2], ['E♭', 3], ['E', 4], ['F', 5],
  ['F♯', 6], ['G', 7], ['A♭', 8], ['A', 9], ['B♭', 10], ['B', 11],
];

const SCALES = {
  major: { label: 'Major', steps: [0, 2, 4, 5, 7, 9, 11] },
  minor: { label: 'Minor', steps: [0, 2, 3, 5, 7, 8, 10] },
  dorian: { label: 'Dorian', steps: [0, 2, 3, 5, 7, 9, 10] },
  phrygian: { label: 'Phrygian', steps: [0, 1, 3, 5, 7, 8, 10] },
  lydian: { label: 'Lydian', steps: [0, 2, 4, 6, 7, 9, 11] },
  mixolydian: { label: 'Mixolydian', steps: [0, 2, 4, 5, 7, 9, 10] },
  locrian: { label: 'Locrian', steps: [0, 1, 3, 5, 6, 8, 10] },
  pentatonicMajor: { label: 'Major pent.', steps: [0, 2, 4, 7, 9] },
  pentatonicMinor: { label: 'Minor pent.', steps: [0, 3, 5, 7, 10] },
};

const INSTRUMENTS = {
  kalimba: 'Kalimba',
  tom: 'Tom kit',
  flute: 'Bamboo flute',
  xylophone: 'Wood xylophone',
  glass: 'Glass bell',
};

const NOTE_NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
const DEGREE_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8'];

const styles = `
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
`;

let activeInstance = null;

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = styles;
  document.head.appendChild(style);
}

function midiToFrequency(midi) { return 440 * (2 ** ((midi - 69) / 12)); }
function noteName(midi) { return `${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`; }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

function encodeWav(leftChunks, rightChunks, sampleRate) {
  const totalFrames = leftChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const buffer = new ArrayBuffer(44 + totalFrames * 4);
  const view = new DataView(buffer);
  const writeText = (offset, text) => [...text].forEach((character, index) => view.setUint8(offset + index, character.charCodeAt(0)));
  writeText(0, 'RIFF');
  view.setUint32(4, 36 + totalFrames * 4, true);
  writeText(8, 'WAVE');
  writeText(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 2, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 4, true);
  view.setUint16(32, 4, true);
  view.setUint16(34, 16, true);
  writeText(36, 'data');
  view.setUint32(40, totalFrames * 4, true);
  let offset = 44;
  for (let chunkIndex = 0; chunkIndex < leftChunks.length; chunkIndex += 1) {
    const left = leftChunks[chunkIndex];
    const right = rightChunks[chunkIndex] || left;
    for (let frame = 0; frame < left.length; frame += 1) {
      const leftSample = clamp(left[frame], -1, 1);
      const rightSample = clamp(right[frame] ?? leftSample, -1, 1);
      view.setInt16(offset, leftSample < 0 ? leftSample * 0x8000 : leftSample * 0x7fff, true);
      view.setInt16(offset + 2, rightSample < 0 ? rightSample * 0x8000 : rightSample * 0x7fff, true);
      offset += 4;
    }
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

class SoundEngine {
  constructor() {
    this.context = null;
    this.input = null;
    this.filter = null;
    this.dry = null;
    this.reverbDelay = null;
    this.reverbFilter = null;
    this.reverbFeedback = null;
    this.wet = null;
    this.master = null;
    this.compressor = null;
    this.recorder = null;
    this.recordingSink = null;
    this.noiseBuffer = null;
    this.recording = false;
    this.leftChunks = [];
    this.rightChunks = [];
    this.muted = false;
    this.instrument = 'kalimba';
    this.settings = { volume: 0.68, tone: 0.62, decay: 0.58, reverb: 0.22, texture: 0.45 };
  }

  async ensure() {
    if (!this.context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return false;
      this.context = new AudioContextClass();
      this.input = this.context.createGain();
      this.filter = this.context.createBiquadFilter();
      this.dry = this.context.createGain();
      this.reverbDelay = this.context.createDelay(0.5);
      this.reverbFilter = this.context.createBiquadFilter();
      this.reverbFeedback = this.context.createGain();
      this.wet = this.context.createGain();
      this.master = this.context.createGain();
      this.compressor = this.context.createDynamicsCompressor();
      this.filter.type = 'lowpass';
      this.reverbDelay.delayTime.value = 0.145;
      this.reverbFilter.type = 'lowpass';
      this.reverbFilter.frequency.value = 4200;
      this.reverbFeedback.gain.value = 0.28;
      this.compressor.threshold.value = -18;
      this.compressor.knee.value = 14;
      this.compressor.ratio.value = 5;
      this.compressor.attack.value = 0.004;
      this.compressor.release.value = 0.2;
      this.input.connect(this.filter);
      this.filter.connect(this.dry).connect(this.master);
      this.filter.connect(this.reverbDelay);
      this.reverbDelay.connect(this.reverbFilter);
      this.reverbFilter.connect(this.wet).connect(this.master);
      this.reverbFilter.connect(this.reverbFeedback).connect(this.reverbDelay);
      this.master.connect(this.compressor).connect(this.context.destination);
      this.noiseBuffer = this.createNoiseBuffer(2);
      this.applySettings();
    }
    if (this.context.state === 'suspended') await this.context.resume();
    return true;
  }

  createNoiseBuffer(seconds) {
    const length = Math.floor(this.context.sampleRate * seconds);
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    let previous = 0;
    for (let i = 0; i < length; i += 1) {
      const white = Math.random() * 2 - 1;
      previous = previous * 0.72 + white * 0.28;
      data[i] = previous;
    }
    return buffer;
  }

  setupRecorder() {
    if (this.recorder) return;
    this.recorder = this.context.createScriptProcessor(4096, 2, 2);
    this.recordingSink = this.context.createGain();
    this.recordingSink.gain.value = 0;
    this.compressor.connect(this.recorder);
    this.recorder.connect(this.recordingSink).connect(this.context.destination);
    this.recorder.onaudioprocess = (event) => {
      const output = event.outputBuffer;
      for (let channel = 0; channel < output.numberOfChannels; channel += 1) output.getChannelData(channel).fill(0);
      if (!this.recording) return;
      const input = event.inputBuffer;
      this.leftChunks.push(new Float32Array(input.getChannelData(0)));
      const right = input.numberOfChannels > 1 ? input.getChannelData(1) : input.getChannelData(0);
      this.rightChunks.push(new Float32Array(right));
    };
  }

  teardownRecorder() {
    if (this.recorder) {
      this.recorder.onaudioprocess = null;
      this.recorder.disconnect();
      this.recorder = null;
    }
    if (this.recordingSink) {
      this.recordingSink.disconnect();
      this.recordingSink = null;
    }
  }

  setInstrument(instrument) { this.instrument = INSTRUMENTS[instrument] ? instrument : 'kalimba'; }

  setSetting(name, value) {
    if (!(name in this.settings)) return;
    this.settings[name] = clamp(Number(value), 0, 1);
    this.applySettings();
  }

  applySettings() {
    if (!this.context) return;
    const now = this.context.currentTime;
    this.master.gain.setTargetAtTime(this.muted ? 0 : this.settings.volume * 0.68, now, 0.015);
    this.filter.frequency.setTargetAtTime(700 + (this.settings.tone ** 1.7) * 13000, now, 0.025);
    this.filter.Q.setTargetAtTime(0.35 + this.settings.texture * 1.6, now, 0.025);
    this.dry.gain.setTargetAtTime(0.98 - this.settings.reverb * 0.22, now, 0.025);
    this.wet.gain.setTargetAtTime(this.settings.reverb * 0.42, now, 0.025);
    this.reverbFeedback.gain.setTargetAtTime(0.08 + this.settings.reverb * 0.38, now, 0.025);
  }

  setMuted(muted) { this.muted = muted; this.applySettings(); }

  async startRecording() {
    if (!(await this.ensure())) return false;
    this.leftChunks = [];
    this.rightChunks = [];
    this.setupRecorder();
    this.recording = true;
    return true;
  }

  stopRecording() {
    if (!this.context || !this.recording) return null;
    this.recording = false;
    const blob = this.leftChunks.length ? encodeWav(this.leftChunks, this.rightChunks, this.context.sampleRate) : null;
    this.teardownRecorder();
    return blob;
  }

  envelope(target, peak, attack, decay, now) {
    target.gain.cancelScheduledValues(now);
    target.gain.setValueAtTime(0.0001, now);
    target.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), now + Math.max(0.004, attack));
    target.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(attack + 0.02, decay));
  }

  oscillator(frequency, type, gain, attack, decay, destination, detune = 0) {
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.detune.setValueAtTime(detune, now);
    this.envelope(envelope, gain, attack, decay, now);
    oscillator.connect(envelope).connect(destination);
    oscillator.start(now);
    oscillator.stop(now + decay + 0.08);
  }

  noise(duration, gain, filterType, cutoff, destination) {
    const now = this.context.currentTime;
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const envelope = this.context.createGain();
    source.buffer = this.noiseBuffer;
    filter.type = filterType;
    filter.frequency.value = cutoff;
    filter.Q.value = 0.8;
    this.envelope(envelope, gain, 0.003, duration, now);
    source.connect(filter).connect(envelope).connect(destination);
    const available = Math.max(0, this.noiseBuffer.duration - duration - 0.01);
    source.start(now, Math.random() * available, Math.min(duration, this.noiseBuffer.duration));
  }

  async play(frequency, strength = 0.75) {
    if (this.muted || !(await this.ensure())) return;
    const decay = 0.3 + this.settings.decay * 1.75;
    const texture = this.settings.texture;
    const output = this.context.createGain();
    output.gain.value = strength;
    output.connect(this.input);
    if (this.instrument === 'tom') this.playTom(frequency, decay, texture, output);
    else if (this.instrument === 'flute') this.playFlute(frequency, decay, texture, output);
    else if (this.instrument === 'xylophone') this.playXylophone(frequency, decay, texture, output);
    else if (this.instrument === 'glass') this.playGlass(frequency, decay, texture, output);
    else this.playKalimba(frequency, decay, texture, output);
  }

  playKalimba(frequency, decay, texture, output) {
    this.oscillator(frequency, 'sine', 0.68, 0.006, decay * 0.92, output, (Math.random() - 0.5) * 3);
    this.oscillator(frequency * 2.01, 'sine', 0.16 + texture * 0.12, 0.004, decay * 0.42, output);
    this.oscillator(frequency * 3.98, 'triangle', 0.05 + texture * 0.08, 0.003, decay * 0.2, output);
    this.noise(0.018 + texture * 0.018, 0.035 + texture * 0.045, 'bandpass', Math.min(6200, frequency * 7), output);
  }

  playTom(frequency, decay, texture, output) {
    const now = this.context.currentTime;
    const drumFrequency = clamp(frequency * 0.24, 58, 220);
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = texture > 0.55 ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime(drumFrequency * (1.8 + texture * 0.4), now);
    oscillator.frequency.exponentialRampToValueAtTime(drumFrequency, now + 0.08);
    this.envelope(envelope, 0.95, 0.004, 0.22 + decay * 0.42, now);
    oscillator.connect(envelope).connect(output);
    oscillator.start(now);
    oscillator.stop(now + 0.35 + decay * 0.5);
    this.noise(0.035, 0.06 + texture * 0.08, 'lowpass', 1100 + texture * 2200, output);
  }

  playFlute(frequency, decay, texture, output) {
    const length = 0.55 + decay * 0.9;
    this.oscillator(frequency, 'sine', 0.48, 0.055, length, output, -2);
    this.oscillator(frequency, 'triangle', 0.12 + texture * 0.1, 0.08, length * 0.92, output, 4);
    this.oscillator(frequency * 2, 'sine', 0.025 + texture * 0.04, 0.07, length * 0.72, output);
    this.noise(length * 0.7, 0.012 + texture * 0.025, 'bandpass', Math.min(5000, frequency * 3), output);
  }

  playXylophone(frequency, decay, texture, output) {
    const short = 0.2 + decay * 0.28;
    this.oscillator(frequency, 'sine', 0.56, 0.004, short, output);
    this.oscillator(frequency * 3.92, 'sine', 0.16 + texture * 0.08, 0.003, short * 0.48, output);
    this.oscillator(frequency * 9.1, 'sine', 0.025 + texture * 0.05, 0.002, short * 0.22, output);
    this.noise(0.012, 0.025 + texture * 0.05, 'highpass', 2600, output);
  }

  playGlass(frequency, decay, texture, output) {
    const long = 0.85 + decay * 1.5;
    this.oscillator(frequency, 'sine', 0.42, 0.008, long, output);
    this.oscillator(frequency * 2.002, 'sine', 0.2, 0.006, long * 0.72, output, 2);
    this.oscillator(frequency * 2.996, 'sine', 0.08 + texture * 0.09, 0.004, long * 0.45, output, -3);
    this.oscillator(frequency * 4.21, 'sine', 0.03 + texture * 0.07, 0.004, long * 0.3, output);
  }

  close() {
    this.recording = false;
    this.teardownRecorder();
    if (this.context && this.context.state !== 'closed') this.context.close();
    this.context = null;
  }
}

class MusicBox {
  constructor(container) {
    this.container = container;
    this.root = document.createElement('section');
    this.root.className = 'sg-music-box';
    this.root.dataset.recording = 'false';
    this.root.innerHTML = `
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
    `;
    this.container.replaceChildren(this.root);

    this.canvas = this.root.querySelector('canvas');
    this.context = this.canvas.getContext('2d');
    this.instrumentControl = this.root.querySelector('[data-control="instrument"]');
    this.keyControl = this.root.querySelector('[data-control="key"]');
    this.scaleControl = this.root.querySelector('[data-control="scale"]');
    this.transportControl = this.root.querySelector('[data-control="transport"]');
    this.recordControl = this.root.querySelector('[data-control="record"]');
    this.downloadControl = this.root.querySelector('[data-control="download"]');
    this.settingsControl = this.root.querySelector('[data-control="settings"]');
    this.clearControl = this.root.querySelector('[data-control="clear"]');
    this.settingsPanel = this.root.querySelector('.sg-music-box__settings');
    this.status = this.root.querySelector('[data-status]');

    this.nodes = [];
    this.key = 0;
    this.scaleName = 'major';
    this.speed = 480;
    this.synth = new SoundEngine();
    this.pulse = null;
    this.isPlaying = true;
    this.recordingBlob = null;
    this.downloadUrl = '';
    this.pointer = null;
    this.radial = null;
    this.longPressTimer = null;
    this.hoveredNode = -1;
    this.routeCycle = 0;
    this.width = 0;
    this.height = 0;
    this.dpr = 1;
    this.lastFrame = performance.now();
    this.frameRequest = 0;
    this.visible = true;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.onResize = this.resize.bind(this);
    this.onPointerDown = this.pointerDown.bind(this);
    this.onPointerMove = this.pointerMove.bind(this);
    this.onPointerUp = this.pointerUp.bind(this);
    this.onPointerCancel = this.pointerCancel.bind(this);
    this.onVisibility = this.visibilityChange.bind(this);
    this.tick = this.animate.bind(this);

    this.populateControls();
    this.bindEvents();
    this.resize();
    this.frameRequest = requestAnimationFrame(this.tick);
  }

  populateControls() {
    Object.entries(INSTRUMENTS).forEach(([value, label]) => this.instrumentControl.add(new Option(label, value)));
    KEYS.forEach(([label, value]) => this.keyControl.add(new Option(label, String(value))));
    Object.entries(SCALES).forEach(([value, scale]) => this.scaleControl.add(new Option(scale.label, value)));
  }

  bindEvents() {
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerCancel);
    this.canvas.addEventListener('contextmenu', (event) => event.preventDefault());
    this.instrumentControl.addEventListener('change', () => {
      this.synth.setInstrument(this.instrumentControl.value);
      if (this.nodes.length) this.playNode(0, 0.62);
      this.status.textContent = INSTRUMENTS[this.instrumentControl.value];
    });
    this.keyControl.addEventListener('change', () => { this.key = Number(this.keyControl.value); this.retuneNodes(); });
    this.scaleControl.addEventListener('change', () => { this.scaleName = this.scaleControl.value; this.retuneNodes(); });
    this.transportControl.addEventListener('click', () => this.toggleTransport());
    this.recordControl.addEventListener('click', () => this.toggleRecording());
    this.downloadControl.addEventListener('click', () => this.downloadRecording());
    this.settingsControl.addEventListener('click', () => this.toggleSettings());
    this.clearControl.addEventListener('click', () => this.clear());
    this.root.querySelectorAll('[data-setting]').forEach((input) => {
      input.addEventListener('input', () => {
        input.nextElementSibling.value = input.value;
        if (input.dataset.setting === 'speed') this.speed = Number(input.value);
        else this.synth.setSetting(input.dataset.setting, Number(input.value) / 100);
      });
    });
    window.addEventListener('resize', this.onResize);
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  resize() {
    const bounds = this.root.getBoundingClientRect();
    this.width = Math.max(1, bounds.width);
    this.height = Math.max(1, bounds.height);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  localPoint(event) {
    const bounds = this.canvas.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }

  nodePoint(node) { return { x: node.x * this.width, y: node.y * this.height }; }

  hitNode(point) {
    let closest = -1;
    let closestDistance = 26;
    this.nodes.forEach((node, index) => {
      const position = this.nodePoint(node);
      const distance = Math.hypot(point.x - position.x, point.y - position.y);
      if (distance < closestDistance) { closest = index; closestDistance = distance; }
    });
    return closest;
  }

  pointerDown(event) {
    if (event.button !== 0) return;
    const point = this.localPoint(event);
    this.canvas.setPointerCapture(event.pointerId);
    void this.synth.ensure();
    let nodeIndex = this.hitNode(point);
    const created = nodeIndex < 0;
    if (created) nodeIndex = this.addNode(point);
    else this.playNode(nodeIndex, 0.48);
    const node = this.nodes[nodeIndex];
    node.grabbed = performance.now();
    this.pointer = {
      id: event.pointerId,
      start: point,
      current: point,
      nodeIndex,
      created,
      dragging: false,
      lastMidi: node.midi,
      lastPreview: 0,
    };
    this.canvas.dataset.dragging = 'false';
    this.longPressTimer = window.setTimeout(() => this.openRadial(), 360);
  }

  pointerMove(event) {
    const point = this.localPoint(event);
    this.hoveredNode = this.hitNode(point);
    this.canvas.dataset.hoverNode = String(this.hoveredNode >= 0);
    if (!this.pointer || this.pointer.id !== event.pointerId) return;
    this.pointer.current = point;
    const movement = Math.hypot(point.x - this.pointer.start.x, point.y - this.pointer.start.y);
    if (movement > 5 && !this.radial) {
      this.pointer.dragging = true;
      this.canvas.dataset.dragging = 'true';
      clearTimeout(this.longPressTimer);
    }
    if (this.pointer.dragging && !this.radial) this.moveNode(this.pointer.nodeIndex, point, performance.now());
    if (this.radial) this.updateRadialSelection(point);
  }

  pointerUp(event) {
    if (!this.pointer || this.pointer.id !== event.pointerId) return;
    clearTimeout(this.longPressTimer);
    if (this.radial) this.commitRadial();
    else if (this.pointer.dragging) {
      this.moveNode(this.pointer.nodeIndex, this.localPoint(event), performance.now(), false);
      this.playNode(this.pointer.nodeIndex, 0.76);
      const node = this.nodes[this.pointer.nodeIndex];
      node.dropped = performance.now();
      this.status.textContent = `${noteName(node.midi)} · placed`;
    }
    this.pointer = null;
    this.radial = null;
    this.canvas.dataset.dragging = 'false';
  }

  pointerCancel() {
    clearTimeout(this.longPressTimer);
    this.pointer = null;
    this.radial = null;
    this.canvas.dataset.dragging = 'false';
  }

  moveNode(index, point, now = performance.now(), preview = true) {
    const node = this.nodes[index];
    if (!node) return;
    node.x = clamp(point.x / this.width, 0.035, 0.965);
    node.y = clamp(point.y / this.height, 0.11, 0.91);
    const previousMidi = node.midi;
    const tuning = this.degreeAndMidiFromY(node.y);
    node.degree = tuning.degree;
    node.octaveLift = 0;
    node.midi = tuning.midi;
    node.moved = now;
    if (preview && node.midi !== previousMidi && now - this.pointer.lastPreview > 72) {
      this.pointer.lastPreview = now;
      this.pointer.lastMidi = node.midi;
      this.playNode(index, 0.32);
    }
  }

  openRadial() {
    if (!this.pointer) return;
    const nodeIndex = this.pointer.nodeIndex;
    const center = this.nodePoint(this.nodes[nodeIndex]);
    this.radial = { nodeIndex, center, selected: this.nodes[nodeIndex].degree };
    this.updateRadialSelection(this.pointer.current);
  }

  updateRadialSelection(point) {
    if (!this.radial) return;
    const dx = point.x - this.radial.center.x;
    const dy = point.y - this.radial.center.y;
    if (Math.hypot(dx, dy) < 28) return;
    const normalized = (Math.atan2(dy, dx) + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
    this.radial.selected = Math.round(normalized / (Math.PI * 2) * 8) % 8;
  }

  commitRadial() {
    if (!this.radial) return;
    const node = this.nodes[this.radial.nodeIndex];
    const scaleLength = SCALES[this.scaleName].steps.length;
    node.degree = this.radial.selected % scaleLength;
    node.octaveLift = this.radial.selected >= scaleLength ? 1 : 0;
    this.tuneNode(node);
    this.playNode(this.radial.nodeIndex, 0.85);
    this.status.textContent = `${noteName(node.midi)} · degree ${this.radial.selected + 1}`;
  }

  degreeAndMidiFromY(y, forcedDegree = null, octaveLift = 0) {
    const scale = SCALES[this.scaleName].steps;
    const target = 84 - clamp(y, 0, 1) * 36;
    let best = { midi: 60, degree: 0, distance: Infinity };
    for (let octave = 2; octave <= 7; octave += 1) {
      scale.forEach((step, degree) => {
        if (forcedDegree !== null && degree !== forcedDegree) return;
        const midi = 12 * (octave + 1) + this.key + step;
        const distance = Math.abs(midi - target);
        if (distance < best.distance) best = { midi, degree, distance };
      });
    }
    best.midi += octaveLift * 12;
    return best;
  }

  tuneNode(node) { node.midi = this.degreeAndMidiFromY(node.y, node.degree, node.octaveLift || 0).midi; }

  retuneNodes() {
    const scaleLength = SCALES[this.scaleName].steps.length;
    this.nodes.forEach((node) => { node.degree %= scaleLength; this.tuneNode(node); });
    if (this.nodes.length) this.playNode(0, 0.55);
  }

  addNode(point, announce = true) {
    const normalizedY = clamp(point.y / this.height, 0.12, 0.9);
    const tuning = this.degreeAndMidiFromY(normalizedY);
    const node = {
      x: clamp(point.x / this.width, 0.04, 0.96), y: normalizedY, degree: tuning.degree,
      octaveLift: 0, midi: tuning.midi, born: performance.now(), hit: 0,
      grabbed: 0, dropped: 0, moved: 0, visits: 0,
    };
    this.nodes.push(node);
    const index = this.nodes.length - 1;
    this.playNode(index, 0.72);
    if (announce) this.status.textContent = `${noteName(node.midi)} · node ${index + 1}`;
    if (this.nodes.length === 2) this.startPulse();
    return index;
  }

  startPulse() {
    if (this.nodes.length < 2) return;
    this.nodes.forEach((node) => { node.visits = 0; });
    this.nodes[0].visits = 1;
    this.pulse = { from: 0, to: this.chooseNextNode(0, -1), previous: -1, progress: 0 };
    this.isPlaying = true;
    this.updateTransport();
    this.playNode(0, 0.86);
    this.status.textContent = 'pattern playing';
  }

  playNode(index, strength = 0.75) {
    const node = this.nodes[index];
    if (!node) return;
    node.hit = performance.now();
    this.synth.play(midiToFrequency(node.midi), strength);
  }

  chooseNextNode(current, previous) {
    if (this.nodes.length < 2) return current;
    if (this.nodes.length === 2) return current === 0 ? 1 : 0;
    let candidates = this.nodes
      .map((node, index) => ({ node, index }))
      .filter(({ index }) => index !== current && index !== previous);
    const minimumVisits = Math.min(...candidates.map(({ node }) => node.visits || 0));
    const leastVisited = candidates.filter(({ node }) => (node.visits || 0) === minimumVisits);
    if (leastVisited.length) candidates = leastVisited;
    const origin = this.nodePoint(this.nodes[current]);
    candidates.forEach((candidate) => {
      const point = this.nodePoint(candidate.node);
      const distance = Math.hypot(point.x - origin.x, point.y - origin.y);
      candidate.score = distance * (0.72 + Math.random() * 0.56);
    });
    candidates.sort((a, b) => a.score - b.score);
    const pool = candidates.slice(0, Math.min(3, candidates.length));
    return pool[Math.floor(Math.random() * pool.length)].index;
  }

  advancePulse(deltaSeconds) {
    if (!this.isPlaying || !this.pulse || this.nodes.length < 2) return;
    const from = this.nodePoint(this.nodes[this.pulse.from]);
    const to = this.nodePoint(this.nodes[this.pulse.to]);
    const distance = Math.max(38, Math.hypot(to.x - from.x, to.y - from.y));
    const travelDuration = clamp(distance / this.speed, 0.16, 0.86);
    this.pulse.progress += deltaSeconds / travelDuration;
    if (this.pulse.progress >= 1) {
      this.playNode(this.pulse.to, 0.82);
      this.nodes[this.pulse.to].visits = (this.nodes[this.pulse.to].visits || 0) + 1;
      const previous = this.pulse.from;
      this.pulse.from = this.pulse.to;
      this.pulse.previous = previous;
      this.pulse.to = this.chooseNextNode(this.pulse.from, previous);
      this.pulse.progress = 0;
    }
  }

  toggleTransport() {
    this.synth.ensure();
    if (this.nodes.length < 2) {
      this.status.textContent = 'place two notes to begin';
      return;
    }
    if (!this.pulse) {
      this.nodes.forEach((node) => { node.visits = 0; });
      this.nodes[0].visits = 1;
      this.pulse = { from: 0, to: this.chooseNextNode(0, -1), previous: -1, progress: 0 };
      this.isPlaying = true;
      this.playNode(0, 0.86);
    } else {
      this.isPlaying = !this.isPlaying;
    }
    this.updateTransport();
    this.status.textContent = this.isPlaying ? 'pattern playing' : 'pattern paused';
  }

  updateTransport() {
    this.transportControl.textContent = this.isPlaying ? 'pause' : 'play';
    this.transportControl.setAttribute('aria-pressed', String(!this.isPlaying));
  }

  async toggleRecording() {
    if (this.synth.recording) {
      this.recordingBlob = this.synth.stopRecording();
      this.root.dataset.recording = 'false';
      this.recordControl.textContent = 'record';
      this.recordControl.setAttribute('aria-pressed', 'false');
      this.downloadControl.disabled = !this.recordingBlob;
      this.status.textContent = this.recordingBlob ? 'recording ready · download WAV' : 'nothing was recorded';
      return;
    }
    if (this.downloadUrl) { URL.revokeObjectURL(this.downloadUrl); this.downloadUrl = ''; }
    this.recordingBlob = null;
    this.downloadControl.disabled = true;
    const started = await this.synth.startRecording();
    if (!started) { this.status.textContent = 'audio recording is unavailable'; return; }
    if (this.nodes.length >= 2 && !this.isPlaying) this.toggleTransport();
    this.root.dataset.recording = 'true';
    this.recordControl.textContent = 'finish';
    this.recordControl.setAttribute('aria-pressed', 'true');
    this.status.textContent = 'recording · press finish when ready';
  }

  downloadRecording() {
    if (!this.recordingBlob) return;
    if (this.downloadUrl) URL.revokeObjectURL(this.downloadUrl);
    this.downloadUrl = URL.createObjectURL(this.recordingBlob);
    const link = document.createElement('a');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    link.href = this.downloadUrl;
    link.download = `stargaze-music-box-${stamp}.wav`;
    link.click();
    this.status.textContent = 'WAV downloaded';
  }

  toggleSettings() {
    const open = this.settingsPanel.dataset.open !== 'true';
    this.settingsPanel.dataset.open = String(open);
    this.settingsControl.setAttribute('aria-pressed', String(open));
  }

  clear() {
    this.nodes = [];
    this.pulse = null;
    this.radial = null;
    this.status.textContent = 'place two notes to begin';
  }

  accent() { return getComputedStyle(this.root).getPropertyValue('--music-accent').trim() || '#58d7bd'; }

  drawBackground(ctx) {
    const gap = Math.max(46, Math.min(72, this.width / 13));
    ctx.fillStyle = 'rgba(245, 243, 239, 0.07)';
    for (let x = gap * 0.6; x < this.width; x += gap) {
      for (let y = gap * 0.6; y < this.height; y += gap) {
        ctx.beginPath();
        ctx.arc(x, y, 0.75, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  drawConnections(ctx) {
    if (this.nodes.length < 2) return;
    const drawn = new Set();
    ctx.lineWidth = 1;
    this.nodes.forEach((node, index) => {
      const from = this.nodePoint(node);
      let nearest = null;
      let nearestDistance = Infinity;
      this.nodes.forEach((candidate, candidateIndex) => {
        if (candidateIndex === index) return;
        const point = this.nodePoint(candidate);
        const distance = Math.hypot(point.x - from.x, point.y - from.y);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = { candidateIndex, point };
        }
      });
      if (!nearest) return;
      const key = [index, nearest.candidateIndex].sort((a, b) => a - b).join(':');
      if (drawn.has(key)) return;
      drawn.add(key);
      ctx.strokeStyle = 'rgba(245, 243, 239, 0.11)';
      ctx.setLineDash([2, 9]);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(nearest.point.x, nearest.point.y);
      ctx.stroke();
    });
    if (this.pulse) {
      const from = this.nodePoint(this.nodes[this.pulse.from]);
      const to = this.nodePoint(this.nodes[this.pulse.to]);
      ctx.setLineDash([]);
      ctx.strokeStyle = this.accent();
      ctx.globalAlpha = 0.22;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.setLineDash([]);
  }

  drawNodes(ctx, now) {
    const accent = this.accent();
    this.nodes.forEach((node, index) => {
      const point = this.nodePoint(node);
      const age = Math.min(1, (now - node.born) / 350);
      const hitAge = (now - node.hit) / 1000;
      const bloom = hitAge >= 0 && hitAge < 0.65 ? (1 - hitAge / 0.65) * 18 : 0;
      const dropAge = (now - Math.max(node.dropped || 0, node.grabbed || 0)) / 1000;
      const settle = dropAge >= 0 && dropAge < 0.28 ? Math.sin((dropAge / 0.28) * Math.PI) * 3 : 0;
      const isHeld = this.pointer?.nodeIndex === index && !this.radial;
      const radius = ((index === this.hoveredNode || isHeld) ? 11 : 8) * age + settle;
      if (bloom > 0) {
        ctx.beginPath(); ctx.arc(point.x, point.y, 10 + bloom, 0, Math.PI * 2);
        ctx.strokeStyle = accent; ctx.globalAlpha = Math.max(0, 0.42 - hitAge * 0.6); ctx.stroke(); ctx.globalAlpha = 1;
      }
      ctx.save();
      ctx.shadowBlur = isHeld ? 22 : 10;
      ctx.shadowColor = index === 0 || isHeld ? accent : 'rgba(245, 243, 239, 0.35)';
      ctx.beginPath(); ctx.arc(point.x, point.y, radius + 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(8, 8, 8, 0.86)'; ctx.fill();
      ctx.strokeStyle = index === 0 || isHeld ? accent : 'rgba(245, 243, 239, 0.34)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.arc(point.x, point.y, Math.max(2.5, radius * 0.42), 0, Math.PI * 2);
      ctx.fillStyle = index === 0 || index === this.hoveredNode || isHeld ? accent : '#f5f3ef'; ctx.fill();
      ctx.restore();
      if (index === this.hoveredNode || isHeld) {
        ctx.fillStyle = 'rgba(245, 243, 239, 0.62)';
        ctx.font = '8px "Space Mono", monospace'; ctx.textAlign = 'center';
        ctx.fillText(noteName(node.midi), point.x, point.y + radius + 22);
      }
    });
  }

  drawPulse(ctx) {
    if (!this.pulse || this.nodes.length < 2) return;
    const from = this.nodePoint(this.nodes[this.pulse.from]);
    const to = this.nodePoint(this.nodes[this.pulse.to]);
    const t = this.reducedMotion ? 1 : this.pulse.progress;
    const x = from.x + (to.x - from.x) * t;
    const y = from.y + (to.y - from.y) * t;
    const accent = this.accent();
    const glow = ctx.createRadialGradient(x, y, 0, x, y, 24);
    glow.addColorStop(0, accent); glow.addColorStop(0.18, accent); glow.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.arc(x, y, 24, 0, Math.PI * 2); ctx.fillStyle = glow; ctx.globalAlpha = 0.34; ctx.fill(); ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fillStyle = this.isPlaying ? '#f5f3ef' : accent; ctx.fill();
  }

  drawRadial(ctx) {
    if (!this.radial) return;
    const { center, selected, nodeIndex } = this.radial;
    const node = this.nodes[nodeIndex];
    const radius = 62;
    const accent = this.accent();
    ctx.fillStyle = 'rgba(8, 8, 8, 0.9)';
    ctx.beginPath(); ctx.arc(center.x, center.y, 86, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(245, 243, 239, 0.16)'; ctx.beginPath(); ctx.arc(center.x, center.y, radius, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 8; i += 1) {
      const angle = -Math.PI / 2 + i * Math.PI * 2 / 8;
      const x = center.x + Math.cos(angle) * radius;
      const y = center.y + Math.sin(angle) * radius;
      const active = i === selected;
      ctx.beginPath(); ctx.arc(x, y, active ? 15 : 12, 0, Math.PI * 2);
      ctx.fillStyle = active ? accent : '#111'; ctx.fill();
      ctx.strokeStyle = active ? accent : 'rgba(245, 243, 239, 0.34)'; ctx.stroke();
      ctx.fillStyle = active ? '#080808' : '#f5f3ef';
      ctx.font = '9px "Space Mono", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(DEGREE_LABELS[i], x, y + 0.5);
    }
    ctx.fillStyle = 'rgba(245, 243, 239, 0.62)'; ctx.font = '8px "Space Mono", monospace';
    ctx.fillText(noteName(node.midi), center.x, center.y); ctx.textBaseline = 'alphabetic';
  }

  animate(now) {
    const delta = Math.min(0.05, (now - this.lastFrame) / 1000);
    this.lastFrame = now;
    if (this.visible) this.advancePulse(delta);
    const ctx = this.context;
    ctx.clearRect(0, 0, this.width, this.height);
    this.drawBackground(ctx);
    this.drawConnections(ctx);
    this.drawPulse(ctx);
    this.drawNodes(ctx, now);
    this.drawRadial(ctx);
    this.frameRequest = requestAnimationFrame(this.tick);
  }

  visibilityChange() {
    this.visible = !document.hidden;
    this.lastFrame = performance.now();
    if (!this.visible && this.synth.context?.state === 'running') this.synth.context.suspend();
  }

  destroy() {
    cancelAnimationFrame(this.frameRequest);
    clearTimeout(this.longPressTimer);
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('visibilitychange', this.onVisibility);
    if (this.downloadUrl) URL.revokeObjectURL(this.downloadUrl);
    this.synth.close();
    this.root.remove();
  }
}

export function mountPreview(canvas) {
  if (!canvas) return () => {};
  const context = canvas.getContext('2d');
  const parent = canvas.parentElement;
  const anchors = [
    [.16, .58, .2], [.31, .27, 1.4], [.47, .63, 2.6],
    [.64, .34, 3.5], [.83, .55, 4.7], [.69, .78, 5.6],
  ];
  const route = [0, 2, 5, 1, 4, 3];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width = 0;
  let height = 0;
  let frame = 0;
  let running = true;
  let visible = true;

  const resize = () => {
    const rect = parent.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const draw = (now = 0) => {
    if (!running) return;
    context.clearRect(0, 0, width, height);
    const style = getComputedStyle(canvas);
    const accent = style.getPropertyValue('--card-accent').trim()
      || style.getPropertyValue('--accent').trim()
      || '#e7bd6d';
    const time = reducedMotion ? 1200 : now;
    const coords = anchors.map(([x, y, phase]) => [
      (x + Math.cos(time * .00042 + phase) * .018) * width,
      (y + Math.sin(time * .00034 + phase * 1.3) * .025) * height,
    ]);
    const centerX = width * .5;
    const centerY = height * .53;
    const field = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * .58);
    field.addColorStop(0, `${accent}17`);
    field.addColorStop(.48, `${accent}08`);
    field.addColorStop(1, 'transparent');
    context.fillStyle = field;
    context.fillRect(0, 0, width, height);

    context.save();
    context.globalCompositeOperation = 'lighter';
    context.lineWidth = 1;
    coords.forEach(([x, y], index) => {
      const next = coords[(index + 2) % coords.length];
      const bend = Math.sin(time * .0005 + index) * Math.min(width, height) * .08;
      context.strokeStyle = index % 2 ? 'rgba(242,240,234,.13)' : accent;
      context.globalAlpha = index % 2 ? .55 : .16;
      context.beginPath();
      context.moveTo(x, y);
      context.quadraticCurveTo(centerX + bend, centerY - bend * .45, next[0], next[1]);
      context.stroke();
    });

    const loop = reducedMotion ? .38 : (time * .00027) % 1;
    const scaled = loop * route.length;
    const routePosition = Math.floor(scaled) % route.length;
    const fromIndex = route[routePosition];
    const toIndex = route[(routePosition + 1) % route.length];
    const rawAmount = scaled - Math.floor(scaled);
    const amount = rawAmount * rawAmount * (3 - 2 * rawAmount);
    const from = coords[fromIndex];
    const to = coords[toIndex];
    const x = from[0] + (to[0] - from[0]) * amount;
    const y = from[1] + (to[1] - from[1]) * amount;

    coords.forEach(([nodeX, nodeY], index) => {
      const distanceToPulse = Math.hypot(nodeX - x, nodeY - y);
      const response = Math.max(0, 1 - distanceToPulse / Math.max(90, width * .25));
      const breathe = 1 + Math.sin(time * .0015 + index * 1.7) * .12;
      context.globalAlpha = .18 + response * .28;
      context.strokeStyle = index % 2 ? '#f2f0ea' : accent;
      context.beginPath();
      context.arc(nodeX, nodeY, (13 + response * 22) * breathe, 0, Math.PI * 2);
      context.stroke();
      context.globalAlpha = .72 + response * .28;
      context.fillStyle = index % 2 ? '#f2f0ea' : accent;
      context.beginPath();
      context.arc(nodeX, nodeY, 2.2 + response * 1.7, 0, Math.PI * 2);
      context.fill();
    });

    for (let trail = 10; trail >= 0; trail -= 1) {
      const trailAmount = Math.max(0, amount - trail * .024);
      const trailX = from[0] + (to[0] - from[0]) * trailAmount;
      const trailY = from[1] + (to[1] - from[1]) * trailAmount;
      context.globalAlpha = (1 - trail / 11) * .12;
      context.fillStyle = accent;
      context.beginPath();
      context.arc(trailX, trailY, 2 + (1 - trail / 11) * 2.5, 0, Math.PI * 2);
      context.fill();
    }

    const pulse = context.createRadialGradient(x, y, 0, x, y, 38);
    pulse.addColorStop(0, '#f2f0ea');
    pulse.addColorStop(.12, accent);
    pulse.addColorStop(1, 'transparent');
    context.globalAlpha = .82;
    context.fillStyle = pulse;
    context.beginPath();
    context.arc(x, y, 38, 0, Math.PI * 2);
    context.fill();
    context.restore();
    context.globalAlpha = 1;

    if (!reducedMotion && visible) frame = requestAnimationFrame(draw);
  };

  const resizeObserver = new ResizeObserver(() => { resize(); draw(performance.now()); });
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    cancelAnimationFrame(frame);
    if (visible && running && !reducedMotion) frame = requestAnimationFrame(draw);
  });
  resizeObserver.observe(parent);
  intersectionObserver.observe(canvas);
  resize();
  draw(performance.now());

  return () => {
    running = false;
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
  };
}

export function mount(container) {
  if (!container) throw new Error('Music Box needs a container element.');
  cleanup();
  ensureStyles();
  activeInstance = new MusicBox(container);
  return activeInstance;
}

export function cleanup() {
  if (!activeInstance) return;
  activeInstance.destroy();
  activeInstance = null;
}

// Adapter expected by the Stargaze inline-sketch loader.
// The loader calls the default export and stores the returned cleanup function.
export default async function mountInline(container) {
  mount(container);
  return cleanup;
}
