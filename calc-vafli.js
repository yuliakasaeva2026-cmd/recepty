/* Вафли для Breville VST072X: конструктор. Подключается в книгу как модуль vafli. */
(function(){
/* ===================== ДАННЫЕ ===================== */
var EGG_G = 50, EGG_WET = 0.75, EGG_N = [157, 12.7, 11.5, 0.7];
var STARCH_SHARE = 0.2, CHOP = 2.4; /* мелко нарезанное яблоко весит в 2,4 раза больше тёртого отжатого */
var BUTTER_PER_WAFFLE = 5;          /* сливочное масло: 10 г на каждые 2 вафли */

/* wet — сколько жидкости даёт основа; need — насколько тесту с ней нужно яйцо (1 = как кефир) */
var BASES = {
  kefir:  { name:'Кефир 2%',            gen:'кефира',          wet:0.88, need:1.0,  n:[51, 3.4, 2, 4.7] },
  yogurt: { name:'Греческий йогурт 2%', gen:'йогурта',         wet:0.65, need:0.9,  n:[66, 8, 2, 4] },
  soft:   { name:'Мягкий творог 5%',    gen:'мягкого творога', wet:0.55, need:0.85, n:[100, 9, 5, 3.5] },
  milk:   { name:'Молоко',              gen:'молока',          wet:0.9,  need:1.05, n:[52, 2.8, 2.5, 4.7] },
  none:   { name:'Без жидкой основы',   gen:'',                wet:0,    need:1.0,  n:[0, 0, 0, 0] }
};
/* c — впитывающая сила (пшеничная = 1); need — потребность в яйце для связки (пшеничная = 1) */
var FLOURS = {
  wheat:  { name:'Пшеничная',              c:1,    need:1,    n:[334, 10.3, 1.1, 68.9] },
  oat:    { name:'Овсяная',                c:1,    need:1.15, n:[369, 13, 6.8, 64.9] },
  rice:   { name:'Рисовая',                c:1,    need:1.2,  n:[366, 6, 1.4, 80.2] },
  ricew:  { name:'Рисовая цельнозерновая', c:1.05, need:1.2,  n:[360, 7.5, 2.7, 76] },
  buck:   { name:'Гречневая (зелёная)',    c:1.05, need:1.1,  n:[335, 12.6, 3.3, 62] },
  chick:  { name:'Нутовая',                c:1.15, need:0.95, n:[387, 22.4, 6.7, 57.8] },
  corn:   { name:'Кукурузная',             c:1,    need:1.2,  n:[331, 7.2, 1.5, 72.1] },
  coco:   { name:'Кокосовая',              c:1.6,  need:1.25, n:[340, 20, 13, 21] },
  alm:    { name:'Миндальная',             c:0.67, need:1.3,  n:[610, 24, 52, 13] },
  starch: { name:'Кукурузный крахмал',     c:0.9,  need:1.1,  n:[381, 0.3, 0.1, 91] }
};
var ITEMS = {
  sugar:   { name:'Сахар',                     wet:0,    n:[399, 0, 0, 99.8] },
  cocoa:   { name:'Какао-порошок',             wet:0,    n:[289, 24.2, 15, 10.2] },
  dry5:    { name:'Творог сухой 5%',           wet:0.45, n:[121, 17.2, 5, 1.8] },
  brick5:  { name:'Творог в брикетах 5%',      wet:0.5,  n:[121, 17, 5, 1.8] },
  plast5:  { name:'Творог пластовой 5%',       wet:0.58, n:[121, 17, 5, 1.8] },
  plast9:  { name:'Творог пластовой 9%',       wet:0.55, n:[159, 16, 9, 3] },
  apple:   { name:'Яблоко',                    wet:0.6,  n:[47, 0.4, 0.4, 9.8] },
  potato:  { name:'Картофель тёртый, отжатый', wet:0.55, n:[77, 2, 0.4, 16.3] },
  chicken: { name:'Куриное филе',              wet:0.5,  n:[113, 23.6, 1.9, 0.4] },
  cheese:  { name:'Сыр твёрдый',               wet:0.2,  n:[360, 26, 28, 0] },
  butter:  { name:'Сливочное масло 82,5%',     wet:0,    n:[748, 0.6, 82.5, 0.8] }
};
var CURDS = ['dry5', 'brick5', 'plast5', 'plast9'];
var CURD_SHORT = { dry5:'Сухой 5%', brick5:'В брикетах 5%', plast5:'Пластовой 5%', plast9:'Пластовой 9%' };
var BP_N = [53, 0, 0, 28], SUGAR_N = ITEMS.sugar.n;
var BLENDS = {
  wheat:          { wheat:1 },
  oat:            { oat:1 },
  rice:           { rice:1 },
  chick:          { chick:1 },
  buck:           { buck:1 },
  oat_rice:       { oat:0.6, rice:0.4 },
  oat_ricew:      { oat:0.6, ricew:0.4 },
  oat_wheat:      { oat:0.5, wheat:0.5 },
  oat_corn:       { oat:0.6, corn:0.4 },
  oat_alm:        { oat:0.7, alm:0.3 },
  oat_coco:       { oat:0.75, coco:0.25 },
  oat_chick:      { oat:0.5, chick:0.5 },
  chick_rice:     { chick:0.5, rice:0.5 },
  buck_rice:      { buck:0.5, rice:0.5 },
  alm_rice:       { alm:0.3, rice:0.7 },
  rice_corn:      { rice:0.5, corn:0.5 },
  rice_coco:      { rice:0.75, coco:0.25 },
  wheat_rice:     { wheat:0.43, rice:0.57 },
  wheat_alm_rice: { wheat:0.25, alm:0.25, rice:0.5 }
};
function blendName(id){ var k = Object.keys(BLENDS[id]); return k.length === 1 ? 'Только ' + FLOURS[k[0]].name.toLowerCase() : k.map(function(f, i){ return i ? FLOURS[f].name.toLowerCase() : FLOURS[f].name; }).join(' + '); }

var THICK = { def:125, min:120, max:150, word:'густое тесто: 120–130 г, максимум 150' };
var LIQUID = { def:95, min:90, max:100, word:'жидкое тесто: 90–100 г' };
var MILK = { def:80, min:75, max:85, word:'тесто на молоке жидкое: 80 г, чтобы не вытекало' };
var FATTY = { def:90, min:85, max:95, word:'жирное жидкое тесто: 85–95 г' };

/* Специи: per2 — граммы на 2 вафли. serving — варианты под подачу */
var SP = {
  pepper:  { name:'Перец чёрный молотый', short:'перец' }, garlic:{ name:'Чеснок сушёный', short:'чеснок сушёный' }, herbs:{ name:'Прованские травы', short:'прованские травы' },
  nutmeg:  { name:'Мускатный орех', short:'мускатный орех' }, paprika:{ name:'Паприка сладкая', short:'паприка' }, turmeric:{ name:'Куркума', short:'куркума' },
  cinnamon:{ name:'Корица', short:'корица' }, vanilla:{ name:'Ванильный сахар', n:SUGAR_N, solo:true }, salt:{ name:'Соль', solo:true }
};

/* ===================== РЕЦЕПТЫ =====================
   ref — эталон для новых сочетаний; tested — ваши проверенные рецепты, граммы как у вас. */
var R = {};

R.sladkaya = { lead:'Базовая сладкая вафля с ванилью. Этот рецепт вы ещё не готовили: все сочетания новые.', kinds:[{
  id:'classic', name:'Сладкая', dough:'liquid', portion:LIQUID, time:[5, 6], loss:0.25, defN:2, butter:true, eggPer100:0.4, slots:[],
  ref:{ base:'kefir', baseG:70, blend:'oat_rice', flourEq:35, eggs:1, bpRate:0.04, items:[{ k:'sugar', g:15 }] },
  spices:[{ k:'vanilla', per2:4, note:'или 2–3 капли ванильного экстракта' }, { k:'salt', per2:0.2, note:'подчёркивает сладость' }],
  serving:[{ t:'К ягодам и йогурту', x:'цедра лимона', per2:1 }, { t:'К мёду или варенью', x:'корица', per2:0.5 }],
  bases:[
    { id:'kefir',  note:'Лёгкая и воздушная' },
    { id:'milk',   note:'Классическая, с хрустящей корочкой. Тесто жидкое: по 80 г на вафлю' },
    { id:'yogurt', note:'Плотнее и нежнее, с лёгкой кислинкой' },
    { id:'soft',   note:'Плотная, с привкусом сырника' }
  ],
  blends:[
    { id:'oat_rice',  note:'Нежная внутри и хрустящая снаружи. Лучший баланс вкуса и пользы' },
    { id:'wheat',     note:'Классическая: пышная и хрустящая' },
    { id:'oat_wheat', note:'Почти как классика, но полезнее' },
    { id:'alm_rice',  note:'Хрустящая, с ореховым вкусом. Калорийнее' },
    { id:'rice_corn', note:'Золотистая, хрустящая, чуть сладковатая' },
    { id:'oat_ricew', note:'Больше клетчатки, чуть зернистее' },
    { id:'oat_coco',  note:'С кокосовым ароматом' },
    { id:'oat',       note:'Мягче, корочка менее хрустящая' }
  ],
  starch:'Корочка станет заметно хрустящей.',
  prep:[], mix:'Взбейте яйцо с сахаром, ванильным сахаром и солью, добавьте основу и перемешайте. Всыпьте муку с разрыхлителем{starch} и размешайте до однородности, без комочков.',
  tested:[]
}]};

R.nesladkaya = { lead:'Нейтральная вафля к супу, к творожному сыру, рыбе, авокадо или вместо хлеба.', kinds:[{
  id:'classic', name:'Несладкая', dough:'liquid', portion:LIQUID, time:[6, 6], loss:0.25, defN:2, butter:true, eggPer100:0.4, slots:[],
  ref:{ base:'kefir', baseG:60, blend:'wheat', flourEq:30, eggs:1, bpRate:0.04, saltPct:0.003, items:[] },
  spices:[{ k:'pepper', per2:0.2 }, { k:'garlic', per2:0.5 }, { k:'herbs', per2:0.5 }],
  serving:[
    { t:'К творожному сыру и слабосолёному лососю', x:'свежий укроп, мелко нарезанный', per2:5, alt:'или 0,5 г сушёного; прованские травы тогда не нужны' },
    { t:'К авокадо', x:'копчёная паприка', per2:0.5, alt:'и щепотка хлопьев чили' },
    { t:'К супу и салату', x:'итальянские травы вместо прованских', per2:0.5 }
  ],
  bases:[
    { id:'kefir',  note:'Лёгкое, воздушное тесто' },
    { id:'milk',   note:'Классика, хрустящая корочка. Тесто жидкое: по 80 г на вафлю' },
    { id:'yogurt', note:'Плотнее, с кислинкой: хорошо к сыру и зелени' },
    { id:'soft',   note:'Плотная и сытная, вкус мягче' }
  ],
  blends:[
    { id:'wheat',      note:'Классика: хрустящая, лучше всего держит форму' },
    { id:'oat_wheat',  note:'Почти как классика, но полезнее' },
    { id:'oat_corn',   note:'Хрустящая и золотистая, без пшеницы' },
    { id:'chick_rice', note:'Сытная и белковая, хрустящая. К сыру и зелени' },
    { id:'buck_rice',  note:'С ореховой ноткой, без глютена' },
    { id:'oat',        note:'Мягче, корочка менее хрустящая' }
  ],
  starch:'Корочка станет заметно хрустящей, как у бельгийской вафли.',
  prep:[], mix:'Взбейте яйцо с солью и специями, добавьте основу. Всыпьте муку с разрыхлителем{starch} и размешайте до однородности.',
  tested:[
    { base:'milk', baseG:70, flour:{ wheat:45 }, eggs:1, bp:3, salt:0.5, waffles:2,
      note:'Первый рецепт: вкусно, но 45 г муки — это много, и разрыхлителя, кажется, тоже.',
      tweak:{ label:'Меньше муки и разрыхлителя', desc:'мука 35 г вместо 45, разрыхлитель 1,5 г вместо 3 (на 2 вафли)', flour:{ wheat:35 }, bp:1.5 } },
    { base:'kefir', baseG:60, flour:{ wheat:30 }, eggs:1, bp:1.5, waffles:2 }
  ]
}]};

R.shokoladnaya = { lead:'Шоколадная вафля с какао.', kinds:[{
  id:'classic', name:'Шоколадная', dough:'liquid', portion:LIQUID, time:[4, 5], loss:0.25, defN:2, butter:true, eggPer100:0.4, slots:[],
  ref:{ base:'soft', baseG:80, blend:'oat', flourEq:20, eggs:1, bpRate:0.05, items:[{ k:'cocoa', g:10 }, { k:'sugar', g:15, range:'10–20 г по вкусу' }] },
  spices:[{ k:'salt', per2:0.2, note:'усиливает вкус шоколада' }, { k:'vanilla', per2:4, note:'или 2–3 капли ванильного экстракта' }],
  serving:[{ t:'Мокко', x:'растворимый кофе', per2:1 }, { t:'Пряная', x:'корица', per2:0.5 }],
  bases:[
    { id:'soft',   note:'Нежная, шоколадно-творожная' },
    { id:'milk',   note:'Классическая. Тесто жидкое: по 80 г на вафлю, иначе вытекает' },
    { id:'kefir',  note:'Воздушная, с лёгкой кислинкой' },
    { id:'yogurt', note:'Плотная, как брауни' }
  ],
  blends:[
    { id:'oat',       note:'ПП: какао полностью прячет овсяный вкус' },
    { id:'alm_rice',  note:'Самая «десертная», с ореховой ноткой' },
    { id:'wheat',     note:'Классическая, пышнее' },
    { id:'oat_alm',   note:'Овсяная с ореховым вкусом' },
    { id:'buck_rice', note:'Гречка отлично сочетается с какао' },
    { id:'rice_coco', note:'С кокосовой ноткой, как «Баунти»' }
  ],
  starch:'Вафля станет хрустящей снаружи.',
  prep:[], mix:'Взбейте яйцо с сахаром, ванильным сахаром и солью, добавьте основу. Смешайте муку, какао и разрыхлитель{starch}, всыпьте и размешайте до однородности.',
  tested:[
    { base:'soft', baseG:80, flour:{ oat:20 }, eggs:1, bp:1, items:[{ k:'cocoa', g:10 }, { k:'sugar', g:15, range:'10–20 г по вкусу' }], waffles:2 },
    { base:'soft', baseG:80, flour:{ alm:10, rice:15 }, eggs:1, bp:1, items:[{ k:'cocoa', g:10 }, { k:'sugar', g:15, range:'10–20 г по вкусу' }], waffles:2 },
    { base:'milk', baseG:70, flour:{ wheat:40 }, eggs:1, bp:3, items:[{ k:'cocoa', g:10 }, { k:'sugar', g:15, range:'10–20 г по вкусу' }], waffles:2,
      note:'Вытекало из вафельницы. Муку, кажется, можно уменьшить, разрыхлителя точно меньше.',
      comment:'У вас было по 94 г на вафлю и 3 г разрыхлителя: тесто поднялось и вытекло. Здесь по 80 г на вафлю.',
      tweak:{ label:'Меньше муки и разрыхлителя', desc:'мука 32 г вместо 40, разрыхлитель 1,5 г вместо 3 (на 2 вафли)', flour:{ wheat:32 }, bp:1.5 } }
  ]
}]};

var APPLE_BASES = [
  { id:'yogurt', note:'Лучше всего держит сочное яблоко' },
  { id:'soft',   note:'Нежнее, вкус ближе к сырнику' },
  { id:'kefir',  note:'Можно, но тесто жиже, поэтому кефира меньше по весу' }
];
function syrnikBases(curd){
  if (curd === 'plast9') return [
    { id:'none',   note:'Жирный творог и так даёт нежное жидкое тесто' }
  ];
  var list = [
    { id:'soft',   note:'Классический нежный сырник' },
    { id:'yogurt', note:'С лёгкой кислинкой, чуть мягче' }
  ];
  if (curd !== 'dry5') list.push({ id:'none', note:'Классический сырник: только творог, яйцо и мука' });
  return list;
}
var CURD_NOTE = { dry5:'Нужна основа: мягкий творог или йогурт', brick5:'Самый «сырниковый», основы можно меньше', plast5:'Влажный: основы совсем немного, муки чуть больше', plast9:'Жирный и нежный: без основы, тесто жидкое, по 90 г на вафлю' };

R.yablochnaya = { lead:'Все вафли с яблоком: обычная, супер-яблочная и яблочный сырник.', kinds:[
  { id:'vaflya', name:'Яблочная', dough:'thick', portion:THICK, time:[6, 7], loss:0.25, defN:2, butter:true, eggPer100:0.4, slots:['apple'], apple:{ sweetness:true },
    ref:{ base:'yogurt', baseG:60, blend:'oat_rice', flourEq:35, eggs:1, bpRate:0.043, items:[{ k:'apple', g:50, pcs:1, slot:'apple' }, { k:'sugar', g:15, sweet:10, sour:20 }] },
    spices:[{ k:'cinnamon', per2:1.5, note:'примерно ½ ч. л.' }],
    serving:[{ t:'Пряная, как шарлотка', x:'мускатный орех', per2:0.1, alt:'на кончике ножа' }, { t:'Свежая', x:'цедра лимона', per2:1 }],
    bases:APPLE_BASES,
    blends:[
      { id:'oat_rice',   note:'ПП-классика: с яблоком и корицей отлично' },
      { id:'wheat',      note:'Классическая, пышная' },
      { id:'oat',        note:'Яблоко, овсянка и корица — очень по-домашнему' },
      { id:'oat_ricew',  note:'Больше клетчатки, чуть зернистее' },
      { id:'alm_rice',   note:'Миндаль под корицей почти не чувствуется' },
      { id:'wheat_rice', note:'Нежнее пшеничной, держит форму' }
    ],
    starch:'Поможет тесту удержать яблочный сок, корочка станет хрустящей.',
    prep:['Яблоко натрите и отожмите сок или мелко нарежьте.'],
    mix:'Взбейте яйцо с сахаром, добавьте основу и яблоко. Всыпьте муку с разрыхлителем{starch} и корицей и перемешайте ложкой.',
    tested:[
      { base:'yogurt', baseG:60, flour:{ wheat:35 }, eggs:1, bp:1.5, items:[{ k:'apple', g:50, pcs:1, slot:'apple' }, { k:'sugar', g:15, sweet:10, sour:20 }], waffles:2,
        note:'По объёму на 2 вафли был запас.', comment:'У вас выходило около 105 г на вафлю, здесь по 125 г: форма заполнится лучше.' }
    ] },
  { id:'super', name:'Супер-яблочная', dough:'thick', portion:{ def:130, min:120, max:150, word:'густое тесто: 120–130 г, максимум 150' }, time:[6, 7], loss:0.3, defN:2, butter:true, eggPer100:0.36, slots:['apple'], apple:{ sweetness:true },
    ref:{ base:'yogurt', baseG:60, blend:'alm_rice', flourEq:35, eggs:1, bpRate:0.043, items:[{ k:'apple', g:100, pcs:2, slot:'apple' }, { k:'sugar', g:15, sweet:10, sour:20 }] },
    spices:[{ k:'cinnamon', per2:1.5, note:'примерно ½ ч. л.' }],
    serving:[{ t:'Пряная, как шарлотка', x:'мускатный орех', per2:0.1, alt:'на кончике ножа' }, { t:'Свежая', x:'цедра лимона', per2:1 }],
    bases:APPLE_BASES,
    blends:[
      { id:'alm_rice',       note:'Миндаль под корицей почти не чувствуется, зато хрустящая' },
      { id:'wheat_alm_rice', note:'Держит много яблока лучше всех' },
      { id:'oat_rice',       note:'ПП-вариант, нежная' },
      { id:'wheat',          note:'Классическая' },
      { id:'oat',            note:'Мягче, по-домашнему' }
    ],
    starch:'Поможет тесту удержать много яблочного сока.',
    prep:['Яблоки натрите и отожмите сок или мелко нарежьте.'],
    mix:'Взбейте яйцо с сахаром, добавьте основу и яблоки. Всыпьте муку с разрыхлителем{starch} и корицей и перемешайте ложкой.',
    tested:[
      { base:'yogurt', baseG:60, flour:{ alm:15, rice:25 }, eggs:1, bp:1.5, items:[{ k:'apple', g:100, pcs:2, slot:'apple' }, { k:'sugar', g:15, sweet:10, sour:20 }], waffles:2,
        note:'Объём на 2 вафли на пределе. Миндальную из-за корицы почти не чувствуется.' },
      { base:'yogurt', baseG:150, flour:{ wheat:20, alm:30, rice:40 }, eggs:2, bp:2.5, items:[{ k:'apple', g:240, pcs:4, slot:'apple' }, { k:'sugar', g:25, sweet:20, sour:30 }], waffles:6,
        note:'По 100 г на вафлю (после выпекания 70 г) вышло 6 не квадратных вафель, запас был.', comment:'Здесь по 130 г на вафлю: вафли получатся квадратными.' }
    ] },
  { id:'syrnik', name:'Яблочный сырник', dough:'thick', portion:THICK, time:[7, 7], loss:0.2, defN:2, butter:false, eggPer100:0.316, slots:['curd', 'apple'], apple:{},
    curd:{ def:'dry5', baseRatio:{ dry5:0.5, brick5:0.35, plast5:0.15, plast9:0.1 }, recBase:{ dry5:'soft', brick5:'soft', plast5:'soft', plast9:'none' } },
    ref:{ base:'soft', baseG:100, blend:'wheat_rice', flourEq:70, eggs:2, bpRate:0.043, items:[{ k:'dry5', g:200, slot:'curd' }, { k:'apple', g:130, pcs:2, slot:'apple' }, { k:'sugar', g:30 }] },
    spices:[{ k:'cinnamon', per2:1, note:'примерно ⅓ ч. л.' }, { k:'vanilla', per2:4, note:'или 2–3 капли ванильного экстракта' }],
    serving:[{ t:'Свежая', x:'цедра лимона', per2:1 }],
    bases:null,
    blends:[
      { id:'wheat_rice', note:'Нежный и хорошо держит форму' },
      { id:'wheat',      note:'Классический сырник' },
      { id:'rice',       note:'Самый нежный, классика ПП-сырников' },
      { id:'oat_rice',   note:'ПП, с лёгким овсяным вкусом' },
      { id:'oat',        note:'Плотнее, по-домашнему' }
    ],
    starch:'Сырник станет нежнее и лучше будет держать форму.',
    prep:['Яблоко натрите и отожмите сок или мелко нарежьте.'],
    mix:'Разомните творог с основой, сахаром, ванильным сахаром и яйцом, добавьте яблоко. Всыпьте муку с разрыхлителем{starch} и корицей и перемешайте ложкой.',
    tested:[
      { curd:'dry5', base:'soft', baseG:100, flour:{ wheat:30, rice:40 }, eggs:2, bp:3, items:[{ k:'dry5', g:200, slot:'curd' }, { k:'apple', g:130, pcs:2, slot:'apple' }, { k:'sugar', g:30 }], waffles:6,
        note:'Вкусно. По 100 г на вафлю вышли не квадратные — лучше 120–130 г.', comment:'Здесь по 125 г на вафлю.' },
      { curd:'dry5', base:'soft', baseG:50, flour:{ wheat:30 }, eggs:1, bp:1.5, items:[{ k:'dry5', g:50, slot:'curd' }, { k:'apple', g:50, pcs:1, slot:'apple' }, { k:'sugar', g:10 }], waffles:2,
        note:'Вкусно, можно попробовать чуть меньше муки.',
        tweak:{ label:'Чуть меньше муки', desc:'мука 25 г вместо 30 (на 2 вафли)', flour:{ wheat:25 } } }
    ] }
]};

R.syrnik = { lead:'Вафля-сырник. Выберите творог: под него подстроятся основа, мука и порция.', kinds:[
  { id:'syrnik', name:'Вафли-сырники', dough:'thick', portion:THICK, time:[7, 7], loss:0.2, defN:2, butter:false, eggPer100:0.29, slots:['curd'],
    curd:{ def:'dry5', baseRatio:{ dry5:0.67, brick5:0.45, plast5:0.2, plast9:0.1 }, recBase:{ dry5:'soft', brick5:'soft', plast5:'soft', plast9:'none' },
      portion:{ plast9:FATTY }, time:{ plast9:[5.5, 5.5] }, eggPer100:{ plast9:0.18 } },
    ref:{ base:'soft', baseG:100, blend:'wheat', flourEq:25, eggs:1, bpRate:0.04, items:[{ k:'dry5', g:150, slot:'curd' }, { k:'sugar', g:20 }] },
    refByCurd:{ plast9:{ base:'none', baseG:0, blend:'wheat', flourEq:60, eggs:1, bpRate:0.04, items:[{ k:'plast9', g:400, slot:'curd' }, { k:'sugar', g:30 }] } },
    spices:[{ k:'vanilla', per2:4, note:'или 2–3 капли ванильного экстракта' }, { k:'salt', per2:0.2 }],
    serving:[{ t:'Лимонные', x:'цедра лимона', per2:1 }, { t:'С изюмом', x:'изюм, распаренный и обсушенный', per2:15 }],
    bases:null,
    blends:[
      { id:'wheat',      note:'Классический сырник, держит форму' },
      { id:'rice',       note:'Нежнее, классика ПП-сырников' },
      { id:'wheat_rice', note:'Нежный и хорошо держит форму' },
      { id:'oat_rice',   note:'ПП, с лёгким овсяным вкусом' },
      { id:'oat',        note:'Плотнее, по-домашнему' }
    ],
    starch:'Сырник станет нежнее и лучше будет держать форму.',
    prep:[], mix:'Разомните творог с основой, сахаром, ванильным сахаром, солью и яйцом. Всыпьте муку с разрыхлителем{starch} и перемешайте.',
    tested:[
      { curd:'dry5', base:'soft', baseG:100, flour:{ wheat:25 }, eggs:1, bp:1, items:[{ k:'dry5', g:150, slot:'curd' }, { k:'sugar', g:20 }], waffles:2,
        note:'Сильно вытекало из вафельницы, в остальном всё хорошо.', comment:'У вас было по 173 г на вафлю, это больше максимума 150 г. Здесь по 125 г.' },
      { curd:'plast9', base:'none', baseG:0, flour:{ wheat:60 }, eggs:1, bp:4, items:[{ k:'plast9', g:400, slot:'curd' }, { k:'sugar', g:30 }], waffles:4,
        note:'По 85 г теста на вафлю, получилось 4 штуки.',
        comment:'Всего теста здесь около 545 г: по 85 г это 6 вафель. Если у вас вышло 4, порции, скорее всего, были крупнее — проверьте в следующий раз.' }
    ] }
]};

R.kartofelnaya = { lead:'Картофельная вафля: на йогурте или драник без основы.', kinds:[{
  id:'classic', name:'Картофельная', dough:'thick', portion:THICK, time:[9, 9], loss:0.3, defN:2, butter:true, eggPer100:0.35, slots:['potato'],
  ref:{ base:'yogurt', baseG:25, blend:'wheat', flourEq:20, eggs:1, bpRate:0, saltPct:0.005, items:[{ k:'potato', g:80, slot:'potato' }] },
  spices:[{ k:'pepper', per2:0.2 }, { k:'garlic', per2:0.5 }, { k:'nutmeg', per2:0.1, note:'на кончике ножа' }],
  serving:[
    { t:'Со сметаной или йогуртом', x:'свежий укроп', per2:5 },
    { t:'К слабосолёному лососю', x:'свежий укроп и цедра лимона', per2:5 },
    { t:'Деревенские', x:'зелёный лук', per2:5 }
  ],
  bases:[
    { id:'yogurt', note:'Нежнее внутри' },
    { id:'none',   note:'Драник: картофельный вкус ярче' },
    { id:'soft',   note:'Сливочный вкус, плотнее' },
    { id:'kefir',  note:'Можно, тесто чуть жиже' }
  ],
  blends:[
    { id:'wheat',     note:'Лучше всего держит картофель' },
    { id:'chick',     note:'Хрустящая и сытная: нут отлично дружит с картофелем' },
    { id:'rice_corn', note:'Хрустящая корочка, без глютена' },
    { id:'oat_chick', note:'Сытная, больше белка' },
    { id:'buck',      note:'С ореховой ноткой' },
    { id:'oat',       note:'Мягче, корочка слабее' }
  ],
  starch:'Корочка станет хрустящей, как у драника, и тесто лучше схватится.',
  cheese:{ per2:15, note:'Рекомендую 15 г на 2 вафли твёрдого выдержанного сыра (пармезан, грана падано): вкус заметен даже в таком количестве, а калорий немного. Мука подстроится под количество сыра.' },
  prep:['Картофель натрите на мелкой тёрке и хорошо отожмите.'],
  mix:'Смешайте картофель с яйцом, основой{cheese}, солью и специями. Всыпьте муку{starch} и перемешайте.',
  tested:[
    { base:'yogurt', baseG:25, flour:{ wheat:20 }, eggs:1, bp:0, items:[{ k:'potato', g:80, slot:'potato' }], waffles:2,
      note:'Вышло 2 штуки, объём можно увеличить.', comment:'У вас было около 88 г на вафлю, здесь по 125 г.' },
    { base:'none', baseG:0, flour:{ wheat:20 }, eggs:1, bp:0, items:[{ k:'potato', g:80, slot:'potato' }, { k:'cheese', g:40 }], waffles:2,
      note:'Сыр не чувствуется, лучше убрать. Объём можно увеличить.' }
  ]
}]};

R.kurinaya = { lead:'Куриная вафля из фарша или из мелких кусочков филе.', kinds:[
  { id:'farsh', name:'Фарш (в блендере)', dough:'thick', portion:THICK, time:[6, 6], loss:0.25, defN:2, butter:false, eggPer100:0.155, slots:['chicken'],
    ref:{ base:'soft', baseG:450, blend:'oat', flourEq:140, eggs:2, bpRate:0, saltPct:0.0039, items:[{ k:'chicken', g:600, slot:'chicken' }] },
    spices:[{ k:'pepper', per2:0.3 }, { k:'paprika', per2:0.5 }, { k:'garlic', per2:0.5 }, { k:'turmeric', per2:0.2, note:'для золотистого цвета' }],
    serving:[{ t:'С йогуртовым соусом', x:'свежая зелень: укроп или петрушка', per2:5 }, { t:'Пикантная', x:'хлопья чили', per2:0.1 }],
    bases:[
      { id:'soft',   note:'Сочная, нежная, не прилипает' },
      { id:'yogurt', note:'С лёгкой кислинкой, тесто мягче' },
      { id:'kefir',  note:'Можно, но жиже, поэтому кефира меньше по весу' }
    ],
    blends:[
      { id:'oat',       note:'Сочная, нейтральный вкус' },
      { id:'oat_chick', note:'Больше белка, лучше держит форму' },
      { id:'chick',     note:'Сытная, с хрустящей корочкой' },
      { id:'wheat',     note:'Лучше всего держит форму' },
      { id:'buck',      note:'С ореховой ноткой, хорошо к курице' },
      { id:'rice_corn', note:'Хрустящая корочка, без глютена' }
    ],
    starch:'Корочка схватится быстрее и станет хрустящей.',
    prep:['Пробейте филе в блендере до фарша.'],
    mix:'Смешайте фарш с основой, яйцами, солью и специями. Добавьте муку{starch} и перемешайте.',
    tested:[
      { base:'soft', baseG:450, flour:{ oat:140 }, eggs:2, bp:0, salt:5, items:[{ k:'chicken', g:600, slot:'chicken' }] }
    ] },
  { id:'kusochki', name:'Кусочками', dough:'thick', coat:true, portion:{ def:130, min:120, max:150, word:'густое тесто: 120–130 г, максимум 150' }, time:[6, 7], loss:0.25, defN:2, butter:false, eggPer100:0.2, slots:['chicken'],
    ref:{ base:'soft', baseG:250, blend:'oat', flourEq:80, eggs:2, bpRate:0, saltPct:0.004, items:[{ k:'chicken', g:600, slot:'chicken' }] },
    spices:[{ k:'pepper', per2:0.3 }, { k:'paprika', per2:0.5 }, { k:'garlic', per2:0.5 }, { k:'turmeric', per2:0.2, note:'для золотистого цвета' }],
    serving:[{ t:'С йогуртовым соусом', x:'свежая зелень: укроп или петрушка', per2:5 }, { t:'Пикантная', x:'хлопья чили', per2:0.1 }],
    bases:[
      { id:'soft',   note:'Сливочная и сочная, лучше всего обволакивает кусочки' },
      { id:'yogurt', note:'Легче, с лёгкой кислинкой' }
    ],
    blends:[
      { id:'oat',       note:'Сочная, нейтральный вкус' },
      { id:'wheat',     note:'Лучше всего держит кусочки' },
      { id:'oat_chick', note:'Больше белка, держит кусочки лучше овсяной' },
      { id:'chick',     note:'Сытная, с хрустящей корочкой' },
      { id:'buck',      note:'С ореховой ноткой' }
    ],
    starch:'Корочка схватится быстрее.',
    prep:['Нарежьте филе кусочками не больше 1 см.'],
    mix:'Смешайте основу с яйцами, солью и специями, добавьте муку{starch}. Вмешайте кусочки так, чтобы каждый был покрыт тестом.',
    tips:['Смажьте панели маслом: 1–2 г кисточкой.', 'Выкладывайте тесто в центр формы.', 'Не открывайте вафельницу раньше 6 минут.'],
    orig:{ text:'Когда мало жидкой основы, на панелях остаются зажаринки, которые горят. Поэтому основы здесь больше, чем в вашем прошлом варианте.' },
    tested:[] }
]};

/* ===================== РАСЧЁТ ===================== */
function clone(o){ return JSON.parse(JSON.stringify(o)); }
function eqOf(fl){ return Object.keys(fl).reduce(function(a, f){ return a + fl[f] * FLOURS[f].c; }, 0); }
function sumOf(fl){ return Object.keys(fl).reduce(function(a, f){ return a + fl[f]; }, 0); }
function needOf(fl){ var e = eqOf(fl); if (!e) return 1; return Object.keys(fl).reduce(function(a, f){ return a + fl[f] * FLOURS[f].c * FLOURS[f].need; }, 0) / e; }
function needBlend(id){ var p = BLENDS[id]; return Object.keys(p).reduce(function(a, f){ return a + p[f] * FLOURS[f].need; }, 0); }
function blendMatches(fl, blend){
  var p = BLENDS[blend], ka = Object.keys(fl).sort(), kb = Object.keys(p).sort();
  if (ka.join() !== kb.join()) return false;
  var e = eqOf(fl);
  return kb.every(function(f){ return Math.abs(fl[f] * FLOURS[f].c / e - p[f]) < 0.12; });
}
function curdOf(K, st){ return K.curd ? st.curd : null; }
function presetFor(K, st){
  return (K.tested || []).filter(function(t){ return t.base === st.base && blendMatches(t.flour, st.blend) && (!K.curd || t.curd === st.curd); })[0] || null;
}
function basesFor(K, st){ return K.bases || syrnikBases(st.curd); }
function portionFor(K, st){
  if (K.curd && K.curd.portion && K.curd.portion[st.curd]) return K.curd.portion[st.curd];
  if (K.dough === 'liquid' && st.base === 'milk') return MILK;
  return K.portion;
}
function timeFor(K, st){ return K.curd && K.curd.time && K.curd.time[st.curd] || K.time; }
function eggPer100(K, st){ return K.curd && K.curd.eggPer100 && K.curd.eggPer100[st.curd] || K.eggPer100; }
function itemMass(it, st){ return it.k === 'apple' && st.appleForm === 'chop' ? it.g * CHOP : it.g; }
function moistureOf(items, st, base, baseG, eggs){
  return items.reduce(function(a, it){ return a + itemMass(it, st) * ITEMS[it.k].wet; }, 0) + baseG * BASES[base].wet + eggs * EGG_G * EGG_WET;
}

function formula(K, st){
  var p = presetFor(K, st), f = { base:st.base, baseG:0, flour:{}, starch:0, bp:0, salt:null, saltPct:null, items:[], preset:p, src:'model', eggsP:1 };
  if (p){
    f.src = 'tested'; f.baseG = p.baseG || 0; f.flour = clone(p.flour); f.bp = p.bp || 0; f.eggsP = p.eggs;
    f.items = clone(p.items || []); f.salt = p.salt != null ? p.salt : null;
    if (f.salt == null && K.ref.saltPct) f.saltPct = K.ref.saltPct;
    if (st.tweak && p.tweak){
      if (p.tweak.flour) f.flour = clone(p.tweak.flour);
      if (p.tweak.bp != null) f.bp = p.tweak.bp;
      if (p.tweak.drop) f.items = f.items.filter(function(it){ return p.tweak.drop.indexOf(it.k) < 0; });
      f.src = 'tweak';
    }
    f.r = eqOf(f.flour) / moistureOf(f.items, st, f.base, f.baseG, f.eggsP);
  } else {
    var ref = (K.refByCurd && K.refByCurd[st.curd]) || K.ref;
    var Wref = moistureOf(ref.items, st, ref.base, ref.baseG, ref.eggs);
    f.r = ref.flourEq / Wref;
    f.items = clone(ref.items); f.eggsP = ref.eggs; f.saltPct = ref.saltPct || null;
    if (K.curd) f.items.forEach(function(it){ if (it.slot === 'curd') it.k = st.curd; });
    if (st.base !== 'none'){
      if (K.curd){
        var cg = f.items.filter(function(it){ return it.slot === 'curd'; })[0].g;
        f.baseG = cg * K.curd.baseRatio[st.curd] * BASES.soft.wet / BASES[st.base].wet;
      } else if (ref.base === 'none'){
        f.baseG = 0.1 * f.items.reduce(function(a, it){ return a + it.g; }, 0);
      } else if (K.coat){
        f.baseG = ref.baseG; /* кусочкам нужна обволакивающая основа: столько же по весу */
      } else {
        f.baseG = ref.baseG * BASES[ref.base].wet / BASES[st.base].wet;
      }
    }
    var eq = f.r * moistureOf(f.items, st, st.base, f.baseG, f.eggsP), bl = BLENDS[st.blend];
    Object.keys(bl).forEach(function(fl){ f.flour[fl] = eq * bl[fl] / FLOURS[fl].c; });
    f.bpRate = ref.bpRate;
  }
  f.items.forEach(function(it){ if (it.sour != null) it.g = st.appleSweet === 'sweet' ? it.sweet : it.sour; });
  if (st.starch){
    var e = eqOf(f.flour);
    Object.keys(f.flour).forEach(function(fl){ f.flour[fl] *= (1 - STARCH_SHARE); });
    f.starch = e * STARCH_SHARE / FLOURS.starch.c;
    if (f.src !== 'model') f.src = 'mod';
  }
  if (f.src === 'model') f.bp = f.bpRate * (eqOf(f.flour) + f.starch * FLOURS.starch.c);
  if (K.cheese) f.items = f.items.filter(function(it){ return it.k !== 'cheese'; });
  return f;
}
function flourNeed(fl, starch){
  var e = eqOf(fl), se = starch * FLOURS.starch.c;
  if (e + se <= 0) return 1;
  return (needOf(fl) * e + FLOURS.starch.need * se) / (e + se);
}
function scaleFlour(fl, k){ var o = {}; Object.keys(fl).forEach(function(f){ o[f] = fl[f] * k; }); return o; }

/* Проверка «проверено»: все продукты (кроме яиц, соли и масла) в тех же пропорциях, что у вас, с допуском 10% */
function sharesMatch(a, b){
  var keys = {}; Object.keys(a).forEach(function(k){ keys[k] = 1; }); Object.keys(b).forEach(function(k){ keys[k] = 1; });
  var sa = 0, sb = 0; Object.keys(keys).forEach(function(k){ sa += a[k] || 0; sb += b[k] || 0; });
  if (!sa || !sb) return false;
  return Object.keys(keys).every(function(k){
    var x = (a[k] || 0) / sa, y = (b[k] || 0) / sb, tol = k === 'bp' ? 0.25 : 0.1;
    return y < 0.02 ? Math.abs(x - y) <= 0.006 : Math.abs(x - y) / y <= tol;
  });
}
function shareMap(items, st, base, baseG, flour, bp){
  var m = {};
  items.forEach(function(it){ m['i:' + it.k] = (m['i:' + it.k] || 0) + it.g; });
  if (baseG > 0) m['base'] = baseG;
  Object.keys(flour).forEach(function(f){ m['f:' + f] = flour[f]; });
  if (bp > 0) m['bp'] = bp;
  return m;
}

function compute(K, st){
  var f = formula(K, st), por = portionFor(K, st), P0 = por.def, bw = K.butter ? BUTTER_PER_WAFFLE : 0;
  var L = st.locks || {}, adds = L.adds || {};
  /* масса без яиц и масла в масштабе рецепта */
  function itemsMass(items){ return items.reduce(function(a, it){ return a + itemMass(it, st); }, 0); }
  var M0F = itemsMass(f.items) + f.baseG + sumOf(f.flour) + f.starch + f.bp + (f.salt || 0);
  if (f.saltPct) M0F *= (1 + f.saltPct);
  var DF = M0F + f.eggsP * EGG_G;
  /* что задаёт масштаб: ваш продукт, основа, мука или число вафель */
  var s = null, anchor = null;
  (K.slots || []).some(function(slot){
    if (adds[slot] == null) return false;
    var it = f.items.filter(function(x){ return x.slot === slot; })[0];
    if (!it || !itemMass(it, st)) return false;
    s = adds[slot] / itemMass(it, st); anchor = 'add:' + slot; return true;
  });
  var flourLocks = L.flour || {}, flourLocked = L.flourTotal != null || Object.keys(flourLocks).some(function(k){ return flourLocks[k] != null && f.flour[k] != null; });
  if (s == null && L.base != null && f.baseG > 0){ s = L.base / f.baseG; anchor = 'base'; }
  if (s == null && flourLocked){
    if (L.flourTotal != null && sumOf(f.flour) > 0) s = L.flourTotal / sumOf(f.flour);
    else { var c0 = Object.keys(f.flour).filter(function(k){ return flourLocks[k] != null; })[0]; s = flourLocks[c0] / f.flour[c0]; }
    anchor = 'flour';
  }
  var N = st.N, P = st.portion || P0;
  if (s == null) s = N * (P - bw) / DF;
  /* продукты в масштабе */
  var A = {
    items: f.items.map(function(it){ return { k:it.k, g:itemMass(it, st) * s, pcs:it.pcs ? it.pcs * s : null, slot:it.slot, range:it.range }; }),
    baseG: f.baseG * s, flour: scaleFlour(f.flour, s), starch: f.starch * s, bp: f.bp * s, salt: f.salt != null ? f.salt * s : null
  };
  /* ваши количества */
  A.items.forEach(function(it){ if (it.slot && adds[it.slot] != null) it.g = adds[it.slot]; });
  if (L.base != null && A.baseG > 0) A.baseG = L.base;
  if (K.cheese && st.cheese){
    var nEst = anchor ? Math.max(2, Math.round((itemsMass(f.items) + f.baseG + sumOf(f.flour) + f.eggsP * EGG_G) * s / (P - bw) / 2) * 2) : N;
    A.items.push({ k:'cheese', g: st.cheeseG != null ? st.cheeseG : K.cheese.per2 * nEst / 2, fixed:true });
  }
  if (flourLocked){
    var comps = Object.keys(A.flour), locked = comps.filter(function(k){ return flourLocks[k] != null; }), free = comps.filter(function(k){ return flourLocks[k] == null; });
    if (L.flourTotal != null && locked.length < comps.length){
      var left = L.flourTotal;
      locked.forEach(function(k){ A.flour[k] = Math.min(flourLocks[k], Math.max(0, left)); left -= A.flour[k]; });
      var fs = free.reduce(function(a, k){ return a + f.flour[k]; }, 0);
      free.forEach(function(k){ A.flour[k] = Math.max(0, left) * f.flour[k] / fs; });
    } else {
      locked.forEach(function(k){ A.flour[k] = flourLocks[k]; });
    }
    A.freeFlour = L.flourTotal == null ? free : [];
  }
  /* густота: мука следует за влажностью, или основа — за мукой */
  var eggsProp0 = f.eggsP * s;
  function W(){ return moistureOf(A.items, { appleForm:'grate' }, f.base, A.baseG, eggsProp0); }
  var balance = 1, rebal = null;
  if (!flourLocked){
    var need = f.r * W() - A.starch * FLOURS.starch.c, have = eqOf(A.flour);
    if (have > 0) A.flour = scaleFlour(A.flour, need / have);
  } else if (A.freeFlour && A.freeFlour.length){
    var lockedEq = Object.keys(A.flour).filter(function(k){ return A.freeFlour.indexOf(k) < 0; }).reduce(function(a, k){ return a + A.flour[k] * FLOURS[k].c; }, 0);
    var rem = Math.max(0, f.r * W() - A.starch * FLOURS.starch.c - lockedEq), fe = A.freeFlour.reduce(function(a, k){ return a + f.flour[k] * FLOURS[k].c; }, 0);
    A.freeFlour.forEach(function(k){ A.flour[k] = fe > 0 ? rem * f.flour[k] / fe : 0; });
  } else if (L.base == null && A.baseG > 0 && anchor !== 'flour'){
    var eqHave = eqOf(A.flour) + A.starch * FLOURS.starch.c, wNeed = eqHave / f.r, wOther = W() - A.baseG * BASES[f.base].wet;
    var nb = Math.max(0, (wNeed - wOther) / BASES[f.base].wet); rebal = nb - A.baseG; A.baseG = nb;
  }
  balance = (eqOf(A.flour) + A.starch * FLOURS.starch.c) / (f.r * W());
  if (f.src === 'model') A.bp = f.bpRate * (eqOf(A.flour) + A.starch * FLOURS.starch.c);
  /* статус «проверено» */
  var tested = false;
  if (f.preset && (f.src === 'tested')){
    var pItems = clone(f.preset.items || []).map(function(it){ if (it.sour != null) it.g = st.appleSweet === 'sweet' ? it.sweet : it.sour; it.g = itemMass(it, st); return it; });
    tested = sharesMatch(shareMap(A.items, st, f.base, A.baseG, A.flour, A.bp), shareMap(pItems, st, f.base, f.preset.baseG || 0, f.preset.flour, f.preset.bp || 0));
  }
  /* яйца */
  var mNoEgg = A.items.reduce(function(a, it){ return a + it.g; }, 0) + A.baseG + sumOf(A.flour) + A.starch + A.bp + (A.salt || 0);
  if (f.saltPct) mNoEgg *= (1 + f.saltPct);
  var prop = f.eggsP * mNoEgg / M0F;
  var fneed = flourNeed(A.flour, A.starch), needE = fneed * BASES[f.base].need;
  var refBlend = ((K.refByCurd && K.refByCurd[st.curd]) || K.ref).blend, refBase = ((K.refByCurd && K.refByCurd[st.curd]) || K.ref).base;
  var e = eggPer100(K, st) * fneed / needBlend(refBlend) * BASES[f.base].need / BASES[refBase].need;
  var ideal = e * (mNoEgg + prop * EGG_G) / 100;
  var t = needE >= 1.15 ? 0.35 : needE <= 0.95 ? 0.65 : 0.5;
  if (K.dough === 'liquid') t -= 0.05;
  var fl0 = Math.floor(ideal + 1e-9), eggs = ideal < 1 ? 1 : fl0 + ((ideal - fl0) >= t ? 1 : 0);
  var comp = { g:0, where:null };
  if (!f.preset && Math.abs((eggs - prop) * EGG_G) > 0.5 && L.base == null){
    var dW = (eggs - prop) * EGG_G * EGG_WET;
    if (A.baseG > 0 && !K.coat){
      var nb2 = Math.max(A.baseG * 0.4, A.baseG - dW / BASES[f.base].wet); comp = { g: nb2 - A.baseG, where:'base' }; A.baseG = nb2;
    } else if (!flourLocked){
      var eqS = eqOf(A.flour) + A.starch * FLOURS.starch.c, k = (eqS + dW * f.r) / eqS;
      var before = sumOf(A.flour) + A.starch; A.flour = scaleFlour(A.flour, k); A.starch *= k; comp = { g: sumOf(A.flour) + A.starch - before, where:'flour' };
    }
  }
  var D = A.items.reduce(function(a, it){ return a + it.g; }, 0) + A.baseG + sumOf(A.flour) + A.starch + A.bp + eggs * EGG_G;
  if (f.saltPct) A.salt = D * f.saltPct;
  if (A.salt) D += A.salt;
  /* без своих количеств: подгоняем всё, кроме яиц, точно под N вафель по P г */
  if (!anchor){
    var fixedG = A.items.reduce(function(a, it){ return a + (it.fixed ? it.g : 0); }, 0);
    var target = N * P - bw * N, noEgg = D - eggs * EGG_G - fixedG;
    if (noEgg > 0){
      var kk = (target - eggs * EGG_G - fixedG) / noEgg;
      A.items.forEach(function(it){ if (it.fixed) return; it.g *= kk; if (it.pcs) it.pcs *= kk; });
      A.baseG *= kk; A.flour = scaleFlour(A.flour, kk); A.starch *= kk; A.bp *= kk; if (A.salt) A.salt *= kk;
      if (comp.g) comp.g *= kk;
      D = target;
    }
  }
  /* в проверенном рецепте яиц меньше пропорции — подсказка, сколько основы добавить, если тесто густое */
  var thickTip = 0;
  if (f.preset && prop - eggs > 0.3 && A.baseG > 0) thickTip = (prop - eggs) * EGG_G * EGG_WET / BASES[f.base].wet;
  /* число вафель */
  var lockFit = null, suggest = [];
  if (anchor){
    var best = null;
    for (var n = 2; n <= 60; n += 2){
      var p = (D + bw * n) / n, inR = p >= Math.min(por.min, P0) - 0.5 && p <= por.max + 0.5;
      var score = inR ? Math.abs(p - P0) : 1000 + Math.min(Math.abs(p - por.min), Math.abs(p - por.max));
      if (!best || score < best.score) best = { n:n, inR:inR, score:score };
    }
    N = best.n; lockFit = best.inR;
    if (!lockFit){
      var aG = anchor.indexOf('add:') === 0 ? adds[anchor.slice(4)] : anchor === 'base' ? L.base : (L.flourTotal != null ? L.flourTotal : flourLocks[Object.keys(f.flour).filter(function(k){ return flourLocks[k] != null; })[0]]);
      [N - 2, N, N + 2].forEach(function(n2){ if (n2 >= 2) suggest.push({ n:n2, g: aG * (n2 * P0 - bw * n2) / D }); });
    }
  }
  var butter = bw * N, mass = D + butter;
  var tot = [0, 0, 0, 0];
  function add(g, nn){ for (var i = 0; i < 4; i++) tot[i] += g * nn[i] / 100; }
  A.items.forEach(function(it){ add(it.g, ITEMS[it.k].n); });
  add(A.baseG, BASES[f.base].n); Object.keys(A.flour).forEach(function(fl){ add(A.flour[fl], FLOURS[fl].n); });
  add(A.starch, FLOURS.starch.n); add(A.bp, BP_N); add(eggs * EGG_G, EGG_N); add(butter, ITEMS.butter.n);
  (K.spices || []).forEach(function(sp){ if (SP[sp.k].n) add(sp.per2 * N / 2, SP[sp.k].n); });
  var Pact = mass / N;
  return {
    K:K, f:f, A:A, s:s, N:N, P0:P0, por:por, anchor:anchor, lockFit:lockFit, suggest:suggest, thickTip:thickTip, eggs:eggs, prop:prop, ideal:ideal, need:needE, comp:comp,
    balance:balance, rebal:rebal, tested:tested, butter:butter, D:mass, Pact:Pact, flourLocked:flourLocked,
    k100: tot.map(function(v){ return v / mass * 100; }), kReady: tot.map(function(v){ return v / mass * 100 / (1 - K.loss); }),
    kOne: tot.map(function(v){ return v / N; }), oneReady: Pact * (1 - K.loss), time: timeFor(K, st)
  };
}

/* ===================== ИНТЕРФЕЙС ===================== */
function fmt(g){ if (g == null) return ''; if (g < 10){ var v = Math.round(g * 10) / 10; return String(v).replace('.', ','); } return String(Math.round(g)); }
function fmt1(v){ return String(Math.round(v * 100) / 100).replace('.', ','); }
function plural(n, w){ var a = n % 10, b = n % 100; return (a === 1 && b !== 11) ? w[0] : (a >= 2 && a <= 4 && (b < 12 || b > 14)) ? w[1] : w[2]; }
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
function parseNum(v){ var x = parseFloat(String(v || '').replace(/\s/g, '').replace(',', '.')); return isNaN(x) || x < 0 ? null : x; }
function spiceQty(g){ return g < 0.3 ? 'щепотка' : fmt(g) + ' г'; }
var EGG_W = ['яйцо', 'яйца', 'яиц'], WAF_W = ['вафля', 'вафли', 'вафель'];
var SLOT_LABEL = { apple:'Яблоко', potato:'Картофель', chicken:'Куриное филе', curd:'Творог' };

function mount(root, rec){
  var RC = R[rec.vafli]; if (!RC){ root.innerHTML = '<p>Рецепт не найден.</p>'; return; }
  var KEY = 'vafli2-' + rec.id;
  function load(){ try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch(e){ return {}; } }
  function save(){ try { localStorage.setItem(KEY, JSON.stringify(st)); } catch(e){} }
  var st = load();
  function K(){ return RC.kinds.filter(function(k){ return k.id === st.kind; })[0] || RC.kinds[0]; }
  function sanitize(){
    var k = K(); st.kind = k.id;
    if (k.curd && CURDS.indexOf(st.curd) < 0) st.curd = k.curd.def;
    var bases = basesFor(k, st);
    if (!bases.some(function(b){ return b.id === st.base; })) st.base = k.curd ? k.curd.recBase[st.curd] : bases[0].id;
    if (!k.blends.some(function(b){ return b.id === st.blend; })) st.blend = k.blends[0].id;
    if (!(st.N >= 2 && st.N % 2 === 0)) st.N = k.defN;
    if (st.appleForm !== 'chop') st.appleForm = 'grate';
    if (st.appleSweet !== 'sweet') st.appleSweet = 'sour';
    st.starch = !!st.starch; st.tweak = !!st.tweak; st.cheese = !!st.cheese; if (!(st.cheeseG > 0)) st.cheeseG = null;
    if (!(st.portion > 0)) st.portion = null;
    if (!st.locks || typeof st.locks !== 'object') st.locks = {};
    st.locks.adds = st.locks.adds || {}; st.locks.flour = st.locks.flour || {};
  }
  sanitize();
  function clearLocks(){ st.locks = { adds:{}, flour:{} }; }

  root.innerHTML =
    '<header class="r-head"><span class="eyebrow">Вафли · Breville VST072X</span><h1>' + esc(rec.title) + '</h1><p class="lead">' + esc(RC.lead) + '</p></header>' +
    '<div class="grid">' +
      '<div class="panel">' +
        (RC.kinds.length > 1 ? '<section class="block"><h2>Вид</h2><div class="seg" id="vKind" role="group" aria-label="Вид"></div></section>' : '') +
        '<section class="block"><h2>Сколько вафель</h2>' +
          '<div class="field"><span class="label">Вафель, всегда чётное число</span><div class="stepper"><button type="button" id="vMinus" aria-label="Меньше вафель">−</button><output id="vN"></output><button type="button" id="vPlus" aria-label="Больше вафель">+</button></div><p class="state" id="vNHint"></p></div>' +
          '<div class="field"><label class="label" for="vP">Теста на 1 вафлю</label><div class="inrow"><div class="num" id="vPBox"><input id="vP" type="text" inputmode="decimal" autocomplete="off"><span>г</span></div><button type="button" class="reset" id="vPReset" hidden>Как в рецепте</button></div><p class="state" id="vPHint"></p></div>' +
        '</section>' +
        '<div id="vSlots" class="panel"></div>' +
        '<section class="block"><h2>Жидкая основа</h2><div class="blends" id="vBases" role="radiogroup" aria-label="Жидкая основа"></div><div id="vBaseField"></div></section>' +
        '<section class="block"><h2>Мука</h2><div class="blends" id="vBlends" role="radiogroup" aria-label="Мука"></div><div class="flourfields" id="vFlourFields"></div><p class="hint">Смеси от лучших к менее удачным, только удачные для этого рецепта. Впишите, сколько у вас есть муки: остальное подстроится.</p></section>' +
        '<section class="block" id="vCheeseBlock" hidden><h2>Добавить сыр?</h2><div class="seg" id="vCheese" role="group" aria-label="Сыр"></div><p class="hint" id="vCheeseNote"></p><div id="vCheeseField"></div></section>' +
        '<section class="block"><h2>Добавить кукурузный крахмал?</h2><div class="seg" id="vStarch" role="group" aria-label="Крахмал"></div><p class="hint" id="vStarchNote"></p></section>' +
        '<div><button type="button" class="ghost" id="vResetAll">Вернуть всё к рецепту</button></div>' +
      '</div>' +
      '<div class="result" aria-live="polite">' +
        '<div class="dish">' +
          '<div class="dish-head"><h2>Что положить</h2><span class="pill" id="vStatus"></span></div>' +
          '<label class="check" id="vTweakBox" hidden><input type="checkbox" id="vTweak"><span><span id="vTweakLabel"></span><small id="vTweakDesc"></small></span></label>' +
          '<ul class="ing" id="vIng"></ul>' +
          '<ul class="notes" id="vNotes"></ul>' +
          '<dl class="facts" id="vFacts"></dl>' +
          '<div><p class="label">КБЖУ на 100 г теста</p><div class="kbju" id="vK1"></div>' +
          '<p class="label" style="margin-top:14px">На 100 г готовых вафель</p><div class="kbju" id="vK2"></div>' +
          '<p class="label" style="margin-top:14px">На 1 вафлю</p><div class="kbju" id="vK3"></div><p class="hint" id="vKHint" style="margin-top:8px"></p></div>' +
        '</div>' +
        '<section class="block steps"><h2>Как готовить</h2><ol id="vSteps"></ol></section>' +
      '</div>' +
    '</div>';

  function $(id){ return document.getElementById(id); }
  function changed(){ save(); update(); }
  function seg(el, opts, cur, on){
    el.innerHTML = '';
    opts.forEach(function(o){
      var b = document.createElement('button'); b.type = 'button';
      b.innerHTML = '<span>' + esc(o[1]) + '</span>' + (o[2] ? '<span class="seg-s">' + esc(o[2]) + '</span>' : '');
      b.setAttribute('aria-pressed', String(o[0] === cur));
      b.addEventListener('click', function(){ on(o[0]); });
      el.appendChild(b);
    });
  }
  /* поле для своего количества: как в запеканке */
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

  function buildLists(){
    var k = K();
    if ($('vKind')) seg($('vKind'), RC.kinds.map(function(x){ return [x.id, x.name]; }), k.id, function(id){ st.kind = id; clearLocks(); st.portion = null; st.tweak = false; st.base = null; st.blend = null; sanitize(); st.N = K().defN; buildLists(); changed(); });
    /* продукты-дополнения */
    var sEl = $('vSlots'); sEl.innerHTML = '';
    (k.slots || []).forEach(function(slot){
      var sec = document.createElement('section'); sec.className = 'block';
      sec.innerHTML = '<h2>' + SLOT_LABEL[slot] + '</h2>';
      if (slot === 'curd'){
        var sg = document.createElement('div'); sg.className = 'seg seg-wrap'; sg.id = 'vCurd'; sec.appendChild(sg);
        var cn = document.createElement('p'); cn.className = 'hint'; cn.id = 'vCurdNote'; sec.appendChild(cn);
      }
      if (slot === 'apple'){
        var af = document.createElement('div'); af.className = 'seg'; af.id = 'vAppleForm'; sec.appendChild(af);
        if (k.apple && k.apple.sweetness){ var as = document.createElement('div'); as.className = 'seg'; as.id = 'vAppleSweet'; sec.appendChild(as); }
      }
      sec.appendChild(numField('vAdd-' + slot, 'Сколько у вас ' + (slot === 'apple' ? 'яблока' : slot === 'potato' ? 'картофеля' : slot === 'chicken' ? 'филе' : 'творога'),
        function(v){ st.locks.adds[slot] = v; }, function(){ delete st.locks.adds[slot]; }));
      sEl.appendChild(sec);
    });
    var cf = $('vCheeseField'); cf.innerHTML = '';
    if (k.cheese) cf.appendChild(numField('vCheeseG', 'Сколько сыра', function(v){ st.cheeseG = v; }, function(){ st.cheeseG = null; }));
    /* основы */
    var bEl = $('vBases'); bEl.innerHTML = '';
    var bases = basesFor(k, st);
    bases.forEach(function(b, i){
      var lab = document.createElement('label'); lab.className = 'blend'; lab.dataset.id = b.id;
      lab.innerHTML = '<input type="radio" name="vbase" value="' + b.id + '"><span class="blend-txt"><span class="blend-name">' + esc(BASES[b.id].name) + (i === 0 && bases.length > 1 ? ' <span class="chip">рекомендую</span>' : '') + '<span data-chip></span></span><small>' + esc(b.note) + '</small></span>';
      lab.querySelector('input').addEventListener('change', function(){ st.base = b.id; st.tweak = false; delete st.locks.base; buildBaseField(); changed(); });
      bEl.appendChild(lab);
    });
    buildBaseField();
    /* мука */
    var fEl = $('vBlends'); fEl.innerHTML = '';
    k.blends.forEach(function(b, i){
      var lab = document.createElement('label'); lab.className = 'blend'; lab.dataset.id = b.id;
      lab.innerHTML = '<input type="radio" name="vblend" value="' + b.id + '"><span class="blend-txt"><span class="blend-name">' + esc(blendName(b.id)) + (i === 0 ? ' <span class="chip">рекомендую</span>' : '') + '<span data-chip></span></span><small>' + esc(b.note) + '</small></span>';
      lab.querySelector('input').addEventListener('change', function(){ st.blend = b.id; st.tweak = false; st.locks.flour = {}; delete st.locks.flourTotal; buildFlourFields(); changed(); });
      fEl.appendChild(lab);
    });
    buildFlourFields();
  }
  function buildBaseField(){
    var w = $('vBaseField'); w.innerHTML = '';
    if (st.base === 'none') return;
    w.appendChild(numField('vBase', 'Сколько у вас: ' + BASES[st.base].name.toLowerCase(), function(v){ st.locks.base = v; }, function(){ delete st.locks.base; }));
  }
  function buildFlourFields(){
    var w = $('vFlourFields'); w.innerHTML = '';
    var comps = Object.keys(BLENDS[st.blend]);
    w.classList.toggle('two', comps.length === 2); w.classList.toggle('three', comps.length === 3);
    comps.forEach(function(c){
      w.appendChild(numField('vFl-' + c, FLOURS[c].name + ' мука', function(v){ st.locks.flour[c] = v; if (comps.every(function(x){ return st.locks.flour[x] != null; })) delete st.locks.flourTotal; }, function(){ delete st.locks.flour[c]; }));
    });
    if (comps.length > 1) w.appendChild(numField('vFl-total', 'Мука всего', function(v){ st.locks.flourTotal = v; st.locks.flour = {}; }, function(){ delete st.locks.flourTotal; }));
  }
  buildLists();

  $('vMinus').addEventListener('click', function(){ var n = lastN || st.N; if (n > 2){ st.N = n - 2; clearLocks(); changed(); } });
  $('vPlus').addEventListener('click', function(){ var n = lastN || st.N; if (n < 60){ st.N = n + 2; clearLocks(); changed(); } });
  var lastN = null;
  $('vP').addEventListener('input', function(){ var v = parseNum($('vP').value); if (v && v >= 40 && v <= 250){ st.portion = v; changed(); } });
  $('vP').addEventListener('blur', function(){ if ($('vP').value.trim() === ''){ st.portion = null; changed(); } else update(); });
  $('vPReset').addEventListener('click', function(){ st.portion = null; changed(); });
  $('vTweak').addEventListener('change', function(){ st.tweak = $('vTweak').checked; changed(); });
  $('vResetAll').addEventListener('click', function(){ clearLocks(); st.portion = null; st.tweak = false; st.cheeseG = null; st.N = K().defN; changed(); });

  function kbju(k){
    return '<div><b>' + Math.round(k[0]) + '</b><span>ккал</span></div><div><b>' + fmt1(Math.round(k[1] * 10) / 10) + '</b><span>белки, г</span></div>' +
      '<div><b>' + fmt1(Math.round(k[2] * 10) / 10) + '</b><span>жиры, г</span></div><div><b>' + fmt1(Math.round(k[3] * 10) / 10) + '</b><span>углеводы, г</span></div>';
  }
  function row(name, qty, sub){ return '<li><span class="ing-n">' + name + '</span><span class="ing-q">' + qty + '</span>' + (sub ? '<span class="ing-s">' + sub + '</span>' : '') + '</li>'; }
  function delta(cur, base){
    if (base == null) return '';
    var d = cur - base; if (Math.abs(d) < Math.max(1, base * 0.03)) return '';
    return '<span class="delta">' + (d > 0 ? '+' : '−') + fmt(Math.abs(d)) + ' г</span> к рецепту';
  }
  function join(parts){ return parts.filter(Boolean).join(' · '); }
  function origText(k, t){
    var parts = [];
    (t.items || []).forEach(function(it){ parts.push(ITEMS[it.k].name.toLowerCase() + ' ' + (it.sour != null ? it.sweet + '–' + it.sour : fmt(it.g)) + ' г' + (it.pcs ? ' (' + it.pcs + ' шт)' : '')); });
    if (t.base !== 'none') parts.push(BASES[t.base].name.toLowerCase() + ' ' + fmt(t.baseG) + ' г');
    Object.keys(t.flour).forEach(function(fl){ parts.push(FLOURS[fl].name.toLowerCase() + ' мука ' + fmt(t.flour[fl]) + ' г'); });
    if (k.butter && t.waffles) parts.push('сливочное масло ' + fmt(BUTTER_PER_WAFFLE * t.waffles) + ' г');
    parts.push(t.eggs + ' ' + plural(t.eggs, EGG_W));
    if (t.bp) parts.push('разрыхлитель ' + fmt(t.bp) + ' г');
    if (t.salt) parts.push('соль ' + fmt(t.salt) + ' г');
    return parts.join(', ');
  }
  function testedChip(k, base, blend){
    var s2 = { base:base, blend:blend, curd:st.curd };
    return presetFor(k, s2) ? ' <span class="chip ok-chip">проверено</span>' : '';
  }

  function update(){
    var k = K(), r = compute(k, st), f = r.f, A = r.A, L = st.locks;
    lastN = r.N;
    var rec0 = compute(k, Object.assign({}, st, { locks:{ adds:{}, flour:{} }, N:r.N, portion:null, tweak:false }));
    /* выбор */
    if ($('vCurd')){
      seg($('vCurd'), CURDS.map(function(c){ return [c, CURD_SHORT[c]]; }), st.curd, function(c){
        st.curd = c; delete st.locks.adds.curd; st.base = k.curd.recBase[c]; st.portion = null; st.tweak = false; delete st.locks.base; buildLists(); changed();
      });
      $('vCurdNote').textContent = CURD_NOTE[st.curd] + '.';
    }
    if ($('vAppleForm')) seg($('vAppleForm'), [['grate', 'Тёртое отжатое'], ['chop', 'Мелко нарезанное']], st.appleForm, function(v){ st.appleForm = v; delete st.locks.adds.apple; changed(); });
    if ($('vAppleSweet')) seg($('vAppleSweet'), [['sour', 'Кислое', 'сахара больше'], ['sweet', 'Сладкое', 'сахара меньше']], st.appleSweet, function(v){ st.appleSweet = v; changed(); });
    var anyUser = Object.keys(L.adds).length || L.base != null || Object.keys(L.flour).length || L.flourTotal != null;
    (k.slots || []).forEach(function(slot){
      var it = A.items.filter(function(x){ return x.slot === slot; })[0], user = L.adds[slot] != null;
      paintField('vAdd-' + slot, it ? it.g : 0, user, user ? 'Ваше количество: число вафель и остальное подстроились' : anyUser ? 'Подобрано под ваши значения' : 'По рецепту на ' + r.N + ' ' + plural(r.N, WAF_W));
    });
    $('vBases').querySelectorAll('.blend').forEach(function(l){
      var on = l.dataset.id === st.base; l.classList.toggle('on', on); l.querySelector('input').checked = on;
      l.querySelector('[data-chip]').innerHTML = testedChip(k, l.dataset.id, st.blend);
    });
    if (st.base !== 'none') paintField('vBase', A.baseG, L.base != null, L.base != null ? 'Ваше количество' : (r.rebal != null && Math.abs(r.rebal) >= 1 ? 'Подобрано под вашу муку' : anyUser ? 'Подобрано под ваши значения' : 'По рецепту'));
    $('vBlends').querySelectorAll('.blend').forEach(function(l){
      var on = l.dataset.id === st.blend; l.classList.toggle('on', on); l.querySelector('input').checked = on;
      l.querySelector('[data-chip]').innerHTML = testedChip(k, st.base, l.dataset.id);
    });
    Object.keys(A.flour).forEach(function(c){ paintField('vFl-' + c, A.flour[c], L.flour[c] != null, L.flour[c] != null ? 'Ваше количество' : anyUser ? 'Подобрано под ваши значения' : 'По рецепту'); });
    if ($('vFl-total')) paintField('vFl-total', L.flourTotal != null ? L.flourTotal : Object.keys(A.flour).reduce(function(a, c){ return a + A.flour[c]; }, 0), L.flourTotal != null, L.flourTotal != null ? 'Ваше количество, делится по пропорции смеси' : 'Сумма всех видов муки');
    $('vN').textContent = r.N;
    $('vNHint').textContent = (r.N / 2) + ' ' + plural(r.N / 2, ['партия', 'партии', 'партий']) + ': вафельница печёт по 2 вафли' + (r.anchor ? '. Число вафель подобрано под ваши количества' : '');
    var pIn = $('vP'); if (document.activeElement !== pIn) pIn.value = fmt(r.anchor ? r.Pact : (st.portion || r.P0));
    $('vPBox').classList.toggle('user', !!st.portion && !r.anchor);
    $('vPReset').hidden = !st.portion || !!r.anchor;
    $('vPHint').textContent = 'Для этого рецепта ' + r.por.word + '.';
    $('vCheeseBlock').hidden = !k.cheese;
    if (k.cheese){
      seg($('vCheese'), [[false, 'Нет'], [true, 'Да']], st.cheese, function(v){ st.cheese = v; if (!v) st.cheeseG = null; changed(); });
      $('vCheeseNote').textContent = k.cheese.note;
      $('vCheeseField').hidden = !st.cheese;
      var chIt = A.items.filter(function(x){ return x.k === 'cheese'; })[0];
      if (chIt) paintField('vCheeseG', chIt.g, st.cheeseG != null, st.cheeseG != null ? 'Ваше количество: мука подстроилась' : 'Рекомендую на ' + r.N + ' ' + plural(r.N, WAF_W));
    }
    seg($('vStarch'), [[false, 'Нет'], [true, 'Да']], st.starch, function(v){ st.starch = v; changed(); });
    var noStarch = compute(k, Object.assign({}, st, { starch:false }));
    var eqNo = sumOf(noStarch.A.flour);
    $('vStarchNote').textContent = k.starch + ' Крахмал заменит часть муки' + (st.starch ? ': муки стало на ' + fmt(Math.max(0, eqNo - sumOf(A.flour))) + ' г меньше, крахмала ' + fmt(A.starch) + ' г.' : ', муки станет примерно на ' + fmt(eqNo * STARCH_SHARE) + ' г меньше.');
    /* статус */
    var pill = $('vStatus');
    if (r.tested){ pill.className = 'pill ok'; pill.textContent = 'Проверено'; }
    else if (f.src === 'tweak'){ pill.className = 'pill tweak'; pill.textContent = 'Моя правка · не проверено'; }
    else if (f.preset){ pill.className = 'pill tweak'; pill.textContent = 'Ваше сочетание, но пропорции изменены · не проверено'; }
    else { pill.className = 'pill new'; pill.textContent = 'Новый вариант · не проверено'; }
    var tw = f.preset && f.preset.tweak;
    $('vTweakBox').hidden = !tw || st.starch;
    if (tw){ $('vTweak').checked = !!st.tweak; $('vTweakLabel').textContent = 'Моя правка: ' + tw.label.toLowerCase(); $('vTweakDesc').textContent = tw.desc + '. Будет без отметки «проверено».'; }
    var ok = r.tested ? '<span class="chip ok-chip">проверено</span>' : '';
    /* ингредиенты */
    var B = rec0.A, h = '';
    A.items.forEach(function(it, i){
      if (!it.slot) return;
      var base = B.items[i] && B.items[i].k === it.k ? B.items[i].g : null, sub = [];
      if (it.k === 'apple'){ sub.push(st.appleForm === 'chop' ? 'мелко нарезанное' : 'тёртое и отжатое'); if (it.pcs) sub.push('≈ ' + fmt1(Math.round(it.pcs * 2) / 2) + ' шт'); }
      if (it.k === 'potato') sub.push('≈ ' + fmt(it.g * 110 / 80) + ' г сырого');
      if (it.k === 'chicken') sub.push(k.id === 'kusochki' ? 'кусочками до 1 см' : 'пробить в блендере');
      h += row(esc(ITEMS[it.k].name), fmt(it.g) + ' г', join([ok, L.adds[it.slot] != null ? 'ваше количество' : '', delta(it.g, base)].concat(sub)));
    });
    if (A.baseG > 0){
      h += row(esc(BASES[f.base].name), fmt(A.baseG) + ' г', join([ok, L.base != null ? 'ваше количество' : '', r.comp.where === 'base' && Math.abs(r.comp.g) >= 1 ? (r.comp.g > 0 ? '+' : '−') + fmt(Math.abs(r.comp.g)) + ' г из-за округления яиц' : delta(A.baseG, B.baseG)]));
    }
    h += row('Яйца', r.eggs + ' ' + plural(r.eggs, EGG_W) + ' · ' + r.eggs * 50 + ' г', join([r.tested ? 'по правилу округления' : '', r.eggs !== rec0.eggs ? 'к рецепту ' + (r.eggs > rec0.eggs ? '+' : '−') + Math.abs(r.eggs - rec0.eggs) : '']));
    Object.keys(A.flour).forEach(function(c){ h += row(esc(FLOURS[c].name) + ' мука', fmt(A.flour[c]) + ' г', join([ok, L.flour[c] != null ? 'ваше количество' : '', delta(A.flour[c], B.flour[c])])); });
    if (A.starch > 0) h += row('Кукурузный крахмал', fmt(A.starch) + ' г', '');
    if (r.butter > 0) h += row(esc(ITEMS.butter.name), fmt(r.butter) + ' г', '10 г на каждые 2 вафли, растопить');
    A.items.forEach(function(it){ if (!it.slot) h += row(esc(ITEMS[it.k].name), fmt(it.g) + ' г', join([ok, it.range || '', it.k === 'cheese' && k.cheese ? (st.cheeseG != null ? 'ваше количество' : 'рекомендую') + ' · натереть мелко' : ''])); });
    if (A.bp > 0.05) h += row('Разрыхлитель', fmt(A.bp) + ' г', ok);
    if (A.salt) h += row('Соль', fmt(A.salt) + ' г', A.salt < 1.5 ? 'щепотка' : '');
    var mixSp = (k.spices || []).filter(function(sp){ return !SP[sp.k].solo; });
    (k.spices || []).forEach(function(sp){
      if (!SP[sp.k].solo && mixSp.length > 1){
        if (sp !== mixSp[0]) return;
        var g = mixSp.reduce(function(a, x){ return a + x.per2 * r.N / 2; }, 0);
        h += row('Специи (' + mixSp.map(function(x){ return SP[x.k].short; }).join(', ') + ')', spiceQty(g), 'рекомендую');
        return;
      }
      h += row(esc(SP[sp.k].name), spiceQty(sp.per2 * r.N / 2), join(['рекомендую', sp.note || '']));
    });
    $('vIng').innerHTML = h;
    /* пояснения */
    var notes = [];
    if (Math.abs(r.eggs - r.prop) >= 0.05){
      var why = r.ideal < 1 && r.eggs === 1 ? 'меньше одного яйца не бывает' :
        r.eggs > r.ideal + 0.01 ? (r.need >= 1.15 ? 'мука без глютена хуже держит форму, ей нужна связка, поэтому округляю вверх' : 'жидкому тесту нужна связка, поэтому округляю вверх') :
        (r.need <= 0.95 ? ((f.base === 'soft' || f.base === 'yogurt') ? 'творожная основа и мука сами хорошо держат тесто, поэтому округляю вниз' : 'мука хорошо держит форму, поэтому округляю вниз') : 'больше для связки не нужно');
      var cmp = r.comp.where === 'base' && Math.abs(r.comp.g) >= 1 ? ' Чтобы густота не изменилась, ' + BASES[f.base].gen + ' на ' + fmt(Math.abs(r.comp.g)) + ' г ' + (r.comp.g > 0 ? 'больше.' : 'меньше.') :
        r.comp.where === 'flour' && Math.abs(r.comp.g) >= 1 ? ' Чтобы густота не изменилась, муки на ' + fmt(Math.abs(r.comp.g)) + ' г ' + (r.comp.g > 0 ? 'больше.' : 'меньше.') :
        r.tested ? ' Остальные продукты — точно в ваших пропорциях.' + (r.thickTip >= 3 ? ' Если тесто покажется гуще обычного, добавьте до ' + fmt(r.thickTip) + ' г ' + BASES[f.base].gen + '.' : '') : '';
      notes.push(['', 'Яйца: при пропорциональном пересчёте вышло бы ' + fmt1(Math.round(r.prop * 10) / 10) + ', а для связки нужно около ' + fmt1(Math.round(r.ideal * 10) / 10) + '. Беру ' + r.eggs + ': ' + why + '.' + cmp]);
    }
    if (r.rebal != null && Math.abs(r.rebal) >= 1) notes.push(['', 'Муки ' + (r.rebal < 0 ? 'меньше' : 'больше') + ', чем по рецепту, поэтому ' + BASES[f.base].gen + ' ' + (r.rebal < 0 ? 'меньше' : 'больше') + ': ' + fmt(A.baseG) + ' г. Так густота останется прежней.']);
    if (r.balance < 0.92) notes.push(['warn', 'Муки маловато для такой основы: тесто будет жиже и может вытекать. Добавьте около ' + fmt((1 - r.balance) * (sumOf(A.flour) + A.starch) / r.balance) + ' г муки' + (L.base != null ? ' или уменьшите основу' : '') + '.']);
    else if (r.balance > 1.08) notes.push(['warn', 'Муки многовато: вафля выйдет плотной и суховатой. Уберите около ' + fmt((r.balance - 1) * (sumOf(A.flour) + A.starch) / r.balance) + ' г муки' + (L.base != null ? ' или добавьте основы' : '') + '.']);
    if (r.anchor && !r.lockFit){
      var what = r.anchor === 'base' ? BASES[f.base].gen : r.anchor === 'flour' ? 'муки' : ({ apple:'яблока', potato:'картофеля', chicken:'филе', curd:'творога' })[r.anchor.slice(4)];
      notes.push(['warn', 'С такими количествами выходит ' + r.N + ' ' + plural(r.N, WAF_W) + ' по ' + fmt(r.Pact) + ' г — это вне нормы (' + r.por.word + '). Чтобы попасть в норму, возьмите ' + what + ': ' +
        r.suggest.map(function(x){ return fmt(x.g) + ' г на ' + x.n + ' ' + plural(x.n, ['вафлю', 'вафли', 'вафель']); }).join(', ') + '.']);
    }
    if (!r.anchor && (r.Pact < r.por.min - 1 || r.Pact > r.por.max + 1)) notes.push(['warn', 'Для этого рецепта ' + r.por.word + '. Меньше — вафля не заполнит форму, больше — тесто будет вытекать.']);
    if (f.preset){
      notes.push(['', '<b>Ваш проверенный рецепт</b>' + (f.preset.waffles ? ' на ' + f.preset.waffles + ' ' + plural(f.preset.waffles, ['вафлю', 'вафли', 'вафель']) : '') + ': ' + esc(origText(k, f.preset)) + '.' +
        (f.preset.note ? ' <i>Ваша заметка:</i> ' + esc(f.preset.note) : '') + (f.preset.comment ? ' ' + esc(f.preset.comment) : '') +
        (!r.tested && f.src === 'tested' ? ' Сейчас пропорции отличаются от ваших, поэтому без отметки «проверено».' : '')]);
    }
    if (k.orig) notes.push(['', esc(k.orig.text)]);
    if (k.serving && k.serving.length){
      notes.push(['spice', '<b>Специи под подачу</b> на ' + r.N + ' ' + plural(r.N, ['вафлю', 'вафли', 'вафель']) + ':<br>' + k.serving.map(function(v){ return esc(v.t) + ': ' + esc(v.x) + ' — ' + spiceQty(v.per2 * r.N / 2) + (v.alt ? ' (' + esc(v.alt) + ')' : ''); }).join('<br>')]);
    }
    $('vNotes').innerHTML = notes.map(function(n){ return '<li' + (n[0] ? ' class="' + n[0] + '"' : '') + '>' + n[1] + '</li>'; }).join('');
    var batches = r.N / 2, tm = r.time[0] === r.time[1] ? fmt1(r.time[0]) : r.time[0] + '–' + r.time[1];
    $('vFacts').innerHTML =
      '<dt>Вафель</dt><dd>' + r.N + ' шт по ' + fmt(r.Pact) + ' г теста, всего ' + fmt(r.D) + ' г</dd>' +
      '<dt>Время</dt><dd>' + tm + ' мин на партию · ' + batches + ' ' + plural(batches, ['партия', 'партии', 'партий']) + ' ≈ ' + Math.round(batches * r.time[1]) + ' мин</dd>' +
      '<dt>Готовая вафля</dt><dd>≈ ' + fmt(r.oneReady) + ' г</dd>';
    $('vK1').innerHTML = kbju(r.k100); $('vK2').innerHTML = kbju(r.kReady); $('vK3').innerHTML = kbju(r.kOne);
    $('vKHint').textContent = 'При выпекании уходит около ' + Math.round(k.loss * 100) + '% влаги: из ' + fmt(r.Pact) + ' г теста выйдет вафля примерно ' + fmt(r.oneReady) + ' г.';
    var steps = ['<b>Разогрейте вафельницу</b>, пока не загорится индикатор готовности.'];
    (k.prep || []).forEach(function(p){ steps.push(p); });
    var mixT = f.base === 'none' ? k.mix.replace('с основой, ', 'с ').replace(', основой', '') : k.mix;
    steps.push(mixT.replace('{starch}', A.starch > 0 ? ' и крахмалом' : '').replace('{cheese}', A.items.some(function(x){ return x.k === 'cheese'; }) ? ', тёртым сыром' : ''));
    if (r.butter > 0) steps.push('Влейте растопленное и чуть остывшее сливочное масло (' + fmt(r.butter) + ' г) и перемешайте.');
    (k.tips || []).forEach(function(p){ steps.push(p); });
    steps.push('<b>Выложите по ' + fmt(r.Pact) + ' г теста</b> в каждую из двух форм' + (k.dough === 'thick' ? ', разровняйте ложкой' : '') + ' и закройте крышку.');
    steps.push('<b>Выпекайте ' + tm + ' мин.</b>' + (batches > 1 ? ' Всего ' + batches + ' ' + plural(batches, ['партия', 'партии', 'партий']) + '.' : ''));
    steps.push('Готовые вафли выложите на решётку, чтобы снизу не отсырели.');
    $('vSteps').innerHTML = steps.map(function(x){ return '<li>' + x + '</li>'; }).join('');
  }
  update();
}

window.RecipeModules = window.RecipeModules || {};
window.RecipeModules.vafli = { mount: mount, _test: { R:R, compute:compute, BLENDS:BLENDS, presetFor:presetFor } };
})();
