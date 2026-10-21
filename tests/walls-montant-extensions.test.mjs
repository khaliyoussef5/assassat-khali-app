import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {planWallMontantCuts} from '../public/assets/ak-wall-stud-cuts.mjs';
import {calcWall,materials} from '../public/assets/ak-engine.mjs';
import {wallPlanSvg} from '../public/assets/ak-wall-plan.mjs';
import {drawWallPrintPage} from '../public/assets/ak-wall-print.mjs';

const model=(H,extra={})=>calcWall({L:5,H,kind:'cloison',layers:1,spacing:.6,studLength:3,openings:[],...extra});
const get=path=>readFileSync(new URL('../public/'+path,import.meta.url),'utf8');
function mock(){
 const txt=[];
 const c={save(){},restore(){},setTransform(){},fillRect(){},strokeRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},fillText(s){txt.push(String(s))}};
 return {c,txt};
}
test('Exactly 3m Cloison uses no splice sleeve and stock quantity equals full-height lines',()=>{
 const p=model(3);
 assert.equal(p.montants,10);
 assert.equal(p.montantStockBars,10);
 assert.equal(p.montantSplices,0);
 assert.equal(p.montantSleeves,0);
 assert.equal(p.montantCuts.offcut,0);
 assert.equal(p.montantCuts.totalUsed,30);
});
test('4m wall = 3m Montant + 1m extension + extra 50cm sleeve PER vertical line',()=>{
 const p=model(4),m=p.montantCuts;
 assert.equal(p.montants,10);
 assert.equal(m.segmentsPerLine,2);
 assert.equal(m.extensionHeight,1);
 assert.equal(m.splicesPerLine,1);
 assert.equal(m.mainPieces,10);
 assert.equal(m.extensionPieces,10);
 assert.equal(m.sleeveCount,10);
 assert.equal(m.extraTotalLength,10);
 assert.equal(m.sleeveTotalLength,5);
 assert.equal(m.installedTotalLength,40);
 assert.equal(m.totalUsed,45);
 assert.equal(m.stockBars,15); // 3m x10 + re-used 1m & .5m offcuts x5 bars
 assert.equal(m.offcut,0);
 assert.ok(m.bars.every(bar=>bar.reduce((n,x)=>n+x.length,0)<=3+1e-6));
 const qty=materials(p).find(r=>r.name==='Montants 3m');
 assert.equal(qty.qty,15); // no 50cm sleeves purchased again as independent profiles
 assert.equal(qty.why,''); // no explanatory notes in Cloison supply list
 assert.equal(p.montantSleeves,10);
 assert.equal(p.montantCuts.sleeveTotalLength,5);
 const svg=wallPlanSvg(p);
 assert.equal((svg.match(/data-stud-splice="50cm"/g)||[]).length,10);
 assert.match(svg,/class="ak-wall-splice-mark"/);
 assert.doesNotMatch(svg,/Montants 3m: 15|قطع وصل × 50cm/);
 const pdf=mock();
 drawWallPrintPage(pdf.c,p,3508,2480);
 assert.ok(pdf.txt.some(t=>t.includes('10 jonctions avec renfort de 50cm')));
 assert.ok(pdf.txt.some(t=>t.includes('Montants 3m × 15')));
});
test('No arbitrary failure above 3m; repeats joins at 6m, and 4m option remains legacy-compatible',()=>{
 for(const H of [3.01,3.6,4,4.2,5,6,6.7,8.4,12]){
  const p=model(H);
  const segmentCount=Math.ceil(H/3-1e-7);
  assert.equal(p.montantSplices,p.montants*(segmentCount-1));
  assert.equal(p.montantSleeves,p.montantSplices);
  assert.equal(p.montantCuts.installedTotalLength,Math.round(H*p.montants*1e6)/1e6);
  assert.ok(p.montantStockBars>=Math.ceil(p.montantCuts.totalUsed/3-1e-7));
  assert.ok(p.montantCuts.bars.every(bar=>bar.reduce((sum,x)=>sum+x.length,0)<=3+1e-6));
  assert.ok(materials(p).find(x=>x.name==='Montants 3m').qty>=p.montants);
 }
 const alt=model(4,{studLength:4});
 assert.equal(alt.stock,4);
 assert.equal(alt.montantSplices,0);
 assert.equal(alt.montantStockBars,alt.montants);
 assert.throws(()=>model(40.1),/ارتفاع/);
});
test('High wall with multiple openings keeps their geometry and all stud sleeves in the same takeoff',()=>{
 const openings=[
  {id:'one',type:'door',x:.2,w:.9,h:2.1,bottom:0},
  {id:'two',type:'window',x:2.8,w:1,h:1.2,bottom:1.1}
 ];
 const p=model(4.5,{openings});
 assert.equal(p.openings.length,2);
 assert.equal(p.extraStuds,4);
 assert.equal(p.montantSplices,p.montants);
 assert.equal((wallPlanSvg(p).match(/data-stud-splice="50cm"/g)||[]).length,p.montants);
 assert.equal(p.doorArea,.9*2.1);
 assert.equal(p.windowArea,1*1.2);
 assert.equal(materials(p).find(r=>r.name==='Montants 3m').qty,p.montantStockBars);
});
test('Cloison interface uses 3m baseline, reports 50cm sleeves and does not require 4m sticks',()=>{
 const app=get('assets/ak-app.mjs');
 assert.match(app,/studLength:3/);
 assert.match(app,/p.montantStockBars/);
 assert.match(app,/p.montantSleeves/);
 assert.doesNotMatch(app,/picker\('studLength'/);
 const eng=get('assets/ak-engine.mjs');
 assert.match(eng,/planWallMontantCuts\(\{height:H,count:geometry.studs,stockLength:stock,sleeveLength:\.5\}\)/);
 assert.doesNotMatch(eng,/H>stock\+EPS/);
 execFileSync(process.execPath,['--check',new URL('../public/assets/ak-wall-stud-cuts.mjs',import.meta.url).pathname],{stdio:'pipe'});
});
