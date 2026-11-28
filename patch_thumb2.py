s = open('/mnt/d/DITK/buildlogiccomputer/src/lib.js', encoding='utf-8').read()
old = 'font-size="${15/s}"'
assert s.count(old) == 1
s = s.replace(old, 'font-size="15"', 1)

# pluralised gate count in the card subtitle
old2 = "${esc(e.io.ins.join(''))} → ${esc(e.io.outs.join(''))} · ${e.gates.length} ${ui('hGates')}"
assert s.count(old2) == 1
s = s.replace(old2, "${esc(e.io.ins.join(''))} → ${esc(e.io.outs.join(''))} · ${gateN(e.gates.length)}", 1)

# helper near the top
anchor = 'function libEntries(){prog.lib=prog.lib||[];return prog.lib}'
assert s.count(anchor) == 1
s = s.replace(anchor, anchor + '''
function gateN(n){
  if(LANG==='en')return n+' '+(n===1?'gate':'gates');
  const a=n%10,b=n%100;
  return num(n)+' '+(a===1&&b!==11?'элемент':a>=2&&a<=4&&(b<10||b>=20)?'элемента':'элементов');
}''', 1)
open('/mnt/d/DITK/buildlogiccomputer/src/lib.js', 'w', encoding='utf-8').write(s)
print('ok')
