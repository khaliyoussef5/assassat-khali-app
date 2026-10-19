/* Position-aware wall plan; uses calcWall data as the only geometric source. */
const F=n=>Number(n).toLocaleString('fr-FR',{maximumFractionDigits:2});
const T=n=>Number(n).toFixed(2).replace(/\.?0+$/,'');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const C={stud:'#2563A6',jamb:'#0F766E',rail:'#193f48',open:'#C47D2D',ink:'#1D404A',muted:'#557179'};
const text=(x,y,t,size=13,color=C.ink,extra='')=>'<text x="'+T(x)+'" y="'+T(y)+'" fill="'+color+'" font-size="'+size+'" font-family="Tahoma,Arial,sans-serif" '+extra+'>'+esc(t)+'</text>';
const line=(x1,y1,x2,y2,c,w,attr='')=>'<line x1="'+T(x1)+'" y1="'+T(y1)+'" x2="'+T(x2)+'" y2="'+T(y2)+'" stroke="'+c+'" stroke-width="'+w+'" '+attr+'/>';
export function wallPlanSvg(p){
 if(p.type!=='wall')throw Error('Wall-only technical SVG');
 const A=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 620" data-diagram="wall" role="img" aria-label="مخطط حائط مع مواضع الأبواب والشبابيك"><rect width="1000" height="620" fill="#f9fcfa"/>'];
 A.push('<rect width="1000" height="86" fill="#15363e"/>',
 text(35,38,'ASSASSAT KHALI',20,'#FFFFFF','font-weight="800"'),text(35,64,'PLAN TECHNIQUE / CLOISON BA13',11,'#B6DAD1','letter-spacing="1.2"'),
 text(965,43,'Cloison BA13',20,'#FFFFFF','text-anchor="end" font-weight="800"'));
 A.push('<rect x="35" y="99" width="930" height="47" rx="11" fill="#edf5f1" stroke="#dce8e2"/>',
 text(56,129,'الطول '+F(p.L)+'m   •   الارتفاع '+F(p.H)+'m',15,C.ink,'font-weight="800"'),
 text(470,129,'صافي: '+F(p.netArea)+'m² × '+p.faces+' وجه × '+p.layers+' طبقة',14,C.ink,'font-weight="700"'),
 text(943,129,'Montants 3m × '+p.montantStockBars,15,C.stud,'font-weight="800" text-anchor="end"'));
 A.push('<rect x="35" y="155" width="930" height="379" rx="16" fill="#fff" stroke="#dce8e2"/>');
 let ww=720,hh=720*p.H/p.L;if(hh>266){hh=266;ww=266*p.L/p.H;}
 const x=455-ww/2,y=345-hh/2,X=v=>x+ww*v/p.L,Y=v=>y+hh*v/p.H;
 A[0]=A[0].replace('data-diagram="wall"','data-diagram="wall" data-wall-x="'+T(x)+'" data-wall-y="'+T(y)+'" data-wall-w="'+T(ww)+'" data-wall-h="'+T(hh)+'"');
 A.push('<rect x="'+T(x)+'" y="'+T(y)+'" width="'+T(ww)+'" height="'+T(hh)+'" fill="'+'#f8fbfa'+'" stroke="'+C.rail+'" stroke-width="2.5"/>');
 for(const o of p.openings){
  A.push('<rect data-opening="'+o.type+'" x="'+T(X(o.x))+'" y="'+T(Y(o.top))+'" width="'+T(ww*o.w/p.L)+'" height="'+T(hh*o.h/p.H)+'" fill="'+(o.type==='door'?'#fff':'#e5f3f4')+'" stroke="'+C.open+'" stroke-width="2.6"/>');
 }
 for(const pos of p.studPositions){
  let y0=0;const slots=p.openings.filter(o=>pos>o.x+1e-7&&pos<o.right-1e-7).sort((a,b)=>a.top-b.top);
  for(const gap of slots){if(gap.top>y0)A.push(line(X(pos),Y(y0),X(pos),Y(gap.top),C.stud,2.6,'data-profile="montant"'));y0=Math.max(y0,gap.bottom);}
  if(y0<p.H)A.push(line(X(pos),Y(y0),X(pos),Y(p.H),C.stud,2.6,'data-profile="montant"'));
 }

 // Each stud splice joins two 3m stock pieces using a 50cm sleeve.
 // The orange marks visualize the joints (counted separately in cutting BOM).
 if(p.montantCuts?.splicesPerLine){
  for(const pos of [...p.studPositions,...p.reinforcements]){
   for(let splice=1;splice<=p.montantCuts.splicesPerLine;splice++){
    const h=p.H-splice*p.stock;
    if(h>0&&h<p.H){
     const cx=X(pos),cy=Y(h);
     A.push(line(cx-5,cy,cx+5,cy,'#DB8A20',3,'data-stud-splice="50cm"'));
    }
   }
  }
 }
 for(const run of p.railSegments)A.push(line(X(run.x1),Y(run.y1),X(run.x2),Y(run.y2),C.rail,4.1,'data-profile="rail"'));
 for(const pos of p.reinforcements)A.push(line(X(pos),Y(0),X(pos),Y(p.H),C.jamb,3.8,'data-profile="jamb"'));

 // Drag overlays sit above Rails/Montants, so touch and mouse can move every
 // individual door/window; the underlying engineering drawing stays authoritative.
 const byType={door:0,window:0};
 for(const o of p.openings){
  const label=(o.type==='door'?'باب ':'نافذة ')+(++byType[o.type]);
  const ox=X(o.x),oy=Y(o.top),ow=ww*o.w/p.L,oh=hh*o.h/p.H;
  const eid=esc(o.id);
  A.push('<g data-drag-id="'+eid+'" data-drag-type="'+o.type+'" tabindex="0" role="button" aria-label="'+esc(label)+'، حرّك بالماوس أو اللمس، أو الأسهم" style="cursor:grab;touch-action:none">');
  A.push('<rect data-drag-opening="'+eid+'" x="'+T(ox)+'" y="'+T(oy)+'" width="'+T(ow)+'" height="'+T(oh)+'" fill="'+(o.type==='door'?'#effaf7':'#dff0f7')+'" fill-opacity=".55" stroke="#0F766E" stroke-dasharray="5 3" stroke-width="2.5" rx="2"/>');
  A.push(text(ox+ow/2,oy+Math.max(12,oh/2),label,13,C.ink,'text-anchor="middle" font-weight="800" pointer-events="none"'));
  A.push('</g>');
 }

 A.push(line(x,y-24,x+ww,y-24,'#9db7b1',1.2),text(x+ww/2,y-35,F(p.L)+' m',16,C.ink,'font-weight="800" text-anchor="middle"'));
 A.push(line(x+ww+22,y,x+ww+22,y+hh,'#9db7b1',1.2),text(x+ww+32,y+hh/2,F(p.H)+' m',15,C.ink,'font-weight="800"'));
 A.push(text(54,178,'ÉLÉVATION / VUE DU MUR',11,C.muted,'font-weight="800"'));
 A.push(text(57,503,'Montants: كل '+F(p.spacing*100)+'cm  •  '+p.baseStuds+' خطوط رئيسية + '+p.extraStuds+' تدعيم جنبات',13,C.ink,'font-weight="700"'));
 if(p.openings.length)A.push(text(944,483,'الأبواب: '+p.openings.filter(o=>o.type==='door').length+' | النوافذ: '+p.openings.filter(o=>o.type==='window').length+' — حرّك الفتحات مباشرة في الرسم',12,C.open,'font-weight="700" text-anchor="end"'));
 A.push('<rect x="35" y="547" width="930" height="60" rx="12" fill="#edf5f1" stroke="#dce8e2"/>');
 A.push(line(54,570,90,570,C.rail,4),text(99,575,'Rails × '+p.rails,13,C.ink,'font-weight="700"'),line(265,570,300,570,C.stud,3),text(312,575,'Montants × '+p.montants,13,C.ink,'font-weight="700"'));
 A.push(line(580,570,610,570,C.jamb,4),text(620,575,'تدعيم الفتحات',13,C.ink,'font-weight="700"'));
 A.push(text(54,594,'Montants '+p.stock+'m: '+p.montantStockBars+' بروفيل من بينها '+p.montantSleeves+' قطع وصل × 50cm  •  BA13: '+p.boards,12,C.muted,'font-weight="700"'));
 A.push('</svg>');return A.join('');
}
