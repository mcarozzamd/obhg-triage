# Local staging: guideline queue 19 Nov 2026

Local worktree only: `/workspace/obhg-triage-queue-2026-11-19`, branch `queue-2026-11-19`, from live main `86f7957` (`v40-2026-11-16-stimulant`). **Nothing was pushed.** This is not a live release.

First local commit: `723b413` (non-pending queue text only). This file now describes the follow-up local commit that applies Michael's answers.

Drafts: `/workspace/grok-obgyn/cards/drafts/queue-2026-11-19/` (Doc updated items 1, 6 and 8 at 07:46–07:47 CT; card text follows those files). Cache remains `obhg-triage-v41-2026-11-19-queue` in `sw.js` (`const CACHE`, line 19).

No names, “reviewed by,” or draft stamps in card text. New wording uses guideline names, not card codes.

---

## Item 8 — Late-preterm antenatal corticosteroids (ANT-06, ANT-10, ANT-05)

**Applied (including Michael's 07:46 CT diabetes decision, using Doc's draft wording)**
- ALPS limits, counseling, and matching ANT-10 singleton/no-chorio line (from the first commit) remain.
- New pregestational-diabetes line on ANT-06, from Doc's draft: “Pregestational diabetes at 34+0–36+6: relative contraindication — not routine; shared decision only. ACOG: may not be appropriate in pregestational diabetes (neonatal hypoglycemia, maternal hyperglycemia); SMFM advises against; ALPS excluded these patients. If given: notify neonatology, intensify maternal glucose monitoring/insulin adjustment, and neonatal glucose checks.”
- ANT-06 bottom line now includes “Pregestational diabetes: relative contraindication, shared decision, not routine.”
- ANT-10: “Not routine with pregestational diabetes (see Antenatal corticosteroids).”
- **ANT-05 was aligned.** The live line “SMFM Consult #58: no late-preterm (34+0–36+6) steroids in pregestational diabetes (ANT-06)” was replaced with Doc's shared-decision wording above (card code ANT-06 removed). The leading “do not withhold indicated steroids solely for hyperglycemia” sentence is unchanged and still applies to indicated steroids, including before 34 weeks.
- The same conflict was also on the Diabetes in labor algorithm (`FD-ANT-05`) and in `js/dm-intrapartum.js` (`steroidsShort` and `ant05Steroids`). Those “do not give” SMFM lines were aligned to the shared-decision wording and now point to the Diabetes in pregnancy card, not a card code.

**Pending:** none.

**Refs:** `js/content.js` items `ANT-06`, `ANT-10`, `ANT-05`, `FD-ANT-05`; `js/dm-intrapartum.js`.

---

## Item 2 — Arrest-of-dilation box (First and second stage labor)

**Applied (all of it, first commit).** Nothing further in this commit.

**Refs:** `js/content.js` item `LND-02`.

---

## Item 10 — Cerclage (Clinical Practice Guideline 12)

**Applied (Michael: go ahead with 24.0; wording corrected to match CPG 12, which includes 24 0/7)**
- Ultrasound-indicated window is now “16 0/7 up to and including 24 0/7 (hard stop; not after 24 0/7).”
- Exam-indicated: “generally up to and including 24 0/7; hard stop; not after 24 0/7.”
- History-indicated cervical-length watch window updated to the same “16 0/7 up to and including 24 0/7.”
- Bottom line: “CL <25 mm up to and including 24 0/7.”
- Does **not** say “at or after 24w0d.” Placement at exactly 24 0/7 is allowed; placement after 24 0/7 is not.
- Earlier additions remain: pessary is not an alternative, no routine post-stitch CL scans, progesterone not the default, laparoscopic transabdominal when available.

**Pending:** none.

**Refs:** `js/content.js` item `ANT-03`.

---

## Item 6 — Older-mother delivery timing (ANT-10, ANT-09)

**Applied (house threshold age ≥35, using Doc's 07:47 CT card text, with guideline names)**
- ANT-10 new row after Prior stillbirth: “Maternal age ≥35 at delivery, well dated, no other indication | 39+0–39+6 (house practice). Guideline basis: Obstetric Care Consensus 11 (≥40); ARRIVE and the 35/39 trial support a 39-week induction offer at 35–39. Age alone is not a cesarean indication.”
- ANT-09: 35–39 alone does not trigger routine testing (Committee Opinion 828); offer surveillance at ≥40 (Obstetric Care Consensus 11); plan delivery at 39+0–39+6 for maternal age ≥35 (house practice; see Indicated late-preterm / early-term delivery).
- House threshold of 35 is broader than Obstetric Care Consensus 11's ≥40; that divergence is not written as a draft stamp on the card, but the guideline basis is cited on the row.

**Pending:** none.

**Refs:** `js/content.js` items `ANT-10`, `ANT-09`.

---

## Item 5 — Chronic hypertension antepartum discharge (ANT-04, ANT-10 timing table)

**Applied**
- Checklist already present (first commit). Observation is now specified: “at least 1 hour before discharge, and at least 1 hour after any medication change,” both in the severe-features item and as its own checklist line.
- Delivery plan added: “chronic HTN 37+0–39+6; earlier for superimposed preeclampsia per the table.”
- ANT-10 unmedicated row changed from **38+0–39+6 to 37+0–39+6**, so it matches the medicated row and the house rule. 38+0 was not kept for unmedicated chronic HTN.

**Pending**
- Home blood-pressure call thresholds (≥160/110 come in now; ≥140/90 on 2 readings 4 h apart call for titration) are still omitted. The card has “Home BP cuff and log” only.

**Refs:** `js/content.js` items `ANT-04`, `ANT-10`.

---

## Item 3 — Post-cesarean nausea / vomiting rescue ladder (Formulary)

**Applied**, including Michael's anesthesia answer:
- New line: “Rescue for nausea from neuraxial morphine: call anesthesia (anesthesia orders rescue).”

**Pending:** none.

**Refs:** `js/content.js` item `FORMULARY`.

---

## Item 1 — STIs on labor and delivery, discordant syphilis serology

**Applied**, including Michael's TP-PA answer (Doc's 07:47 CT card text):
- After the generic call-the-lab step: “CSM: order the confirmatory treponemal test (e.g., TP-PA) by calling the lab.”
- BFP and isolated CIA+ branches, CDC 2024 seroreversion and source updates remain from the first commit.

**Pending:** none.

**Refs:** `js/content.js` item `ANT-STI`.

---

## Item 9 — UTI / pyelonephritis, Clinical Consensus No. 4 re-verify

**Applied in full in the first commit.** Nothing further.

**Refs:** `js/content.js` item `ANT-UTI`.

---

## Item 4 — Trauma in pregnancy

**Applied**
- ≥4 h from injury, ROM check, fibrinogen <200, ultrasound if monitored >4 h, SOGC page correction, delayed-presentation line (first commit).
- Viability phrasing updated to the exact wording “22–24 wk or per local policy” on ANT-TRAUMA (viable and previable lines) and on FD-ANT-TRAUMA (“Viability cutoff: 22–24 wk or per local policy.”).

**Pending:** none.

**Refs:** `js/content.js` items `ANT-TRAUMA`, `FD-ANT-TRAUMA`; `js/flow-cues.js`.

---

## Still pending (only)

- Chronic HTN **home blood-pressure call thresholds** on ANT-04.

---

## Verification (local only)

- Served at `http://127.0.0.1:8891/` with `python3 -m http.server` (not the deploy script).
- Playwright (headless Chromium) re-checked 12 cards after the answers were applied (LND-02, ANT-03, ANT-04, ANT-05, ANT-06, ANT-09, ANT-10, FORMULARY, ANT-TRAUMA, FD-ANT-TRAUMA, ANT-STI, ANT-UTI): all 12 passed. Expected wording was present; no “Michael,” “reviewed by,” “DRAFT,” or “at or after 24w0d.” The only console messages were goatcounter localhost warnings. Service worker cache remains `obhg-triage-v41-2026-11-19-queue`.
- `npm test` passed: unit tests, `verify_display_images.py`, and `regression.cjs`. Decisions identical 75/78 (same three expected routing exceptions as live: ANT-05-related, ANT-TRAUMA, ANT-UTI). Full byte-identical JSON compare is skipped for this staging set, now including ANT-09 and FD-ANT-05.

---

## Remotes

Not pushed to `github` (`mcarozzamd/obhg-triage`) or any other remote. `/workspace/obhg-triage-app-deploy.sh` was not run.
