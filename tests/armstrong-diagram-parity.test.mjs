import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calcArmstrongFull,fullArmstrongOptions,materials} from '../public/assets/ak-engine.mjs';
import {armstrongFullPlanSvg} from '../public/assets/ak-armstrong-plan.mjs';

const ba13=readFileSync(new URL('../public/calculators/armstrong/index.html',import.meta.url),'utf8');
const modern=readFileSync(new URL('../public/assets/ak-app.mjs',import.meta.url),'utf8');
const css=readFileSync(new URL('../public/assets/ak-classic.css',import.meta.url),'utf8');

test('BA13 Armstrong offers accessible back-to-calculators action with correct relative homepage URL',()=>{
 assert.match(ba13,/<a class="ak-back-to-calculators" href="\.\.\/\.\.\/" aria-label="رجوع للحاسبات">← رجوع للحاسبات<\/a>/);
 assert.match(ba13,/#ak-calculator \.ak-back-to-calculators:focus-visible/);
 assert.doesNotMatch(ba13,/Vue en plan — البروفيلات والمساحات مرسومين بالنسب الصحيحة/);
});

test('Interactive borderless diagram matches BA13 diagram framing and profile palette',()=>{
 const opt=fullArmstrongOptions(8,4)[0];
 const p=calcArmstrongFull({L:8,W:4,drop:30,...opt});
 const svg=armstrongFullPlanSvg(p);
 for(const text of ['viewBox="0 0 1100 610"','fill="#f5f9f8"','fill="#E0F1EB"','fill="#E6C69E"','stroke="#1F5D9F"','stroke="#D59428"','stroke="#219A7C"','fill="#233A44"','x="344" y="535" width="410" height="43"']){
  assert.ok(svg.includes(text),text+' must match BA13 drawing visual system');
 }
 assert.match(ba13,/viewBox="0 0 1100 610"/);
 assert.match(ba13,/#D59428/);
 assert.match(ba13,/#219A7C/);
 assert.match(css,/\.ak-full-flow \.plan:has\(svg\[data-diagram="armstrong-full"\]\)\{overflow:hidden;padding:0\}/);
 assert.match(css,/\.ak-full-flow \.plan svg\[data-diagram="armstrong-full"\]\{display:block;width:100%;max-width:100%;min-width:0;height:auto\}/);
 assert.match(modern,/class="ak-full-legend"/);
 assert.match(modern,/بلاكات مقطوعة/);
 assert.doesNotMatch(modern,/Vue en plan — البروفيلات والمساحات مرسومين بالنسب الصحيحة/);
});

test('Full-room Armstrong remains true to its distinct material geometry, no BA13 fields',()=>{
 for(const [L,W] of [[8,4],[7.2,3.6],[5.8,2.7],[3,3]]){
  const p=calcArmstrongFull({L,W,drop:30,...fullArmstrongOptions(L,W)[0]});
  const svg=armstrongFullPlanSvg(p);
  assert.equal((svg.match(/data-profile="porteur"/g)||[]).length,p.carrierCount);
  assert.equal((svg.match(/data-profile="cross120"/g)||[]).length,p.cross120);
  assert.equal((svg.match(/data-profile="cross060"/g)||[]).length,p.cross060);
  assert.equal((svg.match(/data-hanger="yes"/g)||[]).length,p.hangers);
  assert.equal((armstrongFullPlanSvg(p,{showHangers:false}).match(/data-hanger="yes"/g)||[]).length,0);
  assert.match(svg,new RegExp('باقي الطول: '+p.edgeL*100));
  assert.match(svg,/وليست BA13/);
  assert.equal(materials(p).find(r=>r.name==='Porteur T 3.60m').qty,p.porteur);
 }
});
