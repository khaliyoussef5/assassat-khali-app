/* Cloison BA13 perimeter fixing estimate.
 * Cheville à frapper: at most 30cm between fasteners on ceiling and
 * FLOOR rails (the floor rail is interrupted at each door), plus the
 * first and last Montants fixed vertically to the adjacent side walls.
 * Door/window lintels and sills are not perimeter masonry fixings.
 * Endpoints are counted per physical rail/Montant run. The four
 * rail-to-Montant corner junctions have separate fixings.
 * This is takeoff only; validate substrate and fastener specification onsite.
 */
const R=n=>Math.round((n+Number.EPSILON)*1e6)/1e6;
const EPS=1e-7;
export function planCloisonFixings({L,H,railSegments,interval=.3}){
 if(!Number.isFinite(L)||L<=0||!Number.isFinite(H)||H<=0||
   !Number.isFinite(interval)||interval<=0||!Array.isArray(railSegments))
   throw Error('مقاسات تثبيت الحائط غير صالحة.');
 const countRun=length=>Math.ceil(length/interval-EPS)+1;
 const points=[];
 const addRun=(kind,x1,y1,x2,y2)=>{
  const length=Math.hypot(x2-x1,y2-y1);
  if(length<=EPS)return 0;
  const count=countRun(length);
  for(let i=0;i<count;i++){
   const t=i/(count-1);
   points.push({kind,x:R(x1+(x2-x1)*t),y:R(y1+(y2-y1)*t)});
  }
  return count;
 };
 let ceilingRail=0,floorRail=0;
 for(const r of railSegments){
  if(r.kind==='top')ceilingRail+=addRun('ceiling-rail',r.x1,r.y1,r.x2,r.y2);
  else if(r.kind==='bottom')floorRail+=addRun('floor-rail',r.x1,r.y1,r.x2,r.y2);
 }
 const firstMontant=addRun('first-montant',0,0,0,H);
 const lastMontant=addRun('last-montant',L,0,L,H);
 const railCount=ceilingRail+floorRail;
 const montantCount=firstMontant+lastMontant;
 return {interval,ceilingRail,floorRail,firstMontant,lastMontant,
  railCount,montantCount,count:railCount+montantCount,points};
}
