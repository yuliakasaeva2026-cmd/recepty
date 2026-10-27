/* Творожная запеканка: калькулятор. Подключается в книгу как модуль zapekanka. */
(function(){


var TYPES = {
  plast: { name:'Пластовой', sub:'влажный, слоями', full:'Творог пластовой 5%', w:0.78, rec:'soft', A:{soft:70, yogurt:70}, eq:70, time:[55,60],
    why:'Пластовой творог и так влажный и с кислинкой, а мягкий творог добавит сливочности без лишней кислоты.',
    alt:'Йогурт кладите столько же, запеканка выйдет чуть кисловатее.',
    prep:'Слейте сыворотку из упаковки. Отжимать творог не нужно.' },
  brick: { name:'В брикетах', sub:'плотный', full:'Творог в брикетах 5%', w:0.74, rec:'yogurt', A:{yogurt:100, soft:100}, eq:65, time:[55,55],
    why:'Брикетный творог плотный, а йогурт сделает массу мягче и поможет блендеру.',
    alt:'Мягкий творог кладите столько же, масса выйдет чуть гуще и сливочнее.',
    prep:'Разомните брикеты вилкой, чтобы блендеру было легче.' },
  dry: { name:'Сухой', sub:'рассыпчатый', full:'Творог сухой (рассыпчатый) 5%', w:0.70, rec:'yogurt', A:{yogurt:140, soft:175}, eq:55, time:[50,55],
    why:'Сухому творогу нужна влага: йогурт даёт её лучше всего и оживляет вкус лёгкой кислинкой.',
    alt:'Мягкого творога нужно на четверть больше, чем йогурта: он гуще. Запеканка выйдет плотнее.',
    prep:'Сухой творог пробивайте в 2–3 приёма. Если блендер не справляется, добавьте к творогу взбитые яйца.' }
};
var ADD = {
  soft:   { name:'Мягкий творог', short:'мягкий творог', wEff:0.64, n:[100,9,5,3.5] },
  yogurt: { name:'Греческий йогурт', short:'греческий йогурт', wEff:0.80, n:[66,8,2,4] }
};
var FL = {
  oat:     { name:'Овсяная мука',    acc:'овсяную',    gen:'овсяной',    c:1,    n:[369,13,6.8,64.9] },
  rice:    { name:'Рисовая мука',    acc:'рисовую',    gen:'рисовой',    c:1,    n:[366,6,1.4,80.2] },
  wheat:   { name:'Пшеничная мука',  acc:'пшеничную',  gen:'пшеничной',  c:1,    n:[334,10.3,1.1,68.9] },
  almond:  { name:'Миндальная мука', acc:'миндальную', gen:'миндальной', c:0.67, n:[610,24,52,13] },
  coconut: { name:'Кокосовая мука',  acc:'кокосовую',  gen:'кокосовой',  c:1.6,  n:[340,20,13,21] }
};
var BLENDS = {
  oat_rice:    { name:'Овсяная + рисовая',    parts:{oat:0.6, rice:0.4},     note:'Нежная, ближе всего к классической', rec:true },
  oat_almond:  { name:'Овсяная + миндальная', parts:{oat:0.72, almond:0.28}, note:'Самая вкусная, ореховая. Румянится быстрее' },
  oat_wheat:   { name:'Овсяная + пшеничная',  parts:{oat:0.6, wheat:0.4},    note:'Привычный вкус, плотнее, как пирог' },
  oat:         { name:'Только овсяная',       parts:{oat:1},                 note:'Лёгкий овсяный привкус, чуть грубее' },
  oat_coconut: { name:'Овсяная + кокосовая',  parts:{oat:0.7, coconut:0.3},  note:'Для любителей кокоса, может выйти суховатой' }
};
var EXTRAS = {
  zest:     { name:'Цедра лимона или апельсина', perKg:2,  n:[47,1.5,0.3,16] },
  cinnamon: { name:'Корица',                     perKg:1,  n:[247,4,1.2,81] },
  raisins:  { name:'Изюм или курага',            perKg:70, n:[264,2.9,0.6,66], note:'Залить кипятком на 10 минут и обсушить' }
};
var NUTR = { tvorog:[121,17.2,5,1.8], egg:[157,12.7,11.5,0.7], sugar:[399,0,0,99.8], vanilla:[288,0.1,0.1,12.7], salt:[0,0,0,0] };
var PER_KG = { egg:160, sugar:70, vanilla:4, salt:1 }; /* на 1 кг творога при рекомендованной добавке */
var EGG_G = 55, TOP_PER_KG = 20;

function compute(s){
  var t = TYPES[s.type], add = ADD[s.kind], blend = BLENDS[s.blend];
  var T = s.weight, k = T/1000;
  var comps = Object.keys(blend.parts);
  var Arec = t.A[s.kind]*k;
  var top = TOP_PER_KG*k;
  var r = t.eq/(1000*t.w + t.A[t.rec]*ADD[t.rec].wEff);
  var gw = {}, gsum = 0;
  comps.forEach(function(c){ gw[c] = blend.parts[c]/FL[c].c; gsum += gw[c]; });
  var locks = {};
  comps.forEach(function(c){ if (s.flourLocks[c] != null) locks[c] = s.flourLocks[c]; });
  var lk = Object.keys(locks);
  var fixed = null;
  if (s.flourTotal != null){
    fixed = {};
    if (comps.length === 1) fixed[comps[0]] = s.flourTotal;
    else if (lk.length === 1){
      var a = lk[0], b = comps.filter(function(c){ return c !== a; })[0];
      fixed[a] = Math.min(locks[a], s.flourTotal); fixed[b] = Math.max(0, s.flourTotal - locks[a]);
    } else comps.forEach(function(c){ fixed[c] = s.flourTotal*gw[c]/gsum; });
  } else if (lk.length === comps.length){
    fixed = {}; comps.forEach(function(c){ fixed[c] = locks[c]; });
  }
  function eqOf(g){ return comps.reduce(function(acc,c){ return acc + (g[c]||0)*FL[c].c; }, 0); }
  var A, aSrc, clamped = false;
  if (s.addLock != null){ A = s.addMode === 'total' ? Math.max(0, s.addLock - top) : s.addLock; aSrc = 'user'; }
  else if (fixed){
    var aa = (eqOf(fixed)/r - T*t.w)/add.wEff, lo = 0.5*Arec, hi = 2*Arec;
    if (aa < lo){ aa = lo; clamped = true; }
    if (aa > hi){ aa = hi; clamped = true; }
    A = aa; aSrc = 'balanced';
  } else { A = Arec; aSrc = 'recipe'; }
  var W = T*t.w + A*add.wEff;
  var eqNeed = W*r;
  var flour = {};
  if (fixed) flour = fixed;
  else if (lk.length === 1 && comps.length === 2){
    var x = lk[0], y = comps.filter(function(c){ return c !== x; })[0];
    flour[x] = locks[x]; flour[y] = Math.max(0, (eqNeed - locks[x]*FL[x].c)/FL[y].c);
  } else comps.forEach(function(c){ flour[c] = eqNeed*blend.parts[c]/FL[c].c; });
  var eqHave = eqOf(flour);
  var balance = eqNeed > 0 ? eqHave/eqNeed : 1;
  var Drec = 1000 + t.A[t.rec];
  var D = T + A*(t.A[t.rec]/t.A[s.kind]);
  var egg = PER_KG.egg*D/Drec, sugar = PER_KG.sugar*D/Drec, vanilla = PER_KG.vanilla*D/Drec, salt = PER_KG.salt*D/Drec;
  var extras = {};
  Object.keys(EXTRAS).forEach(function(e){ if (s.extras[e]) extras[e] = EXTRAS[e].perKg*k; });
  var items = [[T,NUTR.tvorog],[A,add.n],[top,add.n],[egg,NUTR.egg],[sugar,NUTR.sugar],[vanilla,NUTR.vanilla],[salt,NUTR.salt]];
  comps.forEach(function(c){ items.push([flour[c], FL[c].n]); });
  Object.keys(extras).forEach(function(e){ items.push([extras[e], EXTRAS[e].n]); });
  var M = 0, kc = 0, p = 0, f = 0, cb = 0;
  items.forEach(function(it){ var g = it[0], n = it[1]; M += g; kc += g*n[0]/100; p += g*n[1]/100; f += g*n[2]/100; cb += g*n[3]/100; });
  var extraMin = balance < 0.8 ? 10 : balance < 0.92 ? 5 : 0;
  return { T:T, k:k, t:t, add:add, blend:blend, comps:comps, A:A, Arec:Arec, aSrc:aSrc, clamped:clamped, top:top, r:r,
    flour:flour, eqNeed:eqNeed, eqHave:eqHave, balance:balance, egg:egg, eggs:Math.max(1, Math.round(egg/EGG_G)),
    sugar:sugar, vanilla:vanilla, salt:salt, extras:extras, M:M,
    kbju:[kc/M*100, p/M*100, f/M*100, cb/M*100], time:[t.time[0]+extraMin, t.time[1]+extraMin] };
}
function pickForm(M){
  if (M > 3900){ var half = pickForm(M/2); half.two = true; return half; }
  var need = M/3.27;
  var rects = [[20,20],[22,22],[25,20],[30,20],[32,22],[35,25],[40,30]];
  var rounds = [18,20,22,24,26,28,30];
  var rect = rects.reduce(function(b,x){ return Math.abs(x[0]*x[1]-need) < Math.abs(b[0]*b[1]-need) ? x : b; });
  var round = rounds.reduce(function(b,d){ return Math.abs(Math.PI*d*d/4-need) < Math.abs(Math.PI*b*b/4-need) ? d : b; });
  var roundOk = Math.abs(Math.PI*round*round/4 - need)/need < 0.18;
  return { rect:rect, round:roundOk ? round : null, two:false };
}

var TEMPLATE = "\n  <header>\n    <span class=\"eyebrow\">Завтраки · Выпечка и десерты · калькулятор</span>\n    <h1>Творожная запеканка</h1>\n    <p class=\"lead\">Выберите творог и муку. Если у вас другое количество добавки или муки, впишите своё: яйца, сахар и остальное пересчитаются.</p>\n  </header>\n\n  <div class=\"grid\">\n    <div class=\"panel\">\n      <section class=\"block\" aria-labelledby=\"h-tv\">\n        <h2 id=\"h-tv\">Творог</h2>\n        <div class=\"seg\" id=\"typeSeg\" role=\"group\" aria-label=\"Тип творога\"></div>\n        <div class=\"field\">\n          <label class=\"label\" for=\"weight\">Вес творога</label>\n          <div class=\"inrow\">\n            <div class=\"num\"><input id=\"weight\" type=\"text\" inputmode=\"decimal\" autocomplete=\"off\"><span>г</span></div>\n          </div>\n          <div class=\"quick\" id=\"quick\"></div>\n          <p class=\"err\" id=\"wErr\" hidden>Впишите вес от 100 до 10 000 г.</p>\n        </div>\n      </section>\n\n      <section class=\"block\" aria-labelledby=\"h-add\">\n        <h2 id=\"h-add\">Добавка для нежности</h2>\n        <div class=\"seg\" id=\"kindSeg\" role=\"group\" aria-label=\"Добавка\"></div>\n        <p class=\"hint\" id=\"kindWhy\"></p>\n        <div class=\"field\">\n          <div class=\"labrow\">\n            <label class=\"label\" for=\"addAmt\">Сколько кладу</label>\n            <div class=\"seg mini\" id=\"modeSeg\" role=\"group\" aria-label=\"Как считать добавку\"></div>\n          </div>\n          <div class=\"inrow\">\n            <div class=\"num\" id=\"addBox\"><input id=\"addAmt\" type=\"text\" inputmode=\"decimal\" autocomplete=\"off\"><span>г</span></div>\n            <button type=\"button\" class=\"reset\" id=\"addReset\" hidden>По рецепту</button>\n          </div>\n          <p class=\"state\" id=\"addState\"></p>\n        </div>\n      </section>\n\n      <section class=\"block\" aria-labelledby=\"h-fl\">\n        <h2 id=\"h-fl\">Мука</h2>\n        <div class=\"blends\" id=\"blends\" role=\"radiogroup\" aria-label=\"Смесь муки\"></div>\n        <div class=\"flourfields\" id=\"flourFields\"></div>\n        <p class=\"hint\">Впишите, сколько у вас есть любой муки или всей муки вместе. Вторая мука и добавка подстроятся.</p>\n      </section>\n\n      <section class=\"block\" aria-labelledby=\"h-ex\">\n        <h2 id=\"h-ex\">Добавки по желанию</h2>\n        <div class=\"checks\" id=\"extras\"></div>\n      </section>\n\n      <div><button type=\"button\" class=\"ghost\" id=\"resetAll\">Вернуть всё к рецепту</button></div>\n    </div>\n\n    <div class=\"result\" aria-live=\"polite\">\n      <div class=\"dish\">\n        <div class=\"dish-head\">\n          <h2>Что положить</h2>\n          <span class=\"pill ok\" id=\"pill\">Тесто в балансе</span>\n        </div>\n        <ul class=\"ing\" id=\"ing\"></ul>\n        <ul class=\"notes\" id=\"notes\"></ul>\n        <dl class=\"facts\" id=\"facts\"></dl>\n        <div>\n          <p class=\"label\">КБЖУ на 100 г теста</p>\n          <div class=\"kbju\" id=\"kbju\"></div>\n          <p class=\"hint\" id=\"kbjuHint\" style=\"margin-top:8px\"></p>\n        </div>\n      </div>\n      <section class=\"block steps\" aria-labelledby=\"h-st\">\n        <h2 id=\"h-st\">Как готовить</h2>\n        <ol id=\"steps\"></ol>\n      </section>\n    </div>\n  </div>\n\n  <footer><p class=\"hint\">Расчёт по средним табличным данным. Крупное яйцо без скорлупы весит около 55 г.</p></footer>";
function mount(root){
root.innerHTML = TEMPLATE;


(function(){
  var KEY = 'zapekanka-calc-v2';
  var DEF = { type:'plast', weight:1000, kind:'soft', blend:'oat_rice', addLock:null, addMode:'batter', flourLocks:{}, flourTotal:null, extras:{ zest:false, cinnamon:false, raisins:false } };
  function $(id){ return document.getElementById(id); }
  function clone(o){ return JSON.parse(JSON.stringify(o)); }
  function load(){
    var st = clone(DEF);
    try {
      var raw = localStorage.getItem(KEY);
      if (raw){
        var o = JSON.parse(raw);
        if (TYPES[o.type]) st.type = o.type;
        if (typeof o.weight === 'number' && o.weight >= 100 && o.weight <= 10000) st.weight = o.weight;
        if (ADD[o.kind]) st.kind = o.kind;
        if (BLENDS[o.blend]) st.blend = o.blend;
        if (typeof o.addLock === 'number') st.addLock = o.addLock;
        if (o.addMode === 'total' || o.addMode === 'batter') st.addMode = o.addMode;
        if (o.flourLocks && typeof o.flourLocks === 'object') Object.keys(o.flourLocks).forEach(function(c){ if (FL[c] && typeof o.flourLocks[c] === 'number') st.flourLocks[c] = o.flourLocks[c]; });
        if (typeof o.flourTotal === 'number') st.flourTotal = o.flourTotal;
        if (o.extras) Object.keys(st.extras).forEach(function(e){ st.extras[e] = !!o.extras[e]; });
      }
    } catch(e){}
    return st;
  }
  var s = load();
  function save(){ try { localStorage.setItem(KEY, JSON.stringify(s)); } catch(e){} }
  function fmt(g){
    if (g < 10){ var v = Math.round(g*10)/10; return String(v).replace('.', ','); }
    return String(Math.round(g));
  }
  function parseNum(str){
    var v = parseFloat(String(str).replace(/\s/g,'').replace(',', '.'));
    return isNaN(v) || v < 0 ? null : v;
  }
  function changed(){ update(); save(); }

  /* Творог */
  var typeSeg = $('typeSeg');
  Object.keys(TYPES).forEach(function(key){
    var b = document.createElement('button'); b.type = 'button'; b.dataset.type = key;
    b.innerHTML = '<span>' + TYPES[key].name + '</span><span class="seg-s">' + TYPES[key].sub + '</span>';
    b.addEventListener('click', function(){ s.type = key; s.kind = TYPES[key].rec; changed(); });
    typeSeg.appendChild(b);
  });
  var wIn = $('weight');
  wIn.addEventListener('input', function(){
    var v = parseNum(wIn.value);
    if (v != null && v >= 100 && v <= 10000){ s.weight = v; $('wErr').hidden = true; changed(); }
    else $('wErr').hidden = false;
  });
  wIn.addEventListener('blur', function(){ $('wErr').hidden = true; update(); });
  [500,1000,1400,2000].forEach(function(v){
    var b = document.createElement('button'); b.type = 'button'; b.textContent = v + ' г'; b.dataset.w = v;
    b.addEventListener('click', function(){ s.weight = v; $('wErr').hidden = true; changed(); });
    $('quick').appendChild(b);
  });

  /* Добавка */
  var kindSeg = $('kindSeg');
  ['soft','yogurt'].forEach(function(key){
    var b = document.createElement('button'); b.type = 'button'; b.dataset.kind = key;
    b.innerHTML = '<span>' + ADD[key].name + '</span><span class="chip" data-chip hidden>рекомендую</span>';
    b.addEventListener('click', function(){ s.kind = key; changed(); });
    kindSeg.appendChild(b);
  });
  var modeSeg = $('modeSeg');
  [['batter','В тесто'],['total','Всего с верхом']].forEach(function(m){
    var b = document.createElement('button'); b.type = 'button'; b.dataset.mode = m[0]; b.textContent = m[1];
    b.addEventListener('click', function(){
      if (s.addMode === m[0]) return;
      if (s.addLock != null){ var c = compute(s); s.addLock = Math.round((m[0] === 'total' ? c.A + c.top : c.A)*10)/10; }
      s.addMode = m[0]; changed();
    });
    modeSeg.appendChild(b);
  });
  var aIn = $('addAmt');
  aIn.addEventListener('input', function(){ var v = parseNum(aIn.value); if (v == null) return; s.addLock = v; changed(); });
  aIn.addEventListener('blur', function(){ if (aIn.value.trim() === '') s.addLock = null; changed(); });
  $('addReset').addEventListener('click', function(){ s.addLock = null; changed(); });

  /* Мука */
  var blendsEl = $('blends');
  Object.keys(BLENDS).forEach(function(key){
    var bl = BLENDS[key];
    var lab = document.createElement('label'); lab.className = 'blend'; lab.dataset.blend = key;
    lab.innerHTML = '<input type="radio" name="blend" id="bl-' + key + '" value="' + key + '"><span class="blend-txt"><span class="blend-name">' + bl.name + (bl.rec ? ' <span class="chip">рекомендую</span>' : '') + '</span><small>' + bl.note + '</small></span>';
    lab.querySelector('input').addEventListener('change', function(){
      var prevTotal = s.flourTotal;
      s.blend = key; s.flourLocks = {};
      if (Object.keys(BLENDS[key].parts).length === 1 && prevTotal != null){ s.flourLocks.oat = prevTotal; s.flourTotal = null; }
      buildFlourFields(); changed();
    });
    blendsEl.appendChild(lab);
  });
  function setFlour(key, v){
    var comps = Object.keys(BLENDS[s.blend].parts);
    if (key === 'total'){ s.flourTotal = v; s.flourLocks = {}; return; }
    s.flourLocks[key] = v;
    Object.keys(s.flourLocks).forEach(function(c){ if (comps.indexOf(c) < 0) delete s.flourLocks[c]; });
    if (comps.length > 1 && comps.every(function(c){ return s.flourLocks[c] != null; })) s.flourTotal = null;
  }
  function clearFlour(key){ if (key === 'total') s.flourTotal = null; else delete s.flourLocks[key]; }
  function buildFlourFields(){
    var wrap = $('flourFields'); wrap.innerHTML = '';
    var comps = Object.keys(BLENDS[s.blend].parts);
    wrap.classList.toggle('two', comps.length > 1);
    var fields = comps.map(function(c){ return { id:'fl-' + c, key:c, label:FL[c].name }; });
    if (comps.length > 1) fields.push({ id:'fl-total', key:'total', label:'Мука всего' });
    fields.forEach(function(fd){
      var d = document.createElement('div'); d.className = 'field';
      d.innerHTML = '<label class="label" for="' + fd.id + '">' + fd.label + '</label><div class="inrow"><div class="num" id="' + fd.id + '-box"><input id="' + fd.id + '" type="text" inputmode="decimal" autocomplete="off"><span>г</span></div><button type="button" class="reset" id="' + fd.id + '-reset" hidden>По рецепту</button></div><p class="state" id="' + fd.id + '-state"></p>';
      wrap.appendChild(d);
      var inp = d.querySelector('input');
      inp.addEventListener('input', function(){ var v = parseNum(inp.value); if (v == null) return; setFlour(fd.key, v); changed(); });
      inp.addEventListener('blur', function(){ if (inp.value.trim() === '') clearFlour(fd.key); changed(); });
      d.querySelector('.reset').addEventListener('click', function(){ clearFlour(fd.key); changed(); });
    });
  }

  /* Добавки по желанию */
  Object.keys(EXTRAS).forEach(function(e){
    var lab = document.createElement('label'); lab.className = 'check';
    lab.innerHTML = '<input type="checkbox" id="ex-' + e + '"><span><span>' + EXTRAS[e].name + '</span> <span class="check-g" id="ex-' + e + '-g"></span>' + (EXTRAS[e].note ? '<small>' + EXTRAS[e].note + '</small>' : '') + '</span>';
    lab.querySelector('input').addEventListener('change', function(ev){ s.extras[e] = ev.target.checked; changed(); });
    $('extras').appendChild(lab);
  });
  $('resetAll').addEventListener('click', function(){ s.addLock = null; s.flourLocks = {}; s.flourTotal = null; changed(); });

  function deltaTxt(cur, base){
    var d = cur - base;
    if (Math.abs(d) < Math.max(1, base*0.02)) return '';
    return '<span class="delta">' + (d > 0 ? '+' : '−') + fmt(Math.abs(d)) + ' г</span> к рецепту';
  }
  function row(name, qty, sub){
    return '<li><span class="ing-n">' + name + '</span><span class="ing-q">' + qty + '</span>' + (sub ? '<span class="ing-s">' + sub + '</span>' : '') + '</li>';
  }
  function eggWord(n){
    var a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return 'яйцо';
    if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return 'яйца';
    return 'яиц';
  }

  function update(){
    var c = compute(s);
    var base = compute({ type:s.type, weight:s.weight, kind:s.kind, blend:s.blend, addLock:null, addMode:s.addMode, flourLocks:{}, flourTotal:null, extras:s.extras });
    var t = c.t, comps = c.comps;

    typeSeg.querySelectorAll('button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.type === s.type)); });
    if (document.activeElement !== wIn) wIn.value = fmt(s.weight);
    $('quick').querySelectorAll('button').forEach(function(b){ b.setAttribute('aria-pressed', String(Number(b.dataset.w) === s.weight)); });

    kindSeg.querySelectorAll('button').forEach(function(b){
      b.setAttribute('aria-pressed', String(b.dataset.kind === s.kind));
      b.querySelector('[data-chip]').hidden = b.dataset.kind !== t.rec;
    });
    $('kindWhy').textContent = 'Для этого творога рекомендую ' + ADD[t.rec].short + '. ' + t.why + (s.kind !== t.rec ? ' ' + t.alt : '');
    modeSeg.querySelectorAll('button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.mode === s.addMode)); });
    var shown = s.addLock != null ? s.addLock : (s.addMode === 'total' ? c.A + c.top : c.A);
    if (document.activeElement !== aIn) aIn.value = fmt(shown);
    $('addBox').classList.toggle('user', s.addLock != null);
    $('addReset').hidden = s.addLock == null;
    var aNote = s.addLock != null ? 'Ваше количество. По рецепту в тесто ' + fmt(c.Arec) + ' г.'
      : c.aSrc === 'balanced' ? 'Подстроено под вашу муку. По рецепту в тесто ' + fmt(c.Arec) + ' г.' : 'По рецепту.';
    $('addState').innerHTML = 'В тесто <b>' + fmt(c.A) + ' г</b> + на верх <b>' + fmt(c.top) + ' г</b> = всего <b>' + fmt(c.A + c.top) + ' г</b>. ' + aNote;

    blendsEl.querySelectorAll('.blend').forEach(function(l){ var on = l.dataset.blend === s.blend; l.classList.toggle('on', on); l.querySelector('input').checked = on; });
    var anyUser = s.addLock != null || s.flourTotal != null || comps.some(function(k){ return s.flourLocks[k] != null; });
    comps.forEach(function(k){
      var inp = $('fl-' + k); if (!inp) return;
      var user = s.flourLocks[k] != null;
      if (document.activeElement !== inp) inp.value = fmt(user ? s.flourLocks[k] : c.flour[k]);
      $('fl-' + k + '-box').classList.toggle('user', user);
      $('fl-' + k + '-reset').hidden = !user;
      $('fl-' + k + '-state').textContent = user ? 'Ваше количество' : anyUser ? 'Подобрано под ваши значения' : 'По рецепту';
    });
    if (comps.length > 1 && $('fl-total')){
      var tot = comps.reduce(function(a,k){ return a + c.flour[k]; }, 0);
      var tUser = s.flourTotal != null, inpT = $('fl-total');
      if (document.activeElement !== inpT) inpT.value = fmt(tUser ? s.flourTotal : tot);
      $('fl-total-box').classList.toggle('user', tUser);
      $('fl-total-reset').hidden = !tUser;
      $('fl-total-state').textContent = tUser ? 'Ваше количество, делится по пропорции смеси' : 'Сумма двух видов муки';
    }
    Object.keys(EXTRAS).forEach(function(e){
      $('ex-' + e).checked = !!s.extras[e];
      $('ex-' + e + '-g').textContent = '· ' + fmt(EXTRAS[e].perKg*c.k) + ' г';
    });

    /* Ингредиенты */
    var html = row(t.full, fmt(c.T) + ' г', '');
    var aSub = [];
    if (s.kind === t.rec) aSub.push('<span class="chip">рекомендую</span>'); else aSub.push('замена');
    if (c.aSrc === 'user') aSub.push('ваше количество');
    if (c.aSrc === 'balanced' && Math.abs(c.A - c.Arec) >= 1) aSub.push('подстроено под муку');
    var dA = deltaTxt(c.A, base.A); if (dA) aSub.push(dA);
    html += row(c.add.name + ' в тесто', fmt(c.A) + ' г', aSub.join(' · '));
    var eSub = ['крупные, вес без скорлупы']; var dE = deltaTxt(c.egg, base.egg); if (dE) eSub.push(dE);
    html += row('Яйца', c.eggs + ' ' + eggWord(c.eggs) + ' · ' + fmt(c.egg) + ' г', eSub.join(' · '));
    html += row('Сахар', fmt(c.sugar) + ' г', deltaTxt(c.sugar, base.sugar));
    comps.forEach(function(k){
      var sub = []; if (c.blend.rec) sub.push('<span class="chip">рекомендую</span>');
      if (s.flourLocks[k] != null) sub.push('ваше количество');
      var d = deltaTxt(c.flour[k], base.flour[k]); if (d) sub.push(d);
      html += row(FL[k].name, fmt(c.flour[k]) + ' г', sub.join(' · '));
    });
    html += row('Ванильный экстракт', fmt(c.vanilla) + ' г', '');
    html += row('Соль', fmt(c.salt) + ' г', '');
    html += row(c.add.name + ' на верх', fmt(c.top) + ' г', 'смазать перед выпеканием');
    Object.keys(c.extras).forEach(function(e){ html += row(EXTRAS[e].name, fmt(c.extras[e]) + ' г', EXTRAS[e].note || ''); });
    $('ing').innerHTML = html;

    /* Пояснения */
    var notes = [];
    if (c.aSrc === 'user' && Math.abs(c.A - c.Arec) > Math.max(2, c.Arec*0.03))
      notes.push(['', 'Добавки в тесто ' + fmt(c.A) + ' г вместо ' + fmt(c.Arec) + ' г по рецепту. Яйца, сахар и мука пересчитаны под новую массу.']);
    if (c.aSrc === 'balanced' && Math.abs(c.A - c.Arec) > Math.max(2, c.Arec*0.03))
      notes.push(['', c.A < c.Arec
        ? 'Муки меньше, чем по рецепту, поэтому добавки в тесто тоже меньше: ' + fmt(c.A) + ' г вместо ' + fmt(c.Arec) + ' г. Так масса не выйдет жидкой.'
        : 'Муки больше, чем по рецепту, поэтому добавки в тесто тоже больше: ' + fmt(c.A) + ' г вместо ' + fmt(c.Arec) + ' г. Так запеканка останется нежной.']);
    var lockedC = comps.filter(function(k){ return s.flourLocks[k] != null; });
    if (s.flourTotal == null && lockedC.length === 1 && comps.length === 2){
      var lkey = lockedC[0], other = comps.filter(function(k){ return k !== lkey; })[0];
      notes.push(['', c.flour[other] < 0.5
        ? 'Вашей ' + FL[lkey].gen + ' муки хватает без второй.'
        : FL[other].name + ': ' + fmt(c.flour[other]) + ' г, подобрано под вашу ' + FL[lkey].acc + ' муку.']);
    }
    var Aok = (c.eqHave/c.r - c.T*t.w)/c.add.wEff;
    if (c.balance < 0.92){
      var shortG = c.eqNeed - c.eqHave;
      var fix = (s.addLock != null && Aok > 0)
        ? ' Чтобы вернуть баланс, уменьшите добавку в тесто до ' + fmt(Aok) + ' г или добавьте около ' + fmt(shortG) + ' г овсяной муки.'
        : ' Чтобы вернуть баланс, добавьте около ' + fmt(shortG) + ' г овсяной муки.';
      var Tok = c.T*c.eqHave/base.eqNeed;
      if (Tok >= 100) fix += ' Или возьмите меньше творога: под эту муку подойдёт около ' + fmt(Math.round(Tok/10)*10) + ' г.';
      notes.push(['warn', 'Муки маловато для такой влажности: запеканка выйдет нежнее, ближе к суфле, и дольше схватывается. Время выпекания уже увеличено.' + fix]);
    } else if (c.balance > 1.08){
      var extraG = c.eqHave - c.eqNeed;
      notes.push(['warn', 'Муки многовато: запеканка выйдет плотнее, ближе к пирогу. Для привычной нежности уберите около ' + fmt(extraG) + ' г муки' + (Aok > c.A ? ' или увеличьте добавку в тесто до ' + fmt(Aok) + ' г.' : '.')]);
    }
    if (s.type === 'dry' && c.A < 0.6*c.Arec)
      notes.push(['warn', 'Сухому творогу мало добавки: блендер будет пробивать его с трудом, а запеканка выйдет суше.']);
    if (c.A > 0.3*c.T)
      notes.push(['', 'Добавки больше 30% от веса творога: текстура станет ближе к чизкейку.']);
    $('notes').innerHTML = notes.map(function(n){ return '<li' + (n[0] ? ' class="' + n[0] + '"' : '') + '>' + n[1] + '</li>'; }).join('');

    var pill = $('pill');
    if (c.balance < 0.92){ pill.className = 'pill warn'; pill.textContent = 'Муки маловато'; }
    else if (c.balance > 1.08){ pill.className = 'pill warn'; pill.textContent = 'Плотнее обычного'; }
    else { pill.className = 'pill ok'; pill.textContent = 'Тесто в балансе'; }

    /* Духовка и форма */
    var tm = c.time[0] === c.time[1] ? 'около ' + c.time[0] + ' мин' : c.time[0] + '–' + c.time[1] + ' мин';
    var fm = pickForm(c.M);
    var formTxt = (fm.two ? 'Две формы, каждая ' : '') + fm.rect[0] + '×' + fm.rect[1] + ' см' + (fm.round ? ' или круглая Ø ' + fm.round + ' см' : '') + ', слой около 4 см';
    var ready = String((Math.round(c.M*0.9/10)/100).toFixed(2)).replace('.', ',');
    $('facts').innerHTML =
      '<dt>Духовка</dt><dd>170°C верх-низ или 155–160°C с конвекцией</dd>' +
      '<dt>Время</dt><dd>' + tm + ', потом 15 мин в выключенной духовке</dd>' +
      '<dt>Форма</dt><dd>' + formTxt + '</dd>' +
      '<dt>Выход</dt><dd>около ' + ready + ' кг готовой запеканки</dd>';

    var kb = c.kbju;
    $('kbju').innerHTML =
      '<div><b>' + Math.round(kb[0]) + '</b><span>ккал</span></div>' +
      '<div><b>' + kb[1].toFixed(1).replace('.', ',') + '</b><span>белки, г</span></div>' +
      '<div><b>' + kb[2].toFixed(1).replace('.', ',') + '</b><span>жиры, г</span></div>' +
      '<div><b>' + kb[3].toFixed(1).replace('.', ',') + '</b><span>углеводы, г</span></div>';
    $('kbjuHint').textContent = 'При выпекании уходит около 10% влаги, поэтому в 100 г готовой запеканки примерно ' + Math.round(kb[0]/0.9) + ' ккал.';

    /* Шаги */
    var hasExtras = Object.keys(c.extras).length > 0;
    var steps = [
      '<b>Подготовьте творог.</b> ' + t.prep,
      '<b>Пробейте творог</b> вместе с добавкой (' + fmt(c.A) + ' г) погружным блендером до гладкой кремовой массы.',
      '<b>Взбейте яйца</b> с сахаром, ванилью и солью до светлой пышной массы, около 3 минут.',
      '<b>Соедините</b> творог с яйцами, добавьте муку' + (hasExtras ? ' и добавки' : '') + '. Перемешайте лопаткой и оставьте на 15 минут, чтобы мука набухла. Масса должна быть густой, как сметана. Пока она стоит, разогрейте духовку.',
      '<b>Выложите в форму</b>, застеленную пергаментом, разровняйте и смажьте верх (' + fmt(c.top) + ' г добавки).',
      '<b>Выпекайте ' + tm + '.</b> Готова, когда края золотистые, а центр слегка дрожит, как желе (75–80°C в центре). Если верх темнеет слишком быстро, накройте фольгой.' + (comps.indexOf('almond') >= 0 ? ' Миндальная мука румянится быстрее, держите фольгу наготове.' : ''),
      '<b>Дайте дойти:</b> выключите духовку, приоткройте дверцу и оставьте запеканку внутри на 15 минут.',
      '<b>Остудите полностью</b>, минимум час, и только потом режьте.'
    ];
    $('steps').innerHTML = steps.map(function(x){ return '<li>' + x + '</li>'; }).join('');
  }

  buildFlourFields();
  update();
})();

}
window.RecipeModules = window.RecipeModules || {};
window.RecipeModules.zapekanka = { mount: mount };
})();
