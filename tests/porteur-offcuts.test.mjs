import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planPorteurCuts} from '../public/assets/ak-porteur-cut.mjs';
import {calcArmstrongFull,materials} from '../public/assets/ak-engine.mjs';
import {armstrongFullPlanSvg} from '../public/assets/ak-armstrong-plan.mjs';

const html=readFileSync(new URL('../public/calculators/armstrong/index.html',import.meta.url),'utf8');
const script=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]).find(x=>x.includes('  function buildPlan('));
if(!script)throw Error('Original Armstrong calculator script missing');
const from=script.indexOf('  function dimOptions('),to=script.indexOf('  function setApproval(');
const {buildPlan}=new Function('const M=.6,mainLen=3.6,teeLen=1.2,rodLenCm=100,ceil=Math.ceil;'+script.slice(from,to)+';return {buildPlan}')();

test('Carry a real 0.80m offcut from line 1 to line 2 before opening a fresh 3.60m bar',()=>{
 const p=planPorteurCuts(8,3);
 assert.equal(p.bars,7);
 assert.equal(p.installedLength,24);
 assert.equal(p.waste,1.2); // 7*3.6 - (3*8)
 assert.equal(p.joinCount,6);
 assert.deepEqual(p.lines[0].cuts.map(x=>x.length),[3.6,3.6,.8]);
 assert.deepEqual(p.lines[1].cuts.map(x=>x.length),[2.8,3.6,1.6]);
 assert.deepEqual(p.lines[2].cuts.map(x=>x.length),[2,3.6,2.4]);
 assert.equal(p.lines[1].cuts[0].bar,p.lines[0].cuts.at(-1).bar);
 assert.equal(p.lines[2].cuts[0].bar,p.lines[1].cuts.at(-1).bar);
 assert.equal(p.lines[1].cuts[0].fromOffcut,true);
});
test('Only the last line has final waste, no phantom waste between lines',()=>{
 for(const [length,count] of [[8,3],[8,4],[7.8,4],[4,2],[7.2,4],[2.1,3],[3.6,3],[5.8,7]]){
  const p=planPorteurCuts(length,count);
  assert.equal(p.bars,Math.ceil((Math.round(length*1e6)*count-1e-6)/3600000));
  assert.ok(Math.abs(p.bars*3.6-p.installedLength-p.waste)<1e-6);
  assert.ok(p.waste>=0&&p.waste<3.6);
  assert.equal(p.joinCount,p.lines.reduce((n,line)=>n+line.cuts.length-1,0));
  p.lines.forEach(line=>assert.ok(Math.abs(line.cuts.reduce((s,c)=>s+c.length,0)-length)<1e-6));
 }
});
test('Borderless Armstrong correctly reduces Porteur stock, but changes no other components',()=>{
 const p=calcArmstrongFull({L:8,W:4,drop:30,cut:30,nL:12,nW:5});
 assert.equal(p.porteur,7);
 assert.equal(p.porteurWaste,1.2);
 assert.equal(p.porteurJoints,6);
 assert.equal(p.cross120,39);
 assert.equal(p.cross060,55);
 assert.equal(p.hangers,24);
 const row=materials(p).find(x=>x.name==='Porteur T 3.60m');
 assert.equal(row.qty,7);
 assert.match(row.note,/الشوت|الباقي/);
 assert.equal((armstrongFullPlanSvg(p).match(/data-profile="porteur"/g)||[]).length,p.carrierCount);
});
test('Original Armstrong BA13 also reuses offcuts between longitudinal Porteur lines',()=>{
 const p=buildPlan({L:8,W:4,drop:30,cut:30},{nL:13,nW:6}); // 4 lines each 7.8m
 assert.equal(p.nP,4);
 assert.equal(p.fieldL,7.8);
 assert.equal(p.pPieces,9); // previous naive method gave 12
 assert.equal(p.pWaste,1.2);
 assert.equal(p.pJoints,8);
 assert.deepEqual(p.pLineCuts[0],[3.6,3.6,.6]);
 assert.deepEqual(p.pLineCuts[1],[3,3.6,1.2]);
 assert.deepEqual(p.pLineCuts[2],[2.4,3.6,1.8]);
 assert.deepEqual(p.pLineCuts[3],[1.8,3.6,2.4]);
});
test('Keep original approved 7.2m run with no cut waste and same quantities',()=>{
 const p=buildPlan({L:8,W:4,drop:30,cut:30},{nL:12,nW:6});
 assert.equal(p.nP,4);
 assert.equal(p.pPieces,8);
 assert.equal(p.pWaste,0);
 assert.equal(p.pJoints,4);
 assert.equal(p.c12,39);
 assert.equal(p.c06,36);
 assert.equal(p.hangs,32);
});
test('Legacy and modern Armstrong apply exactly same serial cutting method',()=>{
 for(const [length,count] of [[7.8,4],[7.2,3],[6.6,2],[4.2,5],[1.8,6]]){
  const shared=planPorteurCuts(length,count);
  // Extract original algorithm numerically from a valid room / selected modules.
  const nL=Math.round(length/.6),nW=2*(count-1);
  const L=length+.6,W=nW*.6+.6;
  const old=buildPlan({L,W,drop:30,cut:30},{nL,nW});
  assert.equal(old.nP,count);
  assert.equal(old.pPieces,shared.bars);
  assert.ok(Math.abs(old.pWaste-shared.waste)<1e-6);
  assert.equal(old.pJoints,shared.joinCount);
 }
});
test('Technical plan and PDF annotate only the final leftover and joints',()=>{
 const planSrc=readFileSync(new URL('../public/assets/ak-armstrong-plan.mjs',import.meta.url),'utf8');
 const printSrc=readFileSync(new URL('../public/assets/ak-pdf-print.mjs',import.meta.url),'utf8');
 const appSrc=readFileSync(new URL('../public/assets/ak-app.mjs',import.meta.url),'utf8');
 assert.match(planSrc,/p.porteurWaste/);
 assert.match(printSrc,/p.porteurWaste/);
 assert.match(appSrc,/p.porteurJoints/);
 assert.match(html,/p.pWaste/);
 assert.match(html,/p.pJoints/);
});
