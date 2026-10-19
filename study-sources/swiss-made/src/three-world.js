import * as THREE from 'three';

export class ThreeWorld {
  constructor(canvas){
    this.canvas=canvas; this.pointer=new THREE.Vector2(.5,.5); this.targetPointer=this.pointer.clone(); this.mode='splash'; this.modeMix=0; this.targetModeMix=0; this.mapOpacity=0;
    this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.mobile=matchMedia('(max-width: 760px), (pointer: coarse)').matches;
    this.paused=document.hidden;
    this.frame=0;
    this.renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:!this.mobile,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,this.mobile?1.2:1.8));
    this.scene=new THREE.Scene(); this.camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,100); this.camera.position.set(0,0,6.4);
    this.clock=new THREE.Clock();
    this.buildShader(); this.buildParticles(); this.buildMap(); this.resize();
    addEventListener('resize',()=>this.resize()); addEventListener('pointermove',e=>this.targetPointer.set(e.clientX/innerWidth,1-e.clientY/innerHeight),{passive:true});
    document.addEventListener('visibilitychange',()=>{this.paused=document.hidden;});
    this.animate();
  }
  buildShader(){
    const geo=new THREE.PlaneGeometry(18,11,1,1);
    const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:{value:0},uMouse:{value:new THREE.Vector2(.5,.5)},uMode:{value:0},uAlpha:{value:.88}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,fragmentShader:`
      precision highp float; varying vec2 vUv; uniform float uTime; uniform vec2 uMouse; uniform float uMode; uniform float uAlpha;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);} 
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);} 
      void main(){vec2 uv=vUv; vec2 m=uMouse; float d=distance(uv,m); float n=noise(uv*7.+uTime*.035)+.45*noise(uv*18.-uTime*.02); float gridX=smoothstep(.975,.995,abs(sin((uv.x+n*.012)*62.))); float gridY=smoothstep(.975,.995,abs(sin((uv.y-n*.012)*42.))); float grid=max(gridX,gridY); float halo=.12/(.03+d*d); vec3 paper=vec3(.953,.933,.89); vec3 ink=vec3(.055,.065,.065); vec3 warm=vec3(.70,.34,.22); vec3 c=mix(ink,warm,.28+n*.18); float a=(grid*.12+n*.035+halo*.018)*uAlpha; if(uMode>.5){a*=.32;} gl_FragColor=vec4(c,a); }
    `});
    this.shaderMat=mat; this.shader=new THREE.Mesh(geo,mat); this.shader.position.z=-2.5; this.scene.add(this.shader);
  }
  buildParticles(){
    const count=this.mobile?420:1150, arr=new Float32Array(count*3); for(let i=0;i<count;i++){arr[i*3]=(Math.random()-.5)*10;arr[i*3+1]=(Math.random()-.5)*6.5;arr[i*3+2]=(Math.random()-.5)*2;}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(arr,3));
    const m=new THREE.PointsMaterial({size:.018,color:0x24322e,transparent:true,opacity:.22}); this.particles=new THREE.Points(g,m); this.scene.add(this.particles);
  }
  buildMap(){
    const loader=new THREE.TextureLoader(); const tex=loader.load(`${import.meta.env.BASE_URL}assets/current-use-map.png`); tex.colorSpace=THREE.SRGBColorSpace;
    const geo=new THREE.PlaneGeometry(5.15,2.55,this.mobile?44:90,this.mobile?22:46); const pos=geo.attributes.position; const base=[]; for(let i=0;i<pos.count;i++) base.push(pos.getZ(i)); this.mapBase=base;
    const mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}); this.mapMat=mat; this.map=new THREE.Mesh(geo,mat); this.map.rotation.x=-.52; this.map.rotation.z=-.07; this.map.position.set(-.55,-.05,.2); this.scene.add(this.map);
    const wire=new THREE.Mesh(geo.clone(),new THREE.MeshBasicMaterial({color:0x9aa08f,wireframe:true,transparent:true,opacity:0,depthWrite:false})); wire.rotation.copy(this.map.rotation); wire.position.copy(this.map.position); wire.position.z=.19; this.mapWire=wire; this.scene.add(wire);
  }
  setMode(mode){
    this.mode=mode; const territory=['territory','lab'].includes(mode); this.targetModeMix=territory?1:0;
  }
  setTerritoryState(state){this.territoryState=state;}
  resize(){
    this.mobile=matchMedia('(max-width: 760px), (pointer: coarse)').matches;
    this.camera.aspect=innerWidth/innerHeight;
    this.camera.position.z=this.mobile?7.1:6.4;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,this.mobile?1.2:1.8));
    this.renderer.setSize(innerWidth,innerHeight,false);
  }
  animate(){
    requestAnimationFrame(()=>this.animate());
    if(this.paused)return;
    this.frame++;
    if(this.mobile && this.frame%2===1)return;
    const t=this.clock.getElapsedTime(); this.pointer.lerp(this.targetPointer,.045); this.modeMix+=(this.targetModeMix-this.modeMix)*.045;
    this.shaderMat.uniforms.uTime.value=t;this.shaderMat.uniforms.uMouse.value.copy(this.pointer);this.shaderMat.uniforms.uMode.value=this.modeMix;
    if(!this.reduced){this.particles.rotation.z=t*.007;this.particles.rotation.y=(this.pointer.x-.5)*.09;}
    const territory=this.modeMix; this.particles.material.opacity=.22*(1-territory*.65); this.mapMat.opacity+=(territory*.78-this.mapMat.opacity)*.055; this.mapWire.material.opacity+=(territory*.14-this.mapWire.material.opacity)*.055;
    const state=this.territoryState||'current'; const warp=state==='capability'?.09:state==='constraints'?.15:state==='question'?.22:.035;
    if(territory>.04){
      const p=this.map.geometry.attributes.position;
      for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i); const z=Math.sin(x*3.2+t*.35)*Math.cos(y*4.1-t*.25)*warp + Math.sin(x*8.1+y*5.7)*warp*.25; p.setZ(i,z);} p.needsUpdate=true;
    }
    const tilt=(this.pointer.x-.5)*.11; this.map.rotation.z=-.07+tilt; this.mapWire.rotation.z=this.map.rotation.z;
    this.renderer.render(this.scene,this.camera);
  }
}
