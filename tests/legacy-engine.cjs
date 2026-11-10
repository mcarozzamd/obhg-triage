// node tests/run_tests.js — runs every sample one-liner through the engine and checks the expected top match.
global.self = global;
const path = require('path'), R = p => require(path.join(__dirname, '..', p));
const C = R('js/content.js'), T = R('codes/code_tables.js'), V = R('codes/validation.js'), E = R('js/engine.js');
const cases = R('tests/cases.json');
let pass = 0; const fails = [];
for (const c of cases) {
  const r = E.triage(c.hpi, C, T, V);
  const top = r.top && r.top.id;
  let ok = c.notTop ? (!!top && top !== c.notTop) : top === c.top;
  if (ok && c.alsoIncludes) ok = r.alternates.some(a => a.id === c.alsoIncludes);
  // flow-diagram expectations: the top result (and optionally a named alternate) must carry the tree
  if (ok && c.diagram) ok = !!(r.top.diagram && r.top.diagram.id === c.diagram);
  if (ok && c.altDiagram) { const [aid, did] = c.altDiagram.split(':'); const alt = r.alternates.find(a => a.id === aid); ok = !!(alt && alt.diagram && alt.diagram.id === did); }
  // every top match must resolve to displayable content
  if (ok && !(r.top.diagram || r.top.card)) ok = false;
  // every suggested ICD must be CMS-verified
  const unv = (r.coding ? r.coding.icd : []).filter(x => !x.verified).map(x => x.code);
  if (unv.length) ok = false;
  if (ok) pass++; else fails.push({ hpi: c.hpi, expected: c.top, got: top, diagram: r.top && r.top.diagram ? r.top.diagram.id : null, alts: r.alternates.map(a => a.id), unverified: unv, why: r.top && r.top.why });
  console.log((ok ? 'PASS ' : 'FAIL ') + (top || '-').padEnd(8) + ' ' + c.hpi);
}
console.log(`\n${pass}/${cases.length} passed`);
if (fails.length) { console.log(JSON.stringify(fails, null, 1)); process.exit(1); }
