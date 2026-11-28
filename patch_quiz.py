s = open('/mnt/d/DITK/buildlogiccomputer/src/meta.js', encoding='utf-8').read()

# ---------- 1. generated practical tasks + timer, replacing the static-only quiz ----------
old = """/* ========== checkpoint tests ========== */
let QZ=null;
function openQuiz(ch){
  if(!chapterDone(ch)){toast(ui('qLocked'));return}
  const qs=QUIZ[ch].slice().sort(()=>Math.random()-.5).slice(0,5).map(q=>({q,order:q.a.map((_,i)=>i).sort(()=>Math.random()-.5)}));
  QZ={ch,qs,i:0,score:0,answered:false};
  openMenu('quiz');drawQuiz();
  say([{t:STORY.quizIntro,m:'smug'}],{u:1});
}"""
assert s.count(old) == 1
s = s.replace(old, """/* ========== checkpoint tests ==========
   A test is five timed tasks: three generated practical problems in the spirit of the
   chapter's levels (fresh each attempt, so retakes are not memorisation) plus two from
   the chapter pool. 25 seconds per task; running out of time counts as a wrong answer. */
let QZ=null;
const QTIME=25;
const rbQ=()=>Math.random()<.5?0:1,riQ=n=>Math.floor(Math.random()*n);
function qOpts(right,pool){const o=new Set([right]);let g=0;while(o.size<4&&g++<80)o.add(pool());return[...o].sort(()=>Math.random()-.5)}
/* truth table with one hidden cell */
function qTable(){
  const F=[[('A ∧ B'),(a,b)=>a&b,'AND'],[('A ∨ B'),(a,b)=>a|b,'OR'],[('A ⊕ B'),(a,b)=>a^b,'XOR'],
    [ov('A ∧ B'),(a,b)=>1-(a&b),'NAND'],[ov('A ∨ B'),(a,b)=>1-(a|b),'NOR'],[ov('A')+' ∨ B',(a,b)=>(1-a)|b,null],[('A ∧ ')+ov('B'),(a,b)=>a&(1-b),null]];
  const [nm,f]=pick(F),rows=[[0,0],[0,1],[1,0],[1,1]],hide=riQ(4);
  const res=rows.map(([a,b])=>f(a,b));
  const tbl=[['A','B','Y'],...rows.map(([a,b],i)=>[a,b,i===hide?'?':res[i]])];
  return{q:[`В таблице истинности функции Y = ${nm} одна клетка стёрта. Что там?`,`One cell is erased in the truth table of Y = ${nm}. What is it?`],tbl,a:[0,1],c:res[hide]};
}
/* identify the formula from its table */
function qFormula(){
  const F=[[('A ∧ B'),(a,b)=>a&b],[('A ∨ B'),(a,b)=>a|b],[('A ⊕ B'),(a,b)=>a^b],[ov('A ∧ B'),(a,b)=>1-(a&b)],[ov('A ∨ B'),(a,b)=>1-(a|b)],[('A ⊙ B'),(a,b)=>1-(a^b)],[ov('A')+' ∨ B',(a,b)=>(1-a)|b],['A ∧ '+ov('B'),(a,b)=>a&(1-b)]];
  const i=riQ(F.length),rows=[[0,0],[0,1],[1,0],[1,1]];
  const tbl=[['A','B','Y'],...rows.map(([a,b])=>[a,b,F[i][1](a,b)])];
  const pool=qOpts(F[i][0],()=>F[riQ(F.length)][0]);
  return{q:['Перед вами таблица истинности. Какая это функция?','Here is a truth table. Which function is it?'],tbl,a:pool.map(x=>[x,x]),c:pool.indexOf(F[i][0]),cTxt:1};
}
/* chain evaluation with gates of the chapter */
function qChain(ch){
  const two=ch>=2?['NAND','AND','OR','XOR']:['AND','OR','XOR'];
  const g1=pick(two),g2=pick(two),a=rbQ(),b=rbQ(),c=rbQ();
  const F={AND:[(x,y)=>x&y,'∧'],OR:[(x,y)=>x|y,'∨'],XOR:[(x,y)=>x^y,'⊕'],NAND:[(x,y)=>1-(x&y),ov('∧')]};
  const useN1=Math.random()<.5,useN2=Math.random()<.5;
  const e1=(useN1?ov('A'):'A')+' '+F[g1][1]+' '+(useN2?ov('B'):'B');
  const v1=F[g1][0](useN1?1-a:a,useN2?1-b:b);
  const e2='('+e1+') '+F[g2][1]+' C';
  const v=F[g2][0](v1,c);
  return{q:[`A = ${a}, B = ${b}, C = ${c}. Чему равно Y = ${e2}?`,`A = ${a}, B = ${b}, C = ${c}. What is Y = ${e2}?`],a:[0,1],c:v};
}
/* binary arithmetic */
function qBin(sub){
  const n=2+riQ(2),x=riQ(1<<n),y=riQ(1<<n);
  const pad=v=>v.toString(2).padStart(n,'0');
  if(sub&&y>x)return qBin(sub);
  const r=sub?x-y:x+y,correct=(sub?r:r).toString(2);
  const pool=qOpts(correct,()=>(r+[-2,-1,1,2][riQ(4)]+(r===0?2:0)).toString(2).replace('-',''));
  return{q:[`${pad(x)}₂ ${sub?'−':'+'} ${pad(y)}₂ = ?`,`${pad(x)}₂ ${sub?'−':'+'} ${pad(y)}₂ = ?`],a:pool.map(v=>[v+'₂',v+'₂']),c:pool.indexOf(correct),cTxt:1};
}
/* mux / decoder behaviour with random inputs */
function qMux(){
  const four=Math.random()<.5;
  if(four){
    const d=[rbQ(),rbQ(),rbQ(),rbQ()],s=riQ(4);
    return{q:[`Мультиплексор 4:1. D₀ = ${d[0]}, D₁ = ${d[1]}, D₂ = ${d[2]}, D₃ = ${d[3]}, адрес S = ${s.toString(2).padStart(2,'0')}₂. Y = ?`,`4:1 multiplexer. D₀ = ${d[0]}, D₁ = ${d[1]}, D₂ = ${d[2]}, D₃ = ${d[3]}, address S = ${s.toString(2).padStart(2,'0')}₂. Y = ?`],a:[0,1],c:d[s]};
  }
  const a=rbQ(),b=rbQ(),sv=rbQ();
  return{q:[`Мультиплексор 2:1. A = ${a}, B = ${b}, S = ${sv}. Y = ?`,`2:1 multiplexer. A = ${a}, B = ${b}, S = ${sv}. Y = ?`],a:[0,1],c:sv?b:a};
}
/* adder outputs for random inputs */
function qAdder(){
  const a=rbQ(),b=rbQ(),c=rbQ();
  const s=a^b^c,p=(a&b)|(c&(a^b));
  const opts=qOpts(`S = ${s}, P = ${p}`,()=>`S = ${rbQ()}, P = ${rbQ()}`);
  return{q:[`Полный сумматор: A = ${a}, B = ${b}, перенос C = ${c}. Что на выходах?`,`Full adder: A = ${a}, B = ${b}, carry C = ${c}. What are the outputs?`],a:opts.map(v=>[v,v]),c:opts.indexOf(`S = ${s}, P = ${p}`),cTxt:1};
}
/* sequential behaviour over several ticks */
function qSeq(){
  const kind=riQ(3);
  if(kind===0){
    let q=rbQ();const ts=[rbQ(),rbQ(),rbQ()],q0=q;
    ts.forEach(t=>{if(t)q=1-q});
    return{q:[`T-триггер, начало Q = ${q0}. Три такта, T = ${ts.join(', ')}. Финальное Q?`,`A T flip-flop starts at Q = ${q0}. Three ticks, T = ${ts.join(', ')}. Final Q?`],a:[0,1],c:q};
  }
  if(kind===1){
    const st=riQ(4),n=1+riQ(3),fin=(st+n)%4;
    const pool=qOpts(fin.toString(2).padStart(2,'0'),()=>riQ(4).toString(2).padStart(2,'0'));
    return{q:[`Двухбитный счётчик в состоянии ${st.toString(2).padStart(2,'0')}. Проходит ${n} такт${n>1?'а':''}. Состояние?`,`A 2-bit counter is in state ${st.toString(2).padStart(2,'0')}. ${n} tick(s) pass. State?`],a:pool.map(v=>[v,v]),c:pool.indexOf(fin.toString(2).padStart(2,'0')),cTxt:1};
  }
  let q=rbQ();const ds=[rbQ(),rbQ()];const q0=q;
  q=ds[1];
  return{q:[`D-триггер, начало Q = ${q0}. На двух тактах подряд D = ${ds[0]}, затем D = ${ds[1]}. Финальное Q?`,`A D flip-flop starts at Q = ${q0}. Two ticks in a row: D = ${ds[0]}, then D = ${ds[1]}. Final Q?`],a:[0,1],c:q};
}
/* comparator with random numbers */
function qCmp(){
  const a=riQ(4),b=riQ(4);
  const r=a>b?['больше','greater']:a<b?['меньше','less']:['равно','equal'];
  const all=[['больше','greater'],['меньше','less'],['равно','equal']];
  return{q:[`A = ${a.toString(2).padStart(2,'0')}₂, B = ${b.toString(2).padStart(2,'0')}₂. Компаратор покажет: A … B`,`A = ${a.toString(2).padStart(2,'0')}₂, B = ${b.toString(2).padStart(2,'0')}₂. The comparator shows: A … B`],a:all,c:all.indexOf(r),cTxt:1};
}
function genPractical(ch){
  const bag=[qTable,qFormula,()=>qChain(ch)];
  if(ch>=3)bag.push(qMux,qAdder,()=>qBin(false));
  if(ch===5)bag.push(()=>qBin(true),qCmp);
  if(ch===8)bag.push(()=>qBin(Math.random()<.5),qCmp);
  if(ch>=4&&ch!==5)bag.push(qSeq);
  if(ch>=9)bag.push(qTable,qFormula);
  return pick(bag)();
}
function openQuiz(ch){
  if(!chapterDone(ch)){toast(ui('qLocked'));return}
  const gen=[];const seen=new Set();
  while(gen.length<3){const q=genPractical(ch),k=tx(q.q);if(seen.has(k))continue;seen.add(k);gen.push(q)}
  const pool=QUIZ[ch].slice().sort(()=>Math.random()-.5).slice(0,2);
  const qs=gen.concat(pool).sort(()=>Math.random()-.5).map(q=>({q,order:q.a.map((_,i)=>i).sort(()=>Math.random()-.5)}));
  QZ={ch,qs,i:0,score:0,answered:false,t0:Date.now()};
  openMenu('quiz');drawQuiz();
  say([{t:STORY.quizIntro,m:'smug'}],{u:1});
}
function qTimerStop(){if(QZ&&QZ.tm){clearInterval(QZ.tm);QZ.tm=null}}
function qTimerStart(){
  qTimerStop();if(!QZ)return;
  QZ.tl=QTIME;
  QZ.tm=setInterval(()=>{
    if(!QZ){qTimerStop();return}
    QZ.tl-=0.1;
    const bar=$('#qtim');if(bar)bar.style.width=Math.max(0,QZ.tl/QTIME*100)+'%';
    if(QZ.tl<=0){qTimerStop();qTimeout()}
  },100);
}
function qTimeout(){
  if(!QZ||QZ.answered)return;
  QZ.answered=true;QZ.timeouts=(QZ.timeouts||0)+1;
  const {q}=QZ.qs[QZ.i];
  $$('.qb').forEach(x=>{if(+x.dataset.k===q.c)x.classList.add('ok');x.disabled=true});
  sfx('qbad');
  say([{t:pick(STORY.quizWrong),m:'sad'}],{u:1});
  const nx=$('.qnext');if(nx)nx.innerHTML=`<button class="tbtn primary" id="qNext">${QZ.i+1<QZ.qs.length?ui('qNext'):ui('qDone')}</button>`;
  const b=$('#qNext');if(b)b.onclick=()=>{QZ.i++;drawQuiz()};
}""", 1)

# ---------- 2. drawQuiz: timer bar + truth-table rendering + start timer ----------
old = """  const {q,order}=z.qs[z.i];z.answered=false;
  el.innerHTML=`<div class="qh">${ui('quizTitle',{n:z.ch})}. ${tx(CHAPTERS[z.ch-1])}</div><div class="qp">${ui('qOf',{i:z.i+1,n:z.qs.length})}</div>
    <div class="qq">${mathHTML(tx(q.q))}</div>${q.fig?figSVG(q.fig):''}
    <div class="qa">${order.map(k=>`<button class="qb" data-k="${k}">${mathHTML(tx(q.a[k]))}</button>`).join('')}</div><div class="qnext"></div>`;
}"""
assert s.count(old) == 1
s = s.replace(old, """  const {q,order}=z.qs[z.i];z.answered=false;
  const tbl=q.tbl?`<table class="qt">${q.tbl.map((r,ri)=>`<tr>${r.map(c=>`<t${ri?'d':'h'}>${c}</t${ri?'d':'h'}>`).join('')}</tr>`).join('')}</table>`:'';
  el.innerHTML=`<div class="qh">${ui('quizTitle',{n:z.ch})}. ${tx(CHAPTERS[z.ch-1])}</div><div class="qp">${ui('qOf',{i:z.i+1,n:z.qs.length})}</div>
    <div class="qtwrap"><div id="qtim"></div></div>
    <div class="qq">${mathHTML(tx(q.q))}</div>${q.fig?figSVG(q.fig):''}${tbl}
    <div class="qa">${order.map(k=>`<button class="qb" data-k="${k}">${mathHTML(tx(q.a[k]))}</button>`).join('')}</div><div class="qnext"></div>`;
  qTimerStart();
}"""
, 1)

# ---------- 3. answer click: stop the timer ----------
old = """  const {q}=QZ.qs[QZ.i],k=+b.dataset.k,ok=k===q.c;QZ.answered=true;"""
assert s.count(old) == 1
s = s.replace(old, """  const {q}=QZ.qs[QZ.i],k=+b.dataset.k,ok=k===q.c;QZ.answered=true;qTimerStop();""", 1)

open('/mnt/d/DITK/buildlogiccomputer/src/meta.js', 'w', encoding='utf-8').write(s)
print('meta ok')

c = open('/mnt/d/DITK/buildlogiccomputer/src/style.css', encoding='utf-8').read()
c += '''
/* quiz: timer and generated tables */
.qtwrap{height:5px;background:var(--line);border-radius:3px;margin:4px 0 12px;overflow:hidden}
#qtim{height:100%;width:100%;background:var(--acc);border-radius:3px;transition:width .1s linear}
table.qt{border-collapse:collapse;margin:8px 0 12px}
table.qt th,table.qt td{border:1.5px solid var(--line);padding:5px 14px;text-align:center;font-size:14px}
table.qt th{background:var(--card2);font-weight:600}
'''
open('/mnt/d/DITK/buildlogiccomputer/src/style.css', 'w', encoding='utf-8').write(c)
print('css ok')
