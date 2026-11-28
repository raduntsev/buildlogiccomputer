const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync('/mnt/d/DITK/buildlogiccomputer/web/index.html', 'utf8');
const js = html.match(/<script>([\s\S]*)<\/script>/)[1];
const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://localhost/' });
const w = dom.window;
w.matchMedia = w.matchMedia || (q => ({ matches: false, addListener() {}, removeListener() {} }));
w.AudioContext = w.webkitAudioContext = function () {
  return {
    createOscillator() { return { connect() {}, start() {}, stop() {}, frequency: { value: 0 }, type: '' } },
    createGain() { return { connect() {}, gain: { value: 0, setTargetAtTime() {}, linearRampToValueAtTime() {} } } },
    destination: {}, currentTime: 0, state: 'running', resume() {}
  };
};
w.HTMLCanvasElement.prototype.getContext = () => null;
w.navigator.vibrate = () => {};
try {
  w.eval(js);
  console.log('BOOT OK');
} catch (e) {
  console.log('BOOT ERR:', e.message);
  console.log((e.stack || '').split('\n').slice(0, 4).join('\n'));
  process.exit(1);
}
try {
  const r = w.eval(`(()=>{
    const out=[];
    saves[7]={gates:[{id:'g1',type:'XOR',x:200,y:100}],wires:[
      {id:'w2',from:{g:'I0',p:0},to:{g:'g1',p:0},pts:[]},
      {id:'w3',from:{g:'I1',p:0},to:{g:'g1',p:1},pts:[]},
      {id:'w4',from:{g:'g1',p:0},to:{g:'O0',p:0},pts:[]}]};
    done.add(7);save();
    blkRegisterAll();
    out.push('B7 registered='+!!GATES.B7);
    if(GATES.B7){
      const f=GATES.B7.f;
      out.push('xor tbl: '+[[0,0],[0,1],[1,0],[1,1]].map(v=>f(v)[0]).join(''));
      out.push('pins: i='+JSON.stringify(gPins('B7').i)+' o='+JSON.stringify(gPins('B7').o));
    }
    loadLevel(LV[7]);
    out.push('lv8 gates has B7='+level.gates.includes('B7'));
    loadLevel(LV[0]);
    out.push('lv1 gates has B7='+level.gates.includes('B7'));
    loadLevel(SANDBOX);
    out.push('sandbox has B7='+level.gates.includes('B7'));
    C={gates:[{id:'g1',type:'B7',x:200,y:100}],wires:[
      {id:'w2',from:{g:'I0',p:0},to:{g:'g1',p:0},pts:[]},
      {id:'w3',from:{g:'I1',p:0},to:{g:'g1',p:1},pts:[]},
      {id:'w4',from:{g:'g1',p:0},to:{g:'O0',p:0},pts:[]}]};
    const res=[];
    for(const ab of [[0,0,0],[0,1,0],[1,0,0],[1,1,0]]){
      resetSim();settle(ab);res.push(readOuts().X|0);
    }
    out.push('block sim (xor of A,B)='+res.join('')+' expect 0110');
    return out.join('\\n');
  })()`);
  console.log(r);
} catch (e) {
  console.log('TEST ERR:', e.message, (e.stack || '').split('\n')[1] || '');
}
