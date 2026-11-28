s = open('/mnt/d/DITK/buildlogiccomputer/src/editor.js', encoding='utf-8').read()

# ---------- 1. block registry after the GATES definition ----------
old = """const ALL_GATES=Object.keys(GATES);
SANDBOX.gates=ALL_GATES;"""
assert s.count(old) == 1
s = s.replace(old, """const ALL_GATES=Object.keys(GATES);
SANDBOX.gates=ALL_GATES;

/* ========== solved circuits as reusable blocks ==========
   A solved combinational level becomes a chip in later levels and the sandbox.
   The chip is simulated through a truth table captured from the player's own
   circuit, so the settle loop needs no special casing at all. */
function blkType(lv){return 'B'+lv.id}
function blkList(){
  return LV.filter(l=>!l.sandbox&&!l.seq&&!l.clk&&done.has(l.id)&&saves[l.id]&&saves[l.id].gates&&saves[l.id].gates.length).sort((a,b)=>a.id-b.id);
}
function blkTable(lv){
  const n=lv.ins.length,rows=[];
  const keepC=C,keepLevel=level,keepNext=nextId;
  level=lv;C=JSON.parse(JSON.stringify(saves[lv.id]));
  for(let m=0;m<(1<<n);m++){
    resetSim();
    settle(lv.ins.map((_,j)=>(m>>(n-1-j))&1));
    const o=readOuts();
    rows.push(lv.outs.map(k=>o[k]|0));
  }
  C=keepC;level=keepLevel;nextId=keepNext;
  resetSim();settle(liveIn);
  return rows;
}
function blkRegister(lv){
  const t=blkType(lv);
  if(GATES[t])return;
  const rows=blkTable(lv);
  const nIn=lv.ins.length;
  GATES[t]={
    n:lv.t,ins:nIn,outs:lv.outs.length,blk:lv.id,
    h:Math.max(40,Math.max(nIn,lv.outs.length)*20+16),
    f:ii=>rows[ii.reduce((a,b,j)=>a|((b|0)<<(nIn-1-j)),0)].slice()
  };
}
function blkRegisterAll(){blkList().forEach(blkRegister)}
function blkTypesFor(l){
  return blkList().filter(b=>l.sandbox||b.id<l.id).map(blkType);
}
function blkRefresh(lv){delete GATES[blkType(lv)];blkRegister(lv)}""", 1)

# ---------- 2. gPins generalised for blocks ----------
old = """function gPins(type){
  if(type==='DFF') return {i:[20,40],o:[20,40]};
  return {i:GATES[type].ins===1?[20]:[10,30],o:[20]};
}"""
assert s.count(old) == 1
s = s.replace(old, """function gPins(type){
  if(type==='DFF') return {i:[20,40],o:[20,40]};
  const G=GATES[type];
  if(G.blk){
    const h=G.h,spread=n=>n===1?[h/2]:Array.from({length:n},(_,k)=>10+k*(h-20)/(n-1));
    return {i:spread(G.ins),o:spread(G.outs)};
  }
  return {i:GATES[type].ins===1?[20]:[10,30],o:[20]};
}""", 1)

# ---------- 3. chip rendering in gateSVG ----------
old = """  const inv=['NOT','NAND','NOR','XNOR'].includes(type);
  if(type==='DFF'){"""
assert s.count(old) == 1
s = s.replace(old, """  if(GATES[type].blk){
    s+=`<rect class="gb" x="12" y="0" width="36" height="${h}" rx="7"/>`;
    const nm=tx(GATES[type].n),abbr=nm.split(/\\s+/).map(w=>w[0]).join('').slice(0,3).toUpperCase();
    s+=`<text class="gl" x="30" y="${h/2+4}" text-anchor="middle" style="font-size:11px">${esc(abbr)}</text>`;
    return s;
  }
  const inv=['NOT','NAND','NOR','XNOR'].includes(type);
  if(type==='DFF'){""", 1)

# ---------- 4. loadLevel: append available blocks to the palette ----------
old = """function loadLevel(l){
  if(l.sandbox)l.gates=sandboxGates();"""
assert s.count(old) == 1
s = s.replace(old, """function loadLevel(l){
  if(l.sandbox)l.gates=sandboxGates();
  blkRegisterAll();
  if(!l.gates0)l.gates0=(l.gates||[]).slice();
  l.gates=l.gates0.concat(blkTypesFor(l));""", 1)

# ---------- 5. palette row height for tall chips ----------
old = 'style="height:${t===\'DFF\'?44:32}px"'
assert s.count(old) == 1
s = s.replace(old, 'style="height:${t===\'DFF\'?44:GATES[t].blk?Math.min(64,GATES[t].h*.8):32}px"', 1)

open('/mnt/d/DITK/buildlogiccomputer/src/editor.js', 'w', encoding='utf-8').write(s)
print('editor ok')

# ---------- 6. meta.js: register + Bit phrase on solve ----------
m = open('/mnt/d/DITK/buildlogiccomputer/src/meta.js', encoding='utf-8').read()
i = m.index('function onSolved')
print(m[i:i+900])
