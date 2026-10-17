import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../public/'+path,import.meta.url),'utf8');
const files=[
 'calculators/armstrong/index.html',
 'calculators/armstrong-full/index.html',
 'calculators/ba13-ceiling/index.html',
 'calculators/walls/index.html'
];
const app=read('assets/ak-app.mjs');
const navCSS=read('assets/ak-calculator-nav.css');
const navRe=/<nav class="ak-calculator-nav" aria-label="التنقل بين الحاسبات">[\s\S]*?<\/nav>/g;
const template=[...app.matchAll(navRe)];
assert.equal(template.length,1,'The shared application must contain one navbar template');
const sharedNav=template[0][0];

test('Every calculator page displays the exact same top navigation and one return action',()=>{
 for(const file of files){
  const html=read(file);
  const rendered=file.includes('armstrong-full')?app:html;
  const navs=[...rendered.matchAll(navRe)];
  assert.equal(navs.length,1,file+' should contain exactly one shared navbar');
  assert.equal(navs[0][0],sharedNav,file+' uses the exact common navbar');
  assert.equal((rendered.match(/← رجوع للحاسبات/g)||[]).length,1,file+' should show the return action once');
  assert.match(html,/href="\.\.\/\.\.\/assets\/ak-calculator-nav\.css"/,file+' loads shared navbar styling');
  assert.match(navs[0][0],/class="ak-calculator-nav__back" href="\.\.\/\.\.\/"/);
  assert.match(navs[0][0],/class="ak-calculator-nav__home" href="\.\.\/\.\.\/"/);
  const destination=new URL('../../','https://example.pages.dev/'+file.replace(/index\.html$/,''));
  assert.equal(destination.href,'https://example.pages.dev/',file+' points to the site home');
  if(file==='calculators/armstrong-full/index.html'){
   assert.match(html,/data-calculator="armstrong-full"/);
  }else{
   assert.ok(html.indexOf('<nav class="ak-calculator-nav"')<html.indexOf('<main'),file+' navbar stays above the main content');
  }
 }
});

test('Both Armstrong pages eliminate old duplicate back buttons without changing drawing rendering',()=>{
 const ba13=read(files[0]);
 assert.doesNotMatch(ba13,/ak-back-to-calculators/);
 assert.ok(ba13.indexOf('<nav class="ak-calculator-nav"')<ba13.indexOf('<header class="ak-head">'));
 assert.match(ba13,/id="ak-svg-container"/);
 assert.match(app,/armstrongFullPlanSvg\(p,\{showHangers\}\)/);
 assert.doesNotMatch(app,/class="back"/);
 assert.doesNotMatch(app,/class="top"/);
});

test('Shared navbar CSS pins all pages to the same responsive top layout',()=>{
 assert.match(navCSS,/\.ak-calculator-nav\{/);
 assert.match(navCSS,/max-width:1250px/);
 assert.match(navCSS,/min-height:67px/);
 assert.match(navCSS,/justify-content:space-between/);
 assert.match(navCSS,/direction:rtl/);
 assert.match(navCSS,/@media\(max-width:600px\)/);
 assert.match(navCSS,/\.ak-calculator-nav__back\{/);
 assert.match(navCSS,/@media print\{\.ak-calculator-nav\{display:none!important\}\}/);
});

test('Development-only BA13 and wall pages retain their locked status and no active calculators',()=>{
 for(const name of ['ba13-ceiling','walls']){
  const html=read('calculators/'+name+'/index.html');
  assert.match(html,/قيد التطوير/);
  assert.doesNotMatch(html,/data-calculator=/);
  assert.doesNotMatch(html,/ak-app\.mjs/);
  assert.doesNotMatch(html,/رجوع للحاسبات المتاحة/);
 }
 const home=read('index.html');
 assert.doesNotMatch(home,/ak-calculator-nav__back/);
});
