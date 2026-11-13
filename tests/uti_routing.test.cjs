// ANT-UTI routing, house practices, and algorithm (13 Nov 2026). Synthetic HPIs only; no holdout/blind files.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const base = path.resolve(__dirname, '..');
global.self = global;
const C = require(base + '/js/content.js');
const E = require(base + '/js/engine.js');
const D = require(base + '/js/display-names.js');
const T = require(base + '/codes/code_tables.js');
const V = require(base + '/codes/validation.js');

function triage(hpi) { return E.triage(hpi, C, T, V); }
function offered(r, id) { return [r.top, ...(r.alternates || [])].some(x => x && x.id === id); }
const card = C.items.find(i => i.id === 'ANT-UTI');
const flow = C.items.find(i => i.id === 'FD-ANT-UTI');

test('ANT-UTI card is present, tagged PROVISIONAL, with a pharmacy line', () => {
  assert.ok(card && flow);
  assert.equal(card.kind, 'card');
  assert.equal(flow.kind, 'diagram');
  assert.equal(flow.card, 'ANT-UTI');
  assert.ok(card.flags.some(f => /PROVISIONAL/i.test(f)));
  assert.ok(flow.flags.some(f => /PROVISIONAL/i.test(f)));
  assert.equal((card.html.match(/Doses to be checked against CSM pharmacy build\./g) || []).length, 1);
  assert.match(card.html, /ALWAYS ADMIT/);
  assert.equal(D.title('ANT-UTI'), 'UTI and pyelonephritis in pregnancy');
  assert.equal(D.title('FD-ANT-UTI'), 'UTI and pyelonephritis in pregnancy: what to do now');
});

test('house practices: routine TOC, postpartum pyelo IV-then-oral, routine suppression after pyelo', () => {
  const h = (card.html + flow.html).replace(/<[^>]+>/g, ' ');
  assert.match(h, /House practice \(Michael\):\s*after treated ASB or cystitis, obtain a routine test-of-cure culture/i);
  assert.match(h, /ACOG and IDSA do not require routine test of cure/i);
  assert.match(h, /House practice \(Michael\):\s*IV dose plus oral therapy with follow-up in 24–48 h/i);
  assert.match(h, /Pregnant pyelo is still always admitted/i);
  assert.match(h, /House practice \(Michael\):\s*routine suppression after a single pyelo/i);
  assert.match(h, /ACOG says ["“]may consider["”]/i);
  assert.doesNotMatch(card.html, /Pending house decision/);
  assert.doesNotMatch(flow.html, /Pending house decision/);
  assert.match(card.html, /Pending full-text re-check \(ACOG CC No\. 4 dose table and 48–72 h window/);
});

test('algorithm has no dose amounts and points treatment to the card', () => {
  const blob = flow.html + ' ' + flow.text;
  assert.doesNotMatch(blob, /\b\d[\d,]*\s*(mg|mcg|µg|ug|g|mL|ml)\b/i);
  assert.match(flow.html, /see ANT-UTI card/);
  assert.match(flow.html, /data-cue="uti-entry"/);
  assert.match(flow.html, /data-uti-path="labor"/);
  assert.match(flow.html, /data-uti-path="triage"/);
  assert.match(flow.html, /ALWAYS ADMIT/);
  assert.ok(fs.existsSync(path.join(base, flow.img)));
  assert.ok(fs.existsSync(path.join(base, 'assets/display-diagrams/FD-ANT-UTI.png')));
  const sw = fs.readFileSync(path.join(base, 'sw.js'), 'utf8');
  assert.ok(sw.includes('v31-2026-11-13-ant-uti'));
  assert.ok(sw.includes('./assets/display-diagrams/FD-ANT-UTI.png'));
});

const routes = [
  ['24 yo G1P0 at 26 weeks with flank pain, CVA tenderness, dysuria', '26-wk flank/dysuria'],
  ['28 yo G3P2 at 30 weeks with dysuria and frequency', 'dysuria'],
  ['31 yo G2P1 at 34 weeks, pyelonephritis, fever and CVA tenderness', 'pyelo'],
  ['30 yo G1P0 postpartum day 5, pyelonephritis', 'postpartum pyelo'],
  ['29 yo G1 at 22 weeks, positive urine culture, asymptomatic bacteriuria', 'ASB'],
];
for (const [hpi, label] of routes) {
  test('routes to ANT-UTI: ' + label, () => {
    const r = triage(hpi);
    assert.equal(r.top && r.top.id, 'ANT-UTI', hpi + ' → ' + (r.top && r.top.id) + ' ' + JSON.stringify((r.ranked || []).slice(0, 4)));
    assert.ok(offered(r, 'ANT-STI'), 'ANT-STI is an alternate for ' + label);
    assert.equal(offered(r, 'GYNB-06'), false, hpi);
  });
}

test('septic 30-wk flank pain stays on SYS-03 with ANT-UTI as the source-card alternate', () => {
  const r = triage('26 yo G1P0 at 30 weeks with temp 38.6, HR 120, RR 26, flank pain');
  assert.equal(r.top.id, 'SYS-03');
  assert.ok(offered(r, 'ANT-UTI'));
  assert.equal(r.alternates[0] && r.alternates[0].id, 'ANT-UTI');
  assert.equal(offered(r, 'GYNB-06'), false);
});

test('non-pregnant pyelo still opens GYNB-06; syphilis still opens ANT-STI', () => {
  const rNP = triage('32 yo nonpregnant woman with flank pain, CVA tenderness, dysuria');
  assert.equal(rNP.top && rNP.top.id, 'GYNB-06');
  const rSti = triage('28 yo G2P1 at 38 weeks, syphilis status unknown, no RPR on file');
  assert.equal(rSti.top && rSti.top.id, 'ANT-STI');
});

test('cards and algorithm link both ways', () => {
  assert.match(card.html, /data-open="FD-ANT-UTI"/);
  assert.match(flow.html, /data-open="ANT-UTI"/);
});
