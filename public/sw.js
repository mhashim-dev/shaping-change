/* Service worker for Shaping Change — offline support for a low/patchy-connectivity
 * audience. Strategy: network-first for navigations (so content stays fresh when online,
 * falls back to the cached shell offline), cache-first for static assets. Same-origin only
 * — never caches cross-origin requests (keeps the asset-free / no-external-calls posture).
 */
const CACHE = 'shaping-change-v1';
const SHELL = ['/', '/icon.svg', '/manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // same-origin only

  if (req.mode === 'navigate') {
    // network-first: fresh when online, cached shell when offline
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
        .catch(() => caches.match(req).then((r) => r || caches.match('/')))
    );
    return;
  }

  // cache-first for everything else same-origin (JS/CSS/assets)
  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res;
    }).catch(() => cached))
  );
});
