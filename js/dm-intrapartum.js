/* ALG-DM-INTRAPARTUM (11 Nov 2026): CSM OB insulin infusion nomogram + Michael's go-live settings.
   Single source for the rendered algorithm text, the dose table and tests. Decision support only, not orders.
   Source: /workspace/director/drafts/ALG-DM-INTRAPARTUM_spec_2026-11-11.md (CSM protocol transcription, Doc review, Michael go-live resolutions). */
(function (root) {
  'use strict';
  const TYPES = Object.freeze({ A1: 'GDM A1 (diet)', A2: 'GDM A2 (medication)', T2: 'Type 2', T1: 'Type 1' });
  const D5 = 'D5LR 125 mL/h', LR = 'LR 125 mL/h';
  // CSM chart, read as whole numbers (Michael go-live resolution 1): exactly 60 is the <60 row; 90 holds; 91 starts; 120 stays D5LR; 121 switches to LR.
  const BANDS = Object.freeze([
    { id: 'le60', label: '≤60 (CSM "<60" row; 60 included)', lo: -Infinity, hi: 60, rate: 0, fluid: D5 },
    { id: '61-90', label: '61–90 (target)', lo: 61, hi: 90, rate: 0, fluid: D5 },
    { id: '91-120', label: '91–120', lo: 91, hi: 120, rate: 0.5, fluid: D5 },
    { id: '121-150', label: '121–150', lo: 121, hi: 150, rate: 1, fluid: LR },
    { id: '151-180', label: '151–180', lo: 151, hi: 180, rate: 2, fluid: LR },
    { id: '181-220', label: '181–220', lo: 181, hi: 220, rate: 3, fluid: LR },
    { id: '221-250', label: '221–250', lo: 221, hi: 250, rate: 4, fluid: LR },
    { id: 'gt250', label: '>250', lo: 251, hi: Infinity, rate: 5, fluid: LR }
  ].map(Object.freeze));
  const MAX_RATE = 5;
  function band(fsbg) {
    if (typeof fsbg !== 'number' || !Number.isFinite(fsbg)) throw new TypeError('FSBG must be a number');
    if (!Number.isInteger(fsbg)) throw new RangeError('FSBG is read as a whole number (CSM chart); decimal rounding rule not set');
    return BANDS.find(b => fsbg >= b.lo && fsbg <= b.hi);
  }
  // type: A1 | A2 | T2 | T1. opts.effectiveBasal: effective long-acting SC basal within its duration, or a functioning pump (T1 floor then not needed; never stack).
  function action(type, fsbg, opts = {}) {
    if (!TYPES[type]) throw new RangeError('type must be A1, A2, T2 or T1');
    const b = band(fsbg), out = { type, fsbg, band: b.id, fluid: b.fluid, insulinUnitsPerHour: b.rate, insulin: '', notifyProvider: false, hypoglycemiaProtocol: false, override: null, flags: [] };
    if (b.id === 'le60') {
      out.insulinUnitsPerHour = 0; out.notifyProvider = true; out.hypoglycemiaProtocol = true;
      out.insulin = type === 'T1' ? 'No insulin now: type 1 EMERGENCY PAUSE (dextrose continues). Recheck in 15 min; repeat rescue until >70; resume 0.5 units/h once >70 and rising. No type 1 pause longer than ~1 h without provider review.' : 'No insulin. Contact provider. Hypoglycemia protocol.';
      out.recheckMinutes = 15;
    } else if (b.id === '61-90') {
      if (type === 'T1' && !opts.effectiveBasal) {
        out.insulinUnitsPerHour = 0.5; out.notifyProvider = true;
        out.insulin = 'Type 1 basal floor 0.5 units/h with D5LR 125 mL/h; notify provider. Provider may set 0.5–1 units/h by trend (prevents ketosis; not glucose correction).';
        out.override = 'Clinician override of the CSM chart (CSM chart: hold infusion at 61–90). Doc review, Michael sign-off 11 Nov 2026.';
        out.providerRange = [0.5, 1];
      } else if (type === 'T1') {
        out.insulinUnitsPerHour = 0; out.insulin = 'IV floor not needed: effective long-acting SC basal (within its duration) or a functioning pump is running. Do not stack.';
      } else {
        out.insulinUnitsPerHour = 0; out.insulin = type === 'A1' ? 'No insulin (in target). Monitor.' : 'Hold infusion (in target). Continue D5LR 125 mL/h.';
      }
      if (fsbg <= 69) out.flags.push('HYPO_CONTINGENCY_OVERLAP_61_69');
    } else {
      out.insulin = 'Regular insulin ' + b.rate + ' units/h (= ' + b.rate + ' mL/h of 100 units/100 mL)';
      if (b.rate === MAX_RATE) { out.notifyProvider = true; out.insulin += '. Maximum rate: persistent or rising values → notify provider for active management; line check; consider DKA screen.'; }
      if (type === 'T1' && b.fluid === LR) out.flags.push('T1_LR_KETOSIS_WATCH');
    }
    return Object.freeze(out);
  }
  // CSM Adult Hypoglycemic Protocol contingency, as printed, with the CSM pharmacy D50 resolution (go-live resolution 4).
  const RESCUE = Object.freeze([
    { order: 'D50 50 mL IV, as needed', when: 'FSBG <50 in an alert patient unable to swallow; OR questionable level of consciousness with FSBG <50 (CSM pharmacy).' },
    { order: 'D50 25 mL IV push, as needed', when: 'FSBG 50–69 in an alert patient who is NPO or unable to swallow; OR questionable level of consciousness with FSBG 50–69 (CSM pharmacy).' },
    { order: 'Glucagon (GlucaGen) 1 mg IM, ONCE (do not repeat)', when: 'FSBG <70 in an alert patient with no IV access or unable to swallow; OR FSBG <60 with a questionable level of consciousness and no IV access.' },
    { order: 'Glutose 40% oral gel 15 g buccal', when: 'FSBG 50–59 in an ALERT patient without IV access.' },
    { order: 'Glutose 40% oral gel 30 g buccal', when: 'FSBG <50 in an ALERT patient without IV access.' }
  ].map(Object.freeze));
  function d50QuestionableConsciousness(fsbg) { band(fsbg); return fsbg < 50 ? 'D50 50 mL IV' : fsbg <= 69 ? 'D50 25 mL IV' : null; }
  const MONITORING = Object.freeze([
    'FSBG before starting IV fluids.',
    'Insulin drip running: FSBG every 1 hour, regardless of dilation (Michael override of CSM q2h latent; ACOG PB 201).',
    'No drip: every 2 hours in latent labor or NPO before delivery; every 1 hour at 4–6 cm or with regular contractions (CSM).',
    'After any hypoglycemia rescue: recheck in 15 minutes; repeat rescue until >70 (Michael go-live resolution 2).',
    'Hospital point-of-care glucose for insulin decisions; CGM for trends/alarms only.'
  ]);
  function table() { return BANDS.map(b => ({ band: b, byType: Object.fromEntries(Object.keys(TYPES).map(t => [t, action(t, b.lo === -Infinity ? 60 : b.lo)])) })); }
  const api = Object.freeze({ ID: 'ALG-DM-INTRAPARTUM', VERSION: '2026-11-11', TYPES, BANDS, MAX_RATE, band, action, RESCUE, d50QuestionableConsciousness, MONITORING, table });
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DMIntrapartum = api;
})(typeof self !== 'undefined' ? self : this);
