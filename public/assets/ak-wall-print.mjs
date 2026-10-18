/* Dedicated landscape A4 technical PDF drawing for wall framing. */
const C={ink:'#16343c',sub:'#5b7175',rail:'#193f48',stud:'#2563A6',jamb:'#0F766E',open:'#C47D2D'};
const fmt=n=>Number(n).toLocaleString('fr-FR',{maximumFractionDigits:2});
function lab(c,v,x,y,size=17,color=C.ink,align='left',weight='700',direction='ltr'){c.save();c.font=weight+' '+size+'px Tahoma,Arial,sans-serif';c.fillStyle=color;c.textAlign=align;c.direction=direction;c.textBaseline='middle';c.fillText(String(v),x,y);c.restore();}
function lin(c,x1,y1,x2,y2,color,w=1){c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=w;c.stroke();}
function rect(c,x,y,w,h,fill,stroke){c.fillStyle=fill;c.fillRect(x,y,w,h);if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.strokeRect(x,y,w,h);}}
export function drawWallPrintPage(ctx,p,width=3508,height=2480){
 if(p.type!=='wall')throw Error('Wall-only PDF plan');
 ctx.save();ctx.setTransform(width/1200,0,0,height/848,0,0);
 rect(ctx,0,0,1200,848,'#fff');
 lab(ctx,'ASSASSAT KHALI',65,45,23);lab(ctx,'OUTIL TECHNIQUE / PLAN 02',65,76,12,C.sub);
 lab(ctx,'Cloison BA13',1135,45,26,C.ink,'right');
 lab(ctx,'PLAN CLOISON / ÉLÉVATION',1135,76,13,C.sub,'right');
 lin(ctx,65,97,1135,97,'#ccdad5',1.5);
 rect(ctx,65,113,1070,77,'#f1f7f3','#dce8e2');
 lab(ctx,'LONGUEUR',89,134,13,C.sub);lab(ctx,fmt(p.L)+' m',90,162,22);
 lab(ctx,'HAUTEUR',335,134,13,C.sub);lab(ctx,fmt(p.H)+' m',337,162,22);
 lab(ctx,'SURFACE NETTE',570,134,13,C.sub);lab(ctx,fmt(p.netArea)+' m²',570,162,22);
 lab(ctx,'MONTANTS',867,134,13,C.sub);lab(ctx,String(p.montants),869,162,22,C.stud);
 rect(ctx,65,207,1070,478,'#fff','#dce8e2');
 let ww=875,hh=875*p.H/p.L;if(hh>370){hh=370;ww=370*p.L/p.H;}
 const x=564-ww/2,y=448-hh/2,X=v=>x+ww*v/p.L,Y=v=>y+hh*v/p.H;
 rect(ctx,x,y,ww,hh,'#f8fbfa',C.rail);
 for(const o of p.openings)rect(ctx,X(o.x),Y(o.top),ww*o.w/p.L,hh*o.h/p.H,o.type==='door'?'#fff':'#e6f3f4',C.open);
 for(const pos of p.studPositions){
  let bottom=0;for(const o of p.openings.filter(o=>pos>o.x+1e-7&&pos<o.right-1e-7).sort((a,b)=>a.top-b.top)){
   if(o.top>bottom)lin(ctx,X(pos),Y(bottom),X(pos),Y(o.top),C.stud,3);
   bottom=Math.max(bottom,o.bottom);
  }
  if(bottom<p.H)lin(ctx,X(pos),Y(bottom),X(pos),Y(p.H),C.stud,3);
 }
 for(const run of p.railSegments)lin(ctx,X(run.x1),Y(run.y1),X(run.x2),Y(run.y2),C.rail,5);
 for(const pos of p.reinforcements)lin(ctx,X(pos),Y(0),X(pos),Y(p.H),C.jamb,4);
 ctx.strokeStyle='#244c51';ctx.lineWidth=2;ctx.strokeRect(x,y,ww,hh);
 lin(ctx,x,y-27,x+ww,y-27,'#a8bdb6',1.2);lab(ctx,fmt(p.L)+' m',x+ww/2,y-45,19,C.ink,'center','800');
 lin(ctx,x+ww+27,y,x+ww+27,y+hh,'#a8bdb6',1.2);lab(ctx,fmt(p.H)+' m',x+ww+35,y+hh/2,17,C.ink,'left','800');
 lab(ctx,'Montants '+fmt(p.spacing*100)+'cm  |  '+p.baseStuds+' profils réguliers + '+p.extraStuds+' renforts de baie',85,648,17,C.ink);
 const openingLabels=p.openings.map(o=>(o.type==='door'?'Porte ':'Fenêtre ')+fmt(o.w)+'×'+fmt(o.h)+'m / X='+fmt(o.x)+'m').join('   |   ');
 if(openingLabels)lab(ctx,openingLabels,1130,675,15,C.open,'right','700');
 rect(ctx,65,714,1070,74,'#eff6f2','#dce8e2');
 lin(ctx,87,739,125,739,C.rail,5);lab(ctx,'Rails 3m × '+p.rails,138,739,17);
 lin(ctx,373,739,410,739,C.stud,4);lab(ctx,'Montants '+p.stock+'m × '+p.montants,423,739,17);
 lin(ctx,785,739,820,739,C.jamb,4);lab(ctx,'Renforts',835,739,17);
 lab(ctx,'BA13 '+p.boards+' plaques (théorique)  |  Raccords Rails '+p.railJoins+'  |  '+'Cloison BA13 / deux faces',87,769,15,C.sub);
 lab(ctx,'مخطط تقديري، تدعيم الفتحات ونظام الجبس يحتاجان للمراجعة التقنية قبل التنفيذ.',65,825,14,C.sub,'left','600','rtl');
 ctx.restore();
}
