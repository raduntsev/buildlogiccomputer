s = open('src/econ.js', encoding='utf-8').read()

# render: lock items whose chapter is not reached yet
old = """${WEAR.map(w=>{const has=owned.includes(w.id),on=wear===w.id,can=balance()>=w.c;
      return `<div class="wr${on?' on':''}"><svg class="bitsvg wr-bit" viewBox="0 -4 80 100">${bitSVG('idle',w.id)}</svg><b>${tx(w.n)}</b>
       <button class="tbtn${on?'':has?' primary':''}" data-w="${w.id}" ${!has&&!can?'disabled':''}>${on?ui('takeOff'):has?ui('putOn'):ptsN(w.c)}</button></div>`}).join('')}</div></section>`;"""
assert s.count(old) == 1
new = """${WEAR.map(w=>{const has=owned.includes(w.id),on=wear===w.id,can=balance()>=w.c,unl=wearUnlocked(w);
      return `<div class="wr${on?' on':''}${unl?'':' locked'}"><svg class="bitsvg wr-bit" viewBox="0 -4 80 100">${bitSVG('idle',w.id)}</svg><b>${tx(w.n)}</b>
       ${unl?`<button class="tbtn${on?'':has?' primary':''}" data-w="${w.id}" ${!has&&!can?'disabled':''}>${on?ui('takeOff'):has?ui('putOn'):ptsN(w.c)}</button>`
        :`<span class="wr-lock">${ui('availFrom',{n:w.ch})}</span>`}</div>`}).join('')}</div></section>`;"""
s = s.replace(old, new, 1)

# click handler guard
old = "  if(!owned.includes(w.id)){\n    if(balance()<w.c){toast(ui('noFunds'));return}"
assert s.count(old) == 1
s = s.replace(old, "  if(!owned.includes(w.id)){\n    if(!wearUnlocked(w)){toast(ui('availFrom',{n:w.ch}));return}\n    if(balance()<w.c){toast(ui('noFunds'));return}", 1)

# updated hint rule text for tiered pricing
old = "  hintRule:['Подсказка в уровне стоит {a}. После трёх неудачных проверок — {b}, после шести — бесплатно.','A hint costs {a}. After three failed checks it costs {b}, after six it is free.'],"
assert s.count(old) == 1
s = s.replace(old, """  hintRule:['Подсказки идут ступенями: намёк, указание, почти решение и готовая схема — каждая дороже предыдущей. После трёх неудачных проверок цена вдвое ниже, после шести — бесплатно.','Hints come in tiers: nudge, pointer, almost-solution and a ready circuit — each costs more than the last. After three failed checks the price halves, after six it is free.'],
  availFrom:['доступно с главы {n}','available from chapter {n}'],""", 1)

open('src/econ.js', 'w', encoding='utf-8').write(s)
print('econ ok')

# css for locked items
c = open('src/style.css', encoding='utf-8').read()
c += """
/* wardrobe lock */
.wr.locked .wr-bit{opacity:.35;filter:grayscale(.6)}
.wr-lock{font-size:11px;color:var(--dim);text-align:center;line-height:1.3}
"""
open('src/style.css', 'w', encoding='utf-8').write(c)
print('css ok')
