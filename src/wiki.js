/* ========== the library as a wiki ==========
   Articles live in WIKI. Unlock state: prog.wiki = {id: ts}; read state: prog.wikiRd = {id: ts}.
   Unlock rules (un): open — always; gate — first level opened whose palette has the gate;
   lv — level solved; ch — chapter completed; art — another article unlocked.
   Retroactive evaluation runs from loadLevel, so existing saves get their articles. */

const WCATS=[
  ['basics',['Основы','Basics']],
  ['gates',['Логические элементы','Logic gates']],
  ['funcs',['Булевы функции','Boolean functions']],
  ['arith',['Арифметика','Arithmetic']],
  ['mem',['Память','Memory']],
  ['fsm',['Автоматы и регистры','Automata & registers']],
  ['cpu',['Процессор','Processor']],
  ['people',['Люди и история','People & history']]
];

const WIKI=[
/* ---------- Основы ---------- */
{id:'bit',cat:'basics',un:{open:1},lvs:[1],see:['bool','tt'],
 t:['Бит','Bit'],
 lead:['Наименьшая порция информации: 0 или 1. Один переключатель, одна лампа, один вопрос «есть сигнал или нет».','The smallest unit of information: 0 or 1. One switch, one lamp, one yes-or-no question.'],
 sec:{
  how:[['Бит хранится любым двухстабильным состоянием: напряжение есть/нет, контакт замкнут/разомкнут, намагничено/нет. В игре бит — это сигнал на проводе: зелёный — 1, тёмный — 0.','A bit is kept by any two-stable state: voltage present or absent, contact closed or open, magnetised or not. In the game a bit is a signal on a wire: lit — 1, dark — 0.']],
  from:[['Слово — сокращение от binary digit; его предложил статистик Джон Тьюки, а широко ввёл Клод Шеннон в статье 1948 года о теории связи.','The word is short for binary digit; statistician John Tukey coined it, and Claude Shannon popularised it in his 1948 paper on communication theory.']],
  why:[['Компьютеры говорят на битах не потому, что двоичная система волшебна, а потому, что надёжнее различать два состояния, чем десять.','Computers speak in bits not because binary is magical, but because distinguishing two states reliably is far easier than distinguishing ten.']],
  met:[['Каждый сигнал в Логической Лаборатории — бит. Восемь бит — байт; числа в игре кодируются битами по разрядам.','Every signal in Logic Lab is a bit. Eight bits make a byte; in-game numbers are encoded bit by bit.']]}},
{id:'bool',cat:'basics',un:{open:1},lvs:[2],see:['demorgan','tt','p_boole','p_shannon'],
 t:['Булева алгебра','Boolean algebra'],
 lead:['Алгебра над двумя значениями — 0 и 1 — с операциями И, ИЛИ и НЕ. Вся игра построена на ней.','An algebra over two values — 0 and 1 — with the operations AND, OR and NOT. The whole game is built on it.'],
 sec:{
  how:[['Операции ведут себя как в обычной алгебре: есть скобки, переменные, законы. Разница одна — значений всего два, поэтому любую функцию можно перебрать таблицей и доказать тождество полным перебором.','The operations behave like ordinary algebra: brackets, variables, laws. The difference — there are only two values, so any function can be enumerated in a table and any identity proven by exhaustion.']],
  from:[['Джордж Буль в книгах «Математический анализ логики» (1847) и «Исследование законов мысли» (1854) показал, что логические высказывания можно вычислять, как числа. Почти век спустя Клод Шеннон перенёс его алгебру на релейные схемы.','George Boole showed in The Mathematical Analysis of Logic (1847) and The Laws of Thought (1854) that logical statements can be computed like numbers. Almost a century later Claude Shannon carried the algebra over to relay circuits.']],
  why:[['Формула — это и есть схема: каждая связка — элемент, каждая переменная — вход. Упрощая формулу по законам алгебры, вы буквально выкидываете элементы из платы.','A formula literally is the circuit: each connective is a gate, each variable an input. Simplifying the formula throws gates off your board.']],
  met:[['Формула над таблицей истинности каждого уровня записана на языке булевой алгебры.','The formula above the truth table of every level is written in Boolean algebra.']]}},
{id:'tt',cat:'basics',un:{open:1},lvs:[1],see:['bool','demorgan'],
 t:['Таблица истинности','Truth table'],
 lead:['Полный перечень поведения схемы: одна строка на каждый возможный набор входов и значения всех выходов.','A complete listing of a circuit’s behaviour: one row per possible input combination and the values of all outputs.'],
 sec:{
  how:[['У схемы с n входами ровно 2 в степени n строк. Проверка уровня — это и есть сверка таблиц: схема принята, когда совпадают все строки.','A circuit with n inputs has exactly 2 to the n-th rows. Level verification is precisely a table comparison: the circuit passes when every row matches.']],
  from:[['Табличная запись логических функций вошла в обиход в начале XX века и стала стандартным способом задавать функцию без формулы.','Tabular notation for logical functions became common in the early 20th century and is still the standard way to define a function without a formula.']],
  why:[['Таблица — контракт: она не говорит, как собрать схему, но однозначно говорит, что должно получиться. По таблице можно синтезировать схему механически — чем и занимается подсказка Бита.','The table is a contract: it does not say how to build the circuit, but unambiguously says what must come out. A circuit can be synthesised from a table mechanically — which is what Bit’s hint does.']],
  met:[['Справа на каждом уровне; на стенде таблица строится по вашей схеме — можно сверить глазами.','On the right of every level; on the bench the table is built from your circuit for a visual check.']]}},
{id:'demorgan',cat:'basics',un:{lv:5},lvs:[5,6],see:['f_sheffer','f_peirce','g_nand','g_nor'],
 t:['Законы де Моргана','De Morgan’s laws'],
 lead:['Наверху штриха меняется связка: отрицание «И» — это «ИЛИ» отрицаний, и наоборот.','The connective flips under a top bar: the negation of AND is the OR of negations, and vice versa.'],
 f:ov('A ∧ B')+' = '+ov('A')+' ∨ '+ov('B')+SEP+ov('A ∨ B')+' = '+ov('A')+' ∧ '+ov('B'),
 sec:{
  how:[['Штрих «проталкивается» внутрь скобок, меняя ∧ на ∨ и обратно. Так любую схему можно переписать через одну связку — например, только через И-НЕ.','The bar pushes inside the brackets, flipping ∧ to ∨ and back. This lets any circuit be rewritten with a single connective — NAND alone, for example.']],
  from:[['Сформулированы английским логиком Огастесом де Морганом в середине XIX века; сами соотношения были известны логикам и раньше.','Stated formally by the English logician Augustus De Morgan in the mid-19th century; the equivalences themselves were known earlier.']],
  why:[['Это мост между мирами И и ИЛИ: три инверсии превращают И-НЕ в ИЛИ, а ИЛИ-НЕ в И. Большая часть экономии элементов в игре — применение этих законов.','They bridge the AND and OR worlds: three inverters turn NAND into OR and NOR into AND. Most gate savings in the game are these laws applied.']],
  met:[['Уровни «Штрих Шеффера» и «Стрелка Пирса» — прямое применение законов.','The Sheffer stroke and Peirce arrow levels apply the laws directly.']]}},

/* ---------- Логические элементы ---------- */
{id:'g_not',cat:'gates',un:{gate:'NOT'},gate:'NOT',lvs:[2,6,9],see:['g_nand','g_nor','f_dneg'],
 t:['НЕ (инвертор)','NOT gate (inverter)'],
 lead:['Единственный одновходовый элемент: выдаёт противоположное входу.','The only single-input gate: it outputs the opposite of its input.'],
 sec:{
  how:[['Сигнал 1 становится 0, 0 становится 1. В формулах записывается чертой над переменной.','Signal 1 becomes 0, 0 becomes 1. In formulas it is written as a bar over the variable.']],
  from:[['В релейных схемах инверсия была почти бесплатной — нормально замкнутый контакт. В транзисторной логике инвертор — простейший элемент вообще: пара транзисторов.','In relay circuits inversion was nearly free — a normally-closed contact. In transistor logic the inverter is the simplest gate of all: a pair of transistors.']],
  why:[['Без НЕ нельзя построить почти ничего: большинство функций требуют хотя бы одной инверсии.','Without NOT you can build almost nothing: most functions need at least one inversion.']],
  met:[['Второй уровень, дальше — везде.','The second level, then everywhere.']]}},
{id:'g_and',cat:'gates',un:{gate:'AND'},gate:'AND',lvs:[3,13],see:['g_nand','g_or','f_inhibit'],
 t:['И (конъюнкция)','AND gate (conjunction)'],
 lead:['Выдаёт 1 только когда все входы равны 1. Логическое «и то, и другое».','Outputs 1 only when every input is 1. The logical “both this and that”.'],
 sec:{
  how:[['Записывается знаком ∧ или просто подряд, как умножение: AB. Действительно похоже на умножение — 1·1=1, а с нулём всё обнуляется.','Written ∧ or simply juxtaposed like multiplication: AB. It does behave like multiplication — 1·1=1, and any zero zeroes everything.']],
  from:[['В релейной технике конъюнкция — последовательное соединение контактов: ток идёт, только если замкнуты оба.','In relay logic conjunction is contacts in series: current flows only if both are closed.']],
  why:[['И — выбор условий: «включить, когда А и Б». Половина всех схем — это И под разными именами.','AND selects conditions: “turn on when A and B”. Half of all circuits are ANDs under different names.']],
  met:[['С третьего уровня — в каждой схеме.','From the third level onward — in every circuit.']]}},
{id:'g_or',cat:'gates',un:{gate:'OR'},gate:'OR',lvs:[4],see:['g_nor','g_and','g_xor'],
 t:['ИЛИ (дизъюнкция)','OR gate (disjunction)'],
 lead:['Выдаёт 1, когда хотя бы один вход равен 1. Включающее «или» — можно и то, и другое.','Outputs 1 when at least one input is 1. Inclusive “or” — one, the other, or both.'],
 sec:{
  how:[['Записывается знаком ∨. Ноль только на полном нуле.','Written ∨. Zero only when everything is zero.']],
  from:[['В релейной технике дизъюнкция — параллельные контакты: достаточно одного замкнутого.','In relay logic disjunction is contacts in parallel: one closed contact is enough.']],
  why:[['ИЛИ собирает альтернативы: «гори, если причина раз или причина два». Любая сумма произведений в формуле заканчивается ИЛИ.','OR collects alternatives: “light up for reason one or reason two”. Every sum-of-products ends in an OR.']],
  met:[['С четвёртого уровня — повсюду.','From the fourth level — everywhere.']]}},
{id:'g_nand',cat:'gates',un:{gate:'NAND'},gate:'NAND',lvs:[5,9,10,11,12],see:['f_sheffer','demorgan','g_nor'],
 t:['И-НЕ','NAND gate'],
 lead:['И с инверсией на выходе: 0 только когда оба входа — 1. Он же «штрих Шеффера».','AND with an inverted output: 0 only when both inputs are 1. The same thing as the Sheffer stroke.'],
 sec:{
  how:[['Y = '+ov('A ∧ B')+'. Полный набор из одного элемента: соединив входы, получаем НЕ; из НЕ и И-НЕ собираются И и ИЛИ.','Y = '+ov('A ∧ B')+'. A complete basis in one gate: tie the inputs for NOT; AND and OR follow from NOT and NAND.']],
  from:[['Именно И-НЕ стал рабочей лошадкой TTL-микросхем серии 7400 — технологически он дешевле И.','NAND became the workhorse of the 7400 TTL chip series — technologically cheaper than AND.']],
  why:[['Функционально полон: любая схема собирается только из И-НЕ — целая глава игры об этом.','Functionally complete: any circuit can be built from NAND alone — a whole chapter of the game is about that.']],
  met:[['Уровень «Штрих Шеффера», глава «Элементная база» и микросхемы реального мира.','The Sheffer stroke level, the building-blocks chapter and real-world chips.']]}},
{id:'g_nor',cat:'gates',un:{gate:'NOR'},gate:'NOR',lvs:[6,20,23],see:['f_peirce','demorgan','g_nand'],
 t:['ИЛИ-НЕ','NOR gate'],
 lead:['ИЛИ с инверсией на выходе: 1 только на полном нуле. Он же «стрелка Пирса».','OR with an inverted output: 1 only on all zeros. The same thing as the Peirce arrow.'],
 sec:{
  how:[['Y = '+ov('A ∨ B')+'. Как и И-НЕ, функционально полон.','Y = '+ov('A ∨ B')+'. Like NAND, it is functionally complete.']],
  from:[['Бортовой управляющий компьютер «Аполлона» собирали в основном на однотипных элементах ИЛИ-НЕ — единообразие упрощало производство и проверку.','The Apollo guidance computer was built mostly of identical NOR gates — uniformity simplified manufacture and testing.']],
  why:[['На ИЛИ-НЕ естественно строить память: RS-триггер — это два ИЛИ-НЕ с перекрёстными связями.','NOR lends itself to memory: an SR latch is two cross-coupled NOR gates.']],
  met:[['Уровень «Стрелка Пирса», RS-триггер и глава «Элементная база».','The Peirce arrow level, the SR latch and the building-blocks chapter.']]}},
{id:'g_xor',cat:'gates',un:{gate:'XOR'},gate:'XOR',lvs:[7,15,16],see:['g_xnor','f_parity','hadd'],
 t:['Исключающее ИЛИ (XOR)','Exclusive OR (XOR)'],
 lead:['ИЛИ с исключением: 1, когда входы различны. «Либо то, либо это — но не оба».','OR with exclusion: 1 when the inputs differ. “One or the other — but not both”.'],
 sec:{
  how:[['Y = A ⊕ B. Это же сложение по модулю два: 1 ⊕ 1 = 0, потому что 2 mod 2 = 0.','Y = A ⊕ B. It is also addition modulo two: 1 ⊕ 1 = 0 because 2 mod 2 = 0.']],
  from:[['Долго не имел своего элемента и собирался из четырёх И-НЕ; в современных библиотеках элементов XOR — стандарт.','For a long time it had no dedicated gate and was built from four NANDs; in modern cell libraries XOR is standard.']],
  why:[['XOR — «детектор различия»: на нём стоят сумматоры, чётность, компараторы и половина криптографии.','XOR is a “difference detector”: adders, parity, comparators and half of cryptography stand on it.']],
  met:[['Уровень «Исключающее ИЛИ», все сумматоры, проверка чётности.','The XOR level, every adder, parity checking.']]}},
{id:'g_xnor',cat:'gates',un:{gate:'XNOR'},gate:'XNOR',lvs:[8,22],see:['g_xor','cmp'],
 t:['Равнозначность (XNOR)','Equivalence (XNOR)'],
 lead:['XOR с инверсией: 1, когда входы совпадают. Логическая эквивалентность.','XOR inverted: 1 when the inputs agree. Logical equivalence.'],
 sec:{
  how:[['Y = '+ov('A ⊕ B')+' = A ⊙ B.','Y = '+ov('A ⊕ B')+' = A ⊙ B.']],
  from:[['Тот же путь, что у XOR: сначала составная схема, потом отдельный элемент.','The same road as XOR: a composite circuit first, a dedicated gate later.']],
  why:[['Равнозначность — поразрядное «равно»: многоразрядное сравнение — это XNOR по каждому разряду и И по всем.','Equivalence is bitwise “equal”: multi-bit comparison is an XNOR per bit ANDed together.']],
  met:[['Уровень «Равнозначность», компаратор, сравнение чисел.','The equivalence level, the comparator, number comparison.']]}},
{id:'g_dff',cat:'gates',un:{gate:'DFF'},gate:'DFF',lvs:[24,25,26,27],see:['dffe','tff','sr','sreg'],
 t:['D-триггер','D flip-flop'],
 lead:['Ячейка памяти на один бит: по фронту тактового входа C запоминает D и хранит до следующего фронта.','A one-bit memory cell: on the rising edge of the clock input C it captures D and holds it until the next edge.'],
 sec:{
  how:[['Q<sub>n+1</sub> = D. Второй выход — всегда '+ov('Q')+'. Между фронтами вход D можно крутить как угодно — на выходе не отразится.','Q<sub>n+1</sub> = D. The second output is always '+ov('Q')+'. Between edges you may wiggle D all you want — the output will not notice.']],
  from:[['Триггер как принцип появился в 1918 году (схема Экклса и Джордана на лампах). Синхронный D-триггер — его потомок, ставший стандартной ячейкой памяти.','The flip-flop principle dates to 1918 (the Eccles–Jordan vacuum-tube circuit). The synchronous D flip-flop is its descendant and the standard memory cell.']],
  why:[['Всё остальное в игре мгновенно: вход изменился — выход ответил. D-триггер даёт схеме прошлое. Из него строятся регистры, счётчики и автоматы.','Everything else in the game is instant: input changes, output answers. The D flip-flop gives a circuit a past. Registers, counters and automata are built from it.']],
  met:[['Глава «Память» и все тактируемые схемы дальше.','The memory chapter and every clocked circuit after it.']]}},

/* ---------- Булевы функции ---------- */
{id:'f_dneg',cat:'funcs',un:{lv:2},f:'Y = '+ov(ov('A'))+' = A',lvs:[2],see:['g_not','demorgan'],
 t:['Двойное отрицание','Double negation'],
 lead:['Две черты сокращаются: не-не-A — это просто A.','Two bars cancel: not-not-A is just A.'],
 sec:{
  how:[['Инвертор за инвертором возвращает сигнал как был. В формуле — двойная черта.','An inverter after an inverter returns the signal unchanged. In a formula — a double bar.']],
  why:[['Правило работает и внутри формул: двойной штрих над любым выражением можно снять. Это половина всех упрощений по де Моргану.','The rule works inside formulas too: a double bar over any expression can be dropped. That is half of every De Morgan simplification.']],
  met:[['Уровень «Инверсия» и любое упрощение формулы.','The inversion level and every formula simplification.']]}},
{id:'f_inhibit',cat:'funcs',un:{lv:3},f:'Y = A ∧ '+ov('B'),tt:{ins:['A','B'],f:i=>[i.A&(1-i.B)]},lvs:[3],see:['g_and','g_not'],
 t:['Запрет','Inhibit'],
 lead:['«A, если не запрещено B»: конъюнкция с инвертированным входом.','“A unless B forbids it”: conjunction with one inverted input.'],
 sec:{
  how:[['Y = A ∧ '+ov('B')+': сигнал A проходит, пока запрещающий вход B равен 0.','Y = A ∧ '+ov('B')+': signal A passes while the inhibiting input B is 0.']],
  from:[['Связка настолько частая в аппаратуре, что выпускались готовые элементы с инверсией одного входа.','The pattern was so common in hardware that chips with a pre-inverted input were sold as standard parts.']],
  why:[['Запрет — типичный «разрешить/запретить»: управляющий сигнал глушит канал данных. Так работают маски и стробы.','Inhibit is the classic enable/disable: a control signal mutes the data path. That is how masks and strobes work.']],
  met:[['Третий уровень и любая схема с разрешением.','The third level and any circuit with an enable.']]}},
{id:'f_impl',cat:'funcs',un:{lv:4},f:'Y = '+ov('A')+' ∨ B',tt:{ins:['A','B'],f:i=>[(1-i.A)|i.B]},lvs:[4],see:['g_or','g_not'],
 t:['Импликация','Implication'],
 lead:['«Если A, то B»: ложна только в одном случае — когда A есть, а B нет.','“If A then B”: false in exactly one case — A present, B absent.'],
 sec:{
  how:[['Y = '+ov('A')+' ∨ B. Парадокс материальной импликации: при ложном A она истинна всегда — «из лжи следует что угодно».','Y = '+ov('A')+' ∨ B. The paradox of material implication: when A is false it is always true — “from falsehood anything follows”.']],
  why:[['Импликация — схема проверки условия: срабатывает на нарушение правила «не бывает A без B».','Implication is a rule-checking circuit: it fires on the violation of “no A without B”.']],
  met:[['Четвёртый уровень; в автоматах — переходы «если условие, то действие».','The fourth level; in automata — “if condition then action” transitions.']]}},
{id:'f_sheffer',cat:'funcs',un:{lv:5},f:'Y = '+ov('A ∧ B'),tt:{ins:['A','B'],f:i=>[1-(i.A&i.B)]},lvs:[5,9],see:['g_nand','demorgan','p_sheffer'],
 t:['Штрих Шеффера','Sheffer stroke'],
 lead:['Функция «не-и», A | B = '+ov('A ∧ B')+'. Это и есть элемент И-НЕ — отдельного элемента «штрих» не существует и не нужно.','The “not-and” function, A | B = '+ov('A ∧ B')+'. It is exactly the NAND gate — no separate “stroke” element exists or is needed.'],
 sec:{
  how:[['Записывается вертикальной чертой A | B. Важна не форма, а факт: через неё выражаются НЕ (A|A), И и ИЛИ — то есть вообще любая функция.','Written as a vertical stroke A | B. What matters is not the shape but the fact: NOT (A|A), AND and OR all reduce to it — in fact every function does.']],
  from:[['Генри Шеффер доказал полноту связки в 1913 году.','Henry Sheffer proved the connective complete in 1913.']],
  why:[['Функциональная полнота — причина, по которой реальные микросхемы делают из однотипных элементов. Глава «Элементная база» целиком про постройку всего из И-НЕ и ИЛИ-НЕ.','Functional completeness is why real chips are made of one gate type. The building-blocks chapter is all about constructing everything from NAND and NOR.']],
  met:[['Пятый уровень, элемент И-НЕ в палитре.','The fifth level, the NAND gate in the palette.']]}},
{id:'f_peirce',cat:'funcs',un:{lv:6},f:'Y = '+ov('A ∨ B'),tt:{ins:['A','B'],f:i=>[1-(i.A|i.B)]},lvs:[6],see:['g_nor','demorgan','p_peirce'],
 t:['Стрелка Пирса','Peirce arrow'],
 lead:['Функция «не-или», A ↓ B = '+ov('A ∨ B')+'. Это и есть элемент ИЛИ-НЕ — как и штрих Шеффера, стрелка не требует отдельного элемента.','The “not-or” function, A ↓ B = '+ov('A ∨ B')+'. It is exactly the NOR gate — like the Sheffer stroke, it needs no dedicated element.'],
 sec:{
  how:[['Записывается стрелкой вниз A ↓ B. Тоже функционально полна — зеркальный двойник штриха по законам де Моргана.','Written as a downward arrow A ↓ B. Functionally complete too — the De Morgan mirror twin of the stroke.']],
  from:[['Чарльз Пирс описал связку ещё около 1880 года, но рукопись при жизни не публиковал — поэтому полноту независимо открыл заново Шеффер.','Charles Peirce described the connective around 1880 but never published it in his lifetime — so Sheffer independently rediscovered completeness.']],
  why:[['В аппаратуре ИЛИ-НЕ любили не меньше И-НЕ: на нём строили RS-триггеры и целые компьютеры.','Hardware liked NOR no less than NAND: latches and whole computers were built from it.']],
  met:[['Шестой уровень, элемент ИЛИ-НЕ.','The sixth level, the NOR gate.']]}},
{id:'f_maj',cat:'funcs',un:{lv:14},f:'Y = AB ∨ BC ∨ AC',tt:{ins:['A','B','C'],f:i=>[B(i.A+i.B+i.C>=2)]},lvs:[14,52],see:['fadd'],
 t:['Большинство','Majority'],
 lead:['Голосование «два из трёх»: 1, если единиц не меньше двух.','Two-out-of-three voting: 1 when at least two inputs are 1.'],
 sec:{
  how:[['Y = AB ∨ BC ∨ AC — истинна ровно на двух и трёх единицах.','Y = AB ∨ BC ∨ AC — true on exactly two and three ones.']],
  why:[['Мажоритарный элемент — основа резервирования: три одинаковых блока голосуют, и один сбойный проигрывает. В сумматоре та же функция называется переносом.','The majority gate is the basis of redundancy: three identical blocks vote and one faulty one loses. In an adder the very same function is called the carry.']],
  met:[['Уровень «Большинство» и перенос полного сумматора.','The majority level and the full-adder carry.']]}},
{id:'f_parity',cat:'funcs',un:{lv:15},f:'Y = A ⊕ B ⊕ C',tt:{ins:['A','B','C'],f:i=>[i.A^i.B^i.C]},lvs:[15,55],see:['g_xor'],
 t:['Чётность','Parity'],
 lead:['1, когда число единиц нечётно — цепочка XOR.','1 when the number of ones is odd — a chain of XORs.'],
 sec:{
  how:[['Y = A ⊕ B ⊕ C: каждый XOR переворачивает ответ, поэтому итог — нечётность количества единиц.','Y = A ⊕ B ⊕ C: each XOR flips the answer, so the result is the oddness of the count of ones.']],
  from:[['Бит чётности добавляли к памяти и линиям связи с 1950-х: лишний бит доводит число единиц до чётного, и одиночная ошибка сразу видна.','A parity bit has guarded memory and transmission lines since the 1950s: an extra bit makes the count even, exposing any single-bit error.']],
  why:[['Самый дешёвый контроль ошибок. ECC-память работает на развитии той же идеи.','The cheapest error detection there is. ECC memory runs on an extension of the same idea.']],
  met:[['Уровни «Чётность» и «Чётность четырёх».','The parity levels, three and four bits.']]}},

/* ---------- Арифметика ---------- */
{id:'hadd',cat:'arith',un:{lv:16},ttLv:16,lvs:[16],see:['fadd','g_xor','g_and'],
 t:['Полусумматор','Half adder'],
 lead:['Складывает два бита: сумма и перенос в старший разряд.','Adds two bits: sum and carry into the next digit.'],
 sec:{
  how:[['S = A ⊕ B — сумма по модулю два; P (перенос, carry out) = A ∧ B — появляется только на 1+1.','S = A ⊕ B — the sum modulo two; P (carry out) = A ∧ B — appears only on 1+1.']],
  why:[['Это атом арифметики: полный сумматор собирается из двух полусумматоров, а процессор — из полных.','It is the atom of arithmetic: a full adder is two half adders, and a processor is built of full ones.']],
  met:[['Шестнадцатый уровень, первый уровень главы «Арифметика».','The sixteenth level, the first of the arithmetic chapter.']]}},
{id:'fadd',cat:'arith',un:{lv:17},ttLv:17,lvs:[17,21],see:['hadd','f_maj','radd'],
 t:['Полный сумматор','Full adder'],
 lead:['Полусумматор плюс вход переноса: складывает три бита — A, B и перенос из младшего разряда.','A half adder plus a carry input: adds three bits — A, B and the carry from the lower digit.'],
 sec:{
  how:[['S = A ⊕ B ⊕ C, перенос — большинство: Co = AB ∨ C(A ⊕ B).','S = A ⊕ B ⊕ C, the carry is majority: Co = AB ∨ C(A ⊕ B).']],
  why:[['Из полных сумматоров строится цепочка на любую разрядность: перенос одного кормит следующий.','Full adders chain to any width: each carry feeds the next.']],
  met:[['Семнадцатый уровень и «Двухбитный сумматор».','The seventeenth level and the 2-bit adder.']]}},
{id:'radd',cat:'arith',un:{lv:21},lvs:[21,46],see:['fadd','twos'],
 t:['Многоразрядный сумматор','Multi-bit adder'],
 lead:['Каскад полных сумматоров по одному на разряд — так складываются числа.','A cascade of full adders, one per digit — that is how numbers get added.'],
 sec:{
  how:[['Перенос идёт по цепочке от младшего разряда к старшему — ripple-carry. Цена простоты — задержка: старший бит ждёт всех младших.','The carry ripples from the least to the most significant digit — a ripple-carry adder. The price of simplicity is latency: the top bit waits for all the lower ones.']],
  why:[['Схема уровня «Двухбитный сумматор» — это два полусумматорных каскада вашими руками. Ускоренные сумматоры (с ускоренным переносом) — та же идея с предвычислением переносов.','The 2-bit adder level is this cascade built by hand. Faster adders (carry-lookahead) are the same idea with carries computed ahead.']],
  met:[['Уровень «Двухбитный сумматор», сумматор-вычитатель.','The 2-bit adder level, the adder-subtractor.']]}},
{id:'hsub',cat:'arith',un:{lv:29},ttLv:29,lvs:[29,30],see:['hadd','twos'],
 t:['Полувычитатель','Half subtractor'],
 lead:['Вычитает бит из бита: разность и заём.','Subtracts a bit from a bit: difference and borrow.'],
 sec:{
  how:[['D = A ⊕ B — та же XOR, что и у суммы; заём Bo = '+ov('A')+'B — единица только когда 0 − 1.','D = A ⊕ B — the same XOR as the sum; the borrow Bo = '+ov('A')+'B — one only on 0 − 1.']],
  why:[['Вычитание зеркалит сложение: вместо переноса — заём. Полный вычитатель добавляет вход займа, как полный сумматор — перенос.','Subtraction mirrors addition: borrow instead of carry. The full subtractor adds a borrow-in just as the full adder adds a carry-in.']],
  met:[['Уровни главы «Вычитание».','The subtraction-chapter levels.']]}},
{id:'twos',cat:'arith',un:{lv:46},lvs:[46],see:['hsub','radd'],
 t:['Дополнительный код','Two’s complement'],
 lead:['Способ записать отрицательное число так, чтобы вычитание превратилось в сложение.','A way to write negative numbers so that subtraction becomes addition.'],
 sec:{
  how:[['−A = '+ov('A')+' + 1: инвертируем биты и добавляем единицу. Тогда A − B = A + (−B), и сумматор работает в обе стороны без новой схемы.','−A = '+ov('A')+' + 1: invert the bits and add one. Then A − B = A + (−B), and the same adder runs in both directions with no new circuitry.']],
  why:[['Весь секрет уровня «Сумматор-вычитатель»: вход M инвертирует B через XOR (B ⊕ M) и подаётся же единицей в перенос — вот и «плюс один». Именно так вычитают реальные процессоры.','This is the whole trick of the adder-subtractor level: input M inverts B through XOR (B ⊕ M) and is itself fed as a carry one — the “plus one”. Real processors subtract exactly this way.']],
  met:[['Уровень «Сумматор-вычитатель» и любой процессорный вычитатель.','The adder-subtractor level and every CPU subtractor.']]}},
{id:'mux',cat:'arith',un:{lv:18},f:'Y = '+ov('S')+'A ∨ SB',ttLv:18,lvs:[18,32,51],see:['dec','reg'],
 t:['Мультиплексор','Multiplexer'],
 lead:['Адресный переключатель: адрес S выбирает, какой из входов пройдёт на выход.','An addressed switch: the select input S chooses which input reaches the output.'],
 sec:{
  how:[['Y = '+ov('S')+'A ∨ SB: при S=0 проходит A, при S=1 — B. Четырёхвходовый — то же с двумя адресными битами.','Y = '+ov('S')+'A ∨ SB: at S=0 A passes, at S=1 — B. The 4:1 version is the same with two address bits.']],
  why:[['Мультиплексор — «если-то-иначе» в железе: регистры с загрузкой, выбор операции в АЛУ, шины данных — всё мультиплексоры.','A multiplexer is hardware if-then-else: load registers, ALU operation selection, data buses — all multiplexers.']],
  met:[['Уровень «Мультиплексор», «Мультиплексор 4:1», «Мультиплексор из И-НЕ».','The multiplexer levels, 4:1 and from-NAND.']]}},
{id:'dec',cat:'arith',un:{lv:20},ttLv:20,lvs:[20],see:['enc','mux'],
 t:['Дешифратор','Decoder'],
 lead:['Из кода — в позицию: адрес зажигает ровно один из 2 в степени n выходов.','From code to position: the address lights exactly one of the 2-to-the-n outputs.'],
 sec:{
  how:[['Каждый выход — конъюнкция адресных бит или их отрицаний: выход k активен при адресе k.','Each output is a conjunction of address bits or their negations: output k is active at address k.']],
  why:[['Дешифратор — базовый узел памяти и управления: выбрать ячейку по адресу, зажечь сегмент по коду.','The decoder is a basic memory and control block: select a cell by address, light a segment by code.']],
  met:[['Уровень «Дешифратор» и семисегментный индикатор.','The decoder level and the seven-segment display.']]}},
{id:'enc',cat:'arith',un:{lv:33},ttLv:33,lvs:[33],see:['dec'],
 t:['Приоритетный шифратор','Priority encoder'],
 lead:['Обратно дешифратору: выдаёт номер старшей активной единицы.','The decoder in reverse: outputs the index of the highest active one.'],
 sec:{
  how:[['Выходы A₁A₀ — двоичный номер старшего входа с единицей; выход V — «хоть одна единица есть».','Outputs A₁A₀ are the binary index of the highest input carrying a one; output V flags “any one at all”.']],
  why:[['Приоритет — то, чем обрабатывают прерывания: несколько источников зовут одновременно, обслуживается старший.','Priority is how interrupts are handled: several sources call at once, the highest is served.']],
  met:[['Уровень «Приоритетный шифратор».','The priority-encoder level.']]}},
{id:'cmp',cat:'arith',un:{lv:22},ttLv:22,lvs:[22,49],see:['g_xnor','flags'],
 t:['Компаратор','Comparator'],
 lead:['Сравнивает два числа и зажигает один из трёх выходов: больше, равно или меньше.','Compares two numbers and lights one of three outputs: greater, equal or less.'],
 sec:{
  how:[['Разряды сравниваются от старшего к младшему: первое различие решает всё. Равенство битов — XNOR.','Digits are compared from the most significant down: the first difference decides everything. Bit equality is XNOR.']],
  why:[['Как в школьном сравнении столбиком — только поразрядно и на элементах. Компараторы стоят за каждым условным переходом.','Like comparing numbers digit by digit in school — just bitwise and in gates. Every conditional branch hides a comparator.']],
  met:[['Уровень «Компаратор» и «Равенство чисел».','The comparator and equal-numbers levels.']]}},
{id:'seg7',cat:'arith',un:{lv:56},lvs:[56],see:['dec'],
 t:['Семисегментный индикатор','Seven-segment display'],
 lead:['Семь сегментов a–g, из которых складываются цифры: дешифратор зажигает нужные.','Seven segments a–g combining into digits: a decoder lights the right ones.'],
 sec:{
  how:[['Каждая цифра — свой набор сегментов; задача схемы — по коду зажечь их конфигурацию. Семь выходов — семь независимых функций.','Each digit is a fixed set of segments; the circuit’s job is to light the right pattern from the code. Seven outputs — seven independent functions.']],
  why:[['Классическая задача проектирования: много выходов от малых входов — идеальный полигон для таблиц истинности.','A classic design exercise: many outputs from few inputs — the perfect playground for truth tables.']],
  met:[['Уровень «Семисегментный индикатор» в финальной главе.','The seven-segment level in the final chapter.']]}},

/* ---------- Память ---------- */
{id:'sr',cat:'mem',un:{lv:23},lvs:[23],see:['g_nor','g_dff','tff'],
 t:['RS-триггер','SR latch'],
 lead:['Простейшая ячейка памяти: два элемента с перекрёстной связью запоминают, кто из S и R был последним.','The simplest memory cell: two cross-coupled gates remember which of S and R came last.'],
 sec:{
  how:[['Q<sub>n+1</sub> = S ∨ '+ov('R')+'Q<sub>n</sub>. S=1 устанавливает Q, R=1 сбрасывает, оба нуля — хранение. Комбинация S=R=1 запрещена: после неё состояние непредсказуемо.','Q<sub>n+1</sub> = S ∨ '+ov('R')+'Q<sub>n</sub>. S=1 sets Q, R=1 resets, both zero — hold. S=R=1 is forbidden: the state afterwards is unpredictable.']],
  from:[['Перекрёстная связь двух усилителей — схема Экклса и Джордана 1918 года, первая электронная ячейка памяти.','Cross-coupling two amplifiers is the 1918 Eccles–Jordan circuit, the first electronic memory cell.']],
  why:[['RS-триггер — память без такта: состояние держится за счёт петли обратной связи. Из этой петли вырастают все остальные триггеры.','The SR latch is clockless memory: the state holds through a feedback loop. Every other flip-flop grows from this loop.']],
  met:[['Первый уровень главы «Память».','The first level of the memory chapter.']]}},
{id:'dffe',cat:'mem',un:{lv:24},lvs:[24],see:['g_dff','reg','sr'],
 t:['D-триггер с разрешением','D flip-flop with enable'],
 lead:['D-триггер, который запоминает только по команде: E=1 разрешает запись.','A D flip-flop that stores only on command: E=1 enables the write.'],
 sec:{
  how:[['Q<sub>n+1</sub> = ED<sub>n</sub> ∨ '+ov('E')+'Q<sub>n</sub>: при E=1 на вход DFF идёт D, при E=0 — старое Q. Вход C у DFF внутри — такт.','Q<sub>n+1</sub> = ED<sub>n</sub> ∨ '+ov('E')+'Q<sub>n</sub>: with E=1 the flip-flop sees D, with E=0 it sees its own Q. The C input of the DFF inside is the clock.']],
  why:[['Разрешение — это запоминание по выбору: из него делают регистры с загрузкой и всю управляемую память.','Enable is selective remembering: load registers and all controlled memory are made from it.']],
  met:[['Уровень «D-триггер с разрешением».','The D flip-flop with enable level.']]}},

/* ---------- Автоматы и регистры ---------- */
{id:'tff',cat:'fsm',un:{lv:34},lvs:[34],see:['g_dff','jk','fdiv'],
 t:['T-триггер','T flip-flop'],
 lead:['Триггер-переключатель: T=1 меняет состояние на противоположное, T=0 хранит.','A toggle flip-flop: T=1 flips the state, T=0 holds it.'],
 sec:{
  how:[['Q<sub>n+1</sub> = Q<sub>n</sub> ⊕ T<sub>n</sub> — D-триггер, у которого на D подан XOR выхода с T.','Q<sub>n+1</sub> = Q<sub>n</sub> ⊕ T<sub>n</sub> — a D flip-flop whose D is fed by an XOR of output and T.']],
  why:[['Переключение на каждую единицу — это деление частоты пополам и младший разряд любого счётчика.','Toggling on every one halves the frequency and forms the lowest digit of every counter.']],
  met:[['Уровень «T-триггер» и все счётчики.','The T flip-flop level and every counter.']]}},
{id:'jk',cat:'fsm',un:{lv:35},lvs:[35],see:['sr','tff'],
 t:['JK-триггер','JK flip-flop'],
 lead:['RS-триггер без запрещённой комбинации: J=K=1 не ломает схему, а переключает её.','An SR flip-flop without the forbidden combination: J=K=1 toggles instead of breaking.'],
 sec:{
  how:[['Q<sub>n+1</sub> = J'+ov('Q<sub>n</sub>')+' ∨ '+ov('K')+'Q<sub>n</sub>. J работает как S, K — как R, а их единица вместе включает режим T.','Q<sub>n+1</sub> = J'+ov('Q<sub>n</sub>')+' ∨ '+ov('K')+'Q<sub>n</sub>. J acts like S, K like R, and both together enable toggle mode.']],
  why:[['Универсальный триггер: из JK делаются D, T и RS простым соединением входов.','The universal flip-flop: D, T and SR are all made from JK by wiring inputs differently.']],
  met:[['Уровень «JK-триггер».','The JK flip-flop level.']]}},
{id:'fdiv',cat:'fsm',un:{lv:25},lvs:[25],see:['tff','cnt'],
 t:['Делитель частоты','Frequency divider'],
 lead:['Каждый триггер в цепочке переключается вдвое реже предыдущего — частота делится пополам за каскад.','Each flip-flop in the chain toggles half as often as the previous one — the frequency halves per stage.'],
 sec:{
  how:[['Т-триггер сам по себе делитель на два: выход меняется раз в два такта. Каскад из n делит на 2ⁿ.','A T flip-flop is itself a divide-by-two: its output changes once per two ticks. A cascade of n divides by 2ⁿ.']],
  why:[['Делители — источник медленных тактов: секунды из миллионов герц кварца получают именно так.','Dividers supply slow clocks: seconds out of a quartz crystal’s megahertz are obtained exactly this way.']],
  met:[['Уровень «Делитель частоты на 4» и «Делитель со сбросом».','The divide-by-4 and divider-with-reset levels.']]}},
{id:'cnt',cat:'fsm',un:{lv:26},lvs:[26,36,38,42,59],see:['fdiv','tff','sreg'],
 t:['Счётчик','Counter'],
 lead:['Цепочка триггеров, которая проходит двоичные числа по кругу — тактовая машина считает такты.','A chain of flip-flops cycling through binary numbers — a clockwork that counts ticks.'],
 sec:{
  how:[['Каждый следующий триггер переключается, когда обнуляется младший каскад — отсюда последовательность 00 → 01 → 10 → 11.','Each further flip-flop toggles when the lower stage rolls over — hence 00 → 01 → 10 → 11.']],
  why:[['Разновидности: счётчик по модулю (до N и сброс — «до трёх»), реверсивный (вверх/вниз по сигналу U), счётчик Джонсона («бегущие огни» — сдвиговый регистр с инвертированной петлёй).','Varieties: modulo counters (to N and reset — the “to three” level), up/down counters (direction from U), the Johnson counter (“running lights” — a shift register with an inverted loop).']],
  met:[['Уровни «Счётчик», «Счётчик до трёх», «Бегущие огни», «Обратный счёт», «Трёхбитный счётчик», «Реверсивный счётчик».','The counter, mod-3, running-lights, countdown, 3-bit and up/down levels.']]}},
{id:'sreg',cat:'fsm',un:{lv:27},lvs:[27,37],see:['g_dff','cnt','reg'],
 t:['Сдвиговый регистр','Shift register'],
 lead:['Цепочка триггеров, двигающая биты на одну позицию за такт.','A chain of flip-flops shifting the bits one position per tick.'],
 sec:{
  how:[['Q<sub>1</sub> ← D, Q<sub>2</sub> ← Q<sub>1</sub>: каждый триггер берёт значение соседа. Данные едут по конвейеру.','Q<sub>1</sub> ← D, Q<sub>2</sub> ← Q<sub>1</sub>: each flip-flop takes its neighbour’s value. Data rides the conveyor.']],
  from:[['Раньше сдвиговые регистры были последовательной памятью; сейчас — преобразователи «последовательное ↔ параллельное» внутри каждого интерфейса.','Shift registers used to be serial memory; now they are the serial↔parallel converters inside every interface.']],
  why:[['На сдвиге стоят линии задержки, бегущие огни (счётчик Джонсона) и последовательный ввод-вывод.','Delay lines, running lights (the Johnson counter) and serial I/O all stand on shifting.']],
  met:[['Уровень «Сдвиговый регистр» и «Бегущие огни».','The shift-register and running-lights levels.']]}},
{id:'reg',cat:'fsm',un:{lv:39},lvs:[39,40],see:['dffe','mux','pcount'],
 t:['Регистр с загрузкой','Load register'],
 lead:['Память с записью по команде: L=1 — принять D, L=0 — хранить Q.','Memory with commanded writes: L=1 takes D, L=0 keeps Q.'],
 sec:{
  how:[['Перед каждым D-триггером стоит мультиплексор: Q<sub>n+1</sub> = L ? D : Q<sub>n</sub>.','A multiplexer in front of every flip-flop: Q<sub>n+1</sub> = L ? D : Q<sub>n</sub>.']],
  why:[['Регистры процессора — это именно такие ячейки, только шире. Команда «загрузить» — единственный способ записать в память осмысленно.','CPU registers are exactly these cells, only wider. A load command is the only sane way to write memory.']],
  met:[['Уровни «Регистр с загрузкой» и «Двухбитный регистр».','The load-register and 2-bit-register levels.']]}},
{id:'fsm',cat:'fsm',un:{lv:57},lvs:[57,58],see:['reg','cnt','pcount'],
 t:['Конечный автомат','Finite state machine'],
 lead:['Схема с конечным набором состояний: состояние в регистре, переходы — комбинационной логикой.','A circuit with a finite set of states: the state lives in a register, the transitions in combinational logic.'],
 sec:{
  how:[['Следующее состояние — функция текущего состояния и входов. Светофор и кодовый замок — автоматы, которые вы собрали руками.','The next state is a function of the current state and inputs. The traffic light and the code lock are automata you built by hand.']],
  why:[['Автомат — способ дать схеме программу без процессора: протокол, контроллер, игра — всё последовательности состояний.','A state machine is a way to give a circuit a program without a processor: protocols, controllers, games — all sequences of states.']],
  met:[['Уровни «Светофор» и «Кодовый замок».','The traffic-light and code-lock levels.']]}},
{id:'pcount',cat:'fsm',un:{lv:60},lvs:[60],see:['cnt','reg','p_neumann'],
 t:['Счётчик команд','Program counter'],
 lead:['Регистр, который обычно прибавляет единицу, а по команде загружает адрес перехода.','A register that normally adds one but can load a jump address on command.'],
 sec:{
  how:[['Q ← L ? D : Q + 1: мультиплексор выбирает между инкрементом и загрузкой — вот и вся «переходная» логика.','Q ← L ? D : Q + 1: a multiplexer chooses between increment and load — that is all the branching logic.']],
  why:[['Счётчик команд — сердце архитектуры фон Неймана: программа лежит в памяти числами-адресами, а счётчик движется по ним.','The program counter is the heart of the von Neumann architecture: the program sits in memory as numbered addresses and the counter walks through them.']],
  met:[['Финальный уровень «Счётчик команд».','The final program-counter level.']]}},

/* ---------- Процессор ---------- */
{id:'alu',cat:'cpu',un:{lv:45},lvs:[45,44,46],see:['mux','flags','twos'],
 t:['АЛУ','ALU'],
 lead:['Арифметико-логическое устройство: один блок, много операций, код F выбирает, что считать.','The arithmetic-logic unit: one block, many operations, the F code picks which to compute.'],
 sec:{
  how:[['Логический блок уровня — микро-АЛУ: F=0 даёт A ∧ B, F=1 даёт A ∨ B. Добавьте сумматор и выбор — получится настоящее АЛУ.','The logic-unit level is a micro-ALU: F=0 gives A ∧ B, F=1 gives A ∨ B. Add an adder and selection — you get a real ALU.']],
  why:[['АЛУ — рабочий стол процессора: все вычисления проходят через него, а остальное — обвязка вокруг.','The ALU is the processor’s workbench: all computation passes through it, everything else is plumbing around it.']],
  met:[['Уровни «Логический блок», «Управляемый инвертор шины», «Сумматор-вычитатель».','The logic-unit, controlled-inverter and adder-subtractor levels.']]}},
{id:'flags',cat:'cpu',un:{lv:48},lvs:[48,49],see:['cmp','alu'],
 t:['Флаги','Flags'],
 lead:['Однобитные заметки о результате операции: ноль ли он, был ли перенос, отрицателен ли.','One-bit notes about an operation’s result: was it zero, did it carry, is it negative.'],
 sec:{
  how:[['Флаг нуля — NOR по всем разрядам результата. Флаги пишутся вместе с результатом и читаются следующей командой — например, «переход, если ноль».','The zero flag is a NOR over all result bits. Flags are written with the result and read by the next instruction — “branch if zero”, for example.']],
  why:[['Флаги — способ, которым АЛУ рассказывает автомату управления, что вышло: без них нет условных переходов.','Flags are how the ALU reports to the control machine what happened: without them there are no conditional branches.']],
  met:[['Уровни «Флаг нуля» и «Больше».','The zero-flag and greater-than levels.']]}},

/* ---------- Люди и история ---------- */
{id:'p_boole',cat:'people',un:{art:'bool'},see:['bool','demorgan'],
 t:['Джордж Буль','George Boole'],
 lead:['Английский математик (1815–1864), автор алгебры, на которой стоит вся цифровая техника.','English mathematician (1815–1864), author of the algebra all digital technology stands on.'],
 sec:{
  from:[['Львиную долю образования получил сам. В «Математическом анализе логики» (1847) и «Законах мышления» (1854) свёл логические высказывания к уравнениям — при жизни его алгебру считали любопытным курьёзом.','Largely self-educated. In The Mathematical Analysis of Logic (1847) and The Laws of Thought (1854) he reduced logical statements to equations — in his lifetime the algebra was seen as a curious oddity.']],
  why:[['Через почти век Шеннон нашёл его алгебре применение в релейных схемах — и имя Буля оказалось в каждом процессоре.','Almost a century later Shannon found his algebra applied to relay circuits — and Boole’s name ended up inside every processor.']]}},
{id:'p_shannon',cat:'people',un:{art:'bool'},see:['bool','bit'],
 t:['Клод Шеннон','Claude Shannon'],
 lead:['Американский инженер и математик (1916–2001), соединивший булеву алгебру с электрическими схемами.','American engineer and mathematician (1916–2001) who joined Boolean algebra to electric circuits.'],
 sec:{
  from:[['В магистерской диссертации Массачусетского технологического института (1937) показал: любая функция релейной схемы вычисляется булевой алгеброй — проектировать схемы стало можно на бумаге.','In his MIT master’s thesis (1937) he showed that any relay circuit’s function is computed by Boolean algebra — circuits could be designed on paper.']],
  why:[['Позже заложил теорию информации (работа 1948 года) и ввёл бит как меру информации. В этой игре вы делаете ровно то, что описал Шеннон: синтезируете схему по желаемой функции.','He later founded information theory (the 1948 paper) and gave us the bit as the unit of information. In this game you do exactly what Shannon described: synthesise a circuit for a desired function.']]}},
{id:'p_sheffer',cat:'people',un:{art:'f_sheffer'},see:['f_sheffer','g_nand','p_peirce'],
 t:['Генри Шеффер','Henry Sheffer'],
 lead:['Американский логик (1882–1964), доказавший, что вся булева логика сводится к одной связке.','American logician (1882–1964) who proved all Boolean logic reduces to a single connective.'],
 sec:{
  from:[['В работе 1913 года ввёл «штрих» — одну связку, через которую выражаются все остальные операции. Сегодня «штрихом Шеффера» называют И-НЕ.','In a 1913 paper he introduced the “stroke”, a single connective through which every other operation can be expressed. Today the name “Sheffer stroke” refers to NAND.']],
  why:[['Его результат — теоретическая подпорка эры микросхем: серии однотипных элементов (тот же И-НЕ в серии 7400) существуют потому, что одной связки достаточно.','His result underpins the chip era: series of identical gates (NAND in the 7400 series) exist because one connective suffices.']]}},
{id:'p_peirce',cat:'people',un:{art:'f_peirce'},see:['f_peirce','g_nor','p_sheffer'],
 t:['Чарльз Сандерс Пирс','Charles Sanders Peirce'],
 lead:['Американский философ и логик (1839–1914), описавший полную связку раньше Шеффера — но не опубликовавший её.','American philosopher and logician (1839–1914) who described a complete connective before Sheffer — but never published it.'],
 sec:{
  from:[['В рукописях около 1880 года ввёл операцию «ни то, ни другое» (теперь ИЛИ-НЕ) и заметил её полноту. Текст увидел свет только в XX веке.','In manuscripts around 1880 he introduced the “neither-nor” operation (now NOR) and noted its completeness. The text saw print only in the 20th century.']],
  why:[['Его «стрелка» — зеркальный близнец штриха Шеффера: у истории полноты два отца, и один из них почти столетие был неизвестен.','His “arrow” is the mirror twin of Sheffer’s stroke: completeness has two fathers, one unknown for almost a century.']]}},
{id:'p_neumann',cat:'people',un:{art:'pcount'},see:['pcount','alu'],
 t:['Джон фон Нейман','John von Neumann'],
 lead:['Математик (1903–1957), чей отчёт описал архитектуру компьютера с программой в памяти — ту, что стоит почти в каждом процессоре.','A mathematician (1903–1957) whose report described the stored-program computer architecture found in nearly every processor.'],
 sec:{
  from:[['«Первый проект отчёта по EDVAC» (1945) закрепил схему: память, где лежат и данные, и команды; процессор с АЛУ; счётчик команд, идущий по инструкциям.','The First Draft of a Report on the EDVAC (1945) fixed the scheme: memory holding both data and instructions, a processor with an ALU, and a program counter walking the instructions.']],
  why:[['Финальная цепочка уровней строит ровно его узлы: регистры, АЛУ, флаги, автомат и счётчик команд — спина любого процессора.','The final run of levels builds exactly his blocks: registers, an ALU, flags, a control machine and a program counter — the spine of any CPU.']]}}
];

const WIKIM={};WIKI.forEach(a=>WIKIM[a.id]=a);

/* ---------- unlock state ---------- */
const wLvTouched=l=>done.has(l.id)||!!saves[l.id];
function wUnlockedNow(a){
  const u=a.un;if(!u)return true;
  if(u.open)return true;
  if(u.gate)return LV.some(l=>l.gates.includes(u.gate)&&wLvTouched(l));
  if(u.lv)return done.has(u.lv);
  if(u.ch)return chapterDone(u.ch);
  if(u.art)return !!(prog.wiki&&prog.wiki[u.art]);
  return false;
}
function wCond(a){
  const u=a.un;
  if(u.gate)return ui('wUnGate',{g:tx(GATES[u.gate].n)});
  if(u.lv)return ui('wUnLv',{l:u.lv+'. '+tx(LV[u.lv-1].t)});
  if(u.ch)return ui('wUnCh',{n:u.ch});
  if(u.art)return ui('wUnArt',{a:tx(WIKIM[u.art].t)});
  return '';
}
function wikiUnlock(id){
  prog.wiki=prog.wiki||{};
  if(prog.wiki[id])return;
  prog.wiki[id]=Date.now();save();wikiBadges();
  toast(ui('wNew',{a:tx(WIKIM[id].t)}),3600);
}
let wRetroDone=false;
function wikiRetro(){
  prog.wiki=prog.wiki||{};
  const silent=!wRetroDone; // the first pass back-fills existing saves quietly, no toast burst
  let again=true;
  while(again){again=false;
    WIKI.forEach(a=>{if(!prog.wiki[a.id]&&wUnlockedNow(a)){if(silent)prog.wiki[a.id]=Date.now();else wikiUnlock(a.id);again=true}});
  }
  wRetroDone=true;
}
/* called from loadLevel: opening a level unlocks the articles of the gates in its palette,
   and re-evaluates everything else (just-solved levels, finished chapters) */
function wikiSeenLevel(l){
  if(!l)return;
  if(l.gates)WIKI.forEach(a=>{if(a.un&&a.un.gate&&l.gates.includes(a.un.gate))wikiUnlock(a.id)});
  wikiRetro();
}
function wikiUnread(){prog.wiki=prog.wiki||{};prog.wikiRd=prog.wikiRd||{};return WIKI.reduce((n,a)=>n+(prog.wiki[a.id]&&!prog.wikiRd[a.id]?1:0),0)}
function wikiBadges(){
  const n=wikiUnread(),d=$('#libDot');
  if(d){d.style.display=n?'':'none';d.textContent=n>9?'9+':n}
  const mm=$('#mmLib');if(mm)mm.textContent=n?ui('wUnread',{n}):'';
}
function wikiRead(id){
  prog.wikiRd=prog.wikiRd||{};
  if(!prog.wikiRd[id]){prog.wikiRd[id]=Date.now();save();wikiBadges()}
}

/* ---------- overlay UI ---------- */
let wikiOn=false,wTab='art',wArtId=null,wHist=[],wFwd=[];
function wikiOpen(){return wikiOn}
function openWiki(tab){
  wikiRetro();
  if(tab)wTab=tab;
  if(!wArtId)wArtId=WIKI.find(a=>prog.wiki&&prog.wiki[a.id]&&!(prog.wikiRd&&prog.wikiRd[a.id]))?.id||WIKI[0].id;
  wikiOn=true;$('#wikiOv').classList.add('on');
  drawWiki();wikiBadges();
}
function closeWiki(){wikiOn=false;$('#wikiOv').classList.remove('on')}
function wArticle(id){
  const a=WIKIM[id];if(!a)return;
  if(!prog.wiki||!prog.wiki[id]){toast(wCond(a)||ui('wLocked'),3000);return}
  if(id!==wArtId){if(wArtId)wHist.push(wArtId);wFwd=[];wArtId=id}
  wikiRead(id);drawWikiArt();drawWikiNav();
}
function wBack(){if(!wHist.length)return;wFwd.push(wArtId);wArtId=wHist.pop();wikiRead(wArtId);drawWikiArt();drawWikiNav()}
function wForw(){if(!wFwd.length)return;wHist.push(wArtId);wArtId=wFwd.pop();wikiRead(wArtId);drawWikiArt();drawWikiNav()}

/* truth table for an article: reuse the level's own vec, a declared tt, or the gate's f */
function wTTlv(a){
  if(a.ttLv)return LV[a.ttLv-1];
  if(a.tt){const outs=a.tt.outs||['Y'];return{ins:a.tt.ins,outs,vec:comb(a.tt.ins,i=>{const v=a.tt.f(i),o={};outs.forEach((k,j)=>o[k]=v[j]);return o})}}
  if(a.gate){const G=GATES[a.gate],ins=G.ins===1?['A']:['A','B'];
    return{ins,outs:['Y'],vec:comb(ins,i=>({Y:G.f(ins.map(k=>i[k]))[0]}))}}
  return null;
}
function wGateBlock(a){
  const t=a.gate,G=GATES[t];
  return `<div class="wgate"><svg viewBox="-2 -2 64 ${G.h+4}">${gateSVG(t,settings.gost)}</svg>
    <div class="wgn"><b>${esc(tx(G.n))}</b><span>${esc(G.n[1])}</span></div></div>`;
}
function drawWikiArt(){
  const doc=$('#wkDoc');if(!doc)return;
  const a=WIKIM[wArtId],un=prog.wiki&&prog.wiki[a.id];
  const nav=`<div class="wkArrows"><button class="ib" id="wkBack" ${wHist.length?'':'disabled'}><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>
    <button class="ib" id="wkFwd" ${wFwd.length?'':'disabled'}><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>
    <span class="wkCat">${esc(tx(WCATS.find(c=>c[0]===a.cat)[1]))}</span></div>`;
  if(!un){doc.innerHTML=nav+`<h1 class="wt">???</h1><p class="wlead">${ui('wLockedArt')}</p><p class="wcond">${esc(wCond(a))}</p>`}
  else{
    const lv=wTTlv(a);
    const secs=[['how','wHow'],['from','wFrom'],['why','wWhy'],['met','wMet']]
      .filter(([k])=>a.sec&&a.sec[k]&&a.sec[k].length)
      .map(([k,u])=>`<h3>${ui(u)}</h3>${a.sec[k].map(p=>`<p>${mathHTML(tx(p))}</p>`).join('')}`).join('');
    const extra=(a.sec&&a.sec.sec2?a.sec.sec2.map(p=>`<p>${mathHTML(tx(p))}</p>`).join(''):'');
    doc.innerHTML=nav+`
      <h1 class="wt">${esc(tx(a.t))}</h1><p class="wlead">${mathHTML(tx(a.lead))}</p>
      ${a.gate?wGateBlock(a):''}
      ${a.f?`<div class="wf math">${mathHTML(a.f)}</div>`:''}
      ${lv?`<div class="wtt">${qTT(lv)}</div>`:''}
      ${secs}${extra}
      ${a.see&&a.see.length?`<h3>${ui('wSee')}</h3><p class="wsee">${a.see.map(id=>{
        const s=WIKIM[id],ok=prog.wiki&&prog.wiki[id];
        return `<a class="wlk${ok?'':' wlk-off'}" data-w="${id}" title="${ok?'':esc(wCond(s))}">${ok?esc(tx(s.t)):'???'}</a>`}).join('')}</p>`:''}
      ${a.lvs&&a.lvs.length?`<h3>${ui('wLvs')}</h3><div class="wlvs">${a.lvs.map(n=>{
        const l=LV[n-1];return l?`<button class="wlv" data-wlv="${n}" ${available(l)?'':'disabled'}>${l.id}. ${esc(tx(l.t))}${done.has(l.id)?' ✓':''}</button>`:''}).join('')}</div>`:''}`;
  }
  $('#wkBack').onclick=wBack;$('#wkFwd').onclick=wForw;
  doc.parentElement.scrollTop=0;
}
function drawWikiNav(){
  const q=($('#wkQ').value||'').toLowerCase(),list=$('#wkList');if(!list)return;
  const un=a=>prog.wiki&&prog.wiki[a.id],rd=a=>prog.wikiRd&&prog.wikiRd[a.id];
  list.innerHTML=WCATS.map(([c,nm])=>{
    const items=WIKI.filter(a=>a.cat===c&&(!q||tx(a.t).toLowerCase().includes(q)||a.id===wArtId));
    if(!items.length)return '';
    return `<div class="wcat"><b>${esc(tx(nm))}</b>${items.map(a=>{
      const u=un(a);
      return `<a class="wnav${a.id===wArtId?' on':''}${u?'':' off'}" data-w="${a.id}" title="${u?'':esc(wCond(a))}">${u?esc(tx(a.t)):'???'}${u&&!rd(a)?'<i class="wd"></i>':''}</a>`}).join('')}</div>`;
  }).join('');
}
function drawWiki(){
  $('#wkQ').placeholder=ui('wSearch');
  $$('#wikiOv .wkt').forEach(b=>b.classList.toggle('on',b.dataset.wt===wTab));
  $('#wkArtV').style.display=wTab==='art'?'':'none';
  $('#wkMyV').style.display=wTab==='my'?'':'none';
  if(wTab==='art'){drawWikiNav();drawWikiArt()}else drawLib();
}

document.addEventListener('click',e=>{
  const wt=e.target.closest('.wkt');if(wt&&wt.closest('#wikiOv')){wTab=wt.dataset.wt;drawWiki();sfx('ui');return}
  const w=e.target.closest('[data-w]');if(w&&w.closest('#wikiOv')){wArticle(w.dataset.w);sfx('ui');return}
  const lv=e.target.closest('[data-wlv]');if(lv&&lv.closest('#wikiOv')){
    const l=LV[+lv.dataset.wlv-1];if(l&&available(l)){closeWiki();closeMenu();loadLevel(l)}return}
});
$('#wkQ').addEventListener('input',drawWikiNav);
$('#wkX').onclick=closeWiki;
$('#wikiOv').addEventListener('pointerdown',e=>{if(e.target.classList.contains('wkBack'))closeWiki()});

Object.assign(UIS,{
  wTabArt:['Статьи','Articles'],wTabMy:['Мои схемы','My circuits'],
  wSearch:['Поиск по статьям…','Search articles…'],
  wHow:['Как работает','How it works'],wFrom:['Откуда взялся','Where it came from'],
  wWhy:['Зачем это знать','Why it matters'],wMet:['Где встречается','Where you meet it'],
  wSee:['См. также','See also'],wLvs:['Связанные уровни','Related levels'],
  wNew:['Новая статья в библиотеке: «{a}»','New library article: “{a}”'],
  wUnread:['новых: {n}','{n} new'],wLocked:['Статья ещё не открыта','This article is still locked'],
  wLockedArt:['Эта статья ещё закрыта.','This article is still locked.'],
  wUnGate:['откроется: встретьте элемент «{g}»','unlocks: meet the “{g}” gate'],
  wUnLv:['откроется: пройдите уровень «{l}»','unlocks: solve level “{l}”'],
  wUnCh:['откроется: завершите главу {n}','unlocks: finish chapter {n}'],
  wUnArt:['откроется вместе со статьёй «{a}»','unlocks with the article “{a}”']
});
