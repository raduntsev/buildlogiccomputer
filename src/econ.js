/* ========== economy: points you earn and spend ==========
   Earned (never goes down, drives the clearance rank): levels + tests + badges + warm-up + daily shift.
   Balance = earned − spent. Spent on hints and on Bit's wardrobe.
   A stuck player is never locked out: the warm-up pays for correct answers (daily cap),
   and the hint gets cheaper after failed checks (half after 3, free after 6). */
const HINT_COST=40,BADGE_PTS=25,DAILY_PTS=25,DRILL_PTS=10,DRILL_CAP=150;
const today=()=>{const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()};
function earned(){const s=prog.st;return points()+prog.badges.length*BADGE_PTS+(s.drill||0)+(s.daily||0)}
function balance(){return earned()-(prog.st.spent||0)}
function spend(n){prog.st.spent=(prog.st.spent||0)+n;save();updHud()}
function ptsWord(n){
  if(LANG==='en')return n===1?'point':'points';
  const a=n%10,b=n%100;return a===1&&b!==11?'балл':a>=2&&a<=4&&(b<10||b>=20)?'балла':'баллов';
}
const ptsN=n=>num(n)+' '+ptsWord(n);
let failCount=0;
function hintBought(){return !!(level&&(prog.hb||[]).includes(level.id))}
function hintPrice(){if(!level||level.sandbox||hintUsed||hintBought())return 0;return failCount>=6?0:failCount>=3?HINT_COST/2:HINT_COST}
function hintLabel(){const c=hintPrice();return `${ui('hintAsk')}<span class="cost">${hintUsed||hintBought()?ui('hintOpen'):c?ptsN(c):ui('free')}</span>`}
function dailyCheck(){
  const d=today();if(prog.st.day===d)return;
  prog.st.day=d;prog.st.daily=(prog.st.daily||0)+DAILY_PTS;save();updHud();drawShopHead();if($('#mmShop'))$('#mmShop').textContent=ptsN(balance());
  setTimeout(()=>toast(ui('dailyToast',{p:ptsN(DAILY_PTS)})),2600);
}

/* ---------- warm-up: generated questions ---------- */
const GOP={AND:[(a,b)=>a&b,'A ∧ B'],OR:[(a,b)=>a|b,'A ∨ B'],NAND:[(a,b)=>1-(a&b),ov('A ∧ B')],NOR:[(a,b)=>1-(a|b),ov('A ∨ B')],
  XOR:[(a,b)=>a^b,'A ⊕ B'],XNOR:[(a,b)=>1-(a^b),'A ⊙ B'],NOT:[a=>1-a,ov('A')]};
const EXPR=[['(A ∨ B) ∧ C',(a,b,c)=>(a|b)&c],['A ∧ B ∨ C',(a,b,c)=>(a&b)|c],['A ⊕ B ⊕ C',(a,b,c)=>a^b^c],
  [ov('A ∧ B')+' ∨ C',(a,b,c)=>(1-(a&b))|c],['A ∧ '+ov('C')+' ∨ B ∧ C',(a,b,c)=>(a&(1-c))|(b&c)],[ov('A ∨ B')+' ⊕ C',(a,b,c)=>(1-(a|b))^c]];
const rb=()=>Math.random()<.5?0:1,ri=n=>Math.floor(Math.random()*n);
function opts(right,pool){const o=new Set([right]);let g=0;while(o.size<4&&g++<50)o.add(pool());return [...o].sort(()=>Math.random()-.5)}
function genQ(){
  const k=ri(10);
  if(k<3){const g=pick(Object.keys(GOP)),a=rb(),b=rb(),r=GOP[g][0](a,b);
    return{q:['Что на выходе элемента?','What does the gate output?'],fig:{g,v:g==='NOT'?[a]:[a,b]},a:[0,1],c:r}}
  if(k<5){const g=pick(Object.keys(GOP)),a=rb(),b=rb(),r=GOP[g][0](a,b);
    const v=g==='NOT'?`A = ${a}`:`A = ${a}, B = ${b}`;
    return{q:[`${v}. Чему равно Y = ${GOP[g][1]}?`,`${v}. What is Y = ${GOP[g][1]}?`],a:[0,1],c:r}}
  if(k<7){const [e,f]=pick(EXPR),a=rb(),b=rb(),c=rb();
    return{q:[`A = ${a}, B = ${b}, C = ${c}. Чему равно Y = ${e}?`,`A = ${a}, B = ${b}, C = ${c}. What is Y = ${e}?`],a:[0,1],c:f(a,b,c)}}
  if(k<8){const n=1+ri(15),bin=n.toString(2).padStart(4,'0');
    return{q:[`Двоичное число ${bin}<sub>2</sub>. Сколько это в десятичной системе?`,`The binary number ${bin}<sub>2</sub>. What is it in decimal?`],a:opts(n,()=>1+ri(15)),c:n}}
  if(k<9){const n=1+ri(15),bin=x=>x.toString(2).padStart(4,'0');
    const o=opts(n,()=>1+ri(15));return{q:[`Как записать число ${n} в двоичной системе?`,`How do you write ${n} in binary?`],a:o.map(bin),c:bin(n)}}
  const n=2+ri(4);
  return{q:[`Сколько строк в таблице истинности для ${n} входов?`,`How many rows does a truth table for ${n} inputs have?`],a:opts(2**n,()=>pick([2*n,n*n,2**(n+1),2**(n-1),n+2])),c:2**n};
}
const DR={q:null,answered:false,streak:0};
function drillLeft(){if(prog.st.drillDay!==today())return DRILL_CAP;return Math.max(0,DRILL_CAP-(prog.st.drillToday||0))}
function drawDrill(){
  const el=$('#drillQ');if(!el)return;
  if(!DR.q){DR.q=genQ();DR.answered=false}
  const q=DR.q;
  el.innerHTML=`<div class="dq">${mathHTML(tx(q.q))}</div>${q.fig?figSVG(q.fig):''}
    <div class="qa dqa">${q.a.map(v=>`<button class="qb" data-v="${v}">${mathHTML(String(v))}</button>`).join('')}</div>
    <div class="dfoot"><span id="drillMsg">${drillLeft()?ui('drillLeft',{p:ptsN(drillLeft())}):ui('drillCap')}</span><button class="tbtn" id="drillNext" ${DR.answered?'':'hidden'}>${ui('qNext')}</button></div>`;
}
document.addEventListener('click',e=>{
  if(e.target.closest('#drillNext')){DR.q=null;drawDrill();sfx('ui');return}
  const b=e.target.closest('#drillQ .qb');if(!b||DR.answered)return;
  const q=DR.q,ok=String(q.c)===b.dataset.v;DR.answered=true;
  $$('#drillQ .qb').forEach(x=>{if(x.dataset.v===String(q.c))x.classList.add('ok');else if(x===b)x.classList.add('bad');x.disabled=true});
  sfx(ok?'qok':'qbad');
  let msg;
  if(ok){DR.streak++;
    if(prog.st.drillDay!==today()){prog.st.drillDay=today();prog.st.drillToday=0}
    const g=Math.min(DRILL_PTS,drillLeft());
    if(g){const prevRank=rankIdx();prog.st.drill=(prog.st.drill||0)+g;prog.st.drillToday+=g;save();updHud();checkRank(prevRank);msg=ui('drillGain',{p:ptsN(g)})}
    else msg=ui('drillCap');
    if(DR.streak%5===0)say([{t:pick(STORY.drillStreak),m:'smug'}],{u:1});
  }else{DR.streak=0;msg=ui('drillWrong')}
  $('#drillMsg').textContent=msg;$('#drillNext').hidden=false;
  drawShopHead();
});

/* ---------- Bit's wardrobe ---------- */
const WEAR=[
  {id:'tie',c:150,n:['Бабочка','Bow tie']},
  {id:'monocle',c:200,n:['Монокль','Monocle']},
  {id:'hat',c:250,n:['Каска','Hard hat']},
  {id:'phones',c:300,n:['Наушники','Headphones']},
  {id:'bowler',c:400,n:['Котелок','Bowler hat']},
  {id:'mortar',c:600,n:['Шапочка выпускника','Graduation cap']}
];
function wearSVG(id){
  const k='var(--ink)';
  switch(id){
    case 'tie':return `<g class="w-tie"><path d="M40,71L30,65.5V76.5ZM40,71L50,65.5V76.5Z" fill="var(--coral)" stroke="${k}" stroke-width="1.8" stroke-linejoin="round"/><circle cx="40" cy="71" r="2.6" fill="${k}"/></g>`;
    case 'monocle':return `<g class="w-mon"><circle cx="40" cy="42" r="15.5" fill="none" stroke="${k}" stroke-width="2.4"/><path d="M53,50Q60,58 57,70" fill="none" stroke="${k}" stroke-width="1.3" stroke-dasharray="1.6 1.8"/></g>`;
    case 'hat':return `<g class="w-hat"><path d="M18,22Q18,9 40,9Q62,9 62,22Z" fill="var(--acc)" stroke="${k}" stroke-width="2.2" stroke-linejoin="round"/><path d="M34,10.5V22M46,10.5V22" stroke="${k}" stroke-width="1.6"/><path d="M11,22.5H69" stroke="${k}" stroke-width="3.2" stroke-linecap="round"/></g>`;
    case 'phones':return `<g class="w-ph"><path d="M13,40Q13,13 40,13Q67,13 67,40" fill="none" stroke="${k}" stroke-width="3.2" stroke-linecap="round"/><rect x="8" y="32" width="10" height="17" rx="4" fill="${k}"/><rect x="62" y="32" width="10" height="17" rx="4" fill="${k}"/><rect x="10.5" y="36" width="5" height="9" rx="2" fill="var(--acc)"/></g>`;
    case 'bowler':return `<g class="w-bow"><path d="M26,21Q26,5 40,5Q54,5 54,21Z" fill="${k}"/><path d="M26.4,17H53.6" stroke="var(--acc)" stroke-width="2.6"/><ellipse cx="40" cy="21" rx="25" ry="3.6" fill="${k}"/></g>`;
    case 'mortar':return `<g class="w-mor"><path d="M26,15V22H54V15" fill="${k}"/><path d="M12,14L40,5L68,14L40,23Z" fill="${k}" stroke="${k}" stroke-width="1.5" stroke-linejoin="round"/><path d="M40,14L61,17V28" fill="none" stroke="var(--acc)" stroke-width="2"/><circle cx="61" cy="30" r="2.8" fill="var(--acc)"/></g>`;
  }
  return '';
}
function wearRefresh(){bitMood(Bit.mood);miniDraw();if(window.menuBitRedraw)menuBitRedraw()}

/* ---------- workshop screen ---------- */
function drawShopHead(){
  const el=$('#shopHead');if(!el)return;
  el.innerHTML=`<div class="sh-bal"><b>${num(balance())}</b><span>${ptsWord(balance())} ${ui('onAcc')}</span></div>
    <div class="sh-sub">${ui('earnedT',{e:num(earned()),s:num(prog.st.spent||0)})}</div>`;
  if($('#mmShop'))$('#mmShop').textContent=ptsN(balance());
}
function drawShop(){
  const owned=prog.st.owned||[],wear=prog.st.wear||'';
  const earnRows=[[ui('eLevel'),'100–200'],[ui('eStar'),'+50'],[ui('eTest'),ui('upTo',{p:150})],[ui('eBadge'),'+'+BADGE_PTS],
    [ui('eDaily'),'+'+DAILY_PTS,prog.st.day===today()],[ui('eDrill'),'+'+DRILL_PTS]];
  $('#shopBox').innerHTML=`<div id="shopHead" class="sh-head"></div>
   <div class="sh-grid">
    <section class="sh-card"><h3>${ui('drill')}</h3><p class="sh-p">${ui('drillAbout',{p:ptsN(DRILL_PTS)})}</p><div id="drillQ"></div></section>
    <section class="sh-card"><h3>${ui('howEarn')}</h3>
      <div class="earn">${earnRows.map(r=>`<div class="er${r[2]?' got':''}"><span>${r[0]}</span><b>${r[2]?ui('gotToday'):r[1]}</b></div>`).join('')}</div>
      <p class="sh-p sh-note">${ui('hintRule',{a:ptsN(HINT_COST),b:ptsN(HINT_COST/2)})}</p></section>
   </div>
   <section class="sh-card"><h3>${ui('wardrobe')}</h3><p class="sh-p">${ui('wardAbout')}</p>
    <div class="wr-grid">${WEAR.map(w=>{const has=owned.includes(w.id),on=wear===w.id,can=balance()>=w.c;
      return `<div class="wr${on?' on':''}"><svg class="bitsvg wr-bit" viewBox="0 -4 80 100">${bitSVG('idle',w.id)}</svg><b>${tx(w.n)}</b>
       <button class="tbtn${on?'':has?' primary':''}" data-w="${w.id}" ${!has&&!can?'disabled':''}>${on?ui('takeOff'):has?ui('putOn'):ptsN(w.c)}</button></div>`}).join('')}</div></section>`;
  drawShopHead();drawDrill();
}
$('#shopBox').addEventListener('click',e=>{
  const b=e.target.closest('[data-w]');if(!b)return;
  const w=WEAR.find(x=>x.id===b.dataset.w),owned=prog.st.owned=prog.st.owned||[];
  if(!owned.includes(w.id)){
    if(balance()<w.c){toast(ui('noFunds'));return}
    spend(w.c);owned.push(w.id);prog.st.wear=w.id;sfx('badge');
    say([{t:fmt(tx(pick(STORY.bought)),{n:tx(w.n).toLowerCase()}),m:'happy',wave:1}],{u:1});
  }else{prog.st.wear=prog.st.wear===w.id?'':w.id;sfx('ui')}
  save();wearRefresh();drawShop();
});

Object.assign(UIS,{
  shop:['Мастерская','Workshop'],hintAsk:['Подскажи','Hint'],hintOpen:['уже открыта','already open'],free:['бесплатно','free'],
  dailyToast:['Смена началась: +{p}','Shift started: +{p}'],onAcc:['на счету','in your account'],earnedT:['Заработано {e}, потрачено {s}','Earned {e}, spent {s}'],
  drill:['Разминка','Warm-up'],drillAbout:['Короткие вопросы по логике. За каждый верный ответ +{p}.','Short logic questions. +{p} for every correct answer.'],
  drillLeft:['Сегодня можно заработать ещё {p}','You can still earn {p} today'],drillCap:['Лимит разминки на сегодня исчерпан. Отвечать всё равно можно.','Today’s warm-up limit is reached. You can keep answering anyway.'],
  drillGain:['Верно: +{p}','Correct: +{p}'],drillWrong:['Неверно. Правильный ответ подсвечен.','Wrong. The right answer is highlighted.'],
  howEarn:['Как заработать','How to earn'],eLevel:['Пройти уровень','Pass a level'],eStar:['Добрать звезду на пройденном уровне','Get a missing star on a passed level'],
  eTest:['Сдать контрольный тест','Pass a chapter test'],upTo:['до {p}','up to {p}'],eBadge:['Получить бейдж','Earn a badge'],eDaily:['Зайти в игру (раз в день)','Play today (once a day)'],
  eDrill:['Верный ответ в разминке','Correct warm-up answer'],gotToday:['получено','claimed'],
  hintRule:['Подсказка в уровне стоит {a}. После трёх неудачных проверок — {b}, после шести — бесплатно.','A hint costs {a}. After three failed checks it costs {b}, after six it is free.'],
  wardrobe:['Гардероб Бита','Bit’s wardrobe'],wardAbout:['Бит носит то, что вы купили, на всех экранах. Он делает вид, что ему всё равно.','Bit wears what you buy on every screen. He pretends not to care.'],
  putOn:['Надеть','Wear'],takeOff:['Снять','Take off'],noFunds:['Не хватает баллов','Not enough points'],cEarn:['Заработать баллы','Earn points'],
  balanceH:['На счету','Balance']
});
Object.assign(STORY,{
  broke:['Подсказка стоит {c}, а у вас {b}. Бесплатный сыр бывает только в мышеловке, а у меня его даже там нет. Заработайте в разминке: десять баллов за верный ответ.','The hint costs {c}, and you have {b}. Free cheese only exists in mousetraps, and I do not even have a mousetrap. Earn some in the warm-up: ten points per correct answer.'],
  discount:['Три неудачные проверки. Из жалости подсказка теперь стоит вдвое дешевле. Жалость я тоже записываю в протокол.','Three failed checks. Out of pity, the hint is now half price. I log pity too.'],
  freeHint:['Шесть неудачных проверок. Подсказка бесплатна. Я не добрый, я просто устал смотреть.','Six failed checks. The hint is free. I am not kind, I am just tired of watching.'],
  drillStreak:[['Пять верных подряд. Начинаю подозревать, что вы читали учебник.','Five in a row. I am beginning to suspect you read the textbook.'],['Серия. Не зазнавайтесь, это всего лишь разминка.','A streak. Do not get cocky, it is only a warm-up.'],['Ещё пять. Протокол растроган. Я — нет.','Five more. The log is touched. I am not.']],
  bought:[['Новая вещь: {n}. Мне идёт? Можете не отвечать, я знаю, что идёт.','New item: {n}. Does it suit me? You need not answer, I know it does.'],['Обновка: {n}. Протокол не одобряет, но протокол не носит одежду.','New look: {n}. The log disapproves, but the log does not wear clothes.']]
});
