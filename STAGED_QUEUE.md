# Local staging: guideline queue 19 Nov 2026

Local worktree only: `/workspace/obhg-triage-queue-2026-11-19`, branch `queue-2026-11-19`, from live main `86f7957` (`v40-2026-11-16-stimulant`). **Nothing was pushed.** This is not a live release.

Drafts: `/workspace/grok-obgyn/cards/drafts/queue-2026-11-19/`. Line numbers in those drafts were checked against the current app copy of each card (the QR 11-09 markdown and some standalone card files have drifted; app HTML is the staged target). Pending house questions were left unchanged, and nothing in the card text assumes an answer.

Cache (local only): `obhg-triage-v41-2026-11-19-queue` in `sw.js` (`const CACHE`, line 19).

Source cards live in `js/content.js` (single-line JSON; items below are the stable refs). No names, “reviewed by,” or draft stamps were added to card text. New wording uses guideline names, not card codes.

---

## Item 8 — Late-preterm antenatal corticosteroids (ANT-06, ANT-10)

**Applied**
- Late-preterm line limited to a singleton with no prior course, birth likely within 7 days and before 37+0, not with clinical chorioamnionitis, and no tocolysis to buy time. Neonatal hypoglycemia warning kept; tell the neonatal team.
- New line: not studied in late preterm, so not routine for multiples or a prior course.
- New counseling/documentation line (short-term respiratory benefit ~1 in 35; long-term effects uncertain).
- Bottom line: “Late preterm: singleton, never dosed, no chorioamnionitis, after counseling.”
- Indicated late-preterm / early-term delivery (ANT-10): anticipated late-preterm course only if she is a singleton who has never had ACS and has no chorioamnionitis.

**Pending (pregestational diabetes wording: shared decision vs do not give)**
- ANT-06 does **not** add “pregestational diabetes: not routine; shared decision only.”
- Diabetes in pregnancy (ANT-05) left as-is, including the live SMFM Consult #58 line against late-preterm steroids in pregestational diabetes.
- ANT-10 does **not** add “Not routine with pregestational diabetes.”

**Refs:** `js/content.js` items `ANT-06`, `ANT-10`. ANT-05 unchanged.

---

## Item 2 — Arrest-of-dilation box (First and second stage labor)

**Applied (all of it; no open question)**
- The two arrest lines are now a checkbox box: ≥6 cm, membranes ruptured, oxytocin running, 4 h adequate (>200 MVU on IUPC) or 6 h inadequate, and “adequacy measured, not guessed” (place an IUPC when active labor is protracted or external monitoring is unreliable).
- The live “If there is no IUPC, use clinical adequacy and time” line is gone (Clinical Practice Guideline 8 recommends an IUPC).
- Cesarean is recommended when every box is met, with a documentation list. Tagged as a conditional ACOG suggestion on low-quality evidence.
- Cross-reference to Cervical ripening / 12–18 h of oxytocin after ROM in latent phase, so the box is not used before 6 cm.
- Bottom line: “6 cm + ROM + oxytocin opens the arrest clock. 4 hours adequate (IUPC) / 6 hours inadequate…”

**Pending:** none.

**Refs:** `js/content.js` item `LND-02`.

---

## Item 10 — Cerclage (Clinical Practice Guideline 12)

**Applied**
- Exam-indicated: peri-procedure indomethacin + cefazolin “prolongs pregnancy; no proven neonatal benefit,” plus counseling that ≥2 cm dilation at placement is linked to earlier birth (median 27 vs 35.6 w in one study). Window wording was **not** changed.
- Transabdominal: “Minimally invasive (laparoscopic) when available.”
- Do not stitch: “Cervical pessary is not an alternative to cerclage.”
- New “After the stitch” block: no routine serial cervical-length scans; adding vaginal progesterone is not the default.
- Bottom line adds “not a pessary” and “Once placed, stop measuring.” The live “CL <25 mm” wording is kept (no “by 24 0/7”).

**Pending (24w0d hard stop vs ≤24 0/7)**
- Ultrasound-indicated line still reads “CL <25 mm at 16–24w.”
- Did not add “No ultrasound-indicated cerclage after 24 0/7.”
- Did not add “generally up to and including 24 0/7” on the exam-indicated line.

**Refs:** `js/content.js` item `ANT-03`.

---

## Item 6 — Older-mother delivery timing

**Applied:** nothing.

**Pending (age 40+ vs 35+):** the whole timing-row and surveillance-line change is held. No rows on Indicated late-preterm / early-term delivery (ANT-10). No maternal-age line on Outpatient antenatal surveillance (ANT-09). No Obstetric Care Consensus 11 reference added.

**Refs:** ANT-09 and ANT-10 timing table unchanged for this item. ANT-10 still has “cHTN controlled, no meds 38+0–39+6.”

---

## Item 5 — Chronic hypertension antepartum discharge (Gestational HTN / preeclampsia)

**Applied (checklist parts that do not answer the open questions)**
- New “Chronic HTN: antepartum discharge checklist” before the severe-range BP pearl: exclude superimposed preeclampsia with severe features; labs; treat/titrate at ≥140/90 (CHAP) with labetalol or nifedipine; fetus reassuring; outpatient bundle for superimposed preeclampsia without severe features (deliver at 37+0); home BP cuff and log; follow-up within 1 week (3–5 days after severe-range BP); weekly testing from 32+0 if on medication; continue aspirin 81 mg. Observation is left as “a period of observation” (no hour count).
- Pharmacy line included.
- Bottom line append: “exclude severe features, control at <140/90, give her a cuff, and see her within a week.”

**Pending**
- Observation duration before discharge after severe-range BP that needed acute treatment: not specified.
- Home blood-pressure call thresholds (≥160/110 come in now; ≥140/90 on 2 readings 4 h apart call for titration): omitted. Cuff and log only.
- Unmedicated chronic HTN 38+0 vs 37w0d–39w6d: the delivery-timing table was not changed, and the draft’s “Delivery plan (house): chronic HTN on medication 37+0–39+6” line was not added, so the card does not presume an answer.

**Refs:** `js/content.js` item `ANT-04`. Timing table remains on ANT-10.

---

## Item 3 — Post-cesarean nausea / vomiting rescue ladder (Formulary)

**Applied**
- New Formulary subsection after the NVP/HG dehydrated line: Step 0 (rule out a cause), Step 1 (different class, no same-class repeat within 6 h), Step 2 (one dopamine antagonist), Step 3 (promethazine), Step 4 (ondansetron after 6 h), Step 5 (scopolamine; do not re-dose dexamethasone), still-vomiting workup (change opioids; ileus/obstruction pathway), breastfeeding compatibility, pharmacy line.

**Pending (who orders rescue for neuraxial-morphine nausea)**
- The “call anesthesia (neuraxial-morphine options; low-dose haloperidol or droperidol…)” clause was not added.

**Not applicable in the app:** there is no Page 2 index card, so the draft index row was not staged.

**Refs:** `js/content.js` item `FORMULARY`.

---

## Item 1 — STIs on labor and delivery, discordant syphilis serology

**Applied**
- Generic second-method treponemal (TP-PA) step: call the lab; ask which assay, the immunoassay index, and how to add a different-method test to the same specimen; do not delay treatment of undocumented seropositive pregnancy.
- Isolated EIA/CIA+ branch: CDC 2024 pregnancy data (~half seroreverted within 12 months); ask for the S/CO index.
- New RPR/VDRL reactive / treponemal nonreactive (biologic false positive) branch.
- Seroreversion parenthetical upgraded to the cited CDC 2024 statement (15–25% after treated primary syphilis; not after later stages; can occur with advanced HIV; no EIA/CIA data).
- Uncertain-points item and the CDC 2024 source line updated (full text read 19 Nov 2026).

**Pending (CSM TP-PA ordering workaround):** no “At CSM: …” line.

**Refs:** `js/content.js` item `ANT-STI`.

---

## Item 9 — UTI / pyelonephritis, Clinical Consensus No. 4 re-verify

**Applied (all of it; no open question).** Live app wording had already moved off the draft’s “HOUSE RULE (Michael …)” lines (names were stripped earlier), so the edits were applied to the current house-practice text.
- Test of cure: Clinical Consensus No. 4 “may consider” a repeat culture at 1–2 weeks, or only if symptoms recur; house makes that option routine. IDSA 2019 still finds insufficient evidence for repeat screening.
- Nitrofurantoin and fosfomycin: not when cystitis vs pyelonephritis is uncertain.
- Amoxicillin/ampicillin: avoid before culture results because of E. coli resistance (Clinical Consensus No. 4), culture-directed only — both the rule line and the dose-table lead-in.
- New uncertain-points line: what was verified verbatim vs still secondary-only (dose table, monthly cultures on suppression, postpartum continuation of suppression).
- Source line expanded with the 19 Nov 2026 verification note.

**Pending:** none.

**Refs:** `js/content.js` item `ANT-UTI`.

---

## Item 4 — Trauma in pregnancy, ≥4 h monitoring and ROM check

**Applied**
- Viable-gestation monitoring: “at least 4 h from the time of injury.” The viability threshold is unchanged: “≥22–24 wk per local viability policy.”
- 24-h extension triggers add significant abdominal pain and fibrinogen <200 mg/dL.
- Workup: explicit ROM check before discharge on every viable-gestation trauma (history, sterile speculum, nitrazine/fern or house ROM test); ROM = 24-h observation/admit.
- Home: ≥4 h of reassuring monitoring from the time of injury, ROM excluded; obstetric ultrasound before discharge if monitored >4 h.
- Delayed-presentation line: “the ≥4 h rule is timed from injury.”
- SOGC page range corrected to 553–574. Evidence line now states SOGC ≥4 h at ≥23 wk, EAST ≥6 h at >20 wk, house ≥4 h.
- Same clinical strings and delayed-presentation line applied on the trauma algorithm (the current app is the successor of the v31 trauma copy). Cue labels on the algorithm (“4 hour monitoring cue,” “Start 4 h cue”) and `js/flow-cues.js` (“Past the 4 h monitoring window”) were aligned so the board no longer says 4–6 h for this window. The 4 h / 6 h countdown remaining in the cue timer is unchanged (EAST’s 6 h is still visible as a later cue only).
- Discharge instruction “contractions or tightening (≥4–6/hour)” was left alone (contraction frequency, not the monitoring window).

**Pending (GA threshold for starting monitoring):** keep “22–24 wk per local policy.” No CSM-only number (SOGC 23 / EAST 20) was set.

**Refs:** `js/content.js` items `ANT-TRAUMA`, `FD-ANT-TRAUMA`; `js/flow-cues.js` (past-window string).

---

## Verification (local only)

- Served at `http://127.0.0.1:8891/` with `python3 -m http.server` (not the deploy script).
- Headless Chromium (Playwright) opened Browse Guidelines and each changed card: LND-02, ANT-03, ANT-04, ANT-05 (unchanged control), ANT-06, ANT-10, FORMULARY, ANT-TRAUMA, FD-ANT-TRAUMA, ANT-STI, ANT-UTI. Expected new wording was present; no JavaScript `console.error` or page errors. The only console warning was goatcounter skipping localhost.
- Service worker cache name after install/reload: `obhg-triage-v41-2026-11-19-queue`.
- `npm test` passed, including trauma/UTI routing tests (assertions updated to the new CC4 test-of-cure wording and ≥4 h monitoring text) and regression: 75/78 decisions identical to the historical baseline; the same three expected routing exceptions as before (trauma, UTI, SYS-03 flank alternate). Full byte-identical engine output is skipped when a staged card is in the result, because card HTML changed.

---

## Diff stat (against 86f7957, local branch only)

```
 js/content.js                      | 2 +-
 js/flow-cues.js                    | 2 +-
 sw.js                              | 4 ++--
 tests/dm_titles.test.cjs           | 2 +-
 tests/fixes-smoke.cjs              | 2 +-
 tests/fixes.test.cjs               | 2 +-
 tests/nurse/nurse_en_browser.js    | 2 +-
 tests/nurse/nurse_en_only.js       | 2 +-
 tests/regression.cjs               | 2 +-
 tests/smoke.cjs                    | 2 +-
 tests/start/start_browser.js       | 2 +-
 tests/start/start_routing.test.cjs | 2 +-
 tests/sud_routing.test.cjs         | 2 +-
 tests/trauma_sti_flows.test.cjs    | 8 ++++----
 tests/uti_routing.test.cjs         | 5 +++--
 15 files changed, 21 insertions(+), 20 deletions(-)
```

`js/content.js` is a single-line JSON file, so the stat undercounts the clinical edits. STAGED_QUEUE.md is added in the same local commit.

Not pushed to `github` (`mcarozzamd/obhg-triage`) or any other remote. `/workspace/obhg-triage-app-deploy.sh` was not run.
