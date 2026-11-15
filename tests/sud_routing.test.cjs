// ANT-SUD routing, house practices, and algorithm (15 Nov 2026). Synthetic HPIs only; no holdout/blind files.
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
const card = C.items.find(i => i.id === 'ANT-SUD');
const flow = C.items.find(i => i.id === 'FD-ANT-SUD');
const plain = h => h.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

test('ANT-SUD card and algorithm are present, released, with no draft text or personal names', () => {
  assert.ok(card && flow);
  assert.equal(card.kind, 'card');
  assert.equal(flow.kind, 'diagram');
  assert.equal(flow.card, 'ANT-SUD');
  assert.equal(card.lastReviewed, 'Nov 2026');
  for (const it of [card, flow]) {
    assert.deepEqual(it.flags, []);
    assert.doesNotMatch(it.html + it.text + it.source, /PROVISIONAL|DRAFT|v0\.1|Michael|Carozza|reviewed by|pending|UNVERIFIED|re-verify|house decision #|\bconfirm\)|house — confirm|policy to confirm|legal to confirm|TEST site/i);
  }
  assert.doesNotMatch(card.source + flow.source, /_DRAFT_|\/drafts\//);
  assert.equal((card.html.match(/Doses to be checked against CSM pharmacy build\./g) || []).length, 1);
  assert.doesNotMatch(card.html, /ROUTING NOTES/);
  assert.equal(D.title('ANT-SUD'), 'Substance use in pregnancy');
  assert.equal(D.title('FD-ANT-SUD'), 'Substance use in pregnancy');
});

test('house practices: consent-only UDS, labetalol first-line, OBED buprenorphine start, alcohol withdrawal admitted', () => {
  const h = plain(card.html + ' ' + flow.html);
  assert.match(h, /House practice:\s*urine drug testing \(UDS\) only for a clinical question and only with informed consent/i);
  assert.match(h, /GC\/MS or LC-MS\/MS/);
  assert.match(h, /labetalol first-line/i);
  assert.match(h, /never a pure beta-blocker|No pure beta-blockers/i);
  assert.match(h, /House practice: OBED may start buprenorphine/);
  assert.match(h, /Fentanyl[^.]*low-dose[^.]*ADMIT/i);
  assert.match(h, /any pregnant patient in alcohol withdrawal (is admitted|→ ADMIT)/i);
  assert.match(h, /NST on presentation/);
  assert.match(h, /EHR allergy\/intolerance field/);
  assert.match(h, /consult case management for hospital and community policy/i);
  assert.match(h, /ECG\/QTc first/);
  assert.doesNotMatch(h, /Uncertain point #2|hydralazine or nifedipine first/i);
});

test('doses live only in the DOSES section of the card; the algorithm lists none', () => {
  const doseRe = /\b\d[\d,.]*\s*(mg|mcg|µg|ug|g|mL|ml)\b/i;
  const a = card.html.search(/<p[^>]*>DOSES \(/), b = card.html.search(/<p[^>]*><strong>CODING/);
  assert.ok(a > 0 && b > a);
  assert.doesNotMatch(card.html.slice(0, a) + card.html.slice(b), doseRe);
  assert.match(card.html.slice(a, b), /Naloxone IV/);
  assert.doesNotMatch(flow.html + ' ' + flow.text, doseRe);
  assert.match(flow.html, /see ANT-SUD card/);
});

test('algorithm has the In labor / admitted vs OB ED triage start, with assets cached', () => {
  assert.match(flow.html, /data-cue="sud-entry"/);
  assert.match(flow.html, /data-sud-entry="labor">In labor \/ admitted</);
  assert.match(flow.html, /data-sud-entry="triage">OB ED triage</);
  assert.match(flow.html, /data-sud-path="labor"/);
  assert.match(flow.html, /data-sud-path="triage"/);
  assert.ok(fs.existsSync(path.join(base, flow.img)));
  assert.ok(fs.existsSync(path.join(base, 'assets/display-diagrams/FD-ANT-SUD.png')));
  const sw = fs.readFileSync(path.join(base, 'sw.js'), 'utf8');
  assert.ok(sw.includes('v39-2026-11-15-jump-test'));
  assert.ok(sw.includes('./assets/display-diagrams/FD-ANT-SUD.png'));
  const fc = fs.readFileSync(path.join(base, 'js/flow-cues.js'), 'utf8');
  assert.match(fc, /data-cue="sud-entry"/);
});

test('cards link both ways and Open: buttons point to existing items', () => {
  assert.match(card.html, /data-open="FD-ANT-SUD"/);
  assert.match(flow.html, /data-open="ANT-SUD"/);
  const ids = new Set(C.items.map(i => i.id));
  for (const it of [card, flow]) for (const m of it.html.matchAll(/data-open="([^"]+)"/g)) assert.ok(ids.has(m[1]), m[1]);
});

test('severe BP with positive amphetamine screen: ANT-04 on top, ANT-SUD offered', () => {
  const r = triage('34 wk, BP 172/108, positive amphetamine screen');
  assert.equal(r.top.id, 'ANT-04');
  assert.ok(offered(r, 'ANT-SUD'));
});

const routes = [
  ['28 yo G2P1 in labor at 39 weeks, on buprenorphine 16 mg, wants epidural', 'labor on buprenorphine'],
  ['26 yo G1 at 32 weeks with methamphetamine withdrawal, sleeping all day', 'meth withdrawal'],
  ['30 yo G3P2 at 24 weeks, uses fentanyl, wants to start Suboxone', 'fentanyl, wants buprenorphine'],
  ['G2 at 30 weeks, alcohol withdrawal, tremor, CIWA 14', 'alcohol withdrawal'],
  ['postpartum day 2, on methadone, pain control', 'postpartum methadone'],
  ['G2 at 36 weeks, cocaine use today, abdominal pain and vaginal bleeding', 'cocaine + bleeding'],
];
for (const [hpi, label] of routes) {
  test('routes to ANT-SUD: ' + label, () => {
    const r = triage(hpi);
    assert.equal(r.top && r.top.id, 'ANT-SUD', hpi + ' → ' + (r.top && r.top.id));
  });
}

test('cannabis with cyclic vomiting: ANT-SUD with ANT-08 as first alternate', () => {
  const r = triage('G1 at 18 weeks, daily cannabis, cyclic vomiting, relief with hot showers');
  assert.equal(r.top.id, 'ANT-SUD');
  assert.equal(r.alternates[0] && r.alternates[0].id, 'ANT-08');
});

test('epidural fentanyl in labor and non-pregnant alcohol withdrawal do not open ANT-SUD', () => {
  assert.equal(offered(triage('G1P0 at 39 weeks in labor, epidural with fentanyl, wants to push'), 'ANT-SUD'), false);
  assert.equal(offered(triage('32 yo nonpregnant woman with alcohol withdrawal'), 'ANT-SUD'), false);
});

test('v39: section jump boxes on ANT-SUD and ANT-UTI, built by the reusable FlowCues.mountJumpNav', () => {
  const uti = C.items.find(i => i.id === 'ANT-UTI');
  for (const [it, n] of [[card, 20], [uti, 16]]) {
    assert.equal((it.html.match(/data-cue="jump-nav"/g) || []).length, 1, it.id);
    assert.equal((it.html.match(/data-jump-label="/g) || []).length, n, it.id);
    assert.match(it.html, /<p data-jump-label="Doses">DOSES \(/);
    assert.ok(it.html.indexOf('data-cue="jump-nav"') < it.html.indexOf('Scope:'), 'boxes sit at the top of ' + it.id);
  }
  const others = C.items.filter(i => i.html && /data-cue="jump-nav"/.test(i.html)).map(i => i.id).sort();
  assert.deepEqual(others, ['ANT-SUD', 'ANT-UTI']);
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM('<div id="top"><div class="cardtext">' + card.html + '</div></div>');
  const FC = require(base + '/js/flow-cues.js');
  const scrolled = [];
  dom.window.HTMLElement.prototype.scrollIntoView = function () { scrolled.push(this.getAttribute('data-jump-label') || this.className); };
  FC.mountJumpNav(dom.window.document.getElementById('top'));
  FC.mountJumpNav(dom.window.document.getElementById('top'));
  const btns = [...dom.window.document.querySelectorAll('.jumpbtn')];
  assert.equal(btns.length, 20, 'idempotent: one set of boxes');
  assert.equal(btns[0].textContent, 'Bottom line');
  btns.find(b => b.textContent === 'Doses').click();
  assert.deepEqual(scrolled, ['Doses']);
  dom.window.document.querySelector('[data-jump-label="Doses"] .jumptop').click();
  assert.equal(scrolled[1], 'jumpnav');
});

test('v39: UTI and SUD algorithm titles no longer say "what to do now"', () => {
  for (const id of ['FD-ANT-UTI', 'FD-ANT-SUD']) {
    const it = C.items.find(i => i.id === id);
    assert.doesNotMatch(it.title + D.title(id), /what to do now/i);
  }
  const uti = C.items.find(i => i.id === 'ANT-UTI');
  assert.doesNotMatch(card.html + uti.html, /what to do now/i);
  assert.match(card.html, /Open: Substance use in pregnancy algorithm/);
  assert.match(uti.html, /Open: UTI and pyelonephritis in pregnancy algorithm/);
});
