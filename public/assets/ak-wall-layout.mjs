/* ASSASSAT KHALI — geometric wall framing preview and rail cutting.
   This is a takeoff estimate, not an approved fire/acoustic/structural detail. */
const R=n=>Math.round((n+Number.EPSILON)*1e6)/1e6;
const EPS=1e-7;
export function wallLayout({L,H,doorW=0,doorH=0,doorX=.2,windowW=0,windowH=0,windowX,windowBottom=.9,spacing=.6}){
 const openings=[];
 const rect=(type,x,w,top,h)=>{
  if(!Number.isFinite(x)||x<0||x+w>L+EPS||top<0||top+h>H+EPS)throw Error('موضع '+(type==='door'?'الباب':'الشباك')+' خارج حدود الحائط.');
  return {type,x:R(x),top:R(top),w:R(w),h:R(h),right:R(x+w),bottom:R(top+h)};
 };
 if(doorW>0)openings.push(rect('door',doorX,doorW,H-doorH,doorH));
 if(windowW>0){
  const x=windowX===undefined?Math.max(0,L-windowW-.2):windowX;
  openings.push(rect('window',x,windowW,H-windowBottom-windowH,windowH));
 }
 if(openings.length===2){
  const [a,b]=openings;
  if(a.x<b.right-EPS&&b.x<a.right-EPS&&a.top<b.bottom-EPS&&b.top<a.bottom-EPS)
   throw Error('الباب والشباك متداخلين فالمخطط: بدل المسافة من بداية الحائط.');
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
 const door=openings.find(o=>o.type==='door');
 if(door){add('bottom',0,H,door.x,H);add('bottom',door.right,H,L,H);add('door-header',door.x,door.top,door.right,door.top);}
 else add('bottom',0,H,L,H);
 const win=openings.find(o=>o.type==='window');
 if(win){add('window-sill',win.x,win.bottom,win.right,win.bottom);add('window-header',win.x,win.top,win.right,win.top);}
 const pieces=[];
 for(const run of segments){let rem=run.length;while(rem>EPS){const n=R(Math.min(rem,3));pieces.push(n);rem=R(rem-n);}}
 const bars=[];
 for(const part of [...pieces].sort((a,b)=>b-a)){
  const fit=bars.find(bar=>bar.reduce((n,x)=>n+x,0)+part<=3+EPS);
  if(fit)fit.push(part);else bars.push([part]);
 }
 const railLinear=R(segments.reduce((s,r)=>s+r.length,0));
 return {openings,studPositions,reinforcements,railSegments:segments,railLinear,rails:bars.length,
  railCutPieces:pieces,railBars:bars,railJoins:pieces.length-segments.length,
  baseStuds:studPositions.length,extraStuds:reinforcements.length,studs:studPositions.length+reinforcements.length};
}
