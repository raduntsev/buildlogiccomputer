/* ========== levels ========== */
// Every text field is [ru, en]. tx() picks the current language.
// req: level ids or 'qN' (chapter N test passed). par: reference element count (3rd star).
// max: hard limit on elements (challenge levels).
const LV=[];
function comb(ins,fn){const n=ins.length,v=[];for(let m=0;m<1<<n;m++){const i={};ins.forEach((k,j)=>i[k]=(m>>(n-1-j))&1);v.push({in:i,out:fn(i)})}return v}
function seq(rows,init,step){let s=init;return rows.map(r=>{const [o,n]=step(s,r);s=n;return{in:r,out:o}})}
const B=x=>x?1:0;
const SEP='<span class="sep"></span>';
// what each output lamp means (hover); level.od overrides by name
const OUTD={Y:['результат схемы','circuit result'],S:['сумма','sum'],P:['перенос в старший разряд','carry out'],Co:['перенос в старший разряд','carry out'],
  D:['разность','difference'],E:['1, если числа равны','1 when the numbers are equal'],G:['1, если A больше B','1 when A is greater than B'],
  '>':['A больше B','A is greater than B'],'=':['A равно B','A equals B'],'<':['A меньше B','A is less than B'],
  Q:['состояние триггера','stored bit'],V:['1, если хоть один вход активен','1 when any input is active']};
function outDesc(lv,k){if(lv&&lv.od&&k in lv.od)return lv.od[k];if(OUTD[k])return OUTD[k];
  const m=/^([QYSA])(\d)$/.exec(k);if(m)return {Q:['разряд %',"bit %"],Y:['выход %','output %'],S:['разряд суммы %','sum bit %'],A:['разряд кода %','code bit %']}[m[1]].map(t=>t.replace('%',m[2]));
  if(/^[a-g]$/.test(k))return['сегмент '+k,'segment '+k];return null}
const sb=s=>s.replace(/([A-Za-zА-Яа-я])(\d)/g,'$1<sub>$2</sub>');
function lv(o){o.id=LV.length+1;o.outs=o.outs||['Y'];o.gates=o.gates||[];LV.push(o)}
const T=n=>Array(n).fill(0).map(()=>({}));

/* ---------- 1. Основы / Basics ---------- */
lv({ch:1,pos:[0,0],req:[],par:0,outs:['X','Y','Z'],t:['Перепутанные провода','Mixed-up wires'],f:'X = B'+SEP+'Y = C'+SEP+'Z = A',ins:['A','B','C'],vec:comb(['A','B','C'],i=>({X:i.B,Y:i.C,Z:i.A})),
  task:['Монтажник перепутал все три провода. К каждой лампе должен идти свой сигнал: X ← B, Y ← C, Z ← A.','The wiring technician mixed up all three lines. Each lamp needs its own signal: X ← B, Y ← C, Z ← A.'],
  hint:['Тяните от точки на флажке к нужной лампе. Провода могут пересекаться — это нормально.','Drag from the dot on a flag to the right lamp. Wires may cross — that is fine.']});
lv({ch:1,pos:[1,0],req:[1],par:2,outs:['X','Y'],t:['Инверсия','Inversion'],f:'X = '+ov('A')+SEP+'Y = '+ov('B'),ins:['A','B'],gates:['NOT'],vec:comb(['A','B'],i=>({X:1-i.A,Y:1-i.B})),
  task:['Обе лампы перепутаны с точностью до наоборот: каждая должна гореть, когда её вход погашен.','Both lamps are exactly backwards: each must light when its input is dark.'],
  hint:['Элемент НЕ переворачивает сигнал: 0 → 1, 1 → 0. Одного типа элемента может быть несколько на схеме.','A NOT gate flips the signal: 0 → 1, 1 → 0. A circuit can hold several gates of the same type.']});
lv({ch:1,pos:[2,0],req:[2],par:2,t:['Запрет','Inhibit'],f:'Y = A ∧ '+ov('B'),ins:['A','B'],gates:['AND','NOT'],vec:comb(['A','B'],i=>({Y:i.A&(1-i.B)})),
  task:['Сигнал A должен проходить к лампе, но только когда блокировка B отпущена. Горячий вход B запрещает всё.','Signal A must reach the lamp, but only while the inhibit line B is released. A hot B forbids everything.'],
  hint:['Элемент И даёт 1, только если на всех входах 1. Один из входов придётся перевернуть.','AND outputs 1 only when every input is 1. One of the inputs will have to be flipped.']});
lv({ch:1,pos:[2,1],req:[2],par:2,t:['Импликация','Implication'],f:'Y = '+ov('A')+' ∨ B',ins:['A','B'],gates:['OR','NOT'],vec:comb(['A','B'],i=>({Y:(1-i.A)|i.B})),
  task:['Лампа дублирует вход B, но когда A погашен, она горит всегда. Гаснуть она может только вместе с A — и лишь когда B темно.','The lamp follows input B, but while A is dark it is always lit. It may only go dark together with A — and only when B is dark.'],
  hint:['Элемент ИЛИ даёт 1, если хоть на одном входе 1. Здесь один вход поступает напрямую, а второй — через инвертор.','OR outputs 1 if any input is 1. Here one input goes straight, the other through an inverter.']});
lv({ch:1,pos:[3,0],req:[3],par:2,t:['Штрих Шеффера','Sheffer stroke'],f:'Y = '+ov('A ∧ B'),ins:['A','B'],gates:['AND','NOT'],vec:comb(['A','B'],i=>({Y:1-(i.A&i.B)})),
  task:['Соберите И-НЕ из двух элементов.','Build NAND out of two gates.'],
  hint:['Поставьте НЕ после И.','Put a NOT after the AND.']});
lv({ch:1,pos:[3,1],req:[4],par:2,t:['Стрелка Пирса','Peirce arrow'],f:'Y = '+ov('A ∨ B'),ins:['A','B'],gates:['OR','NOT'],vec:comb(['A','B'],i=>({Y:1-(i.A|i.B)})),
  task:['Соберите ИЛИ-НЕ из двух элементов.','Build NOR out of two gates.'],
  hint:['Поставьте НЕ после ИЛИ.','Put a NOT after the OR.']});
lv({ch:1,pos:[4,0],req:[5,6],par:3,t:['Исключающее ИЛИ','Exclusive OR'],f:'Y = A ⊕ B',ins:['A','B'],gates:['AND','OR','NOT','NAND'],vec:comb(['A','B'],i=>({Y:i.A^i.B})),
  task:['Лампа горит, когда входы различаются.','The lamp is lit when the inputs differ.'],
  hint:['A ⊕ B = (A ∨ B) ∧ '+ov('A ∧ B'),'A ⊕ B = (A ∨ B) ∧ '+ov('A ∧ B')]});
lv({ch:1,pos:[5,0],req:[7],par:2,t:['Равнозначность','Equivalence'],f:'Y = '+ov('A ⊕ B'),ins:['A','B'],gates:['AND','OR','NOT','XOR'],vec:comb(['A','B'],i=>({Y:1-(i.A^i.B)})),
  task:['Лампа горит, когда входы совпадают.','The lamp is lit when the inputs match.'],
  hint:['Это исключающее ИЛИ с инверсией на выходе.','It is XOR with an inverted output.']});

/* ---------- 2. Универсальный элемент / The universal gate ---------- */
lv({ch:2,pos:[0,2],req:['q1'],par:1,t:['НЕ из И-НЕ','NOT from NAND'],f:'Y = '+ov('A'),ins:['A'],gates:['NAND'],vec:comb(['A'],i=>({Y:1-i.A})),
  task:['Есть только И-НЕ. Получите инверсию.','Only NAND is available. Make an inverter.'],
  hint:['Подайте A сразу на оба входа И-НЕ — ответвите провод.','Feed A into both NAND inputs: branch the wire.']});
lv({ch:2,pos:[1,2],req:[9],par:2,t:['И из И-НЕ','AND from NAND'],f:'Y = A ∧ B',ins:['A','B'],gates:['NAND'],vec:comb(['A','B'],i=>({Y:i.A&i.B})),
  task:['Только И-НЕ. Получите И.','NAND only. Make AND.'],
  hint:['И-НЕ, а за ним ещё одно И-НЕ в роли инвертора.','A NAND followed by another NAND used as an inverter.']});
lv({ch:2,pos:[1,3],req:[9],par:3,t:['ИЛИ из И-НЕ','OR from NAND'],f:'Y = A ∨ B',ins:['A','B'],gates:['NAND'],vec:comb(['A','B'],i=>({Y:i.A|i.B})),
  task:['Только И-НЕ. Получите ИЛИ.','NAND only. Make OR.'],
  hint:['Закон де Моргана: A ∨ B = '+ov(ov('A')+' ∧ '+ov('B')),'De Morgan: A ∨ B = '+ov(ov('A')+' ∧ '+ov('B'))]});
lv({ch:2,pos:[2,2],req:[10,11],par:4,t:['XOR из И-НЕ','XOR from NAND'],f:'Y = A ⊕ B',ins:['A','B'],gates:['NAND'],vec:comb(['A','B'],i=>({Y:i.A^i.B})),
  task:['Только И-НЕ. Уложитесь в четыре элемента.','NAND only. Use no more than four gates.'],
  hint:['Выход первого И-НЕ(A, B) раздайте трём остальным.','Share the output of the first NAND(A, B) with the other three.']});
lv({ch:2,pos:[2,3],req:[11],par:2,t:['Три входа','Three inputs'],f:'Y = A ∧ B ∧ C',ins:['A','B','C'],gates:['AND'],vec:comb(['A','B','C'],i=>({Y:i.A&i.B&i.C})),
  task:['Лампа горит, только когда включены все три входа.','The lamp is lit only when all three inputs are on.'],
  hint:['Двухвходовые элементы соединяются цепочкой.','Chain two-input gates.']});
lv({ch:2,pos:[3,3],req:[13],par:5,t:['Большинство','Majority'],f:'Y = AB ∨ BC ∨ AC',ins:['A','B','C'],gates:['AND','OR'],vec:comb(['A','B','C'],i=>({Y:B(i.A+i.B+i.C>=2)})),
  task:['Лампа горит, если включены хотя бы два входа из трёх.','The lamp is lit if at least two of three inputs are on.'],
  hint:['Три И для каждой пары, затем два ИЛИ.','Three ANDs, one per pair, then two ORs.']});
lv({ch:2,pos:[3,2],req:[12],par:2,t:['Чётность','Parity'],f:'Y = A ⊕ B ⊕ C',ins:['A','B','C'],gates:['XOR'],vec:comb(['A','B','C'],i=>({Y:i.A^i.B^i.C})),
  task:['Лампа горит при нечётном числе единиц.','The lamp is lit for an odd number of ones.'],
  hint:['Два исключающих ИЛИ цепочкой.','Two XORs in a chain.']});

/* ---------- 3. Арифметика и выбор / Arithmetic and selection ---------- */
lv({ch:3,pos:[0,4],req:['q2'],par:2,t:['Полусумматор','Half adder'],f:['S = A ⊕ B'+SEP+'P = A ∧ B','S = A ⊕ B'+SEP+'Co = A ∧ B'],ins:['A','B'],outs:['S','P'],dl:{P:'Co'},gates:['AND','OR','NOT','XOR'],
  vec:comb(['A','B'],i=>({S:i.A^i.B,P:i.A&i.B})),task:['Сложите два бита: S — сумма, P — перенос.','Add two bits: S is the sum, Co is the carry.'],
  hint:['Один провод можно развести на два элемента.','One wire can feed two gates.']});
lv({ch:3,pos:[1,4],req:[16],par:5,t:['Полный сумматор','Full adder'],f:['S = A ⊕ B ⊕ C'+SEP+'P = AB ∨ C(A ⊕ B)','S = A ⊕ B ⊕ C'+SEP+'Co = AB ∨ C(A ⊕ B)'],ins:['A','B','C'],outs:['S','P'],dl:{P:'Co'},gates:['AND','OR','NOT','XOR'],
  vec:comb(['A','B','C'],i=>({S:i.A^i.B^i.C,P:B(i.A+i.B+i.C>=2)})),task:['Сложите три бита: C — перенос из младшего разряда.','Add three bits: C is the carry from the lower digit.'],
  hint:['Два полусумматора и ИЛИ для их переносов.','Two half adders and an OR for their carries.']});
lv({ch:3,pos:[1,5],req:[16],par:4,t:['Мультиплексор','Multiplexer'],f:'Y = '+ov('S')+'A ∨ SB',ins:['A','B','S'],gates:['AND','OR','NOT','NAND'],
  vec:comb(['A','B','S'],i=>({Y:i.S?i.B:i.A})),task:['S выбирает, что пройдёт на выход: при S = 0 — A, при S = 1 — B.','S selects the output: A when S = 0, B when S = 1.'],
  hint:['Два И как «ворота», S открывает одни, '+ov('S')+' — другие.','Two ANDs act as gates: S opens one, '+ov('S')+' opens the other.']});
lv({ch:3,pos:[2,5],req:[18],par:3,t:['Демультиплексор','Demultiplexer'],f:'Y<sub>0</sub> = D'+ov('S')+SEP+'Y<sub>1</sub> = DS',ins:['D','S'],outs:['Y0','Y1'],gates:['AND','OR','NOT','NAND'],
  vec:comb(['D','S'],i=>({Y0:i.D&(1-i.S),Y1:i.D&i.S})),task:['S направляет сигнал D на одну из двух ламп.','S routes signal D to one of two lamps.'],
  hint:['Это мультиплексор наоборот.','It is a multiplexer in reverse.']});
lv({ch:3,pos:[3,5],req:[19],par:6,t:['Дешифратор','Decoder'],f:['Y<sub>k</sub> = 1 при A<sub>1</sub>A<sub>0</sub> = k','Y<sub>k</sub> = 1 when A<sub>1</sub>A<sub>0</sub> = k'],ins:['A1','A0'],outs:['Y0','Y1','Y2','Y3'],gates:['AND','NOT','NOR','NAND'],
  vec:comb(['A1','A0'],i=>{const k=i.A1*2+i.A0,o={};for(let j=0;j<4;j++)o['Y'+j]=B(k===j);return o}),task:['Двоичный код на входе зажигает одну лампу из четырёх.','A binary code lights exactly one lamp of four.'],
  hint:['Y<sub>0</sub> = '+ov('A<sub>1</sub>')+' ∧ '+ov('A<sub>0</sub>')+', дальше по аналогии.','Y<sub>0</sub> = '+ov('A<sub>1</sub>')+' ∧ '+ov('A<sub>0</sub>')+', and so on.']});
lv({ch:3,pos:[2,4],req:[17],par:7,t:['Двухбитный сумматор','2-bit adder'],f:'A<sub>1</sub>A<sub>0</sub> + B<sub>1</sub>B<sub>0</sub> = PS<sub>1</sub>S<sub>0</sub>',ins:['A1','A0','B1','B0'],outs:['P','S1','S0'],dl:{P:'Co'},gates:['AND','OR','NOT','XOR','NAND'],
  vec:comb(['A1','A0','B1','B0'],i=>{const s=i.A1*2+i.A0+i.B1*2+i.B0;return{P:(s>>2)&1,S1:(s>>1)&1,S0:s&1}}),task:['Сложите два двухбитных числа.','Add two 2-bit numbers.'],
  hint:['Полусумматор для младшего разряда, полный — для старшего.','A half adder for the low digit, a full adder for the high one.']});
lv({ch:3,pos:[3,4],req:[21],par:5,t:['Компаратор','Comparator'],f:'&gt; : A'+ov('B')+SEP+'= : '+ov('A ⊕ B')+SEP+'&lt; : '+ov('A')+'B',ins:['A','B'],outs:['>','=','<'],gates:['AND','NOT','XOR','XNOR','NOR'],
  vec:comb(['A','B'],i=>({'>':B(i.A>i.B),'=':B(i.A===i.B),'<':B(i.A<i.B)})),task:['Сравните два бита и зажгите нужную лампу.','Compare two bits and light the right lamp.'],
  hint:['Лампа «=» — это равнозначность.','The “=” lamp is plain equivalence.']});

/* ---------- 4. Память и такт / Memory and clock ---------- */
lv({ch:4,pos:[0,6],req:['q3'],par:2,t:['RS-триггер','SR latch'],f:'Q<sub>n+1</sub> = S ∨ '+ov('R')+'Q<sub>n</sub>',ins:['S','R'],outs:['Q'],gates:['NOR','NAND','NOT','OR','AND'],seq:1,
  vec:seq([[1,0],[0,0],[0,1],[0,0],[1,0],[0,0],[0,1],[0,0]].map(([S,R])=>({S,R})),0,(q,i)=>{const n=i.S?1:i.R?0:q;return[{Q:n},n]}),
  task:['Память на один бит: S запоминает 1, R сбрасывает в 0. Когда оба входа 0, лампа держит последнее значение.','One bit of memory: S stores 1, R resets to 0. With both inputs at 0 the lamp keeps its last value.'],
  hint:['Два ИЛИ-НЕ, выход каждого — на вход другого.','Two NORs, each output feeding the other.']});
lv({ch:4,pos:[1,6],req:[23],par:1,t:['D-триггер','D flip-flop'],f:'Q<sub>n+1</sub> = D<sub>n</sub>',ins:['D'],outs:['Q'],gates:['DFF'],clk:1,
  vec:seq([1,1,0,1,0,0,1,0].map(D=>({D})),0,(q,i)=>[{Q:q},i.D]),task:['Триггер запоминает D, когда такт C переходит из 0 в 1.','The flip-flop stores D when clock C goes from 0 to 1.'],
  hint:['Подключите C к тактовому входу триггера.','Connect C to the clock input of the flip-flop.']});
lv({ch:4,pos:[2,6],req:[24],par:1,t:['Делитель частоты','Frequency divider'],f:'Q<sub>n+1</sub> = '+ov('Q<sub>n</sub>'),ins:[],outs:['Q'],gates:['DFF','NOT'],clk:1,
  vec:seq(T(6),0,(q)=>[{Q:q},1-q]),task:['Выход переключается на каждом такте.','The output toggles on every clock tick.'],
  hint:['Подайте инверсный выход триггера на его же вход D.','Feed the inverted output back into its own D input.']});
lv({ch:4,pos:[3,6],req:[25],par:3,t:['Счётчик','Counter'],f:'Q<sub>1</sub>Q<sub>0</sub>: 00 → 01 → 10 → 11',ins:[],outs:['Q1','Q0'],gates:['DFF','NOT','XOR','AND'],clk:1,
  vec:seq(T(8),0,(s)=>[{Q1:(s>>1)&1,Q0:s&1},(s+1)&3]),task:['Двоичный счёт тактов от 0 до 3.','Count clock ticks in binary from 0 to 3.'],
  hint:['Младший разряд — делитель. Старший: D<sub>1</sub> = Q<sub>1</sub> ⊕ Q<sub>0</sub>.','The low bit is a divider. High bit: D<sub>1</sub> = Q<sub>1</sub> ⊕ Q<sub>0</sub>.']});
lv({ch:4,pos:[2,7],req:[24],par:2,t:['Сдвиговый регистр','Shift register'],f:'Q<sub>1</sub> ← D'+SEP+'Q<sub>2</sub> ← Q<sub>1</sub>',ins:['D'],outs:['Q1','Q2'],gates:['DFF'],clk:1,
  vec:seq([1,0,1,1,0,0,1,0].map(D=>({D})),[0,0],(s,i)=>[{Q1:s[0],Q2:s[1]},[i.D,s[0]]]),task:['Бит продвигается по цепочке на одну ячейку за такт.','A bit moves one cell along the chain per tick.'],
  hint:['Два триггера цепочкой с общим тактом.','Two flip-flops in a chain sharing the clock.']});
lv({ch:4,pos:[3,7],req:[27],par:3,od:{Y:['импульс на фронте сигнала','pulse on the rising edge']},t:['Детектор фронта','Edge detector'],f:'Y = A<sub>n</sub> ∧ '+ov('A<sub>n−1</sub>'),ins:['A'],outs:['Y'],gates:['DFF','AND','NOT','NOR'],clk:1,
  vec:seq([0,1,1,0,1,0,0,1].map(A=>({A})),0,(p,i)=>[{Y:i.A&(1-p)},i.A]),task:['Лампа вспыхивает на один такт, когда A меняется с 0 на 1.','The lamp flashes for one tick when A goes from 0 to 1.'],
  hint:['Триггер помнит прошлое значение A.','A flip-flop remembers the previous value of A.']});

/* ---------- 5. Вычитание и кодирование / Subtraction and codes ---------- */
lv({ch:5,pos:[0,8],req:['q4'],par:3,od:{Z:['заём из старшего разряда','borrow out']},t:['Полувычитатель','Half subtractor'],f:['D = A ⊕ B'+SEP+'Z = '+ov('A')+'B','D = A ⊕ B'+SEP+'Bo = '+ov('A')+'B'],ins:['A','B'],outs:['D','Z'],dl:{Z:'Bo'},gates:['AND','OR','NOT','XOR'],
  vec:comb(['A','B'],i=>({D:i.A^i.B,Z:(1-i.A)&i.B})),task:['Вычтите B из A: D — разность, Z — заём из старшего разряда.','Subtract B from A: D is the difference, Bo is the borrow.'],
  hint:['Почти полусумматор, только A перед И инвертируется.','Almost a half adder, but A is inverted before the AND.']});
lv({ch:5,pos:[1,8],req:[29],par:7,od:{Z:['заём из старшего разряда','borrow out']},t:['Полный вычитатель','Full subtractor'],f:['D = A ⊕ B ⊕ C'+SEP+'Z = '+ov('A')+'B ∨ '+ov('A ⊕ B')+'C','D = A ⊕ B ⊕ C'+SEP+'Bo = '+ov('A')+'B ∨ '+ov('A ⊕ B')+'C'],ins:['A','B','C'],outs:['D','Z'],dl:{Z:'Bo'},gates:['AND','OR','NOT','XOR','XNOR'],
  vec:comb(['A','B','C'],i=>{const r=i.A-i.B-i.C;return{D:r&1,Z:B(r<0)}}),task:['Вычтите B и заём C из A.','Subtract B and borrow C from A.'],
  hint:['Два полувычитателя и ИЛИ для заёмов.','Two half subtractors and an OR for the borrows.']});
lv({ch:5,pos:[2,8],req:[30],par:3,t:['Равенство чисел','Equal numbers'],f:['E = 1 при A<sub>1</sub>A<sub>0</sub> = B<sub>1</sub>B<sub>0</sub>','E = 1 when A<sub>1</sub>A<sub>0</sub> = B<sub>1</sub>B<sub>0</sub>'],ins:['A1','A0','B1','B0'],outs:['E'],gates:['AND','OR','XOR','XNOR','NOR','NOT'],
  vec:comb(['A1','A0','B1','B0'],i=>({E:B(i.A1===i.B1&&i.A0===i.B0)})),task:['Лампа горит, когда два двухбитных числа равны.','The lamp is lit when two 2-bit numbers are equal.'],
  hint:['Сравните разряды попарно, затем объедините через И.','Compare the digits pairwise, then combine with AND.']});
lv({ch:5,pos:[0,9],req:['q4'],par:11,t:['Мультиплексор 4:1','4:1 multiplexer'],f:['Y = D<sub>k</sub>, где k = S<sub>1</sub>S<sub>0</sub>','Y = D<sub>k</sub>, where k = S<sub>1</sub>S<sub>0</sub>'],ins:['S1','S0','D0','D1','D2','D3'],gates:['AND','OR','NOT','NAND','NOR'],
  vec:comb(['S1','S0','D0','D1','D2','D3'],i=>({Y:i['D'+(i.S1*2+i.S0)]})),task:['Адрес S<sub>1</sub>S<sub>0</sub> выбирает один из четырёх входов данных.','Address S<sub>1</sub>S<sub>0</sub> selects one of four data inputs.'],
  hint:['Три мультиплексора 2:1: два по S<sub>0</sub>, третий по S<sub>1</sub>.','Three 2:1 multiplexers: two on S<sub>0</sub>, one on S<sub>1</sub>.']});
lv({ch:5,pos:[1,9],req:[32],par:7,t:['Приоритетный шифратор','Priority encoder'],f:['A<sub>1</sub>A<sub>0</sub> = номер старшей единицы'+SEP+'V = есть ли она','A<sub>1</sub>A<sub>0</sub> = index of the highest one'+SEP+'V = any one at all'],ins:['D3','D2','D1','D0'],outs:['A1','A0','V'],gates:['AND','OR','NOT','NOR'],
  vec:comb(['D3','D2','D1','D0'],i=>{const k=i.D3?3:i.D2?2:i.D1?1:i.D0?0:-1;return k<0?{A1:0,A0:0,V:0}:{A1:k>>1,A0:k&1,V:1}}),task:['Выдайте двоичный номер самого старшего включённого входа.','Output the binary index of the highest active input.'],
  hint:['A<sub>1</sub> = D<sub>3</sub> ∨ D<sub>2</sub>,  A<sub>0</sub> = D<sub>3</sub> ∨ '+ov('D<sub>2</sub>')+'D<sub>1</sub>.','A<sub>1</sub> = D<sub>3</sub> ∨ D<sub>2</sub>,  A<sub>0</sub> = D<sub>3</sub> ∨ '+ov('D<sub>2</sub>')+'D<sub>1</sub>.']});

/* ---------- 6. Автоматы / State machines ---------- */
lv({ch:6,pos:[0,10],req:['q5'],par:2,t:['T-триггер','T flip-flop'],f:'Q<sub>n+1</sub> = Q<sub>n</sub> ⊕ T<sub>n</sub>',ins:['T'],outs:['Q'],gates:['DFF','XOR','NOT'],clk:1,
  vec:seq([1,0,1,1,0,1,1,0].map(T=>({T})),0,(q,i)=>[{Q:q},q^i.T]),task:['При T = 1 выход переключается на каждом такте, при T = 0 — держит значение.','With T = 1 the output toggles every tick; with T = 0 it holds.'],
  hint:['D = Q ⊕ T.','D = Q ⊕ T.']});
lv({ch:6,pos:[1,10],req:[34],par:5,t:['JK-триггер','JK flip-flop'],f:'Q<sub>n+1</sub> = J'+ov('Q<sub>n</sub>')+' ∨ '+ov('K')+'Q<sub>n</sub>',ins:['J','K'],outs:['Q'],gates:['DFF','AND','OR','NOT','NAND'],clk:1,
  vec:seq([[1,0],[0,0],[0,1],[1,1],[1,1],[0,0],[1,0],[0,1],[1,1]].map(([J,K])=>({J,K})),0,(q,i)=>[{Q:q},(i.J&(1-q))|((1-i.K)&q)]),task:['J включает, K выключает, J = K = 1 — переключение.','J sets, K resets, J = K = 1 toggles.'],
  hint:['Соберите формулу перед входом D, Q̄ возьмите со второго выхода.','Build the formula in front of D; take Q̄ from the second output.']});
lv({ch:6,pos:[2,10],req:[35],par:3,t:['Счётчик до трёх','Mod-3 counter'],f:'Q<sub>1</sub>Q<sub>0</sub>: 00 → 01 → 10 → 00',ins:[],outs:['Q1','Q0'],gates:['DFF','NOT','AND','NOR','XOR'],clk:1,
  vec:seq(T(8),0,s=>[{Q1:s>>1,Q0:s&1},(s+1)%3]),task:['Счёт по модулю 3: после 10 сразу 00.','Count modulo 3: after 10 comes 00.'],
  hint:['D<sub>0</sub> = '+ov('Q<sub>1</sub> ∨ Q<sub>0</sub>')+',  D<sub>1</sub> = Q<sub>0</sub>.','D<sub>0</sub> = '+ov('Q<sub>1</sub> ∨ Q<sub>0</sub>')+',  D<sub>1</sub> = Q<sub>0</sub>.']});
lv({ch:6,pos:[1,11],req:[34],par:3,t:['Бегущие огни','Running lights'],f:'000 → 100 → 110 → 111 → 011 → 001',ins:[],outs:['Q1','Q2','Q3'],gates:['DFF','NOT'],clk:1,
  vec:seq(T(8),[0,0,0],s=>[{Q1:s[0],Q2:s[1],Q3:s[2]},[1-s[2],s[0],s[1]]]),task:['Огонь заполняет линейку, потом гаснет с того же края.','Light fills the bar, then fades out from the same end.'],
  hint:['Три триггера цепочкой, в первый — инверсия последнего (счётчик Джонсона).','Three flip-flops in a chain; the first takes the inverted last one (Johnson counter).']});
lv({ch:6,pos:[2,11],req:[37],par:3,t:['Обратный счёт','Countdown'],f:'Q<sub>1</sub>Q<sub>0</sub>: 00 → 11 → 10 → 01',ins:[],outs:['Q1','Q0'],gates:['DFF','NOT','XOR','XNOR'],clk:1,
  vec:seq(T(8),0,s=>[{Q1:s>>1,Q0:s&1},(s+3)&3]),task:['Двоичный счёт вниз.','Count down in binary.'],
  hint:['Младший разряд — делитель, D<sub>1</sub> = '+ov('Q<sub>1</sub> ⊕ Q<sub>0</sub>')+'.','The low bit is a divider, D<sub>1</sub> = '+ov('Q<sub>1</sub> ⊕ Q<sub>0</sub>')+'.']});

/* ---------- 7. Регистры / Registers ---------- */
lv({ch:7,pos:[0,12],req:['q6'],par:5,t:['Регистр с загрузкой','Load register'],f:'Q<sub>n+1</sub> = L ? D : Q<sub>n</sub>',ins:['D','L'],outs:['Q'],gates:['DFF','AND','OR','NOT','NAND'],clk:1,
  vec:seq([[1,0],[1,1],[0,0],[0,0],[0,1],[1,0],[1,1],[0,0]].map(([D,L])=>({D,L})),0,(q,i)=>[{Q:q},i.L?i.D:q]),task:['Триггер записывает D только при L = 1, иначе хранит.','The flip-flop takes D only when L = 1; otherwise it holds.'],
  hint:['Перед входом D поставьте мультиплексор: L выбирает между D и Q.','Put a multiplexer before D: L picks between D and Q.']});
lv({ch:7,pos:[1,12],req:[39],par:10,t:['Двухбитный регистр','2-bit register'],f:'Q<sub>1</sub>Q<sub>0</sub> ← L ? D<sub>1</sub>D<sub>0</sub> : Q<sub>1</sub>Q<sub>0</sub>',ins:['D1','D0','L'],outs:['Q1','Q0'],gates:['DFF','AND','OR','NOT','NAND'],clk:1,
  vec:seq([[1,0,1],[0,1,0],[0,1,1],[1,1,0],[1,1,1],[0,0,0],[0,0,1],[1,0,0]].map(([D1,D0,L])=>({D1,D0,L})),[0,0],(s,i)=>[{Q1:s[0],Q0:s[1]},i.L?[i.D1,i.D0]:s]),
  task:['Два бита, общий сигнал загрузки L.','Two bits sharing one load signal L.'],
  hint:['Повторите прошлую схему дважды. Инвертор для L можно сделать один на двоих.','Repeat the last circuit twice. One inverter for L can serve both.']});
lv({ch:7,pos:[0,13],req:['q6'],par:2,t:['Делитель со сбросом','Divider with reset'],f:'Q<sub>n+1</sub> = '+ov('R ∨ Q<sub>n</sub>'),ins:['R'],outs:['Q'],gates:['DFF','NOR','NOT','AND','OR'],clk:1,
  vec:seq([0,0,0,1,0,0,1,1,0].map(R=>({R})),0,(q,i)=>[{Q:q},i.R?0:1-q]),task:['Выход переключается на каждом такте, но R = 1 сбрасывает его в ноль.','The output toggles every tick, but R = 1 forces it to zero.'],
  hint:['Одно ИЛИ-НЕ перед D сделает всё сразу.','A single NOR before D does the whole job.']});
lv({ch:7,pos:[1,13],req:[41],par:5,t:['Счётчик с разрешением','Counter with enable'],f:'Q ← Q + E',ins:['E'],outs:['Q1','Q0'],gates:['DFF','XOR','AND','NOT','OR'],clk:1,
  vec:seq([1,1,0,1,0,1,1,1,0].map(E=>({E})),0,(s,i)=>[{Q1:s>>1,Q0:s&1},(s+i.E)&3]),task:['Счётчик считает такты только при E = 1.','The counter counts ticks only while E = 1.'],
  hint:['D<sub>0</sub> = Q<sub>0</sub> ⊕ E,  D<sub>1</sub> = Q<sub>1</sub> ⊕ Q<sub>0</sub>E.','D<sub>0</sub> = Q<sub>0</sub> ⊕ E,  D<sub>1</sub> = Q<sub>1</sub> ⊕ Q<sub>0</sub>E.']});
lv({ch:7,pos:[2,13],req:[42],par:6,t:['Трёхбитный счётчик','3-bit counter'],f:'Q<sub>2</sub>Q<sub>1</sub>Q<sub>0</sub>: 000 → 001 → … → 111',ins:[],outs:['Q2','Q1','Q0'],gates:['DFF','XOR','AND','NOT'],clk:1,
  vec:seq(T(10),0,s=>[{Q2:(s>>2)&1,Q1:(s>>1)&1,Q0:s&1},(s+1)&7]),task:['Счёт от 0 до 7 и снова с нуля.','Count from 0 to 7 and wrap around.'],
  hint:['Старший разряд переключается, когда оба младших равны 1: D<sub>2</sub> = Q<sub>2</sub> ⊕ Q<sub>1</sub>Q<sub>0</sub>.','The top bit toggles when both lower bits are 1: D<sub>2</sub> = Q<sub>2</sub> ⊕ Q<sub>1</sub>Q<sub>0</sub>.']});

/* ---------- 8. АЛУ / ALU ---------- */
lv({ch:8,pos:[0,14],req:['q7'],par:1,t:['Управляемый инвертор','Controlled inverter'],f:'Y = A ⊕ M',ins:['A','M'],gates:['AND','OR','NOT','XOR'],
  vec:comb(['A','M'],i=>({Y:i.A^i.M})),task:['При M = 0 сигнал проходит как есть, при M = 1 — инвертируется.','With M = 0 the signal passes unchanged; with M = 1 it is inverted.'],
  hint:['Исключающее ИЛИ и есть управляемый инвертор.','XOR is a controlled inverter.']});
lv({ch:8,pos:[1,14],req:[44],par:6,t:['Логический блок','Logic unit'],f:['Y = F ? (A ∨ B) : (A ∧ B)','Y = F ? (A ∨ B) : (A ∧ B)'],ins:['A','B','F'],gates:['AND','OR','NOT','NAND'],
  vec:comb(['A','B','F'],i=>({Y:i.F?(i.A|i.B):(i.A&i.B)})),task:['Код операции F выбирает: 0 — И, 1 — ИЛИ.','Opcode F selects: 0 is AND, 1 is OR.'],
  hint:['Посчитайте оба результата, а F пусть выбирает через мультиплексор.','Compute both results and let F pick one through a multiplexer.']});
lv({ch:8,pos:[2,14],req:[45],par:6,t:['Сумматор-вычитатель','Adder-subtractor'],f:['S, P = A + (B ⊕ M) + M','S, Co = A + (B ⊕ M) + M'],ins:['A','B','M'],outs:['S','P'],dl:{P:'Co'},gates:['AND','OR','NOT','XOR'],
  vec:comb(['A','B','M'],i=>{const b=i.B^i.M,s=i.A+b+i.M;return{S:s&1,P:s>>1}}),task:['Разряд АЛУ: при M = 0 складывает, при M = 1 прибавляет дополнительный код B.','One ALU slice: M = 0 adds; M = 1 adds the two’s complement of B.'],
  hint:['Инвертируйте B через XOR с M, а M подайте как входной перенос полного сумматора.','Invert B with XOR against M, and feed M as the full adder’s carry in.']});
lv({ch:8,pos:[0,15],req:['q7'],par:3,t:['Инкремент','Incrementer'],f:'PS<sub>1</sub>S<sub>0</sub> = A<sub>1</sub>A<sub>0</sub> + 1',ins:['A1','A0'],outs:['P','S1','S0'],dl:{P:'Co'},gates:['AND','OR','NOT','XOR'],
  vec:comb(['A1','A0'],i=>{const s=i.A1*2+i.A0+1;return{P:s>>2,S1:(s>>1)&1,S0:s&1}}),task:['Прибавьте единицу к двухбитному числу.','Add one to a 2-bit number.'],
  hint:['S<sub>0</sub> = '+ov('A<sub>0</sub>')+', S<sub>1</sub> = A<sub>1</sub> ⊕ A<sub>0</sub>, P = A<sub>1</sub>A<sub>0</sub>.','S<sub>0</sub> = '+ov('A<sub>0</sub>')+', S<sub>1</sub> = A<sub>1</sub> ⊕ A<sub>0</sub>, Co = A<sub>1</sub>A<sub>0</sub>.']});
lv({ch:8,pos:[1,15],req:[47],par:2,od:{Z:['1, если все разряды — нули','1 when every bit is 0']},t:['Флаг нуля','Zero flag'],f:'Z = '+ov('A<sub>2</sub> ∨ A<sub>1</sub> ∨ A<sub>0</sub>'),ins:['A2','A1','A0'],outs:['Z'],gates:['OR','NOR','NOT','AND'],
  vec:comb(['A2','A1','A0'],i=>({Z:B(!i.A2&&!i.A1&&!i.A0)})),task:['Флаг Z поднимается, когда результат равен нулю.','Flag Z goes up when the result is zero.'],
  hint:['ИЛИ двух разрядов, затем ИЛИ-НЕ с третьим.','OR two bits, then NOR with the third.']});
lv({ch:8,pos:[2,15],req:[48],par:7,t:['Больше','Greater than'],f:'G = A<sub>1</sub>'+ov('B<sub>1</sub>')+' ∨ (A<sub>1</sub> ⊙ B<sub>1</sub>)A<sub>0</sub>'+ov('B<sub>0</sub>'),ins:['A1','A0','B1','B0'],outs:['G'],gates:['AND','OR','NOT','XNOR','XOR'],
  vec:comb(['A1','A0','B1','B0'],i=>({G:B(i.A1*2+i.A0>i.B1*2+i.B0)})),task:['Лампа горит, если A строго больше B.','The lamp is lit if A is strictly greater than B.'],
  hint:['Решает старший разряд. Если старшие равны — младший.','The high digit decides. If they are equal, the low digit does.']});

/* ---------- 9. Испытания / Trials (element limit) ---------- */
lv({ch:9,pos:[0,16],req:['q8'],par:5,max:5,t:['XOR из ИЛИ-НЕ','XOR from NOR'],f:'Y = A ⊕ B',ins:['A','B'],gates:['NOR'],vec:comb(['A','B'],i=>({Y:i.A^i.B})),
  task:['Только ИЛИ-НЕ, не больше пяти штук.','NOR only, five at most.'],
  hint:['Сначала соберите равнозначность из четырёх ИЛИ-НЕ, пятым её инвертируйте.','First build XNOR from four NORs, then invert it with the fifth.']});
lv({ch:9,pos:[1,16],req:[50],par:4,max:4,t:['Мультиплексор из И-НЕ','Mux from NAND'],f:'Y = '+ov('S')+'A ∨ SB',ins:['A','B','S'],gates:['NAND'],vec:comb(['A','B','S'],i=>({Y:i.S?i.B:i.A})),
  task:['Только И-НЕ, не больше четырёх.','NAND only, four at most.'],
  hint:['Y = И-НЕ( И-НЕ(A, '+ov('S')+'), И-НЕ(B, S) ).','Y = NAND( NAND(A, '+ov('S')+'), NAND(B, S) ).']});
lv({ch:9,pos:[2,16],req:[51],par:6,max:6,t:['Большинство из И-НЕ','Majority from NAND'],f:'Y = AB ∨ BC ∨ AC',ins:['A','B','C'],gates:['NAND'],vec:comb(['A','B','C'],i=>({Y:B(i.A+i.B+i.C>=2)})),
  task:['Только И-НЕ, не больше шести.','NAND only, six at most.'],
  hint:['Три И-НЕ по парам. Дальше нужен трёхвходовый И-НЕ — соберите его из трёх двухвходовых.','Three NANDs for the pairs. Then you need a 3-input NAND: build it from three 2-input ones.']});
lv({ch:9,pos:[0,17],req:['q8'],par:6,max:6,t:['Полусумматор из ИЛИ-НЕ','Half adder from NOR'],f:['S = A ⊕ B'+SEP+'P = A ∧ B','S = A ⊕ B'+SEP+'Co = A ∧ B'],ins:['A','B'],outs:['S','P'],dl:{P:'Co'},gates:['NOR'],
  vec:comb(['A','B'],i=>({S:i.A^i.B,P:i.A&i.B})),task:['Только ИЛИ-НЕ, не больше шести.','NOR only, six at most.'],
  hint:['Возьмите XOR из прошлого испытания. Перенос — это ИЛИ-НЕ от XOR и ИЛИ-НЕ(A, B).','Reuse the XOR from the first trial. Carry is NOR of the XOR and NOR(A, B).']});
lv({ch:9,pos:[1,17],req:[53],par:3,max:3,t:['Равенство за три','Equality in three'],f:'E = (A<sub>1</sub> ⊙ B<sub>1</sub>)(A<sub>0</sub> ⊙ B<sub>0</sub>)',ins:['A1','A0','B1','B0'],outs:['E'],gates:['XNOR','XOR','AND','NOR'],
  vec:comb(['A1','A0','B1','B0'],i=>({E:B(i.A1===i.B1&&i.A0===i.B0)})),task:['Сравните два числа тремя элементами.','Compare two numbers with three gates.'],
  hint:['Два элемента сравнивают разряды, третий объединяет.','Two gates compare digits, the third combines.']});
lv({ch:9,pos:[2,17],req:[54],par:3,max:3,t:['Чётность четырёх','Parity of four'],f:'Y = A ⊕ B ⊕ C ⊕ D',ins:['A','B','C','D'],gates:['XOR','XNOR'],
  vec:comb(['A','B','C','D'],i=>({Y:i.A^i.B^i.C^i.D})),task:['Чётность четырёх входов тремя элементами.','Parity of four inputs with three gates.'],
  hint:['Цепочка работает, но дерево быстрее: (A ⊕ B) ⊕ (C ⊕ D).','A chain works, but a tree is faster: (A ⊕ B) ⊕ (C ⊕ D).']});

/* ---------- 10. Пробуждение / Awakening ---------- */
lv({ch:10,pos:[0,18],req:['q9'],par:5,t:['Семисегментный индикатор','Seven-segment display'],f:['Цифры 0–3 на индикаторе','Digits 0–3 on the display'],ins:['A1','A0'],outs:['a','b','c','d','e','f','g'],gates:['AND','OR','NOT','NOR','NAND'],
  vec:comb(['A1','A0'],i=>{const S=['abcdef','bc','abdeg','abcdg'][i.A1*2+i.A0],o={};'abcdefg'.split('').forEach(c=>o[c]=B(S.includes(c)));return o}),
  task:['Зажгите сегменты так, чтобы получилась цифра A<sub>1</sub>A<sub>0</sub>. Сегмент b горит всегда.','Light the segments to draw digit A<sub>1</sub>A<sub>0</sub>. Segment b is always on.'],
  hint:['a = d = A<sub>1</sub> ∨ '+ov('A<sub>0</sub>')+', e = '+ov('A<sub>0</sub>')+', g = A<sub>1</sub>. Постоянную 1 даст A<sub>0</sub> ∨ '+ov('A<sub>0</sub>')+'.','a = d = A<sub>1</sub> ∨ '+ov('A<sub>0</sub>')+', e = '+ov('A<sub>0</sub>')+', g = A<sub>1</sub>. A constant 1 is A<sub>0</sub> ∨ '+ov('A<sub>0</sub>')+'.']});
lv({ch:10,pos:[1,18],req:[56],par:4,od:{R:['красный','red'],Y:['жёлтый','yellow'],G:['зелёный','green']},t:['Светофор','Traffic light'],f:['К → К+Ж → З → Ж','R → R+Y → G → Y'],ins:[],outs:['R','Y','G'],gates:['DFF','NOT','AND','XOR','NOR'],clk:1,
  vec:seq(T(8),0,s=>[{R:B(s<2),Y:B(s===1||s===3),G:B(s===2)},(s+1)&3]),task:['Четыре фазы светофора по кругу.','Four traffic-light phases in a loop.'],
  hint:['Внутри — двухбитный счётчик. R = '+ov('Q<sub>1</sub>')+', Y = Q<sub>0</sub>, G = Q<sub>1</sub>'+ov('Q<sub>0</sub>')+'.','Inside is a 2-bit counter. R = '+ov('Q<sub>1</sub>')+', Y = Q<sub>0</sub>, G = Q<sub>1</sub>'+ov('Q<sub>0</sub>')+'.']});
lv({ch:10,pos:[2,18],req:[57],par:4,od:{Y:['1 — замок открыт','1 = lock open']},t:['Кодовый замок','Code lock'],f:['Y = 1 после 1 → 0 → 1','Y = 1 after 1 → 0 → 1'],ins:['A'],outs:['Y'],gates:['DFF','AND','NOT','NOR'],clk:1,
  vec:seq([1,0,1,1,0,1,0,0,1,0,1].map(A=>({A})),[0,0],(s,i)=>[{Y:i.A&(1-s[0])&s[1]},[i.A,s[0]]]),task:['Замок открывается, когда последние три значения A были 1, 0, 1.','The lock opens when the last three values of A were 1, 0, 1.'],
  hint:['Сдвиговый регистр помнит два прошлых значения. Дальше — одно И с инверсией посередине.','A shift register remembers the two previous values. Then one AND with the middle one inverted.']});
lv({ch:10,pos:[0,19],req:['q9'],par:4,t:['Реверсивный счётчик','Up/down counter'],f:'Q ← U ? Q + 1 : Q − 1',ins:['U'],outs:['Q1','Q0'],gates:['DFF','XOR','XNOR','NOT'],clk:1,
  vec:seq([1,1,1,0,0,1,0,0,0].map(U=>({U})),0,(s,i)=>[{Q1:s>>1,Q0:s&1},(s+(i.U?1:3))&3]),task:['U = 1 — счёт вверх, U = 0 — вниз.','U = 1 counts up, U = 0 counts down.'],
  hint:['Младший разряд всегда переключается. D<sub>1</sub> = Q<sub>1</sub> ⊕ '+ov('Q<sub>0</sub> ⊕ U')+'.','The low bit always toggles. D<sub>1</sub> = Q<sub>1</sub> ⊕ '+ov('Q<sub>0</sub> ⊕ U')+'.']});
lv({ch:10,pos:[3,18],req:[58,59],par:12,t:['Счётчик команд','Program counter'],f:'Q ← L ? D : Q + 1',ins:['D1','D0','L'],outs:['Q1','Q0'],gates:['DFF','AND','OR','NOT','XOR','NAND'],clk:1,
  vec:seq([[0,0,0],[0,0,0],[1,0,1],[0,0,0],[0,1,1],[0,0,0],[0,0,0],[1,1,1],[0,0,0]].map(([D1,D0,L])=>({D1,D0,L})),0,(s,i)=>[{Q1:s>>1,Q0:s&1},i.L?i.D1*2+i.D0:(s+1)&3]),
  task:['Сердце процессора: считает по порядку, а при L = 1 прыгает по адресу D.','The heart of a CPU: counts in order, and jumps to address D when L = 1.'],
  hint:['Инкремент и регистр с загрузкой вы уже собирали. Соедините их.','You have built an incrementer and a load register. Join them.']});

const SANDBOX={id:0,od:{Y:null},t:['Песочница','Sandbox'],f:'',ins:['A','B','C'],outs:['X','Y','Z'],gates:null,clk:1,sandbox:1,vec:[],
  task:['Свободная сборка. Все элементы доступны.','Free build. Every element is available.'],hint:['Тактовый вход C можно переключать вручную.','You can toggle clock input C by hand.']};
const CHAPTERS=[['Основы','Basics'],['Универсальный элемент','The universal gate'],['Арифметика и выбор','Arithmetic and selection'],['Память и такт','Memory and clock'],
  ['Вычитание и кодирование','Subtraction and codes'],['Автоматы','State machines'],['Регистры','Registers'],['АЛУ','ALU'],['Испытания','Trials'],['Пробуждение','Awakening']];


/* tier-1 nudges for chapter 1 (authored; other chapters use the generated nudge) */
LV[0].h1=['Проводов три, и каждый идёт не к своей лампе. Начните с любого флажка и найдите его лампу по таблице.','There are three wires, each going to the wrong lamp. Start with any flag and find its lamp in the table.'];
LV[1].h1=['Понадобятся два одинаковых элемента — по одному на каждую лампу.','You will need two identical gates — one per lamp.'];
LV[2].h1=['Сигнал B должен запрещать, значит, на элемент И он должен прийти перевёрнутым.','B must forbid, so it has to reach the AND gate flipped.'];
LV[3].h1=['Лампа гаснет только в одной строке таблицы. Посмотрите, какой вход в этой строке единственный горит.','The lamp is dark in exactly one row. Look at which input is the only lit one in that row.'];
LV[4].h1=['Сначала соберите A ∧ B, а потом переверните результат.','First build A ∧ B, then flip the result.'];
LV[5].h1=['Сначала соберите A ∨ B, а потом переверните результат.','First build A ∨ B, then flip the result.'];
LV[6].h1=['Входы должны различаться: один горит, другой нет. Два случая — два слагаемых.','The inputs must differ: one on, the other off. Two cases — two terms.'];
LV[7].h1=['Лампа горит, когда входы одинаковы. На полке есть готовый элемент XOR — переверните его.','The lamp lights when the inputs match. There is a ready XOR on the shelf — flip it.'];


/* historical notes, shown after the level is solved (item 19) */
LV[0].hist=['В первых компьютерах — Z3 (1941) и ENIAC (1945) — программу задавали буквально проводами: переставил шнур на панели — получил другую машину.','In the first computers — the Z3 (1941) and ENIAC (1945) — programs were literally wired: move a cable on the panel and you get a different machine.'];
LV[1].hist=['Инвертор — самый простой вентиль: на одном транзисторе. Релейные инверторы работали в машине Конрада Цузе Z3 ещё в 1941 году.','The inverter is the simplest gate: a single transistor. Relay inverters were already clicking inside Konrad Zuse’s Z3 in 1941.'];
LV[2].hist=['Связку «A и не B» называют запретом (inhibit): в микросхемах она встречается так часто, что выпускали готовые элементы с инверсией одного входа.','The “A and not B” pattern is called inhibit: it is so common in hardware that chips with one pre-inverted input were sold as standard parts.'];
LV[3].hist=['«Если A, то B» в схемах — это ¬A ∨ B. Материальную импликацию формализовали ещё в «Principia Mathematica» Уайтхеда и Рассела (1910).','“If A then B” in circuits is ¬A ∨ B. Material implication was formalized back in Whitehead and Russell’s Principia Mathematica (1910).'];
LV[4].hist=['Генри Шеффер в 1913 году доказал, что одной этой операции достаточно для всей логики. Бортовой компьютер «Аполлона» был построен почти целиком на элементах И-НЕ.','In 1913 Henry Sheffer proved this single operation suffices for all of logic. The Apollo Guidance Computer was built almost entirely out of NAND gates.'];
LV[5].hist=['Чарльз Пирс нашёл эту операцию ещё в 1880 году, но не опубликовал — она заново открылась только после Шеффера. ИЛИ-НЕ так же универсально, как И-НЕ.','Charles Peirce found this operation back in 1880 but never published it; it was rediscovered after Sheffer. NOR is every bit as universal as NAND.'];
LV[6].hist=['Исключающее ИЛИ — сердце сложения и шифрования: одноразовый блокнот Вернама (1917), самый стойкий шифр в истории, это просто XOR сообщения с ключом.','XOR is the heart of addition and of encryption: Vernam’s one-time pad (1917), the strongest cipher in history, is just the message XORed with a key.'];
LV[7].hist=['Проверка равенства — первый шаг любого сравнения чисел в процессоре: совпадение битов поразрядно, а затем общее «и».','Equality checking is the first step of every number comparison in a CPU: bitwise match, then one big “and”.'];
LV[8].hist=['Соединив входы И-НЕ, получают НЕ — первый трюк универсального базиса. На нём строят целые компьютеры из одного типа вентилей.','Tie the inputs of a NAND and you get a NOT — the first trick of the universal basis. Whole computers are built from this one gate type.'];
LV[9].hist=['И-НЕ с инвертором на выходе снова становится И. В серии 7400 такой двойной элемент встречается постоянно.','NAND followed by an inverter is AND again. This pairing is everywhere in the 7400 series chips.'];
LV[10].hist=['Замена И на ИЛИ в базисе И-НЕ — это закон де Моргана: инвертируй входы, инвертируй операцию. Августус де Морган сформулировал его в 1847 году, друг и оппонент Буля.','Building OR from NAND is De Morgan’s law: invert the inputs, invert the operation. Augustus De Morgan, Boole’s friend and rival, stated it in 1847.'];
LV[11].hist=['Четыре И-НЕ для исключающего ИЛИ — классическая схема из учебников; именно так XOR делали до появления готовых элементов.','Four NANDs for an XOR is the textbook classic — this is exactly how XOR was built before dedicated gates existed.'];
LV[12].hist=['Конъюнкция ассоциативна: A ∧ B ∧ C можно собирать в любом порядке. На этом стоит вся каскадная логика многоразрядных схем.','Conjunction is associative: A ∧ B ∧ C can be chained in any order. All cascaded multi-bit logic relies on it.'];
LV[13].hist=['Голосование большинством — основа отказоустойчивости: три компьютера считают одно и то же, и двое «перевешивают» сбойного. Джон фон Нейман описал это в 1956-м, а сейчас так летают ракеты.','Majority voting is the basis of fault tolerance: three computers compute the same thing and two outvote the faulty one. John von Neumann described it in 1956 — rockets fly like this today.'];
LV[14].hist=['Бит чётности добавляли к памяти и каналам связи с 1950-х: один лишний бит ловит одиночную ошибку. И сейчас ECC-память работает на этой идее.','A parity bit has guarded memory and transmission lines since the 1950s: one extra bit catches a single error. ECC memory still runs on this idea.'];
LV[15].hist=['Клод Шеннон в дипломе 1937 года показал, что реле считают булеву алгебру — и сложение начинается с полусумматора.','In his 1937 master’s thesis Claude Shannon showed relays compute Boolean algebra — and addition begins with the half adder.'];
LV[16].hist=['Полный сумматор с переносом — кирпич арифметики. Цепочка таких по разрядам называется сумматором со сквозным переносом (ripple-carry).','The full adder with carry is the brick of arithmetic. A chain of them across digits is called a ripple-carry adder.'];
LV[17].hist=['Мультиплексор выбирает один из каналов адресом — по сути это реализация разложения Шеннона, того самого, из диплома 1937 года.','A multiplexer selects one channel by address — it is Shannon’s expansion in hardware, from the same 1937 thesis.'];
LV[18].hist=['Демультиплексор — зеркальный брат мультиплексора: один вход раздаётся по адресу. Пара таких — уже коммутатор.','A demultiplexer is the multiplexer’s mirror twin: one input routed by address. A pair of them makes a switch.'];
LV[19].hist=['Дешифратор превращает номер в один активный выход — так устроена адресация любой памяти: адресная шина в дешифратор, строки на выход.','A decoder turns a number into a single active output — this is how all memory is addressed: the address bus into a decoder, rows on its outputs.'];
LV[20].hist=['Двухбитный сумматор — двойной полный сумматор: перенос младшего разряда питает старший. Восьмиразрядные машины 1970-х складывали именно так.','A 2-bit adder is two full adders: the lower digit’s carry feeds the upper one. The 8-bit machines of the 1970s added exactly like this.'];
LV[21].hist=['Компаратор сравнивает поразрядно, начиная со старшего бита — как сравнение чисел в столбик в школе.','A comparator compares bitwise starting from the most significant bit — like comparing long numbers in school.'];
LV[22].hist=['Первый триггер построили Экклс и Джордан в 1918 году на лампах — для счётчиков радиоактивных частиц. Это была первая электронная ячейка памяти.','Eccles and Jordan built the first flip-flop in 1918 from vacuum tubes — for counting radioactive particles. It was the first electronic memory cell.'];
LV[23].hist=['D-триггер запоминает бит по фронту такта. Тысячи таких под общим тактом — это регистры процессора.','A D flip-flop captures a bit on the clock edge. Thousands of them sharing a clock are the CPU’s registers.'];
LV[24].hist=['Триггер со встречным включением делит частоту пополам — так часы делят высокую частоту кварца до одного герца.','A toggling flip-flop halves the frequency — this is how clocks divide a quartz crystal down to one hertz.'];
LV[25].hist=['Цепочка делителей — это двоичный счётчик: каждый триггер — один разряд. Видно, как числа растут сами.','A chain of dividers is a binary counter: each flip-flop one digit. You can watch the numbers grow by themselves.'];
LV[26].hist=['Сдвиговый регистр двигает биты по одному в такт. Раньше на них делали последовательную память; сейчас — преобразователи «последовательный-параллельный» в каждом интерфейсе.','A shift register moves bits one step per clock. They used to be serial memory; now they are the serial-parallel converters inside every interface.'];
LV[27].hist=['Фронт сигнала короче самого сигнала — выделять его умеют все тактовые входы. Так короткие команды получают из длинных нажатий.','An edge is shorter than the signal itself — clock inputs know how to catch it. Short commands are made of long presses this way.'];
LV[28].hist=['Вычитание — это сложение с заёмом вместо переноса. Двоичный вычитатель симметричен сумматору.','Subtraction is addition with borrow instead of carry. The binary subtractor mirrors the adder.'];
LV[29].hist=['Полный вычитатель учитывает заём из прошлого разряда. На практике вычитают редко — чаще складывают с дополнительным кодом.','The full subtractor honors the borrow from the lower digit. In practice subtraction is rare — addition in two’s complement is preferred.'];
LV[30].hist=['Сравнение многоразрядных чисел на равенство — это XNOR каждой пары битов и общее И. В процессоре так рождается флаг нуля.','Multi-bit equality is XNOR per bit pair and one big AND. In a CPU this is how the zero flag is born.'];
LV[31].hist=['Мультиплексор 4:1 выбирает один канал двухбитным адресом. Внутри почти любого процессорного узла стоят десятки таких выборов.','A 4:1 mux selects a channel with a two-bit address. Nearly every CPU block hides dozens of such selectors.'];
LV[32].hist=['Приоритетный шифратор выбирает самый важный активный вход — так работают контроллеры прерываний: устройство постарше обслуживается первым.','A priority encoder picks the most important active input — this is how interrupt controllers work: the most senior device is served first.'];
LV[33].hist=['T-триггер щёлкает между двумя состояниями. Каскад из T-триггеров — это уже счётчик.','A T flip-flop clicks between two states. A cascade of T flip-flops is already a counter.'];
LV[34].hist=['JK-триггер — универсальный триггер: J ставит, K сбрасывает, оба вместе переключают. Назван, вероятно, в честь Джека Килби, изобретателя микросхемы.','The JK flip-flop is universal: J sets, K resets, both together toggle. It is probably named after Jack Kilby, inventor of the integrated circuit.'];
LV[35].hist=['Счётчик по модулю N сбрасывается сам — первый настоящий автомат: устройство, помнящее, где оно в последовательности.','A mod-N counter resets itself — a true state machine: a device that remembers where it is in the sequence.'];
LV[36].hist=['«Бегущие огни» — конечный автомат из трёх состояний. Такие же автоматы управляют поворотниками автомобилей и гирляндами.','Running lights are a three-state machine. The same kind of machines run car indicators and holiday lights.'];
LV[37].hist=['Счёт в обратную сторону — зеркало прямого: инверсия переноса меняет направление.','Counting down mirrors counting up: inverting the carry reverses the direction.'];
LV[38].hist=['Регистр с входом загрузки умеет и помнить, и обновляться — основа памяти процессора. Один бит, но уже с поведением.','A register with a load input can both remember and update — the basis of CPU memory. One bit, but already with behavior.'];
LV[39].hist=['Двухбитный регистр — два бита под общей загрузкой и тактом. Процессорные регистры — те же, только по 32 и 64 бита.','A 2-bit register is two bits sharing load and clock. CPU registers are the same, just 32 or 64 bits wide.'];
LV[40].hist=['Сброс асинхронен: не ждёт такта. Любой реальный счётчик умеет начинаться с нуля — иначе что он насчитает.','Reset is asynchronous: it does not wait for the clock. Every real counter can start from zero — otherwise who knows what it has counted.'];
LV[41].hist=['Разрешение счёта пропускает такты. Со стороны это выглядит как остановка времени для счётчика.','Count enable skips clocks. From the outside it looks like time stops for the counter.'];
LV[42].hist=['Три разряда счётчика — уже восемь состояний. Число состояний растёт как степень двойки — это экспоненциальная сила памяти.','Three counter digits make eight states. State count grows as a power of two — memory is exponential.'];
LV[43].hist=['XOR с управляющим входом — вентиль, который по команде инвертирует сигнал или пропускает его. Главный трюк в устройстве АЛУ.','XOR with a control input is a gate that inverts or passes the signal on command. The key trick inside the ALU.'];
LV[44].hist=['В 1970 году вышла микросхема 74181 — первое АЛУ на одном кристалле: 32 функции над 4-битными словами. Вы собираете её предка.','In 1970 the 74181 chip appeared — the first ALU on one die: 32 functions on 4-bit words. You are building its ancestor.'];
LV[45].hist=['Складывая с дополнительным кодом, получаем вычитание бесплатно. Фон Нейман описал это в отчёте по EDVAC в 1945 году.','Adding in two’s complement gives subtraction for free. Von Neumann wrote this up in the 1945 EDVAC report.'];
LV[46].hist=['Инкремент — самая частая операция процессора: каждый шаг программы увеличивает счётчик команд на единицу.','Increment is the CPU’s most frequent operation: every program step bumps the program counter by one.'];
LV[47].hist=['Флаг нуля — один бит, говорящий «результат был нулевым». По нему работают все условные переходы в машинном коде.','The zero flag is one bit saying “the result was zero”. Every conditional jump in machine code depends on it.'];
LV[48].hist=['Сравнение «больше» начинается со старшего разряда: первое же различие решает всё.','“Greater than” starts at the most significant digit: the first difference decides everything.'];
LV[49].hist=['XOR на одних ИЛИ-НЕ — упражнение в универсальности: пять вентилей, ни одного лишнего.','XOR from nothing but NOR gates is an exercise in universality: five gates, none wasted.'];
LV[50].hist=['Мультиплексор на И-НЕ — классика экзаменов по цифровой схемотехнике.','A NAND-only multiplexer is a digital design exam classic.'];
LV[51].hist=['Голосование из И-НЕ ещё раз показывает: любую схему можно переписать в универсальном базисе.','NAND majority proves again: any circuit can be rewritten in a universal basis.'];
LV[52].hist=['Полусумматор на ИЛИ-НЕ сложнее, чем на И-НЕ, — но и это возможно. Базисы И-НЕ и ИЛИ-НЕ равноправны.','A NOR half adder is trickier than a NAND one — but still possible. The NAND and NOR bases are equals.'];
LV[53].hist=['Равенство тремя элементами — пример того, как оптимизируют схемы: правильная алгебра короче прямого пути.','Equality in three gates shows circuit optimization: the right algebra beats the direct route.'];
LV[54].hist=['Чётность четырёх битов — двоичное дерево XOR: попарно, потом результат. Так же считают контрольные суммы.','The parity of four bits is a binary tree of XORs: pairwise, then the result. Checksums are computed the same way.'];
LV[55].hist=['Семь сегментов рисуют цифры с начала XX века: патент 1903 года, а массово — с первых калькуляторов 1970-х.','Seven segments have drawn digits since the early 1900s: patented in 1903, mass-produced in the first calculators of the 1970s.'];
LV[56].hist=['Светофор — конечный автомат, знакомый каждому: состояния и переходы по таймеру. Первые электрические светофоры появились в 1910-х.','A traffic light is a state machine everyone knows: states and timer transitions. The first electric ones appeared in the 1910s.'];
LV[57].hist=['Кодовый замок распознаёт последовательность — автомат с памятью о прогрессе ввода. Неверная цифра возвращает в начало.','A combination lock recognizes a sequence — a machine remembering input progress. A wrong digit returns to the start.'];
LV[58].hist=['Реверсивный счётчик меняет направление по сигналу — так считают энкодеры в мышках и станках.','An up/down counter reverses on a signal — this is how encoders count in mice and machine tools.'];
LV[59].hist=['Счётчик команд — сердце архитектуры фон Неймана: он хранит адрес следующей инструкции и умеет загружать новый при переходах. На этом всё.','The program counter is the heart of the von Neumann architecture: it holds the next instruction’s address and accepts a new one on jumps. That is all of it.'];
