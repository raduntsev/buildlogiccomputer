# Tiered hints (item 13/22): 4 tiers, prices scale with tier and chapter,
# tier 4 inserts a synthesised circuit. prog.hb migrates from array to object.
s = open('src/econ.js', encoding='utf-8').read()

old = """function hintBought(){return !!(level&&(prog.hb||[]).includes(level.id))}
function hintPrice(){if(!level||level.sandbox||hintUsed||hintBought())return 0;return failCount>=6?0:failCount>=3?HINT_COST/2:HINT_COST}
function hintLabel(){const c=hintPrice();return `${ui('hintAsk')}<span class="cost">${hintUsed||hintBought()?ui('hintOpen'):c?ptsN(c):ui('free')}</span>`}
function hintBtnDraw(){
  const b=$('#hintBtn');if(!b)return;const own=hintUsed||hintBought(),c=hintPrice();
  b.classList.toggle('owned',own);if(own)b.setAttribute('aria-label',ui('hintAsk')+': '+ui('hintOpen'));else b.removeAttribute('aria-label');
  b.innerHTML=own?`<span class="hk">✓</span><span class="hko">${ui('hintAsk')} · ${ui('hintOpen')}</span>`:`${ui('hintAsk')}<span class="cost">${c?ptsN(c):ui('free')}</span>`;
}"""
assert s.count(old) == 1
s = s.replace(old, """/* hints come in four tiers: nudge, pointer, almost-solution, ready circuit.
   prog.hb maps level id to the highest tier bought; the old array format migrates to tier 2. */
function hintMigrate(){if(Array.isArray(prog.hb)){const o={};prog.hb.forEach(id=>o[id]=2);prog.hb=o}}
hintMigrate();
function hintTier(){return level&&!level.sandbox?((prog.hb||{})[level.id]|0):0}
function hintMaxTier(){return level&&(level.seq||level.clk)?3:4}
function hintBought(){return hintTier()>=1}
function hintCost(t){
  if(!level||level.sandbox)return 0;
  let c=Math.round(HTIER_BASE[t]*(1+(level.ch-1)*.15)/5)*5;
  if(failCount>=6)return 0;
  if(failCount>=3)c=Math.max(5,Math.round(c/2/5)*5);
  return c;
}
function hintPrice(){const t=hintTier();if(!level||level.sandbox)return 0;if(t>=hintMaxTier())return 0;return hintCost(t+1)}
function hintLabel(){const c=hintPrice();return `${ui('hintAsk')}<span class="cost">${hintTier()>=hintMaxTier()?ui('hintOpen'):c?ptsN(c):ui('free')}</span>`}
function hintBtnDraw(){
  const b=$('#hintBtn');if(!b)return;const t=hintTier(),maxT=hintMaxTier(),own=t>=maxT,c=hintPrice();
  b.classList.toggle('owned',own);
  if(own)b.setAttribute('aria-label',ui('hintAsk')+': '+ui('hintOpen'));else b.removeAttribute('aria-label');
  b.innerHTML=own?`<span class="hk">✓</span><span class="hko">${ui('hintAsk')} · ${ui('hintOpen')}</span>`
    :(t?`<span class="hk">✓</span>`:'')+`${ui('hintAsk')}<span class="cost">${t?ui('hintTier'+Math.min(maxT,t+1))+' · ':''}${c?ptsN(c):ui('free')}</span>`;
}""", 1)

# constants
old = "const HINT_COST=40,BADGE_PTS=25,DAILY_PTS=25,DRILL_PTS=10,DRILL_CAP=150;"
assert s.count(old) == 1
s = s.replace(old, "const HINT_COST=40,BADGE_PTS=25,DAILY_PTS=25,DRILL_PTS=10,DRILL_CAP=150;\nconst HTIER_BASE=[0,15,35,70,130];", 1)

# ui strings
old = "Object.assign(UIS,{"
assert s.count(old) == 1
s = s.replace(old, """Object.assign(UIS,{
  hintTier1:['намёк','nudge'],hintTier2:['указание','pointer'],hintTier3:['почти решение','almost there'],hintTier4:['готовая схема','ready circuit'],
  hT1:['Намёк','Nudge'],hT2:['Указание','Pointer'],hT3:['Почти решение','Almost there'],hT4:['Готовая схема','Ready circuit'],
  hNeed:['Понадобится','You will need'],hInsert:['Вставить схему','Insert the circuit'],hInserted:['Схема вставлена. Можно двигать элементы и перенастраивать под себя.','The circuit is in. You can move the gates and adjust it.'],
  hNoSeq:['Для схем с памятью готового решения нет — только указания. Автоматы нужно понять, а не переписать.','No ready circuit for sequential logic — pointers only. State machines must be understood, not copied.'],
  hReplaceQ:['Вставить готовую схему вместо текущей? Текущая схема будет заменена (можно отменить через Ctrl+Z).','Insert the ready circuit instead of the current one? The current circuit will be replaced (Ctrl+Z undoes).'],
  hYes:['Вставить','Insert'],hNo:['Не надо','Cancel'],hGates:['элементов','gates'],"""
+ "\nObject.assign(UIS,{", 1)

open('src/econ.js', 'w', encoding='utf-8').write(s)
print('econ ok')
