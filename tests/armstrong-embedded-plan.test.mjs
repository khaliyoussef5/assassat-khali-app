import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../public/calculators/armstrong/index.html',import.meta.url),'utf8');

// Confirm real ancestor containment, not just textual ordering of headings.
function tagsAndAncestors(markup){
 const main=markup.slice(markup.indexOf('<main'),markup.indexOf('</main>')+7),stack=[],ancestors={},tokens=/<\/?(?:div|section)\b[^>]*>/g;
 for(const token of main.matchAll(tokens)){
  const tag=token[0],isClose=tag.startsWith('</'),name=/^<\/?([a-z]+)/.exec(tag)[1];
  if(isClose){
   const current=stack.pop();
   assert.equal(current?.name,name,'HTML should be properly nested at '+token.index);
   continue;
  }
  const cls=/\bclass="([^"]+)"/.exec(tag)?.[1]||'';
  const id=/\bid="([^"]+)"/.exec(tag)?.[1];
  const cur={name,id,cls};
  if(id)ancestors[id]=[...stack.map(x=>x.cls||x.id),cls];
  stack.push(cur);
 }
 assert.equal(stack.length,0,'Unclosed div/section elements');
 return ancestors;
}
test('Interactive Armstrong plan is INSIDE the BA13 border/distribution proposal card',()=>{
 const ancestors=tagsAndAncestors(html);
 for(const id of ['ak-svg-container','ak-plan-state','ak-stat-area','ak-stat-grid','ak-stat-tiles','ak-show-hangers','ak-approve','ak-download-svg','ak-print']){
  const path=ancestors[id];
  assert.ok(path,id+' must be present');
  assert.ok(path.some(x=>x.includes('ak-suggestions-panel')),id+' must be inside suggestions card');
  assert.ok(path.some(x=>x.includes('ak-embedded-plan')),id+' must belong to embedded schematic');
  assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id+' must not be duplicated');
 }
 assert.ok(ancestors['ak-drop'].some(x=>x.includes('ak-suggestions-panel')));
 assert.ok(!ancestors['ak-results'].some(x=>x.includes('ak-suggestions-panel')));
});
test('Responsive cards show dimensions then combined suggestions/plan then materials and rules',()=>{
 assert.match(html,/grid-template-areas:"dimensions dimensions" "suggestions suggestions" "results rules"/);
 assert.match(html,/grid-template-areas:"dimensions" "suggestions" "results" "rules"/);
 assert.doesNotMatch(html,/grid-area:plan/);
 assert.match(html,/\.ak-embedded-plan\{scroll-margin-top/);
 assert.match(html,/@media print/);
 assert.match(html,/\.ak-suggestions-panel/);
});
test('No Armstrong calculations or plan interaction controls were removed',()=>{
 const source=html.slice(html.indexOf('  function getDimensions()'));
 for(const str of ["$('ak-svg-container').innerHTML=svgPlan","$('ak-approve').addEventListener","$('ak-show-hangers').addEventListener","$('ak-download-svg').addEventListener","$('ak-download-pdf').addEventListener","$('ak-stat-tiles').textContent"]){
  assert.ok(source.includes(str),str+' remains functional');
 }
 assert.match(html,/function buildPlan\(d,opt\)/);
 assert.match(html,/p.pWaste/);
 assert.match(html,/id="ak-drop"/);
 assert.doesNotMatch(html,/id="ak-cut"/);
});
