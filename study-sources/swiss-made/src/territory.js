import * as d3 from 'd3';
import { territoryMetrics } from './data.js';
// A comparison WITHIN the LPIS/UAA 2021 universe. Does not allocate modeled values to pixels.
export function initTerritoryFlow(svgNode){
  const svg=d3.select(svgNode);let mode='current';
  const f=d3.format(',');
  function render(next=mode){
    mode=next;svg.selectAll('*').remove();
    if(mode!=='capability')return;
    svg.attr('viewBox','0 0 850 520').attr('preserveAspectRatio','xMidYMid meet');
    svg.append('rect').attr('width',850).attr('height',520).attr('fill','#f0ede4').attr('opacity',.98);
    const text=(x,y,content,opts={})=>svg.append('text').attr('x',x).attr('y',y).attr('font-family','DM Mono,monospace').attr('font-size',opts.size||15).attr('font-weight',opts.bold?700:400).attr('fill',opts.fill||'#293a30').text(content);
    text(32,44,'SITE-ADAPTED LAND USE / SAME ANALYZED AGRICULTURAL AREA',{size:14,bold:true});
    text(32,68,'2021 LPIS / UAA · CURRENT OBSERVED USE vs MODELED S3',{size:12,fill:'#667069'});
    const x=34, max=510000, len=770;
    const rows=[
      {title:'ARABLE LAND', y:132, current:territoryMetrics.current.arable, future:territoryMetrics.s3.arable, col:'#b56d4f'},
      {title:'GRASSLAND', y:314, current:territoryMetrics.current.grass, future:territoryMetrics.s3.grass, col:'#789267'}
    ];
    rows.forEach(d=>{
      const delta=d.future-d.current;
      text(34,d.y-15,d.title,{size:19,bold:true});
      text(34,d.y+19,'CURRENT · LPIS 2021',{size:12});
      text(688,d.y+19,`${f(d.current)} ha`,{size:15,bold:true});
      const barY=d.y+32;
      svg.append('rect').attr('x',x).attr('y',barY).attr('width',len).attr('height',18).attr('fill','#dedfd6');
      svg.append('rect').attr('x',x).attr('y',barY).attr('width',d.current/max*len).attr('height',18).attr('fill',d.col).attr('opacity',.94).append('title').text(`Current ${d.title.toLowerCase()}: ${f(d.current)} hectares`);
      text(34,d.y+84,'MODELED S3',{size:12});
      text(688,d.y+84,`${f(d.future)} ha`,{size:15,bold:true});
      const newY=d.y+96;
      svg.append('rect').attr('x',x).attr('y',newY).attr('width',len).attr('height',18).attr('fill','#dedfd6');
      svg.append('rect').attr('x',x).attr('y',newY).attr('width',d.future/max*len).attr('height',18).attr('fill',d.col).attr('opacity',.48).append('title').text(`Modeled S3 ${d.title.toLowerCase()}: ${f(d.future)} hectares`);
      text(34,d.y+140,`Δ ${delta>0?'+':''}${f(delta)} ha / modeled shift`,{size:12,fill:'#5b6c61'});
    });
    svg.append('line').attr('x1',32).attr('x2',818).attr('y1',478).attr('y2',478).attr('stroke','#b7c0b5');
    text(34,500,'MODEL OUTPUTS, NOT SPARE FIELDS OR GEOGRAPHIC PREDICTIONS',{size:12});
  }
  render(); return {setState:render};
}
