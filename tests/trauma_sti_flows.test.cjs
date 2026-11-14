'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.join(__dirname, '..');
global.self = global;
const C = require('../js/content.js');
const REVIEW = require('../js/review.js');
const D = require('../js/display-names.js');
const E = require('../js/engine.js');
const FlowCues = require('../js/flow-cues.js');
const tables = require('../codes/code_tables.js');
const validation = require('../codes/validation.js');

const trauma = C.items.find(i => i.id === 'FD-ANT-TRAUMA');
const sti = C.items.find(i => i.id === 'FD-ANT-STI');
const traumaCard = C.items.find(i => i.id === 'ANT-TRAUMA');
const stiCard = C.items.find(i => i.id === 'ANT-STI');

function flowText(item) {
  return (item.html || '') + '\n' + (item.text || '');
}

test('both flow records exist, are released (no provisional tag), and point at their cards', () => {
  assert.ok(trauma && sti);
  assert.equal(trauma.kind, 'diagram');
  assert.equal(sti.kind, 'diagram');
  assert.equal(trauma.card, 'ANT-TRAUMA');
  assert.equal(sti.card, 'ANT-STI');
  assert.equal(trauma.algorithm_id, 'ALG-ANT-TRAUMA');
  assert.equal(sti.algorithm_id, 'ALG-ANT-STI');
  assert.deepEqual(trauma.topics, ['ANT-TRAUMA']);
  assert.deepEqual(sti.topics, ['ANT-STI']);
  for (const it of [trauma, sti]) {
    assert.ok(!it.flags.some(f => /PROVISIONAL|Michael|Carozza/i.test(f)));
    assert.doesNotMatch(it.html + it.text, /PROVISIONAL|Michael|Carozza|Not live|Doc's draft/i);
    assert.doesNotMatch(it.lastReviewed || '', /Provisional/i);
  }
});

test('cards and algorithms link both ways, using the display names', () => {
  assert.match(traumaCard.html, /data-open="FD-ANT-TRAUMA">Open: Trauma in pregnancy: evaluate, monitor, decide</);
  assert.match(stiCard.html, /data-open="FD-ANT-STI">Open: STIs on labor and delivery: what to do now</);
  assert.match(trauma.html, /data-open="ANT-TRAUMA">Open companion card: Trauma in pregnancy</);
  assert.match(sti.html, /data-open="ANT-STI">Open companion card: STIs on Labor and Delivery</);
  assert.equal(D.title('FD-ANT-TRAUMA'), 'Trauma in pregnancy: evaluate, monitor, decide');
  assert.equal(D.title('FD-ANT-STI'), 'STIs on labor and delivery: what to do now');
});

test('engine attaches each algorithm when its card is the top match', () => {
  const t = E.triage('28 yo G2P1 at 28 weeks after a fall down stairs, stable, no bleeding', C, tables, validation);
  assert.equal(t.top.id, 'ANT-TRAUMA');
  assert.equal(t.top.diagram && t.top.diagram.id, 'FD-ANT-TRAUMA');
  assert.equal(t.top.card && t.top.card.id, 'ANT-TRAUMA');
  const s = E.triage('28 yo G2P1 at 38 weeks, syphilis status unknown, no RPR on file', C, tables, validation);
  assert.equal(s.top.id, 'ANT-STI');
  assert.equal(s.top.diagram && s.top.diagram.id, 'FD-ANT-STI');
});

test('trauma flow includes every Doc node, viability per local policy, and a cue-only timer', () => {
  const t = flowText(trauma);
  assert.match(t, /Is the mother unstable/i);
  assert.match(t, /SBP &lt;90|SBP <90/);
  assert.match(t, /HR &gt;120|HR >120/);
  assert.match(t, /altered mental status/i);
  assert.match(t, /high-energy mechanism/i);
  assert.match(t, /penetrating injury/i);
  assert.match(t, /Trauma team or ED primary/i);
  assert.match(t, /Left uterine displacement if 20 weeks or more/i);
  assert.match(t, /type and crossmatch/i);
  assert.match(t, /EFM only once the mother is stabilized/i);
  assert.match(t, /Stop here/i);
  assert.match(t, /Gestational age/i);
  assert.match(t, /Under 20 weeks/i);
  assert.match(t, /Doppler FHT/i);
  assert.match(t, /per local policy/i);
  assert.match(t, /20 weeks to under the local viability cutoff/i);
  assert.match(t, /EFM and toco for at least 4–6 hours/i);
  assert.match(t, /extended-monitoring criterion/i);
  assert.match(t, /Contractions 1 or more per 10 minutes/i);
  assert.match(t, /extend to 24 hours/i);
  assert.match(t, /coags and fibrinogen/i);
  assert.match(t, /data-open="ANT-02"/);
  assert.match(t, /data-open="PP-01"/);
  assert.match(t, /Steroids and Mg per gestational age/i);
  assert.match(t, /discharge with abruption precautions/i);
  assert.match(t, /Rh-negative/i);
  assert.match(t, /RhIG within 72 hours/i);
  assert.match(t, /dose on the card/i);
  assert.match(t, /Rh-positive/i);
  assert.match(t, /no RhIG/i);
  assert.match(t, /Private IPV screen/i);
  assert.match(t, /previa before any digital exam/i);
  assert.match(t, /does not rule out abruption/i);
  assert.match(t, /cue only, not a documented time/i);
  assert.match(t, /data-cue="trauma-timer"/);
});

test('STI flow starts with an entry choice and a filled OB ED triage branch', () => {
  const t = flowText(sti);
  assert.match(t, /In labor \/ admitted/);
  assert.match(t, /OB ED triage/);
  assert.match(sti.html, /data-sti-entry="labor"/);
  assert.match(sti.html, /data-sti-entry="triage"/);
  const triage = (sti.html.match(/data-sti-path="triage">([\s\S]*?)<\/div>/) || [])[1] || '';
  assert.doesNotMatch(triage, /No triage steps on this chart yet/i);
  assert.match(triage, /ectopic and septic abortion outrank/i);
  assert.match(triage, /Vaginal discharge \/ itching/i);
  assert.match(triage, /always treat, including an incidental finding/i);
  assert.match(triage, /ADMIT as an inpatient/i);
  assert.match(triage, /SMFM Consult #69, vaccine plus HBIG within 12 h/);
  assert.match(triage, /House practice \(not a cited rule\)/);
  assert.doesNotMatch(triage, /Pending house decision/);
  assert.match(triage, /regimen per ID\/pharmacy/);
  assert.doesNotMatch(triage, /Pending house decision\s+HIV test/);
  assert.doesNotMatch(triage, /Pending house decision\s+Postpartum endometritis/);
  assert.doesNotMatch(triage, /oral therapy 7–10 days/);
  assert.doesNotMatch(triage, /treat 5–7 days \(fosfomycin single-dose/);
  assert.doesNotMatch(triage, /14 days total/);
  assert.match(triage, /first-episode HSV — see ANT-STI card/);
  assert.match(triage, /ASB → see ANT-STI card/);
  assert.match(triage, /Pyelonephritis → ADMIT as an inpatient for IV antibiotics and hydration; see ANT-STI card/);
});

test('STI flow is a router with the stated hard stops and peds handoff', () => {
  const t = flowText(sti);
  assert.match(t, /Admission status check/i);
  assert.match(t, /Syphilis, HIV and HBsAg must be known/i);
  assert.match(t, /Anything unknown gets ordered now/i);
  assert.match(t, /Hard stops/i);
  assert.match(t, /Active genital HSV lesions or prodrome, or ROM with lesions: cesarean/i);
  assert.match(t, /HIV reactive or unknown with risk, or viral load over 1,000 or unknown: IV ZDV/i);
  assert.match(t, /HIV card \/ HHS guidance for mode of delivery/i);
  assert.match(t, /Treat before discharge/i);
  assert.match(t, /delivery mode unchanged/i);
  assert.match(t, /benzathine penicillin by stage/i);
  assert.match(t, /Desensitize if she is allergic/i);
  assert.match(t, /treatment per the card/i);
  assert.match(t, /untreated GC/i);
  assert.match(t, /Order EPT/i);
  assert.match(t, /Can wait until postpartum or routine care/i);
  assert.match(t, /Fluconazole only after delivery/i);
  assert.match(t, /Peds handoff/i);
  assert.match(t, /primary vs recurrent/i);
  assert.match(t, /data-cue="sti-router"/);
});

test('flow nodes do not duplicate dose text; doses stay on the cards', () => {
  const dose = /\b\d[\d,]*\s*(?:mcg|µg|ug|mg|g|mL|ml|units?)\b|\bmillion units\b/i;
  for (const [name, item] of [['trauma', trauma], ['sti', sti]]) {
    const hit = flowText(item).match(dose);
    assert.equal(hit, null, name + ' flow has dose text: ' + (hit && hit[0]));
  }
  // PDFs too
  for (const pdf of ['build/ANT-TRAUMA_FLOW_2026-11-13.pdf', 'build/ANT-STI_FLOW_2026-11-13.pdf']) {
    const txt = execFileSync('pdftotext', ['-layout', path.join(root, pdf), '-'], { encoding: 'utf8' });
    const hit = txt.match(dose);
    assert.equal(hit, null, pdf + ' has dose text: ' + (hit && hit[0]));
  }
  assert.match(traumaCard.html, /RhIG 300 mcg/);
  assert.match(stiCard.html, /benzathine penicillin/i);
});

test('STI hard stops: lesions, prodrome, or ROM with lesions means cesarean', () => {
  assert.deepEqual(FlowCues.hardStops({ hsvLesions: true }), { cesarean: true, ivZdv: false, pointsToHivCard: false });
  assert.deepEqual(FlowCues.hardStops({ hsvProdrome: true }), { cesarean: true, ivZdv: false, pointsToHivCard: false });
  assert.deepEqual(FlowCues.hardStops({ romWithLesions: true }), { cesarean: true, ivZdv: false, pointsToHivCard: false });
  assert.equal(FlowCues.hardStops({}).cesarean, false);
});

test('STI hard stops: HIV reactive or unknown, or viral load >1000 or unknown, means IV ZDV and points to the HIV card', () => {
  for (const flags of [
    { hivReactive: true },
    { hivUnknownWithRisk: true },
    { viralLoadOver1000: true },
    { viralLoadUnknown: true }
  ]) {
    assert.deepEqual(FlowCues.hardStops(flags), { cesarean: false, ivZdv: true, pointsToHivCard: true }, flags);
  }
  const both = FlowCues.hardStops({ hsvLesions: true, viralLoadOver1000: true });
  assert.deepEqual(both, { cesarean: true, ivZdv: true, pointsToHivCard: true });
});

test('peds handoff auto-lists whatever was flagged', () => {
  assert.deepEqual(FlowCues.pedsHandoff({}), []);
  assert.deepEqual(
    FlowCues.pedsHandoff({ syphilis: true, hsvPrimary: true, untreatedGc: true, hbsag: true, hiv: true }),
    ['syphilis', 'HSV (primary)', 'untreated GC', 'HBsAg status', 'HIV']
  );
  assert.deepEqual(FlowCues.pedsHandoff({ hsvRecurrent: true }), ['HSV (recurrent)']);
});

test('trauma timer is a cue only and does not write storage', () => {
  const now = Date.parse('2026-11-13T10:00:00-06:00');
  const idle = FlowCues.timerStatus(now, null);
  assert.equal(idle.running, false);
  const mid = FlowCues.timerStatus(now, now - 30 * 60 * 1000);
  assert.equal(mid.running, true);
  assert.ok(mid.remain4 > 0 && mid.remain6 > mid.remain4);
  assert.match(mid.text, /cue only/i);
  assert.match(mid.startLabel, /CT$/);
  const past = FlowCues.timerStatus(now, now - 7 * 60 * 60 * 1000);
  assert.match(past.text, /Past the 4–6 h monitoring window/);
  FlowCues.startTimer(now);
  assert.equal(FlowCues.storageUsed(), false);
  FlowCues.clearTimer();
  assert.equal(FlowCues.storageUsed(), false);
  const src = fs.readFileSync(path.join(root, 'js/flow-cues.js'), 'utf8');
  assert.doesNotMatch(src, /localStorage\.(setItem|set)\s*\(/);
  assert.doesNotMatch(src, /sessionStorage/);
});

test('trauma flow has an OBED walk-in node; no pending tags', () => {
  const t = flowText(trauma);
  assert.match(t, /OBED walk-in \/ delayed presentation/);
  assert.match(t, /strangulation/);
  assert.match(t, /1-800-799-7233/);
  assert.doesNotMatch(t, /Pending house decision/);
  assert.doesNotMatch(t, /300 mcg/);
  const card = traumaCard.html;
  assert.match(card, /OBED TRIAGE NOTE/);
  assert.match(card, /still evaluate fully/i);
});

test('algorithm images exist, display copies are precached, and index loads the cue module', () => {
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const it of [trauma, sti]) {
    assert.ok(fs.existsSync(path.join(root, it.img)), it.id);
    assert.ok(fs.existsSync(path.join(root, 'assets/display-diagrams/' + it.id + '.png')), it.id);
    assert.ok(sw.includes('./assets/display-diagrams/' + it.id + '.png'), it.id);
  }
  assert.ok(sw.includes('v34-2026-11-14-release'));
  assert.ok(sw.includes('./js/flow-cues.js'));
  assert.match(html, /js\/flow-cues\.js/);
});

test('v34 release cleanup: no personal approval names or internal review flags in served app files', () => {
  const files = ['index.html', 'nurse.html', 'sw.js', 'routine_codes.json', 'DISPLAY_TITLE_MAPPING.json'].concat(
    fs.readdirSync(path.join(root, 'js')).filter(f => /\.js$/.test(f)).map(f => 'js/' + f),
    fs.readdirSync(path.join(root, 'css')).filter(f => /\.css$/.test(f)).map(f => 'css/' + f));
  for (const f of files) {
    const s = fs.readFileSync(path.join(root, f), 'utf8').replace(/St\. Michael|ST\. MICHAEL/g, '');
    assert.doesNotMatch(s, /Michael|Carozza/, f);
    assert.doesNotMatch(s, /PENDING DOC REVIEW|pending Doc review|UNVERIFIED\)|re-verify against full text|before card goes live|verify citation numbers|_DRAFT_|PENDING MICHAEL/, f);
  }
});
