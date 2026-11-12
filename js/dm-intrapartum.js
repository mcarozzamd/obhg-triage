/* ALG-DM-INTRAPARTUM (11 Nov 2026, rev. after Doc APPROVE-WITH-FIXES): CSM OB insulin infusion nomogram + Michael's go-live settings + Doc fixes.
   SINGLE SOURCE for the diagram (build/build_DM_INTRAPARTUM_FLOW_2026-11-11.py), the text companion and ANT-05 wording embedded in js/content.js
   (build/rebuild_dm.py), and the dose/branch tests. Decision support only, not orders.
   Source: /workspace/director/drafts/ALG-DM-INTRAPARTUM_spec_2026-11-11.md; Doc verdict doc-dm-intrapartum-verdict-2026-11-11.md (F1–F12).

   DECISION SWITCHES (all decided by Michael 11 Nov 2026; kept as switches so a change re-renders in minutes). To change one: edit the value,
   keep/clear its DECIDED entry (false shows a "PENDING" flag), then run:  python3 build/rebuild_dm.py && npm test                                   */
const DEFAULT_SWITCHES = {
  // F1, FSBG 61–69. 'A' (Doc recommended): rescue for ALL types at <70; 61–90 = no added insulin; type 1 keeps the 0.5 floor at 61–69,
  //     pauses only at ≤60 or symptoms.  'B': at asymptomatic 61–69 on D5LR give no D50; recheck in 15 min; rescue if ≤60, symptomatic or lower.
  F1_LOW_61_69: 'A',
  // F3 unprinted rescue arms (Michael-approved additions, pending CSM pharmacy build). true = ON.
  F3_GEL15_ALERT_NOIV_SWALLOW_60_69: true,   // OFF: the printed glucagon arm stands for this patient.
  F3_GLUCAGON_QC_NOIV_60_69: true,            // OFF: no printed order; call provider / rapid response, get IV access.
  // N4 (Doc addendum; Michael picks). Definition of active labor used by the no-drip schedule. '4cm' (Doc recommended, = CSM hourly trigger) | '6cm' (ACOG).
  N4_ACTIVE_LABOR: '6cm',          // Michael decided 11 Nov 2026, 8:57 PM CT: 6 cm or more
  // Optional no-drip extras (Doc proposals, not CSM; decided by Michael 11 Nov 2026, 8:57 PM CT). OFF = not shown and not applied.
  N5_STEROIDS_NODRIP: false,     // betamethasone in last 5 days: q2h until active labor, then q1h; provider decides sliding scale vs drip
  N6_GLYBURIDE_Q2H: true,        // glyburide in last 24 h: q2h until 24 h after the last dose
  N9_AFTER_SSI_Q2H: true         // after a sliding-scale dose: 1 h, then q2h until 2 values in a row 70–180, then routine
};
// F4 is DECIDED (Michael, 11 Nov 2026, 8:43 PM CT; supersedes both Doc options): diet-controlled GDM (A1) and anyone on oral agents are NOT
// managed with the drip: sliding scale insulin as needed per provider order (no CSM scale in hand; no doses shown); FSBG q4h until active
// labor, then q2h in active labor, and 1 h after any sliding-scale dose (Michael 11 Nov 2026, 8:51 PM CT); call provider for >180, ketones or illness. The drip is for insulin-requiring patients (A2 on insulin, type 2 on insulin, type 1).
// F1 = A and both F3 arms = ON: DECIDED by Michael 11 Nov 2026, 8:44 PM CT. F3 arms are Michael-approved additions pending the CSM pharmacy build.
const DECIDED = { F1_LOW_61_69: true, F3_GEL15_ALERT_NOIV_SWALLOW_60_69: true, F3_GLUCAGON_QC_NOIV_60_69: true, N4_ACTIVE_LABOR: true, N5_STEROIDS_NODRIP: true, N6_GLYBURIDE_Q2H: true, N9_AFTER_SSI_Q2H: true };

(function (root) {
  'use strict';
  function create(overrides = {}, decidedOverrides = {}) {
    const SW = Object.freeze(Object.assign({}, DEFAULT_SWITCHES, overrides));
    const DEC = Object.freeze(Object.assign({}, DECIDED, decidedOverrides));
    if (!['A', 'B'].includes(SW.F1_LOW_61_69)) throw new RangeError('F1 switch must be A or B');
    if (!['4cm', '6cm'].includes(SW.N4_ACTIVE_LABOR)) throw new RangeError('N4 switch must be 4cm or 6cm');
    const PEND = k => DEC[k] ? '' : ' ♦ PENDING MICHAEL (' + k.split('_')[0] + ': option ' + (typeof SW[k] === 'boolean' ? (SW[k] ? 'ON' : 'OFF') : SW[k] === '4cm' ? '≥4 cm or regular contractions' : SW[k] === '6cm' ? '≥6 cm' : SW[k]) + ' shown).';
    const F1A = SW.F1_LOW_61_69 === 'A';
    const TYPES = Object.freeze({ A1: 'GDM A1 (diet)', A2O: 'GDM A2 on oral agents only (no insulin)', T2O: 'Type 2 on oral agents only (no insulin)', A2: 'GDM A2 on insulin', T2: 'Type 2 on insulin', T1: 'Type 1' });
    const NO_DRIP = Object.freeze(['A1', 'A2O', 'T2O']);   // F4 (Michael): not managed with the drip. N1: oral agents ONLY; any home insulin = drip group.
    const ACTIVE_DEF = SW.N4_ACTIVE_LABOR === '4cm' ? 'Active labor = 4 cm or more, or regular contractions (the CSM hourly-check trigger).' : 'Active labor = 6 cm or more (ACOG).';
    // N4: opts.activeLabor may be given directly, or derived from opts.cervixCm / opts.regularContractions using the switch.
    function isActiveLabor(o = {}) { if (typeof o.activeLabor === 'boolean') return o.activeLabor; const cm = Number(o.cervixCm);
      return SW.N4_ACTIVE_LABOR === '4cm' ? (cm >= 4 || !!o.regularContractions) : cm >= 6; }
    const N2_TEXT = 'Call provider now for any single FSBG >180, any ketones, or vomiting/illness. The provider decides next steps: DKA screen (beta-hydroxybutyrate, VBG, BMP) and the CSM insulin drip only by provider order. If the drip is ordered, move to the drip group (hourly FSBG, CSM nomogram). Do not start the drip from this chart without an order.';
    const N5_TEXT = 'Betamethasone in the last 5 days: FSBG every 2 h until active labor, then every 1 h; provider decides sliding scale vs drip.';
    const N6_TEXT = 'Glyburide within the last 24 h: FSBG every 2 h until 24 h after the last dose.';
    const N9_TEXT = 'After any sliding-scale dose: recheck FSBG in 1 h, then every 2 h until 2 values in a row are 70–180 (or per provider), then back to the routine schedule.';
    const D5 = 'D5LR 125 mL/h', LR = 'LR 125 mL/h', NDFLUID = 'Routine labor fluids (no insulin drip)';
    // CSM chart rows (unchanged; Doc verified 8/8). Exactly 60 is the <60 row (go-live resolution 1).
    const BANDS = Object.freeze([
      { id: 'le60', label: '≤60 (CSM "<60" row; 60 included)', lo: -Infinity, hi: 60, rate: 0, fluid: D5 },
      { id: '61-90', label: F1A ? '61–90 (insulin hold band; 61–69 = LOW, rescue)' : '61–90 (insulin hold band; 61–69 = LOW, recheck)', lo: 61, hi: 90, rate: 0, fluid: D5 },
      { id: '91-120', label: '91–120', lo: 91, hi: 120, rate: 0.5, fluid: D5 },
      { id: '121-150', label: '121–150', lo: 121, hi: 150, rate: 1, fluid: LR },
      { id: '151-180', label: '151–180', lo: 151, hi: 180, rate: 2, fluid: LR },
      { id: '181-220', label: '181–220', lo: 181, hi: 220, rate: 3, fluid: LR },
      { id: '221-250', label: '221–250', lo: 221, hi: 250, rate: 4, fluid: LR },
      { id: 'gt250', label: '>250', lo: 251, hi: Infinity, rate: 5, fluid: LR }
    ].map(Object.freeze));
    const MAX_RATE = 5;
    // F5: mg/dL only; decimals round DOWN; meter LO = treat as <50; meter HI = >250 row.
    function reading(v) {
      if (v === 'LO') return { value: 49, meter: 'LO' };
      if (v === 'HI') return { value: 251, meter: 'HI' };
      if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) throw new TypeError('Enter the whole-number meter value in mg/dL (or LO / HI)');
      return { value: Math.floor(v), meter: null, rounded: !Number.isInteger(v) };
    }
    function band(v) { const r = reading(v).value; return BANDS.find(b => r >= b.lo && r <= b.hi); }
    const KETONE_WATCH = 'Type 1 on plain LR: urine ketones (or beta-hydroxybutyrate) at the start of LR and every 4 h on LR (q4h = Doc proposal, not CSM), and now for nausea, vomiting, abdominal pain, fast breathing or 5 units/h with rising values. Any positive ketones: call provider; go to the DKA box; no ad hoc dextrose.';
    const RESUME = 'resume 0.5 units/h once >70 and rising (rising = higher than the previous check)';
    const T1_PAUSE = 'No insulin now: type 1 EMERGENCY PAUSE (dextrose continues). Rescue; recheck in 15 min; ' + RESUME + '. A pause of about 1 h or longer needs provider review.';
    const FLOOR_NOT_NEEDED = 'IV floor not needed only if effective long-acting SC basal (glargine/detemir given within its duration) is on board, or a pump is continued under a signed CSM exception. Do not stack.';
    // type: A1 | A2O | T2O (diet / oral agents: no drip) | A2 | T2 (on insulin) | T1. opts: effectiveBasal (T1: qualifying SC basal or pump under
    //       signed CSM exception), symptomatic, activeLabor, slidingScaleGiven, ketones, ill (diet/oral group call triggers).
    function action(type, fsbg, opts = {}) {
      if (!TYPES[type]) throw new RangeError('type must be A1, A2O, T2O, A2, T2 or T1');
      const rd = reading(fsbg), v = rd.value, b = band(fsbg), sym = !!opts.symptomatic;
      const noDrip = NO_DRIP.includes(type);
      const out = { type, fsbg, value: v, band: b.id, fluid: b.fluid, insulinUnitsPerHour: b.rate, insulin: '', notifyProvider: false, hypoglycemiaProtocol: false,
        recheckMinutes: null, override: null, flags: [], switches: { F1: SW.F1_LOW_61_69 }, drip: !noDrip };
      if (rd.rounded) out.flags.push('ROUNDED_DOWN');
      if (rd.meter === 'LO') out.flags.push('METER_LO_TREAT_AS_LT50');
      if (rd.meter === 'HI') { out.flags.push('METER_HI'); out.notifyProvider = true; out.dkaScreen = true; out.labGlucose = true; }
      const low = v <= 60 || (v <= 69 && (F1A || sym));
      if (low) {
        out.hypoglycemiaProtocol = true; out.notifyProvider = true; out.recheckMinutes = 15;
        if (v < 54) out.flags.push('LT54_CALL_PROVIDER_NOW');
        if (type === 'T1') {
          const pause = v <= 60 || sym;
          if (pause) { out.insulinUnitsPerHour = 0; out.insulin = T1_PAUSE; }
          else if (opts.effectiveBasal) { out.insulinUnitsPerHour = 0; out.insulin = 'Hypoglycemia rescue now (FSBG 61–69 = low); recheck in 15 min; notify provider. ' + FLOOR_NOT_NEEDED; }
          else { out.insulinUnitsPerHour = 0.5; out.providerRange = [0.5, 1];
            out.insulin = 'Keep the 0.5 units/h type 1 floor AND give the hypoglycemia rescue (FSBG 61–69 = low); recheck in 15 min; notify provider.';
            out.override = 'Clinician override of the CSM chart (CSM: hold), approved by Dr. Carozza 11 Nov 2026.'; }
        } else {
          out.insulinUnitsPerHour = 0;
          out.insulin = v <= 60 ? 'No insulin. Contact provider. Hypoglycemia protocol now; recheck in 15 min.' : 'No insulin (' + (noDrip ? 'no drip' : 'hold') + '). FSBG 61–69 = low: hypoglycemia rescue now; recheck in 15 min; notify provider.';
        }
        if (v >= 61) out.flags.push(F1A ? 'F1A_RESCUE_61_69' : 'F1B_SYMPTOMATIC_RESCUE_61_69');
      } else if (v <= 69) {   // F1 option B, asymptomatic 61–69
        out.notifyProvider = true; out.recheckMinutes = 15; out.flags.push('F1B_NO_D50_ASYMPTOMATIC_61_69');
        out.insulinUnitsPerHour = (type === 'T1' && !opts.effectiveBasal) ? 0.5 : 0;
        out.insulin = 'FSBG 61–69, no symptoms, D5LR running: no D50 (option B). Recheck in 15 min; rescue if ≤60, symptomatic or lower on recheck. Notify provider.' + (out.insulinUnitsPerHour ? ' Type 1 keeps the 0.5 units/h floor.' : '');
        if (out.insulinUnitsPerHour) { out.providerRange = [0.5, 1]; out.override = 'Clinician override of the CSM chart (CSM: hold), approved by Dr. Carozza 11 Nov 2026.'; }
      } else if (b.id === '61-90') {   // 70–90
        if (type === 'T1' && !opts.effectiveBasal) {
          out.insulinUnitsPerHour = 0.5; out.notifyProvider = true; out.providerRange = [0.5, 1];
          out.insulin = 'Type 1 basal floor 0.5 units/h with D5LR 125 mL/h; notify provider. Provider may set 0.5–1 units/h by trend (prevents ketosis; not glucose correction).';
          out.override = 'Clinician override of the CSM chart (CSM: hold), approved by Dr. Carozza 11 Nov 2026.';
        } else if (type === 'T1') { out.insulinUnitsPerHour = 0; out.insulin = FLOOR_NOT_NEEDED; }
        else { out.insulinUnitsPerHour = 0; out.insulin = noDrip ? 'No insulin. Monitor.' : 'Hold insulin (no insulin increase). Continue D5LR 125 mL/h.'; }
      } else {
        out.insulin = 'Regular insulin ' + b.rate + ' units/h (= ' + b.rate + ' mL/h of 100 units/100 mL)';
        if (b.rate === MAX_RATE) { out.notifyProvider = true; out.insulin += '. Maximum rate: persistent or rising values → notify provider for active management; line check; consider DKA screen.'; }
        if (type === 'T1' && b.fluid === LR) { out.flags.push('T1_LR_KETOSIS_WATCH'); out.ketoneWatch = KETONE_WATCH; }
      }
      if (sym && v >= 70) { out.notifyProvider = true; out.flags.push('SYMPTOMS_GE70'); out.insulin += ' Symptoms but FSBG ≥70: repeat POC, send lab glucose, call provider. If you cannot check, treat as low.'; }
      // F4 (Michael decision): diet-controlled GDM and oral-agent patients are not managed with the drip.
      if (noDrip) {
        out.fluid = NDFLUID; out.flags.push('F4_NO_DRIP_SLIDING_SCALE'); out.slidingScale = 'per provider order';
        if (!out.hypoglycemiaProtocol && v >= 70) {
          const act = isActiveLabor(opts); out.activeLabor = act;
          const iv = [act ? 120 : 240], why2 = [];
          if (SW.N5_STEROIDS_NODRIP && opts.steroidsWithin5d) { iv.push(act ? 60 : 120); why2.push(N5_TEXT); out.flags.push('N5_STEROIDS'); }
          if (SW.N6_GLYBURIDE_Q2H && opts.glyburideWithin24h) { iv.push(120); why2.push(N6_TEXT); out.flags.push('N6_GLYBURIDE'); }
          if (opts.slidingScaleGiven) iv.push(60);
          else if (SW.N9_AFTER_SSI_Q2H && opts.afterSlidingScale && (opts.consecutiveInRange || 0) < 2) { iv.push(120); why2.push(N9_TEXT); out.flags.push('N9_AFTER_SSI'); }
          out.insulinUnitsPerHour = 0; out.recheckMinutes = Math.min(...iv);
          out.insulin = 'No insulin drip (' + TYPES[type] + '). Sliding scale insulin as needed, per provider order (no CSM scale in this app; no doses shown). ' + (opts.slidingScaleGiven ? 'Sliding-scale insulin given: recheck FSBG in 1 h.' : 'FSBG ' + (act ? 'every 2 h in active labor' : 'every 4 h until active labor, then every 2 h') + '; recheck in 1 h after any sliding-scale dose.') + (why2.length ? ' ' + why2.join(' ') : '');
          const why = [v > 180 && 'FSBG >180', opts.ketones && 'ketones', opts.ill && 'vomiting/illness'].filter(Boolean);
          if (why.length) { out.notifyProvider = true; out.providerDecides = true; out.insulin += ' ' + N2_TEXT; }
          if (sym) out.insulin += ' Symptoms but FSBG ≥70: repeat POC, send lab glucose, call provider.';
        } else if (out.hypoglycemiaProtocol) { out.insulinUnitsPerHour = 0; out.recheckMinutes = 15; }
        else { out.insulinUnitsPerHour = 0; }
      }
      if (rd.meter === 'HI' && noDrip) out.insulinUnitsPerHour = 0;
      if (rd.meter === 'LO') out.insulin = 'Meter LO: treat as <50. ' + out.insulin + ' Send a lab glucose without delaying rescue.';
      if (rd.meter === 'HI') out.insulin = 'Meter "HI": call provider now, DKA screen, lab glucose (' + (noDrip ? 'no-drip group: no drip unless ordered' : 'drip group: >250 row') + '). ' + out.insulin;
      return Object.freeze(out);
    }
    // F2 + F3: CSM rescue matrix (printed arms, CSM pharmacy D50 resolution, ♦ Doc switches). state: { fsbg, alert (false = questionable consciousness), iv, canSwallow, symptomatic }
    function rescue(state) {
      const v = reading(state.fsbg).value, alert = state.alert !== false, iv = !!state.iv, swallow = !!state.canSwallow, sym = !!state.symptomatic || !alert;  // questionable consciousness counts as symptomatic
      const res = (order, source, extra = {}) => Object.freeze(Object.assign({ order, source, ivAccessNow: !iv, recheckMinutes: 15, notifyProvider: true, callNow: v < 54 || !alert }, extra));
      if (v >= 70) return res(null, 'Doc F3', { note: sym ? 'Symptoms but FSBG ≥70: repeat POC, send lab glucose, call provider. If you cannot check, treat as low.' : 'No rescue: FSBG ≥70.', ivAccessNow: false, recheckMinutes: null, notifyProvider: sym, callNow: false });
      if (!F1A && v >= 61 && !sym) return res(null, 'F1 option B', { note: 'No D50 at asymptomatic 61–69 on D5LR (option B). Recheck in 15 min; rescue if ≤60, symptomatic or lower on recheck.', ivAccessNow: false });
      if (iv) return res(v < 50 ? 'D50 50 mL IV' : 'D50 25 mL IV push', alert ? 'CSM (NPO read as unable to swallow, Doc)' : 'CSM pharmacy resolution 4');
      if (alert && swallow) {
        if (v < 50) return res('Glutose 40% oral gel 30 g buccal', 'CSM');
        if (v < 60) return res('Glutose 40% oral gel 15 g buccal', 'CSM');
        return SW.F3_GEL15_ALERT_NOIV_SWALLOW_60_69 ? res('Glutose 40% oral gel 15 g buccal', 'Michael-approved addition (pending CSM pharmacy build)', { pending: !DEC.F3_GEL15_ALERT_NOIV_SWALLOW_60_69 })
          : res('Glucagon (GlucaGen) 1 mg IM, ONCE', 'CSM printed arm read literally (switch OFF)', { once: true });
      }
      if (alert) return res('Glucagon (GlucaGen) 1 mg IM, ONCE', 'CSM', { once: true });
      if (v < 60) return res('Glucagon (GlucaGen) 1 mg IM, ONCE', 'CSM', { once: true });
      return SW.F3_GLUCAGON_QC_NOIV_60_69 ? res('Glucagon (GlucaGen) 1 mg IM, ONCE', 'Michael-approved addition (pending CSM pharmacy build)', { once: true, pending: !DEC.F3_GLUCAGON_QC_NOIV_60_69 })
        : res(null, 'No printed CSM order (switch OFF)', { note: 'No printed order: call provider / rapid response now; get IV access for D50.' });
    }
    function d50QuestionableConsciousness(fsbg) { const v = reading(fsbg).value; return v < 50 ? 'D50 50 mL IV' : v <= 69 ? 'D50 25 mL IV' : null; }
    // ---- Display text (diagram, text companion, ANT-05). All wording lives here. ----
    const p3a = PEND('F3_GEL15_ALERT_NOIV_SWALLOW_60_69'), p3b = PEND('F3_GLUCAGON_QC_NOIV_60_69');
    const RESCUE = Object.freeze([
      { order: 'D50 50 mL IV', when: 'FSBG <50 with IV access: alert and NPO or unable to swallow (NPO = unable to swallow), OR questionable consciousness (CSM; pharmacy).' },
      { order: 'D50 25 mL IV push', when: 'FSBG 50–69 with IV access: alert and NPO or unable to swallow, OR questionable consciousness (CSM; pharmacy).' },
      { order: 'Glutose 40% gel 30 g / 15 g buccal', when: 'ALERT, no IV, can swallow safely: 30 g if <50; 15 g if 50–59 (CSM).' + (SW.F3_GEL15_ALERT_NOIV_SWALLOW_60_69 ? ' 15 g also at 60–69 (Michael-approved addition; pending CSM pharmacy build).' + p3a : ' 60–69: printed glucagon arm stands.') },
      { order: 'Glucagon (GlucaGen) 1 mg IM, ONCE', when: 'Only if ALERT AND no IV AND cannot swallow, FSBG <70; OR questionable consciousness, no IV, FSBG <60 (CSM).' + (SW.F3_GLUCAGON_QC_NOIV_60_69 ? ' Also questionable consciousness, no IV, 60–69 (Michael-approved addition; pending CSM pharmacy build).' + p3b : ' Questionable consciousness, no IV, 60–69: no printed order; call provider / rapid response.') },
      { order: 'No IV in any rescue', when: 'Get IV access now (urgent provider / rapid-response call if consciousness is impaired).' }
    ].map(Object.freeze));
    const RESCUE_AFTER = Object.freeze([
      'Recheck FSBG in 15 minutes. Still <70: repeat D50 or gel per the matching row. Glucagon is ONCE only: if still <70 15 minutes after glucagon, get IV access for D50 and call the provider / rapid response. Notify the provider after every rescue.',
      'Below 54 or any symptoms: rescue and call the provider immediately.',
      'Symptoms but FSBG ≥70: repeat POC, send lab glucose, call provider. If you cannot check, treat as low.',
      'D10 is not in the CSM protocol: not used here. D50 is a vesicant: patent vein, then flush. D5LR continues during rescue.',
      'GDM/type 2: hold IV insulin during rescue and restart per the nomogram row. Type 1: ' + RESUME + '.'
    ]);
    const MONITORING = Object.freeze([
      'FSBG before starting IV fluids.',
      'Insulin drip running: FSBG every 1 hour, regardless of dilation (Michael override of CSM q2h latent; ACOG PB 201).',
      'Insulin-requiring, drip not yet running: every 2 hours in latent labor or NPO before delivery; every 1 hour at 4–6 cm or with regular contractions (CSM).',
      'Diet-controlled GDM or oral agents only (no drip): every 4 hours until active labor, then every 2 hours; recheck 1 hour after any sliding-scale dose (Michael decision 11 Nov 2026). ' + ACTIVE_DEF + PEND('N4_ACTIVE_LABOR'),
      'After any hypoglycemia rescue: recheck in 15 minutes (go-live resolution 2).',
      'Hospital point-of-care glucose for insulin decisions; CGM for trends/alarms only.'
    ]);
    const F1_TEXT = F1A ? 'Any FSBG below 70, or symptoms at any value: hypoglycemia rescue now (rescue box). 61–90 means "no insulin increase," not "no action."'
      : 'FSBG ≤60, or symptoms at any value: hypoglycemia rescue now. 61–69 without symptoms on D5LR: no D50 (option B); recheck in 15 min; rescue if ≤60, symptomatic or lower. 61–90 means "no insulin increase," not "no action."';
    const F4_TEXT = 'Diet-controlled GDM (A1) and anyone on oral agents ONLY (no home insulin): NO insulin drip. Any home insulin (with or without metformin/glyburide): drip group. Sliding scale insulin as needed, per provider order (no CSM scale in this app; no doses shown). FSBG every 4 h until active labor, then every 2 h; recheck 1 h after any sliding-scale dose. ' + ACTIVE_DEF + PEND('N4_ACTIVE_LABOR') + ' ' + N2_TEXT + ' Low (<70): rescue box.'
      + (SW.N5_STEROIDS_NODRIP ? ' ' + N5_TEXT + PEND('N5_STEROIDS_NODRIP') : '') + (SW.N6_GLYBURIDE_Q2H ? ' ' + N6_TEXT + PEND('N6_GLYBURIDE_Q2H') : '') + (SW.N9_AFTER_SSI_Q2H ? ' ' + N9_TEXT + PEND('N9_AFTER_SSI_Q2H') : '')
      + ' The drip is for insulin-requiring patients: A2 on insulin, type 2 on insulin, type 1 (Michael decision 11 Nov 2026).';
    const TEXT = Object.freeze({
      title: 'Diabetes in labor: insulin and IV fluids',
      step0: 'Diabetes (GDM A1/A2, type 2, type 1) admitted for labor, induction or scheduled cesarean. Unsure of type AND on home insulin, insulin pump, or prior DKA: treat as type 1 for basal (never a basal gap) and get senior/endocrine review now. Not on any insulin and no DKA history: diet/oral rule (no drip).',
      step1: 'Stop all insulin, including SC insulin pumps (unless a signed CSM exception), and oral agents. NPO except 8 oz ice chips every 4 hours. POC glucose; BMP and urine ketones if FSBG >160. Type 1: start the IV floor before stopping SC/pump, or keep the glargine/detemir already given; never a gap. Night-before/morning home doses and steroid adjustment: per the CSM provider/pharmacy order set (this app gives no home doses).',
      setup: 'Regular insulin (Myxredlin) 100 units/100 mL, so units/h = mL/h; range 0.5–5 units/h. PE-lined tubing: fill with insulin, wait 20 minutes, then flush. Smart pump, dedicated line, independent double-check. High-alert medication. The CSM protocol runs on a provider order.',
      step2: 'CSM nomogram; maintenance fluid 125 mL/h. FSBG is read as a whole number in mg/dL. If a value has a decimal, round DOWN (60.5 → 60). 60 is the ≤60 row; 90 holds; 91 starts 0.5 units/h; 120 stays on D5LR; 121 switches to LR. Meter "LO": rescue now. Meter "HI": call provider now, DKA screen, lab glucose (drip group: >250 row; no-drip group: no drip unless ordered). No bolus. Maximum 5 units/h. Never use this chart to treat DKA.',
      f1: F1_TEXT + PEND('F1_LOW_61_69'),
      f4: F4_TEXT,
      t1: 'At 70–90 the floor is 0.5 units/h with D5LR 125 mL/h and provider notification; the provider may set 0.5–1 units/h by trend (prevents ketosis; not glucose correction). Clinician override of the CSM chart (CSM: hold), approved by Dr. Carozza 11 Nov 2026. ' +
        (F1A ? '61–69: keep the floor AND give the hypoglycemia rescue; recheck in 15 min. ' : '61–69 without symptoms: keep the floor; recheck in 15 min (option B). ') +
        'The IV floor is not needed only if effective long-acting SC basal (glargine/detemir given within its duration) is on board, or a pump is continued under a signed CSM exception. Otherwise the pump stops only after the IV floor is running. Do not stack. ' +
        'Type 1 insulin stops only for FSBG ≤60 or symptoms, as an emergency pause: dextrose continues, rescue, recheck in 15 minutes, ' + RESUME + '; a pause of about 1 hour or longer needs provider review.',
      ketones: KETONE_WATCH,
      dka: 'Pregnancy DKA can occur below 200 mg/dL; there is no glucose gate for ketone testing when ill. Check beta-hydroxybutyrate, VBG, electrolytes/K+, creatinine and anion gap; maternal assessment and fetal monitoring. Use the CSM DKA order set, not this chart. Reference only, per CSM DKA order set: insulin 0.1 units/kg/h once K+ is safe. Type 1 on plain LR with positive ketones comes here; no ad hoc dextrose. Delivery is not DKA treatment.',
      after: 'Notify the provider when delivery is complete to start the CSM Postpartum Diabetes Management Order Set (doses there). GDM: stop insulin at placenta; 75-g 2-hour OGTT at 4–12 weeks postpartum. Type 1: basal always covered. Continue IV insulin 1–2 hours after the first SC basal dose; then stop D5LR and insulin together.',
      newborn: 'Tell the nursery the diabetes type, treatment, last maternal glucose and steroids. Stable baby: feed within 1 hour of birth; the nursery team owns the neonatal glucose protocol.',
      steroidsShort: 'Steroids raise glucose up to 5 days: more FSBG checks; follow the nomogram. SMFM #58: no late-preterm (34+0–36+6) steroids in pregestational diabetes. Timing and EFW ≥4,500 g counseling: Diabetes in pregnancy card.',
      notify: 'RN to OBHG hospitalist: any FSBG <70 or any rescue; 61–90 on a type 1 floor; 5 units/h with rising values; ketones; any gap in type 1 basal' + '; diet/oral group: >180, ketones or illness.',
      verify: 'Doses to be checked against CSM pharmacy build. Decision support only, not orders or unit policy.',
      ant05Target: 'Labor, induction or scheduled cesarean: use the intrapartum algorithm. CSM chart: no insulin at 61–90 mg/dL (type 1 keeps a 0.5 units/h floor); below 70 = low, rescue per the CSM hypoglycemia protocol' + (F1A ? '' : ' (61–69 without symptoms on D5LR: recheck in 15 min, option B)') + '. The CSM nomogram sets the insulin rate and D5LR or LR by each FSBG; hourly FSBG while the drip runs; type 1 never goes without basal. (National reference: ACOG PB 201 labor target 70–110.)' + PEND('F1_LOW_61_69'),
      ant05Steroids: 'Steroids: do not withhold indicated steroids solely for hyperglycemia. After betamethasone, glucose rises within about 12 h and can stay high up to 5 days: increase FSBG checks (at least 72 h, longer if still high), insulin changes per the CSM provider/pharmacy order set, and in labor follow the nomogram (higher rates expected; no bolus). Patients without diabetes: check FSBG if symptomatic or per provider. SMFM Consult #58: no late-preterm (34+0–36+6) steroids in pregestational diabetes (ANT-06).',
      ant05NoDrip: 'Diet-controlled GDM (A1) or oral agents ONLY (no home insulin): no insulin drip; sliding scale insulin as needed per provider order; FSBG every 4 h until active labor, then every 2 h; recheck 1 h after any sliding-scale dose. ' + ACTIVE_DEF + ' Any home insulin (with or without metformin/glyburide): drip group. ' + N2_TEXT,
      ant05Button: 'Open: Diabetes in labor: insulin and IV fluids'
    });
    // Table cells shown on the diagram and text companion.
    function cells(b) {
      const g = action('A2', b.lo === -Infinity ? 60 : b.lo), t = action('T1', b.lo === -Infinity ? 60 : b.lo);
      if (b.id === 'le60') return { gdm: 'No insulin. Contact provider. Hypoglycemia rescue now; recheck 15 min.', t1: 'Emergency pause (dextrose continues); ' + RESUME + '.', fluid: 'D5LR' };
      if (b.id === '61-90') return { gdm: F1A ? 'Hold insulin (no added insulin). 61–69: hypoglycemia rescue now, recheck in 15 min, notify provider.' : 'Hold insulin (no added insulin). 61–69 no symptoms: no D50, recheck 15 min, notify (option B).',
        t1: '0.5 units/h floor (provider may set 0.5–1) + notify provider. ' + (F1A ? '61–69: keep the floor AND give the hypoglycemia rescue; recheck in 15 min.' : '61–69 no symptoms: keep the floor; recheck 15 min.') + ' Clinician override of the CSM chart (CSM: hold).', fluid: 'D5LR' };
      return { gdm: g.insulinUnitsPerHour + ' units/h' + (b.rate === MAX_RATE ? ' (maximum; notify provider)' : ''), t1: t.insulinUnitsPerHour + ' units/h' + (b.fluid === LR ? '; ketones at LR start, then q4h (Doc proposal)' : ''), fluid: b.fluid.split(' ')[0] };
    }
    function table() { return BANDS.map(b => ({ band: b, cells: cells(b), byType: Object.fromEntries(Object.keys(TYPES).map(t => [t, action(t, b.lo === -Infinity ? 60 : b.lo, {})])) })); }
    return Object.freeze({ ID: 'ALG-DM-INTRAPARTUM', VERSION: '2026-11-11-docfix', SWITCHES: SW, DECIDED: DEC, TYPES, BANDS, MAX_RATE, reading, band, action, rescue, isActiveLabor, RESCUE, RESCUE_AFTER,
      d50QuestionableConsciousness, MONITORING, TEXT, cells, table, create });
  }
  const api = create();
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DMIntrapartum = api;
})(typeof self !== 'undefined' ? self : this);
