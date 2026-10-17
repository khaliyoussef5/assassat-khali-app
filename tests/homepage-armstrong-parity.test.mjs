import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const get=name=>readFileSync(new URL('../public/'+name,import.meta.url),'utf8');
const home=get('index.html');
const ba13=get('calculators/armstrong/index.html');
const shared=get('assets/ak-classic.css');
const nav=get('assets/ak-calculator-nav.css');
const style=home.split('<style>')[1]?.split('</style>')[0]||'';

test('Homepage matches both Armstrong pages: surfaces, dark header, consistent cards and buttons',()=>{
 assert.match(style,/--soft:#f3f6f7/);
 assert.match(style,/--ink:#142c35/);
 assert.match(style,/--deep:#112c36/);
 assert.match(style,/--teal:#166e65/);
 assert.match(style,/\.hero\{background:linear-gradient\(120deg,#112c36,#174a51\)/);
 assert.match(style,/\.product\{[^}]*background:#fff;border:1px solid #e0e7e7;border-radius:18px;padding:20px;/);
 assert.match(style,/\.open\{[^}]*background:#166e65/);
 assert.match(style,/\.status\.ready\{background:#e1f6eb;color:#12735d\}/);
 assert.match(shared,/#f3f6f7/);
 assert.match(ba13,/#ak-calculator \.ak-head\{background:linear-gradient\(120deg,#112c36,#174a51\)/);
});

test('Homepage shares calculator navigation proportions without showing self-return action',()=>{
 assert.match(style,/\.shell\{max-width:1250px/);
 assert.match(style,/\.top \.shell\{min-height:67px/);
 assert.match(style,/\.nav \.navlink\{background:#e6f4ef;color:#167767/);
 assert.match(style,/\.brand small\{[^}]*color:#69807d/);
 assert.match(nav,/min-height:67px/);
 assert.match(home,/class="brand" href="\.\/"/);
 assert.doesNotMatch(home,/← رجوع للحاسبات|ak-calculator-nav__back/);
 assert.match(home,/assets\/logo-assassat-khali\.webp/);
});

test('Homepage remains concise and responsive and its workflow matches the calculators',()=>{
 assert.match(style,/@media\(max-width:600px\)/);
 assert.match(style,/\.catalog\{grid-template-columns:1fr\}/);
 assert.match(style,/\.process \.steps\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(home,/class="hero-art" aria-hidden="true"><img src="assets\/logo-assassat-khali\.webp"/);
 assert.ok(home.indexOf('02 / مخطط')<home.indexOf('03 / اختيار'));
 assert.doesNotMatch(home,/<svg viewBox="0 0 360 265"/);
});

test('Original calculator navigation, routes, locked pages, and analytics remain unchanged',()=>{
 assert.equal((home.match(/class="product live"/g)||[]).length,2);
 assert.equal((home.match(/class="product planned"/g)||[]).length,2);
 for(const path of ['armstrong','armstrong-full'])assert.match(home,new RegExp('href="calculators/'+path+'/"'));
 for(const path of ['ba13-ceiling','walls']){
  assert.doesNotMatch(home,new RegExp('href="calculators/'+path+'/"'));
  const locked=get('calculators/'+path+'/index.html');
  assert.match(locked,/قيد التطوير/);
  assert.doesNotMatch(locked,/data-calculator=/);
 }
 assert.match(home,/G-E8P48Z2PYQ/);
 assert.match(home,/id="tools"/);
 assert.match(home,/id="method"/);
});
