/* ASSASSAT KHALI — print-only technical drawing for PDF page 2.
   No screenshot of the page/SVG. Draw all actual tee segments directly
   to a high-resolution landscape A4 canvas. Calculation source is p. */
const COLORS={ink:'#16343c',sub:'#5b7175',border:'#cddbd6',paper:'#ffffff',soft:'#f2f7f5',grid:'#c2d0cc',porteur:'#2563a6',cross120:'#d97706',cross060:'#7c3aed',cut:'#fff2d9',amber:'#bb6e1a'};
const nice=n=>Number(Number(n).toFixed(2)).toLocaleString('fr-FR',{maximumFractionDigits:2});
const centimeter=m=>nice(m*100)+' cm';
function label(ctx,s,x,y,size=16,color=COLORS.ink,align='left',weight='600',direction='ltr'){
 ctx.save();ctx.fillStyle=color;ctx.textBaseline='middle';ctx.textAlign=align;ctx.direction=direction;ctx.font=weight+' '+size+'px Tahoma,Arial,sans-serif';ctx.fillText(String(s),x,y);ctx.restore();
}
function segment(ctx,x1,y1,x2,y2,color,width=1){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function roundbox(ctx,x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
function spanNote(ctx,x,y,val){roundbox(ctx,x-45,y-14,90,29,8,'#fff7e8','#eed2a6');label(ctx,centimeter(val),x,y,15,COLORS.amber,'center','700');}
export function drawArmstrongPrintPage(ctx,p,width=3508,height=2480){
 if(p.type!=='armstrong-full')throw Error('Armstrong-only technical PDF layout');
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<800||height<565)throw Error('Invalid print canvas');
 ctx.save();ctx.setTransform(width/1200,0,0,height/848,0,0);
 ctx.fillStyle='#fff';ctx.fillRect(0,0,1200,848);
 // Simple professional print letterhead — NOT the site header.
 label(ctx,'ASSASSAT KHALI',65,46,23,COLORS.ink,'left','800');
 label(ctx,'OUTIL TECHNIQUE   /   PLAN 02',65,73,12,COLORS.sub,'left','700');
 label(ctx,'مخطط توزيع البروفيلات',1135,48,26,COLORS.ink,'right','800','rtl');
 label(ctx,'ARMSTRONG · SANS BORDURE',1135,75,13,COLORS.sub,'right','700');
 segment(ctx,65,96,1135,96,'#cbded7',1.5);
 roundbox(ctx,65,114,1070,75,12,COLORS.soft,'#d7e5df');
 label(ctx,'الطول',1100,136,13,COLORS.sub,'right','600','rtl');
 label(ctx,nice(p.L)+' m',1097,166,22,COLORS.ink,'right','800');
 label(ctx,'العرض',805,136,13,COLORS.sub,'right','600','rtl');
 label(ctx,nice(p.W)+' m',806,166,22,COLORS.ink,'right','800');
 label(ctx,'المساحة',536,136,13,COLORS.sub,'right','600','rtl');
 label(ctx,nice(p.area)+' m²',538,166,22,COLORS.ink,'right','800');
 label(ctx,'بلاكات كاملة في الوسط',295,136,13,COLORS.sub,'right','600','rtl');
 label(ctx,p.nL+' × '+p.nW,300,166,22,COLORS.ink,'right','800');
 // Main technical plan: occupy most of the page, independent of web SVG screenshot.
 const maxW=860,maxH=387,ratio=p.L/p.W;
 let rw=maxW,rh=rw/ratio;
 if(rh>maxH){rh=maxH;rw=rh*ratio;}
 const x=570-rw/2, y=445-rh/2, X=u=>x+rw*u/p.L,Y=v=>y+rh*v/p.W;
 ctx.fillStyle='#fff';ctx.fillRect(60,198,1080,486);
 roundbox(ctx,62,198,1076,492,13,'#fff','#dce6e1');
 // A clean white sheet: simple clipped grid, no site cards, navigation, or dark hero.
 const edgeX=rw*p.edgeL/p.L,edgeY=rh*p.edgeW/p.W;
 ctx.fillStyle='#f4f9f6';ctx.fillRect(x,y,rw,rh);
 ctx.save();ctx.beginPath();ctx.rect(x,y,rw,rh);ctx.clip();
 ctx.fillStyle=COLORS.cut;
 if(edgeX>.03){ctx.fillRect(x,y,edgeX,rh);ctx.fillRect(x+rw-edgeX,y,edgeX,rh);}
 if(edgeY>.03){ctx.fillRect(x,y,rw,edgeY);ctx.fillRect(x,y+rh-edgeY,rw,edgeY);}
 ctx.strokeStyle=COLORS.grid;ctx.lineWidth=.7;
 for(const lineX of p.xLines.slice(1,-1))segment(ctx,X(lineX),y,X(lineX),y+rh,COLORS.grid,.8);
 for(const lineY of p.yLines.slice(1,-1))segment(ctx,x,Y(lineY),x+rw,Y(lineY),COLORS.grid,.8);
 for(const tee of p.crossSegments){
  const color=tee.kind==='cross120'?COLORS.cross120:COLORS.cross060;
  segment(ctx,X(tee.x1),Y(tee.y1),X(tee.x2),Y(tee.y2),color,tee.kind==='cross120'?3.8:3);
 }
 for(const yy of p.carrierPositions)segment(ctx,x,Y(yy),x+rw,Y(yy),COLORS.porteur,4.8);
 ctx.restore();
 ctx.strokeStyle='#244c51';ctx.lineWidth=2;ctx.strokeRect(x,y,rw,rh);
 // Leader dimensions at both longitudinal edges; labels don't disappear when cuts are tiny.
 const topY=y-26;
 segment(ctx,x,topY,x+rw,topY,'#9fb7b0',1.3);
 for(const tx of [x,x+edgeX,x+rw-edgeX,x+rw])segment(ctx,tx,topY-5,tx,topY+5,COLORS.amber,1.3);
 const xTagDist=Math.max(54,Math.min(87,rw*.11));
 spanNote(ctx,x+xTagDist,topY-18,p.edgeL);
 spanNote(ctx,x+rw-xTagDist,topY-18,p.edgeL);
 label(ctx,nice(p.L)+' m',x+rw/2,topY-54,18,COLORS.ink,'center','800');
 // Width edge lengths top & bottom with two explicit labels.
 const dimX=x+rw+25;
 segment(ctx,dimX,y,dimX,y+rh,'#9fb7b0',1.3);
 for(const ty of [y,y+edgeY,y+rh-edgeY,y+rh])segment(ctx,dimX-5,ty,dimX+5,ty,COLORS.amber,1.3);
 const tagOff=Math.max(38,Math.min(62,rh*.18));
 label(ctx,centimeter(p.edgeW),dimX+13,y+tagOff,15,COLORS.amber,'left','800');
 label(ctx,centimeter(p.edgeW),dimX+13,y+rh-tagOff,15,COLORS.amber,'left','800');
 // Secondary labels make the remainder unambiguous even at extreme aspect ratios.
 label(ctx,'جوج جهات الطول: '+centimeter(p.edgeL)+' لكل جهة',80,653,16,COLORS.ink,'left','700','rtl');
 label(ctx,'جوج جهات العرض: '+centimeter(p.edgeW)+' لكل جهة',1120,653,16,COLORS.ink,'right','700','rtl');
 // Clear legend and only the essential quantities.
 roundbox(ctx,65,709,1070,69,11,COLORS.soft,'#dae6e0');
 const legend=(start,color,description,quantity)=>{
  segment(ctx,start,734,start+34,734,color,5);
  label(ctx,description,start+45,734,16,COLORS.ink,'left','700');
  label(ctx,String(quantity),start+45,759,16,color,'left','800');
 };
 legend(85,COLORS.porteur,'Porteur T',p.porteur);
 legend(394,COLORS.cross120,'Cross 1.20m',p.cross120);
 legend(756,COLORS.cross060,'Cross 0.60m',p.cross060);
 label(ctx,'Cross 0.60: '+p.cross060+' مقاطع فالمخطط / '+p.cross060Stock+' بروفيل للشراء (قبل الاحتياط)',68,804,15,COLORS.sub,'left','600');
 label(ctx,'مقاطع أقل من 30cm: '+p.cross060HalfCount+' (كل جوج أنصاف = بروفيل واحد)',68,827,13,COLORS.sub,'left','600');
 ctx.restore();
}
