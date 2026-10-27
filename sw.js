// OBHG CLINICAL TRIAGE service worker. Only deletes caches with its own prefix. Cache-first assets, network-first navigation. No network calls carry user input.
const PREFIX = 'obhg-triage-';
const CACHE = PREFIX + 'v16-2026-10-27';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/content.js',
  './js/engine.js',
  './js/routine_codes.js',
  './js/shiftlog.js',
  './js/app.js',
  './codes/code_tables.js',
  './codes/validation.js',
  './assets/diagrams/ANT-01_PROM_PPROM_FLOW_2026-10-25.png',
  './assets/diagrams/ANT-02_PRETERM_LABOR_FLOW_2026-10-25.png',
  './assets/diagrams/ANT-04_SEVERE_BP_FLOW_2026-10-25.png',
  './assets/diagrams/ANT-07_ACCRETA_FLOW_2026-10-25.png',
  './assets/diagrams/ANT-08_NVP_HYPEREMESIS_FLOW_2026-10-25.png',
  './assets/diagrams/ED_TO_OB_PATHWAY_DECISION_TREE_2026-10-25.png',
  './assets/diagrams/GYN-01_ECTOPIC_PUL_FLOW_2026-10-26.png',
  './assets/diagrams/GYN-02_ACUTE_AUB_FLOW_2026-10-25.png',
  './assets/diagrams/GYN-04_ADNEXAL_TORSION_MASS_FLOW_2026-10-25.png',
  './assets/diagrams/LND-01_CAT_II_FHR_FLOW_2026-10-25.png',
  './assets/diagrams/LND-02_LABOR_ARREST_FLOW_2026-10-25.png',
  './assets/diagrams/LND-04_IAI_FLOW_2026-10-25.png',
  './assets/diagrams/LND-05_GBS_IAP_FLOW_2026-10-25.png',
  './assets/diagrams/LND-06_SHOULDER_DYSTOCIA_FLOW_2026-10-25.png',
  './assets/diagrams/PP-01_PPH_FLOW_2026-10-25.png',
  './assets/diagrams/SYS-02_VTE_POSTPARTUM_DECISION_TREE_FINAL_2026-10-01.png',
  './assets/diagrams/SYS-03_MATERNAL_SEPSIS_FLOW_2026-10-25.png',
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
