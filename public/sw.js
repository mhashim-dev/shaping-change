/* Service worker for Shaping Change — offline support for a low/patchy-connectivity
 * audience. Strategy: network-first for navigations (so content stays fresh when online,
 * falls back to the cached shell offline), stale-while-revalidate for static assets (serve
 * the cached copy instantly, but always fetch in the background and update the cache for
 * NEXT time — so a real deploy reaches phones on their very next visit instead of being
 * stuck behind an old cached JS/CSS bundle indefinitely). Same-origin only — never caches
 * cross-origin requests (keeps the asset-free / no-external-calls posture).
 *
 * Bump CACHE on any release where old cached entries should be dropped outright — the
 * activate handler deletes every cache whose name doesn't match this one. */
const CACHE = 'shaping-change-v2';
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

  // stale-while-revalidate for everything else same-origin (JS/CSS/assets): answer instantly
  // from cache if we have it, but always also fetch fresh in the background and update the
  // cache — so the NEXT visit gets the new deploy instead of staying pinned to an old bundle.
  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
