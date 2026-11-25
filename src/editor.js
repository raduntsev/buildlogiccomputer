/* ========== gates ========== */
const GATES={
  NOT :{n:['НЕ','NOT'],ins:1,h:40,f:i=>[1-i[0]]},
  AND :{n:['И','AND'],ins:2,h:40,f:i=>[i[0]&i[1]]},
  OR  :{n:['ИЛИ','OR'],ins:2,h:40,f:i=>[i[0]|i[1]]},
  NAND:{n:['И-НЕ','NAND'],ins:2,h:40,f:i=>[1-(i[0]&i[1])]},
  NOR :{n:['ИЛИ-НЕ','NOR'],ins:2,h:40,f:i=>[1-(i[0]|i[1])]},
  XOR :{n:['Искл. ИЛИ','XOR'],ins:2,h:40,f:i=>[i[0]^i[1]]},
  XNOR:{n:['Равнозн.','XNOR'],ins:2,h:40,f:i=>[1-(i[0]^i[1])]},
  DFF :{n:['D-тригг.','D flip-flop'],ins:2,h:60,seq:1}
};
const ALL_GATES=Object.keys(GATES);
SANDBOX.gates=ALL_GATES;
function gPins(type){
  if(type==='DFF') return {i:[20,40],o:[20,40]};
  return {i:GATES[type].ins===1?[20]:[10,30],o:[20]};
}

/* ========== state ========== */
const RM=(()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}})();
const settings=Object.assign({lang:LANG,voiceVol:70,ui:'auto',win:'auto',fs:false,ww:5,grid:'lines',hc:false,calm:RM,musicVol:50,sfxVol:70,gost:true,bit:'all',txt:16,demo:1},store.get('ll_set',{}));
if('gost' in store.get('ll_set',{})===false)settings.gost=LANG!=='en';
delete settings.music;delete settings.sfx;
let seen=new Set(store.get('ll_seen',[]));
let done=new Set(store.get('ll_done',[]));
let saves=store.get('ll_saves',{});
let prog=Object.assign({lv:{},quiz:{},badges:[],st:{undo:0}},store.get('ll_prog',{}));
let hintUsed=false,bitMuted=false,levelStart=Date.now();
let level=null, C={gates:[],wires:[]}, nextId=1;
let undoS=[],redoS=[];
let liveIn=[], sim={v:{},ff:{}};
let rowMark=null, demoRow=-1, demoOn=false, demoSkip=false;
let view={x:0,y:0,z:1};
let sel=null;

function ioIns(){const a=level.ins.slice();if(level.clk)a.push('C');return a}
function ioY(n,i){return (i-(n-1)/2)*80}
const OUTX=()=>innerWidth<640?(level.sandbox?320:Math.min(300,180+40*(level.ins.length+level.outs.length))):level.sandbox?640:Math.min(700,260+60*(level.ins.length+level.outs.length+(level.clk?1:0))+(level.gates.length>2?60:0));

function save(){store.set('ll_saves',saves);store.set('ll_done',[...done]);store.set('ll_set',settings);store.set('ll_seen',[...seen]);store.set('ll_prog',prog)}
function persist(){saves[level.id]={gates:C.gates,wires:C.wires};save()}

function loadLevel(l){
  level=l;$('#result').classList.remove('on');
  const s=saves[l.id];
  C=s?JSON.parse(JSON.stringify(s)):{gates:[],wires:[]};
  nextId=1+Math.max(0,...C.gates.map(g=>+g.id.slice(1)),...C.wires.map(w=>+w.id.slice(1)));
  undoS=[];redoS=[];sel=null;rowMark=null;
  liveIn=ioIns().map(()=>0);
  resetSim();
  store.set('ll_last',l.id,true);
  buildChrome();
  fit();
  update();
  hintUsed=false;bitMuted=false;levelStart=Date.now();idleShown=false;resetIdle();
  levelIntro();
  musicChapter(l.sandbox?topChapter():l.ch);
}

/* ========== history ========== */
function snapshot(){undoS.push(JSON.stringify(C));if(undoS.length>200)undoS.shift();redoS=[]}
function undo(){if(!undoS.length)return;prog.st.undo=(prog.st.undo||0)+1;if(prog.st.undo>=50)badge('UNDO_50');redoS.push(JSON.stringify(C));C=JSON.parse(undoS.pop());changed()}
function redo(){if(!redoS.length)return;undoS.push(JSON.stringify(C));C=JSON.parse(redoS.pop());changed()}
function changed(){rowMark=null;persist();resetSim();update();resetIdle();updCount()}

/* ========== geometry ========== */
function nodePos(id){
  if(id[0]==='I'){const n=ioIns().length;return{x:0,y:ioY(n,+id.slice(1))}}
  if(id[0]==='O'){return{x:OUTX(),y:ioY(level.outs.length,+id.slice(1))}}
  return C.gates.find(g=>g.id===id);
}
function pinPos(id,k,p){
  if(id[0]==='I'){const n=nodePos(id);return{x:n.x+20,y:n.y}}
  if(id[0]==='O'){const n=nodePos(id);return{x:n.x,y:n.y}}
  const g=nodePos(id),P=gPins(g.type);
  return k==='i'?{x:g.x,y:g.y+P.i[p]}:{x:g.x+GW,y:g.y+P.o[p]};
}
function autoRoute(s,t,srcId){
  const off=(((s.y/20)%3)+3)%3*10;
  if(t.x-s.x>=40){
    const mx=Math.min(s.x+20+off,t.x-20);
    if(s.y===t.y)return[s,t];
    return[s,{x:mx,y:s.y},{x:mx,y:t.y},t];
  }
  const ax=s.x+20+off,bx=t.x-20,ym=Math.max(s.y,t.y)+60;
  return[s,{x:ax,y:s.y},{x:ax,y:ym},{x:bx,y:ym},{x:bx,y:t.y},t];
}
function route(s,pts,t){
  if(!pts||!pts.length)return autoRoute(s,t);
  const o=[s];let a=s;
  for(const b of pts){if(a.x!==b.x&&a.y!==b.y)o.push({x:b.x,y:a.y});o.push(b);a=b}
  if(a.x!==t.x&&a.y!==t.y)o.push({x:a.x,y:t.y});
  o.push(t);
  return dedupe(o);
}
function dedupe(o){
  const r=[o[0]];
  for(let i=1;i<o.length;i++){const p=r[r.length-1];if(p.x===o[i].x&&p.y===o[i].y)continue;r.push(o[i])}
  // merge collinear
  const m=[r[0]];
  for(let i=1;i<r.length-1;i++){const a=m[m.length-1],b=r[i],c=r[i+1];if((a.x===b.x&&b.x===c.x)||(a.y===b.y&&b.y===c.y))continue;m.push(b)}
  if(r.length>1)m.push(r[r.length-1]);
  return m;
}
function wirePts(w){return route(pinPos(w.from.g,'o',w.from.p),w.pts,pinPos(w.to.g,'i',w.to.p))}
const toD=pts=>'M'+pts.map(p=>p.x+','+p.y).join('L');
function roundD(pts,r=10){
  if(pts.length<3)return toD(pts);
  let d='M'+pts[0].x+','+pts[0].y;
  for(let i=1;i<pts.length-1;i++){const a=pts[i-1],b=pts[i],c=pts[i+1];
    const l1=Math.hypot(b.x-a.x,b.y-a.y),l2=Math.hypot(c.x-b.x,c.y-b.y),k=Math.min(r,l1/2,l2/2);
    const p1={x:b.x+(a.x-b.x)/l1*k,y:b.y+(a.y-b.y)/l1*k},p2={x:b.x+(c.x-b.x)/l2*k,y:b.y+(c.y-b.y)/l2*k};
    d+=`L${p1.x},${p1.y}Q${b.x},${b.y} ${p2.x},${p2.y}`}
  const z=pts[pts.length-1];return d+'L'+z.x+','+z.y;
}

/* ========== simulation ========== */
function resetSim(){sim={v:{},ff:{}}}
function srcMap(){const m={};for(const w of C.wires){const k=w.to.g+':'+w.to.p;(m[k]=m[k]||[]).push(w.from.g+':'+w.from.p)}return m}
function settle(inVals){
  const v=sim.v,m=srcMap();
  inVals.forEach((x,i)=>v['I'+i+':0']=x);
  const rd=(id,p)=>{const s=m[id+':'+p];if(!s)return 0;return v[s[0]]|0};
  for(let it=0;it<80;it++){
    let ch=false;
    const caps=[];
    for(const g of C.gates)if(g.type==='DFF'){
      const st=sim.ff[g.id]||(sim.ff[g.id]={q:0,c:0});
      const c=rd(g.id,1);
      if(c&&!st.c)caps.push([st,rd(g.id,0)]);
      st.c=c;
    }
    for(const [st,d] of caps){if(st.q!==d){st.q=d;ch=true}}
    for(const g of C.gates){
      let outs;
      if(g.type==='DFF'){const st=sim.ff[g.id]||(sim.ff[g.id]={q:0,c:0});outs=[st.q,1-st.q]}
      else outs=GATES[g.type].f(gPins(g.type).i.map((_,p)=>rd(g.id,p)));
      outs.forEach((o,p)=>{const k=g.id+':'+p;if(v[k]!==o){v[k]=o;ch=true}});
    }
    if(!ch)return true;
  }
  return false;
}
function readOuts(){const m=srcMap(),o={};level.outs.forEach((k,i)=>{const s=m['O'+i+':0'];o[k]=s?(sim.v[s[0]]|0):0});return o}
function shorts(){const m=srcMap();return Object.keys(m).filter(k=>m[k].length>1)}
function vecInVals(row,c){const a=level.ins.map(k=>row.in[k]|0);if(level.clk)a.push(c);return a}

/* ========== render ========== */
const world=$('#world'), board=$('#board'), fxG=$('#fx');
let tmp=null, cut=null, ghost=null, hover=null;

function gateSVG(type,gost,extraCls){
  const h=GATES[type].h,P=gPins(type);
  let s='';
  // stubs
  P.i.forEach(y=>s+=`<path class="gst" d="M0,${y}H12"/>`);
  P.o.forEach(y=>s+=`<path class="gst" d="M48,${y}H60"/>`);
  const inv=['NOT','NAND','NOR','XNOR'].includes(type);
  if(type==='DFF'){
    s+=`<rect class="gb" x="12" y="0" width="36" height="60" rx="7"/>`;
    if(gost){
      s+=`<path class="gst" d="M24,0V60"/><text class="gl" x="36" y="17">T</text>`;
      s+=`<text class="gl s" x="18" y="24">D</text><text class="gl s" x="18" y="44">C</text>`;
      s+=`<path class="gst" d="M12,36L17,40L12,44" style="stroke-width:1.5"/>`;
      s+=`<circle class="gb" cx="52" cy="40" r="4"/>`;
    }else{
      s+=`<text class="gl s" x="21" y="24">D</text><path class="gst" d="M12,34L19,40L12,46" style="stroke-width:1.5"/>`;
      s+=`<text class="gl s" x="40" y="24">Q</text><text class="gl s" x="40" y="44"><tspan class="ov" style="text-decoration:overline">Q</tspan></text>`;
    }
    return s;
  }
  if(gost){
    s+=`<rect class="gb" x="12" y="0" width="36" height="${h}" rx="7"/>`;
    const L={NOT:'1',AND:'&',OR:'1',NAND:'&',NOR:'1',XOR:'=1',XNOR:'=1'}[type];
    s+=`<text class="gl" x="30" y="17">${L}</text>`;
    if(inv)s+=`<circle class="gb" cx="52" cy="20" r="4"/>`;
    return s;
  }
  const e=inv?6:0;
  if(type==='NOT'){s+=`<path class="gb" d="M14,4L42,20L14,36Z"/><circle class="gb" cx="46" cy="20" r="4"/>`;return s}
  if(type==='AND'||type==='NAND'){const r=20,x1=42-e-r+6;s+=`<path class="gb" d="M10,0H${x1}A20,20 0 0 1 ${x1},40H10Z"/>`}
  if(type==='OR'||type==='NOR'){const X=50-e;s+=`<path class="gb" d="M8,0Q${X-18},0 ${X},20Q${X-18},40 8,40Q18,20 8,0Z"/>`}
  if(type==='XOR'||type==='XNOR'){const X=50-e;s+=`<path class="gb" d="M13,0Q${X-16},0 ${X},20Q${X-16},40 13,40Q23,20 13,0Z"/><path class="gst" d="M6,0Q16,20 6,40"/>`}
  if(inv&&type!=='NOT')s+=`<circle class="gb" cx="${48-e+2}" cy="20" r="4"/>`;
  return s;
}
const pinIn=(x,y)=>`<path class="pin-in" d="M${x-1},${y-5}L${x+5},${y}L${x-1},${y+5}Z"/>`;
const pinOut=(x,y)=>`<circle class="pin-out" cx="${x}" cy="${y}" r="4.5"/>`;

function junctions(){
  const by={};
  for(const w of C.wires){const k=w.from.g+':'+w.from.p;(by[k]=by[k]||[]).push(wirePts(w))}
  const dots=[];
  for(const k in by){
    const L=by[k];if(L.length<2)continue;
    const cand=[];L.forEach(pl=>pl.slice(1,-1).forEach(p=>cand.push(p)));
    const seen=new Set();
    for(const P of cand){
      const key=P.x+','+P.y;if(seen.has(key))continue;seen.add(key);
      const dirs=new Set();let cnt=0;
      for(const pl of L){
        for(let i=0;i<pl.length-1;i++){
          const a=pl[i],b=pl[i+1];
          if(onSeg(P,a,b)&&!(b.x===P.x&&b.y===P.y)){
            cnt++;dirs.add(Math.sign(b.x-a.x)+':'+Math.sign(b.y-a.y));break;
          }
        }
      }
      if(cnt>=2&&dirs.size>=2)dots.push(P);
    }
  }
  return dots;
}
function onSeg(p,a,b){
  if(a.x===b.x)return p.x===a.x&&p.y>=Math.min(a.y,b.y)&&p.y<=Math.max(a.y,b.y);
  if(a.y===b.y)return p.y===a.y&&p.x>=Math.min(a.x,b.x)&&p.x<=Math.max(a.x,b.x);
  return false;
}

function render(){
  const z=view.z;
  world.setAttribute('transform',`translate(${view.x},${view.y}) scale(${z})`);fxG.setAttribute('transform',`translate(${view.x},${view.y}) scale(${z})`);
  $('#grid').setAttribute('patternTransform',`translate(${view.x},${view.y}) scale(${z})`);
  const gost=settings.gost, v=sim.v;
  let s='';
  // wires
  for(const w of C.wires){
    const d=roundD(wirePts(w)),val=v[w.from.g+':'+w.from.p]|0;
    s+=`<path class="w w${val}" d="${d}"/><path class="whit" data-wire="${w.id}" d="${d}"/><path class="wsel${sel&&sel.w===w.id?' on':''}" d="${d}"/>`;
  }
  for(const p of junctions())s+=`<circle class="jn" cx="${p.x}" cy="${p.y}" r="${settings.ww*.6+2.5}"/>`;
  // onboarding ghost
  if(level.id===1&&!C.wires.length&&!tmp){
    const a=pinPos('I0','o',0),b=pinPos('O0','i',0);
    s+=`<path class="onb" d="${toD(autoRoute(a,b))}"/>`;
  }
  // gates
  for(const g of C.gates){
    s+=`<g class="gate${sel&&sel.g===g.id?' sel':''}" data-gate="${g.id}" transform="translate(${g.x},${g.y})">`;
    s+=`<rect x="10" y="-4" width="40" height="${GATES[g.type].h+8}" fill="transparent"/>`;
    s+=gateSVG(g.type,gost);
    s+=`</g>`;
  }
  const sh=new Set(shorts());
  // pins of gates
  for(const g of C.gates){
    const P=gPins(g.type);
    P.i.forEach((y,p)=>{s+=pinIn(g.x,g.y+y);if(sh.has(g.id+':'+p))s+=`<circle class="short" cx="${g.x}" cy="${g.y+y}" r="10"/>`;s+=`<circle class="pin-hit" data-pin="${g.id}|i|${p}" cx="${g.x}" cy="${g.y+y}" r="9"/>`});
    P.o.forEach((y,p)=>{s+=pinOut(g.x+GW,g.y+y)+`<circle class="pin-hit" data-pin="${g.id}|o|${p}" cx="${g.x+GW}" cy="${g.y+y}" r="10"/>`});
  }
  // level inputs (flags)
  const ins=ioIns();
  ins.forEach((k,i)=>{
    const n=nodePos('I'+i),val=v['I'+i+':0']|0,isC=level.clk&&i===ins.length-1;
    const lit=val;
    s+=`<g class="flag" data-in="${i}"><rect x="${n.x-62}" y="${n.y-19}" width="74" height="38" rx="19" fill="${lit?'var(--acc)':'var(--paper)'}" stroke="var(--ink)" stroke-width="1.8"/>`;
    s+=`<circle cx="${lit?n.x-7:n.x-43}" cy="${n.y}" r="13" fill="${lit?'var(--ink)':'var(--card2)'}" style="transition:cx .15s"/>`;
    if(isC)s+=`<path d="${lit?`M${n.x-49},${n.y+4}h4v-8h5v8h5v-8h4`:`M${n.x-13},${n.y+4}h4v-8h5v8h5v-8h4`}" fill="none" stroke="${lit?'var(--acc)':'var(--ink)'}" stroke-width="1.6"/>`;
    s+=`<text class="lbl" x="${lit?n.x-43:n.x-7}" y="${n.y}" fill="var(--ink)" style="${isC?'display:none':''}">${subS(k)}</text>`;
    s+=`<text class="lbl" x="${lit?n.x-7:n.x-43}" y="${n.y}" fill="${lit?'var(--acc)':'var(--ink2)'}" style="font-size:13px">${isC?'C':val}</text></g>`;
    s+=`<path class="gst" d="M${n.x+12},${n.y}H${n.x+20}"/>`+pinOut(n.x+20,n.y)+`<circle class="pin-hit" data-pin="I${i}|o|0" cx="${n.x+20}" cy="${n.y}" r="11"/>`;
  });
  // outputs (lamps)
  const ov_=readOuts();
  level.outs.forEach((k,i)=>{
    const n=nodePos('O'+i),val=ov_[k];
    s+=`<path class="gst" d="M${n.x},${n.y}H${n.x+10}"/>`;
    if(val)s+=`<circle cx="${n.x+28}" cy="${n.y}" r="27" fill="var(--acc)" opacity=".35"/><circle cx="${n.x+28}" cy="${n.y}" r="34" fill="none" stroke="var(--acc)" stroke-width="1.5" opacity=".6"/>`;
    s+=`<circle cx="${n.x+28}" cy="${n.y}" r="19" fill="${val?'var(--acc)':'var(--paper)'}" stroke="var(--ink)" stroke-width="1.8"/>`;
    s+=`<text class="lbl" x="${n.x+28}" y="${n.y}" fill="var(--ink)">${subS(disp(k))}</text>`;
    s+=pinIn(n.x,n.y);
    if(sh.has('O'+i+':0'))s+=`<circle class="short" cx="${n.x}" cy="${n.y}" r="10"/>`;
    s+=`<circle class="pin-hit" data-pin="O${i}|i|0" cx="${n.x}" cy="${n.y}" r="11"/>`;
  });
  // temp wire
  if(tmp){
    const sp=pinPos(tmp.from.g,'o',tmp.from.p);
    let t=tmp.cur,pts=tmp.pts;
    if(hover&&hover.k==='i')t=pinPos(hover.g,'i',hover.p);
    s+=`<path class="w w${v[tmp.from.g+':'+tmp.from.p]|0} tmp" d="${roundD(route(sp,pts,t))}"/>`;
    pts.forEach(p=>s+=`<circle class="jn" cx="${p.x}" cy="${p.y}" r="3"/>`);
  }
  if(ghost)s+=`<g class="ghost" transform="translate(${ghost.x},${ghost.y})">${gateSVG(ghost.type,gost)}</g>`;
  if(cut&&cut.pts.length>1)s+=`<path class="cut" d="${toD(cut.pts.map(p=>({x:p.x,y:p.y})))}"/>`;
  world.innerHTML=s;
  board.classList.toggle('demo',demoOn);
  renderTable();
  $('#undo').disabled=!undoS.length;$('#redo').disabled=!redoS.length;
}

function update(){
  if(!demoOn){settle(liveIn)}
  render();
}

/* ========== chrome ========== */
function buildChrome(){
  $('#formula').innerHTML=mathHTML(tx(level.f))+(level.max?`<span class="lim">≤ ${level.max}</span>`:'');
  $('#lvNum').textContent=level.sandbox?'':level.id;
  $('#lvTitle').textContent=tx(level.t);
  $('#lvStars').innerHTML=level.sandbox?'':starsHTML((prog.lv[level.id]||{}).s||0);
  $('#taskText').innerHTML=mathHTML(tx(level.task));
  $('#hint').innerHTML=mathHTML(tx(level.hint));$('#hint').classList.remove('on');
  $('#hintBtn').style.display=level.hint?'':'none';$('#hintBtn').textContent=hintUsed||level.sandbox?ui('hint'):ui('hintCost');
  $('#verify').style.display=level.sandbox?'none':'';
  const pal=$('#palette');
  pal.innerHTML=level.gates.map(t=>`<div class="pi" data-type="${t}"><svg viewBox="-2 -2 64 ${GATES[t].h+4}" style="height:${t==='DFF'?44:32}px">${gateSVG(t,settings.gost)}</svg><span>${tx(GATES[t].n)}</span></div>`).join('')+(level.max?`<div class="pcount" id="pcount"></div>`:'');
  updCount();
}
function renderTable(){
  const w=$('#ttWrap'),card=$('#taskCard');
  if(level.sandbox||!level.vec.length){w.innerHTML='';card.classList.add('notable');card.style.display=level.f?'':'none';return}
  card.classList.remove('notable');card.style.display='';
  const ins=level.ins,outs=level.outs,isSeq=level.seq||level.clk,V=level.vec;
  const live=isSeq?-1:V.findIndex(r=>ins.every((k,i)=>r.in[k]===liveIn[i]));
  const cc=ri=>{const mk=rowMark&&rowMark[ri];return [ri===live&&!rowMark?'live':'',ri===demoRow?'cur':'',mk&&ri!==demoRow?(mk.ok?'ok':'bad'):''].join(' ')};
  const lab=k=>mathHTML(subH(esc(k)));
  let h='<table class="tt">';
  if(isSeq)h+=`<tr class="hn"><th>${level.clk?ui('tick'):ui('step')}</th>${V.map((_,ri)=>`<td data-row="${ri}">${ri+1}</td>`).join('')}</tr>`;
  ins.forEach(k=>h+=`<tr><th>${lab(k)}</th>${V.map((r,ri)=>`<td class="${cc(ri)}" data-row="${ri}">${r.in[k]}</td>`).join('')}</tr>`);
  outs.forEach((k,j)=>h+=`<tr class="out${j===0&&ins.length?' gap':''}"><th>${lab(disp(k))}</th>${V.map((r,ri)=>{const mk=rowMark&&rowMark[ri],bad=mk&&!mk.ok&&mk.act[k]!==r.out[k];
    return `<td class="${cc(ri)}${bad&&ri!==demoRow?' wrong':''}" data-row="${ri}">${r.out[k]}${bad?`<span class="act">${mk.act[k]}</span>`:''}</td>`}).join('')}</tr>`);
  w.innerHTML=h+'</table>';
}
$('#ttWrap').addEventListener('click',e=>{
  const tr=e.target.closest('tr[data-row]');if(!tr||demoOn||level.seq||level.clk)return;
  const r=level.vec[+tr.dataset.row];liveIn=ioIns().map(k=>r.in[k]|0);rowMark=null;update();
});
$('#hintBtn').onclick=e=>{e.stopPropagation();if(sheetH<160)setSheet(220);giveHint()};

/* sheet resize */
let sheetH=Math.min(store.get('ll_sheet',150),190);
function setSheet(h){sheetH=clamp(h,44,innerHeight*.7/UI());$('#sheet').style.height=sheetH+'px';$('#zoom').style.bottom=(sheetH+26)+'px';$('#zoom').style.right=(settings.bit==='off'?16:92)+'px';$('#mascot').style.bottom=(sheetH+28)+'px';document.documentElement.style.setProperty('--dock',(sheetH*UI()+14)+'px');store.set('ll_sheet',sheetH,true)}
setSheet(sheetH);
(()=>{const g=$('#grip');let sy=null,sh=0,moved=false;
  g.addEventListener('pointerdown',e=>{if(e.target.id==='hintBtn')return;sy=e.clientY;sh=sheetH;moved=false;g.setPointerCapture(e.pointerId)});
  g.addEventListener('pointermove',e=>{if(sy==null)return;if(Math.abs(e.clientY-sy)>3)moved=true;setSheet(sh+(sy-e.clientY)/UI())});
  g.addEventListener('pointerup',()=>{if(sy!=null&&!moved)setSheet(sheetH>60?44:210);sy=null});
})();

/* ========== view ========== */
function fit(){
  const pts=[];ioIns().forEach((_,i)=>{const n=nodePos('I'+i);pts.push({x:n.x-70,y:n.y-40},{x:n.x+20,y:n.y+40})});
  level.outs.forEach((_,i)=>{const n=nodePos('O'+i);pts.push({x:n.x,y:n.y-40},{x:n.x+60,y:n.y+40})});
  C.gates.forEach(g=>pts.push({x:g.x,y:g.y},{x:g.x+GW,y:g.y+GATES[g.type].h}));
  const x0=Math.min(...pts.map(p=>p.x)),x1=Math.max(...pts.map(p=>p.x)),y0=Math.min(...pts.map(p=>p.y)),y1=Math.max(...pts.map(p=>p.y));
  const L=level.gates.length?$('#palette').getBoundingClientRect().right+14:16,T=Math.max($('#top').getBoundingClientRect().bottom,$('#taskCard').style.display==='none'?0:$('#taskCard').getBoundingClientRect().bottom)+14,MW=0,W=innerWidth-L-24-MW,H=innerHeight-T-(sheetH+14)*UI()-24;
  const z=clamp(Math.min(W/(x1-x0+40),H/(y1-y0+40)),.3,1.6);
  view.z=z;view.x=L+(W-(x1-x0)*z)/2-x0*z;view.y=T+(H-(y1-y0)*z)/2-y0*z;
  render();
}
function zoomAt(f,cx,cy){const nz=clamp(view.z*f,.3,3);const k=nz/view.z;view.x=cx-(cx-view.x)*k;view.y=cy-(cy-view.y)*k;view.z=nz;render()}
$('#zIn').onclick=()=>zoomAt(1.2,innerWidth/2,innerHeight/2);
$('#zOut').onclick=()=>zoomAt(1/1.2,innerWidth/2,innerHeight/2);
$('#zFit').onclick=fit;
board.addEventListener('wheel',e=>{e.preventDefault();zoomAt(Math.exp(-e.deltaY*.0015),e.clientX,e.clientY)},{passive:false});
const toW=(cx,cy)=>({x:(cx-view.x)/view.z,y:(cy-view.y)/view.z});

/* ========== interaction ========== */
const ptrs=new Map();let act=null,pinch=null;
function hitInfo(target){
  const pin=target.closest&&target.closest('[data-pin]');
  if(pin){const [g,k,p]=pin.dataset.pin.split('|');return{type:'pin',g,k,p:+p}}
  const w=target.closest&&target.closest('[data-wire]');if(w)return{type:'wire',id:w.dataset.wire};
  const gt=target.closest&&target.closest('[data-gate]');if(gt)return{type:'gate',id:gt.dataset.gate};
  const f=target.closest&&target.closest('[data-in]');if(f)return{type:'in',i:+f.dataset.in};
  return{type:'empty'};
}
function nearestOnWire(w,p){
  const pl=wirePts(w);let best=null;
  for(let i=0;i<pl.length-1;i++){
    const a=pl[i],b=pl[i+1];let q;
    if(a.x===b.x)q={x:a.x,y:clamp(snap(p.y,10),Math.min(a.y,b.y),Math.max(a.y,b.y))};
    else q={x:clamp(snap(p.x,10),Math.min(a.x,b.x),Math.max(a.x,b.x)),y:a.y};
    const d=Math.hypot(q.x-p.x,q.y-p.y);if(!best||d<best.d)best={d,q,i};
  }
  return{pt:best.q,pre:pl.slice(1,best.i+1)};
}
function startWire(from,pts,cur){tmp={from,pts:pts.map(p=>({x:p.x,y:p.y})),cur,mode:'drag'};sfx('pick')}
function finishWire(to){
  if(!tmp)return;
  const f=tmp.from;
  if(!C.wires.some(w=>w.from.g===f.g&&w.from.p===f.p&&w.to.g===to.g&&w.to.p===to.p)){
    snapshot();
    C.wires.push({id:'w'+(nextId++),from:{g:f.g,p:f.p},to:{g:to.g,p:to.p},pts:tmp.pts});
    sfx('relay');badge('FIRST_WIRE');
    tmp=null;changed();
    {const q=pinPos(to.g,'i',to.p);fxRing(q.x,q.y)}
    if(shorts().length){sfx('spark');toast(ui('shortToast'));badge('SHORT');say([STORY.short],{hint:1})}
    return;
  }
  tmp=null;render();
}
function delWire(id){snapshot();C.wires=C.wires.filter(w=>w.id!==id);sfx('remove');changed()}
function atLimit(){if(level.max&&C.gates.length>=level.max){toast(ui('limitToast',{m:level.max}));say([STORY.over],{hint:1});return true}return false}
function updCount(){const el=$('#pcount');if(el){el.textContent=C.gates.length+' / '+level.max;el.classList.toggle('full',C.gates.length>=level.max)}
  const m=$('#stampTbl');if(!m)return;
  if(level.sandbox){m.innerHTML=`<div class="met"><b>${C.gates.length}</b><span>${ui('mGates')}</span></div>`;return}
  const best=(prog.lv[level.id]||{}).g;
  m.innerHTML=`<div class="met${level.max&&C.gates.length>level.max?' over':''}"><b>${C.gates.length}${level.max?`<small>/ ${level.max}</small>`:''}</b><span>${ui('mGates')}</span></div><div class="met"><b>${level.par}${best!=null&&best<999?`<small>${ui('mYours',{n:best})}</small>`:''}</b><span>${ui('mPar')}</span></div>`;
}
function disp(k){return (LANG==='en'&&level.dl&&level.dl[k])||k}
function delGate(id){{const g=C.gates.find(x=>x.id===id);if(g)fxRing(g.x+30,g.y+20,22,1)}snapshot();C.gates=C.gates.filter(g=>g.id!==id);C.wires=C.wires.filter(w=>w.from.g!==id&&w.to.g!==id);sel=null;sfx('remove');changed()}
function segX(a,b,c,d){
  const o=(p,q,r)=>Math.sign((q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x));
  return o(a,b,c)!==o(a,b,d)&&o(c,d,a)!==o(c,d,b);
}
function applyCut(){
  const cp=cut.pts;const hit=[];
  for(const w of C.wires){const pl=wirePts(w);
    outer:for(let i=0;i<cp.length-1;i++)for(let j=0;j<pl.length-1;j++)if(segX(cp[i],cp[i+1],pl[j],pl[j+1])){hit.push(w.id);break outer}}
  if(hit.length){snapshot();C.wires=C.wires.filter(w=>!hit.includes(w.id));sfx('remove');cut=null;changed()}else{cut=null;render()}
}

board.addEventListener('contextmenu',e=>e.preventDefault());
board.addEventListener('pointerdown',e=>{
  if(demoOn)return;
  ensureAudio();
  ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size===2){ // pinch
    const [a,b]=[...ptrs.values()];
    pinch={d:Math.hypot(a.x-b.x,a.y-b.y),cx:(a.x+b.x)/2,cy:(a.y+b.y)/2};
    if(act&&act.kind==='cut')cut=null;
    if(act&&act.kind==='wire'&&tmp&&tmp.mode==='drag')tmp=null;
    act=null;render();return;
  }
  const p=toW(e.clientX,e.clientY),h=hitInfo(e.target);
  const right=e.button===2,touch=e.pointerType==='touch';
  // click-mode wiring in progress
  if(tmp&&tmp.mode==='click'){
    if(right){tmp=null;render();return}
    if(h.type==='pin'&&h.k==='i'){finishWire(h);return}
    if(h.type==='pin'&&h.k==='o'){tmp=null;render();return}
    tmp.pts.push({x:snap(p.x,10),y:snap(p.y,10)});tmp.cur=p;render();return;
  }
  if(right){act={kind:'rclick',sx:e.clientX,sy:e.clientY,h};cut={pts:[p]};return}
  if(h.type==='pin'&&h.k==='o'){startWire({g:h.g,p:h.p},[],p);act={kind:'wire',sx:e.clientX,sy:e.clientY};render();return}
  if(h.type==='pin'&&h.k==='i'){ // pull existing wire off an input
    const w=C.wires.filter(w=>w.to.g===h.g&&w.to.p===h.p).pop();
    if(w){snapshot();C.wires=C.wires.filter(x=>x!==w);startWire(w.from,w.pts||[],p);act={kind:'wire',sx:e.clientX,sy:e.clientY,detached:true};changed();return}
    return;
  }
  if(h.type==='wire'){
    const w=C.wires.find(x=>x.id===h.id);const n=nearestOnWire(w,p);
    act={kind:'branch',sx:e.clientX,sy:e.clientY,w,n};return;
  }
  if(h.type==='gate'){
    const g=C.gates.find(x=>x.id===h.id);
    act={kind:'gate',g,ox:p.x-g.x,oy:p.y-g.y,sx:e.clientX,sy:e.clientY,moved:false};return;
  }
  if(h.type==='in'){act={kind:'toggle',i:h.i};return}
  if(touch){act={kind:'cut'};cut={pts:[p]};return}
  act={kind:'pan',sx:e.clientX,sy:e.clientY,vx:view.x,vy:view.y};board.classList.add('panning');
  if(sel){sel=null;render()}
});
window.addEventListener('pointermove',e=>{
  if(ptrs.has(e.pointerId))ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pinch&&ptrs.size===2){
    const [a,b]=[...ptrs.values()],d=Math.hypot(a.x-b.x,a.y-b.y),cx=(a.x+b.x)/2,cy=(a.y+b.y)/2;
    view.x+=cx-pinch.cx;view.y+=cy-pinch.cy;zoomAt(d/pinch.d,cx,cy);pinch={d,cx,cy};return;
  }
  const p=toW(e.clientX,e.clientY);
  if(ghost){ghost.x=snap(p.x-30);ghost.y=snap(p.y-GATES[ghost.type].h/2);render();return}
  if(tmp){
    tmp.cur=p;
    const el=document.elementFromPoint(e.clientX,e.clientY);const h=el?hitInfo(el):{type:'empty'};
    hover=h.type==='pin'?h:null;render();
  }
  if(!act)return;
  const dist=act.sx!=null?Math.hypot(e.clientX-act.sx,e.clientY-act.sy):99;
  if(act.kind==='pan'){view.x=act.vx+e.clientX-act.sx;view.y=act.vy+e.clientY-act.sy;render()}
  else if(act.kind==='gate'){
    if(!act.moved&&dist>4){act.moved=true;snapshot()}
    if(act.moved){act.g.x=snap(p.x-act.ox);act.g.y=snap(p.y-act.oy);render()}
  }else if(act.kind==='branch'&&dist>5){
    startWire(act.w.from,[...act.n.pre,act.n.pt],p);act={kind:'wire',sx:act.sx,sy:act.sy,branch:true};render();
  }else if(act.kind==='cut'||act.kind==='rclick'){cut.pts.push(p);if(act.kind==='rclick'&&dist>6)act.kind='cut';render()}
});
window.addEventListener('pointerup',e=>{
  ptrs.delete(e.pointerId);
  if(pinch){if(ptrs.size<2)pinch=null;return}
  if(ghost){
    const overBoard=document.elementFromPoint(e.clientX,e.clientY)===board||board.contains(document.elementFromPoint(e.clientX,e.clientY));
    if(overBoard&&!e.target.closest?.('#palette')){if(atLimit()){ghost=null;render();return}snapshot();C.gates.push({id:'g'+(nextId++),type:ghost.type,x:ghost.x,y:ghost.y});sfx('place');fxRing(ghost.x+30,ghost.y+GATES[ghost.type].h/2,22);ghost=null;changed();gatePlaced()}
    else{ghost=null;render()}
    return;
  }
  if(!act)return;
  const a=act;act=null;board.classList.remove('panning');
  const dist=a.sx!=null?Math.hypot(e.clientX-a.sx,e.clientY-a.sy):0;
  if(a.kind==='wire'){
    const el=document.elementFromPoint(e.clientX,e.clientY),h=el?hitInfo(el):{type:'empty'};
    if(h.type==='pin'&&h.k==='i'){finishWire(h);return}
    if(dist<6&&!a.branch){tmp.mode='click';render();return}
    if(h.type==='pin'||!tmp){tmp=null;render();return}
    const p=toW(e.clientX,e.clientY);tmp.pts.push({x:snap(p.x,10),y:snap(p.y,10)});tmp.mode='click';render();return;
  }
  if(a.kind==='branch'){sel={w:a.w.id};render();return}
  if(a.kind==='gate'){if(a.moved)changed();else{sel={g:a.g.id};render()}return}
  if(a.kind==='toggle'){liveIn[a.i]^=1;rowMark=null;sfx('toggle',liveIn[a.i]);update();return}
  if(a.kind==='rclick'){
    cut=null;
    if(a.h.type==='wire')return delWire(a.h.id);
    if(a.h.type==='gate')return delGate(a.h.id);
    render();return;
  }
  if(a.kind==='cut'){applyCut();return}
});
window.addEventListener('pointercancel',e=>{ptrs.delete(e.pointerId);act=null;pinch=null;cut=null;board.classList.remove('panning')});

$('#palette').addEventListener('pointerdown',e=>{
  const it=e.target.closest('.pi');if(!it||demoOn)return;ensureAudio();
  const p=toW(e.clientX,e.clientY);ghost={type:it.dataset.type,x:snap(p.x-30),y:snap(p.y-20),sx:e.clientX,sy:e.clientY};
});
$('#palette').addEventListener('pointerup',e=>{
  const it=e.target.closest('.pi');
  if(ghost&&it&&Math.hypot(e.clientX-ghost.sx,e.clientY-ghost.sy)<6){ // tap → place at free spot
    const c=toW(innerWidth/2,(innerHeight-sheetH*UI())/2+28);let x=snap(c.x-30),y=snap(c.y-20);
    while(C.gates.some(g=>Math.abs(g.x-x)<60&&Math.abs(g.y-y)<60))y+=80;
    if(atLimit()){ghost=null;return}
    snapshot();C.gates.push({id:'g'+(nextId++),type:ghost.type,x,y});fxRing(x+30,y+GATES[ghost.type].h/2,22);ghost=null;sfx('place');changed();gatePlaced();e.stopPropagation();
  }
});

window.addEventListener('keydown',e=>{
  if(e.key==='Escape'){if(tmp){tmp=null;render();return}if(!$('#ov').classList.contains('on'))openMenu('main');else if(level)closeMenu();return}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();return}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();redo();return}
  if((e.key==='Delete'||e.key==='Backspace')&&sel){if(sel.g)delGate(sel.g);else if(sel.w)delWire(sel.w);sel=null}
});
$('#undo').onclick=undo;$('#redo').onclick=redo;
$('#btnClear').onclick=()=>{if(!C.gates.length&&!C.wires.length)return;snapshot();C={gates:[],wires:[]};changed()};

let tT;function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('on');clearTimeout(tT);tT=setTimeout(()=>el.classList.remove('on'),2600)}

/* ========== verify / demo ========== */
$('#verify').onclick=async()=>{
  if(demoOn){demoSkip=true;return}
  if(shorts().length){toast(ui('shortFirst'));say([STORY.short],{hint:1});return}
  if(!C.wires.length){toast(ui('emptyToast'));say([STORY.empty],{hint:1});return}
  if(level.max&&C.gates.length>level.max){toast(ui('limitToast',{m:level.max}));say([STORY.over],{hint:1});return}
  hideBubble();
  ensureAudio();
  demoOn=true;demoSkip=false;rowMark=[];$('#verify').textContent=ui('skip');
  if(sheetH<120)setSheet(210);
  resetSim();
  const n=level.vec.length,dt=(n>32?90:n>8?260:n>4?420:600)*settings.demo;
  let fails=0;
  for(let ri=0;ri<n;ri++){
    const r=level.vec[ri];
    const ok_=settle(vecInVals(r,0));
    const act=readOuts();const ok=ok_&&level.outs.every(k=>act[k]===r.out[k]);
    if(!ok)fails++;
    rowMark[ri]={ok,act};demoRow=ri;
    if(level.clk)liveIn=vecInVals(r,0);else liveIn=vecInVals(r,0);
    if(!demoSkip){render();scrollRow(ri);sfx('tick',ok);await sleep(dt)}
    if(level.clk){settle(vecInVals(r,1));if(!demoSkip){sfx('clock');liveIn=vecInVals(r,1);render();await sleep(dt*.45)}}
  }
  demoOn=false;demoRow=-1;$('#verify').textContent=ui('verify');
  liveIn=ioIns().map(()=>0);resetSim();settle(liveIn);render();
  if(!fails){sfx('stamp',true);level.outs.forEach((_,i)=>{const n_=nodePos('O'+i);fxBits(n_.x+28,n_.y)});onSolved()}
  else{sfx('stamp',false);onFailed(fails,n)}
};
function scrollRow(ri){const td=$('#ttWrap td[data-row="'+ri+'"]');if(td)td.scrollIntoView({block:'nearest',inline:'nearest'})}
/* ========== audio: everything is synthesized, no sound files ==========
   Buses: music (lab hum + generative theme per chapter), sfx (materials: relay, toggle switch,
   stamp, buzzer, spark), voice (Bit's chatter). A compressor glues the mix; sound fades when hidden. */
let AC=null,master,mBus,sBus,vBus,musicT=null,noiseBuf=null;
const mtof=m=>440*Math.pow(2,(m-69)/12);
function ensureAudio(){
  if(AC){if(AC.state==='suspended')AC.resume();return}
  try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){return}
  master=AC.createGain();
  const comp=AC.createDynamicsCompressor();comp.threshold.value=-20;comp.ratio.value=3;comp.attack.value=.004;comp.release.value=.2;
  master.connect(comp);comp.connect(AC.destination);
  sBus=AC.createGain();sBus.connect(master);
  vBus=AC.createGain();vBus.connect(master);
  const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2200;lp.Q.value=.4;
  const dl=AC.createDelay(2);dl.delayTime.value=.42;const fb=AC.createGain();fb.gain.value=.3;const dlf=AC.createBiquadFilter();dlf.type='lowpass';dlf.frequency.value=1500;
  mBus=AC.createGain();mBus.gain.value=0;mBus.connect(lp);lp.connect(master);lp.connect(dl);dl.connect(dlf);dlf.connect(fb);fb.connect(dl);dlf.connect(master);
  noiseBuf=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  startMusic();musicGain();
  document.addEventListener('visibilitychange',()=>{if(AC)master.gain.setTargetAtTime(document.hidden?0:1,AC.currentTime,.25)});
}
function musicGain(){if(!AC)return;const t=AC.currentTime;
  mBus.gain.setTargetAtTime(settings.musicVol/100*.9,t,.8);sBus.gain.setTargetAtTime(settings.sfxVol/100,t,.05);vBus.gain.setTargetAtTime((settings.voiceVol==null?70:settings.voiceVol)/100,t,.05)}
function env(g,t,a,peak,dur){g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+dur)}
function osc(bus,type,f,t,dur,peak,a=.004,f2){const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);env(g,t,a,peak,dur);o.connect(g);g.connect(bus);o.start(t);o.stop(t+dur+.05)}
function noise(bus,t,dur,peak,ft,freq,q=1,a=.002){const s=AC.createBufferSource();s.buffer=noiseBuf;const f=AC.createBiquadFilter();f.type=ft;f.frequency.value=freq;f.Q.value=q;const g=AC.createGain();env(g,t,a,peak,dur);s.connect(f);f.connect(g);g.connect(bus);s.start(t,Math.random()*.6);s.stop(t+dur+.05)}
const SND={
  pick(){const t=AC.currentTime;noise(sBus,t,.018,.22,'highpass',4500,.8)},                                   // probe touches a pin
  relay(){const t=AC.currentTime;noise(sBus,t,.02,.55,'bandpass',3400,5);noise(sBus,t+.022,.035,.35,'bandpass',1900,7);osc(sBus,'triangle',150,t,.05,.1)}, // wire lands: relay armature + contact
  toggle(on){const t=AC.currentTime;noise(sBus,t,.025,.5,'bandpass',on?2900:2100,4);osc(sBus,'square',on?1100:700,t,.022,.035)}, // toggle switch
  place(){const t=AC.currentTime;osc(sBus,'sine',190,t,.13,.4,.002,70);noise(sBus,t,.05,.2,'lowpass',900,.7)}, // part set on the board
  remove(){const t=AC.currentTime;osc(sBus,'sine',300,t,.1,.2,.002,110);noise(sBus,t,.07,.16,'bandpass',1300,1)},
  tick(ok){const t=AC.currentTime;noise(sBus,t,.016,.3,'bandpass',ok?2500:1400,5);if(!ok)osc(sBus,'sawtooth',110,t,.1,.05)}, // one row of the test
  clock(){const t=AC.currentTime;noise(sBus,t,.012,.18,'highpass',5200,1)},
  stamp(ok){const t=AC.currentTime;
    noise(sBus,t,.11,.12,'bandpass',700,.7,.08);                      // swing
    osc(sBus,'sine',120,t+.11,.28,.8,.002,42);noise(sBus,t+.11,.09,.55,'lowpass',650,.7);noise(sBus,t+.12,.14,.16,'highpass',3200,.5); // thud on paper
    if(ok){[0,4,7,12].forEach((s,i)=>osc(sBus,'triangle',mtof(76+s),t+.34+i*.07,.9,.07,.004));osc(sBus,'sine',mtof(100),t+.62,1.6,.025,.002)} // lamps come on
    else{osc(sBus,'square',98,t+.36,.4,.05,.01);osc(sBus,'square',92.5,t+.36,.4,.045,.01)}},         // buzzer
  spark(){const t=AC.currentTime;for(let i=0;i<7;i++)noise(sBus,t+i*.028+Math.random()*.02,.025,.45,'highpass',2800+Math.random()*3500,1);osc(sBus,'sawtooth',55,t,.35,.07)},
  badge(){const t=AC.currentTime;[84,88,91,96].forEach((m,i)=>osc(sBus,'triangle',mtof(m),t+i*.055,.55,.05,.003))},
  rank(){const t=AC.currentTime;[60,64,67,72,76].forEach((m,i)=>osc(sBus,'triangle',mtof(m),t+i*.08,1,.06,.004));osc(sBus,'sine',mtof(48),t,1.4,.08,.01)},
  ui(){const t=AC.currentTime;noise(sBus,t,.012,.22,'bandpass',3600,3)},
  qok(){const t=AC.currentTime;osc(sBus,'triangle',mtof(79),t,.25,.07);osc(sBus,'triangle',mtof(84),t+.07,.35,.07)},
  qbad(){const t=AC.currentTime;osc(sBus,'square',196,t,.18,.04,.005,150)}
};
function sfx(name,a){if(!AC||!settings.sfxVol||!SND[name])return;try{SND[name](a)}catch(e){}}
// Bit's voice: short filtered square blips, pitch follows mood and the letter
function bitVoice(ch,mood){
  if(!AC||!(settings.voiceVol==null?70:settings.voiceVol)||!/[a-zа-яё0-9]/i.test(ch))return;
  const t=AC.currentTime,base={happy:430,smug:250,sad:190,shock:520,think:300}[mood]||290,f=base*(1+(ch.toLowerCase().charCodeAt(0)*7%12)/36);
  const o=AC.createOscillator(),g=AC.createGain(),bp=AC.createBiquadFilter();o.type='square';o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*.92,t+.05);
  bp.type='bandpass';bp.frequency.value=f*2.6;bp.Q.value=3;env(g,t,.004,.09,.05);o.connect(bp);bp.connect(g);g.connect(vBus);o.start(t);o.stop(t+.08);
}

/* ----- music: mains hum + generative theme; key, mode and tempo depend on the chapter ----- */
const SCALES={dor:[0,2,3,5,7,9,10],lyd:[0,2,4,6,7,9,11],min:[0,2,3,5,7,8,10],mix:[0,2,4,5,7,9,10],maj:[0,2,4,5,7,9,11]};
const CHM={1:[57,'dor',84],2:[50,'dor',80],3:[48,'lyd',90],4:[52,'min',74],5:[53,'lyd',88],6:[55,'mix',96],7:[46,'maj',86],8:[48,'min',100],9:[54,'min',70],10:[57,'maj',92]};
const PROG=[0,5,3,4];
const mus={ch:1,step:0,next:0,dens:.55};
function musicChapter(ch,calm){mus.ch=CHM[ch]?ch:1;mus.dens=calm?.25:.55}
const deg=(sc,root,d)=>{const s=SCALES[sc],o=Math.floor(d/7);return root+s[((d%7)+7)%7]+12*o};
function pad(f,t,dur,v){[-4,4].forEach(dt=>{const o=AC.createOscillator(),g=AC.createGain(),lp=AC.createBiquadFilter();o.type='sawtooth';o.frequency.value=f;o.detune.value=dt;lp.type='lowpass';lp.frequency.value=700;
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+1.4);g.gain.setValueAtTime(v,t+dur-1.2);g.gain.linearRampToValueAtTime(.0001,t+dur);o.connect(lp);lp.connect(g);g.connect(mBus);o.start(t);o.stop(t+dur+.05)})}
function pluck(f,t,dur,v,type){const o=AC.createOscillator(),g=AC.createGain(),lp=AC.createBiquadFilter();o.type=type;o.frequency.value=f;lp.type='lowpass';lp.frequency.setValueAtTime(f*6,t);lp.frequency.exponentialRampToValueAtTime(f*1.2,t+dur);env(g,t,.004,v,dur);o.connect(lp);lp.connect(g);g.connect(mBus);o.start(t);o.stop(t+dur+.05)}
function hum(){[[50,.010],[100,.006],[150,.003]].forEach(([f,v])=>{const o=AC.createOscillator(),g=AC.createGain();o.frequency.value=f;g.gain.value=v;o.connect(g);g.connect(mBus);o.start()})}
function playStep(st,t,root,sc,sp){
  const bar=Math.floor(st/16),cd=PROG[bar%4],s=st%16;
  if(s===0){[0,2,4].forEach(k=>pad(mtof(deg(sc,root,cd+k)),t,sp*16+.6,.012));pluck(mtof(deg(sc,root-12,cd)),t,.9,.07,'sine')}
  if(s===8)pluck(mtof(deg(sc,root-12,cd+4)),t,.6,.045,'sine');
  const pat=[1,0,.35,0,.7,0,.3,.15,.85,0,.4,0,.6,.2,.3,0];
  if(Math.random()<pat[s]*mus.dens){const k=[0,2,4,7,9][Math.floor(Math.random()*5)];pluck(mtof(deg(sc,root+12,cd+k)),t,.4,.035,'triangle')}
  if(s%4===0){const n=AC.createBufferSource();n.buffer=noiseBuf;const f=AC.createBiquadFilter();f.type='highpass';f.frequency.value=6000;const g=AC.createGain();env(g,t,.001,.02,.02);n.connect(f);f.connect(g);g.connect(mBus);n.start(t,Math.random()*.5);n.stop(t+.04)}
}
function startMusic(){
  hum();mus.next=AC.currentTime+.3;
  musicT=setInterval(()=>{if(!AC||AC.state!=='running')return;const [root,sc,bpm]=CHM[mus.ch],sp=60/bpm/4;
    if(mus.next<AC.currentTime)mus.next=AC.currentTime+.05;
    while(mus.next<AC.currentTime+.3){playStep(mus.step,mus.next,root,sc,sp);mus.next+=sp;mus.step=(mus.step+1)%64}},100);
}

