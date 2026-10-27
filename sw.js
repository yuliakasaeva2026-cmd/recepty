/* Сохраняет книгу на телефоне, чтобы она открывалась без интернета. */
const CACHE = 'recepty-v3';
const ASSETS = ['./', './index.html', './recipes.js', './calc-zapekanka.js', './calc-vafli.js', './calc-recept.js', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
function withTimeout(p, ms) {
  return new Promise((resolve, reject) => { const t = setTimeout(() => reject(new Error('timeout')), ms); p.then(v => { clearTimeout(t); resolve(v); }, err => { clearTimeout(t); reject(err); }); });
}
async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await withTimeout(fetch(req, { cache: 'no-cache' }), 3500);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    const hit = await cache.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' ? (await cache.match('./index.html')) || (await cache.match('./')) : undefined);
    return hit || Response.error();
  }
}
async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
    return res;
  } catch (e) { return Response.error(); }
}
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  e.respondWith(url.origin === self.location.origin ? networkFirst(req) : cacheFirst(req));
});
