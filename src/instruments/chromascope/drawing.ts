import {type Point,TAU,area} from './optics';

export type DrawingAssist='auto'|'lines'|'free';
export type AssistedDrawing={points:Point[];kind:'circle'|'polygon'|'smooth'};
const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
const lerp=(a:Point,b:Point,t:number):Point=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
function segmentDistance(p:Point,a:Point,b:Point){const dx=b.x-a.x,dy=b.y-a.y,d=dx*dx+dy*dy;return distance(p,lerp(a,b,d?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/d)):0));}
function simplify(points:Point[],tolerance:number):Point[]{
  if(points.length<=2)return points;let max=tolerance,index=-1;
  for(let i=1;i<points.length-1;i++){const d=segmentDistance(points[i],points[0],points[points.length-1]);if(d>max){max=d;index=i;}}
  return index<0?[points[0],points[points.length-1]]:[...simplify(points.slice(0,index+1),tolerance).slice(0,-1),...simplify(points.slice(index),tolerance)];
}
function simplifyLoop(points:Point[],tolerance:number){
  let split=1;for(let i=2;i<points.length;i++)if(distance(points[0],points[i])>distance(points[0],points[split]))split=i;
  const result=[...simplify(points.slice(0,split+1),tolerance).slice(0,-1),...simplify([...points.slice(split),points[0]],tolerance).slice(0,-1)];
  // Remove the arbitrary loop seam / split point when it lies along an edge.
  while(result.length>3){let index=-1,best=tolerance;for(let i=0;i<result.length;i++){const d=segmentDistance(result[i],result[(i+result.length-1)%result.length],result[(i+1)%result.length]);if(d<best){best=d;index=i;}}if(index<0)break;result.splice(index,1);}
  return result;
}
function resample(points:Point[],count:number){
  const loop=[...points,points[0]],lengths=[0];for(let i=1;i<loop.length;i++)lengths.push(lengths[i-1]+distance(loop[i-1],loop[i]));
  const total=lengths[lengths.length-1];if(total<1e-8)return points.map(p=>({...p}));let edge=1;
  return Array.from({length:count},(_,i)=>{const target=i/count*total;while(edge<lengths.length-1&&lengths[edge]<target)edge++;return lerp(loop[edge-1],loop[edge],(target-lengths[edge-1])/Math.max(1e-8,lengths[edge]-lengths[edge-1]));});
}
function keepInPlate(points:Point[]){const extent=Math.max(...points.map(p=>Math.hypot(p.x,p.y)));return extent>.96?points.map(p=>({x:p.x*.96/extent,y:p.y*.96/extent})):points;}
function circleFit(points:Point[],diagonal:number):Point[]|null{
  const center=points.reduce((a,p)=>({x:a.x+p.x/points.length,y:a.y+p.y/points.length}),{x:0,y:0});
  let xx=0,xy=0,yy=0,xr=0,yr=0;
  for(const p of points){const x=p.x-center.x,y=p.y-center.y,r=x*x+y*y;xx+=x*x;xy+=x*y;yy+=y*y;xr+=x*r/2;yr+=y*r/2;}
  const det=xx*yy-xy*xy;if(Math.abs(det)<1e-10)return null;
  center.x+=(xr*yy-yr*xy)/det;center.y+=(yr*xx-xr*xy)/det;
  const radii=points.map(p=>distance(p,center)),radius=radii.reduce((a,b)=>a+b,0)/radii.length;
  const error=Math.sqrt(radii.reduce((sum,r)=>sum+(r-radius)**2,0)/radii.length)/radius;
  if(radius<.025||radius>diagonal*.6||error>.052||Math.max(...radii.map(r=>Math.abs(r-radius)))>radius*.14)return null;
  // Uniform traversal and a nearly complete perimeter distinguish a loop from an arc or scribble.
  let turn=0,reverse=0;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];let d=Math.atan2(b.y-center.y,b.x-center.x)-Math.atan2(a.y-center.y,a.x-center.x);if(d>Math.PI)d-=TAU;if(d< -Math.PI)d+=TAU;turn+=d;reverse+=Math.abs(d);}
  if(Math.abs(Math.abs(turn)-TAU)>.2||reverse>TAU*1.12)return null;
  return Array.from({length:64},(_,i)=>({x:center.x+radius*Math.cos(i/64*TAU),y:center.y+radius*Math.sin(i/64*TAU)}));
}
export function assistDrawing(raw:Point[],mode:DrawingAssist='auto'):AssistedDrawing{
  const clean=raw.filter((p,i)=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&(!i||distance(p,raw[i-1])>.0001));
  if(clean.length<3)return{points:clean,kind:'smooth'};
  const xs=clean.map(p=>p.x),ys=clean.map(p=>p.y),diagonal=Math.hypot(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys));
  const samples=resample(clean,128);
  // A very light spatial filter removes hand jitter without rounding deliberate corners.
  const filtered=samples.map((p,i)=>{const a=samples[(i+127)%128],b=samples[(i+1)%128];return{x:(a.x+6*p.x+b.x)/8,y:(a.y+6*p.y+b.y)/8};});
  const polygon=simplifyLoop(filtered,Math.max(.002,diagonal*(mode==='lines'?.035:.018)));
  const errors=filtered.map(p=>Math.min(...polygon.map((a,i)=>segmentDistance(p,a,polygon[(i+1)%polygon.length]))));
  const straight=polygon.length>=3&&polygon.length<=10&&Math.sqrt(errors.reduce((a,b)=>a+b*b,0)/errors.length)<diagonal*.0065;
  if(mode==='lines'||(mode==='auto'&&straight)){
    if(polygon.length>=3&&area(polygon)>.001)return{points:keepInPlate(polygon),kind:'polygon'};
  }
  if(mode==='auto'&&distance(clean[0],clean[clean.length-1])<diagonal*.25){
    const circle=circleFit(filtered,diagonal);if(circle)return{points:keepInPlate(circle),kind:'circle'};
  }
  // Corner cutting smooths the actual contour. It does not force an organic shape into a primitive.
  const base=resample(simplifyLoop(filtered,Math.max(.0015,diagonal*.005)),64),smooth:Point[]=[];
  for(let i=0;i<base.length;i++){const a=base[i],b=base[(i+1)%base.length];smooth.push(lerp(a,b,.25),lerp(a,b,.75));}
  return{points:keepInPlate(smooth),kind:'smooth'};
}

// Exact exponential damping: consistent coast distance across display refresh rates.
export function coastRotation(velocity:number,seconds:number){
  const decay=Math.exp(-1.8*Math.max(0,seconds)),next=velocity*decay;
  return{delta:velocity*(1-decay)/1.8,velocity:Math.abs(next)<.008?0:next};
}
