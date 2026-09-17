"use client";

import {useCallback,useEffect,useId,useRef,useState} from 'react';
import {Trash2,Undo2,MousePointer2,Minus,Plus,X,RotateCcw} from 'lucide-react';
import {type DrawingAssist,assistDrawing,coastRotation} from './drawing';
import {type Point,type Shape,type Material,type Plate,TAU,palettes,examplePlate,copyPlate,bound,moved,hitShape,area,renderPlate,driftingShapes} from './optics';

type Gesture={id:number;kind:'draw'|'move'|'vertex'|'rotate';start:Point;last:Point;before:Plate;shapeId?:number;vertex?:number;changed:boolean;time?:number;velocity?:number};
const pointOnRing=(r:number,a:number)=>({x:360+r*Math.cos(a*Math.PI/180),y:360+r*Math.sin(a*Math.PI/180)});
function arc(r:number,start:number,end:number,reverse=false){const a=pointOnRing(r,reverse?end:start),b=pointOnRing(r,reverse?start:end);return`M${a.x} ${a.y} A${r} ${r} 0 ${end-start>180?1:0} ${reverse?0:1} ${b.x} ${b.y}`;}
function CurvedControl({angle,label,textLabel,onClick,active=false,disabled=false,pressed,variant='',halfSpan=22}:{angle:number;label:string;textLabel?:string;onClick:()=>void;active?:boolean;disabled?:boolean;pressed?:boolean;variant?:string;halfSpan?:number}){
  const id=useId().replace(/:/g,'');const bottom=Math.sin(angle*Math.PI/180)>.2;
  const a=pointOnRing(323,angle-halfSpan),b=pointOnRing(323,angle+halfSpan),c=pointOnRing(272,angle+halfSpan),d=pointOnRing(272,angle-halfSpan);
  return <g className={`optical-action ${variant}${active?' is-primary':''}`} role="button" aria-pressed={pressed} tabIndex={disabled?-1:0} aria-label={label} aria-disabled={disabled} onClick={()=>{if(!disabled)onClick();}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!disabled)onClick();}}}>
    <title>{label}</title><path className="action-hit" d={`M${a.x} ${a.y} A323 323 0 0 1 ${b.x} ${b.y} L${c.x} ${c.y} A272 272 0 0 0 ${d.x} ${d.y} Z`}/>
    <path className="action-rule" d={arc(280,angle-9,angle+9)}/><defs><path id={id} d={arc(298,angle-25,angle+25,bottom)}/></defs>
    <text dy="4"><textPath href={`#${id}`} startOffset="50%" textAnchor="middle">{textLabel??label}</textPath></text>
  </g>;
}
function IconButton({angle,label,children,onClick,disabled=false,active=false,radius=299}:{angle:number;label:string;children:React.ReactNode;onClick:()=>void;disabled?:boolean;active?:boolean;radius?:number}){
  const p=pointOnRing(radius,angle);
  return <foreignObject x={p.x-25} y={p.y-25} width="50" height="50" className="icon-object"><button className={`optical-icon${active?' active':''}`} type="button" title={label} aria-label={label} disabled={disabled} onClick={onClick}>{children}</button></foreignObject>;
}

export default function Chromascope({language='pt'}:{language?:'pt'|'en'}){
  const tr=(pt:string,en:string)=>language==='pt'?pt:en;
  const uid=useId().replace(/:/g,'');
  const plateRef=useRef<Plate>(examplePlate());
  const canvasRef=useRef<HTMLCanvasElement>(null),markerRef=useRef<SVGGElement>(null);
  const rendererRef=useRef<()=>void>(()=>{}),gestureRef=useRef<Gesture|null>(null),draftRef=useRef<Shape|null>(null);
  const spinRef=useRef({velocity:0,last:0});
  const driftRef=useRef({playing:false,elapsed:0,last:0,base:[] as Shape[]});
  const [flowing,setFlowing]=useState(false);
  const stopDrift=(update=true)=>{driftRef.current.playing=false;driftRef.current.last=0;if(update)setFlowing(false);};
  const stopSpin=()=>{spinRef.current.velocity=0;spinRef.current.last=0;};
  const historyRef=useRef<{plate:Plate;palette:number}[]>([]),nextId=useRef(4),urlsRef=useRef(new Set<string>()),mountedRef=useRef(true);
  const [revision,setRevision]=useState(0),[mode,setMode]=useState<'view'|'edit'>('view'),[tool,setTool]=useState<'draw'|'select'>('draw');
  const [selected,setSelected]=useState<number|null>(null),[palette,setPalette]=useState(0),[color,setColor]=useState(0),[material,setMaterial]=useState<Material>('glass');
  const [assist,setAssist]=useState<DrawingAssist>('auto');
  const [notice,setNotice]=useState(''),[saving,setSaving]=useState(false);
  const uiRef=useRef({mode,tool,selected,palette,color,material});uiRef.current={mode,tool,selected,palette,color,material};
  const shape=plateRef.current.shapes.find(s=>s.id===selected),colors=palettes[palette].colors;
  const change=useCallback(()=>{setRevision(n=>n+1);rendererRef.current();},[]);
  const remember=(before:Plate)=>{historyRef.current.push({plate:before,palette:uiRef.current.palette});if(historyRef.current.length>40)historyRef.current.shift();};
  const edit=(fn:(plate:Plate)=>void)=>{stopSpin();stopDrift();remember(copyPlate(plateRef.current));fn(plateRef.current);setNotice('');change();};
  useEffect(()=>{
    mountedRef.current=true;const canvas=canvasRef.current;if(!canvas)return;const ctx=canvas.getContext('2d');if(!ctx)return;
    let frame=0,disposed=false;
    const draw=(time:number)=>{frame=0;if(disposed)return;
      const spin=spinRef.current;if(spin.velocity){
        if(uiRef.current.mode!=='view'||document.hidden)stopSpin();
        else{const dt=spin.last?Math.min(.064,Math.max(0,(time-spin.last)/1000)):1/60;const next=coastRotation(spin.velocity,dt);plateRef.current.angle=(plateRef.current.angle+next.delta+TAU)%TAU;spin.velocity=next.velocity;spin.last=time;}
      }
      const drift=driftRef.current;if(drift.playing){
        if(uiRef.current.mode!=='view'||document.hidden){stopDrift();}
        else{drift.elapsed+=drift.last?Math.min(.064,Math.max(0,(time-drift.last)/1000)):0;drift.last=time;plateRef.current.shapes=driftingShapes(drift.base,drift.elapsed);}
      }
      const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);if(rect.width<1||rect.height<1)return;
      const w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
      ctx.setTransform(dpr,0,0,dpr,0,0);renderPlate(ctx,rect.width,rect.height,plateRef.current,{edit:uiRef.current.mode==='edit',selected:uiRef.current.tool==='select'?uiRef.current.selected:null,draft:draftRef.current});
      markerRef.current?.setAttribute('transform',`rotate(${plateRef.current.angle*180/Math.PI} 360 360)`);
      if(spinRef.current.velocity||driftRef.current.playing)invalidate();
    };
    const invalidate=()=>{if(!disposed&&!frame)frame=requestAnimationFrame(draw);};rendererRef.current=invalidate;
    const observer=new ResizeObserver(invalidate);observer.observe(canvas);invalidate();
    const visibility=()=>{if(document.hidden){stopSpin();stopDrift();}};document.addEventListener('visibilitychange',visibility);
    return()=>{disposed=true;mountedRef.current=false;stopSpin();stopDrift(false);document.removeEventListener('visibilitychange',visibility);cancelAnimationFrame(frame);observer.disconnect();rendererRef.current=()=>{};for(const url of urlsRef.current)URL.revokeObjectURL(url);urlsRef.current.clear();};
  },[]);
  useEffect(()=>rendererRef.current(),[mode,tool,selected,revision]);
  const point=(e:React.PointerEvent<HTMLCanvasElement>):Point=>{const r=e.currentTarget.getBoundingClientRect(),scale=Math.min(r.width,r.height)*.485;return{x:(e.clientX-r.left-r.width/2)/scale,y:(e.clientY-r.top-r.height/2)/scale};};
  const pick=(id:number|null)=>{setSelected(id);if(id!==null){setTool('select');const s=plateRef.current.shapes.find(s=>s.id===id);if(s)setMaterial(s.material);}setNotice('');};
  const begin=(e:React.PointerEvent<HTMLCanvasElement>)=>{
    if(e.button!==0||gestureRef.current)return;const p=point(e);if(Math.hypot(p.x,p.y)>.99)return;
    stopSpin();stopDrift();setNotice('');e.currentTarget.setPointerCapture(e.pointerId);const before=copyPlate(plateRef.current);
    if(mode==='view'){gestureRef.current={id:e.pointerId,kind:'rotate',start:p,last:p,before,changed:false,time:e.timeStamp,velocity:0};return;}
    if(tool==='draw'){
      if(plateRef.current.shapes.length>=6){setNotice(tr('Seis peças. Apague uma ou ajuste as existentes.','Six pieces. Delete one or edit the existing ones.'));return;}
      draftRef.current={id:nextId.current,points:[bound(p)],color:colors[color],material};gestureRef.current={id:e.pointerId,kind:'draw',start:p,last:p,before,changed:false};rendererRef.current();return;
    }
    let vertex=-1,nearest=.055;shape?.points.forEach((q,i)=>{const distance=Math.hypot(q.x-p.x,q.y-p.y);if(distance<nearest){vertex=i;nearest=distance;}});
    const id=vertex>=0?selected:hitShape(plateRef.current.shapes,p);pick(id);
    if(id!==null)gestureRef.current={id:e.pointerId,kind:vertex>=0?'vertex':'move',start:p,last:p,before,shapeId:id,vertex,changed:false};
  };
  const move=(e:React.PointerEvent<HTMLCanvasElement>)=>{
    const g=gestureRef.current;if(!g||g.id!==e.pointerId)return;const p=bound(point(e));
    if(g.kind==='rotate'){
      let delta=Math.hypot(p.x,p.y)<.15||Math.hypot(g.last.x,g.last.y)<.15?(p.x-g.last.x)*2:Math.atan2(p.y,p.x)-Math.atan2(g.last.y,g.last.x);
      if(delta>Math.PI)delta-=TAU;if(delta< -Math.PI)delta+=TAU;plateRef.current.angle=(plateRef.current.angle+delta+TAU)%TAU;g.changed ||= Math.abs(delta)>.0001;
      const dt=Math.max(8,e.timeStamp-(g.time??e.timeStamp))/1000;
      const velocity=Math.max(-2.2,Math.min(2.2,delta/dt));g.velocity=(g.velocity??0)*.35+velocity*.65;g.time=e.timeStamp;
    }else if(g.kind==='draw'){
      const points=draftRef.current?.points;if(points&&Math.hypot(p.x-g.last.x,p.y-g.last.y)>.009){points.push(p);g.changed=true;}else return;
    }else{
      const current=plateRef.current.shapes.find(s=>s.id===g.shapeId),original=g.before.shapes.find(s=>s.id===g.shapeId);if(!current||!original)return;
      if(g.kind==='move')current.points=moved(original.points,p.x-g.start.x,p.y-g.start.y);
      else{current.points=original.points.map(q=>({...q}));current.points[g.vertex!]=bound(p);}
      g.changed ||= Math.hypot(p.x-g.start.x,p.y-g.start.y)>.004;
    }
    g.last=p;rendererRef.current();
  };
  const finish=(e:React.PointerEvent<HTMLCanvasElement>,cancel=false)=>{
    const g=gestureRef.current;if(!g||g.id!==e.pointerId)return;gestureRef.current=null;
    if(cancel){plateRef.current=g.before;draftRef.current=null;change();return;}
    if(g.kind==='draw'){
      const draft=draftRef.current;draftRef.current=null;
      if(draft&&draft.points.length>=3&&area(draft.points)>.002){const result=assistDrawing(draft.points,assist);draft.points=result.points;remember(g.before);plateRef.current.shapes.push(draft);nextId.current++;setColor(i=>(i+1)%4);setNotice(result.kind==='circle'?tr('Círculo ajustado.','Circle refined.'):result.kind==='polygon'?tr('Retas ajustadas.','Edges refined.'):tr('Traço suavizado.','Contour smoothed.'));}
      else setNotice(tr('Trace uma pequena área, não apenas uma linha.','Draw a small area, not only a line.'));
    }else if(g.changed){remember(g.before);
      if(g.kind==='rotate'&&!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){
        const velocity=(g.velocity??0)*Math.exp(-Math.max(0,e.timeStamp-(g.time??e.timeStamp))/80);
        if(Math.abs(velocity)>.04){spinRef.current={velocity,last:0};}
      }
    }
    change();
  };
  const undo=()=>{stopSpin();stopDrift();const previous=historyRef.current.pop();if(previous){plateRef.current=previous.plate;setPalette(previous.palette);setColor(0);setSelected(null);setNotice('');change();}};
  const clear=()=>{if(!plateRef.current.shapes.length)return;edit(p=>{p.shapes=[];});setSelected(null);setMode('edit');setTool('draw');};
  const remove=()=>{if(selected===null)return;edit(p=>{p.shapes=p.shapes.filter(s=>s.id!==selected);});setSelected(null);};
  const rotate=(delta:number)=>edit(p=>{p.angle=(p.angle+delta+TAU)%TAU;});
  const setAxes=(delta:number)=>{const n=Math.max(2,Math.min(12,plateRef.current.axes+delta));if(n!==plateRef.current.axes)edit(p=>{p.axes=n;});};
  const choosePalette=()=>{const next=(palette+1)%palettes.length;edit(p=>{p.shapes.forEach((s,i)=>s.color=palettes[next].colors[i%4]);});setPalette(next);setColor(0);};
  const chooseColor=(i:number)=>{setColor(i);if(shape&&tool==='select')edit(()=>{shape.color=colors[i];});};
  const cycleMaterial=()=>{const kinds:Material[]=['glass','solid','glow'];const next=kinds[(kinds.indexOf(material)+1)%3];setMaterial(next);if(shape&&tool==='select')edit(()=>{shape.material=next;});};
  const resizeSelected=(factor:number)=>{if(!shape)return;edit(()=>{const center=shape.points.reduce((a,p)=>({x:a.x+p.x/shape.points.length,y:a.y+p.y/shape.points.length}),{x:0,y:0});const points=shape.points.map(p=>({x:center.x+(p.x-center.x)*factor,y:center.y+(p.y-center.y)*factor}));if(points.every(p=>Math.hypot(p.x,p.y)<.97))shape.points=points;});};
  const save=()=>{
    if(saving||!plateRef.current.shapes.length)return;stopSpin();stopDrift();setSaving(true);setNotice('');
    try{const output=document.createElement('canvas');output.width=2048;output.height=2048;const ctx=output.getContext('2d');if(!ctx)throw Error('Canvas');renderPlate(ctx,2048,2048,copyPlate(plateRef.current),{guides:false});
      output.toBlob(blob=>{if(!mountedRef.current)return;setSaving(false);if(!blob){setNotice(tr('Não foi possível salvar. Tente novamente.','Could not save. Please try again.'));return;}for(const previous of urlsRef.current)URL.revokeObjectURL(previous);urlsRef.current.clear();const url=URL.createObjectURL(blob);urlsRef.current.add(url);const link=document.createElement('a');link.href=url;link.download='chromascope.png';document.body.append(link);link.click();link.remove();},'image/png');
    }catch{setSaving(false);setNotice(tr('Não foi possível salvar. Tente novamente.','Could not save. Please try again.'));}
  };
  const switchMode=(next:'edit'|'view')=>{if(next===mode)return;stopSpin();stopDrift();setMode(next);setNotice('');};
  const toggleDrift=()=>{
    stopSpin();if(driftRef.current.playing){stopDrift();change();return;}
    if(!plateRef.current.shapes.length)return;
    remember(copyPlate(plateRef.current));setNotice('');
    const base=copyPlate(plateRef.current).shapes;
    if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){plateRef.current.shapes=driftingShapes(base,1.4);change();return;}
    driftRef.current={playing:true,elapsed:0,last:0,base};setFlowing(true);change();
  };
  const hint=notice||(mode==='view'?(flowing?tr('Peças em movimento suave. Toque para pausar.','Pieces drift gently. Touch to pause.'):tr('Gire e solte. Toque para parar.','Turn and release. Touch to stop.')):(tool==='draw'?(assist==='auto'?tr('Desenhe. Círculos, retas e curvas se ajustam.','Draw. Circles, edges and curves are refined.'):assist==='lines'?tr('Desenhe cantos. O traço vira um polígono.','Draw corners. Your contour becomes a polygon.'):tr('Desenhe livremente. O traço será suavizado.','Draw freely. Your contour will be smoothed.')):tr('Mova as peças ou arraste seus pontos.','Move the pieces or drag their points.')));
  const materialName={glass:tr('Vidro','Glass'),solid:tr('Sólido','Solid'),glow:tr('Luz','Glow')}[material];
  return <main className="chromascope-shell" aria-label="Chromascope">
    <section className="cosmic-scope" data-mode={mode} data-tool={tool}>
      <div className="scope-lens"><canvas ref={canvasRef} className="scope-canvas" tabIndex={0} aria-label={mode==='view'?tr('Reflexos. Arraste para girar, setas para ajustar.','Reflections. Drag to turn, arrow keys to adjust.'):hint}
        onPointerDown={begin} onPointerMove={move} onPointerUp={e=>finish(e)} onPointerCancel={e=>finish(e,true)}
        onKeyDown={e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.stopPropagation();undo();return;}
          if(e.key==='Delete'||e.key==='Backspace'){if(mode==='edit'){e.preventDefault();remove();}return;}
          if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();e.stopPropagation();if(mode==='view')rotate(e.key==='ArrowLeft'||e.key==='ArrowDown'?-.04:.04);else if(shape){const dx=e.key==='ArrowLeft'?-.02:e.key==='ArrowRight'?.02:0,dy=e.key==='ArrowUp'?-.02:e.key==='ArrowDown'?.02:0;edit(()=>{shape.points=moved(shape.points,dx,dy);});}}}}/></div>
      <svg className="scope-rings" viewBox="0 0 720 720" aria-label={tr('Controles da lente','Lens controls')}>
        <defs><path id={`${uid}-title`} d={arc(343,215,325)}/><path id={`${uid}-hint`} d={arc(343,15,165,true)}/></defs>
        <g className="rim" aria-hidden="true"><circle cx="360" cy="360" r="329"/><circle cx="360" cy="360" r="324"/><circle className="aperture-edge" cx="360" cy="360" r="244"/>
          {Array.from({length:120},(_,i)=>{const a=pointOnRing(322,i*3),b=pointOnRing(i%10===0?314:i%5===0?317:320,i*3);return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}/>;})}
          <g ref={markerRef} transform={`rotate(${plateRef.current.angle*180/Math.PI} 360 360)`}><path className="turn-marker" d="M360 26 V38"/></g>
        </g>
        <text className="scope-title"><textPath href={`#${uid}-title`} startOffset="50%" textAnchor="middle">CHROMASCOPE</textPath></text>
        <text className="scope-hint"><textPath href={`#${uid}-hint`} startOffset="50%" textAnchor="middle">{hint}</textPath></text>
        <g role="group" aria-label={tr('Modo do instrumento','Instrument mode')}>
          <CurvedControl angle={-110} halfSpan={17} variant="mode-control" label={tr('Compor','Compose')} pressed={mode==='edit'} onClick={()=>switchMode('edit')}/>
          <CurvedControl angle={-70} halfSpan={17} variant="mode-control" label={tr('Visualizar','View')} pressed={mode==='view'} onClick={()=>switchMode('view')}/>
        </g>
        <CurvedControl angle={180} label={palettes[palette].name} onClick={choosePalette}/>
        <CurvedControl angle={0} label={`${plateRef.current.axes} ${tr('eixos','axes')}`} onClick={()=>setAxes(plateRef.current.axes===12?-10:1)}/>
        <CurvedControl angle={90} disabled={saving||!plateRef.current.shapes.length} label={saving?tr('Salvando','Saving'):tr('Salvar imagem','Save image')} onClick={save}/>
        <IconButton angle={-15} label={tr('Menos eixos','Fewer axes')} onClick={()=>setAxes(-1)} disabled={plateRef.current.axes===2}><Minus/></IconButton>
        <IconButton angle={15} label={tr('Mais eixos','More axes')} onClick={()=>setAxes(1)} disabled={plateRef.current.axes===12}><Plus/></IconButton>
        <IconButton angle={-135} label={tr('Desfazer','Undo')} onClick={undo} disabled={!historyRef.current.length}><Undo2/></IconButton>
        <IconButton angle={135} label={tr('Limpar peças','Clear pieces')} onClick={clear} disabled={!plateRef.current.shapes.length}><Trash2/></IconButton>
        {mode==='view'?<>
          <CurvedControl angle={-35} halfSpan={12} variant="motion-control" label={tr('Movimento suave','Gentle motion')} textLabel={flowing?tr('Pausar','Pause'):tr('Mover','Move')} pressed={flowing} active={flowing} disabled={!plateRef.current.shapes.length} onClick={toggleDrift}/>
          <IconButton angle={45} label={tr('Girar um passo','Turn one step')} onClick={()=>rotate(.12)}><RotateCcw/></IconButton>
          <g className="palette-dots" aria-hidden="true">{colors.map((c,i)=>{const p=pointOnRing(263,168+i*8);return <circle key={c} cx={p.x} cy={p.y} r="3" fill={c}/>;})}</g>
        </>:<>
          <CurvedControl angle={-35} halfSpan={12} textLabel={{auto:'Auto',lines:tr('Retas','Lines'),free:tr('Livre','Free')}[assist]} label={tr('Traço: ','Draw: ')+({auto:tr('auto','auto'),lines:tr('retas','lines'),free:tr('livre','free')}[assist])} active={tool==='draw'} onClick={()=>{if(tool==='draw')setAssist(a=>a==='auto'?'lines':a==='lines'?'free':'auto');setTool('draw');setSelected(null);setNotice('');}}/>
          <IconButton angle={45} label={tr('Ajustar peças','Adjust pieces')} active={tool==='select'} onClick={()=>{setTool('select');setNotice('');}}><MousePointer2/></IconButton>
          {plateRef.current.shapes.map((s,i)=>{const p=pointOnRing(260,232+i*15);return <foreignObject key={s.id} x={p.x-20} y={p.y-20} width="40" height="40" className="piece-object"><button type="button" className={`piece-choice${selected===s.id?' selected':''}`} onClick={()=>pick(s.id)} aria-label={tr(`Editar peça ${i+1}`,`Edit piece ${i+1}`)} aria-pressed={selected===s.id}><svg viewBox="-1 -1 2 2" aria-hidden="true"><polygon points={s.points.map(p=>`${p.x},${p.y}`).join(' ')} fill={s.color}/></svg></button></foreignObject>;})}
          {colors.map((c,i)=>{const p=pointOnRing(260,160+i*12);return <foreignObject key={c} x={p.x-20} y={p.y-20} width="40" height="40" className="piece-object"><button type="button" className={`color-choice${(shape&&tool==='select'?shape.color:colors[color])===c?' selected':''}`} aria-label={tr(`Cor ${i+1}`,`Color ${i+1}`)} onClick={()=>chooseColor(i)}><span style={{background:c}}/></button></foreignObject>;})}
          <g className="material-control" role="button" tabIndex={0} aria-label={tr(`Material: ${materialName}`,`Material: ${materialName}`)} onClick={cycleMaterial} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();cycleMaterial();}}}><path className="material-hit" d="M606 434 A257 257 0 0 1 578 496 L558 484 A234 234 0 0 0 584 428 Z"/><defs><path id={`${uid}-material`} d={arc(260,12,42)}/></defs><text><textPath href={`#${uid}-material`} startOffset="50%" textAnchor="middle">{materialName}</textPath></text></g>
          {selected!==null&&tool==='select'&&<>
            <IconButton angle={70} radius={260} label={tr('Diminuir peça','Shrink piece')} onClick={()=>resizeSelected(.9)}><Minus/></IconButton>
            <IconButton angle={90} radius={260} label={tr('Apagar peça selecionada','Delete selected piece')} onClick={remove}><X/></IconButton>
            <IconButton angle={110} radius={260} label={tr('Ampliar peça','Enlarge piece')} onClick={()=>resizeSelected(1.1)}><Plus/></IconButton>
          </>}
        </>}
        {!plateRef.current.shapes.length&&<text className="empty-prompt" x="360" y="366" textAnchor="middle">{tr('Uma forma já é um começo.','One shape is a beginning.')}</text>}
      </svg>
      <span className="scope-sr" role="status" aria-live="polite">{mode==='edit'?tr('Modo compor. ','Compose mode. '):tr('Modo visualizar. ','View mode. ')}{notice}</span>
    </section>
  </main>;
}
