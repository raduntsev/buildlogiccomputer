s = open('/mnt/d/DITK/buildlogiccomputer/src/levels.js', encoding='utf-8').read()

# --- level 1: permutation wiring puzzle (was: single wire) ---
old = """lv({ch:1,pos:[0,0],req:[],par:0,t:['Провод','Wire'],f:'Y = A',ins:['A'],vec:comb(['A'],i=>({Y:i.A})),
  task:['Сигнал должен дойти от входа до лампы.','The signal must travel from the input to the lamp.'],
  hint:['Потяните от точки на флажке A к лампе Y.','Drag from the dot on flag A to lamp Y.']});"""
assert s.count(old) == 1
s = s.replace(old, """lv({ch:1,pos:[0,0],req:[],par:0,outs:['X','Y','Z'],t:['Перепутанные провода','Mixed-up wires'],f:'X = B'+SEP+'Y = C'+SEP+'Z = A',ins:['A','B','C'],vec:comb(['A','B','C'],i=>({X:i.B,Y:i.C,Z:i.A})),
  task:['Монтажник перепутал все три провода. К каждой лампе должен идти свой сигнал: X ← B, Y ← C, Z ← A.','The wiring technician mixed up all three lines. Each lamp needs its own signal: X ← B, Y ← C, Z ← A.'],
  hint:['Тяните от точки на флажке к нужной лампе. Провода могут пересекаться — это нормально.','Drag from the dot on a flag to the right lamp. Wires may cross — that is fine.']});""", 1)

# --- level 2: double inversion (was: single NOT) ---
old = """lv({ch:1,pos:[1,0],req:[1],par:1,t:['Инверсия','Inversion'],f:'Y = '+ov('A'),ins:['A'],gates:['NOT'],vec:comb(['A'],i=>({Y:1-i.A})),
  task:['Лампа горит, когда на входе ноль.','The lamp is lit when the input is zero.'],
  hint:['Элемент НЕ переворачивает сигнал: 0 → 1, 1 → 0.','A NOT gate flips the signal: 0 → 1, 1 → 0.']});"""
assert s.count(old) == 1
s = s.replace(old, """lv({ch:1,pos:[1,0],req:[1],par:2,outs:['X','Y'],t:['Инверсия','Inversion'],f:'X = '+ov('A')+SEP+'Y = '+ov('B'),ins:['A','B'],gates:['NOT'],vec:comb(['A','B'],i=>({X:1-i.A,Y:1-i.B})),
  task:['Обе лампы перепутаны с точностью до наоборот: каждая должна гореть, когда её вход погашен.','Both lamps are exactly backwards: each must light when its input is dark.'],
  hint:['Элемент НЕ переворачивает сигнал: 0 → 1, 1 → 0. Одного типа элемента может быть несколько на схеме.','A NOT gate flips the signal: 0 → 1, 1 → 0. A circuit can hold several gates of the same type.']});""", 1)

# --- level 3: inhibit, A and not B (was: bare AND) ---
old = """lv({ch:1,pos:[2,0],req:[2],par:1,t:['Конъюнкция','Conjunction'],f:'Y = A ∧ B',ins:['A','B'],gates:['AND'],vec:comb(['A','B'],i=>({Y:i.A&i.B})),
  task:['Лампа горит, только когда включены оба входа.','The lamp is lit only when both inputs are on.'],
  hint:['Элемент И даёт 1, только если на всех входах 1.','AND outputs 1 only when every input is 1.']});"""
assert s.count(old) == 1
s = s.replace(old, """lv({ch:1,pos:[2,0],req:[2],par:2,t:['Запрет','Inhibit'],f:'Y = A ∧ '+ov('B'),ins:['A','B'],gates:['AND','NOT'],vec:comb(['A','B'],i=>({Y:i.A&(1-i.B)})),
  task:['Сигнал A должен проходить к лампе, но только когда блокировка B отпущена. Горячий вход B запрещает всё.','Signal A must reach the lamp, but only while the inhibit line B is released. A hot B forbids everything.'],
  hint:['Элемент И даёт 1, только если на всех входах 1. Один из входов придётся перевернуть.','AND outputs 1 only when every input is 1. One of the inputs will have to be flipped.']});""", 1)

# --- level 4: implication (was: bare OR) ---
old = """lv({ch:1,pos:[2,1],req:[2],par:1,t:['Дизъюнкция','Disjunction'],f:'Y = A ∨ B',ins:['A','B'],gates:['OR'],vec:comb(['A','B'],i=>({Y:i.A|i.B})),
  task:['Лампа горит, если включён хотя бы один вход.','The lamp is lit if at least one input is on.'],
  hint:['Элемент ИЛИ даёт 1, если хотя бы на одном входе 1.','OR outputs 1 if any input is 1.']});"""
assert s.count(old) == 1
s = s.replace(old, """lv({ch:1,pos:[2,1],req:[2],par:2,t:['Импликация','Implication'],f:'Y = '+ov('A')+' ∨ B',ins:['A','B'],gates:['OR','NOT'],vec:comb(['A','B'],i=>({Y:(1-i.A)|i.B})),
  task:['Лампа дублирует вход B, но когда A погашен, она горит всегда. Гаснуть она может только вместе с A — и лишь когда B темно.','The lamp follows input B, but while A is dark it is always lit. It may only go dark together with A — and only when B is dark.'],
  hint:['Элемент ИЛИ даёт 1, если хоть на одном входе 1. Здесь один вход поступает напрямую, а второй — через инвертор.','OR outputs 1 if any input is 1. Here one input goes straight, the other through an inverter.']});""", 1)

# --- update h1 nudges for the new first levels ---
old = """LV[0].h1=['Соедините вход с лампой напрямую.','Connect the input straight to the lamp.'];
LV[1].h1=['Лампа должна гореть, когда вход погашен. Нужен элемент, который переворачивает сигнал.','The lamp must light when the input is dark. You need a gate that flips the signal.'];
LV[2].h1=['Лампа горит, только когда оба входа горят вместе.','The lamp lights only when both inputs are on together.'];
LV[3].h1=['Лампа гаснет, только когда оба входа погашены.','The lamp goes dark only when both inputs are dark.'];"""
assert s.count(old) == 1
s = s.replace(old, """LV[0].h1=['Проводов три, и каждый идёт не к своей лампе. Начните с любого флажка и найдите его лампу по таблице.','There are three wires, each going to the wrong lamp. Start with any flag and find its lamp in the table.'];
LV[1].h1=['Понадобятся два одинаковых элемента — по одному на каждую лампу.','You will need two identical gates — one per lamp.'];
LV[2].h1=['Сигнал B должен запрещать, значит, на элемент И он должен прийти перевёрнутым.','B must forbid, so it has to reach the AND gate flipped.'];
LV[3].h1=['Лампа гаснет только в одной строке таблицы. Посмотрите, какой вход в этой строке единственный горит.','The lamp is dark in exactly one row. Look at which input is the only lit one in that row.'];""", 1)

# --- rewrite hist notes for levels 1-4 to match the new content ---
import re
for lid, txt in {
 1: ['В первых компьютерах — Z3 (1941) и ENIAC (1945) — программу задавали буквально проводами: переставил шнур на панели — получил другую машину.',
     'In the first computers — the Z3 (1941) and ENIAC (1945) — programs were literally wired: move a cable on the panel and you get a different machine.'],
 2: ['Инвертор — самый простой вентиль: на одном транзисторе. Релейные инверторы работали в машине Конрада Цузе Z3 ещё в 1941 году.',
     'The inverter is the simplest gate: a single transistor. Relay inverters were already clicking inside Konrad Zuse’s Z3 in 1941.'],
 3: ['Связку «A и не B» называют запретом (inhibit): в микросхемах она встречается так часто, что выпускали готовые элементы с инверсией одного входа.',
     'The “A and not B” pattern is called inhibit: it is so common in hardware that chips with one pre-inverted input were sold as standard parts.'],
 4: ['«Если A, то B» в схемах — это ¬A ∨ B. Материальную импликацию формализовали ещё в «Principia Mathematica» Уайтхеда и Рассела (1910).',
     '“If A then B” in circuits is ¬A ∨ B. Material implication was formalized back in Whitehead and Russell’s Principia Mathematica (1910).'],
}.items():
    ru = txt[0].replace("'", "\\'")
    en = txt[1].replace("'", "\\'")
    pat = re.compile(r"LV\[" + str(lid-1) + r"\]\.hist=\[[^\n]*\];")
    assert pat.search(s), lid
    s = pat.sub(f"LV[{lid-1}].hist=['{ru}','{en}'];", s)

open('/mnt/d/DITK/buildlogiccomputer/src/levels.js', 'w', encoding='utf-8').write(s)
print('levels ok')
