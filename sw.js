// OBHG CLINICAL TRIAGE service worker. v34 (14 Nov 2026): release cleanup: internal review flags and personal approval attributions removed app-wide (no clinical change).
// v33 (13 Nov 2026): ANT-TRAUMA, ANT-STI and ANT-UTI cards and algorithms released.
// v32 (13 Nov 2026): ANT-TRAUMA, ANT-STI and ANT-UTI cards and algorithms with OBED triage (live).
// v31 (13 Nov 2026): adds ANT-UTI and FD-ANT-UTI (test build).
// v30 (13 Nov 2026): Doc review fixes — GYNB-06 pregnancy gate, stiLD flank/CVA, SMFM #69 HBIG dose line (test build).
// v29 (13 Nov 2026): adds OBED triage branches and house decisions to the trauma and STI algorithms (test build).
// v28 (13 Nov 2026): adds FD-ANT-TRAUMA and FD-ANT-STI algorithms (test build).
// v27 (13 Nov 2026): adds ANT-TRAUMA (trauma in pregnancy) clinician card.
// v26 (13 Nov 2026): start page with four sections (Clinician, Nurse, Browse Guidelines, Patient log).
// v25 (12 Nov 2026): adds the English-only nurse section (nurse.html) and keeps its navigation cache separate from index.html.
// v24 (11 Nov 2026): precaches the plain-name diagram images the app shows; original diagram files are cached on first use.
// Only deletes caches with its own prefix. Cache-first assets, network-first navigation. No network calls carry user input.
const PREFIX = 'obhg-triage-';
const CACHE = PREFIX + 'v34-2026-11-14-release';
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
  './js/flow-cues.js',
  './nurse.html',
  './css/nurse.css',
  './js/nurse-safety-vocabulary.js',
  './js/nurse-red-flags.js',
  './js/nurse-engine.js',
  './js/nurse-flow.js',
  './js/nurse-cards.js',
  './js/nurse-protocols.js',
  './js/nurse-ui.js',
  './codes/code_tables.js',
  './codes/validation.js',
  './assets/display-diagrams/FD-ANT-01.png',
  './assets/display-diagrams/FD-ANT-02.png',
  './assets/display-diagrams/FD-ANT-04.png',
  './assets/display-diagrams/FD-ANT-05.png',
  './assets/display-diagrams/FD-ANT-07.png',
  './assets/display-diagrams/FD-ANT-08.png',
  './assets/display-diagrams/FD-ANT-11.png',
  './assets/display-diagrams/FD-ANT-STI.png',
  './assets/display-diagrams/FD-ANT-TRAUMA.png',
  './assets/display-diagrams/FD-ANT-UTI.png',
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
    // The nurse page is cached under its own key so it never replaces the cached physician index.html.
    const page = new URL(e.request.url).pathname.endsWith('/nurse.html') ? './nurse.html' : './index.html';
    e.respondWith(fetch(e.request).then(resp => { const copy = resp.clone(); caches.open(CACHE).then(c => c.put(page, copy)); return resp; })
      .catch(() => caches.open(CACHE).then(c => c.match(page))));
    return;
  }
  e.respondWith(caches.open(CACHE).then(c => c.match(e.request, { ignoreSearch: true })).then(r => r || fetch(e.request).then(resp => {
    const copy = resp.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return resp; })));
});
