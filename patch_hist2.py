h = open('/mnt/d/DITK/buildlogiccomputer/src/body.html', encoding='utf-8').read()
old = '<div id="task"><div id="taskText"></div><div id="hint"></div></div>'
assert h.count(old) == 1
h = h.replace(old, '<div id="task"><div id="taskText"></div><div id="hint"></div><div id="hist"></div></div>', 1)
open('/mnt/d/DITK/buildlogiccomputer/src/body.html', 'w', encoding='utf-8').write(h)
print('body ok')

s = open('/mnt/d/DITK/buildlogiccomputer/src/editor.js', encoding='utf-8').read()
old = "  $('#taskText').innerHTML=mathHTML(tx(level.task));\n  hintPanelDraw();"
assert s.count(old) == 1
s = s.replace(old, "  $('#taskText').innerHTML=mathHTML(tx(level.task));\n  hintPanelDraw();histDraw();", 1)

# histDraw next to hintPanelDraw
anchor = 'function insertSynth(){'
assert s.count(anchor) == 1
s = s.replace(anchor, '''function histDraw(){
  const el=$('#hist');if(!el||!level)return;
  if(!level.sandbox&&level.hist&&done.has(level.id)){
    el.innerHTML=`<div class="histin"><b>${ui('histH')}</b><span>${tx(level.hist)}</span></div>`;
    el.classList.add('on');
  }else{el.innerHTML='';el.classList.remove('on')}
}
function insertSynth(){''', 1)

# ui string
old2 = "/* ========== bench: manual ticks, tick log, sandbox analysis ==========*/"
assert s.count(old2) == 1
s = s.replace(old2, """Object.assign(UIS,{histH:['Из протокола','From the protocol']});
/* ========== bench: manual ticks, tick log, sandbox analysis ==========*/""", 1)
open('/mnt/d/DITK/buildlogiccomputer/src/editor.js', 'w', encoding='utf-8').write(s)
print('editor ok')

c = open('/mnt/d/DITK/buildlogiccomputer/src/style.css', encoding='utf-8').read()
c += '''
/* historical note */
#hist{display:none;margin-top:8px}
#hist.on{display:block}
.histin{border-left:2px solid var(--acc);padding:6px 10px;background:var(--card2);border-radius:0 9px 9px 0;font-size:12.5px;line-height:1.45;color:var(--ink2)}
.histin b{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--dim);margin-bottom:2px}
'''
open('/mnt/d/DITK/buildlogiccomputer/src/style.css', 'w', encoding='utf-8').write(c)
print('css ok')

m = open('/mnt/d/DITK/buildlogiccomputer/src/meta.js', encoding='utf-8').read()
old3 = "  done.add(id);save();updHud();"
assert m.count(old3) == 1
m = m.replace(old3, "  done.add(id);save();updHud();histDraw();", 1)
open('/mnt/d/DITK/buildlogiccomputer/src/meta.js', 'w', encoding='utf-8').write(m)
print('meta ok')
