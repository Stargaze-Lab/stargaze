import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CircleDotDashed, Power, Radio, RotateCcw, Volume2, VolumeX } from "lucide-react";

import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";

import {tr} from "./language";

const NOTES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B", "C"];
const WHITE_NOTES = [0, 2, 4, 5, 7, 9, 11, 12];
const BLACK_NOTES = [
  { note: 1, left: 1 },
  { note: 3, left: 2 },
  { note: 6, left: 4 },
  { note: 8, left: 5 },
  { note: 10, left: 6 },
];

const INTERVAL_RATIOS: Array<[number, number]> = [
  [1, 1], [15, 16], [8, 9], [5, 6], [4, 5], [3, 4],
  [32, 45], [2, 3], [5, 8], [3, 5], [5, 9], [8, 15], [1, 2],
];

const MIN_SPEED = 30;
const MAX_SPEED = 1000;

function speedToControl(speed: number) {
  return (Math.log(speed / MIN_SPEED) / Math.log(MAX_SPEED / MIN_SPEED)) * 100;
}

function controlToSpeed(value: number) {
  return MIN_SPEED * (MAX_SPEED / MIN_SPEED) ** (value / 100);
}

type Ratio = { x: number; y: number };

type AudioEngine = {
  context: AudioContext;
  master: GainNode;
  oscillators: [OscillatorNode, OscillatorNode, OscillatorNode, OscillatorNode];
};

const AUDIO_LEVEL = 0.11;

function frequency(value: number) {
  return 130.81278265 * 2 ** (value / 12);
}

function idealRatio(xValue: number, yValue: number): Ratio {
  const x = Math.round(xValue);
  const y = Math.round(yValue);
  const base = INTERVAL_RATIOS[Math.abs(y - x)] ?? [1, 1];
  return y >= x ? { x: base[0], y: base[1] } : { x: base[1], y: base[0] };
}

function formatFrequency(value: number) {
  return new Intl.NumberFormat(tr("pt-BR", "en-US"), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function noteReadout(value: number) {
  const nearest = Math.round(value);
  const cents = Math.round((value - nearest) * 100);
  const detune = cents === 0 ? "" : ` ${cents > 0 ? "+" : "−"}${Math.abs(cents)}¢`;
  return `${NOTES[nearest]}${nearest === 12 ? 4 : 3}${detune}`;
}

function Piano({ axis, value, onChange, powered }: {
  axis: "X" | "Y";
  value: number;
  onChange: (value: number) => void;
  powered: boolean;
}) {
  const selected = Math.abs(value - Math.round(value)) < 0.025 ? Math.round(value) : -1;
  return (
    <div className="piano piano-outline" aria-label={`${tr("Teclado cromático do eixo","Chromatic keyboard for axis")} ${axis}`}>
      <div className="white-keys">
        {WHITE_NOTES.map((note) => (
          <button type="button" key={note} disabled={!powered}
            aria-label={`${axis}: ${tr("nota","note")} ${NOTES[note]}${note === 12 ? 4 : 3}`}
            aria-pressed={selected === note} className="piano-key white-key"
            onClick={() => onChange(note)}>
            <span>{NOTES[note]}{note === 12 ? "⁴" : ""}</span>
          </button>
        ))}
      </div>
      {BLACK_NOTES.map(({ note, left }) => (
        <button type="button" key={note} disabled={!powered}
          aria-label={`${axis}: ${tr("nota","note")} ${NOTES[note]}3`} aria-pressed={selected === note}
          className="piano-key black-key"
          style={{ left: `calc(${left} * (100% / 8) - 4.5%)` }}
          onClick={() => onChange(note)}>
          <span>{NOTES[note]}</span>
        </button>
      ))}
    </div>
  );
}

function AxisControl({ axis, value, displayFrequency, onChange, powered }: {
  axis: "X" | "Y";
  value: number;
  displayFrequency: number;
  onChange: (value: number) => void;
  powered: boolean;
}) {
  return (
    <section className="axis-channel" aria-labelledby={`axis-${axis}`}>
      <header className="channel-header">
        <div className="channel-name">
          <span className="axis-letter" aria-hidden="true">{axis}</span>
          <div><p id={`axis-${axis}`}>{tr("SINAL","SIGNAL")} {axis}</p><strong>{noteReadout(value)}</strong></div>
        </div>
        <output>{formatFrequency(displayFrequency)} Hz</output>
      </header>
      <Slider min={0} max={12} step={0.01} value={[value]} disabled={!powered}
        aria-label={`${tr("Frequência contínua do eixo","Continuous frequency for axis")} ${axis}`}
        onValueChange={(next) => onChange(next[0])} className="signal-slider" />
      <Piano axis={axis} value={value} onChange={onChange} powered={powered} />
    </section>
  );
}

function drawGrid(context: CanvasRenderingContext2D, width: number, height: number) {
  context.save();
  context.lineWidth = 1;
  for (let i = 1; i < 10; i += 1) {
    const major = i === 5;
    context.strokeStyle = major ? "rgba(238, 190, 91, 0.105)" : "rgba(238, 190, 91, 0.035)";
    context.beginPath(); context.moveTo((width * i) / 10, 0); context.lineTo((width * i) / 10, height); context.stroke();
    context.beginPath(); context.moveTo(0, (height * i) / 10); context.lineTo(width, (height * i) / 10); context.stroke();
  }
  context.fillStyle = "rgba(255, 222, 150, 0.24)";
  for (let i = 0; i < 54; i += 1) {
    const x = ((i * 97.31) % 100) / 100;
    const y = ((i * 53.77 + 17) % 100) / 100;
    context.beginPath(); context.arc(x * width, y * height, i % 11 === 0 ? 1.2 : 0.55, 0, Math.PI * 2); context.fill();
  }
  context.restore();
}

function LissajousScope({ monochrome = false, xValue, yValue, locked, persistence, speed, phase, setPhase, powered, pulse }: {
  monochrome?: boolean; xValue: number; yValue: number; locked: boolean; persistence: number; speed: number; phase: number;
  setPhase: (value: number) => void; powered: boolean; pulse: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{id:number;x:number;y:number;phase:number}|null>(null);
  const stateRef = useRef({ xValue, yValue, locked, persistence, speed, phase, powered, pulse });

  useEffect(() => { stateRef.current = { xValue, yValue, locked, persistence, speed, phase, powered, pulse }; },
    [xValue, yValue, locked, persistence, speed, phase, powered, pulse]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const trailCanvas = document.createElement("canvas");
    const trailContext = trailCanvas.getContext("2d");
    if (!trailContext) return;
    let frame = 0, width = 0, height = 0;
    let density = 1;
    let lastSignature = "";
    let lastPhase = NaN;
    let history: {values:number[];time:number}[] = [];
    let historyPoints = 0;
    let lastPulse = -1;
    let lastFrameTime = 0;
    let currentT = 0;
    let previousPoint: { x: number; y: number } | null = null;

    const clearTrail = () => {
      trailContext.clearRect(0, 0, width, height);
      currentT = 0;
      history = []; historyPoints = 0; lastPhase = NaN;
      previousPoint = null;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      density = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width; height = rect.height;
      canvas.width = Math.round(width * density); canvas.height = Math.round(height * density);
      trailCanvas.width = canvas.width; trailCanvas.height = canvas.height;
      context.setTransform(density, 0, 0, density, 0, 0);
      trailContext.setTransform(density, 0, 0, density, 0, 0);
      lastSignature = "";
      lastFrameTime = 0;
      clearTrail();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas); resize();

    const animate = (time: number) => {
      const state = stateRef.current;
      context.clearRect(0, 0, width, height);
      context.fillStyle = monochrome ? "#0a0b0c" : "#080a08"; context.fillRect(0, 0, width, height);
      if(monochrome){
        context.strokeStyle='rgba(238,238,235,.12)';context.lineWidth=1;
        context.beginPath();context.moveTo(width*.07,height/2);context.lineTo(width*.93,height/2);
        context.moveTo(width/2,height*.07);context.lineTo(width/2,height*.93);context.stroke();
      }else drawGrid(context, width, height);

      if (state.powered) {
        const ideal = idealRatio(state.xValue, state.yValue);
        const xFrequency = frequency(state.xValue);
        const yFrequency = frequency(state.yValue);
        const freeBase = Math.min(xFrequency, yFrequency);
        const waveX = state.locked ? ideal.x : xFrequency / freeBase;
        const waveY = state.locked ? ideal.y : yFrequency / freeBase;
        const glowScale = Math.max(0.38, Math.min(1, 3 / Math.max(waveX, waveY)));
        const margin = Math.min(width, height) * 0.1;
        const radiusX = Math.max(20, (width - margin * 2) / 2);
        const radiusY = Math.max(20, (height - margin * 2) / 2);
        const centerX = width / 2, centerY = height / 2;
        const pointAt = (t: number) => {
          return {
            x: centerX + Math.sin(waveX * t + state.phase) * radiusX,
            y: centerY + Math.sin(waveY * t) * radiusY,
          };
        };
        const signature = `${width}:${height}:${state.locked}:${waveX}:${waveY}`;

        if (signature !== lastSignature) {
          lastFrameTime = time;
          lastSignature = signature;
          clearTrail();
        }
        if (state.pulse !== lastPulse) {
          lastFrameTime = time;
          lastPulse = state.pulse;
          clearTrail();
        }

        const elapsed = lastFrameTime === 0 ? 0 : Math.min(0.05, Math.max(0, (time - lastFrameTime) / 1000));
        lastFrameTime = time;
        const decaySeconds = 0.45 + 12 * (state.persistence / 100) ** 1.6;
        const fadeAlpha = 1 - Math.exp(-elapsed / decaySeconds);
        const phaseChanged = state.phase !== lastPhase;
        lastPhase = state.phase;
        if (phaseChanged) {trailContext.clearRect(0,0,width,height);previousPoint=pointAt(currentT);}
        if (!phaseChanged && fadeAlpha > 0) {
          trailContext.save();
          trailContext.globalCompositeOperation = "destination-out";
          trailContext.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
          trailContext.fillRect(0, 0, width, height);
          trailContext.restore();
        }

        if (!previousPoint) previousPoint = pointAt(currentT);
        const pixelsPerSecond = Math.min(width, height) * 0.68 * (state.speed / 100);
        let remainingDistance = elapsed * pixelsPerSecond;
        const points = [previousPoint];
        const values = [currentT];
        while (remainingDistance > 0.01 && points.length < 600) {
          const stepDistance = Math.min(3, remainingDistance);
          const dx = Math.cos(waveX * currentT + state.phase) * waveX * radiusX;
          const dy = Math.cos(waveY * currentT) * waveY * radiusY;
          let stepT = Math.min(0.08, stepDistance / Math.max(12, Math.hypot(dx, dy)));
          for (let iteration = 0; iteration < 2; iteration += 1) {
            const candidate = pointAt(currentT + stepT);
            const actualDistance = Math.hypot(candidate.x - points[points.length - 1].x, candidate.y - points[points.length - 1].y);
            stepT = Math.min(0.08, Math.max(0.00001, stepT * stepDistance / Math.max(0.15, actualDistance)));
          }
          currentT += stepT;
          points.push(pointAt(currentT));
          values.push(currentT);
          remainingDistance -= stepDistance;
        }

        const drawTrail = (stroke: string, lineWidth: number, blur: number, path = points, alpha = 1) => {
          if (path.length < 2) return;
          trailContext.save();
          trailContext.globalAlpha = alpha;
          trailContext.strokeStyle = stroke;
          trailContext.lineWidth = lineWidth;
          trailContext.lineCap = "round";
          trailContext.lineJoin = "round";
          trailContext.shadowColor = monochrome ? "#eeefeb" : "#f0ad47";
          trailContext.shadowBlur = blur;
          trailContext.beginPath();
          trailContext.moveTo(path[0].x, path[0].y);
          for (let i = 1; i < path.length; i += 1) trailContext.lineTo(path[i].x, path[i].y);
          trailContext.stroke();
          trailContext.restore();
        };
        while(history.length && (time-history[0].time>decaySeconds*5000 || historyPoints>40000)) {
          historyPoints-=history.shift()!.values.length;
        }
        if(phaseChanged)for(const segment of history){
          const path=segment.values.map(pointAt),alpha=Math.exp(-(time-segment.time)/1000/decaySeconds);
          drawTrail(monochrome ? "rgba(238,239,235,0.08)" : "rgba(239,166,68,0.18)",monochrome?3:6*glowScale,monochrome?8:18*glowScale,path,alpha);
          drawTrail(monochrome ? "rgba(238,239,235,0.8)" : "rgba(255,205,115,0.9)",1.15,monochrome?2:7*glowScale,path,alpha);
        }
        if(values.length>1){history.push({values,time});historyPoints+=values.length;}
        drawTrail(monochrome ? "rgba(238,239,235,0.08)" : "rgba(239, 166, 68, 0.18)", monochrome ? 3 : 6 * glowScale, monochrome ? 8 : 18 * glowScale);
        drawTrail(monochrome ? "rgba(238,239,235,0.8)" : "rgba(255, 205, 115, 0.9)", 1.15, monochrome ? 2 : 7 * glowScale);
        previousPoint = points[points.length - 1];

        context.drawImage(trailCanvas, 0, 0, trailCanvas.width, trailCanvas.height, 0, 0, width, height);

        const point = previousPoint;
        context.save();
        context.fillStyle = monochrome ? "rgba(248,248,244,.98)" : "rgba(255, 238, 188, 0.98)";
        context.shadowColor = monochrome ? "#eeeeeb" : "#ffd58b";
        context.shadowBlur = 24;
        context.beginPath(); context.arc(point.x, point.y, 3.2, 0, Math.PI * 2); context.fill();
        context.strokeStyle = monochrome ? "rgba(238,239,235,.4)" : "rgba(255, 226, 153, 0.34)";
        context.lineWidth = 1;
        context.beginPath(); context.arc(point.x, point.y, monochrome ? 9+Math.sin(time*.002)*2 : 7.5, 0, Math.PI * 2); context.stroke();
        context.restore();
      } else {
        lastSignature = "off";
        lastFrameTime = 0;
        clearTrail();
      }
      frame = requestAnimationFrame(animate);
    };
    animate(performance.now());
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, []);

  const updatePhase = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const drag=dragRef.current;if(!powered||!drag||drag.id!==event.pointerId)return;
    const rect=event.currentTarget.getBoundingClientRect();
    const value=drag.phase+((event.clientX-drag.x)+(event.clientY-drag.y))/Math.max(1,rect.width)*Math.PI*2;
    setPhase((value%(Math.PI*2)+Math.PI*2)%(Math.PI*2));
  };
  return <canvas ref={canvasRef} className="scope-canvas" role="img" tabIndex={0}
    aria-label={tr("Curva de Lissajous. Arraste ou use as setas para alterar a fase sem reiniciar o rastro.","Lissajous curve. Drag or use arrow keys to change phase without restarting the trail.")}
    onPointerDown={event=>{if(!powered||event.button!==0||dragRef.current)return;event.currentTarget.setPointerCapture(event.pointerId);dragRef.current={id:event.pointerId,x:event.clientX,y:event.clientY,phase};}}
    onPointerMove={updatePhase} onPointerUp={()=>{dragRef.current=null;}} onPointerCancel={()=>{dragRef.current=null;}}
    onKeyDown={event=>{if(!powered)return;if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(event.key)){event.preventDefault();event.stopPropagation();const delta=(event.key==="ArrowLeft"||event.key==="ArrowDown")?-.08:.08;setPhase((phase+delta+Math.PI*2)%(Math.PI*2));}}}/>;
}

export function LissajousInstrument({embedded=false}:{embedded?:boolean}={}) {
  const [controlsOpen, setControlsOpen] = useState(false);
  const controlsButton = useRef<HTMLButtonElement>(null);
  const [xValue, setXValue] = useState(0);
  const [yValue, setYValue] = useState(embedded ? 4 : 7);
  const [locked, setLocked] = useState(true);
  const [persistence, setPersistence] = useState(58);
  const [speed, setSpeed] = useState(embedded ? 200 : 100);
  const [phase, setPhase] = useState(embedded ? Math.PI/2 : 0);
  const [powered, setPowered] = useState(true);
  const [pulse, setPulse] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [volume, setVolume] = useState(62);
  const audioRef = useRef<AudioEngine | null>(null);

  const xHz = frequency(xValue), yHz = frequency(yValue);
  const ratio = useMemo(() => idealRatio(xValue, yValue), [xValue, yValue]);
  const audioXHz = xHz;
  const audioYHz = locked ? xHz * (ratio.y / ratio.x) : yHz;
  const audioLevel = AUDIO_LEVEL * (volume / 100) ** 1.6;
  const freeBase = Math.min(xHz, yHz);
  const ratioLabel = locked
    ? `${ratio.x} : ${ratio.y}`
    : `${xHz === freeBase ? "1" : (xHz / freeBase).toFixed(3)} : ${yHz === freeBase ? "1" : (yHz / freeBase).toFixed(3)}`;
  const sendPulse = useCallback(() => {
    if (!powered) return;
    setPulse(performance.now());
    const engine = audioRef.current;
    if (engine && soundEnabled) {
      const now = engine.context.currentTime;
      engine.master.gain.cancelScheduledValues(now);
      engine.master.gain.setValueAtTime(engine.master.gain.value, now);
      engine.master.gain.linearRampToValueAtTime(audioLevel * 1.13, now + 0.06);
      engine.master.gain.setTargetAtTime(audioLevel, now + 0.12, 0.24);
    }
  }, [audioLevel, powered, soundEnabled]);

  const toggleSound = useCallback(async () => {
    if (!powered) return;
    try {
      let engine = audioRef.current;
      if (!engine) {
        const AudioContextConstructor = window.AudioContext ??
          (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextConstructor) throw new Error("Web Audio is unavailable");

        const context = new AudioContextConstructor();
        const master = context.createGain();
        const filter = context.createBiquadFilter();
        const compressor = context.createDynamicsCompressor();
        const xPanner = context.createStereoPanner();
        const yPanner = context.createStereoPanner();
        const xMain = context.createOscillator();
        const yMain = context.createOscillator();
        const xWarmth = context.createOscillator();
        const yWarmth = context.createOscillator();
        const xMainGain = context.createGain();
        const yMainGain = context.createGain();
        const xWarmthGain = context.createGain();
        const yWarmthGain = context.createGain();

        xMain.type = "sine";
        yMain.type = "sine";
        xWarmth.type = "triangle";
        yWarmth.type = "triangle";
        xMain.frequency.value = audioXHz;
        xWarmth.frequency.value = audioXHz;
        yMain.frequency.value = audioYHz;
        yWarmth.frequency.value = audioYHz;
        xMainGain.gain.value = 0.36;
        yMainGain.gain.value = 0.36;
        xWarmthGain.gain.value = 0.025;
        yWarmthGain.gain.value = 0.025;
        xPanner.pan.value = -0.18;
        yPanner.pan.value = 0.18;
        filter.type = "lowpass";
        filter.frequency.value = 1100;
        filter.Q.value = 0.35;
        compressor.threshold.value = -24;
        compressor.knee.value = 18;
        compressor.ratio.value = 4;
        compressor.attack.value = 0.012;
        compressor.release.value = 0.3;
        master.gain.value = 0;

        xMain.connect(xMainGain).connect(xPanner);
        xWarmth.connect(xWarmthGain).connect(xPanner);
        yMain.connect(yMainGain).connect(yPanner);
        yWarmth.connect(yWarmthGain).connect(yPanner);
        xPanner.connect(filter);
        yPanner.connect(filter);
        filter.connect(compressor).connect(master).connect(context.destination);
        xMain.start();
        yMain.start();
        xWarmth.start();
        yWarmth.start();

        engine = { context, master, oscillators: [xMain, yMain, xWarmth, yWarmth] };
        audioRef.current = engine;
      }

      if (engine.context.state === "suspended") await engine.context.resume();
      const nextEnabled = !soundEnabled;
      const now = engine.context.currentTime;
      engine.master.gain.cancelScheduledValues(now);
      engine.master.gain.setValueAtTime(engine.master.gain.value, now);
      engine.master.gain.setTargetAtTime(nextEnabled ? audioLevel : 0, now, nextEnabled ? 0.18 : 0.12);
      setSoundEnabled(nextEnabled);
      setAudioAvailable(true);
    } catch {
      setSoundEnabled(false);
      setAudioAvailable(false);
    }
  }, [audioLevel, audioXHz, audioYHz, powered, soundEnabled]);

  useEffect(() => {
    const engine = audioRef.current;
    if (!engine) return;
    const now = engine.context.currentTime;
    const [xMain, yMain, xWarmth, yWarmth] = engine.oscillators;
    for (const oscillator of [xMain, xWarmth]) {
      oscillator.frequency.cancelScheduledValues(now);
      oscillator.frequency.setTargetAtTime(audioXHz, now, 0.055);
    }
    for (const oscillator of [yMain, yWarmth]) {
      oscillator.frequency.cancelScheduledValues(now);
      oscillator.frequency.setTargetAtTime(audioYHz, now, 0.055);
    }
  }, [audioXHz, audioYHz]);

  useEffect(() => {
    const engine = audioRef.current;
    if (!engine) return;
    const now = engine.context.currentTime;
    engine.master.gain.cancelScheduledValues(now);
    engine.master.gain.setTargetAtTime(powered && soundEnabled ? audioLevel : 0, now, powered ? 0.12 : 0.09);
  }, [audioLevel, powered, soundEnabled]);

  useEffect(() => () => {
    const engine = audioRef.current;
    if (!engine) return;
    for (const oscillator of engine.oscillators) oscillator.stop();
    void engine.context.close();
    audioRef.current = null;
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if(event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.isComposing || event.composedPath().some(target=>target instanceof HTMLElement && (target.isContentEditable || target.matches("button,input,textarea,select,[role=slider],[role=switch]")))) return;
      if (event.code === "Space" && !event.repeat) { event.preventDefault(); sendPulse(); }
      if (event.key.toLowerCase() === "r") { setXValue(0); setYValue(embedded ? 4 : 7); setPhase(embedded ? Math.PI/2 : 0); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sendPulse]);

  return (
    <main className={`observatory-shell ${embedded ? "is-embedded" : ""}`}>
      <div className="ambient-stars" aria-hidden="true" />
      <div className="instrument-frame">
        <section className={`scope-housing ${powered ? "is-powered" : "is-off"}`} aria-label={tr("Osciloscópio","Oscilloscope")}>
          <div className="scope-bezel">
            <LissajousScope monochrome={embedded} xValue={xValue} yValue={yValue} locked={locked} persistence={persistence}
              speed={speed} phase={phase} setPhase={setPhase} powered={powered} pulse={pulse} />
            <div className="scope-glass" aria-hidden="true" /><div className="scanline" aria-hidden="true" />
            <div className="scope-status"><span className="status-dot" />{powered ? tr("SINAL ESTÁVEL","SIGNAL STABLE") : tr("EM ESPERA","STANDBY")}</div>
            <div className="ratio-readout" aria-live="polite"><span>X : Y</span><strong>{ratioLabel}</strong><small>{locked ? tr("TRAVA HARMÔNICA","HARMONIC LOCK") : tr("ÓRBITA ABERTA","OPEN ORBIT")}</small></div>
            <div className="phase-readout"><span>{tr("FASE","PHASE")}</span><strong>{Math.round((phase / (Math.PI * 2)) * 360)}°</strong></div>
            {!powered && <p className="standby-label">{tr("SEM SINAL","NO SIGNAL")}</p>}
          </div>
          <p className="scope-hint">{tr("ARRASTE O CAMPO PARA MUDAR A FASE","DRAG THE FIELD TO SHIFT PHASE")}</p>
        </section>

        {embedded && <button ref={controlsButton} type="button" className="settings-toggle" aria-expanded={controlsOpen}
          aria-controls="lissajous-settings" onClick={()=>setControlsOpen(open=>!open)}>
          {controlsOpen ? tr("Fechar ajustes ×","Close settings ×") : tr("Ajustar +","Settings +")}
        </button>}
        <aside id="lissajous-settings" className="control-panel" hidden={embedded&&!controlsOpen}
          onKeyDown={event=>{if(embedded&&event.key==="Escape"){event.preventDefault();event.stopPropagation();setControlsOpen(false);controlsButton.current?.focus();}}} aria-label={tr("Controles do sinal","Signal controls")}>
          <div className="panel-heading">
            <div><p className="eyebrow">{tr("STARGAZE · ESTUDO LISSAJOUS","STARGAZE · LISSAJOUS STUDY")}</p><h1>{embedded ? "Lissajous" : tr("Oscilador Celeste","Celestial Oscillator")}</h1></div>
            <Button type="button" variant="outline" size="icon-lg" className={`power-button ${powered ? "active" : ""}`}
              onClick={() => setPowered((current) => !current)} aria-label={powered ? tr("Desligar osciloscópio","Turn off oscilloscope") : tr("Ligar osciloscópio","Turn on oscilloscope")} aria-pressed={powered}><Power /></Button>
          </div>
          <AxisControl axis="X" value={xValue} displayFrequency={audioXHz} onChange={setXValue} powered={powered} />
          <AxisControl axis="Y" value={yValue} displayFrequency={audioYHz} onChange={setYValue} powered={powered} />

          <section className="modulation-panel" aria-label={tr("Modulação","Modulation")}>
            <div className="mode-row">
              <div className="mode-copy"><CircleDotDashed aria-hidden="true" /><div><strong>{locked ? tr("TRAVA HARMÔNICA","HARMONIC LOCK") : tr("AFINAÇÃO LIVRE","FREE DRIFT")}</strong><span>{locked ? tr("intervalo puro","pure interval") : tr("sinal em deriva","incommensurate signal")}</span></div></div>
              <Switch checked={locked} onCheckedChange={setLocked} disabled={!powered} aria-label={tr("Alternar trava harmônica","Toggle harmonic lock")} className="mode-switch" />
            </div>
            <div className="phase-control">
              <div><span>{tr("FASE","PHASE")}</span><output>{Math.round((phase / (Math.PI * 2)) * 360)}°</output></div>
              <Slider min={0} max={360} step={1} value={[(phase / (Math.PI * 2)) * 360]}
                onValueChange={(next) => setPhase((next[0] / 360) * Math.PI * 2)} disabled={!powered}
                aria-label={tr("Fase da curva","Curve phase")} className="persistence-slider" />
            </div>
            <div className="persistence-control">
              <div><span>{tr("PERSISTÊNCIA","PERSISTENCE")}</span><output>{persistence}%</output></div>
              <Slider min={8} max={100} step={1} value={[persistence]} onValueChange={(next) => setPersistence(next[0])}
                disabled={!powered} aria-label={tr("Persistência luminosa","Light persistence")} className="persistence-slider" />
            </div>
            <div className="speed-control">
              <div><span>{tr("VELOCIDADE","SPEED")}</span><output>{(speed / 100).toFixed(speed < 100 ? 2 : 1)}×</output></div>
              <Slider min={0} max={100} step={1} value={[speedToControl(speed)]}
                onValueChange={(next) => setSpeed(controlToSpeed(next[0]))}
                disabled={!powered} aria-label={tr("Velocidade do pulso","Pulse speed")} className="persistence-slider" />
            </div>
            <div className="audio-control">
              <div><span>{tr("ÁUDIO","AUDIO")}</span><output aria-live="polite">{audioAvailable ? (soundEnabled ? tr("SOM LIGADO","SIGNAL ON") : tr("SILENCIADO","MUTED")) : tr("INDISPONÍVEL","UNAVAILABLE")}</output></div>
              <Button type="button" variant="outline" onClick={toggleSound} disabled={!powered || !audioAvailable}
                className={`sound-button ${soundEnabled ? "active" : ""}`} aria-pressed={soundEnabled}
                aria-label={soundEnabled ? tr("Silenciar os sinais","Mute signals") : tr("Ouvir os sinais","Listen to signals")}>
                {soundEnabled ? <Volume2 /> : <VolumeX />}{soundEnabled ? tr("SILENCIAR","MUTE") : tr("OUVIR SINAL","LISTEN")}
              </Button>
            </div>
            <div className="volume-control">
              <div><span>{tr("VOLUME","VOLUME")}</span><output>{volume}%</output></div>
              <Slider min={0} max={100} step={1} value={[volume]} onValueChange={(next) => setVolume(next[0])}
                disabled={!powered || !audioAvailable} aria-label={tr("Volume dos sinais","Signal volume")} className="persistence-slider" />
            </div>
          </section>

          <div className="panel-actions">
            <Button type="button" onClick={sendPulse} disabled={!powered} className="pulse-button"><Radio /> {tr("REDESENHAR SINAL","RETRACE SIGNAL")} <kbd>{tr("ESPAÇO","SPACE")}</kbd></Button>
            <Button type="button" variant="ghost" size="icon" disabled={!powered} aria-label={tr("Restaurar sinais","Reset signals")}
              onClick={() => { setXValue(0); setYValue(embedded ? 4 : 7); setPhase(embedded ? Math.PI/2 : 0); }}><RotateCcw /></Button>
          </div>
        </aside>
      </div>
    </main>
  );
}
