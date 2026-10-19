import * as d3 from 'd3';
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
// One glyph is exactly one kg; 505 green, 304 rust, never a fictitious sample.
export function initBalanceWeave(node){
 const svg=d3.select(node), data=d3.range(809).map(i=>({index:i,group:i<505?'plant':'animal'}));
 function render(){
  const w=node.clientWidth||700,h=node.clientHeight||400,cols=w<500?38:48,cell=Math.min((w-35)/cols,14),rows=Math.ceil(data.length/cols);
  const totalWidth=cols*cell,x0=(w-totalWidth)/2, y0=Math.max(18,(h-rows*cell)/2);
  svg.attr('viewBox',`0 0 ${w} ${h}`);svg.selectAll('*').remove();
  svg.append('text').attr('class','weave-caption').attr('x',w/2).attr('text-anchor','middle').attr('y',12).text('ONE MARK = ONE KILOGRAM · 505 PLANT / 304 ANIMAL');
  const g=svg.append('g');data.forEach(d=>{
    const x=x0+(d.index%cols)*cell,y=y0+Math.floor(d.index/cols)*cell;
    g.append('path').attr('class',`weave-mark ${d.group}`).attr('d',`M${x},${y+cell*.68} l${cell*.46},-${cell*.40} m0,0 l${cell*.28},${cell*.28}`).attr('opacity',.9)
       .attr('stroke-width',Math.max(.8,cell*.1)).attr('fill','none').attr('tabindex',0).attr('role','img').attr('aria-label',`${d.group==='plant'?'Plant':'Animal'} food; one of ${d.group==='plant'?505:304} kilograms`);
  });
  svg.append('text').attr('class','weave-caption').attr('x',w/2).attr('y',Math.min(h-3,y0+rows*cell+18)).attr('text-anchor','middle').text('809 MICRO-MARKS · OBSERVED MASS / NOT ENERGY');
 }
 render();const ro=new ResizeObserver(render);ro.observe(node);return ()=>ro.disconnect();
}
export function initBalanceChart(svgNode){
 const svg=d3.select(svgNode);
 function render(){
  const w=svgNode.clientWidth||720,h=svgNode.clientHeight||440;svg.attr('viewBox',`0 0 ${w} ${h}`);svg.selectAll('*').remove();
  const compact=w<560,left=compact?28:70,right=compact?24:60,barW=w-left-right;
  const g=svg.append('g');g.append('text').attr('class','shock-caption').attr('x',left).attr('y',45).text('DOMESTIC / AVAILABLE FOOD ENERGY');
  g.append('text').attr('class','shock-sub').attr('x',left).attr('y',70).text('2023  →  2024 · AN OBSERVED CHANGE');
  const rows=[{year:'2023',value:54,cls:'prior'},{year:'2024',value:50,cls:'now'}];
  rows.forEach((d,i)=>{
   const y=compact?125+i*109:145+i*128;
   g.append('text').attr('class','shock-year').attr('x',left).attr('y',y-23).text(d.year);
   g.append('text').attr('class','shock-value').attr('x',w-right).attr('y',y-23).attr('text-anchor','end').text(`${d.value}%`);
   g.append('rect').attr('x',left).attr('y',y).attr('width',barW).attr('height',compact?25:32).attr('class','shock-track');
   const r=g.append('rect').attr('x',left).attr('y',y).attr('height',compact?25:32).attr('class',`shock-bar ${d.cls}`).attr('width',reduce?barW*d.value/100:0);
   if(!reduce)r.transition().duration(850).attr('width',barW*d.value/100);
  });
  g.append('line').attr('class','shock-delta').attr('x1',left+barW*.50).attr('x2',left+barW*.54).attr('y1',compact?342:398).attr('y2',compact?342:398);
  g.append('text').attr('class','shock-annotation').attr('x',left).attr('y',compact?376:426).text('−4 PERCENTAGE POINTS');
  g.append('text').attr('class','shock-sub').attr('x',left).attr('y',compact?405:455).text('Extreme weather · −12% domestic plant-food energy');
  g.append('rect').attr('class','chart-hover-target').attr('x',left).attr('y',94).attr('width',barW).attr('height',240).attr('fill','transparent').attr('pointer-events','all')
  .append('title').text('2023: 54%; 2024: 50%. A fall of 4 percentage points.');
 }
 render();const ro=new ResizeObserver(render);ro.observe(svgNode);return ()=>ro.disconnect();
}
