s = open('src/editor.js', encoding='utf-8').read()

# ---------- 1. refactor qmExpr: extract qmPrime so the synthesiser can reuse it ----------
old = """/* Quine-McCluskey minimisation to a sum of products; literals join by concatenation (AB = A& B), terms by OR */
function qmExpr(n,minterms,ins){
  if(!minterms.length)return'0';
  if(minterms.length>=(1<<n))return'1';
  const full=(1<<n)-1;"""
assert s.count(old) == 1
s = s.replace(old, """/* Quine-McCluskey minimisation to a sum of products; literals join by concatenation (AB = A& B), terms by OR */
function qmPrime(n,minterms){
  const full=(1<<n)-1;""", 1)

old = """  const cnt=p=>{let c=0;for(let j=0;j<n;j++)if(p.m&(1<<j))c++;return c};
  pickT.sort((a,b)=>cnt(a)-cnt(b));
  return pickT.map(p=>{
    const ls=[];
    for(let j=0;j<n;j++){
      const bit=1<<(n-1-j);
      if(p.m&bit)ls.push((p.b&bit)?esc(ins[j]):ov(esc(ins[j])));
    }
    return ls.join('')||'1';
  }).join(' \\u2228 ');
}"""
assert s.count(old) == 1
s = s.replace(old, """  const cnt=p=>{let c=0;for(let j=0;j<n;j++)if(p.m&(1<<j))c++;return c};
  pickT.sort((a,b)=>cnt(a)-cnt(b));
  return pickT;
}
function qmExpr(n,minterms,ins){
  if(!minterms.length)return'0';
  if(minterms.length>=(1<<n))return'1';
  return qmPrime(n,minterms).map(p=>{
    const ls=[];
    for(let j=0;j<n;j++){
      const bit=1<<(n-1-j);
      if(p.m&bit)ls.push((p.b&bit)?esc(ins[j]):ov(esc(ins[j])));
    }
    return ls.join('')||'1';
  }).join(' \\u2228 ');
}

/* ========== hint tiers: ready-circuit synthesis ==========
   Builds a sum-of-products circuit from the level truth table using only the gates
   the level offers. Returns null for sequential levels and impossible gate sets.
   The layout is plain columns by depth; the A* router wires it up. */
function synth(lv){
  if(lv.seq||lv.clk)return null;
  const nIn=lv.ins.length;if(!nIn)return null;
  const av=lv.gates,has=t=>av.includes(t);
  const gates=[],wires=[];let nx=1;
  const depth={},colN={};
  const need=()=>{throw 'nosynth'};
  function place(type,deps){
    const d=1+Math.max(0,...deps.map(sg=>depth[sg[0]]|0));
    const k=colN[d]=(colN[d]|0)+1;
    const x=110+d*105,y=-270+(d%2)*45+(k-1)*90;
    const id='g'+(nx++);gates.push({id,type,x,y});depth[id]=d;return id;
  }
  const wire=(f,fp,t,tp)=>wires.push({id:'w'+(nx++),from:{g:f,p:fp},to:{g:t,p:tp},pts:[]});
  const join=(sig,g,nin)=>{wire(sig[0],sig[1],g,0);if(nin>1)wire(sig[0],sig[1],g,1)};
  function gNOT(sig){
    let g;
    if(has('NOT')){g=place('NOT',[sig]);wire(sig[0],sig[1],g,0);return[g,0]}
    if(has('NAND')){g=place('NAND',[sig]);join(sig,g,2);return[g,0]}
    if(has('NOR')){g=place('NOR',[sig]);join(sig,g,2);return[g,0]}
    need();
  }
  function gAND2(a,b){
    let g;
    if(has('AND')){g=place('AND',[a,b]);wire(a[0],a[1],g,0);wire(b[0],b[1],g,1);return[g,0]}
    if(has('NAND')){g=place('NAND',[a,b]);wire(a[0],a[1],g,0);wire(b[0],b[1],g,1);return gNOT([g,0])}
    if(has('NOR')){const na=gNOT(a),nb=gNOT(b);g=place('NOR',[na,nb]);wire(na[0],na[1],g,0);wire(nb[0],nb[1],g,1);return[g,0]}
    need();
  }
  function gOR2(a,b){
    let g;
    if(has('OR')){g=place('OR',[a,b]);wire(a[0],a[1],g,0);wire(b[0],b[1],g,1);return[g,0]}
    if(has('NAND')){const na=gNOT(a),nb=gNOT(b);g=place('NAND',[na,nb]);wire(na[0],na[1],g,0);wire(nb[0],nb[1],g,1);return[g,0]}
    if(has('NOR')){g=place('NOR',[a,b]);wire(a[0],a[1],g,0);wire(b[0],b[1],g,1);return gNOT([g,0])}
    need();
  }
  const invC={};
  function lit(j,neg){
    const src=['I'+j,0];
    if(!neg)return src;
    if(!invC[j])invC[j]=gNOT(src);
    return invC[j];
  }
  function chain(fn,sigs){
    let acc=sigs[0];
    for(let i=1;i<sigs.length;i++)acc=fn(acc,sigs[i]);
    return acc;
  }
  try{
    lv.outs.forEach((k,oi)=>{
      const mts=[];
      lv.vec.forEach((r,m)=>{if(r.out[k])mts.push(m)});
      let sig;
      if(!mts.length)sig=gAND2(['I0',0],lit(0,true));
      else if(mts.length===(1<<nIn))sig=gOR2(['I0',0],lit(0,true));
      else{
        const terms=qmPrime(nIn,mts).map(p=>{
          const ls=[];
          for(let j=0;j<nIn;j++){const bit=1<<(nIn-1-j);if(p.m&bit)ls.push(lit(j,!(p.b&bit)))}
          return ls.length===1?ls[0]:chain(gAND2,ls);
        });
        sig=terms.length===1?terms[0]:chain(gOR2,terms);
      }
      wire(sig[0],sig[1],'O'+oi,0);
    });
  }catch(e){return null}
  return{gates,wires};
}
function h1Text(lv){
  if(lv.h1)return tx(lv.h1);
  const g=lv.gates.map(t=>tx(GATES[t].n)).join(', ');
  return ui('hGen1',{g:g||'—',n:lv.par});
}
function h3Text(lv){
  const syn=lv._syn||(lv._syn=synth(lv));
  if(!syn)return tx(lv.hint);
  const cnt={};syn.gates.forEach(g=>cnt[g.type]=(cnt[g.type]||0)+1);
  const parts=Object.keys(cnt).map(t=>cnt[t]+'× '+tx(GATES[t].n)).join(', ');
  return ui('hNeed')+': '+(parts||ui('hNoGates'))+'.';
}
function hintPanelDraw(){
  const el=$('#hint');if(!el||!level)return;
  const t=hintTier();
  if(level.sandbox||!t){if(level&&!level.sandbox)el.innerHTML='';el.classList.remove('on');if(level&&level.sandbox){el.innerHTML=mathHTML(tx(level.hint))}return}
  const sec=(title,body)=>`<div class="ht"><b>${title}</b><div class="htb math">${mathHTML(body)}</div></div>`;
  let h=sec(ui('hT1'),h1Text(level));
  if(t>=2)h+=sec(ui('hT2'),tx(level.hint));
  if(t>=3)h+=sec(ui('hT3'),h3Text(level));
  if(t>=4)h+=`<div class="ht"><b>${ui('hT4')}</b><div class="htb"><button class="tbtn primary" id="hInsBtn">${ui('hInsert')}</button></div></div>`;
  el.innerHTML=h;el.classList.add('on');
}
function insertSynth(){
  const syn=level&&(level._syn||(level._syn=synth(level)));
  if(!syn){say([{t:ui('hNoSeq'),m:'sad'}],{u:1});return}
  snapshot();
  C=JSON.parse(JSON.stringify(syn));
  nextId=1+Math.max(0,...C.gates.map(g=>+g.id.slice(1)),...C.wires.map(w=>+w.id.slice(1)));
  sel=null;multi.clear();
  hideBubble();changed();fit();
  toast(ui('hInserted'));
  sfx('stamp',true);
}
document.addEventListener('click',e=>{
  if(!e.target.closest||!e.target.closest('#hInsBtn'))return;
  const syn=level._syn||(level._syn=synth(level));
  if(!syn){say([{t:ui('hNoSeq'),m:'sad'}],{u:1});return}
  if(!C.gates.length&&!C.wires.length){insertSynth();return}
  say([{t:ui('hReplaceQ'),m:'think',ch:[{t:ui('hYes'),f:insertSynth},{t:ui('hNo'),f:hideBubble}]}],{u:1});
});

/* ========== bench: manual ticks, tick log, sandbox analysis ==========*/"""
, 1)

# ---------- 2. buildChrome: use hintPanelDraw ----------
old = "  $('#hint').innerHTML=mathHTML(tx(level.hint));$('#hint').classList.toggle('on',hintBought());"
assert s.count(old) == 1
s = s.replace(old, "  hintPanelDraw();", 1)

open('src/editor.js', 'w', encoding='utf-8').write(s)
print('editor ok')

# ---------- 3. bit.js: rewrite giveHint for tiers ----------
b = open('src/bit.js', encoding='utf-8').read()
old = """function giveHint(){
  if(!level||level.sandbox){say([{t:STORY.noHint,m:'think'}],{u:1});return}
  if(!hintUsed){
    const c=hintPrice();
    if(c>balance()){say([{t:fmt(tx(STORY.broke),{c:ptsN(c),b:ptsN(balance())}),m:'sad',ch:[{t:UIS.cEarn,f:()=>openMenu('shop')},{t:UIS.cSelf,r:{t:UIS.selfR,m:'smug'}}]}],{u:1});return}
    if(c){spend(c);sfx('coin')}
    prog.hb=prog.hb||[];if(!prog.hb.includes(level.id))prog.hb.push(level.id);
    hintUsed=true;prog.st.hints=(prog.st.hints||0)+1;save();updHud();
  }
  $('#hint').classList.add('on');
  say([{t:tx(pick(STORY.hintPre))+' '+tx(level.hint),m:'think'}],{u:1});
}"""
assert b.count(old) == 1
b = b.replace(old, """function giveHint(){
  if(!level||level.sandbox){say([{t:STORY.noHint,m:'think'}],{u:1});return}
  const t=hintTier(),maxT=hintMaxTier();
  if(t>=maxT){hintPanelDraw();say([{t:tx(pick(STORY.hintPre))+' '+ui('hintOpen'),m:'think'}],{u:1});return}
  const nt=t+1,c=hintCost(nt);
  if(c>balance()){say([{t:fmt(tx(STORY.broke),{c:ptsN(c),b:ptsN(balance())}),m:'sad',ch:[{t:UIS.cEarn,f:()=>openMenu('shop')},{t:UIS.cSelf,r:{t:UIS.selfR,m:'smug'}}]}],{u:1});return}
  if(c){spend(c);sfx('coin')}
  prog.hb=prog.hb||{};prog.hb[level.id]=nt;
  hintUsed=true;prog.st.hints=(prog.st.hints||0)+1;save();updHud();
  hintPanelDraw();
  const body=nt===1?h1Text(level):nt===2?tx(level.hint):nt===3?h3Text(level):ui('hT4')+'. '+ui('hInsert');
  say([{t:tx(pick(STORY.hintPre))+' '+body,m:'think'}],{u:1});
}""", 1)
open('src/bit.js', 'w', encoding='utf-8').write(b)
print('bit ok')
