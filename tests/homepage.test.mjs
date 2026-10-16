import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const home=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
test('Homepage presents four calculator categories',()=>{
 assert.match(home,/Armstrong مع بوردور BA13/);
 assert.match(home,/Armstrong بلا بوردور/);
 assert.match(home,/أسقف الجبص بورد BA13/);
 assert.match(home,/الحوائط والعزل/);
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

test('Three new calculator cards link to implemented routes',()=>{
 for (const route of ['armstrong-full','ba13-ceiling','walls']) {
  assert.match(home,new RegExp('href="calculators/'+route+'/"'));
  assert.ok(existsSync(new URL('../public/calculators/'+route+'/index.html',import.meta.url)));
 }
});
