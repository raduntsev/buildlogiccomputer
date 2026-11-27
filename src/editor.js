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
function sandboxGates(){const s=new Set();LV.forEach(x=>{if(done.has(x.id))(x.gates||[]).forEach(g=>s.add(g))});if(!s.size)['NOT','AND','OR'].forEach(g=>s.add(g));return ALL_GATES.filter(g=>s.has(g))}
const TOUCH=(()=>{try{return matchMedia('(pointer:coarse)').matches}catch(e){return false}})();
let knife=false;
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
/* the circuit is written out 0.3 s after the last edit, not on every click */
let persistT=0;
function persist(){saves[level.id]={gates:C.gates,wires:C.wires};clearTimeout(persistT);persistT=setTimeout(()=>{persistT=0;save()},300);if(window.savedPing)savedPing()}
function persistNow(){if(persistT){clearTimeout(persistT);persistT=0;save()}}
window.addEventListener('beforeunload',()=>{persistNow();store.flush(true)});
window.addEventListener('pagehide',()=>{persistNow();store.flush(true)});
document.addEventListener('visibilitychange',()=>{if(document.hidden){persistNow();store.flush()}});

function loadLevel(l){
  if(l.sandbox)l.gates=sandboxGates();
  level=l;knifeSet(false);$('#result').classList.remove('on');
  const s=saves[l.id];
  C=s?JSON.parse(JSON.stringify(s)):{gates:[],wires:[]};
  nextId=1+Math.max(0,...C.gates.map(g=>+g.id.slice(1)),...C.wires.map(w=>+w.id.slice(1)));
  undoS=[];redoS=[];sel=null;rowMark=null;
  liveIn=ioIns().map(()=>0);
  resetSim();
  if(!l.sandbox)store.set('ll_last',l.id,true);
  buildChrome();
  fit();
  update();
  hintUsed=false;failCount=0;bitMuted=false;levelStart=Date.now();idleShown=false;resetIdle();hintBtnDraw();
  levelIntro();
  musicChapter(l.sandbox?topChapter():l.ch);
  if(TOUCH&&l.gates.length&&!store.get('ll_tip',false)){store.set('ll_tip',true,true);setTimeout(()=>toast(ui('touchTip'),7000),1800)}
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
/* A* on a 10 px grid: shortest orthogonal path around gates, flags and lamps, with a cost per bend.
   Leaves the source pin to the right and enters the target pin from the left. Cached per layout. */
const STEP=10,BEND=6;
let routeSig='',routeMemo=new Map();
function routeObstacles(){
  const R=[],m=6;
  for(const g of C.gates)R.push([g.x-m,g.y-m,g.x+GW+m,g.y+GATES[g.type].h+m]);
  ioIns().forEach((_,i)=>{const n=nodePos('I'+i);R.push([n.x-62-m,n.y-19-m,n.x+12+m,n.y+19+m])});
  level.outs.forEach((_,i)=>{const n=nodePos('O'+i);R.push([n.x+4,n.y-22-m,n.x+56+m,n.y+22+m])});
  return R;
}
// all auto-routed wires are laid out together, in order, so a wire avoids running along another net's wire
function smartRoute(s,t){
  const sig=C.gates.map(g=>g.id+g.x+','+g.y).join(';')+'|'+C.wires.map(w=>w.from.g+w.from.p+w.to.g+w.to.p+(w.pts&&w.pts.length?'m':'')).join(';')+'|'+OUTX()+'|'+ioIns().length+'|'+level.outs.length;
  const key=s.x+','+s.y+'>'+t.x+','+t.y;
  if(sig!==routeSig){
    routeSig=sig;routeMemo=new Map();const nets=new Map(),G=routeGrid(C.wires.flatMap(w=>[pinPos(w.from.g,'o',w.from.p),pinPos(w.to.g,'i',w.to.p)]));
    for(const w of C.wires){if(w.pts&&w.pts.length)continue;
      const a=pinPos(w.from.g,'o',w.from.p),b=pinPos(w.to.g,'i',w.to.p),k=a.x+','+a.y+'>'+b.x+','+b.y,net=w.from.g+':'+w.from.p;
      if(routeMemo.has(k))continue;
      if(!nets.has(net))nets.set(net,nets.size+1);
      const id=nets.get(net),r=astar(a,b,id,G)||autoRoute(a,b);routeMemo.set(k,r);
      if(G)for(let i=0;i<r.length-1;i++){const p=r[i],q=r[i+1],O=p.y===q.y?G.occH:G.occV,n=Math.max(Math.abs(q.x-p.x),Math.abs(q.y-p.y))/STEP;
        for(let j=0;j<=n;j++){const x=(p.x+Math.sign(q.x-p.x)*j*STEP)/STEP-G.x0,y=(p.y+Math.sign(q.y-p.y)*j*STEP)/STEP-G.y0;
          if(x>=0&&y>=0&&x<G.W&&y<G.H&&x%1===0&&y%1===0)O[y*G.W+x]=id}}
    }
  }
  let r=routeMemo.get(key);
  if(!r){r=astar(s,t)||autoRoute(s,t);routeMemo.set(key,r)}
  return r;
}
// blocked cells for the current layout, shared by every wire routed in one pass
function routeGrid(pins){
  const R=routeObstacles();
  let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;
  for(const p of pins){x0=Math.min(x0,p.x/STEP|0);x1=Math.max(x1,Math.ceil(p.x/STEP));y0=Math.min(y0,p.y/STEP|0);y1=Math.max(y1,Math.ceil(p.y/STEP))}
  for(const r of R){x0=Math.min(x0,Math.floor(r[0]/STEP));x1=Math.max(x1,Math.ceil(r[2]/STEP));y0=Math.min(y0,Math.floor(r[1]/STEP));y1=Math.max(y1,Math.ceil(r[3]/STEP))}
  x0-=4;x1+=4;y0-=4;y1+=4;
  const W=x1-x0+1,H=y1-y0+1,N=W*H;
  if(!(N>0)||N>400000)return null;
  const block=new Uint8Array(N);
  for(const r of R)for(let y=Math.max(y0,Math.ceil(r[1]/STEP));y<=Math.min(y1,Math.floor(r[3]/STEP));y++)
    for(let x=Math.max(x0,Math.ceil(r[0]/STEP));x<=Math.min(x1,Math.floor(r[2]/STEP));x++){
      const px=x*STEP,py=y*STEP;if(px>r[0]&&px<r[2]&&py>r[1]&&py<r[3])block[(y-y0)*W+x-x0]=1}
  return{x0,x1,y0,y1,W,H,N,block,g:new Float32Array(N*4),from:new Int32Array(N*4),occH:new Int32Array(N),occV:new Int32Array(N)};
}
function astar(s,t,net,G){
  if(s.x%STEP||s.y%STEP||t.x%STEP||t.y%STEP)return null;
  G=G||routeGrid([s,t]);if(!G)return null;
  const {x0,x1,y0,y1,W,H,N,block,g,from,occH,occV}=G;
  const sx=s.x/STEP+1,sy=s.y/STEP,tx=t.x/STEP-1,ty=t.y/STEP;
  if(sx<x0||sx>x1||tx<x0||tx>x1||sy<y0||sy>y1||ty<y0||ty>y1)return null;
  const si=(sy-y0)*W+sx-x0,ti=(ty-y0)*W+tx-x0;
  const bs=block[si],bt=block[ti];block[si]=0;block[ti]=0;
  const DX=[1,0,-1,0],DY=[0,1,0,-1];
  g.fill(Infinity);from.fill(-1);
  // binary heap in two parallel arrays (priority, state)
  const HF=[],HI=[];
  const push=(f,i)=>{let k=HF.length;HF.push(f);HI.push(i);while(k){const q=(k-1)>>1;if(HF[q]<=f)break;HF[k]=HF[q];HI[k]=HI[q];k=q}HF[k]=f;HI[k]=i};
  let popF=0;
  const pop=()=>{const top=HI[0];popF=HF[0];const f=HF.pop(),i=HI.pop(),n=HF.length;if(n){let k=0;for(;;){const l=2*k+1,r=l+1;let m=l;if(l>=n)break;if(r<n&&HF[r]<HF[l])m=r;if(HF[m]>=f)break;HF[k]=HF[m];HI[k]=HI[m];k=m}HF[k]=f;HI[k]=i}return top};
  const h=i=>{const x=i%W,y=(i/W)|0;return Math.abs(x+x0-tx)+Math.abs(y+y0-ty)+(y+y0!==ty?BEND:0)};
  g[si*4]=0;push(h(si),si*4);
  let end=-1,budget=N*3;
  while(HF.length&&budget--){
    const st=pop(),f=popF,i=st>>2,d=st&3,gc=g[st];
    if(f>gc+h(i)+1e-9)continue;
    if(i===ti){if(d===0){end=st;break}}
    const x=i%W,y=(i/W)|0;
    for(let nd=0;nd<4;nd++){
      if(nd===(d+2)%4)continue;
      const nx=x+DX[nd],ny=y+DY[nd];if(nx<0||ny<0||nx>=W||ny>=H)continue;
      const ni=ny*W+nx;if(block[ni])continue;
      let c=gc+1+(nd!==d?BEND:0)+(ni===ti&&nd!==0?BEND:0);const ns=ni*4+nd;
      const o=(nd&1?occV:occH)[ni];if(o&&o!==net)c+=8;
      if(c<g[ns]){g[ns]=c;from[ns]=st;push(c+h(ni),ns)}
    }
  }
  block[si]=bs;block[ti]=bt;
  if(end<0)return null;
  const o=[t];
  for(let st=end;st>=0;st=from[st]){const i=st>>2;o.push({x:(i%W+x0)*STEP,y:(((i/W)|0)+y0)*STEP})}
  o.push(s);
  return dedupe(o.reverse());
}
function route(s,pts,t){
  if(!pts||!pts.length)return smartRoute(s,t);
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

/* pan and zoom only move the camera; the circuit itself is rebuilt only when it changes */
const gridPat=$('#grid');
function viewXf(){
  const t=`translate(${view.x},${view.y}) scale(${view.z})`;
  world.setAttribute('transform',t);fxG.setAttribute('transform',t);gridPat.setAttribute('patternTransform',t);
  placeSelPop();
}
/* pointer moves fire far more often than the screen redraws: draw once per frame */
let renderRAF=0;
function renderSoon(){if(!renderRAF)renderRAF=requestAnimationFrame(()=>{renderRAF=0;render()})}
function render(){
  if(renderRAF){cancelAnimationFrame(renderRAF);renderRAF=0}
  viewXf();
  const gost=settings.gost, v=sim.v;
  let s='';const parts=[],K=k=>{if(s){parts.push(k,s);s=''}};
  const dm=cut&&cut.pts.length>1?cutHits():{wires:new Set(),gates:new Set()},insW=(ghost&&ghost.ins&&ghost.ins.w.id)||(act&&act.kind==='gate'&&act.ins&&act.ins.w.id);
  // wires
  for(const w of C.wires){
    const d=roundD(wirePts(w)),val=v[w.from.g+':'+w.from.p]|0,doom=dm.wires.has(w.id);
    if(insW===w.id)s+=`<path class="wins" d="${d}"/>`;
    s+=`<path class="wgap" d="${d}"/>`;
    s+=`<path class="w w${val}${doom?' doom':''}${WCOL[w.c]?' wc" style="--wc:'+WCOL[w.c]:''}" d="${d}"/>`;
    if(demoOn&&val&&!doom)s+=`<path class="wf" d="${d}"/>`;
    s+=`<path class="whit${sel&&sel.w===w.id?' on':''}" data-wire="${w.id}" d="${d}"/><path class="wsel${sel&&sel.w===w.id?' on':''}" d="${d}"/>`;K('w'+w.id);
  }
  for(const p of junctions())s+=`<circle class="jn" cx="${p.x}" cy="${p.y}" r="${settings.ww*.6+2.5}"/>`;K('jn');
  // onboarding ghost
  if(level.id===1&&!C.wires.length&&!tmp){
    const a=pinPos('I0','o',0),b=pinPos('O0','i',0);
    s+=`<path class="onb" d="${toD(autoRoute(a,b))}"/>`;K('onb');
  }
  // gates
  for(const g of C.gates){
    s+=`<g class="gate${sel&&sel.g===g.id?' sel':''}${dm.gates.has(g.id)?' doom':''}" data-gate="${g.id}" transform="translate(${g.x},${g.y})">`;
    s+=`<rect x="10" y="-4" width="40" height="${GATES[g.type].h+8}" fill="transparent"/>`;
    s+=gateSVG(g.type,gost);
    s+=`</g>`;K('g'+g.id);
  }
  const sh=new Set(shorts());
  // pins of gates
  for(const g of C.gates){
    const P=gPins(g.type);
    P.i.forEach((y,p)=>{s+=pinIn(g.x,g.y+y);if(sh.has(g.id+':'+p))s+=`<circle class="short" cx="${g.x}" cy="${g.y+y}" r="10"/>`;s+=`<circle class="pin-hit" data-pin="${g.id}|i|${p}" cx="${g.x}" cy="${g.y+y}" r="9"/>`});
    P.o.forEach((y,p)=>{s+=pinOut(g.x+GW,g.y+y)+`<circle class="pin-hit" data-pin="${g.id}|o|${p}" cx="${g.x+GW}" cy="${g.y+y}" r="10"/>`});K('p'+g.id);
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
    s+=`<path class="gst" d="M${n.x+12},${n.y}H${n.x+20}"/>`+pinOut(n.x+20,n.y)+`<circle class="pin-hit" data-pin="I${i}|o|0" cx="${n.x+20}" cy="${n.y}" r="11"/>`;K('i'+i);
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
    s+=`<circle class="pin-hit" data-pin="O${i}|i|0" cx="${n.x}" cy="${n.y}" r="11"/>`;K('o'+i);
  });
  // temp wire
  if(tmp){
    const sp=pinPos(tmp.from.g,'o',tmp.from.p);
    let t=tmp.cur,pts=tmp.pts;
    if(hover&&hover.k==='i')t=pinPos(hover.g,'i',hover.p);
    s+=`<path class="w w${v[tmp.from.g+':'+tmp.from.p]|0} tmp" d="${roundD(route(sp,pts,t))}"/>`;
    pts.forEach(p=>s+=`<circle class="jn" cx="${p.x}" cy="${p.y}" r="3"/>`);K('tmp');
  }
  if(ghost)s+=`<g class="ghost${ghost.ins?' ins':''}" transform="translate(${ghost.x},${ghost.y})">${gateSVG(ghost.type,gost)}</g>`;K('ghost');
  if(cut&&cut.pts.length>1)s+=`<path class="cut" d="${toD(cut.pts.map(p=>({x:p.x,y:p.y})))}"/>`;K('cut');
  patchWorld(parts);
  board.classList.toggle('demo',demoOn);
  placeSelPop();
  renderTable();
  $('#undo').disabled=!undoS.length;$('#redo').disabled=!redoS.length;
}

/* each wire, gate, input and lamp is its own <g>; only the ones whose markup changed are rebuilt,
   so flipping an input repaints a few wires instead of the whole board */
const worldParts=new Map();
function patchWorld(parts){
  const seen=new Set();let ref=world.firstChild;
  for(let i=0;i<parts.length;i+=2){
    const k=parts[i],h=parts[i+1];let c=worldParts.get(k);seen.add(k);
    if(!c||c.h!==h){if(c){if(c.el===ref)ref=ref.nextSibling;c.el.remove()}const el=document.createElementNS('http://www.w3.org/2000/svg','g');el.innerHTML=h;c={h,el};worldParts.set(k,c)}
    if(c.el===ref)ref=ref.nextSibling;else world.insertBefore(c.el,ref);
  }
  for(const [k,c] of worldParts)if(!seen.has(k)){c.el.remove();worldParts.delete(k)}
}
const WCOL={r:'#D9483B',o:'#E08A1E',g:'#3E9B4F',b:'#2F6FD0',v:'#8A4FC8'};
function selWire(){return sel&&sel.w?C.wires.find(x=>x.id===sel.w):null}
function wcolPop(on){const p=$('#wcolPop'),b=$('#wcolBtn');on=!!on&&!!selWire();p.classList.toggle('on',on);b.setAttribute('aria-expanded',on);
  if(!on)return;const w=selWire();
  p.innerHTML=['',...Object.keys(WCOL)].map(k=>`<button role="menuitemradio" aria-checked="${(w.c||'')===k}" data-wc="${k}" title="${ui(k?'wc_'+k:'wcolDef')}" aria-label="${ui(k?'wc_'+k:'wcolDef')}"${k?` style="--wc:${WCOL[k]}"`:''}></button>`).join('');
  const r=b.getBoundingClientRect();p.style.top=(r.top+r.height/2)+'px';p.style.right=(innerWidth-r.left+8)+'px'}
function wcolSync(){const b=$('#wcolBtn');if(!b)return;const w=selWire();b.disabled=!w||demoOn;b.style.setProperty('--wc',w&&WCOL[w.c]||'');if(!w||demoOn)wcolPop(false)}
$('#wcolBtn').onclick=e=>{e.stopPropagation();wcolPop(!$('#wcolPop').classList.contains('on'));sfx('ui')};
$('#wcolPop').addEventListener('pointerdown',e=>e.stopPropagation());
$('#wcolPop').addEventListener('click',e=>{e.stopPropagation();const k=e.target.closest('[data-wc]');const w=selWire();if(!k||!w)return;
  const c=k.dataset.wc;if((w.c||'')!==c){snapshot();if(c)w.c=c;else delete w.c;persist();render()}wcolPop(false);sfx('place')});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#wcolPop,#wcolBtn'))wcolPop(false)},true);
function placeSelPop(){
  wcolSync();
  const b=$('#selPop');if(!b)return;
  let w=null;
  if(sel&&!demoOn&&!(act&&act.moved)){
    if(sel.g){const g=C.gates.find(x=>x.id===sel.g);if(g)w={x:g.x+30,y:g.y-8}}
    else if(sel.w&&C.wires.some(x=>x.id===sel.w))w=sel.at?{x:sel.at.x,y:sel.at.y-12}:null;
  }
  if(!w){b.classList.remove('on');return}
  b.style.transform=`translate(${view.x+w.x*view.z}px,${view.y+w.y*view.z}px) translate(-50%,-100%)`;b.classList.add('on');
}
$('#selPop').addEventListener('pointerdown',e=>e.stopPropagation());
$('#selPop').addEventListener('click',e=>{e.stopPropagation();if(!sel)return;if(sel.g)delGate(sel.g);else if(sel.w)delWire(sel.w);sel=null;render()});
function knifeSet(on){knife=!!on;const b=$('#knifeBtn');if(b){b.classList.toggle('on',knife);b.setAttribute('aria-pressed',knife)}document.body.classList.toggle('knife',knife)}
$('#knifeBtn').onclick=()=>{knifeSet(!knife);sfx('ui');if(knife)toast(ui('knifeOn'))};
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
  $('#hint').innerHTML=mathHTML(tx(level.hint));$('#hint').classList.toggle('on',hintBought());
  $('#hintBtn').style.display=level.hint?'':'none';hintBtnDraw();
  $('#verify').style.display=level.sandbox?'none':'';
  const pal=$('#palette');const gt=$('#gtip');if(gt)gt.classList.remove('on');
  pal.innerHTML=level.gates.map(t=>`<div class="pi" data-type="${t}"><svg viewBox="-2 -2 64 ${GATES[t].h+4}" style="height:${t==='DFF'?44:32}px">${gateSVG(t,settings.gost)}</svg><span>${tx(GATES[t].n)}</span></div>`).join('')+(level.max?`<div class="pcount" id="pcount"></div>`:'')
    +(level.sandbox&&level.gates.length<ALL_GATES.length?`<div class="pnote">${ui('sbMore',{n:ALL_GATES.length-level.gates.length})}</div>`:'');
  updCount();
}
/* the task card sits level with the top buttons when it fits between them, otherwise below them */
function placeCard(){
  const card=$('#taskCard');if(card.style.display==='none')return;
  if(cardPos){card.classList.add('moved');card.classList.remove('low');const r=card.getBoundingClientRect(),x=clamp(cardPos.x,8,innerWidth-r.width-8),y=clamp(cardPos.y,8,innerHeight-r.height-8);card.style.left=x+'px';card.style.top=y+'px';return}
  card.classList.remove('moved');card.style.left='';
  const vis=q=>$$(q).map(x=>x.getBoundingClientRect()).filter(r=>r.width),L={right:Math.max(0,...vis('#top .tb:not(.r)>*').map(r=>r.right))},R={left:Math.min(innerWidth,...vis('#top .tb.r>*').map(r=>r.left))};
  card.style.top='';card.classList.remove('low');
  const r=card.getBoundingClientRect();
  if(innerWidth<=760||r.left<L.right+12||r.right>R.left-12)card.classList.add('low');
}
window.addEventListener('resize',()=>{if(level)placeCard()});
let cardPos=store.get('ll_cardPos',null);
function ttHidden(on){const c=$('#taskCard'),b=$('#ttTog');c.classList.toggle('tthide',on);b.setAttribute('aria-expanded',!on);b.title=b.ariaLabel=ui(on?'ttShow':'ttHide');store.set('ll_ttHide',on,true);placeCard()}
function toolsHidden(on){const b=$('#toolsTog');$('#toolDock').classList.toggle('hide',on);b.setAttribute('aria-expanded',!on);b.title=b.ariaLabel=ui(on?'toolsShow':'toolsHide');store.set('ll_toolsHide',on,true)}
$('#toolsTog').onclick=()=>{toolsHidden(!$('#toolDock').classList.contains('hide'));sfx('ui')};
$('#ttTog').onclick=e=>{e.stopPropagation();ttHidden(!$('#taskCard').classList.contains('tthide'));sfx('ui')};
(()=>{const c=$('#taskCard');let st=null;
  c.addEventListener('pointerdown',e=>{if(e.button||e.target.closest('td,button'))return;const r=c.getBoundingClientRect();st={x:e.clientX,y:e.clientY,l:r.left,t:r.top,m:false,id:e.pointerId}});
  c.addEventListener('pointermove',e=>{if(!st)return;const dx=e.clientX-st.x,dy=e.clientY-st.y;if(!st.m&&Math.hypot(dx,dy)<4)return;if(!st.m){st.m=true;c.setPointerCapture(st.id);c.classList.add('drag')}cardPos={x:st.l+dx,y:st.t+dy};placeCard()});
  const end=()=>{if(st&&st.m){c.classList.remove('drag');store.set('ll_cardPos',cardPos,true)}st=null};
  c.addEventListener('pointerup',end);c.addEventListener('pointercancel',end);
  c.addEventListener('dblclick',e=>{if(e.target.closest('td,button'))return;cardPos=null;store.set('ll_cardPos',null,true);placeCard()});
})();
function renderTable(){
  const w=$('#ttWrap'),card=$('#taskCard');
  if(level.sandbox||!level.vec.length){w.innerHTML='';w._h='';card.classList.add('notable');card.style.display=level.f?'':'none';return}
  card.classList.remove('notable');card.style.display='';
  const ins=level.ins,outs=level.outs,isSeq=level.seq||level.clk,V=level.vec;
  const live=isSeq?-1:V.findIndex(r=>ins.every((k,i)=>r.in[k]===liveIn[i]));
  const cc=ri=>{const mk=rowMark&&rowMark[ri];return [ri===live&&!rowMark?'live':'',ri===demoRow?'cur':'',mk&&ri!==demoRow?(mk.ok?'ok':'bad'):''].join(' ')};
  const lab=k=>mathHTML(subH(esc(k)));
  let h='<table class="tt">';
  if(isSeq)h+=`<tr class="hn"><th>${level.clk?ui('tick'):ui('step')}</th>${V.map((_,ri)=>`<td data-row="${ri}">${ri+1}</td>`).join('')}</tr>`;
  ins.forEach(k=>h+=`<tr><th>${lab(k)}</th>${V.map((r,ri)=>`<td class="${cc(ri)}" data-row="${ri}">${r.in[k]}</td>`).join('')}</tr>`);
  if(ins.length)h+=`<tr class="ttsep"><th></th><td colspan="${V.length}"></td></tr>`;
  outs.forEach((k,j)=>h+=`<tr class="out"><th>${lab(disp(k))}</th>${V.map((r,ri)=>{const mk=rowMark&&rowMark[ri],bad=mk&&!mk.ok&&mk.act[k]!==r.out[k];
    return `<td class="${cc(ri)}${bad&&ri!==demoRow?' wrong':''}" data-row="${ri}">${r.out[k]}${bad?`<span class="act">${mk.act[k]}</span>`:''}</td>`}).join('')}</tr>`);
  h+='</table>';
  if(h!==w._h){w.innerHTML=h;w._h=h;placeCard()}
}
$('#ttWrap').addEventListener('click',e=>{
  const tr=e.target.closest('tr[data-row]');if(!tr||demoOn||level.seq||level.clk)return;
  const r=level.vec[+tr.dataset.row];liveIn=ioIns().map(k=>r.in[k]|0);rowMark=null;update();
});
$('#hintBtn').onclick=e=>{e.stopPropagation();if(sheetH<160)setSheet(220);giveHint()};
$('#sheetTog').onclick=e=>{e.stopPropagation();sheetToggle()};

/* sheet resize */
const SHEET_MIN=52;
let sheetH=Math.min(store.get('ll_sheet',150),190),lastSheet=Math.max(150,sheetH);
function sheetToggle(){if(sheetH>60){lastSheet=sheetH;setSheet(SHEET_MIN)}else setSheet(Math.max(150,lastSheet));sfx('ui')}
function setSheet(h){sheetH=clamp(h,SHEET_MIN,innerHeight*.7/UI());$('#sheet').style.height=sheetH+'px';$('#sheet').classList.toggle('min',sheetH<=60);$('#zoom').style.bottom=(sheetH+28)+'px';if(window.bitReady)zoomPlace();else $('#zoom').style.right=(settings.bit==='off'||innerWidth<=760?(innerWidth<=760?8:16):92)+'px';const mob=innerWidth<=760;if(mob)$('#zoom').style.bottom=(sheetH+84)+'px';$('#mascot').style.bottom=$('#bitDock').style.bottom=(sheetH+(mob?16:28))+'px';if(window.bitReady)bitPlace();document.documentElement.style.setProperty('--dock',(sheetH*UI()+14)+'px');store.set('ll_sheet',sheetH,true)}
setSheet(sheetH);
(()=>{const g=$('#grip');let sy=null,sh=0,moved=false;
  g.addEventListener('pointerdown',e=>{if(e.target.closest('#hintBtn,#sheetTog'))return;document.body.classList.add('sheetDrag');sy=e.clientY;sh=sheetH;moved=false;g.setPointerCapture(e.pointerId)});
  g.addEventListener('pointermove',e=>{if(sy==null)return;if(Math.abs(e.clientY-sy)>3)moved=true;setSheet(sh+(sy-e.clientY)/UI())});
  g.addEventListener('pointerup',()=>{document.body.classList.remove('sheetDrag');if(sy!=null){if(!moved);else if(sheetH<100)setSheet(SHEET_MIN);else{lastSheet=sheetH;setSheet(sheetH)}}sy=null});
})();

/* ========== view ========== */
function fit(){
  const pts=[];ioIns().forEach((_,i)=>{const n=nodePos('I'+i);pts.push({x:n.x-70,y:n.y-40},{x:n.x+20,y:n.y+40})});
  level.outs.forEach((_,i)=>{const n=nodePos('O'+i);pts.push({x:n.x,y:n.y-40},{x:n.x+60,y:n.y+40})});
  C.gates.forEach(g=>pts.push({x:g.x,y:g.y},{x:g.x+GW,y:g.y+GATES[g.type].h}));
  const x0=Math.min(...pts.map(p=>p.x)),x1=Math.max(...pts.map(p=>p.x)),y0=Math.min(...pts.map(p=>p.y)),y1=Math.max(...pts.map(p=>p.y));
  const mob=innerWidth<=760,pr=$('#palette').getBoundingClientRect();
  const L=level.gates.length&&!mob?pr.right+14:16,T=Math.max($('#top').getBoundingClientRect().bottom,$('#taskCard').style.display==='none'?0:$('#taskCard').getBoundingClientRect().bottom)+14,MW=$('#toolDock').getBoundingClientRect().width+8,W=innerWidth-L-24-MW;
  const B=mob&&level.gates.length&&pr.height?pr.top-12:innerHeight-(sheetH+14)*UI()-24,H=B-T;
  const z=clamp(Math.min(W/(x1-x0+40),H/(y1-y0+40)),.3,1.6);
  view.z=z;view.x=L+(W-(x1-x0)*z)/2-x0*z;view.y=T+(H-(y1-y0)*z)/2-y0*z;
  render();
}
function zoomAt(f,cx,cy){const nz=clamp(view.z*f,.3,3);const k=nz/view.z;view.x=cx-(cx-view.x)*k;view.y=cy-(cy-view.y)*k;view.z=nz;viewXf()}
$('#zIn').onclick=()=>zoomAt(1.2,innerWidth/2,innerHeight/2);
$('#zOut').onclick=()=>zoomAt(1/1.2,innerWidth/2,innerHeight/2);
$('#zFit').onclick=fit;
board.addEventListener('wheel',e=>{e.preventDefault();zoomAt(Math.exp(-e.deltaY*.0015),e.clientX,e.clientY)},{passive:false});
const toW=(cx,cy)=>({x:(cx-view.x)/view.z,y:(cy-view.y)/view.z});

/* ========== interaction ========== */
const ptrs=new Map();let act=null,pinch=null;
function nearestIn(p,r){
  let best=null,bd=r;
  const tryPin=(g,pi)=>{const q=pinPos(g,'i',pi),d=Math.hypot(q.x-p.x,q.y-p.y);if(d<bd){bd=d;best={type:'pin',g,k:'i',p:pi}}};
  C.gates.forEach(g=>gPins(g.type).i.forEach((_,i)=>tryPin(g.id,i)));
  level.outs.forEach((_,i)=>tryPin('O'+i,0));
  return best;
}
function loupe(x,y){
  const L=$('#loupe'),R=66,Z=2.2;
  let ly=y-R-90;if(ly<8)ly=y+70;const lx=clamp(x-R,8,innerWidth-2*R-8);
  // the loupe mirrors the board with <use>; it is linked only while shown, otherwise every
  // board change would restyle a hidden copy of the whole circuit
  if(!L.classList.contains('on'))for(const u of $$('#loupeG use'))u.setAttribute('href',u.dataset.href);
  L.style.transform=`translate(${lx}px,${ly}px)`;L.classList.add('on');
  $('#loupeG').setAttribute('transform',`translate(${R},${R}) scale(${Z}) translate(${-x},${-y})`);
}
function loupeOff(){const L=$('#loupe');if(!L.classList.contains('on'))return;L.classList.remove('on');for(const u of $$('#loupeG use'))u.removeAttribute('href')}
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
/* a selected wire is dragged by one segment; both ends stay on their pins. The pin stubs never move,
   so the segment next to a pin gets a 10 px stub before it. Double-click a wire to hand it back to the router. */
function segGrab(w,p){
  const pl=wirePts(w),s=pl[0],t=pl[pl.length-1],P=[s,{x:s.x+10,y:s.y}];
  for(const q of [...pl.slice(1,-1),{x:t.x-10,y:t.y},t]){const z=P[P.length-1];if(z.x!==q.x||z.y!==q.y)P.push({x:q.x,y:q.y})}
  let best=null;
  for(let j=1;j<P.length-2;j++){const a=P[j],b=P[j+1];if(a.x!==b.x&&a.y!==b.y)continue;
    const q={x:clamp(p.x,Math.min(a.x,b.x),Math.max(a.x,b.x)),y:clamp(p.y,Math.min(a.y,b.y),Math.max(a.y,b.y))},d=Math.hypot(q.x-p.x,q.y-p.y);
    if(!best||d<best.d)best={d,j,h:a.y===b.y}}
  return best&&best.d<24/view.z?{P,j:best.j,h:best.h}:null;
}
board.addEventListener('dblclick',e=>{
  const h=hitInfo(e.target);if(h.type!=='wire')return;
  const w=C.wires.find(x=>x.id===h.id);if(!w||!w.pts||!w.pts.length)return;
  snapshot();w.pts=[];changed();
});
function startWire(from,pts,cur){tmp={from,pts:pts.map(p=>({x:p.x,y:p.y})),cur,mode:'drag'};sfx('pick')}
function finishWire(to){
  if(!tmp)return;
  const f=tmp.from;
  if(!C.wires.some(w=>w.from.g===f.g&&w.from.p===f.p&&w.to.g===to.g&&w.to.p===to.p)){
    snapshot();
    const nw={id:'w'+(nextId++),from:{g:f.g,p:f.p},to:{g:to.g,p:to.p},pts:tmp.pts};if(tmp.c)nw.c=tmp.c;C.wires.push(nw);
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
function segRect(a,b,x0,y0,x1,y1){
  const inR=p=>p.x>=x0&&p.x<=x1&&p.y>=y0&&p.y<=y1;
  if(inR(a)||inR(b))return true;
  const c=[{x:x0,y:y0},{x:x1,y:y0},{x:x1,y:y1},{x:x0,y:y1}];
  for(let i=0;i<4;i++)if(segX(a,b,c[i],c[(i+1)%4]))return true;
  return false;
}
function cutHits(){
  const cp=cut.pts,wires=new Set(),gates=new Set();
  for(const g of C.gates){const h=GATES[g.type].h;
    for(let i=0;i<cp.length-1;i++)if(segRect(cp[i],cp[i+1],g.x+10,g.y-2,g.x+50,g.y+h+2)){gates.add(g.id);break}}
  for(const w of C.wires){
    if(gates.has(w.from.g)||gates.has(w.to.g)){wires.add(w.id);continue}
    const pl=wirePts(w);
    outer:for(let i=0;i<cp.length-1;i++)for(let j=0;j<pl.length-1;j++)if(segX(cp[i],cp[i+1],pl[j],pl[j+1])){wires.add(w.id);break outer}}
  return{wires,gates};
}
function applyCut(){
  const {wires,gates}=cutHits();
  if(wires.size||gates.size){
    snapshot();
    C.gates.forEach(g=>{if(gates.has(g.id))fxRing(g.x+30,g.y+GATES[g.type].h/2,22,1)});
    C.gates=C.gates.filter(g=>!gates.has(g.id));C.wires=C.wires.filter(w=>!wires.has(w.id));
    if(sel&&(gates.has(sel.g)||wires.has(sel.w)))sel=null;
    sfx('remove');cut=null;changed();
  }else{cut=null;render()}
}
/* dropping a gate onto a wire splices it in: source → gate input, gate output → old destination */
function wireUnder(gx,gy,type,skip){
  const P=gPins(type);let best=null;
  for(const w of C.wires){
    if(skip&&(w.from.g===skip||w.to.g===skip))continue;
    const pl=wirePts(w);
    for(let j=0;j<pl.length-1;j++){const a=pl[j],b=pl[j+1];if(a.y!==b.y)continue;
      if(Math.min(a.x,b.x)>gx+10||Math.max(a.x,b.x)<gx+50)continue;
      const h=GATES[type].h;if(a.y<gy-12||a.y>gy+h+12)continue;
      P.i.forEach((py,p)=>{const d=Math.abs(a.y-(gy+py));if(!best||d<best.d)best={w,p,y:a.y-py,d}});
    }
  }
  return best;
}
function spliceIn(g,ins){
  const w=ins.w;
  C.wires=C.wires.filter(x=>x!==w);
  const pre=(w.pts||[]).filter(p=>p.x<g.x),post=(w.pts||[]).filter(p=>p.x>g.x+GW);
  C.wires.push({id:'w'+(nextId++),from:{g:w.from.g,p:w.from.p},to:{g:g.id,p:ins.p},pts:pre,...(w.c?{c:w.c}:{})});
  C.wires.push({id:'w'+(nextId++),from:{g:g.id,p:0},to:{g:w.to.g,p:w.to.p},pts:post,...(w.c?{c:w.c}:{})});
  sfx('relay');
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
    if(hover&&hover.k==='i'){finishWire(hover);return}
    if(touch){tmp=null;hover=null;render();return}
    tmp.pts.push({x:snap(p.x,10),y:snap(p.y,10)});tmp.cur=p;render();return;
  }
  if(right){act={kind:'rclick',sx:e.clientX,sy:e.clientY,h};cut={pts:[p]};return}
  if(knife&&h.type!=='in'){act={kind:'cut'};cut={pts:[p]};if(sel){sel=null}render();return}
  if(h.type==='pin'&&h.k==='o'){startWire({g:h.g,p:h.p},[],p);act={kind:'wire',sx:e.clientX,sy:e.clientY};render();return}
  if(h.type==='pin'&&h.k==='i'){ // pull existing wire off an input
    const w=C.wires.filter(w=>w.to.g===h.g&&w.to.p===h.p).pop();
    if(w){snapshot();C.wires=C.wires.filter(x=>x!==w);startWire(w.from,w.pts||[],p);tmp.c=w.c;act={kind:'wire',sx:e.clientX,sy:e.clientY,detached:true};changed();return}
    return;
  }
  if(h.type==='wire'){
    const w=C.wires.find(x=>x.id===h.id);
    if(sel&&sel.w===w.id){const g=segGrab(w,p);if(g){act=Object.assign({kind:'seg',sx:e.clientX,sy:e.clientY,w,moved:false},g);return}}
    const n=nearestOnWire(w,p);
    act={kind:'branch',sx:e.clientX,sy:e.clientY,w,n};return;
  }
  if(h.type==='gate'){
    const g=C.gates.find(x=>x.id===h.id);
    act={kind:'gate',g,ox:p.x-g.x,oy:p.y-g.y,sx:e.clientX,sy:e.clientY,moved:false};return;
  }
  if(h.type==='in'){act={kind:'toggle',i:h.i};return}
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
  if(ghost&&e.pointerType==='touch')loupe(e.clientX,e.clientY);
  if(ghost){ghost.x=snap(p.x-30);ghost.y=snap(p.y-GATES[ghost.type].h/2);ghost.ins=wireUnder(ghost.x,ghost.y,ghost.type);if(ghost.ins)ghost.y=ghost.ins.y;renderSoon();return}
  if(tmp){
    tmp.cur=p;
    const el=document.elementFromPoint(e.clientX,e.clientY);const h=el?hitInfo(el):{type:'empty'};
    hover=h.type==='pin'&&h.k==='i'?h:nearestIn(p,(e.pointerType==='touch'?40:16)/view.z);renderSoon();
    if(e.pointerType==='touch'&&tmp.mode==='drag')loupe(e.clientX,e.clientY);
  }
  if(!act)return;
  const dist=act.sx!=null?Math.hypot(e.clientX-act.sx,e.clientY-act.sy):99;
  if(act.kind==='pan'){view.x=act.vx+e.clientX-act.sx;view.y=act.vy+e.clientY-act.sy;viewXf()}
  else if(act.kind==='gate'){
    if(!act.moved&&dist>4){act.moved=true;snapshot()}
    if(act.moved){act.g.x=snap(p.x-act.ox);act.g.y=snap(p.y-act.oy);
      const free=!C.wires.some(w=>w.from.g===act.g.id||w.to.g===act.g.id);
      act.ins=free?wireUnder(act.g.x,act.g.y,act.g.type,act.g.id):null;if(act.ins)act.g.y=act.ins.y;renderSoon()}
  }else if(act.kind==='seg'){
    if(!act.moved&&dist>4){act.moved=true;snapshot()}
    if(act.moved){const P=act.P.map(q=>({x:q.x,y:q.y})),j=act.j;
      if(act.h){const y=snap(p.y,10);P[j].y=P[j+1].y=y}
      else{let x=snap(p.x,10);if(j===1)x=Math.max(x,P[0].x+10);if(j+2===P.length-1)x=Math.min(x,P[P.length-1].x-10);P[j].x=P[j+1].x=x}
      act.w.pts=P.slice(1,-1);sel.at=p;renderSoon()}
  }else if(act.kind==='branch'&&dist>5){
    startWire(act.w.from,[...act.n.pre,act.n.pt],p);act={kind:'wire',sx:act.sx,sy:act.sy,branch:true};renderSoon();
  }else if(act.kind==='cut'||act.kind==='rclick'){cut.pts.push(p);if(act.kind==='rclick'&&dist>6)act.kind='cut';renderSoon()}
});
window.addEventListener('pointerup',e=>{
  ptrs.delete(e.pointerId);
  if(pinch){if(ptrs.size<2)pinch=null;return}
  if(ghost){
    loupeOff();
    const under=document.elementFromPoint(e.clientX,e.clientY),overBoard=under&&(under===board||board.contains(under));
    if(overBoard&&Math.hypot(e.clientX-ghost.sx,e.clientY-ghost.sy)>=6){if(atLimit()){ghost=null;render();return}snapshot();const ng={id:'g'+(nextId++),type:ghost.type,x:ghost.x,y:ghost.y};C.gates.push(ng);if(ghost.ins)spliceIn(ng,ghost.ins);sfx('place');fxRing(ghost.x+30,ghost.y+GATES[ghost.type].h/2,22);ghost=null;changed();gatePlaced()}
    else{ghost=null;render()}
    return;
  }
  if(!act)return;
  const a=act;act=null;board.classList.remove('panning');
  const dist=a.sx!=null?Math.hypot(e.clientX-a.sx,e.clientY-a.sy):0;
  if(a.kind==='wire'){
    loupeOff();
    const el=document.elementFromPoint(e.clientX,e.clientY);let h=el?hitInfo(el):{type:'empty'};
    if(!(h.type==='pin'&&h.k==='i')&&hover&&hover.k==='i')h=hover;
    if(h.type==='pin'&&h.k==='i'){finishWire(h);return}
    if(dist<6&&!a.branch){tmp.mode='click';render();return} // tap on an output: now tap an input
    tmp=null;hover=null;render();return;                      // released anywhere else: the wire is dropped
  }
  if(a.kind==='branch'){sel={w:a.w.id,at:toW(e.clientX,e.clientY)};render();return}
  if(a.kind==='seg'){if(a.moved){sfx('place');changed()}else{sel={w:a.w.id,at:toW(e.clientX,e.clientY)};render()}return}
  if(a.kind==='gate'){if(a.moved){if(a.ins)spliceIn(a.g,a.ins);changed()}else{sel={g:a.g.id};render()}return}
  if(a.kind==='toggle'){liveIn[a.i]^=1;rowMark=null;sfx('toggle',liveIn[a.i]);update();return}
  if(a.kind==='rclick'){
    cut=null;
    if(a.h.type==='wire')return delWire(a.h.id);
    if(a.h.type==='gate')return delGate(a.h.id);
    render();return;
  }
  if(a.kind==='cut'){applyCut();return}
});
window.addEventListener('pointercancel',e=>{ptrs.delete(e.pointerId);act=null;pinch=null;cut=null;loupeOff();if(tmp&&tmp.mode==='drag')tmp=null;board.classList.remove('panning')});

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

const KEYDEF={undo:['Ctrl+Z'],redo:['Ctrl+Y','Ctrl+Shift+Z'],del:['Delete','Backspace'],verify:['Enter'],menu:['Escape'],fit:['F'],zin:['='],zout:['-'],
  hint:['H'],knife:['K'],sheet:['T'],bit:['B']};
const KEYORDER=['verify','undo','redo','del','knife','hint','fit','zin','zout','sheet','bit','menu'];
function keysFor(a){const k=settings.keys&&settings.keys[a];return k?[k]:KEYDEF[a]}
function keyName(e){
  const c=e.code||'';
  if(/^Key[A-Z]$/.test(c))return c.slice(3);
  if(/^Digit\d$/.test(c))return c.slice(5);
  if(/^Numpad\d$/.test(c))return 'Num '+c.slice(6);
  const M={Equal:'=',Minus:'-',NumpadAdd:'Num +',NumpadSubtract:'Num −',Space:'Space',BracketLeft:'[',BracketRight:']',Semicolon:';',Quote:"'",Comma:',',Period:'.',Slash:'/',Backslash:'\\',Backquote:'`',NumpadEnter:'Enter'};
  if(M[c])return M[c];
  return e.key&&e.key.length>1?e.key:(e.key||'').toUpperCase();
}
function combo(e){const k=keyName(e);if(['Control','Shift','Alt','Meta'].includes(k))return null;return (e.ctrlKey||e.metaKey?'Ctrl+':'')+(e.altKey?'Alt+':'')+(e.shiftKey?'Shift+':'')+k}
function keyLabel(k){return LANG==='en'?k:k.replace('Space','Пробел').replace('Delete','Del').replace('Backspace','Backspace').replace('Escape','Esc').replace('Enter','Enter')}
const KEYACT={
  undo:()=>undo(),redo:()=>redo(),
  del:()=>{if(sel){if(sel.g)delGate(sel.g);else if(sel.w)delWire(sel.w);sel=null;render()}},
  verify:()=>{if(!$('#result').classList.contains('on'))$('#verify').click()},
  fit:()=>fit(),zin:()=>$('#zIn').click(),zout:()=>$('#zOut').click(),
  hint:()=>{if(level&&level.hint&&!level.sandbox)$('#hintBtn').click()},
  knife:()=>$('#knifeBtn').click(),sheet:()=>sheetToggle(),
  bit:()=>{if($('#chat').classList.contains('on'))hideBubble();else $('#bitTab').click()}
};
let kbNav=false;
window.addEventListener('pointerdown',()=>{kbNav=false},true);
window.addEventListener('keydown',e=>{if(e.key==='Tab')kbNav=true},true);
window.addEventListener('keydown',e=>{
  if(window.keyCapture){window.keyCapture(e);return}
  if(e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
  const c=combo(e);if(!c)return;
  if((c==='Enter'||c==='Space')&&e.target&&e.target.closest&&e.target.closest('button')&&kbNav&&(!$('#result').classList.contains('on')||e.target.closest('#result')))return;
  const act_=KEYORDER.find(a=>keysFor(a).includes(c));if(!act_)return;
  const inMenu=$('#ov').classList.contains('on');
  if(act_==='menu'){e.preventDefault();if(tmp){tmp=null;render();return}if(knife){knifeSet(false);return}if($('#result').classList.contains('on')){$('#result').classList.remove('on');return}if(!inMenu)openMenu('main');else if(level)closeMenu();return}
  if(inMenu||demoOn&&act_!=='verify')return;
  e.preventDefault();KEYACT[act_]();
});
$('#undo').onclick=undo;$('#redo').onclick=redo;
// icon buttons: name and current hotkey in the tooltip
function toolTips(){for(const el of $$('[data-tl]')){const a=el.dataset.tl,k=KEYDEF[a]?keysFor(a)[0]:'',t=ui(a);el.setAttribute('aria-label',t);el.title=k?t+' ('+keyLabel(k)+')':t}}
$('#btnClear').onclick=()=>{if(!C.gates.length&&!C.wires.length)return;snapshot();C={gates:[],wires:[]};changed()};

let tT;function toast(t,ms=2600){const el=$('#toast');el.textContent=t;el.classList.add('on');clearTimeout(tT);tT=setTimeout(()=>el.classList.remove('on'),ms)}

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
  const n=level.vec.length,dt=(n>32?120:n>8?340:n>4?540:760)*settings.demo;
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
let mLP=null,AC=null,master,mBus,sBus,vBus,musicT=null,noiseBuf=null;
const mtof=m=>440*Math.pow(2,(m-69)/12);
function ensureAudio(){
  if(AC){if(AC.state==='suspended')AC.resume();return}
  try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){return}
  master=AC.createGain();
  const comp=AC.createDynamicsCompressor();comp.threshold.value=-20;comp.ratio.value=3;comp.attack.value=.004;comp.release.value=.2;
  master.connect(comp);comp.connect(AC.destination);
  sBus=AC.createGain();sBus.connect(master);
  vBus=AC.createGain();vBus.connect(master);
  const lp=mLP=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2200;lp.Q.value=.4;
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
  coin(){const t=AC.currentTime;osc(sBus,'triangle',mtof(88),t,.12,.06);osc(sBus,'triangle',mtof(83),t+.06,.18,.05);noise(sBus,t,.02,.12,'highpass',6000,.7)},
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
/* moods: the theme leans towards what is happening (and how Bit reacts) and glides between states.
   Numbers ease a little every step; the scale changes only on a bar line, pads overlap, so nothing jumps. */
const MOODS={
  calm:   {dens:.25,bright:.85,tempo:.94,arp:0, bass:0, pulse:0, sc:null},
  focus:  {dens:.5, bright:1,  tempo:1,  arp:0, bass:0, pulse:0, sc:null},
  bright: {dens:.75,bright:1.7,tempo:1.06,arp:.9,bass:.2,pulse:0, sc:'lyd'},
  playful:{dens:.6, bright:1.3,tempo:1.04,arp:.2,bass:.9,pulse:0, sc:'mix'},
  low:    {dens:.2, bright:.55,tempo:.86,arp:0, bass:0, pulse:0, sc:'min'},
  tense:  {dens:.4, bright:.75,tempo:1.1, arp:0, bass:0, pulse:.9,sc:'min'}
};
const mus={ch:1,step:0,next:0,base:'focus',mood:'focus',cur:Object.assign({},MOODS.focus),sc:null,moodT:0};
function musicChapter(ch,calm){mus.ch=CHM[ch]?ch:1;mus.base=calm?'calm':'focus';if(!mus.moodT)mus.mood=mus.base}
function musicMood(m,hold=22000){
  if(!m||!MOODS[m])return;mus.mood=m;clearTimeout(mus.moodT);
  mus.moodT=setTimeout(()=>{mus.moodT=0;mus.mood=mus.base},hold);
}
const deg=(sc,root,d)=>{const s=SCALES[sc],o=Math.floor(d/7);return root+s[((d%7)+7)%7]+12*o};
function pad(f,t,dur,v){[-4,4].forEach(dt=>{const o=AC.createOscillator(),g=AC.createGain(),lp=AC.createBiquadFilter();o.type='sawtooth';o.frequency.value=f;o.detune.value=dt;lp.type='lowpass';lp.frequency.value=700;
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+1.4);g.gain.setValueAtTime(v,t+dur-1.2);g.gain.linearRampToValueAtTime(.0001,t+dur);o.connect(lp);lp.connect(g);g.connect(mBus);o.start(t);o.stop(t+dur+.05)})}
function pluck(f,t,dur,v,type){const o=AC.createOscillator(),g=AC.createGain(),lp=AC.createBiquadFilter();o.type=type;o.frequency.value=f;lp.type='lowpass';lp.frequency.setValueAtTime(f*6,t);lp.frequency.exponentialRampToValueAtTime(f*1.2,t+dur);env(g,t,.004,v,dur);o.connect(lp);lp.connect(g);g.connect(mBus);o.start(t);o.stop(t+dur+.05)}
function hum(){[[50,.010],[100,.006],[150,.003]].forEach(([f,v])=>{const o=AC.createOscillator(),g=AC.createGain();o.frequency.value=f;g.gain.value=v;o.connect(g);g.connect(mBus);o.start()})}
function playStep(st,t,root,sc0,sp){
  const bar=Math.floor(st/16),cd=PROG[bar%4],s=st%16,M=mus.cur,T=MOODS[mus.mood];
  for(const k of ['dens','bright','tempo','arp','bass','pulse'])M[k]+=(T[k]-M[k])*.035;
  if(s===0){mus.sc=T.sc||sc0;if(mLP)mLP.frequency.setTargetAtTime(2200*M.bright,t,1.5)}
  const sc=mus.sc||sc0;
  if(M.arp>.05&&s%2===0&&Math.random()<M.arp){const k=[0,2,4,7,9,7,4,2][(s/2)%8];pluck(mtof(deg(sc,root+12,cd+k)),t,.32,.022,'sine')}
  if(M.bass>.05&&(s===2||s===6||s===10||s===14)&&Math.random()<M.bass)pluck(mtof(deg(sc,root-12,cd+(s===10?4:0))),t,.16,.06,'triangle');
  if(M.pulse>.05&&s%2===1&&Math.random()<M.pulse)pluck(mtof(deg(sc,root-24,cd)),t,.09,.05,'square');
  if(s===0){[0,2,4].forEach(k=>pad(mtof(deg(sc,root,cd+k)),t,sp*16+.6,.012));pluck(mtof(deg(sc,root-12,cd)),t,.9,.07,'sine')}
  if(s===8)pluck(mtof(deg(sc,root-12,cd+4)),t,.6,.045,'sine');
  const pat=[1,0,.35,0,.7,0,.3,.15,.85,0,.4,0,.6,.2,.3,0];
  if(Math.random()<pat[s]*M.dens){const k=[0,2,4,7,9][Math.floor(Math.random()*5)];pluck(mtof(deg(sc,root+12,cd+k)),t,.4,.035,'triangle')}
  if(s%4===0){const n=AC.createBufferSource();n.buffer=noiseBuf;const f=AC.createBiquadFilter();f.type='highpass';f.frequency.value=6000;const g=AC.createGain();env(g,t,.001,.02,.02);n.connect(f);f.connect(g);g.connect(mBus);n.start(t,Math.random()*.5);n.stop(t+.04)}
}
function startMusic(){
  hum();mus.next=AC.currentTime+.3;
  musicT=setInterval(()=>{if(!AC||AC.state!=='running')return;const [root,sc,bpm]=CHM[mus.ch],sp=60/(bpm*mus.cur.tempo)/4;
    if(mus.next<AC.currentTime)mus.next=AC.currentTime+.05;
    while(mus.next<AC.currentTime+.3){playStep(mus.step,mus.next,root,sc,sp);mus.next+=sp;mus.step=(mus.step+1)%64}},100);
}

/* ========== palette: truth table of a gate on hover (long press on touch) ========== */
const GATE_INFO={
  NOT :{f:()=>'Y = '+ov('A'),d:['Инвертирует вход: 0 → 1, 1 → 0','Inverts the input: 0 → 1, 1 → 0']},
  AND :{f:()=>'Y = A ∧ B',d:['1, только если оба входа 1','1 only when both inputs are 1']},
  OR  :{f:()=>'Y = A ∨ B',d:['1, если хотя бы один вход 1','1 when at least one input is 1']},
  NAND:{f:()=>'Y = '+ov('A ∧ B'),d:['0, только если оба входа 1','0 only when both inputs are 1']},
  NOR :{f:()=>'Y = '+ov('A ∨ B'),d:['1, только если оба входа 0','1 only when both inputs are 0']},
  XOR :{n:['Исключающее ИЛИ','Exclusive OR'],f:()=>'Y = A ⊕ B',d:['1, если входы разные','1 when the inputs differ']},
  XNOR:{n:['Равнозначность','Equivalence'],f:()=>'Y = '+ov('A ⊕ B'),d:['1, если входы одинаковые','1 when the inputs are equal']},
  DFF :{n:['D-триггер','D flip-flop'],f:()=>'Q<sub>n+1</sub> = D',d:['По фронту C запоминает D, в остальное время хранит Q','Stores D on the rising edge of C, otherwise keeps Q']}
};
function gateTipHTML(t){
  const G=GATES[t],I=GATE_INFO[t]||{f:()=>'',d:''};
  let tb='<table class="gtt">';
  if(t==='DFF'){
    tb+='<tr><th>D</th><th>C</th><th class="sep"></th><th>Q<sub>n+1</sub></th></tr>';
    for(const [d,c,q,one] of [['0','↑','0',0],['1','↑','1',1],['×','0, 1, ↓','Q<sub>n</sub>',0]])
      tb+=`<tr><td>${d}</td><td>${c}</td><td class="sep"></td><td class="o${one?' one':''}">${q}</td></tr>`;
  }else{
    const n=G.ins,names=n===1?['A']:['A','B'];
    tb+='<tr>'+names.map(k=>`<th>${k}</th>`).join('')+'<th class="sep"></th><th>Y</th></tr>';
    for(let r=0;r<1<<n;r++){
      const ins=names.map((_,i)=>(r>>(n-1-i))&1),y=G.f(ins)[0];
      tb+='<tr>'+ins.map(v=>`<td>${v}</td>`).join('')+`<td class="sep"></td><td class="o${y?' one':''}">${y}</td></tr>`;
    }
  }
  tb+='</table>';
  const nm=I.n||G.n;
  // one card: name (hover it to see the other language), formula, table
  const other=LANG==='en'?nm[0]:G.n[1];
  return `<div class="gt-h"><b class="gt-n"><span>${tx(nm)}</span>${other&&other!==tx(nm)?`<span class="alt" lang="${LANG==='en'?'ru':'en'}">${other}</span>`:''}</b></div><div class="gt-f math">${mathHTML(I.f())}</div>${tb}`;
}
const gtip=(()=>{
  const el=document.createElement('div');el.id='gtip';el.className='zz';el.setAttribute('role','tooltip');document.body.appendChild(el);
  let cur=null,lp=null,hideT=0;
  function show(it){
    const t=it.dataset.type;if(!GATES[t])return;
    if(cur!==t){el.innerHTML=gateTipHTML(t);cur=t}
    clearTimeout(hideT);
    const z=UI(),pr=$('#palette').getBoundingClientRect(),ir=it.getBoundingClientRect(),w=el.offsetWidth*z,h=el.offsetHeight*z,g=12,m=8,tp=$('#top').getBoundingClientRect().bottom+m;
    // try every side of the palette in turn; the first one that fits on screen without covering the palette (and so the gate) wins
    const cx=clamp(ir.left+ir.width/2-w/2,m,innerWidth-w-m),cy=clamp(ir.top+ir.height/2-h/2,tp,innerHeight-h-m);
    const C=[[pr.right+g,cy],[cx,pr.top-g-h],[cx,pr.bottom+g],[pr.left-g-w,cy]];
    const fits=([x,y])=>x>=m&&y>=tp&&x+w<=innerWidth-m&&y+h<=innerHeight-m;
    const [x,y]=C.find(fits)||[clamp(pr.right+g,m,innerWidth-w-m),cy];
    el.style.left=(x/z)+'px';el.style.top=(y/z)+'px';el.classList.add('on');
  }
  function hide(){el.classList.remove('on');clearTimeout(lp&&lp.t);lp=null}
  const pal=$('#palette');
  pal.addEventListener('pointerover',e=>{if(e.pointerType!=='mouse'||ghost)return;const it=e.target.closest('.pi');if(it)show(it)});
  // a short grace period lets the mouse cross the gap to the card (to hover its name)
  pal.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'){clearTimeout(hideT);hideT=setTimeout(hide,160)}});
  el.addEventListener('pointerenter',()=>clearTimeout(hideT));
  el.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')hide()});
  // touch: hold a gate still for a moment to see its table; letting go then does not place it
  pal.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'){hide();return}
    const it=e.target.closest('.pi');if(!it)return;
    lp={x:e.clientX,y:e.clientY,shown:false,t:setTimeout(()=>{if(lp){lp.shown=true;show(it)}},420)};
  });
  window.addEventListener('pointermove',e=>{if(lp&&Math.hypot(e.clientX-lp.x,e.clientY-lp.y)>8)hide()},{passive:true});
  pal.addEventListener('pointerup',()=>{if(lp&&lp.shown)ghost=null;hide()},true);
  window.addEventListener('pointerup',()=>{if(lp)hide()});
  return {hide};
})();
