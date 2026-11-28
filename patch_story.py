m = open('/mnt/d/DITK/buildlogiccomputer/src/meta.js', encoding='utf-8').read()

# after a passed chapter test the machine unit comes online: a protocol entry from Bit
old = """    if(pass){badge('QUIZ_FIRST');if(z.score===5)badge('QUIZ_PERFECT');if(CHAPTERS.every((_,i)=>quizPassed(i+1)))badge('QUIZ_ALL')}
    say([{t:pass?(z.score===5?STORY.quizPerfect:STORY.quizPass):STORY.quizFail,m:pass?'happy':'sad'}],{u:1});"""
assert m.count(old) == 1
m = m.replace(old, """    if(pass){badge('QUIZ_FIRST');if(z.score===5)badge('QUIZ_PERFECT');if(CHAPTERS.every((_,i)=>quizPassed(i+1)))badge('QUIZ_ALL')}
    const ql=[{t:pass?(z.score===5?STORY.quizPerfect:STORY.quizPass):STORY.quizFail,m:pass?'happy':'sad'}];
    if(pass&&!old.pass){const on=CHAPTERS.filter((_,i)=>quizPassed(i+1)).length;
      ql.push({t:fmt(tx(STORY.quizUnit),{u:tx(MUNITS[z.ch-1]).toLowerCase(),n:on,N:10}),m:'happy'})}
    say(ql,{u:1});""", 1)

m += """
STORY.quizUnit=['Записываю в протокол: узел «{u}» проверен и включён. Машина оживает: {n} из {N} узлов на питании.','Logging to the protocol: the “{u}” unit is tested and online. The Machine is waking up: {n} of {N} units powered.'];
"""
open('/mnt/d/DITK/buildlogiccomputer/src/meta.js', 'w', encoding='utf-8').write(m)
print('meta ok')
