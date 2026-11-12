// OBHG CLINICAL TRIAGE service worker. v24 (11 Nov 2026): precaches the plain-name diagram images the app shows; original diagram files are cached on first use.
// Only deletes caches with its own prefix. Cache-first assets, network-first navigation. No network calls carry user input.
const PREFIX = 'obhg-triage-';
const CACHE = PREFIX + 'v24-2026-11-11-dm-titles';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/content.js',
  './js/display-names.js',
  './js/review.js',
  './js/engine.js',
  './js/routine_codes.js',
  './js/flowplans.js',
  './js/shiftlog.js',
  './js/app.js',
  './codes/code_tables.js',
  './codes/validation.js',
  './assets/display-diagrams/FD-ANT-01.png',
  './assets/display-diagrams/FD-ANT-02.png',
  './assets/display-diagrams/FD-ANT-04.png',
  './assets/display-diagrams/FD-ANT-05.png',
  './assets/display-diagrams/FD-ANT-07.png',
  './assets/display-diagrams/FD-ANT-08.png',
  './assets/display-diagrams/FD-ANT-11.png',
  './assets/display-diagrams/FD-ED-OB.png',
  './assets/display-diagrams/FD-GYN-01.png',
  './assets/display-diagrams/FD-GYNB-02.png',
  './assets/display-diagrams/FD-GYNB-04.png',
  './assets/display-diagrams/FD-LND-01.png',
  './assets/display-diagrams/FD-LND-02.png',
  './assets/display-diagrams/FD-LND-04.png',
  './assets/display-diagrams/FD-LND-05.png',
  './assets/display-diagrams/FD-LND-06.png',
  './assets/display-diagrams/FD-LND-09.png',
  './assets/display-diagrams/FD-LND-10.png',
  './assets/display-diagrams/FD-PP-01.png',
  './assets/display-diagrams/FD-SYS-02.png',
  './assets/display-diagrams/FD-SYS-03.png',
  './assets/display-diagrams/FD-SYS-04.png',
  './assets/display-diagrams/FD-SYS-05.png',
  './assets/icons/icon-180.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  // HTML navigations: network-first so a new deploy is seen; falls back to cache offline.
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then(resp => { const copy = resp.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return resp; })
      .catch(() => caches.open(CACHE).then(c => c.match('./index.html'))));
    return;
  }
  e.respondWith(caches.open(CACHE).then(c => c.match(e.request, { ignoreSearch: true })).then(r => r || fetch(e.request).then(resp => {
    const copy = resp.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return resp; })));
});
