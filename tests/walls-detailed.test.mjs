import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calcWall,materials} from '../public/assets/ak-engine.mjs';
import {wallLayout} from '../public/assets/ak-wall-layout.mjs';
import {wallPlanSvg} from '../public/assets/ak-wall-plan.mjs';
import {drawWallPrintPage} from '../public/assets/ak-wall-print.mjs';
const make=(extra={})=>calcWall({L:5,H:2.8,doorW:.9,doorH:2.1,doorX:.2,kind:'cloison',spacing:.6,studLength:3,layers:1,...extra});
function mock(){const painted={texts:[],lines:[]};let v=null;const ctx={save(){},restore(){},setTransform(){},fillRect(){},strokeRect(){},fill(){},beginPath(){v=null},moveTo(x,y){v={x1:x,y1:y}},lineTo(x,y){if(v){v.x2=x;v.y2=y}},stroke(){if(v)painted.lines.push({...v,color:ctx.strokeStyle});v=null},fillText(s){painted.texts.push(String(s))}};return {ctx,painted};}
test('Door opening uses user-defined offset and actual rail segments',()=>{
 const a=make();
 assert.equal(a.openings.length,1);
 assert.deepEqual(a.openings[0],{id:'door-legacy',type:'door',x:.2,top:.7,w:.9,h:2.1,right:1.1,bottom:2.8,sill:0});
 assert.equal(a.railSegments.length,4);
 assert.ok(Math.abs(a.railLinear-10)<1e-6);
 assert.equal(a.extraStuds,2);
 assert.equal(a.studs,a.baseStuds+2);
 assert.equal(a.montants,a.studs);
 assert.ok(a.railBars.every(bar=>bar.reduce((sum,n)=>sum+n,0)<=3+1e-6));
 assert.equal(materials(a).find(r=>r.name==='Rails 3m').qty,a.rails);
});
test('Door and window openings deduct areas and show actual placements',()=>{
 const p=make({windowW:1,windowH:1.2,windowX:3.2,windowBottom:.9,kind:'cloison',layers:2});
 assert.equal(p.openings.length,2);
 assert.ok(Math.abs(p.netArea-(14-1.89-1.2))<1e-7);
 assert.equal(p.openings[1].x,3.2);assert.equal(p.openings[1].top,.7);
 assert.equal(p.layers,2);assert.equal(p.faces,2);assert.equal(p.extraStuds,4);
 assert.ok(p.rails>=Math.ceil(p.railLinear/3));
 assert.ok(p.railJoins>=0);
 assert.equal(materials(p).some(r=>r.name.includes('Raccord Rails')),false);
 assert.match(materials(p).find(r=>r.name==='Rails 3m').why,/مقاطع في خطة القص/);
 assert.doesNotMatch(materials(p).find(r=>r.name==='Rails 3m').why,/وصلات/);
 assert.ok(materials(p).every(r=>!r.name.includes('Rockwool')));
 assert.equal(p.insulated,undefined);
});
test('Rejects windows beyond wall, overlapping openings and negative positions',()=>{
 assert.throws(()=>make({doorX:4.5}),/الباب/);
 assert.throws(()=>make({windowW:1,windowH:1,windowX:4.8}),/الشباك/);
 assert.throws(()=>make({windowW:1,windowH:1.2,windowX:.5,windowBottom:.9}),/متداخلين/);
 assert.throws(()=>make({windowW:1,windowH:1.2,windowX:3,windowBottom:2}),/الشباك/);
 assert.throws(()=>make({doorX:-.1}),/سالبة/);
 assert.throws(()=>make({doorW:-.9}),/سالبة/);
});
test('Wall rail cut packing is feasible across several opening layouts',()=>{
 for(const [L,H,doorW,doorH,doorX] of [[5,2.8,.9,2.1,.2],[9,3,1,2.2,.8],[3,2.8,0,0,0]]){
  const p=calcWall({L,H,doorW,doorH,doorX,kind:'cloison',spacing:.6,studLength:3,layers:1});
  const used=p.railBars.reduce((acc,bar)=>acc+bar.reduce((a,b)=>a+b,0),0);
  assert.ok(Math.abs(used-p.railLinear)<1e-6);
  assert.ok(p.railBars.every(bar=>bar.reduce((a,b)=>a+b,0)<=3+1e-6));
  assert.equal(p.railCutPieces.length-p.railSegments.length,p.railJoins);
 }
});
test('Wall SVG draws only actual openings, reinforcement and rail segments',()=>{
 const p=make({windowW:1,windowH:1,windowX:3.1,windowBottom:.9});
 const svg=wallPlanSvg(p);
 assert.match(svg,/data-diagram="wall"/);
 assert.equal((svg.match(/data-opening="door"/g)||[]).length,1);
 assert.equal((svg.match(/data-opening="window"/g)||[]).length,1);
 assert.equal((svg.match(/data-profile="jamb"/g)||[]).length,p.extraStuds);
 assert.equal((svg.match(/data-profile="rail"/g)||[]).length,p.railSegments.length);
 assert.match(svg,/Montants × /);
 assert.match(svg,/Rails × /);
 assert.match(svg,/data-profile="montant"/);
});
test('Wall PDF page 2 is a separate direct landscape drawing and retains positions',()=>{
 const p=make({windowW:1,windowH:1,windowX:3.1,windowBottom:.9});
 const a=mock();
 drawWallPrintPage(a.ctx,p,3508,2480);
 assert.ok(a.painted.texts.some(s=>s.includes('Porte 0,9×2,1m')));
 assert.ok(a.painted.texts.some(s=>s.includes('Fenêtre 1×1m')));
 assert.ok(a.painted.texts.some(s=>s.includes('5 m')));
 assert.throws(()=>drawWallPrintPage(a.ctx,{type:'armstrong-full'}),/Wall/);
 const app=readFileSync(new URL('../public/assets/ak-app.mjs',import.meta.url),'utf8');
 assert.match(app,/if\(p.type==='wall'\)return wallPlanSvg\(p\)/);
 assert.match(app,/drawWallPrintPage\(z,p,planCanvas.width,planCanvas.height\)/);
 assert.match(app,/isLandscapePrint=isArmPrint\|\|isBA13Print\|\|isWallPrint/);
});
test('Cloison preview uses add controls rather than fixed door/window position inputs',()=>{
 const app=readFileSync(new URL('../public/assets/ak-app.mjs',import.meta.url),'utf8');
 const module=readFileSync(new URL('../public/assets/ak-wall-interactions.mjs',import.meta.url),'utf8');
 const html=readFileSync(new URL('../public/calculators/walls/index.html',import.meta.url),'utf8');
 assert.match(app,/initWallOpenings/);
 assert.match(app,/wallControls\.getOpenings\(\)/);
 assert.match(app,/wallControls\.bindSvg\(plan\)/);
 assert.doesNotMatch(app,/(\['doorX'|\['windowX'|\['windowBottom')/);
 assert.match(module,/wall-add-door/);
 assert.match(module,/wall-add-window/);
 assert.match(module,/data-size-id/);
 assert.match(module,/data-drag-id/);
 assert.doesNotMatch(module,/(rockwool|woolDensity|woolThickness)/);
 assert.match(html,/قيد التطوير/);assert.doesNotMatch(html,/ak-app\.mjs/);
});
