const baseNames=['визитка_двухсторонняя','листовка_акция','меню_летнее','этикетка_серия','буклет_новый','открытка','вкладыш','купон','каталог','плакат'];
const formats=['90×50','105×148','210×297','70×100','210×210','148×210','100×150','74×105'];
const runs=[500,1000,1500,2000,250,3000];
let rows=Array.from({length:30},(_,i)=>({
  id:i+1,name:`${String.fromCharCode(65+i%26)}-${String(i+1).padStart(2,'0')}_${baseNames[i%baseNames.length]}.pdf`,
  format:formats[i%formats.length],run:runs[i%runs.length],kinds:1+i%5,pages:2+(i%4)*2,
  front:i%3===0?4:1,back:i%4===0?0:(i%3===0?4:1),bleed:i%4===0?0:2,cut:i%3===0?'разд.':'общ.',rotate:'авто',turn:i%5===0?'свой':'чужой',
  forms:1+i%4,sheets:90+(i%7)*55,nup:2+(i%6)*2,fill:[92,89,93,88,94,91,86,78][i%8],warning:i===7||i===18
}));
let selectedId=1;
const table=document.querySelector('#orderTable');
const body=document.querySelector('#orderBody');
const scroll=document.querySelector('#tableScroll');
const hints={order:'Заказ: основные входные параметры',print:'Печать: красочность и производственные настройки',result:'Результат: формы, листы и заполнение',all:'Все технические поля'};

function padId(id){const width=Math.max(2,String(rows.length).length);return String(id).padStart(width,'0')}
function rowMarkup(r){return `<td class="sticky-no numeric">${padId(r.id)}</td><td class="sticky-name name-cell" title="${r.name}">${r.name}</td><td class="order-col">${r.format}</td><td class="order-col numeric">${r.run}</td><td class="order-col numeric">${r.kinds}</td><td class="order-col numeric">${r.pages}</td><td class="print-col"><span class="print-pill">${r.front}</span></td><td class="print-col"><span class="print-pill">${r.back}</span></td><td class="print-col numeric">${r.bleed} мм</td><td class="print-col">${r.cut}</td><td class="print-col">${r.rotate}</td><td class="print-col">${r.turn}</td><td class="result-col numeric">${r.forms}</td><td class="result-col numeric">${r.sheets}</td><td class="result-col numeric">${r.nup}</td><td class="result-col numeric">${r.fill}%</td><td class="status-col"><span class="status ${r.warning?'warning':''}">${r.warning?'Проверить':'Готово'}</span></td>`}
function renderRows(query=''){
  const digits=Math.max(2,String(rows.length).length);
  document.documentElement.style.setProperty('--no-w',`${Math.max(25,13+digits*6)}px`);
  body.innerHTML='';const normalized=query.trim().toLowerCase();
  rows.filter(r=>!normalized||r.name.toLowerCase().includes(normalized)||padId(r.id).includes(normalized)).forEach(r=>{
    const tr=document.createElement('tr');tr.dataset.id=String(r.id);tr.className=(r.id===selectedId?'is-selected ':'')+(r.warning?'has-warning':'');tr.innerHTML=rowMarkup(r);tr.addEventListener('click',()=>selectRow(r.id));body.append(tr);
  });
  document.querySelector('#tableTotal').textContent=`${body.children.length} строк`;
}
function selectRow(id){selectedId=id;renderRows(document.querySelector('#searchInput').value);const r=rows.find(x=>x.id===id);if(!r)return;document.querySelector('#selectedNo').textContent=padId(r.id);document.querySelector('#selectedName').textContent=r.name;document.querySelector('#selectedMeta').textContent=`${r.format} · ${r.run} шт. · ${r.front}+${r.back} · ${r.pages} страниц · ${r.warning?'проверить':'готово'}`}
function setLens(lens){table.className=`order-table lens-${lens}`;document.querySelectorAll('.lens-button').forEach(b=>b.classList.toggle('is-active',b.dataset.lens===lens));document.querySelector('#viewHint').textContent=hints[lens];scroll.scrollLeft=0}
function openScreen(screen){
  document.querySelectorAll('[data-screen-panel]').forEach(p=>p.classList.toggle('is-active',p.dataset.screenPanel===screen));
  document.querySelectorAll('.bottom-button').forEach(b=>b.classList.toggle('is-active',b.dataset.screen===screen));
  const steps=[...document.querySelectorAll('.workflow-step')];steps.forEach(s=>s.classList.remove('is-active'));
  const activeIndex=screen==='order'?1:screen==='calc'?2:screen==='export'?3:-1;if(activeIndex>=0&&steps[activeIndex])steps[activeIndex].classList.add('is-active');
  document.querySelector('.lens-switch').hidden=screen!=='order';window.scrollTo({top:0,behavior:'auto'});requestAnimationFrame(checkGlobalOverflow)
}

document.querySelectorAll('.lens-button').forEach(button=>button.addEventListener('click',()=>setLens(button.dataset.lens)));
document.querySelectorAll('[data-screen]').forEach(button=>button.addEventListener('click',()=>openScreen(button.dataset.screen)));
document.querySelector('#searchInput').addEventListener('input',e=>renderRows(e.target.value));
document.querySelector('#addRowButton').addEventListener('click',()=>{const i=rows.length;rows.push({id:i+1,name:`${String.fromCharCode(65+i%26)}-${String(i+1).padStart(2,'0')}_новая_позиция.pdf`,format:'90×50',run:1000,kinds:1,pages:2,front:4,back:4,bleed:2,cut:'общ.',rotate:'авто',turn:'чужой',forms:2,sheets:125,nup:8,fill:91,warning:false});selectedId=rows.length;renderRows();scroll.scrollTop=scroll.scrollHeight});

const slots=document.querySelector('#slots');['A-01','B-02','C-03','D-04','E-05','F-06','G-07','H-08','I-09','J-10','K-11','L-12','M-13','N-14','O-15','P-16'].forEach((name,i)=>{const el=document.createElement('div');el.className='slot';el.innerHTML=`<span>${name}<b>${i%2+1}</b></span>`;slots.append(el)});
function checkGlobalOverflow(){const extra=Math.max(0,document.documentElement.scrollWidth-document.documentElement.clientWidth);const warning=document.querySelector('#overflowWarning');warning.hidden=extra===0;warning.textContent=extra?`Ошибка C2: страница шире экрана на ${extra}px`:''}
window.addEventListener('resize',checkGlobalOverflow);
renderRows();selectRow(1);setLens('order');requestAnimationFrame(checkGlobalOverflow);
