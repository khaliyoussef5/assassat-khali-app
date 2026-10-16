import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const raw=(p)=>readFileSync(new URL('../public/'+p,import.meta.url),'utf8');
test('All three new calculators share the original Armstrong design skin',()=>{
 const style=raw('assets/ak-classic.css');
 for(const route of ['armstrong-full','ba13-ceiling','walls']){
  const html=raw('calculators/'+route+'/index.html');
  assert.match(html,/assets\/ak-tools\.css/);
  assert.match(html,/assets\/ak-classic\.css/);
 }
 assert.match(style,/#f3f6f7/);
 assert.match(style,/#112c36/);
 assert.match(style,/#174a51/);
 assert.match(style,/#178c79/);
 assert.match(style,/#eaf8f3/);
 assert.match(style,/\.choice\.selected/);
 assert.match(style,/\.panel\{/);
});
test('Old Armstrong reference remains independent and original',()=>{
 const html=raw('calculators/armstrong/index.html');
 assert.match(html,/id="ak-calculator"/);
 assert.match(html,/\.ak-head/);
 assert.match(html,/\.ak-option\.selected/);
 assert.doesNotMatch(html,/assets\/ak-classic\.css/);
});
test('Plan before stats and shared classic visuals, calculation logic untouched',()=>{
 const js=raw('assets/ak-app.mjs');
 const idxPlan=js.indexOf('<div class="plan" id="plan"');
 const idxStats=js.indexOf('<div class="summary" id="summary"');
 assert.ok(idxPlan>=0&&idxStats>idxPlan);
 assert.match(js,/headlines\[app\]\.icon/);
 assert.match(js,/armstrongFullPlanSvg\(p,\{showHangers\}\)/);
 assert.match(js,/drawArmstrongPrintPage\(z,p,planCanvas\.width,planCanvas\.height,\{showHangers\}\)/);
 const engine=raw('assets/ak-engine.mjs');
 assert.match(engine,/cross060HalfCount/);
 assert.match(engine,/cross060Stock/);
});
