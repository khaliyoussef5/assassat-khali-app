import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const pages = [
 'index.html',
 'calculators/armstrong/index.html',
 'calculators/armstrong-full/index.html',
 'calculators/ba13-ceiling/index.html',
 'calculators/walls/index.html'
];
const id='G-E8P48Z2PYQ';

test('Google Analytics tag appears once and inside <head> on every published HTML page',()=>{
 for(const path of pages){
  const html=readFileSync(new URL('../public/'+path,import.meta.url),'utf8');
  const headStart=html.indexOf('<head>');
  const headEnd=html.indexOf('</head>',headStart);
  assert.ok(headStart>=0&&headEnd>headStart,path+' missing head');
  const head=html.slice(headStart,headEnd);
  assert.equal((html.match(/googletagmanager\\.com\\/gtag\\/js/g)||[]).length,1,path+' should contain one async tag');
  assert.equal((html.match(/gtag\\('config', 'G-E8P48Z2PYQ'\\)/g)||[]).length,1,path+' should configure GA once');
  assert.match(head,/<script async src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-E8P48Z2PYQ"><\/script>/);
  assert.match(head,/window\.dataLayer = window\.dataLayer \|\| \[\];/);
  assert.match(head,/gtag\('js', new Date\(\)\);/);
  assert.match(head,/gtag\('config', 'G-E8P48Z2PYQ'\);/);
 }
});

test('All development calculators remain locked while Analytics collects page views',()=>{
 const home=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
 for(const route of ['ba13-ceiling','walls']){
  const html=readFileSync(new URL('../public/calculators/'+route+'/index.html',import.meta.url),'utf8');
  assert.match(html,/قيد التطوير/);
  assert.doesNotMatch(html,/ak-app\.mjs/);
  assert.doesNotMatch(home,new RegExp('href="calculators/'+route+'/'));
 }
 assert.equal((home.match(/class="product live"/g)||[]).length,2);
 assert.equal((home.match(/class="product planned"/g)||[]).length,2);
});
