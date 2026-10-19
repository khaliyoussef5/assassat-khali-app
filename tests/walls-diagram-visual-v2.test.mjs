import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calcWall,materials} from '../public/assets/ak-engine.mjs';
import {wallPlanSvg} from '../public/assets/ak-wall-plan.mjs';

const load=p=>readFileSync(new URL('../public/'+p,import.meta.url),'utf8');
const css=load('assets/ak-classic.css');
const app=load('assets/ak-app.mjs');
const interactions=load('assets/ak-wall-interactions.mjs');
const mk=(L=5,H=2.8,openings=[])=>calcWall({L,H,openings,layers:1,spacing:.6,studLength:3,kind:'cloison'});

test('Default Cloison elevation is flat, with no embedded header, footer or nested cards',()=>{
 const svg=wallPlanSvg(mk());
 assert.match(svg,/data-diagram="wall"/);
 assert.match(svg,/data-wall-surface="true"/);
 assert.equal((svg.match(/<rect\b/g)||[]).length,1,'only the actual wall rectangle must be drawn');
 assert.doesNotMatch(svg,/PLAN TECHNIQUE|ASSASSAT KHALI|<rect x="35"|Montants 3m:|Cheville ×/);
 assert.equal((svg.match(/data-drag-id="/g)||[]).length,0);
 assert.match(svg,/>5 m<\/text>/);
 assert.match(svg,/>2,8 m<\/text>/);
});

test('Diagram viewBox trims dead space and still fits dimension guides on ordinary and tall walls',()=>{
 for(const [L,H] of [[5,2.8],[5,4],[8,3],[3,6],[12,2.4]]){
  const svg=wallPlanSvg(mk(L,H));
  const nums=k=>Number(svg.match(new RegExp('data-wall-'+k+'="([^"]+)"'))[1]);
  const vb=svg.match(/viewBox="([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+)"/).slice(1).map(Number);
  const [left,top,width,height]=vb;
  const wx=nums('x'),wy=nums('y'),ww=nums('w'),wh=nums('h');
  assert.ok(width>=620&&height>0);
  assert.ok(ww/width>=.15, 'wall should remain visible at varied ratios');
  assert.ok(wx>=left&&wx+ww<=left+width+.02);
  assert.ok(wy>=top&&wy+wh<=top+height+.02);
  assert.ok(wy-27>=top);
  assert.ok(ww/width>=.65 || H/L>1.5);
 }
});

test('Opening drag overlays are within one wall, stay accessible, and preserve unique controls',()=>{
 const p=mk(8,3,[
  {id:'door-1',type:'door',x:.5,w:.9,h:2.1,bottom:0},
  {id:'window-1',type:'window',x:3.7,w:1,h:1.2,bottom:.9}
 ]);
 const svg=wallPlanSvg(p);
 assert.equal((svg.match(/data-drag-id="/g)||[]).length,2);
 assert.equal((svg.match(/data-drag-opening="/g)||[]).length,2);
 assert.equal((svg.match(/data-opening="/g)||[]).length,2);
 assert.match(svg,/data-drag-id="door-1"/);
 assert.match(svg,/data-drag-id="window-1"/);
 assert.match(svg,/tabindex="0" role="button"/);
 assert.match(svg,/touch-action:none/);
 assert.match(svg,/pointer-events="none"/);
 assert.equal((svg.match(/data-profile="rail"/g)||[]).length,p.railSegments.length);
 assert.equal((svg.match(/data-profile="jamb"/g)||[]).length,p.extraStuds);
 assert.equal((svg.match(/data-fastener="cheville"/g)||[]).length,p.chevilleCount);
 assert.equal(materials(p).find(x=>x.name==='Cheville à frapper').qty,p.chevilleCount);
});

test('Cheville and Montant splice overlays are quiet by default and user-toggleable',()=>{
 const svg=wallPlanSvg(mk(5,4));
 assert.match(svg,/class="ak-wall-fixing-mark"/);
 assert.match(svg,/class="ak-wall-splice-mark"/);
 assert.match(css,/\.ak-walls-flow svg\[data-diagram="wall"\] \.ak-wall-fixing-mark,/);
 assert.match(css,/opacity:0;pointer-events:none/);
 assert.match(css,/\.ak-wall-show-fixings \.ak-wall-fixing-mark\{opacity:1\}/);
 assert.match(css,/\.ak-wall-show-splices \.ak-wall-splice-mark\{opacity:1\}/);
 assert.match(app,/const wallDiagramOptions=\{fixings:false,splices:false\}/);
 assert.match(app,/data-wall-overlay="fixings" aria-pressed="false"/);
 assert.match(app,/data-wall-overlay="splices" aria-pressed="false"/);
 assert.match(app,/button\.addEventListener\('click'/);
 assert.match(app,/applyWallDiagramOptions\(\)/);
 assert.match(app,/wallControls\.bindSvg\(plan\);applyWallDiagramOptions\(\)/);
});

test('Cloison plan uses no duplicate card backgrounds; mobile diagram remains draggable',()=>{
 assert.match(css,/\.ak-walls-flow #plan\.plan\{/);
 assert.match(css,/background:transparent;border:0;border-radius:0;box-shadow:none/);
 assert.match(css,/overflow-x:auto;overflow-y:hidden/);
 assert.match(css,/@media\(max-width:720px\)/);
 assert.match(css,/width:700px;min-width:700px;max-width:none;height:auto/);
 assert.match(app,/class="ak-wall-plan-legend"/);
 assert.match(app,/class="ak-wall-plan-tools"/);
 assert.match(app,/class="ak-wall-legend-rail"/);
 assert.match(app,/class="ak-wall-legend-stud"/);
 assert.match(interactions,/setPointerCapture\(e\.pointerId\)/);
 assert.match(interactions,/getScreenCTM\(\)/);
 assert.match(interactions,/group\.addEventListener\('keydown'/);
});
