import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {calcWall,materials} from '../public/assets/ak-engine.mjs';
import {wallPlanSvg} from '../public/assets/ak-wall-plan.mjs';

const get=p=>readFileSync(new URL('../public/'+p,import.meta.url),'utf8');
const app=get('assets/ak-app.mjs');
const css=get('assets/ak-classic.css');
const demo=get('calculators/walls-preview/index.html');
const official=get('calculators/walls/index.html');
const home=get('index.html');

test('Walls preview is unlisted and isolated from official locked walls and home',()=>{
 assert.match(demo,/data-calculator="walls"/);
 assert.match(demo,/meta name="robots" content="noindex,nofollow"/);
 assert.match(demo,/assets\/ak-classic\.css/);
 assert.match(demo,/assets\/ak-calculator-nav\.css/);
 assert.match(demo,/assets\/ak-app\.mjs/);
 assert.match(official,/قيد التطوير/);
 assert.doesNotMatch(official,/data-calculator=|ak-app\.mjs/);
 assert.doesNotMatch(home,/href="calculators\/walls(-preview)?\//);
});

test('Preview follows Armstrong: dimensions, plan, wall settings and approval, then concise materials',()=>{
 const start=app.indexOf("if(app==='walls'){\n document.body.classList.add('ak-walls-flow')");
 const end=app.indexOf('function dims()',start);
 assert.ok(start>0&&end>start,'Walls preview layout must be in module');
 const section=app.slice(start,end);
 assert.match(section,/dimensions\.after\(drawing\)/);
 assert.match(section,/drawing\.querySelector\('\.step'\)\.textContent='02'/);
 assert.match(section,/choices\.querySelector\('\.step'\)\.textContent='03'/);
 assert.match(section,/const fieldGroups=\[/);
 for(const id of ['kind','layers','spacing','studLength','rockwool','woolDensity','woolThickness',
 'doorW','doorH','doorX','windowW','windowH','windowX','windowBottom']){
  assert.ok(section.includes("'"+id+"'"),id+' setting needs to be in wall options');
 }
 assert.match(section,/choices\.append\(approve\)/);
 assert.match(section,/drawing\.querySelector\('\.actions'\)\.remove\(\)/);
 assert.match(section,/results\.querySelector\('#csv-download'\)\.remove\(\)/);
 assert.match(section,/results\.querySelector\('#print'\)\.remove\(\)/);
 assert.match(section,/results\.querySelector\('#note'\)\.remove\(\)/);
 assert.match(section,/copy\.id='copy-materials'/);
 assert.match(section,/تحميل لائحة المواد \+ المخطط PDF/);
 assert.match(section,/نسخة تجريبية غير معتمدة للتنفيذ/);
 assert.match(app,/if\(app==='walls'\)\{\s*\$\('copy-materials'\)\.addEventListener/);
 assert.match(app,/drawWallPrintPage\(z,p,planCanvas.width,planCanvas.height\)/);
});

test('Responsive wall preview renders without changing core geometry and acknowledges estimates',()=>{
 assert.match(css,/\.ak-walls-flow \.plan svg\[data-diagram="wall"\]\{display:block;width:100%;height:auto;min-width:0;max-width:100%\}/);
 assert.match(css,/@media\(max-width:420px\)/);
 assert.match(css,/\.ak-wall-setting-grid\{grid-template-columns:1fr\}/);
 for(const [L,H,doorW,doorH] of [[5,2.8,0,0],[5,2.8,.9,2.1],[7,3,1,2.2]]){
  const p=calcWall({L,H,doorW,doorH,doorX:.2,kind:'cloison',layers:1,spacing:.6,studLength:3});
  const svg=wallPlanSvg(p);
  assert.match(svg,/data-diagram="wall"/);
  assert.equal((svg.match(/data-opening="door"/g)||[]).length,doorW>0?1:0);
  assert.equal((svg.match(/data-profile="jamb"/g)||[]).length,p.extraStuds);
  assert.equal(materials(p).find(r=>r.name==='Rails 3m').qty,p.rails);
  assert.ok(p.note.includes('ألواح BA13 محسوبة نظرياً بالمساحة'));
 }
});

test('Existing shared UI module stays syntactically valid',()=>{
 execFileSync(process.execPath,['--check',new URL('../public/assets/ak-app.mjs',import.meta.url).pathname],{stdio:'pipe'});
});
