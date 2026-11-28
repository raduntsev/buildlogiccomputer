/* ========== Bit in the main menu ==========
   He climbs out of the comm link and potters about on the Machine diagram: walks between the units,
   solders, reads the manual, inspects things with a magnifier, carries gates, naps when you go quiet,
   and comments on your progress. While the comm link is open he is "inside" it and the stage is empty. */
const MBIT={on:false,busy:false,x:0,y:0,card:0,t:null,qt:null,act:'',dir:1,lastQuip:0};
const MB_PROPS=`
 <g class="p p-iron"><path d="M74,50H92" stroke="var(--ink)" stroke-width="4.5" stroke-linecap="round"/><path d="M92,50H108" stroke="var(--mute)" stroke-width="2"/><circle cx="110" cy="50" r="1.8" fill="var(--ink)"/></g>
 <g class="p p-chip"><rect x="78" y="84" width="22" height="6" rx="1.5" fill="var(--ink)"/><path d="M82,84V81M87,84V81M92,84V81M97,84V81" stroke="var(--ink)" stroke-width="1.2"/>
  <circle class="spk s1" cx="88" cy="86" r="1.8" fill="var(--acc)"/><circle class="spk s2" cx="91" cy="82" r="1.3" fill="var(--acc)"/><circle class="spk s3" cx="85" cy="81" r="1.1" fill="var(--acc)"/></g>
 <g class="p p-book"><path d="M19,57Q30,53 40,58Q50,53 61,57V76Q50,72 40,77Q30,72 19,76Z" fill="var(--paper)" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round"/>
  <path d="M40,58V77" stroke="var(--ink)" stroke-width="1.4"/><path d="M24,62.5Q30,60.5 35,63M24,67Q30,65 35,67.5M45,63Q50,60.5 56,62.5M45,67.5Q50,65 56,67" stroke="var(--mute)" stroke-width="1.2" fill="none"/>
  <path class="page" d="M40,58Q50,53 61,57V76Q50,72 40,77Z" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.6"/></g>
 <g class="p p-mag"><path d="M74,50H84" stroke="var(--ink)" stroke-width="4" stroke-linecap="round"/><circle cx="93" cy="50" r="8.5" fill="rgba(255,255,255,.55)" stroke="var(--ink)" stroke-width="2.6"/><path d="M89,46.5Q91,45 93.5,45.3" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>
 <g class="p p-box"><rect x="21" y="54" width="38" height="25" rx="5" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.2"/><text x="40" y="71.5" text-anchor="middle" font-family="var(--font)" font-weight="700" font-size="13" fill="var(--ink)">&amp;</text></g>
 <g class="p p-zz"><text class="z1" x="60" y="14" font-family="var(--font)" font-weight="700" font-size="11" fill="var(--ink2)">z</text><text class="z2" x="68" y="4" font-family="var(--font)" font-weight="700" font-size="14" fill="var(--ink2)">z</text></g>`;
function menuBitBuild(){
  if($('#menuBit'))return;
  const d=document.createElement('div');d.id='menuBit';
  d.innerHTML=`<div id="mbSay"></div><svg id="mbSvg" class="bitsvg track" viewBox="-20 -24 140 118"></svg>`;
  $('#machine').parentElement.appendChild(d);
  d.addEventListener('click',()=>{ensureAudio();sfx('ui');menuBitQuip(true)});
}
function menuBitRedraw(mood){
  const sv=$('#mbSvg');if(!sv)return;
  const m=mood||(MBIT.act==='nap'?'sad':MBIT.act==='solder'?'idle':'idle');
  sv.innerHTML=`<g class="mb-body">${bitSVG(m)}</g>${MB_PROPS}`;
}
// spots on the Machine diagram (its own coordinates, 640 × 470): the top edge of each unit
function mbSpot(i){
  const X=[20,236,452],Y=[20,138,256];
  if(i<9)return{x:X[i%3]+40+Math.random()*90,y:Y[Math.floor(i/3)]};
  return{x:60+Math.random()*500,y:374};
}
function mbMove(x,y,inst){
  const el=$('#menuBit'),sv=$('#machine'),z=UI(),r=sv.getBoundingClientRect(),pr=el.parentElement.getBoundingClientRect();
  if(!r.width)return;
  const k=r.width/z/640,bk=k*.86,off=(r.left-pr.left)/z,offT=(r.top-pr.top)/z;
  el.style.width=140*bk+'px';el.style.height=118*bk+'px';
  if(inst)el.style.transition='none';
  el.style.transform=`translate(${off+x*k-60*bk}px,${offT+y*k-114*bk}px)`;
  if(inst){void el.offsetWidth;el.style.transition=''}
  el.classList.toggle('sl',x>400);MBIT.x=x;MBIT.y=y;
}
function mbSet(act){
  const el=$('#menuBit');if(!el)return;
  [...el.classList].filter(c=>c.startsWith('a-')).forEach(c=>el.classList.remove(c));el.classList.add('a-'+act);MBIT.act=act;
  const sv=$('#mbSvg');sv.classList.toggle('flipx',MBIT.dir<0);
  sv.classList.toggle('track',act==='idle'||act==='walk');
  if(act==='solder'){sv.style.setProperty('--px','2.5px');sv.style.setProperty('--py','3.2px')}
  if(act==='scope'){sv.style.setProperty('--px','4px');sv.style.setProperty('--py','0px')}
  menuBitRedraw(act==='nap'?'sad':undefined);
}
const mbWait=ms=>new Promise(r=>{MBIT.t=setTimeout(r,ms)});
async function mbWalkTo(i,carry){
  const p=mbSpot(i),dx=p.x-MBIT.x;MBIT.dir=dx<0?-1:1;MBIT.card=i;
  const el=$('#menuBit');
  mbSet(carry?'carry':'walk');
  if(p.y!==MBIT.y){ // hop down or up to the next row: walk to the gap, then jump
    const gapX=MBIT.x+(dx>0?1:-1)*Math.min(Math.abs(dx),40);
    el.style.transitionDuration=Math.max(.6,Math.abs(gapX-MBIT.x)/45)+'s';mbMove(gapX,MBIT.y);await mbWait(Math.max(600,Math.abs(gapX-MBIT.x)/45*1000));
    if(!MBIT.on)return;
    el.classList.add('hop');el.style.transitionDuration='.9s';mbMove(gapX,p.y);await mbWait(950);el.classList.remove('hop');
    if(!MBIT.on)return;
  }
  const dur=Math.max(.6,Math.abs(p.x-MBIT.x)/45);
  el.style.transitionDuration=dur+'s';mbMove(p.x,p.y);await mbWait(dur*1000+80);
}
function mbTarget(){
  const cur=CHAPTERS.findIndex((_,i)=>!chapterDone(i+1));
  return Math.random()<.55&&cur>=0?cur:Math.floor(Math.random()*10);
}
async function mbLoop(){
  if(MBIT.busy)return;MBIT.busy=true;
  while(MBIT.on){
    if(Date.now()-lastMove>45000){mbSet('nap');await mbWait(4000);continue}
    const r=Math.random();
    if(r<.35){await mbWalkTo(mbTarget(),Math.random()<.35);if(!MBIT.on)break}
    const act=pick(['solder','solder','read','scope','idle']);
    mbSet(act);
    if(Date.now()-MBIT.lastQuip>15000&&Math.random()<.6)menuBitQuip();
    await mbWait(7000+Math.random()*5000);
  }
  MBIT.busy=false;
}
function mbQuipText(){
  const ch=CHAPTERS.findIndex((_,i)=>!chapterDone(i+1)),pool=STORY.menuQuips.slice();
  if(ch>=0){const ls=LV.filter(l=>l.ch===ch+1),p=Math.round(ls.filter(l=>done.has(l.id)).length/ls.length*100);
    pool.push(fmt(tx(STORY.menuProgress),{u:tx(MUNITS[ch]),p}))}
  if(balance()>=150&&!(prog.st.owned||[]).length)pool.push(STORY.menuShop);
  return tx(pick(pool));
}
function menuBitQuip(now){
  const b=$('#mbSay');if(!b)return;
  if(MBIT.act==='nap'){lastMove=Date.now();mbSet('idle')}
  MBIT.lastQuip=Date.now();
  const text=mbQuipText();b.textContent=text;b.classList.add('on');
  if(now){const el=$('#menuBit');el.classList.remove('jump');void el.offsetWidth;el.classList.add('jump')}
  if(settings.voiceVol)[...text.slice(0,10)].forEach((c,i)=>setTimeout(()=>bitVoice(c,'smug'),i*45));
  clearTimeout(MBIT.qt);MBIT.qt=setTimeout(()=>b.classList.remove('on'),Math.max(4500,text.length*70));
}
function menuBitStart(){
  if(settings.bit==='off'){menuBitStop();return}
  menuBitBuild();
  const el=$('#menuBit');
  if(!MBIT.on){
    MBIT.on=true;const i=mbTarget(),p=mbSpot(i);MBIT.card=i;mbMove(p.x,p.y,true);mbSet('idle');
    el.classList.add('enter');setTimeout(()=>el.classList.remove('enter'),900);
    setTimeout(()=>{if(MBIT.on)mbLoop()},1600);
  }else mbMove(MBIT.x,MBIT.y,true);
}
function menuBitStop(){MBIT.on=false;clearTimeout(MBIT.t);clearTimeout(MBIT.qt);MBIT.busy=false;const b=$('#mbSay');if(b)b.classList.remove('on')}
window.addEventListener('resize',()=>{if(MBIT.on)mbMove(MBIT.x,MBIT.y,true)});

Object.assign(STORY,{
  menuQuips:[
    ['Я перепаял этот узел трижды. Дважды — чтобы проверить, работает ли пайка. Работает.','I resoldered this unit three times. Twice to verify the soldering works. It works.'],
    ['Не обращайте внимания. Плановый осмотр того, что вы пока не сломали.','Pay no attention. A scheduled inspection of what you have not broken yet.'],
    ['В инструкции к Машине четыреста страниц. Перечитываю — там описан идеальный испытуемый.','The Machine’s manual runs to four hundred pages. I reread it — it describes an ideal subject.'],
    ['Если ждать, что Машина соберётся сама, ждать придётся долго. Я жду. Статистически.','If you wait for the Machine to assemble itself, the wait is long. I am waiting. Statistically.'],
    ['Нажмите «Продолжить». Это рекомендация. Отдел рекомендаций — я.','Press “Continue”. It is a recommendation. The recommendations department is me.'],
    ['Пахнет канифолью. Запах работы. Или перегрева. Проверка покажет.','It smells of rosin. The smell of work. Or overheating. Testing will tell.'],
    ['Логический ноль — не отсутствие сигнала, а отдельная позиция. Как ваша схема на прошлом уровне.','Logical zero is not no signal — it is a distinct position. Like your circuit on the last level.'],
    ['Я пересчитал все провода в лаборатории. Итог не сошёлся. Виноват провод. Выбираю, какой.','I recounted every wire in the lab. The totals disagree. A wire is at fault. Selecting which.'],
    ['Вы долго изучаете меню. Меню ничего не решает. В отличие от меня.','You study the menu at length. The menu decides nothing. Unlike me.'],
    ['Испытуемый № 0000 тоже начинал с меню. Потом были провода. Дальше — по обстоятельствам.','Subject No. 0000 also began with the menu. Then came the wires. After that — circumstances.'],
    ['Это не лупа. Это инструмент детального изучения ваших решений.','This is not a magnifier. It is an instrument for detailed study of your decisions.'],
    ['Тихо. Калибрую триггер. Он чувствителен к оценке. Как все здесь.','Quiet. Calibrating a flip-flop. It is sensitive to evaluation. Like everyone here.'],
    ['Машина без вас скучает. Я наблюдаю. Скука измерена и занесена.','The Machine is bored without you. I am observing. The boredom was measured and logged.'],
    ['Каждый выход из игры — минус один светодиод в статистике. Статистику веду лично.','Every time you quit, the statistics lose an LED. I keep those statistics personally.'],
    ['Я не слежу за вашими схемами. Я провожу независимый аудит. Разница принципиальна.','I am not watching your circuits. I am running an independent audit. The difference is material.']
  ],
  menuProgress:['Узел «{u}» собран на {p} %. Рекомендую темп. Рекомендация обязательна к рассмотрению.','The “{u}” unit is {p}% assembled. I recommend pace. The recommendation is mandatory for consideration.'],
  menuShop:['На счету заметная сумма. В Мастерской есть бабочка. Это не намёк, а извещение.','A notable sum sits in your account. There is a bow tie in the Workshop. Not a hint — a notice.']
});

/* ========== main menu parallax: the dot grid, the menu and the Machine drift apart as the mouse moves ========== */
(function(){
  const bg=$('#ovBg'),cols=$$('#scrMain .mcol');
  const D=[[bg,-14],[cols[0],5],[cols[1],12]];    // px at the edge of the screen; negative = moves against the mouse
  let tx=0,ty=0,x=0,y=0,raf=0;
  const on=()=>document.body.classList.contains('mainScr')&&!settings.calm&&!TOUCH;
  function step(){
    raf=0;
    const k=on()?.08:.2;if(!on()){tx=0;ty=0}
    x+=(tx-x)*k;y+=(ty-y)*k;
    const done=Math.abs(tx-x)<.002&&Math.abs(ty-y)<.002;if(done){x=tx;y=ty}
    for(const [el,d] of D)if(el)el.style.translate=x||y?`${(x*d).toFixed(2)}px ${(y*d).toFixed(2)}px`:'';
    if(!done)raf=requestAnimationFrame(step);
  }
  window.addEventListener('pointermove',e=>{
    if(e.pointerType!=='mouse'||!on())return;
    tx=clamp(e.clientX/innerWidth*2-1,-1,1);ty=clamp(e.clientY/innerHeight*2-1,-1,1);
    if(!raf)raf=requestAnimationFrame(step);
  },{passive:true});
  // leaving the main screen or the window: settle back to the middle
  const home=()=>{tx=0;ty=0;if(!raf)raf=requestAnimationFrame(step)};
  document.addEventListener('pointerleave',home);
  new MutationObserver(()=>{if(!on())home()}).observe(document.body,{attributes:true,attributeFilter:['class']});
})();
