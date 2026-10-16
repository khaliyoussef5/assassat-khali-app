/* ASSASSAT KHALI — calculator logic. Geometry estimates require on-site verification. */
const EPS=1e-8;
export const round=(v,d=2)=>Number(v.toFixed(d));
const ceil=(x)=>Math.ceil(x-EPS);
const positive=(v,name)=>{const n=Number(v);if(!Number.isFinite(n)||n<=0)throw Error(`${name}: دخل قيمة صحيحة وأكبر من صفر.`);return n};
export function validateRoom(L,W){L=positive(L,'الطول');W=positive(W,'العرض');if(L<.6||W<.6||L>40||W>40||L*W>500)throw Error('القياسات خارج الحدود: 0.60–40m وبحد أقصى 500m². قسّم المساحة لمناطق.');return {L,W};}
function segmentLength(stock,linear){return ceil(linear/stock)}
export function tilesOptions(span){const max=Math.floor((span-EPS)/.6),arr=[];
 for(let full=max;full>=Math.max(0,max-2);full--){const cut=(span-.6*full)/2;if(cut>=-EPS&&cut<.6-EPS)arr.push({full,edge:Math.max(0,round(cut,4)),score:(cut<.25?.25-cut:0)+(cut===0?-.1:0)+(.6-cut)*.07})}
 // Exact multiples of 0.60m may have zero cut (best option) and a centered alternative.
 if(Math.abs(span/.6-Math.round(span/.6))<EPS){arr.unshift({full:Math.round(span/.6),edge:0,score:-1})}
 return [...new Map(arr.map(x=>[x.full,x])).values()].sort((a,b)=>a.score-b.score||b.full-a.full);
}
export function fullArmstrongOptions(L,W){
 const a=tilesOptions(L),b=tilesOptions(W);if(!a.length||!b.length)throw Error('الغرفة صغيرة بزاف لتوزيع 60×60.');
 const candidates=a.flatMap(x=>b.map(y=>({nL:x.full,nW:y.full,score:x.score+y.score})));
 candidates.sort((x,y)=>x.score-y.score||y.nL+y.nW-x.nL-x.nW);
 const first=candidates[0];
 // Alternative is the next best whole-grid combination; avoid changing both dimensions at once unnecessarily.
 const second=candidates.find(p=>(p.nL!==first.nL||p.nW!==first.nW)&&(p.nL===first.nL||p.nW===first.nW)) ||
              candidates.find(p=>p.nL!==first.nL||p.nW!==first.nW);
 return [{nL:first.nL,nW:first.nW},...(second?[{nL:second.nL,nW:second.nW}]:[])];
}
/** Geometry is the single source for both counted and drawn tees (metres). */
export function buildArmstrongGrid(L,W,lengthCuts,widthCuts){
 const positions=cuts=>{let x=0;return [0,...cuts.map(v=>{x+=v;return round(x,6)})]};
 const xLines=positions(lengthCuts),yLines=positions(widthCuts);
 const innerY=yLines.slice(1,-1);
 if(!innerY.length)throw Error('العرض صغير على شبكة Porteur القياسية. خاص توزيع خاص للحائط؛ ما يمكنش نحسبوه تلقائياً.');
 const mains=[];
 // Porteur follows the longitudinal direction on every second internal 60cm line.
 // Keep the last edge bay as one Cross 0.60 or one Cross 1.20, without an extra Porteur.
 // A shortened tee drawn at the wall still counts as one complete standard stock piece.
 for(let i=0;i<innerY.length;i+=2)mains.push(innerY[i]);
 const transverse=[];
 const add=(kind,x1,y1,x2,y2,placement)=>{
   const len=round(Math.hypot(x2-x1,y2-y1),6),stock=kind==='cross120'?1.2:.6;
   if(len<.0001||len>stock+EPS)throw Error('توزيع الشبكة غير صالح: قطعة Cross أكبر من طولها القياسي.');
   transverse.push({kind,x1:round(x1,6),y1:round(y1,6),x2:round(x2,6),y2:round(y2,6),length:len,cut:len<stock-EPS,placement});
 };
 // Cross-tees transverse between supports at every interior longitudinal cell boundary.
 const supports=[0,...mains,W];
 for(const x of xLines.slice(1,-1)){
   for(let i=0;i<supports.length-1;i++){
     const y0=supports[i],y1=supports[i+1],gap=y1-y0;
     if(gap>1.2+EPS)throw Error('تباعد Porteur أكثر من 1.20m.');
     if(gap<.0001)continue;
     const placement=(i===0||i===supports.length-2)?'to-wall':'between-porteurs';
     if(gap>.6+EPS)add('cross120',x,y0,x,y1,placement);
     else add('cross060',x,y0,x,y1,placement);
   }
 }
 // Split any bay over 60cm, including the final shortened bay to the wall.
 // Place Cross 0.60 exactly on the existing tile-grid line (not at an arbitrary midpoint).
 for(let i=0;i<supports.length-1;i++){
   const low=supports[i],high=supports[i+1],gap=high-low;
   if(gap>1.2+EPS)throw Error('تباعد الدعم أكثر من 1.20m.');
   if(gap>.6+EPS){
     const between=yLines.filter(v=>v>low+EPS&&v<high-EPS);
     if(between.length!==1)throw Error('توزيع الشبكة لا يتطابق مع فواصل بلاكات 60cm.');
     const middle=between[0];
     for(let j=0;j<xLines.length-1;j++)add('cross060',xLines[j],middle,xLines[j+1],middle,'infill');
   }
 }
 const c120=transverse.filter(v=>v.kind==='cross120');
 const c060=transverse.filter(v=>v.kind==='cross060');
 return {
  xLines,yLines,carrierPositions:mains,carrierCount:mains.length,
  crossSegments:transverse,cross120:c120.length,cross060:c060.length,
  cross120Cut:c120.filter(v=>v.cut).length,cross060Cut:c060.filter(v=>v.cut).length,
  cross120Full:c120.filter(v=>!v.cut).length,cross060Full:c060.filter(v=>!v.cut).length,
  rowIntersections:xLines.length-2,
  wall060:c060.filter(v=>v.placement==='to-wall').length,
  infill060:c060.filter(v=>v.placement==='infill').length,
  bay120:mains.slice(1).filter((p,i)=>Math.abs(p-mains[i]-1.2)<EPS).length,
  bay060:mains.slice(1).filter((p,i)=>Math.abs(p-mains[i]-.6)<EPS).length
 };
}
export function calcArmstrongFull(d){const {L,W}=validateRoom(d.L,d.W);const drop=positive(d.drop,'النزول'),cut=positive(d.cut,'طول قص Tige');
 if(drop<5||drop>120||cut>100)throw Error('النزول بين 5 و120cm، وقص Tige بين 1 و100cm.');
 const nL=Number(d.nL),nW=Number(d.nW);
 if(!Number.isInteger(nL)||!Number.isInteger(nW)||nL<0||nW<0)throw Error('عدد البلاكات الوسطية خاصو يكون عدد صحيح.');
 const edgeL=(L-.6*nL)/2, edgeW=(W-.6*nW)/2;
 if(edgeL< -EPS||edgeW< -EPS||edgeL>=.6-EPS||edgeW>=.6-EPS)throw Error('التقسيم غير صالح: القصّات خاصها تكون بين 0 و60cm.');
 const partsL=nL+(edgeL>EPS?2:0),partsW=nW+(edgeW>EPS?2:0);
 const rowsL=partsL,rowsW=partsW,wholeTiles=nL*nW,edgePieces=rowsL*rowsW-wholeTiles;
 const boundaryCuts=[edgeL>EPS?edgeL:0,...Array(nL).fill(.6),edgeL>EPS?edgeL:0].filter(x=>x>EPS);
 const widthCuts=[edgeW>EPS?edgeW:0,...Array(nW).fill(.6),edgeW>EPS?edgeW:0].filter(x=>x>EPS);
 // Conservative material upper bound: one new tile per cell; reuse of offcuts is not credited.
 const tiles=rowsL*rowsW,area=L*W;
 // Count exactly the Cross segments that the SVG draws.
 const grid=buildArmstrongGrid(L,W,boundaryCuts,widthCuts);
 const {carrierCount,carrierPositions:mains,cross120,cross060,rowIntersections}=grid;
 const porteur=carrierCount*ceil(L/3.6);
 const hangersPerCarrier=ceil(L/1);const hangers=carrierCount*hangersPerCarrier;
 const rodPieces=Math.floor((100+EPS)/cut);if(rodPieces<1)throw Error('طول قص Tige أكثر من متر.');
 const rods=ceil(hangers/rodPieces),perimeter=2*(L+W);
 return {type:'armstrong-full',L,W,drop,cut,nL,nW,edgeL:round(edgeL,5),edgeW:round(edgeW,5),partsL,partsW,wholeTiles,edgePieces,tiles,area,porteur,cross120,cross060,carrierCount,carrierPositions:mains,hangers,rods,rodPieces,angle:ceil(perimeter/3),wallFix:ceil(perimeter/.5),lengthCuts:boundaryCuts,widthCuts,perimeter,rowIntersections,lateralBays:carrierCount+1,
 ...grid,
 note:'كل قطعة Cross قصيرة فالرسم محسوبة كاملة فالشراء حسب النوع: أقل من 0.60m = Cross 0.60، وأكثر من 0.60m حتى 1.20m = Cross 1.20. ما كنزيدوش Porteur إضافي غير للفراغ الأخير. Cross 1.20 المقطوعة باتجاه الحائط وارتكازها على Cornière خاصهم تحقق من نظام المصنع قبل التنفيذ.'};
}
export function calcBA13Ceiling(d){const {L,W}=validateRoom(d.L,d.W);const type=d.mode==='hidden'?'hidden':'plain';const drop=positive(d.drop,'النزول');if(drop<6||drop>100)throw Error('النزول خاصو يكون بين 6 و100cm.');
 const first=.15,spacing=.50,span=Math.min(L,W),distribution=Math.max(L,W);
 const positions=[];for(let x=first;x<distribution-.04-EPS;x+=spacing)positions.push(round(x,4));
 if(!positions.length)positions.push(round(distribution/2,4));
 // Last profile near the end if the remaining unsupported band exceeds 25cm.
 if(distribution-positions.at(-1)>.25+EPS)positions.push(round(distribution-.10,4));
 const n=positions.length,profileRun=n*span,perimeter=2*(L+W),ledLen=type==='hidden'?perimeter:0;
 const perimeterExtra=type==='hidden'?perimeter:0; // 10cm setback Fourrure around LED perimeter
 const totalFourrure=profileRun+perimeterExtra;
 const fourrure=ceil(totalFourrure/3);
 const hangers=n*ceil(span/1);const suspensionRods=ceil(hangers/Math.floor(100/drop));
 const area=L*W,boards=ceil(area/(1.2*2.8)),cutBoards=ceil(boards*1.1);
 return {type:'ba13-ceiling',mode:type,L,W,drop,span,distribution,area,perimeter,ledLen,first,spacing,positions,profileRun,totalFourrure,perimeterExtra,
 fourrure,hangers,suspensionRods,angle:ceil(perimeter/3),wallFix:ceil(perimeter/.5),boards,cutBoards,vis:ceil(area*25),jointTape:ceil(area*.9),
 note:'Fourrure كل 50cm ابتداءً من 15cm، وفي الإنارة المخفية خط محيطي تقريبي على بعد 10cm من الحائط. مواقع وتعليق Fourrure وتفاصيل الجوانب والإنارة لازم تتراجع حسب النظام المعتمد.'};
}
export function calcWall(d){const L=positive(d.L,'طول الحائط'),H=positive(d.H,'الارتفاع');if(L<.5||L>40||H<1||H>4)throw Error('طول الحائط بين 0.5 و40m، والارتفاع بين 1 و4m.');
 const kind=['cloison','doublage','isolated'].includes(d.kind)?d.kind:'cloison';const layers=Number(d.layers)||1;
 if(![1,2].includes(layers))throw Error('عدد طبقات BA13 خاصو يكون 1 أو 2.');
 const spacing=Number(d.spacing)||.6;if(![.4,.6].includes(spacing))throw Error('اختار تباعد 40cm أو 60cm للـMontants.');
 const stock=Number(d.studLength)||3;if(![3,4].includes(stock)||H>stock+EPS)throw Error('اختار طول Montant كافي لارتفاع الحائط (3m أو 4m) بلا وصلات مرتجلة.');
 const doorW=Math.max(0,Number(d.doorW)||0),doorH=Math.max(0,Number(d.doorH)||0);
 const windowW=Math.max(0,Number(d.windowW)||0),windowH=Math.max(0,Number(d.windowH)||0);
 if(doorW>0&&(doorH<=0||doorH>H||doorW>=L))throw Error('أبعاد الباب غير مناسبة للحائط.');
 if(windowW>0&&(windowH<=0||windowH>H||windowW>=L))throw Error('أبعاد الشباك غير مناسبة للحائط.');
 if(doorW+windowW>=L)throw Error('مجموع عرض الفتحات كبير مقارنة بطول الحائط.');
 const doorArea=doorW*doorH,windowArea=windowW*windowH,area=L*H,netArea=area-doorArea-windowArea;
 if(netArea<=.01)throw Error('مساحة الحائط الصافية غير صالحة.');
 const faces=kind==='doublage'?1:2,boardArea=netArea*faces*layers;
 // Conservative: adds two side studs per opening and headers from Rails.
 const baseStuds=ceil(L/spacing)+1,openings=(doorW>0?1:0)+(windowW>0?1:0),studs=baseStuds+2*openings;
 const railLinear=2*L-doorW+doorW+(windowW>0?2*windowW:0); // top header replaces floor rail opening
 const rails=ceil(railLinear/3),montants=studs;
 const boards=ceil(boardArea/(1.2*2.8)),purchaseBoards=ceil(boards*1.1);
 const insulated=(kind==='isolated'||!!d.rockwool);const insulationArea=insulated?netArea:0;
 const woolUnits=insulated?ceil(insulationArea/.72):0;
 return {type:'wall',kind,L,H,area,netArea,faces,layers,spacing,stock,doorW,doorH,windowW,windowH,doorArea,windowArea,boardArea,studs,montants,railLinear,rails,boards,purchaseBoards,
 screwCount:ceil(boardArea*25),jointTape:ceil(netArea*faces*1.1),insulated,insulationArea,woolUnits,
 note:'حساب Rails/Montants والفتحات تقديري. تدعيم جنبات الأبواب والشبابيك، الوصلات، مقاومة الحريق والصوت ونظام العزل خاصها مراجعة تقنية قبل التنفيذ.'};
}
export function materials(p){const rows=[];const add=(name,qty,unit='قطعة',reserve=.05,why='')=>{const buy=Number.isInteger(qty)?Math.ceil(qty*(1+reserve)):round(qty*(1+reserve),2);rows.push({name,qty,unit,buy,why});};
 if(p.type==='armstrong-full'){
 add('بلاكات Armstrong 60×60 (قبل تحسين القصّات)',p.tiles,'بلاكة',.05,'كامل + مقطوع؛ تقدير متحفظ');
 add('Porteur T 3.60m',p.porteur,'قطعة',.1,'مع اتجاه طول الغرفة');
 add('Cross 1.20m',p.cross120,'قطعة',.1,`${p.cross120Full} بدون قص + ${p.cross120Cut} قصيرة ومقصوصة، وكل وحدة محسوبة بروفيل 1.20 كامل`);
 add('Cross 0.60m',p.cross060,'قطعة',.1,`${p.cross060Full} بدون قص + ${p.cross060Cut} قصيرة ومقصوصة، وكل وحدة محسوبة بروفيل 0.60 كامل`);
 add('Cornière محيطية 3m',p.angle,'قطعة',.1,'على الحائط فقط');
 add('Cheville laiton',p.hangers,'قطعة',.1);add('Coulisseau',p.hangers,'قطعة',.1);
 add('Tige 1m',p.rods,'قطعة',.1,`${p.rodPieces} قطع من كل Tige`);add('Cheville à frapper',p.wallFix,'قطعة',.15,'تقدير كل 50cm');
 } else if(p.type==='ba13-ceiling'){
 add('ألواح BA13 (1.20×2.80m)',p.boards,'لوح',.1,'تقدير بالمساحة');
 add('Fourrure 3m',p.fourrure,'قطعة',.12,'الطول الإجمالي النظري؛ راجع توزيع القص');
 add('Cornière galvanisée 3m',p.angle,'قطعة',.1);
 add('علاقات / نقاط التعليق',p.hangers,'نقطة',.1,'تقريبية حسب النظام');
 add('Tige 1m (للتعليق)',p.suspensionRods,'قطعة',.1,'وفق طول القص المبدئي = النزول');
 add('Cheville à frapper',p.wallFix,'قطعة',.15);
 add('Vis BA13',p.vis,'قطعة',.1,'تقدير حسب المساحة');add('Bande à joint',p.jointTape,'متر',.1,'تقدير أولي');
 if(p.mode==='hidden')add('طول فتحة LED المحيطية',round(p.ledLen,2),'متر',0,'إنارة وتجهيزاتها غير مشمولة');
 } else if(p.type==='wall'){
 add('ألواح BA13 (1.20×2.80m)',p.boards,'لوح',.1,'بحسب المساحة والطبقات');
 add(`Rails 3m`,p.rails,'قطعة',.12,'يشمل تقدير فتحة الباب والشباك');
 add(`Montants ${p.stock}m`,p.montants,'قطعة',.1,`${p.spacing*100}cm تباعد + دعم فتحات`);
 add('Vis BA13',p.screwCount,'قطعة',.1);add('Bande à joint',p.jointTape,'متر',.1);
 if(p.insulated){add('Rockwool تقدير عدد وحدات 0.60×1.20',p.woolUnits,'وحدة',.1,'تحقق من القياس والكثافة');}
 }
 return rows;
}
