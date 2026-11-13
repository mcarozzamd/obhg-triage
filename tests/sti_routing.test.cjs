// ANT-STI routing and browse (13 Nov 2026). Synthetic HPIs only; no holdout/blind files.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const {JSDOM, requestInterceptor, VirtualConsole} = require('jsdom');
const base = path.resolve(__dirname, '..');
global.self = global;
const C = require(base + '/js/content.js');
const E = require(base + '/js/engine.js');
const D = require(base + '/js/display-names.js');
const T = require(base + '/codes/code_tables.js');
const V = require(base + '/codes/validation.js');

function triage(hpi) { return E.triage(hpi, C, T, V); }
const card = C.items.find(i => i.id === 'ANT-STI');

test('ANT-STI card is present, tagged PROVISIONAL, with every pharmacy and coding line', () => {
  assert.ok(card, 'card exists in CONTENT');
  assert.equal(card.kind, 'card');
  assert.equal(card.book, 'OB');
  assert.match(card.title, /STIs on Labor and Delivery/i);
  assert.ok(card.flags && card.flags.length >= 2);
  assert.ok(card.flags.some(f => /PROVISIONAL/i.test(f)));
  assert.ok(card.flags.some(f => /Bicillin/i.test(f) && /ZDV/i.test(f)));
  assert.ok(card.flags.some(f => /Coding/i.test(f) && /hep B/i.test(f)));
  assert.equal((card.html.match(/Doses to be checked against CSM pharmacy build\./g) || []).length, 9);
  assert.match(card.html, /CODING \(draft — verify with OBHG coding\)/);
  assert.match(card.html, /Only TWO things on this card change the WAY she delivers/);
  assert.match(card.html, /Benzathine penicillin G 2\.4 million units IM x1/);
  assert.match(card.html, /Never Bicillin C-R/);
  assert.match(card.html, /Mother HBsAg UNKNOWN/);
  assert.match(card.html, /TP-PA \+ → current or past syphilis/);
  assert.equal(D.title('ANT-STI'), 'STIs on Labor and Delivery');
});

const routes = [
  ['28 yo G2P1 at 38 weeks, syphilis status unknown, no RPR on file', 'syphilis'],
  ['30 yo G1P0 at 39 weeks in labor, RPR pending', 'RPR'],
  ['25 yo G1P0 at 37 weeks with HSV, active genital lesions', 'HSV'],
  ['29 yo G3P2 at 40 weeks, history of genital herpes, asking about suppression', 'herpes'],
  ['26 yo G1P0 at 38 weeks in labor with vulvar lesions and prodrome', 'lesions'],
  ['22 yo G1P0 at 36 weeks, untreated gonorrhea this pregnancy', 'gonorrhea'],
  ['24 yo G2P1 at 38 weeks, chlamydia positive, not yet treated', 'chlamydia'],
  ['31 yo G2P1 at 37 weeks, symptomatic trichomonas', 'trichomonas'],
  ['27 yo G1P0 at 39 weeks, symptomatic BV, scheduled induction today', 'BV'],
  ['33 yo G2P1 at 38 weeks with a yeast infection, itching', 'yeast'],
  ['20 yo G1P0 at 35 weeks, no prenatal care, possible STI exposure', 'STI'],
  ['34 yo G2P1 at 39 weeks in labor, HIV unknown, no third-trimester result', 'HIV unknown'],
  ['29 yo G1P0 at 38 weeks, hep B unknown, no HBsAg on the chart', 'hep B unknown'],
  ['22 yo G1 at 16 weeks with vaginal discharge and itching', 'OBED vaginal discharge'],
  ['30 yo G2P1 at 22 weeks with genital ulcers', 'OBED genital ulcers'],
  ['25 yo G1 at 8 weeks with pelvic pain and fever, concern for PID', 'OBED PID'],
  ['27 yo P1 day 3 postpartum with fever and uterine tenderness, endometritis', 'OBED endometritis'],
  ['24 yo G1 at 20 weeks, partner treated for gonorrhea, exposure 1 week ago', 'OBED partner exposure'],
];

for (const [hpi, label] of routes) {
  test('routes to ANT-STI: ' + label, () => {
    const r = triage(hpi);
    assert.ok(r.top, hpi);
    assert.equal(r.top.id, 'ANT-STI', hpi + ' → ' + (r.top && r.top.id) + ' ' + JSON.stringify(r.ranked && r.ranked.slice(0,4)));
    assert.ok(r.top.score >= 93, 'score ' + (r.top && r.top.score));
  });
}

test('known HIV with a viral-load / delivery-timing question does not steal ANT-STI unless status is unknown', () => {
  const r = triage('32 yo G1P0 at 38 weeks, known HIV, viral load 50, when to deliver');
  assert.notEqual(r.top && r.top.id, 'ANT-STI', 'bare HIV + viral load should stay on the timing path, got ' + (r.top && r.top.id));
});

test('non-pregnant STI complaint does not open ANT-STI', () => {
  const r = triage('22 yo woman, not pregnant, with chlamydia');
  assert.notEqual(r.top && r.top.id, 'ANT-STI');
});

const mime = {'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webmanifest':'application/manifest+json'};
let server, origin;
test.before(async () => {
  server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\//, '') || 'index.html';
    const f = path.join(base, p);
    if (!f.startsWith(base + '/')) { res.writeHead(403).end(); return; }
    try { res.setHeader('Content-Type', mime[path.extname(f)] || 'application/octet-stream'); res.end(fs.readFileSync(f)); }
    catch { res.writeHead(404).end(); }
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  origin = 'http://127.0.0.1:' + server.address().port;
});
test.after(() => server.close());

async function open(hash = '') {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => errors.push(e.message));
  vc.on('error', e => errors.push(String(e)));
  const dom = await JSDOM.fromURL(origin + '/' + hash, {
    runScripts: 'dangerously', virtualConsole: vc,
    resources: {interceptors: [requestInterceptor(req => req.url.startsWith(origin + '/') ? undefined : new Response('', {headers: {'Content-Type': 'application/javascript'}}))]},
    beforeParse(w) { w.HTMLElement.prototype.scrollIntoView = function () {}; w.confirm = () => true; }
  });
  if (dom.window.document.readyState !== 'complete') await new Promise(r => dom.window.addEventListener('load', r, {once: true}));
  const w = dom.window, d = w.document, $ = id => d.getElementById(id);
  const vis = id => { let e = $(id); while (e) { if (e.hidden) return false; e = e.parentElement; } return true; };
  return {w, d, $, vis, errors, click: id => $(id).click(), close: () => w.close()};
}

test('Browse Guidelines lists STIs on Labor and Delivery and opens the card', async () => {
  const t = await open();
  t.click('start-browse');
  assert.ok(t.vis('view-browse'));
  assert.match(t.$('list').textContent, /STIs on Labor and Delivery/);
  t.$('q').value = 'syphilis HSV';
  t.$('q').dispatchEvent(new t.w.Event('input'));
  const btn = [...t.d.querySelectorAll('#list [data-open]')].find(b => /STIs on Labor and Delivery/i.test(b.textContent));
  assert.ok(btn, 'browse search finds the card');
  btn.click();
  assert.ok(t.vis('result'));
  assert.match(t.$('top').textContent, /Only TWO things on this card change the WAY she delivers/);
  assert.match(t.$('top').textContent, /PROVISIONAL/);
  assert.deepEqual(t.errors, []);
  t.close();
});

test('HPI triage of syphilis in labor shows the ANT-STI card', async () => {
  const t = await open();
  t.click('start-clinician');
  t.$('hpi').value = '28 yo G2P1 at 38 weeks, syphilis status unknown, no RPR on file';
  t.click('go');
  assert.ok(t.vis('result'));
  assert.match(t.$('top').textContent, /STIs on Labor and Delivery/);
  assert.match(t.$('top').textContent, /benzathine penicillin/i);
  assert.deepEqual(t.errors, []);
  t.close();
});

test('house decisions applied on ANT-STI: SMFM #69, always-treat trich, inpatient pyelo, J-H house practice; LactMed-not-CDC removed', () => {
  const h = card.html;
  assert.match(h, /SMFM Consult #69, vaccine plus HBIG within 12 h|infant HepB vaccine \+ HBIG within 12 h \(SMFM Consult #69/);
  assert.match(h, /always treat, including an incidental finding in an asymptomatic patient/i);
  assert.match(h, /ADMIT as an inpatient for IV antibiotics/);
  assert.doesNotMatch(h, /Outpatient pyelo only in highly selected/);
  assert.match(h, /House practice \(not a cited rule\)/);
  assert.match(h, /From 24 wk on, with primary, secondary or early latent syphilis/);
  assert.doesNotMatch(h, /LactMed — not a CDC statement/);
  assert.doesNotMatch(h, /supported by LactMed, not by the CDC STI guideline text/);
  assert.match(h, /Doxycycline is compatible with breastfeeding \(CDC 2021\)/);
  assert.match(h, /Hepatitis B vaccine plus HBIG 0\.5 mL IM within 12 h for HBsAg-positive or unknown maternal status \(SMFM Consult #69; no weight split\)/);
  assert.doesNotMatch(h, /per maternal HBsAg\/weight rules above/);

  // remaining pending tags only
  const pend = [...h.matchAll(/Pending house decision/g)];
  assert.equal(pend.length, 4);
  assert.match(h, /regimen per ID\/pharmacy[\s\S]{0,80}Pending house decision/);
  assert.match(h, /Darkfield\/T\. pallidum PCR[\s\S]{0,80}Pending house decision/);
});

function offered(r, id) {
  return [r.top, ...(r.alternates || [])].some(x => x && x.id === id);
}

test('GYNB-06 is never offered in pregnancy or postpartum; ANT-STI is primary for pregnancy pyelo', () => {
  const pregnant = [
    '24 yo G1P0 at 26 weeks with flank pain, CVA tenderness, dysuria',
    '31 yo G2P1 at 34 weeks, pyelonephritis, fever and CVA tenderness',
    '28 yo G3P2 at 30 weeks with dysuria and frequency',
    '30 yo G1P0 postpartum day 5, pyelonephritis',
    '28 yo G2P1 day 3 postpartum with flank pain and fever 38.2',
  ];
  for (const hpi of pregnant) {
    const r = triage(hpi);
    assert.equal(offered(r, 'GYNB-06'), false, 'GYNB-06 offered on ' + hpi + ' → ' + JSON.stringify((r.ranked || []).slice(0, 4)));
    assert.ok(r.top && (r.top.id === 'ANT-UTI' || r.top.id === 'ANT-STI' || r.top.id === 'SYS-03'), hpi + ' → ' + (r.top && r.top.id));
  }
  const r26 = triage('24 yo G1P0 at 26 weeks with flank pain, CVA tenderness, dysuria');
  assert.equal(r26.top.id, 'ANT-UTI');
  assert.ok(offered(r26, 'ANT-STI'), 'ANT-STI is the first alternate');
  const rSeptic = triage('26 yo G1P0 at 30 weeks with temp 38.6, HR 120, RR 26, flank pain');
  assert.equal(rSeptic.top.id, 'SYS-03', 'septic 30-wk flank pain stays on SYS-03');
  assert.ok(offered(rSeptic, 'ANT-UTI'), 'ANT-UTI is the source-card alternate');
  assert.equal(offered(rSeptic, 'GYNB-06'), false);
  const rNP = triage('32 yo nonpregnant woman with flank pain, CVA tenderness, dysuria');
  assert.equal(rNP.top && rNP.top.id, 'GYNB-06', 'non-pregnant pyelo still opens GYNB-06');
});

test('ANT-STI OBED test-of-cure is labeled house practice, not attributed to ACOG', () => {
  assert.match(card.html, /test of cure culture after treatment \(house practice, Michael\)/);
  assert.doesNotMatch(card.html, /test of cure culture after treatment \(ACOG\)/);
});
