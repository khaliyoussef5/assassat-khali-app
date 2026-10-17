import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calcBA13Ceiling,materials} from '../public/assets/ak-engine.mjs';
import {ba13Layout} from '../public/assets/ak-ba13-layout.mjs';
import {ba13PlanSvg} from '../public/assets/ak-ba13-plan.mjs';
import {drawBA13PrintPage} from '../public/assets/ak-ba13-print.mjs';

function fakeCanvas(){
 const paint={lines:[],text:[],circles:[]};let pending=null;
 const ctx={
  save(){},restore(){},setTransform(){},fillRect(){},strokeRect(){},clip(){},fill(){},
  beginPath(){pending=null},moveTo(x,y){pending={x1:x,y1:y}},lineTo(x,y){if(pending){pending.x2=x;pending.y2=y}},
  stroke(){if(pending)paint.lines.push({...pending,color:ctx.strokeStyle,width:ctx.lineWidth});pending=null},
  arc(x,y,r){paint.circles.push({x,y,r})},
  fillText(v){paint.text.push(String(v))},
  fillStyle:'',strokeStyle:'',lineWidth:1
 };
 return {ctx,paint};
}
test('BA13 ceiling 8x4: Fourrure parallel to short side, first 15cm and 50cm intervals',()=>{
 const p=calcBA13Ceiling({L:8,W:4,drop:30,mode:'plain'});
 assert.equal(p.axis,'x');assert.equal(p.span,4);assert.equal(p.distribution,8);
 assert.equal(p.positions[0],.15);assert.equal(p.positions[1],.65);assert.equal(p.positions.at(-1),7.9);
 assert.equal(p.lines.length,p.positions.length);
 assert.ok(p.lines.every(v=>v.x1===v.x2&&v.y1===0&&v.y2===4));
 assert.equal(p.perimeterExtra,0);assert.equal(p.ledLen,0);
 assert.equal(p.profileRun,p.positions.length*4);
 assert.equal(p.totalFourrure,p.profileRun);
 assert.equal(p.hangers,p.hangerPoints.length);
 assert.ok(p.fourrure>=Math.ceil(p.totalFourrure/3));
 assert.equal(p.stockBarAllocation.length,p.fourrure);
 assert.ok(p.stockBarAllocation.every(bar=>bar.reduce((a,b)=>a+b,0)<=3.000001));
});
test('Hidden LED ring inset 10cm in all four walls and exactly 23.2m for 8x4',()=>{
 const a=calcBA13Ceiling({L:8,W:4,drop:30,mode:'plain'});
 const b=calcBA13Ceiling({L:8,W:4,drop:30,mode:'hidden'});
 assert.equal(b.ring.length,4);assert.equal(b.inset,.1);
 assert.equal(b.ring[0].x1,.1);assert.equal(b.ring[0].y1,.1);
 assert.equal(b.ring[0].x2,7.9);assert.equal(b.ring[2].y1,3.9);
 assert.equal(b.ledLen,23.2);assert.equal(b.ledWallPerimeter,24);
 assert.equal(b.totalFourrure,a.totalFourrure+23.2);
 assert.ok(b.hangers>a.hangers);
 assert.equal(materials(b).find(r=>r.name.startsWith('طول مسار LED الداخلي')).qty,23.2);
});
test('BA13 3m stock cutting never exceeds a stock bar and has correct piece and join counts',()=>{
 for(const [L,W,mode] of [[8,4,'plain'],[8,4,'hidden'],[3.2,5.4,'plain'],[3.2,5.4,'hidden'],[.8,1,'hidden'],[12,5.36,'plain']]){
  const p=calcBA13Ceiling({L,W,drop:30,mode});
  const consumed=p.stockBarAllocation.reduce((n,bar)=>n+bar.reduce((a,b)=>a+b,0),0);
  assert.ok(Math.abs(consumed-p.totalFourrure)<1e-5);
  assert.ok(p.stockBarAllocation.every(bar=>bar.reduce((a,b)=>a+b,0)<=3+1e-6));
  assert.equal(p.cutCount,p.cutPieces.length);
  assert.equal(p.joinCount,p.cutCount-p.runCount);
  assert.ok(p.cutPieces.every(v=>v>0&&v<=3));
  assert.equal(materials(p).find(r=>r.name==='Fourrure 3m').qty,p.fourrure);
  assert.equal(materials(p).find(r=>r.name.startsWith('Raccord Fourrure')).qty,p.joinCount);
  assert.equal(p.hangers,p.hangerPoints.length);
 }
});
test('BA13 rotated room uses short length for Fourrure runs',()=>{
 const p=calcBA13Ceiling({L:3.2,W:5.4,drop:30,mode:'plain'});
 assert.equal(p.axis,'y');
 assert.ok(p.lines.every(line=>line.y1===line.y2&&line.x1===0&&line.x2===3.2));
});
test('Technical BA13 SVG draws exactly the calculated lines and ring in distinct colors',()=>{
 for(const mode of ['plain','hidden']){
  const p=calcBA13Ceiling({L:8,W:4,drop:30,mode});
  const svg=ba13PlanSvg(p,{showHangers:true});
  assert.match(svg,/data-diagram="ba13-ceiling"/);
  assert.equal((svg.match(/data-profile="fourrure"/g)||[]).length,p.positions.length);
  assert.equal((svg.match(/data-profile="led-ring"/g)||[]).length,p.ring.length);
  assert.equal((svg.match(/data-hanger="yes"/g)||[]).length,p.hangers);
  assert.match(svg,/#2563A6/);if(mode==='hidden')assert.match(svg,/#D97706/);
  assert.equal((ba13PlanSvg(p,{showHangers:false}).match(/data-hanger="yes"/g)||[]).length,0);
 }
});
test('A4 PDF BA13 second page is a dedicated printed drawing with show/hide suspension',()=>{
 const p=calcBA13Ceiling({L:8,W:4,drop:30,mode:'hidden'}),a=fakeCanvas(),b=fakeCanvas();
 drawBA13PrintPage(a.ctx,p,3508,2480,{showHangers:true});
 drawBA13PrintPage(b.ctx,p,3508,2480,{showHangers:false});
 assert.equal(a.paint.circles.length,p.hangers+1); // one extra icon in printed legend
 assert.equal(b.paint.circles.length,0);
 assert.equal(a.paint.lines.filter(v=>v.color==='#2563A6').length,p.positions.length+1); // + legend line
 assert.equal(a.paint.lines.filter(v=>v.color==='#D97706').length,p.ring.length+1); // + legend line
 assert.ok(a.paint.text.some(x=>x.includes('سقف BA13')));
 assert.ok(a.paint.text.some(x=>x.includes('10cm')));
 assert.throws(()=>drawBA13PrintPage(a.ctx,{type:'wall'}),/BA13/);
});
test('BA13 is wired into shared UI SVG, print PDF and existing approved Classic visual style',()=>{
 const app=readFileSync(new URL('../public/assets/ak-app.mjs',import.meta.url),'utf8');
 const html=readFileSync(new URL('../public/calculators/ba13-ceiling/index.html',import.meta.url),'utf8');
 assert.match(app,/if\(p.type==='ba13-ceiling'\)return ba13PlanSvg\(p,\{showHangers\}\)/);
 assert.match(app,/drawBA13PrintPage\(z,p,planCanvas.width,planCanvas.height,\{showHangers\}\)/);
 assert.match(app,/isLandscapePrint=isArmPrint\|\|isBA13Print/);
 assert.match(html,/قيد التطوير/);assert.doesNotMatch(html,/ak-app\.mjs/);
});
