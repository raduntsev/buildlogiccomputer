s = open('/mnt/d/DITK/buildlogiccomputer/src/editor.js', encoding='utf-8').read()
old = 'function persist(){saves[level.id]={gates:C.gates,wires:C.wires};if(C.io)saves[level.id].io=C.io;'
assert s.count(old) == 1
s = s.replace(old, 'function persist(){saves[level.id]={gates:C.gates,wires:C.wires};if(C.io)saves[level.id].io=C.io;if(level.sandbox)saves[level.id].sbio={ins:level.ins.slice(),outs:level.outs.slice()};', 1)
old2 = """  level=l;knifeSet(false);$('#result').classList.remove('on');
  const s=saves[l.id];"""
assert s.count(old2) == 1
s = s.replace(old2, """  if(l.sandbox&&saves[l.id]&&saves[l.id].sbio){l.ins=saves[l.id].sbio.ins.slice();l.outs=saves[l.id].sbio.outs.slice()}
  level=l;knifeSet(false);$('#result').classList.remove('on');
  const s=saves[l.id];""", 1)
open('/mnt/d/DITK/buildlogiccomputer/src/editor.js', 'w', encoding='utf-8').write(s)
print('editor ok')

c = open('/mnt/d/DITK/buildlogiccomputer/src/style.css', encoding='utf-8').read()
c += '''
/* circuit library */
.lib-save{display:flex;gap:8px;align-items:center;margin-bottom:14px;padding:10px 12px}
.lib-save input{flex:1;min-width:0;border:1.5px solid var(--line);border-radius:10px;padding:8px 10px;font:inherit;background:var(--bg);color:var(--ink)}
.lib-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px}
.lib-card{background:var(--card);border:1.5px solid var(--line);border-radius:14px;padding:10px;display:flex;flex-direction:column;gap:6px}
.lt{width:100%;height:86px;background:var(--bg);border-radius:9px}
.lib-nm{font-size:14px}
.lib-io{font-size:11px;color:var(--dim)}
.lib-acts{display:flex;gap:6px;flex-wrap:wrap}
.lib-acts .tbtn{font-size:12px;padding:5px 9px}
.lib-empty{color:var(--dim);max-width:420px;line-height:1.5}
.tbtn.danger{color:var(--coral)}
'''
open('/mnt/d/DITK/buildlogiccomputer/src/style.css', 'w', encoding='utf-8').write(c)
print('css ok')
