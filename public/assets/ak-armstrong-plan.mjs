import {suspensionPoints} from './ak-suspensions.mjs';

/* Full-room Armstrong uses the same diagram style as Armstrong + BA13:
 * 1100×610 responsive view, light green 60×60 field, blue Porteur, orange
 * Cross 1.20, green Cross 0.60, dark suspension points and a bottom tile
 * count badge. The underlying full-room geometry is NOT changed here.
 * Pale beige strips are cut ARMSTRONG tiles, never BA13 borders.
 */
const F=n=>Number(n).toFixed(2).replace(/\.?0+$/,'');
const cm=n=>F(Math.round(n*10000)/100)+' cm';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const C={ink:'#415660',bg:'#f5f9f8',field:'#E0F1EB',offcut:'#E6C69E',border:'#AE885B',porteur:'#1F5D9F',cross120:'#D59428',cross060:'#219A7C',hanger:'#233A44'};

export function armstrongFullPlanSvg(p,{showHangers=true}={}){
 if(p.type!=='armstrong-full')throw Error('Armstrong full diagram requires matching plan');
 const bound={x:98,y:95,w:900,h:405};
 const scale=Math.min(bound.w/p.L,bound.h/p.W);
 const wi=p.L*scale,he=p.W*scale;
 const x=bound.x+(bound.w-wi)/2,y=bound.y+(bound.h-he)/2;
 const right=x+wi,bottom=y+he;
 const fx=p.edgeL*scale,fy=p.edgeW*scale;
 const X=v=>x+v*scale,Y=v=>y+v*scale;
 const pieces=[];
 const push=t=>pieces.push(t);
 const num=v=>F(v);
 const line=(x1,y1,x2,y2,stroke,width,extra='')=>'<line x1="'+num(x1)+'" y1="'+num(y1)+'" x2="'+num(x2)+'" y2="'+num(y2)+'" stroke="'+stroke+'" stroke-width="'+num(width)+'" '+extra+'/>';
 const label=(x,y,value,attributes='')=>'<text x="'+num(x)+'" y="'+num(y)+'" '+attributes+'>'+esc(value)+'</text>';

 push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 610" data-diagram="armstrong-full" role="img" aria-label="مخطط سقف Armstrong بلا بوردور، الطول '+esc(F(p.L))+' متر، العرض '+esc(F(p.W))+' متر">');
 push('<title>ASSASSAT KHALI — Armstrong بلا بوردور</title>');
 push('<desc>مخطط متناسب: Porteur باللون الأزرق، Cross 1.20 برتقالي، Cross 0.60 أخضر، وأطراف البلاكات المقطوعة باللون البيج وليست BA13. باقي الطول: '+esc(cm(p.edgeL))+' من كل جهة؛ باقي العرض: '+esc(cm(p.edgeW))+' من كل جهة. Porteur 3.60m: '+p.porteur+' بروفيل، '+p.porteurJoints+' وصلات، الشوت النهائي '+F(p.porteurWaste)+'m. Cross 0.60: '+p.cross060+' مقطع، '+p.cross060Stock+' بروفيل للشراء، '+p.cross060HalfCount+' أنصاف أقل من 30cm.</desc>');
 push('<rect width="1100" height="610" fill="'+C.bg+'"/>');
 push('<g font-family="Arial,Tahoma,sans-serif" text-anchor="middle" fill="#455B64">');
 push(label(550,39,F(p.L)+' m — الطول','font-size="23" font-weight="700"'));
 push(label(38,295,F(p.W)+' m — العرض','font-size="21" font-weight="700" transform="rotate(-90 38 295)"'));
 push('</g>');

 // One whole-room field, with cut-tile edges shaded like the BA13 diagram
 // but without suggesting the presence of any BA13 material.
 push('<rect x="'+num(x)+'" y="'+num(y)+'" width="'+num(wi)+'" height="'+num(he)+'" fill="'+C.field+'" stroke="'+C.border+'" stroke-width="2"/>');
 push('<g fill="'+C.offcut+'" opacity=".80">');
 if(fx>1e-6){
  push('<rect x="'+num(x)+'" y="'+num(y)+'" width="'+num(fx)+'" height="'+num(he)+'"/>');
  push('<rect x="'+num(right-fx)+'" y="'+num(y)+'" width="'+num(fx)+'" height="'+num(he)+'"/>');
 }
 if(fy>1e-6){
  push('<rect x="'+num(x)+'" y="'+num(y)+'" width="'+num(wi)+'" height="'+num(fy)+'"/>');
  push('<rect x="'+num(x)+'" y="'+num(bottom-fy)+'" width="'+num(wi)+'" height="'+num(fy)+'"/>');
 }
 push('</g>');
 // Thin module boundaries stay below the load-bearing colored profiles.
 for(const v of p.xLines.slice(1,-1))push(line(X(v),y,X(v),bottom,'#B9C9C4',1));
 for(const v of p.yLines.slice(1,-1))push(line(x,Y(v),right,Y(v),'#B9C9C4',1));

 for(const seg of p.crossSegments){
  const color=seg.kind==='cross120'?C.cross120:C.cross060;
  const thick=seg.kind==='cross120'?Math.max(2.2,scale*.025):Math.max(2,scale*.021);
  push(line(X(seg.x1),Y(seg.y1),X(seg.x2),Y(seg.y2),color,thick,'data-profile="'+seg.kind+'" data-cut="'+(seg.cut?'yes':'no')+'" stroke-linecap="butt"'));
 }
 for(const support of p.carrierPositions){
  push(line(x,Y(support),right,Y(support),C.porteur,Math.max(3.5,scale*.043),'data-profile="porteur"'));
 }
 if(showHangers){
  for(const pt of suspensionPoints(p)){
   push('<circle data-hanger="yes" cx="'+num(X(pt.x))+'" cy="'+num(Y(pt.y))+'" r="'+num(Math.max(3.1,Math.min(5.5,scale*.055)))+'" fill="'+C.hanger+'" stroke="#ffffff" stroke-width="1.2"/>');
  }
 }
 push('<rect x="'+num(x)+'" y="'+num(y)+'" width="'+num(wi)+'" height="'+num(he)+'" fill="none" stroke="'+C.border+'" stroke-width="2"/>');

 // Label all four sides; cuts of 0cm remain explicitly represented.
 const cutX1=x+Math.max(18,fx/2),cutX2=right-Math.max(18,fx/2);
 const cutY1=y+Math.max(16,fy/2),cutY2=bottom-Math.max(16,fy/2);
 push('<g fill="'+C.ink+'" font-size="16" font-family="Arial,Tahoma,sans-serif" text-anchor="middle" font-weight="700">');
 push(label(cutX1,y-12,cm(p.edgeL),'direction="ltr" data-side="length-start"'));
 push(label(cutX2,y-12,cm(p.edgeL),'direction="ltr" data-side="length-end"'));
 const tagX=right+24;
 push(label(tagX,cutY1,cm(p.edgeW),'text-anchor="start" direction="ltr" data-side="width-start"'));
 push(label(tagX,cutY2,cm(p.edgeW),'text-anchor="start" direction="ltr" data-side="width-end"'));
 push('</g>');

 // Identical center-bottom badge to the approved BA13 diagram.
 push('<rect x="344" y="535" width="410" height="43" rx="10" fill="#ffffff" stroke="#dce7e4"/>');
 push(label(549,562,p.nL+' × '+p.nW+' بلاكة 60×60 — '+p.tiles+' بلاكة','fill="#305a58" font-size="19" font-weight="700" text-anchor="middle" font-family="Arial,Tahoma,sans-serif"'));
 push('</svg>');
 return pieces.join('');
}
