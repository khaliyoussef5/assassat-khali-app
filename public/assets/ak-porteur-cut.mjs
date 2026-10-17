/* ASSASSAT KHALI — sequential cutting of 3.60m Armstrong main runners.
 * An unused tail of a purchased bar is consumed at the start of the next
 * parallel Porteur run. Only the tail after the LAST run is final waste.
 * This is a material takeoff model: confirm connector compatibility and
 * minimum practical joined lengths with the selected ceiling system.
 */
export function planPorteurCuts(runLength,lineCount){
 if(!Number.isFinite(runLength)||runLength<=0||runLength>100)throw Error('طول Porteur غير صالح.');
 if(!Number.isInteger(lineCount)||lineCount<1||lineCount>200)throw Error('عدد خطوط Porteur غير صالح.');
 const scale=1e6,nominal=3600000,perLine=Math.round(runLength*scale);
 if(perLine<=0)throw Error('طول Porteur صغير بزاف.');
 let unused=0,bars=0,joinCount=0;
 const lines=[];
 for(let i=0;i<lineCount;i++){
  let missing=perLine;
  const cuts=[];
  while(missing>0){
   if(unused===0){bars++;unused=nominal;}
   const used=Math.min(missing,unused);
   cuts.push({bar:bars,length:used/scale,fromOffcut:cuts.length===0&&i>0&&unused<nominal});
   missing-=used;
   unused-=used;
  }
  joinCount+=cuts.length-1;
  lines.push({number:i+1,cuts,joints:cuts.length-1});
 }
 const installedLength=perLine*lineCount/scale;
 const waste=unused/scale;
 if(Math.abs(bars*3.6-installedLength-waste)>0.000001)throw Error('خطأ في توزيع قطع Porteur.');
 return {bars,installedLength,waste,joinCount,lines,stockLength:3.6};
}
