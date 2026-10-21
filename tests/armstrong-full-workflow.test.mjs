import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {calcArmstrongFull,materials,fullArmstrongOptions} from '../public/assets/ak-engine.mjs';
import {armstrongFullPlanSvg} from '../public/assets/ak-armstrong-plan.mjs';

const app=readFileSync(new URL('../public/assets/ak-app.mjs',import.meta.url),'utf8');
const css=readFileSync(new URL('../public/assets/ak-classic.css',import.meta.url),'utf8');
const old=readFileSync(new URL('../public/calculators/armstrong/index.html',import.meta.url),'utf8');

test('Borderless Armstrong mirrors the approved workflow with drop in measurements',()=>{
 assert.match(app,/if\(app==='armstrong-full'\)\{\s*document\.body\.classList\.add\('ak-full-flow'\)/);
 assert.match(app,/const \[dimensions,choices,drawing,result\]=panels;/);
 assert.match(app,/dimensions\.after\(drawing\);/);
 assert.match(app,/drawing\.querySelector\('\.step'\)\.textContent='02';/);
 assert.match(app,/choices\.querySelector\('\.step'\)\.textContent='03';/);
 assert.match(app,/choices\.append\(approve\)/);
 assert.match(app,/document\.getElementById\('fields'\)\.append\(dropField\)/);
 assert.match(app,/id="in-drop" type="number"/);
 assert.match(app,/function dims\(\)\{.*if\(app==='armstrong-full'\)out\.drop=field\('drop'\)/);
 assert.match(app,/if\(app==='armstrong-full'\)\$\('in-drop'\)\.addEventListener\('input',refresh\)/);
 assert.ok(css.includes('.ak-full-flow .inputs{grid-template-columns:repeat(3,minmax(0,1fr))}'));
 assert.match(css,/\.ak-full-flow \.plan svg\[data-diagram="armstrong-full"\]\{display:block;width:100%;max-width:100%;min-width:0;height:auto\}/);
 assert.doesNotMatch(app,/Vue en plan — البروفيلات والمساحات مرسومين بالنسب الصحيحة/);
 assert.doesNotMatch(old,/Vue en plan — البروفيلات والمساحات مرسومين بالنسب الصحيحة/);
});

test('Borderless Armstrong shows ONLY copy and materials+plan PDF after approval',()=>{
 const scoped=app.slice(app.indexOf("if(app==='armstrong-full'){\n document.body.classList.add"),app.indexOf("if(app==='armstrong-full'||app==='ba13-ceiling')"));
 assert.match(scoped,/choices\.append\(approve\)/);
 assert.match(scoped,/result\.querySelector\('#csv-download'\)\.remove\(\)/);
 assert.match(scoped,/result\.querySelector\('#print'\)\.remove\(\)/);
 assert.match(scoped,/document\.getElementById\('svg-download'\)\.remove\(\)/);
 assert.match(scoped,/drawing\.querySelector\('\.actions'\)\.remove\(\)/);
 assert.match(scoped,/result\.querySelector\('#note'\)\.remove\(\)/);
 assert.match(scoped,/copy\.id='copy-materials'/);
 assert.match(scoped,/result\.querySelector\('#result \.actions'\)\.append\(copy\)/);
 assert.match(scoped,/تحميل لائحة المواد \+ المخطط PDF/);
 assert.match(app,/if\(app==='armstrong-full'\)\{\s*\$\('copy-materials'\)\.addEventListener\('click',async/);
 assert.match(app,/navigator\.clipboard\?\.writeText/);
 assert.match(app,/document\.execCommand\('copy'\)/);
 assert.match(app,/if\(\$\('svg-download'\)\)/);
 assert.match(app,/if\(\$\('csv-download'\)\)/);
 assert.match(app,/if\(\$\('print'\)\)/);
 assert.match(app,/if\(\$\('note'\)\)/);
});

test('Borderless Armstrong stays geometrically unchanged, PDF uses same rendering and material quantities',()=>{
 const o=fullArmstrongOptions(8,4)[0];
 const p=calcArmstrongFull({L:8,W:4,drop:30,...o});
 assert.ok(p.porteur>0&&p.cross120>0&&p.cross060>0);
 const rows=materials(p);
 assert.equal(rows.find(x=>x.name==='Porteur T 3.60m').qty,p.porteur);
 assert.equal(rows.find(x=>x.name==='Cross 0.60m').qty,p.cross060Stock);
 assert.match(armstrongFullPlanSvg(p),/data-diagram="armstrong-full"/);
 assert.match(app,/if\(p\.type==='armstrong-full'\)return armstrongFullPlanSvg\(p,\{showHangers\}\)/);
 assert.match(app,/drawArmstrongPrintPage\(z,p,planCanvas\.width,planCanvas\.height,\{showHangers\}\)/);
 assert.match(app,/const blob=await createPdf\(plan\)/);
 assert.match(css,/@media\(max-width:800px\)/);
 assert.match(css,/\.ak-full-flow \.plan svg\[data-diagram="armstrong-full"\]\{min-width:0;max-width:100%;width:100%;height:auto\}/);
});

test('Changes are scoped to borderless Armstrong; locked calculators remain isolated',()=>{
 const full=readFileSync(new URL('../public/calculators/armstrong-full/index.html',import.meta.url),'utf8');
 assert.match(full,/data-calculator="armstrong-full"/);
 for(const path of ['ba13-ceiling']){
  const html=readFileSync(new URL('../public/calculators/'+path+'/index.html',import.meta.url),'utf8');
  assert.match(html,/قيد التطوير/);
  assert.doesNotMatch(html,/data-calculator=/);
 }
 assert.match(app,/if\(app==='ba13-ceiling'\)/);
 assert.match(app,/if\(app==='walls'\)/);
 assert.match(app,/if\(app==='armstrong-full'\)/);
 assert.match(old,/id="ak-approve"/);
 assert.match(old,/id="ak-download-pdf"/);
});

test('Shared browser module parses as valid JavaScript before production deployment',()=>{
 execFileSync(process.execPath,['--check',new URL('../public/assets/ak-app.mjs',import.meta.url).pathname],{stdio:'pipe'});
});
