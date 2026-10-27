/* Творожная запеканка: калькулятор. Подключается в книгу как модуль zapekanka. */
(function(){


var TYPES = {
  plast: { name:'Пластовой 5%', sub:'влажный, слоями', full:'Творог пластовой 5%', w:0.78, rec:'soft', A:{soft:70, yogurt:70}, eq:70, time:[55,60], n:[121,17,5,1.8],
    why:'Пластовой творог и так влажный и с кислинкой, а мягкий творог добавит сливочности без лишней кислоты.',
    alt:'Йогурт кладите столько же, запеканка выйдет чуть кисловатее.',
    prep:'Слейте сыворотку из упаковки. Отжимать творог не нужно.' },
  plast9: { name:'Пластовой 9%', sub:'жирнее, нежнее', full:'Творог пластовой 9%', w:0.75, rec:'yogurt', A:{yogurt:60, soft:60}, eq:64, time:[55,60], n:[159,16,9,3],
    why:'Жирный пластовой творог и так сливочный: йогурт добавит лёгкости и свежей кислинки.',
    alt:'Мягкий творог кладите столько же: выйдет ещё сливочнее и калорийнее.',
    prep:'Слейте сыворотку из упаковки, если она есть. Отжимать творог не нужно.' },
  brick: { name:'В брикетах 5%', sub:'плотный', full:'Творог в брикетах 5%', w:0.74, rec:'yogurt', A:{yogurt:100, soft:100}, eq:65, time:[55,55], n:[121,17.2,5,1.8],
    why:'Брикетный творог плотный, а йогурт сделает массу мягче и поможет блендеру.',
    alt:'Мягкий творог кладите столько же, масса выйдет чуть гуще и сливочнее.',
    prep:'Разомните брикеты вилкой, чтобы блендеру было легче.' },
  dry: { name:'Сухой 5%', sub:'рассыпчатый', full:'Творог сухой (рассыпчатый) 5%', w:0.70, rec:'yogurt', A:{yogurt:140, soft:175}, eq:55, time:[50,55], n:[121,17.2,5,1.8],
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
  coconut: { name:'Кокосовая мука',  acc:'кокосовую',  gen:'кокосовой',  c:1.6,  n:[340,20,13,21] },
  corn:    { name:'Кукурузная мука', acc:'кукурузную', gen:'кукурузной', c:1,    n:[331,7.2,1.5,72.1] },
  ricew:   { name:'Рисовая цельнозерновая мука', acc:'рисовую цельнозерновую', gen:'рисовой цельнозерновой', c:1.05, n:[360,7.5,2.7,76] },
  buck:    { name:'Гречневая мука (зелёная)', acc:'гречневую', gen:'гречневой', c:1.05, n:[335,12.6,3.3,62] }
};
/* Отсортировано от лучших к менее удачным. parts — доли «впитывающей силы» муки; types — для каких творогов показывать (нет = для всех) */
var BLENDS = {
  oat_rice:           { name:'Овсяная + рисовая',    parts:{oat:0.6, rice:0.4},     note:'Нежная, ближе всего к классической', rec:true },
  oat_rice_almond:    { name:'Овсяная + рисовая + миндальная', parts:{oat:0.45, rice:0.30, almond:0.25}, note:'Самая вкусная: нежная и ореховая. Румянится быстрее' },
  oat_corn_rice:      { name:'Овсяная + кукурузная + рисовая', parts:{oat:0.43, corn:0.36, rice:0.21}, note:'«Солнечная»: золотистая, с лёгкой сладостью. Нужна мука, не крахмал' },
  oat_almond:         { name:'Овсяная + миндальная', parts:{oat:0.72, almond:0.28}, note:'Ореховая, «пирожная». Румянится быстрее' },
  rice:               { name:'Только рисовая',       parts:{rice:1},                note:'Очень нежная, без глютена, вкус нейтральный' },
  oat_ricew:          { name:'Овсяная + рисовая цельнозерновая', parts:{oat:0.6, ricew:0.4}, note:'Как «овсяная + рисовая», но больше клетчатки. Чуть зернистее' },
  wheat:              { name:'Только пшеничная',     parts:{wheat:1},               note:'Классическая, как в детстве. Не ПП, зато самый привычный вкус' },
  oat_wheat:          { name:'Овсяная + пшеничная',  parts:{oat:0.6, wheat:0.4},    note:'Привычный вкус, плотнее, как пирог' },
  oat_rice_coconut:   { name:'Овсяная + рисовая + кокосовая',  parts:{oat:0.49, rice:0.28, coconut:0.23}, note:'Для влажного пластового творога: масса меньше «плывёт»', types:['plast','plast9'] },
  oat_almond_coconut: { name:'Овсяная + миндальная + кокосовая', parts:{oat:0.55, almond:0.23, coconut:0.22}, note:'Самая сытная, ближе к десерту. Калорийнее остальных', types:['plast','brick'] },
  oat_coconut:        { name:'Овсяная + кокосовая',  parts:{oat:0.7, coconut:0.3},  note:'Для любителей кокоса. Кокосовая мука хорошо держит влажный пластовой творог', types:['plast','plast9'] },
  oat_buck:           { name:'Овсяная + гречневая (зелёная)', parts:{oat:0.6, buck:0.4}, note:'Ореховая нотка и сероватый цвет. Для любителей гречки' },
  oat:                { name:'Только овсяная',       parts:{oat:1},                 note:'Лёгкий овсяный привкус, чуть грубее' }
};
function blendAllowed(b, type){ var bl = BLENDS[b]; return !!bl && (!bl.types || bl.types.indexOf(type) >= 0); }
var EXTRAS = {
  zest:     { name:'Цедра лимона или апельсина', perKg:2,  n:[47,1.5,0.3,16] },
  cinnamon: { name:'Корица',                     perKg:1,  n:[247,4,1.2,81] },
  raisins:  { name:'Изюм или курага',            perKg:70, n:[264,2.9,0.6,66], note:'Залить кипятком на 10 минут и обсушить' }
};
var NUTR = { egg:[157,12.7,11.5,0.7], yolk:[352,16.2,31.2,1], sugar:[399,0,0,99.8], vanilla:[288,0.1,0.1,12.7], salt:[0,0,0,0] };
var PER_KG = { egg:160, sugar:70, vanilla:4, salt:1 }; /* на 1 кг творога при рекомендованной добавке */
var EGG_G = 50, YOLK_G = 17; /* яйца всегда целые, среднее яйцо без скорлупы 50 г */
/* Верх: количество зависит от площади формы (слой около 4 см) */
var TOPS = {
  yolkyog: { name:'Желток + йогурт', note:'Самая румяная и ровная корочка: желток даёт цвет, йогурт — глянец', rec:true },
  yolk:    { name:'Желток', note:'Румяная глянцевая корочка, может слегка потрескаться' },
  egg:     { name:'Целое яйцо', note:'Золотистая корочка, светлее, чем с желтком. Берётся из яиц для теста' },
  yogurt:  { name:'Греческий йогурт', note:'Лёгкий глянец, корочка светлая' },
  soft:    { name:'Мягкий творог', note:'Нежный сливочный слой сверху, корочка светлая' },
  none:    { name:'Ничего', note:'Верх матовый и светлый, без корочки' }
};
function topItems(key, area){
  var y = Math.max(1, Math.round(area/450));
  if (key === 'yolkyog') return [{ k:'yolk', name:'Желток', cnt:y, g:y*YOLK_G, n:NUTR.yolk }, { k:'yogurt', name:'Греческий йогурт', g:area*0.025, n:ADD.yogurt.n }];
  if (key === 'yolk') return [{ k:'yolk', name:'Желток', cnt:y, g:y*YOLK_G, n:NUTR.yolk }];
  if (key === 'egg') return [{ k:'egg', name:'Яйцо, взбитое', g:area*0.04, fromDough:true }];
  if (key === 'yogurt') return [{ k:'yogurt', name:'Греческий йогурт', g:area*0.06, n:ADD.yogurt.n }];
  if (key === 'soft') return [{ k:'soft', name:'Мягкий творог', g:area*0.06, n:ADD.soft.n }];
  return [];
}

function compute(s){
  var t = TYPES[s.type], add = ADD[s.kind], blend = BLENDS[s.blend];
  var T = s.weight, k = T/1000;
  var comps = Object.keys(blend.parts);
  var Arec = t.A[s.kind]*k;
  var r = t.eq/(1000*t.w + t.A[t.rec]*ADD[t.rec].wEff);
  var gw = {};
  comps.forEach(function(c){ gw[c] = blend.parts[c]/FL[c].c; });
  var locks = {};
  comps.forEach(function(c){ if (s.flourLocks[c] != null) locks[c] = s.flourLocks[c]; });
  var lk = Object.keys(locks);
  var free = comps.filter(function(c){ return locks[c] == null; });
  var fixed = null;
  if (lk.length === comps.length){
    fixed = {}; comps.forEach(function(c){ fixed[c] = locks[c]; });
  } else if (s.flourTotal != null){
    fixed = {}; var left = s.flourTotal;
    lk.forEach(function(c){ fixed[c] = Math.min(locks[c], Math.max(0, left)); left -= fixed[c]; });
    var fsum = free.reduce(function(a,c){ return a + gw[c]; }, 0);
    free.forEach(function(c){ fixed[c] = Math.max(0, left)*gw[c]/fsum; });
  }
  function eqOf(g){ return comps.reduce(function(acc,c){ return acc + (g[c]||0)*FL[c].c; }, 0); }
  var A, aSrc, clamped = false;
  if (s.addLock != null){ A = s.addLock; aSrc = 'user'; }
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
  else if (lk.length){
    var rem = Math.max(0, eqNeed - lk.reduce(function(a,c){ return a + locks[c]*FL[c].c; }, 0));
    var psum = free.reduce(function(a,c){ return a + blend.parts[c]; }, 0);
    lk.forEach(function(c){ flour[c] = locks[c]; });
    free.forEach(function(c){ flour[c] = rem*blend.parts[c]/psum/FL[c].c; });
  } else comps.forEach(function(c){ flour[c] = eqNeed*blend.parts[c]/FL[c].c; });
  var eqHave = eqOf(flour);
  var balance = eqNeed > 0 ? eqHave/eqNeed : 1;
  var Drec = 1000 + t.A[t.rec];
  var D = T + A*(t.A[t.rec]/t.A[s.kind]);
  var eggExact = PER_KG.egg*D/Drec, eggs = Math.max(1, Math.round(eggExact/EGG_G)), egg = eggs*EGG_G;
  var sugar = PER_KG.sugar*D/Drec, vanilla = PER_KG.vanilla*D/Drec, salt = PER_KG.salt*D/Drec;
  var extras = {};
  Object.keys(EXTRAS).forEach(function(e){ if (s.extras[e]) extras[e] = EXTRAS[e].perKg*k; });
  var items = [[T,t.n],[A,add.n],[egg,NUTR.egg],[sugar,NUTR.sugar],[vanilla,NUTR.vanilla],[salt,NUTR.salt]];
  comps.forEach(function(c){ items.push([flour[c], FL[c].n]); });
  Object.keys(extras).forEach(function(e){ items.push([extras[e], EXTRAS[e].n]); });
  var Md = items.reduce(function(a, it){ return a + it[0]; }, 0);
  var tops = topItems(s.top, Md/3.27);
  tops.forEach(function(x){ if (!x.fromDough) items.push([x.g, x.n]); });
  var M = 0, kc = 0, p = 0, f = 0, cb = 0;
  items.forEach(function(it){ var g = it[0], n = it[1]; M += g; kc += g*n[0]/100; p += g*n[1]/100; f += g*n[2]/100; cb += g*n[3]/100; });
  var extraMin = balance < 0.8 ? 10 : balance < 0.92 ? 5 : 0;
  return { T:T, k:k, t:t, add:add, blend:blend, comps:comps, A:A, Arec:Arec, aSrc:aSrc, clamped:clamped, tops:tops, r:r,
    flour:flour, eqNeed:eqNeed, eqHave:eqHave, balance:balance, egg:egg, eggs:eggs, eggExact:eggExact,
    sugar:sugar, vanilla:vanilla, salt:salt, extras:extras, M:M, Md:Md, tot:[kc, p, f, cb],
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

var TEMPLATE = "\n  <header>\n    <span class=\"eyebrow\">Завтраки · Выпечка и десерты · калькулятор</span>\n    <h1>Творожная запеканка</h1>\n    <p class=\"lead\">Выберите творог, сколько порций и муку. Если у вас другое количество творога, добавки или муки, впишите своё: остальное пересчитается.</p>\n  </header>\n\n  <div class=\"grid\">\n    <div class=\"panel\">\n      <section class=\"block\" aria-labelledby=\"h-tv\">\n        <h2 id=\"h-tv\">Творог</h2>\n        <div class=\"seg seg-wrap\" id=\"typeSeg\" role=\"group\" aria-label=\"Тип творога\"></div>\n        <div class=\"field\">\n          <label class=\"label\" for=\"weight\">Сколько у вас творога</label>\n          <div class=\"inrow\">\n            <div class=\"num\" id=\"wBox\"><input id=\"weight\" type=\"text\" inputmode=\"decimal\" autocomplete=\"off\"><span>г</span></div>\n          </div>\n          <div class=\"quick\" id=\"quick\"></div>\n          <p class=\"state\" id=\"wState\"></p>\n          <p class=\"err\" id=\"wErr\" hidden>Впишите вес от 100 до 10 000 г.</p>\n        </div>\n      </section>\n\n      <section class=\"block\" aria-labelledby=\"h-n\">\n        <h2 id=\"h-n\">Сколько порций</h2>\n        <div class=\"field\">\n          <span class=\"label\">Порций</span>\n          <div class=\"stepper\"><button type=\"button\" id=\"nMinus\" aria-label=\"Меньше порций\">−</button><output id=\"nOut\"></output><button type=\"button\" id=\"nPlus\" aria-label=\"Больше порций\">+</button></div>\n          <p class=\"state\" id=\"nHint\"></p>\n        </div>\n        <label class=\"check\"><input type=\"checkbox\" id=\"keepTotal\"><span><span>Не менять общий вес</span><small>Тогда при смене числа порций меняется вес одной порции, а продуктов столько же</small></span></label>\n        <div class=\"field\">\n          <label class=\"label\" for=\"portion\">Готовой запеканки на 1 порцию</label>\n          <div class=\"inrow\">\n            <div class=\"num\" id=\"pBox\"><input id=\"portion\" type=\"text\" inputmode=\"decimal\" autocomplete=\"off\"><span>г</span></div>\n            <button type=\"button\" class=\"reset\" id=\"pReset\" hidden>Как в рецепте</button>\n          </div>\n          <p class=\"state\" id=\"pHint\">1 порция — 100 г готовой запеканки.</p>\n        </div>\n      </section>\n\n      <section class=\"block\" aria-labelledby=\"h-add\">\n        <h2 id=\"h-add\">Добавка для нежности</h2>\n        <div class=\"seg\" id=\"kindSeg\" role=\"group\" aria-label=\"Добавка\"></div>\n        <p class=\"hint\" id=\"kindWhy\"></p>\n        <div class=\"field\">\n          <label class=\"label\" for=\"addAmt\">Сколько кладу в тесто</label>\n          <div class=\"inrow\">\n            <div class=\"num\" id=\"addBox\"><input id=\"addAmt\" type=\"text\" inputmode=\"decimal\" autocomplete=\"off\"><span>г</span></div>\n            <button type=\"button\" class=\"reset\" id=\"addReset\" hidden>По рецепту</button>\n          </div>\n          <p class=\"state\" id=\"addState\"></p>\n        </div>\n      </section>\n\n      <section class=\"block\" aria-labelledby=\"h-fl\">\n        <h2 id=\"h-fl\">Мука</h2>\n        <div class=\"blends\" id=\"blends\" role=\"radiogroup\" aria-label=\"Смесь муки\"></div>\n        <div class=\"flourfields\" id=\"flourFields\"></div>\n        <p class=\"hint\">Впишите, сколько у вас есть любой муки или всей муки вместе. Остальная мука и добавка подстроятся. Список смесей зависит от выбранного творога.</p>\n      </section>\n\n      <section class=\"block\" aria-labelledby=\"h-top\">\n        <h2 id=\"h-top\">Верх</h2>\n        <div class=\"blends\" id=\"tops\" role=\"radiogroup\" aria-label=\"Чем смазать верх\"></div>\n      </section>\n\n      <section class=\"block\" aria-labelledby=\"h-ex\">\n        <h2 id=\"h-ex\">Добавки по желанию</h2>\n        <div class=\"checks\" id=\"extras\"></div>\n      </section>\n\n      <div><button type=\"button\" class=\"ghost\" id=\"resetAll\">Вернуть всё к рецепту</button></div>\n    </div>\n\n    <div class=\"result\" aria-live=\"polite\">\n      <div class=\"dish\">\n        <div class=\"dish-head\">\n          <h2>Что положить</h2>\n          <span class=\"pill ok\" id=\"pill\">Тесто в балансе</span>\n        </div>\n        <ul class=\"ing\" id=\"ing\"></ul>\n        <ul class=\"notes\" id=\"notes\"></ul>\n        <dl class=\"facts\" id=\"facts\"></dl>\n        <div>\n          <p class=\"label\">КБЖУ на 100 г теста</p>\n          <div class=\"kbju\" id=\"kbju\"></div>\n          <p class=\"label\" style=\"margin-top:14px\">КБЖУ на 100 г готовой запеканки</p>\n          <div class=\"kbju\" id=\"kbjuReady\"></div>\n          <p class=\"label\" style=\"margin-top:14px\">На 1 порцию</p>\n          <div class=\"kbju\" id=\"kbjuOne\"></div>\n          <p class=\"hint\" id=\"kbjuHint\" style=\"margin-top:8px\"></p>\n        </div>\n      </div>\n      <section class=\"block steps\" aria-labelledby=\"h-st\">\n        <h2 id=\"h-st\">Как готовить</h2>\n        <ol id=\"steps\"></ol>\n      </section>\n    </div>\n  </div>\n\n  <footer><p class=\"hint\">Расчёт по средним табличным данным. Среднее яйцо без скорлупы весит около 50 г, яйца всегда целые.</p></footer>";
function mount(root){
root.innerHTML = TEMPLATE;


(function(){
  var KEY = 'zapekanka-calc-v2';
  var DEF = { type:'plast', weight:1000, kind:'soft', blend:'oat_rice', addLock:null, flourLocks:{}, flourTotal:null, top:'yolkyog', mode:'w', N:null, portion:null, keep:false, extras:{ zest:false, cinnamon:false, raisins:false } };
  var PORTION = 100, PW = ['порция','порции','порций'];
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
        if (typeof o.addLock === 'number' && o.addMode !== 'total') st.addLock = o.addLock;
        if (TOPS[o.top]) st.top = o.top;
        if (o.mode === 'n' && o.N >= 1){ st.mode = 'n'; st.N = o.N; }
        if (o.keep){ st.keep = true; if (o.N >= 1) st.N = o.N; }
        if (typeof o.portion === 'number' && o.portion >= 40 && o.portion <= 400) st.portion = o.portion;
        if (o.flourLocks && typeof o.flourLocks === 'object') Object.keys(o.flourLocks).forEach(function(c){ if (FL[c] && typeof o.flourLocks[c] === 'number') st.flourLocks[c] = o.flourLocks[c]; });
        if (typeof o.flourTotal === 'number') st.flourTotal = o.flourTotal;
        if (o.extras) Object.keys(st.extras).forEach(function(e){ st.extras[e] = !!o.extras[e]; });
      }
    } catch(e){}
    return st;
  }
  var s = load();
  if (!blendAllowed(s.blend, s.type)){ s.blend = 'oat_rice'; s.flourLocks = {}; s.flourTotal = null; }
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
    b.addEventListener('click', function(){
      s.type = key; s.kind = TYPES[key].rec;
      if (!blendAllowed(s.blend, key)){ s.blend = 'oat_rice'; s.flourLocks = {}; s.flourTotal = null; buildFlourFields(); }
      changed();
    });
    typeSeg.appendChild(b);
  });
  var wIn = $('weight');
  wIn.addEventListener('input', function(){
    var v = parseNum(wIn.value);
    if (v != null && v >= 100 && v <= 10000){ s.weight = v; s.mode = 'w'; if (!s.keep) s.N = null; $('wErr').hidden = true; changed(); }
    else $('wErr').hidden = false;
  });
  wIn.addEventListener('blur', function(){ $('wErr').hidden = true; update(); });
  [500,1000,1400,2000].forEach(function(v){
    var b = document.createElement('button'); b.type = 'button'; b.textContent = v + ' г'; b.dataset.w = v;
    b.addEventListener('click', function(){ s.weight = v; s.mode = 'w'; if (!s.keep) s.N = null; $('wErr').hidden = true; changed(); });
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
  /* Порции: 1 порция = 100 г готовой запеканки */
  function P(){ return s.portion || PORTION; }
  function readyPerGram(){ var c1 = compute(Object.assign({}, s, { weight:1000, addLock:null, flourLocks:{}, flourTotal:null })); return c1.M*0.9/1000; }
  function portions(c){ var ready = c.M*0.9, n = (s.keep || s.mode === 'n') && s.N ? s.N : Math.max(1, Math.round(ready/P())); return { n:n, ready:ready, each:ready/n }; }
  function setN(n){
    n = Math.max(1, Math.min(99, n));
    if (s.keep){ s.N = n; changed(); return; }
    var w = Math.round(n*P()/readyPerGram());
    if (w < 100 || w > 10000) return;
    s.addLock = null; s.flourLocks = {}; s.flourTotal = null; buildFlourFields();
    s.weight = w; s.mode = 'n'; s.N = n; changed();
  }
  $('nMinus').addEventListener('click', function(){ setN(portions(compute(s)).n - 1); });
  $('nPlus').addEventListener('click', function(){ setN(portions(compute(s)).n + 1); });
  var pIn = $('portion');
  pIn.addEventListener('input', function(){
    var v = parseNum(pIn.value); if (v == null || v < 40 || v > 400) return;
    if (s.keep){ s.N = Math.max(1, Math.round(compute(s).M*0.9/v)); changed(); return; }
    s.portion = v === PORTION ? null : v;
    if (s.mode === 'n' && s.N) s.weight = Math.max(100, Math.min(10000, Math.round(s.N*P()/readyPerGram())));
    changed();
  });
  pIn.addEventListener('blur', function(){ if (pIn.value.trim() === ''){ s.portion = null; changed(); } else update(); });
  $('pReset').addEventListener('click', function(){ s.portion = null; if (s.mode === 'n' && s.N) s.weight = Math.round(s.N*P()/readyPerGram()); changed(); });

  $('keepTotal').addEventListener('change', function(ev){
    var pr = portions(compute(s));
    s.keep = ev.target.checked;
    if (s.keep) s.N = pr.n;
    else { var e = Math.round(pr.each); s.portion = e === PORTION ? null : e; s.N = null; s.mode = 'w'; }
    changed();
  });
  /* Верх */
  Object.keys(TOPS).forEach(function(key){
    var tp = TOPS[key], lab = document.createElement('label'); lab.className = 'blend'; lab.dataset.top = key;
    lab.innerHTML = '<input type="radio" name="top" value="' + key + '"><span class="blend-txt"><span class="blend-name">' + tp.name + (tp.rec ? ' <span class="chip">рекомендую</span>' : '') + '</span><small>' + tp.note + '</small></span>';
    lab.querySelector('input').addEventListener('change', function(){ s.top = key; changed(); });
    $('tops').appendChild(lab);
  });
  var aIn = $('addAmt');
  aIn.addEventListener('input', function(){ var v = parseNum(aIn.value); if (v == null) return; s.addLock = v; changed(); });
  aIn.addEventListener('blur', function(){ if (aIn.value.trim() === '') s.addLock = null; changed(); });
  $('addReset').addEventListener('click', function(){ s.addLock = null; changed(); });

  /* Мука */
  var blendsEl = $('blends'), lastGroup = null;
  Object.keys(BLENDS).forEach(function(key){
    var bl = BLENDS[key];
    if (bl.group && bl.group !== lastGroup){
      lastGroup = bl.group;
      var gh = document.createElement('p'); gh.className = 'blend-group'; gh.textContent = bl.group;
      blendsEl.appendChild(gh);
    }
    var lab = document.createElement('label'); lab.className = 'blend'; lab.dataset.blend = key;
    lab.innerHTML = '<input type="radio" name="blend" id="bl-' + key + '" value="' + key + '"><span class="blend-txt"><span class="blend-name">' + bl.name + (bl.rec ? ' <span class="chip">рекомендую</span>' : '') + '</span><small>' + bl.note + '</small></span>';
    lab.querySelector('input').addEventListener('change', function(){
      var prevTotal = s.flourTotal;
      s.blend = key; s.flourLocks = {};
      if (Object.keys(BLENDS[key].parts).length === 1 && prevTotal != null){ s.flourLocks[Object.keys(BLENDS[key].parts)[0]] = prevTotal; s.flourTotal = null; }
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
    wrap.classList.toggle('two', comps.length === 2);
    wrap.classList.toggle('three', comps.length === 3);
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
  $('resetAll').addEventListener('click', function(){ s.addLock = null; s.flourLocks = {}; s.flourTotal = null; s.portion = null; if (s.keep) s.N = null; if (s.mode === 'n' && s.N) s.weight = Math.round(s.N*PORTION/readyPerGram()); buildFlourFields(); changed(); });

  function deltaTxt(cur, base){
    var d = cur - base;
    if (Math.abs(d) < Math.max(1, base*0.02)) return '';
    return '<span class="delta">' + (d > 0 ? '+' : '−') + fmt(Math.abs(d)) + ' г</span> к рецепту';
  }
  function row(name, qty, sub){
    return '<li><span class="ing-n">' + name + '</span><span class="ing-q">' + qty + '</span>' + (sub ? '<span class="ing-s">' + sub + '</span>' : '') + '</li>';
  }
  function plural(n, w){ var a = n % 10, b = n % 100; return (a === 1 && b !== 11) ? w[0] : (a >= 2 && a <= 4 && (b < 12 || b > 14)) ? w[1] : w[2]; }
  function eggWord(n){
    var a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return 'яйцо';
    if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return 'яйца';
    return 'яиц';
  }

  function update(){
    var c = compute(s);
    var base = compute({ type:s.type, weight:s.weight, kind:s.kind, blend:s.blend, addLock:null, flourLocks:{}, flourTotal:null, extras:s.extras, top:s.top });
    var pr = portions(c);
    var t = c.t, comps = c.comps;

    typeSeg.querySelectorAll('button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.type === s.type)); });
    if (document.activeElement !== wIn) wIn.value = fmt(s.weight);
    $('wBox').classList.toggle('user', s.mode === 'w' && s.weight !== 1000);
    $('wState').textContent = s.mode === 'n' && !s.keep ? 'Подобрано под ' + pr.n + ' ' + plural(pr.n, PW) : 'Из него выйдет ' + pr.n + ' ' + plural(pr.n, PW) + ' по ' + fmt(pr.each) + ' г';
    $('nOut').textContent = pr.n;
    $('nHint').textContent = s.keep ? 'Общий вес не меняется, меняется вес порции' : s.mode === 'n' ? 'Творог и остальное подстроились под число порций' : 'Подобрано под ваш творог';
    $('keepTotal').checked = !!s.keep;
    if (document.activeElement !== pIn) pIn.value = fmt(s.keep ? pr.each : P());
    $('pBox').classList.toggle('user', !!s.portion && !s.keep);
    $('pReset').hidden = !s.portion || !!s.keep;
    $('tops').querySelectorAll('.blend').forEach(function(l){ var on = l.dataset.top === s.top; l.classList.toggle('on', on); l.querySelector('input').checked = on; });
    $('quick').querySelectorAll('button').forEach(function(b){ b.setAttribute('aria-pressed', String(Number(b.dataset.w) === s.weight)); });

    kindSeg.querySelectorAll('button').forEach(function(b){
      b.setAttribute('aria-pressed', String(b.dataset.kind === s.kind));
      b.querySelector('[data-chip]').hidden = b.dataset.kind !== t.rec;
    });
    $('kindWhy').textContent = 'Для этого творога рекомендую ' + ADD[t.rec].short + '. ' + t.why + (s.kind !== t.rec ? ' ' + t.alt : '');
    var shown = s.addLock != null ? s.addLock : c.A;
    if (document.activeElement !== aIn) aIn.value = fmt(shown);
    $('addBox').classList.toggle('user', s.addLock != null);
    $('addReset').hidden = s.addLock == null;
    var aNote = s.addLock != null ? 'Ваше количество. По рецепту в тесто ' + fmt(c.Arec) + ' г.'
      : c.aSrc === 'balanced' ? 'Подстроено под вашу муку. По рецепту в тесто ' + fmt(c.Arec) + ' г.' : 'По рецепту.';
    $('addState').textContent = aNote;

    blendsEl.querySelectorAll('.blend').forEach(function(l){ var on = l.dataset.blend === s.blend; l.classList.toggle('on', on); l.querySelector('input').checked = on; l.hidden = !blendAllowed(l.dataset.blend, s.type); });
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
      $('fl-total-state').textContent = tUser ? 'Ваше количество, делится по пропорции смеси' : 'Сумма всех видов муки';
    }
    Object.keys(EXTRAS).forEach(function(e){
      $('ex-' + e).checked = !!s.extras[e];
      $('ex-' + e + '-g').textContent = '· ' + fmt(EXTRAS[e].perKg*c.k) + ' г';
    });

    /* Ингредиенты */
    var html = '<li class="grp">В тесто</li>' + row(t.full, fmt(c.T) + ' г', '');
    var aSub = [];
    if (s.kind === t.rec) aSub.push('<span class="chip">рекомендую</span>'); else aSub.push('замена');
    if (c.aSrc === 'user') aSub.push('ваше количество');
    if (c.aSrc === 'balanced' && Math.abs(c.A - c.Arec) >= 1) aSub.push('подстроено под муку');
    var dA = deltaTxt(c.A, base.A); if (dA) aSub.push(dA);
    html += row(c.add.name, fmt(c.A) + ' г', aSub.join(' · '));
    var eSub = ['среднее яйцо ≈ 50 г без скорлупы']; if (c.eggs !== base.eggs) eSub.push('к рецепту ' + (c.eggs > base.eggs ? '+' : '−') + Math.abs(c.eggs - base.eggs));
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
    Object.keys(c.extras).forEach(function(e){ html += row(EXTRAS[e].name, fmt(c.extras[e]) + ' г', EXTRAS[e].note || ''); });
    if (c.tops.length){
      html += '<li class="grp">На верх</li>';
      c.tops.forEach(function(x){
        if (x.cnt) html += row(x.name, x.cnt + ' шт · ' + fmt(x.g) + ' г', '');
        else html += row(x.name, '≈ ' + fmt(x.g) + ' г', x.fromDough ? 'отлейте из взбитых яиц для теста' : '');
      });
    }
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
    var freeC = comps.filter(function(k){ return s.flourLocks[k] == null; });
    if (s.flourTotal == null && lockedC.length && freeC.length){
      var restG = freeC.reduce(function(a, k){ return a + c.flour[k]; }, 0);
      notes.push(['', restG < 0.5
        ? 'Вашей муки хватает, остальная не нужна.'
        : freeC.map(function(k, i){ return (i ? FL[k].name.toLowerCase() : FL[k].name) + ': ' + fmt(c.flour[k]) + ' г'; }).join(', ') + ' — подобрано под вашу ' + lockedC.map(function(k){ return FL[k].acc; }).join(' и ') + ' муку.']);
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
    if (Math.abs(c.eggs - c.eggExact/EGG_G) >= 0.25)
      notes.push(['', 'Яйца: при пересчёте вышло бы ' + String(Math.round(c.eggExact/EGG_G*10)/10).replace('.', ',') + ', беру ' + c.eggs + ': яйца берутся целыми.']);
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
    var fm = pickForm(c.Md);
    var formTxt = (fm.two ? 'Две формы, каждая ' : '') + fm.rect[0] + '×' + fm.rect[1] + ' см' + (fm.round ? ' или круглая Ø ' + fm.round + ' см' : '') + ', слой около 4 см';
    $('facts').innerHTML =
      '<dt>Выход</dt><dd>' + pr.n + ' ' + plural(pr.n, PW) + ' по ' + fmt(pr.each) + ' г, всего ' + fmt(pr.ready) + ' г готовой запеканки</dd>' +
      '<dt>Духовка</dt><dd>170°C верх-низ или 155–160°C с конвекцией</dd>' +
      '<dt>Время</dt><dd>' + tm + ', потом 15 мин в выключенной духовке</dd>' +
      '<dt>Форма</dt><dd>' + formTxt + '</dd>';

    function kbjuHtml(kb){
      return '<div><b>' + Math.round(kb[0]) + '</b><span>ккал</span></div>' +
        '<div><b>' + kb[1].toFixed(1).replace('.', ',') + '</b><span>белки, г</span></div>' +
        '<div><b>' + kb[2].toFixed(1).replace('.', ',') + '</b><span>жиры, г</span></div>' +
        '<div><b>' + kb[3].toFixed(1).replace('.', ',') + '</b><span>углеводы, г</span></div>';
    }
    $('kbju').innerHTML = kbjuHtml(c.kbju);
    $('kbjuReady').innerHTML = kbjuHtml(c.kbju.map(function(v){ return v/0.9; }));
    $('kbjuOne').innerHTML = kbjuHtml(c.tot.map(function(v){ return v/pr.n; }));
    $('kbjuHint').textContent = 'При выпекании уходит около 10% влаги: из ' + fmt(c.M) + ' г теста испарится примерно ' + (Math.round(c.M*0.1/10)*10) + ' г. Поэтому в 100 г готовой запеканки калорий и БЖУ больше, чем в 100 г теста.';

    /* Шаги */
    var hasExtras = Object.keys(c.extras).length > 0;
    var steps = [
      '<b>Подготовьте творог.</b> ' + t.prep,
      '<b>Пробейте творог</b> вместе с добавкой (' + fmt(c.A) + ' г) погружным блендером до гладкой кремовой массы.',
      (s.top === 'egg' ? 'Слегка взбейте яйца вилкой и отлейте ' + fmt(c.tops[0].g) + ' г для смазки верха. Остальные ' : '') + '<b>' + (s.top === 'egg' ? 'взбейте' : 'Взбейте яйца') + '</b> с сахаром, ванилью и солью до светлой пышной массы, около 3 минут.',
      '<b>Соедините</b> творог с яйцами, добавьте муку' + (hasExtras ? ' и добавки' : '') + '. Перемешайте лопаткой и оставьте на 15 минут, чтобы мука набухла. Масса должна быть густой, как сметана. Пока она стоит, разогрейте духовку.',
      '<b>Выложите в форму</b>, застеленную пергаментом, и разровняйте.' + ({
        yolkyog: ' Смешайте желток с йогуртом и смажьте верх тонким слоем.',
        yolk: ' Смажьте верх желтком, слегка взбитым вилкой.',
        egg: ' Смажьте верх отлитым яйцом.',
        yogurt: ' Смажьте верх йогуртом.',
        soft: ' Распределите по верху мягкий творог тонким слоем.',
        none: '' })[s.top],
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
