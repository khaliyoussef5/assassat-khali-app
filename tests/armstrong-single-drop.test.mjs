import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calcArmstrongFull,materials} from '../public/assets/ak-engine.mjs';

const old=readFileSync(new URL('../public/calculators/armstrong/index.html',import.meta.url),'utf8');
const modern=readFileSync(new URL('../public/assets/ak-app.mjs',import.meta.url),'utf8');
const script=[...old.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(v=>v[1]).find(v=>v.includes('  function dimOptions('));
if(!script)throw Error('Cannot inspect old calculator');
const a=script.indexOf('  function dimOptions('),b=script.indexOf('  function setApproval(');
const {buildPlan}=new Function('const M=.6,mainLen=3.6,teeLen=1.2,rodLenCm=100,ceil=Math.ceil;'+script.slice(a,b)+';return {buildPlan};')();

test('Original Armstrong: dimensions show length, width and ceiling drop before the live plan and suggestions',()=>{
 const first=old.indexOf('<h2>المقاسات ديال الغرفة</h2>');
 const second=old.indexOf('<h2>اقتراحات البوردور وتوزيع السقف</h2>');
 const next=old.indexOf('<h2>طريقة التركيب المعتمدة</h2>');
 const plan=old.indexOf('class="ak-plan-title">المخطط التفاعلي');
 const drop=old.indexOf('id="ak-drop"');
 assert.ok(first<drop && drop<plan && plan<second && second<next);
 assert.equal((old.match(/id="ak-drop"/g)||[]).length,1);
 assert.doesNotMatch(old,/id="ak-cut"/);
 assert.match(old,/القياس الفعلي.*قبل القطع/);
 assert.match(script,/const L=val\('ak-length'\), W=val\('ak-width'\), drop=val\('ak-drop'\), cut=drop;/);
});
test('Borderless Armstrong: the one drop field is rendered with distribution and not duplicated in project dimensions',()=>{
 const html=readFileSync(new URL('../public/calculators/armstrong-full/index.html',import.meta.url),'utf8');
 const start=modern.indexOf("'armstrong-full':[");
 const end=modern.indexOf("],'ba13-ceiling':",start);
 const definitions=modern.slice(start,end);
 assert.ok(!definitions.includes("['cut'")&&!definitions.includes("['drop'"),definitions);
 assert.match(modern,/id="option-drop" class="option-drop"/);
 assert.match(modern,/id="in-drop" type="number"/);
 assert.match(modern,/if\(app==='armstrong-full'\)out\.drop=field\('drop'\)/);
 assert.match(modern,/document\.getElementById\('option-drop'\)\.remove\(\)/);
 assert.match(modern,/in-drop'\)\.addEventListener\('input',refresh\)/);
 assert.match(html,/ak-classic\.css/);
});
test('Both calculators use drop alone to update rods; supplied obsolete cut has no effect',()=>{
 const oldRoom={L:8,W:4,drop:30,cut:60},opt={nL:12,nW:6};
 const p=buildPlan(oldRoom,opt),p40=buildPlan({...oldRoom,drop:40},opt);
 assert.equal(p.cut,30);assert.equal(p.rods,11);assert.equal(p40.cut,40);assert.equal(p40.rods,16);
 const full=calcArmstrongFull({L:8,W:4,drop:30,cut:60,nL:12,nW:6});
 const full40=calcArmstrongFull({L:8,W:4,drop:40,cut:5,nL:12,nW:6});
 assert.equal(full.cut,30);assert.equal(full.rodPieces,3);
 assert.equal(full40.cut,40);assert.equal(full40.rodPieces,2);
 assert.equal(full.rods,Math.ceil(full.hangers/3));
 assert.equal(full40.rods,Math.ceil(full40.hangers/2));
 for(const p of [full,full40]){
  assert.match(materials(p).find(x=>x.name==='Tige 1m').why,/نزول السقف/);
 }
 assert.equal(full.porteur,full40.porteur);
 assert.equal(full.cross120,full40.cross120);
 assert.equal(full.cross060,full40.cross060);
});
test('Drop validation remains compatible with 1m Tige stock, without secondary cut field',()=>{
 for(const drop of [0,4,100.01,101]){
  assert.throws(()=>calcArmstrongFull({L:8,W:4,drop,nL:12,nW:6}),/نزول|صحيحة/);
 }
 const p=calcArmstrongFull({L:8,W:4,drop:100,nL:12,nW:6});
 assert.equal(p.rodPieces,1);
});
