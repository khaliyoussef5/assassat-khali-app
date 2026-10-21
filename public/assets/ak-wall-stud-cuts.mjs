/* Cut plan for Cloison BA13 Montants, including 50cm splice sleeves.
 * Each vertical line is assembled from stock bars (normally 3m).
 * Every junction uses an ADDITIONAL 0.50m length of the same Montant stock.
 * The cutter pools offcuts across ALL lines; no 50cm pieces are bought twice.
 * This is material takeoff, not structural approval for taller partitions.
 */
const R=n=>Math.round((n+Number.EPSILON)*1e6)/1e6;
const EPS=1e-7;
export function planWallMontantCuts({height,count,stockLength=3,sleeveLength=.5}){
 if(!Number.isFinite(height)||height<=0||!Number.isSafeInteger(count)||count<1||
    !Number.isFinite(stockLength)||stockLength<=0||!Number.isFinite(sleeveLength)||sleeveLength<=0||sleeveLength>=stockLength)
  throw Error('معلومات قص Montants غير صالحة.');
 const segmentsPerLine=Math.max(1,Math.ceil(height/stockLength-EPS));
 const splicesPerLine=segmentsPerLine-1;
 const extensionHeight=R(Math.max(0,height-stockLength));
 const pieces=[],fullPerLine=Math.floor(height/stockLength+EPS);
 // Each line is a stock-length base with zero or more extensions,
 // and the connection sleeves are explicitly counted as consumed steel.
 for(let i=0;i<count;i++){
  let remaining=height;
  for(let k=0;k<segmentsPerLine;k++){
   const length=R(Math.min(stockLength,remaining));
   if(length>EPS)pieces.push({length,kind:k===0?'main':'extension',line:i});
   remaining=R(Math.max(0,remaining-length));
  }
  for(let k=0;k<splicesPerLine;k++)pieces.push({length:sleeveLength,kind:'sleeve',line:i});
 }
 const bars=[];
 const sorted=[...pieces].sort((a,b)=>b.length-a.length);
 for(const piece of sorted){
  let best=-1,bestRem=Infinity;
  for(let i=0;i<bars.length;i++){
   const leftover=stockLength-bars[i].reduce((s,c)=>s+c.length,0);
   if(leftover+EPS>=piece.length&&leftover-piece.length<bestRem){
    best=i;bestRem=leftover-piece.length;
   }
  }
  if(best===-1)bars.push([piece]);else bars[best].push(piece);
 }
 const totalUsed=R(pieces.reduce((n,c)=>n+c.length,0));
 const waste=R(bars.length*stockLength-totalUsed);
 return {
  lengthPerLine:height,stockLength,sleeveLength,count,
  segmentsPerLine,splicesPerLine,spliceCount:count*splicesPerLine,
  extensionHeight,extraTotalLength:R(count*extensionHeight),
  sleeveCount:count*splicesPerLine,sleeveTotalLength:R(count*splicesPerLine*sleeveLength),
  installedTotalLength:R(height*count),totalUsed,
  stockBars:bars.length,offcut:R(waste),
  pieces,bars,
  mainPieces:pieces.filter(p=>p.kind==='main').length,
  extensionPieces:pieces.filter(p=>p.kind==='extension').length
 };
}
