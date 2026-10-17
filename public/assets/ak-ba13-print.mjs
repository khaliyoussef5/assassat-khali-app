/* Print-only BA13 technical plan on landscape A4, geometry drawn directly on canvas. */
const C={ink:'#16343c',sub:'#5b7175',main:'#2563A6',led:'#D97706',hanger:'#0F766E',dim:'#B36A25'};
const nice=n=>Number(Number(n).toFixed(2)).toLocaleString('fr-FR',{maximumFractionDigits:2});
function label(c,s,x,y,size=17,color=C.ink,align='left',weight='700',dir='ltr'){
 c.save();c.fillStyle=color;c.font=weight+' '+size+'px Tahoma,Arial,sans-serif';c.textAlign=align;c.direction=dir;c.textBaseline='middle';c.fillText(String(s),x,y);c.restore();
}
function line(c,x1,y1,x2,y2,color,w=1){c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=w;c.stroke();}
function box(c,x,y,w,h,fill,stroke){c.fillStyle=fill;c.fillRect(x,y,w,h);if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.strokeRect(x,y,w,h);}}
export function drawBA13PrintPage(ctx,p,width=3508,height=2480,{showHangers=true}={}){
 if(p.type!=='ba13-ceiling')throw Error('BA13-only print canvas');
 ctx.save();ctx.setTransform(width/1200,0,0,height/848,0,0);
 box(ctx,0,0,1200,848,'#fff');
 label(ctx,'ASSASSAT KHALI',65,45,24,C.ink,'left','800');
 label(ctx,'OUTIL TECHNIQUE / PLAN 02',65,75,13,C.sub);
 label(ctx,p.mode==='hidden'?'سقف BA13 مع إنارة مخفية':'سقف BA13 عادي',1135,47,25,C.ink,'right','800','rtl');
 label(ctx,'PLAN FOURRURE + SUSPENSION',1135,75,13,C.sub,'right','700');
 line(ctx,65,96,1135,96,'#ccdad5',1.5);
 box(ctx,65,113,1070,75,'#eff6f2','#d9e6df');
 label(ctx,'LONGUEUR',94,133,12,C.sub);label(ctx,nice(p.L)+' m',94,161,21);
 label(ctx,'LARGEUR',320,133,12,C.sub);label(ctx,nice(p.W)+' m',320,161,21);
 label(ctx,'FOURRURE 3m',540,133,12,C.sub);label(ctx,String(p.fourrure)+' barres',540,161,21,C.main);
 label(ctx,'SURFACE',855,133,12,C.sub);label(ctx,nice(p.area)+' m²',855,161,21);
 box(ctx,65,203,1070,491,'#fff','#dce8e2');
 const maxW=865,maxH=376,ratio=p.L/p.W;
 let rw=maxW,rh=maxW/ratio;if(rh>maxH){rh=maxH;rw=maxH*ratio;}
 const x=556-rw/2,y=449-rh/2;
 const X=t=>x+rw*t/p.L,Y=t=>y+rh*t/p.W;
 box(ctx,x,y,rw,rh,'#fafcfb','#244c51');
 for(const run of p.lines)line(ctx,X(run.x1),Y(run.y1),X(run.x2),Y(run.y2),C.main,4);
 if(p.mode==='hidden'){
  ctx.strokeStyle='#f0c88e';ctx.lineWidth=10;
  ctx.strokeRect(X(p.inset),Y(p.inset),X(p.L-p.inset)-X(p.inset),Y(p.W-p.inset)-Y(p.inset));
 }
 for(const run of p.ring)line(ctx,X(run.x1),Y(run.y1),X(run.x2),Y(run.y2),C.led,4.5);
 if(showHangers){
  for(const dot of p.hangerPoints){
   ctx.beginPath();ctx.arc(X(dot.x),Y(dot.y),5,0,Math.PI*2);
   ctx.fillStyle=C.hanger;ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1.8;ctx.stroke();
  }
 }
 ctx.strokeStyle='#244c51';ctx.lineWidth=2.8;ctx.strokeRect(x,y,rw,rh);
 const top=y-30,side=x+rw+25;
 line(ctx,x,top,x+rw,top,'#a9bdb6',1.3);line(ctx,x,top-6,x,top+6,C.dim,1.3);line(ctx,x+rw,top-6,x+rw,top+6,C.dim,1.3);
 label(ctx,nice(p.L)+' m',x+rw/2,top-15,18,C.ink,'center','800');
 line(ctx,side,y,side,y+rh,'#a9bdb6',1.3);
 label(ctx,nice(p.W)+' m',side+14,y+rh/2,17,C.ink,'left','800');
 label(ctx,'Fourrure: البداية '+nice(p.first*100)+'cm / كل '+nice(p.spacing*100)+'cm',85,650,17,C.ink,'left','700');
 if(p.mode==='hidden')label(ctx,'LED: '+nice(p.inset*100)+'cm من الحائط / المسار '+nice(p.ledLen)+'m',1120,650,16,C.dim,'right','700');
 box(ctx,65,713,1070,75,'#eff6f2','#dce8e1');
 line(ctx,88,736,128,736,C.main,5);label(ctx,'Fourrure × '+p.positions.length,139,736,17);
 if(p.mode==='hidden'){line(ctx,390,736,431,736,C.led,5);label(ctx,'LED 10cm',440,736,17);}
 if(showHangers){ctx.beginPath();ctx.arc(737,736,6,0,Math.PI*2);ctx.fillStyle=C.hanger;ctx.fill();label(ctx,'علاقات × '+p.hangers,752,736,17);}
 label(ctx,'طول Fourrure: '+nice(p.totalFourrure)+'m   •   وصلات: '+p.joinCount+'   •   ألواح BA13: '+p.boards+' (تقدير بالمساحة)',88,767,15,C.sub);
 label(ctx,'المخطط توضيحي. راجع الوصلات ومواقع التعليق ونظام LED قبل التنفيذ.',65,823,14,C.sub);
 ctx.restore();
}
