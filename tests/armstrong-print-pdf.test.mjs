import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calcArmstrongFull,materials} from '../public/assets/ak-engine.mjs';
import {drawArmstrongPrintPage} from '../public/assets/ak-pdf-print.mjs';

function mockCanvas(){
 const paint={lines:[],texts:[],strokes:[]};
 let pending=null;
 const ctx={
  save(){},restore(){},setTransform(){},fillRect(){},strokeRect(){},rect(){},clip(){},fill(){},
  beginPath(){pending=null},roundRect(){pending=null},moveTo(x,y){pending={x1:x,y1:y}},lineTo(x,y){if(pending){pending.x2=x;pending.y2=y}},
  stroke(){if(pending)paint.lines.push({...pending,color:ctx.strokeStyle,width:ctx.lineWidth});pending=null},
  fillText(value,x,y){paint.texts.push({value:String(value),x,y});},
  fillStyle:'',strokeStyle:'',font:'',lineWidth:0, textAlign:'left',textBaseline:'middle',direction:'ltr'
 };
 return {ctx,paint};
}
test('Technical PDF page is drawn directly from Armstrong geometry, not scaled page/SVG screenshot',()=>{
 const source=readFileSync(new URL('../public/assets/ak-app.mjs',import.meta.url),'utf8');
 assert.match(source,/import \{drawArmstrongPrintPage\} from '\.\/ak-pdf-print\.mjs'/);
 assert.match(source,/if\(isArmPrint\)\{\s*drawArmstrongPrintPage/);
 assert.match(source,/planCanvas\.width=isArmPrint\?3508:W/);
 assert.match(source,/planCanvas\.height=isArmPrint\?2480:H/);
 assert.match(source,/pdfW:isArmPrint\?841\.89:595\.28/);
 assert.match(source,/pdfH:isArmPrint\?595\.28:841\.89/);
 assert.match(source,/if\(isArmPrint\)\{[\s\S]*?\} else \{/);
 assert.match(source,/z\.drawImage\(img,80,420,1080,650\)/); // unchanged for other calculators
});
test('The print drawing shows four measured edges with proper profile colors and quantities',()=>{
 const p=calcArmstrongFull({L:8,W:4,drop:30,cut:30,nL:12,nW:6});
 const before={cross120:p.cross120,cross060:p.cross060,stock:p.cross060Stock};
 const {ctx,paint}=mockCanvas();
 drawArmstrongPrintPage(ctx,p,3508,2480);
 const text=paint.texts.map(v=>v.value).join(' | ');
 assert.match(text,/مخطط توزيع البروفيلات/);
 assert.match(text,/40 cm/);
 assert.match(text,/20 cm/);
 assert.match(text,/جوج جهات الطول: 40 cm لكل جهة/);
 assert.match(text,/جوج جهات العرض: 20 cm لكل جهة/);
 assert.match(text,new RegExp(String(p.cross060Stock)+' بروفيل'));
 assert.equal(paint.lines.filter(v=>v.color==='#2563a6').length,p.carrierCount+1);
 assert.equal(paint.lines.filter(v=>v.color==='#d97706').length,p.cross120+1);
 assert.equal(paint.lines.filter(v=>v.color==='#7c3aed').length,p.cross060+1);
 assert.deepEqual(before,{cross120:p.cross120,cross060:p.cross060,stock:p.cross060Stock});
 assert.equal(materials(p).find(r=>r.name==='Cross 0.60m').qty,before.stock);
});
test('Technical print drawing also handles zero cuts without making up measurements',()=>{
 const p=calcArmstrongFull({L:7.2,W:3.6,drop:30,cut:30,nL:12,nW:6});
 const {ctx,paint}=mockCanvas();drawArmstrongPrintPage(ctx,p,3508,2480);
 const t=paint.texts.map(v=>v.value).join(' | ');
 assert.match(t,/0 cm/);
 assert.match(t,/جوج جهات الطول: 0 cm لكل جهة/);
 assert.match(t,/جوج جهات العرض: 0 cm لكل جهة/);
});
test('Print layout rejects unrelated calculator data',()=>{
 const {ctx}=mockCanvas();
 assert.throws(()=>drawArmstrongPrintPage(ctx,{type:'wall'}),/Armstrong/);
});
