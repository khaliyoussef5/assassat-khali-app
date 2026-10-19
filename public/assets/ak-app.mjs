import {calcArmstrongFull,calcBA13Ceiling,calcWall,fullArmstrongOptions,materials,round} from './ak-engine.mjs';
import {armstrongFullPlanSvg} from './ak-armstrong-plan.mjs';
import {drawArmstrongPrintPage} from './ak-pdf-print.mjs';
import {ba13PlanSvg} from './ak-ba13-plan.mjs';
import {drawBA13PrintPage} from './ak-ba13-print.mjs';
import {wallPlanSvg} from './ak-wall-plan.mjs';
import {initWallOpenings} from './ak-wall-interactions.mjs';
import {drawWallPrintPage} from './ak-wall-print.mjs';
const $=id=>document.getElementById(id),fmt=x=>Number(x).toLocaleString('fr-FR',{maximumFractionDigits:2}),escapeText=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const app=document.body.dataset.calculator;let approved=false,plan=null,chosen=0,options=[],showHangers=true,wallControls=null;
const names={'armstrong-full':'Armstrong بلا بوردور','ba13-ceiling':'سقف الجبص بورد BA13','walls':'Cloison BA13 — الحائط الفاصل'};
const fields={
 'armstrong-full':[
 ['L','الطول (m)',8],['W','العرض (m)',4]
 ],'ba13-ceiling':[
 ['L','الطول (m)',8],['W','العرض (m)',4],['drop','النزول (cm)',30]
 ],'walls':[
 ['L','طول الحائط (m)',5],['H','ارتفاع الحائط (m)',2.8]
 ]};
const headlines={
 'armstrong-full':{desc:'Armstrong على المساحة كاملة، بلا BA13. اختر توزيع البلاكات المقطوعة على حواف الغرفة.',icon:'<svg viewBox="0 0 46 46" fill="none" aria-hidden="true"><rect x="4" y="7" width="38" height="30" rx="3" stroke-width="2"/><path d="M16.7 7v30M29.3 7v30M4 17h38M4 27h38" stroke-width="1.5"/><path d="M4 37l5 5h28l5-5" stroke="#6BBDAF" stroke-width="1.5"/></svg>'},
 'ba13-ceiling':{desc:'سقف عادي أو إنارة مخفية، مع توزيع Fourrure والألواح واللوازم التقديرية.',icon:'<svg viewBox="0 0 46 46" fill="none" aria-hidden="true"><rect x="5" y="8" width="36" height="28" rx="3" stroke-width="2"/><path d="M5 17h36M14 8v28M32 8v28M5 27h36" stroke-width="1.5"/></svg>'},
 'walls':{desc:'حساب Cloison BA13 بوجهين: Rails وMontants والألواح مع الباب والشباك.',icon:'<svg viewBox="0 0 46 46" fill="none" aria-hidden="true"><rect x="7" y="5" width="32" height="36" rx="2" stroke-width="2"/><path d="M18 5v36M29 5v36M7 18h32M7 29h32" stroke-width="1.5"/></svg>'}
};
if(!headlines[app])throw Error('Unknown calculator');
function coreMarkup(){return `
<nav class="ak-calculator-nav" aria-label="التنقل بين الحاسبات"><a class="ak-calculator-nav__home" href="../../" aria-label="الرئيسية ASSASSAT KHALI"><img src="../../assets/logo-assassat-khali.webp" alt="" width="34" height="36"><span>ASSASSAT KHALI<small>OUTIL TECHNIQUE</small></span></a><a class="ak-calculator-nav__back" href="../../">← رجوع للحاسبات</a></nav>
<main class="wrap">
<section class="hero"><div><span class="eyebrow">ASSASSAT KHALI / CALCULATEUR TECHNIQUE</span><h1>${names[app]}</h1><p>${headlines[app].desc}</p></div><div class="hero-mark" aria-hidden="true">${headlines[app].icon}</div></section>
<div class="stepguide" aria-label="خطوات الحاسبة"><span><b>01</b> القياسات</span><span><b>02</b> الاختيارات</span><span><b>03</b> المخطط</span><span><b>04</b> السلعة وPDF</span></div>
<section class="panel"><div class="panelheader"><span class="step">01</span><div><h2>قياسات المشروع</h2><p>دخل المقاسات الحقيقية قبل مراجعة المخطط.</p></div></div><div class="inputs" id="fields"></div><div class="hint"><b>مهم:</b> الكميات تقديرية للحصر المبدئي؛ خاص مراجعة النظام المعتمد والوصلات والتثبيت قبل الشراء والتنفيذ.</div></section>
<section class="panel"><div class="panelheader"><span class="step">02</span><div><h2 id="option-title">نوع التوزيع والاختيارات</h2><p id="option-subtitle">راجع الاختيارات أو بدّل القياسات.</p></div></div><div id="options"></div><div id="option-drop" class="option-drop" hidden></div><div id="custom" class="custom" hidden></div></section>
<section class="panel"><div class="panelheader"><span class="step">03</span><div><h2>المخطط التفاعلي</h2><p>رسم تقريبي متناسب مع المقاسات والتوزيع المختار.</p></div></div><div class="plan" id="plan" role="img" aria-label="مخطط توزيع تقني"></div><div class="summary" id="summary"></div><div id="error" class="error" role="alert" hidden></div><div class="actions"><button type="button" id="approve" class="primary">اعتمد المخطط وحسب السلعة</button><button type="button" id="svg-download" class="secondary">تحميل المخطط SVG</button></div></section>
<section class="panel"><div class="panelheader"><span class="step">04</span><div><h2>لائحة السلعة</h2><p>كتبان من بعد ما تعتمد المخطط المختار.</p></div></div><div id="locked" class="locked">راجع المخطط أولاً، ومن بعد ضغط على «اعتمد المخطط وحسب السلعة».</div><div id="result" class="result" hidden><div class="bom" id="bom"></div><div class="actions"><button type="button" id="pdf-download" class="primary">تحميل لائحة السلعة + المخطط PDF</button><button type="button" id="csv-download" class="secondary">تحميل CSV</button><button type="button" id="print" class="secondary">طباعة</button></div><div id="note" class="smallprint"></div></div></section>
<p class="footer">ASSASSAT KHALI — حساب تقريبي وليس مخطط تنفيذ معتمد. راجع المواصفات التقنية ديال المصنع.</p>
</main>`;}
document.body.insertAdjacentHTML('afterbegin',coreMarkup());
/* For borderless Armstrong only, preserve the approved order while leaving
 * development-only calculators' DOM and engines untouched. */
if(app==='armstrong-full'){
 document.body.classList.add('ak-full-flow');
 const panels=[...document.querySelectorAll('main.wrap > section.panel')];
 if(panels.length!==4)throw Error('Armstrong layout unavailable');
 const [dimensions,choices,drawing,result]=panels;
 dimensions.after(drawing);
 dimensions.querySelector('.panelheader p').textContent='دخل الطول والعرض ونزول السقف المستعار؛ المخطط كيتحدّث مباشرة.';
 dimensions.querySelector('.hint').remove();
 drawing.querySelector('.step').textContent='02';
 choices.querySelector('.step').textContent='03';
 drawing.querySelector('.panelheader p').remove();

 drawing.querySelector('#plan').insertAdjacentHTML('afterend',[
  '<div class="ak-full-legend" aria-label="ألوان بروفيلات المخطط">',
  '<span><i style="background:#1F5D9F"></i>Porteur 3.60</span>',
  '<span><i style="background:#D59428"></i>Cross 1.20</span>',
  '<span><i style="background:#219A7C"></i>Cross 0.60</span>',
  '<span><i style="background:#E0F1EB;height:12px;width:12px;border:1px solid #AE885B"></i>بلاكات مقطوعة</span>',
  '<span><i style="background:#233A44;height:10px;width:10px;border-radius:50%"></i>علاقة</span>',
  '</div>'
 ].join(''));
 const approve=document.getElementById('approve');
 choices.append(approve);approve.classList.add('ak-full-approve');
 document.getElementById('svg-download').remove();
 drawing.querySelector('.actions').remove();
 result.querySelector('#csv-download').remove();
 result.querySelector('#print').remove();
 result.querySelector('#note').remove();
 document.getElementById('option-drop').remove();
 const copy=document.createElement('button');
 copy.type='button';copy.id='copy-materials';copy.className='secondary';copy.textContent='نسخ القائمة';
 result.querySelector('#result .actions').append(copy);
 const pdf=document.getElementById('pdf-download');
 pdf.textContent='تحميل لائحة المواد + المخطط PDF';
 pdf.classList.add('ak-full-pdf');
 result.classList.add('ak-armstrong-full-results');
 const dropField=document.createElement('div');
 dropField.className='formfield';
 dropField.innerHTML='<label for="in-drop">نزول السقف المستعار (cm)</label><input id="in-drop" type="number" inputmode="decimal" min="5" max="100" step="1" value="30">';
 document.getElementById('fields').append(dropField);
 dimensions.insertAdjacentHTML('beforeend','<p class="ak-full-measurement-note">عدد Tige كيتحسب حسب النزول كتقدير أولي. تأكد من طول القص الفعلي فالورش قبل القطع.</p>');
}

if(app==='armstrong-full'||app==='ba13-ceiling'){
 $('summary').insertAdjacentHTML('afterend','<label class="ak-hanger-toggle" for="show-hangers"><input type="checkbox" id="show-hangers" checked><span class="ak-hanger-icon" aria-hidden="true">●</span><span><strong>إظهار العلاقات فالمخطط</strong><small>نقط التعليق على Porteur، تقريباً كل 1m</small></span></label>');
 $('show-hangers').addEventListener('change',event=>{showHangers=event.target.checked;if(plan)$('plan').innerHTML=svgH(plan);});
}
for(const [id,label,val] of fields[app])$('fields').insertAdjacentHTML('beforeend',`<div class="formfield"><label for="in-${id}">${label}</label><input id="in-${id}" type="number" inputmode="decimal" step="0.01" min="0" value="${val}"></div>`);
if(app==='armstrong-full')$('in-drop').addEventListener('input',refresh);
const field=(id)=>Number($('in-'+id)?.value), raw=id=>$('in-'+id)?.value;
const metric=(lab,val)=>`<div class="metric"><small>${lab}</small><strong>${escapeText(val)}</strong></div>`;
const picker=(id,label,options)=>`<div class="formfield"><label for="in-${id}">${label}</label><select id="in-${id}">${options.map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select></div>`;
if(app==='ba13-ceiling')$('fields').insertAdjacentHTML('beforeend',picker('mode','نوع السقف',[['plain','سقف BA13 عادي'],['hidden','إنارة مخفية محيطية']]));
if(app==='walls')$('fields').insertAdjacentHTML('beforeend',[
 picker('layers','طبقات BA13 / وجه',[['1','طبقة واحدة'],['2','جوج طبقات']]),
 picker('spacing','تباعد Montants',[['0.6','60cm'],['0.4','40cm']])
].join(''));

/* Wall calculator preview: same approved sequence as Armstrong.
 * Scope this to the walls app; the published /calculators/walls/ stays locked. */
if(app==='walls'){
 document.body.classList.add('ak-walls-flow');
 const panels=[...document.querySelectorAll('main.wrap > section.panel')];
 if(panels.length!==4)throw Error('Wall layout unavailable');
 const [dimensions,choices,drawing,results]=panels;
 dimensions.after(drawing);
 dimensions.querySelector('.panelheader p').textContent='الحائط بلا فتحات افتراضياً. أضف الباب أو النافذة وحدد المقاسات هنا، وحرّكها داخل المخطط.';
 drawing.querySelector('.step').textContent='02';
 choices.querySelector('.step').textContent='03';
 drawing.querySelector('.panelheader p').remove();
 choices.querySelector('#option-title').textContent='إعدادات Cloison BA13 والفتحات';
 choices.querySelector('#option-subtitle').textContent='نستعمل Montants 3m؛ إذا كان ارتفاع الحائط أكثر من 3m، نزيدو قطع التمديد وقطعة وصل 50cm لكل وصلة مع استغلال بقايا القص.';
 const fieldGroups=[
  ['الهيكل وطبقات BA13',['layers','spacing']]
 ];
 const fieldsContainer=document.getElementById('fields');
 for(const [title,keys] of fieldGroups){
  const group=document.createElement('fieldset');
  group.className='ak-wall-setting-group';
  const legend=document.createElement('legend');legend.textContent=title;group.append(legend);
  const grid=document.createElement('div');grid.className='ak-wall-setting-grid';group.append(grid);
  for(const key of keys){
   const control=document.getElementById('in-'+key)?.closest('.formfield');
   if(!control)throw Error('Missing wall control: '+key);
   grid.append(control);
  }
  choices.append(group);
  for(const control of grid.querySelectorAll('input,select')){
   control.addEventListener('input',refresh);
   if(control.tagName==='SELECT')control.addEventListener('change',refresh);
  }
 }
 if(fieldsContainer.querySelectorAll('.formfield').length!==2)throw Error('Wall dimensions should only show length and height');
 const approve=document.getElementById('approve');
 choices.append(approve);
 approve.classList.add('ak-wall-approve');
 const svgDownload=document.getElementById('svg-download');svgDownload.remove();
 drawing.querySelector('.actions').remove();
 results.querySelector('#csv-download').remove();
 results.querySelector('#print').remove();
 results.querySelector('#note').remove();
 const pdf=document.getElementById('pdf-download');
 pdf.textContent='تحميل لائحة المواد + المخطط PDF';pdf.classList.add('ak-wall-pdf');
 const copy=document.createElement('button');
 copy.type='button';copy.id='copy-materials';copy.className='secondary';copy.textContent='نسخ القائمة';
 results.querySelector('#result .actions').append(copy);
 results.insertAdjacentHTML('beforeend','<p class="ak-wall-preview-warning">نسخة تجريبية غير معتمدة للتنفيذ: تدعيم الفتحات، خطة تقطيع BA13 ووصل Montants بقطعة 50cm خاصهم مراجعة تقنية حسب ارتفاع الحائط ونظام الشركة المصنّعة قبل الشراء أو التركيب.</p>');
 wallControls=initWallOpenings({fieldElement:fieldsContainer,planElement:drawing.querySelector('#plan'),onChange:()=>refresh(),fmt});
}
function dims(){let out={};for(const [id] of fields[app])out[id]=field(id);if(app==='armstrong-full')out.drop=field('drop');for(const id of ['mode','layers','spacing','studLength'])if($('in-'+id))out[id]=$('in-'+id).value;if(app==='walls')out.openings=wallControls.getOpenings();return out;}
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
   $('option-title').textContent=app==='ba13-ceiling'?'طريقة تركيب السقف':'إعدادات Cloison BA13';
   $('option-subtitle').textContent=app==='walls'?'اختار طبقات BA13 وتباعد Montants؛ المخطط كيتحدّث تلقائياً.':'اختار طريقة التركيب؛ المخطط كيتحدّث تلقائياً.';
   const info=app==='ba13-ceiling'?'Fourrure مع الضلع القصير: أول خط 15cm، والتباعد 50cm. الإنارة المخفية كتزيد حلقة داخلية على بعد 10cm من الحائط، مع نقاط تعليق تقديرية.':'زِد الباب أو النافذة من قياسات المشروع، واختار الأبعاد. تحكم فالمكان بالسحب داخل المخطط؛ الفتحات المتداخلة أو الخارجة على الحائط ما كتقبلش. التدعيم تقديري ويتراجع فالورش.';
   $('options').innerHTML=`<div class="hint">${info}</div>`;$('custom').hidden=true;
 }
}
function createModel(){let d=dims();if(app==='armstrong-full'){const o=chosen===2?{nL:field('nL'),nW:field('nW')}:options[chosen]||options[0];return calcArmstrongFull({...d,...o});}
 if(app==='ba13-ceiling')return calcBA13Ceiling(d);
 return calcWall({...d,kind:'cloison',studLength:3});
}
function sumSvg(p){const parts=app==='armstrong-full'?[['مساحة السقف',fmt(p.area)+'m²'],['شبكة 60×60',p.nL+' × '+p.nW],['عدد البلاكات',p.tiles]]:
 app==='ba13-ceiling'?[['مساحة السقف',fmt(p.area)+'m²'],['خطوط Fourrure',p.positions.length],['Fourrure 3m',p.fourrure],['وصلات (تقديرية)',p.joinCount],['علاقات',p.hangers],['ألواح BA13 النظري',p.boards]]:
 [['صافي المساحة',fmt(p.netArea)+'m²'],['ألواح BA13 النظري',p.boards],['خطوط Montants',p.montants],['Montants 3m للشراء',p.montantStockBars],['قطع وصل 50cm',p.montantSleeves],['Rails 3m',p.rails],['Cheville à frapper',p.chevilleCount],['طبقات / وجه',p.layers]];
 $('summary').innerHTML=parts.map(([a,b])=>metric(a,b)).join('');
}
const svgH=(p)=>{
 if(p.type==='armstrong-full')return armstrongFullPlanSvg(p,{showHangers});
 if(p.type==='ba13-ceiling')return ba13PlanSvg(p,{showHangers});
 if(p.type==='wall')return wallPlanSvg(p);
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
 if(p.type==='ba13-ceiling'){
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
function showError(e){$('error').textContent=e.message||String(e);$('error').hidden=false;$('approve').disabled=true;if($('svg-download'))$('svg-download').disabled=true;$('plan').innerHTML='<div class="locked">صلّح القياسات باش يظهر المخطط.</div>';$('summary').innerHTML='';}
function invalidate(){approved=false;$('result').hidden=true;$('locked').hidden=false;}
function refresh(){invalidate();$('error').hidden=true;try{optionsUI();plan=createModel();sumSvg(plan);$('plan').innerHTML=svgH(plan);if(app==='walls')wallControls.bindSvg(plan);$('approve').disabled=false;if($('svg-download'))$('svg-download').disabled=false;}catch(e){plan=null;showError(e)}}
function save(filename,blob){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2500)}
function renderBom(p){const rows=materials(p);let table='<table><thead><tr><th>المادة</th><th>المحسوب</th><th>الشراء المقترح</th></tr></thead><tbody>';
 for(const r of rows)table+=`<tr><td><b>${escapeText(r.name)}</b>${p.type==='wall'?'':`<div class="note">${escapeText(r.why||'')}</div>`}</td><td class="qty">${fmt(r.qty)} ${escapeText(r.unit)}</td><td class="qty buy">${fmt(r.buy)} ${escapeText(r.unit)}</td></tr>`;
 $('bom').innerHTML=table+'</tbody></table>';if($('note'))$('note').textContent=p.note;
}
$('approve').addEventListener('click',()=>{if(!plan)return;approved=true;renderBom(plan);$('locked').hidden=true;$('result').hidden=false;$('result').scrollIntoView({behavior:'smooth',block:'start'})});
if($('svg-download'))$('svg-download').addEventListener('click',()=>{if(plan)save(`ASSASSAT-KHALI_${app}_PLAN.svg`,new Blob([svgH(plan)],{type:'image/svg+xml;charset=utf-8'}))});
if($('csv-download'))$('csv-download').addEventListener('click',()=>{if(!approved||!plan)return;let rows=materials(plan);let csv='\uFEFFالمادة;المحسوب;الوحدة;الشراء المقترح;ملاحظات\r\n'+rows.map(r=>[r.name,r.qty,r.unit,r.buy,r.why].map(x=>`"${String(x).replaceAll('"','""')}"`).join(';')).join('\r\n');save(`ASSASSAT-KHALI_${app}_MATERIALS.csv`,new Blob([csv],{type:'text/csv;charset=utf-8'}))});
if($('print'))$('print').addEventListener('click',()=>window.print());

if(app==='armstrong-full'){
 $('copy-materials').addEventListener('click',async()=>{
  if(!approved||!plan)return;
  const button=$('copy-materials');
  const lines=['ASSASSAT KHALI — Armstrong بلا بوردور','السقف: '+fmt(plan.L)+' × '+fmt(plan.W)+' m | النزول: '+fmt(plan.drop)+' cm','لائحة المواد:'];
  for(const r of materials(plan))lines.push(r.name+': '+fmt(r.qty)+' '+r.unit+' — الشراء: '+fmt(r.buy)+' '+r.unit);
  const payload=lines.join('\n');
  try{
   if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(payload);
   else{
    const temp=document.createElement('textarea');temp.value=payload;temp.style.position='fixed';temp.style.opacity='0';document.body.append(temp);temp.select();
    const copied=document.execCommand('copy');temp.remove();if(!copied)throw Error('Clipboard unavailable');
   }
   button.textContent='تم نسخ القائمة ✓';
  }catch(e){button.textContent='تعذر النسخ: راجع صلاحية الحافظة';}
  button.blur();
 });
}

if(app==='walls'){
 $('copy-materials').addEventListener('click',async()=>{
  if(!approved||!plan)return;
  const button=$('copy-materials');
  const lines=['ASSASSAT KHALI — Cloison BA13',
   'الحائط: '+fmt(plan.L)+' × '+fmt(plan.H)+' m',
   'النوع: Cloison BA13 بوجهين',
   'لائحة المواد:'];
  for(const item of materials(plan))
   lines.push(item.name+': '+fmt(item.qty)+' '+item.unit+' — الشراء: '+fmt(item.buy)+' '+item.unit);
  const payload=lines.join('\n');
  try{
   if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(payload);
   else{
    const el=document.createElement('textarea');el.value=payload;el.style.position='fixed';el.style.opacity='0';
    document.body.append(el);el.select();const ok=document.execCommand('copy');el.remove();
    if(!ok)throw Error('Clipboard unavailable');
   }
   button.textContent='تم نسخ القائمة ✓';
  }catch(e){button.textContent='تعذر النسخ: راجع صلاحية الحافظة';}
  button.blur();
 });
}
$('pdf-download').addEventListener('click',async()=>{if(!approved||!plan)return;const b=$('pdf-download');b.disabled=true;const old=b.textContent;b.textContent='جاري إنشاء PDF...';try{const blob=await createPdf(plan);save(`ASSASSAT-KHALI_${app}_MATERIALS_PLAN.pdf`,blob)}catch(e){alert('تعذر إنشاء PDF: '+e.message)}finally{b.disabled=false;b.textContent=old}});
for(const el of $('fields').querySelectorAll('input,select'))el.addEventListener('input',()=>{if(app==='armstrong-full')chosen=0;refresh()});
async function createPdf(p){const rows=materials(p),W=1240,H=1754;
 const page=document.createElement('canvas');page.width=W;page.height=H;const g=page.getContext('2d');if(!g)throw Error('المتصفح لا يدعم canvas');
 const isArmPrint=p.type==='armstrong-full',isBA13Print=p.type==='ba13-ceiling',isWallPrint=p.type==='wall',isLandscapePrint=isArmPrint||isBA13Print||isWallPrint;const planCanvas=document.createElement('canvas');planCanvas.width=isLandscapePrint?3508:W;planCanvas.height=isLandscapePrint?2480:H;const z=planCanvas.getContext('2d');if(!z)throw Error('المتصفح لا يدعم canvas');
 function base(ctx,title,num){ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);ctx.fillStyle='#14333a';ctx.fillRect(0,0,W,190);ctx.fillStyle='#0f8977';ctx.fillRect(0,185,W,6);text(ctx,'ASSASSAT KHALI',78,82,35,'#cee9dd',800,'left');text(ctx,title,1163,108,42,'#fff',800);text(ctx,names[app],1163,156,22,'#bedad5',500);
 ctx.fillStyle='#dce7e3';ctx.fillRect(76,H-104,1090,2);text(ctx,'ASSASSAT KHALI · OUTIL TECHNIQUE',76,H-62,21,'#70858a',700,'left');text(ctx,`${num} / 2`,1163,H-62,24,'#70858a',600)}
 function text(ctx,v,x,y,size=25,color='#243f47',weight=500,align='right'){ctx.font=`${weight} ${size}px Tahoma,Arial,sans-serif`;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.direction=align==='left'?'ltr':'rtl';ctx.fillStyle=color;ctx.fillText(String(v),x,y)}
 function box(ctx,x,y,w,h,bg){ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(x,y,w,h,14);ctx.fill()}
 base(g,'لائحة السلعة',1);box(g,76,220,1088,122,'#e8f4ed');text(g,app==='walls'?`الحائط: ${fmt(p.L)} × ${fmt(p.H)} m`:`السقف: ${fmt(p.L)} × ${fmt(p.W)} m`,1127,275,31,'#204951',800);
 text(g,`مساحة العمل: ${fmt(p.type==='wall'?p.netArea:p.area)} m²`,1127,318,24,'#477478',600);
 box(g,76,370,1088,69,'#1d5a5b');text(g,'المادة',1123,413,25,'#fff',800);text(g,'محسوب',540,413,24,'#fff',800);text(g,'الشراء',268,413,24,'#fff',800);
 const rowH=74;let off=439;rows.forEach((r,i)=>{const y=off+i*rowH;if(i%2===0){g.fillStyle='#f3f9f5';g.fillRect(76,y,1088,rowH)}g.fillStyle='#e2ebe8';g.fillRect(76,y+rowH-1,1088,1);text(g,r.name,1127,y+35,21,'#1c4148',700);if(!isWallPrint&&r.why)text(g,r.why,1127,y+63,16,'#718489',400);text(g,`${fmt(r.qty)} ${r.unit}`,550,y+46,23,'#23545b',700);text(g,`${fmt(r.buy)} ${r.unit}`,266,y+46,24,'#167762',800);});
 const noteY=Math.min(off+rows.length*rowH+32,H-282);box(g,76,noteY,1088,155,'#fff4e4');text(g,'تنبيه مهم',1127,noteY+41,26,'#976822',800);
 const note='الكميات تقديرية وتحتاج مراجعة التوزيع، الوصلات ونظام التثبيت بالموقع.';text(g,note,1127,noteY+86,21,'#866325',500);text(g,'اعتمد المقاسات النهائية قبل شراء السلعة.',1127,noteY+124,21,'#866325',500);
 // Page 2 is now a real, print-layout plan drawn from geometry, not a resized SVG screenshot.
 if(isArmPrint){
   drawArmstrongPrintPage(z,p,planCanvas.width,planCanvas.height,{showHangers});
 } else if(isBA13Print){
   drawBA13PrintPage(z,p,planCanvas.width,planCanvas.height,{showHangers});
 } else if(isWallPrint){
   drawWallPrintPage(z,p,planCanvas.width,planCanvas.height);
 } else {
   base(z,'المخطط التقني',2);
   box(z,76,218,1088,112,'#e8f4ed');
   text(z,'القياسات: '+fmt(p.L)+' × '+fmt(p.type==='wall'?p.H:p.W)+' m',1124,269,30,'#23535b',800);
   text(z,names[app]+' — رسم توضيحي',1124,309,23,'#58777d',600);
   box(z,76,353,1088,830,'#f5f9f7');
   const svg=svgH(p),img=new Image();
   await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('تعذر تحميل صورة المخطط'));img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)});
   z.drawImage(img,80,420,1080,650);
   box(z,76,1235,1088,210,'#f3f8f5');
   text(z,'ملاحظات المخطط',1127,1290,30,'#21474c',800);
   const words=p.note.match(/.{1,73}(?:\s|$)/g)||[p.note];
   words.slice(0,3).forEach((line,i)=>text(z,line.trim(),1127,1330+i*40,21,'#527174',500));
   box(z,76,1490,1088,100,'#fff4e5');
   text(z,'المخطط توضيحي وليس مخططاً إنشائياً معتمداً.',1124,1548,23,'#8b6227',700);
 }
 function jpeg(c){const raw=atob(c.toDataURL('image/jpeg',.94).split(',')[1]);return Uint8Array.from(raw,x=>x.charCodeAt(0))}
 const images=[
  {bytes:jpeg(page),w:W,h:H,pdfW:595.28,pdfH:841.89},
  {bytes:jpeg(planCanvas),w:planCanvas.width,h:planCanvas.height,pdfW:isLandscapePrint?841.89:595.28,pdfH:isLandscapePrint?595.28:841.89}
 ],enc=new TextEncoder(),chunks=[];let len=0,offsets=[0];
 const put=v=>{const b=typeof v==='string'?enc.encode(v):v;chunks.push(b);len+=b.length};
 const object=(id,fn)=>{offsets[id]=len;put(id+' 0 obj\n');fn();put('\nendobj\n')};
 put('%PDF-1.4\n%AKPDF\n');
 object(1,()=>put('<< /Type /Catalog /Pages 2 0 R >>'));
 object(2,()=>put('<< /Type /Pages /Kids [3 0 R 6 0 R] /Count 2 >>'));
 images.forEach((img,i)=>{
  const id=3+i*3,b=img.bytes;
  object(id,()=>put('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+img.pdfW+' '+img.pdfH+'] /Resources << /XObject << /Im0 '+(id+1)+' 0 R >> >> /Contents '+(id+2)+' 0 R >>'));
  object(id+1,()=>{put('<< /Type /XObject /Subtype /Image /Width '+img.w+' /Height '+img.h+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+b.length+' >>\nstream\n');put(b);put('\nendstream')});
  const stream='q\n'+img.pdfW+' 0 0 '+img.pdfH+' 0 0 cm\n/Im0 Do\nQ\n';
  object(id+2,()=>{put('<< /Length '+enc.encode(stream).length+' >>\nstream\n'+stream+'endstream')});
 });
 const xref=len;put('xref\n0 9\n0000000000 65535 f \n');for(let i=1;i<=8;i++)put(String(offsets[i]).padStart(10,'0')+' 00000 n \n');put(`trailer\n<< /Size 9 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);return new Blob(chunks,{type:'application/pdf'});
}
refresh();
