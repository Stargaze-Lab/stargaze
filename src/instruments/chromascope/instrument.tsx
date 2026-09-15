"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

type Material = "solid" | "glass" | "glow";
type Point = { x: number; y: number };
type Shape = { id: number; points: Point[]; color: string; material: Material };
type Piece = {
  shapeId: number; x: number; y: number; vx: number; vy: number;
  angle: number; angular: number; radius: number; scale: number;
};

const palettes = [
  { name: "Solar", colors: ["#ffb000", "#ff5e3a", "#f7d66d", "#7c274c"] },
  { name: "Tidal", colors: ["#47c6c0", "#2b6cb0", "#9ee6cf", "#7050c8"] },
  { name: "Mineral", colors: ["#b6ff6b", "#3dcf8e", "#4b55d4", "#d65db1"] },
  { name: "Ember", colors: ["#ffcf70", "#fe7f2d", "#d6285f", "#6b2d5c"] },
];

function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function normalizePoints(points: Point[]) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const size = Math.max(maxX - minX, maxY - minY, 10);
  return points.map((p) => ({
    x: (p.x - (minX + maxX) / 2) / size,
    y: (p.y - (minY + maxY) / 2) / size,
  }));
}

function shapePath(context: CanvasRenderingContext2D, points: Point[]) {
  if (points.length < 3) return;
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
  context.closePath();
}

function DrawPad({ color, material, shape, onComplete, onEdit, label }: {
  color: string; material: Material; shape?: Shape; onComplete: (points: Point[]) => void;
  onEdit: (points: Point[]) => void; label: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<Point[]>([]);
  const gesture = useRef<{id: number; vertex: number} | null>(null);
  const render = useCallback(() => {
    const canvas=canvasRef.current;if(!canvas)return;
    const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);
    const ctx=canvas.getContext("2d");if(!ctx)return;ctx.scale(dpr,dpr);
    const size=rect.width*.72;
    const points=pointsRef.current.length?pointsRef.current:shape?.points.map(p=>({x:rect.width/2+p.x*size,y:rect.height/2+p.y*size}))||[];
    if(points.length>2){shapePath(ctx,points);ctx.fillStyle=material==="glass"?hexToRgba(color,.58):color;
      if(material==="glow"){ctx.shadowColor=color;ctx.shadowBlur=22;}ctx.fill();ctx.shadowBlur=0;
      if(shape&&!pointsRef.current.length)points.forEach((p,i)=>{if(i%Math.max(1,Math.floor(points.length/18))===0){ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fillStyle="#f4f0e8";ctx.fill();}});
    }
  },[color,material,shape]);
  useEffect(()=>{render();const observer=new ResizeObserver(render);if(canvasRef.current)observer.observe(canvasRef.current);return()=>observer.disconnect();},[render]);
  const point=(e:React.PointerEvent<HTMLCanvasElement>)=>{const r=e.currentTarget.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};};
  return <canvas ref={canvasRef} className="draw-pad" aria-label={label}
    onPointerDown={e=>{if(e.button!==0||gesture.current)return;e.currentTarget.setPointerCapture(e.pointerId);const pt=point(e),r=e.currentTarget.getBoundingClientRect();let vertex=-1,dist=18;
      shape?.points.forEach((p,i)=>{const d=Math.hypot(pt.x-r.width/2-p.x*r.width*.72,pt.y-r.height/2-p.y*r.width*.72);if(d<dist){vertex=i;dist=d;}});
      gesture.current={id:e.pointerId,vertex};if(vertex<0)pointsRef.current=[pt];render();}}
    onPointerMove={e=>{const g=gesture.current;if(!g||g.id!==e.pointerId)return;const pt=point(e);
      if(g.vertex>=0&&shape){const r=e.currentTarget.getBoundingClientRect(),points=shape.points.map(p=>({...p}));points[g.vertex]={x:Math.max(-.62,Math.min(.62,(pt.x-r.width/2)/(r.width*.72))),y:Math.max(-.62,Math.min(.62,(pt.y-r.height/2)/(r.width*.72)))};onEdit(points);}
      else{const prev=pointsRef.current.at(-1);if(!prev||Math.hypot(pt.x-prev.x,pt.y-prev.y)>3){pointsRef.current.push(pt);render();}}}}
    onPointerUp={e=>{const g=gesture.current;if(!g||g.id!==e.pointerId)return;gesture.current=null;
      if(g.vertex<0&&pointsRef.current.length>5){const points=pointsRef.current;onComplete(points.filter((_,i)=>i%Math.max(1,Math.ceil(points.length/90))===0));}pointsRef.current=[];render();}}
    onPointerCancel={()=>{gesture.current=null;pointsRef.current=[];render();}} />;
}

function polar(radius:number,degrees:number){const a=degrees*Math.PI/180;return{x:360+radius*Math.cos(a),y:360+radius*Math.sin(a)};}
function arc(radius:number,start:number,end:number){const a=polar(radius,start),b=polar(radius,end);return `M ${a.x} ${a.y} A ${radius} ${radius} 0 ${end-start>180?1:0} 1 ${b.x} ${b.y}`;}
function ArcButton({angle,label,onClick,disabled=false,active=false,icon=false}:{angle:number;label:string;onClick:()=>void;disabled?:boolean;active?:boolean;icon?:boolean}){
  const id=useId().replace(/:/g,"");const start=angle-20,end=angle+20;
  const a=polar(323,start),b=polar(323,end),c=polar(263,end),d=polar(263,start);
  const bottom=Math.sin(angle*Math.PI/180)>.1;
  const pa=polar(288,bottom?end:start),pb=polar(288,bottom?start:end);
  return <g className={`arc-button${active?" active":""}`} role="button" tabIndex={disabled?-1:0} aria-label={label} aria-disabled={disabled} aria-pressed={active}
    onClick={()=>{if(!disabled)onClick();}} onKeyDown={e=>{if(["Enter"," "].includes(e.key)){e.preventDefault();e.stopPropagation();if(!disabled)onClick();}}}>
    <title>{label}</title>
    <path className="arc-indicator" d={arc(267,angle-4,angle+4)}/>
    <path className="arc-hit" d={`M${a.x} ${a.y} A323 323 0 0 1 ${b.x} ${b.y} L${c.x} ${c.y} A263 263 0 0 0 ${d.x} ${d.y} Z`}/>
    <defs><path id={id} d={`M${pa.x} ${pa.y} A288 288 0 0 ${bottom?0:1} ${pb.x} ${pb.y}`}/></defs>
    {icon?<g className="clear-icon" transform={`translate(${polar(288,angle).x},${polar(288,angle).y})`} aria-hidden="true">
      <path d="M-11 -8 H11 M-4 -8 V-12 H4 V-8 M-8 -8 L-7 12 H7 L8 -8 M-3 -3 V7 M3 -3 V7"/>
    </g>:<text dy={bottom?4:4}><textPath href={`#${id}`} startOffset="50%" textAnchor="middle">{label}</textPath></text>}
  </g>;
}

export default function Chromascope({language="pt"}:{language?:"pt"|"en"}) {
  const tr=(pt:string,en:string)=>language==="pt"?pt:en;
  const uid=useId().replace(/:/g,"");
  const [mode,setMode]=useState<"edit"|"view">("edit");
  const [selectedId,setSelectedId]=useState<number|null>(null);
  const [notice,setNotice]=useState("");
  const modeRef=useRef(mode);
  useEffect(()=>{modeRef.current=mode;},[mode]);
  const displayRef = useRef<HTMLCanvasElement>(null);
  const sourceRef = useRef<HTMLCanvasElement | null>(null);
  const shapesRef = useRef<Shape[]>([]);
  const piecesRef = useRef<Piece[]>([]);
  const rotationRef = useRef(0);
  const rotationMarkRef = useRef<SVGGElement>(null);
  const draggingRef = useRef<{ angle: number; pointerId: number } | null>(null);
  const nextIdRef = useRef(1);
  const facetsRef = useRef(12);
  const densityRef = useRef(5);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [colorIndex, setColorIndex] = useState(0);
  const [material, setMaterial] = useState<Material>("glass");
  const [facets, setFacets] = useState(12);
  const [density, setDensity] = useState(5);
  const [isDragging, setIsDragging] = useState(false);
  const palette = palettes[paletteIndex];
  const selected=shapes.find(s=>s.id===selectedId);
  const activeColor = selected?.color || palette.colors[colorIndex % palette.colors.length];

  const spawnPiece = useCallback((shapeId: number, index = 0): Piece => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 0.08 + Math.random() * 0.34;
    return {
      shapeId, x: Math.cos(angle) * distance + (index % 2 ? 0.05 : -0.05),
      y: Math.sin(angle) * distance - 0.24, vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.2, angle: Math.random() * Math.PI * 2,
      angular: (Math.random() - 0.5) * 2.2, radius: 0.055 + Math.random() * 0.028,
      scale: 0.75 + Math.random() * 0.48,
    };
  }, []);

  const rebuildPieces = useCallback((nextShapes: Shape[], nextDensity: number) => {
    piecesRef.current = nextShapes.flatMap((shape) =>
      Array.from({ length: nextDensity }, (_, i) => spawnPiece(shape.id, i)),
    );
  }, [spawnPiece]);

  const editShape=useCallback((patch:Partial<Shape>)=>{
    const next=shapesRef.current.map(s=>s.id===selectedId?{...s,...patch}:s);shapesRef.current=next;setShapes(next);
  },[selectedId]);
  const addShape = useCallback((rawPoints:Point[])=>{
    if(selectedId!==null){editShape({points:normalizePoints(rawPoints)});return;}
    if(shapesRef.current.length>=6){setNotice(tr("6 peças · selecione para editar","6 pieces · select to edit"));return;}
    const shape:Shape={id:nextIdRef.current++,points:normalizePoints(rawPoints),color:activeColor,material};
    const next=[...shapesRef.current,shape];shapesRef.current=next;setShapes(next);
    piecesRef.current.push(...Array.from({length:densityRef.current},(_,i)=>spawnPiece(shape.id,i)));
    setColorIndex(i=>(i+1)%palette.colors.length);setNotice("");
  },[activeColor,material,selectedId,editShape,spawnPiece,palette.colors.length,language]);
  const removeSelected=()=>{
    const next=shapesRef.current.filter(s=>s.id!==selectedId);shapesRef.current=next;setShapes(next);
    piecesRef.current=piecesRef.current.filter(p=>p.shapeId!==selectedId);setSelectedId(null);setNotice("");
  };
  const clearAll=()=>{shapesRef.current=[];piecesRef.current=[];setShapes([]);setSelectedId(null);setMode("edit");setNotice("");};
  const chooseColor=(i:number)=>{setColorIndex(i);if(selectedId!==null)editShape({color:palette.colors[i]});};
  const chooseShape=(shape:Shape)=>{setSelectedId(shape.id);setMaterial(shape.material);setMode("edit");setNotice("");};
  const cycleMaterial=()=>{const list:Material[]=["solid","glass","glow"];const next=list[(list.indexOf(material)+1)%3];setMaterial(next);if(selectedId!==null)editShape({material:next});};
  const shake = useCallback(() => {
    piecesRef.current.forEach((piece) => {
      piece.vx += (Math.random() - 0.5) * 1.4;
      piece.vy += (Math.random() - 0.5) * 1.4;
      piece.angular += (Math.random() - 0.5) * 8;
    });
  }, []);

  useEffect(() => { facetsRef.current = facets; }, [facets]);
  useEffect(() => {
    densityRef.current = density; rebuildPieces(shapesRef.current, density);
  }, [density, rebuildPieces]);

  useEffect(() => {
    const canvas = displayRef.current;
    if (!canvas) return;
    sourceRef.current = document.createElement("canvas");
    let frame = 0;
    let previous = performance.now();

    const render = (time: number) => {
      if(modeRef.current!=="view"||document.hidden){previous=time;frame=requestAnimationFrame(render);return;}
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      const pixelWidth = Math.round(width * dpr), pixelHeight = Math.round(height * dpr);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) { canvas.width = pixelWidth; canvas.height = pixelHeight; }
      const source = sourceRef.current;
      if (!source) return;
      if (source.width !== pixelWidth || source.height !== pixelHeight) { source.width = pixelWidth; source.height = pixelHeight; }
      const dt = Math.min((time - previous) / 1000, 0.032);
      previous = time;
      const gx = Math.sin(rotationRef.current) * 0.7;
      const gy = Math.cos(rotationRef.current) * 0.7;
      const pieces = piecesRef.current;

      pieces.forEach((piece) => {
        piece.vx += gx * dt; piece.vy += gy * dt;
        piece.x += piece.vx * dt; piece.y += piece.vy * dt; piece.angle += piece.angular * dt;
        piece.vx *= Math.pow(0.995,dt*60); piece.vy *= Math.pow(0.995,dt*60); piece.angular *= Math.pow(0.994,dt*60);
        const boundary = 0.82 - piece.radius;
        const distance = Math.hypot(piece.x, piece.y);
        if (distance > boundary) {
          const nx = piece.x / distance, ny = piece.y / distance;
          piece.x = nx * boundary; piece.y = ny * boundary;
          const velocity = piece.vx * nx + piece.vy * ny;
          if (velocity > 0) {
            piece.vx -= velocity * nx * 1.55; piece.vy -= velocity * ny * 1.55;
            piece.angular += (piece.vx * ny - piece.vy * nx) * 1.8;
          }
        }
      });

      for (let aIndex = 0; aIndex < pieces.length; aIndex++) {
        for (let bIndex = aIndex + 1; bIndex < pieces.length; bIndex++) {
          const a = pieces[aIndex], b = pieces[bIndex];
          const dx = b.x - a.x, dy = b.y - a.y;
          const distance = Math.hypot(dx, dy) || 0.001;
          const minimum = (a.radius + b.radius) * 0.82;
          if (distance < minimum) {
            const nx = dx / distance, ny = dy / distance, overlap = (minimum - distance) * 0.5;
            a.x -= nx * overlap; a.y -= ny * overlap; b.x += nx * overlap; b.y += ny * overlap;
            const relative = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
            if (relative < 0) {
              const impulse = -relative * 0.58;
              a.vx -= nx * impulse; a.vy -= ny * impulse; b.vx += nx * impulse; b.vy += ny * impulse;
            }
          }
        }
      }

      const sourceContext = source.getContext("2d"), context = canvas.getContext("2d");
      if (!sourceContext || !context) return;
      const cx = width / 2, cy = height / 2, radius = Math.min(width, height) * 0.495;
      sourceContext.setTransform(dpr, 0, 0, dpr, 0, 0);
      sourceContext.clearRect(0, 0, width, height);
      pieces.forEach((piece) => {
        const shape = shapesRef.current.find((item) => item.id === piece.shapeId);
        if (!shape) return;
        sourceContext.save();
        sourceContext.translate(cx + piece.x * radius, cy + piece.y * radius);
        sourceContext.rotate(piece.angle);
        const size = radius * piece.radius * 4.1 * piece.scale;
        sourceContext.scale(size, size);
        shapePath(sourceContext, shape.points);
        sourceContext.fillStyle = shape.color;
        sourceContext.globalAlpha = shape.material === "solid" ? 0.94 : shape.material === "glass" ? 0.48 : 0.82;
        sourceContext.globalCompositeOperation = shape.material === "solid" ? "source-over" : "screen";
        if (shape.material === "glow") { sourceContext.shadowColor = shape.color; sourceContext.shadowBlur = 0.22; }
        sourceContext.fill(); sourceContext.restore();
      });

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const background = context.createRadialGradient(cx, cy, radius * 0.04, cx, cy, radius * 1.12);
      background.addColorStop(0, "#172329"); background.addColorStop(0.68, "#0a1013"); background.addColorStop(1, "#050708");
      context.fillStyle = background; context.fillRect(0, 0, width, height);
      const count = facetsRef.current, sector = (Math.PI * 2) / count;
      context.save(); context.translate(cx, cy); context.rotate(-Math.PI / 2 + rotationRef.current * 0.05);
      for (let index = 0; index < count; index++) {
        context.save(); context.rotate(index * sector); if (index % 2 === 1) context.scale(1, -1);
        context.beginPath(); context.moveTo(0, 0); context.arc(0, 0, radius, -sector / 2 - 0.004, sector / 2 + 0.004); context.closePath(); context.clip();
        context.rotate(-Math.PI/2); context.drawImage(source, -cx, -cy, width, height); context.restore();
      }
      context.restore();
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => {cancelAnimationFrame(frame);sourceRef.current=null;};
  }, []);

  const pointerAngle=(event:React.PointerEvent<HTMLCanvasElement>)=>{const r=event.currentTarget.getBoundingClientRect();return Math.atan2(event.clientY-r.top-r.height/2,event.clientX-r.left-r.width/2);};
  const rotate=(delta:number)=>{rotationRef.current+=delta;rotationMarkRef.current?.setAttribute("transform",`rotate(${rotationRef.current*180/Math.PI} 360 360)`);piecesRef.current.forEach(p=>{p.vx+=delta*.10;p.angular+=delta*.8;});};
  const beginTurn=(event:React.PointerEvent<HTMLCanvasElement>)=>{if(event.button!==0||draggingRef.current)return;event.currentTarget.setPointerCapture(event.pointerId);draggingRef.current={angle:pointerAngle(event),pointerId:event.pointerId};setIsDragging(true);};
  const turn=(event:React.PointerEvent<HTMLCanvasElement>)=>{const drag=draggingRef.current;if(!drag||drag.pointerId!==event.pointerId)return;const angle=pointerAngle(event);let delta=angle-drag.angle;if(delta>Math.PI)delta-=2*Math.PI;if(delta< -Math.PI)delta+=2*Math.PI;rotate(delta);drag.angle=angle;};
  const endTurn=()=>{draggingRef.current=null;setIsDragging(false);};
  const materialLabel={solid:tr("Sólido","Solid"),glass:tr("Vidro","Glass"),glow:tr("Brilho","Glow")}[material];
  const hint=notice||(mode==="edit"?(selected?tr("Arraste os pontos · ou redesenhe","Drag points · or redraw"):tr("Desenhe uma peça · solte para criar","Draw a piece · release to create")):tr("Arraste em círculo para misturar","Drag in a circle to mix"));
  return <main className="chromascope-shell" aria-label="Chromascope">
    <section className="cosmic-scope" data-mode={mode}>
      <div className="scope-lens">
        <canvas ref={displayRef} className={`scope-canvas${isDragging?" is-dragging":""}`} hidden={mode!=="view"} tabIndex={mode==="view"?0:-1}
          aria-label={tr("Caleidoscópio. Arraste em círculo ou use as setas para girar.","Kaleidoscope. Drag in a circle or use arrow keys to turn.")}
          onPointerDown={beginTurn} onPointerMove={turn} onPointerUp={endTurn} onPointerCancel={endTurn}
          onKeyDown={e=>{if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)){e.preventDefault();e.stopPropagation();rotate(e.key==="ArrowLeft"||e.key==="ArrowDown"?-.15:.15);}}}/>
        {mode==="edit"&&<DrawPad color={activeColor} material={selected?.material||material} shape={selected} onComplete={addShape} onEdit={points=>editShape({points})} label={hint}/>}
        <div className="scope-glass" aria-hidden="true"/>
      </div>
      <svg className="scope-rings" viewBox="0 0 720 720" aria-label={tr("Controles do Chromascope","Chromascope controls")}>
        <defs><path id={`${uid}-title`} d={arc(342,210,330)}/><path id={`${uid}-hint`} d="M18 360 A342 342 0 0 0 702 360"/></defs>
        <g aria-hidden="true" className="astrolabe-graduation">
          <circle className="outer-rim" cx="360" cy="360" r="326"/>
          <circle className="rim-engraving" cx="360" cy="360" r="323"/>
          <circle className="inner-rim" cx="360" cy="360" r="259"/>
          <circle className="rim-engraving" cx="360" cy="360" r="256"/>
          <circle className="lens-rim" cx="360" cy="360" r="223"/>
          <circle className="lens-hairline" cx="360" cy="360" r="219"/>
          {Array.from({length:180},(_,i)=>{const a=polar(320,i*2),b=polar(i%15===0?310:i%5===0?314:317,i*2);return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={i%15===0?"rim-tick major":"rim-tick"}/>;})}
          {Array.from({length:12},(_,i)=>{const p=polar(304,i*30-90);return <text className="degree-mark" key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" transform={`rotate(${i*30} ${p.x} ${p.y})`}>{String(i*30).padStart(3,"0")}</text>;})}
          {Array.from({length:8},(_,i)=><path key={i} className="rim-divider" d={arc(276,i*45-22.5,i*45-21.5)}/>)}
          <g ref={rotationMarkRef} className="rotation-mark" transform={`rotate(${rotationRef.current*180/Math.PI} 360 360)`}>
            <path d="M360 31 L357 24 L363 24 Z"/>
            <path className="rotation-line" d="M360 35 V46"/>
          </g>
        </g>
        {mode==="edit"&&<g className="drawing-guides" aria-hidden="true">
          <circle cx="360" cy="360" r="72"/><circle cx="360" cy="360" r="144"/>
          <path d="M360 151 V569 M151 360 H569"/>
          <path className="origin" d="M356 360 H364 M360 356 V364"/>
        </g>}
        <text className="scope-title"><textPath href={`#${uid}-title`} startOffset="50%" textAnchor="middle">CHROMASCOPE</textPath></text>
        <text className="scope-hint"><textPath href={`#${uid}-hint`} startOffset="50%" textAnchor="middle">{hint}</textPath></text>
        <ArcButton angle={-90} label={mode==="edit"?tr("Explorar","Explore"):tr("Desenhar","Draw")} active onClick={()=>{setMode(mode==="edit"?"view":"edit");setNotice("");}}/>
        <ArcButton angle={-45} label={mode==="edit"?tr("Nova peça","New piece"):tr("Misturar","Shake")} onClick={()=>{if(mode==="edit"){setSelectedId(null);setNotice("");}else shake();}} disabled={mode==="edit"&&shapes.length>=6&&selectedId===null}/>
        <ArcButton angle={0} label={mode==="edit"?materialLabel:`− ${tr("Eixos","Axes")}`} onClick={()=>mode==="edit"?cycleMaterial():setFacets(n=>Math.max(4,n-2))} disabled={mode==="view"&&facets===4}/>
        <ArcButton angle={45} label={mode==="edit"?palette.name:`${facets/2} ${tr("eixos","axes")} +`} onClick={()=>mode==="edit"?(setPaletteIndex(i=>(i+1)%palettes.length),setColorIndex(0)):setFacets(n=>Math.min(24,n+2))} disabled={mode==="view"&&facets===24}/>
        <ArcButton angle={90} icon label={tr("Limpar","Clear")} onClick={clearAll} disabled={!shapes.length}/>
        <ArcButton angle={135} label={mode==="edit"?tr("Apagar","Delete"):`${tr("Cópias","Copies")} ${density}`} onClick={()=>mode==="edit"?removeSelected():setDensity(n=>n>=8?2:n+1)} disabled={mode==="edit"&&selectedId===null}/>
        <ArcButton angle={180} label={mode==="edit"?`${shapes.length}/6 ${tr("peças","pieces")}`:tr("Girar ↶","Turn ↶")} onClick={()=>{if(mode==="edit"){const i=shapes.findIndex(s=>s.id===selectedId);if(shapes.length)chooseShape(shapes[(i+1)%shapes.length]);}else rotate(-.35);}} disabled={mode==="edit"&&!shapes.length}/>
        <ArcButton angle={225} label={mode==="edit"?tr("Desfazer","Undo"):tr("Girar ↷","Turn ↷")} onClick={()=>{if(mode==="edit"){const last=shapesRef.current.at(-1);if(last){const next=shapesRef.current.slice(0,-1);shapesRef.current=next;setShapes(next);piecesRef.current=piecesRef.current.filter(p=>p.shapeId!==last.id);setSelectedId(null);}}else rotate(.35);}} disabled={mode==="edit"&&!shapes.length}/>
        {shapes.map((shape,i)=>{const pos=polar(240,210+i*24);return <g key={shape.id} className={`piece-choice${selectedId===shape.id?" selected":""}`} role="button" tabIndex={0} aria-label={tr(`Editar peça ${i+1}`,`Edit piece ${i+1}`)} aria-pressed={selectedId===shape.id} onClick={()=>chooseShape(shape)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();chooseShape(shape);}}}>
          <circle cx={pos.x} cy={pos.y} r="22"/><polygon points={shape.points.map(p=>`${pos.x+p.x*30},${pos.y+p.y*30}`).join(" ")} fill={shape.color}/></g>;})}
        {mode==="edit"&&palette.colors.map((color,i)=>{const pos=polar(240,55+i*23);return <g key={color} role="button" tabIndex={0} className={`color-choice${activeColor===color?" selected":""}`} aria-label={tr(`Cor ${i+1}`,`Color ${i+1}`)} aria-pressed={activeColor===color} onClick={()=>chooseColor(i)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();chooseColor(i);}}}><circle className="color-hit" cx={pos.x} cy={pos.y} r="22"/><circle cx={pos.x} cy={pos.y} r="12" fill={color}/></g>;})}
      </svg>
      <span className="scope-sr" role="status" aria-live="polite">{hint}</span>
    </section>
  </main>;
}
