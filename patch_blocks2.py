s = open('/mnt/d/DITK/buildlogiccomputer/patch_blocks.py', encoding='utf-8').read()

# blkRegisterAll() must not run at eval time: done/saves are declared later in the file.
# Make registration incremental and call it from loadLevel instead; force-refresh on solve.
old = """function blkRegister(lv){
  const t=blkType(lv);
  const rows=blkTable(lv);"""
assert s.count(old) == 1
s = s.replace(old, """function blkRegister(lv){
  const t=blkType(lv);
  if(GATES[t])return;
  const rows=blkTable(lv);""", 1)

old = """function blkTypesFor(l){
  return blkList().filter(b=>l.sandbox||b.id<l.id).map(blkType);
}
blkRegisterAll();"""
assert s.count(old) == 1
s = s.replace(old, """function blkTypesFor(l){
  return blkList().filter(b=>l.sandbox||b.id<l.id).map(blkType);
}
function blkRefresh(lv){delete GATES[blkType(lv)];blkRegister(lv)}""", 1)

# call registration inside loadLevel
old = """function loadLevel(l){
  if(l.sandbox)l.gates=sandboxGates();
  if(!l.gates0)l.gates0=(l.gates||[]).slice();"""
assert s.count(old) == 1
s = s.replace(old, """function loadLevel(l){
  if(l.sandbox)l.gates=sandboxGates();
  blkRegisterAll();
  if(!l.gates0)l.gates0=(l.gates||[]).slice();""", 1)

open('/mnt/d/DITK/buildlogiccomputer/patch_blocks.py', 'w', encoding='utf-8').write(s)
print('patch updated')
