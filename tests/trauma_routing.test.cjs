// ANT-TRAUMA routing and browse (13 Nov 2026). Synthetic HPIs only; no holdout/blind files.
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

function triage(hpi) {
  return E.triage(hpi, C, T, V);
}

const card = C.items.find(i => i.id === 'ANT-TRAUMA');

test('ANT-TRAUMA card is present, tagged PROVISIONAL, with pharmacy-check flags and draft wording', () => {
  assert.ok(card, 'card exists in CONTENT');
  assert.equal(card.kind, 'card');
  assert.equal(card.book, 'OB');
  assert.match(card.title, /Trauma in pregnancy/i);
  assert.ok(card.flags && card.flags.length >= 2);
  assert.ok(card.flags.some(f => /PROVISIONAL/i.test(f)));
  assert.ok(card.flags.some(f => /RhIG/i.test(f) && /betamethasone/i.test(f) && /Tdap/i.test(f)));
  assert.match(card.html, /PROVISIONAL/);
  assert.match(card.html, /Mother first: primary survey \(ABCDE\) before the fetus/);
  assert.match(card.html, /RhIG 300 mcg IM within 72 h/);
  assert.match(card.html, /Betamethasone 12 mg IM q24h x 2/);
  assert.match(card.html, /to be checked against CSM pharmacy build/);
  assert.match(card.html, /SOGC Clinical Practice Guideline No\. 325/);
  assert.match(card.html, /J Trauma 2010;69\(1\):211–214/);
  assert.equal(D.title('ANT-TRAUMA'), 'Trauma in pregnancy');
});

const routes = [
  ['27 yo G3P2 at 30 weeks, pregnant patient in the main ED after an MVA, stable', 'MVA in the ED'],
  ['28 yo G2P1 at 28 weeks after a fall down stairs, stable, no bleeding', 'fall'],
  ['32 yo G1P0 at 34 weeks in a motor vehicle collision, abdominal pain', 'MVC / motor vehicle'],
  ['25 yo G3P2 at 26 weeks with blunt abdominal injury after being hit by a ball', 'blunt abdominal injury'],
  ['29 yo G2P1 at 31 weeks, abdominal trauma from a direct abdominal blow', 'abdominal trauma / direct blow'],
  ['21 yo G1P0 at 24 weeks, assault with abdominal injury, stable', 'assault'],
  ['30 yo G4P3 at 33 weeks, trauma to the abdomen, no contractions', 'trauma keyword'],
];

for (const [hpi, label] of routes) {
  test('routes to ANT-TRAUMA: ' + label, () => {
    const r = triage(hpi);
    assert.ok(r.top, hpi);
    assert.equal(r.top.id, 'ANT-TRAUMA', hpi + ' → ' + (r.top && r.top.id));
    assert.ok(r.top.score >= 94, 'score ' + (r.top && r.top.score));
  });
}

test('ED MVA in pregnancy still lists ED-OB among candidates, but ANT-TRAUMA is first', () => {
  const r = triage('27 yo G3P2 at 30 weeks, pregnant patient in the main ED after an MVA, stable');
  assert.equal(r.top.id, 'ANT-TRAUMA');
  const ids = (r.ranked || []).map(x => x.id);
  assert.ok(ids.includes('ED-OB'), 'ED-OB remains a candidate: ' + ids.join(','));
});

test('broader ED "trauma" terms (chest pain, overdose, stroke, syncope) do not open ANT-TRAUMA', () => {
  for (const hpi of [
    '27 yo G3P2 at 30 weeks with chest pain',
    '27 yo G3P2 at 30 weeks, overdose',
    '27 yo G3P2 at 30 weeks, stroke symptoms',
    '27 yo G3P2 at 30 weeks, syncope',
  ]) {
    const r = triage(hpi);
    assert.notEqual(r.top && r.top.id, 'ANT-TRAUMA', hpi);
  }
});

test('non-pregnant fall or postpartum-only MVA does not open ANT-TRAUMA', () => {
  const nonpreg = triage('40 yo woman, not pregnant, after a fall');
  assert.notEqual(nonpreg.top && nonpreg.top.id, 'ANT-TRAUMA');
  const pp = triage('27 yo G3P2, 2 days postpartum, after an MVA, stable');
  assert.notEqual(pp.top && pp.top.id, 'ANT-TRAUMA', 'postpartum-only should not use the pregnancy trauma card');
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

test('Browse Guidelines lists Trauma in pregnancy and opens the card', async () => {
  const t = await open();
  t.click('start-browse');
  assert.ok(t.vis('view-browse'));
  assert.match(t.$('list').textContent, /Trauma in pregnancy/);
  t.$('q').value = 'trauma in pregnancy';
  t.$('q').dispatchEvent(new t.w.Event('input'));
  const btn = [...t.d.querySelectorAll('#list [data-open]')].find(b => /Trauma in pregnancy/i.test(b.textContent));
  assert.ok(btn, 'browse search finds the card');
  btn.click();
  assert.ok(t.vis('result'));
  assert.match(t.$('top').textContent, /Mother first: primary survey/);
  assert.match(t.$('top').textContent, /PROVISIONAL/);
  assert.deepEqual(t.errors, []);
  t.close();
});

test('HPI triage of a fall in pregnancy shows the ANT-TRAUMA card', async () => {
  const t = await open();
  t.click('start-clinician');
  t.$('hpi').value = '28 yo G2P1 at 28 weeks after a fall down stairs, stable, no bleeding';
  t.click('go');
  assert.ok(t.vis('result'));
  assert.match(t.$('top').textContent, /Trauma in pregnancy/);
  assert.match(t.$('top').textContent, /RhIG 300 mcg IM/);
  assert.match(t.$('flags').textContent + t.$('top').textContent, /PROVISIONAL|pharmacy/i);
  assert.deepEqual(t.errors, []);
  t.close();
});

test('routes to ANT-TRAUMA: OBED walk-in after strangulation', () => {
  const r = triage('25 yo G1 at 24 weeks, strangulation by partner, walked into OBED');
  assert.ok(r.top);
  assert.equal(r.top.id, 'ANT-TRAUMA');
  assert.equal(r.top.diagram && r.top.diagram.id, 'FD-ANT-TRAUMA');
  assert.match(r.top.card.html, /1-800-799-7233/);
  assert.match(r.top.card.html, /Pending house decision/);
  assert.match(r.top.diagram.html, /OBED walk-in/);
});
