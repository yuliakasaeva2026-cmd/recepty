/* Конструктор рецептов книги. Подключается как module 'recept', данные рецепта лежат в recipes.js в поле calc.
   Устроен так же, как вафли и запеканка: сколько порций, свои количества, варианты, статус «проверено», КБЖУ, шаги. */
(function(){
function fmt(g){ if (g == null) return ''; if (g < 10){ var v = Math.round(g * 10) / 10; return String(v).replace('.', ','); } return String(Math.round(g)); }
function fmt1(v){ return String(Math.round(v * 10) / 10).replace('.', ','); }
function plural(n, w){ n = Math.abs(Math.round(n)); var a = n % 10, b = n % 100; return (a === 1 && b !== 11) ? w[0] : (a >= 2 && a <= 4 && (b < 12 || b > 14)) ? w[1] : w[2]; }
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
function parseNum(v){ var x = parseFloat(String(v || '').replace(/\s/g, '').replace(',', '.')); return isNaN(x) || x < 0 ? null : x; }
var FR = { 0.5:'½' };
/* заметные веса — кратно 5 г, мелочи — до грамма */
function r5(g){ return g >= 7.5 ? Math.round(g / 5) * 5 : Math.round(g); }
function halves(v){ var r = Math.round(v * 2) / 2, w = Math.floor(r), p = r - w; return p ? (w ? w : '') + '½' : String(w); }

/* ===================== РАСЧЁТ ===================== */
function choiceOf(C, st, oid){
  var o = (C.options || []).filter(function(x){ return x.id === oid; })[0]; if (!o) return null;
  return o.choices.filter(function(c){ return c.id === st.opt[oid]; })[0] || o.choices[0];
}
function isOn(i, st){
  if (i.when && Object.keys(i.when).some(function(o){ var v = i.when[o]; return Array.isArray(v) ? v.indexOf(st.opt[o]) < 0 : st.opt[o] !== v; })) return false;
  if (i.extra && !st.ex[i.extra]) return false;
  return true;
}
function lossOf(C, i){ return i.loss != null ? i.loss : (C.loss || 0); }
/* продукт, у которого есть разновидности (например, майонез 30% или 67%) */
function nameOf(i, st){ return i.vary && i.vary[st.opt[i.vary.opt]] ? i.vary[st.opt[i.vary.opt]].name : i.name; }
function nutOf(i, st){ return i.vary && i.vary[st.opt[i.vary.opt]] ? i.vary[st.opt[i.vary.opt]].n : i.n; }
/* вариант показываем, только если он к чему-то относится */
function optRelevant(C, o, st){
  if (!o.onlyFor) return true;
  return C.ing.some(function(i){ return !i.group && i.vary && i.vary.opt === o.onlyFor && isOn(i, st); });
}
/* главный продукт на штуку (например, филе в шаверме): один вид или смесь двух */
function mainPlan(C, st){
  var M = C.main, mx = M.mix, ch = st.opt[M.opt], isMix = ch === mx.choice;
  var share = isMix ? (st.split != null ? st.split : 0.5) : (ch === mx.second ? 0 : 1);
  var m = st.mainPer || M.def, ml = st.mlock || {};
  var Lf = (isMix || share === 1) && ml[mx.first] != null ? ml[mx.first] : null;
  var Ls = (isMix || share === 0) && ml[mx.second] != null ? ml[mx.second] : null;
  var total = null;
  if (Lf != null && Ls != null){ total = Lf + Ls; if (total > 0) share = Lf / total; }
  else if (Lf != null) total = share > 0 ? Lf / share : Lf;
  else if (Ls != null) total = share < 1 ? Ls / (1 - share) : Ls;
  var N, mAct;
  if (total != null){ N = Math.max(1, Math.round(total / m)); mAct = total / N; }
  else { N = st.N || C.defN || 1; mAct = m; }
  return { N:N, mAct:mAct, share:share, f:mAct / M.def, locked:total != null, isMix:isMix, Lf:Lf, Ls:Ls };
}

function compute(C, st){
  var list = C.ing.filter(function(i){ return !i.group && isOn(i, st); });
  var body = list.filter(function(i){ return !i.perUnit && !i.noMass; });
  var raw0 = 0, ready0 = 0;
  body.forEach(function(i){ raw0 += i.g; ready0 += i.g * (1 - lossOf(C, i)); });
  var por = C.portion, P = por ? (st.portion || por.def) : null, per0 = por ? (por.of === 'raw' ? raw0 : ready0) : null;
  var lockDef = st.lock ? (C.locks || []).filter(function(l){ return l.id === st.lock.id; })[0] : null;
  var lockItem = lockDef ? list.filter(function(i){ return (i.lock || i.id) === lockDef.id; })[0] : null;
  var lockG = lockItem ? st.lock.g : null;
  var N, s, fit = true, best = null, mp = C.main ? mainPlan(C, st) : null, parts = {};
  if (mp){
    N = mp.N; s = N / (C.batchN || 1);
  } else if (!por){
    var bn = C.batchN || 1;
    N = lockG != null ? Math.max(1, Math.round(lockG / (lockItem.g / bn))) : (st.N || C.defN || bn);
    s = N / bn;
  } else if (lockG != null){
    s = lockG / lockItem.g;
    var mass = per0 * s;
    for (var n = 1; n <= 199; n++){
      var p = mass / n, inR = p >= por.min - 0.5 && p <= por.max + 0.5;
      var score = inR ? Math.abs(p - P) : 1000 + Math.min(Math.abs(p - por.min), Math.abs(p - por.max));
      if (!best || score < best.score) best = { n:n, inR:inR, score:score };
    }
    N = best.n; fit = best.inR;
  } else if (st.keep && st.fixS && st.N){
    /* общий вес не меняется: меняется вес одной порции */
    s = st.fixS; N = st.N;
  } else if (!st.N && !st.portion){
    /* по умолчанию — ровно ваш рецепт, порции считаются из него */
    s = 1; N = Math.max(1, Math.round(per0 / P));
  } else {
    N = st.N || Math.max(1, Math.round(per0 / P));
    s = N * P / per0;
    var an = body.filter(function(i){ return i.piece && i.anchor && !(i.piece.loose && st.loose[i.id]); })[0];
    if (an) s = Math.max(1, Math.round(an.g * s / an.piece.g)) * an.piece.g / an.g;
  }
  /* части с общим весом (соус): меняете одну — остальные подстраиваются */
  if (mp && C.parts) Object.keys(C.parts).forEach(function(pid){
    var PD = C.parts[pid], items = list.filter(function(i){ return i.part === pid; });
    var basis = (st.ptot && st.ptot[pid]) || PD.def, per = basis * mp.f, sum = items.reduce(function(a, i){ return a + i.g; }, 0);
    var us = st.pshare && st.pshare[pid] && items.some(function(i){ return i.id === st.pshare[pid].id; }) ? st.pshare[pid] : null;
    var sh = {}, dev = Math.abs(basis - PD.def) / PD.def > 0.1;
    items.forEach(function(i){ sh[i.id] = sum ? i.g / sum : 0; });
    if (us){
      var b0 = sh[us.id], v = Math.max(0, Math.min(1, us.share));
      items.forEach(function(i){ sh[i.id] = i.id === us.id ? v : (b0 < 1 ? sh[i.id] * (1 - v) / (1 - b0) : 0); });
      if (b0 > 0 && Math.abs(v - b0) / b0 > 0.1) dev = true;
    }
    /* граммы на всё количество: общий вес и заметные части кратно 5 г, сумма частей = общему весу */
    var Nn = mp.N, T = r5(per * Nn), amt = {}, fixedSum = 0, big = [];
    items.forEach(function(i){
      var ex = per * sh[i.id] * Nn;
      if (us && us.id === i.id){ amt[i.id] = us.share * per * Nn; fixedSum += amt[i.id]; }
      else if (ex < 7.5){ amt[i.id] = Math.round(ex); fixedSum += amt[i.id]; }
      else big.push({ id:i.id, ex:ex });
    });
    if (big.length){
      var units = Math.max(0, Math.round((T - fixedSum) / 5)), exSum = big.reduce(function(a, b){ return a + b.ex; }, 0), used = 0;
      big.forEach(function(b){ b.q = exSum ? units * b.ex / exSum : 0; b.u = Math.floor(b.q); used += b.u; });
      big.slice().sort(function(a, b){ return (b.q - b.u) - (a.q - a.u); }).slice(0, units - used).forEach(function(b){ b.u++; });
      big.forEach(function(b){ amt[b.id] = b.u * 5; });
    }
    T = items.reduce(function(a, i){ return a + amt[i.id]; }, 0);
    parts[pid] = { per:T / Nn, basis:basis, sh:sh, amt:amt, items:items, user:us, dev:dev };
  });
  /* количества */
  var A = {}, round = [];
  list.forEach(function(i){
    var a = i.perUnit ? i.perUnit * N : i.g * s, mine = i === lockItem && lockG != null;
    if (mp){
      if (i.main){
        a = (i.main === C.main.mix.first ? mp.share : 1 - mp.share) * mp.mAct * N;
        mine = (i.main === C.main.mix.first ? mp.Lf : mp.Ls) != null;
        if (mine) a = i.main === C.main.mix.first ? mp.Lf : mp.Ls;
      }
      else if (i.part) a = parts[i.part].amt[i.id];
      else if (i.with) a = i.g * parts[i.with].per / C.parts[i.with].def * N;
      else if (i.perPiece) a = i.g * N;
      else if (!i.perUnit) a = i.g * mp.f * N;
    }
    if (mine && !mp) a = lockG;
    if (!mine && !i.part && !(i.spice && a < 10) && !i.pinch && !i.noMass && !i.piece && !i.exact && !i.perUnit && !i.with) a = r5(a);
    var cnt = null, byWeight = i.piece && i.piece.loose && st.loose[i.id];
    if (i.piece && (mine || byWeight)) cnt = a / i.piece.g;
    else if (i.piece){
      var exact = a / i.piece.g; cnt = Math.max(1, Math.round(exact)); a = cnt * i.piece.g;
      if (!i.noMass && Math.abs(cnt - exact) >= 0.25) round.push({ i:i, exact:exact, cnt:cnt });
    }
    A[i.id] = { g:a, cnt:cnt, mine:mine, byWeight:!!byWeight };
  });
  /* итоги */
  var raw = 0, ready = 0, perMass = 0, tot = [0, 0, 0, 0, 0];
  list.forEach(function(i){
    if (i.noMass) return;
    var a = A[i.id].g, r = a * (1 - lossOf(C, i));
    raw += a; ready += r;
    if (!i.perUnit) perMass += por && por.of === 'raw' ? a : r;
    var nn = nutOf(i, st); if (nn) for (var k = 0; k < 5; k++) tot[k] += a * (nn[k] || 0) / 100;
  });
  /* статус */
  var fresh = (C.options || []).some(function(o){ var c = choiceOf(C, st, o.id); return c && c.fresh && optRelevant(C, o, st); }) ||
              (C.extras || []).some(function(e){ return e.fresh && st.ex[e.id]; });
  var dev = lockG != null && Math.abs(lockG - lockItem.g * s) / (lockItem.g * s) > 0.1;
  if (mp && (Math.abs(mp.f - 1) > 0.1 || Object.keys(parts).some(function(pid){ return parts[pid].dev; }))) dev = true;
  var status = !C.tested ? 'new' : fresh ? 'fresh' : dev ? 'dev' : 'ok';
  var suggest = [];
  if (por && lockG != null && !fit){
    [N - 1, N, N + 1].forEach(function(n2){ if (n2 >= 1) suggest.push({ n:n2, g: lockItem.g * n2 * P / per0 }); });
  }
  var kept = !!(por && lockG == null && st.keep && st.fixS && st.N);
  return { mp:mp, parts:parts, kept:kept, list:list, A:A, N:N, s:s, P:P, por:por, Pact: por ? perMass / N : ready / N, perMass:perMass, raw:raw, ready:ready, lossy: raw - ready > 0.5,
    tot:tot, status:status, lockItem:lockItem, lockDef:lockDef, lockG:lockG, fit:fit, suggest:suggest, round:round, dev:dev,
    k100raw: tot.map(function(v){ return v / raw * 100; }), k100: tot.map(function(v){ return v / ready * 100; }), kOne: tot.map(function(v){ return v / N; }) };
}

/* ===================== ИНТЕРФЕЙС ===================== */
function mount(root, rec){
  var C = rec.calc; if (!C){ root.innerHTML = '<p>Рецепт не найден.</p>'; return; }
  var KEY = 'recept-' + rec.id, U = C.unit;
  function load(){ try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch(e){ return {}; } }
  function save(){ try { localStorage.setItem(KEY, JSON.stringify(st)); } catch(e){} }
  var st = load();
  function sanitize(){
    if (!st.opt || typeof st.opt !== 'object') st.opt = {};
    (C.options || []).forEach(function(o){ if (!o.choices.some(function(c){ return c.id === st.opt[o.id]; })) st.opt[o.id] = o.choices[0].id; });
    if (!st.ex || typeof st.ex !== 'object'){ st.ex = {}; (C.extras || []).forEach(function(e){ st.ex[e.id] = !!e.def; }); }
    (C.extras || []).forEach(function(e){ if (typeof st.ex[e.id] !== 'boolean') st.ex[e.id] = !!e.def; });
    if (!st.loose || typeof st.loose !== 'object') st.loose = {};
    ['mlock', 'ptot', 'pshare'].forEach(function(k){ if (!st[k] || typeof st[k] !== 'object') st[k] = {}; });
    if (!(st.mainPer > 0)) st.mainPer = null;
    if (!(st.split >= 0 && st.split <= 1)) st.split = null;
    if (!(st.N >= 1)) st.N = null;
    st.keep = !!st.keep && !!C.portion; if (!(st.fixS > 0)) st.fixS = null;
    if (!(st.portion > 0) || !C.portion) st.portion = null;
    if (!st.lock || !(st.lock.g > 0) || !(C.locks || []).some(function(l){ return l.id === st.lock.id; })) st.lock = null;
  }
  sanitize();
  var secNames = (rec.sections || []).map(function(s){ return (window.BOOK.sections.filter(function(x){ return x.id === s; })[0] || {}).name; }).filter(Boolean).join(' · ');
  var countWord = U[2].charAt(0).toUpperCase() + U[2].slice(1), unitAcc = U[0].replace(/а$/, 'у').replace(/я$/, 'ю');

  root.innerHTML =
    '<header class="r-head"><span class="eyebrow">' + esc(secNames) + '</span><h1>' + esc(rec.title) + '</h1><p class="lead">' + esc(C.lead || rec.summary || '') + '</p></header>' +
    '<div class="grid">' +
      '<div class="panel">' +
        '<section class="block"><h2>Сколько ' + esc(U[2]) + '</h2>' +
          '<div class="field"><span class="label">' + esc(countWord) + '</span><div class="stepper"><button type="button" id="cMinus" aria-label="Меньше">−</button><output id="cN"></output><button type="button" id="cPlus" aria-label="Больше">+</button></div><p class="state" id="cNHint"></p></div>' +
          (C.portion ? '<label class="check"><input type="checkbox" id="cKeep"><span><span>Не менять общий вес</span><small>Тогда при смене числа ' + esc(U[2]) + ' меняется вес одной ' + esc(U[1]) + ', а продуктов столько же</small></span></label>' : '') +
          (C.portion ? '<div class="field"><label class="label" for="cP">' + esc(C.portion.label) + '</label><div class="inrow"><div class="num" id="cP-box"><input id="cP" type="text" inputmode="decimal" autocomplete="off"><span>г</span></div><button type="button" class="reset" id="cP-reset" hidden>Как в рецепте</button></div><p class="state" id="cPHint"></p></div>' : '') +
          '<div id="cMain"></div><div id="cLocks"></div>' +
        '</section>' +
        '<div id="cLoose" class="panel"></div>' +
        '<div id="cOpts" class="panel"></div>' +
        ((C.extras || []).length ? '<section class="block"><h2>Добавки по желанию</h2><div class="checks" id="cExtras"></div></section>' : '') +
        '<div><button type="button" class="ghost" id="cResetAll">Вернуть всё к рецепту</button></div>' +
      '</div>' +
      '<div class="result" aria-live="polite">' +
        '<div class="dish">' +
          '<div class="dish-head"><h2>Что положить</h2><span class="pill" id="cStatus"></span></div>' +
          '<ul class="ing" id="cIng"></ul>' +
          '<ul class="notes" id="cNotes"></ul>' +
          '<dl class="facts" id="cFacts"></dl>' +
          '<div id="cKbju"></div>' +
        '</div>' +
        '<section class="block steps"><h2>Как готовить</h2><ol id="cSteps"></ol></section>' +
      '</div>' +
    '</div>';

  function $(id){ return document.getElementById(id); }
  function changed(){ save(); update(); }
  function numField(id, label, onSet, onClear){
    var d = document.createElement('div'); d.className = 'field';
    d.innerHTML = '<label class="label" for="' + id + '">' + esc(label) + '</label><div class="inrow"><div class="num" id="' + id + '-box"><input id="' + id + '" type="text" inputmode="decimal" autocomplete="off"><span>г</span></div><button type="button" class="reset" id="' + id + '-reset" hidden>По рецепту</button></div><p class="state" id="' + id + '-state"></p>';
    var inp = d.querySelector('input');
    inp.addEventListener('input', function(){ var v = parseNum(inp.value); if (v == null || v <= 0) return; onSet(v); changed(); });
    inp.addEventListener('blur', function(){ if (inp.value.trim() === ''){ onClear(); changed(); } else update(); });
    d.querySelector('.reset').addEventListener('click', function(){ onClear(); changed(); });
    return d;
  }
  function paintField(id, val, user, state){
    var inp = $(id); if (!inp) return;
    if (document.activeElement !== inp) inp.value = fmt(val);
    $(id + '-box').classList.toggle('user', !!user);
    $(id + '-reset').hidden = !user;
    $(id + '-state').textContent = state;
  }
  /* свои количества */
  (C.locks || []).forEach(function(l){
    $('cLocks').appendChild(numField('cL-' + l.id, l.label, function(v){ st.lock = { id:l.id, g:v }; st.N = null; st.fixS = null; }, function(){ if (st.lock && st.lock.id === l.id) st.lock = null; }));
  });
  /* главный продукт на штуку */
  if (C.main){
    var MM = C.main;
    $('cMain').appendChild(numField('cMainPer', MM.label, function(v){ st.mainPer = Math.max(MM.min || 1, Math.min(MM.max || 9999, v)); }, function(){ st.mainPer = null; }));
    [MM.mix.first, MM.mix.second].forEach(function(key){
      var fd = numField('cML-' + key, MM.items[key].lock, function(v){ st.mlock[key] = v; st.N = null; }, function(){ delete st.mlock[key]; });
      fd.dataset.key = key; $('cMain').appendChild(fd);
    });
  }
  function partBlock(pid){
    var PD = C.parts[pid], sec = document.createElement('section'); sec.className = 'block';
    sec.innerHTML = '<h2>' + esc(PD.title) + '</h2><div class="field"><span class="label">' + esc(PD.label) + '</span><div class="stepper"><button type="button" data-d="-1" aria-label="Меньше">−</button><output id="cPT-' + pid + '"></output><button type="button" data-d="1" aria-label="Больше">+</button></div><p class="state" id="cPT-' + pid + '-state"></p></div>' +
      '<div class="flourfields two" id="cPF-' + pid + '"></div>';
    sec.querySelectorAll('.stepper button').forEach(function(b){
      b.addEventListener('click', function(){
        var cur = last.parts[pid].per, nv = Math.max(PD.min, Math.min(PD.max, Math.round((cur + Number(b.dataset.d) * PD.step) / PD.step) * PD.step));
        st.ptot[pid] = nv / last.mp.f; changed();
      });
    });
    var box = sec.querySelector('#cPF-' + pid);
    C.ing.filter(function(i){ return i.part === pid; }).forEach(function(i){
      var fd = numField('cPI-' + i.id, (i.partLabel || i.name) + ' на 1 ' + unitAcc,
        function(v){ st.pshare[pid] = { id:i.id, share: Math.min(1, v / last.parts[pid].per) }; },
        function(){ if (st.pshare[pid] && st.pshare[pid].id === i.id) delete st.pshare[pid]; });
      fd.dataset.id = i.id; box.appendChild(fd);
    });
    return sec;
  }
  /* желтки или белки отдельно: можно ли по весу */
  C.ing.filter(function(i){ return i.piece && i.piece.loose; }).forEach(function(i){
    var sec = document.createElement('section'); sec.className = 'block';
    sec.innerHTML = '<h2>' + esc(i.piece.loose.title) + '</h2><div class="seg" role="group" aria-label="' + esc(i.piece.loose.title) + '"></div><p class="hint">' + esc(i.piece.loose.hint) + '</p>';
    var sg = sec.querySelector('.seg');
    [[false, 'Целыми, по штукам'], [true, 'По весу, из бутылки']].forEach(function(o){
      var b = document.createElement('button'); b.type = 'button'; b.dataset.v = String(o[0]); b.textContent = o[1];
      b.addEventListener('click', function(){ st.loose[i.id] = o[0]; changed(); });
      sg.appendChild(b);
    });
    sec.dataset.id = i.id;
    $('cLoose').appendChild(sec);
  });
  /* варианты */
  (C.options || []).forEach(function(o){
    var sec = document.createElement('section'); sec.className = 'block';
    sec.innerHTML = '<h2>' + esc(o.title) + '</h2><div class="blends" role="radiogroup" aria-label="' + esc(o.title) + '"></div>' + (o.hint ? '<p class="hint">' + esc(o.hint) + '</p>' : '');
    var box = sec.querySelector('.blends');
    o.choices.forEach(function(c){
      var lab = document.createElement('label'); lab.className = 'blend'; lab.dataset.opt = o.id; lab.dataset.id = c.id;
      lab.innerHTML = '<input type="radio" name="c-' + o.id + '" value="' + c.id + '"><span class="blend-txt"><span class="blend-name">' + esc(c.name) +
        (c.rec ? ' <span class="chip">рекомендую</span>' : '') + (C.tested && !c.fresh ? ' <span class="chip ok-chip">проверено</span>' : '') + '</span><small>' + esc(c.note || '') + '</small></span>';
      lab.querySelector('input').addEventListener('change', function(){ st.opt[o.id] = c.id; changed(); });
      box.appendChild(lab);
    });
    sec.dataset.oid = o.id;
    if (C.main && C.main.opt === o.id){
      var sp = numField('cSplit', C.main.mix.label, function(v){ st.split = Math.max(0, Math.min(1, v / last.mp.mAct)); }, function(){ st.split = null; });
      sp.id = 'cSplitBox'; sec.appendChild(sp);
    }
    $('cOpts').appendChild(sec);
    Object.keys(C.parts || {}).forEach(function(pid){ if (C.parts[pid].afterOpt === o.id) $('cOpts').appendChild(partBlock(pid)); });
  });
  /* добавки по желанию */
  (C.extras || []).forEach(function(e){
    var lab = document.createElement('label'); lab.className = 'check';
    lab.innerHTML = '<input type="checkbox" id="cX-' + e.id + '"><span><span>' + esc(e.name) + '</span> <span class="check-g" id="cX-' + e.id + '-g"></span>' + (e.note ? '<small>' + esc(e.note) + '</small>' : '') + '</span>';
    lab.querySelector('input').addEventListener('change', function(ev){ st.ex[e.id] = ev.target.checked; changed(); });
    $('cExtras').appendChild(lab);
  });
  var last = null;
  function stepN(d){
    var n = last.N + d; if (n < 1 || n > 99) return;
    if (st.keep && C.portion){ st.fixS = last.s; }
    st.N = n; st.lock = null; changed();
  }
  $('cMinus').addEventListener('click', function(){ stepN(-1); });
  $('cPlus').addEventListener('click', function(){ stepN(1); });
  if (C.portion){
    $('cKeep').addEventListener('change', function(ev){
      st.keep = ev.target.checked;
      if (!st.keep && last.kept){ st.portion = Math.round(last.Pact); st.N = last.N; }
      st.fixS = null; changed();
    });
    var pIn = $('cP');
    pIn.addEventListener('input', function(){
      var v = parseNum(pIn.value); if (v == null || v < 20 || v > 2000) return;
      if (st.keep){ st.fixS = last.s; st.N = Math.max(1, Math.round(last.perMass / v)); st.lock = null; }
      st.portion = v; changed();
    });
    pIn.addEventListener('blur', function(){ if (pIn.value.trim() === ''){ st.portion = null; changed(); } else update(); });
    $('cP-reset').addEventListener('click', function(){ st.portion = null; changed(); });
  }
  $('cResetAll').addEventListener('click', function(){ st.lock = null; st.portion = null; st.N = null; st.fixS = null; st.mainPer = null; st.mlock = {}; st.ptot = {}; st.pshare = {}; st.split = null; changed(); });

  function kbju(k){
    return '<div class="kbju"><div><b>' + Math.round(k[0]) + '</b><span>ккал</span></div><div><b>' + fmt1(k[1]) + '</b><span>белки</span></div>' +
      '<div><b>' + fmt1(k[2]) + '</b><span>жиры</span></div><div><b>' + fmt1(k[3]) + '</b><span>углеводы</span></div><div><b>' + fmt1(k[4] || 0) + '</b><span>клетчатка</span></div></div>';
  }
  function row(name, qty, sub){ return '<li><span class="ing-n">' + name + '</span><span class="ing-q">' + qty + '</span>' + (sub ? '<span class="ing-s">' + sub + '</span>' : '') + '</li>'; }
  function qtyOf(i, a){
    if (i.piece && (a.byWeight || a.mine) && !i.noMass) return fmt(a.g) + ' г · ≈ ' + fmt1(a.cnt) + ' ' + (Math.abs(a.cnt - Math.round(a.cnt)) > 0.05 ? i.piece.words[1] : plural(a.cnt, i.piece.words));
    if (i.piece) return (i.piece.show === 'half' ? halves(a.cnt) : Math.round(a.cnt)) + ' ' + (i.piece.show === 'half' && Math.round(a.cnt * 2) % 2 ? i.piece.words[1] : plural(a.cnt, i.piece.words)) + (i.noMass ? '' : ' · ' + fmt(a.g) + ' г');
    if ((i.spice || i.pinch) && a.g < 0.3) return 'щепотка';
    var t = fmt(a.g) + ' г';
    if (i.approx){ var c = a.g / i.approx.g; t += ' · ≈ ' + halves(c) + ' ' + (Math.round(c * 2) % 2 ? i.approx.words[1] : plural(c, i.approx.words)); }
    return t;
  }
  function amountText(r, id){
    var i = r.list.filter(function(x){ return x.id === id; })[0]; if (!i) return '';
    return qtyOf(i, r.A[id]);
  }

  function update(){
    var r = compute(C, st); last = r;
    /* поля */
    $('cN').textContent = r.N;
    $('cNHint').textContent = r.lockG != null ? 'Подобрано под ваше количество' : (C.countHint || '');
    if (C.portion){
      $('cKeep').checked = !!st.keep;
      var pIn = $('cP'); if (document.activeElement !== pIn) pIn.value = fmt(r.Pact);
      $('cP-box').classList.toggle('user', !!st.portion && r.lockG == null && !r.kept);
      $('cP-reset').hidden = !st.portion || r.lockG != null || !!st.keep;
      $('cPHint').textContent = C.portion.hint + (r.kept ? ' Общий вес не меняется, поэтому вес порции считается сам.' :
        r.lockG != null ? ' Под ваше количество выходит столько.' :
        Math.abs(r.Pact - r.P) >= 1 ? (!st.N && !st.portion ? ' Так выходит по вашему рецепту.' : C.portion.why ? ' Ближе к ' + fmt(r.P) + ' г не выходит: ' + C.portion.why + '.' : '') : '');
    }
    (C.locks || []).forEach(function(l){
      var it = r.list.filter(function(i){ return (i.lock || i.id) === l.id; })[0], user = st.lock && st.lock.id === l.id;
      if (!$('cL-' + l.id)) return;
      paintField('cL-' + l.id, it ? r.A[it.id].g : 0, user, user ? 'Ваше количество: число ' + U[2] + ' и остальное подстроились' : st.lock ? 'Подобрано под ваши значения' : 'По рецепту на ' + r.N + ' ' + plural(r.N, U));
    });
    if (r.mp){
      var MM = C.main, isFirst = function(k){ return k === MM.mix.first; };
      paintField('cMainPer', r.mp.mAct, !!st.mainPer && !r.mp.locked, r.mp.locked ? 'Подобрано под ваше филе' : st.mainPer ? 'Ваше количество: овощи и соус подстроились' : 'По рецепту');
      [MM.mix.first, MM.mix.second].forEach(function(key){
        var on = r.mp.isMix || (isFirst(key) ? r.mp.share === 1 : r.mp.share === 0);
        var fd = $('cML-' + key).closest('.field'); fd.hidden = !on;
        var it = r.list.filter(function(i){ return i.main === key; })[0];
        if (on) paintField('cML-' + key, it ? r.A[it.id].g : 0, st.mlock[key] != null, st.mlock[key] != null ? 'Ваше количество: число ' + U[2] + ', овощи и соус подстроились' : 'По рецепту на ' + r.N + ' ' + plural(r.N, U));
      });
      $('cSplitBox').hidden = !r.mp.isMix;
      if (r.mp.isMix) paintField('cSplit', r.mp.mAct * r.mp.share, st.split != null || (r.mp.Lf != null && r.mp.Ls != null), MM.mix.rest + ' ' + fmt(r.mp.mAct * (1 - r.mp.share)) + ' г на 1 ' + unitAcc);
    }
    Object.keys(r.parts).forEach(function(pid){
      var pt = r.parts[pid], PD = C.parts[pid];
      $('cPT-' + pid).textContent = fmt(pt.per) + ' г';
      $('cPT-' + pid + '-state').textContent = Math.abs(pt.basis - PD.def) < 0.5 ? 'По рецепту: ' + PD.def + ' г на ' + C.main.def + ' г ' + C.main.gen + (Math.abs(r.mp.f - 1) > 0.01 ? ', у вас ' + fmt(r.mp.mAct) + ' г' : '') : 'Ваше количество';
      document.querySelectorAll('#cPF-' + pid + ' .field').forEach(function(fd){
        var id = fd.dataset.id, on = pt.items.some(function(i){ return i.id === id; }); fd.hidden = !on;
        if (on) paintField('cPI-' + id, pt.amt[id] / r.N, pt.user && pt.user.id === id, pt.user ? (pt.user.id === id ? 'Ваше количество' : 'Подстроилось') : 'По рецепту');
      });
    });
    document.querySelectorAll('#cOpts > .block[data-oid]').forEach(function(sec){
      var o = C.options.filter(function(x){ return x.id === sec.dataset.oid; })[0]; sec.hidden = !optRelevant(C, o, st);
    });
    document.querySelectorAll('#cLoose .block').forEach(function(sec){
      var on = !!st.loose[sec.dataset.id];
      sec.hidden = !r.list.some(function(i){ return i.id === sec.dataset.id; });
      sec.querySelectorAll('button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.v === String(on))); });
    });
    document.querySelectorAll('#cOpts .blend').forEach(function(l){
      var on = st.opt[l.dataset.opt] === l.dataset.id; l.classList.toggle('on', on); l.querySelector('input').checked = on;
    });
    (C.extras || []).forEach(function(e){
      $('cX-' + e.id).checked = !!st.ex[e.id];
      var gi = C.ing.filter(function(i){ return i.extra === e.id && !i.group; }), g = 0;
      var sOn = Object.assign({}, st, { ex: Object.assign({}, st.ex) }); sOn.ex[e.id] = true;
      var r2 = compute(C, sOn);
      gi.forEach(function(i){ if (r2.A[i.id]) g += r2.A[i.id].g; });
      $('cX-' + e.id + '-g').textContent = g ? '· ' + fmt(g) + ' г' : '';
    });
    /* статус */
    var pill = $('cStatus');
    if (r.status === 'ok'){ pill.className = 'pill ok'; pill.textContent = 'Проверено'; }
    else if (r.status === 'dev'){ pill.className = 'pill tweak'; pill.textContent = 'Ваше количество, пропорции изменены · не проверено'; }
    else { pill.className = 'pill new'; pill.textContent = r.status === 'new' ? 'Новый рецепт · не проверено' : 'Новый вариант · не проверено'; }
    var ok = r.status === 'ok' ? '<span class="chip ok-chip">проверено</span>' : '';
    /* ингредиенты */
    var h = '', pend = null, mixDone = {};
    C.ing.forEach(function(i, idx){
      if (i.group){ pend = i.group; return; }
      if (!isOn(i, st)) return;
      if (pend){ h += '<li class="grp">' + esc(pend) + '</li>'; pend = null; }
      if (i.mix){
        if (mixDone[i.mix]) return; mixDone[i.mix] = 1;
        var mates = C.ing.filter(function(x){ return x.mix === i.mix && !x.group && isOn(x, st); }), g = 0;
        mates.forEach(function(x){ g += r.A[x.id].g; });
        h += row(esc(i.mix) + ' (' + mates.map(function(x){ return esc(x.short || x.name.toLowerCase()); }).join(', ') + ')', g < 0.3 ? 'щепотка' : fmt(g) + ' г',
          [mates.some(function(x){ return x.spice; }) ? 'рекомендую' : ok, i.mixNote ? esc(i.mixNote) : ''].filter(Boolean).join(' · '));
        return;
      }
      if (i.textFn){ h += row(esc(i.name), '', esc(i.textFn(r.s))); return; }
      var a = r.A[i.id], sub = [];
      if (i.spice) sub.push('рекомендую'); else if (!i.free) sub.push(ok);
      if (a.mine) sub.push('ваше количество');
      if (i.perUnit) sub.push(fmt(i.perUnit) + ' г на ' + U[0].replace(/а$/, 'у').replace(/я$/, 'ю'));
      if (i.ml) sub.push('≈ ' + fmt(r5(a.g / i.ml)) + ' мл');
      if (i.range) sub.push('по вкусу ' + fmt(r5(i.range[0] * r.s)) + '–' + fmt(r5(i.range[1] * r.s)) + ' г');
      if (i.vs) sub.push('из них ' + fmt(Math.max(5, r5(i.vs * r.s))) + ' г можно заменить ванильным сахаром');
      if (i.note) sub.push(esc(i.note));
      h += row(esc(nameOf(i, st)), qtyOf(i, a), sub.filter(Boolean).join(' · '));
    });
    $('cIng').innerHTML = h;
    /* пояснения */
    var notes = [];
    r.round.forEach(function(x){
      notes.push(['', x.i.piece.title + ': при пересчёте вышло бы ' + fmt1(x.exact) + ', беру ' + x.cnt + (x.i.piece.why ? ': ' + x.i.piece.why : '') + '.']);
    });
    if (r.mp && r.mp.locked) notes.push(['', 'Под ваше филе — ' + r.N + ' ' + plural(r.N, U) + ' по ' + fmt(r.mp.mAct) + ' г филе. Овощи и соус пересчитаны под это количество.']);
    else if (r.mp && Math.abs(r.mp.f - 1) > 0.01) notes.push(['', 'Филе по ' + fmt(r.mp.mAct) + ' г на ' + unitAcc + ': овощи и соус пересчитаны под это количество.']);
    if (r.dev && r.lockItem){
      notes.push(['', 'Под ваше количество — ' + r.N + ' ' + plural(r.N, U) + ', по ' + fmt(r.lockG / r.N) + ' г вместо ' + fmt(r.lockItem.g / (C.batchN || 1)) + ' г. Остальное — как в рецепте на ' + r.N + ' ' + plural(r.N, U) + '.']);
    }
    if (r.por && r.lockG != null && !r.fit){
      notes.push(['warn', 'С таким количеством выходит ' + r.N + ' ' + plural(r.N, U) + ' по ' + fmt(r.Pact) + ' г — это вне нормы (' + C.portion.word + '). Чтобы попасть в норму, возьмите ' + r.lockDef.gen + ': ' +
        r.suggest.map(function(x){ return fmt(x.g) + ' г на ' + x.n + ' ' + plural(x.n, U); }).join(', ') + '.']);
    }
    if (r.por && r.lockG == null && (r.Pact < r.por.min - 1 || r.Pact > r.por.max + 1)) notes.push(['warn', 'Сейчас по ' + fmt(r.Pact) + ' г, а для этого рецепта ' + C.portion.word + '.']);
    /* ваш рецепт показываем только для вашего же варианта: у нового варианта он ни при чём */
    if (C.orig && r.status !== 'fresh') notes.push(['', '<b>Ваш рецепт:</b> ' + esc(C.orig) + (r.status === 'dev' ? ' Сейчас пропорции изменены, поэтому без отметки «проверено».' : '')]);
    (C.tips || []).forEach(function(t){ notes.push(['', esc(t)]); });
    (C.serving || []).forEach(function(v){ notes.push(['spice', '<b>' + esc(v.t) + ':</b> ' + esc(v.x)]); });
    $('cNotes').innerHTML = notes.map(function(n){ return '<li' + (n[0] ? ' class="' + n[0] + '"' : '') + '>' + n[1] + '</li>'; }).join('');
    /* факты */
    var out = r.por
      ? r.N + ' ' + plural(r.N, U) + ' по ' + fmt(r.Pact) + '&nbsp;г ' + C.portion.what + ', всего ' + fmt(r.perMass) + '&nbsp;г'
      : r.N + ' ' + plural(r.N, U) + ', каждая ≈ ' + fmt(r.Pact) + ' г';
    $('cFacts').innerHTML = '<dt>Выход</dt><dd>' + out + '</dd>' + (C.facts || []).map(function(f){ return '<dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd>'; }).join('');
    /* КБЖУ */
    var kh = '';
    if (r.lossy){
      kh += '<p class="label">КБЖУ на 100 г ' + esc(C.rawWord || 'до приготовления') + '</p>' + kbju(r.k100raw);
      kh += '<p class="label" style="margin-top:14px">На 100 г ' + esc(C.readyWord || 'готового блюда') + '</p>' + kbju(r.k100);
    } else kh += '<p class="label">КБЖУ на 100 г</p>' + kbju(r.k100);
    kh += '<p class="label" style="margin-top:14px">На 1 ' + esc(U[0].replace(/а$/, 'у').replace(/я$/, 'ю')) + '</p>' + kbju(r.kOne);
    kh += '<p class="kbju-unit">Белки, жиры, углеводы и клетчатка — в граммах.</p>';
    if (r.lossy) kh += '<p class="hint" style="margin-top:8px">При приготовлении уходит около ' + Math.round((1 - r.ready / r.raw) * 100) + '% влаги: из ' + fmt(r.raw) + ' г выйдет примерно ' + fmt(r.ready) + ' г. Поэтому в 100 г готового калорий и БЖУ больше.</p>';
    $('cKbju').innerHTML = kh;
    /* шаги */
    var q = {
      a: function(id){ return amountText(r, id); },
      has: function(id){ return r.list.some(function(i){ return i.id === id; }); },
      opt: function(oid){ return st.opt[oid]; },
      one: function(id){ var i = r.list.filter(function(x){ return x.id === id; })[0]; return i ? fmt(i.perUnit || r.A[id].g / r.N) + ' г' : ''; },
      N: r.N, P: fmt(r.Pact) + ' г', NU: r.N + ' ' + plural(r.N, U)
    };
    $('cSteps').innerHTML = C.steps(q).filter(Boolean).map(function(x){ return '<li>' + x + '</li>'; }).join('');
  }
  update();
}

window.RecipeModules = window.RecipeModules || {};
window.RecipeModules.recept = { mount: mount, _test: { compute: compute } };
})();
