"use strict";
/* ========== helpers ========== */
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const GRID=20, GW=60;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const snap=(v,s=GRID)=>Math.round(v/s)*s;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const ov=s=>`<span class="ov">${s}</span>`;
const subH=s=>String(s).replace(/^(.+?)(\d+)$/,'$1<sub>$2</sub>');
const subS=s=>String(s).replace(/^(.+?)(\d+)$/,'$1<tspan font-size="10" dy="4">$2</tspan>');
const fmt=(s,o)=>s.replace(/\{(\w+)\}/g,(_,k)=>o[k]!=null?o[k]:'');
const num=n=>Number(n).toLocaleString(LANG==='en'?'en-US':'ru-RU');

/* ========== storage: autosave ==========
   Browser: localStorage. Desktop (Electron): one JSON file in the user data folder,
   written 0.4 s after the last change and on exit. That file is what Steam Auto-Cloud syncs. */
const store=(()=>{
  const D=window.desktop;let mem=null,t=null;
  if(D&&D.loadSave){try{mem=JSON.parse(D.loadSave()||'{}')||{}}catch(e){mem={}}}
  // timed saves go out asynchronously so the game never waits on the disk; on exit the write is synchronous
  const flush=sync=>{clearTimeout(t);t=null;if(mem&&D)try{(sync!==true&&D.writeSaveAsync?D.writeSaveAsync:D.writeSave)(JSON.stringify(mem))}catch(e){}};
  if(mem)window.addEventListener('beforeunload',()=>flush(true));
  return{
    get(k,d){if(mem)return k in mem?JSON.parse(JSON.stringify(mem[k])):d;try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},
    set(k,v,quiet){if(mem){mem[k]=JSON.parse(JSON.stringify(v));clearTimeout(t);t=setTimeout(flush,400)}else{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}if(!quiet&&window.savedPing)savedPing()},
    wipe(keys){keys.forEach(k=>{if(mem)delete mem[k];else try{localStorage.removeItem(k)}catch(e){}});if(mem)flush()},
    flush
  };
})();

/* ========== language ========== */
let LANG=(()=>{const s=store.get('ll_set',{});if(s.lang)return s.lang;
  const sl=window.desktop&&window.desktop.steamLang&&window.desktop.steamLang();
  if(sl)return /russian|ukrainian|belarus/i.test(sl)?'ru':'en';
  return /^(ru|uk|be|kk)/i.test(navigator.language||'')?'ru':'en'})();
const tx=x=>Array.isArray(x)?x[LANG==='en'?1:0]:(x==null?'':x);
const UIS={
  menu:['Меню','Menu'],undo:['Отменить','Undo'],redo:['Вернуть','Redo'],clear:['Очистить','Clear'],verify:['Проверить','Test'],skip:['Пропустить','Skip'],
  fit:['Вписать','Fit'],hint:['Подсказка','Hint'],hintCost:['Подсказка −★','Hint −★'],saved:['сохранено','saved'],
  cont:['Продолжить','Continue'],levels:['Уровни','Levels'],sandbox:['Песочница','Sandbox'],settings:['Настройки','Settings'],about:['Об игре','About'],
  profile:['Личное дело','Personnel file'],back:['Назад','Back'],ttHide:['Скрыть таблицу','Hide table'],wcol:['Цвет провода','Wire colour'],wnote:['Подпись провода','Wire label'],netInsp:['Инспектор цепи','Net inspector'],netT:['Цепь','Net'],pinI:['вход','in'],pinO:['выход','out'],netFrom:['Откуда','From'],netTo:['Куда','To'],netCol:['Цвет цепи','Net colour'],netNotes:['Подписи','Labels'],wnotePh:['Подпись (Enter — сохранить)','Label (Enter to save)'],wcolDef:['Обычный','Default'],wc_r:['Красный','Red'],wc_o:['Оранжевый','Orange'],wc_g:['Зелёный','Green'],wc_b:['Синий','Blue'],wc_v:['Фиолетовый','Violet'],toolsHide:['Свернуть инструменты','Collapse tools'],toolsShow:['Показать инструменты','Show tools'],ttShow:['Показать таблицу','Show table'],ttMove:['Перетащите, чтобы переместить. Двойной щелчок вернёт на место','Drag to move. Double-click to put it back'],quit:['Выйти','Quit'],brandSub:['логические элементы и цифровые схемы','logic gates and digital circuits'],
  aboutT1:['Этой ночью Машина в лаборатории погасла. Её управляющий бит по имени Бит назначил вас испытуемым и требует собрать Машину заново: от одного провода до счётчика команд.','Last night the lab’s Machine went dark. Its control bit, named Bit, has appointed you test subject and demands that you rebuild it, from a single wire to a program counter.'],
  aboutT2:['Тяните от точки — получится провод. Клик по пустому месту во время прокладки — изгиб. Тяните от провода — ответвление. Правый клик или свайп поперёк провода — удалить. Ctrl+Z — отменить.','Drag from a dot to lay a wire. Click empty space while routing to add a bend. Drag from a wire to branch it. Right-click or swipe across a wire to delete it. Ctrl+Z undoes.'],
  reset:['Сбросить прогресс','Reset progress'],resetSure:['нажмите ещё раз','click again'],progReset:['Прогресс сброшен','Progress reset'],
  tick:['такт','tick'],step:['шаг','step'],
  shortToast:['Два провода на одном входе — короткое замыкание','Two wires on one input: short circuit'],shortFirst:['Сначала уберите короткое замыкание','Remove the short circuit first'],
  emptyToast:['Схема пуста','The circuit is empty'],limitToast:['Лимит элементов: {m}','Element limit: {m}'],
  correct:['Принято','Accepted'],mismatch:['На доработку','Rework'],stampSub:['ОТК, контролёр Бит','QC, inspector Bit'],gatesN:['Элементов: {n}','Gates: {n}'],parN:['рекорд Бита: {p}','Bit’s record: {p}'],
  mismatchN:['Не совпало строк: {f} из {n}','Rows failed: {f} of {n}'],pts:['+{p} очков','+{p} points'],noNewPts:['новых очков нет','no new points'],
  stay:['Остаться','Stay'],next:['Следующий уровень','Next level'],fix:['Исправить','Fix it'],toQuiz:['Контрольный тест','Take the test'],
  starSolved:['решено','solved'],starNoHint:['без подсказок','no hints'],starPar:['не больше {p} эл.','{p} gates or fewer'],
  unlocksAfter:['откроется после: {r}','unlocks after: {r}'],testN:['тест {n}','test {n}'],quizNode:['Контрольный тест','Checkpoint test'],
  quizTitle:['Контрольное испытание, глава {n}','Checkpoint test, chapter {n}'],qOf:['Вопрос {i} из {n}','Question {i} of {n}'],
  qNext:['Следующий вопрос','Next question'],qDone:['Результат','Result'],qScore:['{s} из {n}','{s} of {n}'],qPass:['Зачёт','Passed'],qFail:['Не зачёт','Failed'],
  qRetry:['Пройти ещё раз','Try again'],qLocked:['Сначала пройдите все уровни главы','Finish every level in the chapter first'],
  rank:['Допуск','Clearance'],points:['Очки','Points'],toNext:['до «{r}»: {p}','to “{r}”: {p}'],maxRank:['высший допуск','top clearance'],
  stLevels:['Уровни','Levels'],stStars:['Звёзды','Stars'],stTests:['Тесты','Tests'],stBadges:['Бейджи','Badges'],badgesH:['Бейджи','Badges'],
  badgeToast:['Бейдж: {b}','Badge: {b}'],rankToast:['Новый допуск: {r}','New clearance: {r}'],
  log:['Журнал','Log'],logEmpty:['Пока пусто.','Nothing yet.'],more:['щёлкните, чтобы продолжить','click to continue'],bitName:['Бит','Bit'],chan:['канал связи','comm link'],
  cGo:['Приступаю','On it'],cWhat:['Что тут нужно сделать?','What do I do here?'],cQuiet:['Можно без комментариев?','No comments, please?'],
  cHint:['Подсказка (−★)','Hint (−★)'],cHintFree:['Подсказка','Hint'],cStats:['Как я справляюсь?','How am I doing?'],cFact:['Расскажи что-нибудь','Tell me something'],
  cMute:['Помолчи','Be quiet'],cUnmute:['Можешь говорить','You may talk'],cNothing:['Ничего','Nothing'],cHelp:['Подскажи (−★)','Give me a hint (−★)'],cSelf:['Сам разберусь','I’ll figure it out'],
  listen:['Слушаю. Внимательно и с подозрением.','Listening. Attentively and with suspicion.'],selfR:['Смелое заявление. Записываю.','A bold statement. Logged.'],
  unmuteR:['Наконец-то. Я как раз накопил комментарии.','Finally. I have been saving up comments.'],
  fsDenied:['Полный экран не разрешён','Fullscreen was refused'],fsNA:['Полный экран здесь недоступен','Fullscreen is not available here'],
  gScreen:['Экран','Display'],gSound:['Звук','Sound'],gGame:['Игра','Game'],
  sLang:['Язык','Language'],sUi:['Масштаб интерфейса','Interface scale'],sWin:['Размер окна','Window size'],sFs:['Полный экран','Fullscreen'],
  sWw:['Толщина проводов','Wire thickness'],sGrid:['Сетка','Grid'],sHc:['Контраст','Contrast'],sCalm:['Анимации','Animations'],sHc2:['Высокий контраст','High contrast'],knife:['Ножницы','Scissors'],close:['Закрыть','Close'],tlNew:['новый','new'],tlLock:['закрыт','locked'],delete:['Удалить','Delete'],knifeOn:['Ножницы включены: проведите по проводам и элементам','Scissors on: swipe across wires and gates'],
  sbMore:['Ещё {n} откроются в уровнях','{n} more unlock in levels'],touchTip:['Удалить элемент или провод: коснитесь его и нажмите «Удалить». Или включите ножницы и проведите пальцем.','To delete a gate or wire, tap it and press “Delete”, or turn on the scissors and swipe.'],
  gKeys:['Управление','Controls'],kPress:['нажмите клавишу…','press a key…'],kReset:['Сбросить клавиши','Reset keys'],kTaken:['Клавиша {k} уже занята: «{a}»','{k} is already used by “{a}”'],
  kMouse:['Мышь и касания','Mouse and touch'],
  k_undo:['Отменить','Undo'],k_redo:['Вернуть','Redo'],k_del:['Удалить выбранное','Delete selection'],k_verify:['Проверить схему','Test the circuit'],k_menu:['Меню / отмена','Menu / cancel'],
  k_selall:['Выделить всё','Select all'],k_fit:['Вписать схему','Fit to screen'],k_zin:['Приблизить','Zoom in'],k_zout:['Отдалить','Zoom out'],k_hint:['Подсказка','Hint'],k_knife:['Ножницы','Scissors'],k_sheet:['Скрыть или показать задание','Hide or show the task'],k_bit:['Позвать Бита','Call Bit'],
  m_wire:['Провод: протяните от выхода к входу','Wire: drag from an output to an input'],m_cut:['Резать: правая кнопка с протяжкой, на телефоне — ножницы','Cut: drag with the right button, on a phone use the scissors'],
  m_del:['Удалить: правый клик или «Удалить» у выбранного','Delete: right-click, or “Delete” next to the selection'],m_pan:['Двигать поле: тянуть по пустому месту, масштаб — колесо или два пальца','Pan: drag empty space; zoom: wheel or two fingers'],
  m_gate:['Вставить в провод: бросьте элемент на провод','Splice: drop a gate onto a wire'],sCalm2:['Меньше анимации','Reduce motion'],
  sMusic:['Музыка','Music'],sSfx:['Звуки','Effects'],sVoice:['Голос Бита','Bit’s voice'],sDev:['Разраб.','Drawn'],sChk:['Пров.','Checked'],sSheet:['Лист','Sheet'],sSheets:['Листов','Sheets'],mGates:['элементов','gates'],cSolved:['Схема работает','The circuit works'],cNoHint:['Без подсказок','No hints'],cPar:['Не больше {p} элементов','{p} gates or fewer'],whyHint:['была подсказка','hint used'],whyPar:['у вас {n}','you used {n}'],mRows:['строк в таблице','rows in total'],mRowsBad:['не совпали','failed'],mRowsOk:['совпали','passed'],qReady:['можно сдавать','ready to take'],mPar:['рекорд Бита','Bit’s record'],mYours:['ваш {n}','yours {n}'],mmLevel:['уровень {n}','level {n}'],mmDone:['{n} из {N}','{n} of {N}'],subjNo:['Испытуемый № 0001','Subject No. 0001'],machine:['Машина','The Machine'],machineCap:['Узлов включено: {n} из {N}','Units online: {n} of {N}'],sBit:['Бит','Bit'],sTxt:['Скорость текста','Text speed'],sDemo:['Скорость проверки','Test speed'],sGost:['Обозначения','Gate symbols'],
  vAuto:['авто','auto'],vAsIs:['как есть','unchanged'],vFull:['во весь экран','fullscreen'],vOn:['вкл','on'],vOff:['выкл','off'],
  vThin:['тонкие','thin'],vNormal:['обычные','normal'],vThick:['толстые','thick'],vVThick:['очень толстые','extra thick'],
  vDots:['точки','dots'],vLines:['миллиметровка','graph paper'],vNone:['нет','none'],vHigh:['высокий','high'],vReg:['обычный','normal'],vAll:['все','all'],vMin:['минимум','minimal'],
  vTalk:['комментирует','comments'],vHints:['только подсказки','hints only'],vHidden:['спрятан','hidden'],vSlow:['медленно','slow'],vNorm:['обычно','normal'],vInst:['сразу','instant'],vFast:['быстро','fast'],
  vGost:['ГОСТ 2.743','GOST 2.743'],vAnsi:['ANSI','ANSI']
};
const ui=(k,o)=>{const v=UIS[k];const s=v?v[LANG==='en'?1:0]:k;return o?fmt(s,o):s};

/* ========== formula typesetting ==========
   Variables: italic serif (STIX Two). Operators: upright, with air around them; ⊕ ∨ ⊙ → ← drawn as vector glyphs
   so they match the stroke of the letters on every system. Conjunction is shown as &, as in Russian textbooks. */
const OPSVG={'⊕':'<circle cx="8" cy="8" r="6"/><path d="M8 3.4V12.6M3.4 8H12.6"/>','⊙':'<circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none"/>',
  '∨':'<path d="M3.2 3.6L8 12.8L12.8 3.6"/>','→':'<path d="M2 8H14M10 4.2L14 8L10 11.8"/>','←':'<path d="M14 8H2M6 4.2L2 8L6 11.8"/>'};
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function mo(c){return `<span class="mo">${OPSVG[c]?`<svg class="mos" viewBox="0 0 16 16">${OPSVG[c]}</svg>`:c}</span>`}
function mathHTML(h){
  return String(h).replace(/∧/g,'&amp;').split(/(<[^>]+>)/).map(p=>p[0]==='<'?p:p.replace(
    /&amp;|&gt;|&lt;|[⊕⊙∨→←=+−]| [?:] |(?<![A-Za-z])(?:Co|Bo|[A-Z]{1,2}|n|k)(?![A-Za-z])/g,
    m=>m==='&amp;'?mo('&amp;'):m==='&gt;'||m==='&lt;'?mo(m):/^ [?:] $/.test(m)?' '+mo(m.trim())+' ':(OPSVG[m]||'=+−'.includes(m))?mo(m):/^[A-Z]{2}$/.test(m)?m.split('').map(c=>`<i class="mv">${c}</i>`).join(''):`<i class="mv">${m}</i>`)).join('');
}
