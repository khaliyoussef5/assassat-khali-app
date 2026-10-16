/* Suspension layout only: draw the already-counted points on each longitudinal Porteur.
   Keeps the current stock calculation unchanged; approximate stations every <= 1m. */
export function suspensionPoints(p){
 if(p.type!=='armstrong-full')throw Error('Suspension layout only supports full Armstrong ceilings');
 const stations=Math.ceil(p.L-1e-8);
 const points=[];
 for(const y of p.carrierPositions){
  for(let i=0;i<stations;i++){
   points.push({x:Number((((i+.5)*p.L)/stations).toFixed(6)),y});
  }
 }
 if(points.length!==p.hangers)throw Error('عدد العلاقات فالرسم لا يوافق لائحة السلعة.');
 return points;
}
