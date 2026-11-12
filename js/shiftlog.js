/* OBHG Shift Patient Log — pure logic: shift window, validation, storage, purge, PDF.
 * Storage is device-local (localStorage, keys prefixed 'shiftlog_'). External lookups are explicit, reviewed actions; no automatic transmission. */
(function (root) {
  'use strict';
  const PREFIX = 'shiftlog_';
  const FLOW_TEXT = typeof module !== 'undefined' && module.exports ? require('./flowplans.js') : root.FlowPlanText || {};
  const K_PROFILE = PREFIX + 'profile', K_LOGS = PREFIX + 'logs';
  const RETAIN_DEFAULT = 30;
  const DISPOSITIONS = ['Discharged home', 'Admitted L&D', 'Admitted antepartum', 'Admitted GYN', 'Admitted postpartum', 'Observation', 'To OR', 'Transferred', 'Other'];
  const AMEND_FIELDS = ['initials', 'age', 'ga', 'gp', 'diagnosis', 'icd', 'cpt', 'disposition', 'clinic', 'plan', 'card'];
  const COLS = ['Initials', 'G/P', 'GA', 'Clinic', 'Age', 'Diagnosis', 'ICD', 'CPT', 'Disposition', 'Time (CT)', 'Plan'];
  const LOG_FIELDS = ['initials', 'gp', 'ga', 'clinic', 'age', 'diagnosis', 'icd', 'cpt', 'disposition', 'ts', 'plan'];
  const PLAN_LIMIT = 240;
  // Normalize presentation only: legacy records keep their original values/audit trails.
  function normalizeGP(value) {
    const t = String(value == null ? '' : value).trim();
    let m = t.match(/^(\d{1,2})\s*\/\s*(\d{1,2})(?:\s*\([^)]*\))?$/);
    if (!m) m = t.match(/\b(?:G|gravida)\s*(\d{1,2})\s*(?:P|para)\s*(\d{1,2})(?!\d)/i);
    if (!m && !/(?:P|para)\s*\d/i.test(t)) m = t.match(/\b(?:G|gravida)\s*(\d{1,2})\b/i);
    return m ? Number(m[1]) + '/' + Number(m[2] || 0) : '';
  }
  function logTime(value) {
    if (!value || !Number.isFinite(new Date(value).getTime())) return '';
    return new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(value));
  }
  // Extract (never invent) up to three PLAN actions. Omitted text is marked '...'.
  // Full A&P remains in its existing on-screen boxes; it is never persisted here.
  function summarizePlan(value) {
    const text = String(value || '').trim(); if (!text || text.includes('FLOW BRANCH REFERENCE:')) return '';
    const lines = text.split(/\r?\n/); const start = lines.findIndex(l => /^PLAN(?:\s*\(|\s*:|\s*$)/i.test(l.trim()));
    if (start < 0 && /^ASSESSMENT AND PLAN\b/i.test(text)) return '';
    let actions;
    if (start >= 0) {
      const body = [];
      for (const line of lines.slice(start + 1)) {
        if (/^(?:CODES\b|Generated on-device\b|Card has\b|Disposition:)/i.test(line.trim())) break;
        body.push(line.trim());
      }
      const bullets = body.filter(l => /^[-•]\s+/.test(l));
      actions = bullets.length ? bullets : body.filter(l => /^Bottom line:/i.test(l));
    } else actions = lines.map(l => l.trim()).filter(Boolean);
    actions = actions.map(l => l.replace(/^[-•]\s+|^Bottom line:\s*/gi, '').replace(/\s+/g, ' ').trim())
      .filter(l => l && !/^(?:Codes?:|Codes are suggestions|Generated on-device|Disposition:)/i.test(l));
    const omitted = actions.length > 3; let out = actions.slice(0, 3).join('; ');
    if (out.length > PLAN_LIMIT - (omitted ? 3 : 0)) {
      out = out.slice(0, PLAN_LIMIT - 3).replace(/\s+\S*$/, '').replace(/[;,.\s]+$/, '') + '...';
    } else if (omitted) out = out.replace(/[;.\s]+$/, '') + '...';
    return out;
  }
  function entryCells(entry) {
    return LOG_FIELDS.map(f => f === 'gp' ? normalizeGP(entry.gp) : f === 'ts' ? logTime(entry.ts) : f === 'plan' ? summarizePlan(entry.plan) : (entry[f] == null ? '' : String(entry[f])));
  }

  const UPDATE_LIMIT = 2000;
  // Updates are append-only and separate from the 240-character Plan summary.
  function updateText(u) { return logTime(u.ts) + ' CT update: ' + u.text; }
  function validateUpdate(text) {
    const t = String(text || '').trim();
    if (!t) return ['Enter an update.'];
    if (t.length > UPDATE_LIMIT) return ['Update must be 2000 characters or less.'];
    return privacyIssues(t);
  }
  // Conservative guard, not an anonymizer. The user must review clinical free text.
  function privacyIssues(text) {
    const t = String(text || '');
    return /\b\d{5,}\b|\b\d{1,4}[\/-]\d{1,2}[\/-]\d{1,4}\b|\b\d{1,2}:\d{2}\b|\b(?:MRN|DOB|SSN|patient\s*(?:name|id)|name\s*:|address\s*:|phone\s*:|email\s*:)|\b(?:medical record|account (?:no|number)|name is|named)\b|\b[A-Z][a-z]{2,},\s*[A-Z][a-z]{2,}\b|\b\d{1,2}\s*(?:am|pm)\b|\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}\b|[\w.+-]+@[\w.-]+\.\w+|\b\d{3}[-. )]+\d{3}[-. ]+\d{4}\b/i.test(t)
      ? ['Remove identifiers, dates, times, contact details, and long numbers.'] : [];
  }
  // Deliberately whitelist only diagnosis, normalized GA, and the ephemeral question.
  // Never serialize a row, Plan, updates, or demographics to an external service.
  function readableLookupText(value) {
    let text = String(value || '').trim();
    // Accept accidentally pasted URL-encoded clinical text, but validate AFTER decoding.
    for (let i = 0; i < 2 && /%[0-9a-f]{2}/i.test(text); i++) {
      try { text = decodeURIComponent(text); } catch (_) { throw new Error('Use plain readable clinical text, not encoded text or a URL.'); }
    }
    if (/%[0-9a-f]{2}|https?:\/\/|www\./i.test(text)) throw new Error('Use plain readable clinical text, not a URL.');
    return text.replace(/\s+/g, ' ');
  }
  function lookupQuery(entry, question) {
    const diagnosis = readableLookupText(entry.diagnosis);
    const q = readableLookupText(question);
    if (!diagnosis) throw new Error('Diagnosis is required for lookup.');
    if (diagnosis.length > 120 || q.length > 500) throw new Error('Keep the clinical question under 500 characters.');
    const ga = String(entry.ga || '').replace(/\s/g, '');
    if (ga && (!/^(?:[0-3]?\d|4[0-5])(?:w(?:[0-6]d?)?)?$/i.test(ga))) throw new Error('Use only gestational age, e.g. 32w1d.');
    const text = [diagnosis, q].join(' ');
    if (privacyIssues(text).length || /\b(?:G\s*\d+\s*P\s*\d+|\d+\s*\/\s*\d+|\d{1,3}\s*(?:yo|y\/o|years?[- ]old)|(?:age|initials|born|patient|pt|Mrs|Ms|Mr|Dr)\b|(?:19|20)\d{2})\b/i.test(text))
      throw new Error('Remove all identifiers and demographics from diagnosis/question; clinical terms only.');
    const initials = String(entry.initials || '').trim();
    if (initials && /^[A-Za-z]{2,3}$/.test(initials) && new RegExp('\\b' + initials + '\\b', 'i').test(text))
      throw new Error('Remove patient initials from diagnosis/question.');
    // A bare age matching this row is also blocked (conservative: may flag a dose).
    const age = String(entry.age || '').trim();
    if (/^\d{1,3}$/.test(age) && new RegExp('\\b' + age + '\\b').test(text)) throw new Error('Remove the age from diagnosis/question.');
    return 'Diagnosis: ' + diagnosis + (ga ? '; GA: ' + ga : '') + (q ? '; Clinical question: ' + q : '');
  }
  function lookupPayload(entry, question) {
    const text = lookupQuery(entry, question);
    return { text, grokURL: 'https://grok.com/?q=' + encodeURIComponent(text), openEvidenceURL: 'https://www.openevidence.com/' };
  }
  function closeoutSummary(shift) {
    const active = shift.entries.filter(e => !e.voided);
    const open = active.filter(e => !['Discharged home', 'Transferred'].includes(e.disposition));
    return { active: active.length, open, inpatients: open.filter(e => /^Admitted\b/.test(e.disposition || '')) };
  }

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
    if (e.gp && !normalizeGP(e.gp)) errs.push('G/P format e.g. 2/1, G2P1, G1, or G0.');
    if (!e.diagnosis) errs.push('Diagnosis required.');
    if (!e.disposition) errs.push('Disposition required.');
    for (const f of ['diagnosis', 'icd', 'cpt', 'clinic']) if ((e[f] || '').length > 120) errs.push(f + ' too long.');
    if ((e.plan || '').length > PLAN_LIMIT) errs.push('Plan must be a short summary (240 characters or less).');
    // Block obvious identifiers in any text field
    const joined = [e.diagnosis, e.icd, e.cpt, e.clinic, e.plan].join(' ');
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
    const mk = (o, t) => { let id = 's' + t.getTime(); while (o[id]) id += 'b'; o[id] = { id, start: t.toISOString(), end: null, entries: [] }; return o[id]; };
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
        for (const c of AMEND_FIELDS) rec[c] = String(entry[c] == null ? '' : entry[c]).trim();
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
      appendUpdate(id, n, text, now) {
        const t = String(text || '').trim(), errs = validateUpdate(t);
        if (errs.length) throw new Error(errs.join(' '));
        const o = load(), sh = o[id], r = ((sh || {}).entries || []).find(x => x.n === n);
        if (!r || r.voided || sh.end) throw new Error('Updates require an active row in an open shift.');
        const u = { ts: new Date(now || Date.now()).toISOString(), text: t };
        (r.updates = r.updates || []).push(u); save(o); return u;
      },
      // Queue is stored inside the finalized shift, atomically with its closure.
      // Retention/purge thus removes its unimported carry-overs too; no orphan copy.
      finalize(id, carryNumbers, now) {
        const o = load(), sh = o[id];
        if (!sh || sh.end) throw new Error('This shift is already closed.');
        const eligible = closeoutSummary(sh).open.map(e => e.n);
        const selected = [...new Set(carryNumbers || [])];
        if (selected.some(n => !eligible.includes(n))) throw new Error('Only open, non-voided rows can carry over.');
        const t = new Date(now || Date.now());
        if (t < new Date(sh.start)) throw new Error('Closeout cannot precede shift start.');
        sh.end = t.toISOString(); sh.finalizedTs = sh.end;
        sh.carryover = { selected, imported: {} }; mk(o, t); save(o); return sh;
      },
      pendingCarryovers() {
        return Object.values(load()).filter(sh => sh.end && sh.carryover).flatMap(sh => sh.carryover.selected
          .filter(n => !sh.carryover.imported[n])
          .map(n => ({ key: sh.id + ':' + n, shiftId: sh.id, shiftStart: sh.start, entry: sh.entries.find(e => e.n === n && !e.voided) }))
          .filter(x => x.entry));
      },
      importCarryovers(keys, targetId, now) {
        const o = load(), target = o[targetId];
        if (!target || target.end) throw new Error('Choose an open destination shift.');
        let count = 0;
        for (const key of new Set(keys || [])) {
          const split = key.lastIndexOf(':'), id = key.slice(0, split), n = +key.slice(split + 1), sh = o[id];
          if (!sh || !sh.end || !sh.carryover || !sh.carryover.selected.includes(n) || sh.carryover.imported[n]) continue;
          const e = sh.entries.find(e => e.n === n && !e.voided); if (!e) continue;
          const rec = { n: target.entries.length + 1, ts: new Date(now || Date.now()).toISOString(), voided: false,
            carriedFrom: { shiftId: id, n, ts: e.ts }, updates: JSON.parse(JSON.stringify(e.updates || [])) };
          for (const f of AMEND_FIELDS) rec[f] = e[f] || '';
          target.entries.push(rec); sh.carryover.imported[n] = targetId; count++;
        }
        save(o); return count;
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
    const W = 792, H = 612, M = 36;
    // Reference shift-log builder proportions, scaled to the printable 720 pt width.
    const proportions = [40, 28, 36, 56, 28, 100, 76, 76, 72, 32, 176];
    const widths = proportions.map(w => w * (W - 2 * M) / proportions.reduce((a, b) => a + b, 0));
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
      let x = M; COLS.forEach((c, i) => { wrap(c, widths[i] - 4, 7).forEach((ln, j) => T(x + 2, y - j * 9, ln, 7, true)); x += widths[i]; }); y -= 14; L(M, y, W - M, y, 1); y -= 11;
    };
    const newPage = () => { if (ops.length) { footer(); pages.push(ops); } ops = []; header(); };
    newPage();
    const live = entries.filter(e => !e.voided).length;
    if (!entries.length) { T(M, y, 'No entries this shift.', 10, false); y -= 14; }
    for (const e of entries) {
      const values = entryCells(e);
      values[5] += (e.voided ? ' [VOIDED]' : '') + (e.amendedTs ? ' [AMENDED ' + fmt(e.amendedTs) + ']' : '');
      const cells = values.map((v, i) => wrap(v, widths[i] - 4, 7));
      const lines = Math.max(...cells.map(c => c.length)); const h = lines * 10 + 4;
      if (y - h < 50) newPage();
      let x = M; cells.forEach((c, i) => { c.forEach((ln, j) => T(x + 2, y - j * 10, ln, 7, false)); x += widths[i]; });
      if (e.voided) for (let j = 0; j < lines; j++) L(M, y - j * 10 + 3, W - M, y - j * 10 + 3, 0.7);
      y -= h; L(M, y + 8, W - M, y + 8, 0.2);
      const notes = (e.carriedFrom ? ['Carried over from prior shift, entry #' + e.carriedFrom.n + '. Verify current status.'] : [])
        .concat((e.updates || []).map(updateText));
      for (const note of notes) for (const ln of wrap('Entry #' + e.n + ' - ' + note, W - 2 * M - 8, 8)) {
        if (y - 14 < 50) newPage();
        T(M + 4, y, ln, 8, false); y -= 11;
      }
      if (notes.length) { y -= 5; L(M, y + 8, W - M, y + 8, 0.2); }

    }
    if (y - 18 < 50) newPage();
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
      gp: f.G != null ? 'G' + f.G + 'P' + (f.P == null ? 0 : f.P) : '',
      diagnosis: item ? ((typeof self !== 'undefined' && self.DisplayNames && self.DisplayNames.title(item)) || item.title) : '',
      card: top ? top.id : '',
      icd: cd ? cd.icd.filter(c => !c.alt && c.verified).map(c => c.code).join(', ') : '',
      cpt: cd ? cd.cpt.slice(0, 2).map(c => c.code).join(', ') : '',
    };
  }

  // ---------- summary -> structured fields ----------
  const NOT_INITIALS = new Set(['AN', 'AS', 'AT', 'NO', 'YES', 'THE', 'SHE', 'HER', 'HE', 'HIS', 'HAS', 'FOR', 'NEW', 'NOW', 'NOT', 'AND', 'ALL', 'OUT', 'BP', 'HR', 'RR', 'GA', 'PP', 'CS', 'SVD', 'IUP', 'LMP', 'RLQ', 'LLQ', 'RUQ', 'LUQ', 'ED', 'OR', 'LD', 'POD', 'PPD', 'IOL', 'ROM', 'GBS', 'HCG', 'EBL', 'QBL', 'FHR', 'TOA', 'PID', 'AUB', 'VTE', 'DVT', 'PE', 'UTI', 'IUD', 'NST', 'BPP', 'AFI', 'MVP', 'PTL', 'IAI', 'HTN', 'CAT', 'SOB', 'CP', 'HA', 'LOF', 'VB', 'PT', 'YO', 'NPO', 'IV', 'OB', 'GYN', 'MFM', 'ICU', 'CPT', 'ICD']);
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
    // Leading initials need not be followed by an age: phone dictation often starts
    // 'AB. leaking fluid'. Title-case tokens require a demographic prefix to avoid pronouns.
    const explicit = t.match(/\binitials?\s*:?\s*([A-Za-z]{2,3})\b/i);
    const leading = t.match(/^\s*(?:pt\.?\s+)?([A-Z]{2,3}|[A-Z][a-z]{1,2})\b(?=[\s.,:;\u2013\u2014-]|$)/);
    const m = explicit || leading;
    const demographicLead = leading && /^\s*[.,:;-]?\s*\d{1,3}\s*(?:yo|y\/o|years?[- ]old)\b/i.test(t.slice(leading[0].length));
    if (m && (explicit || demographicLead || (/^[A-Z]{2,3}$/.test(m[1]) && !NOT_INITIALS.has(m[1].toUpperCase())))) out.initials = m[1].toUpperCase();
    if (f.age != null) out.age = String(f.age);
    if (f.G != null) out.gp = 'G' + f.G + 'P' + (f.P == null ? 0 : f.P) + (f.TPAL ? ' (' + f.TPAL + ')' : '');
    if (f.gaWeeks != null) out.ga = f.gaWeeks + 'w' + (f.gaDays || 0) + 'd';
    for (const [re, d] of DISPO_RULES) if (re.test(t)) { out.disposition = d; break; }
    // HPI = summary with the demographic prefix removed (stays on screen only; never stored)
    let h = t.replace(/\binitials?\s*:?\s*[A-Za-z]{2,3}\b[,;:]?/i, ' ');
    if (out.initials) h = h.replace(new RegExp('^\\s*(?:pt\\.?\\s+)?' + out.initials + '\\b[.,;:]?', 'i'), ' ');
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
    if (fl.gp) { const gp = normalizeGP(fl.gp); parts.push(gp ? gp.replace(/^(\d+)\/(\d+)$/, 'G$1P$2') : fl.gp.replace(/\s*\(.*\)/, '')); }
    if (fl.ga) { const g = String(fl.ga).replace(/\s/g, ''); parts.push('at ' + (/^\d{1,2}$/.test(g) ? g + ' weeks' : g)); }
    if (fl.hpi) parts.push('with ' + fl.hpi);
    if (fl.diagnosis) parts.push(fl.diagnosis);
    if (fl.summary) parts.push(fl.summary);
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  }

  // ---------- deterministic ASSESSMENT AND PLAN draft from existing card content ----------
  const ent = s => String(s).replace(/<br\s*\/?>/gi, ' ').replace(/<sup(?:er)?>([\s\S]*?)<\/sup(?:er)?>/gi, '^$1')
    .replace(/<[^>]+>/g, '').replace(/&#(x[0-9a-f]+|\d+);/gi, (_, n) => String.fromCodePoint(n[0].toLowerCase() === 'x' ? parseInt(n.slice(1), 16) : +n))
    .replace(/&(lt|gt|quot|apos|nbsp|le|ge|amp);/g, (_, n) => ({lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',le:'≤',ge:'≥',amp:'&'}[n]))
    .replace(/\s+/g, ' ').trim();
  function cardBlocks(html) { // preserve attributed list items, headings, action paragraphs, and table rows
    html = String(html || ''); const out = [];
    const re = /<(p|li|h[1-6]|tr)\b([^>]*)>([\s\S]*?)<\/\1>/gi; let m;
    while ((m = re.exec(html))) {
      const tag = m[1].toLowerCase(), body = m[3], text = ent(body); if (!text) continue;
      if (tag === 'tr') {
        const cells = [...body.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(x => ent(x[1]));
        out.push({ type: /<th\b/i.test(body) ? 'h' : 'li', text: cells.join(' | ') });
      } else if (/bottomline/i.test(m[2]) || /^BOTTOM LINE\b/i.test(text)) out.push({ type: 'bottom', text: text.replace(/^BOTTOM LINE\.?\s*/i, '') });
      else if (/^h/.test(tag) || (tag === 'p' && /^\s*<(?:ul|ol|table)\b/i.test(html.slice(re.lastIndex)))) out.push({ type: 'h', text });
      else out.push({ type: 'li', text });
    }
    return out;
  }
  function planSource(top, content) {
    const items = ((content || root.CONTENT || {}).items || []);
    const diagram = top.diagram;
    const card = top.card || items.find(i => i.kind === 'card' && i.id === ((diagram || {}).card || top.id));
    for (const source of [card, diagram].filter(Boolean)) {
      const blocks = cardBlocks(source.html);
      if (blocks.some(b => b.type !== 'h')) return { source, blocks, flowReference: false };
    }
    const reference = diagram && FLOW_TEXT[diagram.id];
    if (reference && (!diagram.sha || reference.sourceSHA256.startsWith(diagram.sha)))
      return { source: diagram, blocks: reference.blocks, flowReference: true };
    return { source: card || diagram, blocks: [], flowReference: false };
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
  function assessPlan(r, fl, routine, content) {
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
    const demo = [fl.age || (f.age != null ? f.age : '') ? (fl.age || f.age) + ' yo' : '', fl.gp || (f.G != null ? 'G' + f.G + 'P' + (f.P == null ? 0 : f.P) : ''), status].filter(Boolean).join(' ');
    const vit = [];
    if (f.bpReadings) vit.push('BP ' + f.bpReadings.join(', ') + (f.severeBP ? ' (severe range)' : f.htn ? ' (>=140/90)' : ''));
    if (f.hr != null) vit.push('HR ' + f.hr); if (f.tempC != null) vit.push('T ' + f.tempC + ' C'); if (f.rr != null) vit.push('RR ' + f.rr);
    if (f.spo2 != null) vit.push('SpO2 ' + f.spo2 + '%'); if (f.qbl != null) vit.push('QBL ' + f.qbl + ' mL'); if (f.shockIndex != null) vit.push('SI ' + f.shockIndex);
    L.push('', 'ASSESSMENT');
    L.push((demo || 'Patient') + (fl.hpi ? ' with ' + fl.hpi.replace(/^with\s+/i, '') : '') + '.');
    if (vit.length) L.push('Pertinent: ' + vit.join('; ') + '.');
    if (r.flags && r.flags.length) L.push('Red flags: ' + r.flags.map(x => x.text).join('; ') + '.');
    const DN = typeof self !== 'undefined' ? self.DisplayNames : null, nm = it => (DN && DN.title(it)) || it.title;
    L.push('Most consistent with: ' + nm(card) + '.');
    const alts = (r.alternates || []).map(a => { const it = a.card || a.diagram; return it ? nm(it) : ''; }).filter(Boolean);
    if (alts.length) L.push('Also consider: ' + alts.join('; ') + '.');
    const extracted = planSource(top, content), src = extracted.source, blocks = extracted.blocks;
    L.push('', 'PLAN (from ' + (src.kind === 'diagram' ? 'flow ' : 'card ') + src.id + ')');
    if (extracted.flowReference) L.push('FLOW BRANCH REFERENCE: follow the matched diagram arrows; alternative branches are not simultaneous orders.');
    let count = 0, heads = [], skipped = 0;
    for (const b of blocks) {
      if (b.type === 'h') { heads.push(b.text); continue; }
      if (b.type === 'bottom') { L.push('Bottom line: ' + b.text); continue; }
      if (b.type !== 'li') continue;
      if (!gaApplies(b.text, w)) { skipped++; continue; }
      if (heads.length) { L.push(...heads.map(text => text + ':')); heads = []; }
      L.push('- ' + b.text); count++;
    }
    if (!count && !blocks.some(b => b.type === 'bottom')) L.push('No extractable action text is available. Open the matched source and verify its plan; no clinical content was invented.');
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

  const api = { readableLookupText, lookupPayload, planSource, UPDATE_LIMIT, updateText, validateUpdate, privacyIssues, lookupQuery, closeoutSummary, LOG_FIELDS, PLAN_LIMIT, normalizeGP, logTime, summarizePlan, entryCells, icdRules, serviceFor, gaWeeks, z3aFor, routineFill, routineMatch, codeIndex, codeSearch, addCode, parseSummary, composeText, assessPlan, cardBlocks, gaApplies, AMEND_FIELDS, PREFIX, K_PROFILE, K_LOGS, RETAIN_DEFAULT, RETENTION_OPTS, shiftLabel, DISPOSITIONS, COLS, shiftStart, shiftKey, shiftRange, validateEntry, Store, buildPDF, suggest, mem };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ShiftLog = api;
})(typeof self !== 'undefined' ? self : this);
