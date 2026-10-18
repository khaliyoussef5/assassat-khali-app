import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {calcWall,materials} from '../public/assets/ak-engine.mjs';
import {wallPlanSvg} from '../public/assets/ak-wall-plan.mjs';
import {wallLayout} from '../public/assets/ak-wall-layout.mjs';
import {drawWallPrintPage} from '../public/assets/ak-wall-print.mjs';

const get=path=>readFileSync(new URL('../public/'+path,import.meta.url),'utf8');
const ui=get('assets/ak-wall-interactions.mjs'),app=get('assets/ak-app.mjs');
const basic={L:8,H:3,layers:1,kind:'cloison',spacing:.6,studLength:3};
const openings=[
 {id:'op-1',type:'door',x:.3,w:.9,h:2.1,bottom:0},
 {id:'op-2',type:'door',x:2,w:.9,h:2.1,bottom:0},
 {id:'op-3',type:'window',x:3.5,w:1,h:1.2,bottom:.9},
 {id:'op-4',type:'window',x:5.1,w:1,h:1.2,bottom:.9},
 {id:'op-5',type:'window',x:6.4,w:1,h:1.2,bottom:.9}
];

test('Default Cloison is an ordinary solid wall, with no door/window deduction',()=>{
 const p=calcWall({...basic,openings:[]});
 assert.equal(p.openings.length,0);
 assert.equal(p.netArea,24);
 assert.equal(p.doorArea,0);assert.equal(p.windowArea,0);
 assert.equal(p.railLinear,16);
 assert.equal((wallPlanSvg(p).match(/data-opening="(door|window)"/g)||[]).length,0);
 assert.doesNotMatch(ui,/const items=\[\{type/);
});

test('Arbitrary multiple doors and windows update walls, Rails, studs, materials and SVG',()=>{
 const p=calcWall({...basic,openings});
 assert.equal(p.openings.length,5);
 assert.equal(p.openings.filter(o=>o.type==='door').length,2);
 assert.equal(p.openings.filter(o=>o.type==='window').length,3);
 assert.ok(Math.abs(p.netArea-(24-2*.9*2.1-3*1*1.2))<1e-8);
 assert.equal(p.extraStuds,10);
 assert.equal(p.montants,p.baseStuds+10);
 const bottomRuns=p.railSegments.filter(s=>s.kind==='bottom');
 assert.equal(bottomRuns.length,3);
 assert.ok(Math.abs(bottomRuns.reduce((sum,o)=>sum+o.length,0)-(8-1.8))<1e-8);
 assert.equal(p.railSegments.filter(s=>s.kind==='door-header').length,2);
 assert.equal(p.railSegments.filter(s=>s.kind==='window-header').length,3);
 assert.equal(p.railSegments.filter(s=>s.kind==='window-sill').length,3);
 assert.equal(materials(p).find(r=>r.name==='Rails 3m').qty,p.rails);
 const svg=wallPlanSvg(p);
 assert.equal((svg.match(/data-opening="door"/g)||[]).length,2);
 assert.equal((svg.match(/data-opening="window"/g)||[]).length,3);
 assert.equal((svg.match(/data-drag-id="/g)||[]).length,5);
 for(const o of openings)assert.ok(svg.includes('data-drag-id="'+o.id+'"'));
 assert.match(svg,/data-wall-x=/);assert.match(svg,/data-wall-w=/);
});

test('Multiple openings cannot overlap or leave wall bounds',()=>{
 const p=[...openings.map(o=>({...o}))];
 assert.throws(()=>calcWall({...basic,openings:[...p,{id:'other',type:'window',x:3.7,w:1,h:1,bottom:.9}]}),/متداخلين/);
 assert.throws(()=>calcWall({...basic,openings:[...p,{id:'other',type:'door',x:7.6,w:.9,h:2.1}]}),/خارج حدود/);
 assert.throws(()=>calcWall({...basic,openings:[...p,{id:'op-1',type:'door',x:7,w:.8,h:2.1}]}),/رقم تعريفي/);
 assert.throws(()=>wallLayout({...basic,openings:[{id:'bad',type:'window',x:0,w:1,h:1.2,bottom:-.2}]}),/خارج حدود/);
 assert.throws(()=>calcWall({...basic,openings:[{id:'bad',type:'door',x:0,w:0,h:2.1}]}),/خارج حدود/);
});

test('Door/window UI is add-only, shows two dimensions on demand and repositions inside SVG',()=>{
 assert.match(ui,/let items=\[\],counter=1/);
 assert.match(ui,/id="wall-add-door"/);
 assert.match(ui,/id="wall-add-window"/);
 assert.match(ui,/w:type==='door'\?\.9:1,h:type==='door'\?2\.1:1\.2/);
 assert.match(ui,/const editor=document\.createElement\('div'\)/);
 assert.match(ui,/editor\.innerHTML=names\(\)\.map/);
 assert.match(ui,/data-size-key="w"/);assert.match(ui,/data-size-key="h"/);
 assert.match(ui,/data-remove-opening/);
 assert.match(ui,/pointerdown/);assert.match(ui,/pointermove/);assert.match(ui,/pointerup/);
 assert.match(ui,/getScreenCTM\(\)/);
 assert.match(ui,/setPointerCapture/);
 assert.match(ui,/ArrowLeft/);assert.match(ui,/ArrowUp/);
 assert.doesNotMatch(app,/\['doorW','عرض الباب/);
 assert.doesNotMatch(app,/\['windowW','عرض الشباك/);
 assert.match(app,/wallControls\.getOpenings\(\)/);
 assert.match(app,/wallControls\.bindSvg\(plan\)/);
 execFileSync(process.execPath,['--check',new URL('../public/assets/ak-wall-interactions.mjs',import.meta.url).pathname],{stdio:'pipe'});
});
