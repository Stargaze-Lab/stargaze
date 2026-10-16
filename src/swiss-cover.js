import {SWISS_OUTLINE} from './swiss-outline.js';

// An abstract territorial plate, not geographic land-use data.
// Glyphs are paths so the ASCII-like texture stays crisp at any size.
const points=[...SWISS_OUTLINE.matchAll(/([\d.]+),([\d.]+)/g)].map(m=>[+m[1],+m[2]]);
const noise=n=>{const v=Math.sin(n*127.1+37.7)*43758.5453;return v-Math.floor(v);};
function inside(x,y){let hit=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
function terrain(x,y){
  if(((x-405)/110)**2+((y-205)/52)**2<1||((x-680)/75)**2+((y-180)/42)**2<1)return 3;
  if(y>300+58*Math.sin(x*.006)-x*.018)return 2;
  return y>180+50*Math.sin(x*.008)?1:0;
}

export function swissCoverSvg(id='swiss-plate'){
  const layers=[[],[],[],[]];
  for(let row=0,y=18;y<590;row++,y+=23)for(let col=0,x=15;x<990;col++,x+=23){
    if(!inside(x,y))continue;
    const kind=terrain(x,y),opacity=(.64+noise(row*47+col)*.36).toFixed(2);
    layers[kind].push(`<use href="#${id}-glyph-${kind}" x="${x}" y="${y}" opacity="${opacity}"/>`);
  }
  const glyphs=['M-5 4L-3-3M0 5V-5M4 4L6-1','M-6 1H6M-3 5H3M0-4V-3','M-8 5L-2-5L4 5M0 5L6-3L11 5','M-5-5H4V4H-5ZM7-2H10V1H7Z'];
  const boundaries=['M30 205C200 160 280 295 470 246S790 178 1040 270','M-20 350C160 280 245 375 400 338S720 242 1050 352','M-20 472C200 405 260 520 450 450S740 400 1050 458'];
  return `<svg class="swiss-territory-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" fill="none" aria-hidden="true">
    <defs>
      <path id="${id}-outline" d="${SWISS_OUTLINE}"/>
      <clipPath id="${id}-clip"><use href="#${id}-outline"/></clipPath>
      ${glyphs.map((d,i)=>`<path id="${id}-glyph-${i}" d="${d}"/>`).join('')}
      <g id="${id}-land" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">${layers.map((items,i)=>`<g class="swiss-layer" data-layer="${i}">${items.join('')}</g>`).join('')}</g>
      <radialGradient id="${id}-light" gradientUnits="userSpaceOnUse" cx="520" cy="260" r="170"><stop stop-color="white"/><stop offset="1" stop-color="black"/></radialGradient>
      <mask id="${id}-mask" maskUnits="userSpaceOnUse" x="-100" y="-100" width="1200" height="800"><rect x="-100" y="-100" width="1200" height="800" fill="url(#${id}-light)"/></mask>
    </defs>
    <g stroke="currentColor" stroke-width=".6" opacity=".14">
      <path d="M78 88H1122M78 702H1122M78 88V702M1122 88V702" stroke-dasharray="2 8"/>
      <path d="M70 88H86M78 80V96M1114 88H1130M1122 80V96M70 702H86M78 694V710M1114 702H1130M1122 694V710"/>
    </g>
    <g class="swiss-map" transform="translate(100 92)">
      <use href="#${id}-outline" fill="currentColor" opacity=".025"/>
      <g clip-path="url(#${id}-clip)">
        <g class="swiss-contours" stroke="currentColor" stroke-width=".7" opacity=".19">${boundaries.map(d=>`<path d="${d}"/>`).join('')}</g>
        <use href="#${id}-land" opacity=".38"/>
        <use class="swiss-reveal" href="#${id}-land" mask="url(#${id}-mask)" opacity=".18"/>
      </g>
      <use href="#${id}-outline" stroke="currentColor" stroke-width="1.2" opacity=".65" stroke-linejoin="round"/>
    </g>
    <g fill="currentColor" font-family="'DM Mono',monospace" font-size="11" letter-spacing="2" opacity=".44">
      <text x="78" y="60">CH / 2050</text><text x="1122" y="60" text-anchor="end">FOOD × TERRITORY</text>
    </g>
    <g class="swiss-key" transform="translate(360 747)" stroke="currentColor" stroke-width="1.1" opacity=".38">
      ${[0,1,2,3].map((i)=>`<use href="#${id}-glyph-${i}" x="${i*160}"/><path d="M${i*160+24} 0h56" stroke-dasharray="1 6"/>`).join('')}
    </g>
  </svg>`;
}

let sequence=0;
export function mountSwissCover(container,{pointerSurface=container,compact=false,paused=false}={}){
  const id=`swiss-plate-${++sequence}`,host=document.createElement('div');
  host.className='swiss-cover';host.dataset.compact=String(compact);host.innerHTML=swissCoverSvg(id);container.append(host);
  const svg=host.querySelector('svg'),light=host.querySelector('radialGradient'),reveal=host.querySelector('.swiss-reveal'),layers=[...host.querySelectorAll('.swiss-layer')];
  const motion=matchMedia('(prefers-reduced-motion: reduce)'),events=new AbortController();
  let frame=0,last=0,seconds=0,visible=false,disposed=false,active=false,level=0,x=520,y=260,tx=x,ty=y;
  let manualPause=paused;
  const frozen=()=>manualPause||motion.matches;
  function request(){if(!disposed&&visible&&!document.hidden&&!frame)frame=requestAnimationFrame(draw);}
  function draw(now){
    frame=0;if(disposed||!visible||document.hidden)return;
    if(!frozen()&&last&&now-last<32){request();return;}
    const dt=last?Math.min(.08,(now-last)/1000):0;last=now;
    if(!frozen())seconds+=dt;
    const mix=frozen()?1:.14;x+=(tx-x)*mix;y+=(ty-y)*mix;level+=((active?1:0)-level)*mix;
    light.setAttribute('cx',x.toFixed(2));light.setAttribute('cy',y.toFixed(2));
    reveal.setAttribute('opacity',(.12+level*.72).toFixed(3));
    layers.forEach((layer,i)=>{const weight=(i+1)*.36,dx=motion.matches?0:(x-500)/500*level*weight*3,dy=motion.matches?0:Math.sin(seconds*.32+i*.9)*weight+(y-300)/300*level*weight*2;layer.setAttribute('transform',`translate(${dx.toFixed(2)} ${dy.toFixed(2)})`);});
    if(!frozen())request();
  }
  function point(event){
    const matrix=svg.getScreenCTM();if(!matrix)return;
    const p=new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());
    tx=Math.max(0,Math.min(1000,p.x-100));ty=Math.max(0,Math.min(600,p.y-92));active=true;request();
  }
  function leave(){active=false;tx=520;ty=260;request();}
  function focus(){active=true;tx=520;ty=260;request();}
  for(const event of ['pointermove','pointerdown'])pointerSurface.addEventListener(event,point,{passive:true,signal:events.signal});
  for(const event of ['pointerleave','pointercancel','focusout'])pointerSurface.addEventListener(event,leave,{signal:events.signal});
  pointerSurface.addEventListener('pointerup',event=>{if(event.pointerType!=='mouse')leave();},{signal:events.signal});
  pointerSurface.addEventListener('focusin',focus,{signal:events.signal});
  const intersection=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);if(!visible){cancelAnimationFrame(frame);frame=0;last=0;}else request();},{rootMargin:'60px'});
  intersection.observe(host);
  const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;last=0;}else request();};
  const preference=()=>{last=0;request();};
  document.addEventListener('visibilitychange',visibility,{signal:events.signal});motion.addEventListener('change',preference);
  return{
    setPaused(value){manualPause=value;last=0;request();},
    destroy(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);events.abort();intersection.disconnect();motion.removeEventListener('change',preference);host.remove();}
  };
}
