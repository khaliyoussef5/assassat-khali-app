import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {calcArmstrongFull,fullArmstrongOptions,calcBA13Ceiling,calcWall,materials} from '../public/assets/ak-engine.mjs';
import {armstrongFullPlanSvg} from '../public/assets/ak-armstrong-plan.mjs';
const root=fileURLToPath(new URL('../public/',import.meta.url));
test('Full Armstrong 8x4: symmetric cut tiles, no BA13',()=>{
 const options=fullArmstrongOptions(8,4);assert.ok(options.length>=2);const a=calcArmstrongFull({L:8,W:4,drop:30,cut:30,...options[0]});
 assert.equal(a.wholeTiles,60);assert.ok(Math.abs(a.edgeL-.4)<1e-7);assert.ok(Math.abs(a.edgeW-.5)<1e-7);
 assert.deepEqual(options[1],{nL:12,nW:6}); // prefer 40/20cm cuts over 10cm
 assert.equal(a.area,32);assert.equal(a.tiles,98);assert.equal(a.angle,8);assert.equal(a.wallFix,48);assert.equal(a.rods,Math.ceil(a.hangers/3));
 assert.ok(materials(a).some(r=>r.name.includes('Armstrong')));
});
test('Full Armstrong exact multiples require no cut borders',()=>{
 const options=fullArmstrongOptions(7.2,3.6);const r=calcArmstrongFull({L:7.2,W:3.6,drop:30,cut:25,...options[0]});
 assert.equal(r.edgeL,0);assert.equal(r.edgeW,0);assert.equal(r.wholeTiles,72);assert.equal(r.tiles,72);
});
test('Full Armstrong invalid custom tile counts fail',()=>{
 assert.throws(()=>calcArmstrongFull({L:8,W:4,drop:30,cut:30,nL:15,nW:6}),/غير صالح/);
 assert.throws(()=>calcArmstrongFull({L:8,W:4,drop:30,cut:30,nL:12.5,nW:5}),/عدد البلاكات/);
});
test('BA13 8x4 simple and hidden light include correct Furure directions and extra perimeter',()=>{
 const base={L:8,W:4,drop:30}; const a=calcBA13Ceiling({...base,mode:'plain'}),b=calcBA13Ceiling({...base,mode:'hidden'});
 assert.equal(a.span,4);assert.equal(a.distribution,8);assert.equal(a.area,32);assert.equal(a.boards,10);assert.equal(a.angle,8);
 assert.equal(b.ledWallPerimeter,24);assert.equal(b.ledLen,23.2);assert.equal(b.perimeterExtra,23.2);assert.ok(Math.abs(b.totalFourrure-a.totalFourrure-23.2)<1e-7);
 assert.ok(b.hangers>a.hangers);assert.equal(a.totalFourrure,a.positions.length*4);assert.equal(b.fourrure,b.stockBars);
 assert.equal(b.first,.15);assert.equal(b.spacing,.5);assert.ok(b.fourrure>a.fourrure);
});
test('Wall 5m x 2.8m, door opening, one side doublage and two-face cloison',()=>{
 const d={L:5,H:2.8,doorW:.9,doorH:2.1,windowW:0,windowH:0,spacing:.6,studLength:3,layers:1};
 const c=calcWall({...d,kind:'cloison',rockwool:false}),f=calcWall({...d,kind:'doublage'});
 assert.ok(Math.abs(c.netArea-(14-1.89))<1e-7);assert.equal(c.faces,2);assert.equal(f.faces,1);
 assert.equal(c.boardArea,f.boardArea*2);assert.ok(c.studs>Math.ceil(5/.6)+1);
 assert.equal(c.insulated,false);
 const a=calcWall({...d,kind:'isolated'});assert.equal(a.insulated,true);assert.ok(a.woolUnits>0);
});
test('Wall prevents unsafe stud length and invalid openings',()=>{
 const d={L:5,H:3.6,kind:'cloison',layers:1,spacing:.6,studLength:3};
 assert.throws(()=>calcWall(d),/طول Montant/);
 assert.throws(()=>calcWall({...d,studLength:4,doorW:6,doorH:2}),/الباب/);
});
test('Three independent routes are present and do not replace current Armstrong calculator',()=>{
 for(const p of ['armstrong-full','ba13-ceiling','walls']){
  assert.ok(existsSync(root+`calculators/${p}/index.html`));
  const html=readFileSync(root+`calculators/${p}/index.html`,'utf8');assert.match(html,new RegExp(`data-calculator="${p}"`));
 }
});


test('8x4: no extra Porteur at a 1.10m wall remainder and every segment counts as a full tee',()=>{
 const p=calcArmstrongFull({L:8,W:4,drop:30,cut:30,nL:12,nW:5});
 assert.deepEqual(p.carrierPositions,[.5,1.7,2.9]);
 assert.equal(p.porteur,9);
 assert.equal(p.cross120,39); // 13 rows × 2 standard 1.20 + 1 cut 1.10 to wall
 assert.equal(p.cross120Cut,13);assert.equal(p.cross120Full,26);
 assert.equal(p.cross060,55); // 13 × 0.50 wall plus 14 × 3 infill
 assert.equal(p.cross060Cut,19);assert.equal(p.cross060Full,36);
 assert.equal(p.wall060,13);assert.equal(p.infill060,42);
 assert.equal(p.crossSegments.length,p.cross120+p.cross060);
 assert.ok(p.crossSegments.every(v=>v.length>0&&v.length<=(v.kind==='cross120'?1.2:.6)+1e-7));
 assert.equal(materials(p).find(v=>v.name==='Cross 1.20m').qty,39);
 assert.equal(materials(p).find(v=>v.name==='Cross 0.60m').qty,55);
});
test('8x4 alternative: 40/20cm full Armstrong border cuts update the grid',()=>{
 const p=calcArmstrongFull({L:8,W:4,drop:30,cut:30,nL:12,nW:6});
 assert.deepEqual(p.carrierPositions,[.2,1.4,2.6,3.8]);
 assert.equal(p.cross120,39);assert.equal(p.cross060,68);assert.equal(p.cross060Cut,32);
});
test('7.2x3.6 full modules need no cut pieces',()=>{
 const p=calcArmstrongFull({L:7.2,W:3.6,drop:30,cut:30,nL:12,nW:6});
 assert.deepEqual(p.carrierPositions,[.6,1.8,3]);
 assert.equal(p.cross120,22);assert.equal(p.cross060,46);
 assert.equal(p.cross060Cut,0);assert.equal(p.rowIntersections,11);
 assert.ok(p.crossSegments.every(v=>!v.cut));
});
test('Main runners remain within 0.60m of wall and 1.20m of each other',()=>{
 for(const [L,W] of [[8,4],[5.8,2.7],[6,4.2],[3,3],[2.5,1.4]]){
 const o=fullArmstrongOptions(L,W)[0],p=calcArmstrongFull({L,W,drop:30,cut:30,...o});
 assert.ok(p.carrierPositions[0]<=.6+1e-8);
 assert.ok(W-p.carrierPositions.at(-1)<=1.2+1e-8);
 for(let i=1;i<p.carrierPositions.length;i++)assert.ok(p.carrierPositions[i]-p.carrierPositions[i-1]<=1.2+1e-8);
 assert.ok(p.crossSegments.every(v=>v.length>0&&v.length<=(v.kind==='cross120'?1.2:.6)+1e-7));
 }
});

test('A 1.00m final wall bay is one Cross 1.20, no extra Porteur',()=>{
 const p=calcArmstrongFull({L:8,W:1.4,drop:30,cut:30,nL:12,nW:1});
 assert.deepEqual(p.carrierPositions,[.4]);
 assert.equal(p.porteur,3);
 const edge=p.crossSegments.filter(v=>v.placement==='to-wall'&&v.kind==='cross120');
 assert.equal(edge.length,13);
 assert.ok(edge.every(v=>v.cut&&Math.abs(v.length-1)<1e-7));
 assert.equal(p.cross120Cut,13);
 const infill=p.crossSegments.filter(v=>v.placement==='infill');
 assert.equal(infill.length,p.lengthCuts.length);
 assert.ok(infill.every(v=>Math.abs(v.y1-1)<1e-7));
});
test('Cross 0.60 and 1.20 are counted as whole pieces, whether drawn cut or whole',()=>{
 for(const [L,W] of [[8,4],[8,1.4],[5.8,2.7],[3,3],[2.5,1.4]]){
  const o=fullArmstrongOptions(L,W)[0],p=calcArmstrongFull({L,W,drop:30,cut:30,...o});
  for(const [key,len] of [['cross060',.6],['cross120',1.2]]){
   const parts=p.crossSegments.filter(s=>s.kind===key);
   assert.equal(p[key],parts.length);
   assert.equal(p[key+'Full']+p[key+'Cut'],parts.length);
   assert.ok(parts.every(v=>v.length>0&&v.length<=len+1e-6));
   const purchaseRow=materials(p).find(v=>v.name==='Cross '+(len===.6?'0.60m':'1.20m'));
   assert.equal(purchaseRow.qty,len===.6?p.cross060Stock:parts.length);
  }
 }
});
test('Diagram preserves stock colors for cut and full tees',()=>{
 const p=calcArmstrongFull({L:8,W:4,drop:30,cut:30,nL:12,nW:6});
 const svg=armstrongFullPlanSvg(p);
 assert.match(svg,/data-profile="cross120"/);
 assert.match(svg,/data-profile="cross060"/);
 assert.match(svg,/data-profile="porteur"/);
 assert.match(svg,/stroke-linecap="butt"/);
 assert.doesNotMatch(svg,/stroke-dasharray="5 3"/);
});

test('Cut Cross 0.60 smaller than 30cm is half a stock bar; installed count and color remain unchanged',()=>{
 const p=calcArmstrongFull({L:8,W:4,drop:30,cut:30,nL:12,nW:6});
 assert.equal(p.cross060,68);  // total installed segments drawn
 assert.equal(p.cross060HalfCount,26); // 13 at each 20cm wall edge
 assert.equal(p.cross060RegularCount,42);
 assert.equal(p.cross060StockEquivalent,55);
 assert.equal(p.cross060Stock,55);
 assert.equal(materials(p).find(r=>r.name==='Cross 0.60m').qty,55);
 assert.equal(materials(p).find(r=>r.name==='Cross 1.20m').qty,p.cross120);
});
test('Half Cross bars pool globally and round up when odd',()=>{
 const p=calcArmstrongFull({L:8,W:4,drop:30,cut:30,nL:13,nW:5});
 const half=p.crossSegments.filter(s=>s.kind==='cross060'&&s.length<.30);
 assert.equal(p.cross060HalfCount,half.length);
 assert.equal(p.cross060Stock,Math.ceil(p.cross060RegularCount+half.length/2));
 assert.ok(p.cross060Stock<=p.cross060);
});
test('Cross 0.60 at exactly 30cm is a whole piece, never a half',()=>{
 const p=calcArmstrongFull({L:8,W:4.2,drop:30,cut:30,nL:12,nW:6});
 assert.ok(Math.abs(p.edgeW-.30)<1e-8);
 assert.equal(p.cross060HalfCount,0);
 assert.equal(p.cross060Stock,p.cross060);
});
test('Stock rule never changes the diagram coordinates or color for short tees',()=>{
 const p=calcArmstrongFull({L:8,W:4,drop:30,cut:30,nL:12,nW:6});
 const svg=armstrongFullPlanSvg(p);
 assert.match(svg,/data-profile="cross060"/);
 assert.match(svg,/stroke="#7C3AED"/);
 assert.match(svg,new RegExp(p.cross060HalfCount+' مقاطع أقل من 30cm'));
 assert.match(svg,new RegExp(p.cross060Stock+' بروفيل'));
});

test('Premium Armstrong plan labels BOTH length sides and BOTH width sides in centimeters',()=>{
 const p=calcArmstrongFull({L:8,W:4,drop:30,cut:30,nL:12,nW:6});
 const svg=armstrongFullPlanSvg(p);
 for(const side of ['length-start','length-end','width-start','width-end']){
  assert.match(svg,new RegExp('data-side="'+side+'"'));
 }
 assert.match(svg,/40 cm/g);
 assert.match(svg,/20 cm/g);
 assert.match(svg,/باقي الطول/);
 assert.match(svg,/باقي العرض/);
 assert.match(svg,/viewBox="0 0 1000 620"/);
 assert.equal((svg.match(/data-profile="cross120"/g)||[]).length,p.cross120);
 assert.equal((svg.match(/data-profile="cross060"/g)||[]).length,p.cross060);
 assert.equal((svg.match(/data-profile="porteur"/g)||[]).length,p.carrierCount);
});
test('Armstrong plan displays zero remainder clearly when tiles fit wall-to-wall',()=>{
 const p=calcArmstrongFull({L:7.2,W:3.6,drop:30,cut:30,nL:12,nW:6});
 const svg=armstrongFullPlanSvg(p);
 assert.match(svg,/باقي الطول: 0 cm/);
 assert.match(svg,/باقي العرض: 0 cm/);
 assert.equal((svg.match(/data-profile="cross120"/g)||[]).length,p.cross120);
 assert.equal((svg.match(/data-profile="cross060"/g)||[]).length,p.cross060);
});
test('Armstrong plan is pure rendering and integrated into calculator/PDF flow',()=>{
 const js=readFileSync(new URL('../public/assets/ak-app.mjs',import.meta.url),'utf8');
 assert.match(js,/import \{armstrongFullPlanSvg\}/);
 assert.match(js,/if\(p\.type==='armstrong-full'\)return armstrongFullPlanSvg\(p,\{showHangers\}\)/);
 assert.match(js,/const svg=svgH\(p\)/);
});
