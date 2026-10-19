/* OBHG Clinical Triage UI. No network calls, no storage of the HPI, no analytics. */
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
    const tri = which === 'triage';
    $('view-triage').hidden = !tri; $('view-browse').hidden = tri;
    $('tab-triage').classList.toggle('on', tri); $('tab-browse').classList.toggle('on', !tri);
    $('tab-triage').setAttribute('aria-selected', tri); $('tab-browse').setAttribute('aria-selected', !tri);
    if (!tri) renderList();
  }
  $('tab-triage').onclick = () => tab('triage');
  $('tab-browse').onclick = () => tab('browse');

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
  window.addEventListener('pagehide', () => { $('hpi').value = ''; });
  window.addEventListener('pageshow', () => { $('hpi').value = ''; });

  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
