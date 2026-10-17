/* ASSASSAT KHALI — dedicated BA13 technical SVG (not a web screenshot). */
const T=(x,n=2)=>Number(x).toFixed(n).replace(/\.?0+$/,'');
const cm=x=>T(x*100)+' cm';
const esc=x=>String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;':'&quot;'}[c]));
const col={ink:'#24424A',dim:'#BE702B',main:'#2563A6',ring:'#D97706',hanger:'#0F766E',wall:'#1C4149',light:'#F7E9CE'};
const tx=(x,y,s,fill=col.ink,size=14,attrs='')=>'<text x="'+T(x)+'" y="'+T(y)+'" fill="'+fill+'" font-size="'+size+'" font-family="Tahoma,Arial,sans-serif" '+attrs+'>'+esc(s)+'</text>';
const ln=(x1,y1,x2,y2,color,width=1,attrs='')=>'<line x1="'+T(x1)+'" y1="'+T(y1)+'" x2="'+T(x2)+'" y2="'+T(y2)+'" stroke="'+color+'" stroke-width="'+width+'" '+attrs+'/>';
export function ba13PlanSvg(p,{showHangers=true}={}){
 if(p.type!=='ba13-ceiling')throw Error('BA13 drawing requires BA13 layout');
 const A=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 620" data-diagram="ba13-ceiling" role="img" aria-label="مخطط سقف BA13 مع توزيع Fourrure والمقاسات"><rect width="1000" height="620" fill="#f9fcfa"/>'];
 A.push('<rect width="1000" height="84" fill="#15363e"/>',tx(38,39,'ASSASSAT KHALI','#ffffff',20,'font-weight="800"'),tx(38,63,'PLAN TECHNIQUE / PLAFOND BA13','#b6dad1',11,'letter-spacing="1"'));
 A.push(tx(963,40,p.mode==='hidden'?'سقف BA13 مع إنارة مخفية':'سقف BA13 عادي','#ffffff',21,'font-weight="800" text-anchor="end"'));
 A.push('<rect x="35" y="99" width="930" height="45" rx="10" fill="#edf5f1" stroke="#dce8e2"/>');
 A.push(tx(55,128,'الطول '+T(p.L)+'m  /  العرض '+T(p.W)+'m',col.ink,15,'font-weight="700"'));
 A.push(tx(515,128,'Fourrure '+p.positions.length+' خطوط / '+T(p.totalFourrure)+' m',col.ink,15,'font-weight="700"'));
 A.push(tx(940,128,'3m × '+p.fourrure,col.main,16,'font-weight="800" text-anchor="end"'));
 A.push('<rect x="35" y="156" width="930" height="370" rx="16" fill="#fff" stroke="#dce7e1"/>');
 let rw=670,rh=670*p.W/p.L;
 if(rh>265){rh=265;rw=265*p.L/p.W;}
 const x=455-rw/2,y=350-rh/2,X=v=>x+rw*v/p.L,Y=v=>y+rh*v/p.W;
 A.push('<rect x="'+T(x)+'" y="'+T(y)+'" width="'+T(rw)+'" height="'+T(rh)+'" fill="#f8fbf9" stroke="'+col.wall+'" stroke-width="2.5"/>');
 if(p.mode==='hidden'){
  const xx=X(p.inset),yy=Y(p.inset),ww=X(p.L-p.inset)-xx,hh=Y(p.W-p.inset)-yy;
  A.push('<rect x="'+T(xx)+'" y="'+T(yy)+'" width="'+T(ww)+'" height="'+T(hh)+'" fill="none" stroke="#F3D4A3" stroke-width="7" opacity=".45"/>');
 }
 for(const run of p.lines){
  A.push(ln(X(run.x1),Y(run.y1),X(run.x2),Y(run.y2),col.main,3.3,'data-profile="fourrure"'));
 }
 for(const run of p.ring){
  A.push(ln(X(run.x1),Y(run.y1),X(run.x2),Y(run.y2),col.ring,3.9,'data-profile="led-ring"'));
 }
 if(showHangers){
  for(const dot of p.hangerPoints){
   A.push('<circle data-hanger="yes" cx="'+T(X(dot.x))+'" cy="'+T(Y(dot.y))+'" r="4.6" fill="'+col.hanger+'" stroke="#fff" stroke-width="1.8"/>');
  }
 }
 // Dimensioning around the plan, plus first offset, spacing and LED inset.
 const ty=y-26;
 A.push(ln(x,ty,x+rw,ty,'#a7bfb8',1.1),ln(x,ty-6,x,ty+6,col.dim,1.5),ln(x+rw,ty-6,x+rw,ty+6,col.dim,1.5));
 A.push(tx(x+rw/2,ty-11,T(p.L)+' m',col.ink,15,'font-weight="800" text-anchor="middle"'));
 const dx=x+rw+18;
 A.push(ln(dx,y,dx,y+rh,'#a7bfb8',1.2),ln(dx-6,y,dx+6,y,col.dim,1.2),ln(dx-6,y+rh,dx+6,y+rh,col.dim,1.2));
 A.push(tx(dx+14,y+rh/2,T(p.W)+' m',col.ink,14,'font-weight="800"'));
 // Put short offsets in dedicated areas rather than over the lines.
 A.push(tx(56,179,'DISTRIBUTION FOURRURE', '#647d7d',11,'font-weight="700" letter-spacing=".7"'));
 A.push(tx(58,486,'بداية التوزيع: '+cm(p.first)+'   •   التباعد: '+cm(p.spacing),col.ink,13,'font-weight="700"'));
 if(p.mode==='hidden')A.push(tx(947,486,'فتحة LED: '+cm(p.inset)+' من الحائط  •  الطول الداخلي: '+T(p.ledLen)+' m',col.dim,13,'font-weight="700" text-anchor="end"'));
 A.push('<rect x="35" y="538" width="930" height="70" rx="12" fill="#eef5f1" stroke="#dce8e2"/>');
 A.push(ln(55,563,93,563,col.main,4),tx(105,568,'Fourrure × '+p.positions.length,col.ink,13,'font-weight="700"'));
 if(p.mode==='hidden')A.push(ln(320,563,358,563,col.ring,4),tx(370,568,'LED 10cm',col.ink,13,'font-weight="700"'));
 if(showHangers)A.push('<circle cx="626" cy="563" r="6" fill="'+col.hanger+'" stroke="#fff" stroke-width="2"/>',tx(639,568,'علاقات × '+p.hangers,col.ink,13,'font-weight="700"'));
 A.push(tx(56,593,'Fourrure 3m: '+p.fourrure+'  •  وصلات تقديرية: '+p.joinCount+'  •  ألواح BA13 (حد أدنى نظري): '+p.boards,'#587270',12,'font-weight="700"'));
 A.push('</svg>');return A.join('');
}
