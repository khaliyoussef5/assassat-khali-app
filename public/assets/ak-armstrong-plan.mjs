/* ASSASSAT KHALI — Armstrong full-room technical plan.
   Pure SVG rendering only. All geometry, quantities and purchase rules
   come from calcArmstrongFull() and must not be recalculated here. */
const F=n=>Number(n).toFixed(2).replace(/\.?0+$/,'');
const N=n=>Number(Number(n).toFixed(2));
const cm=n=>F(N(n*100))+' cm';
const num=n=>Math.round(n*100)/100;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const C={ink:'#18373E',sub:'#597178',line:'#D5E2DD',teal:'#0F6B60',amber:'#DB9244',porteur:'#2563A6',cross120:'#D97706',cross060:'#7C3AED',pale:'#FFF1DB'};
const line=(x1,y1,x2,y2,stroke,width=1,extra='')=>'<line x1="'+F(x1)+'" y1="'+F(y1)+'" x2="'+F(x2)+'" y2="'+F(y2)+'" stroke="'+stroke+'" stroke-width="'+width+'" '+extra+'/>';
const text=(x,y,t,size=13,fill=C.ink,extra='')=>'<text x="'+F(x)+'" y="'+F(y)+'" font-family="Tahoma,Arial,sans-serif" font-size="'+size+'" fill="'+fill+'" '+extra+'>'+esc(t)+'</text>';
const roundRect=(x,y,w,h,r,fill,stroke='none',width=1)=>'<rect x="'+F(x)+'" y="'+F(y)+'" width="'+F(w)+'" height="'+F(h)+'" rx="'+r+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+width+'"/>';
const dimTick=(a,b,vertical=false)=>vertical?line(a-5,b,a+5,b,C.amber,1.6):line(a,b-5,a,b+5,C.amber,1.6);
const clamp=(v,a,b)=>Math.min(Math.max(v,a),b);
export function armstrongFullPlanSvg(p){
 if(p.type!=='armstrong-full')throw Error('Armstrong full diagram requires matching plan');
 const W=1000,H=620,parts=[];
 const maxW=690,maxH=275,aspect=p.L/p.W;
 let gw=maxW,gh=maxW/aspect;
 if(gh>maxH){gh=maxH;gw=maxH*aspect;}
 const x=475-gw/2,y=347-gh/2,right=x+gw,bottom=y+gh;
 const X=n=>x+gw*n/p.L,Y=n=>y+gh*n/p.W;
 const eL=gw*p.edgeL/p.L,eW=gh*p.edgeW/p.W;
 const rightInset=right+23;
 const gridCount=p.nL+' × '+p.nW;
 const name='Armstrong بلا بوردور', edgeText=cm(p.edgeL)+' | '+cm(p.edgeW);
 parts.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+W+' '+H+'" data-diagram="armstrong-full" role="img" aria-label="مخطط Armstrong؛ باقي الطول من الجهتين '+cm(p.edgeL)+'؛ وباقي العرض من الجهتين '+cm(p.edgeW)+'">');
 parts.push('<title>ASSASSAT KHALI — Armstrong Plan</title><desc>المخطط بنفس نسب الطول والعرض، مع القياسات المتبقية على الجوانب، وPorteur أزرق، Cross 1.20 برتقالي، Cross 0.60 بنفسجي.</desc>');
 parts.push('<defs><pattern id="ak-grid-paper" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" stroke="#e8f0ec" stroke-width="1" fill="none"/></pattern><clipPath id="ak-room-clip"><rect x="'+F(x)+'" y="'+F(y)+'" width="'+F(gw)+'" height="'+F(gh)+'"/></clipPath></defs>');
 // Premium technical-document header. Kept vector-only for SVG / exported PDF.
 parts.push(roundRect(0,0,1000,87,0,'#133238'));
 parts.push(roundRect(31,21,46,45,11,'#205154','#346B6A'));
 parts.push(text(54,50,'AK',17,'#EAC18A','font-weight="700" text-anchor="middle" direction="ltr"'));
 parts.push(text(94,37,'ASSASSAT KHALI',17,'#F4F8F6','font-weight="700"'));
 parts.push(text(94,60,'OUTIL TECHNIQUE / PLAN',10,'#A9CBC6','font-weight="700" letter-spacing="1.4"'));
 parts.push(text(965,38,'مخطط توزيع البروفيلات',20,'#FFFFFF','font-weight="700" text-anchor="end" direction="ltr"'));
 parts.push(text(965,62,'ARMSTRONG 60 × 60 — SANS BORDURE',11,'#B2D2C9','font-weight="700" text-anchor="end" direction="ltr"'));
 // Project metrics line; separate from actual four edge labels.
 parts.push(roundRect(35,98,930,43,12,'#F2F7F4','#DDE8E2'));
 parts.push(text(61,124,'LONGUEUR',11,C.sub,'font-weight="700"'));
 parts.push(text(141,124,F(p.L)+' m',15,C.ink,'font-weight="700"'));
 parts.push(text(298,124,'LARGEUR',11,C.sub,'font-weight="700"'));
 parts.push(text(371,124,F(p.W)+' m',15,C.ink,'font-weight="700"'));
 parts.push(text(518,124,'TRAME 60×60',11,C.sub,'font-weight="700"'));
 parts.push(text(620,124,gridCount,15,C.ink,'font-weight="700"'));
 parts.push(text(802,124,'BA13: NON',11,C.teal,'font-weight="700"'));
 // Blueprint panel.
 parts.push(roundRect(35,151,930,370,17,'#FCFDFB','#DBE7E1',1.5));
 parts.push('<rect x="36" y="152" width="928" height="368" rx="16" fill="url(#ak-grid-paper)" opacity=".75"/>');
 parts.push(roundRect(x,y,gw,gh,0,'#FFFFFF','#51736E',1.5));
 // Warm shade: the four trimmed tile strips (NOT BA13).
 parts.push('<g clip-path="url(#ak-room-clip)" fill="#EBC48C" opacity=".24">');
 if(eL>1e-5){parts.push(roundRect(x,y,eL,gh,0,C.pale));parts.push(roundRect(right-eL,y,eL,gh,0,C.pale));}
 if(eW>1e-5){parts.push(roundRect(x,y,gw,eW,0,'#F6DFAE'));parts.push(roundRect(x,bottom-eW,gw,eW,0,'#F6DFAE'));}
 parts.push('</g>');
 for(const v of p.xLines.slice(1,-1))parts.push(line(X(v),y,X(v),bottom,'#B9C9C4',.9));
 for(const v of p.yLines.slice(1,-1))parts.push(line(x,Y(v),right,Y(v),'#B9C9C4',.9));
 for(const piece of p.crossSegments){
  const clr=piece.kind==='cross120'?C.cross120:C.cross060;
  parts.push('<line data-profile="'+piece.kind+'" data-cut="'+(piece.cut?'yes':'no')+'" x1="'+F(X(piece.x1))+'" y1="'+F(Y(piece.y1))+'" x2="'+F(X(piece.x2))+'" y2="'+F(Y(piece.y2))+'" stroke="'+clr+'" stroke-width="'+(piece.kind==='cross120'?3.7:2.9)+'" stroke-linecap="butt"/>');
 }
 for(const support of p.carrierPositions)parts.push('<line data-profile="porteur" x1="'+F(x)+'" y1="'+F(Y(support))+'" x2="'+F(right)+'" y2="'+F(Y(support))+'" stroke="'+C.porteur+'" stroke-width="4.5"/>');
 parts.push(roundRect(x,y,gw,gh,0,'none','#274E53',2.8));
 // Length-edge dimensions: both left/right remain symmetric and explicitly labelled.
 const dimY=y-17;
 parts.push(line(x,dimY,right,dimY,'#B4C5BF',.9));
 for(const k of [x,x+eL,right-eL,right])parts.push(dimTick(k,dimY));
 const topAnchor=gw>225?Math.max(36,eL/2):16;
 const leftTag=gw>225?x+topAnchor:x-17;
 const rightTag=gw>225?right-topAnchor:right+17;
 const labelY=dimY-10;
 parts.push(text(leftTag,labelY,cm(p.edgeL),13,C.amber,'font-weight="700" text-anchor="middle" direction="ltr" data-side="length-start"'));
 parts.push(text(rightTag,labelY,cm(p.edgeL),13,C.amber,'font-weight="700" text-anchor="middle" direction="ltr" data-side="length-end"'));
 if(gw>225)parts.push(text(x+gw/2,labelY,F(p.nL*.6)+' m',12,C.sub,'font-weight="700" text-anchor="middle" direction="ltr"'));
 // Width-edge measurements have their own lines and tags on the right side.
 parts.push(line(rightInset,y,rightInset,bottom,'#B4C5BF',.9));
 for(const k of [y,y+eW,bottom-eW,bottom])parts.push(dimTick(rightInset,k,true));
 if(gh>90){
  const upper=clamp(y+eW/2,y+15,y+gh/2-12);
  const lower=clamp(bottom-eW/2,y+gh/2+12,bottom-15);
  parts.push(text(rightInset+14,upper+5,cm(p.edgeW),13,C.amber,'font-weight="700" direction="ltr" data-side="width-start"'));
  parts.push(text(rightInset+14,lower+5,cm(p.edgeW),13,C.amber,'font-weight="700" direction="ltr" data-side="width-end"'));
  if(gh>190)parts.push(text(rightInset+14,y+gh/2+4,F(p.nW*.6)+' m',12,C.sub,'font-weight="700" direction="ltr"'));
 }
 // Small dimension tags stay visible even on extreme aspect ratios via footer labels.
 parts.push(text(58,174,'PLAN / VUE EN PLAFOND',11,C.sub,'font-weight="700" letter-spacing=".6"'));
 parts.push(text(58,499,'باقي الطول: '+cm(p.edgeL)+' × 2',13,C.ink,'font-weight="700" direction="ltr"'));
 parts.push(text(940,499,'باقي العرض: '+cm(p.edgeW)+' × 2',13,C.ink,'font-weight="700" text-anchor="end" direction="ltr"'));
 // Meaningful color legend plus computed installed-vs-purchased quantities.
 parts.push(roundRect(35,530,930,79,15,'#F2F7F4','#DCE7E2'));
 const swatch=(x,clr,label,qty)=>{
   parts.push(line(x,556,x+31,556,clr,4,'stroke-linecap="round"'));
   parts.push(text(x+40,561,label+'  '+qty,13,C.ink,'font-weight="700" direction="ltr"'));
 };
 swatch(59,C.porteur,'Porteur',p.porteur);
 swatch(324,C.cross120,'Cross 1.20',p.cross120);
 swatch(631,C.cross060,'Cross 0.60',p.cross060);
 parts.push(line(56,575,946,575,'#D7E4DE',1));
 parts.push(text(59,594,'Cross 0.60: '+p.cross060+' مقطع فالرسم  |  '+p.cross060Stock+' بروفيل محسوب للشراء  |  '+p.cross060HalfCount+' مقاطع أقل من 30cm محسوبة أنصاف',12,C.sub,'font-weight="700" direction="ltr"'));
 parts.push('</svg>');return parts.join('');
}
