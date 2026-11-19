// Guard: Clinician "Ask a question" link-out (online only) and "Suggest a card" in Clinician + Nurse (15 Nov 2026). Synthetic inputs only.
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('fs'), path = require('path');
const {JSDOM} = require('jsdom');
const root = path.resolve(__dirname, '..');
const A = require('../js/ask.js');
const askSrc = fs.readFileSync(path.join(root, 'js/ask.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const nurse = fs.readFileSync(path.join(root, 'nurse.html'), 'utf8');

function clinician(onLine) {
  const body = index.slice(index.indexOf('<section id="ask-box"'), index.indexOf('</section>', index.indexOf('<section id="ask-box"')) + 10);
  const dom = new JSDOM('<!doctype html><body>' + body + '</body>', {runScripts: 'outside-only'});
  const w = dom.window, opened = [];
  Object.defineProperty(w.navigator, 'onLine', {configurable: true, get: () => onLine.value});
  w.open = (u, t, f) => { opened.push([u, t, f]); return {}; };
  w.TriageEngine = {privacyCheck: t => /\bMRN\b/.test(t) ? ['MRN'] : []};
  w.eval(askSrc);
  return {w, d: w.document, opened};
}

test('ask box: placement, placeholder, disclaimer, no names or reviewed-by text', () => {
  assert.match(index, /<section id="ask-box" class="box ask"[\s\S]*?<\/section>/);
  const box = index.match(/<section id="ask-box"[\s\S]*?<\/section>/)[0];
  assert.ok(index.indexOf('id="view-triage"') < index.indexOf('id="ask-box"') && index.indexOf('id="ask-box"') < index.indexOf('id="view-browse"'), 'ask box is in the Clinician section');
  assert.match(box, /placeholder="e\.g\. methamphetamine withdrawal in the third trimester"/);
  assert.match(box, /Outside resource, not unit policy\./);
  assert.doesNotMatch((box + askSrc).replace(/mcarozza@obhg\.com/g, ''), /Michael|Carozza|reviewed by/i);
  assert.match(index, /<script src="js\/ask\.js"><\/script>/);
  assert.match(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), /'\.\/js\/ask\.js'/);
});

test('ask URLs: Grok gets a prefilled ?q=, OpenEvidence opens its homepage (no prefill URL)', () => {
  assert.equal(A.grokURL('methamphetamine withdrawal in the third trimester'), 'https://grok.com/?q=methamphetamine%20withdrawal%20in%20the%20third%20trimester');
  assert.equal(A.grokURL('  '), 'https://grok.com/');
  assert.equal(A.openEvidenceURL('anything'), 'https://www.openevidence.com/');
});

test('online: both buttons enabled; OpenEvidence opens in a new tab; Grok opens prefilled in a new tab', () => {
  const on = {value: true}, {d, opened} = clinician(on);
  assert.equal(d.getElementById('ask-oe').disabled, false);
  assert.equal(d.getElementById('ask-grok').hidden, false);
  d.getElementById('ask-q').value = 'methamphetamine withdrawal in the third trimester';
  d.getElementById('ask-oe').click(); d.getElementById('ask-grok').click();
  assert.deepEqual(opened.map(o => o[0]), ['https://www.openevidence.com/', 'https://grok.com/?q=methamphetamine%20withdrawal%20in%20the%20third%20trimester']);
  assert.ok(opened.every(o => o[1] === '_blank' && /noopener/.test(o[2])));
});

test('offline: button shows the needs-internet message, is disabled, and nothing opens', () => {
  const on = {value: false}, {w, d, opened} = clinician(on);
  const b = d.getElementById('ask-oe');
  assert.equal(b.textContent, 'Needs internet. Use the cards or call the on-call provider.');
  assert.equal(b.disabled, true); assert.equal(d.getElementById('ask-grok').hidden, true);
  d.getElementById('ask-q').value = 'x'; b.click(); d.getElementById('ask-grok').click();
  assert.equal(opened.length, 0);
  on.value = true; w.dispatchEvent(new w.Event('online'));
  assert.equal(b.disabled, false); assert.equal(b.textContent, 'Ask OpenEvidence (copies question)');
  on.value = false; w.dispatchEvent(new w.Event('offline'));
  assert.equal(b.textContent, A.OFFLINE);
});

test('identifiers block the lookup', () => {
  const {d, opened} = clinician({value: true});
  d.getElementById('ask-q').value = 'MRN 12345 question'; d.getElementById('ask-grok').click();
  assert.equal(opened.length, 0); assert.match(d.getElementById('ask-status').textContent, /identifiers/);
});

test('suggest a card: Clinician mailto carries the subject and the typed topic', () => {
  const {w, d} = clinician({value: true});
  const a = d.getElementById('ask-suggest');
  assert.equal(a.textContent, "Can't find it? Suggest a card");
  d.getElementById('ask-q').value = 'meth withdrawal'; d.getElementById('ask-q').dispatchEvent(new w.Event('input'));
  assert.match(a.href, /^mailto:\?subject=Triage%20app%20card%20suggestion&body=/);
  assert.match(decodeURIComponent(a.href), /meth withdrawal$/);
});

test('nurse: suggest-a-card link only (no AI button); English and Spanish text, never mixed', () => {
  assert.match(nurse, /id="nurse-suggest"/);
  assert.doesNotMatch(nurse, /ask-oe|ask-grok|openevidence|grok/i);
  const ui = fs.readFileSync(path.join(root, 'js/nurse-ui.js'), 'utf8');
  assert.doesNotMatch(ui, /openevidence|grok\.com/i);
  assert.equal(A.SUGGEST_TEXT.en.link, "Can't find it? Suggest a card");
  assert.equal(A.SUGGEST_TEXT.es.link, '¿No lo encuentra? Sugiera una tarjeta');
  assert.doesNotMatch(A.SUGGEST_TEXT.en.link + A.SUGGEST_TEXT.en.body, /[¿¡ñáéíóú]/);
  assert.match(decodeURIComponent(A.suggestMailto('es', '')), /Tema sugerido/);
  assert.match(A.suggestMailto('es', ''), /subject=Triage%20app%20card%20suggestion/);
});
