/* In-flow cues for FD-ANT-TRAUMA (4-6 h timer) and FD-ANT-STI (hard stops + peds handoff).
   Cue only, not a documented time. Nothing is written to storage. */
(function (root) {
  'use strict';
  const FOUR_H = 4 * 60 * 60 * 1000;
  const SIX_H = 6 * 60 * 60 * 1000;
  let timer = { startMs: null, interval: null };

  function hardStops(flags) {
    const f = flags || {};
    const hsv = !!(f.hsvLesions || f.hsvProdrome || f.romWithLesions);
    const hiv = !!(f.hivReactive || f.hivUnknownWithRisk || f.viralLoadOver1000 || f.viralLoadUnknown);
    return { cesarean: hsv, ivZdv: hiv, pointsToHivCard: hiv };
  }

  function pedsHandoff(flags) {
    const f = flags || {};
    const out = [];
    if (f.syphilis) out.push('syphilis');
    if (f.hsvPrimary) out.push('HSV (primary)');
    else if (f.hsvRecurrent) out.push('HSV (recurrent)');
    else if (f.hsv) out.push('HSV');
    if (f.untreatedGc) out.push('untreated GC');
    if (f.hbsag) out.push('HBsAg status');
    if (f.hiv) out.push('HIV');
    return out;
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  function fmtDuration(ms) {
    const sign = ms < 0 ? '+' : '';
    const abs = Math.abs(ms);
    const h = Math.floor(abs / 3600000);
    const m = Math.floor((abs % 3600000) / 60000);
    const s = Math.floor((abs % 60000) / 1000);
    return sign + h + 'h ' + pad(m) + 'm ' + pad(s) + 's';
  }

  function timerStatus(now, startMs) {
    if (startMs == null) return { running: false, text: 'No cue running.' };
    const elapsed = now - startMs;
    const remain4 = FOUR_H - elapsed;
    const remain6 = SIX_H - elapsed;
    const start = new Date(startMs);
    const startLabel = start.toLocaleString('en-US', {
      timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit', second: '2-digit'
    }) + ' CT';
    let text = 'Start (cue only): ' + startLabel + '. ';
    if (remain6 > 0) {
      text += remain4 > 0
        ? ('4 h cue in ' + fmtDuration(remain4) + '; 6 h cue in ' + fmtDuration(remain6) + '.')
        : ('Past the 4 h mark; 6 h cue in ' + fmtDuration(remain6) + '.');
    } else {
      text += 'Past the 4–6 h monitoring window (cue only).';
    }
    return { running: true, elapsed: elapsed, remain4: remain4, remain6: remain6, startLabel: startLabel, text: text };
  }

  function storageUsed() {
    try {
      if (typeof localStorage === 'undefined') return false;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && /(?:trauma|sti|flow-cue|flowcue)/i.test(k)) return true;
      }
    } catch (e) { /* ignore */ }
    return false;
  }

  function startTimer(atMs) {
    timer.startMs = atMs;
    return timerStatus(Date.now(), timer.startMs);
  }

  function clearTimer() {
    timer.startMs = null;
    if (timer.interval) { clearInterval(timer.interval); timer.interval = null; }
    return timerStatus(Date.now(), null);
  }

  function checked(rootEl, name) {
    const el = rootEl.querySelector('[data-sti="' + name + '"]');
    return !!(el && el.checked);
  }

  function collectStiFlags(rootEl) {
    return {
      hsvLesions: checked(rootEl, 'hsv-lesions'),
      hsvProdrome: checked(rootEl, 'hsv-prodrome'),
      romWithLesions: checked(rootEl, 'rom-lesions'),
      hivReactive: checked(rootEl, 'hiv-reactive'),
      hivUnknownWithRisk: checked(rootEl, 'hiv-unknown'),
      viralLoadOver1000: checked(rootEl, 'hiv-vl-high'),
      viralLoadUnknown: checked(rootEl, 'hiv-vl-unknown'),
      syphilis: checked(rootEl, 'syphilis'),
      hsvPrimary: checked(rootEl, 'hsv-primary'),
      hsvRecurrent: checked(rootEl, 'hsv-recurrent'),
      untreatedGc: checked(rootEl, 'untreated-gc'),
      hbsag: checked(rootEl, 'hbsag'),
      hiv: checked(rootEl, 'hiv-reactive') || checked(rootEl, 'hiv-unknown') || checked(rootEl, 'hiv-vl-high') || checked(rootEl, 'hiv-vl-unknown') || checked(rootEl, 'hiv')
    };
  }

  function renderSti(rootEl) {
    const f = collectStiFlags(rootEl);
    const hs = hardStops(f);
    const hsvBox = rootEl.querySelector('[data-sti-hard="hsv"]');
    const hivBox = rootEl.querySelector('[data-sti-hard="hiv"]');
    if (hsvBox) hsvBox.hidden = !hs.cesarean;
    if (hivBox) hivBox.hidden = !hs.ivZdv;
    const list = pedsHandoff(f);
    const peds = rootEl.querySelector('[data-sti-peds]');
    if (peds) peds.textContent = list.length ? ('Peds handoff: ' + list.join('; ') + '.') : 'Peds handoff: nothing flagged yet.';
  }

  function mount(container) {
    if (!container) return;
    const cue = container.querySelector('[data-cue="trauma-timer"]');
    if (cue) {
      const status = cue.querySelector('[data-cue-status]');
      const startBtn = cue.querySelector('[data-cue-start]');
      const clearBtn = cue.querySelector('[data-cue-clear]');
      const paint = function () { if (status) status.textContent = timerStatus(Date.now(), timer.startMs).text; };
      if (startBtn) startBtn.onclick = function () {
        startTimer(Date.now());
        if (timer.interval) clearInterval(timer.interval);
        timer.interval = setInterval(paint, 1000);
        paint();
      };
      if (clearBtn) clearBtn.onclick = function () { clearTimer(); paint(); };
      paint();
    }
    const sti = container.querySelector('[data-cue="sti-router"]');
    if (sti) {
      sti.addEventListener('change', function () { renderSti(sti); });
      renderSti(sti);
    }
    const entry = container.querySelector('[data-cue="sti-entry"]');
    if (entry) {
      const status = entry.querySelector('[data-sti-entry-status]');
      const setPath = function (path) {
        if (status) {
          status.textContent = path === 'triage'
            ? 'OB ED triage: not in labor (any GA) or postpartum ≤12 wk. Use the triage branch below.'
            : 'In labor / admitted: use the labor router (nodes 1–5) below.';
        }
        container.querySelectorAll('[data-sti-path]').forEach(function (el) {
          el.hidden = el.getAttribute('data-sti-path') !== path;
        });
      };
      entry.querySelectorAll('[data-sti-entry]').forEach(function (btn) {
        btn.addEventListener('click', function () { setPath(btn.getAttribute('data-sti-entry')); });
      });
    }
    const utiEntry = container.querySelector('[data-cue="uti-entry"]');
    if (utiEntry) {
      const status = utiEntry.querySelector('[data-uti-entry-status]');
      const setPath = function (path) {
        if (status) {
          status.textContent = path === 'triage'
            ? 'OB ED triage: not in labor (any GA) or postpartum ≤12 wk. Use the triage branch below.'
            : 'In labor / admitted: use the labor path (node L) below.';
        }
        container.querySelectorAll('[data-uti-path]').forEach(function (el) {
          el.hidden = el.getAttribute('data-uti-path') !== path;
        });
      };
      utiEntry.querySelectorAll('[data-uti-entry]').forEach(function (btn) {
        btn.addEventListener('click', function () { setPath(btn.getAttribute('data-uti-entry')); });
      });
    }
  }

  const api = {
    hardStops: hardStops,
    pedsHandoff: pedsHandoff,
    timerStatus: timerStatus,
    startTimer: startTimer,
    clearTimer: clearTimer,
    storageUsed: storageUsed,
    mount: mount,
    FOUR_H: FOUR_H,
    SIX_H: SIX_H
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FlowCues = api;
})(typeof self !== 'undefined' ? self : this);
