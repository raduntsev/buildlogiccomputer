/* ========== progress: stars, points, clearance ========== */
// Stars per level (bit mask): 1 solved, 2 solved without a hint, 4 solved with ≤ par gates.
function starsHTML(s){if(!s)return '';return [1,2,4].map(b=>`<span class="st${s&b?' on':''}">${s&b?'★':'☆'}</span>`).join('')}
const lvPts=s=>s?100+(s&2?50:0)+(s&4?50:0):0;
const quizPts=q=>q&&q.pass?q.best*20+(q.best===5?50:0):0;
function points(){let p=0;for(const id in prog.lv)p+=lvPts(prog.lv[id].s);for(const c in prog.quiz)p+=quizPts(prog.quiz[c]);return p}
function rankIdx(p=earned()){let r=0;RANKS.forEach((x,i)=>{if(p>=x[0])r=i});return r}
const quizPassed=ch=>!!(prog.quiz[ch]&&prog.quiz[ch].pass);
const available=l=>l.req.every(r=>typeof r==='string'?quizPassed(+r.slice(1)):done.has(r));
const chapterDone=ch=>LV.filter(l=>l.ch===ch).every(l=>done.has(l.id));
function updHud(){const p=earned(),b=balance();$('#hud').innerHTML=`<span class="hr">${tx(RANKS[rankIdx(p)][1])}</span><span class="hp">${num(b)}</span>`;$('#hud').title=ui('balanceH')+': '+ptsN(b);hintBtnDraw()}
function savedPing(){const el=$('#saved');if(!el)return;el.classList.add('on');clearTimeout(savedPing.t);savedPing.t=setTimeout(()=>el.classList.remove('on'),1400)}

function onSolved(){
  const id=level.id,first=!done.has(id),prevRank=rankIdx(),old=prog.lv[id]||{s:0,g:999};
  const bits=1|(hintUsed?0:2)|(C.gates.length<=level.par?4:0);
  const ns=old.s|bits,gain=lvPts(ns)-lvPts(old.s);
  prog.lv[id]={s:ns,g:Math.min(old.g,C.gates.length)};
  done.add(id);save();updHud();$('#lvStars').innerHTML=starsHTML(ns);
  const chDone=first&&chapterDone(level.ch);
  const nx=nextLevel();
  const btns=[{t:ui('stay')},{t:ui('levels'),f:()=>openMenu('levels')}];
  if(chapterDone(level.ch)&&!quizPassed(level.ch))btns.push({t:ui('toQuiz'),p:1,f:()=>openQuiz(level.ch)});
  else if(nx)btns.push({t:ui('next'),p:1,f:()=>loadLevel(nx)});
  const crit=[[ui('cSolved'),''],[ui('cNoHint'),ui('whyHint')],[ui('cPar',{p:level.par}),ui('whyPar',{n:C.gates.length})]];
  showCard(true,ui('correct'),
    `<div class="rcrit">${[1,2,4].map((b,i)=>`<div class="rc${bits&b?' on':''}"><i>${bits&b?'✓':''}</i><span>${crit[i][0]}</span><em>${bits&b?'':crit[i][1]}</em></div>`).join('')}</div>
     <div class="rmet"><div><b class="${C.gates.length<=level.par?'hl':''}">${C.gates.length}</b><span>${ui('mGates')}</span></div><div><b>${level.par}</b><span>${ui('mPar')}</span></div><div><b class="hl">+${gain}</b><span>${ui('points').toLowerCase()}</span></div></div>`,btns);
  musicMood('bright',30000);
  const lines=[{t:pick(bits===7?STORY.win3:STORY.win),m:bits===7?'smug':'happy'}];
  if(chDone){if(level.ch===10)lines.push(...STORY.final);else lines.push({t:STORY.chDone[level.ch],m:'happy'})}
  say(lines);
  badge('FIRST_LEVEL');
  if(chDone)badge('CH_'+level.ch);
  if(chapterDone(level.ch)&&LV.filter(l=>l.ch===level.ch).every(l=>(prog.lv[l.id]||{}).s&2))badge('NO_HINTS');
  const three=Object.values(prog.lv).filter(x=>x.s===7).length;
  if(three>=10)badge('OPTIMAL_10');if(three>=LV.length)badge('STARS_ALL');
  if(new Date().getHours()<5)badge('NIGHT');
  if(C.gates.length>=3&&Date.now()-levelStart<60000)badge('FAST');
  checkRank(prevRank);
}
function onFailed(f,n){
  failCount++;musicMood('low',26000);
  showCard(false,ui('mismatch'),`<div class="rmet"><div><b class="hl" style="color:var(--coral)">${f}</b><span>${ui('mRowsBad')}</span></div><div><b>${n-f}</b><span>${ui('mRowsOk')}</span></div><div><b>${n}</b><span>${ui('mRows')}</span></div></div>`,[{t:ui('fix'),p:1}]);
  const extra=hintUsed||hintBought()?null:failCount===3?STORY.discount:failCount===6?STORY.freeHint:null;
  updHud();
  say([{t:extra||pick(STORY.fail),m:'sad',ch:[{t:hintLabel(),f:giveHint},{t:UIS.cSelf,r:{t:UIS.selfR,m:'smug'}}]}]);
}
function nextLevel(){return LV.find(l=>l.id>level.id&&available(l)&&!done.has(l.id))||LV.find(l=>available(l)&&!done.has(l.id))}
function showCard(ok,title,html,btns){
  const st=$('#resTitle');st.className=ok?'':'bad';st.style.animation='none';void st.offsetWidth;st.style.animation='';
  st.innerHTML=`<span>${title}<small>${tx(level.t)}${level.sandbox?'':', '+(LANG==='en'?'level ':'уровень ')+level.id}</small></span>`;$('#resSub').innerHTML=html;
  $('#resBtns').innerHTML=btns.map((b,i)=>`<button class="tbtn${b.p?' primary':''}" data-i="${i}">${b.t}</button>`).join('');
  $('#result').classList.add('on');
  $('#resBtns').onclick=e=>{const b=e.target.closest('[data-i]');if(!b)return;$('#result').classList.remove('on');const f=btns[+b.dataset.i].f;if(f)f()};
}
function checkRank(prev){const r=rankIdx();if(r>prev){toast(ui('rankToast',{r:tx(RANKS[r][1])}));setTimeout(()=>sfx('rank'),900);sayMore([{t:fmt(tx(STORY.rankUp),{r:tx(RANKS[r][1])}),m:'happy',wave:1}]);if(r===RANKS.length-1)badge('RANK_MAX')}}

/* ========== badges (mirrored to Steam achievements) ========== */
function steamAch(id){try{if(window.desktop&&window.desktop.achievement)window.desktop.achievement(id)}catch(e){}}
function badge(id){
  if(prog.badges.includes(id))return;
  const b=BADGES.find(x=>x.id===id);if(!b)return;
  prog.badges.push(id);save();steamAch(id);
  setTimeout(()=>{toast(ui('badgeToast',{b:tx(b.n)}));sfx('badge')},600);
  sayMore([{t:fmt(tx(STORY.badge),{b:tx(b.n)}),m:'smug'}]);
}
function gatePlaced(){if(level.sandbox&&C.gates.length>=10)badge('SANDBOX')}

/* ========== checkpoint tests ========== */
let QZ=null;
function openQuiz(ch){
  if(!chapterDone(ch)){toast(ui('qLocked'));return}
  const qs=QUIZ[ch].slice().sort(()=>Math.random()-.5).slice(0,5).map(q=>({q,order:q.a.map((_,i)=>i).sort(()=>Math.random()-.5)}));
  QZ={ch,qs,i:0,score:0,answered:false};
  openMenu('quiz');drawQuiz();
  say([{t:STORY.quizIntro,m:'smug'}],{u:1});
}
function figSVG(f){
  const P=gPins(f.g);
  let s=`<svg class="qfig" viewBox="-74 -8 196 56">`;
  P.i.forEach((y,i)=>{s+=`<text x="-14" y="${y+5}" text-anchor="end" class="qv">${'AB'[i]} = ${f.v[i]}</text><path d="M-10,${y}H0" class="gst"/>`});
  s+=gateSVG(f.g,settings.gost)+`<path d="M60,20H72" class="gst"/><text x="78" y="26" class="qv">Y = ?</text></svg>`;
  return s;
}
function drawQuiz(){
  const z=QZ,el=$('#quizBox');
  if(z.i>=z.qs.length){
    const old=prog.quiz[z.ch]||{best:0,pass:false},prevRank=rankIdx(),pass=z.score>=4;
    const before=quizPts(old);prog.quiz[z.ch]={best:Math.max(old.best,z.score),pass:old.pass||pass};
    const gain=quizPts(prog.quiz[z.ch])-before;save();updHud();
    el.innerHTML=`<div class="qh">${ui('quizTitle',{n:z.ch})}</div><div class="qres ${pass?'ok':'bad'}">${pass?ui('qPass'):ui('qFail')}</div>
      <div class="qscore">${ui('qScore',{s:z.score,n:z.qs.length})}</div><div class="rpts">${gain?ui('pts',{p:gain}):''}</div>
      <div class="qact"><button class="mi" id="qRetry">${ui('qRetry')}</button><button class="mi" id="qBack">${ui('levels')}</button></div>`;
    $('#qRetry').onclick=()=>openQuiz(z.ch);$('#qBack').onclick=()=>openMenu('levels');
    if(pass){badge('QUIZ_FIRST');if(z.score===5)badge('QUIZ_PERFECT');if(CHAPTERS.every((_,i)=>quizPassed(i+1)))badge('QUIZ_ALL')}
    say([{t:pass?(z.score===5?STORY.quizPerfect:STORY.quizPass):STORY.quizFail,m:pass?'happy':'sad'}],{u:1});
    checkRank(prevRank);
    return;
  }
  const {q,order}=z.qs[z.i];z.answered=false;
  el.innerHTML=`<div class="qh">${ui('quizTitle',{n:z.ch})}. ${tx(CHAPTERS[z.ch-1])}</div><div class="qp">${ui('qOf',{i:z.i+1,n:z.qs.length})}</div>
    <div class="qq">${mathHTML(tx(q.q))}</div>${q.fig?figSVG(q.fig):''}
    <div class="qa">${order.map(k=>`<button class="qb" data-k="${k}">${mathHTML(tx(q.a[k]))}</button>`).join('')}</div><div class="qnext"></div>`;
}
$('#quizBox').addEventListener('click',e=>{
  const b=e.target.closest('.qb');if(!b||!QZ||QZ.answered)return;
  const {q}=QZ.qs[QZ.i],k=+b.dataset.k,ok=k===q.c;QZ.answered=true;
  $$('.qb').forEach(x=>{if(+x.dataset.k===q.c)x.classList.add('ok');else if(x===b)x.classList.add('bad');x.disabled=true});
  if(ok)QZ.score++;
  sfx(ok?'qok':'qbad');
  say([{t:pick(ok?STORY.quizRight:STORY.quizWrong),m:ok?'smug':'sad'}],{u:1});
  $('.qnext').innerHTML=`<button class="tbtn primary" id="qNext">${QZ.i+1<QZ.qs.length?ui('qNext'):ui('qDone')}</button>`;
  $('#qNext').onclick=()=>{QZ.i++;drawQuiz()};
});

/* ========== personnel file ========== */
function drawProfile(){
  const p=earned(),r=rankIdx(p),nx=RANKS[r+1],lo=RANKS[r][0];
  const solved=LV.filter(l=>done.has(l.id)).length;
  let stars=0;for(const id in prog.lv){const s=prog.lv[id].s;stars+=(s&1?1:0)+(s&2?1:0)+(s&4?1:0)}
  const tests=CHAPTERS.filter((_,i)=>quizPassed(i+1)).length;
  const cell=(k,v,n)=>`<div class="pfc"><b>${v}<small> / ${n}</small></b><span>${ui(k)}</span></div>`;
  $('#profBox').innerHTML=`<div class="pf-k">${ui('rank')} ${r} / ${RANKS.length-1}</div><div class="pf-rank">${tx(RANKS[r][1])}</div>
    <div class="pf-bar"><i style="width:${nx?Math.round((p-lo)/(nx[0]-lo)*100):100}%"></i></div>
    <div class="pf-next">${ui('earnedT',{e:num(p),s:num(prog.st.spent||0)})}. ${ui('balanceH')}: ${ptsN(balance())}<br>${nx?ui('toNext',{r:tx(nx[1]),p:num(nx[0]-p)}):ui('maxRank')}</div>
    <div class="pf-grid">${cell('stLevels',solved,LV.length)}${cell('stStars',stars,LV.length*3)}${cell('stTests',tests,CHAPTERS.length)}${cell('stBadges',prog.badges.length,BADGES.length)}</div>
    <h3>${ui('badgesH')}</h3>
    <div class="bd-grid">${BADGES.map(b=>{const on=prog.badges.includes(b.id);return`<div class="bd${on?' on':''}"><i>${on?b.g:'?'}</i><b>${tx(b.n)}</b><span>${tx(b.d)}</span></div>`}).join('')}</div>`;
}

/* ========== level tree ========== */
/* phones: chapters as an accordion, levels as big cards */
let treeOpen=null;
function drawTreeList(){
  const cur=CHAPTERS.findIndex((_,i)=>!chapterDone(i+1)||!quizPassed(i+1))+1||CHAPTERS.length;
  if(treeOpen==null)treeOpen=cur;
  $('#treeList').innerHTML=CHAPTERS.map((c,i)=>{
    const ch=i+1,ls=LV.filter(l=>l.ch===ch),dn=ls.filter(l=>done.has(l.id)).length,open=treeOpen===ch,anyAv=ls.some(available);
    const qa=chapterDone(ch),qp=quizPassed(ch);
    return `<section class="tl-ch${open?' open':''}${anyAv?'':' lock'}">
      <button class="tl-h" data-ch="${ch}"><b>${ch}</b><span><em>${tx(c)}</em><small>${ui('mmDone',{n:dn,N:ls.length})}${qp?' · '+ui('qPass').toLowerCase():''}</small></span>
        <i class="tl-bar"><i style="width:${Math.round(dn/ls.length*100)}%"></i></i><svg viewBox="0 0 12 12"><path d="M2.5 4.5L6 8L9.5 4.5"/></svg></button>
      <div class="tl-body">${ls.map(l=>{const d=done.has(l.id),av=available(l),st=(prog.lv[l.id]||{}).s||0;
        return `<button class="tl-l${d?' done':av?' av':' lock'}" data-l="${l.id}" ${av?'':'disabled'}><b>${l.id}</b><span>${tx(l.t)}</span>
          <i class="tl-st">${d?[1,2,4].map(b=>`<u class="${st&b?'on':''}"></u>`).join(''):av?ui('tlNew'):ui('tlLock')}</i></button>`}).join('')}
        <button class="tl-q${qp?' pass':qa?' av':' lock'}" data-q="${ch}" ${qa?'':'disabled'}><span>${ui('quizNode')}</span><b>${qp?prog.quiz[ch].best+' / 5':qa?ui('qReady'):ui('tlLock')}</b></button>
      </div></section>`}).join('');
}
$('#treeList').addEventListener('click',e=>{
  const h=e.target.closest('[data-ch]');if(h){const ch=+h.dataset.ch;treeOpen=treeOpen===ch?0:ch;sfx('ui');drawTreeList();
    const sec=$$('#treeList .tl-ch')[ch-1];if(treeOpen&&sec)sec.scrollIntoView({block:'nearest',behavior:'smooth'});return}
  const l=e.target.closest('[data-l]');if(l){const lv=LV[l.dataset.l-1];if(!available(lv))return;sfx('ui');loadLevel(lv);closeMenu();return}
  const q=e.target.closest('[data-q]');if(q&&chapterDone(+q.dataset.q))openQuiz(+q.dataset.q);
});
function drawTree(){
  const mob=innerWidth<=760;document.body.classList.toggle('treeMob',mob);
  if(mob){drawTreeList();return}
  const sv=$('#tree'),CW=138,RH=78,PX=6,PY=62,CHG=64,LX=380;
  const yOf=l=>PY+l.pos[1]*RH+(l.ch-1)*CHG, xOf=l=>PX+LX+l.pos[0]*CW;
  const qPos=ch=>{const ls=LV.filter(l=>l.ch===ch),c=Math.max(...ls.map(l=>l.pos[0]))+1,f=ls[0];return{x:PX+LX+c*CW,y:yOf(f)}};
  const W=PX+LX+7*CW+40,H=yOf(LV[LV.length-1])+60;
  sv.setAttribute('viewBox',`0 0 ${W} ${H}`);sv.setAttribute('width',W);sv.style.width='min(100%,'+W+'px)';
  let s='';
  const elbow=(x1,y1,x2,y2,col)=>{if(y1===y2){s+=`<path d="M${x1},${y1}H${x2}" stroke="${col}" stroke-width="2" fill="none"/>`;return}
    const mx=x2-26,dy=y2>y1?12:-12;s+=`<path d="M${x1},${y1}H${mx-12}Q${mx},${y1} ${mx},${y1+dy}V${y2-dy}Q${mx},${y2} ${mx+12},${y2}H${x2}" stroke="${col}" stroke-width="2" fill="none"/>`};
  CHAPTERS.forEach((c,i)=>{const l=LV.find(x=>x.ch===i+1),y=yOf(l),ls=LV.filter(x=>x.ch===i+1),dn=ls.filter(x=>done.has(x.id)).length;
    const yb=y-46,hb=(Math.max(...ls.map(x=>x.pos[1]))-l.pos[1])*RH+100;
    s+=`<rect x="${PX}" y="${yb}" width="${W-PX-10}" height="${hb}" rx="24" fill="rgba(250,250,247,.55)"/>`;
    s+=`<text x="${PX+30}" y="${y+14}" font-size="44" font-weight="600" letter-spacing="-1.5" fill="${dn?'var(--ink)':'var(--grid2)'}" font-family="var(--font)">${i+1}</text>`;
    s+=`<text x="${PX+(i+1>9?96:84)}" y="${y-2}" font-size="16" font-weight="600" fill="var(--ink)" font-family="var(--font)">${tx(c)}</text>`;
    s+=`<text x="${PX+(i+1>9?96:84)}" y="${y+16}" font-size="12.5" font-weight="500" fill="var(--mute)" font-family="var(--font)">${ui('mmDone',{n:dn,N:ls.length})}</text>`;});
  LV.forEach(l=>l.req.forEach(r=>{
    const x2=xOf(l)-17,y2=yOf(l);
    if(typeof r==='string'){const on=quizPassed(+r.slice(1));
      s+=`<path d="M${x2-34},${y2}H${x2}" stroke="${on?'var(--ink)':'var(--grid2)'}" stroke-width="2"/><circle cx="${x2-38}" cy="${y2}" r="4" fill="${on?'var(--acc)':'var(--grid2)'}" stroke="var(--ink)" stroke-width="${on?1.2:0}"/>`;return}
    const a=LV[r-1];elbow(xOf(a)+17,yOf(a),x2,y2,done.has(r)?'var(--ink)':'var(--grid2)');
  }));
  CHAPTERS.forEach((_,i)=>{const ch=i+1,q=qPos(ch),row0=LV.find(x=>x.ch===ch).pos[1],last=LV.filter(l=>l.ch===ch&&l.pos[1]===row0).pop();
    const av=chapterDone(ch),ps=quizPassed(ch);
    s+=`<path d="M${xOf(last)+17},${q.y}H${q.x-30}" stroke="${av?'var(--ink)':'var(--grid2)'}" stroke-width="2"/>`;
    s+=`<g class="node${av?'':' lock'}" data-q="${ch}"><rect x="${q.x-30}" y="${q.y-17}" width="60" height="34" rx="17" fill="${ps?'var(--acc)':av?'var(--ink)':'var(--paper)'}" stroke="${av||ps?'none':'var(--grid2)'}"/>
      <text x="${q.x}" y="${q.y+1}" text-anchor="middle" dominant-baseline="central" font-size="13" font-weight="600" font-family="var(--font)" fill="${ps?'var(--ink)':av?'#fff':'var(--mute)'}">${ps?prog.quiz[ch].best+'/5':(LANG==='en'?'test':'тест')}</text>
      <rect x="${q.x-46}" y="${q.y-24}" width="92" height="62" fill="transparent"/></g>`;});
  LV.forEach(l=>{
    const x=xOf(l),y=yOf(l),dn=done.has(l.id),av=available(l),st=(prog.lv[l.id]||{}).s||0,nm=tx(l.t);
    s+=`<g class="node${av?'':' lock'}" data-l="${l.id}">`;
    s+=`<circle cx="${x}" cy="${y}" r="17" fill="${dn?'var(--ink)':av?'var(--acc)':'var(--paper)'}" stroke="${dn||av?'none':'var(--grid2)'}" stroke-width="1.5"/>`;
    s+=`<text x="${x}" y="${y+1}" text-anchor="middle" dominant-baseline="central" font-size="13" font-weight="600" font-family="var(--font)" fill="${dn?'#fff':av?'var(--ink)':'var(--mute)'}">${l.id}</text>`;
    if(dn)[1,2,4].forEach((b,i)=>s+=`<circle cx="${x-9+i*9}" cy="${y+25}" r="3" fill="${st&b?'var(--ink)':'var(--line)'}"/>`);
    s+=`<text x="${x}" y="${y+(dn?42:34)}" text-anchor="middle" font-size="12" font-weight="500" font-family="var(--font)" fill="${av?'var(--ink2)':'var(--mute)'}">${nm.length>15?nm.slice(0,14)+'…':nm}</text>`;
    s+=`<rect x="${x-52}" y="${y-24}" width="104" height="70" fill="transparent"/></g>`;
  });
  sv.innerHTML=s;
  sv.querySelectorAll('[data-l]').forEach(n=>{const l=LV[n.dataset.l-1];
    n.onmouseenter=()=>$('#treeTip').innerHTML=`<b>${l.id}. ${tx(l.t)}</b><span class="tm">&ensp;${available(l)?`<span class="math">${mathHTML(tx(l.f))}</span>`:ui('unlocksAfter',{r:l.req.map(r=>typeof r==='string'?ui('testN',{n:r.slice(1)}):r).join(', ')})}</span>`;
    n.onclick=()=>{if(!available(l))return;sfx('ui');loadLevel(l);closeMenu()}});
  sv.querySelectorAll('[data-q]').forEach(n=>{const ch=+n.dataset.q;
    n.onmouseenter=()=>$('#treeTip').innerHTML=`<b>${ui('quizNode')}. ${tx(CHAPTERS[ch-1])}</b><span class="tm">&ensp;${chapterDone(ch)?(quizPassed(ch)?ui('qScore',{s:prog.quiz[ch].best,n:5}):ui('qReady')):ui('qLocked')}</span>`;
    n.onclick=()=>{if(chapterDone(ch))openQuiz(ch)}});
}

/* ========== the Machine (main menu) ========== */
const MUNITS=[['Логика','Logic'],['И-НЕ','NAND'],['Сумматор','Adder'],['Память','Memory'],['Коды','Codes'],['Автоматы','FSM'],['Регистры','Registers'],['АЛУ','ALU'],['Испытания','Trials'],['Ядро','Core']];
function topChapter(){let c=1;CHAPTERS.forEach((_,i)=>{if(LV.some(l=>l.ch===i+1&&done.has(l.id)))c=i+1});return c}
function drawMachine(){
  const sv=$('#machine');if(!sv)return;
  const on=CHAPTERS.map((_,i)=>chapterDone(i+1)),part=CHAPTERS.map((_,i)=>LV.filter(l=>l.ch===i+1&&done.has(l.id)).length/LV.filter(l=>l.ch===i+1).length);
  const W=168,H=76,X=[20,236,452],Y=[20,138,256];
  const pos=i=>i<9?{x:X[i%3],y:Y[Math.floor(i/3)],w:W}:{x:20,y:374,w:600};
  let s='';
  const link=(x1,y1,x2,y2,lit)=>{const mx=(x1+x2)/2;s+=`<path d="M${x1},${y1}H${mx-12}Q${mx},${y1} ${mx},${y1+(y2>y1?12:y2<y1?-12:0)}V${y2-(y2>y1?12:y2<y1?-12:0)}Q${mx},${y2} ${mx+12},${y2}H${x2}" fill="none" stroke="${lit?'var(--ink)':'var(--grid2)'}" stroke-width="2"/>`;};
  for(let i=0;i<9;i++){const p=pos(i);if(i%3<2)link(p.x+W,p.y+H/2,p.x+216,p.y+H/2,on[i]&&on[i+1]);
    if(i<6){const q=pos(i+3);s+=`<path d="M${p.x+W/2},${p.y+H}V${q.y}" stroke="${on[i]&&on[i+3]?'var(--ink)':'var(--grid2)'}" stroke-width="2"/>`}
    else s+=`<path d="M${p.x+W/2},${p.y+H}V${374}" stroke="${on[i]&&on[9]?'var(--ink)':'var(--grid2)'}" stroke-width="2"/>`}
  for(let i=0;i<10;i++){const p=pos(i),lit=on[i],pr=part[i],dark=lit;
    const fg=dark?'#fff':'var(--ink)',sub=dark?'#A4A6A0':'var(--mute)';
    s+=`<g><rect x="${p.x}" y="${p.y}" width="${p.w}" height="${H}" rx="20" fill="${dark?'var(--ink)':pr?'var(--paper)':'rgba(250,250,247,.5)'}" ${dark||pr?'':'stroke="var(--grid2)" stroke-dasharray="4 5"'}/>`;
    s+=`<text x="${p.x+18}" y="${p.y+32}" font-family="var(--font)" font-size="${i===9?24:19}" font-weight="600" letter-spacing="-.3" fill="${fg}">${tx(MUNITS[i])}</text>`;
    s+=`<text x="${p.x+18}" y="${p.y+56}" font-family="var(--font)" font-size="12.5" font-weight="500" fill="${sub}">${LANG==='en'?'chapter':'глава'} ${i+1}</text>`;
    const bx=p.x+p.w-86,bw=58;
    s+=`<rect x="${bx}" y="${p.y+50}" width="${bw}" height="6" rx="3" fill="${dark?'#3A3C40':'var(--line)'}"/><rect x="${bx}" y="${p.y+50}" width="${Math.max(pr?6:0,bw*pr)}" height="6" rx="3" fill="${dark?'var(--acc)':'var(--ink)'}"/>`;
    s+=`<circle cx="${p.x+p.w-20}" cy="${p.y+22}" r="7" fill="${lit?'var(--acc)':pr?'var(--card2)':'transparent'}" stroke="${lit?'none':'var(--grid2)'}" stroke-width="1.5"/></g>`;}
  sv.innerHTML=s;
  const n=on.filter(Boolean).length;
  $('#machineCap').textContent=ui('machineCap',{n,N:10});
  const lv=LV.some(l=>l.id===store.get('ll_last',1))?store.get('ll_last',1):((LV.find(l=>available(l)&&!done.has(l.id))||LV[0]).id),solved=LV.filter(l=>done.has(l.id)).length;
  if($('#mmCont'))$('#mmCont').textContent=ui('mmLevel',{n:lv});
  if($('#mmLevels'))$('#mmLevels').textContent=ui('mmDone',{n:solved,N:LV.length});
  if($('#mmProfile'))$('#mmProfile').textContent=tx(RANKS[rankIdx()][1]);
  if($('#mmShop'))$('#mmShop').textContent=ptsN(balance());
}

/* ========== menu ========== */
const SCR={shop:'#scrShop',main:'#scrMain',levels:'#scrLevels',settings:'#scrSettings',about:'#scrAbout',profile:'#scrProfile',quiz:'#scrQuiz'};
let curScr='main';
function openMenu(s){
  window.keyCapture=null;
  curScr=s;$('#ov').classList.add('on');$('#result').classList.remove('on');
  $$('.scr').forEach(x=>x.classList.remove('on'));$(SCR[s]).classList.add('on');
  if(s!=='main'&&s!=='quiz')hideBubble();
  document.body.classList.toggle('mainScr',s==='main');
  if(s==='main'){drawMachine();requestAnimationFrame(menuBitStart)}else menuBitStop();if(s==='levels')drawTree();if(s==='settings')drawSettings();if(s==='profile')drawProfile();if(s==='shop')drawShop();
  musicChapter(s==='quiz'&&QZ?QZ.ch:topChapter(),s==='quiz')
  $('#ov').scrollTop=0;
}
function closeMenu(){$('#ov').classList.remove('on');document.body.classList.remove('mainScr');menuBitStop();hideBubble();levelIntro();if(level)musicChapter(level.sandbox?topChapter():level.ch)}
$('#btnMenu').onclick=()=>openMenu('main');
$('#hud').onclick=()=>openMenu('profile');
$$('[data-go]').forEach(b=>b.addEventListener('click',()=>{
  ensureAudio();sfx('ui');
  const g=b.dataset.go;
  if(g==='continue'){if(!level||level.sandbox){const id=store.get('ll_last',1);const l=LV.find(x=>x.id===id);loadLevel(l&&available(l)?l:(nextLevel()||LV[0]))}closeMenu();return}
  if(g==='sandbox'){loadLevel(SANDBOX);closeMenu();return}
  if(g==='quit'){persistNow();store.flush(true);window.desktop&&window.desktop.quit&&window.desktop.quit();return}
  openMenu(g);
}));

/* ========== settings ========== */
const isDesk=!!window.desktop;
const SET=[
  {g:'gGame'},
  {k:'lang',t:'sLang',o:['ru','en'],f:v=>v==='ru'?'Русский':'English'},
  {k:'bit',t:'sBit',o:['all','hints','off'],f:v=>ui({all:'vTalk',hints:'vHints',off:'vHidden'}[v])},
  {k:'txt',t:'sTxt',o:[30,16,0],f:v=>ui({30:'vSlow',16:'vNorm',0:'vInst'}[v])},
  {k:'demo',t:'sDemo',o:[1.7,1,.6],f:v=>ui({1.7:'vSlow',1:'vNorm',.6:'vFast'}[v])},
  {k:'gost',t:'sGost',o:[true,false],f:v=>v?ui('vGost'):ui('vAnsi')},
  {g:'gScreen'},
  {k:'fs',t:'sFs',ty:'tog'},
  {k:'win',t:'sWin',o:['auto','1280x720','1366x768','1600x900','1920x1080','2560x1440'],f:v=>v==='auto'?ui('vAsIs'):v.replace('x',' × '),only:isDesk,ty:'sel'},
  {k:'ui',t:'sUi',o:['auto',.75,.85,1,1.15,1.3,1.5,1.75,2],f:v=>v==='auto'?ui('vAuto')+', '+Math.round(autoUi()*100)+' %':Math.round(v*100)+' %',ty:'sel'},
  {k:'ww',t:'sWw',o:[3,5,7,9],f:v=>ui({3:'vThin',5:'vNormal',7:'vThick',9:'vVThick'}[v]),ty:'sel'},
  {k:'grid',t:'sGrid',o:['lines','dots','none'],f:v=>ui({dots:'vDots',lines:'vLines',none:'vNone'}[v])},
  {k:'hc',t:'sHc2',ty:'tog'},
  {k:'calm',t:'sCalm2',ty:'tog'},
  {g:'gSound'},
  {k:'musicVol',t:'sMusic',ty:'rng'},
  {k:'sfxVol',t:'sSfx',ty:'rng'},
  {k:'voiceVol',t:'sVoice',ty:'rng'},
];
function autoUi(){const m=Math.min(innerWidth,innerHeight*1.7);return m<700?.9:m<1500?1:m<2000?1.15:m<2700?1.35:1.6}
function UI(){return settings.ui==='auto'?autoUi():settings.ui}
const optKey=v=>String(v);
function setCtl(x){
  const v=settings[x.k];
  if(x.ty==='tog')return `<button class="sw${v?' on':''}" role="switch" aria-checked="${!!v}" data-k="${x.k}" data-tog="1"><i></i></button>`;
  if(x.ty==='rng')return `<div class="rng"><input type="range" min="0" max="100" step="5" value="${v}" data-k="${x.k}" style="--v:${v}%"><output>${v?v+' %':ui('vOff')}</output></div>`;
  if(x.ty==='sel')return `<div class="dd"><button class="dd-b" data-k="${x.k}" data-dd="1" aria-haspopup="listbox"><span>${x.f(v)}</span><svg viewBox="0 0 12 12"><path d="M2.5 4.5L6 8L9.5 4.5"/></svg></button>
    <div class="dd-l" role="listbox">${x.o.map(o=>`<button class="dd-o${optKey(o)===optKey(v)?' on':''}" role="option" data-k="${x.k}" data-v="${optKey(o)}">${x.f(o)}</button>`).join('')}</div></div>`;
  return `<div class="seg">${x.o.map(o=>`<button class="${optKey(o)===optKey(v)?'on':''}" data-k="${x.k}" data-v="${optKey(o)}">${x.f(o)}</button>`).join('')}</div>`;
}
function drawSettings(){
  $('#setList').innerHTML=SET.filter(x=>x.only!==false).map(x=>x.g?`<div class="sgrp">${ui(x.g)}</div>`:
    `<div class="srow"><span class="k">${ui(x.t)}</span>${setCtl(x)}</div>`).join('')
    +`<div class="sgrp">${ui('gKeys')}</div>`
    +KEYORDER.map(a=>`<div class="srow"><span class="k">${ui('k_'+a)}</span><div class="keys">${keysFor(a).map(k=>`<button class="kc" data-key="${a}">${keyLabel(k)}</button>`).join('')}</div></div>`).join('')
    +`<div class="srow kfoot"><button class="tbtn" id="keyReset">${ui('kReset')}</button></div>`
    +`<div class="sgrp">${ui('kMouse')}</div><div class="srow mhelp">${['m_wire','m_gate','m_del','m_cut','m_pan'].map(k=>`<p>${ui(k)}</p>`).join('')}</div>`;
}
function keyBind(btn){
  const a=btn.dataset.key;$$('.kc.wait').forEach(x=>x.classList.remove('wait'));
  btn.classList.add('wait');btn.textContent=ui('kPress');
  window.keyCapture=e=>{
    e.preventDefault();e.stopPropagation();
    if(e.code==='Escape'&&a!=='menu'){window.keyCapture=null;drawSettings();return}
    const c=combo(e);if(!c)return;
    window.keyCapture=null;
    const other=KEYORDER.find(x=>x!==a&&keysFor(x).includes(c));
    if(other){toast(ui('kTaken',{k:keyLabel(c),a:ui('k_'+other)}));drawSettings();return}
    settings.keys=Object.assign({},settings.keys,{[a]:c});save();sfx('ui');drawSettings();toolTips();
  };
}
function setVal(k,val){
  settings[k]=val;save();ensureAudio();sfx('ui');
  if(k==='win'){settings.fs=false;applyWindow()}
  if(k==='fs')applyFs();
  if(k==='gost')badge('NOTATION');
  if(k==='lang'){LANG=settings.lang;applyLang()}
  if(k==='bit'){if(val==='off')menuBitStop();else if(curScr==='main'&&$('#ov').classList.contains('on'))menuBitStart()}
  applySettings();drawSettings();
}
$('#setList').addEventListener('click',e=>{
  const kb=e.target.closest('[data-key]');if(kb){keyBind(kb);return}
  if(e.target.closest('#keyReset')){settings.keys={};save();sfx('ui');drawSettings();toolTips();return}
  const dd=e.target.closest('[data-dd]');
  if(dd){const w=dd.parentElement,open=w.classList.contains('open');$$('.dd.open').forEach(x=>x.classList.remove('open'));if(!open){w.classList.add('open');const on=w.querySelector('.dd-o.on');if(on)on.scrollIntoView({block:'nearest'})}return}
  const b=e.target.closest('[data-k]');if(!b||b.type==='range')return;
  const d=SET.find(x=>x.k===b.dataset.k);
  if(b.dataset.tog){setVal(d.k,!settings[d.k]);return}
  if(b.dataset.v!=null){const val=d.o.find(o=>optKey(o)===b.dataset.v);setVal(d.k,val)}
});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.dd'))$$('.dd.open').forEach(x=>x.classList.remove('open'))});
$('#setList').addEventListener('input',e=>{
  const r=e.target;if(r.type!=='range')return;const v=+r.value;settings[r.dataset.k]=v;
  r.style.setProperty('--v',v+'%');r.nextElementSibling.textContent=v?v+' %':ui('vOff');musicGain();
});
$('#setList').addEventListener('change',e=>{const r=e.target;if(r.type!=='range')return;save();ensureAudio();sfx('ui')});
function applySettings(quiet){
  const r=document.documentElement.style;r.setProperty('--ui',UI());r.setProperty('--ww',settings.ww);
  document.body.classList.toggle('calm',!!settings.calm);document.body.classList.toggle('hc',!!settings.hc);
  $('#gridRect').style.display=settings.grid==='none'?'none':'';
  const g=$('#grid'),mm=settings.grid==='lines',sz=mm?100:20;g.setAttribute('width',sz);g.setAttribute('height',sz);
  let minor='';for(let i=10;i<100;i+=10)if(i!==50)minor+=`M${i},0V100M0,${i}H100`;
  g.innerHTML=mm?`<path d="${minor}" stroke="var(--mm1)" stroke-width=".7" fill="none"/><path d="M50,0V100M0,50H100" stroke="var(--mm5)" stroke-width=".9" fill="none"/><path d="M0,0V100M0,0H100" stroke="var(--mm10)" stroke-width="1.3" fill="none"/>`:'<circle cx="0" cy="0" r="1.2" fill="var(--grid)"/>';
  $('#mascot').classList.toggle('off',settings.bit==='off');
  musicGain();setSheet(sheetH);
  if(level){buildChrome();if(quiet)fit();else render()}
}
function applyWindow(){
  if(!isDesk)return;
  if(settings.win==='fs'){settings.win='auto';settings.fs=true}
  if(settings.fs){window.desktop.setFullScreen(true);return}
  if(settings.win==='auto')return;
  const [w,h]=settings.win.split('x').map(Number);window.desktop.setSize(w,h);
}
function applyFs(){
  if(isDesk){window.desktop.setFullScreen(!!settings.fs);return}
  try{
    if(settings.fs&&!document.fullscreenElement)document.documentElement.requestFullscreen().catch(()=>{settings.fs=false;drawSettings();toast(ui('fsDenied'))});
    if(!settings.fs&&document.fullscreenElement)document.exitFullscreen();
  }catch(e){settings.fs=false;toast(ui('fsNA'))}
}
if(isDesk&&window.desktop.onFullScreen)window.desktop.onFullScreen(on=>{settings.fs=!!on;save();if(curScr==='settings')drawSettings();setTimeout(()=>applySettings(true),100)});
document.addEventListener('fullscreenchange',()=>{if(isDesk)return;settings.fs=!!document.fullscreenElement;if(curScr==='settings')drawSettings();setTimeout(()=>applySettings(true),100)});
let rstArm=0;
$('#setReset').onclick=()=>{const b=$('#setReset');
  if(!rstArm){rstArm=1;b.innerHTML=ui('reset')+' <span class="v">— '+ui('resetSure')+'</span>';setTimeout(()=>{rstArm=0;b.textContent=ui('reset')},3000);return}
  rstArm=0;b.textContent=ui('reset');
  done=new Set();saves={};seen=new Set();prog={lv:{},quiz:{},badges:[],st:{undo:0}};Bit.log=[];
  store.set('ll_pro',false);store.set('ll_log',[],true);save();updHud();loadLevel(LV[0]);openMenu('settings');toast(ui('progReset'))};

/* ========== language ========== */
function applyLang(){
  document.documentElement.lang=LANG;
  $$('[data-t]').forEach(el=>el.textContent=ui(el.dataset.t));toolTips();
  $('#quitBtn').style.display=isDesk?'':'none';
  $('#verify').textContent=demoOn?ui('skip'):ui('verify');
  updHud();drawMachine();
  if(level){buildChrome();render()}
  if(curScr==='levels')drawTree();if(curScr==='profile')drawProfile();if(curScr==='quiz'&&QZ)drawQuiz();
}

/* ========== boot ========== */
window.addEventListener('resize',()=>{if(settings.ui==='auto')applySettings(true);else{setSheet(sheetH);render()}});
(function boot(){
  if(settings.demo===.45)settings.demo=.6;
  applyLang();
  applySettings(true);
  applyWindow();
  bitMood('idle');dailyCheck();
  const id=store.get('ll_last',1),l=LV.find(x=>x.id===id);
  loadLevel(l&&available(l)?l:LV[0]);
  prog.badges.forEach(steamAch);
  if($('#ov').classList.contains('on')&&curScr==='main'){document.body.classList.add('mainScr');setTimeout(menuBitStart,400)}
  bitPlace();
  setTimeout(()=>{
    if(!store.get('ll_pro',false)){say(STORY.prologue);store.set('ll_pro',true,true)}
    else say([{t:pick(STORY.welcome),m:'smug',wave:1}]);
  },700);
})();
window.LL={LV,get C(){return C},set C(v){C=v},loadLevel,settle,readOuts,resetSim,changed,get level(){return level},done,prog,points,openQuiz,openMenu,badge,get QZ(){return QZ}};
