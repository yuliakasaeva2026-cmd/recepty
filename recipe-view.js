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
      rows.push(['Потери', '≈ ' + number((1 - r.ready / r.raw) * 100, 1) + '%']);
    }
    var output = r.N === 1
      ? [approx + grams(r.ready) + ' г', '1 порция']
      : ['всего ' + approx + grams(r.ready) + ' г', r.N + ' ' + portions(r.N) + ' по ' + approx + grams(r.ready / r.N) + ' г'];
    var detail = r.outputNote || '';
    if (r.range) detail = 'Ожидаемый выход ' + grams(r.range[0]) + '–' + grams(r.range[1]) + ' г';
    if (r.exact) detail = 'Фактический вес';
    rows.push(['Выход', output, detail]);
    if (r.form) rows.push(['Форма', r.form]);
    rows = rows.concat(r.cooking || [], r.after || []);
    return rows.map(function(row){
      var value = Array.isArray(row[1])
        ? '<span class="fact-output">' + row[1].map(function(part){ return '<span class="fact-chunk">' + esc(part) + '</span>'; }).join('<span> · </span>') + '</span>' + (row[2] ? '<span class="fact-detail">' + esc(row[2]) + '</span>' : '')
        : esc(row[1]).replace(/\n/g, '<br>');
      return '<dt>' + esc(row[0]) + '</dt><dd>' + value + '</dd>';
    }).join('');
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
