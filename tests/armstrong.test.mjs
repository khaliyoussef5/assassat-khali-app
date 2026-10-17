import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../public/calculators/armstrong/index.html', import.meta.url), 'utf8');
const script = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(body=>body.includes('  function dimOptions('));
assert.ok(script, 'Armstrong HTML script exists');
const a = script.indexOf('  function dimOptions(');
const b = script.indexOf('  function setApproval(');
assert.ok(a > -1 && b > a, 'Calculation functions found');
const f = new Function('const M=0.6,mainLen=3.6,teeLen=1.2,rodLenCm=100;const ceil=Math.ceil;' + script.slice(a,b) + ';return {getChoices,buildPlan};');
const {getChoices,buildPlan} = f();
const room={L:8,W:4,drop:30,cut:30};

test('Approved option 1: 8×4m with symmetric 40/20cm BA13 borders',()=>{
  const p=buildPlan(room,getChoices(room)[0]);
  assert.equal(p.nL,12);assert.equal(p.nW,6);
  assert.ok(Math.abs(p.bL-.4)<1e-8);assert.ok(Math.abs(p.bW-.2)<1e-8);
  assert.equal(p.tiles,72);
  assert.ok(Math.abs(p.armArea-25.92)<1e-8);
});
test('Longitudinal Porteur, first and last transverse rows counted',()=>{
  const p=buildPlan(room,{nL:12,nW:6});
  assert.equal(p.nP,4); assert.equal(p.pPieces,8);
  assert.equal(p.c12,39); assert.equal(p.c06,36);
  assert.equal(p.hangs,32); assert.equal(p.rods,11);
  assert.equal(p.angle,8);
});
test('0.60m bay uses 0.60 cross tees only',()=>{
  const p=buildPlan(room,{nL:12,nW:5});
  assert.equal(p.bays12,2); assert.equal(p.bays06,1);
  assert.equal(p.c12,26); assert.equal(p.c06,37);
});
test('Invalid tile counts are rejected',()=>{
  assert.throws(()=>buildPlan(room,{nL:14,nW:6}),/BA13/);
  assert.throws(()=>buildPlan(room,{nL:12.5,nW:6}),/عدد البلاكات/);
});
test('Ceiling drop alone determines estimated Tige cut and rod quantity',()=>{
  const p=buildPlan(room,{nL:12,nW:6});
  assert.equal(p.cut,30);
  assert.equal(p.rodPieces,3);
  assert.equal(p.rods,11);
  const changed=buildPlan({...room,drop:40,cut:30},{nL:12,nW:6});
  assert.equal(changed.cut,40);
  assert.equal(changed.rodPieces,2);
  assert.equal(changed.rods,16);
});
test('Manual choice, SVG and two-page PDF remain available',()=>{
  assert.match(html,/الخيار 3 — تعديل يدوي/);
  assert.match(html,/ak-svg-container/);
  assert.match(html,/async function pdfReport/);
  assert.match(html,/const pagePlan=document\.createElement\('canvas'\)/);
  assert.match(html,/grid-template-areas:"dimensions dimensions" "suggestions suggestions" "results rules"/);
});
