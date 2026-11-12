// Generates the FD-ANT-05 text companion and the ANT-05 card HTML from js/dm-intrapartum.js (all wording lives in the module).
// Usage: node build/dm_html.js [fd|ant05]. Optional env DM_SWITCHES='{"F1_LOW_61_69":"B"}' renders an alternative for review only.
const base = require('../js/dm-intrapartum.js');
const D = process.env.DM_SWITCHES ? base.create(JSON.parse(process.env.DM_SWITCHES)) : base;
const T = D.TEXT;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const mark = s => esc(s).replace(/(♦ PENDING MICHAEL \([^)]*\)\.?)/g, '<strong class="pending">$1</strong>');
const rows = D.table().map(r => '<tr><td>' + esc(r.band.label) + '</td><td>' + mark(r.cells.gdm) + '</td><td>' + mark(r.cells.t1) + '</td><td>' + esc(r.cells.fluid) + '</td></tr>').join('');
const fd = [
  '<p><strong>STEP 0.</strong> ' + mark(T.step0) + '</p>',
  '<p><strong>STEP 1: ON ADMISSION (CSM).</strong> ' + mark(T.step1) + '</p>',
  '<p><strong>DRIP SET-UP.</strong> ' + mark(T.setup) + '</p>',
  '<p><strong>MONITORING.</strong></p><ul>' + D.MONITORING.map(m => '<li>' + mark(m) + '</li>').join('') + '</ul>',
  '<p><strong>STEP 2: FSBG NOW — WHICH ROW?</strong> ' + mark(T.step2) + '</p>',
  '<p><strong>BELOW 70.</strong> ' + mark(T.f1) + '</p>',
  '<table class="dm-table"><thead><tr><th>FSBG (mg/dL)</th><th>GDM A2 / type 2 on insulin</th><th>Type 1: insulin</th><th>Fluid</th></tr></thead><tbody>' + rows + '</tbody></table>',
  '<p><strong>DIET-CONTROLLED GDM OR ORAL AGENTS: NO DRIP.</strong> ' + mark(T.f4) + '</p>',
  '<p><strong>TYPE 1: NEVER ZERO BASAL.</strong> ' + mark(T.t1) + '</p>',
  '<p><strong>TYPE 1 ON PLAIN LR (≥121): KETONES.</strong> ' + mark(T.ketones) + '</p>',
  '<p><strong>HYPOGLYCEMIA &lt;70 OR SYMPTOMS: RESCUE NOW (CSM Adult Hypoglycemic Protocol).</strong></p><ul>' + D.RESCUE.map(o => '<li><strong>' + esc(o.order) + ':</strong> ' + mark(o.when) + '</li>').join('') + D.RESCUE_AFTER.map(x => '<li>' + mark(x) + '</li>').join('') + '</ul>',
  '<p><strong>SICK, KETONES, VOMITING? → DKA.</strong> ' + mark(T.dka) + '</p>',
  '<p><strong>A · AFTER DELIVERY (CSM).</strong> ' + mark(T.after) + '</p>',
  '<p><strong>B · NEWBORN.</strong> ' + mark(T.newborn) + '</p>',
  '<p><strong>C · STEROIDS / TIMING.</strong> ' + mark(T.steroidsShort) + '</p>',
  '<p><strong>D · NOTIFY.</strong> ' + mark(T.notify) + '</p>',
  '<p class="verify">' + esc(T.verify) + '</p>'
].join('\n');
const ant05 = '<ul><li>GDM A1 = diet-controlled. GDM A2 = medication. Pregestational = type 1 or type 2 diagnosed before pregnancy (or overt diabetes in early pregnancy).</li>' +
  '<li>Delivery timing (CO 831): GDM A1 39+0–40+6. GDM A2 well controlled 39+0–39+6. Poorly controlled GDM individualize. Pregestational, well controlled, no vascular disease 39+0–39+6. Vascular disease, poor control, or prior stillbirth 36+0–38+6.</li>' +
  '<li><strong>' + esc(T.ant05Target.split(': ')[0]) + ':</strong> ' + mark(T.ant05Target.split(': ').slice(1).join(': ')) + ' <button type="button" class="linkbtn" data-open="FD-ANT-05">' + esc(T.ant05Button) + '</button></li>' +
  '<li>Diet-controlled GDM (A1) or oral agents: no insulin drip; sliding scale insulin as needed per provider order; FSBG every 4 h until active labor, then every 1–2 h; call provider for >180, ketones or illness.</li>' +
  '<li>Shoulder counseling: consider scheduled cesarean at EFW ≥4500 g with diabetes, ≥5000 g without (LND-06). Counseling threshold, not an absolute safety cutoff.</li>' +
  '<li>' + mark(T.ant05Steroids) + '</li>' +
  '<li>Postpartum: notify the provider at delivery to start the CSM Postpartum Diabetes Management Order Set (doses there). Screen A1/A2 with a 75-g 2-hour OGTT at 4–12 weeks postpartum.</li></ul>\n' +
  '<p class="bottomline">BOTTOM LINE. A1 can wait to 40+6. A2 and well-controlled pregestational diabetes: 39 weeks. In labor: CSM nomogram, below 70 = low, hourly FSBG on the drip, type 1 never zero basal. EFW ≥4500 g with diabetes: consider cesarean (counseling, not a limit).</p>';
process.stdout.write(process.argv[2] === 'ant05' ? ant05 : fd);
