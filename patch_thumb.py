s = open('/mnt/d/DITK/buildlogiccomputer/src/lib.js', encoding='utf-8').read()
start = s.index('function libThumb(e){')
end = s.index('function libExport(e){')
new = '''function libThumb(e){
  const xs=[],ys=[];
  e.gates.forEach(g=>{xs.push(g.x,g.x+56);ys.push(g.y,g.y+40)});
  if(!xs.length)return '<svg class="lt" viewBox="0 0 120 72"></svg>';
  const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
  const w=Math.max(1,x1-x0),h=Math.max(1,y1-y0),s=Math.min(104/w,56/h);
  const ox=(120-w*s)/2-x0*s,oy=(72-h*s)/2-y0*s;
  const gp=id=>{if(id.startsWith('I'))return[x0-46,y0];if(id.startsWith('O'))return[x1+46,y0];const g=e.gates.find(x=>x.id===id);return g?[g.x+28,g.y+20]:[x0,y0]};
  let out='';
  e.wires.forEach(ww=>{
    const a=gp(ww.from.g),b=gp(ww.to.g);
    out+=`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="var(--dim)" stroke-width="1.4" opacity=".55" vector-effect="non-scaling-stroke"/>`;
  });
  e.gates.forEach(g=>{
    out+=`<rect x="${g.x}" y="${g.y}" width="56" height="40" rx="9" fill="var(--paper,#fff)" stroke="var(--ink)" stroke-width="2" vector-effect="non-scaling-stroke"/>
      <text x="${g.x+28}" y="${g.y+25}" text-anchor="middle" font-size="${15/s}" fill="var(--ink)">${(GATES[g.type]?tx(GATES[g.type].n):g.type).slice(0,3)}</text>`;
  });
  return `<svg class="lt" viewBox="0 0 120 72"><g transform="translate(${ox},${oy}) scale(${s})">${out}</g></svg>`;
}
'''
s = s[:start] + new + s[end:]
open('/mnt/d/DITK/buildlogiccomputer/src/lib.js', 'w', encoding='utf-8').write(s)
print('ok')
