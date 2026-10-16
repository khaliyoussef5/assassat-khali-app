import {calcArmstrongFull,calcBA13Ceiling,calcWall,fullArmstrongOptions,materials,round} from './ak-engine.mjs';
const $=id=>document.getElementById(id),fmt=x=>Number(x).toLocaleString('fr-FR',{maximumFractionDigits:2}),escapeText=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const app=document.body.dataset.calculator;let approved=false,plan=null,chosen=0,options=[];
const names={'armstrong-full':'Armstrong بلا بوردور','ba13-ceiling':'سقف الجبص بورد BA13','walls':'الحوائط والعزل'};
const fields={
 'armstrong-full':[
 ['L','الطول (m)',8],['W','العرض (m)',4],['drop','النزول (cm)',30],['cut','طول قص Tige (cm)',30]
 ],'ba13-ceiling':[
 ['L','الطول (m)',8],['W','العرض (m)',4],['drop','النزول (cm)',30]
 ],'walls':[
 ['L','طول الحائط (m)',5],['H','ارتفاع الحائط (m)',2.8],['doorW','عرض الباب (m)',.9],['doorH','ارتفاع الباب (m)',2.1],['windowW','عرض الشباك (m)',0],['windowH','ارتفاع الشباك (m)',0]
 ]};
const headlines={
 'armstrong-full':{desc:'Armstrong على المساحة كاملة، بلا BA13. اختر توزيع البلاكات المقطوعة على حواف الغرفة.',icon:'▦'},
 'ba13-ceiling':{desc:'سقف عادي أو إنارة مخفية، مع توزيع Fourrure والألواح واللوازم التقديرية.',icon:'▤'},
 'walls':{desc:'Cloison وDoublage والعزل، مع حساب Rails وMontants وBA13 حسب الفتحات.',icon:'▥'}
};
if(!headlines[app])throw Error('Unknown calculator');
function coreMarkup(){return `
<header class="top"><div class="topin"><a class="identity" href="../../" aria-label="رجوع للواجهة الرئيسية"><span class="mark">AK</span><span>ASSASSAT KHALI <small style="display:block;font:500 9px Manrope,sans-serif;color:#69807d;letter-spacing:1px">OUTIL TECHNIQUE</small></span></a><a href="../../" class="back">← رجوع للحاسبات</a></div></header>
<main class="wrap">
<section class="hero"><div><span class="eyebrow">ASSASSAT KHALI / CALCULATEUR TECHNIQUE</span><h1>${names[app]}</h1><p>${headlines[app].desc}</p></div><div class="hero-mark" aria-hidden="true">${headlines[app].icon}</div></section>
<div class="stepguide" aria-label="خطوات الحاسبة"><span><b>01</b> القياسات</span><span><b>02</b> الاختيارات</span><span><b>03</b> المخطط</span><span><b>04</b> السلعة وPDF</span></div>
<section class="panel"><div class="panelheader"><span class="step">01</span><div><h2>قياسات المشروع</h2><p>دخل المقاسات الحقيقية قبل مراجعة المخطط.</p></div></div><div class="inputs" id="fields"></div><div class="hint"><b>مهم:</b> الكميات تقديرية للحصر المبدئي؛ خاص مراجعة النظام المعتمد والوصلات والتثبيت قبل الشراء والتنفيذ.</div></section>
<section class="panel"><div class="panelheader"><span class="step">02</span><div><h2 id="option-title">نوع التوزيع والاختيارات</h2><p id="option-subtitle">راجع الاختيارات أو بدّل القياسات.</p></div></div><div id="options"></div><div id="custom" class="custom" hidden></div></section>
<section class="panel"><div class="panelheader"><span class="step">03</span><div><h2>المخطط التفاعلي</h2><p>رسم تقريبي متناسب مع المقاسات والتوزيع المختار.</p></div></div><div class="summary" id="summary"></div><div class="plan" id="plan" role="img" aria-label="مخطط توزيع تقني"></div><div id="error" class="error" role="alert" hidden></div><div class="actions"><button type="button" id="approve" class="primary">اعتمد المخطط وحسب السلعة</button><button type="button" id="svg-download" class="secondary">تحميل المخطط SVG</button></div></section>
<section class="panel"><div class="panelheader"><span class="step">04</span><div><h2>لائحة السلعة</h2><p>كتبان من بعد ما تعتمد المخطط المختار.</p></div></div><div id="locked" class="locked">راجع المخطط أولاً، ومن بعد ضغط على «اعتمد المخطط وحسب السلعة».</div><div id="result" class="result" hidden><div class="bom" id="bom"></div><div class="actions"><button type="button" id="pdf-download" class="primary">تحميل لائحة السلعة + المخطط PDF</button><button type="button" id="csv-download" class="secondary">تحميل CSV</button><button type="button" id="print" class="secondary">طباعة</button></div><div id="note" class="smallprint"></div></div></section>
<p class="footer">ASSASSAT KHALI — حساب تقريبي وليس مخطط تنفيذ معتمد. راجع المواصفات التقنية ديال المصنع.</p>
</main>`;}
document.body.insertAdjacentHTML('afterbegin',coreMarkup());
for(const [id,label,val] of fields[app])$('fields').insertAdjacentHTML('beforeend',`<div class="formfield"><label for="in-${id}">${label}</label><input id="in-${id}" type="number" inputmode="decimal" step="0.01" min="0" value="${val}"></div>`);
const field=(id)=>Number($('in-'+id)?.value), raw=id=>$('in-'+id)?.value;
const metric=(lab,val)=>`<div class="metric"><small>${lab}</small><strong>${escapeText(val)}</strong></div>`;
const picker=(id,label,options)=>`<div class="formfield"><label for="in-${id}">${label}</label><select id="in-${id}">${options.map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select></div>`;
if(app==='ba13-ceiling')$('fields').insertAdjacentHTML('beforeend',picker('mode','نوع السقف',[['plain','سقف BA13 عادي'],['hidden','إنارة مخفية محيطية']]));
if(app==='walls')$('fields').insertAdjacentHTML('beforeend',[
 picker('kind','نوع الحائط',[['cloison','Cloison — وجهين BA13'],['doublage','Doublage — وجه واحد'],['isolated','Cloison + Rockwool']]),
 picker('layers','طبقات BA13 / وجه',[['1','طبقة واحدة'],['2','جوج طبقات']]),
 picker('spacing','تباعد Montants',[['0.6','60cm'],['0.4','40cm']]),
 picker('studLength','طول Montant',[['3','3m'],['4','4m']]),
 picker('rockwool','العزل Rockwool',[['0','بلا عزل'],['1','مع Rockwool']])
].join(''));
function dims(){let out={};for(const [id] of fields[app])out[id]=field(id);for(const id of ['mode','kind','layers','spacing','studLength','rockwool'])if($('in-'+id))out[id]=$('in-'+id).value;return out;}
function optionsUI(){
 if(app==='armstrong-full'){
   const d=dims();options=fullArmstrongOptions(d.L,d.W);
   $('option-title').textContent='اقتراحات توزيع Armstrong';
   $('option-subtitle').textContent='بلا بوردور BA13: البلاكات المقطوعة كتجي متوازنة فالأطراف.';
   let cards=options.map((o,i)=>{const a=(d.L-.6*o.nL)/2,b=(d.W-.6*o.nW)/2;
     return `<button type="button" class="choice ${chosen===i?'selected':''}" data-choice="${i}" aria-pressed="${chosen===i}"><b>الخيار ${i+1}</b><small>قصّات الطول / العرض</small><strong>${fmt(100*a)} / ${fmt(100*b)} cm</strong><small>وسط: ${o.nL} × ${o.nW} بلاكة</small></button>`;
   });
   cards.push(`<button type="button" class="choice ${chosen===2?'selected':''}" data-choice="2" aria-pressed="${chosen===2}"><b>الخيار 3 — يدوي</b><small>عدد البلاكات الكاملة فالوسط</small><strong>${raw('nL')||options[0].nL} × ${raw('nW')||options[0].nW}</strong><small>تعديل التوزيع يدوياً</small></button>`);
   $('options').innerHTML=`<div class="options">${cards.join('')}</div>`;
   if(!$('in-nL')){$('custom').innerHTML=`<div class="formfield"><label for="in-nL">بلاكات كاملة في الطول</label><input type="number" id="in-nL" step="1" value="${options[0].nL}"></div><div class="formfield"><label for="in-nW">بلاكات كاملة في العرض</label><input type="number" id="in-nW" step="1" value="${options[0].nW}"></div>`;
    $('custom').querySelectorAll('input').forEach(x=>x.addEventListener('input',refresh));}
   $('custom').hidden=chosen!==2;
   $('options').querySelectorAll('[data-choice]').forEach(x=>x.addEventListener('click',()=>{const id=Number(x.dataset.choice);if(id===2&&chosen!==2){const prev=options[Math.min(chosen,1)]||options[0];$('in-nL').value=prev.nL;$('in-nW').value=prev.nW;}chosen=id;refresh()}));
 }else{
   $('option-title').textContent=app==='ba13-ceiling'?'طريقة تركيب السقف':'إعدادات الحائط';
   $('option-subtitle').textContent='بدّل النوع، الطبقات والتباعد من الخانات الفوقانية؛ المخطط كيتحدّث تلقائياً.';
   const info=app==='ba13-ceiling'?'Fourrure: أول خط بعد 15cm، والباقي كل 50cm. إنارة مخفية: خط إضافي 10cm من الحيط.':'الفتحات كتخصم من المساحة. دعم الأبواب والشبابيك تقريبي ويتراجع فالموقع.';
   $('options').innerHTML=`<div class="hint">${info}</div>`;$('custom').hidden=true;
 }
}
function createModel(){let d=dims();if(app==='armstrong-full'){const o=chosen===2?{nL:field('nL'),nW:field('nW')}:options[chosen]||options[0];return calcArmstrongFull({...d,...o});}
 if(app==='ba13-ceiling')return calcBA13Ceiling(d);
 return calcWall({...d,rockwool:d.rockwool==='1'});
}
function sumSvg(p){const parts=app==='armstrong-full'?[['مساحة السقف',fmt(p.area)+'m²'],['Porteur',p.porteur],['Cross 1.20',p.cross120],['Cross 0.60',p.cross060],['بلاكات كاملة',p.wholeTiles],['بلاكات مقطوعة',p.edgePieces]]:
 app==='ba13-ceiling'?[['مساحة السقف',fmt(p.area)+'m²'],['عدد خطوط Fourrure',p.positions.length],['ألواح BA13 النظري',p.boards]]:
 [['صافي المساحة',fmt(p.netArea)+'m²'],['ألواح BA13 النظري',p.boards],['Montants',p.studs]];
 $('summary').innerHTML=parts.map(([a,b])=>metric(a,b)).join('');
}
const svgH=(p)=>{
 const W=900,H=540, sx=80,sy=72, ww=730,hh=385,fmt2=n=>round(n,2),A=[];
 let ratio=p.type==='wall'?p.L/p.H:p.L/p.W;
 let boxW=ww,boxH=hh;if(ratio>ww/hh)boxH=ww/ratio;else boxW=hh*ratio;
 const x=sx+(ww-boxW)/2,y=sy+(hh-boxH)/2;
 const g=(X,Y)=>[x+X/p.L*boxW,y+Y/(p.type==='wall'?p.H:p.W)*boxH];
 const rect=(a,b,c,d,fill,stroke='#80aea6',sw=1)=>`<rect x="${fmt2(a)}" y="${fmt2(b)}" width="${fmt2(c)}" height="${fmt2(d)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
 const line=(x1,y1,x2,y2,color='#70aea0',width=1)=>`<line x1="${fmt2(x1)}" y1="${fmt2(y1)}" x2="${fmt2(x2)}" y2="${fmt2(y2)}" stroke="${color}" stroke-width="${width}"/>`;
 A.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="مخطط ${names[app]}"><rect width="900" height="540" rx="16" fill="#f9fcfa"/>`);
 A.push(`<text x="450" y="40" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="#244a51">${escapeText(names[app])} — ASSASSAT KHALI</text>`);
 A.push(rect(x,y,boxW,boxH,'#f0f7f3','#244f56',2));
 if(p.type==='armstrong-full'){
  const C={porteur:'#2563a6',cross120:'#d97706',cross060:'#7c3aed'};
  for(let v of p.xLines.slice(1,-1)){const [xx]=g(v,0);A.push(line(xx,y,xx,y+boxH,'#cfddd8',1));}
  for(let v of p.yLines.slice(1,-1)){const [,yy]=g(0,v);A.push(line(x,yy,x+boxW,yy,'#cfddd8',1));}
  // Every tee is drawn in the solid color of its stock type, even when cut shorter.
  for(const v of p.crossSegments){
    const [x1,y1]=g(v.x1,v.y1),[x2,y2]=g(v.x2,v.y2);
    A.push('<line data-profile="'+v.kind+'" data-cut="'+(v.cut?'yes':'no')+'" x1="'+fmt2(x1)+'" y1="'+fmt2(y1)+'" x2="'+fmt2(x2)+'" y2="'+fmt2(y2)+'" stroke="'+C[v.kind]+'" stroke-width="'+(v.kind==='cross120'?3.4:2.8)+'" stroke-linecap="butt"/>');
  }
  for(const v of p.carrierPositions){const [,yy]=g(0,v);
    A.push('<line data-profile="porteur" x1="'+fmt2(x)+'" y1="'+fmt2(yy)+'" x2="'+fmt2(x+boxW)+'" y2="'+fmt2(yy)+'" stroke="'+C.porteur+'" stroke-width="4.4"/>');
  }
  A.push('<g font-family="Arial,Tahoma,sans-serif" font-size="15" font-weight="700" direction="ltr">'+
    '<line x1="82" y1="479" x2="121" y2="479" stroke="'+C.porteur+'" stroke-width="4.5"/><text x="135" y="484" fill="#254653">Porteur T × '+p.porteur+'</text>'+
    '<line x1="330" y1="479" x2="368" y2="479" stroke="'+C.cross120+'" stroke-width="4"/><text x="381" y="484" fill="#254653">Cross 1.20 × '+p.cross120+'</text>'+
    '<line x1="618" y1="479" x2="658" y2="479" stroke="'+C.cross060+'" stroke-width="4"/><text x="671" y="484" fill="#254653">Cross 0.60 × '+p.cross060+'</text>'+
    '<text x="82" y="509" fill="#415f62" font-size="13">كل قاطع قصير محسوب قطعة كاملة • مقصوصة: 1.20 × '+p.cross120Cut+' و 0.60 × '+p.cross060Cut+'</text></g>');
 }else if(p.type==='ba13-ceiling'){
  const dirL=p.L>=p.W;
  if(p.mode==='hidden'){const inset=Math.min(.1,p.L/4,p.W/4);let [px,py]=g(inset,inset),[qx,qy]=g(p.L-inset,p.W-inset);A.push(rect(px,py,qx-px,qy-py,'none','#df9d4e',4));}
  for(const v of p.positions){if(dirL){const [px,py]=g(v,0);A.push(line(px,y,px,y+boxH,'#397f9c',2.3));}else {const [px,py]=g(0,v);A.push(line(x,py,x+boxW,py,'#397f9c',2.3));}}
  A.push(`<text x="450" y="500" text-anchor="middle" font-family="Tahoma,Arial" font-size="14" fill="#415f62">Fourrure كل 50cm • أول خط 15cm • ${p.mode==='hidden'?'مع LED محيطي':'سقف عادي'}</text>`);
 }else{
  for(let pos=0;pos<=p.L+.001;pos+=p.spacing){let [xx]=g(pos,0);A.push(line(xx,y,xx,y+boxH,'#42819c',2));}
  const baseDoor=0.2;
  if(p.doorW>0){const [ax,ay]=g(baseDoor,p.H-p.doorH),[bx,by]=g(baseDoor+p.doorW,p.H);A.push(rect(ax,ay,bx-ax,by-ay,'#fff','#d39c61',3));}
  if(p.windowW>0){const wx=p.L-p.windowW-.2,wy=(p.H-p.windowH)/2;const [ax,ay]=g(wx,wy),[bx,by]=g(wx+p.windowW,wy+p.windowH);A.push(rect(ax,ay,bx-ax,by-ay,'#fff','#c69a5d',3));}
  A.push(`<text x="450" y="500" text-anchor="middle" font-family="Tahoma,Arial" font-size="15" fill="#415f62">Montants كل ${fmt(p.spacing*100)} cm • ${p.faces} وجه • ${p.layers} طبقة/وجه</text>`);
 }
 A.push(`<text x="${fmt2(x+boxW/2)}" y="${fmt2(y-17)}" fill="#315d63" text-anchor="middle" font-family="Arial" font-size="16">${fmt(p.L)} m</text>`);
 A.push(`<text x="${fmt2(x-20)}" y="${fmt2(y+boxH/2)}" fill="#315d63" text-anchor="middle" font-family="Arial" font-size="15" transform="rotate(-90 ${fmt2(x-20)} ${fmt2(y+boxH/2)})">${fmt(p.type==='wall'?p.H:p.W)} m</text>`);
 A.push('</svg>');return A.join('');
};
function showError(e){$('error').textContent=e.message||String(e);$('error').hidden=false;$('approve').disabled=true;$('svg-download').disabled=true;$('plan').innerHTML='<div class="locked">صلّح القياسات باش يظهر المخطط.</div>';$('summary').innerHTML='';}
function invalidate(){approved=false;$('result').hidden=true;$('locked').hidden=false;}
function refresh(){invalidate();$('error').hidden=true;try{optionsUI();plan=createModel();sumSvg(plan);$('plan').innerHTML=svgH(plan);$('approve').disabled=false;$('svg-download').disabled=false;}catch(e){plan=null;showError(e)}}
function save(filename,blob){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2500)}
function renderBom(p){const rows=materials(p);let table='<table><thead><tr><th>المادة</th><th>المحسوب</th><th>الشراء المقترح</th></tr></thead><tbody>';
 for(const r of rows)table+=`<tr><td><b>${escapeText(r.name)}</b><div class="note">${escapeText(r.why||'')}</div></td><td class="qty">${fmt(r.qty)} ${escapeText(r.unit)}</td><td class="qty buy">${fmt(r.buy)} ${escapeText(r.unit)}</td></tr>`;
 $('bom').innerHTML=table+'</tbody></table>';$('note').textContent=p.note;
}
$('approve').addEventListener('click',()=>{if(!plan)return;approved=true;renderBom(plan);$('locked').hidden=true;$('result').hidden=false;$('result').scrollIntoView({behavior:'smooth',block:'start'})});
$('svg-download').addEventListener('click',()=>{if(plan)save(`ASSASSAT-KHALI_${app}_PLAN.svg`,new Blob([svgH(plan)],{type:'image/svg+xml;charset=utf-8'}))});
$('csv-download').addEventListener('click',()=>{if(!approved||!plan)return;let rows=materials(plan);let csv='\uFEFFالمادة;المحسوب;الوحدة;الشراء المقترح;ملاحظات\r\n'+rows.map(r=>[r.name,r.qty,r.unit,r.buy,r.why].map(x=>`"${String(x).replaceAll('"','""')}"`).join(';')).join('\r\n');save(`ASSASSAT-KHALI_${app}_MATERIALS.csv`,new Blob([csv],{type:'text/csv;charset=utf-8'}))});
$('print').addEventListener('click',()=>window.print());
$('pdf-download').addEventListener('click',async()=>{if(!approved||!plan)return;const b=$('pdf-download');b.disabled=true;const old=b.textContent;b.textContent='جاري إنشاء PDF...';try{const blob=await createPdf(plan);save(`ASSASSAT-KHALI_${app}_MATERIALS_PLAN.pdf`,blob)}catch(e){alert('تعذر إنشاء PDF: '+e.message)}finally{b.disabled=false;b.textContent=old}});
for(const el of $('fields').querySelectorAll('input,select'))el.addEventListener('input',()=>{if(app==='armstrong-full')chosen=0;refresh()});
async function createPdf(p){const rows=materials(p),W=1240,H=1754;
 const page=document.createElement('canvas');page.width=W;page.height=H;const g=page.getContext('2d');if(!g)throw Error('المتصفح لا يدعم canvas');
 const planCanvas=document.createElement('canvas');planCanvas.width=W;planCanvas.height=H;const z=planCanvas.getContext('2d');if(!z)throw Error('المتصفح لا يدعم canvas');
 function base(ctx,title,num){ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);ctx.fillStyle='#14333a';ctx.fillRect(0,0,W,190);ctx.fillStyle='#0f8977';ctx.fillRect(0,185,W,6);text(ctx,'ASSASSAT KHALI',78,82,35,'#cee9dd',800,'left');text(ctx,title,1163,108,42,'#fff',800);text(ctx,names[app],1163,156,22,'#bedad5',500);
 ctx.fillStyle='#dce7e3';ctx.fillRect(76,H-104,1090,2);text(ctx,'ASSASSAT KHALI · OUTIL TECHNIQUE',76,H-62,21,'#70858a',700,'left');text(ctx,`${num} / 2`,1163,H-62,24,'#70858a',600)}
 function text(ctx,v,x,y,size=25,color='#243f47',weight=500,align='right'){ctx.font=`${weight} ${size}px Tahoma,Arial,sans-serif`;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.direction=align==='left'?'ltr':'rtl';ctx.fillStyle=color;ctx.fillText(String(v),x,y)}
 function box(ctx,x,y,w,h,bg){ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(x,y,w,h,14);ctx.fill()}
 base(g,'لائحة السلعة',1);box(g,76,220,1088,122,'#e8f4ed');text(g,app==='walls'?`الحائط: ${fmt(p.L)} × ${fmt(p.H)} m`:`السقف: ${fmt(p.L)} × ${fmt(p.W)} m`,1127,275,31,'#204951',800);
 text(g,`مساحة العمل: ${fmt(p.type==='wall'?p.netArea:p.area)} m²`,1127,318,24,'#477478',600);
 box(g,76,370,1088,69,'#1d5a5b');text(g,'المادة',1123,413,25,'#fff',800);text(g,'محسوب',540,413,24,'#fff',800);text(g,'الشراء',268,413,24,'#fff',800);
 const rowH=74;let off=439;rows.forEach((r,i)=>{const y=off+i*rowH;if(i%2===0){g.fillStyle='#f3f9f5';g.fillRect(76,y,1088,rowH)}g.fillStyle='#e2ebe8';g.fillRect(76,y+rowH-1,1088,1);text(g,r.name,1127,y+35,21,'#1c4148',700);if(r.why)text(g,r.why,1127,y+63,16,'#718489',400);text(g,`${fmt(r.qty)} ${r.unit}`,550,y+46,23,'#23545b',700);text(g,`${fmt(r.buy)} ${r.unit}`,266,y+46,24,'#167762',800);});
 const noteY=Math.min(off+rows.length*rowH+32,H-282);box(g,76,noteY,1088,155,'#fff4e4');text(g,'تنبيه مهم',1127,noteY+41,26,'#976822',800);
 const note='الكميات تقديرية وتحتاج مراجعة التوزيع، الوصلات ونظام التثبيت بالموقع.';text(g,note,1127,noteY+86,21,'#866325',500);text(g,'اعتمد المقاسات النهائية قبل شراء السلعة.',1127,noteY+124,21,'#866325',500);
 base(z,'المخطط التقني',2);box(z,76,218,1088,112,'#e8f4ed');text(z,`القياسات: ${fmt(p.L)} × ${fmt(p.type==='wall'?p.H:p.W)} m`,1124,269,30,'#23535b',800);text(z,`${names[app]} — رسم توضيحي`,1124,309,23,'#58777d',600);
 box(z,76,353,1088,830,'#f5f9f7');const svg=svgH(p),img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('تعذر تحميل صورة المخطط'));img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)});
 z.drawImage(img,80,420,1080,650);box(z,76,1235,1088,210,'#f3f8f5');text(z,'ملاحظات المخطط',1127,1290,30,'#21474c',800);
 const words=p.note.match(/.{1,73}(?:\s|$)/g)||[p.note];words.slice(0,3).forEach((line,i)=>text(z,line.trim(),1127,1330+i*40,21,'#527174',500));
 box(z,76,1490,1088,100,'#fff4e5');text(z,'المخطط توضيحي وليس مخططاً إنشائياً معتمداً.',1124,1548,23,'#8b6227',700);
 function jpeg(c){const raw=atob(c.toDataURL('image/jpeg',.94).split(',')[1]);return Uint8Array.from(raw,x=>x.charCodeAt(0))}
 const images=[jpeg(page),jpeg(planCanvas)],enc=new TextEncoder(),chunks=[];let len=0,offsets=[0];const put=v=>{const b=typeof v==='string'?enc.encode(v):v;chunks.push(b);len+=b.length};const object=(id,fn)=>{offsets[id]=len;put(`${id} 0 obj\n`);fn();put('\nendobj\n')};
 put('%PDF-1.4\n%AKPDF\n');object(1,()=>put('<< /Type /Catalog /Pages 2 0 R >>'));object(2,()=>put('<< /Type /Pages /Kids [3 0 R 6 0 R] /Count 2 >>'));
 images.forEach((b,i)=>{const id=3+i*3;object(id,()=>put(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 ${id+1} 0 R >> >> /Contents ${id+2} 0 R >>`));object(id+1,()=>{put(`<< /Type /XObject /Subtype /Image /Width ${W} /Height ${H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${b.length} >>\nstream\n`);put(b);put('\nendstream')});const stream='q\n595.28 0 0 841.89 0 0 cm\n/Im0 Do\nQ\n';object(id+2,()=>{put(`<< /Length ${enc.encode(stream).length} >>\nstream\n${stream}endstream`)});});
 const xref=len;put('xref\n0 9\n0000000000 65535 f \n');for(let i=1;i<=8;i++)put(String(offsets[i]).padStart(10,'0')+' 00000 n \n');put(`trailer\n<< /Size 9 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);return new Blob(chunks,{type:'application/pdf'});
}
refresh();
