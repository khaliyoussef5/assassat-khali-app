import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calcWall,materials,calcArmstrongFull,fullArmstrongOptions} from '../public/assets/ak-engine.mjs';

const app=readFileSync(new URL('../public/assets/ak-app.mjs',import.meta.url),'utf8');
const source=readFileSync(new URL('../public/assets/ak-engine.mjs',import.meta.url),'utf8');
const basic={L:5,H:2.8,spacing:.6,studLength:3,layers:1,kind:'cloison',openings:[]};
const row=p=>materials(p).find(x=>x.name==='ENDUIT POUR JOINT');

test('Placo PR8 25kg uses manufacturer rate 330g/m² of net finished faces',()=>{
 const a=calcWall(basic);
 assert.equal(a.netArea,14);
 assert.equal(a.faces,2);
 assert.equal(a.pr8Area,28);
 assert.equal(a.pr8Kg,9.24);
 assert.equal(a.pr8Bags,1);
 assert.deepEqual({qty:row(a).qty,buy:row(a).buy,unit:row(a).unit},{qty:1,buy:1,unit:'كيس'});
});

test('PR8 uses exposed faces, not hidden board layers, and deducts every opening',()=>{
 const openings=[
  {id:'d1',type:'door',x:.2,w:.9,h:2.1,bottom:0},
  {id:'w1',type:'window',x:3,w:1,h:1.2,bottom:.9}
 ];
 const first=calcWall({...basic,openings});
 const double=calcWall({...basic,openings,layers:2});
 const area=14-.9*2.1-1*1.2;
 assert.ok(Math.abs(first.netArea-area)<1e-8);
 assert.equal(first.pr8Area,Number((area*2).toFixed(6)));
 assert.equal(first.pr8Kg,Number((area*2*.33).toFixed(3)));
 assert.equal(first.pr8Kg,double.pr8Kg);
 assert.equal(first.pr8Bags,double.pr8Bags);
 assert.ok(double.boardArea>first.boardArea);
});

test('PR8 purchase rounds UP to whole 25kg sacks, no double safety reserve',()=>{
 const near=calcWall({...basic,L:37.5,H:1});
 const above=calcWall({...basic,L:38,H:1});
 assert.equal(near.pr8Area,75);assert.equal(near.pr8Kg,24.75);assert.equal(near.pr8Bags,1);
 assert.equal(above.pr8Area,76);assert.equal(above.pr8Kg,25.08);assert.equal(above.pr8Bags,2);
 assert.equal(row(above).qty,2);
 assert.equal(row(above).buy,2);
 const larger=calcWall({...basic,L:40,H:2});
 assert.equal(larger.pr8Kg,52.8);
 assert.equal(larger.pr8Bags,3);
 assert.equal(row(larger).qty,3);
});

test('Wall takeoff has material names and quantities only, no why descriptions',()=>{
 const p=calcWall({...basic,H:4});
 const rows=materials(p);
 assert.equal(rows.length,6);
 assert.deepEqual(rows.map(r=>r.name),[
 'ألواح BA13 (1.20×2.80m)',
 'Rails 3m',
 'Montants 3m',
 'VPT 25 MM',
 'Bande à joint',
 'ENDUIT POUR JOINT'
 ]);
 assert.ok(rows.every(r=>r.why===''));
 assert.ok(rows.every(r=>r.buy>=r.qty));
 assert.doesNotMatch(rows.map(r=>r.name).join(' '),/Raccord Rails|Rockwool/);
 assert.match(app,/p\.type==='wall'\?'':/);
 assert.match(app,/!isWallPrint&&r\.why/);
 assert.match(app,/for\(const item of materials\(plan\)\)/);
 assert.match(source,/pr8Area=round\(netArea\*faces,6\)/);
 assert.match(source,/pr8Kg=round\(pr8Area\*\.33,3\)/);
 assert.match(source,/pr8Bags=ceil\(pr8Kg\/25\)/);
});

test('Armstrong explanatory rows remain unchanged, isolated from Cloison-only request',()=>{
 const o=fullArmstrongOptions(8,4)[0];
 const p=calcArmstrongFull({L:8,W:4,drop:30,cut:30,...o});
 assert.ok(materials(p).some(r=>r.why.length>0));
});
