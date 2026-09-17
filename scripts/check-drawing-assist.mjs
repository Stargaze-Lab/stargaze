// Behaviour fixtures for hand-drawn contours, using the production geometry helpers.
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const result=await build({entryPoints:['src/instruments/chromascope/drawing.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {assistDrawing,coastRotation}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const tau=Math.PI*2;
const circle=Array.from({length:101},(_,i)=>{const a=i/100*tau,r=.23+.004*Math.sin(i*2.1);return{x:.2+Math.cos(a)*r,y:.15+Math.sin(a)*r};});
const refined=assistDrawing(circle);assert.equal(refined.kind,'circle');
const center=refined.points.reduce((a,p)=>({x:a.x+p.x/64,y:a.y+p.y/64}),{x:0,y:0});
const radii=refined.points.map(p=>Math.hypot(p.x-center.x,p.y-center.y));assert.ok(Math.max(...radii)-Math.min(...radii)<1e-10,'Circle is exact');
function handPolygon(vertices){return vertices.flatMap((p,k)=>{const q=vertices[(k+1)%vertices.length];return Array.from({length:30},(_,i)=>({x:p.x+(q.x-p.x)*i/30+.0015*Math.sin(i*2),y:p.y+(q.y-p.y)*i/30+.0015*Math.cos(i*3)}));});}
for(const vertices of [[{x:-.2,y:-.2},{x:.3,y:-.2},{x:.3,y:.3},{x:-.2,y:.3}],[{x:0,y:-.3},{x:.35,y:.25},{x:-.3,y:.25}],Array.from({length:5},(_,i)=>({x:.3*Math.cos(i/5*tau),y:.3*Math.sin(i/5*tau)}))]){
 const output=assistDrawing(handPolygon(vertices));assert.equal(output.kind,'polygon');assert.equal(output.points.length,vertices.length,'Keep intentional corners');
}
const squiggle=Array.from({length:160},(_,i)=>{const a=i/159*tau,r=.27+.085*Math.sin(3*a)+.035*Math.cos(5*a)+.002*Math.sin(i*2.7);return{x:r*Math.cos(a),y:r*.8*Math.sin(a)};});
assert.equal(assistDrawing(squiggle).kind,'smooth','Organic contours are not forced into geometry');
assert.equal(assistDrawing(circle,'free').kind,'smooth','Free mode bypasses circle snapping');
assert.equal(assistDrawing(circle,'lines').kind,'polygon','Lines mode produces crisp segments');
const ellipse=circle.map(p=>({x:p.x,y:p.y*.5}));assert.equal(assistDrawing(ellipse).kind,'smooth','Do not turn deliberate ellipses into circles');
for(const input of [circle,squiggle,ellipse,handPolygon([{x:-.1,y:-.1},{x:.9,y:0},{x:.4,y:.8}])]){
 const output=assistDrawing(input);assert.ok(output.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.hypot(p.x,p.y)<=.960001));
}
// Coast integration should look the same on 60 and 120 Hz displays, and settle in a few seconds.
function spin(hz){let v=2.2,angle=0,frames=0;while(v&&frames<10*hz){const step=coastRotation(v,1/hz);angle+=step.delta;v=step.velocity;frames++;}return{angle,v,seconds:frames/hz};}
const a=spin(60),b=spin(120);assert.equal(a.v,0);assert.equal(b.v,0);assert.ok(a.seconds>2&&a.seconds<4);assert.ok(Math.abs(a.angle-b.angle)<.001);assert.ok(coastRotation(-1,.1).delta<0);
console.log('Drawing assist passed: exact circle, shaky polygons, organic contour, ellipse, explicit modes, finite bounds; inertia settles consistently across refresh rates.');

const opticsBundle=await build({entryPoints:['src/instruments/chromascope/optics.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {driftingShapes,examplePlate,area}=await import('data:text/javascript;base64,'+Buffer.from(opticsBundle.outputFiles[0].text).toString('base64'));
const baseline=examplePlate().shapes,snapshot=JSON.stringify(baseline);
for(const time of [0,1,5,10,30,10000]){const shapes=driftingShapes(baseline,time);assert.deepEqual(shapes[0],baseline[0],'Largest piece remains fixed');for(let i=0;i<shapes.length;i++){assert.ok(Math.abs(area(shapes[i].points)-area(baseline[i].points))<1e-10,'Rigid movement preserves the drawn form');assert.ok(shapes[i].points.every(p=>Math.hypot(p.x,p.y)<=.970001));}}
assert.equal(JSON.stringify(baseline),snapshot,'Animation never mutates its source');
console.log('Drift geometry passed: fixed large piece, bounded small pieces, shape preservation and no accumulated movement.');
