import * as d3 from 'd3';
import { networkStates } from './data.js';

// Editorial flow grammar, restored from v0.5: small plates + trajectories.
// A node is a phase of production, not a pictorial claim or a point on a real map.
const describe = {
  system:{grow:'Growing locally is one possible first step.',import:'Finished foods and raw ingredients can enter from elsewhere.',ch:'Switzerland sits within an exchange network, not outside it.',transform:'Imported ingredients can gain value through local processing.',store:'Reserves help bridge one harvest and another.',consume:'Food available is not the same as food actually eaten.',export:'Products processed in Switzerland can leave again.'},
  milk:{grass:'Grassland supports animals. Alpine pasture is not interchangeable with arable land.',cattle:'Animals turn grass and feed into milk.',milk:'Around three million tonnes of marketed milk annually (BLW).',cheese:'About half of marketed milk goes to cheese and quark (BLW).',market:'Dairy enters domestic and external markets. No export share is inferred here.'},
  wheat:{weather:'Adverse weather affected the Swiss harvest in 2024.',harvest:'250,773 tonnes of bread-quality grain were harvested in 2024 (swiss granum).',mill:'Milling and baking turn grain into food.',stocks:'Stocks can buffer harvest fluctuations.',imports:'Imported wheat can help bridge a domestic harvest gap.'},
  coffee:{origin:'Coffee cultivation takes place outside Switzerland.',import:'Green beans are brought to Swiss processors.',roast:'Roasting and packaging are distinct from cultivation.',consume:'A share of processed coffee enters Swiss consumption.',export:'Roasted coffee is also exported. That is a transformation flow, not a Swiss coffee harvest.'},
  compare:{territory:'Milk and cheese are directly linked to grassland and animals.',buffer:'Grain connects the harvest to stocks and trade.',transform:'Coffee makes a processing and export chain visible.',swiss:'“Swiss-made” can refer to cultivation, processing, or export value.',network:'The same food system has very different paths and dependencies.'}
};
const plate = (r=15) => `M${-r},0 L0,${-r*.55} L${r},0 L0,${r*.55} Z`;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initNetwork(svgNode){
  const svg=d3.select(svgNode);
  const info=document.querySelector('#network-interaction');
  let current='system', raf=0, routePaths=[], partNodes=[];
  function dimensions(){return {w:svgNode.clientWidth||800,h:svgNode.clientHeight||570};}
  function displayInfo(text){if(info)info.textContent=text;}
  function render(state=current){
    current=state; cancelAnimationFrame(raf);
    const {w,h}=dimensions(),compact=w<650;
    svg.attr('viewBox',`0 0 ${w} ${h}`);
    svg.selectAll('*').remove();
    const raw=networkStates[state];
    const nodes=raw.nodes.map(([id,label,x,y])=>({id,label,x:x*w,y:y*h}));
    const lookup=new Map(nodes.map(n=>[n.id,n]));
    const edges=raw.links.map(([a,b],index)=>({a:lookup.get(a),b:lookup.get(b),index}));
    const routes=svg.append('g').attr('class','flow-routes');
    routePaths=edges.map(e=>{
      const d=`M${e.a.x},${e.a.y} C${(e.a.x+e.b.x)/2},${e.a.y} ${(e.a.x+e.b.x)/2},${e.b.y} ${e.b.x},${e.b.y}`;
      routes.append('path').attr('class','flow-route-guide').attr('d',d);
      return routes.append('path').attr('class','network-link').attr('d',d).node();
    });
    const particleGroup=svg.append('g').attr('class','flow-particles');
    partNodes=edges.map((e,i)=>particleGroup.append('circle').attr('class','flow-particle').attr('r',compact?2:2.6).node());
    const group=svg.append('g').attr('class','flow-objects').selectAll('g').data(nodes).join('g')
      .attr('class',d=>`network-node flow-object${/SWITZERLAND|“SWISS”/.test(d.label)?' is-swiss':''}`)
      .attr('transform',d=>`translate(${d.x},${d.y})`)
      .attr('tabindex',0).attr('role','button')
      .attr('aria-label',d=>`${d.label}. ${describe[state]?.[d.id]||''}`);
    group.append('circle').attr('class','node-shadow').attr('r',6).attr('cy',1.5);
    group.append('circle').attr('class','node-plate').attr('r',4.5);
    
    
    group.append('circle').attr('class','node-core').attr('r',1.8);
    group.append('text').attr('class','flow-label').attr('y',compact?-12:-15).attr('text-anchor','middle').text(d=>d.label);
    // Hit target is bigger than the graphic but visually transparent.
    group.append('circle').attr('class','flow-hit').attr('r',compact?24:25).attr('fill','transparent');
    function select(e,d){
      group.classed('is-selected',n=>n.id===d.id);
      edges.forEach((edge,i)=>routePaths[i].classList.toggle('is-dimmed',edge.a.id!==d.id&&edge.b.id!==d.id));
      displayInfo(`${d.label} / ${describe[state]?.[d.id]||'A link in the food system.'}`);
    }
    group.on('pointerenter',select).on('focus',select).on('click',select).on('keydown',(e,d)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(e,d);}});
    svg.on('pointerleave',()=>{group.classed('is-selected',false);routePaths.forEach(p=>p.classList.remove('is-dimmed'));displayInfo('Hover, tap or focus a stage to see what it represents.');});
    displayInfo('Hover, tap or focus a stage to see what it represents.');
    // Keep line motion, not heavy object animation. Pauses on hidden tabs.
    let t=0;
    function animate(){if(document.hidden||reducedMotion)return;t+=.0025;edges.forEach((edge,i)=>{
      const p=routePaths[i];if(!p)return;const len=p.getTotalLength();if(len<=0)return;
      const point=p.getPointAtLength(len*((t+i*.16)%1));partNodes[i]?.setAttribute('cx',point.x);partNodes[i]?.setAttribute('cy',point.y);
    });raf=requestAnimationFrame(animate);}
    if(reducedMotion){edges.forEach((e,i)=>{partNodes[i]?.setAttribute('cx',e.b.x);partNodes[i]?.setAttribute('cy',e.b.y);});}
    else animate();
  }
  render();const ro=new ResizeObserver(()=>render(current));ro.observe(svgNode);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)render(current);});
  return {setState:render,destroy(){ro.disconnect();cancelAnimationFrame(raf);}};
}
