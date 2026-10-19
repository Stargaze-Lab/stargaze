import * as d3 from 'd3';
import { wheatBaseline } from './data.js';
import { SWISS_PATH } from './switzerland-shape.js';

const fmt = d3.format(',');
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

export function initLab(){
  const rebalance=document.querySelector('#rebalance');
  const directions=document.querySelector('#lab-directions');
  const outputSvg=d3.select('#lab-output-viz');
  const mapSvg=d3.select('#lab-map-viz');
  const mapReadout=document.querySelector('#lab-map-readout');
  const status=document.querySelector('#lab-status-copy');
  const radar=document.querySelector('#dependency-radar');
  const methodButtons=[...document.querySelectorAll('#production-method button')];
  const lensButtons=[...document.querySelectorAll('#lens button')];
  const lensCopy=document.querySelector('#lens-copy');
  const wheat=document.querySelector('#wheat-slider');
  const wheatChange=document.querySelector('#wheat-change');
  const wheatDemand=document.querySelector('#wheat-demand');
  const wheatArea=document.querySelector('#wheat-area');

  let balanceValue=0;
  let productionMethod='open';
  let responsibility='here';
  let wheatPct=0;

  const lensText={
    here:'Local action can change practices and land management, but cannot erase input and trade dependencies.',
    region:'Regional coordination connects production, infrastructure, storage and ecosystems across local borders.',
    country:'National policy can alter incentives, trade rules and protected land: but Switzerland remains networked.',
    elsewhere:'External territories remain part of Swiss food through feed, ingredients, commodities and transformation chains.'
  };

  // No random geospatial points: the map is an OBSERVED backdrop, not a
  // geographic output of the thought experiment. No spatial scenario estimates
  // exist in the frozen evidence package.

  function qualitative(v){
    balanceValue=v;
    const direction=Math.abs(v)<10?'baseline':v>0?'morePlant':'moreAnimal';
    const rows={
      baseline:[
        ['ARABLE FEED','Current food-system demand'],['PERMANENT / ALPINE GRASS','Cannot be treated as cropland'],
        ['PLANT FOODS','Current demand'],['TRADE','Both imports and exports matter']
      ],
      morePlant:[
        ['ARABLE FEED','Pressure may decline'],['PERMANENT / ALPINE GRASS','No automatic conversion to fields'],
        ['PLANT FOODS','Demand increases'],['TRADE','Depends on crop suitability and supply']
      ],
      moreAnimal:[
        ['ARABLE FEED','Pressure may increase'],['PERMANENT / ALPINE GRASS','Pasture dependency may increase'],
        ['PLANT FOODS','Relative dietary demand declines'],['TRADE','Feed and production inputs still matter']
      ]
    }[direction];
    directions.innerHTML=rows.map(([name,outcome])=>`<div class="qual-row"><span>${name}</span><b>${outcome}</b></div>`).join('');
    status.textContent=direction==='baseline'?'Observed map / baseline':direction==='morePlant'?'More plant foods · qualitative scenario':'More animal foods · qualitative scenario';
    renderOutput(rows);renderMap();
  }

  function renderOutput(rows){
    const node=document.querySelector('#lab-output-viz');
    const w=node.clientWidth||760,h=node.clientHeight||260;
    outputSvg.attr('viewBox',`0 0 ${w} ${h}`);outputSvg.selectAll('*').remove();
    const g=outputSvg.append('g');
    g.append('text').attr('x',18).attr('y',25).attr('class','lab-row-label').text('HOW THE SYSTEM RESPONDS / NOT SPATIAL ALLOCATION');
    rows.forEach(([name,outcome],i)=>{
      const y=64+i*47;
      g.append('line').attr('x1',18).attr('y1',y+8).attr('x2',w-18).attr('y2',y+8).attr('class','lab-track');
      g.append('text').attr('x',18).attr('y',y-5).attr('class','lab-row-label').text(name);
      g.append('text').attr('x',w-18).attr('y',y-5).attr('text-anchor','end').attr('class','lab-row-label').text(outcome.toUpperCase());
    });
  }

  function renderMap(){
    mapSvg.attr('viewBox','0 0 1000 600');mapSvg.selectAll('*').remove();
    const defs=mapSvg.append('defs');
    defs.append('clipPath').attr('id','lab-swiss-clip').append('path').attr('d',SWISS_PATH);
    const pattern=defs.append('pattern').attr('id','lab-hatch').attr('patternUnits','userSpaceOnUse').attr('width',16).attr('height',16).attr('patternTransform','rotate(-25)');
    pattern.append('line').attr('y2',16).attr('stroke','#6d7c6b').attr('stroke-width',1).attr('opacity',.32);
    mapSvg.append('path').attr('d',SWISS_PATH).attr('fill','#e8e9da').attr('stroke','#28382f').attr('stroke-width',3);
    const ground=mapSvg.append('g').attr('clip-path','url(#lab-swiss-clip)');
    ground.append('image').attr('href',`${import.meta.env.BASE_URL}assets/switzerland-current-use.png`).attr('x',0).attr('y',0).attr('width',1000).attr('height',600).attr('preserveAspectRatio','xMidYMid meet').attr('opacity',.16);
    ground.append('rect').attr('width',1000).attr('height',600).attr('fill','url(#lab-hatch)').attr('opacity',.42);
    // CONCEPTUAL object stage: positions describe process, never modeled farm sites.
    // Elements are fixed schematic locations; control values affect depiction, not hectares or geography.
    const morePlant=balanceValue>9, moreAnimal=balanceValue< -9;
    const colPlant=morePlant?'#648468':'#97a38a',colAnimal=moreAnimal?'#b56b4f':'#ad9882';
    function object(x,y,type,label,sub,info,opacity=1){
      const g=mapSvg.append('g').attr('class','lab-object').attr('transform',`translate(${x},${y})`).attr('opacity',opacity).attr('tabindex',0).attr('role','button').attr('aria-label',`${label}. ${info}`);
      const p=g.append('g').attr('class','lab-object-parts');
      p.append('ellipse').attr('cx',0).attr('cy',51).attr('rx',66).attr('ry',12).attr('fill','#26372f').attr('opacity',.14);
      p.append('path').attr('d','M-51,19 L0,-7 L52,19 L0,46 Z M-51,19 V31 L0,59 L52,31 V19').attr('fill','#647869').attr('stroke','#24392e').attr('stroke-width',2.2);
      p.append('path').attr('d','M-51,19 L0,-7 L52,19 L0,46 Z').attr('fill',type==='animal'?colAnimal:colPlant).attr('stroke','#233830').attr('stroke-width',2.2);
      const part=(d,fill='#dde1c8',stroke='#2a453a')=>p.append('path').attr('d',d).attr('fill',fill).attr('stroke',stroke).attr('stroke-width',2).attr('stroke-linejoin','round');
      if(type==='field'){
        if(productionMethod==='controlled'){
          for(let i=0;i<3;i++){const yy=-22-i*18;part(`M-27,${yy} L0,${yy-10} L28,${yy} L0,${yy+10} Z`,'#e2d9bf');p.append('path').attr('d',`M-20,${yy} l7,-5 m8,5 l7,-5 m7,5 l7,-5`).attr('stroke','#65966c').attr('stroke-width',4);}
        }else if(productionMethod==='protected'){
          part('M-40,15 V-22 Q0,-69 40,-22 V15 L0,35 Z','rgba(169,211,205,.55)');
          for(let i=-2;i<=2;i++) p.append('path').attr('d',`M${i*13},14 v-25 m0,13 l-8,-8 m8,8 l8,-9`).attr('stroke','#497e57').attr('stroke-width',2).attr('fill','none');
        }else{
          for(let i=-2;i<=2;i++)p.append('path').attr('d',`M${i*14},17 v-40 m0,12 l-9,-12 m9,13 l9,-14`).attr('stroke','#2f724b').attr('stroke-width',3).attr('fill','none');
        }
      }else if(type==='animal'){
        part('M-34,-1 L-25,-43 L18,-43 L34,-25 L25,0 Z','#eee0c6');
        part('M-32,-33 l-12,-13 m64,7 l12,-12','none');
        p.append('circle').attr('cx',17).attr('cy',-31).attr('r',3).attr('fill','#24392e');
        p.append('path').attr('d','M-20,-5 V20 M18,-5 V19').attr('stroke','#253b30').attr('stroke-width',5);
      }else if(type==='factory'){
        part('M-35,10 V-39 L-5,-26 L13,-39 L33,-24 V10 Z','#d6a88d');part('M12,-38 V-65 H23 V-32','#b16f53');
        for(let i=-1;i<=1;i++)p.append('rect').attr('x',i*20-5).attr('y',-15).attr('width',8).attr('height',11).attr('fill','#344940');
      }else if(type==='city'){
        for(const [xx,yy,hh] of [[-29,-9,37],[-5,-19,54],[22,-6,34]]){
          part(`M${xx-10},${yy} l10,-7 10,7 v${hh} l-10,8 -10,-8 Z`,'#a2ada2');
          p.append('path').attr('d',`M${xx},${yy-4} v${hh}`).attr('stroke','#f6eddb').attr('stroke-width',1);
        }
      }else if(type==='mountain'){
        part('M-49,17 L-18,-60 L8,-13 L32,-49 L52,19 Z','#90a2a2');part('M-18,-60 L-32,-25 L-2,-27 Z','#eef0e6');part('M32,-49 L22,-27 L42,-23 Z','#eef0e6');
      }
      // Handmade detailing: deliberately readable pictograms, not additional mapped observations.
      const ink='#345447', gold='#e7bd6d';
      const detail=(d,color=ink,width=1.6)=>p.append('path').attr('d',d).attr('fill','none').attr('stroke',color).attr('stroke-width',width).attr('stroke-linecap','round').attr('stroke-linejoin','round');
      if(type==='field'){
        // Field contours, small leaves and exposed growing structure; the object changes with the selector above.
        detail('M-42,22 L0,42 L43,22 M-36,30 L0,48 L36,30', '#365e43',1.2);
        if(productionMethod==='open'){
          for(const xx of [-26,-13,0,13,26]){detail(`M${xx},-8 l-4,-5 m4,5 l4,-7`,'#d7bc7b',1.6);}
        }else if(productionMethod==='protected'){
          detail('M-38,-20 Q0,-62 38,-20 M-28,-27 V17 M0,-39 V21 M28,-27 V17','#edf5df',1.2);
        }else{
          detail('M-33,-19 H34 M-33,-1 H34 M-33,17 H34','#568772',1.8);
          detail('M25,-43 l5,-6 m-5,6 l6,1','#d39f66',2);
        }
      }else if(type==='animal'){
        // Subtle coat markings, ears and legs make the dairy pictogram unambiguous at small scale.
        p.append('path').attr('d','M-22,-35 L-7,-31 L-12,-16 L-27,-19 Z').attr('fill','#887968').attr('opacity',.78);
        p.append('path').attr('d','M-2,-37 L13,-38 L20,-27 L8,-19 Z').attr('fill','#887968').attr('opacity',.56);
        detail('M-36,-42 L-45,-49 M28,-36 L39,-44 M-26,14 H-16 M13,13 H23','#54654e',2);
        p.append('circle').attr('cx',25).attr('cy',-27).attr('r',2.6).attr('fill','#233a30');
      }else if(type==='factory'){
        detail('M-27,16 H30 M-24,4 H25','#7a533f',1.4);
        for(const x of [-23,-10,4,18])p.append('rect').attr('x',x-3).attr('y',-15).attr('width',6).attr('height',9).attr('fill','#edddb8').attr('stroke','#6b715a').attr('stroke-width',1);
        detail('M17,-66 c-8,-9 -2,-15 4,-19 m-2,16 c7,-8 10,-16 5,-22','#ab896e',1.5);
        detail('M-36,21 l72,0','#f5e7c9',1);
      }else if(type==='city'){
        for(const [x,y] of [[-33,-6],[-33,7],[-9,-17],[-9,-4],[16,2],[28,10]])p.append('rect').attr('x',x).attr('y',y).attr('width',6).attr('height',7).attr('fill','#f1dfb9').attr('stroke','#637569').attr('stroke-width',.6);
        detail('M-38,26 H42 M-45,31 H48','#52706a',1.5);
      }else if(type==='mountain'){
        detail('M-36,18 L-17,-30 L-2,-11 L10,7 M4,14 L30,-34 L46,13','#4a6e71',1.4);
        detail('M-40,25 Q-25,20 -9,25 T24,25 T52,25','#c6decf',1.2);
        for(const x of [-33,5,42])detail(`M${x},12 v-16 m-8,12 l8,-11 l8,11 m-6,-18 l6,-9 l6,9`,'#4d7b67',1.7);
      }
      // One tiny legend needle per object: same graphic grammar throughout the LAB.
      p.append('circle').attr('cx',0).attr('cy',51).attr('r',2).attr('fill',gold);
      g.append('text').attr('y',82).attr('text-anchor','middle').attr('class','lab-object-label').text(label);
      g.append('text').attr('y',98).attr('text-anchor','middle').attr('class','lab-object-sub').text(sub);
      const activate=()=>{mapReadout.querySelector('span').textContent=label.toUpperCase();mapReadout.querySelector('b').textContent=info;};
      g.on('pointerenter',activate).on('focus',activate).on('click',activate).on('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}});
      return g;
    }
    // Schematic machines rather than farm-location pins. No count/area encoded by tile count.
    const n=morePlant?1:.62, a=moreAnimal?1:.57;
    object(245,260,'field',productionMethod==='open'?'CROPS':productionMethod==='protected'?'GREENHOUSE':'CONTROLLED GROW','land · water · inputs','Production systems shift their dependencies; no measured area is assigned.',n);
    object(495,225,'animal','LIVESTOCK','grass · feed · dairy','Pasture and feed are different land dependencies; this is not an animal count.',a);
    object(695,274,'factory','TRANSFORMATION','processing · energy','Processing can happen inside Switzerland even when materials were imported.',.94);
    object(820,360,'city','CITY + CONSUMPTION','space · logistics','Settlements and consumption are connected, but this is a schematic placement.',.88);
    object(350,450,'mountain','MOUNTAINS','non-interchangeable','Alpine terrain does not become cropland by changing a slider.',.83);
    const lines=mapSvg.insert('g','.lab-object').attr('class','lab-concept-lines');
    const paths=[['M300,254 C353,125 418,130 442,211', 'food / feed'],['M552,225 C618,185 648,205 657,258', 'milk / processing'],['M733,311 C764,307 785,330 806,344','food distribution']];
    paths.forEach(([d,label],i)=>{
      lines.append('path').attr('d',d).attr('class','lab-animated-route').attr('stroke',i===0?colPlant:i===1?colAnimal:'#9c735e');
      const path=lines.append('path').attr('d',d).node();
      const len=path.getTotalLength();const point=path.getPointAtLength(len*.55);
      lines.append('circle').attr('cx',point.x).attr('cy',point.y).attr('r',4).attr('fill','#b66f50');
    });
    const lensLabels={here:'LOCAL PRACTICES',region:'REGIONAL INFRASTRUCTURE',country:'NATIONAL POLICY',elsewhere:'EXTERNAL INPUTS + TRADE'};
    const lensColors={here:'#5f8565',region:'#b7a167',country:'#ae7359',elsewhere:'#a76566'};
    const lensLength={here:1,region:2,country:3,elsewhere:4}[responsibility];
    const outside=mapSvg.append('g').attr('class','lab-external-network');
    for(let i=0;i<lensLength;i++){
      const x=65+i*25,y=95+i*30;
      outside.append('path').attr('d',`M${x},${y} C-20,${y-20} 115,${y+125} ${180+i*35},${255+i*17}`).attr('fill','none').attr('stroke',lensColors[responsibility]).attr('stroke-width',1.5+i*.5).attr('stroke-dasharray','5 8').attr('opacity',.6);
      outside.append('circle').attr('cx',x).attr('cy',y).attr('r',4+i*.7).attr('fill',lensColors[responsibility]);
    }
    outside.append('text').attr('x',22).attr('y',37).attr('class','lab-context-caption').text(`RESPONSIBILITY LENS / ${lensLabels[responsibility]}`);
    outside.append('text').attr('x',22).attr('y',55).attr('class','lab-context-value').text('Paths describe dependency, not transport volume.');
    const pct=Number(wheatPct),row=mapSvg.append('g').attr('class','lab-wheat-marks');
    row.append('rect').attr('x',42).attr('y',522).attr('width',380).attr('height',56).attr('fill','#eee8d9').attr('stroke','#b6b3a7');
    row.append('text').attr('x',54).attr('y',541).attr('class','lab-context-caption').text('BREAD-GRAIN CALIBRATION / SCENARIO');
    row.append('text').attr('x',54).attr('y',563).attr('class','lab-context-value').text(`DEMAND ${pct>0?'+':''}${pct}%  ·  NO SPATIAL ALLOCATION`);
    const bar=mapSvg.append('g').attr('class','lab-wheat-equivalence').attr('transform','translate(446,543)');
    for(let i=0;i<21;i++){
      bar.append('path').attr('d',`M${i*16},10 v-17 m0,9 l-5,-5 m5,5 l5,-6`).attr('fill','none').attr('stroke',i<10+pct?'#9e684b':'#bac3ac').attr('stroke-width',i<10+pct?2:1).attr('opacity',i<10+pct?1:.6);
    }
    mapSvg.append('path').attr('d',SWISS_PATH).attr('fill','none').attr('stroke','#28382f').attr('stroke-width',2.3);
    mapReadout.querySelector('span').textContent='SCENARIO / OBJECT MODEL';
    mapReadout.querySelector('b').textContent='Tap an object for its dependency';
  }

  function renderRadar(method='open'){
    const profiles={
      open:[['TERRITORY','Direct land and weather exposure'],['ENERGY','Lower structure intensity; weather-dependent'],['DEPENDENCY','Soil, climate, water, seasonal logistics']],
      protected:[['TERRITORY','Production within protective structures'],['ENERGY','Infrastructure/energy requirements increase'],['DEPENDENCY','Construction, irrigation, materials and logistics']],
      controlled:[['TERRITORY','Growing environment separated from open fields'],['ENERGY','Energy and technical-system requirements are central'],['DEPENDENCY','Substrates, equipment, water and electricity']]
    };
    radar.innerHTML=`<div class="tradeoffs">${profiles[method].map(([key,value])=>`<p><b>${key}</b><span>${value}</span></p>`).join('')}<small>Qualitative dependency comparison; not a scored model.</small></div>`;
  }

  rebalance.addEventListener('input',e=>qualitative(+e.target.value));
  methodButtons.forEach(b=>b.addEventListener('click',()=>{methodButtons.forEach(x=>x.classList.remove('is-active'));b.classList.add('is-active');productionMethod=b.dataset.method;renderRadar(productionMethod);renderMap();}));
  lensButtons.forEach(b=>b.addEventListener('click',()=>{lensButtons.forEach(x=>x.classList.remove('is-active'));b.classList.add('is-active');responsibility=b.dataset.lens;lensCopy.textContent=lensText[responsibility];renderMap();}));

  wheat.addEventListener('input',()=>{
    wheatPct=+wheat.value; const delta=wheatBaseline.millingDemand*(wheatPct/100), demand=wheatBaseline.millingDemand+delta, area=delta/wheatBaseline.effectiveYield;
    wheatChange.textContent=`${wheatPct>0?'+':''}${wheatPct}%`; wheatDemand.textContent=`${fmt(Math.round(demand))} t`; wheatArea.textContent=`${area>0?'+':''}${fmt(Math.round(area))} ha`;
    renderMap();
  });

  renderRadar();
  qualitative(0);
  renderMap();
}
