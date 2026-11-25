/* ========== Bit: mascot and comm link ========== */
const Bit={q:[],timer:null,typer:null,typing:false,mood:'idle',cur:null,log:store.get('ll_log',[])};
let idleShown=false,idleT=null;

function bitSVG(m){
  const ink='var(--ink)',acc='var(--acc)';
  let eye,mouth;
  if(m==='happy')eye=`<path d="M29,46 Q40,31 51,46" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`;
  else if(m==='shock')eye=`<circle cx="40" cy="41" r="15" fill="#fff" stroke="${ink}" stroke-width="2.5"/><circle cx="40" cy="41" r="3.2" fill="${ink}"/>`;
  else if(m==='smug')eye=`<g class="eye"><circle cx="40" cy="42" r="12" fill="var(--acc)" stroke="${ink}" stroke-width="2.5"/><circle class="pupil" cx="37" cy="44" r="5" fill="${ink}"/><path d="M28,40 A12,12 0 0 1 52,40 Z" fill="${ink}"/></g>`;
  else{const px=m==='think'?45:40,py=m==='think'?37:43,lit=m!=='sad';
    eye=`<g class="eye"><circle cx="40" cy="42" r="12" fill="${lit?'var(--acc)':'#fff'}" stroke="${ink}" stroke-width="2.5"/><circle class="${m==='idle'?'pupil':''}" cx="${px}" cy="${py}" r="5" fill="${ink}"/>${m==='sad'?`<path d="M28,42 A12,12 0 0 1 52,42 Z" fill="${ink}"/>`:''}</g>`}
  mouth={idle:`<path d="M35,63H45" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/>`,
    talk:`<path d="M35,63H45" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/><ellipse class="m-open" cx="40" cy="63" rx="4.5" ry="3.5" fill="${ink}"/>`,
    happy:`<path d="M33,60 Q40,69 47,60" fill="none" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/>`,
    smug:`<path d="M34,63 Q42,66 47,60" fill="none" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/>`,
    sad:`<path d="M34,66 Q40,60 46,66" fill="none" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/>`,
    think:`<path d="M36,64 Q40,61 45,63" fill="none" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/>`,
    shock:`<circle cx="40" cy="64" r="3.5" fill="none" stroke="${ink}" stroke-width="2.5"/>`}[m];
  const dot=m==='happy'||m==='talk'?acc:m==='shock'?'var(--coral)':ink;
  const glyph=m==='think'?'?':m==='happy'?'1':m==='sad'?'0':'';
  return `<g class="legs"><path d="M31,72V86M49,72V86" stroke="${ink}" stroke-width="2.5"/><path d="M24,90Q31,84 38,90ZM42,90Q49,84 56,90Z" fill="${ink}"/></g>
<g class="torso">
 <g class="ant"><path d="M40,20V9" stroke="${ink}" stroke-width="2.5"/><circle class="${m==='talk'||m==='happy'?'spark':''}" cx="40" cy="6" r="4.5" fill="${dot}" stroke="${ink}" stroke-width="${dot===acc?1.5:0}"/>
  ${glyph?`<text x="51" y="10" font-family="Onest,sans-serif" font-weight="700" font-size="13" fill="${ink}">${glyph}</text>`:''}</g>
 <g class="arm-l"><path d="M14,50H6" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/><circle cx="5" cy="50" r="3.4" fill="${ink}"/></g>
 <g class="arm-r"><path d="M66,50H74" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/><circle cx="75" cy="50" r="3.4" fill="${ink}"/></g>
 <rect x="14" y="20" width="52" height="52" rx="12" fill="#fff" stroke="${ink}" stroke-width="2.5"/>
 <circle cx="59" cy="27" r="2.6" fill="var(--acc)" stroke="${ink}" stroke-width="1"/>
 ${eye}${mouth}
</g>`;
}
function bitMood(m){Bit.mood=m;$('#bit').innerHTML=bitSVG(m);$('#bit').classList.toggle('talk',m==='talk');if(!$('#bitMini').innerHTML)$('#bitMini').innerHTML=bitSVG('idle')}
function bitAnim(c){if(settings.calm)return;const b=$('#bit');b.classList.remove('jump','shake','wave');void b.getBoundingClientRect();b.classList.add(c);setTimeout(()=>b.classList.remove(c),1400)}

const norm=l=>(typeof l==='string'||Array.isArray(l))?{t:l}:l;
function logPush(text,me){Bit.log.push({t:text.replace(/<[^>]+>/g,''),me:!!me});if(Bit.log.length>120)Bit.log.splice(0,Bit.log.length-120);store.set('ll_log',Bit.log,true)}
function hideBubble(){clearTimeout(Bit.timer);clearInterval(Bit.typer);Bit.q=[];Bit.cur=null;Bit.typing=false;$('#chat').classList.remove('on','logon');document.body.classList.remove('bitOn');bitMood('idle')}

// opt.u: the player asked (bypasses mute and "hints only"); opt.hint: gameplay help (allowed in "hints only")
function say(lines,opt={}){
  if(settings.bit==='off')return;
  if(!opt.u&&((settings.bit==='hints'&&!opt.hint)||(bitMuted&&!opt.hint)))return;
  Bit.q=lines.map(norm);nextLine();
}
function sayMore(lines){
  if(settings.bit!=='all'||bitMuted)return;
  if($('#chat').classList.contains('on')&&(Bit.typing||Bit.q.length||(Bit.cur&&Bit.cur.ch)))Bit.q.push(...lines.map(norm));
  else say(lines);
}
function nextLine(){
  clearTimeout(Bit.timer);clearInterval(Bit.typer);
  const L=Bit.q.shift(),box=$('#chat'),el=$('#chatText'),chs=$('#chatCh');
  Bit.cur=L||null;chs.innerHTML='';
  if(!L){box.classList.remove('on');document.body.classList.remove('bitOn');bitMood('idle');return}
  box.classList.remove('logon');box.classList.add('on');document.body.classList.add('bitOn');document.body.classList.remove('bitWaiting');
  const text=tx(L.t);logPush(text);
  $('#chatMore').textContent=Bit.q.length&&!L.ch?ui('more'):'';
  const m=L.m||'idle',plain=text.replace(/<[^>]+>/g,'');
  const fin=()=>{
    Bit.typing=false;clearInterval(Bit.typer);el.innerHTML=text;bitMood(m);
    if(m==='happy')bitAnim('jump');if(m==='shock')bitAnim('shake');if(L.wave)bitAnim('wave');
    if(L.ch){chs.innerHTML=L.ch.map((c,i)=>`<button class="cbtn" data-c="${i}">${tx(c.t)}</button>`).join('');return}
    Bit.timer=setTimeout(()=>{if(!Bit.q.length)nextLine()},Math.max(4500,plain.length*75));
  };
  Bit.fin=fin;
  if(!settings.txt){fin();return}
  bitMood('talk');Bit.typing=true;let i=0;el.textContent='';
  Bit.typer=setInterval(()=>{i++;el.textContent=plain.slice(0,i);if(i%2===0)bitVoice(plain[i-1],m);if(i>=plain.length)fin()},settings.txt);
}
$('#chatBody').addEventListener('click',e=>{
  ensureAudio();
  const b=e.target.closest('.cbtn');
  if(b&&Bit.cur&&Bit.cur.ch){
    const c=Bit.cur.ch[+b.dataset.c];logPush('→ '+tx(c.t),true);Bit.cur=null;$('#chatCh').innerHTML='';sfx('ui');
    if(c.f)c.f();else if(c.r){Bit.q.unshift(norm(c.r));nextLine()}else nextLine();
    return;
  }
  if(Bit.typing)Bit.fin();else if(!(Bit.cur&&Bit.cur.ch))nextLine();
});
$('#chatX').addEventListener('click',e=>{e.stopPropagation();hideBubble()});
$('#chatLogBtn').addEventListener('click',e=>{
  e.stopPropagation();const box=$('#chat');
  if(box.classList.contains('logon')){box.classList.remove('logon');if(!Bit.cur&&!Bit.typing){box.classList.remove('on');document.body.classList.remove('bitOn')}return}
  clearTimeout(Bit.timer);
  $('#chatLog').innerHTML=Bit.log.length?Bit.log.map(x=>`<p class="${x.me?'me':''}">${x.t}</p>`).join(''):`<p class="me">${ui('logEmpty')}</p>`;
  box.classList.add('on','logon');document.body.classList.add('bitOn');const lg=$('#chatLog');lg.scrollTop=lg.scrollHeight;
});
$('#bitTab').addEventListener('click',()=>{ensureAudio();say([{t:UIS.listen,m:'smug',ch:bitMenu()}],{u:1})});
$('#bit').addEventListener('click',()=>{
  ensureAudio();
  const box=$('#chat');
  if(box.classList.contains('on')&&Bit.typing){Bit.fin();return}
  if(box.classList.contains('on')&&!Bit.cur){hideBubble();return}
  say([{t:UIS.listen,m:'smug',ch:bitMenu()}],{u:1});
});
function bitMenu(){
  const inLv=level&&!level.sandbox&&!$('#ov').classList.contains('on'),c=[];
  if(inLv)c.push({t:hintUsed?UIS.cHintFree:UIS.cHint,f:giveHint},{t:UIS.cWhat,f:explain});
  c.push({t:UIS.cStats,f:statsLine},{t:UIS.cFact,f:()=>say([{t:pick(STORY.facts),m:'smug'}],{u:1})});
  if(inLv)c.push(bitMuted?{t:UIS.cUnmute,f:()=>{bitMuted=false;say([{t:UIS.unmuteR,m:'happy'}],{u:1})}}:{t:UIS.cMute,f:muteLevel});
  c.push({t:UIS.cNothing,f:hideBubble});
  return c;
}
function explain(){
  if(!level||level.sandbox){say([{t:STORY.sandbox}],{u:1});return}
  say([{t:fmt(tx(STORY.about),{task:tx(level.task)}),m:'smug',ch:[{t:hintUsed?UIS.cHintFree:UIS.cHint,f:giveHint},{t:UIS.cGo,f:hideBubble}]}],{u:1});
}
function muteLevel(){badge('SILENCE');say([STORY.mute],{u:1});bitMuted=true}
function statsLine(){
  const p=points(),n=LV.filter(l=>done.has(l.id)).length,share=n/LV.length;
  const v=tx(STORY.verdict[share<.2?0:share<.5?1:share<.8?2:3]);
  say([{t:fmt(tx(STORY.stats),{r:tx(RANKS[rankIdx(p)][1]),p:num(p),n,N:LV.length,v}),m:'smug'}],{u:1});
}
function giveHint(){
  if(!level||level.sandbox){say([{t:STORY.noHint,m:'think'}],{u:1});return}
  if(!hintUsed){hintUsed=true;prog.st.hints=(prog.st.hints||0)+1;save()}
  $('#hint').classList.add('on');$('#hintBtn').textContent=ui('hint');
  say([{t:tx(pick(STORY.hintPre))+' '+tx(level.hint),m:'think'}],{u:1});
}
function levelIntro(){
  if(!level||$('#ov').classList.contains('on'))return;
  if(level.sandbox){if(!seen.has(0)){seen.add(0);save();setTimeout(()=>say([{t:STORY.sandbox,m:'smug'}]),350)}return}
  if(seen.has(level.id))return;
  const lines=[];
  if(!seen.has('c'+level.ch)){seen.add('c'+level.ch);lines.push({t:STORY.ch[level.ch],m:'happy'})}
  lines.push({t:STORY.lv[level.id],m:'smug',ch:[{t:UIS.cGo,f:hideBubble},{t:UIS.cWhat,f:explain},{t:UIS.cQuiet,f:muteLevel}]});
  seen.add(level.id);save();
  setTimeout(()=>say(lines),350);
}
function resetIdle(){clearTimeout(idleT);idleT=setTimeout(()=>{
  if(idleShown||!level||level.sandbox||done.has(level.id)||demoOn||$('#ov').classList.contains('on')||$('#chat').classList.contains('on'))return;
  idleShown=true;document.body.classList.add('bitWaiting');
},60000)}

/* ========== fx ========== */
const NS='http://www.w3.org/2000/svg';
function fxRing(x,y,r=14,grey){if(settings.calm)return;const c=document.createElementNS(NS,'circle');c.setAttribute('cx',x);c.setAttribute('cy',y);c.setAttribute('r',r);c.setAttribute('class','fx-ring'+(grey?' g':''));fxG.appendChild(c);setTimeout(()=>c.remove(),650)}
function fxBits(x,y){if(settings.calm)return;for(let i=0;i<7;i++){const e=document.createElementNS(NS,'text');e.textContent=Math.random()<.65?'1':'0';e.setAttribute('x',x-5+(Math.random()-.5)*20);e.setAttribute('y',y+5);e.setAttribute('class','fx-bit');e.style.setProperty('--dx',((Math.random()-.5)*70)+'px');e.style.animationDelay=(i*.07)+'s';fxG.appendChild(e);setTimeout(()=>e.remove(),1700+i*70)}}
