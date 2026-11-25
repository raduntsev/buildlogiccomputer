/* ========== levels ========== */
// Every text field is [ru, en]. tx() picks the current language.
// req: level ids or 'qN' (chapter N test passed). par: reference element count (3rd star).
// max: hard limit on elements (challenge levels).
const LV=[];
function comb(ins,fn){const n=ins.length,v=[];for(let m=0;m<1<<n;m++){const i={};ins.forEach((k,j)=>i[k]=(m>>(n-1-j))&1);v.push({in:i,out:fn(i)})}return v}
function seq(rows,init,step){let s=init;return rows.map(r=>{const [o,n]=step(s,r);s=n;return{in:r,out:o}})}
const B=x=>x?1:0;
const SEP='<span class="sep"></span>';
const sb=s=>s.replace(/([A-Za-zА-Яа-я])(\d)/g,'$1<sub>$2</sub>');
function lv(o){o.id=LV.length+1;o.outs=o.outs||['Y'];o.gates=o.gates||[];LV.push(o)}
const T=n=>Array(n).fill(0).map(()=>({}));

/* ---------- 1. Основы / Basics ---------- */
lv({ch:1,pos:[0,0],req:[],par:0,t:['Провод','Wire'],f:'Y = A',ins:['A'],vec:comb(['A'],i=>({Y:i.A})),
  task:['Сигнал должен дойти от входа до лампы.','The signal must travel from the input to the lamp.'],
  hint:['Потяните от точки на флажке A к лампе Y.','Drag from the dot on flag A to lamp Y.']});
lv({ch:1,pos:[1,0],req:[1],par:1,t:['Инверсия','Inversion'],f:'Y = '+ov('A'),ins:['A'],gates:['NOT'],vec:comb(['A'],i=>({Y:1-i.A})),
  task:['Лампа горит, когда на входе ноль.','The lamp is lit when the input is zero.'],
  hint:['Элемент НЕ переворачивает сигнал: 0 → 1, 1 → 0.','A NOT gate flips the signal: 0 → 1, 1 → 0.']});
lv({ch:1,pos:[2,0],req:[2],par:1,t:['Конъюнкция','Conjunction'],f:'Y = A ∧ B',ins:['A','B'],gates:['AND'],vec:comb(['A','B'],i=>({Y:i.A&i.B})),
  task:['Лампа горит, только когда включены оба входа.','The lamp is lit only when both inputs are on.'],
  hint:['Элемент И даёт 1, только если на всех входах 1.','AND outputs 1 only when every input is 1.']});
lv({ch:1,pos:[2,1],req:[2],par:1,t:['Дизъюнкция','Disjunction'],f:'Y = A ∨ B',ins:['A','B'],gates:['OR'],vec:comb(['A','B'],i=>({Y:i.A|i.B})),
  task:['Лампа горит, если включён хотя бы один вход.','The lamp is lit if at least one input is on.'],
  hint:['Элемент ИЛИ даёт 1, если хотя бы на одном входе 1.','OR outputs 1 if any input is 1.']});
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
lv({ch:4,pos:[3,7],req:[27],par:3,t:['Детектор фронта','Edge detector'],f:'Y = A<sub>n</sub> ∧ '+ov('A<sub>n−1</sub>'),ins:['A'],outs:['Y'],gates:['DFF','AND','NOT','NOR'],clk:1,
  vec:seq([0,1,1,0,1,0,0,1].map(A=>({A})),0,(p,i)=>[{Y:i.A&(1-p)},i.A]),task:['Лампа вспыхивает на один такт, когда A меняется с 0 на 1.','The lamp flashes for one tick when A goes from 0 to 1.'],
  hint:['Триггер помнит прошлое значение A.','A flip-flop remembers the previous value of A.']});

/* ---------- 5. Вычитание и кодирование / Subtraction and codes ---------- */
lv({ch:5,pos:[0,8],req:['q4'],par:3,t:['Полувычитатель','Half subtractor'],f:['D = A ⊕ B'+SEP+'Z = '+ov('A')+'B','D = A ⊕ B'+SEP+'Bo = '+ov('A')+'B'],ins:['A','B'],outs:['D','Z'],dl:{Z:'Bo'},gates:['AND','OR','NOT','XOR'],
  vec:comb(['A','B'],i=>({D:i.A^i.B,Z:(1-i.A)&i.B})),task:['Вычтите B из A: D — разность, Z — заём из старшего разряда.','Subtract B from A: D is the difference, Bo is the borrow.'],
  hint:['Почти полусумматор, только A перед И инвертируется.','Almost a half adder, but A is inverted before the AND.']});
lv({ch:5,pos:[1,8],req:[29],par:7,t:['Полный вычитатель','Full subtractor'],f:['D = A ⊕ B ⊕ C'+SEP+'Z = '+ov('A')+'B ∨ '+ov('A ⊕ B')+'C','D = A ⊕ B ⊕ C'+SEP+'Bo = '+ov('A')+'B ∨ '+ov('A ⊕ B')+'C'],ins:['A','B','C'],outs:['D','Z'],dl:{Z:'Bo'},gates:['AND','OR','NOT','XOR','XNOR'],
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
lv({ch:8,pos:[1,15],req:[47],par:2,t:['Флаг нуля','Zero flag'],f:'Z = '+ov('A<sub>2</sub> ∨ A<sub>1</sub> ∨ A<sub>0</sub>'),ins:['A2','A1','A0'],outs:['Z'],gates:['OR','NOR','NOT','AND'],
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
lv({ch:10,pos:[1,18],req:[56],par:4,t:['Светофор','Traffic light'],f:['К → К+Ж → З → Ж','R → R+Y → G → Y'],ins:[],outs:['R','Y','G'],gates:['DFF','NOT','AND','XOR','NOR'],clk:1,
  vec:seq(T(8),0,s=>[{R:B(s<2),Y:B(s===1||s===3),G:B(s===2)},(s+1)&3]),task:['Четыре фазы светофора по кругу.','Four traffic-light phases in a loop.'],
  hint:['Внутри — двухбитный счётчик. R = '+ov('Q<sub>1</sub>')+', Y = Q<sub>0</sub>, G = Q<sub>1</sub>'+ov('Q<sub>0</sub>')+'.','Inside is a 2-bit counter. R = '+ov('Q<sub>1</sub>')+', Y = Q<sub>0</sub>, G = Q<sub>1</sub>'+ov('Q<sub>0</sub>')+'.']});
lv({ch:10,pos:[2,18],req:[57],par:4,t:['Кодовый замок','Code lock'],f:['Y = 1 после 1 → 0 → 1','Y = 1 after 1 → 0 → 1'],ins:['A'],outs:['Y'],gates:['DFF','AND','NOT','NOR'],clk:1,
  vec:seq([1,0,1,1,0,1,0,0,1,0,1].map(A=>({A})),[0,0],(s,i)=>[{Y:i.A&(1-s[0])&s[1]},[i.A,s[0]]]),task:['Замок открывается, когда последние три значения A были 1, 0, 1.','The lock opens when the last three values of A were 1, 0, 1.'],
  hint:['Сдвиговый регистр помнит два прошлых значения. Дальше — одно И с инверсией посередине.','A shift register remembers the two previous values. Then one AND with the middle one inverted.']});
lv({ch:10,pos:[0,19],req:['q9'],par:4,t:['Реверсивный счётчик','Up/down counter'],f:'Q ← U ? Q + 1 : Q − 1',ins:['U'],outs:['Q1','Q0'],gates:['DFF','XOR','XNOR','NOT'],clk:1,
  vec:seq([1,1,1,0,0,1,0,0,0].map(U=>({U})),0,(s,i)=>[{Q1:s>>1,Q0:s&1},(s+(i.U?1:3))&3]),task:['U = 1 — счёт вверх, U = 0 — вниз.','U = 1 counts up, U = 0 counts down.'],
  hint:['Младший разряд всегда переключается. D<sub>1</sub> = Q<sub>1</sub> ⊕ '+ov('Q<sub>0</sub> ⊕ U')+'.','The low bit always toggles. D<sub>1</sub> = Q<sub>1</sub> ⊕ '+ov('Q<sub>0</sub> ⊕ U')+'.']});
lv({ch:10,pos:[3,18],req:[58,59],par:12,t:['Счётчик команд','Program counter'],f:'Q ← L ? D : Q + 1',ins:['D1','D0','L'],outs:['Q1','Q0'],gates:['DFF','AND','OR','NOT','XOR','NAND'],clk:1,
  vec:seq([[0,0,0],[0,0,0],[1,0,1],[0,0,0],[0,1,1],[0,0,0],[0,0,0],[1,1,1],[0,0,0]].map(([D1,D0,L])=>({D1,D0,L})),0,(s,i)=>[{Q1:s>>1,Q0:s&1},i.L?i.D1*2+i.D0:(s+1)&3]),
  task:['Сердце процессора: считает по порядку, а при L = 1 прыгает по адресу D.','The heart of a CPU: counts in order, and jumps to address D when L = 1.'],
  hint:['Инкремент и регистр с загрузкой вы уже собирали. Соедините их.','You have built an incrementer and a load register. Join them.']});

const SANDBOX={id:0,t:['Песочница','Sandbox'],f:'',ins:['A','B','C'],outs:['X','Y','Z'],gates:null,clk:1,sandbox:1,vec:[],
  task:['Свободная сборка. Все элементы доступны.','Free build. Every element is available.'],hint:['Тактовый вход C можно переключать вручную.','You can toggle clock input C by hand.']};
const CHAPTERS=[['Основы','Basics'],['Универсальный элемент','The universal gate'],['Арифметика и выбор','Arithmetic and selection'],['Память и такт','Memory and clock'],
  ['Вычитание и кодирование','Subtraction and codes'],['Автоматы','State machines'],['Регистры','Registers'],['АЛУ','ALU'],['Испытания','Trials'],['Пробуждение','Awakening']];
