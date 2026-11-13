// Start page + section routing (13 Nov 2026). Synthetic only; no holdout/blind files.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), {execFileSync} = require('node:child_process');
const {JSDOM, requestInterceptor, VirtualConsole} = require('jsdom');
const base = path.resolve(__dirname, '../..');
const mime = {'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webmanifest':'application/manifest+json'};
let server, origin;
test.before(async () => {
  server = http.createServer((req, res) => { const p = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\//, '') || 'index.html'; const f = path.join(base, p); if (!f.startsWith(base + '/')) { res.writeHead(403).end(); return; } try { res.setHeader('Content-Type', mime[path.extname(f)] || 'application/octet-stream'); res.end(fs.readFileSync(f)); } catch { res.writeHead(404).end(); } });
  await new Promise(r => server.listen(0, '127.0.0.1', r)); origin = 'http://127.0.0.1:' + server.address().port;
});
test.after(() => server.close());
async function open(hash = '', pre = {}) {
  const errors = []; const vc = new VirtualConsole(); vc.on('jsdomError', e => errors.push(e.message)); vc.on('error', e => errors.push(String(e)));
  const dom = await JSDOM.fromURL(origin + '/' + hash, {runScripts: 'dangerously', virtualConsole: vc, resources: {interceptors: [requestInterceptor(req => req.url.startsWith(origin + '/') ? undefined : new Response('', {headers: {'Content-Type': 'application/javascript'}}))]},
    beforeParse(w) { w.HTMLElement.prototype.scrollIntoView = function () {}; w.confirm = () => true; for (const [k, v] of Object.entries(pre)) w.localStorage.setItem(k, v); }});
  if (dom.window.document.readyState !== 'complete') await new Promise(r => dom.window.addEventListener('load', r, {once: true}));
  const w = dom.window, d = w.document, $ = id => d.getElementById(id);
  const vis = id => { let e = $(id); while (e) { if (e.hidden) return false; e = e.parentElement; } return true; };
  return {w, d, $, vis, errors, click: id => $(id).click(), close: () => w.close()};
}
const VIEWS = ['view-start', 'view-triage', 'view-browse', 'view-log'];
const only = (t, id) => { for (const v of VIEWS) assert.equal(t.vis(v), v === id, v + (v === id ? ' should be visible' : ' should be hidden')); };

test('fresh open shows only the start page with four large choices, disclaimer and no section bar', async () => {
  const t = await open(); only(t, 'view-start'); assert.equal(t.vis('section-bar'), false);
  const tiles = [...t.d.querySelectorAll('#view-start .start-tile')];
  assert.deepEqual(tiles.map(x => x.querySelector('.st-name').textContent), ['Clinician', 'Nurse', 'Browse Guidelines', 'Patient log']);
  assert.deepEqual(tiles.map(x => x.id), ['start-clinician', 'start-nurse', 'start-browse', 'start-log']);
  assert.equal(t.$('start-nurse').tagName, 'A'); assert.equal(t.$('start-nurse').getAttribute('href'), 'nurse.html');
  assert.match(t.$('view-start').textContent, /Decision support only · not unit policy · not the medical record · enter no PHI\./);
  assert.equal(t.d.querySelector('.tabs, [role=tablist], .nurse-link'), null, 'old tab bar and small nurse link removed');
  assert.deepEqual(t.errors, []); t.close();
});
test('Clinician opens only the clinician triage view; HPI triage still works; Start returns', async () => {
  const t = await open(); t.click('start-clinician');
  only(t, 'view-triage'); assert.ok(t.vis('hpi-form')); assert.ok(t.vis('section-bar')); assert.equal(t.$('section-title').textContent, 'Clinician triage');
  assert.equal(t.w.location.hash, '#clinician'); assert.equal(t.vis('sec-back'), false);
  t.$('hpi').value = '22 yo G1P0 at 32 weeks with leaking fluid since this morning'; t.click('go');
  assert.ok(t.vis('result')); assert.ok(t.$('top').textContent.length > 50); assert.ok(t.$('coding').textContent.length > 0);
  t.click('go-start'); only(t, 'view-start'); assert.equal(t.w.location.hash, ''); assert.equal(t.vis('section-bar'), false);
  assert.ok(t.$('start-clinician').classList.contains('last')); assert.match(t.$('start-clinician').textContent, /Last used/);
  assert.deepEqual(t.errors, []); t.close();
});
test('Browse Guidelines: list and search; an opened card shows without the HPI form and returns to the list', async () => {
  const t = await open(); t.click('start-browse'); only(t, 'view-browse'); assert.equal(t.$('section-title').textContent, 'Browse guidelines');
  assert.match(t.$('list').textContent, /Flow diagrams/); assert.match(t.$('list').textContent, /OB cards/);
  t.$('q').value = 'magnesium'; t.$('q').dispatchEvent(new t.w.Event('input')); const btn = t.d.querySelector('#list [data-open]'); assert.ok(btn, 'search hit');
  btn.click(); only(t, 'view-triage'); assert.equal(t.vis('hpi-form'), false); assert.ok(t.vis('result')); assert.ok(t.$('top').textContent.length > 50);
  assert.ok(t.vis('sec-back')); assert.equal(t.$('sec-back').textContent, '← Back to guideline list'); assert.equal(t.w.OBHGStart.section(), 'browse');
  t.click('sec-back'); only(t, 'view-browse'); assert.equal(t.vis('sec-back'), false); assert.equal(t.$('q').value, 'magnesium', 'search kept');
  t.click('go-start'); only(t, 'view-start'); assert.deepEqual(t.errors, []); t.close();
});
test('Patient log opens the existing shift patient log (profile prompt first, then log)', async () => {
  const t = await open(); t.click('start-log'); only(t, 'view-log'); assert.equal(t.$('section-title').textContent, 'Patient log');
  assert.ok(t.vis('profile-box'), 'first use asks for the on-device provider profile'); t.close();
  const u = await open('', {shiftlog_profile: JSON.stringify({name: 'Synthetic Provider', site: 'Synthetic Site', title: 'MD', retention: 0})});
  u.click('start-log'); only(u, 'view-log'); assert.ok(u.vis('log-main')); assert.ok(u.vis('lg-add')); assert.ok(u.vis('lg-closeout'));
  assert.equal(u.$('section-title').textContent, 'Patient log'); assert.deepEqual(u.errors, []); u.close();
});
for (const [hash, view, title] of [['#clinician', 'view-triage', 'Clinician triage'], ['#browse', 'view-browse', 'Browse guidelines'], ['#log', 'view-log', 'Patient log']])
  test('deep link ' + hash + ' opens that section directly with a way back to Start', async () => {
    const t = await open(hash); only(t, view); assert.equal(t.$('section-title').textContent, title); assert.ok(t.vis('go-start')); assert.equal(t.$('go-start').textContent, '← Start');
    t.click('go-start'); only(t, 'view-start'); t.close();
  });
test('unknown hash falls back to the start page', async () => { const t = await open('#nope'); only(t, 'view-start'); t.close(); });
test('remembered last choice is only a badge: a fresh open still shows the start page', async () => {
  for (const last of ['log', 'nurse', 'browse', 'clinician']) {
    const t = await open('', {obhg_start_last: last}); only(t, 'view-start');
    const marked = [...t.d.querySelectorAll('.start-tile.last')].map(x => x.id); assert.deepEqual(marked, ['start-' + last]); t.close();
  }
});
test('Nurse tile remembers "nurse" and nurse.html has a Start link back to index.html', async () => {
  const t = await open(); const a = t.$('start-nurse'); a.addEventListener('click', e => e.preventDefault()); a.click();
  assert.equal(t.w.localStorage.getItem('obhg_start_last'), 'nurse'); t.close();
  const html = fs.readFileSync(path.join(base, 'nurse.html'), 'utf8'); assert.match(html, /<a id="nurse-home" class="hdr-home" href="index\.html">← Start<\/a>/);
  assert.doesNotMatch(html, /data-act="lang"/, 'nurse section stays English-only');
});
test('browser history: Back from a section returns to the start page', async () => {
  const t = await open(); t.click('start-browse'); assert.equal(t.w.location.hash, '#browse');
  t.w.history.back(); await new Promise(r => setTimeout(r, 50)); only(t, 'view-start'); t.close();
});
test('start-page shell plus ANT-TRAUMA/ANT-STI card and algorithm files are the only app-path diffs from live 3ae4907', () => {
  const allowed = ['css/app.css', 'index.html', 'js/app.js', 'js/content.js', 'js/display-names.js', 'js/engine.js', 'js/review.js', 'js/flow-cues.js', 'nurse.html', 'sw.js', 'assets/diagrams/ANT-TRAUMA_FLOW_2026-11-13.png', 'assets/diagrams/ANT-STI_FLOW_2026-11-13.png', 'assets/display-diagrams/FD-ANT-TRAUMA.png', 'assets/display-diagrams/FD-ANT-STI.png', 'assets/display-diagrams/FD-ANT-UTI.png', 'assets/diagrams/ANT-UTI_FLOW_2026-11-13.png', 'assets/display-diagrams/manifest.json'];
  const changed = execFileSync('git', ['diff', '--name-only', '3ae4907', '--', 'js', 'css', 'codes', 'assets', 'index.html', 'nurse.html', 'sw.js', 'manifest.webmanifest'], {cwd: base, encoding: 'utf8'}).split('\n').filter(Boolean)
    .concat(execFileSync('git', ['ls-files', '--others', '--exclude-standard', 'js', 'css', 'codes', 'assets'], {cwd: base, encoding: 'utf8'}).split('\n').filter(Boolean));
  assert.deepEqual(changed.sort(), allowed.slice().sort());
  const sw = fs.readFileSync(path.join(base, 'sw.js'), 'utf8'); assert.match(sw, /const CACHE = PREFIX \+ 'v32-2026-11-13-trauma-sti-uti';/);
  const nurseDiff = execFileSync('git', ['diff', '3ae4907', '--', 'nurse.html'], {cwd: base, encoding: 'utf8'}); assert.equal((nurseDiff.match(/^[+-](?![+-])/gm) || []).length, 2, 'nurse.html: only the header line gains the Start link');
});
test('every clinical view element from 3ae4907 is still in index.html (only the tab bar and small nurse link were replaced)', () => {
  const ids = h => new Set([...h.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
  const old = ids(execFileSync('git', ['show', '3ae4907:index.html'], {cwd: base, encoding: 'utf8'})), now = ids(fs.readFileSync(path.join(base, 'index.html'), 'utf8'));
  const missing = [...old].filter(i => !now.has(i)); assert.deepEqual(missing, ['tab-triage', 'tab-browse', 'tab-log']);
});
