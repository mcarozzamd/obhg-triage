/* OBHG Clinical Triage UI (with Shift Patient Log; log stored on device only, keys prefixed 'shiftlog_'). No network calls, no storage of the HPI, no analytics. */
(function () {
  'use strict';
  const C = self.CONTENT, T = self.CODE_TABLES, V = self.CODE_VALIDATION, E = self.TriageEngine;
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const byId = id => C.items.find(i => i.id === id);
  const label = it => it.display_id || (it.kind === 'diagram' ? (it.card || 'FLOW') : it.id);

  const EXAMPLES = [
    '20 yo G2P1 at 37 weeks with blood pressure 150/100 and headache',
    '30 yo G2P2 2 hours postpartum after vaginal delivery, QBL 800 mL, boggy uterus',
    '29 yo G2P1 at 39 weeks in active labor 6 cm, temp 38.4 C, HR 112',
    '24 yo G1P0 at 40 weeks in labor, recurrent late decels, minimal variability, Cat II',
    '26 yo at 6 weeks, positive hCG, RLQ pelvic pain and spotting, no IUP on ultrasound',
    '28 yo G2P2 2 weeks postpartum with left calf swelling and pain',
    '22 yo G1P0 at 32 weeks with leaking fluid since this morning',
  ];

  // ---------- tabs ----------
  function tab(which) {
    for (const v of ['triage', 'browse', 'log']) {
      const on = v === which; $('view-' + v).hidden = !on; $('tab-' + v).classList.toggle('on', on); $('tab-' + v).setAttribute('aria-selected', on);
    }
    if (which === 'browse') renderList();
    if (which === 'log') renderLog();
  }
  $('tab-triage').onclick = () => tab('triage');
  $('tab-browse').onclick = () => tab('browse');
  $('tab-log').onclick = () => tab('log');

  // ---------- rendering ----------
  function verifyBox(flags) {
    if (!flags || !flags.length) return '';
    return '<div class="verify"><b>⚑ Flagged for verification (from source):</b><ul>' + flags.map(f => '<li>' + esc(f) + '</li>').join('') + '</ul></div>';
  }
  function cardHTML(card, open) {
    return '<div class="cardtext">' + card.html + '</div>';
  }
  function itemHTML(item, companionCard) {
    let h = '<div class="th"><div class="id">' + esc(label(item)) + (item.kind === 'diagram' ? ' · FLOW DIAGRAM' : ' · CARD') +
      (item.superseded ? '<span class="badge warn">SUPERSEDED</span>' : '') +
      '</div><div class="t">' + esc(item.title) + '</div></div>';
    if (item.kind === 'diagram') {
      h += '<div class="hint">Tap the diagram to open full screen; pinch or +/− to zoom.</div>';
      h += '<img class="diag" src="' + esc(item.img) + '" alt="' + esc(item.title) + '" data-zoom="' + esc(item.id) + '">';
      h += verifyBox(item.flags);
      if (item.html) h += '<details class="companion" open><summary>Tree logic (text)</summary><div class="cardtext">' + item.html + '</div></details>';
      if (companionCard) h += '<details class="companion"' + (companionCard.flags.length ? '' : '') + '><summary>Companion card: ' + esc(label(companionCard)) + ' · ' + esc(companionCard.title) + '</summary>' + verifyBox(companionCard.flags) + cardHTML(companionCard) + '</details>';
    } else {
      h += verifyBox(item.flags) + cardHTML(item);
    }
    h += '<div class="hint">Source: ' + esc(item.source.split('/').slice(-2).join('/')) + '</div>';
    return h;
  }
  function factsHTML(f) {
    const rows = [];
    const add = (k, v) => { if (v !== undefined && v !== null && v !== '') rows.push('<dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd>'); };
    add('Age', f.age); add('G/P', f.G !== undefined ? 'G' + f.G + 'P' + f.P + (f.TPAL ? ' (' + f.TPAL + ')' : '') : undefined);
    add('Gestational age', f.ga !== undefined ? f.gaWeeks + 'w' + (f.gaDays || 0) + 'd' : undefined);
    add('Status', f.postpartum ? 'Postpartum' + (f.ppText ? ' (' + f.ppText + ')' : '') : f.postop ? 'Post-op' : f.labor ? 'Intrapartum' : f.antepartum ? 'Antepartum' : 'Not pregnant / unknown');
    add('Delivery route', f.route); add('Prior cesarean', f.priorCS ? 'yes' : undefined);
    add('BP', f.bpReadings ? f.bpReadings.join(', ') + (f.severeBP ? ' — SEVERE RANGE' : f.htn ? ' — ≥140/90' : '') : undefined);
    add('HR', f.hr); add('FHR baseline', f.fhr); add('Temp', f.tempC !== undefined ? f.tempC + ' °C / ' + f.tempF + ' °F' : undefined);
    add('RR', f.rr); add('SpO2', f.spo2 !== undefined ? f.spo2 + '%' : undefined); add('QBL/EBL', f.qbl !== undefined ? f.qbl + ' mL' : undefined);
    add('WBC', f.wbc); add('Lactate', f.lactate); add('hCG', f.hcg !== undefined ? f.hcg : f.hcgPositive ? 'positive' : f.kw.notPregnant ? 'negative / not pregnant' : undefined);
    add('Shock index', f.shockIndex); add('Sepsis screen', f.sirs.length ? f.sirs.length + ' criteria: ' + f.sirs.join(', ') : undefined);
    add('Keywords', Object.keys(f.kw).filter(k => !['pregnantWord', 'timingWords', 'labor'].includes(k)).join(', '));
    return '<dl class="facts">' + rows.join('') + '</dl>';
  }
  function codingHTML(cd, topId) {
    if (!cd) return '<p>No code table for ' + esc(topId) + '.</p>';
    const ctxName = { t1: 'first trimester', t2: 'second trimester', t3: 'third trimester', pp: 'puerperium', cb: 'childbirth (intrapartum)', u: 'unspecified' }[cd.ctx];
    let h = '<p class="alt-tag">Specificity context: <b>' + esc(ctxName) + '</b> · code table v' + esc(cd.tableVersion) + ' · ICD-10-CM checked against CMS FY2026 (and FY2027) code files</p>';
    h += '<div class="subh">ICD-10-CM</div><table class="ctab">';
    for (const c of cd.icd) {
      h += '<tr><td class="code">' + esc(c.code) + '</td><td>' + esc(c.label) + (c.alt ? ' <span class="alt-tag">· if documented / alternative</span>' : '') + (c.secondary ? ' <span class="alt-tag">· secondary</span>' : '') +
        '<br>' + (c.verified ? '<span class="ok">✓ CMS FY2026: ' + esc(c.cms) + '</span>' : '<span class="no">⚑ NOT VERIFIED in CMS FY2026 file</span>') + '</td></tr>';
    }
    h += '</table><div class="subh">CPT (plain-English labels, not AMA descriptors)</div><table class="ctab">';
    for (const c of cd.cpt) h += '<tr><td class="code">' + esc(c.code) + '</td><td>' + esc(c.label) + '</td></tr>';
    h += '</table><div class="subh">E/M ranges</div><table class="ctab">';
    for (const c of cd.em) h += '<tr><td class="code">' + esc(c.code) + '</td><td>' + esc(c.label) + '</td></tr>';
    h += '</table><p class="alt-tag">CPT® is a registered trademark of the AMA. Codes are suggestions for the matched card only; choose from documentation. Not billing advice.</p>';
    return h;
  }

  let current = null;
  function run() {
    const text = $('hpi').value.trim();
    const warns = E.privacyCheck(text);
    $('privacy-warn').hidden = !warns.length;
    $('privacy-warn').innerHTML = warns.length ? '<b>Check for identifiers:</b> ' + warns.map(esc).join(' ') + ' Remove them before continuing.' : '';
    if (!text) { $('result').hidden = true; return; }
    const r = E.triage(text, C, T, V); current = r;
    $('result').hidden = false;
    if (!r.top) {
      $('flags').innerHTML = ''; $('top').innerHTML = '<div class="th"><div class="t">No confident match</div></div><div class="cardtext"><p>Try adding GA or postpartum status, vitals, or a key symptom. Or use Browse all.</p></div>';
      $('alts').innerHTML = ''; $('why').innerHTML = factsHTML(r.facts); $('coding').innerHTML = ''; return;
    }
    $('flags').innerHTML = r.flags.map(fl => '<span class="chip ' + (fl.level === 'amber' ? 'amber' : '') + '">' + esc(fl.text) + '</span>').join('');
    showTop(r.top);
    $('alts').innerHTML = r.alternates.map(a => {
      const it = a.diagram || a.card; if (!it) return '';
      return '<button type="button" data-open="' + esc(it.id) + '"><span><b>' + esc(label(it)) + '</b> ' + esc(it.title) + (a.diagram ? ' <span class="badge">FLOW</span>' : '') + '</span><span class="sc">' + (a.score ? 'score ' + a.score : 'related') + '</span></button>';
    }).join('') || '<p class="alt-tag">None.</p>';
    $('why').innerHTML = factsHTML(r.facts) + '<div class="subh">Rules fired for ' + esc(r.top.id) + ' (score ' + r.top.score + ')</div><ul class="rules">' + r.top.why.map(w => '<li>' + esc(w) + '</li>').join('') + '</ul>' +
      '<div class="subh">All candidates</div><ul class="rules">' + r.ranked.slice(0, 8).map(x => '<li>' + esc(x.id) + ' — ' + x.score + '</li>').join('') + '</ul>';
    $('coding').innerHTML = codingHTML(r.coding, r.top.id);
    $('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function showTop(t) {
    const item = t.diagram || t.card;
    $('top').innerHTML = itemHTML(item, t.diagram ? t.card : null);
  }

  // ---------- viewer ----------
  let zoom = 1;
  function openViewer(item) {
    if (item.kind !== 'diagram') { openItem(item); return; }
    $('viewer-title').textContent = label(item) + ' · ' + item.title; $('viewer-img').src = item.img; $('viewer-img').alt = item.title;
    zoom = 1; $('viewer-img').style.width = '100%'; $('viewer').hidden = false;
  }
  $('viewer-close').onclick = () => { $('viewer').hidden = true; };
  $('zoom-in').onclick = () => { zoom = Math.min(zoom * 1.5, 6); $('viewer-img').style.width = (zoom * 100) + '%'; };
  $('zoom-out').onclick = () => { zoom = Math.max(zoom / 1.5, 1); $('viewer-img').style.width = (zoom * 100) + '%'; };

  function openItem(item) {
    tab('triage');
    $('result').hidden = false;
    $('flags').innerHTML = '';
    const comp = item.kind === 'diagram' && item.card ? byId(item.card) : null;
    $('top').innerHTML = itemHTML(item, comp);
    if (!current) { $('alts').innerHTML = ''; $('why').innerHTML = '<p class="alt-tag">Opened from Browse all.</p>'; $('coding').innerHTML = codingHTML(E.codes(item.card || item.id.replace(/^FD-/, ''), E.parse(''), T, V), item.id); }
    $('top').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  document.addEventListener('click', e => {
    const z = e.target.closest('[data-zoom]'); if (z) { openViewer(byId(z.dataset.zoom)); return; }
    const o = e.target.closest('[data-open]'); if (o) { openItem(byId(o.dataset.open)); return; }
    const x = e.target.closest('[data-ex]'); if (x) { $('hpi').value = x.dataset.ex; run(); }
  });

  // ---------- browse ----------
  function renderList() {
    const q = $('q').value.trim().toLowerCase();
    const terms = q.split(/\s+/).filter(Boolean);
    const match = it => !terms.length || terms.every(t => (label(it) + ' ' + it.id + ' ' + it.title + ' ' + it.text).toLowerCase().includes(t));
    const groups = [['Flow diagrams', i => i.kind === 'diagram'], ['OB cards', i => i.kind === 'card' && i.book === 'OB'], ['GYN companion cards', i => i.kind === 'card' && i.book === 'GYN']];
    let h = '';
    for (const [g, fn] of groups) {
      const its = C.items.filter(fn).filter(match);
      if (!its.length) continue;
      h += '<div class="grp">' + g + ' (' + its.length + ')</div>';
      for (const it of its) {
        let snip = '';
        if (terms.length) {
          const txt = it.text.replace(/\s+/g, ' '); const ix = txt.toLowerCase().indexOf(terms[0]);
          if (ix >= 0) snip = esc(txt.slice(Math.max(0, ix - 40), ix + 80)).replace(new RegExp(terms[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), m => '<mark>' + m + '</mark>');
        }
        h += '<button type="button" data-open="' + esc(it.id) + '"><span class="lid">' + esc(label(it)) + '</span>' + esc(it.title) +
          (it.superseded ? ' <span class="badge warn">SUPERSEDED</span>' : '') + (it.flags && it.flags.length ? ' <span class="badge">⚑ ' + it.flags.length + '</span>' : '') +
          (snip ? '<span class="snip">…' + snip + '…</span>' : '') + '</button>';
      }
    }
    $('list').innerHTML = h || '<p>No matches.</p>';
  }
  $('q').addEventListener('input', renderList);

  // ---------- input ----------
  $('examples').innerHTML = EXAMPLES.map(x => '<button type="button" data-ex="' + esc(x) + '">' + esc(x) + '</button>').join('');
  $('go').onclick = run;
  $('hpi-form').addEventListener('submit', e => e.preventDefault());
  $('hpi').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); run(); } });
  $('hpi').addEventListener('input', () => { const w = E.privacyCheck($('hpi').value); $('privacy-warn').hidden = !w.length; $('privacy-warn').innerHTML = w.length ? '<b>Check for identifiers:</b> ' + w.map(esc).join(' ') : ''; });
  $('clear').onclick = () => { $('hpi').value = ''; current = null; $('result').hidden = true; $('privacy-warn').hidden = true; $('hpi').focus(); };
  // Do not let the browser restore the HPI from page cache.
  window.addEventListener('pagehide', () => { ['hpi', 'lg-hpi', 'lg-hpi2', 'lg-ap', 'lg-apentry', 'lg-ap-sel'].forEach(id => { $(id).value = ''; }); });
  window.addEventListener('pageshow', () => { $('hpi').value = ''; });


  // ---------- Shift Patient Log — device-only storage, reuses engine + code tables ----------
  const SL = self.ShiftLog, store = SL.Store();
  try { store.autoPurge(); } catch (_) {}
  $('lg-disposition').innerHTML = '<option value="">Select…</option>' + SL.DISPOSITIONS.map(d => '<option>' + esc(d) + '</option>').join('');
  const F = ['initials', 'age', 'ga', 'gp', 'diagnosis', 'icd', 'cpt', 'disposition', 'clinic'];
  let lgCard = '', viewing = null;
  const amendTitle = r => (r.amendments || []).map(a => new Date(a.ts).toLocaleString() + ': ' + Object.keys(a.changes).map(k => k + ' "' + a.changes[k][0] + '" -> "' + a.changes[k][1] + '"').join(', ')).join(' | ');
  const retLabel = d => d ? d + ' days' : 'keep until I delete';
  const tableHTML = (sh, editable) => '<tr><th>#</th>' + SL.COLS.map(c => '<th>' + esc(c) + '</th>').join('') + (editable ? '<th></th>' : '') + '</tr>' +
    (sh.entries.map(r => '<tr class="' + (r.voided ? 'void' : r.amendedTs ? 'amended' : '') + '"><td>' + r.n + (r.amendedTs ? '<span class="amtag" title="' + esc(amendTitle(r)) + '">amended ' + esc(new Date(r.amendedTs).toLocaleString()) + '</span>' : '') + '</td>' + F.map(f => '<td>' + esc(r[f]) + (f === 'cpt' && (r.icd || r.cpt) ? '<span class="amtag">suggested; provider verifies before billing</span>' : '') + '</td>').join('') +
      (editable ? '<td>' + (r.voided ? '<span class="alt-tag">voided</span>' : '<button type="button" class="small" data-amend="' + r.n + '">Amend</button> <button type="button" class="small" data-void="' + r.n + '">Void</button>') + '</td>' : '') + '</tr>').join('') || '<tr><td colspan="11" class="alt-tag">No entries.</td></tr>');
  function renderLog() {
    store.autoPurge();
    const pf = store.getProfile();
    $('profile-box').hidden = !!pf; $('log-main').hidden = !pf;
    if (!pf) return;
    const cur = store.current();
    $('log-head').innerHTML = '<b>' + esc(pf.name) + (pf.title ? ', ' + esc(pf.title) : '') + '</b> · ' + esc(pf.site) + '<br><span class="alt-tag">Current shift ' + esc(SL.shiftLabel(cur)) + '</span>';
    $('ret-label').textContent = retLabel(store.retention());
    $('log-table').innerHTML = tableHTML(cur, true);
    const past = store.list().filter(x => x.end);
    $('past').innerHTML = past.map(x => '<div class="pastrow"><span>' + esc(SL.shiftLabel(x)) + ' · ' + x.entries.length + ' entr' + (x.entries.length === 1 ? 'y' : 'ies') + '</span>' +
      '<button type="button" class="small" data-pv="' + esc(x.id) + '">Open</button><button type="button" class="small" data-pe="' + esc(x.id) + '">Export</button><button type="button" class="small danger" data-pd="' + esc(x.id) + '">Delete</button></div>').join('') || '<p class="alt-tag">No past shifts.</p>';
    if (viewing && !store.get(viewing)) viewing = null;
    $('past-view').hidden = !viewing;
    if (viewing) { const sh = store.get(viewing); $('pv-title').textContent = 'Shift ' + SL.shiftLabel(sh); $('pv-table').innerHTML = tableHTML(sh, false); }
  }
  async function exportShift(id) {
    const pf = store.getProfile(), sh = store.get(id); if (!sh) return;
    const str = SL.buildPDF(pf, sh);
    const bytes = new Uint8Array(str.length); for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i) & 255;
    const name = 'OBHG_Shift_Log_' + SL.shiftLabel(sh).slice(0, 16).replace(' ', '_').replace(':', '') + '.pdf';
    const file = new File([bytes], name, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'OBHG SHIFT PATIENT LOG' }); return; } catch (err) { if (err && err.name === 'AbortError') return; }
    }
    const url = URL.createObjectURL(file); const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
  function purgeShift(id, verb) {
    const sh = store.get(id); if (!sh) return;
    if (confirm(verb + ' shift ' + SL.shiftLabel(sh) + ' (' + sh.entries.length + ' entries) from this device permanently?' + (verb === 'Purge' ? ' Export first.' : ''))) { store.purge(id); if (viewing === id) viewing = null; renderLog(); }
  }
  $('past').addEventListener('click', ev => {
    const v = ev.target.closest('[data-pv]'), x = ev.target.closest('[data-pe]'), d = ev.target.closest('[data-pd]');
    if (v) { viewing = v.dataset.pv; renderLog(); $('past-view').scrollIntoView({ behavior: 'smooth' }); }
    if (x) exportShift(x.dataset.pe);
    if (d) purgeShift(d.dataset.pd, 'Delete');
  });
  $('pv-export').onclick = () => viewing && exportShift(viewing);
  $('pv-purge').onclick = () => viewing && purgeShift(viewing, 'Purge');
  $('pv-close').onclick = () => { viewing = null; renderLog(); };
  $('lg-new').onclick = () => {
    const cur = store.current();
    if (confirm('Close the current shift (' + cur.entries.length + ' entries, stays saved under Past shifts) and start a new shift now?')) { store.startNew(); renderLog(); }
  };
  $('pf-save').onclick = () => {
    const name = $('pf-name').value.trim(); if (!name) { $('pf-name').focus(); return; }
    store.setProfile({ name, title: $('pf-title').value.trim(), site: $('pf-site').value.trim() || 'CHRISTUS St. Michael', retention: +$('pf-ret').value }); renderLog();
  };
  $('pf-edit').onclick = () => { const pf = store.getProfile() || {}; $('pf-name').value = pf.name || ''; $('pf-title').value = pf.title || ''; $('pf-site').value = pf.site || 'CHRISTUS St. Michael'; $('pf-ret').value = String(store.retention()); $('profile-box').hidden = false; $('log-main').hidden = true; };
  // Structured fields (initials/age/G/P/GA/HPI) drive the engine; summary auto-fills them first.
  let lastR = null, lastAP = null, amending = null; const auto = new Set();
  const fieldsNow = () => ({ initials: $('lg-initials').value.trim(), age: $('lg-age').value.trim(), gp: $('lg-gp').value.trim(), ga: $('lg-ga').value.trim(), hpi: $('lg-hpi2').value.trim(), disposition: $('lg-disposition').value });
  const setIf = (k, v, el) => { el = el || $('lg-' + k); if (v && (!el.value || auto.has(el.id))) { el.value = v; auto.add(el.id); } };
  ['lg-initials', 'lg-age', 'lg-gp', 'lg-ga', 'lg-hpi2', 'lg-diagnosis', 'lg-icd', 'lg-cpt', 'lg-disposition'].forEach(id => $(id).addEventListener('input', () => auto.delete(id)));
  const RC = self.ROUTINE_CODES; const CIDX = SL.codeIndex(T, V, RC);
  const svc = () => SL.serviceFor($('lg-svc').value, fieldsNow());
  const showSvc = () => { const b = svc(); $('lg-svc-now').textContent = 'Active service: ' + b; $('lg-routine').classList.toggle('dim', b !== 'OB'); $('lg-routine-gyn').classList.toggle('dim', b !== 'GYN'); };
  $('lg-svc').addEventListener('change', () => { showSvc(); schedule(true); });
  ['lg-ga', 'lg-gp'].forEach(id => $(id).addEventListener('input', showSvc));
  $('lg-routine-gyn').innerHTML = RC.sets.filter(x => x.book === 'GYN').map(x => '<button type="button" data-rt="' + esc(x.id) + '">' + esc(x.label) + '</button>').join('');
  $('lg-routine').innerHTML = RC.sets.filter(x => x.book !== 'GYN').map(x => '<button type="button" data-rt="' + esc(x.id) + '">' + esc(x.label) + '</button>').join('');
  let activeRt = null;
  const rtOpts = () => ({ delivered: $('lg-deliv').value === 'yes', patient: $('lg-pt').value, obs: $('lg-obs').value, surgeon: $('lg-surg').value === 'yes' });
  function applyRoutine(id, force) { // force = user tapped (overwrites); auto = only empty/auto fields
    const rf = SL.routineFill(RC, id, fieldsNow(), rtOpts()); if (!rf) return null; activeRt = id;
    const put = (k, v) => { const el = $('lg-' + k); if (force) { el.value = v; auto.delete(el.id); } else setIf(k, v); };
    if (/OTHER$/.test(id)) { if (force) ['diagnosis', 'icd', 'cpt', 'disposition'].forEach(k => put(k, '')); }
    else { put('diagnosis', rf.diagnosis); put('icd', rf.icd); put('cpt', rf.cpt); put('disposition', rf.disposition); }
    lgCard = rf.card;
    document.querySelectorAll('[data-rt]').forEach(b => b.classList.toggle('on', b.dataset.rt === id));
    $('lg-routine-alts').innerHTML = (rf.needsGA ? '<p><b>Enter GA for Z3A.xx.</b></p>' : '') +
      (rf.notes.length ? '<ul class="rules">' + rf.notes.map(n => '<li>' + esc(n) + '</li>').join('') + '</ul>' : '') +
      (rf.alts.length ? '<div>Also: ' + rf.alts.map(c => '<button type="button" class="small altcode" data-addcode="' + esc(c.code) + '" data-kind="' + c.kind + '" title="' + esc(c.rationale) + '">+ ' + esc(c.code) + ' ' + esc(c.label) + '</button>').join('') + '</div>' : '') +
      '<p class="alt-tag"><b>' + esc(RC.disclaimer) + '</b> Verify with OBHG coding.</p>';
    if (force) { flash(['lg-diagnosis', 'lg-icd', 'lg-cpt', 'lg-disposition']); toast(/OTHER$/.test(id) ? 'Cleared for manual entry' : 'Filled: ' + rf.set.label); }
    return rf;
  }
  ['lg-deliv', 'lg-pt', 'lg-obs', 'lg-surg'].forEach(id => $(id).addEventListener('change', () => { if (activeRt) applyRoutine(activeRt, true); }));
  $('lg-codeq').addEventListener('input', () => {
    const hits = SL.codeSearch(CIDX, $('lg-codeq').value, 15);
    $('lg-coderes').innerHTML = hits.map(h => '<button type="button" data-addcode="' + esc(h.code) + '" data-kind="' + h.kind + '"><span class="k">' + h.kind + ' ' + esc(h.code) + '</span>' + esc(h.label) + ' <span class="alt-tag">' + esc(h.src) + '</span></button>').join('') || ($('lg-codeq').value.trim().length > 1 ? '<p class="alt-tag">No matches.</p>' : '');
  });
  showSvc();
  function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => { t.hidden = true; }, 1800); }
  function flash(ids) { ids.forEach(id => { const el = $(id); if (!el) return; el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }); }
  // Re-runs triage + DDx/codes from structured fields. carry=true parses the summary into fields first.
  function runTriage(carry) {
    const text = $('lg-hpi').value.trim(); const w = E.privacyCheck(text + ' ' + $('lg-hpi2').value);
    $('lg-warn').hidden = !w.length; $('lg-warn').innerHTML = w.length ? '<b>Check for identifiers:</b> ' + w.map(esc).join(' ') : '';
    if (w.length) return;
    if (carry && text) { const ps = SL.parseSummary(text, E); setIf('initials', ps.initials); setIf('age', ps.age); setIf('gp', ps.gp); setIf('ga', ps.ga); setIf('hpi2', ps.hpi); setIf('disposition', ps.disposition); }
    const fl = fieldsNow(); const q = SL.composeText(fl);
    if (!q) { $('lg-sugg').hidden = true; $('lg-triage').hidden = true; lastR = null; return; }
    const r = E.triage(q, C, T, V), sg = SL.suggest(r); lastR = r;
    for (const k of ['diagnosis', 'icd', 'cpt']) setIf(k, sg[k]); // only empty or still-auto-filled fields
    lgCard = sg.card || lgCard;
    $('lg-sugg').hidden = false;
    $('lg-sugg').innerHTML = !r.top ? '<p class="alt-tag">No confident match; enter fields manually.</p>' :
      '<details class="companion"><summary>DDx: ' + esc(label(r.top.card || r.top.diagram)) + ' + ' + r.alternates.length + ' alternates</summary><ul class="rules">' +
      [r.top].concat(r.alternates).map(a => { const it = a.diagram || a.card; return it ? '<li><b>' + esc(label(it)) + '</b> ' + esc(it.title) + '</li>' : ''; }).join('') + '</ul></details>' +
      '<details class="companion"><summary>Suggested codes (verify)</summary>' + codingHTML(r.coding, r.top.id) + '</details>';
    const rt = SL.routineMatch(RC, [fl.hpi, text].join(' '), svc()) || SL.routineMatch(RC, [fl.hpi, text].join(' ')); showSvc();
    if (!r.top && rt) { const rf = applyRoutine(rt, false); $('lg-sugg').innerHTML = '<p><b>No card match. Routine encounter suggested: ' + esc(rf.set.label) + '</b> (codes filled where empty; pending Doc review). Tap a routine button to change.</p>'; }
    else if (r.top && rt) $('lg-sugg').innerHTML += '<p class="alt-tag">Routine encounter? <button type="button" class="small" data-rt="' + esc(rt) + '">' + esc(RC.sets.find(x => x.id === rt).label) + '</button></p>';
    lastAP = SL.assessPlan(r, fl, rt && !r.top ? RC.sets.find(x => x.id === rt) : null);
    $('lg-triage').hidden = false; $('lg-ap').value = lastAP.text;
    $('lg-using').textContent = 'Using HPI: ' + (fl.hpi || '(none)') + ' · ' + [fl.age && fl.age + ' yo', fl.gp, fl.ga].filter(Boolean).join(' ');
    $('lg-tri-cards').innerHTML = !r.top ? '' : (r.flags.length ? '<div class="chips">' + r.flags.map(fl2 => '<span class="chip ' + (fl2.level === 'amber' ? 'amber' : '') + '">' + esc(fl2.text) + '</span>').join('') + '</div>' : '') +
      '<details class="companion"><summary>Top match: ' + esc(label(r.top.card || r.top.diagram)) + ' · ' + esc((r.top.card || r.top.diagram).title) + '</summary>' + itemHTML(r.top.diagram || r.top.card, r.top.diagram ? r.top.card : null) + '</details>' +
      r.alternates.map(a => { const it = a.diagram || a.card; return it ? '<details class="companion"><summary>Also consider: ' + esc(label(it)) + ' · ' + esc(it.title) + '</summary>' + itemHTML(it, a.diagram ? a.card : null) + '</details>' : ''; }).join('');
  }
  let deb = null; const schedule = carry => { clearTimeout(deb); deb = setTimeout(() => { try { runTriage(carry); } catch (err) { console.error(err); } }, 600); };
  $('lg-hpi').addEventListener('input', () => schedule(true));
  ['lg-initials', 'lg-age', 'lg-gp', 'lg-ga', 'lg-hpi2'].forEach(id => $(id).addEventListener('input', () => schedule(false)));
  $('lg-suggest').onclick = () => { clearTimeout(deb); runTriage(true); $('lg-hpi').value = ''; toast('Triage refreshed'); };
  function insertAP() {
    if (lastR && !lastR.top && lgCard.startsWith('RT-')) { applyRoutine(lgCard.slice(3), true); $('lg-apentry').value = $('lg-ap').value; flash(['lg-apentry']); toast('Inserted'); return; }
    if (!lastR || !lastR.top) { toast('Nothing to insert yet'); return; } const sg = SL.suggest(lastR);
    for (const k of ['diagnosis', 'icd', 'cpt']) if (sg[k]) { $('lg-' + k).value = sg[k]; auto.add('lg-' + k); }
    lgCard = sg.card; $('lg-apentry').value = SL.assessPlan(lastR, fieldsNow()).text;
    flash(['lg-diagnosis', 'lg-icd', 'lg-cpt', 'lg-apentry']); $('lg-diagnosis').scrollIntoView({ behavior: 'smooth', block: 'center' }); toast('Inserted');
  }
  function copyText(t) {
    const fallback = () => { // iOS-safe: hidden textarea + execCommand inside the same user gesture
      const ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.className = 'copybuf';
      document.body.appendChild(ta); ta.focus(); ta.select(); ta.setSelectionRange(0, t.length); let ok = false; try { ok = document.execCommand('copy'); } catch (_) {} ta.remove(); return ok;
    };
    const manual = () => { $('lg-ap-fallback').hidden = false; $('lg-ap-sel').value = t; $('lg-ap-sel').focus(); $('lg-ap-sel').select(); toast('Select and copy manually'); };
    if (fallback()) { toast('Copied'); return; }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(() => toast('Copied'), manual); else manual();
  }
  // Delegated so handlers survive any re-render of the triage box.
  document.addEventListener('click', ev => {
    const rb = ev.target.closest('[data-rt]'); if (rb) { applyRoutine(rb.dataset.rt, true); return; }
    const ab = ev.target.closest('[data-addcode]'); if (ab) { const f = ab.dataset.kind === 'CPT' ? 'lg-cpt' : 'lg-icd'; let v = SL.addCode($(f).value, ab.dataset.addcode), note = ''; if (f === 'lg-icd') { const ir = SL.icdRules(v.split(/\s*,\s*/)); v = ir.list.join(', '); note = ir.notes.join(' '); } $(f).value = v; auto.delete(f); flash([f]); toast('Added ' + ab.dataset.addcode + (note ? '. ' + note : '')); return; }
    const b = ev.target.closest('[data-act]'); if (!b) return;
    if (b.dataset.act === 'ap-insert') insertAP();
    if (b.dataset.act === 'ap-copy') { const t = $('lg-ap').value; if (!t) { toast('Nothing to copy yet'); return; } copyText(t); }
  });
  const clearForm = () => { F.forEach(f => { $('lg-' + f).value = ''; }); ['lg-hpi', 'lg-hpi2', 'lg-ap', 'lg-apentry', 'lg-ap-sel'].forEach(id => { $(id).value = ''; }); $('lg-ap-fallback').hidden = true; clearTimeout(deb); $('lg-codeq').value = ''; $('lg-coderes').innerHTML = ''; $('lg-routine-alts').innerHTML = ''; $('lg-svc').value = 'AUTO'; document.querySelectorAll('[data-rt].on').forEach(b => b.classList.remove('on')); activeRt = null; auto.clear(); lgCard = ''; lastR = null; lastAP = null;
    $('lg-sugg').hidden = true; $('lg-triage').hidden = true; amending = null; $('lg-form-title').textContent = 'NEW ENTRY'; $('lg-add').textContent = 'Add to log'; $('lg-cancel').hidden = true; $('lg-amend-note').hidden = true; };
  $('lg-cancel').onclick = clearForm;
  $('lg-add').onclick = () => {
    const e = {}; F.forEach(f => { e[f] = $('lg-' + f).value.trim(); }); e.card = lgCard;
    const errs = SL.validateEntry(e).concat(E.privacyCheck([e.diagnosis, e.clinic].join(' ')));
    $('lg-err').hidden = !errs.length; $('lg-err').innerHTML = errs.map(esc).join('<br>');
    if (errs.length) return;
    try {
      if (amending) { const res = store.amend(amending.shift, amending.n, e); if (res === null) { $('lg-err').hidden = false; $('lg-err').textContent = 'No changes to amend.'; return; } }
      else store.add(e);
    } catch (err) { $('lg-err').hidden = false; $('lg-err').textContent = err.message; return; }
    clearForm(); renderLog(); // HPI + A&P are cleared, never persisted
  };
  $('log-table').addEventListener('click', ev => {
    const am = ev.target.closest('[data-amend]');
    if (am) {
      const sh = store.current(); const r = sh.entries.find(x => x.n === +am.dataset.amend); if (!r || r.voided) return;
      clearForm(); F.forEach(f => { $('lg-' + f).value = r[f] || ''; }); lgCard = r.card || ''; amending = { shift: sh.id, n: r.n };
      $('lg-form-title').textContent = 'AMEND ENTRY #' + r.n; $('lg-add').textContent = 'Save amendment'; $('lg-cancel').hidden = false;
      $('lg-amend-note').hidden = false; $('lg-amend-note').textContent = 'Amending entry #' + r.n + ' (logged ' + new Date(r.ts).toLocaleString() + '). Changes are saved in place with an amended timestamp and an audit trail of prior values.';
      $('log-form').scrollIntoView({ behavior: 'smooth', block: 'start' }); return;
    }
    const b = ev.target.closest('[data-void]'); if (!b) return;
    if (confirm('Void entry #' + b.dataset.void + '? It will remain visible with a strikethrough.')) { store.void(store.current().id, +b.dataset.void); renderLog(); }
  });
  $('lg-export').onclick = () => exportShift(store.current().id);
  $('lg-purge').onclick = () => purgeShift(store.current().id, 'Purge');

  // Service worker + 'new version' prompt (new SW skipWaiting + clients.claim -> controllerchange).
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    const hadController = !!navigator.serviceWorker.controller;
    const prompt = () => { $('sw-update').hidden = false; };
    $('sw-reload').onclick = () => location.reload();
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) prompt(); });
    navigator.serviceWorker.register('sw.js', { scope: './' }).then(reg => {
      reg.addEventListener('updatefound', () => { const nw = reg.installing; if (nw) nw.addEventListener('statechange', () => { if (nw.state === 'activated' && hadController) prompt(); }); });
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
      reg.update().catch(() => {});
    }).catch(() => {});
  }
})();
