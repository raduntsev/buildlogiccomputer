m = open('/mnt/d/DITK/buildlogiccomputer/src/meta.js', encoding='utf-8').read()

# register/refresh the block right when the level is solved and tell the player about it
old = """  done.add(id);save();updHud();$('#lvStars').innerHTML=starsHTML(ns);"""
assert m.count(old) == 1
m = m.replace(old, """  done.add(id);save();updHud();$('#lvStars').innerHTML=starsHTML(ns);
  const becameBlk=!level.seq&&!level.clk&&C.gates.length&&(first||!GATES[blkType(level)]);
  if(!level.seq&&!level.clk&&C.gates.length)try{blkRefresh(level)}catch(e){}""", 1)

old = """  const lines=[{t:pick(bits===7?STORY.win3:STORY.win),m:bits===7?'smug':'happy'}];"""
assert m.count(old) == 1
m = m.replace(old, """  const lines=[{t:pick(bits===7?STORY.win3:STORY.win),m:bits===7?'smug':'happy'}];
  if(becameBlk)lines.push({t:STORY.blkNew,m:'happy'});""", 1)

# story line as a plain assignment at the end of the file
m += """
STORY.blkNew=['Эта схема стала блоком: вы найдёте её на полке в следующих уровнях и в песочнице. Эту схему вы будете использовать дальше — Машина запоминает всё.','This circuit is now a block: you will find it on the shelf in later levels and in the sandbox. You will use it again — the Machine remembers everything.'];
"""
open('/mnt/d/DITK/buildlogiccomputer/src/meta.js', 'w', encoding='utf-8').write(m)
print('meta ok')
