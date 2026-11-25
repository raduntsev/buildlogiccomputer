
"use strict";
/* ========== helpers ========== */
const $=s=>document.querySelector(s);
const GRID=20, GW=60;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const snap=(v,s=GRID)=>Math.round(v/s)*s;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const store={
  get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
};
const ov=s=>`<span class="ov">${s}</span>`;
const subH=s=>String(s).replace(/^(.+?)(\d+)$/,'$1<sub>$2</sub>');
const subS=s=>String(s).replace(/^(.+?)(\d+)$/,'$1<tspan font-size="10" dy="4">$2</tspan>');

/* ========== gates ========== */
const GATES={
  NOT :{n:'НЕ',      ins:1,h:40,f:i=>[1-i[0]]},
  AND :{n:'И',       ins:2,h:40,f:i=>[i[0]&i[1]]},
  OR  :{n:'ИЛИ',     ins:2,h:40,f:i=>[i[0]|i[1]]},
  NAND:{n:'И-НЕ',    ins:2,h:40,f:i=>[1-(i[0]&i[1])]},
  NOR :{n:'ИЛИ-НЕ',  ins:2,h:40,f:i=>[1-(i[0]|i[1])]},
  XOR :{n:'Искл. ИЛИ',ins:2,h:40,f:i=>[i[0]^i[1]]},
  XNOR:{n:'Равнозн.', ins:2,h:40,f:i=>[1-(i[0]^i[1])]},
  DFF :{n:'D-тригг.', ins:2,h:60,seq:1}
};
const ALL_GATES=Object.keys(GATES);
function gPins(type){
  if(type==='DFF') return {i:[20,40],o:[20,40]};
  return {i:GATES[type].ins===1?[20]:[10,30],o:[20]};
}

/*LEVELS*/
/* ========== state ========== */
const RM=(()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}})();
const settings=Object.assign({ui:'auto',win:'auto',fs:false,ww:5,grid:'dots',hc:false,calm:RM,musicVol:50,sfxVol:70,gost:true,bit:'all',txt:16,demo:1},store.get('ll_set',{}));
if(settings.music===false&&settings.musicVol==null)settings.musicVol=0;
if(settings.music===false){settings.musicVol=0;delete settings.music}else delete settings.music;
if(settings.sfx===false)settings.sfxVol=0;delete settings.sfx;
let seen=new Set(store.get('ll_seen',[]));
let done=new Set(store.get('ll_done',[]));
let saves=store.get('ll_saves',{});
let level=null, C={gates:[],wires:[]}, nextId=1;
let undoS=[],redoS=[];
let liveIn=[], sim={v:{},ff:{}};
let rowMark=null, demoRow=-1, demoOn=false, demoSkip=false;
let view={x:0,y:0,z:1};
let sel=null;

function ioIns(){const a=level.ins.slice();if(level.clk)a.push('C');return a}
function ioY(n,i){return (i-(n-1)/2)*80}
const OUTX=()=>innerWidth<640?(level.sandbox?360:300):level.sandbox?640:Math.min(700,260+60*(level.ins.length+level.outs.length+(level.clk?1:0))+(level.gates.length>2?60:0));

function save(){store.set('ll_saves',saves);store.set('ll_done',[...done]);store.set('ll_set',settings);store.set('ll_seen',[...seen])}
function persist(){saves[level.id]={gates:C.gates,wires:C.wires};save()}

function loadLevel(l){
  level=l;$('#result').classList.remove('on');
  const s=saves[l.id];
  C=s?JSON.parse(JSON.stringify(s)):{gates:[],wires:[]};
  nextId=1+Math.max(0,...C.gates.map(g=>+g.id.slice(1)),...C.wires.map(w=>+w.id.slice(1)));
  undoS=[];redoS=[];sel=null;rowMark=null;
  liveIn=ioIns().map(()=>0);
  resetSim();
  store.set('ll_last',l.id);
  buildChrome();
  fit();
  update();
  hintGiven=false;idleShown=false;resetIdle();
  levelIntro();
}

/* ========== history ========== */
function snapshot(){undoS.push(JSON.stringify(C));if(undoS.length>200)undoS.shift();redoS=[]}
function undo(){if(!undoS.length)return;redoS.push(JSON.stringify(C));C=JSON.parse(undoS.pop());changed()}
function redo(){if(!redoS.length)return;undoS.push(JSON.stringify(C));C=JSON.parse(redoS.pop());changed()}
function changed(){rowMark=null;persist();resetSim();update();resetIdle()}

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
    s+=`<rect class="gb" x="12" y="0" width="36" height="60"/>`;
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
    s+=`<rect class="gb" x="12" y="0" width="36" height="${h}"/>`;
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
    const d=toD(wirePts(w)),val=v[w.from.g+':'+w.from.p]|0;
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
    s+=`<g class="flag" data-in="${i}"><path d="M${n.x-44},${n.y-17}H${n.x}L${n.x+12},${n.y}L${n.x},${n.y+17}H${n.x-44}Z" fill="${val?'var(--acc)':'var(--paper)'}"/>`;
    if(isC)s+=`<path d="M${n.x-36},${n.y+6}h6v-12h8v12h8v-12h6" fill="none" stroke="${val?'#fff':'var(--ink)'}" stroke-width="1.6" style="stroke-width:1.6"/>`;
    s+=`<text class="lbl" x="${n.x-(isC?50:16)}" y="${n.y}" ${isC?'text-anchor="end"':''} fill="${val&&!isC?'#fff':'var(--ink)'}">${isC?'C':subS(k)}</text>`;
    s+=`<text class="lbl" x="${n.x-60}" y="${n.y}" style="font-size:13px;display:${isC?'none':'inline'}" fill="var(--mute)">${val}</text></g>`;
    s+=`<path class="gst" d="M${n.x+12},${n.y}H${n.x+20}"/>`+pinOut(n.x+20,n.y)+`<circle class="pin-hit" data-pin="I${i}|o|0" cx="${n.x+20}" cy="${n.y}" r="11"/>`;
  });
  // outputs (lamps)
  const ov_=readOuts();
  level.outs.forEach((k,i)=>{
    const n=nodePos('O'+i),val=ov_[k];
    s+=`<path class="gst" d="M${n.x},${n.y}H${n.x+10}"/>`;
    if(val)s+=`<circle cx="${n.x+28}" cy="${n.y}" r="26" fill="var(--acc)" opacity=".16"/>`;
    s+=`<circle cx="${n.x+28}" cy="${n.y}" r="18" fill="${val?'var(--acc)':'var(--paper)'}" stroke="var(--ink)" stroke-width="2"/>`;
    s+=`<text class="lbl" x="${n.x+28}" y="${n.y}" fill="${val?'#fff':'var(--ink)'}">${subS(k)}</text>`;
    s+=pinIn(n.x,n.y);
    if(sh.has('O'+i+':0'))s+=`<circle class="short" cx="${n.x}" cy="${n.y}" r="10"/>`;
    s+=`<circle class="pin-hit" data-pin="O${i}|i|0" cx="${n.x}" cy="${n.y}" r="11"/>`;
  });
  // temp wire
  if(tmp){
    const sp=pinPos(tmp.from.g,'o',tmp.from.p);
    let t=tmp.cur,pts=tmp.pts;
    if(hover&&hover.k==='i')t=pinPos(hover.g,'i',hover.p);
    s+=`<path class="w w${v[tmp.from.g+':'+tmp.from.p]|0} tmp" d="${toD(route(sp,pts,t))}"/>`;
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
  $('#formula').innerHTML=level.f.replace(/⊕/g,'<span class="op">⊕</span>');
  $('#lvNum').textContent=level.sandbox?'':level.id;
  $('#lvTitle').textContent=level.t;
  $('#taskText').innerHTML=level.task;
  $('#hint').innerHTML=level.hint||'';$('#hint').classList.remove('on');
  $('#hintBtn').style.display=level.hint?'':'none';
  $('#verify').style.display=level.sandbox?'none':'';
  const pal=$('#palette');
  pal.innerHTML=level.gates.map(t=>`<div class="pi" data-type="${t}"><svg viewBox="-2 -2 64 ${GATES[t].h+4}" style="height:${t==='DFF'?44:32}px">${gateSVG(t,settings.gost)}</svg><span>${GATES[t].n}</span></div>`).join('');
}
function renderTable(){
  const w=$('#ttWrap');
  if(level.sandbox||!level.vec.length){w.innerHTML='';return}
  const ins=level.ins,outs=level.outs,isSeq=level.seq||level.clk;
  let h='<table class="tt"><tr>'+(isSeq?'<th class="n">'+(level.clk?'такт':'шаг')+'</th>':'')+ins.map(k=>`<th>${subH(k)}</th>`).join('')+outs.map((k,j)=>`<th class="${j===0&&ins.length?'gap':''}">${subH(k)}</th>`).join('')+'</tr>';
  const live=isSeq?-1:level.vec.findIndex(r=>ins.every((k,i)=>r.in[k]===liveIn[i]));
  level.vec.forEach((r,ri)=>{
    const mk=rowMark&&rowMark[ri];
    const cls=[ri===live&&!rowMark?'live':'',ri===demoRow?'cur':'',mk?(mk.ok?'ok':'bad'):''].join(' ');
    h+=`<tr class="${cls}" data-row="${ri}">`+(isSeq?`<td class="n">${ri+1}</td>`:'')+ins.map(k=>`<td>${r.in[k]}</td>`).join('')+
      outs.map((k,j)=>`<td class="${j===0&&ins.length?'gap':''}">${r.out[k]}${mk&&!mk.ok&&mk.act[k]!==r.out[k]?`<span class="act">${mk.act[k]}</span>`:''}</td>`).join('')+'</tr>';
  });
  w.innerHTML=h+'</table>';
}
$('#ttWrap').addEventListener('click',e=>{
  const tr=e.target.closest('tr[data-row]');if(!tr||demoOn||level.seq||level.clk)return;
  const r=level.vec[+tr.dataset.row];liveIn=ioIns().map(k=>r.in[k]|0);rowMark=null;update();
});
$('#hintBtn').onclick=e=>{e.stopPropagation();$('#hint').classList.toggle('on');if(sheetH<160)setSheet(220);if($('#hint').classList.contains('on'))giveHint()};

/* sheet resize */
let sheetH=store.get('ll_sheet',innerWidth<640?150:210);
function setSheet(h){sheetH=clamp(h,44,innerHeight*.7/UI());$('#sheet').style.height=sheetH+'px';$('#zoom').style.bottom=(sheetH+12)+'px';$('#mascot').style.bottom=(sheetH+54)+'px';store.set('ll_sheet',sheetH)}
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
  const L=level.gates.length?$('#palette').getBoundingClientRect().right+14:16,T=$('#top').getBoundingClientRect().height+8,MW=settings.bit==='off'?0:$('#bit').getBoundingClientRect().width+18,W=innerWidth-L-24-MW,H=innerHeight-T-sheetH*UI()-24;
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
function startWire(from,pts,cur){tmp={from,pts:pts.map(p=>({x:p.x,y:p.y})),cur,mode:'drag'};sfx(660,.04)}
function finishWire(to){
  if(!tmp)return;
  const f=tmp.from;
  if(!C.wires.some(w=>w.from.g===f.g&&w.from.p===f.p&&w.to.g===to.g&&w.to.p===to.p)){
    snapshot();
    C.wires.push({id:'w'+(nextId++),from:{g:f.g,p:f.p},to:{g:to.g,p:to.p},pts:tmp.pts});
    sfx(880,.05);
    tmp=null;changed();
    {const q=pinPos(to.g,'i',to.p);fxRing(q.x,q.y)}
    if(shorts().length){toast('Два провода на одном входе — короткое замыкание');say([STORY.short],{hint:1})}
    return;
  }
  tmp=null;render();
}
function delWire(id){snapshot();C.wires=C.wires.filter(w=>w.id!==id);sfx(220,.06);changed()}
function delGate(id){{const g=C.gates.find(x=>x.id===id);if(g)fxRing(g.x+30,g.y+20,22,1)}snapshot();C.gates=C.gates.filter(g=>g.id!==id);C.wires=C.wires.filter(w=>w.from.g!==id&&w.to.g!==id);sel=null;sfx(220,.06);changed()}
function segX(a,b,c,d){
  const o=(p,q,r)=>Math.sign((q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x));
  return o(a,b,c)!==o(a,b,d)&&o(c,d,a)!==o(c,d,b);
}
function applyCut(){
  const cp=cut.pts;const hit=[];
  for(const w of C.wires){const pl=wirePts(w);
    outer:for(let i=0;i<cp.length-1;i++)for(let j=0;j<pl.length-1;j++)if(segX(cp[i],cp[i+1],pl[j],pl[j+1])){hit.push(w.id);break outer}}
  if(hit.length){snapshot();C.wires=C.wires.filter(w=>!hit.includes(w.id));sfx(220,.06);cut=null;changed()}else{cut=null;render()}
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
    if(overBoard&&!e.target.closest?.('#palette')){snapshot();C.gates.push({id:'g'+(nextId++),type:ghost.type,x:ghost.x,y:ghost.y});sfx(520,.05);fxRing(ghost.x+30,ghost.y+GATES[ghost.type].h/2,22);ghost=null;changed()}
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
  if(a.kind==='toggle'){liveIn[a.i]^=1;rowMark=null;sfx(liveIn[a.i]?740:500,.04);update();return}
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
    snapshot();C.gates.push({id:'g'+(nextId++),type:ghost.type,x,y});fxRing(x+30,y+GATES[ghost.type].h/2,22);ghost=null;sfx(520,.05);changed();e.stopPropagation();
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
  if(shorts().length){toast('Сначала уберите короткое замыкание');say([STORY.short],{hint:1});return}
  if(!C.wires.length){toast('Схема пуста');say([STORY.empty],{hint:1});return}
  hideBubble();
  ensureAudio();
  demoOn=true;demoSkip=false;rowMark=[];$('#verify').textContent='Пропустить';
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
    if(!demoSkip){render();scrollRow(ri);sfx(ok?620:240,.05,ok?'sine':'square',.025);await sleep(dt)}
    if(level.clk){settle(vecInVals(r,1));if(!demoSkip){liveIn=vecInVals(r,1);render();await sleep(dt*.45)}}
  }
  demoOn=false;demoRow=-1;$('#verify').textContent='Проверить';
  liveIn=ioIns().map(()=>0);resetSim();settle(liveIn);render();
  if(!fails){
    const first=!done.has(level.id);done.add(level.id);save();chime();
    showResult(true,`Элементов: ${C.gates.length}`+(first?'':' · уровень уже был пройден'));
    level.outs.forEach((_,i)=>{const n_=nodePos('O'+i);fxBits(n_.x+28,n_.y)});
    const lines=[{t:pick(STORY.win),m:'happy'}];
    if(first&&LV.filter(l=>l.ch===level.ch).every(l=>done.has(l.id)))lines.push({t:STORY.chDone[level.ch],m:'happy'});
    if(first&&LV.every(l=>done.has(l.id)))lines.push({t:STORY.final,m:'happy',wave:1});
    say(lines);
  }else{sfx(180,.18,'triangle',.05);showResult(false,`Не совпало строк: ${fails} из ${n}`);say([{t:pick(STORY.fail),m:'sad'}])}
};
function scrollRow(ri){const tr=$('#ttWrap tr[data-row="'+ri+'"]');if(tr)tr.scrollIntoView({block:'nearest'})}
function showResult(ok,sub){
  $('#resTitle').textContent=ok?'Верно':'Есть расхождения';
  $('#resSub').textContent=sub;
  const nx=LV.find(l=>l.id>level.id&&available(l)&&!done.has(l.id))||LV.find(l=>l.id===level.id+1);
  $('#resBtns').innerHTML=ok?`<button class="tbtn" id="rStay">Остаться</button><button class="tbtn" id="rTree">Уровни</button>${nx?'<button class="tbtn primary" id="rNext">Дальше →</button>':''}`:`<button class="tbtn primary" id="rStay">Исправить</button>`;
  $('#result').classList.add('on');
  $('#rStay').onclick=()=>$('#result').classList.remove('on');
  if(ok){$('#rTree').onclick=()=>{$('#result').classList.remove('on');openMenu('levels')};if(nx)$('#rNext').onclick=()=>{$('#result').classList.remove('on');loadLevel(nx)}}
}

/* ========== menu ========== */
function available(l){return l.req.every(r=>done.has(r))}
function openMenu(s){
  $('#ov').classList.add('on');
  document.querySelectorAll('.scr').forEach(x=>x.classList.remove('on'));
  $({main:'#scrMain',levels:'#scrLevels',settings:'#scrSettings',about:'#scrAbout'}[s]).classList.add('on');
  if(s!=='main')hideBubble();
  if(s==='levels')drawTree();
  if(s==='settings')drawSettings();
}
function closeMenu(){$('#ov').classList.remove('on');hideBubble();levelIntro()}
$('#btnMenu').onclick=()=>openMenu('main');
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>{
  ensureAudio();sfx(560,.03);
  const g=b.dataset.go;
  if(g==='continue'){if(!level||level.sandbox){const id=store.get('ll_last',1);loadLevel(LV.find(l=>l.id===id)||LV[0])}closeMenu();return}
  if(g==='sandbox'){loadLevel(SANDBOX);closeMenu();return}
  openMenu(g);
}));
/*STORY*/
/* ========== mascot ========== */
const Bit={q:[],timer:null,typer:null,typing:false,mood:'idle'};
let hintGiven=false,idleShown=false,idleT=null;
function bitSVG(m){
  const ink='var(--ink)',acc='var(--acc)';
  let eye,mouth;
  if(m==='happy'){eye=`<path d="M29,46 Q40,31 51,46" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`;}
  else if(m==='shock'){eye=`<circle cx="40" cy="41" r="15" fill="var(--paper)" stroke="${ink}" stroke-width="2.5"/><circle cx="40" cy="41" r="3.2" fill="${ink}"/>`;}
  else{
    const px=m==='think'?45:40,py=m==='think'?37:43,lit=m!=='sad';
    eye=`<g class="eye"><circle cx="40" cy="42" r="12" fill="${lit?'var(--acc-soft)':'var(--paper)'}" stroke="${ink}" stroke-width="2.5"/><circle cx="${px}" cy="${py}" r="5" fill="${ink}"/>${m==='sad'?`<path d="M28,42 A12,12 0 0 1 52,42 Z" fill="${ink}"/>`:''}</g>`;
  }
  mouth={idle:`<path d="M35,63H45" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/>`,
    talk:`<path d="M35,63H45" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/><ellipse class="m-open" cx="40" cy="63" rx="4.5" ry="3.5" fill="${ink}"/>`,
    happy:`<path d="M33,60 Q40,69 47,60" fill="none" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/>`,
    sad:`<path d="M34,66 Q40,60 46,66" fill="none" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/>`,
    think:`<path d="M36,64 Q40,61 45,63" fill="none" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/>`,
    shock:`<circle cx="40" cy="64" r="3.5" fill="none" stroke="${ink}" stroke-width="2.5"/>`}[m];
  const dot=m==='happy'||m==='talk'?acc:m==='shock'?'var(--bad-ink)':ink;
  return `<path d="M40,20V9" stroke="${ink}" stroke-width="2.5"/>
<circle class="${m==='talk'||m==='happy'?'spark':''}" cx="40" cy="6" r="4.5" fill="${dot}"/>
${m==='think'?`<text x="52" y="13" font-family="var(--font)" font-weight="600" font-size="14" fill="${acc}">?</text>`:''}
${m==='happy'?`<text x="54" y="12" font-family="var(--font)" font-weight="600" font-size="12" fill="${acc}">1</text>`:''}
${m==='sad'?`<text x="52" y="13" font-family="var(--font)" font-weight="600" font-size="12" fill="var(--mute)">0</text>`:''}
<path d="M14,50H6" stroke="${ink}" stroke-width="2.5"/><circle cx="5" cy="50" r="3.2" fill="${ink}"/>
<g class="arm-r"><path d="M66,50H74" stroke="${ink}" stroke-width="2.5"/><circle cx="75" cy="50" r="3.2" fill="${ink}"/></g>
<path d="M31,72V86M49,72V86" stroke="${ink}" stroke-width="2.5"/>
<path d="M25,90L31,86L37,90ZM43,90L49,86L55,90Z" fill="${ink}"/>
<rect x="14" y="20" width="52" height="52" fill="var(--paper)" stroke="${ink}" stroke-width="2.5"/>
<path d="M14,27H66" stroke="${ink}" stroke-width="1" opacity=".25"/>
${eye}${mouth}`;
}
function bitMood(m){Bit.mood=m;$('#bit').innerHTML=bitSVG(m)}
function bitAnim(c){if(settings.calm)return;const b=$('#bit');b.classList.remove('jump','shake','wave');void b.getBoundingClientRect();b.classList.add(c);setTimeout(()=>b.classList.remove(c),1400)}
function hideBubble(){clearTimeout(Bit.timer);clearInterval(Bit.typer);Bit.q=[];Bit.typing=false;$('#bubble').classList.remove('on');bitMood('idle')}
function say(lines,opt={}){
  if(settings.bit==='off')return;
  if(settings.bit==='hints'&&!opt.hint)return;
  Bit.q=lines.map(l=>typeof l==='string'?{t:l}:l);nextLine();
}
function nextLine(){
  clearTimeout(Bit.timer);clearInterval(Bit.typer);
  const L=Bit.q.shift(),bub=$('#bubble'),el=$('#bubText');
  if(!L){bub.classList.remove('on');bitMood('idle');return}
  bub.classList.add('on');
  $('#bubMore').textContent=Bit.q.length?'дальше →':'';
  const m=L.m||'idle',plain=L.t.replace(/<[^>]+>/g,'');
  const fin=()=>{Bit.typing=false;clearInterval(Bit.typer);el.innerHTML=L.t;bitMood(m);
    if(m==='happy')bitAnim('jump');if(m==='shock')bitAnim('shake');if(L.wave)bitAnim('wave');
    Bit.timer=setTimeout(()=>{if(!Bit.q.length)nextLine()},Math.max(4200,plain.length*75))};
  Bit.fin=fin;
  if(!settings.txt){fin();return}
  bitMood('talk');Bit.typing=true;let i=0;el.textContent='';
  Bit.typer=setInterval(()=>{i++;el.textContent=plain.slice(0,i);if(i%4===0)sfx(900+Math.random()*500,.012,'triangle',.012);if(i>=plain.length)fin()},settings.txt);
}
$('#bubble').addEventListener('click',()=>{ensureAudio();if(Bit.typing)Bit.fin();else nextLine()});
$('#bit').addEventListener('click',()=>{
  ensureAudio();
  if($('#bubble').classList.contains('on')){if(Bit.typing)Bit.fin();else nextLine();return}
  giveHint(true);
});
function giveHint(fromBit){
  if(!level||$('#ov').classList.contains('on')){say([{t:pick(STORY.facts),m:'think'}],{hint:1});return}
  if(level.sandbox||(hintGiven&&fromBit)){say([{t:pick(STORY.facts),m:'think'}],{hint:1});return}
  hintGiven=true;
  say([{t:level.hint||STORY.noHint,m:'think'}],{hint:1});
}
function levelIntro(){
  if(!level||$('#ov').classList.contains('on'))return;
  if(level.sandbox){if(!seen.has(0)){seen.add(0);save();say([STORY.sandbox])}return}
  if(seen.has(level.id))return;
  const lines=[];
  const chKey='c'+level.ch;
  if(!seen.has(chKey)){seen.add(chKey);lines.push({t:STORY.ch[level.ch],m:'happy'})}
  lines.push({t:STORY.lv[level.id]});
  seen.add(level.id);save();
  setTimeout(()=>say(lines),350);
}
function resetIdle(){clearTimeout(idleT);idleT=setTimeout(()=>{
  if(idleShown||!level||level.sandbox||done.has(level.id)||demoOn||$('#ov').classList.contains('on')||$('#bubble').classList.contains('on'))return;
  idleShown=true;say([STORY.idle],{hint:1});
},60000)}

/* ========== fx ========== */
const NS='http://www.w3.org/2000/svg';
function fxRing(x,y,r=14,grey){if(settings.calm)return;const c=document.createElementNS(NS,'circle');c.setAttribute('cx',x);c.setAttribute('cy',y);c.setAttribute('r',r);c.setAttribute('class','fx-ring'+(grey?' g':''));fxG.appendChild(c);setTimeout(()=>c.remove(),650)}
function fxBits(x,y){if(settings.calm)return;for(let i=0;i<7;i++){const t=document.createElementNS(NS,'text');t.textContent=Math.random()<.65?'1':'0';t.setAttribute('x',x-5+(Math.random()-.5)*20);t.setAttribute('y',y+5);t.setAttribute('class','fx-bit');t.style.setProperty('--dx',((Math.random()-.5)*70)+'px');t.style.animationDelay=(i*.07)+'s';fxG.appendChild(t);setTimeout(()=>t.remove(),1700+i*70)}}

/* ========== settings ========== */
const isDesk=!!window.desktop;
const SET=[
  {g:'Экран'},
  {k:'ui',t:'Масштаб интерфейса',o:['auto',.75,.85,1,1.15,1.3,1.5,1.75,2],f:v=>v==='auto'?'авто · '+Math.round(autoUi()*100)+'%':Math.round(v*100)+'%'},
  {k:'win',t:'Размер окна',o:['auto','1280x720','1366x768','1600x900','1920x1080','2560x1440','fs'],f:v=>v==='auto'?'как есть':v==='fs'?'во весь экран':v.replace('x',' × '),only:isDesk},
  {k:'fs',t:'Полный экран',o:[false,true],f:v=>v?'вкл':'выкл',only:!isDesk},
  {k:'ww',t:'Толщина проводов',o:[3,5,7,9],f:v=>({3:'тонкие',5:'обычные',7:'толстые',9:'очень толстые'})[v]},
  {k:'grid',t:'Сетка',o:['dots','lines','none'],f:v=>({dots:'точки',lines:'линии',none:'нет'})[v]},
  {k:'hc',t:'Контраст',o:[false,true],f:v=>v?'высокий':'обычный'},
  {k:'calm',t:'Анимации',o:[false,true],f:v=>v?'минимум':'все'},
  {g:'Звук'},
  {k:'musicVol',t:'Музыка',o:[0,10,20,30,40,50,60,70,80,90,100],f:v=>`<span class="sbar"><i style="width:${v}%"></i></span>${v?v+'%':'выкл'}`},
  {k:'sfxVol',t:'Звуки',o:[0,10,20,30,40,50,60,70,80,90,100],f:v=>`<span class="sbar"><i style="width:${v}%"></i></span>${v?v+'%':'выкл'}`},
  {g:'Игра'},
  {k:'bit',t:'Бит',o:['all','hints','off'],f:v=>({all:'рассказывает',hints:'только подсказки',off:'спрятан'})[v]},
  {k:'txt',t:'Скорость текста',o:[30,16,0],f:v=>({30:'медленно',16:'обычно',0:'сразу'})[v]},
  {k:'demo',t:'Скорость проверки',o:[1.7,1,.45],f:v=>({1.7:'медленно',1:'обычно',.45:'быстро'})[v]},
  {k:'gost',t:'Обозначения',o:[true,false],f:v=>v?'ГОСТ 2.743':'ANSI'},
];
function autoUi(){const m=Math.min(innerWidth,innerHeight*1.7);return m<700?.9:m<1500?1:m<2000?1.15:m<2700?1.35:1.6}
function UI(){return settings.ui==='auto'?autoUi():settings.ui}
function drawSettings(){
  $('#setList').innerHTML=SET.filter(x=>x.only!==false).map(x=>x.g?`<div class="sgrp">${x.g}</div>`:
    `<div class="srow"><span class="k" data-k="${x.k}" data-d="1">${x.t}</span><button class="ar" data-k="${x.k}" data-d="-1" aria-label="меньше">‹</button><span class="val">${x.f(settings[x.k])}</span><button class="ar" data-k="${x.k}" data-d="1" aria-label="больше">›</button></div>`).join('');
}
$('#setList').addEventListener('click',e=>{
  const b=e.target.closest('[data-k]');if(!b)return;
  const d=SET.find(x=>x.k===b.dataset.k),n=d.o.length;let i=d.o.findIndex(v=>v===settings[d.k]);if(i<0)i=0;
  const dir=+b.dataset.d,wrap=!/Vol$/.test(d.k)&&d.k!=='ui';
  let j=i+dir;if(wrap)j=(j+n)%n;else j=clamp(j,0,n-1);
  settings[d.k]=d.o[j];save();ensureAudio();sfx(560,.03);
  if(d.k==='win')applyWindow();
  if(d.k==='fs')applyFs();
  applySettings();drawSettings();
});
function applySettings(quiet){
  const r=document.documentElement.style;r.setProperty('--ui',UI());r.setProperty('--ww',settings.ww);
  document.body.classList.toggle('calm',!!settings.calm);document.body.classList.toggle('hc',!!settings.hc);
  $('#gridRect').style.display=settings.grid==='none'?'none':'';
  $('#grid').innerHTML=settings.grid==='lines'?'<path d="M20,0H0V20" fill="none" stroke="var(--grid)" stroke-width=".7"/>':'<circle cx="0" cy="0" r="1.1" fill="var(--grid)"/>';
  $('#mascot').classList.toggle('off',settings.bit==='off');
  musicGain();
  setSheet(sheetH);
  if(level){buildChrome();if(quiet)fit();else render()}
}
function applyWindow(){
  if(!isDesk||settings.win==='auto')return;
  if(settings.win==='fs')window.desktop.setFullScreen(true);
  else{const [w,h]=settings.win.split('x').map(Number);window.desktop.setSize(w,h)}
}
function applyFs(){
  try{
    if(settings.fs&&!document.fullscreenElement)document.documentElement.requestFullscreen().catch(()=>{settings.fs=false;drawSettings();toast('Браузер не разрешил полный экран')});
    if(!settings.fs&&document.fullscreenElement)document.exitFullscreen();
  }catch(e){settings.fs=false;toast('Полный экран здесь недоступен')}
}
document.addEventListener('fullscreenchange',()=>{settings.fs=!!document.fullscreenElement;if($('#scrSettings').classList.contains('on'))drawSettings();setTimeout(()=>applySettings(true),100)});

let rstArm=0;
$('#setReset').onclick=()=>{const b=$('#setReset');
  if(!rstArm){rstArm=1;b.innerHTML='Сбросить прогресс <span class="v">— нажмите ещё раз</span>';setTimeout(()=>{rstArm=0;b.textContent='Сбросить прогресс'},3000);return}
  rstArm=0;b.textContent='Сбросить прогресс';done=new Set();saves={};seen=new Set();store.set('ll_pro',false);save();if(level)loadLevel(LV[0]);toast('Прогресс сброшен')};

function drawTree(){
  const sv=$('#tree'),CW=118,RH=64,PX=14,PY=36,CHG=26;
  const yOf=l=>PY+l.pos[1]*RH+(l.ch-1)*CHG, xOf=l=>PX+280+l.pos[0]*CW;
  const W=PX+280+5*CW+60,H=yOf(LV[LV.length-1])+48;
  sv.setAttribute('viewBox',`0 0 ${W} ${H}`);sv.setAttribute('width',W);sv.style.width='min(100%,'+W+'px)';
  let s='';
  CHAPTERS.forEach((c,i)=>{const l=LV.find(x=>x.ch===i+1);const y=yOf(l);
    s+=`<text x="${PX}" y="${y+5}" font-size="14" fill="var(--mute)" font-family="var(--font)">${i+1}. ${c}</text>`;
    if(i)s+=`<path d="M${PX},${y-RH/2-CHG/2+12}H${W-20}" stroke="var(--line)" stroke-width="1"/>`;
  });
  // edges (orthogonal); cross-chapter links shown as a short stub with the source number
  LV.forEach(l=>l.req.forEach(r=>{
    const a=LV[r-1],on=done.has(r),col=on?'var(--acc)':'var(--w0)';
    if(a.ch!==l.ch){const x2=xOf(l)-14,y2=yOf(l);
      s+=`<path d="M${x2-40},${y2}H${x2}" stroke="${col}" stroke-width="3"/><text x="${x2-46}" y="${y2+4}" text-anchor="end" font-size="11" font-family="var(--font)" fill="var(--mute)">${r}</text>`;return}
    const x1=xOf(a)+14,y1=yOf(a),x2=xOf(l)-14,y2=yOf(l),mx=x2-22;
    const d=y1===y2?`M${x1},${y1}H${x2}`:`M${x1},${y1}H${mx}V${y2}H${x2}`;
    s+=`<path d="${d}" fill="none" stroke="${col}" stroke-width="3" stroke-linejoin="round"/>`;
  }));
  LV.forEach(l=>{
    const x=xOf(l),y=yOf(l),dn=done.has(l.id),av=available(l);
    const cls='node'+(av?'':' lock');
    s+=`<g class="${cls}" data-l="${l.id}" opacity="${av?1:.38}">`;
    s+=`<rect x="${x-14}" y="${y-14}" width="28" height="28" fill="${dn?'var(--ink)':'var(--paper)'}" stroke="var(--ink)" stroke-width="2"/>`;
    s+=`<text x="${x}" y="${y+1}" text-anchor="middle" dominant-baseline="central" font-size="13" font-weight="500" font-family="var(--font)" fill="${dn?'var(--paper)':'var(--ink)'}">${l.id}</text>`;
    s+=`<text x="${x}" y="${y+28}" text-anchor="middle" font-size="11" font-family="var(--font)" fill="var(--ink2)">${l.t.length>16?l.t.slice(0,15)+'…':l.t}</text>`;
    s+=`<rect x="${x-50}" y="${y-22}" width="100" height="58" fill="transparent"/></g>`;
  });
  sv.innerHTML=s;
  sv.querySelectorAll('.node').forEach(n=>{
    const l=LV[n.dataset.l-1];
    n.onmouseenter=()=>$('#treeTip').innerHTML=`${l.id}. ${l.t}<span style="color:var(--mute)"> — ${available(l)?l.f:'откроется после: '+l.req.join(', ')}</span>`;
    n.onclick=()=>{if(!available(l))return;sfx(560,.03);loadLevel(l);closeMenu()};
  });
}

/* ========== audio ========== */
let AC=null,master,mBus,sBus,musicT=null;
function ensureAudio(){
  if(AC){if(AC.state==='suspended')AC.resume();return}
  try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){return}
  master=AC.createGain();master.connect(AC.destination);
  sBus=AC.createGain();sBus.gain.value=.5;sBus.connect(master);
  const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1400;lp.Q.value=.3;
  const dl=AC.createDelay(1.5);dl.delayTime.value=.42;const fb=AC.createGain();fb.gain.value=.38;
  mBus=AC.createGain();mBus.gain.value=0;
  mBus.connect(lp);lp.connect(master);lp.connect(dl);dl.connect(fb);fb.connect(dl);dl.connect(master);
  startMusic();musicGain();
}
function musicGain(){if(!AC)return;mBus.gain.cancelScheduledValues(AC.currentTime);mBus.gain.setTargetAtTime(settings.musicVol/100,AC.currentTime,.8);sBus.gain.setTargetAtTime(settings.sfxVol/100*.8,AC.currentTime,.05)}
const mtof=m=>440*Math.pow(2,(m-69)/12);
function tone(bus,f,t0,dur,type,vol,att){
  const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.value=f;
  g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(vol,t0+att);g.gain.exponentialRampToValueAtTime(.0001,t0+dur);
  o.connect(g);g.connect(bus);o.start(t0);o.stop(t0+dur+.05);
}
function startMusic(){
  const prog=[[57,60,64,67,71],[53,57,60,64,69],[48,55,59,64,67],[55,59,62,64,69]];
  const pent=[69,72,74,76,79,81,84];
  let i=0;
  const bar=()=>{
    const t=AC.currentTime+.05,ch=prog[i++%prog.length],L=8;
    tone(mBus,mtof(ch[0]-12),t,L+1,'sine',.09,2.5);
    ch.slice(1).forEach((m,j)=>{tone(mBus,mtof(m),t+j*.08,L+1.5,'sine',.035,2.8);tone(mBus,mtof(m)*1.003,t+j*.08,L+1.5,'triangle',.012,3)});
    let pt=t+1+Math.random()*1.5;
    while(pt<t+L-1){const m=pent[Math.floor(Math.random()*pent.length)];if(ch.some(c=>(m-c)%12===0)||Math.random()<.5)tone(mBus,mtof(m),pt,1.8,'triangle',.028,.01);pt+=1.2+Math.random()*2.2}
  };
  bar();musicT=setInterval(()=>{if(AC.state==='running')bar()},8000);
}
function sfx(f,d,type='sine',vol=.05){if(!AC||!settings.sfxVol)return;tone(sBus,f,AC.currentTime,d+.08,type,vol,.005)}
function chime(){if(!AC||!settings.sfxVol)return;[72,76,79,84].forEach((m,i)=>tone(sBus,mtof(m),AC.currentTime+i*.09,1.2,'triangle',.06,.005))}

/* ========== boot ========== */
window.addEventListener('resize',()=>{if(settings.ui==='auto')applySettings(true);else{setSheet(sheetH);render()}});
(function boot(){
  applySettings(true);
  applyWindow();
  bitMood('idle');
  const id=store.get('ll_last',1);
  loadLevel(LV.find(l=>l.id===id)||LV[0]);
  setTimeout(()=>{
    if(!store.get('ll_pro',false)){say(STORY.prologue);store.set('ll_pro',true)}
    else say([{t:pick(STORY.welcome),wave:1}]);
  },700);
})();
window.LL={LV,get C(){return C},set C(v){C=v},loadLevel,settle,readOuts,resetSim,changed,get level(){return level},done};
