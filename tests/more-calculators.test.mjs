import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {calcArmstrongFull,fullArmstrongOptions,calcBA13Ceiling,calcWall,materials} from '../public/assets/ak-engine.mjs';
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
 assert.equal(b.ledLen,24);assert.equal(b.perimeterExtra,24);assert.equal(b.totalFourrure,a.totalFourrure+24);
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


test('8x4 full Armstrong: counted tee segments match layout and stock types',()=>{
 const p=calcArmstrongFull({L:8,W:4,drop:30,cut:30,nL:12,nW:5});
 assert.deepEqual(p.carrierPositions,[.5,1.7,2.9,3.5]);
 assert.equal(p.porteur,12);
 assert.equal(p.cross120,26); // 13 rows x 2 bays of 1.20
 assert.equal(p.cross060,67); // 13 rows x (2 wall cuts+1 bay 0.60) + 14 x 2 infill
 assert.equal(p.cross060Full,37);assert.equal(p.cross060Cut,30);
 assert.equal(p.wall060,26);assert.equal(p.infill060,28);
 assert.equal(p.crossSegments.length,p.cross120+p.cross060);
 assert.equal(p.crossSegments.filter(v=>v.kind==='cross120').length,p.cross120);
 assert.equal(p.crossSegments.filter(v=>v.kind==='cross060').length,p.cross060);
 assert.ok(p.crossSegments.every(v=>v.length<=(v.kind==='cross120'?1.2:.6)+1e-7));
 assert.ok(p.crossSegments.filter(v=>v.kind==='cross120').every(v=>!v.cut&&Math.abs(v.length-1.2)<1e-7));
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
 assert.ok(W-p.carrierPositions.at(-1)<=.6+1e-8);
 for(let i=1;i<p.carrierPositions.length;i++)assert.ok(p.carrierPositions[i]-p.carrierPositions[i-1]<=1.2+1e-8);
 assert.ok(p.crossSegments.every(v=>v.length>0&&v.length<=(v.kind==='cross120'?1.2:.6)+1e-7));
 }
});
