import test from 'node:test';
import assert from 'node:assert/strict';
import {calcWall,materials,calcBA13Ceiling} from '../public/assets/ak-engine.mjs';

const base={L:5,H:2.8,layers:1,kind:'cloison',spacing:.6,studLength:3,openings:[]};
const row=(p,name)=>materials(p).find(x=>x.name===name);

test('One BA13 layer per face uses VPT 25 MM only; no old Vis BA13 or VPT 35 MM',()=>{
 const p=calcWall(base);
 assert.equal(p.faces,2);
 assert.equal(p.boardArea,28);
 assert.equal(p.screw25Count,700);
 assert.equal(p.screw35Count,0);
 assert.equal(p.screwCount,700);
 assert.equal(row(p,'VPT 25 MM').qty,700);
 assert.equal(row(p,'VPT 25 MM').buy,770);
 assert.equal(row(p,'VPT 35 MM'),undefined);
 assert.equal(row(p,'Vis BA13'),undefined);
});

test('Two BA13 layers per face: VPT 25 MM on layer one and VPT 35 MM on layer two',()=>{
 const p=calcWall({...base,layers:2});
 assert.equal(p.boardArea,56);
 assert.equal(p.screw25Count,700);
 assert.equal(p.screw35Count,700);
 assert.equal(p.screwCount,1400);
 assert.equal(row(p,'VPT 25 MM').qty,700);
 assert.equal(row(p,'VPT 35 MM').qty,700);
 assert.equal(row(p,'VPT 25 MM').buy,770);
 assert.equal(row(p,'VPT 35 MM').buy,770);
 assert.equal(row(p,'Vis BA13'),undefined);
 assert.ok(materials(p).every(x=>x.why===''));
});

test('Multiple openings reduce VPT screw counts identically for both layers',()=>{
 const openings=[
  {id:'door-one',type:'door',x:.2,w:.9,h:2.1,bottom:0},
  {id:'win-one',type:'window',x:2.9,w:1,h:1.2,bottom:.9}
 ];
 const p=calcWall({...base,layers:2,openings});
 const perLayer=Math.ceil((14-.9*2.1-1*1.2)*2*25-1e-8);
 assert.equal(p.screw25Count,perLayer);
 assert.equal(p.screw35Count,perLayer);
 assert.equal(row(p,'VPT 25 MM').qty,perLayer);
 assert.equal(row(p,'VPT 35 MM').qty,perLayer);
});

test('Round up per screw size independently and preserve earlier PDF/material paths',()=>{
 const p=calcWall({...base,L:3.13,H:2.57,layers:2});
 const qty=Math.ceil(p.netArea*p.faces*25-1e-8);
 assert.equal(p.screw25Count,qty);
 assert.equal(p.screw35Count,qty);
 assert.equal(p.screwCount,qty*2);
 assert.equal(materials(p).filter(x=>/^VPT /.test(x.name)).length,2);
 assert.equal(materials(p).find(x=>x.name==='Placojoint PR 8 de Placo — sac 25 kg').qty,p.pr8Bags);
});

test('Ceiling calculators are not renamed or changed by Cloison screw specification',()=>{
 const ceiling=calcBA13Ceiling({L:5,W:4,drop:30,mode:'plain'});
 const screws=materials(ceiling).find(x=>x.name==='Vis BA13');
 assert.ok(screws);
 assert.equal(screws.qty,ceiling.vis);
 assert.equal(materials(ceiling).some(x=>x.name==='VPT 25 MM'),false);
});
