import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../public/calculators/armstrong/index.html',import.meta.url),'utf8');
const main=html.slice(html.indexOf('<main'),html.indexOf('</main>')+7);

// Inspect actual div/section ancestry, not just nearby text.
function elementsWithAncestors(markup){
 const stack=[],ancestry={},open=/<\/?[a-z][a-z0-9-]*\b[^>]*>/gi;
 for(const match of markup.matchAll(open)){
  const tag=match[0],name=/^<\/?([a-z]+)/i.exec(tag)?.[1].toLowerCase(),closing=tag.startsWith('</');
  if(closing){
   if(name==='div'||name==='section'){
    const previous=stack.pop();
    assert.equal(previous?.name,name,'Malformed markup around '+match.index);
   }
   continue;
  }
  const className=/\bclass="([^"]+)"/.exec(tag)?.[1]||'';
  const id=/\bid="([^"]+)"/.exec(tag)?.[1];
  if(id)ancestry[id]=[...stack.map(item=>item.cls),className];
  if(name==='div'||name==='section')stack.push({name,cls:className});
 }
 assert.equal(stack.length,0,'All div and section elements must close');
 return ancestry;
}

test('Room measurements including drop come first, live diagram second, layout proposals third',()=>{
 const a=elementsWithAncestors(main);
 const L=main.indexOf('id="ak-length"'),W=main.indexOf('id="ak-width"'),drop=main.indexOf('id="ak-drop"');
 const svg=main.indexOf('id="ak-svg-container"'),choices=main.indexOf('id="ak-options"'),approve=main.indexOf('id="ak-approve"');
 const materials=main.indexOf('id="ak-results"');
 assert.ok(L>0&&L<W&&W<drop&&drop<svg&&svg<choices&&choices<approve&&approve<materials);
 assert.ok(a['ak-svg-container'].some(x=>x.includes('ak-plan-panel')));
 assert.ok(!a['ak-svg-container'].some(x=>x.includes('ak-suggestions-panel')));
 assert.ok(a['ak-approve'].some(x=>x.includes('ak-suggestions-panel')));
 assert.ok(!a['ak-approve'].some(x=>x.includes('ak-plan-panel')));
 assert.ok(!a['ak-drop'].some(x=>x.includes('ak-suggestions-panel')));
 assert.equal((html.match(/id="ak-drop"/g)||[]).length,1);
 assert.equal((html.match(/id="ak-approve"/g)||[]).length,1);
});

test('Live diagram still has its correct statistics and hanger visibility control',()=>{
 const a=elementsWithAncestors(main);
 for(const id of ['ak-svg-container','ak-plan-state','ak-stat-area','ak-stat-grid','ak-stat-tiles','ak-show-hangers']){
  assert.ok(a[id]?.some(x=>x.includes('ak-plan-panel')),id+' must be in plan card');
  assert.equal((main.match(new RegExp('id="'+id+'"','g'))||[]).length,1);
 }
 assert.match(html,/ak-plan-header/);
 assert.match(html,/ak-legend/);
});

test('Approval is the final action in proposals; after approval only PDF and Copy are visible',()=>{
 const a=elementsWithAncestors(main);
 assert.ok(a['ak-download-pdf']?.some(x=>x.includes('ak-result')));
 assert.ok(a['ak-copy']?.some(x=>x.includes('ak-result')));
 assert.ok(a['ak-approve']?.some(x=>x.includes('ak-suggestions-panel')));
 for(const obsolete of ['ak-download-svg','ak-download-csv','ak-print']){
  assert.doesNotMatch(main,new RegExp('id="'+obsolete+'"'));
  assert.doesNotMatch(html,new RegExp('\\$\\('+"'"+obsolete+"'"+'\\)\\.addEventListener'));
 }
 const actions=main.match(/<div class="ak-actions ak-final-actions">([\s\S]*?)<\/div>/)?.[1];
 assert.ok(actions,'Final material actions should exist');
 assert.equal((actions.match(/<button\b/g)||[]).length,2,'Exactly PDF and Copy buttons');
 assert.match(actions,/id="ak-download-pdf"/);
 assert.match(actions,/id="ak-copy"/);
 assert.doesNotMatch(main,/تحميل CSV|تحميل المخطط SVG|طباعة \/ PDF/);
});

test('Desktop/mobile layout and technical formulas are unchanged',()=>{
 assert.match(html,/grid-template-areas:"dimensions dimensions" "plan plan" "suggestions suggestions" "results rules"/);
 assert.match(html,/grid-template-areas:"dimensions" "plan" "suggestions" "results" "rules"/);
 assert.match(html,/function buildPlan\(d,opt\)/);
 assert.match(html,/p\.pWaste/);
 assert.match(html,/id="ak-drop"/);
 assert.doesNotMatch(html,/id="ak-cut"/);
 const script=html.slice(html.indexOf('  function getDimensions()'));
 for(const listener of ["$('ak-svg-container').innerHTML=svgPlan","$('ak-approve').addEventListener","$('ak-show-hangers').addEventListener","$('ak-download-pdf').addEventListener","$('ak-copy').addEventListener","$('ak-stat-tiles').textContent"]){
  assert.ok(script.includes(listener),listener+' should remain operational');
 }
 assert.match(html,/async function pdfReport\(p\)/);
});

test('Material results only show the table and the two approved export actions, not the verbose breakdown/warning',()=>{
 const start=main.indexOf('<div id="ak-results"');
 const end=main.indexOf('</section>',start);
 assert.ok(start>0&&end>start);
 const section=main.slice(start,end);
 assert.match(section,/id="ak-bom"/);
 assert.match(section,/id="ak-download-pdf"/);
 assert.match(section,/id="ak-copy"/);
 assert.doesNotMatch(section,/id="ak-formulas"|تفصيل الحساب المعتمد|لائحة Armstrong ما كتغطيش|class="ak-empty"/);
 assert.doesNotMatch(html,/\$\('ak-formulas'\)/);
 assert.match(html,/const rows=rowsForBom\(p\)/);
 assert.match(html,/async function pdfReport\(p\)/);
 assert.match(html,/\$\('ak-bom'\)\.innerHTML=/);
});
