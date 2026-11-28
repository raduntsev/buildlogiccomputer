s = open('src/econ.js', encoding='utf-8').read()

# 1. chapter requirements on wardrobe items + slight rebalance
old = """const WEAR=[
  {id:'tie',c:150,n:['Бабочка','Bow tie']},
  {id:'monocle',c:200,n:['Монокль','Monocle']},
  {id:'hat',c:250,n:['Каска','Hard hat']},
  {id:'phones',c:300,n:['Наушники','Headphones']},
  {id:'bowler',c:400,n:['Котелок','Bowler hat']},
  {id:'mortar',c:600,n:['Шапочка выпускника','Graduation cap']}
];"""
assert s.count(old) == 1
new = """const WEAR=[
  {id:'tie',c:150,ch:1,n:['Бабочка','Bow tie']},
  {id:'monocle',c:200,ch:2,n:['Монокль','Monocle']},
  {id:'hat',c:250,ch:3,n:['Каска','Hard hat']},
  {id:'phones',c:350,ch:5,n:['Наушники','Headphones']},
  {id:'bowler',c:450,ch:6,n:['Котелок','Bowler hat']},
  {id:'mortar',c:600,ch:8,n:['Шапочка выпускника','Graduation cap']}
];
function chapReached(ch){return typeof LV!=='undefined'&&LV.some(l=>l.ch===ch&&available(l))}
function wearUnlocked(w){return chapReached(w.ch||1)}"""
s = s.replace(old, new, 1)

# 2. inspect the wardrobe render markup
i = s.index('${WEAR.map(w=>{const has=owned.includes(w.id),on=wear===w.id,can=balance()>=w.c;')
print(repr(s[i:i+800]))
open('src/econ.js', 'w', encoding='utf-8').write(s)
print('ok')
