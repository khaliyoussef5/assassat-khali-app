/* ASSASSAT KHALI — geometric Cloison framing preview / 3m rail cuts.
   The estimate is not an approved fire, acoustic or structural design.
   Canonical new input: openings:[{id,type:'door'|'window',x,w,h,bottom?}].
   Legacy single door/window inputs remain accepted for old integrations/tests.
*/
const R=n=>Math.round((n+Number.EPSILON)*1e6)/1e6;
const EPS=1e-7;
export function wallLayout({L,H,openings:entries,doorW=0,doorH=0,doorX=.2,windowW=0,windowH=0,windowX,windowBottom=.9,spacing=.6}){
 const provided=entries!==undefined;
 const raw=provided?entries:[
  ...(doorW>0?[{id:'door-legacy',type:'door',x:doorX,w:doorW,h:doorH}]:[]),
  ...(windowW>0?[{id:'window-legacy',type:'window',x:windowX===undefined?Math.max(0,L-windowW-.2):windowX,w:windowW,h:windowH,bottom:windowBottom}]:[])
 ];
 if(!Array.isArray(raw))throw Error('لائحة الفتحات غير صالحة.');
 const used=new Set(),openings=[];
 for(const [i,o] of raw.entries()){
  if(!o||!['door','window'].includes(o.type))throw Error('نوع الفتحة غير صالح.');
  const name=o.type==='door'?'الباب':'الشباك';
  const id=String(o.id??o.type+'-'+i);
  if(!/^[\w-]{1,64}$/.test(id)||used.has(id))throw Error('كل فتحة خاصها رقم تعريفي مختلف.');
  used.add(id);
  const x=Number(o.x),w=Number(o.w),h=Number(o.h);
  const bottom=o.type==='door'?0:Number(o.bottom??.9);
  const top=H-h-bottom;
  if(![x,w,h,bottom].every(Number.isFinite)||w<=0||h<=0||x<-EPS||bottom<-EPS||
    x+w>L+EPS||top<-EPS||h>H+EPS||bottom+h>H+EPS)
   throw Error('موضع أو مقاسات '+name+' خارج حدود الحائط.');
  openings.push({id,type:o.type,x:R(x),top:R(top),w:R(w),h:R(h),
    right:R(x+w),bottom:R(top+h),sill:R(bottom)});
 }
 for(let i=0;i<openings.length;i++)for(let j=i+1;j<openings.length;j++){
  const a=openings[i],b=openings[j];
  if(a.x<b.right-EPS&&b.x<a.right-EPS&&a.top<b.bottom-EPS&&b.top<a.bottom-EPS)
   throw Error('الفتحات متداخلين فالمخطط: حرّك الباب أو الشباك.');
 }
 const studPositions=[0];
 for(let x=spacing;x<L-EPS;x+=spacing)studPositions.push(R(x));
 if(Math.abs(studPositions.at(-1)-L)>EPS)studPositions.push(R(L));
 const reinforcements=openings.flatMap(o=>[R(o.x),R(o.right)]);
 const segments=[];
 const add=(kind,x1,y1,x2,y2)=>{
  const length=R(Math.hypot(x2-x1,y2-y1));if(length>EPS)segments.push({kind,x1:R(x1),y1:R(y1),x2:R(x2),y2:R(y2),length});
 };
 add('top',0,0,L,0);
 // Bottom rail is divided around EVERY door, not just the first.
 let start=0;
 for(const o of openings.filter(x=>x.type==='door').sort((a,b)=>a.x-b.x)){
  add('bottom',start,H,o.x,H);
  start=o.right;
 }
 add('bottom',start,H,L,H);
 for(const o of openings){
  if(o.type==='door')add('door-header',o.x,o.top,o.right,o.top);
  else{
   add('window-sill',o.x,o.bottom,o.right,o.bottom);
   add('window-header',o.x,o.top,o.right,o.top);
  }
 }
 const pieces=[];
 for(const run of segments){let rem=run.length;while(rem>EPS){const n=R(Math.min(rem,3));pieces.push(n);rem=R(rem-n);}}
 const bars=[];
 for(const part of [...pieces].sort((a,b)=>b-a)){
  const fit=bars.find(bar=>bar.reduce((n,x)=>n+x,0)+part<=3+EPS);
  if(fit)fit.push(part);else bars.push([part]);
 }
 const railLinear=R(segments.reduce((n,r)=>n+r.length,0));
 return {openings,studPositions,reinforcements,railSegments:segments,railLinear,rails:bars.length,
  railCutPieces:pieces,railBars:bars,railJoins:pieces.length-segments.length,
  baseStuds:studPositions.length,extraStuds:reinforcements.length,studs:studPositions.length+reinforcements.length};
}
