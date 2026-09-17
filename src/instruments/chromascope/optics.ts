export type Point = {x:number;y:number};
export type Material = 'solid'|'glass'|'glow';
export type Shape = {id:number;points:Point[];color:string;material:Material};
export type Plate = {shapes:Shape[];angle:number;axes:number};
export const TAU=Math.PI*2;
export const palettes=[
  {name:'Prisma',colors:['#8ea69c','#bac7bd','#aacbc2','#e7bd6d']},
  {name:'Tidal',colors:['#68b7c0','#517da5','#cee2d1','#7d8b9c']},
  {name:'Mineral',colors:['#bdc891','#86a99d','#bb8270','#e1cdab']},
  {name:'Ember',colors:['#dda250','#b75743','#e7c69a','#876776']},
];
export function copyPlate(plate:Plate):Plate{return {...plate,shapes:plate.shapes.map(s=>({...s,points:s.points.map(p=>({...p}))}))};}
export function rotatePoint(p:Point,angle:number):Point{return{x:p.x*Math.cos(angle)-p.y*Math.sin(angle),y:p.x*Math.sin(angle)+p.y*Math.cos(angle)}};
export function mirrorPoint(p:Point,plateAngle:number,sector:number,side:number,axes:number){
  const v=rotatePoint(p,plateAngle);return rotatePoint({x:v.x,y:v.y*side},sector*TAU/axes);
}
export function area(points:Point[]){let a=0;for(let i=0;i<points.length;i++){const p=points[i],q=points[(i+1)%points.length];a+=p.x*q.y-q.x*p.y;}return Math.abs(a/2);}
export function inside(p:Point,points:Point[]){let hit=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)hit=!hit;}return hit;}
export function hitShape(shapes:Shape[],p:Point){for(let i=shapes.length-1;i>=0;i--)if(inside(p,shapes[i].points))return shapes[i].id;return null;}
export function bound(p:Point,radius=.96):Point{const length=Math.hypot(p.x,p.y);return length>radius?{x:p.x/length*radius,y:p.y/length*radius}:p;}
export function moved(points:Point[],dx:number,dy:number){
  // Clamp the translation, not each vertex, preserving the drawn shape.
  let amount=1;
  for(let step=0;step<15;step++){if(points.every(p=>Math.hypot(p.x+dx*amount,p.y+dy*amount)<=.97))break;amount*=.8;}
  return points.map(p=>({x:p.x+dx*amount,y:p.y+dy*amount}));
}
export function examplePlate():Plate{
  // Angular glass fragments echo the triangles and squares of the Stargaze hero.
  const quadrilateral=[{x:.19,y:-.09},{x:.56,y:-.25},{x:.78,y:.13},{x:.43,y:.28}];
  const triangle=[{x:.30,y:-.04},{x:.68,y:.03},{x:.46,y:.29}];
  const square=[{x:.70,y:-.18},{x:.81,y:-.23},{x:.86,y:-.12},{x:.75,y:-.07}];
  return{angle:.13,axes:6,shapes:[
    {id:1,points:quadrilateral,color:palettes[0].colors[0],material:'glass'},
    {id:2,points:triangle,color:palettes[0].colors[2],material:'glass'},
    {id:3,points:square,color:palettes[0].colors[1],material:'glass'},
  ]};
}
function polygon(ctx:CanvasRenderingContext2D,points:Point[]){if(points.length<3)return;ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);ctx.closePath();}
function paint(ctx:CanvasRenderingContext2D,shape:Shape,points:Point[],alpha:number,radius:number){
  ctx.save();polygon(ctx,points);ctx.fillStyle=shape.color;ctx.strokeStyle=shape.color;
  ctx.globalCompositeOperation='source-over';
  ctx.globalAlpha=alpha*(shape.material==='glass'?.055:shape.material==='glow'?.10:.24);
  if(shape.material==='glow'){ctx.shadowBlur=radius*.025;ctx.shadowColor=shape.color;}
  ctx.fill();ctx.shadowBlur=0;
  ctx.globalAlpha=alpha*(shape.material==='glass'?.44:shape.material==='glow'?.70:.65);
  ctx.lineWidth=Math.max(.65,radius*.0025);ctx.lineJoin='miter';ctx.stroke();ctx.restore();
}
export function renderPlate(ctx:CanvasRenderingContext2D,width:number,height:number,plate:Plate,options:{edit?:boolean;selected?:number|null;draft?:Shape|null;guides?:boolean}={}){
  const cx=width/2,cy=height/2,r=Math.min(width,height)*.485;
  ctx.clearRect(0,0,width,height);ctx.fillStyle='#0a0b0c';ctx.fillRect(0,0,width,height);
  ctx.save();ctx.translate(cx,cy);ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.clip();
  const shapes=options.draft?[...plate.shapes,options.draft]:plate.shapes;
  for(const shape of shapes){for(let k=0;k<plate.axes;k++){for(const side of [1,-1]){
    const pts=shape.points.map(p=>{const q=mirrorPoint(p,plate.angle,k,side,plate.axes);return{x:q.x*r,y:q.y*r};});
    paint(ctx,shape,pts,options.edit?.11:1,r);
  }}}
  if(options.edit){
    if(options.guides!==false){ctx.strokeStyle='#c1cbb516';ctx.lineWidth=.7;ctx.setLineDash([1,7]);
      for(const radius of [.33,.66,.98]){ctx.beginPath();ctx.arc(0,0,r*radius,0,TAU);ctx.stroke();}
      ctx.beginPath();ctx.moveTo(-r,0);ctx.lineTo(r,0);ctx.moveTo(0,-r);ctx.lineTo(0,r);ctx.stroke();ctx.setLineDash([]);
    }
    for(const shape of shapes){const pts=shape.points.map(p=>({x:p.x*r,y:p.y*r}));paint(ctx,shape,pts,1,r);
      if(shape.id===options.selected){ctx.strokeStyle='#e7ecdb99';ctx.lineWidth=1;ctx.setLineDash([2,4]);polygon(ctx,pts);ctx.stroke();ctx.setLineDash([]);
        for(let i=0;i<pts.length;i+=Math.max(1,Math.ceil(pts.length/12))){ctx.beginPath();ctx.arc(pts[i].x,pts[i].y,2.5,0,TAU);ctx.fillStyle='#e7ecdb';ctx.fill();}
      }
    }
  }
  ctx.restore();
}

// A bounded, reversible drift of the two smallest pieces; no accumulated physics.
export function driftingShapes(shapes:Shape[],seconds:number):Shape[]{
  if(seconds===0)return shapes;
  const chosen=[...shapes].sort((a,b)=>area(a.points)-area(b.points)).slice(0,2);
  return shapes.map(shape=>{
    const index=chosen.findIndex(s=>s.id===shape.id);if(index<0)return shape;
    const center=shape.points.reduce((a,p)=>({x:a.x+p.x/shape.points.length,y:a.y+p.y/shape.points.length}),{x:0,y:0});
    const small=area(shape.points)<.09,amplitude=(index===0?.024:.013)*(small?1:.45),direction=index===0?1:-1;
    const angle=Math.sin(seconds*(index===0?.31:.23))*direction*(small?.10:.04);
    let points=shape.points.map(p=>{const q=rotatePoint({x:p.x-center.x,y:p.y-center.y},angle);return{x:q.x+center.x,y:q.y+center.y};});
    if(points.some(p=>Math.hypot(p.x,p.y)>.97))points=shape.points;
    return{...shape,points:moved(points,Math.sin(seconds*.27)*amplitude*direction,Math.sin(seconds*.19)*amplitude*.65)};
  });
}
