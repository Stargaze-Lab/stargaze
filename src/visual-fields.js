// Shared monochromatic cover language. All shapes are conceptual, not project data.
const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const fract = (x) => x - Math.floor(x);
const rand = (seed) => fract(Math.sin(seed * 127.1 + 311.7) * 43758.5453);
const mix = (a, b, k) => a + (b - a) * k;

export function lissajousPoint(t, phase = Math.PI / 2) {
  return [Math.sin(4 * t + phase), Math.sin(5 * t)];
}
export function nextSceneIndex(current, count, random = Math.random) {
  if (count <= 1) return 0;
  if (current < 0 || current >= count) return Math.floor(random() * count);
  return (current + 1 + Math.floor(random() * (count - 1))) % count;
}
export function spherePoint(lat, lon) {
  return [Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)];
}
function rotation(point, yaw, tilt) {
  const [x, y, z] = point;
  const xx = x * Math.cos(yaw) + z * Math.sin(yaw);
  const zz = -x * Math.sin(yaw) + z * Math.cos(yaw);
  return [xx, y * Math.cos(tilt) - zz * Math.sin(tilt), y * Math.sin(tilt) + zz * Math.cos(tilt)];
}
export function pickNetworkNode(points,x,y,limit=24){
  let hit=-1,distance=limit;for(let i=0;i<points.length;i++){const d=Math.hypot(points[i][0]-x,points[i][1]-y);if(d<distance){distance=d;hit=i;}}return hit;
}
export function makeNetwork(){
  const nodes=Array.from({length:64},(_,i)=>{const cluster=Math.floor(i/16),phi=rand(i+2)*TAU,theta=Math.acos(2*rand(i+71)-1),r=.16+rand(i+32)*.32;const centers=[[-.5,.32,.15],[.4,.25,-.15],[-.2,-.42,-.25],[.52,-.34,.28]];return centers[cluster].map((v,j)=>v+r*[Math.sin(theta)*Math.cos(phi),Math.cos(theta),Math.sin(theta)*Math.sin(phi)][j]);});
  const edges=[];for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const d=Math.hypot(...nodes[i].map((v,k)=>v-nodes[j][k]));if(d<.3||(i%16===0&&j%16===0))edges.push([i,j,d]);}
  return {nodes,rest:nodes.map(p=>[...p]),velocity:nodes.map(()=>[0,0,0]),edges,offsets:nodes.map(()=>[0,0]),points:[],grab:-1,dragging:false,yaw:0,tilt:-.12,spin:.004,scale:1,lastX:0,lastY:0};
}
export function stepNetwork(net,dt){
  // Elastic links transmit the gesture; anchors restore the original clusters.
  const step=Math.min(dt,.025),forces=net.nodes.map((p,i)=>p.map((v,k)=>(net.rest[i][k]-v)*18));
  for(const [a,b,length] of net.edges){const delta=net.nodes[b].map((v,k)=>v-net.nodes[a][k]),distance=Math.hypot(...delta)||.0001;const pull=(distance-length)*2.2/distance;for(let k=0;k<3;k++){forces[a][k]+=delta[k]*pull;forces[b][k]-=delta[k]*pull;}}
  for(let i=0;i<net.nodes.length;i++){
    if(net.dragging&&net.grab===i){net.velocity[i].fill(0);continue;}
    for(let k=0;k<3;k++){net.velocity[i][k]=(net.velocity[i][k]+forces[i][k]*step)*Math.exp(-6*step);net.nodes[i][k]+=net.velocity[i][k]*step;}
  }
}

export function createFieldEngine() {
  const fields = new Set();
  const byCanvas = new WeakMap();
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = motionQuery.matches;
  let requestedFrame = 0, lastFrame = 0, time = 0, destroyed = false;
  let tone = [231, 189, 109], targetTone = [...tone];
  let intersection;

  function wake() {
    if (!destroyed && !document.hidden && !requestedFrame && [...fields].some(f => f.visible)) {
      requestedFrame = requestAnimationFrame(tick);
    }
  }
  function tick(now) {
    requestedFrame = 0;
    if (destroyed || document.hidden) return;
    if (!paused && lastFrame && now - lastFrame < 30) { wake(); return; }
    const dt = lastFrame ? Math.min((now - lastFrame) / 1000, .05) : .016;
    lastFrame = now;
    if (!paused) time += dt;
    tone = tone.map((v, i) => paused ? targetTone[i] : mix(v, targetTone[i], .08));
    for (const field of fields) if (field.visible && field.width > 0) {
      field.pointer.sx = mix(field.pointer.sx, field.pointer.x, paused ? 1 : .06);
      field.pointer.sy = mix(field.pointer.sy, field.pointer.y, paused ? 1 : .06);
      field.pointer.press = mix(field.pointer.press, field.pointer.down ? 1 : 0, paused ? 1 : .12);
      field.pointer.energy *= paused ? 1 : Math.exp(-dt*3);
      field.pointer.pulse *= paused ? 1 : Math.exp(-dt*2);
      renderField(field, time, dt, tone, paused);
    }
    if (!paused) wake();
  }
  intersection = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const f = byCanvas.get(entry.target);
      if (f) f.visible = entry.isIntersecting && entry.intersectionRatio > 0;
    }
    wake();
  }, { threshold: 0, rootMargin: '60px' });

  function mount(container, scene, {hero = false, pointerSurface = container} = {}) {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    container.append(canvas);
    const ctx = canvas.getContext('2d', {alpha:true});
    if (!ctx) { canvas.remove(); return { destroy() {}, setScene() {} }; }
    const field = {canvas, ctx, scene, hero, visible:false, width:0, height:0, seed:17,
      pointer:{x:0,y:0,sx:0,sy:0,active:false,down:false,press:0,energy:0,pulse:0}, birds:[],network:makeNetwork(),material:{phase:0,velocity:0},phase:0,phaseTarget:0,changeAt:0};
    fields.add(field); byCanvas.set(canvas, field);
    const resize = new ResizeObserver(() => {
      const {width, height} = container.getBoundingClientRect();
      if (!width || !height) return;
      field.width = width; field.height = height;
      const dpr = Math.min(devicePixelRatio || 1, width < 700 ? 1.5 : 1.75);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      wake();
    });
    resize.observe(container); intersection.observe(canvas);
    const move = event => {
      if (event.target.closest?.('button:not(.card-tune), a, input, select, textarea')) return;
      const rect = container.getBoundingClientRect();
      if(field.scene==='network'){
        const net=field.network,x=event.clientX-rect.left,y=event.clientY-rect.top;
        if(net.dragging){
          const dx=x-net.lastX,dy=y-net.lastY;
          if(net.grab>=0){const point=net.points[net.grab],perspective=3.8/(3.8-point[2]),scale=net.scale*perspective;
            const vx=dx/scale,vy=-dy/scale,yy=vy*Math.cos(net.tilt),zz=-vy*Math.sin(net.tilt);
            const world=[vx*Math.cos(net.yaw)-zz*Math.sin(net.yaw),yy,vx*Math.sin(net.yaw)+zz*Math.cos(net.yaw)];
            net.nodes[net.grab]=net.nodes[net.grab].map((v,i)=>clamp(v+world[i],-1.7,1.7));
            for(const [a,b] of net.edges){const neighbor=a===net.grab?b:b===net.grab?a:-1;if(neighbor>=0){net.offsets[neighbor][0]+=dx*.15;net.offsets[neighbor][1]+=dy*.15;}}
          }else{net.yaw+=dx*.006;net.tilt=clamp(net.tilt+dy*.004,-1,1);net.spin=clamp(dx*.001,-.018,.018);}
        }
        net.lastX=x;net.lastY=y;
        if(!event.target.closest?.('button,a'))pointerSurface.dataset&&(pointerSurface.dataset.cursor=net.dragging?'drag':pickNetworkNode(net.points,x,y)>=0?'drag':'rotate');
      }
      const oldX=field.pointer.x,oldY=field.pointer.y;
      field.pointer.x = clamp((event.clientX - rect.left) / Math.max(rect.width, 1) * 2 - 1, -1, 1);
      field.pointer.y = clamp((event.clientY - rect.top) / Math.max(rect.height, 1) * 2 - 1, -1, 1);
      if(field.pointer.down&&field.scene==='kaleidoscope'){const delta=(field.pointer.x-oldX)*2+(field.pointer.y-oldY);field.material.phase+=delta;field.material.velocity=clamp(delta,-.12,.12);}
      if(field.pointer.down&&field.scene==='lissajous')field.phaseTarget=field.pointer.y*Math.PI;
      field.pointer.energy=clamp(field.pointer.energy+Math.hypot(field.pointer.x-oldX,field.pointer.y-oldY)*1.5,0,1);
      field.pointer.active = true; wake();
    };
    const down=event=>{if(event.target.closest?.('button:not(.card-tune),a,input,select,textarea'))return;move(event);field.pointer.down=true;field.pointer.pulse=1;if(field.scene==='network'){const net=field.network;net.grab=pickNetworkNode(net.points,net.lastX,net.lastY,event.pointerType==='touch'?32:24);net.dragging=true;net.spin=0;}if(field.scene==='lissajous')field.phaseTarget+=Math.PI/6;if(field.scene==='kaleidoscope')field.material.velocity=.08;wake();};
    const release=()=>{field.network.dragging=false;field.network.grab=-1;};
    const leave = () => { field.pointer.x = 0; field.pointer.y = 0; field.pointer.active = false;field.pointer.down=false;release(); wake(); };
    const up=event=>{field.pointer.down=false;release();if(event.pointerType!=='mouse')leave();else wake();};
    pointerSurface.addEventListener('pointermove', move, {passive:true});
    pointerSurface.addEventListener('pointerdown', down, {passive:true});
    pointerSurface.addEventListener('pointerleave', leave);
    pointerSurface.addEventListener('pointerup', up);
    pointerSurface.addEventListener('pointercancel', leave);
    return {
      setScene(value) { field.scene = value; field.changeAt = time; field.birds = [];release();if(pointerSurface.dataset)pointerSurface.dataset.cursor=['network','kaleidoscope'].includes(value)?'drag':'interact';wake(); },
      destroy() {
        fields.delete(field); byCanvas.delete(canvas); resize.disconnect(); intersection.unobserve(canvas);
        pointerSurface.removeEventListener('pointermove', move); pointerSurface.removeEventListener('pointerdown', down);
        pointerSurface.removeEventListener('pointerleave', leave); pointerSurface.removeEventListener('pointerup', up);pointerSurface.removeEventListener('pointercancel',leave); canvas.remove();
      }
    };
  }
  const onVisibility = () => {
    if (document.hidden) { cancelAnimationFrame(requestedFrame); requestedFrame = 0; lastFrame = 0; }
    else wake();
  };
  document.addEventListener('visibilitychange', onVisibility);
  return { mount,
    get paused() { return paused; },
    pause(value) { paused = value; lastFrame = 0; wake(); },
    setTone(hex) { targetTone = [1,3,5].map(i => Number.parseInt(hex.slice(i, i+2),16)); wake(); },
    destroy() { destroyed = true; cancelAnimationFrame(requestedFrame); intersection.disconnect(); document.removeEventListener('visibilitychange', onVisibility); fields.clear(); }
  };
}

function renderField(f, time, dt, rgb, paused) {
  const {ctx:c, width:w, height:h, pointer:p} = f;
  c.clearRect(0,0,w,h);
  c.save();
  const cx = f.hero && w > 700 ? w * .7 : w * .5;
  const cy = f.hero ? h * .47 : h * .48;
  const breath=f.scene==='network'?1:1-p.press*.17+p.energy*.08+p.pulse*.08;
  const radius = Math.min(w * (f.hero ? .42 : .4), h * .42)*breath;
  const px=(p.sx+1)*w/2,py=(p.sy+1)*h/2;
  const near=(x,y)=>p.active?Math.exp(-Math.hypot(x-px,y-py)/Math.max(radius*.6,1)):0;
  const color = (a) => `rgba(${rgb.map(Math.round).join(',')},${clamp(a,0,1)})`;
  const dot = (x,y,r,a=1) => { c.fillStyle=color(a); c.beginPath(); c.arc(x,y,Math.max(.2,r),0,TAU); c.fill(); };
  const line = (points,a=.4,width=.7) => {
    if (!points.length) return;
    c.strokeStyle=color(a); c.lineWidth=width; c.beginPath();
    points.forEach(([x,y],i) => i ? c.lineTo(x,y) : c.moveTo(x,y)); c.stroke();
  };
  const project = (pt, yaw=time*.035+p.sx*.23, tilt=-.18+p.sy*.13, size=radius) => {
    const [x,y,z] = rotation(pt,yaw,tilt); const perspective = 3.8/(3.8-z);
    return [cx+x*size*perspective,cy-y*size*perspective,z];
  };
  const ring = (r,alpha=.16) => { c.strokeStyle=color(alpha); c.lineWidth=.65; c.beginPath(); c.arc(cx,cy,r,0,TAU); c.stroke(); };
  const glow = (x,y,r=3,alpha=.9) => {
    c.shadowBlur=14; c.shadowColor=color(.8); dot(x,y,r,alpha); c.shadowBlur=0;
    dot(x,y,r*.38,1);
  };
  const ambient = c.createRadialGradient(cx,cy,0,cx,cy,Math.max(radius*1.7,1));
  ambient.addColorStop(0,color(.045)); ambient.addColorStop(1,color(0));
  c.fillStyle=ambient; c.fillRect(0,0,w,h);

  if (f.scene === 'network') {
    const net=f.network;net.scale=radius*1.25;
    if(!paused){const steps=Math.max(1,Math.ceil(dt/.025));for(let i=0;i<steps;i++)stepNetwork(net,dt/steps);}
    if(!paused&&!net.dragging){net.yaw+=dt*(.035+net.spin*20);net.spin*=.96;}
    const projected=net.nodes.map((pt,i)=>{const v=project(pt,net.yaw,net.tilt,net.scale),offset=net.offsets[i];if(!paused){offset[0]*=.9;offset[1]*=.9;}return [v[0]+offset[0],v[1]+offset[1],v[2]];});net.points=projected;
    for(const [i,j,d] of net.edges)line([projected[i],projected[j]],(1-d/.85)*(.2+Math.max(0,projected[i][2])*.32)+(net.grab===i||net.grab===j?.25:0));
    projected.map((pt,i)=>({pt,i})).sort((a,b)=>a.pt[2]-b.pt[2]).forEach(({pt,i})=>{
      const depth=clamp((pt[2]+1)/2,.15,1), r=(i%16===0?4.5:1.3+rand(i)*1.5)*(.6+depth);
      if(i%16===0) { glow(pt[0],pt[1],r*.64); c.strokeStyle=color(.4); c.beginPath(); c.arc(pt[0],pt[1],r*2.6,0,TAU); c.stroke(); }
      else dot(pt[0],pt[1],r*(1+near(pt[0],pt[1])),depth*.9+near(pt[0],pt[1]));
    });
  } else if (f.scene === 'globe') {
    const yaw=time*.05+p.sx*.3;
    ring(radius,.38);
    const plot=pt=>project(pt,yaw,-.2+p.sy*.14,radius*.9);
    for(let lat=-60;lat<=60;lat+=30) {
      const pts=Array.from({length:101},(_,i)=>plot(spherePoint(lat/180*Math.PI,i/100*TAU)));
      for(let i=1;i<pts.length;i++) line([pts[i-1],pts[i]],pts[i][2]>0?.19:.045);
    }
    for(let lon=0;lon<360;lon+=30) {
      const pts=Array.from({length:65},(_,i)=>plot(spherePoint((i/64-.5)*Math.PI,lon/180*Math.PI)));
      for(let i=1;i<pts.length;i++) line([pts[i-1],pts[i]],pts[i][2]>0?.16:.04);
    }
    for(let route=0;route<9;route++) {
      const a=spherePoint((rand(route+82)-.5)*2,rand(route+49)*TAU);
      const b=spherePoint((rand(route+129)-.5)*2,rand(route+161)*TAU);
      const path=t=>{
        const v=a.map((n,j)=>mix(n,b[j],t)), norm=Math.hypot(...v)||1;
        return plot(v.map(n=>n/norm*(1+.18*Math.sin(t*Math.PI))));
      };
      const pts=Array.from({length:70},(_,i)=>path(i/69));
      for(let j=1;j<pts.length;j++) line([pts[j-1],pts[j]],pts[j][2]>0?.3:.04);
      const k=fract(time*.065+route*.173), head=path(k);
      for(let q=0;q<10;q++) { const tail=path(fract(k-q*.007)); if(tail[2]>-.15) dot(tail[0],tail[1],1.1,(1-q/10)*.65); }
      if(head[2]>-.15) glow(head[0],head[1],2.3);
      [path(0),path(1)].forEach(pt=>{if(pt[2]>0)dot(pt[0],pt[1],2.1,.75);});
    }
  } else if (f.scene === 'dome') {
    const plot=pt=>{ const [x,y,z]=rotation(pt,time*.025+p.sx*.28,.32+p.sy*.12); return [cx+x*radius*1.18,cy+radius*.32-y*radius-z*radius*.2,z]; };
    for(let meridian=0;meridian<12;meridian++) {
      line(Array.from({length:55},(_,i)=>plot(spherePoint(i/54*Math.PI/2,meridian/12*TAU))),.17);
    }
    for(let lat=0;lat<5;lat++) line(Array.from({length:100},(_,i)=>plot(spherePoint(lat/5*Math.PI/2,i/99*TAU))),lat===0?.4:.14);
    const stars=Array.from({length:95},(_,i)=>plot(spherePoint(Math.asin(rand(i+44)),rand(i+94)*TAU)));
    stars.forEach((pt,i)=>{
      const proximity=near(pt[0],pt[1]),alpha=.22+.68*(.5+.5*Math.sin(time*.7+rand(i)*TAU))+proximity*.8+p.pulse*.3;
      dot(pt[0],pt[1],(.6+rand(i+501)*1.5)*(1+proximity*1.8),alpha);
      if(proximity>.45)glow(pt[0],pt[1],1+proximity*2,alpha);
      if(i%19===0) { glow(pt[0],pt[1],1.6,alpha); line([[pt[0]-5,pt[1]],[pt[0]+5,pt[1]]],alpha*.4); line([[pt[0],pt[1]-5],[pt[0],pt[1]+5]],alpha*.4); }
      if(i<9 && i%3!==0) line([stars[i-1],pt],.26);
    });
  } else if (f.scene === 'lissajous') {
    f.phase=mix(f.phase,f.phaseTarget,paused?1:.07);
    const sx=radius*.92*(1+p.sx*.18), sy=radius*.79*(1-p.sy*.25), head=time*.38+p.energy*.4;
    const at=t=>{const [x,y]=lissajousPoint(t,Math.PI/2+p.sx*.25+f.phase); return [cx+x*sx,cy+y*sy];};
    line([[cx-sx*1.12,cy],[cx+sx*1.12,cy]],.12); line([[cx,cy-sy*1.16],[cx,cy+sy*1.16]],.12);
    const count=620;
    for(let i=1;i<count;i++) {
      const k=i/count, a=head-(1-(i-1)/count)*TAU, b=head-(1-k)*TAU;
      line([at(a),at(b)],.035+Math.pow(k,2.4)*.76+p.pulse*.15,.8+Math.pow(k,5)*.55+p.press*.6);
    }
    const pt=at(head); glow(pt[0],pt[1],3.3); c.strokeStyle=color(.4); c.beginPath(); c.arc(pt[0],pt[1],9+Math.sin(time*2)*2,0,TAU); c.stroke();
  } else if (f.scene === 'kaleidoscope') {
    if(!paused&&!p.down){f.material.phase+=f.material.velocity;f.material.velocity*=.96;}
    const segments=12, wedge=TAU/segments, rad=radius*.98;
    ring(rad*1.12,.14); ring(rad*1.07,.45);
    c.save(); c.translate(cx,cy); c.rotate(time*.045+p.sx*.22);
    for(let sector=0;sector<segments;sector++) {
      c.save(); c.rotate(sector*wedge); if(sector%2) {c.rotate(wedge);c.scale(1,-1);}
      c.beginPath();c.moveTo(0,0);c.arc(0,0,rad,0,wedge);c.closePath();c.clip();
      for(let shape=0;shape<7;shape++) {
        const spin=time*.09+shape*1.32+f.material.phase, rr=rad*(.22+rand(shape+55)*.63)*(1+p.sy*.28);
        const xx=Math.cos(.15+Math.sin(spin)*.24+p.sy*.3)*rr, yy=Math.sin(.2+Math.cos(spin*.7)*.3+p.sx*.45)*rr;
        c.save();c.translate(xx,yy);c.rotate(spin*.75+p.sy);c.scale(1+p.sx*.4,1+p.sy*.4);const size=rad*(.06+rand(shape+85)*.22)*(1+p.press*.5+p.energy*.25);
        c.beginPath(); const sides=shape%2?3:4;
        for(let k=0;k<sides;k++){const angle=k/sides*TAU; const x=Math.cos(angle)*size,y=Math.sin(angle)*size;k?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();
        c.fillStyle=color(.035+shape*.012);c.fill();c.strokeStyle=color(.32+shape*.045);c.lineWidth=.85;c.stroke();c.restore();
      }
      c.restore();
    }
    c.restore();glow(cx,cy,1.5,.7);
  } else if (f.scene === 'threads') {
    const start=cx-radius*1.1, span=radius*2.2;
    for(let i=0;i<22;i++) {
      const pts=Array.from({length:180},(_,j)=>{const t=j/179;return [start+t*span,cy+Math.sin(t*TAU*1.5+i*.27+time*.13)*radius*.48+Math.cos(t*TAU+i*.2)*radius*.17];});
      line(pts,.13+(i%4)*.075,.65);
      if(i%4===0){const k=Math.floor(fract(time*.03+i*.044)*179);glow(...pts[k],1.7,.7);}
    }
  } else if (f.scene === 'music') {
    const cols=16, rows=8, left=w*.12, top=h*.16, ww=w*.76, hh=h*.66;
    for(let x=0;x<=cols;x++) line([[left+x/cols*ww,top],[left+x/cols*ww,top+hh]],x%4===0?.23:.08);
    for(let y=0;y<=rows;y++) line([[left,top+y/rows*hh],[left+ww,top+y/rows*hh]],.1);
    const pulse=fract(time*.1), pos=left+pulse*ww;
    line([[pos,top-8],[pos,top+hh+8]],.85,1.2);
    const notes=[[0,5],[2,3],[4,2],[4,5],[6,4],[8,1],[10,3],[12,2],[12,5],[14,4]];
    notes.forEach(([x,y])=>{const xx=left+(x+.5)/cols*ww,yy=top+(y+.5)/rows*hh,d=fract(pulse-(x+.5)/cols),hit=d<.07;dot(xx,yy,3.5,hit?.95:.5);c.strokeStyle=color(hit?.8:.3);c.beginPath();c.arc(xx,yy,hit?8+d*200:8,0,TAU);c.stroke();});
  } else {
    // Flocking remains autonomous; pointer attracts at distance and separates nearby.
    const count=w<700?52:86;
    if(!f.birds.length) f.birds=Array.from({length:count},(_,i)=>({x:rand(i+14)*w,y:rand(i+91)*h,vx:Math.cos(i)*.45,vy:Math.sin(i)*.45,phase:i*.7}));
    const birds=f.birds;
    for(let i=0;i<birds.length;i++) {
      const b=birds[i];
      if(!paused) {
        let ax=0,ay=0,bx=0,by=0,n=0;
        for(let j=0;j<birds.length;j++) if(i!==j){const o=birds[j],dx=o.x-b.x,dy=o.y-b.y,d=Math.hypot(dx,dy);if(d<85){ax+=o.vx;ay+=o.vy;bx+=dx;by+=dy;n++;}if(d>0&&d<20){b.vx-=dx/d*.035;b.vy-=dy/d*.035;}}
        if(n){b.vx+=(ax/n-b.vx)*.025+bx/n*.00025;b.vy+=(ay/n-b.vy)*.025+by/n*.00025;}
        if(p.active){const dx=(p.sx+1)/2*w-b.x,dy=(p.sy+1)/2*h-b.y,d=Math.max(1,Math.hypot(dx,dy));if(d<250){const force=d<60?-.12:.02;b.vx+=dx/d*force;b.vy+=dy/d*force;}}
        b.vx+=Math.sin(time*.25+b.phase)*.005;b.vy+=Math.cos(time*.21+b.phase)*.004;
        const speed=Math.hypot(b.vx,b.vy),max=1.3;if(speed>max){b.vx=b.vx/speed*max;b.vy=b.vy/speed*max;}
        b.x=(b.x+b.vx*dt*40+w)%w;b.y=(b.y+b.vy*dt*40+h)%h;
      }
      c.save();c.translate(b.x,b.y);c.rotate(Math.atan2(b.vy,b.vx));const wing=Math.sin(time*4+b.phase)*2.5;
      line([[-5,-wing],[0,0],[-5,wing]],.52,.85);c.restore();
    }
  }
  c.restore();
}
