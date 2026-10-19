import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calcWall,materials,calcArmstrongFull,fullArmstrongOptions} from '../public/assets/ak-engine.mjs';
import {planCloisonFixings} from '../public/assets/ak-wall-fixings.mjs';
import {wallPlanSvg} from '../public/assets/ak-wall-plan.mjs';
import {drawWallPrintPage} from '../public/assets/ak-wall-print.mjs';

const base={L:5,H:2.8,openings:[],kind:'cloison',layers:1,spacing:.6,studLength:3};
const cheville=p=>materials(p).find(x=>x.name==='Cheville à frapper');
const countSvg=p=>(wallPlanSvg(p).match(/data-fastener="cheville"/g)||[]).length;
function mock(){
 const t=[];
 const c={save(){},restore(){},setTransform(){},fillRect(){},strokeRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},fillText(v){t.push(String(v))}};
 return {c,t};
}
test('Solid wall fixes top and bottom Rails plus first and last Montant every <=30cm',()=>{
 const p=calcWall(base),f=p.fixings;
 assert.equal(f.interval,.3);
 assert.equal(f.ceilingRail,18); // 5m / 30cm -> 17 spans and two end fixings
 assert.equal(f.floorRail,18);
 assert.equal(f.firstMontant,11); // 2.8m / 30cm -> 10 spans
 assert.equal(f.lastMontant,11);
 assert.equal(f.railCount,36);
 assert.equal(f.montantCount,22);
 assert.equal(f.count,58);
 assert.equal(p.chevilleCount,58);
 assert.equal(p.chevilleRailCount,36);
 assert.equal(p.chevilleMontantCount,22);
 assert.equal(cheville(p).qty,58);
 assert.equal(cheville(p).buy,64); // +10% purchase reserve
 assert.equal(cheville(p).why,'');
 assert.equal(countSvg(p),58);
 assert.equal(f.points.filter(q=>q.kind==='first-montant').every(q=>q.x===0),true);
 assert.equal(f.points.filter(q=>q.kind==='last-montant').every(q=>q.x===5),true);
 assert.equal(f.points.filter(q=>q.kind==='ceiling-rail').every(q=>q.y===0),true);
 assert.equal(f.points.filter(q=>q.kind==='floor-rail').every(q=>q.y===2.8),true);
});

test('Doors interrupt floor Rail fixing count, no fasteners across thresholds',()=>{
 const p=calcWall({...base,openings:[{id:'door-a',type:'door',x:.2,w:.9,h:2.1,bottom:0}]});
 assert.equal(p.fixings.ceilingRail,18);
 assert.equal(p.fixings.floorRail,16); // .2m run (2) + 3.9m run (14)
 assert.equal(p.fixings.montantCount,22);
 assert.equal(p.chevilleCount,56);
 const floor=p.fixings.points.filter(q=>q.kind==='floor-rail');
 assert.ok(floor.every(q=>q.x<=.2+1e-7||q.x>=1.1-1e-7));
 assert.equal(cheville(p).qty,56);
 assert.equal(countSvg(p),56);
});

test('Adding windows does not create masonry Chevilles on window headers and sills',()=>{
 const window={id:'w1',type:'window',x:3,w:1,h:1.2,bottom:.9};
 const plain=calcWall(base),withWindow=calcWall({...base,openings:[window]});
 assert.equal(withWindow.chevilleCount,plain.chevilleCount);
 assert.equal(withWindow.fixings.points.length,plain.fixings.points.length);
 assert.equal(withWindow.railSegments.filter(r=>r.kind==='window-header').length,1);
 assert.equal(withWindow.railSegments.filter(r=>r.kind==='window-sill').length,1);
});

test('Multiple doors and tall wall use all physical perimeter runs with <=30cm spacing',()=>{
 const opens=[
  {id:'d1',type:'door',x:.3,w:.9,h:2.1,bottom:0},
  {id:'d2',type:'door',x:2,w:.9,h:2.1,bottom:0}
 ];
 const p=calcWall({...base,L:8,H:3,openings:opens});
 assert.equal(p.fixings.ceilingRail,28);
 assert.equal(p.fixings.floorRail,24);
 assert.equal(p.fixings.firstMontant,11);
 assert.equal(p.fixings.lastMontant,11);
 assert.equal(p.chevilleCount,74);
 const high=calcWall({...base,H:4});
 assert.equal(high.fixings.ceilingRail,18);
 assert.equal(high.fixings.floorRail,18);
 assert.equal(high.fixings.firstMontant,15);
 assert.equal(high.fixings.lastMontant,15);
 assert.equal(high.chevilleCount,66);
 for(const pnt of high.fixings.points)assert.ok(pnt.x>=0&&pnt.x<=5&&pnt.y>=0&&pnt.y<=4);
 const raw=planCloisonFixings({L:5,H:2.8,railSegments:high.railSegments,interval:.3});
 assert.equal(raw.count,58);
});

test('BOM, technical SVG and two-page PDF have Cheville à frapper values',()=>{
 const p=calcWall(base),v=mock();
 const row=cheville(p);
 assert.equal(row.name,'Cheville à frapper');
 assert.equal(row.unit,'قطعة');
 assert.ok(materials(p).every(m=>m.why===''));
 assert.equal((wallPlanSvg(p).match(/data-fastener="cheville"/g)||[]).length,p.chevilleCount);
 assert.match(wallPlanSvg(p),/class="ak-wall-fixing-mark"/);
 drawWallPrintPage(v.c,p,3508,2480);
 assert.ok(v.t.some(s=>s.includes('Cheville à frapper 58')));
 const app=readFileSync(new URL('../public/assets/ak-app.mjs',import.meta.url),'utf8');
 assert.match(app,/\['Cheville à frapper',p\.chevilleCount\]/);
 assert.match(app,/const rows=materials\(p\)/);
 assert.match(app,/for\(const item of materials\(plan\)\)/);
});

test('30cm Cheville rule affects Cloison only, not published Armstrong calculations',()=>{
 const o=fullArmstrongOptions(8,4)[0];
 const a=calcArmstrongFull({L:8,W:4,drop:30,cut:30,...o});
 assert.equal(a.chevilleCount,undefined);
 assert.equal(materials(a).some(x=>x.name==='Cheville à frapper'),true); // only existing Armstrong perimeter item, independently counted
 const row=materials(a).find(x=>x.name==='Cheville à frapper');
 assert.equal(row.qty,a.wallFix);
});
