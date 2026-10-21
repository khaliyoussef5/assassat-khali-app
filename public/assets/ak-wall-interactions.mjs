/* Cloison BA13 review — multiple openings, sizes in room measurements,
   and XY positioning by pointer/keyboard inside the SVG.
   The wall engine remains the source of truth for takeoff and collision checks.
*/
const round=n=>Math.round(n*100)/100;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function initWallOpenings({fieldElement,planElement,onChange,fmt}){
 let items=[],counter=1;
 const toolbar=document.createElement('div');
 toolbar.className='ak-wall-opening-toolbar';
 toolbar.innerHTML='<button id="wall-add-door" type="button">+ إضافة باب</button><button id="wall-add-window" type="button">+ إضافة نافذة</button>';
 const message=document.createElement('p');
 message.id='wall-opening-message';message.className='ak-wall-opening-message';message.setAttribute('role','status');message.hidden=true;
 const editor=document.createElement('div');
 editor.id='wall-opening-fields';editor.className='ak-wall-opening-fields';
 fieldElement.after(toolbar,message,editor);
 const help=document.createElement('p');
 help.className='ak-wall-drag-help';
 help.textContent='حرّك كل باب أو نافذة بالماوس أو بإصبعك داخل المخطط. يمكن كذلك استعمال الأسهم فلوحة المفاتيح.';
 planElement.after(help);
 const wall=()=>({L:Number(document.getElementById('in-L')?.value),H:Number(document.getElementById('in-H')?.value)});
 const canPlace=(o,others,L,H)=>{
  const sill=o.type==='door'?0:o.bottom;
  if(![L,H,o.x,o.w,o.h,sill].every(Number.isFinite)||
   o.w<=0||o.h<=0||o.x<0||sill<0||o.x+o.w>L+1e-7||sill+o.h>H+1e-7)return false;
  return others.every(q=>{
   const qb=q.type==='door'?0:q.bottom;
   return !(o.x<q.x+q.w-1e-7&&q.x<o.x+o.w-1e-7&&sill<qb+q.h-1e-7&&qb<sill+o.h-1e-7);
  });
 };
 const showMessage=t=>{message.hidden=!t;message.textContent=t||'';};
 const names=()=>{const counts={door:0,window:0};return items.map(o=>{
  const n=++counts[o.type];
  return {o,title:(o.type==='door'?'باب ':'نافذة ')+n};
 });};
 const updateLocations=()=>{
  for(const {o} of names()){
   const el=editor.querySelector('[data-position-for="'+o.id+'"]');
   if(el)el.textContent='المكان من بداية الحائط: '+fmt(o.x)+'m'+(o.type==='window'?' — علو أسفل النافذة: '+fmt(o.bottom)+'m':'')+' (التحريك داخل المخطط)';
  }
 };
 const render=()=>{
  editor.innerHTML=names().map(({o,title})=>{
   const id=esc(o.id),horizontal=o.type==='door'?'عرض الباب':'طول النافذة',vertical=o.type==='door'?'ارتفاع الباب':'عرض النافذة (عمودياً)';
   return '<div class="ak-wall-opening-card" data-opening-card="'+id+'">'+
    '<div class="ak-wall-opening-card-head"><strong>'+title+'</strong><button type="button" data-remove-opening="'+id+'" aria-label="حذف '+title+'">حذف</button></div>'+
    '<div class="ak-wall-opening-dimensions">'+
    '<label>'+horizontal+' (m)<input type="number" inputmode="decimal" min=".1" step=".05" data-size-id="'+id+'" data-size-key="w" value="'+o.w+'"></label>'+
    '<label>'+vertical+' (m)<input type="number" inputmode="decimal" min=".1" step=".05" data-size-id="'+id+'" data-size-key="h" value="'+o.h+'"></label>'+
    '</div><p data-position-for="'+id+'" class="ak-wall-opening-position"></p></div>';
  }).join('');
  for(const button of editor.querySelectorAll('[data-remove-opening]'))button.addEventListener('click',()=>{
   items=items.filter(o=>o.id!==button.dataset.removeOpening);
   showMessage('');render();onChange();
  });
  for(const input of editor.querySelectorAll('[data-size-id]'))input.addEventListener('input',()=>{
   const o=items.find(a=>a.id===input.dataset.sizeId);
   if(o){o[input.dataset.sizeKey]=Number(input.value);onChange();}
  });
  updateLocations();
 };
 const add=type=>{
  const {L,H}=wall(),candidate={id:'op-'+counter,type,w:type==='door'?.9:1,h:type==='door'?2.1:1.2,x:0,bottom:type==='door'?0:.9};
  const sills=type==='door'?[0]:[Math.min(.9,Math.max(0,H-candidate.h))];
  if(type==='window'&&Number.isFinite(H)){
   for(let c=0;c<=Math.floor(Math.max(0,H-candidate.h)*100);c+=5){
    const n=c/100;if(!sills.some(x=>Math.abs(x-n)<.001))sills.push(n);
   }
  }
  let found=false;
  for(const sill of sills){
   if(!Number.isFinite(L))break;
   for(let c=0;c<=Math.floor((L-candidate.w)*100);c+=5){
    const x=c/100,proposed={...candidate,x,bottom:sill};
    if(canPlace(proposed,items,L,H)){Object.assign(candidate,proposed);found=true;break;}
   }
   if(found)break;
  }
  if(!found){
   showMessage('ما كاينش بلاصة صالحة لهاد '+(type==='door'?'الباب':'النافذة')+' بالمقاسات الافتراضية. راجع طول الحائط وارتفاعه والفتحات الموجودة.');
   return;
  }
  showMessage('');items.push(candidate);counter++;render();onChange();
 };
 toolbar.querySelector('#wall-add-door').addEventListener('click',()=>add('door'));
 toolbar.querySelector('#wall-add-window').addEventListener('click',()=>add('window'));
 const getOpenings=()=>items.map(x=>({...x}));
 const move=(o,v)=>{
  const {L,H}=wall();
  const next={...o,x:round(v.x),bottom:o.type==='door'?0:round(v.bottom)};
  if(!canPlace(next,items.filter(a=>a.id!==o.id),L,H))return false;
  Object.assign(o,next);showMessage('');updateLocations();onChange();return true;
 };
 const bindSvg=plan=>{
  const svg=planElement.querySelector('svg[data-diagram="wall"]');
  if(!svg||!plan)return;
  const sw=Number(svg.dataset.wallW),sh=Number(svg.dataset.wallH);
  const local=e=>{
   const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;
   const matrix=svg.getScreenCTM();
   return matrix?p.matrixTransform(matrix.inverse()):p;
  };
  for(const group of svg.querySelectorAll('[data-drag-id]')){
   const o=items.find(item=>item.id===group.dataset.dragId);
   if(!o)continue;
   let drag=null;
   group.addEventListener('pointerdown',e=>{
    if(e.button!==undefined&&e.button!==0)return;
    e.preventDefault();
    drag={start:local(e),x:o.x,bottom:o.bottom,candidate:{x:o.x,bottom:o.bottom}};
    group.setPointerCapture(e.pointerId);
   });
   group.addEventListener('pointermove',e=>{
    if(!drag)return;
    const now=local(e),{L,H}=wall();
    const dx=(now.x-drag.start.x)*L/sw,dy=(now.y-drag.start.y)*H/sh;
    const x=round(Math.max(0,Math.min(L-o.w,drag.x+dx)));
    const bottom=o.type==='door'?0:round(Math.max(0,Math.min(H-o.h,drag.bottom-dy)));
    if(canPlace({...o,x,bottom},items.filter(a=>a.id!==o.id),L,H)){
     drag.candidate={x,bottom};
     group.setAttribute('transform','translate('+((x-drag.x)*sw/L)+' '+(-(bottom-drag.bottom)*sh/H)+')');
    }
   });
   group.addEventListener('pointerup',()=>{
    if(!drag)return;
    const proposed=drag.candidate;drag=null;
    group.removeAttribute('transform');move(o,proposed);
   });
   group.addEventListener('pointercancel',()=>{drag=null;group.removeAttribute('transform');});
   group.addEventListener('keydown',e=>{
    const delta=e.shiftKey?.01:.1,proposed={x:o.x,bottom:o.bottom};
    if(e.key==='ArrowLeft')proposed.x-=delta;
    else if(e.key==='ArrowRight')proposed.x+=delta;
    else if(e.key==='ArrowUp'&&o.type==='window')proposed.bottom+=delta;
    else if(e.key==='ArrowDown'&&o.type==='window')proposed.bottom-=delta;
    else return;
    e.preventDefault();move(o,proposed);
   });
  }
 };
 render();
 return {getOpenings,bindSvg};
}
