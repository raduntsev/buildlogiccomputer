/* ========== Bit: mascot and comm link ========== */
const Bit={q:[],timer:null,typer:null,typing:false,mood:'idle',cur:null,log:store.get('ll_log',[])};
let idleShown=false,idleT=null;

function bitSVG(m,wear){
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
  const ant=`<g class="ant"><path d="M40,20V9" stroke="${ink}" stroke-width="2.5"/><circle class="${m==='talk'||m==='happy'?'spark':''}" cx="40" cy="6" r="4.5" fill="${dot}" stroke="${ink}" stroke-width="${dot===acc?1.5:0}"/>
  ${glyph?`<text x="51" y="10" font-family="Onest,sans-serif" font-weight="700" font-size="13" fill="${ink}">${glyph}</text>`:''}</g>`;
  const w=wear===undefined?(typeof prog!=='undefined'&&prog.st&&prog.st.wear)||'':wear,hat=/^(hat|bowler|mortar)$/.test(w);
  return `<g class="legs"><g class="leg-l"><path d="M31,72V86" stroke="${ink}" stroke-width="2.5"/><path d="M24,90Q31,84 38,90Z" fill="${ink}"/></g><g class="leg-r"><path d="M49,72V86" stroke="${ink}" stroke-width="2.5"/><path d="M42,90Q49,84 56,90Z" fill="${ink}"/></g></g>
<g class="torso">
 ${hat?'':ant}
 <g class="arm-l"><g transform="rotate(-62 14 50)"><path d="M14,50H5" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/><circle cx="4.5" cy="50" r="3.4" fill="${ink}"/></g></g>
 <g class="arm-r"><g transform="rotate(62 66 50)"><path d="M66,50H75" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/><circle cx="75.5" cy="50" r="3.4" fill="${ink}"/></g></g>
 <rect x="14" y="20" width="52" height="52" rx="12" fill="#fff" stroke="${ink}" stroke-width="2.5"/>
 <circle cx="59" cy="27" r="2.6" fill="var(--acc)" stroke="${ink}" stroke-width="1"/>
 ${eye}${mouth}${w?wearSVG(w):''}${hat?ant:''}
</g>`;
}
function bitMood(m){Bit.mood=m;if(window.musicMood)musicMood({happy:'bright',smug:'playful',sad:'low',shock:'tense',think:'focus'}[m]);$('#bit').innerHTML=bitSVG(m);$('#bit').classList.toggle('talk',m==='talk');if(!$('#bitMini').innerHTML)miniDraw()}
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
  box.classList.remove('logon');box.classList.add('on');bitPlace();document.body.classList.add('bitOn');document.body.classList.remove('bitWaiting');
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
  if(inLv)c.push({t:hintLabel(),f:giveHint},{t:UIS.cWhat,f:explain});
  c.push({t:UIS.cStats,f:statsLine},{t:UIS.cFact,f:()=>say([{t:pick(STORY.facts),m:'smug'}],{u:1})});
  c.push({t:UIS.cEarn,f:()=>openMenu('shop')});
  if(inLv)c.push(bitMuted?{t:UIS.cUnmute,f:()=>{bitMuted=false;say([{t:UIS.unmuteR,m:'happy'}],{u:1})}}:{t:UIS.cMute,f:muteLevel});
  c.push({t:UIS.cNothing,f:hideBubble});
  return c;
}
function explain(){
  if(!level||level.sandbox){say([{t:STORY.sandbox}],{u:1});return}
  say([{t:fmt(tx(STORY.about),{task:tx(level.task)}),m:'smug',ch:[{t:hintLabel(),f:giveHint},{t:UIS.cGo,f:hideBubble}]}],{u:1});
}
function muteLevel(){badge('SILENCE');say([STORY.mute],{u:1});bitMuted=true}
function statsLine(){
  const p=earned(),n=LV.filter(l=>done.has(l.id)).length,share=n/LV.length;
  const v=tx(STORY.verdict[share<.2?0:share<.5?1:share<.8?2:3]);
  say([{t:fmt(tx(STORY.stats),{r:tx(RANKS[rankIdx(p)][1]),p:num(p),n,N:LV.length,v}),m:'smug'}],{u:1});
}
function giveHint(){
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

/* ========== Bit's window: drag, flip, mini tab that watches you ========== */
function miniDraw(){const m=$('#bitMini');m.innerHTML=bitSVG('idle');m.classList.add('bitsvg')}
$('#bit').classList.add('bitsvg');
const BP=Object.assign({dx:0,dy:0,my:0},store.get('ll_bitpos',{}));window.bitReady=1;
const isMob=()=>innerWidth<=760;
/* Desktop: Bit lives in a dock at the bottom right, next to the zoom buttons. It can be dragged anywhere
   on the free part of the screen: it never leaves the window and slides off the toolbar, the palette,
   the task card and the bottom sheet. Near the dock it is pulled in like a magnet; while it is away,
   the zoom buttons move into the corner and come back when Bit returns. */
const SNAP_R=72;                       // magnet radius around the dock, screen px
const BIT={adj:{x:0,y:0},near:false,raf:0,dragging:false,home:true};
const rectOf=el=>{const r=el.getBoundingClientRect();return r.width&&r.height?{x:r.left,y:r.top,w:r.width,h:r.height}:null};
const hits=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function bitObstacles(){
  if($('#ov').classList.contains('on')||!level)return [];
  const z=UI(),o=[];
  for(const el of $$('#top .tb>*,#palette,#taskCard,#toolDock')){const r=rectOf(el);if(r)o.push(r)}
  // the sheet and the zoom buttons animate, so use where they are going rather than where they are
  const sh=(14+sheetH)*z;o.push({x:16*z,y:innerHeight-sh,w:innerWidth-32*z,h:sh});
  if(!BIT.home){const zm=$('#zoom');if(zm.offsetWidth){const w=zm.offsetWidth*z,h=zm.offsetHeight*z;o.push({x:innerWidth-16*z-w,y:innerHeight-(sheetH+26)*z-h,w,h})}}
  return o;
}
/* move rectangle r into the free area: inside the window and off every obstacle.
   Candidates are the window edges and the sides of every obstacle; the nearest free spot wins. */
function fitRect(r,obs,pad){
  const x0=pad,y0=pad,x1=Math.max(pad,innerWidth-pad-r.w),y1=Math.max(pad,innerHeight-pad-r.h);
  const cx=clamp(r.x,x0,x1),cy=clamp(r.y,y0,y1);
  const free=(x,y)=>!obs.some(o=>x<o.x+o.w+pad-.5&&x+r.w>o.x-pad+.5&&y<o.y+o.h+pad-.5&&y+r.h>o.y-pad+.5);
  if(free(cx,cy))return {x:cx-r.x,y:cy-r.y};
  const xs=[cx,x0,x1],ys=[cy,y0,y1];
  for(const o of obs){xs.push(o.x-pad-r.w,o.x+o.w+pad);ys.push(o.y-pad-r.h,o.y+o.h+pad)}
  let best=null;
  for(const x of xs)if(x>=x0-.5&&x<=x1+.5)for(const y of ys)if(y>=y0-.5&&y<=y1+.5&&free(x,y)){
    const d=Math.hypot(x-r.x,y-r.y);if(!best||d<best.d)best={x,y,d};
  }
  return best?{x:best.x-r.x,y:best.y-r.y}:{x:cx-r.x,y:cy-r.y};
}
function zoomPlace(){
  const zm=$('#zoom');
  if(innerWidth<=760){zm.style.right='8px';return}
  zm.style.right=(settings.bit!=='off'&&BIT.home?92:16)+'px';
}
function bitPlaceSoon(){if(!BIT.raf)BIT.raf=requestAnimationFrame(()=>{BIT.raf=0;bitPlace()})}
function bitPlace(){
  if(BIT.raf){cancelAnimationFrame(BIT.raf);BIT.raf=0}
  const M=$('#mascot'),T=$('#bitTab'),mob=isMob(),z=UI(),pad=8;
  M.classList.toggle('mob',mob);
  if(mob){ // phone: the tab moves on its own, the comm link drops down from the top
    BIT.home=false;zoomPlace();
    M.style.translate='';T.style.translate=`${BP.dx}px ${BP.dy}px`;
    // the tab's box from the dock + offset: its drawn rectangle grows while it swings
    const m=M.getBoundingClientRect(),e=8*z,r={left:m.left+BP.dx*z,right:m.right+BP.dx*z,top:m.top+BP.dy*z,bottom:m.bottom+BP.dy*z,width:m.width};
    if(r.width){let fx=0,fy=0;const pad=e;
      if(r.left<pad)fx=(pad-r.left)/z;if(r.right>innerWidth-pad)fx=(innerWidth-pad-r.right)/z;
      if(r.top<pad)fy=(pad-r.top)/z;if(r.bottom>innerHeight-pad)fy=(innerHeight-pad-r.bottom)/z;
      // never sit on the element strip: lift the tab above it
      const pr=rectOf($('#palette'));if(pr&&!$('#ov').classList.contains('on')&&hits({x:r.left+fx*z,y:r.top+fy*z,w:r.width,h:r.bottom-r.top},pr)){const up=(pr.y-pad-(r.bottom+fy*z))/z;if(r.top+(fy+up)*z>=pad)fy+=up}
      if(fx||fy){BP.dx+=fx;BP.dy+=fy;T.style.translate=`${BP.dx}px ${BP.dy}px`}}
    const ch=$('#chat').offsetHeight;BP.my=clamp(BP.my||0,0,Math.max(0,innerHeight/z-ch-120));
    $('#chat').style.top=(52+BP.my)+'px';M.classList.remove('fl','ft');return;
  }
  T.style.translate='';$('#chat').style.top='';
  // the dock = the mascot box with no offset, from its right/bottom (translate may be mid-animation,
  // so the drawn rectangle is not used); the rest is plain arithmetic
  const cs=getComputedStyle(M),mw=M.offsetWidth*z,mh=M.offsetHeight*z;
  if(!mw||cs.display==='none')return;
  const H={x:innerWidth-parseFloat(cs.right)*z-mw,y:innerHeight-parseFloat(cs.bottom)*z-mh,w:mw,h:mh};
  // magnet: near the dock Bit is pulled in and the dock lights up
  const d=Math.hypot(BP.dx,BP.dy)*z;
  BIT.near=d<(BIT.near?SNAP_R+10:SNAP_R);BIT.home=d<1||(BIT.dragging&&BIT.near);
  const pull=BIT.dragging&&BIT.near?Math.min(1,(d/SNAP_R)**2):1;   // how much of the offset survives inside the magnet: grows smoothly to 1 at the edge, so there is no jump
  let dx=BP.dx*pull,dy=BP.dy*pull;
  const obs=bitObstacles();
  // the tab stays on the free part of the screen
  if(!BIT.home){const f=fitRect({x:H.x+dx*z,y:H.y+dy*z,w:H.w,h:H.h},obs,pad);dx+=f.x/z;dy+=f.y/z;if(!BIT.dragging){BP.dx=dx;BP.dy=dy}}
  // the open window: pick the corner it unfolds from, then nudge it so it fits as well
  const chat=$('#chat'),open=chat.classList.contains('on');let ax=0,ay=0,fl=false,ft=false;
  if(open){
    const cw=chat.offsetWidth*z,ch=chat.offsetHeight*z,tx=H.x+dx*z,ty=H.y+dy*z;
    let best=null;
    for(const L of [false,true])for(const Tp of [false,true]){
      const r={x:L?tx:tx+H.w-cw,y:Tp?ty:ty+H.h-ch,w:cw,h:ch},f=fitRect(r,obs,pad),cost=Math.hypot(f.x,f.y)+(L?1:0)+(Tp?1:0);
      if(!best||cost<best.cost)best={cost,L,Tp,f};
    }
    fl=best.L;ft=best.Tp;ax=best.f.x/z;ay=best.f.y/z;
  }
  BIT.adj={x:ax,y:ay};
  M.style.translate=`${(dx+ax).toFixed(1)}px ${(dy+ay).toFixed(1)}px`;
  M.classList.toggle('fl',fl);M.classList.toggle('ft',ft);
  document.body.classList.toggle('bitNear',BIT.dragging&&BIT.near);
  zoomPlace();
}
/* a little physics: the window swings on the point you hold it by and settles on a spring */
const PH={a:0,v:0,t:0,raf:0,el:null,stopT:0,lt:0};
function physStep(now){
  // tuned for 60 fps; scale by the real frame time so 120/144 Hz screens swing at the same speed
  const f=PH.lt?Math.min(3,Math.max(.25,(now-PH.lt)/16.67)):1;PH.lt=now;
  PH.v=(PH.v+(PH.t-PH.a)*.09*f)*Math.pow(.86,f);PH.a+=PH.v*f;
  if(PH.el)PH.el.style.rotate=PH.a.toFixed(2)+'deg';
  if(Math.abs(PH.v)>.02||Math.abs(PH.t-PH.a)>.05)PH.raf=requestAnimationFrame(physStep);
  else{PH.raf=0;PH.lt=0;PH.a=PH.t;if(PH.el){PH.el.style.rotate=PH.t?PH.t+'deg':'';if(!PH.t)PH.el.style.transformOrigin=''}}
}
function physKick(){if(!PH.raf&&!settings.calm)PH.raf=requestAnimationFrame(physStep)}
function bitDock(){BP.dx=0;BP.dy=0;BP.my=0;store.set('ll_bitpos',BP,true);bitPlace()}
function bitDrag(handle,isTab){
  let st=null;
  handle.addEventListener('pointerdown',e=>{
    if(e.button!==0||(!isTab&&e.target.closest('button')))return;
    st={x:e.clientX,y:e.clientY,dx:BP.dx,dy:BP.dy,my:BP.my,moved:false,id:e.pointerId,lx:e.clientX,lt:performance.now()};
  });
  window.addEventListener('pointermove',e=>{
    if(!st||e.pointerId!==st.id)return;
    const ddx=e.clientX-st.x,ddy=e.clientY-st.y;
    if(!st.moved&&Math.hypot(ddx,ddy)<5)return;
    const mob=isMob(),vert=mob&&!isTab;
    if(!st.moved){st.moved=true;try{handle.setPointerCapture(e.pointerId)}catch(_){}document.body.classList.add('bitDragging');BIT.dragging=!mob;
      // start from where Bit is actually drawn (the open window may have been nudged to fit)
      if(!mob){st.dx+=BIT.adj.x;st.dy+=BIT.adj.y}
      // swing around the grab point
      PH.el=isTab?$('#bitTab'):$('#chat');
      if(!settings.calm){const r=PH.el.getBoundingClientRect(),z=UI();PH.el.style.transformOrigin=`${(e.clientX-r.left)/z}px ${(e.clientY-r.top)/z}px`}}
    const z=UI();
    if(vert){BP.my=st.my+ddy/z}else{BP.dx=st.dx+ddx/z;BP.dy=st.dy+ddy/z}
    if(!mob){const n=Math.hypot(BP.dx,BP.dy)*z<(BIT.near?SNAP_R+10:SNAP_R);if(n&&!BIT.near)sfx('pick')}
    bitPlaceSoon();
    const now=performance.now(),dt=Math.max(8,now-st.lt),vx=(e.clientX-st.lx)/dt*16;st.lx=e.clientX;st.lt=now;
    PH.t=vert?0:clamp(vx*1.1,-9,9);physKick();
    clearTimeout(PH.stopT);PH.stopT=setTimeout(()=>{PH.t=0;physKick()},90);
  });
  const end=e=>{if(!st||e.pointerId!==st.id)return;const mv=st.moved;st=null;document.body.classList.remove('bitDragging');
    PH.t=0;physKick();
    if(mv){
      const snap=BIT.dragging&&BIT.near;BIT.dragging=false;
      if(snap){BP.dx=0;BP.dy=0;sfx('place')}
      // phone: the tab is pulled to the nearest side of the screen
      const T=$('#bitTab'),side=isMob()&&isTab;let was='';
      if(side){bitPlace();was=T.style.translate;
        // computed, not measured: the tab may still be swinging
        // dx=0 is the dock at the right edge (8px), the left edge mirrors it
        const z=UI(),w=T.offsetWidth*z,cx=innerWidth-8*z-w/2+BP.dx*z;
        BP.dx=cx<innerWidth/2?(16*z+w-innerWidth)/z:0}
      bitPlace();
      if(side&&was!==T.style.translate&&!settings.calm)try{T.animate([{translate:was||'0px 0px'},{translate:T.style.translate}],{duration:320,easing:'cubic-bezier(.2,1,.3,1)'})}catch(_){}
      store.set('ll_bitpos',{dx:BP.dx,dy:BP.dy,my:BP.my},true);handle.dataset.dragged='1';setTimeout(()=>{delete handle.dataset.dragged},0)}};
  window.addEventListener('pointerup',end);window.addEventListener('pointercancel',end);
  handle.addEventListener('click',e=>{if(handle.dataset.dragged){e.stopImmediatePropagation();e.preventDefault()}},true);
}
bitDrag($('#chat .chd'),false);bitDrag($('#bitTab'),true);
$('#chat .chd').addEventListener('dblclick',e=>{if(e.target.closest('button'))return;bitDock()});
window.addEventListener('resize',bitPlaceSoon);
// the window grows while Bit types: keep it on screen
try{new ResizeObserver(()=>{if(!BIT.dragging)bitPlaceSoon()}).observe($('#chat'))}catch(e){}

// pupils follow the pointer on the small Bits (tab and menu)
let eyeRAF=0,lastMX=innerWidth/2,lastMY=innerHeight/2,lastMove=Date.now();
window.addEventListener('pointermove',e=>{lastMX=e.clientX;lastMY=e.clientY;lastMove=Date.now();if(!eyeRAF)eyeRAF=requestAnimationFrame(eyesFollow)},{passive:true});
function eyesFollow(){
  eyeRAF=0;
  for(const sv of $$('.bitsvg.track')){
    const r=sv.getBoundingClientRect();if(!r.width)continue;
    const cx=r.left+r.width*.5,cy=r.top+r.height*.42,dx=lastMX-cx,dy=lastMY-cy,d=Math.hypot(dx,dy)||1,k=Math.min(1,d/160);
    const flip=sv.classList.contains('flipx')?-1:1;
    sv.style.setProperty('--px',(dx/d*4*k*flip).toFixed(2)+'px');sv.style.setProperty('--py',(dy/d*3.4*k).toFixed(2)+'px');
  }
}
$('#bitMini').classList.add('track');
// now and then the small Bit ducks and peeks back out
(function peek(){setTimeout(()=>{const m=$('#bitMini');if(!settings.calm&&!document.body.classList.contains('bitOn')){m.classList.remove('peek');void m.getBoundingClientRect();m.classList.add('peek')}peek()},9000+Math.random()*9000)})();
