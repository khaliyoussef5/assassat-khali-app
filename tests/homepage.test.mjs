import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const home=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
test('Homepage presents four calculator categories',()=>{
 assert.match(home,/Armstrong مع بوردور BA13/);
 assert.match(home,/Armstrong بلا بوردور/);
 assert.match(home,/أسقف الجبص بورد BA13/);
 assert.match(home,/Cloison BA13/);
});
test('Only available calculator links to a working relative path',()=>{
 assert.match(home,/href="calculators\/armstrong\/"/);
 assert.doesNotMatch(home,/href="#coming/);
});
test('Core calculator is preserved as separate page',()=>{
 const c=readFileSync(new URL('../public/calculators/armstrong/index.html',import.meta.url),'utf8');
 assert.match(c,/ak-download-pdf/);
 assert.match(c,/الخيار 3 — تعديل يدوي/);
});

test('Only the two approved Armstrong calculator cards are publicly linked',()=>{
 for(const route of ['armstrong','armstrong-full']){
  assert.match(home,new RegExp('href="calculators/'+route+'/"'));
  assert.ok(existsSync(new URL('../public/calculators/'+route+'/index.html',import.meta.url)));
 }
 for(const route of ['ba13-ceiling']){
  assert.doesNotMatch(home,new RegExp('href="calculators/'+route+'/"'));
  const placeholder=readFileSync(new URL('../public/calculators/'+route+'/index.html',import.meta.url),'utf8');
  assert.match(placeholder,/قيد التطوير/);
  assert.doesNotMatch(placeholder,/ak-app\.mjs/);
  assert.doesNotMatch(placeholder,/data-calculator=/);
 }
 assert.equal((home.match(/class="product planned"/g)||[]).length,1);
 assert.equal((home.match(/class="product live"/g)||[]).length,3);
});

test('Cloison BA13 is officially published, BA13 ceilings remain locked',()=>{
 assert.match(home,/href="calculators\/walls\/"/);
 const wall=readFileSync(new URL('../public/calculators/walls/index.html',import.meta.url),'utf8');
 assert.match(wall,/data-calculator="walls"/);
 assert.match(wall,/assets\/ak-app\.mjs/);
 assert.doesNotMatch(wall,/noindex,nofollow|قيد التطوير/);
});
