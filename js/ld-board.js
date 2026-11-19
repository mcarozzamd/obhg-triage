/* L&D labor board: local IndexedDB only; share is user-initiated. */

const SITES = self.LD_BOARD_SITES;
const EXAMPLES = self.LD_BOARD_EXAMPLES;
const CHECKOUT_TIMES = ["21:00", "02:00"];
const STALE_H = 3;
const PURGE_H = 24;
const PROVIDERS = ["hospitalist", "CNM", "private"];
const TZ = "America/Chicago";
const SHARE_DISCLAIMER = "only use encrypted, hospital-approved email or Bluetooth functions like iPhone AirDrop";
const DB_NAME = "obhg-ld-board";
const DB_STORE = "boards";

const params = new URLSearchParams(location.search);
const siteId = (params.get("site") || "unit").toLowerCase();
const SITE = SITES[siteId] || SITES.unit;
const EXAMPLE = EXAMPLES[siteId] || EXAMPLES.unit || {};
const STORAGE_KEY = "ldb.v2." + siteId;

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
function idbOp(mode, fn) {
  return openDb().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, mode);
    const store = tx.objectStore(DB_STORE);
    let req;
    try { req = fn(store); } catch (e) { db.close(); reject(e); return; }
    tx.oncomplete = () => { const val = req ? req.result : undefined; db.close(); resolve(val); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  }));
}
function idbGet(key) { return idbOp("readonly", store => store.get(key)); }
function idbSet(key, value) { return idbOp("readwrite", store => store.put(value, key)); }
function idbDel(key) { return idbOp("readwrite", store => store.delete(key)); }


let state = emptyState();
let view = params.get("view") || "occupied";
let expandAll = params.get("expand") === "1";
let pendingParse = null;

function emptyState() {
  return { site: siteId, savedAt: null, example: false, asOf: null, patients: {}, unassigned: [] };
}
function realNow() { return new Date(); }
function clock() { return (state.example && state.asOf) ? new Date(state.asOf) : realNow(); }
function iso(d) { return d.toISOString(); }
function parseISO(s) { if (!s) return null; const d = new Date(s); return isNaN(d) ? null : d; }
function hoursAgo(ts, now) {
  const d = parseISO(ts);
  return d ? (now.getTime() - d.getTime()) / 3600000 : null;
}
function isStale(ts, now) { const h = hoursAgo(ts, now); return h != null && h > STALE_H; }
function isDueAt(ts, now) { const d = parseISO(ts); return d && d.getTime() <= now.getTime(); }
function isImminent(ts, now, hours) {
  const d = parseISO(ts);
  if (!d) return false;
  const h = (d.getTime() - now.getTime()) / 3600000;
  return h > 0 && h <= hours;
}
function fmtTime(ts) {
  const d = parseISO(ts);
  if (!d) return "";
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: false }).format(d);
  } catch (e) { return d.toTimeString().slice(0, 5); }
}
function fmtDateTime(ts) {
  const d = parseISO(ts);
  if (!d) return "";
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short", month: "short", day: "numeric",
      year: "numeric", hour: "numeric", minute: "2-digit", hour12: false }).format(d) + " CT";
  } catch (e) { return d.toString(); }
}
function roomList() {
  const rooms = (SITE.rooms || []).map(String);
  for (const r of (SITE.antepartumRooms || []).map(String)) {
    if (rooms.indexOf(r) < 0) rooms.push(r);
  }
  return rooms;
}
function patientAt(room) { return state.patients[String(room)] || null; }
function allPatients() {
  const out = [];
  for (const r of roomList()) {
    const p = patientAt(r);
    if (p) out.push(Object.assign({ room: String(r) }, p));
  }
  for (const p of state.unassigned || []) out.push(Object.assign({ room: "", unassigned: true }, p));
  return out;
}
function enabledItems(mode) {
  const list = ((SITE.checklist || {})[mode] || []);
  return list.filter(i => i && i.id && i.enabled !== false);
}
function fget(p, id) {
  const f = (p && p.fields) ? p.fields[id] : null;
  if (!f) return { value: "", updated: null };
  if (typeof f === "string") return { value: f, updated: p.updated || null };
  return { value: f.value || "", updated: f.updated || null };
}
function optionLabel(id, opt) {
  const map = { pos: "GBS+", neg: "GBS−", unknown: "Unknown", yes: "Yes", no: "No",
    in: "In", out: "Out", requested: "Requested", immune: "Immune", nonimmune: "Nonimmune" };
  if (id === "cook") return "Cook " + opt;
  return map[opt] || opt;
}
function fieldSummary(p) {
  const bits = [];
  const exam = fget(p, "exam").value;
  const oxy = fget(p, "oxytocin").value;
  const cook = fget(p, "cook").value;
  const epi = fget(p, "epidural").value;
  const route = fget(p, "delivery_route").value;
  const time = fget(p, "delivery_time").value;
  const who = fget(p, "who_delivered").value;
  if (exam) bits.push(exam);
  if (oxy) bits.push(oxy === "on" ? "oxytocin" : ("oxytocin " + oxy));
  if (cook) bits.push("Cook " + cook);
  if (epi) bits.push("epi " + epi);
  if (route) bits.push([route, time, who].filter(Boolean).join(" · "));
  if (p.next_due) bits.push("due " + fmtTime(p.next_due));
  return bits.join(" · ");
}

function applyLoaded(s) {
  const saved = parseISO(s && s.savedAt);
  if (saved && (realNow() - saved) / 3600000 > PURGE_H) {
    state = emptyState();
    return "purged";
  }
  state = Object.assign(emptyState(), s || {});
  state.patients = state.patients || {};
  state.unassigned = state.unassigned || [];
  return "loaded";
}
async function loadState() {
  try {
    const rec = await idbGet(STORAGE_KEY);
    if (rec) {
      const status = applyLoaded(rec);
      if (status === "purged") { try { await idbDel(STORAGE_KEY); } catch (e) {} }
      return status;
    }
  } catch (e) { /* fall through to localStorage migration */ }
  let raw = null;
  try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { raw = null; }
  if (raw) {
    try {
      const s = JSON.parse(raw);
      const status = applyLoaded(s);
      if (status === "purged") {
        try { localStorage.removeItem(STORAGE_KEY); } catch (e2) {}
        try { await idbDel(STORAGE_KEY); } catch (e3) {}
        return "purged";
      }
      await saveState();
      try { localStorage.removeItem(STORAGE_KEY); } catch (e2) {}
      return "loaded";
    } catch (e) { state = emptyState(); }
  }
  return "empty";
}
async function saveState() {
  state.savedAt = iso(realNow());
  state.site = siteId;
  try { await idbSet(STORAGE_KEY, JSON.parse(JSON.stringify(state))); }
  catch (e) { /* quota or private mode */ }
}
function seedExample() {
  const ex = JSON.parse(JSON.stringify(EXAMPLE));
  state = {
    site: siteId,
    savedAt: iso(realNow()),
    example: true,
    asOf: ex.as_of,
    patients: ex.patients || {},
    unassigned: ex.unassigned || []
  };
  for (const k of Object.keys(state.patients)) {
    if (!state.patients[k]) delete state.patients[k];
  }
  saveState();
}

function gapsFor(p, now) {
  const gaps = [];
  if (!p) return gaps;
  if (p.unassigned || !p.room) gaps.push({ kind: "gap", text: "Missing room number" });
  if (isStale(p.updated, now)) {
    const h = hoursAgo(p.updated, now);
    gaps.push({ kind: "stale", text: "Stale: last update " + fmtTime(p.updated) + " (" + h.toFixed(1) + " h ago)" });
  }
  const dues = Array.from(p.due_items || []);
  if (p.next_due && !dues.some(x => x.due === p.next_due)) {
    dues.push({ label: p.next_step ? String(p.next_step).split(";")[0] : "Due item", due: p.next_due });
  }
  const seen = new Set();
  for (const d of dues) {
    if (!d || !d.due || seen.has(d.due + d.label)) continue;
    seen.add(d.due + d.label);
    if (isDueAt(d.due, now)) gaps.push({ kind: "due", text: "Due " + fmtTime(d.due) + ": " + d.label });
    else if (isImminent(d.due, now, 12)) gaps.push({ kind: "due", text: "Upcoming " + fmtTime(d.due) + ": " + d.label });
  }
  const mode = p.mode || "labor";
  const items = enabledItems(mode);
  const byId = {};
  items.forEach(i => { byId[i.id] = i; });
  if (byId.gbs && !fget(p, "gbs").value) gaps.push({ kind: "gap", text: "Missing GBS" });
  if (byId.abx) {
    const g = fget(p, "gbs").value;
    if ((g === "pos" || g === "unknown") && !fget(p, "abx").value) gaps.push({ kind: "gap", text: "Missing antibiotics" });
  }
  if (byId.rh && !fget(p, "rh").value) gaps.push({ kind: "gap", text: "Missing Rh / RhIG" });
  if (byId.rhig && fget(p, "rh").value === "neg" && !fget(p, "rhig").value) {
    gaps.push({ kind: "gap", text: "Missing RhIG" });
  }
  if (byId.rubella && !fget(p, "rubella").value) gaps.push({ kind: "gap", text: "Missing rubella" });
  if (byId.vte && !fget(p, "vte").value) gaps.push({ kind: "gap", text: "No VTE plan" });
  const delivered = mode === "postpartum" || !!fget(p, "delivery_route").value;
  if (byId.who_delivered && delivered && !fget(p, "who_delivered").value) {
    gaps.push({ kind: "gap", text: "Missing who delivered" });
  }
  const skip = { gbs: 1, abx: 1, rh: 1, rhig: 1, rubella: 1, vte: 1, who_delivered: 1 };
  for (const it of items) {
    if (it.gapIfEmpty && !skip[it.id] && !fget(p, it.id).value) {
      gaps.push({ kind: "gap", text: "Missing " + (it.label || it.id) });
    }
  }
  return gaps;
}

function parseDictation(text) {
  const raw = (text || "").trim();
  const result = { ok: false, errors: [], tokens: [], raw, room: "", initials: "", applied: {} };
  if (!raw) { result.errors.push("Type or dictate an update first."); return result; }
  let s = raw.replace(/\s+/g, " ");
  const roomM = s.match(/^(\d{3})\b/);
  if (roomM) {
    result.room = roomM[1];
    s = s.slice(roomM[0].length).trim();
    if (roomList().indexOf(result.room) < 0) {
      result.errors.push("Room " + result.room + " is not on the " + (SITE.siteName || siteId) + " room list.");
    }
  }
  const take = (re, fn) => {
    const m = s.match(re);
    if (!m) return false;
    fn(m);
    s = (s.slice(0, m.index) + " " + s.slice(m.index + m[0].length)).replace(/\s+/g, " ").trim();
    return true;
  };
  take(/\b(\d{1,2})\s*\/\s*(\d{1,3})\s*\/\s*([+\-]?\d)\b/i, m => {
    result.applied.exam = m[1] + "/" + m[2] + "/" + m[3];
    result.tokens.push("Exam " + result.applied.exam);
  });
  take(/\b(\d{1,2})\s*cm\b/i, m => {
    if (!result.applied.exam) result.applied.exam = m[1] + " cm";
    result.tokens.push("Exam " + result.applied.exam);
  });
  take(/\b(?:pit|pitocin|oxytocin)\s*(\d+(?:\.\d+)?)?/i, m => {
    result.applied.oxytocin = m[1] || "on";
    result.tokens.push(m[1] ? ("Oxytocin " + m[1]) : "Oxytocin on");
  });
  take(/\bmiso(?:prostol)?\s*#?\s*(\d+)\b/i, m => {
    result.applied.misoprostol = m[1];
    result.tokens.push("Miso #" + m[1]);
  });
  take(/\bcook\s*(in|out)\b/i, m => {
    result.applied.cook = m[1].toLowerCase();
    result.tokens.push("Cook " + result.applied.cook);
  });
  take(/\bepi(?:dural)?\s*(in|yes|out|off|no|req(?:uested)?)?\b/i, m => {
    let v = (m[1] || "yes").toLowerCase();
    if (v === "in" || v === "yes") v = "yes";
    else if (v === "out" || v === "off" || v === "no") v = "no";
    else v = "requested";
    result.applied.epidural = v;
    result.tokens.push("Epidural " + v);
  });
  take(/\bgbs\s*(\+|plus|pos(?:itive)?|\-|neg(?:ative)?|unk(?:nown)?)\b/i, m => {
    const x = m[1].toLowerCase();
    const v = (x === "+" || x === "plus" || x.indexOf("pos") === 0) ? "pos"
      : (x === "-" || x.indexOf("neg") === 0) ? "neg" : "unknown";
    result.applied.gbs = v;
    result.tokens.push({ pos: "GBS+", neg: "GBS−", unknown: "GBS unknown" }[v]);
  });
  take(/\b(repeat\s+c\/?s|repeat\s+cesarean|vbac|svd|vac(?:uum)?|forceps|c\/?s|cesarean)\b/i, m => {
    const x = m[1].toLowerCase().replace(/\s+/g, "");
    let route = "CS";
    if (x === "svd") route = "SVD";
    else if (x === "vbac") route = "VBAC";
    else if (x.indexOf("vac") === 0 || x === "forceps") route = "vac";
    result.applied.delivery_route = route;
    result.applied.mode = "postpartum";
    result.tokens.push("Delivery " + route);
  });
  take(/\bebl\s*(\d+)\b/i, m => {
    result.applied.ebl = m[1] + " mL";
    result.tokens.push("EBL " + m[1] + " mL");
  });
  take(/\b(hospitalist|obhg|cnm|private)\b/i, m => {
    const tok = m[1].toLowerCase();
    result.applied.provider = (tok === "cnm") ? "CNM" : (tok === "private" ? "private" : "hospitalist");
    result.tokens.push("Provider " + result.applied.provider);
  });
  take(/\b(g(\d+)p(\d+)|(\d+)\s*\/\s*(\d+))\b/i, m => {
    result.applied.gp = m[2] != null ? (m[2] + "/" + m[3]) : (m[4] + "/" + m[5]);
    result.tokens.push("G/P " + result.applied.gp);
  });
  take(/\b(\d{1,2})\s*w(?:eeks?)?(?:(\d)\s*d)?\b/i, m => {
    result.applied.ga = m[1] + "w" + (m[2] ? m[2] + "d" : "");
    result.tokens.push("GA " + result.applied.ga);
  });
  take(/\bnitrous\s*(on|off|yes|no)?\b/i, m => {
    const v = !m[1] || /on|yes/i.test(m[1]) ? "yes" : "no";
    result.applied.nitrous = v;
    result.tokens.push("Nitrous " + v);
  });
  const initM = s.match(/\b([A-Za-z]{1,3}\d?)\b/);
  if (initM) {
    result.initials = initM[1].toUpperCase();
    s = (s.slice(0, initM.index) + " " + s.slice(initM.index + initM[0].length)).replace(/\s+/g, " ").trim();
    result.tokens.unshift("Initials " + result.initials);
  }
  if (s) result.tokens.push("Unparsed: “" + s + "”");
  if (!result.room) {
    if (result.initials) {
      const hit = allPatients().find(p => (p.initials || "").toUpperCase() === result.initials);
      if (hit) result.room = hit.room || "";
    }
    if (!result.room) result.errors.push("Start with a room number (for example 236 MW 6 cm Pit).");
  }
  if (!result.tokens.length && !result.initials) result.errors.push("No recognized tokens.");
  result.ok = result.errors.length === 0;
  return result;
}

function applyParsed(parsed) {
  const ts = iso(clock());
  const room = parsed.room;
  if (!room) return;
  let p = patientAt(room) ? JSON.parse(JSON.stringify(patientAt(room))) : {
    initials: "", gp: "", ga: "", provider: "hospitalist", clinic: "", indication: "",
    mode: "labor", next_step: "", next_due: null, status: "", updated: ts, fields: {}
  };
  p.fields = p.fields || {};
  if (parsed.initials) p.initials = parsed.initials;
  const a = parsed.applied;
  if (a.gp) p.gp = a.gp;
  if (a.ga) p.ga = a.ga;
  if (a.provider) p.provider = a.provider;
  if (a.mode) p.mode = a.mode;
  ["exam", "oxytocin", "misoprostol", "cook", "epidural", "gbs", "delivery_route", "ebl", "nitrous"].forEach(id => {
    if (a[id] != null && a[id] !== "") p.fields[id] = { value: a[id], updated: ts };
  });
  if (a.delivery_route) {
    p.mode = "postpartum";
    if (!fget(p, "delivery_time").value) p.fields.delivery_time = { value: fmtTime(ts), updated: ts };
  }
  p.updated = ts;
  state.patients[room] = p;
  if (p.initials) {
    state.unassigned = (state.unassigned || []).filter(u => (u.initials || "").toUpperCase() !== p.initials.toUpperCase());
  }
  saveState();
}

function setCore(room, field, value) {
  const p = patientAt(room);
  if (!p) return;
  p[field] = value;
  p.updated = iso(clock());
  if (field === "mode" && value === "postpartum") p.fields = p.fields || {};
  saveState();
  render();
}
function setField(room, id, value) {
  const p = patientAt(room);
  if (!p) return;
  const ts = iso(clock());
  p.fields = p.fields || {};
  p.fields[id] = { value: value, updated: ts };
  if (id === "delivery_route" && value) p.mode = "postpartum";
  p.updated = ts;
  saveState();
  render();
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]));
}

function chipGroup(room, id, options, current) {
  return `<div class="chips">${options.map(opt => {
    const on = String(current || "") === String(opt);
    return `<button type="button" aria-pressed="${on}" data-room="${esc(room)}" data-field="${esc(id)}" data-value="${esc(opt)}">${esc(optionLabel(id, opt))}</button>`;
  }).join("")}</div>`;
}

function renderItem(room, p, item, now) {
  const got = fget(p, item.id);
  const stale = isStale(got.updated, now);
  const custom = item.custom ? `<span class="custom-tag">Custom</span>` : "";
  let inner = "";
  if (item.type === "chip") {
    inner = chipGroup(room, item.id, item.options || [], got.value);
  } else if (item.type === "yn") {
    inner = chipGroup(room, item.id, ["yes", "no"], got.value);
  } else if (item.type === "time") {
    inner = `<input type="text" inputmode="numeric" placeholder="HH:MM" aria-label="${esc(item.label)}" data-field="${esc(item.id)}" data-room="${esc(room)}" value="${esc(got.value)}">`;
  } else {
    inner = `<input type="text" placeholder="${esc(item.label)}" aria-label="${esc(item.label)}" data-field="${esc(item.id)}" data-room="${esc(room)}" value="${esc(got.value)}">`;
  }
  const when = got.updated ? `<div class="when">${stale ? "Stale · " : ""}updated ${esc(fmtTime(got.updated))}</div>` : "";
  return `<div class="field${stale ? " stale-field" : ""}"><div class="flab">${esc(item.label)}${custom}</div>${inner}${when}</div>`;
}

function renderCard(room, p, now, forceOpen) {
  if (!p) {
    return `<article class="card empty" data-room="${esc(room)}">
      <div class="card-bar"></div>
      <button type="button" class="card-head" aria-expanded="false">
        <span class="room">${esc(room)}</span>
        <span class="ident"><span class="sub">Empty</span></span>
        <span class="chev">▸</span>
      </button>
      <div class="card-body"><div class="empty-body">
        <p>Add a patient to this room, or dictate starting with ${esc(room)}.</p>
        <form class="add-patient" data-room="${esc(room)}">
          <label>Initials <input name="initials" maxlength="4" required autocomplete="off" autocapitalize="characters" aria-label="Initials for room ${esc(room)}"></label>
          <label>Mode <select name="mode" aria-label="Mode for room ${esc(room)}">
            <option value="labor">Labor</option>
            <option value="postpartum">Postpartum</option>
            <option value="antepartum">Antepartum</option>
          </select></label>
          <button type="submit">Add to room</button>
        </form>
      </div></div>
    </article>`;
  }
  const gaps = gapsFor(Object.assign({ room }, p), now);
  const due = gaps.some(g => g.kind === "due");
  const stale = gaps.some(g => g.kind === "stale") || isStale(p.updated, now);
  const mode = p.mode || "labor";
  const open = forceOpen || expandAll;
  const gapN = gaps.filter(g => g.kind === "gap").length;
  const badges = [
    `<span class="badge mode-${esc(mode)}">${esc(mode)}</span>`,
    due ? `<span class="badge due">Due</span>` : "",
    stale ? `<span class="badge stale">Stale</span>` : "",
    gapN ? `<span class="badge gap">${gapN} gap${gapN > 1 ? "s" : ""}</span>` : ""
  ].join("");
  const sub = [p.gp, p.ga, p.provider, p.clinic].filter(Boolean).join(" · ");
  let body = "";
  body += `<div class="field"><div class="flab">Provider</div>${chipGroup(room, "__provider", PROVIDERS, p.provider)}</div>`;
  body += `<div class="field"><div class="flab">Mode</div>${chipGroup(room, "__mode", ["labor", "postpartum", "antepartum"], mode)}</div>`;
  body += `<div class="field"><div class="flab">Indication / risk (free text)</div>
    <textarea data-core="indication" data-room="${esc(room)}">${esc(p.indication || "")}</textarea></div>`;
  for (const item of enabledItems(mode)) body += renderItem(room, p, item, now);
  body += `<div class="field"><div class="flab">Next step / due (free text)</div>
    <textarea data-core="next_step" data-room="${esc(room)}">${esc(p.next_step || "")}</textarea></div>`;
  if (p.status) body += `<div class="field"><div class="flab">Status</div><div>${esc(p.status)}</div></div>`;
  if (gaps.length) body += `<div class="gaps"><strong>Checkout gaps</strong><br>${gaps.map(g => esc(g.text)).join("<br>")}</div>`;
  const cls = ["card", mode, due ? "due" : "", stale && !due ? "stale" : "", open ? "open" : ""].filter(Boolean).join(" ");
  return `<article class="${cls}" data-room="${esc(room)}">
    <div class="card-bar"></div>
    <button type="button" class="card-head" aria-expanded="${open}">
      <span class="room">${esc(room)}</span>
      <span class="ident"><span class="name">${esc(p.initials || "—")}</span><div class="sub">${esc(sub)}</div>
        <div class="sub">${esc(fieldSummary(p))}</div></span>
      <span class="badges">${badges}</span>
      <span class="chev">${open ? "▾" : "▸"}</span>
    </button>
    <div class="card-body">${body}</div>
  </article>`;
}

function renderCheckout(now) {
  const items = allPatients().map(p => ({ p, gaps: gapsFor(p, now) })).filter(x => x.gaps.length);
  document.getElementById("gapCount").textContent = items.length;
  if (!items.length) return `<div class="checkout-empty">No stale fields, due items, or checklist gaps right now.</div>`;
  return `<p class="section-label">Checkout gaps only</p><div class="list">` + items.map(({ p, gaps }) => {
    const loc = p.room ? ("Rm " + p.room) : "No room";
    return `<article class="checkout-item">
      <h3>${esc(loc)} · ${esc(p.initials || "—")} · ${esc(p.mode || "")}</h3>
      <div class="sub" style="color:var(--muted);font-size:13px;margin-bottom:6px">${esc([p.gp, p.ga, p.provider, p.indication].filter(Boolean).join(" · "))}</div>
      <ul>${gaps.map(g => `<li><span class="tag ${esc(g.kind)}">${esc(g.kind)}</span> — ${esc(g.text)}</li>`).join("")}</ul>
    </article>`;
  }).join("") + `</div>`;
}

function render() {
  const keepOpen = new Set([...document.querySelectorAll("article.card.open")].map(c => String(c.getAttribute("data-room") || "")));
  const now = clock();
  const rooms = roomList();
  const occ = rooms.filter(r => patientAt(r)).length;
  const un = (state.unassigned || []).length;
  const short = siteId.toUpperCase();
  document.getElementById("siteName").textContent = (SITE.siteName || short) + " L&D board";
  document.title = (SITE.siteName || short) + " L&D board";
  document.getElementById("clockLine").innerHTML = state.example
    ? "<strong>EXAMPLE DATA</strong> · demo " + fmtDateTime(state.asOf)
    : fmtDateTime(iso(now));
  document.getElementById("occLine").textContent = occ + " of " + rooms.length + " rooms occupied" + (un ? (" · " + un + " unassigned") : "");
  document.getElementById("occCount").textContent = occ + un;
  document.getElementById("gapCount").textContent = allPatients().filter(p => gapsFor(p, now).length).length;
  document.querySelector("header.top .meta span:last-child").textContent = "Checkout " + CHECKOUT_TIMES.join(" / ");

  document.getElementById("viewAll").setAttribute("aria-pressed", view === "all" ? "true" : "false");
  document.getElementById("viewOcc").setAttribute("aria-pressed", view === "occupied" ? "true" : "false");
  document.getElementById("viewCheck").setAttribute("aria-pressed", view === "checkout" ? "true" : "false");

  const board = document.getElementById("board");
  const unW = document.getElementById("unassignedWrap");
  const anteW = document.getElementById("anteWrap");

  if (view === "checkout") {
    unW.innerHTML = "";
    anteW.innerHTML = "";
    board.innerHTML = renderCheckout(now);
  } else {
    const showEmpty = view === "all";
    let cards = "";
    for (const r of rooms) {
      const p = patientAt(r);
      if (!p && !showEmpty) continue;
      cards += renderCard(r, p, now, keepOpen.has(String(r)));
    }
    board.innerHTML = `<p class="section-label">${showEmpty ? "All rooms" : "Occupied rooms"}</p><div class="list">${cards || "<div class='checkout-empty'>No occupied rooms.</div>"}</div>`;

    if (un) {
      unW.innerHTML = `<p class="section-label">Unassigned (no room)</p><div class="list">` +
        state.unassigned.map(p => {
          const gaps = gapsFor(Object.assign({ unassigned: true }, p), now);
          return `<article class="card postpartum ${isStale(p.updated, now) ? "stale" : ""} open">
            <div class="card-bar"></div>
            <div class="card-head">
              <span class="room">—</span>
              <span class="ident"><span class="name">${esc(p.initials || "—")}</span>
                <div class="sub">${esc([p.gp, p.ga, p.provider, p.clinic, p.indication].filter(Boolean).join(" · "))}</div>
                <div class="sub">${esc(fieldSummary(p))}</div></span>
              <span class="badges"><span class="badge mode-postpartum">${esc(p.mode || "")}</span><span class="badge gap">No room</span></span>
            </div>
            <div class="card-body">${p.next_step ? `<div class="field">${esc(p.next_step)}</div>` : ""}
              ${gaps.length ? `<div class="gaps"><strong>Checkout gaps</strong><br>${gaps.map(g => esc(g.text)).join("<br>")}</div>` : ""}</div>
          </article>`;
        }).join("") + `</div>`;
    } else unW.innerHTML = "";

    // Do not list antepartum patients a second time when they already have a room card on this view.
    anteW.innerHTML = "";
  }

  const saved = state.savedAt ? ("Last saved on this device " + fmtDateTime(state.savedAt) + ". Auto-purge 24 h after that.") : "Not yet saved on this device.";
  document.getElementById("savedLine").textContent = saved;
  bindDynamic();
}

function bindDynamic() {
  document.querySelectorAll(".card-head").forEach(btn => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".card");
      card.classList.toggle("open");
      btn.setAttribute("aria-expanded", card.classList.contains("open") ? "true" : "false");
      const chev = btn.querySelector(".chev");
      if (chev) chev.textContent = card.classList.contains("open") ? "▾" : "▸";
    });
  });
  document.querySelectorAll(".chips button[data-field]").forEach(btn => {
    btn.addEventListener("click", ev => {
      ev.preventDefault(); ev.stopPropagation();
      const f = btn.dataset.field;
      if (f === "__provider") setCore(btn.dataset.room, "provider", btn.dataset.value);
      else if (f === "__mode") setCore(btn.dataset.room, "mode", btn.dataset.value);
      else setField(btn.dataset.room, f, btn.dataset.value);
    });
  });
  document.querySelectorAll("textarea[data-core]").forEach(el => {
    el.addEventListener("change", () => setCore(el.dataset.room, el.dataset.core, el.value));
    el.addEventListener("click", ev => ev.stopPropagation());
  });
  document.querySelectorAll("input[data-field]").forEach(el => {
    el.addEventListener("change", () => setField(el.dataset.room, el.dataset.field, el.value));
    el.addEventListener("click", ev => ev.stopPropagation());
  });
  document.querySelectorAll("form.add-patient").forEach(form => {
    form.addEventListener("click", ev => ev.stopPropagation());
    form.addEventListener("submit", ev => {
      ev.preventDefault(); ev.stopPropagation();
      addPatientToRoom(form.dataset.room, form.initials.value, form.mode.value);
    });
  });
}

function addPatientToRoom(room, initials, mode) {
  const init = String(initials || "").trim().toUpperCase();
  if (!room || !init) return;
  if (roomList().indexOf(String(room)) < 0) return;
  const ts = iso(clock());
  const existing = patientAt(room);
  const p = existing ? JSON.parse(JSON.stringify(existing)) : {
    initials: "", gp: "", ga: "", provider: "hospitalist", clinic: "", indication: "",
    mode: "labor", next_step: "", next_due: null, status: "", updated: ts, fields: {}
  };
  p.initials = init;
  p.mode = (mode === "postpartum" || mode === "antepartum") ? mode : "labor";
  p.updated = ts;
  p.fields = p.fields || {};
  state.patients[String(room)] = p;
  state.unassigned = (state.unassigned || []).filter(u => (u.initials || "").toUpperCase() !== init);
  state.example = false;
  saveState();
  render();
  const card = document.querySelector('article.card[data-room="'+CSS.escape(String(room))+'"]');
  if (card) {
    card.classList.add("open");
    const btn = card.querySelector(".card-head");
    if (btn) btn.setAttribute("aria-expanded", "true");
    const chev = card.querySelector(".chev");
    if (chev) chev.textContent = "▾";
  }
}

function exportPayload() {
  return {
    type: "obhg-ld-board",
    version: 1,
    site: siteId,
    siteName: SITE.siteName || siteId,
    savedAt: state.savedAt,
    example: !!state.example,
    asOf: state.asOf || null,
    patients: state.patients || {},
    unassigned: state.unassigned || []
  };
}
function boardFileName() {
  return "ld-board-" + siteId + "-" + (new Date().toISOString().slice(0,10)) + ".json";
}
function importPayload(data) {
  if (!data || data.type !== "obhg-ld-board") throw new Error("This file is not a shared L&D board.");
  state = Object.assign(emptyState(), {
    site: siteId,
    savedAt: data.savedAt || iso(realNow()),
    example: !!data.example,
    asOf: data.asOf || null,
    patients: data.patients || {},
    unassigned: data.unassigned || []
  });
  return saveState();
}


function showPreview(parsed) {
  const box = document.getElementById("preview");
  pendingParse = parsed;
  box.hidden = false;
  box.className = "preview";
  if (!parsed || (!parsed.ok && !parsed.tokens.length)) {
    box.innerHTML = `<h3>Parsed preview</h3><p class="err">${esc((parsed && parsed.errors || []).join(" "))}</p>`;
    return;
  }
  const existing = parsed.room ? patientAt(parsed.room) : null;
  const warn = existing && parsed.initials && existing.initials && existing.initials.toUpperCase() !== parsed.initials
    ? `<p class="err">Room ${esc(parsed.room)} already has ${esc(existing.initials)}. Confirm only if you mean to replace them.</p>` : "";
  const items = [];
  if (parsed.room) items.push("Room " + parsed.room + (existing ? (" (now " + (existing.initials || "empty") + ")") : " (empty)"));
  items.push(...parsed.tokens);
  box.innerHTML = `<h3>Parsed preview — confirm to save</h3>
    ${parsed.errors.length ? `<p class="err">${parsed.errors.map(esc).join(" ")}</p>` : ""}
    ${warn}
    <ul>${items.map(t => `<li>${esc(t)}</li>`).join("")}</ul>
    <div class="actions">
      <button type="button" class="cancel" id="parseCancel">Cancel</button>
      <button type="button" class="ok" id="parseConfirm" ${parsed.ok ? "" : "disabled"}>Confirm and save</button>
    </div>`;
  document.getElementById("parseCancel").onclick = () => { pendingParse = null; box.hidden = true; };
  const c = document.getElementById("parseConfirm");
  if (c) c.onclick = () => {
    if (!pendingParse || !pendingParse.ok) return;
    applyParsed(pendingParse);
    pendingParse = null;
    box.hidden = true;
    document.getElementById("dictation").value = "";
    render();
  };
}

function openShareDialog() {
  document.getElementById("shareDlgText").textContent = SHARE_DISCLAIMER;
  document.getElementById("shareMask").classList.add("show");
}
function closeShareDialog() {
  document.getElementById("shareMask").classList.remove("show");
}
function downloadBoardFile() {
  const blob = new Blob([JSON.stringify(exportPayload(), null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = boardFileName();
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
async function doShare() {
  closeShareDialog();
  const title = (SITE.siteName || siteId) + " L&D board";
  const text = SHARE_DISCLAIMER;
  const blob = new Blob([JSON.stringify(exportPayload(), null, 2)], { type: "application/json" });
  const file = new File([blob], boardFileName(), { type: "application/json" });
  try {
    if (navigator.share) {
      const canFiles = !navigator.canShare || navigator.canShare({ files: [file] });
      if (canFiles) {
        await navigator.share({ title: title, text: text, files: [file] });
        return;
      }
      await navigator.share({ title: title, text: text });
    }
  } catch (e) {
    if (e && e.name === "AbortError") return;
  }
  downloadBoardFile();
}

async function onLoadSharedFile(file) {
  const status = document.getElementById("loadSharedStatus");
  try {
    const data = JSON.parse(await file.text());
    await importPayload(data);
    view = "occupied";
    render();
    if (status) { status.hidden = false; status.textContent = "Loaded shared board onto this device."; }
  } catch (e) {
    if (status) { status.hidden = false; status.textContent = "Could not load that file. " + (e && e.message ? e.message : ""); }
  }
}

function fillSiteSelect() {
  const sel = document.getElementById("siteSelect");
  if (!sel) return;
  sel.innerHTML = Object.keys(SITES).map(id => {
    const name = SITES[id].siteName || id;
    return `<option value="${id}"${id === siteId ? " selected" : ""}>${name}</option>`;
  }).join("");
  sel.onchange = () => {
    const next = sel.value;
    if (!SITES[next] || next === siteId) return;
    const url = new URL(location.href);
    url.searchParams.set("site", next);
    location.search = url.searchParams.toString();
  };
}

function updateBanner() {
  const b = document.getElementById("exampleBanner");
  if (!b) return;
  b.hidden = !state.example;
}

const _render = render;
render = function() {
  updateBanner();
  _render();
};

async function init() {
  document.getElementById("shareDisclaimer").textContent = SHARE_DISCLAIMER;
  document.getElementById("shareDlgText").textContent = SHARE_DISCLAIMER;
  fillSiteSelect();
  const status = await loadState();
  if (params.get("example") === "1") await seedExample();
  void status;
  if (!["all", "occupied", "checkout"].includes(view)) view = "occupied";
  document.getElementById("viewAll").onclick = () => { view = "all"; render(); };
  document.getElementById("viewOcc").onclick = () => { view = "occupied"; render(); };
  document.getElementById("viewCheck").onclick = () => { view = "checkout"; render(); };
  document.getElementById("parseBtn").onclick = () => showPreview(parseDictation(document.getElementById("dictation").value));
  document.getElementById("dictation").addEventListener("keydown", ev => {
    if (ev.key === "Enter") { ev.preventDefault(); showPreview(parseDictation(ev.target.value)); }
  });
  document.getElementById("loadExample").onclick = () => { seedExample(); view = "occupied"; render(); };
  const mask = document.getElementById("clearMask");
  document.getElementById("clearBtn").onclick = () => mask.classList.add("show");
  document.getElementById("clearNo").onclick = () => mask.classList.remove("show");
  document.getElementById("clearYes").onclick = async () => {
    state = emptyState();
    try { await idbDel(STORAGE_KEY); } catch (e) {}
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    mask.classList.remove("show");
    render();
  };
  document.getElementById("shareBtn").onclick = openShareDialog;
  document.getElementById("shareCancel").onclick = closeShareDialog;
  document.getElementById("shareConfirm").onclick = doShare;
  const loadBtn = document.getElementById("loadSharedBtn");
  const loadInput = document.getElementById("loadShared");
  if (loadBtn && loadInput) {
    loadBtn.onclick = () => loadInput.click();
    loadInput.addEventListener("change", ev => {
      const f = ev.target.files && ev.target.files[0];
      if (f) onLoadSharedFile(f);
      ev.target.value = "";
    });
  }
  render();
  if (params.get("dialog") === "share") openShareDialog();
}
init();
