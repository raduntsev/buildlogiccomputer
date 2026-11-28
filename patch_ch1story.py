s = open('/mnt/d/DITK/buildlogiccomputer/src/content.js', encoding='utf-8').read()

old = """    1:['Первый провод. Соедините флажок A с лампой Y. Это проще, чем кажется. Хотя вам, возможно, покажется сложнее.','First wire. Connect flag A to lamp Y. It is easier than it looks. Although to you it may look harder.'],
    2:['Элемент НЕ. Говорит «нет» на всё. Мы с ним похожи.','The NOT gate. It says “no” to everything. We have a lot in common.'],
    3:['Элемент И выдаёт единицу, только если оба входа согласны. Строгий. Уважаю.','AND outputs one only when both inputs agree. Strict. I respect that.'],
    4:['Элементу ИЛИ хватает одной единицы. Низкие стандарты. Но кто я такой, чтобы судить? А, точно: я тот, кто судит.','OR is happy with a single one. Low standards. But who am I to judge? Oh, right: I am the one who judges.'],"""
assert s.count(old) == 1
s = s.replace(old, """    1:['Монтажник перепутал три провода и уволился. Записываю в протокол: «уволен за провода». Разберите, что куда идёт.','The wiring technician mixed up three cables and quit. Logging: “fired over wires”. Figure out what goes where.'],
    2:['Элемент НЕ. Говорит «нет» на всё. Мы с ним похожи. Здесь их понадобится два.','The NOT gate. It says “no” to everything. We have a lot in common. You will need two of them here.'],
    3:['Вход B — блокировка: пока он горит, лампе ничего не светит. Элемент И строгий, а с инверсией — ещё строже. Уважаю.','Input B is an inhibit line: while it is lit, the lamp gets nothing. AND is strict, and with inversion even stricter. I respect that.'],
    4:['Импликация: лампа повторяет B, а при погашенном A горит всегда. Звучит как мой трудовой контракт.','Implication: the lamp follows B, and while A is dark it is always lit. Sounds like my employment contract.'],""", 1)

open('/mnt/d/DITK/buildlogiccomputer/src/content.js', 'w', encoding='utf-8').write(s)
print('content ok')
