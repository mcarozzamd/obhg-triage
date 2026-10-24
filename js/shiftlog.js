/* OBHG Shift Patient Log — pure logic: shift window, validation, storage, purge, PDF.
 * All data stays on the device (localStorage, keys prefixed 'shiftlog_'). No network calls. */
(function (root) {
  'use strict';
  const PREFIX = 'shiftlog_';
  const K_PROFILE = PREFIX + 'profile', K_LOGS = PREFIX + 'logs';
  const RETAIN_DEFAULT = 30;
  const DISPOSITIONS = ['Discharged home', 'Admitted L&D', 'Admitted antepartum', 'Admitted GYN', 'Admitted postpartum', 'Observation', 'To OR', 'Transferred', 'Other'];
  const AMEND_FIELDS = ['initials', 'age', 'ga', 'gp', 'diagnosis', 'icd', 'cpt', 'disposition', 'clinic', 'card'];
  const COLS = ['Initials', 'Age', 'GA', 'G/P', 'Diagnosis', 'ICD', 'CPT', 'Disposition', 'Clinic'];

  const pad = n => String(n).padStart(2, '0');
  const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  // Shift runs 08:00 -> 08:00 local time.
  function shiftStart(now) {
    const d = new Date(now || Date.now()); const s = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 8, 0, 0, 0);
    if (d < s) s.setDate(s.getDate() - 1); return s;
  }
  function shiftKey(now) { return ymd(shiftStart(now)); }
  function shiftRange(key) {
    const [y, m, dd] = key.split('-').map(Number); const s = new Date(y, m - 1, dd, 8); const e = new Date(y, m - 1, dd + 1, 8);
    return { start: s, end: e, label: ymd(s) + ' 08:00 to ' + ymd(e) + ' 08:00' };
  }

  function validateEntry(e) {
    const errs = [];
    if (!/^[A-Za-z]{2,3}$/.test(e.initials || '')) errs.push('Initials must be 2-3 letters only.');
    if (e.age !== '' && e.age != null && !/^\d{1,3}$/.test(String(e.age))) errs.push('Age must be a number.');
    if (e.ga && !/^\d{1,2}w(\d)?d?$|^\d{1,2}w\dd$|^\d{1,2}$/i.test(e.ga.replace(/\s/g, ''))) errs.push('GA format e.g. 37w2d.');
    if (e.gp && !/^G\d{1,2}\s*P\d{1,2}(\s*\(?[\d\-]+\)?)?$/i.test(e.gp)) errs.push('G/P format e.g. G2P1.');
    if (!e.diagnosis) errs.push('Diagnosis required.');
    if (!e.disposition) errs.push('Disposition required.');
    for (const f of ['diagnosis', 'icd', 'cpt', 'clinic']) if ((e[f] || '').length > 120) errs.push(f + ' too long.');
    // Block obvious identifiers in any text field
    const joined = [e.diagnosis, e.icd, e.cpt, e.clinic].join(' ');
    if (/\b\d{6,}\b/.test(joined)) errs.push('Remove long numbers (possible MRN).');
    if (/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/.test(joined)) errs.push('Remove dates (possible DOB).');
    return errs;
  }

  function mem() { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; } }; }
  const RETENTION_OPTS = [7, 30, 90, 0]; // 0 = keep until I delete
  const fmt = d => { d = new Date(d); return ymd(d) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  function shiftLabel(sh) { return fmt(sh.start) + ' to ' + (sh.end ? fmt(sh.end) : fmt(nextBoundary(sh.start)) + ' (open)'); }
  function nextBoundary(t) { const s = shiftStart(t); s.setDate(s.getDate() + 1); return s; } // next 08:00 after t
  // Shifts: { id, start ISO, end ISO|null, entries: [] }. Current = the one with end === null.
  function Store(ls) {
    ls = ls || (typeof localStorage !== 'undefined' ? localStorage : mem());
    const read = (k, d) => { try { return JSON.parse(ls.getItem(k)) || d; } catch (_) { return d; } };
    const load = () => {
      const raw = read(K_LOGS, {}); // migrate v1 format {"YYYY-MM-DD": [entries]}
      for (const k of Object.keys(raw)) if (Array.isArray(raw[k])) { const r = shiftRange(k); raw['s' + r.start.getTime()] = { id: 's' + r.start.getTime(), start: r.start.toISOString(), end: r.end.toISOString(), entries: raw[k] }; delete raw[k]; }
      return raw;
    };
    const save = o => ls.setItem(K_LOGS, JSON.stringify(o));
    const mk = (o, t) => { const id = 's' + t.getTime() + (o['s' + t.getTime()] ? 'b' : ''); o[id] = { id, start: t.toISOString(), end: null, entries: [] }; return o[id]; };
    const api = {
      getProfile: () => read(K_PROFILE, null),
      setProfile: p => { const r = Number(p.retention); ls.setItem(K_PROFILE, JSON.stringify({ name: String(p.name || '').slice(0, 80), title: String(p.title || '').slice(0, 40), site: String(p.site || 'CHRISTUS St. Michael').slice(0, 80), retention: RETENTION_OPTS.includes(r) ? r : 30 })); },
      retention: () => { const p = api.getProfile(); return p && RETENTION_OPTS.includes(p.retention) ? p.retention : 30; },
      allLogs: load,
      // Returns the open shift, applying automatic 08:00 rollover (closes a shift that crossed a boundary).
      current(now) {
        const t = new Date(now || Date.now()); const o = load(); let cur = Object.values(o).find(x => !x.end);
        const boundary = shiftStart(t); let changed = false;
        if (cur && new Date(cur.start) < boundary) { cur.end = nextBoundary(cur.start).toISOString(); cur = null; changed = true; }
        if (!cur) { cur = mk(o, boundary); changed = true; }
        // close any stray open shifts
        for (const x of Object.values(o)) if (!x.end && x.id !== cur.id) { x.end = cur.start; changed = true; }
        if (changed) save(o); return cur;
      },
      startNew(now) {
        const t = new Date(now || Date.now()); const id = api.current(t).id; const o = load();
        o[id].end = t.toISOString(); const n = mk(o, t); save(o); return n;
      },
      list: () => Object.values(load()).sort((a, b) => b.start.localeCompare(a.start)),
      get: id => load()[id] || null,
      add(entry, now) {
        const errs = validateEntry(entry); if (errs.length) throw new Error(errs.join(' '));
        const id = api.current(now).id; const o = load(); const sh = o[id];
        const rec = { n: sh.entries.length + 1, ts: new Date(now || Date.now()).toISOString(), voided: false };
        for (const c of ['initials', 'age', 'ga', 'gp', 'diagnosis', 'icd', 'cpt', 'disposition', 'clinic', 'card']) rec[c] = String(entry[c] == null ? '' : entry[c]).trim();
        rec.initials = rec.initials.toUpperCase(); sh.entries.push(rec); save(o); return rec;
      },
      // Amend in place (not voided rows). Keeps an audit trail: amendedTs + amendments[{ts, changes:{field:[old,new]}}].
      amend(id, n, entry, now) {
        const o = load(); const sh = o[id]; const r = ((sh || {}).entries || []).find(x => x.n === n);
        if (!r) throw new Error('Entry not found.'); if (r.voided) throw new Error('Voided entries cannot be amended.');
        const next = {}; for (const c of AMEND_FIELDS) next[c] = String(entry[c] == null ? r[c] : entry[c]).trim();
        next.initials = next.initials.toUpperCase();
        const errs = validateEntry(next); if (errs.length) throw new Error(errs.join(' '));
        const changes = {}; for (const c of AMEND_FIELDS) if ((r[c] || '') !== next[c]) changes[c] = [r[c] || '', next[c]];
        if (!Object.keys(changes).length) return null;
        const ts = new Date(now || Date.now()).toISOString();
        for (const c of Object.keys(changes)) r[c] = next[c];
        r.amendedTs = ts; (r.amendments = r.amendments || []).push({ ts, changes }); save(o); return r;
      },
      void(id, n, now) { // append-only: mark voided, never delete the row
        const o = load(); const r = ((o[id] || {}).entries || []).find(x => x.n === n); if (!r || r.voided) return false;
        r.voided = true; r.voidedTs = new Date(now || Date.now()).toISOString(); save(o); return true;
      },
      purge(id) { const o = load(); delete o[id]; save(o); },
      autoPurge(now, days) {
        days = days == null ? api.retention() : days; if (!days) return [];
        const o = load(); const cutoff = new Date(now || Date.now()).getTime() - days * 864e5; const gone = [];
        for (const x of Object.values(o)) if (x.end && new Date(x.end).getTime() < cutoff) { delete o[x.id]; gone.push(x.id); }
        if (gone.length) save(o); return gone;
      },
    };
    return api;
  }

  // ---------- minimal dependency-free PDF (landscape Letter, Helvetica) ----------
  const ascii = s => String(s == null ? '' : s).normalize('NFKD').replace(/[\u2013\u2014]/g, '-').replace(/[^\x20-\x7E]/g, '');
  const pdfStr = s => '(' + ascii(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)') + ')';
  const charW = 0.52; // approx Helvetica avg width in em
  function wrap(text, width, size) {
    const max = Math.max(1, Math.floor(width / (size * charW))); const out = []; let line = '';
    for (const w of ascii(text).split(/\s+/).filter(Boolean)) {
      let word = w; while (word.length > max) { if (line) { out.push(line); line = ''; } out.push(word.slice(0, max)); word = word.slice(max); }
      if (!line) line = word; else if ((line + ' ' + word).length <= max) line += ' ' + word; else { out.push(line); line = word; }
    }
    if (line) out.push(line); return out.length ? out : [''];
  }
  function buildPDF(profile, shift, now) {
    const entries = shift.entries;
    const W = 792, H = 612, M = 36; const widths = [50, 34, 46, 50, 190, 100, 80, 100, 70]; // sum 720
     const pages = []; let ops = [], y;
    const T = (x, yy, s, size, bold) => ops.push('BT /' + (bold ? 'F2' : 'F1') + ' ' + size + ' Tf ' + x + ' ' + yy + ' Td ' + pdfStr(s) + ' Tj ET');
    const L = (x1, y1, x2, y2, w) => ops.push((w || 0.5) + ' w ' + x1 + ' ' + y1 + ' m ' + x2 + ' ' + y2 + ' l S');
    const footer = () => {
      L(M, 40, W - M, 40, 0.5);
      T(M, 28, 'Codes are suggestions; provider verifies before billing. Initials only. No PHI.', 9, true);
      T(W - M - 200, 28, 'Generated ' + ascii(new Date(now || Date.now()).toLocaleString()), 8, false);
    };
    const header = () => {
      y = H - M - 4;
      T(M, y, 'OBHG SHIFT PATIENT LOG', 16, true); y -= 18;
      T(M, y, 'Provider: ' + profile.name + (profile.title ? ', ' + profile.title : '') + '    Site: ' + profile.site, 10, false); y -= 13;
      T(M, y, 'Shift: ' + shiftLabel(shift), 10, false); y -= 16;
      let x = M; COLS.forEach((c, i) => { T(x + 2, y, c, 9, true); x += widths[i]; }); y -= 4; L(M, y, W - M, y, 1); y -= 11;
    };
    const newPage = () => { if (ops.length) { footer(); pages.push(ops); } ops = []; header(); };
    newPage();
    const live = entries.filter(e => !e.voided).length;
    if (!entries.length) { T(M, y, 'No entries this shift.', 10, false); y -= 14; }
    for (const e of entries) {
      const cells = [e.initials, e.age, e.ga, e.gp, e.diagnosis + (e.voided ? ' [VOIDED]' : '') + (e.amendedTs ? ' [AMENDED ' + fmt(e.amendedTs) + ']' : ''), e.icd, e.cpt, e.disposition, e.clinic].map((v, i) => wrap(v, widths[i] - 4, 8));
      const lines = Math.max(...cells.map(c => c.length)); const h = lines * 10 + 4;
      if (y - h < 50) newPage();
      let x = M; cells.forEach((c, i) => { c.forEach((ln, j) => T(x + 2, y - j * 10, ln, 8, false)); x += widths[i]; });
      if (e.voided) for (let j = 0; j < lines; j++) L(M, y - j * 10 + 3, W - M, y - j * 10 + 3, 0.7);
      y -= h; L(M, y + 8, W - M, y + 8, 0.2);
    }
    T(M, y - 4, 'Entries: ' + live + ' active, ' + (entries.length - live) + ' voided, ' + entries.filter(e => e.amendedTs).length + ' amended.', 9, false);
    footer(); pages.push(ops);
    // assemble objects
    const objs = []; const add = s => { objs.push(s); return objs.length; };
    add('<< /Type /Catalog /Pages 2 0 R >>'); add('PAGES');
    add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    const kids = [];
    for (const p of pages) {
      const stream = p.join('\n'); const c = add('<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream');
      kids.push(add('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + W + ' ' + H + '] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ' + c + ' 0 R >>'));
    }
    objs[1] = '<< /Type /Pages /Kids [' + kids.map(k => k + ' 0 R').join(' ') + '] /Count ' + kids.length + ' >>';
    let out = '%PDF-1.4\n'; const offs = [];
    objs.forEach((o, i) => { offs.push(out.length); out += (i + 1) + ' 0 obj\n' + o + '\nendobj\n'; });
    const xref = out.length;
    out += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n' + offs.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('');
    out += 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n';
    return out; // pure ASCII string; convert to bytes 1:1
  }

  // Suggest log fields from the existing triage engine result (reuses engine + code tables).
  function suggest(r) {
    const f = r.facts || {}; const top = r.top; const item = top && (top.card || top.diagram);
    const cd = r.coding;
    return {
      age: f.age != null ? String(f.age) : '',
      ga: f.gaWeeks != null ? f.gaWeeks + 'w' + (f.gaDays || 0) + 'd' : '',
      gp: f.G != null ? 'G' + f.G + 'P' + f.P : '',
      diagnosis: item ? item.title : '',
      card: top ? top.id : '',
      icd: cd ? cd.icd.filter(c => !c.alt && c.verified).map(c => c.code).join(', ') : '',
      cpt: cd ? cd.cpt.slice(0, 2).map(c => c.code).join(', ') : '',
    };
  }

  // ---------- summary -> structured fields ----------
  const NOT_INITIALS = new Set(['BP', 'HR', 'RR', 'GA', 'PP', 'CS', 'SVD', 'IUP', 'LMP', 'RLQ', 'LLQ', 'RUQ', 'LUQ', 'ED', 'OR', 'LD', 'POD', 'PPD', 'IOL', 'ROM', 'GBS', 'HCG', 'EBL', 'QBL', 'FHR', 'TOA', 'PID', 'AUB', 'VTE', 'DVT', 'PE', 'UTI', 'IUD', 'NST', 'BPP', 'AFI', 'MVP', 'PTL', 'IAI', 'HTN', 'CAT', 'SOB', 'CP', 'HA', 'LOF', 'VB', 'PT', 'YO', 'NPO', 'IV', 'OB', 'GYN', 'MFM', 'ICU', 'CPT', 'ICD']);
  const DISPO_RULES = [
    [/\b(discharg\w*|d\/?c(?:'?d)? home|sent home|send home|home with)\b/i, 'Discharged home'],
    [/\badmit\w*\b[^.;]{0,30}\b(l\s*&\s*d|l and d|labor)\b/i, 'Admitted L&D'],
    [/\badmit\w*\b[^.;]{0,30}\bantepartum\b/i, 'Admitted antepartum'],
    [/\badmit\w*\b[^.;]{0,30}\bgyn\b/i, 'Admitted GYN'],
    [/\badmit\w*\b[^.;]{0,30}\b(postpartum|mother.?baby)\b/i, 'Admitted postpartum'],
    [/\b(observation|obs)\b/i, 'Observation'],
    [/\b(to (the )?or|taken to or|or for)\b/i, 'To OR'],
    [/\btransfer\w*\b/i, 'Transferred'],
  ];
  function parseSummary(text, E) {
    const t = String(text || '').trim(); const out = { initials: '', age: '', ga: '', gp: '', hpi: '', disposition: '' };
    if (!t) return out;
    const f = E.parse(t);
    let m = t.match(/\binitials?\s*:?\s*([A-Za-z]{2,3})\b/i) || t.match(/^\s*(?:pt\.?\s+)?([A-Z]{2,3})\b(?=[\s,:;-]+(?:\d|is\b|a\b|an\b))/);
    if (m && !NOT_INITIALS.has(m[1].toUpperCase())) out.initials = m[1].toUpperCase();
    if (f.age != null) out.age = String(f.age);
    if (f.G != null) out.gp = 'G' + f.G + 'P' + f.P + (f.TPAL ? ' (' + f.TPAL + ')' : '');
    if (f.gaWeeks != null) out.ga = f.gaWeeks + 'w' + (f.gaDays || 0) + 'd';
    for (const [re, d] of DISPO_RULES) if (re.test(t)) { out.disposition = d; break; }
    // HPI = summary with the demographic prefix removed (stays on screen only; never stored)
    let h = t.replace(/\binitials?\s*:?\s*[A-Za-z]{2,3}\b[,;:]?/i, ' ');
    if (out.initials) h = h.replace(new RegExp('^\\s*(?:pt\\.?\\s+)?' + out.initials + '\\b[,;:]?', 'i'), ' ');
    h = h.replace(/\b\d{1,3}\s*(?:yo|y\/o|y\.o\.|yrs?|years?[- ]old|year[- ]old|yof|f)\b,?/i, ' ')
      .replace(/\bG\d{1,2}\s*P\d{1,2}(?:\s*\(?\d{4}\)?|\s*[\d-]{4,7})?\b,?/i, ' ')
      .replace(/\b(?:at\s+)?\d{1,2}\s*(?:w|wk|wks|weeks?)(?:\s*\+?\s*\d\s*(?:d|days?)?|\s*\d)?\b(?:\s*(?:gestation|GA|IUP))?,?/i, ' ')
      .replace(/\s+/g, ' ').trim().replace(/^(?:,|;|-|who is|is|presents?|presenting|with|w\/|c\/o|complaining of)\s+/i, '').replace(/^(?:with|w\/|c\/o)\s+/i, '').trim();
    out.hpi = h;
    return out;
  }
  // Build engine input text from the structured fields (+ optional summary). Engine then ranks cards + codes.
  function composeText(fl) {
    fl = fl || {}; const parts = [];
    if (fl.age) parts.push(fl.age + ' yo');
    if (fl.gp) parts.push(fl.gp.replace(/\s*\(.*\)/, ''));
    if (fl.ga) { const g = String(fl.ga).replace(/\s/g, ''); parts.push('at ' + (/^\d{1,2}$/.test(g) ? g + ' weeks' : g)); }
    if (fl.hpi) parts.push('with ' + fl.hpi);
    if (fl.diagnosis) parts.push(fl.diagnosis);
    if (fl.summary) parts.push(fl.summary);
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  }

  // ---------- deterministic ASSESSMENT AND PLAN draft from existing card content ----------
  const ent = s => String(s).replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  function cardBlocks(html) { // ordered [{type:'h'|'li'|'bottom', text}]
    const out = []; const re = /<p( class="([^"]*)")?>([\s\S]*?)<\/p>|<li>([\s\S]*?)<\/li>/g; let m;
    while ((m = re.exec(html || ''))) {
      if (m[4] != null) out.push({ type: 'li', text: ent(m[4]) });
      else if (/bottomline/.test(m[2] || '') || /^BOTTOM LINE/i.test(ent(m[3]))) out.push({ type: 'bottom', text: ent(m[3]).replace(/^BOTTOM LINE\.?\s*/i, '') });
      else if (!/flagged/.test(m[2] || '')) out.push({ type: 'h', text: ent(m[3]) });
    }
    return out;
  }
  // Does a bullet that starts with a GA range apply to this GA (weeks)? Unknown GA or no range -> applies.
  function gaApplies(text, w) {
    if (w == null) return true; const t = text.replace(/\s+/g, ' ');
    let m = t.match(/^(?:≥|>=)\s*(\d{1,2})/); if (m) return w >= +m[1];
    m = t.match(/^>\s*(\d{1,2})/); if (m) return w > +m[1];
    m = t.match(/^(?:<|≤|<=)\s*(\d{1,2})/); if (m) return /^≤|^<=/.test(t) ? w <= +m[1] : w < +m[1];
    m = t.match(/^(\d{1,2})(?:\+(\d))?\s*(?:–|-|to)\s*(\d{1,2})(?:\+(\d))?\s*(?:w|wk|weeks)?\b/); if (m) return w >= +m[1] + (+m[2] || 0) / 7 && w <= +m[3] + (+m[4] || 6) / 7;
    if (/^(periviable|previable)/i.test(t)) return w < 26;
    return true;
  }
  function assessPlan(r, fl, routine) {
    fl = fl || {}; const f = r.facts || {}; const top = r.top;
    const L = ['ASSESSMENT AND PLAN (DRAFT, DECISION SUPPORT ONLY, CLINICIAN MUST VERIFY)'];
    if (!top && routine) {
      L.push('', 'ASSESSMENT', [fl.age && fl.age + ' yo', fl.gp, fl.ga && 'at ' + fl.ga].filter(Boolean).join(' ') + (fl.hpi ? ' with ' + fl.hpi : '') + '.', 'Routine encounter: ' + routine.label + '. No high-risk card matched; confirm no complicating condition.');
      L.push('', 'PLAN', '- ' + (routine.diagnosis || routine.label) + '.', '- Disposition: ' + (routine.disposition || fl.disposition || '[select]') + '.', '- Codes: routine set (PENDING DOC REVIEW) + Z3A from GA; see routine_codes.json rationale.', ...(routine.notes || []).map(n => '- ' + n), '- Codes are suggestions; provider verifies before billing.');
      L.push('', 'Generated on-device by rules. Not the medical record. Verify every element.'); return { text: L.join('\n'), sources: ['RT-' + routine.id] };
    }
    if (!top) { L.push('No confident card match. Add GA/postpartum status, vitals, or key symptom.'); return { text: L.join('\n'), sources: [] }; }
    const card = top.card || top.diagram; const w = f.gaWeeks != null ? f.ga : null;
    const status = f.postpartum ? 'postpartum' + (f.ppText ? ' (' + f.ppText + ')' : '') : f.labor ? 'in labor' : f.gaWeeks != null ? 'at ' + f.gaWeeks + 'w' + (f.gaDays || 0) + 'd' : '';
    const demo = [fl.age || (f.age != null ? f.age : '') ? (fl.age || f.age) + ' yo' : '', fl.gp || (f.G != null ? 'G' + f.G + 'P' + f.P : ''), status].filter(Boolean).join(' ');
    const vit = [];
    if (f.bpReadings) vit.push('BP ' + f.bpReadings.join(', ') + (f.severeBP ? ' (severe range)' : f.htn ? ' (>=140/90)' : ''));
    if (f.hr != null) vit.push('HR ' + f.hr); if (f.tempC != null) vit.push('T ' + f.tempC + ' C'); if (f.rr != null) vit.push('RR ' + f.rr);
    if (f.spo2 != null) vit.push('SpO2 ' + f.spo2 + '%'); if (f.qbl != null) vit.push('QBL ' + f.qbl + ' mL'); if (f.shockIndex != null) vit.push('SI ' + f.shockIndex);
    L.push('', 'ASSESSMENT');
    L.push((demo || 'Patient') + (fl.hpi ? ' with ' + fl.hpi.replace(/^with\s+/i, '') : '') + '.');
    if (vit.length) L.push('Pertinent: ' + vit.join('; ') + '.');
    if (r.flags && r.flags.length) L.push('Red flags: ' + r.flags.map(x => x.text).join('; ') + '.');
    L.push('Most consistent with: ' + card.title + ' (' + top.id + ').');
    const alts = (r.alternates || []).map(a => { const it = a.card || a.diagram; return it ? it.title + ' (' + a.id + ')' : ''; }).filter(Boolean);
    if (alts.length) L.push('Also consider: ' + alts.join('; ') + '.');
    L.push('', 'PLAN (from card ' + top.id + (top.card ? '' : ' flow') + ')');
    const src = top.card || top.diagram; const blocks = cardBlocks(src.html); const bottom = blocks.find(b => b.type === 'bottom');
    if (bottom) L.push('Bottom line: ' + bottom.text);
    let count = 0, head = null, skipped = 0;
    for (const b of blocks) {
      if (b.type === 'h') { head = b.text; continue; }
      if (b.type !== 'li') continue;
      if (!gaApplies(b.text, w)) { skipped++; continue; }
      if (count >= 12) break;
      if (head) { L.push(head.toUpperCase() + ':'); head = null; }
      L.push('- ' + b.text); count++;
    }
    if (skipped) L.push('(' + skipped + ' GA-specific item(s) omitted as not applicable to ' + f.gaWeeks + 'w; see card.)');
    if (r.coding) {
      const icd = r.coding.icd.filter(c => !c.alt && c.verified).map(c => c.code + ' ' + c.label);
      L.push('', 'CODES (suggested, verify): ' + icd.join('; ') + (r.coding.cpt.length ? ' | CPT ' + r.coding.cpt.slice(0, 2).map(c => c.code).join(', ') : ''));
    }
    if (src.flags && src.flags.length) L.push('Card has ' + src.flags.length + ' item(s) flagged for verification against house policy.');
    L.push('Disposition: ' + (fl.disposition || '[select]') + '.');
    L.push('', 'Generated on-device by rules from OBHG cards. Not the medical record. Verify every element.');
    return { text: L.join('\n'), sources: [top.id].concat((r.alternates || []).map(a => a.id)) };
  }

  // ---------- routine encounters (codes in routine_codes.json, PENDING DOC REVIEW) ----------
  function gaWeeks(ga) { const m = String(ga || '').replace(/\s/g, '').match(/^(\d{1,2})(?:w(\d)?d?)?$/i); return m ? +m[1] + (+m[2] || 0) / 7 : null; }
  function z3aFor(ga, R) {
    const w = gaWeeks(ga); if (w == null) return null; const wk = Math.floor(w);
    const c = wk < 8 ? 'Z3A.01' : wk > 42 ? 'Z3A.49' : 'Z3A.' + String(wk).padStart(2, '0');
    return !R || !R.z3a_valid || R.z3a_valid.includes(c) ? c : null;
  }
  const gaOk = (c, w) => w == null ? c.gaMax == null : (c.gaMin == null || w >= c.gaMin) && (c.gaMax == null || w <= c.gaMax); // unknown GA -> term-range codes
  const isO = c => /^O/.test(c);
  // Enforce Doc's ICD rules on a code list. Returns { list, notes }.
  function icdRules(list) {
    let l = list.filter(Boolean).filter((c, i, a) => a.indexOf(c) === i); const notes = [];
    if (l.includes('O80') && l.some(c => isO(c) && c !== 'O80')) { l = l.filter(c => c !== 'O80'); notes.push('O80 removed: never coded with another O code.'); }
    if (l.includes('O80') && !l.includes('Z37.0')) { l.splice(l.indexOf('O80') + 1, 0, 'Z37.0'); notes.push('Z37.0 added: required with O80.'); }
    if (/^Z03\.7/.test(l[0] || '') && !l.some(isO) && l.some(c => /^Z3A/.test(c))) { l = l.filter(c => !/^Z3A/.test(c)); notes.push('Z3A removed: not used with Z03.7x primary unless an O code is present.'); }
    return { list: l, notes };
  }
  // opts: { delivered: bool, patient: 'NEW'|'EST', obs: ''|'same'|'multi', surgeon: bool }
  function routineFill(R, id, fl, opts) {
    const set = R.sets.find(x => x.id === id); if (!set) return null; fl = fl || {}; opts = opts || {}; const w = gaWeeks(fl.ga);
    const ER = R.em_rules, LB = R.em_labels || {}, TRK = ' (OBHG tracking, not billed)';
    const alts = []; const notes = (set.notes || []).slice();
    const alt = (code, kind, label, rationale) => { if (!alts.some(a => a.code === code && a.kind === kind)) alts.push({ code, kind, label: label || LB[code] || '', rationale: rationale || '' }); };
    let icd = set.icd.filter(c => !c.alt && gaOk(c, w)).map(c => c.code);
    set.icd.filter(c => c.alt || !gaOk(c, w)).forEach(c => { if (c.alt) alt(c.code, 'ICD', c.label, c.rationale); });
    if (id === 'RULEOUT') { const rom = /\b(srom|rom|leak\w*|fluid|rupture)\b/i.test(fl.hpi || ''); const keep = icd.filter(c => rom ? c === 'Z03.71' : c !== 'Z03.71'); icd = keep.length ? keep : ['Z03.71']; }
    const z = z3aFor(fl.ga, R);
    if (z && (set.z3a === 'yes' || set.z3a === 'ifga' || (set.z3a === 'optional' && icd.some(isO)))) icd.push(z);
    else if (z && set.z3a === 'optional') alt(z, 'ICD', 'Weeks of gestation (optional)', 'Optional with Z03.71 primary; for inpatient use GA on admission date.');
    const ir = icdRules(icd); icd = ir.list; notes.push(...ir.notes);
    const cpt = []; const office = () => { const o = opts.patient === 'EST' ? ER.est : ER.new; [o.default].concat(o.alts).forEach(c => alt(c, 'CPT', LB[c], o.label)); };
    const obsMulti = () => { const o = opts.obs === 'same' ? ER.obs_same : ER.obs_multi; cpt.push(...o.default); o.alts.forEach(c => alt(c, 'CPT', LB[c], o.label)); notes.push(R.obs_note); }; // opts.obs: '' | 'same' | 'multi'
    const delivery = set.cpt.filter(c => c.when === 'delivered');
    if (set.em === 'admit') {
      if (opts.delivered) { delivery.filter(c => !c.alt).forEach(c => cpt.push(c.code)); delivery.filter(c => c.alt).forEach(c => alt(c.code, 'CPT', c.label, c.rationale)); }
      else delivery.forEach(c => alt(c.code, 'CPT', c.label, c.rationale + ' (when delivered)'));
      if (opts.obs) obsMulti(); else { cpt.push(ER.admit.default + (opts.delivered ? TRK : '')); ER.admit.alts.forEach(c => alt(c, 'CPT', LB[c], ER.admit.label)); }
      if (opts.delivered) notes.push('Admit E/M logged with delivery code: tracking only (OBHG), not billed.');
    } else if (set.em === 'ed' || (set.em === 'surgeon' && !opts.surgeon)) {
      if (opts.obs) obsMulti(); else { cpt.push(ER.ed.default); ER.ed.alts.forEach(c => alt(c, 'CPT', LB[c], ER.ed.label)); }
      office(); if (set.admitAlt) [ER.admit.default].concat(ER.admit.alts).forEach(c => alt(c, 'CPT', LB[c], 'If admitted'));
    } else if (set.em === 'surgeon') cpt.push(ER.surgeon.default);
    set.cpt.filter(c => !c.when).forEach(c => c.alt ? alt(c.code, 'CPT', c.label, c.rationale) : cpt.push(c.code));
    return { set, diagnosis: set.diagnosis, icd: icd.join(', '), cpt: cpt.join(', '), disposition: set.disposition, card: /OTHER$/.test(id) ? '' : 'RT-' + id,
      needsGA: (set.z3a === 'yes') && !z, alts, notes, disclaimer: R.disclaimer };
  }
  function serviceFor(mode, fl) { return mode === 'OB' || mode === 'GYN' ? mode : (fl && (String(fl.ga || '').trim() || String(fl.gp || '').trim()) ? 'OB' : 'GYN'); } // auto: blank GA + G/P = GYN
  function routineMatch(R, text, book) {
    const t = ' ' + String(text || '').toLowerCase() + ' '; let best = null;
    for (const set of R.sets.filter(x => !book || (x.book || 'OB') === book)) for (const k of set.keywords) {
      const re = new RegExp('(^|[^a-z])' + k.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&') + '([^a-z]|$)');
      if (re.test(t) && (!best || k.length > best.k.length)) best = { id: set.id, k };
    }
    return best ? best.id : null;
  }
  // Search ICD/CPT across app code tables, CMS-validated descriptions, and routine list.
  function codeIndex(T, V, R) {
    const m = new Map(); const add = (code, label, kind, src) => { const k = kind + code; if (!m.has(k)) m.set(k, { code, label, kind, src }); };
    if (R) { for (const s of R.sets) { for (const c of s.icd) add(c.code, c.label, 'ICD', 'routine (pending review)'); for (const c of s.cpt) add(c.code, c.label, 'CPT', 'routine (pending review)'); } for (const [c, l] of Object.entries(R.em_labels || {})) add(c, l, 'CPT', 'E/M (pending review)'); }
    if (V) for (const [c, v] of Object.entries(V.codes)) add(c, v.desc_fy2026 || '', 'ICD', 'CMS FY2026');
    if (R && R.z3a_valid) for (const c of R.z3a_valid) add(c, 'Weeks of gestation', 'ICD', 'CMS FY2026');
    if (T) { for (const e of T.em) add(e.code, e.label, 'CPT', 'E/M'); for (const card of Object.values(T.cards)) for (const c of card.cpt || []) add(c.code, c.label, 'CPT', 'app table'); }
    return [...m.values()];
  }
  function codeSearch(idx, q, max) {
    q = String(q || '').trim().toLowerCase(); if (q.length < 2) return [];
    const qc = q.replace(/\./g, ''); const words = q.split(/\s+/);
    const hits = idx.filter(x => x.code.toLowerCase().replace(/\./g, '').startsWith(qc) || words.every(w => x.label.toLowerCase().includes(w)));
    hits.sort((a, b) => (b.code.toLowerCase().replace(/\./g, '').startsWith(qc)) - (a.code.toLowerCase().replace(/\./g, '').startsWith(qc)) || a.code.localeCompare(b.code));
    return hits.slice(0, max || 20);
  }
  const addCode = (field, code) => { const list = String(field || '').split(/\s*,\s*/).filter(Boolean); if (!list.includes(code)) list.push(code); return list.join(', '); };

  const api = { icdRules, serviceFor, gaWeeks, z3aFor, routineFill, routineMatch, codeIndex, codeSearch, addCode, parseSummary, composeText, assessPlan, cardBlocks, gaApplies, AMEND_FIELDS, PREFIX, K_PROFILE, K_LOGS, RETAIN_DEFAULT, RETENTION_OPTS, shiftLabel, DISPOSITIONS, COLS, shiftStart, shiftKey, shiftRange, validateEntry, Store, buildPDF, suggest, mem };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ShiftLog = api;
})(typeof self !== 'undefined' ? self : this);
