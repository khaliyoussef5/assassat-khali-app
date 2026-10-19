/* Cloison elevation: focused, unobstructed SVG with optional installation overlays.
 * All opening and profile geometry comes from calcWall, unchanged.
 * Dragging depends on data-wall-w/h and each data-drag-id, preserved here.
 */
const F=n=>Number(n).toLocaleString('fr-FR',{maximumFractionDigits:2});
const T=n=>Number(n).toFixed(2).replace(/\.?0+$/,'');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const C={stud:'#91B1BB',jamb:'#168779',rail:'#234B53',opening:'#0B7A6F',ink:'#24444D',muted:'#668087'};
const text=(x,y,t,size=13,color=C.ink,extra='')=>'<text x="'+T(x)+'" y="'+T(y)+'" fill="'+color+'" font-size="'+size+'" font-family="Tahoma,Arial,sans-serif" '+extra+'>'+esc(t)+'</text>';
const line=(x1,y1,x2,y2,color,width,attr='')=>'<line x1="'+T(x1)+'" y1="'+T(y1)+'" x2="'+T(x2)+'" y2="'+T(y2)+'" stroke="'+color+'" stroke-width="'+width+'" '+attr+'/>';
export function wallPlanSvg(p){
 if(p.type!=='wall')throw Error('Wall-only technical SVG');
 const A=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 500" data-diagram="wall" role="group" aria-label="مخطط تفاعلي لحائط Cloison BA13 مع الأبواب والنوافذ">'];
 // Use nearly the entire drawing surface for the wall, without nested title,
 // statistics or legend cards. CSS supplies the legend outside the SVG.
 const scale=Math.min(860/p.L,324/p.H);
 const ww=p.L*scale,hh=p.H*scale;
 const x=481-ww/2,y=247-hh/2;
 const X=v=>x+ww*v/p.L,Y=v=>y+hh*v/p.H;
 A[0]=A[0].replace('data-diagram="wall"','data-diagram="wall" data-wall-x="'+T(x)+'" data-wall-y="'+T(y)+'" data-wall-w="'+T(ww)+'" data-wall-h="'+T(hh)+'"');
 A.push('<rect data-wall-surface="true" x="'+T(x)+'" y="'+T(y)+'" width="'+T(ww)+'" height="'+T(hh)+'" fill="#F7FBFA" stroke="#CCDCD8" stroke-width="1.6"/>');
 // Actual openings (kept visible for engineering snapshot and existing consumers).
 for(const o of p.openings){
  A.push('<rect data-opening="'+o.type+'" x="'+T(X(o.x))+'" y="'+T(Y(o.top))+'" width="'+T(ww*o.w/p.L)+'" height="'+T(hh*o.h/p.H)+'" fill="'+(o.type==='door'?'#FFFCF7':'#E9F7F4')+'" stroke="#DFE8E4" stroke-width="1"/>');
 }
 // Subtle regular studs, with the portions inside windows and doors omitted.
 for(const pos of p.studPositions){
  let bottom=0;
  const gaps=p.openings.filter(o=>pos>o.x+1e-7&&pos<o.right-1e-7).sort((a,b)=>a.top-b.top);
  for(const gap of gaps){
   if(gap.top>bottom)A.push(line(X(pos),Y(bottom),X(pos),Y(gap.top),C.stud,1.8,'data-profile="montant"'));
   bottom=Math.max(bottom,gap.bottom);
  }
  if(bottom<p.H)A.push(line(X(pos),Y(bottom),X(pos),Y(p.H),C.stud,1.8,'data-profile="montant"'));
 }
 for(const run of p.railSegments)A.push(line(X(run.x1),Y(run.y1),X(run.x2),Y(run.y2),
  run.kind==='top'||run.kind==='bottom'?C.rail:'#269689',
  run.kind==='top'||run.kind==='bottom'?4.3:3,'data-profile="rail"'));
 for(const pos of p.reinforcements)A.push(line(X(pos),Y(0),X(pos),Y(p.H),C.jamb,2.8,'data-profile="jamb"'));
 // Installation marks are available on demand, hidden by default via CSS.
 if(p.montantCuts?.splicesPerLine){
  for(const pos of [...p.studPositions,...p.reinforcements]){
   for(let splice=1;splice<=p.montantCuts.splicesPerLine;splice++){
    const h=p.H-splice*p.stock;
    if(h>0&&h<p.H)A.push(line(X(pos)-4,Y(h),X(pos)+4,Y(h),'#CF933E',3,
     'data-stud-splice="50cm" class="ak-wall-splice-mark"'));
   }
  }
 }
 for(const pin of p.fixings?.points||[]){
  A.push('<circle data-fastener="cheville" data-fastener-part="'+pin.kind+'" class="ak-wall-fixing-mark" cx="'+T(X(pin.x))+'" cy="'+T(Y(pin.y))+'" r="2.3" fill="#B56C35" pointer-events="none"/>');
 }
 // Drag handles stay visually part of each opening, not extra dashed cards.
 const count={door:0,window:0};
 for(const o of p.openings){
  const label=(o.type==='door'?'باب ':'نافذة ')+(++count[o.type]);
  const ox=X(o.x),oy=Y(o.top),ow=ww*o.w/p.L,oh=hh*o.h/p.H;
  const centerX=ox+ow/2,centerY=oy+oh/2,id=esc(o.id);
  const color=o.type==='door'?'#A86938':'#117C72';
  const bg=o.type==='door'?'#FFF6E9':'#DFF4F0';
  A.push('<g data-drag-id="'+id+'" data-drag-type="'+o.type+'" tabindex="0" role="button" aria-label="'+esc(label)+'، حرّك بالماوس أو اللمس، أو الأسهم" style="cursor:grab;touch-action:none">');
  A.push('<rect data-drag-opening="'+id+'" x="'+T(ox)+'" y="'+T(oy)+'" width="'+T(ow)+'" height="'+T(oh)+'" fill="'+bg+'" stroke="'+color+'" stroke-width="2.6" rx="1.5"/>');
  const fontSize=Math.max(10,Math.min(16,ow/4.5,oh/3));
  A.push(text(centerX,centerY-(oh>42?7:0),label,fontSize,color,'text-anchor="middle" dominant-baseline="middle" font-weight="800" pointer-events="none"'));
  if(ow>60&&oh>54){
   A.push(text(centerX,centerY+15,F(o.w)+' × '+F(o.h),12,C.muted,'text-anchor="middle" font-weight="650" pointer-events="none"'));
  }
  A.push('</g>');
 }
 // Only two dimension guides inside the SVG. Counts and legend live outside.
 const top=y-27;
 A.push(line(x,top,x+ww,top,'#B5CAC6',1.4));
 A.push(line(x,y-6,x,top-4,'#B5CAC6',1.1),line(x+ww,y-6,x+ww,top-4,'#B5CAC6',1.1));
 A.push(text(x+ww/2,top-9,F(p.L)+' m',17,C.ink,'text-anchor="middle" font-weight="850"'));
 const right=x+ww+23;
 A.push(line(right,y,right,y+hh,'#B5CAC6',1.4));
 A.push(line(x+ww+5,y,right+4,y,'#B5CAC6',1.1),line(x+ww+5,y+hh,right+4,y+hh,'#B5CAC6',1.1));
 A.push(text(right+22,y+hh/2,F(p.H)+' m',16,C.ink,'text-anchor="middle" font-weight="850" transform="rotate(-90 '+T(right+22)+' '+T(y+hh/2)+')"'));
 A.push('</svg>');
 return A.join('');
}
