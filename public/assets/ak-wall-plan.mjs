/* Position-aware wall plan; uses calcWall data as the only geometric source. */
const F=n=>Number(n).toLocaleString('fr-FR',{maximumFractionDigits:2});
const T=n=>Number(n).toFixed(2).replace(/\.?0+$/,'');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;':'&quot;'}[c]));
const C={stud:'#2563A6',jamb:'#0F766E',rail:'#193f48',open:'#C47D2D',wool:'#EED3A1',ink:'#1D404A',muted:'#557179'};
const text=(x,y,t,size=13,color=C.ink,extra='')=>'<text x="'+T(x)+'" y="'+T(y)+'" fill="'+color+'" font-size="'+size+'" font-family="Tahoma,Arial,sans-serif" '+extra+'>'+esc(t)+'</text>';
const line=(x1,y1,x2,y2,c,w,attr='')=>'<line x1="'+T(x1)+'" y1="'+T(y1)+'" x2="'+T(x2)+'" y2="'+T(y2)+'" stroke="'+c+'" stroke-width="'+w+'" '+attr+'/>';
export function wallPlanSvg(p){
 if(p.type!=='wall')throw Error('Wall-only technical SVG');
 const A=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 620" data-diagram="wall" role="img" aria-label="مخطط حائط مع مواضع الأبواب والشبابيك"><rect width="1000" height="620" fill="#f9fcfa"/>'];
 A.push('<rect width="1000" height="86" fill="#15363e"/>',
 text(35,38,'ASSASSAT KHALI',20,'#FFFFFF','font-weight="800"'),text(35,64,'PLAN TECHNIQUE / CLOISON & DOUBLAGE',11,'#B6DAD1','letter-spacing="1.2"'),
 text(965,43,p.kind==='doublage'?'Doublage BA13':p.insulated?'Cloison + Isolation':'Cloison BA13',20,'#FFFFFF','text-anchor="end" font-weight="800"'));
 A.push('<rect x="35" y="99" width="930" height="47" rx="11" fill="#edf5f1" stroke="#dce8e2"/>',
 text(56,129,'الطول '+F(p.L)+'m   •   الارتفاع '+F(p.H)+'m',15,C.ink,'font-weight="800"'),
 text(470,129,'صافي: '+F(p.netArea)+'m² × '+p.faces+' وجه × '+p.layers+' طبقة',14,C.ink,'font-weight="700"'),
 text(943,129,'Montants × '+p.montants,15,C.stud,'font-weight="800" text-anchor="end"'));
 A.push('<rect x="35" y="155" width="930" height="379" rx="16" fill="#fff" stroke="#dce8e2"/>');
 let ww=720,hh=720*p.H/p.L;if(hh>266){hh=266;ww=266*p.L/p.H;}
 const x=455-ww/2,y=345-hh/2,X=v=>x+ww*v/p.L,Y=v=>y+hh*v/p.H;
 A.push('<rect x="'+T(x)+'" y="'+T(y)+'" width="'+T(ww)+'" height="'+T(hh)+'" fill="'+(p.insulated?'#fff6e6':'#f8fbfa')+'" stroke="'+C.rail+'" stroke-width="2.5"/>');
 for(const o of p.openings){
  A.push('<rect data-opening="'+o.type+'" x="'+T(X(o.x))+'" y="'+T(Y(o.top))+'" width="'+T(ww*o.w/p.L)+'" height="'+T(hh*o.h/p.H)+'" fill="'+(o.type==='door'?'#fff':'#e5f3f4')+'" stroke="'+C.open+'" stroke-width="2.6"/>');
 }
 for(const pos of p.studPositions){
  let y0=0;const slots=p.openings.filter(o=>pos>o.x+1e-7&&pos<o.right-1e-7).sort((a,b)=>a.top-b.top);
  for(const gap of slots){if(gap.top>y0)A.push(line(X(pos),Y(y0),X(pos),Y(gap.top),C.stud,2.6,'data-profile="montant"'));y0=Math.max(y0,gap.bottom);}
  if(y0<p.H)A.push(line(X(pos),Y(y0),X(pos),Y(p.H),C.stud,2.6,'data-profile="montant"'));
 }
 for(const run of p.railSegments)A.push(line(X(run.x1),Y(run.y1),X(run.x2),Y(run.y2),C.rail,4.1,'data-profile="rail"'));
 for(const pos of p.reinforcements)A.push(line(X(pos),Y(0),X(pos),Y(p.H),C.jamb,3.8,'data-profile="jamb"'));
 A.push(line(x,y-24,x+ww,y-24,'#9db7b1',1.2),text(x+ww/2,y-35,F(p.L)+' m',16,C.ink,'font-weight="800" text-anchor="middle"'));
 A.push(line(x+ww+22,y,x+ww+22,y+hh,'#9db7b1',1.2),text(x+ww+32,y+hh/2,F(p.H)+' m',15,C.ink,'font-weight="800"'));
 A.push(text(54,178,'ÉLÉVATION / VUE DU MUR',11,C.muted,'font-weight="800"'));
 A.push(text(57,503,'Montants: كل '+F(p.spacing*100)+'cm  •  '+p.baseStuds+' خطوط رئيسية + '+p.extraStuds+' تدعيم جنبات',13,C.ink,'font-weight="700"'));
 if(p.openings.length)A.push(text(944,483,p.openings.map(o=>(o.type==='door'?'باب ':'شباك ')+F(o.w)+'×'+F(o.h)+'m عند '+F(o.x)+'m').join(' / '),12,C.open,'font-weight="700" text-anchor="end"'));
 A.push('<rect x="35" y="547" width="930" height="60" rx="12" fill="#edf5f1" stroke="#dce8e2"/>');
 A.push(line(54,570,90,570,C.rail,4),text(99,575,'Rails × '+p.rails,13,C.ink,'font-weight="700"'),line(265,570,300,570,C.stud,3),text(312,575,'Montants × '+p.montants,13,C.ink,'font-weight="700"'));
 A.push(line(580,570,610,570,C.jamb,4),text(620,575,'تدعيم الفتحات',13,C.ink,'font-weight="700"'));
 A.push(text(54,594,'ألواح BA13: '+p.boards+' (حد أدنى بالمساحة)  •  Rails 3m: '+p.rails+'  •  '+(p.insulated?'Rockwool '+p.woolDensity+'kg/m³ / '+p.woolThickness+'mm':'بلا عزل'),12,C.muted,'font-weight="700"'));
 A.push('</svg>');return A.join('');
}
