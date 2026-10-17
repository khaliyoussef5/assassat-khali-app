/* ASSASSAT KHALI — BA13 ceiling geometry / preliminary takeoff.
   All coordinates are metres. Physical support details must be approved on-site. */
const R=v=>Math.round((v+Number.EPSILON)*1e6)/1e6;
const EPS=1e-7;
export function ba13Layout(L,W,mode='plain'){
 if(!Number.isFinite(L)||!Number.isFinite(W)||L<.6||W<.6)throw Error('قياسات سقف BA13 غير صالحة.');
 const hidden=mode==='hidden';
 const span=Math.min(L,W),distribution=Math.max(L,W);
 const axis=L>=W?'x':'y'; // profiles travel along the SHORT room dimension.
 const positions=[];
 for(let v=.15;v<distribution-.04-EPS;v+=.5)positions.push(R(v));
 if(!positions.length)positions.push(R(distribution/2));
 if(distribution-positions.at(-1)>.25+EPS){
  const end=R(distribution-.10);
  if(end-positions.at(-1)>.03)positions.push(end);
 }
 const lines=positions.map(at=>axis==='x'?{x1:at,y1:0,x2:at,y2:W,kind:'main'}:
                                                    {x1:0,y1:at,x2:L,y2:at,kind:'main'});
 const inset=.10,ringLength=hidden?2*((L-2*inset)+(W-2*inset)):0;
 const ring=hidden?[
  {x1:inset,y1:inset,x2:L-inset,y2:inset,kind:'led-support'},
  {x1:L-inset,y1:inset,x2:L-inset,y2:W-inset,kind:'led-support'},
  {x1:L-inset,y1:W-inset,x2:inset,y2:W-inset,kind:'led-support'},
  {x1:inset,y1:W-inset,x2:inset,y2:inset,kind:'led-support'}
 ]:[];
 const all=[...lines,...ring];
 const profileRun=R(lines.length*span),perimeterExtra=R(ringLength),totalFourrure=R(profileRun+perimeterExtra);
 // Cutting schedule: individual uninterrupted runs are split into <=3m pieces.
 // Offcuts from other runs may be reused, when actual site joining permits.
 const cutPieces=[];
 for(const run of all){
  const length=R(Math.hypot(run.x2-run.x1,run.y2-run.y1));
  let left=length;
  while(left>EPS){let piece=R(Math.min(3,left));cutPieces.push(piece);left=R(left-piece);}
 }
 // First-fit decreasing: a reproducible feasible allocation into 3m stock bars.
 const stockBars=[];
 for(const piece of [...cutPieces].sort((a,b)=>b-a)){
  const bin=stockBars.find(items=>R(items.reduce((acc,v)=>acc+v,0)+piece)<=3+EPS);
  if(bin)bin.push(piece);else stockBars.push([piece]);
 }
 const stations=(run)=>{
  const length=Math.hypot(run.x2-run.x1,run.y2-run.y1),n=Math.max(1,Math.ceil(length-EPS));
  return Array.from({length:n},(_,i)=>{
   const t=(i+.5)/n;
   return {x:R(run.x1+(run.x2-run.x1)*t),y:R(run.y1+(run.y2-run.y1)*t),kind:run.kind};
  });
 };
 const hangerPoints=all.flatMap(stations);
 const cutWastage=R(stockBars.length*3-totalFourrure);
 return {span,distribution,axis,positions,lines,ring,inset,ringLength:R(ringLength),profileRun,perimeterExtra,totalFourrure,
  runCount:all.length,hangerPoints,cutPieces,cutCount:cutPieces.length,joinCount:cutPieces.length-all.length,
  stockBars:stockBars.length,stockBarAllocation:stockBars,cutWastage};
}
