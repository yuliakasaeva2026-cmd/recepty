/* Общие блоки рецептов. Раздел «Вафли» использует своё оформление. */
(function(){
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function number(v, digits){ return String(Number(v.toFixed(digits))).replace('.', ','); }
  function grams(v){ return number(v, v < 10 ? 1 : 0); }
  function portions(n){ var a = n % 10, b = n % 100; return a === 1 && b !== 11 ? 'порция' : a >= 2 && a <= 4 && (b < 12 || b > 14) ? 'порции' : 'порций'; }
  function lossy(r){ return r.raw - r.ready > 0.5; }
  function facts(r){
    var rows = [], approx = r.exact ? '' : '≈ ';
    if (lossy(r)) {
      rows.push(['Вес в сыром виде', grams(r.raw) + ' г']);
      rows.push(['Потери при приготовлении', '≈ ' + number((1 - r.ready / r.raw) * 100, 1) + '%']);
    }
    var output = 'всего ' + approx + grams(r.ready) + ' г ' + (r.what || 'готового блюда') + ', ' + r.N + ' ' + portions(r.N) + ' по ' + approx + grams(r.ready / r.N) + ' г';
    if (r.range) output += ' (ожидаемый выход ' + grams(r.range[0]) + '–' + grams(r.range[1]) + ' г)';
    if (r.exact) output += ' · фактический вес';
    rows.push(['Выход', output]);
    if (r.form) rows.push(['Форма', r.form]);
    rows = rows.concat(r.cooking || [], r.after || []);
    return rows.map(function(row){ return '<dt>' + esc(row[0]) + '</dt><dd>' + esc(row[1]) + '</dd>'; }).join('');
  }
  function cells(k){
    var labels = ['ккал','белки','жиры','углеводы','клетчатка'];
    return '<div class="kbju">' + labels.map(function(label, i){
      return '<div><b>' + number(k[i] || 0, i ? 1 : 0) + '</b><span>' + label + '</span></div>';
    }).join('') + '</div>';
  }
  function nutrition(r){
    var blocks = [];
    if (lossy(r)) blocks.push(['КБЖУ на 100 г в сыром виде', r.k100raw]);
    blocks.push(['КБЖУ на 100 г готового блюда', r.k100]);
    blocks.push(['КБЖУ на 1 порцию · ' + (r.exact ? '' : '≈ ') + grams(r.ready / r.N) + ' г', r.kOne]);
    return blocks.map(function(b, i){ return '<p class="label"' + (i ? ' style="margin-top:14px"' : '') + '>' + esc(b[0]) + '</p>' + cells(b[1]); }).join('') +
      '<p class="kbju-unit">Белки, жиры, углеводы и клетчатка — в граммах.</p>' +
      (r.source ? '<p class="hint">' + esc(r.source) + '</p>' : '');
  }
  window.RecipeView = {facts:facts, nutrition:nutrition};
})();
