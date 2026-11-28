/* ========== circuit library: save, load, export, import ==========
   Entries live in prog.lib and capture the circuit plus its input/output names.
   Loading always happens into the sandbox, whose inputs/outputs adopt the entry's. */
function libEntries(){prog.lib=prog.lib||[];return prog.lib}
function gateN(n){
  if(LANG==='en')return n+' '+(n===1?'gate':'gates');
  const a=n%10,b=n%100;
  return num(n)+' '+(a===1&&b!==11?'элемент':a>=2&&a<=4&&(b<10||b>=20)?'элемента':'элементов');
}
function libCapture(name){
  const io={ins:level.ins.slice(),outs:level.outs.slice()};
  return{id:Date.now()%2147483647,n:name,ts:Date.now(),io,
    gates:JSON.parse(JSON.stringify(C.gates)),wires:JSON.parse(JSON.stringify(C.wires))};
}
function saveToLib(name){
  name=(name||'').trim()||ui('libUntitled');
  libEntries().unshift(libCapture(name));
  save();drawLib();sfx('stamp',true);
  toast(ui('libSaved'));
}
/* small thumbnail: gates as labeled chips, wires as straight lines */
function libThumb(e){
  const xs=[],ys=[];
  e.gates.forEach(g=>{xs.push(g.x,g.x+56);ys.push(g.y,g.y+40)});
  if(!xs.length)return '<svg class="lt" viewBox="0 0 120 72"></svg>';
  const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
  const w=Math.max(1,x1-x0),h=Math.max(1,y1-y0),s=Math.min(104/w,56/h);
  const ox=(120-w*s)/2-x0*s,oy=(72-h*s)/2-y0*s;
  const gp=id=>{if(id.startsWith('I'))return[x0-46,y0];if(id.startsWith('O'))return[x1+46,y0];const g=e.gates.find(x=>x.id===id);return g?[g.x+28,g.y+20]:[x0,y0]};
  let out='';
  e.wires.forEach(ww=>{
    const a=gp(ww.from.g),b=gp(ww.to.g);
    out+=`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="var(--dim)" stroke-width="1.4" opacity=".55" vector-effect="non-scaling-stroke"/>`;
  });
  e.gates.forEach(g=>{
    out+=`<rect x="${g.x}" y="${g.y}" width="56" height="40" rx="9" fill="var(--paper,#fff)" stroke="var(--ink)" stroke-width="2" vector-effect="non-scaling-stroke"/>
      <text x="${g.x+28}" y="${g.y+25}" text-anchor="middle" font-size="15" fill="var(--ink)">${(GATES[g.type]?tx(GATES[g.type].n):g.type).slice(0,3)}</text>`;
  });
  return `<svg class="lt" viewBox="0 0 120 72"><g transform="translate(${ox},${oy}) scale(${s})">${out}</g></svg>`;
}
function libExport(e){
  const data=JSON.stringify({type:'logiclab-circuit',v:1,entry:e},null,1);
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([data],{type:'application/json'}));
  a.download=(e.n||'circuit').replace(/[^\wа-яёА-ЯЁ -]+/gi,'_')+'.json';
  a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000);
}
function libImport(file){
  const rd=new FileReader();
  rd.onload=()=>{
    try{
      const d=JSON.parse(rd.result);
      const list=Array.isArray(d)?d:d.type==='logiclab-circuit'&&d.entry?[d.entry]:d.entries||null;
      if(!list)throw 0;
      let n=0;
      list.forEach(e=>{
        if(!e||!Array.isArray(e.gates)||!Array.isArray(e.wires))return;
        e.id=Date.now()%2147483647+n;e.n=(e.n||ui('libUntitled')).slice(0,60);e.ts=Date.now();
        e.io=e.io&&Array.isArray(e.io.ins)?e.io:{ins:['A','B','C'],outs:['X','Y','Z']};
        libEntries().unshift(e);n++;
      });
      if(!n)throw 0;
      save();drawLib();toast(ui('libImported',{n}));
    }catch(err){toast(ui('libBadFile'))}
  };
  rd.readAsText(file);
}
function loadLibEntry(id){
  const e=libEntries().find(x=>x.id===id);if(!e)return;
  // the sandbox adopts the entry's inputs and outputs
  SANDBOX.ins=e.io.ins.slice();SANDBOX.outs=e.io.outs.slice();
  if(saves[0]){saves[0].sbio={ins:SANDBOX.ins.slice(),outs:SANDBOX.outs.slice()}}
  loadLevel(SANDBOX);closeMenu();
  C=JSON.parse(JSON.stringify({gates:e.gates,wires:e.wires}));
  sanitizeC();
  nextId=1+Math.max(0,...C.gates.map(g=>+g.id.slice(1)||0),...C.wires.map(w=>+w.id.slice(1)||0));
  sel=null;multi.clear();
  undoS.length=0;redoS.length=0;
  changed();fit();
  toast(ui('libLoaded'));
}
function drawLib(){
  const box=$('#libBox');if(!box)return;
  const es=libEntries();
  const cur=(level&&C&&(C.gates.length||C.wires.length));
  box.innerHTML=`
   <div class="sh-card lib-save">
     <input id="libName" maxlength="48" placeholder="${ui('libName')}" autocomplete="off" spellcheck="false">
     <button class="tbtn primary" id="libSaveBtn" ${cur?'':'disabled'}>${ui('libSave')}</button>
     <button class="tbtn" id="libImpBtn">${ui('libImport')}</button>
     <input type="file" id="libFile" accept=".json,application/json" hidden>
   </div>
   ${es.length?`<div class="lib-grid">${es.map(e=>`
     <div class="lib-card">
       ${libThumb(e)}
       <b class="lib-nm">${esc(e.n)}</b>
       <span class="lib-io">${esc(e.io.ins.join(''))} → ${esc(e.io.outs.join(''))} · ${gateN(e.gates.length)}</span>
       <div class="lib-acts">
         <button class="tbtn primary" data-lib-load="${e.id}">${ui('libLoad')}</button>
         <button class="tbtn" data-lib-exp="${e.id}">${ui('libExport')}</button>
         <button class="tbtn danger" data-lib-del="${e.id}">${ui('libDelete')}</button>
       </div>
     </div>`).join('')}</div>`
   :`<p class="lib-empty">${ui('libEmpty')}</p>`}`;
}
document.addEventListener('click',e=>{
  const t=e.target;
  if(t.closest('#libSaveBtn')){saveToLib($('#libName').value);return}
  if(t.closest('#libImpBtn')){$('#libFile').click();return}
  const ld=t.closest('[data-lib-load]');
  if(ld){loadLibEntry(+ld.dataset.libLoad);return}
  const ex=t.closest('[data-lib-exp]');
  if(ex){const en=libEntries().find(x=>x.id===+ex.dataset.libExp);if(en)libExport(en);return}
  const del=t.closest('[data-lib-del]');
  if(del){
    const id=+del.dataset.libDel;
    prog.lib=libEntries().filter(x=>x.id!==id);
    save();drawLib();sfx('ui');toast(ui('libDeleted'));
  }
});
document.addEventListener('change',e=>{
  if(e.target.id==='libFile'&&e.target.files.length){libImport(e.target.files[0]);e.target.value=''}
});
$('#btnLib').onclick=()=>openMenu('lib');

Object.assign(UIS,{
  library:['Библиотека','Library'],libSave:['Сохранить текущую','Save current'],libName:['Название схемы…','Circuit name…'],
  libUntitled:['Без названия','Untitled'],libEmpty:['Пока пусто. Соберите схему и сохраните её — она пригодится в песочнице и других уровнях.','Empty so far. Build a circuit and save it — it will come in handy in the sandbox and beyond.'],
  libLoad:['Открыть в песочнице','Open in sandbox'],libExport:['Экспорт','Export'],libImport:['Импорт','Import'],libDelete:['Удалить','Delete'],
  libSaved:['Схема сохранена в библиотеку','Saved to the library'],libLoaded:['Схема открыта в песочнице','Opened in the sandbox'],
  libDeleted:['Удалено','Deleted'],libImported:['Импортировано схем: {n}','Imported {n} circuit(s)'],libBadFile:['Файл не похож на схему Logic Lab','This file does not look like a Logic Lab circuit']
});
