/* Люля-кебаб: независимые количества трёх видов мяса, порции и КБЖУ.
   Данные рецепта — recipes.js, поле lyulya. */
(function(){
'use strict';
var MAX_MEAT = 100000, MAX_N = 200, MAX_PORTION = 1000, MAX_READY = 100000;
function sum(a){ return a.reduce(function(s, v){ return s + v; }, 0); }
function finite(v){ return typeof v === 'number' && isFinite(v); }
function round1(v){ return Math.round((v + Number.EPSILON) * 10) / 10; }
function ceil5(v){ return Math.ceil(v / 5 - 1e-10) * 5; }
function fmt(v){ return String(round1(v)).replace('.', ','); }
function whole(v){ return String(Math.round(v)); }
function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
function parse(s){
  s = String(s).trim().replace(/\s/g, '').replace(',', '.');
  return /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(s) && isFinite(Number(s)) ? Number(s) : null;
}
function defaults(C){
  return { base:C.meats.map(function(m){ return m.g; }), mode:'manual', N:C.servings, portion:C.portion, keep:false, actual:null, desired:null };
}
function sanitize(C, raw){
  var st = defaults(C);
  if (!raw || typeof raw !== 'object') return st;
  if (Array.isArray(raw.base) && raw.base.length === C.meats.length && raw.base.every(function(v){ return finite(v) && v >= 0 && v <= MAX_MEAT; })) st.base = raw.base.map(round1);
  if (finite(raw.N) && raw.N >= 1 && raw.N <= MAX_N) st.N = Math.round(raw.N);
  if (finite(raw.portion) && raw.portion >= 10 && raw.portion <= MAX_PORTION) st.portion = round1(raw.portion);
  st.keep = raw.keep === true;
  if (raw.mode === 'portions' && !st.keep) st.mode = 'portions';
  if (raw.mode === 'desired' && !st.keep && finite(raw.desired) && raw.desired >= 10 && raw.desired <= MAX_READY){ st.mode = 'desired'; st.desired = round1(raw.desired); }
  if (finite(raw.actual) && raw.actual > 0) st.actual = raw.actual;
  if (st.actual && st.actual > compute(C, st).raw) st.actual = null;
  return st;
}
function batch(C, meats){
  var meat = sum(meats), pepper = ceil5(meat * C.pepper.share), onion = ceil5(meat * C.onion.share);
  var beforeSalt = meat + pepper + onion, salt = round1(beforeSalt * C.saltShare);
  var totals = [0, 0, 0, 0, 0];
  function add(g, n){ totals = totals.map(function(v, i){ return v + g * (n[i] || 0) / 100; }); }
  meats.forEach(function(g, i){ add(g, C.meats[i].n); });
  add(pepper, C.pepper.n); add(onion, C.onion.n);
  return { meats:meats, meat:meat, pepper:pepper, onion:onion, salt:salt, raw:beforeSalt + salt, totals:totals };
}
function compute(C, st){
  var original = batch(C, C.meats.map(function(m){ return m.g; }));
  var readyBase = (C.ready[0] + C.ready[1]) / 2, yieldFactor = readyBase / original.raw;
  var b = batch(C, st.base.slice());
  if ((st.mode === 'portions' || st.mode === 'desired') && !st.keep && b.meat > 0){
    var target = st.mode === 'desired' ? st.desired : st.N * st.portion, baseReady = b.raw * yieldFactor;
    if (Math.abs(target - baseReady) > 0.05){
      // Округление овощей делает выход ступенчатым: выбираем ближайшую массу.
      var lo = 0, hi = Math.max(1, target / baseReady * 2);
      function scaled(f){ return batch(C, st.base.map(function(g){ return Math.round(g * f); })); }
      for (var step = 0; step < 45; step++){
        var mid = (lo + hi) / 2;
        if (scaled(mid).raw * yieldFactor < target) lo = mid; else hi = mid;
      }
      var a = scaled(lo), z = scaled(hi);
      b = Math.abs(a.raw * yieldFactor - target) <= Math.abs(z.raw * yieldFactor - target) ? a : z;
    }
  }
  var factor = b.raw / original.raw;
  b.estimated = b.raw * yieldFactor;
  b.readyLow = C.ready[0] * factor; b.readyHigh = C.ready[1] * factor;
  b.measured = finite(st.actual) && st.actual > 0 && st.actual <= b.raw;
  b.ready = b.measured ? st.actual : b.estimated;
  b.N = st.N; b.per = b.ready / st.N;
  b.k100raw = b.totals.map(function(v){ return b.raw ? v / b.raw * 100 : 0; });
  b.k100 = b.totals.map(function(v){ return b.ready ? v / b.ready * 100 : 0; });
  b.kOne = b.totals.map(function(v){ return v / st.N; });
  b.poultry = b.meats[0] + b.meats[1] > 0;
  b.core = b.poultry ? 74 : 71;
  return b;
}
function mount(root, recipe){
  var C = recipe.lyulya, KEY = 'lyulya-calc-v1', saved;
  try { saved = JSON.parse(localStorage.getItem(KEY)); } catch(e){}
  var st = sanitize(C, saved), invalid = {};
  function $(id){ return root.querySelector('#' + id); }
  function field(id, label, hint){
    return '<div class="field"><label class="label" for="' + id + '">' + esc(label) + '</label><div class="inrow"><div class="num"><input id="' + id + '" type="text" inputmode="decimal" autocomplete="off" aria-describedby="' + id + 'Hint"><span>г</span></div></div><p class="hint" id="' + id + 'Hint">' + hint + '</p></div>';
  }
  root.innerHTML = '<header class="r-head"><span class="eyebrow">Горячее · калькулятор</span><h1>' + esc(recipe.title) + '</h1><p class="lead">Любые пропорции трёх видов фарша. Перец, лук и соль считаются автоматически. Сырой слой всегда ' + fmt(C.thickness) + ' см.</p></header>' +
    '<div class="grid"><div class="panel">' +
      '<section class="block"><h2>Сколько порций</h2>' +
        '<div class="field"><span class="label">Порций</span><div class="stepper"><button type="button" id="lMinus" aria-label="Меньше порций">−</button><output id="lN"></output><button type="button" id="lPlus" aria-label="Больше порций">+</button></div><p class="state" id="lCountHint"></p></div>' +
        '<div class="quick" role="group" aria-label="Масштаб рецепта"><button type="button" data-scale="0.5">×0,5</button><button type="button" data-scale="1">×1</button><button type="button" data-scale="2">×2</button><button type="button" data-scale="3">×3</button></div>' +
        '<p class="hint">×1 — 8 порций выбранного размера. Кнопки сохраняют ваш состав мяса; повторное нажатие не увеличивает масштаб.</p>' +
        '<label class="check"><input type="checkbox" id="lKeep"><span><span>Не менять общий вес</span><small>При смене числа порций меняется только вес одной порции.</small></span></label>' +
        field('lPortion', 'Готового блюда на порцию', 'По умолчанию — около 95 г. Выход готового блюда приблизительный.') +
      '</section>' +
      '<section class="block"><h2>Состав фарша</h2><p class="hint">Впишите свои количества. Чтобы убрать вид мяса, укажите 0. Другие введённые количества не изменятся.</p>' +
        C.meats.map(function(m, i){ return field('lMeat' + i, m.name, 'По рецепту: ' + m.g + ' г.'); }).join('') +
        '<p class="state" id="lMeatTotal"></p>' +
        '<p class="hint">При пересчёте порций мясо округляется до 1 г, перец и лук — вверх до 5 г.</p>' +
      '</section>' +
      '<section class="block"><h2>Вес готового блюда</h2>' +
        field('lDesired', 'Желаемый вес готового блюда', 'Введите, сколько хотите получить: продукты пересчитаются с сохранением выбранного соотношения мяса. Выход приблизительный, по средним потерям базового рецепта.') +
        field('lActual', 'Фактический вес готового блюда', 'Необязательно: взвесьте после отдыха без формы. Уточнит вес порции и КБЖУ на 100 г; при изменении продуктов это поле очистится.') +
      '</section>' +
      '<p class="err" role="alert" id="lError" hidden></p><button class="ghost" type="button" id="lReset">Вернуть всё к рецепту</button>' +
    '</div><div class="result" id="lResult" aria-live="polite">' +
      '<section class="dish"><div class="dish-head"><h2>Что положить</h2></div><ul class="ing" id="lIngredients"></ul><ul class="notes" id="lNotes"></ul><dl class="facts recipe-facts" id="lFacts"></dl><div id="lNutrition"></div></section>' +
      '<section class="block steps"><h2>Как готовить</h2><ol id="lSteps"></ol></section>' +
    '</div></div>';
  function save(){ try { localStorage.setItem(KEY, JSON.stringify(st)); } catch(e){} }
  function paint(id, value){ if (document.activeElement !== $(id)) $(id).value = value; }
  function clearActual(){ st.actual = null; invalid.lActual = false; $('lActual').value = ''; }
  function clearDesired(){ st.desired = null; invalid.lDesired = false; $('lDesired').value = ''; }
  function freeze(){ st.base = compute(C, st).meats.slice(); st.mode = 'manual'; clearDesired(); }
  function changeN(n){
    if (st.keep || compute(C, st).measured) freeze(); else { st.mode = 'portions'; clearActual(); clearDesired(); }
    st.N = Math.max(1, Math.min(MAX_N, n)); update(); save();
  }
  function setInvalid(id, bad){ invalid[id] = bad; $(id).setAttribute('aria-invalid', String(bad)); }
  C.meats.forEach(function(m, i){
    var id = 'lMeat' + i;
    $(id).addEventListener('input', function(){
      var v = parse(this.value), bad = v == null || v < 0 || v > MAX_MEAT;
      setInvalid(id, bad);
      if (!bad){
        freeze(); st.base[i] = round1(v); clearActual();
        if (!st.keep) st.N = Math.max(1, Math.min(MAX_N, Math.round(compute(C, st).estimated / st.portion)));
        save();
      }
      update();
    });
    $(id).addEventListener('blur', update);
  });
  $('lMinus').addEventListener('click', function(){ changeN(st.N - 1); });
  $('lPlus').addEventListener('click', function(){ changeN(st.N + 1); });
  root.querySelectorAll('[data-scale]').forEach(function(button){
    button.addEventListener('click', function(){
      st.keep = false; clearActual(); changeN(C.servings * Number(button.dataset.scale));
    });
  });
  $('lKeep').addEventListener('change', function(){ freeze(); st.keep = this.checked; update(); save(); });
  $('lPortion').addEventListener('input', function(){
    if (st.keep || compute(C, st).measured) return;
    var v = parse(this.value), bad = v == null || v < 10 || v > MAX_PORTION;
    setInvalid('lPortion', bad);
    if (!bad){ st.portion = round1(v); st.mode = 'portions'; clearActual(); clearDesired(); save(); }
    update();
  });
  $('lPortion').addEventListener('blur', update);
  $('lDesired').addEventListener('input', function(){
    var text = this.value.trim(), v = parse(text);
    var bad = text !== '' && (v == null || v < 10 || v > MAX_READY);
    setInvalid('lDesired', bad);
    if (!bad){
      if (text){
        // Масштабируем от сохранённого состава, а не от предыдущего округлённого результата.
        if (st.mode !== 'desired') st.base = compute(C, st).meats.slice();
        st.desired = round1(v); st.mode = 'desired'; st.keep = false; clearActual();
        invalid.lPortion = false;
        st.N = Math.max(1, Math.min(MAX_N, Math.round(compute(C, st).estimated / st.portion)));
      } else { if (st.mode === 'desired') freeze(); clearDesired(); }
      save();
    }
    update();
  });
  $('lDesired').addEventListener('blur', update);
  $('lActual').addEventListener('input', function(){
    var text = this.value.trim(), v = parse(text), raw = compute(C, st).raw;
    var bad = text !== '' && (v == null || v <= 0 || v > raw);
    setInvalid('lActual', bad);
    if (!bad){ if (text) freeze(); st.actual = text ? v : null; save(); }
    update();
  });
  $('lActual').addEventListener('blur', update);
  $('lReset').addEventListener('click', function(){ st = defaults(C); invalid = {}; update(); save(); });
  function row(name, qty, hint){
    return '<li><span class="ing-n">' + esc(name) + '</span><span class="ing-q">' + esc(qty) + '</span>' + (hint ? '<span class="ing-s">' + esc(hint) + '</span>' : '') + '</li>';
  }
  function update(){
    var r = compute(C, st), bad = Object.keys(invalid).some(function(k){ return invalid[k]; }), empty = r.meat <= 0;
    C.meats.forEach(function(m, i){
      var id = 'lMeat' + i;
      if (!invalid[id]) paint(id, fmt(r.meats[i]));
      $(id).setAttribute('aria-invalid', String(!!invalid[id]));
    });
    if (!invalid.lPortion) paint('lPortion', fmt(st.keep || r.measured || st.mode === 'desired' ? r.per : st.portion));
    if (!invalid.lDesired) paint('lDesired', st.desired == null ? '' : fmt(st.desired));
    if (!invalid.lActual) paint('lActual', st.actual == null ? '' : fmt(st.actual));
    ['lPortion', 'lActual', 'lDesired'].forEach(function(id){ $(id).setAttribute('aria-invalid', String(!!invalid[id])); });
    $('lPortion').readOnly = st.keep || r.measured;
    $('lPortionHint').textContent = r.measured ? 'Фактический вес готового блюда ÷ число порций. Для нового расчёта продуктов очистите фактический вес.'
      : st.keep ? 'Общий вес сохранён: здесь рассчитанный вес одной порции.'
      : st.mode === 'desired' ? 'Рассчитано из желаемого общего выхода. Изменение этого поля пересчитает продукты под число порций.'
      : 'Желаемый вес порции: 10–1000 г. По умолчанию — 95 г; фактический выход приблизительный.';
    $('lN').textContent = st.N; $('lKeep').checked = st.keep || r.measured;
    $('lMeatTotal').textContent = 'Всего мяса: ' + fmt(r.meat) + ' г';
    $('lCountHint').textContent = r.measured ? 'Готовое блюдо: при смене числа порций продукты и фактический вес сохраняются.'
      : st.keep ? 'Продуктов столько же, меняется размер порции.'
      : st.mode === 'desired' ? 'Число порций подобрано под желаемый выход и выбранный размер порции.'
      : st.mode === 'manual' ? 'Число порций подобрано под введённый фарш.' : 'Продукты пересчитаны с сохранением выбранного состава.';
    $('lMinus').disabled = bad || empty || st.N <= 1;
    $('lPlus').disabled = bad || empty || st.N >= MAX_N;
    $('lKeep').disabled = bad || empty || r.measured;
    root.querySelectorAll('[data-scale]').forEach(function(button){
      button.disabled = bad || empty;
      button.setAttribute('aria-pressed', String(!st.keep && st.mode === 'portions' && st.N === C.servings * Number(button.dataset.scale)));
    });
    $('lError').hidden = !bad && !empty;
    $('lError').textContent = bad
      ? invalid.lActual ? 'Вес готового блюда должен быть больше 0 и не больше сырой смеси (' + fmt(r.raw) + ' г). Либо оставьте поле пустым.'
        : invalid.lDesired ? 'Введите желаемый вес готового блюда от 10 до 100 000 г. Либо оставьте поле пустым.'
        : invalid.lPortion ? 'Введите вес порции от 10 до 1000 г.' : 'Введите вес каждого вида мяса от 0 до 100 000 г. Чтобы убрать вид мяса, укажите 0.'
      : 'Добавьте хотя бы один вид мяса: общий вес фарша должен быть больше 0.';
    $('lResult').hidden = bad || empty;
    if (bad || empty) return;
    $('lIngredients').innerHTML = C.meats.map(function(m, i){
      return r.meats[i] ? row(m.name, fmt(r.meats[i]) + ' г', fmt(r.meats[i] / r.meat * 100) + '% мяса') : '';
    }).join('') + row(C.pepper.name, whole(r.pepper) + ' г', '12% от мяса, округление вверх до 5 г') +
      row(C.onion.name, whole(r.onion) + ' г', '20% от мяса, округление вверх до 5 г') +
      row('Соль', r.salt.toFixed(1).replace('.', ',') + ' г', '0,5% от мяса и овощей до добавления соли; округление до 0,1 г') +
      row('Специи', 'по вкусу', '(' + C.spices + ')');
    var notes = [];
    if (r.meats[0] > 0 && !r.meats[1] && !r.meats[2]) notes.push('Только грудка: следите за корочкой, чтобы не передержать.');
    if (st.mode === 'desired') notes.push('Желаемый выход: ' + fmt(st.desired) + ' г; после округления продуктов — ≈ ' + whole(r.estimated) + ' г.');
    $('lNotes').innerHTML = notes.map(function(n){ return '<li>' + esc(n) + '</li>'; }).join('');
    var view = {
      raw:r.raw, ready:r.ready, N:st.N, exact:r.measured,
      range:r.measured ? null : [r.readyLow, r.readyHigh],
      form:'Слой ' + fmt(C.thickness) + ' см. Для формы 20×20 см оптимально 995 г сырой смеси',
      cooking:[
        ['Режим духовки', '3D-Горячий воздух · ' + C.hotAir.temperature + ' °C · ' + C.hotAir.minutes.join('–') + ' мин'],
        ['Финишная корочка', 'Гриль с конвекцией · ' + C.grill.temperature.join('–') + ' °C · ' + C.grill.minutes.join('–') + ' мин']
      ],
      after:[['Отдых', C.rest + ' мин под фольгой вне духовки']],
      k100raw:r.k100raw, k100:r.k100, kOne:r.kOne,
      source:r.meats[2] ? 'Для расчётов использовался говяжий фарш Самсон — 143 ккал, Б 19, Ж 7,5, У 0 на 100 г.' : ''
    };
    $('lFacts').innerHTML = window.RecipeView.facts(view);
    $('lNutrition').innerHTML = window.RecipeView.nutrition(view);
    var steps = [
      'Очень мелко порубите очищенные лук и болгарский перец, не превращая их в жидкое пюре. Указан вес овощей после очистки.',
      'Вымесите холодный фарш с солью до липкости, затем вмешайте овощи и специи. Вымешивайте примерно 5–7 минут, не давая смеси нагреться.',
      'Накройте и охладите смесь в холодильнике 30–60 минут.',
      'Полностью разогрейте духовку до ' + C.hotAir.temperature + ' °C на режиме «3D-Горячий воздух».',
      'Выложите смесь ровным слоем ' + fmt(C.thickness) + ' см, уплотните без воздушных пустот.',
      'Готовьте без крышки: «3D-Горячий воздух» при ' + C.hotAir.temperature + ' °C — ' + C.hotAir.minutes.join('–') + ' минут. Время отсчитывайте после установки формы в разогретую духовку.',
      'Переключите на «Гриль с конвекцией»: ' + C.grill.temperature.join('–') + ' °C — ' + C.grill.minutes.join('–') + ' минуты. Следите за корочкой, не допускайте подгорания.',
      'Перед извлечением проверьте готовность в середине слоя, не касаясь дна: ' + (r.poultry ? 'в составе есть курица — не менее 74 °C.' : 'только говяжий фарш — не менее 71 °C.') + ' Если температура ниже, продолжите приготовление до готовности; если корочка уже достаточная, вернитесь к «3D-Горячему воздуху».',
      'Достаньте форму из духовки, поставьте на сухую жаростойкую подставку на столе. Накройте сверху листом фольги и оставьте на ' + C.rest + ' минут. Разделите на ' + st.N + ' порций.'
    ];
    $('lSteps').innerHTML = steps.map(function(s){ return '<li>' + esc(s) + '</li>'; }).join('');
  }
  update();
}
window.RecipeModules = window.RecipeModules || {};
window.RecipeModules.lyulya = { mount:mount, _test:{ defaults:defaults, sanitize:sanitize, batch:batch, compute:compute, parse:parse } };
})();
