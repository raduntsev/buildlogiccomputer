p = '/mnt/d/DITK/buildlogiccomputer/src/levels.js'
s = open(p, encoding='utf-8').read()

# ---- 1. D flip-flop level -> D flip-flop with enable: a real design task (mux feeding D) ----
old = """lv({ch:4,pos:[1,6],req:[23],par:1,t:['D-триггер','D flip-flop'],f:'Q<sub>n+1</sub> = D<sub>n</sub>',ins:['D'],outs:['Q'],gates:['DFF'],clk:1,
  vec:seq([1,1,0,1,0,0,1,0].map(D=>({D})),0,(q,i)=>[{Q:q},i.D]),task:['Триггер запоминает D, когда такт C переходит из 0 в 1.','The flip-flop stores D when clock C goes from 0 to 1.'],
  hint:['Подключите C к тактовому входу триггера.','Connect C to the clock input of the flip-flop.']});"""
new = """lv({ch:4,pos:[1,6],req:[23],par:5,t:['D-триггер с разрешением','D flip-flop with enable'],f:'Q<sub>n+1</sub> = ED<sub>n</sub> ∨ '+ov('E')+'Q<sub>n</sub>',ins:['D','E'],outs:['Q'],gates:['DFF','AND','OR','NOT','NAND'],clk:1,
  vec:seq([[1,1],[0,1],[1,0],[1,1],[0,0],[0,1],[1,0],[0,0]].map(([D,E])=>({D,E})),0,(q,i)=>[{Q:q},i.E?i.D:q]),task:['Триггер записывает D, только когда E = 1. При E = 0 лампа держит прежнее значение, что бы ни происходило на D.','The flip-flop stores D only while E = 1. With E = 0 the lamp keeps its previous value whatever D does.'],
  hint:['На вход D триггера подаётся выбор: E ? D : Q. Это мультиплексор из И-ИЛИ-НЕ: E·D + Ē·Q.','The flip-flop’s D input is a choice: E ? D : Q. That is a multiplexer built from AND-OR-NOT: E·D + Ē·Q.']});"""
assert s.count(old) == 1
s = s.replace(old, new, 1)

# ---- 2. frequency divider -> divide by 4: two cascaded synchronous stages ----
old = """lv({ch:4,pos:[2,6],req:[24],par:1,t:['Делитель частоты','Frequency divider'],f:'Q<sub>n+1</sub> = '+ov('Q<sub>n</sub>'),ins:[],outs:['Q'],gates:['DFF','NOT'],clk:1,
  vec:seq(T(6),0,(q)=>[{Q:q},1-q]),task:['Выход переключается на каждом такте.','The output toggles on every clock tick.'],
  hint:['Подайте инверсный выход триггера на его же вход D.','Feed the inverted output back into its own D input.']});"""
new = """lv({ch:4,pos:[2,6],req:[24],par:4,t:['Делитель частоты на 4','Divide-by-4 frequency divider'],f:'Y переключается раз в два такта',ins:[],outs:['Y'],gates:['DFF','NOT','XOR','AND'],clk:1,
  vec:seq(T(12),[0,0],(s)=>[{Y:s[1]},[1-s[0],s[0]^s[1]]]),task:['Один такт — слишком быстро. Нужен сигнал, который меняется лишь раз в два такта: полный период за четыре. Первый триггер переключается каждый такт, второй — только когда первый равен 1.','One tick is too fast. We need a signal that changes only every other tick: a full period in four. The first flip-flop toggles every tick, the second only while the first is 1.'],
  hint:['Два триггера. Первый — делитель на два: D₁ = ¬Q₁. Второй переключается, когда Q₁ = 1: D₂ = Q₁ ⊕ Q₂. Выход Y — это Q₂.','Two flip-flops. The first divides by two: D₁ = ¬Q₁. The second toggles when Q₁ = 1: D₂ = Q₁ ⊕ Q₂. Output Y is Q₂.']});"""
assert s.count(old) == 1
s = s.replace(old, new, 1)

# ---- 3. controlled inverter -> 2-bit controlled inversion bus ----
old = """lv({ch:8,pos:[0,14],req:['q7'],par:1,t:['Управляемый инвертор','Controlled inverter'],f:'Y = A ⊕ M',ins:['A','M'],gates:['AND','OR','NOT','XOR'],
  vec:comb(['A','M'],i=>({Y:i.A^i.M})),task:['При M = 0 сигнал проходит как есть, при M = 1 — инвертируется.','With M = 0 the signal passes unchanged; with M = 1 it is inverted.'],
  hint:['Исключающее ИЛИ и есть управляемый инвертор.','XOR is a controlled inverter.']});"""
new = """lv({ch:8,pos:[0,14],req:['q7'],par:2,t:['Управляемый инвертор шины','Controlled bus inverter'],f:'Y₁ = A₁ ⊕ M'+SEP+'Y₀ = A₀ ⊕ M',ins:['A1','A0','M'],outs:['Y1','Y0'],gates:['AND','OR','NOT','XOR'],
  vec:comb(['A1','A0','M'],i=>({Y1:i.A1^i.M,Y0:i.A0^i.M})),task:['Двухбитная шина: при M = 0 оба разряда проходят как есть, при M = 1 — инвертируются. Это первый шаг к вычитанию.','A two-bit bus: with M = 0 both bits pass unchanged, with M = 1 both are inverted. This is the first step towards subtraction.'],
  hint:['Один управляющий сигнал M идёт на оба XOR — по одному на разряд.','One control signal M feeds both XORs, one per bit.']});"""
assert s.count(old) == 1
s = s.replace(old, new, 1)

open(p, 'w', encoding='utf-8').write(s)
print('levels ok')
