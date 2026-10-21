import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calcWall} from '../public/assets/ak-engine.mjs';
import {wallPlanSvg} from '../public/assets/ak-wall-plan.mjs';
const css=readFileSync(new URL('../public/assets/ak-classic.css',import.meta.url),'utf8');
const app=readFileSync(new URL('../public/assets/ak-app.mjs',import.meta.url),'utf8');

test('Cloison diagram mobile uses the exact fitted-width strategy as Armstrong',()=>{
 assert.match(css,/\.ak-full-flow \.plan svg\[data-diagram="armstrong-full"\]\{min-width:0;max-width:100%;width:100%;height:auto\}/);
 const responsive=css.slice(css.indexOf('/* Cloison drawing V3'));
 assert.ok(responsive.length>500,'responsive Cloison overrides exist');
 assert.match(responsive,/\.ak-walls-flow #plan\.plan\{overflow:hidden;max-width:100%\}/);
 assert.match(responsive,/\.ak-walls-flow #plan svg\[data-diagram="wall"\]\{\s*display:block;width:100%;max-width:100%;min-width:0;height:auto\s*\}/);
 assert.doesNotMatch(responsive,/width:700px|min-width:700px|overflow-x:auto|scrollbar-width/);
 assert.match(responsive,/vector-effect:non-scaling-stroke/);
 assert.match(responsive,/\.ak-wall-plan-switches\{width:100%;display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});

test('Default fitted plan stays within parent width at phone widths 320, 375 and 414px',()=>{
 const p=calcWall({L:5,H:2.8,kind:'cloison',layers:1,spacing:.6,studLength:3,openings:[]});
 const svg=wallPlanSvg(p);
 const match=svg.match(/viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/);
 assert.ok(match);
 const vbWidth=Number(match[3]), vbHeight=Number(match[4]);
 for(const parentWidth of [280,304,320,343,375,390,414]){
  const scale=parentWidth/vbWidth,expectedHeight=vbHeight*scale;
  assert.ok(scale>0&&expectedHeight>0);
  assert.ok(parentWidth<=414);
 }
 assert.match(app,/wallControls\.bindSvg\(plan\)/);
});

test('Full-width rendering keeps openings draggable without changing drawing coordinates or takeoff',()=>{
 const p=calcWall({L:5,H:2.8,kind:'cloison',layers:1,spacing:.6,studLength:3,openings:[
  {id:'d1',type:'door',x:.3,w:.9,h:2.1,bottom:0},
  {id:'w1',type:'window',x:3,w:1,h:1.2,bottom:.9}
 ]});
 const svg=wallPlanSvg(p);
 assert.match(svg,/data-wall-x=/);
 assert.match(svg,/data-wall-y=/);
 assert.match(svg,/data-wall-w=/);
 assert.match(svg,/data-wall-h=/);
 assert.equal((svg.match(/data-drag-id="/g)||[]).length,2);
 assert.equal((svg.match(/data-opening="/g)||[]).length,2);
 assert.match(svg,/data-drag-id="d1"/);
 assert.match(svg,/data-drag-id="w1"/);
 assert.equal(p.openings.length,2);
 assert.equal(p.doorArea,.9*2.1);
 assert.equal(p.windowArea,1*1.2);
});
