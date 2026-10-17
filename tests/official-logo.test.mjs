import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
const asset=new URL('../public/assets/logo-assassat-khali.webp',import.meta.url);
const get=(path)=>readFileSync(new URL('../public/'+path,import.meta.url),'utf8');

test('Uploaded logo is stored as a valid lightweight WebP',()=>{
 const bin=readFileSync(asset);
 assert.ok(bin.length>1000&&bin.length<20000);
 assert.equal(bin.toString('ascii',0,4),'RIFF');
 assert.equal(bin.toString('ascii',8,12),'WEBP');
});

test('Home header uses provided logo in place of generic illustration and sets favicon',()=>{
 const html=get('index.html');
 assert.match(html,/<span class="logo"><img src="assets\/logo-assassat-khali\.webp"/);
 assert.match(html,/<link rel="icon" type="image\/webp" href="assets\/logo-assassat-khali\.webp">/);
 assert.match(html,/\.logo img \{ width:39px; height:40px/);
 assert.doesNotMatch(html,/M5 25V7l11 7 11-7v18/);
});

test('Both available calculators and both locked pages show updated brand icon',()=>{
 const old=get('calculators/armstrong/index.html');
 assert.match(old,/<div class="ak-head-icon" aria-hidden="true"><img src="\.\.\/\.\.\/assets\/logo-assassat-khali\.webp"/);
 const live=get('assets/ak-app.mjs');
 assert.match(live,/<a class="ak-calculator-nav__home" href="\.\.\/\.\.\/"[^>]*><img src="\.\.\/\.\.\/assets\/logo-assassat-khali\.webp"/);
 for(const route of ['armstrong','armstrong-full','ba13-ceiling','walls']){
  const html=get('calculators/'+route+'/index.html');
  assert.match(html,/rel="icon" type="image\/webp" href="\.\.\/\.\.\/assets\/logo-assassat-khali\.webp"/);
 }
});

test('Development calculators stay locked after the logo-only change',()=>{
 const home=get('index.html');
 for(const route of ['ba13-ceiling','walls']){
  const html=get('calculators/'+route+'/index.html');
  assert.match(html,/قيد التطوير/);
  assert.doesNotMatch(html,/ak-app\.mjs/);
  assert.doesNotMatch(home,new RegExp('href="calculators/'+route+'/'));
 }
 assert.equal((home.match(/class="product live"/g)||[]).length,2);
 assert.equal((home.match(/class="product planned"/g)||[]).length,2);
});
